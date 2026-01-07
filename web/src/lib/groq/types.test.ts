/**
 * Tests for Groq API Types
 *
 * @module lib/groq/types.test
 */

import { describe, it, expect } from 'vitest';
import {
  GroqError,
  isChatMessage,
  isChatCompletionResponse,
  isGroqErrorResponse,
  success,
  failure,
  type ChatMessage,
  type ChatCompletionResponse,
  type GroqErrorResponse,
} from './types';

// =============================================================================
// GroqError Tests
// =============================================================================

describe('GroqError', () => {
  it('creates error with all properties', () => {
    const error = new GroqError('Test message', 'api_error', 500, 'test_code');

    expect(error.message).toBe('Test message');
    expect(error.type).toBe('api_error');
    expect(error.status).toBe(500);
    expect(error.code).toBe('test_code');
    expect(error.name).toBe('GroqError');
  });

  it('creates error without code', () => {
    const error = new GroqError('Test message', 'api_error', 400);

    expect(error.message).toBe('Test message');
    expect(error.code).toBeUndefined();
  });

  describe('isRetryable', () => {
    it('returns true for rate_limit_error', () => {
      const error = new GroqError('Rate limited', 'rate_limit_error', 429);
      expect(error.isRetryable).toBe(true);
    });

    it('returns true for network_error', () => {
      const error = new GroqError('Network error', 'network_error', 0);
      expect(error.isRetryable).toBe(true);
    });

    it('returns true for api_error with 5xx status', () => {
      const error = new GroqError('Server error', 'api_error', 502);
      expect(error.isRetryable).toBe(true);
    });

    it('returns false for api_error with 4xx status', () => {
      const error = new GroqError('Bad request', 'api_error', 400);
      expect(error.isRetryable).toBe(false);
    });

    it('returns false for authentication_error', () => {
      const error = new GroqError('Unauthorized', 'authentication_error', 401);
      expect(error.isRetryable).toBe(false);
    });

    it('returns false for invalid_request', () => {
      const error = new GroqError('Invalid', 'invalid_request', 400);
      expect(error.isRetryable).toBe(false);
    });
  });

  describe('isRateLimited', () => {
    it('returns true for rate_limit_error', () => {
      const error = new GroqError('Rate limited', 'rate_limit_error', 429);
      expect(error.isRateLimited).toBe(true);
    });

    it('returns false for other error types', () => {
      const error = new GroqError('Server error', 'api_error', 500);
      expect(error.isRateLimited).toBe(false);
    });
  });

  describe('fromResponse', () => {
    it('creates error from GroqErrorResponse', () => {
      const response: GroqErrorResponse = {
        error: {
          message: 'Invalid API key',
          type: 'authentication_error',
          code: 'invalid_api_key',
        },
      };

      const error = GroqError.fromResponse(response, 401);

      expect(error.message).toBe('Invalid API key');
      expect(error.type).toBe('authentication_error');
      expect(error.status).toBe(401);
      expect(error.code).toBe('invalid_api_key');
    });

    it('creates error without code when not provided', () => {
      const response: GroqErrorResponse = {
        error: {
          message: 'Bad request',
          type: 'invalid_request',
        },
      };

      const error = GroqError.fromResponse(response, 400);

      expect(error.code).toBeUndefined();
    });
  });
});

// =============================================================================
// Type Guard Tests
// =============================================================================

describe('isChatMessage', () => {
  it('returns true for valid user message', () => {
    const msg: ChatMessage = { role: 'user', content: 'Hello' };
    expect(isChatMessage(msg)).toBe(true);
  });

  it('returns true for valid system message', () => {
    const msg: ChatMessage = { role: 'system', content: 'You are helpful' };
    expect(isChatMessage(msg)).toBe(true);
  });

  it('returns true for valid assistant message', () => {
    const msg: ChatMessage = { role: 'assistant', content: 'Hi there!' };
    expect(isChatMessage(msg)).toBe(true);
  });

  it('returns false for invalid role', () => {
    expect(isChatMessage({ role: 'bot', content: 'Hello' })).toBe(false);
  });

  it('returns false for missing content', () => {
    expect(isChatMessage({ role: 'user' })).toBe(false);
  });

  it('returns false for non-string content', () => {
    expect(isChatMessage({ role: 'user', content: 123 })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isChatMessage(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isChatMessage(undefined)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isChatMessage('hello')).toBe(false);
    expect(isChatMessage(123)).toBe(false);
  });
});

describe('isChatCompletionResponse', () => {
  const validResponse: ChatCompletionResponse = {
    id: 'chatcmpl-123',
    object: 'chat.completion',
    created: 1699876234,
    model: 'llama-3.3-70b-versatile',
    choices: [
      {
        index: 0,
        message: { role: 'assistant', content: 'Hello!' },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 5,
      total_tokens: 15,
    },
  };

  it('returns true for valid response', () => {
    expect(isChatCompletionResponse(validResponse)).toBe(true);
  });

  it('returns false for missing id', () => {
    const response = { ...validResponse, id: undefined };
    expect(isChatCompletionResponse(response)).toBe(false);
  });

  it('returns false for wrong object type', () => {
    const response = { ...validResponse, object: 'completion' };
    expect(isChatCompletionResponse(response)).toBe(false);
  });

  it('returns false for missing created', () => {
    const response = { ...validResponse, created: undefined };
    expect(isChatCompletionResponse(response)).toBe(false);
  });

  it('returns false for missing model', () => {
    const response = { ...validResponse, model: undefined };
    expect(isChatCompletionResponse(response)).toBe(false);
  });

  it('returns false for non-array choices', () => {
    const response = { ...validResponse, choices: 'invalid' };
    expect(isChatCompletionResponse(response)).toBe(false);
  });

  it('returns false for missing usage', () => {
    const response = { ...validResponse, usage: undefined };
    expect(isChatCompletionResponse(response)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isChatCompletionResponse(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isChatCompletionResponse(undefined)).toBe(false);
  });
});

describe('isGroqErrorResponse', () => {
  it('returns true for valid error response', () => {
    const response: GroqErrorResponse = {
      error: {
        message: 'Invalid request',
        type: 'invalid_request',
      },
    };
    expect(isGroqErrorResponse(response)).toBe(true);
  });

  it('returns true for error response with code', () => {
    const response: GroqErrorResponse = {
      error: {
        message: 'Rate limited',
        type: 'rate_limit_error',
        code: 'rate_limit',
      },
    };
    expect(isGroqErrorResponse(response)).toBe(true);
  });

  it('returns false for missing error property', () => {
    expect(isGroqErrorResponse({})).toBe(false);
  });

  it('returns false for null error', () => {
    expect(isGroqErrorResponse({ error: null })).toBe(false);
  });

  it('returns false for missing message', () => {
    expect(isGroqErrorResponse({ error: { type: 'api_error' } })).toBe(false);
  });

  it('returns false for missing type', () => {
    expect(isGroqErrorResponse({ error: { message: 'Error' } })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isGroqErrorResponse(null)).toBe(false);
  });
});

// =============================================================================
// Result Helper Tests
// =============================================================================

describe('success', () => {
  it('creates a success result with data', () => {
    const result = success({ value: 42 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ value: 42 });
    }
  });

  it('creates a success result with string data', () => {
    const result = success('hello');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('hello');
    }
  });
});

describe('failure', () => {
  it('creates a failure result with error', () => {
    const error = new GroqError('Test error', 'api_error', 500);
    const result = failure<string>(error);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(error);
      expect(result.error.message).toBe('Test error');
    }
  });
});
