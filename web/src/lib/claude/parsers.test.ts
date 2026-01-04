/**
 * Tests for Claude Response Parsers
 *
 * @module lib/claude/parsers.test
 */

import { describe, it, expect } from 'vitest';
import {
  extractJSON,
  safeJSONParse,
  parseSuggestionResponse,
  parseAnalysisResponse,
  parseMelodyFeedbackResponse,
  validateResponse,
  combineMetadata,
} from './parsers';
import type { ResponseMetadata } from './types';

// =============================================================================
// extractJSON Tests
// =============================================================================

describe('extractJSON', () => {
  it('extracts JSON from markdown code block', () => {
    const response = `Here is the response:
\`\`\`json
{"key": "value"}
\`\`\``;

    const result = extractJSON(response);

    expect(result).toBe('{"key": "value"}');
  });

  it('extracts JSON from generic code block', () => {
    const response = `\`\`\`
[1, 2, 3]
\`\`\``;

    const result = extractJSON(response);

    expect(result).toBe('[1, 2, 3]');
  });

  it('extracts raw JSON object', () => {
    const response = 'Here is some text {"key": "value"} and more text';

    const result = extractJSON(response);

    expect(result).toBe('{"key": "value"}');
  });

  it('extracts raw JSON array', () => {
    const response = 'Some text [1, 2, 3] more text';

    const result = extractJSON(response);

    expect(result).toBe('[1, 2, 3]');
  });

  it('handles response that is just JSON', () => {
    const response = '{"simple": true}';

    const result = extractJSON(response);

    expect(result).toBe('{"simple": true}');
  });

  it('returns null for empty response', () => {
    expect(extractJSON('')).toBe(null);
    expect(extractJSON('   ')).toBe(null);
  });

  it('returns null for null/undefined', () => {
    expect(extractJSON(null as unknown as string)).toBe(null);
    expect(extractJSON(undefined as unknown as string)).toBe(null);
  });

  it('returns null for response without JSON', () => {
    const response = 'This is just plain text without any JSON';

    expect(extractJSON(response)).toBe(null);
  });

  it('handles nested JSON objects', () => {
    const response = `\`\`\`json
{"outer": {"inner": "value"}}
\`\`\``;

    const result = extractJSON(response);

    expect(result).toBe('{"outer": {"inner": "value"}}');
  });

  it('handles multiline JSON', () => {
    const response = `\`\`\`json
{
  "key": "value",
  "array": [1, 2, 3]
}
\`\`\``;

    const result = extractJSON(response);

    expect(result).toContain('"key": "value"');
    expect(result).toContain('"array": [1, 2, 3]');
  });
});

describe('safeJSONParse', () => {
  it('parses valid JSON', () => {
    const result = safeJSONParse<{ key: string }>('{"key": "value"}');

    expect(result).toEqual({ key: 'value' });
  });

  it('returns null for invalid JSON', () => {
    const result = safeJSONParse('not json');

    expect(result).toBe(null);
  });

  it('fixes trailing commas', () => {
    const result = safeJSONParse<{ key: string }>('{"key": "value",}');

    expect(result).toEqual({ key: 'value' });
  });

  it('parses arrays', () => {
    const result = safeJSONParse<number[]>('[1, 2, 3]');

    expect(result).toEqual([1, 2, 3]);
  });

  it('handles nested structures', () => {
    const result = safeJSONParse<{ a: { b: number } }>('{"a": {"b": 1}}');

    expect(result).toEqual({ a: { b: 1 } });
  });

  it('returns null for empty string', () => {
    expect(safeJSONParse('')).toBe(null);
  });
});

// =============================================================================
// parseSuggestionResponse Tests
// =============================================================================

