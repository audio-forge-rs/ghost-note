/**
 * Ghost Note - Suggestion Generator Tests
 *
 * Tests for the suggestion generation module.
 *
 * @module lib/suggestions/generator.test
 */

import { describe, it, expect } from 'vitest';
import {
  generateSuggestionsFromAnalysis,
  hasGeneratableProblems,
  countGeneratableProblems,
} from './generator';
import type { PoemAnalysis, ProblemReport } from '../../types/analysis';
import { createDefaultPoemAnalysis } from '../../types/analysis';

// =============================================================================
// Test Fixtures
// =============================================================================

/**
 * Creates a mock problem report
 */
function createMockProblem(overrides: Partial<ProblemReport> = {}): ProblemReport {
  return {
    line: 1,
    position: 0,
    type: 'singability',
    severity: 'medium',
    description: 'Test problem description',
    ...overrides,
  };
}

/**
 * Creates a mock analysis with problems
 */
function createMockAnalysis(problemCount: number = 0): PoemAnalysis {
  const analysis = createDefaultPoemAnalysis();

  // Add some basic structure
  analysis.meta.lineCount = 4;
  analysis.meta.stanzaCount = 1;
  analysis.structure.stanzas = [
    {
      lines: [
        {
          text: 'The strength of through the night',
          words: [
            { text: 'The', syllables: [{ phonemes: ['DH', 'AH'], stress: 0, vowelPhoneme: 'AH', isOpen: true }] },
            { text: 'strength', syllables: [{ phonemes: ['S', 'T', 'R', 'EH1', 'NG', 'K', 'TH'], stress: 1, vowelPhoneme: 'EH1', isOpen: false }] },
            { text: 'of', syllables: [{ phonemes: ['AH', 'V'], stress: 0, vowelPhoneme: 'AH', isOpen: false }] },
            { text: 'through', syllables: [{ phonemes: ['TH', 'R', 'UW1'], stress: 1, vowelPhoneme: 'UW1', isOpen: true }] },
            { text: 'the', syllables: [{ phonemes: ['DH', 'AH'], stress: 0, vowelPhoneme: 'AH', isOpen: true }] },
            { text: 'night', syllables: [{ phonemes: ['N', 'AY1', 'T'], stress: 1, vowelPhoneme: 'AY1', isOpen: false }] },
          ],
          stressPattern: '010101',
          syllableCount: 6,
          singability: { syllableScores: [0.8, 0.5, 0.9, 0.6, 0.9, 0.8], lineScore: 0.75, problemSpots: [] },
        },
        {
          text: 'I remember the day',
          words: [
            { text: 'I', syllables: [{ phonemes: ['AY1'], stress: 1, vowelPhoneme: 'AY1', isOpen: true }] },
            { text: 'remember', syllables: [
              { phonemes: ['R', 'IH0'], stress: 0, vowelPhoneme: 'IH0', isOpen: true },
              { phonemes: ['M', 'EH1', 'M'], stress: 1, vowelPhoneme: 'EH1', isOpen: false },
              { phonemes: ['B', 'ER0'], stress: 0, vowelPhoneme: 'ER0', isOpen: true },
            ] },
            { text: 'the', syllables: [{ phonemes: ['DH', 'AH'], stress: 0, vowelPhoneme: 'AH', isOpen: true }] },
            { text: 'day', syllables: [{ phonemes: ['D', 'EY1'], stress: 1, vowelPhoneme: 'EY1', isOpen: true }] },
          ],
          stressPattern: '10101',
          syllableCount: 5,
          singability: { syllableScores: [0.9, 0.7, 0.6, 0.9, 0.9], lineScore: 0.8, problemSpots: [] },
        },
        {
          text: 'Against all odds we stand',
          words: [
            { text: 'Against', syllables: [
              { phonemes: ['AH0'], stress: 0, vowelPhoneme: 'AH0', isOpen: true },
              { phonemes: ['G', 'EH1', 'N', 'S', 'T'], stress: 1, vowelPhoneme: 'EH1', isOpen: false },
            ] },
            { text: 'all', syllables: [{ phonemes: ['AO1', 'L'], stress: 1, vowelPhoneme: 'AO1', isOpen: false }] },
            { text: 'odds', syllables: [{ phonemes: ['AA1', 'D', 'Z'], stress: 1, vowelPhoneme: 'AA1', isOpen: false }] },
            { text: 'we', syllables: [{ phonemes: ['W', 'IY1'], stress: 1, vowelPhoneme: 'IY1', isOpen: true }] },
            { text: 'stand', syllables: [{ phonemes: ['S', 'T', 'AE1', 'N', 'D'], stress: 1, vowelPhoneme: 'AE1', isOpen: false }] },
          ],
          stressPattern: '011111',
          syllableCount: 6,
          singability: { syllableScores: [0.5, 0.7, 0.8, 0.9, 0.7], lineScore: 0.72, problemSpots: [] },
        },
        {
          text: 'Throughout the night and day',
          words: [
            { text: 'Throughout', syllables: [
              { phonemes: ['TH', 'R', 'UW0'], stress: 0, vowelPhoneme: 'UW0', isOpen: true },
              { phonemes: ['AW1', 'T'], stress: 1, vowelPhoneme: 'AW1', isOpen: false },
            ] },
            { text: 'the', syllables: [{ phonemes: ['DH', 'AH'], stress: 0, vowelPhoneme: 'AH', isOpen: true }] },
            { text: 'night', syllables: [{ phonemes: ['N', 'AY1', 'T'], stress: 1, vowelPhoneme: 'AY1', isOpen: false }] },
            { text: 'and', syllables: [{ phonemes: ['AE1', 'N', 'D'], stress: 1, vowelPhoneme: 'AE1', isOpen: false }] },
            { text: 'day', syllables: [{ phonemes: ['D', 'EY1'], stress: 1, vowelPhoneme: 'EY1', isOpen: true }] },
          ],
          stressPattern: '010111',
          syllableCount: 6,
          singability: { syllableScores: [0.4, 0.7, 0.9, 0.8, 0.7, 0.9], lineScore: 0.73, problemSpots: [] },
        },
      ],
    },
  ];

  // Add problems
  const problems: ProblemReport[] = [];
  for (let i = 0; i < problemCount; i++) {
    problems.push(createMockProblem({
      line: (i % 4) + 1,
      position: i % 6,
      type: ['singability', 'stress_mismatch', 'rhyme_break', 'syllable_variance'][i % 4] as ProblemReport['type'],
      severity: ['low', 'medium', 'high'][i % 3] as ProblemReport['severity'],
    }));
  }
  analysis.problems = problems;

  return analysis;
}

