/**
 * Microphone Access and Audio Analysis Module
 *
 * Provides utilities for requesting microphone access, enumerating audio devices,
 * and creating audio analyzers for visualization.
 *
 * @module lib/audio/microphone
 */

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[Microphone] ${message}`, ...args);
  }
};

// =============================================================================
// Types
// =============================================================================

/**
 * Permission state for microphone access
 */
export type MicrophonePermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

/**
 * Result from requesting microphone access
 */
export interface MicrophoneAccessResult {
  /** Whether access was granted */
  success: boolean;
  /** The media stream if access was granted */
  stream: MediaStream | null;
  /** Error message if access failed */
  error: string | null;
  /** The permission state */
  permissionState: MicrophonePermissionState;
}

/**
 * Audio device information
 */
export interface AudioDeviceInfo {
  /** Unique device identifier */
  deviceId: string;
  /** Human-readable device label */
  label: string;
  /** Device group ID (for matching input/output pairs) */
  groupId: string;
  /** Whether this is the default device */
  isDefault: boolean;
}

/**
 * Options for creating an audio analyzer
 */
export interface AnalyzerOptions {
  /** FFT size for frequency analysis (must be power of 2, default: 2048) */
  fftSize?: number;
  /** Smoothing time constant for frequency data (0-1, default: 0.8) */
  smoothingTimeConstant?: number;
  /** Minimum decibels for frequency data (default: -100) */
  minDecibels?: number;
  /** Maximum decibels for frequency data (default: -30) */
  maxDecibels?: number;
}

/**
 * Audio analyzer result with both the analyzer node and supporting objects
 */
export interface AudioAnalyzerResult {
  /** The AnalyserNode for getting audio data */
  analyser: AnalyserNode;
  /** The AudioContext used */
  audioContext: AudioContext;
  /** The MediaStreamAudioSourceNode */
  source: MediaStreamAudioSourceNode;
  /** Function to clean up resources */
  dispose: () => void;
}

/**
 * Callback for audio level changes
 */
export type AudioLevelCallback = (level: number, peak: number) => void;

/**
 * Options for the audio level monitor
 */
export interface AudioLevelMonitorOptions {
  /** How often to update the level in milliseconds (default: 50) */
  updateInterval?: number;
  /** Smoothing factor for level changes (0-1, default: 0.8) */
  smoothing?: number;
  /** Callback for level updates */
  onLevel?: AudioLevelCallback;
}

/**
 * Audio level monitor that continuously reports audio levels
 */
export interface AudioLevelMonitor {
  /** Start monitoring */
  start: () => void;
  /** Stop monitoring */
  stop: () => void;
  /** Get the current level (0-1) */
  getLevel: () => number;
  /** Get the peak level (0-1) */
  getPeak: () => number;
  /** Reset peak level */
  resetPeak: () => void;
  /** Check if monitoring is active */
  isActive: () => boolean;
  /** Dispose of resources */
  dispose: () => void;
}

// =============================================================================
// Browser Compatibility
// =============================================================================

/**
 * Check if microphone access is supported in the current browser
 */
export function isMicrophoneSupported(): boolean {
  const supported =
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices !== undefined &&
    typeof navigator.mediaDevices.getUserMedia === 'function';

  log('Microphone support check:', supported);
  return supported;
}

/**
 * Check if device enumeration is supported
 */
export function isDeviceEnumerationSupported(): boolean {
  const supported =
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices !== undefined &&
    typeof navigator.mediaDevices.enumerateDevices === 'function';

  log('Device enumeration support check:', supported);
  return supported;
}

/**
 * Check if Web Audio API is supported
 */
export function isWebAudioSupported(): boolean {
  const supported =
    typeof window !== 'undefined' &&
    (window.AudioContext !== undefined ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitAudioContext !== undefined);

  log('Web Audio API support check:', supported);
  return supported;
}

// =============================================================================
// Permission Handling
// =============================================================================

/**
 * Query the current microphone permission state
 *
 * @returns The current permission state
 */
export async function queryMicrophonePermission(): Promise<MicrophonePermissionState> {
  log('Querying microphone permission...');

  if (!isMicrophoneSupported()) {
    log('Microphone not supported');
    return 'unsupported';
  }

  try {
    // Check if the Permissions API is available
    if (navigator.permissions && navigator.permissions.query) {
      const result = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      });

      log('Permission state:', result.state);
      return result.state as MicrophonePermissionState;
    }

    // Permissions API not available, return 'prompt' as we don't know
    log('Permissions API not available, returning prompt');
    return 'prompt';
  } catch (error) {
    // Some browsers throw for microphone permission query
    log('Permission query failed:', error);
    return 'prompt';
  }
}

/**
 * Request microphone access
 *
 * @param deviceId - Optional specific device ID to request
 * @returns Result object with stream or error information
 */
export async function requestMicrophoneAccess(
  deviceId?: string
): Promise<MicrophoneAccessResult> {
  log('Requesting microphone access...', deviceId ? `Device: ${deviceId}` : 'Default device');

  if (!isMicrophoneSupported()) {
    log('Microphone not supported in this browser');
    return {
      success: false,
      stream: null,
      error: 'Microphone access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.',
      permissionState: 'unsupported',
    };
  }

  try {
    // Build audio constraints
    const audioConstraints: MediaTrackConstraints = {
      // Request echo cancellation and noise suppression for better recording
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    };

    // Add device ID if specified
    if (deviceId) {
      audioConstraints.deviceId = { exact: deviceId };
    }

    log('Requesting getUserMedia with constraints:', audioConstraints);

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: audioConstraints,
      video: false,
    });

    log('Microphone access granted, tracks:', stream.getAudioTracks().length);

    // Log track details
    stream.getAudioTracks().forEach((track, index) => {
      log(`Track ${index}:`, {
        label: track.label,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
      });
    });

    return {
      success: true,
      stream,
      error: null,
      permissionState: 'granted',
    };
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    const permissionState = getPermissionStateFromError(error);

    log('Microphone access failed:', errorMessage, 'State:', permissionState);

    return {
      success: false,
      stream: null,
      error: errorMessage,
      permissionState,
    };
  }
}

/**
 * Stop all tracks in a media stream and release resources
 *
 * @param stream - The media stream to stop
 */
export function stopMediaStream(stream: MediaStream | null): void {
  if (!stream) return;

  log('Stopping media stream...');

  stream.getTracks().forEach((track) => {
    log('Stopping track:', track.label);
    track.stop();
  });

  log('Media stream stopped');
}

// =============================================================================
// Device Enumeration
// =============================================================================

/**
 * Get a list of available audio input devices (microphones)
 *
 * Note: Device labels may be empty until permission is granted.
 * Call requestMicrophoneAccess first to get device labels.
 *
 * @returns List of audio input devices
 */
export async function getMicrophoneDevices(): Promise<AudioDeviceInfo[]> {
  log('Getting microphone devices...');

  if (!isDeviceEnumerationSupported()) {
    log('Device enumeration not supported');
    return [];
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();

    // Filter to audio input devices
    const audioInputs = devices
      .filter((device) => device.kind === 'audioinput')
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Microphone ${index + 1}`,
        groupId: device.groupId,
        isDefault: device.deviceId === 'default' || index === 0,
      }));

    log('Found', audioInputs.length, 'microphone devices:', audioInputs);

    return audioInputs;
  } catch (error) {
    log('Failed to enumerate devices:', error);
    return [];
  }
}

