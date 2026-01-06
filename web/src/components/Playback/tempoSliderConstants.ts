/**
 * Tempo Slider Constants
 *
 * Constants and types for tempo slider presets.
 *
 * @module components/Playback/tempoSliderConstants
 */

/**
 * Tempo preset configuration
 */
export interface TempoPreset {
  /** Label for the preset button */
  label: string;
  /** BPM value */
  value: number;
}

/**
 * Default tempo presets
 */
export const DEFAULT_TEMPO_PRESETS: TempoPreset[] = [
  { label: 'Slow', value: 60 },
  { label: 'Medium', value: 100 },
  { label: 'Fast', value: 140 },
  { label: 'Very Fast', value: 180 },
];
