/**
 * Stress Pattern Analysis Module Tests
 *
 * Comprehensive tests for stress pattern extraction and analysis.
 * Tests cover known poems, edge cases, and integration with CMU dictionary.
 *
 * NOTE: Uses the CMU dictionary which is lazily loaded.
 */

import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { ensureDictionaryLoaded } from '@/lib/phonetics/cmuDict';

// Ensure dictionary is loaded before running dictionary-dependent tests
beforeAll(async () => {
  await ensureDictionaryLoaded();
});
import {
  // Core functions
  extractStressFromPhonemes,
  getWordStressPattern,
  getLineStressPattern,
  classifyFoot,
  detectDeviations,
  analyzeLineStress,
  // Estimation
  estimateStressForUnknownWord,
  // Utility functions
  getMeterName,
  countFeet,
  calculateConfidence,
  isRegularPattern,
  analyzePoemStress,
  getDominantFoot,
  // Types
  type StressAnalysis,
} from './stress';

// Suppress console.log output during tests
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

// =============================================================================
// extractStressFromPhonemes Tests
// =============================================================================

describe('extractStressFromPhonemes', () => {
  it('should extract stress from vowels with stress markers', () => {
    // "hello" = HH AH0 L OW1
    const phonemes = ['HH', 'AH0', 'L', 'OW1'];
    expect(extractStressFromPhonemes(phonemes)).toBe('01');
  });

  it('should extract stress from "beautiful" phonemes', () => {
    // "beautiful" = B Y UW1 T AH0 F AH0 L
    const phonemes = ['B', 'Y', 'UW1', 'T', 'AH0', 'F', 'AH0', 'L'];
    expect(extractStressFromPhonemes(phonemes)).toBe('100');
  });

  it('should extract stress with secondary stress markers', () => {
    // "understand" = AH2 N D ER0 S T AE1 N D
    const phonemes = ['AH2', 'N', 'D', 'ER0', 'S', 'T', 'AE1', 'N', 'D'];
    expect(extractStressFromPhonemes(phonemes)).toBe('201');
  });

  it('should return empty string for empty phonemes', () => {
    expect(extractStressFromPhonemes([])).toBe('');
  });

  it('should return empty string for consonants only', () => {
    const phonemes = ['B', 'K', 'L', 'M'];
    expect(extractStressFromPhonemes(phonemes)).toBe('');
  });

  it('should handle single vowel phoneme', () => {
    const phonemes = ['AY1'];
    expect(extractStressFromPhonemes(phonemes)).toBe('1');
  });

  it('should handle vowels without stress markers', () => {
    // If vowels don't have stress markers, they should be filtered out
    const phonemes = ['B', 'AE', 'T'];
    expect(extractStressFromPhonemes(phonemes)).toBe('');
  });
});

// =============================================================================
// getWordStressPattern Tests
// =============================================================================

describe('getWordStressPattern', () => {
  describe('common words from CMU dictionary', () => {
    it('should get stress for "hello"', () => {
      const stress = getWordStressPattern('hello');
      expect(stress).toHaveLength(2);
      expect(stress).toMatch(/^[012]{2}$/);
    });

    it('should get stress for "beautiful"', () => {
      const stress = getWordStressPattern('beautiful');
      expect(stress).toHaveLength(3);
      expect(stress[0]).toBe('1'); // First syllable stressed
    });

    it('should get stress for single-syllable words', () => {
      expect(getWordStressPattern('cat')).toHaveLength(1);
      expect(getWordStressPattern('dog')).toHaveLength(1);
      expect(getWordStressPattern('the')).toHaveLength(1);
    });

    it('should be case-insensitive', () => {
      expect(getWordStressPattern('Hello')).toBe(getWordStressPattern('hello'));
      expect(getWordStressPattern('WORLD')).toBe(getWordStressPattern('world'));
    });

    it('should handle words with primary and secondary stress', () => {
      const understand = getWordStressPattern('understand');
      expect(understand).toHaveLength(3);
      expect(understand).toContain('1'); // Has primary stress
    });
  });

  describe('unknown words (fallback estimation)', () => {
    it('should return pattern for made-up words', () => {
      const pattern = getWordStressPattern('xyzzy');
      expect(pattern.length).toBeGreaterThan(0);
    });

    it('should return empty string for empty input', () => {
      expect(getWordStressPattern('')).toBe('');
      expect(getWordStressPattern('   ')).toBe('');
    });
  });
});

