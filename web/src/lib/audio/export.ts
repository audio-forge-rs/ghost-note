/**
 * Audio Export Module
 *
 * Provides utilities for exporting, converting, and downloading audio.
 * Supports WebM (native), WAV (conversion), and audio track combining.
 *
 * @module lib/audio/export
 */

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[AudioExport] ${message}`, ...args);
  }
};

// =============================================================================
// Types
// =============================================================================

/**
 * Supported export formats
 */
export type ExportFormat = 'webm' | 'wav';

/**
 * Export quality options for WAV conversion
 */
export interface ExportQuality {
  /** Sample rate in Hz (default: 44100) */
  sampleRate?: number;
  /** Number of channels (1 = mono, 2 = stereo, default: 2) */
  channels?: number;
  /** Bits per sample (8, 16, 24, 32, default: 16) */
  bitDepth?: 8 | 16 | 24 | 32;
}

/**
 * Options for audio export
 */
export interface ExportOptions {
  /** Export format */
  format?: ExportFormat;
  /** Quality settings for WAV */
  quality?: ExportQuality;
  /** Custom filename (without extension) */
  filename?: string;
}

/**
 * Options for combining audio tracks
 */
export interface CombineOptions {
  /** Volume of the recording track (0-1, default: 1) */
  recordingVolume?: number;
  /** Volume of the melody track (0-1, default: 0.5) */
  melodyVolume?: number;
  /** Output format */
  format?: ExportFormat;
  /** Quality settings */
  quality?: ExportQuality;
}

/**
 * Result of an export operation
 */
export interface ExportResult {
  /** The exported audio blob */
  blob: Blob;
  /** The filename with extension */
  filename: string;
  /** The MIME type */
  mimeType: string;
  /** File size in bytes */
  size: number;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_SAMPLE_RATE = 44100;
const DEFAULT_CHANNELS = 2;
const DEFAULT_BIT_DEPTH = 16;

const MIME_TYPES: Record<ExportFormat, string> = {
  webm: 'audio/webm',
  wav: 'audio/wav',
};

const FILE_EXTENSIONS: Record<ExportFormat, string> = {
  webm: '.webm',
  wav: '.wav',
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check if WAV conversion is supported in the current browser
 */
export function isWavConversionSupported(): boolean {
  const supported =
    typeof window !== 'undefined' &&
    typeof AudioContext !== 'undefined' &&
    typeof OfflineAudioContext !== 'undefined';

  log('WAV conversion support check:', supported);
  return supported;
}

/**
 * Get supported export formats
 */
export function getSupportedFormats(): ExportFormat[] {
  const formats: ExportFormat[] = ['webm']; // WebM is always available

  if (isWavConversionSupported()) {
    formats.push('wav');
  }

  log('Supported export formats:', formats);
  return formats;
}

/**
 * Sanitize a filename for safe download
 */
export function sanitizeFilename(filename: string): string {
  // Remove or replace characters that are problematic in filenames
  return filename
    .replace(/[<>:"/\\|?*]/g, '') // Remove Windows-forbidden characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .trim()
    .slice(0, 200); // Limit length
}

/**
 * Generate a filename for export
 */
export function generateFilename(
  poemTitle: string | undefined,
  format: ExportFormat,
  takeNumber?: number
): string {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const title = poemTitle ? sanitizeFilename(poemTitle) : 'recording';
  const take = takeNumber ? `-take-${takeNumber}` : '';

  return `${title}${take}-${timestamp}${FILE_EXTENSIONS[format]}`;
}

// =============================================================================
// Core Export Functions
// =============================================================================

/**
 * Download an audio blob as a file
 *
 * @param blob - The audio blob to download
 * @param filename - The filename for the download
 *
 * @example
 * ```typescript
 * downloadAudio(audioBlob, 'my-song.webm');
 * ```
 */
export function downloadAudio(blob: Blob, filename: string): void {
  log('Downloading audio:', filename, 'size:', blob.size);

  // Create a temporary URL for the blob
  const url = URL.createObjectURL(blob);

  try {
    // Create a link element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Append to body (required for Firefox)
    document.body.appendChild(link);

    // Trigger download
    link.click();

    // Clean up
    document.body.removeChild(link);

    log('Download initiated successfully');
  } finally {
    // Always revoke the URL to free memory
    // Use setTimeout to ensure the download has started
    setTimeout(() => {
      URL.revokeObjectURL(url);
      log('Revoked download URL');
    }, 1000);
  }
}

/**
 * Fetch a blob from a URL (blob URL or data URL)
 */
export async function fetchBlobFromUrl(url: string): Promise<Blob> {
  log('Fetching blob from URL:', url.slice(0, 50) + '...');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch blob: ${response.statusText}`);
  }

  const blob = await response.blob();
  log('Fetched blob:', blob.size, 'bytes, type:', blob.type);

  return blob;
}

