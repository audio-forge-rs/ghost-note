/**
 * Ghost Note - Claude Prompt Generation
 *
 * Functions for creating prompts to send to Claude for qualitative analysis
 * and suggestions. This module creates the prompts - actual API calls happen
 * through Claude Code CLI or Claude Desktop.
 *
 * @module lib/claude/prompts
 */

import type {
  ProblemSpot,
  SuggestionContext,
  AnalysisContext,
  PromptOptions,
} from './types';
import type { PoemAnalysis } from '../../types/analysis';
import {
  WORD_SUBSTITUTION_TEMPLATE,
  MEANING_PRESERVATION_TEMPLATE,
  EMOTIONAL_INTERPRETATION_TEMPLATE,
  MELODY_FEEDBACK_TEMPLATE,
  fillTemplate,
  formatProblemSpots,
  formatStressAlignment,
  escapeForTemplate,
} from './templates';
import { extractQuantitativeData, problemReportsToProblemSpots } from './types';

// =============================================================================
// Suggestion Prompt Creation
// =============================================================================

/**
 * Creates a prompt for Claude to generate word substitution suggestions.
 *
 * This prompt provides Claude with:
 * - The original poem text
 * - Problem spots identified by quantitative analysis
 * - Context about meter, rhyme, and emotion
 *
 * @param analysis - Complete poem analysis from the analysis pipeline
 * @param issues - Problem spots that need attention
 * @param options - Optional configuration for the prompt
 * @returns Formatted prompt string ready to send to Claude
 *
 * @example
 * ```typescript
 * const prompt = createSuggestionPrompt(analysis, problemSpots);
 * // Send prompt to Claude via CLI or Desktop
 * const response = await sendToClaudeDesktop(prompt);
 * const suggestions = parseSuggestionResponse(response);
 * ```
 */
export function createSuggestionPrompt(
  analysis: PoemAnalysis,
  issues: ProblemSpot[],
  options: PromptOptions = {}
): string {
  console.log(
    `[claude/prompts] createSuggestionPrompt: creating prompt for ${issues.length} problem spots`
  );

  // Extract the original poem text from the analysis
  const poemLines: string[] = [];
  for (const stanza of analysis.structure.stanzas) {
    for (const line of stanza.lines) {
      poemLines.push(line.text);
    }
    poemLines.push(''); // Empty line between stanzas
  }
  const poem = poemLines.join('\n').trim();

  // Calculate average singability score
  let totalSingability = 0;
  let lineCount = 0;
  for (const stanza of analysis.structure.stanzas) {
    for (const line of stanza.lines) {
      totalSingability += line.singability.lineScore;
      lineCount++;
    }
  }
  const avgSingability = lineCount > 0 ? (totalSingability / lineCount).toFixed(2) : '0.00';

  // Build the variables for template filling
  const variables: Record<string, string> = {
    poem: escapeForTemplate(poem),
    problemSpots: formatProblemSpots(issues),
    meterType: analysis.prosody.meter.detectedMeter || 'irregular',
    rhymeScheme: analysis.prosody.rhyme.scheme || 'unknown',
    singabilityScore: `${avgSingability} (average across all lines)`,
    dominantEmotions: analysis.emotion.dominantEmotions.join(', ') || 'none detected',
    maxSuggestions: String(options.maxSuggestions ?? 10),
  };

  const prompt = fillTemplate(WORD_SUBSTITUTION_TEMPLATE, variables);

  console.log(
    `[claude/prompts] createSuggestionPrompt: generated prompt with ` +
      `${prompt.length} characters`
  );

  return prompt;
}

/**
 * Creates a suggestion prompt directly from a PoemAnalysis object,
 * automatically extracting problem spots from the analysis.
 *
 * @param analysis - Complete poem analysis
 * @param options - Optional configuration
 * @returns Formatted prompt string
 */
export function createSuggestionPromptFromAnalysis(
  analysis: PoemAnalysis,
  options: PromptOptions = {}
): string {
  // Convert ProblemReports to ProblemSpots
  const problemSpots = problemReportsToProblemSpots(analysis.problems);

  return createSuggestionPrompt(analysis, problemSpots, options);
}

// =============================================================================
// Analysis Prompt Creation
// =============================================================================

/**
 * Creates a prompt for Claude to perform qualitative analysis.
 *
 * This prompt asks Claude to analyze:
 * - Emotional interpretation (beyond quantitative sentiment)
 * - Meaning preservation requirements
 * - Author's voice and style
 *
 * @param poem - The original poem text
 * @param quantitativeData - Results from the quantitative analysis pipeline
 * @param options - Optional configuration for the prompt
 * @returns Formatted prompt string ready to send to Claude
 *
 * @example
 * ```typescript
 * const data = extractQuantitativeData(analysis);
 * const prompt = createAnalysisPrompt(poemText, data);
 * const response = await sendToClaudeDesktop(prompt);
 * const qualitativeAnalysis = parseAnalysisResponse(response);
 * ```
 */
