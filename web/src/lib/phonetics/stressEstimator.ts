/**
 * Stress Estimator Module
 *
 * Provides heuristic-based stress estimation for words not found in the CMU dictionary.
 * Uses English phonological patterns to estimate syllable count and stress placement.
 *
 * This module serves as a fallback when CMU dictionary lookup fails,
 * ensuring the analysis pipeline can handle any word gracefully.
 */

import type { PhoneticAnalysis, StressLevel } from './cmuDict.ts'

// Note: Syllable counting uses a vowel-group approach where consecutive vowels
// (a, e, i, o, u) are counted as one syllable. The 'y' is handled specially
// based on its position in the word.

/**
 * Suffixes that are typically unstressed.
 * These affect stress placement on the preceding syllable.
 */
const UNSTRESSED_SUFFIXES = [
  // Inflectional suffixes (typically unstressed)
  { suffix: 'ing', syllables: 1, stressed: false },
  { suffix: 'ed', syllables: 0, stressed: false }, // Often silent e, not always a syllable
  { suffix: 'es', syllables: 0, stressed: false }, // Sometimes silent
  { suffix: 's', syllables: 0, stressed: false },

  // Common derivational suffixes (typically unstressed)
  { suffix: 'ly', syllables: 1, stressed: false },
  { suffix: 'ful', syllables: 1, stressed: false },
  { suffix: 'less', syllables: 1, stressed: false },
  { suffix: 'ness', syllables: 1, stressed: false },
  { suffix: 'ment', syllables: 1, stressed: false },
  { suffix: 'able', syllables: 2, stressed: false },
  { suffix: 'ible', syllables: 2, stressed: false },
  { suffix: 'ous', syllables: 1, stressed: false },
  { suffix: 'ive', syllables: 1, stressed: false },
  { suffix: 'er', syllables: 1, stressed: false },
  { suffix: 'or', syllables: 1, stressed: false },
  { suffix: 'en', syllables: 1, stressed: false },
  { suffix: 'al', syllables: 1, stressed: false },
  { suffix: 'ary', syllables: 2, stressed: false },
  { suffix: 'ery', syllables: 2, stressed: false },
  { suffix: 'ory', syllables: 2, stressed: false },
]

/**
 * Suffixes that cause stress on the preceding syllable.
 * These typically attract stress to the syllable before them.
 */
const STRESS_SHIFTING_SUFFIXES = [
  // -tion/-sion patterns: stress falls on the syllable BEFORE
  { suffix: 'tion', syllables: 1, stressBefore: 1 },
  { suffix: 'sion', syllables: 1, stressBefore: 1 },
  { suffix: 'cian', syllables: 1, stressBefore: 1 },
  { suffix: 'tian', syllables: 1, stressBefore: 1 },

  // -ic/-ical patterns: stress on syllable before -ic
  { suffix: 'ical', syllables: 2, stressBefore: 2 },
  { suffix: 'ic', syllables: 1, stressBefore: 1 },

  // -ity patterns: stress on syllable before -ity
  { suffix: 'ity', syllables: 2, stressBefore: 1 },
  { suffix: 'ety', syllables: 2, stressBefore: 1 },

  // -ious/-eous patterns: stress on syllable before
  { suffix: 'ious', syllables: 2, stressBefore: 1 },
  { suffix: 'eous', syllables: 2, stressBefore: 1 },

  // -ian/-ual patterns
  { suffix: 'ian', syllables: 1, stressBefore: 1 },
  { suffix: 'ual', syllables: 2, stressBefore: 1 },

  // -ology patterns: stress typically on 'ol'
  { suffix: 'ology', syllables: 3, stressBefore: 2 },
  { suffix: 'ography', syllables: 3, stressBefore: 2 },

  // -ation patterns
  { suffix: 'ation', syllables: 2, stressBefore: 1 },
]

/**
 * Prefixes that are typically unstressed.
 * Most English prefixes do not carry primary stress.
 */
