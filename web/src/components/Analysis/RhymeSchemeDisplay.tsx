/**
 * RhymeSchemeDisplay Component
 *
 * Displays rhyme scheme with color-coded markers for matching rhymes.
 * Shows the rhyme pattern (ABAB, AABB, etc.) and highlights end words.
 *
 * @module components/Analysis/RhymeSchemeDisplay
 */

import { type ReactElement, useId, useMemo } from 'react';
import type { RhymeAnalysis, StructuredPoem, RhymeType } from '@/types/analysis';
import './RhymeSchemeDisplay.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[RhymeSchemeDisplay] ${message}`, ...args);
  }
};

/**
 * Props for the RhymeSchemeDisplay component
 */
export interface RhymeSchemeDisplayProps {
  /** Rhyme analysis data */
  rhyme: RhymeAnalysis;
  /** Structured poem data */
  structure: StructuredPoem;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Color palette for rhyme scheme letters
 * Each letter gets a distinct, accessible color
 */
const RHYME_COLORS: Record<string, string> = {
  A: '#3b82f6', // blue
  B: '#22c55e', // green
  C: '#f59e0b', // amber
  D: '#ec4899', // pink
  E: '#8b5cf6', // purple
  F: '#14b8a6', // teal
  G: '#f97316', // orange
  H: '#6366f1', // indigo
  X: '#6b7280', // gray (non-rhyming)
};

/**
 * Get color for a rhyme scheme letter
 */
function getRhymeColor(letter: string): string {
  return RHYME_COLORS[letter.toUpperCase()] || RHYME_COLORS['X'];
}

/**
 * Get description for rhyme type
 */
function getRhymeTypeDescription(type: RhymeType): string {
  switch (type) {
    case 'perfect':
      return 'Perfect rhyme - identical end sounds';
    case 'slant':
      return 'Slant rhyme - similar but not identical sounds';
    case 'assonance':
      return 'Assonance - matching vowel sounds';
    case 'consonance':
      return 'Consonance - matching consonant sounds';
    default:
      return 'Rhyme connection';
  }
}

/**
 * Parse rhyme scheme string into per-line letters
 */
function parseRhymeScheme(scheme: string): string[] {
  return scheme.split('').filter((char) => /[A-Za-z]/.test(char));
}

/**
 * Build a map of line index to rhyme group info
 */
interface LineRhymeInfo {
  letter: string;
  color: string;
  endWord: string;
  rhymeType: RhymeType | null;
  matchingLines: number[];
}

function buildLineRhymeMap(
  rhyme: RhymeAnalysis,
  structure: StructuredPoem
): Map<number, LineRhymeInfo> {
  const map = new Map<number, LineRhymeInfo>();
  const schemeLetters = parseRhymeScheme(rhyme.scheme);

  // Get all lines with their text
  const allLines: string[] = [];
  for (const stanza of structure.stanzas) {
    for (const line of stanza.lines) {
      allLines.push(line.text);
    }
  }

  // Build info for each line
  let lineIdx = 0;
  for (const stanza of structure.stanzas) {
    for (const line of stanza.lines) {
      const letter = schemeLetters[lineIdx] || 'X';
      const words = line.words;
      const endWord = words.length > 0 ? words[words.length - 1].text : '';

      // Find matching lines from rhyme groups
      const groupKey = letter.toUpperCase();
      const group = rhyme.rhymeGroups[groupKey];
      const matchingLines = group?.lines || [];
      const rhymeType = group?.rhymeType || null;

      map.set(lineIdx, {
        letter,
        color: getRhymeColor(letter),
        endWord,
        rhymeType,
        matchingLines: matchingLines.filter((l) => l !== lineIdx),
      });

      lineIdx++;
    }
  }

  return map;
}

/**
 * RhymeSchemeDisplay shows rhyme patterns with color-coded line endings.
 *
 * Features:
 * - Color-coded rhyme scheme letters (A, B, C, etc.)
 * - Highlights end words with matching colors
 * - Shows rhyme type (perfect, slant, etc.)
 * - Tooltips with rhyme information
 * - Internal rhyme detection display
 * - Accessible with ARIA labels
 *
 * @example
 * ```tsx
 * <RhymeSchemeDisplay
 *   rhyme={poemAnalysis.prosody.rhyme}
 *   structure={poemAnalysis.structure}
 * />
 * ```
 */
export function RhymeSchemeDisplay({
  rhyme,
  structure,
  className = '',
}: RhymeSchemeDisplayProps): ReactElement {
  const idPrefix = useId();

  log('Rendering RhymeSchemeDisplay:', {
    scheme: rhyme.scheme,
    groupCount: Object.keys(rhyme.rhymeGroups).length,
  });

  // Build line-to-rhyme map
  const lineRhymeMap = useMemo(
    () => buildLineRhymeMap(rhyme, structure),
    [rhyme, structure]
  );

  // If no structure data, show empty state
  if (structure.stanzas.length === 0) {
    return (
      <div
        className={`rhyme-display rhyme-display--empty ${className}`.trim()}
        data-testid="rhyme-scheme-display"
      >
        <p className="rhyme-display__empty-text">No rhyme data available.</p>
      </div>
    );
  }

  const containerClass = ['rhyme-display', className].filter(Boolean).join(' ').trim();

  let globalLineIdx = 0;

  return (
    <div
      className={containerClass}
      data-testid="rhyme-scheme-display"
      role="region"
      aria-label="Rhyme scheme visualization"
    >
      <div className="rhyme-display__header">
        <h4 className="rhyme-display__title">Rhyme Scheme</h4>
        <span className="rhyme-display__scheme-badge" title="Detected rhyme scheme">
          {rhyme.scheme || 'None detected'}
        </span>
      </div>

      {/* Legend */}
      <div className="rhyme-display__legend" role="list" aria-label="Rhyme scheme legend">
        {Object.entries(rhyme.rhymeGroups).map(([letter, group]) => (
          <div
            key={letter}
            className="rhyme-display__legend-item"
            role="listitem"
          >
            <span
              className="rhyme-display__legend-color"
              style={{ backgroundColor: getRhymeColor(letter) }}
              aria-hidden="true"
            />
            <span className="rhyme-display__legend-label">
              {letter}: {group.endWords.join(', ')}
            </span>
            <span className="rhyme-display__legend-type">
              ({group.rhymeType})
            </span>
          </div>
        ))}
      </div>

      <div className="rhyme-display__content">
        {structure.stanzas.map((stanza, stanzaIdx) => (
          <div
            key={`stanza-${stanzaIdx}`}
            className="rhyme-display__stanza"
            data-testid={`rhyme-stanza-${stanzaIdx}`}
          >
            {stanza.lines.map((line, lineIdx) => {
              const currentGlobalIdx = globalLineIdx;
              globalLineIdx++;

              const rhymeInfo = lineRhymeMap.get(currentGlobalIdx);
              const tooltipId = `${idPrefix}-tooltip-${stanzaIdx}-${lineIdx}`;

              if (!rhymeInfo) {
                return (
                  <div
                    key={`line-${stanzaIdx}-${lineIdx}`}
                    className="rhyme-display__line"
                  >
                    <span className="rhyme-display__text">{line.text}</span>
                  </div>
                );
              }

              return (
                <div
                  key={`line-${stanzaIdx}-${lineIdx}`}
                  className="rhyme-display__line"
                  data-testid={`rhyme-line-${stanzaIdx}-${lineIdx}`}
                >
                  {/* Rhyme scheme letter */}
                  <span
                    className="rhyme-display__letter"
                    style={{ backgroundColor: rhymeInfo.color }}
                    title={`Rhyme group ${rhymeInfo.letter}`}
                    aria-label={`Rhyme group ${rhymeInfo.letter}`}
                  >
                    {rhymeInfo.letter}
                  </span>

                  {/* Line text with highlighted end word */}
                  <span className="rhyme-display__text">
                    {line.text.slice(0, -rhymeInfo.endWord.length)}
                    <span
                      className="rhyme-display__end-word"
                      style={{
                        color: rhymeInfo.color,
                        borderColor: rhymeInfo.color,
                      }}
                      aria-describedby={tooltipId}
                    >
                      {rhymeInfo.endWord}
                    </span>
                  </span>

                  {/* Tooltip */}
                  <div
                    id={tooltipId}
                    className="rhyme-display__tooltip"
                    role="tooltip"
                  >
                    <div className="rhyme-display__tooltip-header">
                      Rhyme group {rhymeInfo.letter}
                    </div>
                    {rhymeInfo.rhymeType && (
                      <div className="rhyme-display__tooltip-type">
                        {getRhymeTypeDescription(rhymeInfo.rhymeType)}
                      </div>
                    )}
                    {rhymeInfo.matchingLines.length > 0 && (
                      <div className="rhyme-display__tooltip-matches">
                        Rhymes with line{rhymeInfo.matchingLines.length > 1 ? 's' : ''}:{' '}
                        {rhymeInfo.matchingLines.map((l) => l + 1).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {stanzaIdx < structure.stanzas.length - 1 && (
              <div
                className="rhyme-display__stanza-break"
                role="separator"
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>

      {/* Internal rhymes section */}
      {rhyme.internalRhymes.length > 0 && (
        <div className="rhyme-display__internal" aria-label="Internal rhymes">
          <h5 className="rhyme-display__internal-title">Internal Rhymes</h5>
          <ul className="rhyme-display__internal-list">
            {rhyme.internalRhymes.map((ir, idx) => (
              <li key={idx} className="rhyme-display__internal-item">
                Line {ir.line + 1}: positions {ir.positions[0] + 1} and{' '}
                {ir.positions[1] + 1}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary */}
      <div className="rhyme-display__summary" aria-live="polite">
        <span className="rhyme-display__stat">
          Rhyme groups: <strong>{Object.keys(rhyme.rhymeGroups).length}</strong>
        </span>
        <span className="rhyme-display__stat">
          Internal rhymes: <strong>{rhyme.internalRhymes.length}</strong>
        </span>
      </div>
    </div>
  );
}

export default RhymeSchemeDisplay;
