/**
 * LoadingOverlay Component
 *
 * A full-screen loading overlay that blocks user interaction
 * and displays a centered loading indicator.
 *
 * @module components/Common/LoadingOverlay
 */

import type { ReactElement } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import './LoadingOverlay.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[LoadingOverlay] ${message}`, ...args);
  }
};

/**
 * Props for the LoadingOverlay component
 */
export interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  isVisible: boolean;
  /** Loading message to display */
  message?: string;
  /** Whether the overlay covers the full viewport or just parent container */
  fullScreen?: boolean;
  /** Additional CSS class name */
  className?: string;
  /** Data test ID for testing */
  testId?: string;
  /** Whether the overlay should be transparent (no backdrop) */
  transparent?: boolean;
}

/**
 * LoadingOverlay component displays a full-screen or container-level loading state.
 *
 * Features:
 * - Full-screen or container-relative positioning
 * - Customizable loading message
 * - Blocks user interaction while visible
 * - Accessible with ARIA attributes
 * - Backdrop blur effect (optional)
 *
 * @example
 * ```tsx
 * // Full screen overlay
 * <LoadingOverlay isVisible={isLoading} message="Saving your work..." fullScreen />
 *
 * // Container overlay
 * <div className="relative">
 *   <Content />
 *   <LoadingOverlay isVisible={isLoading} />
 * </div>
 * ```
 */
export function LoadingOverlay({
  isVisible,
  message = 'Loading...',
  fullScreen = false,
  className = '',
  testId = 'loading-overlay',
  transparent = false,
}: LoadingOverlayProps): ReactElement | null {
  log('Rendering overlay:', { isVisible, message, fullScreen, transparent });

  if (!isVisible) {
    return null;
  }

  const containerClass = [
    'loading-overlay',
    fullScreen ? 'loading-overlay--fullscreen' : 'loading-overlay--container',
    transparent ? 'loading-overlay--transparent' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <div
      className={containerClass}
      data-testid={testId}
      role="dialog"
      aria-modal="true"
      aria-label={message}
      aria-busy="true"
    >
      <div className="loading-overlay__content">
        <LoadingSpinner size="large" label={message} showLabel testId="loading-overlay-spinner" />
      </div>
    </div>
  );
}

export default LoadingOverlay;
