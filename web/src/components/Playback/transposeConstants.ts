/**
 * Transpose Constants
 *
 * Constants and types for key transposition control.
 *
 * @module components/Playback/transposeConstants
 */

import type { KeySignature } from '@/lib/melody/types';

/**
 * Key information with display properties
 */
export interface KeyInfo {
  /** Key signature value */
  key: KeySignature;
  /** Display label */
  label: string;
  /** Whether this is a major or minor key */
  type: 'major' | 'minor';
  /** Number of sharps (positive) or flats (negative) */
  accidentals: number;
}

/**
 * All supported keys with metadata
 */
export const KEYS: KeyInfo[] = [
  { key: 'C', label: 'C Major', type: 'major', accidentals: 0 },
  { key: 'G', label: 'G Major', type: 'major', accidentals: 1 },
  { key: 'D', label: 'D Major', type: 'major', accidentals: 2 },
  { key: 'F', label: 'F Major', type: 'major', accidentals: -1 },
  { key: 'Am', label: 'A Minor', type: 'minor', accidentals: 0 },
  { key: 'Em', label: 'E Minor', type: 'minor', accidentals: 1 },
  { key: 'Dm', label: 'D Minor', type: 'minor', accidentals: -1 },
];
