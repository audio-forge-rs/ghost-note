/**
 * Tests for usePlaybackKeyboard Hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, cleanup, act } from '@testing-library/react';
import {
  usePlaybackKeyboard,
  DEFAULT_SHORTCUTS,
  type UsePlaybackKeyboardOptions,
} from './usePlaybackKeyboard';

describe('usePlaybackKeyboard', () => {
  const defaultOptions: UsePlaybackKeyboardOptions = {
    callbacks: {
      onPlayPause: vi.fn(),
      onStop: vi.fn(),
      onTempoUp: vi.fn(),
      onTempoDown: vi.fn(),
      onSeekForward: vi.fn(),
      onSeekBackward: vi.fn(),
      onToggleLoop: vi.fn(),
      onJumpToStart: vi.fn(),
      onJumpToEnd: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('initialization', () => {
    it('returns expected interface', () => {
      const { result } = renderHook(() => usePlaybackKeyboard(defaultOptions));

      expect(result.current).toHaveProperty('isActive');
      expect(result.current).toHaveProperty('triggerAction');
      expect(result.current).toHaveProperty('getShortcut');
      expect(result.current).toHaveProperty('shortcuts');
    });

    it('is active by default', () => {
      const { result } = renderHook(() => usePlaybackKeyboard(defaultOptions));

      expect(result.current.isActive).toBe(true);
    });

    it('is inactive when enabled is false', () => {
      const { result } = renderHook(() =>
        usePlaybackKeyboard({ ...defaultOptions, enabled: false })
      );

      expect(result.current.isActive).toBe(false);
    });
  });

  describe('keyboard shortcuts', () => {
    it('calls onPlayPause when Space is pressed', () => {
      const onPlayPause = vi.fn();
      renderHook(() =>
        usePlaybackKeyboard({
          ...defaultOptions,
          callbacks: { ...defaultOptions.callbacks, onPlayPause },
        })
      );

      act(() => {
        const event = new KeyboardEvent('keydown', { key: ' ' });
        window.dispatchEvent(event);
      });

      expect(onPlayPause).toHaveBeenCalledTimes(1);
    });

    it('calls onStop when Escape is pressed', () => {
      const onStop = vi.fn();
      renderHook(() =>
        usePlaybackKeyboard({
          ...defaultOptions,
          callbacks: { ...defaultOptions.callbacks, onStop },
        })
      );

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Escape' });
        window.dispatchEvent(event);
      });

      expect(onStop).toHaveBeenCalledTimes(1);
    });

    it('calls onTempoUp when + is pressed', () => {
      const onTempoUp = vi.fn();
      renderHook(() =>
        usePlaybackKeyboard({
          ...defaultOptions,
          callbacks: { ...defaultOptions.callbacks, onTempoUp },
        })
      );

      act(() => {
        const event = new KeyboardEvent('keydown', { key: '+' });
        window.dispatchEvent(event);
      });

      expect(onTempoUp).toHaveBeenCalledTimes(1);
    });

    it('calls onTempoDown when - is pressed', () => {
      const onTempoDown = vi.fn();
      renderHook(() =>
        usePlaybackKeyboard({
          ...defaultOptions,
          callbacks: { ...defaultOptions.callbacks, onTempoDown },
        })
      );

      act(() => {
        const event = new KeyboardEvent('keydown', { key: '-' });
        window.dispatchEvent(event);
      });

      expect(onTempoDown).toHaveBeenCalledTimes(1);
    });

    it('calls onSeekForward when ArrowRight is pressed', () => {
      const onSeekForward = vi.fn();
      renderHook(() =>
        usePlaybackKeyboard({
          ...defaultOptions,
          callbacks: { ...defaultOptions.callbacks, onSeekForward },
        })
      );

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
        window.dispatchEvent(event);
      });

      expect(onSeekForward).toHaveBeenCalledTimes(1);
      expect(onSeekForward).toHaveBeenCalledWith(5); // Default seek amount
    });

    it('calls onSeekBackward when ArrowLeft is pressed', () => {
      const onSeekBackward = vi.fn();
      renderHook(() =>
        usePlaybackKeyboard({
          ...defaultOptions,
          callbacks: { ...defaultOptions.callbacks, onSeekBackward },
        })
      );

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
        window.dispatchEvent(event);
      });

      expect(onSeekBackward).toHaveBeenCalledTimes(1);
      expect(onSeekBackward).toHaveBeenCalledWith(5);
    });

    it('calls onToggleLoop when L is pressed', () => {
      const onToggleLoop = vi.fn();
      renderHook(() =>
        usePlaybackKeyboard({
          ...defaultOptions,
          callbacks: { ...defaultOptions.callbacks, onToggleLoop },
        })
      );

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'l' });
        window.dispatchEvent(event);
      });

      expect(onToggleLoop).toHaveBeenCalledTimes(1);
    });

    it('calls onJumpToStart when Home is pressed', () => {
      const onJumpToStart = vi.fn();
      renderHook(() =>
        usePlaybackKeyboard({
          ...defaultOptions,
          callbacks: { ...defaultOptions.callbacks, onJumpToStart },
        })
      );

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Home' });
        window.dispatchEvent(event);
      });

      expect(onJumpToStart).toHaveBeenCalledTimes(1);
    });

    it('calls onJumpToEnd when End is pressed', () => {
      const onJumpToEnd = vi.fn();
      renderHook(() =>
        usePlaybackKeyboard({
          ...defaultOptions,
          callbacks: { ...defaultOptions.callbacks, onJumpToEnd },
        })
      );

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'End' });
        window.dispatchEvent(event);
      });

      expect(onJumpToEnd).toHaveBeenCalledTimes(1);
    });
  });

  describe('seek amount', () => {
    it('uses custom seek amount', () => {
      const onSeekForward = vi.fn();
      renderHook(() =>
        usePlaybackKeyboard({
          ...defaultOptions,
          seekAmount: 10,
          callbacks: { ...defaultOptions.callbacks, onSeekForward },
        })
      );

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
        window.dispatchEvent(event);
      });

      expect(onSeekForward).toHaveBeenCalledWith(10);
    });

    it('doubles seek amount with Shift key', () => {
      const onSeekForward = vi.fn();
      renderHook(() =>
        usePlaybackKeyboard({
          ...defaultOptions,
          seekAmount: 5,
          callbacks: { ...defaultOptions.callbacks, onSeekForward },
        })
      );

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true });
        window.dispatchEvent(event);
      });

      expect(onSeekForward).toHaveBeenCalledWith(10);
    });
  });

  describe('disabled state', () => {
    it('does not call callbacks when disabled', () => {
      const onPlayPause = vi.fn();
      renderHook(() =>
        usePlaybackKeyboard({
          ...defaultOptions,
          enabled: false,
          callbacks: { ...defaultOptions.callbacks, onPlayPause },
        })
      );

      act(() => {
        const event = new KeyboardEvent('keydown', { key: ' ' });
        window.dispatchEvent(event);
      });

      expect(onPlayPause).not.toHaveBeenCalled();
    });
  });

  describe('ignored elements', () => {
    it('ignores events from input elements', () => {
      const onPlayPause = vi.fn();
      renderHook(() =>
        usePlaybackKeyboard({
          ...defaultOptions,
          callbacks: { ...defaultOptions.callbacks, onPlayPause },
        })
      );

      const input = document.createElement('input');
      document.body.appendChild(input);

      act(() => {
        const event = new KeyboardEvent('keydown', { key: ' ' });
        Object.defineProperty(event, 'target', { value: input });
        window.dispatchEvent(event);
      });

      expect(onPlayPause).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('ignores events from textarea elements', () => {
      const onPlayPause = vi.fn();
      renderHook(() =>
        usePlaybackKeyboard({
          ...defaultOptions,
          callbacks: { ...defaultOptions.callbacks, onPlayPause },
        })
      );

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      act(() => {
        const event = new KeyboardEvent('keydown', { key: ' ' });
        Object.defineProperty(event, 'target', { value: textarea });
        window.dispatchEvent(event);
      });

      expect(onPlayPause).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });
  });

  describe('triggerAction', () => {
    it('triggers onPlayPause action', () => {
      const onPlayPause = vi.fn();
      const { result } = renderHook(() =>
        usePlaybackKeyboard({
          ...defaultOptions,
          callbacks: { ...defaultOptions.callbacks, onPlayPause },
        })
      );

      act(() => {
        result.current.triggerAction('onPlayPause');
      });

      expect(onPlayPause).toHaveBeenCalledTimes(1);
    });

    it('triggers onStop action', () => {
      const onStop = vi.fn();
      const { result } = renderHook(() =>
        usePlaybackKeyboard({
          ...defaultOptions,
          callbacks: { ...defaultOptions.callbacks, onStop },
        })
      );

      act(() => {
        result.current.triggerAction('onStop');
      });

      expect(onStop).toHaveBeenCalledTimes(1);
    });
  });

  describe('getShortcut', () => {
    it('returns correct shortcut for playPause', () => {
      const { result } = renderHook(() => usePlaybackKeyboard(defaultOptions));

      expect(result.current.getShortcut('playPause')).toBe(' ');
    });

    it('returns correct shortcut for stop', () => {
      const { result } = renderHook(() => usePlaybackKeyboard(defaultOptions));

      expect(result.current.getShortcut('stop')).toBe('Escape');
    });
  });

  describe('DEFAULT_SHORTCUTS', () => {
    it('has all expected shortcuts', () => {
      expect(DEFAULT_SHORTCUTS.playPause).toBe(' ');
      expect(DEFAULT_SHORTCUTS.stop).toBe('Escape');
      expect(DEFAULT_SHORTCUTS.tempoUp).toBe('+');
      expect(DEFAULT_SHORTCUTS.tempoDown).toBe('-');
      expect(DEFAULT_SHORTCUTS.seekForward).toBe('ArrowRight');
      expect(DEFAULT_SHORTCUTS.seekBackward).toBe('ArrowLeft');
      expect(DEFAULT_SHORTCUTS.toggleLoop).toBe('l');
      expect(DEFAULT_SHORTCUTS.jumpToStart).toBe('Home');
      expect(DEFAULT_SHORTCUTS.jumpToEnd).toBe('End');
    });
  });

  describe('custom shortcuts', () => {
    it('uses custom shortcut in addition to defaults', () => {
      const onPlayPause = vi.fn();
      renderHook(() =>
        usePlaybackKeyboard({
          ...defaultOptions,
          shortcuts: { playPause: 'p' },
          callbacks: { ...defaultOptions.callbacks, onPlayPause },
        })
      );

      // Custom shortcut should work
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'p' });
        window.dispatchEvent(event);
      });

      expect(onPlayPause).toHaveBeenCalledTimes(1);
    });

    it('default shortcuts still work with custom overrides', () => {
      const onPlayPause = vi.fn();
      renderHook(() =>
        usePlaybackKeyboard({
          ...defaultOptions,
          shortcuts: { playPause: 'p' },
          callbacks: { ...defaultOptions.callbacks, onPlayPause },
        })
      );

      // Default Space shortcut still works as fallback
      act(() => {
        const event = new KeyboardEvent('keydown', { key: ' ' });
        window.dispatchEvent(event);
      });

      expect(onPlayPause).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup', () => {
    it('removes event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => usePlaybackKeyboard(defaultOptions));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });
});
