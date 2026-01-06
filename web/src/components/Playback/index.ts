/**
 * Playback Components
 *
 * Comprehensive playback controls for melody playback including:
 * - Play/Pause/Stop controls
 * - Tempo adjustment
 * - Key transposition
 * - Loop selection
 * - Progress bar with seek
 * - Keyboard shortcuts
 *
 * @module components/Playback
 */

// Main components
export {
  PlaybackControls,
  type PlaybackControlsProps,
  type PlaybackState,
} from './PlaybackControls';

export { TempoSlider, type TempoSliderProps } from './TempoSlider';
export { type TempoPreset, DEFAULT_TEMPO_PRESETS } from './tempoSliderConstants';

export { TransposeControl, type TransposeControlProps } from './TransposeControl';
export { type KeyInfo, KEYS } from './transposeConstants';

export {
  LoopSelector,
  type LoopSelectorProps,
  type LoopRegion,
  type MeasureInfo,
} from './LoopSelector';

export {
  PlaybackProgressBar,
  type PlaybackProgressBarProps,
} from './PlaybackProgressBar';

export {
  PlaybackContainer,
  type PlaybackContainerProps,
  type PlaybackLayout,
} from './PlaybackContainer';

// Hooks
export {
  usePlaybackKeyboard,
  type UsePlaybackKeyboardOptions,
  type UsePlaybackKeyboardResult,
  type KeyboardShortcuts,
  type KeyboardCallbacks,
  DEFAULT_SHORTCUTS,
} from './usePlaybackKeyboard';
