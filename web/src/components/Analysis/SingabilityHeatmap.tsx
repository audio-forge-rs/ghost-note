/**
 * SingabilityHeatmap Component
 *
 * Displays a heatmap visualization of singability scores,
 * highlighting problem spots that may be difficult to sing.
 *
 * @module components/Analysis/SingabilityHeatmap
 */

import { type ReactElement, useId, useMemo } from 'react';
import type { StructuredPoem, ProblemReport, Severity } from '@/types/analysis';
import './SingabilityHeatmap.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[SingabilityHeatmap] ${message}`, ...args);
  }
};

/**
 * Props for the SingabilityHeatmap component
 */
export interface SingabilityHeatmapProps {
  /** Structured poem data with singability scores */
  structure: StructuredPoem;
  /** Problem reports for additional context */
  problems: ProblemReport[];
  /** Additional CSS class name */
  className?: string;
}

/**
 * Color scale for singability scores (0 = bad, 1 = good)
 */
function getSingabilityColor(score: number): string {
  // Gradient from red (0) through yellow (0.5) to green (1)
  if (score >= 0.8) {
    return 'var(--color-singability-excellent, #22c55e)'; // green
  }
  if (score >= 0.6) {
    return 'var(--color-singability-good, #84cc16)'; // lime
  }
  if (score >= 0.4) {
    return 'var(--color-singability-fair, #eab308)'; // yellow
  }
  if (score >= 0.2) {
    return 'var(--color-singability-poor, #f97316)'; // orange
  }
  return 'var(--color-singability-bad, #ef4444)'; // red
}

/**
 * Get text description for singability score
 */
function getSingabilityLabel(score: number): string {
  if (score >= 0.8) return 'Excellent';
  if (score >= 0.6) return 'Good';
  if (score >= 0.4) return 'Fair';
  if (score >= 0.2) return 'Poor';
  return 'Difficult';
}

/**
 * Get CSS class for severity level
 */
function getSeverityClass(severity: Severity): string {
  switch (severity) {
    case 'high':
      return 'singability-heatmap__problem--high';
    case 'medium':
      return 'singability-heatmap__problem--medium';
    case 'low':
      return 'singability-heatmap__problem--low';
    default:
      return '';
  }
}

/**
 * Calculate average score from an array of scores
 */
