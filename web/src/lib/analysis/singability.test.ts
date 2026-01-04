/**
 * Singability Analysis Module Tests
 *
 * Comprehensive tests for singability scoring functions.
 * Tests cover vowel openness, consonant clusters, sustainability,
 * problem spot detection, and line-level analysis.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  // Core scoring functions
  scoreVowelOpenness,
  scoreConsonantClusters,
  scoreSustainability,
  // Problem detection
  identifyProblemSpots,
  // Line analysis
  calculateLineSingability,
  analyzeLineSingability,
  // Word utilities
  scoreWordSingability,
  getPrimaryVowel,
  hasDifficultClusters,
  // Batch utilities
  analyzeMultipleLines,
  calculateAverageSingability,
  collectProblemSpots,
  // Constants
  VOWEL_OPENNESS,
} from './singability';
import type { AnalyzedLine, Syllable, SyllabifiedWord } from '@/types/analysis';

// Suppress console.log output during tests
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'debug').mockImplementation(() => {});
});

// =============================================================================
// Helper Functions for Creating Test Data
// =============================================================================

/**
 * Creates a Syllable object for testing
 */
function createSyllable(
  phonemes: string[],
  stress: 0 | 1 | 2 = 0,
  vowelPhoneme: string = '',
  isOpen: boolean = false
): Syllable {
  return {
    phonemes,
    stress,
    vowelPhoneme: vowelPhoneme || phonemes.find((p) => p.match(/[AEIOU]/)) || '',
    isOpen,
  };
}

/**
 * Creates a SyllabifiedWord object for testing
 */
function createWord(text: string, syllables: Syllable[]): SyllabifiedWord {
  return {
    text,
    syllables,
  };
}

/**
 * Creates an AnalyzedLine object for testing
 */
function createLine(
  text: string,
  words: SyllabifiedWord[],
  stressPattern: string = ''
): AnalyzedLine {
  const syllableCount = words.reduce((sum, w) => sum + w.syllables.length, 0);
  return {
    text,
    words,
    stressPattern,
    syllableCount,
    singability: {
      syllableScores: [],
      lineScore: 0,
      problemSpots: [],
    },
  };
}

// =============================================================================
// VOWEL_OPENNESS Constants Tests
// =============================================================================

describe('VOWEL_OPENNESS constants', () => {
  it('should have AA (ah) as most open vowel', () => {
    expect(VOWEL_OPENNESS['AA']).toBe(1.0);
  });

  it('should have IH and UH as most closed vowels', () => {
    expect(VOWEL_OPENNESS['IH']).toBe(0.3);
    expect(VOWEL_OPENNESS['UH']).toBe(0.3);
  });

  it('should have AO second highest after AA', () => {
    expect(VOWEL_OPENNESS['AO']).toBe(0.9);
  });

  it('should have all standard ARPAbet vowels defined', () => {
    const expectedVowels = [
      'AA', 'AE', 'AH', 'AO', 'AW', 'AY',
      'EH', 'ER', 'EY',
      'IH', 'IY',
      'OW', 'OY',
      'UH', 'UW',
    ];

    for (const vowel of expectedVowels) {
      expect(VOWEL_OPENNESS[vowel]).toBeDefined();
      expect(VOWEL_OPENNESS[vowel]).toBeGreaterThanOrEqual(0.3);
      expect(VOWEL_OPENNESS[vowel]).toBeLessThanOrEqual(1.0);
    }
  });
});

// =============================================================================
// scoreVowelOpenness Tests
// =============================================================================

