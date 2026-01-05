/**
 * Ghost Note - Project Import
 *
 * Functions for importing project data from JSON.
 *
 * @module lib/project/import
 */

import { usePoemStore } from '../../stores/usePoemStore';
import { useAnalysisStore } from '../../stores/useAnalysisStore';
import { useMelodyStore } from '../../stores/useMelodyStore';
import { useRecordingStore } from '../../stores/useRecordingStore';
import type { ProjectData } from './types';
import { ProjectImportError, metadataToTake, CURRENT_SCHEMA_VERSION } from './types';
import { parseAndValidate, validateProjectData } from './validate';
import type { KeySignature, TimeSignature } from '../melody/types';

// =============================================================================
// Import Options
// =============================================================================

/**
 * Options for importing a project.
 */
export interface ImportOptions {
  /** Whether to clear existing data before importing (default: true) */
  clearExisting?: boolean;
  /** Whether to import recordings metadata (default: true) */
  includeRecordings?: boolean;
  /** Whether to import melody data (default: true) */
  includeMelody?: boolean;
  /** Whether to import analysis data (default: true) */
  includeAnalysis?: boolean;
}

const defaultOptions: Required<ImportOptions> = {
  clearExisting: true,
  includeRecordings: true,
  includeMelody: true,
  includeAnalysis: true,
};

// =============================================================================
// Import Functions
// =============================================================================

/**
 * Imports project data into the application stores.
 *
 * @param data - Validated ProjectData object
 * @param options - Import options
 * @throws ProjectImportError if import fails
 */
export function importProject(data: ProjectData, options: ImportOptions = {}): void {
  const opts = { ...defaultOptions, ...options };

  console.log('[Project] Importing project...', {
    version: data.version,
    exportedAt: data.exportedAt,
    options: opts,
  });

  // Validate the data before importing
  const validation = validateProjectData(data);
  if (!validation.valid) {
    throw new ProjectImportError('Invalid project data', validation.errors);
  }

  // Log warnings if any
  if (validation.warnings.length > 0) {
    console.warn('[Project] Import warnings:', validation.warnings);
  }

  // Migrate data if needed
  const migratedData = migrateProjectData(data);

  // Clear existing data if requested
  if (opts.clearExisting) {
    console.log('[Project] Clearing existing data...');
    usePoemStore.getState().reset();
    useAnalysisStore.getState().reset();
    useMelodyStore.getState().reset();
    useRecordingStore.getState().reset();
  }

  // Import poem data
  importPoemData(migratedData);

  // Import analysis data
  if (opts.includeAnalysis && migratedData.analysis) {
    importAnalysisData(migratedData);
  }

  // Import melody data
  if (opts.includeMelody) {
    importMelodyData(migratedData);
  }

  // Import recording metadata
  if (opts.includeRecordings) {
    importRecordingData(migratedData);
  }

  console.log('[Project] Import complete');
}

/**
 * Imports project data from a JSON string.
 *
 * @param jsonString - JSON string containing project data
 * @param options - Import options
 * @throws ProjectImportError if parsing or validation fails
 */
export function importProjectFromJson(jsonString: string, options: ImportOptions = {}): void {
  console.log('[Project] Parsing JSON...');

  const result = parseAndValidate(jsonString);

  if (!result.valid || !result.data) {
    throw new ProjectImportError('Failed to parse project JSON', result.errors);
  }

  importProject(result.data, options);
}

/**
 * Imports project data from a File object.
 *
 * @param file - File object (from file input or drag-and-drop)
 * @param options - Import options
 * @returns Promise that resolves when import is complete
 * @throws ProjectImportError if reading, parsing, or validation fails
 */
export async function importProjectFromFile(
  file: File,
  options: ImportOptions = {}
): Promise<void> {
  console.log('[Project] Reading file:', file.name);

  // Validate file type
  if (!file.name.endsWith('.json') && file.type !== 'application/json') {
    throw new ProjectImportError('Invalid file type', ['File must be a JSON file (.json)']);
  }

  // Read file contents
  let jsonString: string;
  try {
    jsonString = await file.text();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new ProjectImportError('Failed to read file', [message]);
  }

  // Import from JSON string
  importProjectFromJson(jsonString, options);
}

// =============================================================================
// Data Import Helpers
// =============================================================================

/**
 * Imports poem data into the poem store.
 */
