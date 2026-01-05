/**
 * RecordingStudio Component
 *
 * A full recording interface that allows users to record their voice
 * while a melody plays as a guide track. Includes lyrics teleprompter,
 * guide volume control, click track, and recording controls.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { RecordButton } from './RecordButton';
import { RecordingTimer } from './RecordingTimer';
import { AudioLevelMeter } from './AudioLevelMeter';
import { CountdownOverlay } from './CountdownOverlay';
import { GuideVolumeSlider } from './GuideVolumeSlider';
import { LyricsTeleprompter } from './LyricsTeleprompter';
import { ClickTrackToggle } from './ClickTrackToggle';
import {
  startSyncedSession,
  type SyncSession,
  type SyncSessionState,
  type SyncSessionResult,
} from '@/lib/audio/syncPlayback';
import type { Melody } from '@/lib/melody/types';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[RecordingStudio] ${message}`, ...args);
  }
};

/**
 * Props for RecordingStudio component
 */
export interface RecordingStudioProps {
  /** The melody to use as a guide track */
  melody: Melody | null;
  /** ABC notation for the melody */
  abcNotation: string | null;
  /** Lyrics to display in the teleprompter */
  lyrics: string[];
  /** Callback when recording is completed */
  onRecordingComplete?: (result: SyncSessionResult) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
  /** Initial guide volume (0-1) */
  initialGuideVolume?: number;
  /** Whether click track is initially enabled */
  initialClickEnabled?: boolean;
  /** Initial click volume (0-1) */
  initialClickVolume?: number;
  /** Countdown seconds before recording starts */
  countdownSeconds?: number;
  /** Element ID for notation rendering (optional) */
  notationElementId?: string;
  /** Custom CSS class name */
  className?: string;
  /** Whether to show the notation display */
  showNotation?: boolean;
}

/**
 * RecordingStudio provides a complete recording interface.
 *
 * Features:
 * - Synced melody playback during recording
 * - Adjustable guide track volume
 * - Optional click track with volume control
 * - Scrolling lyrics teleprompter
 * - Real-time audio level meter
 * - Countdown before recording
 * - Recording timer
 *
 * @example
 * ```tsx
 * <RecordingStudio
 *   melody={melody}
 *   abcNotation={abc}
 *   lyrics={['First line', 'Second line']}
 *   onRecordingComplete={(result) => saveRecording(result)}
 * />
 * ```
 */
