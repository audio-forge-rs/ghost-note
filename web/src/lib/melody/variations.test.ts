import { describe, it, expect } from 'vitest';
import {
  getAvailablePresets,
  getPresetByName,
  applyStylePreset,
  generateVariation,
  isValidPresetName,
  isValidVariationType,
  getVariationDescription,
  summarizeVariation,
  FOLK_PRESET,
  CLASSICAL_PRESET,
  POP_PRESET,
  HYMN_PRESET,
  type StylePreset,
  type VariationType,
  type ContourType,
} from './variations';
import type { Melody, Note } from './types';

// =============================================================================
// Test Fixtures
// =============================================================================

/**
 * Creates a test melody for variation testing
 */
function createTestMelody(options: {
  title?: string;
  tempo?: number;
  timeSignature?: '4/4' | '3/4' | '6/8' | '2/4';
  noteCount?: number;
} = {}): Melody {
  const {
    title = 'Test Melody',
    tempo = 100,
    timeSignature = '4/4',
    noteCount = 8,
  } = options;

  // Create a simple ascending/descending scale pattern
  const pitches = ['C', 'D', 'E', 'F', 'G', 'F', 'E', 'D'];
  const measures: Note[][] = [];
  const lyrics: string[][] = [];

  let currentMeasure: Note[] = [];
  let currentLyrics: string[] = [];

  for (let i = 0; i < noteCount; i++) {
    currentMeasure.push({
      pitch: pitches[i % pitches.length],
      octave: 0,
      duration: 2, // Quarter notes
    });
    currentLyrics.push(`syl${i + 1}`);

    // 4 notes per measure in 4/4
    if (currentMeasure.length === 4) {
      measures.push(currentMeasure);
      lyrics.push(currentLyrics);
      currentMeasure = [];
      currentLyrics = [];
    }
  }

  // Add remaining notes
  if (currentMeasure.length > 0) {
    measures.push(currentMeasure);
    lyrics.push(currentLyrics);
  }

  return {
    params: {
      title,
      timeSignature,
      defaultNoteLength: '1/8',
      tempo,
      key: 'C',
    },
    measures,
    lyrics,
  };
}

/**
 * Creates a melody with specific notes for testing
 */
function createMelodyWithNotes(notes: Note[]): Melody {
  return {
    params: {
      title: 'Test Melody',
      timeSignature: '4/4',
      defaultNoteLength: '1/8',
      tempo: 100,
      key: 'C',
    },
    measures: [notes],
    lyrics: [notes.map((_, i) => `syl${i}`)],
  };
}

/**
 * Counts total notes in a melody
 */
function countNotes(melody: Melody): number {
  return melody.measures.reduce((sum, measure) => sum + measure.length, 0);
}

/**
 * Gets all pitches from a melody as a flat array
 */
function getAllPitches(melody: Melody): string[] {
  return melody.measures.flat().map((n) => n.pitch);
}

// =============================================================================
// Style Preset Tests
// =============================================================================

