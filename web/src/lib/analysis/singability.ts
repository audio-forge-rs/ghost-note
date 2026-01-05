/**
 * Singability Analysis Module
 *
 * This module handles Stage 7 of the poem analysis pipeline:
 * - Vowel openness scoring for sustained singing
 * - Consonant cluster penalty calculation
 * - Syllable sustainability scoring
 * - Problem spot identification with suggestions
 * - Overall line singability calculation
 *
 * Singability measures how easily text can be sung on sustained notes.
 * Open vowels (ah, oh) score high, while consonant clusters and closed vowels
 * create challenges for singers.
 *
 * @module lib/analysis/singability
 * @see docs/ANALYSIS_PIPELINE.md Stage 7
 * @see docs/PROBLEM_DEFINITION.md singability section
 */

import {
  isVowel,
  isConsonant,
  lookupWord,
  type PhonemeSequence,
} from '@/lib/phonetics';
import type {
  Syllable,
  AnalyzedLine,
  SingabilityScore,
  Severity,
  LineSoundPatterns,
} from '@/types/analysis';

// =============================================================================
// Types
// =============================================================================

/**
 * Issue type for problem spots affecting singability
 */
export type SingabilityIssue =
  | 'consonant_cluster'
  | 'closed_vowel'
  | 'awkward_transition';

/**
 * A problem spot that affects singability
 */
export interface ProblemSpot {
  /** Syllable index within the line */
  position: number;
  /** The word containing the problem */
  word: string;
  /** Type of singability issue */
  issue: SingabilityIssue;
  /** Severity of the problem */
  severity: Severity;
  /** Suggested alternative or fix */
  suggestion?: string;
}

// =============================================================================
// Logging
// =============================================================================

