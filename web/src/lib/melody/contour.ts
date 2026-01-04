/**
 * Melodic Contour Generator
 *
 * Generates melodic shape from stress and emotion analysis.
 * Based on the melody generation theory in docs/MELODY_GENERATION.md.
 *
 * The contour generator creates natural-sounding melodies by:
 * 1. Generating arch-shaped phrase contours (rise then fall)
 * 2. Applying scale degrees to create actual pitches
 * 3. Adjusting pitches for stressed syllables (higher = emphasis)
 * 4. Modifying based on emotional parameters
 * 5. Constraining to comfortable vocal ranges
 *
 * @module lib/melody/contour
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Supported musical scales for melody generation
 */
export type Scale = 'major' | 'minor' | 'dorian' | 'mixolydian';

/**
 * Vocal range specification with pitch and octave bounds
 */
export interface VocalRange {
  /** Low boundary pitch name (e.g., 'C', 'G') */
  low: string;
  /** High boundary pitch name (e.g., 'G', 'E') */
  high: string;
  /** Octave number for low boundary */
  octaveLow: number;
  /** Octave number for high boundary */
  octaveHigh: number;
}

/**
 * Emotional parameters that affect melodic shape
 */
export interface EmotionParams {
  /** Major or minor mode */
  mode: 'major' | 'minor';
  /** Emotional intensity from 0 (calm) to 1 (intense) */
  intensity: number;
  /** Preferred vocal register */
  register: 'low' | 'middle' | 'high';
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Scale degree intervals in semitones from root
 * Each scale has 8 degrees (including octave)
 */
const SCALE_INTERVALS: Record<Scale, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11, 12], // C D E F G A B c
  minor: [0, 2, 3, 5, 7, 8, 10, 12], // A B C D E F G a (natural minor)
  dorian: [0, 2, 3, 5, 7, 9, 10, 12], // D E F G A B C d
  mixolydian: [0, 2, 4, 5, 7, 9, 10, 12], // G A B C D E F g
};

/**
 * Chromatic pitch names for conversion
 */
const CHROMATIC_PITCHES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Natural pitch names (no sharps/flats) for simpler output
 */
const NATURAL_PITCHES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

/**
 * Default vocal ranges for different registers
 */
const REGISTER_RANGES: Record<'low' | 'middle' | 'high', VocalRange> = {
  low: { low: 'G', high: 'D', octaveLow: -1, octaveHigh: 0 },
  middle: { low: 'C', high: 'G', octaveLow: 0, octaveHigh: 0 },
  high: { low: 'E', high: 'C', octaveLow: 0, octaveHigh: 1 },
};

// =============================================================================
// Logging
// =============================================================================

