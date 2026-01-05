/**
 * ModeToggle Component
 *
 * A toggle switch for selecting between major and minor musical modes.
 * Provides clear visual feedback for the current selection.
 *
 * @module components/Melody/ModeToggle
 */

import { useCallback } from 'react';
import type { ReactElement, CSSProperties } from 'react';
import type { MusicalMode } from '@/types/analysis';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[ModeToggle] ${message}`, ...args);
  }
};

/**
 * Props for ModeToggle component
 */
export interface ModeToggleProps {
  /** Current mode value */
  value: MusicalMode;
  /** Callback when mode changes */
  onChange: (mode: MusicalMode) => void;
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
 * ModeToggle provides a toggle switch for selecting major or minor mode.
 *
 * Features:
 * - Clear visual distinction between modes
 * - Accessible button group implementation
 * - Smooth transition animations
 *
 * @example
 * ```tsx
 * <ModeToggle
 *   value="major"
 *   onChange={(mode) => console.log('New mode:', mode)}
 * />
 * ```
 */
export function ModeToggle({
  value,
  onChange,
  disabled = false,
  showLabel = true,
  className = '',
  style,
  testId = 'mode-toggle',
}: ModeToggleProps): ReactElement {
  const handleMajorClick = useCallback(() => {
    if (value !== 'major') {
      log('Mode changed to: major');
      onChange('major');
    }
  }, [value, onChange]);

  const handleMinorClick = useCallback(() => {
    if (value !== 'minor') {
      log('Mode changed to: minor');
      onChange('minor');
    }
  }, [value, onChange]);

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

  const toggleContainerStyle: CSSProperties = {
    display: 'flex',
    borderRadius: '6px',
    overflow: 'hidden',
    border: '1px solid #d1d5db',
  };

  const buttonStyle = (isActive: boolean): CSSProperties => ({
    flex: 1,
    padding: '8px 16px',
    fontSize: '0.875rem',
    fontWeight: isActive ? 600 : 400,
    border: 'none',
    backgroundColor: isActive ? '#3b82f6' : 'white',
    color: isActive ? 'white' : '#374151',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    opacity: disabled ? 0.5 : 1,
  });

  const modeLabel = value === 'major' ? 'Major' : 'Minor';

  return (
    <div
      className={`mode-toggle ${className}`.trim()}
      style={containerStyle}
      data-testid={testId}
    >
      {showLabel && (
        <div style={labelStyle}>
          <span>Mode</span>
          <span data-testid={`${testId}-current`}>{modeLabel}</span>
        </div>
      )}

      <div
        style={toggleContainerStyle}
        role="group"
        aria-label="Musical mode"
        data-testid={`${testId}-buttons`}
      >
        <button
          onClick={handleMajorClick}
          disabled={disabled}
          style={buttonStyle(value === 'major')}
          role="radio"
          aria-checked={value === 'major'}
          aria-label="Major mode"
          data-testid={`${testId}-major`}
        >
          Major
        </button>
        <button
          onClick={handleMinorClick}
          disabled={disabled}
          style={buttonStyle(value === 'minor')}
          role="radio"
          aria-checked={value === 'minor'}
          aria-label="Minor mode"
          data-testid={`${testId}-minor`}
        >
          Minor
        </button>
      </div>
    </div>
  );
}

export default ModeToggle;
