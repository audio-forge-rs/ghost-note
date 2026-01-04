/**
 * MeterDisplay Component
 *
 * Displays metrical analysis including foot type, regularity,
 * and deviation indicators.
 *
 * @module components/Analysis/MeterDisplay
 */

import { type ReactElement, useId } from 'react';
import type { MeterAnalysis, FootType } from '@/types/analysis';
import './MeterDisplay.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[MeterDisplay] ${message}`, ...args);
  }
};

/**
 * Props for the MeterDisplay component
 */
export interface MeterDisplayProps {
  /** Meter analysis data */
  meter: MeterAnalysis;
  /** Regularity score (0-1) */
  regularity: number;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Foot type information for display
 */
interface FootTypeInfo {
  name: string;
  pattern: string;
  description: string;
  example: string;
}

/**
 * Get detailed information about a foot type
 */
function getFootTypeInfo(footType: FootType): FootTypeInfo {
  switch (footType) {
    case 'iamb':
      return {
        name: 'Iamb',
        pattern: '\u02D8 \u02C8', // ˘ ˈ
        description: 'Unstressed followed by stressed',
        example: 'a-WAKE, be-LIEVE',
      };
    case 'trochee':
      return {
        name: 'Trochee',
        pattern: '\u02C8 \u02D8', // ˈ ˘
        description: 'Stressed followed by unstressed',
        example: 'GAR-den, HEL-lo',
      };
    case 'anapest':
      return {
        name: 'Anapest',
        pattern: '\u02D8 \u02D8 \u02C8', // ˘ ˘ ˈ
        description: 'Two unstressed followed by stressed',
        example: 'in-ter-VENE, un-der-STAND',
      };
    case 'dactyl':
      return {
        name: 'Dactyl',
        pattern: '\u02C8 \u02D8 \u02D8', // ˈ ˘ ˘
        description: 'Stressed followed by two unstressed',
        example: 'MER-ri-ly, BEAU-ti-ful',
      };
    case 'spondee':
      return {
        name: 'Spondee',
        pattern: '\u02C8 \u02C8', // ˈ ˈ
        description: 'Two stressed syllables',
        example: 'HEART-BREAK, DEAD-LINE',
      };
    case 'unknown':
    default:
      return {
        name: 'Unknown',
        pattern: '?',
        description: 'Could not determine foot type',
        example: 'N/A',
      };
  }
}

/**
 * Get the number of lines descriptor
 */
function getFeetCountDescriptor(feetPerLine: number): string {
  const descriptors: Record<number, string> = {
    1: 'monometer',
    2: 'dimeter',
    3: 'trimeter',
    4: 'tetrameter',
    5: 'pentameter',
    6: 'hexameter',
    7: 'heptameter',
    8: 'octameter',
  };
  return descriptors[feetPerLine] || `${feetPerLine} feet`;
}

/**
 * Get regularity level for styling
 */
function getRegularityLevel(regularity: number): 'high' | 'medium' | 'low' {
  if (regularity >= 0.8) return 'high';
  if (regularity >= 0.5) return 'medium';
  return 'low';
}

/**
 * Get confidence level for styling
 */
function getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.5) return 'medium';
  return 'low';
}

/**
 * MeterDisplay shows metrical analysis in a clear, educational format.
 *
 * Features:
 * - Foot type visualization with pattern notation
 * - Regularity indicator with progress bar
 * - Confidence score display
 * - Educational tooltips explaining meter concepts
 * - Deviation count summary
 * - Accessible with ARIA labels
 *
 * @example
 * ```tsx
 * <MeterDisplay
 *   meter={poemAnalysis.prosody.meter}
 *   regularity={poemAnalysis.prosody.regularity}
 * />
 * ```
 */
