/**
 * Melody Variation and Style Preset System
 *
 * This module provides functionality for:
 * - Applying style presets to melodies (Folk, Classical, Pop, Hymn)
 * - Generating melody variations (ornament, simplify, invert, transpose)
 *
 * Style presets modify melodic characteristics to match specific musical genres,
 * while variations transform existing melodies while preserving their core structure.
 *
 * @module lib/melody/variations
 */

import type { Melody, Note, TimeSignature } from './types';

// =============================================================================
// Debug Logging
// =============================================================================

const DEBUG = process.env.NODE_ENV === 'development';
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[variations] ${message}`, ...args);
  }
};

// =============================================================================
// Types
// =============================================================================

/**
 * Contour type describing the melodic shape preference
 * - arch: Rise to peak around 60%, then descend (most common)
 * - descending: High start, gradual descent (endings, melancholy)
 * - ascending: Low start, gradual ascent (building tension)
 * - wave: Sinusoidal pattern (flowing, continuous)
 */
export type ContourType = 'arch' | 'descending' | 'ascending' | 'wave';

/**
 * Style preset configuration
 *
 * Defines the musical characteristics for a specific style/genre.
 * Used to shape melodies to match genre conventions.
 */
export interface StylePreset {
  /** Unique identifier for the preset */
  name: string;
  /** Human-readable description of the style */
  description: string;
  /** Preferred time signature for this style */
  timeSignature: TimeSignature;
  /** Tempo range [min, max] in BPM appropriate for this style */
  tempoRange: [number, number];
  /**
   * Preferred interval sizes (in scale degrees)
   * Lower values = stepwise motion, higher values = leaps
   */
  intervalPreferences: number[];
  /** Preferred melodic contour shape */
  contourType: ContourType;
}

/**
 * Variation types that can be applied to a melody
 * - ornament: Add passing tones, neighbor notes, and decorative elements
 * - simplify: Reduce complexity, remove ornaments, use longer note values
 * - invert: Mirror the melody around a pivot note
 * - transpose: Shift all pitches up or down by a specified interval
 */
export type VariationType = 'ornament' | 'simplify' | 'invert' | 'transpose';

/**
 * Options for variation generation
 */
export interface VariationOptions {
  /** For transpose: number of semitones to shift (positive = up, negative = down) */
  transposeSemitones?: number;
  /** For invert: the pivot pitch to mirror around (default: middle of range) */
  pivotPitch?: string;
  /** For ornament: probability of adding ornaments (0-1, default: 0.3) */
  ornamentProbability?: number;
  /** Random seed for reproducibility */
  seed?: number;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Pitch names in order for calculations
 */
const PITCH_ORDER = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

/**
 * Semitone distances from C for each natural pitch
 */
const PITCH_TO_SEMITONE: Record<string, number> = {
  'C': 0,
  'D': 2,
  'E': 4,
  'F': 5,
  'G': 7,
  'A': 9,
  'B': 11,
};

/**
 * Semitone to pitch mapping (using sharps for simplicity)
 */
const SEMITONE_TO_PITCH: Record<number, string> = {
  0: 'C',
  1: 'C', // C# -> C for simplicity in diatonic context
  2: 'D',
  3: 'D', // D# -> D
  4: 'E',
  5: 'F',
  6: 'F', // F# -> F
  7: 'G',
  8: 'G', // G# -> G
  9: 'A',
  10: 'A', // A# -> A
  11: 'B',
};

// =============================================================================
// Style Presets
// =============================================================================

/**
 * Folk style preset
 *
 * Characteristics:
 * - Simple, stepwise melodic motion
 * - 4/4 time signature (common time)
 * - Moderate tempo range
 * - Arch-shaped phrases typical of folk songs
 */
export const FOLK_PRESET: StylePreset = {
  name: 'folk',
  description: 'Simple, stepwise motion with arch-shaped phrases. Traditional folk song style with accessible melodies.',
  timeSignature: '4/4',
  tempoRange: [80, 120],
  intervalPreferences: [1, 2, 1, 2, 3], // Prefer steps (1, 2), occasional third
  contourType: 'arch',
};

/**
 * Classical style preset
 *
 * Characteristics:
 * - Arched phrases with wider melodic range
 * - 4/4 or 3/4 time signatures
 * - Variable tempo range to accommodate different forms
 * - Balanced phrase structures
 */
export const CLASSICAL_PRESET: StylePreset = {
  name: 'classical',
  description: 'Arched phrases with wider range and balanced structure. Elegant, formal melodic style.',
  timeSignature: '4/4',
  tempoRange: [60, 140],
  intervalPreferences: [1, 2, 3, 4, 5], // More varied intervals including leaps
  contourType: 'arch',
};

/**
 * Pop style preset
 *
 * Characteristics:
 * - Repetitive, hook-based melodic patterns
 * - Strong 4/4 time signature
 * - Upbeat tempo range
 * - Wave-like contours for catchy melodies
 */
export const POP_PRESET: StylePreset = {
  name: 'pop',
  description: 'Repetitive, hook-based melodies with strong rhythmic feel. Catchy and memorable.',
  timeSignature: '4/4',
  tempoRange: [100, 140],
  intervalPreferences: [1, 1, 2, 2, 3], // Very stepwise, repetitive intervals
  contourType: 'wave',
};

/**
 * Hymn style preset
 *
 * Characteristics:
 * - Block chord feel, suitable for 4-part harmony
 * - Often in 4/4 or 3/4 time
 * - Slower, stately tempo range
 * - Predominantly stepwise with clear phrase endings
 */
export const HYMN_PRESET: StylePreset = {
  name: 'hymn',
  description: 'Block chord feel, suitable for 4-part harmony. Stately, reverent melodic style.',
  timeSignature: '4/4',
  tempoRange: [60, 90],
  intervalPreferences: [1, 2, 3, 2, 1], // Balanced stepwise motion
  contourType: 'descending', // Often resolves downward for reverent feel
};

/**
 * All available presets
 */
const STYLE_PRESETS: StylePreset[] = [
  FOLK_PRESET,
  CLASSICAL_PRESET,
  POP_PRESET,
  HYMN_PRESET,
];

// =============================================================================
// Seeded Random Number Generator
// =============================================================================

/**
 * Simple seeded pseudo-random number generator (Mulberry32)
 */
class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Deep clones a melody object
 */
function cloneMelody(melody: Melody): Melody {
  return {
    params: { ...melody.params },
    measures: melody.measures.map((measure) =>
      measure.map((note) => ({ ...note }))
    ),
    lyrics: melody.lyrics.map((measureLyrics) => [...measureLyrics]),
  };
}

/**
 * Gets the pitch index (0-6) for a pitch name
 */
function getPitchIndex(pitch: string): number {
  const upper = pitch.toUpperCase();
  const index = PITCH_ORDER.indexOf(upper);
  return index >= 0 ? index : 0;
}

/**
 * Gets the pitch name from an index (0-6)
 */
function getPitchFromIndex(index: number): string {
  let normalizedIndex = index % 7;
  if (normalizedIndex < 0) normalizedIndex += 7;
  return PITCH_ORDER[normalizedIndex];
}

/**
 * Calculates the interval (in scale degrees) between two pitches
 */
function calculateInterval(pitch1: string, pitch2: string): number {
  const index1 = getPitchIndex(pitch1);
  const index2 = getPitchIndex(pitch2);
  return Math.abs(index2 - index1);
}

/**
 * Gets a note between two pitches (passing tone)
 */
function getPassingTone(from: string, to: string): string {
  const fromIndex = getPitchIndex(from);
  const toIndex = getPitchIndex(to);

  if (fromIndex === toIndex) return from;

  const direction = toIndex > fromIndex ? 1 : -1;
  const middleIndex = fromIndex + direction;

  return getPitchFromIndex(middleIndex);
}

/**
 * Gets a neighbor note (one step above or below)
 */
function getNeighborNote(pitch: string, direction: 'upper' | 'lower'): string {
  const index = getPitchIndex(pitch);
  const offset = direction === 'upper' ? 1 : -1;
  return getPitchFromIndex(index + offset);
}

/**
 * Converts pitch and octave to absolute semitone value
 */
function toAbsoluteSemitone(pitch: string, octave: number): number {
  const semitone = PITCH_TO_SEMITONE[pitch.toUpperCase()] || 0;
  return octave * 12 + semitone;
}

/**
 * Converts absolute semitone value to pitch and octave
 */
function fromAbsoluteSemitone(semitone: number): { pitch: string; octave: number } {
  const octave = Math.floor(semitone / 12);
  let pitchSemitone = semitone % 12;
  if (pitchSemitone < 0) pitchSemitone += 12;

  const pitch = SEMITONE_TO_PITCH[pitchSemitone] || 'C';
  return { pitch, octave };
}

/**
 * Adjusts the tempo to fit within a preset's range
 */
function adjustTempoToRange(tempo: number, range: [number, number]): number {
  const [min, max] = range;
  if (tempo < min) return min;
  if (tempo > max) return max;
  return tempo;
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Gets all available style presets
 *
 * Returns a copy of the presets array to prevent external modification.
 *
 * @returns Array of available StylePreset objects
 *
 * @example
 * const presets = getAvailablePresets();
 * console.log(presets.map(p => p.name)); // ['folk', 'classical', 'pop', 'hymn']
 */
export function getAvailablePresets(): StylePreset[] {
  log('getAvailablePresets: returning', STYLE_PRESETS.length, 'presets');
  return STYLE_PRESETS.map((preset) => ({ ...preset }));
}

/**
 * Gets a specific preset by name
 *
 * @param name - The preset name to find
 * @returns The preset if found, undefined otherwise
 */
export function getPresetByName(name: string): StylePreset | undefined {
  const preset = STYLE_PRESETS.find(
    (p) => p.name.toLowerCase() === name.toLowerCase()
  );
  return preset ? { ...preset } : undefined;
}

/**
 * Applies a style preset to a melody
 *
 * This function transforms a melody to match the characteristics of a given style preset.
 * It modifies:
 * - Time signature (if different from current)
 * - Tempo (adjusted to fit preset's range)
 * - Melodic intervals (adjusted toward preset's preferences)
 * - Note durations (adjusted for style feel)
 *
 * @param melody - The input melody to transform
 * @param preset - The style preset to apply
 * @returns A new Melody with the preset characteristics applied
 *
 * @example
 * const folkMelody = applyStylePreset(melody, FOLK_PRESET);
 */
export function applyStylePreset(melody: Melody, preset: StylePreset): Melody {
  log('applyStylePreset: applying', preset.name, 'preset');

  // Clone the melody to avoid mutation
  const result = cloneMelody(melody);

  // Update parameters to match preset
  result.params.timeSignature = preset.timeSignature;
  result.params.tempo = adjustTempoToRange(result.params.tempo, preset.tempoRange);

  // Create seeded random for reproducibility based on melody content
  const seed = melody.measures.length * 1000 + (melody.measures[0]?.length || 0);
  const random = new SeededRandom(seed);

  // Process each measure
  result.measures = result.measures.map((measure) => {
    return processNotesForPreset(measure, preset, random);
  });

  log('applyStylePreset: completed transformation');
  return result;
}

/**
 * Processes notes in a measure to match preset characteristics
 */
function processNotesForPreset(
  notes: Note[],
  preset: StylePreset,
  random: SeededRandom
): Note[] {
  if (notes.length === 0) return notes;

  const result: Note[] = [];
  const preferredIntervals = preset.intervalPreferences;

  for (let i = 0; i < notes.length; i++) {
    const note = { ...notes[i] };
    const prevNote = result.length > 0 ? result[result.length - 1] : null;

    // Skip rests
    if (note.pitch === 'z' || note.pitch === 'Z') {
      result.push(note);
      continue;
    }

    // Adjust interval if previous note exists
    if (prevNote && prevNote.pitch !== 'z' && prevNote.pitch !== 'Z') {
      const currentInterval = calculateInterval(prevNote.pitch, note.pitch);

      // If current interval is too large for this style, reduce it
      const maxPreferredInterval = Math.max(...preferredIntervals);
      if (currentInterval > maxPreferredInterval) {
        // Move the note closer to previous
        const direction = getPitchIndex(note.pitch) > getPitchIndex(prevNote.pitch) ? 1 : -1;
        const targetInterval = random.pick(preferredIntervals);
        const prevIndex = getPitchIndex(prevNote.pitch);
        const newIndex = prevIndex + direction * targetInterval;
        note.pitch = getPitchFromIndex(newIndex);

        // Adjust octave if needed
        if (newIndex >= 7) {
          note.octave = prevNote.octave + 1;
        } else if (newIndex < 0) {
          note.octave = prevNote.octave - 1;
        } else {
          note.octave = prevNote.octave;
        }
      }
    }

    // Apply style-specific duration adjustments
    note.duration = adjustDurationForPreset(note.duration, preset, random);

    result.push(note);
  }

  return result;
}

/**
 * Adjusts note duration based on preset style
 */
function adjustDurationForPreset(
  duration: number,
  preset: StylePreset,
  random: SeededRandom
): number {
  switch (preset.name) {
    case 'folk':
      // Folk tends to use quarter and half notes
      if (duration < 1.5) return 2;
      if (duration > 4) return 4;
      return duration;

    case 'classical':
      // Classical uses varied durations
      // Occasionally double or halve for variety
      if (random.next() < 0.2) {
        return duration * (random.next() > 0.5 ? 2 : 0.5);
      }
      return duration;

    case 'pop':
      // Pop tends toward shorter, punchy notes
      if (duration > 2) return 2;
      return duration;

    case 'hymn':
      // Hymns use longer, stately notes
      if (duration < 2) return 2;
      if (duration < 4 && random.next() < 0.3) return 4;
      return duration;

    default:
      return duration;
  }
}

/**
 * Generates a variation of a melody
 *
 * Creates a transformed version of the input melody based on the variation type:
 * - ornament: Adds passing tones, neighbor notes, and other decorations
 * - simplify: Reduces complexity, removes short notes, extends durations
 * - invert: Mirrors the melody around a pivot point
 * - transpose: Shifts all pitches by a specified interval
 *
 * @param melody - The input melody to vary
 * @param variationType - The type of variation to apply
 * @param options - Additional options for the variation
 * @returns A new Melody with the variation applied
 *
 * @example
 * const ornamented = generateVariation(melody, 'ornament');
 * const simplified = generateVariation(melody, 'simplify');
 * const inverted = generateVariation(melody, 'invert');
 * const transposed = generateVariation(melody, 'transpose', { transposeSemitones: 5 });
 */
export function generateVariation(
  melody: Melody,
  variationType: VariationType,
  options: VariationOptions = {}
): Melody {
  log('generateVariation: applying', variationType, 'variation');

  switch (variationType) {
    case 'ornament':
      return applyOrnamentVariation(melody, options);
    case 'simplify':
      return applySimplifyVariation(melody);
    case 'invert':
      return applyInvertVariation(melody, options);
    case 'transpose':
      return applyTransposeVariation(melody, options);
    default:
      log('generateVariation: unknown variation type, returning clone');
      return cloneMelody(melody);
  }
}

/**
 * Applies ornamentation to a melody
 *
 * Adds musical decorations such as:
 * - Passing tones between distant notes
 * - Neighbor notes (upper/lower auxiliaries)
 * - Grace note effects (short notes before main notes)
 */
function applyOrnamentVariation(
  melody: Melody,
  options: VariationOptions
): Melody {
  log('applyOrnamentVariation: starting');

  const result = cloneMelody(melody);
  const probability = options.ornamentProbability ?? 0.3;
  const seed = options.seed ?? Date.now();
  const random = new SeededRandom(seed);

  result.measures = result.measures.map((measure, measureIndex) => {
    const lyrics = result.lyrics[measureIndex] || [];
    const newMeasure: Note[] = [];
    const newLyrics: string[] = [];

    for (let i = 0; i < measure.length; i++) {
      const note = measure[i];
      const nextNote = measure[i + 1];

      // Skip ornamenting rests
      if (note.pitch === 'z' || note.pitch === 'Z') {
        newMeasure.push({ ...note });
        newLyrics.push(lyrics[i] || '');
        continue;
      }

      // Decide if we add ornamentation before this note
      if (i > 0 && random.next() < probability * 0.5) {
        // Add a grace note (very short note before main)
        const graceDirection = random.next() > 0.5 ? 'upper' : 'lower';
        const gracePitch = getNeighborNote(note.pitch, graceDirection);
        newMeasure.push({
          pitch: gracePitch,
          octave: note.octave,
          duration: 0.5, // Very short
        });
        newLyrics.push(''); // No lyric for ornament
      }

      // Add the main note (possibly with reduced duration if ornament was added)
      const mainNote = { ...note };
      if (newMeasure.length > 0 && newMeasure[newMeasure.length - 1].duration === 0.5) {
        // Reduce main note duration to compensate for grace note
        mainNote.duration = Math.max(0.5, note.duration - 0.5);
      }
      newMeasure.push(mainNote);
      newLyrics.push(lyrics[i] || '');

      // Add passing tone between this and next note if interval is large
      if (nextNote && nextNote.pitch !== 'z' && nextNote.pitch !== 'Z') {
        const interval = calculateInterval(note.pitch, nextNote.pitch);
        if (interval >= 3 && random.next() < probability) {
          const passingPitch = getPassingTone(note.pitch, nextNote.pitch);
          newMeasure.push({
            pitch: passingPitch,
            octave: note.octave,
            duration: 1, // Short passing tone
          });
          newLyrics.push(''); // No lyric for passing tone
        }
      }
    }

    // Update lyrics for this measure
    result.lyrics[measureIndex] = newLyrics;

    return newMeasure;
  });

  log('applyOrnamentVariation: completed');
  return result;
}

/**
 * Applies simplification to a melody
 *
 * Reduces complexity by:
 * - Removing very short notes
 * - Extending note durations
 * - Consolidating repeated pitches
 */
function applySimplifyVariation(melody: Melody): Melody {
  log('applySimplifyVariation: starting');

  const result = cloneMelody(melody);

  result.measures = result.measures.map((measure, measureIndex) => {
    const lyrics = result.lyrics[measureIndex] || [];
    const newMeasure: Note[] = [];
    const newLyrics: string[] = [];

    for (let i = 0; i < measure.length; i++) {
      const note = measure[i];
      const prevNote = newMeasure.length > 0 ? newMeasure[newMeasure.length - 1] : null;

      // Skip very short notes (less than eighth note)
      if (note.duration < 1 && note.pitch !== 'z' && note.pitch !== 'Z') {
        // Extend previous note instead
        if (prevNote) {
          prevNote.duration += note.duration;
        }
        continue;
      }

      // Consolidate repeated pitches
      if (
        prevNote &&
        prevNote.pitch === note.pitch &&
        prevNote.octave === note.octave &&
        prevNote.pitch !== 'z'
      ) {
        prevNote.duration += note.duration;
        // Keep the lyric from this note if previous was empty
        const prevLyric = newLyrics[newLyrics.length - 1];
        if (!prevLyric && lyrics[i]) {
          newLyrics[newLyrics.length - 1] = lyrics[i];
        }
        continue;
      }

      // Add the note with minimum duration of quarter note
      const simplifiedNote = { ...note };
      if (simplifiedNote.duration < 2 && simplifiedNote.pitch !== 'z') {
        simplifiedNote.duration = 2;
      }
      newMeasure.push(simplifiedNote);
      newLyrics.push(lyrics[i] || '');
    }

    result.lyrics[measureIndex] = newLyrics;
    return newMeasure;
  });

  log('applySimplifyVariation: completed');
  return result;
}

/**
 * Applies melodic inversion to a melody
 *
 * Mirrors the melody around a pivot point so that:
 * - Notes above the pivot move below by the same interval
 * - Notes below the pivot move above by the same interval
 */
function applyInvertVariation(
  melody: Melody,
  options: VariationOptions
): Melody {
  log('applyInvertVariation: starting');

  const result = cloneMelody(melody);

  // Determine pivot point (middle of the range or specified)
  let pivotSemitone: number;

  if (options.pivotPitch) {
    pivotSemitone = PITCH_TO_SEMITONE[options.pivotPitch.toUpperCase()] || 0;
  } else {
    // Find the middle of the pitch range
    let minSemitone = Infinity;
    let maxSemitone = -Infinity;

    for (const measure of melody.measures) {
      for (const note of measure) {
        if (note.pitch !== 'z' && note.pitch !== 'Z') {
          const semitone = toAbsoluteSemitone(note.pitch, note.octave);
          minSemitone = Math.min(minSemitone, semitone);
          maxSemitone = Math.max(maxSemitone, semitone);
        }
      }
    }

    pivotSemitone = Math.floor((minSemitone + maxSemitone) / 2);
  }

  log('applyInvertVariation: pivot semitone', pivotSemitone);

  // Invert each note around the pivot
  result.measures = result.measures.map((measure) => {
    return measure.map((note) => {
      if (note.pitch === 'z' || note.pitch === 'Z') {
        return { ...note };
      }

      const originalSemitone = toAbsoluteSemitone(note.pitch, note.octave);
      const distance = originalSemitone - pivotSemitone;
      const invertedSemitone = pivotSemitone - distance;

      const { pitch, octave } = fromAbsoluteSemitone(invertedSemitone);

      return {
        pitch,
        octave,
        duration: note.duration,
      };
    });
  });

  log('applyInvertVariation: completed');
  return result;
}

/**
 * Applies transposition to a melody
 *
 * Shifts all pitches by a specified number of semitones while
 * preserving the melodic intervals and rhythm.
 */
function applyTransposeVariation(
  melody: Melody,
  options: VariationOptions
): Melody {
  log('applyTransposeVariation: starting');

  const semitones = options.transposeSemitones ?? 0;

  if (semitones === 0) {
    log('applyTransposeVariation: no transposition needed');
    return cloneMelody(melody);
  }

  const result = cloneMelody(melody);

  log('applyTransposeVariation: transposing by', semitones, 'semitones');

  result.measures = result.measures.map((measure) => {
    return measure.map((note) => {
      if (note.pitch === 'z' || note.pitch === 'Z') {
        return { ...note };
      }

      const originalSemitone = toAbsoluteSemitone(note.pitch, note.octave);
      const transposedSemitone = originalSemitone + semitones;

      const { pitch, octave } = fromAbsoluteSemitone(transposedSemitone);

      return {
        pitch,
        octave,
        duration: note.duration,
      };
    });
  });

  // Update key signature if needed (simplified: just note in title)
  const direction = semitones > 0 ? 'up' : 'down';
  const interval = Math.abs(semitones);
  result.params.title = `${melody.params.title} (transposed ${direction} ${interval} semitones)`;

  log('applyTransposeVariation: completed');
  return result;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Checks if a preset name is valid
 */
export function isValidPresetName(name: string): boolean {
  return STYLE_PRESETS.some(
    (p) => p.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Checks if a variation type is valid
 */
export function isValidVariationType(type: string): type is VariationType {
  const validTypes: VariationType[] = ['ornament', 'simplify', 'invert', 'transpose'];
  return validTypes.includes(type as VariationType);
}

/**
 * Gets the description for a variation type
 */
export function getVariationDescription(type: VariationType): string {
  switch (type) {
    case 'ornament':
      return 'Adds passing tones, neighbor notes, and grace notes for embellishment';
    case 'simplify':
      return 'Reduces complexity by removing short notes and consolidating repeated pitches';
    case 'invert':
      return 'Mirrors the melody around a pivot point, flipping melodic direction';
    case 'transpose':
      return 'Shifts all pitches up or down by a specified interval';
    default:
      return 'Unknown variation type';
  }
}

/**
 * Creates a summary of changes between original and varied melody
 */
export function summarizeVariation(
  original: Melody,
  varied: Melody
): {
  noteCountChange: number;
  tempoChange: number;
  timeSignatureChanged: boolean;
} {
  const originalNoteCount = original.measures.reduce(
    (sum, m) => sum + m.length,
    0
  );
  const variedNoteCount = varied.measures.reduce(
    (sum, m) => sum + m.length,
    0
  );

  return {
    noteCountChange: variedNoteCount - originalNoteCount,
    tempoChange: varied.params.tempo - original.params.tempo,
    timeSignatureChanged: varied.params.timeSignature !== original.params.timeSignature,
  };
}
