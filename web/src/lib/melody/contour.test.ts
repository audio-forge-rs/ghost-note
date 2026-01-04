import { describe, it, expect } from 'vitest';
import {
  generatePhraseContour,
  applyScale,
  adjustForStress,
  applyEmotionalModifiers,
  constrainToRange,
  generateMelodicContour,
  parseABCPitch,
  DEFAULT_RANGES,
  SCALES,
  type Scale,
  type VocalRange,
  type EmotionParams,
} from './contour';

// =============================================================================
// generatePhraseContour Tests
// =============================================================================

describe('generatePhraseContour', () => {
  describe('basic contour generation', () => {
    it('returns empty array for length 0', () => {
      const contour = generatePhraseContour(0);
      expect(contour).toEqual([]);
    });

    it('returns empty array for negative length', () => {
      const contour = generatePhraseContour(-5);
      expect(contour).toEqual([]);
    });

    it('returns [0] for single note phrase', () => {
      const contour = generatePhraseContour(1);
      expect(contour).toEqual([0]);
    });

    it('returns simple contour for 2-note phrase', () => {
      const contour = generatePhraseContour(2);
      expect(contour).toHaveLength(2);
      expect(contour[0]).toBe(0);
      expect(contour[1]).toBeGreaterThan(0); // Should rise
    });

    it('returns correct length for any positive input', () => {
      for (let len = 1; len <= 20; len++) {
        const contour = generatePhraseContour(len);
        expect(contour).toHaveLength(len);
      }
    });
  });

  describe('arch shape properties', () => {
    it('creates an arch shape (rises then falls)', () => {
      const contour = generatePhraseContour(8);

      // Find the peak
      const maxValue = Math.max(...contour);
      const peakIndex = contour.indexOf(maxValue);

      // Peak should be roughly in the middle-to-later portion (around 60%)
      expect(peakIndex).toBeGreaterThan(0);
      expect(peakIndex).toBeLessThan(contour.length - 1);

      // Values before peak should generally be lower than peak
      for (let i = 0; i < peakIndex; i++) {
        expect(contour[i]).toBeLessThanOrEqual(maxValue);
      }

      // Values after peak should generally be lower than peak
      for (let i = peakIndex + 1; i < contour.length; i++) {
        expect(contour[i]).toBeLessThanOrEqual(maxValue);
      }
    });

    it('starts near the root (low value)', () => {
      const contour = generatePhraseContour(10);
      expect(contour[0]).toBeLessThanOrEqual(1);
    });

    it('ends lower than the peak', () => {
      const contour = generatePhraseContour(10);
      const maxValue = Math.max(...contour);
      expect(contour[contour.length - 1]).toBeLessThan(maxValue);
    });

    it('has peak around 60% through the phrase', () => {
      const contour = generatePhraseContour(10);
      const maxValue = Math.max(...contour);
      const peakIndex = contour.indexOf(maxValue);

      // Peak should be between 50% and 70%
      const peakRatio = peakIndex / contour.length;
      expect(peakRatio).toBeGreaterThanOrEqual(0.5);
      expect(peakRatio).toBeLessThanOrEqual(0.7);
    });
  });

  describe('all values are non-negative', () => {
    it('produces only non-negative values', () => {
      for (let len = 1; len <= 15; len++) {
        const contour = generatePhraseContour(len);
        contour.forEach((value) => {
          expect(value).toBeGreaterThanOrEqual(0);
        });
      }
    });
  });

  describe('peak height scales with phrase length', () => {
    it('shorter phrases have smaller peaks', () => {
      const short = generatePhraseContour(4);
      const long = generatePhraseContour(12);

      const shortMax = Math.max(...short);
      const longMax = Math.max(...long);

      expect(longMax).toBeGreaterThanOrEqual(shortMax);
    });

    it('peak is capped at reasonable value', () => {
      const veryLong = generatePhraseContour(50);
      const maxValue = Math.max(...veryLong);

      // Maximum peak should be capped
      expect(maxValue).toBeLessThanOrEqual(6);
    });
  });
});

// =============================================================================
// applyScale Tests
// =============================================================================