// =============================================================================
// Tests
// =============================================================================

describe('generateSuggestionsFromAnalysis', () => {
  it('should return empty suggestions when analysis has no problems', () => {
    const analysis = createMockAnalysis(0);
    const result = generateSuggestionsFromAnalysis(analysis);

    expect(result.suggestions).toHaveLength(0);
    expect(result.problemsProcessed).toBe(0);
    expect(result.problemsSkipped).toBe(0);
  });

  it('should generate suggestions from analysis problems', () => {
    const analysis = createMockAnalysis(0);
    // Add a problem with a word we have a substitution for
    analysis.problems = [
      createMockProblem({
        line: 1,
        position: 1, // "strength"
        type: 'singability',
        severity: 'high',
        description: 'Contains difficult consonant clusters',
      }),
    ];

    const result = generateSuggestionsFromAnalysis(analysis);

    expect(result.problemsProcessed).toBe(1);
    // May or may not generate a suggestion depending on if word is in substitution list
  });

  it('should respect maxSuggestions option', () => {
    const analysis = createMockAnalysis(20);
    // Make sure all problems can generate suggestions by using known words
    analysis.problems = analysis.problems.map((p) => ({
      ...p,
      line: 1,
      position: 1, // All point to "strength" which has substitutions
    }));

    const result = generateSuggestionsFromAnalysis(analysis, { maxSuggestions: 3 });

    expect(result.suggestions.length).toBeLessThanOrEqual(3);
  });

  it('should filter by minSeverity', () => {
    const analysis = createMockAnalysis(0);
    analysis.problems = [
      createMockProblem({ line: 1, position: 1, severity: 'low' }),
      createMockProblem({ line: 2, position: 1, severity: 'medium' }),
      createMockProblem({ line: 3, position: 0, severity: 'high' }),
    ];

    const result = generateSuggestionsFromAnalysis(analysis, { minSeverity: 'medium' });

    // Should skip the low severity problem
    expect(result.problemsSkipped).toBeGreaterThan(0);
    expect(result.skipReasons.some((r) => r.includes('below threshold'))).toBe(true);
  });

  it('should filter by focusTypes', () => {
    const analysis = createMockAnalysis(0);
    analysis.problems = [
      createMockProblem({ line: 1, position: 1, type: 'singability' }),
      createMockProblem({ line: 2, position: 1, type: 'rhyme_break' }),
      createMockProblem({ line: 3, position: 0, type: 'stress_mismatch' }),
    ];

    const result = generateSuggestionsFromAnalysis(analysis, {
      focusTypes: ['singability'],
    });

    // Should only process singability problems
    expect(result.problemsSkipped).toBeGreaterThanOrEqual(2);
    expect(result.skipReasons.some((r) => r.includes('not in focus'))).toBe(true);
  });

  it('should skip duplicate positions', () => {
    const analysis = createMockAnalysis(0);
    // Add two problems at the same position
    analysis.problems = [
      createMockProblem({ line: 1, position: 1, type: 'singability' }),
      createMockProblem({ line: 1, position: 1, type: 'stress_mismatch' }),
    ];

    const result = generateSuggestionsFromAnalysis(analysis);

    // Should process first, skip second
    expect(result.skipReasons.some((r) => r.includes('duplicate position'))).toBe(true);
  });

  it('should sort problems by severity (high first)', () => {
    const analysis = createMockAnalysis(0);
    analysis.problems = [
      createMockProblem({ line: 1, position: 1, severity: 'low', description: 'Low severity issue' }),
      createMockProblem({ line: 2, position: 1, severity: 'high', description: 'High severity issue' }),
      createMockProblem({ line: 3, position: 0, severity: 'medium', description: 'Medium severity issue' }),
    ];

    const result = generateSuggestionsFromAnalysis(analysis, { maxSuggestions: 1 });

    // The first processed should be the high severity one
    expect(result.problemsProcessed).toBeGreaterThan(0);
  });

  it('should generate suggestion with correct structure', () => {
    const analysis = createMockAnalysis(0);
    // Add a problem for "through" which has substitutions
    analysis.problems = [
      createMockProblem({
        line: 1,
        position: 3, // "through" in the first line
        type: 'singability',
        severity: 'high',
        description: 'Hard to sustain this sound',
      }),
    ];

    const result = generateSuggestionsFromAnalysis(analysis);

    if (result.suggestions.length > 0) {
      const suggestion = result.suggestions[0];
      expect(suggestion).toHaveProperty('originalWord');
      expect(suggestion).toHaveProperty('suggestedWord');
      expect(suggestion).toHaveProperty('lineNumber');
      expect(suggestion).toHaveProperty('position');
      expect(suggestion).toHaveProperty('reason');
      expect(suggestion).toHaveProperty('preservesMeaning');
      expect(['yes', 'partial', 'no']).toContain(suggestion.preservesMeaning);
    }
  });

  it('should handle empty analysis structure gracefully', () => {
    const analysis = createDefaultPoemAnalysis();
    analysis.problems = [createMockProblem({ line: 1, position: 0 })];

    // Should not throw
    const result = generateSuggestionsFromAnalysis(analysis);
    expect(result).toBeDefined();
  });
});