const DEBUG = process.env.NODE_ENV === 'development';
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[contour] ${message}`, ...args);
  }
};

// =============================================================================
// Core Contour Generation
// =============================================================================

/**
 * Generates a phrase contour with an arch shape (rise then fall).
 *
 * The contour follows natural melodic principles:
 * - Starts in middle register
 * - Rises to a peak around 60% through the phrase
 * - Falls back to resolve at the end
 *
 * @param phraseLength - Number of syllables/notes in the phrase
 * @returns Array of relative pitch offsets (0 = tonic, positive = higher)
 *
 * @example
 * generatePhraseContour(8)
 * // Returns something like [0, 1, 2, 3, 4, 3, 2, 1]
 */
export function generatePhraseContour(phraseLength: number): number[] {
  log('generatePhraseContour', { phraseLength });

  if (phraseLength <= 0) {
    log('generatePhraseContour: empty or invalid length');
    return [];
  }

  if (phraseLength === 1) {
    // Single note phrase - just the root
    return [0];
  }

  if (phraseLength === 2) {
    // Two notes - simple rise and fall
    return [0, 2];
  }

  const contour: number[] = [];

  // Peak position at approximately 60% through the phrase
  // This creates a natural "golden ratio" feeling
  const peakPosition = Math.floor(phraseLength * 0.6);

  // Maximum height of the arch (in scale degrees)
  // Longer phrases can have higher peaks
  const maxHeight = Math.min(Math.floor(phraseLength / 2) + 1, 5);

  for (let i = 0; i < phraseLength; i++) {
    if (i < peakPosition) {
      // Rising phase: interpolate from 0 to maxHeight
      const progress = i / peakPosition;
      // Use a slightly curved rise (square root) for more natural feeling
      const curvedProgress = Math.sqrt(progress);
      contour.push(Math.round(curvedProgress * maxHeight));
    } else if (i === peakPosition) {
      // Peak
      contour.push(maxHeight);
    } else {
      // Falling phase: interpolate from maxHeight back toward 0
      const remaining = phraseLength - peakPosition - 1;
      const position = i - peakPosition;
      const progress = position / remaining;
      // Linear fall for natural resolution
      const value = Math.round(maxHeight * (1 - progress));
      contour.push(Math.max(0, value));
    }
  }

  log('generatePhraseContour result:', contour);
  return contour;
}

// =============================================================================
// Pitch Conversion Helpers
// =============================================================================

/**
 * Gets the index of a pitch name in the chromatic scale.
 *
 * @param pitch - Pitch name (e.g., 'C', 'G', 'A')
 * @returns Index in chromatic scale (0-11)
 */
function getPitchIndex(pitch: string): number {
  const upperPitch = pitch.toUpperCase();
  const index = CHROMATIC_PITCHES.indexOf(upperPitch);
  if (index >= 0) return index;

  // Try natural pitches
  const naturalIndex = NATURAL_PITCHES.indexOf(upperPitch);
  if (naturalIndex >= 0) {
    // Map natural note to chromatic index
    return [0, 2, 4, 5, 7, 9, 11][naturalIndex];
  }

  return 0; // Default to C
}

/**
 * Converts a MIDI-style pitch number to a pitch name and octave.
 *
 * @param midiPitch - MIDI pitch number (60 = middle C)
 * @returns Object with pitch name and octave
 */
function midiToPitch(midiPitch: number): { pitch: string; octave: number } {
  // Middle C (C4) is MIDI 60
  // Our octave 0 corresponds to C4
  const octave = Math.floor(midiPitch / 12) - 5; // -5 because MIDI C4 = 60, and 60/12 = 5
  const pitchIndex = midiPitch % 12;
  const pitch = CHROMATIC_PITCHES[pitchIndex];

  return { pitch, octave };
}

/**
 * Converts a pitch name and octave to ABC notation format.
 *
 * @param pitch - Pitch name (e.g., 'C', 'G')
 * @param octave - Octave number (0 = middle, -1 = low, 1 = high)
 * @returns ABC notation pitch string
 */
function pitchToABCNotation(pitch: string, octave: number): string {
  const upperPitch = pitch.toUpperCase().charAt(0); // Get just the letter

  // Handle sharps by using the natural note (simplification for now)
  const basePitch = upperPitch.replace('#', '');

  switch (octave) {
    case -2:
      return `${basePitch},,`;
    case -1:
      return `${basePitch},`;
    case 0:
      return basePitch;
    case 1:
      return basePitch.toLowerCase();
    case 2:
      return `${basePitch.toLowerCase()}'`;
    default:
      if (octave < -2) {
        const commas = ','.repeat(Math.abs(octave) - 1);
        return `${basePitch}${commas}`;
      } else {
        const apostrophes = "'".repeat(octave - 1);
        return `${basePitch.toLowerCase()}${apostrophes}`;
      }
  }
}

/**
 * Parses an ABC notation pitch string into pitch name and octave.
 *
 * @param abcPitch - ABC notation pitch (e.g., 'C', 'c', 'C,', "c'")
 * @returns Object with pitch name (uppercase) and octave number
 */
