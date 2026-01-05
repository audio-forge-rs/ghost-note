/**
 * Custom React Hooks
 *
 * Exports all custom hooks for the Ghost Note application.
 *
 * @module hooks
 */

export {
  useSwipeGesture,
  type SwipeDirection,
  type SwipeGestureOptions,
  type SwipeEvent,
  type SwipeGestureCallbacks,
} from './useSwipeGesture';

export {
  useKeyboardShortcuts,
  getShortcutForAction,
  getShortcutsByCategory,
  SHORTCUT_DEFINITIONS,
  type ShortcutAction,
  type ShortcutDefinition,
  type ShortcutCallbacks,
  type KeyboardShortcutsOptions,
} from './useKeyboardShortcuts';
