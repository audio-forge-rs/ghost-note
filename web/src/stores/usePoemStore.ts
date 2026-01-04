/**
 * Ghost Note - Poem Store
 *
 * Manages the original poem text and all adapted lyric versions.
 *
 * @module stores/usePoemStore
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { PoemStore, PoemState, LyricVersion, LyricChange } from './types';

// =============================================================================
// Initial State
// =============================================================================

const initialState: PoemState = {
  original: '',
  versions: [],
  currentVersionIndex: -1,
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate a unique ID for versions
 */
function generateId(): string {
  return `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Compute simple changes between two texts
 * This is a basic implementation - in production, use diff-match-patch
 */
function computeChanges(oldText: string, newText: string): LyricChange[] {
  const changes: LyricChange[] = [];

  if (oldText === newText) {
    return changes;
  }

  // Simple diff: if texts differ, record as a single modification
  // More sophisticated diffing can be added with diff-match-patch library
  if (oldText !== newText) {
    changes.push({
      type: 'modify',
      start: 0,
      end: oldText.length,
      oldText,
      newText,
    });
  }

  return changes;
}

// =============================================================================
// Store Implementation
// =============================================================================

export const usePoemStore = create<PoemStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        ...initialState,

        // Actions
        setPoem: (text: string) => {
          console.log('[PoemStore] Setting poem:', text.substring(0, 50) + '...');
          set(
            {
              original: text,
              versions: [],
              currentVersionIndex: -1,
            },
            false,
            'setPoem'
          );
        },

        addVersion: (lyrics: string, description?: string) => {
          const state = get();
          const previousText =
            state.currentVersionIndex >= 0
              ? state.versions[state.currentVersionIndex].lyrics
              : state.original;

          const newVersion: LyricVersion = {
            id: generateId(),
            lyrics,
            timestamp: Date.now(),
            changes: computeChanges(previousText, lyrics),
            description,
          };

          console.log('[PoemStore] Adding version:', newVersion.id, description);

          set(
            (state) => ({
              versions: [...state.versions, newVersion],
              currentVersionIndex: state.versions.length,
            }),
            false,
            'addVersion'
          );
        },

        revertToVersion: (index: number) => {
          const state = get();
          if (index < -1 || index >= state.versions.length) {
            console.warn('[PoemStore] Invalid version index:', index);
            return;
          }

          console.log('[PoemStore] Reverting to version index:', index);

          set(
            {
              currentVersionIndex: index,
            },
            false,
            'revertToVersion'
          );
        },

        updateCurrentVersion: (lyrics: string) => {
          const state = get();
          if (state.currentVersionIndex < 0) {
            // No version selected, create a new one
            get().addVersion(lyrics, 'Direct edit');
            return;
          }

          const currentVersion = state.versions[state.currentVersionIndex];
          const previousText =
            state.currentVersionIndex > 0
              ? state.versions[state.currentVersionIndex - 1].lyrics
              : state.original;

          console.log('[PoemStore] Updating current version:', currentVersion.id);

          set(
            (state) => ({
              versions: state.versions.map((v, i) =>
                i === state.currentVersionIndex
                  ? {
                      ...v,
                      lyrics,
                      timestamp: Date.now(),
                      changes: computeChanges(previousText, lyrics),
                    }
                  : v
              ),
            }),
            false,
            'updateCurrentVersion'
          );
        },

        deleteVersion: (id: string) => {
          const state = get();
          const versionIndex = state.versions.findIndex((v) => v.id === id);

          if (versionIndex === -1) {
            console.warn('[PoemStore] Version not found:', id);
            return;
          }

          console.log('[PoemStore] Deleting version:', id);

          set(
            (state) => {
              const newVersions = state.versions.filter((v) => v.id !== id);
              let newCurrentIndex = state.currentVersionIndex;

              // Adjust current index if necessary
              if (versionIndex <= state.currentVersionIndex) {
                newCurrentIndex = Math.max(-1, state.currentVersionIndex - 1);
              }

              return {
                versions: newVersions,
                currentVersionIndex: newCurrentIndex,
              };
            },
            false,
            'deleteVersion'
          );
        },

        reset: () => {
          console.log('[PoemStore] Resetting store');
          set(initialState, false, 'reset');
        },
      }),
      {
        name: 'ghost-note-poem-store',
        partialize: (state) => ({
          original: state.original,
          versions: state.versions,
          currentVersionIndex: state.currentVersionIndex,
        }),
      }
    ),
    { name: 'PoemStore' }
  )
);

// =============================================================================
// Selectors
// =============================================================================

/**
 * Get the current lyrics (either from a version or the original)
 */
export const selectCurrentLyrics = (state: PoemStore): string => {
  if (state.currentVersionIndex >= 0 && state.versions[state.currentVersionIndex]) {
    return state.versions[state.currentVersionIndex].lyrics;
  }
  return state.original;
};

/**
 * Get the current version (null if viewing original)
 */
export const selectCurrentVersion = (state: PoemStore): LyricVersion | null => {
  if (state.currentVersionIndex >= 0 && state.versions[state.currentVersionIndex]) {
    return state.versions[state.currentVersionIndex];
  }
  return null;
};

/**
 * Check if there are any versions
 */
export const selectHasVersions = (state: PoemStore): boolean => {
  return state.versions.length > 0;
};

/**
 * Get the number of versions
 */
export const selectVersionCount = (state: PoemStore): number => {
  return state.versions.length;
};

/**
 * Check if viewing the original (no version selected)
 */
export const selectIsViewingOriginal = (state: PoemStore): boolean => {
  return state.currentVersionIndex === -1;
};

/**
 * Check if there's any poem content
 */
export const selectHasPoem = (state: PoemStore): boolean => {
  return state.original.trim().length > 0;
};

/**
 * Get word count of current lyrics
 */
export const selectWordCount = (state: PoemStore): number => {
  const lyrics = selectCurrentLyrics(state);
  return lyrics.trim() ? lyrics.trim().split(/\s+/).length : 0;
};

/**
 * Get line count of current lyrics
 */
export const selectLineCount = (state: PoemStore): number => {
  const lyrics = selectCurrentLyrics(state);
  return lyrics.trim() ? lyrics.split('\n').filter((line) => line.trim()).length : 0;
};