const UNSTRESSED_PREFIXES = [
  'un',
  're',
  'de',
  'dis',
  'mis',
  'pre',
  'pro',
  'in',
  'im',
  'il',
  'ir',
  'en',
  'em',
  'non',
  'sub',
  'super',
  'anti',
  'auto',
  'bi',
  'co',
  'ex',
  'inter',
  'multi',
  'out',
  'over',
  'post',
  'semi',
  'trans',
  'under',
]

// Note: Silent e and -ed patterns are handled inline in estimateSyllableCount
// using character-by-character analysis for better accuracy.

/**
 * Normalizes a word for analysis.
 *
 * @param word - The word to normalize
 * @returns Normalized lowercase word
 */
function normalizeWord(word: string): string {
  return word.toLowerCase().trim()
}

/**
 * Counts syllables in a word using vowel pattern analysis.
 * This is a heuristic approach based on common English patterns.
 *
 * Algorithm:
 * 1. Count vowel groups (consecutive vowels count as one)
 * 2. Handle 'y' as vowel in appropriate positions
 * 3. Subtract for silent 'e' patterns
 * 4. Add for syllabic -ed, -es endings
 *
 * @param word - The word to count syllables for
 * @returns Estimated syllable count
 *
 * @example
 * estimateSyllableCount('hello') // 2
 * estimateSyllableCount('beautiful') // 3
 * estimateSyllableCount('cat') // 1
 */
export function estimateSyllableCount(word: string): number {
  const normalized = normalizeWord(word)

  if (normalized.length === 0) {
    console.debug('[stressEstimator] Empty word, returning 0 syllables')
    return 0
  }

  // Special case: single letter
  if (normalized.length === 1) {
    if (/[aeiouy]/.test(normalized)) {
      console.debug(
        `[stressEstimator] Single vowel letter "${normalized}", returning 1 syllable`
      )
      return 1
    }
    console.debug(
      `[stressEstimator] Single consonant letter "${normalized}", returning 0 syllables`
    )
    return 0
  }

  // Use a simpler approach: count vowel groups
  // A vowel group is one or more consecutive vowels (including y in vowel position)

  let syllables = 0
  let i = 0
  const vowels = 'aeiouy'

  while (i < normalized.length) {
    const char = normalized[i]
    const isVowel = vowels.includes(char)

    // Handle 'y' specially - it's only a vowel when not at word start
    // and when not followed by a vowel
    const isYAsVowel =
      char === 'y' && i > 0 && (i === normalized.length - 1 || !vowels.includes(normalized[i + 1]))

    if (isVowel || isYAsVowel) {
      syllables++

      // Skip the rest of the vowel group
      while (i < normalized.length) {
        const nextChar = normalized[i + 1]
        if (nextChar && 'aeiou'.includes(nextChar)) {
          i++
        } else {
          break
        }
      }
    }
    i++
  }

  // Apply adjustments for common patterns

  // Silent 'e' at end of word
  if (normalized.length > 2 && normalized.endsWith('e')) {
    const beforeE = normalized[normalized.length - 2]
    // Silent e if preceded by consonant (not vowel)
    if (!/[aeiouy]/.test(beforeE)) {
      // But keep syllable for -le after consonant (e.g., "table", "little")
      if (normalized.length > 3) {
        const ending = normalized.slice(-2)
        const twoBeforeE = normalized[normalized.length - 3]
        // -le after consonant is typically syllabic
        if (ending === 'le' && !/[aeiouy]/.test(twoBeforeE)) {
          // Keep the syllable from -le
        } else if (syllables > 1) {
          // Silent e, reduce count
          syllables--
        }
      } else if (syllables > 1) {
        syllables--
      }
    }
  }

  // -ed ending: only adds syllable after t or d
  if (normalized.endsWith('ed') && normalized.length > 2) {
    const beforeEd = normalized[normalized.length - 3]
    if (beforeEd !== 't' && beforeEd !== 'd') {
      // -ed doesn't add a syllable, but we already counted the 'e'
      if (syllables > 1) {
        syllables--
      }
    }
  }

  // -es ending: only syllabic after s, z, sh, ch, x, ge, ce
  if (normalized.endsWith('es') && normalized.length > 2) {
    const beforeEs = normalized[normalized.length - 3]
    const twoBeforeEs = normalized.length > 3 ? normalized.slice(-4, -2) : ''
    // Check if -es adds a syllable
    const esSyllabic =
      beforeEs === 's' ||
      beforeEs === 'z' ||
      beforeEs === 'x' ||
      twoBeforeEs === 'sh' ||
      twoBeforeEs === 'ch' ||
      twoBeforeEs === 'ge' ||
      twoBeforeEs === 'ce'

    if (!esSyllabic && syllables > 1) {
      // -es doesn't add a syllable
      syllables--
    }
  }

  // Ensure at least 1 syllable for any word with letters
  if (syllables < 1 && normalized.length > 0) {
    syllables = 1
  }

  console.debug(
    `[stressEstimator] Estimated syllable count for "${word}": ${syllables}`
  )
  return syllables
}

