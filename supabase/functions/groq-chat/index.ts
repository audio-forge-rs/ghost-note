/**
 * Supabase Edge Function: Groq Chat Proxy
 *
 * This function proxies requests to the Groq API, keeping the API key secure
 * on the server side. It handles:
 *
 * - CORS headers for GitHub Pages origin
 * - Request validation
 * - Error handling with informative messages
 * - Rate limiting awareness
 *
 * @module supabase/functions/groq-chat
 */

// Deno runtime types
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response>): void;
};

// =============================================================================
// Types
// =============================================================================

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

interface GroqChoice {
  index: number;
  message: ChatMessage;
  finish_reason: string;
}

interface GroqUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface GroqResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: GroqChoice[];
  usage: GroqUsage;
}

interface ErrorResponse {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

// =============================================================================
// Configuration
// =============================================================================

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_TEMPERATURE = 0.7;

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://bedwards.github.io',
  'http://localhost:5173',
  'http://localhost:5001',
  'http://localhost:5002',
  'http://localhost:5003',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5001',
  'http://127.0.0.1:5002',
  'http://127.0.0.1:5003',
];

// =============================================================================
// Utilities
// =============================================================================

/**
 * Gets the appropriate CORS origin header value
 */
function getCorsOrigin(requestOrigin: string | null): string {
  if (!requestOrigin) {
    return ALLOWED_ORIGINS[0];
  }

  // Check if origin is in allowed list
  if (ALLOWED_ORIGINS.includes(requestOrigin)) {
    return requestOrigin;
  }

  // Allow any localhost port for development
  if (requestOrigin.startsWith('http://localhost:') || requestOrigin.startsWith('http://127.0.0.1:')) {
    return requestOrigin;
  }

  // Default to production origin
  return ALLOWED_ORIGINS[0];
}

/**
 * Creates standard CORS headers
 */
function getCorsHeaders(requestOrigin: string | null): HeadersInit {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(requestOrigin),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Creates a JSON response with CORS headers
 */
function jsonResponse(
  data: unknown,
  status: number,
  requestOrigin: string | null
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(requestOrigin),
    },
  });
}

/**
 * Creates an error response
 */
function errorResponse(
  message: string,
  type: string,
  status: number,
  requestOrigin: string | null,
  code?: string
): Response {
  const error: ErrorResponse = {
    error: {
      message,
      type,
      ...(code && { code }),
    },
  };
  return jsonResponse(error, status, requestOrigin);
}

/**
 * Validates a chat message
 */
function isValidMessage(msg: unknown): msg is ChatMessage {
  if (typeof msg !== 'object' || msg === null) {
    return false;
  }
  const m = msg as Record<string, unknown>;
  return (
    (m.role === 'system' || m.role === 'user' || m.role === 'assistant') &&
    typeof m.content === 'string' &&
    m.content.length > 0
  );
}

/**
 * Validates the chat request body
 */
function validateRequest(body: unknown): { valid: true; data: ChatRequest } | { valid: false; error: string } {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  const req = body as Record<string, unknown>;

  // Check messages array
  if (!Array.isArray(req.messages)) {
    return { valid: false, error: 'messages must be an array' };
  }

  if (req.messages.length === 0) {
    return { valid: false, error: 'messages array cannot be empty' };
  }

  // Validate each message
  for (let i = 0; i < req.messages.length; i++) {
    if (!isValidMessage(req.messages[i])) {
      return {
        valid: false,
        error: `Invalid message at index ${i}: must have role (system|user|assistant) and non-empty content`,
      };
    }
  }

  // Validate optional parameters
  if (req.model !== undefined && typeof req.model !== 'string') {
    return { valid: false, error: 'model must be a string' };
  }

  if (req.temperature !== undefined) {
    if (typeof req.temperature !== 'number' || req.temperature < 0 || req.temperature > 2) {
      return { valid: false, error: 'temperature must be a number between 0 and 2' };
    }
  }

  if (req.max_tokens !== undefined) {
    if (typeof req.max_tokens !== 'number' || req.max_tokens < 1 || req.max_tokens > 131072) {
      return { valid: false, error: 'max_tokens must be a number between 1 and 131072' };
    }
  }

  if (req.top_p !== undefined) {
    if (typeof req.top_p !== 'number' || req.top_p < 0 || req.top_p > 1) {
      return { valid: false, error: 'top_p must be a number between 0 and 1' };
    }
  }

  // Streaming not supported in this version
  if (req.stream === true) {
    return { valid: false, error: 'Streaming is not currently supported' };
  }

  return {
    valid: true,
    data: {
      messages: req.messages as ChatMessage[],
      model: (req.model as string) || DEFAULT_MODEL,
      temperature: (req.temperature as number) ?? DEFAULT_TEMPERATURE,
      max_tokens: (req.max_tokens as number) ?? DEFAULT_MAX_TOKENS,
      top_p: req.top_p as number | undefined,
      stream: false,
    },
  };
}

