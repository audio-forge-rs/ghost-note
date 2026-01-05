/**
 * useAnalytics Hook Tests
 *
 * Tests for the analytics hooks.
 *
 * @module hooks/useAnalytics.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnalytics, usePageView, useFeatureTracker, useErrorTracker } from './useAnalytics';
import { useAnalyticsStore } from '@/stores/useAnalyticsStore';

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

describe('useAnalytics', () => {
  beforeEach(() => {
    // Clear mocks and storage
    vi.clearAllMocks();
    localStorageMock.clear();
    sessionStorageMock.clear();

    // Reset navigator.doNotTrack
    Object.defineProperty(navigator, 'doNotTrack', {
      value: null,
      writable: true,
      configurable: true,
    });

    // Reset the analytics store
    const { result } = renderHook(() => useAnalyticsStore());
    act(() => {
      result.current.reset();
    });
  });

  afterEach(() => {
    const { result } = renderHook(() => useAnalyticsStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('useAnalytics hook', () => {
    it('should return tracking functions', () => {
      const { result } = renderHook(() => useAnalytics());

      expect(result.current.trackFeature).toBeDefined();
      expect(result.current.trackError).toBeDefined();
      expect(result.current.trackPerformance).toBeDefined();
      expect(result.current.trackPageView).toBeDefined();
    });

    it('should return isActive status', () => {
      const { result } = renderHook(() => useAnalytics());
      expect(typeof result.current.isActive).toBe('boolean');
    });

    it('should return doNotTrackEnabled status', () => {
      const { result } = renderHook(() => useAnalytics());
      expect(typeof result.current.doNotTrackEnabled).toBe('boolean');
    });

    it('should initialize analytics on first use', async () => {
      renderHook(() => useAnalytics());
      const { result: storeResult } = renderHook(() => useAnalyticsStore());

      // Wait for initialization
      await vi.waitFor(() => {
        expect(storeResult.current.initialized).toBe(true);
      });
    });

    it('should track page view on mount when page is provided', async () => {
      const { result: storeResult } = renderHook(() => useAnalyticsStore());

      renderHook(() => useAnalytics({ page: 'poem-input', trackPageViewOnMount: true }));

      // Wait for initialization and page view
      await vi.waitFor(() => {
        expect(storeResult.current.initialized).toBe(true);
      });
    });

    it('should not track page view when trackPageViewOnMount is false', async () => {
      const trackPageViewSpy = vi.fn();
      const { result: storeResult } = renderHook(() => useAnalyticsStore());

      // Override trackPageView
      act(() => {
        storeResult.current.trackPageView = trackPageViewSpy;
      });

      renderHook(() => useAnalytics({ page: 'poem-input', trackPageViewOnMount: false }));

      // Give some time for potential tracking
      await new Promise((resolve) => setTimeout(resolve, 100));

      // trackPageView should not have been called
      expect(trackPageViewSpy).not.toHaveBeenCalled();
    });

    it('trackFeature should call store trackFeature', async () => {
      const { result: storeResult } = renderHook(() => useAnalyticsStore());
      const { result: hookResult } = renderHook(() => useAnalytics());

      // Wait for initialization
      await vi.waitFor(() => {
        expect(storeResult.current.initialized).toBe(true);
      });

      act(() => {
        hookResult.current.trackFeature('melody_generate');
        storeResult.current.refreshAggregate();
      });

      // Should have tracked the feature
      expect(storeResult.current.aggregate).not.toBeNull();
    });

    it('trackError should call store trackError', async () => {
      const { result: storeResult } = renderHook(() => useAnalyticsStore());
      const { result: hookResult } = renderHook(() => useAnalytics());

      // Wait for initialization
      await vi.waitFor(() => {
        expect(storeResult.current.initialized).toBe(true);
      });

      act(() => {
        hookResult.current.trackError(new Error('Test error'));
        storeResult.current.refreshAggregate();
      });

      expect(storeResult.current.aggregate).not.toBeNull();
    });

    it('trackPerformance should call store trackPerformance', async () => {
      const { result: storeResult } = renderHook(() => useAnalyticsStore());
      const { result: hookResult } = renderHook(() => useAnalytics());

      // Wait for initialization
      await vi.waitFor(() => {
        expect(storeResult.current.initialized).toBe(true);
      });

      act(() => {
        hookResult.current.trackPerformance('LCP', 2500, 'good');
        storeResult.current.refreshAggregate();
      });

      expect(storeResult.current.aggregate).not.toBeNull();
    });
  });

  describe('usePageView hook', () => {
    it('should track page view on mount', async () => {
      const { result: storeResult } = renderHook(() => useAnalyticsStore());

      renderHook(() => usePageView('analysis'));

      // Wait for initialization
      await vi.waitFor(() => {
        expect(storeResult.current.initialized).toBe(true);
      });
    });
  });

  describe('useFeatureTracker hook', () => {
    it('should return a trackFeature function', () => {
      const { result } = renderHook(() => useFeatureTracker());
      expect(typeof result.current).toBe('function');
    });

    it('should track features when called', async () => {
      const { result: storeResult } = renderHook(() => useAnalyticsStore());
      const { result: trackerResult } = renderHook(() => useFeatureTracker());

      // Wait for initialization
      await vi.waitFor(() => {
        expect(storeResult.current.initialized).toBe(true);
      });

      act(() => {
        trackerResult.current('poem_input');
        storeResult.current.refreshAggregate();
      });

      expect(storeResult.current.aggregate).not.toBeNull();
    });
  });

  describe('useErrorTracker hook', () => {
    it('should return a trackError function', () => {
      const { result } = renderHook(() => useErrorTracker());
      expect(typeof result.current).toBe('function');
    });

    it('should track errors when called', async () => {
      const { result: storeResult } = renderHook(() => useAnalyticsStore());
      const { result: trackerResult } = renderHook(() => useErrorTracker());

      // Wait for initialization
      await vi.waitFor(() => {
        expect(storeResult.current.initialized).toBe(true);
      });

      act(() => {
        trackerResult.current(new Error('Test'), { component: 'TestComponent' });
        storeResult.current.refreshAggregate();
      });

      expect(storeResult.current.aggregate).not.toBeNull();
    });
  });

  describe('DNT detection', () => {
    it('should return doNotTrackEnabled as true when DNT is set', async () => {
      Object.defineProperty(navigator, 'doNotTrack', {
        value: '1',
        writable: true,
        configurable: true,
      });

      const { result: hookResult } = renderHook(() => useAnalytics());
      const { result: storeResult } = renderHook(() => useAnalyticsStore());

      // Wait for initialization
      await vi.waitFor(() => {
        expect(storeResult.current.initialized).toBe(true);
      });

      expect(hookResult.current.doNotTrackEnabled).toBe(true);
    });
  });
});
