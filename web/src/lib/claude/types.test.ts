/**
 * Tests for Claude Integration Types
 *
 * @module lib/claude/types.test
 */

import { describe, it, expect } from 'vitest';
import {
  createDefaultSuggestion,
  createDefaultProblemSpot,
  createDefaultQualitativeAnalysis,
  createDefaultMelodyFeedback,
  createDefaultResponseMetadata,
  isSuggestion,
  isQualitativeAnalysis,
  isMelodyFeedback,
  problemReportToProblemSpot,
  problemReportsToProblemSpots,
  extractQuantitativeData,
} from './types';
import type { Suggestion, QualitativeAnalysis, MelodyFeedback } from './types';
import type { ProblemReport } from '../../types/analysis';
import { createDefaultPoemAnalysis } from '../../types/analysis';

// =============================================================================
// Factory Function Tests
// =============================================================================

describe('createDefaultSuggestion', () => {
  it('creates a valid default suggestion', () => {
    const suggestion = createDefaultSuggestion();

    expect(suggestion.originalWord).toBe('');
    expect(suggestion.suggestedWord).toBe('');
    expect(suggestion.lineNumber).toBe(0);
    expect(suggestion.position).toBe(0);
    expect(suggestion.reason).toBe('');
    expect(suggestion.preservesMeaning).toBe('yes');
  });

  it('creates suggestion that passes type guard', () => {
    const suggestion = createDefaultSuggestion();
    expect(isSuggestion(suggestion)).toBe(true);
  });
});

describe('createDefaultProblemSpot', () => {
  it('creates a valid default problem spot', () => {
    const spot = createDefaultProblemSpot();

    expect(spot.line).toBe(0);
    expect(spot.position).toBe(0);
    expect(spot.type).toBe('singability');
    expect(spot.severity).toBe('low');
    expect(spot.description).toBe('');
  });

  it('has correct structure', () => {
    const spot = createDefaultProblemSpot();

    expect(typeof spot.line).toBe('number');
    expect(typeof spot.position).toBe('number');
    expect(typeof spot.type).toBe('string');
    expect(typeof spot.severity).toBe('string');
    expect(typeof spot.description).toBe('string');
  });
});

describe('createDefaultQualitativeAnalysis', () => {
  it('creates a valid default analysis', () => {
    const analysis = createDefaultQualitativeAnalysis();

    expect(analysis.emotional).toBeDefined();
    expect(analysis.emotional.primaryTheme).toBe('');
    expect(analysis.emotional.secondaryThemes).toEqual([]);
    expect(analysis.emotional.emotionalJourney).toBe('');
    expect(analysis.emotional.keyImagery).toEqual([]);
    expect(analysis.emotional.mood).toBe('');

    expect(analysis.meaning).toBeDefined();
    expect(analysis.meaning.coreTheme).toBe('');
    expect(analysis.meaning.essentialElements).toEqual([]);
    expect(analysis.meaning.flexibleElements).toEqual([]);
    expect(analysis.meaning.authorVoice).toBe('');

    expect(analysis.summary).toBe('');
    expect(analysis.confidence).toBe(0);
  });

  it('creates analysis that passes type guard', () => {
    const analysis = createDefaultQualitativeAnalysis();
    expect(isQualitativeAnalysis(analysis)).toBe(true);
  });
});

describe('createDefaultMelodyFeedback', () => {
  it('creates a valid default feedback', () => {
    const feedback = createDefaultMelodyFeedback();

    expect(feedback.emotionalFit).toBe('adequate');
    expect(feedback.observations).toEqual([]);
    expect(feedback.improvements).toEqual([]);
    expect(feedback.highlights).toEqual([]);
  });

  it('creates feedback that passes type guard', () => {
    const feedback = createDefaultMelodyFeedback();
    expect(isMelodyFeedback(feedback)).toBe(true);
  });
});

describe('createDefaultResponseMetadata', () => {
  it('creates a valid default metadata', () => {
    const metadata = createDefaultResponseMetadata();

    expect(metadata.success).toBe(true);
    expect(metadata.errors).toEqual([]);
    expect(metadata.warnings).toEqual([]);
    expect(metadata.originalLength).toBe(0);
  });
});

// =============================================================================
// Type Guard Tests
// =============================================================================

