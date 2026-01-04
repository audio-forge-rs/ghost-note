/**
 * Common Components
 *
 * Shared components used throughout the Ghost Note application.
 *
 * @module components/Common
 */

// EmptyState components
export { EmptyState } from './EmptyState';
export type { EmptyStateProps, EmptyStateAction } from './EmptyState';

// EmptyState variants for specific views
export {
  NoPoemEmptyState,
  NoAnalysisEmptyState,
  NoMelodyEmptyState,
  NoRecordingsEmptyState,
  NoVersionsEmptyState,
  // Icons (for custom empty states)
  PoemIcon,
  AnalysisIcon,
  MelodyIcon,
  RecordingIcon,
  VersionsIcon,
} from './EmptyStateVariants';

export type {
  NoPoemEmptyStateProps,
  NoAnalysisEmptyStateProps,
  NoMelodyEmptyStateProps,
  NoRecordingsEmptyStateProps,
  NoVersionsEmptyStateProps,
} from './EmptyStateVariants';
