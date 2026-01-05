/**
 * Tests for useToastStore
 *
 * @module stores/useToastStore.test
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  useToastStore,
  selectHasToasts,
  selectToastCount,
  selectToastsByType,
  selectLatestToast,
  selectToastExists,
  selectErrorCount,
  selectSuccessCount,
} from './useToastStore';

describe('useToastStore', () => {
  beforeEach(() => {
    useToastStore.getState().reset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useToastStore.getState();
      expect(state.toasts).toEqual([]);
      expect(state.maxToasts).toBe(5);
      expect(state.defaultDuration).toBe(5000);
    });
  });

  describe('addToast', () => {
    it('should add a toast with default options', () => {
      const id = useToastStore.getState().addToast('Test message');

      const state = useToastStore.getState();
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].id).toBe(id);
      expect(state.toasts[0].message).toBe('Test message');
      expect(state.toasts[0].type).toBe('info');
      expect(state.toasts[0].duration).toBe(5000);
    });

    it('should add a toast with custom type', () => {
      useToastStore.getState().addToast('Error message', { type: 'error' });

      const state = useToastStore.getState();
      expect(state.toasts[0].type).toBe('error');
    });

    it('should add a toast with custom duration', () => {
      useToastStore.getState().addToast('Quick message', { duration: 2000 });

      const state = useToastStore.getState();
      expect(state.toasts[0].duration).toBe(2000);
    });

    it('should return unique IDs for each toast', () => {
      const id1 = useToastStore.getState().addToast('First');
      const id2 = useToastStore.getState().addToast('Second');

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^toast-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^toast-\d+-[a-z0-9]+$/);
    });

    it('should stack multiple toasts', () => {
      useToastStore.getState().addToast('First');
      useToastStore.getState().addToast('Second');
      useToastStore.getState().addToast('Third');

      const state = useToastStore.getState();
      expect(state.toasts).toHaveLength(3);
      expect(state.toasts[0].message).toBe('First');
      expect(state.toasts[1].message).toBe('Second');
      expect(state.toasts[2].message).toBe('Third');
    });

    it('should auto-dismiss after duration', () => {
      useToastStore.getState().addToast('Auto dismiss', { duration: 3000 });

      expect(useToastStore.getState().toasts).toHaveLength(1);

      vi.advanceTimersByTime(3000);

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('should not auto-dismiss when duration is 0', () => {
      useToastStore.getState().addToast('No auto dismiss', { duration: 0 });

      expect(useToastStore.getState().toasts).toHaveLength(1);

      vi.advanceTimersByTime(10000);

      expect(useToastStore.getState().toasts).toHaveLength(1);
    });

    it('should respect maxToasts limit', () => {
      useToastStore.getState().setMaxToasts(3);

      useToastStore.getState().addToast('First');
      useToastStore.getState().addToast('Second');
      useToastStore.getState().addToast('Third');
      useToastStore.getState().addToast('Fourth');
      useToastStore.getState().addToast('Fifth');

      const state = useToastStore.getState();
      expect(state.toasts).toHaveLength(3);
      expect(state.toasts[0].message).toBe('Third');
      expect(state.toasts[1].message).toBe('Fourth');
      expect(state.toasts[2].message).toBe('Fifth');
    });

    it('should include createdAt timestamp', () => {
      const beforeTime = Date.now();
      useToastStore.getState().addToast('Timestamped');
      const afterTime = Date.now();

      const toast = useToastStore.getState().toasts[0];
      expect(toast.createdAt).toBeGreaterThanOrEqual(beforeTime);
      expect(toast.createdAt).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('removeToast', () => {
    it('should remove a toast by ID', () => {
      const id1 = useToastStore.getState().addToast('First');
      const id2 = useToastStore.getState().addToast('Second');

      useToastStore.getState().removeToast(id1);

      const state = useToastStore.getState();
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].id).toBe(id2);
    });

    it('should clear auto-dismiss timer when manually removed', () => {
      const id = useToastStore.getState().addToast('Test', { duration: 5000 });

      // Advance time partially
      vi.advanceTimersByTime(2000);

      // Manually remove
      useToastStore.getState().removeToast(id);
      expect(useToastStore.getState().toasts).toHaveLength(0);

      // Advance past original duration - should not crash
      vi.advanceTimersByTime(5000);
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('should handle removing non-existent toast gracefully', () => {
      useToastStore.getState().addToast('Test');

      // Should not throw
      useToastStore.getState().removeToast('non-existent-id');

      expect(useToastStore.getState().toasts).toHaveLength(1);
    });
  });

  describe('clearAll', () => {
    it('should remove all toasts', () => {
      useToastStore.getState().addToast('First');
      useToastStore.getState().addToast('Second');
      useToastStore.getState().addToast('Third');

      useToastStore.getState().clearAll();

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('should clear all auto-dismiss timers', () => {
      useToastStore.getState().addToast('First', { duration: 3000 });
      useToastStore.getState().addToast('Second', { duration: 4000 });

      useToastStore.getState().clearAll();

      // Advance past all durations - should not crash or add toasts back
      vi.advanceTimersByTime(5000);
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });

  describe('convenience methods', () => {
    describe('success', () => {
      it('should create a success toast', () => {
        useToastStore.getState().success('Success message');

        const toast = useToastStore.getState().toasts[0];
        expect(toast.type).toBe('success');
        expect(toast.message).toBe('Success message');
      });

      it('should accept custom duration', () => {
        useToastStore.getState().success('Quick success', 2000);

        const toast = useToastStore.getState().toasts[0];
        expect(toast.duration).toBe(2000);
      });
    });

    describe('error', () => {
      it('should create an error toast', () => {
        useToastStore.getState().error('Error message');

        const toast = useToastStore.getState().toasts[0];
        expect(toast.type).toBe('error');
        expect(toast.message).toBe('Error message');
      });
    });

    describe('warning', () => {
      it('should create a warning toast', () => {
        useToastStore.getState().warning('Warning message');

        const toast = useToastStore.getState().toasts[0];
        expect(toast.type).toBe('warning');
        expect(toast.message).toBe('Warning message');
      });
    });

    describe('info', () => {
      it('should create an info toast', () => {
        useToastStore.getState().info('Info message');

        const toast = useToastStore.getState().toasts[0];
        expect(toast.type).toBe('info');
        expect(toast.message).toBe('Info message');
      });
    });
  });

  describe('setDefaultDuration', () => {
    it('should update default duration for new toasts', () => {
      useToastStore.getState().setDefaultDuration(10000);

      useToastStore.getState().addToast('Test');

      const toast = useToastStore.getState().toasts[0];
      expect(toast.duration).toBe(10000);
    });

    it('should not affect existing toasts', () => {
      useToastStore.getState().addToast('Existing');
      const existingDuration = useToastStore.getState().toasts[0].duration;

      useToastStore.getState().setDefaultDuration(10000);

      expect(useToastStore.getState().toasts[0].duration).toBe(existingDuration);
    });
  });

  describe('setMaxToasts', () => {
    it('should update max toasts limit', () => {
      useToastStore.getState().setMaxToasts(10);

      expect(useToastStore.getState().maxToasts).toBe(10);
    });

    it('should trim existing toasts when reducing limit', () => {
      useToastStore.getState().addToast('First');
      useToastStore.getState().addToast('Second');
      useToastStore.getState().addToast('Third');
      useToastStore.getState().addToast('Fourth');

      useToastStore.getState().setMaxToasts(2);

      const state = useToastStore.getState();
      expect(state.toasts).toHaveLength(2);
      expect(state.toasts[0].message).toBe('Third');
      expect(state.toasts[1].message).toBe('Fourth');
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      useToastStore.getState().addToast('Test');
      useToastStore.getState().setDefaultDuration(10000);
      useToastStore.getState().setMaxToasts(10);

      useToastStore.getState().reset();

      const state = useToastStore.getState();
      expect(state.toasts).toEqual([]);
      expect(state.maxToasts).toBe(5);
      expect(state.defaultDuration).toBe(5000);
    });

    it('should clear all timers', () => {
      useToastStore.getState().addToast('Test', { duration: 5000 });

      useToastStore.getState().reset();

      // Advance past duration - should not crash
      vi.advanceTimersByTime(6000);
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });

  describe('selectors', () => {
    describe('selectHasToasts', () => {
      it('should return false when no toasts', () => {
        expect(selectHasToasts(useToastStore.getState())).toBe(false);
      });

      it('should return true when toasts exist', () => {
        useToastStore.getState().addToast('Test');
        expect(selectHasToasts(useToastStore.getState())).toBe(true);
      });
    });

    describe('selectToastCount', () => {
      it('should return correct count', () => {
        expect(selectToastCount(useToastStore.getState())).toBe(0);

        useToastStore.getState().addToast('First');
        useToastStore.getState().addToast('Second');

        expect(selectToastCount(useToastStore.getState())).toBe(2);
      });
    });

    describe('selectToastsByType', () => {
      it('should filter toasts by type', () => {
        useToastStore.getState().success('Success 1');
        useToastStore.getState().error('Error 1');
        useToastStore.getState().success('Success 2');
        useToastStore.getState().warning('Warning 1');

        const successSelector = selectToastsByType('success');
        const errorSelector = selectToastsByType('error');
        const warningSelector = selectToastsByType('warning');
        const infoSelector = selectToastsByType('info');

        expect(successSelector(useToastStore.getState())).toHaveLength(2);
        expect(errorSelector(useToastStore.getState())).toHaveLength(1);
        expect(warningSelector(useToastStore.getState())).toHaveLength(1);
        expect(infoSelector(useToastStore.getState())).toHaveLength(0);
      });
    });

    describe('selectLatestToast', () => {
      it('should return null when no toasts', () => {
        expect(selectLatestToast(useToastStore.getState())).toBeNull();
      });

      it('should return the most recent toast', () => {
        useToastStore.getState().addToast('First');
        useToastStore.getState().addToast('Second');
        useToastStore.getState().addToast('Third');

        const latest = selectLatestToast(useToastStore.getState());
        expect(latest?.message).toBe('Third');
      });
    });

    describe('selectToastExists', () => {
      it('should return true for existing toast', () => {
        const id = useToastStore.getState().addToast('Test');

        const selector = selectToastExists(id);
        expect(selector(useToastStore.getState())).toBe(true);
      });

      it('should return false for non-existing toast', () => {
        useToastStore.getState().addToast('Test');

        const selector = selectToastExists('non-existent');
        expect(selector(useToastStore.getState())).toBe(false);
      });
    });

    describe('selectErrorCount', () => {
      it('should count only error toasts', () => {
        useToastStore.getState().success('Success');
        useToastStore.getState().error('Error 1');
        useToastStore.getState().error('Error 2');
        useToastStore.getState().warning('Warning');

        expect(selectErrorCount(useToastStore.getState())).toBe(2);
      });
    });

    describe('selectSuccessCount', () => {
      it('should count only success toasts', () => {
        useToastStore.getState().success('Success 1');
        useToastStore.getState().success('Success 2');
        useToastStore.getState().success('Success 3');
        useToastStore.getState().error('Error');

        expect(selectSuccessCount(useToastStore.getState())).toBe(3);
      });
    });
  });

  describe('concurrent toasts with timers', () => {
    it('should handle multiple toasts with different durations', () => {
      useToastStore.getState().addToast('Quick', { duration: 1000 });
      useToastStore.getState().addToast('Medium', { duration: 3000 });
      useToastStore.getState().addToast('Slow', { duration: 5000 });

      expect(useToastStore.getState().toasts).toHaveLength(3);

      vi.advanceTimersByTime(1000);
      expect(useToastStore.getState().toasts).toHaveLength(2);

      vi.advanceTimersByTime(2000);
      expect(useToastStore.getState().toasts).toHaveLength(1);

      vi.advanceTimersByTime(2000);
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('should handle rapid toast additions and removals', () => {
      const id1 = useToastStore.getState().addToast('First', { duration: 1000 });
      const id2 = useToastStore.getState().addToast('Second', { duration: 2000 });
      useToastStore.getState().removeToast(id1);
      const id3 = useToastStore.getState().addToast('Third', { duration: 1500 });
      useToastStore.getState().removeToast(id2);

      expect(useToastStore.getState().toasts).toHaveLength(1);
      expect(useToastStore.getState().toasts[0].id).toBe(id3);

      vi.advanceTimersByTime(1500);
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });
});
