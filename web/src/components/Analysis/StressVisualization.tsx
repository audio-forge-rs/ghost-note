/**
 * StressVisualization Component
 *
 * Displays stress patterns for poem lines using visual indicators
 * (dots and lines for stressed and unstressed syllables).
 *
 * @module components/Analysis/StressVisualization
 */

import { type ReactElement, useId } from 'react';
import type { StructuredPoem, MeterAnalysis, StressLevel } from '@/types/analysis';
import './StressVisualization.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[StressVisualization] ${message}`, ...args);
  }
};

/**
 * Props for the StressVisualization component
 */
export interface StressVisualizationProps {
  /** Structured poem data with syllable/stress information */
  structure: StructuredPoem;
  /** Meter analysis data */
  meter: MeterAnalysis;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Stress symbol configuration
 */
interface StressSymbol {
  symbol: string;
  label: string;
  className: string;
}

/**
 * Get the symbol configuration for a stress level
 */
function getStressSymbol(stress: StressLevel): StressSymbol {
  switch (stress) {
    case 0:
      return {
        symbol: '\u02D8', // breve (˘) for unstressed
        label: 'unstressed',
        className: 'stress-viz__symbol--unstressed',
      };
    case 1:
      return {
        symbol: '\u02C8', // primary stress mark (ˈ)
        label: 'primary stress',
        className: 'stress-viz__symbol--primary',
      };
    case 2:
      return {
        symbol: '\u02CC', // secondary stress mark (ˌ)
        label: 'secondary stress',
        className: 'stress-viz__symbol--secondary',
      };
    default:
      return {
        symbol: '?',
        label: 'unknown',
        className: 'stress-viz__symbol--unknown',
      };
  }
}

/**
 * Parse a stress pattern string into an array of stress levels
 */
function parseStressPattern(pattern: string): StressLevel[] {
  return pattern.split('').map((char) => {
    const num = parseInt(char, 10);
    if (num === 0 || num === 1 || num === 2) {
      return num as StressLevel;
    }
    return 0;
  });
}

/**
 * Get deviation positions for a line
 */
function getLineDeviations(
  lineIdx: number,
  globalDeviations: number[],
  lineStartPositions: number[]
): number[] {
  if (lineIdx >= lineStartPositions.length) {
    return [];
  }

  const lineStart = lineStartPositions[lineIdx];
  const lineEnd =
    lineIdx < lineStartPositions.length - 1
      ? lineStartPositions[lineIdx + 1]
      : Infinity;

  return globalDeviations
    .filter((pos) => pos >= lineStart && pos < lineEnd)
    .map((pos) => pos - lineStart);
}

/**
 * StressVisualization displays stress patterns using metrical notation.
 *
 * Features:
 * - Shows stressed (ˈ) and unstressed (˘) syllables
 * - Secondary stress indication (ˌ)
 * - Highlights deviations from expected meter
 * - Accessible with ARIA labels
 * - Tooltips explaining each pattern
 *
 * @example
 * ```tsx
 * <StressVisualization
 *   structure={poemAnalysis.structure}
 *   meter={poemAnalysis.prosody.meter}
 * />
 * ```
 */
export function StressVisualization({
  structure,
  meter,
  className = '',
}: StressVisualizationProps): ReactElement {
  const idPrefix = useId();

  log('Rendering StressVisualization:', {
    stanzaCount: structure.stanzas.length,
    detectedMeter: meter.detectedMeter,
  });

  // Calculate line start positions for mapping global deviations
  const lineStartPositions: number[] = [];
  let position = 0;
  for (const stanza of structure.stanzas) {
    for (const line of stanza.lines) {
      lineStartPositions.push(position);
      position += line.syllableCount;
    }
  }

  // If no structure data, show empty state
  if (structure.stanzas.length === 0) {
    return (
      <div
        className={`stress-viz stress-viz--empty ${className}`.trim()}
        data-testid="stress-visualization"
      >
        <p className="stress-viz__empty-text">No stress pattern data available.</p>
      </div>
    );
  }

  const containerClass = ['stress-viz', className].filter(Boolean).join(' ').trim();

  let globalLineIdx = 0;

  return (
    <div
      className={containerClass}
      data-testid="stress-visualization"
      role="region"
      aria-label="Stress pattern visualization"
    >
      <div className="stress-viz__header">
        <h4 className="stress-viz__title">Stress Patterns</h4>
        <span className="stress-viz__meter-badge" title="Detected metrical pattern">
          {meter.detectedMeter || 'Irregular'}
        </span>
      </div>

      {/* Legend */}
      <div className="stress-viz__legend" role="list" aria-label="Legend">
        <div className="stress-viz__legend-item" role="listitem">
          <span className="stress-viz__symbol stress-viz__symbol--primary" aria-hidden="true">
            {'\u02C8'}
          </span>
          <span>Primary stress</span>
        </div>
        <div className="stress-viz__legend-item" role="listitem">
          <span className="stress-viz__symbol stress-viz__symbol--secondary" aria-hidden="true">
            {'\u02CC'}
          </span>
          <span>Secondary stress</span>
        </div>
        <div className="stress-viz__legend-item" role="listitem">
          <span className="stress-viz__symbol stress-viz__symbol--unstressed" aria-hidden="true">
            {'\u02D8'}
          </span>
          <span>Unstressed</span>
        </div>
        <div className="stress-viz__legend-item stress-viz__legend-item--deviation" role="listitem">
          <span className="stress-viz__deviation-marker" aria-hidden="true" />
          <span>Deviation from meter</span>
        </div>
      </div>

      <div className="stress-viz__content">
        {structure.stanzas.map((stanza, stanzaIdx) => (
          <div
            key={`stanza-${stanzaIdx}`}
            className="stress-viz__stanza"
            data-testid={`stress-stanza-${stanzaIdx}`}
          >
            {stanza.lines.map((line, lineIdx) => {
              const currentGlobalLineIdx = globalLineIdx;
              globalLineIdx++;

              const stressLevels = parseStressPattern(line.stressPattern);
              const lineDeviations = getLineDeviations(
                currentGlobalLineIdx,
                meter.deviations,
                lineStartPositions
              );
              const tooltipId = `${idPrefix}-tooltip-${stanzaIdx}-${lineIdx}`;

              return (
                <div
                  key={`line-${stanzaIdx}-${lineIdx}`}
                  className="stress-viz__line"
                  data-testid={`stress-line-${stanzaIdx}-${lineIdx}`}
                >
                  <div className="stress-viz__text">{line.text}</div>

                  <div
                    className="stress-viz__pattern"
                    role="group"
                    aria-label={`Stress pattern for line ${lineIdx + 1}`}
                    aria-describedby={tooltipId}
                  >
                    {stressLevels.map((stress, sylIdx) => {
                      const symbolConfig = getStressSymbol(stress);
                      const isDeviation = lineDeviations.includes(sylIdx);

                      return (
                        <span
                          key={`syl-${sylIdx}`}
                          className={`stress-viz__symbol ${symbolConfig.className} ${
                            isDeviation ? 'stress-viz__symbol--deviation' : ''
                          }`}
                          title={`${symbolConfig.label}${isDeviation ? ' (deviation)' : ''}`}
                          aria-label={symbolConfig.label}
                        >
                          {symbolConfig.symbol}
                          {isDeviation && (
                            <span className="stress-viz__deviation-dot" aria-hidden="true" />
                          )}
                        </span>
                      );
                    })}
                  </div>

                  <div
                    id={tooltipId}
                    className="stress-viz__tooltip"
                    role="tooltip"
                  >
                    Pattern: {line.stressPattern || 'N/A'}
                    {lineDeviations.length > 0 && (
                      <span className="stress-viz__tooltip-deviation">
                        {' '}
                        ({lineDeviations.length} deviation{lineDeviations.length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {stanzaIdx < structure.stanzas.length - 1 && (
              <div
                className="stress-viz__stanza-break"
                role="separator"
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>

      {/* Meter summary */}
      <div className="stress-viz__summary" aria-live="polite">
        <span className="stress-viz__stat">
          Foot type: <strong>{meter.footType}</strong>
        </span>
        <span className="stress-viz__stat">
          Feet per line: <strong>{meter.feetPerLine}</strong>
        </span>
        <span className="stress-viz__stat">
          Confidence: <strong>{(meter.confidence * 100).toFixed(0)}%</strong>
        </span>
        <span className="stress-viz__stat">
          Deviations: <strong>{meter.deviations.length}</strong>
        </span>
      </div>
    </div>
  );
}

export default StressVisualization;