describe('parseSuggestionResponse', () => {
  it('parses valid suggestion array', () => {
    const response = `\`\`\`json
[
  {
    "originalWord": "beautiful",
    "suggestedWord": "lovely",
    "lineNumber": 1,
    "position": 2,
    "reason": "Fewer syllables",
    "preservesMeaning": "yes"
  }
]
\`\`\``;

    const { suggestions, metadata } = parseSuggestionResponse(response);

    expect(metadata.success).toBe(true);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].originalWord).toBe('beautiful');
    expect(suggestions[0].suggestedWord).toBe('lovely');
    expect(suggestions[0].preservesMeaning).toBe('yes');
  });

  it('parses multiple suggestions', () => {
    const response = `[
      {"originalWord": "a", "suggestedWord": "b", "lineNumber": 1, "position": 0, "reason": "r1", "preservesMeaning": "yes"},
      {"originalWord": "c", "suggestedWord": "d", "lineNumber": 2, "position": 1, "reason": "r2", "preservesMeaning": "partial"}
    ]`;

    const { suggestions, metadata } = parseSuggestionResponse(response);

    expect(metadata.success).toBe(true);
    expect(suggestions).toHaveLength(2);
    expect(suggestions[0].originalWord).toBe('a');
    expect(suggestions[1].originalWord).toBe('c');
  });

  it('handles wrapper object with suggestions array', () => {
    const response = `{
      "suggestions": [
        {"originalWord": "x", "suggestedWord": "y", "lineNumber": 1, "position": 0, "reason": "test", "preservesMeaning": "yes"}
      ]
    }`;

    const { suggestions, metadata } = parseSuggestionResponse(response);

    expect(metadata.success).toBe(true);
    expect(suggestions).toHaveLength(1);
  });

  it('handles single suggestion object', () => {
    const response = `{
      "originalWord": "single",
      "suggestedWord": "one",
      "lineNumber": 1,
      "position": 0,
      "reason": "only one",
      "preservesMeaning": "yes"
    }`;

    const { suggestions, metadata } = parseSuggestionResponse(response);

    expect(metadata.success).toBe(true);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].originalWord).toBe('single');
  });

  it('salvages partial suggestions', () => {
    const response = `[
      {"originalWord": "test", "suggestedWord": "example"}
    ]`;

    const { suggestions, metadata } = parseSuggestionResponse(response);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].originalWord).toBe('test');
    expect(suggestions[0].suggestedWord).toBe('example');
    expect(suggestions[0].lineNumber).toBe(0); // default
    expect(suggestions[0].preservesMeaning).toBe('partial'); // default for salvaged
    expect(metadata.warnings.length).toBeGreaterThan(0);
  });

  it('removes duplicate suggestions', () => {
    const response = `[
      {"originalWord": "dup", "suggestedWord": "a", "lineNumber": 1, "position": 0, "reason": "first", "preservesMeaning": "yes"},
      {"originalWord": "dup", "suggestedWord": "b", "lineNumber": 1, "position": 0, "reason": "second", "preservesMeaning": "yes"}
    ]`;

    const { suggestions, metadata } = parseSuggestionResponse(response);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].suggestedWord).toBe('a'); // keeps first
    expect(metadata.warnings).toContainEqual(expect.stringContaining('Duplicate'));
  });

  it('returns error for empty response', () => {
    const { suggestions, metadata } = parseSuggestionResponse('');

    expect(metadata.success).toBe(false);
    expect(metadata.errors).toContainEqual('Empty response received');
    expect(suggestions).toEqual([]);
  });

  it('returns error for response without JSON', () => {
    const { suggestions, metadata } = parseSuggestionResponse('No JSON here');

    expect(metadata.success).toBe(false);
    expect(metadata.errors).toContainEqual('No JSON found in response');
    expect(suggestions).toEqual([]);
  });

  it('returns error for invalid JSON', () => {
    const { suggestions, metadata } = parseSuggestionResponse('{invalid json}');

    expect(metadata.success).toBe(false);
    expect(suggestions).toEqual([]);
  });

  it('sets originalLength in metadata', () => {
    const response = '[{"originalWord": "a", "suggestedWord": "b", "lineNumber": 1, "position": 0, "reason": "r", "preservesMeaning": "yes"}]';

    const { metadata } = parseSuggestionResponse(response);

    expect(metadata.originalLength).toBe(response.length);
  });
});

// =============================================================================
// parseAnalysisResponse Tests
// =============================================================================