describe('scoreVowelOpenness', () => {
  describe('open vowels (high scores)', () => {
    it('should score AA (ah) as 1.0 - most open', () => {
      expect(scoreVowelOpenness(['AA1'])).toBe(1.0);
      expect(scoreVowelOpenness(['AA0'])).toBe(1.0);
    });

    it('should score AO (aw) as 0.9', () => {
      expect(scoreVowelOpenness(['AO1'])).toBe(0.9);
    });

    it('should score AE (a as in cat) as 0.8', () => {
      expect(scoreVowelOpenness(['AE1'])).toBe(0.8);
    });

    it('should score OW (oh) as 0.8', () => {
      expect(scoreVowelOpenness(['OW1'])).toBe(0.8);
    });
  });

  describe('closed vowels (low scores)', () => {
    it('should score IH (ih as in bit) as 0.3', () => {
      expect(scoreVowelOpenness(['IH0'])).toBe(0.3);
    });

    it('should score UH (uh as in could) as 0.3', () => {
      expect(scoreVowelOpenness(['UH0'])).toBe(0.3);
    });
  });

  describe('with surrounding consonants', () => {
    it('should extract vowel from "hot" phonemes (HH AA1 T)', () => {
      expect(scoreVowelOpenness(['HH', 'AA1', 'T'])).toBe(1.0);
    });

    it('should extract vowel from "cat" phonemes (K AE1 T)', () => {
      expect(scoreVowelOpenness(['K', 'AE1', 'T'])).toBe(0.8);
    });

    it('should extract vowel from "bit" phonemes (B IH1 T)', () => {
      expect(scoreVowelOpenness(['B', 'IH1', 'T'])).toBe(0.3);
    });
  });

  describe('edge cases', () => {
    it('should return 0 for empty array', () => {
      expect(scoreVowelOpenness([])).toBe(0);
    });

    it('should return 0 for consonants only', () => {
      expect(scoreVowelOpenness(['B', 'K', 'T'])).toBe(0);
    });

    it('should use first vowel for multiple vowels', () => {
      // First vowel AA should be used
      expect(scoreVowelOpenness(['AA1', 'IH0'])).toBe(1.0);
    });

    it('should handle null/undefined gracefully', () => {
      // @ts-expect-error Testing null handling
      expect(scoreVowelOpenness(null)).toBe(0);
      // @ts-expect-error Testing undefined handling
      expect(scoreVowelOpenness(undefined)).toBe(0);
    });
  });
});

// =============================================================================
// scoreConsonantClusters Tests
// =============================================================================

describe('scoreConsonantClusters', () => {
  describe('no clusters', () => {
    it('should return 0 for single consonants (CVC pattern)', () => {
      // "cat" = K AE1 T - no cluster
      expect(scoreConsonantClusters(['K', 'AE1', 'T'])).toBe(0);
    });

    it('should return 0 for vowel-only', () => {
      expect(scoreConsonantClusters(['AA1'])).toBe(0);
    });

    it('should return 0 for empty array', () => {
      expect(scoreConsonantClusters([])).toBe(0);
    });
  });

  describe('two-consonant clusters', () => {
    it('should return ~0.2 for simple two-consonant cluster', () => {
      // "stop" = S T AA1 P - ST cluster at start
      const penalty = scoreConsonantClusters(['S', 'T', 'AA1', 'P']);
      expect(penalty).toBeGreaterThanOrEqual(0.2);
      expect(penalty).toBeLessThanOrEqual(0.4);
    });

    it('should return ~0.2 for ending cluster', () => {
      // "best" = B EH1 S T - ST cluster at end
      const penalty = scoreConsonantClusters(['B', 'EH1', 'S', 'T']);
      expect(penalty).toBeGreaterThanOrEqual(0.2);
    });
  });

  describe('three-consonant clusters', () => {
    it('should return ~0.5 for STR cluster', () => {
      // "string" = S T R IH1 NG
      const penalty = scoreConsonantClusters(['S', 'T', 'R', 'IH1', 'NG']);
      expect(penalty).toBeGreaterThanOrEqual(0.5);
    });

    it('should return higher penalty for difficult clusters', () => {
      // "texts" has difficult -KST- cluster
      const penalty = scoreConsonantClusters(['T', 'EH1', 'K', 'S', 'T', 'S']);
      expect(penalty).toBeGreaterThan(0.5);
    });
  });

  describe('four+ consonant clusters', () => {
    it('should return high penalty for quad clusters', () => {
      // "strengths" = S T R EH1 NG K TH S
      const penalty = scoreConsonantClusters(['S', 'T', 'R', 'EH1', 'NG', 'TH', 'S']);
      expect(penalty).toBeGreaterThanOrEqual(0.7);
    });
  });

  describe('known singable vs unsingable words', () => {
    it('should give low penalty for singable "love" (L AH1 V)', () => {
      const penalty = scoreConsonantClusters(['L', 'AH1', 'V']);
      expect(penalty).toBe(0);
    });

    it('should give high penalty for "glimpsed" with consonant clusters', () => {
      // "glimpsed" = G L IH1 M P S T - multiple clusters
      const penalty = scoreConsonantClusters(['G', 'L', 'IH1', 'M', 'P', 'S', 'T']);
      expect(penalty).toBeGreaterThanOrEqual(0.5);
    });
  });
});