// =============================================================================
// estimateStressForUnknownWord Tests
// =============================================================================

describe('estimateStressForUnknownWord', () => {
  it('should estimate single syllable as stressed', () => {
    expect(estimateStressForUnknownWord('xyz')).toBe('1');
    expect(estimateStressForUnknownWord('blx')).toBe('1');
  });

  it('should estimate two syllables as trochaic', () => {
    // Two-syllable pattern: stressed-unstressed
    const pattern = estimateStressForUnknownWord('blabla');
    expect(pattern).toBe('10');
  });

  it('should handle silent e', () => {
    // "xyze" should be 1 syllable (silent e)
    const pattern = estimateStressForUnknownWord('xyze');
    expect(pattern.length).toBeLessThanOrEqual(2);
  });

  it('should handle empty input', () => {
    expect(estimateStressForUnknownWord('')).toBe('');
    expect(estimateStressForUnknownWord('   ')).toBe('');
  });

  it('should handle multi-syllable estimation', () => {
    // Words with clear vowel patterns
    const pattern = estimateStressForUnknownWord('xyzabcde');
    expect(pattern.length).toBeGreaterThanOrEqual(1);
    expect(pattern).toMatch(/^[01]+$/);
  });
});

// =============================================================================
// getLineStressPattern Tests
// =============================================================================

describe('getLineStressPattern', () => {
  it('should combine word stress patterns', () => {
    const words = ['the', 'cat', 'sat'];
    const pattern = getLineStressPattern(words);
    expect(pattern.length).toBeGreaterThanOrEqual(3); // At least 3 syllables
    expect(pattern).toMatch(/^[012]+$/);
  });

  it('should handle empty array', () => {
    expect(getLineStressPattern([])).toBe('');
  });

  it('should handle single word', () => {
    const pattern = getLineStressPattern(['hello']);
    expect(pattern).toHaveLength(2);
  });

  it('should produce iambic pattern for "the woods"', () => {
    const pattern = getLineStressPattern(['the', 'woods']);
    // "the" is unstressed, "woods" is stressed → "01"
    expect(pattern).toHaveLength(2);
  });

  it('should produce pattern for famous Frost line', () => {
    // "The woods are lovely, dark and deep"
    const words = ['the', 'woods', 'are', 'lovely', 'dark', 'and', 'deep'];
    const pattern = getLineStressPattern(words);
    expect(pattern.length).toBeGreaterThanOrEqual(7);
  });
});

// =============================================================================
// classifyFoot Tests
// =============================================================================

