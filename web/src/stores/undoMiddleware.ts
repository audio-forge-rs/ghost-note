/**
 * Ghost Note - Undo Middleware
 *
 * Provides undo/redo functionality for lyric changes in the poem store.
 * Implements a history stack with configurable size limit.
 *
 * @module stores/undoMiddleware
 */

import type { StateCreator, StoreApi } from 'zustand';

// =============================================================================
// Types
// =============================================================================

/**
 * A snapshot of undoable state
 */
export interface UndoState {
  /** The lyrics text at this point in history */
  lyrics: string;
  /** Timestamp when this state was recorded */
  timestamp: number;
  /** Optional description of what caused this state change */
  description?: string;
}

/**
 * Undo history configuration
 */
export interface UndoConfig {
  /** Maximum number of states to keep in history (default: 50) */
  limit?: number;
  /** Whether to enable debug logging */
  debug?: boolean;
}

/**
 * State managed by the undo middleware
 */
export interface UndoHistoryState {
  /** Past states (for undo) */
  past: UndoState[];
  /** Present state (current) */
  present: UndoState | null;
  /** Future states (for redo) */
  future: UndoState[];
}

/**
 * Actions provided by the undo middleware
 */
export interface UndoActions {
  /** Undo the last change, returns the restored lyrics or null if nothing to undo */
  undo: () => string | null;
  /** Redo a previously undone change, returns the restored lyrics or null if nothing to redo */
  redo: () => string | null;
  /** Check if undo is available */
  canUndo: () => boolean;
  /** Check if redo is available */
  canRedo: () => boolean;
  /** Get the number of undo steps available */
  undoCount: () => number;
  /** Get the number of redo steps available */
  redoCount: () => number;
  /** Clear all history (called when a new poem is loaded) */
  clearHistory: () => void;
  /** Record a new state in history */
  recordState: (lyrics: string, description?: string) => void;
  /** Get the current history state (for debugging/display) */
  getHistoryState: () => UndoHistoryState;
}

/**
 * Combined type for undo store state
 */
export type UndoStore = UndoHistoryState & UndoActions;

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_LIMIT = 50;

// Logging helper
const createLogger = (debug: boolean) => (message: string, ...args: unknown[]): void => {
  if (debug) {
    console.log(`[UndoMiddleware] ${message}`, ...args);
  }
};

// =============================================================================
// Undo Store Implementation
// =============================================================================

/**
 * Create a standalone undo history store
 *
 * This is used to manage undo/redo history for lyric changes.
 * It maintains a stack of past states, the present state, and a stack of future states.
 *
 * @param config - Configuration options
 * @returns State creator function for Zustand
 */
export function createUndoSlice(
  config: UndoConfig = {}
): StateCreator<UndoStore, [], [], UndoStore> {
  const { limit = DEFAULT_LIMIT, debug = false } = config;
  const log = createLogger(debug);

  return (set, get) => ({
    // Initial state
    past: [],
    present: null,
    future: [],

    // Actions
    undo: () => {
      const state = get();
      const { past, present, future } = state;

      if (past.length === 0) {
        log('Undo: nothing to undo');
        return null;
      }

      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);

      log('Undo: restoring state', {
        from: present?.lyrics?.substring(0, 50),
        to: previous.lyrics.substring(0, 50),
        pastLength: newPast.length,
      });

      set({
        past: newPast,
        present: previous,
        future: present ? [present, ...future] : future,
      });

      return previous.lyrics;
    },

    redo: () => {
      const state = get();
      const { past, present, future } = state;

      if (future.length === 0) {
        log('Redo: nothing to redo');
        return null;
      }

      const next = future[0];
      const newFuture = future.slice(1);

      log('Redo: restoring state', {
        from: present?.lyrics?.substring(0, 50),
        to: next.lyrics.substring(0, 50),
        futureLength: newFuture.length,
      });

      set({
        past: present ? [...past, present] : past,
        present: next,
        future: newFuture,
      });

      return next.lyrics;
    },

    canUndo: () => {
      return get().past.length > 0;
    },

    canRedo: () => {
      return get().future.length > 0;
    },

    undoCount: () => {
      return get().past.length;
    },

    redoCount: () => {
      return get().future.length;
    },

    clearHistory: () => {
      log('Clearing history');
      set({
        past: [],
        present: null,
        future: [],
      });
    },

    recordState: (lyrics: string, description?: string) => {
      const state = get();
      const { past, present } = state;

      // Don't record if lyrics haven't changed
      if (present && present.lyrics === lyrics) {
        log('RecordState: skipping duplicate state');
        return;
      }

      const newState: UndoState = {
        lyrics,
        timestamp: Date.now(),
        description,
      };

      // Build new past array
      let newPast = present ? [...past, present] : past;

      // Enforce limit
      if (newPast.length >= limit) {
        const excess = newPast.length - limit + 1;
        newPast = newPast.slice(excess);
        log('RecordState: trimmed history to limit', { excess, limit });
      }

      log('RecordState: recording new state', {
        lyrics: lyrics.substring(0, 50),
        description,
        pastLength: newPast.length,
      });

      set({
        past: newPast,
        present: newState,
        future: [], // Clear redo stack on new change
      });
    },

    getHistoryState: () => {
      const { past, present, future } = get();
      return { past, present, future };
    },
  });
}

