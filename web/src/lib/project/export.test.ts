/**
 * Tests for project export
 *
 * @module lib/project/export.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { exportProject, serializeProject } from './export';
import { CURRENT_SCHEMA_VERSION } from './types';
import { usePoemStore } from '../../stores/usePoemStore';
import { useAnalysisStore } from '../../stores/useAnalysisStore';
import { useMelodyStore } from '../../stores/useMelodyStore';
import { useRecordingStore } from '../../stores/useRecordingStore';

describe('exportProject', () => {
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

  describe('basic export', () => {
    it('should export project with correct schema version', () => {
      const project = exportProject();

      expect(project.version).toBe(CURRENT_SCHEMA_VERSION);
    });

    it('should include valid ISO timestamp', () => {
      const beforeExport = new Date().toISOString();
      const project = exportProject();
      const afterExport = new Date().toISOString();

      expect(project.exportedAt).toBeDefined();
      expect(project.exportedAt >= beforeExport).toBe(true);
      expect(project.exportedAt <= afterExport).toBe(true);
    });

    it('should export empty project correctly', () => {
      const project = exportProject();

      expect(project.poem.original).toBe('');
      expect(project.poem.versions).toEqual([]);
      expect(project.poem.currentVersionIndex).toBe(-1);
      expect(project.analysis).toBeNull();
      expect(project.melody.data).toBeNull();
      expect(project.melody.abcNotation).toBeNull();
      expect(project.recordings).toEqual([]);
    });
  });

  describe('poem export', () => {
    it('should export original poem text', () => {
      usePoemStore.getState().setPoem('Roses are red\nViolets are blue');

      const project = exportProject();

      expect(project.poem.original).toBe('Roses are red\nViolets are blue');
    });

    it('should export all lyric versions', () => {
      usePoemStore.getState().setPoem('Original poem');
      usePoemStore.getState().addVersion('Version 1', 'First edit');
      usePoemStore.getState().addVersion('Version 2', 'Second edit');

      const project = exportProject();

      expect(project.poem.versions).toHaveLength(2);
      expect(project.poem.versions[0].lyrics).toBe('Version 1');
      expect(project.poem.versions[0].description).toBe('First edit');
      expect(project.poem.versions[1].lyrics).toBe('Version 2');
      expect(project.poem.versions[1].description).toBe('Second edit');
    });

    it('should export current version index', () => {
      usePoemStore.getState().setPoem('Original');
      usePoemStore.getState().addVersion('V1');
      usePoemStore.getState().addVersion('V2');
      usePoemStore.getState().revertToVersion(0);

      const project = exportProject();

      expect(project.poem.currentVersionIndex).toBe(0);
    });

    it('should preserve version IDs and timestamps', () => {
      usePoemStore.getState().setPoem('Original');
      usePoemStore.getState().addVersion('Modified');

      const originalVersion = usePoemStore.getState().versions[0];
      const project = exportProject();

      expect(project.poem.versions[0].id).toBe(originalVersion.id);
      expect(project.poem.versions[0].timestamp).toBe(originalVersion.timestamp);
    });
  });

  describe('settings export', () => {
    it('should export melody settings', () => {
      useMelodyStore.getState().setTempo(120);
      useMelodyStore.getState().setVolume(0.5);
      useMelodyStore.getState().toggleLoop();
      useMelodyStore.getState().setKey('G');
      useMelodyStore.getState().setTimeSignature('3/4');

      const project = exportProject();

      expect(project.settings.tempo).toBe(120);
      expect(project.settings.volume).toBe(0.5);
      expect(project.settings.loop).toBe(true);
      expect(project.settings.key).toBe('G');
      expect(project.settings.timeSignature).toBe('3/4');
    });

    it('should export default settings when not modified', () => {
      const project = exportProject();

      expect(project.settings.tempo).toBe(100);
      expect(project.settings.volume).toBe(0.8);
      expect(project.settings.loop).toBe(false);
      expect(project.settings.key).toBe('C');
      expect(project.settings.timeSignature).toBe('4/4');
    });
  });

  describe('melody export', () => {
    it('should export null melody when not generated', () => {
      const project = exportProject();

      expect(project.melody.data).toBeNull();
      expect(project.melody.abcNotation).toBeNull();
    });

    it('should export ABC notation', () => {
      const abcNotation = 'X:1\nT:Test\nK:C\nCDEF|';
      useMelodyStore.getState().setAbcNotation(abcNotation);

      const project = exportProject();

      expect(project.melody.abcNotation).toBe(abcNotation);
    });

    it('should export full melody data', () => {
      const melody = {
        params: {
          title: 'Test Song',
          timeSignature: '4/4' as const,
          defaultNoteLength: '1/8' as const,
          tempo: 100,
          key: 'C' as const,
        },
        measures: [[{ pitch: 'C', octave: 0, duration: 1 }]],
        lyrics: [['la']],
      };

      useMelodyStore.getState().setMelody(melody, 'X:1\nT:Test\nK:C\nC|');

      const project = exportProject();

      expect(project.melody.data).toEqual(melody);
    });
  });

  describe('recordings export', () => {
    it('should export empty recordings array when none exist', () => {
      const project = exportProject();

      expect(project.recordings).toEqual([]);
    });

    it('should export recording metadata without blob URLs', () => {
      useRecordingStore.getState().addTake({
        id: 'take-1',
        blobUrl: 'blob:http://localhost/secret-audio',
        duration: 30.5,
        timestamp: 1704067200000,
        name: 'Take 1',
      });

      const project = exportProject();

      expect(project.recordings).toHaveLength(1);
      expect(project.recordings[0].id).toBe('take-1');
      expect(project.recordings[0].duration).toBe(30.5);
      expect(project.recordings[0].name).toBe('Take 1');
      // blobUrl should not be in the export
      expect('blobUrl' in project.recordings[0]).toBe(false);
    });

    it('should export multiple recordings', () => {
      useRecordingStore.getState().addTake({
        id: 'take-1',
        blobUrl: 'blob:1',
        duration: 30,
        timestamp: 1000,
      });
      useRecordingStore.getState().addTake({
        id: 'take-2',
        blobUrl: 'blob:2',
        duration: 45,
        timestamp: 2000,
        melodyVersionId: 'melody-v1',
        lyricVersionId: 'lyric-v1',
      });

      const project = exportProject();

      expect(project.recordings).toHaveLength(2);
      expect(project.recordings[1].melodyVersionId).toBe('melody-v1');
      expect(project.recordings[1].lyricVersionId).toBe('lyric-v1');
    });
  });
});

describe('serializeProject', () => {
  beforeEach(() => {
    usePoemStore.getState().reset();
    useAnalysisStore.getState().reset();
    useMelodyStore.getState().reset();
    useRecordingStore.getState().reset();
  });

  it('should serialize to valid JSON string', () => {
    const project = exportProject();
    const json = serializeProject(project);

    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('should serialize with pretty formatting by default', () => {
    const project = exportProject();
    const json = serializeProject(project);

    // Pretty JSON has newlines
    expect(json).toContain('\n');
  });

  it('should serialize without pretty formatting when specified', () => {
    const project = exportProject();
    const json = serializeProject(project, false);

    // Compact JSON has no newlines except in string values
    const lineCount = json.split('\n').length;
    expect(lineCount).toBe(1);
  });

  it('should produce parseable JSON that matches original data', () => {
    usePoemStore.getState().setPoem('Test poem');
    usePoemStore.getState().addVersion('Modified');

    const project = exportProject();
    const json = serializeProject(project);
    const parsed = JSON.parse(json);

    expect(parsed.poem.original).toBe(project.poem.original);
    expect(parsed.poem.versions[0].lyrics).toBe(project.poem.versions[0].lyrics);
  });
});
