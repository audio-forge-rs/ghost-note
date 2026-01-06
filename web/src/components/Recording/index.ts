/**
 * Recording Components
 *
 * Components for microphone access, audio visualization, and recording controls.
 *
 * @module components/Recording
 */

export { MicrophoneSelect } from './MicrophoneSelect';
export type { MicrophoneSelectProps } from './MicrophoneSelect';

export { AudioLevelMeter } from './AudioLevelMeter';
export type {
  AudioLevelMeterProps,
  LevelMeterStyle,
  LevelMeterOrientation,
} from './AudioLevelMeter';

export { PermissionPrompt } from './PermissionPrompt';
export type {
  PermissionPromptProps,
  PermissionPromptVariant,
} from './PermissionPrompt';

export { RecordButton } from './RecordButton';
export type {
  RecordButtonProps,
  RecordButtonState,
  RecordButtonSize,
} from './RecordButton';

export { RecordingTimer } from './RecordingTimer';
export type { RecordingTimerProps, TimerSize } from './RecordingTimer';
export { formatDuration, type TimerFormat } from './timerUtils';

export { CountdownOverlay } from './CountdownOverlay';
export type { CountdownOverlayProps } from './CountdownOverlay';

export { TakeItem } from './TakeItem';
export type { TakeItemProps } from './TakeItem';

export { TakesList } from './TakesList';
export type {
  TakesListProps,
  TakesSortOrder,
} from './TakesList';

export { ExportButton } from './ExportButton';
export type {
  ExportButtonProps,
  ExportButtonSize,
} from './ExportButton';

export { ExportDialog } from './ExportDialog';
export type {
  ExportDialogProps,
  ExportDialogResult,
  ExportMode,
} from './ExportDialog';

export { GuideVolumeSlider } from './GuideVolumeSlider';
export type { GuideVolumeSliderProps } from './GuideVolumeSlider';

export { LyricsTeleprompter } from './LyricsTeleprompter';
export type { LyricsTeleprompterProps } from './LyricsTeleprompter';

export { ClickTrackToggle } from './ClickTrackToggle';
export type { ClickTrackToggleProps } from './ClickTrackToggle';

export { RecordingStudio } from './RecordingStudio';
export type { RecordingStudioProps } from './RecordingStudio';

export { WaveformDisplay } from './WaveformDisplay';
export type {
  WaveformDisplayProps,
  WaveformMode,
} from './WaveformDisplay';
