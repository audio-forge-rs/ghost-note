/**
 * Tempo Constants
 *
 * Constants and types for tempo presets.
 *
 * @module components/Melody/tempoConstants
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
  { label: 'Moderate', value: 90 },
  { label: 'Medium', value: 120 },
  { label: 'Fast', value: 150 },
];