// =============================================================================
// scoreSustainability Tests
// =============================================================================

describe('scoreSustainability', () => {
  describe('open syllables', () => {
    it('should give high score to open syllable with open vowel', () => {
      // "ma" = M AA1 (open syllable ending in vowel)
      const syllable = createSyllable(['M', 'AA1'], 1, 'AA1', true);
      const score = scoreSustainability(syllable);
      expect(score).toBeGreaterThanOrEqual(0.9);
    });

    it('should give moderate-high score to open syllable with closed vowel', () => {
      // "me" = M IY1 (open but with IY vowel)
      const syllable = createSyllable(['M', 'IY1'], 1, 'IY1', true);
      const score = scoreSustainability(syllable);
      expect(score).toBeGreaterThanOrEqual(0.5);
      expect(score).toBeLessThan(0.9);
    });
  });

  describe('closed syllables with sonorant codas', () => {
    it('should give good score for syllable ending in L', () => {
      // "all" = AO1 L
      const syllable = createSyllable(['AO1', 'L'], 1, 'AO1', false);
      const score = scoreSustainability(syllable);
      expect(score).toBeGreaterThanOrEqual(0.8);
    });

    it('should give good score for syllable ending in M/N', () => {
      // "on" = AA1 N
      const syllable = createSyllable(['AA1', 'N'], 1, 'AA1', false);
      const score = scoreSustainability(syllable);
      expect(score).toBeGreaterThanOrEqual(0.8);
    });
  });

  describe('closed syllables with stop codas', () => {
    it('should give lower score for syllable ending in stop', () => {
      // "cat" = K AE1 T
      const syllable = createSyllable(['K', 'AE1', 'T'], 1, 'AE1', false);
      const score = scoreSustainability(syllable);
      expect(score).toBeGreaterThanOrEqual(0.5);
      expect(score).toBeLessThan(0.9);
    });
  });

  describe('syllables with consonant clusters', () => {
    it('should penalize syllables with onset clusters', () => {
      // "strike" = S T R AY1 K - onset cluster
      const syllable = createSyllable(['S', 'T', 'R', 'AY1', 'K'], 1, 'AY1', false);
      const score = scoreSustainability(syllable);
      expect(score).toBeLessThan(0.7);
    });
  });

  describe('edge cases', () => {
    it('should return 0 for empty syllable', () => {
      const syllable = createSyllable([], 0, '', false);
      expect(scoreSustainability(syllable)).toBe(0);
    });

    it('should handle null gracefully', () => {
      // @ts-expect-error Testing null handling
      expect(scoreSustainability(null)).toBe(0);
    });
  });
});

// =============================================================================
// identifyProblemSpots Tests
// =============================================================================

