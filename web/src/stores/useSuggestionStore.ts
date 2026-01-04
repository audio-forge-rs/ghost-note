/**
 * Ghost Note - Suggestion Store
 *
 * Manages Claude-powered lyric suggestions including loading states,
 * suggestion acceptance/rejection, and batch operations.
 *
 * @module stores/useSuggestionStore
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Suggestion, MeaningPreservation } from '../lib/claude/types';

// =============================================================================
// Types
// =============================================================================

/**
 * Status of an individual suggestion
 */
export type SuggestionStatus = 'pending' | 'accepted' | 'rejected';

/**
 * A suggestion with additional UI state
 */
export interface SuggestionWithStatus extends Suggestion {
  /** Unique identifier for UI operations */
  id: string;
  /** Current acceptance status */
  status: SuggestionStatus;
}

/**
 * Loading state for suggestion fetching
 */
export type SuggestionLoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * State for the suggestion store
 */
export interface SuggestionState {
  /** All suggestions with their status */
  suggestions: SuggestionWithStatus[];
  /** Current loading state */
  loadingState: SuggestionLoadingState;
  /** Error message if loading failed */
  error: string | null;
  /** ID of the lyric version these suggestions apply to */
  lyricVersionId: string | null;
}

/**
 * Actions for the suggestion store
 */
export interface SuggestionActions {
  /** Set suggestions from Claude response */
  setSuggestions: (suggestions: Suggestion[], lyricVersionId?: string) => void;
  /** Accept a single suggestion */
  acceptSuggestion: (id: string) => void;
  /** Reject a single suggestion */
  rejectSuggestion: (id: string) => void;
  /** Reset a suggestion to pending */
  resetSuggestion: (id: string) => void;
  /** Accept all pending suggestions */
  acceptAll: () => void;
  /** Reject all pending suggestions */
  rejectAll: () => void;
  /** Reset all suggestions to pending */
  resetAll: () => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Set error state */
  setError: (error: string | null) => void;
  /** Clear all suggestions */
  clear: () => void;
  /** Reset store to initial state */
  reset: () => void;
}

export type SuggestionStore = SuggestionState & SuggestionActions;

// =============================================================================
// Initial State
// =============================================================================