/**
 * Detects and returns information about any stress-shifting suffix.
 *
 * @param word - The word to check
 * @returns Suffix info or null if no stress-shifting suffix found
 */
function detectStressShiftingSuffix(
  word: string
): { suffix: string; syllables: number; stressBefore: number } | null {
  const normalized = normalizeWord(word)

  for (const suffixInfo of STRESS_SHIFTING_SUFFIXES) {
    if (normalized.endsWith(suffixInfo.suffix)) {
      return suffixInfo
    }
  }

  return null
}

/**
 * Detects and returns information about any unstressed suffix.
 *
 * @param word - The word to check
 * @returns Suffix info or null if no unstressed suffix found
 */
function detectUnstressedSuffix(
  word: string
): { suffix: string; syllables: number; stressed: boolean } | null {
  const normalized = normalizeWord(word)

  for (const suffixInfo of UNSTRESSED_SUFFIXES) {
    if (normalized.endsWith(suffixInfo.suffix)) {
      return suffixInfo
    }
  }

  return null
}

/**
 * Estimates the stress pattern for a word.
 *
 * Strategy:
 * 1. Count syllables
 * 2. Apply suffix rules for stress placement
 * 3. Apply default stress rules based on syllable count
 *
 * @param word - The word to estimate stress for
 * @returns Stress pattern string (e.g., "10" for trochaic, "01" for iambic)
 *
 * @example
 * estimateStressPattern('hello') // "01" (he-LLO)
 * estimateStressPattern('beautiful') // "100" (BEAU-ti-ful)
 * estimateStressPattern('nation') // "10" (NA-tion)
 */
export function estimateStressPattern(word: string): string {
  const normalized = normalizeWord(word)
  const syllableCount = estimateSyllableCount(normalized)

  if (syllableCount === 0) {
    console.debug(`[stressEstimator] No syllables in "${word}", returning ""`)
    return ''
  }

  // Single syllable: always stressed
  if (syllableCount === 1) {
    console.debug(`[stressEstimator] Single syllable "${word}", returning "1"`)
    return '1'
  }

  // Initialize stress array (default all unstressed)
  const stress: StressLevel[] = new Array(syllableCount).fill('0')

  // Check for stress-shifting suffix
  const stressShiftingSuffix = detectStressShiftingSuffix(normalized)
  if (stressShiftingSuffix) {
    // Place stress on the syllable before the suffix
    const stressPosition =
      syllableCount - stressShiftingSuffix.syllables - stressShiftingSuffix.stressBefore
    if (stressPosition >= 0) {
      stress[stressPosition] = '1'
      console.debug(
        `[stressEstimator] Found stress-shifting suffix "${stressShiftingSuffix.suffix}" in "${word}", stress at position ${stressPosition}`
      )
      return stress.join('')
    }
  }

  // Apply default stress rules based on syllable count and word patterns
  const stressPattern = applyDefaultStressRules(normalized, syllableCount, stress)

  console.debug(
    `[stressEstimator] Estimated stress pattern for "${word}": ${stressPattern}`
  )
  return stressPattern
}