describe('isSuggestion', () => {
  it('returns true for valid suggestions', () => {
    const validSuggestion: Suggestion = {
      originalWord: 'beautiful',
      suggestedWord: 'lovely',
      lineNumber: 1,
      position: 2,
      reason: 'Fewer syllables',
      preservesMeaning: 'yes',
    };

    expect(isSuggestion(validSuggestion)).toBe(true);
  });

  it('returns true for all preservesMeaning values', () => {
    const baseSuggestion = {
      originalWord: 'test',
      suggestedWord: 'example',
      lineNumber: 1,
      position: 0,
      reason: 'testing',
    };

    expect(isSuggestion({ ...baseSuggestion, preservesMeaning: 'yes' })).toBe(true);
    expect(isSuggestion({ ...baseSuggestion, preservesMeaning: 'partial' })).toBe(true);
    expect(isSuggestion({ ...baseSuggestion, preservesMeaning: 'no' })).toBe(true);
  });

  it('returns false for null and undefined', () => {
    expect(isSuggestion(null)).toBe(false);
    expect(isSuggestion(undefined)).toBe(false);
  });

  it('returns false for non-objects', () => {
    expect(isSuggestion('string')).toBe(false);
    expect(isSuggestion(123)).toBe(false);
    expect(isSuggestion([])).toBe(false);
  });

  it('returns false for objects missing required fields', () => {
    expect(isSuggestion({ originalWord: 'test' })).toBe(false);
    expect(
      isSuggestion({
        originalWord: 'test',
        suggestedWord: 'example',
      })
    ).toBe(false);
    expect(
      isSuggestion({
        originalWord: 'test',
        suggestedWord: 'example',
        lineNumber: 1,
        position: 0,
        reason: 'testing',
        preservesMeaning: 'invalid',
      })
    ).toBe(false);
  });

  it('returns false for wrong field types', () => {
    expect(
      isSuggestion({
        originalWord: 123, // should be string
        suggestedWord: 'example',
        lineNumber: 1,
        position: 0,
        reason: 'testing',
        preservesMeaning: 'yes',
      })
    ).toBe(false);

    expect(
      isSuggestion({
        originalWord: 'test',
        suggestedWord: 'example',
        lineNumber: '1', // should be number
        position: 0,
        reason: 'testing',
        preservesMeaning: 'yes',
      })
    ).toBe(false);
  });
});

describe('isQualitativeAnalysis', () => {
  it('returns true for valid analysis', () => {
    const validAnalysis: QualitativeAnalysis = {
      emotional: {
        primaryTheme: 'nostalgia',
        secondaryThemes: ['hope', 'loss'],
        emotionalJourney: 'From sadness to acceptance',
        keyImagery: ['autumn leaves', 'empty streets'],
        mood: 'contemplative',
      },
      meaning: {
        coreTheme: 'The passage of time',
        essentialElements: ['seasonal imagery', 'memory references'],
        flexibleElements: ['specific details'],
        authorVoice: 'Reflective and personal',
      },
      summary: 'A reflective piece about memory and time.',
      confidence: 0.85,
    };

    expect(isQualitativeAnalysis(validAnalysis)).toBe(true);
  });

  it('returns false for null and undefined', () => {
    expect(isQualitativeAnalysis(null)).toBe(false);
    expect(isQualitativeAnalysis(undefined)).toBe(false);
  });

  it('returns false for non-objects', () => {
    expect(isQualitativeAnalysis('string')).toBe(false);
    expect(isQualitativeAnalysis(123)).toBe(false);
    expect(isQualitativeAnalysis([])).toBe(false);
  });

  it('returns false for objects missing required fields', () => {
    expect(isQualitativeAnalysis({ emotional: {} })).toBe(false);
    expect(isQualitativeAnalysis({ emotional: {}, meaning: {} })).toBe(false);
    expect(
      isQualitativeAnalysis({ emotional: {}, meaning: {}, summary: 'test' })
    ).toBe(false);
  });
});

describe('isMelodyFeedback', () => {
  it('returns true for valid feedback', () => {
    const validFeedback: MelodyFeedback = {
      emotionalFit: 'good',
      observations: ['The melody rises with the emotion'],
      improvements: ['Consider a longer note on "love"'],
      highlights: ['Phrase ending is effective'],
    };

    expect(isMelodyFeedback(validFeedback)).toBe(true);
  });

  it('returns true for all emotionalFit values', () => {
    const baseFeedback = {
      observations: [],
      improvements: [],
      highlights: [],
    };

    expect(isMelodyFeedback({ ...baseFeedback, emotionalFit: 'excellent' })).toBe(true);
    expect(isMelodyFeedback({ ...baseFeedback, emotionalFit: 'good' })).toBe(true);
    expect(isMelodyFeedback({ ...baseFeedback, emotionalFit: 'adequate' })).toBe(true);
    expect(isMelodyFeedback({ ...baseFeedback, emotionalFit: 'poor' })).toBe(true);
  });

  it('returns false for invalid emotionalFit', () => {
    expect(
      isMelodyFeedback({
        emotionalFit: 'great', // not a valid value
        observations: [],
        improvements: [],
        highlights: [],
      })
    ).toBe(false);
  });

  it('returns false for non-array fields', () => {
    expect(
      isMelodyFeedback({
        emotionalFit: 'good',
        observations: 'string', // should be array
        improvements: [],
        highlights: [],
      })
    ).toBe(false);
  });
});

