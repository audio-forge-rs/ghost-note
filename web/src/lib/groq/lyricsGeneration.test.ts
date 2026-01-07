/**
 * Tests for Lyrics Generation Service
 *
 * @module lib/groq/lyricsGeneration.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateLyricsFromPoem, validatePoemForLyrics } from './lyricsGeneration';
import { GroqClient, createGroqClientWithUrl } from './client';
import { GroqError, type ChatCompletionResponse } from './types';

// =============================================================================
// Test Fixtures
// =============================================================================

const samplePoem = `Shall I compare thee to a summer's day?
Thou art more lovely and more temperate.
Rough winds do shake the darling buds of May,
And summer's lease hath all too short a date.`;

const generatedLyrics = `Should I compare you to a summer day?
You are more lovely, and more calm and true.
The rough winds shake the tender buds of May,
And summer's time will fade too soon from view.`;

const mockSuccessResponse: ChatCompletionResponse = {
  id: 'chatcmpl-lyrics-123',
  object: 'chat.completion',
  created: 1699876234,
  model: 'llama-3.3-70b-versatile',
  choices: [
    {
      index: 0,
      message: { role: 'assistant', content: generatedLyrics },
      finish_reason: 'stop',
    },
  ],
  usage: {
    prompt_tokens: 150,
    completion_tokens: 80,
    total_tokens: 230,
  },
};

const mockEmptyResponse: ChatCompletionResponse = {
  ...mockSuccessResponse,
  choices: [
    {
      index: 0,
      message: { role: 'assistant', content: '' },
      finish_reason: 'stop',
    },
  ],
};

/**
 * Creates a mock GroqClient for testing
 */
function createMockClient(
  mockChat: (
    messages: import('./types').ChatMessage[],
    options?: Partial<Omit<import('./types').ChatCompletionRequest, 'messages'>>
  ) => Promise<ChatCompletionResponse>
): GroqClient {
  const client = createGroqClientWithUrl('https://test.supabase.co');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client.chat = mockChat as any;
  return client;
}

// =============================================================================
// Tests
// =============================================================================

