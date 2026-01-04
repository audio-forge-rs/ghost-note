/**
 * ABC Notation Generator
 *
 * Generates valid ABC notation strings for melodies.
 * ABC notation is a text-based music notation format used by abcjs for rendering and playback.
 *
 * Reference: https://abcnotation.com/wiki/abc:standard:v2.1
 */

import type {
  MelodyParams,
  Note,
  Melody,
  DefaultNoteLength,
} from './types';

// Logging helper for debugging
const DEBUG = process.env.NODE_ENV === 'development';
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[abcGenerator] ${message}`, ...args);
  }
};

/**
 * Generates the ABC header fields from melody parameters.
 *
 * ABC headers include:
 * - X: Reference number (always 1)
 * - T: Title
 * - M: Time signature (meter)
 * - L: Default note length
 * - Q: Tempo (quarter note = BPM)
 * - K: Key signature
 *
 * @param params - Melody parameters
 * @returns ABC header string
 */
export function generateHeader(params: MelodyParams): string {
  log('generateHeader', params);

  // Validate tempo
  if (params.tempo <= 0) {
    throw new Error(`Invalid tempo: ${params.tempo}. Tempo must be positive.`);
  }

  // Build header fields
  const lines: string[] = [
    'X:1',
    `T:${params.title}`,
    `M:${params.timeSignature}`,
    `L:${params.defaultNoteLength}`,
    `Q:1/4=${params.tempo}`,
    `K:${params.key}`,
  ];

  return lines.join('\n');
}

/**
 * Maps a pitch name and octave to ABC notation.
 *
 * ABC pitch notation:
 * - Low octave (-1): C, D, E, F, G, A, B (with comma for lower: C,)
 * - Middle octave (0): C D E F G A B
 * - High octave (1): c d e f g a b (lowercase)
 * - Higher octave (2): c' d' e' (with apostrophe)
 *
 * @param pitch - Note pitch name ('C', 'D', 'E', 'F', 'G', 'A', 'B', or 'z' for rest)
 * @param octave - Octave number (-1, 0, 1, or 2)
 * @returns ABC pitch notation
 */
export function pitchToABC(pitch: string, octave: number): string {
  log('pitchToABC', { pitch, octave });

  // Handle rests
  if (pitch === 'z' || pitch === 'Z') {
    return 'z';
  }

  // Validate pitch
  const validPitches = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const upperPitch = pitch.toUpperCase();
  if (!validPitches.includes(upperPitch)) {
    throw new Error(`Invalid pitch: ${pitch}. Must be one of ${validPitches.join(', ')} or 'z' for rest.`);
  }

  // Map octave to ABC notation
  switch (octave) {
    case -2:
      // Very low octave: add two commas
      return `${upperPitch},,`;
    case -1:
      // Low octave: add comma
      return `${upperPitch},`;
    case 0:
      // Middle octave: uppercase
      return upperPitch;
    case 1:
      // High octave: lowercase
      return upperPitch.toLowerCase();
    case 2:
      // Very high octave: lowercase with apostrophe
      return `${upperPitch.toLowerCase()}'`;
    default:
      // Handle extended octaves
      if (octave < -2) {
        const commas = ','.repeat(Math.abs(octave) - 1);
        return `${upperPitch}${commas}`;
      } else {
        const apostrophes = "'".repeat(octave - 1);
        return `${upperPitch.toLowerCase()}${apostrophes}`;
      }
  }
}

/**
 * Converts a duration multiplier to ABC notation.
 *
 * When L:1/8 (default note length is eighth note):
 * - Duration 1 = eighth note (no suffix)
 * - Duration 2 = quarter note (2)
 * - Duration 4 = half note (4)
 * - Duration 8 = whole note (8)
 * - Duration 0.5 = sixteenth note (/2)
 * - Duration 0.25 = thirty-second note (/4)
 *
 * @param duration - Duration as multiplier of default note length
 * @param defaultLength - The default note length (L: field value)
 * @returns ABC duration suffix (empty string if duration is 1)
 */
