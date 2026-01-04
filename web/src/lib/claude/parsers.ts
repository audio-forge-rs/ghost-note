/**
 * Ghost Note - Claude Response Parsers
 *
 * Functions for parsing Claude's responses into structured data.
 * Handles various response formats and edge cases that may occur
 * when parsing AI-generated content.
 *
 * @module lib/claude/parsers
 */

import type {
  Suggestion,
  QualitativeAnalysis,
  MelodyFeedback,
  ResponseMetadata,
} from './types';
import {
  isSuggestion,
  isQualitativeAnalysis,
  isMelodyFeedback,
  createDefaultSuggestion,
  createDefaultQualitativeAnalysis,
  createDefaultMelodyFeedback,
  createDefaultResponseMetadata,
} from './types';

// =============================================================================
// JSON Extraction Utilities
// =============================================================================

/**
 * Extracts JSON from a response that may contain markdown code blocks
 * or other surrounding text.
 *
 * @param response - The raw response string
 * @returns Extracted JSON string, or null if no JSON found
 */
export function extractJSON(response: string): string | null {
  if (!response || typeof response !== 'string') {
    console.log('[claude/parsers] extractJSON: received empty or invalid response');
    return null;
  }

  const trimmed = response.trim();

  // Try to find JSON in code blocks first
  const codeBlockPatterns = [
    /```json\s*([\s\S]*?)\s*```/i,
    /```\s*([\s\S]*?)\s*```/,
  ];

  for (const pattern of codeBlockPatterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      const extracted = match[1].trim();
      // Verify it starts with { or [
      if (extracted.startsWith('{') || extracted.startsWith('[')) {
        console.log(`[claude/parsers] extractJSON: found JSON in code block (${extracted.length} chars)`);
        return extracted;
      }
    }
  }

  // If the response itself starts like JSON, return it directly
  // This should be checked before regex-based extraction
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    console.log(`[claude/parsers] extractJSON: response is raw JSON (${trimmed.length} chars)`);
    return trimmed;
  }

  // Try to find raw JSON (object or array) embedded in text
  // Check for objects FIRST - they're more common as top-level responses
  // and arrays can be mistakenly matched from within objects
  const objectMatch = trimmed.match(/(\{[\s\S]*\})/);
  if (objectMatch && objectMatch[1]) {
    const extracted = objectMatch[1].trim();
    console.log(`[claude/parsers] extractJSON: found raw JSON object (${extracted.length} chars)`);
    return extracted;
  }

  // Check for arrays if no object found
  const arrayMatch = trimmed.match(/(\[[\s\S]*\])/);
  if (arrayMatch && arrayMatch[1]) {
    const extracted = arrayMatch[1].trim();
    console.log(`[claude/parsers] extractJSON: found raw JSON array (${extracted.length} chars)`);
    return extracted;
  }

  console.log('[claude/parsers] extractJSON: no JSON found in response');
  return null;
}

/**
 * Safely parses JSON with error handling and normalization.
 *
 * @param jsonString - The JSON string to parse
 * @returns Parsed object or null if parsing fails
 */
export function safeJSONParse<T>(jsonString: string): T | null {
  try {
    const parsed = JSON.parse(jsonString);
    return parsed as T;
  } catch (error) {
    console.log(
      `[claude/parsers] safeJSONParse: failed to parse JSON - ${error instanceof Error ? error.message : 'Unknown error'}`
    );

    // Try to fix common JSON issues
    try {
      // Remove trailing commas
      let fixed = jsonString.replace(/,\s*([\]}])/g, '$1');
      // Fix unquoted keys (simple cases)
      fixed = fixed.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');

      const parsed = JSON.parse(fixed);
      console.log('[claude/parsers] safeJSONParse: successfully parsed after fixes');
      return parsed as T;
    } catch {
      console.log('[claude/parsers] safeJSONParse: failed even after attempting fixes');
      return null;
    }
  }
}

// =============================================================================
// Suggestion Response Parsing
// =============================================================================