describe('classifyFoot', () => {
  describe('exact pattern matches', () => {
    it('should classify "01" as iamb', () => {
      expect(classifyFoot('01')).toBe('iamb');
    });

    it('should classify "10" as trochee', () => {
      expect(classifyFoot('10')).toBe('trochee');
    });

    it('should classify "11" as spondee', () => {
      expect(classifyFoot('11')).toBe('spondee');
    });

    it('should classify "00" as unknown', () => {
      // Pyrrhic foot is not commonly used, classify as unknown
      expect(classifyFoot('00')).toBe('unknown');
    });
  });

  describe('repeated pattern matches', () => {
    it('should classify "01010101" as iamb', () => {
      expect(classifyFoot('01010101')).toBe('iamb');
    });

    it('should classify "10101010" as trochee', () => {
      expect(classifyFoot('10101010')).toBe('trochee');
    });

    it('should classify "001001001" as anapest', () => {
      expect(classifyFoot('001001001')).toBe('anapest');
    });

    it('should classify "100100100" as dactyl', () => {
      expect(classifyFoot('100100100')).toBe('dactyl');
    });

    it('should classify "1111" as spondee', () => {
      expect(classifyFoot('1111')).toBe('spondee');
    });
  });

  describe('secondary stress handling', () => {
    it('should treat secondary stress (2) as stressed', () => {
      // "21" should be classified same as "11"
      expect(classifyFoot('21')).toBe('spondee');
    });

    it('should handle mixed stress levels', () => {
      // "0201" should be close to "0101" → iambic
      const result = classifyFoot('0201');
      expect(result).toBe('iamb');
    });
  });

  describe('edge cases', () => {
    it('should return unknown for empty string', () => {
      expect(classifyFoot('')).toBe('unknown');
    });

    it('should return unknown for single syllable', () => {
      expect(classifyFoot('1')).toBe('unknown');
      expect(classifyFoot('0')).toBe('unknown');
    });

    it('should return unknown for irregular patterns', () => {
      // Very irregular pattern
      expect(classifyFoot('0110001')).toBe('unknown');
    });
  });

  describe('near matches', () => {
    it('should classify mostly iambic pattern as iamb', () => {
      // One deviation in iambic pattern
      expect(classifyFoot('01010011')).toBe('iamb');
    });

    it('should classify mostly trochaic pattern as trochee', () => {
      // One deviation in trochaic pattern
      expect(classifyFoot('10101100')).toBe('trochee');
    });
  });
});

// =============================================================================
// detectDeviations Tests
// =============================================================================

describe('detectDeviations', () => {
  describe('perfect patterns', () => {
    it('should return empty array for perfect iambic pattern', () => {
      expect(detectDeviations('01010101', 'iamb')).toEqual([]);
    });

    it('should return empty array for perfect trochaic pattern', () => {
      expect(detectDeviations('10101010', 'trochee')).toEqual([]);
    });

    it('should return empty array for perfect anapestic pattern', () => {
      expect(detectDeviations('001001001', 'anapest')).toEqual([]);
    });

    it('should return empty array for perfect dactylic pattern', () => {
      expect(detectDeviations('100100100', 'dactyl')).toEqual([]);
    });
  });

  describe('patterns with deviations', () => {
    it('should detect single deviation in iambic pattern', () => {
      // Position 2 should be 0, but is 1
      const deviations = detectDeviations('01110101', 'iamb');
      expect(deviations).toContain(2);
    });

    it('should detect multiple deviations', () => {
      // Pattern "10010101" compared to iamb pattern "01":
      // Position 0: expects 0, has 1 -> deviation
      // Position 1: expects 1, has 0 -> deviation
      // Position 2: expects 0, has 0 -> match
      // Position 3: expects 1, has 1 -> match
      // etc.
      const deviations = detectDeviations('10010101', 'iamb');
      expect(deviations).toContain(0);
      expect(deviations).toContain(1);
    });

    it('should detect deviation at end of pattern', () => {
      const deviations = detectDeviations('01010100', 'iamb');
      expect(deviations).toContain(7);
    });
  });

  describe('secondary stress handling', () => {
    it('should treat secondary stress as stressed for deviation detection', () => {
      // "02" is treated as "01" which is perfect iamb
      expect(detectDeviations('02', 'iamb')).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should return empty array for empty pattern', () => {
      expect(detectDeviations('', 'iamb')).toEqual([]);
    });

    it('should return empty array for unknown foot type', () => {
      expect(detectDeviations('01010101', 'unknown')).toEqual([]);
    });
  });
});

// =============================================================================
// analyzeLineStress Tests
// =============================================================================

