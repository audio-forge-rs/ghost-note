/**
 * useKeyboardShortcuts Hook
 *
 * Provides global keyboard shortcut handling for the Ghost Note application.
 * Implements shortcuts for playback, recording, melody generation, and navigation.
 *
 * @module hooks/useKeyboardShortcuts
 */

import { useEffect, useCallback, useRef } from 'react';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[useKeyboardShortcuts] ${message}`, ...args);
  }
};

/**
 * Shortcut action identifiers
 */
export type ShortcutAction =
  | 'playPause'
  | 'stop'
  | 'generateMelody'
  | 'undo'
  | 'redo'
  | 'save'
  | 'toggleRecording'
  | 'navigateNext'
  | 'navigatePrev'
  | 'showHelp';

/**
 * Definition of a keyboard shortcut
 */
export interface ShortcutDefinition {
  /** Unique action identifier */
  action: ShortcutAction;
  /** The key code (e.g., 'Space', 'Escape', 'Enter') */
  key: string;
  /** Whether Cmd/Ctrl is required */
  metaKey?: boolean;
  /** Whether Shift is required */
  shiftKey?: boolean;
  /** Whether Alt is required */
  altKey?: boolean;
  /** Human-readable description */
  description: string;
  /** Human-readable key label for display */
  keyLabel: string;
}

/**
 * Callbacks for shortcut actions
 */
export interface ShortcutCallbacks {
  onPlayPause?: () => void;
  onStop?: () => void;
  onGenerateMelody?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onToggleRecording?: () => void;
  onNavigateNext?: () => void;
  onNavigatePrev?: () => void;
  onShowHelp?: () => void;
}

/**
 * Options for keyboard shortcut behavior
 */
export interface KeyboardShortcutsOptions {
  /** Whether shortcuts are enabled (default: true) */
  enabled?: boolean;
  /** Whether to disable shortcuts when in text input (default: true) */
  disableInTextInput?: boolean;
}

/**
 * All available keyboard shortcuts with their definitions
 */
export const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  {
    action: 'playPause',
    key: ' ',
    description: 'Play/Pause melody playback',
    keyLabel: 'Space',
  },
  {
    action: 'stop',
    key: 'Escape',
    description: 'Stop playback',
    keyLabel: 'Esc',
  },
  {
    action: 'generateMelody',
    key: 'Enter',
    metaKey: true,
    description: 'Generate melody',
    keyLabel: '⌘+Enter',
  },
  {
    action: 'undo',
    key: 'z',
    metaKey: true,
    description: 'Undo last change',
    keyLabel: '⌘+Z',
  },
  {
    action: 'redo',
    key: 'z',
    metaKey: true,
    shiftKey: true,
    description: 'Redo last change',
    keyLabel: '⌘+Shift+Z',
  },
  {
    action: 'save',
    key: 's',
    metaKey: true,
    description: 'Save/Export',
    keyLabel: '⌘+S',
  },
  {
    action: 'toggleRecording',
    key: 'r',
    description: 'Start/Stop recording',
    keyLabel: 'R',
  },
  {
    action: 'navigateNext',
    key: 'Tab',
    description: 'Navigate to next section',
    keyLabel: 'Tab',
  },
  {
    action: 'navigatePrev',
    key: 'Tab',
    shiftKey: true,
    description: 'Navigate to previous section',
    keyLabel: 'Shift+Tab',
  },
  {
    action: 'showHelp',
    key: '?',
    description: 'Show keyboard shortcuts',
    keyLabel: '?',
  },
];

/**
 * Check if the current focus is on a text input element
 */
function isTextInputFocused(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const tagName = activeElement.tagName.toLowerCase();

  // Check if it's a text input field
  if (tagName === 'input') {
    const inputType = (activeElement as HTMLInputElement).type.toLowerCase();
    const textTypes = [
      'text',
      'password',
      'email',
      'number',
      'search',
      'tel',
      'url',
    ];
    return textTypes.includes(inputType);
  }

  // Check for textarea or contenteditable
  if (tagName === 'textarea') return true;
  if ((activeElement as HTMLElement).isContentEditable) return true;

  return false;
}

/**
 * Check if a keyboard event matches a shortcut definition
 */
function matchesShortcut(
  event: KeyboardEvent,
  shortcut: ShortcutDefinition
): boolean {
  // Check key (case-insensitive for letters)
  const eventKey = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  const shortcutKey = shortcut.key.length === 1 ? shortcut.key.toLowerCase() : shortcut.key;

  if (eventKey !== shortcutKey) {
    return false;
  }

  // Check modifier keys
  // Support both metaKey (Mac) and ctrlKey (Windows/Linux) for command shortcuts
  // This allows shortcuts to work cross-platform
  const hasCommandModifier = event.metaKey || event.ctrlKey;

  if (shortcut.metaKey && !hasCommandModifier) return false;
  if (!shortcut.metaKey && hasCommandModifier) return false;

  if (shortcut.shiftKey && !event.shiftKey) return false;
  if (!shortcut.shiftKey && event.shiftKey && shortcut.key !== '?') return false;

  if (shortcut.altKey && !event.altKey) return false;
  if (!shortcut.altKey && event.altKey) return false;

  return true;
}

/**
 * Get the shortcut definition for an action
 */
export function getShortcutForAction(action: ShortcutAction): ShortcutDefinition | undefined {
  return SHORTCUT_DEFINITIONS.find((s) => s.action === action);
}

/**
 * Get a grouped list of shortcuts for display
 */
export function getShortcutsByCategory(): Record<string, ShortcutDefinition[]> {
  return {
    Playback: SHORTCUT_DEFINITIONS.filter((s) =>
      ['playPause', 'stop'].includes(s.action)
    ),
    Creation: SHORTCUT_DEFINITIONS.filter((s) =>
      ['generateMelody', 'toggleRecording'].includes(s.action)
    ),
    Editing: SHORTCUT_DEFINITIONS.filter((s) =>
      ['undo', 'redo', 'save'].includes(s.action)
    ),
    Navigation: SHORTCUT_DEFINITIONS.filter((s) =>
      ['navigateNext', 'navigatePrev', 'showHelp'].includes(s.action)
    ),
  };
}

/**
 * Hook for handling global keyboard shortcuts.
 *
 * Provides keyboard shortcut handling with the following features:
 * - Automatic disabling when focused on text inputs
 * - Cross-platform modifier key support (Cmd on Mac, Ctrl on Windows)
 * - Configurable enable/disable state
 * - Prevents default browser behavior for handled shortcuts
 *
 * @param callbacks - Callback functions for each shortcut action
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   onPlayPause: () => togglePlayback(),
 *   onStop: () => stopPlayback(),
 *   onShowHelp: () => setShowHelpDialog(true),
 * });
 * ```
 */