function calculateAverage(scores: number[]): number {
  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * SingabilityHeatmap displays a color-coded visualization of singability.
 *
 * Features:
 * - Color gradient from red (difficult) to green (easy)
 * - Per-syllable heatmap visualization
 * - Line-level summary scores
 * - Problem spot highlighting with descriptions
 * - Tooltips with detailed information
 * - Accessible with ARIA labels
 *
 * @example
 * ```tsx
 * <SingabilityHeatmap
 *   structure={poemAnalysis.structure}
 *   problems={poemAnalysis.problems}
 * />
 * ```
 */
export function SingabilityHeatmap({
  structure,
  problems,
  className = '',
}: SingabilityHeatmapProps): ReactElement {
  const idPrefix = useId();

  log('Rendering SingabilityHeatmap:', {
    stanzaCount: structure.stanzas.length,
    problemCount: problems.length,
  });

  // Calculate overall singability stats
  const stats = useMemo(() => {
    const allLineScores: number[] = [];
    const allSyllableScores: number[] = [];
    let totalProblems = 0;

    for (const stanza of structure.stanzas) {
      for (const line of stanza.lines) {
        allLineScores.push(line.singability.lineScore);
        allSyllableScores.push(...line.singability.syllableScores);
        totalProblems += line.singability.problemSpots.length;
      }
    }

    return {
      avgLineScore: calculateAverage(allLineScores),
      avgSyllableScore: calculateAverage(allSyllableScores),
      totalLines: allLineScores.length,
      totalSyllables: allSyllableScores.length,
      totalProblems,
    };
  }, [structure]);

  // Filter singability-related problems
  const singabilityProblems = useMemo(
    () => problems.filter((p) => p.type === 'singability'),
    [problems]
  );

  // If no structure data, show empty state
  if (structure.stanzas.length === 0) {
    return (
      <div
        className={`singability-heatmap singability-heatmap--empty ${className}`.trim()}
        data-testid="singability-heatmap"
      >
        <p className="singability-heatmap__empty-text">
          No singability data available.
        </p>
      </div>
    );
  }

  const containerClass = ['singability-heatmap', className]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <div
      className={containerClass}
      data-testid="singability-heatmap"
      role="region"
      aria-label="Singability heatmap visualization"
    >
      <div className="singability-heatmap__header">
        <h4 className="singability-heatmap__title">Singability Heatmap</h4>
        <span
          className="singability-heatmap__score-badge"
          style={{ backgroundColor: getSingabilityColor(stats.avgLineScore) }}
          title="Average singability score"
        >
          {getSingabilityLabel(stats.avgLineScore)} ({(stats.avgLineScore * 100).toFixed(0)}%)
        </span>
      </div>

      {/* Legend */}
      <div className="singability-heatmap__legend" role="list" aria-label="Score legend">
        <div className="singability-heatmap__legend-gradient" aria-hidden="true">
          <span className="singability-heatmap__legend-label">Difficult</span>
          <div className="singability-heatmap__gradient-bar" />
          <span className="singability-heatmap__legend-label">Easy</span>
        </div>
      </div>

      <div className="singability-heatmap__content">
        {structure.stanzas.map((stanza, stanzaIdx) => (
          <div
            key={`stanza-${stanzaIdx}`}
            className="singability-heatmap__stanza"
            data-testid={`singability-stanza-${stanzaIdx}`}
          >
            {stanza.lines.map((line, lineIdx) => {
              const lineScore = line.singability.lineScore;
              const syllableScores = line.singability.syllableScores;
              const problemSpots = line.singability.problemSpots;
              const tooltipId = `${idPrefix}-tooltip-${stanzaIdx}-${lineIdx}`;

              return (
                <div
                  key={`line-${stanzaIdx}-${lineIdx}`}
                  className="singability-heatmap__line"
                  data-testid={`singability-line-${stanzaIdx}-${lineIdx}`}
                >
                  {/* Line score indicator */}
                  <div
                    className="singability-heatmap__line-score"
                    style={{ backgroundColor: getSingabilityColor(lineScore) }}
                    title={`Line score: ${(lineScore * 100).toFixed(0)}%`}
                    aria-label={`Line ${lineIdx + 1} singability: ${getSingabilityLabel(lineScore)}`}
                  >
                    {(lineScore * 100).toFixed(0)}
                  </div>

                  {/* Syllable heatmap */}
                  <div className="singability-heatmap__syllables" aria-describedby={tooltipId}>
                    {line.words.map((word, wordIdx) => (
                      <span key={`word-${wordIdx}`} className="singability-heatmap__word">
                        {word.syllables.map((syllable, sylIdx) => {
                          // Calculate the global syllable index for this word
                          let syllableOffset = 0;
                          for (let w = 0; w < wordIdx; w++) {
                            syllableOffset += line.words[w].syllables.length;
                          }
                          const globalSylIdx = syllableOffset + sylIdx;
                          const score = syllableScores[globalSylIdx] ?? 0.5;
                          const hasProblem = problemSpots.some(
                            (p) => p.position === globalSylIdx
                          );

                          return (
                            <span
                              key={`syl-${sylIdx}`}
                              className={`singability-heatmap__syllable ${
                                hasProblem ? 'singability-heatmap__syllable--problem' : ''
                              }`}
                              style={{ backgroundColor: getSingabilityColor(score) }}
                              title={`Score: ${(score * 100).toFixed(0)}%${
                                hasProblem ? ' (problem spot)' : ''
                              }`}
                            >
                              {syllable.phonemes.join('') || '\u00B7'}
                            </span>
                          );
                        })}
                      </span>
                    ))}
                  </div>

                  {/* Problem indicators */}
                  {problemSpots.length > 0 && (
                    <span className="singability-heatmap__problem-count" aria-hidden="true">
                      {problemSpots.length}
                    </span>
                  )}

                  {/* Tooltip */}
                  <div
                    id={tooltipId}
                    className="singability-heatmap__tooltip"
                    role="tooltip"
                  >
                    <div className="singability-heatmap__tooltip-header">
                      Line {lineIdx + 1}: {getSingabilityLabel(lineScore)} (
                      {(lineScore * 100).toFixed(0)}%)
                    </div>
                    {problemSpots.length > 0 && (
                      <div className="singability-heatmap__tooltip-problems">
                        <strong>Issues:</strong>
                        <ul>
                          {problemSpots.map((problem, idx) => (
                            <li key={idx} className={getSeverityClass(problem.severity)}>
                              {problem.issue} ({problem.severity})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {stanzaIdx < structure.stanzas.length - 1 && (
              <div
                className="singability-heatmap__stanza-break"
                role="separator"
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>

      {/* Problem reports section */}
      {singabilityProblems.length > 0 && (
        <div className="singability-heatmap__problems" aria-label="Singability problems">
          <h5 className="singability-heatmap__problems-title">Problem Areas</h5>
          <ul className="singability-heatmap__problems-list">
            {singabilityProblems.slice(0, 5).map((problem, idx) => (
              <li
                key={idx}
                className={`singability-heatmap__problem-item ${getSeverityClass(
                  problem.severity
                )}`}
              >
                <span className="singability-heatmap__problem-location">
                  Line {problem.line + 1}
                </span>
                <span className="singability-heatmap__problem-desc">
                  {problem.description}
                </span>
                {problem.suggestedFix && (
                  <span className="singability-heatmap__problem-fix">
                    Suggestion: {problem.suggestedFix}
                  </span>
                )}
              </li>
            ))}
            {singabilityProblems.length > 5 && (
              <li className="singability-heatmap__problem-more">
                +{singabilityProblems.length - 5} more issues
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Summary */}
      <div className="singability-heatmap__summary" aria-live="polite">
        <span className="singability-heatmap__stat">
          Average score: <strong>{(stats.avgLineScore * 100).toFixed(0)}%</strong>
        </span>
        <span className="singability-heatmap__stat">
          Problem spots: <strong>{stats.totalProblems}</strong>
        </span>
        <span className="singability-heatmap__stat">
          Total syllables: <strong>{stats.totalSyllables}</strong>
        </span>
      </div>
    </div>
  );
}

export default SingabilityHeatmap;
