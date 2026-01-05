/**
 * Ghost Note - Analytics Store
 *
 * Manages analytics state and provides React integration for the
 * privacy-respecting analytics service.
 *
 * @module stores/useAnalyticsStore
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  analyticsService,
  type AnalyticsAggregate,
  type FeatureName,
  type PageName,
} from '@/lib/analytics';

// =============================================================================
// Types
// =============================================================================

export interface AnalyticsState {
  /** Whether analytics is enabled */
  enabled: boolean;
  /** Whether Do Not Track is detected in browser */
  doNotTrackDetected: boolean;
  /** Whether service has been initialized */
  initialized: boolean;
  /** Current aggregate data (for dashboard) */
  aggregate: AnalyticsAggregate | null;
  /** Last update timestamp */
  lastUpdated: number;
}

export interface AnalyticsActions {
  /** Initialize analytics service */
  initialize: () => void;
  /** Enable analytics tracking */
  enable: () => void;
  /** Disable analytics tracking */
  disable: () => void;
  /** Track a page view */
  trackPageView: (page: PageName, previousPage?: PageName) => void;
  /** Track feature usage */
  trackFeature: (feature: FeatureName, metadata?: Record<string, string | number | boolean>) => void;
  /** Track an error */
  trackError: (error: Error | string, options?: { component?: string; caught?: boolean; isReactError?: boolean }) => void;
  /** Track performance metric */
  trackPerformance: (metric: string, value: number, rating?: 'good' | 'needs-improvement' | 'poor') => void;
  /** Refresh aggregate data */
  refreshAggregate: () => void;
  /** Export analytics data */
  exportData: () => string;
  /** Clear all analytics data */
  clearData: () => void;
  /** Reset store to initial state */
  reset: () => void;
}

export type AnalyticsStore = AnalyticsState & AnalyticsActions;

// =============================================================================
// Initial State
// =============================================================================

const initialState: AnalyticsState = {
  enabled: true,
  doNotTrackDetected: false,
  initialized: false,
  aggregate: null,
  lastUpdated: 0,
};

// =============================================================================
// Store Implementation
// =============================================================================

export const useAnalyticsStore = create<AnalyticsStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        ...initialState,

        // Actions
        initialize: () => {
          const state = get();
          if (state.initialized) {
            console.log('[AnalyticsStore] Already initialized');
            return;
          }

          console.log('[AnalyticsStore] Initializing');

          // Configure service based on stored preferences
          analyticsService.configure({
            enabled: state.enabled,
          });

          // Initialize the service
          analyticsService.initialize();

          // Check DNT status
          const doNotTrackDetected = analyticsService.doNotTrackEnabled;

          set(
            {
              initialized: true,
              doNotTrackDetected,
            },
            false,
            'initialize'
          );

          // Refresh aggregate
          get().refreshAggregate();
        },

        enable: () => {
          console.log('[AnalyticsStore] Enabling analytics');
          analyticsService.enable();
          set({ enabled: true }, false, 'enable');
        },

        disable: () => {
          console.log('[AnalyticsStore] Disabling analytics');
          analyticsService.disable();
          set({ enabled: false }, false, 'disable');
        },

        trackPageView: (page, previousPage) => {
          analyticsService.trackPageView(page, previousPage);
          // Don't trigger state update for every event - too expensive
        },

        trackFeature: (feature, metadata) => {
          analyticsService.trackFeatureUsage(feature, metadata);
        },

        trackError: (error, options) => {
          analyticsService.trackError(error, options);
        },

        trackPerformance: (metric, value, rating) => {
          analyticsService.trackPerformance(metric, value, rating);
        },

        refreshAggregate: () => {
          const aggregate = analyticsService.getAggregate();
          set(
            {
              aggregate,
              lastUpdated: Date.now(),
            },
            false,
            'refreshAggregate'
          );
        },

        exportData: () => {
          return analyticsService.exportData();
        },

        clearData: () => {
          console.log('[AnalyticsStore] Clearing all analytics data');
          analyticsService.clearData();
          set(
            {
              aggregate: null,
              lastUpdated: Date.now(),
            },
            false,
            'clearData'
          );
        },

        reset: () => {
          console.log('[AnalyticsStore] Resetting store');
          analyticsService.shutdown();
          set(initialState, false, 'reset');
        },
      }),
      {
        name: 'ghost-note-analytics-preferences',
        partialize: (state) => ({
          enabled: state.enabled,
        }),
      }
    ),
    { name: 'AnalyticsStore' }
  )
);

// =============================================================================
// Selectors
// =============================================================================

/**
 * Check if analytics is enabled
 */
export const selectAnalyticsEnabled = (state: AnalyticsStore): boolean => state.enabled;

/**
 * Check if Do Not Track is detected
 */
export const selectDoNotTrackDetected = (state: AnalyticsStore): boolean => state.doNotTrackDetected;

/**
 * Check if analytics is initialized
 */
export const selectAnalyticsInitialized = (state: AnalyticsStore): boolean => state.initialized;

/**
 * Get aggregate data
 */
export const selectAnalyticsAggregate = (state: AnalyticsStore): AnalyticsAggregate | null =>
  state.aggregate;

/**
 * Check if analytics is active (enabled and not blocked by DNT)
 */
export const selectAnalyticsActive = (state: AnalyticsStore): boolean =>
  state.enabled && !state.doNotTrackDetected;

/**
 * Get total page views from aggregate
 */
export const selectTotalPageViews = (state: AnalyticsStore): number => {
  if (!state.aggregate) return 0;
  return Object.values(state.aggregate.pageViews).reduce((sum, count) => sum + count, 0);
};

/**
 * Get total feature usage from aggregate
 */
export const selectTotalFeatureUsage = (state: AnalyticsStore): number => {
  if (!state.aggregate) return 0;
  return Object.values(state.aggregate.featureUsage).reduce((sum, count) => sum + count, 0);
};

/**
 * Get total error count from aggregate
 */
export const selectTotalErrors = (state: AnalyticsStore): number => {
  if (!state.aggregate) return 0;
  return Object.values(state.aggregate.errors).reduce((sum, count) => sum + count, 0);
};