/**
 * Convert an audio blob to WAV format
 *
 * This uses the Web Audio API to decode the audio and re-encode it as WAV.
 *
 * @param blob - The source audio blob (WebM, OGG, etc.)
 * @param quality - Quality settings for the output
 * @returns A Promise resolving to a WAV blob
 *
 * @example
 * ```typescript
 * const wavBlob = await convertToWav(webmBlob);
 * downloadAudio(wavBlob, 'recording.wav');
 * ```
 */
export async function convertToWav(
  blob: Blob,
  quality: ExportQuality = {}
): Promise<Blob> {
  const {
    sampleRate = DEFAULT_SAMPLE_RATE,
    channels = DEFAULT_CHANNELS,
    bitDepth = DEFAULT_BIT_DEPTH,
  } = quality;

  log('Converting to WAV:', {
    inputSize: blob.size,
    inputType: blob.type,
    sampleRate,
    channels,
    bitDepth,
  });

  if (!isWavConversionSupported()) {
    throw new Error('WAV conversion is not supported in this browser');
  }

  // Get the array buffer from the blob
  const arrayBuffer = await blob.arrayBuffer();

  // Create an audio context for decoding
  const audioContext = new AudioContext({ sampleRate });

  try {
    // Decode the audio data
    log('Decoding audio data...');
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    log('Decoded audio:', {
      duration: audioBuffer.duration,
      numberOfChannels: audioBuffer.numberOfChannels,
      sampleRate: audioBuffer.sampleRate,
      length: audioBuffer.length,
    });

    // Create an offline context for rendering
    const offlineContext = new OfflineAudioContext(
      channels,
      Math.ceil(audioBuffer.duration * sampleRate),
      sampleRate
    );

    // Create a buffer source
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start(0);

    // Render the audio
    log('Rendering audio...');
    const renderedBuffer = await offlineContext.startRendering();

    // Encode as WAV
    log('Encoding as WAV...');
    const wavBlob = encodeWav(renderedBuffer, bitDepth);

    log('WAV conversion complete:', wavBlob.size, 'bytes');
    return wavBlob;
  } finally {
    // Clean up the audio context
    await audioContext.close();
  }
}

/**
 * Encode an AudioBuffer as a WAV file
 */
function encodeWav(audioBuffer: AudioBuffer, bitDepth: number = 16): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  // Interleave the channel data
  const channelData: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channelData.push(audioBuffer.getChannelData(i));
  }

  const length = channelData[0].length;
  const dataLength = length * blockAlign;

  // Create the WAV file buffer
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // Write RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');

  // Write fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // Write data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write audio samples
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
      writeSample(view, offset, sample, bitDepth);
      offset += bytesPerSample;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Write a string to a DataView
 */
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Write a sample to a DataView based on bit depth
 */
function writeSample(
  view: DataView,
  offset: number,
  sample: number,
  bitDepth: number
): void {
  switch (bitDepth) {
    case 8:
      // 8-bit is unsigned
      view.setUint8(offset, Math.round((sample + 1) * 127.5));
      break;
    case 16:
      view.setInt16(offset, Math.round(sample * 32767), true);
      break;
    case 24: {
      // 24-bit requires manual byte writing
      const val24 = Math.round(sample * 8388607);
      view.setUint8(offset, val24 & 0xff);
      view.setUint8(offset + 1, (val24 >> 8) & 0xff);
      view.setUint8(offset + 2, (val24 >> 16) & 0xff);
      break;
    }
    case 32:
      view.setInt32(offset, Math.round(sample * 2147483647), true);
      break;
  }
}

/**
 * Combine a recording audio track with a melody audio track
 *
 * This mixes both tracks together into a single audio file.
 *
 * @param recordingBlob - The vocal recording blob
 * @param melodyBlob - The melody/accompaniment blob
 * @param options - Combine options (volumes, format, quality)
 * @returns A Promise resolving to the combined audio blob
 *
 * @example
 * ```typescript
 * const combined = await combineAudioTracks(vocalBlob, melodyBlob, {
 *   recordingVolume: 1.0,
 *   melodyVolume: 0.5,
 * });
 * ```
 */
