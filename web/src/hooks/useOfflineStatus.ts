/**
 * Offline Status Hook
 *
 * Detects network state, manages service worker registration,
 * and provides offline/online status throughout the app.
 *
 * @module hooks/useOfflineStatus
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initServiceWorker,
  updateServiceWorker,
  isServiceWorkerSupported,
} from '@/lib/serviceWorker';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[useOfflineStatus] ${message}`, ...args);
  }
};

/**
 * Offline status state
 */
export interface OfflineStatus {
  /** Whether the device is currently online */
  isOnline: boolean;
  /** Whether the app is ready for offline use */
  isOfflineReady: boolean;
  /** Whether an app update is available */
  needsUpdate: boolean;
  /** Whether service worker is registered */
  isServiceWorkerActive: boolean;
  /** Error message if service worker registration failed */
  serviceWorkerError: string | null;
}

/**
 * Offline status actions
 */
export interface OfflineStatusActions {
  /** Trigger app update (reload with new service worker) */
  updateApp: () => Promise<void>;
  /** Dismiss the update notification */
  dismissUpdate: () => void;
  /** Check current online status manually */
  checkOnlineStatus: () => boolean;
}

/**
 * Return type for useOfflineStatus hook
 */
export type OfflineStatusReturn = OfflineStatus & OfflineStatusActions;

/**
 * Hook to track offline status and manage service worker
 *
 * @returns Offline status and actions
 *
 * @example
 * ```tsx
 * function App() {
 *   const { isOnline, isOfflineReady, needsUpdate, updateApp } = useOfflineStatus();
 *
 *   if (!isOnline) {
 *     return <OfflineBanner />;
 *   }
 *
 *   if (needsUpdate) {
 *     return <UpdatePrompt onUpdate={updateApp} />;
 *   }
 *
 *   return <MainApp />;
 * }
 * ```
 */
export function useOfflineStatus(): OfflineStatusReturn {
  // Track online/offline state
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    // Default to online in SSR/test environments
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });

  // Service worker state
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [isServiceWorkerActive, setIsServiceWorkerActive] = useState(false);
  const [serviceWorkerError, setServiceWorkerError] = useState<string | null>(null);

  // Track if component is mounted to avoid state updates after unmount
  const isMounted = useRef(true);

  /**
   * Safely update state only if component is mounted
   */
  const safeSetState = useCallback(
    <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
      (value: T) => {
        if (isMounted.current) {
          setter(value);
        }
      },
    []
  );

  /**
   * Handle online event
   */
  const handleOnline = useCallback(() => {
    log('Network status: online');
    safeSetState(setIsOnline)(true);
  }, [safeSetState]);

  /**
   * Handle offline event
   */
  const handleOffline = useCallback(() => {
    log('Network status: offline');
    safeSetState(setIsOnline)(false);
  }, [safeSetState]);

  /**
   * Update app by installing new service worker and reloading
   */
  const updateApp = useCallback(async () => {
    log('User requested app update');
    try {
      await updateServiceWorker(true);
    } catch (error) {
      log('Failed to update app:', error);
    }
  }, []);

  /**
   * Dismiss update notification
   */
  const dismissUpdate = useCallback(() => {
    log('User dismissed update notification');
    safeSetState(setNeedsUpdate)(false);
  }, [safeSetState]);

  /**
   * Check current online status
   */
  const checkOnlineStatus = useCallback(() => {
    if (typeof navigator === 'undefined') return true;
    const online = navigator.onLine;
    safeSetState(setIsOnline)(online);
    return online;
  }, [safeSetState]);

  // Set up online/offline event listeners
  useEffect(() => {
    log('Setting up online/offline event listeners');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    checkOnlineStatus();

    return () => {
      log('Cleaning up online/offline event listeners');
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline, checkOnlineStatus]);

  // Initialize service worker
  useEffect(() => {
    isMounted.current = true;

    // Only register service worker if supported
    if (!isServiceWorkerSupported()) {
      log('Service workers not supported in this browser');
      return;
    }

    log('Initializing service worker registration');

    const cleanup = initServiceWorker({
      onRegistered: () => {
        log('Service worker registered successfully');
        safeSetState(setIsServiceWorkerActive)(true);
      },
      onOfflineReady: () => {
        log('App is ready for offline use');
        safeSetState(setIsOfflineReady)(true);
      },
      onNeedRefresh: () => {
        log('New app version available');
        safeSetState(setNeedsUpdate)(true);
      },
      onRegisterError: (error) => {
        log('Service worker registration failed:', error.message);
        safeSetState(setServiceWorkerError)(error.message);
      },
    });

    return () => {
      log('Cleaning up service worker registration');
      isMounted.current = false;
      cleanup();
    };
  }, [safeSetState]);

  return {
    // Status
    isOnline,
    isOfflineReady,
    needsUpdate,
    isServiceWorkerActive,
    serviceWorkerError,
    // Actions
    updateApp,
    dismissUpdate,
    checkOnlineStatus,
  };
}

/**
 * Options for useNetworkStatus hook
 */
export interface NetworkStatusOptions {
  /**
   * Callback when going online
   */
  onOnline?: () => void;
  /**
   * Callback when going offline
   */
  onOffline?: () => void;
  /**
   * How often to poll for network status (ms)
   * Set to 0 to disable polling
   * @default 0
   */
  pollingInterval?: number;
}

/**
 * Simplified hook for network status only (without service worker management)
 *
 * Use this when you only need to track online/offline status without
 * service worker functionality.
 *
 * @param options - Configuration options
 * @returns Whether the device is online
 *
 * @example
 * ```tsx
 * function NetworkIndicator() {
 *   const isOnline = useNetworkStatus({
 *     onOnline: () => console.log('Back online!'),
 *     onOffline: () => console.log('Gone offline!'),
 *   });
 *
 *   return <span>{isOnline ? 'Online' : 'Offline'}</span>;
 * }
 * ```
 */
export function useNetworkStatus(options: NetworkStatusOptions = {}): boolean {
  const { onOnline, onOffline, pollingInterval = 0 } = options;

  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });

  // Track previous online state for callbacks
  const prevOnlineRef = useRef(isOnline);

  useEffect(() => {
    const handleOnline = () => {
      log('Network: online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      log('Network: offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Optional polling
    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (pollingInterval > 0) {
      intervalId = setInterval(() => {
        const currentStatus = navigator.onLine;
        if (currentStatus !== prevOnlineRef.current) {
          setIsOnline(currentStatus);
        }
      }, pollingInterval);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [pollingInterval]);

  // Call callbacks when status changes
  useEffect(() => {
    if (isOnline !== prevOnlineRef.current) {
      if (isOnline) {
        onOnline?.();
      } else {
        onOffline?.();
      }
      prevOnlineRef.current = isOnline;
    }
  }, [isOnline, onOnline, onOffline]);

  return isOnline;
}
