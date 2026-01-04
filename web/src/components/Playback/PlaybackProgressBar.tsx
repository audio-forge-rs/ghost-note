/**
 * PlaybackProgressBar Component
 *
 * A seekable progress bar for melody playback that shows current position
 * and allows users to seek to any point in the melody.
 *
 * @module components/Playback/PlaybackProgressBar
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import type { ReactElement, CSSProperties, MouseEvent, TouchEvent } from 'react';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[PlaybackProgressBar] ${message}`, ...args);
  }
};

/**
 * Props for PlaybackProgressBar component
 */
export interface PlaybackProgressBarProps {
  /** Current playback position in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Callback when user seeks to a new position */
  onSeek: (time: number) => void;
  /** Whether seeking is disabled */
  disabled?: boolean;
  /** Whether to show time labels (default: true) */
  showTimeLabels?: boolean;
  /** Whether to show progress percentage (default: false) */
  showPercentage?: boolean;
  /** Height of the progress bar track */
  height?: number;
  /** Color of the progress fill */
  progressColor?: string;
  /** Color of the track background */
  trackColor?: string;
  /** Color of the seek handle */
  handleColor?: string;
  /** Whether to show the seek handle (default: true) */
  showHandle?: boolean;
  /** Whether to show buffered/loaded progress */
  bufferedTime?: number;
  /** Custom CSS class */
  className?: string;
  /** Custom inline styles */
  style?: CSSProperties;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Format time as MM:SS or HH:MM:SS for longer durations
 */
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * PlaybackProgressBar displays and controls playback position.
 *
 * Features:
 * - Visual progress indication
 * - Click/drag to seek
 * - Touch support for mobile
 * - Time labels with current and total time
 * - Optional buffered progress display
 * - Customizable appearance
 *
 * @example
 * ```tsx
 * <PlaybackProgressBar
 *   currentTime={45}
 *   duration={180}
 *   onSeek={(time) => player.seekTo(time)}
 *   showTimeLabels
 * />
 * ```
 */
export function PlaybackProgressBar({
  currentTime,
  duration,
  onSeek,
  disabled = false,
  showTimeLabels = true,
  showPercentage = false,
  height = 8,
  progressColor = '#10b981',
  trackColor = '#e5e7eb',
  handleColor = '#ffffff',
  showHandle = true,
  bufferedTime,
  className = '',
  style,
  testId = 'playback-progress-bar',
}: PlaybackProgressBarProps): ReactElement {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  // Calculate progress percentage
  const progressPercent = useMemo(() => {
    if (duration === 0) return 0;
    return Math.min(100, Math.max(0, (currentTime / duration) * 100));
  }, [currentTime, duration]);

  // Calculate buffered percentage
  const bufferedPercent = useMemo(() => {
    if (duration === 0 || bufferedTime === undefined) return 0;
    return Math.min(100, Math.max(0, (bufferedTime / duration) * 100));
  }, [bufferedTime, duration]);

  // Calculate time from position in track
  const calculateTimeFromPosition = useCallback(
    (clientX: number): number => {
      if (!trackRef.current || duration === 0) return 0;

      const rect = trackRef.current.getBoundingClientRect();
      const position = (clientX - rect.left) / rect.width;
      const clampedPosition = Math.max(0, Math.min(1, position));
      return clampedPosition * duration;
    },
    [duration]
  );

  // Handle click on track
  const handleTrackClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (disabled) return;

      const time = calculateTimeFromPosition(e.clientX);
      log('Track clicked, seeking to:', time);
      onSeek(time);
    },
    [disabled, calculateTimeFromPosition, onSeek]
  );

  // Handle mouse down for dragging
  const handleMouseDown = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();

      setIsDragging(true);
      const time = calculateTimeFromPosition(e.clientX);
      onSeek(time);

      const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
        const newTime = calculateTimeFromPosition(moveEvent.clientX);
        onSeek(newTime);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [disabled, calculateTimeFromPosition, onSeek]
  );

  // Handle touch events for mobile
  const handleTouchStart = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (disabled || e.touches.length === 0) return;

      setIsDragging(true);
      const time = calculateTimeFromPosition(e.touches[0].clientX);
      onSeek(time);
    },
    [disabled, calculateTimeFromPosition, onSeek]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (disabled || !isDragging || e.touches.length === 0) return;

      const time = calculateTimeFromPosition(e.touches[0].clientX);
      onSeek(time);
    },
    [disabled, isDragging, calculateTimeFromPosition, onSeek]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle mouse move for hover preview
  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!trackRef.current || disabled) return;

      const rect = trackRef.current.getBoundingClientRect();
      const position = ((e.clientX - rect.left) / rect.width) * 100;
      const time = calculateTimeFromPosition(e.clientX);

      setHoverPosition(Math.max(0, Math.min(100, position)));
      setHoverTime(time);
    },
    [disabled, calculateTimeFromPosition]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverPosition(null);
    setHoverTime(null);
  }, []);

  // Styles
  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    width: '100%',
    ...style,
  };

  const trackContainerStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    height: `${height}px`,
    borderRadius: `${height / 2}px`,
    backgroundColor: trackColor,
    cursor: disabled ? 'not-allowed' : 'pointer',
    overflow: 'visible',
    touchAction: 'none',
  };

  const bufferedStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: `${bufferedPercent}%`,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: `${height / 2}px`,
    transition: isDragging ? 'none' : 'width 0.1s ease',
  };

  const progressStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: `${progressPercent}%`,
    backgroundColor: progressColor,
    borderRadius: `${height / 2}px`,
    transition: isDragging ? 'none' : 'width 0.1s ease',
  };

  const handleStyle: CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: `${progressPercent}%`,
    transform: 'translate(-50%, -50%)',
    width: `${height + 8}px`,
    height: `${height + 8}px`,
    borderRadius: '50%',
    backgroundColor: handleColor,
    border: `2px solid ${progressColor}`,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
    cursor: disabled ? 'not-allowed' : 'grab',
    transition: isDragging ? 'none' : 'left 0.1s ease',
    opacity: disabled ? 0.5 : 1,
  };

  const hoverIndicatorStyle: CSSProperties = {
    position: 'absolute',
    top: '-24px',
    left: `${hoverPosition}%`,
    transform: 'translateX(-50%)',
    padding: '2px 6px',
    backgroundColor: '#1f2937',
    color: 'white',
    fontSize: '0.75rem',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    zIndex: 10,
  };

  const timeLabelContainerStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.75rem',
    color: '#6b7280',
  };

  return (
    <div
      className={`playback-progress-bar ${className}`.trim()}
      style={containerStyle}
      data-testid={testId}
    >
      {/* Progress track */}
      <div
        ref={trackRef}
        style={trackContainerStyle}
        onClick={handleTrackClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="slider"
        aria-label="Playback progress"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        tabIndex={disabled ? -1 : 0}
        data-testid={`${testId}-track`}
      >
        {/* Buffered progress */}
        {bufferedTime !== undefined && (
          <div style={bufferedStyle} data-testid={`${testId}-buffered`} />
        )}

        {/* Progress fill */}
        <div style={progressStyle} data-testid={`${testId}-progress`} />

        {/* Seek handle */}
        {showHandle && (
          <div
            style={handleStyle}
            data-testid={`${testId}-handle`}
            aria-hidden="true"
          />
        )}

        {/* Hover time indicator */}
        {hoverPosition !== null && hoverTime !== null && !isDragging && (
          <div style={hoverIndicatorStyle} data-testid={`${testId}-hover`}>
            {formatTime(hoverTime)}
          </div>
        )}
      </div>

      {/* Time labels */}
      {showTimeLabels && (
        <div style={timeLabelContainerStyle}>
          <span data-testid={`${testId}-current-time`}>
            {formatTime(currentTime)}
          </span>
          {showPercentage && (
            <span data-testid={`${testId}-percentage`}>
              {Math.round(progressPercent)}%
            </span>
          )}
          <span data-testid={`${testId}-duration`}>
            {formatTime(duration)}
          </span>
        </div>
      )}
    </div>
  );
}

export default PlaybackProgressBar;
