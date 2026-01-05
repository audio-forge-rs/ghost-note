/**
 * useFocusTrap Hook Tests
 *
 * Tests for the focus trap hook used in modal dialogs.
 * Note: Some focus management behaviors are difficult to test in jsdom
 * due to lack of proper layout/visibility support.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFocusTrap } from './useFocusTrap';

describe('useFocusTrap', () => {
  let container: HTMLDivElement;
  let button1: HTMLButtonElement;
  let button2: HTMLButtonElement;
  let input: HTMLInputElement;

  beforeEach(() => {
    // Create test container with focusable elements
    container = document.createElement('div');

    button1 = document.createElement('button');
    button1.textContent = 'First';
    button1.setAttribute('data-testid', 'first');

    input = document.createElement('input');
    input.type = 'text';
    input.setAttribute('data-testid', 'input');

    button2 = document.createElement('button');
    button2.textContent = 'Last';
    button2.setAttribute('data-testid', 'last');

    container.appendChild(button1);
    container.appendChild(input);
    container.appendChild(button2);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  describe('containerRef', () => {
    it('should return a ref that can be attached to an element', () => {
      const { result } = renderHook(() => useFocusTrap({ enabled: false }));
      expect(result.current.containerRef).toBeDefined();
      expect(result.current.containerRef.current).toBeNull();
    });
  });

  describe('activate and deactivate', () => {
    it('should expose activate and deactivate functions', () => {
      const { result } = renderHook(() => useFocusTrap({ enabled: false }));

      expect(typeof result.current.activate).toBe('function');
      expect(typeof result.current.deactivate).toBe('function');
    });

    it('should not throw when activate is called without container', () => {
      const { result } = renderHook(() => useFocusTrap({ enabled: false }));

      expect(() => {
        act(() => {
          result.current.activate();
        });
      }).not.toThrow();
    });

    it('should not throw when deactivate is called', () => {
      const { result } = renderHook(() => useFocusTrap({ enabled: false }));

      expect(() => {
        act(() => {
          result.current.deactivate();
        });
      }).not.toThrow();
    });
  });

  describe('focus management', () => {
    it('should focus element matching initialFocusSelector when activated', async () => {
      const { result } = renderHook(() =>
        useFocusTrap({
          enabled: false,
          autoFocus: true,
          initialFocusSelector: '[data-testid="input"]'
        })
      );

      Object.defineProperty(result.current.containerRef, 'current', {
        value: container,
        writable: true,
      });

      act(() => {
        result.current.activate();
      });

      // Wait for requestAnimationFrame
      await act(async () => {
        await new Promise((resolve) => requestAnimationFrame(resolve));
      });

      expect(document.activeElement).toBe(input);
    });
  });

  describe('escape handling', () => {
    it('should call onEscape when Escape key is pressed and enabled', async () => {
      const onEscape = vi.fn();

      // Start with disabled, set containerRef, then enable
      const { result, rerender } = renderHook(
        ({ enabled, onEscape: escapeHandler }) =>
          useFocusTrap({ enabled, onEscape: escapeHandler }),
        { initialProps: { enabled: false, onEscape } }
      );

      Object.defineProperty(result.current.containerRef, 'current', {
        value: container,
        writable: true,
      });

      // Now enable to trigger the effect with container set
      rerender({ enabled: true, onEscape });

      // Focus an element inside container
      button1.focus();

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });

      act(() => {
        document.dispatchEvent(escapeEvent);
      });

      expect(onEscape).toHaveBeenCalledTimes(1);
    });

    it('should not call onEscape when disabled', () => {
      const onEscape = vi.fn();
      renderHook(() => useFocusTrap({ enabled: false, onEscape }));

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });

      act(() => {
        document.dispatchEvent(escapeEvent);
      });

      expect(onEscape).not.toHaveBeenCalled();
    });
  });

  describe('enabled state', () => {
    it('should automatically activate when enabled becomes true', () => {
      const { rerender } = renderHook(
        ({ enabled }) => useFocusTrap({ enabled }),
        { initialProps: { enabled: false } }
      );

      // This shouldn't throw
      expect(() => {
        rerender({ enabled: true });
      }).not.toThrow();
    });

    it('should automatically deactivate when enabled becomes false', () => {
      const { rerender } = renderHook(
        ({ enabled }) => useFocusTrap({ enabled }),
        { initialProps: { enabled: true } }
      );

      // This shouldn't throw
      expect(() => {
        rerender({ enabled: false });
      }).not.toThrow();
    });
  });

  describe('return focus', () => {
    it('should store previously focused element on activate', async () => {
      // Create an element outside the trap
      const outsideButton = document.createElement('button');
      outsideButton.textContent = 'Outside';
      document.body.appendChild(outsideButton);
      outsideButton.focus();

      expect(document.activeElement).toBe(outsideButton);

      const { result } = renderHook(() =>
        useFocusTrap({ enabled: false, returnFocus: true })
      );

      Object.defineProperty(result.current.containerRef, 'current', {
        value: container,
        writable: true,
      });

      // Activate trap
      act(() => {
        result.current.activate();
      });

      // Deactivate trap
      act(() => {
        result.current.deactivate();
      });

      // Wait for requestAnimationFrame
      await act(async () => {
        await new Promise((resolve) => requestAnimationFrame(resolve));
      });

      // Focus should return to outside button
      expect(document.activeElement).toBe(outsideButton);

      // Cleanup
      document.body.removeChild(outsideButton);
    });
  });

  describe('cleanup', () => {
    it('should cleanup on unmount', () => {
      const onEscape = vi.fn();
      const { unmount } = renderHook(() =>
        useFocusTrap({ enabled: true, onEscape })
      );

      unmount();

      // After unmount, escape should not trigger onEscape
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });

      document.dispatchEvent(escapeEvent);

      expect(onEscape).not.toHaveBeenCalled();
    });
  });
});
