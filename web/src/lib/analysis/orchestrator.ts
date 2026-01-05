/**
 * Poem Analysis Orchestrator Module
 *
 * This module coordinates the complete poem analysis pipeline, running all
 * analysis modules in the correct order and providing caching for efficiency.
 *
 * Analysis Pipeline Order:
 * 1. Preprocess (tokenize, detect structure)
 * 2. Phonetic lookup (CMU dict)
 * 3. Stress patterns
 * 4. Meter detection
 * 5. Rhyme analysis
 * 6. Singability scoring
 * 7. Emotion analysis
 * 8. Structure analysis (verse/chorus detection)
 *
 * @module lib/analysis/orchestrator
 */

import type {
  PoemAnalysis,
  AnalyzedLine,
  AnalyzedStanza,
  SyllabifiedWord,
  Syllable,
  StressLevel,
  MeterAnalysis as MeterAnalysisType,
  TimeSignature,
  ProblemReport,
} from '@/types/analysis';

import { createDefaultPoemAnalysis } from '@/types/analysis';

import {
  preprocessPoem,
  tokenizeWords,
  countWords,
  getAllLines,
} from './preprocess';

import {
  analyzeWord as cmuAnalyzeWord,
  isVowel,
  getPhonemeStress,
} from '@/lib/phonetics/cmuDict';

import {
  analyzeUnknownWord,
} from '@/lib/phonetics/stressEstimator';

import {
  analyzeLineStress,
  countFeet,
  getDominantFoot,
} from './stress';

import {
  analyzeMultiLineMeter,
  findDeviations,
} from './meter';

import { analyzeRhymes } from './rhyme';

import {
  analyzeLineSingability,
} from './singability';

import { analyzeSoundPatterns } from './soundPatterns';

import { analyzeEmotion } from './emotion';

import { analyzeStructure } from './structure';

// =============================================================================
// Types
// =============================================================================

/**
 * Progress information for UI updates during analysis
 */
export interface AnalysisProgress {
  /** Current stage name */
  stage: string;
  /** Completion percentage (0-100) */
  percent: number;
  /** Human-readable progress message */
  message: string;
}

/**
 * Callback function for progress updates
 */
export type ProgressCallback = (progress: AnalysisProgress) => void;

/**
 * Cached analysis entry stored in localStorage
 */
interface CachedAnalysis {
  /** Hash of the poem text */
  hash: string;
  /** Timestamp of when analysis was cached */
  timestamp: number;
  /** The cached analysis result */
  analysis: PoemAnalysis;
}

/**
 * Options for the analysis orchestrator
 */
export interface OrchestratorOptions {
  /** Whether to use localStorage caching (default: true) */
  useCache?: boolean;
  /** Cache TTL in milliseconds (default: 24 hours) */
  cacheTTL?: number;
  /** Progress callback for UI updates */
  onProgress?: ProgressCallback;
}

// =============================================================================
// Constants
// =============================================================================

const CACHE_KEY_PREFIX = 'ghost-note-analysis-';
const DEFAULT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Analysis stages with their weight for progress calculation
 */
const ANALYSIS_STAGES = [
  { name: 'preprocess', weight: 5, message: 'Preprocessing poem text...' },
  { name: 'phonetic', weight: 20, message: 'Looking up phonetics...' },
  { name: 'stress', weight: 15, message: 'Analyzing stress patterns...' },
  { name: 'meter', weight: 15, message: 'Detecting meter...' },
  { name: 'rhyme', weight: 10, message: 'Analyzing rhyme scheme...' },
  { name: 'soundPatterns', weight: 10, message: 'Detecting sound patterns...' },
  { name: 'singability', weight: 10, message: 'Scoring singability...' },
  { name: 'emotion', weight: 10, message: 'Analyzing emotional content...' },
  { name: 'structure', weight: 15, message: 'Detecting verse/chorus structure...' },
] as const;

// =============================================================================
// Logging
// =============================================================================

