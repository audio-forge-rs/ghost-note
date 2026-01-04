/**
 * Melody Orchestrator
 *
 * Coordinates all melody generation modules to produce complete melodies
 * from poem analysis. This is the main entry point for melody generation.
 *
 * Pipeline:
 * 1. Determine musical parameters from emotion analysis
 * 2. Generate rhythm from stress patterns
 * 3. Generate melodic contour
 * 4. Apply cadences at phrase endings
 * 5. Build final Melody with ABC notation
 *
 * @module lib/melody/orchestrator
 */

import type { PoemAnalysis, StressLevel } from '@/types/analysis';
import type { Melody, MelodyParams, Note, TimeSignature, KeySignature } from './types';
import { buildABCString, validateMelody } from './abcGenerator';

// =============================================================================
// Debug Logging
// =============================================================================

const DEBUG = process.env.NODE_ENV === 'development';
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[orchestrator] ${message}`, ...args);
  }
};

// =============================================================================
// Types
// =============================================================================

/**
 * Options for melody generation
 */
export interface MelodyGenerationOptions {
  /** Random seed for reproducibility */
  seed?: number;
  /** Force specific parameters (overrides emotion-derived params) */
  forceParams?: Partial<MelodyParams>;
  /** Whether to respect breath points at phrase endings */
  respectBreathPoints: boolean;
}

/**
 * Internal representation of a line being processed
 */
interface ProcessedLine {
  syllables: string[];
  stresses: StressLevel[];
  isLineEnd: boolean;
  isStanzaEnd: boolean;
}

/**
 * Contour shape for melodic generation
 */
type ContourShape = 'arch' | 'descending' | 'ascending' | 'wave';

// =============================================================================
// Constants
// =============================================================================

/**
 * Scale degrees for major mode (relative to tonic)
 */
const MAJOR_SCALE_PITCHES: string[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

/**
 * Scale degrees for minor mode (relative to tonic)
 */
const MINOR_SCALE_PITCHES: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

/**
 * Key to starting pitch mapping
 */
const KEY_TO_BASE_PITCH: Record<KeySignature, { pitch: string; octave: number }> = {
  'C': { pitch: 'C', octave: 0 },
  'G': { pitch: 'G', octave: 0 },
  'D': { pitch: 'D', octave: 0 },
  'F': { pitch: 'F', octave: 0 },
  'Am': { pitch: 'A', octave: -1 },
  'Em': { pitch: 'E', octave: 0 },
  'Dm': { pitch: 'D', octave: 0 },
};

/**
 * Default generation options
 */
const DEFAULT_OPTIONS: MelodyGenerationOptions = {
  seed: undefined,
  forceParams: undefined,
  respectBreathPoints: true,
};

// =============================================================================
// Seeded Random Number Generator
// =============================================================================

/**
 * Simple seeded pseudo-random number generator (Mulberry32)
 * Provides reproducible random numbers when same seed is used
 */
class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  /**
   * Returns a random number between 0 and 1
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a random integer between min (inclusive) and max (inclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Picks a random element from an array
   */
  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }
}

// =============================================================================
// Parameter Determination
// =============================================================================

/**
 * Determines melody parameters from poem analysis
 * Uses emotion analysis to suggest appropriate musical characteristics
 */
function determineMelodyParams(
  analysis: PoemAnalysis,
  forceParams?: Partial<MelodyParams>
): MelodyParams {
  log('determineMelodyParams: starting parameter determination');

  const { melodySuggestions, emotion, meta } = analysis;

  // Start with suggestions from analysis
  const baseKey = melodySuggestions.key as KeySignature;
  const baseMode = melodySuggestions.mode;
  const baseTempo = melodySuggestions.tempo;
  const baseTimeSignature = melodySuggestions.timeSignature;

  // Derive key from mode if needed
  let key: KeySignature = baseKey;
  if (!isValidKey(key)) {
    key = baseMode === 'minor' ? 'Am' : 'C';
  }

  // Calculate title from poem metadata
  const title = meta.title || 'Untitled Melody';

  // Build base params
  const params: MelodyParams = {
    title,
    timeSignature: baseTimeSignature as TimeSignature,
    defaultNoteLength: '1/8',
    tempo: baseTempo,
    key,
  };

  // Apply any forced parameters
  if (forceParams) {
    log('determineMelodyParams: applying forced params', forceParams);
    Object.assign(params, forceParams);
  }

  // Adjust tempo based on arousal if not forced
  if (!forceParams?.tempo) {
    const arousal = emotion.arousal;
    const [minTempo, maxTempo] = emotion.suggestedMusicParams.tempoRange;
    // Linear interpolation based on arousal
    params.tempo = Math.round(minTempo + arousal * (maxTempo - minTempo));
  }

  log('determineMelodyParams: final params', params);
  return params;
}

/**
 * Checks if a key is valid
 */
function isValidKey(key: string): key is KeySignature {
  const validKeys: KeySignature[] = ['C', 'G', 'D', 'F', 'Am', 'Em', 'Dm'];
  return validKeys.includes(key as KeySignature);
}

// =============================================================================
// Rhythm Generation
// =============================================================================

/**
 * Generates rhythm (note durations) from stress patterns
 * Maps stressed syllables to longer notes, unstressed to shorter
 */
function generateRhythm(
  stresses: StressLevel[],
  timeSignature: TimeSignature,
  random: SeededRandom
): number[] {
  log('generateRhythm: generating for', stresses.length, 'syllables');

  const durations: number[] = [];

  // Base durations: stressed = 2 (quarter), unstressed = 1 (eighth)
  // With some variation for musicality
  for (const stress of stresses) {
    let duration: number;

    if (stress === 1) {
      // Primary stress: longer note (quarter or dotted quarter)
      duration = random.next() > 0.7 ? 3 : 2;
    } else if (stress === 2) {
      // Secondary stress: medium note (quarter)
      duration = 2;
    } else {
      // Unstressed: shorter note (eighth or sixteenth)
      duration = random.next() > 0.8 ? 0.5 : 1;
    }

    durations.push(duration);
  }

  // Normalize durations to fit measure based on time signature
  const normalizedDurations = normalizeRhythmToMeasure(
    durations,
    timeSignature
  );

  log('generateRhythm: durations', normalizedDurations);
  return normalizedDurations;
}

/**
 * Normalizes rhythm durations to fit properly within measures
 */
function normalizeRhythmToMeasure(
  durations: number[],
  timeSignature: TimeSignature
): number[] {
  // Get beats per measure based on time signature
  // For L:1/8, the measure needs 8 units for 4/4, 6 for 3/4, etc.
  const measureUnits = getMeasureUnits(timeSignature);

  // If total is close enough, return as is
  const total = durations.reduce((sum, d) => sum + d, 0);
  if (total === 0) return durations;

  // Scale durations to target a reasonable measure length
  const targetTotal = Math.ceil(total / measureUnits) * measureUnits;
  const scaleFactor = targetTotal / total;

  return durations.map((d) => {
    const scaled = d * scaleFactor;
    // Round to valid duration values
    if (scaled < 0.75) return 0.5;
    if (scaled < 1.5) return 1;
    if (scaled < 2.5) return 2;
    if (scaled < 3.5) return 3;
    return 4;
  });
}

/**
 * Gets the number of eighth-note units in a measure
 */
function getMeasureUnits(timeSignature: TimeSignature): number {
  switch (timeSignature) {
    case '4/4':
      return 8; // 4 quarters = 8 eighths
    case '3/4':
      return 6; // 3 quarters = 6 eighths
    case '6/8':
      return 6; // 6 eighths
    case '2/4':
      return 4; // 2 quarters = 4 eighths
    default:
      return 8;
  }
}

// =============================================================================
// Contour Generation
// =============================================================================

/**
 * Generates melodic contour (pitch direction) for a line
 * Creates natural phrase shapes that rise and fall
 */
function generateContour(
  lineLength: number,
  shape: ContourShape,
  random: SeededRandom
): number[] {
  log('generateContour: generating', shape, 'contour for', lineLength, 'notes');

  const contour: number[] = [];

  switch (shape) {
    case 'arch': {
      // Rise to peak around 60%, then descend
      const peak = Math.floor(lineLength * 0.6);
      for (let i = 0; i < lineLength; i++) {
        if (i < peak) {
          // Rising phase: 0 to 4
          contour.push(Math.floor((i / peak) * 4));
        } else {
          // Falling phase: 4 to 0
          const remaining = lineLength - peak;
          const pos = i - peak;
          contour.push(Math.floor(4 - (pos / remaining) * 4));
        }
      }
      break;
    }
    case 'descending': {
      // High start, gradual descent
      for (let i = 0; i < lineLength; i++) {
        const progress = i / (lineLength - 1 || 1);
        contour.push(Math.floor(4 - progress * 4));
      }
      break;
    }
    case 'ascending': {
      // Low start, gradual ascent
      for (let i = 0; i < lineLength; i++) {
        const progress = i / (lineLength - 1 || 1);
        contour.push(Math.floor(progress * 4));
      }
      break;
    }
    case 'wave': {
      // Sinusoidal wave pattern
      for (let i = 0; i < lineLength; i++) {
        const angle = (i / lineLength) * Math.PI * 2;
        const value = Math.sin(angle) * 2 + 2;
        contour.push(Math.floor(value));
      }
      break;
    }
  }

  // Add some random variation for musicality
  return contour.map((c) => {
    const variation = random.nextInt(-1, 1);
    return Math.max(0, Math.min(6, c + variation));
  });
}

/**
 * Chooses contour shape based on position and emotion
 */
function chooseContourShape(
  lineIndex: number,
  totalLines: number,
  emotion: string,
  random: SeededRandom
): ContourShape {
  // First line often ascending (introduction)
  if (lineIndex === 0) {
    return random.next() > 0.5 ? 'ascending' : 'arch';
  }

  // Last line often descending (conclusion)
  if (lineIndex === totalLines - 1) {
    return 'descending';
  }

  // Middle lines based on emotion
  const shapes: ContourShape[] = ['arch', 'wave'];
  if (emotion === 'sad' || emotion === 'peaceful') {
    shapes.push('descending');
  }
  if (emotion === 'hopeful' || emotion === 'happy') {
    shapes.push('ascending');
  }

  return random.pick(shapes);
}

// =============================================================================
// Pitch Generation
// =============================================================================

/**
 * Converts contour values to actual pitches
 * Maps scale degrees to note names
 */
function contourToPitches(
  contour: number[],
  key: KeySignature,
  mode: 'major' | 'minor',
  stresses: StressLevel[]
): { pitch: string; octave: number }[] {
  log('contourToPitches: converting contour to pitches');

  const baseInfo = KEY_TO_BASE_PITCH[key] || { pitch: 'C', octave: 0 };
  const scalePitches = mode === 'minor' ? MINOR_SCALE_PITCHES : MAJOR_SCALE_PITCHES;

  const pitches: { pitch: string; octave: number }[] = [];

  for (let i = 0; i < contour.length; i++) {
    const contourValue = contour[i];
    const stress = stresses[i] || 0;

    // Map contour (0-6) to scale index
    let scaleIndex = Math.min(contourValue, scalePitches.length - 1);

    // Bump stressed syllables up slightly in pitch
    if (stress === 1 && scaleIndex < scalePitches.length - 2) {
      scaleIndex = Math.min(scaleIndex + 1, scalePitches.length - 1);
    }

    // Calculate octave based on contour range
    let octave = baseInfo.octave;
    if (contourValue > 4) {
      octave += 1;
    }
    if (contourValue < 1) {
      octave -= 1;
    }

    pitches.push({
      pitch: scalePitches[scaleIndex],
      octave,
    });
  }

  return pitches;
}

// =============================================================================
// Cadence Application
// =============================================================================

/**
 * Applies cadences at phrase endings
 * Modifies the last few notes of phrases for proper musical resolution
 */
function applyCadences(
  notes: Note[],
  isLineEnd: boolean,
  isStanzaEnd: boolean,
  _key: KeySignature,
  mode: 'major' | 'minor',
  random: SeededRandom
): Note[] {
  if (notes.length === 0) return notes;

  const result = [...notes];
  const lastNoteIndex = result.length - 1;

  if (isStanzaEnd) {
    // Perfect cadence: end on tonic
    const tonic = mode === 'minor' ? 'A' : 'C';
    result[lastNoteIndex] = {
      ...result[lastNoteIndex],
      pitch: tonic,
      octave: mode === 'minor' ? -1 : 0,
      duration: result[lastNoteIndex].duration * 1.5, // Hold longer
    };

    // Optional: add leading tone before tonic
    if (result.length >= 2) {
      const penultimate = mode === 'minor' ? 'G' : 'B';
      result[lastNoteIndex - 1] = {
        ...result[lastNoteIndex - 1],
        pitch: penultimate,
        octave: mode === 'minor' ? 0 : 0,
      };
    }
  } else if (isLineEnd) {
    // Half cadence: end on dominant or other open chord tone
    const dominantNotes = mode === 'minor' ? ['E', 'G'] : ['G', 'B'];
    result[lastNoteIndex] = {
      ...result[lastNoteIndex],
      pitch: random.pick(dominantNotes),
      duration: result[lastNoteIndex].duration * 1.25, // Slightly longer
    };
  }

  return result;
}

// =============================================================================
// Line Processing
// =============================================================================

/**
 * Extracts processed lines from poem analysis
 */
function extractLines(analysis: PoemAnalysis): ProcessedLine[] {
  log('extractLines: extracting lines from analysis');

  const lines: ProcessedLine[] = [];
  const { structure } = analysis;

  for (let stanzaIdx = 0; stanzaIdx < structure.stanzas.length; stanzaIdx++) {
    const stanza = structure.stanzas[stanzaIdx];
    const isLastStanza = stanzaIdx === structure.stanzas.length - 1;

    for (let lineIdx = 0; lineIdx < stanza.lines.length; lineIdx++) {
      const line = stanza.lines[lineIdx];
      const isLastLine = lineIdx === stanza.lines.length - 1;

      // Extract syllables and stresses from words
      const syllables: string[] = [];
      const stresses: StressLevel[] = [];

      for (const word of line.words) {
        for (const syllable of word.syllables) {
          // Reconstruct syllable text from phonemes (simplified)
          syllables.push(syllable.vowelPhoneme || 'la');
          stresses.push(syllable.stress);
        }
      }

      // If no syllables found, use the line text split by spaces
      if (syllables.length === 0 && line.text) {
        const words = line.text.split(/\s+/).filter(Boolean);
        const pattern = line.stressPattern || '';
        for (let i = 0; i < words.length; i++) {
          syllables.push(words[i]);
          stresses.push((parseInt(pattern[i] || '0', 10) || 0) as StressLevel);
        }
      }

      lines.push({
        syllables,
        stresses,
        isLineEnd: true,
        isStanzaEnd: isLastLine && (isLastStanza || true), // Mark stanza ends
      });
    }
  }

  log('extractLines: extracted', lines.length, 'lines');
  return lines;
}

// =============================================================================
// Measure Grouping
// =============================================================================

/**
 * Groups notes into measures based on time signature
 */
function groupIntoMeasures(
  notes: Note[],
  lyrics: string[],
  timeSignature: TimeSignature
): { measures: Note[][]; lyrics: string[][] } {
  log('groupIntoMeasures: grouping', notes.length, 'notes');

  const measureUnits = getMeasureUnits(timeSignature);
  const measures: Note[][] = [];
  const groupedLyrics: string[][] = [];

  let currentMeasure: Note[] = [];
  let currentLyrics: string[] = [];
  let currentDuration = 0;

  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    const lyric = lyrics[i] || '';

    // Check if adding this note would exceed measure
    if (currentDuration + note.duration > measureUnits && currentMeasure.length > 0) {
      // Start new measure
      measures.push(currentMeasure);
      groupedLyrics.push(currentLyrics);
      currentMeasure = [];
      currentLyrics = [];
      currentDuration = 0;
    }

    currentMeasure.push(note);
    currentLyrics.push(lyric);
    currentDuration += note.duration;
  }

  // Don't forget the last measure
  if (currentMeasure.length > 0) {
    measures.push(currentMeasure);
    groupedLyrics.push(currentLyrics);
  }

  log('groupIntoMeasures: created', measures.length, 'measures');
  return { measures, lyrics: groupedLyrics };
}

// =============================================================================
// Main Orchestrator Functions
// =============================================================================

/**
 * Generates a complete melody from poem analysis
 *
 * This is the main entry point for melody generation. It:
 * 1. Determines musical parameters from emotion
 * 2. Generates rhythm from stress patterns
 * 3. Creates melodic contour
 * 4. Applies cadences at phrase endings
 * 5. Builds the final ABC notation
 *
 * @param analysis - Complete poem analysis
 * @param options - Generation options (optional)
 * @returns Complete Melody object ready for ABC rendering
 *
 * @example
 * const analysis = analyzePoem(poemText);
 * const melody = generateMelody(analysis);
 * const abc = buildABCString(melody);
 */
export function generateMelody(
  analysis: PoemAnalysis,
  options: Partial<MelodyGenerationOptions> = {}
): Melody {
  log('generateMelody: starting melody generation');

  // Merge with default options
  const opts: MelodyGenerationOptions = { ...DEFAULT_OPTIONS, ...options };

  // Create random generator (use seed if provided, otherwise random)
  const seed = opts.seed ?? Math.floor(Math.random() * 2147483647);
  const random = new SeededRandom(seed);
  log('generateMelody: using seed', seed);

  // Step 1: Determine musical parameters
  const params = determineMelodyParams(analysis, opts.forceParams);

  // Step 2: Extract lines from analysis
  const lines = extractLines(analysis);

  if (lines.length === 0) {
    log('generateMelody: no lines found, returning empty melody');
    return createEmptyMelody(params);
  }

  // Step 3-4: Process each line
  const allNotes: Note[] = [];
  const allLyrics: string[] = [];
  const dominantEmotion = analysis.emotion.dominantEmotions[0] || 'peaceful';
  const mode = analysis.melodySuggestions.mode;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];

    if (line.syllables.length === 0) continue;

    // Generate rhythm from stresses
    const durations = generateRhythm(line.stresses, params.timeSignature, random);

    // Choose and generate contour
    const shape = chooseContourShape(
      lineIdx,
      lines.length,
      dominantEmotion,
      random
    );
    const contour = generateContour(line.syllables.length, shape, random);

    // Convert to pitches
    const pitches = contourToPitches(
      contour,
      params.key,
      mode,
      line.stresses
    );

    // Create notes
    let lineNotes: Note[] = pitches.map((p, i) => ({
      pitch: p.pitch,
      octave: p.octave,
      duration: durations[i] || 1,
    }));

    // Apply cadences
    lineNotes = applyCadences(
      lineNotes,
      line.isLineEnd,
      line.isStanzaEnd,
      params.key,
      mode,
      random
    );

    // Add breath rest at line ends if respecting breath points
    if (opts.respectBreathPoints && line.isLineEnd && lineIdx < lines.length - 1) {
      lineNotes.push({
        pitch: 'z',
        octave: 0,
        duration: 1,
      });
      line.syllables.push(''); // Empty lyric for rest
    }

    allNotes.push(...lineNotes);
    allLyrics.push(...line.syllables);
  }

  // Step 5: Group into measures
  const { measures, lyrics } = groupIntoMeasures(
    allNotes,
    allLyrics,
    params.timeSignature
  );

  // Build final melody
  const melody: Melody = {
    params,
    measures,
    lyrics,
  };

  // Validate
  const validation = validateMelody(melody);
  if (!validation.valid) {
    log('generateMelody: validation warnings', validation.errors);
  }

  log('generateMelody: complete with', measures.length, 'measures');
  return melody;
}

/**
 * Regenerates a melody with a different seed
 * Produces variations while maintaining the same structure
 *
 * @param analysis - Complete poem analysis
 * @param seed - Random seed (optional, generates random if not provided)
 * @returns New Melody with variation
 *
 * @example
 * const melody1 = generateMelody(analysis);
 * const melody2 = regenerateMelody(analysis, 12345); // Different variation
 */
export function regenerateMelody(
  analysis: PoemAnalysis,
  seed?: number
): Melody {
  log('regenerateMelody: regenerating with seed', seed);

  // Use provided seed or generate a new one
  const newSeed = seed ?? Math.floor(Math.random() * 2147483647);

  return generateMelody(analysis, {
    seed: newSeed,
    respectBreathPoints: true,
  });
}

/**
 * Adjusts parameters of an existing melody
 * Creates a new melody with updated parameters
 *
 * @param melody - Existing melody to adjust
 * @param params - Partial parameters to update
 * @returns New Melody with adjusted parameters
 *
 * @example
 * const melody = generateMelody(analysis);
 * const fasterMelody = adjustMelodyParams(melody, { tempo: 140 });
 */
export function adjustMelodyParams(
  melody: Melody,
  params: Partial<MelodyParams>
): Melody {
  log('adjustMelodyParams: adjusting params', params);

  // Create new params by merging
  const newParams: MelodyParams = {
    ...melody.params,
    ...params,
  };

  // If only tempo or title changed, we can keep the same notes
  const structuralChange =
    params.timeSignature !== undefined ||
    params.key !== undefined;

  if (!structuralChange) {
    // Simple case: just update params
    return {
      ...melody,
      params: newParams,
    };
  }

  // For structural changes, we need to regroup measures
  // Flatten all notes and regroup
  const allNotes = melody.measures.flat();
  const allLyrics = melody.lyrics.flat();

  const { measures, lyrics } = groupIntoMeasures(
    allNotes,
    allLyrics,
    newParams.timeSignature
  );

  return {
    params: newParams,
    measures,
    lyrics,
  };
}

/**
 * Creates an empty melody with default structure
 */
function createEmptyMelody(params: MelodyParams): Melody {
  return {
    params,
    measures: [[{ pitch: 'z', octave: 0, duration: 8 }]], // Single rest measure
    lyrics: [['']],
  };
}

// =============================================================================
// Utility Exports
// =============================================================================

/**
 * Gets the ABC string directly from a melody
 * Convenience function that wraps buildABCString
 */
export function melodyToABC(melody: Melody): string {
  return buildABCString(melody);
}

/**
 * Validates a melody and returns any errors
 * Convenience function that wraps validateMelody
 */
export function validateMelodyOutput(melody: Melody): {
  valid: boolean;
  errors: string[];
} {
  return validateMelody(melody);
}
