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
export type {
  RecordingTimerProps,
  TimerFormat,
  TimerSize,
} from './RecordingTimer';
export { formatDuration } from './RecordingTimer';

export { CountdownOverlay } from './CountdownOverlay';
export type { CountdownOverlayProps } from './CountdownOverlay';

export { TakeItem } from './TakeItem';
export type { TakeItemProps } from './TakeItem';

export { TakesList } from './TakesList';
export type {
  TakesListProps,
  TakesSortOrder,
} from './TakesList';
