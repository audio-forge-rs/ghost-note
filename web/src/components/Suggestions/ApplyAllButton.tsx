/**
 * ApplyAllButton Component
 *
 * A button component for batch operations on suggestions,
 * including accept all, reject all, and reset all actions.
 *
 * @module components/Suggestions/ApplyAllButton
 */

import type { ReactElement } from 'react';
import { getOperationConfig, type BatchOperationType } from './applyAllUtils';
import './ApplyAllButton.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[ApplyAllButton] ${message}`, ...args);
  }
};

/**
 * Props for the ApplyAllButton component
 */
export interface ApplyAllButtonProps {
  /** The type of batch operation */
  operation: BatchOperationType;
  /** Number of suggestions that will be affected */
  count: number;
  /** Handler called when button is clicked */
  onClick: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether to show the count badge */
  showCount?: boolean;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Additional CSS class name */
  className?: string;
  /** Data test ID for testing */
  testId?: string;
}

/**
 * ApplyAllButton component for batch suggestion operations.
 *
 * Features:
 * - Three operation types: accept all, reject all, reset all
 * - Shows count of affected suggestions
 * - Disabled state when no suggestions to process
 * - Multiple size variants
 * - Accessible with proper ARIA attributes
 *
 * @example
 * ```tsx
 * // Accept all pending suggestions
 * <ApplyAllButton
 *   operation="accept"
 *   count={5}
 *   onClick={handleAcceptAll}
 * />
 *
 * // Reject all with small size
 * <ApplyAllButton
 *   operation="reject"
 *   count={3}
 *   onClick={handleRejectAll}
 *   size="small"
 * />
 * ```
 */
export function ApplyAllButton({
  operation,
  count,
  onClick,
  disabled = false,
  showCount = true,
  size = 'medium',
  className = '',
  testId = 'apply-all-button',
}: ApplyAllButtonProps): ReactElement {
  const config = getOperationConfig(operation);
  const isDisabled = disabled || count === 0;

  log('Rendering button:', { operation, count, disabled: isDisabled });

  const handleClick = (): void => {
    if (!isDisabled) {
      log('Button clicked:', operation, 'affecting', count, 'suggestions');
      onClick();
    }
  };

  const containerClass = [
    'apply-all-button',
    `apply-all-button--${operation}`,
    `apply-all-button--${size}`,
    isDisabled ? 'apply-all-button--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  const ariaLabel = `${config.label}${count > 0 ? ` (${count} suggestion${count !== 1 ? 's' : ''})` : ''}`;

  return (
    <button
      type="button"
      className={containerClass}
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
      title={config.description}
      data-testid={testId}
      data-operation={operation}
    >
      <span className="apply-all-button__icon">{config.icon}</span>
      <span className="apply-all-button__label">{config.label}</span>
      {showCount && count > 0 && (
        <span className="apply-all-button__count" aria-hidden="true">
          {count}
        </span>
      )}
    </button>
  );
}

export default ApplyAllButton;
