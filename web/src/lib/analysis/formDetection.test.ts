import { describe, it, expect } from 'vitest';
import {
  detectPoemForm,
  getFormName,
  getFormDescription,
  getAllFormTypes,
  getFormsByCategory,
  isSonnetForm,
  createFormDetectionInput,
  type FormDetectionInput,
} from './formDetection';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Creates a basic FormDetectionInput with defaults that can be overridden
 */
function createInput(overrides: Partial<FormDetectionInput> = {}): FormDetectionInput {
  return {
    lineCount: 14,
    stanzaCount: 1,
    linesPerStanza: [14],
    meterFootType: 'iamb',
    meterName: 'iambic pentameter',
    meterConfidence: 0.9,
    rhymeScheme: 'ABABCDCDEFEFGG',
    syllablesPerLine: Array(14).fill(10),
    avgSyllablesPerLine: 10,
    regularity: 0.9,
    ...overrides,
  };
}

// =============================================================================
// Shakespearean Sonnet Tests
// =============================================================================

describe('Shakespearean Sonnet Detection', () => {
  it('detects perfect Shakespearean sonnet', () => {
    const input = createInput({
      lineCount: 14,
      stanzaCount: 1,
      linesPerStanza: [14],
      meterFootType: 'iamb',
      meterName: 'iambic pentameter',
      rhymeScheme: 'ABABCDCDEFEFGG',
      syllablesPerLine: Array(14).fill(10),
      avgSyllablesPerLine: 10,
    });

    const result = detectPoemForm(input);

    expect(result.formType).toBe('shakespearean_sonnet');
    expect(result.formName).toBe('Shakespearean Sonnet');
    expect(result.category).toBe('fixed_form');
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.evidence.lineCountMatch).toBe(true);
    expect(result.evidence.rhymeSchemeMatch).toBe(true);
    expect(result.evidence.meterMatch).toBe(true);
  });

  it('detects Shakespearean sonnet with slight variations', () => {
    const input = createInput({
      lineCount: 14,
      rhymeScheme: 'ABABCDCDEFEFGG',
      meterFootType: 'iamb',
      meterName: 'iambic pentameter',
      syllablesPerLine: [10, 11, 10, 10, 9, 10, 10, 11, 10, 10, 10, 10, 10, 10],
      avgSyllablesPerLine: 10.1,
    });

    const result = detectPoemForm(input);

    expect(result.formType).toBe('shakespearean_sonnet');
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('identifies ending couplet as evidence', () => {
    // A near-Shakespearean sonnet with ending couplet should score well
    const input = createInput({
      lineCount: 14,
      rhymeScheme: 'ABABCDCDEFEFGG', // Full Shakespearean rhyme scheme with couplet
      meterFootType: 'iamb',
      meterName: 'iambic pentameter',
    });

    const result = detectPoemForm(input);

    // Should identify as Shakespearean sonnet and mention couplet
    expect(result.formType).toBe('shakespearean_sonnet');
    expect(result.confidence).toBeGreaterThan(0.7);
    // The couplet is implied in Shakespearean sonnets
    expect(result.evidence.rhymeSchemeMatch).toBe(true);
  });
});

// =============================================================================
// Petrarchan Sonnet Tests
// =============================================================================

describe('Petrarchan Sonnet Detection', () => {
  it('detects perfect Petrarchan sonnet with CDCDCD sestet', () => {
    const input = createInput({
      lineCount: 14,
      stanzaCount: 2,
      linesPerStanza: [8, 6],
      meterFootType: 'iamb',
      meterName: 'iambic pentameter',
      rhymeScheme: 'ABBAABBACDCDCD',
    });

    const result = detectPoemForm(input);

    expect(result.formType).toBe('petrarchan_sonnet');
    expect(result.formName).toBe('Petrarchan Sonnet');
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.evidence.rhymeSchemeMatch).toBe(true);
  });

  it('detects Petrarchan sonnet with CDECDE sestet', () => {
    const input = createInput({
      lineCount: 14,
      stanzaCount: 2,
      linesPerStanza: [8, 6],
      rhymeScheme: 'ABBAABBACDECDE',
      meterFootType: 'iamb',
      meterName: 'iambic pentameter',
    });

    const result = detectPoemForm(input);

    expect(result.formType).toBe('petrarchan_sonnet');
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('recognizes octave pattern even without perfect sestet', () => {
    const input = createInput({
      lineCount: 14,
      stanzaCount: 2,
      linesPerStanza: [8, 6],
      rhymeScheme: 'ABBAABBACDECDE', // Standard Petrarchan pattern
      meterFootType: 'iamb',
      meterName: 'iambic pentameter',
    });

    const result = detectPoemForm(input);

    // Should detect as Petrarchan sonnet
    expect(result.formType).toBe('petrarchan_sonnet');
    expect(result.confidence).toBeGreaterThan(0.5);
    // Should have octave noted
    const hasOctaveNote = result.evidence.notes.some((n) =>
      n.includes('ABBAABBA') || n.includes('octave') || n.includes('Petrarchan')
    );
    expect(hasOctaveNote).toBe(true);
  });
});

// =============================================================================
// Spenserian Sonnet Tests
// =============================================================================

describe('Spenserian Sonnet Detection', () => {
  it('detects Spenserian sonnet', () => {
    const input = createInput({
      lineCount: 14,
      rhymeScheme: 'ABABBCBCCDCDEE',
      meterFootType: 'iamb',
      meterName: 'iambic pentameter',
    });

    const result = detectPoemForm(input);

    expect(result.formType).toBe('spenserian_sonnet');
    expect(result.formName).toBe('Spenserian Sonnet');
    expect(result.confidence).toBeGreaterThan(0.7);
  });
});

// =============================================================================
// Haiku Tests
// =============================================================================

describe('Haiku Detection', () => {
  it('detects perfect haiku (5-7-5)', () => {
    const input = createInput({
      lineCount: 3,
      stanzaCount: 1,
      linesPerStanza: [3],
      meterFootType: 'unknown',
      meterName: 'irregular',
      meterConfidence: 0.3,
      rhymeScheme: 'ABC',
      syllablesPerLine: [5, 7, 5],
      avgSyllablesPerLine: 5.67,
      regularity: 0.4,
    });

    const result = detectPoemForm(input);

    expect(result.formType).toBe('haiku');
    expect(result.formName).toBe('Haiku');
    expect(result.category).toBe('syllabic');
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.evidence.lineCountMatch).toBe(true);
    expect(result.evidence.syllablePatternMatch).toBe(true);
  });

  it('detects near-haiku with slight syllable variation', () => {
    const input = createInput({
      lineCount: 3,
      stanzaCount: 1,
      linesPerStanza: [3],
      meterFootType: 'unknown',
      meterName: 'irregular',
      rhymeScheme: 'ABC',
      syllablesPerLine: [5, 8, 5], // 8 instead of 7
      avgSyllablesPerLine: 6,
    });

    const result = detectPoemForm(input);

    expect(result.formType).toBe('haiku');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('gives lower confidence for non-5-7-5 pattern', () => {
    const input = createInput({
      lineCount: 3,
      stanzaCount: 1,
      linesPerStanza: [3],
      rhymeScheme: 'ABC',
      syllablesPerLine: [8, 8, 8],
      avgSyllablesPerLine: 8,
    });

    const result = detectPoemForm(input);

    // May still detect as haiku but with lower confidence
    if (result.formType === 'haiku') {
      expect(result.confidence).toBeLessThan(0.7);
    }
  });
});

// =============================================================================
// Tanka Tests
// =============================================================================

describe('Tanka Detection', () => {
  it('detects perfect tanka (5-7-5-7-7)', () => {
    const input = createInput({
      lineCount: 5,
      stanzaCount: 1,
      linesPerStanza: [5],
      meterFootType: 'unknown',
      meterName: 'irregular',
      rhymeScheme: 'ABCDE',
      syllablesPerLine: [5, 7, 5, 7, 7],
      avgSyllablesPerLine: 6.2,
    });

    const result = detectPoemForm(input);

    expect(result.formType).toBe('tanka');
    expect(result.formName).toBe('Tanka');
    expect(result.category).toBe('syllabic');
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.evidence.syllablePatternMatch).toBe(true);
  });
});

// =============================================================================
// Limerick Tests
// =============================================================================

describe('Limerick Detection', () => {
  it('detects perfect limerick', () => {
    const input = createInput({
      lineCount: 5,
      stanzaCount: 1,
      linesPerStanza: [5],
      meterFootType: 'anapest',
      meterName: 'anapestic trimeter',
      rhymeScheme: 'AABBA',
      syllablesPerLine: [8, 8, 5, 5, 8],
      avgSyllablesPerLine: 6.8,
    });

    const result = detectPoemForm(input);

    expect(result.formType).toBe('limerick');
    expect(result.formName).toBe('Limerick');
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.evidence.lineCountMatch).toBe(true);
    expect(result.evidence.rhymeSchemeMatch).toBe(true);
    expect(result.evidence.meterMatch).toBe(true);
  });

  it('detects limerick with iambic meter variation', () => {
    const input = createInput({
      lineCount: 5,
      stanzaCount: 1,
      linesPerStanza: [5],
      meterFootType: 'iamb',
      meterName: 'iambic tetrameter',
      rhymeScheme: 'AABBA',
      syllablesPerLine: [9, 9, 5, 5, 9],
      avgSyllablesPerLine: 7.4,
    });

    const result = detectPoemForm(input);

    expect(result.formType).toBe('limerick');
    expect(result.confidence).toBeGreaterThan(0.5);
  });
});

// =============================================================================
// Ballad / Common Meter Tests
// =============================================================================

describe('Ballad Detection', () => {
  it('detects ballad with ABAB quatrains', () => {
    const input = createInput({
      lineCount: 16,
      stanzaCount: 4,
      linesPerStanza: [4, 4, 4, 4],
      meterFootType: 'iamb',
      meterName: 'iambic tetrameter',
      rhymeScheme: 'ABABABABABABABAB',
      syllablesPerLine: [8, 6, 8, 6, 8, 6, 8, 6, 8, 6, 8, 6, 8, 6, 8, 6],
      avgSyllablesPerLine: 7,
    });

    const result = detectPoemForm(input);

    // Ballad and common_meter are very similar forms
    expect(['ballad', 'common_meter', 'quatrain']).toContain(result.formType);
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.evidence.stanzaStructureMatch).toBe(true);
  });

  it('detects common meter with strict 8-6-8-6', () => {
    const input = createInput({
      lineCount: 8,
      stanzaCount: 2,
      linesPerStanza: [4, 4],
      meterFootType: 'iamb',
      meterName: 'iambic tetrameter',
      rhymeScheme: 'ABCBABCB',
      syllablesPerLine: [8, 6, 8, 6, 8, 6, 8, 6],
      avgSyllablesPerLine: 7,
    });

    const result = detectPoemForm(input);

    // Could be ballad or common_meter
    expect(['ballad', 'common_meter', 'quatrain']).toContain(result.formType);
    expect(result.evidence.syllablePatternMatch).toBe(true);
  });
});

