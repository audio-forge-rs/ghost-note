/**
 * Stress Pattern Analysis Module
 *
 * This module handles Stage 5 of the poem analysis pipeline:
 * - Extract stress patterns from phonetic data
 * - Build line-level stress patterns
 * - Classify metrical feet
 * - Detect deviations from expected patterns
 *
 * @module lib/analysis/stress
 */

import {
  getStress,
  getPhonemeStress,
  type StressLevel as CmuStressLevel,
} from '@/lib/phonetics';
import type { FootType } from '@/types/analysis';

// =============================================================================
// Types
// =============================================================================

/** Stress level for a syllable: '0' = unstressed, '1' = primary, '2' = secondary */
export type StressLevel = '0' | '1' | '2';

/**
 * Complete stress analysis result for a line or word
 */
export interface StressAnalysis {
  /** Stress pattern as string of 0s, 1s, 2s (e.g., "01010101") */
  pattern: string;
  /** Array of individual stress levels for each syllable */
  syllableStresses: StressLevel[];
  /** Detected foot type */
  footType: FootType;
  /** Positions (0-indexed) where pattern deviates from expected foot */
  deviations: number[];
}

// =============================================================================
// Logging
// =============================================================================

const DEBUG = process.env.NODE_ENV === 'development';
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[stress] ${message}`, ...args);
  }
};

// =============================================================================
// Foot Pattern Constants
// =============================================================================

/**
 * Canonical stress patterns for each foot type
 * Patterns use binary representation: 0 = unstressed, 1 = stressed
 * (We treat both primary '1' and secondary '2' as stressed for pattern matching)
 */
const FOOT_PATTERNS: Record<FootType, string> = {
  iamb: '01', // da-DUM (unstressed-stressed)
  trochee: '10', // DUM-da (stressed-unstressed)
  anapest: '001', // da-da-DUM (unstressed-unstressed-stressed)
  dactyl: '100', // DUM-da-da (stressed-unstressed-unstressed)
  spondee: '11', // DUM-DUM (stressed-stressed)
  unknown: '',
};


// =============================================================================
// Core Functions
// =============================================================================

/**
 * Extracts stress pattern from an array of phonemes.
 *
 * ARPAbet vowels include stress markers:
 * - 0 = no stress (unstressed)
 * - 1 = primary stress
 * - 2 = secondary stress
 *
 * @param phonemes - Array of ARPAbet phonemes (e.g., ["HH", "AH0", "L", "OW1"])
 * @returns Stress pattern string (e.g., "01" for "hello")
 *
 * @example
 * extractStressFromPhonemes(['HH', 'AH0', 'L', 'OW1']) // "01"
 * extractStressFromPhonemes(['B', 'Y', 'UW1', 'T', 'AH0', 'F', 'AH0', 'L']) // "100"
 */
export function extractStressFromPhonemes(phonemes: string[]): string {
  log('extractStressFromPhonemes input:', phonemes);

  if (!phonemes || phonemes.length === 0) {
    return '';
  }

  const stressPattern = phonemes
    .map((phoneme) => getPhonemeStress(phoneme))
    .filter((stress): stress is CmuStressLevel => stress !== null)
    .join('');

  log('extractStressFromPhonemes output:', stressPattern);
  return stressPattern;
}

/**
 * Estimates syllable count and stress pattern for unknown words.
 *
 * Uses heuristics based on English orthography:
 * - Counts vowel groups (a, e, i, o, u, y)
 * - Handles silent e
 * - Estimates stress based on common patterns
 *
 * @param word - The word to estimate stress for
 * @returns Estimated stress pattern, or empty string if unable to estimate
 *
 * @example
 * estimateStressForUnknownWord('xyz') // "1" (single syllable gets stress)
 * estimateStressForUnknownWord('hello') // "01" (fallback estimate)
 */
export function estimateStressForUnknownWord(word: string): string {
  log('estimateStressForUnknownWord input:', word);

  if (!word || word.trim() === '') {
    return '';
  }

  const cleaned = word.toLowerCase().trim();

  // Count vowel groups to estimate syllables
  // Vowels are: a, e, i, o, u, and sometimes y
  // We count groups of consecutive vowels as one syllable
  const vowelPattern = /[aeiouy]+/gi;
  const vowelGroups = cleaned.match(vowelPattern) || [];
  let syllableCount = vowelGroups.length;

  // Handle silent e at end of words
  if (cleaned.endsWith('e') && syllableCount > 1 && !cleaned.endsWith('le')) {
    // Words like "make", "time" - final e is silent
    const beforeE = cleaned.slice(0, -1);
    // Check if there's a consonant before the e
    if (/[bcdfghjklmnpqrstvwxz]$/.test(beforeE)) {
      syllableCount--;
    }
  }

  // Handle -ed endings that don't add syllables
  if (cleaned.endsWith('ed') && syllableCount > 1) {
    const beforeEd = cleaned.slice(0, -2);
    // -ed adds syllable only after t or d
    if (!/[td]$/.test(beforeEd)) {
      syllableCount--;
    }
  }

  // Minimum 1 syllable
  syllableCount = Math.max(1, syllableCount);

  log('estimateStressForUnknownWord syllable count:', syllableCount);

  // Generate stress pattern based on common English patterns
  let pattern = '';

  if (syllableCount === 1) {
    // Single syllable words are stressed
    pattern = '1';
  } else if (syllableCount === 2) {
    // Most 2-syllable English words are trochaic (first syllable stressed)
    // But many common words are iambic - use trochee as default
    pattern = '10';
  } else if (syllableCount === 3) {
    // 3-syllable words often have first or second stressed
    // Default to dactylic pattern
    pattern = '100';
  } else {
    // Longer words: alternate stress starting with unstressed
    // This creates a somewhat iambic pattern
    pattern = Array(syllableCount)
      .fill(0)
      .map((_, i) => (i % 2 === 1 ? '1' : '0'))
      .join('');
  }

  log('estimateStressForUnknownWord output:', pattern);
  return pattern;
}

/**
 * Gets the stress pattern for a single word.
 *
 * First tries CMU dictionary lookup. If the word is not found,
 * falls back to heuristic estimation.
 *
 * @param word - The word to analyze
 * @returns Stress pattern string, or empty string if unable to determine
 *
 * @example
 * getWordStressPattern('hello') // "01"
 * getWordStressPattern('beautiful') // "100"
 * getWordStressPattern('unknownword') // Estimated pattern
 */
export function getWordStressPattern(word: string): string {
  log('getWordStressPattern input:', word);

  if (!word || word.trim() === '') {
    return '';
  }

  // Try CMU dictionary first
  const cmuStress = getStress(word);
  if (cmuStress !== null) {
    log('getWordStressPattern CMU result:', cmuStress);
    return cmuStress;
  }

  // Fall back to estimation for unknown words
  const estimated = estimateStressForUnknownWord(word);
  log('getWordStressPattern estimated:', estimated);
  return estimated;
}

/**
 * Builds a combined stress pattern for a line of words.
 *
 * Concatenates the stress patterns of all words in the line.
 *
 * @param words - Array of words in the line
 * @returns Combined stress pattern for the entire line
 *
 * @example
 * getLineStressPattern(['the', 'woods', 'are', 'lovely'])
 * // Returns something like "01010101" for iambic pattern
 */
export function getLineStressPattern(words: string[]): string {
  log('getLineStressPattern input:', words);

  if (!words || words.length === 0) {
    return '';
  }

  const linePattern = words.map((word) => getWordStressPattern(word)).join('');

  log('getLineStressPattern output:', linePattern);
  return linePattern;
}

/**
 * Converts a raw stress pattern to binary (0/1) for foot classification.
 *
 * Treats both primary (1) and secondary (2) stress as stressed (1).
 *
 * @param pattern - Raw stress pattern with 0, 1, 2
 * @returns Binary pattern with only 0 and 1
 */
function toBinaryStress(pattern: string): string {
  return pattern.replace(/2/g, '1');
}

/**
 * Calculates how well a stress pattern matches a foot type.
 *
 * Uses a sliding window approach to find the best alignment,
 * then calculates match percentage.
 *
 * @param binaryPattern - Binary stress pattern (0s and 1s)
 * @param footPattern - Canonical foot pattern to match against
 * @returns Match score from 0.0 to 1.0
 */
function calculateFootMatch(binaryPattern: string, footPattern: string): number {
  if (binaryPattern.length === 0 || footPattern.length === 0) {
    return 0;
  }

  const footLen = footPattern.length;
  let totalMatches = 0;
  let totalComparisons = 0;

  // Compare pattern against repeated foot
  for (let i = 0; i < binaryPattern.length; i++) {
    const footIndex = i % footLen;
    if (binaryPattern[i] === footPattern[footIndex]) {
      totalMatches++;
    }
    totalComparisons++;
  }

  return totalComparisons > 0 ? totalMatches / totalComparisons : 0;
}

/**
 * Classifies a stress pattern as a metrical foot type.
 *
 * Analyzes the pattern to determine which standard foot type
 * it most closely matches:
 * - iamb: unstressed-stressed (da-DUM)
 * - trochee: stressed-unstressed (DUM-da)
 * - anapest: unstressed-unstressed-stressed (da-da-DUM)
 * - dactyl: stressed-unstressed-unstressed (DUM-da-da)
 * - spondee: stressed-stressed (DUM-DUM)
 *
 * @param pattern - Stress pattern string (e.g., "01010101")
 * @returns The detected foot type, or 'unknown' if no clear match
 *
 * @example
 * classifyFoot('01010101') // 'iamb'
 * classifyFoot('10101010') // 'trochee'
 * classifyFoot('001001001') // 'anapest'
 * classifyFoot('100100100') // 'dactyl'
 * classifyFoot('1111') // 'spondee'
 */
export function classifyFoot(pattern: string): FootType {
  log('classifyFoot input:', pattern);

  if (!pattern || pattern.length === 0) {
    return 'unknown';
  }

  // Convert to binary stress (treat 2 as 1)
  const binaryPattern = toBinaryStress(pattern);
  log('classifyFoot binary pattern:', binaryPattern);

  // Short patterns
  if (binaryPattern.length === 1) {
    // Single syllable - could be anything
    return 'unknown';
  }

  if (binaryPattern.length === 2) {
    // Direct match for 2-syllable patterns
    if (binaryPattern === '01') return 'iamb';
    if (binaryPattern === '10') return 'trochee';
    if (binaryPattern === '11') return 'spondee';
    if (binaryPattern === '00') return 'unknown'; // pyrrhic foot, but we use unknown
    return 'unknown';
  }

  // For longer patterns, find best matching foot type
  const footTypes: FootType[] = ['iamb', 'trochee', 'anapest', 'dactyl', 'spondee'];
  let bestFoot: FootType = 'unknown';
  let bestScore = 0;

  for (const foot of footTypes) {
    const footPattern = FOOT_PATTERNS[foot];
    if (!footPattern) continue;

    const score = calculateFootMatch(binaryPattern, footPattern);
    log(`classifyFoot ${foot} score:`, score);

    if (score > bestScore) {
      bestScore = score;
      bestFoot = foot;
    }
  }

  // Require at least 70% match to classify
  const result = bestScore >= 0.7 ? bestFoot : 'unknown';
  log('classifyFoot result:', result, 'score:', bestScore);
  return result;
}

/**
 * Detects positions where the stress pattern deviates from the expected foot.
 *
 * Compares each position in the pattern against the expected alternation
 * for the given foot type, returning indices where mismatches occur.
 *
 * @param pattern - The stress pattern to analyze
 * @param expectedFoot - The expected foot type
 * @returns Array of 0-indexed positions where deviations occur
 *
 * @example
 * detectDeviations('01010101', 'iamb') // [] (perfect iambic)
 * detectDeviations('01110101', 'iamb') // [2] (deviation at position 2)
 * detectDeviations('10010101', 'iamb') // [0, 2] (deviations at 0 and 2)
 */
export function detectDeviations(pattern: string, expectedFoot: FootType): number[] {
  log('detectDeviations input:', { pattern, expectedFoot });

  if (!pattern || pattern.length === 0) {
    return [];
  }

  const footPattern = FOOT_PATTERNS[expectedFoot];
  if (!footPattern || footPattern.length === 0) {
    // Unknown foot type - can't detect deviations
    return [];
  }

  // Convert to binary for comparison
  const binaryPattern = toBinaryStress(pattern);
  const footLen = footPattern.length;

  const deviations: number[] = [];

  for (let i = 0; i < binaryPattern.length; i++) {
    const expectedChar = footPattern[i % footLen];
    const actualChar = binaryPattern[i];

    if (expectedChar !== actualChar) {
      deviations.push(i);
    }
  }

  log('detectDeviations output:', deviations);
  return deviations;
}

/**
 * Performs a complete stress analysis on a line of words.
 *
 * Combines all stress analysis functions to provide:
 * - Combined stress pattern
 * - Individual syllable stresses
 * - Detected foot type
 * - Deviation positions
 *
 * @param words - Array of words in the line
 * @returns Complete StressAnalysis object
 *
 * @example
 * analyzeLineStress(['the', 'woods', 'are', 'lovely', 'dark', 'and', 'deep'])
 * // Returns StressAnalysis with pattern, footType, deviations
 */
export function analyzeLineStress(words: string[]): StressAnalysis {
  log('analyzeLineStress input:', words);

  if (!words || words.length === 0) {
    return {
      pattern: '',
      syllableStresses: [],
      footType: 'unknown',
      deviations: [],
    };
  }

  // Get combined stress pattern
  const pattern = getLineStressPattern(words);

  // Convert to array of stress levels
  const syllableStresses: StressLevel[] = pattern.split('').map((char) => {
    if (char === '0' || char === '1' || char === '2') {
      return char;
    }
    return '0'; // Default to unstressed for unexpected characters
  });

  // Classify the foot type
  const footType = classifyFoot(pattern);

  // Detect deviations from the detected foot
  const deviations = detectDeviations(pattern, footType);

  const result: StressAnalysis = {
    pattern,
    syllableStresses,
    footType,
    deviations,
  };

  log('analyzeLineStress output:', result);
  return result;
}

/**
 * Gets the name of a meter based on foot type and number of feet.
 *
 * Combines foot type with line length to produce meter names like
 * "iambic_pentameter" or "trochaic_tetrameter".
 *
 * @param footType - The type of metrical foot
 * @param feetCount - Number of feet in the line
 * @returns Meter name string (e.g., "iambic_pentameter")
 */
export function getMeterName(footType: FootType, feetCount: number): string {
  if (footType === 'unknown') {
    return 'irregular';
  }

  const footToMeter: Record<FootType, string> = {
    iamb: 'iambic',
    trochee: 'trochaic',
    anapest: 'anapestic',
    dactyl: 'dactylic',
    spondee: 'spondaic',
    unknown: 'irregular',
  };

  const countToName: Record<number, string> = {
    1: 'monometer',
    2: 'dimeter',
    3: 'trimeter',
    4: 'tetrameter',
    5: 'pentameter',
    6: 'hexameter',
    7: 'heptameter',
    8: 'octameter',
  };

  const meterAdjective = footToMeter[footType] || 'irregular';
  const lengthName = countToName[feetCount] || `${feetCount}-foot`;

  return `${meterAdjective}_${lengthName}`;
}

/**
 * Counts the number of metrical feet in a pattern based on foot type.
 *
 * @param pattern - The stress pattern
 * @param footType - The detected foot type
 * @returns Number of complete feet in the pattern
 */
export function countFeet(pattern: string, footType: FootType): number {
  const footPattern = FOOT_PATTERNS[footType];
  if (!footPattern || footPattern.length === 0) {
    // For unknown foot type, estimate based on syllable pairs
    return Math.ceil(pattern.length / 2);
  }

  // Count how many complete feet fit in the pattern
  return Math.ceil(pattern.length / footPattern.length);
}

/**
 * Calculates confidence score for foot type classification.
 *
 * Based on how well the pattern matches the detected foot type.
 *
 * @param pattern - The stress pattern
 * @param footType - The detected foot type
 * @returns Confidence score from 0.0 to 1.0
 */
export function calculateConfidence(pattern: string, footType: FootType): number {
  if (!pattern || footType === 'unknown') {
    return 0;
  }

  const footPattern = FOOT_PATTERNS[footType];
  if (!footPattern) {
    return 0;
  }

  const binaryPattern = toBinaryStress(pattern);
  return calculateFootMatch(binaryPattern, footPattern);
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Checks if a stress pattern is regular (consistent foot pattern).
 *
 * @param pattern - The stress pattern to check
 * @returns True if the pattern is regular, false if irregular
 */
export function isRegularPattern(pattern: string): boolean {
  if (!pattern || pattern.length < 2) {
    return true; // Too short to be irregular
  }

  const footType = classifyFoot(pattern);
  if (footType === 'unknown') {
    return false;
  }

  const deviations = detectDeviations(pattern, footType);
  // Allow up to 10% deviation for "regular" classification
  const deviationRate = deviations.length / pattern.length;
  return deviationRate <= 0.1;
}

/**
 * Analyzes stress pattern for multiple lines.
 *
 * @param lines - Array of word arrays (one array per line)
 * @returns Array of StressAnalysis objects
 */
export function analyzePoemStress(lines: string[][]): StressAnalysis[] {
  return lines.map((lineWords) => analyzeLineStress(lineWords));
}

/**
 * Determines the dominant foot type across multiple lines.
 *
 * @param analyses - Array of line stress analyses
 * @returns The most common foot type, or 'unknown' if no clear pattern
 */
export function getDominantFoot(analyses: StressAnalysis[]): FootType {
  if (!analyses || analyses.length === 0) {
    return 'unknown';
  }

  const footCounts: Record<FootType, number> = {
    iamb: 0,
    trochee: 0,
    anapest: 0,
    dactyl: 0,
    spondee: 0,
    unknown: 0,
  };

  for (const analysis of analyses) {
    footCounts[analysis.footType]++;
  }

  // Find the most common foot type (excluding 'unknown')
  let maxCount = 0;
  let dominantFoot: FootType = 'unknown';

  for (const [foot, count] of Object.entries(footCounts)) {
    if (foot !== 'unknown' && count > maxCount) {
      maxCount = count;
      dominantFoot = foot as FootType;
    }
  }

  // Require at least 40% of lines to have the same foot type
  const threshold = analyses.length * 0.4;
  return maxCount >= threshold ? dominantFoot : 'unknown';
}
