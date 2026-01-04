/**
 * Tests for Claude Prompt Templates
 *
 * @module lib/claude/templates.test
 */

import { describe, it, expect } from 'vitest';
import {
  WORD_SUBSTITUTION_TEMPLATE,
  MEANING_PRESERVATION_TEMPLATE,
  EMOTIONAL_INTERPRETATION_TEMPLATE,
  MELODY_FEEDBACK_TEMPLATE,
  PROMPT_TEMPLATES,
  getTemplate,
  listTemplateTypes,
  validateTemplateVariables,
  fillTemplate,
  escapeForTemplate,
  formatProblemSpots,
  formatEmotionalArc,
  formatStressAlignment,
} from './templates';

// =============================================================================
// Template Constants Tests
// =============================================================================

describe('WORD_SUBSTITUTION_TEMPLATE', () => {
  it('has correct type', () => {
    expect(WORD_SUBSTITUTION_TEMPLATE.type).toBe('word_substitution');
  });

  it('has all required variables', () => {
    expect(WORD_SUBSTITUTION_TEMPLATE.requiredVariables).toContain('poem');
    expect(WORD_SUBSTITUTION_TEMPLATE.requiredVariables).toContain('problemSpots');
    expect(WORD_SUBSTITUTION_TEMPLATE.requiredVariables).toContain('meterType');
    expect(WORD_SUBSTITUTION_TEMPLATE.requiredVariables).toContain('rhymeScheme');
  });

  it('has optional maxSuggestions variable', () => {
    expect(WORD_SUBSTITUTION_TEMPLATE.optionalVariables).toHaveProperty('maxSuggestions');
  });

  it('template contains all placeholder references', () => {
    const template = WORD_SUBSTITUTION_TEMPLATE.template;
    expect(template).toContain('{{poem}}');
    expect(template).toContain('{{problemSpots}}');
    expect(template).toContain('{{meterType}}');
    expect(template).toContain('{{rhymeScheme}}');
    expect(template).toContain('{{maxSuggestions}}');
  });

  it('has description', () => {
    expect(WORD_SUBSTITUTION_TEMPLATE.description.length).toBeGreaterThan(0);
  });
});

describe('MEANING_PRESERVATION_TEMPLATE', () => {
  it('has correct type', () => {
    expect(MEANING_PRESERVATION_TEMPLATE.type).toBe('meaning_preservation');
  });

  it('has all required variables', () => {
    expect(MEANING_PRESERVATION_TEMPLATE.requiredVariables).toContain('poem');
    expect(MEANING_PRESERVATION_TEMPLATE.requiredVariables).toContain('dominantEmotions');
    expect(MEANING_PRESERVATION_TEMPLATE.requiredVariables).toContain('meterType');
    expect(MEANING_PRESERVATION_TEMPLATE.requiredVariables).toContain('rhymeScheme');
  });

  it('has optional title variable with default', () => {
    expect(MEANING_PRESERVATION_TEMPLATE.optionalVariables).toHaveProperty('title');
    expect(MEANING_PRESERVATION_TEMPLATE.optionalVariables.title).toBe('Untitled');
  });
});

describe('EMOTIONAL_INTERPRETATION_TEMPLATE', () => {
  it('has correct type', () => {
    expect(EMOTIONAL_INTERPRETATION_TEMPLATE.type).toBe('emotional_interpretation');
  });

  it('requires emotional context variables', () => {
    expect(EMOTIONAL_INTERPRETATION_TEMPLATE.requiredVariables).toContain('sentiment');
    expect(EMOTIONAL_INTERPRETATION_TEMPLATE.requiredVariables).toContain('arousal');
    expect(EMOTIONAL_INTERPRETATION_TEMPLATE.requiredVariables).toContain('emotionKeywords');
  });
});