const initialState: SuggestionState = {
  suggestions: [],
  loadingState: 'idle',
  error: null,
  lyricVersionId: null,
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate a unique ID for suggestions
 */
function generateId(): string {
  return `sug_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Convert a Suggestion to SuggestionWithStatus
 */
function toSuggestionWithStatus(suggestion: Suggestion): SuggestionWithStatus {
  return {
    ...suggestion,
    id: generateId(),
    status: 'pending',
  };
}

// =============================================================================
// Store Implementation
// =============================================================================

export const useSuggestionStore = create<SuggestionStore>()(
  devtools(
    (set, get) => ({
      // State
      ...initialState,

      // Actions
      setSuggestions: (suggestions: Suggestion[], lyricVersionId?: string) => {
        console.log(
          '[SuggestionStore] Setting suggestions:',
          suggestions.length,
          'for version:',
          lyricVersionId
        );

        const suggestionsWithStatus = suggestions.map(toSuggestionWithStatus);

        set(
          {
            suggestions: suggestionsWithStatus,
            loadingState: 'success',
            error: null,
            lyricVersionId: lyricVersionId ?? null,
          },
          false,
          'setSuggestions'
        );
      },

      acceptSuggestion: (id: string) => {
        console.log('[SuggestionStore] Accepting suggestion:', id);

        set(
          (state) => ({
            suggestions: state.suggestions.map((s) =>
              s.id === id ? { ...s, status: 'accepted' as const } : s
            ),
          }),
          false,
          'acceptSuggestion'
        );
      },

      rejectSuggestion: (id: string) => {
        console.log('[SuggestionStore] Rejecting suggestion:', id);

        set(
          (state) => ({
            suggestions: state.suggestions.map((s) =>
              s.id === id ? { ...s, status: 'rejected' as const } : s
            ),
          }),
          false,
          'rejectSuggestion'
        );
      },

      resetSuggestion: (id: string) => {
        console.log('[SuggestionStore] Resetting suggestion:', id);

        set(
          (state) => ({
            suggestions: state.suggestions.map((s) =>
              s.id === id ? { ...s, status: 'pending' as const } : s
            ),
          }),
          false,
          'resetSuggestion'
        );
      },

      acceptAll: () => {
        const state = get();
        const pendingCount = state.suggestions.filter((s) => s.status === 'pending').length;
        console.log('[SuggestionStore] Accepting all suggestions:', pendingCount);

        set(
          (state) => ({
            suggestions: state.suggestions.map((s) =>
              s.status === 'pending' ? { ...s, status: 'accepted' as const } : s
            ),
          }),
          false,
          'acceptAll'
        );
      },

      rejectAll: () => {
        const state = get();
        const pendingCount = state.suggestions.filter((s) => s.status === 'pending').length;
        console.log('[SuggestionStore] Rejecting all suggestions:', pendingCount);

        set(
          (state) => ({
            suggestions: state.suggestions.map((s) =>
              s.status === 'pending' ? { ...s, status: 'rejected' as const } : s
            ),
          }),
          false,
          'rejectAll'
        );
      },

      resetAll: () => {
        console.log('[SuggestionStore] Resetting all suggestions to pending');

        set(
          (state) => ({
            suggestions: state.suggestions.map((s) => ({
              ...s,
              status: 'pending' as const,
            })),
          }),
          false,
          'resetAll'
        );
      },

      setLoading: (loading: boolean) => {
        console.log('[SuggestionStore] Setting loading:', loading);

        set(
          {
            loadingState: loading ? 'loading' : 'idle',
            error: loading ? null : get().error,
          },
          false,
          'setLoading'
        );
      },

      setError: (error: string | null) => {
        console.log('[SuggestionStore] Setting error:', error);

        set(
          {
            error,
            loadingState: error ? 'error' : get().loadingState,
          },
          false,
          'setError'
        );
      },

      clear: () => {
        console.log('[SuggestionStore] Clearing suggestions');

        set(
          {
            suggestions: [],
            loadingState: 'idle',
            error: null,
            lyricVersionId: null,
          },
          false,
          'clear'
        );
      },

      reset: () => {
        console.log('[SuggestionStore] Resetting store');
        set(initialState, false, 'reset');
      },
    }),
    { name: 'SuggestionStore' }
  )
);

// =============================================================================
// Selectors
// =============================================================================

/**
 * Check if there are any suggestions
 */
export const selectHasSuggestions = (state: SuggestionStore): boolean => {
  return state.suggestions.length > 0;
};

/**
 * Get the number of suggestions
 */
export const selectSuggestionCount = (state: SuggestionStore): number => {
  return state.suggestions.length;
};

/**
 * Get pending suggestions
 */
export const selectPendingSuggestions = (state: SuggestionStore): SuggestionWithStatus[] => {
  return state.suggestions.filter((s) => s.status === 'pending');
};

/**
 * Get accepted suggestions
 */
export const selectAcceptedSuggestions = (state: SuggestionStore): SuggestionWithStatus[] => {
  return state.suggestions.filter((s) => s.status === 'accepted');
};

/**
 * Get rejected suggestions
 */
export const selectRejectedSuggestions = (state: SuggestionStore): SuggestionWithStatus[] => {
  return state.suggestions.filter((s) => s.status === 'rejected');
};

/**
 * Get count of pending suggestions
 */
export const selectPendingCount = (state: SuggestionStore): number => {
  return state.suggestions.filter((s) => s.status === 'pending').length;
};

/**
 * Get count of accepted suggestions
 */
export const selectAcceptedCount = (state: SuggestionStore): number => {
  return state.suggestions.filter((s) => s.status === 'accepted').length;
};

/**
 * Get count of rejected suggestions
 */
export const selectRejectedCount = (state: SuggestionStore): number => {
  return state.suggestions.filter((s) => s.status === 'rejected').length;
};

/**
 * Check if loading suggestions
 */
export const selectIsLoading = (state: SuggestionStore): boolean => {
  return state.loadingState === 'loading';
};

/**
 * Check if suggestions loaded successfully
 */
export const selectIsSuccess = (state: SuggestionStore): boolean => {
  return state.loadingState === 'success';
};

/**
 * Check if there's an error
 */
export const selectHasError = (state: SuggestionStore): boolean => {
  return state.loadingState === 'error' && state.error !== null;
};

/**
 * Check if all suggestions have been processed (none pending)
 */
export const selectAllProcessed = (state: SuggestionStore): boolean => {
  return state.suggestions.length > 0 && state.suggestions.every((s) => s.status !== 'pending');
};

/**
 * Check if any suggestions have been processed
 */
export const selectAnyProcessed = (state: SuggestionStore): boolean => {
  return state.suggestions.some((s) => s.status !== 'pending');
};

/**
 * Get suggestions grouped by meaning preservation
 */
export const selectSuggestionsByPreservation = (
  state: SuggestionStore
): Record<MeaningPreservation, SuggestionWithStatus[]> => {
  const result: Record<MeaningPreservation, SuggestionWithStatus[]> = {
    yes: [],
    partial: [],
    no: [],
  };

  for (const suggestion of state.suggestions) {
    result[suggestion.preservesMeaning].push(suggestion);
  }

  return result;
};

/**
 * Get suggestions sorted by line number then position
 */
export const selectSuggestionsSorted = (state: SuggestionStore): SuggestionWithStatus[] => {
  return [...state.suggestions].sort((a, b) => {
    if (a.lineNumber !== b.lineNumber) {
      return a.lineNumber - b.lineNumber;
    }
    return a.position - b.position;
  });
};

/**
 * Get suggestions for a specific line
 */
export const selectSuggestionsForLine =
  (lineNumber: number) =>
  (state: SuggestionStore): SuggestionWithStatus[] => {
    return state.suggestions.filter((s) => s.lineNumber === lineNumber);
  };
