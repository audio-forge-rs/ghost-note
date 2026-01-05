/**
 * Ghost Note - Project Import/Export Types
 *
 * Type definitions for project serialization and deserialization.
 *
 * @module lib/project/types
 */

import type { LyricVersion, RecordingTake } from '../../stores/types';
import type { PoemAnalysis } from '../../types';
import type { Melody } from '../melody/types';

// =============================================================================
// Schema Version
// =============================================================================

/**
 * Current project schema version.
 * Increment when making breaking changes to ProjectData structure.
 */
export const CURRENT_SCHEMA_VERSION = '1.0.0';

/**
 * Minimum supported schema version for migration.
 */
export const MIN_SUPPORTED_VERSION = '1.0.0';

// =============================================================================
// User Settings
// =============================================================================

/**
 * User settings that are part of the project export.
 * Does not include UI preferences (theme, panel visibility, etc.)
 */
export interface UserSettings {
  /** Melody playback tempo in BPM */
  tempo: number;
  /** Melody playback volume (0-1) */
  volume: number;
  /** Whether to loop melody playback */
  loop: boolean;
  /** Selected key signature */
  key: string;
  /** Selected time signature */
  timeSignature: string;
}

// =============================================================================
// Recording Metadata
// =============================================================================

/**
 * Recording take metadata for export.
 * Excludes audio blob data (blobUrl) since it can't be serialized to JSON.
 */
export interface RecordingMetadata {
  /** Unique identifier */
  id: string;
  /** Duration in seconds */
  duration: number;
  /** When this was recorded */
  timestamp: number;
  /** ID of the melody version used during recording */
  melodyVersionId?: string;
  /** ID of the lyric version used during recording */
  lyricVersionId?: string;
  /** Optional user-provided name */
  name?: string;
}

// =============================================================================
// Project Data
// =============================================================================

/**
 * Complete project data structure for import/export.
 */
export interface ProjectData {
  /** Schema version for migration support */
  version: string;
  /** ISO timestamp when project was exported */
  exportedAt: string;
  /** Poem data including original and all versions */
  poem: {
    /** Original poem text as entered by user */
    original: string;
    /** All lyric versions with their metadata */
    versions: LyricVersion[];
    /** Index of currently active version (-1 means original) */
    currentVersionIndex: number;
  };
  /** Analysis results (null if not analyzed) */
  analysis: PoemAnalysis | null;
  /** Generated melody (null if not generated) */
  melody: {
    /** The melody data structure */
    data: Melody | null;
    /** ABC notation string */
    abcNotation: string | null;
  };
  /** User settings for playback */
  settings: UserSettings;
  /** Recording metadata (excludes audio blobs) */
  recordings: RecordingMetadata[];
}

// =============================================================================
// Validation Types
// =============================================================================

/**
 * Result of project validation.
 */
export interface ValidationResult {
  /** Whether the project data is valid */
  valid: boolean;
  /** List of validation errors (empty if valid) */
  errors: string[];
  /** List of validation warnings (non-fatal issues) */
  warnings: string[];
}

/**
 * Error thrown when project import fails.
 */
export class ProjectImportError extends Error {
  readonly errors: string[];

  constructor(message: string, errors: string[]) {
    super(message);
    this.name = 'ProjectImportError';
    this.errors = errors;
  }
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Converts a RecordingTake to RecordingMetadata (strips blobUrl).
 */
export function takeToMetadata(take: RecordingTake): RecordingMetadata {
  return {
    id: take.id,
    duration: take.duration,
    timestamp: take.timestamp,
    melodyVersionId: take.melodyVersionId,
    lyricVersionId: take.lyricVersionId,
    name: take.name,
  };
}

/**
 * Converts RecordingMetadata back to RecordingTake (with empty blobUrl).
 */
export function metadataToTake(metadata: RecordingMetadata): RecordingTake {
  return {
    id: metadata.id,
    blobUrl: '', // Audio blob is not preserved in export
    duration: metadata.duration,
    timestamp: metadata.timestamp,
    melodyVersionId: metadata.melodyVersionId,
    lyricVersionId: metadata.lyricVersionId,
    name: metadata.name,
  };
}