describe('applyScale', () => {
  describe('basic scale application', () => {
    it('returns empty array for empty contour', () => {
      const pitches = applyScale([], 'major', 'C');
      expect(pitches).toEqual([]);
    });

    it('converts [0] to root pitch', () => {
      const pitches = applyScale([0], 'major', 'C');
      expect(pitches).toHaveLength(1);
      expect(pitches[0]).toBe('C');
    });

    it('returns correct length for any contour', () => {
      const contour = [0, 1, 2, 3, 4, 3, 2, 1, 0];
      const pitches = applyScale(contour, 'major', 'C');
      expect(pitches).toHaveLength(contour.length);
    });
  });

  describe('major scale', () => {
    it('maps scale degrees correctly in C major', () => {
      // C major: C D E F G A B c
      const contour = [0, 1, 2, 3, 4, 5, 6];
      const pitches = applyScale(contour, 'major', 'C');

      expect(pitches[0]).toBe('C');
      expect(pitches[1]).toBe('D');
      expect(pitches[2]).toBe('E');
      expect(pitches[3]).toBe('F');
      expect(pitches[4]).toBe('G');
      expect(pitches[5]).toBe('A');
      expect(pitches[6]).toBe('B');
    });

    it('handles octave crossings', () => {
      const contour = [7]; // One octave up
      const pitches = applyScale(contour, 'major', 'C');
      // Should be in the next octave (lowercase in ABC notation)
      expect(pitches[0]).toBe('c');
    });
  });

  describe('minor scale', () => {
    it('maps scale degrees correctly in A minor', () => {
      // A minor: A B C D E F G a
      // Starting at A (octave 0), C is in the next octave (lowercase in ABC)
      const contour = [0, 1, 2, 3, 4, 5, 6];
      const pitches = applyScale(contour, 'minor', 'A');

      expect(pitches[0]).toBe('A');
      expect(pitches[1]).toBe('B');
      // C is in the next octave because A + 3 semitones = C one octave up
      expect(pitches[2]).toBe('c'); // lowercase = octave 1
    });
  });

  describe('dorian scale', () => {
    it('correctly applies dorian mode', () => {
      const contour = [0, 1, 2, 3];
      const pitches = applyScale(contour, 'dorian', 'D');

      expect(pitches[0]).toBe('D');
      expect(pitches[1]).toBe('E');
      expect(pitches[2]).toBe('F');
      expect(pitches[3]).toBe('G');
    });
  });

  describe('mixolydian scale', () => {
    it('correctly applies mixolydian mode', () => {
      // G mixolydian: G A B C D E F g
      // Starting at G (octave 0), C is in the next octave (lowercase in ABC)
      const contour = [0, 1, 2, 3, 4];
      const pitches = applyScale(contour, 'mixolydian', 'G');

      expect(pitches[0]).toBe('G');
      expect(pitches[1]).toBe('A');
      expect(pitches[2]).toBe('B');
      // C is in the next octave because G + 5 semitones = C one octave up
      expect(pitches[3]).toBe('c'); // lowercase = octave 1
    });
  });

  describe('different root pitches', () => {
    it('works with G as root', () => {
      const contour = [0, 1, 2];
      const pitches = applyScale(contour, 'major', 'G');

      expect(pitches[0]).toBe('G');
      expect(pitches[1]).toBe('A');
      expect(pitches[2]).toBe('B');
    });

    it('works with F as root', () => {
      const contour = [0, 1, 2];
      const pitches = applyScale(contour, 'major', 'F');

      expect(pitches[0]).toBe('F');
      expect(pitches[1]).toBe('G');
      expect(pitches[2]).toBe('A');
    });
  });
});

// =============================================================================
// adjustForStress Tests
// =============================================================================

