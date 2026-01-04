/**
 * Text Preprocessing Module
 *
 * This module handles Stage 1 and Stage 2 of the poem analysis pipeline:
 * - Text normalization and whitespace handling
 * - Stanza and line detection
 * - Word tokenization with contraction handling
 * - Punctuation extraction
 *
 * @module lib/analysis/preprocess
 */

import type { PreprocessedPoem, PunctuationMark, TokenizedLine } from '@/types/analysis';

// Logging helper for debugging
const DEBUG = process.env.NODE_ENV === 'development';
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[preprocess] ${message}`, ...args);
  }
};

// =============================================================================
// Constants
// =============================================================================

/**
 * Regex pattern for punctuation characters to extract
 * Includes common punctuation marks that affect phrasing and rhythm
 */
const PUNCTUATION_PATTERN = /[.,!?;:'"—–\-()[\]{}…]/g;

/**
 * Regex pattern for contractions
 * Matches words with apostrophes that should be kept as single tokens
 */
const CONTRACTION_PATTERN = /^[a-zA-Z]+'[a-zA-Z]+$/;

/**
 * Common contractions that should be treated as single words
 */
const COMMON_CONTRACTIONS = new Set([
  "don't", "doesn't", "didn't", "won't", "wouldn't", "couldn't", "shouldn't",
  "can't", "isn't", "aren't", "wasn't", "weren't", "hasn't", "haven't", "hadn't",
  "I'm", "I've", "I'll", "I'd",
  "you're", "you've", "you'll", "you'd",
  "he's", "he'll", "he'd",
  "she's", "she'll", "she'd",
  "it's", "it'll",
  "we're", "we've", "we'll", "we'd",
  "they're", "they've", "they'll", "they'd",
  "that's", "that'll", "that'd",
  "who's", "who'll", "who'd",
  "what's", "what'll", "what'd",
  "where's", "where'll", "where'd",
  "when's", "when'll", "when'd",
  "why's", "why'll", "why'd",
  "how's", "how'll", "how'd",
  "there's", "there'll", "there'd",
  "here's",
  "let's",
  "ain't",
  "'tis", "'twas",
  "o'er", "e'er", "ne'er",
  "ma'am", "y'all",
]);

// =============================================================================
// Whitespace Normalization
// =============================================================================

/**
 * Normalizes whitespace in text while preserving meaningful line breaks.
 *
 * Operations:
 * - Converts tabs to spaces
 * - Normalizes multiple spaces to single space
 * - Trims trailing whitespace from each line
 * - Preserves empty lines (for stanza detection)
 * - Normalizes various newline formats (CRLF, CR) to LF
 *
 * @param text - The raw input text
 * @returns Text with normalized whitespace
 */
export function normalizeWhitespace(text: string): string {
  if (text === null || text === undefined || text === '') {
    return '';
  }

  log('normalizeWhitespace input length:', text.length);

  // Normalize line endings to LF
  let normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Convert tabs to spaces
  normalized = normalized.replace(/\t/g, ' ');

  // Normalize multiple spaces to single space (within lines)
  // Process line by line to preserve line structure
  const lines = normalized.split('\n');
  const processedLines = lines.map((line) => {
    // Trim trailing whitespace first
    let processed = line.trimEnd();
    // Replace multiple consecutive spaces with single space
    // This preserves a single leading space if present
    processed = processed.replace(/ {2,}/g, ' ');
    return processed;
  });

  normalized = processedLines.join('\n');

  // Trim leading/trailing newlines from the entire text (but not spaces within first/last line)
  // Remove leading newlines
  normalized = normalized.replace(/^\n+/, '');
  // Remove trailing newlines
  normalized = normalized.replace(/\n+$/, '');

  log('normalizeWhitespace output length:', normalized.length);
  return normalized;
}

// =============================================================================
// Line Splitting
// =============================================================================

/**
 * Splits text into individual lines.
 *
 * Handles:
 * - Single newline line breaks
 * - Empty lines (preserved as empty strings)
 * - Whitespace normalization within lines
 *
 * @param text - The input text (should be whitespace-normalized)
 * @returns Array of lines
 */
export function splitLines(text: string): string[] {
  log('splitLines input length:', text.length);

  if (!text) {
    return [];
  }

  const lines = text.split('\n');
  log('splitLines output count:', lines.length);

  return lines;
}

// =============================================================================
// Stanza Detection
// =============================================================================

/**
 * Detects and splits poem into stanzas based on double newlines.
 *
 * A stanza is a group of lines separated by one or more blank lines.
 * This function:
 * - Identifies stanza boundaries (blank lines)
 * - Groups lines into stanza arrays
 * - Handles edge cases like leading/trailing blank lines
 * - Preserves line content within stanzas
 *
 * @param text - The input text (should be whitespace-normalized)
 * @returns Array of stanzas, where each stanza is an array of lines
 */
export function detectStanzas(text: string): string[][] {
  log('detectStanzas input length:', text.length);

  if (!text) {
    return [];
  }

  const lines = splitLines(text);

  if (lines.length === 0) {
    return [];
  }

  const stanzas: string[][] = [];
  let currentStanza: string[] = [];

  for (const line of lines) {
    if (line.trim() === '') {
      // Empty line indicates potential stanza break
      if (currentStanza.length > 0) {
        // Only add stanza if it has content
        stanzas.push(currentStanza);
        currentStanza = [];
      }
      // Skip empty lines (don't add to any stanza)
    } else {
      // Non-empty line belongs to current stanza
      currentStanza.push(line);
    }
  }

  // Don't forget the last stanza if it has content
  if (currentStanza.length > 0) {
    stanzas.push(currentStanza);
  }

  log('detectStanzas output stanza count:', stanzas.length);
  return stanzas;
}

// =============================================================================
// Word Tokenization
// =============================================================================

/**
 * Checks if a string is a contraction that should be kept as a single token.
 *
 * @param word - The word to check
 * @returns True if the word is a contraction
 */
function isContraction(word: string): boolean {
  // Check common contractions set (case-insensitive)
  const lowerWord = word.toLowerCase();
  if (COMMON_CONTRACTIONS.has(lowerWord)) {
    return true;
  }

  // Check pattern for other contractions (word'word format)
  return CONTRACTION_PATTERN.test(word);
}

/**
 * Tokenizes a line into individual words.
 *
 * This function:
 * - Splits on whitespace and punctuation boundaries
 * - Preserves contractions as single tokens (don't, it's, etc.)
 * - Handles hyphenated words appropriately
 * - Strips punctuation from word boundaries while preserving it for extraction
 * - Returns only words (no punctuation in output)
 *
 * @param line - A single line of text
 * @returns Array of word tokens (without punctuation)
 */
export function tokenizeWords(line: string): string[] {
  log('tokenizeWords input:', line);

  if (!line || line.trim() === '') {
    return [];
  }

  const words: string[] = [];

  // Split on whitespace first
  const tokens = line.split(/\s+/);

  for (const token of tokens) {
    if (!token) continue;

    // Check if token is a contraction - keep as single word
    if (isContraction(token)) {
      // Remove any surrounding punctuation but keep the contraction
      const cleaned = token.replace(/^[^\w']+|[^\w']+$/g, '');
      if (cleaned) {
        words.push(cleaned);
      }
      continue;
    }

    // Handle tokens with hyphens (compound words)
    // Keep hyphenated words together for now - they represent single concepts
    if (token.includes('-') && !token.startsWith('-') && !token.endsWith('-')) {
      // Check if it's a hyphenated word (not just a dash)
      const hyphenCheck = token.replace(/^[^\w-]+|[^\w-]+$/g, '');
      if (hyphenCheck && hyphenCheck.includes('-')) {
        // It's a hyphenated word - keep it together
        const cleaned = hyphenCheck.replace(/^-+|-+$/g, '');
        if (cleaned) {
          words.push(cleaned);
        }
        continue;
      }
    }

    // Regular word processing - strip punctuation from boundaries
    // Match sequences of word characters and apostrophes
    const wordMatches = token.match(/[\w']+/g);
    if (wordMatches) {
      for (const match of wordMatches) {
        // Clean up leading apostrophes
        let cleaned = match.replace(/^'+/, '');
        // Clean up trailing apostrophes UNLESS it's a dropped-g contraction (e.g., believin', singin')
        // Pattern: word ending in vowel + n + apostrophe is likely a dropped-g
        if (!cleaned.match(/[aeiouy]n'$/i)) {
          cleaned = cleaned.replace(/'+$/, '');
        }
        if (cleaned) {
          words.push(cleaned);
        }
      }
    }
  }

  log('tokenizeWords output:', words);
  return words;
}

// =============================================================================
// Punctuation Extraction
// =============================================================================

/**
 * Extracts punctuation marks from a line with their positions.
 *
 * This preserves punctuation information for later use in:
 * - Rhythm analysis (pauses at commas, periods)
 * - Phrasing decisions
 * - Diff display with original text
 *
 * @param line - A single line of text
 * @returns Array of punctuation marks with their positions
 */
export function extractPunctuation(line: string): PunctuationMark[] {
  log('extractPunctuation input:', line);

  if (!line) {
    return [];
  }

  const punctuation: PunctuationMark[] = [];

  // Find all punctuation matches with their positions
  let match: RegExpExecArray | null;
  const regex = new RegExp(PUNCTUATION_PATTERN.source, 'g');

  while ((match = regex.exec(line)) !== null) {
    punctuation.push({
      char: match[0],
      position: match.index,
    });
  }

  log('extractPunctuation output count:', punctuation.length);
  return punctuation;
}

// =============================================================================
// Full Line Tokenization
// =============================================================================

/**
 * Fully tokenizes a line into words and punctuation.
 *
 * Combines tokenizeWords and extractPunctuation for complete line analysis.
 *
 * @param line - A single line of text
 * @returns TokenizedLine with words and punctuation
 */
export function tokenizeLine(line: string): TokenizedLine {
  log('tokenizeLine input:', line);

  return {
    words: tokenizeWords(line),
    punctuation: extractPunctuation(line),
  };
}

// =============================================================================
// Complete Preprocessing
// =============================================================================

/**
 * Counts total lines across all stanzas.
 *
 * @param stanzas - Array of stanzas
 * @returns Total line count
 */
function countLines(stanzas: string[][]): number {
  return stanzas.reduce((total, stanza) => total + stanza.length, 0);
}

/**
 * Preprocesses a complete poem text.
 *
 * This is the main entry point for the preprocessing pipeline.
 * It combines all preprocessing operations:
 * 1. Preserves original text
 * 2. Normalizes whitespace
 * 3. Detects stanzas
 * 4. Computes metadata
 *
 * @param text - The raw poem text
 * @returns PreprocessedPoem object with all preprocessing results
 */
export function preprocessPoem(text: string): PreprocessedPoem {
  log('preprocessPoem input length:', text.length);

  // Preserve original text
  const original = text;

  // Normalize whitespace
  const normalized = normalizeWhitespace(text);

  // Detect stanzas
  const stanzas = detectStanzas(normalized);

  // Compute metadata
  const stanzaCount = stanzas.length;
  const lineCount = countLines(stanzas);

  const result: PreprocessedPoem = {
    original,
    stanzas,
    lineCount,
    stanzaCount,
  };

  log('preprocessPoem result:', {
    stanzaCount: result.stanzaCount,
    lineCount: result.lineCount,
  });

  return result;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Reconstructs text from stanzas (for verification/display).
 *
 * @param stanzas - Array of stanzas
 * @returns Reconstructed text with stanza breaks
 */
export function reconstructText(stanzas: string[][]): string {
  return stanzas.map((stanza) => stanza.join('\n')).join('\n\n');
}

/**
 * Counts total words in a preprocessed poem.
 *
 * @param preprocessed - PreprocessedPoem object
 * @returns Total word count
 */
export function countWords(preprocessed: PreprocessedPoem): number {
  let total = 0;

  for (const stanza of preprocessed.stanzas) {
    for (const line of stanza) {
      total += tokenizeWords(line).length;
    }
  }

  return total;
}

/**
 * Gets all lines from a preprocessed poem as a flat array.
 *
 * @param preprocessed - PreprocessedPoem object
 * @returns All lines in order
 */
export function getAllLines(preprocessed: PreprocessedPoem): string[] {
  return preprocessed.stanzas.flat();
}

/**
 * Gets a specific line by global index.
 *
 * @param preprocessed - PreprocessedPoem object
 * @param lineIndex - 0-based line index
 * @returns The line at the specified index, or undefined if out of bounds
 */
export function getLine(preprocessed: PreprocessedPoem, lineIndex: number): string | undefined {
  const allLines = getAllLines(preprocessed);
  return allLines[lineIndex];
}

/**
 * Gets a specific stanza by index.
 *
 * @param preprocessed - PreprocessedPoem object
 * @param stanzaIndex - 0-based stanza index
 * @returns The stanza at the specified index, or undefined if out of bounds
 */
export function getStanza(preprocessed: PreprocessedPoem, stanzaIndex: number): string[] | undefined {
  return preprocessed.stanzas[stanzaIndex];
}
