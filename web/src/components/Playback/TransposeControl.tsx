/**
 * TransposeControl Component
 *
 * A control for changing the key signature of the melody.
 * Supports common keys with visual feedback for key changes.
 *
 * @module components/Playback/TransposeControl
 */

import { useCallback, useMemo } from 'react';
import type { ReactElement, CSSProperties, ChangeEvent } from 'react';
import type { KeySignature } from '@/lib/melody/types';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[TransposeControl] ${message}`, ...args);
  }
};

/**
 * Key information with display properties
 */
export interface KeyInfo {
  /** Key signature value */
  key: KeySignature;
  /** Display label */
  label: string;
  /** Whether this is a major or minor key */
  type: 'major' | 'minor';
  /** Number of sharps (positive) or flats (negative) */
  accidentals: number;
}

/**
 * All supported keys with metadata
 */
export const KEYS: KeyInfo[] = [
  { key: 'C', label: 'C Major', type: 'major', accidentals: 0 },
  { key: 'G', label: 'G Major', type: 'major', accidentals: 1 },
  { key: 'D', label: 'D Major', type: 'major', accidentals: 2 },
  { key: 'F', label: 'F Major', type: 'major', accidentals: -1 },
  { key: 'Am', label: 'A Minor', type: 'minor', accidentals: 0 },
  { key: 'Em', label: 'E Minor', type: 'minor', accidentals: 1 },
  { key: 'Dm', label: 'D Minor', type: 'minor', accidentals: -1 },
];

/**
 * Props for TransposeControl component
 */
export interface TransposeControlProps {
  /** Current key signature */
  value: KeySignature;
  /** Callback when key changes */
  onChange: (key: KeySignature) => void;
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Display style: 'dropdown', 'buttons', or 'grid' */
  variant?: 'dropdown' | 'buttons' | 'grid';
  /** Whether to show only major or minor keys, or both */
  filter?: 'all' | 'major' | 'minor';
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
 * Get semitone difference between two keys (for relative transposition)
 */
function getSemitoneDifference(from: KeySignature, to: KeySignature): number {
  const semitones: Record<KeySignature, number> = {
    C: 0,
    G: 7,
    D: 2,
    F: 5,
    Am: 9,
    Em: 4,
    Dm: 2,
  };
  const diff = semitones[to] - semitones[from];
  // Normalize to -6 to +6 range
  if (diff > 6) return diff - 12;
  if (diff < -6) return diff + 12;
  return diff;
}

/**
 * Format the transposition direction for display
 */
function formatTransposition(semitones: number): string {
  if (semitones === 0) return '';
  const direction = semitones > 0 ? '+' : '';
  return `${direction}${semitones}`;
}

/**
 * TransposeControl allows changing the key signature of the melody.
 *
 * Features:
 * - Multiple display variants (dropdown, buttons, grid)
 * - Shows relative transposition from current key
 * - Filters for major/minor keys
 * - Visual indication of current key
 *
 * @example
 * ```tsx
 * <TransposeControl
 *   value="C"
 *   onChange={(key) => console.log('New key:', key)}
 *   variant="buttons"
 * />
 * ```
 */
export function TransposeControl({
  value,
  onChange,
  disabled = false,
  variant = 'dropdown',
  filter = 'all',
  showLabel = true,
  className = '',
  style,
  testId = 'transpose-control',
}: TransposeControlProps): ReactElement {
  // Filter keys based on prop
  const filteredKeys = useMemo(() => {
    if (filter === 'all') return KEYS;
    return KEYS.filter((k) => k.type === filter);
  }, [filter]);

  // Get current key info
  const currentKeyInfo = useMemo(() => {
    return KEYS.find((k) => k.key === value) ?? KEYS[0];
  }, [value]);

  const handleDropdownChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const newKey = e.target.value as KeySignature;
      log('Key changed to:', newKey);
      onChange(newKey);
    },
    [onChange]
  );

  const handleKeyClick = useCallback(
    (key: KeySignature) => {
      log('Key clicked:', key);
      onChange(key);
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
    minWidth: '120px',
  };

  const buttonsContainerStyle: CSSProperties = {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
  };

  const gridContainerStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
    gap: '4px',
  };

  const keyButtonStyle = (isActive: boolean): CSSProperties => ({
    padding: '6px 10px',
    fontSize: '0.75rem',
    border: '1px solid',
    borderColor: isActive ? '#3b82f6' : '#d1d5db',
    borderRadius: '4px',
    backgroundColor: isActive ? '#dbeafe' : 'white',
    color: isActive ? '#1e40af' : '#374151',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    textAlign: 'center',
    opacity: disabled ? 0.5 : 1,
  });

  const renderDropdown = (): ReactElement => (
    <select
      value={value}
      onChange={handleDropdownChange}
      disabled={disabled}
      style={selectStyle}
      aria-label="Key signature"
      data-testid={`${testId}-select`}
    >
      {filteredKeys.map((keyInfo) => {
        const semitones = getSemitoneDifference(value, keyInfo.key);
        const transposition = formatTransposition(semitones);
        return (
          <option key={keyInfo.key} value={keyInfo.key}>
            {keyInfo.label} {transposition && `(${transposition})`}
          </option>
        );
      })}
    </select>
  );

  const renderButtons = (): ReactElement => (
    <div style={buttonsContainerStyle} role="radiogroup" aria-label="Key signature">
      {filteredKeys.map((keyInfo) => {
        const isActive = keyInfo.key === value;
        const semitones = getSemitoneDifference(value, keyInfo.key);
        const transposition = formatTransposition(semitones);
        return (
          <button
            key={keyInfo.key}
            onClick={() => handleKeyClick(keyInfo.key)}
            disabled={disabled}
            style={keyButtonStyle(isActive)}
            role="radio"
            aria-checked={isActive}
            aria-label={`${keyInfo.label}${transposition ? ` (${transposition} semitones)` : ''}`}
            data-testid={`${testId}-key-${keyInfo.key}`}
          >
            {keyInfo.key}
            {transposition && (
              <span style={{ fontSize: '0.65rem', opacity: 0.7, marginLeft: '2px' }}>
                {transposition}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const renderGrid = (): ReactElement => {
    const majorKeys = filteredKeys.filter((k) => k.type === 'major');
    const minorKeys = filteredKeys.filter((k) => k.type === 'minor');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {majorKeys.length > 0 && (
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>
              Major Keys
            </div>
            <div style={gridContainerStyle}>
              {majorKeys.map((keyInfo) => {
                const isActive = keyInfo.key === value;
                return (
                  <button
                    key={keyInfo.key}
                    onClick={() => handleKeyClick(keyInfo.key)}
                    disabled={disabled}
                    style={keyButtonStyle(isActive)}
                    aria-label={keyInfo.label}
                    aria-pressed={isActive}
                    data-testid={`${testId}-key-${keyInfo.key}`}
                  >
                    {keyInfo.key}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {minorKeys.length > 0 && (
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>
              Minor Keys
            </div>
            <div style={gridContainerStyle}>
              {minorKeys.map((keyInfo) => {
                const isActive = keyInfo.key === value;
                return (
                  <button
                    key={keyInfo.key}
                    onClick={() => handleKeyClick(keyInfo.key)}
                    disabled={disabled}
                    style={keyButtonStyle(isActive)}
                    aria-label={keyInfo.label}
                    aria-pressed={isActive}
                    data-testid={`${testId}-key-${keyInfo.key}`}
                  >
                    {keyInfo.key}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`transpose-control ${className}`.trim()}
      style={containerStyle}
      data-testid={testId}
    >
      {showLabel && (
        <div style={labelStyle}>
          <span>Key</span>
          <span data-testid={`${testId}-current`}>{currentKeyInfo.label}</span>
        </div>
      )}

      {variant === 'dropdown' && renderDropdown()}
      {variant === 'buttons' && renderButtons()}
      {variant === 'grid' && renderGrid()}
    </div>
  );
}

export default TransposeControl;
