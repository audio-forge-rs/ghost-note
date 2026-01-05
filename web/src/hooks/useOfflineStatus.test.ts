/**
 * Tests for useOfflineStatus and useNetworkStatus Hooks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOfflineStatus, useNetworkStatus } from './useOfflineStatus';

// Mock the service worker module
vi.mock('@/lib/serviceWorker', () => ({
  initServiceWorker: vi.fn(() => vi.fn()),
  updateServiceWorker: vi.fn(() => Promise.resolve()),
  isServiceWorkerSupported: vi.fn(() => true),
}));

describe('useNetworkStatus', () => {
  const originalOnLine = navigator.onLine;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: originalOnLine,
    });
  });

  it('returns true when online', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current).toBe(true);
  });

  it('returns false when offline', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current).toBe(false);
  });

  it('updates when going offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current).toBe(true);

    // Simulate going offline
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current).toBe(false);
  });

  it('updates when going online', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current).toBe(false);

    // Simulate going online
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current).toBe(true);
  });

  it('calls onOnline callback when going online', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const onOnline = vi.fn();
    const { result } = renderHook(() => useNetworkStatus({ onOnline }));

    expect(result.current).toBe(false);

    // Simulate going online
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(onOnline).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onOffline callback when going offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    const onOffline = vi.fn();
    const { result } = renderHook(() => useNetworkStatus({ onOffline }));

    expect(result.current).toBe(true);

    // Simulate going offline
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
    });

    await waitFor(() => {
      expect(onOffline).toHaveBeenCalledTimes(1);
    });
  });

  it('polls for network status when pollingInterval is set', () => {
    vi.useFakeTimers();

    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    const { result } = renderHook(() => useNetworkStatus({ pollingInterval: 1000 }));

    expect(result.current).toBe(true);

    // Change online status without triggering event
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    // Advance timer - polling should detect the change
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Result should update via polling
    expect(result.current).toBe(false);

    vi.useRealTimers();
  });

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useNetworkStatus());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});

describe('useOfflineStatus', () => {
  const originalOnLine = navigator.onLine;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: originalOnLine,
    });
  });

  it('returns online status', () => {
    const { result } = renderHook(() => useOfflineStatus());

    expect(result.current.isOnline).toBe(true);
  });

  it('returns offline status when offline', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => useOfflineStatus());

    expect(result.current.isOnline).toBe(false);
  });

  it('provides updateApp function', () => {
    const { result } = renderHook(() => useOfflineStatus());

    expect(typeof result.current.updateApp).toBe('function');
  });

  it('provides dismissUpdate function', () => {
    const { result } = renderHook(() => useOfflineStatus());

    expect(typeof result.current.dismissUpdate).toBe('function');
  });

  it('provides checkOnlineStatus function', () => {
    const { result } = renderHook(() => useOfflineStatus());

    expect(typeof result.current.checkOnlineStatus).toBe('function');
  });

  it('checkOnlineStatus returns current status', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    const { result } = renderHook(() => useOfflineStatus());

    expect(result.current.checkOnlineStatus()).toBe(true);

    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    expect(result.current.checkOnlineStatus()).toBe(false);
  });

  it('updates when going offline', () => {
    const { result } = renderHook(() => useOfflineStatus());

    expect(result.current.isOnline).toBe(true);

    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
  });

  it('updates when going online', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => useOfflineStatus());

    expect(result.current.isOnline).toBe(false);

    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('initializes with correct defaults', () => {
    const { result } = renderHook(() => useOfflineStatus());

    expect(result.current.isOfflineReady).toBe(false);
    expect(result.current.needsUpdate).toBe(false);
    expect(result.current.isServiceWorkerActive).toBe(false);
    expect(result.current.serviceWorkerError).toBe(null);
  });

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useOfflineStatus());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});