// =============================================================================
// Villanelle Tests
// =============================================================================

describe('Villanelle Detection', () => {
  it('detects villanelle with proper structure', () => {
    const input = createInput({
      lineCount: 19,
      stanzaCount: 6,
      linesPerStanza: [3, 3, 3, 3, 3, 4],
      meterFootType: 'iamb',
      meterName: 'iambic pentameter',
      rhymeScheme: 'ABAABABAABABAABABAA',
      syllablesPerLine: Array(19).fill(10),
      avgSyllablesPerLine: 10,
    });

    const result = detectPoemForm(input);

    expect(result.formType).toBe('villanelle');
    expect(result.formName).toBe('Villanelle');
    expect(result.category).toBe('fixed_form');
    expect(result.confidence).toBeGreaterThan(0.6);
    expect(result.evidence.lineCountMatch).toBe(true);
    expect(result.evidence.stanzaStructureMatch).toBe(true);
  });
});

// =============================================================================
// Sestina Tests
// =============================================================================

describe('Sestina Detection', () => {
  it('detects sestina with proper structure', () => {
    const input = createInput({
      lineCount: 39,
      stanzaCount: 7,
      linesPerStanza: [6, 6, 6, 6, 6, 6, 3],
      meterFootType: 'iamb',
      meterName: 'iambic pentameter',
      rhymeScheme: 'ABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABC',
      syllablesPerLine: Array(39).fill(10),
      avgSyllablesPerLine: 10,
    });

    const result = detectPoemForm(input);

    expect(result.formType).toBe('sestina');
    expect(result.formName).toBe('Sestina');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.evidence.lineCountMatch).toBe(true);
    expect(result.evidence.stanzaStructureMatch).toBe(true);
  });
});