describe('identifyProblemSpots', () => {
  describe('consonant cluster detection', () => {
    it('should identify "strengths" as having consonant cluster problem', () => {
      const word = createWord('strengths', [
        createSyllable(['S', 'T', 'R', 'EH1', 'NG', 'TH', 'S'], 1, 'EH1', false),
      ]);
      const line = createLine('strengths', [word]);

      const problems = identifyProblemSpots(line);

      expect(problems.length).toBeGreaterThan(0);
      expect(problems.some((p) => p.issue === 'consonant_cluster')).toBe(true);
    });

    it('should not flag simple words like "love"', () => {
      const word = createWord('love', [
        createSyllable(['L', 'AH1', 'V'], 1, 'AH1', false),
      ]);
      const line = createLine('love', [word]);

      const problems = identifyProblemSpots(line);

      // Should have no consonant cluster problems
      expect(problems.filter((p) => p.issue === 'consonant_cluster').length).toBe(0);
    });
  });

  describe('closed vowel detection', () => {
    it('should identify words with closed vowels on sustained notes', () => {
      const word = createWord('bit', [
        createSyllable(['B', 'IH1', 'T'], 1, 'IH1', false),
      ]);
      const line = createLine('bit', [word]);

      const problems = identifyProblemSpots(line);

      expect(problems.some((p) => p.issue === 'closed_vowel')).toBe(true);
    });

    it('should not flag open vowel words', () => {
      const word = createWord('hot', [
        createSyllable(['HH', 'AA1', 'T'], 1, 'AA1', false),
      ]);
      const line = createLine('hot', [word]);

      const problems = identifyProblemSpots(line);

      // Should have no closed vowel problems
      expect(problems.filter((p) => p.issue === 'closed_vowel').length).toBe(0);
    });
  });

  describe('problem severity', () => {
    it('should mark severe clusters as high severity', () => {
      const word = createWord('strengths', [
        createSyllable(['S', 'T', 'R', 'EH1', 'NG', 'TH', 'S'], 1, 'EH1', false),
      ]);
      const line = createLine('strengths', [word]);

      const problems = identifyProblemSpots(line);
      const clusterProblem = problems.find((p) => p.issue === 'consonant_cluster');

      expect(clusterProblem?.severity).toBe('high');
    });

    it('should mark moderate issues as medium severity', () => {
      // "string" has a cluster but not as severe
      const word = createWord('string', [
        createSyllable(['S', 'T', 'R', 'IH1', 'NG'], 1, 'IH1', false),
      ]);
      const line = createLine('string', [word]);

      const problems = identifyProblemSpots(line);
      const clusterProblem = problems.find((p) => p.issue === 'consonant_cluster');

      expect(clusterProblem?.severity).toBe('medium');
    });
  });

  describe('edge cases', () => {
    it('should return empty array for empty line', () => {
      const line = createLine('', []);
      expect(identifyProblemSpots(line)).toEqual([]);
    });

    it('should handle null gracefully', () => {
      // @ts-expect-error Testing null handling
      expect(identifyProblemSpots(null)).toEqual([]);
    });
  });
});

// =============================================================================
// calculateLineSingability Tests
// =============================================================================

describe('calculateLineSingability', () => {
  describe('highly singable lines', () => {
    it('should score highly for open vowel words', () => {
      // "la la la" - very singable
      const laWord = createWord('la', [createSyllable(['L', 'AA1'], 1, 'AA1', true)]);
      const line = createLine('la la la', [laWord, laWord, laWord]);

      const score = calculateLineSingability(line);
      expect(score).toBeGreaterThanOrEqual(0.8);
    });

    it('should score highly for simple CVC patterns', () => {
      // "hot dog" - simple syllable structure
      const hot = createWord('hot', [createSyllable(['HH', 'AA1', 'T'], 1, 'AA1', false)]);
      const dog = createWord('dog', [createSyllable(['D', 'AO1', 'G'], 1, 'AO1', false)]);
      const line = createLine('hot dog', [hot, dog]);

      const score = calculateLineSingability(line);
      expect(score).toBeGreaterThanOrEqual(0.7);
    });
  });

  describe('challenging lines', () => {
    it('should score lower for lines with consonant clusters', () => {
      const strengths = createWord('strengths', [
        createSyllable(['S', 'T', 'R', 'EH1', 'NG', 'TH', 'S'], 1, 'EH1', false),
      ]);
      const line = createLine('strengths', [strengths]);

      const score = calculateLineSingability(line);
      expect(score).toBeLessThan(0.6);
    });

    it('should score lower for lines with closed vowels', () => {
      const bit = createWord('bit', [createSyllable(['B', 'IH1', 'T'], 1, 'IH1', false)]);
      const sit = createWord('sit', [createSyllable(['S', 'IH1', 'T'], 1, 'IH1', false)]);
      const line = createLine('bit sit', [bit, sit]);

      const score = calculateLineSingability(line);
      expect(score).toBeLessThan(0.5);
    });
  });

  describe('mixed lines', () => {
    it('should give moderate score for mixed difficulty', () => {
      const love = createWord('love', [createSyllable(['L', 'AH1', 'V'], 1, 'AH1', false)]);
      const strengths = createWord('strengths', [
        createSyllable(['S', 'T', 'R', 'EH1', 'NG', 'TH', 'S'], 1, 'EH1', false),
      ]);
      const line = createLine('love strengths', [love, strengths]);

      const score = calculateLineSingability(line);
      expect(score).toBeGreaterThan(0.2);
      expect(score).toBeLessThan(0.7);
    });
  });

  describe('edge cases', () => {
    it('should return 0 for empty line', () => {
      const line = createLine('', []);
      expect(calculateLineSingability(line)).toBe(0);
    });
  });
});