/**
 * Applies default stress rules based on English phonological patterns.
 *
 * @param word - Normalized word
 * @param syllableCount - Number of syllables
 * @param stress - Mutable stress array
 * @returns Stress pattern string
 */
function applyDefaultStressRules(
  word: string,
  syllableCount: number,
  stress: StressLevel[]
): string {
  // Two syllables: usually initial stress in English (trochaic)
  // Exceptions: many Romance loanwords have final stress
  if (syllableCount === 2) {
    // Check for common final-stress patterns
    const finalStressPatterns = [
      /oo$/, // bamboo, taboo
      /ee$/, // degree, trainee
      /ine$/, // machine, routine
      /ade$/, // parade, charade
      /ete$/, // compete, complete
      /ute$/, // compute, pollute
      /ique$/, // unique, antique
    ]

    const hasFinalStress = finalStressPatterns.some((pattern) =>
      pattern.test(word)
    )

    if (hasFinalStress) {
      stress[1] = '1'
    } else {
      // Default: initial stress
      stress[0] = '1'
    }
    return stress.join('')
  }

  // Three or more syllables: more complex rules
  if (syllableCount >= 3) {
    // Check for common prefixes (usually unstressed)
    let prefixLength = 0
    for (const prefix of UNSTRESSED_PREFIXES) {
      if (word.startsWith(prefix) && word.length > prefix.length) {
        prefixLength = estimateSyllableCount(prefix)
        break
      }
    }

    // Check for common unstressed suffixes
    const unstressedSuffix = detectUnstressedSuffix(word)

    if (unstressedSuffix && unstressedSuffix.syllables > 0) {
      // Mark suffix syllables as unstressed and stress the one before
      const stressPosition = syllableCount - unstressedSuffix.syllables - 1
      if (stressPosition >= 0 && stressPosition >= prefixLength) {
        stress[stressPosition] = '1'
        return stress.join('')
      }
    }

    // Default: stress the antepenultimate (third from last) syllable
    // This is the Latin stress rule, common in English for 3+ syllables
    if (syllableCount >= 3) {
      const antepenultPosition = syllableCount - 3
      if (antepenultPosition >= prefixLength) {
        stress[antepenultPosition] = '1'
      } else if (prefixLength < syllableCount - 1) {
        // Stress the syllable after the prefix
        stress[prefixLength] = '1'
      } else {
        // Fallback: penultimate stress
        stress[syllableCount - 2] = '1'
      }
    }

    return stress.join('')
  }

  return stress.join('')
}

/**
 * Result of stress estimation including confidence level.
 */
export interface StressEstimation {
  /** The word that was analyzed */
  word: string
  /** Estimated syllable count */
  syllableCount: number
  /** Estimated stress pattern */
  stressPattern: string
  /** Confidence in the estimation (0.0-1.0) */
  confidence: number
  /** Method used for estimation */
  method: 'suffix_rule' | 'default_rule' | 'single_syllable'
  /** Detected suffix that influenced stress, if any */
  detectedSuffix?: string
}

/**
 * Estimates stress with confidence information.
 *
 * @param word - The word to estimate stress for
 * @returns StressEstimation with pattern and confidence
 *
 * @example
 * estimateStressWithConfidence('nation')
 * // { word: 'nation', syllableCount: 2, stressPattern: '10',
 * //   confidence: 0.9, method: 'suffix_rule', detectedSuffix: 'tion' }
 */
