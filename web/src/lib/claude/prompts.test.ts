/**
 * Tests for Claude Prompt Generation
 *
 * @module lib/claude/prompts.test
 */

import { describe, it, expect } from 'vitest';
import {
  createSuggestionPrompt,
  createSuggestionPromptFromAnalysis,
  createAnalysisPrompt,
  createEmotionalInterpretationPrompt,
  createMeaningPreservationPrompt,
  createMelodyFeedbackPrompt,
  buildSuggestionContext,
  buildAnalysisContext,
  estimateTokenCount,
  truncatePromptIfNeeded,
} from './prompts';
import type { ProblemSpot } from './types';
import type { PoemAnalysis } from '../../types/analysis';
import { createDefaultPoemAnalysis } from '../../types/analysis';

// =============================================================================
// Test Fixtures
// =============================================================================

function createTestAnalysis(): PoemAnalysis {
  const analysis = createDefaultPoemAnalysis();

  analysis.structure.stanzas = [
    {
      lines: [
        {
          text: 'The woods are lovely, dark and deep',
          words: [],
          stressPattern: '01010101',
          syllableCount: 8,
          singability: {
            syllableScores: [0.8, 0.9, 0.7, 0.8, 0.6, 0.9, 0.8, 0.9],
            lineScore: 0.8,
            problemSpots: [],
          },
        },
        {
          text: 'But I have promises to keep',
          words: [],
          stressPattern: '01010101',
          syllableCount: 8,
          singability: {
            syllableScores: [0.9, 0.8, 0.7, 0.9, 0.8, 0.7, 0.8, 0.9],
            lineScore: 0.81,
            problemSpots: [],
          },
        },
      ],
    },
  ];

  analysis.prosody.meter.detectedMeter = 'iambic_tetrameter';
  analysis.prosody.rhyme.scheme = 'AABB';
  analysis.emotion.overallSentiment = 0.2;
  analysis.emotion.arousal = 0.4;
  analysis.emotion.dominantEmotions = ['peaceful', 'contemplative'];
  analysis.emotion.emotionalArc = [
    { stanza: 0, sentiment: 0.2, keywords: ['lovely', 'deep'] },
  ];

  return analysis;
}

function createTestProblemSpots(): ProblemSpot[] {
  return [
    {
      line: 1,
      position: 3,
      type: 'stress_mismatch',
      severity: 'high',
      description: 'Stressed syllable "love" on weak beat',
    },
    {
      line: 2,
      position: 5,
      type: 'singability',
      severity: 'medium',
      description: 'Consonant cluster in "promises" hard to sustain',
    },
  ];
}

// =============================================================================
// createSuggestionPrompt Tests
// =============================================================================

describe('createSuggestionPrompt', () => {
  it('creates a prompt containing the poem text', () => {
    const analysis = createTestAnalysis();
    const problemSpots = createTestProblemSpots();

    const prompt = createSuggestionPrompt(analysis, problemSpots);

    expect(prompt).toContain('The woods are lovely, dark and deep');
    expect(prompt).toContain('But I have promises to keep');
  });

  it('includes problem spot descriptions', () => {
    const analysis = createTestAnalysis();
    const problemSpots = createTestProblemSpots();

    const prompt = createSuggestionPrompt(analysis, problemSpots);

    expect(prompt).toContain('stress_mismatch');
    expect(prompt).toContain('Stressed syllable "love" on weak beat');
    expect(prompt).toContain('Consonant cluster in "promises"');
  });

  it('includes meter and rhyme information', () => {
    const analysis = createTestAnalysis();
    const problemSpots = createTestProblemSpots();

    const prompt = createSuggestionPrompt(analysis, problemSpots);

    expect(prompt).toContain('iambic_tetrameter');
    expect(prompt).toContain('AABB');
  });

  it('includes emotional context', () => {
    const analysis = createTestAnalysis();
    const problemSpots = createTestProblemSpots();

    const prompt = createSuggestionPrompt(analysis, problemSpots);

    expect(prompt).toContain('peaceful');
    expect(prompt).toContain('contemplative');
  });

  it('respects maxSuggestions option', () => {
    const analysis = createTestAnalysis();
    const problemSpots = createTestProblemSpots();

    const prompt = createSuggestionPrompt(analysis, problemSpots, { maxSuggestions: 5 });

    expect(prompt).toContain('5');
  });

  it('uses default maxSuggestions of 10', () => {
    const analysis = createTestAnalysis();
    const problemSpots = createTestProblemSpots();

    const prompt = createSuggestionPrompt(analysis, problemSpots);

    expect(prompt).toContain('Maximum 10 suggestions');
  });

  it('includes JSON output format specification', () => {
    const analysis = createTestAnalysis();
    const problemSpots = createTestProblemSpots();

    const prompt = createSuggestionPrompt(analysis, problemSpots);

    expect(prompt).toContain('originalWord');
    expect(prompt).toContain('suggestedWord');
    expect(prompt).toContain('lineNumber');
    expect(prompt).toContain('preservesMeaning');
  });

  it('handles empty problem spots', () => {
    const analysis = createTestAnalysis();

    const prompt = createSuggestionPrompt(analysis, []);

    expect(prompt).toContain('No specific problem spots identified');
  });
});