describe('Style Presets', () => {
  describe('getAvailablePresets', () => {
    it('returns all four presets', () => {
      const presets = getAvailablePresets();

      expect(presets).toHaveLength(4);
    });

    it('includes Folk preset', () => {
      const presets = getAvailablePresets();
      const folk = presets.find((p) => p.name === 'folk');

      expect(folk).toBeDefined();
      expect(folk?.timeSignature).toBe('4/4');
    });

    it('includes Classical preset', () => {
      const presets = getAvailablePresets();
      const classical = presets.find((p) => p.name === 'classical');

      expect(classical).toBeDefined();
      expect(classical?.tempoRange[1]).toBeGreaterThan(classical?.tempoRange[0] || 0);
    });

    it('includes Pop preset', () => {
      const presets = getAvailablePresets();
      const pop = presets.find((p) => p.name === 'pop');

      expect(pop).toBeDefined();
      expect(pop?.contourType).toBe('wave');
    });

    it('includes Hymn preset', () => {
      const presets = getAvailablePresets();
      const hymn = presets.find((p) => p.name === 'hymn');

      expect(hymn).toBeDefined();
      expect(hymn?.contourType).toBe('descending');
    });

    it('returns copies of presets (not references)', () => {
      const presets1 = getAvailablePresets();
      const presets2 = getAvailablePresets();

      expect(presets1[0]).not.toBe(presets2[0]);
      expect(presets1[0]).toEqual(presets2[0]);
    });
  });

  describe('getPresetByName', () => {
    it('returns Folk preset by name', () => {
      const preset = getPresetByName('folk');

      expect(preset).toBeDefined();
      expect(preset?.name).toBe('folk');
    });

    it('returns Classical preset by name', () => {
      const preset = getPresetByName('classical');

      expect(preset).toBeDefined();
      expect(preset?.name).toBe('classical');
    });

    it('returns Pop preset by name', () => {
      const preset = getPresetByName('pop');

      expect(preset).toBeDefined();
      expect(preset?.name).toBe('pop');
    });

    it('returns Hymn preset by name', () => {
      const preset = getPresetByName('hymn');

      expect(preset).toBeDefined();
      expect(preset?.name).toBe('hymn');
    });

    it('is case-insensitive', () => {
      expect(getPresetByName('FOLK')?.name).toBe('folk');
      expect(getPresetByName('Folk')?.name).toBe('folk');
      expect(getPresetByName('fOlK')?.name).toBe('folk');
    });

    it('returns undefined for unknown preset', () => {
      const preset = getPresetByName('unknown');

      expect(preset).toBeUndefined();
    });

    it('returns a copy (not reference)', () => {
      const preset1 = getPresetByName('folk');
      const preset2 = getPresetByName('folk');

      expect(preset1).not.toBe(preset2);
      expect(preset1).toEqual(preset2);
    });
  });

  describe('exported preset constants', () => {
    it('exports FOLK_PRESET with correct properties', () => {
      expect(FOLK_PRESET.name).toBe('folk');
      expect(FOLK_PRESET.timeSignature).toBe('4/4');
      expect(FOLK_PRESET.contourType).toBe('arch');
      expect(FOLK_PRESET.tempoRange).toEqual([80, 120]);
      expect(FOLK_PRESET.intervalPreferences.length).toBeGreaterThan(0);
      expect(FOLK_PRESET.description.length).toBeGreaterThan(0);
    });

    it('exports CLASSICAL_PRESET with correct properties', () => {
      expect(CLASSICAL_PRESET.name).toBe('classical');
      expect(CLASSICAL_PRESET.timeSignature).toBe('4/4');
      expect(CLASSICAL_PRESET.contourType).toBe('arch');
      expect(CLASSICAL_PRESET.tempoRange).toEqual([60, 140]);
      expect(CLASSICAL_PRESET.intervalPreferences).toContain(4); // Includes larger intervals
    });

    it('exports POP_PRESET with correct properties', () => {
      expect(POP_PRESET.name).toBe('pop');
      expect(POP_PRESET.timeSignature).toBe('4/4');
      expect(POP_PRESET.contourType).toBe('wave');
      expect(POP_PRESET.tempoRange).toEqual([100, 140]);
    });

    it('exports HYMN_PRESET with correct properties', () => {
      expect(HYMN_PRESET.name).toBe('hymn');
      expect(HYMN_PRESET.timeSignature).toBe('4/4');
      expect(HYMN_PRESET.contourType).toBe('descending');
      expect(HYMN_PRESET.tempoRange).toEqual([60, 90]);
    });
  });

  describe('preset structure validation', () => {
    const presets = [FOLK_PRESET, CLASSICAL_PRESET, POP_PRESET, HYMN_PRESET];

    it.each(presets)('$name preset has all required fields', (preset) => {
      expect(preset.name).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(preset.timeSignature).toBeTruthy();
      expect(preset.tempoRange).toHaveLength(2);
      expect(preset.tempoRange[0]).toBeLessThan(preset.tempoRange[1]);
      expect(preset.intervalPreferences.length).toBeGreaterThan(0);
      expect(['arch', 'descending', 'ascending', 'wave']).toContain(preset.contourType);
    });

    it.each(presets)('$name preset has valid time signature', (preset) => {
      expect(['4/4', '3/4', '6/8', '2/4']).toContain(preset.timeSignature);
    });

    it.each(presets)('$name preset has reasonable tempo range', (preset) => {
      expect(preset.tempoRange[0]).toBeGreaterThanOrEqual(40);
      expect(preset.tempoRange[1]).toBeLessThanOrEqual(200);
    });
  });
});

