/**
 * Offline Indicator Component
 *
 * Displays offline status banner and update prompts for the PWA.
 * Shows when the app is offline or when an update is available.
 *
 * @module components/Common/OfflineIndicator
 */

import { useState, type ReactElement, type ReactNode, useEffect, useRef } from 'react';
import { useOfflineStatus } from '@/hooks';
import './OfflineIndicator.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[OfflineIndicator] ${message}`, ...args);
  }
};

// =============================================================================
// Types
// =============================================================================

/**
 * Props for OfflineIndicator component
 */
export interface OfflineIndicatorProps {
  /** Position of the indicator */
  position?: 'top' | 'bottom';
  /** Whether to show the ready for offline notification */
  showOfflineReady?: boolean;
  /** Custom className for the container */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Props for UpdatePrompt component
 */
export interface UpdatePromptProps {
  /** Handler for update action */
  onUpdate: () => void;
  /** Handler for dismiss action */
  onDismiss: () => void;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Props for OfflineBanner component
 */
export interface OfflineBannerProps {
  /** Custom message */
  message?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Icons
// =============================================================================

const WifiOffIcon = (): ReactNode => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M1 1L23 23M16.72 11.06C18.14 11.51 19.41 12.25 20.47 13.18M5 12.55C6.73 11.55 8.69 10.97 10.76 10.84M10.91 5.08C15.49 4.41 20.24 5.52 24 8.29M8.53 16.11C9.63 15.42 10.88 15.01 12.21 15.01C13.91 15.01 15.45 15.65 16.65 16.71M12 20H12.01"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RefreshIcon = (): ReactNode => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M1 4V10H7M23 20V14H17M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckCircleIcon = (): ReactNode => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CloseIcon = (): ReactNode => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Banner shown when the app is offline
 */
export function OfflineBanner({
  message = "You're offline. Some features may be limited.",
  testId = 'offline-banner',
}: OfflineBannerProps): ReactElement {
  log('Rendering offline banner');

  return (
    <div
      className="offline-indicator offline-indicator--offline"
      role="alert"
      aria-live="assertive"
      data-testid={testId}
    >
      <div className="offline-indicator__icon">
        <WifiOffIcon />
      </div>
      <span className="offline-indicator__message">{message}</span>
    </div>
  );
}

/**
 * Prompt shown when an update is available
 */
export function UpdatePrompt({
  onUpdate,
  onDismiss,
  testId = 'update-prompt',
}: UpdatePromptProps): ReactElement {
  log('Rendering update prompt');

  return (
    <div
      className="offline-indicator offline-indicator--update"
      role="alert"
      aria-live="polite"
      data-testid={testId}
    >
      <div className="offline-indicator__icon">
        <RefreshIcon />
      </div>
      <span className="offline-indicator__message">New version available!</span>
      <div className="offline-indicator__actions">
        <button
          type="button"
          className="offline-indicator__button offline-indicator__button--primary"
          onClick={onUpdate}
          data-testid={`${testId}-update-button`}
        >
          Update
        </button>
        <button
          type="button"
          className="offline-indicator__button offline-indicator__button--dismiss"
          onClick={onDismiss}
          aria-label="Dismiss update notification"
          data-testid={`${testId}-dismiss-button`}
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}

/**
 * Notification shown when app is ready for offline use
 */
export function OfflineReadyNotification({
  testId = 'offline-ready',
}: {
  testId?: string;
}): ReactElement {
  log('Rendering offline ready notification');

  return (
    <div
      className="offline-indicator offline-indicator--ready"
      role="status"
      aria-live="polite"
      data-testid={testId}
    >
      <div className="offline-indicator__icon">
        <CheckCircleIcon />
      </div>
      <span className="offline-indicator__message">App ready for offline use</span>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Main offline indicator component that manages offline status display.
 *
 * Features:
 * - Shows offline banner when network is unavailable
 * - Shows update prompt when new version is available
 * - Shows ready notification when app is cached for offline
 * - Accessible with proper ARIA attributes
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <>
 *       <OfflineIndicator position="top" />
 *       <MainContent />
 *     </>
 *   );
 * }
 * ```
 */
export function OfflineIndicator({
  position = 'top',
  showOfflineReady = true,
  className = '',
  testId = 'offline-indicator-container',
}: OfflineIndicatorProps): ReactElement | null {
  const {
    isOnline,
    isOfflineReady,
    needsUpdate,
    updateApp,
    dismissUpdate,
  } = useOfflineStatus();

  // Track whether to show offline ready notification (auto-dismiss after 5 seconds)
  const [showReadyState, setShowReadyState] = useState(false);
  const hasShownReady = useRef(false);

  useEffect(() => {
    if (isOfflineReady && showOfflineReady && !hasShownReady.current) {
      hasShownReady.current = true;
      log('Offline ready - will show and auto-dismiss notification');

      // Use setTimeout to avoid synchronous setState in effect
      const showTimerId = setTimeout(() => {
        setShowReadyState(true);
      }, 0);

      // Auto-dismiss after 5 seconds
      const hideTimerId = setTimeout(() => {
        setShowReadyState(false);
      }, 5000);

      return () => {
        clearTimeout(showTimerId);
        clearTimeout(hideTimerId);
      };
    }
  }, [isOfflineReady, showOfflineReady]);

  // Determine what to show
  const showOffline = !isOnline;
  const showUpdate = needsUpdate && isOnline;
  const showReady = showOfflineReady && isOfflineReady && !showOffline && !showUpdate && showReadyState;

  // Don't render if nothing to show
  if (!showOffline && !showUpdate && !showReady) {
    log('No indicator to show');
    return null;
  }

  log('Rendering indicator:', { showOffline, showUpdate, showReady });

  const containerClass = [
    'offline-indicator-container',
    `offline-indicator-container--${position}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClass} data-testid={testId}>
      {showOffline && <OfflineBanner />}
      {showUpdate && <UpdatePrompt onUpdate={updateApp} onDismiss={dismissUpdate} />}
      {showReady && <OfflineReadyNotification />}
    </div>
  );
}

export default OfflineIndicator;
