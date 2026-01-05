/**
 * Analytics Store Tests
 *
 * Tests for the analytics store and its integration with the analytics service.
 *
 * @module stores/useAnalyticsStore.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  useAnalyticsStore,
  selectAnalyticsEnabled,
  selectDoNotTrackDetected,
  selectAnalyticsInitialized,
  selectAnalyticsActive,
  selectTotalPageViews,
  selectTotalFeatureUsage,
  selectTotalErrors,
} from './useAnalyticsStore';

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

describe('useAnalyticsStore', () => {
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

    // Reset the store
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

  describe('initial state', () => {
    it('should have analytics enabled by default', () => {
      const { result } = renderHook(() => useAnalyticsStore());
      expect(result.current.enabled).toBe(true);
    });

    it('should not be initialized initially', () => {
      const { result } = renderHook(() => useAnalyticsStore());
      expect(result.current.initialized).toBe(false);
    });

    it('should not detect DNT initially', () => {
      const { result } = renderHook(() => useAnalyticsStore());
      expect(result.current.doNotTrackDetected).toBe(false);
    });

    it('should not have aggregate data initially', () => {
      const { result } = renderHook(() => useAnalyticsStore());
      expect(result.current.aggregate).toBeNull();
    });
  });

  describe('initialization', () => {
    it('should initialize the store', () => {
      const { result } = renderHook(() => useAnalyticsStore());

      act(() => {
        result.current.initialize();
      });

      expect(result.current.initialized).toBe(true);
    });

    it('should detect DNT on initialization when set', () => {
      Object.defineProperty(navigator, 'doNotTrack', {
        value: '1',
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useAnalyticsStore());

      act(() => {
        result.current.initialize();
      });

      expect(result.current.doNotTrackDetected).toBe(true);
    });
  });

  describe('enable/disable', () => {
    it('should enable analytics', () => {
      const { result } = renderHook(() => useAnalyticsStore());

      act(() => {
        result.current.disable();
      });
      expect(result.current.enabled).toBe(false);

      act(() => {
        result.current.enable();
      });
      expect(result.current.enabled).toBe(true);
    });

    it('should disable analytics', () => {
      const { result } = renderHook(() => useAnalyticsStore());

      act(() => {
        result.current.disable();
      });

      expect(result.current.enabled).toBe(false);
    });
  });

  describe('tracking', () => {
    it('should track page views', () => {
      const { result } = renderHook(() => useAnalyticsStore());

      act(() => {
        result.current.initialize();
        result.current.trackPageView('poem-input');
        result.current.refreshAggregate();
      });

      // Should have some aggregate data now
      expect(result.current.aggregate).not.toBeNull();
    });

    it('should track feature usage', () => {
      const { result } = renderHook(() => useAnalyticsStore());

      act(() => {
        result.current.initialize();
        result.current.trackFeature('melody_generate');
        result.current.refreshAggregate();
      });

      expect(result.current.aggregate).not.toBeNull();
    });

    it('should track errors', () => {
      const { result } = renderHook(() => useAnalyticsStore());

      act(() => {
        result.current.initialize();
        result.current.trackError(new Error('Test error'));
        result.current.refreshAggregate();
      });

      expect(result.current.aggregate).not.toBeNull();
    });

    it('should track performance', () => {
      const { result } = renderHook(() => useAnalyticsStore());

      act(() => {
        result.current.initialize();
        result.current.trackPerformance('LCP', 2500);
        result.current.refreshAggregate();
      });

      expect(result.current.aggregate).not.toBeNull();
    });
  });

  describe('data export', () => {
    it('should export data as JSON string', () => {
      const { result } = renderHook(() => useAnalyticsStore());

      act(() => {
        result.current.initialize();
        result.current.trackPageView('poem-input');
      });

      let exported: string = '';
      act(() => {
        exported = result.current.exportData();
      });

      expect(exported).toBeTruthy();
      const data = JSON.parse(exported);
      expect(data.exportDate).toBeDefined();
    });
  });

  describe('data clearing', () => {
    it('should clear analytics data', () => {
      const { result } = renderHook(() => useAnalyticsStore());

      act(() => {
        result.current.initialize();
        result.current.trackPageView('poem-input');
        result.current.refreshAggregate();
      });

      act(() => {
        result.current.clearData();
      });

      expect(result.current.aggregate).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset the store to initial state', () => {
      const { result } = renderHook(() => useAnalyticsStore());

      act(() => {
        result.current.initialize();
        result.current.disable();
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.enabled).toBe(true);
      expect(result.current.initialized).toBe(false);
    });
  });

  describe('selectors', () => {
    it('selectAnalyticsEnabled should return enabled state', () => {
      const { result } = renderHook(() => useAnalyticsStore());
      expect(selectAnalyticsEnabled(result.current)).toBe(true);
    });

    it('selectDoNotTrackDetected should return DNT state', () => {
      const { result } = renderHook(() => useAnalyticsStore());
      expect(selectDoNotTrackDetected(result.current)).toBe(false);
    });

    it('selectAnalyticsInitialized should return initialized state', () => {
      const { result } = renderHook(() => useAnalyticsStore());
      expect(selectAnalyticsInitialized(result.current)).toBe(false);

      act(() => {
        result.current.initialize();
      });

      expect(selectAnalyticsInitialized(result.current)).toBe(true);
    });

    it('selectAnalyticsActive should return true when enabled and no DNT', () => {
      const { result } = renderHook(() => useAnalyticsStore());
      expect(selectAnalyticsActive(result.current)).toBe(true);
    });

    it('selectAnalyticsActive should return false when disabled', () => {
      const { result } = renderHook(() => useAnalyticsStore());

      act(() => {
        result.current.disable();
      });

      expect(selectAnalyticsActive(result.current)).toBe(false);
    });

    it('selectTotalPageViews should return 0 when no aggregate', () => {
      const { result } = renderHook(() => useAnalyticsStore());
      expect(selectTotalPageViews(result.current)).toBe(0);
    });

    it('selectTotalFeatureUsage should return 0 when no aggregate', () => {
      const { result } = renderHook(() => useAnalyticsStore());
      expect(selectTotalFeatureUsage(result.current)).toBe(0);
    });

    it('selectTotalErrors should return 0 when no aggregate', () => {
      const { result } = renderHook(() => useAnalyticsStore());
      expect(selectTotalErrors(result.current)).toBe(0);
    });
  });
});
