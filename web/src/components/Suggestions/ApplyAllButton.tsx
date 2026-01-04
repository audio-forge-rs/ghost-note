/**
 * ApplyAllButton Component
 *
 * A button component for batch operations on suggestions,
 * including accept all, reject all, and reset all actions.
 *
 * @module components/Suggestions/ApplyAllButton
 */

import type { ReactElement } from 'react';
import './ApplyAllButton.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[ApplyAllButton] ${message}`, ...args);
  }
};

/**
 * Type of batch operation
 */
export type BatchOperationType = 'accept' | 'reject' | 'reset';

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
 * Configuration for each operation type
 */
interface OperationConfig {
  label: string;
  icon: ReactElement;
  description: string;
}

/**
 * Icons for each operation type
 */
const CheckAllIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
  </svg>
);

const RejectAllIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="9" y1="9" x2="15" y2="15" />
    <line x1="15" y1="9" x2="9" y2="15" />
  </svg>
);

const ResetAllIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

const OPERATION_CONFIG: Record<BatchOperationType, OperationConfig> = {
  accept: {
    label: 'Accept All',
    icon: <CheckAllIcon />,
    description: 'Accept all pending suggestions',
  },
  reject: {
    label: 'Reject All',
    icon: <RejectAllIcon />,
    description: 'Reject all pending suggestions',
  },
  reset: {
    label: 'Reset All',
    icon: <ResetAllIcon />,
    description: 'Reset all suggestions to pending',
  },
};

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
  const config = OPERATION_CONFIG[operation];
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

/**
 * Get the operation configuration for external use
 */
export function getOperationConfig(operation: BatchOperationType): OperationConfig {
  return OPERATION_CONFIG[operation];
}

export default ApplyAllButton;
