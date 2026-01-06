/**
 * KeySelect Component
 *
 * A dropdown control for selecting the musical key signature.
 * Supports both major and minor keys with visual grouping.
 *
 * @module components/Melody/KeySelect
 */

import { useCallback, useMemo } from 'react';
import type { ReactElement, CSSProperties, ChangeEvent } from 'react';
import type { KeySignature } from '@/lib/melody/types';
import { KEYS } from './keyConstants';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[KeySelect] ${message}`, ...args);
  }
};

/**
 * Props for KeySelect component
 */
export interface KeySelectProps {
  /** Current key signature */
  value: KeySignature;
  /** Callback when key changes */
  onChange: (key: KeySignature) => void;
  /** Whether the control is disabled */
  disabled?: boolean;
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
 * KeySelect provides a dropdown for selecting the musical key signature.
 *
 * Features:
 * - Grouped major and minor keys
 * - Clear display of current selection
 * - Accessible with keyboard navigation
 *
 * @example
 * ```tsx
 * <KeySelect
 *   value="C"
 *   onChange={(key) => console.log('New key:', key)}
 * />
 * ```
 */
export function KeySelect({
  value,
  onChange,
  disabled = false,
  showLabel = true,
  className = '',
  style,
  testId = 'key-select',
}: KeySelectProps): ReactElement {
  // Get current key info
  const currentKeyInfo = useMemo(() => {
    return KEYS.find((k) => k.key === value) ?? KEYS[0];
  }, [value]);

  // Separate major and minor keys for grouping
  const majorKeys = useMemo(() => KEYS.filter((k) => k.type === 'major'), []);
  const minorKeys = useMemo(() => KEYS.filter((k) => k.type === 'minor'), []);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const newKey = e.target.value as KeySignature;
      log('Key changed to:', newKey);
      onChange(newKey);
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

  return (
    <div
      className={`key-select ${className}`.trim()}
      style={containerStyle}
      data-testid={testId}
    >
      {showLabel && (
        <div style={labelStyle}>
          <span>Key</span>
          <span data-testid={`${testId}-current`}>{currentKeyInfo.label}</span>
        </div>
      )}

      <select
        value={value}
        onChange={handleChange}
        disabled={disabled}
        style={selectStyle}
        aria-label="Key signature"
        data-testid={`${testId}-select`}
      >
        <optgroup label="Major Keys">
          {majorKeys.map((keyInfo) => (
            <option key={keyInfo.key} value={keyInfo.key}>
              {keyInfo.label}
            </option>
          ))}
        </optgroup>
        <optgroup label="Minor Keys">
          {minorKeys.map((keyInfo) => (
            <option key={keyInfo.key} value={keyInfo.key}>
              {keyInfo.label}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}

export default KeySelect;
