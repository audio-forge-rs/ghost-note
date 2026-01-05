/**
 * Tests for share encoding utilities
 *
 * @module lib/share/encode.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  encodeToBase64,
  buildPoemOnlyShareData,
  buildWithAnalysisShareData,
  buildFullShareData,
  buildShareData,
  encodeShareData,
  generateShareUrl,
  copyShareUrlToClipboard,
} from './encode';
import { SHARE_SCHEMA_VERSION } from './types';
import { usePoemStore } from '../../stores/usePoemStore';
import { useAnalysisStore } from '../../stores/useAnalysisStore';
import { useMelodyStore } from '../../stores/useMelodyStore';
import { createDefaultPoemAnalysis } from '../../types';

// Mock clipboard API
const mockWriteText = vi.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

// Create mock analysis using the factory function
const mockAnalysis = createDefaultPoemAnalysis();

describe('Share Encoding', () => {
  beforeEach(() => {
    // Reset stores before each test
    usePoemStore.getState().reset();
    useAnalysisStore.getState().reset();
    useMelodyStore.getState().reset();
    mockWriteText.mockReset();
  });

  describe('encodeToBase64', () => {
    it('should encode a simple string to URL-safe base64', () => {
      const input = 'Hello, World!';
      const encoded = encodeToBase64(input);

      expect(encoded).toBeTruthy();
      expect(encoded).not.toContain('+');
      expect(encoded).not.toContain('/');
      expect(encoded).not.toContain('=');
    });

    it('should encode unicode characters correctly', () => {
      const input = 'Hello, 世界! 🌍';
      const encoded = encodeToBase64(input);

      expect(encoded).toBeTruthy();
      expect(encoded.length).toBeGreaterThan(0);
    });

    it('should encode JSON strings', () => {
      const data = { poem: 'Roses are red', mode: 'poem-only' };
      const input = JSON.stringify(data);
      const encoded = encodeToBase64(input);

      expect(encoded).toBeTruthy();
    });
  });

  describe('buildPoemOnlyShareData', () => {
    it('should build share data with just the poem', () => {
      const poem = 'Roses are red,\nViolets are blue.';
      usePoemStore.getState().setPoem(poem);

      const shareData = buildPoemOnlyShareData();

      expect(shareData.version).toBe(SHARE_SCHEMA_VERSION);
      expect(shareData.mode).toBe('poem-only');
      expect(shareData.poem).toBe(poem);
    });

    it('should return empty poem when no poem is set', () => {
      const shareData = buildPoemOnlyShareData();

      expect(shareData.poem).toBe('');
    });
  });

  describe('buildWithAnalysisShareData', () => {
    it('should return null when no analysis is available', () => {
      usePoemStore.getState().setPoem('Test poem');

      const shareData = buildWithAnalysisShareData();

      expect(shareData).toBeNull();
    });

    it('should build share data with poem and analysis', () => {
      const poem = 'Roses are red,\nViolets are blue.';
      usePoemStore.getState().setPoem(poem);
      useAnalysisStore.getState().setAnalysis(mockAnalysis);

      const shareData = buildWithAnalysisShareData();

      expect(shareData).not.toBeNull();
      expect(shareData?.version).toBe(SHARE_SCHEMA_VERSION);
      expect(shareData?.mode).toBe('with-analysis');
      expect(shareData?.poem).toBe(poem);
      expect(shareData?.analysis).toEqual(mockAnalysis);
    });
  });

  describe('buildFullShareData', () => {
    it('should build full share data with all content', () => {
      const poem = 'Roses are red,\nViolets are blue.';
      usePoemStore.getState().setPoem(poem);
      useAnalysisStore.getState().setAnalysis(mockAnalysis);

      const shareData = buildFullShareData();

      expect(shareData.version).toBe(SHARE_SCHEMA_VERSION);
      expect(shareData.mode).toBe('full');
      expect(shareData.poem.original).toBe(poem);
      expect(shareData.analysis).toEqual(mockAnalysis);
    });

    it('should include lyric versions', () => {
      const poem = 'Roses are red,\nViolets are blue.';
      usePoemStore.getState().setPoem(poem);
      usePoemStore.getState().addVersion('Roses are crimson,\nViolets are azure.', 'Style change');

      const shareData = buildFullShareData();

      expect(shareData.poem.versions.length).toBe(1);
      expect(shareData.poem.versions[0].lyrics).toBe('Roses are crimson,\nViolets are azure.');
    });
  });

  describe('buildShareData', () => {
    it('should build poem-only data', () => {
      usePoemStore.getState().setPoem('Test poem');

      const shareData = buildShareData('poem-only');

      expect(shareData?.mode).toBe('poem-only');
    });

    it('should build with-analysis data when analysis exists', () => {
      usePoemStore.getState().setPoem('Test poem');
      useAnalysisStore.getState().setAnalysis(mockAnalysis);

      const shareData = buildShareData('with-analysis');

      expect(shareData?.mode).toBe('with-analysis');
    });

    it('should return null for with-analysis when no analysis', () => {
      usePoemStore.getState().setPoem('Test poem');

      const shareData = buildShareData('with-analysis');

      expect(shareData).toBeNull();
    });

    it('should build full data', () => {
      usePoemStore.getState().setPoem('Test poem');

      const shareData = buildShareData('full');

      expect(shareData?.mode).toBe('full');
    });
  });

  describe('encodeShareData', () => {
    it('should encode share data without compression for small data', async () => {
      const shareData = {
        version: SHARE_SCHEMA_VERSION,
        mode: 'poem-only' as const,
        poem: 'Short poem',
      };

      const result = await encodeShareData(shareData, false);

      expect(result.encoded).toBeTruthy();
      expect(result.compressed).toBe(false);
      expect(result.size).toBeGreaterThan(0);
    });

    it('should encode without c: prefix for uncompressed data', async () => {
      const shareData = {
        version: SHARE_SCHEMA_VERSION,
        mode: 'poem-only' as const,
        poem: 'Short poem',
      };

      const result = await encodeShareData(shareData, false);

      expect(result.encoded.startsWith('c:')).toBe(false);
    });
  });

  describe('generateShareUrl', () => {
    it('should fail when no poem exists', async () => {
      const result = await generateShareUrl({ mode: 'poem-only' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No poem to share');
    });

    it('should generate a share URL for poem-only mode', async () => {
      usePoemStore.getState().setPoem('Roses are red,\nViolets are blue.');

      const result = await generateShareUrl({ mode: 'poem-only' });

      expect(result.success).toBe(true);
      expect(result.url).toBeTruthy();
      expect(result.url).toContain('#share=');
      expect(result.mode).toBe('poem-only');
    });

    it('should generate a share URL with query params when useFragment is false', async () => {
      usePoemStore.getState().setPoem('Roses are red');

      const result = await generateShareUrl({ mode: 'poem-only', useFragment: false });

      expect(result.success).toBe(true);
      expect(result.url).toContain('?share=');
    });

    it('should fail for with-analysis mode when no analysis exists', async () => {
      usePoemStore.getState().setPoem('Test poem');

      const result = await generateShareUrl({ mode: 'with-analysis' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Analysis is required');
    });

    it('should generate a share URL for with-analysis mode', async () => {
      usePoemStore.getState().setPoem('Roses are red');
      useAnalysisStore.getState().setAnalysis(mockAnalysis);

      const result = await generateShareUrl({ mode: 'with-analysis' });

      expect(result.success).toBe(true);
      expect(result.url).toBeTruthy();
      expect(result.mode).toBe('with-analysis');
    });

    it('should generate a share URL for full mode', async () => {
      usePoemStore.getState().setPoem('Roses are red');
      useAnalysisStore.getState().setAnalysis(mockAnalysis);

      const result = await generateShareUrl({ mode: 'full' });

      expect(result.success).toBe(true);
      expect(result.url).toBeTruthy();
      expect(result.mode).toBe('full');
    });
  });

  describe('copyShareUrlToClipboard', () => {
    it('should copy URL to clipboard', async () => {
      mockWriteText.mockResolvedValueOnce(undefined);
      const url = 'https://example.com/#share=abc123';

      const result = await copyShareUrlToClipboard(url);

      expect(result).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith(url);
    });

    it('should return false when clipboard write fails', async () => {
      mockWriteText.mockRejectedValueOnce(new Error('Permission denied'));
      const url = 'https://example.com/#share=abc123';

      // Mock execCommand fallback to fail
      const originalExecCommand = document.execCommand;
      document.execCommand = vi.fn().mockReturnValue(false);

      const result = await copyShareUrlToClipboard(url);

      expect(result).toBe(false);

      document.execCommand = originalExecCommand;
    });
  });
});
