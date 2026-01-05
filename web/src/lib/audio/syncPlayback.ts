/**
 * Synced Playback Module
 *
 * Provides synchronized recording sessions where the melody plays as a guide track
 * while recording the user's voice. Supports click track, adjustable guide volume,
 * and lyric position tracking.
 *
 * @module lib/audio/syncPlayback
 */

import { createRecorder, type AudioRecorder, type RecordingResult } from './recorder';
import { requestMicrophoneAccess, stopMediaStream } from './microphone';
import {
  AbcSynth,
  renderABC,
  type SynthConfig,
  type SynthState,
} from '../music/abcRenderer';
import type { Melody } from '../melody/types';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[SyncPlayback] ${message}`, ...args);
  }
};

// =============================================================================
// Types
// =============================================================================

/**
 * State of the synced session
 */
export type SyncSessionState =
  | 'idle'
  | 'initializing'
  | 'ready'
  | 'countdown'
  | 'recording'
  | 'paused'
  | 'stopping'
  | 'completed'
  | 'error';

/**
 * Configuration for a synced recording session
 */
export interface SyncSessionConfig {
  /** Element ID for visual rendering of the notation */
  notationElementId?: string;
  /** Initial guide track volume (0-1) */
  guideVolume?: number;
  /** Whether the click track is enabled */
  clickTrackEnabled?: boolean;
  /** Click track volume (0-1) */
  clickVolume?: number;
  /** Countdown duration in seconds before recording starts */
  countdownSeconds?: number;
  /** Microphone device ID to use */
  microphoneDeviceId?: string;
  /** Callback for session state changes */
  onStateChange?: (state: SyncSessionState) => void;
  /** Callback for playback progress */
  onProgress?: (currentTime: number, duration: number, beatNumber: number) => void;
  /** Callback for lyric position updates */
  onLyricPosition?: (lyricIndex: number, syllableIndex: number) => void;
  /** Callback for recording duration updates */
  onRecordingDuration?: (duration: number) => void;
  /** Callback for errors */
  onError?: (error: Error) => void;
  /** Callback for countdown updates */
  onCountdown?: (secondsRemaining: number) => void;
}

/**
 * Lyric timing information
 */
export interface LyricTiming {
  /** Index of the lyric line */
  lineIndex: number;
  /** Index of the syllable within the line */
  syllableIndex: number;
  /** Start time in seconds */
  startTime: number;
  /** End time in seconds */
  endTime: number;
  /** The syllable text */
  text: string;
}

/**
 * Result from a synced recording session
 */
export interface SyncSessionResult extends RecordingResult {
  /** The melody that was used as guide */
  melody: Melody;
  /** ABC notation used */
  abcNotation: string;
}

/**
 * Synced playback session interface
 */
export interface SyncSession {
  /** Start the synced session (begins recording when melody plays) */
  start: () => Promise<void>;
  /** Stop the session and get the recording result */
  stop: () => Promise<SyncSessionResult>;
  /** Pause both recording and playback */
  pause: () => void;
  /** Resume recording and playback */
  resume: () => void;
  /** Set the guide track volume (0-1) */
  setGuideVolume: (volume: number) => void;
  /** Get the current guide track volume */
  getGuideVolume: () => number;
  /** Enable or disable the click track */
  setClickTrackEnabled: (enabled: boolean) => void;
  /** Check if click track is enabled */
  isClickTrackEnabled: () => boolean;
  /** Set the click track volume (0-1) */
  setClickVolume: (volume: number) => void;
  /** Get the current click track volume */
  getClickVolume: () => number;
  /** Get the lyric text for a given time position */
  getLyricForPosition: (time: number) => string;
  /** Get full lyric timing information for a given time */
  getLyricTimingForPosition: (time: number) => LyricTiming | null;
  /** Get all lyric timings */
  getLyricTimings: () => LyricTiming[];
  /** Get current session state */
  getState: () => SyncSessionState;
  /** Get current playback time in seconds */
  getCurrentTime: () => number;
  /** Get total melody duration in seconds */
  getDuration: () => number;
  /** Get current recording duration in seconds */
  getRecordingDuration: () => number;
  /** Dispose of resources */
  dispose: () => void;
}

// =============================================================================
// Click Track Generator
// =============================================================================

/**
 * Creates a click track AudioNode that produces metronome clicks
 */
class ClickTrackGenerator {
  private audioContext: AudioContext;
  private gainNode: GainNode;
  private isPlaying: boolean = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private tempo: number;
  private beatsPerMeasure: number;
  private beatCount: number = 0;

  constructor(
    audioContext: AudioContext,
    tempo: number = 100,
    beatsPerMeasure: number = 4
  ) {
    this.audioContext = audioContext;
    this.tempo = tempo;
    this.beatsPerMeasure = beatsPerMeasure;
    this.gainNode = audioContext.createGain();
    this.gainNode.gain.value = 0.5;
    this.gainNode.connect(audioContext.destination);
    log('ClickTrackGenerator created, tempo:', tempo, 'bpm');
  }

  /**
   * Play a single click sound
   */
  private playClick(isDownbeat: boolean): void {
    const oscillator = this.audioContext.createOscillator();
    const clickGain = this.audioContext.createGain();

    // Higher pitch for downbeat
    oscillator.frequency.value = isDownbeat ? 1000 : 800;
    oscillator.type = 'sine';

    clickGain.gain.setValueAtTime(1, this.audioContext.currentTime);
    clickGain.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.05
    );

    oscillator.connect(clickGain);
    clickGain.connect(this.gainNode);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.05);

    log('Click played, downbeat:', isDownbeat);
  }

  /**
   * Start the click track
   */
  start(): void {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.beatCount = 0;

    const beatInterval = 60000 / this.tempo; // ms per beat

    // Play first click immediately
    this.playClick(true);
    this.beatCount = 1;

    this.intervalId = setInterval(() => {
      const isDownbeat = this.beatCount % this.beatsPerMeasure === 0;
      this.playClick(isDownbeat);
      this.beatCount++;
    }, beatInterval);

    log('Click track started');
  }

  /**
   * Stop the click track
   */
  stop(): void {
    if (!this.isPlaying) return;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isPlaying = false;
    this.beatCount = 0;
    log('Click track stopped');
  }

  /**
   * Pause the click track
   */
  pause(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    log('Click track paused');
  }

  /**
   * Resume the click track
   */
  resume(): void {
    if (!this.isPlaying) return;

    const beatInterval = 60000 / this.tempo;
    this.intervalId = setInterval(() => {
      const isDownbeat = this.beatCount % this.beatsPerMeasure === 0;
      this.playClick(isDownbeat);
      this.beatCount++;
    }, beatInterval);

    log('Click track resumed');
  }

  /**
   * Set the volume (0-1)
   */
  setVolume(volume: number): void {
    this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    log('Click track volume set to:', volume);
  }

  /**
   * Get the current volume
   */
  getVolume(): number {
    return this.gainNode.gain.value;
  }

  /**
   * Update tempo
   */
  setTempo(tempo: number): void {
    this.tempo = tempo;
    // If playing, restart with new tempo
    if (this.isPlaying) {
      this.stop();
      this.start();
    }
    log('Click track tempo set to:', tempo);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();
    this.gainNode.disconnect();
    log('ClickTrackGenerator disposed');
  }
}

// =============================================================================
// Lyric Timing Parser
// =============================================================================

/**
 * Parse melody and generate lyric timing information
 */
function parseLyricTimings(melody: Melody): LyricTiming[] {
  const timings: LyricTiming[] = [];
  const tempo = melody.params.tempo;
  const beatsPerSecond = tempo / 60;

  // Default note length determines beat value
  // 1/8 = eighth note, 1/4 = quarter note
  const noteLength = melody.params.defaultNoteLength;
  const noteLengthValue = noteLength === '1/4' ? 0.25 : noteLength === '1/16' ? 0.0625 : 0.125;

  let currentTime = 0;

  for (let measureIndex = 0; measureIndex < melody.measures.length; measureIndex++) {
    const measure = melody.measures[measureIndex];
    const lyrics = melody.lyrics[measureIndex] || [];

    for (let noteIndex = 0; noteIndex < measure.length; noteIndex++) {
      const note = measure[noteIndex];
      const lyricText = lyrics[noteIndex] || '';

      // Calculate note duration in seconds
      const noteDuration = note.duration * noteLengthValue / beatsPerSecond * 4;

      if (lyricText && lyricText !== '-' && lyricText !== '_') {
        timings.push({
          lineIndex: measureIndex,
          syllableIndex: noteIndex,
          startTime: currentTime,
          endTime: currentTime + noteDuration,
          text: lyricText,
        });
      }

      currentTime += noteDuration;
    }
  }

  log('Parsed lyric timings:', timings.length, 'syllables');
  return timings;
}

/**
 * Get the lyric for a given time position
 */
function getLyricAtTime(timings: LyricTiming[], time: number): LyricTiming | null {
  for (const timing of timings) {
    if (time >= timing.startTime && time < timing.endTime) {
      return timing;
    }
  }
  return null;
}

// =============================================================================
// Synced Session Implementation
// =============================================================================

/**
 * Start a synced recording session with melody playback
 *
 * @param melody - The melody to play as a guide track
 * @param abcNotation - ABC notation string for the melody
 * @param config - Session configuration
 * @returns A sync session interface
 *
 * @example
 * ```typescript
 * const session = await startSyncedSession(melody, abc, {
 *   guideVolume: 0.7,
 *   clickTrackEnabled: true,
 *   onProgress: (time, duration) => console.log(`${time}/${duration}`),
 *   onLyricPosition: (line, syllable) => highlightLyric(line, syllable),
 * });
 *
 * // Start recording with melody playback
 * await session.start();
 *
 * // Later, stop and get the recording
 * const result = await session.stop();
 * ```
 */
export async function startSyncedSession(
  melody: Melody,
  abcNotation: string,
  config: SyncSessionConfig = {}
): Promise<SyncSession> {
  const {
    notationElementId,
    guideVolume = 0.8,
    clickTrackEnabled = false,
    clickVolume = 0.5,
    countdownSeconds = 3,
    microphoneDeviceId,
    onStateChange,
    onProgress,
    onLyricPosition,
    onRecordingDuration,
    onError,
    onCountdown,
  } = config;

  log('Starting synced session with config:', {
    guideVolume,
    clickTrackEnabled,
    countdownSeconds,
    notationElementId,
  });

  // Internal state
  let state: SyncSessionState = 'idle';
  let synth: AbcSynth | null = null;
  let recorder: AudioRecorder | null = null;
  let clickTrack: ClickTrackGenerator | null = null;
  let microphoneStream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;
  let currentGuideVolume = guideVolume;
  let currentClickEnabled = clickTrackEnabled;
  let currentClickVolume = clickVolume;
  let currentTime = 0;
  let duration = 0;
  let lyricTimings: LyricTiming[] = [];
  let countdownTimerId: ReturnType<typeof setTimeout> | null = null;

  // State updater
  const setState = (newState: SyncSessionState) => {
    log('Session state change:', state, '->', newState);
    state = newState;
    onStateChange?.(newState);
  };

  // Error handler
  const handleError = (error: Error) => {
    log('Session error:', error.message);
    setState('error');
    onError?.(error);
  };

  // Parse lyric timings
  lyricTimings = parseLyricTimings(melody);

  // Initialize the session
  setState('initializing');

  try {
    // Create audio context
    audioContext = new AudioContext();
    log('AudioContext created, sample rate:', audioContext.sampleRate);

    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // Request microphone access
    log('Requesting microphone access...');
    const micResult = await requestMicrophoneAccess(microphoneDeviceId);
    if (!micResult.success || !micResult.stream) {
      throw new Error(micResult.error || 'Failed to access microphone');
    }
    microphoneStream = micResult.stream;
    log('Microphone stream obtained');

    // Create the synth for melody playback
    const synthConfig: SynthConfig = {
      volume: Math.round(currentGuideVolume * 100),
      onStateChange: (synthState: SynthState) => {
        log('Synth state changed:', synthState);
        if (synthState === 'stopped' && state === 'recording') {
          // Melody finished playing, but we might still be recording
          log('Melody playback finished');
        }
      },
      onProgress: (currentBeat, totalBeats, totalTime) => {
        // Convert to seconds
        const progress = totalBeats > 0 ? currentBeat / totalBeats : 0;
        currentTime = progress * (totalTime / 1000);
        duration = totalTime / 1000;

        onProgress?.(currentTime, duration, currentBeat);

        // Update lyric position
        const lyricTiming = getLyricAtTime(lyricTimings, currentTime);
        if (lyricTiming) {
          onLyricPosition?.(lyricTiming.lineIndex, lyricTiming.syllableIndex);
        }
      },
    };

    synth = new AbcSynth(synthConfig);
    await synth.init();

    // Render the notation if element ID provided
    if (notationElementId) {
      const result = renderABC(abcNotation, notationElementId, {
        responsive: 'resize',
        add_classes: true,
      });

      if (!result.success || result.tuneObjects.length === 0) {
        throw new Error('Failed to render ABC notation');
      }

      // Load the tune into the synth
      await synth.load(result.tuneObjects[0], notationElementId);
    } else {
      // Create a temporary element for rendering
      const tempDiv = document.createElement('div');
      tempDiv.id = 'sync-playback-temp-render';
      tempDiv.style.display = 'none';
      document.body.appendChild(tempDiv);

      try {
        const result = renderABC(abcNotation, 'sync-playback-temp-render');
        if (!result.success || result.tuneObjects.length === 0) {
          throw new Error('Failed to render ABC notation');
        }
        await synth.load(result.tuneObjects[0]);
      } finally {
        document.body.removeChild(tempDiv);
      }
    }

    // Create click track if enabled
    if (currentClickEnabled) {
      const beatsPerMeasure = melody.params.timeSignature === '3/4' ? 3 :
                              melody.params.timeSignature === '6/8' ? 6 : 4;
      clickTrack = new ClickTrackGenerator(
        audioContext,
        melody.params.tempo,
        beatsPerMeasure
      );
      clickTrack.setVolume(currentClickVolume);
    }

    // Create the recorder
    recorder = createRecorder({
      onStateChange: (recorderState) => {
        log('Recorder state changed:', recorderState);
      },
      onDurationUpdate: (recordingDuration) => {
        onRecordingDuration?.(recordingDuration);
      },
      onError: handleError,
    });

    setState('ready');
    log('Synced session initialized and ready');
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Failed to initialize session');
    handleError(err);
    throw err;
  }

  // Session interface
  const session: SyncSession = {
    start: async () => {
      if (state !== 'ready' && state !== 'paused') {
        log('Cannot start - not ready or paused');
        return;
      }

      // If resuming from pause
      if (state === 'paused') {
        session.resume();
        return;
      }

      // Start countdown
      setState('countdown');
      log('Starting countdown:', countdownSeconds, 'seconds');

      for (let i = countdownSeconds; i > 0; i--) {
        onCountdown?.(i);
        await new Promise((resolve) => {
          countdownTimerId = setTimeout(resolve, 1000);
        });

        // Check if we were stopped during countdown
        // Using getState() to avoid TypeScript false positive about narrowed type
        if (session.getState() !== 'countdown') {
          log('Countdown interrupted');
          return;
        }
      }

      onCountdown?.(0);
      countdownTimerId = null;

      // Start recording and playback
      setState('recording');

      try {
        // Start the recorder with the microphone stream
        if (recorder && microphoneStream) {
          recorder.startRecording(microphoneStream);
        }

        // Start the click track if enabled
        if (clickTrack && currentClickEnabled) {
          clickTrack.start();
        }

        // Start melody playback
        if (synth) {
          await synth.play();
        }

        log('Recording and playback started');
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to start recording');
        handleError(err);
      }
    },

    stop: async (): Promise<SyncSessionResult> => {
      setState('stopping');
      log('Stopping synced session...');

      // Cancel any pending countdown
      if (countdownTimerId) {
        clearTimeout(countdownTimerId);
        countdownTimerId = null;
      }

      // Stop click track
      if (clickTrack) {
        clickTrack.stop();
      }

      // Stop synth playback
      if (synth) {
        synth.stop();
      }

      // Stop recording and get result
      let result: RecordingResult | null = null;
      if (recorder && recorder.getState() !== 'inactive') {
        try {
          result = await recorder.stopRecording();
        } catch (error) {
          log('Error stopping recorder:', error);
        }
      }

      setState('completed');
      log('Synced session stopped');

      if (!result) {
        throw new Error('No recording data available');
      }

      return {
        ...result,
        melody,
        abcNotation,
      };
    },

    pause: () => {
      if (state !== 'recording') {
        log('Cannot pause - not recording');
        return;
      }

      // Pause everything
      if (synth) {
        synth.pause();
      }
      if (recorder) {
        recorder.pauseRecording();
      }
      if (clickTrack) {
        clickTrack.pause();
      }

      setState('paused');
      log('Session paused');
    },

    resume: () => {
      if (state !== 'paused') {
        log('Cannot resume - not paused');
        return;
      }

      // Resume everything
      if (synth) {
        synth.resume();
      }
      if (recorder) {
        recorder.resumeRecording();
      }
      if (clickTrack && currentClickEnabled) {
        clickTrack.resume();
      }

      setState('recording');
      log('Session resumed');
    },

    setGuideVolume: (volume: number) => {
      currentGuideVolume = Math.max(0, Math.min(1, volume));
      if (synth) {
        synth.setVolume(Math.round(currentGuideVolume * 100));
      }
      log('Guide volume set to:', currentGuideVolume);
    },

    getGuideVolume: () => currentGuideVolume,

    setClickTrackEnabled: (enabled: boolean) => {
      currentClickEnabled = enabled;

      if (enabled && !clickTrack && audioContext) {
        // Create click track if it doesn't exist
        const beatsPerMeasure = melody.params.timeSignature === '3/4' ? 3 :
                                melody.params.timeSignature === '6/8' ? 6 : 4;
        clickTrack = new ClickTrackGenerator(
          audioContext,
          melody.params.tempo,
          beatsPerMeasure
        );
        clickTrack.setVolume(currentClickVolume);

        // Start if we're recording
        if (state === 'recording') {
          clickTrack.start();
        }
      } else if (!enabled && clickTrack) {
        clickTrack.stop();
      }

      log('Click track enabled:', enabled);
    },

    isClickTrackEnabled: () => currentClickEnabled,

    setClickVolume: (volume: number) => {
      currentClickVolume = Math.max(0, Math.min(1, volume));
      if (clickTrack) {
        clickTrack.setVolume(currentClickVolume);
      }
      log('Click volume set to:', currentClickVolume);
    },

    getClickVolume: () => currentClickVolume,

    getLyricForPosition: (time: number): string => {
      const timing = getLyricAtTime(lyricTimings, time);
      return timing?.text || '';
    },

    getLyricTimingForPosition: (time: number): LyricTiming | null => {
      return getLyricAtTime(lyricTimings, time);
    },

    getLyricTimings: () => [...lyricTimings],

    getState: () => state,

    getCurrentTime: () => currentTime,

    getDuration: () => duration,

    getRecordingDuration: () => {
      return recorder?.getRecordingDuration() || 0;
    },

    dispose: () => {
      log('Disposing synced session...');

      // Cancel any pending countdown
      if (countdownTimerId) {
        clearTimeout(countdownTimerId);
        countdownTimerId = null;
      }

      // Dispose click track
      if (clickTrack) {
        clickTrack.dispose();
        clickTrack = null;
      }

      // Dispose synth
      if (synth) {
        synth.dispose();
        synth = null;
      }

      // Dispose recorder
      if (recorder) {
        recorder.dispose();
        recorder = null;
      }

      // Stop microphone
      if (microphoneStream) {
        stopMediaStream(microphoneStream);
        microphoneStream = null;
      }

      // Close audio context
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch((e) => log('Error closing AudioContext:', e));
        audioContext = null;
      }

      lyricTimings = [];
      setState('idle');
      log('Synced session disposed');
    },
  };

  return session;
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Set the guide track volume for an existing session
 * This is a standalone utility for when you have a session reference
 */
export function setGuideTrackVolume(session: SyncSession, volume: number): void {
  session.setGuideVolume(volume);
}

/**
 * Enable or disable the click track for an existing session
 */
export function setClickTrackEnabled(session: SyncSession, enabled: boolean): void {
  session.setClickTrackEnabled(enabled);
}

/**
 * Get the lyric text for a given time position
 */
export function getLyricForPosition(session: SyncSession, time: number): string {
  return session.getLyricForPosition(time);
}

// =============================================================================
// Exports
// =============================================================================

export default {
  startSyncedSession,
  setGuideTrackVolume,
  setClickTrackEnabled,
  getLyricForPosition,
};