describe('createSuggestionPromptFromAnalysis', () => {
  it('extracts problem spots from analysis', () => {
    const analysis = createTestAnalysis();
    analysis.problems = [
      {
        line: 1,
        position: 0,
        type: 'stress_mismatch',
        severity: 'high',
        description: 'Test problem',
      },
    ];

    const prompt = createSuggestionPromptFromAnalysis(analysis);

    expect(prompt).toContain('Test problem');
    expect(prompt).toContain('stress_mismatch');
  });

  it('handles analysis with no problems', () => {
    const analysis = createTestAnalysis();
    analysis.problems = [];

    const prompt = createSuggestionPromptFromAnalysis(analysis);

    expect(prompt).toContain('No specific problem spots identified');
  });
});

// =============================================================================
// createAnalysisPrompt Tests
// =============================================================================

describe('createAnalysisPrompt', () => {
  it('creates a combined analysis prompt', () => {
    const poem = 'The woods are lovely, dark and deep';
    const quantitativeData = {
      syllableCounts: [8],
      stressPatterns: ['01010101'],
      rhymeScheme: 'AABB',
      meterType: 'iambic_tetrameter',
      emotionalScores: {
        sentiment: 0.3,
        arousal: 0.4,
        dominantEmotions: ['peaceful'],
      },
      singabilityScores: [0.8],
    };

    const prompt = createAnalysisPrompt(poem, quantitativeData);

    expect(prompt).toContain('The woods are lovely, dark and deep');
    expect(prompt).toContain('0.30'); // sentiment
    expect(prompt).toContain('0.40'); // arousal
    expect(prompt).toContain('peaceful');
  });

  it('includes both emotional and meaning analysis sections', () => {
    const poem = 'Test poem';
    const quantitativeData = {
      syllableCounts: [2],
      stressPatterns: ['01'],
      rhymeScheme: 'XX',
      meterType: 'irregular',
      emotionalScores: {
        sentiment: 0,
        arousal: 0.5,
        dominantEmotions: [],
      },
      singabilityScores: [0.5],
    };

    const prompt = createAnalysisPrompt(poem, quantitativeData);

    expect(prompt).toContain('emotional');
    expect(prompt).toContain('meaning');
    expect(prompt).toContain('primaryTheme');
    expect(prompt).toContain('coreTheme');
  });

  it('requests combined JSON output', () => {
    const poem = 'Test';
    const quantitativeData = {
      syllableCounts: [],
      stressPatterns: [],
      rhymeScheme: '',
      meterType: '',
      emotionalScores: { sentiment: 0, arousal: 0, dominantEmotions: [] },
      singabilityScores: [],
    };

    const prompt = createAnalysisPrompt(poem, quantitativeData);

    expect(prompt).toContain('Combined Output Format');
    expect(prompt).toContain('"summary"');
    expect(prompt).toContain('"confidence"');
  });
});

describe('createEmotionalInterpretationPrompt', () => {
  it('includes sentiment and arousal values', () => {
    const poem = 'A poem about joy';
    const quantitativeData = {
      syllableCounts: [],
      stressPatterns: [],
      rhymeScheme: '',
      meterType: '',
      emotionalScores: {
        sentiment: 0.75,
        arousal: 0.6,
        dominantEmotions: ['happy', 'hopeful'],
      },
      singabilityScores: [],
    };

    const prompt = createEmotionalInterpretationPrompt(poem, quantitativeData);

    expect(prompt).toContain('0.75');
    expect(prompt).toContain('0.60');
    expect(prompt).toContain('happy, hopeful');
  });

  it('handles empty dominant emotions', () => {
    const poem = 'Neutral poem';
    const quantitativeData = {
      syllableCounts: [],
      stressPatterns: [],
      rhymeScheme: '',
      meterType: '',
      emotionalScores: {
        sentiment: 0,
        arousal: 0.5,
        dominantEmotions: [],
      },
      singabilityScores: [],
    };

    const prompt = createEmotionalInterpretationPrompt(poem, quantitativeData);

    expect(prompt).toContain('none');
  });

  it('requests musical implications in output', () => {
    const poem = 'Test';
    const quantitativeData = {
      syllableCounts: [],
      stressPatterns: [],
      rhymeScheme: '',
      meterType: '',
      emotionalScores: { sentiment: 0, arousal: 0, dominantEmotions: [] },
      singabilityScores: [],
    };

    const prompt = createEmotionalInterpretationPrompt(poem, quantitativeData);

    expect(prompt).toContain('musicalImplications');
    expect(prompt).toContain('tempoFeel');
    expect(prompt).toContain('dynamicApproach');
  });
});