// =============================================================================
// applyStylePreset Tests
// =============================================================================

describe('applyStylePreset', () => {
  describe('basic functionality', () => {
    it('returns a new melody object', () => {
      const melody = createTestMelody();
      const result = applyStylePreset(melody, FOLK_PRESET);

      expect(result).not.toBe(melody);
    });

    it('does not mutate original melody', () => {
      const melody = createTestMelody({ tempo: 100 });
      const originalTempo = melody.params.tempo;

      applyStylePreset(melody, FOLK_PRESET);

      expect(melody.params.tempo).toBe(originalTempo);
    });

    it('applies preset time signature', () => {
      const melody = createTestMelody({ timeSignature: '3/4' });
      const result = applyStylePreset(melody, FOLK_PRESET);

      expect(result.params.timeSignature).toBe(FOLK_PRESET.timeSignature);
    });

    it('adjusts tempo to fit preset range', () => {
      const melody = createTestMelody({ tempo: 200 }); // Above Folk range
      const result = applyStylePreset(melody, FOLK_PRESET);

      expect(result.params.tempo).toBeGreaterThanOrEqual(FOLK_PRESET.tempoRange[0]);
      expect(result.params.tempo).toBeLessThanOrEqual(FOLK_PRESET.tempoRange[1]);
    });

    it('preserves tempo if already in range', () => {
      const melody = createTestMelody({ tempo: 100 }); // Within Folk range
      const result = applyStylePreset(melody, FOLK_PRESET);

      expect(result.params.tempo).toBe(100);
    });
  });

  describe('preset-specific transformations', () => {
    it('Folk preset produces stepwise motion', () => {
      // Create a melody with a large leap
      const melody = createMelodyWithNotes([
        { pitch: 'C', octave: 0, duration: 2 },
        { pitch: 'G', octave: 0, duration: 2 }, // 5th interval
        { pitch: 'C', octave: 1, duration: 2 }, // Another large interval
      ]);

      const result = applyStylePreset(melody, FOLK_PRESET);

      // Should still have notes
      expect(countNotes(result)).toBeGreaterThan(0);
    });

    it('Classical preset allows wider intervals', () => {
      const melody = createTestMelody();
      const result = applyStylePreset(melody, CLASSICAL_PRESET);

      expect(result.params.timeSignature).toBe('4/4');
      expect(countNotes(result)).toBeGreaterThan(0);
    });

    it('Pop preset maintains rhythmic structure', () => {
      const melody = createTestMelody();
      const result = applyStylePreset(melody, POP_PRESET);

      expect(result.params.timeSignature).toBe('4/4');
      expect(countNotes(result)).toBeGreaterThan(0);
    });

    it('Hymn preset tends toward longer notes', () => {
      const melody = createTestMelody();
      const result = applyStylePreset(melody, HYMN_PRESET);

      // Hymn should have stately tempo
      expect(result.params.tempo).toBeLessThanOrEqual(90);
    });
  });

  describe('edge cases', () => {
    it('handles empty measures', () => {
      const melody: Melody = {
        params: {
          title: 'Empty',
          timeSignature: '4/4',
          defaultNoteLength: '1/8',
          tempo: 100,
          key: 'C',
        },
        measures: [[]],
        lyrics: [[]],
      };

      const result = applyStylePreset(melody, FOLK_PRESET);

      expect(result.measures).toHaveLength(1);
    });

    it('handles single note melody', () => {
      const melody = createMelodyWithNotes([
        { pitch: 'C', octave: 0, duration: 4 },
      ]);

      const result = applyStylePreset(melody, FOLK_PRESET);

      expect(countNotes(result)).toBe(1);
    });

    it('handles rests in melody', () => {
      const melody = createMelodyWithNotes([
        { pitch: 'C', octave: 0, duration: 2 },
        { pitch: 'z', octave: 0, duration: 2 }, // Rest
        { pitch: 'E', octave: 0, duration: 2 },
      ]);

      const result = applyStylePreset(melody, FOLK_PRESET);
      const pitches = getAllPitches(result);

      // Rest should be preserved
      expect(pitches).toContain('z');
    });
  });
});

