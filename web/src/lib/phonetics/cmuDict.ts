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
 * PERFORMANCE NOTE: The CMU dictionary is ~4MB and is loaded lazily
 * on first use to avoid impacting initial page load.
 *
 * @see http://www.speech.cs.cmu.edu/cgi-bin/cmudict
 * @see https://en.wikipedia.org/wiki/ARPABET
 */

// Lazy-loaded dictionary reference
let dictionaryCache: Record<string, string> | null = null;
let dictionaryLoadPromise: Promise<Record<string, string>> | null = null;

/**
 * Lazily loads the CMU Pronouncing Dictionary.
 * The dictionary is only loaded once and cached for subsequent calls.
 *
 * @returns Promise resolving to the dictionary object
 */
async function loadDictionary(): Promise<Record<string, string>> {
  if (dictionaryCache) {
    return dictionaryCache;
  }

  if (dictionaryLoadPromise) {
    return dictionaryLoadPromise;
  }

  console.debug('[cmuDict] Loading CMU Pronouncing Dictionary...');
  const startTime = performance.now();

  dictionaryLoadPromise = import('cmu-pronouncing-dictionary')
    .then((module) => {
      dictionaryCache = module.dictionary;
      const loadTime = Math.round(performance.now() - startTime);
      console.debug(`[cmuDict] Dictionary loaded in ${loadTime}ms`);
      return dictionaryCache;
    })
    .catch((error) => {
      console.error('[cmuDict] Failed to load dictionary:', error);
      dictionaryLoadPromise = null;
      throw error;
    });

  return dictionaryLoadPromise;
}

/**
 * Gets the dictionary synchronously if already loaded.
 * Returns null if dictionary hasn't been loaded yet.
 *
 * @returns The dictionary or null
 */
function getDictionarySync(): Record<string, string> | null {
  return dictionaryCache;
}

/**
 * Preloads the dictionary without blocking.
 * Call this early in the app lifecycle to start loading the dictionary in the background.
 */
export function preloadDictionary(): void {
  loadDictionary().catch(() => {
    // Errors are logged in loadDictionary
  });
}

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
 * Looks up a word in the CMU dictionary and returns its phonemes (sync version).
 * Returns null if dictionary isn't loaded or word not found.
 *
 * NOTE: Use lookupWordAsync for guaranteed results after dictionary loads.
 *
 * @param word - The word to look up
 * @returns Array of phonemes, or null if word not found
 */
export function lookupWord(word: string): PhonemeSequence | null {
  const dictionary = getDictionarySync()
  if (!dictionary) {
    console.debug(`[cmuDict] Dictionary not loaded yet, returning null for: "${word}"`)
    return null
  }

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
 * Looks up a word in the CMU dictionary and returns its phonemes (async version).
 * This ensures the dictionary is loaded before lookup.
 *
 * @param word - The word to look up
 * @returns Promise resolving to array of phonemes, or null if word not found
 */
export async function lookupWordAsync(word: string): Promise<PhonemeSequence | null> {
  const dictionary = await loadDictionary()
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
 */
export function lookupAllPronunciations(word: string): LookupResult {
  const dictionary = getDictionarySync()
  if (!dictionary) {
    console.debug(`[cmuDict] Dictionary not loaded yet for all pronunciations: "${word}"`)
    return {
      word,
      pronunciations: [],
      found: false,
    }
  }

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
 * Async version of lookupAllPronunciations.
 * Ensures dictionary is loaded before lookup.
 *
 * @param word - The word to look up
 * @returns Promise resolving to LookupResult
 */
export async function lookupAllPronunciationsAsync(word: string): Promise<LookupResult> {
  const dictionary = await loadDictionary()
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
 */
export function hasWord(word: string): boolean {
  const dictionary = getDictionarySync()
  if (!dictionary) {
    console.debug(`[cmuDict] Dictionary not loaded yet for hasWord: "${word}"`)
    return false
  }

  const normalized = normalizeWord(word)
  const exists = normalized in dictionary
  console.debug(`[cmuDict] hasWord "${word}": ${exists}`)
  return exists
}

/**
 * Async version of hasWord. Ensures dictionary is loaded.
 *
 * @param word - The word to check
 * @returns Promise resolving to true if word exists
 */
export async function hasWordAsync(word: string): Promise<boolean> {
  const dictionary = await loadDictionary()
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
 * Async version of analyzeWord. Ensures dictionary is loaded.
 *
 * @param word - The word to analyze
 * @returns Promise resolving to complete phonetic analysis
 */
export async function analyzeWordAsync(word: string): Promise<PhoneticAnalysis> {
  const lookupResult = await lookupAllPronunciationsAsync(word)

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

/**
 * Ensures the dictionary is loaded. Call this before performing
 * synchronous operations if you need guaranteed results.
 *
 * @returns Promise that resolves when dictionary is loaded
 */
export async function ensureDictionaryLoaded(): Promise<void> {
  await loadDictionary()
}

/**
 * Checks if the dictionary is currently loaded.
 *
 * @returns True if dictionary is loaded and ready
 */
export function isDictionaryLoaded(): boolean {
  return dictionaryCache !== null
}
