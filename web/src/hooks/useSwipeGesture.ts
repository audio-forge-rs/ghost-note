/**
 * useSwipeGesture Hook
 *
 * Provides swipe gesture detection for touch-enabled devices.
 * Used for navigating between views on mobile with intuitive swipe gestures.
 *
 * @module hooks/useSwipeGesture
 */

import { useEffect, useRef, useCallback } from 'react';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[useSwipeGesture] ${message}`, ...args);
  }
};

/**
 * Swipe direction types
 */
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

/**
 * Configuration options for swipe detection
 */
export interface SwipeGestureOptions {
  /** Minimum distance in pixels to consider a swipe (default: 50) */
  threshold?: number;
  /** Maximum time in ms for a swipe gesture (default: 300) */
  maxTime?: number;
  /** Minimum velocity required for swipe (pixels/ms, default: 0.3) */
  minVelocity?: number;
  /** Whether to prevent default touch behavior (default: false) */
  preventDefault?: boolean;
  /** Whether swipe detection is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Swipe event data
 */
export interface SwipeEvent {
  /** Direction of the swipe */
  direction: SwipeDirection;
  /** Distance traveled in pixels */
  distance: number;
  /** Duration of the swipe in ms */
  duration: number;
  /** Velocity in pixels/ms */
  velocity: number;
  /** Starting X coordinate */
  startX: number;
  /** Starting Y coordinate */
  startY: number;
  /** Ending X coordinate */
  endX: number;
  /** Ending Y coordinate */
  endY: number;
}

/**
 * Swipe gesture callbacks
 */
export interface SwipeGestureCallbacks {
  /** Called when a swipe is detected */
  onSwipe?: (event: SwipeEvent) => void;
  /** Called when a left swipe is detected */
  onSwipeLeft?: (event: SwipeEvent) => void;
  /** Called when a right swipe is detected */
  onSwipeRight?: (event: SwipeEvent) => void;
  /** Called when an up swipe is detected */
  onSwipeUp?: (event: SwipeEvent) => void;
  /** Called when a down swipe is detected */
  onSwipeDown?: (event: SwipeEvent) => void;
}

/**
 * Touch start data for tracking gesture
 */
interface TouchStart {
  x: number;
  y: number;
  time: number;
}

/**
 * Hook for detecting swipe gestures on touch devices.
 *
 * @param ref - React ref to the element to detect swipes on
 * @param callbacks - Callback functions for swipe events
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 *
 * useSwipeGesture(containerRef, {
 *   onSwipeLeft: () => navigateNext(),
 *   onSwipeRight: () => navigatePrev(),
 * });
 *
 * return <div ref={containerRef}>Content</div>;
 * ```
 */
export function useSwipeGesture<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  callbacks: SwipeGestureCallbacks,
  options: SwipeGestureOptions = {}
): void {
  const {
    threshold = 50,
    maxTime = 300,
    minVelocity = 0.3,
    preventDefault = false,
    enabled = true,
  } = options;

  const touchStartRef = useRef<TouchStart | null>(null);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;

      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };

      log('Touch start:', touchStartRef.current);
    },
    [enabled]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const endX = touch.clientX;
      const endY = touch.clientY;
      const endTime = Date.now();

      const { x: startX, y: startY, time: startTime } = touchStartRef.current;

      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const duration = endTime - startTime;
      const distanceX = Math.abs(deltaX);
      const distanceY = Math.abs(deltaY);

      log('Touch end:', { deltaX, deltaY, duration, distanceX, distanceY });

      // Check if gesture is within time limit
      if (duration > maxTime) {
        log('Gesture too slow, ignoring');
        touchStartRef.current = null;
        return;
      }

      // Determine if this is a horizontal or vertical swipe
      const isHorizontal = distanceX > distanceY;
      const distance = isHorizontal ? distanceX : distanceY;
      const velocity = distance / duration;

      // Check if distance and velocity meet thresholds
      if (distance < threshold || velocity < minVelocity) {
        log('Gesture did not meet thresholds:', { distance, velocity, threshold, minVelocity });
        touchStartRef.current = null;
        return;
      }

      // Determine direction
      let direction: SwipeDirection;
      if (isHorizontal) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }

      const swipeEvent: SwipeEvent = {
        direction,
        distance,
        duration,
        velocity,
        startX,
        startY,
        endX,
        endY,
      };

      log('Swipe detected:', swipeEvent);

      if (preventDefault) {
        e.preventDefault();
      }

      // Call generic swipe callback
      callbacks.onSwipe?.(swipeEvent);

      // Call direction-specific callbacks
      switch (direction) {
        case 'left':
          callbacks.onSwipeLeft?.(swipeEvent);
          break;
        case 'right':
          callbacks.onSwipeRight?.(swipeEvent);
          break;
        case 'up':
          callbacks.onSwipeUp?.(swipeEvent);
          break;
        case 'down':
          callbacks.onSwipeDown?.(swipeEvent);
          break;
      }

      touchStartRef.current = null;
    },
    [enabled, threshold, maxTime, minVelocity, preventDefault, callbacks]
  );

  const handleTouchCancel = useCallback(() => {
    log('Touch cancelled');
    touchStartRef.current = null;
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    log('Attaching swipe gesture listeners');

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: !preventDefault });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      log('Detaching swipe gesture listeners');
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [ref, enabled, handleTouchStart, handleTouchEnd, handleTouchCancel, preventDefault]);
}

export default useSwipeGesture;
