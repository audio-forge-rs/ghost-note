/**
 * Ghost Note - Project Validation
 *
 * Functions for validating project data before import.
 *
 * @module lib/project/validate
 */

import type { ProjectData, ValidationResult } from './types';
import { CURRENT_SCHEMA_VERSION, MIN_SUPPORTED_VERSION } from './types';
import { isPoemAnalysis } from '../../types/analysis';

// =============================================================================
// Version Comparison
// =============================================================================

/**
 * Compares two semantic version strings.
 *
 * @param a - First version
 * @param b - Second version
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] ?? 0;
    const numB = partsB[i] ?? 0;

    if (numA < numB) return -1;
    if (numA > numB) return 1;
  }

  return 0;
}

/**
 * Checks if a version is supported for import.
 *
 * @param version - Version string to check
 * @returns True if version is supported
 */
function isVersionSupported(version: string): boolean {
  return (
    compareVersions(version, MIN_SUPPORTED_VERSION) >= 0 &&
    compareVersions(version, CURRENT_SCHEMA_VERSION) <= 0
  );
}

// =============================================================================
// Validation Functions
// =============================================================================

/**
 * Validates a raw JSON object as ProjectData.
 *
 * @param data - Raw parsed JSON object
 * @returns Validation result with errors and warnings
 */
