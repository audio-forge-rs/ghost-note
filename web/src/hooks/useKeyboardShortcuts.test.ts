/**
 * Tests for useKeyboardShortcuts Hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useKeyboardShortcuts,
  SHORTCUT_DEFINITIONS,
  getShortcutForAction,
  getShortcutsByCategory,
  type ShortcutCallbacks,
} from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    // Clear any existing event listeners
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const createKeyboardEvent = (
    key: string,
    options: Partial<KeyboardEventInit> = {}
  ): KeyboardEvent => {
    return new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...options,
    });
  };

  const dispatchKeydown = (
    key: string,
    options: Partial<KeyboardEventInit> = {}
  ): void => {
    const event = createKeyboardEvent(key, options);
    document.dispatchEvent(event);
  };

  describe('space key - play/pause', () => {
    it('calls onPlayPause when Space is pressed', () => {
      const onPlayPause = vi.fn();
      const callbacks: ShortcutCallbacks = { onPlayPause };

      renderHook(() => useKeyboardShortcuts(callbacks));

      act(() => {
        dispatchKeydown(' ');
      });

      expect(onPlayPause).toHaveBeenCalledTimes(1);
    });

    it('does not call onPlayPause when Space is pressed with modifiers', () => {
      const onPlayPause = vi.fn();
      const callbacks: ShortcutCallbacks = { onPlayPause };

      renderHook(() => useKeyboardShortcuts(callbacks));

      act(() => {
        dispatchKeydown(' ', { metaKey: true });
      });

      expect(onPlayPause).not.toHaveBeenCalled();
    });
  });

  describe('Escape key - stop', () => {
    it('calls onStop when Escape is pressed', () => {
      const onStop = vi.fn();
      const callbacks: ShortcutCallbacks = { onStop };

      renderHook(() => useKeyboardShortcuts(callbacks));

      act(() => {
        dispatchKeydown('Escape');
      });

      expect(onStop).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cmd+Enter - generate melody', () => {
    it('calls onGenerateMelody when Cmd+Enter is pressed', () => {
      const onGenerateMelody = vi.fn();
      const callbacks: ShortcutCallbacks = { onGenerateMelody };

      renderHook(() => useKeyboardShortcuts(callbacks));

      act(() => {
        dispatchKeydown('Enter', { metaKey: true });
      });

      expect(onGenerateMelody).toHaveBeenCalledTimes(1);
    });

    it('does not call onGenerateMelody when Enter is pressed without Cmd', () => {
      const onGenerateMelody = vi.fn();
      const callbacks: ShortcutCallbacks = { onGenerateMelody };

      renderHook(() => useKeyboardShortcuts(callbacks));

      act(() => {
        dispatchKeydown('Enter');
      });

      expect(onGenerateMelody).not.toHaveBeenCalled();
    });
  });

  describe('Cmd+Z - undo', () => {
    it('calls onUndo when Cmd+Z is pressed', () => {
      const onUndo = vi.fn();
      const callbacks: ShortcutCallbacks = { onUndo };

      renderHook(() => useKeyboardShortcuts(callbacks));

      act(() => {
        dispatchKeydown('z', { metaKey: true });
      });

      expect(onUndo).toHaveBeenCalledTimes(1);
    });

    it('is case-insensitive for letter keys', () => {
      const onUndo = vi.fn();
      const callbacks: ShortcutCallbacks = { onUndo };

      renderHook(() => useKeyboardShortcuts(callbacks));

      act(() => {
        dispatchKeydown('Z', { metaKey: true });
      });

      expect(onUndo).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cmd+Shift+Z - redo', () => {
    it('calls onRedo when Cmd+Shift+Z is pressed', () => {
      const onRedo = vi.fn();
      const callbacks: ShortcutCallbacks = { onRedo };

      renderHook(() => useKeyboardShortcuts(callbacks));

      act(() => {
        dispatchKeydown('z', { metaKey: true, shiftKey: true });
      });

      expect(onRedo).toHaveBeenCalledTimes(1);
    });

    it('does not call onUndo when Shift is held', () => {
      const onUndo = vi.fn();
      const onRedo = vi.fn();
      const callbacks: ShortcutCallbacks = { onUndo, onRedo };

      renderHook(() => useKeyboardShortcuts(callbacks));

      act(() => {
        dispatchKeydown('z', { metaKey: true, shiftKey: true });
      });

      expect(onUndo).not.toHaveBeenCalled();
      expect(onRedo).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cmd+S - save', () => {
    it('calls onSave when Cmd+S is pressed', () => {
      const onSave = vi.fn();
      const callbacks: ShortcutCallbacks = { onSave };

      renderHook(() => useKeyboardShortcuts(callbacks));

      act(() => {
        dispatchKeydown('s', { metaKey: true });
      });

      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('R key - toggle recording', () => {
    it('calls onToggleRecording when R is pressed', () => {
      const onToggleRecording = vi.fn();
      const callbacks: ShortcutCallbacks = { onToggleRecording };

      renderHook(() => useKeyboardShortcuts(callbacks));

      act(() => {
        dispatchKeydown('r');
      });

      expect(onToggleRecording).toHaveBeenCalledTimes(1);
    });

    it('does not call onToggleRecording when R is pressed with Cmd', () => {
      const onToggleRecording = vi.fn();
      const callbacks: ShortcutCallbacks = { onToggleRecording };

      renderHook(() => useKeyboardShortcuts(callbacks));

      act(() => {
        dispatchKeydown('r', { metaKey: true });
      });

      expect(onToggleRecording).not.toHaveBeenCalled();
    });
  });

  describe('Tab navigation', () => {
    it('calls onNavigateNext when Tab is pressed', () => {
      const onNavigateNext = vi.fn();
      const callbacks: ShortcutCallbacks = { onNavigateNext };

      renderHook(() => useKeyboardShortcuts(callbacks));

      act(() => {
        dispatchKeydown('Tab');
      });

      expect(onNavigateNext).toHaveBeenCalledTimes(1);
    });

    it('calls onNavigatePrev when Shift+Tab is pressed', () => {
      const onNavigatePrev = vi.fn();
      const callbacks: ShortcutCallbacks = { onNavigatePrev };

      renderHook(() => useKeyboardShortcuts(callbacks));

      act(() => {
        dispatchKeydown('Tab', { shiftKey: true });
      });

      expect(onNavigatePrev).toHaveBeenCalledTimes(1);
    });
  });

  describe('? key - show help', () => {
    it('calls onShowHelp when ? is pressed', () => {
      const onShowHelp = vi.fn();
      const callbacks: ShortcutCallbacks = { onShowHelp };

      renderHook(() => useKeyboardShortcuts(callbacks));

      act(() => {
        dispatchKeydown('?');
      });

      expect(onShowHelp).toHaveBeenCalledTimes(1);
    });
  });

  describe('enabled option', () => {
    it('does not call callbacks when disabled', () => {
      const onPlayPause = vi.fn();
      const callbacks: ShortcutCallbacks = { onPlayPause };

      renderHook(() =>
        useKeyboardShortcuts(callbacks, { enabled: false })
      );

      act(() => {
        dispatchKeydown(' ');
      });

      expect(onPlayPause).not.toHaveBeenCalled();
    });

    it('calls callbacks when enabled', () => {
      const onPlayPause = vi.fn();
      const callbacks: ShortcutCallbacks = { onPlayPause };

      renderHook(() =>
        useKeyboardShortcuts(callbacks, { enabled: true })
      );

      act(() => {
        dispatchKeydown(' ');
      });

      expect(onPlayPause).toHaveBeenCalledTimes(1);
    });
  });

  describe('text input handling', () => {
    it('ignores shortcuts when text input is focused', () => {
      const onPlayPause = vi.fn();
      const callbacks: ShortcutCallbacks = { onPlayPause };

      // Create and focus a text input
      const input = document.createElement('input');
      input.type = 'text';
      document.body.appendChild(input);
      input.focus();

      renderHook(() =>
        useKeyboardShortcuts(callbacks, { disableInTextInput: true })
      );

      act(() => {
        dispatchKeydown(' ');
      });

      expect(onPlayPause).not.toHaveBeenCalled();

      // Cleanup
      input.blur();
      document.body.removeChild(input);
    });

    it('ignores shortcuts when textarea is focused', () => {
      const onPlayPause = vi.fn();
      const callbacks: ShortcutCallbacks = { onPlayPause };

      // Create and focus a textarea
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();

      renderHook(() =>
        useKeyboardShortcuts(callbacks, { disableInTextInput: true })
      );

      act(() => {
        dispatchKeydown(' ');
      });

      expect(onPlayPause).not.toHaveBeenCalled();

      // Cleanup
      textarea.blur();
      document.body.removeChild(textarea);
    });

    it('allows Escape even when text input is focused', () => {
      const onStop = vi.fn();
      const callbacks: ShortcutCallbacks = { onStop };

      // Create and focus a text input
      const input = document.createElement('input');
      input.type = 'text';
      document.body.appendChild(input);
      input.focus();

      renderHook(() =>
        useKeyboardShortcuts(callbacks, { disableInTextInput: true })
      );

      act(() => {
        dispatchKeydown('Escape');
      });

      expect(onStop).toHaveBeenCalledTimes(1);

      // Cleanup
      input.blur();
      document.body.removeChild(input);
    });

    it('allows Cmd+S even when text input is focused', () => {
      const onSave = vi.fn();
      const callbacks: ShortcutCallbacks = { onSave };

      // Create and focus a text input
      const input = document.createElement('input');
      input.type = 'text';
      document.body.appendChild(input);
      input.focus();

      renderHook(() =>
        useKeyboardShortcuts(callbacks, { disableInTextInput: true })
      );

      act(() => {
        dispatchKeydown('s', { metaKey: true });
      });

      expect(onSave).toHaveBeenCalledTimes(1);

      // Cleanup
      input.blur();
      document.body.removeChild(input);
    });

    it('allows ? even when text input is focused', () => {
      const onShowHelp = vi.fn();
      const callbacks: ShortcutCallbacks = { onShowHelp };

      // Create and focus a text input
      const input = document.createElement('input');
      input.type = 'text';
      document.body.appendChild(input);
      input.focus();

      renderHook(() =>
        useKeyboardShortcuts(callbacks, { disableInTextInput: true })
      );

      act(() => {
        dispatchKeydown('?');
      });

      expect(onShowHelp).toHaveBeenCalledTimes(1);

      // Cleanup
      input.blur();
      document.body.removeChild(input);
    });

    it('respects shortcuts when disableInTextInput is false', () => {
      const onPlayPause = vi.fn();
      const callbacks: ShortcutCallbacks = { onPlayPause };

      // Create and focus a text input
      const input = document.createElement('input');
      input.type = 'text';
      document.body.appendChild(input);
      input.focus();

      renderHook(() =>
        useKeyboardShortcuts(callbacks, { disableInTextInput: false })
      );

      act(() => {
        dispatchKeydown(' ');
      });

      expect(onPlayPause).toHaveBeenCalledTimes(1);

      // Cleanup
      input.blur();
      document.body.removeChild(input);
    });
  });

  describe('event prevention', () => {
    it('prevents default when shortcut is handled', () => {
      const onPlayPause = vi.fn();
      const callbacks: ShortcutCallbacks = { onPlayPause };

      renderHook(() => useKeyboardShortcuts(callbacks));

      const event = createKeyboardEvent(' ');
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      act(() => {
        document.dispatchEvent(event);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('does not prevent default when no callback is provided', () => {
      const callbacks: ShortcutCallbacks = {};

      renderHook(() => useKeyboardShortcuts(callbacks));

      const event = createKeyboardEvent(' ');
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      act(() => {
        document.dispatchEvent(event);
      });

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('callback updates', () => {
    it('uses the latest callback when called', () => {
      const onPlayPause1 = vi.fn();
      const onPlayPause2 = vi.fn();

      const { rerender } = renderHook(
        ({ callbacks }) => useKeyboardShortcuts(callbacks),
        {
          initialProps: { callbacks: { onPlayPause: onPlayPause1 } },
        }
      );

      // Update the callback
      rerender({ callbacks: { onPlayPause: onPlayPause2 } });

      act(() => {
        dispatchKeydown(' ');
      });

      expect(onPlayPause1).not.toHaveBeenCalled();
      expect(onPlayPause2).toHaveBeenCalledTimes(1);
    });
  });
});

describe('getShortcutForAction', () => {
  it('returns the shortcut for a valid action', () => {
    const shortcut = getShortcutForAction('playPause');
    expect(shortcut).toBeDefined();
    expect(shortcut?.key).toBe(' ');
  });

  it('returns undefined for an invalid action', () => {
    // @ts-expect-error - Testing invalid action
    const shortcut = getShortcutForAction('invalidAction');
    expect(shortcut).toBeUndefined();
  });
});

describe('getShortcutsByCategory', () => {
  it('returns shortcuts organized by category', () => {
    const categories = getShortcutsByCategory();

    expect(categories).toHaveProperty('Playback');
    expect(categories).toHaveProperty('Creation');
    expect(categories).toHaveProperty('Editing');
    expect(categories).toHaveProperty('Navigation');
  });

  it('includes playPause and stop in Playback category', () => {
    const categories = getShortcutsByCategory();
    const playbackActions = categories.Playback.map((s) => s.action);

    expect(playbackActions).toContain('playPause');
    expect(playbackActions).toContain('stop');
  });

  it('includes generateMelody and toggleRecording in Creation category', () => {
    const categories = getShortcutsByCategory();
    const creationActions = categories.Creation.map((s) => s.action);

    expect(creationActions).toContain('generateMelody');
    expect(creationActions).toContain('toggleRecording');
  });

  it('includes undo, redo, and save in Editing category', () => {
    const categories = getShortcutsByCategory();
    const editingActions = categories.Editing.map((s) => s.action);

    expect(editingActions).toContain('undo');
    expect(editingActions).toContain('redo');
    expect(editingActions).toContain('save');
  });

  it('includes navigation shortcuts in Navigation category', () => {
    const categories = getShortcutsByCategory();
    const navigationActions = categories.Navigation.map((s) => s.action);

    expect(navigationActions).toContain('navigateNext');
    expect(navigationActions).toContain('navigatePrev');
    expect(navigationActions).toContain('showHelp');
  });
});

describe('SHORTCUT_DEFINITIONS', () => {
  it('contains all expected shortcuts', () => {
    const actions = SHORTCUT_DEFINITIONS.map((s) => s.action);

    expect(actions).toContain('playPause');
    expect(actions).toContain('stop');
    expect(actions).toContain('generateMelody');
    expect(actions).toContain('undo');
    expect(actions).toContain('redo');
    expect(actions).toContain('save');
    expect(actions).toContain('toggleRecording');
    expect(actions).toContain('navigateNext');
    expect(actions).toContain('navigatePrev');
    expect(actions).toContain('showHelp');
  });

  it('has descriptions for all shortcuts', () => {
    for (const shortcut of SHORTCUT_DEFINITIONS) {
      expect(shortcut.description).toBeTruthy();
    }
  });

  it('has key labels for all shortcuts', () => {
    for (const shortcut of SHORTCUT_DEFINITIONS) {
      expect(shortcut.keyLabel).toBeTruthy();
    }
  });
});
