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
  type MelodyParametersPanelProps,
} from './MelodyParametersPanel';

// Constants and types from separate files
export { DEFAULT_PARAMETERS, type MelodyParameters } from './melodyParametersConstants';
export { KEYS, type KeyInfo } from './keyConstants';
export { VOCAL_RANGE_PRESETS, type NotePosition, type VocalRangePreset } from './rangeConstants';
export { DEFAULT_TEMPO_PRESETS, type TempoPreset } from './tempoConstants';

// Individual components
export {
  KeySelect,
  type KeySelectProps,
} from './KeySelect';

export {
  ModeToggle,
  type ModeToggleProps,
} from './ModeToggle';

export {
  TempoInput,
  type TempoInputProps,
} from './TempoInput';

export {
  RangeSelector,
  type RangeSelectorProps,
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