export async function combineAudioTracks(
  recordingBlob: Blob,
  melodyBlob: Blob,
  options: CombineOptions = {}
): Promise<Blob> {
  const {
    recordingVolume = 1.0,
    melodyVolume = 0.5,
    format = 'wav',
    quality = {},
  } = options;

  const { sampleRate = DEFAULT_SAMPLE_RATE, channels = DEFAULT_CHANNELS } =
    quality;

  log('Combining audio tracks:', {
    recordingSize: recordingBlob.size,
    melodySize: melodyBlob.size,
    recordingVolume,
    melodyVolume,
  });

  if (!isWavConversionSupported()) {
    throw new Error('Audio combining is not supported in this browser');
  }

  // Get array buffers from both blobs
  const [recordingBuffer, melodyBuffer] = await Promise.all([
    recordingBlob.arrayBuffer(),
    melodyBlob.arrayBuffer(),
  ]);

  // Create an audio context for decoding
  const audioContext = new AudioContext({ sampleRate });

  try {
    // Decode both audio files
    log('Decoding audio files...');
    const [recordingAudio, melodyAudio] = await Promise.all([
      audioContext.decodeAudioData(recordingBuffer),
      audioContext.decodeAudioData(melodyBuffer),
    ]);

    log('Decoded:', {
      recording: {
        duration: recordingAudio.duration,
        channels: recordingAudio.numberOfChannels,
      },
      melody: {
        duration: melodyAudio.duration,
        channels: melodyAudio.numberOfChannels,
      },
    });

    // Determine output duration (use the longer of the two)
    const duration = Math.max(recordingAudio.duration, melodyAudio.duration);
    const length = Math.ceil(duration * sampleRate);

    // Create an offline context for rendering
    const offlineContext = new OfflineAudioContext(channels, length, sampleRate);

    // Create gain nodes for volume control
    const recordingGain = offlineContext.createGain();
    recordingGain.gain.value = recordingVolume;

    const melodyGain = offlineContext.createGain();
    melodyGain.gain.value = melodyVolume;

    // Create buffer sources
    const recordingSource = offlineContext.createBufferSource();
    recordingSource.buffer = recordingAudio;
    recordingSource.connect(recordingGain);
    recordingGain.connect(offlineContext.destination);

    const melodySource = offlineContext.createBufferSource();
    melodySource.buffer = melodyAudio;
    melodySource.connect(melodyGain);
    melodyGain.connect(offlineContext.destination);

    // Start both sources
    recordingSource.start(0);
    melodySource.start(0);

    // Render the combined audio
    log('Rendering combined audio...');
    const renderedBuffer = await offlineContext.startRendering();

    // Encode to the requested format
    let outputBlob: Blob;
    if (format === 'wav') {
      outputBlob = encodeWav(renderedBuffer, quality.bitDepth ?? DEFAULT_BIT_DEPTH);
    } else {
      // For WebM, we need to use MediaRecorder (more complex)
      // For now, return WAV and let the caller handle format conversion if needed
      log('WebM output requested but not directly supported for combined audio, outputting WAV');
      outputBlob = encodeWav(renderedBuffer, quality.bitDepth ?? DEFAULT_BIT_DEPTH);
    }

    log('Audio combining complete:', outputBlob.size, 'bytes');
    return outputBlob;
  } finally {
    // Clean up the audio context
    await audioContext.close();
  }
}

// =============================================================================
// High-Level Export Functions
// =============================================================================

/**
 * Export a recording take with the specified options
 *
 * @param blobUrl - The blob URL of the recording
 * @param options - Export options
 * @returns The export result
 *
 * @example
 * ```typescript
 * const result = await exportRecording(take.blobUrl, {
 *   format: 'wav',
 *   filename: 'my-recording',
 * });
 * downloadAudio(result.blob, result.filename);
 * ```
 */
export async function exportRecording(
  blobUrl: string,
  options: ExportOptions = {}
): Promise<ExportResult> {
  const { format = 'webm', quality = {}, filename } = options;

  log('Exporting recording:', { blobUrl: blobUrl.slice(0, 50), format });

  // Fetch the blob from the URL
  const sourceBlob = await fetchBlobFromUrl(blobUrl);

  let outputBlob: Blob;

  if (format === 'wav') {
    outputBlob = await convertToWav(sourceBlob, quality);
  } else {
    // WebM - use as-is
    outputBlob = sourceBlob;
  }

  const outputFilename = filename
    ? `${sanitizeFilename(filename)}${FILE_EXTENSIONS[format]}`
    : `recording-${Date.now()}${FILE_EXTENSIONS[format]}`;

  return {
    blob: outputBlob,
    filename: outputFilename,
    mimeType: MIME_TYPES[format],
    size: outputBlob.size,
  };
}