export function parseABCPitch(abcPitch: string): { pitch: string; octave: number } {
  if (!abcPitch || abcPitch.length === 0) {
    return { pitch: 'C', octave: 0 };
  }

  const firstChar = abcPitch.charAt(0);
  const isLowercase = firstChar === firstChar.toLowerCase() && firstChar !== firstChar.toUpperCase();
  const pitch = firstChar.toUpperCase();

  // Count modifiers
  const commaCount = (abcPitch.match(/,/g) || []).length;
  const apostropheCount = (abcPitch.match(/'/g) || []).length;

  let octave: number;
  if (isLowercase) {
    // Lowercase = high octave (1) + apostrophes
    octave = 1 + apostropheCount;
  } else {
    // Uppercase = middle octave (0) - commas
    octave = 0 - commaCount;
  }

  return { pitch, octave };
}

// =============================================================================
// Scale Application
// =============================================================================

/**
 * Applies a musical scale to convert contour offsets to actual pitch names.
 *
 * Takes relative scale degrees (0, 1, 2, etc.) and converts them to
 * pitch names in the specified scale starting from the root.
 *
 * @param contour - Array of relative pitch offsets (scale degrees)
 * @param scale - The musical scale to use
 * @param rootPitch - The root pitch of the scale (e.g., 'C', 'G')
 * @returns Array of ABC notation pitch strings
 *
 * @example
 * applyScale([0, 1, 2, 3, 2, 1, 0], 'major', 'C')
 * // Returns ['C', 'D', 'E', 'F', 'E', 'D', 'C']
 */
export function applyScale(contour: number[], scale: Scale, rootPitch: string): string[] {
  log('applyScale', { contour, scale, rootPitch });

  if (!contour || contour.length === 0) {
    return [];
  }

  const intervals = SCALE_INTERVALS[scale];
  const rootIndex = getPitchIndex(rootPitch);

  const pitches = contour.map((degree) => {
    // Handle negative degrees (below root)
    let effectiveDegree = degree;
    let octaveAdjust = 0;

    while (effectiveDegree < 0) {
      effectiveDegree += 7;
      octaveAdjust -= 1;
    }

    // Handle degrees above the octave
    while (effectiveDegree >= 7) {
      effectiveDegree -= 7;
      octaveAdjust += 1;
    }

    // Get the semitone offset for this scale degree
    const semitoneOffset = intervals[effectiveDegree];

    // Calculate the actual MIDI-like pitch
    const baseMidi = 60 + rootIndex; // 60 = middle C
    const midiPitch = baseMidi + semitoneOffset + (octaveAdjust * 12);

    // Convert to pitch name and octave
    const { pitch, octave } = midiToPitch(midiPitch);

    // Convert to ABC notation
    return pitchToABCNotation(pitch, octave);
  });

  log('applyScale result:', pitches);
  return pitches;
}

// =============================================================================
// Stress Adjustment
// =============================================================================

/**
 * Adjusts pitches based on stress pattern - stressed syllables go higher.
 *
 * This implements the fundamental principle of lyric setting where
 * stressed syllables receive emphasis through higher pitches.
 *
 * @param pitches - Array of ABC notation pitch strings
 * @param stressPattern - Stress pattern string ('0' = unstressed, '1' = stressed, '2' = secondary)
 * @returns Array of adjusted ABC notation pitch strings
 *
 * @example
 * adjustForStress(['C', 'D', 'E', 'F'], '0101')
 * // Returns ['C', 'E', 'E', 'G'] - stressed syllables bumped up
 */
export function adjustForStress(pitches: string[], stressPattern: string): string[] {
  log('adjustForStress', { pitches, stressPattern });

  if (!pitches || pitches.length === 0) {
    return [];
  }

  if (!stressPattern || stressPattern.length === 0) {
    return [...pitches];
  }

  const result = pitches.map((abcPitch, i) => {
    const stress = stressPattern.charAt(i) || '0';

    // Skip adjustment for unstressed syllables
    if (stress === '0') {
      return abcPitch;
    }

    const { pitch, octave } = parseABCPitch(abcPitch);
    const pitchIndex = NATURAL_PITCHES.indexOf(pitch);

    if (pitchIndex < 0) {
      return abcPitch; // Unknown pitch, return as-is
    }

    // Bump up by 1 scale degree for primary stress, 0.5 for secondary
    // For simplicity, we bump up by 1 step for both (secondary could be 0 in a more nuanced version)
    const bumpAmount = stress === '1' ? 1 : (stress === '2' ? 1 : 0);

    if (bumpAmount === 0) {
      return abcPitch;
    }

    let newPitchIndex = pitchIndex + bumpAmount;
    let newOctave = octave;

    // Handle octave wrapping
    if (newPitchIndex >= NATURAL_PITCHES.length) {
      newPitchIndex -= NATURAL_PITCHES.length;
      newOctave += 1;
    }

    const newPitch = NATURAL_PITCHES[newPitchIndex];
    return pitchToABCNotation(newPitch, newOctave);
  });

  log('adjustForStress result:', result);
  return result;
}

// =============================================================================
// Emotional Modifiers
// =============================================================================

/**
 * Applies emotional modifiers to shape the melodic character.
 *
 * Different emotions affect the melody in various ways:
 * - High intensity → larger intervals, more extreme pitches
 * - Low register → shift everything down
 * - Minor mode → potentially flatten certain degrees
 *
 * @param pitches - Array of ABC notation pitch strings
 * @param emotion - Emotional parameters
 * @returns Array of emotionally-modified ABC notation pitch strings
 *
 * @example
 * applyEmotionalModifiers(['C', 'E', 'G'], { mode: 'major', intensity: 0.8, register: 'high' })
 * // Returns higher-register version of the pitches
 */
export function applyEmotionalModifiers(pitches: string[], emotion: EmotionParams): string[] {
  log('applyEmotionalModifiers', { pitches, emotion });

  if (!pitches || pitches.length === 0) {
    return [];
  }

  // Calculate register shift based on emotion
  let registerShift = 0;
  switch (emotion.register) {
    case 'low':
      registerShift = -1;
      break;
    case 'high':
      registerShift = 1;
      break;
    case 'middle':
    default:
      registerShift = 0;
  }

  // Intensity affects the range expansion
  // Higher intensity = more extreme (higher highs, lower lows from center)
  const intensityFactor = 0.5 + (emotion.intensity * 0.5); // 0.5 to 1.0

  // Find the center pitch for intensity-based expansion
  const parsedPitches = pitches.map(p => parseABCPitch(p));
  const avgOctave = parsedPitches.reduce((sum, p) => sum + p.octave, 0) / parsedPitches.length;

  const result = pitches.map((_abcPitch, index) => {
    const { pitch, octave } = parsedPitches[index];

    // Apply register shift
    let newOctave = octave + registerShift;

    // Apply intensity expansion (push away from center)
    if (emotion.intensity > 0.5) {
      const distanceFromCenter = octave - avgOctave;
      const expansion = distanceFromCenter * (intensityFactor - 0.5) * 2;
      newOctave = Math.round(octave + registerShift + expansion);
    }

    // For minor mode, we could modify certain pitches, but for now
    // the scale application already handles mode differences
    // This is a placeholder for more sophisticated modifications

    return pitchToABCNotation(pitch, newOctave);
  });

  log('applyEmotionalModifiers result:', result);
  return result;
}

// =============================================================================
// Range Constraining
// =============================================================================

/**
 * Converts a pitch and octave to a numeric value for comparison.
 *
 * @param pitch - Pitch name
 * @param octave - Octave number
 * @returns Numeric pitch value
 */
function pitchToNumeric(pitch: string, octave: number): number {
  const pitchIndex = NATURAL_PITCHES.indexOf(pitch.toUpperCase());
  if (pitchIndex < 0) return octave * 7; // Unknown pitch
  return (octave * 7) + pitchIndex;
}

/**
 * Converts a numeric pitch value back to pitch and octave.
 *
 * @param numeric - Numeric pitch value
 * @returns Object with pitch name and octave
 */
function numericToPitch(numeric: number): { pitch: string; octave: number } {
  let octave = Math.floor(numeric / 7);
  let pitchIndex = numeric % 7;

  // Handle negative values
  while (pitchIndex < 0) {
    pitchIndex += 7;
    octave -= 1;
  }

  return {
    pitch: NATURAL_PITCHES[pitchIndex],
    octave,
  };
}

/**
 * Constrains pitches to stay within a specified vocal range.
 *
 * Pitches that fall outside the range are transposed by octaves
 * to fit within the comfortable singing range.
 *
 * @param pitches - Array of ABC notation pitch strings
 * @param range - Vocal range specification
 * @returns Array of range-constrained ABC notation pitch strings
 *
 * @example
 * constrainToRange(['C,,', 'G', 'c'], { low: 'C', high: 'G', octaveLow: 0, octaveHigh: 0 })
 * // Returns ['C', 'G', 'G'] - extreme pitches brought within range
 */
export function constrainToRange(pitches: string[], range: VocalRange): string[] {
  log('constrainToRange', { pitches, range });

  if (!pitches || pitches.length === 0) {
    return [];
  }

  // Calculate numeric bounds
  const lowNumeric = pitchToNumeric(range.low, range.octaveLow);
  const highNumeric = pitchToNumeric(range.high, range.octaveHigh);

  // Handle inverted range (low > high means crossing octave boundary)
  const effectiveLow = Math.min(lowNumeric, highNumeric);
  const effectiveHigh = Math.max(lowNumeric, highNumeric);

  log('constrainToRange bounds:', { effectiveLow, effectiveHigh });

  const result = pitches.map((abcPitch) => {
    const { pitch, octave } = parseABCPitch(abcPitch);
    let numeric = pitchToNumeric(pitch, octave);

    // Shift by octaves until within range
    while (numeric < effectiveLow) {
      numeric += 7; // Up one octave
    }
    while (numeric > effectiveHigh) {
      numeric -= 7; // Down one octave
    }

    // If still outside range after octave adjustment, clamp to nearest bound
    if (numeric < effectiveLow) {
      numeric = effectiveLow;
    }
    if (numeric > effectiveHigh) {
      numeric = effectiveHigh;
    }

    const { pitch: newPitch, octave: newOctave } = numericToPitch(numeric);
    return pitchToABCNotation(newPitch, newOctave);
  });

  log('constrainToRange result:', result);
  return result;
}

// =============================================================================
// Complete Contour Pipeline
// =============================================================================

/**
 * Generates a complete melodic contour for a phrase.
 *
 * This is a convenience function that combines all steps:
 * 1. Generate arch-shaped contour
 * 2. Apply the musical scale
 * 3. Adjust for stress patterns
 * 4. Apply emotional modifiers
 * 5. Constrain to vocal range
 *
 * @param phraseLength - Number of syllables in the phrase
 * @param options - Configuration options
 * @returns Array of ABC notation pitch strings
 */
export function generateMelodicContour(
  phraseLength: number,
  options: {
    scale?: Scale;
    rootPitch?: string;
    stressPattern?: string;
    emotion?: EmotionParams;
    range?: VocalRange;
  } = {}
): string[] {
  log('generateMelodicContour', { phraseLength, options });

  // Default options
  const scale = options.scale || 'major';
  const rootPitch = options.rootPitch || 'C';
  const stressPattern = options.stressPattern || '';
  const emotion = options.emotion || { mode: 'major', intensity: 0.5, register: 'middle' };
  const range = options.range || REGISTER_RANGES[emotion.register];

  // Step 1: Generate the basic contour shape
  const contour = generatePhraseContour(phraseLength);

  // Step 2: Apply the scale to get actual pitches
  let pitches = applyScale(contour, scale, rootPitch);

  // Step 3: Adjust for stress patterns
  if (stressPattern.length > 0) {
    pitches = adjustForStress(pitches, stressPattern);
  }

  // Step 4: Apply emotional modifiers
  pitches = applyEmotionalModifiers(pitches, emotion);

  // Step 5: Constrain to vocal range
  pitches = constrainToRange(pitches, range);

  log('generateMelodicContour result:', pitches);
  return pitches;
}

// =============================================================================
// Utility Exports
// =============================================================================

/**
 * Default register ranges for convenience
 */
export const DEFAULT_RANGES = REGISTER_RANGES;

/**
 * Scale interval definitions for reference
 */
export const SCALES = SCALE_INTERVALS;
