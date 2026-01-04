/**
 * Cadence and Phrase Ending Generator
 *
 * Generates musically appropriate phrase endings (cadences) for melodies.
 * Cadences provide closure and structure to musical phrases, creating
 * natural breathing points and resolution in the melody.
 *
 * Reference: docs/MELODY_GENERATION.md - Phrase Endings section
 */

import type { Note, KeySignature } from './types';

// Logging helper for debugging
const DEBUG = process.env.NODE_ENV === 'development';
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[cadence] ${message}`, ...args);
  }
};

/**
 * Types of musical cadences
 *
 * - perfect: V→I - Strong, conclusive ending (dominant to tonic)
 * - half: ?→V - Incomplete feel, keeps the music moving (ends on dominant)
 * - deceptive: V→vi - Surprise ending (dominant to submediant)
 * - plagal: IV→I - "Amen" cadence (subdominant to tonic)
 */
export type CadenceType = 'perfect' | 'half' | 'deceptive' | 'plagal';

/**
 * Position information for a line within a poem
 */
export interface LinePosition {
  /** Zero-based index of the line within the stanza */
  lineIndex: number;
  /** Total number of lines in the stanza */
  totalLines: number;
  /** Whether this line ends a stanza */
  isStanzaEnd: boolean;
  /** Whether this is the last stanza of the poem */
  isLastStanza: boolean;
}

/**
 * Scale degree information for cadence construction
 */
interface ScaleDegree {
  /** Pitch name */
  pitch: string;
  /** Octave relative to tonic (0 = same octave as tonic) */
  octave: number;
}

/**
 * Scale degrees for major keys
 * Index 0 = tonic (I), 1 = supertonic (ii), etc.
 */
const MAJOR_SCALE_DEGREES: Record<string, ScaleDegree[]> = {
  C: [
    { pitch: 'C', octave: 0 }, // I - Tonic
    { pitch: 'D', octave: 0 }, // ii - Supertonic
    { pitch: 'E', octave: 0 }, // iii - Mediant
    { pitch: 'F', octave: 0 }, // IV - Subdominant
    { pitch: 'G', octave: 0 }, // V - Dominant
    { pitch: 'A', octave: 0 }, // vi - Submediant
    { pitch: 'B', octave: 0 }, // vii° - Leading tone
  ],
  G: [
    { pitch: 'G', octave: 0 },
    { pitch: 'A', octave: 0 },
    { pitch: 'B', octave: 0 },
    { pitch: 'C', octave: 1 },
    { pitch: 'D', octave: 1 },
    { pitch: 'E', octave: 1 },
    { pitch: 'F', octave: 1 }, // F# in G major, but we use natural for simplicity
  ],
  D: [
    { pitch: 'D', octave: 0 },
    { pitch: 'E', octave: 0 },
    { pitch: 'F', octave: 0 }, // F# in D major
    { pitch: 'G', octave: 0 },
    { pitch: 'A', octave: 0 },
    { pitch: 'B', octave: 0 },
    { pitch: 'C', octave: 1 }, // C# in D major
  ],
  F: [
    { pitch: 'F', octave: 0 },
    { pitch: 'G', octave: 0 },
    { pitch: 'A', octave: 0 },
    { pitch: 'B', octave: 0 }, // Bb in F major
    { pitch: 'C', octave: 1 },
    { pitch: 'D', octave: 1 },
    { pitch: 'E', octave: 1 },
  ],
};

/**
 * Scale degrees for minor keys
 * Uses natural minor scale
 */
const MINOR_SCALE_DEGREES: Record<string, ScaleDegree[]> = {
  Am: [
    { pitch: 'A', octave: 0 }, // i - Tonic
    { pitch: 'B', octave: 0 }, // ii° - Supertonic
    { pitch: 'C', octave: 1 }, // III - Mediant
    { pitch: 'D', octave: 1 }, // iv - Subdominant
    { pitch: 'E', octave: 1 }, // v - Dominant (or V with G#)
    { pitch: 'F', octave: 1 }, // VI - Submediant
    { pitch: 'G', octave: 1 }, // VII - Subtonic
  ],
  Em: [
    { pitch: 'E', octave: 0 },
    { pitch: 'F', octave: 0 }, // F# in E minor
    { pitch: 'G', octave: 0 },
    { pitch: 'A', octave: 0 },
    { pitch: 'B', octave: 0 },
    { pitch: 'C', octave: 1 },
    { pitch: 'D', octave: 1 },
  ],
  Dm: [
    { pitch: 'D', octave: 0 },
    { pitch: 'E', octave: 0 },
    { pitch: 'F', octave: 0 },
    { pitch: 'G', octave: 0 },
    { pitch: 'A', octave: 0 },
    { pitch: 'B', octave: 0 }, // Bb in D minor
    { pitch: 'C', octave: 1 },
  ],
};

/**
 * Checks if a key is minor
 */
function isMinorKey(key: KeySignature): boolean {
  return key.endsWith('m');
}

/**
 * Gets scale degrees for a given key
 */
function getScaleDegrees(key: KeySignature): ScaleDegree[] {
  if (isMinorKey(key)) {
    return MINOR_SCALE_DEGREES[key] || MINOR_SCALE_DEGREES['Am'];
  }
  return MAJOR_SCALE_DEGREES[key] || MAJOR_SCALE_DEGREES['C'];
}

/**
 * Gets the tonic note for a key
 */
function getTonic(key: KeySignature): ScaleDegree {
  const degrees = getScaleDegrees(key);
  return degrees[0];
}

/**
 * Gets the dominant note (V) for a key
 */
function getDominant(key: KeySignature): ScaleDegree {
  const degrees = getScaleDegrees(key);
  return degrees[4];
}

/**
 * Gets the subdominant note (IV) for a key
 */
function getSubdominant(key: KeySignature): ScaleDegree {
  const degrees = getScaleDegrees(key);
  return degrees[3];
}

/**
 * Gets the submediant note (vi) for a key
 */
function getSubmediant(key: KeySignature): ScaleDegree {
  const degrees = getScaleDegrees(key);
  return degrees[5];
}

/**
 * Gets the leading tone (vii) for a key
 */
function getLeadingTone(key: KeySignature): ScaleDegree {
  const degrees = getScaleDegrees(key);
  return degrees[6];
}

/**
 * Gets the supertonic (ii) for a key
 */
function getSupertonic(key: KeySignature): ScaleDegree {
  const degrees = getScaleDegrees(key);
  return degrees[1];
}

/**
 * Creates a Note from a ScaleDegree
 */
function createNote(degree: ScaleDegree, duration: number, baseOctave: number = 0): Note {
  return {
    pitch: degree.pitch,
    octave: baseOctave + degree.octave,
    duration,
  };
}

/**
 * Generates a cadence pattern for the specified type and key.
 *
 * Cadence patterns:
 * - Perfect (V→I): Dominant to tonic - strongest resolution
 * - Half (?→V): Ends on dominant - creates expectation
 * - Deceptive (V→vi): Dominant to submediant - surprise
 * - Plagal (IV→I): Subdominant to tonic - "Amen" cadence
 *
 * @param type - The type of cadence to generate
 * @param key - The musical key for the cadence
 * @param baseOctave - Base octave for the notes (default 0)
 * @returns Array of notes forming the cadence
 *
 * @example
 * ```typescript
 * // Generate a perfect cadence in C major
 * const cadence = generateCadence('perfect', 'C');
 * // Returns notes: G (duration 2) -> C (duration 4)
 * ```
 */
export function generateCadence(
  type: CadenceType,
  key: KeySignature,
  baseOctave: number = 0
): Note[] {
  log('generateCadence', { type, key, baseOctave });

  const tonic = getTonic(key);
  const dominant = getDominant(key);
  const subdominant = getSubdominant(key);
  const submediant = getSubmediant(key);
  const leadingTone = getLeadingTone(key);
  const supertonic = getSupertonic(key);

  switch (type) {
    case 'perfect': {
      // V → I: Strong resolution
      // Include leading tone for stronger resolution
      log('Generating perfect cadence: V → I');
      return [
        createNote(leadingTone, 1, baseOctave),  // Leading tone (approach)
        createNote(dominant, 2, baseOctave),      // Dominant
        createNote(tonic, 4, baseOctave),         // Tonic (longer for resolution)
      ];
    }

    case 'half': {
      // ? → V: Ends on dominant, incomplete feel
      // Approach from supertonic or subdominant
      log('Generating half cadence: ii → V');
      return [
        createNote(supertonic, 1, baseOctave),    // Supertonic (approach)
        createNote(leadingTone, 1, baseOctave),   // Leading tone
        createNote(dominant, 4, baseOctave),      // Dominant (end)
      ];
    }

    case 'deceptive': {
      // V → vi: Surprise ending
      log('Generating deceptive cadence: V → vi');
      return [
        createNote(leadingTone, 1, baseOctave),   // Leading tone (approach)
        createNote(dominant, 2, baseOctave),      // Dominant
        createNote(submediant, 4, baseOctave),    // Submediant (surprise)
      ];
    }

    case 'plagal': {
      // IV → I: "Amen" cadence
      log('Generating plagal cadence: IV → I');
      return [
        createNote(submediant, 1, baseOctave),    // vi (approach)
        createNote(subdominant, 2, baseOctave),   // Subdominant
        createNote(tonic, 4, baseOctave),         // Tonic
      ];
    }

    default: {
      // Fallback to perfect cadence
      log('Unknown cadence type, defaulting to perfect');
      return generateCadence('perfect', key, baseOctave);
    }
  }
}

/**
 * Determines the appropriate cadence type based on line position within the poem.
 *
 * Cadence selection rules:
 * - Final line of poem (last line of last stanza) → Perfect cadence
 * - Stanza end (but not final) → Perfect cadence
 * - Mid-stanza line → Half cadence
 * - Second-to-last line of stanza → May use deceptive for tension
 *
 * @param position - The position of the line in the poem
 * @returns The recommended cadence type for this position
 *
 * @example
 * ```typescript
 * // Last line of a 4-line stanza in the final stanza
 * const cadence = determineLineEndingCadence({
 *   lineIndex: 3,
 *   totalLines: 4,
 *   isStanzaEnd: true,
 *   isLastStanza: true
 * });
 * // Returns 'perfect'
 *
 * // Middle of a stanza
 * const cadence = determineLineEndingCadence({
 *   lineIndex: 1,
 *   totalLines: 4,
 *   isStanzaEnd: false,
 *   isLastStanza: false
 * });
 * // Returns 'half'
 * ```
 */
export function determineLineEndingCadence(position: LinePosition): CadenceType {
  log('determineLineEndingCadence', position);

  const { lineIndex, totalLines, isStanzaEnd, isLastStanza } = position;

  // Final line of the entire poem - strongest resolution
  if (isStanzaEnd && isLastStanza) {
    log('Final line of poem - using perfect cadence');
    return 'perfect';
  }

  // End of a stanza (but not the last stanza)
  if (isStanzaEnd && !isLastStanza) {
    log('End of stanza (not final) - using perfect cadence');
    return 'perfect';
  }

  // Second-to-last line of a stanza - sometimes use deceptive for tension
  if (lineIndex === totalLines - 2 && totalLines >= 4) {
    // Use deceptive cadence for longer stanzas to create anticipation
    // This creates a "surprise" before the final resolution
    log('Second-to-last line - using deceptive cadence for tension');
    return 'deceptive';
  }

  // Check if this is a "turning point" in the stanza (around 60-70% through)
  const positionRatio = (lineIndex + 1) / totalLines;
  if (positionRatio >= 0.5 && positionRatio < 0.75 && totalLines >= 4) {
    // Mid-to-late stanza - could use plagal for variety
    // Only use occasionally to add musical interest
    if (lineIndex % 2 === 1) {
      log('Mid-stanza turning point - using plagal cadence');
      return 'plagal';
    }
  }

  // Default: mid-stanza lines use half cadence to keep music moving
  log('Mid-stanza line - using half cadence');
  return 'half';
}

/**
 * Calculates the interval between two pitches
 * Returns the number of scale steps
 */
function calculateInterval(from: string, to: string): number {
  const pitchOrder = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const fromIndex = pitchOrder.indexOf(from.toUpperCase());
  const toIndex = pitchOrder.indexOf(to.toUpperCase());

  if (fromIndex === -1 || toIndex === -1) {
    return 0;
  }

  // Simple interval calculation (not accounting for octave)
  let interval = toIndex - fromIndex;
  if (interval < 0) {
    interval += 7;
  }
  return interval;
}

/**
 * Creates a smooth transition note between two pitches
 */
function createTransitionNote(from: Note, to: Note, key: KeySignature): Note | null {
  const interval = calculateInterval(from.pitch, to.pitch);

  // If interval is large (4th or more), add a passing tone
  if (interval >= 3) {
    const degrees = getScaleDegrees(key);
    const pitchOrder = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const fromIndex = pitchOrder.indexOf(from.pitch.toUpperCase());
    const toIndex = pitchOrder.indexOf(to.pitch.toUpperCase());

    // Find a midpoint pitch
    let midIndex: number;
    if (toIndex > fromIndex) {
      midIndex = Math.floor((fromIndex + toIndex) / 2);
    } else {
      // Wrap around
      midIndex = Math.floor((fromIndex + toIndex + 7) / 2) % 7;
    }

    const midPitch = pitchOrder[midIndex];

    // Check if this pitch is in the scale
    const inScale = degrees.some((d) => d.pitch === midPitch);
    if (inScale) {
      return {
        pitch: midPitch,
        octave: from.octave,
        duration: 1, // Short passing tone
      };
    }
  }

  return null;
}

/**
 * Applies phrase closure by appending cadence notes to an existing note sequence.
 * This function smoothly transitions from the melody into the cadence pattern,
 * ensuring musical continuity.
 *
 * The function:
 * 1. Analyzes the last note of the input sequence
 * 2. Generates the appropriate cadence pattern
 * 3. Adds transition notes if needed for smooth voice leading
 * 4. Adjusts octaves to maintain comfortable range
 *
 * @param notes - The existing melody notes
 * @param cadenceType - The type of cadence to apply
 * @param key - The musical key (defaults to 'C')
 * @returns New array with original notes plus cadence notes
 *
 * @example
 * ```typescript
 * const melody = [
 *   { pitch: 'E', octave: 0, duration: 2 },
 *   { pitch: 'D', octave: 0, duration: 2 },
 * ];
 *
 * const withCadence = applyPhraseClosure(melody, 'perfect', 'C');
 * // Returns melody + smooth transition to G -> C cadence
 * ```
 */
export function applyPhraseClosure(
  notes: Note[],
  cadenceType: CadenceType,
  key: KeySignature = 'C'
): Note[] {
  log('applyPhraseClosure', { noteCount: notes.length, cadenceType, key });

  // Handle empty input
  if (notes.length === 0) {
    log('Empty notes array, returning cadence only');
    return generateCadence(cadenceType, key);
  }

  // Get the last note to determine transition
  const lastNote = notes[notes.length - 1];
  log('Last melody note:', lastNote);

  // Determine base octave from the last note
  const baseOctave = lastNote.octave;

  // Generate the cadence pattern
  const cadenceNotes = generateCadence(cadenceType, key, baseOctave);
  log('Generated cadence notes:', cadenceNotes);

  // Check if we need a transition note for smooth voice leading
  const firstCadenceNote = cadenceNotes[0];
  const transitionNote = createTransitionNote(lastNote, firstCadenceNote, key);

  // Build the result
  const result = [...notes];

  if (transitionNote) {
    log('Adding transition note:', transitionNote);
    result.push(transitionNote);
  }

  // Add cadence notes
  result.push(...cadenceNotes);

  log('Final phrase length:', result.length);
  return result;
}

/**
 * Gets a short cadence pattern (2 notes) for tighter phrase endings.
 * Useful when there's limited space for a full cadence.
 *
 * @param type - The type of cadence
 * @param key - The musical key
 * @param baseOctave - Base octave for the notes
 * @returns Array of 2 notes forming a shortened cadence
 */
export function getShortCadence(
  type: CadenceType,
  key: KeySignature,
  baseOctave: number = 0
): Note[] {
  log('getShortCadence', { type, key, baseOctave });

  const tonic = getTonic(key);
  const dominant = getDominant(key);
  const subdominant = getSubdominant(key);
  const submediant = getSubmediant(key);

  switch (type) {
    case 'perfect':
      return [
        createNote(dominant, 2, baseOctave),
        createNote(tonic, 4, baseOctave),
      ];
    case 'half':
      return [
        createNote(subdominant, 2, baseOctave),
        createNote(dominant, 4, baseOctave),
      ];
    case 'deceptive':
      return [
        createNote(dominant, 2, baseOctave),
        createNote(submediant, 4, baseOctave),
      ];
    case 'plagal':
      return [
        createNote(subdominant, 2, baseOctave),
        createNote(tonic, 4, baseOctave),
      ];
    default:
      return getShortCadence('perfect', key, baseOctave);
  }
}

/**
 * Validates that a cadence resolves correctly in the given key.
 * Checks that the final note is appropriate for the cadence type.
 *
 * @param cadence - The cadence notes to validate
 * @param type - The expected cadence type
 * @param key - The musical key
 * @returns Object with valid flag and any issues found
 */
export function validateCadence(
  cadence: Note[],
  type: CadenceType,
  key: KeySignature
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (cadence.length === 0) {
    issues.push('Cadence is empty');
    return { valid: false, issues };
  }

  const lastNote = cadence[cadence.length - 1];
  const tonic = getTonic(key);
  const dominant = getDominant(key);
  const submediant = getSubmediant(key);

  switch (type) {
    case 'perfect':
    case 'plagal':
      // Should end on tonic
      if (lastNote.pitch !== tonic.pitch) {
        issues.push(
          `${type} cadence should end on tonic (${tonic.pitch}), but ends on ${lastNote.pitch}`
        );
      }
      break;
    case 'half':
      // Should end on dominant
      if (lastNote.pitch !== dominant.pitch) {
        issues.push(
          `Half cadence should end on dominant (${dominant.pitch}), but ends on ${lastNote.pitch}`
        );
      }
      break;
    case 'deceptive':
      // Should end on submediant
      if (lastNote.pitch !== submediant.pitch) {
        issues.push(
          `Deceptive cadence should end on submediant (${submediant.pitch}), but ends on ${lastNote.pitch}`
        );
      }
      break;
  }

  // Check that last note has appropriate duration (should be longer)
  if (lastNote.duration < 2) {
    issues.push('Final cadence note should have longer duration for proper resolution');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Gets the cadence notes needed to resolve to a target pitch.
 * Useful for creating custom phrase endings.
 *
 * @param targetPitch - The pitch to resolve to
 * @param key - The musical key
 * @param baseOctave - Base octave for notes
 * @returns Notes that lead to the target pitch
 */
export function getCadenceToTarget(
  targetPitch: string,
  key: KeySignature,
  baseOctave: number = 0
): Note[] {
  log('getCadenceToTarget', { targetPitch, key, baseOctave });

  const degrees = getScaleDegrees(key);
  const dominant = getDominant(key);
  const subdominant = getSubdominant(key);

  // Find what degree the target is
  const targetDegree = degrees.findIndex(
    (d) => d.pitch.toUpperCase() === targetPitch.toUpperCase()
  );

  if (targetDegree === -1) {
    // Target not in scale - approach from step above
    log('Target not in scale, using generic approach');
    return [
      { pitch: targetPitch, octave: baseOctave, duration: 4 },
    ];
  }

  // Build approach based on target
  switch (targetDegree) {
    case 0: // Tonic - use V-I
      return [
        createNote(dominant, 2, baseOctave),
        { pitch: targetPitch, octave: baseOctave, duration: 4 },
      ];
    case 4: // Dominant - use IV-V or ii-V
      return [
        createNote(subdominant, 2, baseOctave),
        { pitch: targetPitch, octave: baseOctave, duration: 4 },
      ];
    default: {
      // Generic step-wise approach
      const prevDegree = (targetDegree - 1 + 7) % 7;
      return [
        createNote(degrees[prevDegree], 2, baseOctave),
        { pitch: targetPitch, octave: baseOctave, duration: 4 },
      ];
    }
  }
}

/**
 * Suggests the best cadence type based on the emotional content.
 *
 * @param emotion - The emotional quality desired
 * @returns Recommended cadence type
 */
export function suggestCadenceForEmotion(
  emotion: 'conclusive' | 'suspenseful' | 'surprising' | 'peaceful'
): CadenceType {
  switch (emotion) {
    case 'conclusive':
      return 'perfect';
    case 'suspenseful':
      return 'half';
    case 'surprising':
      return 'deceptive';
    case 'peaceful':
      return 'plagal';
    default:
      return 'perfect';
  }
}
