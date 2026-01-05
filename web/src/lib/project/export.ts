/**
 * Ghost Note - Project Export
 *
 * Functions for exporting project data to JSON.
 *
 * @module lib/project/export
 */

import { usePoemStore } from '../../stores/usePoemStore';
import { useAnalysisStore } from '../../stores/useAnalysisStore';
import { useMelodyStore } from '../../stores/useMelodyStore';
import { useRecordingStore } from '../../stores/useRecordingStore';
import type { ProjectData, UserSettings, RecordingMetadata } from './types';
import { CURRENT_SCHEMA_VERSION, takeToMetadata } from './types';

// =============================================================================
// Export Functions
// =============================================================================

/**
 * Exports the current project state to a ProjectData object.
 *
 * @returns Complete project data ready for serialization
 */
export function exportProject(): ProjectData {
  console.log('[Project] Exporting project...');

  // Get state from all stores
  const poemState = usePoemStore.getState();
  const analysisState = useAnalysisStore.getState();
  const melodyState = useMelodyStore.getState();
  const recordingState = useRecordingStore.getState();

  // Build user settings from melody store
  const settings: UserSettings = {
    tempo: melodyState.tempo,
    volume: melodyState.volume,
    loop: melodyState.loop,
    key: melodyState.key,
    timeSignature: melodyState.timeSignature,
  };

  // Convert recording takes to metadata (strip blob URLs)
  const recordings: RecordingMetadata[] = recordingState.takes.map(takeToMetadata);

  // Build the project data
  const projectData: ProjectData = {
    version: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    poem: {
      original: poemState.original,
      versions: poemState.versions,
      currentVersionIndex: poemState.currentVersionIndex,
    },
    analysis: analysisState.analysis,
    melody: {
      data: melodyState.melody,
      abcNotation: melodyState.abcNotation,
    },
    settings,
    recordings,
  };

  console.log('[Project] Export complete:', {
    hasPoem: projectData.poem.original.length > 0,
    versionCount: projectData.poem.versions.length,
    hasAnalysis: projectData.analysis !== null,
    hasMelody: projectData.melody.data !== null,
    recordingCount: projectData.recordings.length,
  });

  return projectData;
}

/**
 * Serializes project data to a JSON string.
 *
 * @param project - Project data to serialize
 * @param pretty - Whether to format with indentation (default: true)
 * @returns JSON string representation
 */
export function serializeProject(project: ProjectData, pretty: boolean = true): string {
  console.log('[Project] Serializing project to JSON...');
  return JSON.stringify(project, null, pretty ? 2 : undefined);
}

/**
 * Downloads the current project as a JSON file.
 *
 * @param filename - Optional filename (without extension)
 */
export function downloadProjectFile(filename?: string): void {
  console.log('[Project] Downloading project file...');

  // Export the project data
  const projectData = exportProject();

  // Serialize to JSON
  const jsonString = serializeProject(projectData);

  // Generate filename if not provided
  const finalFilename = generateFilename(filename, projectData);

  // Create blob and download
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Create temporary download link
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log('[Project] Download triggered:', finalFilename);
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generates a filename for the project export.
 *
 * @param customName - Optional custom filename
 * @param project - Project data for deriving name from content
 * @returns Complete filename with .json extension
 */
function generateFilename(customName: string | undefined, project: ProjectData): string {
  if (customName) {
    // Ensure .json extension
    return customName.endsWith('.json') ? customName : `${customName}.json`;
  }

  // Try to derive name from poem content
  const poemTitle = extractTitleFromPoem(project.poem.original);
  const timestamp = formatTimestamp(new Date(project.exportedAt));

  if (poemTitle) {
    return `ghost-note-${sanitizeFilename(poemTitle)}-${timestamp}.json`;
  }

  return `ghost-note-project-${timestamp}.json`;
}

/**
 * Extracts a potential title from the first line of a poem.
 *
 * @param poem - The original poem text
 * @returns Extracted title or undefined
 */
function extractTitleFromPoem(poem: string): string | undefined {
  if (!poem.trim()) return undefined;

  // Get first non-empty line
  const firstLine = poem
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!firstLine || firstLine.length > 50) return undefined;

  return firstLine;
}

/**
 * Sanitizes a string for use in a filename.
 *
 * @param str - String to sanitize
 * @returns Safe filename string
 */
function sanitizeFilename(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Collapse multiple dashes
    .substring(0, 30) // Limit length
    .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
}

/**
 * Formats a timestamp for use in a filename.
 *
 * @param date - Date to format
 * @returns Formatted string (YYYYMMDD-HHMMSS)
 */
function formatTimestamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}
