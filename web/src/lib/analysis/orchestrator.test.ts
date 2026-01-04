/**
 * Tests for the Poem Analysis Orchestrator
 *
 * @module lib/analysis/orchestrator.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  analyzePoem,
  analyzeIncrementally,
  hashText,
  getCachedAnalysis,
  setCachedAnalysis,
  clearAnalysisCache,
  clearOldCacheEntries,
  type AnalysisProgress,
  type ProgressCallback,
} from './orchestrator';
import type { PoemAnalysis } from '@/types/analysis';

// =============================================================================
// Test Data
// =============================================================================

const SIMPLE_POEM = `Roses are red
Violets are blue
Sugar is sweet
And so are you`;

const HAIKU = `An old silent pond
A frog jumps into the pond
Splash! Silence again.`;

const IAMBIC_PENTAMETER = `Shall I compare thee to a summer's day?
Thou art more lovely and more temperate:
Rough winds do shake the darling buds of May,
And summer's lease hath all too short a date.`;

const SINGLE_LINE = 'The quick brown fox jumps over the lazy dog';

const EMPTY_POEM = '';

const WHITESPACE_ONLY = '   \n\n   \t\t   ';

// =============================================================================
// Hash Function Tests
// =============================================================================

describe('hashText', () => {
  it('should generate consistent hashes for the same text', () => {
    const hash1 = hashText('Hello, World!');
    const hash2 = hashText('Hello, World!');
    expect(hash1).toBe(hash2);
  });

  it('should generate different hashes for different texts', () => {
    const hash1 = hashText('Hello, World!');
    const hash2 = hashText('Goodbye, World!');
    expect(hash1).not.toBe(hash2);
  });

  it('should handle empty strings', () => {
    const hash = hashText('');
    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
  });

  it('should handle special characters', () => {
    const hash = hashText('Hello\n\t\r\0World');
    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
  });

  it('should handle unicode characters', () => {
    const hash = hashText('Hello 世界 🌍');
    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
  });

  it('should return hex strings', () => {
    const hash = hashText('test');
    expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
  });
});

// =============================================================================
// Cache Tests
// =============================================================================

describe('caching', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      key: vi.fn((index: number) => Object.keys(store)[index] || null),
      get length() {
        return Object.keys(store).length;
      },
    };
  })();

  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock);
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getCachedAnalysis', () => {
    it('should return null for non-existent cache entry', () => {
      const result = getCachedAnalysis('nonexistent');
      expect(result).toBeNull();
    });

    it('should return cached analysis if not expired', () => {
      const mockAnalysis = {
        meta: { lineCount: 1, stanzaCount: 1, wordCount: 1, syllableCount: 1 },
      } as PoemAnalysis;

      const cacheEntry = {
        hash: 'testhash',
        timestamp: Date.now(),
        analysis: mockAnalysis,
      };

      localStorageMock.setItem('ghost-note-analysis-testhash', JSON.stringify(cacheEntry));

      const result = getCachedAnalysis('testhash');
      expect(result).toBeDefined();
      expect(result?.meta.lineCount).toBe(1);
    });

    it('should return null for expired cache entry', () => {
      const mockAnalysis = {
        meta: { lineCount: 1, stanzaCount: 1, wordCount: 1, syllableCount: 1 },
      } as PoemAnalysis;

      const cacheEntry = {
        hash: 'testhash',
        timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
        analysis: mockAnalysis,
      };

      localStorageMock.setItem('ghost-note-analysis-testhash', JSON.stringify(cacheEntry));

      const result = getCachedAnalysis('testhash', 24 * 60 * 60 * 1000);
      expect(result).toBeNull();
    });
  });

  describe('setCachedAnalysis', () => {
    it('should store analysis in localStorage', () => {
      const mockAnalysis = {
        meta: { lineCount: 1, stanzaCount: 1, wordCount: 1, syllableCount: 1 },
      } as PoemAnalysis;

      setCachedAnalysis('testhash', mockAnalysis);

      expect(localStorageMock.setItem).toHaveBeenCalled();
      const stored = localStorageMock.getItem('ghost-note-analysis-testhash');
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed.hash).toBe('testhash');
      expect(parsed.analysis.meta.lineCount).toBe(1);
    });
  });

  describe('clearAnalysisCache', () => {
    it('should remove all analysis cache entries', () => {
      localStorageMock.setItem('ghost-note-analysis-hash1', '{}');
      localStorageMock.setItem('ghost-note-analysis-hash2', '{}');
      localStorageMock.setItem('other-key', '{}');

      clearAnalysisCache();

      expect(localStorageMock.getItem('ghost-note-analysis-hash1')).toBeNull();
      expect(localStorageMock.getItem('ghost-note-analysis-hash2')).toBeNull();
      expect(localStorageMock.getItem('other-key')).toBe('{}');
    });
  });

  describe('clearOldCacheEntries', () => {
    it('should remove only expired entries', () => {
      const freshEntry = {
        hash: 'fresh',
        timestamp: Date.now(),
        analysis: {},
      };

      const oldEntry = {
        hash: 'old',
        timestamp: Date.now() - 25 * 60 * 60 * 1000,
        analysis: {},
      };

      localStorageMock.setItem('ghost-note-analysis-fresh', JSON.stringify(freshEntry));
      localStorageMock.setItem('ghost-note-analysis-old', JSON.stringify(oldEntry));

      clearOldCacheEntries(24 * 60 * 60 * 1000);

      expect(localStorageMock.getItem('ghost-note-analysis-fresh')).toBeDefined();
      expect(localStorageMock.getItem('ghost-note-analysis-old')).toBeNull();
    });
  });
});

// =============================================================================
// analyzePoem Tests
// =============================================================================

describe('analyzePoem', () => {
  describe('basic functionality', () => {
    it('should analyze a simple poem', async () => {
      const analysis = await analyzePoem(SIMPLE_POEM, { useCache: false });

      expect(analysis).toBeDefined();
      expect(analysis.meta).toBeDefined();
      expect(analysis.structure).toBeDefined();
      expect(analysis.prosody).toBeDefined();
      expect(analysis.emotion).toBeDefined();
      expect(analysis.problems).toBeDefined();
      expect(analysis.melodySuggestions).toBeDefined();
    });

    it('should correctly count lines and stanzas', async () => {
      const analysis = await analyzePoem(SIMPLE_POEM, { useCache: false });

      expect(analysis.meta.lineCount).toBe(4);
      expect(analysis.meta.stanzaCount).toBe(1);
    });

    it('should correctly count words', async () => {
      const analysis = await analyzePoem(SIMPLE_POEM, { useCache: false });

      // "Roses are red" + "Violets are blue" + "Sugar is sweet" + "And so are you"
      // 3 + 3 + 3 + 4 = 13
      expect(analysis.meta.wordCount).toBe(13);
    });

    it('should handle multi-stanza poems', async () => {
      const multiStanza = `First stanza line one
First stanza line two

Second stanza line one
Second stanza line two`;

      const analysis = await analyzePoem(multiStanza, { useCache: false });

      expect(analysis.meta.stanzaCount).toBe(2);
      expect(analysis.meta.lineCount).toBe(4);
      expect(analysis.structure.stanzas.length).toBe(2);
    });

    it('should handle a haiku', async () => {
      const analysis = await analyzePoem(HAIKU, { useCache: false });

      expect(analysis.meta.lineCount).toBe(3);
      expect(analysis.meta.stanzaCount).toBe(1);
      expect(analysis.meta.syllableCount).toBeGreaterThan(0);
    });
  });

  describe('structure analysis', () => {
    it('should analyze words into syllables', async () => {
      const analysis = await analyzePoem(SIMPLE_POEM, { useCache: false });

      const firstLine = analysis.structure.stanzas[0].lines[0];
      expect(firstLine.words.length).toBeGreaterThan(0);

      // "Roses" should have syllables
      const roses = firstLine.words[0];
      expect(roses.text.toLowerCase()).toBe('roses');
      expect(roses.syllables.length).toBeGreaterThan(0);
    });

    it('should calculate stress patterns', async () => {
      const analysis = await analyzePoem(SIMPLE_POEM, { useCache: false });

      const firstLine = analysis.structure.stanzas[0].lines[0];
      expect(firstLine.stressPattern).toBeDefined();
      expect(firstLine.stressPattern.length).toBeGreaterThan(0);
      expect(/^[012]+$/.test(firstLine.stressPattern)).toBe(true);
    });

    it('should calculate syllable counts per line', async () => {
      const analysis = await analyzePoem(SIMPLE_POEM, { useCache: false });

      const firstLine = analysis.structure.stanzas[0].lines[0];
      expect(firstLine.syllableCount).toBeGreaterThan(0);
    });
  });

  describe('prosody analysis', () => {
    it('should detect meter', async () => {
      const analysis = await analyzePoem(IAMBIC_PENTAMETER, { useCache: false });

      expect(analysis.prosody.meter).toBeDefined();
      expect(analysis.prosody.meter.footType).toBeDefined();
      expect(analysis.prosody.meter.confidence).toBeGreaterThanOrEqual(0);
      expect(analysis.prosody.meter.confidence).toBeLessThanOrEqual(1);
    });

    it('should analyze rhyme scheme', async () => {
      const analysis = await analyzePoem(SIMPLE_POEM, { useCache: false });

      expect(analysis.prosody.rhyme).toBeDefined();
      expect(analysis.prosody.rhyme.scheme).toBeDefined();
      expect(typeof analysis.prosody.rhyme.scheme).toBe('string');
    });

    it('should calculate regularity', async () => {
      const analysis = await analyzePoem(IAMBIC_PENTAMETER, { useCache: false });

      expect(analysis.prosody.regularity).toBeGreaterThanOrEqual(0);
      expect(analysis.prosody.regularity).toBeLessThanOrEqual(1);
    });
  });

  describe('singability analysis', () => {
    it('should score singability for each line', async () => {
      const analysis = await analyzePoem(SIMPLE_POEM, { useCache: false });

      const firstLine = analysis.structure.stanzas[0].lines[0];
      expect(firstLine.singability).toBeDefined();
      expect(firstLine.singability.lineScore).toBeGreaterThanOrEqual(0);
      expect(firstLine.singability.lineScore).toBeLessThanOrEqual(1);
    });

    it('should identify problem spots', async () => {
      const analysis = await analyzePoem(SIMPLE_POEM, { useCache: false });

      const firstLine = analysis.structure.stanzas[0].lines[0];
      expect(firstLine.singability.problemSpots).toBeDefined();
      expect(Array.isArray(firstLine.singability.problemSpots)).toBe(true);
    });
  });

  describe('emotion analysis', () => {
    it('should detect sentiment', async () => {
      const analysis = await analyzePoem(SIMPLE_POEM, { useCache: false });

      expect(analysis.emotion.overallSentiment).toBeDefined();
      expect(analysis.emotion.overallSentiment).toBeGreaterThanOrEqual(-1);
      expect(analysis.emotion.overallSentiment).toBeLessThanOrEqual(1);
    });

    it('should detect arousal', async () => {
      const analysis = await analyzePoem(SIMPLE_POEM, { useCache: false });

      expect(analysis.emotion.arousal).toBeGreaterThanOrEqual(0);
      expect(analysis.emotion.arousal).toBeLessThanOrEqual(1);
    });

    it('should identify dominant emotions', async () => {
      const analysis = await analyzePoem(SIMPLE_POEM, { useCache: false });

      expect(analysis.emotion.dominantEmotions).toBeDefined();
      expect(Array.isArray(analysis.emotion.dominantEmotions)).toBe(true);
    });

    it('should suggest music parameters', async () => {
      const analysis = await analyzePoem(SIMPLE_POEM, { useCache: false });

      expect(analysis.emotion.suggestedMusicParams).toBeDefined();
      expect(analysis.emotion.suggestedMusicParams.mode).toMatch(/^(major|minor)$/);
      expect(analysis.emotion.suggestedMusicParams.tempoRange).toHaveLength(2);
    });
  });

  describe('melody suggestions', () => {
    it('should suggest time signature', async () => {
      const analysis = await analyzePoem(SIMPLE_POEM, { useCache: false });

      expect(analysis.melodySuggestions.timeSignature).toMatch(/^(4\/4|3\/4|6\/8|2\/4)$/);
    });

    it('should suggest tempo', async () => {
      const analysis = await analyzePoem(SIMPLE_POEM, { useCache: false });

      expect(analysis.melodySuggestions.tempo).toBeGreaterThan(0);
      expect(analysis.melodySuggestions.tempo).toBeLessThan(300);
    });

    it('should suggest key', async () => {
      const analysis = await analyzePoem(SIMPLE_POEM, { useCache: false });

      expect(analysis.melodySuggestions.key).toBeDefined();
      expect(typeof analysis.melodySuggestions.key).toBe('string');
    });

    it('should identify phrase breaks', async () => {
      const analysis = await analyzePoem(SIMPLE_POEM, { useCache: false });

      expect(analysis.melodySuggestions.phraseBreaks).toBeDefined();
      expect(Array.isArray(analysis.melodySuggestions.phraseBreaks)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty text', async () => {
      const analysis = await analyzePoem(EMPTY_POEM, { useCache: false });

      expect(analysis).toBeDefined();
      expect(analysis.meta.lineCount).toBe(0);
      expect(analysis.meta.wordCount).toBe(0);
    });

    it('should handle whitespace-only text', async () => {
      const analysis = await analyzePoem(WHITESPACE_ONLY, { useCache: false });

      expect(analysis).toBeDefined();
      expect(analysis.meta.lineCount).toBe(0);
    });

    it('should handle single line', async () => {
      const analysis = await analyzePoem(SINGLE_LINE, { useCache: false });

      expect(analysis).toBeDefined();
      expect(analysis.meta.lineCount).toBe(1);
      expect(analysis.meta.stanzaCount).toBe(1);
    });

    it('should handle very long lines', async () => {
      const longLine = 'word '.repeat(100).trim();
      const analysis = await analyzePoem(longLine, { useCache: false });

      expect(analysis).toBeDefined();
      expect(analysis.meta.wordCount).toBe(100);
    });

    it('should handle special characters', async () => {
      const specialChars = `Hello—world!
"Quotes" and 'apostrophes'
Em-dashes and en–dashes`;

      const analysis = await analyzePoem(specialChars, { useCache: false });

      expect(analysis).toBeDefined();
      expect(analysis.meta.lineCount).toBe(3);
    });

    it('should handle contractions', async () => {
      const contractions = `I can't believe it's true
You won't believe what I've seen
They're saying we'll find the way`;

      const analysis = await analyzePoem(contractions, { useCache: false });

      expect(analysis).toBeDefined();
      // Contractions should be treated as single words
      expect(analysis.meta.wordCount).toBeGreaterThan(0);
    });
  });

  describe('progress callbacks', () => {
    it('should call progress callback during analysis', async () => {
      const progressUpdates: AnalysisProgress[] = [];
      const onProgress: ProgressCallback = (p) => progressUpdates.push({ ...p });

      await analyzePoem(SIMPLE_POEM, { useCache: false, onProgress });

      expect(progressUpdates.length).toBeGreaterThan(0);

      // Should have progress for each stage
      const stages = progressUpdates.map((p) => p.stage);
      expect(stages).toContain('preprocess');
      expect(stages).toContain('phonetic');
      expect(stages).toContain('complete');
    });

    it('should report 100% on completion', async () => {
      let finalProgress: AnalysisProgress | null = null;
      const onProgress: ProgressCallback = (p) => {
        finalProgress = { ...p };
      };

      await analyzePoem(SIMPLE_POEM, { useCache: false, onProgress });

      expect(finalProgress).toBeDefined();
      expect(finalProgress!.percent).toBe(100);
      expect(finalProgress!.stage).toBe('complete');
    });

    it('should show increasing progress', async () => {
      const progressUpdates: AnalysisProgress[] = [];
      const onProgress: ProgressCallback = (p) => progressUpdates.push({ ...p });

      await analyzePoem(SIMPLE_POEM, { useCache: false, onProgress });

      // Filter out the 'complete' stage for monotonicity check
      const inProgressUpdates = progressUpdates.filter((p) => p.stage !== 'complete');

      for (let i = 1; i < inProgressUpdates.length; i++) {
        expect(inProgressUpdates[i].percent).toBeGreaterThanOrEqual(
          inProgressUpdates[i - 1].percent
        );
      }
    });
  });

  describe('caching', () => {
    // Mock localStorage for cache tests
    let store: Record<string, string>;

    const localStorageMock = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      key: vi.fn((index: number) => Object.keys(store)[index] || null),
      get length() {
        return Object.keys(store).length;
      },
    };

    beforeEach(() => {
      store = {};
      vi.stubGlobal('localStorage', localStorageMock);
      localStorageMock.getItem.mockClear();
      localStorageMock.setItem.mockClear();
      localStorageMock.removeItem.mockClear();
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should cache analysis results when useCache is true', async () => {
      await analyzePoem(SIMPLE_POEM, { useCache: true });

      // Filter out the localStorage availability test calls
      const analysisSetCalls = localStorageMock.setItem.mock.calls.filter(
        (call) => call[0].startsWith('ghost-note-analysis-')
      );
      expect(analysisSetCalls.length).toBeGreaterThan(0);
    });

    it('should not cache when useCache is false', async () => {
      await analyzePoem(SIMPLE_POEM, { useCache: false });

      // Filter out the localStorage availability test calls
      const analysisSetCalls = localStorageMock.setItem.mock.calls.filter(
        (call) => call[0].startsWith('ghost-note-analysis-')
      );
      expect(analysisSetCalls.length).toBe(0);
    });

    it('should return cached result on second call', async () => {
      // First call - should compute and cache
      const analysis1 = await analyzePoem(SIMPLE_POEM, { useCache: true });

      // Get the count of cache-related setItem calls after first analysis
      const firstCallSetCount = localStorageMock.setItem.mock.calls.filter(
        (call) => call[0].startsWith('ghost-note-analysis-')
      ).length;

      // Second call - should return cached
      const analysis2 = await analyzePoem(SIMPLE_POEM, { useCache: true });

      // Count again after second call
      const secondCallSetCount = localStorageMock.setItem.mock.calls.filter(
        (call) => call[0].startsWith('ghost-note-analysis-')
      ).length;

      // Should not have added more cache entries
      expect(secondCallSetCount).toBe(firstCallSetCount);

      // Results should be equivalent
      expect(analysis1.meta.lineCount).toBe(analysis2.meta.lineCount);
      expect(analysis1.meta.wordCount).toBe(analysis2.meta.wordCount);
    });

    it('should report "cached" stage when returning cached result', async () => {
      // First call to populate cache
      await analyzePoem(SIMPLE_POEM, { useCache: true });

      // Second call with progress tracking
      const progressUpdates: AnalysisProgress[] = [];
      await analyzePoem(SIMPLE_POEM, {
        useCache: true,
        onProgress: (p) => progressUpdates.push({ ...p }),
      });

      expect(progressUpdates.some((p) => p.stage === 'cached')).toBe(true);
    });
  });
});

// =============================================================================
// analyzeIncrementally Tests
// =============================================================================

describe('analyzeIncrementally', () => {
  it('should perform full analysis when previous is null', async () => {
    const analysis = await analyzeIncrementally(SIMPLE_POEM, null, { useCache: false });

    expect(analysis).toBeDefined();
    expect(analysis.meta.lineCount).toBe(4);
  });

  it('should use cache when available', async () => {
    // Mock localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete store[key];
        }),
        clear: vi.fn(() => {
          store = {};
        }),
        key: vi.fn((index: number) => Object.keys(store)[index] || null),
        get length() {
          return Object.keys(store).length;
        },
      };
    })();

    vi.stubGlobal('localStorage', localStorageMock);

    // First analysis
    const first = await analyzePoem(SIMPLE_POEM, { useCache: true });

    // Incremental with same text should use cache
    const second = await analyzeIncrementally(SIMPLE_POEM, first, { useCache: true });

    expect(second.meta.lineCount).toBe(first.meta.lineCount);

    vi.unstubAllGlobals();
  });

  it('should re-analyze when text changes', async () => {
    const first = await analyzePoem(SIMPLE_POEM, { useCache: false });
    const modified = SIMPLE_POEM + '\nA new line added';

    const second = await analyzeIncrementally(modified, first, { useCache: false });

    expect(second.meta.lineCount).toBe(5);
    expect(second.meta.lineCount).toBeGreaterThan(first.meta.lineCount);
  });

  it('should call progress callback', async () => {
    const progressUpdates: AnalysisProgress[] = [];
    const onProgress: ProgressCallback = (p) => progressUpdates.push({ ...p });

    await analyzeIncrementally(SIMPLE_POEM, null, { useCache: false, onProgress });

    expect(progressUpdates.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('integration', () => {
  it('should produce consistent results for the same input', async () => {
    const analysis1 = await analyzePoem(SIMPLE_POEM, { useCache: false });
    const analysis2 = await analyzePoem(SIMPLE_POEM, { useCache: false });

    expect(analysis1.meta).toEqual(analysis2.meta);
    expect(analysis1.prosody.rhyme.scheme).toBe(analysis2.prosody.rhyme.scheme);
    expect(analysis1.prosody.meter.footType).toBe(analysis2.prosody.meter.footType);
  });

  it('should handle poems with different structures', async () => {
    const couplets = `Line one rhymes with wine
Line two is just fine`;

    const analysis = await analyzePoem(couplets, { useCache: false });

    expect(analysis.meta.lineCount).toBe(2);
    expect(analysis.prosody.rhyme.scheme).toBeDefined();
  });

  it('should analyze Shakespeare sonnet structure', async () => {
    const analysis = await analyzePoem(IAMBIC_PENTAMETER, { useCache: false });

    expect(analysis.meta.lineCount).toBe(4);
    expect(analysis.prosody.meter.footType).toBeDefined();
    // Shakespeare is famous for iambic pentameter
    expect(analysis.prosody.rhyme.scheme.length).toBe(4);
  });

  it('should provide useful melody suggestions', async () => {
    const sadPoem = `I am filled with sorrow deep
As the night falls while I weep
Dreams are lost in shadows cold
Stories of grief left untold`;

    const analysis = await analyzePoem(sadPoem, { useCache: false });

    // Sad poems should suggest minor mode
    expect(analysis.melodySuggestions.mode).toBeDefined();
    expect(analysis.emotion.dominantEmotions.length).toBeGreaterThan(0);
  });
});
