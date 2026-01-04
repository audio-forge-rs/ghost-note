/**
 * Meter Detection Module
 *
 * This module implements Stage 5 of the poem analysis pipeline:
 * - Detects meter type from stress patterns
 * - Classifies line lengths (monometer through hexameter)
 * - Calculates regularity scores for pattern consistency
 * - Uses Levenshtein distance for fuzzy pattern matching
 *
 * @module lib/analysis/meter
 */

import type { FootType } from '@/types/analysis';

// =============================================================================
// Debug Logging
// =============================================================================

const DEBUG = process.env.NODE_ENV === 'development';
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[meter] ${message}`, ...args);
  }
};

// =============================================================================
// Types
// =============================================================================

/**
 * Line length names based on number of feet
 */
export type LineLengthName =
  | 'monometer'
  | 'dimeter'
  | 'trimeter'
  | 'tetrameter'
  | 'pentameter'
  | 'hexameter'
  | 'heptameter'
  | 'octameter';

/**
 * Complete meter analysis result
 */
export interface MeterAnalysis {
  /** The type of metrical foot (e.g., 'iamb', 'trochee') */
  footType: FootType;
  /** The line length name (e.g., 'pentameter') */
  lineLength: LineLengthName;
  /** Number of metrical feet per line */
  feetPerLine: number;
  /** The original stress pattern */
  pattern: string;
  /** How well the pattern matches the ideal meter (0-1) */
  regularity: number;
  /** Confidence score for the detection (0-1) */
  confidence: number;
  /** Human-readable meter name (e.g., 'iambic pentameter') */
  meterName: string;
}

/**
 * A potential meter match with its score
 */
export interface MeterMatch {
  /** The meter name (e.g., 'iambic pentameter') */
  meter: string;
  /** Match score (0-1, higher is better) */
  score: number;
  /** The ideal pattern for this meter */
  pattern: string;
  /** Foot type for this meter */
  footType: FootType;
  /** Number of feet */
  feetCount: number;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Foot type definitions with their stress patterns
 * Pattern uses 0 for unstressed, 1 for stressed syllables
 */
export const FOOT_PATTERNS: Record<FootType, string> = {
  iamb: '01', // da-DUM (weak-STRONG)
  trochee: '10', // DUM-da (STRONG-weak)
  anapest: '001', // da-da-DUM (weak-weak-STRONG)
  dactyl: '100', // DUM-da-da (STRONG-weak-weak)
  spondee: '11', // DUM-DUM (STRONG-STRONG)
  unknown: '',
};

/**
 * Line length names by number of feet
 */
export const LINE_LENGTH_NAMES: Record<number, LineLengthName> = {
  1: 'monometer',
  2: 'dimeter',
  3: 'trimeter',
  4: 'tetrameter',
  5: 'pentameter',
  6: 'hexameter',
  7: 'heptameter',
  8: 'octameter',
};

/**
 * Foot type adjective forms for meter names
 */
const FOOT_TYPE_ADJECTIVES: Record<FootType, string> = {
  iamb: 'iambic',
  trochee: 'trochaic',
  anapest: 'anapestic',
  dactyl: 'dactylic',
  spondee: 'spondaic',
  unknown: 'irregular',
};

// =============================================================================
// Levenshtein Distance
// =============================================================================

/**
 * Calculates the Levenshtein (edit) distance between two strings.
 * Used for fuzzy matching of stress patterns.
 *
 * @param a - First string
 * @param b - Second string
 * @returns The number of single-character edits (insertions, deletions, substitutions)
 *          needed to transform a into b
 *
 * @example
 * levenshteinDistance('01010', '01010') // 0 (identical)
 * levenshteinDistance('01010', '01110') // 1 (one substitution)
 * levenshteinDistance('0101', '01010') // 1 (one insertion)
 */
export function levenshteinDistance(a: string, b: string): number {
  log(`levenshteinDistance: comparing "${a}" to "${b}"`);

  // Handle edge cases
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Create distance matrix
  const matrix: number[][] = [];

  // Initialize first column
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }

  // Initialize first row
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[a.length][b.length];
  log(`levenshteinDistance: result = ${distance}`);
  return distance;
}

/**
 * Normalizes Levenshtein distance to a 0-1 similarity score.
 *
 * @param a - First string
 * @param b - Second string
 * @returns Similarity score from 0 (completely different) to 1 (identical)
 */
export function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  const similarity = 1 - distance / maxLength;

  log(`stringSimilarity: "${a}" vs "${b}" = ${similarity.toFixed(3)}`);
  return similarity;
}

// =============================================================================
// Line Length Classification
// =============================================================================

/**
 * Classifies line length based on syllable count and foot type.
 *
 * The line length is determined by how many metrical feet fit in the pattern.
 * For example:
 * - 10 syllables with iambic (2 syllables/foot) = pentameter (5 feet)
 * - 12 syllables with anapestic (3 syllables/foot) = tetrameter (4 feet)
 *
 * @param syllableCount - Total number of syllables in the line
 * @param footType - The type of metrical foot (default: 'iamb')
 * @returns The line length name
 *
 * @example
 * classifyLineLength(10) // 'pentameter' (10 syllables / 2 syllables per iamb = 5 feet)
 * classifyLineLength(8) // 'tetrameter'
 * classifyLineLength(12, 'dactyl') // 'tetrameter' (12 / 3 = 4 feet)
 */
export function classifyLineLength(
  syllableCount: number,
  footType: FootType = 'iamb'
): LineLengthName {
  log(`classifyLineLength: ${syllableCount} syllables, foot type: ${footType}`);

  if (syllableCount <= 0) {
    log('classifyLineLength: zero or negative syllables, returning monometer');
    return 'monometer';
  }

  // Get syllables per foot for this foot type
  const footPattern = FOOT_PATTERNS[footType] || FOOT_PATTERNS.iamb;
  const syllablesPerFoot = footPattern.length || 2;

  // Calculate number of feet (round to nearest)
  const feetCount = Math.round(syllableCount / syllablesPerFoot);

  // Clamp to valid range (1-8)
  const clampedFeet = Math.max(1, Math.min(8, feetCount));

  const result = LINE_LENGTH_NAMES[clampedFeet] || 'tetrameter';
  log(`classifyLineLength: ${feetCount} feet -> ${result}`);
  return result;
}

/**
 * Gets the number of feet from a line length name.
 *
 * @param lineLength - The line length name
 * @returns Number of feet
 */
export function getFeetFromLineLength(lineLength: LineLengthName): number {
  const mapping: Record<LineLengthName, number> = {
    monometer: 1,
    dimeter: 2,
    trimeter: 3,
    tetrameter: 4,
    pentameter: 5,
    hexameter: 6,
    heptameter: 7,
    octameter: 8,
  };
  return mapping[lineLength] || 4;
}

// =============================================================================
// Regularity Calculation
// =============================================================================

/**
 * Calculates how regularly a stress pattern matches an ideal metrical pattern.
 *
 * This function:
 * 1. Generates the ideal pattern for the given foot type repeated for the pattern length
 * 2. Compares the actual pattern to the ideal using Levenshtein distance
 * 3. Returns a normalized score from 0 (no match) to 1 (perfect match)
 *
 * @param pattern - The actual stress pattern (e.g., "0101010110")
 * @param footType - The type of metrical foot to compare against
 * @returns Regularity score from 0 to 1
 *
 * @example
 * calculateRegularity('01010101', 'iamb') // 1.0 (perfect iambic)
 * calculateRegularity('01010110', 'iamb') // ~0.875 (one deviation)
 * calculateRegularity('10101010', 'iamb') // ~0.0 (completely opposite)
 */
export function calculateRegularity(pattern: string, footType: FootType): number {
  log(`calculateRegularity: pattern="${pattern}", footType=${footType}`);

  if (!pattern || pattern.length === 0) {
    log('calculateRegularity: empty pattern, returning 0');
    return 0;
  }

  const footPattern = FOOT_PATTERNS[footType];
  if (!footPattern || footPattern.length === 0) {
    log('calculateRegularity: unknown foot type, returning 0');
    return 0;
  }

  // Generate ideal pattern by repeating the foot pattern
  const idealLength = pattern.length;
  let idealPattern = '';
  while (idealPattern.length < idealLength) {
    idealPattern += footPattern;
  }
  // Trim to match actual pattern length
  idealPattern = idealPattern.slice(0, idealLength);

  log(`calculateRegularity: ideal pattern = "${idealPattern}"`);

  // Calculate similarity using Levenshtein distance
  const regularity = stringSimilarity(pattern, idealPattern);

  log(`calculateRegularity: regularity = ${regularity.toFixed(3)}`);
  return regularity;
}

/**
 * Finds positions where the actual pattern deviates from the ideal.
 *
 * @param pattern - The actual stress pattern
 * @param footType - The type of metrical foot
 * @returns Array of positions (0-indexed) where deviations occur
 */
export function findDeviations(pattern: string, footType: FootType): number[] {
  log(`findDeviations: pattern="${pattern}", footType=${footType}`);

  const footPattern = FOOT_PATTERNS[footType];
  if (!footPattern || !pattern) {
    return [];
  }

  // Generate ideal pattern
  let idealPattern = '';
  while (idealPattern.length < pattern.length) {
    idealPattern += footPattern;
  }
  idealPattern = idealPattern.slice(0, pattern.length);

  const deviations: number[] = [];
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] !== idealPattern[i]) {
      deviations.push(i);
    }
  }

  log(`findDeviations: found ${deviations.length} deviations at positions: ${deviations.join(', ')}`);
  return deviations;
}

// =============================================================================
// Meter Matching
// =============================================================================

/**
 * Finds the best matching meters for a given stress pattern.
 *
 * This function:
 * 1. Tests the pattern against all common meters (iambic, trochaic, anapestic, dactylic)
 * 2. For each foot type, tries different line lengths
 * 3. Uses Levenshtein distance for fuzzy matching
 * 4. Returns matches sorted by score (best first)
 *
 * @param pattern - The stress pattern to analyze
 * @returns Array of meter matches sorted by score (descending)
 *
 * @example
 * findBestMeterMatch('0101010101')
 * // [{ meter: 'iambic pentameter', score: 1.0, ... }, ...]
 */
export function findBestMeterMatch(pattern: string): MeterMatch[] {
  log(`findBestMeterMatch: pattern="${pattern}" (length=${pattern.length})`);

  if (!pattern || pattern.length === 0) {
    log('findBestMeterMatch: empty pattern, returning empty array');
    return [];
  }

  const matches: MeterMatch[] = [];

  // Test each foot type
  const footTypes: FootType[] = ['iamb', 'trochee', 'anapest', 'dactyl', 'spondee'];

  for (const footType of footTypes) {
    const footPattern = FOOT_PATTERNS[footType];
    const syllablesPerFoot = footPattern.length;

    // Calculate how many complete feet could fit
    const possibleFeetCounts = [
      Math.floor(pattern.length / syllablesPerFoot),
      Math.ceil(pattern.length / syllablesPerFoot),
    ];

    for (const feetCount of possibleFeetCounts) {
      if (feetCount < 1 || feetCount > 8) continue;

      // Generate ideal pattern for this meter
      const idealPattern = footPattern.repeat(feetCount);

      // Calculate similarity score
      const score = stringSimilarity(pattern, idealPattern);

      // Only include if score is meaningful (> 0.3)
      if (score > 0.3) {
        const lineLengthName = LINE_LENGTH_NAMES[feetCount] || 'irregular';
        const meterName = `${FOOT_TYPE_ADJECTIVES[footType]} ${lineLengthName}`;

        matches.push({
          meter: meterName,
          score,
          pattern: idealPattern,
          footType,
          feetCount,
        });
      }
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  // Remove duplicates (same meter name)
  const seen = new Set<string>();
  const uniqueMatches = matches.filter((match) => {
    if (seen.has(match.meter)) {
      return false;
    }
    seen.add(match.meter);
    return true;
  });

  log(`findBestMeterMatch: found ${uniqueMatches.length} matches`);
  if (uniqueMatches.length > 0) {
    log(`findBestMeterMatch: best match = "${uniqueMatches[0].meter}" (score=${uniqueMatches[0].score.toFixed(3)})`);
  }

  return uniqueMatches;
}

// =============================================================================
// Main Detection Function
// =============================================================================

/**
 * Detects the meter of a line from its stress pattern.
 *
 * This is the main entry point for meter detection. It:
 * 1. Normalizes the stress pattern (converts 2s to 1s for secondary stress)
 * 2. Finds the best matching meters using fuzzy matching
 * 3. Calculates regularity and confidence scores
 * 4. Returns a complete MeterAnalysis object
 *
 * @param stressPattern - String of stress markers (0, 1, 2) for each syllable
 * @returns Complete meter analysis
 *
 * @example
 * detectMeter('0101010101')
 * // {
 * //   footType: 'iamb',
 * //   lineLength: 'pentameter',
 * //   feetPerLine: 5,
 * //   pattern: '0101010101',
 * //   regularity: 1.0,
 * //   confidence: 1.0,
 * //   meterName: 'iambic pentameter'
 * // }
 *
 * detectMeter('10010010')
 * // {
 * //   footType: 'dactyl',
 * //   lineLength: 'dimeter',
 * //   ... (with appropriate regularity/confidence)
 * // }
 */
export function detectMeter(stressPattern: string): MeterAnalysis {
  log(`detectMeter: input="${stressPattern}"`);

  // Handle empty or invalid input
  if (!stressPattern || stressPattern.length === 0) {
    log('detectMeter: empty pattern, returning irregular meter');
    return {
      footType: 'unknown',
      lineLength: 'monometer',
      feetPerLine: 0,
      pattern: '',
      regularity: 0,
      confidence: 0,
      meterName: 'irregular',
    };
  }

  // Normalize pattern: convert secondary stress (2) to primary stress (1)
  // This simplifies meter detection by treating any stressed syllable as stressed
  const normalizedPattern = stressPattern.replace(/2/g, '1');
  log(`detectMeter: normalized pattern = "${normalizedPattern}"`);

  // Find best matching meters
  const matches = findBestMeterMatch(normalizedPattern);

  if (matches.length === 0) {
    log('detectMeter: no matches found, returning irregular meter');
    return {
      footType: 'unknown',
      lineLength: classifyLineLength(normalizedPattern.length),
      feetPerLine: Math.ceil(normalizedPattern.length / 2),
      pattern: normalizedPattern,
      regularity: 0,
      confidence: 0,
      meterName: 'irregular',
    };
  }

  // Use the best match
  const bestMatch = matches[0];
  log(`detectMeter: best match = "${bestMatch.meter}" with score ${bestMatch.score.toFixed(3)}`);

  // Calculate regularity for the detected foot type
  const regularity = calculateRegularity(normalizedPattern, bestMatch.footType);

  // Confidence is based on:
  // 1. The match score (how well the pattern fits the ideal)
  // 2. The gap between best match and second-best match (distinctiveness)
  let confidence = bestMatch.score;

  if (matches.length > 1) {
    // Increase confidence if there's a clear winner
    const scoreDiff = bestMatch.score - matches[1].score;
    confidence = Math.min(1, confidence + scoreDiff * 0.5);
  }

  // Reduce confidence for very short patterns (less reliable)
  if (normalizedPattern.length < 4) {
    confidence *= 0.7;
  }

  // Get line length name from feet count
  const lineLength = LINE_LENGTH_NAMES[bestMatch.feetCount] || 'tetrameter';

  const result: MeterAnalysis = {
    footType: bestMatch.footType,
    lineLength,
    feetPerLine: bestMatch.feetCount,
    pattern: normalizedPattern,
    regularity,
    confidence: Math.max(0, Math.min(1, confidence)), // Clamp to [0, 1]
    meterName: bestMatch.meter,
  };

  log(`detectMeter: result =`, result);
  return result;
}

// =============================================================================
// Multi-Line Analysis
// =============================================================================

/**
 * Analyzes meter across multiple lines and finds the dominant meter.
 *
 * This is useful for analyzing an entire poem where individual lines
 * might have variations but there's an overall metrical pattern.
 *
 * @param stressPatterns - Array of stress patterns, one per line
 * @returns The most common meter analysis, with regularity reflecting consistency
 */
export function analyzeMultiLineMeter(stressPatterns: string[]): MeterAnalysis {
  log(`analyzeMultiLineMeter: analyzing ${stressPatterns.length} lines`);

  if (!stressPatterns || stressPatterns.length === 0) {
    return detectMeter('');
  }

  // Analyze each line
  const lineAnalyses = stressPatterns.map((pattern) => detectMeter(pattern));

  // Count occurrences of each meter type
  const meterCounts = new Map<string, { count: number; analysis: MeterAnalysis }>();

  for (const analysis of lineAnalyses) {
    const key = analysis.meterName;
    const existing = meterCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      meterCounts.set(key, { count: 1, analysis });
    }
  }

  // Find the most common meter
  let dominantMeter: { count: number; analysis: MeterAnalysis } | null = null;
  for (const entry of meterCounts.values()) {
    if (!dominantMeter || entry.count > dominantMeter.count) {
      dominantMeter = entry;
    }
  }

  if (!dominantMeter) {
    return detectMeter('');
  }

  // Calculate overall regularity based on how many lines match the dominant meter
  const matchingLines = dominantMeter.count;
  const totalLines = stressPatterns.length;
  const meterConsistency = matchingLines / totalLines;

  // Average the regularity scores of lines that match the dominant meter
  let totalRegularity = 0;
  let matchCount = 0;
  for (const analysis of lineAnalyses) {
    if (analysis.meterName === dominantMeter.analysis.meterName) {
      totalRegularity += analysis.regularity;
      matchCount++;
    }
  }
  const avgRegularity = matchCount > 0 ? totalRegularity / matchCount : 0;

  // Combine meter consistency with individual line regularity
  const overallRegularity = (meterConsistency * 0.5 + avgRegularity * 0.5);

  // Create combined analysis
  const result: MeterAnalysis = {
    ...dominantMeter.analysis,
    regularity: overallRegularity,
    confidence: dominantMeter.analysis.confidence * meterConsistency,
  };

  log(`analyzeMultiLineMeter: dominant meter = "${result.meterName}" (${matchingLines}/${totalLines} lines)`);
  return result;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Creates the canonical stress pattern for a given meter.
 *
 * @param footType - The type of metrical foot
 * @param feetCount - Number of feet
 * @returns The ideal stress pattern
 *
 * @example
 * createMeterPattern('iamb', 5) // '0101010101' (iambic pentameter)
 * createMeterPattern('trochee', 4) // '10101010' (trochaic tetrameter)
 */
export function createMeterPattern(footType: FootType, feetCount: number): string {
  const footPattern = FOOT_PATTERNS[footType] || FOOT_PATTERNS.iamb;
  return footPattern.repeat(feetCount);
}

/**
 * Gets all possible line length names.
 */
export function getAllLineLengthNames(): LineLengthName[] {
  return [
    'monometer',
    'dimeter',
    'trimeter',
    'tetrameter',
    'pentameter',
    'hexameter',
    'heptameter',
    'octameter',
  ];
}

/**
 * Gets all foot types.
 */
export function getAllFootTypes(): FootType[] {
  return ['iamb', 'trochee', 'anapest', 'dactyl', 'spondee', 'unknown'];
}

/**
 * Converts a foot type to its adjective form.
 */
export function footTypeToAdjective(footType: FootType): string {
  return FOOT_TYPE_ADJECTIVES[footType] || 'irregular';
}

/**
 * Parses a meter name into its components.
 *
 * @param meterName - Full meter name (e.g., 'iambic pentameter')
 * @returns Object with footType and lineLength, or null if invalid
 */
export function parseMeterName(meterName: string): { footType: FootType; lineLength: LineLengthName } | null {
  const lower = meterName.toLowerCase().trim();

  // Find foot type
  let footType: FootType = 'unknown';
  for (const [type, adjective] of Object.entries(FOOT_TYPE_ADJECTIVES)) {
    if (lower.includes(adjective)) {
      footType = type as FootType;
      break;
    }
  }

  // Find line length
  let lineLength: LineLengthName = 'tetrameter';
  for (const name of getAllLineLengthNames()) {
    if (lower.includes(name)) {
      lineLength = name;
      break;
    }
  }

  if (footType === 'unknown' && !lower.includes('irregular')) {
    return null;
  }

  return { footType, lineLength };
}
