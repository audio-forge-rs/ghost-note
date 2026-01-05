/**
 * Sound Patterns Analysis Module
 *
 * This module detects sound patterns beyond end rhyme:
 * - Alliteration: Repeated initial consonant sounds
 * - Assonance: Repeated vowel sounds within words
 * - Consonance: Repeated consonant sounds within words
 *
 * These sound patterns contribute to the musical quality of poetry and
 * can enhance singability when used effectively.
 *
 * @module lib/analysis/soundPatterns
 */

import {
  lookupWord,
  isVowel,
  isConsonant,
  type PhonemeSequence,
} from '@/lib/phonetics';

// =============================================================================
// Types
// =============================================================================

/**
 * Types of sound patterns we detect
 */
export type SoundPatternType = 'alliteration' | 'assonance' | 'consonance';

/**
 * A single occurrence of a sound pattern
 */
export interface SoundPatternOccurrence {
  /** Type of sound pattern */
  type: SoundPatternType;
  /** The sound (phoneme) that creates the pattern */
  sound: string;
  /** Words involved in this pattern */
  words: string[];
  /** Character positions of words in the line (start indices) */
  positions: number[];
  /** Line number (0-indexed) */
  lineNumber: number;
  /** Strength score (0-1) based on number of occurrences and proximity */
  strength: number;
}

/**
 * Sound patterns found in a single line
 */
export interface LineSoundPatterns {
  /** Line number (0-indexed) */
  lineNumber: number;
  /** Original line text */
  text: string;
  /** Alliteration patterns in this line */
  alliterations: SoundPatternOccurrence[];
  /** Assonance patterns in this line */
  assonances: SoundPatternOccurrence[];
  /** Consonance patterns in this line */
  consonances: SoundPatternOccurrence[];
}

/**
 * Complete sound pattern analysis for a poem
 */
export interface SoundPatternAnalysis {
  /** Sound patterns per line */
  lines: LineSoundPatterns[];
  /** Summary statistics */
  summary: {
    /** Total alliteration occurrences */
    alliterationCount: number;
    /** Total assonance occurrences */
    assonanceCount: number;
    /** Total consonance occurrences */
    consonanceCount: number;
    /** Overall sound pattern density (0-1) */
    density: number;
    /** Most common alliterative sounds */
    topAlliterativeSounds: string[];
    /** Most common vowel sounds in assonance */
    topAssonanceSounds: string[];
  };
}

/**
 * Word with its phonetic data for pattern detection
 */
interface PhoneticWordData {
  /** Original word text */
  word: string;
  /** Position in the line (character index) */
  position: number;
  /** Phonemes from CMU dictionary */
  phonemes: PhonemeSequence;
  /** Initial consonant(s) for alliteration */
  initialConsonants: string[];
  /** All vowels in the word (base form without stress) */
  vowels: string[];
  /** All consonants in the word */
  consonants: string[];
}

// =============================================================================
// Logging
// =============================================================================

