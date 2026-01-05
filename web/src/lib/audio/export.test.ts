/**
 * Audio Export Module Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  downloadAudio,
  convertToWav,
  combineAudioTracks,
  exportRecording,
  exportAndDownload,
  fetchBlobFromUrl,
  generateFilename,
  sanitizeFilename,
  getSupportedFormats,
  isWavConversionSupported,
  getFormatInfo,
  getAllFormatsInfo,
} from './export';

// =============================================================================
// Mocks
// =============================================================================

// Mock URL.createObjectURL and revokeObjectURL
const mockObjectUrls = new Map<Blob, string>();
let urlCounter = 0;

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

// Mock AudioContext
class MockAudioBuffer {
  numberOfChannels = 2;
  sampleRate = 44100;
  duration = 10;
  length = 441000;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getChannelData(_channel: number): Float32Array {
    const data = new Float32Array(this.length);
    // Fill with sine wave for testing
    for (let i = 0; i < this.length; i++) {
      data[i] = Math.sin((i / this.sampleRate) * 440 * 2 * Math.PI) * 0.5;
    }
    return data;
  }
}

class MockAudioContext {
  sampleRate = 44100;

  async decodeAudioData(): Promise<AudioBuffer> {
    return new MockAudioBuffer() as unknown as AudioBuffer;
  }

  async close(): Promise<void> {}
}

class MockOfflineAudioContext {
  destination = {};
  numberOfChannels: number;
  length: number;
  sampleRate: number;

  constructor(numberOfChannels: number, length: number, sampleRate: number) {
    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.sampleRate = sampleRate;
  }

  createBufferSource() {
    return {
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
    };
  }

  createGain() {
    return {
      gain: { value: 1 },
      connect: vi.fn(),
    };
  }

  async startRendering(): Promise<AudioBuffer> {
    return new MockAudioBuffer() as unknown as AudioBuffer;
  }
}

// =============================================================================
// Test Setup
// =============================================================================

describe('export', () => {
  let originalAudioContext: typeof AudioContext;
  let originalOfflineAudioContext: typeof OfflineAudioContext;
  let mockLink: HTMLAnchorElement;
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock URL methods
    urlCounter = 0;
    mockObjectUrls.clear();
    URL.createObjectURL = vi.fn((blob: Blob) => {
      const url = `blob:http://localhost/mock-${urlCounter++}`;
      mockObjectUrls.set(blob, url);
      return url;
    });
    URL.revokeObjectURL = vi.fn();

    // Mock fetch - return a mock blob with arrayBuffer method
    const mockArrayBuffer = new ArrayBuffer(100);
    const mockFetchBlob = {
      arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
      type: 'audio/webm',
      size: 100,
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(mockFetchBlob),
    });

    // Mock AudioContext
    originalAudioContext = globalThis.AudioContext;
    originalOfflineAudioContext = globalThis.OfflineAudioContext;
    globalThis.AudioContext = MockAudioContext as unknown as typeof AudioContext;
    globalThis.OfflineAudioContext = MockOfflineAudioContext as unknown as typeof OfflineAudioContext;

    // Mock document.createElement for download link
    mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement;

    vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockReturnValue(mockLink);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockReturnValue(mockLink);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    globalThis.AudioContext = originalAudioContext;
    globalThis.OfflineAudioContext = originalOfflineAudioContext;
  });

  // ===========================================================================
  // Utility Functions
  // ===========================================================================

  describe('sanitizeFilename', () => {
    it('should remove forbidden characters', () => {
      expect(sanitizeFilename('test<>:"/\\|?*name')).toBe('testname');
    });

    it('should replace spaces with hyphens', () => {
      expect(sanitizeFilename('my song title')).toBe('my-song-title');
    });

    it('should collapse multiple hyphens', () => {
      expect(sanitizeFilename('test---name')).toBe('test-name');
    });

    it('should remove leading/trailing hyphens', () => {
      expect(sanitizeFilename('-test-name-')).toBe('test-name');
    });

    it('should limit length to 200 characters', () => {
      const longName = 'a'.repeat(300);
      expect(sanitizeFilename(longName).length).toBe(200);
    });

    it('should handle empty string', () => {
      expect(sanitizeFilename('')).toBe('');
    });
  });

  describe('generateFilename', () => {
    it('should generate filename with poem title', () => {
      const filename = generateFilename('My Poem', 'webm');
      expect(filename).toMatch(/^My-Poem-\d{4}-\d{2}-\d{2}\.webm$/);
    });

    it('should generate filename without poem title', () => {
      const filename = generateFilename(undefined, 'webm');
      expect(filename).toMatch(/^recording-\d{4}-\d{2}-\d{2}\.webm$/);
    });

    it('should include take number when provided', () => {
      const filename = generateFilename('My Poem', 'wav', 3);
      expect(filename).toMatch(/^My-Poem-take-3-\d{4}-\d{2}-\d{2}\.wav$/);
    });

    it('should use correct extension for format', () => {
      expect(generateFilename('Test', 'webm')).toContain('.webm');
      expect(generateFilename('Test', 'wav')).toContain('.wav');
    });
  });

  describe('getSupportedFormats', () => {
    it('should always include webm', () => {
      const formats = getSupportedFormats();
      expect(formats).toContain('webm');
    });

    it('should include wav when AudioContext is available', () => {
      const formats = getSupportedFormats();
      expect(formats).toContain('wav');
    });

    it('should not include wav when AudioContext is unavailable', () => {
      const temp = globalThis.AudioContext;
      // @ts-expect-error - intentionally setting to undefined
      globalThis.AudioContext = undefined;

      const formats = getSupportedFormats();
      expect(formats).not.toContain('wav');

      globalThis.AudioContext = temp;
    });
  });

  describe('isWavConversionSupported', () => {
    it('should return true when AudioContext is available', () => {
      expect(isWavConversionSupported()).toBe(true);
    });

    it('should return false when AudioContext is unavailable', () => {
      const temp = globalThis.AudioContext;
      // @ts-expect-error - intentionally setting to undefined
      globalThis.AudioContext = undefined;

      expect(isWavConversionSupported()).toBe(false);

      globalThis.AudioContext = temp;
    });
  });

  describe('getFormatInfo', () => {
    it('should return correct info for webm', () => {
      const info = getFormatInfo('webm');
      expect(info.name).toBe('WebM');
      expect(info.mimeType).toBe('audio/webm');
      expect(info.extension).toBe('.webm');
      expect(info.isSupported).toBe(true);
    });

    it('should return correct info for wav', () => {
      const info = getFormatInfo('wav');
      expect(info.name).toBe('WAV');
      expect(info.mimeType).toBe('audio/wav');
      expect(info.extension).toBe('.wav');
    });
  });

  describe('getAllFormatsInfo', () => {
    it('should return info for all formats', () => {
      const allInfo = getAllFormatsInfo();
      expect(allInfo.length).toBe(2);
      expect(allInfo.map((i) => i.name)).toContain('WebM');
      expect(allInfo.map((i) => i.name)).toContain('WAV');
    });
  });

  // ===========================================================================
  // Download Functions
  // ===========================================================================

  describe('downloadAudio', () => {
    it('should create a download link with correct properties', () => {
      const blob = new Blob(['test'], { type: 'audio/webm' });
      downloadAudio(blob, 'test.webm');

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe('test.webm');
      expect(mockLink.href).toBeDefined();
    });

    it('should trigger click on the link', () => {
      const blob = new Blob(['test'], { type: 'audio/webm' });
      downloadAudio(blob, 'test.webm');

      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should append and remove link from document', () => {
      const blob = new Blob(['test'], { type: 'audio/webm' });
      downloadAudio(blob, 'test.webm');

      expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
    });

    it('should revoke object URL after delay', () => {
      const blob = new Blob(['test'], { type: 'audio/webm' });
      downloadAudio(blob, 'test.webm');

      expect(URL.revokeObjectURL).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);

      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('fetchBlobFromUrl', () => {
    it('should fetch blob from URL', async () => {
      const result = await fetchBlobFromUrl('blob:http://localhost/test');

      expect(global.fetch).toHaveBeenCalledWith('blob:http://localhost/test');
      // Result should have blob-like properties
      expect(result).toBeDefined();
      expect(result.type).toBe('audio/webm');
    });

    it('should throw error on failed fetch', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(fetchBlobFromUrl('invalid-url')).rejects.toThrow('Failed to fetch blob');
    });
  });

  // ===========================================================================
  // Conversion Functions
  // ===========================================================================

  describe('convertToWav', () => {
    it('should convert blob to WAV format', async () => {
      // Create a blob with arrayBuffer method
      const mockArrayBuffer = new ArrayBuffer(100);
      const inputBlob = {
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
        type: 'audio/webm',
        size: 100,
      } as unknown as Blob;

      const result = await convertToWav(inputBlob);

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('audio/wav');
    });

    it('should respect quality options', async () => {
      const mockArrayBuffer = new ArrayBuffer(100);
      const inputBlob = {
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
        type: 'audio/webm',
        size: 100,
      } as unknown as Blob;

      const result = await convertToWav(inputBlob, {
        sampleRate: 48000,
        channels: 1,
        bitDepth: 24,
      });

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('audio/wav');
    });

    it('should throw when AudioContext is unavailable', async () => {
      const temp = globalThis.AudioContext;
      // @ts-expect-error - intentionally setting to undefined
      globalThis.AudioContext = undefined;

      const inputBlob = new Blob(['test audio'], { type: 'audio/webm' });
      await expect(convertToWav(inputBlob)).rejects.toThrow(
        'WAV conversion is not supported'
      );

      globalThis.AudioContext = temp;
    });
  });

  describe('combineAudioTracks', () => {
    it('should combine two audio tracks', async () => {
      const mockArrayBuffer = new ArrayBuffer(100);
      const recordingBlob = {
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
        type: 'audio/webm',
        size: 100,
      } as unknown as Blob;
      const melodyBlob = {
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
        type: 'audio/webm',
        size: 100,
      } as unknown as Blob;

      const result = await combineAudioTracks(recordingBlob, melodyBlob);

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('audio/wav');
    });

    it('should respect volume options', async () => {
      const mockArrayBuffer = new ArrayBuffer(100);
      const recordingBlob = {
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
        type: 'audio/webm',
        size: 100,
      } as unknown as Blob;
      const melodyBlob = {
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
        type: 'audio/webm',
        size: 100,
      } as unknown as Blob;

      const result = await combineAudioTracks(recordingBlob, melodyBlob, {
        recordingVolume: 0.8,
        melodyVolume: 0.3,
      });

      expect(result).toBeInstanceOf(Blob);
    });

    it('should throw when AudioContext is unavailable', async () => {
      const temp = globalThis.AudioContext;
      // @ts-expect-error - intentionally setting to undefined
      globalThis.AudioContext = undefined;

      const recordingBlob = new Blob(['recording'], { type: 'audio/webm' });
      const melodyBlob = new Blob(['melody'], { type: 'audio/webm' });

      await expect(combineAudioTracks(recordingBlob, melodyBlob)).rejects.toThrow(
        'Audio combining is not supported'
      );

      globalThis.AudioContext = temp;
    });
  });

  // ===========================================================================
  // High-Level Export Functions
  // ===========================================================================

  describe('exportRecording', () => {
    it('should export recording as WebM', async () => {
      const result = await exportRecording('blob:http://localhost/test', {
        format: 'webm',
      });

      expect(result.blob).toBeDefined();
      expect(result.mimeType).toBe('audio/webm');
      expect(result.filename).toContain('.webm');
    });

    it('should export recording as WAV', async () => {
      const result = await exportRecording('blob:http://localhost/test', {
        format: 'wav',
      });

      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.mimeType).toBe('audio/wav');
      expect(result.filename).toContain('.wav');
    });

    it('should use custom filename', async () => {
      const result = await exportRecording('blob:http://localhost/test', {
        format: 'webm',
        filename: 'my-custom-recording',
      });

      expect(result.filename).toBe('my-custom-recording.webm');
    });

    it('should include file size in result', async () => {
      const result = await exportRecording('blob:http://localhost/test');

      expect(result.size).toBeGreaterThan(0);
    });
  });

  describe('exportAndDownload', () => {
    it('should export and trigger download', async () => {
      const result = await exportAndDownload(
        'blob:http://localhost/test',
        'My Poem',
        { format: 'webm' }
      );

      expect(result.blob).toBeDefined();
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should use poem title in filename', async () => {
      const result = await exportAndDownload(
        'blob:http://localhost/test',
        'My Great Poem'
      );

      expect(result.filename).toContain('My-Great-Poem');
    });

    it('should default to webm format', async () => {
      const result = await exportAndDownload('blob:http://localhost/test');

      expect(result.mimeType).toBe('audio/webm');
    });
  });

  // ===========================================================================
  // WAV Encoding Tests
  // ===========================================================================

  describe('WAV encoding', () => {
    it('should create blob with audio/wav type', async () => {
      const mockArrayBuffer = new ArrayBuffer(100);
      const inputBlob = {
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
        type: 'audio/webm',
        size: 100,
      } as unknown as Blob;

      const result = await convertToWav(inputBlob);

      // Verify it's a valid WAV blob
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('audio/wav');
      expect(result.size).toBeGreaterThan(44); // WAV header is 44 bytes
    });

    it('should encode with different bit depths', async () => {
      const mockArrayBuffer = new ArrayBuffer(100);
      const inputBlob = {
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
        type: 'audio/webm',
        size: 100,
      } as unknown as Blob;

      for (const bitDepth of [8, 16, 24, 32] as const) {
        const result = await convertToWav(inputBlob, { bitDepth });
        expect(result).toBeInstanceOf(Blob);
        expect(result.type).toBe('audio/wav');
      }
    });
  });
});
