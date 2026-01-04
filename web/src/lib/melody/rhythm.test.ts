/**
 * Tests for Stress-to-Rhythm Mapping Module
 *
 * Tests all rhythm mapping functions including:
 * - stressToNoteDuration
 * - mapLineToRhythm
 * - insertBreathRests
 * - fitToMeasure
 */

import { describe, it, expect } from 'vitest';
import {
  stressToNoteDuration,
  mapLineToRhythm,
  insertBreathRests,
  fitToMeasure,
  calculateTotalDuration,
  countMeasures,
  validateRhythm,
  createRhythmContext,
  getStrongBeats,
  isStrongBeat,
  durationsToBeats,
  createIambicRhythm,
  createTrochaicRhythm,
  alignStressToBeats,
  type RhythmContext,
  type NoteDuration,
  type FitToMeasureOptions,
} from './rhythm';
import type { TimeSignature } from './types';

// =============================================================================
// stressToNoteDuration Tests
// =============================================================================

describe('stressToNoteDuration', () => {
  const defaultContext: RhythmContext = {
    timeSignature: '4/4',
    tempo: 100,
    position: 0,
  };

  describe('basic stress level mapping', () => {
    it('should return longer duration for primary stress (1)', () => {
      const duration = stressToNoteDuration('1', defaultContext);
      expect(duration).toBeGreaterThanOrEqual(1.0);
    });

    it('should return shorter duration for unstressed (0)', () => {
      const duration = stressToNoteDuration('0', defaultContext);
      expect(duration).toBeLessThanOrEqual(0.5);
    });

    it('should return medium duration for secondary stress (2)', () => {
      const duration = stressToNoteDuration('2', defaultContext);
      expect(duration).toBeGreaterThan(0.5);
      expect(duration).toBeLessThanOrEqual(1.0);
    });

    it('should make stressed syllables longer than unstressed', () => {
      const stressed = stressToNoteDuration('1', defaultContext);
      const unstressed = stressToNoteDuration('0', defaultContext);
      expect(stressed).toBeGreaterThan(unstressed);
    });

    it('should make secondary stress longer than unstressed', () => {
      const secondary = stressToNoteDuration('2', defaultContext);
      const unstressed = stressToNoteDuration('0', defaultContext);
      expect(secondary).toBeGreaterThan(unstressed);
    });
  });

  describe('time signature handling', () => {
    it('should handle 4/4 time', () => {
      const context: RhythmContext = { timeSignature: '4/4', tempo: 100, position: 0 };
      const duration = stressToNoteDuration('1', context);
      expect(duration).toBeGreaterThan(0);
    });

    it('should handle 3/4 time', () => {
      const context: RhythmContext = { timeSignature: '3/4', tempo: 100, position: 0 };
      const duration = stressToNoteDuration('1', context);
      expect(duration).toBeGreaterThan(0);
    });

    it('should handle 6/8 time with shorter durations', () => {
      const context44: RhythmContext = { timeSignature: '4/4', tempo: 100, position: 0 };
      const context68: RhythmContext = { timeSignature: '6/8', tempo: 100, position: 0 };
      const duration44 = stressToNoteDuration('0', context44);
      const duration68 = stressToNoteDuration('0', context68);
      // 6/8 should have shorter note values due to compound meter
      expect(duration68).toBeLessThanOrEqual(duration44);
    });

    it('should handle 2/4 time', () => {
      const context: RhythmContext = { timeSignature: '2/4', tempo: 100, position: 0 };
      const duration = stressToNoteDuration('1', context);
      expect(duration).toBeGreaterThan(0);
    });
  });

  describe('strong beat positioning', () => {
    it('should potentially lengthen stressed syllables on strong beats', () => {
      const onStrongBeat: RhythmContext = { timeSignature: '4/4', tempo: 100, position: 0 };
      const onWeakBeat: RhythmContext = { timeSignature: '4/4', tempo: 100, position: 1 };
      const strongBeatDuration = stressToNoteDuration('1', onStrongBeat);
      const weakBeatDuration = stressToNoteDuration('1', onWeakBeat);
      // Strong beat may allow longer duration
      expect(strongBeatDuration).toBeGreaterThanOrEqual(weakBeatDuration);
    });
  });

  describe('tempo adjustments', () => {
    it('should handle fast tempo', () => {
      const fastContext: RhythmContext = { timeSignature: '4/4', tempo: 150, position: 0 };
      const normalContext: RhythmContext = { timeSignature: '4/4', tempo: 100, position: 0 };
      const fastDuration = stressToNoteDuration('1', fastContext);
      const normalDuration = stressToNoteDuration('1', normalContext);
      // Fast tempo may result in slightly shorter notes
      expect(fastDuration).toBeLessThanOrEqual(normalDuration);
    });

    it('should handle slow tempo', () => {
      const slowContext: RhythmContext = { timeSignature: '4/4', tempo: 50, position: 0 };
      const normalContext: RhythmContext = { timeSignature: '4/4', tempo: 100, position: 0 };
      const slowDuration = stressToNoteDuration('1', slowContext);
      const normalDuration = stressToNoteDuration('1', normalContext);
      // Slow tempo may allow slightly longer notes
      expect(slowDuration).toBeGreaterThanOrEqual(normalDuration);
    });
  });

  describe('edge cases', () => {
    it('should handle invalid stress level by defaulting to unstressed', () => {
      // @ts-expect-error - testing invalid input
      const duration = stressToNoteDuration('3', defaultContext);
      expect(duration).toBe(0.5); // Should default to unstressed
    });
  });
});

