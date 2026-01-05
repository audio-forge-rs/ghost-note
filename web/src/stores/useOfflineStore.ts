/**
 * Ghost Note - Offline Store
 *
 * Manages offline state, sync queue, and pending operations
 * for when the app is used without network connectivity.
 *
 * @module stores/useOfflineStore
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[OfflineStore] ${message}`, ...args);
  }
};

// =============================================================================
// Types
// =============================================================================

/**
 * Types of operations that can be queued for sync
 */
export type SyncOperationType =
  | 'poem_save'
  | 'lyrics_update'
  | 'recording_upload'
  | 'project_export'
  | 'settings_update';

/**
 * Status of a sync operation
 */
export type SyncOperationStatus = 'pending' | 'syncing' | 'completed' | 'failed';

/**
 * A queued sync operation
 */
export interface SyncOperation {
  /** Unique identifier */
  id: string;
  /** Type of operation */
  type: SyncOperationType;
  /** Status of the operation */
  status: SyncOperationStatus;
  /** When the operation was queued */
  queuedAt: number;
  /** When the operation was last attempted */
  lastAttemptAt: number | null;
  /** Number of retry attempts */
  retryCount: number;
  /** Error message if failed */
  error: string | null;
  /** Operation payload (serializable data) */
  payload: Record<string, unknown>;
}

/**
 * Offline state
 */
export interface OfflineState {
  /** Whether the device is currently online */
  isOnline: boolean;
  /** Whether the service worker is active and app is ready for offline */
  isOfflineReady: boolean;
  /** Queued operations waiting to sync */
  syncQueue: SyncOperation[];
  /** When sync was last attempted */
  lastSyncAttempt: number | null;
  /** Whether sync is currently in progress */
  isSyncing: boolean;
  /** Error from last sync attempt */
  syncError: string | null;
}

/**
 * Offline actions
 */
export interface OfflineActions {
  /** Update online status */
  setOnline: (isOnline: boolean) => void;
  /** Set offline ready status */
  setOfflineReady: (isReady: boolean) => void;
  /** Add operation to sync queue */
  queueOperation: (type: SyncOperationType, payload: Record<string, unknown>) => string;
  /** Remove operation from queue */
  removeOperation: (id: string) => void;
  /** Update operation status */
  updateOperationStatus: (id: string, status: SyncOperationStatus, error?: string) => void;
  /** Process sync queue (called when back online) */
  processQueue: () => Promise<void>;
  /** Clear completed operations from queue */
  clearCompleted: () => void;
  /** Clear all failed operations */
  clearFailed: () => void;
  /** Retry a failed operation */
  retryOperation: (id: string) => void;
  /** Set sync error */
  setSyncError: (error: string | null) => void;
  /** Reset to initial state */
  reset: () => void;
}

export type OfflineStore = OfflineState & OfflineActions;

// =============================================================================
// Constants
// =============================================================================

const MAX_RETRY_COUNT = 3;
const QUEUE_STORAGE_KEY = 'ghost-note-offline-queue';

// =============================================================================
// Initial State
// =============================================================================

const initialState: OfflineState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isOfflineReady: false,
  syncQueue: [],
  lastSyncAttempt: null,
  isSyncing: false,
  syncError: null,
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate a unique ID for operations
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Process a single sync operation
 * In a real app, this would make API calls
 * For Ghost Note (mostly local), this handles localStorage persistence
 */
async function processSyncOperation(operation: SyncOperation): Promise<void> {
  log('Processing operation:', operation.type, operation.id);

  // Simulate async operation for any future network sync
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Since Ghost Note is primarily local-first, most operations
  // just need to ensure localStorage is persisted, which Zustand
  // persist middleware handles automatically.
  //
  // This sync queue is here for:
  // 1. Future cloud sync features
  // 2. Operations that need to be retried
  // 3. Ensuring data integrity when coming back online

  switch (operation.type) {
    case 'poem_save':
    case 'lyrics_update':
    case 'settings_update':
      // These are already persisted via Zustand persist middleware
      log('Operation auto-persisted via Zustand:', operation.type);
      break;

    case 'recording_upload':
      // Recordings are stored in IndexedDB/localStorage
      // Future: Could upload to cloud storage
      log('Recording queued for future cloud sync:', operation.id);
      break;

    case 'project_export':
      // Project exports are typically downloaded immediately
      log('Project export completed:', operation.id);
      break;

    default:
      log('Unknown operation type:', operation.type);
  }
}

// =============================================================================
// Store Implementation
// =============================================================================