describe('createMeaningPreservationPrompt', () => {
  it('includes poem and analysis context', () => {
    const prompt = createMeaningPreservationPrompt(
      'Shall I compare thee to a summer\'s day',
      'iambic_pentameter',
      'ABAB',
      ['loving', 'admiring'],
      'Sonnet 18'
    );

    expect(prompt).toContain("Shall I compare thee to a summer's day");
    expect(prompt).toContain('iambic_pentameter');
    expect(prompt).toContain('ABAB');
    expect(prompt).toContain('loving, admiring');
    expect(prompt).toContain('Sonnet 18');
  });

  it('uses default title when not provided', () => {
    const prompt = createMeaningPreservationPrompt(
      'Test poem',
      'iambic',
      'AABB',
      ['peaceful']
    );

    expect(prompt).toContain('Untitled');
  });

  it('requests essential and flexible elements', () => {
    const prompt = createMeaningPreservationPrompt(
      'Test',
      'trochaic',
      'ABAB',
      []
    );

    expect(prompt).toContain('essentialElements');
    expect(prompt).toContain('flexibleElements');
    expect(prompt).toContain('authorVoice');
  });
});

describe('createMelodyFeedbackPrompt', () => {
  it('includes melody and lyrics', () => {
    const analysis = createTestAnalysis();

    const prompt = createMelodyFeedbackPrompt(
      'The woods are lovely',
      'X:1\nK:C\nC D E F |',
      { key: 'C', timeSignature: '4/4', tempo: 100 },
      analysis
    );

    expect(prompt).toContain('The woods are lovely');
    expect(prompt).toContain('C D E F');
  });

  it('includes melody parameters', () => {
    const analysis = createTestAnalysis();

    const prompt = createMelodyFeedbackPrompt(
      'Test lyrics',
      'X:1\nK:G\nG A B |',
      { key: 'G', timeSignature: '3/4', tempo: 120 },
      analysis
    );

    expect(prompt).toContain('Key: G');
    expect(prompt).toContain('3/4');
    expect(prompt).toContain('120 BPM');
  });

  it('includes emotional context from analysis', () => {
    const analysis = createTestAnalysis();

    const prompt = createMelodyFeedbackPrompt(
      'Test',
      'X:1\nK:C\nC |',
      { key: 'C', timeSignature: '4/4', tempo: 100 },
      analysis
    );

    expect(prompt).toContain('peaceful');
    expect(prompt).toContain('0.20'); // sentiment
  });

  it('includes stress alignment information', () => {
    const analysis = createTestAnalysis();

    const prompt = createMelodyFeedbackPrompt(
      'Test',
      'X:1\nK:C\nC |',
      { key: 'C', timeSignature: '4/4', tempo: 100 },
      analysis
    );

    expect(prompt).toContain('01010101');
    expect(prompt).toContain('The woods are lovely');
  });
});

// =============================================================================
// Context Builder Tests
// =============================================================================

describe('buildSuggestionContext', () => {
  it('builds context from analysis', () => {
    const analysis = createTestAnalysis();
    analysis.problems = [
      {
        line: 1,
        position: 0,
        type: 'stress_mismatch',
        severity: 'high',
        description: 'Test',
      },
    ];

    const context = buildSuggestionContext(analysis);

    expect(context.originalPoem).toContain('The woods are lovely');
    expect(context.analysis).toBe(analysis);
    expect(context.problemSpots).toHaveLength(1);
    expect(context.problemSpots[0].type).toBe('stress_mismatch');
  });

  it('reconstructs poem from stanzas', () => {
    const analysis = createDefaultPoemAnalysis();
    analysis.structure.stanzas = [
      {
        lines: [
          { text: 'Line 1', words: [], stressPattern: '', syllableCount: 0, singability: { syllableScores: [], lineScore: 0, problemSpots: [] } },
          { text: 'Line 2', words: [], stressPattern: '', syllableCount: 0, singability: { syllableScores: [], lineScore: 0, problemSpots: [] } },
        ],
      },
      {
        lines: [
          { text: 'Line 3', words: [], stressPattern: '', syllableCount: 0, singability: { syllableScores: [], lineScore: 0, problemSpots: [] } },
        ],
      },
    ];

    const context = buildSuggestionContext(analysis);

    expect(context.originalPoem).toContain('Line 1');
    expect(context.originalPoem).toContain('Line 2');
    expect(context.originalPoem).toContain('Line 3');
  });
});