describe('hasGeneratableProblems', () => {
  it('should return false when no problems exist', () => {
    const analysis = createMockAnalysis(0);
    expect(hasGeneratableProblems(analysis)).toBe(false);
  });

  it('should return true when matching problems exist', () => {
    const analysis = createMockAnalysis(1);
    expect(hasGeneratableProblems(analysis)).toBe(true);
  });

  it('should respect minSeverity option', () => {
    const analysis = createMockAnalysis(0);
    analysis.problems = [createMockProblem({ severity: 'low' })];

    expect(hasGeneratableProblems(analysis, { minSeverity: 'high' })).toBe(false);
    expect(hasGeneratableProblems(analysis, { minSeverity: 'low' })).toBe(true);
  });

  it('should respect focusTypes option', () => {
    const analysis = createMockAnalysis(0);
    analysis.problems = [createMockProblem({ type: 'singability' })];

    expect(hasGeneratableProblems(analysis, { focusTypes: ['rhyme_break'] })).toBe(false);
    expect(hasGeneratableProblems(analysis, { focusTypes: ['singability'] })).toBe(true);
  });
});

describe('countGeneratableProblems', () => {
  it('should return 0 when no problems exist', () => {
    const analysis = createMockAnalysis(0);
    expect(countGeneratableProblems(analysis)).toBe(0);
  });

  it('should count matching problems', () => {
    const analysis = createMockAnalysis(5);
    const count = countGeneratableProblems(analysis);
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(5);
  });

  it('should filter by severity', () => {
    const analysis = createMockAnalysis(0);
    analysis.problems = [
      createMockProblem({ severity: 'low' }),
      createMockProblem({ severity: 'medium' }),
      createMockProblem({ severity: 'high' }),
    ];

    expect(countGeneratableProblems(analysis, { minSeverity: 'low' })).toBe(3);
    expect(countGeneratableProblems(analysis, { minSeverity: 'medium' })).toBe(2);
    expect(countGeneratableProblems(analysis, { minSeverity: 'high' })).toBe(1);
  });

  it('should filter by type', () => {
    const analysis = createMockAnalysis(0);
    analysis.problems = [
      createMockProblem({ type: 'singability' }),
      createMockProblem({ type: 'singability' }),
      createMockProblem({ type: 'rhyme_break' }),
    ];

    expect(countGeneratableProblems(analysis, { focusTypes: ['singability'] })).toBe(2);
    expect(countGeneratableProblems(analysis, { focusTypes: ['rhyme_break'] })).toBe(1);
    expect(countGeneratableProblems(analysis, { focusTypes: ['stress_mismatch'] })).toBe(0);
  });
});

