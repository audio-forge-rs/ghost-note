/**
 * PermissionPrompt Component
 *
 * A UI component for requesting and displaying microphone permission status.
 * Provides clear messaging for different permission states and browsers.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  queryMicrophonePermission,
  requestMicrophoneAccess,
  stopMediaStream,
  isMicrophoneSupported,
  type MicrophonePermissionState,
} from '@/lib/audio/microphone';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[PermissionPrompt] ${message}`, ...args);
  }
};

/**
 * Display variant for the permission prompt
 */
export type PermissionPromptVariant = 'card' | 'inline' | 'minimal';

/**
 * Props for PermissionPrompt component
 */
export interface PermissionPromptProps {
  /** Callback when permission is granted */
  onPermissionGranted?: (stream: MediaStream) => void;
  /** Callback when permission is denied or fails */
  onPermissionDenied?: (error: string) => void;
  /** Callback when permission state changes */
  onPermissionChange?: (state: MicrophonePermissionState) => void;
  /** Whether to automatically request permission on mount */
  autoRequest?: boolean;
  /** Whether to keep the stream active after permission is granted */
  keepStreamActive?: boolean;
  /** Display variant */
  variant?: PermissionPromptVariant;
  /** Custom CSS class name */
  className?: string;
  /** Custom button text for the request button */
  buttonText?: string;
  /** Title for the prompt */
  title?: string;
  /** Description for the prompt */
  description?: string;
}

/**
 * Browser-specific instructions for enabling microphone access
 */
const BROWSER_INSTRUCTIONS: Record<string, string> = {
  chrome:
    'Click the lock icon in the address bar, then set Microphone to "Allow".',
  firefox:
    'Click the microphone icon in the address bar, then click "Allow".',
  safari:
    'Go to Safari > Settings > Websites > Microphone, then allow this site.',
  edge:
    'Click the lock icon in the address bar, then set Microphone to "Allow".',
  default:
    'Check your browser settings to allow microphone access for this site.',
};

/**
 * Detect the current browser
 */
function detectBrowser(): string {
  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes('edg')) return 'edge';
  if (ua.includes('chrome')) return 'chrome';
  if (ua.includes('firefox')) return 'firefox';
  if (ua.includes('safari')) return 'safari';

  return 'default';
}

/**
 * PermissionPrompt displays a UI for requesting microphone permission.
 *
 * Features:
 * - Clear permission state visualization
 * - Browser-specific instructions for denied permissions
 * - Automatic permission checking
 * - Loading state during permission request
 * - Error handling with user-friendly messages
 *
 * @example
 * ```tsx
 * <PermissionPrompt
 *   onPermissionGranted={(stream) => setStream(stream)}
 *   onPermissionDenied={(error) => setError(error)}
 *   variant="card"
 * />
 * ```
 */
