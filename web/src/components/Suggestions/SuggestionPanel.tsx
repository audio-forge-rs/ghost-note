/**
 * SuggestionPanel Component
 *
 * Container component that displays all Claude suggestions with
 * loading states, empty states, and batch operations.
 *
 * @module components/Suggestions/SuggestionPanel
 */

import { type ReactElement, useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  useSuggestionStore,
  selectIsLoading,
  selectHasError,
  selectHasSuggestions,
  type SuggestionWithStatus,
} from '../../stores/useSuggestionStore';
import { usePoemStore } from '../../stores/usePoemStore';
import { EmptyState } from '../Common/EmptyState';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import { ErrorMessage } from '../Common/ErrorMessage';
import { SuggestionItem } from './SuggestionItem';
import { ApplyAllButton } from './ApplyAllButton';
import './SuggestionPanel.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[SuggestionPanel] ${message}`, ...args);
  }
};

/**
 * Props for the SuggestionPanel component
 */
export interface SuggestionPanelProps {
  /** Handler called when "Get Suggestions" is clicked */
  onGetSuggestions?: () => void;
  /** Handler called when accepted suggestions should be applied to lyrics */
  onApplyToLyrics?: (acceptedSuggestions: SuggestionWithStatus[]) => void;
  /** Whether suggestion fetching is enabled */
  canGetSuggestions?: boolean;
  /** Optional title override */
  title?: string;
  /** Whether to show the header */
  showHeader?: boolean;
  /** Whether to show compact suggestion items */
  compact?: boolean;
  /** Additional CSS class name */
  className?: string;
  /** Data test ID for testing */
  testId?: string;
}

/**
 * Icon for the suggestions panel header
 */
const SuggestionsIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

/**
 * Empty state icon for no suggestions
 */
const EmptyStateIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" opacity="0.2" />
    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
  </svg>
);

/**
 * SuggestionPanel component is the main container for displaying and interacting
 * with Claude-generated lyric suggestions.
 *
 * Features:
 * - Shows loading state while fetching suggestions
 * - Displays error state with retry option
 * - Shows empty state when no suggestions available
 * - Lists all suggestions with accept/reject actions
 * - Batch operations (accept all, reject all, reset all)
 * - Summary of processed suggestions
 * - Button to apply accepted changes to lyrics
 *
 * @example
 * ```tsx
 * <SuggestionPanel
 *   onGetSuggestions={() => fetchSuggestions()}
 *   onApplyToLyrics={(accepted) => applyChanges(accepted)}
 *   canGetSuggestions={hasAnalysis}
 * />
 * ```
 */