const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[orchestrator] ${message}`, ...args);
  }
};

// =============================================================================
// Caching Functions
// =============================================================================

/**
 * Generates a simple hash of a string for cache key generation.
 * Uses a variation of djb2 hash algorithm.
 *
 * @param text - The text to hash
 * @returns A hex string hash
 */
export function hashText(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) + hash) ^ char;
  }
  // Convert to unsigned 32-bit integer and then to hex
  return (hash >>> 0).toString(16);
}

/**
 * Checks if localStorage is available in the current environment.
 *
 * @returns True if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__test__';
    if (typeof localStorage === 'undefined') {
      return false;
    }
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieves a cached analysis from localStorage.
 *
 * @param hash - The hash of the poem text
 * @param ttl - Cache TTL in milliseconds
 * @returns Cached PoemAnalysis or null if not found/expired
 */
export function getCachedAnalysis(hash: string, ttl: number = DEFAULT_CACHE_TTL): PoemAnalysis | null {
  if (!isLocalStorageAvailable()) {
    log('localStorage not available, skipping cache lookup');
    return null;
  }

  try {
    const cacheKey = CACHE_KEY_PREFIX + hash;
    const cached = localStorage.getItem(cacheKey);

    if (!cached) {
      log('No cached analysis found for hash:', hash);
      return null;
    }

    const entry: CachedAnalysis = JSON.parse(cached);

    // Check if cache has expired
    const age = Date.now() - entry.timestamp;
    if (age > ttl) {
      log('Cached analysis expired, age:', age, 'ms');
      localStorage.removeItem(cacheKey);
      return null;
    }

    log('Retrieved cached analysis for hash:', hash, 'age:', age, 'ms');
    return entry.analysis;
  } catch (error) {
    log('Error reading cache:', error);
    return null;
  }
}

/**
 * Stores an analysis result in localStorage cache.
 *
 * @param hash - The hash of the poem text
 * @param analysis - The analysis result to cache
 */
export function setCachedAnalysis(hash: string, analysis: PoemAnalysis): void {
  if (!isLocalStorageAvailable()) {
    log('localStorage not available, skipping cache write');
    return;
  }

  try {
    const cacheKey = CACHE_KEY_PREFIX + hash;
    const entry: CachedAnalysis = {
      hash,
      timestamp: Date.now(),
      analysis,
    };

    localStorage.setItem(cacheKey, JSON.stringify(entry));
    log('Cached analysis for hash:', hash);
  } catch (error) {
    // Handle quota exceeded or other errors gracefully
    log('Error writing cache:', error);
    // Try to clear old entries if quota exceeded
    clearOldCacheEntries();
  }
}

/**
 * Clears expired cache entries from localStorage.
 *
 * @param ttl - Maximum age in milliseconds
 */
export function clearOldCacheEntries(ttl: number = DEFAULT_CACHE_TTL): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    const keysToRemove: string[] = [];
    const now = Date.now();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const entry: CachedAnalysis = JSON.parse(cached);
            if (now - entry.timestamp > ttl) {
              keysToRemove.push(key);
            }
          }
        } catch {
          // Invalid entry, remove it
          keysToRemove.push(key);
        }
      }
    }

    for (const key of keysToRemove) {
      localStorage.removeItem(key);
      log('Removed expired cache entry:', key);
    }
  } catch (error) {
    log('Error clearing old cache entries:', error);
  }
}

/**
 * Clears all poem analysis cache entries.
 */
export function clearAnalysisCache(): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }

    log('Cleared all analysis cache entries:', keysToRemove.length);
  } catch (error) {
    log('Error clearing analysis cache:', error);
  }
}

// =============================================================================
// Progress Tracking
// =============================================================================

/**
 * Progress tracker class that maintains state across stages.
 */
class ProgressTracker {
  private completedWeight = 0;
  private readonly totalWeight: number;
  private readonly callback?: ProgressCallback;

  constructor(callback?: ProgressCallback) {
    this.callback = callback;
    this.totalWeight = ANALYSIS_STAGES.reduce((sum, s) => sum + s.weight, 0);
  }

  startStage(stageName: string): void {
    const stage = ANALYSIS_STAGES.find((s) => s.name === stageName);
    if (!stage) return;

    const percent = Math.round((this.completedWeight / this.totalWeight) * 100);

    if (this.callback) {
      this.callback({
        stage: stageName,
        percent,
        message: stage.message,
      });
    }

    log(`Starting stage: ${stageName} - ${percent}%`);
  }

  completeStage(stageName: string): void {
    const stage = ANALYSIS_STAGES.find((s) => s.name === stageName);
    if (!stage) return;

    this.completedWeight += stage.weight;
    const percent = Math.round((this.completedWeight / this.totalWeight) * 100);

    log(`Completed stage: ${stageName} - ${percent}%`);
  }

  complete(): void {
    if (this.callback) {
      this.callback({
        stage: 'complete',
        percent: 100,
        message: 'Analysis complete!',
      });
    }
  }
}

// =============================================================================
// Analysis Building Functions
// =============================================================================

/**
 * Builds syllables from phonemes for a word.
 *
 * @param phonemes - Array of ARPAbet phonemes
 * @returns Array of Syllable objects
 */
function buildSyllables(phonemes: string[]): Syllable[] {
  if (!phonemes || phonemes.length === 0) {
    return [];
  }

  const syllables: Syllable[] = [];
  let currentSyllable: string[] = [];
  let currentVowel = '';
  let currentStress: StressLevel = 0;

  for (const phoneme of phonemes) {
    if (isVowel(phoneme)) {
      // If we already have a vowel, start a new syllable
      if (currentVowel) {
        syllables.push({
          phonemes: [...currentSyllable],
          stress: currentStress,
          vowelPhoneme: currentVowel,
          isOpen: !currentSyllable.some((p) => !isVowel(p) && currentSyllable.indexOf(p) > currentSyllable.indexOf(currentVowel)),
        });
        currentSyllable = [];
      }

      currentVowel = phoneme;
      const stress = getPhonemeStress(phoneme);
      currentStress = stress ? (parseInt(stress, 10) as StressLevel) : 0;
      currentSyllable.push(phoneme);
    } else {
      currentSyllable.push(phoneme);
    }
  }

  // Add the last syllable
  if (currentVowel) {
    const lastConsonants = currentSyllable.filter((p, i) =>
      !isVowel(p) && i > currentSyllable.findIndex((ph) => ph === currentVowel)
    );
    syllables.push({
      phonemes: currentSyllable,
      stress: currentStress,
      vowelPhoneme: currentVowel,
      isOpen: lastConsonants.length === 0,
    });
  }

  return syllables;
}

/**
 * Analyzes a single word and returns SyllabifiedWord.
 *
 * @param word - The word to analyze
 * @returns SyllabifiedWord with syllables
 */
function analyzeWordForStructure(word: string): SyllabifiedWord {
  // Try CMU dictionary first
  const cmuResult = cmuAnalyzeWord(word);

  if (cmuResult.inDictionary && cmuResult.phonemes.length > 0) {
    return {
      text: word,
      syllables: buildSyllables(cmuResult.phonemes),
    };
  }

  // Fall back to estimation
  const estimated = analyzeUnknownWord(word);
  const syllableCount = estimated.syllableCount;
  const stressPattern = estimated.stressPattern;

  // Create placeholder syllables for estimated words
  const syllables: Syllable[] = [];
  for (let i = 0; i < syllableCount; i++) {
    const stress = stressPattern[i];
    syllables.push({
      phonemes: [],
      stress: stress ? (parseInt(stress, 10) as StressLevel) : 0,
      vowelPhoneme: '',
      isOpen: i === syllableCount - 1, // Assume last syllable is open
    });
  }

  return {
    text: word,
    syllables,
  };
}

/**
 * Builds an AnalyzedLine from text.
 *
 * @param lineText - The line text
 * @returns AnalyzedLine with words and analysis
 */
function buildAnalyzedLine(lineText: string): AnalyzedLine {
  const words = tokenizeWords(lineText);
  const syllabifiedWords: SyllabifiedWord[] = words.map(analyzeWordForStructure);

  // Calculate stress pattern from words
  const stressPattern = syllabifiedWords
    .flatMap((w) => w.syllables.map((s) => s.stress.toString()))
    .join('');

  // Calculate total syllable count
  const syllableCount = syllabifiedWords.reduce((sum, w) => sum + w.syllables.length, 0);

  // Create a preliminary line for singability analysis
  const preliminaryLine: AnalyzedLine = {
    text: lineText,
    words: syllabifiedWords,
    stressPattern,
    syllableCount,
    singability: {
      syllableScores: [],
      lineScore: 0,
      problemSpots: [],
    },
  };

  // Analyze singability
  const singability = analyzeLineSingability(preliminaryLine);

  return {
    ...preliminaryLine,
    singability,
  };
}

/**
 * Determines time signature from meter analysis.
 *
 * @param meter - The meter analysis
 * @returns Suggested time signature
 */
function determineTimeSignature(meter: MeterAnalysisType): TimeSignature {
  const footType = meter.footType;

  // Triple meters for ternary feet
  if (footType === 'anapest' || footType === 'dactyl') {
    return '6/8';
  }

  // Common time for binary feet
  if (footType === 'iamb' || footType === 'trochee' || footType === 'spondee') {
    // Pentameter often feels more like 4/4
    if (meter.feetPerLine >= 5) {
      return '4/4';
    }
    // Tetrameter can work in 4/4 or 2/4
    if (meter.feetPerLine === 4) {
      return '4/4';
    }
    // Shorter lines may work better in 2/4
    return '2/4';
  }

  // Default to 4/4 for unknown
  return '4/4';
}

/**
 * Determines suggested tempo from emotional analysis.
 *
 * @param arousal - Arousal level (0-1)
 * @param tempoRange - Suggested tempo range from emotion
 * @returns Suggested tempo in BPM
 */
function determineTempo(arousal: number, tempoRange: [number, number]): number {
  // Interpolate within the suggested range based on arousal
  const [min, max] = tempoRange;
  return Math.round(min + (max - min) * arousal);
}

/**
 * Identifies problem spots in the poem.
 *
 * @param structure - The analyzed structure
 * @param meter - The meter analysis
 * @returns Array of problem reports
 */
function identifyProblems(
  structure: { stanzas: AnalyzedStanza[] },
  meter: MeterAnalysisType,
): ProblemReport[] {
  const problems: ProblemReport[] = [];
  let globalLineIndex = 0;

  for (const stanza of structure.stanzas) {
    for (const line of stanza.lines) {
      // Check for meter deviations
      if (meter.footType !== 'unknown') {
        const deviations = findDeviations(line.stressPattern, meter.footType);
        for (const devPos of deviations) {
          if (deviations.length > line.stressPattern.length * 0.3) {
            problems.push({
              line: globalLineIndex,
              position: devPos,
              type: 'stress_mismatch',
              severity: 'medium',
              description: `Stress deviation at syllable ${devPos + 1} breaks ${meter.footType}ic pattern`,
            });
          }
        }
      }

      // Check for singability problems
      for (const problem of line.singability.problemSpots) {
        if (problem.severity !== 'low') {
          problems.push({
            line: globalLineIndex,
            position: problem.position,
            type: 'singability',
            severity: problem.severity,
            description: problem.issue,
          });
        }
      }

      // Check for syllable variance (lines with very different syllable counts)
      const avgSyllables = meter.feetPerLine * (meter.footType === 'anapest' || meter.footType === 'dactyl' ? 3 : 2);
      if (avgSyllables > 0 && Math.abs(line.syllableCount - avgSyllables) > avgSyllables * 0.4) {
        problems.push({
          line: globalLineIndex,
          position: 0,
          type: 'syllable_variance',
          severity: 'low',
          description: `Line has ${line.syllableCount} syllables (expected ~${Math.round(avgSyllables)})`,
        });
      }

      globalLineIndex++;
    }
  }

  return problems;
}

/**
 * Checks if a stanza is at a section transition point.
 * Section transitions (verse -> chorus, chorus -> bridge, etc.) warrant
 * stronger phrase breaks in the melody.
 *
 * @param songStructure - The structure analysis
 * @param stanzaIdx - Current stanza index
 * @returns True if this stanza ends a section and the next starts a different type
 */
function isSectionTransition(
  songStructure: import('./structure').StructureAnalysis,
  stanzaIdx: number
): boolean {
  const { sections } = songStructure;

  // Find section containing current stanza
  const currentSection = sections.find((s) =>
    s.stanzaIndices.includes(stanzaIdx)
  );

  // Find section containing next stanza
  const nextSection = sections.find((s) =>
    s.stanzaIndices.includes(stanzaIdx + 1)
  );

  // If either is not found, or they're the same section, no transition
  if (!currentSection || !nextSection) {
    return false;
  }

  // Transition if section types differ or if they're different section instances
  return (
    currentSection.type !== nextSection.type ||
    currentSection.stanzaIndices !== nextSection.stanzaIndices
  );
}

// =============================================================================
// Main Analysis Function
// =============================================================================

/**
 * Performs a complete poem analysis.
 *
 * This is the main entry point for the analysis pipeline. It:
 * 1. Checks cache for existing analysis
 * 2. Runs all analysis stages in order
 * 3. Caches the result
 * 4. Reports progress throughout
 *
 * @param text - The poem text to analyze
 * @param options - Optional configuration
 * @returns Complete PoemAnalysis
 *
 * @example
 * const analysis = await analyzePoem("Roses are red\nViolets are blue");
 *
 * @example
 * const analysis = await analyzePoem(text, {
 *   onProgress: (p) => console.log(`${p.percent}%: ${p.message}`),
 * });
 */
export async function analyzePoem(
  text: string,
  options: OrchestratorOptions = {}
): Promise<PoemAnalysis> {
  const {
    useCache = true,
    cacheTTL = DEFAULT_CACHE_TTL,
    onProgress,
  } = options;

  log('Starting poem analysis, text length:', text.length);

  // Check cache first
  const textHash = hashText(text);
  if (useCache) {
    const cached = getCachedAnalysis(textHash, cacheTTL);
    if (cached) {
      log('Returning cached analysis');
      if (onProgress) {
        onProgress({ stage: 'cached', percent: 100, message: 'Loaded from cache' });
      }
      return cached;
    }
  }

  const progress = new ProgressTracker(onProgress);

  // Handle empty text
  if (!text || text.trim() === '') {
    log('Empty text, returning default analysis');
    const defaultAnalysis = createDefaultPoemAnalysis();
    return defaultAnalysis;
  }

  // Stage 1: Preprocess
  progress.startStage('preprocess');
  const preprocessed = preprocessPoem(text);
  progress.completeStage('preprocess');

  // Stage 2: Phonetic lookup and word analysis
  progress.startStage('phonetic');
  const analyzedStanzas: AnalyzedStanza[] = [];

  for (const stanza of preprocessed.stanzas) {
    const analyzedLines: AnalyzedLine[] = [];

    for (const lineText of stanza) {
      const analyzedLine = buildAnalyzedLine(lineText);
      analyzedLines.push(analyzedLine);
    }

    analyzedStanzas.push({ lines: analyzedLines });
  }
  progress.completeStage('phonetic');

  // Stage 3: Stress pattern analysis
  progress.startStage('stress');
  const allLines = getAllLines(preprocessed);
  const lineWords = allLines.map((line) => tokenizeWords(line));
  const stressAnalyses = lineWords.map((words) => analyzeLineStress(words));
  // Get dominant foot type - used for logging/debugging
  const _dominantFoot = getDominantFoot(stressAnalyses);
  log('Dominant foot detected:', _dominantFoot);
  progress.completeStage('stress');

  // Stage 4: Meter detection
  progress.startStage('meter');
  const stressPatterns = stressAnalyses.map((a) => a.pattern);
  const meterAnalysis = analyzeMultiLineMeter(stressPatterns);

  // Build the meter analysis for PoemAnalysis
  const avgFeet = stressPatterns.length > 0
    ? Math.round(stressPatterns.reduce((sum, p) => sum + countFeet(p, meterAnalysis.footType), 0) / stressPatterns.length)
    : 0;

  const combinedPattern = stressPatterns.join('');
  const meterResult: MeterAnalysisType = {
    pattern: combinedPattern,
    detectedMeter: meterAnalysis.meterName,
    footType: meterAnalysis.footType,
    feetPerLine: avgFeet,
    confidence: meterAnalysis.confidence,
    deviations: meterAnalysis.footType !== 'unknown' ? findDeviations(combinedPattern, meterAnalysis.footType) : [],
  };
  progress.completeStage('meter');

  // Stage 5: Rhyme analysis
  progress.startStage('rhyme');
  const rhymeAnalysis = analyzeRhymes(allLines);
  progress.completeStage('rhyme');

  // Stage 6: Sound patterns analysis (alliteration, assonance, consonance)
  progress.startStage('soundPatterns');
  const soundPatternsAnalysis = analyzeSoundPatterns(allLines);
  log('Sound patterns detected:', soundPatternsAnalysis.summary);
  progress.completeStage('soundPatterns');

  // Stage 7: Singability is already done per-line in Stage 2
  progress.startStage('singability');
  // Just a placeholder - singability was calculated during line analysis
  progress.completeStage('singability');

  // Stage 8: Emotion analysis
  progress.startStage('emotion');
  const emotionAnalysis = analyzeEmotion(text, preprocessed.stanzas);
  progress.completeStage('emotion');

  // Stage 8: Structure analysis (verse/chorus detection)
  progress.startStage('structure');
  const songStructure = analyzeStructure(preprocessed.stanzas);
  progress.completeStage('structure');

  // Build the complete analysis
  const totalWordCount = countWords(preprocessed);
  const totalSyllableCount = analyzedStanzas.reduce(
    (sum, stanza) => sum + stanza.lines.reduce(
      (lineSum, line) => lineSum + line.syllableCount, 0
    ), 0
  );

  // Identify problems
  const problems = identifyProblems({ stanzas: analyzedStanzas }, meterResult);

  // Calculate phrase breaks (line ends within stanzas)
  // Use structure analysis to inform phrase breaks if available
  const phraseBreaks: number[] = [];
  let lineIndex = 0;
  for (let stanzaIdx = 0; stanzaIdx < analyzedStanzas.length; stanzaIdx++) {
    const stanza = analyzedStanzas[stanzaIdx];
    for (let i = 0; i < stanza.lines.length; i++) {
      lineIndex++;
      // Mark stanza ends and every 2-4 lines as phrase breaks
      // Also mark section transitions as phrase breaks
      const isStanzaEnd = i === stanza.lines.length - 1;
      const isSectionEnd = isStanzaEnd && isSectionTransition(songStructure, stanzaIdx);
      if (isStanzaEnd || (i + 1) % 2 === 0 || isSectionEnd) {
        phraseBreaks.push(lineIndex - 1);
      }
    }
  }

  const analysis: PoemAnalysis = {
    meta: {
      title: undefined,
      lineCount: preprocessed.lineCount,
      stanzaCount: preprocessed.stanzaCount,
      wordCount: totalWordCount,
      syllableCount: totalSyllableCount,
    },
    structure: {
      stanzas: analyzedStanzas,
    },
    prosody: {
      meter: meterResult,
      rhyme: rhymeAnalysis,
      regularity: meterAnalysis.regularity,
    },
    soundPatterns: soundPatternsAnalysis,
    emotion: emotionAnalysis,
    problems,
    melodySuggestions: {
      timeSignature: determineTimeSignature(meterResult),
      tempo: determineTempo(emotionAnalysis.arousal, emotionAnalysis.suggestedMusicParams.tempoRange),
      key: emotionAnalysis.suggestedMusicParams.mode === 'minor' ? 'Am' : 'C',
      mode: emotionAnalysis.suggestedMusicParams.mode,
      phraseBreaks,
    },
    songStructure,
  };

  // Cache the result
  if (useCache) {
    setCachedAnalysis(textHash, analysis);
  }

  progress.complete();
  log('Analysis complete');

  return analysis;
}

/**
 * Performs incremental analysis, reusing previous results where applicable.
 *
 * This function is optimized for cases where the poem has been slightly
 * modified. It compares the new text with the previous analysis and
 * attempts to reuse unchanged portions.
 *
 * Currently, this is implemented as a full re-analysis with cache check.
 * Future optimization could diff the text and only re-analyze changed lines.
 *
 * @param text - The poem text to analyze
 * @param previous - Previous analysis result, or null
 * @param options - Optional configuration
 * @returns Complete PoemAnalysis
 *
 * @example
 * const analysis = await analyzeIncrementally(
 *   "Roses are red\nViolets are blue",
 *   previousAnalysis,
 *   { onProgress: (p) => updateUI(p) }
 * );
 */
export async function analyzeIncrementally(
  text: string,
  previous: PoemAnalysis | null,
  options: OrchestratorOptions = {}
): Promise<PoemAnalysis> {
  const { onProgress } = options;

  log('Starting incremental analysis');

  // If no previous analysis, do a full analysis
  if (!previous) {
    log('No previous analysis, performing full analysis');
    return analyzePoem(text, options);
  }

  // Check if the text has changed by comparing hashes
  const textHash = hashText(text);

  // For now, we check if the analysis is already cached
  // Future improvement: diff the text and only re-analyze changed portions
  const cached = getCachedAnalysis(textHash, options.cacheTTL || DEFAULT_CACHE_TTL);
  if (cached) {
    log('Found cached incremental result');
    if (onProgress) {
      onProgress({ stage: 'cached', percent: 100, message: 'Loaded from cache' });
    }
    return cached;
  }

  // Perform full analysis (future: implement true incremental analysis)
  log('Cache miss, performing full analysis');
  return analyzePoem(text, options);
}

/**
 * Re-exports for convenience
 */
export { createDefaultPoemAnalysis } from '@/types/analysis';