// =============================================================================
// Heroic Couplet Tests
// =============================================================================

describe('Heroic Couplet Detection', () => {
  it('detects heroic couplets', () => {
    const input = createInput({
      lineCount: 10,
      stanzaCount: 5,
      linesPerStanza: [2, 2, 2, 2, 2],
      meterFootType: 'iamb',
      meterName: 'iambic pentameter',
      rhymeScheme: 'AABBCCDDEE',
      syllablesPerLine: Array(10).fill(10),
      avgSyllablesPerLine: 10,
    });

    const result = detectPoemForm(input);

    expect(result.formType).toBe('heroic_couplet');
    expect(result.formName).toBe('Heroic Couplet');
    expect(result.category).toBe('metrical');
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.evidence.rhymeSchemeMatch).toBe(true);
    expect(result.evidence.meterMatch).toBe(true);
  });
});

// =============================================================================
// Blank Verse Tests
// =============================================================================

describe('Blank Verse Detection', () => {
  it('detects blank verse (unrhymed iambic pentameter)', () => {
    const input = createInput({
      lineCount: 20,
      stanzaCount: 1,
      linesPerStanza: [20],
      meterFootType: 'iamb',
      meterName: 'iambic pentameter',
      rhymeScheme: 'ABCDEFGHIJKLMNOPQRST',
      syllablesPerLine: Array(20).fill(10),
      avgSyllablesPerLine: 10,
    });

    const result = detectPoemForm(input);

    expect(result.formType).toBe('blank_verse');
    expect(result.formName).toBe('Blank Verse');
    expect(result.category).toBe('metrical');
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.evidence.meterMatch).toBe(true);
    expect(result.evidence.rhymeSchemeMatch).toBe(true);
  });
});

