/**
 * Tests for share decoding utilities
 *
 * @module lib/share/decode.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  decodeFromBase64,
  validateShareData,
  decodeShareData,
  importShareData,
  decodeAndImportShareData,
} from './decode';
import { encodeToBase64, encodeShareData } from './encode';
import { SHARE_SCHEMA_VERSION } from './types';
import type { PoemOnlyShareData, WithAnalysisShareData, FullShareData } from './types';
import { usePoemStore } from '../../stores/usePoemStore';
import { useAnalysisStore } from '../../stores/useAnalysisStore';
import { useMelodyStore } from '../../stores/useMelodyStore';
import { createDefaultPoemAnalysis } from '../../types';

// Create mock analysis using the factory function
const mockAnalysis = createDefaultPoemAnalysis();

describe('Share Decoding', () => {
  beforeEach(() => {
    // Reset stores before each test
    usePoemStore.getState().reset();
    useAnalysisStore.getState().reset();
    useMelodyStore.getState().reset();
  });

  describe('decodeFromBase64', () => {
    it('should decode a base64 encoded string', () => {
      const original = 'Hello, World!';
      const encoded = encodeToBase64(original);
      const decoded = decodeFromBase64(encoded);

      expect(decoded).toBe(original);
    });

    it('should decode unicode characters correctly', () => {
      const original = 'Hello, 世界! 🌍';
      const encoded = encodeToBase64(original);
      const decoded = decodeFromBase64(encoded);

      expect(decoded).toBe(original);
    });

    it('should handle URL-safe base64 characters', () => {
      const original = 'Test+with/special=chars';
      const encoded = encodeToBase64(original);
      const decoded = decodeFromBase64(encoded);

      expect(decoded).toBe(original);
    });
  });

  describe('validateShareData', () => {
    it('should validate poem-only share data', () => {
      const data: PoemOnlyShareData = {
        version: SHARE_SCHEMA_VERSION,
        mode: 'poem-only',
        poem: 'Roses are red',
      };

      const result = validateShareData(data);

      expect(result.valid).toBe(true);
    });

    it('should reject poem-only with empty poem', () => {
      const data = {
        version: SHARE_SCHEMA_VERSION,
        mode: 'poem-only',
        poem: '',
      };

      const result = validateShareData(data);

      expect(result.valid).toBe(false);
    });

    it('should validate with-analysis share data', () => {
      const data: WithAnalysisShareData = {
        version: SHARE_SCHEMA_VERSION,
        mode: 'with-analysis',
        poem: 'Roses are red',
        analysis: mockAnalysis,
      };

      const result = validateShareData(data);

      expect(result.valid).toBe(true);
    });

    it('should reject with-analysis without analysis', () => {
      const data = {
        version: SHARE_SCHEMA_VERSION,
        mode: 'with-analysis',
        poem: 'Roses are red',
      };

      const result = validateShareData(data);

      expect(result.valid).toBe(false);
    });

    it('should validate full share data', () => {
      const data: FullShareData = {
        version: SHARE_SCHEMA_VERSION,
        mode: 'full',
        poem: {
          original: 'Roses are red',
          versions: [],
          currentVersionIndex: -1,
        },
        analysis: null,
        melody: null,
      };

      const result = validateShareData(data);

      expect(result.valid).toBe(true);
    });

    it('should reject invalid mode', () => {
      const data = {
        version: SHARE_SCHEMA_VERSION,
        mode: 'invalid-mode',
        poem: 'Test',
      };

      const result = validateShareData(data);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid share mode');
    });

    it('should reject missing version', () => {
      const data = {
        mode: 'poem-only',
        poem: 'Test',
      };

      const result = validateShareData(data);

      expect(result.valid).toBe(false);
    });

    it('should reject null data', () => {
      const result = validateShareData(null);

      expect(result.valid).toBe(false);
    });
  });

  describe('decodeShareData', () => {
    it('should decode valid poem-only share data', async () => {
      const data: PoemOnlyShareData = {
        version: SHARE_SCHEMA_VERSION,
        mode: 'poem-only',
        poem: 'Roses are red,\nViolets are blue.',
      };

      const { encoded } = await encodeShareData(data, false);
      const result = await decodeShareData(encoded);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.mode).toBe('poem-only');
      expect((result.data as PoemOnlyShareData).poem).toBe(data.poem);
    });

    it('should decode valid with-analysis share data', async () => {
      const data: WithAnalysisShareData = {
        version: SHARE_SCHEMA_VERSION,
        mode: 'with-analysis',
        poem: 'Roses are red',
        analysis: mockAnalysis,
      };

      const { encoded } = await encodeShareData(data, false);
      const result = await decodeShareData(encoded);

      expect(result.success).toBe(true);
      expect(result.data?.mode).toBe('with-analysis');
    });

    it('should decode valid full share data', async () => {
      const data: FullShareData = {
        version: SHARE_SCHEMA_VERSION,
        mode: 'full',
        poem: {
          original: 'Roses are red',
          versions: [],
          currentVersionIndex: -1,
        },
        analysis: mockAnalysis,
        melody: null,
      };

      const { encoded } = await encodeShareData(data, false);
      const result = await decodeShareData(encoded);

      expect(result.success).toBe(true);
      expect(result.data?.mode).toBe('full');
    });

    it('should fail on invalid base64', async () => {
      const result = await decodeShareData('not-valid-base64!!!');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should fail on invalid JSON', async () => {
      const invalidJson = 'not valid json {{{';
      const encoded = encodeToBase64(invalidJson);
      const result = await decodeShareData(encoded);

      expect(result.success).toBe(false);
      expect(result.error).toContain('could not parse JSON');
    });
  });

  describe('importShareData', () => {
    it('should import poem-only share data', () => {
      const data: PoemOnlyShareData = {
        version: SHARE_SCHEMA_VERSION,
        mode: 'poem-only',
        poem: 'Roses are red,\nViolets are blue.',
      };

      const success = importShareData(data);

      expect(success).toBe(true);
      expect(usePoemStore.getState().original).toBe(data.poem);
    });

    it('should import with-analysis share data', () => {
      const data: WithAnalysisShareData = {
        version: SHARE_SCHEMA_VERSION,
        mode: 'with-analysis',
        poem: 'Roses are red',
        analysis: mockAnalysis,
      };

      const success = importShareData(data);

      expect(success).toBe(true);
      expect(usePoemStore.getState().original).toBe(data.poem);
      expect(useAnalysisStore.getState().analysis).toEqual(mockAnalysis);
    });

    it('should import full share data', () => {
      const data: FullShareData = {
        version: SHARE_SCHEMA_VERSION,
        mode: 'full',
        poem: {
          original: 'Roses are red',
          versions: [
            {
              id: 'v1',
              lyrics: 'Roses are crimson',
              timestamp: Date.now(),
              changes: [],
            },
          ],
          currentVersionIndex: 0,
        },
        analysis: mockAnalysis,
        melody: null,
      };

      const success = importShareData(data);

      expect(success).toBe(true);
      expect(usePoemStore.getState().original).toBe(data.poem.original);
      expect(usePoemStore.getState().versions.length).toBe(1);
      expect(usePoemStore.getState().currentVersionIndex).toBe(0);
      expect(useAnalysisStore.getState().analysis).toEqual(mockAnalysis);
    });

    it('should clear existing data by default', () => {
      // Set up existing data
      usePoemStore.getState().setPoem('Old poem');
      useAnalysisStore.getState().setAnalysis(mockAnalysis);

      const data: PoemOnlyShareData = {
        version: SHARE_SCHEMA_VERSION,
        mode: 'poem-only',
        poem: 'New poem',
      };

      const success = importShareData(data);

      expect(success).toBe(true);
      expect(usePoemStore.getState().original).toBe('New poem');
      expect(useAnalysisStore.getState().analysis).toBeNull();
    });

    it('should preserve existing data when clearExisting is false', () => {
      // Set up existing data
      usePoemStore.getState().setPoem('Old poem');
      useAnalysisStore.getState().setAnalysis(mockAnalysis);

      const data: PoemOnlyShareData = {
        version: SHARE_SCHEMA_VERSION,
        mode: 'poem-only',
        poem: 'New poem',
      };

      const success = importShareData(data, { clearExisting: false });

      expect(success).toBe(true);
      // Poem is overwritten
      expect(usePoemStore.getState().original).toBe('New poem');
      // But analysis is preserved since clearExisting is false
      // Note: poem-only mode doesn't import analysis, so existing analysis stays
      expect(useAnalysisStore.getState().analysis).toEqual(mockAnalysis);
    });
  });

  describe('decodeAndImportShareData', () => {
    it('should decode and import valid share data', async () => {
      const data: PoemOnlyShareData = {
        version: SHARE_SCHEMA_VERSION,
        mode: 'poem-only',
        poem: 'Roses are red,\nViolets are blue.',
      };

      const { encoded } = await encodeShareData(data, false);
      const result = await decodeAndImportShareData(encoded);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(true);
      expect(result.mode).toBe('poem-only');
      expect(usePoemStore.getState().original).toBe(data.poem);
    });

    it('should fail on invalid data without importing', async () => {
      const result = await decodeAndImportShareData('invalid-data');

      expect(result.success).toBe(false);
      expect(result.imported).toBe(false);
      expect(usePoemStore.getState().original).toBe('');
    });
  });
});
