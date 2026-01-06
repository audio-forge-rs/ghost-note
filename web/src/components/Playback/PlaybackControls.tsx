/**
 * PlaybackControls Component
 *
 * Enhanced playback controls with play/pause/stop buttons for melody playback.
 * Designed to integrate with abcjs synth and the MelodyStore.
 *
 * @module components/Playback/PlaybackControls
 */

import { useCallback } from 'react';
import type { ReactElement, CSSProperties } from 'react';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[PlaybackControls] ${message}`, ...args);
  }
};

/**
 * Playback state type
 */
export type PlaybackState = 'stopped' | 'playing' | 'paused' | 'loading';

/**
 * Props for PlaybackControls component
 */
export interface PlaybackControlsProps {
  /** Current playback state */
  playbackState: PlaybackState;
  /** Whether controls are disabled */
  disabled?: boolean;
  /** Whether melody is loaded and ready to play */
  hasContent?: boolean;
  /** Callback when play is clicked */
  onPlay?: () => void;
  /** Callback when pause is clicked */
  onPause?: () => void;
  /** Callback when stop is clicked */
  onStop?: () => void;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Custom CSS class */
  className?: string;
  /** Custom inline styles */
  style?: CSSProperties;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Play icon SVG
 */
function PlayIcon({ size = 20 }: { size?: number }): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

/**
 * Pause icon SVG
 */
function PauseIcon({ size = 20 }: { size?: number }): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

/**
 * Stop icon SVG
 */
function StopIcon({ size = 20 }: { size?: number }): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6 6h12v12H6z" />
    </svg>
  );
}

/**
 * Loading spinner SVG
 */
function LoadingIcon({ size = 20 }: { size?: number }): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      style={{ animation: 'spin 1s linear infinite' }}
    >
      <circle cx="12" cy="12" r="10" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

/**
 * Size configurations
 * Note: Minimum 44px touch target for WCAG 2.5.5 compliance on mobile
 */
const SIZES = {
  small: { button: 44, icon: 18, gap: 6 },
  medium: { button: 48, icon: 22, gap: 8 },
  large: { button: 56, icon: 28, gap: 12 },
};

/**
 * PlaybackControls provides play, pause, and stop buttons for melody playback.
 *
 * Features:
 * - Play/Pause toggle behavior
 * - Stop button to reset playback
 * - Loading state indicator
 * - Disabled state handling
 * - Size variants
 *
 * @example
 * ```tsx
 * <PlaybackControls
 *   playbackState="stopped"
 *   hasContent={true}
 *   onPlay={() => store.play()}
 *   onPause={() => store.pause()}
 *   onStop={() => store.stop()}
 * />
 * ```
 */
export function PlaybackControls({
  playbackState,
  disabled = false,
  hasContent = false,
  onPlay,
  onPause,
  onStop,
  size = 'medium',
  className = '',
  style,
  testId = 'playback-controls',
}: PlaybackControlsProps): ReactElement {
  const sizeConfig = SIZES[size];
  const isPlaying = playbackState === 'playing';
  const isPaused = playbackState === 'paused';
  const isLoading = playbackState === 'loading';
  const canPlay = hasContent && !disabled && playbackState !== 'playing';
  const canPause = hasContent && !disabled && playbackState === 'playing';
  const canStop = hasContent && !disabled && (isPlaying || isPaused);

  const handlePlayPause = useCallback(() => {
    log('Play/Pause clicked, current state:', playbackState);
    if (isPlaying) {
      onPause?.();
    } else {
      onPlay?.();
    }
  }, [isPlaying, onPlay, onPause, playbackState]);

  const handleStop = useCallback(() => {
    log('Stop clicked');
    onStop?.();
  }, [onStop]);

  // Styles
  const containerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${sizeConfig.gap}px`,
    ...style,
  };

  const buttonBaseStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: `${sizeConfig.button}px`,
    height: `${sizeConfig.button}px`,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const playButtonStyle: CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: canPlay || canPause ? '#10b981' : '#9ca3af',
    color: 'white',
    opacity: disabled || !hasContent ? 0.5 : 1,
  };

  const stopButtonStyle: CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: canStop ? '#ef4444' : '#9ca3af',
    color: 'white',
    opacity: !canStop ? 0.5 : 1,
  };

  const getPlayPauseLabel = (): string => {
    if (isLoading) return 'Loading';
    if (isPlaying) return 'Pause playback';
    if (isPaused) return 'Resume playback';
    return 'Start playback';
  };

  const getPlayPauseIcon = (): ReactElement => {
    if (isLoading) return <LoadingIcon size={sizeConfig.icon} />;
    if (isPlaying) return <PauseIcon size={sizeConfig.icon} />;
    return <PlayIcon size={sizeConfig.icon} />;
  };

  return (
    <div
      className={`playback-controls ${className}`.trim()}
      style={containerStyle}
      data-testid={testId}
      role="group"
      aria-label="Playback controls"
    >
      {/* Play/Pause button */}
      <button
        onClick={handlePlayPause}
        disabled={disabled || !hasContent || isLoading}
        style={playButtonStyle}
        aria-label={getPlayPauseLabel()}
        data-testid={`${testId}-play-pause`}
        title={getPlayPauseLabel()}
      >
        {getPlayPauseIcon()}
      </button>

      {/* Stop button */}
      <button
        onClick={handleStop}
        disabled={!canStop}
        style={stopButtonStyle}
        aria-label="Stop playback"
        data-testid={`${testId}-stop`}
        title="Stop playback"
      >
        <StopIcon size={sizeConfig.icon} />
      </button>

      {/* Hidden style tag for loading animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default PlaybackControls;
