/**
 * Tests for Groq API Client
 *
 * @module lib/groq/client.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GroqClient, createGroqClientWithUrl } from './client';
import { GroqError, type ChatCompletionResponse } from './types';

// =============================================================================
// Test Fixtures
// =============================================================================

const mockSuccessResponse: ChatCompletionResponse = {
  id: 'chatcmpl-test-123',
  object: 'chat.completion',
  created: 1699876234,
  model: 'llama-3.3-70b-versatile',
  choices: [
    {
      index: 0,
      message: { role: 'assistant', content: 'Hello! How can I help you today?' },
      finish_reason: 'stop',
    },
  ],
  usage: {
    prompt_tokens: 15,
    completion_tokens: 8,
    total_tokens: 23,
  },
};

const mockErrorResponse = {
  error: {
    message: 'Invalid request',
    type: 'invalid_request' as const,
    code: 'validation_error',
  },
};

const mockRateLimitResponse = {
  error: {
    message: 'Rate limit exceeded',
    type: 'rate_limit_error' as const,
    code: 'rate_limit',
  },
};

/**
 * Creates a mock Response object for fetch
 */
function createMockResponse(options: {
  ok: boolean;
  status?: number;
  json?: unknown;
  jsonError?: boolean;
}): Response {
  return {
    ok: options.ok,
    status: options.status ?? (options.ok ? 200 : 500),
    statusText: options.ok ? 'OK' : 'Error',
    headers: new Headers(),
    redirected: false,
    type: 'basic',
    url: '',
    clone: () => createMockResponse(options),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(JSON.stringify(options.json)),
    json: options.jsonError
      ? () => Promise.reject(new Error('Invalid JSON'))
      : () => Promise.resolve(options.json),
  } as Response;
}

// =============================================================================
// Tests
// =============================================================================