/**
 * Set up a listener for device changes (plugging in/removing microphones)
 *
 * @param callback - Function to call when devices change
 * @returns Function to remove the listener
 */
export function onDeviceChange(callback: () => void): () => void {
  log('Setting up device change listener');

  if (!navigator.mediaDevices) {
    log('mediaDevices not available');
    return () => {};
  }

  const handler = () => {
    log('Device change detected');
    callback();
  };

  navigator.mediaDevices.addEventListener('devicechange', handler);

  return () => {
    log('Removing device change listener');
    navigator.mediaDevices.removeEventListener('devicechange', handler);
  };
}

// =============================================================================
// Audio Analysis
// =============================================================================

/**
 * Create an audio analyzer node for visualizing audio levels
 *
 * @param stream - The media stream to analyze
 * @param options - Analyzer configuration options
 * @returns The analyzer result with cleanup function
 */
export function createAudioAnalyzer(
  stream: MediaStream,
  options: AnalyzerOptions = {}
): AudioAnalyzerResult {
  log('Creating audio analyzer...');

  const {
    fftSize = 2048,
    smoothingTimeConstant = 0.8,
    minDecibels = -100,
    maxDecibels = -30,
  } = options;

  // Create audio context
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContextClass();

  log('AudioContext created, sample rate:', audioContext.sampleRate);

  // Create source from stream
  const source = audioContext.createMediaStreamSource(stream);
  log('MediaStreamAudioSourceNode created');

  // Create analyzer node
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = fftSize;
  analyser.smoothingTimeConstant = smoothingTimeConstant;
  analyser.minDecibels = minDecibels;
  analyser.maxDecibels = maxDecibels;

  log('AnalyserNode created with config:', {
    fftSize: analyser.fftSize,
    frequencyBinCount: analyser.frequencyBinCount,
    smoothingTimeConstant: analyser.smoothingTimeConstant,
  });

  // Connect source to analyzer
  source.connect(analyser);
  log('Source connected to analyzer');

  // Cleanup function
  const dispose = () => {
    log('Disposing audio analyzer...');
    try {
      source.disconnect();
    } catch {
      // Already disconnected
    }
    if (audioContext.state !== 'closed') {
      audioContext.close().catch((e) => log('Error closing AudioContext:', e));
    }
    log('Audio analyzer disposed');
  };

  return {
    analyser,
    audioContext,
    source,
    dispose,
  };
}

