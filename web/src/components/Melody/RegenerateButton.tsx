/**
 * RegenerateButton Component
 *
 * A button to trigger melody regeneration with current parameters.
 * Shows loading state during generation and displays any errors.
 *
 * @module components/Melody/RegenerateButton
 */

import { useCallback } from 'react';
import type { ReactElement, CSSProperties } from 'react';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[RegenerateButton] ${message}`, ...args);
  }
};

/**
 * Props for RegenerateButton component
 */
export interface RegenerateButtonProps {
  /** Callback when regenerate is clicked */
  onClick: () => void;
  /** Whether melody is currently being generated */
  isGenerating?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Button label (default: "Regenerate Melody") */
  label?: string;
  /** Label while generating (default: "Generating...") */
  generatingLabel?: string;
  /** Visual variant */
  variant?: 'primary' | 'secondary';
  /** Custom CSS class */
  className?: string;
  /** Custom inline styles */
  style?: CSSProperties;
  /** Test ID for testing */
  testId?: string;
}

/**
 * RegenerateButton provides a button to regenerate the melody.
 *
 * Features:
 * - Shows loading state during generation
 * - Displays error messages
 * - Configurable labels
 * - Primary and secondary variants
 *
 * @example
 * ```tsx
 * <RegenerateButton
 *   onClick={handleRegenerate}
 *   isGenerating={isGenerating}
 *   error={error}
 * />
 * ```
 */
export function RegenerateButton({
  onClick,
  isGenerating = false,
  disabled = false,
  error = null,
  label = 'Regenerate Melody',
  generatingLabel = 'Generating...',
  variant = 'primary',
  className = '',
  style,
  testId = 'regenerate-button',
}: RegenerateButtonProps): ReactElement {
  const handleClick = useCallback(() => {
    if (!disabled && !isGenerating) {
      log('Regenerate button clicked');
      onClick();
    }
  }, [onClick, disabled, isGenerating]);

  const isDisabled = disabled || isGenerating;
  const buttonLabel = isGenerating ? generatingLabel : label;

  // Styles based on variant
  const primaryStyle: CSSProperties = {
    backgroundColor: isDisabled ? '#9ca3af' : '#10b981',
    color: 'white',
    borderColor: isDisabled ? '#9ca3af' : '#059669',
  };

  const secondaryStyle: CSSProperties = {
    backgroundColor: isDisabled ? '#f3f4f6' : 'white',
    color: isDisabled ? '#9ca3af' : '#374151',
    borderColor: '#d1d5db',
  };

  const variantStyle = variant === 'primary' ? primaryStyle : secondaryStyle;

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    ...style,
  };

  const buttonStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 20px',
    fontSize: '0.875rem',
    fontWeight: 500,
    border: '1px solid',
    borderRadius: '6px',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    minWidth: '160px',
    ...variantStyle,
  };

  const errorStyle: CSSProperties = {
    fontSize: '0.75rem',
    color: '#dc2626',
    padding: '4px 8px',
    backgroundColor: '#fef2f2',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  const spinnerStyle: CSSProperties = {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  return (
    <div
      className={`regenerate-button ${className}`.trim()}
      style={containerStyle}
      data-testid={testId}
    >
      <button
        onClick={handleClick}
        disabled={isDisabled}
        style={buttonStyle}
        aria-label={buttonLabel}
        aria-busy={isGenerating}
        data-testid={`${testId}-button`}
      >
        {isGenerating && (
          <span style={spinnerStyle} data-testid={`${testId}-spinner`} />
        )}
        <span data-testid={`${testId}-label`}>{buttonLabel}</span>
      </button>

      {error && (
        <div style={errorStyle} role="alert" data-testid={`${testId}-error`}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* CSS for spinner animation */}
      <style>
        {`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}

export default RegenerateButton;