describe('adjustForStress', () => {
  describe('basic stress adjustment', () => {
    it('returns empty array for empty pitches', () => {
      const result = adjustForStress([], '0101');
      expect(result).toEqual([]);
    });

    it('returns copy for empty stress pattern', () => {
      const pitches = ['C', 'D', 'E'];
      const result = adjustForStress(pitches, '');
      expect(result).toEqual(pitches);
    });

    it('returns correct length', () => {
      const pitches = ['C', 'D', 'E', 'F'];
      const result = adjustForStress(pitches, '0101');
      expect(result).toHaveLength(4);
    });
  });

  describe('stress bumping', () => {
    it('leaves unstressed syllables unchanged', () => {
      const pitches = ['C', 'D', 'E', 'F'];
      const result = adjustForStress(pitches, '0000');
      expect(result).toEqual(pitches);
    });

    it('bumps stressed syllables higher', () => {
      const pitches = ['C', 'D', 'E', 'F'];
      const result = adjustForStress(pitches, '0101');

      // Unstressed should stay the same
      expect(result[0]).toBe('C');
      expect(result[2]).toBe('E');

      // Stressed should be bumped up
      expect(result[1]).not.toBe('D'); // Should be higher than D
      expect(result[3]).not.toBe('F'); // Should be higher than F
    });

    it('handles secondary stress (2)', () => {
      const pitches = ['C', 'D', 'E'];
      const result = adjustForStress(pitches, '021');

      // Position 1 (secondary) should be bumped
      expect(result[1]).not.toBe('D');
    });

    it('handles mixed stress patterns', () => {
      const pitches = ['C', 'D', 'E', 'F', 'G'];
      const result = adjustForStress(pitches, '01021');

      // Check that stressed positions are different
      expect(result[1]).not.toBe('D');
      expect(result[3]).not.toBe('F');
    });
  });

  describe('octave handling', () => {
    it('handles octave transitions when bumping B to C', () => {
      const pitches = ['B'];
      const result = adjustForStress(pitches, '1');

      // B bumped up should become C in the next octave
      const parsed = parseABCPitch(result[0]);
      expect(parsed.pitch).toBe('C');
      expect(parsed.octave).toBe(1); // Higher octave
    });

    it('preserves octave for notes not crossing boundary', () => {
      const pitches = ['C', 'D', 'E'];
      const result = adjustForStress(pitches, '111');

      // All should be bumped but stay in same general range
      result.forEach((pitch) => {
        const parsed = parseABCPitch(pitch);
        expect(parsed.octave).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('ABC notation handling', () => {
    it('handles lowercase (high octave) pitches', () => {
      const pitches = ['c', 'd', 'e'];
      const result = adjustForStress(pitches, '101');

      expect(result).toHaveLength(3);
    });

    it('handles comma notation (low octave)', () => {
      const pitches = ['C,', 'D,', 'E,'];
      const result = adjustForStress(pitches, '010');

      expect(result).toHaveLength(3);
    });
  });
});

// =============================================================================
// applyEmotionalModifiers Tests
// =============================================================================

describe('applyEmotionalModifiers', () => {
  const baseEmotion: EmotionParams = {
    mode: 'major',
    intensity: 0.5,
    register: 'middle',
  };

  describe('basic operation', () => {
    it('returns empty array for empty pitches', () => {
      const result = applyEmotionalModifiers([], baseEmotion);
      expect(result).toEqual([]);
    });

    it('returns correct length', () => {
      const pitches = ['C', 'D', 'E', 'F'];
      const result = applyEmotionalModifiers(pitches, baseEmotion);
      expect(result).toHaveLength(4);
    });
  });

  describe('register shifting', () => {
    it('shifts down for low register', () => {
      const pitches = ['C', 'D', 'E'];
      const lowEmotion: EmotionParams = { ...baseEmotion, register: 'low' };
      const result = applyEmotionalModifiers(pitches, lowEmotion);

      // Should be shifted down
      result.forEach((pitch) => {
        const parsed = parseABCPitch(pitch);
        expect(parsed.octave).toBeLessThan(0);
      });
    });

    it('shifts up for high register', () => {
      const pitches = ['C', 'D', 'E'];
      const highEmotion: EmotionParams = { ...baseEmotion, register: 'high' };
      const result = applyEmotionalModifiers(pitches, highEmotion);

      // Should be shifted up
      result.forEach((pitch) => {
        const parsed = parseABCPitch(pitch);
        expect(parsed.octave).toBeGreaterThan(0);
      });
    });

    it('keeps middle register unchanged in octave', () => {
      const pitches = ['C', 'D', 'E'];
      const middleEmotion: EmotionParams = { ...baseEmotion, register: 'middle', intensity: 0.5 };
      const result = applyEmotionalModifiers(pitches, middleEmotion);

      // With middle register and 0.5 intensity, octave should stay at 0
      result.forEach((pitch) => {
        const parsed = parseABCPitch(pitch);
        expect(parsed.octave).toBe(0);
      });
    });
  });

  describe('intensity effects', () => {
    it('low intensity produces moderate output', () => {
      const pitches = ['C', 'E', 'G'];
      const lowIntensity: EmotionParams = { ...baseEmotion, intensity: 0.2 };
      const result = applyEmotionalModifiers(pitches, lowIntensity);

      // Should produce valid output
      expect(result).toHaveLength(3);
    });

    it('high intensity may expand range', () => {
      const pitches = ['C', 'E', 'G', 'c'];
      const highIntensity: EmotionParams = { ...baseEmotion, intensity: 0.9 };
      const result = applyEmotionalModifiers(pitches, highIntensity);

      // Should produce valid output with potentially expanded range
      expect(result).toHaveLength(4);
    });
  });

  describe('mode handling', () => {
    it('handles major mode', () => {
      const pitches = ['C', 'E', 'G'];
      const majorEmotion: EmotionParams = { ...baseEmotion, mode: 'major' };
      const result = applyEmotionalModifiers(pitches, majorEmotion);

      expect(result).toHaveLength(3);
    });

    it('handles minor mode', () => {
      const pitches = ['A', 'C', 'E'];
      const minorEmotion: EmotionParams = { ...baseEmotion, mode: 'minor' };
      const result = applyEmotionalModifiers(pitches, minorEmotion);

      expect(result).toHaveLength(3);
    });
  });
});

// =============================================================================
// constrainToRange Tests
// =============================================================================

describe('constrainToRange', () => {
  const middleRange: VocalRange = {
    low: 'C',
    high: 'G',
    octaveLow: 0,
    octaveHigh: 0,
  };

  describe('basic operation', () => {
    it('returns empty array for empty pitches', () => {
      const result = constrainToRange([], middleRange);
      expect(result).toEqual([]);
    });

    it('returns correct length', () => {
      const pitches = ['C', 'D', 'E', 'F', 'G'];
      const result = constrainToRange(pitches, middleRange);
      expect(result).toHaveLength(5);
    });
  });

  describe('pitches within range', () => {
    it('leaves pitches within range unchanged', () => {
      const pitches = ['C', 'D', 'E', 'F', 'G'];
      const result = constrainToRange(pitches, middleRange);

      result.forEach((pitch, i) => {
        const parsed = parseABCPitch(pitch);
        expect(parsed.pitch).toBe(pitches[i]);
        expect(parsed.octave).toBe(0);
      });
    });
  });

  describe('pitches above range', () => {
    it('brings high pitches down by octave', () => {
      const pitches = ['c', 'd', 'e']; // High octave
      const result = constrainToRange(pitches, middleRange);

      result.forEach((pitch) => {
        const parsed = parseABCPitch(pitch);
        // Should be brought down to be within range
        expect(parsed.octave).toBeLessThanOrEqual(middleRange.octaveHigh);
      });
    });

    it('handles very high pitches', () => {
      const pitches = ["c'", "d'"]; // Two octaves up
      const result = constrainToRange(pitches, middleRange);

      result.forEach((pitch) => {
        const parsed = parseABCPitch(pitch);
        expect(parsed.octave).toBeLessThanOrEqual(middleRange.octaveHigh);
      });
    });
  });

  describe('pitches below range', () => {
    it('brings low pitches up by octave', () => {
      const pitches = ['C,', 'D,', 'E,']; // Low octave
      const result = constrainToRange(pitches, middleRange);

      result.forEach((pitch) => {
        const parsed = parseABCPitch(pitch);
        // Should be brought up to be within range
        expect(parsed.octave).toBeGreaterThanOrEqual(middleRange.octaveLow);
      });
    });

    it('handles very low pitches', () => {
      const pitches = ['C,,', 'D,,']; // Two octaves down
      const result = constrainToRange(pitches, middleRange);

      result.forEach((pitch) => {
        const parsed = parseABCPitch(pitch);
        expect(parsed.octave).toBeGreaterThanOrEqual(middleRange.octaveLow);
      });
    });
  });

  describe('different vocal ranges', () => {
    it('works with low register range', () => {
      const lowRange: VocalRange = {
        low: 'G',
        high: 'D',
        octaveLow: -1,
        octaveHigh: 0,
      };
      const pitches = ['C', 'D', 'E'];
      const result = constrainToRange(pitches, lowRange);

      expect(result).toHaveLength(3);
    });

    it('works with high register range', () => {
      const highRange: VocalRange = {
        low: 'E',
        high: 'C',
        octaveLow: 0,
        octaveHigh: 1,
      };
      const pitches = ['C,', 'D,', 'E,'];
      const result = constrainToRange(pitches, highRange);

      expect(result).toHaveLength(3);
    });

    it('works with wide range', () => {
      const wideRange: VocalRange = {
        low: 'C',
        high: 'G',
        octaveLow: -1,
        octaveHigh: 1,
      };
      const pitches = ['C,', 'G', 'c', 'g'];
      const result = constrainToRange(pitches, wideRange);

      expect(result).toHaveLength(4);
    });
  });
});

// =============================================================================
// parseABCPitch Tests
// =============================================================================

describe('parseABCPitch', () => {
  describe('middle octave', () => {
    it('parses C correctly', () => {
      const { pitch, octave } = parseABCPitch('C');
      expect(pitch).toBe('C');
      expect(octave).toBe(0);
    });

    it('parses all natural notes', () => {
      const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
      notes.forEach((note) => {
        const { pitch, octave } = parseABCPitch(note);
        expect(pitch).toBe(note);
        expect(octave).toBe(0);
      });
    });
  });

  describe('high octave (lowercase)', () => {
    it('parses c correctly', () => {
      const { pitch, octave } = parseABCPitch('c');
      expect(pitch).toBe('C');
      expect(octave).toBe(1);
    });

    it('parses all lowercase notes', () => {
      const notes = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
      notes.forEach((note) => {
        const { pitch, octave } = parseABCPitch(note);
        expect(pitch).toBe(note.toUpperCase());
        expect(octave).toBe(1);
      });
    });
  });

  describe('low octave (comma)', () => {
    it('parses C, correctly', () => {
      const { pitch, octave } = parseABCPitch('C,');
      expect(pitch).toBe('C');
      expect(octave).toBe(-1);
    });

    it('parses C,, correctly', () => {
      const { pitch, octave } = parseABCPitch('C,,');
      expect(pitch).toBe('C');
      expect(octave).toBe(-2);
    });
  });

  describe('very high octave (apostrophe)', () => {
    it("parses c' correctly", () => {
      const { pitch, octave } = parseABCPitch("c'");
      expect(pitch).toBe('C');
      expect(octave).toBe(2);
    });

    it("parses c'' correctly", () => {
      const { pitch, octave } = parseABCPitch("c''");
      expect(pitch).toBe('C');
      expect(octave).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('handles empty string', () => {
      const { pitch, octave } = parseABCPitch('');
      expect(pitch).toBe('C');
      expect(octave).toBe(0);
    });
  });
});

// =============================================================================
// generateMelodicContour Integration Tests
// =============================================================================

describe('generateMelodicContour', () => {
  describe('basic usage', () => {
    it('generates contour with default options', () => {
      const pitches = generateMelodicContour(8);

      expect(pitches).toHaveLength(8);
      pitches.forEach((pitch) => {
        expect(typeof pitch).toBe('string');
        expect(pitch.length).toBeGreaterThan(0);
      });
    });

    it('handles length 1', () => {
      const pitches = generateMelodicContour(1);
      expect(pitches).toHaveLength(1);
    });

    it('handles length 0', () => {
      const pitches = generateMelodicContour(0);
      expect(pitches).toEqual([]);
    });
  });

  describe('with scale option', () => {
    it('applies major scale', () => {
      const pitches = generateMelodicContour(5, { scale: 'major', rootPitch: 'C' });
      expect(pitches).toHaveLength(5);
    });

    it('applies minor scale', () => {
      const pitches = generateMelodicContour(5, { scale: 'minor', rootPitch: 'A' });
      expect(pitches).toHaveLength(5);
    });

    it('applies dorian scale', () => {
      const pitches = generateMelodicContour(5, { scale: 'dorian', rootPitch: 'D' });
      expect(pitches).toHaveLength(5);
    });

    it('applies mixolydian scale', () => {
      const pitches = generateMelodicContour(5, { scale: 'mixolydian', rootPitch: 'G' });
      expect(pitches).toHaveLength(5);
    });
  });

  describe('with stress pattern', () => {
    it('adjusts for iambic stress', () => {
      const pitches = generateMelodicContour(8, { stressPattern: '01010101' });
      expect(pitches).toHaveLength(8);
    });

    it('adjusts for trochaic stress', () => {
      const pitches = generateMelodicContour(8, { stressPattern: '10101010' });
      expect(pitches).toHaveLength(8);
    });
  });

  describe('with emotion parameters', () => {
    it('applies high register emotion', () => {
      const emotion: EmotionParams = { mode: 'major', intensity: 0.7, register: 'high' };
      const pitches = generateMelodicContour(6, { emotion });
      expect(pitches).toHaveLength(6);
    });

    it('applies low register emotion', () => {
      const emotion: EmotionParams = { mode: 'minor', intensity: 0.3, register: 'low' };
      const pitches = generateMelodicContour(6, { emotion });
      expect(pitches).toHaveLength(6);
    });

    it('applies high intensity emotion', () => {
      const emotion: EmotionParams = { mode: 'major', intensity: 0.9, register: 'middle' };
      const pitches = generateMelodicContour(6, { emotion });
      expect(pitches).toHaveLength(6);
    });
  });

  describe('with vocal range constraint', () => {
    it('constrains to narrow range', () => {
      const range: VocalRange = { low: 'C', high: 'E', octaveLow: 0, octaveHigh: 0 };
      const pitches = generateMelodicContour(8, { range });

      pitches.forEach((pitch) => {
        const parsed = parseABCPitch(pitch);
        expect(parsed.octave).toBe(0);
      });
    });

    it('uses default range from emotion register', () => {
      const emotion: EmotionParams = { mode: 'major', intensity: 0.5, register: 'middle' };
      const pitches = generateMelodicContour(6, { emotion });
      expect(pitches).toHaveLength(6);
    });
  });

  describe('complete pipeline', () => {
    it('combines all options', () => {
      const emotion: EmotionParams = { mode: 'minor', intensity: 0.6, register: 'middle' };
      const range: VocalRange = { low: 'A', high: 'E', octaveLow: 0, octaveHigh: 1 };

      const pitches = generateMelodicContour(10, {
        scale: 'minor',
        rootPitch: 'A',
        stressPattern: '0101010101',
        emotion,
        range,
      });

      expect(pitches).toHaveLength(10);
      pitches.forEach((pitch) => {
        expect(typeof pitch).toBe('string');
      });
    });
  });
});

// =============================================================================
// Constants Export Tests
// =============================================================================

describe('exported constants', () => {
  describe('DEFAULT_RANGES', () => {
    it('has low, middle, and high registers', () => {
      expect(DEFAULT_RANGES).toHaveProperty('low');
      expect(DEFAULT_RANGES).toHaveProperty('middle');
      expect(DEFAULT_RANGES).toHaveProperty('high');
    });

    it('each range has required properties', () => {
      (['low', 'middle', 'high'] as const).forEach((register) => {
        expect(DEFAULT_RANGES[register]).toHaveProperty('low');
        expect(DEFAULT_RANGES[register]).toHaveProperty('high');
        expect(DEFAULT_RANGES[register]).toHaveProperty('octaveLow');
        expect(DEFAULT_RANGES[register]).toHaveProperty('octaveHigh');
      });
    });
  });

  describe('SCALES', () => {
    it('has all supported scales', () => {
      expect(SCALES).toHaveProperty('major');
      expect(SCALES).toHaveProperty('minor');
      expect(SCALES).toHaveProperty('dorian');
      expect(SCALES).toHaveProperty('mixolydian');
    });

    it('each scale has 8 intervals', () => {
      (Object.keys(SCALES) as Scale[]).forEach((scale) => {
        expect(SCALES[scale]).toHaveLength(8);
      });
    });

    it('each scale starts at 0 and ends at 12 (octave)', () => {
      (Object.keys(SCALES) as Scale[]).forEach((scale) => {
        expect(SCALES[scale][0]).toBe(0);
        expect(SCALES[scale][7]).toBe(12);
      });
    });
  });
});

// =============================================================================
// Acceptance Criteria Tests
// =============================================================================

describe('acceptance criteria', () => {
  describe('generates natural-sounding contours', () => {
    it('creates smooth melodic motion', () => {
      const contour = generatePhraseContour(10);

      // Check that jumps between adjacent notes are not too large
      for (let i = 1; i < contour.length; i++) {
        const jump = Math.abs(contour[i] - contour[i - 1]);
        expect(jump).toBeLessThanOrEqual(2); // No leaps greater than 2 scale degrees
      }
    });

    it('follows arch shape principle', () => {
      const contour = generatePhraseContour(12);
      const peak = Math.max(...contour);
      const peakIndex = contour.indexOf(peak);

      // First half should trend upward
      const firstHalfTrend =
        contour.slice(0, peakIndex).reduce((sum, val, i, arr) => {
          if (i === 0) return 0;
          return sum + (val >= arr[i - 1] ? 1 : -1);
        }, 0);
      expect(firstHalfTrend).toBeGreaterThanOrEqual(0);

      // Second half should trend downward
      const secondHalfTrend =
        contour.slice(peakIndex).reduce((sum, val, i, arr) => {
          if (i === 0) return 0;
          return sum + (val <= arr[i - 1] ? 1 : -1);
        }, 0);
      expect(secondHalfTrend).toBeGreaterThanOrEqual(0);
    });
  });

  describe('stressed syllables on higher pitches', () => {
    it('stressed positions are higher than unstressed neighbors', () => {
      const pitches = ['C', 'D', 'E', 'F'];
      const result = adjustForStress(pitches, '0101');

      // D (stressed) should be higher than C (unstressed)
      const pos1 = parseABCPitch(result[1]);
      const pos0 = parseABCPitch(result[0]);

      // Either the pitch is higher in the same octave, or octave is higher
      const pos1Value = pos1.octave * 7 + 'CDEFGAB'.indexOf(pos1.pitch);
      const pos0Value = pos0.octave * 7 + 'CDEFGAB'.indexOf(pos0.pitch);
      expect(pos1Value).toBeGreaterThan(pos0Value);
    });
  });

  describe('stays within specified vocal range', () => {
    it('all pitches within range after constraining', () => {
      const range: VocalRange = { low: 'C', high: 'G', octaveLow: 0, octaveHigh: 0 };

      // Generate extreme pitches
      const extremePitches = ['C,,', 'G', "c'", 'D'];
      const constrained = constrainToRange(extremePitches, range);

      constrained.forEach((pitch) => {
        const parsed = parseABCPitch(pitch);
        expect(parsed.octave).toBeGreaterThanOrEqual(range.octaveLow);
        expect(parsed.octave).toBeLessThanOrEqual(range.octaveHigh);
      });
    });
  });

  describe('different emotions produce different contours', () => {
    it('high register emotion produces higher pitches than low', () => {
      const highEmotion: EmotionParams = { mode: 'major', intensity: 0.5, register: 'high' };
      const lowEmotion: EmotionParams = { mode: 'minor', intensity: 0.5, register: 'low' };

      const highPitches = generateMelodicContour(6, { emotion: highEmotion });
      const lowPitches = generateMelodicContour(6, { emotion: lowEmotion });

      // Average octave of high should be greater than low
      const avgHighOctave =
        highPitches.reduce((sum, p) => sum + parseABCPitch(p).octave, 0) / highPitches.length;
      const avgLowOctave =
        lowPitches.reduce((sum, p) => sum + parseABCPitch(p).octave, 0) / lowPitches.length;

      expect(avgHighOctave).toBeGreaterThan(avgLowOctave);
    });
  });
});

// =============================================================================
// Edge Cases and Error Handling
// =============================================================================

describe('edge cases', () => {
  it('handles very long phrases', () => {
    const contour = generatePhraseContour(100);
    expect(contour).toHaveLength(100);
    expect(Math.max(...contour)).toBeLessThanOrEqual(6);
  });

  it('handles stress pattern shorter than pitches', () => {
    const pitches = ['C', 'D', 'E', 'F', 'G'];
    const result = adjustForStress(pitches, '01'); // Only 2 chars

    // Should handle gracefully
    expect(result).toHaveLength(5);
  });

  it('handles stress pattern longer than pitches', () => {
    const pitches = ['C', 'D'];
    const result = adjustForStress(pitches, '01010101'); // More chars than pitches

    expect(result).toHaveLength(2);
  });

  it('handles unknown pitch letters gracefully', () => {
    const pitches = ['X', 'Y', 'Z'];
    const result = adjustForStress(pitches, '111');

    // Should return something without crashing
    expect(result).toHaveLength(3);
  });
});