// =============================================================================
// mapLineToRhythm Tests
// =============================================================================

describe('mapLineToRhythm', () => {
  describe('basic pattern mapping', () => {
    it('should map empty pattern to empty array', () => {
      const result = mapLineToRhythm('', '4/4');
      expect(result).toEqual([]);
    });

    it('should map single stressed syllable', () => {
      const result = mapLineToRhythm('1', '4/4');
      expect(result).toHaveLength(1);
      expect(result[0].syllableIndex).toBe(0);
      expect(result[0].isRest).toBe(false);
      expect(result[0].beats).toBeGreaterThan(0);
    });

    it('should map single unstressed syllable', () => {
      const result = mapLineToRhythm('0', '4/4');
      expect(result).toHaveLength(1);
      expect(result[0].syllableIndex).toBe(0);
      expect(result[0].beats).toBeGreaterThan(0);
    });

    it('should correctly index multiple syllables', () => {
      const result = mapLineToRhythm('0101', '4/4');
      expect(result).toHaveLength(4);
      expect(result[0].syllableIndex).toBe(0);
      expect(result[1].syllableIndex).toBe(1);
      expect(result[2].syllableIndex).toBe(2);
      expect(result[3].syllableIndex).toBe(3);
    });
  });

  describe('iambic patterns', () => {
    it('should create alternating short-long pattern for iambic', () => {
      const result = mapLineToRhythm('01010101', '4/4');
      expect(result).toHaveLength(8);

      // Check that stressed syllables are longer
      for (let i = 0; i < result.length; i++) {
        if (i % 2 === 0) {
          // Unstressed positions
          expect(result[i].beats).toBeLessThanOrEqual(result[i + 1]?.beats ?? Infinity);
        }
      }
    });

    it('should handle iambic tetrameter (8 syllables)', () => {
      const result = mapLineToRhythm('01010101', '4/4');
      expect(result).toHaveLength(8);
      const totalBeats = calculateTotalDuration(result);
      expect(totalBeats).toBeGreaterThan(0);
    });

    it('should handle iambic pentameter (10 syllables)', () => {
      const result = mapLineToRhythm('0101010101', '4/4');
      expect(result).toHaveLength(10);
    });
  });

  describe('trochaic patterns', () => {
    it('should create alternating long-short pattern for trochaic', () => {
      const result = mapLineToRhythm('10101010', '4/4');
      expect(result).toHaveLength(8);

      // Check pattern: long-short-long-short
      for (let i = 0; i < result.length - 1; i += 2) {
        expect(result[i].beats).toBeGreaterThanOrEqual(result[i + 1].beats);
      }
    });
  });

  describe('anapestic patterns', () => {
    it('should handle anapestic pattern (001)', () => {
      const result = mapLineToRhythm('001001001', '4/4');
      expect(result).toHaveLength(9);
      // Every third note should be longer
      expect(result[2].beats).toBeGreaterThan(result[0].beats);
      expect(result[5].beats).toBeGreaterThan(result[3].beats);
    });
  });

  describe('dactylic patterns', () => {
    it('should handle dactylic pattern (100)', () => {
      const result = mapLineToRhythm('100100100', '4/4');
      expect(result).toHaveLength(9);
      // First of every three should be longer
      expect(result[0].beats).toBeGreaterThan(result[1].beats);
      expect(result[3].beats).toBeGreaterThan(result[4].beats);
    });
  });

  describe('time signature variations', () => {
    it('should work with 3/4 time', () => {
      const result = mapLineToRhythm('010101', '3/4');
      expect(result).toHaveLength(6);
      result.forEach((d) => {
        expect(d.isRest).toBe(false);
        expect(d.beats).toBeGreaterThan(0);
      });
    });

    it('should work with 6/8 time', () => {
      const result = mapLineToRhythm('010101', '6/8');
      expect(result).toHaveLength(6);
    });

    it('should work with 2/4 time', () => {
      const result = mapLineToRhythm('0101', '2/4');
      expect(result).toHaveLength(4);
    });
  });

  describe('tempo parameter', () => {
    it('should accept custom tempo', () => {
      const slow = mapLineToRhythm('01', '4/4', 60);
      const fast = mapLineToRhythm('01', '4/4', 140);
      expect(slow).toHaveLength(2);
      expect(fast).toHaveLength(2);
    });
  });

  describe('secondary stress', () => {
    it('should handle secondary stress (2) appropriately', () => {
      const result = mapLineToRhythm('0210', '4/4');
      expect(result).toHaveLength(4);
      // Secondary stress should be between unstressed and primary
      expect(result[1].beats).toBeGreaterThan(result[0].beats);
      expect(result[1].beats).toBeLessThanOrEqual(result[2]?.beats ?? Infinity);
    });
  });
});

