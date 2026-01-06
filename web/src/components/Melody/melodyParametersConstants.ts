/**
 * Melody Parameters Constants
 *
 * Constants and types for melody parameter configuration.
 *
 * @module components/Melody/melodyParametersConstants
 */

import type { KeySignature, TimeSignature } from '@/lib/melody/types';
import type { MusicalMode } from '@/types/analysis';
import type { NotePosition } from './rangeConstants';

/**
 * Complete melody parameters state
 */
export interface MelodyParameters {
  /** Key signature */
  key: KeySignature;
  /** Musical mode (major/minor) */
  mode: MusicalMode;
  /** Tempo in BPM */
  tempo: number;
  /** Time signature */
  timeSignature: TimeSignature;
  /** Low vocal range limit */
  rangeLow: NotePosition;
  /** High vocal range limit */
  rangeHigh: NotePosition;
  /** Style preset name (or null for custom) */
  stylePreset: string | null;
}

/**
 * Default parameters
 */
export const DEFAULT_PARAMETERS: MelodyParameters = {
  key: 'C',
  mode: 'major',
  tempo: 100,
  timeSignature: '4/4',
  rangeLow: { note: 'C', octave: 0 },
  rangeHigh: { note: 'C', octave: 1 },
  stylePreset: null,
};