/**
 * Parses Claude's response for word substitution suggestions.
 *
 * Handles various response formats including:
 * - Clean JSON arrays
 * - JSON wrapped in markdown code blocks
 * - Responses with explanatory text around the JSON
 * - Single suggestion objects (wraps in array)
 *
 * @param response - Raw response from Claude
 * @returns Object containing parsed suggestions and metadata
 *
 * @example
 * ```typescript
 * const response = await sendToClaudeDesktop(prompt);
 * const { suggestions, metadata } = parseSuggestionResponse(response);
 *
 * if (metadata.success) {
 *   suggestions.forEach(s => console.log(`${s.originalWord} -> ${s.suggestedWord}`));
 * } else {
 *   console.error('Parsing errors:', metadata.errors);
 * }
 * ```
 */
export function parseSuggestionResponse(response: string): {
  suggestions: Suggestion[];
  metadata: ResponseMetadata;
} {
  console.log(`[claude/parsers] parseSuggestionResponse: parsing response (${response.length} chars)`);

  const metadata: ResponseMetadata = {
    ...createDefaultResponseMetadata(),
    originalLength: response.length,
  };

  const suggestions: Suggestion[] = [];

  // Handle empty response
  if (!response || response.trim().length === 0) {
    metadata.success = false;
    metadata.errors.push('Empty response received');
    return { suggestions, metadata };
  }

  // Extract JSON from response
  const jsonString = extractJSON(response);
  if (!jsonString) {
    metadata.success = false;
    metadata.errors.push('No JSON found in response');
    return { suggestions, metadata };
  }

  // Parse the JSON
  const parsed = safeJSONParse<unknown>(jsonString);
  if (!parsed) {
    metadata.success = false;
    metadata.errors.push('Failed to parse JSON');
    return { suggestions, metadata };
  }

  // Handle different response structures
  let suggestionArray: unknown[] = [];

  if (Array.isArray(parsed)) {
    suggestionArray = parsed;
  } else if (typeof parsed === 'object' && parsed !== null) {
    // Check if it's a wrapper object with suggestions array
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.suggestions)) {
      suggestionArray = obj.suggestions;
    } else if (isSuggestion(parsed)) {
      // Single suggestion object
      suggestionArray = [parsed];
    } else {
      metadata.success = false;
      metadata.errors.push('Response is not a suggestion or array of suggestions');
      return { suggestions, metadata };
    }
  }

  // Validate and extract each suggestion
  for (let i = 0; i < suggestionArray.length; i++) {
    const item = suggestionArray[i];

    if (isSuggestion(item)) {
      suggestions.push(item);
    } else {
      // Try to salvage partial suggestions
      const salvaged = salvageSuggestion(item);
      if (salvaged) {
        suggestions.push(salvaged);
        metadata.warnings.push(`Suggestion ${i + 1} required repair`);
      } else {
        metadata.warnings.push(`Suggestion ${i + 1} could not be parsed`);
      }
    }
  }

  // Check for duplicates
  const seen = new Set<string>();
  const uniqueSuggestions = suggestions.filter((s) => {
    const key = `${s.lineNumber}:${s.position}:${s.originalWord}`;
    if (seen.has(key)) {
      metadata.warnings.push(`Duplicate suggestion removed: ${s.originalWord}`);
      return false;
    }
    seen.add(key);
    return true;
  });

  console.log(
    `[claude/parsers] parseSuggestionResponse: extracted ${uniqueSuggestions.length} suggestions`
  );

  return {
    suggestions: uniqueSuggestions,
    metadata: {
      ...metadata,
      success: uniqueSuggestions.length > 0 || metadata.errors.length === 0,
    },
  };
}

/**
 * Attempts to salvage a partial suggestion object by filling in defaults.
 *
 * @param item - The partial suggestion object
 * @returns A valid Suggestion if salvageable, null otherwise
 */
function salvageSuggestion(item: unknown): Suggestion | null {
  if (typeof item !== 'object' || item === null) {
    return null;
  }

  const obj = item as Record<string, unknown>;

  // We need at least originalWord and suggestedWord
  if (typeof obj.originalWord !== 'string' || typeof obj.suggestedWord !== 'string') {
    return null;
  }

  const suggestion: Suggestion = {
    ...createDefaultSuggestion(),
    originalWord: obj.originalWord,
    suggestedWord: obj.suggestedWord,
    lineNumber: typeof obj.lineNumber === 'number' ? obj.lineNumber : 0,
    position: typeof obj.position === 'number' ? obj.position : 0,
    reason: typeof obj.reason === 'string' ? obj.reason : 'No reason provided',
    preservesMeaning:
      obj.preservesMeaning === 'yes' ||
      obj.preservesMeaning === 'partial' ||
      obj.preservesMeaning === 'no'
        ? obj.preservesMeaning
        : 'partial',
  };

  return suggestion;
}

