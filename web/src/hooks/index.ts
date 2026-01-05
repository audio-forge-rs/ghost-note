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

export {
  useAnnouncer,
  cleanupLiveRegions,
  type AnnouncementPriority,
  type AnnounceOptions,
  type AnnouncerReturn,
} from './useAnnouncer';

export {
  useFocusTrap,
  type FocusTrapOptions,
  type FocusTrapReturn,
} from './useFocusTrap';

export {
  useAnalytics,
  usePageView,
  useFeatureTracker,
  useErrorTracker,
  type UseAnalyticsOptions,
  type UseAnalyticsReturn,
} from './useAnalytics';