export function RecordingStudio({
  melody,
  abcNotation,
  lyrics,
  onRecordingComplete,
  onError,
  initialGuideVolume = 0.8,
  initialClickEnabled = false,
  initialClickVolume = 0.5,
  countdownSeconds = 3,
  notationElementId = 'recording-studio-notation',
  className = '',
  showNotation = false,
}: RecordingStudioProps): React.ReactElement {
  // Session state
  const [sessionState, setSessionState] = useState<SyncSessionState>('idle');
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Audio controls state
  const [guideVolume, setGuideVolume] = useState(initialGuideVolume);
  const [isGuideMuted, setIsGuideMuted] = useState(false);
  const [clickEnabled, setClickEnabled] = useState(initialClickEnabled);
  const [clickVolume, setClickVolume] = useState(initialClickVolume);

  // Playback state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);

  // Session ref
  const sessionRef = useRef<SyncSession | null>(null);
  const previousGuideVolumeRef = useRef(initialGuideVolume);

  // Check if we can record
  const canRecord = melody !== null && abcNotation !== null;

  // Determine button state based on session state
  const getButtonState = (): 'idle' | 'preparing' | 'recording' | 'paused' => {
    switch (sessionState) {
      case 'initializing':
      case 'countdown':
        return 'preparing';
      case 'recording':
        return 'recording';
      case 'paused':
        return 'paused';
      default:
        return 'idle';
    }
  };

  // Initialize session when melody is available
  useEffect(() => {
    if (!canRecord || sessionState !== 'idle') {
      return;
    }

    const initSession = async () => {
      log('Initializing recording session...');
      setError(null);

      try {
        const session = await startSyncedSession(melody!, abcNotation!, {
          notationElementId: showNotation ? notationElementId : undefined,
          guideVolume: isGuideMuted ? 0 : guideVolume,
          clickTrackEnabled: clickEnabled,
          clickVolume,
          countdownSeconds,
          onStateChange: (state) => {
            log('Session state changed:', state);
            setSessionState(state);
          },
          onProgress: (time, dur) => {
            setCurrentTime(time);
            setDuration(dur);
          },
          onLyricPosition: (lineIdx) => {
            setCurrentLineIndex(lineIdx);
          },
          onRecordingDuration: (dur) => {
            setRecordingDuration(dur);
          },
          onCountdown: (seconds) => {
            setCountdownValue(seconds > 0 ? seconds : null);
          },
          onError: (err) => {
            log('Session error:', err.message);
            setError(err.message);
            onError?.(err);
          },
        });

        sessionRef.current = session;
        setIsReady(true);
        log('Recording session ready');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize recording';
        log('Failed to initialize session:', errorMessage);
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      }
    };

    initSession();

    // Cleanup on unmount
    return () => {
      if (sessionRef.current) {
        log('Disposing session on unmount');
        sessionRef.current.dispose();
        sessionRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRecord]); // Only re-run when canRecord changes

  // Update guide volume when it changes
  useEffect(() => {
    if (sessionRef.current) {
      const effectiveVolume = isGuideMuted ? 0 : guideVolume;
      sessionRef.current.setGuideVolume(effectiveVolume);
    }
  }, [guideVolume, isGuideMuted]);

  // Update click track when settings change
  useEffect(() => {
    if (sessionRef.current) {
      sessionRef.current.setClickTrackEnabled(clickEnabled);
      sessionRef.current.setClickVolume(clickVolume);
    }
  }, [clickEnabled, clickVolume]);

  // Handle record button click
  const handleRecordClick = useCallback(async () => {
    if (!sessionRef.current) {
      log('No session available');
      return;
    }

    const currentState = sessionRef.current.getState();
    log('Record button clicked, current state:', currentState);

    try {
      if (currentState === 'ready') {
        // Start recording
        await sessionRef.current.start();
      } else if (currentState === 'recording') {
        // Stop recording
        const result = await sessionRef.current.stop();
        log('Recording completed:', result.duration, 'seconds');
        onRecordingComplete?.(result);

        // Reset for new recording
        setCurrentTime(0);
        setRecordingDuration(0);
        setCurrentLineIndex(-1);
        setIsReady(false);
        sessionRef.current = null;
      } else if (currentState === 'paused') {
        // Resume recording
        sessionRef.current.resume();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Recording failed';
      log('Recording error:', errorMessage);
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  }, [onRecordingComplete, onError]);

  // Handle pause button click
  const handlePauseClick = useCallback(() => {
    if (!sessionRef.current) return;

    const currentState = sessionRef.current.getState();
    if (currentState === 'recording') {
      sessionRef.current.pause();
    } else if (currentState === 'paused') {
      sessionRef.current.resume();
    }
  }, []);

  // Handle guide volume change
  const handleGuideVolumeChange = useCallback((volume: number) => {
    setGuideVolume(volume);
    if (isGuideMuted) {
      setIsGuideMuted(false);
    }
  }, [isGuideMuted]);

  // Handle guide mute toggle
  const handleGuideMuteToggle = useCallback(() => {
    if (isGuideMuted) {
      // Unmuting - restore previous volume
      setGuideVolume(previousGuideVolumeRef.current);
    } else {
      // Muting - save current volume
      previousGuideVolumeRef.current = guideVolume;
    }
    setIsGuideMuted(!isGuideMuted);
  }, [isGuideMuted, guideVolume]);

  // Handle click track toggle
  const handleClickToggle = useCallback((enabled: boolean) => {
    setClickEnabled(enabled);
  }, []);

  // Handle click volume change
  const handleClickVolumeChange = useCallback((volume: number) => {
    setClickVolume(volume);
  }, []);

  // Render empty state when no melody
  if (!canRecord) {
    return (
      <div
        className={`recording-studio recording-studio--empty ${className}`.trim()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          backgroundColor: '#111827',
          borderRadius: '12px',
          color: '#9ca3af',
          textAlign: 'center',
        }}
        data-testid="recording-studio"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          style={{ width: 64, height: 64, marginBottom: 16, opacity: 0.5 }}
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#e5e7eb', marginBottom: 8 }}>
          No Melody Available
        </h3>
        <p style={{ fontSize: '14px', maxWidth: 300 }}>
          Generate a melody first to start recording. The melody will play as a guide track
          while you sing along.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`recording-studio ${className}`.trim()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        padding: '24px',
        backgroundColor: '#111827',
        borderRadius: '12px',
      }}
      data-testid="recording-studio"
    >
      {/* Error display */}
      {error && (
        <div
          className="recording-studio__error"
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '14px',
          }}
          role="alert"
          data-testid="error-message"
        >
          {error}
        </div>
      )}

      {/* Countdown overlay */}
      <CountdownOverlay
        isActive={countdownValue !== null}
        startFrom={countdownSeconds}
        onCancel={() => {
          if (sessionRef.current) {
            sessionRef.current.stop().catch(() => {});
          }
        }}
      />

      {/* Lyrics teleprompter */}
      <div className="recording-studio__teleprompter">
        <LyricsTeleprompter
          lyrics={lyrics}
          currentTime={currentTime}
          duration={duration}
          currentLineIndex={currentLineIndex}
          isPlaying={sessionState === 'recording'}
          fontSize="large"
        />
      </div>

      {/* Notation display (optional) */}
      {showNotation && (
        <div
          id={notationElementId}
          className="recording-studio__notation"
          style={{
            minHeight: '100px',
            backgroundColor: '#1f2937',
            borderRadius: '8px',
            padding: '16px',
          }}
        />
      )}

      {/* Audio controls */}
      <div
        className="recording-studio__controls"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          backgroundColor: '#1f2937',
          borderRadius: '8px',
        }}
      >
        {/* Guide volume */}
        <GuideVolumeSlider
          value={guideVolume}
          onChange={handleGuideVolumeChange}
          isMuted={isGuideMuted}
          onMuteToggle={handleGuideMuteToggle}
          disabled={sessionState === 'recording'}
          showLabel
          showValue
          size="medium"
        />

        {/* Click track toggle */}
        <ClickTrackToggle
          enabled={clickEnabled}
          onToggle={handleClickToggle}
          volume={clickVolume}
          onVolumeChange={handleClickVolumeChange}
          showVolumeControl
          disabled={sessionState === 'recording'}
          size="medium"
        />
      </div>

      {/* Recording interface */}
      <div
        className="recording-studio__recording"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          padding: '24px',
          backgroundColor: '#1f2937',
          borderRadius: '8px',
        }}
      >
        {/* Audio level meter */}
        <div style={{ width: '100%', maxWidth: '300px' }}>
          <AudioLevelMeter
            level={sessionState === 'recording' ? 0.5 : 0}
            meterStyle="gradient"
            showPeak
            height="12px"
          />
        </div>

        {/* Timer */}
        <RecordingTimer
          duration={sessionState === 'recording' ? recordingDuration : 0}
          format="compact"
          size="large"
          isRunning={sessionState === 'recording'}
          isPaused={sessionState === 'paused'}
        />

        {/* Record buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {/* Pause button (only when recording) */}
          {(sessionState === 'recording' || sessionState === 'paused') && (
            <button
              type="button"
              onClick={handlePauseClick}
              className="recording-studio__pause-button"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                padding: 0,
                border: '2px solid #f59e0b',
                borderRadius: '50%',
                backgroundColor: 'transparent',
                color: '#f59e0b',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              aria-label={sessionState === 'paused' ? 'Resume recording' : 'Pause recording'}
              data-testid="pause-button"
            >
              {sessionState === 'paused' ? (
                // Play icon
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20 }}>
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              ) : (
                // Pause icon
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20 }}>
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              )}
            </button>
          )}

          {/* Main record button */}
          <RecordButton
            state={getButtonState()}
            onClick={handleRecordClick}
            disabled={!isReady && sessionState === 'idle'}
            size="large"
            showPulse
          />
        </div>

        {/* Instructions */}
        <p
          style={{
            fontSize: '14px',
            color: '#9ca3af',
            textAlign: 'center',
            maxWidth: '400px',
          }}
        >
          {sessionState === 'idle' && !isReady && 'Initializing recording session...'}
          {sessionState === 'idle' && isReady && 'Press the record button to start recording with the melody as your guide.'}
          {sessionState === 'countdown' && 'Get ready...'}
          {sessionState === 'recording' && 'Recording in progress. Sing along with the melody!'}
          {sessionState === 'paused' && 'Recording paused. Click the play button to resume.'}
          {sessionState === 'completed' && 'Recording saved!'}
        </p>
      </div>

      {/* Styles */}
      <style>{`
        .recording-studio__pause-button:hover {
          background-color: rgba(245, 158, 11, 0.15);
          transform: scale(1.05);
        }

        .recording-studio__pause-button:focus-visible {
          outline: 2px solid #f59e0b;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}

export default RecordingStudio;
