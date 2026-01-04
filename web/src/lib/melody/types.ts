/**
 * Types for ABC notation generation
 */

/** Supported time signatures */
export type TimeSignature = '4/4' | '3/4' | '6/8' | '2/4';

/** Supported default note lengths */
export type DefaultNoteLength = '1/8' | '1/4' | '1/16';

/** Supported key signatures */
export type KeySignature = 'C' | 'G' | 'D' | 'F' | 'Am' | 'Em' | 'Dm';

/** Parameters for melody generation */
export interface MelodyParams {
  /** Title of the tune */
  title: string;
  /** Time signature */
  timeSignature: TimeSignature;
  /** Default note length (L: field) */
  defaultNoteLength: DefaultNoteLength;
  /** Tempo in BPM */
  tempo: number;
  /** Key signature */
  key: KeySignature;
}

/** A single note in the melody */
export interface Note {
  /** Pitch name: 'C', 'D', 'E', 'F', 'G', 'A', 'B', or 'z' for rest */
  pitch: string;
  /** Octave: -1 (low), 0 (middle), 1 (high) */
  octave: number;
  /** Duration as multiplier of default note length */
  duration: number;
}

/** A complete melody */
export interface Melody {
  /** Melody parameters */
  params: MelodyParams;
  /** Notes grouped by measure */
  measures: Note[][];
  /** Lyrics syllables grouped by measure */
  lyrics: string[][];
}