// =============================================================================
// Standalone Undo Store
// =============================================================================

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

/**
 * Standalone undo store for managing lyric change history
 *
 * This store can be used independently or integrated with the poem store.
 */
export const useUndoStore = create<UndoStore>()(
  devtools(
    subscribeWithSelector(
      createUndoSlice({
        limit: DEFAULT_LIMIT,
        debug: import.meta.env?.DEV ?? false,
      })
    ),
    { name: 'UndoStore' }
  )
);

// =============================================================================
// Selectors
// =============================================================================

/**
 * Select whether undo is available
 */
export const selectCanUndo = (state: UndoStore): boolean => {
  return state.past.length > 0;
};

/**
 * Select whether redo is available
 */
export const selectCanRedo = (state: UndoStore): boolean => {
  return state.future.length > 0;
};

/**
 * Select the number of undo steps available
 */
export const selectUndoCount = (state: UndoStore): number => {
  return state.past.length;
};

/**
 * Select the number of redo steps available
 */
export const selectRedoCount = (state: UndoStore): number => {
  return state.future.length;
};

/**
 * Select the current/present state
 */
export const selectPresentState = (state: UndoStore): UndoState | null => {
  return state.present;
};

/**
 * Select the total history size
 */
export const selectHistorySize = (state: UndoStore): number => {
  return state.past.length + (state.present ? 1 : 0) + state.future.length;
};

/**
 * Select descriptions of past states (for displaying undo menu)
 */
export const selectPastDescriptions = (state: UndoStore): string[] => {
  return state.past
    .map((s) => s.description || 'Edit')
    .reverse(); // Most recent first
};

/**
 * Select descriptions of future states (for displaying redo menu)
 */
export const selectFutureDescriptions = (state: UndoStore): string[] => {
  return state.future.map((s) => s.description || 'Edit');
};

// =============================================================================
// Integration Helper
// =============================================================================

/**
 * Hook to integrate undo store with poem store
 *
 * Call this to set up automatic history recording when lyrics change.
 * Returns cleanup function.
 */
export function setupUndoIntegration(
  poemStore: StoreApi<{
    original: string;
    versions: Array<{ lyrics: string; description?: string }>;
    currentVersionIndex: number;
  }>,
  undoStore: StoreApi<UndoStore>,
  options: { trackOriginal?: boolean } = {}
): () => void {
  const { trackOriginal = true } = options;

  let lastLyrics: string | null = null;

  // Helper to get current lyrics from poem state
  const getCurrentLyrics = (state: {
    original: string;
    versions: Array<{ lyrics: string }>;
    currentVersionIndex: number;
  }): string => {
    if (state.currentVersionIndex >= 0 && state.versions[state.currentVersionIndex]) {
      return state.versions[state.currentVersionIndex].lyrics;
    }
    return state.original;
  };

  // Subscribe to poem store changes
  const unsubscribe = poemStore.subscribe((state, prevState) => {
    const currentLyrics = getCurrentLyrics(state);
    const prevLyrics = getCurrentLyrics(prevState);

    // Check if this is a new poem (original changed and versions reset)
    if (
      state.original !== prevState.original &&
      state.versions.length === 0 &&
      prevState.versions.length > 0
    ) {
      console.log('[UndoIntegration] New poem detected, clearing history');
      undoStore.getState().clearHistory();
      lastLyrics = null;

      // Optionally record the new original as initial state
      if (trackOriginal && state.original) {
        undoStore.getState().recordState(state.original, 'New poem');
        lastLyrics = state.original;
      }
      return;
    }

    // Check if lyrics actually changed
    if (currentLyrics !== prevLyrics && currentLyrics !== lastLyrics) {
      // Determine description
      let description: string | undefined;
      if (state.versions.length > prevState.versions.length) {
        // A new version was added
        const newVersion = state.versions[state.versions.length - 1];
        description = newVersion?.description;
      } else if (state.currentVersionIndex !== prevState.currentVersionIndex) {
        // Version index changed (revert)
        description = 'Reverted to version';
      }

      console.log('[UndoIntegration] Recording lyric change:', {
        from: prevLyrics.substring(0, 30),
        to: currentLyrics.substring(0, 30),
        description,
      });

      undoStore.getState().recordState(currentLyrics, description || 'Edit');
      lastLyrics = currentLyrics;
    }
  });

  // Initialize with current lyrics if present
  const initialState = poemStore.getState();
  const initialLyrics = getCurrentLyrics(initialState);
  if (initialLyrics && trackOriginal) {
    undoStore.getState().recordState(initialLyrics, 'Initial');
    lastLyrics = initialLyrics;
  }

  // Return cleanup and control functions
  return () => {
    unsubscribe();
  };
}
