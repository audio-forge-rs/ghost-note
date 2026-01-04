/**
 * Microphone Module Tests
 *
 * Tests for microphone access, device enumeration, and audio analysis.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
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
} from './microphone';

// =============================================================================
// Mock Setup
// =============================================================================

// Mock MediaStream
class MockMediaStreamTrack {
  kind = 'audio';
  label = 'Mock Microphone';
  enabled = true;
  muted = false;
  readyState: 'live' | 'ended' = 'live';
  stop = vi.fn(() => {
    this.readyState = 'ended';
  });
}

class MockMediaStream {
  private tracks: MockMediaStreamTrack[] = [new MockMediaStreamTrack()];

  getTracks() {
    return this.tracks;
  }

  getAudioTracks() {
    return this.tracks.filter((t) => t.kind === 'audio');
  }
}

// Mock AnalyserNode
class MockAnalyserNode {
  fftSize = 2048;
  frequencyBinCount = 1024;
  smoothingTimeConstant = 0.8;
  minDecibels = -100;
  maxDecibels = -30;

  getByteTimeDomainData(array: Uint8Array) {
    // Fill with mid-level values (128 = silence, 0 or 255 = max amplitude)
    for (let i = 0; i < array.length; i++) {
      // Simulate some audio with moderate amplitude
      array[i] = 128 + Math.sin(i * 0.1) * 50;
    }
  }

  getByteFrequencyData(array: Uint8Array) {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.random() * 128;
    }
  }
}

// Mock AudioContext
class MockAudioContext {
  state: 'running' | 'suspended' | 'closed' = 'running';
  sampleRate = 44100;

  createAnalyser() {
    return new MockAnalyserNode();
  }

  createMediaStreamSource() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  resume = vi.fn(() => Promise.resolve());
  close = vi.fn(() => Promise.resolve());
}

// Store original globals
const originalNavigator = global.navigator;
const originalWindow = global.window;

// =============================================================================
// Test Suites
// =============================================================================

describe('Microphone Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore navigator
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  describe('Browser Support Detection', () => {
    describe('isMicrophoneSupported', () => {
      it('should return true when mediaDevices.getUserMedia is available', () => {
        Object.defineProperty(global, 'navigator', {
          value: {
            mediaDevices: {
              getUserMedia: vi.fn(),
            },
          },
          writable: true,
          configurable: true,
        });

        expect(isMicrophoneSupported()).toBe(true);
      });

      it('should return false when navigator is undefined', () => {
        Object.defineProperty(global, 'navigator', {
          value: undefined,
          writable: true,
          configurable: true,
        });

        expect(isMicrophoneSupported()).toBe(false);
      });

      it('should return false when mediaDevices is undefined', () => {
        Object.defineProperty(global, 'navigator', {
          value: {},
          writable: true,
          configurable: true,
        });

        expect(isMicrophoneSupported()).toBe(false);
      });

      it('should return false when getUserMedia is not a function', () => {
        Object.defineProperty(global, 'navigator', {
          value: {
            mediaDevices: {},
          },
          writable: true,
          configurable: true,
        });

        expect(isMicrophoneSupported()).toBe(false);
      });
    });

    describe('isDeviceEnumerationSupported', () => {
      it('should return true when enumerateDevices is available', () => {
        Object.defineProperty(global, 'navigator', {
          value: {
            mediaDevices: {
              enumerateDevices: vi.fn(),
            },
          },
          writable: true,
          configurable: true,
        });

        expect(isDeviceEnumerationSupported()).toBe(true);
      });

      it('should return false when not available', () => {
        Object.defineProperty(global, 'navigator', {
          value: {},
          writable: true,
          configurable: true,
        });

        expect(isDeviceEnumerationSupported()).toBe(false);
      });
    });

    describe('isWebAudioSupported', () => {
      it('should return true when AudioContext is available', () => {
        Object.defineProperty(global, 'window', {
          value: {
            AudioContext: MockAudioContext,
          },
          writable: true,
          configurable: true,
        });

        expect(isWebAudioSupported()).toBe(true);
      });

      it('should return true when webkitAudioContext is available', () => {
        Object.defineProperty(global, 'window', {
          value: {
            webkitAudioContext: MockAudioContext,
          },
          writable: true,
          configurable: true,
        });

        expect(isWebAudioSupported()).toBe(true);
      });

      it('should return false when neither is available', () => {
        Object.defineProperty(global, 'window', {
          value: {},
          writable: true,
          configurable: true,
        });

        expect(isWebAudioSupported()).toBe(false);
      });
    });
  });

  describe('Permission Handling', () => {
    describe('queryMicrophonePermission', () => {
      it('should return "unsupported" when microphone is not supported', async () => {
        Object.defineProperty(global, 'navigator', {
          value: {},
          writable: true,
          configurable: true,
        });

        const result = await queryMicrophonePermission();
        expect(result).toBe('unsupported');
      });

      it('should query permissions API when available', async () => {
        const mockQuery = vi.fn().mockResolvedValue({ state: 'granted' });

        Object.defineProperty(global, 'navigator', {
          value: {
            mediaDevices: { getUserMedia: vi.fn() },
            permissions: { query: mockQuery },
          },
          writable: true,
          configurable: true,
        });

        const result = await queryMicrophonePermission();
        expect(result).toBe('granted');
        expect(mockQuery).toHaveBeenCalledWith({ name: 'microphone' });
      });

      it('should return "prompt" when permissions API is not available', async () => {
        Object.defineProperty(global, 'navigator', {
          value: {
            mediaDevices: { getUserMedia: vi.fn() },
          },
          writable: true,
          configurable: true,
        });

        const result = await queryMicrophonePermission();
        expect(result).toBe('prompt');
      });

      it('should return "prompt" when permissions query throws', async () => {
        const mockQuery = vi.fn().mockRejectedValue(new Error('Not supported'));

        Object.defineProperty(global, 'navigator', {
          value: {
            mediaDevices: { getUserMedia: vi.fn() },
            permissions: { query: mockQuery },
          },
          writable: true,
          configurable: true,
        });

        const result = await queryMicrophonePermission();
        expect(result).toBe('prompt');
      });
    });

    describe('requestMicrophoneAccess', () => {
      it('should return error when microphone is not supported', async () => {
        Object.defineProperty(global, 'navigator', {
          value: {},
          writable: true,
          configurable: true,
        });

        const result = await requestMicrophoneAccess();
        expect(result.success).toBe(false);
        expect(result.stream).toBeNull();
        expect(result.permissionState).toBe('unsupported');
        expect(result.error).toContain('not supported');
      });

      it('should return stream on success', async () => {
        const mockStream = new MockMediaStream();
        const mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);

        Object.defineProperty(global, 'navigator', {
          value: {
            mediaDevices: { getUserMedia: mockGetUserMedia },
          },
          writable: true,
          configurable: true,
        });

        const result = await requestMicrophoneAccess();

        expect(result.success).toBe(true);
        expect(result.stream).toBe(mockStream);
        expect(result.error).toBeNull();
        expect(result.permissionState).toBe('granted');
        expect(mockGetUserMedia).toHaveBeenCalledWith({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
      });

      it('should include device ID in constraints when specified', async () => {
        const mockStream = new MockMediaStream();
        const mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);

        Object.defineProperty(global, 'navigator', {
          value: {
            mediaDevices: { getUserMedia: mockGetUserMedia },
          },
          writable: true,
          configurable: true,
        });

        await requestMicrophoneAccess('device-123');

        expect(mockGetUserMedia).toHaveBeenCalledWith({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            deviceId: { exact: 'device-123' },
          },
          video: false,
        });
      });

      it('should handle NotAllowedError', async () => {
        const error = new Error('Permission denied');
        error.name = 'NotAllowedError';
        const mockGetUserMedia = vi.fn().mockRejectedValue(error);

        Object.defineProperty(global, 'navigator', {
          value: {
            mediaDevices: { getUserMedia: mockGetUserMedia },
          },
          writable: true,
          configurable: true,
        });

        const result = await requestMicrophoneAccess();

        expect(result.success).toBe(false);
        expect(result.stream).toBeNull();
        expect(result.permissionState).toBe('denied');
        expect(result.error).toContain('denied');
      });

      it('should handle NotFoundError', async () => {
        const error = new Error('No microphone found');
        error.name = 'NotFoundError';
        const mockGetUserMedia = vi.fn().mockRejectedValue(error);

        Object.defineProperty(global, 'navigator', {
          value: {
            mediaDevices: { getUserMedia: mockGetUserMedia },
          },
          writable: true,
          configurable: true,
        });

        const result = await requestMicrophoneAccess();

        expect(result.success).toBe(false);
        expect(result.error).toContain('No microphone');
      });
    });
  });

  describe('stopMediaStream', () => {
    it('should stop all tracks in the stream', () => {
      const mockStream = new MockMediaStream();
      const tracks = mockStream.getTracks();

      stopMediaStream(mockStream as unknown as MediaStream);

      tracks.forEach((track) => {
        expect(track.stop).toHaveBeenCalled();
        expect(track.readyState).toBe('ended');
      });
    });

    it('should handle null stream gracefully', () => {
      expect(() => stopMediaStream(null)).not.toThrow();
    });
  });

  describe('Device Enumeration', () => {
    describe('getMicrophoneDevices', () => {
      it('should return empty array when not supported', async () => {
        Object.defineProperty(global, 'navigator', {
          value: {},
          writable: true,
          configurable: true,
        });

        const devices = await getMicrophoneDevices();
        expect(devices).toEqual([]);
      });

      it('should return audio input devices', async () => {
        const mockDevices = [
          { kind: 'audioinput', deviceId: 'mic1', label: 'Microphone 1', groupId: 'g1' },
          { kind: 'audioinput', deviceId: 'mic2', label: 'Microphone 2', groupId: 'g2' },
          { kind: 'videoinput', deviceId: 'cam1', label: 'Camera 1', groupId: 'g3' },
          { kind: 'audiooutput', deviceId: 'spk1', label: 'Speaker 1', groupId: 'g1' },
        ];

        Object.defineProperty(global, 'navigator', {
          value: {
            mediaDevices: {
              enumerateDevices: vi.fn().mockResolvedValue(mockDevices),
            },
          },
          writable: true,
          configurable: true,
        });

        const devices = await getMicrophoneDevices();

        expect(devices).toHaveLength(2);
        expect(devices[0].deviceId).toBe('mic1');
        expect(devices[0].label).toBe('Microphone 1');
        expect(devices[0].isDefault).toBe(true); // First device
        expect(devices[1].deviceId).toBe('mic2');
        expect(devices[1].isDefault).toBe(false);
      });

      it('should provide fallback labels when empty', async () => {
        const mockDevices = [
          { kind: 'audioinput', deviceId: 'mic1', label: '', groupId: 'g1' },
          { kind: 'audioinput', deviceId: 'mic2', label: '', groupId: 'g2' },
        ];

        Object.defineProperty(global, 'navigator', {
          value: {
            mediaDevices: {
              enumerateDevices: vi.fn().mockResolvedValue(mockDevices),
            },
          },
          writable: true,
          configurable: true,
        });

        const devices = await getMicrophoneDevices();

        expect(devices[0].label).toBe('Microphone 1');
        expect(devices[1].label).toBe('Microphone 2');
      });

      it('should handle enumeration errors', async () => {
        Object.defineProperty(global, 'navigator', {
          value: {
            mediaDevices: {
              enumerateDevices: vi.fn().mockRejectedValue(new Error('Enumeration failed')),
            },
          },
          writable: true,
          configurable: true,
        });

        const devices = await getMicrophoneDevices();
        expect(devices).toEqual([]);
      });
    });

    describe('onDeviceChange', () => {
      it('should add and remove event listener', () => {
        const mockAddEventListener = vi.fn();
        const mockRemoveEventListener = vi.fn();

        Object.defineProperty(global, 'navigator', {
          value: {
            mediaDevices: {
              addEventListener: mockAddEventListener,
              removeEventListener: mockRemoveEventListener,
            },
          },
          writable: true,
          configurable: true,
        });

        const callback = vi.fn();
        const unsubscribe = onDeviceChange(callback);

        expect(mockAddEventListener).toHaveBeenCalledWith('devicechange', expect.any(Function));

        unsubscribe();

        expect(mockRemoveEventListener).toHaveBeenCalledWith(
          'devicechange',
          expect.any(Function)
        );
      });

      it('should return no-op when mediaDevices is not available', () => {
        Object.defineProperty(global, 'navigator', {
          value: {},
          writable: true,
          configurable: true,
        });

        const callback = vi.fn();
        const unsubscribe = onDeviceChange(callback);

        expect(() => unsubscribe()).not.toThrow();
      });
    });
  });

  describe('Audio Analysis', () => {
    beforeEach(() => {
      Object.defineProperty(global, 'window', {
        value: {
          AudioContext: MockAudioContext,
        },
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(global, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true,
      });
    });

    describe('createAudioAnalyzer', () => {
      it('should create analyzer with default options', () => {
        const mockStream = new MockMediaStream();

        const result = createAudioAnalyzer(mockStream as unknown as MediaStream);

        expect(result.analyser).toBeDefined();
        expect(result.audioContext).toBeDefined();
        expect(result.source).toBeDefined();
        expect(result.dispose).toBeDefined();
        expect(result.source.connect).toHaveBeenCalledWith(result.analyser);
      });

      it('should apply custom options', () => {
        const mockStream = new MockMediaStream();

        const result = createAudioAnalyzer(mockStream as unknown as MediaStream, {
          fftSize: 4096,
          smoothingTimeConstant: 0.5,
          minDecibels: -90,
          maxDecibels: -20,
        });

        expect(result.analyser.fftSize).toBe(4096);
        expect(result.analyser.smoothingTimeConstant).toBe(0.5);
        expect(result.analyser.minDecibels).toBe(-90);
        expect(result.analyser.maxDecibels).toBe(-20);
      });

      it('should clean up on dispose', () => {
        const mockStream = new MockMediaStream();

        const result = createAudioAnalyzer(mockStream as unknown as MediaStream);

        result.dispose();

        expect(result.source.disconnect).toHaveBeenCalled();
        expect(result.audioContext.close).toHaveBeenCalled();
      });
    });

    describe('getAudioLevel', () => {
      it('should return normalized level between 0 and 1', () => {
        const analyser = new MockAnalyserNode();

        const level = getAudioLevel(analyser as unknown as AnalyserNode);

        expect(level).toBeGreaterThanOrEqual(0);
        expect(level).toBeLessThanOrEqual(1);
      });
    });

    describe('getPeakLevel', () => {
      it('should return normalized peak between 0 and 1', () => {
        const analyser = new MockAnalyserNode();

        const peak = getPeakLevel(analyser as unknown as AnalyserNode);

        expect(peak).toBeGreaterThanOrEqual(0);
        expect(peak).toBeLessThanOrEqual(1);
      });
    });

    describe('createAudioLevelMonitor', () => {
      it('should create monitor with default options', () => {
        const analyser = new MockAnalyserNode();

        const monitor = createAudioLevelMonitor(analyser as unknown as AnalyserNode);

        expect(monitor.start).toBeDefined();
        expect(monitor.stop).toBeDefined();
        expect(monitor.getLevel).toBeDefined();
        expect(monitor.getPeak).toBeDefined();
        expect(monitor.resetPeak).toBeDefined();
        expect(monitor.isActive).toBeDefined();
        expect(monitor.dispose).toBeDefined();
      });

      it('should start and stop monitoring', () => {
        const analyser = new MockAnalyserNode();

        const monitor = createAudioLevelMonitor(analyser as unknown as AnalyserNode);

        expect(monitor.isActive()).toBe(false);

        monitor.start();
        expect(monitor.isActive()).toBe(true);

        monitor.stop();
        expect(monitor.isActive()).toBe(false);
      });

      it('should reset peak level', () => {
        const analyser = new MockAnalyserNode();

        const monitor = createAudioLevelMonitor(analyser as unknown as AnalyserNode);

        // Simulate some activity
        monitor.start();
        monitor.stop();

        monitor.resetPeak();
        expect(monitor.getPeak()).toBe(0);
      });

      it('should dispose properly', () => {
        const analyser = new MockAnalyserNode();

        const monitor = createAudioLevelMonitor(analyser as unknown as AnalyserNode);
        monitor.start();
        monitor.dispose();

        expect(monitor.isActive()).toBe(false);
        expect(monitor.getLevel()).toBe(0);
        expect(monitor.getPeak()).toBe(0);
      });
    });
  });
});
