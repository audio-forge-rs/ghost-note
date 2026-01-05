/**
 * useAnnouncer Hook Tests
 *
 * Tests for the screen reader announcement hook.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAnnouncer, cleanupLiveRegions } from './useAnnouncer';

describe('useAnnouncer', () => {
  beforeEach(() => {
    // Clean up any existing live regions
    cleanupLiveRegions();
  });

  afterEach(() => {
    // Clean up after each test
    cleanupLiveRegions();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('announce', () => {
    it('should create a live region and announce message', async () => {
      const { result } = renderHook(() => useAnnouncer());

      act(() => {
        result.current.announce('Test announcement');
      });

      await waitFor(
        () => {
          const liveRegion = document.getElementById('ghost-note-live-region');
          expect(liveRegion).not.toBeNull();
          expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
          expect(liveRegion?.getAttribute('role')).toBe('status');
        },
        { timeout: 1000 }
      );
    });

    it('should announce with polite priority by default', async () => {
      const { result } = renderHook(() => useAnnouncer());

      act(() => {
        result.current.announce('Polite message');
      });

      await waitFor(
        () => {
          const liveRegion = document.getElementById('ghost-note-live-region');
          expect(liveRegion).not.toBeNull();
          expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
        },
        { timeout: 1000 }
      );
    });

    it('should announce with assertive priority when specified', async () => {
      const { result } = renderHook(() => useAnnouncer());

      act(() => {
        result.current.announce('Urgent message', { priority: 'assertive' });
      });

      await waitFor(
        () => {
          const assertiveRegion = document.getElementById(
            'ghost-note-assertive-region'
          );
          expect(assertiveRegion).not.toBeNull();
          expect(assertiveRegion?.getAttribute('aria-live')).toBe('assertive');
        },
        { timeout: 1000 }
      );
    });

    it('should handle delayed announcements', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useAnnouncer());

      act(() => {
        result.current.announce('Delayed message', { delay: 500 });
      });

      // Message should not be announced yet
      const liveRegionBefore = document.getElementById('ghost-note-live-region');
      expect(liveRegionBefore?.textContent).not.toBe('Delayed message');

      // Advance timers
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      // Live region should exist now
      const liveRegion = document.getElementById('ghost-note-live-region');
      expect(liveRegion).not.toBeNull();

      vi.useRealTimers();
    });

    it('should visually hide the live region', async () => {
      const { result } = renderHook(() => useAnnouncer());

      act(() => {
        result.current.announce('Hidden message');
      });

      await waitFor(
        () => {
          const liveRegion = document.getElementById('ghost-note-live-region');
          expect(liveRegion).not.toBeNull();
          // Check for visually hidden styles
          const style = liveRegion?.style;
          expect(style?.position).toBe('absolute');
          expect(style?.width).toBe('1px');
          expect(style?.height).toBe('1px');
          expect(style?.overflow).toBe('hidden');
        },
        { timeout: 1000 }
      );
    });
  });

  describe('clearAnnouncements', () => {
    it('should clear announcement content', async () => {
      const { result } = renderHook(() => useAnnouncer());

      act(() => {
        result.current.announce('Message to clear');
      });

      await waitFor(
        () => {
          const liveRegion = document.getElementById('ghost-note-live-region');
          expect(liveRegion).not.toBeNull();
        },
        { timeout: 1000 }
      );

      act(() => {
        result.current.clearAnnouncements();
      });

      await waitFor(
        () => {
          const liveRegion = document.getElementById('ghost-note-live-region');
          expect(liveRegion?.textContent).toBe('');
        },
        { timeout: 1000 }
      );
    });
  });

  describe('cleanupLiveRegions', () => {
    it('should remove all live regions from DOM', async () => {
      const { result } = renderHook(() => useAnnouncer());

      // Create both polite and assertive regions
      act(() => {
        result.current.announce('Polite');
      });

      await waitFor(
        () => {
          expect(
            document.getElementById('ghost-note-live-region')
          ).not.toBeNull();
        },
        { timeout: 1000 }
      );

      act(() => {
        result.current.announce('Assertive', { priority: 'assertive' });
      });

      await waitFor(
        () => {
          expect(
            document.getElementById('ghost-note-assertive-region')
          ).not.toBeNull();
        },
        { timeout: 1000 }
      );

      // Clean up
      cleanupLiveRegions();

      expect(document.getElementById('ghost-note-live-region')).toBeNull();
      expect(document.getElementById('ghost-note-assertive-region')).toBeNull();
    });
  });

  describe('aria attributes', () => {
    it('should have correct aria-atomic attribute', async () => {
      const { result } = renderHook(() => useAnnouncer());

      act(() => {
        result.current.announce('Test');
      });

      await waitFor(
        () => {
          const liveRegion = document.getElementById('ghost-note-live-region');
          expect(liveRegion?.getAttribute('aria-atomic')).toBe('true');
        },
        { timeout: 1000 }
      );
    });

    it('should have correct aria-relevant attribute', async () => {
      const { result } = renderHook(() => useAnnouncer());

      act(() => {
        result.current.announce('Test');
      });

      await waitFor(
        () => {
          const liveRegion = document.getElementById('ghost-note-live-region');
          expect(liveRegion?.getAttribute('aria-relevant')).toBe('additions text');
        },
        { timeout: 1000 }
      );
    });
  });
});
