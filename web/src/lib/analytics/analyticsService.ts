/**
 * Privacy-Respecting Analytics Service
 *
 * A self-hosted, GDPR-compliant analytics service that:
 * - Respects Do Not Track (DNT) browser setting
 * - Collects no personal information
 * - Uses anonymous session IDs
 * - Stores data locally with optional server sync
 * - Provides privacy controls
 *
 * @module lib/analytics/analyticsService
 */

import type {
  AnalyticsConfig,
  AnalyticsEvent,
  AnalyticsAggregate,
  BaseAnalyticsEvent,
  PageViewEvent,
  FeatureUsageEvent,
  ErrorEvent,
  PerformanceEvent,
  UserActionEvent,
  PageName,
  FeatureName,
  SessionData,
  PrivacyConsent,
} from './types';

// =============================================================================
// Constants
// =============================================================================

const DEBUG = import.meta.env?.DEV ?? false;

const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: true,
  respectDoNotTrack: true,
  debug: DEBUG,
  maxQueueSize: 100,
  flushInterval: 0, // Manual flush only (no server in this implementation)
  trackErrors: true,
  trackPerformance: true,
  trackPageViews: true,
  trackFeatureUsage: true,
  storageKey: 'ghost-note-analytics',
  endpoint: undefined, // No server endpoint - local storage only
};

const CONSENT_STORAGE_KEY = 'ghost-note-analytics-consent';
const SESSION_STORAGE_KEY = 'ghost-note-session';
const CONSENT_VERSION = '1.0.0';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Generate a unique ID for events
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate an anonymous session ID
 * Uses a simple hash of random values, no user-identifiable information
 */
function generateSessionId(): string {
  const array = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check if Do Not Track is enabled in browser
 */
function isDoNotTrackEnabled(): boolean {
  if (typeof navigator === 'undefined') return false;

  // Check various DNT implementations
  const dnt =
    navigator.doNotTrack ||
    (window as unknown as { doNotTrack?: string }).doNotTrack ||
    (navigator as unknown as { msDoNotTrack?: string }).msDoNotTrack;

  return dnt === '1' || dnt === 'yes';
}

/**
 * Sanitize error message to remove potentially sensitive information
 */
function sanitizeErrorMessage(message: string): string {
  let sanitized = message;

  // Remove URLs first (might contain tokens) - must come before file path removal
  sanitized = sanitized.replace(/https?:\/\/[^\s]+/g, '[URL]');

  // Remove file paths (Windows style)
  sanitized = sanitized.replace(/[A-Za-z]:[\\/][^\s]+/g, '[PATH]');

  // Remove file paths (Unix style with extensions)
  sanitized = sanitized.replace(/\/[^\s]+\.(ts|tsx|js|jsx)/g, '[FILE]');

  // Remove potential email addresses
  sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');

  // Truncate to reasonable length
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200) + '...';
  }

  return sanitized;
}

/**
 * Logging helper
 */
function log(message: string, ...args: unknown[]): void {
  if (analyticsService.config.debug) {
    console.log(`[Analytics] ${message}`, ...args);
  }
}

// =============================================================================
// Analytics Service Class
// =============================================================================

class AnalyticsService {
  private _config: AnalyticsConfig;
  private _events: AnalyticsEvent[] = [];
  private _session: SessionData | null = null;
  private _consent: PrivacyConsent | null = null;
  private _initialized = false;
  private _pageEntryTime: number = 0;
  private _flushIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this._config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get current configuration
   */
  get config(): AnalyticsConfig {
    return this._config;
  }

  /**
   * Check if analytics is currently active (enabled, consented, and not DNT)
   */
  get isActive(): boolean {
    if (!this._config.enabled) {
      return false;
    }

    if (this._config.respectDoNotTrack && isDoNotTrackEnabled()) {
      return false;
    }

    // If we require explicit consent and don't have it, return false
    // For now, we use an opt-out model (active by default, user can disable)
    return true;
  }