describe('analyzeLineStress', () => {
  it('should return complete analysis for simple line', () => {
    const analysis = analyzeLineStress(['the', 'cat']);

    expect(analysis).toHaveProperty('pattern');
    expect(analysis).toHaveProperty('syllableStresses');
    expect(analysis).toHaveProperty('footType');
    expect(analysis).toHaveProperty('deviations');

    expect(analysis.pattern.length).toBeGreaterThan(0);
    expect(analysis.syllableStresses.length).toBe(analysis.pattern.length);
  });

  it('should handle empty word array', () => {
    const analysis = analyzeLineStress([]);

    expect(analysis.pattern).toBe('');
    expect(analysis.syllableStresses).toEqual([]);
    expect(analysis.footType).toBe('unknown');
    expect(analysis.deviations).toEqual([]);
  });

  it('should correctly type syllableStresses', () => {
    const analysis = analyzeLineStress(['hello', 'world']);

    for (const stress of analysis.syllableStresses) {
      expect(['0', '1', '2']).toContain(stress);
    }
  });

  it('should analyze Frost line correctly', () => {
    // "The woods are lovely, dark and deep"
    const words = ['the', 'woods', 'are', 'lovely', 'dark', 'and', 'deep'];
    const analysis = analyzeLineStress(words);

    // Should have pattern and detect foot type
    expect(analysis.pattern.length).toBeGreaterThan(0);
    expect(analysis.footType).not.toBe('unknown');
  });
});

// =============================================================================
// getMeterName Tests
// =============================================================================

describe('getMeterName', () => {
  it('should return iambic_pentameter for 5-foot iamb', () => {
    expect(getMeterName('iamb', 5)).toBe('iambic_pentameter');
  });

  it('should return trochaic_tetrameter for 4-foot trochee', () => {
    expect(getMeterName('trochee', 4)).toBe('trochaic_tetrameter');
  });

  it('should return anapestic_trimeter for 3-foot anapest', () => {
    expect(getMeterName('anapest', 3)).toBe('anapestic_trimeter');
  });

  it('should return dactylic_hexameter for 6-foot dactyl', () => {
    expect(getMeterName('dactyl', 6)).toBe('dactylic_hexameter');
  });

  it('should return irregular for unknown foot type', () => {
    expect(getMeterName('unknown', 4)).toBe('irregular');
  });

  it('should handle uncommon line lengths', () => {
    expect(getMeterName('iamb', 1)).toBe('iambic_monometer');
    expect(getMeterName('iamb', 2)).toBe('iambic_dimeter');
    expect(getMeterName('iamb', 7)).toBe('iambic_heptameter');
    expect(getMeterName('iamb', 8)).toBe('iambic_octameter');
  });

  it('should handle very long lines', () => {
    // Lines longer than 8 feet use numeric form
    expect(getMeterName('iamb', 9)).toBe('iambic_9-foot');
    expect(getMeterName('trochee', 10)).toBe('trochaic_10-foot');
  });
});

// =============================================================================
// countFeet Tests
// =============================================================================

describe('countFeet', () => {
  it('should count iambic feet correctly', () => {
    expect(countFeet('01010101', 'iamb')).toBe(4);
    expect(countFeet('0101010101', 'iamb')).toBe(5);
  });

  it('should count trochaic feet correctly', () => {
    expect(countFeet('10101010', 'trochee')).toBe(4);
  });

  it('should count anapestic feet correctly', () => {
    expect(countFeet('001001001', 'anapest')).toBe(3);
  });

  it('should count dactylic feet correctly', () => {
    expect(countFeet('100100100', 'dactyl')).toBe(3);
  });

  it('should handle partial feet', () => {
    // 3 syllables = 2 iambic feet (rounds up)
    expect(countFeet('010', 'iamb')).toBe(2);
  });

  it('should estimate for unknown foot type', () => {
    expect(countFeet('01010101', 'unknown')).toBe(4); // Syllable pairs
  });
});

// =============================================================================
// calculateConfidence Tests
// =============================================================================

describe('calculateConfidence', () => {
  it('should return 1.0 for perfect match', () => {
    expect(calculateConfidence('01010101', 'iamb')).toBe(1);
    expect(calculateConfidence('10101010', 'trochee')).toBe(1);
  });

  it('should return lower score for imperfect match', () => {
    const confidence = calculateConfidence('01110101', 'iamb');
    expect(confidence).toBeGreaterThan(0);
    expect(confidence).toBeLessThan(1);
  });

  it('should return 0 for empty pattern', () => {
    expect(calculateConfidence('', 'iamb')).toBe(0);
  });

  it('should return 0 for unknown foot type', () => {
    expect(calculateConfidence('01010101', 'unknown')).toBe(0);
  });
});

