/**
 * Audio Recorder Module
 *
 * Provides utilities for recording audio using the MediaRecorder API,
 * with support for pause/resume and duration tracking.
 *
 * @module lib/audio/recorder
 */

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[Recorder] ${message}`, ...args);
  }
};

// =============================================================================
// Types
// =============================================================================

/**
 * State of the recorder
 */
export type RecorderState = 'inactive' | 'recording' | 'paused';

/**
 * Options for creating a recorder
 */
export interface RecorderOptions {
  /** MIME type for the recording (default: 'audio/webm') */
  mimeType?: string;
  /** Audio bits per second (default: 128000) */
  audioBitsPerSecond?: number;
  /** Time slice in milliseconds for data availability (default: 1000) */
  timeSlice?: number;
  /** Callback for recording state changes */
  onStateChange?: (state: RecorderState) => void;
  /** Callback for duration updates (called every second during recording) */
  onDurationUpdate?: (duration: number) => void;
  /** Callback for errors */
  onError?: (error: Error) => void;
}

/**
 * Result from stopping the recorder
 */
export interface RecordingResult {
  /** The recorded audio blob */
  blob: Blob;
  /** Duration of the recording in seconds */
  duration: number;
  /** MIME type of the recording */
  mimeType: string;
}

/**
 * Audio recorder interface
 */
export interface AudioRecorder {
  /** Start recording */
  startRecording: (stream: MediaStream) => void;
  /** Stop recording and get the result */
  stopRecording: () => Promise<RecordingResult>;
  /** Pause recording */
  pauseRecording: () => void;
  /** Resume recording */
  resumeRecording: () => void;
  /** Get the current recording duration in seconds */
  getRecordingDuration: () => number;
  /** Get the current recorder state */
  getState: () => RecorderState;
  /** Check if recording is active */
  isRecording: () => boolean;
  /** Check if recording is paused */
  isPaused: () => boolean;
  /** Dispose of resources */
  dispose: () => void;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get a supported MIME type for audio recording
 */
export function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
    'audio/mpeg',
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      log('Supported MIME type found:', type);
      return type;
    }
  }

  // Return a common fallback
  log('No specific MIME type supported, using default');
  return 'audio/webm';
}

/**
 * Check if MediaRecorder is supported in the current browser
 */
export function isRecordingSupported(): boolean {
  const supported =
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices !== undefined;

  log('Recording support check:', supported);
  return supported;
}

// =============================================================================
// Recorder Implementation
// =============================================================================

/**
 * Create an audio recorder instance
 *
 * @param options - Recorder options
 * @returns Audio recorder interface
 *
 * @example
 * ```typescript
 * const recorder = createRecorder({
 *   onStateChange: (state) => console.log('State:', state),
 *   onDurationUpdate: (duration) => console.log('Duration:', duration),
 * });
 *
 * // Start recording with a media stream
 * recorder.startRecording(stream);
 *
 * // Later, stop and get the result
 * const result = await recorder.stopRecording();
 * console.log('Recorded:', result.duration, 'seconds');
 * ```
 */
export function createRecorder(options: RecorderOptions = {}): AudioRecorder {
  const {
    mimeType = getSupportedMimeType(),
    audioBitsPerSecond = 128000,
    timeSlice = 1000,
    onStateChange,
    onDurationUpdate,
    onError,
  } = options;

  log('Creating recorder with options:', { mimeType, audioBitsPerSecond, timeSlice });

  // Internal state
  let mediaRecorder: MediaRecorder | null = null;
  let recordedChunks: Blob[] = [];
  let state: RecorderState = 'inactive';
  let startTime: number = 0;
  let pausedDuration: number = 0;
  let pauseStartTime: number = 0;
  let durationInterval: ReturnType<typeof setInterval> | null = null;
  let resolveStop: ((result: RecordingResult) => void) | null = null;
  let rejectStop: ((error: Error) => void) | null = null;

  // Helper to update state
  const setState = (newState: RecorderState) => {
    log('State change:', state, '->', newState);
    state = newState;
    onStateChange?.(newState);
  };

  // Calculate current duration
  const calculateDuration = (): number => {
    if (state === 'inactive' || startTime === 0) {
      return 0;
    }

    const now = Date.now();
    let elapsed = now - startTime - pausedDuration;

    if (state === 'paused' && pauseStartTime > 0) {
      // Don't count the time since we paused
      elapsed = pauseStartTime - startTime - pausedDuration;
    }

    return Math.max(0, elapsed / 1000);
  };

  // Start duration tracking
  const startDurationTracking = () => {
    if (durationInterval) {
      clearInterval(durationInterval);
    }

    durationInterval = setInterval(() => {
      if (state === 'recording') {
        const duration = calculateDuration();
        onDurationUpdate?.(duration);
      }
    }, 1000);

    log('Duration tracking started');
  };

  // Stop duration tracking
  const stopDurationTracking = () => {
    if (durationInterval) {
      clearInterval(durationInterval);
      durationInterval = null;
    }
    log('Duration tracking stopped');
  };

  // Handle MediaRecorder events
  const handleDataAvailable = (event: BlobEvent) => {
    if (event.data && event.data.size > 0) {
      recordedChunks.push(event.data);
      log('Data available:', event.data.size, 'bytes, total chunks:', recordedChunks.length);
    }
  };

  const handleStop = () => {
    log('MediaRecorder stopped, processing chunks...');
    stopDurationTracking();

    const duration = calculateDuration();
    const finalMimeType = mediaRecorder?.mimeType || mimeType;

    // Create the final blob
    const blob = new Blob(recordedChunks, { type: finalMimeType });
    log('Created blob:', blob.size, 'bytes, duration:', duration, 'seconds');

    // Reset internal state
    recordedChunks = [];
    startTime = 0;
    pausedDuration = 0;
    pauseStartTime = 0;

    setState('inactive');

    // Resolve the stop promise
    if (resolveStop) {
      resolveStop({
        blob,
        duration,
        mimeType: finalMimeType,
      });
      resolveStop = null;
      rejectStop = null;
    }
  };

  const handleError = (event: Event) => {
    const error = new Error('Recording failed');
    log('MediaRecorder error:', event);

    stopDurationTracking();
    setState('inactive');

    if (rejectStop) {
      rejectStop(error);
      resolveStop = null;
      rejectStop = null;
    }

    onError?.(error);
  };

  const handlePause = () => {
    log('MediaRecorder paused');
    pauseStartTime = Date.now();
    setState('paused');
  };

  const handleResume = () => {
    log('MediaRecorder resumed');
    if (pauseStartTime > 0) {
      pausedDuration += Date.now() - pauseStartTime;
      pauseStartTime = 0;
    }
    setState('recording');
  };

  // Public interface
  const recorder: AudioRecorder = {
    startRecording: (stream: MediaStream) => {
      if (state !== 'inactive') {
        log('Cannot start - already recording');
        return;
      }

      log('Starting recording...');

      try {
        // Validate stream
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
          throw new Error('No audio tracks in stream');
        }

        log('Audio tracks:', audioTracks.length);

        // Create MediaRecorder
        mediaRecorder = new MediaRecorder(stream, {
          mimeType,
          audioBitsPerSecond,
        });

        // Set up event handlers
        mediaRecorder.ondataavailable = handleDataAvailable;
        mediaRecorder.onstop = handleStop;
        mediaRecorder.onerror = handleError;
        mediaRecorder.onpause = handlePause;
        mediaRecorder.onresume = handleResume;

        // Reset state
        recordedChunks = [];
        startTime = Date.now();
        pausedDuration = 0;
        pauseStartTime = 0;

        // Start recording with time slices
        mediaRecorder.start(timeSlice);

        setState('recording');
        startDurationTracking();

        // Fire initial duration update
        onDurationUpdate?.(0);

        log('Recording started');
      } catch (error) {
        log('Failed to start recording:', error);
        const err = error instanceof Error ? error : new Error('Failed to start recording');
        onError?.(err);
        throw err;
      }
    },

    stopRecording: (): Promise<RecordingResult> => {
      return new Promise((resolve, reject) => {
        if (!mediaRecorder || state === 'inactive') {
          log('Cannot stop - not recording');
          reject(new Error('Not recording'));
          return;
        }

        log('Stopping recording...');

        resolveStop = resolve;
        rejectStop = reject;

        // If paused, resume briefly to ensure all data is captured
        if (mediaRecorder.state === 'paused') {
          mediaRecorder.resume();
        }

        // Stop the recorder
        mediaRecorder.stop();
      });
    },

    pauseRecording: () => {
      if (!mediaRecorder || state !== 'recording') {
        log('Cannot pause - not recording');
        return;
      }

      log('Pausing recording...');
      mediaRecorder.pause();
    },

    resumeRecording: () => {
      if (!mediaRecorder || state !== 'paused') {
        log('Cannot resume - not paused');
        return;
      }

      log('Resuming recording...');
      mediaRecorder.resume();
    },

    getRecordingDuration: () => {
      return calculateDuration();
    },

    getState: () => {
      return state;
    },

    isRecording: () => {
      return state === 'recording';
    },

    isPaused: () => {
      return state === 'paused';
    },

    dispose: () => {
      log('Disposing recorder...');

      stopDurationTracking();

      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        try {
          mediaRecorder.stop();
        } catch {
          // Already stopped
        }
      }

      mediaRecorder = null;
      recordedChunks = [];
      state = 'inactive';
      startTime = 0;
      pausedDuration = 0;
      pauseStartTime = 0;
      resolveStop = null;
      rejectStop = null;

      log('Recorder disposed');
    },
  };

  return recorder;
}

// =============================================================================
// Exports
// =============================================================================

export default {
  createRecorder,
  getSupportedMimeType,
  isRecordingSupported,
};
