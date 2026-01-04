/**
 * SuggestionCard Component
 *
 * Displays a lyric change suggestion with accept/reject buttons.
 * Shows original vs. suggested text with inline diff highlighting.
 *
 * @module components/LyricEditor/SuggestionCard
 */

import type { ReactElement } from 'react';
import { useMemo, useCallback } from 'react';
import { InlineDiff } from './InlineDiff';
import type { SuggestionCardProps, LyricSuggestion } from './types';
import './SuggestionCard.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[SuggestionCard] ${message}`, ...args);
  }
};

/**
 * Maps category to display label
 */
const CATEGORY_LABELS: Record<LyricSuggestion['category'], string> = {
  singability: 'Singability',
  meter: 'Meter',
  rhyme: 'Rhyme',
  clarity: 'Clarity',
  other: 'Other',
};

/**
 * Maps category to icon emoji (simple text icons for now)
 */
const CATEGORY_ICONS: Record<LyricSuggestion['category'], string> = {
  singability: 'S',
  meter: 'M',
  rhyme: 'R',
  clarity: 'C',
  other: '?',
};

/**
 * SuggestionCard displays a single lyric change suggestion.
 *
 * Features:
 * - Shows original and suggested text
 * - Inline diff highlighting
 * - Accept/reject buttons
 * - Category badge
 * - Expandable reason section
 * - Line number reference
 * - Accessible with keyboard navigation
 *
 * @example
 * ```tsx
 * <SuggestionCard
 *   suggestion={{
 *     id: '1',
 *     originalText: 'running through the night',
 *     suggestedText: 'running through the dark',
 *     reason: 'Better rhyme with "park"',
 *     category: 'rhyme',
 *     status: 'pending',
 *     lineNumber: 3,
 *     startPos: 0,
 *     endPos: 22,
 *   }}
 *   onAccept={handleAccept}
 *   onReject={handleReject}
 * />
 * ```
 */
export function SuggestionCard({
  suggestion,
  onAccept,
  onReject,
  expanded = false,
  onToggleExpand,
  className = '',
  testId = 'suggestion-card',
}: SuggestionCardProps): ReactElement {
  log('Rendering SuggestionCard', {
    id: suggestion.id,
    category: suggestion.category,
    status: suggestion.status,
    expanded,
  });

  // Handlers
  const handleAccept = useCallback(() => {
    log('Accepting suggestion:', suggestion.id);
    onAccept(suggestion.id);
  }, [onAccept, suggestion.id]);

  const handleReject = useCallback(() => {
    log('Rejecting suggestion:', suggestion.id);
    onReject(suggestion.id);
  }, [onReject, suggestion.id]);

  const handleToggle = useCallback(() => {
    if (onToggleExpand) {
      log('Toggling expansion:', suggestion.id);
      onToggleExpand(suggestion.id);
    }
  }, [onToggleExpand, suggestion.id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  // Status classes
  const statusClass = useMemo(() => {
    switch (suggestion.status) {
      case 'accepted':
        return 'suggestion-card--accepted';
      case 'rejected':
        return 'suggestion-card--rejected';
      default:
        return 'suggestion-card--pending';
    }
  }, [suggestion.status]);

  const containerClass = [
    'suggestion-card',
    statusClass,
    expanded ? 'suggestion-card--expanded' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  const isPending = suggestion.status === 'pending';
  const ariaLabel = `Suggestion for line ${suggestion.lineNumber}: Replace "${suggestion.originalText}" with "${suggestion.suggestedText}". Status: ${suggestion.status}`;

  return (
    <div
      className={containerClass}
      data-testid={testId}
      role="article"
      aria-label={ariaLabel}
    >
      {/* Header */}
      <div
        className="suggestion-card__header"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role={onToggleExpand ? 'button' : undefined}
        tabIndex={onToggleExpand ? 0 : undefined}
        aria-expanded={onToggleExpand ? expanded : undefined}
      >
        <div className="suggestion-card__header-left">
          {/* Category badge */}
          <span
            className={`suggestion-card__category suggestion-card__category--${suggestion.category}`}
            title={CATEGORY_LABELS[suggestion.category]}
          >
            {CATEGORY_ICONS[suggestion.category]}
          </span>

          {/* Line reference */}
          <span className="suggestion-card__line-ref">Line {suggestion.lineNumber}</span>

          {/* Status indicator */}
          {!isPending && (
            <span className={`suggestion-card__status suggestion-card__status--${suggestion.status}`}>
              {suggestion.status === 'accepted' ? 'Accepted' : 'Rejected'}
            </span>
          )}
        </div>

        {/* Expand indicator */}
        {onToggleExpand && (
          <span className="suggestion-card__expand-icon" aria-hidden="true">
            {expanded ? '−' : '+'}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="suggestion-card__content">
        {/* Diff preview */}
        <div className="suggestion-card__diff">
          <InlineDiff
            originalText={suggestion.originalText}
            modifiedText={suggestion.suggestedText}
            testId={`${testId}-diff`}
          />
        </div>

        {/* Reason (shown when expanded or always if no toggle) */}
        {(expanded || !onToggleExpand) && (
          <div className="suggestion-card__reason" data-testid={`${testId}-reason`}>
            <span className="suggestion-card__reason-label">Reason:</span>
            <span className="suggestion-card__reason-text">{suggestion.reason}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {isPending && (
        <div className="suggestion-card__actions">
          <button
            type="button"
            className="suggestion-card__action suggestion-card__action--accept"
            onClick={handleAccept}
            aria-label={`Accept suggestion: Replace "${suggestion.originalText}" with "${suggestion.suggestedText}"`}
            data-testid={`${testId}-accept`}
          >
            Accept
          </button>
          <button
            type="button"
            className="suggestion-card__action suggestion-card__action--reject"
            onClick={handleReject}
            aria-label={`Reject suggestion for line ${suggestion.lineNumber}`}
            data-testid={`${testId}-reject`}
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

export default SuggestionCard;
