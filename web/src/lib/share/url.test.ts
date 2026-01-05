/**
 * Tests for share URL utilities
 *
 * @module lib/share/url.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  extractShareDataFromUrl,
  hasShareDataInUrl,
  clearShareDataFromUrl,
  checkShareUrl,
  SHARE_PARAM_NAME,
} from './url';

describe('Share URL Utilities', () => {
  // Save original location
  const originalLocation = window.location;

  beforeEach(() => {
    // Reset location before each test
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://example.com/',
        origin: 'https://example.com',
        pathname: '/',
        hash: '',
        search: '',
      },
      writable: true,
    });

    // Mock history.replaceState
    vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  describe('extractShareDataFromUrl', () => {
    it('should extract share data from hash fragment', () => {
      window.location.hash = '#share=abc123';

      const data = extractShareDataFromUrl();

      expect(data).toBe('abc123');
    });

    it('should extract share data from query parameters', () => {
      window.location.search = '?share=xyz789';

      const data = extractShareDataFromUrl();

      expect(data).toBe('xyz789');
    });

    it('should prefer hash fragment over query parameters', () => {
      window.location.hash = '#share=fromHash';
      window.location.search = '?share=fromQuery';

      const data = extractShareDataFromUrl();

      expect(data).toBe('fromHash');
    });

    it('should return null when no share data is present', () => {
      window.location.hash = '';
      window.location.search = '';

      const data = extractShareDataFromUrl();

      expect(data).toBeNull();
    });

    it('should handle hash with other parameters', () => {
      window.location.hash = '#other=value&share=abc123&another=thing';

      const data = extractShareDataFromUrl();

      expect(data).toBe('abc123');
    });

    it('should handle URL-encoded share data', () => {
      window.location.hash = '#share=abc%2B123%3D%3D';

      const data = extractShareDataFromUrl();

      expect(data).toBe('abc+123==');
    });
  });

  describe('hasShareDataInUrl', () => {
    it('should return true when share data exists in hash', () => {
      window.location.hash = '#share=abc123';

      expect(hasShareDataInUrl()).toBe(true);
    });

    it('should return true when share data exists in query', () => {
      window.location.search = '?share=xyz789';

      expect(hasShareDataInUrl()).toBe(true);
    });

    it('should return false when no share data exists', () => {
      window.location.hash = '';
      window.location.search = '';

      expect(hasShareDataInUrl()).toBe(false);
    });

    it('should return false when hash has other parameters but not share', () => {
      window.location.hash = '#other=value';

      expect(hasShareDataInUrl()).toBe(false);
    });
  });

  describe('clearShareDataFromUrl', () => {
    it('should clear share data from hash', () => {
      window.location.hash = '#share=abc123';
      window.location.href = 'https://example.com/#share=abc123';

      clearShareDataFromUrl();

      expect(window.history.replaceState).toHaveBeenCalled();
    });

    it('should clear share data from query parameters', () => {
      window.location.search = '?share=xyz789';
      window.location.href = 'https://example.com/?share=xyz789';

      clearShareDataFromUrl();

      expect(window.history.replaceState).toHaveBeenCalled();
    });

    it('should preserve other hash parameters', () => {
      window.location.hash = '#other=value&share=abc123';
      window.location.href = 'https://example.com/#other=value&share=abc123';

      clearShareDataFromUrl();

      expect(window.history.replaceState).toHaveBeenCalled();
      const call = (window.history.replaceState as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[2]).toContain('other=value');
      expect(call[2]).not.toContain('share=');
    });

    it('should not update URL when no share data present', () => {
      window.location.hash = '';
      window.location.search = '';
      window.location.href = 'https://example.com/';

      clearShareDataFromUrl();

      expect(window.history.replaceState).not.toHaveBeenCalled();
    });
  });

  describe('checkShareUrl', () => {
    it('should detect share data in hash', () => {
      window.location.hash = '#share=abc123';

      const result = checkShareUrl();

      expect(result.hasShareData).toBe(true);
      expect(result.encodedData).toBe('abc123');
      expect(result.source).toBe('hash');
    });

    it('should detect share data in query', () => {
      window.location.search = '?share=xyz789';

      const result = checkShareUrl();

      expect(result.hasShareData).toBe(true);
      expect(result.encodedData).toBe('xyz789');
      expect(result.source).toBe('query');
    });

    it('should return no share data when not present', () => {
      window.location.hash = '';
      window.location.search = '';

      const result = checkShareUrl();

      expect(result.hasShareData).toBe(false);
      expect(result.encodedData).toBeNull();
      expect(result.source).toBeNull();
    });

    it('should prefer hash over query', () => {
      window.location.hash = '#share=hashData';
      window.location.search = '?share=queryData';

      const result = checkShareUrl();

      expect(result.hasShareData).toBe(true);
      expect(result.encodedData).toBe('hashData');
      expect(result.source).toBe('hash');
    });
  });

  describe('SHARE_PARAM_NAME', () => {
    it('should be "share"', () => {
      expect(SHARE_PARAM_NAME).toBe('share');
    });
  });
});
