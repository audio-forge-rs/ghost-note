/**
 * useAnalytics Hook
 *
 * Provides easy access to analytics tracking from React components.
 * Handles initialization, page view tracking, and feature usage tracking.
 *
 * @module hooks/useAnalytics
 */

import { useCallback, useEffect, useRef } from 'react';
import { useAnalyticsStore } from '@/stores/useAnalyticsStore';
import type { FeatureName, PageName } from '@/lib/analytics';

// Logging helper
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[useAnalytics] ${message}`, ...args);
  }
};

/**
 * Options for useAnalytics hook
 */
export interface UseAnalyticsOptions {
  /** Current page name (for automatic page view tracking) */
  page?: PageName;
  /** Whether to track page view on mount */
  trackPageViewOnMount?: boolean;
}

/**
 * Return type for useAnalytics hook
 */
export interface UseAnalyticsReturn {
  /** Track a feature usage event */
  trackFeature: (feature: FeatureName, metadata?: Record<string, string | number | boolean>) => void;
  /** Track an error */
  trackError: (error: Error | string, options?: { component?: string; caught?: boolean; isReactError?: boolean }) => void;
  /** Track a performance metric */
  trackPerformance: (metric: string, value: number, rating?: 'good' | 'needs-improvement' | 'poor') => void;
  /** Track a page view manually */
  trackPageView: (page: PageName, previousPage?: PageName) => void;
  /** Whether analytics is active */
  isActive: boolean;
  /** Whether Do Not Track is enabled */
  doNotTrackEnabled: boolean;
}

/**
 * Hook for tracking analytics events from React components
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { trackFeature, isActive } = useAnalytics({ page: 'poem-input' });
 *
 *   const handleSubmit = () => {
 *     trackFeature('poem_input', { wordCount: 100 });
 *     // ... submit logic
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
  const { page, trackPageViewOnMount = true } = options;

  const previousPageRef = useRef<PageName | undefined>(undefined);
  const hasTrackedInitialPageView = useRef(false);

  // Get store state and actions
  const enabled = useAnalyticsStore((state) => state.enabled);
  const doNotTrackDetected = useAnalyticsStore((state) => state.doNotTrackDetected);
  const initialized = useAnalyticsStore((state) => state.initialized);
  const initialize = useAnalyticsStore((state) => state.initialize);
  const storeTrackPageView = useAnalyticsStore((state) => state.trackPageView);
  const storeTrackFeature = useAnalyticsStore((state) => state.trackFeature);
  const storeTrackError = useAnalyticsStore((state) => state.trackError);
  const storeTrackPerformance = useAnalyticsStore((state) => state.trackPerformance);

  const isActive = enabled && !doNotTrackDetected;

  // Initialize analytics on first use
  useEffect(() => {
    if (!initialized) {
      log('Initializing analytics');
      initialize();
    }
  }, [initialized, initialize]);

  // Track page view when page changes
  useEffect(() => {
    if (!trackPageViewOnMount || !page || !initialized) {
      return;
    }

    // Only track if page actually changed or this is first view
    if (page !== previousPageRef.current || !hasTrackedInitialPageView.current) {
      log('Tracking page view', { page, previousPage: previousPageRef.current });
      storeTrackPageView(page, previousPageRef.current);
      previousPageRef.current = page;
      hasTrackedInitialPageView.current = true;
    }
  }, [page, initialized, trackPageViewOnMount, storeTrackPageView]);

  // Memoized tracking functions
  const trackFeature = useCallback(
    (feature: FeatureName, metadata?: Record<string, string | number | boolean>) => {
      log('Tracking feature', { feature, metadata });
      storeTrackFeature(feature, metadata);
    },
    [storeTrackFeature]
  );

  const trackError = useCallback(
    (
      error: Error | string,
      errorOptions?: { component?: string; caught?: boolean; isReactError?: boolean }
    ) => {
      log('Tracking error', { error, options: errorOptions });
      storeTrackError(error, errorOptions);
    },
    [storeTrackError]
  );

  const trackPerformance = useCallback(
    (metric: string, value: number, rating?: 'good' | 'needs-improvement' | 'poor') => {
      log('Tracking performance', { metric, value, rating });
      storeTrackPerformance(metric, value, rating);
    },
    [storeTrackPerformance]
  );

  const trackPageView = useCallback(
    (pageName: PageName, previousPage?: PageName) => {
      log('Tracking page view (manual)', { page: pageName, previousPage });
      storeTrackPageView(pageName, previousPage);
    },
    [storeTrackPageView]
  );

  return {
    trackFeature,
    trackError,
    trackPerformance,
    trackPageView,
    isActive,
    doNotTrackEnabled: doNotTrackDetected,
  };
}

/**
 * Hook for tracking page views
 * Simplified version that just tracks page views on mount/change
 *
 * @example
 * ```tsx
 * function AnalysisPage() {
 *   usePageView('analysis');
 *   return <div>...</div>;
 * }
 * ```
 */
export function usePageView(page: PageName): void {
  useAnalytics({ page, trackPageViewOnMount: true });
}

/**
 * Hook for creating a feature tracker function
 * Returns a stable function that can be used to track feature usage
 *
 * @example
 * ```tsx
 * function MelodyControls() {
 *   const track = useFeatureTracker();
 *
 *   return (
 *     <button onClick={() => { play(); track('melody_play'); }}>
 *       Play
 *     </button>
 *   );
 * }
 * ```
 */
export function useFeatureTracker(): (
  feature: FeatureName,
  metadata?: Record<string, string | number | boolean>
) => void {
  const { trackFeature } = useAnalytics();
  return trackFeature;
}

/**
 * Hook for creating an error tracker function
 * Returns a stable function that can be used to track errors
 *
 * @example
 * ```tsx
 * function ApiComponent() {
 *   const trackError = useErrorTracker();
 *
 *   const fetchData = async () => {
 *     try {
 *       await api.getData();
 *     } catch (error) {
 *       trackError(error, { component: 'ApiComponent' });
 *     }
 *   };
 * }
 * ```
 */
export function useErrorTracker(): (
  error: Error | string,
  options?: { component?: string; caught?: boolean; isReactError?: boolean }
) => void {
  const { trackError } = useAnalytics();
  return trackError;
}