/**
 * Export and download a recording in one step
 *
 * @param blobUrl - The blob URL of the recording
 * @param poemTitle - Optional poem title for the filename
 * @param options - Export options
 *
 * @example
 * ```typescript
 * await exportAndDownload(take.blobUrl, 'My Poem', { format: 'wav' });
 * ```
 */
export async function exportAndDownload(
  blobUrl: string,
  poemTitle?: string,
  options: ExportOptions = {}
): Promise<ExportResult> {
  const format = options.format ?? 'webm';
  const filename =
    options.filename ?? generateFilename(poemTitle, format, undefined);

  log('Export and download:', { poemTitle, format, filename });

  const result = await exportRecording(blobUrl, {
    ...options,
    format,
    filename: filename.replace(/\.[^.]+$/, ''), // Remove extension since exportRecording adds it
  });

  downloadAudio(result.blob, result.filename);

  return result;
}

/**
 * Export a combined recording (vocals + melody)
 *
 * @param recordingBlobUrl - The blob URL of the vocal recording
 * @param melodyBlobUrl - The blob URL of the melody
 * @param poemTitle - Optional poem title for the filename
 * @param options - Combine and export options
 *
 * @example
 * ```typescript
 * const result = await exportCombined(
 *   take.blobUrl,
 *   melodyBlobUrl,
 *   'My Poem',
 *   { recordingVolume: 1.0, melodyVolume: 0.5 }
 * );
 * ```
 */
export async function exportCombined(
  recordingBlobUrl: string,
  melodyBlobUrl: string,
  poemTitle?: string,
  options: CombineOptions = {}
): Promise<ExportResult> {
  const format = options.format ?? 'wav';

  log('Exporting combined audio:', { poemTitle, format });

  // Fetch both blobs
  const [recordingBlob, melodyBlob] = await Promise.all([
    fetchBlobFromUrl(recordingBlobUrl),
    fetchBlobFromUrl(melodyBlobUrl),
  ]);

  // Combine the tracks
  const combinedBlob = await combineAudioTracks(recordingBlob, melodyBlob, options);

  const filename = generateFilename(poemTitle, format, undefined).replace(
    /(\.[^.]+)$/,
    '-combined$1'
  );

  return {
    blob: combinedBlob,
    filename,
    mimeType: MIME_TYPES[format],
    size: combinedBlob.size,
  };
}

/**
 * Export and download combined audio in one step
 */
export async function exportCombinedAndDownload(
  recordingBlobUrl: string,
  melodyBlobUrl: string,
  poemTitle?: string,
  options: CombineOptions = {}
): Promise<ExportResult> {
  const result = await exportCombined(
    recordingBlobUrl,
    melodyBlobUrl,
    poemTitle,
    options
  );

  downloadAudio(result.blob, result.filename);

  return result;
}

// =============================================================================
// Format Information
// =============================================================================

/**
 * Get information about an export format
 */
export function getFormatInfo(format: ExportFormat): {
  name: string;
  mimeType: string;
  extension: string;
  description: string;
  isSupported: boolean;
} {
  const formatInfo = {
    webm: {
      name: 'WebM',
      mimeType: MIME_TYPES.webm,
      extension: FILE_EXTENSIONS.webm,
      description: 'Web-optimized audio format, widely supported in browsers',
      isSupported: true,
    },
    wav: {
      name: 'WAV',
      mimeType: MIME_TYPES.wav,
      extension: FILE_EXTENSIONS.wav,
      description: 'Uncompressed audio format, high quality',
      isSupported: isWavConversionSupported(),
    },
  };

  return formatInfo[format];
}

/**
 * Get all format info
 */
export function getAllFormatsInfo(): ReturnType<typeof getFormatInfo>[] {
  return (['webm', 'wav'] as ExportFormat[]).map(getFormatInfo);
}

// =============================================================================
// Default Export
// =============================================================================

export default {
  downloadAudio,
  convertToWav,
  combineAudioTracks,
  exportRecording,
  exportAndDownload,
  exportCombined,
  exportCombinedAndDownload,
  fetchBlobFromUrl,
  generateFilename,
  sanitizeFilename,
  getSupportedFormats,
  isWavConversionSupported,
  getFormatInfo,
  getAllFormatsInfo,
};