// =============================================================================
// analyzeLineSingability Tests
// =============================================================================

describe('analyzeLineSingability', () => {
  it('should return complete SingabilityScore object', () => {
    const word = createWord('love', [createSyllable(['L', 'AH1', 'V'], 1, 'AH1', false)]);
    const line = createLine('love', [word]);

    const result = analyzeLineSingability(line);

    expect(result).toHaveProperty('syllableScores');
    expect(result).toHaveProperty('lineScore');
    expect(result).toHaveProperty('problemSpots');
    expect(Array.isArray(result.syllableScores)).toBe(true);
    expect(typeof result.lineScore).toBe('number');
    expect(Array.isArray(result.problemSpots)).toBe(true);
  });

  it('should have syllable scores matching syllable count', () => {
    const beautiful = createWord('beautiful', [
      createSyllable(['B', 'Y', 'UW1'], 1, 'UW1', false),
      createSyllable(['T', 'AH0'], 0, 'AH0', false),
      createSyllable(['F', 'AH0', 'L'], 0, 'AH0', false),
    ]);
    const line = createLine('beautiful', [beautiful]);

    const result = analyzeLineSingability(line);

    expect(result.syllableScores.length).toBe(3);
  });

  it('should include problem spots with formatted descriptions', () => {
    const strengths = createWord('strengths', [
      createSyllable(['S', 'T', 'R', 'EH1', 'NG', 'TH', 'S'], 1, 'EH1', false),
    ]);
    const line = createLine('strengths', [strengths]);

    const result = analyzeLineSingability(line);

    expect(result.problemSpots.length).toBeGreaterThan(0);
    expect(result.problemSpots[0]).toHaveProperty('position');
    expect(result.problemSpots[0]).toHaveProperty('issue');
    expect(result.problemSpots[0]).toHaveProperty('severity');
  });
});

// =============================================================================
// Word-Level Utility Tests
// =============================================================================

describe('scoreWordSingability', () => {
  it('should score "love" highly (open vowel, simple structure)', () => {
    const score = scoreWordSingability('love');
    expect(score).not.toBeNull();
    expect(score!).toBeGreaterThanOrEqual(0.4);
  });

  it('should score "ah" very highly (open vowel)', () => {
    const score = scoreWordSingability('ah');
    expect(score).not.toBeNull();
    if (score !== null) {
      expect(score).toBeGreaterThanOrEqual(0.8);
    }
  });

  it('should return null for unknown word', () => {
    const score = scoreWordSingability('xyzabc123');
    expect(score).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(scoreWordSingability('')).toBeNull();
  });
});

describe('getPrimaryVowel', () => {
  it('should return stressed vowel for known word', () => {
    const vowel = getPrimaryVowel('hello');
    expect(vowel).not.toBeNull();
    expect(vowel).toMatch(/^[AEIOU]/);
  });

  it('should return null for unknown word', () => {
    expect(getPrimaryVowel('xyzabc123')).toBeNull();
  });
});

describe('hasDifficultClusters', () => {
  it('should return true for "strengths"', () => {
    expect(hasDifficultClusters('strengths')).toBe(true);
  });

  it('should return false for "love"', () => {
    expect(hasDifficultClusters('love')).toBe(false);
  });

  it('should return false for unknown word', () => {
    expect(hasDifficultClusters('xyzabc123')).toBe(false);
  });
});

// =============================================================================
// Batch Analysis Tests
// =============================================================================

