/**
 * SyllableOverlay Component
 *
 * Displays syllable counts overlaid on poem text.
 * Shows the number of syllables for each line with visual indicators.
 *
 * @module components/Analysis/SyllableOverlay
 */

import { type ReactElement, useId } from 'react';
import type { StructuredPoem } from '@/types/analysis';
import './SyllableOverlay.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[SyllableOverlay] ${message}`, ...args);
  }
};

/**
 * Props for the SyllableOverlay component
 */
export interface SyllableOverlayProps {
  /** Structured poem data with syllable information */
  structure: StructuredPoem;
  /** Original poem text (optional, for display) */
  poemText?: string;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Calculates the variance from the median syllable count
 */
function calculateVariance(counts: number[]): { median: number; variance: number } {
  if (counts.length === 0) {
    return { median: 0, variance: 0 };
  }

  const sorted = [...counts].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  const sumSquares = counts.reduce((sum, count) => sum + Math.pow(count - median, 2), 0);
  const variance = Math.sqrt(sumSquares / counts.length);

  return { median, variance };
}

/**
 * Determines the deviation level for visual styling
 */
function getDeviationLevel(count: number, median: number): 'normal' | 'minor' | 'major' {
  const diff = Math.abs(count - median);
  if (diff === 0) return 'normal';
  if (diff <= 2) return 'minor';
  return 'major';
}

/**
 * SyllableOverlay displays syllable counts for each line of the poem.
 *
 * Features:
 * - Shows syllable count per line
 * - Highlights lines that deviate from the median
 * - Tooltips showing word-by-word syllable breakdown
 * - Accessible with ARIA labels
 *
 * @example
 * ```tsx
 * <SyllableOverlay
 *   structure={poemAnalysis.structure}
 *   poemText={originalPoem}
 * />
 * ```
 */
export function SyllableOverlay({
  structure,
  poemText: _poemText = '',
  className = '',
}: SyllableOverlayProps): ReactElement {
  const idPrefix = useId();

  // poemText reserved for future overlay enhancements
  void _poemText;

  log('Rendering SyllableOverlay:', { stanzaCount: structure.stanzas.length });

  // Calculate all syllable counts for variance analysis
  const allCounts = structure.stanzas.flatMap((stanza) =>
    stanza.lines.map((line) => line.syllableCount)
  );
  const { median } = calculateVariance(allCounts);

  // If no structure data, show empty state
  if (structure.stanzas.length === 0) {
    return (
      <div
        className={`syllable-overlay syllable-overlay--empty ${className}`.trim()}
        data-testid="syllable-overlay"
      >
        <p className="syllable-overlay__empty-text">No syllable data available.</p>
      </div>
    );
  }

  const containerClass = ['syllable-overlay', className].filter(Boolean).join(' ').trim();

  return (
    <div
      className={containerClass}
      data-testid="syllable-overlay"
      role="region"
      aria-label="Syllable count analysis"
    >
      <div className="syllable-overlay__header">
        <h4 className="syllable-overlay__title">Syllable Counts</h4>
        <span className="syllable-overlay__median" title="Median syllable count per line">
          Median: {median.toFixed(1)}
        </span>
      </div>

      <div className="syllable-overlay__content">
        {structure.stanzas.map((stanza, stanzaIdx) => (
          <div
            key={`stanza-${stanzaIdx}`}
            className="syllable-overlay__stanza"
            data-testid={`syllable-stanza-${stanzaIdx}`}
          >
            {stanza.lines.map((line, lineIdx) => {
              const deviationLevel = getDeviationLevel(line.syllableCount, median);
              const tooltipId = `${idPrefix}-tooltip-${stanzaIdx}-${lineIdx}`;
              const wordBreakdown = line.words
                .map((w) => `${w.text} (${w.syllables.length})`)
                .join(', ');

              return (
                <div
                  key={`line-${stanzaIdx}-${lineIdx}`}
                  className={`syllable-overlay__line syllable-overlay__line--${deviationLevel}`}
                  data-testid={`syllable-line-${stanzaIdx}-${lineIdx}`}
                >
                  <div className="syllable-overlay__line-content">
                    <span className="syllable-overlay__text">{line.text}</span>
                    <button
                      type="button"
                      className="syllable-overlay__count-badge"
                      aria-describedby={tooltipId}
                      data-testid={`syllable-count-${stanzaIdx}-${lineIdx}`}
                    >
                      {line.syllableCount}
                    </button>
                  </div>
                  <div
                    id={tooltipId}
                    className="syllable-overlay__tooltip"
                    role="tooltip"
                  >
                    <div className="syllable-overlay__tooltip-header">
                      Line {lineIdx + 1}: {line.syllableCount} syllable
                      {line.syllableCount !== 1 ? 's' : ''}
                    </div>
                    <div className="syllable-overlay__tooltip-breakdown">
                      {wordBreakdown}
                    </div>
                  </div>
                </div>
              );
            })}
            {stanzaIdx < structure.stanzas.length - 1 && (
              <div
                className="syllable-overlay__stanza-break"
                role="separator"
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>

      {/* Summary statistics */}
      <div className="syllable-overlay__summary" aria-live="polite">
        <span className="syllable-overlay__stat">
          Total lines: {allCounts.length}
        </span>
        <span className="syllable-overlay__stat">
          Total syllables: {allCounts.reduce((a, b) => a + b, 0)}
        </span>
        <span className="syllable-overlay__stat">
          Range: {Math.min(...allCounts)} - {Math.max(...allCounts)}
        </span>
      </div>
    </div>
  );
}

export default SyllableOverlay;
