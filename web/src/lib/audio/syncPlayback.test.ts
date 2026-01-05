/**
 * SyncPlayback Module Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  startSyncedSession,
  setGuideTrackVolume,
  setClickTrackEnabled,
  getLyricForPosition,
  type SyncSession,
  type SyncSessionConfig,
} from './syncPlayback';
import type { Melody } from '../melody/types';

// Mock the audio modules with stateful recorder
vi.mock('./recorder', () => {
  let recorderState = 'inactive';
  return {
    createRecorder: vi.fn(() => ({
      startRecording: vi.fn(() => {
        recorderState = 'recording';
      }),
      stopRecording: vi.fn(() => {
        recorderState = 'inactive';
        return Promise.resolve({
          blob: new Blob(),
          duration: 10,
          mimeType: 'audio/webm',
        });
      }),
      pauseRecording: vi.fn(() => {
        recorderState = 'paused';
      }),
      resumeRecording: vi.fn(() => {
        recorderState = 'recording';
      }),
      getRecordingDuration: vi.fn(() => 0),
      getState: vi.fn(() => recorderState),
      isRecording: vi.fn(() => recorderState === 'recording'),
      isPaused: vi.fn(() => recorderState === 'paused'),
      dispose: vi.fn(() => {
        recorderState = 'inactive';
      }),
    })),
  };
});

vi.mock('./microphone', () => ({
  requestMicrophoneAccess: vi.fn(() =>
    Promise.resolve({
      success: true,
      stream: {
        getTracks: () => [],
        getAudioTracks: () => [],
      },
      error: null,
      permissionState: 'granted',
    })
  ),
  stopMediaStream: vi.fn(),
}));

vi.mock('../music/abcRenderer', () => {
  // Create a proper class mock
  class MockAbcSynth {
    init = vi.fn(() => Promise.resolve(true));
    load = vi.fn(() => Promise.resolve(true));
    play = vi.fn(() => Promise.resolve(true));
    pause = vi.fn(() => true);
    resume = vi.fn(() => true);
    stop = vi.fn(() => true);
    setVolume = vi.fn();
    dispose = vi.fn();
    getState = vi.fn(() => 'ready');
  }

  return {
    AbcSynth: MockAbcSynth,
    renderABC: vi.fn(() => ({
      success: true,
      tuneObjects: [{}],
      error: undefined,
    })),
  };
});

// Mock AudioContext
class MockAudioContext {
  state = 'running';
  currentTime = 0;
  destination = {};
  sampleRate = 44100;

  resume = vi.fn(() => Promise.resolve());
  close = vi.fn(() => Promise.resolve());
  createGain = vi.fn(() => ({
    gain: { value: 1 },
    connect: vi.fn(),
    disconnect: vi.fn(),
  }));
  createOscillator = vi.fn(() => ({
    frequency: { value: 440 },
    type: 'sine',
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }));
}

global.AudioContext = MockAudioContext as unknown as typeof AudioContext;

// Sample melody for testing
const createTestMelody = (): Melody => ({
  params: {
    title: 'Test Song',
    timeSignature: '4/4',
    defaultNoteLength: '1/8',
    tempo: 120,
    key: 'C',
  },
  measures: [
    [
      { pitch: 'C', octave: 0, duration: 1 },
      { pitch: 'D', octave: 0, duration: 1 },
    ],
    [
      { pitch: 'E', octave: 0, duration: 1 },
      { pitch: 'F', octave: 0, duration: 1 },
    ],
  ],
  lyrics: [
    ['Hel-', 'lo'],
    ['World', '!'],
  ],
});

const testAbc = `X:1
T:Test Song
M:4/4
L:1/8
Q:1/4=120
K:C
C2 D2 E2 F2 |]
w: Hel-lo World!`;

describe('SyncPlayback', () => {
  let session: SyncSession | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (session) {
      session.dispose();
      session = null;
    }
  });

  describe('startSyncedSession', () => {
    it('should create a session with default config', async () => {
      const melody = createTestMelody();
      session = await startSyncedSession(melody, testAbc);

      expect(session).toBeDefined();
      expect(session.getState()).toBe('ready');
    });

    it('should create a session with custom config', async () => {
      const melody = createTestMelody();
      const config: SyncSessionConfig = {
        guideVolume: 0.5,
        clickTrackEnabled: true,
        clickVolume: 0.7,
        countdownSeconds: 5,
      };

      session = await startSyncedSession(melody, testAbc, config);

      expect(session).toBeDefined();
      expect(session.getGuideVolume()).toBe(0.5);
      expect(session.isClickTrackEnabled()).toBe(true);
      expect(session.getClickVolume()).toBe(0.7);
    });

    it('should call onStateChange callback', async () => {
      const melody = createTestMelody();
      const onStateChange = vi.fn();

      session = await startSyncedSession(melody, testAbc, { onStateChange });

      expect(onStateChange).toHaveBeenCalled();
    });

    it('should parse lyric timings', async () => {
      const melody = createTestMelody();
      session = await startSyncedSession(melody, testAbc);

      const timings = session.getLyricTimings();
      expect(timings.length).toBeGreaterThan(0);
    });
  });

  describe('Session controls', () => {
    it('should start and stop recording', async () => {
      const melody = createTestMelody();
      const onRecordingDuration = vi.fn();

      session = await startSyncedSession(melody, testAbc, {
        countdownSeconds: 0,
        onRecordingDuration,
      });

      await session.start();
      expect(session.getState()).toBe('recording');

      const result = await session.stop();
      expect(result).toBeDefined();
      expect(result.blob).toBeDefined();
      expect(result.melody).toBe(melody);
      expect(result.abcNotation).toBe(testAbc);
    });

    it('should pause and resume recording', async () => {
      const melody = createTestMelody();
      session = await startSyncedSession(melody, testAbc, {
        countdownSeconds: 0,
      });

      await session.start();
      session.pause();
      expect(session.getState()).toBe('paused');

      session.resume();
      expect(session.getState()).toBe('recording');
    });

    it('should not start when not ready', async () => {
      const melody = createTestMelody();
      session = await startSyncedSession(melody, testAbc);

      // Start once
      await session.start();

      // Try to start again while recording - should do nothing
      await session.start();

      // State should be unchanged or recording
      expect(['countdown', 'recording'].includes(session.getState())).toBe(true);
    });
  });

  describe('Guide volume control', () => {
    it('should get and set guide volume', async () => {
      const melody = createTestMelody();
      session = await startSyncedSession(melody, testAbc, {
        guideVolume: 0.8,
      });

      expect(session.getGuideVolume()).toBe(0.8);

      session.setGuideVolume(0.5);
      expect(session.getGuideVolume()).toBe(0.5);
    });

    it('should clamp guide volume to valid range', async () => {
      const melody = createTestMelody();
      session = await startSyncedSession(melody, testAbc);

      session.setGuideVolume(1.5);
      expect(session.getGuideVolume()).toBe(1);

      session.setGuideVolume(-0.5);
      expect(session.getGuideVolume()).toBe(0);
    });
  });

  describe('Click track control', () => {
    it('should enable and disable click track', async () => {
      const melody = createTestMelody();
      session = await startSyncedSession(melody, testAbc, {
        clickTrackEnabled: false,
      });

      expect(session.isClickTrackEnabled()).toBe(false);

      session.setClickTrackEnabled(true);
      expect(session.isClickTrackEnabled()).toBe(true);

      session.setClickTrackEnabled(false);
      expect(session.isClickTrackEnabled()).toBe(false);
    });

    it('should get and set click volume', async () => {
      const melody = createTestMelody();
      session = await startSyncedSession(melody, testAbc, {
        clickTrackEnabled: true,
        clickVolume: 0.5,
      });

      expect(session.getClickVolume()).toBe(0.5);

      session.setClickVolume(0.8);
      expect(session.getClickVolume()).toBe(0.8);
    });

    it('should clamp click volume to valid range', async () => {
      const melody = createTestMelody();
      session = await startSyncedSession(melody, testAbc, {
        clickTrackEnabled: true,
      });

      session.setClickVolume(1.5);
      expect(session.getClickVolume()).toBe(1);

      session.setClickVolume(-0.5);
      expect(session.getClickVolume()).toBe(0);
    });
  });

  describe('Lyric position tracking', () => {
    it('should get lyric for position', async () => {
      const melody = createTestMelody();
      session = await startSyncedSession(melody, testAbc);

      const timings = session.getLyricTimings();
      if (timings.length > 0) {
        const midTime = (timings[0].startTime + timings[0].endTime) / 2;
        const lyric = session.getLyricForPosition(midTime);
        expect(lyric).toBe(timings[0].text);
      }
    });

    it('should return empty string for position without lyrics', async () => {
      const melody = createTestMelody();
      session = await startSyncedSession(melody, testAbc);

      const lyric = session.getLyricForPosition(-1);
      expect(lyric).toBe('');
    });

    it('should get lyric timing for position', async () => {
      const melody = createTestMelody();
      session = await startSyncedSession(melody, testAbc);

      const timings = session.getLyricTimings();
      if (timings.length > 0) {
        const midTime = (timings[0].startTime + timings[0].endTime) / 2;
        const timing = session.getLyricTimingForPosition(midTime);
        expect(timing).not.toBeNull();
        expect(timing?.text).toBe(timings[0].text);
      }
    });

    it('should return null for position without lyric timing', async () => {
      const melody = createTestMelody();
      session = await startSyncedSession(melody, testAbc);

      const timing = session.getLyricTimingForPosition(-1);
      expect(timing).toBeNull();
    });
  });

  describe('Time tracking', () => {
    it('should track current time and duration', async () => {
      const melody = createTestMelody();
      session = await startSyncedSession(melody, testAbc);

      expect(session.getCurrentTime()).toBe(0);
      expect(session.getDuration()).toBe(0);
    });

    it('should track recording duration', async () => {
      const melody = createTestMelody();
      session = await startSyncedSession(melody, testAbc);

      expect(session.getRecordingDuration()).toBe(0);
    });
  });

  describe('Session cleanup', () => {
    it('should dispose resources properly', async () => {
      const melody = createTestMelody();
      session = await startSyncedSession(melody, testAbc);

      session.dispose();
      expect(session.getState()).toBe('idle');

      // Session ref is null after dispose, no need for further checks
      session = null;
    });
  });

  describe('Convenience functions', () => {
    it('setGuideTrackVolume should update session volume', async () => {
      const melody = createTestMelody();
      session = await startSyncedSession(melody, testAbc);

      setGuideTrackVolume(session, 0.3);
      expect(session.getGuideVolume()).toBe(0.3);
    });

    it('setClickTrackEnabled should update session click track', async () => {
      const melody = createTestMelody();
      session = await startSyncedSession(melody, testAbc);

      setClickTrackEnabled(session, true);
      expect(session.isClickTrackEnabled()).toBe(true);
    });

    it('getLyricForPosition should return lyric from session', async () => {
      const melody = createTestMelody();
      session = await startSyncedSession(melody, testAbc);

      const lyric = getLyricForPosition(session, 0);
      expect(typeof lyric).toBe('string');
    });
  });
});
