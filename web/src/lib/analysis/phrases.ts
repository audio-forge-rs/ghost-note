/**
 * Phrase Boundary Detection Module
 *
 * This module detects natural phrase boundaries for melody phrasing.
 * Phrase boundaries indicate where a singer would naturally pause or breathe,
 * which is essential for creating singable melodies.
 *
 * Detection is based on:
 * - Punctuation (comma, period, semicolon, etc.)
 * - Conjunctions (and, but, or, etc.)
 * - Line breaks
 * - Semantic units (clauses, prepositional phrases)
 * - Line length considerations (long lines may need internal breaks)
 *
 * @module lib/analysis/phrases
 * @see docs/ANALYSIS_PIPELINE.md
 */

import {
  extractPunctuation,
  tokenizeWords,
  type PunctuationMark,
} from './preprocess';
import type {
  PreprocessedPoem,
} from '@/types/analysis';

// =============================================================================
// Types
// =============================================================================

/**
 * Types of phrase boundaries detected
 */
export type PhraseBoundaryType =
  | 'punctuation'      // Comma, period, semicolon, etc.
  | 'conjunction'      // And, but, or, etc.
  | 'line_break'       // End of a line
  | 'semantic'         // Natural semantic break (preposition, clause boundary)
  | 'length_split';    // Forced split for overly long phrases

/**
 * Strength of a phrase boundary (affects breath point priority)
 */
export type BoundaryStrength = 'weak' | 'medium' | 'strong';

/**
 * A detected phrase boundary within a line
 */
export interface PhraseBoundary {
  /** Word index where the phrase ends (0-based, inclusive) */
  position: number;
  /** Character position in the original line */
  charPosition: number;
  /** Type of boundary detected */
  type: PhraseBoundaryType;
  /** How strong this boundary is (affects breath priority) */
  strength: BoundaryStrength;
  /** The word or punctuation that triggered this boundary */
  trigger: string;
  /** Breathability score 0-1 (higher = more natural to breathe here) */
  breathability: number;
}

/**
 * A phrase is a segment of text between boundaries
 */
export interface Phrase {
  /** The text content of this phrase */
  text: string;
  /** Words in this phrase */
  words: string[];
  /** Start word index in the line (0-based) */
  startWordIndex: number;
  /** End word index in the line (0-based, inclusive) */
  endWordIndex: number;
  /** Syllable count estimate for this phrase */
  syllableCount: number;
  /** Whether this phrase ends at a line break */
  endsAtLineBreak: boolean;
}

/**
 * Analysis result for a single line
 */
export interface LinePhrasingAnalysis {
  /** Original line text */
  text: string;
  /** Detected phrase boundaries within this line */
  boundaries: PhraseBoundary[];
  /** Phrases extracted from this line */
  phrases: Phrase[];
  /** Line index in the poem (0-based) */
  lineIndex: number;
  /** Whether this line should combine with the next (enjambment) */
  combineWithNext: boolean;
}

/**
 * Complete phrasing analysis for a poem
 */
export interface PoemPhrasingAnalysis {
  /** Per-line phrasing analysis */
  lines: LinePhrasingAnalysis[];
  /** Indices of lines where major phrase breaks occur */
  majorBreakLines: number[];
  /** Average phrase length in syllables */
  averagePhraseLength: number;
  /** Suggested breath points (line index, word index) */
  breathPoints: Array<{ lineIndex: number; wordIndex: number; strength: BoundaryStrength }>;
}

// =============================================================================
// Logging
// =============================================================================