describe('parseAnalysisResponse', () => {
  it('parses valid analysis response', () => {
    const response = `\`\`\`json
{
  "emotional": {
    "primaryTheme": "nostalgia",
    "secondaryThemes": ["hope"],
    "emotionalJourney": "From sadness to acceptance",
    "keyImagery": ["autumn leaves"],
    "mood": "contemplative"
  },
  "meaning": {
    "coreTheme": "Passage of time",
    "essentialElements": ["imagery"],
    "flexibleElements": ["details"],
    "authorVoice": "Reflective"
  },
  "summary": "A reflective piece",
  "confidence": 0.85
}
\`\`\``;

    const { analysis, metadata } = parseAnalysisResponse(response);

    expect(metadata.success).toBe(true);
    expect(analysis.emotional.primaryTheme).toBe('nostalgia');
    expect(analysis.meaning.coreTheme).toBe('Passage of time');
    expect(analysis.summary).toBe('A reflective piece');
    expect(analysis.confidence).toBe(0.85);
  });

  it('normalizes confidence to 0-1 range', () => {
    const response = `{
      "emotional": {"primaryTheme": "", "secondaryThemes": [], "emotionalJourney": "", "keyImagery": [], "mood": ""},
      "meaning": {"coreTheme": "", "essentialElements": [], "flexibleElements": [], "authorVoice": ""},
      "summary": "",
      "confidence": 1.5
    }`;

    const { analysis } = parseAnalysisResponse(response);

    expect(analysis.confidence).toBe(1);
  });

  it('salvages partial emotional analysis', () => {
    const response = `{
      "emotional": {
        "primaryTheme": "joy"
      },
      "meaning": {},
      "summary": "Test"
    }`;

    const { analysis, metadata } = parseAnalysisResponse(response);

    expect(analysis.emotional.primaryTheme).toBe('joy');
    expect(analysis.emotional.secondaryThemes).toEqual([]);
    expect(metadata.warnings.length).toBeGreaterThan(0);
  });

  it('salvages partial meaning analysis', () => {
    const response = `{
      "emotional": {},
      "meaning": {
        "coreTheme": "love"
      },
      "summary": ""
    }`;

    const { analysis } = parseAnalysisResponse(response);

    expect(analysis.meaning.coreTheme).toBe('love');
    expect(analysis.meaning.essentialElements).toEqual([]);
  });

  it('returns default for empty response', () => {
    const { analysis, metadata } = parseAnalysisResponse('');

    expect(metadata.success).toBe(false);
    expect(analysis.emotional.primaryTheme).toBe('');
    expect(analysis.meaning.coreTheme).toBe('');
    expect(analysis.summary).toBe('');
    expect(analysis.confidence).toBe(0);
  });

  it('returns default for invalid structure', () => {
    const response = '{"unrelated": "data"}';

    const { analysis, metadata } = parseAnalysisResponse(response);

    expect(metadata.success).toBe(false);
    expect(analysis.emotional.primaryTheme).toBe('');
  });

  it('handles arrays that should be arrays', () => {
    const response = `{
      "emotional": {
        "primaryTheme": "test",
        "secondaryThemes": "not-an-array",
        "emotionalJourney": "",
        "keyImagery": [],
        "mood": ""
      },
      "meaning": {
        "coreTheme": "",
        "essentialElements": [],
        "flexibleElements": [],
        "authorVoice": ""
      },
      "summary": "",
      "confidence": 0.5
    }`;

    const { analysis } = parseAnalysisResponse(response);

    // Should normalize to array
    expect(Array.isArray(analysis.emotional.secondaryThemes)).toBe(true);
  });
});

// =============================================================================
// parseMelodyFeedbackResponse Tests
// =============================================================================

