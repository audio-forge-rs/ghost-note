/**
 * RecordingTimer Component
 *
 * Displays the current recording duration in MM:SS or HH:MM:SS format.
 */

import { useMemo } from 'react';
import { formatDuration, type TimerFormat } from './timerUtils';

/**
 * Timer size options
 */
export type TimerSize = 'small' | 'medium' | 'large';

/**
 * Props for RecordingTimer component
 */
export interface RecordingTimerProps {
  /** Duration in seconds */
  duration: number;
  /** Whether the timer is actively running */
  isRunning?: boolean;
  /** Whether the timer is paused */
  isPaused?: boolean;
  /** Display format */
  format?: TimerFormat;
  /** Size of the timer display */
  size?: TimerSize;
  /** Whether to show the blinking indicator when running */
  showIndicator?: boolean;
  /** Custom CSS class name */
  className?: string;
  /** Label for accessibility */
  'aria-label'?: string;
}

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[RecordingTimer] ${message}`, ...args);
  }
};

/**
 * Size configurations
 */
const SIZES: Record<TimerSize, { fontSize: string; indicatorSize: number }> = {
  small: { fontSize: '1rem', indicatorSize: 6 },
  medium: { fontSize: '1.5rem', indicatorSize: 8 },
  large: { fontSize: '2rem', indicatorSize: 10 },
};

/**
 * RecordingTimer displays the current recording duration.
 *
 * Features:
 * - Multiple display formats (compact, full, minimal)
 * - Multiple sizes
 * - Optional blinking recording indicator
 * - Paused state visualization
 *
 * @example
 * ```tsx
 * <RecordingTimer
 *   duration={125}
 *   isRunning
 *   format="compact"
 * />
 * ```
 */
export function RecordingTimer({
  duration,
  isRunning = false,
  isPaused = false,
  format = 'compact',
  size = 'medium',
  showIndicator = true,
  className = '',
  'aria-label': ariaLabel,
}: RecordingTimerProps): React.ReactElement {
  const sizeConfig = SIZES[size];

  // Format the duration
  const formattedTime = useMemo(() => {
    const formatted = formatDuration(duration, format);
    log('Formatted duration:', duration, '->', formatted);
    return formatted;
  }, [duration, format]);

  // Container styles
  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    fontVariantNumeric: 'tabular-nums',
  };

  // Timer text styles
  const timerStyle: React.CSSProperties = {
    fontSize: sizeConfig.fontSize,
    fontWeight: 600,
    color: isPaused ? '#f59e0b' : isRunning ? '#ef4444' : 'inherit',
    opacity: isPaused ? 0.8 : 1,
    transition: 'color 0.2s, opacity 0.2s',
    letterSpacing: '0.05em',
  };

  // Indicator styles
  const indicatorStyle: React.CSSProperties = {
    width: sizeConfig.indicatorSize,
    height: sizeConfig.indicatorSize,
    borderRadius: '50%',
    backgroundColor: isPaused ? '#f59e0b' : '#ef4444',
    animation: isRunning && !isPaused ? 'timerBlink 1s ease-in-out infinite' : 'none',
  };

  // Determine state class
  const getStateClass = (): string => {
    if (isPaused) return 'recording-timer--paused';
    if (isRunning) return 'recording-timer--running';
    return 'recording-timer--idle';
  };

  // Build aria-label
  const getAriaLabel = (): string => {
    if (ariaLabel) return ariaLabel;

    const timeLabel = formattedTime
      .split(':')
      .map((part, index) => {
        const value = parseInt(part, 10);
        if (index === 0 && formattedTime.split(':').length === 3) {
          return `${value} hour${value !== 1 ? 's' : ''}`;
        }
        if (
          index === 1 ||
          (index === 0 && formattedTime.split(':').length === 2)
        ) {
          const minIndex = formattedTime.split(':').length === 3 ? 1 : 0;
          if (index === minIndex) {
            return `${value} minute${value !== 1 ? 's' : ''}`;
          }
        }
        return `${value} second${value !== 1 ? 's' : ''}`;
      })
      .join(' ');

    if (isPaused) return `Recording paused at ${timeLabel}`;
    if (isRunning) return `Recording: ${timeLabel}`;
    return `Duration: ${timeLabel}`;
  };

  return (
    <div
      className={`recording-timer recording-timer--${size} ${getStateClass()} ${className}`.trim()}
      style={containerStyle}
      role="timer"
      aria-label={getAriaLabel()}
      aria-live={isRunning ? 'off' : 'polite'}
      data-testid="recording-timer"
      data-running={isRunning}
      data-paused={isPaused}
    >
      {/* Recording indicator */}
      {showIndicator && (isRunning || isPaused) && (
        <div
          className="recording-timer__indicator"
          style={indicatorStyle}
          aria-hidden="true"
          data-testid="recording-indicator"
        />
      )}

      {/* Time display */}
      <span
        className="recording-timer__time"
        style={timerStyle}
        data-testid="recording-time"
      >
        {formattedTime}
      </span>

      {/* CSS for animations */}
      <style>{`
        @keyframes timerBlink {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }

        .recording-timer--paused .recording-timer__indicator {
          animation: timerBlink 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default RecordingTimer;
