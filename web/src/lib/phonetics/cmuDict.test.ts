/**
 * CMU Pronouncing Dictionary Module Tests
 *
 * Comprehensive tests for phonetic word lookup functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  // Constants
  ARPABET_VOWELS,
  ARPABET_CONSONANTS,
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

// Suppress console.debug output during tests
beforeEach(() => {
  vi.spyOn(console, 'debug').mockImplementation(() => {})
})

describe('Constants', () => {
  describe('ARPABET_VOWELS', () => {
    it('should contain all 15 ARPAbet vowel phonemes', () => {
      expect(ARPABET_VOWELS).toHaveLength(15)
    })

    it('should include common vowels', () => {
      expect(ARPABET_VOWELS).toContain('AA')
      expect(ARPABET_VOWELS).toContain('IY')
      expect(ARPABET_VOWELS).toContain('UW')
      expect(ARPABET_VOWELS).toContain('AE')
    })
  })

  describe('ARPABET_CONSONANTS', () => {
    it('should contain all 24 ARPAbet consonant phonemes', () => {
      expect(ARPABET_CONSONANTS).toHaveLength(24)
    })

    it('should include common consonants', () => {
      expect(ARPABET_CONSONANTS).toContain('B')
      expect(ARPABET_CONSONANTS).toContain('K')
      expect(ARPABET_CONSONANTS).toContain('S')
      expect(ARPABET_CONSONANTS).toContain('TH')
    })
  })
})

describe('isVowel', () => {
  it('should return true for vowel phonemes without stress markers', () => {
    expect(isVowel('AA')).toBe(true)
    expect(isVowel('IY')).toBe(true)
    expect(isVowel('EH')).toBe(true)
  })

  it('should return true for vowel phonemes with stress markers', () => {
    expect(isVowel('AA0')).toBe(true)
    expect(isVowel('AA1')).toBe(true)
    expect(isVowel('AA2')).toBe(true)
    expect(isVowel('IY1')).toBe(true)
    expect(isVowel('EH0')).toBe(true)
  })

  it('should return false for consonant phonemes', () => {
    expect(isVowel('B')).toBe(false)
    expect(isVowel('K')).toBe(false)
    expect(isVowel('HH')).toBe(false)
    expect(isVowel('TH')).toBe(false)
  })

  it('should return false for invalid phonemes', () => {
    expect(isVowel('')).toBe(false)
    expect(isVowel('XX')).toBe(false)
    expect(isVowel('123')).toBe(false)
  })
})

describe('isConsonant', () => {
  it('should return true for consonant phonemes', () => {
    expect(isConsonant('B')).toBe(true)
    expect(isConsonant('K')).toBe(true)
    expect(isConsonant('HH')).toBe(true)
    expect(isConsonant('TH')).toBe(true)
    expect(isConsonant('ZH')).toBe(true)
  })

  it('should return false for vowel phonemes', () => {
    expect(isConsonant('AA')).toBe(false)
    expect(isConsonant('IY')).toBe(false)
    expect(isConsonant('AA1')).toBe(false)
  })

  it('should return false for vowels with stress markers', () => {
    expect(isConsonant('AA0')).toBe(false)
    expect(isConsonant('IY1')).toBe(false)
  })
})

describe('getPhonemeStress', () => {
  it('should return stress level for stressed vowels', () => {
    expect(getPhonemeStress('AA0')).toBe('0')
    expect(getPhonemeStress('AA1')).toBe('1')
    expect(getPhonemeStress('AA2')).toBe('2')
    expect(getPhonemeStress('IY1')).toBe('1')
  })

  it('should return null for vowels without stress markers', () => {
    expect(getPhonemeStress('AA')).toBe(null)
    expect(getPhonemeStress('IY')).toBe(null)
  })

  it('should return null for consonants', () => {
    expect(getPhonemeStress('B')).toBe(null)
    expect(getPhonemeStress('K')).toBe(null)
    expect(getPhonemeStress('TH')).toBe(null)
  })
})

describe('lookupWord', () => {
  it('should return phonemes for common words', () => {
    const hello = lookupWord('hello')
    expect(hello).not.toBeNull()
    expect(hello).toBeInstanceOf(Array)
    expect(hello!.length).toBeGreaterThan(0)
  })

  it('should return phonemes for "cat"', () => {
    const cat = lookupWord('cat')
    expect(cat).not.toBeNull()
    // CAT should be K AE1 T
    expect(cat).toContain('K')
    expect(cat!.some((p) => p.startsWith('AE'))).toBe(true)
    expect(cat).toContain('T')
  })

  it('should return null for unknown words', () => {
    expect(lookupWord('xyzzyplugh')).toBeNull()
    expect(lookupWord('asdfghjkl')).toBeNull()
  })

  it('should be case-insensitive', () => {
    const lower = lookupWord('hello')
    const upper = lookupWord('HELLO')
    const mixed = lookupWord('HeLLo')

    expect(lower).toEqual(upper)
    expect(lower).toEqual(mixed)
  })

  it('should handle words with leading/trailing whitespace', () => {
    const normal = lookupWord('hello')
    const padded = lookupWord('  hello  ')

    expect(normal).toEqual(padded)
  })

  it('should return phonemes for single-letter words', () => {
    const i = lookupWord('I')
    expect(i).not.toBeNull()

    const a = lookupWord('a')
    expect(a).not.toBeNull()
  })
})

describe('lookupAllPronunciations', () => {
  it('should return LookupResult with found=true for known words', () => {
    const result = lookupAllPronunciations('hello')

    expect(result.word).toBe('hello')
    expect(result.found).toBe(true)
    expect(result.pronunciations.length).toBeGreaterThan(0)
  })

  it('should return LookupResult with found=false for unknown words', () => {
    const result = lookupAllPronunciations('xyzzyplugh')

    expect(result.word).toBe('xyzzyplugh')
    expect(result.found).toBe(false)
    expect(result.pronunciations).toHaveLength(0)
  })

  it('should include phoneme arrays in pronunciations', () => {
    const result = lookupAllPronunciations('cat')

    expect(result.pronunciations[0]).toBeInstanceOf(Array)
    expect(result.pronunciations[0].length).toBeGreaterThan(0)
  })
})

describe('hasWord', () => {
  it('should return true for common words', () => {
    expect(hasWord('hello')).toBe(true)
    expect(hasWord('world')).toBe(true)
    expect(hasWord('cat')).toBe(true)
    expect(hasWord('beautiful')).toBe(true)
  })

  it('should return false for unknown words', () => {
    expect(hasWord('xyzzyplugh')).toBe(false)
    expect(hasWord('asdfghjkl')).toBe(false)
  })

  it('should be case-insensitive', () => {
    expect(hasWord('HELLO')).toBe(true)
    expect(hasWord('Hello')).toBe(true)
    expect(hasWord('hElLo')).toBe(true)
  })

  it('should return true for single-letter words', () => {
    expect(hasWord('I')).toBe(true)
    expect(hasWord('a')).toBe(true)
  })
})

describe('getStress', () => {
  it('should return stress pattern for common words', () => {
    const helloStress = getStress('hello')
    expect(helloStress).not.toBeNull()
    expect(helloStress).toHaveLength(2) // 2 syllables
  })

  it('should return pattern with 0, 1, and 2 characters only', () => {
    const stress = getStress('beautiful')
    expect(stress).not.toBeNull()
    expect(stress).toMatch(/^[012]+$/)
  })

  it('should return null for unknown words', () => {
    expect(getStress('xyzzyplugh')).toBeNull()
  })

  it('should return stress for single-syllable words', () => {
    const cat = getStress('cat')
    expect(cat).not.toBeNull()
    expect(cat).toHaveLength(1)
  })

  it('should handle words with primary stress', () => {
    const stress = getStress('hello')
    expect(stress).not.toBeNull()
    expect(stress).toContain('1') // Should have primary stress
  })
})

describe('getSyllableCount', () => {
  it('should return 1 for monosyllabic words', () => {
    expect(getSyllableCount('cat')).toBe(1)
    expect(getSyllableCount('dog')).toBe(1)
    expect(getSyllableCount('hat')).toBe(1)
    expect(getSyllableCount('I')).toBe(1)
  })

  it('should return 2 for disyllabic words', () => {
    expect(getSyllableCount('hello')).toBe(2)
    expect(getSyllableCount('python')).toBe(2)
    expect(getSyllableCount('music')).toBe(2)
  })

  it('should return 3+ for polysyllabic words', () => {
    expect(getSyllableCount('beautiful')).toBe(3)
    expect(getSyllableCount('computer')).toBe(3)
    expect(getSyllableCount('understanding')).toBe(4)
  })

  it('should return null for unknown words', () => {
    expect(getSyllableCount('xyzzyplugh')).toBeNull()
  })

  it('should be case-insensitive', () => {
    expect(getSyllableCount('HELLO')).toBe(getSyllableCount('hello'))
    expect(getSyllableCount('BeAuTiFuL')).toBe(getSyllableCount('beautiful'))
  })
})

describe('analyzeWord', () => {
  it('should return complete analysis for known words', () => {
    const analysis = analyzeWord('hello')

    expect(analysis.word).toBe('hello')
    expect(analysis.phonemes.length).toBeGreaterThan(0)
    expect(analysis.syllableCount).toBe(2)
    expect(analysis.stressPattern).toHaveLength(2)
    expect(analysis.inDictionary).toBe(true)
  })

  it('should return analysis with inDictionary=false for unknown words', () => {
    const analysis = analyzeWord('xyzzyplugh')

    expect(analysis.word).toBe('xyzzyplugh')
    expect(analysis.phonemes).toHaveLength(0)
    expect(analysis.syllableCount).toBe(0)
    expect(analysis.stressPattern).toBe('')
    expect(analysis.inDictionary).toBe(false)
  })

  it('should correctly analyze "cat"', () => {
    const analysis = analyzeWord('cat')

    expect(analysis.syllableCount).toBe(1)
    expect(analysis.stressPattern).toHaveLength(1)
    expect(analysis.inDictionary).toBe(true)
  })

  it('should correctly analyze "beautiful"', () => {
    const analysis = analyzeWord('beautiful')

    expect(analysis.syllableCount).toBe(3)
    expect(analysis.stressPattern).toHaveLength(3)
    expect(analysis.inDictionary).toBe(true)
  })
})

describe('extractVowels', () => {
  it('should extract only vowel phonemes', () => {
    const phonemes = ['HH', 'AH0', 'L', 'OW1']
    const vowels = extractVowels(phonemes)

    expect(vowels).toHaveLength(2)
    expect(vowels).toContain('AH0')
    expect(vowels).toContain('OW1')
  })

  it('should return empty array for consonant-only input', () => {
    const phonemes = ['K', 'S', 'T']
    const vowels = extractVowels(phonemes)

    expect(vowels).toHaveLength(0)
  })

  it('should handle empty array', () => {
    expect(extractVowels([])).toHaveLength(0)
  })
})

describe('extractConsonants', () => {
  it('should extract only consonant phonemes', () => {
    const phonemes = ['HH', 'AH0', 'L', 'OW1']
    const consonants = extractConsonants(phonemes)

    expect(consonants).toHaveLength(2)
    expect(consonants).toContain('HH')
    expect(consonants).toContain('L')
  })

  it('should return empty array for vowel-only input', () => {
    const phonemes = ['AH0', 'IY1']
    const consonants = extractConsonants(phonemes)

    expect(consonants).toHaveLength(0)
  })

  it('should handle empty array', () => {
    expect(extractConsonants([])).toHaveLength(0)
  })
})

describe('getRhymingPart', () => {
  it('should return phonemes from last stressed vowel to end', () => {
    const rhymingPart = getRhymingPart('cat')
    expect(rhymingPart).not.toBeNull()
    // Should include the stressed vowel and final consonant
    expect(rhymingPart!.some((p) => isVowel(p))).toBe(true)
  })

  it('should return null for unknown words', () => {
    expect(getRhymingPart('xyzzyplugh')).toBeNull()
  })

  it('should work for single-syllable words', () => {
    const rhyme = getRhymingPart('hat')
    expect(rhyme).not.toBeNull()
    expect(rhyme!.length).toBeGreaterThan(0)
  })

  it('should work for multi-syllable words', () => {
    const rhyme = getRhymingPart('hello')
    expect(rhyme).not.toBeNull()
    expect(rhyme!.length).toBeGreaterThan(0)
  })
})

describe('doWordsRhyme', () => {
  it('should return true for perfect rhymes', () => {
    expect(doWordsRhyme('cat', 'hat')).toBe(true)
    expect(doWordsRhyme('bat', 'mat')).toBe(true)
    expect(doWordsRhyme('day', 'say')).toBe(true)
    expect(doWordsRhyme('night', 'light')).toBe(true)
  })

  it('should return false for non-rhyming words', () => {
    expect(doWordsRhyme('cat', 'dog')).toBe(false)
    expect(doWordsRhyme('hello', 'world')).toBe(false)
  })

  it('should return false if either word is unknown', () => {
    expect(doWordsRhyme('cat', 'xyzzyplugh')).toBe(false)
    expect(doWordsRhyme('xyzzyplugh', 'cat')).toBe(false)
    expect(doWordsRhyme('xyzzyplugh', 'asdfghjkl')).toBe(false)
  })

  it('should be case-insensitive', () => {
    expect(doWordsRhyme('CAT', 'hat')).toBe(true)
    expect(doWordsRhyme('cat', 'HAT')).toBe(true)
  })

  it('should handle words that rhyme with themselves', () => {
    expect(doWordsRhyme('cat', 'cat')).toBe(true)
  })
})

describe('Edge Cases', () => {
  it('should handle empty strings', () => {
    expect(lookupWord('')).toBeNull()
    expect(hasWord('')).toBe(false)
    expect(getStress('')).toBeNull()
    expect(getSyllableCount('')).toBeNull()
  })

  it('should handle words with apostrophes (contractions)', () => {
    // Note: CMU dict may or may not have contractions
    const dont = lookupWord("don't")
    // Just check it doesn't crash - result depends on dictionary
    expect(dont === null || Array.isArray(dont)).toBe(true)
  })

  it('should handle hyphenated words', () => {
    // Note: CMU dict typically doesn't have hyphenated words
    const selfAware = lookupWord('self-aware')
    expect(selfAware === null || Array.isArray(selfAware)).toBe(true)
  })

  it('should handle numbers as strings', () => {
    // CMU dict may have number words
    const one = lookupWord('one')
    expect(one).not.toBeNull()

    const two = lookupWord('two')
    expect(two).not.toBeNull()
  })
})

describe('Integration: Syllable count matches phoneme vowels', () => {
  const testWords = ['hello', 'world', 'beautiful', 'computer', 'cat', 'dog']

  testWords.forEach((word) => {
    it(`should have syllable count equal to vowel count for "${word}"`, () => {
      const phonemes = lookupWord(word)
      const syllableCount = getSyllableCount(word)

      if (phonemes && syllableCount !== null) {
        const vowelCount = phonemes.filter((p) => isVowel(p)).length
        expect(syllableCount).toBe(vowelCount)
      }
    })
  })
})

describe('Integration: Stress pattern length matches syllable count', () => {
  const testWords = ['hello', 'beautiful', 'understand', 'computer', 'I', 'a']

  testWords.forEach((word) => {
    it(`should have stress pattern length equal to syllable count for "${word}"`, () => {
      const stress = getStress(word)
      const syllables = getSyllableCount(word)

      if (stress !== null && syllables !== null) {
        expect(stress.length).toBe(syllables)
      }
    })
  })
})
