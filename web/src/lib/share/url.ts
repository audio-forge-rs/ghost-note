/**
 * Ghost Note - URL Parsing
 *
 * Functions for parsing share data from URLs.
 *
 * @module lib/share/url
 */

import type { ShareDecodeResult } from './types';
import { decodeShareData, decodeAndImportShareData, type ImportShareOptions } from './decode';

// Logging helper for debugging
const DEBUG = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[Share/URL] ${message}`, ...args);
  }
};

// =============================================================================
// URL Parameter Names
// =============================================================================

/** URL parameter/fragment name for share data */
export const SHARE_PARAM_NAME = 'share';

// =============================================================================
// URL Parsing Functions
// =============================================================================

/**
 * Extracts share data from the current URL.
 *
 * Checks both hash fragment (#share=...) and query parameters (?share=...).
 * Fragment is checked first as it's the preferred method.
 *
 * @returns Encoded share data string or null if not found
 */
export function extractShareDataFromUrl(): string | null {
  log('Extracting share data from URL:', window.location.href);

  // Check hash fragment first (preferred method)
  if (window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const shareData = hashParams.get(SHARE_PARAM_NAME);
    if (shareData) {
      log('Found share data in hash fragment');
      return shareData;
    }
  }

  // Check query parameters
  const queryParams = new URLSearchParams(window.location.search);
  const shareData = queryParams.get(SHARE_PARAM_NAME);
  if (shareData) {
    log('Found share data in query parameters');
    return shareData;
  }

  log('No share data found in URL');
  return null;
}

/**
 * Checks if the current URL contains share data.
 *
 * @returns Whether share data is present
 */
export function hasShareDataInUrl(): boolean {
  return extractShareDataFromUrl() !== null;
}

/**
 * Clears share data from the URL without triggering a page reload.
 * Preserves other parameters if present.
 */
export function clearShareDataFromUrl(): void {
  log('Clearing share data from URL');

  const url = new URL(window.location.href);

  // Clear from hash
  if (url.hash) {
    const hashParams = new URLSearchParams(url.hash.slice(1));
    if (hashParams.has(SHARE_PARAM_NAME)) {
      hashParams.delete(SHARE_PARAM_NAME);
      const newHash = hashParams.toString();
      url.hash = newHash ? `#${newHash}` : '';
    }
  }

  // Clear from query params
  if (url.searchParams.has(SHARE_PARAM_NAME)) {
    url.searchParams.delete(SHARE_PARAM_NAME);
  }

  // Update URL without reload
  const newUrl = url.toString();
  if (newUrl !== window.location.href) {
    window.history.replaceState({}, '', newUrl);
    log('URL updated:', newUrl);
  }
}

/**
 * Parses and decodes share data from the current URL.
 *
 * @returns Decode result or null if no share data in URL
 */
export async function parseShareDataFromUrl(): Promise<ShareDecodeResult | null> {
  const encoded = extractShareDataFromUrl();

  if (!encoded) {
    return null;
  }

  return decodeShareData(encoded);
}

/**
 * Parses share data from URL and imports it into the application state.
 *
 * @param options - Import options
 * @returns Result of the parse and import operation, or null if no share data
 */
export async function parseAndImportShareDataFromUrl(
  options: ImportShareOptions = {}
): Promise<(ShareDecodeResult & { imported: boolean }) | null> {
  const encoded = extractShareDataFromUrl();

  if (!encoded) {
    log('No share data in URL to import');
    return null;
  }

  log('Importing share data from URL...');
  const result = await decodeAndImportShareData(encoded, options);

  // Clear the share data from URL after successful import
  if (result.imported) {
    clearShareDataFromUrl();
  }

  return result;
}

/**
 * Result of checking for share data in URL.
 */
export interface ShareUrlCheckResult {
  /** Whether share data is present in the URL */
  hasShareData: boolean;
  /** The encoded share data (if present) */
  encodedData: string | null;
  /** Where the share data was found */
  source: 'hash' | 'query' | null;
}

/**
 * Checks the current URL for share data and returns details.
 *
 * @returns Share URL check result
 */
export function checkShareUrl(): ShareUrlCheckResult {
  // Check hash fragment first
  if (window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const shareData = hashParams.get(SHARE_PARAM_NAME);
    if (shareData) {
      return {
        hasShareData: true,
        encodedData: shareData,
        source: 'hash',
      };
    }
  }

  // Check query parameters
  const queryParams = new URLSearchParams(window.location.search);
  const shareData = queryParams.get(SHARE_PARAM_NAME);
  if (shareData) {
    return {
      hasShareData: true,
      encodedData: shareData,
      source: 'query',
    };
  }

  return {
    hasShareData: false,
    encodedData: null,
    source: null,
  };
}
