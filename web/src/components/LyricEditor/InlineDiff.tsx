/**
 * InlineDiff Component
 *
 * Displays a diff between two texts with inline highlighting.
 * Removed text is shown in red with strikethrough, added text is shown in green.
 *
 * @module components/LyricEditor/InlineDiff
 */

import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { computeDiff } from './diffUtils';
import type { InlineDiffProps, DiffChange } from './types';
import './InlineDiff.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[InlineDiff] ${message}`, ...args);
  }
};

/**
 * Renders a single diff change segment
 */
function DiffSegment({
  change,
  index,
}: {
  change: DiffChange;
  index: number;
}): ReactElement | null {
  if (!change.text) {
    return null;
  }

  const baseClass = 'inline-diff__segment';
  const typeClass = `${baseClass}--${change.type}`;
  const className = `${baseClass} ${typeClass}`;

  // Handle newlines by preserving them in rendering
  const segments = change.text.split(/(\n)/);

  return (
    <span className={className} data-testid={`diff-segment-${index}`}>
      {segments.map((segment, segIndex) =>
        segment === '\n' ? (
          <br key={`${index}-${segIndex}`} />
        ) : (
          <span key={`${index}-${segIndex}`}>{segment}</span>
        )
      )}
    </span>
  );
}

/**
 * InlineDiff displays text changes with inline highlighting.
 *
 * Features:
 * - Red text with strikethrough for removals
 * - Green text for additions
 * - Unchanged text shown normally
 * - Optional line numbers
 * - Accessible with screen reader support
 *
 * @example
 * ```tsx
 * <InlineDiff
 *   originalText="The quick brown fox"
 *   modifiedText="The slow brown fox jumps"
 * />
 * ```
 */
export function InlineDiff({
  originalText,
  modifiedText,
  showLineNumbers = false,
  className = '',
  testId = 'inline-diff',
}: InlineDiffProps): ReactElement {
  log('Rendering InlineDiff', {
    originalLength: originalText.length,
    modifiedLength: modifiedText.length,
    showLineNumbers,
  });

  // Compute the diff
  const diffResult = useMemo(() => {
    return computeDiff(originalText, modifiedText);
  }, [originalText, modifiedText]);

  // Generate line numbers if needed
  const lineCount = useMemo(() => {
    if (!showLineNumbers) return 0;
    // Count lines in the modified text
    return modifiedText.split('\n').length;
  }, [modifiedText, showLineNumbers]);

  const containerClass = [
    'inline-diff',
    showLineNumbers ? 'inline-diff--with-line-numbers' : '',
    diffResult.isIdentical ? 'inline-diff--identical' : 'inline-diff--changed',
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  // Announce changes for screen readers
  const ariaLabel = diffResult.isIdentical
    ? 'No changes detected'
    : `${diffResult.addCount} additions and ${diffResult.removeCount} removals`;

  return (
    <div
      className={containerClass}
      data-testid={testId}
      role="region"
      aria-label={ariaLabel}
    >
      {showLineNumbers && (
        <div className="inline-diff__line-numbers" aria-hidden="true">
          {Array.from({ length: lineCount }, (_, i) => (
            <span key={i + 1} className="inline-diff__line-number">
              {i + 1}
            </span>
          ))}
        </div>
      )}

      <div className="inline-diff__content">
        {diffResult.isIdentical ? (
          <span className="inline-diff__segment inline-diff__segment--equal">
            {originalText || <em className="inline-diff__empty">Empty text</em>}
          </span>
        ) : (
          diffResult.changes.map((change, index) => (
            <DiffSegment key={index} change={change} index={index} />
          ))
        )}
      </div>

      {!diffResult.isIdentical && (
        <div className="inline-diff__summary" data-testid={`${testId}-summary`}>
          <span className="inline-diff__summary-item inline-diff__summary-item--add">
            +{diffResult.addCount}
          </span>
          <span className="inline-diff__summary-item inline-diff__summary-item--remove">
            -{diffResult.removeCount}
          </span>
        </div>
      )}
    </div>
  );
}

export default InlineDiff;
