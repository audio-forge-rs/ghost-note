/**
 * AnalysisPanel Component
 *
 * Container component for all poem analysis visualizations.
 * Provides toggle controls for each analysis view and manages
 * their visibility state.
 *
 * @module components/Analysis/AnalysisPanel
 */

import { type ReactElement, useState, useCallback, useId } from 'react';
import type { PoemAnalysis } from '@/types/analysis';
import { SyllableOverlay } from './SyllableOverlay';
import { StressVisualization } from './StressVisualization';
import { RhymeSchemeDisplay } from './RhymeSchemeDisplay';
import { MeterDisplay } from './MeterDisplay';
import { SingabilityHeatmap } from './SingabilityHeatmap';
import { SoundPatternsDisplay } from './SoundPatternsDisplay';
import './AnalysisPanel.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[AnalysisPanel] ${message}`, ...args);
  }
};

/**
 * Toggle state for each analysis visualization
 */
export interface AnalysisToggles {
  syllables: boolean;
  stress: boolean;
  rhyme: boolean;
  meter: boolean;
  soundPatterns: boolean;
  singability: boolean;
}

/**
 * Default toggle states - all off initially
 */
const DEFAULT_TOGGLES: AnalysisToggles = {
  syllables: false,
  stress: false,
  rhyme: false,
  meter: false,
  soundPatterns: false,
  singability: false,
};

/**
 * Toggle configuration for rendering
 */
interface ToggleConfig {
  key: keyof AnalysisToggles;
  label: string;
  tooltip: string;
}

/**
 * Configuration for all available toggles
 */
const TOGGLE_CONFIG: ToggleConfig[] = [
  {
    key: 'syllables',
    label: 'Syllables',
    tooltip: 'Show syllable count for each line',
  },
  {
    key: 'stress',
    label: 'Stress',
    tooltip: 'Show stress patterns (stressed and unstressed syllables)',
  },
  {
    key: 'rhyme',
    label: 'Rhyme',
    tooltip: 'Show rhyme scheme with color-coded line endings',
  },
  {
    key: 'meter',
    label: 'Meter',
    tooltip: 'Show metrical foot type and regularity',
  },
  {
    key: 'soundPatterns',
    label: 'Sounds',
    tooltip: 'Show alliteration, assonance, and consonance patterns',
  },
  {
    key: 'singability',
    label: 'Singability',
    tooltip: 'Highlight areas that may be difficult to sing',
  },
];

/**
 * Props for the AnalysisPanel component
 */
export interface AnalysisPanelProps {
  /** Poem analysis data to visualize */
  analysis: PoemAnalysis | null;
  /** Original poem text (for overlay displays) */
  poemText?: string;
  /** Additional CSS class name */
  className?: string;
  /** Initial toggle states (optional) */
  initialToggles?: Partial<AnalysisToggles>;
  /** Callback when toggles change */
  onTogglesChange?: (toggles: AnalysisToggles) => void;
}

/**
 * AnalysisPanel provides a container for all poem analysis visualizations.
 *
 * Features:
 * - Toggle controls for each analysis type
 * - Accessible with ARIA labels and keyboard navigation
 * - Responsive layout
 * - Tooltips explaining each visualization
 *
 * @example
 * ```tsx
 * <AnalysisPanel
 *   analysis={poemAnalysis}
 *   poemText={originalPoem}
 * />
 * ```
 */