export function validateProjectData(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if data is an object (not null, not array)
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    errors.push('Project data must be a non-null object');
    return { valid: false, errors, warnings };
  }

  const project = data as Record<string, unknown>;

  // ==========================================================================
  // Required Fields
  // ==========================================================================

  // Version
  if (!('version' in project)) {
    errors.push('Missing required field: version');
  } else if (typeof project.version !== 'string') {
    errors.push('Field "version" must be a string');
  } else if (!isVersionSupported(project.version)) {
    errors.push(
      `Unsupported schema version: ${project.version}. ` +
        `Supported range: ${MIN_SUPPORTED_VERSION} to ${CURRENT_SCHEMA_VERSION}`
    );
  }

  // ExportedAt
  if (!('exportedAt' in project)) {
    errors.push('Missing required field: exportedAt');
  } else if (typeof project.exportedAt !== 'string') {
    errors.push('Field "exportedAt" must be a string');
  } else {
    const date = new Date(project.exportedAt);
    if (isNaN(date.getTime())) {
      errors.push('Field "exportedAt" must be a valid ISO date string');
    }
  }

  // Poem
  if (!('poem' in project)) {
    errors.push('Missing required field: poem');
  } else {
    const poemErrors = validatePoem(project.poem);
    errors.push(...poemErrors);
  }

  // Settings
  if (!('settings' in project)) {
    errors.push('Missing required field: settings');
  } else {
    const settingsErrors = validateSettings(project.settings);
    errors.push(...settingsErrors);
  }

  // ==========================================================================
  // Optional Fields with Validation
  // ==========================================================================

  // Analysis (can be null)
  if ('analysis' in project && project.analysis !== null) {
    if (!isPoemAnalysis(project.analysis)) {
      warnings.push('Analysis data does not match expected structure; it may be corrupted');
    }
  }

  // Melody (can be null or have null fields)
  if ('melody' in project && project.melody !== null) {
    const melodyWarnings = validateMelody(project.melody);
    warnings.push(...melodyWarnings);
  }

  // Recordings (can be empty array)
  if ('recordings' in project) {
    if (!Array.isArray(project.recordings)) {
      errors.push('Field "recordings" must be an array');
    } else {
      const recordingWarnings = validateRecordings(project.recordings);
      warnings.push(...recordingWarnings);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates the poem section of project data.
 */
function validatePoem(poem: unknown): string[] {
  const errors: string[] = [];

  if (typeof poem !== 'object' || poem === null) {
    errors.push('Field "poem" must be an object');
    return errors;
  }

  const poemObj = poem as Record<string, unknown>;

  // Original
  if (!('original' in poemObj)) {
    errors.push('Missing required field: poem.original');
  } else if (typeof poemObj.original !== 'string') {
    errors.push('Field "poem.original" must be a string');
  }

  // Versions
  if (!('versions' in poemObj)) {
    errors.push('Missing required field: poem.versions');
  } else if (!Array.isArray(poemObj.versions)) {
    errors.push('Field "poem.versions" must be an array');
  } else {
    // Validate each version
    for (let i = 0; i < poemObj.versions.length; i++) {
      const versionErrors = validateLyricVersion(poemObj.versions[i], i);
      errors.push(...versionErrors);
    }
  }

  // CurrentVersionIndex
  if (!('currentVersionIndex' in poemObj)) {
    errors.push('Missing required field: poem.currentVersionIndex');
  } else if (typeof poemObj.currentVersionIndex !== 'number') {
    errors.push('Field "poem.currentVersionIndex" must be a number');
  } else if (!Number.isInteger(poemObj.currentVersionIndex)) {
    errors.push('Field "poem.currentVersionIndex" must be an integer');
  }

  return errors;
}

/**
 * Validates a single lyric version.
 */
function validateLyricVersion(version: unknown, index: number): string[] {
  const errors: string[] = [];

  if (typeof version !== 'object' || version === null) {
    errors.push(`poem.versions[${index}] must be an object`);
    return errors;
  }

  const v = version as Record<string, unknown>;

  if (typeof v.id !== 'string' || v.id.length === 0) {
    errors.push(`poem.versions[${index}].id must be a non-empty string`);
  }

  if (typeof v.lyrics !== 'string') {
    errors.push(`poem.versions[${index}].lyrics must be a string`);
  }

  if (typeof v.timestamp !== 'number') {
    errors.push(`poem.versions[${index}].timestamp must be a number`);
  }

  if (!Array.isArray(v.changes)) {
    errors.push(`poem.versions[${index}].changes must be an array`);
  }

  return errors;
}

/**
 * Validates the settings section of project data.
 */
function validateSettings(settings: unknown): string[] {
  const errors: string[] = [];

  if (typeof settings !== 'object' || settings === null) {
    errors.push('Field "settings" must be an object');
    return errors;
  }

  const s = settings as Record<string, unknown>;

  if (typeof s.tempo !== 'number' || s.tempo < 20 || s.tempo > 300) {
    errors.push('Field "settings.tempo" must be a number between 20 and 300');
  }

  if (typeof s.volume !== 'number' || s.volume < 0 || s.volume > 1) {
    errors.push('Field "settings.volume" must be a number between 0 and 1');
  }

  if (typeof s.loop !== 'boolean') {
    errors.push('Field "settings.loop" must be a boolean');
  }

  if (typeof s.key !== 'string') {
    errors.push('Field "settings.key" must be a string');
  }

  if (typeof s.timeSignature !== 'string') {
    errors.push('Field "settings.timeSignature" must be a string');
  }

  return errors;
}

/**
 * Validates the melody section of project data.
 */
function validateMelody(melody: unknown): string[] {
  const warnings: string[] = [];

  if (typeof melody !== 'object' || melody === null) {
    warnings.push('Melody data is not a valid object');
    return warnings;
  }

  const m = melody as Record<string, unknown>;

  // data can be null or a Melody object
  if (m.data !== null && typeof m.data !== 'object') {
    warnings.push('Melody data structure may be corrupted');
  }

  // abcNotation can be null or a string
  if (m.abcNotation !== null && typeof m.abcNotation !== 'string') {
    warnings.push('ABC notation may be corrupted');
  }

  return warnings;
}

/**
 * Validates the recordings array.
 */
function validateRecordings(recordings: unknown[]): string[] {
  const warnings: string[] = [];

  for (let i = 0; i < recordings.length; i++) {
    const recording = recordings[i];

    if (typeof recording !== 'object' || recording === null) {
      warnings.push(`recordings[${i}] is not a valid object`);
      continue;
    }

    const r = recording as Record<string, unknown>;

    if (typeof r.id !== 'string') {
      warnings.push(`recordings[${i}].id is missing or invalid`);
    }

    if (typeof r.duration !== 'number' || r.duration < 0) {
      warnings.push(`recordings[${i}].duration is missing or invalid`);
    }

    if (typeof r.timestamp !== 'number') {
      warnings.push(`recordings[${i}].timestamp is missing or invalid`);
    }
  }

  return warnings;
}

/**
 * Parses and validates a JSON string as ProjectData.
 *
 * @param jsonString - JSON string to parse
 * @returns Validation result
 */
export function parseAndValidate(jsonString: string): ValidationResult & { data?: ProjectData } {
  // Try to parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown parse error';
    return {
      valid: false,
      errors: [`Invalid JSON: ${message}`],
      warnings: [],
    };
  }

  // Validate the parsed data
  const result = validateProjectData(parsed);

  if (result.valid) {
    return {
      ...result,
      data: parsed as ProjectData,
    };
  }

  return result;
}
