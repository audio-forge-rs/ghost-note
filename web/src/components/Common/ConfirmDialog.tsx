/**
 * ConfirmDialog Component
 *
 * A modal dialog for confirming destructive actions with clear messaging
 * about consequences. Supports keyboard navigation and focus trapping.
 *
 * @module components/Common/ConfirmDialog
 */

import { useEffect, useCallback, useRef, type ReactElement, type ReactNode } from 'react';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[ConfirmDialog] ${message}`, ...args);
  }
};

/**
 * Variant determines the visual styling of the confirm button
 */
export type ConfirmDialogVariant = 'danger' | 'warning' | 'info';

/**
 * Props for the ConfirmDialog component
 */
export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when the dialog should be closed (cancel/escape/overlay click) */
  onClose: () => void;
  /** Callback when the action is confirmed */
  onConfirm: () => void;
  /** Dialog title */
  title: string;
  /** Dialog message explaining the consequences */
  message: string | ReactNode;
  /** Text for the confirm button */
  confirmText?: string;
  /** Text for the cancel button */
  cancelText?: string;
  /** Visual variant (danger, warning, info) */
  variant?: ConfirmDialogVariant;
  /** Whether confirm action is in progress (shows loading state) */
  isConfirming?: boolean;
  /** Custom icon to display (optional) */
  icon?: ReactNode;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Default icons for each variant
 */
function DangerIcon(): ReactElement {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function WarningIcon(): ReactElement {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function InfoIcon(): ReactElement {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

/**
 * Get the default icon for a variant
 */
function getDefaultIcon(variant: ConfirmDialogVariant): ReactElement {
  switch (variant) {
    case 'danger':
      return <DangerIcon />;
    case 'warning':
      return <WarningIcon />;
    case 'info':
      return <InfoIcon />;
  }
}

/**
 * Loading spinner for confirm button
 */
function LoadingSpinner(): ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="confirm-dialog__spinner"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

/**
 * ConfirmDialog provides a modal for confirming destructive actions.
 *
 * Features:
 * - Clear title and message explaining consequences
 * - Three visual variants: danger, warning, info
 * - Keyboard accessible (Enter to confirm, Escape to cancel)
 * - Focus trapped within the modal
 * - Click outside to cancel
 * - Loading state during async confirmation
 * - Screen reader announcements
 *
 * @example
 * ```tsx
 * // Delete confirmation
 * <ConfirmDialog
 *   isOpen={showDeleteConfirm}
 *   onClose={() => setShowDeleteConfirm(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Recording"
 *   message="This will permanently delete this recording. This action cannot be undone."
 *   confirmText="Delete"
 *   variant="danger"
 * />
 *
 * // Clear confirmation with warning
 * <ConfirmDialog
 *   isOpen={showClearConfirm}
 *   onClose={() => setShowClearConfirm(false)}
 *   onConfirm={handleClear}
 *   title="Clear Poem"
 *   message="This will clear all text from the editor."
 *   confirmText="Clear"
 *   variant="warning"
 * />
 * ```
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isConfirming = false,
  icon,
  testId = 'confirm-dialog',
}: ConfirmDialogProps): ReactElement | null {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<Element | null>(null);

  log('Rendering dialog:', { isOpen, variant, isConfirming });

  // Store the previously focused element when dialog opens
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement;
      log('Stored previous active element:', previousActiveElementRef.current);
    }
  }, [isOpen]);

  // Focus management - focus cancel button when dialog opens
  useEffect(() => {
    if (isOpen && cancelButtonRef.current) {
      // Small delay to ensure the dialog is rendered
      const timeoutId = setTimeout(() => {
        cancelButtonRef.current?.focus();
        log('Focused cancel button');
      }, 10);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  // Restore focus when dialog closes
  useEffect(() => {
    if (!isOpen && previousActiveElementRef.current) {
      const elementToFocus = previousActiveElementRef.current as HTMLElement;
      if (elementToFocus && typeof elementToFocus.focus === 'function') {
        // Small delay to ensure the dialog is closed
        const timeoutId = setTimeout(() => {
          elementToFocus.focus();
          log('Restored focus to previous element');
        }, 10);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [isOpen]);

  // Handle escape key
  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      if (!isOpen || isConfirming) return;

      if (event.key === 'Escape') {
        log('Escape pressed, closing dialog');
        event.preventDefault();
        onClose();
        return;
      }

      // Focus trap - Tab key handling
      if (event.key === 'Tab') {
        const focusableElements = dialogRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey) {
          // Shift + Tab - going backwards
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
            log('Focus wrapped to last element');
          }
        } else {
          // Tab - going forwards
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
            log('Focus wrapped to first element');
          }
        }
      }
    },
    [isOpen, isConfirming, onClose]
  );

  // Add/remove keyboard listeners
  useEffect(() => {
    if (!isOpen) return;

    log('Adding keyboard listeners');
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      log('Removing keyboard listeners');
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      log('Prevented body scroll');

      return () => {
        document.body.style.overflow = previousOverflow;
        log('Restored body scroll');
      };
    }
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = useCallback(
    (event: React.MouseEvent): void => {
      if (event.target === event.currentTarget && !isConfirming) {
        log('Overlay clicked, closing dialog');
        onClose();
      }
    },
    [onClose, isConfirming]
  );

  // Handle confirm
  const handleConfirm = useCallback((): void => {
    if (isConfirming) return;
    log('Confirm button clicked');
    onConfirm();
  }, [onConfirm, isConfirming]);

  // Handle cancel
  const handleCancel = useCallback((): void => {
    if (isConfirming) return;
    log('Cancel button clicked');
    onClose();
  }, [onClose, isConfirming]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  // Determine the icon to display
  const displayIcon = icon ?? getDefaultIcon(variant);

  return (
    <div
      className="confirm-dialog__overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      data-testid={testId}
    >
      <div
        ref={dialogRef}
        className={`confirm-dialog confirm-dialog--${variant}`}
        data-testid={`${testId}-content`}
      >
        {/* Icon */}
        <div className={`confirm-dialog__icon confirm-dialog__icon--${variant}`}>
          {displayIcon}
        </div>

        {/* Header */}
        <h2
          id="confirm-dialog-title"
          className="confirm-dialog__title"
          data-testid={`${testId}-title`}
        >
          {title}
        </h2>

        {/* Message */}
        <div
          id="confirm-dialog-message"
          className="confirm-dialog__message"
          data-testid={`${testId}-message`}
        >
          {message}
        </div>

        {/* Actions */}
        <div className="confirm-dialog__actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="confirm-dialog__button confirm-dialog__button--cancel"
            onClick={handleCancel}
            disabled={isConfirming}
            data-testid={`${testId}-cancel`}
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            className={`confirm-dialog__button confirm-dialog__button--confirm confirm-dialog__button--${variant}`}
            onClick={handleConfirm}
            disabled={isConfirming}
            data-testid={`${testId}-confirm`}
          >
            {isConfirming ? (
              <>
                <LoadingSpinner />
                <span>Processing...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>

      <style>{`
        .confirm-dialog__overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 1rem;
          animation: confirm-dialog-fade-in 0.15s ease-out;
        }

        @keyframes confirm-dialog-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .confirm-dialog {
          background-color: var(--color-surface, white);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 400px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          animation: confirm-dialog-slide-in 0.2s ease-out;
        }

        @keyframes confirm-dialog-slide-in {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .confirm-dialog__icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
        }

        .confirm-dialog__icon--danger {
          background-color: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .confirm-dialog__icon--warning {
          background-color: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        .confirm-dialog__icon--info {
          background-color: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }

        .confirm-dialog__title {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--color-text-primary, #111827);
          text-align: center;
        }

        .confirm-dialog__message {
          font-size: 0.875rem;
          color: var(--color-text-secondary, #6b7280);
          text-align: center;
          line-height: 1.5;
        }

        .confirm-dialog__actions {
          display: flex;
          gap: 0.75rem;
          width: 100%;
          margin-top: 0.5rem;
        }

        .confirm-dialog__button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          border: none;
        }

        .confirm-dialog__button:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }

        .confirm-dialog__button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .confirm-dialog__button--cancel {
          background-color: var(--color-button-secondary-bg, #f3f4f6);
          color: var(--color-text-primary, #374151);
          border: 1px solid var(--color-border, #d1d5db);
        }

        .confirm-dialog__button--cancel:hover:not(:disabled) {
          background-color: var(--color-button-secondary-hover, #e5e7eb);
        }

        .confirm-dialog__button--confirm {
          color: white;
        }

        .confirm-dialog__button--danger {
          background-color: #ef4444;
        }

        .confirm-dialog__button--danger:hover:not(:disabled) {
          background-color: #dc2626;
        }

        .confirm-dialog__button--warning {
          background-color: #f59e0b;
        }

        .confirm-dialog__button--warning:hover:not(:disabled) {
          background-color: #d97706;
        }

        .confirm-dialog__button--info {
          background-color: #3b82f6;
        }

        .confirm-dialog__button--info:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .confirm-dialog__spinner {
          animation: confirm-dialog-spin 1s linear infinite;
        }

        @keyframes confirm-dialog-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Dark mode support */
        .dark .confirm-dialog {
          background-color: var(--color-surface-dark, #1f2937);
        }

        .dark .confirm-dialog__title {
          color: var(--color-text-primary-dark, #f9fafb);
        }

        .dark .confirm-dialog__message {
          color: var(--color-text-secondary-dark, #9ca3af);
        }

        .dark .confirm-dialog__button--cancel {
          background-color: var(--color-button-secondary-bg-dark, #374151);
          color: var(--color-text-primary-dark, #e5e7eb);
          border-color: var(--color-border-dark, #4b5563);
        }

        .dark .confirm-dialog__button--cancel:hover:not(:disabled) {
          background-color: var(--color-button-secondary-hover-dark, #4b5563);
        }

        .dark .confirm-dialog__icon--danger {
          background-color: rgba(239, 68, 68, 0.15);
        }

        .dark .confirm-dialog__icon--warning {
          background-color: rgba(245, 158, 11, 0.15);
        }

        .dark .confirm-dialog__icon--info {
          background-color: rgba(59, 130, 246, 0.15);
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .confirm-dialog__overlay,
          .confirm-dialog,
          .confirm-dialog__spinner {
            animation: none;
          }
        }

        /* Mobile responsive */
        @media (max-width: 480px) {
          .confirm-dialog {
            max-width: calc(100% - 2rem);
            padding: 1.25rem;
          }

          .confirm-dialog__actions {
            flex-direction: column-reverse;
          }

          .confirm-dialog__button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default ConfirmDialog;
