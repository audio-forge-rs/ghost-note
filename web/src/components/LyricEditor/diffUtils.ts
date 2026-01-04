/**
 * Diff Utility Functions
 *
 * Provides text diffing functionality using diff-match-patch.
 *
 * @module components/LyricEditor/diffUtils
 */

import { diff_match_patch, DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT } from 'diff-match-patch';
import type { DiffChange, DiffResult } from './types';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[diffUtils] ${message}`, ...args);
  }
};

// Create a singleton instance of diff_match_patch
const dmp = new diff_match_patch();

/**
 * Computes the diff between two texts
 *
 * @param originalText - The original text
 * @param modifiedText - The modified text
 * @returns DiffResult containing all changes
 */
export function computeDiff(originalText: string, modifiedText: string): DiffResult {
  log('Computing diff between texts', {
    originalLength: originalText.length,
    modifiedLength: modifiedText.length,
  });

  // Handle edge cases
  if (originalText === modifiedText) {
    return {
      changes: [{ type: 'equal', text: originalText, position: 0 }],
      addCount: 0,
      removeCount: 0,
      isIdentical: true,
    };
  }

  // Compute the diff
  const diffs = dmp.diff_main(originalText, modifiedText);

  // Clean up the diff for better semantic meaning
  dmp.diff_cleanupSemantic(diffs);

  // Convert to our change format
  const changes: DiffChange[] = [];
  let position = 0;
  let addCount = 0;
  let removeCount = 0;

  for (const [operation, text] of diffs) {
    let type: DiffChange['type'];

    switch (operation) {
      case DIFF_DELETE:
        type = 'remove';
        removeCount++;
        break;
      case DIFF_INSERT:
        type = 'add';
        addCount++;
        break;
      case DIFF_EQUAL:
      default:
        type = 'equal';
        break;
    }

    changes.push({ type, text, position });

    // Update position only for non-delete operations
    if (operation !== DIFF_DELETE) {
      position += text.length;
    }
  }

  log('Diff computed:', { changeCount: changes.length, addCount, removeCount });

  return {
    changes,
    addCount,
    removeCount,
    isIdentical: false,
  };
}

/**
 * Computes a line-by-line diff between two texts
 *
 * @param originalText - The original text
 * @param modifiedText - The modified text
 * @returns DiffResult with line-level changes
 */
export function computeLineDiff(originalText: string, modifiedText: string): DiffResult {
  log('Computing line diff');

  // Convert to line arrays
  const { chars1, chars2, lineArray } = dmp.diff_linesToChars_(originalText, modifiedText);

  // Compute diff on line-encoded strings
  const diffs = dmp.diff_main(chars1, chars2, false);

  // Convert back to lines
  dmp.diff_charsToLines_(diffs, lineArray);

  // Clean up for semantic meaning
  dmp.diff_cleanupSemantic(diffs);

  // Convert to our change format
  const changes: DiffChange[] = [];
  let position = 0;
  let addCount = 0;
  let removeCount = 0;

  for (const [operation, text] of diffs) {
    let type: DiffChange['type'];

    switch (operation) {
      case DIFF_DELETE:
        type = 'remove';
        removeCount++;
        break;
      case DIFF_INSERT:
        type = 'add';
        addCount++;
        break;
      case DIFF_EQUAL:
      default:
        type = 'equal';
        break;
    }

    changes.push({ type, text, position });

    if (operation !== DIFF_DELETE) {
      position += text.length;
    }
  }

  return {
    changes,
    addCount,
    removeCount,
    isIdentical: originalText === modifiedText,
  };
}

/**
 * Splits text into lines while preserving line endings
 *
 * @param text - The text to split
 * @returns Array of lines with their line endings
 */
export function splitIntoLines(text: string): string[] {
  if (!text) return [];

  // Split on newlines but preserve the newline character
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    currentLine += char;

    if (char === '\n') {
      lines.push(currentLine);
      currentLine = '';
    }
  }

  // Add the last line if it doesn't end with a newline
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Gets a summary of changes in the diff
 *
 * @param diffResult - The diff result to summarize
 * @returns Human-readable summary string
 */
export function getDiffSummary(diffResult: DiffResult): string {
  if (diffResult.isIdentical) {
    return 'No changes';
  }

  const parts: string[] = [];

  if (diffResult.addCount > 0) {
    parts.push(`${diffResult.addCount} addition${diffResult.addCount === 1 ? '' : 's'}`);
  }

  if (diffResult.removeCount > 0) {
    parts.push(`${diffResult.removeCount} removal${diffResult.removeCount === 1 ? '' : 's'}`);
  }

  return parts.join(', ') || 'No changes';
}

/**
 * Applies accepted changes from suggestions to text
 *
 * @param text - The original text
 * @param changes - Array of [startPos, endPos, replacement] tuples
 * @returns The text with changes applied
 */
export function applyChanges(
  text: string,
  changes: Array<{ start: number; end: number; replacement: string }>
): string {
  // Sort changes in reverse order to preserve positions
  const sortedChanges = [...changes].sort((a, b) => b.start - a.start);

  let result = text;

  for (const change of sortedChanges) {
    result = result.slice(0, change.start) + change.replacement + result.slice(change.end);
  }

  return result;
}

/**
 * Counts words in a text
 *
 * @param text - The text to count words in
 * @returns Number of words
 */
export function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/**
 * Counts lines in a text
 *
 * @param text - The text to count lines in
 * @returns Number of lines
 */
export function countLines(text: string): number {
  return text.trim() ? text.split('\n').filter((line) => line.trim()).length : 0;
}

/**
 * Creates a preview of text (truncated)
 *
 * @param text - The text to preview
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function createPreview(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength - 3).trim() + '...';
}