export function createAnalysisPrompt(
  poem: string,
  quantitativeData: AnalysisContext['quantitativeData'],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options: PromptOptions = {}
): string {
  console.log('[claude/prompts] createAnalysisPrompt: creating qualitative analysis prompt');

  // Create both meaning preservation and emotional interpretation prompts
  // and combine them for a comprehensive analysis request
  const emotionalPrompt = createEmotionalInterpretationPrompt(poem, quantitativeData);
  const meaningPrompt = createMeaningPreservationPrompt(
    poem,
    quantitativeData.meterType,
    quantitativeData.rhymeScheme,
    quantitativeData.emotionalScores.dominantEmotions
  );

  // Combine into a comprehensive analysis prompt
  const combinedPrompt = `# Comprehensive Qualitative Analysis Request

You will perform two analyses on the following poem. Please provide both analyses in a single JSON response.

${emotionalPrompt}

---

Additionally, please include meaning preservation analysis in your response.

${meaningPrompt}

---

## Combined Output Format
Respond with a single JSON object containing both analyses:
\`\`\`json
{
  "emotional": {
    "primaryTheme": "...",
    "secondaryThemes": [...],
    "emotionalJourney": "...",
    "keyImagery": [...],
    "mood": "...",
    "musicalImplications": {
      "tempoFeel": "...",
      "dynamicApproach": "...",
      "melodicCharacter": "..."
    }
  },
  "meaning": {
    "coreTheme": "...",
    "essentialElements": [...],
    "flexibleElements": [...],
    "authorVoice": "..."
  },
  "summary": "A brief overall assessment of the poem's emotional and thematic content",
  "confidence": 0.85
}
\`\`\`

Provide your complete analysis as JSON:`;

  console.log(
    `[claude/prompts] createAnalysisPrompt: generated prompt with ${combinedPrompt.length} characters`
  );

  return combinedPrompt;
}

/**
 * Creates a prompt specifically for emotional interpretation.
 *
 * @param poem - The poem text
 * @param quantitativeData - Quantitative analysis results
 * @returns Emotional interpretation prompt string
 */
export function createEmotionalInterpretationPrompt(
  poem: string,
  quantitativeData: AnalysisContext['quantitativeData']
): string {
  // Build emotional arc description
  // Note: We don't have the full arc in quantitativeData, so we describe what we know
  const emotionalArcDesc =
    quantitativeData.emotionalScores.dominantEmotions.length > 0
      ? `Dominant emotions detected: ${quantitativeData.emotionalScores.dominantEmotions.join(', ')}`
      : 'No strong emotional keywords detected in quantitative analysis';

  const variables: Record<string, string> = {
    poem: escapeForTemplate(poem),
    sentiment: quantitativeData.emotionalScores.sentiment.toFixed(2),
    arousal: quantitativeData.emotionalScores.arousal.toFixed(2),
    emotionKeywords: quantitativeData.emotionalScores.dominantEmotions.join(', ') || 'none',
    emotionalArc: emotionalArcDesc,
  };

  return fillTemplate(EMOTIONAL_INTERPRETATION_TEMPLATE, variables);
}

/**
 * Creates a prompt specifically for meaning preservation analysis.
 *
 * @param poem - The poem text
 * @param meterType - Detected meter type
 * @param rhymeScheme - Detected rhyme scheme
 * @param dominantEmotions - List of dominant emotions
 * @param title - Optional poem title
 * @returns Meaning preservation prompt string
 */
export function createMeaningPreservationPrompt(
  poem: string,
  meterType: string,
  rhymeScheme: string,
  dominantEmotions: string[],
  title?: string
): string {
  const variables: Record<string, string> = {
    poem: escapeForTemplate(poem),
    dominantEmotions: dominantEmotions.join(', ') || 'none detected',
    meterType: meterType || 'irregular',
    rhymeScheme: rhymeScheme || 'unknown',
    title: title || 'Untitled',
  };

  return fillTemplate(MEANING_PRESERVATION_TEMPLATE, variables);
}

/**
 * Creates a prompt for melody quality feedback.
 *
 * @param lyrics - The lyrics being set
 * @param abcNotation - The generated melody in ABC notation
 * @param melodyParams - Parameters used for melody generation
 * @param analysis - The poem analysis (for emotional context)
 * @returns Melody feedback prompt string
 */
