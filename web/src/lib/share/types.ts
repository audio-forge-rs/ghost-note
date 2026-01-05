/**
 * Ghost Note - Share Types
 *
 * Type definitions for URL sharing functionality.
 *
 * @module lib/share/types
 */

import type { LyricVersion } from '../../stores/types';
import type { PoemAnalysis } from '../../types';
import type { Melody } from '../melody/types';

// =============================================================================
// Share Mode Types
// =============================================================================

/**
 * Share mode determines what data is included in the shared link.
 * - 'poem-only': Only includes the original poem text (smallest URL)
 * - 'with-analysis': Includes poem and analysis results
 * - 'full': Includes poem, analysis, melody, and versions (largest URL)
 */
export type ShareMode = 'poem-only' | 'with-analysis' | 'full';

/**
 * Schema version for share data format.
 * Increment when making breaking changes to share data structure.
 */
export const SHARE_SCHEMA_VERSION = '1.0.0';

// =============================================================================
// Share Data Types
// =============================================================================

/**
 * Minimal share data - just the poem text.
 */
export interface PoemOnlyShareData {
  version: string;
  mode: 'poem-only';
  poem: string;
}

/**
 * Share data with analysis included.
 */
export interface WithAnalysisShareData {
  version: string;
  mode: 'with-analysis';
  poem: string;
  analysis: PoemAnalysis;
}

/**
 * Full share data with all project details.
 */
export interface FullShareData {
  version: string;
  mode: 'full';
  poem: {
    original: string;
    versions: LyricVersion[];
    currentVersionIndex: number;
  };
  analysis: PoemAnalysis | null;
  melody: {
    data: Melody | null;
    abcNotation: string | null;
  } | null;
}

/**
 * Union type for all share data formats.
 */
export type ShareData = PoemOnlyShareData | WithAnalysisShareData | FullShareData;

// =============================================================================
// Share Result Types
// =============================================================================

/**
 * Result of encoding share data to URL.
 */
export interface ShareEncodeResult {
  /** Whether encoding was successful */
  success: boolean;
  /** The generated share URL (if successful) */
  url?: string;
  /** Error message (if failed) */
  error?: string;
  /** The share mode used */
  mode: ShareMode;
  /** Approximate size of the encoded data in bytes */
  dataSize: number;
  /** Whether compression was applied */
  compressed: boolean;
}

/**
 * Result of decoding share data from URL.
 */
export interface ShareDecodeResult {
  /** Whether decoding was successful */
  success: boolean;
  /** The decoded share data (if successful) */
  data?: ShareData;
  /** Error message (if failed) */
  error?: string;
  /** The detected share mode */
  mode?: ShareMode;
  /** Schema version of the share data */
  version?: string;
}

/**
 * Options for generating a share URL.
 */
export interface ShareOptions {
  /** Share mode (what data to include) */
  mode?: ShareMode;
  /** Whether to use compression (default: true for larger data) */
  compress?: boolean;
  /** Whether to use the short URL fragment format (default: true) */
  useFragment?: boolean;
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if share data is poem-only mode.
 */
export function isPoemOnlyShareData(data: ShareData): data is PoemOnlyShareData {
  return data.mode === 'poem-only';
}

/**
 * Check if share data is with-analysis mode.
 */
export function isWithAnalysisShareData(data: ShareData): data is WithAnalysisShareData {
  return data.mode === 'with-analysis';
}

/**
 * Check if share data is full mode.
 */
export function isFullShareData(data: ShareData): data is FullShareData {
  return data.mode === 'full';
}
