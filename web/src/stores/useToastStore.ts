/**
 * Ghost Note - Toast Store
 *
 * Manages toast notifications for user feedback with support for
 * stacking multiple toasts, auto-dismiss, and accessibility.
 *
 * @module stores/useToastStore
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// =============================================================================
// Types
// =============================================================================

/**
 * Toast notification types/severity levels
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Individual toast notification
 */
export interface Toast {
  /** Unique identifier for the toast */
  id: string;
  /** Toast message content */
  message: string;
  /** Toast type/severity */
  type: ToastType;
  /** Auto-dismiss timeout in milliseconds (0 = no auto-dismiss) */
  duration: number;
  /** When the toast was created */
  createdAt: number;
}

/**
 * Options for adding a new toast
 */
export interface ToastOptions {
  /** Toast type/severity (default: 'info') */
  type?: ToastType;
  /** Auto-dismiss timeout in ms (default: 5000, 0 = no auto-dismiss) */
  duration?: number;
}

/**
 * Toast store state
 */
export interface ToastState {
  /** Array of active toasts (stacked, newest last) */
  toasts: Toast[];
  /** Maximum number of toasts to display at once */
  maxToasts: number;
  /** Default duration for auto-dismiss in ms */
  defaultDuration: number;
}

/**
 * Toast store actions
 */
export interface ToastActions {
  /** Add a new toast notification */
  addToast: (message: string, options?: ToastOptions) => string;
  /** Remove a toast by ID */
  removeToast: (id: string) => void;
  /** Clear all toasts */
  clearAll: () => void;
  /** Convenience method: show success toast */
  success: (message: string, duration?: number) => string;
  /** Convenience method: show error toast */
  error: (message: string, duration?: number) => string;
  /** Convenience method: show warning toast */
  warning: (message: string, duration?: number) => string;
  /** Convenience method: show info toast */
  info: (message: string, duration?: number) => string;
  /** Update default duration */
  setDefaultDuration: (duration: number) => void;
  /** Update max toasts limit */
  setMaxToasts: (max: number) => void;
  /** Reset store to initial state */
  reset: () => void;
}

export type ToastStore = ToastState & ToastActions;

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_DURATION = 5000; // 5 seconds
const MAX_TOASTS = 5;

// =============================================================================
// Initial State
// =============================================================================

const initialState: ToastState = {
  toasts: [],
  maxToasts: MAX_TOASTS,
  defaultDuration: DEFAULT_DURATION,
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate a unique ID for a toast
 */
function generateId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Logging helper for debugging
const DEBUG = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[ToastStore] ${message}`, ...args);
  }
};

// =============================================================================
// Store Implementation
// =============================================================================

// Store timers for auto-dismiss
const dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const useToastStore = create<ToastStore>()(
  devtools(
    (set, get) => ({
      // State
      ...initialState,

      // Actions
      addToast: (message: string, options?: ToastOptions): string => {
        const state = get();
        const id = generateId();
        const type = options?.type ?? 'info';
        const duration = options?.duration ?? state.defaultDuration;

        log('Adding toast:', { id, message, type, duration });

        const newToast: Toast = {
          id,
          message,
          type,
          duration,
          createdAt: Date.now(),
        };

        set(
          (state) => {
            // Add new toast to end (stacking)
            let newToasts = [...state.toasts, newToast];

            // If we exceed max, remove oldest toasts
            if (newToasts.length > state.maxToasts) {
              const toRemove = newToasts.slice(0, newToasts.length - state.maxToasts);
              // Clear timers for removed toasts
              for (const toast of toRemove) {
                const timer = dismissTimers.get(toast.id);
                if (timer) {
                  clearTimeout(timer);
                  dismissTimers.delete(toast.id);
                }
              }
              newToasts = newToasts.slice(-state.maxToasts);
            }

            return { toasts: newToasts };
          },
          false,
          'addToast'
        );

        // Set up auto-dismiss timer if duration > 0
        if (duration > 0) {
          const timer = setTimeout(() => {
            log('Auto-dismissing toast:', id);
            get().removeToast(id);
          }, duration);
          dismissTimers.set(id, timer);
        }

        return id;
      },

      removeToast: (id: string): void => {
        log('Removing toast:', id);

        // Clear any existing timer
        const timer = dismissTimers.get(id);
        if (timer) {
          clearTimeout(timer);
          dismissTimers.delete(id);
        }

        set(
          (state) => ({
            toasts: state.toasts.filter((toast) => toast.id !== id),
          }),
          false,
          'removeToast'
        );
      },

      clearAll: (): void => {
        log('Clearing all toasts');

        // Clear all timers
        for (const timer of dismissTimers.values()) {
          clearTimeout(timer);
        }
        dismissTimers.clear();

        set({ toasts: [] }, false, 'clearAll');
      },

      success: (message: string, duration?: number): string => {
        return get().addToast(message, { type: 'success', duration });
      },

      error: (message: string, duration?: number): string => {
        return get().addToast(message, { type: 'error', duration });
      },

      warning: (message: string, duration?: number): string => {
        return get().addToast(message, { type: 'warning', duration });
      },

      info: (message: string, duration?: number): string => {
        return get().addToast(message, { type: 'info', duration });
      },

      setDefaultDuration: (duration: number): void => {
        log('Setting default duration:', duration);
        set({ defaultDuration: duration }, false, 'setDefaultDuration');
      },

      setMaxToasts: (max: number): void => {
        log('Setting max toasts:', max);
        set(
          (state) => {
            // If current toasts exceed new max, trim oldest
            if (state.toasts.length > max) {
              const toRemove = state.toasts.slice(0, state.toasts.length - max);
              for (const toast of toRemove) {
                const timer = dismissTimers.get(toast.id);
                if (timer) {
                  clearTimeout(timer);
                  dismissTimers.delete(toast.id);
                }
              }
              return {
                maxToasts: max,
                toasts: state.toasts.slice(-max),
              };
            }
            return { maxToasts: max };
          },
          false,
          'setMaxToasts'
        );
      },

      reset: (): void => {
        log('Resetting store');

        // Clear all timers
        for (const timer of dismissTimers.values()) {
          clearTimeout(timer);
        }
        dismissTimers.clear();

        set(initialState, false, 'reset');
      },
    }),
    { name: 'ToastStore' }
  )
);

// =============================================================================
// Selectors
// =============================================================================

/**
 * Check if there are any active toasts
 */
export const selectHasToasts = (state: ToastStore): boolean => {
  return state.toasts.length > 0;
};

/**
 * Get the number of active toasts
 */
export const selectToastCount = (state: ToastStore): number => {
  return state.toasts.length;
};

/**
 * Get toasts of a specific type
 */
export const selectToastsByType =
  (type: ToastType) =>
  (state: ToastStore): Toast[] => {
    return state.toasts.filter((toast) => toast.type === type);
  };

/**
 * Get the most recent toast
 */
export const selectLatestToast = (state: ToastStore): Toast | null => {
  return state.toasts.length > 0 ? state.toasts[state.toasts.length - 1] : null;
};

/**
 * Check if a specific toast exists
 */
export const selectToastExists =
  (id: string) =>
  (state: ToastStore): boolean => {
    return state.toasts.some((toast) => toast.id === id);
  };

/**
 * Get error toasts count
 */
export const selectErrorCount = (state: ToastStore): number => {
  return state.toasts.filter((toast) => toast.type === 'error').length;
};

/**
 * Get success toasts count
 */
export const selectSuccessCount = (state: ToastStore): number => {
  return state.toasts.filter((toast) => toast.type === 'success').length;
};