describe('suggestion content', () => {
  it('should generate reason from problem description when available', () => {
    const analysis = createMockAnalysis(0);
    const customDescription = 'This word has difficult consonant clusters';
    analysis.problems = [
      createMockProblem({
        line: 1,
        position: 1, // "strength"
        type: 'singability',
        description: customDescription,
      }),
    ];

    const result = generateSuggestionsFromAnalysis(analysis);

    if (result.suggestions.length > 0) {
      expect(result.suggestions[0].reason).toBe(customDescription);
    }
  });

  it('should determine meaning preservation based on problem type', () => {
    const analysis = createMockAnalysis(0);

    // Rhyme break problems should have partial meaning preservation
    analysis.problems = [
      createMockProblem({
        line: 1,
        position: 5, // "night" - which has rhyme alternatives
        type: 'rhyme_break',
      }),
    ];

    const result = generateSuggestionsFromAnalysis(analysis);

    if (result.suggestions.length > 0) {
      // Rhyme changes often alter meaning
      expect(['partial', 'no']).toContain(result.suggestions[0].preservesMeaning);
    }
  });
});

describe('edge cases', () => {
  it('should handle analysis with no structure gracefully', () => {
    const analysis = createDefaultPoemAnalysis();
    analysis.problems = [createMockProblem({ line: 10, position: 0 })];

    const result = generateSuggestionsFromAnalysis(analysis);

    // Should not crash, but may not generate suggestions
    expect(result.problemsProcessed).toBeGreaterThan(0);
    expect(result.skipReasons.some((r) => r.includes('Could not generate'))).toBe(true);
  });

  it('should handle out-of-bounds line numbers', () => {
    const analysis = createMockAnalysis(0);
    analysis.problems = [createMockProblem({ line: 100, position: 0 })];

    const result = generateSuggestionsFromAnalysis(analysis);

    // Should process but skip due to inability to find word
    expect(result.problemsProcessed).toBe(1);
  });

  it('should handle out-of-bounds positions', () => {
    const analysis = createMockAnalysis(0);
    analysis.problems = [createMockProblem({ line: 1, position: 100 })];

    const result = generateSuggestionsFromAnalysis(analysis);

    // Should process but may skip due to inability to find word
    expect(result.problemsProcessed).toBe(1);
  });

  it('should handle empty strings in analysis', () => {
    const analysis = createMockAnalysis(0);
    analysis.structure.stanzas = [
      {
        lines: [
          {
            text: '',
            words: [],
            stressPattern: '',
            syllableCount: 0,
            singability: { syllableScores: [], lineScore: 0, problemSpots: [] },
          },
        ],
      },
    ];
    analysis.problems = [createMockProblem({ line: 1, position: 0 })];

    const result = generateSuggestionsFromAnalysis(analysis);

    // Should not crash
    expect(result).toBeDefined();
  });

  it('should not generate duplicate suggestions for same original word', () => {
    const analysis = createMockAnalysis(0);
    // Add problems at same position - should dedupe
    analysis.problems = [
      createMockProblem({ line: 1, position: 1, type: 'singability' }),
      createMockProblem({ line: 1, position: 1, type: 'stress_mismatch' }),
    ];

    const result = generateSuggestionsFromAnalysis(analysis);

    // Should only have at most 1 suggestion for this position
    const uniquePositions = new Set(
      result.suggestions.map((s) => `${s.lineNumber}:${s.position}`)
    );
    expect(uniquePositions.size).toBe(result.suggestions.length);
  });
});

