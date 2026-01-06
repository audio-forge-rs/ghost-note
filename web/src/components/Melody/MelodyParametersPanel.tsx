/**
 * MelodyParametersPanel Component
 *
 * A comprehensive panel for adjusting all melody generation parameters.
 * Combines KeySelect, ModeToggle, TempoInput, RangeSelector, StylePresetSelect,
 * and RegenerateButton into a cohesive interface.
 *
 * @module components/Melody/MelodyParametersPanel
 */

import { useCallback, useMemo, useState } from 'react';
import type { ReactElement, CSSProperties } from 'react';
import type { KeySignature } from '@/lib/melody/types';
import type { MusicalMode } from '@/types/analysis';
import { KeySelect } from './KeySelect';
import { ModeToggle } from './ModeToggle';
import { TempoInput } from './TempoInput';
import { RangeSelector } from './RangeSelector';
import { StylePresetSelect } from './StylePresetSelect';
import { RegenerateButton } from './RegenerateButton';
import { getPresetByName } from '@/lib/melody/variations';
import { type NotePosition } from './rangeConstants';
import { type MelodyParameters } from './melodyParametersConstants';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[MelodyParametersPanel] ${message}`, ...args);
  }
};

/**
 * Props for MelodyParametersPanel component
 */
export interface MelodyParametersPanelProps {
  /** Current parameters */
  parameters: MelodyParameters;
  /** Callback when any parameter changes */
  onParametersChange: (params: Partial<MelodyParameters>) => void;
  /** Callback when regenerate is clicked */
  onRegenerate: () => void;
  /** Whether melody is being generated */
  isGenerating?: boolean;
  /** Whether a melody exists */
  hasMelody?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Whether the panel is disabled */
  disabled?: boolean;
  /** Layout direction */
  layout?: 'vertical' | 'horizontal';
  /** Whether to show all sections (default: true) */
  showAll?: boolean;
  /** Sections to hide */
  hideSections?: ('key' | 'mode' | 'tempo' | 'range' | 'style' | 'regenerate')[];
  /** Custom CSS class */
  className?: string;
  /** Custom inline styles */
  style?: CSSProperties;
  /** Test ID for testing */
  testId?: string;
}

/**
 * MelodyParametersPanel provides a complete interface for melody parameter adjustment.
 *
 * Features:
 * - All melody parameters in one panel
 * - Real-time parameter preview
 * - Style preset integration
 * - Regenerate button with loading state
 * - Flexible layout options
 *
 * @example
 * ```tsx
 * <MelodyParametersPanel
 *   parameters={melodyParams}
 *   onParametersChange={handleParamsChange}
 *   onRegenerate={handleRegenerate}
 *   isGenerating={isGenerating}
 * />
 * ```
 */
export function MelodyParametersPanel({
  parameters,
  onParametersChange,
  onRegenerate,
  isGenerating = false,
  hasMelody = false,
  error = null,
  disabled = false,
  layout = 'vertical',
  showAll = true,
  hideSections = [],
  className = '',
  style,
  testId = 'melody-parameters-panel',
}: MelodyParametersPanelProps): ReactElement {
  // Track if user has modified parameters since last generation
  const [hasChanges, setHasChanges] = useState(false);

  // Section visibility helpers
  const shouldShow = useCallback(
    (section: string): boolean => {
      return showAll && !hideSections.includes(section as never);
    },
    [showAll, hideSections]
  );

  // Parameter change handlers
  const handleKeyChange = useCallback(
    (key: KeySignature) => {
      log('Key changed:', key);
      setHasChanges(true);
      onParametersChange({ key });
    },
    [onParametersChange]
  );

  const handleModeChange = useCallback(
    (mode: MusicalMode) => {
      log('Mode changed:', mode);
      setHasChanges(true);
      onParametersChange({ mode });
    },
    [onParametersChange]
  );

  const handleTempoChange = useCallback(
    (tempo: number) => {
      log('Tempo changed:', tempo);
      setHasChanges(true);
      onParametersChange({ tempo });
    },
    [onParametersChange]
  );

  const handleRangeLowChange = useCallback(
    (rangeLow: NotePosition) => {
      log('Range low changed:', rangeLow);
      setHasChanges(true);
      onParametersChange({ rangeLow });
    },
    [onParametersChange]
  );

  const handleRangeHighChange = useCallback(
    (rangeHigh: NotePosition) => {
      log('Range high changed:', rangeHigh);
      setHasChanges(true);
      onParametersChange({ rangeHigh });
    },
    [onParametersChange]
  );

  const handleStylePresetChange = useCallback(
    (stylePreset: string | null) => {
      log('Style preset changed:', stylePreset);
      setHasChanges(true);

      // When a preset is selected, apply its default parameters
      if (stylePreset) {
        const preset = getPresetByName(stylePreset);
        if (preset) {
          log('Applying preset parameters:', preset);
          onParametersChange({
            stylePreset,
            tempo: Math.round((preset.tempoRange[0] + preset.tempoRange[1]) / 2),
            timeSignature: preset.timeSignature,
          });
          return;
        }
      }

      onParametersChange({ stylePreset });
    },
    [onParametersChange]
  );

  const handleRegenerate = useCallback(() => {
    log('Regenerate clicked');
    setHasChanges(false);
    onRegenerate();
  }, [onRegenerate]);

  // Determine button label based on state
  const regenerateLabel = useMemo(() => {
    if (!hasMelody) return 'Generate Melody';
    if (hasChanges) return 'Apply Changes';
    return 'Regenerate Melody';
  }, [hasMelody, hasChanges]);

  // Styles
  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: layout === 'vertical' ? 'column' : 'row',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    ...style,
  };

  const sectionStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flex: layout === 'horizontal' ? 1 : undefined,
  };

  const rowStyle: CSSProperties = {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  };

  const headerStyle: CSSProperties = {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '8px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e5e7eb',
  };

  return (
    <div
      className={`melody-parameters-panel ${className}`.trim()}
      style={containerStyle}
      data-testid={testId}
    >
      {/* Header */}
      <div style={headerStyle} data-testid={`${testId}-header`}>
        Melody Parameters
      </div>

      {/* Key and Mode Row */}
      {(shouldShow('key') || shouldShow('mode')) && (
        <div style={rowStyle}>
          {shouldShow('key') && (
            <div style={{ flex: 1, minWidth: '140px' }}>
              <KeySelect
                value={parameters.key}
                onChange={handleKeyChange}
                disabled={disabled || isGenerating}
                testId={`${testId}-key`}
              />
            </div>
          )}
          {shouldShow('mode') && (
            <div style={{ flex: 1, minWidth: '140px' }}>
              <ModeToggle
                value={parameters.mode}
                onChange={handleModeChange}
                disabled={disabled || isGenerating}
                testId={`${testId}-mode`}
              />
            </div>
          )}
        </div>
      )}

      {/* Tempo Section */}
      {shouldShow('tempo') && (
        <div style={sectionStyle}>
          <TempoInput
            value={parameters.tempo}
            onChange={handleTempoChange}
            disabled={disabled || isGenerating}
            testId={`${testId}-tempo`}
          />
        </div>
      )}

      {/* Vocal Range Section */}
      {shouldShow('range') && (
        <div style={sectionStyle}>
          <RangeSelector
            lowValue={parameters.rangeLow}
            highValue={parameters.rangeHigh}
            onLowChange={handleRangeLowChange}
            onHighChange={handleRangeHighChange}
            disabled={disabled || isGenerating}
            testId={`${testId}-range`}
          />
        </div>
      )}

      {/* Style Preset Section */}
      {shouldShow('style') && (
        <div style={sectionStyle}>
          <StylePresetSelect
            value={parameters.stylePreset}
            onChange={handleStylePresetChange}
            disabled={disabled || isGenerating}
            testId={`${testId}-style`}
          />
        </div>
      )}

      {/* Regenerate Button Section */}
      {shouldShow('regenerate') && (
        <div style={{ marginTop: '8px' }}>
          <RegenerateButton
            onClick={handleRegenerate}
            isGenerating={isGenerating}
            disabled={disabled}
            error={error}
            label={regenerateLabel}
            testId={`${testId}-regenerate`}
          />
        </div>
      )}

      {/* Changes indicator */}
      {hasChanges && hasMelody && !isGenerating && (
        <div
          style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            fontStyle: 'italic',
            textAlign: 'center',
          }}
          data-testid={`${testId}-changes-indicator`}
        >
          Parameters changed - click "{regenerateLabel}" to apply
        </div>
      )}
    </div>
  );
}

export default MelodyParametersPanel;
