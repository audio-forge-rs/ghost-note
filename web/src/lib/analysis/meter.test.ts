import { describe, it, expect } from 'vitest';
import {
  levenshteinDistance,
  stringSimilarity,
  classifyLineLength,
  getFeetFromLineLength,
  calculateRegularity,
  findDeviations,
  findBestMeterMatch,
  detectMeter,
  analyzeMultiLineMeter,
  createMeterPattern,
  getAllLineLengthNames,
  getAllFootTypes,
  footTypeToAdjective,
  parseMeterName,
  FOOT_PATTERNS,
  LINE_LENGTH_NAMES,
} from './meter';

// =============================================================================
// Levenshtein Distance Tests
// =============================================================================

describe('levenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
    expect(levenshteinDistance('01010', '01010')).toBe(0);
    expect(levenshteinDistance('', '')).toBe(0);
  });

  it('returns length of non-empty string when other is empty', () => {
    expect(levenshteinDistance('hello', '')).toBe(5);
    expect(levenshteinDistance('', 'world')).toBe(5);
    expect(levenshteinDistance('010', '')).toBe(3);
  });

  it('handles single character differences', () => {
    expect(levenshteinDistance('cat', 'bat')).toBe(1); // substitution
    expect(levenshteinDistance('cat', 'cart')).toBe(1); // insertion
    expect(levenshteinDistance('cart', 'cat')).toBe(1); // deletion
  });

  it('calculates distance for stress patterns', () => {
    expect(levenshteinDistance('01010', '01010')).toBe(0);
    expect(levenshteinDistance('01010', '01110')).toBe(1); // one deviation
    expect(levenshteinDistance('01010', '10101')).toBe(2); // shifted pattern
    expect(levenshteinDistance('01010', '11111')).toBe(3); // all stressed differs in 3 positions
  });

  it('handles completely different strings', () => {
    expect(levenshteinDistance('abc', 'xyz')).toBe(3);
    expect(levenshteinDistance('000', '111')).toBe(3);
  });

  it('handles longer patterns correctly', () => {
    // Iambic pentameter pattern
    const ideal = '0101010101';
    const actual = '0101010101';
    expect(levenshteinDistance(ideal, actual)).toBe(0);

    // One deviation
    const oneOff = '0101010111';
    expect(levenshteinDistance(ideal, oneOff)).toBe(1);
  });
});

// =============================================================================
// String Similarity Tests
// =============================================================================

describe('stringSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(stringSimilarity('hello', 'hello')).toBe(1);
    expect(stringSimilarity('01010101', '01010101')).toBe(1);
  });

  it('returns 0 when one string is empty', () => {
    expect(stringSimilarity('hello', '')).toBe(0);
    expect(stringSimilarity('', 'hello')).toBe(0);
  });

  it('calculates normalized similarity', () => {
    // One difference in 5-character string = 0.8 similarity
    expect(stringSimilarity('01010', '01110')).toBe(0.8);

    // Two differences in 5-character string = 0.6 similarity
    expect(stringSimilarity('01010', '01111')).toBe(0.6);
  });

  it('handles patterns of different lengths', () => {
    const shorter = '0101';
    const longer = '01010';
    // Distance is 1 (one insertion needed), max length is 5
    expect(stringSimilarity(shorter, longer)).toBe(0.8);
  });
});

// =============================================================================
// Classify Line Length Tests
// =============================================================================

