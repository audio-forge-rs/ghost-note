/**
 * LoadingSpinner Component
 *
 * An animated spinner component for indicating loading states.
 * Supports multiple sizes and is accessible to screen readers.
 *
 * @module components/Common/LoadingSpinner
 */

import type { ReactElement } from 'react';
import './LoadingSpinner.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[LoadingSpinner] ${message}`, ...args);
  }
};

/**
 * Available spinner sizes
 */
export type SpinnerSize = 'small' | 'medium' | 'large';

/**
 * Props for the LoadingSpinner component
 */
export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: SpinnerSize;
  /** Custom label for screen readers (default: "Loading...") */
  label?: string;
  /** Additional CSS class name */
  className?: string;
  /** Data test ID for testing */
  testId?: string;
  /** Whether to show the label visually */
  showLabel?: boolean;
}

/**
 * LoadingSpinner component displays an animated spinner for loading states.
 *
 * Features:
 * - Multiple size variants (small, medium, large)
 * - Accessible with ARIA attributes and live region
 * - Optional visible label
 * - Smooth CSS animation
 *
 * @example
 * ```tsx
 * // Basic usage
 * <LoadingSpinner />
 *
 * // With custom size and label
 * <LoadingSpinner size="large" label="Loading content..." showLabel />
 * ```
 */
export function LoadingSpinner({
  size = 'medium',
  label = 'Loading...',
  className = '',
  testId = 'loading-spinner',
  showLabel = false,
}: LoadingSpinnerProps): ReactElement {
  log('Rendering spinner:', { size, label, showLabel });

  const containerClass = [
    'loading-spinner',
    `loading-spinner--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <div
      className={containerClass}
      data-testid={testId}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <svg
        className="loading-spinner__svg"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          className="loading-spinner__track"
          cx="12"
          cy="12"
          r="10"
          fill="none"
          strokeWidth="3"
        />
        <circle
          className="loading-spinner__arc"
          cx="12"
          cy="12"
          r="10"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {showLabel ? (
        <span className="loading-spinner__label">{label}</span>
      ) : (
        <span className="loading-spinner__sr-only">{label}</span>
      )}
    </div>
  );
}

export default LoadingSpinner;
