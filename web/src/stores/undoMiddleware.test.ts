/**
 * Tests for undoMiddleware
 *
 * Comprehensive tests for the undo/redo system.
 *
 * @module stores/undoMiddleware.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useUndoStore, selectCanUndo, selectCanRedo, selectUndoCount, selectRedoCount, selectHistorySize, selectPresentState, selectPastDescriptions, selectFutureDescriptions } from './undoMiddleware';

describe('useUndoStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useUndoStore.getState().clearHistory();
  });

  describe('initial state', () => {
    it('should have empty initial state', () => {
      const state = useUndoStore.getState();
      expect(state.past).toEqual([]);
      expect(state.present).toBeNull();
      expect(state.future).toEqual([]);
    });

    it('should not be able to undo initially', () => {
      expect(useUndoStore.getState().canUndo()).toBe(false);
    });

    it('should not be able to redo initially', () => {
      expect(useUndoStore.getState().canRedo()).toBe(false);
    });
  });

  describe('recordState', () => {
    it('should record a new state', () => {
      useUndoStore.getState().recordState('First lyrics', 'Initial');

      const state = useUndoStore.getState();
      expect(state.present).not.toBeNull();
      expect(state.present?.lyrics).toBe('First lyrics');
      expect(state.present?.description).toBe('Initial');
    });

    it('should set timestamp on recorded states', () => {
      const beforeTime = Date.now();
      useUndoStore.getState().recordState('First lyrics');
      const afterTime = Date.now();

      const state = useUndoStore.getState();
      expect(state.present?.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(state.present?.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should move present to past when recording new state', () => {
      useUndoStore.getState().recordState('First lyrics', 'First');
      useUndoStore.getState().recordState('Second lyrics', 'Second');

      const state = useUndoStore.getState();
      expect(state.past).toHaveLength(1);
      expect(state.past[0].lyrics).toBe('First lyrics');
      expect(state.present?.lyrics).toBe('Second lyrics');
    });

    it('should not record duplicate states', () => {
      useUndoStore.getState().recordState('Same lyrics');
      useUndoStore.getState().recordState('Same lyrics');
      useUndoStore.getState().recordState('Same lyrics');

      const state = useUndoStore.getState();
      expect(state.past).toHaveLength(0);
      expect(state.present?.lyrics).toBe('Same lyrics');
    });

    it('should clear future when recording new state', () => {
      useUndoStore.getState().recordState('First');
      useUndoStore.getState().recordState('Second');
      useUndoStore.getState().undo(); // Now we have a future

      expect(useUndoStore.getState().future).toHaveLength(1);

      useUndoStore.getState().recordState('Third'); // This should clear future

      expect(useUndoStore.getState().future).toHaveLength(0);
    });

    it('should enforce history limit', () => {
      // Record more than 50 states
      for (let i = 0; i < 60; i++) {
        useUndoStore.getState().recordState(`State ${i}`);
      }

      const state = useUndoStore.getState();
      // past + present should not exceed limit
      expect(state.past.length).toBeLessThanOrEqual(50);
    });
  });

  describe('undo', () => {
    it('should return null when nothing to undo', () => {
      const result = useUndoStore.getState().undo();
      expect(result).toBeNull();
    });

    it('should return previous lyrics when undoing', () => {
      useUndoStore.getState().recordState('First');
      useUndoStore.getState().recordState('Second');

      const result = useUndoStore.getState().undo();
      expect(result).toBe('First');
    });

    it('should move present to future when undoing', () => {
      useUndoStore.getState().recordState('First');
      useUndoStore.getState().recordState('Second');
      useUndoStore.getState().undo();

      const state = useUndoStore.getState();
      expect(state.future).toHaveLength(1);
      expect(state.future[0].lyrics).toBe('Second');
    });

    it('should restore previous state as present', () => {
      useUndoStore.getState().recordState('First');
      useUndoStore.getState().recordState('Second');
      useUndoStore.getState().undo();

      const state = useUndoStore.getState();
      expect(state.present?.lyrics).toBe('First');
    });

    it('should allow multiple undos', () => {
      useUndoStore.getState().recordState('First');
      useUndoStore.getState().recordState('Second');
      useUndoStore.getState().recordState('Third');

      expect(useUndoStore.getState().undo()).toBe('Second');
      expect(useUndoStore.getState().undo()).toBe('First');
      expect(useUndoStore.getState().undo()).toBeNull(); // Nothing left
    });
  });

  describe('redo', () => {
    it('should return null when nothing to redo', () => {
      const result = useUndoStore.getState().redo();
      expect(result).toBeNull();
    });

    it('should return null when no undo has been performed', () => {
      useUndoStore.getState().recordState('First');
      useUndoStore.getState().recordState('Second');

      const result = useUndoStore.getState().redo();
      expect(result).toBeNull();
    });

    it('should return undone lyrics when redoing', () => {
      useUndoStore.getState().recordState('First');
      useUndoStore.getState().recordState('Second');
      useUndoStore.getState().undo();

      const result = useUndoStore.getState().redo();
      expect(result).toBe('Second');
    });

    it('should move future to present when redoing', () => {
      useUndoStore.getState().recordState('First');
      useUndoStore.getState().recordState('Second');
      useUndoStore.getState().undo();
      useUndoStore.getState().redo();

      const state = useUndoStore.getState();
      expect(state.future).toHaveLength(0);
      expect(state.present?.lyrics).toBe('Second');
    });

    it('should allow multiple redos after multiple undos', () => {
      useUndoStore.getState().recordState('First');
      useUndoStore.getState().recordState('Second');
      useUndoStore.getState().recordState('Third');

      useUndoStore.getState().undo();
      useUndoStore.getState().undo();

      expect(useUndoStore.getState().redo()).toBe('Second');
      expect(useUndoStore.getState().redo()).toBe('Third');
      expect(useUndoStore.getState().redo()).toBeNull(); // Nothing left
    });
  });

  describe('undo and redo interaction', () => {
    it('should allow undo after redo', () => {
      useUndoStore.getState().recordState('First');
      useUndoStore.getState().recordState('Second');
      useUndoStore.getState().recordState('Third');

      useUndoStore.getState().undo(); // At Second
      useUndoStore.getState().redo(); // Back at Third
      expect(useUndoStore.getState().undo()).toBe('Second');
    });

    it('should clear redo stack when new state is recorded after undo', () => {
      useUndoStore.getState().recordState('First');
      useUndoStore.getState().recordState('Second');
      useUndoStore.getState().undo(); // Back at First

      useUndoStore.getState().recordState('New branch');

      expect(useUndoStore.getState().canRedo()).toBe(false);
      expect(useUndoStore.getState().present?.lyrics).toBe('New branch');
    });
  });

  describe('canUndo and canRedo', () => {
    it('canUndo should return false with no history', () => {
      expect(useUndoStore.getState().canUndo()).toBe(false);
    });

    it('canUndo should return true after recording multiple states', () => {
      useUndoStore.getState().recordState('First');
      expect(useUndoStore.getState().canUndo()).toBe(false); // Only one state

      useUndoStore.getState().recordState('Second');
      expect(useUndoStore.getState().canUndo()).toBe(true);
    });

    it('canRedo should return false with no undos', () => {
      useUndoStore.getState().recordState('First');
      useUndoStore.getState().recordState('Second');
      expect(useUndoStore.getState().canRedo()).toBe(false);
    });

    it('canRedo should return true after undo', () => {
      useUndoStore.getState().recordState('First');
      useUndoStore.getState().recordState('Second');
      useUndoStore.getState().undo();
      expect(useUndoStore.getState().canRedo()).toBe(true);
    });
  });

  describe('undoCount and redoCount', () => {
    it('should return correct undo count', () => {
      expect(useUndoStore.getState().undoCount()).toBe(0);

      useUndoStore.getState().recordState('First');
      expect(useUndoStore.getState().undoCount()).toBe(0);

      useUndoStore.getState().recordState('Second');
      expect(useUndoStore.getState().undoCount()).toBe(1);

      useUndoStore.getState().recordState('Third');
      expect(useUndoStore.getState().undoCount()).toBe(2);
    });

    it('should return correct redo count', () => {
      useUndoStore.getState().recordState('First');
      useUndoStore.getState().recordState('Second');
      useUndoStore.getState().recordState('Third');

      expect(useUndoStore.getState().redoCount()).toBe(0);

      useUndoStore.getState().undo();
      expect(useUndoStore.getState().redoCount()).toBe(1);

      useUndoStore.getState().undo();
      expect(useUndoStore.getState().redoCount()).toBe(2);
    });
  });

  describe('clearHistory', () => {
    it('should clear all history', () => {
      useUndoStore.getState().recordState('First');
      useUndoStore.getState().recordState('Second');
      useUndoStore.getState().recordState('Third');
      useUndoStore.getState().undo();

      useUndoStore.getState().clearHistory();

      const state = useUndoStore.getState();
      expect(state.past).toEqual([]);
      expect(state.present).toBeNull();
      expect(state.future).toEqual([]);
    });

    it('should reset canUndo and canRedo after clearing', () => {
      useUndoStore.getState().recordState('First');
      useUndoStore.getState().recordState('Second');
      useUndoStore.getState().undo();

      useUndoStore.getState().clearHistory();

      expect(useUndoStore.getState().canUndo()).toBe(false);
      expect(useUndoStore.getState().canRedo()).toBe(false);
    });
  });

  describe('getHistoryState', () => {
    it('should return current history state', () => {
      useUndoStore.getState().recordState('First');
      useUndoStore.getState().recordState('Second');
      useUndoStore.getState().undo();

      const historyState = useUndoStore.getState().getHistoryState();

      expect(historyState.past).toHaveLength(0);
      expect(historyState.present?.lyrics).toBe('First');
      expect(historyState.future).toHaveLength(1);
      expect(historyState.future[0].lyrics).toBe('Second');
    });
  });

  describe('selectors', () => {
    describe('selectCanUndo', () => {
      it('should return false when no history', () => {
        expect(selectCanUndo(useUndoStore.getState())).toBe(false);
      });

      it('should return true when history exists', () => {
        useUndoStore.getState().recordState('First');
        useUndoStore.getState().recordState('Second');
        expect(selectCanUndo(useUndoStore.getState())).toBe(true);
      });
    });

    describe('selectCanRedo', () => {
      it('should return false when no future', () => {
        useUndoStore.getState().recordState('First');
        useUndoStore.getState().recordState('Second');
        expect(selectCanRedo(useUndoStore.getState())).toBe(false);
      });

      it('should return true when future exists', () => {
        useUndoStore.getState().recordState('First');
        useUndoStore.getState().recordState('Second');
        useUndoStore.getState().undo();
        expect(selectCanRedo(useUndoStore.getState())).toBe(true);
      });
    });

    describe('selectUndoCount', () => {
      it('should return correct count', () => {
        expect(selectUndoCount(useUndoStore.getState())).toBe(0);

        useUndoStore.getState().recordState('First');
        useUndoStore.getState().recordState('Second');
        useUndoStore.getState().recordState('Third');

        expect(selectUndoCount(useUndoStore.getState())).toBe(2);
      });
    });

    describe('selectRedoCount', () => {
      it('should return correct count', () => {
        useUndoStore.getState().recordState('First');
        useUndoStore.getState().recordState('Second');
        useUndoStore.getState().recordState('Third');

        expect(selectRedoCount(useUndoStore.getState())).toBe(0);

        useUndoStore.getState().undo();
        useUndoStore.getState().undo();

        expect(selectRedoCount(useUndoStore.getState())).toBe(2);
      });
    });

    describe('selectPresentState', () => {
      it('should return null when no present', () => {
        expect(selectPresentState(useUndoStore.getState())).toBeNull();
      });

      it('should return current present state', () => {
        useUndoStore.getState().recordState('Current', 'Description');
        const present = selectPresentState(useUndoStore.getState());

        expect(present?.lyrics).toBe('Current');
        expect(present?.description).toBe('Description');
      });
    });

    describe('selectHistorySize', () => {
      it('should return 0 when empty', () => {
        expect(selectHistorySize(useUndoStore.getState())).toBe(0);
      });

      it('should return correct total size', () => {
        useUndoStore.getState().recordState('First');
        useUndoStore.getState().recordState('Second');
        useUndoStore.getState().recordState('Third');
        useUndoStore.getState().undo();

        // past: 1, present: 1, future: 1
        expect(selectHistorySize(useUndoStore.getState())).toBe(3);
      });
    });

    describe('selectPastDescriptions', () => {
      it('should return empty array when no past', () => {
        expect(selectPastDescriptions(useUndoStore.getState())).toEqual([]);
      });

      it('should return descriptions in reverse order (most recent first)', () => {
        useUndoStore.getState().recordState('First', 'First description');
        useUndoStore.getState().recordState('Second', 'Second description');
        useUndoStore.getState().recordState('Third', 'Third description');

        const descriptions = selectPastDescriptions(useUndoStore.getState());
        expect(descriptions).toEqual(['Second description', 'First description']);
      });

      it('should use "Edit" for states without description', () => {
        useUndoStore.getState().recordState('First');
        useUndoStore.getState().recordState('Second');

        const descriptions = selectPastDescriptions(useUndoStore.getState());
        expect(descriptions).toEqual(['Edit']);
      });
    });

    describe('selectFutureDescriptions', () => {
      it('should return empty array when no future', () => {
        useUndoStore.getState().recordState('First');
        expect(selectFutureDescriptions(useUndoStore.getState())).toEqual([]);
      });

      it('should return descriptions in order', () => {
        useUndoStore.getState().recordState('First', 'First description');
        useUndoStore.getState().recordState('Second', 'Second description');
        useUndoStore.getState().recordState('Third', 'Third description');
        useUndoStore.getState().undo();
        useUndoStore.getState().undo();

        const descriptions = selectFutureDescriptions(useUndoStore.getState());
        expect(descriptions).toEqual(['Second description', 'Third description']);
      });
    });
  });

  describe('history limit enforcement', () => {
    it('should keep history within limit', () => {
      // Record 60 states (default limit is 50)
      for (let i = 0; i < 60; i++) {
        useUndoStore.getState().recordState(`State ${i}`, `Edit ${i}`);
      }

      const state = useUndoStore.getState();
      // past should have been trimmed
      expect(state.past.length).toBeLessThanOrEqual(49); // 50 - 1 for present
      expect(state.present?.lyrics).toBe('State 59');
    });

    it('should remove oldest states when limit exceeded', () => {
      // Record 55 states
      for (let i = 0; i < 55; i++) {
        useUndoStore.getState().recordState(`State ${i}`);
      }

      // Undo to see what the oldest state is
      let oldestLyrics = '';
      while (useUndoStore.getState().canUndo()) {
        oldestLyrics = useUndoStore.getState().undo() || '';
      }

      // The oldest state should NOT be "State 0" since it was trimmed
      expect(parseInt(oldestLyrics.replace('State ', ''))).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty lyrics', () => {
      useUndoStore.getState().recordState('');
      expect(useUndoStore.getState().present?.lyrics).toBe('');
    });

    it('should handle very long lyrics', () => {
      const longLyrics = 'a'.repeat(100000);
      useUndoStore.getState().recordState(longLyrics);
      expect(useUndoStore.getState().present?.lyrics).toBe(longLyrics);
    });

    it('should handle special characters in lyrics', () => {
      const specialLyrics = '🎵 "Hello" — World 🌍\n\tNew line!';
      useUndoStore.getState().recordState(specialLyrics);
      expect(useUndoStore.getState().present?.lyrics).toBe(specialLyrics);

      useUndoStore.getState().recordState('Other lyrics');
      expect(useUndoStore.getState().undo()).toBe(specialLyrics);
    });

    it('should handle rapid state changes', () => {
      // Simulate rapid typing
      for (let i = 0; i < 10; i++) {
        useUndoStore.getState().recordState(`Typing ${i}`);
      }

      expect(useUndoStore.getState().present?.lyrics).toBe('Typing 9');
      expect(useUndoStore.getState().undoCount()).toBe(9);
    });

    it('should handle undo to empty state', () => {
      useUndoStore.getState().recordState('First');

      // Should not be able to undo past the first state
      expect(useUndoStore.getState().undo()).toBeNull();
    });
  });
});