// =============================================================================
// insertBreathRests Tests
// =============================================================================

describe('insertBreathRests', () => {
  const sampleDurations: NoteDuration[] = [
    { syllableIndex: 0, beats: 0.5, isRest: false },
    { syllableIndex: 1, beats: 1.0, isRest: false },
    { syllableIndex: 2, beats: 0.5, isRest: false },
    { syllableIndex: 3, beats: 1.0, isRest: false },
    { syllableIndex: 4, beats: 0.5, isRest: false },
    { syllableIndex: 5, beats: 1.0, isRest: false },
  ];

  describe('basic rest insertion', () => {
    it('should return empty array for empty input', () => {
      const result = insertBreathRests([], [1, 2]);
      expect(result).toEqual([]);
    });

    it('should return original array when no breath points', () => {
      const result = insertBreathRests(sampleDurations, []);
      expect(result).toHaveLength(sampleDurations.length);
    });

    it('should insert rest after specified position', () => {
      const result = insertBreathRests(sampleDurations, [2]);
      expect(result).toHaveLength(sampleDurations.length + 1);
      expect(result[3].isRest).toBe(true);
      expect(result[3].syllableIndex).toBe(-1);
    });

    it('should insert multiple rests', () => {
      const result = insertBreathRests(sampleDurations, [1, 4]);
      expect(result).toHaveLength(sampleDurations.length + 2);
    });
  });

  describe('rest properties', () => {
    it('should create rests with default duration of 0.5', () => {
      const result = insertBreathRests(sampleDurations, [2]);
      const rest = result.find((d) => d.isRest);
      expect(rest?.beats).toBe(0.5);
    });

    it('should use custom rest duration', () => {
      const result = insertBreathRests(sampleDurations, [2], 1.0);
      const rest = result.find((d) => d.isRest);
      expect(rest?.beats).toBe(1.0);
    });

    it('should mark rests with syllableIndex -1', () => {
      const result = insertBreathRests(sampleDurations, [2]);
      const rest = result.find((d) => d.isRest);
      expect(rest?.syllableIndex).toBe(-1);
    });
  });

  describe('order preservation', () => {
    it('should preserve order of original notes', () => {
      const result = insertBreathRests(sampleDurations, [2]);
      const notes = result.filter((d) => !d.isRest);
      expect(notes).toHaveLength(sampleDurations.length);
      notes.forEach((note, i) => {
        expect(note.syllableIndex).toBe(i);
      });
    });

    it('should handle multiple breath points in order', () => {
      const result = insertBreathRests(sampleDurations, [0, 2, 4]);
      // Should have 3 additional rests
      expect(result).toHaveLength(sampleDurations.length + 3);
    });
  });

  describe('edge cases', () => {
    it('should handle breath point at last position', () => {
      const result = insertBreathRests(sampleDurations, [5]);
      expect(result).toHaveLength(sampleDurations.length + 1);
      expect(result[result.length - 1].isRest).toBe(true);
    });

    it('should handle breath point at first position', () => {
      const result = insertBreathRests(sampleDurations, [0]);
      expect(result).toHaveLength(sampleDurations.length + 1);
      expect(result[1].isRest).toBe(true);
    });

    it('should skip invalid breath points (negative)', () => {
      const result = insertBreathRests(sampleDurations, [-1]);
      expect(result).toHaveLength(sampleDurations.length);
    });

    it('should skip invalid breath points (out of range)', () => {
      const result = insertBreathRests(sampleDurations, [100]);
      expect(result).toHaveLength(sampleDurations.length);
    });
  });

  describe('non-mutation', () => {
    it('should not mutate original array', () => {
      const original = [...sampleDurations];
      insertBreathRests(sampleDurations, [2]);
      expect(sampleDurations).toEqual(original);
    });
  });
});

