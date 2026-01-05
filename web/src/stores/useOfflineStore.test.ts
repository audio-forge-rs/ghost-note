/**
 * Tests for useOfflineStore
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import {
  useOfflineStore,
  selectHasPendingOperations,
  selectPendingCount,
  selectFailedCount,
  selectIsSyncing,
  selectCanWorkOffline,
  selectQueueSize,
} from './useOfflineStore';

describe('useOfflineStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useOfflineStore.getState().reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts with correct defaults', () => {
      const state = useOfflineStore.getState();

      expect(state.isOnline).toBe(true); // navigator.onLine default
      expect(state.isOfflineReady).toBe(false);
      expect(state.syncQueue).toEqual([]);
      expect(state.lastSyncAttempt).toBe(null);
      expect(state.isSyncing).toBe(false);
      expect(state.syncError).toBe(null);
    });
  });

  describe('setOnline', () => {
    it('sets online status to true', () => {
      useOfflineStore.getState().setOnline(true);

      expect(useOfflineStore.getState().isOnline).toBe(true);
    });

    it('sets online status to false', () => {
      useOfflineStore.getState().setOnline(false);

      expect(useOfflineStore.getState().isOnline).toBe(false);
    });
  });

  describe('setOfflineReady', () => {
    it('sets offline ready status', () => {
      useOfflineStore.getState().setOfflineReady(true);

      expect(useOfflineStore.getState().isOfflineReady).toBe(true);
    });

    it('clears offline ready status', () => {
      useOfflineStore.getState().setOfflineReady(true);
      useOfflineStore.getState().setOfflineReady(false);

      expect(useOfflineStore.getState().isOfflineReady).toBe(false);
    });
  });

  describe('queueOperation', () => {
    it('adds operation to queue', () => {
      // Go offline to prevent auto-processing
      useOfflineStore.getState().setOnline(false);
      const id = useOfflineStore.getState().queueOperation('poem_save', { text: 'test' });

      expect(id).toBeTruthy();
      expect(useOfflineStore.getState().syncQueue).toHaveLength(1);
      expect(useOfflineStore.getState().syncQueue[0].type).toBe('poem_save');
      expect(useOfflineStore.getState().syncQueue[0].status).toBe('pending');
    });

    it('adds multiple operations to queue', () => {
      // Go offline to prevent auto-processing
      useOfflineStore.getState().setOnline(false);
      useOfflineStore.getState().queueOperation('poem_save', { text: 'test1' });
      useOfflineStore.getState().queueOperation('lyrics_update', { lyrics: 'test2' });

      expect(useOfflineStore.getState().syncQueue).toHaveLength(2);
    });

    it('returns unique IDs for operations', () => {
      // Go offline to prevent auto-processing
      useOfflineStore.getState().setOnline(false);
      const id1 = useOfflineStore.getState().queueOperation('poem_save', {});
      const id2 = useOfflineStore.getState().queueOperation('lyrics_update', {});

      expect(id1).not.toBe(id2);
    });

    it('stores payload correctly', () => {
      // Go offline to prevent auto-processing
      useOfflineStore.getState().setOnline(false);
      const payload = { text: 'my poem', author: 'test' };
      useOfflineStore.getState().queueOperation('poem_save', payload);

      expect(useOfflineStore.getState().syncQueue[0].payload).toEqual(payload);
    });

    it('sets initial operation properties', () => {
      // Go offline to prevent auto-processing
      useOfflineStore.getState().setOnline(false);
      useOfflineStore.getState().queueOperation('poem_save', {});
      const operation = useOfflineStore.getState().syncQueue[0];

      expect(operation.status).toBe('pending');
      expect(operation.queuedAt).toBeGreaterThan(0);
      expect(operation.lastAttemptAt).toBe(null);
      expect(operation.retryCount).toBe(0);
      expect(operation.error).toBe(null);
    });
  });

  describe('removeOperation', () => {
    it('removes operation by ID', () => {
      useOfflineStore.getState().setOnline(false);
      const id = useOfflineStore.getState().queueOperation('poem_save', {});
      expect(useOfflineStore.getState().syncQueue).toHaveLength(1);

      useOfflineStore.getState().removeOperation(id);

      expect(useOfflineStore.getState().syncQueue).toHaveLength(0);
    });

    it('only removes matching operation', () => {
      useOfflineStore.getState().setOnline(false);
      const id1 = useOfflineStore.getState().queueOperation('poem_save', {});
      const id2 = useOfflineStore.getState().queueOperation('lyrics_update', {});

      useOfflineStore.getState().removeOperation(id1);

      expect(useOfflineStore.getState().syncQueue).toHaveLength(1);
      expect(useOfflineStore.getState().syncQueue[0].id).toBe(id2);
    });

    it('handles non-existent ID gracefully', () => {
      useOfflineStore.getState().setOnline(false);
      useOfflineStore.getState().queueOperation('poem_save', {});

      useOfflineStore.getState().removeOperation('non-existent-id');

      expect(useOfflineStore.getState().syncQueue).toHaveLength(1);
    });
  });

  describe('updateOperationStatus', () => {
    it('updates operation status to syncing', () => {
      useOfflineStore.getState().setOnline(false);
      const id = useOfflineStore.getState().queueOperation('poem_save', {});

      useOfflineStore.getState().updateOperationStatus(id, 'syncing');

      expect(useOfflineStore.getState().syncQueue[0].status).toBe('syncing');
    });

    it('updates operation status to completed', () => {
      useOfflineStore.getState().setOnline(false);
      const id = useOfflineStore.getState().queueOperation('poem_save', {});

      useOfflineStore.getState().updateOperationStatus(id, 'completed');

      expect(useOfflineStore.getState().syncQueue[0].status).toBe('completed');
    });

    it('updates operation status to failed with error', () => {
      useOfflineStore.getState().setOnline(false);
      const id = useOfflineStore.getState().queueOperation('poem_save', {});

      useOfflineStore.getState().updateOperationStatus(id, 'failed', 'Network error');

      const operation = useOfflineStore.getState().syncQueue[0];
      expect(operation.status).toBe('failed');
      expect(operation.error).toBe('Network error');
      expect(operation.retryCount).toBe(1);
    });

    it('increments retry count on failure', () => {
      useOfflineStore.getState().setOnline(false);
      const id = useOfflineStore.getState().queueOperation('poem_save', {});

      useOfflineStore.getState().updateOperationStatus(id, 'failed', 'Error 1');
      useOfflineStore.getState().updateOperationStatus(id, 'failed', 'Error 2');

      expect(useOfflineStore.getState().syncQueue[0].retryCount).toBe(2);
    });

    it('updates lastAttemptAt timestamp', () => {
      useOfflineStore.getState().setOnline(false);
      const id = useOfflineStore.getState().queueOperation('poem_save', {});
      const before = Date.now();

      useOfflineStore.getState().updateOperationStatus(id, 'syncing');

      const after = Date.now();
      const lastAttempt = useOfflineStore.getState().syncQueue[0].lastAttemptAt;
      expect(lastAttempt).toBeGreaterThanOrEqual(before);
      expect(lastAttempt).toBeLessThanOrEqual(after);
    });
  });

  describe('processQueue', () => {
    it('does not process when offline', async () => {
      useOfflineStore.getState().setOnline(false);
      useOfflineStore.getState().queueOperation('poem_save', {});

      await act(async () => {
        await useOfflineStore.getState().processQueue();
      });

      // Operation should still be pending
      expect(useOfflineStore.getState().syncQueue[0].status).toBe('pending');
    });

    it('does not process when already syncing', async () => {
      useOfflineStore.getState().setOnline(false);
      useOfflineStore.getState().queueOperation('poem_save', {});
      // Manually set syncing and online state
      useOfflineStore.setState({ isSyncing: true, isOnline: true });

      await act(async () => {
        await useOfflineStore.getState().processQueue();
      });

      // Operation should still be pending (not processed because already syncing)
      expect(useOfflineStore.getState().syncQueue[0].status).toBe('pending');
    });

    it('does not process empty queue', async () => {
      useOfflineStore.getState().setOnline(true);

      await act(async () => {
        await useOfflineStore.getState().processQueue();
      });

      expect(useOfflineStore.getState().lastSyncAttempt).toBe(null);
    });
  });

  describe('clearCompleted', () => {
    it('removes completed operations', () => {
      useOfflineStore.getState().setOnline(false);
      const id = useOfflineStore.getState().queueOperation('poem_save', {});
      // Manually mark as completed
      useOfflineStore.getState().updateOperationStatus(id, 'completed');

      expect(useOfflineStore.getState().syncQueue.some((op) => op.id === id)).toBe(true);

      useOfflineStore.getState().clearCompleted();

      expect(useOfflineStore.getState().syncQueue).toHaveLength(0);
    });

    it('keeps pending operations', () => {
      useOfflineStore.getState().setOnline(false);
      useOfflineStore.getState().queueOperation('poem_save', {});

      useOfflineStore.getState().clearCompleted();

      expect(useOfflineStore.getState().syncQueue).toHaveLength(1);
    });

    it('keeps failed operations', () => {
      useOfflineStore.getState().setOnline(false);
      const id = useOfflineStore.getState().queueOperation('poem_save', {});
      useOfflineStore.getState().updateOperationStatus(id, 'failed', 'Error');

      useOfflineStore.getState().clearCompleted();

      expect(useOfflineStore.getState().syncQueue).toHaveLength(1);
    });
  });

  describe('clearFailed', () => {
    it('removes failed operations', () => {
      useOfflineStore.getState().setOnline(false);
      const id = useOfflineStore.getState().queueOperation('poem_save', {});
      useOfflineStore.getState().updateOperationStatus(id, 'failed', 'Error');

      useOfflineStore.getState().clearFailed();

      expect(useOfflineStore.getState().syncQueue).toHaveLength(0);
    });

    it('keeps pending operations', () => {
      useOfflineStore.getState().setOnline(false);
      useOfflineStore.getState().queueOperation('poem_save', {});

      useOfflineStore.getState().clearFailed();

      expect(useOfflineStore.getState().syncQueue).toHaveLength(1);
    });
  });

  describe('retryOperation', () => {
    it('resets failed operation to pending', () => {
      useOfflineStore.getState().setOnline(false);
      const id = useOfflineStore.getState().queueOperation('poem_save', {});
      useOfflineStore.getState().updateOperationStatus(id, 'failed', 'Error');

      useOfflineStore.getState().retryOperation(id);

      expect(useOfflineStore.getState().syncQueue[0].status).toBe('pending');
      expect(useOfflineStore.getState().syncQueue[0].error).toBe(null);
    });
  });

  describe('setSyncError', () => {
    it('sets sync error', () => {
      useOfflineStore.getState().setSyncError('Sync failed');

      expect(useOfflineStore.getState().syncError).toBe('Sync failed');
    });

    it('clears sync error', () => {
      useOfflineStore.getState().setSyncError('Sync failed');
      useOfflineStore.getState().setSyncError(null);

      expect(useOfflineStore.getState().syncError).toBe(null);
    });
  });

  describe('reset', () => {
    it('resets to initial state', () => {
      // Modify state
      useOfflineStore.getState().setOnline(false);
      useOfflineStore.getState().setOfflineReady(true);
      useOfflineStore.getState().queueOperation('poem_save', {});
      useOfflineStore.getState().setSyncError('Error');

      // Reset
      useOfflineStore.getState().reset();

      const state = useOfflineStore.getState();
      expect(state.isOfflineReady).toBe(false);
      expect(state.syncQueue).toEqual([]);
      expect(state.lastSyncAttempt).toBe(null);
      expect(state.isSyncing).toBe(false);
      expect(state.syncError).toBe(null);
    });
  });

  describe('selectors', () => {
    describe('selectHasPendingOperations', () => {
      it('returns false when no operations', () => {
        expect(selectHasPendingOperations(useOfflineStore.getState())).toBe(false);
      });

      it('returns true when pending operations exist', () => {
        useOfflineStore.getState().setOnline(false);
        useOfflineStore.getState().queueOperation('poem_save', {});

        expect(selectHasPendingOperations(useOfflineStore.getState())).toBe(true);
      });

      it('returns false when all operations are completed', () => {
        useOfflineStore.getState().setOnline(false);
        const id = useOfflineStore.getState().queueOperation('poem_save', {});
        // Manually mark as completed
        useOfflineStore.getState().updateOperationStatus(id, 'completed');

        expect(selectHasPendingOperations(useOfflineStore.getState())).toBe(false);
      });
    });

    describe('selectPendingCount', () => {
      it('returns 0 when no operations', () => {
        expect(selectPendingCount(useOfflineStore.getState())).toBe(0);
      });

      it('returns count of pending operations', () => {
        useOfflineStore.getState().setOnline(false);
        useOfflineStore.getState().queueOperation('poem_save', {});
        useOfflineStore.getState().queueOperation('lyrics_update', {});

        expect(selectPendingCount(useOfflineStore.getState())).toBe(2);
      });
    });

    describe('selectFailedCount', () => {
      it('returns 0 when no failed operations', () => {
        expect(selectFailedCount(useOfflineStore.getState())).toBe(0);
      });

      it('returns count of failed operations', () => {
        useOfflineStore.getState().setOnline(false);
        const id1 = useOfflineStore.getState().queueOperation('poem_save', {});
        useOfflineStore.getState().queueOperation('lyrics_update', {});
        useOfflineStore.getState().updateOperationStatus(id1, 'failed', 'Error');

        expect(selectFailedCount(useOfflineStore.getState())).toBe(1);
      });
    });

    describe('selectIsSyncing', () => {
      it('returns false when not syncing', () => {
        expect(selectIsSyncing(useOfflineStore.getState())).toBe(false);
      });
    });

    describe('selectCanWorkOffline', () => {
      it('returns false when not offline ready', () => {
        expect(selectCanWorkOffline(useOfflineStore.getState())).toBe(false);
      });

      it('returns true when offline ready', () => {
        useOfflineStore.getState().setOfflineReady(true);

        expect(selectCanWorkOffline(useOfflineStore.getState())).toBe(true);
      });
    });

    describe('selectQueueSize', () => {
      it('returns 0 when queue is empty', () => {
        expect(selectQueueSize(useOfflineStore.getState())).toBe(0);
      });

      it('returns total queue size', () => {
        useOfflineStore.getState().setOnline(false);
        const id1 = useOfflineStore.getState().queueOperation('poem_save', {});
        useOfflineStore.getState().queueOperation('lyrics_update', {});
        useOfflineStore.getState().updateOperationStatus(id1, 'failed', 'Error');

        expect(selectQueueSize(useOfflineStore.getState())).toBe(2);
      });
    });
  });
});
