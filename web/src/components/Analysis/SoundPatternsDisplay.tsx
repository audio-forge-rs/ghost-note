/**
 * SoundPatternsDisplay Component
 *
 * Displays detected sound patterns (alliteration, assonance, consonance)
 * with color-coded highlights and pattern summaries.
 *
 * @module components/Analysis/SoundPatternsDisplay
 */

import { type ReactElement, useId, useMemo } from 'react';
import type {
  SoundPatternAnalysis,
  SoundPatternOccurrence,
  LineSoundPatterns,
  StructuredPoem,
} from '@/types/analysis';
import './SoundPatternsDisplay.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[SoundPatternsDisplay] ${message}`, ...args);
  }
};

/**
 * Props for the SoundPatternsDisplay component
 */
export interface SoundPatternsDisplayProps {
  /** Sound pattern analysis data */
  soundPatterns: SoundPatternAnalysis;
  /** Structured poem data for displaying lines */
  structure: StructuredPoem;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Color palette for sound pattern types
 */
const PATTERN_COLORS = {
  alliteration: '#3b82f6', // blue
  assonance: '#22c55e', // green
  consonance: '#f59e0b', // amber
};

/**
 * Get human-readable name for pattern type
 */
function getPatternTypeName(type: string): string {
  switch (type) {
    case 'alliteration':
      return 'Alliteration';
    case 'assonance':
      return 'Assonance';
    case 'consonance':
      return 'Consonance';
    default:
      return type;
  }
}

/**
 * Get description for pattern type
 */
function getPatternTypeDescription(type: string): string {
  switch (type) {
    case 'alliteration':
      return 'Repeated initial consonant sounds';
    case 'assonance':
      return 'Repeated vowel sounds';
    case 'consonance':
      return 'Repeated consonant sounds within words';
    default:
      return 'Sound pattern';
  }
}

/**
 * Get human-readable name for a phoneme
 */
function getPhonemeDescription(phoneme: string): string {
  const descriptions: Record<string, string> = {
    // Vowels
    AA: 'ah',
    AE: 'a',
    AH: 'uh',
    AO: 'aw',
    AW: 'ow',
    AY: 'i',
    EH: 'e',
    ER: 'er',
    EY: 'ay',
    IH: 'ih',
    IY: 'ee',
    OW: 'oh',
    OY: 'oy',
    UH: 'oo',
    UW: 'oo',
    // Consonants
    B: 'b',
    CH: 'ch',
    D: 'd',
    DH: 'th',
    F: 'f',
    G: 'g',
    HH: 'h',
    JH: 'j',
    K: 'k',
    L: 'l',
    M: 'm',
    N: 'n',
    NG: 'ng',
    P: 'p',
    R: 'r',
    S: 's',
    SH: 'sh',
    T: 't',
    TH: 'th',
    V: 'v',
    W: 'w',
    Y: 'y',
    Z: 'z',
    ZH: 'zh',
  };

  return descriptions[phoneme] || phoneme.toLowerCase();
}

/**
 * Get strength indicator label
 */
function getStrengthLabel(strength: number): string {
  if (strength >= 0.8) return 'Strong';
  if (strength >= 0.5) return 'Moderate';
  return 'Subtle';
}

/**
 * Combine all patterns from a line for display
 */
function getAllPatternsForLine(linePatterns: LineSoundPatterns): SoundPatternOccurrence[] {
  return [
    ...linePatterns.alliterations,
    ...linePatterns.assonances,
    ...linePatterns.consonances,
  ].sort((a, b) => b.strength - a.strength); // Sort by strength
}

/**
 * SoundPatternsDisplay shows alliteration, assonance, and consonance patterns.
 *
 * Features:
 * - Color-coded pattern types (blue, green, amber)
 * - Highlights words involved in each pattern
 * - Shows pattern strength and sound type
 * - Summary statistics with top sounds
 * - Accessible with ARIA labels
 *
 * @example
 * ```tsx
 * <SoundPatternsDisplay
 *   soundPatterns={poemAnalysis.soundPatterns}
 *   structure={poemAnalysis.structure}
 * />
 * ```
 */
export function SoundPatternsDisplay({
  soundPatterns,
  structure,
  className = '',
}: SoundPatternsDisplayProps): ReactElement {
  const idPrefix = useId();

  log('Rendering SoundPatternsDisplay:', {
    lineCount: soundPatterns.lines.length,
    summary: soundPatterns.summary,
  });

  // Calculate total pattern count
  const totalPatterns = useMemo(() => {
    return (
      soundPatterns.summary.alliterationCount +
      soundPatterns.summary.assonanceCount +
      soundPatterns.summary.consonanceCount
    );
  }, [soundPatterns.summary]);

  // If no structure data, show empty state
  if (structure.stanzas.length === 0 || soundPatterns.lines.length === 0) {
    return (
      <div
        className={`sound-patterns sound-patterns--empty ${className}`.trim()}
        data-testid="sound-patterns-display"
      >
        <p className="sound-patterns__empty-text">No sound pattern data available.</p>
      </div>
    );
  }

  const containerClass = ['sound-patterns', className].filter(Boolean).join(' ').trim();

  return (
    <div
      className={containerClass}
      data-testid="sound-patterns-display"
      role="region"
      aria-label="Sound patterns visualization"
    >
      <div className="sound-patterns__header">
        <h4 className="sound-patterns__title">Sound Patterns</h4>
        <span
          className="sound-patterns__density-badge"
          title={`Pattern density: ${Math.round(soundPatterns.summary.density * 100)}%`}
        >
          {totalPatterns} pattern{totalPatterns !== 1 ? 's' : ''} detected
        </span>
      </div>

      {/* Legend */}
      <div className="sound-patterns__legend" role="list" aria-label="Sound pattern types">
        {(['alliteration', 'assonance', 'consonance'] as const).map((type) => {
          const count =
            type === 'alliteration'
              ? soundPatterns.summary.alliterationCount
              : type === 'assonance'
              ? soundPatterns.summary.assonanceCount
              : soundPatterns.summary.consonanceCount;

          return (
            <div key={type} className="sound-patterns__legend-item" role="listitem">
              <span
                className="sound-patterns__legend-color"
                style={{ backgroundColor: PATTERN_COLORS[type] }}
                aria-hidden="true"
              />
              <span className="sound-patterns__legend-label">
                {getPatternTypeName(type)} ({count})
              </span>
            </div>
          );
        })}
      </div>

      {/* Top sounds section */}
      {(soundPatterns.summary.topAlliterativeSounds.length > 0 ||
        soundPatterns.summary.topAssonanceSounds.length > 0) && (
        <div className="sound-patterns__top-sounds">
          {soundPatterns.summary.topAlliterativeSounds.length > 0 && (
            <div className="sound-patterns__top-sound-group">
              <span
                className="sound-patterns__top-sound-label"
                style={{ color: PATTERN_COLORS.alliteration }}
              >
                Top alliterative sounds:
              </span>
              <span className="sound-patterns__top-sound-list">
                {soundPatterns.summary.topAlliterativeSounds
                  .map((s) => `"${getPhonemeDescription(s)}"`)
                  .join(', ')}
              </span>
            </div>
          )}
          {soundPatterns.summary.topAssonanceSounds.length > 0 && (
            <div className="sound-patterns__top-sound-group">
              <span
                className="sound-patterns__top-sound-label"
                style={{ color: PATTERN_COLORS.assonance }}
              >
                Top vowel sounds:
              </span>
              <span className="sound-patterns__top-sound-list">
                {soundPatterns.summary.topAssonanceSounds
                  .map((s) => `"${getPhonemeDescription(s)}"`)
                  .join(', ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Pattern details per line */}
      <div className="sound-patterns__content">
        {soundPatterns.lines.map((linePatterns, lineIdx) => {
          const allPatterns = getAllPatternsForLine(linePatterns);
          const hasPatterns = allPatterns.length > 0;
          const tooltipId = `${idPrefix}-tooltip-${lineIdx}`;

          return (
            <div
              key={lineIdx}
              className={`sound-patterns__line ${
                hasPatterns ? 'sound-patterns__line--has-patterns' : ''
              }`}
              data-testid={`sound-patterns-line-${lineIdx}`}
            >
              <span className="sound-patterns__line-number">{lineIdx + 1}</span>
              <div className="sound-patterns__line-content">
                <span className="sound-patterns__line-text">{linePatterns.text}</span>

                {hasPatterns && (
                  <div className="sound-patterns__line-patterns" aria-describedby={tooltipId}>
                    {allPatterns.slice(0, 3).map((pattern, patternIdx) => (
                      <span
                        key={patternIdx}
                        className="sound-patterns__pattern-badge"
                        style={{
                          backgroundColor: PATTERN_COLORS[pattern.type],
                        }}
                        title={`${getPatternTypeName(pattern.type)}: "${getPhonemeDescription(
                          pattern.sound
                        )}" sound in ${pattern.words.join(', ')}`}
                      >
                        {getPhonemeDescription(pattern.sound)}
                      </span>
                    ))}
                    {allPatterns.length > 3 && (
                      <span className="sound-patterns__pattern-more">
                        +{allPatterns.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Tooltip with full pattern details */}
              {hasPatterns && (
                <div id={tooltipId} className="sound-patterns__tooltip" role="tooltip">
                  <div className="sound-patterns__tooltip-header">
                    Sound Patterns on Line {lineIdx + 1}
                  </div>
                  <div className="sound-patterns__tooltip-content">
                    {allPatterns.map((pattern, patternIdx) => (
                      <div
                        key={patternIdx}
                        className="sound-patterns__tooltip-pattern"
                        style={{ borderLeftColor: PATTERN_COLORS[pattern.type] }}
                      >
                        <div className="sound-patterns__tooltip-pattern-type">
                          {getPatternTypeName(pattern.type)}:{' '}
                          <strong>"{getPhonemeDescription(pattern.sound)}"</strong>
                        </div>
                        <div className="sound-patterns__tooltip-pattern-words">
                          Words: {pattern.words.join(', ')}
                        </div>
                        <div className="sound-patterns__tooltip-pattern-strength">
                          {getStrengthLabel(pattern.strength)} ({Math.round(pattern.strength * 100)}
                          %)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="sound-patterns__summary" aria-live="polite">
        <span className="sound-patterns__stat">
          Alliteration: <strong>{soundPatterns.summary.alliterationCount}</strong>
        </span>
        <span className="sound-patterns__stat">
          Assonance: <strong>{soundPatterns.summary.assonanceCount}</strong>
        </span>
        <span className="sound-patterns__stat">
          Consonance: <strong>{soundPatterns.summary.consonanceCount}</strong>
        </span>
        <span className="sound-patterns__stat sound-patterns__stat--density">
          Density:{' '}
          <strong>{Math.round(soundPatterns.summary.density * 100)}%</strong>
        </span>
      </div>

      {/* Explanatory footer */}
      <div className="sound-patterns__footer">
        <details className="sound-patterns__info">
          <summary className="sound-patterns__info-toggle">What are these patterns?</summary>
          <div className="sound-patterns__info-content">
            <p>
              <strong style={{ color: PATTERN_COLORS.alliteration }}>Alliteration</strong>:{' '}
              {getPatternTypeDescription('alliteration')}. Example: "Peter Piper picked"
            </p>
            <p>
              <strong style={{ color: PATTERN_COLORS.assonance }}>Assonance</strong>:{' '}
              {getPatternTypeDescription('assonance')}. Example: "The rain in Spain"
            </p>
            <p>
              <strong style={{ color: PATTERN_COLORS.consonance }}>Consonance</strong>:{' '}
              {getPatternTypeDescription('consonance')}. Example: "blank" and "think"
            </p>
            <p className="sound-patterns__info-note">
              These patterns enhance the musical quality of poetry and can improve singability.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}

export default SoundPatternsDisplay;