// =============================================================================
// Main Handler
// =============================================================================

Deno.serve(async (req: Request): Promise<Response> => {
  const requestOrigin = req.headers.get('origin');
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  console.log(`[${requestId}] ${req.method} request from origin: ${requestOrigin}`);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log(`[${requestId}] Handling CORS preflight`);
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(requestOrigin),
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log(`[${requestId}] Method not allowed: ${req.method}`);
    return errorResponse(
      'Method not allowed. Use POST.',
      'invalid_request',
      405,
      requestOrigin
    );
  }

  // Get API key from environment
  const apiKey = Deno.env.get('GROQ_API_KEY');
  if (!apiKey) {
    console.error(`[${requestId}] GROQ_API_KEY not configured`);
    return errorResponse(
      'Server configuration error: API key not configured',
      'server_error',
      500,
      requestOrigin,
      'missing_api_key'
    );
  }

  // Parse request body
  let body: unknown;
  try {
    body = await req.json();
  } catch (e) {
    console.error(`[${requestId}] Failed to parse JSON:`, e);
    return errorResponse(
      'Invalid JSON in request body',
      'invalid_request',
      400,
      requestOrigin
    );
  }

  // Validate request
  const validation = validateRequest(body);
  if (!validation.valid) {
    console.log(`[${requestId}] Validation failed: ${validation.error}`);
    return errorResponse(
      validation.error,
      'invalid_request',
      400,
      requestOrigin
    );
  }

  const chatRequest = validation.data;
  console.log(`[${requestId}] Processing chat request with ${chatRequest.messages.length} messages, model: ${chatRequest.model}`);

  // Forward request to Groq API
  try {
    const groqResponse = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: chatRequest.model,
        messages: chatRequest.messages,
        temperature: chatRequest.temperature,
        max_tokens: chatRequest.max_tokens,
        ...(chatRequest.top_p !== undefined && { top_p: chatRequest.top_p }),
        stream: false,
      }),
    });

    // Handle Groq API errors
    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error(`[${requestId}] Groq API error (${groqResponse.status}):`, errorText);

      // Parse error if possible
      let errorMessage = 'Groq API request failed';
      let errorCode: string | undefined;

      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
        if (errorJson.error?.code) {
          errorCode = errorJson.error.code;
        }
      } catch {
        // Use raw error text if not JSON
        errorMessage = errorText || errorMessage;
      }

      // Map Groq status codes to appropriate responses
      if (groqResponse.status === 401) {
        return errorResponse(
          'Invalid API key',
          'authentication_error',
          500,
          requestOrigin,
          'invalid_api_key'
        );
      }

      if (groqResponse.status === 429) {
        return errorResponse(
          'Rate limit exceeded. Please try again later.',
          'rate_limit_error',
          429,
          requestOrigin,
          'rate_limit'
        );
      }

      if (groqResponse.status >= 500) {
        return errorResponse(
          'Groq API service unavailable',
          'api_error',
          502,
          requestOrigin,
          'upstream_error'
        );
      }

      return errorResponse(
        errorMessage,
        'api_error',
        groqResponse.status,
        requestOrigin,
        errorCode
      );
    }

    // Parse and return successful response
    const responseData: GroqResponse = await groqResponse.json();
    console.log(`[${requestId}] Success - tokens used: ${responseData.usage?.total_tokens || 'unknown'}`);

    return jsonResponse(responseData, 200, requestOrigin);

  } catch (e) {
    console.error(`[${requestId}] Network error:`, e);
    return errorResponse(
      'Failed to connect to Groq API',
      'network_error',
      502,
      requestOrigin,
      'connection_failed'
    );
  }
});