describe('parseMelodyFeedbackResponse', () => {
  it('parses valid feedback response', () => {
    const response = `\`\`\`json
{
  "emotionalFit": "good",
  "observations": ["Melody rises with emotion"],
  "improvements": ["Consider longer note on 'love'"],
  "highlights": ["Phrase ending is effective"]
}
\`\`\``;

    const { feedback, metadata } = parseMelodyFeedbackResponse(response);

    expect(metadata.success).toBe(true);
    expect(feedback.emotionalFit).toBe('good');
    expect(feedback.observations).toContain('Melody rises with emotion');
    expect(feedback.improvements).toContain("Consider longer note on 'love'");
    expect(feedback.highlights).toContain('Phrase ending is effective');
  });

  it('handles all emotionalFit values', () => {
    const values = ['excellent', 'good', 'adequate', 'poor'];

    for (const value of values) {
      const response = `{
        "emotionalFit": "${value}",
        "observations": [],
        "improvements": [],
        "highlights": []
      }`;

      const { feedback, metadata } = parseMelodyFeedbackResponse(response);

      expect(metadata.success).toBe(true);
      expect(feedback.emotionalFit).toBe(value);
    }
  });

  it('salvages feedback with overallAssessment', () => {
    const response = `{
      "emotionalFit": "good",
      "overallAssessment": "The melody works well"
    }`;

    const { feedback, metadata } = parseMelodyFeedbackResponse(response);

    expect(feedback.observations).toContain('The melody works well');
    expect(metadata.warnings.length).toBeGreaterThan(0);
  });

  it('returns default emotionalFit for invalid value', () => {
    const response = `{
      "emotionalFit": "great",
      "observations": ["test"]
    }`;

    const { feedback } = parseMelodyFeedbackResponse(response);

    expect(feedback.emotionalFit).toBe('adequate'); // default
  });

  it('returns default for empty response', () => {
    const { feedback, metadata } = parseMelodyFeedbackResponse('');

    expect(metadata.success).toBe(false);
    expect(feedback.emotionalFit).toBe('adequate');
    expect(feedback.observations).toEqual([]);
  });

  it('normalizes arrays', () => {
    const response = `{
      "emotionalFit": "good",
      "observations": "should be array",
      "improvements": [],
      "highlights": []
    }`;

    const { feedback } = parseMelodyFeedbackResponse(response);

    expect(Array.isArray(feedback.observations)).toBe(true);
  });
});

// =============================================================================
// Utility Function Tests
// =============================================================================

describe('validateResponse', () => {
  it('validates suggestion response correctly', () => {
    const response = '{"originalWord": "a", "suggestedWord": "b"}';

    const result = validateResponse(response, 'suggestion');

    expect(result.hasJSON).toBe(true);
    expect(result.estimatedContent).toBe('suggestion');
    expect(result.isValid).toBe(true);
  });

  it('validates analysis response correctly', () => {
    const response = '{"emotional": {}, "meaning": {}}';

    const result = validateResponse(response, 'analysis');

    expect(result.hasJSON).toBe(true);
    expect(result.estimatedContent).toBe('analysis');
    expect(result.isValid).toBe(true);
  });

  it('validates feedback response correctly', () => {
    const response = '{"emotionalFit": "good", "improvements": []}';

    const result = validateResponse(response, 'feedback');

    expect(result.hasJSON).toBe(true);
    expect(result.estimatedContent).toBe('feedback');
    expect(result.isValid).toBe(true);
  });

  it('detects invalid response type', () => {
    // Must have BOTH originalWord and suggestedWord to be detected as suggestion
    const response = '{"originalWord": "a", "suggestedWord": "b"}';

    const result = validateResponse(response, 'feedback'); // but expecting feedback

    expect(result.isValid).toBe(false);
    expect(result.estimatedContent).toBe('suggestion');
  });

  it('handles response without JSON', () => {
    const result = validateResponse('No JSON here', 'suggestion');

    expect(result.hasJSON).toBe(false);
    expect(result.isValid).toBe(false);
    expect(result.estimatedContent).toBe('unknown');
  });
});