export function PermissionPrompt({
  onPermissionGranted,
  onPermissionDenied,
  onPermissionChange,
  autoRequest = false,
  keepStreamActive = false,
  variant = 'card',
  className = '',
  buttonText = 'Enable Microphone',
  title = 'Microphone Access Required',
  description = 'To record your voice, we need access to your microphone.',
}: PermissionPromptProps): React.ReactElement | null {
  const [permissionState, setPermissionState] =
    useState<MicrophonePermissionState>('prompt');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasCheckedInitial, setHasCheckedInitial] = useState(false);

  // Check initial permission state
  useEffect(() => {
    const checkPermission = async () => {
      log('Checking initial permission state...');
      const state = await queryMicrophonePermission();
      log('Initial permission state:', state);
      setPermissionState(state);
      onPermissionChange?.(state);
      setHasCheckedInitial(true);

      // Auto-request if enabled and permission is prompt
      if (autoRequest && state === 'prompt') {
        log('Auto-requesting permission...');
        requestPermission();
      }
    };

    checkPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Request permission
  const requestPermission = useCallback(async () => {
    log('Requesting microphone permission...');
    setIsLoading(true);
    setErrorMessage(null);

    const result = await requestMicrophoneAccess();

    setIsLoading(false);
    setPermissionState(result.permissionState);
    onPermissionChange?.(result.permissionState);

    if (result.success && result.stream) {
      log('Permission granted');
      onPermissionGranted?.(result.stream);

      // Stop stream if we don't need to keep it active
      if (!keepStreamActive) {
        log('Stopping stream (keepStreamActive=false)');
        stopMediaStream(result.stream);
      }
    } else {
      log('Permission denied or failed:', result.error);
      setErrorMessage(result.error);
      onPermissionDenied?.(result.error || 'Permission denied');
    }
  }, [onPermissionGranted, onPermissionDenied, onPermissionChange, keepStreamActive]);

  // Get browser-specific instructions
  const getBrowserInstructions = (): string => {
    const browser = detectBrowser();
    return BROWSER_INSTRUCTIONS[browser] || BROWSER_INSTRUCTIONS.default;
  };

  // Don't render if not supported
  if (!isMicrophoneSupported()) {
    return (
      <div
        className={`permission-prompt permission-prompt--${variant} permission-prompt--unsupported ${className}`.trim()}
        data-testid="permission-prompt-unsupported"
        role="alert"
      >
        <div className="permission-prompt__content">
          <div className="permission-prompt__icon">
            <UnsupportedIcon />
          </div>
          <h3 className="permission-prompt__title">Browser Not Supported</h3>
          <p className="permission-prompt__description">
            Your browser does not support microphone access. Please use a modern
            browser like Chrome, Firefox, Safari, or Edge.
          </p>
        </div>
      </div>
    );
  }

  // Don't render if permission is already granted
  if (permissionState === 'granted' && hasCheckedInitial) {
    return null;
  }

  // Render denied state
  if (permissionState === 'denied') {
    return (
      <div
        className={`permission-prompt permission-prompt--${variant} permission-prompt--denied ${className}`.trim()}
        data-testid="permission-prompt-denied"
        role="alert"
      >
        <div className="permission-prompt__content">
          <div className="permission-prompt__icon permission-prompt__icon--error">
            <DeniedIcon />
          </div>
          <h3 className="permission-prompt__title">Microphone Access Denied</h3>
          <p className="permission-prompt__description">
            {errorMessage || 'Microphone access was denied.'}
          </p>
          <p className="permission-prompt__instructions">
            <strong>To enable access:</strong> {getBrowserInstructions()}
          </p>
          <button
            onClick={requestPermission}
            className="permission-prompt__button"
            disabled={isLoading}
            type="button"
          >
            {isLoading ? 'Checking...' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  // Render prompt/request state
  return (
    <div
      className={`permission-prompt permission-prompt--${variant} permission-prompt--prompt ${className}`.trim()}
      data-testid="permission-prompt"
      role="region"
      aria-label="Microphone permission request"
    >
      <div className="permission-prompt__content">
        <div className="permission-prompt__icon">
          <MicrophoneIcon />
        </div>
        <h3 className="permission-prompt__title">{title}</h3>
        <p className="permission-prompt__description">{description}</p>
        {errorMessage && (
          <p className="permission-prompt__error" role="alert">
            {errorMessage}
          </p>
        )}
        <button
          onClick={requestPermission}
          className="permission-prompt__button"
          disabled={isLoading}
          type="button"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <LoadingSpinner />
              <span>Requesting Access...</span>
            </>
          ) : (
            buttonText
          )}
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Icon Components
// =============================================================================

function MicrophoneIcon(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function DeniedIcon(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m4.9 4.9 14.2 14.2" />
    </svg>
  );
}

function UnsupportedIcon(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" x2="12" y1="9" y2="13" />
      <line x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
  );
}

function LoadingSpinner(): React.ReactElement {
  return (
    <svg
      className="permission-prompt__spinner"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export default PermissionPrompt;