export function SuggestionPanel({
  onGetSuggestions,
  onApplyToLyrics,
  canGetSuggestions = true,
  title = 'Suggestions',
  showHeader = true,
  compact = false,
  className = '',
  testId = 'suggestion-panel',
}: SuggestionPanelProps): ReactElement {
  // Store state - use useShallow for arrays to avoid infinite loops
  const rawSuggestions = useSuggestionStore(useShallow((s) => s.suggestions));
  const hasSuggestions = useSuggestionStore(selectHasSuggestions);
  const isLoading = useSuggestionStore(selectIsLoading);
  const hasError = useSuggestionStore(selectHasError);
  const error = useSuggestionStore((s) => s.error);
  const loadingState = useSuggestionStore((s) => s.loadingState);

  // Store actions
  const acceptSuggestion = useSuggestionStore((s) => s.acceptSuggestion);
  const rejectSuggestion = useSuggestionStore((s) => s.rejectSuggestion);
  const resetSuggestion = useSuggestionStore((s) => s.resetSuggestion);
  const acceptAll = useSuggestionStore((s) => s.acceptAll);
  const rejectAll = useSuggestionStore((s) => s.rejectAll);
  const resetAll = useSuggestionStore((s) => s.resetAll);
  const clear = useSuggestionStore((s) => s.clear);

  // Poem store for checking if lyrics exist
  const lyrics = usePoemStore((s) =>
    s.currentVersionIndex >= 0 && s.versions[s.currentVersionIndex]
      ? s.versions[s.currentVersionIndex].lyrics
      : s.original
  );
  const hasLyrics = lyrics.trim().length > 0;

  // Memoized sorted suggestions
  const suggestions = useMemo(
    () =>
      [...rawSuggestions].sort((a, b) => {
        if (a.lineNumber !== b.lineNumber) {
          return a.lineNumber - b.lineNumber;
        }
        return a.position - b.position;
      }),
    [rawSuggestions]
  );

  // Memoized counts
  const pendingCount = useMemo(
    () => rawSuggestions.filter((s) => s.status === 'pending').length,
    [rawSuggestions]
  );
  const acceptedCount = useMemo(
    () => rawSuggestions.filter((s) => s.status === 'accepted').length,
    [rawSuggestions]
  );
  const rejectedCount = useMemo(
    () => rawSuggestions.filter((s) => s.status === 'rejected').length,
    [rawSuggestions]
  );

  // Memoized accepted suggestions for apply action
  const acceptedSuggestions = useMemo(
    () => suggestions.filter((s) => s.status === 'accepted'),
    [suggestions]
  );

  // Handlers
  const handleGetSuggestions = useCallback(() => {
    log('Get suggestions clicked');
    onGetSuggestions?.();
  }, [onGetSuggestions]);

  const handleApplyToLyrics = useCallback(() => {
    if (acceptedSuggestions.length > 0 && onApplyToLyrics) {
      log('Applying', acceptedSuggestions.length, 'accepted suggestions to lyrics');
      onApplyToLyrics(acceptedSuggestions);
    }
  }, [acceptedSuggestions, onApplyToLyrics]);

  const handleAccept = useCallback(
    (id: string) => {
      acceptSuggestion(id);
    },
    [acceptSuggestion]
  );

  const handleReject = useCallback(
    (id: string) => {
      rejectSuggestion(id);
    },
    [rejectSuggestion]
  );

  const handleReset = useCallback(
    (id: string) => {
      resetSuggestion(id);
    },
    [resetSuggestion]
  );

  const handleRetry = useCallback(() => {
    log('Retry clicked');
    clear();
    onGetSuggestions?.();
  }, [clear, onGetSuggestions]);

  log('Rendering panel:', {
    suggestionCount: suggestions.length,
    loadingState,
    hasError,
    pendingCount,
    acceptedCount,
    rejectedCount,
  });

  const containerClass = [
    'suggestion-panel',
    isLoading ? 'suggestion-panel--loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  // Determine if we can show the apply button
  const canApply = acceptedSuggestions.length > 0 && onApplyToLyrics;

  // Determine if we should show batch actions
  const showBatchActions = hasSuggestions && !isLoading;

  return (
    <div className={containerClass} data-testid={testId}>
      {/* Header */}
      {showHeader && (
        <header className="suggestion-panel__header">
          <div className="suggestion-panel__title-row">
            <span className="suggestion-panel__icon">
              <SuggestionsIcon />
            </span>
            <h2 className="suggestion-panel__title">{title}</h2>
            {hasSuggestions && (
              <span className="suggestion-panel__badge">{suggestions.length}</span>
            )}
          </div>

          {onGetSuggestions && !hasSuggestions && !isLoading && (
            <button
              type="button"
              className="suggestion-panel__get-button"
              onClick={handleGetSuggestions}
              disabled={!canGetSuggestions || !hasLyrics}
              aria-label="Get lyric suggestions from Claude"
              title={
                !hasLyrics
                  ? 'Enter lyrics first'
                  : !canGetSuggestions
                    ? 'Analysis required before getting suggestions'
                    : 'Get lyric suggestions'
              }
            >
              Get Suggestions
            </button>
          )}
        </header>
      )}

      {/* Main content area */}
      <div className="suggestion-panel__content">
        {/* Loading state */}
        {isLoading && (
          <div className="suggestion-panel__loading" data-testid="suggestion-panel-loading">
            <LoadingSpinner size="large" label="Getting suggestions..." showLabel />
            <p className="suggestion-panel__loading-text">
              Claude is analyzing your lyrics and generating suggestions...
            </p>
          </div>
        )}

        {/* Error state */}
        {hasError && !isLoading && (
          <div className="suggestion-panel__error" data-testid="suggestion-panel-error">
            <ErrorMessage
              title="Error"
              message={error ?? 'Failed to get suggestions'}
              variant="error"
              onRetry={handleRetry}
            />
          </div>
        )}

        {/* Empty state - no lyrics */}
        {!hasSuggestions && !isLoading && !hasError && !hasLyrics && (
          <EmptyState
            icon={<SuggestionsIcon />}
            title="No lyrics yet"
            description="Enter or paste a poem to get started, then get AI-powered suggestions for singability improvements."
            variant="compact"
            testId="suggestion-panel-empty-no-lyrics"
          />
        )}

        {/* Empty state - has lyrics, no suggestions yet */}
        {!hasSuggestions && !isLoading && !hasError && hasLyrics && loadingState === 'idle' && (
          <EmptyState
            icon={<SuggestionsIcon />}
            title="No suggestions yet"
            description="Click 'Get Suggestions' to receive AI-powered recommendations for improving your lyrics' singability."
            actions={
              onGetSuggestions
                ? [
                    {
                      label: 'Get Suggestions',
                      onClick: handleGetSuggestions,
                      primary: true,
                      disabled: !canGetSuggestions,
                    },
                  ]
                : undefined
            }
            variant="compact"
            testId="suggestion-panel-empty-idle"
          />
        )}

        {/* Empty state - had suggestions but all processed */}
        {!hasSuggestions && !isLoading && !hasError && loadingState === 'success' && (
          <EmptyState
            icon={<EmptyStateIcon />}
            title="All suggestions processed"
            description="You've reviewed all suggestions. Get new suggestions or apply your accepted changes."
            actions={
              onGetSuggestions
                ? [
                    {
                      label: 'Get New Suggestions',
                      onClick: handleGetSuggestions,
                      primary: true,
                    },
                  ]
                : undefined
            }
            variant="compact"
            testId="suggestion-panel-empty-processed"
          />
        )}

        {/* Suggestions list */}
        {hasSuggestions && !isLoading && (
          <>
            {/* Batch action buttons */}
            {showBatchActions && (
              <div className="suggestion-panel__batch-actions">
                <ApplyAllButton
                  operation="accept"
                  count={pendingCount}
                  onClick={acceptAll}
                  size="small"
                />
                <ApplyAllButton
                  operation="reject"
                  count={pendingCount}
                  onClick={rejectAll}
                  size="small"
                />
                {(acceptedCount > 0 || rejectedCount > 0) && (
                  <ApplyAllButton
                    operation="reset"
                    count={acceptedCount + rejectedCount}
                    onClick={resetAll}
                    size="small"
                  />
                )}
              </div>
            )}

            {/* Summary stats */}
            <div className="suggestion-panel__summary" aria-live="polite">
              <span className="suggestion-panel__stat suggestion-panel__stat--pending">
                <span className="suggestion-panel__stat-count">{pendingCount}</span>
                <span className="suggestion-panel__stat-label">Pending</span>
              </span>
              <span className="suggestion-panel__stat suggestion-panel__stat--accepted">
                <span className="suggestion-panel__stat-count">{acceptedCount}</span>
                <span className="suggestion-panel__stat-label">Accepted</span>
              </span>
              <span className="suggestion-panel__stat suggestion-panel__stat--rejected">
                <span className="suggestion-panel__stat-count">{rejectedCount}</span>
                <span className="suggestion-panel__stat-label">Rejected</span>
              </span>
            </div>

            {/* Suggestion items */}
            <div className="suggestion-panel__list" role="list">
              {suggestions.map((suggestion) => (
                <SuggestionItem
                  key={suggestion.id}
                  suggestion={suggestion}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onReset={handleReset}
                  compact={compact}
                  testId={`suggestion-item-${suggestion.id}`}
                />
              ))}
            </div>

            {/* Apply changes button */}
            {canApply && (
              <div className="suggestion-panel__apply-section">
                <button
                  type="button"
                  className="suggestion-panel__apply-button"
                  onClick={handleApplyToLyrics}
                  aria-label={`Apply ${acceptedSuggestions.length} accepted suggestion${acceptedSuggestions.length !== 1 ? 's' : ''} to lyrics`}
                >
                  Apply {acceptedSuggestions.length} Change
                  {acceptedSuggestions.length !== 1 ? 's' : ''} to Lyrics
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default SuggestionPanel;
