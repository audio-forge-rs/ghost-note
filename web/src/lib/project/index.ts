/**
 * Ghost Note - Project Import/Export
 *
 * Central export point for project serialization functionality.
 *
 * @module lib/project
 */

// Types
export type {
  ProjectData,
  UserSettings,
  RecordingMetadata,
  ValidationResult,
} from './types';

export {
  CURRENT_SCHEMA_VERSION,
  MIN_SUPPORTED_VERSION,
  ProjectImportError,
  takeToMetadata,
  metadataToTake,
} from './types';

// Export functions
export { exportProject, serializeProject, downloadProjectFile } from './export';

// Import functions
export type { ImportOptions } from './import';
export {
  importProject,
  importProjectFromJson,
  importProjectFromFile,
} from './import';

// Validation functions
export { validateProjectData, parseAndValidate } from './validate';
