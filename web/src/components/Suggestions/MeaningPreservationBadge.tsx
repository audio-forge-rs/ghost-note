/**
 * MeaningPreservationBadge Component
 *
 * A visual indicator that shows how well a suggestion preserves
 * the original meaning of the text.
 *
 * @module components/Suggestions/MeaningPreservationBadge
 */

import type { ReactElement } from 'react';
import type { MeaningPreservation } from '../../lib/claude/types';
import './MeaningPreservationBadge.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[MeaningPreservationBadge] ${message}`, ...args);
  }
};

/**
 * Props for the MeaningPreservationBadge component
 */
export interface MeaningPreservationBadgeProps {
  /** The meaning preservation level */
  preservation: MeaningPreservation;
  /** Whether to show the label text */
  showLabel?: boolean;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Additional CSS class name */
  className?: string;
  /** Data test ID for testing */
  testId?: string;
}

/**
 * Configuration for each preservation level
 */
interface PreservationConfig {
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
 * MeaningPreservationBadge component displays the meaning preservation level
 * of a suggestion with appropriate styling and accessibility.
 *
 * Features:
 * - Color-coded visual indicator (green/yellow/red)
 * - Optional text label
 * - Multiple size variants
 * - Accessible with ARIA attributes and tooltips
 *
 * @example
 * ```tsx
 * // Basic usage
 * <MeaningPreservationBadge preservation="yes" />
 *
 * // With label
 * <MeaningPreservationBadge preservation="partial" showLabel />
 *
 * // Different sizes
 * <MeaningPreservationBadge preservation="no" size="large" showLabel />
 * ```
 */
export function MeaningPreservationBadge({
  preservation,
  showLabel = false,
  size = 'medium',
  className = '',
  testId = 'meaning-preservation-badge',
}: MeaningPreservationBadgeProps): ReactElement {
  const config = PRESERVATION_CONFIG[preservation];

  log('Rendering badge:', { preservation, showLabel, size });

  const containerClass = [
    'meaning-preservation-badge',
    `meaning-preservation-badge--${preservation}`,
    `meaning-preservation-badge--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <span
      className={containerClass}
      data-testid={testId}
      title={config.description}
      aria-label={config.description}
      role="status"
    >
      <span className="meaning-preservation-badge__icon" aria-hidden="true">
        {config.icon}
      </span>
      {showLabel && (
        <span className="meaning-preservation-badge__label">
          {size === 'small' ? config.shortLabel : config.label}
        </span>
      )}
    </span>
  );
}

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

export default MeaningPreservationBadge;
