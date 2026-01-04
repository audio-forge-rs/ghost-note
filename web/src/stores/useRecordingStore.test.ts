/**
 * Tests for useRecordingStore
 *
 * @module stores/useRecordingStore.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRecordingStore, selectIsRecording, selectIsPaused, selectIsIdle, selectSelectedTake, selectTakeCount, selectHasTakes, selectFormattedDuration, selectInputLevelPercent, selectTakesSortedByDate, selectHasError, selectTotalRecordedTime } from './useRecordingStore';
import type { RecordingTake } from './types';

// Mock navigator.mediaDevices
const mockMediaDevices = {
  getUserMedia: vi.fn(),
};

vi.stubGlobal('navigator', {
  mediaDevices: mockMediaDevices,
});

describe('useRecordingStore', () => {
  beforeEach(() => {
    useRecordingStore.getState().reset();
    vi.clearAllMocks();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('ghost-note-recording-store');
    }
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useRecordingStore.getState();
      expect(state.recordingState).toBe('idle');
      expect(state.takes).toEqual([]);
      expect(state.selectedTakeId).toBeNull();
      expect(state.recordingDuration).toBe(0);
      expect(state.hasPermission).toBe(false);
      expect(state.error).toBeNull();
      expect(state.inputLevel).toBe(0);
    });
  });

  describe('requestPermission', () => {
    it('should grant permission when getUserMedia succeeds', async () => {
      const mockStream = {
        getTracks: () => [{ stop: vi.fn() }],
      };
      mockMediaDevices.getUserMedia.mockResolvedValueOnce(mockStream);

      const result = await useRecordingStore.getState().requestPermission();

      expect(result).toBe(true);
      expect(useRecordingStore.getState().hasPermission).toBe(true);
      expect(useRecordingStore.getState().error).toBeNull();
    });

    it('should deny permission when getUserMedia fails', async () => {
      mockMediaDevices.getUserMedia.mockRejectedValueOnce(new Error('Permission denied'));

      const result = await useRecordingStore.getState().requestPermission();

      expect(result).toBe(false);
      expect(useRecordingStore.getState().hasPermission).toBe(false);
      expect(useRecordingStore.getState().error).toBe('Permission denied');
    });
  });

  describe('recording controls', () => {
    describe('startRecording', () => {
      it('should request permission if not granted', async () => {
        const mockStream = {
          getTracks: () => [{ stop: vi.fn() }],
        };
        mockMediaDevices.getUserMedia.mockResolvedValueOnce(mockStream);

        await useRecordingStore.getState().startRecording();

        expect(mockMediaDevices.getUserMedia).toHaveBeenCalled();
      });

      it('should transition to recording state', async () => {
        // Grant permission first
        const mockStream = {
          getTracks: () => [{ stop: vi.fn() }],
        };
        mockMediaDevices.getUserMedia.mockResolvedValueOnce(mockStream);
        await useRecordingStore.getState().requestPermission();

        await useRecordingStore.getState().startRecording();

        expect(useRecordingStore.getState().recordingState).toBe('recording');
      });
    });

    describe('stopRecording', () => {
      it('should transition to stopped state', async () => {
        const mockStream = {
          getTracks: () => [{ stop: vi.fn() }],
        };
        mockMediaDevices.getUserMedia.mockResolvedValueOnce(mockStream);
        await useRecordingStore.getState().requestPermission();
        await useRecordingStore.getState().startRecording();

        useRecordingStore.getState().stopRecording();

        expect(useRecordingStore.getState().recordingState).toBe('stopped');
      });

      it('should not stop if not recording', () => {
        useRecordingStore.getState().stopRecording();
        expect(useRecordingStore.getState().recordingState).toBe('idle');
      });
    });

    describe('pauseRecording', () => {
      it('should pause recording', async () => {
        const mockStream = {
          getTracks: () => [{ stop: vi.fn() }],
        };
        mockMediaDevices.getUserMedia.mockResolvedValueOnce(mockStream);
        await useRecordingStore.getState().requestPermission();
        await useRecordingStore.getState().startRecording();

        useRecordingStore.getState().pauseRecording();

        expect(useRecordingStore.getState().recordingState).toBe('paused');
      });

      it('should not pause if not recording', () => {
        useRecordingStore.getState().pauseRecording();
        expect(useRecordingStore.getState().recordingState).toBe('idle');
      });
    });

    describe('resumeRecording', () => {
      it('should resume from paused state', async () => {
        const mockStream = {
          getTracks: () => [{ stop: vi.fn() }],
        };
        mockMediaDevices.getUserMedia.mockResolvedValueOnce(mockStream);
        await useRecordingStore.getState().requestPermission();
        await useRecordingStore.getState().startRecording();
        useRecordingStore.getState().pauseRecording();

        useRecordingStore.getState().resumeRecording();

        expect(useRecordingStore.getState().recordingState).toBe('recording');
      });

      it('should not resume if not paused', () => {
        useRecordingStore.getState().resumeRecording();
        expect(useRecordingStore.getState().recordingState).toBe('idle');
      });
    });
  });

  describe('take management', () => {
    const createTake = (overrides?: Partial<RecordingTake>): RecordingTake => ({
      id: `take_${Date.now()}`,
      blobUrl: 'blob:test',
      duration: 30,
      timestamp: Date.now(),
      ...overrides,
    });

    describe('addTake', () => {
      it('should add a take and select it', () => {
        const take = createTake({ id: 'take-1' });
        useRecordingStore.getState().addTake(take);

        const state = useRecordingStore.getState();
        expect(state.takes).toHaveLength(1);
        expect(state.takes[0]).toBe(take);
        expect(state.selectedTakeId).toBe('take-1');
        expect(state.recordingState).toBe('idle');
      });
    });

    describe('deleteTake', () => {
      it('should delete a take', () => {
        const take1 = createTake({ id: 'take-1' });
        const take2 = createTake({ id: 'take-2' });
        useRecordingStore.getState().addTake(take1);
        useRecordingStore.getState().addTake(take2);

        useRecordingStore.getState().deleteTake('take-1');

        const state = useRecordingStore.getState();
        expect(state.takes).toHaveLength(1);
        expect(state.takes[0].id).toBe('take-2');
      });

      it('should select another take when deleting selected', () => {
        const take1 = createTake({ id: 'take-1' });
        const take2 = createTake({ id: 'take-2' });
        useRecordingStore.getState().addTake(take1);
        useRecordingStore.getState().addTake(take2);

        useRecordingStore.getState().deleteTake('take-2');

        expect(useRecordingStore.getState().selectedTakeId).toBe('take-1');
      });

      it('should set selectedTakeId to null when deleting last take', () => {
        const take = createTake({ id: 'take-1' });
        useRecordingStore.getState().addTake(take);

        useRecordingStore.getState().deleteTake('take-1');

        expect(useRecordingStore.getState().selectedTakeId).toBeNull();
      });
    });

    describe('selectTake', () => {
      it('should select a take', () => {
        const take1 = createTake({ id: 'take-1' });
        const take2 = createTake({ id: 'take-2' });
        useRecordingStore.getState().addTake(take1);
        useRecordingStore.getState().addTake(take2);

        useRecordingStore.getState().selectTake('take-1');

        expect(useRecordingStore.getState().selectedTakeId).toBe('take-1');
      });

      it('should allow deselecting', () => {
        const take = createTake({ id: 'take-1' });
        useRecordingStore.getState().addTake(take);

        useRecordingStore.getState().selectTake(null);

        expect(useRecordingStore.getState().selectedTakeId).toBeNull();
      });
    });

    describe('renameTake', () => {
      it('should rename a take', () => {
        const take = createTake({ id: 'take-1', name: 'Original' });
        useRecordingStore.getState().addTake(take);

        useRecordingStore.getState().renameTake('take-1', 'New Name');

        expect(useRecordingStore.getState().takes[0].name).toBe('New Name');
      });
    });

    describe('clearTakes', () => {
      it('should clear all takes', () => {
        useRecordingStore.getState().addTake(createTake({ id: 'take-1' }));
        useRecordingStore.getState().addTake(createTake({ id: 'take-2' }));

        useRecordingStore.getState().clearTakes();

        const state = useRecordingStore.getState();
        expect(state.takes).toEqual([]);
        expect(state.selectedTakeId).toBeNull();
      });
    });
  });

  describe('other actions', () => {
    describe('setRecordingDuration', () => {
      it('should set recording duration', () => {
        useRecordingStore.getState().setRecordingDuration(45);
        expect(useRecordingStore.getState().recordingDuration).toBe(45);
      });
    });

    describe('setInputLevel', () => {
      it('should set input level', () => {
        useRecordingStore.getState().setInputLevel(0.75);
        expect(useRecordingStore.getState().inputLevel).toBe(0.75);
      });

      it('should clamp input level to 0-1', () => {
        useRecordingStore.getState().setInputLevel(-0.5);
        expect(useRecordingStore.getState().inputLevel).toBe(0);

        useRecordingStore.getState().setInputLevel(1.5);
        expect(useRecordingStore.getState().inputLevel).toBe(1);
      });
    });

    describe('setError', () => {
      it('should set and clear error', () => {
        useRecordingStore.getState().setError('Test error');
        expect(useRecordingStore.getState().error).toBe('Test error');

        useRecordingStore.getState().setError(null);
        expect(useRecordingStore.getState().error).toBeNull();
      });
    });
  });

  describe('selectors', () => {
    describe('selectIsRecording/IsPaused/IsIdle', () => {
      it('should return correct states', async () => {
        expect(selectIsIdle(useRecordingStore.getState())).toBe(true);
        expect(selectIsRecording(useRecordingStore.getState())).toBe(false);

        const mockStream = {
          getTracks: () => [{ stop: vi.fn() }],
        };
        mockMediaDevices.getUserMedia.mockResolvedValueOnce(mockStream);
        await useRecordingStore.getState().requestPermission();
        await useRecordingStore.getState().startRecording();

        expect(selectIsRecording(useRecordingStore.getState())).toBe(true);
        expect(selectIsIdle(useRecordingStore.getState())).toBe(false);

        useRecordingStore.getState().pauseRecording();
        expect(selectIsPaused(useRecordingStore.getState())).toBe(true);
      });
    });

    describe('selectSelectedTake', () => {
      it('should return null when no take selected', () => {
        expect(selectSelectedTake(useRecordingStore.getState())).toBeNull();
      });

      it('should return selected take', () => {
        const take: RecordingTake = {
          id: 'take-1',
          blobUrl: 'blob:test',
          duration: 30,
          timestamp: Date.now(),
          name: 'Test Take',
        };
        useRecordingStore.getState().addTake(take);

        expect(selectSelectedTake(useRecordingStore.getState())).toEqual(take);
      });
    });

    describe('selectTakeCount/selectHasTakes', () => {
      it('should return correct counts', () => {
        expect(selectTakeCount(useRecordingStore.getState())).toBe(0);
        expect(selectHasTakes(useRecordingStore.getState())).toBe(false);

        useRecordingStore.getState().addTake({
          id: 'take-1',
          blobUrl: 'blob:test',
          duration: 30,
          timestamp: Date.now(),
        });

        expect(selectTakeCount(useRecordingStore.getState())).toBe(1);
        expect(selectHasTakes(useRecordingStore.getState())).toBe(true);
      });
    });

    describe('selectFormattedDuration', () => {
      it('should format duration as MM:SS', () => {
        expect(selectFormattedDuration(useRecordingStore.getState())).toBe('0:00');

        useRecordingStore.getState().setRecordingDuration(65);
        expect(selectFormattedDuration(useRecordingStore.getState())).toBe('1:05');
      });
    });

    describe('selectInputLevelPercent', () => {
      it('should return input level as percentage', () => {
        useRecordingStore.getState().setInputLevel(0.75);
        expect(selectInputLevelPercent(useRecordingStore.getState())).toBe(75);
      });
    });

    describe('selectTakesSortedByDate', () => {
      it('should return takes sorted by timestamp (newest first)', () => {
        const now = Date.now();
        useRecordingStore.getState().addTake({
          id: 'take-1',
          blobUrl: 'blob:1',
          duration: 30,
          timestamp: now - 2000,
        });
        useRecordingStore.getState().addTake({
          id: 'take-2',
          blobUrl: 'blob:2',
          duration: 30,
          timestamp: now,
        });
        useRecordingStore.getState().addTake({
          id: 'take-3',
          blobUrl: 'blob:3',
          duration: 30,
          timestamp: now - 1000,
        });

        const sorted = selectTakesSortedByDate(useRecordingStore.getState());
        expect(sorted[0].id).toBe('take-2');
        expect(sorted[1].id).toBe('take-3');
        expect(sorted[2].id).toBe('take-1');
      });
    });

    describe('selectTotalRecordedTime', () => {
      it('should return total duration of all takes', () => {
        useRecordingStore.getState().addTake({
          id: 'take-1',
          blobUrl: 'blob:1',
          duration: 30,
          timestamp: Date.now(),
        });
        useRecordingStore.getState().addTake({
          id: 'take-2',
          blobUrl: 'blob:2',
          duration: 45,
          timestamp: Date.now(),
        });

        expect(selectTotalRecordedTime(useRecordingStore.getState())).toBe(75);
      });
    });

    describe('selectHasError', () => {
      it('should return true when error exists', () => {
        useRecordingStore.getState().setError('Test error');
        expect(selectHasError(useRecordingStore.getState())).toBe(true);
      });
    });
  });
});
