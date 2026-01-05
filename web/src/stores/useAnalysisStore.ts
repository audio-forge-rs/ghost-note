/**
 * Ghost Note - Analysis Store
 *
 * Manages poem analysis state, loading progress, and results.
 *
 * @module stores/useAnalysisStore
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AnalysisStore, AnalysisState, AnalysisStage } from './types';
import type { PoemAnalysis } from '../types';
import { analyzePoem, type AnalysisProgress } from '../lib/analysis/orchestrator';

// =============================================================================
// Initial State
// =============================================================================

const initialState: AnalysisState = {
  analysis: null,
  isLoading: false,
  stage: 'idle',
  progress: 0,
  error: null,
  analyzedVersionId: null,
};

// =============================================================================
// Stage Progress Mapping
// =============================================================================

const stageProgress: Record<AnalysisStage, number> = {
  idle: 0,
  preprocessing: 10,
  tokenizing: 20,
  phonetic: 35,
  syllabifying: 50,
  meter: 65,
  rhyme: 75,
  singability: 85,
  emotion: 95,
  complete: 100,
  error: 0,
};

// =============================================================================
// Orchestrator Stage Mapping
// =============================================================================

/**
 * Maps orchestrator stage names to store AnalysisStage values.
 * The orchestrator uses slightly different naming.
 */
const orchestratorStageMap: Record<string, AnalysisStage> = {
  preprocess: 'preprocessing',
  phonetic: 'phonetic',
  stress: 'syllabifying', // Stress analysis maps to syllabifying stage
  meter: 'meter',
  rhyme: 'rhyme',
  singability: 'singability',
  emotion: 'emotion',
  complete: 'complete',
  cached: 'complete', // Cached results go straight to complete
};

/**
 * Converts orchestrator progress to store stage and progress.
 * @param progress - Progress from orchestrator
 * @returns Store-compatible stage and progress
 */
function mapOrchestratorProgress(progress: AnalysisProgress): { stage: AnalysisStage; progress: number } {
  const mappedStage = orchestratorStageMap[progress.stage] ?? 'preprocessing';
  // Use orchestrator's percentage if available, otherwise use our stage mapping
  const mappedProgress = progress.percent ?? stageProgress[mappedStage];
  return { stage: mappedStage, progress: mappedProgress };
}

// =============================================================================
// Store Implementation
// =============================================================================

export const useAnalysisStore = create<AnalysisStore>()(
  devtools(
    (set, get) => ({
      // State
      ...initialState,

      // Actions
      analyze: async (text: string, versionId?: string) => {
        if (!text.trim()) {
          console.warn('[AnalysisStore] Cannot analyze empty text');
          get().setError('Cannot analyze empty text');
          return;
        }

        console.log('[AnalysisStore] Starting analysis for text:', text.substring(0, 50) + '...');

        set(
          {
            isLoading: true,
            stage: 'preprocessing',
            progress: stageProgress.preprocessing,
            error: null,
            analyzedVersionId: versionId ?? null,
          },
          false,
          'analyze/start'
        );

        try {
          // Create progress callback to update store state
          const onProgress = (progress: AnalysisProgress): void => {
            const { stage: mappedStage, progress: mappedProgress } = mapOrchestratorProgress(progress);
            console.log(`[AnalysisStore] Progress: ${progress.stage} -> ${mappedStage} (${mappedProgress}%): ${progress.message}`);
            set(
              {
                stage: mappedStage,
                progress: mappedProgress,
              },
              false,
              `analyze/${mappedStage}`
            );
          };

          // Call the actual orchestrator
          console.log('[AnalysisStore] Calling analyzePoem orchestrator');
          const analysis = await analyzePoem(text, {
            onProgress,
            useCache: true,
          });

          // Validate that we got meaningful results
          if (!analysis) {
            throw new Error('Analysis returned null or undefined');
          }

          console.log('[AnalysisStore] Analysis complete, stanzas:', analysis.structure.stanzas.length);
          console.log('[AnalysisStore] Detected meter:', analysis.prosody.meter.detectedMeter);
          console.log('[AnalysisStore] Rhyme scheme:', analysis.prosody.rhyme.scheme);

          set(
            {
              analysis,
              isLoading: false,
              stage: 'complete',
              progress: 100,
            },
            false,
            'analyze/complete'
          );

          console.log('[AnalysisStore] Analysis complete');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('[AnalysisStore] Analysis failed:', errorMessage);
          set(
            {
              isLoading: false,
              stage: 'error',
              progress: 0,
              error: errorMessage,
            },
            false,
            'analyze/error'
          );
        }
      },

      setAnalysis: (analysis: PoemAnalysis, versionId?: string) => {
        console.log('[AnalysisStore] Setting analysis directly');
        set(
          {
            analysis,
            isLoading: false,
            stage: 'complete',
            progress: 100,
            error: null,
            analyzedVersionId: versionId ?? null,
          },
          false,
          'setAnalysis'
        );
      },

      setStage: (stage: AnalysisStage, progress?: number) => {
        console.log('[AnalysisStore] Setting stage:', stage);
        set(
          {
            stage,
            progress: progress ?? stageProgress[stage],
          },
          false,
          'setStage'
        );
      },

      setError: (error: string) => {
        console.error('[AnalysisStore] Error:', error);
        set(
          {
            isLoading: false,
            stage: 'error',
            progress: 0,
            error,
          },
          false,
          'setError'
        );
      },

      clear: () => {
        console.log('[AnalysisStore] Clearing analysis');
        set(
          {
            analysis: null,
            stage: 'idle',
            progress: 0,
            error: null,
            analyzedVersionId: null,
          },
          false,
          'clear'
        );
      },

      reset: () => {
        console.log('[AnalysisStore] Resetting store');
        set(initialState, false, 'reset');
      },
    }),
    { name: 'AnalysisStore' }
  )
);

