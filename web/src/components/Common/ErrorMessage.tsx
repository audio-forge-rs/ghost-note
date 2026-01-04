/**
 * ErrorMessage Component
 *
 * A user-friendly error display component with optional retry action
 * and customizable severity levels.
 *
 * @module components/Common/ErrorMessage
 */

import type { ReactElement, ReactNode } from 'react';
import './ErrorMessage.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[ErrorMessage] ${message}`, ...args);
  }
};

/**
 * Error message severity/variant
 */
export type ErrorVariant = 'error' | 'warning' | 'info';

/**
 * Props for the ErrorMessage component
 */
export interface ErrorMessageProps {
  /** Error title */
  title: string;
  /** Detailed error message */
  message?: string;
  /** Error variant/severity */
  variant?: ErrorVariant;
  /** Whether to show the error icon */
  showIcon?: boolean;
  /** Custom icon to display */
  icon?: ReactNode;
  /** Retry button handler */
  onRetry?: () => void;
  /** Retry button label */
  retryLabel?: string;
  /** Dismiss button handler */
  onDismiss?: () => void;
  /** Additional CSS class name */
  className?: string;
  /** Data test ID for testing */
  testId?: string;
}

/**
 * Default icons for each variant
 */
const defaultIcons: Record<ErrorVariant, ReactNode> = {
  error: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18A2 2 0 0 0 3.54 21H20.46A2 2 0 0 0 22.18 18L13.71 3.86A2 2 0 0 0 10.29 3.86Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

/**
 * ErrorMessage component displays user-friendly error messages with
 * optional retry and dismiss actions.
 *
 * Features:
 * - Multiple variants (error, warning, info)
 * - Customizable icon or default icons per variant
 * - Optional retry and dismiss actions
 * - Accessible with proper ARIA attributes
 *
 * @example
 * ```tsx
 * <ErrorMessage
 *   title="Connection Failed"
 *   message="Unable to reach the server. Please check your internet connection."
 *   variant="error"
 *   showIcon
 *   onRetry={handleRetry}
 *   retryLabel="Try Again"
 * />
 * ```
 */
export function ErrorMessage({
  title,
  message,
  variant = 'error',
  showIcon = true,
  icon,
  onRetry,
  retryLabel = 'Retry',
  onDismiss,
  className = '',
  testId = 'error-message',
}: ErrorMessageProps): ReactElement {
  log('Rendering error message:', { title, variant, hasRetry: !!onRetry, hasDismiss: !!onDismiss });

  const containerClass = [
    'error-message',
    `error-message--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  const displayIcon = icon ?? defaultIcons[variant];

  return (
    <div
      className={containerClass}
      data-testid={testId}
      role="alert"
      aria-live="assertive"
    >
      {showIcon && displayIcon && (
        <div className="error-message__icon" aria-hidden="true">
          {displayIcon}
        </div>
      )}

      <div className="error-message__content">
        <h4 className="error-message__title">{title}</h4>
        {message && <p className="error-message__text">{message}</p>}
      </div>

      {(onRetry || onDismiss) && (
        <div className="error-message__actions">
          {onRetry && (
            <button
              type="button"
              className="error-message__retry"
              onClick={onRetry}
              aria-label={retryLabel}
            >
              {retryLabel}
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              className="error-message__dismiss"
              onClick={onDismiss}
              aria-label="Dismiss"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ErrorMessage;
