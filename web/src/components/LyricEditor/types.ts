/**
 * LyricEditor Component Types
 *
 * Type definitions for the lyric editing components.
 *
 * @module components/LyricEditor/types
 */

import type { LyricVersion } from '@/stores/types';

// =============================================================================
// Diff Types
// =============================================================================

/**
 * Type of change in a diff
 * -1 = deletion, 0 = equal, 1 = insertion
 */
export type DiffOperation = -1 | 0 | 1;

/**
 * A single diff change from diff-match-patch
 */
export interface DiffChange {
  /** Type of change: 'add', 'remove', or 'equal' */
  type: 'add' | 'remove' | 'equal';
  /** The text content */
  text: string;
  /** Position in the original text */
  position: number;
}

/**
 * Result of computing a diff between two texts
 */
export interface DiffResult {
  /** Array of changes */
  changes: DiffChange[];
  /** Number of additions */
  addCount: number;
  /** Number of deletions */
  removeCount: number;
  /** Whether the texts are identical */
  isIdentical: boolean;
}

// =============================================================================
// Suggestion Types
// =============================================================================

/**
 * Status of a suggestion
 */
export type SuggestionStatus = 'pending' | 'accepted' | 'rejected';

/**
 * A lyric change suggestion
 */
export interface LyricSuggestion {
  /** Unique identifier */
  id: string;
  /** Original text */
  originalText: string;
  /** Suggested replacement text */
  suggestedText: string;
  /** Reason for the suggestion */
  reason: string;
  /** Category of suggestion */
  category: 'singability' | 'meter' | 'rhyme' | 'clarity' | 'other';
  /** Current status */
  status: SuggestionStatus;
  /** Line number (1-indexed) */
  lineNumber: number;
  /** Start position in the line */
  startPos: number;
  /** End position in the line */
  endPos: number;
}

// =============================================================================
// View Mode Types
// =============================================================================

/**
 * Display mode for diff view
 */
export type DiffViewMode = 'side-by-side' | 'inline';

/**
 * Editor mode
 */
export type EditorMode = 'view' | 'edit' | 'compare';

// =============================================================================
// Component Props
// =============================================================================

/**
 * Props for DiffView component
 */
export interface DiffViewProps {
  /** Original text */
  originalText: string;
  /** Modified text */
  modifiedText: string;
  /** Optional CSS class name */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Props for InlineDiff component
 */
export interface InlineDiffProps {
  /** Original text */
  originalText: string;
  /** Modified text */
  modifiedText: string;
  /** Whether to show line numbers */
  showLineNumbers?: boolean;
  /** Optional CSS class name */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Props for SuggestionCard component
 */
export interface SuggestionCardProps {
  /** The suggestion to display */
  suggestion: LyricSuggestion;
  /** Callback when suggestion is accepted */
  onAccept: (id: string) => void;
  /** Callback when suggestion is rejected */
  onReject: (id: string) => void;
  /** Whether the card is expanded */
  expanded?: boolean;
  /** Callback when expansion state changes */
  onToggleExpand?: (id: string) => void;
  /** Optional CSS class name */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Props for VersionList component
 */
export interface VersionListProps {
  /** List of versions */
  versions: LyricVersion[];
  /** Currently selected version index (-1 for original) */
  currentVersionIndex: number;
  /** Callback when a version is selected */
  onSelectVersion: (index: number) => void;
  /** Callback when a version is deleted */
  onDeleteVersion?: (id: string) => void;
  /** The original text (for version -1) */
  originalText: string;
  /** Whether the list is compact */
  compact?: boolean;
  /** Optional CSS class name */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Props for LyricEditor component
 */
export interface LyricEditorProps {
  /** Optional CSS class name */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Re-export LyricVersion for convenience
// =============================================================================

export type { LyricVersion };