describe('MELODY_FEEDBACK_TEMPLATE', () => {
  it('has correct type', () => {
    expect(MELODY_FEEDBACK_TEMPLATE.type).toBe('melody_feedback');
  });

  it('requires melody-specific variables', () => {
    expect(MELODY_FEEDBACK_TEMPLATE.requiredVariables).toContain('abcNotation');
    expect(MELODY_FEEDBACK_TEMPLATE.requiredVariables).toContain('key');
    expect(MELODY_FEEDBACK_TEMPLATE.requiredVariables).toContain('timeSignature');
    expect(MELODY_FEEDBACK_TEMPLATE.requiredVariables).toContain('tempo');
  });
});

describe('PROMPT_TEMPLATES registry', () => {
  it('contains all template types', () => {
    expect(PROMPT_TEMPLATES).toHaveProperty('word_substitution');
    expect(PROMPT_TEMPLATES).toHaveProperty('meaning_preservation');
    expect(PROMPT_TEMPLATES).toHaveProperty('emotional_interpretation');
    expect(PROMPT_TEMPLATES).toHaveProperty('melody_feedback');
  });

  it('templates match their registered keys', () => {
    expect(PROMPT_TEMPLATES.word_substitution.type).toBe('word_substitution');
    expect(PROMPT_TEMPLATES.meaning_preservation.type).toBe('meaning_preservation');
    expect(PROMPT_TEMPLATES.emotional_interpretation.type).toBe('emotional_interpretation');
    expect(PROMPT_TEMPLATES.melody_feedback.type).toBe('melody_feedback');
  });
});

// =============================================================================
// Template Function Tests
// =============================================================================

describe('getTemplate', () => {
  it('returns correct template for valid type', () => {
    const template = getTemplate('word_substitution');
    expect(template.type).toBe('word_substitution');
  });

  it('throws for unknown template type', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => getTemplate('unknown' as any)).toThrow('Unknown template type');
  });

  it('returns templates with identical content as constants', () => {
    expect(getTemplate('word_substitution')).toBe(WORD_SUBSTITUTION_TEMPLATE);
    expect(getTemplate('meaning_preservation')).toBe(MEANING_PRESERVATION_TEMPLATE);
  });
});

describe('listTemplateTypes', () => {
  it('returns all template type names', () => {
    const types = listTemplateTypes();

    expect(types).toContain('word_substitution');
    expect(types).toContain('meaning_preservation');
    expect(types).toContain('emotional_interpretation');
    expect(types).toContain('melody_feedback');
  });

  it('returns 4 types', () => {
    expect(listTemplateTypes()).toHaveLength(4);
  });
});

