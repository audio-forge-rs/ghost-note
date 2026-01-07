/**
 * Ghost Note - Groq API Module
 *
 * This module provides the client for interacting with the Groq API through
 * a Supabase Edge Function proxy. The API key is kept secure on the server side.
 *
 * ## Architecture
 *
 * ```
 * Frontend (GitHub Pages)
 *         ↓
 *    GroqClient
 *         ↓
 * Supabase Edge Function
 *         ↓
 *    Groq API
 * ```
 *
 * ## Usage
 *
 * ```typescript
 * import { createGroqClient, type ChatMessage } from '@/lib/groq';
 *
 * // Create client (uses VITE_SUPABASE_URL env var)
 * const groq = createGroqClient();
 *
 * // Send a chat request
 * const response = await groq.chat([
 *   { role: 'system', content: 'You are a helpful assistant.' },
 *   { role: 'user', content: 'Hello!' }
 * ]);
 *
 * // Get the response text
 * const text = GroqClient.extractContent(response);
 * console.log(text);
 * ```
 *
 * ## Error Handling
 *
 * ```typescript
 * import { createGroqClient, GroqError } from '@/lib/groq';
 *
 * const groq = createGroqClient();
 *
 * try {
 *   const response = await groq.chat(messages);
 * } catch (error) {
 *   if (error instanceof GroqError) {
 *     if (error.isRateLimited) {
 *       console.log('Rate limited, please wait...');
 *     } else if (error.isRetryable) {
 *       console.log('Retryable error:', error.message);
 *     } else {
 *       console.log('Error:', error.message);
 *     }
 *   }
 * }
 *
 * // Or use the safe variant that returns a Result type:
 * const result = await groq.chatSafe(messages);
 * if (result.success) {
 *   console.log(result.data.choices[0].message.content);
 * } else {
 *   console.log('Error:', result.error.message);
 * }
 * ```
 *
 * @module lib/groq
 */

// =============================================================================
// Client Exports
// =============================================================================

export {
  GroqClient,
  createGroqClient,
  createGroqClientWithUrl,
} from './client';

// =============================================================================
// Type Exports
// =============================================================================

export type {
  // Message types
  ChatRole,
  ChatMessage,

  // Request types
  ChatCompletionRequest,
  GroqClientConfig,

  // Response types
  ChatCompletionChoice,
  ChatCompletionUsage,
  ChatCompletionResponse,

  // Error types
  GroqErrorType,
  GroqErrorResponse,

  // Result types
  GroqResult,
} from './types';

// =============================================================================
// Utility Exports
// =============================================================================

export {
  // Error class
  GroqError,

  // Type guards
  isChatMessage,
  isChatCompletionResponse,
  isGroqErrorResponse,

  // Result helpers
  success,
  failure,
} from './types';
