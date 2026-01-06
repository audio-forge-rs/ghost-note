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
import { getPreservationConfig } from './meaningPreservationUtils';
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
  const config = getPreservationConfig(preservation);

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

export default MeaningPreservationBadge;
