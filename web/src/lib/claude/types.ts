/**
 * Ghost Note - Claude Integration Types
 *
 * Type definitions for Claude-powered suggestion and analysis features.
 * This module creates prompts and parses responses - actual API calls happen
 * through Claude Code CLI or Claude Desktop.
 *
 * @module lib/claude/types
 */

import type { PoemAnalysis, ProblemReport } from '../../types/analysis';

// =============================================================================
// Suggestion Types
// =============================================================================

/**
 * How well the suggestion preserves the original meaning
 */
export type MeaningPreservation = 'yes' | 'partial' | 'no';

/**
 * A word substitution suggestion from Claude
 */
export interface Suggestion {
  /** The original word being replaced */
  originalWord: string;
  /** The suggested replacement word */
  suggestedWord: string;
  /** Line number where the word appears (1-indexed) */
  lineNumber: number;
  /** Position within the line (0-indexed word position) */
  position: number;
  /** Explanation of why this substitution is recommended */
  reason: string;
  /** Whether the substitution preserves the original meaning */
  preservesMeaning: MeaningPreservation;
}

/**
 * A problem spot in the poem that needs attention
 * (Subset of ProblemReport for prompt creation)
 */
export interface ProblemSpot {
  /** Line number where the problem occurs */
  line: number;
  /** Position within the line */
  position: number;
  /** Type of problem (stress_mismatch, syllable_variance, singability, rhyme_break) */
  type: string;
  /** Severity of the problem (low, medium, high) */
  severity: string;
  /** Human-readable description of the problem */
  description: string;
}

// =============================================================================
// Qualitative Analysis Types
// =============================================================================

/**
 * Emotional interpretation of the poem from Claude
 */
export interface EmotionalInterpretation {
  /** Primary emotional theme */
  primaryTheme: string;
  /** Secondary emotional themes */
  secondaryThemes: string[];
  /** How emotions progress through the poem */
  emotionalJourney: string;
  /** Key imagery that evokes emotion */
  keyImagery: string[];
  /** Overall mood description */
  mood: string;
}

/**
 * Meaning preservation assessment
 */
export interface MeaningAssessment {
  /** Core meaning/theme of the original poem */
  coreTheme: string;
  /** Key elements that must be preserved */
  essentialElements: string[];
  /** Elements that can be modified without losing meaning */
  flexibleElements: string[];
  /** Author's voice characteristics to maintain */
  authorVoice: string;
}

/**
 * Melody quality feedback from Claude
 */
export interface MelodyFeedback {
  /** How well the melody matches the emotional content */
  emotionalFit: 'excellent' | 'good' | 'adequate' | 'poor';
  /** Specific observations about the melody */
  observations: string[];
  /** Suggestions for improvement */
  improvements: string[];
  /** Particularly effective melodic moments */
  highlights: string[];
}

/**
 * Complete qualitative analysis from Claude
 */
export interface QualitativeAnalysis {
  /** Emotional interpretation of the poem */
  emotional: EmotionalInterpretation;
  /** Meaning preservation assessment */
  meaning: MeaningAssessment;
  /** Overall qualitative assessment */
  summary: string;
  /** Confidence level in the analysis (0-1) */
  confidence: number;
}

// =============================================================================
// Prompt/Response Types
// =============================================================================

/**
 * Context provided to Claude for generating suggestions
 */
export interface SuggestionContext {
  /** The original poem text */
  originalPoem: string;
  /** The full poem analysis */
  analysis: PoemAnalysis;
  /** Problem spots to address */
  problemSpots: ProblemSpot[];
}

/**
 * Context provided to Claude for qualitative analysis
 */
export interface AnalysisContext {
  /** The poem text */
  poem: string;
  /** Quantitative analysis data from software */
  quantitativeData: {
    syllableCounts: number[];
    stressPatterns: string[];
    rhymeScheme: string;
    meterType: string;
    emotionalScores: {
      sentiment: number;
      arousal: number;
      dominantEmotions: string[];
    };
    singabilityScores: number[];
  };
}

/**
 * Options for prompt generation
 */
export interface PromptOptions {
  /** Maximum number of suggestions to request */
  maxSuggestions?: number;
  /** Focus areas for suggestions */
  focusAreas?: ('singability' | 'meter' | 'rhyme' | 'meaning')[];
  /** Whether to include explanation details */
  includeExplanations?: boolean;
  /** Output format preference */
  outputFormat?: 'json' | 'structured';
}

/**
 * Parsed response metadata
 */
export interface ResponseMetadata {
  /** Whether parsing was successful */
  success: boolean;
  /** Any parsing errors encountered */
  errors: string[];
  /** Warnings about potentially incorrect data */
  warnings: string[];
  /** Original response length */
  originalLength: number;
}

// =============================================================================
// Template Types
// =============================================================================

/**
 * Types of prompt templates available
 */
export type PromptTemplateType =
  | 'word_substitution'
  | 'meaning_preservation'
  | 'emotional_interpretation'
  | 'melody_feedback';

/**
 * A prompt template with placeholders
 */
