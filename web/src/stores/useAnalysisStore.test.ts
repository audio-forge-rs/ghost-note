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

    it('should populate stanza structure from multi-stanza poem', async () => {
      const poem = `Roses are red
Violets are blue

Sugar is sweet
And so are you`;

      await useAnalysisStore.getState().analyze(poem);

      const state = useAnalysisStore.getState();
      expect(state.analysis).not.toBeNull();
      expect(state.analysis?.structure.stanzas.length).toBe(2);
      expect(state.analysis?.structure.stanzas[0].lines.length).toBe(2);
      expect(state.analysis?.structure.stanzas[1].lines.length).toBe(2);
    });

    it('should analyze stress patterns and meter', async () => {
      // Iambic poem: "da-DUM da-DUM da-DUM da-DUM"
      const poem = `The sun descends on ocean waves
As night arrives to claim the day`;

      await useAnalysisStore.getState().analyze(poem);

      const state = useAnalysisStore.getState();
      expect(state.analysis).not.toBeNull();
      expect(state.analysis?.prosody.meter.detectedMeter).not.toBe('irregular');
      expect(state.analysis?.prosody.meter.confidence).toBeGreaterThan(0);
    });

    it('should detect rhymes in rhyming text', async () => {
      const poem = `Roses are red
Violets are blue
Sugar is sweet
And so are you`;

      await useAnalysisStore.getState().analyze(poem);

      const state = useAnalysisStore.getState();
      expect(state.analysis).not.toBeNull();
      // Rhyme scheme like "ABAB" or "ABCB" indicates rhymes were detected
      expect(state.analysis?.prosody.rhyme.scheme.length).toBeGreaterThan(0);
      // rhymeGroups contains the actual rhyming lines grouped by letter
      expect(Object.keys(state.analysis?.prosody.rhyme.rhymeGroups || {}).length).toBeGreaterThan(0);
    });

    it('should analyze emotion and sentiment', async () => {
      const sadPoem = `Tears fall down like autumn rain
Sorrow fills my weary heart`;

      await useAnalysisStore.getState().analyze(sadPoem);

      const state = useAnalysisStore.getState();
      expect(state.analysis).not.toBeNull();
      expect(state.analysis?.emotion).toBeDefined();
      expect(typeof state.analysis?.emotion.overallSentiment).toBe('number');
      expect(typeof state.analysis?.emotion.arousal).toBe('number');
    });

    it('should provide melody suggestions', async () => {
      await useAnalysisStore.getState().analyze('A simple test poem for melody');

      const state = useAnalysisStore.getState();
      expect(state.analysis?.melodySuggestions).toBeDefined();
      expect(state.analysis?.melodySuggestions.timeSignature).toBeDefined();
      expect(state.analysis?.melodySuggestions.tempo).toBeGreaterThan(0);
      expect(state.analysis?.melodySuggestions.key).toBeDefined();
    });

    it('should calculate line syllable counts', async () => {
      const poem = `The quick brown fox jumps over
A lazy dog sleeping soundly`;

      await useAnalysisStore.getState().analyze(poem);

      const state = useAnalysisStore.getState();
      expect(state.analysis).not.toBeNull();
      const lines = state.analysis?.structure.stanzas[0].lines;
      expect(lines).toBeDefined();
      expect(lines![0].syllableCount).toBeGreaterThan(0);
      expect(lines![1].syllableCount).toBeGreaterThan(0);
    });

    it('should analyze singability per line', async () => {
      await useAnalysisStore.getState().analyze('Hello world test');

      const state = useAnalysisStore.getState();
      const line = state.analysis?.structure.stanzas[0]?.lines[0];
      expect(line?.singability).toBeDefined();
      expect(typeof line?.singability.lineScore).toBe('number');
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

      it('should return singability score when stanzas exist', async () => {
        await useAnalysisStore.getState().analyze('Test');
        const score = selectOverallSingability(useAnalysisStore.getState());
        // Real orchestrator returns actual singability scores
        expect(score).not.toBeNull();
        expect(typeof score).toBe('number');
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    });

    describe('selectMeter', () => {
      it('should return null when no analysis', () => {
        expect(selectMeter(useAnalysisStore.getState())).toBeNull();
      });

      it('should return detected meter when available', async () => {
        await useAnalysisStore.getState().analyze('Test poem');
        const meter = selectMeter(useAnalysisStore.getState());
        // Real orchestrator returns actual meter detection
        expect(meter).not.toBeNull();
        expect(typeof meter).toBe('string');
        expect(meter!.length).toBeGreaterThan(0);
      });
    });

    describe('selectRhymeScheme', () => {
      it('should return null when no analysis', () => {
        expect(selectRhymeScheme(useAnalysisStore.getState())).toBeNull();
      });

      it('should return rhyme scheme after analysis', async () => {
        await useAnalysisStore.getState().analyze('Test');
        const scheme = selectRhymeScheme(useAnalysisStore.getState());
        // Real orchestrator returns actual rhyme scheme (could be empty or detected)
        expect(scheme).not.toBeNull();
        expect(typeof scheme).toBe('string');
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

      it('should return problem count after analysis', async () => {
        await useAnalysisStore.getState().analyze('Test');
        const count = selectProblemCount(useAnalysisStore.getState());
        // Real orchestrator may detect problems depending on the text
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(0);
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
