/**
 * Skeleton Component
 *
 * Content placeholder components for loading states.
 * Provides animated skeleton loaders for different content types.
 *
 * @module components/Common/Skeleton
 */

import type { ReactElement, CSSProperties } from 'react';
import './Skeleton.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[Skeleton] ${message}`, ...args);
  }
};

/**
 * Skeleton variant types
 */
export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded';

/**
 * Skeleton animation types
 */
export type SkeletonAnimation = 'pulse' | 'wave' | 'none';

/**
 * Props for the Skeleton component
 */
export interface SkeletonProps {
  /** Shape variant */
  variant?: SkeletonVariant;
  /** Animation style */
  animation?: SkeletonAnimation;
  /** Width (number for px, string for other units) */
  width?: number | string;
  /** Height (number for px, string for other units) */
  height?: number | string;
  /** Number of text lines (only for variant="text") */
  lines?: number;
  /** Additional CSS class name */
  className?: string;
  /** Data test ID for testing */
  testId?: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
}

/**
 * Props for compound skeleton components
 */
export interface SkeletonTextProps {
  /** Number of lines to display */
  lines?: number;
  /** Animation style */
  animation?: SkeletonAnimation;
  /** Custom line widths (percentages) */
  lineWidths?: (number | string)[];
  /** Additional CSS class name */
  className?: string;
  /** Data test ID for testing */
  testId?: string;
}

export interface SkeletonAvatarProps {
  /** Size of the avatar */
  size?: number | string;
  /** Animation style */
  animation?: SkeletonAnimation;
  /** Additional CSS class name */
  className?: string;
  /** Data test ID for testing */
  testId?: string;
}

export interface SkeletonCardProps {
  /** Whether to show avatar placeholder */
  showAvatar?: boolean;
  /** Number of text lines */
  lines?: number;
  /** Animation style */
  animation?: SkeletonAnimation;
  /** Additional CSS class name */
  className?: string;
  /** Data test ID for testing */
  testId?: string;
}

/**
 * Base Skeleton component for creating loading placeholders.
 *
 * Features:
 * - Multiple shape variants (text, circular, rectangular, rounded)
 * - Animated pulse or wave effects
 * - Customizable dimensions
 * - Accessible with ARIA attributes
 *
 * @example
 * ```tsx
 * // Text skeleton
 * <Skeleton variant="text" width="80%" />
 *
 * // Avatar skeleton
 * <Skeleton variant="circular" width={48} height={48} />
 *
 * // Card image skeleton
 * <Skeleton variant="rectangular" width="100%" height={200} />
 * ```
 */
export function Skeleton({
  variant = 'text',
  animation = 'pulse',
  width,
  height,
  className = '',
  testId = 'skeleton',
  ariaLabel = 'Loading...',
}: SkeletonProps): ReactElement {
  log('Rendering skeleton:', { variant, animation, width, height });

  const containerClass = [
    'skeleton',
    `skeleton--${variant}`,
    animation !== 'none' ? `skeleton--${animation}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  const style: CSSProperties = {};

  if (width !== undefined) {
    style.width = typeof width === 'number' ? `${width}px` : width;
  }

  if (height !== undefined) {
    style.height = typeof height === 'number' ? `${height}px` : height;
  }

  return (
    <div
      className={containerClass}
      style={Object.keys(style).length > 0 ? style : undefined}
      data-testid={testId}
      role="status"
      aria-label={ariaLabel}
      aria-busy="true"
    >
      <span className="skeleton__sr-only">{ariaLabel}</span>
    </div>
  );
}

/**
 * SkeletonText component for multi-line text placeholders.
 */
export function SkeletonText({
  lines = 3,
  animation = 'pulse',
  lineWidths,
  className = '',
  testId = 'skeleton-text',
}: SkeletonTextProps): ReactElement {
  log('Rendering skeleton text:', { lines, animation });

  const defaultWidths = ['100%', '95%', '90%', '85%', '80%'];

  return (
    <div
      className={`skeleton-text ${className}`.trim()}
      data-testid={testId}
      role="status"
      aria-label={`Loading ${lines} lines of text`}
      aria-busy="true"
    >
      {Array.from({ length: lines }).map((_, index) => {
        const width = lineWidths?.[index] ?? defaultWidths[index % defaultWidths.length];
        return (
          <Skeleton
            key={index}
            variant="text"
            animation={animation}
            width={width}
            testId={`${testId}-line-${index}`}
            ariaLabel={`Line ${index + 1}`}
          />
        );
      })}
    </div>
  );
}

/**
 * SkeletonAvatar component for avatar/profile picture placeholders.
 */
export function SkeletonAvatar({
  size = 48,
  animation = 'pulse',
  className = '',
  testId = 'skeleton-avatar',
}: SkeletonAvatarProps): ReactElement {
  log('Rendering skeleton avatar:', { size, animation });

  return (
    <Skeleton
      variant="circular"
      animation={animation}
      width={size}
      height={size}
      className={className}
      testId={testId}
      ariaLabel="Loading avatar"
    />
  );
}

/**
 * SkeletonCard component for card/content block placeholders.
 */
export function SkeletonCard({
  showAvatar = false,
  lines = 3,
  animation = 'pulse',
  className = '',
  testId = 'skeleton-card',
}: SkeletonCardProps): ReactElement {
  log('Rendering skeleton card:', { showAvatar, lines, animation });

  return (
    <div
      className={`skeleton-card ${className}`.trim()}
      data-testid={testId}
      role="status"
      aria-label="Loading content"
      aria-busy="true"
    >
      {showAvatar && (
        <div className="skeleton-card__header">
          <SkeletonAvatar size={40} animation={animation} testId={`${testId}-avatar`} />
          <div className="skeleton-card__meta">
            <Skeleton variant="text" animation={animation} width="60%" testId={`${testId}-name`} ariaLabel="Loading name" />
            <Skeleton variant="text" animation={animation} width="40%" height={12} testId={`${testId}-subtitle`} ariaLabel="Loading subtitle" />
          </div>
        </div>
      )}
      <SkeletonText lines={lines} animation={animation} testId={`${testId}-text`} />
    </div>
  );
}

export default Skeleton;