export const useOfflineStore = create<OfflineStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        ...initialState,

        // Actions
        setOnline: (isOnline: boolean) => {
          log('Setting online status:', isOnline);
          set({ isOnline }, false, 'setOnline');

          // Auto-process queue when coming back online
          if (isOnline && get().syncQueue.some((op) => op.status === 'pending')) {
            log('Back online, processing sync queue');
            get().processQueue();
          }
        },

        setOfflineReady: (isReady: boolean) => {
          log('Setting offline ready:', isReady);
          set({ isOfflineReady: isReady }, false, 'setOfflineReady');
        },

        queueOperation: (type: SyncOperationType, payload: Record<string, unknown>) => {
          const id = generateId();
          const operation: SyncOperation = {
            id,
            type,
            status: 'pending',
            queuedAt: Date.now(),
            lastAttemptAt: null,
            retryCount: 0,
            error: null,
            payload,
          };

          log('Queueing operation:', type, id);

          set(
            (state) => ({
              syncQueue: [...state.syncQueue, operation],
            }),
            false,
            'queueOperation'
          );

          // If online, process immediately
          if (get().isOnline) {
            get().processQueue();
          }

          return id;
        },

        removeOperation: (id: string) => {
          log('Removing operation:', id);
          set(
            (state) => ({
              syncQueue: state.syncQueue.filter((op) => op.id !== id),
            }),
            false,
            'removeOperation'
          );
        },

        updateOperationStatus: (id: string, status: SyncOperationStatus, error?: string) => {
          log('Updating operation status:', id, status, error);
          set(
            (state) => ({
              syncQueue: state.syncQueue.map((op) =>
                op.id === id
                  ? {
                      ...op,
                      status,
                      error: error ?? null,
                      lastAttemptAt: Date.now(),
                      retryCount: status === 'failed' ? op.retryCount + 1 : op.retryCount,
                    }
                  : op
              ),
            }),
            false,
            'updateOperationStatus'
          );
        },

        processQueue: async () => {
          const state = get();

          if (state.isSyncing) {
            log('Sync already in progress, skipping');
            return;
          }

          if (!state.isOnline) {
            log('Offline, cannot process queue');
            return;
          }

          const pendingOps = state.syncQueue.filter(
            (op) => op.status === 'pending' || (op.status === 'failed' && op.retryCount < MAX_RETRY_COUNT)
          );

          if (pendingOps.length === 0) {
            log('No pending operations to process');
            return;
          }

          log('Processing sync queue:', pendingOps.length, 'operations');

          set({ isSyncing: true, lastSyncAttempt: Date.now() }, false, 'startSync');

          for (const operation of pendingOps) {
            try {
              get().updateOperationStatus(operation.id, 'syncing');
              await processSyncOperation(operation);
              get().updateOperationStatus(operation.id, 'completed');
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Unknown error';
              log('Operation failed:', operation.id, message);
              get().updateOperationStatus(operation.id, 'failed', message);
            }
          }

          set({ isSyncing: false, syncError: null }, false, 'endSync');

          // Clean up completed operations after a delay
          setTimeout(() => {
            get().clearCompleted();
          }, 5000);
        },

        clearCompleted: () => {
          log('Clearing completed operations');
          set(
            (state) => ({
              syncQueue: state.syncQueue.filter((op) => op.status !== 'completed'),
            }),
            false,
            'clearCompleted'
          );
        },

        clearFailed: () => {
          log('Clearing failed operations');
          set(
            (state) => ({
              syncQueue: state.syncQueue.filter((op) => op.status !== 'failed'),
            }),
            false,
            'clearFailed'
          );
        },

        retryOperation: (id: string) => {
          log('Retrying operation:', id);
          set(
            (state) => ({
              syncQueue: state.syncQueue.map((op) =>
                op.id === id ? { ...op, status: 'pending' as const, error: null } : op
              ),
            }),
            false,
            'retryOperation'
          );

          // Process queue if online
          if (get().isOnline) {
            get().processQueue();
          }
        },

        setSyncError: (error: string | null) => {
          log('Setting sync error:', error);
          set({ syncError: error }, false, 'setSyncError');
        },

        reset: () => {
          log('Resetting store');
          set(initialState, false, 'reset');
        },
      }),
      {
        name: QUEUE_STORAGE_KEY,
        partialize: (state) => ({
          syncQueue: state.syncQueue,
          isOfflineReady: state.isOfflineReady,
        }),
      }
    ),
    { name: 'OfflineStore' }
  )
);

// =============================================================================
// Selectors
// =============================================================================

/**
 * Check if there are pending operations
 */
export const selectHasPendingOperations = (state: OfflineStore): boolean => {
  return state.syncQueue.some((op) => op.status === 'pending');
};

/**
 * Get count of pending operations
 */
export const selectPendingCount = (state: OfflineStore): number => {
  return state.syncQueue.filter((op) => op.status === 'pending').length;
};

/**
 * Get count of failed operations
 */
export const selectFailedCount = (state: OfflineStore): number => {
  return state.syncQueue.filter((op) => op.status === 'failed').length;
};

/**
 * Check if sync is in progress
 */
export const selectIsSyncing = (state: OfflineStore): boolean => {
  return state.isSyncing;
};

/**
 * Check if app can work offline
 */
export const selectCanWorkOffline = (state: OfflineStore): boolean => {
  return state.isOfflineReady;
};

/**
 * Get operations by status
 */
export const selectOperationsByStatus =
  (status: SyncOperationStatus) =>
  (state: OfflineStore): SyncOperation[] => {
    return state.syncQueue.filter((op) => op.status === status);
  };

/**
 * Get total queue size
 */
export const selectQueueSize = (state: OfflineStore): number => {
  return state.syncQueue.length;
};