function importPoemData(data: ProjectData): void {
  console.log('[Project] Importing poem data...');

  const poemStore = usePoemStore.getState();

  // Set the original poem
  poemStore.setPoem(data.poem.original);

  // Import all versions
  // We need to directly set the state since addVersion computes changes
  usePoemStore.setState({
    versions: data.poem.versions,
    currentVersionIndex: data.poem.currentVersionIndex,
  });

  console.log('[Project] Poem imported:', {
    hasOriginal: data.poem.original.length > 0,
    versionCount: data.poem.versions.length,
    currentVersion: data.poem.currentVersionIndex,
  });
}

/**
 * Imports analysis data into the analysis store.
 */
function importAnalysisData(data: ProjectData): void {
  if (!data.analysis) {
    console.log('[Project] No analysis data to import');
    return;
  }

  console.log('[Project] Importing analysis data...');

  const analysisStore = useAnalysisStore.getState();

  // Find the version ID that was analyzed
  // If currentVersionIndex is -1, no specific version was analyzed
  let analyzedVersionId: string | undefined;
  if (
    data.poem.currentVersionIndex >= 0 &&
    data.poem.versions[data.poem.currentVersionIndex]
  ) {
    analyzedVersionId = data.poem.versions[data.poem.currentVersionIndex].id;
  }

  analysisStore.setAnalysis(data.analysis, analyzedVersionId);

  console.log('[Project] Analysis imported');
}

/**
 * Imports melody data and settings into the melody store.
 */
function importMelodyData(data: ProjectData): void {
  console.log('[Project] Importing melody data...');

  const melodyStore = useMelodyStore.getState();

  // Import settings
  melodyStore.setTempo(data.settings.tempo);
  melodyStore.setVolume(data.settings.volume);
  if (data.settings.loop) {
    // Only toggle if we need to enable loop (store defaults to false)
    if (!melodyStore.loop) {
      melodyStore.toggleLoop();
    }
  }

  // Type-safe key setting
  const validKeys: KeySignature[] = ['C', 'G', 'D', 'F', 'Am', 'Em', 'Dm'];
  if (validKeys.includes(data.settings.key as KeySignature)) {
    melodyStore.setKey(data.settings.key as KeySignature);
  }

  // Type-safe time signature setting
  const validTimeSignatures: TimeSignature[] = ['4/4', '3/4', '6/8', '2/4'];
  if (validTimeSignatures.includes(data.settings.timeSignature as TimeSignature)) {
    melodyStore.setTimeSignature(data.settings.timeSignature as TimeSignature);
  }

  // Import melody if present
  if (data.melody.data && data.melody.abcNotation) {
    melodyStore.setMelody(data.melody.data, data.melody.abcNotation);
    console.log('[Project] Melody data imported');
  } else if (data.melody.abcNotation) {
    melodyStore.setAbcNotation(data.melody.abcNotation);
    console.log('[Project] ABC notation imported (no melody data)');
  } else {
    console.log('[Project] No melody data to import');
  }
}

/**
 * Imports recording metadata into the recording store.
 */
function importRecordingData(data: ProjectData): void {
  if (!data.recordings || data.recordings.length === 0) {
    console.log('[Project] No recording data to import');
    return;
  }

  console.log('[Project] Importing recording metadata...');

  const recordingStore = useRecordingStore.getState();

  // Convert metadata back to takes (with empty blobUrl)
  for (const metadata of data.recordings) {
    const take = metadataToTake(metadata);
    recordingStore.addTake(take);
  }

  console.log('[Project] Recordings imported:', data.recordings.length);
}

// =============================================================================
// Migration
// =============================================================================

/**
 * Migrates project data from older schema versions to the current version.
 *
 * @param data - Project data to migrate
 * @returns Migrated project data
 */
function migrateProjectData(data: ProjectData): ProjectData {
  // Currently only version 1.0.0 exists, so no migration needed
  if (data.version === CURRENT_SCHEMA_VERSION) {
    return data;
  }

  console.log('[Project] Migrating from version', data.version, 'to', CURRENT_SCHEMA_VERSION);

  // Future migrations would go here
  // Example:
  // if (compareVersions(data.version, '1.1.0') < 0) {
  //   data = migrateFrom100To110(data);
  // }

  // Update version to current
  return {
    ...data,
    version: CURRENT_SCHEMA_VERSION,
  };
}
