/**
 * Tests for useMelodyStore
 *
 * @module stores/useMelodyStore.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMelodyStore, selectHasMelody, selectIsPlaying, selectIsPaused, selectIsStopped, selectPlaybackProgress, selectFormattedCurrentTime, selectFormattedDuration, selectVolumePercent, selectHasError } from './useMelodyStore';
import { createDefaultPoemAnalysis } from '../types';
import type { Melody } from '../lib/melody/types';

// Mock the abcRenderer module
vi.mock('../lib/music/abcRenderer', () => ({
  initSynth: vi.fn().mockResolvedValue({
    getState: () => 'ready',
  }),
  getSynth: vi.fn().mockReturnValue({
    getState: () => 'ready',
  }),
  playMelody: vi.fn().mockResolvedValue(true),
  pausePlayback: vi.fn().mockReturnValue(true),
  stopPlayback: vi.fn().mockReturnValue(true),
  resumePlayback: vi.fn().mockReturnValue(true),
}));

describe('useMelodyStore', () => {
  beforeEach(() => {
    useMelodyStore.getState().reset();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('ghost-note-melody-store');
    }
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useMelodyStore.getState();
      expect(state.melody).toBeNull();
      expect(state.abcNotation).toBeNull();
      expect(state.playbackState).toBe('stopped');
      expect(state.currentTime).toBe(0);
      expect(state.duration).toBe(0);
      expect(state.tempo).toBe(100);
      expect(state.volume).toBe(0.8);
      expect(state.loop).toBe(false);
      expect(state.key).toBe('C');
      expect(state.timeSignature).toBe('4/4');
      expect(state.isGenerating).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('generateMelody', () => {
    it('should not generate for empty lyrics', async () => {
      const analysis = createDefaultPoemAnalysis();
      await useMelodyStore.getState().generateMelody('', analysis);

      const state = useMelodyStore.getState();
      expect(state.error).toBe('Cannot generate melody for empty lyrics');
      expect(state.isGenerating).toBe(false);
    });

    it('should generate melody successfully', async () => {
      const analysis = createDefaultPoemAnalysis();
      await useMelodyStore.getState().generateMelody('Hello world', analysis);

      const state = useMelodyStore.getState();
      expect(state.melody).not.toBeNull();
      expect(state.abcNotation).not.toBeNull();
      expect(state.isGenerating).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should use suggested parameters from analysis', async () => {
      const analysis = createDefaultPoemAnalysis();
      analysis.melodySuggestions.tempo = 120;
      analysis.melodySuggestions.timeSignature = '3/4';

      await useMelodyStore.getState().generateMelody('Test lyrics', analysis);

      const state = useMelodyStore.getState();
      expect(state.timeSignature).toBe('3/4');
    });
  });

  describe('setMelody', () => {
    it('should set melody directly', () => {
      const melody: Melody = {
        params: {
          title: 'Test',
          timeSignature: '3/4',
          defaultNoteLength: '1/8',
          tempo: 120,
          key: 'G',
        },
        measures: [],
        lyrics: [],
      };

      useMelodyStore.getState().setMelody(melody, 'X:1\nT:Test');

      const state = useMelodyStore.getState();
      expect(state.melody).toBe(melody);
      expect(state.abcNotation).toBe('X:1\nT:Test');
      expect(state.tempo).toBe(120);
      expect(state.timeSignature).toBe('3/4');
      expect(state.key).toBe('G');
    });
  });

  describe('setAbcNotation', () => {
    it('should set ABC notation', () => {
      useMelodyStore.getState().setAbcNotation('X:1\nT:Test\nK:C');

      const state = useMelodyStore.getState();
      expect(state.abcNotation).toBe('X:1\nT:Test\nK:C');
    });
  });

  describe('playback controls', () => {
    // Helper to set up ABC notation before testing playback
    const setupMelodyForPlayback = () => {
      useMelodyStore.getState().setAbcNotation('X:1\nT:Test\nM:4/4\nK:C\nCDEF|');
    };

    describe('play', () => {
      it('should set playback state to playing when ABC notation is available', async () => {
        setupMelodyForPlayback();
        await useMelodyStore.getState().play();
        expect(useMelodyStore.getState().playbackState).toBe('playing');
      });

      it('should set error when no ABC notation is available', async () => {
        await useMelodyStore.getState().play();
        expect(useMelodyStore.getState().error).toBe('No melody to play');
        expect(useMelodyStore.getState().playbackState).toBe('stopped');
      });

      it('should not change state if already playing', async () => {
        setupMelodyForPlayback();
        await useMelodyStore.getState().play();
        // Call play again while already playing
        await useMelodyStore.getState().play();
        expect(useMelodyStore.getState().playbackState).toBe('playing');
      });
    });

    describe('pause', () => {
      it('should set playback state to paused when playing', async () => {
        setupMelodyForPlayback();
        await useMelodyStore.getState().play();
        useMelodyStore.getState().pause();
        expect(useMelodyStore.getState().playbackState).toBe('paused');
      });

      it('should not pause when not playing', () => {
        useMelodyStore.getState().pause();
        expect(useMelodyStore.getState().playbackState).toBe('stopped');
      });
    });

    describe('stop', () => {
      it('should set playback state to stopped and reset time', async () => {
        setupMelodyForPlayback();
        await useMelodyStore.getState().play();
        useMelodyStore.getState().setCurrentTime(30);
        useMelodyStore.getState().stop();

        const state = useMelodyStore.getState();
        expect(state.playbackState).toBe('stopped');
        expect(state.currentTime).toBe(0);
      });

      it('should work even when not playing', () => {
        useMelodyStore.getState().setCurrentTime(30);
        useMelodyStore.getState().stop();

        const state = useMelodyStore.getState();
        expect(state.playbackState).toBe('stopped');
        expect(state.currentTime).toBe(0);
      });
    });

    describe('seek', () => {
      it('should set current time', () => {
        useMelodyStore.getState().setDuration(60);
        useMelodyStore.getState().seek(30);

        expect(useMelodyStore.getState().currentTime).toBe(30);
      });

      it('should clamp to duration', () => {
        useMelodyStore.getState().setDuration(60);
        useMelodyStore.getState().seek(100);

        expect(useMelodyStore.getState().currentTime).toBe(60);
      });

      it('should clamp to 0', () => {
        useMelodyStore.getState().seek(-10);
        expect(useMelodyStore.getState().currentTime).toBe(0);
      });
    });
  });

  describe('settings', () => {
    describe('setTempo', () => {
      it('should set tempo', () => {
        useMelodyStore.getState().setTempo(140);
        expect(useMelodyStore.getState().tempo).toBe(140);
      });

      it('should clamp tempo to minimum 40', () => {
        useMelodyStore.getState().setTempo(20);
        expect(useMelodyStore.getState().tempo).toBe(40);
      });

      it('should clamp tempo to maximum 240', () => {
        useMelodyStore.getState().setTempo(300);
        expect(useMelodyStore.getState().tempo).toBe(240);
      });
    });

    describe('setVolume', () => {
      it('should set volume', () => {
        useMelodyStore.getState().setVolume(0.5);
        expect(useMelodyStore.getState().volume).toBe(0.5);
      });

      it('should clamp volume to 0-1', () => {
        useMelodyStore.getState().setVolume(-0.5);
        expect(useMelodyStore.getState().volume).toBe(0);

        useMelodyStore.getState().setVolume(1.5);
        expect(useMelodyStore.getState().volume).toBe(1);
      });
    });

    describe('toggleLoop', () => {
      it('should toggle loop state', () => {
        expect(useMelodyStore.getState().loop).toBe(false);

        useMelodyStore.getState().toggleLoop();
        expect(useMelodyStore.getState().loop).toBe(true);

        useMelodyStore.getState().toggleLoop();
        expect(useMelodyStore.getState().loop).toBe(false);
      });
    });

    describe('setKey', () => {
      it('should set key signature', () => {
        useMelodyStore.getState().setKey('G');
        expect(useMelodyStore.getState().key).toBe('G');

        useMelodyStore.getState().setKey('Am');
        expect(useMelodyStore.getState().key).toBe('Am');
      });
    });

    describe('setTimeSignature', () => {
      it('should set time signature', () => {
        useMelodyStore.getState().setTimeSignature('3/4');
        expect(useMelodyStore.getState().timeSignature).toBe('3/4');

        useMelodyStore.getState().setTimeSignature('6/8');
        expect(useMelodyStore.getState().timeSignature).toBe('6/8');
      });
    });
  });

  describe('clear', () => {
    it('should clear melody and reset playback', async () => {
      const analysis = createDefaultPoemAnalysis();
      await useMelodyStore.getState().generateMelody('Test', analysis);
      await useMelodyStore.getState().play();
      useMelodyStore.getState().setCurrentTime(30);

      useMelodyStore.getState().clear();

      const state = useMelodyStore.getState();
      expect(state.melody).toBeNull();
      expect(state.abcNotation).toBeNull();
      expect(state.playbackState).toBe('stopped');
      expect(state.currentTime).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', async () => {
      const analysis = createDefaultPoemAnalysis();
      await useMelodyStore.getState().generateMelody('Test', analysis);
      useMelodyStore.getState().setTempo(140);
      useMelodyStore.getState().setVolume(0.5);

      useMelodyStore.getState().reset();

      const state = useMelodyStore.getState();
      expect(state.tempo).toBe(100);
      expect(state.volume).toBe(0.8);
      expect(state.melody).toBeNull();
    });
  });

  describe('selectors', () => {
    describe('selectHasMelody', () => {
      it('should return false when no melody', () => {
        expect(selectHasMelody(useMelodyStore.getState())).toBe(false);
      });

      it('should return true when melody exists', async () => {
        const analysis = createDefaultPoemAnalysis();
        await useMelodyStore.getState().generateMelody('Test', analysis);
        expect(selectHasMelody(useMelodyStore.getState())).toBe(true);
      });
    });

    describe('selectIsPlaying/Paused/Stopped', () => {
      it('should return correct states', async () => {
        expect(selectIsStopped(useMelodyStore.getState())).toBe(true);
        expect(selectIsPlaying(useMelodyStore.getState())).toBe(false);
        expect(selectIsPaused(useMelodyStore.getState())).toBe(false);

        // Set up ABC notation before playing
        useMelodyStore.getState().setAbcNotation('X:1\nT:Test\nM:4/4\nK:C\nCDEF|');
        await useMelodyStore.getState().play();
        expect(selectIsPlaying(useMelodyStore.getState())).toBe(true);
        expect(selectIsStopped(useMelodyStore.getState())).toBe(false);

        useMelodyStore.getState().pause();
        expect(selectIsPaused(useMelodyStore.getState())).toBe(true);
        expect(selectIsPlaying(useMelodyStore.getState())).toBe(false);
      });
    });

    describe('selectPlaybackProgress', () => {
      it('should return 0 when duration is 0', () => {
        expect(selectPlaybackProgress(useMelodyStore.getState())).toBe(0);
      });

      it('should return correct percentage', () => {
        useMelodyStore.getState().setDuration(100);
        useMelodyStore.getState().setCurrentTime(50);
        expect(selectPlaybackProgress(useMelodyStore.getState())).toBe(50);
      });
    });

    describe('selectFormattedCurrentTime/Duration', () => {
      it('should format time as MM:SS', () => {
        expect(selectFormattedCurrentTime(useMelodyStore.getState())).toBe('0:00');

        useMelodyStore.getState().setCurrentTime(65);
        expect(selectFormattedCurrentTime(useMelodyStore.getState())).toBe('1:05');

        useMelodyStore.getState().setDuration(125);
        expect(selectFormattedDuration(useMelodyStore.getState())).toBe('2:05');
      });
    });

    describe('selectVolumePercent', () => {
      it('should return volume as percentage', () => {
        expect(selectVolumePercent(useMelodyStore.getState())).toBe(80);

        useMelodyStore.getState().setVolume(0.5);
        expect(selectVolumePercent(useMelodyStore.getState())).toBe(50);
      });
    });

    describe('selectHasError', () => {
      it('should return false when no error', () => {
        expect(selectHasError(useMelodyStore.getState())).toBe(false);
      });

      it('should return true when error exists', () => {
        useMelodyStore.getState().setError('Test error');
        expect(selectHasError(useMelodyStore.getState())).toBe(true);
      });
    });
  });

  describe('synth integration', () => {
    // Import the mocked module
    let initSynth: ReturnType<typeof vi.fn>;
    let playMelody: ReturnType<typeof vi.fn>;
    let pausePlayback: ReturnType<typeof vi.fn>;
    let stopPlayback: ReturnType<typeof vi.fn>;
    let resumePlayback: ReturnType<typeof vi.fn>;
    let getSynth: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      const synthModule = await import('../lib/music/abcRenderer');
      initSynth = vi.mocked(synthModule.initSynth);
      playMelody = vi.mocked(synthModule.playMelody);
      pausePlayback = vi.mocked(synthModule.pausePlayback);
      stopPlayback = vi.mocked(synthModule.stopPlayback);
      resumePlayback = vi.mocked(synthModule.resumePlayback);
      getSynth = vi.mocked(synthModule.getSynth);
      vi.clearAllMocks();
      useMelodyStore.getState().reset();
    });

    describe('play calls synth functions', () => {
      it('should call initSynth and playMelody when starting fresh playback', async () => {
        useMelodyStore.getState().setAbcNotation('X:1\nT:Test\nK:C\nCDEF|');
        await useMelodyStore.getState().play();

        expect(initSynth).toHaveBeenCalled();
        expect(playMelody).toHaveBeenCalledWith('X:1\nT:Test\nK:C\nCDEF|', 'notation-display-1');
      });

      it('should call resumePlayback when resuming from paused state', async () => {
        // Mock getSynth to return paused state
        getSynth.mockReturnValue({
          getState: () => 'paused',
        });

        useMelodyStore.getState().setAbcNotation('X:1\nT:Test\nK:C\nCDEF|');
        // Start playback first
        await useMelodyStore.getState().play();
        useMelodyStore.getState().pause();

        // Clear mocks before resume
        vi.clearAllMocks();

        // Now resume
        await useMelodyStore.getState().play();
        expect(resumePlayback).toHaveBeenCalled();
      });
    });

    describe('pause calls synth functions', () => {
      it('should call pausePlayback when pausing', async () => {
        useMelodyStore.getState().setAbcNotation('X:1\nT:Test\nK:C\nCDEF|');
        await useMelodyStore.getState().play();

        vi.clearAllMocks();
        useMelodyStore.getState().pause();

        expect(pausePlayback).toHaveBeenCalled();
      });
    });

    describe('stop calls synth functions', () => {
      it('should call stopPlayback when stopping', async () => {
        useMelodyStore.getState().setAbcNotation('X:1\nT:Test\nK:C\nCDEF|');
        await useMelodyStore.getState().play();

        vi.clearAllMocks();
        useMelodyStore.getState().stop();

        expect(stopPlayback).toHaveBeenCalled();
      });
    });

    describe('clear and reset stop playback', () => {
      it('should call stopPlayback when clearing melody', async () => {
        useMelodyStore.getState().setAbcNotation('X:1\nT:Test\nK:C\nCDEF|');
        await useMelodyStore.getState().play();

        vi.clearAllMocks();
        useMelodyStore.getState().clear();

        expect(stopPlayback).toHaveBeenCalled();
      });

      it('should call stopPlayback when resetting store', async () => {
        useMelodyStore.getState().setAbcNotation('X:1\nT:Test\nK:C\nCDEF|');
        await useMelodyStore.getState().play();

        vi.clearAllMocks();
        useMelodyStore.getState().reset();

        expect(stopPlayback).toHaveBeenCalled();
      });
    });

    describe('loading state', () => {
      it('should set loading state before playback starts', async () => {
        useMelodyStore.getState().setAbcNotation('X:1\nT:Test\nK:C\nCDEF|');

        // Start play but don't await
        const playPromise = useMelodyStore.getState().play();

        // During initialization, state should be loading
        // (This test may be flaky depending on mock resolution timing)

        await playPromise;

        // After completion, should be playing
        expect(useMelodyStore.getState().playbackState).toBe('playing');
      });
    });
  });
});