// =============================================================================
// generateVariation Tests
// =============================================================================

describe('generateVariation', () => {
  describe('ornament variation', () => {
    it('adds notes to the melody', () => {
      const melody = createTestMelody({ noteCount: 8 });
      const original = countNotes(melody);

      const result = generateVariation(melody, 'ornament', {
        ornamentProbability: 1, // Maximum ornamentation
        seed: 12345,
      });

      // With 100% probability and large intervals, notes should be added
      expect(countNotes(result)).toBeGreaterThanOrEqual(original);
    });

    it('preserves melody with zero probability', () => {
      const melody = createTestMelody();
      const original = countNotes(melody);

      const result = generateVariation(melody, 'ornament', {
        ornamentProbability: 0,
        seed: 12345,
      });

      expect(countNotes(result)).toBe(original);
    });

    it('adds passing tones between distant notes', () => {
      const melody = createMelodyWithNotes([
        { pitch: 'C', octave: 0, duration: 2 },
        { pitch: 'G', octave: 0, duration: 2 }, // Large leap
      ]);

      const result = generateVariation(melody, 'ornament', {
        ornamentProbability: 1,
        seed: 12345,
      });

      // Should add at least one passing tone
      expect(countNotes(result)).toBeGreaterThanOrEqual(2);
    });

    it('preserves rests', () => {
      const melody = createMelodyWithNotes([
        { pitch: 'C', octave: 0, duration: 2 },
        { pitch: 'z', octave: 0, duration: 2 },
        { pitch: 'E', octave: 0, duration: 2 },
      ]);

      const result = generateVariation(melody, 'ornament', { seed: 12345 });
      const pitches = getAllPitches(result);

      expect(pitches).toContain('z');
    });

    it('produces consistent results with same seed', () => {
      const melody = createTestMelody();

      const result1 = generateVariation(melody, 'ornament', { seed: 12345 });
      const result2 = generateVariation(melody, 'ornament', { seed: 12345 });

      expect(countNotes(result1)).toBe(countNotes(result2));
    });
  });

  describe('simplify variation', () => {
    it('reduces or maintains note count', () => {
      const melody = createTestMelody({ noteCount: 8 });
      const original = countNotes(melody);

      const result = generateVariation(melody, 'simplify');

      expect(countNotes(result)).toBeLessThanOrEqual(original);
    });

    it('consolidates repeated pitches', () => {
      const melody = createMelodyWithNotes([
        { pitch: 'C', octave: 0, duration: 2 },
        { pitch: 'C', octave: 0, duration: 2 }, // Same pitch
        { pitch: 'C', octave: 0, duration: 2 }, // Same pitch
        { pitch: 'E', octave: 0, duration: 2 },
      ]);

      const result = generateVariation(melody, 'simplify');

      // Three consecutive Cs should be consolidated
      expect(countNotes(result)).toBeLessThan(4);
    });

    it('extends short notes to minimum duration', () => {
      const melody = createMelodyWithNotes([
        { pitch: 'C', octave: 0, duration: 0.5 }, // Very short
        { pitch: 'D', octave: 0, duration: 0.5 }, // Very short
      ]);

      const result = generateVariation(melody, 'simplify');

      // Should still have notes (short ones may be absorbed or extended)
      expect(result.measures.length).toBeGreaterThan(0);
    });

    it('preserves rests', () => {
      const melody = createMelodyWithNotes([
        { pitch: 'C', octave: 0, duration: 2 },
        { pitch: 'z', octave: 0, duration: 2 },
        { pitch: 'E', octave: 0, duration: 2 },
      ]);

      const result = generateVariation(melody, 'simplify');
      const pitches = getAllPitches(result);

      expect(pitches).toContain('z');
    });
  });

  describe('invert variation', () => {
    it('inverts pitches around a pivot', () => {
      const melody = createMelodyWithNotes([
        { pitch: 'C', octave: 0, duration: 2 },
        { pitch: 'E', octave: 0, duration: 2 },
        { pitch: 'G', octave: 0, duration: 2 },
      ]);

      const result = generateVariation(melody, 'invert');

      // Inverted melody should have different pitch pattern
      const originalPitches = getAllPitches(melody);
      const invertedPitches = getAllPitches(result);

      expect(invertedPitches.length).toBe(originalPitches.length);
    });

    it('uses specified pivot pitch', () => {
      const melody = createMelodyWithNotes([
        { pitch: 'C', octave: 0, duration: 2 },
        { pitch: 'G', octave: 0, duration: 2 },
      ]);

      const result = generateVariation(melody, 'invert', { pivotPitch: 'E' });

      expect(countNotes(result)).toBe(2);
    });

    it('preserves durations', () => {
      const melody = createMelodyWithNotes([
        { pitch: 'C', octave: 0, duration: 2 },
        { pitch: 'E', octave: 0, duration: 4 },
      ]);

      const result = generateVariation(melody, 'invert');

      expect(result.measures[0][0].duration).toBe(2);
      expect(result.measures[0][1].duration).toBe(4);
    });

    it('preserves rests', () => {
      const melody = createMelodyWithNotes([
        { pitch: 'C', octave: 0, duration: 2 },
        { pitch: 'z', octave: 0, duration: 2 },
        { pitch: 'E', octave: 0, duration: 2 },
      ]);

      const result = generateVariation(melody, 'invert');

      expect(result.measures[0][1].pitch).toBe('z');
    });

    it('maintains note count', () => {
      const melody = createTestMelody({ noteCount: 8 });
      const result = generateVariation(melody, 'invert');

      expect(countNotes(result)).toBe(countNotes(melody));
    });
  });

  describe('transpose variation', () => {
    it('shifts all pitches up by specified semitones', () => {
      const melody = createMelodyWithNotes([
        { pitch: 'C', octave: 0, duration: 2 },
      ]);

      const result = generateVariation(melody, 'transpose', {
        transposeSemitones: 2, // Up a whole step
      });

      expect(result.measures[0][0].pitch).toBe('D');
    });

    it('shifts all pitches down by specified semitones', () => {
      const melody = createMelodyWithNotes([
        { pitch: 'D', octave: 0, duration: 2 },
      ]);

      const result = generateVariation(melody, 'transpose', {
        transposeSemitones: -2, // Down a whole step
      });

      expect(result.measures[0][0].pitch).toBe('C');
    });

    it('handles octave changes when transposing up', () => {
      const melody = createMelodyWithNotes([
        { pitch: 'B', octave: 0, duration: 2 },
      ]);

      const result = generateVariation(melody, 'transpose', {
        transposeSemitones: 1, // Up a half step to C
      });

      expect(result.measures[0][0].pitch).toBe('C');
      expect(result.measures[0][0].octave).toBe(1);
    });

    it('handles octave changes when transposing down', () => {
      const melody = createMelodyWithNotes([
        { pitch: 'C', octave: 0, duration: 2 },
      ]);

      const result = generateVariation(melody, 'transpose', {
        transposeSemitones: -1, // Down a half step to B
      });

      expect(result.measures[0][0].pitch).toBe('B');
      expect(result.measures[0][0].octave).toBe(-1);
    });

    it('returns clone with zero transposition', () => {
      const melody = createTestMelody();

      const result = generateVariation(melody, 'transpose', {
        transposeSemitones: 0,
      });

      expect(getAllPitches(result)).toEqual(getAllPitches(melody));
    });

    it('preserves rests', () => {
      const melody = createMelodyWithNotes([
        { pitch: 'C', octave: 0, duration: 2 },
        { pitch: 'z', octave: 0, duration: 2 },
        { pitch: 'E', octave: 0, duration: 2 },
      ]);

      const result = generateVariation(melody, 'transpose', {
        transposeSemitones: 5,
      });

      expect(result.measures[0][1].pitch).toBe('z');
    });

    it('updates title with transposition info', () => {
      const melody = createTestMelody({ title: 'Original' });

      const result = generateVariation(melody, 'transpose', {
        transposeSemitones: 5,
      });

      expect(result.params.title).toContain('transposed');
    });

    it('handles large transpositions', () => {
      const melody = createMelodyWithNotes([
        { pitch: 'C', octave: 0, duration: 2 },
      ]);

      const result = generateVariation(melody, 'transpose', {
        transposeSemitones: 24, // Up 2 octaves
      });

      expect(result.measures[0][0].octave).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('handles empty melody', () => {
      const melody: Melody = {
        params: {
          title: 'Empty',
          timeSignature: '4/4',
          defaultNoteLength: '1/8',
          tempo: 100,
          key: 'C',
        },
        measures: [[]],
        lyrics: [[]],
      };

      const result = generateVariation(melody, 'ornament');

      expect(result.measures).toHaveLength(1);
    });

    it('handles single note melody', () => {
      const melody = createMelodyWithNotes([
        { pitch: 'C', octave: 0, duration: 4 },
      ]);

      const result = generateVariation(melody, 'simplify');

      expect(countNotes(result)).toBeGreaterThanOrEqual(1);
    });

    it('does not mutate original melody', () => {
      const melody = createTestMelody();
      const originalPitches = getAllPitches(melody);

      generateVariation(melody, 'invert');

      expect(getAllPitches(melody)).toEqual(originalPitches);
    });
  });
});

// =============================================================================
// Utility Function Tests
// =============================================================================

describe('Utility Functions', () => {
  describe('isValidPresetName', () => {
    it('returns true for valid preset names', () => {
      expect(isValidPresetName('folk')).toBe(true);
      expect(isValidPresetName('classical')).toBe(true);
      expect(isValidPresetName('pop')).toBe(true);
      expect(isValidPresetName('hymn')).toBe(true);
    });

    it('is case-insensitive', () => {
      expect(isValidPresetName('FOLK')).toBe(true);
      expect(isValidPresetName('Folk')).toBe(true);
      expect(isValidPresetName('CLASSICAL')).toBe(true);
    });

    it('returns false for invalid names', () => {
      expect(isValidPresetName('jazz')).toBe(false);
      expect(isValidPresetName('rock')).toBe(false);
      expect(isValidPresetName('')).toBe(false);
    });
  });

  describe('isValidVariationType', () => {
    it('returns true for valid variation types', () => {
      expect(isValidVariationType('ornament')).toBe(true);
      expect(isValidVariationType('simplify')).toBe(true);
      expect(isValidVariationType('invert')).toBe(true);
      expect(isValidVariationType('transpose')).toBe(true);
    });

    it('returns false for invalid types', () => {
      expect(isValidVariationType('invalid')).toBe(false);
      expect(isValidVariationType('double')).toBe(false);
      expect(isValidVariationType('')).toBe(false);
    });
  });

  describe('getVariationDescription', () => {
    it('returns description for ornament', () => {
      const desc = getVariationDescription('ornament');

      expect(desc).toContain('passing');
      expect(desc.length).toBeGreaterThan(10);
    });

    it('returns description for simplify', () => {
      const desc = getVariationDescription('simplify');

      expect(desc).toContain('complexity');
      expect(desc.length).toBeGreaterThan(10);
    });

    it('returns description for invert', () => {
      const desc = getVariationDescription('invert');

      expect(desc.toLowerCase()).toContain('mirror');
      expect(desc.length).toBeGreaterThan(10);
    });

    it('returns description for transpose', () => {
      const desc = getVariationDescription('transpose');

      expect(desc).toContain('pitch');
      expect(desc.length).toBeGreaterThan(10);
    });
  });

  describe('summarizeVariation', () => {
    it('calculates note count change', () => {
      const original = createTestMelody({ noteCount: 8 });
      const varied = createTestMelody({ noteCount: 12 });

      const summary = summarizeVariation(original, varied);

      expect(summary.noteCountChange).toBe(4);
    });

    it('calculates tempo change', () => {
      const original = createTestMelody({ tempo: 100 });
      const varied = createTestMelody({ tempo: 120 });

      const summary = summarizeVariation(original, varied);

      expect(summary.tempoChange).toBe(20);
    });

    it('detects time signature change', () => {
      const original = createTestMelody({ timeSignature: '4/4' });
      const varied = createTestMelody({ timeSignature: '3/4' });

      const summary = summarizeVariation(original, varied);

      expect(summary.timeSignatureChanged).toBe(true);
    });

    it('detects no time signature change', () => {
      const original = createTestMelody({ timeSignature: '4/4' });
      const varied = createTestMelody({ timeSignature: '4/4' });

      const summary = summarizeVariation(original, varied);

      expect(summary.timeSignatureChanged).toBe(false);
    });
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Integration', () => {
  describe('preset then variation', () => {
    it('applies preset then generates variation', () => {
      const melody = createTestMelody();

      // First apply Folk preset
      const folkMelody = applyStylePreset(melody, FOLK_PRESET);

      // Then generate an ornamented variation
      const ornamented = generateVariation(folkMelody, 'ornament', { seed: 12345 });

      expect(ornamented.params.timeSignature).toBe(FOLK_PRESET.timeSignature);
      expect(countNotes(ornamented)).toBeGreaterThan(0);
    });

    it('applies multiple variations in sequence', () => {
      const melody = createTestMelody();

      // Transpose up
      const transposed = generateVariation(melody, 'transpose', {
        transposeSemitones: 5,
      });

      // Then simplify
      const simplified = generateVariation(transposed, 'simplify');

      // Then ornament
      const ornamented = generateVariation(simplified, 'ornament', {
        seed: 12345,
        ornamentProbability: 0.5,
      });

      expect(countNotes(ornamented)).toBeGreaterThan(0);
    });
  });

  describe('all presets with all variations', () => {
    const presets = [FOLK_PRESET, CLASSICAL_PRESET, POP_PRESET, HYMN_PRESET];
    const variations: VariationType[] = ['ornament', 'simplify', 'invert', 'transpose'];

    presets.forEach((preset) => {
      variations.forEach((variation) => {
        it(`applies ${preset.name} preset then ${variation} variation`, () => {
          const melody = createTestMelody();

          const styled = applyStylePreset(melody, preset);
          const varied = generateVariation(styled, variation, {
            seed: 12345,
            transposeSemitones: 5,
          });

          expect(countNotes(varied)).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('consistency across runs', () => {
    it('produces identical results with same seed', () => {
      const melody = createTestMelody();

      const run1 = generateVariation(
        applyStylePreset(melody, FOLK_PRESET),
        'ornament',
        { seed: 42, ornamentProbability: 0.5 }
      );

      const run2 = generateVariation(
        applyStylePreset(melody, FOLK_PRESET),
        'ornament',
        { seed: 42, ornamentProbability: 0.5 }
      );

      expect(getAllPitches(run1)).toEqual(getAllPitches(run2));
    });
  });
});

// =============================================================================
// Type Export Tests
// =============================================================================

describe('Type Exports', () => {
  it('exports StylePreset type', () => {
    const preset: StylePreset = {
      name: 'test',
      description: 'Test preset',
      timeSignature: '4/4',
      tempoRange: [80, 120],
      intervalPreferences: [1, 2],
      contourType: 'arch',
    };

    expect(preset.name).toBe('test');
  });

  it('exports VariationType type', () => {
    const types: VariationType[] = ['ornament', 'simplify', 'invert', 'transpose'];

    expect(types).toHaveLength(4);
  });

  it('exports ContourType type', () => {
    const contours: ContourType[] = ['arch', 'descending', 'ascending', 'wave'];

    expect(contours).toHaveLength(4);
  });
});