const DEBUG = process.env.NODE_ENV === 'development';
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[singability] ${message}`, ...args);
  }
};

// =============================================================================
// Vowel Openness Constants
// =============================================================================

/**
 * Vowel openness scores based on articulatory phonetics.
 *
 * Open vowels (produced with mouth wide open) are easier to sustain in singing.
 * Closed vowels (mouth more closed) are harder to hold on long notes.
 *
 * Scores:
 * - 1.0: Most open (easiest to sing)
 * - 0.3: Most closed (hardest to sing)
 *
 * @see docs/ANALYSIS_PIPELINE.md - Stage 7 vowel openness section
 */
export const VOWEL_OPENNESS: Record<string, number> = {
  // Open vowels (easiest to sustain)
  AA: 1.0, // "ah" as in odd, father - most open
  AO: 0.9, // "aw" as in bought, caught
  AE: 0.8, // "a" as in cat, bat
  OW: 0.8, // "oh" as in oat, go

  // Mid-open vowels
  AY: 0.7, // "eye" as in hide, my (diphthong starting open)
  EY: 0.7, // "ay" as in ate, say (diphthong)
  AW: 0.7, // "ow" as in cow, how (diphthong starting open)
  OY: 0.65, // "oy" as in toy, boy (diphthong)
  EH: 0.6, // "eh" as in bed, red

  // Mid vowels
  ER: 0.5, // "er" as in hurt, bird (r-colored)
  AH: 0.5, // schwa - varies by context

  // Closed vowels (harder to sustain)
  IY: 0.4, // "ee" as in eat, see
  UW: 0.4, // "oo" as in two, you
  IH: 0.3, // "ih" as in it, bit
  UH: 0.3, // "uh" as in hood, could
};

/**
 * Consonant clusters that are particularly difficult to sing.
 * These combinations create articulation challenges when sustaining notes.
 *
 * Categories:
 * - Triple+ clusters: Extremely difficult (e.g., "strengths" - NGTHS)
 * - Sibilant combinations: Harsh sound quality (e.g., STS, SKS)
 * - Stop combinations: Require release (e.g., KT, PT)
 */
export const DIFFICULT_CLUSTERS: string[][] = [
  // Triple and quad clusters - high difficulty
  ['S', 'T', 'R'], // "str" as in string
  ['S', 'K', 'R'], // "scr" as in scream
  ['S', 'P', 'R'], // "spr" as in spring
  ['S', 'P', 'L'], // "spl" as in splash
  ['N', 'G', 'TH', 'S'], // "ngths" as in strengths
  ['K', 'S', 'T', 'S'], // "xts" as in texts
  ['L', 'F', 'TH', 'S'], // "lfths" as in twelfths

  // Sibilant combinations - harsh when sung
  ['S', 'T', 'S'], // "-sts" as in lists
  ['S', 'K', 'S'], // "-sks" as in asks
  ['K', 'S'], // "-ks/-x" as in fix
  ['T', 'S'], // "-ts" as in cats

  // Stop consonant combinations - require release
  ['K', 'T'], // "-ct" as in act
  ['P', 'T'], // "-pt" as in kept
  ['B', 'D'], // "-bd" as in grabbed

  // Nasal + stop combinations
  ['N', 'K'], // "-nk" as in think
  ['N', 'G', 'K'], // "-nk" alternate
  ['M', 'P', 'T'], // "-mpt" as in prompt

  // Fricative combinations
  ['F', 'TH'], // "-fth" as in fifth
  ['TH', 'S'], // "-ths" as in moths
];

/**
 * Suggestions for improving difficult consonant clusters
 */
const CLUSTER_SUGGESTIONS: Record<string, string> = {
  'S-T-R': 'Consider "st-" or softer opening',
  'N-G-TH-S': 'Very difficult cluster; consider rephrasing',
  'K-S-T-S': 'Multiple sibilants; consider simpler word',
  'S-T-S': 'Sibilant cluster; consider "-st" ending word',
  'S-K-S': 'Harsh combination; consider rephrasing',
  'K-T': 'Consider word ending in single consonant',
  'P-T': 'Consider word ending in single consonant',
  'F-TH': 'Difficult fricative combo; consider simpler word',
};

/**
 * Suggestions for closed vowels that are hard to sustain
 */
const VOWEL_SUGGESTIONS: Record<string, string> = {
  IH: 'Short "i" is hard to sustain; consider open vowel',
  UH: 'Short "u" is hard to sustain; consider open vowel',
  IY: 'Long "ee" can be sustained but is brighter; consider "ah" or "oh"',
  UW: 'Long "oo" can be sustained; consider if warmth is needed',
};

// =============================================================================
// Core Scoring Functions
// =============================================================================

/**
 * Extracts the base vowel phoneme (without stress marker) from a phoneme string.
 *
 * @param phoneme - A vowel phoneme possibly with stress marker (e.g., "AA1", "IH0")
 * @returns Base vowel without stress marker (e.g., "AA", "IH")
 */
function getBaseVowel(phoneme: string): string {
  return phoneme.replace(/[012]$/, '');
}

/**
 * Scores the vowel openness of a syllable or set of phonemes.
 *
 * Higher scores indicate vowels that are easier to sustain in singing:
 * - 1.0 = Most open (AA "ah") - ideal for long notes
 * - 0.3 = Most closed (IH, UH) - challenging for sustained notes
 *
 * For multiple phonemes, uses the primary vowel's openness.
 *
 * @param phonemes - Array of ARPAbet phonemes
 * @returns Score from 0 to 1, where 1 is most singable
 *
 * @example
 * scoreVowelOpenness(['AA1']) // 1.0 - open "ah"
 * scoreVowelOpenness(['IH0']) // 0.3 - closed "ih"
 * scoreVowelOpenness(['HH', 'AA1', 'T']) // 1.0 - "hot"
 */
export function scoreVowelOpenness(phonemes: string[]): number {
  log('scoreVowelOpenness input:', phonemes);

  if (!phonemes || phonemes.length === 0) {
    return 0;
  }

  // Find vowel phonemes
  const vowels = phonemes.filter((p) => isVowel(p));

  if (vowels.length === 0) {
    log('scoreVowelOpenness: no vowels found');
    return 0;
  }

  // Use the first (primary) vowel for scoring
  // In multi-syllable inputs, this represents the main vowel
  const primaryVowel = vowels[0];
  const baseVowel = getBaseVowel(primaryVowel);

  const score = VOWEL_OPENNESS[baseVowel] ?? 0.5; // Default to mid-openness if unknown

  log('scoreVowelOpenness result:', { primaryVowel, baseVowel, score });
  return score;
}

/**
 * Calculates a penalty score for consonant clusters in phonemes.
 *
 * Consonant clusters (multiple consonants without intervening vowels)
 * create articulation challenges when singing, especially on sustained notes.
 *
 * Returns a penalty score (higher = worse singability):
 * - 0.0 = No clusters (single consonants only)
 * - 0.2 = Two consonants together
 * - 0.5 = Three consonants together
 * - 0.8 = Four or more consonants
 * - Additional penalty for difficult combinations
 *
 * @param phonemes - Array of ARPAbet phonemes
 * @returns Penalty from 0 to 1, where 0 is no penalty and 1 is severe
 *
 * @example
 * scoreConsonantClusters(['K', 'AE1', 'T']) // ~0 - "cat" - simple
 * scoreConsonantClusters(['S', 'T', 'R', 'IH1', 'NG']) // ~0.5 - "string" - cluster
 * scoreConsonantClusters(['S', 'T', 'R', 'EH1', 'NG', 'TH', 'S']) // ~0.8 - "strengths"
 */
export function scoreConsonantClusters(phonemes: string[]): number {
  log('scoreConsonantClusters input:', phonemes);

  if (!phonemes || phonemes.length === 0) {
    return 0;
  }

  // Find consonant clusters (runs of consonants)
  const clusters: string[][] = [];
  let currentCluster: string[] = [];

  for (const phoneme of phonemes) {
    if (isConsonant(phoneme)) {
      currentCluster.push(phoneme);
    } else {
      if (currentCluster.length > 1) {
        clusters.push([...currentCluster]);
      }
      currentCluster = [];
    }
  }

  // Check final cluster
  if (currentCluster.length > 1) {
    clusters.push(currentCluster);
  }

  if (clusters.length === 0) {
    log('scoreConsonantClusters: no clusters found');
    return 0;
  }

  log('scoreConsonantClusters clusters found:', clusters);

  // Calculate base penalty from cluster sizes
  let maxClusterSize = 0;
  for (const cluster of clusters) {
    maxClusterSize = Math.max(maxClusterSize, cluster.length);
  }

  // Base penalty by cluster size
  let penalty: number;
  if (maxClusterSize <= 1) {
    penalty = 0;
  } else if (maxClusterSize === 2) {
    penalty = 0.2;
  } else if (maxClusterSize === 3) {
    penalty = 0.5;
  } else {
    penalty = 0.8;
  }

  // Add penalty for difficult cluster combinations
  for (const cluster of clusters) {
    for (const difficultCluster of DIFFICULT_CLUSTERS) {
      if (isSubsequence(difficultCluster, cluster)) {
        // Add extra penalty for known difficult combinations
        penalty = Math.min(1.0, penalty + 0.1);
        log('scoreConsonantClusters: difficult cluster match:', difficultCluster);
      }
    }
  }

  log('scoreConsonantClusters result:', penalty);
  return Math.min(1.0, penalty); // Cap at 1.0
}

/**
 * Checks if a pattern is a subsequence of a target array.
 * Used to identify difficult consonant cluster patterns.
 */
function isSubsequence(pattern: string[], target: string[]): boolean {
  if (pattern.length > target.length) {
    return false;
  }

  let patternIdx = 0;
  for (const item of target) {
    if (item === pattern[patternIdx]) {
      patternIdx++;
      if (patternIdx === pattern.length) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Scores how well a syllable can be sustained on a long note.
 *
 * Sustainability combines vowel openness with structural factors:
 * - Open syllables (ending in vowel) sustain better
 * - Voiced codas (ending in L, M, N, R) can extend somewhat
 * - Stop consonant endings require quick release
 *
 * @param syllable - A Syllable object with phonemes and structure info
 * @returns Score from 0 to 1, where 1 is most sustainable
 *
 * @example
 * scoreSustainability({ phonemes: ['M', 'AA1'], isOpen: true, ... }) // ~0.95 - "ma"
 * scoreSustainability({ phonemes: ['K', 'AE1', 'T'], isOpen: false, ... }) // ~0.5 - "cat"
 */
export function scoreSustainability(syllable: Syllable): number {
  log('scoreSustainability input:', syllable);

  if (!syllable || !syllable.phonemes || syllable.phonemes.length === 0) {
    return 0;
  }

  // Get base vowel openness score
  const vowelScore = scoreVowelOpenness(syllable.phonemes);

  // Bonus for open syllables (ending in vowel)
  let structureBonus = 0;
  if (syllable.isOpen) {
    structureBonus = 0.15;
  } else {
    // Check if coda is sonorant (can be extended)
    const lastPhoneme = syllable.phonemes[syllable.phonemes.length - 1];
    const sonorantCodas = ['L', 'M', 'N', 'NG', 'R'];
    if (sonorantCodas.includes(lastPhoneme)) {
      structureBonus = 0.1;
    }
  }

  // Penalty for consonant clusters
  const clusterPenalty = scoreConsonantClusters(syllable.phonemes) * 0.3;

  const score = Math.min(1.0, Math.max(0, vowelScore + structureBonus - clusterPenalty));

  log('scoreSustainability result:', {
    vowelScore,
    structureBonus,
    clusterPenalty,
    finalScore: score,
  });

  return score;
}

// =============================================================================
// Problem Spot Detection
// =============================================================================

/**
 * Analyzes a word's phonemes and identifies singability problems.
 *
 * @param word - The word text
 * @param phonemes - The word's phonemes
 * @param startPosition - Syllable index within the line
 * @returns Array of ProblemSpot objects
 */
function analyzeWordProblems(
  word: string,
  phonemes: PhonemeSequence,
  startPosition: number
): ProblemSpot[] {
  const problems: ProblemSpot[] = [];

  // Check for consonant clusters
  const clusterPenalty = scoreConsonantClusters(phonemes);
  if (clusterPenalty >= 0.5) {
    // Find the specific cluster for suggestion
    const clusterKey = findDifficultCluster(phonemes);
    problems.push({
      position: startPosition,
      word,
      issue: 'consonant_cluster',
      severity: clusterPenalty >= 0.7 ? 'high' : 'medium',
      suggestion: clusterKey
        ? CLUSTER_SUGGESTIONS[clusterKey] || `Difficult consonant cluster in "${word}"`
        : `Consider simpler word instead of "${word}"`,
    });
  }

  // Check for closed vowels
  const vowelScore = scoreVowelOpenness(phonemes);
  if (vowelScore <= 0.35) {
    const vowels = phonemes.filter((p) => isVowel(p));
    const baseVowel = vowels.length > 0 ? getBaseVowel(vowels[0]) : '';
    problems.push({
      position: startPosition,
      word,
      issue: 'closed_vowel',
      severity: vowelScore <= 0.3 ? 'medium' : 'low',
      suggestion: VOWEL_SUGGESTIONS[baseVowel] || `Closed vowel in "${word}" may be hard to sustain`,
    });
  }

  return problems;
}

/**
 * Finds the matching difficult cluster pattern in phonemes.
 */
function findDifficultCluster(phonemes: PhonemeSequence): string | null {
  const consonants = phonemes.filter((p) => isConsonant(p));

  for (const pattern of DIFFICULT_CLUSTERS) {
    if (isSubsequence(pattern, consonants)) {
      return pattern.join('-');
    }
  }

  return null;
}

/**
 * Identifies problem spots in a line that may affect singability.
 *
 * Analyzes each word in the line to find:
 * - Consonant clusters that are hard to articulate
 * - Closed vowels that don't sustain well
 * - Awkward transitions between syllables
 *
 * Returns an array of problems with positions, descriptions, and suggestions.
 *
 * @param line - An AnalyzedLine with words broken into syllables
 * @returns Array of ProblemSpot objects with suggestions
 *
 * @example
 * identifyProblemSpots(analyzedLine)
 * // [{ position: 3, word: "strengths", issue: "consonant_cluster",
 * //    severity: "high", suggestion: "Very difficult cluster..." }]
 */
export function identifyProblemSpots(line: AnalyzedLine): ProblemSpot[] {
  if (!line || !line.words || line.words.length === 0) {
    log('identifyProblemSpots: empty or invalid line');
    return [];
  }

  log('identifyProblemSpots input:', line.text);

  const problems: ProblemSpot[] = [];
  let syllablePosition = 0;

  for (const word of line.words) {
    // Get phonemes for this word from CMU dictionary
    const phonemes = lookupWord(word.text) || [];

    // Analyze word-level problems
    const wordProblems = analyzeWordProblems(word.text, phonemes, syllablePosition);
    problems.push(...wordProblems);

    // Check for awkward transitions between syllables within the word
    if (word.syllables.length > 1) {
      for (let i = 0; i < word.syllables.length - 1; i++) {
        const currentSyl = word.syllables[i];
        const nextSyl = word.syllables[i + 1];

        // Awkward transition: current syllable ends in consonant, next starts with cluster
        if (!currentSyl.isOpen && nextSyl.phonemes.length > 0) {
          const nextConsonants = [];
          for (const p of nextSyl.phonemes) {
            if (isConsonant(p)) {
              nextConsonants.push(p);
            } else {
              break; // Stop at first vowel
            }
          }

          if (nextConsonants.length >= 2) {
            problems.push({
              position: syllablePosition + i,
              word: word.text,
              issue: 'awkward_transition',
              severity: 'low',
              suggestion: `Transition within "${word.text}" may be choppy`,
            });
          }
        }
      }
    }

    // Update position counter
    syllablePosition += word.syllables.length;
  }

  log('identifyProblemSpots result:', problems.length, 'problems found');
  return problems;
}

// =============================================================================
// Line-Level Analysis
// =============================================================================

/**
 * Calculates an overall singability score for a line.
 *
 * The score combines:
 * - Vowel openness across all syllables
 * - Consonant cluster penalties
 * - Syllable sustainability
 * - Problem spot severity
 *
 * Returns a score from 0 to 1 where:
 * - 1.0 = Highly singable (open vowels, simple consonants)
 * - 0.5 = Moderate singability (some challenges)
 * - 0.0 = Very difficult to sing (many issues)
 *
 * @param line - An AnalyzedLine with words broken into syllables
 * @returns Number from 0 to 1 representing overall singability
 *
 * @example
 * calculateLineSingability(analyzedLine)
 * // 0.75 for a moderately singable line
 */
export function calculateLineSingability(line: AnalyzedLine): number {
  log('calculateLineSingability input:', line.text);

  if (!line || !line.words || line.words.length === 0) {
    return 0;
  }

  // Calculate syllable-level scores
  const syllableScores: number[] = [];

  for (const word of line.words) {
    for (const syllable of word.syllables) {
      const score = scoreSustainability(syllable);
      syllableScores.push(score);
    }
  }

  if (syllableScores.length === 0) {
    return 0;
  }

  // Average syllable scores
  const avgSyllableScore =
    syllableScores.reduce((sum, s) => sum + s, 0) / syllableScores.length;

  // Identify problems and calculate penalty
  const problems = identifyProblemSpots(line);
  let problemPenalty = 0;

  for (const problem of problems) {
    switch (problem.severity) {
      case 'high':
        problemPenalty += 0.15;
        break;
      case 'medium':
        problemPenalty += 0.08;
        break;
      case 'low':
        problemPenalty += 0.03;
        break;
    }
  }

  // Cap penalty at 0.5 to avoid completely zeroing out scores
  problemPenalty = Math.min(0.5, problemPenalty);

  const finalScore = Math.max(0, avgSyllableScore - problemPenalty);

  log('calculateLineSingability result:', {
    avgSyllableScore,
    problemCount: problems.length,
    problemPenalty,
    finalScore,
  });

  return finalScore;
}

/**
 * Performs complete singability analysis on a line.
 *
 * This is the main entry point for singability analysis.
 * It returns a SingabilityScore object containing:
 * - Per-syllable scores
 * - Overall line score
 * - Identified problem spots
 *
 * @param line - An AnalyzedLine with words and syllables
 * @returns Complete SingabilityScore object
 *
 * @example
 * analyzeLineSingability(line)
 * // {
 * //   syllableScores: [0.8, 0.7, 0.9, 0.4, 0.8],
 * //   lineScore: 0.72,
 * //   problemSpots: [{ position: 3, issue: "closed_vowel", ... }]
 * // }
 */
export function analyzeLineSingability(line: AnalyzedLine): SingabilityScore {
  log('analyzeLineSingability input:', line.text);

  if (!line || !line.words || line.words.length === 0) {
    return {
      syllableScores: [],
      lineScore: 0,
      problemSpots: [],
    };
  }

  // Calculate per-syllable scores
  const syllableScores: number[] = [];

  for (const word of line.words) {
    for (const syllable of word.syllables) {
      const score = scoreSustainability(syllable);
      syllableScores.push(score);
    }
  }

  // Get problem spots
  const problems = identifyProblemSpots(line);

  // Convert ProblemSpots to SingabilityProblem format for type compatibility
  const problemSpots = problems.map((p) => ({
    position: p.position,
    issue: formatIssueDescription(p.issue, p.word, p.suggestion),
    severity: p.severity,
  }));

  // Calculate overall line score
  const lineScore = calculateLineSingability(line);

  const result: SingabilityScore = {
    syllableScores,
    lineScore,
    problemSpots,
  };

  log('analyzeLineSingability result:', result);
  return result;
}

/**
 * Formats a problem issue into a human-readable description.
 */
function formatIssueDescription(
  issue: SingabilityIssue,
  word: string,
  suggestion?: string
): string {
  const issueLabels: Record<SingabilityIssue, string> = {
    consonant_cluster: 'Consonant cluster',
    closed_vowel: 'Closed vowel',
    awkward_transition: 'Awkward transition',
  };

  const label = issueLabels[issue] || 'Issue';
  let description = `${label} in "${word}"`;

  if (suggestion) {
    description += `: ${suggestion}`;
  }

  return description;
}

// =============================================================================
// Word-Level Utilities
// =============================================================================

/**
 * Scores the singability of a single word.
 *
 * Useful for quick word-level analysis without full line context.
 *
 * @param word - The word to analyze
 * @returns Score from 0 to 1, or null if word not found in dictionary
 *
 * @example
 * scoreWordSingability('love')  // ~0.8 (open vowel "AH")
 * scoreWordSingability('strengths') // ~0.3 (many consonant clusters)
 */
export function scoreWordSingability(word: string): number | null {
  log('scoreWordSingability input:', word);

  if (!word || word.trim() === '') {
    return null;
  }

  const phonemes = lookupWord(word);
  if (!phonemes) {
    log('scoreWordSingability: word not in dictionary');
    return null;
  }

  // Get vowel openness
  const vowelScore = scoreVowelOpenness(phonemes);

  // Get consonant cluster penalty
  const clusterPenalty = scoreConsonantClusters(phonemes);

  // Combine scores
  const finalScore = Math.max(0, vowelScore - clusterPenalty * 0.5);

  log('scoreWordSingability result:', { vowelScore, clusterPenalty, finalScore });
  return finalScore;
}

/**
 * Gets the primary vowel phoneme from a word for analysis.
 *
 * @param word - The word to analyze
 * @returns The primary vowel phoneme (with stress marker), or null
 */
export function getPrimaryVowel(word: string): string | null {
  const phonemes = lookupWord(word);
  if (!phonemes) {
    return null;
  }

  // Find first vowel with primary stress (1)
  for (const p of phonemes) {
    if (isVowel(p) && p.endsWith('1')) {
      return p;
    }
  }

  // Fallback to any vowel
  for (const p of phonemes) {
    if (isVowel(p)) {
      return p;
    }
  }

  return null;
}

/**
 * Checks if a word contains difficult consonant clusters.
 *
 * @param word - The word to check
 * @returns True if the word has significant consonant clusters
 */
export function hasDifficultClusters(word: string): boolean {
  const phonemes = lookupWord(word);
  if (!phonemes) {
    return false;
  }

  const penalty = scoreConsonantClusters(phonemes);
  return penalty >= 0.4;
}

// =============================================================================
// Batch Analysis Utilities
// =============================================================================

/**
 * Analyzes singability for multiple lines.
 *
 * @param lines - Array of AnalyzedLine objects
 * @returns Array of SingabilityScore objects
 */
export function analyzeMultipleLines(lines: AnalyzedLine[]): SingabilityScore[] {
  return lines.map((line) => analyzeLineSingability(line));
}

/**
 * Calculates the average singability score across multiple lines.
 *
 * @param scores - Array of SingabilityScore objects
 * @returns Average line score
 */
export function calculateAverageSingability(scores: SingabilityScore[]): number {
  if (scores.length === 0) {
    return 0;
  }

  const totalScore = scores.reduce((sum, s) => sum + s.lineScore, 0);
  return totalScore / scores.length;
}

/**
 * Collects all problem spots across multiple lines.
 *
 * @param scores - Array of SingabilityScore objects
 * @param minSeverity - Minimum severity to include ('low', 'medium', 'high')
 * @returns Array of all problem spots meeting severity threshold
 */
export function collectProblemSpots(
  scores: SingabilityScore[],
  minSeverity: Severity = 'low'
): Array<{ lineIndex: number; problem: SingabilityScore['problemSpots'][0] }> {
  const severityOrder: Record<Severity, number> = {
    low: 0,
    medium: 1,
    high: 2,
  };

  const minLevel = severityOrder[minSeverity];
  const allProblems: Array<{ lineIndex: number; problem: SingabilityScore['problemSpots'][0] }> = [];

  scores.forEach((score, lineIndex) => {
    for (const problem of score.problemSpots) {
      if (severityOrder[problem.severity] >= minLevel) {
        allProblems.push({ lineIndex, problem });
      }
    }
  });

  return allProblems;
}

// =============================================================================
// Sound Pattern Integration
// =============================================================================

/**
 * Adjusts a singability score based on sound patterns in the line.
 *
 * Well-placed alliteration and assonance can enhance singability by:
 * - Creating natural flow and rhythm
 * - Making lyrics more memorable
 * - Providing smooth transitions between words
 *
 * However, excessive or awkward patterns can hinder singability.
 *
 * @param score - The original SingabilityScore
 * @param patterns - Sound patterns found in the line
 * @returns Adjusted SingabilityScore with sound pattern impact applied
 */
export function adjustSingabilityForSoundPatterns(
  score: SingabilityScore,
  patterns: LineSoundPatterns
): SingabilityScore {
  log('adjustSingabilityForSoundPatterns input:', {
    originalScore: score.lineScore,
    alliterations: patterns.alliterations.length,
    assonances: patterns.assonances.length,
    consonances: patterns.consonances.length,
  });

  let impact = 0;

  // Moderate alliteration is positive (helps memory and flow)
  const alliterationCount = patterns.alliterations.length;
  if (alliterationCount === 1 || alliterationCount === 2) {
    impact += 0.05 * alliterationCount;
  } else if (alliterationCount > 3) {
    // Excessive alliteration can feel forced
    impact -= 0.02 * (alliterationCount - 3);
  }

  // Assonance is generally positive for singability (vowel harmony)
  const assonanceCount = patterns.assonances.length;
  if (assonanceCount >= 1 && assonanceCount <= 3) {
    impact += 0.04 * assonanceCount;
  }

  // Strong patterns (high strength) contribute more
  for (const pattern of patterns.alliterations) {
    if (pattern.strength > 0.7) {
      impact += 0.02;
    }
  }

  for (const pattern of patterns.assonances) {
    if (pattern.strength > 0.7) {
      impact += 0.03;
    }
  }

  // Consonance impact is more subtle
  const consonanceCount = patterns.consonances.length;
  if (consonanceCount >= 1 && consonanceCount <= 2) {
    impact += 0.02;
  }

  // Cap the impact
  impact = Math.max(-0.2, Math.min(0.2, impact));

  // Apply impact to line score
  const adjustedLineScore = Math.max(0, Math.min(1, score.lineScore + impact));

  log('adjustSingabilityForSoundPatterns result:', {
    impact,
    adjustedLineScore,
  });

  return {
    ...score,
    lineScore: adjustedLineScore,
  };
}
