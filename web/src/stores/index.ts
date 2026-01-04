/**
 * Ghost Note - Store Exports
 *
 * Central export point for all Zustand stores and their selectors.
 *
 * @module stores
 */

// Types
export type {
  // Lyric types
  LyricChange,
  LyricVersion,
  // Recording types
  RecordingState,
  RecordingTake,
  // UI types
  Theme,
  ModalType,
  PanelId,
  PanelVisibility,
  // Store state types
  PoemState,
  PoemActions,
  PoemStore,
  AnalysisStage,
  AnalysisState,
  AnalysisActions,
  AnalysisStore,
  PlaybackState,
  MelodyState,
  MelodyActions,
  MelodyStore,
  RecordingStoreState,
  RecordingActions,
  RecordingStore,
  UIState,
  UIActions,
  UIStore,
} from './types';

// Poem Store
export { usePoemStore } from './usePoemStore';
export {
  selectCurrentLyrics,
  selectCurrentVersion,
  selectHasVersions,
  selectVersionCount,
  selectIsViewingOriginal,
  selectHasPoem,
  selectWordCount,
  selectLineCount,
} from './usePoemStore';

// Analysis Store
export { useAnalysisStore } from './useAnalysisStore';
export {
  selectHasAnalysis,
  selectIsAnalyzing,
  selectStageName,
  selectOverallSingability,
  selectMeter,
  selectRhymeScheme,
  selectSentiment,
  selectProblemCount,
  selectIsVersionAnalyzed,
} from './useAnalysisStore';

// Melody Store
export { useMelodyStore } from './useMelodyStore';
export {
  selectHasMelody,
  selectIsPlaying,
  selectIsPaused,
  selectIsStopped,
  selectIsGenerating,
  selectPlaybackProgress,
  selectFormattedCurrentTime,
  selectFormattedDuration,
  selectVolumePercent,
  selectHasError as selectMelodyHasError,
} from './useMelodyStore';

// Recording Store
export { useRecordingStore } from './useRecordingStore';
export {
  selectIsRecording,
  selectIsPaused as selectRecordingIsPaused,
  selectIsIdle,
  selectIsPreparing,
  selectSelectedTake,
  selectTakeCount,
  selectHasTakes,
  selectFormattedDuration as selectRecordingFormattedDuration,
  selectInputLevelPercent,
  selectHasPermission,
  selectTakesSortedByDate,
  selectHasError as selectRecordingHasError,
  selectTotalRecordedTime,
} from './useRecordingStore';

// UI Store
export { useUIStore } from './useUIStore';
export {
  selectIsModalOpen,
  selectIsSpecificModalOpen,
  selectIsPanelVisible,
  selectVisiblePanelCount,
  selectIsSidebarCollapsed,
  selectIsDarkMode,
  selectIsSystemTheme,
  selectHasNotification,
  selectNotificationType,
  selectHiddenPanels,
  selectVisiblePanels,
} from './useUIStore';

// Theme Store
export { useThemeStore } from './useThemeStore';
export type {
  Theme as ThemePreference,
  ResolvedTheme,
  ThemeState,
  ThemeActions,
  ThemeStore,
} from './useThemeStore';
export {
  selectIsDarkMode as selectThemeIsDarkMode,
  selectIsLightMode,
  selectIsSystemTheme as selectThemeIsSystemTheme,
  selectThemePreference,
  selectResolvedTheme,
  selectTransitionsEnabled,
  selectThemeLabel,
} from './useThemeStore';

// =============================================================================
// Utility Functions
// =============================================================================

// Import stores for utility functions
import { usePoemStore as poemStore } from './usePoemStore';
import { useAnalysisStore as analysisStore } from './useAnalysisStore';
import { useMelodyStore as melodyStore } from './useMelodyStore';
import { useRecordingStore as recordingStore } from './useRecordingStore';
import { useUIStore as uiStore } from './useUIStore';
import { useThemeStore as themeStore } from './useThemeStore';

/**
 * Reset all stores to their initial state
 * Useful for testing or when user logs out
 */
export function resetAllStores(): void {
  poemStore.getState().reset();
  analysisStore.getState().reset();
  melodyStore.getState().reset();
  recordingStore.getState().reset();
  uiStore.getState().reset();
  themeStore.getState().reset();

  console.log('[Stores] All stores reset');
}

/**
 * Clear all persisted data from localStorage
 */
export function clearPersistedData(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('ghost-note-poem-store');
    localStorage.removeItem('ghost-note-melody-store');
    localStorage.removeItem('ghost-note-recording-store');
    localStorage.removeItem('ghost-note-ui-store');
    localStorage.removeItem('ghost-note-theme-store');
    console.log('[Stores] All persisted data cleared');
  }
}
