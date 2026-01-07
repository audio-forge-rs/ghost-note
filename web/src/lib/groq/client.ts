/**
 * Ghost Note - Groq API Client
 *
 * Client for interacting with the Groq API through a Supabase Edge Function proxy.
 * This keeps the API key secure on the server side while providing a clean interface
 * for the frontend.
 *
 * ## Usage
 *
 * ```typescript
 * import { createGroqClient } from './lib/groq';
 *
 * const client = createGroqClient();
 *
 * // Simple completion
 * const response = await client.chat([
 *   { role: 'user', content: 'Hello!' }
 * ]);
 *
 * console.log(response.choices[0].message.content);
 * ```
 *
 * @module lib/groq/client
 */

import {
  type ChatMessage,
  type ChatCompletionRequest,
  type ChatCompletionResponse,
  type GroqClientConfig,
  type GroqResult,
  GroqError,
  isChatCompletionResponse,
  isGroqErrorResponse,
  success,
  failure,
} from './types';

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_TIMEOUT = 60000; // 60 seconds
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 4096;

// =============================================================================
// GroqClient Class
// =============================================================================

/**
 * Client for interacting with the Groq API through Supabase Edge Function
 */
export class GroqClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly defaultModel: string;
  private readonly defaultTemperature: number;
  private readonly defaultMaxTokens: number;

  /**
   * Creates a new GroqClient instance
   */
  constructor(config: GroqClientConfig) {
    // Remove trailing slash from URL
    this.baseUrl = config.supabaseUrl.replace(/\/$/, '');
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.defaultModel = config.defaultModel ?? DEFAULT_MODEL;
    this.defaultTemperature = config.defaultTemperature ?? DEFAULT_TEMPERATURE;
    this.defaultMaxTokens = config.defaultMaxTokens ?? DEFAULT_MAX_TOKENS;

    console.log('[GroqClient] Initialized with base URL:', this.baseUrl);
  }

  /**
   * Gets the full URL for the Groq chat endpoint
   */
  private get chatUrl(): string {
    return `${this.baseUrl}/functions/v1/groq-chat`;
  }

  /**
   * Performs a chat completion request
   *
   * @param messages - Array of chat messages
   * @param options - Optional request parameters
   * @returns Promise resolving to chat completion response
   * @throws GroqError on failure
   */
  async chat(
    messages: ChatMessage[],
    options?: Partial<Omit<ChatCompletionRequest, 'messages'>>
  ): Promise<ChatCompletionResponse> {
    const requestId = crypto.randomUUID();
    console.log(`[GroqClient][${requestId}] Starting chat request with ${messages.length} messages`);

    // Build request body
    const body: ChatCompletionRequest = {
      messages,
      model: options?.model ?? this.defaultModel,
      temperature: options?.temperature ?? this.defaultTemperature,
      max_tokens: options?.max_tokens ?? this.defaultMaxTokens,
      ...(options?.top_p !== undefined && { top_p: options.top_p }),
    };

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.log(`[GroqClient][${requestId}] Request timed out after ${this.timeout}ms`);
    }, this.timeout);

    try {
      console.log(`[GroqClient][${requestId}] Sending request to ${this.chatUrl}`);

      const response = await fetch(this.chatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response body
      let data: unknown;
      try {
        data = await response.json();
      } catch (e) {
        console.error(`[GroqClient][${requestId}] Failed to parse response JSON:`, e);
        throw new GroqError(
          'Failed to parse API response',
          'api_error',
          response.status
        );
      }

      // Handle error responses
      if (!response.ok) {
        console.error(`[GroqClient][${requestId}] API error (${response.status}):`, data);

        if (isGroqErrorResponse(data)) {
          throw GroqError.fromResponse(data, response.status);
        }

        throw new GroqError(
          `API request failed with status ${response.status}`,
          'api_error',
          response.status
        );
      }

      // Validate successful response
      if (!isChatCompletionResponse(data)) {
        console.error(`[GroqClient][${requestId}] Invalid response structure:`, data);
        throw new GroqError(
          'Invalid response structure from API',
          'api_error',
          response.status
        );
      }

      console.log(
        `[GroqClient][${requestId}] Success - tokens used: ${data.usage.total_tokens}`
      );

      return data;

    } catch (error) {
      clearTimeout(timeoutId);

      // Re-throw GroqError as-is
      if (error instanceof GroqError) {
        throw error;
      }

      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new GroqError(
          `Request timed out after ${this.timeout}ms`,
          'network_error',
          0,
          'timeout'
        );
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error(`[GroqClient][${requestId}] Network error:`, error);
        throw new GroqError(
          'Network error: Unable to reach the server',
          'network_error',
          0,
          'network_failure'
        );
      }

      // Handle unknown errors
      console.error(`[GroqClient][${requestId}] Unexpected error:`, error);
      throw new GroqError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'api_error',
        0
      );
    }
  }

  /**
   * Performs a chat completion request with error handling
   * Returns a Result type instead of throwing
   *
   * @param messages - Array of chat messages
   * @param options - Optional request parameters
   * @returns Promise resolving to Result<ChatCompletionResponse>
   */
  async chatSafe(
    messages: ChatMessage[],
    options?: Partial<Omit<ChatCompletionRequest, 'messages'>>
  ): Promise<GroqResult<ChatCompletionResponse>> {
    try {
      const data = await this.chat(messages, options);
      return success(data);
    } catch (error) {
      if (error instanceof GroqError) {
        return failure(error);
      }
      // This shouldn't happen, but handle it anyway
      return failure(
        new GroqError(
          error instanceof Error ? error.message : 'Unknown error',
          'api_error',
          0
        )
      );
    }
  }

  /**
   * Extracts the text content from the first choice of a completion response
   *
   * @param response - Chat completion response
   * @returns The message content or empty string if no choices
   */
  static extractContent(response: ChatCompletionResponse): string {
    return response.choices[0]?.message?.content ?? '';
  }

  /**
   * Simple helper to get just the text response from a chat
   *
   * @param messages - Array of chat messages
   * @param options - Optional request parameters
   * @returns Promise resolving to the response text
   */
  async getCompletion(
    messages: ChatMessage[],
    options?: Partial<Omit<ChatCompletionRequest, 'messages'>>
  ): Promise<string> {
    const response = await this.chat(messages, options);
    return GroqClient.extractContent(response);
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Creates a new GroqClient instance using environment configuration
 *
 * Uses VITE_SUPABASE_URL environment variable for the Supabase URL.
 *
 * @param options - Optional configuration overrides
 * @returns Configured GroqClient instance
 * @throws Error if VITE_SUPABASE_URL is not set
 */
export function createGroqClient(
  options?: Partial<Omit<GroqClientConfig, 'supabaseUrl'>>
): GroqClient {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  if (!supabaseUrl) {
    console.error('[GroqClient] VITE_SUPABASE_URL environment variable is not set');
    throw new Error(
      'VITE_SUPABASE_URL environment variable is required. ' +
      'Please set it to your Supabase project URL (e.g., https://xxx.supabase.co)'
    );
  }

  return new GroqClient({
    supabaseUrl,
    ...options,
  });
}

/**
 * Creates a GroqClient with a custom URL (useful for testing)
 *
 * @param url - The base URL for the Supabase Edge Function
 * @param options - Optional configuration
 * @returns Configured GroqClient instance
 */
export function createGroqClientWithUrl(
  url: string,
  options?: Partial<Omit<GroqClientConfig, 'supabaseUrl'>>
): GroqClient {
  return new GroqClient({
    supabaseUrl: url,
    ...options,
  });
}
