/**
 * Analytics Module
 *
 * Privacy-respecting analytics for Ghost Note.
 * Provides anonymous usage tracking with full user control.
 *
 * @module lib/analytics
 */

// Service
export { analyticsService, AnalyticsService } from './analyticsService';

// Types
export type {
  AnalyticsEventType,
  FeatureName,
  PageName,
  BaseAnalyticsEvent,
  PageViewEvent,
  FeatureUsageEvent,
  ErrorEvent,
  PerformanceEvent,
  UserActionEvent,
  AnalyticsEvent,
  AnalyticsConfig,
  AnalyticsAggregate,
  PrivacyConsent,
  SessionData,
} from './types';