export function estimateStressWithConfidence(word: string): StressEstimation {
  const normalized = normalizeWord(word)
  const syllableCount = estimateSyllableCount(normalized)
  const stressPattern = estimateStressPattern(normalized)

  // Determine confidence based on method used
  let confidence: number
  let method: StressEstimation['method']
  let detectedSuffix: string | undefined

  const stressShiftingSuffix = detectStressShiftingSuffix(normalized)
  const unstressedSuffix = detectUnstressedSuffix(normalized)

  if (syllableCount === 1) {
    confidence = 1.0
    method = 'single_syllable'
  } else if (stressShiftingSuffix) {
    confidence = 0.9 // High confidence for known stress-shifting suffixes
    method = 'suffix_rule'
    detectedSuffix = stressShiftingSuffix.suffix
  } else if (unstressedSuffix) {
    confidence = 0.8 // Good confidence for unstressed suffix patterns
    method = 'suffix_rule'
    detectedSuffix = unstressedSuffix.suffix
  } else {
    confidence = 0.6 // Lower confidence for default rules
    method = 'default_rule'
  }

  const result: StressEstimation = {
    word,
    syllableCount,
    stressPattern,
    confidence,
    method,
  }

  if (detectedSuffix) {
    result.detectedSuffix = detectedSuffix
  }

  console.debug(
    `[stressEstimator] Stress estimation for "${word}":`,
    result
  )
  return result
}

/**
 * Generates a phonetic analysis for an unknown word using estimation.
 * This provides a complete PhoneticAnalysis object compatible with
 * the CMU dictionary format, but with estimated values.
 *
 * @param word - The word to analyze
 * @returns PhoneticAnalysis with estimated values
 *
 * @example
 * analyzeUnknownWord('xyzzy')
 * // { word: 'xyzzy', phonemes: [], syllableCount: 2,
 * //   stressPattern: '10', inDictionary: false }
 */
export function analyzeUnknownWord(word: string): PhoneticAnalysis {
  const estimation = estimateStressWithConfidence(word)

  const analysis: PhoneticAnalysis = {
    word,
    phonemes: [], // Empty - we don't have actual phoneme data
    syllableCount: estimation.syllableCount,
    stressPattern: estimation.stressPattern,
    inDictionary: false,
  }

  console.debug(`[stressEstimator] Unknown word analysis for "${word}":`, analysis)
  return analysis
}

/**
 * Gets stress for a word, falling back to estimation if not in dictionary.
 * This is the main integration point with the CMU dictionary module.
 *
 * @param word - The word to get stress for
 * @param cmuStress - Result from CMU dictionary lookup (null if not found)
 * @returns Stress pattern string
 *
 * @example
 * // If word is in CMU dictionary:
 * getStressWithFallback('hello', '01') // '01' (from CMU)
 *
 * // If word is not in CMU dictionary:
 * getStressWithFallback('xyzzy', null) // '10' (estimated)
 */
export function getStressWithFallback(
  word: string,
  cmuStress: string | null
): string {
  if (cmuStress !== null) {
    console.debug(
      `[stressEstimator] Using CMU stress for "${word}": ${cmuStress}`
    )
    return cmuStress
  }

  const estimated = estimateStressPattern(word)
  console.debug(
    `[stressEstimator] Using estimated stress for "${word}": ${estimated}`
  )
  return estimated
}

/**
 * Gets syllable count for a word, falling back to estimation if not in dictionary.
 *
 * @param word - The word to count syllables for
 * @param cmuSyllables - Result from CMU dictionary lookup (null if not found)
 * @returns Syllable count
 *
 * @example
 * getSyllableCountWithFallback('hello', 2) // 2 (from CMU)
 * getSyllableCountWithFallback('xyzzy', null) // 2 (estimated)
 */
export function getSyllableCountWithFallback(
  word: string,
  cmuSyllables: number | null
): number {
  if (cmuSyllables !== null) {
    console.debug(
      `[stressEstimator] Using CMU syllable count for "${word}": ${cmuSyllables}`
    )
    return cmuSyllables
  }

  const estimated = estimateSyllableCount(word)
  console.debug(
    `[stressEstimator] Using estimated syllable count for "${word}": ${estimated}`
  )
  return estimated
}