/**
 * Get the current audio level from an analyzer (0-1)
 *
 * @param analyser - The AnalyserNode to read from
 * @returns Normalized audio level (0-1)
 */
export function getAudioLevel(analyser: AnalyserNode): number {
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteTimeDomainData(dataArray);

  // Calculate RMS (Root Mean Square) for a more accurate level
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    // Convert from 0-255 range to -1 to 1 range
    const value = (dataArray[i] - 128) / 128;
    sum += value * value;
  }

  const rms = Math.sqrt(sum / dataArray.length);

  // Scale RMS to 0-1 range (RMS of full-scale sine wave is ~0.707)
  const level = Math.min(1, rms * 1.414);

  return level;
}

/**
 * Get the peak audio level from an analyzer (0-1)
 *
 * @param analyser - The AnalyserNode to read from
 * @returns Normalized peak level (0-1)
 */
export function getPeakLevel(analyser: AnalyserNode): number {
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteTimeDomainData(dataArray);

  // Find the peak value
  let peak = 0;
  for (let i = 0; i < dataArray.length; i++) {
    // Convert to absolute value in 0-1 range
    const value = Math.abs(dataArray[i] - 128) / 128;
    if (value > peak) {
      peak = value;
    }
  }

  return peak;
}

/**
 * Create an audio level monitor that continuously reports audio levels
 *
 * @param analyser - The AnalyserNode to monitor
 * @param options - Monitor options
 * @returns Audio level monitor object
 */
export function createAudioLevelMonitor(
  analyser: AnalyserNode,
  options: AudioLevelMonitorOptions = {}
): AudioLevelMonitor {
  log('Creating audio level monitor...');

  const { updateInterval = 50, smoothing = 0.8, onLevel } = options;

  let animationFrameId: number | null = null;
  let lastUpdateTime = 0;
  let currentLevel = 0;
  let peakLevel = 0;
  let active = false;

  const update = (timestamp: number) => {
    if (!active) return;

    // Throttle updates to the configured interval
    if (timestamp - lastUpdateTime >= updateInterval) {
      const rawLevel = getAudioLevel(analyser);
      const rawPeak = getPeakLevel(analyser);

      // Apply smoothing
      currentLevel = currentLevel * smoothing + rawLevel * (1 - smoothing);

      // Update peak (with slow decay)
      if (rawPeak > peakLevel) {
        peakLevel = rawPeak;
      } else {
        peakLevel = peakLevel * 0.995; // Slow decay
      }

      // Call callback
      onLevel?.(currentLevel, peakLevel);

      lastUpdateTime = timestamp;
    }

    animationFrameId = requestAnimationFrame(update);
  };

  const monitor: AudioLevelMonitor = {
    start: () => {
      if (active) return;
      log('Starting audio level monitor');
      active = true;
      lastUpdateTime = 0;
      animationFrameId = requestAnimationFrame(update);
    },

    stop: () => {
      if (!active) return;
      log('Stopping audio level monitor');
      active = false;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    },

    getLevel: () => currentLevel,

    getPeak: () => peakLevel,

    resetPeak: () => {
      peakLevel = 0;
      log('Peak level reset');
    },

    isActive: () => active,

    dispose: () => {
      monitor.stop();
      currentLevel = 0;
      peakLevel = 0;
      log('Audio level monitor disposed');
    },
  };

  return monitor;
}

// =============================================================================
// Error Handling Helpers
// =============================================================================

/**
 * Get a user-friendly error message from a getUserMedia error
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const name = error.name;
    const message = error.message;

    switch (name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return 'Microphone access was denied. Please allow microphone access in your browser settings and try again.';

      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'No microphone was found. Please connect a microphone and try again.';

      case 'NotReadableError':
      case 'TrackStartError':
        return 'Could not access the microphone. It may be in use by another application.';

      case 'OverconstrainedError':
        return 'The requested microphone settings are not supported.';

      case 'SecurityError':
        return 'Microphone access is not allowed in this context. Please ensure you are using HTTPS.';

      case 'AbortError':
        return 'Microphone access was cancelled.';

      default:
        return message || 'An unknown error occurred while accessing the microphone.';
    }
  }

  return 'An unknown error occurred while accessing the microphone.';
}

/**
 * Determine permission state from an error
 */
function getPermissionStateFromError(error: unknown): MicrophonePermissionState {
  if (error instanceof Error) {
    const name = error.name;

    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return 'denied';
    }
  }

  return 'prompt';
}

// =============================================================================
// Exports
// =============================================================================

export default {
  isMicrophoneSupported,
  isDeviceEnumerationSupported,
  isWebAudioSupported,
  queryMicrophonePermission,
  requestMicrophoneAccess,
  stopMediaStream,
  getMicrophoneDevices,
  onDeviceChange,
  createAudioAnalyzer,
  getAudioLevel,
  getPeakLevel,
  createAudioLevelMonitor,
};