// =============================================================================
// Selectors
// =============================================================================

/**
 * Check if analysis is available
 */
export const selectHasAnalysis = (state: AnalysisStore): boolean => {
  return state.analysis !== null;
};

/**
 * Check if analysis is in progress
 */
export const selectIsAnalyzing = (state: AnalysisStore): boolean => {
  return state.isLoading;
};

/**
 * Get the current stage name (human-readable)
 */
export const selectStageName = (state: AnalysisStore): string => {
  const stageNames: Record<AnalysisStage, string> = {
    idle: 'Ready',
    preprocessing: 'Preprocessing text...',
    tokenizing: 'Tokenizing words...',
    phonetic: 'Analyzing phonetics...',
    syllabifying: 'Counting syllables...',
    meter: 'Detecting meter...',
    rhyme: 'Finding rhymes...',
    singability: 'Analyzing singability...',
    emotion: 'Detecting emotion...',
    complete: 'Analysis complete',
    error: 'Error occurred',
  };
  return stageNames[state.stage];
};

/**
 * Get overall singability score if available
 */
export const selectOverallSingability = (state: AnalysisStore): number | null => {
  if (!state.analysis) return null;

  const stanzas = state.analysis.structure.stanzas;
  if (stanzas.length === 0) return null;

  let totalScore = 0;
  let lineCount = 0;

  for (const stanza of stanzas) {
    for (const line of stanza.lines) {
      totalScore += line.singability.lineScore;
      lineCount++;
    }
  }

  return lineCount > 0 ? totalScore / lineCount : null;
};

/**
 * Get detected meter if available
 */
export const selectMeter = (state: AnalysisStore): string | null => {
  return state.analysis?.prosody.meter.detectedMeter ?? null;
};

/**
 * Get rhyme scheme if available
 */
export const selectRhymeScheme = (state: AnalysisStore): string | null => {
  return state.analysis?.prosody.rhyme.scheme ?? null;
};

/**
 * Get overall sentiment if available
 */
export const selectSentiment = (state: AnalysisStore): number | null => {
  return state.analysis?.emotion.overallSentiment ?? null;
};

/**
 * Get problem count
 */
export const selectProblemCount = (state: AnalysisStore): number => {
  return state.analysis?.problems.length ?? 0;
};

/**
 * Check if the analyzed version matches a given version ID
 */
export const selectIsVersionAnalyzed =
  (versionId: string | null) =>
  (state: AnalysisStore): boolean => {
    return state.analyzedVersionId === versionId;
  };
