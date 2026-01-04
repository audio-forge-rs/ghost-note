/**
 * PlaybackControls Component
 *
 * Provides play, pause, stop, and tempo controls for ABC notation playback.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  AbcSynth,
  initSynth,
  getSynth,
  type SynthState,
  type SynthConfig,
  type TuneObject,
} from '@/lib/music/abcRenderer';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[PlaybackControls] ${message}`, ...args);
  }
};

/**
 * Tempo preset values
 */
export const TEMPO_PRESETS = {
  slow: 0.5,
  normal: 1.0,
  fast: 1.5,
  veryFast: 2.0,
} as const;

/**
 * Props for PlaybackControls component
 */
export interface PlaybackControlsProps {
  /** The tune object to play (from NotationDisplay render) */
  tuneObject?: TuneObject | null;
  /** ABC notation string (alternative to tuneObject) */
  abc?: string;
  /** Element ID for visual sync with NotationDisplay */
  notationElementId?: string;
  /** Initial tempo multiplier (default: 1.0) */
  initialTempo?: number;
  /** Minimum tempo multiplier */
  minTempo?: number;
  /** Maximum tempo multiplier */
  maxTempo?: number;
  /** Tempo step size for slider */
  tempoStep?: number;
  /** Whether to show tempo slider (default: true) */
  showTempoControl?: boolean;
  /** Whether to show tempo presets (default: true) */
  showTempoPresets?: boolean;
  /** Custom CSS class name */
  className?: string;
  /** Custom styling */
  style?: React.CSSProperties;
  /** Callback when playback state changes */
  onStateChange?: (state: SynthState) => void;
  /** Callback when tempo changes */
  onTempoChange?: (tempo: number) => void;
  /** Callback when playback completes */
  onPlaybackComplete?: () => void;
  /** Callback on playback error */
  onError?: (error: string) => void;
}

/**
 * PlaybackControls provides audio playback controls for ABC notation.
 *
 * Features:
 * - Play, pause, and stop buttons
 * - Tempo slider with presets
 * - State management for playback
 * - Integration with NotationDisplay for visual sync
 *
 * @example
 * ```tsx
 * <PlaybackControls
 *   abc={`X:1\nT:Test\nM:4/4\nK:C\nCDEF|`}
 *   notationElementId="notation-1"
 *   onStateChange={(state) => console.log('State:', state)}
 * />
 * ```
 */