export function durationToABC(duration: number, defaultLength: DefaultNoteLength): string {
  log('durationToABC', { duration, defaultLength });

  // Validate duration
  if (duration <= 0) {
    throw new Error(`Invalid duration: ${duration}. Duration must be positive.`);
  }

  // Duration of 1 means default length - no suffix needed
  if (duration === 1) {
    return '';
  }

  // Handle fractional durations (shorter than default)
  if (duration < 1) {
    // Convert to fraction denominator
    // 0.5 -> /2, 0.25 -> /4, etc.
    const denominator = Math.round(1 / duration);

    // Special case: /2 is common, others need full fraction
    if (denominator === 2) {
      return '/2';
    }
    return `/${denominator}`;
  }

  // Handle whole number durations
  if (Number.isInteger(duration)) {
    return String(duration);
  }

  // Handle mixed durations (e.g., 1.5 = dotted note)
  // In ABC, 3/2 represents a dotted note
  if (duration === 1.5) {
    return '3/2';
  }

  // For other fractional durations, express as fraction
  // Convert to simplest fraction
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const numerator = Math.round(duration * 100);
  const denominator = 100;
  const divisor = gcd(numerator, denominator);
  const simplifiedNum = numerator / divisor;
  const simplifiedDen = denominator / divisor;

  if (simplifiedDen === 1) {
    return String(simplifiedNum);
  }

  return `${simplifiedNum}/${simplifiedDen}`;
}

/**
 * Builds a single measure from an array of notes.
 *
 * @param notes - Array of notes in the measure
 * @param defaultLength - Default note length for duration calculation
 * @returns ABC notation for the measure (without bar lines)
 */
export function buildMeasure(notes: Note[], defaultLength: DefaultNoteLength = '1/8'): string {
  log('buildMeasure', { notes, defaultLength });

  if (notes.length === 0) {
    // Empty measure - return a full rest based on time signature
    // Default to whole rest
    return 'z8';
  }

  const noteStrings = notes.map((note) => {
    const pitchABC = pitchToABC(note.pitch, note.octave);
    const durationABC = durationToABC(note.duration, defaultLength);
    return `${pitchABC}${durationABC}`;
  });

  return noteStrings.join(' ');
}

/**
 * Builds a complete ABC notation string from a melody.
 *
 * @param melody - The complete melody object
 * @returns Complete ABC notation string
 */
export function buildABCString(melody: Melody): string {
  log('buildABCString', { measureCount: melody.measures.length });

  // Generate header
  const header = generateHeader(melody.params);

  // Generate measures
  const measureStrings = melody.measures.map((notes, index) => {
    const measureContent = buildMeasure(notes, melody.params.defaultNoteLength);
    log(`Measure ${index + 1}:`, measureContent);
    return measureContent;
  });

  // Join measures with bar lines
  // Start with bar line, content, end with double bar
  let musicLine = '';
  if (measureStrings.length > 0) {
    musicLine = '|' + measureStrings.join('|') + '|]';
  }

  // Combine header and music
  let abc = header + '\n' + musicLine;

  // Add lyrics if present
  if (melody.lyrics && melody.lyrics.length > 0) {
    abc = addLyrics(abc, melody.lyrics);
  }

  log('Final ABC:', abc);
  return abc;
}

/**
 * Adds lyrics to an ABC notation string.
 *
 * Lyrics are added using the w: field below the music line.
 * Each syllable corresponds to a note in order.
 * Hyphen (-) connects syllables within a word.
 * Underscore (_) holds a syllable over multiple notes.
 * Asterisk (*) skips a note.
 * Pipe (|) indicates bar line alignment.
 *
 * @param abc - ABC notation string
 * @param lyrics - Array of arrays of syllables (grouped by measure)
 * @returns ABC notation with lyrics added
 */
