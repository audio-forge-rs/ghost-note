/**
 * CountdownOverlay Component
 *
 * A full-screen overlay that displays a 3-2-1 countdown before recording starts,
 * giving users time to prepare.
 */

import { useEffect, useState, useCallback, useRef } from 'react';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[CountdownOverlay] ${message}`, ...args);
  }
};

/**
 * Props for CountdownOverlay component
 */
export interface CountdownOverlayProps {
  /** Whether the countdown is active */
  isActive: boolean;
  /** Number to start counting down from (default: 3) */
  startFrom?: number;
  /** Callback when countdown completes */
  onComplete?: () => void;
  /** Callback when countdown is cancelled */
  onCancel?: () => void;
  /** Duration of each count in milliseconds (default: 1000) */
  intervalMs?: number;
  /** Whether to show a cancel button */
  showCancelButton?: boolean;
  /** Custom message to display below the countdown */
  message?: string;
  /** Custom CSS class name */
  className?: string;
}

/**
 * CountdownOverlay displays a countdown before recording starts.
 *
 * Features:
 * - Configurable starting number
 * - Animated number transitions
 * - Optional cancel button
 * - Callback on completion
 * - Keyboard escape to cancel
 *
 * @example
 * ```tsx
 * <CountdownOverlay
 *   isActive={isCountingDown}
 *   startFrom={3}
 *   onComplete={() => startRecording()}
 *   onCancel={() => setIsCountingDown(false)}
 * />
 * ```
 */
export function CountdownOverlay({
  isActive,
  startFrom = 3,
  onComplete,
  onCancel,
  intervalMs = 1000,
  showCancelButton = true,
  message = 'Recording will start in...',
  className = '',
}: CountdownOverlayProps): React.ReactElement | null {
  const [count, setCount] = useState(startFrom);
  const [animationKey, setAnimationKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCompletedRef = useRef(false);
  const initializedRef = useRef(false);

  // Reset count when isActive becomes true or startFrom changes
  // Using requestAnimationFrame to defer the state update and avoid the lint warning
  useEffect(() => {
    if (isActive && !initializedRef.current) {
      log('Countdown started from:', startFrom);
      // Defer state update to avoid synchronous setState in effect
      const rafId = requestAnimationFrame(() => {
        setCount(startFrom);
        setAnimationKey((k) => k + 1);
      });
      hasCompletedRef.current = false;
      initializedRef.current = true;
      return () => cancelAnimationFrame(rafId);
    }
    if (!isActive) {
      initializedRef.current = false;
    }
  }, [isActive, startFrom]);

  // Countdown logic
  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setCount((prev) => {
        const next = prev - 1;
        log('Countdown:', prev, '->', next);

        if (next <= 0) {
          // Clear interval
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          // Call completion callback
          if (!hasCompletedRef.current) {
            hasCompletedRef.current = true;
            log('Countdown complete');
            // Use setTimeout to avoid state update during render
            setTimeout(() => {
              onComplete?.();
            }, 0);
          }

          return 0;
        }

        setAnimationKey((k) => k + 1);
        return next;
      });
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, intervalMs, onComplete]);

  // Handle escape key
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        log('Cancelled via escape key');
        onCancel?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, onCancel]);

  // Handle cancel click
  const handleCancel = useCallback(() => {
    log('Cancel button clicked');
    onCancel?.();
  }, [onCancel]);

  // Don't render if not active
  if (!isActive) {
    return null;
  }

  // Overlay styles
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    color: '#ffffff',
  };

  // Message styles
  const messageStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    opacity: 0.8,
    marginBottom: '1.5rem',
    textAlign: 'center',
  };

  // Count display styles
  const countStyle: React.CSSProperties = {
    fontSize: '8rem',
    fontWeight: 700,
    lineHeight: 1,
    animation: 'countdownPop 0.5s ease-out',
    textShadow: '0 0 60px rgba(239, 68, 68, 0.5)',
    color: count <= 1 ? '#ef4444' : '#ffffff',
  };

  // Cancel button styles
  const cancelButtonStyle: React.CSSProperties = {
    marginTop: '3rem',
    padding: '0.75rem 2rem',
    fontSize: '1rem',
    backgroundColor: 'transparent',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '8px',
    color: 'rgba(255, 255, 255, 0.7)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  // Progress ring configuration
  const ringSize = 200;
  const ringStroke = 4;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const progress = count / startFrom;
  const strokeDashoffset = ringCircumference * (1 - progress);

  return (
    <div
      className={`countdown-overlay ${className}`.trim()}
      style={overlayStyle}
      role="alertdialog"
      aria-modal="true"
      aria-label={`Recording countdown: ${count}`}
      data-testid="countdown-overlay"
    >
      {/* Message */}
      <p style={messageStyle} className="countdown-overlay__message">
        {message}
      </p>

      {/* Countdown ring and number */}
      <div
        className="countdown-overlay__counter"
        style={{ position: 'relative', width: ringSize, height: ringSize }}
      >
        {/* Progress ring */}
        <svg
          width={ringSize}
          height={ringSize}
          style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
          aria-hidden="true"
        >
          {/* Background ring */}
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={ringRadius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={ringStroke}
          />
          {/* Progress ring */}
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={ringRadius}
            fill="none"
            stroke={count <= 1 ? '#ef4444' : '#ffffff'}
            strokeWidth={ringStroke}
            strokeLinecap="round"
            strokeDasharray={ringCircumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: `stroke-dashoffset ${intervalMs}ms linear, stroke 0.3s` }}
            className="countdown-overlay__progress-ring"
          />
        </svg>

        {/* Count number */}
        <div
          key={animationKey}
          style={{
            ...countStyle,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          className="countdown-overlay__count"
          data-testid="countdown-count"
        >
          {count}
        </div>
      </div>

      {/* Cancel button */}
      {showCancelButton && (
        <button
          type="button"
          onClick={handleCancel}
          style={cancelButtonStyle}
          className="countdown-overlay__cancel"
          data-testid="countdown-cancel"
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
          }}
        >
          Cancel
        </button>
      )}

      {/* Hint text */}
      <p
        style={{
          marginTop: '1rem',
          fontSize: '0.875rem',
          opacity: 0.5,
        }}
        className="countdown-overlay__hint"
      >
        Press Escape to cancel
      </p>

      {/* CSS for animations */}
      <style>{`
        @keyframes countdownPop {
          0% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }

        .countdown-overlay__cancel:focus-visible {
          outline: 2px solid white;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}

export default CountdownOverlay;
