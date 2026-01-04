/**
 * DiffView Component
 *
 * Displays a side-by-side comparison of original and modified text.
 * Changes are highlighted in red (removed) and green (added).
 *
 * @module components/LyricEditor/DiffView
 */

import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { computeLineDiff, splitIntoLines } from './diffUtils';
import type { DiffViewProps, DiffChange } from './types';
import './DiffView.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[DiffView] ${message}`, ...args);
  }
};

/**
 * Pair of lines for side-by-side display
 */
interface LinePair {
  lineNumber: number;
  original: {
    content: string;
    type: 'equal' | 'remove' | 'empty';
  };
  modified: {
    content: string;
    type: 'equal' | 'add' | 'empty';
  };
}

/**
 * Processes diff changes into line pairs for side-by-side display
 */
function processChangesIntoLinePairs(changes: DiffChange[]): LinePair[] {
  const pairs: LinePair[] = [];
  let lineNumber = 0;

  // Track pending removals and additions
  let pendingRemovals: string[] = [];
  let pendingAdditions: string[] = [];

  const flushPending = (): void => {
    const maxLength = Math.max(pendingRemovals.length, pendingAdditions.length);

    for (let i = 0; i < maxLength; i++) {
      lineNumber++;
      pairs.push({
        lineNumber,
        original: {
          content: pendingRemovals[i] ?? '',
          type: pendingRemovals[i] !== undefined ? 'remove' : 'empty',
        },
        modified: {
          content: pendingAdditions[i] ?? '',
          type: pendingAdditions[i] !== undefined ? 'add' : 'empty',
        },
      });
    }

    pendingRemovals = [];
    pendingAdditions = [];
  };

  for (const change of changes) {
    const lines = splitIntoLines(change.text);

    for (const line of lines) {
      // Remove trailing newline for display
      const content = line.replace(/\n$/, '');

      switch (change.type) {
        case 'equal':
          // Flush any pending changes first
          flushPending();
          lineNumber++;
          pairs.push({
            lineNumber,
            original: { content, type: 'equal' },
            modified: { content, type: 'equal' },
          });
          break;

        case 'remove':
          pendingRemovals.push(content);
          break;

        case 'add':
          pendingAdditions.push(content);
          break;
      }
    }
  }

  // Flush any remaining pending changes
  flushPending();

  return pairs;
}

/**
 * Renders a single side of a line pair
 */
function LineSide({
  content,
  type,
  side,
  lineNumber,
}: {
  content: string;
  type: 'equal' | 'add' | 'remove' | 'empty';
  side: 'original' | 'modified';
  lineNumber: number;
}): ReactElement {
  const baseClass = 'diff-view__line-content';
  const typeClass = `${baseClass}--${type}`;
  const className = `${baseClass} ${typeClass}`;

  return (
    <div
      className={className}
      data-testid={`diff-line-${side}-${lineNumber}`}
    >
      {type === 'empty' ? (
        <span className="diff-view__empty-line" aria-hidden="true">
          &nbsp;
        </span>
      ) : (
        content || <span className="diff-view__empty-text">&nbsp;</span>
      )}
    </div>
  );
}

/**
 * DiffView displays a side-by-side comparison of two texts.
 *
 * Features:
 * - Side-by-side layout with original on left, modified on right
 * - Line numbers for both sides
 * - Red highlighting for removed lines
 * - Green highlighting for added lines
 * - Empty placeholders to align matching lines
 * - Accessible with screen reader support
 *
 * @example
 * ```tsx
 * <DiffView
 *   originalText="Line 1\nLine 2"
 *   modifiedText="Line 1\nLine 2 changed"
 * />
 * ```
 */
export function DiffView({
  originalText,
  modifiedText,
  className = '',
  testId = 'diff-view',
}: DiffViewProps): ReactElement {
  log('Rendering DiffView', {
    originalLength: originalText.length,
    modifiedLength: modifiedText.length,
  });

  // Compute line-by-line diff
  const diffResult = useMemo(() => {
    return computeLineDiff(originalText, modifiedText);
  }, [originalText, modifiedText]);

  // Process into line pairs for side-by-side display
  const linePairs = useMemo(() => {
    return processChangesIntoLinePairs(diffResult.changes);
  }, [diffResult.changes]);

  const containerClass = [
    'diff-view',
    diffResult.isIdentical ? 'diff-view--identical' : 'diff-view--changed',
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  // Announce changes for screen readers
  const ariaLabel = diffResult.isIdentical
    ? 'No changes between versions'
    : `Side-by-side comparison: ${diffResult.addCount} additions and ${diffResult.removeCount} removals`;

  return (
    <div
      className={containerClass}
      data-testid={testId}
      role="region"
      aria-label={ariaLabel}
    >
      {/* Headers */}
      <div className="diff-view__headers">
        <div className="diff-view__header diff-view__header--original">
          <span className="diff-view__header-label">Original</span>
        </div>
        <div className="diff-view__header diff-view__header--modified">
          <span className="diff-view__header-label">Modified</span>
        </div>
      </div>

      {/* Line pairs */}
      <div className="diff-view__body">
        {linePairs.length === 0 ? (
          <div className="diff-view__empty" data-testid={`${testId}-empty`}>
            <span className="diff-view__empty-message">No content to compare</span>
          </div>
        ) : (
          linePairs.map((pair) => (
            <div
              key={pair.lineNumber}
              className="diff-view__row"
              data-testid={`diff-row-${pair.lineNumber}`}
            >
              {/* Original side */}
              <div className="diff-view__side diff-view__side--original">
                <span className="diff-view__line-number" aria-hidden="true">
                  {pair.original.type !== 'empty' ? pair.lineNumber : ''}
                </span>
                <LineSide
                  content={pair.original.content}
                  type={pair.original.type}
                  side="original"
                  lineNumber={pair.lineNumber}
                />
              </div>

              {/* Modified side */}
              <div className="diff-view__side diff-view__side--modified">
                <span className="diff-view__line-number" aria-hidden="true">
                  {pair.modified.type !== 'empty' ? pair.lineNumber : ''}
                </span>
                <LineSide
                  content={pair.modified.content}
                  type={pair.modified.type}
                  side="modified"
                  lineNumber={pair.lineNumber}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {!diffResult.isIdentical && (
        <div className="diff-view__summary" data-testid={`${testId}-summary`}>
          <span className="diff-view__summary-item diff-view__summary-item--add">
            +{diffResult.addCount} addition{diffResult.addCount === 1 ? '' : 's'}
          </span>
          <span className="diff-view__summary-item diff-view__summary-item--remove">
            -{diffResult.removeCount} removal{diffResult.removeCount === 1 ? '' : 's'}
          </span>
        </div>
      )}
    </div>
  );
}

export default DiffView;
