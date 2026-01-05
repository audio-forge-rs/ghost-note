/**
 * Tests for project validation
 *
 * @module lib/project/validate.test
 */

import { describe, it, expect } from 'vitest';
import { validateProjectData, parseAndValidate } from './validate';
import { CURRENT_SCHEMA_VERSION } from './types';
import type { ProjectData } from './types';

// Helper to create a valid project data object
function createValidProjectData(): ProjectData {
  return {
    version: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    poem: {
      original: 'Roses are red\nViolets are blue',
      versions: [
        {
          id: 'v_123456789_abc1234',
          lyrics: 'Roses are red\nViolets are blue\nSugar is sweet',
          timestamp: Date.now(),
          changes: [
            {
              type: 'modify',
              start: 0,
              end: 28,
              oldText: 'Roses are red\nViolets are blue',
              newText: 'Roses are red\nViolets are blue\nSugar is sweet',
            },
          ],
          description: 'Added third line',
        },
      ],
      currentVersionIndex: 0,
    },
    analysis: null,
    melody: {
      data: null,
      abcNotation: null,
    },
    settings: {
      tempo: 100,
      volume: 0.8,
      loop: false,
      key: 'C',
      timeSignature: '4/4',
    },
    recordings: [],
  };
}

describe('validateProjectData', () => {
  describe('valid data', () => {
    it('should accept valid project data', () => {
      const data = createValidProjectData();
      const result = validateProjectData(data);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept project with empty poem', () => {
      const data = createValidProjectData();
      data.poem.original = '';
      data.poem.versions = [];
      data.poem.currentVersionIndex = -1;

      const result = validateProjectData(data);

      expect(result.valid).toBe(true);
    });

    it('should accept project with analysis data', () => {
      const data = createValidProjectData();
      data.analysis = {
        meta: { lineCount: 2, stanzaCount: 1, wordCount: 6, syllableCount: 8 },
        structure: { stanzas: [] },
        prosody: {
          meter: {
            pattern: '0101',
            detectedMeter: 'iambic',
            footType: 'iamb',
            feetPerLine: 2,
            confidence: 0.8,
            deviations: [],
          },
          rhyme: { scheme: 'AA', rhymeGroups: {}, internalRhymes: [] },
          regularity: 0.9,
        },
        emotion: {
          overallSentiment: 0.5,
          arousal: 0.5,
          dominantEmotions: [],
          emotionalArc: [],
          suggestedMusicParams: { mode: 'major', tempoRange: [80, 120], register: 'middle' },
        },
        problems: [],
        melodySuggestions: {
          timeSignature: '4/4',
          tempo: 100,
          key: 'C',
          mode: 'major',
          phraseBreaks: [],
        },
      };

      const result = validateProjectData(data);

      expect(result.valid).toBe(true);
    });

    it('should accept project with recordings', () => {
      const data = createValidProjectData();
      data.recordings = [
        {
          id: 'rec-1',
          duration: 30.5,
          timestamp: Date.now(),
          name: 'Take 1',
        },
        {
          id: 'rec-2',
          duration: 45.0,
          timestamp: Date.now(),
          melodyVersionId: 'melody-v1',
          lyricVersionId: 'lyric-v1',
        },
      ];

      const result = validateProjectData(data);

      expect(result.valid).toBe(true);
    });
  });

  describe('invalid version', () => {
    it('should reject missing version', () => {
      const data = createValidProjectData();
      delete (data as unknown as Record<string, unknown>).version;

      const result = validateProjectData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: version');
    });

    it('should reject non-string version', () => {
      const data = createValidProjectData() as unknown as Record<string, unknown>;
      data.version = 123;

      const result = validateProjectData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Field "version" must be a string');
    });

    it('should reject unsupported version', () => {
      const data = createValidProjectData();
      data.version = '99.99.99';

      const result = validateProjectData(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Unsupported schema version'))).toBe(true);
    });
  });

  describe('invalid exportedAt', () => {
    it('should reject missing exportedAt', () => {
      const data = createValidProjectData();
      delete (data as unknown as Record<string, unknown>).exportedAt;

      const result = validateProjectData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: exportedAt');
    });

    it('should reject invalid date string', () => {
      const data = createValidProjectData();
      data.exportedAt = 'not-a-date';

      const result = validateProjectData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Field "exportedAt" must be a valid ISO date string');
    });
  });

  describe('invalid poem', () => {
    it('should reject missing poem', () => {
      const data = createValidProjectData();
      delete (data as unknown as Record<string, unknown>).poem;

      const result = validateProjectData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: poem');
    });

    it('should reject non-object poem', () => {
      const data = createValidProjectData() as unknown as Record<string, unknown>;
      data.poem = 'not an object';

      const result = validateProjectData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Field "poem" must be an object');
    });

    it('should reject missing poem.original', () => {
      const data = createValidProjectData();
      delete (data.poem as Record<string, unknown>).original;

      const result = validateProjectData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: poem.original');
    });

    it('should reject non-array poem.versions', () => {
      const data = createValidProjectData();
      (data.poem as Record<string, unknown>).versions = 'not an array';

      const result = validateProjectData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Field "poem.versions" must be an array');
    });

    it('should reject invalid version in versions array', () => {
      const data = createValidProjectData();
      data.poem.versions = [
        {
          id: '', // Empty ID should fail
          lyrics: 'Test',
          timestamp: Date.now(),
          changes: [],
        },
      ];

      const result = validateProjectData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('poem.versions[0].id must be a non-empty string');
    });

    it('should reject non-integer currentVersionIndex', () => {
      const data = createValidProjectData();
      data.poem.currentVersionIndex = 1.5;

      const result = validateProjectData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Field "poem.currentVersionIndex" must be an integer');
    });
  });

  describe('invalid settings', () => {
    it('should reject missing settings', () => {
      const data = createValidProjectData();
      delete (data as unknown as Record<string, unknown>).settings;

      const result = validateProjectData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: settings');
    });

    it('should reject tempo out of range', () => {
      const data = createValidProjectData();
      data.settings.tempo = 500;

      const result = validateProjectData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Field "settings.tempo" must be a number between 20 and 300');
    });

    it('should reject volume out of range', () => {
      const data = createValidProjectData();
      data.settings.volume = 1.5;

      const result = validateProjectData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Field "settings.volume" must be a number between 0 and 1');
    });

    it('should reject non-boolean loop', () => {
      const data = createValidProjectData() as unknown as Record<string, unknown>;
      (data.settings as Record<string, unknown>).loop = 'true';

      const result = validateProjectData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Field "settings.loop" must be a boolean');
    });
  });

  describe('warnings for optional fields', () => {
    it('should warn about invalid analysis structure', () => {
      const data = createValidProjectData();
      data.analysis = { invalid: 'structure' } as unknown as typeof data.analysis;

      const result = validateProjectData(data);

      // Should still be valid, but with warnings
      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.includes('Analysis data'))).toBe(true);
    });

    it('should warn about invalid recording entries', () => {
      const data = createValidProjectData();
      data.recordings = [
        { invalid: 'recording' } as unknown as (typeof data.recordings)[0],
      ];

      const result = validateProjectData(data);

      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.includes('recordings[0]'))).toBe(true);
    });
  });

  describe('non-object data', () => {
    it('should reject null data', () => {
      const result = validateProjectData(null);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Project data must be a non-null object');
    });

    it('should reject non-object data', () => {
      const result = validateProjectData('not an object');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Project data must be a non-null object');
    });

    it('should reject array data', () => {
      const result = validateProjectData([]);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Project data must be a non-null object');
    });
  });
});

describe('parseAndValidate', () => {
  it('should parse and validate valid JSON', () => {
    const data = createValidProjectData();
    const json = JSON.stringify(data);

    const result = parseAndValidate(json);

    expect(result.valid).toBe(true);
    expect(result.data).toEqual(data);
  });

  it('should return errors for invalid JSON', () => {
    const result = parseAndValidate('not valid json');

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Invalid JSON'))).toBe(true);
    expect(result.data).toBeUndefined();
  });

  it('should return errors for valid JSON but invalid project data', () => {
    const result = parseAndValidate('{"foo": "bar"}');

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.data).toBeUndefined();
  });

  it('should handle empty object', () => {
    const result = parseAndValidate('{}');

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
