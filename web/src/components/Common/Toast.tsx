/**
 * Toast Component
 *
 * A notification toast system that supports stacking multiple toasts,
 * auto-dismiss, manual dismiss, and screen reader announcements.
 *
 * @module components/Common/Toast
 */

import { useEffect, useRef, type ReactElement, type ReactNode } from 'react';
import { useToastStore, type Toast as ToastData, type ToastType } from '@/stores/useToastStore';
import './Toast.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[Toast] ${message}`, ...args);
  }
};

// =============================================================================
// Types
// =============================================================================

/**
 * Props for individual Toast component
 */
export interface ToastProps {
  /** Toast data */
  toast: ToastData;
  /** Handler for dismissing the toast */
  onDismiss: (id: string) => void;
  /** Custom test ID */
  testId?: string;
}

/**
 * Props for ToastContainer component
 */
export interface ToastContainerProps {
  /** Position of the toast container */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  /** Custom test ID for the container */
  testId?: string;
}

// =============================================================================
// Icons
// =============================================================================

const icons: Record<ToastType, ReactNode> = {
  success: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
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

// =============================================================================
// Toast Component
// =============================================================================

/**
 * Individual toast notification component.
 *
 * Features:
 * - Styled based on toast type (success, error, warning, info)
 * - Manual dismiss button
 * - Accessible with proper ARIA attributes
 * - Animated entrance and exit
 *
 * @example
 * ```tsx
 * <Toast
 *   toast={{ id: '1', message: 'Success!', type: 'success', duration: 5000, createdAt: Date.now() }}
 *   onDismiss={(id) => console.log('Dismissed:', id)}
 * />
 * ```
 */
export function Toast({ toast, onDismiss, testId }: ToastProps): ReactElement {
  const { id, message, type } = toast;

  log('Rendering toast:', { id, type, message });

  const handleDismiss = (): void => {
    log('Toast dismissed manually:', id);
    onDismiss(id);
  };

  const containerClass = ['toast', `toast--${type}`].join(' ');

  return (
    <div
      className={containerClass}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      data-testid={testId ?? `toast-${id}`}
    >
      <div className="toast__icon" aria-hidden="true">
        {icons[type]}
      </div>

      <div className="toast__content">
        <p className="toast__message">{message}</p>
      </div>

      <button
        type="button"
        className="toast__dismiss"
        onClick={handleDismiss}
        aria-label="Dismiss notification"
        data-testid={`toast-dismiss-${id}`}
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

// =============================================================================
// ToastContainer Component
// =============================================================================

/**
 * Container component that renders all active toasts in a stacked layout.
 *
 * Features:
 * - Stacks multiple toasts
 * - Configurable position on screen
 * - Screen reader live region for announcements
 * - Connects to ToastStore for state management
 *
 * @example
 * ```tsx
 * // In App.tsx
 * function App() {
 *   return (
 *     <>
 *       <MainContent />
 *       <ToastContainer position="top-right" />
 *     </>
 *   );
 * }
 * ```
 */
export function ToastContainer({
  position = 'top-right',
  testId = 'toast-container',
}: ToastContainerProps): ReactElement | null {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  // Ref for the live region to announce new toasts to screen readers
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Announce new toasts to screen readers
  useEffect(() => {
    if (toasts.length > 0) {
      const latestToast = toasts[toasts.length - 1];
      log('Announcing toast to screen readers:', latestToast.message);

      // The live region will automatically announce content changes
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = latestToast.message;
      }
    }
  }, [toasts]);

  log('Rendering toast container with toasts:', toasts.length);

  const containerClass = ['toast-container', `toast-container--${position}`].join(' ');

  return (
    <>
      {/* Screen reader live region for announcements */}
      <div
        ref={liveRegionRef}
        className="toast-sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />

      {/* Toast container */}
      <div className={containerClass} data-testid={testId}>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </>
  );
}

// =============================================================================
// Exports
// =============================================================================

export type { ToastData, ToastType };
export default ToastContainer;
