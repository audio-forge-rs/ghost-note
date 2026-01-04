/**
 * EmptyState Component
 *
 * A flexible empty state component that displays a message, optional icon,
 * and action button(s) when content is not yet available.
 *
 * @module components/Common/EmptyState
 */

import { ReactNode, ReactElement } from 'react';
import './EmptyState.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[EmptyState] ${message}`, ...args);
  }
};

/**
 * Action button configuration for empty states
 */
export interface EmptyStateAction {
  /** Button label text */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Whether this is the primary action */
  primary?: boolean;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
}

/**
 * Props for the EmptyState component
 */
export interface EmptyStateProps {
  /** Icon to display (SVG element or component) */
  icon?: ReactNode;
  /** Main title/heading */
  title: string;
  /** Descriptive message explaining the empty state */
  description?: string;
  /** Action buttons to display */
  actions?: EmptyStateAction[];
  /** Additional CSS class name */
  className?: string;
  /** Variant style for the empty state */
  variant?: 'default' | 'compact' | 'centered';
  /** Data test ID for testing */
  testId?: string;
}

/**
 * EmptyState component displays a placeholder when content is not available.
 *
 * Features:
 * - Customizable icon, title, and description
 * - Multiple action buttons with primary/secondary styling
 * - Compact and centered variants
 * - Accessible with proper ARIA attributes
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<PoemIcon />}
 *   title="No poem entered"
 *   description="Paste or type your poem to get started."
 *   actions={[
 *     { label: "Paste poem", onClick: handlePaste, primary: true }
 *   ]}
 * />
 * ```
 */
export function EmptyState({
  icon,
  title,
  description,
  actions = [],
  className = '',
  variant = 'default',
  testId = 'empty-state',
}: EmptyStateProps): ReactElement {
  log('Rendering empty state:', { title, variant, hasIcon: !!icon, actionCount: actions.length });

  const containerClass = [
    'empty-state',
    `empty-state--${variant}`,
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
      aria-label={title}
    >
      {icon && (
        <div className="empty-state__icon" aria-hidden="true">
          {icon}
        </div>
      )}

      <div className="empty-state__content">
        <h3 className="empty-state__title">{title}</h3>

        {description && (
          <p className="empty-state__description">{description}</p>
        )}
      </div>

      {actions.length > 0 && (
        <div className="empty-state__actions">
          {actions.map((action, index) => (
            <button
              key={`${action.label}-${index}`}
              type="button"
              className={`empty-state__action ${action.primary ? 'empty-state__action--primary' : 'empty-state__action--secondary'}`}
              onClick={action.onClick}
              aria-label={action.ariaLabel ?? action.label}
              disabled={action.disabled}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