describe('classifyLineLength', () => {
  describe('with iambic foot (default)', () => {
    it('classifies based on syllable count', () => {
      expect(classifyLineLength(2)).toBe('monometer'); // 2 syllables = 1 iambic foot
      expect(classifyLineLength(4)).toBe('dimeter'); // 4 syllables = 2 iambic feet
      expect(classifyLineLength(6)).toBe('trimeter'); // 6 syllables = 3 iambic feet
      expect(classifyLineLength(8)).toBe('tetrameter'); // 8 syllables = 4 iambic feet
      expect(classifyLineLength(10)).toBe('pentameter'); // 10 syllables = 5 iambic feet
      expect(classifyLineLength(12)).toBe('hexameter'); // 12 syllables = 6 iambic feet
    });

    it('rounds to nearest foot count', () => {
      expect(classifyLineLength(9)).toBe('pentameter'); // 9/2 = 4.5 rounds to 5
      expect(classifyLineLength(11)).toBe('hexameter'); // 11/2 = 5.5 rounds to 6
    });

    it('handles edge cases', () => {
      expect(classifyLineLength(0)).toBe('monometer');
      expect(classifyLineLength(-1)).toBe('monometer');
      expect(classifyLineLength(1)).toBe('monometer');
    });

    it('clamps to valid range', () => {
      expect(classifyLineLength(20)).toBe('octameter'); // 10 feet, clamped to 8
      expect(classifyLineLength(100)).toBe('octameter');
    });
  });

  describe('with different foot types', () => {
    it('classifies with trochee (2 syllables per foot)', () => {
      expect(classifyLineLength(8, 'trochee')).toBe('tetrameter');
      expect(classifyLineLength(10, 'trochee')).toBe('pentameter');
    });

    it('classifies with anapest (3 syllables per foot)', () => {
      expect(classifyLineLength(9, 'anapest')).toBe('trimeter'); // 9/3 = 3 feet
      expect(classifyLineLength(12, 'anapest')).toBe('tetrameter'); // 12/3 = 4 feet
      expect(classifyLineLength(15, 'anapest')).toBe('pentameter'); // 15/3 = 5 feet
    });

    it('classifies with dactyl (3 syllables per foot)', () => {
      expect(classifyLineLength(12, 'dactyl')).toBe('tetrameter'); // 12/3 = 4 feet
      expect(classifyLineLength(18, 'dactyl')).toBe('hexameter'); // 18/3 = 6 feet
    });

    it('classifies with spondee (2 syllables per foot)', () => {
      expect(classifyLineLength(10, 'spondee')).toBe('pentameter');
    });
  });
});

// =============================================================================
// getFeetFromLineLength Tests
// =============================================================================

describe('getFeetFromLineLength', () => {
  it('returns correct feet count for each line length', () => {
    expect(getFeetFromLineLength('monometer')).toBe(1);
    expect(getFeetFromLineLength('dimeter')).toBe(2);
    expect(getFeetFromLineLength('trimeter')).toBe(3);
    expect(getFeetFromLineLength('tetrameter')).toBe(4);
    expect(getFeetFromLineLength('pentameter')).toBe(5);
    expect(getFeetFromLineLength('hexameter')).toBe(6);
    expect(getFeetFromLineLength('heptameter')).toBe(7);
    expect(getFeetFromLineLength('octameter')).toBe(8);
  });
});

// =============================================================================
// Calculate Regularity Tests
// =============================================================================

