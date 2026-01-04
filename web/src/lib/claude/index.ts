/**
 * Ghost Note - Claude Integration Module
 *
 * This module provides the integration layer for Claude-powered suggestions
 * and qualitative analysis. It handles:
 *
 * - Prompt creation for various analysis tasks
 * - Response parsing with error handling
 * - Type definitions for Claude interactions
 *
 * ## Architecture
 *
 * This module creates prompts and parses responses. The actual API calls
 * happen through one of these mechanisms:
 *
 * 1. **Claude Code CLI**: User runs `claude` in terminal
 * 2. **Claude Desktop Code Mode**: User pastes prompt in Claude Desktop
 * 3. **Future**: Direct API integration when needed
 *
 * ## Usage Example
 *
 * ```typescript
 * import {
 *   createSuggestionPrompt,
 *   parseSuggestionResponse,
 *   createAnalysisPrompt,
 *   parseAnalysisResponse
 * } from './lib/claude';
 *
 * // Generate suggestion prompt from poem analysis
 * const prompt = createSuggestionPrompt(analysis, problemSpots);
 *
 * // User sends prompt to Claude (via CLI or Desktop)
 * const response = await getUserClaudeResponse(prompt);
 *
 * // Parse the response
 * const { suggestions, metadata } = parseSuggestionResponse(response);
 *
 * if (metadata.success) {
 *   suggestions.forEach(s => {
 *     console.log(`${s.originalWord} -> ${s.suggestedWord}: ${s.reason}`);
 *   });
 * }
 * ```
 *
 * @module lib/claude
 */

// =============================================================================
// Type Exports
// =============================================================================

export type {
  // Core suggestion types
  Suggestion,
  MeaningPreservation,
  ProblemSpot,

  // Qualitative analysis types
  QualitativeAnalysis,
  EmotionalInterpretation,
  MeaningAssessment,
  MelodyFeedback,

  // Context types
  SuggestionContext,
  AnalysisContext,
  PromptOptions,

  // Metadata types
  ResponseMetadata,

  // Template types
  PromptTemplateType,
  PromptTemplate,
} from './types';

// =============================================================================
// Type Utilities
// =============================================================================

export {
  // Factory functions
  createDefaultSuggestion,
  createDefaultProblemSpot,
  createDefaultQualitativeAnalysis,
  createDefaultMelodyFeedback,
  createDefaultResponseMetadata,

  // Type guards
  isSuggestion,
  isQualitativeAnalysis,
  isMelodyFeedback,

  // Conversion functions
  problemReportToProblemSpot,
  problemReportsToProblemSpots,
  extractQuantitativeData,
} from './types';

// =============================================================================
// Prompt Creation
// =============================================================================

export {
  // Main prompt functions
  createSuggestionPrompt,
  createSuggestionPromptFromAnalysis,
  createAnalysisPrompt,
  createEmotionalInterpretationPrompt,
  createMeaningPreservationPrompt,
  createMelodyFeedbackPrompt,

  // Context builders
  buildSuggestionContext,
  buildAnalysisContext,

  // Utility functions
  estimateTokenCount,
  truncatePromptIfNeeded,
} from './prompts';

// =============================================================================
// Response Parsing
// =============================================================================

export {
  // Main parsing functions
  parseSuggestionResponse,
  parseAnalysisResponse,
  parseMelodyFeedbackResponse,

  // Utility functions
  extractJSON,
  safeJSONParse,
  validateResponse,
  combineMetadata,
} from './parsers';

// =============================================================================
// Templates
// =============================================================================

export {
  // Individual templates
  WORD_SUBSTITUTION_TEMPLATE,
  MEANING_PRESERVATION_TEMPLATE,
  EMOTIONAL_INTERPRETATION_TEMPLATE,
  MELODY_FEEDBACK_TEMPLATE,

  // Template registry
  PROMPT_TEMPLATES,

  // Template utilities
  getTemplate,
  listTemplateTypes,
  validateTemplateVariables,
  fillTemplate,
  escapeForTemplate,
  formatProblemSpots,
  formatEmotionalArc,
  formatStressAlignment,
} from './templates';
