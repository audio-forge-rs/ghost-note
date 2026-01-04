/**
 * EmptyState Variants
 *
 * Pre-configured empty state components for specific views in Ghost Note.
 * Each variant provides contextual messaging and actions to guide users
 * through the workflow.
 *
 * @module components/Common/EmptyStateVariants
 */

import type { ReactElement } from 'react';
import { EmptyState } from './EmptyState';
import type { EmptyStateProps } from './EmptyState';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[EmptyStateVariants] ${message}`, ...args);
  }
};

// =============================================================================
// SVG Icons
// =============================================================================

/**
 * Icon for poem/text input empty state
 */
const PoemIcon = (): ReactElement => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

/**
 * Icon for analysis empty state
 */
const AnalysisIcon = (): ReactElement => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
    <path d="M11 8v6" />
    <path d="M8 11h6" />
  </svg>
);

/**
 * Icon for melody/music empty state
 */
const MelodyIcon = (): ReactElement => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

/**
 * Icon for recording empty state
 */
const RecordingIcon = (): ReactElement => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
  </svg>
);

/**
 * Icon for versions/history empty state
 */
const VersionsIcon = (): ReactElement => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 8v4l3 3" />
    <circle cx="12" cy="12" r="10" />
  </svg>
);

// =============================================================================
// Variant Props Interfaces
// =============================================================================

/**
 * Props for poem input empty state
 */
export interface NoPoemEmptyStateProps {
  /** Handler for paste action */
  onPaste?: () => void;
  /** Handler for type/compose action */
  onCompose?: () => void;
  /** Optional variant style */
  variant?: EmptyStateProps['variant'];
  /** Additional CSS class */
  className?: string;
}

/**
 * Props for analysis empty state
 */
export interface NoAnalysisEmptyStateProps {
  /** Handler for analyze action */
  onAnalyze?: () => void;
  /** Whether analysis is possible (poem exists) */
  canAnalyze?: boolean;
  /** Optional variant style */
  variant?: EmptyStateProps['variant'];
  /** Additional CSS class */
  className?: string;
}

/**
 * Props for melody empty state
 */
export interface NoMelodyEmptyStateProps {
  /** Handler for generate melody action */
  onGenerate?: () => void;
  /** Whether generation is possible (analysis exists) */
  canGenerate?: boolean;
  /** Optional variant style */
  variant?: EmptyStateProps['variant'];
  /** Additional CSS class */
  className?: string;
}

/**
 * Props for recording empty state
 */
export interface NoRecordingsEmptyStateProps {
  /** Handler for start recording action */
  onStartRecording?: () => void;
  /** Whether recording is possible (melody exists) */
  canRecord?: boolean;
  /** Optional variant style */
  variant?: EmptyStateProps['variant'];
  /** Additional CSS class */
  className?: string;
}

/**
 * Props for versions empty state
 */
export interface NoVersionsEmptyStateProps {
  /** Handler for create version action */
  onCreateVersion?: () => void;
  /** Whether creating version is possible (poem exists) */
  canCreate?: boolean;
  /** Optional variant style */
  variant?: EmptyStateProps['variant'];
  /** Additional CSS class */
  className?: string;
}

// =============================================================================
// Empty State Variants
// =============================================================================

/**
 * Empty state for when no poem has been entered.
 *
 * Displays a prompt to paste or type a poem to begin the workflow.
 *
 * @example
 * ```tsx
 * <NoPoemEmptyState
 *   onPaste={() => pasteFromClipboard()}
 *   onCompose={() => focusTextArea()}
 * />
 * ```
 */
export function NoPoemEmptyState({
  onPaste,
  onCompose,
  variant = 'default',
  className = '',
}: NoPoemEmptyStateProps): ReactElement {
  log('Rendering NoPoemEmptyState');

  const actions = [];

  if (onPaste) {
    actions.push({
      label: 'Paste poem',
      onClick: onPaste,
      primary: true,
      ariaLabel: 'Paste a poem from clipboard',
    });
  }

  if (onCompose) {
    actions.push({
      label: 'Type poem',
      onClick: onCompose,
      primary: !onPaste,
      ariaLabel: 'Start typing a new poem',
    });
  }

  return (
    <EmptyState
      icon={<PoemIcon />}
      title="No poem entered"
      description="Paste a poem from your clipboard or type one directly to begin transforming it into a song."
      actions={actions}
      variant={variant}
      className={className}
      testId="empty-state-no-poem"
    />
  );
}

/**
 * Empty state for when no analysis has been performed.
 *
 * Prompts the user to analyze their poem to understand its structure.
 *
 * @example
 * ```tsx
 * <NoAnalysisEmptyState
 *   onAnalyze={() => runAnalysis()}
 *   canAnalyze={hasPoem}
 * />
 * ```
 */
export function NoAnalysisEmptyState({
  onAnalyze,
  canAnalyze = true,
  variant = 'default',
  className = '',
}: NoAnalysisEmptyStateProps): ReactElement {
  log('Rendering NoAnalysisEmptyState, canAnalyze:', canAnalyze);

  const actions = [];

  if (onAnalyze) {
    actions.push({
      label: 'Analyze poem',
      onClick: onAnalyze,
      primary: true,
      ariaLabel: 'Analyze the poem structure and prosody',
      disabled: !canAnalyze,
    });
  }

  const description = canAnalyze
    ? 'Click analyze to discover the meter, rhyme scheme, and singability of your poem.'
    : 'Enter a poem first, then analyze it to discover its structure and singability.';

  return (
    <EmptyState
      icon={<AnalysisIcon />}
      title="No analysis yet"
      description={description}
      actions={actions}
      variant={variant}
      className={className}
      testId="empty-state-no-analysis"
    />
  );
}

/**
 * Empty state for when no melody has been generated.
 *
 * Prompts the user to generate a melody from their analyzed poem.
 *
 * @example
 * ```tsx
 * <NoMelodyEmptyState
 *   onGenerate={() => generateMelody()}
 *   canGenerate={hasAnalysis}
 * />
 * ```
 */
export function NoMelodyEmptyState({
  onGenerate,
  canGenerate = true,
  variant = 'default',
  className = '',
}: NoMelodyEmptyStateProps): ReactElement {
  log('Rendering NoMelodyEmptyState, canGenerate:', canGenerate);

  const actions = [];

  if (onGenerate) {
    actions.push({
      label: 'Generate melody',
      onClick: onGenerate,
      primary: true,
      ariaLabel: 'Generate a vocal melody for the poem',
      disabled: !canGenerate,
    });
  }

  const description = canGenerate
    ? 'Generate a vocal melody that matches the rhythm and emotion of your lyrics.'
    : 'Analyze your poem first to enable melody generation.';

  return (
    <EmptyState
      icon={<MelodyIcon />}
      title="No melody generated"
      description={description}
      actions={actions}
      variant={variant}
      className={className}
      testId="empty-state-no-melody"
    />
  );
}

/**
 * Empty state for when no recordings have been made.
 *
 * Prompts the user to record their first take.
 *
 * @example
 * ```tsx
 * <NoRecordingsEmptyState
 *   onStartRecording={() => startRecording()}
 *   canRecord={hasMelody}
 * />
 * ```
 */
export function NoRecordingsEmptyState({
  onStartRecording,
  canRecord = true,
  variant = 'default',
  className = '',
}: NoRecordingsEmptyStateProps): ReactElement {
  log('Rendering NoRecordingsEmptyState, canRecord:', canRecord);

  const actions = [];

  if (onStartRecording) {
    actions.push({
      label: 'Start recording',
      onClick: onStartRecording,
      primary: true,
      ariaLabel: 'Start recording your first take',
      disabled: !canRecord,
    });
  }

  const description = canRecord
    ? 'Record yourself singing along with the melody. You can save multiple takes and compare them.'
    : 'Generate a melody first, then record yourself singing along.';

  return (
    <EmptyState
      icon={<RecordingIcon />}
      title="No recordings yet"
      description={description}
      actions={actions}
      variant={variant}
      className={className}
      testId="empty-state-no-recordings"
    />
  );
}

/**
 * Empty state for when no lyric versions exist.
 *
 * Shows a message about the original version and prompts to create variants.
 *
 * @example
 * ```tsx
 * <NoVersionsEmptyState
 *   onCreateVersion={() => createNewVersion()}
 *   canCreate={hasPoem}
 * />
 * ```
 */
export function NoVersionsEmptyState({
  onCreateVersion,
  canCreate = true,
  variant = 'default',
  className = '',
}: NoVersionsEmptyStateProps): ReactElement {
  log('Rendering NoVersionsEmptyState, canCreate:', canCreate);

  const actions = [];

  if (onCreateVersion) {
    actions.push({
      label: 'Create version',
      onClick: onCreateVersion,
      primary: true,
      ariaLabel: 'Create a new lyric version',
      disabled: !canCreate,
    });
  }

  const description = canCreate
    ? 'You\'re viewing the original poem. Create versions to experiment with lyric changes for better singability.'
    : 'Enter a poem first, then create versions to experiment with different lyrics.';

  return (
    <EmptyState
      icon={<VersionsIcon />}
      title="Original version"
      description={description}
      actions={actions}
      variant={variant}
      className={className}
      testId="empty-state-no-versions"
    />
  );
}

// =============================================================================
// Exports
// =============================================================================

export {
  PoemIcon,
  AnalysisIcon,
  MelodyIcon,
  RecordingIcon,
  VersionsIcon,
};
