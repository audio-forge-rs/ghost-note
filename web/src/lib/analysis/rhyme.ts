/**
 * Rhyme Detection Module
 *
 * This module handles Stage 6 of the poem analysis pipeline:
 * - Extract rhyming parts from phonemes
 * - Classify rhyme types (perfect, slant, assonance, consonance)
 * - Detect rhyme schemes (ABAB, AABB, etc.)
 * - Find internal rhymes within lines
 * - Calculate phonetic similarity between words
 *
 * @module lib/analysis/rhyme
 */

import {
  lookupWord,
  isVowel,
  isConsonant,
  getPhonemeStress,
  type PhonemeSequence,
} from '@/lib/phonetics';
import type {
  RhymeType,
  RhymeAnalysis,
  RhymeGroup,
  InternalRhyme,
} from '@/types/analysis';

// =============================================================================
// Extended Types (adding 'none' to existing RhymeType)
// =============================================================================

/**
 * Extended rhyme type that includes 'none' for non-rhyming words
 */
export type ExtendedRhymeType = RhymeType | 'none';

/**
 * Extended rhyme group that uses ExtendedRhymeType
 */
export interface ExtendedRhymeGroup {
  /** Label for this rhyme group ('A', 'B', etc.) */
  label: string;
  /** Line numbers (0-indexed) that belong to this group */
  lineNumbers: number[];
  /** Type of rhyme shared by words in this group */
  rhymeType: ExtendedRhymeType;
  /** The end words of each line in this group */
  endWords: string[];
}

/**
 * Internal rhyme with word information
 */
export interface ExtendedInternalRhyme extends InternalRhyme {
  /** The two words that rhyme internally */
  words: [string, string];
}

// =============================================================================
// Logging
// =============================================================================