export function useKeyboardShortcuts(
  callbacks: ShortcutCallbacks,
  options: KeyboardShortcutsOptions = {}
): void {
  const { enabled = true, disableInTextInput = true } = options;

  // Store callbacks in ref to avoid re-adding listeners on every callback change
  const callbacksRef = useRef(callbacks);

  // Update the ref in an effect to comply with React rules
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      // Check if shortcuts are enabled
      if (!enabled) {
        log('Shortcuts disabled, ignoring keydown');
        return;
      }

      // Check if focused on text input
      if (disableInTextInput && isTextInputFocused()) {
        log('Text input focused, ignoring shortcut');
        // Exception: still allow Escape, Cmd+S, and ? even in text inputs
        const isAllowedInInput =
          event.key === 'Escape' ||
          (event.key === 's' && (event.metaKey || event.ctrlKey)) ||
          event.key === '?';
        if (!isAllowedInInput) {
          return;
        }
      }

      log('KeyDown event:', {
        key: event.key,
        metaKey: event.metaKey,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
      });

      // Find matching shortcut
      for (const shortcut of SHORTCUT_DEFINITIONS) {
        if (matchesShortcut(event, shortcut)) {
          log('Matched shortcut:', shortcut.action);

          // Get the callback for this action
          const cb = callbacksRef.current;
          let handled = false;

          switch (shortcut.action) {
            case 'playPause':
              if (cb.onPlayPause) {
                cb.onPlayPause();
                handled = true;
              }
              break;
            case 'stop':
              if (cb.onStop) {
                cb.onStop();
                handled = true;
              }
              break;
            case 'generateMelody':
              if (cb.onGenerateMelody) {
                cb.onGenerateMelody();
                handled = true;
              }
              break;
            case 'undo':
              if (cb.onUndo) {
                cb.onUndo();
                handled = true;
              }
              break;
            case 'redo':
              if (cb.onRedo) {
                cb.onRedo();
                handled = true;
              }
              break;
            case 'save':
              if (cb.onSave) {
                cb.onSave();
                handled = true;
              }
              break;
            case 'toggleRecording':
              if (cb.onToggleRecording) {
                cb.onToggleRecording();
                handled = true;
              }
              break;
            case 'navigateNext':
              if (cb.onNavigateNext) {
                cb.onNavigateNext();
                handled = true;
              }
              break;
            case 'navigatePrev':
              if (cb.onNavigatePrev) {
                cb.onNavigatePrev();
                handled = true;
              }
              break;
            case 'showHelp':
              if (cb.onShowHelp) {
                cb.onShowHelp();
                handled = true;
              }
              break;
          }

          if (handled) {
            // Prevent default browser behavior (e.g., space scrolling, Cmd+S saving)
            event.preventDefault();
            event.stopPropagation();
            log('Shortcut handled, default prevented');
          }

          // Only match one shortcut per keypress
          return;
        }
      }
    },
    [enabled, disableInTextInput]
  );

  useEffect(() => {
    if (!enabled) {
      log('Shortcuts disabled, not attaching listener');
      return;
    }

    log('Attaching keyboard shortcut listener');
    document.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      log('Detaching keyboard shortcut listener');
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [enabled, handleKeyDown]);
}

export default useKeyboardShortcuts;
