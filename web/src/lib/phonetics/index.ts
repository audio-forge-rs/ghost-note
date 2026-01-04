/**
 * Phonetics Module
 *
 * Provides phonetic analysis using the CMU Pronouncing Dictionary.
 * This module is the main entry point for all phonetics-related functionality.
 */

export {
  // Constants
  ARPABET_VOWELS,
  ARPABET_CONSONANTS,
  // Types
  type StressLevel,
  type Phoneme,
  type PhonemeSequence,
  type LookupResult,
  type PhoneticAnalysis,
  // Core lookup functions
  lookupWord,
  lookupAllPronunciations,
  hasWord,
  // Analysis functions
  getStress,
  getSyllableCount,
  analyzeWord,
  // Helper functions
  isVowel,
  isConsonant,
  getPhonemeStress,
  extractVowels,
  extractConsonants,
  // Rhyme functions
  getRhymingPart,
  doWordsRhyme,
} from './cmuDict.ts'