describe('generateLyricsFromPoem', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // Success Cases
  // ===========================================================================

  describe('success cases', () => {
    it('generates lyrics from a valid poem', async () => {
      const mockChat = vi.fn().mockResolvedValueOnce(mockSuccessResponse);
      const customClient = createMockClient(mockChat);

      const result = await generateLyricsFromPoem(samplePoem, { client: customClient });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.lyrics).toBe(generatedLyrics);
        expect(result.usage.totalTokens).toBe(230);
        expect(result.usage.promptTokens).toBe(150);
        expect(result.usage.completionTokens).toBe(80);
      }
    });

    it('uses custom client when provided', async () => {
      const mockChat = vi.fn().mockResolvedValueOnce(mockSuccessResponse);
      const customClient = createMockClient(mockChat);

      const result = await generateLyricsFromPoem(samplePoem, { client: customClient });

      expect(result.success).toBe(true);
      expect(mockChat).toHaveBeenCalledTimes(1);

      // Verify correct message structure
      const [messages, options] = mockChat.mock.calls[0];
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('system');
      expect(messages[1].role).toBe('user');
      expect(messages[1].content).toContain(samplePoem);
      expect(options.temperature).toBe(0.7);
      expect(options.max_tokens).toBe(2048);
    });

    it('uses custom temperature and maxTokens when provided', async () => {
      const mockChat = vi.fn().mockResolvedValueOnce(mockSuccessResponse);
      const customClient = createMockClient(mockChat);

      await generateLyricsFromPoem(samplePoem, {
        client: customClient,
        temperature: 0.5,
        maxTokens: 1000,
      });

      const [, options] = mockChat.mock.calls[0];
      expect(options.temperature).toBe(0.5);
      expect(options.max_tokens).toBe(1000);
    });

    it('trims whitespace from generated lyrics', async () => {
      const responseWithWhitespace: ChatCompletionResponse = {
        ...mockSuccessResponse,
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: `\n\n${generatedLyrics}\n\n` },
            finish_reason: 'stop',
          },
        ],
      };
      const mockChat = vi.fn().mockResolvedValueOnce(responseWithWhitespace);
      const customClient = createMockClient(mockChat);

      const result = await generateLyricsFromPoem(samplePoem, { client: customClient });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.lyrics).toBe(generatedLyrics);
        expect(result.lyrics.startsWith('\n')).toBe(false);
        expect(result.lyrics.endsWith('\n')).toBe(false);
      }
    });
  });

  // ===========================================================================
  // Error Cases
  // ===========================================================================

  describe('error cases', () => {
    it('returns error for empty poem', async () => {
      const result = await generateLyricsFromPoem('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Cannot generate lyrics from empty poem');
        expect(result.errorType).toBe('unknown');
        expect(result.isRetryable).toBe(false);
      }
    });

    it('returns error for whitespace-only poem', async () => {
      const result = await generateLyricsFromPoem('   \n\t   ');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Cannot generate lyrics from empty poem');
      }
    });

    it('returns error when API returns empty response', async () => {
      const mockChat = vi.fn().mockResolvedValueOnce(mockEmptyResponse);
      const customClient = createMockClient(mockChat);

      const result = await generateLyricsFromPoem(samplePoem, { client: customClient });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Received empty response from AI');
        expect(result.errorType).toBe('api');
        expect(result.isRetryable).toBe(true);
      }
    });

    it('handles GroqError correctly', async () => {
      const mockChat = vi.fn().mockRejectedValueOnce(
        new GroqError('Rate limit exceeded', 'rate_limit_error', 429, 'rate_limit')
      );
      const customClient = createMockClient(mockChat);

      const result = await generateLyricsFromPoem(samplePoem, { client: customClient });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Rate limit exceeded');
        expect(result.errorType).toBe('rate_limit');
        expect(result.isRetryable).toBe(true);
      }
    });

    it('handles network error correctly', async () => {
      const mockChat = vi.fn().mockRejectedValueOnce(
        new GroqError('Network error: Unable to reach the server', 'network_error', 0, 'network_failure')
      );
      const customClient = createMockClient(mockChat);

      const result = await generateLyricsFromPoem(samplePoem, { client: customClient });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorType).toBe('network');
        expect(result.isRetryable).toBe(true);
      }
    });

    it('handles API error correctly', async () => {
      const mockChat = vi.fn().mockRejectedValueOnce(
        new GroqError('Invalid request', 'invalid_request', 400, 'validation_error')
      );
      const customClient = createMockClient(mockChat);

      const result = await generateLyricsFromPoem(samplePoem, { client: customClient });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorType).toBe('api');
        expect(result.isRetryable).toBe(false);
      }
    });

    it('handles configuration error (missing VITE_SUPABASE_URL)', async () => {
      const configError = new Error('VITE_SUPABASE_URL environment variable is required');
      const mockChat = vi.fn().mockRejectedValueOnce(configError);
      const customClient = createMockClient(mockChat);

      const result = await generateLyricsFromPoem(samplePoem, { client: customClient });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('AI service is not configured');
        expect(result.errorType).toBe('api');
        expect(result.isRetryable).toBe(false);
      }
    });

    it('handles unexpected errors', async () => {
      const mockChat = vi.fn().mockRejectedValueOnce(new Error('Unexpected error'));
      const customClient = createMockClient(mockChat);

      const result = await generateLyricsFromPoem(samplePoem, { client: customClient });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unexpected error');
        expect(result.errorType).toBe('unknown');
        expect(result.isRetryable).toBe(false);
      }
    });

    it('handles non-Error thrown values', async () => {
      const mockChat = vi.fn().mockRejectedValueOnce('string error');
      const customClient = createMockClient(mockChat);

      const result = await generateLyricsFromPoem(samplePoem, { client: customClient });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unknown error occurred');
        expect(result.errorType).toBe('unknown');
      }
    });
  });

  // ===========================================================================
  // Integration-style tests
  // ===========================================================================

  describe('integration behavior', () => {
    it('sends correct prompt structure', async () => {
      const mockChat = vi.fn().mockResolvedValueOnce(mockSuccessResponse);
      const customClient = createMockClient(mockChat);

      await generateLyricsFromPoem(samplePoem, { client: customClient });

      const [messages] = mockChat.mock.calls[0];

      // Verify system prompt contains key instructions
      const systemPrompt = messages[0].content;
      expect(systemPrompt).toContain('lyricist');
      expect(systemPrompt).toContain('singable');
      expect(systemPrompt).toContain('rhythm');
      expect(systemPrompt).toContain('rhyme');

      // Verify user prompt contains the poem
      const userPrompt = messages[1].content;
      expect(userPrompt).toContain('Adapt this poem into singable song lyrics');
      expect(userPrompt).toContain(samplePoem);
    });
  });
});

// =============================================================================
// validatePoemForLyrics Tests
// =============================================================================

describe('validatePoemForLyrics', () => {
  it('returns valid for normal poem', () => {
    const result = validatePoemForLyrics(samplePoem);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('returns invalid for empty string', () => {
    const result = validatePoemForLyrics('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Poem text is empty');
  });

  it('returns invalid for whitespace-only string', () => {
    const result = validatePoemForLyrics('   \n\t   ');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Poem text is empty');
  });

  it('returns invalid for very short poem', () => {
    const result = validatePoemForLyrics('Too short');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Poem is too short for meaningful lyrics');
  });

  it('returns valid for minimum length poem', () => {
    const result = validatePoemForLyrics('1234567890'); // Exactly 10 chars
    expect(result.isValid).toBe(true);
  });

  it('returns invalid for poem exceeding max length', () => {
    const longPoem = 'a'.repeat(10001);
    const result = validatePoemForLyrics(longPoem);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Poem exceeds maximum length for lyrics generation');
  });

  it('returns valid for poem at max length', () => {
    const maxPoem = 'a'.repeat(10000);
    const result = validatePoemForLyrics(maxPoem);
    expect(result.isValid).toBe(true);
  });
});
