/**
 * Analytics Service Tests
 *
 * Tests for the privacy-respecting analytics service.
 *
 * @module lib/analytics/analyticsService.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AnalyticsService } from './analyticsService';

// Mock localStorage and sessionStorage
const mockStorage: Record<string, string> = {};
const mockSessionStorage: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  }),
};

const sessionStorageMock = {
  getItem: vi.fn((key: string) => mockSessionStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockSessionStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockSessionStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key]);
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    // Clear mocks
    vi.clearAllMocks();
    localStorageMock.clear();
    sessionStorageMock.clear();

    // Reset navigator.doNotTrack
    Object.defineProperty(navigator, 'doNotTrack', {
      value: null,
      writable: true,
      configurable: true,
    });

    // Create fresh service instance
    service = new AnalyticsService({
      debug: false,
      maxQueueSize: 100,
    });
  });

  afterEach(() => {
    service.shutdown();
  });

  describe('initialization', () => {
    it('should initialize successfully', () => {
      service.initialize();
      expect(service.session).not.toBeNull();
      expect(service.session?.id).toBeDefined();
    });

    it('should create a new session on initialization', () => {
      service.initialize();
      expect(service.session).toBeDefined();
      expect(service.session?.id).toBeTruthy();
      expect(service.session?.startTime).toBeGreaterThan(0);
    });

    it('should not initialize twice', () => {
      service.initialize();
      const sessionId = service.session?.id;
      service.initialize();
      expect(service.session?.id).toBe(sessionId);
    });
  });

  describe('Do Not Track', () => {
    it('should detect DNT when set to "1"', () => {
      Object.defineProperty(navigator, 'doNotTrack', {
        value: '1',
        writable: true,
        configurable: true,
      });

      const dntService = new AnalyticsService({ respectDoNotTrack: true });
      expect(dntService.doNotTrackEnabled).toBe(true);
      expect(dntService.isActive).toBe(false);
    });

    it('should detect DNT when set to "yes"', () => {
      Object.defineProperty(navigator, 'doNotTrack', {
        value: 'yes',
        writable: true,
        configurable: true,
      });

      const dntService = new AnalyticsService({ respectDoNotTrack: true });
      expect(dntService.doNotTrackEnabled).toBe(true);
    });

    it('should be active when DNT is not set', () => {
      Object.defineProperty(navigator, 'doNotTrack', {
        value: null,
        writable: true,
        configurable: true,
      });

      const dntService = new AnalyticsService({ respectDoNotTrack: true, enabled: true });
      expect(dntService.doNotTrackEnabled).toBe(false);
      expect(dntService.isActive).toBe(true);
    });

    it('should skip tracking when DNT is enabled', () => {
      Object.defineProperty(navigator, 'doNotTrack', {
        value: '1',
        writable: true,
        configurable: true,
      });

      const dntService = new AnalyticsService({ respectDoNotTrack: true });
      dntService.initialize();
      dntService.trackPageView('poem-input');

      expect(dntService.events).toHaveLength(0);
      dntService.shutdown();
    });
  });

  describe('page view tracking', () => {
    beforeEach(() => {
      service.initialize();
    });

    it('should track page views', () => {
      service.trackPageView('poem-input');
      expect(service.events).toHaveLength(1);
      expect(service.events[0].type).toBe('page_view');
    });

    it('should include page name in page view event', () => {
      service.trackPageView('analysis');
      const event = service.events[0];
      expect(event.type).toBe('page_view');
      if (event.type === 'page_view') {
        expect(event.page).toBe('analysis');
      }
    });

    it('should track previous page', () => {
      service.trackPageView('poem-input');
      service.trackPageView('analysis', 'poem-input');

      const event = service.events[1];
      if (event.type === 'page_view') {
        expect(event.previousPage).toBe('poem-input');
      }
    });

    it('should not track when disabled', () => {
      service.configure({ trackPageViews: false });
      service.trackPageView('poem-input');
      expect(service.events).toHaveLength(0);
    });
  });

  describe('feature usage tracking', () => {
    beforeEach(() => {
      service.initialize();
    });

    it('should track feature usage', () => {
      service.trackFeatureUsage('melody_generate');
      expect(service.events).toHaveLength(1);
      expect(service.events[0].type).toBe('feature_usage');
    });

    it('should include feature name in event', () => {
      service.trackFeatureUsage('poem_analysis');
      const event = service.events[0];
      if (event.type === 'feature_usage') {
        expect(event.feature).toBe('poem_analysis');
      }
    });

    it('should include metadata in feature usage event', () => {
      service.trackFeatureUsage('lyrics_edit', { lineCount: 5 });
      const event = service.events[0];
      if (event.type === 'feature_usage') {
        expect(event.metadata).toEqual({ lineCount: 5 });
      }
    });

    it('should not track when disabled', () => {
      service.configure({ trackFeatureUsage: false });
      service.trackFeatureUsage('melody_play');
      expect(service.events).toHaveLength(0);
    });
  });

  describe('error tracking', () => {
    beforeEach(() => {
      service.initialize();
    });

    it('should track errors', () => {
      service.trackError(new Error('Test error'));
      expect(service.events).toHaveLength(1);
      expect(service.events[0].type).toBe('error');
    });

    it('should track string errors', () => {
      service.trackError('Something went wrong');
      const event = service.events[0];
      if (event.type === 'error') {
        expect(event.message).toBe('Something went wrong');
        expect(event.errorType).toBe('Error');
      }
    });

    it('should sanitize error messages with file paths', () => {
      service.trackError(new Error('Failed at /Users/test/app/file.ts'));
      const event = service.events[0];
      if (event.type === 'error') {
        expect(event.message).not.toContain('/Users/test');
        expect(event.message).toContain('[FILE]');
      }
    });

    it('should sanitize error messages with URLs', () => {
      service.trackError(new Error('Failed at https://api.example.com/secret?token=123'));
      const event = service.events[0];
      if (event.type === 'error') {
        expect(event.message).not.toContain('https://');
        expect(event.message).toContain('[URL]');
      }
    });

    it('should sanitize error messages with emails', () => {
      service.trackError(new Error('User test@example.com not found'));
      const event = service.events[0];
      if (event.type === 'error') {
        expect(event.message).not.toContain('@example.com');
        expect(event.message).toContain('[EMAIL]');
      }
    });

    it('should truncate long error messages', () => {
      const longMessage = 'A'.repeat(300);
      service.trackError(new Error(longMessage));
      const event = service.events[0];
      if (event.type === 'error') {
        expect(event.message.length).toBeLessThanOrEqual(203); // 200 + "..."
      }
    });

    it('should include component name in error event', () => {
      service.trackError(new Error('Test'), { component: 'MyComponent' });
      const event = service.events[0];
      if (event.type === 'error') {
        expect(event.component).toBe('MyComponent');
      }
    });

    it('should mark caught errors correctly', () => {
      service.trackError(new Error('Test'), { caught: true });
      const event = service.events[0];
      if (event.type === 'error') {
        expect(event.caught).toBe(true);
      }
    });

    it('should not track when disabled', () => {
      service.configure({ trackErrors: false });
      service.trackError(new Error('Test'));
      expect(service.events).toHaveLength(0);
    });
  });

  describe('performance tracking', () => {
    beforeEach(() => {
      service.initialize();
    });

    it('should track performance metrics', () => {
      service.trackPerformance('LCP', 2500);
      expect(service.events).toHaveLength(1);
      expect(service.events[0].type).toBe('performance');
    });

    it('should include metric name and value', () => {
      service.trackPerformance('FCP', 1200);
      const event = service.events[0];
      if (event.type === 'performance') {
        expect(event.metric).toBe('FCP');
        expect(event.value).toBe(1200);
      }
    });

    it('should include rating when provided', () => {
      service.trackPerformance('LCP', 4500, 'poor');
      const event = service.events[0];
      if (event.type === 'performance') {
        expect(event.rating).toBe('poor');
      }
    });

    it('should not track when disabled', () => {
      service.configure({ trackPerformance: false });
      service.trackPerformance('CLS', 0.1);
      expect(service.events).toHaveLength(0);
    });
  });

  describe('enable/disable', () => {
    beforeEach(() => {
      service.initialize();
    });

    it('should enable analytics', () => {
      service.disable();
      expect(service.isActive).toBe(false);

      service.enable();
      expect(service.isActive).toBe(true);
    });

    it('should disable analytics', () => {
      service.disable();
      expect(service.isActive).toBe(false);
    });

    it('should not track events when disabled', () => {
      service.disable();
      service.trackPageView('poem-input');
      service.trackFeatureUsage('melody_play');
      service.trackError(new Error('Test'));

      expect(service.events).toHaveLength(0);
    });

    it('should track events after re-enabling', () => {
      service.disable();
      service.enable();
      service.trackPageView('poem-input');

      expect(service.events).toHaveLength(1);
    });
  });

  describe('aggregation', () => {
    beforeEach(() => {
      service.initialize();
    });

    it('should return aggregate data', () => {
      service.trackPageView('poem-input');
      service.trackPageView('analysis');
      service.trackFeatureUsage('melody_generate');
      service.trackError(new Error('Test'));

      const aggregate = service.getAggregate();

      expect(aggregate.pageViews['poem-input']).toBe(1);
      expect(aggregate.pageViews['analysis']).toBe(1);
      expect(aggregate.featureUsage['melody_generate']).toBe(1);
      expect(aggregate.errors['Error']).toBe(1);
    });

    it('should track unique sessions', () => {
      service.trackPageView('poem-input');
      const aggregate = service.getAggregate();

      expect(aggregate.uniqueSessions).toBeGreaterThan(0);
    });
  });

  describe('data export', () => {
    beforeEach(() => {
      service.initialize();
    });

    it('should export data as JSON', () => {
      service.trackPageView('poem-input');
      const exported = service.exportData();
      const data = JSON.parse(exported);

      expect(data.exportDate).toBeDefined();
      expect(data.aggregate).toBeDefined();
      expect(data.events).toHaveLength(1);
    });
  });

  describe('data clearing', () => {
    beforeEach(() => {
      service.initialize();
    });

    it('should clear all events', () => {
      service.trackPageView('poem-input');
      service.trackFeatureUsage('melody_play');
      expect(service.events).toHaveLength(2);

      service.clearData();
      expect(service.events).toHaveLength(0);
    });
  });

  describe('session management', () => {
    it('should create session on initialization', () => {
      service.initialize();
      expect(service.session).not.toBeNull();
      expect(service.session?.id).toBeTruthy();
    });

    it('should include session ID in events', () => {
      service.initialize();
      service.trackPageView('poem-input');

      expect(service.events[0].sessionId).toBe(service.session?.id);
    });

    it('should update session activity on events', () => {
      service.initialize();

      service.trackPageView('poem-input');

      // Event count should update
      expect(service.session?.eventCount).toBe(1);
    });
  });

  describe('queue management', () => {
    it('should flush when queue reaches max size', async () => {
      const smallQueueService = new AnalyticsService({
        debug: false,
        maxQueueSize: 5,
      });
      smallQueueService.initialize();

      // Track events up to max queue size
      for (let i = 0; i < 5; i++) {
        smallQueueService.trackPageView('poem-input');
      }

      // Events should be saved to storage
      expect(localStorageMock.setItem).toHaveBeenCalled();
      smallQueueService.shutdown();
    });
  });
});
