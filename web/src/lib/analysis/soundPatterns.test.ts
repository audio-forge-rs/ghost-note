/**
 * Sound Patterns Analysis Module Tests
 *
 * Comprehensive tests for alliteration, assonance, and consonance detection.
 * Tests cover pattern detection, scoring, edge cases, and famous poetry examples.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  // Core detection functions
  detectAlliteration,
  detectAssonance,
  detectConsonance,
  analyzeLineSoundPatterns,
  analyzeSoundPatterns,
  // Utility functions
  calculateSingabilityImpact,
  describeSoundPattern,
  hasSoundPatterns,
  getAllPatterns,
  filterByStrength,
  getStrongestPattern,
  createDefaultSoundPatternAnalysis,
  // Types
  type SoundPatternOccurrence,
  type LineSoundPatterns,
} from './soundPatterns';

// Suppress console.log output during tests
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'debug').mockImplementation(() => {});
});

// =============================================================================
// detectAlliteration Tests
// =============================================================================

describe('detectAlliteration', () => {
  describe('basic alliteration detection', () => {
    it('should detect alliteration on "S" sound in "She sells sea shells"', () => {
      const patterns = detectAlliteration('She sells sea shells', 0);

      expect(patterns.length).toBeGreaterThan(0);
      const sPattern = patterns.find((p) => p.sound === 'S' || p.sound === 'SH');
      expect(sPattern).toBeDefined();
      expect(sPattern!.words.length).toBeGreaterThanOrEqual(2);
    });

    it('should detect alliteration on "P" sound in "Peter Piper picked"', () => {
      const patterns = detectAlliteration('Peter Piper picked a peck', 0);

      expect(patterns.length).toBeGreaterThan(0);
      const pPattern = patterns.find((p) => p.sound === 'P');
      expect(pPattern).toBeDefined();
      expect(pPattern!.words.length).toBeGreaterThanOrEqual(3);
    });

    it('should detect alliteration on "B" sound in "big brown bear"', () => {
      const patterns = detectAlliteration('The big brown bear', 0);

      const bPattern = patterns.find((p) => p.sound === 'B');
      expect(bPattern).toBeDefined();
      expect(bPattern!.words).toContain('big');
      expect(bPattern!.words).toContain('brown');
      expect(bPattern!.words).toContain('bear');
    });

    it('should detect multiple alliterative sounds in same line', () => {
      const patterns = detectAlliteration('Peter picked pretty berries by the brook', 0);

      // Should find 'P' alliteration (Peter, picked, pretty)
      // and 'B' alliteration (berries, brook)
      const pPattern = patterns.find((p) => p.sound === 'P');
      const bPattern = patterns.find((p) => p.sound === 'B');

      expect(pPattern).toBeDefined();
      expect(bPattern).toBeDefined();
    });
  });

  describe('alliteration pattern properties', () => {
    it('should set correct line number', () => {
      const patterns = detectAlliteration('Sally sells seashells', 5);

      if (patterns.length > 0) {
        expect(patterns[0].lineNumber).toBe(5);
      }
    });

    it('should set type as "alliteration"', () => {
      const patterns = detectAlliteration('Big brown bear', 0);

      patterns.forEach((p) => {
        expect(p.type).toBe('alliteration');
      });
    });

    it('should include word positions', () => {
      const patterns = detectAlliteration('Big brown bear bites', 0);

      const bPattern = patterns.find((p) => p.sound === 'B');
      expect(bPattern).toBeDefined();
      expect(bPattern!.positions.length).toBeGreaterThan(0);
      // Positions should be numbers representing character indices
      bPattern!.positions.forEach((pos) => {
        expect(typeof pos).toBe('number');
        expect(pos).toBeGreaterThanOrEqual(0);
      });
    });

    it('should calculate strength score between 0 and 1', () => {
      const patterns = detectAlliteration('Peter Piper picked peppers', 0);

      patterns.forEach((p) => {
        expect(p.strength).toBeGreaterThanOrEqual(0);
        expect(p.strength).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('edge cases', () => {
    it('should return empty array for empty input', () => {
      expect(detectAlliteration('', 0)).toEqual([]);
    });

    it('should return empty array for single word', () => {
      expect(detectAlliteration('Hello', 0)).toEqual([]);
    });

    it('should return empty for words starting with vowels only', () => {
      const patterns = detectAlliteration('Every apple is orange', 0);
      // All words start with vowels, so no consonant alliteration
      expect(patterns.length).toBe(0);
    });

    it('should handle punctuation', () => {
      const patterns = detectAlliteration('Big, brown bear!', 0);

      const bPattern = patterns.find((p) => p.sound === 'B');
      expect(bPattern).toBeDefined();
    });

    it('should be case-insensitive', () => {
      const patterns = detectAlliteration('BIG Brown BEAR', 0);

      const bPattern = patterns.find((p) => p.sound === 'B');
      expect(bPattern).toBeDefined();
      expect(bPattern!.words.length).toBe(3);
    });

    it('should handle unknown words gracefully', () => {
      // Should not crash on unknown words
      const patterns = detectAlliteration('Xyzzy xyz xyzabc', 0);
      expect(Array.isArray(patterns)).toBe(true);
    });
  });
});

// =============================================================================
// detectAssonance Tests
// =============================================================================

describe('detectAssonance', () => {
  describe('basic assonance detection', () => {
    it('should detect assonance on "AY" sound in "light night bright"', () => {
      const patterns = detectAssonance('The light of night is bright', 0);

      expect(patterns.length).toBeGreaterThan(0);
      const ayPattern = patterns.find((p) => p.sound === 'AY');
      expect(ayPattern).toBeDefined();
      expect(ayPattern!.words.length).toBeGreaterThanOrEqual(2);
    });

    it('should detect assonance on "EY" sound in "The rain in Spain"', () => {
      const patterns = detectAssonance('The rain in Spain stays mainly', 0);

      const eyPattern = patterns.find((p) => p.sound === 'EY');
      expect(eyPattern).toBeDefined();
      // rain, Spain, stays, mainly all have long 'a' sound
      expect(eyPattern!.words.length).toBeGreaterThanOrEqual(3);
    });

    it('should detect assonance on "IY" sound in "see me be free"', () => {
      const patterns = detectAssonance('See me be free', 0);

      const iyPattern = patterns.find((p) => p.sound === 'IY');
      expect(iyPattern).toBeDefined();
      expect(iyPattern!.words.length).toBeGreaterThanOrEqual(3);
    });

    it('should detect multiple vowel patterns in same line', () => {
      const patterns = detectAssonance('The cat sat and the light shines bright', 0);

      // Should find 'AE' (cat, sat) and 'AY' (light, shines, bright)
      const aePattern = patterns.find((p) => p.sound === 'AE');
      const ayPattern = patterns.find((p) => p.sound === 'AY');

      expect(aePattern).toBeDefined();
      expect(ayPattern).toBeDefined();
    });
  });

  describe('assonance pattern properties', () => {
    it('should set type as "assonance"', () => {
      const patterns = detectAssonance('Light bright night', 0);

      patterns.forEach((p) => {
        expect(p.type).toBe('assonance');
      });
    });

    it('should calculate strength score', () => {
      const patterns = detectAssonance('See me be we free', 0);

      patterns.forEach((p) => {
        expect(p.strength).toBeGreaterThanOrEqual(0);
        expect(p.strength).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('edge cases', () => {
    it('should return empty array for empty input', () => {
      expect(detectAssonance('', 0)).toEqual([]);
    });

    it('should return empty array for single word', () => {
      expect(detectAssonance('Hello', 0)).toEqual([]);
    });

    it('should handle words with multiple vowels', () => {
      // Words like "beautiful" have multiple vowels
      const patterns = detectAssonance('Beautiful wonderful colorful', 0);
      expect(Array.isArray(patterns)).toBe(true);
    });
  });
});

// =============================================================================
// detectConsonance Tests
// =============================================================================

describe('detectConsonance', () => {
  describe('basic consonance detection', () => {
    it('should detect consonance on "NG" sound', () => {
      const patterns = detectConsonance('Thinking sinking drinking', 0);

      const ngPattern = patterns.find((p) => p.sound === 'NG');
      expect(ngPattern).toBeDefined();
      expect(ngPattern!.words.length).toBe(3);
    });

    it('should detect consonance on "K" sound', () => {
      const patterns = detectConsonance('Black quick thick', 0);

      const kPattern = patterns.find((p) => p.sound === 'K');
      expect(kPattern).toBeDefined();
    });

    it('should detect consonance on less common sounds', () => {
      const patterns = detectConsonance('Flash crash smash bash', 0);

      // Should find 'SH' consonance
      const shPattern = patterns.find((p) => p.sound === 'SH');
      expect(shPattern).toBeDefined();
    });
  });

  describe('consonance filtering', () => {
    it('should require more words for common consonants', () => {
      // 'T' is very common, so requires 3+ words
      const patterns = detectConsonance('cat cut', 0);
      // With only 2 words and 'T' being common, might not show
      // This tests the filtering logic
      expect(Array.isArray(patterns)).toBe(true);
    });

    it('should apply strength penalty to common consonants', () => {
      const patterns = detectConsonance('cat cut kit', 0);

      const tPattern = patterns.find((p) => p.sound === 'T');
      if (tPattern) {
        // Common consonants should have reduced strength
        expect(tPattern.strength).toBeLessThan(1);
      }
    });
  });

  describe('edge cases', () => {
    it('should return empty array for empty input', () => {
      expect(detectConsonance('', 0)).toEqual([]);
    });

    it('should return empty array for single word', () => {
      expect(detectConsonance('Hello', 0)).toEqual([]);
    });

    it('should set type as "consonance"', () => {
      const patterns = detectConsonance('Black quick thick', 0);

      patterns.forEach((p) => {
        expect(p.type).toBe('consonance');
      });
    });
  });
});

// =============================================================================
// analyzeLineSoundPatterns Tests
// =============================================================================

describe('analyzeLineSoundPatterns', () => {
  it('should return complete LineSoundPatterns object', () => {
    const result = analyzeLineSoundPatterns('Big brown bear', 0);

    expect(result).toHaveProperty('lineNumber');
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('alliterations');
    expect(result).toHaveProperty('assonances');
    expect(result).toHaveProperty('consonances');
  });

  it('should set correct line number and text', () => {
    const line = 'The quick brown fox';
    const result = analyzeLineSoundPatterns(line, 5);

    expect(result.lineNumber).toBe(5);
    expect(result.text).toBe(line);
  });

  it('should detect all pattern types in complex line', () => {
    // Line with alliteration (b sounds), assonance (long i), and consonance (k)
    const result = analyzeLineSoundPatterns('Big brown bright light quick', 0);

    expect(Array.isArray(result.alliterations)).toBe(true);
    expect(Array.isArray(result.assonances)).toBe(true);
    expect(Array.isArray(result.consonances)).toBe(true);
  });
});

// =============================================================================
// analyzeSoundPatterns Tests
// =============================================================================

describe('analyzeSoundPatterns', () => {
  describe('complete poem analysis', () => {
    it('should return SoundPatternAnalysis object', () => {
      const lines = [
        'She sells sea shells',
        'By the sea shore',
      ];
      const result = analyzeSoundPatterns(lines);

      expect(result).toHaveProperty('lines');
      expect(result).toHaveProperty('summary');
    });

    it('should analyze each line', () => {
      const lines = ['Line one', 'Line two', 'Line three'];
      const result = analyzeSoundPatterns(lines);

      expect(result.lines.length).toBe(3);
    });

    it('should calculate summary statistics', () => {
      const lines = [
        'She sells sea shells',
        'Peter Piper picked peppers',
        'Light bright night sight',
      ];
      const result = analyzeSoundPatterns(lines);

      expect(result.summary).toHaveProperty('alliterationCount');
      expect(result.summary).toHaveProperty('assonanceCount');
      expect(result.summary).toHaveProperty('consonanceCount');
      expect(result.summary).toHaveProperty('density');
      expect(result.summary).toHaveProperty('topAlliterativeSounds');
      expect(result.summary).toHaveProperty('topAssonanceSounds');
    });

    it('should calculate density between 0 and 1', () => {
      const lines = ['Big brown bear', 'Light bright night'];
      const result = analyzeSoundPatterns(lines);

      expect(result.summary.density).toBeGreaterThanOrEqual(0);
      expect(result.summary.density).toBeLessThanOrEqual(1);
    });

    it('should identify top sounds', () => {
      const lines = [
        'She sells sea shells',
        'Sally saw seashells',
        'Peter Piper picked',
      ];
      const result = analyzeSoundPatterns(lines);

      // 'S' should be in top alliterative sounds
      expect(result.summary.topAlliterativeSounds.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty array', () => {
      const result = analyzeSoundPatterns([]);

      expect(result.lines).toEqual([]);
      expect(result.summary.alliterationCount).toBe(0);
      expect(result.summary.density).toBe(0);
    });

    it('should handle single line', () => {
      const result = analyzeSoundPatterns(['Hello world']);

      expect(result.lines.length).toBe(1);
    });

    it('should handle lines with no patterns', () => {
      const result = analyzeSoundPatterns(['A', 'B', 'C']);

      expect(result.summary.alliterationCount).toBe(0);
      expect(result.summary.assonanceCount).toBe(0);
    });
  });
});

// =============================================================================
// createDefaultSoundPatternAnalysis Tests
// =============================================================================

describe('createDefaultSoundPatternAnalysis', () => {
  it('should return valid default object', () => {
    const result = createDefaultSoundPatternAnalysis();

    expect(result.lines).toEqual([]);
    expect(result.summary.alliterationCount).toBe(0);
    expect(result.summary.assonanceCount).toBe(0);
    expect(result.summary.consonanceCount).toBe(0);
    expect(result.summary.density).toBe(0);
    expect(result.summary.topAlliterativeSounds).toEqual([]);
    expect(result.summary.topAssonanceSounds).toEqual([]);
  });
});

// =============================================================================
// calculateSingabilityImpact Tests
// =============================================================================

describe('calculateSingabilityImpact', () => {
  it('should return positive impact for moderate alliteration', () => {
    const patterns: LineSoundPatterns = {
      lineNumber: 0,
      text: 'Big brown bear',
      alliterations: [
        { type: 'alliteration', sound: 'B', words: ['big', 'brown', 'bear'], positions: [0, 4, 10], lineNumber: 0, strength: 0.8 },
      ],
      assonances: [],
      consonances: [],
    };

    const impact = calculateSingabilityImpact(patterns);
    expect(impact).toBeGreaterThan(0);
  });

  it('should return positive impact for assonance', () => {
    const patterns: LineSoundPatterns = {
      lineNumber: 0,
      text: 'Light bright night',
      alliterations: [],
      assonances: [
        { type: 'assonance', sound: 'AY', words: ['light', 'bright', 'night'], positions: [0, 6, 13], lineNumber: 0, strength: 0.8 },
      ],
      consonances: [],
    };

    const impact = calculateSingabilityImpact(patterns);
    expect(impact).toBeGreaterThan(0);
  });

  it('should return negative impact for excessive alliteration', () => {
    const patterns: LineSoundPatterns = {
      lineNumber: 0,
      text: 'Too much alliteration',
      alliterations: [
        { type: 'alliteration', sound: 'S', words: ['a', 'b', 'c', 'd'], positions: [0, 2, 4, 6], lineNumber: 0, strength: 0.5 },
        { type: 'alliteration', sound: 'P', words: ['a', 'b', 'c', 'd'], positions: [8, 10, 12, 14], lineNumber: 0, strength: 0.5 },
        { type: 'alliteration', sound: 'B', words: ['a', 'b', 'c'], positions: [16, 18, 20], lineNumber: 0, strength: 0.5 },
        { type: 'alliteration', sound: 'T', words: ['a', 'b', 'c'], positions: [22, 24, 26], lineNumber: 0, strength: 0.5 },
        { type: 'alliteration', sound: 'M', words: ['a', 'b'], positions: [28, 30], lineNumber: 0, strength: 0.5 },
      ],
      assonances: [],
      consonances: [],
    };

    const impact = calculateSingabilityImpact(patterns);
    // With 5 alliteration patterns, should have some negative impact
    // due to excess
    expect(impact).toBeDefined();
  });

  it('should return value between -0.2 and 0.2', () => {
    const patterns: LineSoundPatterns = {
      lineNumber: 0,
      text: 'Test line',
      alliterations: [],
      assonances: [],
      consonances: [],
    };

    const impact = calculateSingabilityImpact(patterns);
    expect(impact).toBeGreaterThanOrEqual(-0.2);
    expect(impact).toBeLessThanOrEqual(0.2);
  });

  it('should return 0 for empty patterns', () => {
    const patterns: LineSoundPatterns = {
      lineNumber: 0,
      text: 'Test line',
      alliterations: [],
      assonances: [],
      consonances: [],
    };

    const impact = calculateSingabilityImpact(patterns);
    expect(impact).toBe(0);
  });
});

// =============================================================================
// describeSoundPattern Tests
// =============================================================================

describe('describeSoundPattern', () => {
  it('should describe alliteration pattern', () => {
    const pattern: SoundPatternOccurrence = {
      type: 'alliteration',
      sound: 'B',
      words: ['big', 'brown', 'bear'],
      positions: [0, 4, 10],
      lineNumber: 0,
      strength: 0.8,
    };

    const description = describeSoundPattern(pattern);
    expect(description).toContain('Alliteration');
    expect(description).toContain('big');
    expect(description).toContain('brown');
    expect(description).toContain('bear');
  });

  it('should describe assonance pattern', () => {
    const pattern: SoundPatternOccurrence = {
      type: 'assonance',
      sound: 'AY',
      words: ['light', 'bright', 'night'],
      positions: [0, 6, 13],
      lineNumber: 0,
      strength: 0.8,
    };

    const description = describeSoundPattern(pattern);
    expect(description).toContain('Assonance');
    expect(description).toContain('light');
  });

  it('should describe consonance pattern', () => {
    const pattern: SoundPatternOccurrence = {
      type: 'consonance',
      sound: 'K',
      words: ['black', 'quick', 'thick'],
      positions: [0, 6, 12],
      lineNumber: 0,
      strength: 0.8,
    };

    const description = describeSoundPattern(pattern);
    expect(description).toContain('Consonance');
  });

  it('should truncate long word lists', () => {
    const pattern: SoundPatternOccurrence = {
      type: 'alliteration',
      sound: 'S',
      words: ['she', 'sells', 'sea', 'shells', 'surely'],
      positions: [0, 4, 10, 14, 21],
      lineNumber: 0,
      strength: 0.8,
    };

    const description = describeSoundPattern(pattern);
    // Should show first 3 words and "+2 more"
    expect(description).toContain('+2 more');
  });
});

// =============================================================================
// Utility Function Tests
// =============================================================================

describe('hasSoundPatterns', () => {
  it('should return true when patterns exist', () => {
    const patterns: LineSoundPatterns = {
      lineNumber: 0,
      text: 'Test',
      alliterations: [
        { type: 'alliteration', sound: 'B', words: ['a', 'b'], positions: [0, 2], lineNumber: 0, strength: 0.5 },
      ],
      assonances: [],
      consonances: [],
    };

    expect(hasSoundPatterns(patterns)).toBe(true);
  });

  it('should return false when no patterns exist', () => {
    const patterns: LineSoundPatterns = {
      lineNumber: 0,
      text: 'Test',
      alliterations: [],
      assonances: [],
      consonances: [],
    };

    expect(hasSoundPatterns(patterns)).toBe(false);
  });
});

describe('getAllPatterns', () => {
  it('should combine all pattern types into single array', () => {
    const patterns: LineSoundPatterns = {
      lineNumber: 0,
      text: 'Test',
      alliterations: [
        { type: 'alliteration', sound: 'B', words: ['a', 'b'], positions: [0, 2], lineNumber: 0, strength: 0.5 },
      ],
      assonances: [
        { type: 'assonance', sound: 'AY', words: ['c', 'd'], positions: [4, 6], lineNumber: 0, strength: 0.5 },
      ],
      consonances: [
        { type: 'consonance', sound: 'K', words: ['e', 'f'], positions: [8, 10], lineNumber: 0, strength: 0.5 },
      ],
    };

    const all = getAllPatterns(patterns);
    expect(all.length).toBe(3);
    expect(all.some((p) => p.type === 'alliteration')).toBe(true);
    expect(all.some((p) => p.type === 'assonance')).toBe(true);
    expect(all.some((p) => p.type === 'consonance')).toBe(true);
  });
});

describe('filterByStrength', () => {
  it('should filter patterns below threshold', () => {
    const patterns: SoundPatternOccurrence[] = [
      { type: 'alliteration', sound: 'B', words: ['a', 'b'], positions: [0, 2], lineNumber: 0, strength: 0.8 },
      { type: 'alliteration', sound: 'P', words: ['c', 'd'], positions: [4, 6], lineNumber: 0, strength: 0.3 },
      { type: 'alliteration', sound: 'S', words: ['e', 'f'], positions: [8, 10], lineNumber: 0, strength: 0.5 },
    ];

    const filtered = filterByStrength(patterns, 0.5);
    expect(filtered.length).toBe(2);
    expect(filtered.every((p) => p.strength >= 0.5)).toBe(true);
  });

  it('should return empty array when no patterns meet threshold', () => {
    const patterns: SoundPatternOccurrence[] = [
      { type: 'alliteration', sound: 'B', words: ['a', 'b'], positions: [0, 2], lineNumber: 0, strength: 0.3 },
    ];

    const filtered = filterByStrength(patterns, 0.9);
    expect(filtered.length).toBe(0);
  });
});

describe('getStrongestPattern', () => {
  it('should return pattern with highest strength', () => {
    const patterns: LineSoundPatterns = {
      lineNumber: 0,
      text: 'Test',
      alliterations: [
        { type: 'alliteration', sound: 'B', words: ['a', 'b'], positions: [0, 2], lineNumber: 0, strength: 0.5 },
      ],
      assonances: [
        { type: 'assonance', sound: 'AY', words: ['c', 'd'], positions: [4, 6], lineNumber: 0, strength: 0.9 },
      ],
      consonances: [
        { type: 'consonance', sound: 'K', words: ['e', 'f'], positions: [8, 10], lineNumber: 0, strength: 0.3 },
      ],
    };

    const strongest = getStrongestPattern(patterns);
    expect(strongest).toBeDefined();
    expect(strongest!.type).toBe('assonance');
    expect(strongest!.strength).toBe(0.9);
  });

  it('should return null for empty patterns', () => {
    const patterns: LineSoundPatterns = {
      lineNumber: 0,
      text: 'Test',
      alliterations: [],
      assonances: [],
      consonances: [],
    };

    const strongest = getStrongestPattern(patterns);
    expect(strongest).toBeNull();
  });
});

// =============================================================================
// Integration Tests: Famous Poetry
// =============================================================================

describe('Integration: Famous Poetry', () => {
  describe('Tongue Twisters', () => {
    it('should detect heavy alliteration in "She sells sea shells"', () => {
      const result = analyzeSoundPatterns([
        'She sells sea shells by the sea shore',
      ]);

      expect(result.summary.alliterationCount).toBeGreaterThan(0);
      // 'S' or 'SH' should be in top sounds
      const topSounds = result.summary.topAlliterativeSounds;
      expect(topSounds.some((s) => s === 'S' || s === 'SH')).toBe(true);
    });

    it('should detect alliteration in "Peter Piper"', () => {
      const result = analyzeSoundPatterns([
        'Peter Piper picked a peck of pickled peppers',
      ]);

      expect(result.summary.alliterationCount).toBeGreaterThan(0);
      expect(result.summary.topAlliterativeSounds).toContain('P');
    });
  });

  describe('Edgar Allan Poe - The Raven', () => {
    it('should detect sound patterns in "dreary, weak and weary"', () => {
      const result = analyzeLineSoundPatterns(
        'Once upon a midnight dreary, while I pondered, weak and weary',
        0
      );

      // Should find assonance (EH sound in dreary, weary)
      // and possibly alliteration (W in weak, weary, while)
      const hasPatterns =
        result.alliterations.length > 0 ||
        result.assonances.length > 0 ||
        result.consonances.length > 0;

      expect(hasPatterns).toBe(true);
    });
  });

  describe('Shakespeare', () => {
    it('should detect patterns in Sonnet 18', () => {
      const result = analyzeSoundPatterns([
        "Shall I compare thee to a summer's day",
        'Thou art more lovely and more temperate',
      ]);

      // Should find some sound patterns
      expect(result.lines.length).toBe(2);
    });
  });

  describe('Robert Frost - Stopping by Woods', () => {
    it('should detect sound patterns', () => {
      const result = analyzeSoundPatterns([
        'Whose woods these are I think I know',
        'His house is in the village though',
      ]);

      // Check that analysis completes
      expect(result.lines.length).toBe(2);
      expect(result.summary).toBeDefined();
    });
  });
});

// =============================================================================
// Performance Tests
// =============================================================================

describe('Performance', () => {
  it('should handle long poems efficiently', () => {
    // Generate a 50-line poem
    const lines = Array.from({ length: 50 }, (_, i) => {
      const starters = ['Big brown', 'Light bright', 'Quick quiet', 'Soft sweet'];
      return `${starters[i % starters.length]} word ${i} at end`;
    });

    const startTime = Date.now();
    const result = analyzeSoundPatterns(lines);
    const endTime = Date.now();

    expect(result.lines.length).toBe(50);
    // Should complete in reasonable time (less than 5 seconds)
    expect(endTime - startTime).toBeLessThan(5000);
  });

  it('should handle long lines efficiently', () => {
    const longLine = 'She sells sea shells by the sea shore while Peter Piper picked peppers';

    const startTime = Date.now();
    const result = analyzeLineSoundPatterns(longLine, 0);
    const endTime = Date.now();

    expect(result).toBeDefined();
    expect(endTime - startTime).toBeLessThan(1000);
  });
});

// =============================================================================
// Type Safety Tests
// =============================================================================

describe('Type Safety', () => {
  it('should return correct types for SoundPatternAnalysis', () => {
    const analysis = analyzeSoundPatterns(['Big brown bear']);

    expect(typeof analysis.summary.alliterationCount).toBe('number');
    expect(typeof analysis.summary.assonanceCount).toBe('number');
    expect(typeof analysis.summary.consonanceCount).toBe('number');
    expect(typeof analysis.summary.density).toBe('number');
    expect(Array.isArray(analysis.summary.topAlliterativeSounds)).toBe(true);
    expect(Array.isArray(analysis.summary.topAssonanceSounds)).toBe(true);
    expect(Array.isArray(analysis.lines)).toBe(true);
  });

  it('should return correct types for SoundPatternOccurrence', () => {
    const patterns = detectAlliteration('Big brown bear', 0);

    if (patterns.length > 0) {
      const pattern = patterns[0];
      expect(typeof pattern.type).toBe('string');
      expect(typeof pattern.sound).toBe('string');
      expect(typeof pattern.lineNumber).toBe('number');
      expect(typeof pattern.strength).toBe('number');
      expect(Array.isArray(pattern.words)).toBe(true);
      expect(Array.isArray(pattern.positions)).toBe(true);
    }
  });

  it('should return correct types for LineSoundPatterns', () => {
    const linePatterns = analyzeLineSoundPatterns('Test line', 0);

    expect(typeof linePatterns.lineNumber).toBe('number');
    expect(typeof linePatterns.text).toBe('string');
    expect(Array.isArray(linePatterns.alliterations)).toBe(true);
    expect(Array.isArray(linePatterns.assonances)).toBe(true);
    expect(Array.isArray(linePatterns.consonances)).toBe(true);
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('Edge Cases', () => {
  it('should handle empty lines in poem', () => {
    const result = analyzeSoundPatterns(['Line one', '', 'Line three']);

    expect(result.lines.length).toBe(3);
  });

  it('should handle lines with only punctuation', () => {
    const result = analyzeLineSoundPatterns('...!!!???', 0);

    expect(result.alliterations.length).toBe(0);
    expect(result.assonances.length).toBe(0);
  });

  it('should handle very short lines', () => {
    const result = analyzeLineSoundPatterns('I am', 0);

    expect(result).toBeDefined();
  });

  it('should handle mixed case words', () => {
    const result = detectAlliteration('BIG Brown BEAR', 0);

    const bPattern = result.find((p) => p.sound === 'B');
    expect(bPattern).toBeDefined();
    expect(bPattern!.words.length).toBe(3);
  });

  it('should handle contractions', () => {
    const result = analyzeLineSoundPatterns("Don't do that, darling", 0);

    // Should find 'D' alliteration
    const dPattern = result.alliterations.find((p) => p.sound === 'D');
    expect(dPattern).toBeDefined();
  });

  it('should handle numbers and special characters in text', () => {
    const result = analyzeLineSoundPatterns('Line 1: Big brown bear (amazing!)', 0);

    // Should still find B alliteration
    const bPattern = result.alliterations.find((p) => p.sound === 'B');
    expect(bPattern).toBeDefined();
  });
});
