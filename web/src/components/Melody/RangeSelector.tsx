/**
 * RangeSelector Component
 *
 * A dual-handle slider for selecting vocal range limits (low and high notes).
 * Allows setting minimum and maximum pitch boundaries for melody generation.
 *
 * @module components/Melody/RangeSelector
 */

import { useCallback, useMemo } from 'react';
import type { ReactElement, CSSProperties, ChangeEvent } from 'react';
import {
  VOCAL_RANGE_PRESETS,
  type NotePosition,
  type VocalRangePreset,
} from './rangeConstants';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[RangeSelector] ${message}`, ...args);
  }
};

/**
 * Note names in order
 */
const NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

/**
 * Convert note position to numeric value for slider
 */
function noteToValue(position: NotePosition): number {
  const noteIndex = NOTES.indexOf(position.note);
  return position.octave * 7 + noteIndex;
}

/**
 * Convert numeric value back to note position
 */
function valueToNote(value: number): NotePosition {
  const octave = Math.floor(value / 7);
  const noteIndex = ((value % 7) + 7) % 7; // Handle negative values
  return {
    note: NOTES[noteIndex],
    octave,
  };
}

/**
 * Format note position for display
 */
function formatNote(position: NotePosition): string {
  const octaveLabel = position.octave === -1 ? '3' : position.octave === 0 ? '4' : '5';
  return `${position.note}${octaveLabel}`;
}

/**
 * Props for RangeSelector component
 */
export interface RangeSelectorProps {
  /** Low note position */
  lowValue: NotePosition;
  /** High note position */
  highValue: NotePosition;
  /** Callback when low value changes */
  onLowChange: (position: NotePosition) => void;
  /** Callback when high value changes */
  onHighChange: (position: NotePosition) => void;
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Whether to show preset buttons (default: true) */
  showPresets?: boolean;
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
 * RangeSelector provides dual sliders for selecting vocal range limits.
 *
 * Features:
 * - Low and high note sliders
 * - Preset buttons for common vocal ranges
 * - Visual display of selected range
 * - Prevents invalid ranges (low > high)
 *
 * @example
 * ```tsx
 * <RangeSelector
 *   lowValue={{ note: 'C', octave: 0 }}
 *   highValue={{ note: 'C', octave: 1 }}
 *   onLowChange={(pos) => console.log('Low:', pos)}
 *   onHighChange={(pos) => console.log('High:', pos)}
 * />
 * ```
 */
export function RangeSelector({
  lowValue,
  highValue,
  onLowChange,
  onHighChange,
  disabled = false,
  showPresets = true,
  showLabel = true,
  className = '',
  style,
  testId = 'range-selector',
}: RangeSelectorProps): ReactElement {
  // Convert positions to numeric values for sliders
  const lowNumeric = useMemo(() => noteToValue(lowValue), [lowValue]);
  const highNumeric = useMemo(() => noteToValue(highValue), [highValue]);

  // Slider limits
  const minValue = -7; // C3 (octave -1)
  const maxValue = 14; // B5 (octave 1)

  const handleLowChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value, 10);
      // Prevent low from exceeding high
      if (newValue < highNumeric) {
        const newPosition = valueToNote(newValue);
        log('Low changed to:', formatNote(newPosition));
        onLowChange(newPosition);
      }
    },
    [highNumeric, onLowChange]
  );

  const handleHighChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value, 10);
      // Prevent high from going below low
      if (newValue > lowNumeric) {
        const newPosition = valueToNote(newValue);
        log('High changed to:', formatNote(newPosition));
        onHighChange(newPosition);
      }
    },
    [lowNumeric, onHighChange]
  );

  const handlePresetClick = useCallback(
    (preset: VocalRangePreset) => {
      log('Preset clicked:', preset.label);
      onLowChange(preset.low);
      onHighChange(preset.high);
    },
    [onLowChange, onHighChange]
  );

  // Check if current range matches a preset
  const activePreset = useMemo(() => {
    return VOCAL_RANGE_PRESETS.find(
      (p) =>
        p.low.note === lowValue.note &&
        p.low.octave === lowValue.octave &&
        p.high.note === highValue.note &&
        p.high.octave === highValue.octave
    );
  }, [lowValue, highValue]);

  // Styles
  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
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

  const rangeDisplayStyle: CSSProperties = {
    fontSize: '0.875rem',
    color: '#6b7280',
  };

  const sliderRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const sliderLabelStyle: CSSProperties = {
    fontSize: '0.75rem',
    color: '#6b7280',
    width: '40px',
  };

  const sliderStyle: CSSProperties = {
    flex: 1,
    height: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    accentColor: '#10b981',
  };

  const noteDisplayStyle: CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#374151',
    width: '40px',
    textAlign: 'right',
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
      className={`range-selector ${className}`.trim()}
      style={containerStyle}
      data-testid={testId}
    >
      {/* Label and range display */}
      {showLabel && (
        <div style={labelStyle}>
          <span>Vocal Range</span>
          <span style={rangeDisplayStyle} data-testid={`${testId}-display`}>
            {formatNote(lowValue)} - {formatNote(highValue)}
          </span>
        </div>
      )}

      {/* Low note slider */}
      <div style={sliderRowStyle}>
        <span style={sliderLabelStyle}>Low</span>
        <input
          type="range"
          min={minValue}
          max={maxValue}
          value={lowNumeric}
          onChange={handleLowChange}
          disabled={disabled}
          style={sliderStyle}
          aria-label="Low note"
          aria-valuemin={minValue}
          aria-valuemax={maxValue}
          aria-valuenow={lowNumeric}
          aria-valuetext={formatNote(lowValue)}
          data-testid={`${testId}-low`}
        />
        <span style={noteDisplayStyle} data-testid={`${testId}-low-display`}>
          {formatNote(lowValue)}
        </span>
      </div>

      {/* High note slider */}
      <div style={sliderRowStyle}>
        <span style={sliderLabelStyle}>High</span>
        <input
          type="range"
          min={minValue}
          max={maxValue}
          value={highNumeric}
          onChange={handleHighChange}
          disabled={disabled}
          style={sliderStyle}
          aria-label="High note"
          aria-valuemin={minValue}
          aria-valuemax={maxValue}
          aria-valuenow={highNumeric}
          aria-valuetext={formatNote(highValue)}
          data-testid={`${testId}-high`}
        />
        <span style={noteDisplayStyle} data-testid={`${testId}-high-display`}>
          {formatNote(highValue)}
        </span>
      </div>

      {/* Preset buttons */}
      {showPresets && (
        <div style={presetsContainerStyle} data-testid={`${testId}-presets`}>
          {VOCAL_RANGE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePresetClick(preset)}
              disabled={disabled}
              style={presetButtonStyle(activePreset?.label === preset.label)}
              aria-label={`Set range to ${preset.label}`}
              aria-pressed={activePreset?.label === preset.label}
              data-testid={`${testId}-preset-${preset.label.toLowerCase()}`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default RangeSelector;