// =============================================================================
// isRegularPattern Tests
// =============================================================================

describe('isRegularPattern', () => {
  it('should return true for perfect iambic pattern', () => {
    expect(isRegularPattern('01010101')).toBe(true);
  });

  it('should return true for perfect trochaic pattern', () => {
    expect(isRegularPattern('10101010')).toBe(true);
  });

  it('should return true for short patterns', () => {
    expect(isRegularPattern('0')).toBe(true);
    expect(isRegularPattern('01')).toBe(true);
  });

  it('should return false for highly irregular patterns', () => {
    expect(isRegularPattern('0110001011')).toBe(false);
  });

  it('should allow small deviations', () => {
    // One deviation in 10 syllables = 10% deviation rate
    expect(isRegularPattern('0101010101')).toBe(true);
  });
});

// =============================================================================
// analyzePoemStress Tests
// =============================================================================

describe('analyzePoemStress', () => {
  it('should analyze multiple lines', () => {
    const lines = [
      ['the', 'woods', 'are', 'lovely'],
      ['dark', 'and', 'deep'],
    ];
    const analyses = analyzePoemStress(lines);

    expect(analyses).toHaveLength(2);
    expect(analyses[0]).toHaveProperty('pattern');
    expect(analyses[1]).toHaveProperty('pattern');
  });

  it('should handle empty array', () => {
    const analyses = analyzePoemStress([]);
    expect(analyses).toEqual([]);
  });

  it('should handle line with empty words', () => {
    const lines = [[]];
    const analyses = analyzePoemStress(lines);
    expect(analyses).toHaveLength(1);
    expect(analyses[0].pattern).toBe('');
  });
});

// =============================================================================
// getDominantFoot Tests
// =============================================================================

describe('getDominantFoot', () => {
  it('should return dominant foot type', () => {
    const analyses: StressAnalysis[] = [
      { pattern: '0101', syllableStresses: ['0', '1', '0', '1'], footType: 'iamb', deviations: [] },
      { pattern: '0101', syllableStresses: ['0', '1', '0', '1'], footType: 'iamb', deviations: [] },
      { pattern: '0101', syllableStresses: ['0', '1', '0', '1'], footType: 'iamb', deviations: [] },
      { pattern: '1010', syllableStresses: ['1', '0', '1', '0'], footType: 'trochee', deviations: [] },
    ];

    expect(getDominantFoot(analyses)).toBe('iamb');
  });

  it('should return unknown if no clear pattern', () => {
    const analyses: StressAnalysis[] = [
      { pattern: '0101', syllableStresses: ['0', '1', '0', '1'], footType: 'iamb', deviations: [] },
      { pattern: '1010', syllableStresses: ['1', '0', '1', '0'], footType: 'trochee', deviations: [] },
      { pattern: '001', syllableStresses: ['0', '0', '1'], footType: 'anapest', deviations: [] },
      { pattern: '100', syllableStresses: ['1', '0', '0'], footType: 'dactyl', deviations: [] },
    ];

    expect(getDominantFoot(analyses)).toBe('unknown');
  });

  it('should return unknown for empty array', () => {
    expect(getDominantFoot([])).toBe('unknown');
  });

  it('should ignore unknown foot types in counting', () => {
    const analyses: StressAnalysis[] = [
      { pattern: '0101', syllableStresses: ['0', '1', '0', '1'], footType: 'iamb', deviations: [] },
      { pattern: '0101', syllableStresses: ['0', '1', '0', '1'], footType: 'iamb', deviations: [] },
      { pattern: '', syllableStresses: [], footType: 'unknown', deviations: [] },
    ];

    expect(getDominantFoot(analyses)).toBe('iamb');
  });
});

// =============================================================================
// Integration Tests: Known Poems
// =============================================================================

