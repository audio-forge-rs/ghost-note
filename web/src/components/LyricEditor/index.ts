/**
 * LyricEditor Components
 *
 * Exports all lyric editing components for the Ghost Note application.
 *
 * @module components/LyricEditor
 */

// Main component
export { LyricEditor } from './LyricEditor';

// Sub-components
export { DiffView } from './DiffView';
export { InlineDiff } from './InlineDiff';
export { SuggestionCard } from './SuggestionCard';
export { VersionList } from './VersionList';

// Types (all props and utility types from types.ts)
export type {
  DiffChange,
  DiffResult,
  DiffViewMode,
  DiffViewProps,
  EditorMode,
  InlineDiffProps,
  LyricEditorProps,
  LyricSuggestion,
  LyricVersion,
  SuggestionCardProps,
  SuggestionStatus,
  VersionListProps,
} from './types';

// Utilities
export {
  computeDiff,
  computeLineDiff,
  splitIntoLines,
  getDiffSummary,
  applyChanges,
  countWords,
  countLines,
  createPreview,
} from './diffUtils';

// Default export
export { LyricEditor as default } from './LyricEditor';