const DEBUG = process.env.NODE_ENV === 'development';
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[rhyme] ${message}`, ...args);
  }
};

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Extracts the rhyming part from a phoneme sequence.
 *
 * The rhyming part consists of all phonemes from the last stressed vowel
 * (primary stress preferred, then secondary, then any vowel) to the end.
 *
 * @param phonemes - Array of ARPAbet phonemes
 * @returns Array of phonemes from stressed vowel onward, or empty if no vowels
 *
 * @example
 * getRhymingPart(['K', 'AE1', 'T']) // ['AE1', 'T']
 * getRhymingPart(['HH', 'AH0', 'L', 'OW1']) // ['OW1']
 * getRhymingPart(['B', 'Y', 'UW1', 'T', 'IY0']) // ['IY0'] (last vowel)
 */
export function getRhymingPart(phonemes: PhonemeSequence): PhonemeSequence {
  log('getRhymingPart input:', phonemes);

  if (!phonemes || phonemes.length === 0) {
    return [];
  }

  // First, try to find the last vowel with primary stress (1)
  let lastStressedIndex = -1;

  for (let i = phonemes.length - 1; i >= 0; i--) {
    const stress = getPhonemeStress(phonemes[i]);
    if (stress === '1') {
      lastStressedIndex = i;
      break;
    }
  }

  // If no primary stress, try secondary stress (2)
  if (lastStressedIndex === -1) {
    for (let i = phonemes.length - 1; i >= 0; i--) {
      const stress = getPhonemeStress(phonemes[i]);
      if (stress === '2') {
        lastStressedIndex = i;
        break;
      }
    }
  }

  // If still not found, use the last vowel (even unstressed)
  if (lastStressedIndex === -1) {
    for (let i = phonemes.length - 1; i >= 0; i--) {
      if (isVowel(phonemes[i])) {
        lastStressedIndex = i;
        break;
      }
    }
  }

  if (lastStressedIndex === -1) {
    log('getRhymingPart: no vowel found');
    return [];
  }

  const rhymingPart = phonemes.slice(lastStressedIndex);
  log('getRhymingPart output:', rhymingPart);
  return rhymingPart;
}

/**
 * Extracts the base phoneme (removes stress marker from vowels).
 *
 * @param phoneme - A single phoneme
 * @returns The phoneme without stress markers
 */
function getBasePhoneme(phoneme: string): string {
  return phoneme.replace(/[012]$/, '');
}

/**
 * Normalizes a phoneme sequence by removing stress markers.
 * Useful for comparing rhyming parts regardless of stress.
 *
 * @param phonemes - Array of phonemes
 * @returns Array of phonemes with stress markers removed
 */
export function normalizePhonemes(phonemes: PhonemeSequence): string[] {
  return phonemes.map((p) => getBasePhoneme(p));
}

/**
 * Extracts vowel phonemes from a sequence (without stress markers).
 *
 * @param phonemes - Array of phonemes
 * @returns Array of vowel phonemes (base form)
 */
export function extractVowelBases(phonemes: PhonemeSequence): string[] {
  return phonemes.filter((p) => isVowel(p)).map((p) => getBasePhoneme(p));
}

/**
 * Extracts consonant phonemes from a sequence.
 *
 * @param phonemes - Array of phonemes
 * @returns Array of consonant phonemes
 */
export function extractConsonantSequence(phonemes: PhonemeSequence): string[] {
  return phonemes.filter((p) => isConsonant(p));
}

/**
 * Calculates phonetic similarity between two phoneme sequences.
 *
 * Uses a weighted comparison:
 * - Identical phonemes: 1.0
 * - Same phoneme class (both vowels or both consonants): 0.5
 * - Different: 0.0
 *
 * Returns normalized score between 0.0 and 1.0.
 *
 * @param p1 - First phoneme sequence
 * @param p2 - Second phoneme sequence
 * @returns Similarity score from 0.0 to 1.0
 *
 * @example
 * calculatePhoneticSimilarity(['AE1', 'T'], ['AE1', 'T']) // 1.0 (identical)
 * calculatePhoneticSimilarity(['AE1', 'T'], ['AE1', 'D']) // ~0.75 (similar)
 * calculatePhoneticSimilarity(['AE1', 'T'], ['OW1', 'K']) // ~0.5 (different)
 */
export function calculatePhoneticSimilarity(
  p1: PhonemeSequence,
  p2: PhonemeSequence
): number {
  log('calculatePhoneticSimilarity input:', { p1, p2 });

  if (!p1 || !p2 || p1.length === 0 || p2.length === 0) {
    return 0;
  }

  // Normalize phonemes (remove stress markers)
  const norm1 = normalizePhonemes(p1);
  const norm2 = normalizePhonemes(p2);

  // Use the longer sequence as the denominator
  const maxLen = Math.max(norm1.length, norm2.length);
  const minLen = Math.min(norm1.length, norm2.length);

  let score = 0;

  // Compare aligned phonemes
  for (let i = 0; i < minLen; i++) {
    const ph1 = norm1[i];
    const ph2 = norm2[i];

    if (ph1 === ph2) {
      // Identical phonemes
      score += 1.0;
    } else if (
      (isVowel(ph1 + '0') && isVowel(ph2 + '0')) ||
      (isConsonant(ph1) && isConsonant(ph2))
    ) {
      // Same phoneme class - partial credit
      score += 0.3;
    }
    // Different classes: 0 points
  }

  // Penalize length difference
  const lengthPenalty = (maxLen - minLen) * 0.5;
  score = Math.max(0, score - lengthPenalty);

  const similarity = score / maxLen;
  log('calculatePhoneticSimilarity output:', similarity);
  return similarity;
}

/**
 * Classifies the type of rhyme between two words.
 *
 * Rhyme types:
 * - perfect: Identical rhyming parts (cat/hat, love/dove)
 * - slant: Similar but not identical sounds (cat/bed, love/move)
 * - assonance: Same vowels, different consonants (cat/bad, love/luck)
 * - consonance: Same consonants, different vowels (cat/kit, love/live)
 * - none: No significant phonetic similarity
 *
 * @param word1 - First word
 * @param word2 - Second word
 * @returns The type of rhyme between the words
 *
 * @example
 * classifyRhyme('cat', 'hat') // 'perfect'
 * classifyRhyme('love', 'move') // 'slant'
 * classifyRhyme('cat', 'bad') // 'assonance'
 * classifyRhyme('cat', 'kit') // 'consonance'
 * classifyRhyme('cat', 'dog') // 'none'
 */
export function classifyRhyme(word1: string, word2: string): ExtendedRhymeType {
  log('classifyRhyme input:', { word1, word2 });

  // Look up phonemes for both words
  const phonemes1 = lookupWord(word1);
  const phonemes2 = lookupWord(word2);

  if (!phonemes1 || !phonemes2) {
    log('classifyRhyme: word not in dictionary');
    return 'none';
  }

  // Get rhyming parts
  const rhyme1 = getRhymingPart(phonemes1);
  const rhyme2 = getRhymingPart(phonemes2);

  if (rhyme1.length === 0 || rhyme2.length === 0) {
    return 'none';
  }

  // Check for perfect rhyme (identical rhyming parts, ignoring stress)
  const norm1 = normalizePhonemes(rhyme1);
  const norm2 = normalizePhonemes(rhyme2);

  if (norm1.join(' ') === norm2.join(' ')) {
    log('classifyRhyme: perfect rhyme');
    return 'perfect';
  }

  // Extract vowels and consonants from rhyming parts
  const vowels1 = extractVowelBases(rhyme1);
  const vowels2 = extractVowelBases(rhyme2);
  const cons1 = extractConsonantSequence(rhyme1);
  const cons2 = extractConsonantSequence(rhyme2);

  // Check for assonance (same vowels, different consonants)
  const vowelsMatch = vowels1.join(' ') === vowels2.join(' ');
  const consMatch = cons1.join(' ') === cons2.join(' ');

  if (vowelsMatch && !consMatch && vowels1.length > 0) {
    log('classifyRhyme: assonance');
    return 'assonance';
  }

  // Check for consonance (same consonants, different vowels)
  if (consMatch && !vowelsMatch && cons1.length > 0) {
    log('classifyRhyme: consonance');
    return 'consonance';
  }

  // Check for slant rhyme (high phonetic similarity but not perfect)
  const similarity = calculatePhoneticSimilarity(rhyme1, rhyme2);
  if (similarity >= 0.6) {
    log('classifyRhyme: slant rhyme, similarity:', similarity);
    return 'slant';
  }

  // Check for partial vowel match (at least one vowel matches)
  const commonVowels = vowels1.filter((v) => vowels2.includes(v));
  if (commonVowels.length > 0 && similarity >= 0.4) {
    log('classifyRhyme: slant rhyme (partial vowel match)');
    return 'slant';
  }

  log('classifyRhyme: no rhyme detected');
  return 'none';
}

/**
 * Gets the last word from a line of text.
 *
 * Handles punctuation by stripping it from the end.
 *
 * @param line - A line of text
 * @returns The last word, or empty string if no words
 */
export function getLastWord(line: string): string {
  if (!line || line.trim() === '') {
    return '';
  }

  // Remove punctuation and get words
  const cleaned = line.replace(/[.,!?;:'"()[\]{}—–-]+$/g, '').trim();
  const words = cleaned.split(/\s+/).filter((w) => w.length > 0);

  if (words.length === 0) {
    return '';
  }

  // Get last word and clean it
  let lastWord = words[words.length - 1];
  // Remove any remaining punctuation attached to the word
  lastWord = lastWord.replace(/[^a-zA-Z']/g, '');

  return lastWord.toLowerCase();
}

/**
 * Tokenizes a line into words, preserving positions.
 *
 * @param line - A line of text
 * @returns Array of { word, position } objects
 */
export function tokenizeLine(line: string): { word: string; position: number }[] {
  if (!line || line.trim() === '') {
    return [];
  }

  const tokens: { word: string; position: number }[] = [];
  const wordPattern = /[a-zA-Z']+/g;
  let match;

  while ((match = wordPattern.exec(line)) !== null) {
    tokens.push({
      word: match[0].toLowerCase(),
      position: match.index,
    });
  }

  return tokens;
}

/**
 * Detects the rhyme scheme for a set of lines.
 *
 * Analyzes end words and assigns letters (A, B, C, etc.) to rhyming groups.
 * Lines that don't rhyme with any previous line get a new letter.
 *
 * @param lines - Array of lines (strings)
 * @returns Rhyme scheme notation (e.g., 'ABAB', 'AABB', 'ABCABC')
 *
 * @example
 * detectRhymeScheme([
 *   'The cat sat on the mat',
 *   'The dog ran through the fog',
 *   'I like my hat so flat',
 *   'A day of rain and log'
 * ]) // 'ABAB'
 */
export function detectRhymeScheme(lines: string[]): string {
  log('detectRhymeScheme input:', lines);

  if (!lines || lines.length === 0) {
    return '';
  }

  // Get end words for each line
  const endWords = lines.map((line) => getLastWord(line));
  log('detectRhymeScheme endWords:', endWords);

  // Track rhyme groups: each group has a label and the end words
  const rhymeGroups: { label: string; words: string[]; lineIndices: number[] }[] = [];
  const schemeLabels: string[] = [];
  let currentLabel = 'A';

  for (let i = 0; i < endWords.length; i++) {
    const word = endWords[i];

    if (!word) {
      // Empty line or no words - assign unique label
      schemeLabels.push(currentLabel);
      currentLabel = String.fromCharCode(currentLabel.charCodeAt(0) + 1);
      continue;
    }

    // Check if this word rhymes with any existing group
    let foundGroup = false;

    for (const group of rhymeGroups) {
      // Check if this word rhymes with any word in the group
      for (const groupWord of group.words) {
        const rhymeType = classifyRhyme(word, groupWord);
        if (rhymeType !== 'none') {
          // Found a rhyme - add to this group
          group.words.push(word);
          group.lineIndices.push(i);
          schemeLabels.push(group.label);
          foundGroup = true;
          break;
        }
      }
      if (foundGroup) break;
    }

    if (!foundGroup) {
      // No rhyme found - create new group
      rhymeGroups.push({
        label: currentLabel,
        words: [word],
        lineIndices: [i],
      });
      schemeLabels.push(currentLabel);
      currentLabel = String.fromCharCode(currentLabel.charCodeAt(0) + 1);
    }
  }

  const scheme = schemeLabels.join('');
  log('detectRhymeScheme output:', scheme);
  return scheme;
}

/**
 * Finds internal rhymes within a single line.
 *
 * Internal rhymes occur when words within the same line rhyme with each other
 * (not at the end position).
 *
 * @param line - A line of text
 * @param lineNumber - The line number (for result annotation)
 * @returns Array of internal rhyme objects
 *
 * @example
 * findInternalRhymes('The cat in the hat sat on the mat', 0)
 * // Returns rhymes between cat/hat, hat/sat, sat/mat, etc.
 */
export function findInternalRhymes(
  line: string,
  lineNumber: number = 0
): ExtendedInternalRhyme[] {
  log('findInternalRhymes input:', { line, lineNumber });

  const tokens = tokenizeLine(line);

  if (tokens.length < 2) {
    return [];
  }

  const internalRhymes: ExtendedInternalRhyme[] = [];
  const lastWordPosition = tokens[tokens.length - 1].position;

  // Compare each pair of words (excluding pairs where both are the last word)
  for (let i = 0; i < tokens.length; i++) {
    for (let j = i + 1; j < tokens.length; j++) {
      // Skip if both words are at the end position
      if (tokens[i].position === lastWordPosition && tokens[j].position === lastWordPosition) {
        continue;
      }

      // Skip if the words are the same
      if (tokens[i].word === tokens[j].word) {
        continue;
      }

      // At least one word should NOT be at the end position for internal rhyme
      if (tokens[j].position === lastWordPosition && i > 0) {
        // Skip comparison with end word unless first word is internal
        continue;
      }

      const rhymeType = classifyRhyme(tokens[i].word, tokens[j].word);

      if (rhymeType !== 'none') {
        internalRhymes.push({
          line: lineNumber,
          positions: [tokens[i].position, tokens[j].position],
          words: [tokens[i].word, tokens[j].word],
        });
      }
    }
  }

  log('findInternalRhymes output:', internalRhymes);
  return internalRhymes;
}

/**
 * Performs a complete rhyme analysis on a poem.
 *
 * This is the main entry point for rhyme analysis, combining:
 * - Rhyme scheme detection
 * - Rhyme group classification
 * - Internal rhyme detection
 *
 * @param lines - Array of lines in the poem
 * @returns Complete RhymeAnalysis object
 *
 * @example
 * analyzeRhymes([
 *   'Roses are red',
 *   'Violets are blue',
 *   'Sugar is sweet',
 *   'And so are you'
 * ])
 * // Returns { scheme: 'ABCB', groups: [...], internalRhymes: [...] }
 */
export function analyzeRhymes(lines: string[]): RhymeAnalysis {
  log('analyzeRhymes input:', lines);

  if (!lines || lines.length === 0) {
    return {
      scheme: '',
      rhymeGroups: {},
      internalRhymes: [],
    };
  }

  // Detect the rhyme scheme
  const scheme = detectRhymeScheme(lines);

  // Build rhyme groups with detailed information
  const endWords = lines.map((line) => getLastWord(line));
  const rhymeGroups: Record<string, RhymeGroup> = {};

  // Group lines by their scheme letter
  const letterToLines: Map<string, number[]> = new Map();
  const letterToWords: Map<string, string[]> = new Map();

  for (let i = 0; i < scheme.length; i++) {
    const letter = scheme[i];

    if (!letterToLines.has(letter)) {
      letterToLines.set(letter, []);
      letterToWords.set(letter, []);
    }

    letterToLines.get(letter)!.push(i);
    letterToWords.get(letter)!.push(endWords[i]);
  }

  // Create rhyme groups
  for (const [letter, lineIndices] of letterToLines.entries()) {
    const words = letterToWords.get(letter)!;

    // Determine the rhyme type for this group
    let groupRhymeType: RhymeType = 'perfect';

    if (lineIndices.length >= 2) {
      // Check rhyme type between first two words in the group
      const type = classifyRhyme(words[0], words[1]);
      if (type === 'none') {
        groupRhymeType = 'slant'; // Default if classification fails
      } else if (type !== 'none') {
        groupRhymeType = type as RhymeType;
      }
    }

    rhymeGroups[letter] = {
      lines: lineIndices,
      rhymeType: groupRhymeType,
      endWords: words,
    };
  }

  // Find all internal rhymes
  const internalRhymes: InternalRhyme[] = [];

  for (let i = 0; i < lines.length; i++) {
    const lineInternalRhymes = findInternalRhymes(lines[i], i);
    // Convert ExtendedInternalRhyme to InternalRhyme (drop words field)
    internalRhymes.push(
      ...lineInternalRhymes.map((r) => ({
        line: r.line,
        positions: r.positions,
      }))
    );
  }

  const result: RhymeAnalysis = {
    scheme,
    rhymeGroups,
    internalRhymes,
  };

  log('analyzeRhymes output:', result);
  return result;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Checks if two words are a perfect rhyme.
 *
 * @param word1 - First word
 * @param word2 - Second word
 * @returns True if words are a perfect rhyme
 */
export function isPerfectRhyme(word1: string, word2: string): boolean {
  return classifyRhyme(word1, word2) === 'perfect';
}

/**
 * Checks if two words rhyme at all (any rhyme type except 'none').
 *
 * @param word1 - First word
 * @param word2 - Second word
 * @returns True if words rhyme in any way
 */
export function doWordsRhyme(word1: string, word2: string): boolean {
  return classifyRhyme(word1, word2) !== 'none';
}

/**
 * Finds all words that rhyme with a given word from a list.
 *
 * @param targetWord - The word to find rhymes for
 * @param wordList - List of words to search
 * @param minType - Minimum rhyme quality ('perfect' | 'slant' | 'assonance' | 'consonance')
 * @returns Array of rhyming words with their rhyme types
 */
export function findRhymingWords(
  targetWord: string,
  wordList: string[],
  minType: ExtendedRhymeType = 'slant'
): { word: string; rhymeType: ExtendedRhymeType }[] {
  const rhymeHierarchy: ExtendedRhymeType[] = [
    'perfect',
    'slant',
    'assonance',
    'consonance',
    'none',
  ];
  const minIndex = rhymeHierarchy.indexOf(minType);

  const results: { word: string; rhymeType: ExtendedRhymeType }[] = [];

  for (const word of wordList) {
    if (word.toLowerCase() === targetWord.toLowerCase()) {
      continue; // Skip the same word
    }

    const rhymeType = classifyRhyme(targetWord, word);
    const typeIndex = rhymeHierarchy.indexOf(rhymeType);

    if (typeIndex <= minIndex && rhymeType !== 'none') {
      results.push({ word, rhymeType });
    }
  }

  // Sort by rhyme quality (perfect first)
  results.sort((a, b) => {
    return rhymeHierarchy.indexOf(a.rhymeType) - rhymeHierarchy.indexOf(b.rhymeType);
  });

  return results;
}

/**
 * Calculates a rhyme density score for a line.
 *
 * Higher scores indicate more internal rhyming within the line.
 *
 * @param line - A line of text
 * @returns Rhyme density score (0.0 to 1.0)
 */
export function calculateRhymeDensity(line: string): number {
  const tokens = tokenizeLine(line);

  if (tokens.length < 2) {
    return 0;
  }

  // Count rhyming pairs
  let rhymePairs = 0;
  const totalPossiblePairs = (tokens.length * (tokens.length - 1)) / 2;

  for (let i = 0; i < tokens.length; i++) {
    for (let j = i + 1; j < tokens.length; j++) {
      if (tokens[i].word !== tokens[j].word) {
        const rhymeType = classifyRhyme(tokens[i].word, tokens[j].word);
        if (rhymeType !== 'none') {
          rhymePairs++;
        }
      }
    }
  }

  return totalPossiblePairs > 0 ? rhymePairs / totalPossiblePairs : 0;
}

/**
 * Gets the rhyme quality score between two words.
 *
 * Returns a numeric score representing rhyme quality:
 * - 1.0: perfect rhyme
 * - 0.75: slant rhyme
 * - 0.5: assonance
 * - 0.5: consonance
 * - 0.0: no rhyme
 *
 * @param word1 - First word
 * @param word2 - Second word
 * @returns Quality score from 0.0 to 1.0
 */
export function getRhymeQualityScore(word1: string, word2: string): number {
  const rhymeType = classifyRhyme(word1, word2);

  switch (rhymeType) {
    case 'perfect':
      return 1.0;
    case 'slant':
      return 0.75;
    case 'assonance':
      return 0.5;
    case 'consonance':
      return 0.5;
    case 'none':
    default:
      return 0.0;
  }
}

/**
 * Analyzes the rhyme scheme pattern to identify common forms.
 *
 * @param scheme - The rhyme scheme string (e.g., 'ABAB')
 * @returns Description of the rhyme form
 */
export function identifyRhymeForm(scheme: string): string {
  if (!scheme || scheme.length === 0) {
    return 'none';
  }

  // Common rhyme schemes
  const forms: Record<string, string> = {
    'AA': 'couplet',
    'AABB': 'couplets',
    'AABBCC': 'couplets',
    'AABBCCDD': 'couplets',
    'ABAB': 'alternate',
    'ABCABC': 'alternate',
    'ABBA': 'enclosed',
    'ABBAABBA': 'enclosed (octave)',
    'ABABCDCD': 'alternate',
    'ABABCDCDEFEFGG': 'Shakespearean sonnet',
    'ABBAABBACDECDE': 'Petrarchan sonnet',
    'ABBAABBACDCDCD': 'Petrarchan sonnet',
    'AAB': 'triplet with tail',
    'ABA': 'interlocking',
    'ABAAB': 'limerick',
    'TERZA': 'terza rima (ABA BCB CDC...)',
  };

  // Check for exact match
  if (forms[scheme]) {
    return forms[scheme];
  }

  // Check for couplet pattern (all pairs)
  if (scheme.length >= 2 && scheme.length % 2 === 0) {
    let isCouplet = true;
    for (let i = 0; i < scheme.length; i += 2) {
      if (scheme[i] !== scheme[i + 1]) {
        isCouplet = false;
        break;
      }
    }
    if (isCouplet) {
      return 'couplets';
    }
  }

  // Check for alternate pattern
  if (scheme.length >= 4) {
    const firstHalf = scheme.slice(0, scheme.length / 2);
    const secondHalf = scheme.slice(scheme.length / 2);
    if (firstHalf === secondHalf) {
      return 'repeating pattern';
    }
  }

  // Check for terza rima (ABA BCB CDC...)
  if (scheme.length >= 9 && scheme.length % 3 === 0) {
    let isTerzaRima = true;
    for (let i = 3; i < scheme.length; i += 3) {
      if (scheme[i - 2] !== scheme[i]) {
        isTerzaRima = false;
        break;
      }
    }
    if (isTerzaRima) {
      return 'terza rima';
    }
  }

  // Count unique letters and pairs
  const unique = new Set(scheme.split('')).size;
  const ratio = unique / scheme.length;

  if (ratio > 0.9) {
    return 'free verse (minimal rhyme)';
  } else if (ratio > 0.7) {
    return 'loose rhyme';
  } else if (ratio > 0.5) {
    return 'moderate rhyme';
  } else {
    return 'dense rhyme';
  }
}