describe('GroqClient', () => {
  let client: GroqClient;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    client = createGroqClientWithUrl('https://test.supabase.co');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // Constructor Tests
  // ===========================================================================

  describe('constructor', () => {
    it('creates client with correct base URL', () => {
      const client = createGroqClientWithUrl('https://example.supabase.co');
      expect(client).toBeInstanceOf(GroqClient);
    });

    it('removes trailing slash from URL', async () => {
      const client = createGroqClientWithUrl('https://example.supabase.co/');
      global.fetch = vi.fn().mockResolvedValueOnce(
        createMockResponse({ ok: true, json: mockSuccessResponse })
      );

      await client.chat([{ role: 'user', content: 'test' }]);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.supabase.co/functions/v1/groq-chat',
        expect.any(Object)
      );
    });

    it('accepts custom configuration options', () => {
      const client = createGroqClientWithUrl('https://test.supabase.co', {
        timeout: 30000,
        defaultModel: 'custom-model',
        defaultTemperature: 0.5,
        defaultMaxTokens: 2048,
      });
      expect(client).toBeInstanceOf(GroqClient);
    });
  });

  // ===========================================================================
  // chat() Tests
  // ===========================================================================

  describe('chat', () => {
    it('sends correct request structure', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce(
        createMockResponse({ ok: true, json: mockSuccessResponse })
      );
      global.fetch = mockFetch;

      await client.chat([
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Hello' },
      ]);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];

      expect(url).toBe('https://test.supabase.co/functions/v1/groq-chat');
      expect(options.method).toBe('POST');

      const headers = options.headers as Record<string, string>;
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['X-Request-ID']).toBeDefined();

      const body = JSON.parse(options.body as string);
      expect(body.messages).toHaveLength(2);
      expect(body.messages[0].role).toBe('system');
      expect(body.messages[1].role).toBe('user');
      expect(body.model).toBe('llama-3.3-70b-versatile');
      expect(body.temperature).toBe(0.7);
      expect(body.max_tokens).toBe(4096);
    });

    it('returns ChatCompletionResponse on success', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce(
        createMockResponse({ ok: true, json: mockSuccessResponse })
      );

      const response = await client.chat([{ role: 'user', content: 'Hello' }]);

      expect(response.id).toBe('chatcmpl-test-123');
      expect(response.choices[0].message.content).toBe('Hello! How can I help you today?');
      expect(response.usage.total_tokens).toBe(23);
    });

    it('uses custom options when provided', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce(
        createMockResponse({ ok: true, json: mockSuccessResponse })
      );
      global.fetch = mockFetch;

      await client.chat(
        [{ role: 'user', content: 'Hello' }],
        {
          model: 'custom-model',
          temperature: 0.5,
          max_tokens: 1000,
          top_p: 0.9,
        }
      );

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.model).toBe('custom-model');
      expect(body.temperature).toBe(0.5);
      expect(body.max_tokens).toBe(1000);
      expect(body.top_p).toBe(0.9);
    });

    it('throws GroqError on API error response', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce(
        createMockResponse({ ok: false, status: 400, json: mockErrorResponse })
      );

      await expect(client.chat([{ role: 'user', content: 'Hello' }]))
        .rejects.toThrow(GroqError);

      global.fetch = vi.fn().mockResolvedValueOnce(
        createMockResponse({ ok: false, status: 400, json: mockErrorResponse })
      );

      try {
        await client.chat([{ role: 'user', content: 'Hello' }]);
      } catch (error) {
        expect(error).toBeInstanceOf(GroqError);
        if (error instanceof GroqError) {
          expect(error.message).toBe('Invalid request');
          expect(error.type).toBe('invalid_request');
          expect(error.status).toBe(400);
          expect(error.code).toBe('validation_error');
        }
      }
    });

    it('throws GroqError with isRateLimited=true on 429', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce(
        createMockResponse({ ok: false, status: 429, json: mockRateLimitResponse })
      );

      try {
        await client.chat([{ role: 'user', content: 'Hello' }]);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GroqError);
        if (error instanceof GroqError) {
          expect(error.isRateLimited).toBe(true);
          expect(error.isRetryable).toBe(true);
        }
      }
    });

    it('throws GroqError on non-JSON error response', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce(
        createMockResponse({ ok: false, status: 500, jsonError: true })
      );

      await expect(client.chat([{ role: 'user', content: 'Hello' }]))
        .rejects.toThrow(GroqError);
    });

    it('throws GroqError on invalid response structure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce(
        createMockResponse({ ok: true, json: { invalid: 'structure' } })
      );

      await expect(client.chat([{ role: 'user', content: 'Hello' }]))
        .rejects.toThrow('Invalid response structure from API');
    });

    it('throws GroqError on network failure', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch'));

      try {
        await client.chat([{ role: 'user', content: 'Hello' }]);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GroqError);
        if (error instanceof GroqError) {
          expect(error.type).toBe('network_error');
          expect(error.code).toBe('network_failure');
        }
      }
    });

    it('throws GroqError on abort', async () => {
      // Test that AbortError is properly handled
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      global.fetch = vi.fn().mockRejectedValueOnce(abortError);

      try {
        await client.chat([{ role: 'user', content: 'Hello' }]);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GroqError);
        if (error instanceof GroqError) {
          expect(error.type).toBe('network_error');
          expect(error.code).toBe('timeout');
          expect(error.message).toMatch(/timed out/);
        }
      }
    });
  });

  // ===========================================================================
  // chatSafe() Tests
  // ===========================================================================

  describe('chatSafe', () => {
    it('returns success result on successful request', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce(
        createMockResponse({ ok: true, json: mockSuccessResponse })
      );

      const result = await client.chatSafe([{ role: 'user', content: 'Hello' }]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.choices[0].message.content).toBe('Hello! How can I help you today?');
      }
    });

    it('returns failure result on API error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce(
        createMockResponse({ ok: false, status: 400, json: mockErrorResponse })
      );

      const result = await client.chatSafe([{ role: 'user', content: 'Hello' }]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(GroqError);
        expect(result.error.message).toBe('Invalid request');
      }
    });

    it('returns failure result on network error', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const result = await client.chatSafe([{ role: 'user', content: 'Hello' }]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('network_error');
      }
    });
  });

  // ===========================================================================
  // extractContent() Tests
  // ===========================================================================

  describe('extractContent', () => {
    it('extracts content from first choice', () => {
      const content = GroqClient.extractContent(mockSuccessResponse);
      expect(content).toBe('Hello! How can I help you today?');
    });

    it('returns empty string when no choices', () => {
      const response: ChatCompletionResponse = {
        ...mockSuccessResponse,
        choices: [],
      };
      const content = GroqClient.extractContent(response);
      expect(content).toBe('');
    });

    it('returns empty string when choice has no message content', () => {
      const response: ChatCompletionResponse = {
        ...mockSuccessResponse,
        choices: [{
          index: 0,
          message: { role: 'assistant', content: '' },
          finish_reason: 'stop',
        }],
      };
      const content = GroqClient.extractContent(response);
      expect(content).toBe('');
    });
  });

  // ===========================================================================
  // getCompletion() Tests
  // ===========================================================================

  describe('getCompletion', () => {
    it('returns just the text content', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce(
        createMockResponse({ ok: true, json: mockSuccessResponse })
      );

      const text = await client.getCompletion([{ role: 'user', content: 'Hello' }]);

      expect(text).toBe('Hello! How can I help you today?');
    });

    it('throws on error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce(
        createMockResponse({ ok: false, status: 400, json: mockErrorResponse })
      );

      await expect(client.getCompletion([{ role: 'user', content: 'Hello' }]))
        .rejects.toThrow(GroqError);
    });
  });
});

// =============================================================================
// Factory Function Tests
// =============================================================================

describe('createGroqClientWithUrl', () => {
  it('creates a client with the given URL', () => {
    const client = createGroqClientWithUrl('https://my-project.supabase.co');
    expect(client).toBeInstanceOf(GroqClient);
  });

  it('accepts optional configuration', () => {
    const client = createGroqClientWithUrl('https://my-project.supabase.co', {
      timeout: 30000,
      defaultModel: 'mixtral-8x7b-32768',
    });
    expect(client).toBeInstanceOf(GroqClient);
  });
});
