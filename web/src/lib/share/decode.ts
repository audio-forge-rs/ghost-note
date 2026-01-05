/**
 * Ghost Note - Share Decoding
 *
 * Functions for decoding shared project data from URLs.
 * Handles both compressed and uncompressed formats.
 *
 * @module lib/share/decode
 */

import { usePoemStore } from '../../stores/usePoemStore';
import { useAnalysisStore } from '../../stores/useAnalysisStore';
import { useMelodyStore } from '../../stores/useMelodyStore';
import type {
  ShareData,
  ShareDecodeResult,
  PoemOnlyShareData,
  WithAnalysisShareData,
  FullShareData,
} from './types';
import {
  isPoemOnlyShareData,
  isWithAnalysisShareData,
  isFullShareData,
} from './types';

// Logging helper for debugging
const DEBUG = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[Share/Decode] ${message}`, ...args);
  }
};

// =============================================================================
// Decompression Utilities
// =============================================================================

/**
 * Decompresses a base64-encoded compressed string.
 *
 * @param input - Base64-encoded compressed data
 * @returns Decompressed string
 */
export async function decompressString(input: string): Promise<string> {
  // Check if DecompressionStream is available
  if (typeof DecompressionStream === 'undefined') {
    log('DecompressionStream not available');
    throw new Error('Decompression not supported in this browser');
  }

  try {
    // Restore base64 padding and URL-safe characters
    let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }

    // Decode base64 to bytes
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Decompress
    const stream = new Blob([bytes]).stream();
    const decompressedStream = stream.pipeThrough(new DecompressionStream('deflate'));

    // Read decompressed data
    const reader = decompressedStream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    // Combine chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const decompressed = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      decompressed.set(chunk, offset);
      offset += chunk.length;
    }

    // Decode to string
    const decoder = new TextDecoder();
    const result = decoder.decode(decompressed);

    log('Decompressed data:', {
      compressedSize: bytes.length,
      decompressedSize: decompressed.length,
    });

    return result;
  } catch (error) {
    log('Decompression failed:', error);
    throw new Error('Failed to decompress share data');
  }
}

/**
 * Decodes a URL-safe base64 string (without compression).
 *
 * @param input - URL-safe base64 string
 * @returns Decoded string
 */
export function decodeFromBase64(input: string): string {
  // Restore URL-safe characters and padding
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }

  // Decode
  return decodeURIComponent(escape(atob(base64)));
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validates poem-only share data.
 */
function validatePoemOnlyData(data: unknown): data is PoemOnlyShareData {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    d.mode === 'poem-only' &&
    typeof d.poem === 'string' &&
    d.poem.length > 0
  );
}

/**
 * Validates with-analysis share data.
 */
function validateWithAnalysisData(data: unknown): data is WithAnalysisShareData {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    d.mode === 'with-analysis' &&
    typeof d.poem === 'string' &&
    d.poem.length > 0 &&
    typeof d.analysis === 'object' &&
    d.analysis !== null
  );
}

/**
 * Validates full share data.
 */
function validateFullData(data: unknown): data is FullShareData {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;

  if (d.mode !== 'full') return false;

  // Validate poem structure
  if (typeof d.poem !== 'object' || d.poem === null) return false;
  const poem = d.poem as Record<string, unknown>;
  if (
    typeof poem.original !== 'string' ||
    !Array.isArray(poem.versions) ||
    typeof poem.currentVersionIndex !== 'number'
  ) {
    return false;
  }

  return true;
}

/**
 * Validates share data structure.
 *
 * @param data - Parsed JSON data
 * @returns Validation result
 */
export function validateShareData(data: unknown): { valid: boolean; error?: string } {
  if (typeof data !== 'object' || data === null) {
    return { valid: false, error: 'Invalid share data format' };
  }

  const d = data as Record<string, unknown>;

  // Check version
  if (typeof d.version !== 'string') {
    return { valid: false, error: 'Missing or invalid version' };
  }

  // Check mode
  if (!['poem-only', 'with-analysis', 'full'].includes(d.mode as string)) {
    return { valid: false, error: 'Invalid share mode' };
  }

  // Validate based on mode
  switch (d.mode) {
    case 'poem-only':
      if (!validatePoemOnlyData(data)) {
        return { valid: false, error: 'Invalid poem-only share data' };
      }
      break;
    case 'with-analysis':
      if (!validateWithAnalysisData(data)) {
        return { valid: false, error: 'Invalid with-analysis share data' };
      }
      break;
    case 'full':
      if (!validateFullData(data)) {
        return { valid: false, error: 'Invalid full share data' };
      }
      break;
  }

  return { valid: true };
}

// =============================================================================
// Decoding Functions
// =============================================================================

/**
 * Decodes share data from an encoded string.
 *
 * @param encoded - Encoded share data string
 * @returns Decoded share data or error
 */
export async function decodeShareData(encoded: string): Promise<ShareDecodeResult> {
  log('Decoding share data:', { length: encoded.length });

  try {
    let jsonString: string;

    // Check if data is compressed (prefixed with 'c:')
    if (encoded.startsWith('c:')) {
      log('Detected compressed data');
      const compressedData = encoded.slice(2);
      jsonString = await decompressString(compressedData);
    } else {
      log('Detected uncompressed data');
      jsonString = decodeFromBase64(encoded);
    }

    // Parse JSON
    let data: unknown;
    try {
      data = JSON.parse(jsonString);
    } catch (parseError) {
      log('JSON parse error:', parseError);
      return {
        success: false,
        error: 'Invalid share data: could not parse JSON',
      };
    }

    // Validate structure
    const validation = validateShareData(data);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'Invalid share data structure',
      };
    }

    const shareData = data as ShareData;

    log('Successfully decoded share data:', {
      mode: shareData.mode,
      version: shareData.version,
    });

    return {
      success: true,
      data: shareData,
      mode: shareData.mode,
      version: shareData.version,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown decoding error';
    log('Error decoding share data:', error);
    return {
      success: false,
      error: message,
    };
  }
}

// =============================================================================
// Import Functions
// =============================================================================

/**
 * Options for importing share data into the application state.
 */
export interface ImportShareOptions {
  /** Whether to clear existing data before importing (default: true) */
  clearExisting?: boolean;
  /** Whether to trigger analysis for poem-only imports (default: false) */
  autoAnalyze?: boolean;
}

/**
 * Imports decoded share data into the application state.
 *
 * @param data - Decoded share data
 * @param options - Import options
 * @returns Whether import was successful
 */
export function importShareData(
  data: ShareData,
  options: ImportShareOptions = {}
): boolean {
  const { clearExisting = true } = options;

  log('Importing share data:', {
    mode: data.mode,
    version: data.version,
    clearExisting,
  });

  try {
    // Clear existing data if requested
    if (clearExisting) {
      log('Clearing existing data...');
      usePoemStore.getState().reset();
      useAnalysisStore.getState().reset();
      useMelodyStore.getState().reset();
    }

    // Import based on mode
    if (isPoemOnlyShareData(data)) {
      log('Importing poem-only data');
      usePoemStore.getState().setPoem(data.poem);
    } else if (isWithAnalysisShareData(data)) {
      log('Importing with-analysis data');
      usePoemStore.getState().setPoem(data.poem);
      useAnalysisStore.getState().setAnalysis(data.analysis);
    } else if (isFullShareData(data)) {
      log('Importing full data');

      // Import poem data
      usePoemStore.getState().setPoem(data.poem.original);
      usePoemStore.setState({
        versions: data.poem.versions,
        currentVersionIndex: data.poem.currentVersionIndex,
      });

      // Import analysis if present
      if (data.analysis) {
        useAnalysisStore.getState().setAnalysis(data.analysis);
      }

      // Import melody if present
      if (data.melody && data.melody.data && data.melody.abcNotation) {
        useMelodyStore.getState().setMelody(data.melody.data, data.melody.abcNotation);
      } else if (data.melody?.abcNotation) {
        useMelodyStore.getState().setAbcNotation(data.melody.abcNotation);
      }
    }

    log('Share data imported successfully');
    return true;
  } catch (error) {
    log('Error importing share data:', error);
    return false;
  }
}

/**
 * Decodes and imports share data from an encoded string.
 *
 * @param encoded - Encoded share data string
 * @param options - Import options
 * @returns Result of the decode and import operation
 */
export async function decodeAndImportShareData(
  encoded: string,
  options: ImportShareOptions = {}
): Promise<ShareDecodeResult & { imported: boolean }> {
  const decodeResult = await decodeShareData(encoded);

  if (!decodeResult.success || !decodeResult.data) {
    return {
      ...decodeResult,
      imported: false,
    };
  }

  const imported = importShareData(decodeResult.data, options);

  return {
    ...decodeResult,
    imported,
  };
}