// =============================================================================
// fitToMeasure Tests
// =============================================================================

describe('fitToMeasure', () => {
  describe('basic measure fitting', () => {
    it('should return empty array for empty input', () => {
      const result = fitToMeasure([], 4);
      expect(result).toEqual([]);
    });

    it('should return original if invalid beatsPerMeasure', () => {
      const durations: NoteDuration[] = [
        { syllableIndex: 0, beats: 1, isRest: false },
      ];
      const result = fitToMeasure(durations, 0);
      expect(result).toHaveLength(1);
    });

    it('should handle notes that fit exactly in measure', () => {
      const durations: NoteDuration[] = [
        { syllableIndex: 0, beats: 1, isRest: false },
        { syllableIndex: 1, beats: 1, isRest: false },
        { syllableIndex: 2, beats: 1, isRest: false },
        { syllableIndex: 3, beats: 1, isRest: false },
      ];
      const result = fitToMeasure(durations, 4);
      expect(result).toHaveLength(4);
    });
  });

  describe('padding with rests', () => {
    it('should pad incomplete measure with rest by default', () => {
      const durations: NoteDuration[] = [
        { syllableIndex: 0, beats: 1, isRest: false },
        { syllableIndex: 1, beats: 1, isRest: false },
      ];
      const result = fitToMeasure(durations, 4);
      const totalBeats = calculateTotalDuration(result);
      expect(totalBeats).toBe(4); // Should be padded to complete measure
    });

    it('should not pad when padWithRests is false', () => {
      const durations: NoteDuration[] = [
        { syllableIndex: 0, beats: 1, isRest: false },
        { syllableIndex: 1, beats: 1, isRest: false },
      ];
      const result = fitToMeasure(durations, 4, { padWithRests: false });
      const totalBeats = calculateTotalDuration(result);
      expect(totalBeats).toBe(2);
    });

    it('should add rest with correct beats to complete measure', () => {
      const durations: NoteDuration[] = [
        { syllableIndex: 0, beats: 1.5, isRest: false },
      ];
      const result = fitToMeasure(durations, 4);
      const rest = result.find((d) => d.isRest);
      expect(rest).toBeDefined();
      expect(rest?.beats).toBe(2.5);
    });
  });

  describe('splitting notes across bar lines', () => {
    it('should split notes that cross bar lines by default', () => {
      const durations: NoteDuration[] = [
        { syllableIndex: 0, beats: 1, isRest: false },
        { syllableIndex: 1, beats: 1, isRest: false },
        { syllableIndex: 2, beats: 1, isRest: false },
        { syllableIndex: 3, beats: 2, isRest: false }, // This crosses the bar line
      ];
      const result = fitToMeasure(durations, 4);
      // The long note should be split
      expect(result.length).toBeGreaterThan(4);
    });

    it('should not split notes when allowSplitNotes is false', () => {
      const durations: NoteDuration[] = [
        { syllableIndex: 0, beats: 1, isRest: false },
        { syllableIndex: 1, beats: 1, isRest: false },
        { syllableIndex: 2, beats: 1, isRest: false },
        { syllableIndex: 3, beats: 2, isRest: false },
      ];
      const result = fitToMeasure(durations, 4, { allowSplitNotes: false });
      // Note count should not increase due to splitting
      const nonRestNotes = result.filter((d) => !d.isRest);
      expect(nonRestNotes.length).toBeLessThanOrEqual(4);
    });
  });

  describe('different time signatures', () => {
    it('should work with 3/4 time (3 beats per measure)', () => {
      const durations: NoteDuration[] = [
        { syllableIndex: 0, beats: 1, isRest: false },
        { syllableIndex: 1, beats: 1, isRest: false },
      ];
      const result = fitToMeasure(durations, 3);
      const totalBeats = calculateTotalDuration(result);
      expect(totalBeats).toBe(3);
    });

    it('should work with 6/8 time (6 beats per measure)', () => {
      const durations: NoteDuration[] = [
        { syllableIndex: 0, beats: 0.5, isRest: false },
        { syllableIndex: 1, beats: 0.5, isRest: false },
        { syllableIndex: 2, beats: 0.5, isRest: false },
      ];
      const result = fitToMeasure(durations, 6);
      const totalBeats = calculateTotalDuration(result);
      expect(totalBeats).toBe(6);
    });
  });

  describe('multiple measures', () => {
    it('should handle content spanning multiple measures', () => {
      const durations: NoteDuration[] = [
        { syllableIndex: 0, beats: 1, isRest: false },
        { syllableIndex: 1, beats: 1, isRest: false },
        { syllableIndex: 2, beats: 1, isRest: false },
        { syllableIndex: 3, beats: 1, isRest: false },
        { syllableIndex: 4, beats: 1, isRest: false },
        { syllableIndex: 5, beats: 1, isRest: false },
        { syllableIndex: 6, beats: 1, isRest: false },
        { syllableIndex: 7, beats: 1, isRest: false },
      ];
      const result = fitToMeasure(durations, 4);
      const totalBeats = calculateTotalDuration(result);
      expect(totalBeats).toBe(8); // Exactly 2 measures
    });
  });

  describe('options', () => {
    it('should respect all options', () => {
      const durations: NoteDuration[] = [
        { syllableIndex: 0, beats: 1, isRest: false },
      ];
      const options: FitToMeasureOptions = {
        padWithRests: false,
        allowSplitNotes: false,
        preserveStressAlignment: true,
      };
      const result = fitToMeasure(durations, 4, options);
      expect(result).toHaveLength(1);
    });
  });
});

