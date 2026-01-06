/**
 * Meaning Preservation Utilities
 *
 * Utility functions for meaning preservation configuration.
 *
 * @module components/Suggestions/meaningPreservationUtils
 */

import type { MeaningPreservation } from '../../lib/claude/types';

/**
 * Configuration for each preservation level
 */
export interface PreservationConfig {
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
}

const PRESERVATION_CONFIG: Record<MeaningPreservation, PreservationConfig> = {
  yes: {
    label: 'Preserves Meaning',
    shortLabel: 'Preserves',
    description: 'This suggestion maintains the original meaning of the text',
    icon: '✓',
  },
  partial: {
    label: 'Partial Preservation',
    shortLabel: 'Partial',
    description: 'This suggestion partially preserves the original meaning',
    icon: '~',
  },
  no: {
    label: 'Changes Meaning',
    shortLabel: 'Changes',
    description: 'This suggestion significantly changes the original meaning',
    icon: '!',
  },
};

/**
 * Get the preservation level configuration
 */
export function getPreservationConfig(preservation: MeaningPreservation): PreservationConfig {
  return PRESERVATION_CONFIG[preservation];
}

/**
 * Get all preservation levels in order of preference (best to worst)
 */
export function getPreservationLevels(): MeaningPreservation[] {
  return ['yes', 'partial', 'no'];
}
