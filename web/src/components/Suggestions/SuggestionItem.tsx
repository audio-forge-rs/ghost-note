/**
 * SuggestionItem Component
 *
 * Displays an individual lyric suggestion card with original/suggested text,
 * accept/reject buttons, and meaning preservation indicator.
 *
 * @module components/Suggestions/SuggestionItem
 */

import type { ReactElement } from 'react';
import type { SuggestionWithStatus, SuggestionStatus } from '../../stores/useSuggestionStore';
import { MeaningPreservationBadge } from './MeaningPreservationBadge';
import './SuggestionItem.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[SuggestionItem] ${message}`, ...args);
  }
};

/**
 * Props for the SuggestionItem component
 */
export interface SuggestionItemProps {
  /** The suggestion to display */
  suggestion: SuggestionWithStatus;
  /** Handler called when suggestion is accepted */
  onAccept: (id: string) => void;
  /** Handler called when suggestion is rejected */
  onReject: (id: string) => void;
  /** Handler called when suggestion status is reset */
  onReset?: (id: string) => void;
  /** Whether to show the line number */
  showLineNumber?: boolean;
  /** Whether the item is compact */
  compact?: boolean;
  /** Additional CSS class name */
  className?: string;
  /** Data test ID for testing */
  testId?: string;
}

/**
 * Icons for accept/reject actions
 */
const CheckIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const UndoIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
  </svg>
);

/**
 * Get the status label for screen readers
 */
function getStatusLabel(status: SuggestionStatus): string {
  switch (status) {
    case 'accepted':
      return 'Accepted';
    case 'rejected':
      return 'Rejected';
    case 'pending':
    default:
      return 'Pending review';
  }
}

/**
 * SuggestionItem component displays a single suggestion with accept/reject actions.
 *
 * Features:
 * - Shows original word and suggested replacement
 * - Displays meaning preservation level
 * - Accept and reject buttons with visual feedback
 * - Shows explanation for the suggestion
 * - Accessible with keyboard navigation and screen readers
 *
 * @example
 * ```tsx
 * <SuggestionItem
 *   suggestion={suggestion}
 *   onAccept={(id) => acceptSuggestion(id)}
 *   onReject={(id) => rejectSuggestion(id)}
 *   showLineNumber
 * />
 * ```
 */
export function SuggestionItem({
  suggestion,
  onAccept,
  onReject,
  onReset,
  showLineNumber = true,
  compact = false,
  className = '',
  testId = 'suggestion-item',
}: SuggestionItemProps): ReactElement {
  const {
    id,
    originalWord,
    suggestedWord,
    lineNumber,
    reason,
    preservesMeaning,
    status,
  } = suggestion;

  log('Rendering suggestion item:', {
    id,
    originalWord,
    suggestedWord,
    status,
    lineNumber,
  });

  const handleAccept = (): void => {
    log('Accepting suggestion:', id);
    onAccept(id);
  };

  const handleReject = (): void => {
    log('Rejecting suggestion:', id);
    onReject(id);
  };

  const handleReset = (): void => {
    log('Resetting suggestion:', id);
    onReset?.(id);
  };

  const containerClass = [
    'suggestion-item',
    `suggestion-item--${status}`,
    compact ? 'suggestion-item--compact' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  const isProcessed = status !== 'pending';

  return (
    <div
      className={containerClass}
      data-testid={testId}
      data-suggestion-id={id}
      role="article"
      aria-label={`Suggestion: Replace "${originalWord}" with "${suggestedWord}". Status: ${getStatusLabel(status)}`}
    >
      {/* Header with line number and preservation badge */}
      <div className="suggestion-item__header">
        {showLineNumber && (
          <span className="suggestion-item__line-number" aria-label={`Line ${lineNumber}`}>
            Line {lineNumber}
          </span>
        )}
        <MeaningPreservationBadge
          preservation={preservesMeaning}
          showLabel={!compact}
          size={compact ? 'small' : 'medium'}
        />
      </div>

      {/* Word comparison section */}
      <div className="suggestion-item__comparison">
        <div className="suggestion-item__original">
          <span className="suggestion-item__label">Original</span>
          <span className="suggestion-item__word suggestion-item__word--original">
            {originalWord}
          </span>
        </div>

        <span className="suggestion-item__arrow" aria-hidden="true">
          →
        </span>

        <div className="suggestion-item__suggested">
          <span className="suggestion-item__label">Suggested</span>
          <span className="suggestion-item__word suggestion-item__word--suggested">
            {suggestedWord}
          </span>
        </div>
      </div>

      {/* Reason/explanation */}
      {reason && !compact && (
        <p className="suggestion-item__reason">{reason}</p>
      )}

      {/* Action buttons */}
      <div className="suggestion-item__actions">
        {isProcessed && onReset ? (
          <button
            type="button"
            className="suggestion-item__action suggestion-item__action--reset"
            onClick={handleReset}
            aria-label="Undo and review again"
            title="Undo and review again"
          >
            <span className="suggestion-item__action-icon">
              <UndoIcon />
            </span>
            <span className="suggestion-item__action-text">Undo</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              className="suggestion-item__action suggestion-item__action--accept"
              onClick={handleAccept}
              disabled={isProcessed}
              aria-label={`Accept suggestion: Replace "${originalWord}" with "${suggestedWord}"`}
              title="Accept this suggestion"
            >
              <span className="suggestion-item__action-icon">
                <CheckIcon />
              </span>
              <span className="suggestion-item__action-text">Accept</span>
            </button>

            <button
              type="button"
              className="suggestion-item__action suggestion-item__action--reject"
              onClick={handleReject}
              disabled={isProcessed}
              aria-label={`Reject suggestion: Keep "${originalWord}"`}
              title="Reject this suggestion"
            >
              <span className="suggestion-item__action-icon">
                <XIcon />
              </span>
              <span className="suggestion-item__action-text">Reject</span>
            </button>
          </>
        )}
      </div>

      {/* Status indicator overlay */}
      {isProcessed && (
        <div
          className="suggestion-item__status-overlay"
          aria-hidden="true"
        >
          <span className="suggestion-item__status-text">
            {status === 'accepted' ? 'Accepted' : 'Rejected'}
          </span>
        </div>
      )}
    </div>
  );
}

export default SuggestionItem;
