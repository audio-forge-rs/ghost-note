/**
 * Tests for useSwipeGesture Hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSwipeGesture, type SwipeGestureCallbacks, type SwipeEvent } from './useSwipeGesture';

describe('useSwipeGesture', () => {
  let element: HTMLDivElement;
  let mockRef: { current: HTMLDivElement | null };

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
    mockRef = { current: element };
  });

  afterEach(() => {
    document.body.removeChild(element);
    vi.clearAllMocks();
  });

  const createTouchEvent = (
    type: string,
    clientX: number,
    clientY: number
  ): TouchEvent => {
    const touch = {
      clientX,
      clientY,
      identifier: 0,
      target: element,
      screenX: clientX,
      screenY: clientY,
      pageX: clientX,
      pageY: clientY,
      radiusX: 0,
      radiusY: 0,
      rotationAngle: 0,
      force: 1,
    };

    const event = new TouchEvent(type, {
      touches: type === 'touchstart' ? [touch as Touch] : [],
      changedTouches: [touch as Touch],
      bubbles: true,
      cancelable: true,
    });

    return event;
  };

  const simulateSwipe = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    duration: number = 100
  ): void => {
    const touchStart = createTouchEvent('touchstart', startX, startY);
    element.dispatchEvent(touchStart);

    // Simulate time passing
    vi.advanceTimersByTime(duration);

    const touchEnd = createTouchEvent('touchend', endX, endY);
    element.dispatchEvent(touchEnd);
  };

  describe('swipe detection', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('detects left swipe', () => {
      const onSwipeLeft = vi.fn();
      const callbacks: SwipeGestureCallbacks = { onSwipeLeft };

      renderHook(() => useSwipeGesture(mockRef, callbacks));

      // Swipe from right to left (negative deltaX)
      simulateSwipe(200, 100, 50, 100, 100);

      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
      expect(onSwipeLeft).toHaveBeenCalledWith(
        expect.objectContaining({
          direction: 'left',
          startX: 200,
          endX: 50,
        })
      );
    });

    it('detects right swipe', () => {
      const onSwipeRight = vi.fn();
      const callbacks: SwipeGestureCallbacks = { onSwipeRight };

      renderHook(() => useSwipeGesture(mockRef, callbacks));

      // Swipe from left to right (positive deltaX)
      simulateSwipe(50, 100, 200, 100, 100);

      expect(onSwipeRight).toHaveBeenCalledTimes(1);
      expect(onSwipeRight).toHaveBeenCalledWith(
        expect.objectContaining({
          direction: 'right',
          startX: 50,
          endX: 200,
        })
      );
    });

    it('detects up swipe', () => {
      const onSwipeUp = vi.fn();
      const callbacks: SwipeGestureCallbacks = { onSwipeUp };

      renderHook(() => useSwipeGesture(mockRef, callbacks));

      // Swipe from bottom to top (negative deltaY)
      simulateSwipe(100, 200, 100, 50, 100);

      expect(onSwipeUp).toHaveBeenCalledTimes(1);
      expect(onSwipeUp).toHaveBeenCalledWith(
        expect.objectContaining({
          direction: 'up',
          startY: 200,
          endY: 50,
        })
      );
    });

    it('detects down swipe', () => {
      const onSwipeDown = vi.fn();
      const callbacks: SwipeGestureCallbacks = { onSwipeDown };

      renderHook(() => useSwipeGesture(mockRef, callbacks));

      // Swipe from top to bottom (positive deltaY)
      simulateSwipe(100, 50, 100, 200, 100);

      expect(onSwipeDown).toHaveBeenCalledTimes(1);
      expect(onSwipeDown).toHaveBeenCalledWith(
        expect.objectContaining({
          direction: 'down',
          startY: 50,
          endY: 200,
        })
      );
    });

    it('calls generic onSwipe callback', () => {
      const onSwipe = vi.fn();
      const callbacks: SwipeGestureCallbacks = { onSwipe };

      renderHook(() => useSwipeGesture(mockRef, callbacks));

      simulateSwipe(200, 100, 50, 100, 100);

      expect(onSwipe).toHaveBeenCalledTimes(1);
    });

    it('provides swipe event data', () => {
      const onSwipe = vi.fn();
      const callbacks: SwipeGestureCallbacks = { onSwipe };

      renderHook(() => useSwipeGesture(mockRef, callbacks));

      simulateSwipe(200, 100, 50, 100, 100);

      const event: SwipeEvent = onSwipe.mock.calls[0][0];
      expect(event).toHaveProperty('direction');
      expect(event).toHaveProperty('distance');
      expect(event).toHaveProperty('duration');
      expect(event).toHaveProperty('velocity');
      expect(event).toHaveProperty('startX');
      expect(event).toHaveProperty('startY');
      expect(event).toHaveProperty('endX');
      expect(event).toHaveProperty('endY');
    });
  });

  describe('threshold options', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('ignores swipe below distance threshold', () => {
      const onSwipe = vi.fn();
      const callbacks: SwipeGestureCallbacks = { onSwipe };

      renderHook(() =>
        useSwipeGesture(mockRef, callbacks, {
          threshold: 100, // High threshold
        })
      );

      // Short swipe (only 50px)
      simulateSwipe(100, 100, 50, 100, 50);

      expect(onSwipe).not.toHaveBeenCalled();
    });

    it('detects swipe above distance threshold', () => {
      const onSwipe = vi.fn();
      const callbacks: SwipeGestureCallbacks = { onSwipe };

      renderHook(() =>
        useSwipeGesture(mockRef, callbacks, {
          threshold: 50,
        })
      );

      // Long enough swipe (150px)
      simulateSwipe(200, 100, 50, 100, 100);

      expect(onSwipe).toHaveBeenCalledTimes(1);
    });

    it('ignores swipe that takes too long', () => {
      const onSwipe = vi.fn();
      const callbacks: SwipeGestureCallbacks = { onSwipe };

      renderHook(() =>
        useSwipeGesture(mockRef, callbacks, {
          maxTime: 200,
        })
      );

      // Slow swipe (500ms)
      simulateSwipe(200, 100, 50, 100, 500);

      expect(onSwipe).not.toHaveBeenCalled();
    });

    it('ignores swipe with low velocity', () => {
      const onSwipe = vi.fn();
      const callbacks: SwipeGestureCallbacks = { onSwipe };

      renderHook(() =>
        useSwipeGesture(mockRef, callbacks, {
          minVelocity: 1.0, // High velocity requirement
        })
      );

      // Slow swipe (150px in 250ms = 0.6 px/ms)
      simulateSwipe(200, 100, 50, 100, 250);

      expect(onSwipe).not.toHaveBeenCalled();
    });
  });

  describe('enabled option', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('ignores swipes when disabled', () => {
      const onSwipe = vi.fn();
      const callbacks: SwipeGestureCallbacks = { onSwipe };

      renderHook(() =>
        useSwipeGesture(mockRef, callbacks, {
          enabled: false,
        })
      );

      simulateSwipe(200, 100, 50, 100, 100);

      expect(onSwipe).not.toHaveBeenCalled();
    });

    it('detects swipes when enabled', () => {
      const onSwipe = vi.fn();
      const callbacks: SwipeGestureCallbacks = { onSwipe };

      renderHook(() =>
        useSwipeGesture(mockRef, callbacks, {
          enabled: true,
        })
      );

      simulateSwipe(200, 100, 50, 100, 100);

      expect(onSwipe).toHaveBeenCalledTimes(1);
    });
  });

  describe('null ref handling', () => {
    it('handles null ref without error', () => {
      const nullRef = { current: null };
      const onSwipe = vi.fn();
      const callbacks: SwipeGestureCallbacks = { onSwipe };

      expect(() => {
        renderHook(() => useSwipeGesture(nullRef, callbacks));
      }).not.toThrow();
    });
  });

  describe('touch cancel', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('handles touch cancel without error', () => {
      const onSwipe = vi.fn();
      const callbacks: SwipeGestureCallbacks = { onSwipe };

      renderHook(() => useSwipeGesture(mockRef, callbacks));

      const touchStart = createTouchEvent('touchstart', 200, 100);
      element.dispatchEvent(touchStart);

      const touchCancel = new TouchEvent('touchcancel', {
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(touchCancel);

      // Subsequent touch end should not trigger swipe
      const touchEnd = createTouchEvent('touchend', 50, 100);
      element.dispatchEvent(touchEnd);

      expect(onSwipe).not.toHaveBeenCalled();
    });
  });

  describe('horizontal vs vertical detection', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('detects horizontal swipe when deltaX > deltaY', () => {
      const onSwipeLeft = vi.fn();
      const onSwipeUp = vi.fn();
      const callbacks: SwipeGestureCallbacks = { onSwipeLeft, onSwipeUp };

      renderHook(() => useSwipeGesture(mockRef, callbacks));

      // Diagonal swipe, but more horizontal (150px X, 50px Y)
      simulateSwipe(200, 100, 50, 50, 100);

      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
      expect(onSwipeUp).not.toHaveBeenCalled();
    });

    it('detects vertical swipe when deltaY > deltaX', () => {
      const onSwipeLeft = vi.fn();
      const onSwipeUp = vi.fn();
      const callbacks: SwipeGestureCallbacks = { onSwipeLeft, onSwipeUp };

      renderHook(() => useSwipeGesture(mockRef, callbacks));

      // Diagonal swipe, but more vertical (50px X, 150px Y)
      simulateSwipe(100, 200, 50, 50, 100);

      expect(onSwipeUp).toHaveBeenCalledTimes(1);
      expect(onSwipeLeft).not.toHaveBeenCalled();
    });
  });
});