describe('calculateRegularity', () => {
  describe('with iambic patterns', () => {
    it('returns 1 for perfect iambic pattern', () => {
      expect(calculateRegularity('01', 'iamb')).toBe(1);
      expect(calculateRegularity('0101', 'iamb')).toBe(1);
      expect(calculateRegularity('01010101', 'iamb')).toBe(1);
      expect(calculateRegularity('0101010101', 'iamb')).toBe(1);
    });

    it('returns lower scores for deviations', () => {
      // One deviation in 10-character pattern
      const score = calculateRegularity('0101010111', 'iamb');
      expect(score).toBeLessThan(1);
      expect(score).toBeGreaterThan(0.8);
    });

    it('returns lower score for shifted pattern', () => {
      // Trochaic pattern tested against iambic
      // '10101010' vs ideal '01010101' - only differs at every position by phase shift
      // Levenshtein distance = 2 (just the first and last char differ in alignment)
      // Similarity = (8-2)/8 = 0.75
      const score = calculateRegularity('10101010', 'iamb');
      expect(score).toBeLessThan(1);
      expect(score).toBeGreaterThan(0.5); // Not too low due to pattern similarity
    });
  });

  describe('with trochaic patterns', () => {
    it('returns 1 for perfect trochaic pattern', () => {
      expect(calculateRegularity('10', 'trochee')).toBe(1);
      expect(calculateRegularity('1010', 'trochee')).toBe(1);
      expect(calculateRegularity('10101010', 'trochee')).toBe(1);
    });
  });

  describe('with anapestic patterns', () => {
    it('returns 1 for perfect anapestic pattern', () => {
      expect(calculateRegularity('001', 'anapest')).toBe(1);
      expect(calculateRegularity('001001', 'anapest')).toBe(1);
      expect(calculateRegularity('001001001', 'anapest')).toBe(1);
    });
  });

  describe('with dactylic patterns', () => {
    it('returns 1 for perfect dactylic pattern', () => {
      expect(calculateRegularity('100', 'dactyl')).toBe(1);
      expect(calculateRegularity('100100', 'dactyl')).toBe(1);
      expect(calculateRegularity('100100100', 'dactyl')).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('returns 0 for empty pattern', () => {
      expect(calculateRegularity('', 'iamb')).toBe(0);
    });

    it('returns 0 for unknown foot type', () => {
      expect(calculateRegularity('01010101', 'unknown')).toBe(0);
    });
  });
});

// =============================================================================
// Find Deviations Tests
// =============================================================================

describe('findDeviations', () => {
  it('returns empty array for perfect patterns', () => {
    expect(findDeviations('0101010101', 'iamb')).toEqual([]);
    expect(findDeviations('1010101010', 'trochee')).toEqual([]);
  });

  it('finds deviations in iambic pattern', () => {
    // '0101010111' - deviation at position 8 (should be 0, is 1)
    const deviations = findDeviations('0101010111', 'iamb');
    expect(deviations).toContain(8);
  });

  it('finds multiple deviations', () => {
    // '1101010111' - deviations at positions 0 and 8
    const deviations = findDeviations('1101010111', 'iamb');
    expect(deviations).toContain(0);
    expect(deviations).toContain(8);
  });

  it('returns empty for empty pattern', () => {
    expect(findDeviations('', 'iamb')).toEqual([]);
  });
});

// =============================================================================
// Find Best Meter Match Tests
// =============================================================================

describe('findBestMeterMatch', () => {
  it('correctly identifies iambic pentameter', () => {
    const matches = findBestMeterMatch('0101010101');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].meter).toBe('iambic pentameter');
    expect(matches[0].score).toBe(1);
  });

  it('correctly identifies iambic tetrameter', () => {
    const matches = findBestMeterMatch('01010101');
    expect(matches[0].meter).toBe('iambic tetrameter');
    expect(matches[0].score).toBe(1);
  });

  it('correctly identifies trochaic tetrameter', () => {
    const matches = findBestMeterMatch('10101010');
    expect(matches[0].meter).toBe('trochaic tetrameter');
    expect(matches[0].score).toBe(1);
  });

  it('correctly identifies anapestic tetrameter', () => {
    const matches = findBestMeterMatch('001001001001');
    expect(matches[0].meter).toBe('anapestic tetrameter');
    expect(matches[0].score).toBe(1);
  });

  it('correctly identifies dactylic hexameter', () => {
    const matches = findBestMeterMatch('100100100100100100');
    expect(matches[0].meter).toBe('dactylic hexameter');
    expect(matches[0].score).toBe(1);
  });

  it('returns multiple matches sorted by score', () => {
    const matches = findBestMeterMatch('01010101');
    expect(matches.length).toBeGreaterThan(1);
    // Should be sorted descending by score
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i - 1].score).toBeGreaterThanOrEqual(matches[i].score);
    }
  });

  it('returns empty array for empty pattern', () => {
    expect(findBestMeterMatch('')).toEqual([]);
  });

  it('handles imperfect patterns', () => {
    // Mostly iambic with one deviation
    const matches = findBestMeterMatch('0101010111');
    expect(matches[0].meter).toBe('iambic pentameter');
    expect(matches[0].score).toBeLessThan(1);
    expect(matches[0].score).toBeGreaterThan(0.8);
  });
});

