/**
 * Melody Components
 *
 * Components for melody parameter adjustment and generation control.
 * Provides a comprehensive interface for customizing melody generation.
 *
 * @module components/Melody
 */

// Main container
export {
  MelodyParametersPanel,
  DEFAULT_PARAMETERS,
  type MelodyParametersPanelProps,
  type MelodyParameters,
} from './MelodyParametersPanel';

// Individual components
export {
  KeySelect,
  KEYS,
  type KeySelectProps,
  type KeyInfo,
} from './KeySelect';

export {
  ModeToggle,
  type ModeToggleProps,
} from './ModeToggle';

export {
  TempoInput,
  DEFAULT_TEMPO_PRESETS,
  type TempoInputProps,
  type TempoPreset,
} from './TempoInput';

export {
  RangeSelector,
  VOCAL_RANGE_PRESETS,
  type RangeSelectorProps,
  type NotePosition,
  type VocalRangePreset,
} from './RangeSelector';

export {
  StylePresetSelect,
  type StylePresetSelectProps,
  type StylePreset,
} from './StylePresetSelect';

export {
  RegenerateButton,
  type RegenerateButtonProps,
} from './RegenerateButton';