const DEBUG = process.env.NODE_ENV === 'development';
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[phrases] ${message}`, ...args);
  }
};

// =============================================================================
// Constants
// =============================================================================

/**
 * Punctuation that creates phrase boundaries, with their strengths
 */
const BOUNDARY_PUNCTUATION: Record<string, BoundaryStrength> = {
  '.': 'strong',
  '!': 'strong',
  '?': 'strong',
  ';': 'strong',
  ':': 'medium',
  ',': 'weak',
  '—': 'medium',  // em dash
  '–': 'medium',  // en dash
  '-': 'weak',    // hyphen (when used as separator)
  '...': 'strong', // ellipsis
  '…': 'strong',  // ellipsis character
};

/**
 * Conjunctions that often mark phrase boundaries
 */
const COORDINATING_CONJUNCTIONS = new Set([
  'and', 'but', 'or', 'nor', 'for', 'yet', 'so',
]);

/**
 * Subordinating conjunctions that may start new clauses
 */
const SUBORDINATING_CONJUNCTIONS = new Set([
  'although', 'because', 'before', 'after', 'while', 'when',
  'where', 'if', 'unless', 'until', 'though', 'since', 'as',
  'whereas', 'whenever', 'wherever', 'whether', 'once',
]);

/**
 * Words that often start prepositional phrases (semantic breaks)
 */
const PREPOSITIONS = new Set([
  'in', 'on', 'at', 'by', 'to', 'for', 'with', 'from',
  'of', 'into', 'onto', 'upon', 'within', 'without',
  'through', 'throughout', 'across', 'along', 'among',
  'between', 'beside', 'besides', 'before', 'after',
  'above', 'below', 'beneath', 'under', 'over',
  'during', 'toward', 'towards', 'against', 'about',
]);

/**
 * Relative pronouns that start relative clauses
 */
const RELATIVE_PRONOUNS = new Set([
  'who', 'whom', 'whose', 'which', 'that', 'where', 'when',
]);

/**
 * Target phrase length in syllables (optimal for singing)
 * Phrases longer than this may be split
 */
const TARGET_PHRASE_SYLLABLES = 8;

/**
 * Maximum phrase length before forced splitting
 */
const MAX_PHRASE_SYLLABLES = 12;

/**
 * Minimum phrase length (to avoid over-fragmentation)
 */
const MIN_PHRASE_SYLLABLES = 3;

// =============================================================================
// Syllable Estimation
// =============================================================================

/**
 * Estimates syllable count for a word using simple heuristics.
 * This is a fallback when CMU dictionary lookup is not available.
 *
 * @param word - The word to estimate syllables for
 * @returns Estimated syllable count
 */
export function estimateSyllables(word: string): number {
  if (!word || word.length === 0) {
    return 0;
  }

  const lowerWord = word.toLowerCase().replace(/[^a-z]/g, '');

  if (lowerWord.length === 0) {
    return 0;
  }

  // Count vowel groups (basic syllable estimation)
  const vowelGroups = lowerWord.match(/[aeiouy]+/g);
  let count = vowelGroups ? vowelGroups.length : 1;

  // Adjust for silent 'e' at end
  if (lowerWord.endsWith('e') && lowerWord.length > 2) {
    const beforeE = lowerWord.slice(-2, -1);
    // Silent e after consonant (except for -le, -re)
    if (!/[aeiouy]/.test(beforeE) && !lowerWord.match(/[lr]e$/)) {
      count = Math.max(1, count - 1);
    }
  }

  // Adjust for common suffixes
  if (lowerWord.endsWith('tion') || lowerWord.endsWith('sion')) {
    // -tion/-sion is typically one syllable, not two
    count = Math.max(1, count);
  }

  // Ensure minimum of 1 syllable
  return Math.max(1, count);
}

/**
 * Estimates total syllables in an array of words
 */
function estimateTotalSyllables(words: string[]): number {
  return words.reduce((sum, word) => sum + estimateSyllables(word), 0);
}

// =============================================================================
// Punctuation Boundary Detection
// =============================================================================

/**
 * Detects phrase boundaries based on punctuation.
 *
 * @param line - The line text to analyze
 * @param words - Tokenized words from the line
 * @param punctuation - Extracted punctuation marks
 * @returns Array of detected boundaries
 */
function detectPunctuationBoundaries(
  line: string,
  words: string[],
  punctuation: PunctuationMark[]
): PhraseBoundary[] {
  log('detectPunctuationBoundaries:', { line, wordCount: words.length });

  const boundaries: PhraseBoundary[] = [];

  for (const punct of punctuation) {
    const strength = BOUNDARY_PUNCTUATION[punct.char];
    if (!strength) {
      continue; // Skip punctuation that doesn't create boundaries
    }

    // Find which word this punctuation follows
    let wordIndex = -1;
    let charsSeen = 0;

    for (let i = 0; i < words.length; i++) {
      const wordStart = line.indexOf(words[i], charsSeen);
      const wordEnd = wordStart + words[i].length;
      charsSeen = wordEnd;

      // Punctuation immediately after this word
      if (punct.position >= wordStart && punct.position <= wordEnd + 1) {
        wordIndex = i;
        break;
      }
    }

    if (wordIndex >= 0 && wordIndex < words.length) {
      // Calculate breathability based on strength
      const breathability = strength === 'strong' ? 1.0
        : strength === 'medium' ? 0.7
        : 0.4;

      boundaries.push({
        position: wordIndex,
        charPosition: punct.position,
        type: 'punctuation',
        strength,
        trigger: punct.char,
        breathability,
      });
    }
  }

  log('detectPunctuationBoundaries result:', boundaries.length, 'boundaries');
  return boundaries;
}

// =============================================================================
// Conjunction Boundary Detection
// =============================================================================

/**
 * Detects phrase boundaries based on conjunctions.
 * Conjunctions often mark the start of a new clause.
 *
 * @param words - Tokenized words from the line
 * @param line - Original line text for position calculation
 * @returns Array of detected boundaries
 */
function detectConjunctionBoundaries(
  words: string[],
  line: string
): PhraseBoundary[] {
  log('detectConjunctionBoundaries:', words);

  const boundaries: PhraseBoundary[] = [];
  let charPos = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase();
    const wordStart = line.toLowerCase().indexOf(word, charPos);
    charPos = wordStart + words[i].length;

    // Coordinating conjunctions create boundaries BEFORE them
    // (phrase ends at the word before the conjunction)
    if (COORDINATING_CONJUNCTIONS.has(word) && i > 0) {
      boundaries.push({
        position: i - 1,
        charPosition: wordStart - 1,
        type: 'conjunction',
        strength: 'medium',
        trigger: words[i],
        breathability: 0.6,
      });
    }

    // Subordinating conjunctions create boundaries BEFORE them
    if (SUBORDINATING_CONJUNCTIONS.has(word) && i > 0) {
      boundaries.push({
        position: i - 1,
        charPosition: wordStart - 1,
        type: 'conjunction',
        strength: 'medium',
        trigger: words[i],
        breathability: 0.65,
      });
    }
  }

  log('detectConjunctionBoundaries result:', boundaries.length, 'boundaries');
  return boundaries;
}

// =============================================================================
// Semantic Boundary Detection
// =============================================================================

/**
 * Detects semantic phrase boundaries based on grammatical structures.
 * These are weaker than punctuation but help identify natural pause points.
 *
 * @param words - Tokenized words from the line
 * @param line - Original line text for position calculation
 * @returns Array of detected boundaries
 */
function detectSemanticBoundaries(
  words: string[],
  line: string
): PhraseBoundary[] {
  log('detectSemanticBoundaries:', words);

  const boundaries: PhraseBoundary[] = [];
  let charPos = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase();
    const wordStart = line.toLowerCase().indexOf(word, charPos);
    charPos = wordStart + words[i].length;

    // Prepositions often start new semantic units (boundary BEFORE them)
    if (PREPOSITIONS.has(word) && i > 1) {
      // Only add if we have enough words before
      // Avoid creating tiny initial phrases
      const syllablesBefore = estimateTotalSyllables(words.slice(0, i));
      if (syllablesBefore >= MIN_PHRASE_SYLLABLES) {
        boundaries.push({
          position: i - 1,
          charPosition: wordStart - 1,
          type: 'semantic',
          strength: 'weak',
          trigger: words[i],
          breathability: 0.35,
        });
      }
    }

    // Relative pronouns start relative clauses (boundary BEFORE them)
    if (RELATIVE_PRONOUNS.has(word) && i > 0) {
      boundaries.push({
        position: i - 1,
        charPosition: wordStart - 1,
        type: 'semantic',
        strength: 'weak',
        trigger: words[i],
        breathability: 0.4,
      });
    }
  }

  log('detectSemanticBoundaries result:', boundaries.length, 'boundaries');
  return boundaries;
}

// =============================================================================
// Length-Based Splitting
// =============================================================================

/**
 * Adds boundaries to split overly long phrases.
 * When a phrase exceeds MAX_PHRASE_SYLLABLES, we find natural split points.
 *
 * @param words - All words in the line
 * @param existingBoundaries - Already detected boundaries
 * @param line - Original line text
 * @returns Additional boundaries for length splitting
 */
function detectLengthSplitBoundaries(
  words: string[],
  existingBoundaries: PhraseBoundary[],
  line: string
): PhraseBoundary[] {
  log('detectLengthSplitBoundaries:', { wordCount: words.length });

  const additionalBoundaries: PhraseBoundary[] = [];

  // Get existing boundary positions
  const boundaryPositions = new Set(existingBoundaries.map(b => b.position));

  // Find segments between boundaries
  const sortedPositions = [-1, ...Array.from(boundaryPositions).sort((a, b) => a - b), words.length - 1];

  for (let i = 0; i < sortedPositions.length - 1; i++) {
    const segmentStart = sortedPositions[i] + 1;
    const segmentEnd = sortedPositions[i + 1];
    const segmentWords = words.slice(segmentStart, segmentEnd + 1);
    const segmentSyllables = estimateTotalSyllables(segmentWords);

    // If segment is too long, find split points
    if (segmentSyllables > MAX_PHRASE_SYLLABLES) {
      let syllablesSoFar = 0;
      let charPos = 0;

      // Find position of segment start in original line
      for (let j = 0; j < segmentStart; j++) {
        charPos = line.indexOf(words[j], charPos) + words[j].length;
      }

      for (let j = segmentStart; j < segmentEnd; j++) {
        const wordSyllables = estimateSyllables(words[j]);
        syllablesSoFar += wordSyllables;

        const wordStart = line.indexOf(words[j], charPos);
        charPos = wordStart + words[j].length;

        // Split when we've accumulated enough syllables
        if (syllablesSoFar >= TARGET_PHRASE_SYLLABLES &&
            !boundaryPositions.has(j) &&
            (segmentEnd - j) >= 2) { // Leave at least 2 words after

          // Split at current position
          const splitPos = j;

          additionalBoundaries.push({
            position: splitPos,
            charPosition: charPos,
            type: 'length_split',
            strength: 'weak',
            trigger: `[length>${TARGET_PHRASE_SYLLABLES}]`,
            breathability: 0.3,
          });

          boundaryPositions.add(splitPos);
          syllablesSoFar = 0;
        }
      }
    }
  }

  log('detectLengthSplitBoundaries result:', additionalBoundaries.length, 'additional');
  return additionalBoundaries;
}

// =============================================================================
// Enjambment Detection
// =============================================================================

/**
 * Detects if a line ends with enjambment (sentence continues to next line).
 * This affects whether lines should be combined for phrasing.
 *
 * @param line - The line text
 * @param nextLine - The following line text (if any)
 * @returns True if this line should combine with the next
 */
export function detectEnjambment(line: string, nextLine?: string): boolean {
  if (!line || !nextLine) {
    return false;
  }

  const trimmedLine = line.trim();
  const trimmedNext = nextLine.trim();

  // No enjambment if line ends with terminal punctuation
  if (/[.!?;:]$/.test(trimmedLine)) {
    return false;
  }

  // Check if next line starts with lowercase (indicating continuation)
  if (trimmedNext && /^[a-z]/.test(trimmedNext)) {
    return true;
  }

  // Check if line ends with a preposition or conjunction (strong enjambment)
  const words = tokenizeWords(line);
  if (words.length > 0) {
    const lastWord = words[words.length - 1].toLowerCase();
    if (PREPOSITIONS.has(lastWord) || COORDINATING_CONJUNCTIONS.has(lastWord)) {
      return true;
    }
  }

  // Check if line ends with articles or determiners
  const articles = new Set(['a', 'an', 'the', 'my', 'your', 'his', 'her', 'its', 'our', 'their']);
  const words2 = tokenizeWords(line);
  if (words2.length > 0) {
    const lastWord = words2[words2.length - 1].toLowerCase();
    if (articles.has(lastWord)) {
      return true;
    }
  }

  return false;
}

// =============================================================================
// Line Analysis
// =============================================================================

/**
 * Analyzes a single line for phrase boundaries.
 *
 * @param line - The line text to analyze
 * @param lineIndex - Index of this line in the poem
 * @param nextLine - The following line (for enjambment detection)
 * @returns Complete phrasing analysis for the line
 */
export function analyzeLinePhrases(
  line: string,
  lineIndex: number,
  nextLine?: string
): LinePhrasingAnalysis {
  log('analyzeLinePhrases:', { line, lineIndex });

  if (!line || line.trim() === '') {
    return {
      text: line || '',
      boundaries: [],
      phrases: [],
      lineIndex,
      combineWithNext: false,
    };
  }

  const words = tokenizeWords(line);
  const punctuation = extractPunctuation(line);

  if (words.length === 0) {
    return {
      text: line,
      boundaries: [],
      phrases: [],
      lineIndex,
      combineWithNext: false,
    };
  }

  // Detect all types of boundaries
  const punctBoundaries = detectPunctuationBoundaries(line, words, punctuation);
  const conjBoundaries = detectConjunctionBoundaries(words, line);
  const semanticBoundaries = detectSemanticBoundaries(words, line);

  // Combine boundaries
  let allBoundaries = [...punctBoundaries, ...conjBoundaries, ...semanticBoundaries];

  // Remove duplicates (keep highest strength at each position)
  const boundaryMap = new Map<number, PhraseBoundary>();
  for (const boundary of allBoundaries) {
    const existing = boundaryMap.get(boundary.position);
    if (!existing || compareBoundaryStrength(boundary.strength, existing.strength) > 0) {
      boundaryMap.set(boundary.position, boundary);
    }
  }
  allBoundaries = Array.from(boundaryMap.values());

  // Add length-based splits if needed
  const lengthSplits = detectLengthSplitBoundaries(words, allBoundaries, line);
  allBoundaries.push(...lengthSplits);

  // Sort by position
  allBoundaries.sort((a, b) => a.position - b.position);

  // Add implicit line-end boundary if not already present
  const lastWordIndex = words.length - 1;
  const hasEndBoundary = allBoundaries.some(b => b.position === lastWordIndex);
  if (!hasEndBoundary) {
    const charPos = line.length;
    allBoundaries.push({
      position: lastWordIndex,
      charPosition: charPos,
      type: 'line_break',
      strength: 'strong',
      trigger: '[line end]',
      breathability: 0.9,
    });
  }

  // Extract phrases from boundaries
  const phrases = extractPhrases(words, allBoundaries);

  // Detect enjambment
  const combineWithNext = detectEnjambment(line, nextLine);

  const result: LinePhrasingAnalysis = {
    text: line,
    boundaries: allBoundaries,
    phrases,
    lineIndex,
    combineWithNext,
  };

  log('analyzeLinePhrases result:', {
    boundaryCount: result.boundaries.length,
    phraseCount: result.phrases.length,
    combineWithNext: result.combineWithNext,
  });

  return result;
}

/**
 * Compares boundary strengths. Returns positive if a > b, negative if a < b.
 */
function compareBoundaryStrength(a: BoundaryStrength, b: BoundaryStrength): number {
  const order: Record<BoundaryStrength, number> = { weak: 0, medium: 1, strong: 2 };
  return order[a] - order[b];
}

/**
 * Extracts phrase objects from boundaries
 */
function extractPhrases(
  words: string[],
  boundaries: PhraseBoundary[]
): Phrase[] {
  const phrases: Phrase[] = [];
  let startIndex = 0;

  for (const boundary of boundaries) {
    const endIndex = boundary.position;
    if (endIndex >= startIndex) {
      const phraseWords = words.slice(startIndex, endIndex + 1);
      const phraseText = phraseWords.join(' ');

      phrases.push({
        text: phraseText,
        words: phraseWords,
        startWordIndex: startIndex,
        endWordIndex: endIndex,
        syllableCount: estimateTotalSyllables(phraseWords),
        endsAtLineBreak: boundary.type === 'line_break',
      });

      startIndex = endIndex + 1;
    }
  }

  return phrases;
}

// =============================================================================
// Poem Analysis
// =============================================================================

/**
 * Analyzes an entire poem for phrase boundaries.
 *
 * @param poem - Preprocessed poem data
 * @returns Complete phrasing analysis for the poem
 */
export function analyzePoemPhrases(poem: PreprocessedPoem): PoemPhrasingAnalysis {
  log('analyzePoemPhrases:', { lineCount: poem.lineCount, stanzaCount: poem.stanzaCount });

  const allLines: string[] = [];
  for (const stanza of poem.stanzas) {
    allLines.push(...stanza);
  }

  const lineAnalyses: LinePhrasingAnalysis[] = [];

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];
    const nextLine = i < allLines.length - 1 ? allLines[i + 1] : undefined;
    const analysis = analyzeLinePhrases(line, i, nextLine);
    lineAnalyses.push(analysis);
  }

  // Find major break lines (lines that end with strong boundaries and no enjambment)
  const majorBreakLines: number[] = [];
  for (const analysis of lineAnalyses) {
    if (!analysis.combineWithNext) {
      const hasStrongEnd = analysis.boundaries.some(
        b => b.position === analysis.phrases[analysis.phrases.length - 1]?.endWordIndex &&
             b.strength === 'strong'
      );
      if (hasStrongEnd || analysis.phrases.length > 0) {
        majorBreakLines.push(analysis.lineIndex);
      }
    }
  }

  // Calculate average phrase length
  let totalPhrases = 0;
  let totalSyllables = 0;
  for (const analysis of lineAnalyses) {
    for (const phrase of analysis.phrases) {
      totalPhrases++;
      totalSyllables += phrase.syllableCount;
    }
  }
  const averagePhraseLength = totalPhrases > 0 ? totalSyllables / totalPhrases : 0;

  // Collect breath points
  const breathPoints: PoemPhrasingAnalysis['breathPoints'] = [];
  for (const analysis of lineAnalyses) {
    for (const boundary of analysis.boundaries) {
      // Include boundaries with sufficient breathability
      if (boundary.breathability >= 0.3) {
        breathPoints.push({
          lineIndex: analysis.lineIndex,
          wordIndex: boundary.position,
          strength: boundary.strength,
        });
      }
    }
  }

  const result: PoemPhrasingAnalysis = {
    lines: lineAnalyses,
    majorBreakLines,
    averagePhraseLength,
    breathPoints,
  };

  log('analyzePoemPhrases result:', {
    lineCount: result.lines.length,
    majorBreaks: result.majorBreakLines.length,
    avgPhraseLength: result.averagePhraseLength.toFixed(2),
    breathPoints: result.breathPoints.length,
  });

  return result;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Gets the best breath points for a line, sorted by priority.
 *
 * @param analysis - Line phrasing analysis
 * @param maxPoints - Maximum number of breath points to return
 * @returns Sorted array of breath points (highest priority first)
 */
export function getBestBreathPoints(
  analysis: LinePhrasingAnalysis,
  maxPoints: number = 3
): PhraseBoundary[] {
  // Sort by breathability (descending)
  const sorted = [...analysis.boundaries].sort(
    (a, b) => b.breathability - a.breathability
  );

  return sorted.slice(0, maxPoints);
}

/**
 * Combines consecutive short phrases if they're below minimum length.
 *
 * @param phrases - Array of phrases to potentially combine
 * @returns Optimized array of phrases
 */
export function combineShortPhrases(phrases: Phrase[]): Phrase[] {
  if (phrases.length <= 1) {
    return phrases;
  }

  const combined: Phrase[] = [];
  let pending: Phrase | null = null;

  for (const phrase of phrases) {
    if (pending) {
      if (pending.syllableCount + phrase.syllableCount <= TARGET_PHRASE_SYLLABLES) {
        // Combine with pending
        pending = {
          text: pending.text + ' ' + phrase.text,
          words: [...pending.words, ...phrase.words],
          startWordIndex: pending.startWordIndex,
          endWordIndex: phrase.endWordIndex,
          syllableCount: pending.syllableCount + phrase.syllableCount,
          endsAtLineBreak: phrase.endsAtLineBreak,
        };
      } else {
        // Push pending and start new
        combined.push(pending);
        pending = phrase;
      }
    } else {
      if (phrase.syllableCount < MIN_PHRASE_SYLLABLES && !phrase.endsAtLineBreak) {
        pending = phrase;
      } else {
        combined.push(phrase);
      }
    }
  }

  if (pending) {
    combined.push(pending);
  }

  return combined;
}

/**
 * Checks if a position is a natural phrase boundary.
 *
 * @param text - The text to check
 * @param wordIndex - Word index to check
 * @returns True if this is a natural boundary
 */
export function isNaturalBoundary(text: string, wordIndex: number): boolean {
  const words = tokenizeWords(text);
  if (wordIndex < 0 || wordIndex >= words.length) {
    return false;
  }

  const analysis = analyzeLinePhrases(text, 0);
  return analysis.boundaries.some(b => b.position === wordIndex);
}

/**
 * Gets phrase boundaries suitable for melody phrasing.
 * Returns word indices where phrases end.
 *
 * @param text - The text to analyze
 * @returns Array of word indices where phrases end
 */
export function getPhraseBoundaryPositions(text: string): number[] {
  const analysis = analyzeLinePhrases(text, 0);
  return analysis.boundaries.map(b => b.position);
}

/**
 * Calculates breathability score at a specific word position.
 *
 * @param analysis - Line phrasing analysis
 * @param wordIndex - Word index to check
 * @returns Breathability score 0-1, or 0 if not a boundary
 */
export function getBreathabilityAtPosition(
  analysis: LinePhrasingAnalysis,
  wordIndex: number
): number {
  const boundary = analysis.boundaries.find(b => b.position === wordIndex);
  return boundary?.breathability ?? 0;
}

/**
 * Suggests phrase breaks for melody generation.
 * Returns line indices where major musical phrases should end.
 *
 * @param poemAnalysis - Complete poem phrasing analysis
 * @returns Array of line indices for phrase breaks
 */
export function suggestMelodyPhraseBreaks(
  poemAnalysis: PoemPhrasingAnalysis
): number[] {
  // Major break lines are already the best candidates
  // Filter to ensure we don't have too many consecutive breaks
  const breaks: number[] = [];
  let lastBreak = -3; // Allow first break at line 0

  for (const lineIndex of poemAnalysis.majorBreakLines) {
    // Ensure at least 2 lines between major breaks
    if (lineIndex - lastBreak >= 2) {
      breaks.push(lineIndex);
      lastBreak = lineIndex;
    }
  }

  return breaks;
}
