/**
 * usePlaybackKeyboard Hook
 *
 * Provides keyboard shortcuts for playback control.
 * Handles key events at the window level for global shortcut support.
 *
 * @module components/Playback/usePlaybackKeyboard
 */

import { useEffect, useCallback, useRef, useMemo } from 'react';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[usePlaybackKeyboard] ${message}`, ...args);
  }
};

/**
 * Playback state for the hook
 */
export type PlaybackState = 'stopped' | 'playing' | 'paused' | 'loading';

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcuts {
  /** Play/pause toggle (default: Space) */
  playPause?: string;
  /** Stop playback (default: Escape) */
  stop?: string;
  /** Increase tempo (default: +) */
  tempoUp?: string;
  /** Decrease tempo (default: -) */
  tempoDown?: string;
  /** Seek forward (default: ArrowRight) */
  seekForward?: string;
  /** Seek backward (default: ArrowLeft) */
  seekBackward?: string;
  /** Toggle loop (default: L) */
  toggleLoop?: string;
  /** Jump to start (default: Home) */
  jumpToStart?: string;
  /** Jump to end (default: End) */
  jumpToEnd?: string;
}

/**
 * Default keyboard shortcuts
 */
export const DEFAULT_SHORTCUTS: Required<KeyboardShortcuts> = {
  playPause: ' ', // Space
  stop: 'Escape',
  tempoUp: '+',
  tempoDown: '-',
  seekForward: 'ArrowRight',
  seekBackward: 'ArrowLeft',
  toggleLoop: 'l',
  jumpToStart: 'Home',
  jumpToEnd: 'End',
};

/**
 * Callback handlers for keyboard events
 */
export interface KeyboardCallbacks {
  /** Called when play/pause is triggered */
  onPlayPause?: () => void;
  /** Called when stop is triggered */
  onStop?: () => void;
  /** Called when tempo should increase */
  onTempoUp?: () => void;
  /** Called when tempo should decrease */
  onTempoDown?: () => void;
  /** Called when seeking forward, with optional seek amount in seconds */
  onSeekForward?: (seconds?: number) => void;
  /** Called when seeking backward, with optional seek amount in seconds */
  onSeekBackward?: (seconds?: number) => void;
  /** Called when loop toggle is triggered */
  onToggleLoop?: () => void;
  /** Called when jumping to start */
  onJumpToStart?: () => void;
  /** Called when jumping to end */
  onJumpToEnd?: () => void;
}

/**
 * Options for usePlaybackKeyboard hook
 */
export interface UsePlaybackKeyboardOptions {
  /** Whether keyboard shortcuts are enabled (default: true) */
  enabled?: boolean;
  /** Current playback state */
  playbackState?: PlaybackState;
  /** Custom keyboard shortcuts */
  shortcuts?: KeyboardShortcuts;
  /** Callback handlers */
  callbacks: KeyboardCallbacks;
  /** Amount to seek in seconds (default: 5) */
  seekAmount?: number;
  /** Whether to prevent default behavior for handled keys (default: true) */
  preventDefault?: boolean;
  /** Elements to ignore when handling shortcuts (input, textarea, etc.) */
  ignoreElements?: string[];
}

/**
 * Return value from usePlaybackKeyboard hook
 */
export interface UsePlaybackKeyboardResult {
  /** Whether keyboard shortcuts are currently active */
  isActive: boolean;
  /** Programmatically trigger a shortcut action */
  triggerAction: (action: keyof KeyboardCallbacks) => void;
  /** Get the current shortcut for an action */
  getShortcut: (action: keyof KeyboardShortcuts) => string;
  /** All active shortcuts */
  shortcuts: Required<KeyboardShortcuts>;
}

/**
 * Normalize a keyboard key for comparison
 */
function normalizeKey(key: string): string {
  // Handle special cases
  if (key === ' ') return 'Space';
  if (key === 'Escape' || key === 'Esc') return 'Escape';
  return key;
}

/**
 * Check if the event target should be ignored
 */
function shouldIgnoreTarget(
  target: EventTarget | null,
  ignoreElements: string[]
): boolean {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  if (ignoreElements.includes(tagName)) return true;

  // Also check if content is editable
  if (target.isContentEditable) return true;

  return false;
}

/**
 * usePlaybackKeyboard provides keyboard shortcut support for playback controls.
 *
 * Features:
 * - Space: Play/Pause toggle
 * - Escape: Stop playback
 * - +/-: Tempo adjustment
 * - Arrow keys: Seek forward/backward
 * - L: Toggle loop
 * - Home/End: Jump to start/end
 *
 * @example
 * ```tsx
 * const playback = usePlaybackKeyboard({
 *   playbackState: 'playing',
 *   callbacks: {
 *     onPlayPause: () => togglePlayback(),
 *     onStop: () => stopPlayback(),
 *     onTempoUp: () => adjustTempo(10),
 *     onTempoDown: () => adjustTempo(-10),
 *   },
 * });
 * ```
 */
export function usePlaybackKeyboard({
  enabled = true,
  // playbackState is available for future use (e.g., disabling shortcuts when loading)
  playbackState: _playbackState = 'stopped',
  shortcuts: customShortcuts = {},
  callbacks,
  seekAmount = 5,
  preventDefault = true,
  ignoreElements = ['input', 'textarea', 'select'],
}: UsePlaybackKeyboardOptions): UsePlaybackKeyboardResult {
  // Suppress unused variable warning - available for future enhancements
  void _playbackState;

  // Merge custom shortcuts with defaults (memoized to prevent recreating on each render)
  const shortcuts = useMemo<Required<KeyboardShortcuts>>(
    () => ({
      ...DEFAULT_SHORTCUTS,
      ...customShortcuts,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(customShortcuts)]
  );

  // Store callbacks in ref to avoid effect dependencies (update in effect)
  const callbacksRef = useRef(callbacks);
  const optionsRef = useRef({ seekAmount, preventDefault, ignoreElements });

  // Update refs in effect to avoid writing during render
  useEffect(() => {
    callbacksRef.current = callbacks;
    optionsRef.current = { seekAmount, preventDefault, ignoreElements };
  });

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { seekAmount, preventDefault, ignoreElements } = optionsRef.current;
      const handlers = callbacksRef.current;

      // Check if we should ignore this event
      if (shouldIgnoreTarget(event.target, ignoreElements)) {
        log('Ignoring key event in', (event.target as HTMLElement).tagName);
        return;
      }

      const key = event.key;
      const normalizedKey = normalizeKey(key);
      let handled = false;

      log('Key pressed:', key, 'normalized:', normalizedKey);

      // Check each shortcut
      if (key === shortcuts.playPause || normalizedKey === 'Space') {
        handlers.onPlayPause?.();
        handled = true;
      } else if (normalizedKey === shortcuts.stop || key === 'Escape') {
        handlers.onStop?.();
        handled = true;
      } else if (key === shortcuts.tempoUp || key === '+' || (key === '=' && event.shiftKey)) {
        handlers.onTempoUp?.();
        handled = true;
      } else if (key === shortcuts.tempoDown || key === '-' || key === '_') {
        handlers.onTempoDown?.();
        handled = true;
      } else if (key === shortcuts.seekForward || key === 'ArrowRight') {
        const amount = event.shiftKey ? seekAmount * 2 : seekAmount;
        handlers.onSeekForward?.(amount);
        handled = true;
      } else if (key === shortcuts.seekBackward || key === 'ArrowLeft') {
        const amount = event.shiftKey ? seekAmount * 2 : seekAmount;
        handlers.onSeekBackward?.(amount);
        handled = true;
      } else if (key.toLowerCase() === shortcuts.toggleLoop.toLowerCase()) {
        handlers.onToggleLoop?.();
        handled = true;
      } else if (key === shortcuts.jumpToStart || key === 'Home') {
        handlers.onJumpToStart?.();
        handled = true;
      } else if (key === shortcuts.jumpToEnd || key === 'End') {
        handlers.onJumpToEnd?.();
        handled = true;
      }

      if (handled) {
        log('Shortcut handled:', key);
        if (preventDefault) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
    },
    [shortcuts]
  );

  // Add/remove event listener based on enabled state
  useEffect(() => {
    if (!enabled) {
      log('Keyboard shortcuts disabled');
      return;
    }

    log('Registering keyboard shortcuts');
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      log('Unregistering keyboard shortcuts');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  // Trigger an action programmatically
  const triggerAction = useCallback((action: keyof KeyboardCallbacks) => {
    const handlers = callbacksRef.current;
    log('Triggering action:', action);

    switch (action) {
      case 'onPlayPause':
        handlers.onPlayPause?.();
        break;
      case 'onStop':
        handlers.onStop?.();
        break;
      case 'onTempoUp':
        handlers.onTempoUp?.();
        break;
      case 'onTempoDown':
        handlers.onTempoDown?.();
        break;
      case 'onSeekForward':
        handlers.onSeekForward?.(optionsRef.current.seekAmount);
        break;
      case 'onSeekBackward':
        handlers.onSeekBackward?.(optionsRef.current.seekAmount);
        break;
      case 'onToggleLoop':
        handlers.onToggleLoop?.();
        break;
      case 'onJumpToStart':
        handlers.onJumpToStart?.();
        break;
      case 'onJumpToEnd':
        handlers.onJumpToEnd?.();
        break;
    }
  }, []);

  // Get the shortcut key for an action
  const getShortcut = useCallback(
    (action: keyof KeyboardShortcuts): string => {
      return shortcuts[action] ?? '';
    },
    [shortcuts]
  );

  return {
    isActive: enabled,
    triggerAction,
    getShortcut,
    shortcuts,
  };
}

export default usePlaybackKeyboard;
