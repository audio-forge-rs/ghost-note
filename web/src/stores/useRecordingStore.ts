/**
 * Ghost Note - Recording Store
 *
 * Manages recording state, takes, and audio permissions.
 *
 * @module stores/useRecordingStore
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { RecordingStore, RecordingStoreState, RecordingTake } from './types';

// =============================================================================
// Initial State
// =============================================================================

const initialState: RecordingStoreState = {
  recordingState: 'idle',
  takes: [],
  selectedTakeId: null,
  recordingDuration: 0,
  hasPermission: false,
  error: null,
  inputLevel: 0,
};


// =============================================================================
// Store Implementation
// =============================================================================

export const useRecordingStore = create<RecordingStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        ...initialState,

        // Actions
        requestPermission: async () => {
          console.log('[RecordingStore] Requesting microphone permission');

          try {
            // Check if mediaDevices is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
              throw new Error('Media devices not supported in this browser');
            }

            // Request permission
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Stop the stream immediately - we just needed to check permission
            stream.getTracks().forEach((track) => track.stop());

            console.log('[RecordingStore] Permission granted');
            set(
              {
                hasPermission: true,
                error: null,
              },
              false,
              'requestPermission/granted'
            );

            return true;
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Failed to get microphone permission';
            console.error('[RecordingStore] Permission denied:', errorMessage);
            set(
              {
                hasPermission: false,
                error: errorMessage,
              },
              false,
              'requestPermission/denied'
            );

            return false;
          }
        },

        startRecording: async (melodyVersionId?: string, lyricVersionId?: string) => {
          const state = get();

          if (!state.hasPermission) {
            console.log('[RecordingStore] No permission, requesting...');
            const granted = await get().requestPermission();
            if (!granted) {
              return;
            }
          }

          console.log(
            '[RecordingStore] Starting recording',
            melodyVersionId ? `with melody ${melodyVersionId}` : '',
            lyricVersionId ? `with lyrics ${lyricVersionId}` : ''
          );
          set(
            {
              recordingState: 'preparing',
              error: null,
              recordingDuration: 0,
            },
            false,
            'startRecording/preparing'
          );

          // In production, this would initialize MediaRecorder
          // For now, we just transition to recording state
          set(
            {
              recordingState: 'recording',
            },
            false,
            'startRecording/recording'
          );
        },

        stopRecording: () => {
          const state = get();
          if (state.recordingState !== 'recording' && state.recordingState !== 'paused') {
            console.warn('[RecordingStore] Cannot stop - not recording');
            return;
          }

          console.log('[RecordingStore] Stopping recording');
          set(
            {
              recordingState: 'stopped',
            },
            false,
            'stopRecording'
          );

          // In production, this would finalize the MediaRecorder
          // and create a new take from the recorded audio
        },

        pauseRecording: () => {
          const state = get();
          if (state.recordingState !== 'recording') {
            console.warn('[RecordingStore] Cannot pause - not recording');
            return;
          }

          console.log('[RecordingStore] Pausing recording');
          set(
            {
              recordingState: 'paused',
            },
            false,
            'pauseRecording'
          );
        },

        resumeRecording: () => {
          const state = get();
          if (state.recordingState !== 'paused') {
            console.warn('[RecordingStore] Cannot resume - not paused');
            return;
          }

          console.log('[RecordingStore] Resuming recording');
          set(
            {
              recordingState: 'recording',
            },
            false,
            'resumeRecording'
          );
        },

        addTake: (take: RecordingTake) => {
          console.log('[RecordingStore] Adding take:', take.id);
          set(
            (state) => ({
              takes: [...state.takes, take],
              recordingState: 'idle',
              selectedTakeId: take.id,
            }),
            false,
            'addTake'
          );
        },

        deleteTake: (id: string) => {
          console.log('[RecordingStore] Deleting take:', id);
          set(
            (state) => {
              const newTakes = state.takes.filter((t) => t.id !== id);

              // If the deleted take was selected, select another or null
              let newSelectedId = state.selectedTakeId;
              if (state.selectedTakeId === id) {
                newSelectedId = newTakes.length > 0 ? newTakes[newTakes.length - 1].id : null;
              }

              // Revoke blob URL if it exists
              const deletedTake = state.takes.find((t) => t.id === id);
              if (deletedTake?.blobUrl) {
                URL.revokeObjectURL(deletedTake.blobUrl);
              }

              return {
                takes: newTakes,
                selectedTakeId: newSelectedId,
              };
            },
            false,
            'deleteTake'
          );
        },

        selectTake: (id: string | null) => {
          console.log('[RecordingStore] Selecting take:', id);
          set(
            {
              selectedTakeId: id,
            },
            false,
            'selectTake'
          );
        },

        renameTake: (id: string, name: string) => {
          console.log('[RecordingStore] Renaming take:', id, 'to', name);
          set(
            (state) => ({
              takes: state.takes.map((t) => (t.id === id ? { ...t, name } : t)),
            }),
            false,
            'renameTake'
          );
        },

        setRecordingDuration: (duration: number) => {
          set(
            {
              recordingDuration: duration,
            },
            false,
            'setRecordingDuration'
          );
        },

        setInputLevel: (level: number) => {
          // Clamp level to 0-1
          const clampedLevel = Math.max(0, Math.min(1, level));
          set(
            {
              inputLevel: clampedLevel,
            },
            false,
            'setInputLevel'
          );
        },

        setError: (error: string | null) => {
          if (error) {
            console.error('[RecordingStore] Error:', error);
          }
          set(
            {
              error,
            },
            false,
            'setError'
          );
        },

        clearTakes: () => {
          console.log('[RecordingStore] Clearing all takes');
          const state = get();

          // Revoke all blob URLs
          state.takes.forEach((take) => {
            if (take.blobUrl) {
              URL.revokeObjectURL(take.blobUrl);
            }
          });

          set(
            {
              takes: [],
              selectedTakeId: null,
            },
            false,
            'clearTakes'
          );
        },

        reset: () => {
          console.log('[RecordingStore] Resetting store');
          const state = get();

          // Revoke all blob URLs
          state.takes.forEach((take) => {
            if (take.blobUrl) {
              URL.revokeObjectURL(take.blobUrl);
            }
          });

          set(initialState, false, 'reset');
        },
      }),
      {
        name: 'ghost-note-recording-store',
        partialize: (state) => ({
          // Only persist take metadata, not blob URLs or recording state
          takes: state.takes.map((take) => ({
            ...take,
            blobUrl: '', // Don't persist blob URLs
          })),
        }),
      }
    ),
    { name: 'RecordingStore' }
  )
);

// =============================================================================
// Selectors
// =============================================================================

/**
 * Check if recording is in progress
 */
