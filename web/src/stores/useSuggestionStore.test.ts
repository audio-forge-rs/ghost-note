/**
 * Tests for Suggestion Store
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import {
  useSuggestionStore,
  selectHasSuggestions,
  selectSuggestionCount,
  selectPendingSuggestions,
  selectAcceptedSuggestions,
  selectRejectedSuggestions,
  selectPendingCount,
  selectAcceptedCount,
  selectRejectedCount,
  selectIsLoading,
  selectIsSuccess,
  selectHasError,
  selectAllProcessed,
  selectAnyProcessed,
  selectSuggestionsByPreservation,
  selectSuggestionsSorted,
  selectSuggestionsForLine,
} from './useSuggestionStore';
import type { Suggestion } from '../lib/claude/types';

describe('useSuggestionStore', () => {
  const mockSuggestions: Suggestion[] = [
    {
      originalWord: 'beautiful',
      suggestedWord: 'lovely',
      lineNumber: 1,
      position: 0,
      reason: 'Better for singing',
      preservesMeaning: 'yes',
    },
    {
      originalWord: 'walking',
      suggestedWord: 'strolling',
      lineNumber: 2,
      position: 1,
      reason: 'Matches meter',
      preservesMeaning: 'partial',
    },
    {
      originalWord: 'house',
      suggestedWord: 'castle',
      lineNumber: 1,
      position: 2,
      reason: 'More dramatic',
      preservesMeaning: 'no',
    },
  ];

  beforeEach(() => {
    useSuggestionStore.getState().reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts with empty suggestions', () => {
      const state = useSuggestionStore.getState();
      expect(state.suggestions).toEqual([]);
    });

    it('starts in idle loading state', () => {
      const state = useSuggestionStore.getState();
      expect(state.loadingState).toBe('idle');
    });

    it('starts with no error', () => {
      const state = useSuggestionStore.getState();
      expect(state.error).toBeNull();
    });

    it('starts with no lyric version ID', () => {
      const state = useSuggestionStore.getState();
      expect(state.lyricVersionId).toBeNull();
    });
  });

  describe('setSuggestions', () => {
    it('sets suggestions with status', () => {
      act(() => {
        useSuggestionStore.getState().setSuggestions(mockSuggestions);
      });

      const state = useSuggestionStore.getState();
      expect(state.suggestions).toHaveLength(3);
      expect(state.suggestions[0].status).toBe('pending');
      expect(state.suggestions[0].originalWord).toBe('beautiful');
    });

    it('generates unique IDs for each suggestion', () => {
      act(() => {
        useSuggestionStore.getState().setSuggestions(mockSuggestions);
      });

      const state = useSuggestionStore.getState();
      const ids = state.suggestions.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('sets loading state to success', () => {
      act(() => {
        useSuggestionStore.getState().setSuggestions(mockSuggestions);
      });

      const state = useSuggestionStore.getState();
      expect(state.loadingState).toBe('success');
    });

    it('clears any previous error', () => {
      act(() => {
        useSuggestionStore.getState().setError('Previous error');
        useSuggestionStore.getState().setSuggestions(mockSuggestions);
      });

      const state = useSuggestionStore.getState();
      expect(state.error).toBeNull();
    });

    it('sets lyric version ID when provided', () => {
      act(() => {
        useSuggestionStore.getState().setSuggestions(mockSuggestions, 'version-123');
      });

      const state = useSuggestionStore.getState();
      expect(state.lyricVersionId).toBe('version-123');
    });
  });

  describe('acceptSuggestion', () => {
    it('changes suggestion status to accepted', () => {
      act(() => {
        useSuggestionStore.getState().setSuggestions(mockSuggestions);
      });

      const id = useSuggestionStore.getState().suggestions[0].id;

      act(() => {
        useSuggestionStore.getState().acceptSuggestion(id);
      });

      const state = useSuggestionStore.getState();
      expect(state.suggestions[0].status).toBe('accepted');
    });

    it('does not affect other suggestions', () => {
      act(() => {
        useSuggestionStore.getState().setSuggestions(mockSuggestions);
      });

      const id = useSuggestionStore.getState().suggestions[0].id;

      act(() => {
        useSuggestionStore.getState().acceptSuggestion(id);
      });

      const state = useSuggestionStore.getState();
      expect(state.suggestions[1].status).toBe('pending');
      expect(state.suggestions[2].status).toBe('pending');
    });
  });

  describe('rejectSuggestion', () => {
    it('changes suggestion status to rejected', () => {
      act(() => {
        useSuggestionStore.getState().setSuggestions(mockSuggestions);
      });

      const id = useSuggestionStore.getState().suggestions[0].id;

      act(() => {
        useSuggestionStore.getState().rejectSuggestion(id);
      });

      const state = useSuggestionStore.getState();
      expect(state.suggestions[0].status).toBe('rejected');
    });
  });

  describe('resetSuggestion', () => {
    it('changes suggestion status back to pending', () => {
      act(() => {
        useSuggestionStore.getState().setSuggestions(mockSuggestions);
      });

      const id = useSuggestionStore.getState().suggestions[0].id;

      act(() => {
        useSuggestionStore.getState().acceptSuggestion(id);
        useSuggestionStore.getState().resetSuggestion(id);
      });

      const state = useSuggestionStore.getState();
      expect(state.suggestions[0].status).toBe('pending');
    });
  });

  describe('acceptAll', () => {
    it('accepts all pending suggestions', () => {
      act(() => {
        useSuggestionStore.getState().setSuggestions(mockSuggestions);
        useSuggestionStore.getState().acceptAll();
      });

      const state = useSuggestionStore.getState();
      expect(state.suggestions.every((s) => s.status === 'accepted')).toBe(true);
    });

    it('does not affect already rejected suggestions', () => {
      act(() => {
        useSuggestionStore.getState().setSuggestions(mockSuggestions);
      });

      const id = useSuggestionStore.getState().suggestions[0].id;

      act(() => {
        useSuggestionStore.getState().rejectSuggestion(id);
        useSuggestionStore.getState().acceptAll();
      });

      const state = useSuggestionStore.getState();
      expect(state.suggestions[0].status).toBe('rejected');
      expect(state.suggestions[1].status).toBe('accepted');
      expect(state.suggestions[2].status).toBe('accepted');
    });
  });

  describe('rejectAll', () => {
    it('rejects all pending suggestions', () => {
      act(() => {
        useSuggestionStore.getState().setSuggestions(mockSuggestions);
        useSuggestionStore.getState().rejectAll();
      });

      const state = useSuggestionStore.getState();
      expect(state.suggestions.every((s) => s.status === 'rejected')).toBe(true);
    });

    it('does not affect already accepted suggestions', () => {
      act(() => {
        useSuggestionStore.getState().setSuggestions(mockSuggestions);
      });

      const id = useSuggestionStore.getState().suggestions[0].id;

      act(() => {
        useSuggestionStore.getState().acceptSuggestion(id);
        useSuggestionStore.getState().rejectAll();
      });

      const state = useSuggestionStore.getState();
      expect(state.suggestions[0].status).toBe('accepted');
      expect(state.suggestions[1].status).toBe('rejected');
      expect(state.suggestions[2].status).toBe('rejected');
    });
  });

  describe('resetAll', () => {
    it('resets all suggestions to pending', () => {
      act(() => {
        useSuggestionStore.getState().setSuggestions(mockSuggestions);
        useSuggestionStore.getState().acceptAll();
        useSuggestionStore.getState().resetAll();
      });

      const state = useSuggestionStore.getState();
      expect(state.suggestions.every((s) => s.status === 'pending')).toBe(true);
    });
  });

  describe('setLoading', () => {
    it('sets loading state to loading when true', () => {
      act(() => {
        useSuggestionStore.getState().setLoading(true);
      });

      const state = useSuggestionStore.getState();
      expect(state.loadingState).toBe('loading');
    });

    it('sets loading state to idle when false', () => {
      act(() => {
        useSuggestionStore.getState().setLoading(true);
        useSuggestionStore.getState().setLoading(false);
      });

      const state = useSuggestionStore.getState();
      expect(state.loadingState).toBe('idle');
    });

    it('clears error when loading starts', () => {
      act(() => {
        useSuggestionStore.getState().setError('Some error');
        useSuggestionStore.getState().setLoading(true);
      });

      const state = useSuggestionStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('setError', () => {
    it('sets error message', () => {
      act(() => {
        useSuggestionStore.getState().setError('Test error');
      });

      const state = useSuggestionStore.getState();
      expect(state.error).toBe('Test error');
    });

    it('sets loading state to error', () => {
      act(() => {
        useSuggestionStore.getState().setError('Test error');
      });

      const state = useSuggestionStore.getState();
      expect(state.loadingState).toBe('error');
    });

    it('can clear error by passing null', () => {
      act(() => {
        useSuggestionStore.getState().setError('Test error');
        useSuggestionStore.getState().setError(null);
      });

      const state = useSuggestionStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('clear', () => {
    it('clears all suggestions', () => {
      act(() => {
        useSuggestionStore.getState().setSuggestions(mockSuggestions);
        useSuggestionStore.getState().clear();
      });

      const state = useSuggestionStore.getState();
      expect(state.suggestions).toEqual([]);
    });

    it('resets loading state to idle', () => {
      act(() => {
        useSuggestionStore.getState().setSuggestions(mockSuggestions);
        useSuggestionStore.getState().clear();
      });

      const state = useSuggestionStore.getState();
      expect(state.loadingState).toBe('idle');
    });

    it('clears lyric version ID', () => {
      act(() => {
        useSuggestionStore.getState().setSuggestions(mockSuggestions, 'version-123');
        useSuggestionStore.getState().clear();
      });

      const state = useSuggestionStore.getState();
      expect(state.lyricVersionId).toBeNull();
    });
  });

  describe('reset', () => {
    it('resets to initial state', () => {
      act(() => {
        useSuggestionStore.getState().setSuggestions(mockSuggestions);
        useSuggestionStore.getState().setError('Error');
        useSuggestionStore.getState().reset();
      });

      const state = useSuggestionStore.getState();
      expect(state.suggestions).toEqual([]);
      expect(state.loadingState).toBe('idle');
      expect(state.error).toBeNull();
      expect(state.lyricVersionId).toBeNull();
    });
  });

  describe('selectors', () => {
    beforeEach(() => {
      act(() => {
        useSuggestionStore.getState().setSuggestions(mockSuggestions);
      });
    });

    it('selectHasSuggestions returns true when there are suggestions', () => {
      expect(selectHasSuggestions(useSuggestionStore.getState())).toBe(true);
    });

    it('selectHasSuggestions returns false when no suggestions', () => {
      act(() => {
        useSuggestionStore.getState().clear();
      });
      expect(selectHasSuggestions(useSuggestionStore.getState())).toBe(false);
    });

    it('selectSuggestionCount returns correct count', () => {
      expect(selectSuggestionCount(useSuggestionStore.getState())).toBe(3);
    });

    it('selectPendingSuggestions returns only pending', () => {
      act(() => {
        const id = useSuggestionStore.getState().suggestions[0].id;
        useSuggestionStore.getState().acceptSuggestion(id);
      });

      const pending = selectPendingSuggestions(useSuggestionStore.getState());
      expect(pending).toHaveLength(2);
    });

    it('selectAcceptedSuggestions returns only accepted', () => {
      act(() => {
        const id = useSuggestionStore.getState().suggestions[0].id;
        useSuggestionStore.getState().acceptSuggestion(id);
      });

      const accepted = selectAcceptedSuggestions(useSuggestionStore.getState());
      expect(accepted).toHaveLength(1);
    });

    it('selectRejectedSuggestions returns only rejected', () => {
      act(() => {
        const id = useSuggestionStore.getState().suggestions[0].id;
        useSuggestionStore.getState().rejectSuggestion(id);
      });

      const rejected = selectRejectedSuggestions(useSuggestionStore.getState());
      expect(rejected).toHaveLength(1);
    });

    it('selectPendingCount returns correct count', () => {
      act(() => {
        const id = useSuggestionStore.getState().suggestions[0].id;
        useSuggestionStore.getState().acceptSuggestion(id);
      });

      expect(selectPendingCount(useSuggestionStore.getState())).toBe(2);
    });

    it('selectAcceptedCount returns correct count', () => {
      act(() => {
        const id = useSuggestionStore.getState().suggestions[0].id;
        useSuggestionStore.getState().acceptSuggestion(id);
      });

      expect(selectAcceptedCount(useSuggestionStore.getState())).toBe(1);
    });

    it('selectRejectedCount returns correct count', () => {
      act(() => {
        const id = useSuggestionStore.getState().suggestions[0].id;
        useSuggestionStore.getState().rejectSuggestion(id);
      });

      expect(selectRejectedCount(useSuggestionStore.getState())).toBe(1);
    });

    it('selectIsLoading returns true when loading', () => {
      act(() => {
        useSuggestionStore.getState().setLoading(true);
      });

      expect(selectIsLoading(useSuggestionStore.getState())).toBe(true);
    });

    it('selectIsSuccess returns true when success', () => {
      expect(selectIsSuccess(useSuggestionStore.getState())).toBe(true);
    });

    it('selectHasError returns true when error', () => {
      act(() => {
        useSuggestionStore.getState().setError('Error');
      });

      expect(selectHasError(useSuggestionStore.getState())).toBe(true);
    });

    it('selectAllProcessed returns true when all processed', () => {
      act(() => {
        useSuggestionStore.getState().acceptAll();
      });

      expect(selectAllProcessed(useSuggestionStore.getState())).toBe(true);
    });

    it('selectAllProcessed returns false when some pending', () => {
      expect(selectAllProcessed(useSuggestionStore.getState())).toBe(false);
    });

    it('selectAnyProcessed returns true when any processed', () => {
      act(() => {
        const id = useSuggestionStore.getState().suggestions[0].id;
        useSuggestionStore.getState().acceptSuggestion(id);
      });

      expect(selectAnyProcessed(useSuggestionStore.getState())).toBe(true);
    });

    it('selectAnyProcessed returns false when none processed', () => {
      expect(selectAnyProcessed(useSuggestionStore.getState())).toBe(false);
    });

    it('selectSuggestionsByPreservation groups correctly', () => {
      const byPreservation = selectSuggestionsByPreservation(useSuggestionStore.getState());

      expect(byPreservation.yes).toHaveLength(1);
      expect(byPreservation.partial).toHaveLength(1);
      expect(byPreservation.no).toHaveLength(1);
    });

    it('selectSuggestionsSorted sorts by line then position', () => {
      const sorted = selectSuggestionsSorted(useSuggestionStore.getState());

      // Line 1, position 0 first
      expect(sorted[0].originalWord).toBe('beautiful');
      // Line 1, position 2 second
      expect(sorted[1].originalWord).toBe('house');
      // Line 2, position 1 last
      expect(sorted[2].originalWord).toBe('walking');
    });

    it('selectSuggestionsForLine returns suggestions for specific line', () => {
      const forLine1 = selectSuggestionsForLine(1)(useSuggestionStore.getState());
      const forLine2 = selectSuggestionsForLine(2)(useSuggestionStore.getState());

      expect(forLine1).toHaveLength(2);
      expect(forLine2).toHaveLength(1);
    });
  });
});