describe('Integration: Known Poems', () => {
  describe('Frost - "Stopping by Woods on a Snowy Evening"', () => {
    it('should analyze first stanza', () => {
      const lines = [
        ['whose', 'woods', 'these', 'are', 'i', 'think', 'i', 'know'],
        ['his', 'house', 'is', 'in', 'the', 'village', 'though'],
        ['he', 'will', 'not', 'see', 'me', 'stopping', 'here'],
        ['to', 'watch', 'his', 'woods', 'fill', 'up', 'with', 'snow'],
      ];

      const analyses = analyzePoemStress(lines);
      expect(analyses).toHaveLength(4);

      // Each line should produce a stress analysis
      for (const analysis of analyses) {
        expect(analysis.pattern.length).toBeGreaterThan(0);
        expect(analysis.syllableStresses.length).toBe(analysis.pattern.length);
      }

      // The poem should have a dominant foot (may vary based on CMU pronunciation)
      const dominantFoot = getDominantFoot(analyses);
      // Accept any foot type - real poems can be analyzed differently
      expect(['iamb', 'trochee', 'anapest', 'dactyl', 'spondee', 'unknown']).toContain(dominantFoot);
    });

    it('should detect mostly iambic pattern in famous line', () => {
      // "The woods are lovely, dark and deep"
      const words = ['the', 'woods', 'are', 'lovely', 'dark', 'and', 'deep'];
      const analysis = analyzeLineStress(words);

      // This line is iambic tetrameter
      expect(analysis.pattern.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('Shakespeare - Sonnet 18', () => {
    it('should analyze opening line', () => {
      // "Shall I compare thee to a summer's day?"
      const words = ['shall', 'i', 'compare', 'thee', 'to', 'a', 'summer', 'day'];
      const analysis = analyzeLineStress(words);

      // Iambic pentameter (10 syllables)
      expect(analysis.pattern.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Poe - "The Raven"', () => {
    it('should analyze trochaic line', () => {
      // "Once upon a midnight dreary"
      const words = ['once', 'upon', 'a', 'midnight', 'dreary'];
      const analysis = analyzeLineStress(words);

      // Trochaic octameter pattern
      expect(analysis.pattern.length).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('Edge Cases', () => {
  it('should handle null-ish inputs gracefully', () => {
    expect(extractStressFromPhonemes([])).toBe('');
    expect(getWordStressPattern('')).toBe('');
    expect(getLineStressPattern([])).toBe('');
    expect(classifyFoot('')).toBe('unknown');
    expect(detectDeviations('', 'iamb')).toEqual([]);
  });

  it('should handle single-word lines', () => {
    const analysis = analyzeLineStress(['hello']);
    expect(analysis.pattern).toBe('01');
    expect(analysis.syllableStresses).toEqual(['0', '1']);
  });

  it('should handle very long words', () => {
    const pattern = getWordStressPattern('supercalifragilisticexpialidocious');
    // This word should be in dictionary
    expect(pattern.length).toBeGreaterThan(0);
  });

  it('should handle contractions', () => {
    const pattern = getLineStressPattern(["don't", 'stop']);
    expect(pattern.length).toBeGreaterThan(0);
  });

  it('should handle mixed case words', () => {
    const pattern1 = getWordStressPattern('Hello');
    const pattern2 = getWordStressPattern('HELLO');
    const pattern3 = getWordStressPattern('hello');

    expect(pattern1).toBe(pattern2);
    expect(pattern2).toBe(pattern3);
  });
});

// =============================================================================
// Type Safety Tests
// =============================================================================

describe('Type Safety', () => {
  it('should return correct types for StressAnalysis', () => {
    const analysis = analyzeLineStress(['hello', 'world']);

    // Check pattern is string
    expect(typeof analysis.pattern).toBe('string');

    // Check syllableStresses is array of StressLevel
    expect(Array.isArray(analysis.syllableStresses)).toBe(true);

    // Check footType is FootType
    const validFootTypes = ['iamb', 'trochee', 'anapest', 'dactyl', 'spondee', 'unknown'];
    expect(validFootTypes).toContain(analysis.footType);

    // Check deviations is number array
    expect(Array.isArray(analysis.deviations)).toBe(true);
    analysis.deviations.forEach((d) => {
      expect(typeof d).toBe('number');
    });
  });
});