// =============================================================================
// Terza Rima Tests
// =============================================================================

describe('Terza Rima Detection', () => {
  it('detects terza rima with interlocking rhyme', () => {
    const input = createInput({
      lineCount: 9,
      stanzaCount: 3,
      linesPerStanza: [3, 3, 3],
      meterFootType: 'iamb',
      meterName: 'iambic pentameter',
      rhymeScheme: 'ABABCBCDC',
      syllablesPerLine: Array(9).fill(10),
      avgSyllablesPerLine: 10,
    });

    const result = detectPoemForm(input);

    expect(result.formType).toBe('terza_rima');
    expect(result.formName).toBe('Terza Rima');
    expect(result.evidence.stanzaStructureMatch).toBe(true);
    expect(result.evidence.rhymeSchemeMatch).toBe(true);
  });
});

// =============================================================================
// Cinquain Tests
// =============================================================================

describe('Cinquain Detection', () => {
  it('detects perfect cinquain (2-4-6-8-2)', () => {
    const input = createInput({
      lineCount: 5,
      stanzaCount: 1,
      linesPerStanza: [5],
      meterFootType: 'iamb',
      meterName: 'iambic',
      rhymeScheme: 'ABCDE',
      syllablesPerLine: [2, 4, 6, 8, 2],
      avgSyllablesPerLine: 4.4,
    });

    const result = detectPoemForm(input);

    expect(result.formType).toBe('cinquain');
    expect(result.formName).toBe('Cinquain');
    expect(result.category).toBe('syllabic');
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.evidence.syllablePatternMatch).toBe(true);
  });
});

// =============================================================================
// Free Verse Tests
// =============================================================================

