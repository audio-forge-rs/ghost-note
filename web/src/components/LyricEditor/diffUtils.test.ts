/**
 * Tests for diffUtils
 */

import { describe, it, expect } from 'vitest';
import {
  computeDiff,
  computeLineDiff,
  splitIntoLines,
  getDiffSummary,
  applyChanges,
  countWords,
  countLines,
  createPreview,
} from './diffUtils';

describe('diffUtils', () => {
  describe('computeDiff', () => {
    it('returns identical result for same texts', () => {
      const result = computeDiff('hello world', 'hello world');

      expect(result.isIdentical).toBe(true);
      expect(result.addCount).toBe(0);
      expect(result.removeCount).toBe(0);
      expect(result.changes).toHaveLength(1);
      expect(result.changes[0].type).toBe('equal');
    });

    it('detects additions', () => {
      const result = computeDiff('hello', 'hello world');

      expect(result.isIdentical).toBe(false);
      expect(result.addCount).toBeGreaterThan(0);
    });

    it('detects removals', () => {
      const result = computeDiff('hello world', 'hello');

      expect(result.isIdentical).toBe(false);
      expect(result.removeCount).toBeGreaterThan(0);
    });

    it('detects modifications', () => {
      const result = computeDiff('The quick brown fox', 'The slow brown fox');

      expect(result.isIdentical).toBe(false);
      // Should have removal of "quick" and addition of "slow"
      const hasRemove = result.changes.some((c) => c.type === 'remove');
      const hasAdd = result.changes.some((c) => c.type === 'add');
      expect(hasRemove).toBe(true);
      expect(hasAdd).toBe(true);
    });

    it('handles empty strings', () => {
      const result = computeDiff('', '');

      expect(result.isIdentical).toBe(true);
      expect(result.changes).toHaveLength(1);
    });

    it('handles empty to non-empty', () => {
      const result = computeDiff('', 'hello');

      expect(result.isIdentical).toBe(false);
      expect(result.addCount).toBe(1);
    });

    it('handles non-empty to empty', () => {
      const result = computeDiff('hello', '');

      expect(result.isIdentical).toBe(false);
      expect(result.removeCount).toBe(1);
    });

    it('handles multiline text', () => {
      const original = 'Line 1\nLine 2\nLine 3';
      const modified = 'Line 1\nLine 2 changed\nLine 3';

      const result = computeDiff(original, modified);

      expect(result.isIdentical).toBe(false);
    });

    it('assigns correct positions to changes', () => {
      const result = computeDiff('ab', 'abc');

      // All changes should have valid positions
      for (const change of result.changes) {
        expect(typeof change.position).toBe('number');
        expect(change.position).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('computeLineDiff', () => {
    it('returns identical result for same texts', () => {
      const result = computeLineDiff('hello\nworld', 'hello\nworld');

      expect(result.isIdentical).toBe(true);
    });

    it('detects line additions', () => {
      const result = computeLineDiff('line 1', 'line 1\nline 2');

      expect(result.isIdentical).toBe(false);
      expect(result.addCount).toBeGreaterThan(0);
    });

    it('detects line removals', () => {
      const result = computeLineDiff('line 1\nline 2', 'line 1');

      expect(result.isIdentical).toBe(false);
      expect(result.removeCount).toBeGreaterThan(0);
    });

    it('handles empty strings', () => {
      const result = computeLineDiff('', '');

      expect(result.isIdentical).toBe(true);
    });
  });

  describe('splitIntoLines', () => {
    it('returns empty array for empty string', () => {
      expect(splitIntoLines('')).toEqual([]);
    });

    it('splits text on newlines preserving newline character', () => {
      const lines = splitIntoLines('line 1\nline 2\nline 3');

      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('line 1\n');
      expect(lines[1]).toBe('line 2\n');
      expect(lines[2]).toBe('line 3');
    });

    it('handles text without trailing newline', () => {
      const lines = splitIntoLines('single line');

      expect(lines).toHaveLength(1);
      expect(lines[0]).toBe('single line');
    });

    it('handles text with trailing newline', () => {
      const lines = splitIntoLines('line 1\n');

      expect(lines).toHaveLength(1);
      expect(lines[0]).toBe('line 1\n');
    });

    it('handles multiple consecutive newlines', () => {
      const lines = splitIntoLines('line 1\n\nline 3');

      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('line 1\n');
      expect(lines[1]).toBe('\n');
      expect(lines[2]).toBe('line 3');
    });
  });

  describe('getDiffSummary', () => {
    it('returns "No changes" for identical texts', () => {
      const result = computeDiff('hello', 'hello');
      expect(getDiffSummary(result)).toBe('No changes');
    });

    it('reports additions only', () => {
      const result = {
        changes: [],
        addCount: 2,
        removeCount: 0,
        isIdentical: false,
      };

      expect(getDiffSummary(result)).toBe('2 additions');
    });

    it('reports removals only', () => {
      const result = {
        changes: [],
        addCount: 0,
        removeCount: 3,
        isIdentical: false,
      };

      expect(getDiffSummary(result)).toBe('3 removals');
    });

    it('reports both additions and removals', () => {
      const result = {
        changes: [],
        addCount: 1,
        removeCount: 2,
        isIdentical: false,
      };

      expect(getDiffSummary(result)).toBe('1 addition, 2 removals');
    });

    it('uses singular form for 1 addition', () => {
      const result = {
        changes: [],
        addCount: 1,
        removeCount: 0,
        isIdentical: false,
      };

      expect(getDiffSummary(result)).toBe('1 addition');
    });

    it('uses singular form for 1 removal', () => {
      const result = {
        changes: [],
        addCount: 0,
        removeCount: 1,
        isIdentical: false,
      };

      expect(getDiffSummary(result)).toBe('1 removal');
    });
  });

  describe('applyChanges', () => {
    it('returns original text when no changes', () => {
      const text = 'hello world';
      const result = applyChanges(text, []);

      expect(result).toBe(text);
    });

    it('applies single replacement', () => {
      const text = 'hello world';
      const result = applyChanges(text, [{ start: 0, end: 5, replacement: 'goodbye' }]);

      expect(result).toBe('goodbye world');
    });

    it('applies multiple replacements', () => {
      const text = 'hello world';
      const result = applyChanges(text, [
        { start: 0, end: 5, replacement: 'hi' },
        { start: 6, end: 11, replacement: 'there' },
      ]);

      expect(result).toBe('hi there');
    });

    it('handles deletion (empty replacement)', () => {
      const text = 'hello world';
      const result = applyChanges(text, [{ start: 5, end: 11, replacement: '' }]);

      expect(result).toBe('hello');
    });

    it('handles insertion (start equals end)', () => {
      const text = 'hello world';
      const result = applyChanges(text, [{ start: 5, end: 5, replacement: ' beautiful' }]);

      expect(result).toBe('hello beautiful world');
    });
  });

  describe('countWords', () => {
    it('returns 0 for empty string', () => {
      expect(countWords('')).toBe(0);
    });

    it('returns 0 for whitespace only', () => {
      expect(countWords('   \n\t  ')).toBe(0);
    });

    it('counts single word', () => {
      expect(countWords('hello')).toBe(1);
    });

    it('counts multiple words', () => {
      expect(countWords('hello world')).toBe(2);
    });

    it('handles multiple spaces between words', () => {
      expect(countWords('hello    world')).toBe(2);
    });

    it('handles newlines', () => {
      expect(countWords('hello\nworld\ntest')).toBe(3);
    });

    it('handles mixed whitespace', () => {
      expect(countWords('  hello  \n  world  \t  test  ')).toBe(3);
    });
  });

  describe('countLines', () => {
    it('returns 0 for empty string', () => {
      expect(countLines('')).toBe(0);
    });

    it('returns 0 for whitespace only', () => {
      expect(countLines('   \n   \n   ')).toBe(0);
    });

    it('counts single line', () => {
      expect(countLines('hello world')).toBe(1);
    });

    it('counts multiple lines', () => {
      expect(countLines('line 1\nline 2\nline 3')).toBe(3);
    });

    it('ignores empty lines', () => {
      expect(countLines('line 1\n\nline 2\n\n\nline 3')).toBe(3);
    });

    it('handles lines with only whitespace', () => {
      expect(countLines('line 1\n   \nline 2')).toBe(2);
    });
  });

  describe('createPreview', () => {
    it('returns full text if under maxLength', () => {
      const text = 'short text';
      expect(createPreview(text, 100)).toBe(text);
    });

    it('truncates text exceeding maxLength', () => {
      const text = 'this is a longer text that needs truncation';
      const result = createPreview(text, 20);

      expect(result.length).toBeLessThanOrEqual(20);
      expect(result.endsWith('...')).toBe(true);
    });

    it('uses default maxLength of 100', () => {
      const text = 'a'.repeat(150);
      const result = createPreview(text);

      expect(result.length).toBeLessThanOrEqual(100);
    });

    it('handles text exactly at maxLength', () => {
      const text = 'exactly ten';
      expect(createPreview(text, 11)).toBe(text);
    });

    it('handles empty string', () => {
      expect(createPreview('', 10)).toBe('');
    });

    it('trims whitespace before ellipsis', () => {
      const text = 'hello world this is text';
      const result = createPreview(text, 15);

      // Should not end with space before ...
      expect(result).not.toMatch(/\s\.\.\.$/);
    });
  });
});
