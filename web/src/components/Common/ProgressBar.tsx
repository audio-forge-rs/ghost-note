/**
 * ProgressBar Component
 *
 * A progress indicator component for displaying operation progress.
 * Supports determinate and indeterminate modes.
 *
 * @module components/Common/ProgressBar
 */

import type { ReactElement } from 'react';
import './ProgressBar.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[ProgressBar] ${message}`, ...args);
  }
};

/**
 * Progress bar size variants
 */
export type ProgressBarSize = 'small' | 'medium' | 'large';

/**
 * Progress bar color variants
 */
export type ProgressBarVariant = 'primary' | 'success' | 'warning' | 'error';

/**
 * Props for the ProgressBar component
 */
export interface ProgressBarProps {
  /** Current progress value (0-100) */
  value?: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Whether to show indeterminate animation */
  indeterminate?: boolean;
  /** Size variant */
  size?: ProgressBarSize;
  /** Color variant */
  variant?: ProgressBarVariant;
  /** Whether to show the progress percentage label */
  showLabel?: boolean;
  /** Custom label (overrides percentage) */
  label?: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Additional CSS class name */
  className?: string;
  /** Data test ID for testing */
  testId?: string;
  /** Whether to animate value changes */
  animated?: boolean;
}

/**
 * ProgressBar component displays progress for long-running operations.
 *
 * Features:
 * - Determinate and indeterminate modes
 * - Multiple size and color variants
 * - Optional visible percentage label
 * - Animated value transitions
 * - Accessible with ARIA progressbar role
 *
 * @example
 * ```tsx
 * // Determinate progress
 * <ProgressBar value={65} showLabel />
 *
 * // Indeterminate loading
 * <ProgressBar indeterminate ariaLabel="Processing..." />
 *
 * // Custom styling
 * <ProgressBar value={100} variant="success" size="large" label="Complete!" />
 * ```
 */
export function ProgressBar({
  value = 0,
  max = 100,
  indeterminate = false,
  size = 'medium',
  variant = 'primary',
  showLabel = false,
  label,
  ariaLabel,
  className = '',
  testId = 'progress-bar',
  animated = true,
}: ProgressBarProps): ReactElement {
  // Clamp value between 0 and max
  const clampedValue = Math.max(0, Math.min(value, max));
  const percentage = Math.round((clampedValue / max) * 100);

  log('Rendering progress bar:', { value: clampedValue, percentage, indeterminate, variant });

  const containerClass = [
    'progress-bar',
    `progress-bar--${size}`,
    `progress-bar--${variant}`,
    indeterminate ? 'progress-bar--indeterminate' : '',
    animated ? 'progress-bar--animated' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  const displayLabel = label ?? `${percentage}%`;
  const accessibleLabel = ariaLabel ?? (indeterminate ? 'Loading in progress' : `Progress: ${percentage}%`);

  return (
    <div className={containerClass} data-testid={testId}>
      <div
        className="progress-bar__track"
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : clampedValue}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={accessibleLabel}
        aria-busy={indeterminate}
      >
        <div
          className="progress-bar__fill"
          style={indeterminate ? undefined : { width: `${percentage}%` }}
        />
      </div>
      {showLabel && !indeterminate && (
        <span className="progress-bar__label" aria-hidden="true">
          {displayLabel}
        </span>
      )}
    </div>
  );
}

export default ProgressBar;
