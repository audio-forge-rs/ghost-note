/**
 * StylePresetSelect Component
 *
 * A dropdown for selecting musical style presets that affect melody generation.
 * Displays preset descriptions and allows selection of Folk, Classical, Pop, or Hymn styles.
 *
 * @module components/Melody/StylePresetSelect
 */

import { useCallback, useMemo } from 'react';
import type { ReactElement, CSSProperties, ChangeEvent } from 'react';
import {
  getAvailablePresets,
  type StylePreset,
} from '@/lib/melody/variations';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[StylePresetSelect] ${message}`, ...args);
  }
};

/**
 * Props for StylePresetSelect component
 */
export interface StylePresetSelectProps {
  /** Current preset name (or null for custom) */
  value: string | null;
  /** Callback when preset changes */
  onChange: (presetName: string | null) => void;
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Whether to show the label (default: true) */
  showLabel?: boolean;
  /** Whether to show the description of the selected preset (default: true) */
  showDescription?: boolean;
  /** Custom CSS class */
  className?: string;
  /** Custom inline styles */
  style?: CSSProperties;
  /** Test ID for testing */
  testId?: string;
}

/**
 * StylePresetSelect provides a dropdown for selecting musical style presets.
 *
 * Features:
 * - Dropdown with all available presets
 * - Shows description of selected preset
 * - Option for custom/none preset
 * - Clear visual feedback for selection
 *
 * @example
 * ```tsx
 * <StylePresetSelect
 *   value="folk"
 *   onChange={(preset) => console.log('Selected:', preset)}
 * />
 * ```
 */
export function StylePresetSelect({
  value,
  onChange,
  disabled = false,
  showLabel = true,
  showDescription = true,
  className = '',
  style,
  testId = 'style-preset-select',
}: StylePresetSelectProps): ReactElement {
  // Get all available presets
  const presets = useMemo(() => getAvailablePresets(), []);

  // Get current preset info
  const currentPreset = useMemo(() => {
    if (!value) return null;
    return presets.find((p) => p.name.toLowerCase() === value.toLowerCase()) ?? null;
  }, [value, presets]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const newValue = e.target.value;
      log('Style preset changed to:', newValue);
      onChange(newValue === '' ? null : newValue);
    },
    [onChange]
  );

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

  const selectStyle: CSSProperties = {
    padding: '8px 12px',
    fontSize: '0.875rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: disabled ? '#f3f4f6' : 'white',
    color: disabled ? '#9ca3af' : '#1f2937',
    cursor: disabled ? 'not-allowed' : 'pointer',
    minWidth: '140px',
  };

  const descriptionStyle: CSSProperties = {
    fontSize: '0.75rem',
    color: '#6b7280',
    padding: '8px',
    backgroundColor: '#f9fafb',
    borderRadius: '4px',
    lineHeight: 1.4,
  };

  const currentLabel = currentPreset
    ? currentPreset.name.charAt(0).toUpperCase() + currentPreset.name.slice(1)
    : 'Custom';

  return (
    <div
      className={`style-preset-select ${className}`.trim()}
      style={containerStyle}
      data-testid={testId}
    >
      {showLabel && (
        <div style={labelStyle}>
          <span>Style Preset</span>
          <span data-testid={`${testId}-current`}>{currentLabel}</span>
        </div>
      )}

      <select
        value={value ?? ''}
        onChange={handleChange}
        disabled={disabled}
        style={selectStyle}
        aria-label="Style preset"
        data-testid={`${testId}-select`}
      >
        <option value="">Custom (No Preset)</option>
        {presets.map((preset) => (
          <option key={preset.name} value={preset.name}>
            {preset.name.charAt(0).toUpperCase() + preset.name.slice(1)}
          </option>
        ))}
      </select>

      {showDescription && currentPreset && (
        <div style={descriptionStyle} data-testid={`${testId}-description`}>
          {currentPreset.description}
          <br />
          <span style={{ fontStyle: 'italic', opacity: 0.8 }}>
            Tempo: {currentPreset.tempoRange[0]}-{currentPreset.tempoRange[1]} BPM |
            Time: {currentPreset.timeSignature}
          </span>
        </div>
      )}

      {showDescription && !currentPreset && value === null && (
        <div style={descriptionStyle} data-testid={`${testId}-description`}>
          Use custom melody parameters without applying a style preset.
        </div>
      )}
    </div>
  );
}

export default StylePresetSelect;

// Re-export types for convenience
export type { StylePreset };