// =============================================================================
// Qualitative Analysis Response Parsing
// =============================================================================

/**
 * Parses Claude's response for qualitative analysis.
 *
 * @param response - Raw response from Claude
 * @returns Object containing parsed analysis and metadata
 *
 * @example
 * ```typescript
 * const response = await sendToClaudeDesktop(analysisPrompt);
 * const { analysis, metadata } = parseAnalysisResponse(response);
 *
 * if (metadata.success) {
 *   console.log('Primary theme:', analysis.emotional.primaryTheme);
 *   console.log('Core meaning:', analysis.meaning.coreTheme);
 * }
 * ```
 */
export function parseAnalysisResponse(response: string): {
  analysis: QualitativeAnalysis;
  metadata: ResponseMetadata;
} {
  console.log(`[claude/parsers] parseAnalysisResponse: parsing response (${response.length} chars)`);

  const metadata: ResponseMetadata = {
    ...createDefaultResponseMetadata(),
    originalLength: response.length,
  };

  const defaultAnalysis = createDefaultQualitativeAnalysis();

  // Handle empty response
  if (!response || response.trim().length === 0) {
    metadata.success = false;
    metadata.errors.push('Empty response received');
    return { analysis: defaultAnalysis, metadata };
  }

  // Extract JSON from response
  const jsonString = extractJSON(response);
  if (!jsonString) {
    metadata.success = false;
    metadata.errors.push('No JSON found in response');
    return { analysis: defaultAnalysis, metadata };
  }

  // Parse the JSON
  const parsed = safeJSONParse<unknown>(jsonString);
  if (!parsed) {
    metadata.success = false;
    metadata.errors.push('Failed to parse JSON');
    return { analysis: defaultAnalysis, metadata };
  }

  // Validate the structure
  if (isQualitativeAnalysis(parsed)) {
    console.log('[claude/parsers] parseAnalysisResponse: successfully parsed complete analysis');
    return {
      analysis: normalizeQualitativeAnalysis(parsed),
      metadata: { ...metadata, success: true },
    };
  }

  // Try to salvage partial analysis
  const salvaged = salvageQualitativeAnalysis(parsed);
  if (salvaged) {
    metadata.warnings.push('Analysis required repair - some fields may have defaults');
    console.log('[claude/parsers] parseAnalysisResponse: salvaged partial analysis');
    return {
      analysis: salvaged,
      metadata: { ...metadata, success: true },
    };
  }

  metadata.success = false;
  metadata.errors.push('Response does not match expected analysis structure');
  return { analysis: defaultAnalysis, metadata };
}

/**
 * Normalizes a qualitative analysis by ensuring all fields have valid values.
 *
 * @param analysis - The analysis to normalize
 * @returns Normalized analysis
 */
function normalizeQualitativeAnalysis(analysis: QualitativeAnalysis): QualitativeAnalysis {
  return {
    emotional: {
      primaryTheme: analysis.emotional.primaryTheme || '',
      secondaryThemes: Array.isArray(analysis.emotional.secondaryThemes)
        ? analysis.emotional.secondaryThemes
        : [],
      emotionalJourney: analysis.emotional.emotionalJourney || '',
      keyImagery: Array.isArray(analysis.emotional.keyImagery)
        ? analysis.emotional.keyImagery
        : [],
      mood: analysis.emotional.mood || '',
    },
    meaning: {
      coreTheme: analysis.meaning.coreTheme || '',
      essentialElements: Array.isArray(analysis.meaning.essentialElements)
        ? analysis.meaning.essentialElements
        : [],
      flexibleElements: Array.isArray(analysis.meaning.flexibleElements)
        ? analysis.meaning.flexibleElements
        : [],
      authorVoice: analysis.meaning.authorVoice || '',
    },
    summary: analysis.summary || '',
    confidence: typeof analysis.confidence === 'number'
      ? Math.max(0, Math.min(1, analysis.confidence))
      : 0.5,
  };
}

