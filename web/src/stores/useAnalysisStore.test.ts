/**
 * Tests for useAnalysisStore
 *
 * @module stores/useAnalysisStore.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAnalysisStore, selectHasAnalysis, selectIsAnalyzing, selectStageName, selectOverallSingability, selectMeter, selectRhymeScheme, selectSentiment, selectProblemCount, selectIsVersionAnalyzed } from './useAnalysisStore';
import { createDefaultPoemAnalysis } from '../types';

describe('useAnalysisStore', () => {
  beforeEach(() => {
    useAnalysisStore.getState().reset();
    vi.clearAllTimers();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useAnalysisStore.getState();
      expect(state.analysis).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.stage).toBe('idle');
      expect(state.progress).toBe(0);
      expect(state.error).toBeNull();
      expect(state.analyzedVersionId).toBeNull();
    });
  });

  describe('analyze', () => {
    it('should not analyze empty text', async () => {
      await useAnalysisStore.getState().analyze('');

      const state = useAnalysisStore.getState();
      expect(state.error).toBe('Cannot analyze empty text');
      expect(state.isLoading).toBe(false);
    });

    it('should not analyze whitespace-only text', async () => {
      await useAnalysisStore.getState().analyze('   \n\t   ');

      const state = useAnalysisStore.getState();
      expect(state.error).toBe('Cannot analyze empty text');
    });

    it('should complete analysis with results', async () => {
      await useAnalysisStore.getState().analyze('Hello world, this is a test poem');

      const state = useAnalysisStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.stage).toBe('complete');
      expect(state.progress).toBe(100);
      expect(state.analysis).not.toBeNull();
      expect(state.error).toBeNull();
    });

    it('should set version ID when provided', async () => {
      await useAnalysisStore.getState().analyze('Test poem', 'version-123');

      const state = useAnalysisStore.getState();
      expect(state.analyzedVersionId).toBe('version-123');
    });

    it('should populate metadata from text', async () => {
      await useAnalysisStore.getState().analyze('Line one\nLine two\nLine three');

      const state = useAnalysisStore.getState();
      expect(state.analysis?.meta.lineCount).toBe(3);
    });
  });

  describe('setAnalysis', () => {
    it('should set analysis directly', () => {
      const analysis = createDefaultPoemAnalysis();
      analysis.meta.lineCount = 10;

      useAnalysisStore.getState().setAnalysis(analysis, 'version-456');

      const state = useAnalysisStore.getState();
      expect(state.analysis).toBe(analysis);
      expect(state.stage).toBe('complete');
      expect(state.progress).toBe(100);
      expect(state.analyzedVersionId).toBe('version-456');
    });
  });

  describe('setStage', () => {
    it('should update stage and progress', () => {
      useAnalysisStore.getState().setStage('meter', 65);

      const state = useAnalysisStore.getState();
      expect(state.stage).toBe('meter');
      expect(state.progress).toBe(65);
    });

    it('should use default progress for stage when not provided', () => {
      useAnalysisStore.getState().setStage('rhyme');

      const state = useAnalysisStore.getState();
      expect(state.stage).toBe('rhyme');
      expect(state.progress).toBe(75);
    });
  });

  describe('setError', () => {
    it('should set error state', () => {
      useAnalysisStore.getState().setError('Test error message');

      const state = useAnalysisStore.getState();
      expect(state.error).toBe('Test error message');
      expect(state.stage).toBe('error');
      expect(state.isLoading).toBe(false);
      expect(state.progress).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear analysis but keep loading state', async () => {
      await useAnalysisStore.getState().analyze('Test poem');
      useAnalysisStore.getState().clear();

      const state = useAnalysisStore.getState();
      expect(state.analysis).toBeNull();
      expect(state.stage).toBe('idle');
      expect(state.progress).toBe(0);
      expect(state.analyzedVersionId).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset to initial state', async () => {
      await useAnalysisStore.getState().analyze('Test poem');
      useAnalysisStore.getState().reset();

      const state = useAnalysisStore.getState();
      expect(state.analysis).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.stage).toBe('idle');
      expect(state.progress).toBe(0);
      expect(state.error).toBeNull();
      expect(state.analyzedVersionId).toBeNull();
    });
  });

  describe('selectors', () => {
    describe('selectHasAnalysis', () => {
      it('should return false when no analysis', () => {
        expect(selectHasAnalysis(useAnalysisStore.getState())).toBe(false);
      });

      it('should return true when analysis exists', async () => {
        await useAnalysisStore.getState().analyze('Test poem');
        expect(selectHasAnalysis(useAnalysisStore.getState())).toBe(true);
      });
    });

    describe('selectIsAnalyzing', () => {
      it('should return false when not loading', () => {
        expect(selectIsAnalyzing(useAnalysisStore.getState())).toBe(false);
      });
    });

    describe('selectStageName', () => {
      it('should return human-readable stage names', () => {
        expect(selectStageName(useAnalysisStore.getState())).toBe('Ready');

        useAnalysisStore.getState().setStage('preprocessing');
        expect(selectStageName(useAnalysisStore.getState())).toBe('Preprocessing text...');

        useAnalysisStore.getState().setStage('meter');
        expect(selectStageName(useAnalysisStore.getState())).toBe('Detecting meter...');

        useAnalysisStore.getState().setStage('complete');
        expect(selectStageName(useAnalysisStore.getState())).toBe('Analysis complete');

        useAnalysisStore.getState().setStage('error');
        expect(selectStageName(useAnalysisStore.getState())).toBe('Error occurred');
      });
    });

    describe('selectOverallSingability', () => {
      it('should return null when no analysis', () => {
        expect(selectOverallSingability(useAnalysisStore.getState())).toBeNull();
      });

      it('should return null when no stanzas', async () => {
        await useAnalysisStore.getState().analyze('Test');
        expect(selectOverallSingability(useAnalysisStore.getState())).toBeNull();
      });
    });

    describe('selectMeter', () => {
      it('should return null when no analysis', () => {
        expect(selectMeter(useAnalysisStore.getState())).toBeNull();
      });

      it('should return detected meter when available', async () => {
        await useAnalysisStore.getState().analyze('Test poem');
        expect(selectMeter(useAnalysisStore.getState())).toBe('irregular');
      });
    });

    describe('selectRhymeScheme', () => {
      it('should return null when no analysis', () => {
        expect(selectRhymeScheme(useAnalysisStore.getState())).toBeNull();
      });

      it('should return empty string for default analysis', async () => {
        await useAnalysisStore.getState().analyze('Test');
        expect(selectRhymeScheme(useAnalysisStore.getState())).toBe('');
      });
    });

    describe('selectSentiment', () => {
      it('should return null when no analysis', () => {
        expect(selectSentiment(useAnalysisStore.getState())).toBeNull();
      });

      it('should return sentiment value', async () => {
        await useAnalysisStore.getState().analyze('Test');
        expect(selectSentiment(useAnalysisStore.getState())).toBe(0);
      });
    });

    describe('selectProblemCount', () => {
      it('should return 0 when no analysis', () => {
        expect(selectProblemCount(useAnalysisStore.getState())).toBe(0);
      });

      it('should return 0 for default analysis', async () => {
        await useAnalysisStore.getState().analyze('Test');
        expect(selectProblemCount(useAnalysisStore.getState())).toBe(0);
      });
    });

    describe('selectIsVersionAnalyzed', () => {
      it('should return false when no version analyzed', () => {
        const selector = selectIsVersionAnalyzed('version-123');
        expect(selector(useAnalysisStore.getState())).toBe(false);
      });

      it('should return true when version matches', async () => {
        await useAnalysisStore.getState().analyze('Test', 'version-123');
        const selector = selectIsVersionAnalyzed('version-123');
        expect(selector(useAnalysisStore.getState())).toBe(true);
      });

      it('should return false when version does not match', async () => {
        await useAnalysisStore.getState().analyze('Test', 'version-123');
        const selector = selectIsVersionAnalyzed('version-456');
        expect(selector(useAnalysisStore.getState())).toBe(false);
      });
    });
  });
});