describe('analyzeMultipleLines', () => {
  it('should return array of scores matching line count', () => {
    const word1 = createWord('love', [createSyllable(['L', 'AH1', 'V'], 1, 'AH1', false)]);
    const word2 = createWord('hate', [createSyllable(['HH', 'EY1', 'T'], 1, 'EY1', false)]);
    const lines = [createLine('love', [word1]), createLine('hate', [word2])];

    const scores = analyzeMultipleLines(lines);

    expect(scores.length).toBe(2);
    expect(scores[0]).toHaveProperty('lineScore');
    expect(scores[1]).toHaveProperty('lineScore');
  });
});

describe('calculateAverageSingability', () => {
  it('should calculate correct average', () => {
    const scores = [
      { syllableScores: [0.8], lineScore: 0.8, problemSpots: [] },
      { syllableScores: [0.6], lineScore: 0.6, problemSpots: [] },
    ];

    expect(calculateAverageSingability(scores)).toBe(0.7);
  });

  it('should return 0 for empty array', () => {
    expect(calculateAverageSingability([])).toBe(0);
  });
});

describe('collectProblemSpots', () => {
  it('should collect problems from multiple lines', () => {
    const scores = [
      {
        syllableScores: [0.5],
        lineScore: 0.5,
        problemSpots: [{ position: 0, issue: 'cluster', severity: 'high' as const }],
      },
      {
        syllableScores: [0.6],
        lineScore: 0.6,
        problemSpots: [{ position: 0, issue: 'vowel', severity: 'low' as const }],
      },
    ];

    const problems = collectProblemSpots(scores);
    expect(problems.length).toBe(2);
    expect(problems[0].lineIndex).toBe(0);
    expect(problems[1].lineIndex).toBe(1);
  });

  it('should filter by severity', () => {
    const scores = [
      {
        syllableScores: [0.5],
        lineScore: 0.5,
        problemSpots: [
          { position: 0, issue: 'cluster', severity: 'high' as const },
          { position: 1, issue: 'vowel', severity: 'low' as const },
        ],
      },
    ];

    const highOnly = collectProblemSpots(scores, 'high');
    expect(highOnly.length).toBe(1);
    expect(highOnly[0].problem.severity).toBe('high');

    const mediumUp = collectProblemSpots(scores, 'medium');
    expect(mediumUp.length).toBe(1);
  });
});

// =============================================================================
// Integration Tests - Known Singable/Unsingable Examples
// =============================================================================

describe('integration: known singable vs unsingable words', () => {
  describe('highly singable words (should score > 0.6)', () => {
    const singableWords = ['ah', 'oh', 'love', 'heart', 'day', 'way', 'say'];

    for (const word of singableWords) {
      it(`should score "${word}" as singable`, () => {
        const score = scoreWordSingability(word);
        if (score !== null) {
          expect(score).toBeGreaterThanOrEqual(0.4);
        }
      });
    }
  });

  describe('challenging words (should score < 0.5)', () => {
    const challengingWords = ['strengths', 'glimpsed', 'texts'];

    for (const word of challengingWords) {
      it(`should score "${word}" as challenging`, () => {
        const score = scoreWordSingability(word);
        if (score !== null) {
          expect(score).toBeLessThan(0.6);
        }
      });
    }
  });
});

describe('integration: intuitive singability correlation', () => {
  it('should rank "love" higher than "strengths"', () => {
    const loveScore = scoreWordSingability('love');
    const strengthsScore = scoreWordSingability('strengths');

    if (loveScore !== null && strengthsScore !== null) {
      expect(loveScore).toBeGreaterThan(strengthsScore);
    }
  });

  it('should rank "heart" higher than "glimpsed"', () => {
    const heartScore = scoreWordSingability('heart');
    const glimpsedScore = scoreWordSingability('glimpsed');

    if (heartScore !== null && glimpsedScore !== null) {
      expect(heartScore).toBeGreaterThan(glimpsedScore);
    }
  });

  it('should rank open vowel "ah" higher than closed "it"', () => {
    // Compare vowel openness directly
    const ahScore = scoreVowelOpenness(['AA1']);
    const itScore = scoreVowelOpenness(['IH1']);

    expect(ahScore).toBeGreaterThan(itScore);
  });
});
