/**
 * PlaybackContainer Component
 *
 * A comprehensive playback control panel that combines all playback controls
 * into a unified interface. Integrates with the MelodyStore and abcjs.
 *
 * @module components/Playback/PlaybackContainer
 */

import { useCallback, useEffect } from 'react';
import type { ReactElement, CSSProperties } from 'react';

import { PlaybackControls, type PlaybackState } from './PlaybackControls';
import { TempoSlider } from './TempoSlider';
import { TransposeControl } from './TransposeControl';
import { LoopSelector, type LoopRegion } from './LoopSelector';
import { PlaybackProgressBar } from './PlaybackProgressBar';
import { usePlaybackKeyboard } from './usePlaybackKeyboard';
import type { KeySignature } from '@/lib/melody/types';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[PlaybackContainer] ${message}`, ...args);
  }
};

/**
 * Layout options for the playback container
 */
export type PlaybackLayout = 'horizontal' | 'vertical' | 'compact';

/**
 * Props for PlaybackContainer component
 */
export interface PlaybackContainerProps {
  // Playback state
  /** Current playback state */
  playbackState: PlaybackState;
  /** Current playback position in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Whether melody content is loaded */
  hasContent: boolean;

  // Tempo
  /** Current tempo in BPM */
  tempo: number;
  /** Callback when tempo changes */
  onTempoChange: (bpm: number) => void;

  // Key/Transpose
  /** Current key signature */
  keySignature: KeySignature;
  /** Callback when key changes */
  onKeyChange: (key: KeySignature) => void;

  // Loop
  /** Whether looping is enabled */
  loopEnabled: boolean;
  /** Callback when loop enabled state changes */
  onLoopEnabledChange: (enabled: boolean) => void;
  /** Current loop region */
  loopRegion?: LoopRegion | null;
  /** Callback when loop region changes */
  onLoopRegionChange?: (region: LoopRegion | null) => void;

  // Control callbacks
  /** Callback when play is triggered */
  onPlay: () => void;
  /** Callback when pause is triggered */
  onPause: () => void;
  /** Callback when stop is triggered */
  onStop: () => void;
  /** Callback when seek is triggered */
  onSeek: (time: number) => void;

  // Configuration
  /** Whether controls are disabled */
  disabled?: boolean;
  /** Whether keyboard shortcuts are enabled (default: true) */
  keyboardEnabled?: boolean;
  /** Layout style */
  layout?: PlaybackLayout;
  /** Whether to show tempo control (default: true) */
  showTempo?: boolean;
  /** Whether to show transpose control (default: true) */
  showTranspose?: boolean;
  /** Whether to show loop control (default: true) */
  showLoop?: boolean;
  /** Whether to show progress bar (default: true) */
  showProgress?: boolean;
  /** Custom CSS class */
  className?: string;
  /** Custom inline styles */
  style?: CSSProperties;
  /** Test ID for testing */
  testId?: string;
}

/**
 * PlaybackContainer combines all playback controls into a unified interface.
 *
 * Features:
 * - Play/Pause/Stop buttons
 * - Tempo slider with presets
 * - Key signature control
 * - Loop selection
 * - Seekable progress bar
 * - Keyboard shortcuts
 *
 * @example
 * ```tsx
 * <PlaybackContainer
 *   playbackState="playing"
 *   currentTime={45}
 *   duration={180}
 *   hasContent={true}
 *   tempo={120}
 *   onTempoChange={(bpm) => store.setTempo(bpm)}
 *   keySignature="C"
 *   onKeyChange={(key) => store.setKey(key)}
 *   loopEnabled={false}
 *   onLoopEnabledChange={(enabled) => store.setLoop(enabled)}
 *   onPlay={() => store.play()}
 *   onPause={() => store.pause()}
 *   onStop={() => store.stop()}
 *   onSeek={(time) => store.seek(time)}
 * />
 * ```
 */
export function PlaybackContainer({
  playbackState,
  currentTime,
  duration,
  hasContent,
  tempo,
  onTempoChange,
  keySignature,
  onKeyChange,
  loopEnabled,
  onLoopEnabledChange,
  loopRegion,
  onLoopRegionChange,
  onPlay,
  onPause,
  onStop,
  onSeek,
  disabled = false,
  keyboardEnabled = true,
  layout = 'vertical',
  showTempo = true,
  showTranspose = true,
  showLoop = true,
  showProgress = true,
  className = '',
  style,
  testId = 'playback-container',
}: PlaybackContainerProps): ReactElement {
  // Handle play/pause toggle
  const handlePlayPause = useCallback(() => {
    log('Play/Pause toggled, current state:', playbackState);
    if (playbackState === 'playing') {
      onPause();
    } else {
      onPlay();
    }
  }, [playbackState, onPlay, onPause]);

  // Handle tempo adjustment from keyboard
  const handleTempoUp = useCallback(() => {
    const newTempo = Math.min(tempo + 10, 240);
    log('Tempo up:', newTempo);
    onTempoChange(newTempo);
  }, [tempo, onTempoChange]);

  const handleTempoDown = useCallback(() => {
    const newTempo = Math.max(tempo - 10, 40);
    log('Tempo down:', newTempo);
    onTempoChange(newTempo);
  }, [tempo, onTempoChange]);

  // Handle seek from keyboard
  const handleSeekForward = useCallback(
    (seconds = 5) => {
      const newTime = Math.min(currentTime + seconds, duration);
      log('Seek forward to:', newTime);
      onSeek(newTime);
    },
    [currentTime, duration, onSeek]
  );

  const handleSeekBackward = useCallback(
    (seconds = 5) => {
      const newTime = Math.max(currentTime - seconds, 0);
      log('Seek backward to:', newTime);
      onSeek(newTime);
    },
    [currentTime, onSeek]
  );

  const handleJumpToStart = useCallback(() => {
    log('Jump to start');
    onSeek(0);
  }, [onSeek]);

  const handleJumpToEnd = useCallback(() => {
    log('Jump to end');
    onSeek(duration);
  }, [duration, onSeek]);

  const handleToggleLoop = useCallback(() => {
    log('Toggle loop');
    onLoopEnabledChange(!loopEnabled);
  }, [loopEnabled, onLoopEnabledChange]);

  // Set up keyboard shortcuts
  const keyboard = usePlaybackKeyboard({
    enabled: keyboardEnabled && hasContent && !disabled,
    playbackState,
    callbacks: {
      onPlayPause: handlePlayPause,
      onStop,
      onTempoUp: handleTempoUp,
      onTempoDown: handleTempoDown,
      onSeekForward: handleSeekForward,
      onSeekBackward: handleSeekBackward,
      onToggleLoop: handleToggleLoop,
      onJumpToStart: handleJumpToStart,
      onJumpToEnd: handleJumpToEnd,
    },
  });

  // Log keyboard shortcut activation
  useEffect(() => {
    log('Keyboard shortcuts', keyboard.isActive ? 'enabled' : 'disabled');
  }, [keyboard.isActive]);

  // Styles based on layout
  const getContainerStyle = (): CSSProperties => {
    const base: CSSProperties = {
      display: 'flex',
      gap: '16px',
      padding: '16px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      ...style,
    };

    switch (layout) {
      case 'horizontal':
        return {
          ...base,
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
        };
      case 'compact':
        return {
          ...base,
          flexDirection: 'column',
          padding: '12px',
          gap: '12px',
        };
      case 'vertical':
      default:
        return {
          ...base,
          flexDirection: 'column',
        };
    }
  };

  const controlsRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: layout === 'compact' ? '8px' : '16px',
    flexWrap: 'wrap',
  };

  const controlGroupStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: layout === 'horizontal' ? '0 0 auto' : '1 1 auto',
  };

  const dividerStyle: CSSProperties = {
    width: layout === 'horizontal' ? '1px' : '100%',
    height: layout === 'horizontal' ? '40px' : '1px',
    backgroundColor: '#e5e7eb',
    margin: layout === 'horizontal' ? '0 8px' : '4px 0',
  };

  return (
    <div
      className={`playback-container ${className}`.trim()}
      style={getContainerStyle()}
      data-testid={testId}
      role="region"
      aria-label="Playback controls"
    >
      {/* Progress bar (at top for vertical/compact layouts) */}
      {showProgress && layout !== 'horizontal' && (
        <PlaybackProgressBar
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeek}
          disabled={disabled || !hasContent}
          testId={`${testId}-progress`}
        />
      )}

      {/* Main controls row */}
      <div style={controlsRowStyle}>
        {/* Play/Pause/Stop */}
        <PlaybackControls
          playbackState={playbackState}
          hasContent={hasContent}
          disabled={disabled}
          onPlay={onPlay}
          onPause={onPause}
          onStop={onStop}
          size={layout === 'compact' ? 'small' : 'medium'}
          testId={`${testId}-controls`}
        />

        {/* Divider */}
        {(showTempo || showTranspose || showLoop) && (
          <div style={dividerStyle} aria-hidden="true" />
        )}

        {/* Tempo control */}
        {showTempo && (
          <div style={controlGroupStyle}>
            <TempoSlider
              value={tempo}
              onChange={onTempoChange}
              disabled={disabled}
              showPresets={layout !== 'compact'}
              testId={`${testId}-tempo`}
            />
          </div>
        )}

        {/* Transpose control */}
        {showTranspose && (
          <div style={controlGroupStyle}>
            <TransposeControl
              value={keySignature}
              onChange={onKeyChange}
              disabled={disabled}
              variant={layout === 'compact' ? 'dropdown' : 'buttons'}
              testId={`${testId}-transpose`}
            />
          </div>
        )}
      </div>

      {/* Loop selector (separate row for vertical layouts) */}
      {showLoop && (
        <LoopSelector
          loopEnabled={loopEnabled}
          onLoopEnabledChange={onLoopEnabledChange}
          loopRegion={loopRegion}
          onLoopRegionChange={onLoopRegionChange}
          duration={duration}
          currentTime={currentTime}
          disabled={disabled || !hasContent}
          showLoopBar={layout !== 'compact'}
          testId={`${testId}-loop`}
        />
      )}

      {/* Progress bar (at bottom for horizontal layout) */}
      {showProgress && layout === 'horizontal' && (
        <div style={{ width: '100%', marginTop: '8px' }}>
          <PlaybackProgressBar
            currentTime={currentTime}
            duration={duration}
            onSeek={onSeek}
            disabled={disabled || !hasContent}
            testId={`${testId}-progress`}
          />
        </div>
      )}

      {/* Keyboard shortcut hint */}
      {keyboard.isActive && layout !== 'compact' && (
        <div
          style={{
            fontSize: '0.75rem',
            color: '#9ca3af',
            textAlign: 'center',
            marginTop: '4px',
          }}
          aria-hidden="true"
        >
          Keyboard: Space (play/pause) | Esc (stop) | +/- (tempo) | L (loop)
        </div>
      )}
    </div>
  );
}

export default PlaybackContainer;