describe('combineMetadata', () => {
  it('combines multiple metadata objects', () => {
    const meta1: ResponseMetadata = {
      success: true,
      errors: ['error1'],
      warnings: ['warning1'],
      originalLength: 100,
    };
    const meta2: ResponseMetadata = {
      success: true,
      errors: [],
      warnings: ['warning2'],
      originalLength: 200,
    };

    const combined = combineMetadata([meta1, meta2]);

    expect(combined.errors).toContain('error1');
    expect(combined.warnings).toContain('warning1');
    expect(combined.warnings).toContain('warning2');
    expect(combined.originalLength).toBe(300);
  });

  it('success is true only if all are successful', () => {
    const allSuccess = combineMetadata([
      { success: true, errors: [], warnings: [], originalLength: 0 },
      { success: true, errors: [], warnings: [], originalLength: 0 },
    ]);
    expect(allSuccess.success).toBe(true);

    const oneFailure = combineMetadata([
      { success: true, errors: [], warnings: [], originalLength: 0 },
      { success: false, errors: ['fail'], warnings: [], originalLength: 0 },
    ]);
    expect(oneFailure.success).toBe(false);
  });

  it('handles empty array', () => {
    const combined = combineMetadata([]);

    expect(combined.success).toBe(true);
    expect(combined.errors).toEqual([]);
    expect(combined.warnings).toEqual([]);
    expect(combined.originalLength).toBe(0);
  });

  it('handles single metadata', () => {
    const single: ResponseMetadata = {
      success: false,
      errors: ['one'],
      warnings: ['two'],
      originalLength: 50,
    };

    const combined = combineMetadata([single]);

    expect(combined.success).toBe(false);
    expect(combined.errors).toEqual(['one']);
    expect(combined.warnings).toEqual(['two']);
    expect(combined.originalLength).toBe(50);
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Integration: Real-world Response Parsing', () => {
  it('handles Claude-style markdown response with suggestions', () => {
    const response = `Based on the poem analysis, here are my suggestions:

\`\`\`json
[
  {
    "originalWord": "beautiful",
    "suggestedWord": "lovely",
    "lineNumber": 2,
    "position": 3,
    "reason": "The word 'lovely' has two syllables instead of three, which fits the iambic pattern better while maintaining the positive connotation.",
    "preservesMeaning": "yes"
  },
  {
    "originalWord": "approximately",
    "suggestedWord": "about",
    "lineNumber": 5,
    "position": 0,
    "reason": "Reducing syllables from 5 to 2 dramatically improves singability without losing meaning.",
    "preservesMeaning": "yes"
  }
]
\`\`\`

These suggestions prioritize singability while preserving the poem's meaning.`;

    const { suggestions, metadata } = parseSuggestionResponse(response);

    expect(metadata.success).toBe(true);
    expect(suggestions).toHaveLength(2);
    expect(suggestions[0].originalWord).toBe('beautiful');
    expect(suggestions[1].originalWord).toBe('approximately');
  });

  it('handles Claude-style analysis response', () => {
    const response = `I've analyzed the poem and here are my findings:

\`\`\`json
{
  "emotional": {
    "primaryTheme": "Bittersweet nostalgia",
    "secondaryThemes": ["Loss", "Hope for renewal"],
    "emotionalJourney": "The poem moves from melancholy reflection to tentative optimism",
    "keyImagery": ["Autumn leaves", "Empty chair", "Morning light"],
    "mood": "Contemplative with hints of quiet hope"
  },
  "meaning": {
    "coreTheme": "The passage of time and the persistence of memory",
    "essentialElements": [
      "The seasonal imagery representing life cycles",
      "The specific domestic details that ground the emotional content",
      "The turn in the final stanza"
    ],
    "flexibleElements": [
      "Minor descriptive adjectives",
      "Transitional phrases"
    ],
    "authorVoice": "Intimate first-person, using conversational language with occasional elevated diction"
  },
  "summary": "This poem explores memory and loss through domestic imagery, moving from reflection to acceptance.",
  "confidence": 0.88
}
\`\`\`

I hope this analysis helps with the lyric adaptation process.`;

    const { analysis, metadata } = parseAnalysisResponse(response);

    expect(metadata.success).toBe(true);
    expect(analysis.emotional.primaryTheme).toBe('Bittersweet nostalgia');
    expect(analysis.meaning.coreTheme).toBe('The passage of time and the persistence of memory');
    expect(analysis.confidence).toBe(0.88);
  });

  it('handles response with explanatory text before and after JSON', () => {
    const response = `Let me provide feedback on the melody:

{
  "emotionalFit": "good",
  "observations": [
    "The melodic contour follows the emotional arc of the text",
    "Stressed syllables are generally placed on strong beats"
  ],
  "improvements": [
    "The leap in measure 3 feels abrupt",
    "Consider a more gradual rise to the climax"
  ],
  "highlights": [
    "The resolution at the end is particularly satisfying",
    "Good use of repetition to reinforce the main theme"
  ]
}

I hope this feedback helps you refine the melody!`;

    const { feedback, metadata } = parseMelodyFeedbackResponse(response);

    expect(metadata.success).toBe(true);
    expect(feedback.emotionalFit).toBe('good');
    expect(feedback.observations).toHaveLength(2);
    expect(feedback.improvements).toHaveLength(2);
    expect(feedback.highlights).toHaveLength(2);
  });
});