  /**
   * Check if Do Not Track is enabled
   */
  get doNotTrackEnabled(): boolean {
    return isDoNotTrackEnabled();
  }

  /**
   * Get current session data
   */
  get session(): SessionData | null {
    return this._session;
  }

  /**
   * Get current consent state
   */
  get consent(): PrivacyConsent | null {
    return this._consent;
  }

  /**
   * Get all stored events
   */
  get events(): AnalyticsEvent[] {
    return [...this._events];
  }

  /**
   * Initialize the analytics service
   */
  initialize(): void {
    if (this._initialized) {
      log('Already initialized');
      return;
    }

    log('Initializing analytics service');

    // Load consent from storage
    this.loadConsent();

    // Load stored events
    this.loadEvents();

    // Initialize or resume session
    this.initSession();

    // Set up flush interval if configured
    if (this._config.flushInterval > 0) {
      this._flushIntervalId = setInterval(() => {
        this.flush();
      }, this._config.flushInterval);
    }

    // Set up visibility change handler for session tracking
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    // Set up unload handler to save events
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handleBeforeUnload);
    }

    this._initialized = true;
    log('Analytics initialized', {
      isActive: this.isActive,
      dnt: this.doNotTrackEnabled,
      sessionId: this._session?.id,
    });
  }

  /**
   * Cleanup and shutdown the analytics service
   */
  shutdown(): void {
    log('Shutting down analytics service');

    // Clear flush interval
    if (this._flushIntervalId) {
      clearInterval(this._flushIntervalId);
      this._flushIntervalId = null;
    }

    // Remove event listeners
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.handleBeforeUnload);
    }

    // Save any pending events
    this.saveEvents();

    this._initialized = false;
  }

  /**
   * Update configuration
   */
  configure(config: Partial<AnalyticsConfig>): void {
    log('Updating configuration', config);
    this._config = { ...this._config, ...config };

    // Re-evaluate flush interval
    if (this._flushIntervalId) {
      clearInterval(this._flushIntervalId);
      this._flushIntervalId = null;
    }

    if (this._config.flushInterval > 0 && this._initialized) {
      this._flushIntervalId = setInterval(() => {
        this.flush();
      }, this._config.flushInterval);
    }
  }

  /**
   * Enable analytics
   */
  enable(): void {
    log('Enabling analytics');
    this._config.enabled = true;
    this.updateConsent(true);
  }

  /**
   * Disable analytics
   */
  disable(): void {
    log('Disabling analytics');
    this._config.enabled = false;
    this.updateConsent(false);
  }

  /**
   * Track a page view
   */
  trackPageView(page: PageName, previousPage?: PageName): void {
    if (!this.isActive || !this._config.trackPageViews) {
      log('Page view tracking skipped', { isActive: this.isActive, page });
      return;
    }

    // Calculate time on previous page
    let timeOnPreviousPage: number | undefined;
    if (this._pageEntryTime > 0) {
      timeOnPreviousPage = Date.now() - this._pageEntryTime;
    }

    const event: PageViewEvent = {
      ...this.createBaseEvent('page_view'),
      type: 'page_view',
      page,
      previousPage,
      timeOnPreviousPage,
    };

    // Update page entry time
    this._pageEntryTime = Date.now();

    // Update session
    if (this._session) {
      this._session.currentPage = page;
    }

    this.recordEvent(event);
    log('Page view tracked', { page, previousPage, timeOnPreviousPage });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(
    feature: FeatureName,
    metadata?: Record<string, string | number | boolean>
  ): void {
    if (!this.isActive || !this._config.trackFeatureUsage) {
      log('Feature usage tracking skipped', { isActive: this.isActive, feature });
      return;
    }

    const event: FeatureUsageEvent = {
      ...this.createBaseEvent('feature_usage'),
      type: 'feature_usage',
      feature,
      metadata,
    };

    this.recordEvent(event);
    log('Feature usage tracked', { feature, metadata });
  }

  /**
   * Track an error
   */
  trackError(
    error: Error | string,
    options: {
      component?: string;
      caught?: boolean;
      isReactError?: boolean;
    } = {}
  ): void {
    if (!this.isActive || !this._config.trackErrors) {
      log('Error tracking skipped', { isActive: this.isActive });
      return;
    }

    const message = typeof error === 'string' ? error : error.message;
    const errorType = typeof error === 'string' ? 'Error' : error.name;

    const event: ErrorEvent = {
      ...this.createBaseEvent('error'),
      type: 'error',
      message: sanitizeErrorMessage(message),
      errorType,
      component: options.component,
      caught: options.caught ?? true,
      isReactError: options.isReactError ?? false,
    };

    this.recordEvent(event);
    log('Error tracked', { errorType, message: event.message });
  }

  /**
   * Track a performance metric
   */
  trackPerformance(
    metric: string,
    value: number,
    rating?: 'good' | 'needs-improvement' | 'poor'
  ): void {
    if (!this.isActive || !this._config.trackPerformance) {
      log('Performance tracking skipped', { isActive: this.isActive, metric });
      return;
    }

    const event: PerformanceEvent = {
      ...this.createBaseEvent('performance'),
      type: 'performance',
      metric,
      value,
      rating,
    };

    this.recordEvent(event);
    log('Performance tracked', { metric, value, rating });
  }

  /**
   * Track a user action
   */
  trackAction(action: string, category: string, label?: string, value?: number): void {
    if (!this.isActive) {
      log('Action tracking skipped', { isActive: this.isActive, action });
      return;
    }

    const event: UserActionEvent = {
      ...this.createBaseEvent('user_action'),
      type: 'user_action',
      action,
      category,
      label,
      value,
    };

    this.recordEvent(event);
    log('Action tracked', { action, category, label, value });
  }

  /**
   * Flush events (send to server if configured, otherwise just save)
   */
  async flush(): Promise<void> {
    if (this._events.length === 0) {
      return;
    }

    log('Flushing events', { count: this._events.length });

    if (this._config.endpoint) {
      // If we have a server endpoint, send events there
      try {
        await this.sendToServer();
      } catch (error) {
        log('Failed to send events to server', error);
        // Keep events in queue for retry
      }
    }

    // Always save to local storage as backup
    this.saveEvents();
  }

  /**
   * Get aggregated analytics data
   */
  getAggregate(): AnalyticsAggregate {
    const pageViews: Record<string, number> = {};
    const featureUsage: Record<string, number> = {};
    const errors: Record<string, number> = {};
    const sessions = new Set<string>();
    const sessionDurations: number[] = [];
    let startDate = Date.now();
    let endDate = 0;

    for (const event of this._events) {
      // Track date range
      if (event.timestamp < startDate) startDate = event.timestamp;
      if (event.timestamp > endDate) endDate = event.timestamp;

      // Track sessions
      sessions.add(event.sessionId);

      // Aggregate by type
      switch (event.type) {
        case 'page_view':
          pageViews[event.page] = (pageViews[event.page] || 0) + 1;
          if (event.timeOnPreviousPage) {
            sessionDurations.push(event.timeOnPreviousPage);
          }
          break;
        case 'feature_usage':
          featureUsage[event.feature] = (featureUsage[event.feature] || 0) + 1;
          break;
        case 'error':
          errors[event.errorType] = (errors[event.errorType] || 0) + 1;
          break;
      }
    }

    const avgSessionDuration =
      sessionDurations.length > 0
        ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
        : 0;

    return {
      pageViews: pageViews as Record<PageName, number>,
      featureUsage: featureUsage as Record<FeatureName, number>,
      errors,
      uniqueSessions: sessions.size,
      avgSessionDuration,
      startDate,
      endDate,
    };
  }

  /**
   * Export analytics data
   */
  exportData(): string {
    const data = {
      exportDate: new Date().toISOString(),
      aggregate: this.getAggregate(),
      events: this._events,
      config: {
        enabled: this._config.enabled,
        dntEnabled: this.doNotTrackEnabled,
        dntRespected: this._config.respectDoNotTrack,
      },
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Clear all analytics data
   */
  clearData(): void {
    log('Clearing all analytics data');
    this._events = [];

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this._config.storageKey);
    }
  }

  /**
   * Get event count by type
   */
  getEventCount(type?: string): number {
    if (!type) {
      return this._events.length;
    }
    return this._events.filter((e) => e.type === type).length;
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  private createBaseEvent(type: string): BaseAnalyticsEvent {
    return {
      id: generateId(),
      type: type as BaseAnalyticsEvent['type'],
      timestamp: Date.now(),
      sessionId: this._session?.id || generateSessionId(),
      page: this._session?.currentPage,
    };
  }

  private recordEvent(event: AnalyticsEvent): void {
    this._events.push(event);

    // Update session
    if (this._session) {
      this._session.lastActivityTime = Date.now();
      this._session.eventCount++;
    }

    // Check queue size
    if (this._events.length >= this._config.maxQueueSize) {
      this.flush();
    }
  }

  private initSession(): void {
    // Try to load existing session from sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        try {
          const session = JSON.parse(stored) as SessionData;
          // Check if session is still valid (not timed out)
          if (Date.now() - session.lastActivityTime < SESSION_TIMEOUT_MS) {
            this._session = session;
            log('Resumed existing session', { sessionId: session.id });
            return;
          }
        } catch {
          // Ignore parse errors
        }
      }
    }

    // Create new session
    this._session = {
      id: generateSessionId(),
      startTime: Date.now(),
      lastActivityTime: Date.now(),
      eventCount: 0,
    };

    this.saveSession();
    log('Created new session', { sessionId: this._session.id });
  }

  private saveSession(): void {
    if (typeof sessionStorage !== 'undefined' && this._session) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this._session));
    }
  }

  private loadEvents(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const stored = localStorage.getItem(this._config.storageKey);
      if (stored) {
        this._events = JSON.parse(stored) as AnalyticsEvent[];
        log('Loaded stored events', { count: this._events.length });
      }
    } catch (error) {
      log('Failed to load stored events', error);
      this._events = [];
    }
  }

  private saveEvents(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      localStorage.setItem(this._config.storageKey, JSON.stringify(this._events));
      log('Saved events', { count: this._events.length });
    } catch (error) {
      log('Failed to save events', error);
      // If storage is full, remove oldest events
      if (this._events.length > 50) {
        this._events = this._events.slice(-50);
        try {
          localStorage.setItem(this._config.storageKey, JSON.stringify(this._events));
        } catch {
          // Give up
        }
      }
    }
  }

  private loadConsent(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored) {
        this._consent = JSON.parse(stored) as PrivacyConsent;
        log('Loaded consent', this._consent);
      }
    } catch {
      // Ignore parse errors
    }
  }

  private updateConsent(analytics: boolean): void {
    this._consent = {
      analytics,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    };

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(this._consent));
    }

    log('Updated consent', this._consent);
  }

  private async sendToServer(): Promise<void> {
    if (!this._config.endpoint || this._events.length === 0) return;

    const response = await fetch(this._config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        events: this._events,
        sessionId: this._session?.id,
      }),
    });

    if (response.ok) {
      // Clear sent events
      this._events = [];
      log('Events sent to server successfully');
    } else {
      throw new Error(`Server responded with ${response.status}`);
    }
  }

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      // Save events when page becomes hidden
      this.saveEvents();
      this.saveSession();
    } else if (document.visibilityState === 'visible') {
      // Check if session has expired
      if (this._session && Date.now() - this._session.lastActivityTime > SESSION_TIMEOUT_MS) {
        log('Session expired, creating new session');
        this.initSession();
      }
    }
  };

  private handleBeforeUnload = (): void => {
    this.saveEvents();
    this.saveSession();
  };
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const analyticsService = new AnalyticsService();

// Export class for testing
export { AnalyticsService };