/**
 * Attempts to salvage a partial qualitative analysis.
 *
 * @param parsed - The parsed JSON object
 * @returns A valid QualitativeAnalysis if salvageable, null otherwise
 */
function salvageQualitativeAnalysis(parsed: unknown): QualitativeAnalysis | null {
  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }

  const obj = parsed as Record<string, unknown>;
  const analysis = createDefaultQualitativeAnalysis();

  // Try to extract emotional interpretation
  if (typeof obj.emotional === 'object' && obj.emotional !== null) {
    const emotional = obj.emotional as Record<string, unknown>;
    analysis.emotional = {
      primaryTheme: (emotional.primaryTheme as string) || '',
      secondaryThemes: Array.isArray(emotional.secondaryThemes)
        ? (emotional.secondaryThemes as string[])
        : [],
      emotionalJourney: (emotional.emotionalJourney as string) || '',
      keyImagery: Array.isArray(emotional.keyImagery) ? (emotional.keyImagery as string[]) : [],
      mood: (emotional.mood as string) || '',
    };
  }

  // Try to extract meaning assessment
  if (typeof obj.meaning === 'object' && obj.meaning !== null) {
    const meaning = obj.meaning as Record<string, unknown>;
    analysis.meaning = {
      coreTheme: (meaning.coreTheme as string) || '',
      essentialElements: Array.isArray(meaning.essentialElements)
        ? (meaning.essentialElements as string[])
        : [],
      flexibleElements: Array.isArray(meaning.flexibleElements)
        ? (meaning.flexibleElements as string[])
        : [],
      authorVoice: (meaning.authorVoice as string) || '',
    };
  }

  // Extract summary and confidence
  if (typeof obj.summary === 'string') {
    analysis.summary = obj.summary;
  }
  if (typeof obj.confidence === 'number') {
    analysis.confidence = Math.max(0, Math.min(1, obj.confidence));
  }

  // Check if we got at least some meaningful data
  const hasEmotionalData =
    analysis.emotional.primaryTheme.length > 0 ||
    analysis.emotional.secondaryThemes.length > 0 ||
    analysis.emotional.mood.length > 0;

  const hasMeaningData =
    analysis.meaning.coreTheme.length > 0 ||
    analysis.meaning.essentialElements.length > 0;

  if (hasEmotionalData || hasMeaningData || analysis.summary.length > 0) {
    return analysis;
  }

  return null;
}

// =============================================================================
// Melody Feedback Response Parsing
// =============================================================================

/**
 * Parses Claude's response for melody feedback.
 *
 * @param response - Raw response from Claude
 * @returns Object containing parsed feedback and metadata
 *
 * @example
 * ```typescript
 * const response = await sendToClaudeDesktop(feedbackPrompt);
 * const { feedback, metadata } = parseMelodyFeedbackResponse(response);
 *
 * if (metadata.success) {
 *   console.log('Emotional fit:', feedback.emotionalFit);
 *   feedback.improvements.forEach(i => console.log('Improve:', i));
 * }
 * ```
 */
export function parseMelodyFeedbackResponse(response: string): {
  feedback: MelodyFeedback;
  metadata: ResponseMetadata;
} {
  console.log(`[claude/parsers] parseMelodyFeedbackResponse: parsing response (${response.length} chars)`);

  const metadata: ResponseMetadata = {
    ...createDefaultResponseMetadata(),
    originalLength: response.length,
  };

  const defaultFeedback = createDefaultMelodyFeedback();

  // Handle empty response
  if (!response || response.trim().length === 0) {
    metadata.success = false;
    metadata.errors.push('Empty response received');
    return { feedback: defaultFeedback, metadata };
  }

  // Extract JSON from response
  const jsonString = extractJSON(response);
  if (!jsonString) {
    metadata.success = false;
    metadata.errors.push('No JSON found in response');
    return { feedback: defaultFeedback, metadata };
  }

  // Parse the JSON
  const parsed = safeJSONParse<unknown>(jsonString);
  if (!parsed) {
    metadata.success = false;
    metadata.errors.push('Failed to parse JSON');
    return { feedback: defaultFeedback, metadata };
  }

  // Validate the structure
  if (isMelodyFeedback(parsed)) {
    console.log('[claude/parsers] parseMelodyFeedbackResponse: successfully parsed feedback');
    return {
      feedback: normalizeMelodyFeedback(parsed),
      metadata: { ...metadata, success: true },
    };
  }

  // Try to salvage partial feedback
  const salvaged = salvageMelodyFeedback(parsed);
  if (salvaged) {
    metadata.warnings.push('Feedback required repair - some fields may have defaults');
    console.log('[claude/parsers] parseMelodyFeedbackResponse: salvaged partial feedback');
    return {
      feedback: salvaged,
      metadata: { ...metadata, success: true },
    };
  }

  metadata.success = false;
  metadata.errors.push('Response does not match expected feedback structure');
  return { feedback: defaultFeedback, metadata };
}