export function PlaybackControls({
  tuneObject,
  abc,
  notationElementId,
  initialTempo = 1.0,
  minTempo = 0.25,
  maxTempo = 2.5,
  tempoStep = 0.25,
  showTempoControl = true,
  showTempoPresets = true,
  className = '',
  style,
  onStateChange,
  onTempoChange,
  // onPlaybackComplete is reserved for future use when we detect playback end
  onPlaybackComplete: _onPlaybackComplete,
  onError,
}: PlaybackControlsProps): React.ReactElement {
  // Suppress unused variable warning - will be used when playback end detection is implemented
  void _onPlaybackComplete;
  const [state, setState] = useState<SynthState>('uninitialized');
  const [tempo, setTempo] = useState(initialTempo);
  const [isLoading, setIsLoading] = useState(false);
  const synthRef = useRef<AbcSynth | null>(null);

  // Initialize synth on first user interaction
  const ensureSynthInitialized = useCallback(async (): Promise<AbcSynth | null> => {
    log('Ensuring synth is initialized...');

    if (synthRef.current && synthRef.current.getState() !== 'uninitialized') {
      return synthRef.current;
    }

    setIsLoading(true);
    try {
      const config: SynthConfig = {
        tempoMultiplier: tempo,
        onStateChange: (newState) => {
          log('Synth state changed:', newState);
          setState(newState);
          onStateChange?.(newState);
        },
      };

      const synth = await initSynth(config);
      synthRef.current = synth;
      log('Synth initialized');
      return synth;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log('Failed to initialize synth:', errorMessage);
      onError?.(errorMessage);
      setState('error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [tempo, onStateChange, onError]);

  // Load tune into synth
  const loadTune = useCallback(async (synth: AbcSynth): Promise<boolean> => {
    if (!tuneObject && !abc) {
      log('No tune to load');
      onError?.('No tune or ABC notation provided');
      return false;
    }

    setIsLoading(true);
    try {
      if (tuneObject) {
        log('Loading tune object...');
        const loaded = await synth.load(tuneObject, notationElementId);
        if (!loaded) {
          throw new Error('Failed to load tune');
        }
        return true;
      }

      // If we have ABC but no tune object, we need to render first
      if (abc && notationElementId) {
        log('Loading from ABC...');
        // Import dynamically to avoid circular dependency
        const { renderABC } = await import('@/lib/music/abcRenderer');
        const result = renderABC(abc, notationElementId, {
          responsive: 'resize',
          add_classes: true,
        });

        if (!result.success || result.tuneObjects.length === 0) {
          throw new Error(result.error ?? 'Failed to render ABC');
        }

        const loaded = await synth.load(result.tuneObjects[0], notationElementId);
        if (!loaded) {
          throw new Error('Failed to load tune');
        }
        return true;
      }

      log('Cannot load: missing tuneObject or abc with notationElementId');
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log('Failed to load tune:', errorMessage);
      onError?.(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [tuneObject, abc, notationElementId, onError]);

  // Play handler
  const handlePlay = useCallback(async () => {
    log('Play clicked, current state:', state);

    if (state === 'paused') {
      // Resume from pause
      const synth = synthRef.current ?? getSynth();
      if (synth) {
        synth.resume();
        return;
      }
    }

    // Initialize and load
    const synth = await ensureSynthInitialized();
    if (!synth) return;

    const loaded = await loadTune(synth);
    if (!loaded) return;

    // Start playback
    const started = await synth.play();
    if (!started) {
      onError?.('Failed to start playback');
    }
  }, [state, ensureSynthInitialized, loadTune, onError]);

  // Pause handler
  const handlePause = useCallback(() => {
    log('Pause clicked');
    const synth = synthRef.current ?? getSynth();
    if (synth) {
      synth.pause();
    }
  }, []);

  // Stop handler
  const handleStop = useCallback(() => {
    log('Stop clicked');
    const synth = synthRef.current ?? getSynth();
    if (synth) {
      synth.stop();
    }
  }, []);

  // Tempo change handler
  const handleTempoChange = useCallback((newTempo: number) => {
    log('Tempo changed:', newTempo);
    setTempo(newTempo);
    onTempoChange?.(newTempo);

    const synth = synthRef.current ?? getSynth();
    if (synth) {
      synth.setTempo(newTempo);
    }
  }, [onTempoChange]);

  // Tempo slider handler
  const handleTempoSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTempo = parseFloat(e.target.value);
    handleTempoChange(newTempo);
  }, [handleTempoChange]);

  // Tempo preset handler
  const handleTempoPreset = useCallback((preset: keyof typeof TEMPO_PRESETS) => {
    handleTempoChange(TEMPO_PRESETS[preset]);
  }, [handleTempoChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      log('Cleanup: stopping playback');
      const synth = synthRef.current;
      if (synth) {
        synth.stop();
      }
    };
  }, []);

  // Button states
  const isPaused = state === 'paused';
  const canPlay = !isLoading && state !== 'playing';
  const canPause = state === 'playing';
  const canStop = state === 'playing' || state === 'paused';

  // Styles
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem',
    ...style,
  };

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  };

  const buttonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem 1rem',
    minWidth: '80px',
    fontSize: '0.875rem',
    fontWeight: 500,
    borderRadius: '0.375rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const playButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: canPlay ? '#10b981' : '#9ca3af',
    color: 'white',
    border: 'none',
    opacity: isLoading ? 0.7 : 1,
  };

  const pauseButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: canPause ? '#f59e0b' : '#9ca3af',
    color: 'white',
    border: 'none',
  };

  const stopButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: canStop ? '#ef4444' : '#9ca3af',
    color: 'white',
    border: 'none',
  };

  const tempoContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  };

  const tempoLabelStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#374151',
  };

  const tempoSliderContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  };

  const tempoSliderStyle: React.CSSProperties = {
    flex: 1,
    height: '0.5rem',
    cursor: 'pointer',
  };

  const tempoValueStyle: React.CSSProperties = {
    minWidth: '3rem',
    textAlign: 'right',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#1f2937',
  };

  const presetContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.25rem',
    flexWrap: 'wrap',
  };

  const presetButtonStyle: React.CSSProperties = {
    padding: '0.25rem 0.5rem',
    fontSize: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.25rem',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const statusStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: '#6b7280',
    textTransform: 'capitalize',
  };

  return (
    <div
      className={`playback-controls ${className}`.trim()}
      style={containerStyle}
      data-testid="playback-controls"
      role="group"
      aria-label="Playback controls"
    >
      {/* Main control buttons */}
      <div style={buttonContainerStyle}>
        <button
          onClick={handlePlay}
          disabled={!canPlay}
          style={playButtonStyle}
          aria-label={isPaused ? 'Resume playback' : 'Start playback'}
          data-testid="play-button"
        >
          {isLoading ? 'Loading...' : isPaused ? 'Resume' : 'Play'}
        </button>

        <button
          onClick={handlePause}
          disabled={!canPause}
          style={pauseButtonStyle}
          aria-label="Pause playback"
          data-testid="pause-button"
        >
          Pause
        </button>

        <button
          onClick={handleStop}
          disabled={!canStop}
          style={stopButtonStyle}
          aria-label="Stop playback"
          data-testid="stop-button"
        >
          Stop
        </button>

        {/* Status indicator */}
        <span style={statusStyle} data-testid="playback-status">
          {state}
        </span>
      </div>

      {/* Tempo controls */}
      {showTempoControl && (
        <div style={tempoContainerStyle} data-testid="tempo-controls">
          <label style={tempoLabelStyle}>
            Tempo
          </label>

          <div style={tempoSliderContainerStyle}>
            <input
              type="range"
              min={minTempo}
              max={maxTempo}
              step={tempoStep}
              value={tempo}
              onChange={handleTempoSliderChange}
              style={tempoSliderStyle}
              aria-label="Tempo slider"
              data-testid="tempo-slider"
            />
            <span style={tempoValueStyle} data-testid="tempo-value">
              {tempo.toFixed(2)}x
            </span>
          </div>

          {/* Tempo presets */}
          {showTempoPresets && (
            <div style={presetContainerStyle}>
              <button
                onClick={() => handleTempoPreset('slow')}
                style={{
                  ...presetButtonStyle,
                  backgroundColor: tempo === TEMPO_PRESETS.slow ? '#dbeafe' : 'white',
                }}
                aria-label="Slow tempo (0.5x)"
                data-testid="tempo-preset-slow"
              >
                Slow
              </button>
              <button
                onClick={() => handleTempoPreset('normal')}
                style={{
                  ...presetButtonStyle,
                  backgroundColor: tempo === TEMPO_PRESETS.normal ? '#dbeafe' : 'white',
                }}
                aria-label="Normal tempo (1x)"
                data-testid="tempo-preset-normal"
              >
                Normal
              </button>
              <button
                onClick={() => handleTempoPreset('fast')}
                style={{
                  ...presetButtonStyle,
                  backgroundColor: tempo === TEMPO_PRESETS.fast ? '#dbeafe' : 'white',
                }}
                aria-label="Fast tempo (1.5x)"
                data-testid="tempo-preset-fast"
              >
                Fast
              </button>
              <button
                onClick={() => handleTempoPreset('veryFast')}
                style={{
                  ...presetButtonStyle,
                  backgroundColor: tempo === TEMPO_PRESETS.veryFast ? '#dbeafe' : 'white',
                }}
                aria-label="Very fast tempo (2x)"
                data-testid="tempo-preset-veryfast"
              >
                2x
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PlaybackControls;
