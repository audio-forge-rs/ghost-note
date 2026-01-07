/**
 * Ghost Note - Lyrics Generation Service
 *
 * Uses the Groq API to generate first draft song lyrics from poems.
 * This module provides the core functionality for transforming poems
 * into singable song lyrics.
 *
 * @module lib/groq/lyricsGeneration
 */

import { createGroqClient, GroqClient, GroqError, type ChatMessage } from './index';

// =============================================================================
// Constants
// =============================================================================

/**
 * System prompt for the lyrics generation model
 */
const LYRICS_SYSTEM_PROMPT = `You are a skilled lyricist who adapts poems into singable song lyrics.

Your task is to transform the given poem into song lyrics that:
1. Preserve the core meaning and emotional impact
2. Optimize for natural singing (smooth vowel sounds, singable phrases)
3. Maintain consistent rhythm and meter
4. Keep lines at singable lengths (typically 4-10 syllables per phrase)
5. Preserve rhyme schemes where they exist
6. Add natural breathing points and phrase breaks

Guidelines:
- Keep the essence and imagery of the original poem
- Simplify complex or awkward phrases for singing
- Replace difficult consonant clusters with smoother alternatives
- Ensure each line can be sung in one breath
- Mark verse/chorus sections if appropriate (but don't force structure)

Output ONLY the adapted lyrics, nothing else. No explanations, headers, or metadata.`;

/**
 * User prompt template for lyrics generation
 */
const LYRICS_USER_PROMPT_TEMPLATE = `Adapt this poem into singable song lyrics. Preserve meaning but optimize for singing:

{poem}`;

// =============================================================================
// Types
// =============================================================================

/**
 * Result of lyrics generation
 */
export interface LyricsGenerationResult {
  /** Whether generation succeeded */
  success: true;
  /** The generated lyrics */
  lyrics: string;
  /** Token usage statistics */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Error result from lyrics generation
 */
export interface LyricsGenerationError {
  /** Whether generation succeeded */
  success: false;
  /** Error message */
  error: string;
  /** Error type for categorization */
  errorType: 'network' | 'api' | 'rate_limit' | 'timeout' | 'unknown';
  /** Whether the error is retryable */
  isRetryable: boolean;
}

/**
 * Union type for lyrics generation result
 */
export type LyricsGenerationOutcome = LyricsGenerationResult | LyricsGenerationError;

/**
 * Options for lyrics generation
 */
export interface LyricsGenerationOptions {
  /** Temperature for generation (0-2, default: 0.7) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Custom Groq client (for testing) */
  client?: GroqClient;
}

// =============================================================================
// Logging
// =============================================================================

const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[LyricsGeneration] ${message}`, ...args);
  }
};

// =============================================================================
// Main Function
// =============================================================================

/**
 * Generates song lyrics from a poem using the Groq API.
 *
 * @param poem - The original poem text to transform
 * @param options - Optional configuration for generation
 * @returns Promise resolving to generation result or error
 *
 * @example
 * ```typescript
 * const result = await generateLyricsFromPoem(poemText);
 * if (result.success) {
 *   console.log('Generated lyrics:', result.lyrics);
 * } else {
 *   console.error('Generation failed:', result.error);
 * }
 * ```
 */
export async function generateLyricsFromPoem(
  poem: string,
  options: LyricsGenerationOptions = {}
): Promise<LyricsGenerationOutcome> {
  const { temperature = 0.7, maxTokens = 2048, client } = options;

  log('Starting lyrics generation for poem of length:', poem.length);

  // Validate input
  if (!poem.trim()) {
    log('Empty poem provided');
    return {
      success: false,
      error: 'Cannot generate lyrics from empty poem',
      errorType: 'unknown',
      isRetryable: false,
    };
  }

  try {
    // Create or use provided client
    const groqClient = client ?? createGroqClient();

    // Build messages
    const messages: ChatMessage[] = [
      { role: 'system', content: LYRICS_SYSTEM_PROMPT },
      {
        role: 'user',
        content: LYRICS_USER_PROMPT_TEMPLATE.replace('{poem}', poem),
      },
    ];

    log('Sending request to Groq API');

    // Make the API call
    const response = await groqClient.chat(messages, {
      temperature,
      max_tokens: maxTokens,
    });

    // Extract the generated lyrics
    const lyrics = GroqClient.extractContent(response).trim();

    if (!lyrics) {
      log('Empty response from Groq API');
      return {
        success: false,
        error: 'Received empty response from AI',
        errorType: 'api',
        isRetryable: true,
      };
    }

    log('Successfully generated lyrics, length:', lyrics.length);

    return {
      success: true,
      lyrics,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      },
    };
  } catch (error) {
    log('Error generating lyrics:', error);

    if (error instanceof GroqError) {
      return {
        success: false,
        error: error.message,
        errorType: mapGroqErrorType(error.type),
        isRetryable: error.isRetryable,
      };
    }

    // Handle configuration errors (e.g., missing VITE_SUPABASE_URL)
    if (error instanceof Error && error.message.includes('VITE_SUPABASE_URL')) {
      return {
        success: false,
        error: 'AI service is not configured. Please check your environment settings.',
        errorType: 'api',
        isRetryable: false,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorType: 'unknown',
      isRetryable: false,
    };
  }
}

/**
 * Maps Groq error types to our simplified error categories
 */
function mapGroqErrorType(
  groqType: string
): 'network' | 'api' | 'rate_limit' | 'timeout' | 'unknown' {
  switch (groqType) {
    case 'network_error':
      return 'network';
    case 'rate_limit_error':
      return 'rate_limit';
    case 'invalid_request':
    case 'authentication_error':
    case 'api_error':
    case 'server_error':
      return 'api';
    default:
      return 'unknown';
  }
}

/**
 * Checks if a poem text is suitable for lyrics generation.
 * Used to validate before making API calls.
 *
 * @param poem - The poem text to validate
 * @returns Validation result with optional error message
 */
export function validatePoemForLyrics(poem: string): {
  isValid: boolean;
  error?: string;
} {
  const trimmed = poem.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Poem text is empty' };
  }

  if (trimmed.length < 10) {
    return { isValid: false, error: 'Poem is too short for meaningful lyrics' };
  }

  if (trimmed.length > 10000) {
    return { isValid: false, error: 'Poem exceeds maximum length for lyrics generation' };
  }

  return { isValid: true };
}