// =============================================================================
// Detect Meter Tests
// =============================================================================

describe('detectMeter', () => {
  describe('basic meter detection', () => {
    it('detects iambic pentameter', () => {
      const result = detectMeter('0101010101');
      expect(result.footType).toBe('iamb');
      expect(result.lineLength).toBe('pentameter');
      expect(result.feetPerLine).toBe(5);
      expect(result.meterName).toBe('iambic pentameter');
      expect(result.regularity).toBe(1);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('detects iambic tetrameter', () => {
      const result = detectMeter('01010101');
      expect(result.footType).toBe('iamb');
      expect(result.lineLength).toBe('tetrameter');
      expect(result.feetPerLine).toBe(4);
      expect(result.meterName).toBe('iambic tetrameter');
    });

    it('detects trochaic tetrameter', () => {
      const result = detectMeter('10101010');
      expect(result.footType).toBe('trochee');
      expect(result.lineLength).toBe('tetrameter');
      expect(result.meterName).toBe('trochaic tetrameter');
    });

    it('detects anapestic tetrameter', () => {
      const result = detectMeter('001001001001');
      expect(result.footType).toBe('anapest');
      expect(result.lineLength).toBe('tetrameter');
      expect(result.meterName).toBe('anapestic tetrameter');
    });

    it('detects dactylic hexameter', () => {
      const result = detectMeter('100100100100100100');
      expect(result.footType).toBe('dactyl');
      expect(result.lineLength).toBe('hexameter');
      expect(result.meterName).toBe('dactylic hexameter');
    });
  });

  describe('secondary stress handling', () => {
    it('normalizes secondary stress to primary', () => {
      // Pattern with secondary stress (2) should be treated as stressed
      const result = detectMeter('0102010201');
      expect(result.footType).toBe('iamb');
      expect(result.lineLength).toBe('pentameter');
      expect(result.pattern).toBe('0101010101'); // 2s converted to 1s
    });
  });

  describe('imperfect patterns', () => {
    it('detects meter with deviations', () => {
      const result = detectMeter('0101010111');
      expect(result.footType).toBe('iamb');
      expect(result.lineLength).toBe('pentameter');
      expect(result.regularity).toBeLessThan(1);
      expect(result.regularity).toBeGreaterThan(0.8);
    });

    it('lowers confidence for short patterns', () => {
      const shortResult = detectMeter('01');
      const longResult = detectMeter('0101010101');
      expect(shortResult.confidence).toBeLessThan(longResult.confidence);
    });
  });

  describe('edge cases', () => {
    it('handles empty pattern', () => {
      const result = detectMeter('');
      expect(result.footType).toBe('unknown');
      expect(result.meterName).toBe('irregular');
      expect(result.regularity).toBe(0);
      expect(result.confidence).toBe(0);
    });

    it('handles irregular patterns', () => {
      // Pattern that doesn't fit any standard meter well
      const result = detectMeter('010110100');
      expect(result.footType).not.toBe('unknown');
      // Should still find a best match, but with lower confidence
      expect(result.confidence).toBeLessThan(0.9);
    });
  });
});

// =============================================================================
// Famous Poems Tests
// =============================================================================

describe('famous poems', () => {
  describe('Shakespeare - Sonnet 18 (iambic pentameter)', () => {
    // "Shall I compare thee to a summer's day?"
    // Stress: shall-I-com-PARE-thee-TO-a-SUM-mer's-DAY
    // Binary: 0   1  0   1    0   1  0  1    0     1
    it('detects iambic pentameter in first line', () => {
      const stressPattern = '0101010101';
      const result = detectMeter(stressPattern);
      expect(result.meterName).toBe('iambic pentameter');
      expect(result.regularity).toBe(1);
    });
  });

  describe('Robert Frost - Stopping by Woods (iambic tetrameter)', () => {
    // "Whose woods these are I think I know"
    // Stress: whose-WOODS-these-ARE-I-THINK-I-KNOW
    // Binary: 0     1     0     1   0  1    0  1
    it('detects iambic tetrameter', () => {
      const stressPattern = '01010101';
      const result = detectMeter(stressPattern);
      expect(result.meterName).toBe('iambic tetrameter');
    });
  });

  describe('Longfellow - Song of Hiawatha (trochaic tetrameter)', () => {
    // "By the shores of Gitche Gumee"
    // Stress: BY-the-SHORES-of-GIT-che-GU-mee
    // Binary: 1  0    1     0   1   0   1  0
    it('detects trochaic tetrameter', () => {
      const stressPattern = '10101010';
      const result = detectMeter(stressPattern);
      expect(result.meterName).toBe('trochaic tetrameter');
    });
  });

  describe('Byron - The Destruction of Sennacherib (anapestic tetrameter)', () => {
    // "The Assyrian came down like the wolf on the fold"
    // Stress: the-as-SYR-ian-came-DOWN-like-the-WOLF-on-the-FOLD
    // Binary: 0   0   1   0   0    1    0    0   1    0   0   1
    it('detects anapestic tetrameter', () => {
      const stressPattern = '001001001001';
      const result = detectMeter(stressPattern);
      expect(result.meterName).toBe('anapestic tetrameter');
    });
  });

  describe('Tennyson - The Charge of the Light Brigade (dactylic)', () => {
    // "Half a league, half a league"
    // Stress: HALF-a-league-HALF-a-league
    // Binary: 1    0  0      1    0  0
    it('detects dactylic dimeter', () => {
      const stressPattern = '100100';
      const result = detectMeter(stressPattern);
      expect(result.meterName).toBe('dactylic dimeter');
    });
  });

  describe('Poe - The Raven (trochaic octameter)', () => {
    // "Once upon a midnight dreary, while I pondered, weak and weary"
    // This line is actually trochaic octameter (8 trochees)
    // ONCE-u-PON-a-MID-night-DREAR-y-WHILE-I-PON-dered-WEAK-and-WEAR-y
    // 1   0  1  0  1   0     1    0  1    0  1   0     1    0   1    0
    it('detects trochaic octameter', () => {
      const stressPattern = '1010101010101010';
      const result = detectMeter(stressPattern);
      expect(result.meterName).toBe('trochaic octameter');
    });
  });

  describe('Emily Dickinson - Because I could not stop for Death (common meter)', () => {
    // Common meter alternates between iambic tetrameter and iambic trimeter
    // Line 1: "Because I could not stop for Death" (8 syllables, tetrameter)
    // Line 2: "He kindly stopped for me" (6 syllables, trimeter)
    it('detects iambic tetrameter in longer lines', () => {
      const stressPattern = '01010101';
      const result = detectMeter(stressPattern);
      expect(result.meterName).toBe('iambic tetrameter');
    });

    it('detects iambic trimeter in shorter lines', () => {
      const stressPattern = '010101';
      const result = detectMeter(stressPattern);
      expect(result.meterName).toBe('iambic trimeter');
    });
  });
});

// =============================================================================
// Multi-Line Meter Analysis Tests
// =============================================================================

describe('analyzeMultiLineMeter', () => {
  it('finds dominant meter across multiple lines', () => {
    // Four lines of iambic tetrameter
    const patterns = ['01010101', '01010101', '01010101', '01010101'];
    const result = analyzeMultiLineMeter(patterns);
    expect(result.meterName).toBe('iambic tetrameter');
    expect(result.regularity).toBe(1);
  });

  it('handles mixed meters', () => {
    // Three iambic tetrameter, one iambic trimeter (common in ballads)
    const patterns = ['01010101', '010101', '01010101', '010101'];
    const result = analyzeMultiLineMeter(patterns);
    // Should identify one of the two as dominant
    expect(['iambic tetrameter', 'iambic trimeter']).toContain(result.meterName);
  });

  it('returns lower regularity for inconsistent meters', () => {
    // Mix of iambic and trochaic
    const patterns = ['01010101', '10101010', '01010101', '10101010'];
    const result = analyzeMultiLineMeter(patterns);
    expect(result.regularity).toBeLessThan(1);
  });

  it('handles empty array', () => {
    const result = analyzeMultiLineMeter([]);
    expect(result.footType).toBe('unknown');
    expect(result.meterName).toBe('irregular');
  });

  it('handles single line', () => {
    const result = analyzeMultiLineMeter(['0101010101']);
    expect(result.meterName).toBe('iambic pentameter');
  });

  it('adjusts confidence based on meter consistency', () => {
    // All same meter = high confidence
    const consistentPatterns = ['0101010101', '0101010101', '0101010101'];
    const consistentResult = analyzeMultiLineMeter(consistentPatterns);

    // Mixed meters = lower confidence
    const mixedPatterns = ['0101010101', '10101010', '001001001'];
    const mixedResult = analyzeMultiLineMeter(mixedPatterns);

    expect(consistentResult.confidence).toBeGreaterThan(mixedResult.confidence);
  });
});

// =============================================================================
// Utility Function Tests
// =============================================================================

describe('createMeterPattern', () => {
  it('creates iambic patterns', () => {
    expect(createMeterPattern('iamb', 1)).toBe('01');
    expect(createMeterPattern('iamb', 3)).toBe('010101');
    expect(createMeterPattern('iamb', 5)).toBe('0101010101');
  });

  it('creates trochaic patterns', () => {
    expect(createMeterPattern('trochee', 4)).toBe('10101010');
  });

  it('creates anapestic patterns', () => {
    expect(createMeterPattern('anapest', 4)).toBe('001001001001');
  });

  it('creates dactylic patterns', () => {
    expect(createMeterPattern('dactyl', 3)).toBe('100100100');
  });

  it('creates spondaic patterns', () => {
    expect(createMeterPattern('spondee', 3)).toBe('111111');
  });

  it('uses iambic as default for unknown', () => {
    expect(createMeterPattern('unknown', 2)).toBe('0101');
  });
});

describe('getAllLineLengthNames', () => {
  it('returns all line length names', () => {
    const names = getAllLineLengthNames();
    expect(names).toContain('monometer');
    expect(names).toContain('dimeter');
    expect(names).toContain('trimeter');
    expect(names).toContain('tetrameter');
    expect(names).toContain('pentameter');
    expect(names).toContain('hexameter');
    expect(names).toContain('heptameter');
    expect(names).toContain('octameter');
    expect(names.length).toBe(8);
  });
});

describe('getAllFootTypes', () => {
  it('returns all foot types', () => {
    const types = getAllFootTypes();
    expect(types).toContain('iamb');
    expect(types).toContain('trochee');
    expect(types).toContain('anapest');
    expect(types).toContain('dactyl');
    expect(types).toContain('spondee');
    expect(types).toContain('unknown');
    expect(types.length).toBe(6);
  });
});

describe('footTypeToAdjective', () => {
  it('converts foot types to adjectives', () => {
    expect(footTypeToAdjective('iamb')).toBe('iambic');
    expect(footTypeToAdjective('trochee')).toBe('trochaic');
    expect(footTypeToAdjective('anapest')).toBe('anapestic');
    expect(footTypeToAdjective('dactyl')).toBe('dactylic');
    expect(footTypeToAdjective('spondee')).toBe('spondaic');
    expect(footTypeToAdjective('unknown')).toBe('irregular');
  });
});

describe('parseMeterName', () => {
  it('parses valid meter names', () => {
    const result = parseMeterName('iambic pentameter');
    expect(result?.footType).toBe('iamb');
    expect(result?.lineLength).toBe('pentameter');
  });

  it('parses with different capitalization', () => {
    const result = parseMeterName('TROCHAIC TETRAMETER');
    expect(result?.footType).toBe('trochee');
    expect(result?.lineLength).toBe('tetrameter');
  });

  it('parses anapestic meters', () => {
    const result = parseMeterName('anapestic tetrameter');
    expect(result?.footType).toBe('anapest');
    expect(result?.lineLength).toBe('tetrameter');
  });

  it('parses dactylic meters', () => {
    const result = parseMeterName('dactylic hexameter');
    expect(result?.footType).toBe('dactyl');
    expect(result?.lineLength).toBe('hexameter');
  });

  it('handles irregular meter', () => {
    const result = parseMeterName('irregular');
    expect(result?.footType).toBe('unknown');
  });

  it('returns null for unrecognized meters', () => {
    const result = parseMeterName('not a meter');
    expect(result).toBeNull();
  });
});

// =============================================================================
// Constants Tests
// =============================================================================

describe('FOOT_PATTERNS', () => {
  it('defines correct patterns for each foot type', () => {
    expect(FOOT_PATTERNS.iamb).toBe('01');
    expect(FOOT_PATTERNS.trochee).toBe('10');
    expect(FOOT_PATTERNS.anapest).toBe('001');
    expect(FOOT_PATTERNS.dactyl).toBe('100');
    expect(FOOT_PATTERNS.spondee).toBe('11');
    expect(FOOT_PATTERNS.unknown).toBe('');
  });
});

describe('LINE_LENGTH_NAMES', () => {
  it('maps feet counts to names', () => {
    expect(LINE_LENGTH_NAMES[1]).toBe('monometer');
    expect(LINE_LENGTH_NAMES[2]).toBe('dimeter');
    expect(LINE_LENGTH_NAMES[3]).toBe('trimeter');
    expect(LINE_LENGTH_NAMES[4]).toBe('tetrameter');
    expect(LINE_LENGTH_NAMES[5]).toBe('pentameter');
    expect(LINE_LENGTH_NAMES[6]).toBe('hexameter');
    expect(LINE_LENGTH_NAMES[7]).toBe('heptameter');
    expect(LINE_LENGTH_NAMES[8]).toBe('octameter');
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('integration tests', () => {
  it('full analysis workflow', () => {
    // Simulate analyzing a line of iambic pentameter
    const stressPattern = '0101010101';

    // Step 1: Detect meter
    const meterAnalysis = detectMeter(stressPattern);

    // Step 2: Verify components
    expect(meterAnalysis.footType).toBe('iamb');
    expect(meterAnalysis.lineLength).toBe('pentameter');

    // Step 3: Check regularity matches expectation
    const regularity = calculateRegularity(stressPattern, meterAnalysis.footType);
    expect(regularity).toBe(meterAnalysis.regularity);

    // Step 4: Verify no deviations
    const deviations = findDeviations(stressPattern, meterAnalysis.footType);
    expect(deviations).toHaveLength(0);
  });

  it('handles real-world imperfect meter', () => {
    // Real poems often have substitutions (e.g., trochaic substitution in iambic)
    // "When to the sessions of sweet silent thought"
    // This has a trochaic first foot: WHEN-to instead of when-TO
    // Approximate stress: 1 0 0 1 0 1 0 1 0 1
    const stressPattern = '1001010101';

    const result = detectMeter(stressPattern);

    // Should still detect as predominantly iambic
    expect(result.footType).toBe('iamb');
    expect(result.lineLength).toBe('pentameter');
    // But regularity should be less than perfect
    expect(result.regularity).toBeLessThan(1);
    expect(result.regularity).toBeGreaterThan(0.7);
  });

  it('correctly handles feminine endings', () => {
    // Feminine ending adds an extra unstressed syllable
    // "To be or not to be, that is the question"
    // 0 1 0 1 0 1 0 1 0 1 0 (11 syllables - feminine ending)
    const stressPattern = '01010101010';

    const result = detectMeter(stressPattern);

    // Should detect as iambic pentameter with extra syllable
    expect(result.footType).toBe('iamb');
    // The extra syllable might affect line length detection
    expect(['pentameter', 'hexameter']).toContain(result.lineLength);
  });
});
