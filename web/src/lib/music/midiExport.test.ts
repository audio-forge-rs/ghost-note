/**
 * Tests for MIDI Export Module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
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
  type MidiExportOptions,
  type MidiExportResult,
} from './midiExport';

// Mock abcjs module
const mockGetMidiFile = vi.fn();

vi.mock('abcjs', () => ({
  default: {
    renderAbc: vi.fn(() => [{ tuneNumber: 0 }]),
    synth: {
      getMidiFile: (...args: unknown[]) => mockGetMidiFile(...args),
    },
  },
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
vi.stubGlobal('URL', {
  createObjectURL: mockCreateObjectURL,
  revokeObjectURL: mockRevokeObjectURL,
});

describe('MIDI Export Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock returns a Blob
    mockGetMidiFile.mockReturnValue(new Blob(['MThd...'], { type: 'audio/midi' }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('resolveInstrument', () => {
    it('returns default piano for undefined', () => {
      expect(resolveInstrument(undefined)).toBe(0);
    });

    it('resolves instrument names to MIDI program numbers', () => {
      expect(resolveInstrument('piano')).toBe(0);
      expect(resolveInstrument('flute')).toBe(73);
      expect(resolveInstrument('violin')).toBe(40);
      expect(resolveInstrument('acousticGuitar')).toBe(24);
    });

    it('returns direct MIDI program numbers', () => {
      expect(resolveInstrument(0)).toBe(0);
      expect(resolveInstrument(73)).toBe(73);
      expect(resolveInstrument(127)).toBe(127);
    });

    it('clamps invalid MIDI program numbers', () => {
      expect(resolveInstrument(-1)).toBe(0);
      expect(resolveInstrument(128)).toBe(0);
      expect(resolveInstrument(256)).toBe(0);
    });

    it('returns default for unknown instrument names', () => {
      // @ts-expect-error - testing invalid input
      expect(resolveInstrument('unknown')).toBe(0);
    });
  });

  describe('validateTempo', () => {
    it('returns undefined for undefined input', () => {
      expect(validateTempo(undefined)).toBeUndefined();
    });

    it('returns valid tempo values unchanged', () => {
      expect(validateTempo(120)).toBe(120);
      expect(validateTempo(60)).toBe(60);
      expect(validateTempo(180)).toBe(180);
    });

    it('clamps tempo below minimum to 20', () => {
      expect(validateTempo(10)).toBe(20);
      expect(validateTempo(0)).toBe(20);
      expect(validateTempo(-50)).toBe(20);
    });

    it('clamps tempo above maximum to 300', () => {
      expect(validateTempo(400)).toBe(300);
      expect(validateTempo(1000)).toBe(300);
    });

    it('rounds fractional tempos', () => {
      expect(validateTempo(120.5)).toBe(121);
      expect(validateTempo(99.4)).toBe(99);
    });
  });

  describe('extractTitleFromAbc', () => {
    it('extracts title from ABC notation', () => {
      const abc = 'X:1\nT:My Melody\nM:4/4\nK:C\nCDEF|';
      expect(extractTitleFromAbc(abc)).toBe('My Melody');
    });

    it('handles title with leading/trailing whitespace', () => {
      const abc = 'X:1\nT:  Spaced Title  \nK:C\nCDEF|';
      expect(extractTitleFromAbc(abc)).toBe('Spaced Title');
    });

    it('returns undefined for ABC without title', () => {
      const abc = 'X:1\nM:4/4\nK:C\nCDEF|';
      expect(extractTitleFromAbc(abc)).toBeUndefined();
    });

    it('returns first title when multiple present', () => {
      const abc = 'X:1\nT:First Title\nT:Second Title\nK:C\nCDEF|';
      expect(extractTitleFromAbc(abc)).toBe('First Title');
    });
  });

  describe('sanitizeFilename', () => {
    it('removes forbidden characters', () => {
      expect(sanitizeFilename('song<>:"/\\|?*.mid')).toBe('song.mid');
    });

    it('replaces spaces with hyphens', () => {
      expect(sanitizeFilename('my cool song')).toBe('my-cool-song');
    });

    it('collapses multiple hyphens', () => {
      expect(sanitizeFilename('song---name')).toBe('song-name');
    });

    it('removes leading/trailing hyphens', () => {
      expect(sanitizeFilename('-song-name-')).toBe('song-name');
    });

    it('truncates long filenames', () => {
      const longName = 'a'.repeat(150);
      expect(sanitizeFilename(longName).length).toBe(100);
    });
  });

  describe('generateMidiFilename', () => {
    it('uses custom filename when provided', () => {
      const abc = 'X:1\nT:Original Title\nK:C\nCDEF|';
      expect(generateMidiFilename(abc, 'custom-name')).toBe('custom-name.mid');
    });

    it('adds .mid extension if missing', () => {
      const abc = 'X:1\nT:Test\nK:C\nCDEF|';
      expect(generateMidiFilename(abc, 'song')).toBe('song.mid');
    });

    it('does not double .mid extension', () => {
      const abc = 'X:1\nT:Test\nK:C\nCDEF|';
      expect(generateMidiFilename(abc, 'song.mid')).toBe('song.mid');
    });

    it('uses ABC title when no custom filename', () => {
      const abc = 'X:1\nT:My Song\nK:C\nCDEF|';
      expect(generateMidiFilename(abc)).toBe('My-Song.mid');
    });

    it('generates timestamp filename when no title available', () => {
      const abc = 'X:1\nK:C\nCDEF|';
      const filename = generateMidiFilename(abc);
      expect(filename).toMatch(/^melody-\d+\.mid$/);
    });
  });

  describe('generateMidiFile', () => {
    const validAbc = `X:1
T:Test Melody
M:4/4
L:1/8
Q:1/4=120
K:C
CDEF GABc|`;

    it('generates MIDI file from ABC notation', async () => {
      const result = await generateMidiFile(validAbc);

      expect(result).toBeDefined();
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.filename).toBe('Test-Melody.mid');
      expect(result.mimeType).toBe('audio/midi');
      expect(result.size).toBeGreaterThan(0);
    });

    it('throws error for empty ABC notation', async () => {
      await expect(generateMidiFile('')).rejects.toThrow('ABC notation is required');
      await expect(generateMidiFile('   ')).rejects.toThrow('ABC notation is required');
    });

    it('passes tempo option to abcjs', async () => {
      await generateMidiFile(validAbc, { tempo: 140 });

      expect(mockGetMidiFile).toHaveBeenCalledWith(
        validAbc,
        expect.objectContaining({ bpm: 140 })
      );
    });

    it('passes instrument option to abcjs', async () => {
      await generateMidiFile(validAbc, { instrument: 'flute' });

      expect(mockGetMidiFile).toHaveBeenCalledWith(
        validAbc,
        expect.objectContaining({ program: 73 })
      );
    });

    it('passes click track option to abcjs', async () => {
      await generateMidiFile(validAbc, { includeClickTrack: true });

      expect(mockGetMidiFile).toHaveBeenCalledWith(
        validAbc,
        expect.objectContaining({
          drumOn: true,
          drumIntro: 0,
          drumBars: 1000,
        })
      );
    });

    it('uses custom filename when provided', async () => {
      const result = await generateMidiFile(validAbc, { filename: 'custom-song' });

      expect(result.filename).toBe('custom-song.mid');
    });

    it('sets chordsOff to true by default', async () => {
      await generateMidiFile(validAbc);

      expect(mockGetMidiFile).toHaveBeenCalledWith(
        validAbc,
        expect.objectContaining({ chordsOff: true })
      );
    });

    it('allows chordsOff to be disabled', async () => {
      await generateMidiFile(validAbc, { chordsOff: false });

      expect(mockGetMidiFile).toHaveBeenCalledWith(
        validAbc,
        expect.objectContaining({ chordsOff: false })
      );
    });

    it('handles ArrayBuffer result from abcjs', async () => {
      const arrayBuffer = new ArrayBuffer(10);
      mockGetMidiFile.mockReturnValue(arrayBuffer);

      const result = await generateMidiFile(validAbc);

      expect(result.blob).toBeInstanceOf(Blob);
    });

    it('handles encoded string result from abcjs', async () => {
      mockGetMidiFile.mockReturnValue('%4D%54%68%64'); // 'MThd' encoded

      const result = await generateMidiFile(validAbc);

      expect(result.blob).toBeInstanceOf(Blob);
    });

    it('handles object with data property', async () => {
      mockGetMidiFile.mockReturnValue({ data: new Blob(['test']) });

      const result = await generateMidiFile(validAbc);

      expect(result.blob).toBeInstanceOf(Blob);
    });

    it('throws error when abcjs synth is unavailable', async () => {
      // Temporarily override the mock
      const originalMock = mockGetMidiFile;
      mockGetMidiFile.mockImplementation(() => {
        throw new Error('synth not available');
      });

      await expect(generateMidiFile(validAbc)).rejects.toThrow('Failed to generate MIDI file');

      mockGetMidiFile.mockImplementation(originalMock);
    });
  });

  describe('generateMidiFromTune', () => {
    const mockTuneObject = {
      tuneNumber: 0,
      metaText: { title: 'Tune Title' },
    };

    it('generates MIDI from tune object', async () => {
      // @ts-expect-error - mock tune object
      const result = await generateMidiFromTune(mockTuneObject);

      expect(result).toBeDefined();
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.mimeType).toBe('audio/midi');
    });

    it('uses tune title for filename', async () => {
      // @ts-expect-error - mock tune object
      const result = await generateMidiFromTune(mockTuneObject);

      expect(result.filename).toBe('Tune-Title.mid');
    });

    it('uses custom filename when provided', async () => {
      // @ts-expect-error - mock tune object
      const result = await generateMidiFromTune(mockTuneObject, {
        filename: 'my-tune',
      });

      expect(result.filename).toBe('my-tune.mid');
    });

    it('generates timestamp filename when no title', async () => {
      const tuneWithoutTitle = { tuneNumber: 0 };

      // @ts-expect-error - mock tune object
      const result = await generateMidiFromTune(tuneWithoutTitle);

      expect(result.filename).toMatch(/^melody-\d+\.mid$/);
    });
  });

  describe('downloadMidi', () => {
    let appendChildSpy: ReturnType<typeof vi.spyOn>;
    let removeChildSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
    });

    afterEach(() => {
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('creates download link and triggers click', () => {
      const blob = new Blob(['test'], { type: 'audio/midi' });

      downloadMidi(blob, 'test.mid');

      expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
      expect(appendChildSpy).toHaveBeenCalled();
      // Link was clicked (we can verify appendChild was called with an anchor)
      expect(removeChildSpy).toHaveBeenCalled();
    });

    it('revokes object URL after timeout', () => {
      vi.useFakeTimers();

      const blob = new Blob(['test'], { type: 'audio/midi' });
      downloadMidi(blob, 'test.mid');

      expect(mockRevokeObjectURL).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

      vi.useRealTimers();
    });
  });

  describe('exportAndDownloadMidi', () => {
    let appendChildSpy: ReturnType<typeof vi.spyOn>;
    let removeChildSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
    });

    afterEach(() => {
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('generates and downloads MIDI in one step', async () => {
      const abc = 'X:1\nT:Test\nK:C\nCDEF|';

      const result = await exportAndDownloadMidi(abc, { filename: 'download-test' });

      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.filename).toBe('download-test.mid');
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });
  });

  describe('isMidiExportSupported', () => {
    it('returns true when abcjs synth.getMidiFile is available', () => {
      expect(isMidiExportSupported()).toBe(true);
    });
  });

  describe('getAvailableInstruments', () => {
    it('returns all instrument presets', () => {
      const instruments = getAvailableInstruments();

      expect(instruments.length).toBe(Object.keys(MIDI_INSTRUMENTS).length);

      // Check structure
      instruments.forEach((inst) => {
        expect(inst).toHaveProperty('name');
        expect(inst).toHaveProperty('program');
        expect(inst).toHaveProperty('displayName');
        expect(typeof inst.name).toBe('string');
        expect(typeof inst.program).toBe('number');
        expect(typeof inst.displayName).toBe('string');
      });
    });

    it('includes piano as first instrument', () => {
      const instruments = getAvailableInstruments();
      const piano = instruments.find((i) => i.name === 'piano');

      expect(piano).toBeDefined();
      expect(piano?.program).toBe(0);
      expect(piano?.displayName).toBe('Piano');
    });

    it('includes expected instruments', () => {
      const instruments = getAvailableInstruments();
      const names = instruments.map((i) => i.name);

      expect(names).toContain('piano');
      expect(names).toContain('flute');
      expect(names).toContain('violin');
      expect(names).toContain('acousticGuitar');
    });
  });

  describe('getMidiFormatInfo', () => {
    it('returns correct format information', () => {
      const info = getMidiFormatInfo();

      expect(info.name).toBe('MIDI');
      expect(info.mimeType).toBe('audio/midi');
      expect(info.extension).toBe('.mid');
      expect(info.description).toContain('Standard MIDI File');
      expect(typeof info.isSupported).toBe('boolean');
    });
  });

  describe('MIDI_INSTRUMENTS constant', () => {
    it('contains expected instruments', () => {
      expect(MIDI_INSTRUMENTS.piano).toBe(0);
      expect(MIDI_INSTRUMENTS.flute).toBe(73);
      expect(MIDI_INSTRUMENTS.violin).toBe(40);
      expect(MIDI_INSTRUMENTS.trumpet).toBe(56);
    });

    it('has all values in valid MIDI range', () => {
      Object.values(MIDI_INSTRUMENTS).forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(127);
      });
    });
  });

  describe('edge cases', () => {
    it('handles ABC with special characters in title', async () => {
      const abc = 'X:1\nT:Song: "The Best" - Part 1\nK:C\nCDEF|';

      const result = await generateMidiFile(abc);

      expect(result.filename).not.toContain(':');
      expect(result.filename).not.toContain('"');
    });

    it('handles very long ABC notation', async () => {
      const measures = Array(100).fill('CDEF|').join('');
      const abc = `X:1\nT:Long Melody\nM:4/4\nK:C\n${measures}`;

      const result = await generateMidiFile(abc);

      expect(result.blob).toBeInstanceOf(Blob);
    });

    it('handles ABC with lyrics', async () => {
      const abc = `X:1
T:Song with Lyrics
M:4/4
K:C
CDEF|
w:One two three four`;

      const result = await generateMidiFile(abc);

      expect(result.blob).toBeInstanceOf(Blob);
    });

    it('handles extreme tempo values', async () => {
      const abc = 'X:1\nT:Test\nK:C\nCDEF|';

      // Very low tempo
      await generateMidiFile(abc, { tempo: 1 });
      expect(mockGetMidiFile).toHaveBeenCalledWith(
        abc,
        expect.objectContaining({ bpm: 20 })
      );

      mockGetMidiFile.mockClear();

      // Very high tempo
      await generateMidiFile(abc, { tempo: 1000 });
      expect(mockGetMidiFile).toHaveBeenCalledWith(
        abc,
        expect.objectContaining({ bpm: 300 })
      );
    });
  });

  describe('type safety', () => {
    it('MidiExportOptions accepts all valid options', () => {
      const options: MidiExportOptions = {
        tempo: 120,
        instrument: 'piano',
        includeClickTrack: true,
        filename: 'test',
        chordsOff: false,
        volume: 80,
      };

      expect(options).toBeDefined();
    });

    it('MidiExportResult has all required fields', () => {
      const result: MidiExportResult = {
        blob: new Blob(),
        filename: 'test.mid',
        mimeType: 'audio/midi',
        size: 100,
      };

      expect(result).toBeDefined();
    });

    it('MidiExportResult accepts optional duration', () => {
      const result: MidiExportResult = {
        blob: new Blob(),
        filename: 'test.mid',
        mimeType: 'audio/midi',
        size: 100,
        duration: 30.5,
      };

      expect(result.duration).toBe(30.5);
    });
  });
});