export function addLyrics(abc: string, lyrics: string[][]): string {
  if (!lyrics || lyrics.length === 0) {
    return abc;
  }

  log('addLyrics', { lyricsCount: lyrics.length });

  // Build lyrics line
  // Flatten lyrics with bar separators
  const lyricsSegments = lyrics.map((measureLyrics) => {
    // Join syllables with spaces, using hyphen to connect within words
    return measureLyrics.join(' ');
  });

  // Join with bar line markers for alignment
  const lyricsLine = 'w: ' + lyricsSegments.join(' | ');

  // Find where to insert lyrics (after the music line)
  // Music line ends with |] or just |
  const lines = abc.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    result.push(line);
    // If this line contains music (has bar lines), add lyrics after it
    if (line.includes('|') && !line.startsWith('w:')) {
      result.push(lyricsLine);
    }
  }

  return result.join('\n');
}

/**
 * Validates that a melody will produce valid ABC notation.
 *
 * @param melody - The melody to validate
 * @returns Object with valid flag and any error messages
 */
export function validateMelody(melody: Melody): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate params
  if (!melody.params.title) {
    errors.push('Title is required');
  }

  if (melody.params.tempo <= 0) {
    errors.push('Tempo must be positive');
  }

  // Validate time signature
  const validTimeSignatures = ['4/4', '3/4', '6/8', '2/4'];
  if (!validTimeSignatures.includes(melody.params.timeSignature)) {
    errors.push(`Invalid time signature: ${melody.params.timeSignature}`);
  }

  // Validate key signature
  const validKeys = ['C', 'G', 'D', 'F', 'Am', 'Em', 'Dm'];
  if (!validKeys.includes(melody.params.key)) {
    errors.push(`Invalid key signature: ${melody.params.key}`);
  }

  // Validate measures
  if (!melody.measures || melody.measures.length === 0) {
    errors.push('At least one measure is required');
  }

  // Validate notes in each measure
  melody.measures.forEach((measure, measureIndex) => {
    measure.forEach((note, noteIndex) => {
      // Validate pitch
      const validPitches = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'z', 'Z'];
      if (!validPitches.includes(note.pitch.toUpperCase())) {
        errors.push(`Invalid pitch '${note.pitch}' at measure ${measureIndex + 1}, note ${noteIndex + 1}`);
      }

      // Validate duration
      if (note.duration <= 0) {
        errors.push(`Invalid duration at measure ${measureIndex + 1}, note ${noteIndex + 1}`);
      }
    });
  });

  // Validate lyrics alignment (if present)
  if (melody.lyrics && melody.lyrics.length > 0) {
    if (melody.lyrics.length !== melody.measures.length) {
      errors.push(`Lyrics count (${melody.lyrics.length}) does not match measure count (${melody.measures.length})`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Gets the number of beats per measure for a time signature.
 *
 * @param timeSignature - The time signature
 * @returns Number of beats per measure
 */
export function getBeatsPerMeasure(timeSignature: string): number {
  switch (timeSignature) {
    case '4/4':
      return 4;
    case '3/4':
      return 3;
    case '6/8':
      return 6; // Compound duple, but 6 eighth-note beats
    case '2/4':
      return 2;
    default: {
      // Try to parse custom time signatures
      const parts = timeSignature.split('/');
      if (parts.length === 2) {
        return parseInt(parts[0], 10);
      }
      return 4; // Default to 4/4
    }
  }
}

/**
 * Gets the default note length denominator from L: field.
 *
 * @param defaultLength - The L: field value
 * @returns Denominator (8 for 1/8, 4 for 1/4, etc.)
 */
export function getDefaultLengthDenominator(defaultLength: DefaultNoteLength): number {
  switch (defaultLength) {
    case '1/8':
      return 8;
    case '1/4':
      return 4;
    case '1/16':
      return 16;
    default:
      return 8;
  }
}

/**
 * Calculates total duration of notes in a measure.
 * Useful for validating measure completeness.
 *
 * @param notes - Notes in the measure
 * @returns Total duration in terms of default note length multipliers
 */
export function calculateMeasureDuration(notes: Note[]): number {
  const totalMultiplier = notes.reduce((sum, note) => sum + note.duration, 0);
  return totalMultiplier;
}