describe('validateTemplateVariables', () => {
  it('returns valid when all required variables present', () => {
    const result = validateTemplateVariables(MEANING_PRESERVATION_TEMPLATE, {
      poem: 'Test poem',
      dominantEmotions: 'happy',
      meterType: 'iambic',
      rhymeScheme: 'ABAB',
    });

    expect(result.isValid).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('returns invalid when required variables missing', () => {
    const result = validateTemplateVariables(MEANING_PRESERVATION_TEMPLATE, {
      poem: 'Test poem',
    });

    expect(result.isValid).toBe(false);
    expect(result.missing).toContain('dominantEmotions');
    expect(result.missing).toContain('meterType');
    expect(result.missing).toContain('rhymeScheme');
  });

  it('does not require optional variables', () => {
    const result = validateTemplateVariables(MEANING_PRESERVATION_TEMPLATE, {
      poem: 'Test poem',
      dominantEmotions: 'happy',
      meterType: 'iambic',
      rhymeScheme: 'ABAB',
      // title is optional, not provided
    });

    expect(result.isValid).toBe(true);
  });

  it('handles empty variables object', () => {
    const result = validateTemplateVariables(MEANING_PRESERVATION_TEMPLATE, {});

    expect(result.isValid).toBe(false);
    expect(result.missing.length).toBeGreaterThan(0);
  });
});

describe('fillTemplate', () => {
  it('replaces all placeholders with values', () => {
    const result = fillTemplate(MEANING_PRESERVATION_TEMPLATE, {
      poem: 'Roses are red',
      dominantEmotions: 'loving, peaceful',
      meterType: 'iambic',
      rhymeScheme: 'AABB',
      title: 'Love Poem',
    });

    expect(result).toContain('Roses are red');
    expect(result).toContain('loving, peaceful');
    expect(result).toContain('iambic');
    expect(result).toContain('AABB');
    expect(result).toContain('Love Poem');
    expect(result).not.toContain('{{poem}}');
    expect(result).not.toContain('{{dominantEmotions}}');
  });

  it('uses optional defaults when not provided', () => {
    const result = fillTemplate(MEANING_PRESERVATION_TEMPLATE, {
      poem: 'Test poem',
      dominantEmotions: 'happy',
      meterType: 'trochaic',
      rhymeScheme: 'ABAB',
      // title not provided, should use default
    });

    expect(result).toContain('Untitled');
  });

  it('throws when required variables missing', () => {
    expect(() =>
      fillTemplate(MEANING_PRESERVATION_TEMPLATE, {
        poem: 'Test poem',
        // missing other required variables
      })
    ).toThrow('Missing required template variables');
  });

  it('replaces all occurrences of a placeholder', () => {
    // Create a test template with multiple occurrences
    const testTemplate = {
      type: 'word_substitution' as const,
      template: '{{test}} is here. And {{test}} is here again.',
      requiredVariables: ['test'],
      optionalVariables: {},
      description: 'test',
    };

    const result = fillTemplate(testTemplate, { test: 'REPLACED' });

    expect(result).toBe('REPLACED is here. And REPLACED is here again.');
  });

  it('handles empty string values', () => {
    const result = fillTemplate(MEANING_PRESERVATION_TEMPLATE, {
      poem: '',
      dominantEmotions: '',
      meterType: '',
      rhymeScheme: '',
    });

    expect(result).not.toContain('{{');
  });
});

describe('escapeForTemplate', () => {
  it('escapes backslashes', () => {
    expect(escapeForTemplate('path\\to\\file')).toBe('path\\\\to\\\\file');
  });

  it('escapes backticks', () => {
    expect(escapeForTemplate('use `code` here')).toBe('use \\`code\\` here');
  });

  it('escapes dollar signs', () => {
    expect(escapeForTemplate('$100 price')).toBe('\\$100 price');
  });

  it('handles multiple escape types', () => {
    expect(escapeForTemplate('`$test\\path`')).toBe('\\`\\$test\\\\path\\`');
  });

  it('handles empty string', () => {
    expect(escapeForTemplate('')).toBe('');
  });

  it('handles normal text unchanged', () => {
    expect(escapeForTemplate('Hello world')).toBe('Hello world');
  });
});

// =============================================================================
// Formatting Function Tests
// =============================================================================

describe('formatProblemSpots', () => {
  it('formats problem spots correctly', () => {
    const spots = [
      {
        line: 1,
        position: 2,
        type: 'stress_mismatch',
        severity: 'high',
        description: 'Stressed syllable on weak beat',
      },
      {
        line: 3,
        position: 0,
        type: 'singability',
        severity: 'medium',
        description: 'Consonant cluster hard to sing',
      },
    ];

    const result = formatProblemSpots(spots);

    expect(result).toContain('Line 1, Position 2');
    expect(result).toContain('Type: stress_mismatch');
    expect(result).toContain('Severity: high');
    expect(result).toContain('Stressed syllable on weak beat');
    expect(result).toContain('Line 3, Position 0');
    expect(result).toContain('Consonant cluster hard to sing');
  });

  it('returns message for empty array', () => {
    const result = formatProblemSpots([]);
    expect(result).toBe('No specific problem spots identified.');
  });

  it('numbers spots sequentially', () => {
    const spots = [
      { line: 1, position: 0, type: 'a', severity: 'low', description: 'First' },
      { line: 2, position: 0, type: 'b', severity: 'low', description: 'Second' },
      { line: 3, position: 0, type: 'c', severity: 'low', description: 'Third' },
    ];

    const result = formatProblemSpots(spots);

    expect(result).toContain('1.');
    expect(result).toContain('2.');
    expect(result).toContain('3.');
  });
});

describe('formatEmotionalArc', () => {
  it('formats emotional arc entries correctly', () => {
    const arc = [
      { stanza: 0, sentiment: 0.5, keywords: ['joy', 'hope'] },
      { stanza: 1, sentiment: -0.5, keywords: ['sadness'] },  // Use -0.5 to be clearly negative (< -0.3)
      { stanza: 2, sentiment: 0.1, keywords: [] },
    ];

    const result = formatEmotionalArc(arc);

    expect(result).toContain('Stanza 1: positive (0.50)');
    expect(result).toContain('Keywords: joy, hope');
    expect(result).toContain('Stanza 2: negative (-0.50)');
    expect(result).toContain('Keywords: sadness');
    expect(result).toContain('Stanza 3: neutral (0.10)');
  });

  it('returns message for empty array', () => {
    const result = formatEmotionalArc([]);
    expect(result).toBe('No emotional arc data available.');
  });

  it('handles entries without keywords', () => {
    const arc = [{ stanza: 0, sentiment: 0.0, keywords: [] }];

    const result = formatEmotionalArc(arc);

    expect(result).toContain('Stanza 1: neutral');
    expect(result).not.toContain('Keywords:');
  });

  it('categorizes sentiment correctly', () => {
    const arc = [
      { stanza: 0, sentiment: 0.5, keywords: [] }, // positive
      { stanza: 1, sentiment: -0.5, keywords: [] }, // negative
      { stanza: 2, sentiment: 0.0, keywords: [] }, // neutral
      { stanza: 3, sentiment: 0.3, keywords: [] }, // borderline positive
      { stanza: 4, sentiment: -0.3, keywords: [] }, // borderline negative
    ];

    const result = formatEmotionalArc(arc);

    expect(result).toContain('Stanza 1: positive');
    expect(result).toContain('Stanza 2: negative');
    expect(result).toContain('Stanza 3: neutral');
    expect(result).toContain('Stanza 4: neutral'); // 0.3 <= threshold
    expect(result).toContain('Stanza 5: neutral'); // -0.3 >= -threshold
  });
});

describe('formatStressAlignment', () => {
  it('formats lines and alignment correctly', () => {
    const lines = [
      { text: 'The woods are lovely', stressPattern: '0101' },
      { text: 'Dark and deep', stressPattern: '101' },
    ];
    const alignment = [{ line: 1, issues: ['Stress mismatch on "woods"'] }];

    const result = formatStressAlignment(lines, alignment);

    expect(result).toContain('Line 1: "The woods are lovely"');
    expect(result).toContain('Pattern: 0101');
    expect(result).toContain('Line 2: "Dark and deep"');
    expect(result).toContain('Alignment Issues');
    expect(result).toContain('Line 1: Stress mismatch on "woods"');
  });

  it('handles empty alignment', () => {
    const lines = [{ text: 'Test line', stressPattern: '01' }];

    const result = formatStressAlignment(lines, []);

    expect(result).toContain('Test line');
    expect(result).toContain('No alignment issues detected');
  });

  it('handles missing stress patterns', () => {
    const lines = [{ text: 'Test line', stressPattern: '' }];

    const result = formatStressAlignment(lines, []);

    expect(result).toContain('Pattern: N/A');
  });

  it('combines multiple issues for same line', () => {
    const lines = [{ text: 'Problematic line', stressPattern: '010' }];
    const alignment = [{ line: 1, issues: ['Issue one', 'Issue two'] }];

    const result = formatStressAlignment(lines, alignment);

    expect(result).toContain('Issue one; Issue two');
  });
});
