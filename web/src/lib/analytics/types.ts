/**
 * Analytics Types
 *
 * Type definitions for the privacy-respecting analytics system.
 *
 * @module lib/analytics/types
 */

/**
 * Types of events that can be tracked
 */
export type AnalyticsEventType =
  | 'page_view'
  | 'feature_usage'
  | 'error'
  | 'performance'
  | 'user_action';

/**
 * Feature names that can be tracked
 */
export type FeatureName =
  | 'poem_input'
  | 'poem_analysis'
  | 'lyrics_edit'
  | 'suggestion_apply'
  | 'suggestion_reject'
  | 'melody_generate'
  | 'melody_play'
  | 'melody_stop'
  | 'melody_pause'
  | 'recording_start'
  | 'recording_stop'
  | 'theme_change'
  | 'export_project'
  | 'import_project'
  | 'undo'
  | 'redo'
  | 'keyboard_shortcut';

/**
 * Page/view names for page view tracking
 */
export type PageName =
  | 'poem-input'
  | 'analysis'
  | 'lyrics-editor'
  | 'melody'
  | 'recording';

/**
 * Base analytics event (common fields)
 */
export interface BaseAnalyticsEvent {
  /** Unique event ID */
  id: string;
  /** Event type */
  type: AnalyticsEventType;
  /** Timestamp when event occurred */
  timestamp: number;
  /** Session ID (anonymous, generated per browser session) */
  sessionId: string;
  /** Current page/view when event occurred */
  page?: PageName;
}

/**
 * Page view event
 */
export interface PageViewEvent extends BaseAnalyticsEvent {
  type: 'page_view';
  /** Page being viewed */
  page: PageName;
  /** Previous page (for navigation tracking) */
  previousPage?: PageName;
  /** Time spent on previous page in milliseconds */
  timeOnPreviousPage?: number;
}

/**
 * Feature usage event
 */
export interface FeatureUsageEvent extends BaseAnalyticsEvent {
  type: 'feature_usage';
  /** Feature that was used */
  feature: FeatureName;
  /** Optional metadata about the feature usage (no PII) */
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Error event
 */
export interface ErrorEvent extends BaseAnalyticsEvent {
  type: 'error';
  /** Error message (sanitized, no stack traces with file paths) */
  message: string;
  /** Error category/name */
  errorType: string;
  /** Component where error occurred (if available) */
  component?: string;
  /** Whether error was caught by error boundary */
  caught: boolean;
  /** Whether this is a React error boundary error */
  isReactError: boolean;
}

/**
 * Performance event
 */
export interface PerformanceEvent extends BaseAnalyticsEvent {
  type: 'performance';
  /** Metric name */
  metric: string;
  /** Value in milliseconds */
  value: number;
  /** Optional rating (good, needs-improvement, poor) */
  rating?: 'good' | 'needs-improvement' | 'poor';
}

/**
 * User action event (for A/B testing, feature discovery)
 */
export interface UserActionEvent extends BaseAnalyticsEvent {
  type: 'user_action';
  /** Action name */
  action: string;
  /** Action category */
  category: string;
  /** Optional label for additional context */
  label?: string;
  /** Optional value */
  value?: number;
}

/**
 * Union type for all analytics events
 */
export type AnalyticsEvent =
  | PageViewEvent
  | FeatureUsageEvent
  | ErrorEvent
  | PerformanceEvent
  | UserActionEvent;

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  /** Enable/disable analytics */
  enabled: boolean;
  /** Respect Do Not Track header */
  respectDoNotTrack: boolean;
  /** Enable debug logging */
  debug: boolean;
  /** Maximum events to store locally before flush */
  maxQueueSize: number;
  /** Flush interval in milliseconds (0 = manual only) */
  flushInterval: number;
  /** Enable error tracking */
  trackErrors: boolean;
  /** Enable performance tracking */
  trackPerformance: boolean;
  /** Enable page view tracking */
  trackPageViews: boolean;
  /** Enable feature usage tracking */
  trackFeatureUsage: boolean;
  /** Storage key for persisting events */
  storageKey: string;
  /** Endpoint for sending analytics (if using server) */
  endpoint?: string;
}

/**
 * Aggregated analytics data for dashboard display
 */
export interface AnalyticsAggregate {
  /** Total page views by page */
  pageViews: Record<PageName, number>;
  /** Total feature usage by feature */
  featureUsage: Record<FeatureName, number>;
  /** Error count by error type */
  errors: Record<string, number>;
  /** Total unique sessions */
  uniqueSessions: number;
  /** Average session duration in ms */
  avgSessionDuration: number;
  /** Date range */
  startDate: number;
  endDate: number;
}

/**
 * Privacy consent state
 */
export interface PrivacyConsent {
  /** User has explicitly consented to analytics */
  analytics: boolean;
  /** Timestamp of consent */
  timestamp: number;
  /** Consent version (for future consent updates) */
  version: string;
}

/**
 * Session data
 */
export interface SessionData {
  /** Anonymous session ID */
  id: string;
  /** Session start time */
  startTime: number;
  /** Last activity time */
  lastActivityTime: number;
  /** Current page */
  currentPage?: PageName;
  /** Number of events in session */
  eventCount: number;
}
