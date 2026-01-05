/**
 * TempoInput Component
 *
 * A combined slider and numeric input for adjusting tempo (BPM).
 * Includes preset buttons for common tempo values.
 *
 * @module components/Melody/TempoInput
 */

import { useCallback, useMemo } from 'react';
import type { ReactElement, CSSProperties, ChangeEvent } from 'react';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[TempoInput] ${message}`, ...args);
  }
};

/**
 * Tempo preset configuration
 */
export interface TempoPreset {
  /** Label for the preset button */
  label: string;
  /** BPM value */
  value: number;
}

/**
 * Default tempo presets
 */
export const DEFAULT_TEMPO_PRESETS: TempoPreset[] = [
  { label: 'Slow', value: 60 },
  { label: 'Moderate', value: 90 },
  { label: 'Medium', value: 120 },
  { label: 'Fast', value: 150 },
];

/**
 * Props for TempoInput component
 */
export interface TempoInputProps {
  /** Current tempo in BPM */
  value: number;
  /** Callback when tempo changes */
  onChange: (bpm: number) => void;
  /** Minimum tempo (default: 40) */
  min?: number;
  /** Maximum tempo (default: 240) */
  max?: number;
  /** Step size for slider (default: 1) */
  step?: number;
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Whether to show preset buttons (default: true) */
  showPresets?: boolean;
  /** Custom preset values */
  presets?: TempoPreset[];
  /** Whether to show the label (default: true) */
  showLabel?: boolean;
  /** Custom CSS class */
  className?: string;
  /** Custom inline styles */
  style?: CSSProperties;
  /** Test ID for testing */
  testId?: string;
}

/**
 * TempoInput provides a slider and numeric input for tempo control.
 *
 * Features:
 * - Slider for intuitive tempo adjustment
 * - Numeric input for precise values
 * - Preset buttons for common tempos
 * - Increment/decrement buttons
 *
 * @example
 * ```tsx
 * <TempoInput
 *   value={120}
 *   onChange={(bpm) => console.log('New tempo:', bpm)}
 *   showPresets
 * />
 * ```
 */
export function TempoInput({
  value,
  onChange,
  min = 40,
  max = 240,
  step = 1,
  disabled = false,
  showPresets = true,
  presets = DEFAULT_TEMPO_PRESETS,
  showLabel = true,
  className = '',
  style,
  testId = 'tempo-input',
}: TempoInputProps): ReactElement {
  // Filter presets to only show those within range
  const validPresets = useMemo(() => {
    return presets.filter((p) => p.value >= min && p.value <= max);
  }, [presets, min, max]);

  const clampValue = useCallback(
    (val: number): number => {
      return Math.max(min, Math.min(max, val));
    },
    [min, max]
  );

  const handleSliderChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value, 10);
      log('Slider changed to:', newValue);
      onChange(clampValue(newValue));
    },
    [onChange, clampValue]
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value, 10);
      if (!isNaN(newValue)) {
        log('Input changed to:', newValue);
        onChange(clampValue(newValue));
      }
    },
    [onChange, clampValue]
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
    flexDirection: 'column',
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

  const inputStyle: CSSProperties = {
    width: '70px',
    padding: '4px 8px',
    fontSize: '0.875rem',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    textAlign: 'center',
    backgroundColor: disabled ? '#f3f4f6' : 'white',
    color: disabled ? '#9ca3af' : '#374151',
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
      className={`tempo-input ${className}`.trim()}
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

      {/* Slider with increment/decrement buttons and numeric input */}
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
          data-testid={`${testId}-slider`}
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

        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          style={inputStyle}
          aria-label="Tempo in BPM"
          data-testid={`${testId}-number`}
        />
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

export default TempoInput;