export interface PromptTemplate {
  /** Template type identifier */
  type: PromptTemplateType;
  /** The template string with {{placeholders}} */
  template: string;
  /** Required placeholder variables */
  requiredVariables: string[];
  /** Optional placeholder variables with defaults */
  optionalVariables: Record<string, string>;
  /** Description of what this template produces */
  description: string;
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Creates a default/empty Suggestion
 */
export function createDefaultSuggestion(): Suggestion {
  return {
    originalWord: '',
    suggestedWord: '',
    lineNumber: 0,
    position: 0,
    reason: '',
    preservesMeaning: 'yes',
  };
}

/**
 * Creates a default/empty ProblemSpot
 */
export function createDefaultProblemSpot(): ProblemSpot {
  return {
    line: 0,
    position: 0,
    type: 'singability',
    severity: 'low',
    description: '',
  };
}

/**
 * Creates a default/empty QualitativeAnalysis
 */
export function createDefaultQualitativeAnalysis(): QualitativeAnalysis {
  return {
    emotional: {
      primaryTheme: '',
      secondaryThemes: [],
      emotionalJourney: '',
      keyImagery: [],
      mood: '',
    },
    meaning: {
      coreTheme: '',
      essentialElements: [],
      flexibleElements: [],
      authorVoice: '',
    },
    summary: '',
    confidence: 0,
  };
}

/**
 * Creates a default/empty MelodyFeedback
 */
export function createDefaultMelodyFeedback(): MelodyFeedback {
  return {
    emotionalFit: 'adequate',
    observations: [],
    improvements: [],
    highlights: [],
  };
}

/**
 * Creates a default ResponseMetadata
 */
export function createDefaultResponseMetadata(): ResponseMetadata {
  return {
    success: true,
    errors: [],
    warnings: [],
    originalLength: 0,
  };
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard to check if an object is a valid Suggestion
 */
export function isSuggestion(obj: unknown): obj is Suggestion {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const suggestion = obj as Record<string, unknown>;

  return (
    typeof suggestion.originalWord === 'string' &&
    typeof suggestion.suggestedWord === 'string' &&
    typeof suggestion.lineNumber === 'number' &&
    typeof suggestion.position === 'number' &&
    typeof suggestion.reason === 'string' &&
    (suggestion.preservesMeaning === 'yes' ||
      suggestion.preservesMeaning === 'partial' ||
      suggestion.preservesMeaning === 'no')
  );
}

/**
 * Type guard to check if an object is a valid QualitativeAnalysis
 */
export function isQualitativeAnalysis(obj: unknown): obj is QualitativeAnalysis {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const analysis = obj as Record<string, unknown>;

  return (
    typeof analysis.emotional === 'object' &&
    analysis.emotional !== null &&
    typeof analysis.meaning === 'object' &&
    analysis.meaning !== null &&
    typeof analysis.summary === 'string' &&
    typeof analysis.confidence === 'number'
  );
}

/**
 * Type guard to check if an object is a valid MelodyFeedback
 */
export function isMelodyFeedback(obj: unknown): obj is MelodyFeedback {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const feedback = obj as Record<string, unknown>;

  return (
    (feedback.emotionalFit === 'excellent' ||
      feedback.emotionalFit === 'good' ||
      feedback.emotionalFit === 'adequate' ||
      feedback.emotionalFit === 'poor') &&
    Array.isArray(feedback.observations) &&
    Array.isArray(feedback.improvements) &&
    Array.isArray(feedback.highlights)
  );
}

// =============================================================================
// Conversion Functions
// =============================================================================

/**
 * Converts a ProblemReport to a ProblemSpot
 */
export function problemReportToProblemSpot(report: ProblemReport): ProblemSpot {
  return {
    line: report.line,
    position: report.position,
    type: report.type,
    severity: report.severity,
    description: report.description,
  };
}

/**
 * Converts an array of ProblemReports to ProblemSpots
 */
export function problemReportsToProblemSpots(reports: ProblemReport[]): ProblemSpot[] {
  return reports.map(problemReportToProblemSpot);
}

/**
 * Extracts quantitative data from PoemAnalysis for prompt creation
 */
export function extractQuantitativeData(
  analysis: PoemAnalysis
): AnalysisContext['quantitativeData'] {
  const syllableCounts: number[] = [];
  const stressPatterns: string[] = [];
  const singabilityScores: number[] = [];

  for (const stanza of analysis.structure.stanzas) {
    for (const line of stanza.lines) {
      syllableCounts.push(line.syllableCount);
      stressPatterns.push(line.stressPattern);
      singabilityScores.push(line.singability.lineScore);
    }
  }

  return {
    syllableCounts,
    stressPatterns,
    rhymeScheme: analysis.prosody.rhyme.scheme,
    meterType: analysis.prosody.meter.detectedMeter,
    emotionalScores: {
      sentiment: analysis.emotion.overallSentiment,
      arousal: analysis.emotion.arousal,
      dominantEmotions: analysis.emotion.dominantEmotions,
    },
    singabilityScores,
  };
}