export function MeterDisplay({
  meter,
  regularity,
  className = '',
}: MeterDisplayProps): ReactElement {
  const idPrefix = useId();

  log('Rendering MeterDisplay:', {
    footType: meter.footType,
    regularity,
    confidence: meter.confidence,
  });

  const footInfo = getFootTypeInfo(meter.footType);
  const regularityLevel = getRegularityLevel(regularity);
  const confidenceLevel = getConfidenceLevel(meter.confidence);
  const feetDescriptor = getFeetCountDescriptor(meter.feetPerLine);

  const containerClass = ['meter-display', className].filter(Boolean).join(' ').trim();

  // Handle irregular/unknown meter
  const isIrregular = meter.detectedMeter === 'irregular' || meter.footType === 'unknown';

  return (
    <div
      className={containerClass}
      data-testid="meter-display"
      role="region"
      aria-label="Metrical analysis"
    >
      <div className="meter-display__header">
        <h4 className="meter-display__title">Meter Analysis</h4>
        <span
          className={`meter-display__meter-name ${
            isIrregular ? 'meter-display__meter-name--irregular' : ''
          }`}
          title="Detected meter pattern"
        >
          {meter.detectedMeter || 'Irregular'}
        </span>
      </div>

      {/* Main meter card */}
      <div className="meter-display__card" data-testid="meter-card">
        {/* Foot type section */}
        <div className="meter-display__section">
          <div className="meter-display__section-header">
            <h5 className="meter-display__section-title">Foot Type</h5>
            <button
              type="button"
              className="meter-display__info-button"
              aria-describedby={`${idPrefix}-foot-tooltip`}
              title="What is a metrical foot?"
            >
              ?
            </button>
          </div>
          <div className="meter-display__foot-display">
            <span className="meter-display__foot-name">{footInfo.name}</span>
            <span className="meter-display__foot-pattern" aria-label={footInfo.description}>
              {footInfo.pattern}
            </span>
          </div>
          <div
            id={`${idPrefix}-foot-tooltip`}
            className="meter-display__tooltip"
            role="tooltip"
          >
            <p className="meter-display__tooltip-desc">{footInfo.description}</p>
            <p className="meter-display__tooltip-example">
              Examples: {footInfo.example}
            </p>
          </div>
        </div>

        {/* Feet per line section */}
        <div className="meter-display__section">
          <div className="meter-display__section-header">
            <h5 className="meter-display__section-title">Feet Per Line</h5>
          </div>
          <div className="meter-display__feet-display">
            <span className="meter-display__feet-count">{meter.feetPerLine}</span>
            <span className="meter-display__feet-name">({feetDescriptor})</span>
          </div>
        </div>

        {/* Regularity gauge */}
        <div className="meter-display__section">
          <div className="meter-display__section-header">
            <h5 className="meter-display__section-title">Regularity</h5>
            <span className="meter-display__percentage">
              {(regularity * 100).toFixed(0)}%
            </span>
          </div>
          <div
            className="meter-display__gauge"
            role="progressbar"
            aria-valuenow={Math.round(regularity * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Meter regularity"
          >
            <div
              className={`meter-display__gauge-fill meter-display__gauge-fill--${regularityLevel}`}
              style={{ width: `${regularity * 100}%` }}
            />
          </div>
          <p className="meter-display__gauge-label">
            {regularityLevel === 'high' && 'Highly consistent meter'}
            {regularityLevel === 'medium' && 'Moderately regular meter'}
            {regularityLevel === 'low' && 'Irregular or varied meter'}
          </p>
        </div>

        {/* Confidence gauge */}
        <div className="meter-display__section">
          <div className="meter-display__section-header">
            <h5 className="meter-display__section-title">Detection Confidence</h5>
            <span className="meter-display__percentage">
              {(meter.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div
            className="meter-display__gauge"
            role="progressbar"
            aria-valuenow={Math.round(meter.confidence * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Detection confidence"
          >
            <div
              className={`meter-display__gauge-fill meter-display__gauge-fill--${confidenceLevel}`}
              style={{ width: `${meter.confidence * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Pattern display */}
      {meter.pattern && (
        <div className="meter-display__pattern-section">
          <h5 className="meter-display__section-title">Stress Pattern</h5>
          <div className="meter-display__pattern" aria-label="Overall stress pattern">
            {meter.pattern.split('').map((char, idx) => (
              <span
                key={idx}
                className={`meter-display__pattern-char ${
                  char === '1'
                    ? 'meter-display__pattern-char--stressed'
                    : 'meter-display__pattern-char--unstressed'
                } ${
                  meter.deviations.includes(idx)
                    ? 'meter-display__pattern-char--deviation'
                    : ''
                }`}
                title={`${char === '1' ? 'Stressed' : 'Unstressed'}${
                  meter.deviations.includes(idx) ? ' (deviation)' : ''
                }`}
              >
                {char === '1' ? '\u02C8' : '\u02D8'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Deviations summary */}
      <div className="meter-display__summary" aria-live="polite">
        <span className="meter-display__stat">
          Deviations: <strong>{meter.deviations.length}</strong>
        </span>
        {meter.deviations.length > 0 && (
          <span className="meter-display__stat meter-display__stat--positions">
            at positions: {meter.deviations.slice(0, 5).join(', ')}
            {meter.deviations.length > 5 && ` (+${meter.deviations.length - 5} more)`}
          </span>
        )}
      </div>
    </div>
  );
}

export default MeterDisplay;