// =============================================================================
// Utility Function Tests
// =============================================================================

describe('calculateTotalDuration', () => {
  it('should return 0 for empty array', () => {
    expect(calculateTotalDuration([])).toBe(0);
  });

  it('should sum all durations', () => {
    const durations: NoteDuration[] = [
      { syllableIndex: 0, beats: 1, isRest: false },
      { syllableIndex: 1, beats: 0.5, isRest: false },
      { syllableIndex: 2, beats: 1.5, isRest: false },
    ];
    expect(calculateTotalDuration(durations)).toBe(3);
  });

  it('should include rests in total', () => {
    const durations: NoteDuration[] = [
      { syllableIndex: 0, beats: 1, isRest: false },
      { syllableIndex: -1, beats: 0.5, isRest: true },
      { syllableIndex: 1, beats: 1, isRest: false },
    ];
    expect(calculateTotalDuration(durations)).toBe(2.5);
  });
});

describe('countMeasures', () => {
  it('should count measures correctly', () => {
    const durations: NoteDuration[] = [
      { syllableIndex: 0, beats: 1, isRest: false },
      { syllableIndex: 1, beats: 1, isRest: false },
      { syllableIndex: 2, beats: 1, isRest: false },
      { syllableIndex: 3, beats: 1, isRest: false },
    ];
    expect(countMeasures(durations, 4)).toBe(1);
  });

  it('should return fractional measures', () => {
    const durations: NoteDuration[] = [
      { syllableIndex: 0, beats: 1, isRest: false },
      { syllableIndex: 1, beats: 1, isRest: false },
    ];
    expect(countMeasures(durations, 4)).toBe(0.5);
  });

  it('should handle multiple complete measures', () => {
    const durations: NoteDuration[] = Array(8).fill(null).map((_, i) => ({
      syllableIndex: i,
      beats: 1,
      isRest: false,
    }));
    expect(countMeasures(durations, 4)).toBe(2);
  });
});

