/**
 * Tests for project types
 *
 * @module lib/project/types.test
 */

import { describe, it, expect } from 'vitest';
import {
  CURRENT_SCHEMA_VERSION,
  MIN_SUPPORTED_VERSION,
  takeToMetadata,
  metadataToTake,
  ProjectImportError,
} from './types';
import type { RecordingTake } from '../../stores/types';
import type { RecordingMetadata } from './types';

describe('project types', () => {
  describe('schema versions', () => {
    it('should have valid current schema version', () => {
      expect(CURRENT_SCHEMA_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have valid minimum supported version', () => {
      expect(MIN_SUPPORTED_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have min version less than or equal to current', () => {
      const [minMajor, minMinor, minPatch] = MIN_SUPPORTED_VERSION.split('.').map(Number);
      const [curMajor, curMinor, curPatch] = CURRENT_SCHEMA_VERSION.split('.').map(Number);

      const minNum = minMajor * 10000 + minMinor * 100 + minPatch;
      const curNum = curMajor * 10000 + curMinor * 100 + curPatch;

      expect(minNum).toBeLessThanOrEqual(curNum);
    });
  });

  describe('takeToMetadata', () => {
    it('should convert RecordingTake to RecordingMetadata', () => {
      const take: RecordingTake = {
        id: 'take-123',
        blobUrl: 'blob:http://localhost/abc123',
        duration: 30.5,
        timestamp: 1704067200000,
        melodyVersionId: 'melody-v1',
        lyricVersionId: 'lyric-v1',
        name: 'My Recording',
      };

      const metadata = takeToMetadata(take);

      expect(metadata).toEqual({
        id: 'take-123',
        duration: 30.5,
        timestamp: 1704067200000,
        melodyVersionId: 'melody-v1',
        lyricVersionId: 'lyric-v1',
        name: 'My Recording',
      });

      // Should not include blobUrl
      expect('blobUrl' in metadata).toBe(false);
    });

    it('should handle take without optional fields', () => {
      const take: RecordingTake = {
        id: 'take-456',
        blobUrl: 'blob:http://localhost/def456',
        duration: 15.0,
        timestamp: 1704067300000,
      };

      const metadata = takeToMetadata(take);

      expect(metadata).toEqual({
        id: 'take-456',
        duration: 15.0,
        timestamp: 1704067300000,
        melodyVersionId: undefined,
        lyricVersionId: undefined,
        name: undefined,
      });
    });
  });

  describe('metadataToTake', () => {
    it('should convert RecordingMetadata to RecordingTake', () => {
      const metadata: RecordingMetadata = {
        id: 'take-789',
        duration: 45.0,
        timestamp: 1704067400000,
        melodyVersionId: 'melody-v2',
        lyricVersionId: 'lyric-v2',
        name: 'Another Recording',
      };

      const take = metadataToTake(metadata);

      expect(take).toEqual({
        id: 'take-789',
        blobUrl: '', // Empty blob URL since audio is not preserved
        duration: 45.0,
        timestamp: 1704067400000,
        melodyVersionId: 'melody-v2',
        lyricVersionId: 'lyric-v2',
        name: 'Another Recording',
      });
    });

    it('should set empty blobUrl for restored take', () => {
      const metadata: RecordingMetadata = {
        id: 'take-abc',
        duration: 20.0,
        timestamp: 1704067500000,
      };

      const take = metadataToTake(metadata);

      expect(take.blobUrl).toBe('');
    });
  });

  describe('ProjectImportError', () => {
    it('should create error with message and errors array', () => {
      const error = new ProjectImportError('Import failed', ['Error 1', 'Error 2']);

      expect(error.message).toBe('Import failed');
      expect(error.errors).toEqual(['Error 1', 'Error 2']);
      expect(error.name).toBe('ProjectImportError');
    });

    it('should be an instance of Error', () => {
      const error = new ProjectImportError('Test', []);

      expect(error).toBeInstanceOf(Error);
    });
  });
});