// =============================================================================
// Conversion Function Tests
// =============================================================================

describe('problemReportToProblemSpot', () => {
  it('converts ProblemReport to ProblemSpot correctly', () => {
    const report: ProblemReport = {
      line: 5,
      position: 3,
      type: 'stress_mismatch',
      severity: 'high',
      description: 'Stressed syllable on weak beat',
      suggestedFix: 'Consider rewording',
    };

    const spot = problemReportToProblemSpot(report);

    expect(spot.line).toBe(5);
    expect(spot.position).toBe(3);
    expect(spot.type).toBe('stress_mismatch');
    expect(spot.severity).toBe('high');
    expect(spot.description).toBe('Stressed syllable on weak beat');
  });

  it('does not include suggestedFix in output', () => {
    const report: ProblemReport = {
      line: 1,
      position: 0,
      type: 'singability',
      severity: 'low',
      description: 'Hard consonant cluster',
      suggestedFix: 'Use simpler word',
    };

    const spot = problemReportToProblemSpot(report);

    expect(Object.keys(spot)).not.toContain('suggestedFix');
  });
});

describe('problemReportsToProblemSpots', () => {
  it('converts array of reports', () => {
    const reports: ProblemReport[] = [
      {
        line: 1,
        position: 0,
        type: 'stress_mismatch',
        severity: 'high',
        description: 'Issue 1',
      },
      {
        line: 2,
        position: 1,
        type: 'singability',
        severity: 'medium',
        description: 'Issue 2',
      },
    ];

    const spots = problemReportsToProblemSpots(reports);

    expect(spots).toHaveLength(2);
    expect(spots[0].line).toBe(1);
    expect(spots[1].line).toBe(2);
  });

  it('handles empty array', () => {
    const spots = problemReportsToProblemSpots([]);
    expect(spots).toEqual([]);
  });
});

describe('extractQuantitativeData', () => {
  it('extracts data from a basic poem analysis', () => {
    const analysis = createDefaultPoemAnalysis();

    // Add some test data
    analysis.structure.stanzas = [
      {
        lines: [
          {
            text: 'Test line one',
            words: [],
            stressPattern: '010',
            syllableCount: 3,
            singability: {
              syllableScores: [0.8, 0.9, 0.7],
              lineScore: 0.8,
              problemSpots: [],
            },
          },
          {
            text: 'Test line two',
            words: [],
            stressPattern: '101',
            syllableCount: 3,
            singability: {
              syllableScores: [0.7, 0.8, 0.9],
              lineScore: 0.8,
              problemSpots: [],
            },
          },
        ],
      },
    ];
    analysis.prosody.rhyme.scheme = 'AABB';
    analysis.prosody.meter.detectedMeter = 'iambic_tetrameter';
    analysis.emotion.overallSentiment = 0.5;
    analysis.emotion.arousal = 0.6;
    analysis.emotion.dominantEmotions = ['hopeful', 'peaceful'];

    const data = extractQuantitativeData(analysis);

    expect(data.syllableCounts).toEqual([3, 3]);
    expect(data.stressPatterns).toEqual(['010', '101']);
    expect(data.rhymeScheme).toBe('AABB');
    expect(data.meterType).toBe('iambic_tetrameter');
    expect(data.emotionalScores.sentiment).toBe(0.5);
    expect(data.emotionalScores.arousal).toBe(0.6);
    expect(data.emotionalScores.dominantEmotions).toEqual(['hopeful', 'peaceful']);
    expect(data.singabilityScores).toEqual([0.8, 0.8]);
  });

  it('handles empty analysis', () => {
    const analysis = createDefaultPoemAnalysis();
    const data = extractQuantitativeData(analysis);

    expect(data.syllableCounts).toEqual([]);
    expect(data.stressPatterns).toEqual([]);
    expect(data.singabilityScores).toEqual([]);
  });

  it('handles multiple stanzas', () => {
    const analysis = createDefaultPoemAnalysis();

    analysis.structure.stanzas = [
      {
        lines: [
          {
            text: 'Line 1',
            words: [],
            stressPattern: '01',
            syllableCount: 2,
            singability: { syllableScores: [], lineScore: 0.9, problemSpots: [] },
          },
        ],
      },
      {
        lines: [
          {
            text: 'Line 2',
            words: [],
            stressPattern: '10',
            syllableCount: 2,
            singability: { syllableScores: [], lineScore: 0.8, problemSpots: [] },
          },
        ],
      },
    ];

    const data = extractQuantitativeData(analysis);

    expect(data.syllableCounts).toEqual([2, 2]);
    expect(data.stressPatterns).toEqual(['01', '10']);
    expect(data.singabilityScores).toEqual([0.9, 0.8]);
  });
});
