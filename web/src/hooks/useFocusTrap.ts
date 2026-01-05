/**
 * useFocusTrap Hook
 *
 * Traps focus within a container element, ensuring keyboard users
 * can't tab out of modal dialogs or other focus-contained areas.
 *
 * @module hooks/useFocusTrap
 */

import { useEffect, useRef, useCallback, type RefObject } from 'react';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[useFocusTrap] ${message}`, ...args);
  }
};

/**
 * Selector for focusable elements
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
].join(',');

/**
 * Options for the focus trap hook
 */
export interface FocusTrapOptions {
  /** Whether the trap is active (default: true) */
  enabled?: boolean;
  /** Focus the first element when trap activates (default: true) */
  autoFocus?: boolean;
  /** Return focus to the previously focused element on deactivation (default: true) */
  returnFocus?: boolean;
  /** Selector for the initial focus target (overrides autoFocus behavior) */
  initialFocusSelector?: string;
  /** Callback when escape key is pressed */
  onEscape?: () => void;
}

/**
 * Return type for useFocusTrap hook
 */
export interface FocusTrapReturn {
  /** Ref to attach to the container element */
  containerRef: RefObject<HTMLElement | null>;
  /** Manually activate the focus trap */
  activate: () => void;
  /** Manually deactivate the focus trap */
  deactivate: () => void;
}

/**
 * Gets all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  return Array.from(elements).filter((el) => {
    // Filter out elements that are not visible or are hidden
    const style = window.getComputedStyle(el);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      el.offsetParent !== null
    );
  });
}

/**
 * useFocusTrap traps keyboard focus within a container element.
 *
 * Features:
 * - Traps Tab and Shift+Tab within container
 * - Auto-focuses first focusable element
 * - Restores focus to previous element on deactivation
 * - Handles escape key
 * - Supports custom initial focus
 *
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   const { containerRef } = useFocusTrap({
 *     enabled: isOpen,
 *     onEscape: onClose,
 *   });
 *
 *   if (!isOpen) return null;
 *
 *   return (
 *     <div ref={containerRef} role="dialog" aria-modal="true">
 *       <button onClick={onClose}>Close</button>
 *       <input type="text" />
 *     </div>
 *   );
 * }
 * ```
 */
export function useFocusTrap(options: FocusTrapOptions = {}): FocusTrapReturn {
  const {
    enabled = true,
    autoFocus = true,
    returnFocus = true,
    initialFocusSelector,
    onEscape,
  } = options;

  const containerRef = useRef<HTMLElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const isActiveRef = useRef(false);

  const activate = useCallback(() => {
    const container = containerRef.current;
    if (!container || isActiveRef.current) return;

    log('Activating focus trap');
    isActiveRef.current = true;

    // Store the currently focused element
    previouslyFocusedRef.current = document.activeElement as HTMLElement;

    // Focus the initial element
    if (autoFocus || initialFocusSelector) {
      requestAnimationFrame(() => {
        if (!containerRef.current) return;

        let targetElement: HTMLElement | null = null;

        if (initialFocusSelector) {
          targetElement = containerRef.current.querySelector<HTMLElement>(
            initialFocusSelector
          );
        }

        if (!targetElement) {
          const focusables = getFocusableElements(containerRef.current);
          targetElement = focusables[0];
        }

        if (targetElement) {
          log('Focusing initial element:', targetElement);
          targetElement.focus();
        }
      });
    }
  }, [autoFocus, initialFocusSelector]);

  const deactivate = useCallback(() => {
    if (!isActiveRef.current) return;

    log('Deactivating focus trap');
    isActiveRef.current = false;

    // Return focus to previously focused element
    if (returnFocus && previouslyFocusedRef.current) {
      log('Returning focus to previous element');
      requestAnimationFrame(() => {
        previouslyFocusedRef.current?.focus();
        previouslyFocusedRef.current = null;
      });
    }
  }, [returnFocus]);

  useEffect(() => {
    if (enabled) {
      activate();
    } else {
      deactivate();
    }

    return () => {
      if (isActiveRef.current) {
        deactivate();
      }
    };
  }, [enabled, activate, deactivate]);

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      // Handle Escape key
      if (event.key === 'Escape' && onEscape) {
        log('Escape key pressed');
        event.preventDefault();
        onEscape();
        return;
      }

      // Handle Tab key
      if (event.key !== 'Tab') return;

      const focusables = getFocusableElements(container);
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusables[0];
      const lastElement = focusables[focusables.length - 1];
      const activeElement = document.activeElement;

      log('Tab pressed:', {
        shiftKey: event.shiftKey,
        activeElement: activeElement?.tagName,
        first: firstElement?.tagName,
        last: lastElement?.tagName,
      });

      if (event.shiftKey) {
        // Shift+Tab: going backwards
        if (activeElement === firstElement || !container.contains(activeElement)) {
          event.preventDefault();
          lastElement.focus();
          log('Wrapped focus to last element');
        }
      } else {
        // Tab: going forwards
        if (activeElement === lastElement || !container.contains(activeElement)) {
          event.preventDefault();
          firstElement.focus();
          log('Wrapped focus to first element');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    log('Focus trap event listener added');

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      log('Focus trap event listener removed');
    };
  }, [enabled, onEscape]);

  return {
    containerRef,
    activate,
    deactivate,
  };
}

export default useFocusTrap;
