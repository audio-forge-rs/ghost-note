/**
 * CMU Pronouncing Dictionary Module
 *
 * Provides phonetic word lookup using the CMU Pronouncing Dictionary.
 * The dictionary uses ARPAbet notation for phonemes.
 *
 * ARPAbet vowels include stress markers:
 * - 0 = no stress (unstressed)
 * - 1 = primary stress
 * - 2 = secondary stress
 *
 * @see http://www.speech.cs.cmu.edu/cgi-bin/cmudict
 * @see https://en.wikipedia.org/wiki/ARPABET
 */

import { dictionary } from 'cmu-pronouncing-dictionary'

/**
 * ARPAbet vowel phonemes (without stress markers)
 * Each vowel in a pronunciation represents one syllable
 */
export const ARPABET_VOWELS = [
  'AA', // odd, father
  'AE', // at, bat
  'AH', // hut, but
  'AO', // bought, caught
  'AW', // cow, how
  'AY', // hide, my
  'EH', // ed, bed
  'ER', // hurt, bird
  'EY', // ate, say
  'IH', // it, bit
  'IY', // eat, see
  'OW', // oat, go
  'OY', // toy, boy
  'UH', // hood, could
  'UW', // two, you
] as const

/**
 * ARPAbet consonant phonemes
 */
export const ARPABET_CONSONANTS = [
  'B', // bee
  'CH', // cheese
  'D', // dee
  'DH', // thee
  'F', // fee
  'G', // green
  'HH', // he
  'JH', // gee
  'K', // key
  'L', // lee
  'M', // me
  'N', // knee
  'NG', // ping
  'P', // pee
  'R', // read
  'S', // sea
  'SH', // she
  'T', // tea
  'TH', // theta
  'V', // vee
  'W', // we
  'Y', // yield
  'Z', // zee
  'ZH', // seizure
] as const

/** Stress levels in CMU dictionary */
export type StressLevel = '0' | '1' | '2'

/** A single phoneme (with optional stress marker for vowels) */
export type Phoneme = string

/** Array of phonemes representing a pronunciation */
export type PhonemeSequence = Phoneme[]

/**
 * Result of a word lookup that may have multiple pronunciations
 */
export interface LookupResult {
  /** The original word that was looked up */
  word: string
  /** All pronunciation variants found in the dictionary */
  pronunciations: PhonemeSequence[]
  /** Whether the word was found in the dictionary */
  found: boolean
}

/**
 * Detailed phonetic analysis of a word
 */
export interface PhoneticAnalysis {
  /** The original word */
  word: string
  /** Array of phonemes for the primary pronunciation */
  phonemes: PhonemeSequence
  /** Number of syllables (count of vowels) */
  syllableCount: number
  /** Stress pattern as a string of 0s, 1s, and 2s */
  stressPattern: string
  /** Whether the word was found in the dictionary */
  inDictionary: boolean
  /** Alternative pronunciations if available */
  alternativePronunciations?: PhonemeSequence[]
}

/**
 * Normalizes a word for dictionary lookup.
 * The CMU dictionary uses lowercase words.
 *
 * @param word - The word to normalize
 * @returns Normalized word for lookup
 */
function normalizeWord(word: string): string {
  return word.toLowerCase().trim()
}

/**
 * Parses a pronunciation string from the dictionary into phonemes.
 * CMU dictionary stores pronunciations as space-separated phoneme strings.
 *
 * @param pronunciation - Space-separated phoneme string (e.g., "HH AH0 L OW1")
 * @returns Array of phonemes
 */
function parsePronunciation(pronunciation: string): PhonemeSequence {
  return pronunciation.split(' ').filter((p) => p.length > 0)
}

/**
 * Checks if a phoneme is a vowel (with or without stress marker).
 *
 * @param phoneme - The phoneme to check
 * @returns True if the phoneme is a vowel
 */
export function isVowel(phoneme: string): boolean {
  // Extract base phoneme (remove stress marker if present)
  const basePhoneme = phoneme.replace(/[012]$/, '')
  return (ARPABET_VOWELS as readonly string[]).includes(basePhoneme)
}

/**
 * Checks if a phoneme is a consonant.
 *
 * @param phoneme - The phoneme to check
 * @returns True if the phoneme is a consonant
 */
export function isConsonant(phoneme: string): boolean {
  return (ARPABET_CONSONANTS as readonly string[]).includes(phoneme)
}

/**
 * Extracts the stress marker from a vowel phoneme.
 *
 * @param phoneme - A vowel phoneme (e.g., "AA1", "IY0")
 * @returns The stress level ('0', '1', or '2'), or null if not a vowel
 */