export function createMelodyFeedbackPrompt(
  lyrics: string,
  abcNotation: string,
  melodyParams: {
    key: string;
    timeSignature: string;
    tempo: number;
  },
  analysis: PoemAnalysis
): string {
  console.log('[claude/prompts] createMelodyFeedbackPrompt: creating melody feedback prompt');

  // Build stress alignment information
  const lines: Array<{ text: string; stressPattern: string }> = [];
  const alignment: Array<{ line: number; issues: string[] }> = [];

  for (const stanza of analysis.structure.stanzas) {
    for (const line of stanza.lines) {
      lines.push({
        text: line.text,
        stressPattern: line.stressPattern,
      });

      // Check for alignment issues in singability problems
      const lineIssues = line.singability.problemSpots
        .filter((p) => p.severity === 'high' || p.severity === 'medium')
        .map((p) => p.issue);

      if (lineIssues.length > 0) {
        alignment.push({
          line: lines.length,
          issues: lineIssues,
        });
      }
    }
  }

  const variables: Record<string, string> = {
    lyrics: escapeForTemplate(lyrics),
    abcNotation: escapeForTemplate(abcNotation),
    key: melodyParams.key,
    timeSignature: melodyParams.timeSignature,
    tempo: String(melodyParams.tempo),
    dominantEmotions: analysis.emotion.dominantEmotions.join(', ') || 'none detected',
    sentiment: analysis.emotion.overallSentiment.toFixed(2),
    stressAlignment: formatStressAlignment(lines, alignment),
  };

  const prompt = fillTemplate(MELODY_FEEDBACK_TEMPLATE, variables);

  console.log(
    `[claude/prompts] createMelodyFeedbackPrompt: generated prompt with ${prompt.length} characters`
  );

  return prompt;
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Creates a complete suggestion context from a PoemAnalysis.
 *
 * @param analysis - The poem analysis
 * @returns SuggestionContext ready for prompt creation
 */
export function buildSuggestionContext(analysis: PoemAnalysis): SuggestionContext {
  // Reconstruct original poem from analysis
  const poemLines: string[] = [];
  for (const stanza of analysis.structure.stanzas) {
    for (const line of stanza.lines) {
      poemLines.push(line.text);
    }
    poemLines.push('');
  }

  return {
    originalPoem: poemLines.join('\n').trim(),
    analysis,
    problemSpots: problemReportsToProblemSpots(analysis.problems),
  };
}

/**
 * Creates an analysis context from a poem and its analysis.
 *
 * @param poem - The original poem text
 * @param analysis - The poem analysis
 * @returns AnalysisContext ready for prompt creation
 */
export function buildAnalysisContext(poem: string, analysis: PoemAnalysis): AnalysisContext {
  return {
    poem,
    quantitativeData: extractQuantitativeData(analysis),
  };
}

/**
 * Estimates the token count for a prompt (rough approximation).
 * Useful for checking if a prompt might exceed model limits.
 *
 * @param prompt - The prompt text
 * @returns Estimated token count
 */
export function estimateTokenCount(prompt: string): number {
  // Rough approximation: ~4 characters per token for English text
  // This is conservative; actual tokenization may result in fewer tokens
  const charCount = prompt.length;
  const estimatedTokens = Math.ceil(charCount / 4);

  console.log(
    `[claude/prompts] estimateTokenCount: ${charCount} chars -> ~${estimatedTokens} tokens`
  );

  return estimatedTokens;
}

/**
 * Truncates a prompt to fit within token limits while preserving structure.
 *
 * @param prompt - The prompt to truncate
 * @param maxTokens - Maximum allowed tokens (default: 100000)
 * @returns Truncated prompt with warning if truncation occurred
 */
export function truncatePromptIfNeeded(
  prompt: string,
  maxTokens: number = 100000
): { prompt: string; wasTruncated: boolean; message: string } {
  const estimated = estimateTokenCount(prompt);

  if (estimated <= maxTokens) {
    return {
      prompt,
      wasTruncated: false,
      message: '',
    };
  }

  // Calculate how much to keep (in characters)
  const keepRatio = maxTokens / estimated;
  const keepChars = Math.floor(prompt.length * keepRatio * 0.9); // 90% for safety

  // Find a good break point (end of a section or paragraph)
  let breakPoint = prompt.lastIndexOf('\n\n', keepChars);
  if (breakPoint === -1 || breakPoint < keepChars * 0.5) {
    breakPoint = prompt.lastIndexOf('\n', keepChars);
  }
  if (breakPoint === -1 || breakPoint < keepChars * 0.5) {
    breakPoint = keepChars;
  }

  const truncated =
    prompt.substring(0, breakPoint) +
    '\n\n[Content truncated due to length. Please provide analysis based on the content shown above.]\n';

  console.log(
    `[claude/prompts] truncatePromptIfNeeded: truncated from ${prompt.length} to ${truncated.length} chars`
  );

  return {
    prompt: truncated,
    wasTruncated: true,
    message: `Prompt was truncated from ~${estimated} tokens to ~${estimateTokenCount(truncated)} tokens`,
  };
}
