/**
 * MIDI Export Module
 *
 * Generates downloadable MIDI files from ABC notation melodies.
 * Uses abcjs MIDI generation capability for Standard MIDI File (SMF) output.
 *
 * @module midiExport
 */

import abcjs from 'abcjs';
import type { TuneObject } from 'abcjs';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[midiExport] ${message}`, ...args);
  }
};

// =============================================================================
// Types
// =============================================================================

/**
 * General MIDI instrument numbers (0-127)
 * See: https://www.midi.org/specifications-old/item/gm-level-1-sound-set
 */
export type MidiInstrument =
  | 0   // Acoustic Grand Piano
  | 1   // Bright Acoustic Piano
  | 4   // Electric Piano 1
  | 5   // Electric Piano 2
  | 24  // Acoustic Guitar (nylon)
  | 25  // Acoustic Guitar (steel)
  | 40  // Violin
  | 41  // Viola
  | 42  // Cello
  | 56  // Trumpet
  | 57  // Trombone
  | 65  // Alto Sax
  | 68  // Oboe
  | 71  // Clarinet
  | 73  // Flute
  | 74  // Recorder
  | number; // Allow any valid MIDI instrument (0-127)

/**
 * Standard MIDI instrument presets with friendly names
 */
export const MIDI_INSTRUMENTS = {
  piano: 0,
  brightPiano: 1,
  electricPiano: 4,
  acousticGuitar: 24,
  steelGuitar: 25,
  violin: 40,
  viola: 41,
  cello: 42,
  trumpet: 56,
  trombone: 57,
  altoSax: 65,
  oboe: 68,
  clarinet: 71,
  flute: 73,
  recorder: 74,
} as const;

/**
 * Instrument name type for presets
 */
export type InstrumentName = keyof typeof MIDI_INSTRUMENTS;

/**
 * Options for MIDI export
 */
export interface MidiExportOptions {
  /**
   * Tempo in beats per minute. If not specified, uses tempo from ABC notation.
   * Range: 20-300 BPM
   */
  tempo?: number;

  /**
   * MIDI instrument to use (0-127 or preset name)
   * Default: piano (0)
   */
  instrument?: MidiInstrument | InstrumentName;

  /**
   * Whether to include a click track (metronome) on channel 10
   * Default: false
   */
  includeClickTrack?: boolean;

  /**
   * Custom filename for download (without .mid extension)
   * Default: derived from ABC title or 'melody'
   */
  filename?: string;

  /**
   * Whether to disable chord symbols from generating sound
   * Default: true (for clean single-track output)
   */
  chordsOff?: boolean;

  /**
   * Volume level for the melody (0-127)
   * Default: 100
   */
  volume?: number;
}

/**
 * Result of MIDI export operation
 */
export interface MidiExportResult {
  /** The MIDI file as a Blob */
  blob: Blob;
  /** The filename with .mid extension */
  filename: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /** Duration in seconds (if available) */
  duration?: number;
}

/**
 * Options passed to abcjs getMidiFile
 */
interface AbcjsMidiOptions {
  midiOutputType: 'binary' | 'encoded' | 'link';
  bpm?: number;
  chordsOff?: boolean;
  program?: number;
  drumOn?: boolean;
  drumIntro?: number;
  drumBars?: number;
  channel?: number;
  pan?: number[];
  generateInline?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const MIN_TEMPO = 20;
const MAX_TEMPO = 300;
const DEFAULT_INSTRUMENT = 0; // Piano
const MIDI_MIME_TYPE = 'audio/midi';

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Resolves instrument to MIDI program number
 */
export function resolveInstrument(instrument: MidiInstrument | InstrumentName | undefined): number {
  if (instrument === undefined) {
    return DEFAULT_INSTRUMENT;
  }

  if (typeof instrument === 'string') {
    const programNumber = MIDI_INSTRUMENTS[instrument];
    if (programNumber === undefined) {
      log(`Unknown instrument name: ${instrument}, using piano`);
      return DEFAULT_INSTRUMENT;
    }
    return programNumber;
  }

  // Validate MIDI range
  if (instrument < 0 || instrument > 127) {
    log(`Invalid MIDI program number: ${instrument}, using piano`);
    return DEFAULT_INSTRUMENT;
  }

  return instrument;
}

/**
 * Validates and clamps tempo to valid range
 */
export function validateTempo(tempo: number | undefined): number | undefined {
  if (tempo === undefined) {
    return undefined;
  }

  if (tempo < MIN_TEMPO) {
    log(`Tempo ${tempo} below minimum, clamping to ${MIN_TEMPO}`);
    return MIN_TEMPO;
  }

  if (tempo > MAX_TEMPO) {
    log(`Tempo ${tempo} above maximum, clamping to ${MAX_TEMPO}`);
    return MAX_TEMPO;
  }

  return Math.round(tempo);
}

/**
 * Extracts title from ABC notation string
 */
export function extractTitleFromAbc(abc: string): string | undefined {
  const titleMatch = abc.match(/^T:\s*(.+)$/m);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim();
  }
  return undefined;
}

/**
 * Sanitizes a filename for safe download
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '') // Remove Windows-forbidden characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .trim()
    .slice(0, 100); // Limit length
}

/**
 * Generates a filename for MIDI export
 */
export function generateMidiFilename(abc: string, customFilename?: string): string {
  if (customFilename) {
    const sanitized = sanitizeFilename(customFilename);
    return sanitized.endsWith('.mid') ? sanitized : `${sanitized}.mid`;
  }

  const title = extractTitleFromAbc(abc);
  if (title) {
    return `${sanitizeFilename(title)}.mid`;
  }

  return `melody-${Date.now()}.mid`;
}

// =============================================================================
// Core Export Functions
// =============================================================================

/**
 * Generate a MIDI file from ABC notation
 *
 * Uses abcjs MIDI generation to create a Standard MIDI File (SMF).
 *
 * @param abc - ABC notation string
 * @param options - Export options (tempo, instrument, etc.)
 * @returns Promise resolving to MidiExportResult
 *
 * @example
 * ```typescript
 * const abc = `X:1\nT:My Melody\nM:4/4\nL:1/8\nQ:1/4=120\nK:C\nCDEF GABc|`;
 *
 * const result = await generateMidiFile(abc, {
 *   tempo: 140,
 *   instrument: 'flute',
 * });
 *
 * downloadMidi(result.blob, result.filename);
 * ```
 */
export async function generateMidiFile(
  abc: string,
  options: MidiExportOptions = {}
): Promise<MidiExportResult> {
  log('generateMidiFile called with options:', options);

  if (!abc || abc.trim().length === 0) {
    throw new Error('ABC notation is required');
  }

  const {
    tempo,
    instrument,
    includeClickTrack = false,
    filename,
    chordsOff = true,
    // Note: volume is not currently supported by abcjs getMidiFile
    // but kept in interface for future implementation
  } = options;

  // Build abcjs options
  const midiOptions: AbcjsMidiOptions = {
    midiOutputType: 'binary',
    chordsOff,
  };

  // Add tempo if specified
  const validatedTempo = validateTempo(tempo);
  if (validatedTempo !== undefined) {
    midiOptions.bpm = validatedTempo;
  }

  // Add instrument
  const program = resolveInstrument(instrument);
  if (program !== DEFAULT_INSTRUMENT) {
    midiOptions.program = program;
  }

  // Add click track options
  if (includeClickTrack) {
    midiOptions.drumOn = true;
    midiOptions.drumIntro = 0; // No intro measures
    midiOptions.drumBars = 1000; // Play throughout (large number)
  }

  log('Generating MIDI with options:', midiOptions);

  try {
    // Access the synth module from abcjs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const synthModule = (abcjs as any).synth;

    if (!synthModule || typeof synthModule.getMidiFile !== 'function') {
      throw new Error('abcjs MIDI generation not available');
    }

    // Generate the MIDI file
    const midiResult = synthModule.getMidiFile(abc, midiOptions);

    log('MIDI generation result type:', typeof midiResult);

    // Handle different result types
    let midiBlob: Blob;

    if (midiResult instanceof Blob) {
      midiBlob = midiResult;
    } else if (midiResult instanceof ArrayBuffer) {
      midiBlob = new Blob([midiResult], { type: MIDI_MIME_TYPE });
    } else if (typeof midiResult === 'string') {
      // Encoded string - convert to blob
      const binaryString = decodeURIComponent(midiResult);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      midiBlob = new Blob([bytes], { type: MIDI_MIME_TYPE });
    } else if (midiResult && typeof midiResult === 'object') {
      // Could be an object with data property
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (midiResult as any).data || midiResult;
      if (data instanceof Blob) {
        midiBlob = data;
      } else if (data instanceof ArrayBuffer) {
        midiBlob = new Blob([data], { type: MIDI_MIME_TYPE });
      } else if (Array.isArray(data)) {
        midiBlob = new Blob([new Uint8Array(data)], { type: MIDI_MIME_TYPE });
      } else {
        throw new Error(`Unexpected MIDI result format: ${typeof data}`);
      }
    } else {
      throw new Error(`Unexpected MIDI result format: ${typeof midiResult}`);
    }

    const exportFilename = generateMidiFilename(abc, filename);

    log('MIDI file generated:', {
      filename: exportFilename,
      size: midiBlob.size,
    });

    return {
      blob: midiBlob,
      filename: exportFilename,
      mimeType: MIDI_MIME_TYPE,
      size: midiBlob.size,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log('MIDI generation error:', errorMessage);
    throw new Error(`Failed to generate MIDI file: ${errorMessage}`);
  }
}

/**
 * Generate MIDI file from a pre-rendered tune object
 *
 * Use this when you already have a TuneObject from renderAbc().
 *
 * @param tuneObject - The tune object from abcjs.renderAbc()
 * @param options - Export options
 * @returns Promise resolving to MidiExportResult
 */
export async function generateMidiFromTune(
  tuneObject: TuneObject,
  options: MidiExportOptions = {}
): Promise<MidiExportResult> {
  log('generateMidiFromTune called');

  const {
    tempo,
    instrument,
    includeClickTrack = false,
    filename,
    chordsOff = true,
  } = options;

  // Build abcjs options
  const midiOptions: AbcjsMidiOptions = {
    midiOutputType: 'binary',
    chordsOff,
  };

  const validatedTempo = validateTempo(tempo);
  if (validatedTempo !== undefined) {
    midiOptions.bpm = validatedTempo;
  }

  const program = resolveInstrument(instrument);
  if (program !== DEFAULT_INSTRUMENT) {
    midiOptions.program = program;
  }

  if (includeClickTrack) {
    midiOptions.drumOn = true;
    midiOptions.drumIntro = 0;
    midiOptions.drumBars = 1000;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const synthModule = (abcjs as any).synth;

    if (!synthModule || typeof synthModule.getMidiFile !== 'function') {
      throw new Error('abcjs MIDI generation not available');
    }

    const midiResult = synthModule.getMidiFile(tuneObject, midiOptions);

    let midiBlob: Blob;
    if (midiResult instanceof Blob) {
      midiBlob = midiResult;
    } else if (midiResult instanceof ArrayBuffer) {
      midiBlob = new Blob([midiResult], { type: MIDI_MIME_TYPE });
    } else if (typeof midiResult === 'string') {
      const binaryString = decodeURIComponent(midiResult);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      midiBlob = new Blob([bytes], { type: MIDI_MIME_TYPE });
    } else {
      throw new Error(`Unexpected MIDI result format: ${typeof midiResult}`);
    }

    // Try to extract title from tune object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tuneTitle = (tuneObject as any).metaText?.title;
    const exportFilename = filename
      ? `${sanitizeFilename(filename)}.mid`
      : tuneTitle
        ? `${sanitizeFilename(tuneTitle)}.mid`
        : `melody-${Date.now()}.mid`;

    return {
      blob: midiBlob,
      filename: exportFilename,
      mimeType: MIDI_MIME_TYPE,
      size: midiBlob.size,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log('MIDI generation from tune error:', errorMessage);
    throw new Error(`Failed to generate MIDI file: ${errorMessage}`);
  }
}

// =============================================================================
// Download Functions
// =============================================================================

/**
 * Download a MIDI blob as a file
 *
 * @param blob - The MIDI blob to download
 * @param filename - The filename for the download
 */
export function downloadMidi(blob: Blob, filename: string): void {
  log('Downloading MIDI:', filename, 'size:', blob.size);

  const url = URL.createObjectURL(blob);

  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Required for Firefox
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    log('Download initiated successfully');
  } finally {
    // Revoke URL after download starts
    setTimeout(() => {
      URL.revokeObjectURL(url);
      log('Revoked download URL');
    }, 1000);
  }
}

/**
 * Generate and download MIDI file in one step
 *
 * @param abc - ABC notation string
 * @param options - Export options
 * @returns Promise resolving to MidiExportResult
 *
 * @example
 * ```typescript
 * await exportAndDownloadMidi(abcNotation, {
 *   tempo: 120,
 *   instrument: 'piano',
 *   filename: 'my-song',
 * });
 * ```
 */
export async function exportAndDownloadMidi(
  abc: string,
  options: MidiExportOptions = {}
): Promise<MidiExportResult> {
  const result = await generateMidiFile(abc, options);
  downloadMidi(result.blob, result.filename);
  return result;
}

// =============================================================================
// Validation and Info Functions
// =============================================================================

/**
 * Check if MIDI export is supported
 *
 * MIDI export requires abcjs synth module to be available.
 */
export function isMidiExportSupported(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const synthModule = (abcjs as any).synth;
    const supported = synthModule && typeof synthModule.getMidiFile === 'function';
    log('MIDI export support check:', supported);
    return supported;
  } catch {
    log('MIDI export support check failed');
    return false;
  }
}

/**
 * Get information about available MIDI instruments
 */
export function getAvailableInstruments(): Array<{
  name: InstrumentName;
  program: number;
  displayName: string;
}> {
  const displayNames: Record<InstrumentName, string> = {
    piano: 'Piano',
    brightPiano: 'Bright Piano',
    electricPiano: 'Electric Piano',
    acousticGuitar: 'Acoustic Guitar (Nylon)',
    steelGuitar: 'Acoustic Guitar (Steel)',
    violin: 'Violin',
    viola: 'Viola',
    cello: 'Cello',
    trumpet: 'Trumpet',
    trombone: 'Trombone',
    altoSax: 'Alto Saxophone',
    oboe: 'Oboe',
    clarinet: 'Clarinet',
    flute: 'Flute',
    recorder: 'Recorder',
  };

  return (Object.keys(MIDI_INSTRUMENTS) as InstrumentName[]).map((name) => ({
    name,
    program: MIDI_INSTRUMENTS[name],
    displayName: displayNames[name],
  }));
}

/**
 * Get MIDI export format info
 */
export function getMidiFormatInfo(): {
  name: string;
  mimeType: string;
  extension: string;
  description: string;
  isSupported: boolean;
} {
  return {
    name: 'MIDI',
    mimeType: MIDI_MIME_TYPE,
    extension: '.mid',
    description: 'Standard MIDI File (SMF) - playable in any MIDI player',
    isSupported: isMidiExportSupported(),
  };
}

// =============================================================================
// Default Export
// =============================================================================

export default {
  generateMidiFile,
  generateMidiFromTune,
  downloadMidi,
  exportAndDownloadMidi,
  isMidiExportSupported,
  getAvailableInstruments,
  getMidiFormatInfo,
  resolveInstrument,
  validateTempo,
  extractTitleFromAbc,
  sanitizeFilename,
  generateMidiFilename,
  MIDI_INSTRUMENTS,
};
