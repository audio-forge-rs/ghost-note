/**
 * Service Worker Registration and Management
 *
 * Handles service worker registration, updates, and lifecycle events.
 *
 * @module lib/serviceWorker
 */

import { registerSW } from 'virtual:pwa-register';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[ServiceWorker] ${message}`, ...args);
  }
};

/**
 * Service worker registration state
 */
export interface ServiceWorkerState {
  /** Whether the service worker is registered */
  isRegistered: boolean;
  /** Whether an update is available */
  needsUpdate: boolean;
  /** Whether the app is ready for offline use */
  isOfflineReady: boolean;
  /** Registration error if any */
  error: string | null;
}

/**
 * Callback functions for service worker events
 */
export interface ServiceWorkerCallbacks {
  /** Called when service worker is registered and offline ready */
  onOfflineReady?: () => void;
  /** Called when an update is available */
  onNeedRefresh?: () => void;
  /** Called when registration fails */
  onRegisterError?: (error: Error) => void;
  /** Called when service worker is registered */
  onRegistered?: () => void;
}

let updateSW: ((reloadPage?: boolean) => Promise<void>) | null = null;
let callbacks: ServiceWorkerCallbacks = {};
let registered = false;

/**
 * Initialize service worker registration
 *
 * @param options - Callback options for service worker events
 * @returns Cleanup function
 */
export function initServiceWorker(options: ServiceWorkerCallbacks = {}): () => void {
  callbacks = options;

  log('Initializing service worker registration');

  // Register service worker with vite-plugin-pwa
  updateSW = registerSW({
    immediate: true,
    onRegisteredSW(swUrl, registration) {
      log('Service worker registered:', swUrl);
      registered = true;
      callbacks.onRegistered?.();

      // Set up periodic update checks (every hour)
      if (registration) {
        setInterval(() => {
          log('Checking for service worker updates...');
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
    onOfflineReady() {
      log('App is ready for offline use');
      callbacks.onOfflineReady?.();
    },
    onNeedRefresh() {
      log('New content available, update required');
      callbacks.onNeedRefresh?.();
    },
    onRegisterError(error) {
      log('Service worker registration failed:', error);
      callbacks.onRegisterError?.(error);
    },
  });

  // Cleanup function
  return () => {
    log('Cleaning up service worker callbacks');
    callbacks = {};
  };
}

/**
 * Update the service worker and reload the page
 *
 * @param reload - Whether to reload the page after update (default: true)
 */
export async function updateServiceWorker(reload = true): Promise<void> {
  if (!updateSW) {
    log('Service worker not initialized, cannot update');
    return;
  }

  log('Updating service worker, reload:', reload);
  await updateSW(reload);
}

/**
 * Check if service worker is registered
 */
export function isServiceWorkerRegistered(): boolean {
  return registered;
}

/**
 * Check if service workers are supported
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Get the current service worker registration
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  if (!isServiceWorkerSupported()) {
    return undefined;
  }

  try {
    return await navigator.serviceWorker.ready;
  } catch (error) {
    log('Failed to get service worker registration:', error);
    return undefined;
  }
}

/**
 * Manually skip waiting on the new service worker
 * Use this when user confirms update
 */
export async function skipWaiting(): Promise<void> {
  const registration = await getServiceWorkerRegistration();
  if (registration?.waiting) {
    log('Sending skip waiting message to service worker');
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}
