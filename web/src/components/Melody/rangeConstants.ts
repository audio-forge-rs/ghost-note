/**
 * Range Constants
 *
 * Constants and types for vocal range selection.
 *
 * @module components/Melody/rangeConstants
 */

/**
 * Note position in the vocal range
 * Uses scientific pitch notation offset from C3 (middle C area)
 */
export interface NotePosition {
  /** Note name (C, D, E, F, G, A, B) */
  note: string;
  /** Octave number (-1 = low, 0 = middle, 1 = high) */
  octave: number;
}

/**
 * Vocal range preset configuration
 */
export interface VocalRangePreset {
  /** Label for the preset */
  label: string;
  /** Low note position */
  low: NotePosition;
  /** High note position */
  high: NotePosition;
}

/**
 * Common vocal range presets
 */
export const VOCAL_RANGE_PRESETS: VocalRangePreset[] = [
  { label: 'Bass', low: { note: 'E', octave: -1 }, high: { note: 'E', octave: 0 } },
  { label: 'Baritone', low: { note: 'A', octave: -1 }, high: { note: 'A', octave: 0 } },
  { label: 'Tenor', low: { note: 'C', octave: 0 }, high: { note: 'C', octave: 1 } },
  { label: 'Alto', low: { note: 'F', octave: 0 }, high: { note: 'F', octave: 1 } },
  { label: 'Soprano', low: { note: 'C', octave: 0 }, high: { note: 'G', octave: 1 } },
];