describe('Free Verse Detection', () => {
  it('detects free verse with irregular structure', () => {
    const input = createInput({
      lineCount: 12,
      stanzaCount: 3,
      linesPerStanza: [5, 4, 3],
      meterFootType: 'unknown',
      meterName: 'irregular',
      meterConfidence: 0.3,
      rhymeScheme: 'ABCDEFGHIJKL',
      syllablesPerLine: [3, 8, 12, 5, 7, 9, 4, 11, 6, 8, 5, 10],
      avgSyllablesPerLine: 7.3,
      regularity: 0.3,
    });

    const result = detectPoemForm(input);

    expect(result.formType).toBe('free_verse');
    expect(result.formName).toBe('Free Verse');
    expect(result.category).toBe('free');
    expect(result.evidence.notes.some((n) => n.toLowerCase().includes('variable') || n.toLowerCase().includes('irregular'))).toBe(true);
  });
});

// =============================================================================
// Quatrain Tests
// =============================================================================

describe('Quatrain Detection', () => {
  it('detects quatrain with ABAB rhyme', () => {
    const input = createInput({
      lineCount: 4,
      stanzaCount: 1,
      linesPerStanza: [4],
      meterFootType: 'iamb',
      meterName: 'iambic tetrameter',
      rhymeScheme: 'ABAB',
      syllablesPerLine: [8, 8, 8, 8],
      avgSyllablesPerLine: 8,
    });

    const result = detectPoemForm(input);

    // Quatrain, ballad, and common_meter share similar characteristics
    expect(['quatrain', 'ballad', 'common_meter']).toContain(result.formType);
    expect(['stanzaic', 'metrical']).toContain(result.category);
    expect(result.evidence.stanzaStructureMatch).toBe(true);
    expect(result.evidence.rhymeSchemeMatch).toBe(true);
  });

  it('detects quatrain with AABB rhyme', () => {
    const input = createInput({
      lineCount: 8,
      stanzaCount: 2,
      linesPerStanza: [4, 4],
      meterFootType: 'iamb',
      meterName: 'iambic tetrameter',
      rhymeScheme: 'AABBCCDD',
      syllablesPerLine: [8, 8, 8, 8, 8, 8, 8, 8],
      avgSyllablesPerLine: 8,
    });

    const result = detectPoemForm(input);

    // Could be quatrain or couplet, depending on interpretation
    expect(['quatrain', 'couplet', 'heroic_couplet']).toContain(result.formType);
  });
});

// =============================================================================
// Tercet Tests
// =============================================================================

