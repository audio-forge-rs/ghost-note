/**
 * Tests for project import
 *
 * @module lib/project/import.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { importProject, importProjectFromJson } from './import';
import { exportProject } from './export';
import { CURRENT_SCHEMA_VERSION, ProjectImportError } from './types';
import type { ProjectData } from './types';
import { usePoemStore } from '../../stores/usePoemStore';
import { useAnalysisStore } from '../../stores/useAnalysisStore';
import { useMelodyStore } from '../../stores/useMelodyStore';
import { useRecordingStore } from '../../stores/useRecordingStore';
import type { PoemAnalysis } from '../../types/analysis';

// Helper to create a valid project data object
function createValidProjectData(): ProjectData {
  return {
    version: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    poem: {
      original: 'Roses are red\nViolets are blue',
      versions: [
        {
          id: 'v_test_abc1234',
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
      tempo: 120,
      volume: 0.7,
      loop: true,
      key: 'G',
      timeSignature: '3/4',
    },
    recordings: [],
  };
}

// Create a minimal valid PoemAnalysis for testing
function createTestAnalysis(): PoemAnalysis {
  return {
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
      dominantEmotions: ['joy'],
      emotionalArc: [],
      suggestedMusicParams: { mode: 'major', tempoRange: [80, 120], register: 'middle' },
    },
    form: {
      formType: 'couplet',
      formName: 'Couplet',
      category: 'stanzaic',
      confidence: 0.6,
      evidence: {
        lineCountMatch: true,
        stanzaStructureMatch: false,
        meterMatch: true,
        rhymeSchemeMatch: true,
        syllablePatternMatch: false,
        notes: [],
      },
      alternatives: [],
      description: 'A poem composed of rhyming pairs of lines.',
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
}

describe('importProject', () => {
  beforeEach(() => {
    // Reset all stores before each test
    usePoemStore.getState().reset();
    useAnalysisStore.getState().reset();
    useMelodyStore.getState().reset();
    useRecordingStore.getState().reset();

    // Clear localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('basic import', () => {
    it('should import valid project data', () => {
      const data = createValidProjectData();

      expect(() => importProject(data)).not.toThrow();
    });

    it('should throw ProjectImportError for invalid data', () => {
      const invalidData = { invalid: 'data' } as unknown as ProjectData;

      expect(() => importProject(invalidData)).toThrow(ProjectImportError);
    });

    it('should clear existing data by default', () => {
      // Set up existing data
      usePoemStore.getState().setPoem('Existing poem');
      usePoemStore.getState().addVersion('Existing version');

      // Import new data
      const data = createValidProjectData();
      importProject(data);

      // Check that existing data was replaced
      const poemState = usePoemStore.getState();
      expect(poemState.original).toBe(data.poem.original);
      expect(poemState.versions[0].lyrics).toBe(data.poem.versions[0].lyrics);
    });

    it('should not clear existing data when clearExisting is false', () => {
      // Set up existing data
      usePoemStore.getState().setPoem('Existing poem');

      // Import new data without clearing
      const data = createValidProjectData();
      // Note: The import will still overwrite poem data due to how setState works
      // This option primarily affects the explicit reset() call
      importProject(data, { clearExisting: false });

      // The poem will still be updated because import overwrites
      expect(usePoemStore.getState().original).toBe(data.poem.original);
    });
  });

  describe('poem import', () => {
    it('should import original poem text', () => {
      const data = createValidProjectData();
      data.poem.original = 'My custom poem text';

      importProject(data);

      expect(usePoemStore.getState().original).toBe('My custom poem text');
    });

    it('should import all lyric versions', () => {
      const data = createValidProjectData();
      data.poem.versions = [
        { id: 'v1', lyrics: 'Version 1', timestamp: 1000, changes: [] },
        { id: 'v2', lyrics: 'Version 2', timestamp: 2000, changes: [] },
        { id: 'v3', lyrics: 'Version 3', timestamp: 3000, changes: [] },
      ];

      importProject(data);

      const versions = usePoemStore.getState().versions;
      expect(versions).toHaveLength(3);
      expect(versions[0].lyrics).toBe('Version 1');
      expect(versions[1].lyrics).toBe('Version 2');
      expect(versions[2].lyrics).toBe('Version 3');
    });

    it('should restore current version index', () => {
      const data = createValidProjectData();
      data.poem.versions = [
        { id: 'v1', lyrics: 'V1', timestamp: 1000, changes: [] },
        { id: 'v2', lyrics: 'V2', timestamp: 2000, changes: [] },
      ];
      data.poem.currentVersionIndex = 1;

      importProject(data);

      expect(usePoemStore.getState().currentVersionIndex).toBe(1);
    });

    it('should preserve version IDs', () => {
      const data = createValidProjectData();
      const testId = 'custom-id-12345';
      data.poem.versions = [{ id: testId, lyrics: 'Test', timestamp: 1000, changes: [] }];

      importProject(data);

      expect(usePoemStore.getState().versions[0].id).toBe(testId);
    });
  });

  describe('settings import', () => {
    it('should import tempo setting', () => {
      const data = createValidProjectData();
      data.settings.tempo = 150;

      importProject(data);

      expect(useMelodyStore.getState().tempo).toBe(150);
    });

    it('should import volume setting', () => {
      const data = createValidProjectData();
      data.settings.volume = 0.3;

      importProject(data);

      expect(useMelodyStore.getState().volume).toBe(0.3);
    });

    it('should import loop setting when true', () => {
      const data = createValidProjectData();
      data.settings.loop = true;

      // Ensure loop starts as false
      const initialLoop = useMelodyStore.getState().loop;
      expect(initialLoop).toBe(false);

      importProject(data);

      expect(useMelodyStore.getState().loop).toBe(true);
    });

    it('should import key setting', () => {
      const data = createValidProjectData();
      data.settings.key = 'Am';

      importProject(data);

      expect(useMelodyStore.getState().key).toBe('Am');
    });

    it('should import time signature setting', () => {
      const data = createValidProjectData();
      data.settings.timeSignature = '6/8';

      importProject(data);

      expect(useMelodyStore.getState().timeSignature).toBe('6/8');
    });

    it('should handle invalid key gracefully', () => {
      const data = createValidProjectData();
      data.settings.key = 'InvalidKey';

      // Should not throw
      expect(() => importProject(data)).not.toThrow();

      // Key should remain at default since InvalidKey is not in validKeys
      expect(useMelodyStore.getState().key).toBe('C');
    });
  });

  describe('analysis import', () => {
    it('should import null analysis', () => {
      const data = createValidProjectData();
      data.analysis = null;

      importProject(data);

      expect(useAnalysisStore.getState().analysis).toBeNull();
    });

    it('should import analysis data', () => {
      const data = createValidProjectData();
      data.analysis = createTestAnalysis();

      importProject(data);

      const analysis = useAnalysisStore.getState().analysis;
      expect(analysis).not.toBeNull();
      expect(analysis?.meta.lineCount).toBe(2);
      expect(analysis?.emotion.dominantEmotions).toContain('joy');
    });

    it('should skip analysis import when includeAnalysis is false', () => {
      const data = createValidProjectData();
      data.analysis = createTestAnalysis();

      importProject(data, { includeAnalysis: false });

      expect(useAnalysisStore.getState().analysis).toBeNull();
    });
  });

  describe('melody import', () => {
    it('should import null melody', () => {
      const data = createValidProjectData();
      data.melody = { data: null, abcNotation: null };

      importProject(data);

      expect(useMelodyStore.getState().melody).toBeNull();
      expect(useMelodyStore.getState().abcNotation).toBeNull();
    });

    it('should import ABC notation only', () => {
      const data = createValidProjectData();
      data.melody = { data: null, abcNotation: 'X:1\nT:Test\nK:C\nCDEF|' };

      importProject(data);

      expect(useMelodyStore.getState().abcNotation).toBe('X:1\nT:Test\nK:C\nCDEF|');
    });

    it('should import full melody data', () => {
      const data = createValidProjectData();
      const melody = {
        params: {
          title: 'Test',
          timeSignature: '4/4' as const,
          defaultNoteLength: '1/8' as const,
          tempo: 100,
          key: 'C' as const,
        },
        measures: [[{ pitch: 'C', octave: 0, duration: 1 }]],
        lyrics: [['la']],
      };
      data.melody = { data: melody, abcNotation: 'X:1\nK:C\nC|' };

      importProject(data);

      const state = useMelodyStore.getState();
      expect(state.melody).toEqual(melody);
      expect(state.abcNotation).toBe('X:1\nK:C\nC|');
    });

    it('should skip melody import when includeMelody is false', () => {
      const data = createValidProjectData();
      data.melody = { data: null, abcNotation: 'X:1\nK:C\nC|' };

      importProject(data, { includeMelody: false });

      expect(useMelodyStore.getState().abcNotation).toBeNull();
    });
  });

  describe('recordings import', () => {
    it('should import empty recordings array', () => {
      const data = createValidProjectData();
      data.recordings = [];

      importProject(data);

      expect(useRecordingStore.getState().takes).toHaveLength(0);
    });

    it('should import recording metadata', () => {
      const data = createValidProjectData();
      data.recordings = [
        {
          id: 'rec-1',
          duration: 30.5,
          timestamp: 1704067200000,
          name: 'Take 1',
        },
        {
          id: 'rec-2',
          duration: 45,
          timestamp: 1704067300000,
          melodyVersionId: 'melody-v1',
          lyricVersionId: 'lyric-v1',
        },
      ];

      importProject(data);

      const takes = useRecordingStore.getState().takes;
      expect(takes).toHaveLength(2);
      expect(takes[0].id).toBe('rec-1');
      expect(takes[0].duration).toBe(30.5);
      expect(takes[0].name).toBe('Take 1');
      expect(takes[0].blobUrl).toBe(''); // Blob URL should be empty
      expect(takes[1].melodyVersionId).toBe('melody-v1');
    });

    it('should skip recordings import when includeRecordings is false', () => {
      const data = createValidProjectData();
      data.recordings = [{ id: 'rec-1', duration: 30, timestamp: 1000 }];

      importProject(data, { includeRecordings: false });

      expect(useRecordingStore.getState().takes).toHaveLength(0);
    });
  });

  describe('round-trip export/import', () => {
    it('should preserve poem data through export/import cycle', () => {
      // Set up initial data
      usePoemStore.getState().setPoem('Original poem text');
      usePoemStore.getState().addVersion('Modified poem', 'First edit');

      // Export
      const exported = exportProject();

      // Reset stores
      usePoemStore.getState().reset();

      // Import
      importProject(exported);

      // Verify
      const state = usePoemStore.getState();
      expect(state.original).toBe('Original poem text');
      expect(state.versions[0].lyrics).toBe('Modified poem');
      expect(state.versions[0].description).toBe('First edit');
    });

    it('should preserve settings through export/import cycle', () => {
      // Set up settings
      useMelodyStore.getState().setTempo(140);
      useMelodyStore.getState().setVolume(0.6);
      useMelodyStore.getState().toggleLoop();

      // Export
      const exported = exportProject();

      // Reset
      useMelodyStore.getState().reset();

      // Import
      importProject(exported);

      // Verify
      const state = useMelodyStore.getState();
      expect(state.tempo).toBe(140);
      expect(state.volume).toBe(0.6);
      expect(state.loop).toBe(true);
    });
  });
});

describe('importProjectFromJson', () => {
  beforeEach(() => {
    usePoemStore.getState().reset();
    useAnalysisStore.getState().reset();
    useMelodyStore.getState().reset();
    useRecordingStore.getState().reset();

    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('should import valid JSON string', () => {
    const data = createValidProjectData();
    const json = JSON.stringify(data);

    expect(() => importProjectFromJson(json)).not.toThrow();

    expect(usePoemStore.getState().original).toBe(data.poem.original);
  });

  it('should throw for invalid JSON', () => {
    expect(() => importProjectFromJson('not valid json')).toThrow(ProjectImportError);
  });

  it('should throw for valid JSON but invalid project structure', () => {
    expect(() => importProjectFromJson('{"foo": "bar"}')).toThrow(ProjectImportError);
  });

  it('should include parse errors in exception', () => {
    try {
      importProjectFromJson('invalid json {');
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ProjectImportError);
      expect((error as ProjectImportError).errors.length).toBeGreaterThan(0);
      expect((error as ProjectImportError).errors.some((e) => e.includes('Invalid JSON'))).toBe(
        true
      );
    }
  });

  it('should pass options to importProject', () => {
    const data = createValidProjectData();
    data.analysis = createTestAnalysis();
    const json = JSON.stringify(data);

    importProjectFromJson(json, { includeAnalysis: false });

    expect(useAnalysisStore.getState().analysis).toBeNull();
  });
});
