/**
 * Ghost Note - Suggestion Generator
 *
 * Generates lyric improvement suggestions from poem analysis results.
 * Maps analysis problems to actionable suggestions with heuristic-based
 * word substitutions.
 *
 * @module lib/suggestions/generator
 */

import type { PoemAnalysis, ProblemReport, ProblemType, Severity } from '../../types/analysis';
import type { Suggestion, MeaningPreservation } from '../claude/types';

// =============================================================================
// Logging
// =============================================================================

const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[SuggestionGenerator] ${message}`, ...args);
  }
};

// =============================================================================
// Types
// =============================================================================

/**
 * Options for suggestion generation
 */
export interface GeneratorOptions {
  /** Maximum number of suggestions to generate */
  maxSuggestions?: number;
  /** Minimum severity to include */
  minSeverity?: Severity;
  /** Problem types to focus on */
  focusTypes?: ProblemType[];
}

/**
 * Result of suggestion generation
 */
export interface GeneratorResult {
  /** Generated suggestions */
  suggestions: Suggestion[];
  /** Number of problems processed */
  problemsProcessed: number;
  /** Number of problems skipped */
  problemsSkipped: number;
  /** Reasons for skipping problems */
  skipReasons: string[];
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Default options for generation
 */
const DEFAULT_OPTIONS: Required<GeneratorOptions> = {
  maxSuggestions: 10,
  minSeverity: 'low',
  focusTypes: ['stress_mismatch', 'syllable_variance', 'singability', 'rhyme_break'],
};

/**
 * Severity ordering for filtering
 */
const SEVERITY_ORDER: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

/**
 * Word substitutions for common singability issues
 * Maps problematic patterns to more singable alternatives
 */
const SINGABILITY_SUBSTITUTIONS: Record<string, string[]> = {
  // Words with consonant clusters that are hard to sing
  'strength': ['power', 'force', 'might'],
  'through': ['past', 'by', 'via'],
  'against': ['facing', 'toward', 'upon'],
  'underneath': ['below', 'under', 'beneath'],
  'throughout': ['across', 'over', 'within'],
  'stretch': ['reach', 'spread', 'span'],
  'scratched': ['marked', 'scraped', 'torn'],
  'struggled': ['fought', 'strove', 'tried'],
  'strangled': ['choked', 'gripped', 'held'],
  'splashed': ['sprayed', 'spilled', 'soaked'],
  // Short unstressed words that can cause issues
  'the': ['this', 'that', 'a'],
  'a': ['one', 'some'],
};

/**
 * Word substitutions for stress mismatch issues
 * Maps words where stress often falls incorrectly
 */
const STRESS_SUBSTITUTIONS: Record<string, string[]> = {
  // Multi-syllable words with tricky stress
  'remember': ['recall', 'think of'],
  'however': ['but yet', 'although'],
  'because': ['since', 'for', 'as'],
  'before': ['ere', 'prior'],
  'about': ['around', 'near'],
  'upon': ['on', 'atop'],
  'between': ['amid', 'among'],
  'without': ['lacking', 'minus'],
};

/**
 * Common rhyme alternatives
 * Maps end words to possible rhyme alternatives
 */
const RHYME_ALTERNATIVES: Record<string, string[]> = {
  'night': ['light', 'sight', 'bright', 'flight', 'right'],
  'day': ['way', 'say', 'stay', 'play', 'ray'],
  'love': ['above', 'dove', 'of'],
  'heart': ['part', 'start', 'art', 'dart'],
  'time': ['rhyme', 'climb', 'chime', 'prime'],
  'away': ['today', 'betray', 'display', 'decay'],
  'mind': ['find', 'kind', 'blind', 'behind'],
  'eyes': ['skies', 'lies', 'rise', 'wise', 'cries'],
  'soul': ['whole', 'goal', 'role', 'toll'],
  'dream': ['stream', 'beam', 'seem', 'gleam'],
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Checks if severity meets minimum threshold
 */
function meetsMinSeverity(severity: Severity, minSeverity: Severity): boolean {
  return SEVERITY_ORDER[severity] >= SEVERITY_ORDER[minSeverity];
}

/**
 * Extracts a word from the poem text at the given position
 */
function extractWordAtPosition(
  analysis: PoemAnalysis,
  lineNumber: number,
  position: number
): string | null {
  const lineIndex = lineNumber - 1; // Convert to 0-indexed

  // Navigate to find the line in the stanza structure
  let currentLine = 0;
  for (const stanza of analysis.structure.stanzas) {
    for (const line of stanza.lines) {
      if (currentLine === lineIndex) {
        // Find the word at position
        const words = line.words;
        if (position >= 0 && position < words.length) {
          return words[position].text.toLowerCase();
        }
        // If position is beyond words, try to extract from text
        const lineWords = line.text.split(/\s+/);
        if (position >= 0 && position < lineWords.length) {
          return lineWords[position].toLowerCase().replace(/[^\w]/g, '');
        }
        return null;
      }
      currentLine++;
    }
  }
  return null;
}

/**
 * Gets line text from analysis
 */
function getLineText(analysis: PoemAnalysis, lineNumber: number): string | null {
  const lineIndex = lineNumber - 1;
  let currentLine = 0;

  for (const stanza of analysis.structure.stanzas) {
    for (const line of stanza.lines) {
      if (currentLine === lineIndex) {
        return line.text;
      }
      currentLine++;
    }
  }
  return null;
}

/**
 * Determines meaning preservation based on substitution
 */
function determineMeaningPreservation(
  original: string,
  suggested: string,
  problemType: ProblemType
): MeaningPreservation {
  // Rhyme changes often alter meaning more
  if (problemType === 'rhyme_break') {
    return 'partial';
  }

  // If the words are synonyms (from our curated lists), meaning is preserved
  const lowerOriginal = original.toLowerCase();
  const lowerSuggested = suggested.toLowerCase();

  // Check if they're in our synonym-like substitution lists
  const allSubstitutions = { ...SINGABILITY_SUBSTITUTIONS, ...STRESS_SUBSTITUTIONS };
  for (const [key, values] of Object.entries(allSubstitutions)) {
    if (key === lowerOriginal && values.includes(lowerSuggested)) {
      return 'yes';
    }
    if (values.includes(lowerOriginal) && (key === lowerSuggested || values.includes(lowerSuggested))) {
      return 'yes';
    }
  }

  // Default to partial for other substitutions
  return 'partial';
}

/**
 * Generates reason text based on problem type and severity
 */
function generateReason(problem: ProblemReport): string {
  // Use the problem description if available
  if (problem.description) {
    return problem.description;
  }

  // Generate based on type
  switch (problem.type) {
    case 'stress_mismatch':
      return 'The stress pattern of this word may not align with the musical beat.';
    case 'syllable_variance':
      return 'This line has a different syllable count than others, which may affect rhythm.';
    case 'singability':
      return 'This word contains sounds that are difficult to sing clearly.';
    case 'rhyme_break':
      return 'This word breaks the rhyme scheme, consider an alternative.';
    default:
      return 'Consider revising this word for better singability.';
  }
}

/**
 * Finds a substitution for a word based on problem type
 */
function findSubstitution(
  word: string,
  problemType: ProblemType,
  lineText: string | null
): string | null {
  const lowerWord = word.toLowerCase();

  // Try problem-type-specific substitutions first
  switch (problemType) {
    case 'singability': {
      const singabilitySubs = SINGABILITY_SUBSTITUTIONS[lowerWord];
      if (singabilitySubs && singabilitySubs.length > 0) {
        return singabilitySubs[0];
      }
      break;
    }

    case 'stress_mismatch': {
      const stressSubs = STRESS_SUBSTITUTIONS[lowerWord];
      if (stressSubs && stressSubs.length > 0) {
        return stressSubs[0];
      }
      break;
    }

    case 'rhyme_break': {
      const rhymeSubs = RHYME_ALTERNATIVES[lowerWord];
      if (rhymeSubs && rhymeSubs.length > 0) {
        // Pick the first alternative that isn't already in the line
        for (const alt of rhymeSubs) {
          if (!lineText || !lineText.toLowerCase().includes(alt)) {
            return alt;
          }
        }
        return rhymeSubs[0];
      }
      break;
    }
  }

  // Try any substitution as fallback
  const allSubs = [
    ...Object.entries(SINGABILITY_SUBSTITUTIONS),
    ...Object.entries(STRESS_SUBSTITUTIONS),
  ];

  for (const [key, values] of allSubs) {
    if (key === lowerWord && values.length > 0) {
      return values[0];
    }
  }

  return null;
}

/**
 * Generates a suggestion from a problem report
 */
function problemToSuggestion(
  problem: ProblemReport,
  analysis: PoemAnalysis
): Suggestion | null {
  // Extract the word at the problem position
  const originalWord = extractWordAtPosition(analysis, problem.line, problem.position);

  if (!originalWord) {
    log('Could not extract word for problem:', problem);
    return null;
  }

  // Get line text for context
  const lineText = getLineText(analysis, problem.line);

  // Find a substitution
  const suggestedWord = findSubstitution(originalWord, problem.type, lineText);

  if (!suggestedWord) {
    log('No substitution found for word:', originalWord);
    return null;
  }

  // Skip if suggestion is the same as original
  if (suggestedWord.toLowerCase() === originalWord.toLowerCase()) {
    log('Suggestion same as original, skipping:', originalWord);
    return null;
  }

  const suggestion: Suggestion = {
    originalWord,
    suggestedWord,
    lineNumber: problem.line,
    position: problem.position,
    reason: generateReason(problem),
    preservesMeaning: determineMeaningPreservation(originalWord, suggestedWord, problem.type),
  };

  log('Generated suggestion:', suggestion);
  return suggestion;
}

// =============================================================================
// Main Generator Function
// =============================================================================

/**
 * Generates suggestions from poem analysis problems.
 *
 * This function maps analysis problems to actionable suggestions using
 * heuristic-based word substitutions. It prioritizes high-severity issues
 * and limits output to avoid overwhelming the user.
 *
 * @param analysis - The complete poem analysis
 * @param options - Generation options
 * @returns Generator result with suggestions
 *
 * @example
 * ```typescript
 * const analysis = await analyzePoem(poemText);
 * const result = generateSuggestionsFromAnalysis(analysis, {
 *   maxSuggestions: 5,
 *   minSeverity: 'medium',
 * });
 * console.log(`Generated ${result.suggestions.length} suggestions`);
 * ```
 */
export function generateSuggestionsFromAnalysis(
  analysis: PoemAnalysis,
  options: GeneratorOptions = {}
): GeneratorResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  log('Generating suggestions from analysis', {
    problemCount: analysis.problems.length,
    options: opts,
  });

  const result: GeneratorResult = {
    suggestions: [],
    problemsProcessed: 0,
    problemsSkipped: 0,
    skipReasons: [],
  };

  // Filter and sort problems
  const filteredProblems = analysis.problems
    .filter((problem) => {
      // Check severity
      if (!meetsMinSeverity(problem.severity, opts.minSeverity)) {
        result.problemsSkipped++;
        result.skipReasons.push(`Skipped line ${problem.line}: severity ${problem.severity} below threshold`);
        return false;
      }

      // Check focus types
      if (!opts.focusTypes.includes(problem.type)) {
        result.problemsSkipped++;
        result.skipReasons.push(`Skipped line ${problem.line}: type ${problem.type} not in focus`);
        return false;
      }

      return true;
    })
    // Sort by severity (high first) then by line number
    .sort((a, b) => {
      const severityDiff = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return a.line - b.line;
    });

  log(`Filtered to ${filteredProblems.length} problems for processing`);

  // Generate suggestions from problems
  const seenPositions = new Set<string>();

  for (const problem of filteredProblems) {
    // Check if we've hit the max
    if (result.suggestions.length >= opts.maxSuggestions) {
      log(`Reached max suggestions (${opts.maxSuggestions}), stopping`);
      break;
    }

    // Skip duplicate positions (same line + position)
    const posKey = `${problem.line}:${problem.position}`;
    if (seenPositions.has(posKey)) {
      result.problemsSkipped++;
      result.skipReasons.push(`Skipped duplicate position: ${posKey}`);
      continue;
    }

    result.problemsProcessed++;
    seenPositions.add(posKey);

    // Try to generate a suggestion
    const suggestion = problemToSuggestion(problem, analysis);

    if (suggestion) {
      result.suggestions.push(suggestion);
    } else {
      result.problemsSkipped++;
      result.skipReasons.push(`Could not generate suggestion for line ${problem.line}`);
    }
  }

  log('Generation complete', {
    suggestionsGenerated: result.suggestions.length,
    problemsProcessed: result.problemsProcessed,
    problemsSkipped: result.problemsSkipped,
  });

  return result;
}

/**
 * Checks if an analysis has problems that can generate suggestions
 */
export function hasGeneratableProblems(
  analysis: PoemAnalysis,
  options: GeneratorOptions = {}
): boolean {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return analysis.problems.some(
    (problem) =>
      meetsMinSeverity(problem.severity, opts.minSeverity) &&
      opts.focusTypes.includes(problem.type)
  );
}

/**
 * Gets the count of problems that can potentially generate suggestions
 */
export function countGeneratableProblems(
  analysis: PoemAnalysis,
  options: GeneratorOptions = {}
): number {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return analysis.problems.filter(
    (problem) =>
      meetsMinSeverity(problem.severity, opts.minSeverity) &&
      opts.focusTypes.includes(problem.type)
  ).length;
}
