/**
 * Key Constants
 *
 * Constants and types for musical key signatures.
 *
 * @module components/Melody/keyConstants
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
}

/**
 * All supported keys with metadata
 */
export const KEYS: KeyInfo[] = [
  { key: 'C', label: 'C Major', type: 'major' },
  { key: 'G', label: 'G Major', type: 'major' },
  { key: 'D', label: 'D Major', type: 'major' },
  { key: 'F', label: 'F Major', type: 'major' },
  { key: 'Am', label: 'A Minor', type: 'minor' },
  { key: 'Em', label: 'E Minor', type: 'minor' },
  { key: 'Dm', label: 'D Minor', type: 'minor' },
];
