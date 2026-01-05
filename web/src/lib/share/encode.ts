/**
 * Ghost Note - Share Encoding
 *
 * Functions for encoding project data for URL sharing.
 * Uses compression and base64 encoding for reasonable URL lengths.
 *
 * @module lib/share/encode
 */

import { usePoemStore } from '../../stores/usePoemStore';
import { useAnalysisStore } from '../../stores/useAnalysisStore';
import { useMelodyStore } from '../../stores/useMelodyStore';
import type {
  ShareData,
  ShareMode,
  ShareOptions,
  ShareEncodeResult,
  PoemOnlyShareData,
  WithAnalysisShareData,
  FullShareData,
} from './types';
import { SHARE_SCHEMA_VERSION } from './types';

// =============================================================================
// Constants
// =============================================================================

/** Maximum recommended URL length (most browsers support ~2000 chars) */
const MAX_URL_LENGTH = 2000;

/** Threshold for applying compression (bytes) */
const COMPRESSION_THRESHOLD = 500;

// Logging helper for debugging
const DEBUG = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[Share/Encode] ${message}`, ...args);
  }
};

// =============================================================================
// Compression Utilities
// =============================================================================

/**
 * Compresses a string using the browser's CompressionStream API.
 * Falls back to uncompressed if API is not available.
 *
 * @param input - String to compress
 * @returns Base64-encoded compressed data
 */
export async function compressString(input: string): Promise<string> {
  // Check if CompressionStream is available
  if (typeof CompressionStream === 'undefined') {
    log('CompressionStream not available, using base64 only');
    return btoa(unescape(encodeURIComponent(input)));
  }

  try {
    // Convert string to Uint8Array
    const encoder = new TextEncoder();
    const inputBytes = encoder.encode(input);

    // Create compression stream
    const stream = new Blob([inputBytes]).stream();
    const compressedStream = stream.pipeThrough(new CompressionStream('deflate'));

    // Read compressed data
    const reader = compressedStream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    // Combine chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const compressed = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      compressed.set(chunk, offset);
      offset += chunk.length;
    }

    // Convert to base64
    const base64 = btoa(String.fromCharCode(...compressed));
    log('Compressed data:', {
      originalSize: inputBytes.length,
      compressedSize: compressed.length,
      ratio: (compressed.length / inputBytes.length * 100).toFixed(1) + '%',
    });

    return base64;
  } catch (error) {
    log('Compression failed, using base64 only:', error);
    return btoa(unescape(encodeURIComponent(input)));
  }
}

/**
 * Encodes a string to URL-safe base64 (without compression).
 *
 * @param input - String to encode
 * @returns URL-safe base64 string
 */
export function encodeToBase64(input: string): string {
  // Use URL-safe base64 encoding
  const base64 = btoa(unescape(encodeURIComponent(input)));
  // Replace non-URL-safe characters
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// =============================================================================
// Share Data Builders
// =============================================================================

/**
 * Builds poem-only share data from the current state.
 */
export function buildPoemOnlyShareData(): PoemOnlyShareData {
  const poemState = usePoemStore.getState();
  return {
    version: SHARE_SCHEMA_VERSION,
    mode: 'poem-only',
    poem: poemState.original,
  };
}

/**
 * Builds share data with analysis from the current state.
 */
export function buildWithAnalysisShareData(): WithAnalysisShareData | null {
  const poemState = usePoemStore.getState();
  const analysisState = useAnalysisStore.getState();

  if (!analysisState.analysis) {
    log('No analysis available for sharing');
    return null;
  }

  return {
    version: SHARE_SCHEMA_VERSION,
    mode: 'with-analysis',
    poem: poemState.original,
    analysis: analysisState.analysis,
  };
}

/**
 * Builds full share data from the current state.
 */
export function buildFullShareData(): FullShareData {
  const poemState = usePoemStore.getState();
  const analysisState = useAnalysisStore.getState();
  const melodyState = useMelodyStore.getState();

  return {
    version: SHARE_SCHEMA_VERSION,
    mode: 'full',
    poem: {
      original: poemState.original,
      versions: poemState.versions,
      currentVersionIndex: poemState.currentVersionIndex,
    },
    analysis: analysisState.analysis,
    melody: melodyState.melody || melodyState.abcNotation
      ? {
          data: melodyState.melody,
          abcNotation: melodyState.abcNotation,
        }
      : null,
  };
}

/**
 * Builds share data based on the specified mode.
 *
 * @param mode - Share mode to use
 * @returns Share data or null if required data is missing
 */
export function buildShareData(mode: ShareMode): ShareData | null {
  switch (mode) {
    case 'poem-only':
      return buildPoemOnlyShareData();
    case 'with-analysis':
      return buildWithAnalysisShareData();
    case 'full':
      return buildFullShareData();
  }
}

// =============================================================================
// Encoding Functions
// =============================================================================

/**
 * Encodes share data to a URL-safe string.
 *
 * @param data - Share data to encode
 * @param compress - Whether to use compression
 * @returns Encoded string (possibly compressed and base64-encoded)
 */
export async function encodeShareData(
  data: ShareData,
  compress: boolean = true
): Promise<{ encoded: string; compressed: boolean; size: number }> {
  const jsonString = JSON.stringify(data);
  const size = new Blob([jsonString]).size;

  log('Encoding share data:', {
    mode: data.mode,
    jsonSize: size,
    shouldCompress: compress && size > COMPRESSION_THRESHOLD,
  });

  // Use compression for larger data
  if (compress && size > COMPRESSION_THRESHOLD) {
    const compressed = await compressString(jsonString);
    // Prefix with 'c:' to indicate compressed data
    return {
      encoded: 'c:' + compressed.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
      compressed: true,
      size,
    };
  }

  // Use simple base64 for smaller data
  const encoded = encodeToBase64(jsonString);
  return {
    encoded,
    compressed: false,
    size,
  };
}

/**
 * Generates a share URL for the current project state.
 *
 * @param options - Share options
 * @returns Share result with URL or error
 */
export async function generateShareUrl(
  options: ShareOptions = {}
): Promise<ShareEncodeResult> {
  const { mode = 'poem-only', compress = true, useFragment = true } = options;

  log('Generating share URL:', { mode, compress, useFragment });

  // Check if there's a poem to share
  const poemState = usePoemStore.getState();
  if (!poemState.original.trim()) {
    return {
      success: false,
      error: 'No poem to share',
      mode,
      dataSize: 0,
      compressed: false,
    };
  }

  // Build share data
  const shareData = buildShareData(mode);
  if (!shareData) {
    return {
      success: false,
      error: mode === 'with-analysis'
        ? 'Analysis is required for this share mode. Please analyze the poem first.'
        : 'Failed to build share data',
      mode,
      dataSize: 0,
      compressed: false,
    };
  }

  try {
    // Encode the data
    const { encoded, compressed, size } = await encodeShareData(shareData, compress);

    // Build the URL
    const baseUrl = window.location.origin + window.location.pathname;
    const url = useFragment
      ? `${baseUrl}#share=${encoded}`
      : `${baseUrl}?share=${encoded}`;

    log('Generated share URL:', {
      urlLength: url.length,
      dataSize: size,
      compressed,
    });

    // Warn if URL is too long
    if (url.length > MAX_URL_LENGTH) {
      log('Warning: URL exceeds recommended length');
      return {
        success: true,
        url,
        mode,
        dataSize: size,
        compressed,
        error: `URL length (${url.length} chars) exceeds recommended limit (${MAX_URL_LENGTH}). Consider using a shorter share mode.`,
      };
    }

    return {
      success: true,
      url,
      mode,
      dataSize: size,
      compressed,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown encoding error';
    log('Error generating share URL:', error);
    return {
      success: false,
      error: message,
      mode,
      dataSize: 0,
      compressed: false,
    };
  }
}

/**
 * Copies the share URL to the clipboard.
 *
 * @param url - URL to copy
 * @returns Whether copying was successful
 */
export async function copyShareUrlToClipboard(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    log('Copied share URL to clipboard');
    return true;
  } catch (error) {
    log('Failed to copy to clipboard:', error);

    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      log('Fallback clipboard copy:', success ? 'success' : 'failed');
      return success;
    } catch (fallbackError) {
      log('Fallback clipboard copy failed:', fallbackError);
      return false;
    }
  }
}
