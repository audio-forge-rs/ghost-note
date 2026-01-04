/**
 * Recording Components
 *
 * Components for microphone access and audio visualization.
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