describe('buildAnalysisContext', () => {
  it('builds context with quantitative data', () => {
    const poem = 'Test poem text';
    const analysis = createTestAnalysis();

    const context = buildAnalysisContext(poem, analysis);

    expect(context.poem).toBe(poem);
    expect(context.quantitativeData.meterType).toBe('iambic_tetrameter');
    expect(context.quantitativeData.rhymeScheme).toBe('AABB');
  });

  it('extracts all quantitative fields', () => {
    const poem = 'Test';
    const analysis = createTestAnalysis();

    const context = buildAnalysisContext(poem, analysis);
    const data = context.quantitativeData;

    expect(data).toHaveProperty('syllableCounts');
    expect(data).toHaveProperty('stressPatterns');
    expect(data).toHaveProperty('rhymeScheme');
    expect(data).toHaveProperty('meterType');
    expect(data).toHaveProperty('emotionalScores');
    expect(data).toHaveProperty('singabilityScores');
  });
});

// =============================================================================
// Utility Function Tests
// =============================================================================

describe('estimateTokenCount', () => {
  it('estimates tokens for short text', () => {
    const tokens = estimateTokenCount('Hello world');
    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBeLessThan(10);
  });

  it('estimates tokens for longer text', () => {
    const longText = 'This is a longer piece of text '.repeat(100);
    const tokens = estimateTokenCount(longText);

    // Rough estimate: 4 chars per token
    expect(tokens).toBeGreaterThan(500);
    expect(tokens).toBeLessThan(1000);
  });

  it('handles empty string', () => {
    const tokens = estimateTokenCount('');
    expect(tokens).toBe(0);
  });

  it('returns integer values', () => {
    const tokens = estimateTokenCount('Test text here');
    expect(Number.isInteger(tokens)).toBe(true);
  });
});

describe('truncatePromptIfNeeded', () => {
  it('does not truncate short prompts', () => {
    const shortPrompt = 'This is a short prompt';
    const result = truncatePromptIfNeeded(shortPrompt);

    expect(result.wasTruncated).toBe(false);
    expect(result.prompt).toBe(shortPrompt);
    expect(result.message).toBe('');
  });

  it('truncates very long prompts', () => {
    const longPrompt = 'Test content. '.repeat(100000); // Very long
    const result = truncatePromptIfNeeded(longPrompt, 100); // Very small limit

    expect(result.wasTruncated).toBe(true);
    expect(result.prompt.length).toBeLessThan(longPrompt.length);
    expect(result.message).toContain('truncated');
  });

  it('adds truncation notice to truncated prompts', () => {
    const longPrompt = 'Test content. '.repeat(100000);
    const result = truncatePromptIfNeeded(longPrompt, 100);

    expect(result.prompt).toContain('[Content truncated');
  });

  it('preserves section structure when truncating', () => {
    const prompt =
      'Section 1\n\nThis is paragraph one.\n\nSection 2\n\nThis is paragraph two.\n\n' +
      'Very long content here. '.repeat(50000);

    const result = truncatePromptIfNeeded(prompt, 200);

    if (result.wasTruncated) {
      // Should break at a paragraph boundary if possible
      expect(result.prompt).toMatch(/\n\n\[Content truncated/);
    }
  });

  it('respects custom token limit', () => {
    const prompt = 'Test. '.repeat(1000);
    const result1 = truncatePromptIfNeeded(prompt, 500);
    const result2 = truncatePromptIfNeeded(prompt, 100);

    if (result1.wasTruncated && result2.wasTruncated) {
      expect(result1.prompt.length).toBeGreaterThan(result2.prompt.length);
    }
  });

  it('handles empty prompt', () => {
    const result = truncatePromptIfNeeded('');

    expect(result.wasTruncated).toBe(false);
    expect(result.prompt).toBe('');
  });
});
