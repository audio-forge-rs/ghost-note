/**
 * TempoSlider Component
 *
 * A slider control for adjusting playback tempo (BPM).
 * Supports both direct slider input and preset buttons.
 *
 * @module components/Playback/TempoSlider
 */

import { useCallback, useMemo } from 'react';
import type { ReactElement, CSSProperties, ChangeEvent } from 'react';
import { DEFAULT_TEMPO_PRESETS, type TempoPreset } from './tempoSliderConstants';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[TempoSlider] ${message}`, ...args);
  }
};

/**
 * Props for TempoSlider component
 */
export interface TempoSliderProps {
  /** Current tempo in BPM */
  value: number;
  /** Callback when tempo changes */
  onChange: (bpm: number) => void;
  /** Minimum tempo (default: 40) */
  min?: number;
  /** Maximum tempo (default: 240) */
  max?: number;
  /** Step size (default: 1) */
  step?: number;
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Whether to show preset buttons (default: true) */
  showPresets?: boolean;
  /** Custom preset values */
  presets?: TempoPreset[];
  /** Whether to show the BPM label (default: true) */
  showLabel?: boolean;
  /** Orientation of the slider */
  orientation?: 'horizontal' | 'vertical';
  /** Custom CSS class */
  className?: string;
  /** Custom inline styles */
  style?: CSSProperties;
  /** Test ID for testing */
  testId?: string;
}

/**
 * TempoSlider provides a slider and preset buttons for tempo control.
 *
 * Features:
 * - Slider for fine tempo adjustment
 * - Preset buttons for quick tempo changes
 * - Real-time tempo display
 * - Keyboard accessible (+/- for increment/decrement)
 *
 * @example
 * ```tsx
 * <TempoSlider
 *   value={120}
 *   onChange={(bpm) => console.log('New tempo:', bpm)}
 *   showPresets
 * />
 * ```
 */
export function TempoSlider({
  value,
  onChange,
  min = 40,
  max = 240,
  step = 1,
  disabled = false,
  showPresets = true,
  presets = DEFAULT_TEMPO_PRESETS,
  showLabel = true,
  orientation = 'horizontal',
  className = '',
  style,
  testId = 'tempo-slider',
}: TempoSliderProps): ReactElement {
  // Filter presets to only show those within range
  const validPresets = useMemo(() => {
    return presets.filter((p) => p.value >= min && p.value <= max);
  }, [presets, min, max]);

  const handleSliderChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value, 10);
      log('Slider changed to:', newValue);
      onChange(newValue);
    },
    [onChange]
  );

  const handlePresetClick = useCallback(
    (bpm: number) => {
      log('Preset clicked:', bpm);
      onChange(bpm);
    },
    [onChange]
  );

  const handleIncrement = useCallback(() => {
    const newValue = Math.min(value + step, max);
    log('Increment to:', newValue);
    onChange(newValue);
  }, [value, step, max, onChange]);

  const handleDecrement = useCallback(() => {
    const newValue = Math.max(value - step, min);
    log('Decrement to:', newValue);
    onChange(newValue);
  }, [value, step, min, onChange]);

  // Styles
  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: orientation === 'vertical' ? 'column' : 'column',
    gap: '8px',
    ...style,
  };

  const labelStyle: CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const sliderContainerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const buttonStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '4px',
    border: '1px solid #d1d5db',
    backgroundColor: disabled ? '#f3f4f6' : 'white',
    color: disabled ? '#9ca3af' : '#374151',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '1rem',
    fontWeight: 600,
  };

  const sliderStyle: CSSProperties = {
    flex: 1,
    height: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    accentColor: '#10b981',
  };

  const presetsContainerStyle: CSSProperties = {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
  };

  const presetButtonStyle = (isActive: boolean): CSSProperties => ({
    padding: '4px 8px',
    fontSize: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    backgroundColor: isActive ? '#dbeafe' : 'white',
    color: isActive ? '#1e40af' : '#374151',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
  });

  return (
    <div
      className={`tempo-slider ${className}`.trim()}
      style={containerStyle}
      data-testid={testId}
    >
      {/* Label and value display */}
      {showLabel && (
        <div style={labelStyle}>
          <span>Tempo</span>
          <span data-testid={`${testId}-value`}>{value} BPM</span>
        </div>
      )}

      {/* Slider with increment/decrement buttons */}
      <div style={sliderContainerStyle}>
        <button
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          style={buttonStyle}
          aria-label="Decrease tempo"
          data-testid={`${testId}-decrement`}
        >
          -
        </button>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          disabled={disabled}
          style={sliderStyle}
          aria-label="Tempo slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${value} BPM`}
          data-testid={`${testId}-input`}
        />

        <button
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          style={buttonStyle}
          aria-label="Increase tempo"
          data-testid={`${testId}-increment`}
        >
          +
        </button>
      </div>

      {/* Preset buttons */}
      {showPresets && validPresets.length > 0 && (
        <div style={presetsContainerStyle} data-testid={`${testId}-presets`}>
          {validPresets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetClick(preset.value)}
              disabled={disabled}
              style={presetButtonStyle(value === preset.value)}
              aria-label={`Set tempo to ${preset.label} (${preset.value} BPM)`}
              aria-pressed={value === preset.value}
              data-testid={`${testId}-preset-${preset.value}`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default TempoSlider;
