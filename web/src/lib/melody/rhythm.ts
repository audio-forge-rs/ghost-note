/**
 * Stress-to-Rhythm Mapping Module
 *
 * This module creates the algorithm that maps syllable stress patterns to musical rhythm.
 * It transforms linguistic stress (from poem analysis) into note durations that can be
 * used for melody generation.
 *
 * Key principles from MELODY_GENERATION.md:
 * - Stressed syllables (1) → longer notes (quarter, half)
 * - Unstressed syllables (0) → shorter notes (eighth)
 * - Secondary stress (2) → medium notes (quarter)
 * - Breath points → rests
 *
 * @module lib/melody/rhythm
 */

import type { TimeSignature } from './types';
import { getBeatsPerMeasure } from './abcGenerator';

// =============================================================================
// Types
// =============================================================================

/**
 * Stress level from poem analysis
 * '0' = unstressed, '1' = primary stress, '2' = secondary stress
 */
export type StressLevel = '0' | '1' | '2';

/**
 * Context for rhythm generation
 */
export interface RhythmContext {
  /** Time signature (e.g., '4/4', '3/4', '6/8') */
  timeSignature: TimeSignature;
  /** Tempo in BPM */
  tempo: number;
  /** Current beat position in the measure (0-indexed) */
  position: number;
}

/**
 * A note duration with its syllable mapping
 */
export interface NoteDuration {
  /** Index of the syllable this duration corresponds to (-1 for rests) */
  syllableIndex: number;
  /** Duration in beats (e.g., 0.5 for eighth note, 1 for quarter, 2 for half) */
  beats: number;
  /** Whether this is a rest (no pitch, breath pause) */
  isRest: boolean;
}

// =============================================================================
// Logging
// =============================================================================