const DEBUG = process.env.NODE_ENV === 'development';
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[soundPatterns] ${message}`, ...args);
  }
};

// =============================================================================
// Helper Functions
// =============================================================================

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
 * Tokenizes a line into words with their positions.
 *
 * @param line - A line of text
 * @returns Array of { word, position } objects
 */
function tokenizeLineWithPositions(line: string): { word: string; position: number }[] {
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
 * Gets the initial consonant cluster of a word (before the first vowel).
 *
 * @param phonemes - Array of phonemes
 * @returns Array of initial consonants
 */
function getInitialConsonants(phonemes: PhonemeSequence): string[] {
  const initials: string[] = [];

  for (const phoneme of phonemes) {
    if (isVowel(phoneme)) {
      break; // Stop at first vowel
    }
    if (isConsonant(phoneme)) {
      initials.push(phoneme);
    }
  }

  return initials;
}

/**
 * Extracts all vowel phonemes from a word (base form without stress).
 *
 * @param phonemes - Array of phonemes
 * @returns Array of base vowel phonemes
 */
function extractVowelBases(phonemes: PhonemeSequence): string[] {
  return phonemes
    .filter((p) => isVowel(p))
    .map((p) => getBasePhoneme(p));
}

/**
 * Extracts all consonant phonemes from a word.
 *
 * @param phonemes - Array of phonemes
 * @returns Array of consonant phonemes
 */
function extractConsonants(phonemes: PhonemeSequence): string[] {
  return phonemes.filter((p) => isConsonant(p));
}

/**
 * Gets phonetic data for a word, including initial consonants, vowels, and consonants.
 *
 * @param word - The word to analyze
 * @param position - Character position in the line
 * @returns PhoneticWordData or null if word not in dictionary
 */
function getPhoneticWordData(word: string, position: number): PhoneticWordData | null {
  const phonemes = lookupWord(word);

  if (!phonemes || phonemes.length === 0) {
    log('Word not in dictionary:', word);
    return null;
  }

  return {
    word,
    position,
    phonemes,
    initialConsonants: getInitialConsonants(phonemes),
    vowels: extractVowelBases(phonemes),
    consonants: extractConsonants(phonemes),
  };
}

/**
 * Calculates the strength of a sound pattern occurrence.
 * Based on number of words and their proximity.
 *
 * @param positions - Character positions of the words
 * @param lineLength - Length of the line
 * @param wordCount - Number of words in the pattern
 * @returns Strength score from 0 to 1
 */
function calculatePatternStrength(
  positions: number[],
  lineLength: number,
  wordCount: number
): number {
  if (wordCount < 2 || lineLength === 0) {
    return 0;
  }

  // Base score from number of words (2 words = 0.5, 3+ = higher)
  const countScore = Math.min(1, 0.3 + (wordCount - 2) * 0.2);

  // Proximity score - words closer together are stronger
  const minPos = Math.min(...positions);
  const maxPos = Math.max(...positions);
  const spread = maxPos - minPos;
  const normalizedSpread = spread / lineLength;
  const proximityScore = 1 - normalizedSpread * 0.5;

  return Math.min(1, countScore * proximityScore);
}

// =============================================================================
// Alliteration Detection
// =============================================================================

/**
 * Detects alliteration in a line of text.
 *
 * Alliteration is the repetition of initial consonant sounds in neighboring words.
 * For example: "Peter Piper picked a peck" has alliteration on 'P'.
 *
 * @param line - A line of text
 * @param lineNumber - The line number (0-indexed)
 * @returns Array of alliteration occurrences
 *
 * @example
 * detectAlliteration("She sells sea shells", 0)
 * // Returns alliteration patterns for 'S' and 'SH' sounds
 */
export function detectAlliteration(line: string, lineNumber: number): SoundPatternOccurrence[] {
  log('detectAlliteration input:', { line, lineNumber });

  const tokens = tokenizeLineWithPositions(line);
  if (tokens.length < 2) {
    return [];
  }

  // Get phonetic data for each word
  const phoneticWords: PhoneticWordData[] = [];
  for (const token of tokens) {
    const data = getPhoneticWordData(token.word, token.position);
    if (data && data.initialConsonants.length > 0) {
      phoneticWords.push(data);
    }
  }

  if (phoneticWords.length < 2) {
    return [];
  }

  // Group words by their initial consonant(s)
  const initialSoundMap = new Map<string, PhoneticWordData[]>();

  for (const wordData of phoneticWords) {
    // Use the first consonant as the primary alliterative sound
    const firstConsonant = wordData.initialConsonants[0];
    if (firstConsonant) {
      if (!initialSoundMap.has(firstConsonant)) {
        initialSoundMap.set(firstConsonant, []);
      }
      initialSoundMap.get(firstConsonant)!.push(wordData);
    }
  }

  const occurrences: SoundPatternOccurrence[] = [];

  for (const [sound, words] of initialSoundMap.entries()) {
    // Need at least 2 words for alliteration
    if (words.length >= 2) {
      const strength = calculatePatternStrength(
        words.map((w) => w.position),
        line.length,
        words.length
      );

      occurrences.push({
        type: 'alliteration',
        sound,
        words: words.map((w) => w.word),
        positions: words.map((w) => w.position),
        lineNumber,
        strength,
      });
    }
  }

  log('detectAlliteration result:', occurrences.length, 'patterns found');
  return occurrences;
}

// =============================================================================
// Assonance Detection
// =============================================================================

/**
 * Detects assonance in a line of text.
 *
 * Assonance is the repetition of vowel sounds in neighboring words.
 * For example: "The rain in Spain" has assonance on the 'EY' (long a) sound.
 *
 * @param line - A line of text
 * @param lineNumber - The line number (0-indexed)
 * @returns Array of assonance occurrences
 *
 * @example
 * detectAssonance("The light of the fire", 0)
 * // Returns assonance patterns for 'AY' (long i) sound
 */
export function detectAssonance(line: string, lineNumber: number): SoundPatternOccurrence[] {
  log('detectAssonance input:', { line, lineNumber });

  const tokens = tokenizeLineWithPositions(line);
  if (tokens.length < 2) {
    return [];
  }

  // Get phonetic data for each word
  const phoneticWords: PhoneticWordData[] = [];
  for (const token of tokens) {
    const data = getPhoneticWordData(token.word, token.position);
    if (data && data.vowels.length > 0) {
      phoneticWords.push(data);
    }
  }

  if (phoneticWords.length < 2) {
    return [];
  }

  // Group words by vowel sounds they contain
  // A word can be part of multiple assonance groups if it has multiple vowels
  const vowelSoundMap = new Map<string, PhoneticWordData[]>();

  for (const wordData of phoneticWords) {
    // Use unique vowels to avoid counting duplicates within the same word
    const uniqueVowels = [...new Set(wordData.vowels)];
    for (const vowel of uniqueVowels) {
      if (!vowelSoundMap.has(vowel)) {
        vowelSoundMap.set(vowel, []);
      }
      // Only add if not already present (avoid duplicates)
      const existing = vowelSoundMap.get(vowel)!;
      if (!existing.some((w) => w.word === wordData.word && w.position === wordData.position)) {
        existing.push(wordData);
      }
    }
  }

  const occurrences: SoundPatternOccurrence[] = [];

  for (const [sound, words] of vowelSoundMap.entries()) {
    // Need at least 2 words for assonance
    if (words.length >= 2) {
      const strength = calculatePatternStrength(
        words.map((w) => w.position),
        line.length,
        words.length
      );

      occurrences.push({
        type: 'assonance',
        sound,
        words: words.map((w) => w.word),
        positions: words.map((w) => w.position),
        lineNumber,
        strength,
      });
    }
  }

  log('detectAssonance result:', occurrences.length, 'patterns found');
  return occurrences;
}

// =============================================================================
// Consonance Detection
// =============================================================================

/**
 * Detects consonance in a line of text.
 *
 * Consonance is the repetition of consonant sounds, especially at the end
 * of words or in stressed syllables. It's different from alliteration
 * in that it focuses on consonants anywhere in the word, not just at the start.
 *
 * For example: "The lumpy, bumpy road" has consonance on 'M' and 'P' sounds.
 *
 * @param line - A line of text
 * @param lineNumber - The line number (0-indexed)
 * @returns Array of consonance occurrences
 *
 * @example
 * detectConsonance("Blank and think and sink", 0)
 * // Returns consonance patterns for 'NG K' combination
 */
export function detectConsonance(line: string, lineNumber: number): SoundPatternOccurrence[] {
  log('detectConsonance input:', { line, lineNumber });

  const tokens = tokenizeLineWithPositions(line);
  if (tokens.length < 2) {
    return [];
  }

  // Get phonetic data for each word
  const phoneticWords: PhoneticWordData[] = [];
  for (const token of tokens) {
    const data = getPhoneticWordData(token.word, token.position);
    if (data && data.consonants.length > 0) {
      phoneticWords.push(data);
    }
  }

  if (phoneticWords.length < 2) {
    return [];
  }

  // Group words by consonant sounds they contain
  // Focus on significant consonants (appearing multiple times across words)
  const consonantSoundMap = new Map<string, PhoneticWordData[]>();

  for (const wordData of phoneticWords) {
    // Use unique consonants to avoid counting duplicates within the same word
    const uniqueConsonants = [...new Set(wordData.consonants)];
    for (const consonant of uniqueConsonants) {
      if (!consonantSoundMap.has(consonant)) {
        consonantSoundMap.set(consonant, []);
      }
      // Only add if not already present (avoid duplicates)
      const existing = consonantSoundMap.get(consonant)!;
      if (!existing.some((w) => w.word === wordData.word && w.position === wordData.position)) {
        existing.push(wordData);
      }
    }
  }

  const occurrences: SoundPatternOccurrence[] = [];

  for (const [sound, words] of consonantSoundMap.entries()) {
    // Need at least 2 words for consonance, and require 3+ for common consonants
    // to avoid over-detecting (like 'T' appearing in many words)
    const minWords = isCommonConsonant(sound) ? 3 : 2;

    if (words.length >= minWords) {
      const strength = calculatePatternStrength(
        words.map((w) => w.position),
        line.length,
        words.length
      );

      // Apply a penalty for very common consonants
      const adjustedStrength = isCommonConsonant(sound)
        ? strength * 0.7
        : strength;

      occurrences.push({
        type: 'consonance',
        sound,
        words: words.map((w) => w.word),
        positions: words.map((w) => w.position),
        lineNumber,
        strength: adjustedStrength,
      });
    }
  }

  log('detectConsonance result:', occurrences.length, 'patterns found');
  return occurrences;
}

/**
 * Checks if a consonant is very common in English (reducing pattern significance).
 *
 * @param consonant - The consonant phoneme
 * @returns True if very common
 */
function isCommonConsonant(consonant: string): boolean {
  // Most common consonants in English
  const veryCommon = ['T', 'N', 'S', 'R', 'L', 'D'];
  return veryCommon.includes(consonant);
}

// =============================================================================
// Complete Line Analysis
// =============================================================================

/**
 * Analyzes all sound patterns in a single line.
 *
 * @param line - A line of text
 * @param lineNumber - The line number (0-indexed)
 * @returns LineSoundPatterns with all detected patterns
 */
export function analyzeLineSoundPatterns(line: string, lineNumber: number): LineSoundPatterns {
  log('analyzeLineSoundPatterns input:', { line, lineNumber });

  const alliterations = detectAlliteration(line, lineNumber);
  const assonances = detectAssonance(line, lineNumber);
  const consonances = detectConsonance(line, lineNumber);

  return {
    lineNumber,
    text: line,
    alliterations,
    assonances,
    consonances,
  };
}

// =============================================================================
// Complete Poem Analysis
// =============================================================================

/**
 * Analyzes all sound patterns in a poem.
 *
 * This is the main entry point for sound pattern analysis.
 *
 * @param lines - Array of lines in the poem
 * @returns Complete SoundPatternAnalysis
 *
 * @example
 * analyzeSoundPatterns([
 *   "She sells sea shells by the seashore",
 *   "The shells she sells are seashells, I'm sure"
 * ])
 * // Returns comprehensive sound pattern analysis
 */
export function analyzeSoundPatterns(lines: string[]): SoundPatternAnalysis {
  log('analyzeSoundPatterns input:', lines.length, 'lines');

  if (!lines || lines.length === 0) {
    return createDefaultSoundPatternAnalysis();
  }

  const analyzedLines: LineSoundPatterns[] = [];
  let totalAlliteration = 0;
  let totalAssonance = 0;
  let totalConsonance = 0;

  const alliterativeSoundCounts = new Map<string, number>();
  const assonanceSoundCounts = new Map<string, number>();

  for (let i = 0; i < lines.length; i++) {
    const linePatterns = analyzeLineSoundPatterns(lines[i], i);
    analyzedLines.push(linePatterns);

    totalAlliteration += linePatterns.alliterations.length;
    totalAssonance += linePatterns.assonances.length;
    totalConsonance += linePatterns.consonances.length;

    // Track sound frequencies
    for (const pattern of linePatterns.alliterations) {
      const count = alliterativeSoundCounts.get(pattern.sound) || 0;
      alliterativeSoundCounts.set(pattern.sound, count + 1);
    }

    for (const pattern of linePatterns.assonances) {
      const count = assonanceSoundCounts.get(pattern.sound) || 0;
      assonanceSoundCounts.set(pattern.sound, count + 1);
    }
  }

  // Calculate density (average patterns per line)
  const totalPatterns = totalAlliteration + totalAssonance + totalConsonance;
  const density = lines.length > 0 ? Math.min(1, totalPatterns / (lines.length * 5)) : 0;

  // Get top sounds
  const topAlliterativeSounds = getTopSounds(alliterativeSoundCounts, 3);
  const topAssonanceSounds = getTopSounds(assonanceSoundCounts, 3);

  const result: SoundPatternAnalysis = {
    lines: analyzedLines,
    summary: {
      alliterationCount: totalAlliteration,
      assonanceCount: totalAssonance,
      consonanceCount: totalConsonance,
      density,
      topAlliterativeSounds,
      topAssonanceSounds,
    },
  };

  log('analyzeSoundPatterns result:', result.summary);
  return result;
}

/**
 * Gets the top N most frequent sounds from a count map.
 *
 * @param counts - Map of sound to count
 * @param n - Number of top sounds to return
 * @returns Array of top sounds
 */
function getTopSounds(counts: Map<string, number>, n: number): string[] {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([sound]) => sound);
}

/**
 * Creates an empty/default SoundPatternAnalysis.
 *
 * @returns Default SoundPatternAnalysis
 */
export function createDefaultSoundPatternAnalysis(): SoundPatternAnalysis {
  return {
    lines: [],
    summary: {
      alliterationCount: 0,
      assonanceCount: 0,
      consonanceCount: 0,
      density: 0,
      topAlliterativeSounds: [],
      topAssonanceSounds: [],
    },
  };
}

// =============================================================================
// Singability Impact Functions
// =============================================================================

/**
 * Calculates the singability impact of sound patterns.
 *
 * Well-placed alliteration and assonance can enhance singability by:
 * - Creating natural flow and rhythm
 * - Making lyrics more memorable
 * - Providing smooth transitions between words
 *
 * However, excessive or awkward patterns can hinder singability.
 *
 * @param patterns - Sound pattern analysis for a line
 * @returns Score from -0.2 to 0.2 representing singability impact
 *   Positive = enhances singability
 *   Negative = hinders singability
 */
export function calculateSingabilityImpact(patterns: LineSoundPatterns): number {
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
  return Math.max(-0.2, Math.min(0.2, impact));
}

/**
 * Gets a human-readable description of a sound pattern.
 *
 * @param pattern - A sound pattern occurrence
 * @returns Human-readable description
 */
export function describeSoundPattern(pattern: SoundPatternOccurrence): string {
  const soundName = getPhonemeDescription(pattern.sound);
  const wordList = pattern.words.slice(0, 3).join(', ');
  const moreWords = pattern.words.length > 3 ? ` (+${pattern.words.length - 3} more)` : '';

  switch (pattern.type) {
    case 'alliteration':
      return `Alliteration on "${soundName}" sound: ${wordList}${moreWords}`;
    case 'assonance':
      return `Assonance with "${soundName}" vowel: ${wordList}${moreWords}`;
    case 'consonance':
      return `Consonance on "${soundName}" sound: ${wordList}${moreWords}`;
    default:
      return `Sound pattern: ${wordList}`;
  }
}

/**
 * Gets a human-readable name for a phoneme.
 *
 * @param phoneme - ARPAbet phoneme
 * @returns Human-readable description
 */
function getPhonemeDescription(phoneme: string): string {
  const descriptions: Record<string, string> = {
    // Vowels
    AA: 'ah',
    AE: 'a',
    AH: 'uh',
    AO: 'aw',
    AW: 'ow',
    AY: 'i',
    EH: 'e',
    ER: 'er',
    EY: 'ay',
    IH: 'ih',
    IY: 'ee',
    OW: 'oh',
    OY: 'oy',
    UH: 'oo',
    UW: 'oo',
    // Consonants
    B: 'b',
    CH: 'ch',
    D: 'd',
    DH: 'th (voiced)',
    F: 'f',
    G: 'g',
    HH: 'h',
    JH: 'j',
    K: 'k',
    L: 'l',
    M: 'm',
    N: 'n',
    NG: 'ng',
    P: 'p',
    R: 'r',
    S: 's',
    SH: 'sh',
    T: 't',
    TH: 'th',
    V: 'v',
    W: 'w',
    Y: 'y',
    Z: 'z',
    ZH: 'zh',
  };

  return descriptions[phoneme] || phoneme;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Checks if a line has any sound patterns.
 *
 * @param patterns - Sound patterns for a line
 * @returns True if any patterns are present
 */
export function hasSoundPatterns(patterns: LineSoundPatterns): boolean {
  return (
    patterns.alliterations.length > 0 ||
    patterns.assonances.length > 0 ||
    patterns.consonances.length > 0
  );
}

/**
 * Gets all sound patterns from a line as a flat array.
 *
 * @param patterns - Sound patterns for a line
 * @returns All patterns in a single array
 */
export function getAllPatterns(patterns: LineSoundPatterns): SoundPatternOccurrence[] {
  return [
    ...patterns.alliterations,
    ...patterns.assonances,
    ...patterns.consonances,
  ];
}

/**
 * Filters patterns by minimum strength.
 *
 * @param patterns - Array of sound pattern occurrences
 * @param minStrength - Minimum strength threshold (0-1)
 * @returns Patterns meeting the threshold
 */
export function filterByStrength(
  patterns: SoundPatternOccurrence[],
  minStrength: number
): SoundPatternOccurrence[] {
  return patterns.filter((p) => p.strength >= minStrength);
}

/**
 * Gets the strongest pattern from a line.
 *
 * @param patterns - Sound patterns for a line
 * @returns The strongest pattern, or null if no patterns
 */
export function getStrongestPattern(patterns: LineSoundPatterns): SoundPatternOccurrence | null {
  const all = getAllPatterns(patterns);
  if (all.length === 0) {
    return null;
  }

  return all.reduce((max, current) =>
    current.strength > max.strength ? current : max
  );
}