/**
 * Normalizes melody feedback by ensuring all arrays are valid.
 *
 * @param feedback - The feedback to normalize
 * @returns Normalized feedback
 */
function normalizeMelodyFeedback(feedback: MelodyFeedback): MelodyFeedback {
  return {
    emotionalFit: feedback.emotionalFit,
    observations: Array.isArray(feedback.observations) ? feedback.observations : [],
    improvements: Array.isArray(feedback.improvements) ? feedback.improvements : [],
    highlights: Array.isArray(feedback.highlights) ? feedback.highlights : [],
  };
}

/**
 * Attempts to salvage partial melody feedback.
 *
 * @param parsed - The parsed JSON object
 * @returns Valid MelodyFeedback if salvageable, null otherwise
 */
function salvageMelodyFeedback(parsed: unknown): MelodyFeedback | null {
  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }

  const obj = parsed as Record<string, unknown>;

  // Try to determine emotional fit
  let emotionalFit: MelodyFeedback['emotionalFit'] = 'adequate';
  if (
    obj.emotionalFit === 'excellent' ||
    obj.emotionalFit === 'good' ||
    obj.emotionalFit === 'adequate' ||
    obj.emotionalFit === 'poor'
  ) {
    emotionalFit = obj.emotionalFit;
  }

  const feedback: MelodyFeedback = {
    emotionalFit,
    observations: Array.isArray(obj.observations)
      ? (obj.observations as string[])
      : [],
    improvements: Array.isArray(obj.improvements)
      ? (obj.improvements as string[])
      : [],
    highlights: Array.isArray(obj.highlights) ? (obj.highlights as string[]) : [],
  };

  // Check if we got any meaningful data
  if (
    feedback.observations.length > 0 ||
    feedback.improvements.length > 0 ||
    feedback.highlights.length > 0
  ) {
    return feedback;
  }

  // If there's an overallAssessment, add it as an observation
  if (typeof obj.overallAssessment === 'string' && obj.overallAssessment.length > 0) {
    feedback.observations.push(obj.overallAssessment);
    return feedback;
  }

  return null;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Validates that a response contains expected content.
 *
 * @param response - The response to validate
 * @param expectedType - The expected type of content
 * @returns Validation result
 */
export function validateResponse(
  response: string,
  expectedType: 'suggestion' | 'analysis' | 'feedback'
): {
  isValid: boolean;
  hasJSON: boolean;
  estimatedContent: string;
} {
  const hasJSON = extractJSON(response) !== null;
  let estimatedContent = 'unknown';

  if (hasJSON) {
    const json = extractJSON(response);
    if (json) {
      if (json.includes('originalWord') && json.includes('suggestedWord')) {
        estimatedContent = 'suggestion';
      } else if (json.includes('emotional') && json.includes('meaning')) {
        estimatedContent = 'analysis';
      } else if (json.includes('emotionalFit') || json.includes('improvements')) {
        estimatedContent = 'feedback';
      }
    }
  }

  return {
    isValid: estimatedContent === expectedType,
    hasJSON,
    estimatedContent,
  };
}

/**
 * Combines multiple response metadata objects into one.
 *
 * @param metadatas - Array of metadata objects
 * @returns Combined metadata
 */
export function combineMetadata(metadatas: ResponseMetadata[]): ResponseMetadata {
  return {
    success: metadatas.every((m) => m.success),
    errors: metadatas.flatMap((m) => m.errors),
    warnings: metadatas.flatMap((m) => m.warnings),
    originalLength: metadatas.reduce((sum, m) => sum + m.originalLength, 0),
  };
}