export const selectIsRecording = (state: RecordingStore): boolean => {
  return state.recordingState === 'recording';
};

/**
 * Check if recording is paused
 */
export const selectIsPaused = (state: RecordingStore): boolean => {
  return state.recordingState === 'paused';
};

/**
 * Check if idle (not recording)
 */
export const selectIsIdle = (state: RecordingStore): boolean => {
  return state.recordingState === 'idle';
};

/**
 * Check if preparing to record
 */
export const selectIsPreparing = (state: RecordingStore): boolean => {
  return state.recordingState === 'preparing';
};

/**
 * Get the selected take
 */
export const selectSelectedTake = (state: RecordingStore): RecordingTake | null => {
  if (!state.selectedTakeId) return null;
  return state.takes.find((t) => t.id === state.selectedTakeId) ?? null;
};

/**
 * Get take count
 */
export const selectTakeCount = (state: RecordingStore): number => {
  return state.takes.length;
};

/**
 * Check if there are any takes
 */
export const selectHasTakes = (state: RecordingStore): boolean => {
  return state.takes.length > 0;
};

/**
 * Format recording duration as MM:SS
 */
export const selectFormattedDuration = (state: RecordingStore): string => {
  const minutes = Math.floor(state.recordingDuration / 60);
  const seconds = Math.floor(state.recordingDuration % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Get input level as percentage (0-100)
 */
export const selectInputLevelPercent = (state: RecordingStore): number => {
  return Math.round(state.inputLevel * 100);
};

/**
 * Check if microphone permission is granted
 */
export const selectHasPermission = (state: RecordingStore): boolean => {
  return state.hasPermission;
};

/**
 * Get takes sorted by timestamp (newest first)
 */
export const selectTakesSortedByDate = (state: RecordingStore): RecordingTake[] => {
  return [...state.takes].sort((a, b) => b.timestamp - a.timestamp);
};

/**
 * Check if there's an error
 */
export const selectHasError = (state: RecordingStore): boolean => {
  return state.error !== null;
};

/**
 * Get total recording time of all takes
 */
export const selectTotalRecordedTime = (state: RecordingStore): number => {
  return state.takes.reduce((total, take) => total + take.duration, 0);
};