const DEBUG = process.env.NODE_ENV === 'development';
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[rhythm] ${message}`, ...args);
  }
};

// =============================================================================
// Duration Constants
// =============================================================================

/**
 * Default beat durations for each stress level (in beats, assuming quarter note = 1 beat)
 * These values follow the documentation guidelines:
 * - Primary stress (1): longer notes
 * - Secondary stress (2): medium notes
 * - Unstressed (0): shorter notes
 */
const DEFAULT_STRESS_DURATIONS: Record<StressLevel, number> = {
  '0': 0.5, // Eighth note for unstressed syllables
  '1': 1.0, // Quarter note for primary stress
  '2': 0.75, // Dotted eighth or short quarter for secondary stress
};

/**
 * Time signature specific adjustments
 * Different time signatures have different "feels" and require duration adjustments
 */
const TIME_SIGNATURE_MULTIPLIERS: Record<TimeSignature, number> = {
  '4/4': 1.0, // Standard timing
  '3/4': 1.0, // Waltz timing, same base durations
  '6/8': 0.5, // Compound meter, eighth note is the pulse
  '2/4': 1.0, // March timing
};

/**
 * Strong beat positions for each time signature (0-indexed)
 * Used to determine if a syllable falls on a strong beat
 */
const STRONG_BEATS: Record<TimeSignature, number[]> = {
  '4/4': [0, 2], // Beats 1 and 3 are strong
  '3/4': [0], // Beat 1 is strong
  '6/8': [0, 3], // Beats 1 and 4 are strong (compound duple)
  '2/4': [0], // Beat 1 is strong
};

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Maps a single syllable's stress level to a note duration.
 *
 * Takes into account:
 * - The stress level of the syllable
 * - The time signature and tempo context
 * - The current position in the measure
 *
 * @param stress - The stress level ('0', '1', or '2')
 * @param context - The rhythm context with time signature, tempo, and position
 * @returns Duration in beats
 *
 * @example
 * stressToNoteDuration('1', { timeSignature: '4/4', tempo: 100, position: 0 }) // 1.0
 * stressToNoteDuration('0', { timeSignature: '4/4', tempo: 100, position: 1 }) // 0.5
 */
export function stressToNoteDuration(stress: StressLevel, context: RhythmContext): number {
  log('stressToNoteDuration', { stress, context });

  // Validate input
  if (!['0', '1', '2'].includes(stress)) {
    log('Invalid stress level, defaulting to unstressed');
    stress = '0';
  }

  // Get base duration for this stress level
  const baseDuration = DEFAULT_STRESS_DURATIONS[stress];

  // Apply time signature multiplier
  const multiplier = TIME_SIGNATURE_MULTIPLIERS[context.timeSignature] ?? 1.0;
  let duration = baseDuration * multiplier;

  // Check if we're on a strong beat - strong beats can have slightly longer notes
  const strongBeats = STRONG_BEATS[context.timeSignature] ?? [0];
  const isOnStrongBeat = strongBeats.includes(Math.floor(context.position));

  // If stressed syllable is on a strong beat, it can be emphasized more
  if (stress === '1' && isOnStrongBeat) {
    // Allow for longer notes on strong beats for stressed syllables
    duration = Math.min(duration * 1.25, 2.0); // Cap at half note
  }

  // Adjust for tempo - faster tempos might benefit from shorter durations
  if (context.tempo > 140) {
    // Fast tempo - shorten notes slightly for better articulation
    duration *= 0.9;
  } else if (context.tempo < 60) {
    // Slow tempo - can afford slightly longer notes
    duration *= 1.1;
  }

  // Round to common note values (eighth, quarter, dotted quarter, half)
  duration = roundToMusicalDuration(duration);

  log('stressToNoteDuration result:', duration);
  return duration;
}

/**
 * Rounds a duration value to the nearest common musical duration.
 *
 * Common durations (in beats, quarter note = 1):
 * - 0.25 (sixteenth note)
 * - 0.5 (eighth note)
 * - 0.75 (dotted eighth)
 * - 1.0 (quarter note)
 * - 1.5 (dotted quarter)
 * - 2.0 (half note)
 *
 * @param duration - Raw duration value
 * @returns Rounded duration
 */
function roundToMusicalDuration(duration: number): number {
  const musicalDurations = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0];

  // Find the closest musical duration
  let closest = musicalDurations[0];
  let minDiff = Math.abs(duration - closest);

  for (const md of musicalDurations) {
    const diff = Math.abs(duration - md);
    if (diff < minDiff) {
      minDiff = diff;
      closest = md;
    }
  }

  return closest;
}

/**
 * Maps a complete line's stress pattern to rhythm (note durations).
 *
 * Takes a stress pattern string (e.g., "01010101") and converts it to
 * an array of NoteDuration objects representing the rhythm for each syllable.
 *
 * @param stressPattern - String of stress levels (e.g., "01010101" for iambic tetrameter)
 * @param timeSignature - Time signature for the line
 * @param tempo - Tempo in BPM (optional, defaults to 100)
 * @returns Array of NoteDuration objects
 *
 * @example
 * mapLineToRhythm('01010101', '4/4')
 * // Returns array of NoteDuration objects with alternating short/long durations
 */
export function mapLineToRhythm(
  stressPattern: string,
  timeSignature: TimeSignature,
  tempo: number = 100
): NoteDuration[] {
  log('mapLineToRhythm', { stressPattern, timeSignature, tempo });

  if (!stressPattern || stressPattern.length === 0) {
    return [];
  }

  const durations: NoteDuration[] = [];
  let currentPosition = 0;

  for (let i = 0; i < stressPattern.length; i++) {
    const stress = stressPattern[i] as StressLevel;

    // Create context for this syllable
    const context: RhythmContext = {
      timeSignature,
      tempo,
      position: currentPosition % getBeatsPerMeasure(timeSignature),
    };

    // Get duration for this stress level
    const beats = stressToNoteDuration(stress, context);

    durations.push({
      syllableIndex: i,
      beats,
      isRest: false,
    });

    // Update position for next syllable
    currentPosition += beats;
  }

  log('mapLineToRhythm result:', durations);
  return durations;
}

/**
 * Inserts breath rests at specified positions in a rhythm sequence.
 *
 * Breath points are typically at:
 * - End of phrases
 * - After punctuation (commas, periods)
 * - Natural pause points in the text
 *
 * @param durations - Original array of NoteDurations
 * @param breathPoints - Array of syllable indices after which to insert rests
 * @param restDuration - Duration of breath rests in beats (default: 0.5)
 * @returns New array with rests inserted at breath points
 *
 * @example
 * insertBreathRests(durations, [3, 7], 0.5)
 * // Inserts 0.5 beat rests after syllables 3 and 7
 */
export function insertBreathRests(
  durations: NoteDuration[],
  breathPoints: number[],
  restDuration: number = 0.5
): NoteDuration[] {
  log('insertBreathRests', { durationsCount: durations.length, breathPoints, restDuration });

  if (!durations || durations.length === 0) {
    return [];
  }

  if (!breathPoints || breathPoints.length === 0) {
    return [...durations];
  }

  // Sort breath points in descending order so we can insert from end to beginning
  // This prevents index shifting issues
  const sortedBreathPoints = [...breathPoints].sort((a, b) => b - a);

  // Create a copy to avoid mutating the original
  const result: NoteDuration[] = [...durations];

  for (const breathPoint of sortedBreathPoints) {
    // Validate breath point is within range
    if (breathPoint < 0 || breathPoint >= durations.length) {
      log(`Skipping invalid breath point: ${breathPoint}`);
      continue;
    }

    // Create rest to insert after the breath point
    const rest: NoteDuration = {
      syllableIndex: -1, // -1 indicates this is a rest, not a syllable
      beats: restDuration,
      isRest: true,
    };

    // Insert rest after the breath point
    result.splice(breathPoint + 1, 0, rest);
  }

  log('insertBreathRests result:', result);
  return result;
}

/**
 * Fits a sequence of note durations into complete measures.
 *
 * This function adjusts durations to ensure they fit properly within measures:
 * - Adds rests at end if measure is incomplete
 * - Optionally adjusts note lengths to fill measures
 * - Handles tied notes across bar lines
 *
 * @param durations - Array of NoteDuration objects to fit
 * @param beatsPerMeasure - Number of beats per measure (e.g., 4 for 4/4)
 * @param options - Configuration options
 * @returns New array of NoteDurations fitted to measures
 *
 * @example
 * fitToMeasure(durations, 4) // Fits to 4/4 time
 * fitToMeasure(durations, 3) // Fits to 3/4 time
 */
export function fitToMeasure(
  durations: NoteDuration[],
  beatsPerMeasure: number,
  options: FitToMeasureOptions = {}
): NoteDuration[] {
  log('fitToMeasure', { durationsCount: durations.length, beatsPerMeasure, options });

  const {
    padWithRests = true,
    allowSplitNotes = true,
    preserveStressAlignment = true,
  } = options;

  if (!durations || durations.length === 0) {
    return [];
  }

  if (beatsPerMeasure <= 0) {
    log('Invalid beatsPerMeasure, returning original durations');
    return [...durations];
  }

  const result: NoteDuration[] = [];
  let currentBeat = 0;

  for (let i = 0; i < durations.length; i++) {
    const duration = durations[i];
    const remainingInMeasure = beatsPerMeasure - (currentBeat % beatsPerMeasure);

    // Check if this note fits in the current measure
    if (duration.beats <= remainingInMeasure) {
      // Note fits completely
      result.push({ ...duration });
      currentBeat += duration.beats;
    } else if (allowSplitNotes && duration.beats > remainingInMeasure) {
      // Note needs to be split across bar line
      // First part fills the current measure
      const firstPart: NoteDuration = {
        syllableIndex: duration.syllableIndex,
        beats: remainingInMeasure,
        isRest: duration.isRest,
      };
      result.push(firstPart);
      currentBeat += remainingInMeasure;

      // Second part goes into next measure
      const secondPartBeats = duration.beats - remainingInMeasure;
      const secondPart: NoteDuration = {
        syllableIndex: duration.syllableIndex, // Same syllable (tied note)
        beats: secondPartBeats,
        isRest: duration.isRest,
      };
      result.push(secondPart);
      currentBeat += secondPartBeats;
    } else {
      // Don't split - adjust the note to fit
      if (preserveStressAlignment && !duration.isRest) {
        // Shorten the note to fit the measure
        const adjustedDuration: NoteDuration = {
          syllableIndex: duration.syllableIndex,
          beats: Math.min(duration.beats, remainingInMeasure),
          isRest: duration.isRest,
        };
        result.push(adjustedDuration);
        currentBeat += adjustedDuration.beats;
      } else {
        // Just add the note and let it overflow
        result.push({ ...duration });
        currentBeat += duration.beats;
      }
    }
  }

  // Pad the final measure with rests if needed
  if (padWithRests) {
    const remainingBeats = beatsPerMeasure - (currentBeat % beatsPerMeasure);
    if (remainingBeats > 0 && remainingBeats < beatsPerMeasure) {
      result.push({
        syllableIndex: -1,
        beats: remainingBeats,
        isRest: true,
      });
    }
  }

  log('fitToMeasure result:', result);
  return result;
}

/**
 * Options for fitToMeasure function
 */
export interface FitToMeasureOptions {
  /** Whether to add rests at the end to complete the final measure (default: true) */
  padWithRests?: boolean;
  /** Whether to split notes that cross bar lines (default: true) */
  allowSplitNotes?: boolean;
  /** Whether to preserve stressed syllables on strong beats (default: true) */
  preserveStressAlignment?: boolean;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Calculates the total duration of a rhythm sequence in beats.
 *
 * @param durations - Array of NoteDuration objects
 * @returns Total duration in beats
 */
export function calculateTotalDuration(durations: NoteDuration[]): number {
  if (!durations || durations.length === 0) {
    return 0;
  }
  return durations.reduce((total, d) => total + d.beats, 0);
}

/**
 * Counts the number of measures a rhythm sequence spans.
 *
 * @param durations - Array of NoteDuration objects
 * @param beatsPerMeasure - Number of beats per measure
 * @returns Number of measures (may be fractional)
 */
export function countMeasures(durations: NoteDuration[], beatsPerMeasure: number): number {
  const totalBeats = calculateTotalDuration(durations);
  return totalBeats / beatsPerMeasure;
}

/**
 * Validates that a rhythm sequence has consistent timing.
 *
 * @param durations - Array of NoteDuration objects
 * @returns Object with valid flag and any issues found
 */
export function validateRhythm(durations: NoteDuration[]): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!durations || durations.length === 0) {
    return { valid: true, issues: [] };
  }

  for (let i = 0; i < durations.length; i++) {
    const d = durations[i];

    // Check for valid beats value
    if (d.beats <= 0) {
      issues.push(`Invalid duration at index ${i}: beats must be positive`);
    }

    // Check for valid syllable index
    if (!d.isRest && d.syllableIndex < 0) {
      issues.push(`Invalid syllable index at index ${i}: non-rest notes must have syllableIndex >= 0`);
    }

    // Check for rests having correct syllable index
    if (d.isRest && d.syllableIndex !== -1) {
      issues.push(`Rest at index ${i} should have syllableIndex of -1`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Creates a rhythm context from common parameters.
 *
 * @param timeSignature - Time signature
 * @param tempo - Tempo in BPM
 * @param position - Beat position in measure (optional, defaults to 0)
 * @returns RhythmContext object
 */
export function createRhythmContext(
  timeSignature: TimeSignature,
  tempo: number,
  position: number = 0
): RhythmContext {
  return {
    timeSignature,
    tempo,
    position,
  };
}

/**
 * Gets the beat positions that are considered "strong" for a time signature.
 *
 * @param timeSignature - The time signature
 * @returns Array of strong beat positions (0-indexed)
 */
export function getStrongBeats(timeSignature: TimeSignature): number[] {
  return STRONG_BEATS[timeSignature] ?? [0];
}

/**
 * Determines if a beat position is strong for the given time signature.
 *
 * @param position - Beat position (0-indexed)
 * @param timeSignature - The time signature
 * @returns True if the position is a strong beat
 */
export function isStrongBeat(position: number, timeSignature: TimeSignature): boolean {
  const strongBeats = getStrongBeats(timeSignature);
  return strongBeats.includes(Math.floor(position % getBeatsPerMeasure(timeSignature)));
}

/**
 * Converts durations to a simplified array of beat values for debugging.
 *
 * @param durations - Array of NoteDuration objects
 * @returns Array of beat values
 */
export function durationsToBeats(durations: NoteDuration[]): number[] {
  return durations.map((d) => d.beats);
}

/**
 * Creates a basic iambic rhythm pattern (unstressed-stressed alternation).
 *
 * @param syllableCount - Number of syllables
 * @param timeSignature - Time signature (default: '4/4')
 * @returns Array of NoteDurations in iambic pattern
 */
export function createIambicRhythm(
  syllableCount: number,
  timeSignature: TimeSignature = '4/4'
): NoteDuration[] {
  // Generate iambic stress pattern (01 repeated)
  let pattern = '';
  for (let i = 0; i < syllableCount; i++) {
    pattern += i % 2 === 0 ? '0' : '1';
  }
  return mapLineToRhythm(pattern, timeSignature);
}

/**
 * Creates a basic trochaic rhythm pattern (stressed-unstressed alternation).
 *
 * @param syllableCount - Number of syllables
 * @param timeSignature - Time signature (default: '4/4')
 * @returns Array of NoteDurations in trochaic pattern
 */
export function createTrochaicRhythm(
  syllableCount: number,
  timeSignature: TimeSignature = '4/4'
): NoteDuration[] {
  // Generate trochaic stress pattern (10 repeated)
  let pattern = '';
  for (let i = 0; i < syllableCount; i++) {
    pattern += i % 2 === 0 ? '1' : '0';
  }
  return mapLineToRhythm(pattern, timeSignature);
}

/**
 * Adjusts rhythm to better align stressed syllables with strong beats.
 *
 * This is useful when the natural stress pattern doesn't align well
 * with the time signature's strong beats.
 *
 * @param durations - Original rhythm
 * @param stressPattern - Original stress pattern
 * @param timeSignature - Time signature
 * @returns Adjusted rhythm with better stress alignment
 */
export function alignStressToBeats(
  durations: NoteDuration[],
  stressPattern: string,
  timeSignature: TimeSignature
): NoteDuration[] {
  log('alignStressToBeats', { durationsCount: durations.length, stressPattern, timeSignature });

  if (durations.length === 0 || !stressPattern) {
    return [...durations];
  }

  const beatsPerMeasure = getBeatsPerMeasure(timeSignature);
  const strongBeats = getStrongBeats(timeSignature);
  const result: NoteDuration[] = [];
  let currentBeat = 0;

  for (let i = 0; i < durations.length; i++) {
    const duration = { ...durations[i] };
    const stress = stressPattern[i] ?? '0';
    const beatInMeasure = currentBeat % beatsPerMeasure;

    // If this is a stressed syllable not on a strong beat,
    // and we're close to a strong beat, adjust timing
    if (stress === '1' && !strongBeats.includes(Math.floor(beatInMeasure))) {
      // Find nearest strong beat
      let nearestStrongBeat = strongBeats[0];
      let minDistance = Math.abs(beatInMeasure - strongBeats[0]);

      for (const sb of strongBeats) {
        const dist = Math.abs(beatInMeasure - sb);
        if (dist < minDistance) {
          minDistance = dist;
          nearestStrongBeat = sb;
        }
      }

      // If we're within 0.5 beats of a strong beat, adjust
      if (minDistance <= 0.5 && minDistance > 0) {
        // Add a small rest or adjust previous note to shift this syllable
        const adjustment = nearestStrongBeat - beatInMeasure;
        if (adjustment > 0 && result.length > 0) {
          // Extend the previous note/rest slightly
          const prev = result[result.length - 1];
          prev.beats += adjustment;
          currentBeat += adjustment;
        }
      }
    }

    result.push(duration);
    currentBeat += duration.beats;
  }

  log('alignStressToBeats result:', result);
  return result;
}