export function getPhonemeStress(phoneme: string): StressLevel | null {
  if (!isVowel(phoneme)) {
    return null
  }
  const stressMatch = phoneme.match(/[012]$/)
  return stressMatch ? (stressMatch[0] as StressLevel) : null
}

/**
 * Looks up a word in the CMU dictionary and returns its phonemes.
 * Returns the primary pronunciation as an array of phonemes.
 *
 * @param word - The word to look up
 * @returns Array of phonemes, or null if word not found
 *
 * @example
 * lookupWord('hello') // ['HH', 'AH0', 'L', 'OW1'] or ['HH', 'EH0', 'L', 'OW1']
 * lookupWord('xyzzy') // null
 */
export function lookupWord(word: string): PhonemeSequence | null {
  const normalized = normalizeWord(word)
  const pronunciation = dictionary[normalized]

  if (!pronunciation) {
    console.debug(`[cmuDict] Word not found: "${word}"`)
    return null
  }

  const phonemes = parsePronunciation(pronunciation)
  console.debug(`[cmuDict] Lookup "${word}": ${phonemes.join(' ')}`)
  return phonemes
}

/**
 * Looks up all pronunciations for a word.
 * Some words have multiple valid pronunciations (e.g., "read", "live", "permit").
 *
 * Note: The current cmu-pronouncing-dictionary npm package only provides
 * the primary pronunciation. This function is designed to handle future
 * updates that may include multiple pronunciations, and provides a
 * consistent interface.
 *
 * @param word - The word to look up
 * @returns LookupResult with all pronunciations found
 *
 * @example
 * lookupAllPronunciations('hello')
 * // { word: 'hello', pronunciations: [['HH', 'AH0', 'L', 'OW1']], found: true }
 */
export function lookupAllPronunciations(word: string): LookupResult {
  const normalized = normalizeWord(word)
  const pronunciation = dictionary[normalized]

  if (!pronunciation) {
    console.debug(`[cmuDict] Word not found for all pronunciations: "${word}"`)
    return {
      word,
      pronunciations: [],
      found: false,
    }
  }

  const phonemes = parsePronunciation(pronunciation)
  console.debug(
    `[cmuDict] All pronunciations for "${word}": ${phonemes.join(' ')}`
  )

  return {
    word,
    pronunciations: [phonemes],
    found: true,
  }
}

/**
 * Checks if a word exists in the CMU dictionary.
 *
 * @param word - The word to check
 * @returns True if the word exists in the dictionary
 *
 * @example
 * hasWord('hello') // true
 * hasWord('xyzzy') // false
 */
export function hasWord(word: string): boolean {
  const normalized = normalizeWord(word)
  const exists = normalized in dictionary
  console.debug(`[cmuDict] hasWord "${word}": ${exists}`)
  return exists
}

/**
 * Gets the stress pattern for a word as a string of stress markers.
 * Each character represents the stress of one syllable.
 *
 * Stress markers:
 * - '0' = unstressed
 * - '1' = primary stress
 * - '2' = secondary stress
 *
 * @param word - The word to analyze
 * @returns Stress pattern string (e.g., "01" for "hello"), or null if not found
 *
 * @example
 * getStress('hello')      // "01" (he-LLO)
 * getStress('beautiful')  // "100" (BEAU-ti-ful)
 * getStress('understand') // "201" (UN-der-STAND)
 */
export function getStress(word: string): string | null {
  const phonemes = lookupWord(word)
  if (!phonemes) {
    return null
  }

  const stressPattern = phonemes
    .map((phoneme) => getPhonemeStress(phoneme))
    .filter((stress): stress is StressLevel => stress !== null)
    .join('')

  console.debug(`[cmuDict] Stress pattern for "${word}": ${stressPattern}`)
  return stressPattern
}

/**
 * Counts the number of syllables in a word.
 * Syllable count equals the number of vowel phonemes in the pronunciation.
 *
 * @param word - The word to count syllables for
 * @returns Number of syllables, or null if word not found
 *
 * @example
 * getSyllableCount('hello')     // 2
 * getSyllableCount('beautiful') // 3
 * getSyllableCount('I')         // 1
 */
export function getSyllableCount(word: string): number | null {
  const phonemes = lookupWord(word)
  if (!phonemes) {
    return null
  }

  const count = phonemes.filter((p) => isVowel(p)).length
  console.debug(`[cmuDict] Syllable count for "${word}": ${count}`)
  return count
}

