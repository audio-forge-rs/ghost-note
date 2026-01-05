/**
 * useAnnouncer Hook
 *
 * Provides screen reader announcements via ARIA live regions.
 * Supports both polite and assertive announcements.
 *
 * @module hooks/useAnnouncer
 */

import { useCallback, useEffect, useRef } from 'react';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[useAnnouncer] ${message}`, ...args);
  }
};

/**
 * Announcement priority levels
 */
export type AnnouncementPriority = 'polite' | 'assertive';

/**
 * Options for announcements
 */
export interface AnnounceOptions {
  /** Priority of the announcement (default: 'polite') */
  priority?: AnnouncementPriority;
  /** Clear previous announcements before making new one (default: true) */
  clearPrevious?: boolean;
  /** Delay in ms before making the announcement (default: 0) */
  delay?: number;
}

/**
 * Return type for useAnnouncer hook
 */
export interface AnnouncerReturn {
  /** Make a screen reader announcement */
  announce: (message: string, options?: AnnounceOptions) => void;
  /** Clear any pending announcements */
  clearAnnouncements: () => void;
}

/**
 * Live region container element ID
 */
const LIVE_REGION_ID = 'ghost-note-live-region';
const ASSERTIVE_REGION_ID = 'ghost-note-assertive-region';

/**
 * Creates or gets the live region container for screen reader announcements.
 * Uses a singleton pattern to ensure only one container exists.
 */
function getLiveRegion(priority: AnnouncementPriority): HTMLElement {
  const id = priority === 'assertive' ? ASSERTIVE_REGION_ID : LIVE_REGION_ID;
  let region = document.getElementById(id);

  if (!region) {
    log('Creating live region:', priority);
    region = document.createElement('div');
    region.id = id;
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', 'true');
    region.setAttribute('aria-relevant', 'additions text');

    // Visually hidden but accessible to screen readers
    Object.assign(region.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0',
    });

    document.body.appendChild(region);
  }

  return region;
}

/**
 * Removes live region containers from the DOM
 */
function cleanupLiveRegions(): void {
  const politeRegion = document.getElementById(LIVE_REGION_ID);
  const assertiveRegion = document.getElementById(ASSERTIVE_REGION_ID);

  if (politeRegion) {
    politeRegion.remove();
    log('Removed polite live region');
  }
  if (assertiveRegion) {
    assertiveRegion.remove();
    log('Removed assertive live region');
  }
}

/**
 * useAnnouncer provides screen reader announcements via ARIA live regions.
 *
 * Features:
 * - Polite and assertive announcement modes
 * - Automatic cleanup of announcement queue
 * - Delay support for sequential announcements
 * - Singleton live region management
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { announce } = useAnnouncer();
 *
 *   const handleSave = () => {
 *     saveData();
 *     announce('Your changes have been saved');
 *   };
 *
 *   const handleError = () => {
 *     announce('An error occurred', { priority: 'assertive' });
 *   };
 *
 *   return <button onClick={handleSave}>Save</button>;
 * }
 * ```
 */
export function useAnnouncer(): AnnouncerReturn {
  const timeoutsRef = useRef<number[]>([]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const clearAnnouncements = useCallback(() => {
    log('Clearing announcements');
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];

    const politeRegion = document.getElementById(LIVE_REGION_ID);
    const assertiveRegion = document.getElementById(ASSERTIVE_REGION_ID);

    if (politeRegion) politeRegion.textContent = '';
    if (assertiveRegion) assertiveRegion.textContent = '';
  }, []);

  const announce = useCallback(
    (message: string, options: AnnounceOptions = {}) => {
      const {
        priority = 'polite',
        clearPrevious = true,
        delay = 0,
      } = options;

      log('Announcing:', { message, priority, delay });

      const makeAnnouncement = (): void => {
        const region = getLiveRegion(priority);

        if (clearPrevious) {
          // Clear the region first, then add the message
          // This ensures screen readers detect the change
          region.textContent = '';
        }

        // Use requestAnimationFrame to ensure the clear is processed
        requestAnimationFrame(() => {
          region.textContent = message;
          log('Announcement made:', message);
        });
      };

      if (delay > 0) {
        const timeoutId = window.setTimeout(makeAnnouncement, delay);
        timeoutsRef.current.push(timeoutId);
      } else {
        makeAnnouncement();
      }
    },
    []
  );

  return {
    announce,
    clearAnnouncements,
  };
}

/**
 * Cleanup utility for removing live regions from the DOM.
 * Useful for testing or cleanup scenarios.
 */
export { cleanupLiveRegions };

export default useAnnouncer;