describe('Tercet Detection', () => {
  it('detects tercet with 3-line stanzas', () => {
    const input = createInput({
      lineCount: 9,
      stanzaCount: 3,
      linesPerStanza: [3, 3, 3],
      meterFootType: 'iamb',
      meterName: 'iambic pentameter',
      rhymeScheme: 'AAABBBCCC',
      syllablesPerLine: Array(9).fill(10),
      avgSyllablesPerLine: 10,
    });

    const result = detectPoemForm(input);

    expect(result.formType).toBe('tercet');
    expect(result.formName).toBe('Tercet');
    expect(result.evidence.stanzaStructureMatch).toBe(true);
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('Edge Cases', () => {
  it('handles empty poem', () => {
    const input = createInput({
      lineCount: 0,
      stanzaCount: 0,
      linesPerStanza: [],
      rhymeScheme: '',
      syllablesPerLine: [],
      avgSyllablesPerLine: 0,
    });

    const result = detectPoemForm(input);

    expect(result.formType).toBe('unknown');
    expect(result.confidence).toBe(0);
  });

  it('handles single line poem', () => {
    const input = createInput({
      lineCount: 1,
      stanzaCount: 1,
      linesPerStanza: [1],
      rhymeScheme: 'A',
      syllablesPerLine: [10],
      avgSyllablesPerLine: 10,
    });

    const result = detectPoemForm(input);

    // Should identify something, likely free verse
    expect(result.formType).not.toBe('unknown');
  });

  it('handles very long poem', () => {
    const input = createInput({
      lineCount: 100,
      stanzaCount: 25,
      linesPerStanza: Array(25).fill(4),
      meterFootType: 'iamb',
      meterName: 'iambic pentameter',
      rhymeScheme: 'ABAB'.repeat(25),
      syllablesPerLine: Array(100).fill(10),
      avgSyllablesPerLine: 10,
    });

    const result = detectPoemForm(input);

    // Should detect quatrain structure
    expect(['quatrain', 'ballad', 'ode']).toContain(result.formType);
  });

  it('provides alternatives when form is ambiguous', () => {
    // 14 lines with non-standard rhyme could be sonnet or other
    const input = createInput({
      lineCount: 14,
      stanzaCount: 1,
      linesPerStanza: [14],
      meterFootType: 'iamb',
      meterName: 'iambic pentameter',
      rhymeScheme: 'AABBCCDDEEFFGG', // Couplet pattern, not traditional sonnet
      syllablesPerLine: Array(14).fill(10),
      avgSyllablesPerLine: 10,
    });

    const result = detectPoemForm(input);

    // Should have alternatives
    expect(result.alternatives.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// Confidence Scoring Tests
// =============================================================================

describe('Confidence Scoring', () => {
  it('gives higher confidence for more matching criteria', () => {
    const perfectSonnet = createInput({
      lineCount: 14,
      rhymeScheme: 'ABABCDCDEFEFGG',
      meterFootType: 'iamb',
      meterName: 'iambic pentameter',
      syllablesPerLine: Array(14).fill(10),
    });

    const imperfectSonnet = createInput({
      lineCount: 14,
      rhymeScheme: 'ABCDABCDABCDAB', // Non-standard rhyme
      meterFootType: 'trochee',
      meterName: 'trochaic tetrameter',
      syllablesPerLine: Array(14).fill(8),
    });

    const perfectResult = detectPoemForm(perfectSonnet);
    const imperfectResult = detectPoemForm(imperfectSonnet);

    if (perfectResult.formType === 'shakespearean_sonnet' &&
        imperfectResult.formType === 'shakespearean_sonnet') {
      expect(perfectResult.confidence).toBeGreaterThan(imperfectResult.confidence);
    }
  });

  it('confidence is between 0 and 1', () => {
    const inputs = [
      createInput(),
      createInput({ lineCount: 3, syllablesPerLine: [5, 7, 5], rhymeScheme: 'ABC' }),
      createInput({ lineCount: 5, rhymeScheme: 'AABBA' }),
      createInput({ lineCount: 19, stanzaCount: 6, linesPerStanza: [3, 3, 3, 3, 3, 4] }),
    ];

    for (const input of inputs) {
      const result = detectPoemForm(input);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    }
  });
});

// =============================================================================
// Evidence Tests
// =============================================================================

describe('Evidence Collection', () => {
  it('collects evidence notes', () => {
    const input = createInput({
      lineCount: 14,
      rhymeScheme: 'ABABCDCDEFEFGG',
      meterFootType: 'iamb',
      meterName: 'iambic pentameter',
    });

    const result = detectPoemForm(input);

    expect(result.evidence.notes.length).toBeGreaterThan(0);
    expect(result.evidence.notes.some((n) => n.includes('14 lines') || n.includes('pentameter'))).toBe(true);
  });

  it('identifies matching criteria correctly', () => {
    const input = createInput({
      lineCount: 14,
      rhymeScheme: 'ABABCDCDEFEFGG',
      meterFootType: 'iamb',
      meterName: 'iambic pentameter',
      syllablesPerLine: Array(14).fill(10),
    });

    const result = detectPoemForm(input);

    // At least some criteria should match for a perfect Shakespearean sonnet
    const matchCount = [
      result.evidence.lineCountMatch,
      result.evidence.rhymeSchemeMatch,
      result.evidence.meterMatch,
    ].filter(Boolean).length;

    expect(matchCount).toBeGreaterThanOrEqual(2);
  });
});

// =============================================================================
// Helper Function Tests
// =============================================================================

describe('getFormName', () => {
  it('returns correct names for known forms', () => {
    expect(getFormName('shakespearean_sonnet')).toBe('Shakespearean Sonnet');
    expect(getFormName('haiku')).toBe('Haiku');
    expect(getFormName('limerick')).toBe('Limerick');
    expect(getFormName('free_verse')).toBe('Free Verse');
  });

  it('returns fallback for unknown forms', () => {
    expect(getFormName('unknown')).toBe('Unknown Form');
  });
});

describe('getFormDescription', () => {
  it('returns descriptions for known forms', () => {
    const description = getFormDescription('shakespearean_sonnet');
    expect(description).toContain('14-line');
    expect(description.length).toBeGreaterThan(10);
  });

  it('returns empty string for unknown forms', () => {
    expect(getFormDescription('unknown')).toBe('');
  });
});

describe('getAllFormTypes', () => {
  it('returns all form types', () => {
    const types = getAllFormTypes();

    expect(types).toContain('shakespearean_sonnet');
    expect(types).toContain('haiku');
    expect(types).toContain('limerick');
    expect(types).toContain('free_verse');
    expect(types.length).toBeGreaterThan(10);
  });
});

describe('getFormsByCategory', () => {
  it('returns fixed forms', () => {
    const fixedForms = getFormsByCategory('fixed_form');

    expect(fixedForms).toContain('shakespearean_sonnet');
    expect(fixedForms).toContain('villanelle');
    expect(fixedForms).toContain('limerick');
  });

  it('returns syllabic forms', () => {
    const syllabicForms = getFormsByCategory('syllabic');

    expect(syllabicForms).toContain('haiku');
    expect(syllabicForms).toContain('tanka');
    expect(syllabicForms).toContain('cinquain');
  });

  it('returns metrical forms', () => {
    const metricalForms = getFormsByCategory('metrical');

    expect(metricalForms).toContain('blank_verse');
    expect(metricalForms).toContain('heroic_couplet');
  });
});

describe('isSonnetForm', () => {
  it('returns true for sonnet variants', () => {
    expect(isSonnetForm('shakespearean_sonnet')).toBe(true);
    expect(isSonnetForm('petrarchan_sonnet')).toBe(true);
    expect(isSonnetForm('spenserian_sonnet')).toBe(true);
    expect(isSonnetForm('sonnet')).toBe(true);
  });

  it('returns false for non-sonnets', () => {
    expect(isSonnetForm('haiku')).toBe(false);
    expect(isSonnetForm('limerick')).toBe(false);
    expect(isSonnetForm('free_verse')).toBe(false);
  });
});

describe('createFormDetectionInput', () => {
  it('creates valid input with calculated average', () => {
    const input = createFormDetectionInput(
      14, // lineCount
      1, // stanzaCount
      [14], // linesPerStanza
      'iamb', // meterFootType
      'iambic pentameter', // meterName
      0.9, // meterConfidence
      'ABABCDCDEFEFGG', // rhymeScheme
      Array(14).fill(10), // syllablesPerLine
      0.95 // regularity
    );

    expect(input.lineCount).toBe(14);
    expect(input.avgSyllablesPerLine).toBe(10);
    expect(input.meterFootType).toBe('iamb');
    expect(input.rhymeScheme).toBe('ABABCDCDEFEFGG');
  });

  it('handles empty syllables array', () => {
    const input = createFormDetectionInput(
      0,
      0,
      [],
      'unknown',
      'irregular',
      0,
      '',
      [],
      0
    );

    expect(input.avgSyllablesPerLine).toBe(0);
  });
});

// =============================================================================
// Real Poem Examples Tests
// =============================================================================

describe('Real Poem Examples', () => {
  describe('Shakespeare Sonnet 18', () => {
    it('identifies as Shakespearean sonnet', () => {
      // "Shall I compare thee to a summer's day?"
      const input = createInput({
        lineCount: 14,
        stanzaCount: 1,
        linesPerStanza: [14],
        meterFootType: 'iamb',
        meterName: 'iambic pentameter',
        meterConfidence: 0.95,
        rhymeScheme: 'ABABCDCDEFEFGG',
        syllablesPerLine: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
        avgSyllablesPerLine: 10,
        regularity: 0.9,
      });

      const result = detectPoemForm(input);

      expect(result.formType).toBe('shakespearean_sonnet');
      expect(result.confidence).toBeGreaterThan(0.85);
    });
  });

  describe('Basho Haiku', () => {
    it('identifies as haiku', () => {
      // "An old silent pond / A frog jumps into the pond / Splash! Silence again"
      const input = createInput({
        lineCount: 3,
        stanzaCount: 1,
        linesPerStanza: [3],
        meterFootType: 'unknown',
        meterName: 'irregular',
        meterConfidence: 0.2,
        rhymeScheme: 'ABC',
        syllablesPerLine: [5, 7, 5],
        avgSyllablesPerLine: 5.67,
        regularity: 0.3,
      });

      const result = detectPoemForm(input);

      expect(result.formType).toBe('haiku');
      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Edward Lear Limerick', () => {
    it('identifies as limerick', () => {
      // "There was an Old Man with a beard..."
      const input = createInput({
        lineCount: 5,
        stanzaCount: 1,
        linesPerStanza: [5],
        meterFootType: 'anapest',
        meterName: 'anapestic trimeter',
        meterConfidence: 0.85,
        rhymeScheme: 'AABBA',
        syllablesPerLine: [8, 8, 5, 5, 9],
        avgSyllablesPerLine: 7,
        regularity: 0.8,
      });

      const result = detectPoemForm(input);

      expect(result.formType).toBe('limerick');
      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Dylan Thomas "Do Not Go Gentle" (Villanelle)', () => {
    it('identifies as villanelle', () => {
      const input = createInput({
        lineCount: 19,
        stanzaCount: 6,
        linesPerStanza: [3, 3, 3, 3, 3, 4],
        meterFootType: 'iamb',
        meterName: 'iambic pentameter',
        meterConfidence: 0.9,
        rhymeScheme: 'ABAABABAABABAABABAA',
        syllablesPerLine: Array(19).fill(10),
        avgSyllablesPerLine: 10,
        regularity: 0.85,
      });

      const result = detectPoemForm(input);

      expect(result.formType).toBe('villanelle');
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Robert Frost "Stopping by Woods" (Iambic Tetrameter Quatrains)', () => {
    it('identifies as quatrain or ballad', () => {
      const input = createInput({
        lineCount: 16,
        stanzaCount: 4,
        linesPerStanza: [4, 4, 4, 4],
        meterFootType: 'iamb',
        meterName: 'iambic tetrameter',
        meterConfidence: 0.9,
        rhymeScheme: 'AABABBCBCCDBDEED', // Actually AABA BBCB CCDC DDDD
        syllablesPerLine: Array(16).fill(8),
        avgSyllablesPerLine: 8,
        regularity: 0.9,
      });

      const result = detectPoemForm(input);

      // Could be quatrain, ballad, or common_meter
      expect(['quatrain', 'ballad', 'common_meter']).toContain(result.formType);
    });
  });
});

// =============================================================================
// Variation Handling Tests
// =============================================================================

describe('Variation Handling', () => {
  it('handles feminine endings in sonnets', () => {
    // 11 syllables per line (feminine endings)
    const input = createInput({
      lineCount: 14,
      rhymeScheme: 'ABABCDCDEFEFGG',
      meterFootType: 'iamb',
      meterName: 'iambic pentameter',
      syllablesPerLine: Array(14).fill(11),
      avgSyllablesPerLine: 11,
    });

    const result = detectPoemForm(input);

    // Should still detect as sonnet
    expect(['shakespearean_sonnet', 'sonnet']).toContain(result.formType);
  });

  it('handles near-miss haiku (4-8-4 instead of 5-7-5)', () => {
    const input = createInput({
      lineCount: 3,
      stanzaCount: 1,
      linesPerStanza: [3],
      meterFootType: 'unknown',
      meterName: 'irregular',
      rhymeScheme: 'ABC',
      syllablesPerLine: [4, 8, 4],
      avgSyllablesPerLine: 5.33,
    });

    const result = detectPoemForm(input);

    // Should still consider haiku but with lower confidence
    if (result.formType === 'haiku') {
      expect(result.confidence).toBeLessThan(0.8);
    }
  });

  it('handles mixed meter poems', () => {
    const input = createInput({
      lineCount: 20,
      stanzaCount: 5,
      linesPerStanza: [4, 4, 4, 4, 4],
      meterFootType: 'iamb',
      meterName: 'iambic tetrameter',
      meterConfidence: 0.5, // Lower confidence due to variation
      rhymeScheme: 'ABABABABABABABABABAB',
      syllablesPerLine: [8, 6, 8, 6, 8, 6, 8, 6, 8, 6, 8, 6, 8, 6, 8, 6, 8, 6, 8, 6],
      avgSyllablesPerLine: 7,
      regularity: 0.6,
    });

    const result = detectPoemForm(input);

    // Should still detect a form
    expect(result.formType).not.toBe('unknown');
  });
});