/**
 * Gets a complete phonetic analysis of a word.
 * Combines all available phonetic information into a single result.
 *
 * @param word - The word to analyze
 * @returns Complete phonetic analysis, or analysis with inDictionary=false
 *
 * @example
 * analyzeWord('hello')
 * // {
 * //   word: 'hello',
 * //   phonemes: ['HH', 'AH0', 'L', 'OW1'],
 * //   syllableCount: 2,
 * //   stressPattern: '01',
 * //   inDictionary: true
 * // }
 */
export function analyzeWord(word: string): PhoneticAnalysis {
  const lookupResult = lookupAllPronunciations(word)

  if (!lookupResult.found) {
    console.debug(`[cmuDict] Analysis failed - word not found: "${word}"`)
    return {
      word,
      phonemes: [],
      syllableCount: 0,
      stressPattern: '',
      inDictionary: false,
    }
  }

  const primaryPhonemes = lookupResult.pronunciations[0]
  const stressPattern = primaryPhonemes
    .map((phoneme) => getPhonemeStress(phoneme))
    .filter((stress): stress is StressLevel => stress !== null)
    .join('')

  const syllableCount = primaryPhonemes.filter((p) => isVowel(p)).length

  const analysis: PhoneticAnalysis = {
    word,
    phonemes: primaryPhonemes,
    syllableCount,
    stressPattern,
    inDictionary: true,
  }

  // Include alternative pronunciations if available
  if (lookupResult.pronunciations.length > 1) {
    analysis.alternativePronunciations = lookupResult.pronunciations.slice(1)
  }

  console.debug(`[cmuDict] Complete analysis for "${word}":`, analysis)
  return analysis
}

/**
 * Extracts vowel phonemes from a phoneme sequence.
 * Useful for rhyme detection and vowel analysis.
 *
 * @param phonemes - Array of phonemes
 * @returns Array of vowel phonemes only
 */
export function extractVowels(phonemes: PhonemeSequence): Phoneme[] {
  return phonemes.filter((p) => isVowel(p))
}

/**
 * Extracts consonant phonemes from a phoneme sequence.
 *
 * @param phonemes - Array of phonemes
 * @returns Array of consonant phonemes only
 */
export function extractConsonants(phonemes: PhonemeSequence): Phoneme[] {
  return phonemes.filter((p) => isConsonant(p))
}

/**
 * Gets the rhyming part of a word (from the last stressed vowel to the end).
 * Useful for detecting perfect rhymes.
 *
 * @param word - The word to get rhyming part for
 * @returns Phonemes from last stressed vowel to end, or null if not found
 *
 * @example
 * getRhymingPart('cat')    // ['AE1', 'T']
 * getRhymingPart('hello')  // ['OW1']
 * getRhymingPart('river')  // ['IH1', 'V', 'ER0'] (from primary stress)
 */
export function getRhymingPart(word: string): PhonemeSequence | null {
  const phonemes = lookupWord(word)
  if (!phonemes) {
    return null
  }

  // Find the last vowel with primary stress (1)
  // If no primary stress, use the last vowel with any stress
  let lastStressedIndex = -1

  for (let i = phonemes.length - 1; i >= 0; i--) {
    const stress = getPhonemeStress(phonemes[i])
    if (stress === '1') {
      lastStressedIndex = i
      break
    }
  }

  // Fallback: find last vowel with any stress marker
  if (lastStressedIndex === -1) {
    for (let i = phonemes.length - 1; i >= 0; i--) {
      if (isVowel(phonemes[i])) {
        lastStressedIndex = i
        break
      }
    }
  }

  if (lastStressedIndex === -1) {
    return null
  }

  const rhymingPart = phonemes.slice(lastStressedIndex)
  console.debug(`[cmuDict] Rhyming part for "${word}": ${rhymingPart.join(' ')}`)
  return rhymingPart
}

/**
 * Checks if two words rhyme (perfect rhyme).
 * Two words rhyme if their rhyming parts are identical.
 *
 * @param word1 - First word
 * @param word2 - Second word
 * @returns True if the words rhyme
 *
 * @example
 * doWordsRhyme('cat', 'hat')     // true
 * doWordsRhyme('love', 'move')   // false (slant rhyme)
 * doWordsRhyme('time', 'rhyme')  // true
 */
export function doWordsRhyme(word1: string, word2: string): boolean {
  const rhyme1 = getRhymingPart(word1)
  const rhyme2 = getRhymingPart(word2)

  if (!rhyme1 || !rhyme2) {
    return false
  }

  // Compare rhyming parts (ignoring stress markers for comparison)
  const normalize = (phonemes: PhonemeSequence): string =>
    phonemes.map((p) => p.replace(/[012]$/, '')).join(' ')

  const match = normalize(rhyme1) === normalize(rhyme2)
  console.debug(`[cmuDict] doWordsRhyme("${word1}", "${word2}"): ${match}`)
  return match
}