describe('validateRhythm', () => {
  it('should validate correct rhythm', () => {
    const durations: NoteDuration[] = [
      { syllableIndex: 0, beats: 1, isRest: false },
      { syllableIndex: 1, beats: 0.5, isRest: false },
    ];
    const result = validateRhythm(durations);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('should detect invalid beats value', () => {
    const durations: NoteDuration[] = [
      { syllableIndex: 0, beats: 0, isRest: false },
    ];
    const result = validateRhythm(durations);
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('should detect invalid syllable index for non-rest', () => {
    const durations: NoteDuration[] = [
      { syllableIndex: -1, beats: 1, isRest: false },
    ];
    const result = validateRhythm(durations);
    expect(result.valid).toBe(false);
  });

  it('should validate rests have syllableIndex -1', () => {
    const durations: NoteDuration[] = [
      { syllableIndex: 0, beats: 1, isRest: true },
    ];
    const result = validateRhythm(durations);
    expect(result.valid).toBe(false);
  });

  it('should return valid for empty array', () => {
    const result = validateRhythm([]);
    expect(result.valid).toBe(true);
  });
});

describe('createRhythmContext', () => {
  it('should create context with all properties', () => {
    const context = createRhythmContext('4/4', 120, 2);
    expect(context.timeSignature).toBe('4/4');
    expect(context.tempo).toBe(120);
    expect(context.position).toBe(2);
  });

  it('should default position to 0', () => {
    const context = createRhythmContext('3/4', 100);
    expect(context.position).toBe(0);
  });
});

describe('getStrongBeats', () => {
  it('should return [0, 2] for 4/4', () => {
    expect(getStrongBeats('4/4')).toEqual([0, 2]);
  });

  it('should return [0] for 3/4', () => {
    expect(getStrongBeats('3/4')).toEqual([0]);
  });

  it('should return [0, 3] for 6/8', () => {
    expect(getStrongBeats('6/8')).toEqual([0, 3]);
  });

  it('should return [0] for 2/4', () => {
    expect(getStrongBeats('2/4')).toEqual([0]);
  });
});

describe('isStrongBeat', () => {
  it('should identify strong beats in 4/4', () => {
    expect(isStrongBeat(0, '4/4')).toBe(true);
    expect(isStrongBeat(1, '4/4')).toBe(false);
    expect(isStrongBeat(2, '4/4')).toBe(true);
    expect(isStrongBeat(3, '4/4')).toBe(false);
  });

  it('should identify strong beats in 3/4', () => {
    expect(isStrongBeat(0, '3/4')).toBe(true);
    expect(isStrongBeat(1, '3/4')).toBe(false);
    expect(isStrongBeat(2, '3/4')).toBe(false);
  });

  it('should wrap around for positions beyond measure', () => {
    expect(isStrongBeat(4, '4/4')).toBe(true); // Position 4 mod 4 = 0
    expect(isStrongBeat(6, '4/4')).toBe(true); // Position 6 mod 4 = 2
  });
});

describe('durationsToBeats', () => {
  it('should extract beat values', () => {
    const durations: NoteDuration[] = [
      { syllableIndex: 0, beats: 1, isRest: false },
      { syllableIndex: 1, beats: 0.5, isRest: false },
      { syllableIndex: -1, beats: 0.5, isRest: true },
    ];
    expect(durationsToBeats(durations)).toEqual([1, 0.5, 0.5]);
  });

  it('should return empty array for empty input', () => {
    expect(durationsToBeats([])).toEqual([]);
  });
});

describe('createIambicRhythm', () => {
  it('should create iambic pattern (short-long)', () => {
    const result = createIambicRhythm(4);
    expect(result).toHaveLength(4);
    // First and third should be shorter (unstressed)
    expect(result[0].beats).toBeLessThan(result[1].beats);
    expect(result[2].beats).toBeLessThan(result[3].beats);
  });

  it('should handle odd syllable counts', () => {
    const result = createIambicRhythm(5);
    expect(result).toHaveLength(5);
  });

  it('should accept custom time signature', () => {
    const result = createIambicRhythm(4, '3/4');
    expect(result).toHaveLength(4);
  });
});

describe('createTrochaicRhythm', () => {
  it('should create trochaic pattern (long-short)', () => {
    const result = createTrochaicRhythm(4);
    expect(result).toHaveLength(4);
    // First and third should be longer (stressed)
    expect(result[0].beats).toBeGreaterThan(result[1].beats);
    expect(result[2].beats).toBeGreaterThan(result[3].beats);
  });
});

describe('alignStressToBeats', () => {
  it('should return copy for empty input', () => {
    const result = alignStressToBeats([], '', '4/4');
    expect(result).toEqual([]);
  });

  it('should attempt to align stressed syllables to strong beats', () => {
    const durations: NoteDuration[] = [
      { syllableIndex: 0, beats: 0.5, isRest: false },
      { syllableIndex: 1, beats: 1, isRest: false },
      { syllableIndex: 2, beats: 0.5, isRest: false },
      { syllableIndex: 3, beats: 1, isRest: false },
    ];
    const result = alignStressToBeats(durations, '0101', '4/4');
    expect(result.length).toBeGreaterThanOrEqual(durations.length);
  });

  it('should preserve original durations if already aligned', () => {
    // Stress pattern already aligned with strong beats
    const durations: NoteDuration[] = [
      { syllableIndex: 0, beats: 0.5, isRest: false }, // beat 0, unstressed
      { syllableIndex: 1, beats: 0.5, isRest: false }, // beat 0.5, stressed
      { syllableIndex: 2, beats: 1, isRest: false }, // beat 1, unstressed
      { syllableIndex: 3, beats: 1, isRest: false }, // beat 2, stressed (strong beat)
    ];
    const result = alignStressToBeats(durations, '0101', '4/4');
    expect(result).toBeDefined();
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Integration Tests', () => {
  describe('complete rhythm generation workflow', () => {
    it('should generate rhythm for "The woods are lovely, dark and deep"', () => {
      // Stress pattern for iambic tetrameter: 01010101
      const stressPattern = '01010101';
      const timeSignature: TimeSignature = '4/4';

      // Step 1: Map stress to rhythm
      const durations = mapLineToRhythm(stressPattern, timeSignature, 80);
      expect(durations).toHaveLength(8);

      // Step 2: Insert breath rest after "lovely" (position 3)
      const withBreath = insertBreathRests(durations, [3], 0.5);
      expect(withBreath).toHaveLength(9);

      // Step 3: Fit to measures
      const fitted = fitToMeasure(withBreath, 4);

      // Validate result
      const validation = validateRhythm(fitted);
      expect(validation.valid).toBe(true);
    });

    it('should handle complex poem line with punctuation pauses', () => {
      // "Once upon a midnight dreary, while I pondered, weak and weary"
      // Simplified stress pattern
      const stressPattern = '1010101010101010';

      const durations = mapLineToRhythm(stressPattern, '4/4');

      // Breath points after "dreary" (7) and "pondered" (11)
      const withBreaths = insertBreathRests(durations, [7, 11]);

      const fitted = fitToMeasure(withBreaths, 4);

      expect(calculateTotalDuration(fitted)).toBeGreaterThan(0);
      expect(validateRhythm(fitted).valid).toBe(true);
    });

    it('should work with waltz time (3/4)', () => {
      const stressPattern = '100100';
      const durations = mapLineToRhythm(stressPattern, '3/4');
      const fitted = fitToMeasure(durations, 3);

      const measures = countMeasures(fitted, 3);
      expect(measures).toBeGreaterThanOrEqual(1);
    });

    it('should work with compound meter (6/8)', () => {
      const stressPattern = '100100';
      const durations = mapLineToRhythm(stressPattern, '6/8');
      const fitted = fitToMeasure(durations, 6);

      expect(validateRhythm(fitted).valid).toBe(true);
    });
  });

  describe('rhythm quality checks', () => {
    it('should produce singable rhythms (no extremely short notes)', () => {
      const stressPattern = '01010101';
      const durations = mapLineToRhythm(stressPattern, '4/4', 120);

      // All notes should be at least a sixteenth note (0.25 beats)
      durations.forEach((d) => {
        expect(d.beats).toBeGreaterThanOrEqual(0.25);
      });
    });

    it('should produce rhythms that can be fitted to measures', () => {
      const patterns = ['01010101', '10101010', '001001001', '100100100'];

      patterns.forEach((pattern) => {
        const durations = mapLineToRhythm(pattern, '4/4');
        const fitted = fitToMeasure(durations, 4);
        const validation = validateRhythm(fitted);
        expect(validation.valid).toBe(true);
      });
    });
  });
});