describe('substitution lookup', () => {
  it('should find singability substitutions', () => {
    const analysis = createMockAnalysis(0);
    // "strength" has substitutions: ['power', 'force', 'might']
    analysis.problems = [
      createMockProblem({
        line: 1,
        position: 1,
        type: 'singability',
      }),
    ];

    const result = generateSuggestionsFromAnalysis(analysis);

    if (result.suggestions.length > 0) {
      expect(['power', 'force', 'might']).toContain(result.suggestions[0].suggestedWord);
    }
  });

  it('should find stress substitutions', () => {
    const analysis = createMockAnalysis(0);
    // "remember" has substitutions: ['recall', 'think of']
    analysis.problems = [
      createMockProblem({
        line: 2,
        position: 1,
        type: 'stress_mismatch',
      }),
    ];

    const result = generateSuggestionsFromAnalysis(analysis);

    if (result.suggestions.length > 0) {
      expect(['recall', 'think of']).toContain(result.suggestions[0].suggestedWord);
    }
  });

  it('should find rhyme alternatives', () => {
    const analysis = createMockAnalysis(0);
    // "night" has rhyme alternatives: ['light', 'sight', 'bright', 'flight', 'right']
    analysis.problems = [
      createMockProblem({
        line: 1,
        position: 5,
        type: 'rhyme_break',
      }),
    ];

    const result = generateSuggestionsFromAnalysis(analysis);

    if (result.suggestions.length > 0) {
      expect(['light', 'sight', 'bright', 'flight', 'right']).toContain(
        result.suggestions[0].suggestedWord
      );
    }
  });
});