export function AnalysisPanel({
  analysis,
  poemText = '',
  className = '',
  initialToggles = {},
  onTogglesChange,
}: AnalysisPanelProps): ReactElement {
  const idPrefix = useId();
  const [toggles, setToggles] = useState<AnalysisToggles>({
    ...DEFAULT_TOGGLES,
    ...initialToggles,
  });

  log('Rendering AnalysisPanel:', { analysis: !!analysis, toggles });

  const handleToggle = useCallback(
    (key: keyof AnalysisToggles) => {
      log('Toggle clicked:', key);
      setToggles((prev) => {
        const newToggles = { ...prev, [key]: !prev[key] };
        onTogglesChange?.(newToggles);
        return newToggles;
      });
    },
    [onTogglesChange]
  );

  const handleToggleAll = useCallback(
    (enabled: boolean) => {
      log('Toggle all:', enabled);
      const newToggles: AnalysisToggles = {
        syllables: enabled,
        stress: enabled,
        rhyme: enabled,
        meter: enabled,
        soundPatterns: enabled,
        singability: enabled,
      };
      setToggles(newToggles);
      onTogglesChange?.(newToggles);
    },
    [onTogglesChange]
  );

  const allEnabled = Object.values(toggles).every(Boolean);
  const anyEnabled = Object.values(toggles).some(Boolean);

  const containerClass = [
    'analysis-panel',
    !analysis && 'analysis-panel--empty',
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  // Show empty state if no analysis data
  if (!analysis) {
    return (
      <div className={containerClass} data-testid="analysis-panel">
        <div className="analysis-panel__empty" role="status">
          <p className="analysis-panel__empty-text">
            No analysis data available. Enter a poem to see analysis results.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass} data-testid="analysis-panel">
      {/* Toggle Controls */}
      <div
        className="analysis-panel__controls"
        role="group"
        aria-label="Analysis visualization toggles"
      >
        <div className="analysis-panel__controls-header">
          <h3 className="analysis-panel__title" id={`${idPrefix}-title`}>
            Analysis Views
          </h3>
          <button
            type="button"
            className="analysis-panel__toggle-all"
            onClick={() => handleToggleAll(!allEnabled)}
            aria-pressed={allEnabled}
            data-testid="toggle-all-button"
          >
            {allEnabled ? 'Hide All' : 'Show All'}
          </button>
        </div>

        <div
          className="analysis-panel__toggles"
          role="group"
          aria-labelledby={`${idPrefix}-title`}
        >
          {TOGGLE_CONFIG.map(({ key, label, tooltip }) => (
            <div key={key} className="analysis-panel__toggle-item">
              <button
                type="button"
                className={`analysis-panel__toggle ${
                  toggles[key] ? 'analysis-panel__toggle--active' : ''
                }`}
                onClick={() => handleToggle(key)}
                aria-pressed={toggles[key]}
                aria-describedby={`${idPrefix}-${key}-tooltip`}
                data-testid={`toggle-${key}`}
              >
                <span className="analysis-panel__toggle-indicator" aria-hidden="true" />
                <span className="analysis-panel__toggle-label">{label}</span>
              </button>
              <span
                id={`${idPrefix}-${key}-tooltip`}
                className="analysis-panel__tooltip"
                role="tooltip"
              >
                {tooltip}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Analysis Content */}
      <div
        className="analysis-panel__content"
        aria-live="polite"
        aria-atomic="false"
      >
        {!anyEnabled && (
          <p className="analysis-panel__hint" data-testid="toggle-hint">
            Select an analysis view above to see visualizations.
          </p>
        )}

        {toggles.syllables && (
          <SyllableOverlay
            structure={analysis.structure}
            poemText={poemText}
          />
        )}

        {toggles.stress && (
          <StressVisualization
            structure={analysis.structure}
            meter={analysis.prosody.meter}
          />
        )}

        {toggles.rhyme && (
          <RhymeSchemeDisplay
            rhyme={analysis.prosody.rhyme}
            structure={analysis.structure}
          />
        )}

        {toggles.meter && (
          <MeterDisplay
            meter={analysis.prosody.meter}
            regularity={analysis.prosody.regularity}
          />
        )}

        {toggles.soundPatterns && analysis.soundPatterns && (
          <SoundPatternsDisplay
            soundPatterns={analysis.soundPatterns}
            structure={analysis.structure}
          />
        )}

        {toggles.singability && (
          <SingabilityHeatmap
            structure={analysis.structure}
            problems={analysis.problems}
          />
        )}
      </div>
    </div>
  );
}

export default AnalysisPanel;
