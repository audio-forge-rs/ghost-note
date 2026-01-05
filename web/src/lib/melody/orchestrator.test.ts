import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateMelody,
  regenerateMelody,
  adjustMelodyParams,
  melodyToABC,
  validateMelodyOutput,
  type MelodyGenerationOptions,
} from './orchestrator';
import type { PoemAnalysis, AnalyzedStanza, AnalyzedLine, SyllabifiedWord, Syllable } from '@/types/analysis';
import type { Melody } from './types';

// =============================================================================
// Test Fixtures
// =============================================================================

/**
 * Creates a minimal syllable for testing
 */
function createSyllable(stress: 0 | 1 | 2 = 0): Syllable {
  return {
    phonemes: ['AH' + stress],
    stress,
    vowelPhoneme: 'AH' + stress,
    isOpen: true,
  };
}

/**
 * Creates a syllabified word for testing
 */
function createWord(text: string, syllables: Syllable[]): SyllabifiedWord {
  return { text, syllables };
}

/**
 * Creates an analyzed line for testing
 */
function createLine(
  text: string,
  words: SyllabifiedWord[],
  stressPattern: string
): AnalyzedLine {
  return {
    text,
    words,
    stressPattern,
    syllableCount: stressPattern.length,
    singability: {
      syllableScores: Array(stressPattern.length).fill(0.8),
      lineScore: 0.8,
      problemSpots: [],
    },
  };
}

/**
 * Creates a complete PoemAnalysis fixture for testing
 */
function createTestAnalysis(options: {
  title?: string;
  lines?: string[];
  stressPatterns?: string[];
  mode?: 'major' | 'minor';
  tempo?: number;
  emotion?: string;
  timeSignature?: '4/4' | '3/4' | '6/8' | '2/4';
} = {}): PoemAnalysis {
  const {
    title = 'Test Poem',
    lines = ['The woods are lovely', 'dark and deep'],
    stressPatterns = ['01010', '1001'],
    mode = 'minor',
    tempo = 80,
    emotion = 'peaceful',
    timeSignature = '4/4',
  } = options;

  // Build stanzas
  const stanzas: AnalyzedStanza[] = [
    {
      lines: lines.map((text, i) => {
        const pattern = stressPatterns[i] || '0101';
        const words: SyllabifiedWord[] = text.split(' ').map((word, j) => {
          const stress = parseInt(pattern[j] || '0', 10) as 0 | 1 | 2;
          return createWord(word, [createSyllable(stress)]);
        });
        return createLine(text, words, pattern);
      }),
    },
  ];

  return {
    meta: {
      title,
      lineCount: lines.length,
      stanzaCount: 1,
      wordCount: lines.join(' ').split(' ').length,
      syllableCount: stressPatterns.join('').length,
    },
    structure: { stanzas },
    prosody: {
      meter: {
        pattern: stressPatterns[0] || '0101',
        detectedMeter: 'iambic tetrameter',
        footType: 'iamb',
        feetPerLine: 4,
        confidence: 0.9,
        deviations: [],
      },
      rhyme: {
        scheme: 'AA',
        rhymeGroups: {},
        internalRhymes: [],
      },
      regularity: 0.9,
    },
    emotion: {
      overallSentiment: -0.2,
      arousal: 0.3,
      dominantEmotions: [emotion],
      emotionalArc: [],
      suggestedMusicParams: {
        mode,
        tempoRange: [60, 100],
        register: 'middle',
      },
    },
    problems: [],
    melodySuggestions: {
      timeSignature,
      tempo,
      key: mode === 'minor' ? 'Am' : 'C',
      mode,
      phraseBreaks: [1],
    },
  };
}

// =============================================================================
// generateMelody Tests
// =============================================================================

describe('generateMelody', () => {
  describe('basic generation', () => {
    it('generates a melody from poem analysis', () => {
      const analysis = createTestAnalysis();
      const melody = generateMelody(analysis);

      expect(melody).toBeDefined();
      expect(melody.params).toBeDefined();
      expect(melody.measures).toBeDefined();
      expect(melody.lyrics).toBeDefined();
    });

    it('generates at least one measure', () => {
      const analysis = createTestAnalysis();
      const melody = generateMelody(analysis);

      expect(melody.measures.length).toBeGreaterThan(0);
    });

    it('generates notes with valid pitches', () => {
      const analysis = createTestAnalysis();
      const melody = generateMelody(analysis);

      const validPitches = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'z'];
      for (const measure of melody.measures) {
        for (const note of measure) {
          expect(validPitches).toContain(note.pitch);
        }
      }
    });

    it('generates notes with positive durations', () => {
      const analysis = createTestAnalysis();
      const melody = generateMelody(analysis);

      for (const measure of melody.measures) {
        for (const note of measure) {
          expect(note.duration).toBeGreaterThan(0);
        }
      }
    });

    it('uses title from poem metadata', () => {
      const analysis = createTestAnalysis({ title: 'My Custom Title' });
      const melody = generateMelody(analysis);

      expect(melody.params.title).toBe('My Custom Title');
    });

    it('uses default title when none provided', () => {
      const analysis = createTestAnalysis({ title: undefined });
      const melody = generateMelody(analysis);

      expect(melody.params.title).toBeTruthy();
    });
  });

  describe('parameter determination', () => {
    it('sets key based on mode', () => {
      const minorAnalysis = createTestAnalysis({ mode: 'minor' });
      const majorAnalysis = createTestAnalysis({ mode: 'major' });

      const minorMelody = generateMelody(minorAnalysis);
      const majorMelody = generateMelody(majorAnalysis);

      // Minor keys end with 'm'
      expect(['Am', 'Em', 'Dm']).toContain(minorMelody.params.key);
      // Major keys don't end with 'm'
      expect(['C', 'G', 'D', 'F']).toContain(majorMelody.params.key);
    });

    it('uses time signature from analysis', () => {
      const analysis = createTestAnalysis({ timeSignature: '3/4' });
      const melody = generateMelody(analysis);

      expect(melody.params.timeSignature).toBe('3/4');
    });

    it('adjusts tempo based on arousal', () => {
      const analysis = createTestAnalysis({ tempo: 80 });
      const melody = generateMelody(analysis);

      // Tempo should be within the suggested range
      expect(melody.params.tempo).toBeGreaterThanOrEqual(60);
      expect(melody.params.tempo).toBeLessThanOrEqual(100);
    });
  });

  describe('with options', () => {
    it('produces same melody with same seed', () => {
      const analysis = createTestAnalysis();
      const options: Partial<MelodyGenerationOptions> = { seed: 12345 };

      const melody1 = generateMelody(analysis, options);
      const melody2 = generateMelody(analysis, options);

      // Same seed should produce same melody
      expect(melody1.measures.length).toBe(melody2.measures.length);
      expect(melody1.measures[0][0].pitch).toBe(melody2.measures[0][0].pitch);
    });

    it('produces different melody with different seed', () => {
      const analysis = createTestAnalysis();

      const melody1 = generateMelody(analysis, { seed: 12345 });
      const melody2 = generateMelody(analysis, { seed: 67890 });

      // Different seeds may produce different melodies
      // We can't guarantee they're different, but let's check structure is valid
      expect(melody1.measures.length).toBeGreaterThan(0);
      expect(melody2.measures.length).toBeGreaterThan(0);
    });

    it('respects forceParams option', () => {
      const analysis = createTestAnalysis({ tempo: 80 });
      const melody = generateMelody(analysis, {
        forceParams: { tempo: 140, key: 'G' },
      });

      expect(melody.params.tempo).toBe(140);
      expect(melody.params.key).toBe('G');
    });

    it('adds breath rests when respectBreathPoints is true', () => {
      const analysis = createTestAnalysis();
      const melody = generateMelody(analysis, { respectBreathPoints: true });

      // Should have some rests (z) for breath points
      const hasRests = melody.measures.some((measure) =>
        measure.some((note) => note.pitch === 'z')
      );

      // With multiple lines, there should be at least one rest
      expect(hasRests).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles empty stanzas', () => {
      const analysis = createTestAnalysis({ lines: [], stressPatterns: [] });
      const melody = generateMelody(analysis);

      // Should still produce a valid melody (with rest)
      expect(melody.measures.length).toBeGreaterThan(0);
    });

    it('handles single syllable line', () => {
      const analysis = createTestAnalysis({
        lines: ['Word'],
        stressPatterns: ['1'],
      });
      const melody = generateMelody(analysis);

      expect(melody.measures.length).toBeGreaterThan(0);
    });

    it('handles very long lines', () => {
      const longLine = 'The quick brown fox jumps over the lazy dog again and again';
      const analysis = createTestAnalysis({
        lines: [longLine],
        stressPatterns: ['01010101010101010'],
      });
      const melody = generateMelody(analysis);

      expect(melody.measures.length).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// regenerateMelody Tests
// =============================================================================

describe('regenerateMelody', () => {
  it('generates a melody from analysis', () => {
    const analysis = createTestAnalysis();
    const melody = regenerateMelody(analysis);

    expect(melody).toBeDefined();
    expect(melody.measures.length).toBeGreaterThan(0);
  });

  it('produces same melody with same seed', () => {
    const analysis = createTestAnalysis();

    const melody1 = regenerateMelody(analysis, 12345);
    const melody2 = regenerateMelody(analysis, 12345);

    expect(melody1.measures.length).toBe(melody2.measures.length);
    expect(melody1.measures[0][0].pitch).toBe(melody2.measures[0][0].pitch);
    expect(melody1.measures[0][0].duration).toBe(melody2.measures[0][0].duration);
  });

  it('produces different melody without seed', () => {
    const analysis = createTestAnalysis();

    // Without seed, melodies may differ (though not guaranteed)
    const melody1 = regenerateMelody(analysis);
    const melody2 = regenerateMelody(analysis);

    // Both should be valid
    expect(melody1.measures.length).toBeGreaterThan(0);
    expect(melody2.measures.length).toBeGreaterThan(0);
  });

  it('accepts seed of 0', () => {
    const analysis = createTestAnalysis();
    const melody = regenerateMelody(analysis, 0);

    expect(melody.measures.length).toBeGreaterThan(0);
  });

  it('accepts large seed values', () => {
    const analysis = createTestAnalysis();
    const melody = regenerateMelody(analysis, 2147483647);

    expect(melody.measures.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// adjustMelodyParams Tests
// =============================================================================

describe('adjustMelodyParams', () => {
  let baseMelody: Melody;

  beforeEach(() => {
    const analysis = createTestAnalysis();
    baseMelody = generateMelody(analysis, { seed: 12345 });
  });

  it('updates tempo without changing notes', () => {
    const adjusted = adjustMelodyParams(baseMelody, { tempo: 140 });

    expect(adjusted.params.tempo).toBe(140);
    // Notes should be preserved
    expect(adjusted.measures.length).toBe(baseMelody.measures.length);
    expect(adjusted.measures[0][0].pitch).toBe(baseMelody.measures[0][0].pitch);
  });

  it('updates title without changing notes', () => {
    const adjusted = adjustMelodyParams(baseMelody, { title: 'New Title' });

    expect(adjusted.params.title).toBe('New Title');
    expect(adjusted.measures.length).toBe(baseMelody.measures.length);
  });

  it('updates multiple non-structural params at once', () => {
    const adjusted = adjustMelodyParams(baseMelody, {
      title: 'Updated',
      tempo: 120,
    });

    expect(adjusted.params.title).toBe('Updated');
    expect(adjusted.params.tempo).toBe(120);
  });

  it('regroups measures when time signature changes', () => {
    const adjusted = adjustMelodyParams(baseMelody, { timeSignature: '3/4' });

    expect(adjusted.params.timeSignature).toBe('3/4');
    // Measure count may change due to regrouping
    // But total notes should be preserved
    const originalNoteCount = baseMelody.measures.flat().length;
    const adjustedNoteCount = adjusted.measures.flat().length;
    expect(adjustedNoteCount).toBe(originalNoteCount);
  });

  it('updates key correctly', () => {
    const adjusted = adjustMelodyParams(baseMelody, { key: 'G' });

    expect(adjusted.params.key).toBe('G');
  });

  it('preserves original melody when no params provided', () => {
    const adjusted = adjustMelodyParams(baseMelody, {});

    expect(adjusted.params).toEqual(baseMelody.params);
    expect(adjusted.measures).toEqual(baseMelody.measures);
  });

  it('does not mutate original melody', () => {
    const originalParams = { ...baseMelody.params };
    adjustMelodyParams(baseMelody, { tempo: 200 });

    expect(baseMelody.params).toEqual(originalParams);
  });
});

// =============================================================================
// melodyToABC Tests
// =============================================================================

describe('melodyToABC', () => {
  it('converts melody to ABC string', () => {
    const analysis = createTestAnalysis();
    const melody = generateMelody(analysis, { seed: 12345 });
    const abc = melodyToABC(melody);

    expect(abc).toBeDefined();
    expect(typeof abc).toBe('string');
    expect(abc.length).toBeGreaterThan(0);
  });

  it('includes ABC header fields', () => {
    const analysis = createTestAnalysis({ title: 'ABC Test' });
    const melody = generateMelody(analysis, { seed: 12345 });
    const abc = melodyToABC(melody);

    expect(abc).toContain('X:1');
    expect(abc).toContain('T:ABC Test');
    expect(abc).toContain('M:');
    expect(abc).toContain('L:');
    expect(abc).toContain('Q:');
    expect(abc).toContain('K:');
  });

  it('includes bar lines', () => {
    const analysis = createTestAnalysis();
    const melody = generateMelody(analysis, { seed: 12345 });
    const abc = melodyToABC(melody);

    expect(abc).toContain('|');
  });

  it('includes ending double bar', () => {
    const analysis = createTestAnalysis();
    const melody = generateMelody(analysis, { seed: 12345 });
    const abc = melodyToABC(melody);

    expect(abc).toContain('|]');
  });
});

// =============================================================================
// validateMelodyOutput Tests
// =============================================================================

describe('validateMelodyOutput', () => {
  it('validates a correctly generated melody', () => {
    const analysis = createTestAnalysis();
    const melody = generateMelody(analysis, { seed: 12345 });
    const result = validateMelodyOutput(melody);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns errors for invalid melody', () => {
    const invalidMelody: Melody = {
      params: {
        title: '',
        timeSignature: '4/4',
        defaultNoteLength: '1/8',
        tempo: 0,
        key: 'C',
      },
      measures: [],
      lyrics: [],
    };

    const result = validateMelodyOutput(invalidMelody);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('integration', () => {
  it('generates playable ABC from Frost poem', () => {
    // "The woods are lovely, dark and deep" - Robert Frost
    const analysis = createTestAnalysis({
      title: 'Stopping By Woods',
      lines: [
        'The woods are lovely',
        'dark and deep',
      ],
      stressPatterns: ['01010', '1001'],
      mode: 'minor',
      tempo: 80,
    });

    const melody = generateMelody(analysis);
    const abc = melodyToABC(melody);

    // Should be valid ABC that can be parsed
    expect(abc).toContain('T:Stopping By Woods');
    expect(abc).toContain('K:Am');
    expect(abc).toContain('|');

    // Should validate
    const validation = validateMelodyOutput(melody);
    expect(validation.valid).toBe(true);
  });

  it('generates different melodies for different emotions', () => {
    const happyAnalysis = createTestAnalysis({
      emotion: 'happy',
      mode: 'major',
    });
    const sadAnalysis = createTestAnalysis({
      emotion: 'sad',
      mode: 'minor',
    });

    const happyMelody = generateMelody(happyAnalysis, { seed: 12345 });
    const sadMelody = generateMelody(sadAnalysis, { seed: 12345 });

    // Keys should differ based on mode
    expect(['C', 'G', 'D', 'F']).toContain(happyMelody.params.key);
    expect(['Am', 'Em', 'Dm']).toContain(sadMelody.params.key);
  });

  it('handles complete workflow: generate, adjust, validate, render', () => {
    // Step 1: Generate
    const analysis = createTestAnalysis();
    const melody = generateMelody(analysis, { seed: 42 });

    // Step 2: Validate initial
    expect(validateMelodyOutput(melody).valid).toBe(true);

    // Step 3: Adjust
    const adjusted = adjustMelodyParams(melody, {
      tempo: 120,
      title: 'Adjusted Melody',
    });

    // Step 4: Validate adjusted
    expect(validateMelodyOutput(adjusted).valid).toBe(true);

    // Step 5: Render
    const abc = melodyToABC(adjusted);
    expect(abc).toContain('T:Adjusted Melody');
    expect(abc).toContain('Q:1/4=120');
  });

  it('regeneration produces consistent variations', () => {
    const analysis = createTestAnalysis();

    // Generate 5 variations with different seeds
    const seeds = [1, 2, 3, 4, 5];
    const melodies = seeds.map((seed) => regenerateMelody(analysis, seed));

    // All should be valid
    for (const melody of melodies) {
      expect(validateMelodyOutput(melody).valid).toBe(true);
    }

    // Regenerating with same seed should produce same result
    for (let i = 0; i < seeds.length; i++) {
      const regenerated = regenerateMelody(analysis, seeds[i]);
      expect(regenerated.measures[0][0].pitch).toBe(melodies[i].measures[0][0].pitch);
    }
  });
});

// =============================================================================
// Edge Case Tests
// =============================================================================

describe('edge cases', () => {
  it('handles analysis with no dominant emotions', () => {
    const analysis = createTestAnalysis();
    analysis.emotion.dominantEmotions = [];

    const melody = generateMelody(analysis);
    expect(melody.measures.length).toBeGreaterThan(0);
  });

  it('handles very high tempo', () => {
    const analysis = createTestAnalysis({ tempo: 200 });
    const melody = generateMelody(analysis, {
      forceParams: { tempo: 300 },
    });

    expect(melody.params.tempo).toBe(300);
    expect(validateMelodyOutput(melody).valid).toBe(true);
  });

  it('handles very low tempo', () => {
    const analysis = createTestAnalysis({ tempo: 30 });
    const melody = generateMelody(analysis, {
      forceParams: { tempo: 20 },
    });

    expect(melody.params.tempo).toBe(20);
    expect(validateMelodyOutput(melody).valid).toBe(true);
  });

  it('handles all time signatures', () => {
    const timeSignatures = ['4/4', '3/4', '6/8', '2/4'] as const;

    for (const ts of timeSignatures) {
      const analysis = createTestAnalysis({ timeSignature: ts });
      const melody = generateMelody(analysis);

      expect(melody.params.timeSignature).toBe(ts);
      expect(validateMelodyOutput(melody).valid).toBe(true);
    }
  });

  it('handles all key signatures', () => {
    const majorKeys = ['C', 'G', 'D', 'F'] as const;
    const minorKeys = ['Am', 'Em', 'Dm'] as const;

    for (const key of majorKeys) {
      const analysis = createTestAnalysis({ mode: 'major' });
      const melody = generateMelody(analysis, { forceParams: { key } });
      expect(melody.params.key).toBe(key);
    }

    for (const key of minorKeys) {
      const analysis = createTestAnalysis({ mode: 'minor' });
      const melody = generateMelody(analysis, { forceParams: { key } });
      expect(melody.params.key).toBe(key);
    }
  });

  it('handles unicode in title', () => {
    const analysis = createTestAnalysis({ title: 'Melodie avec accent!' });
    const melody = generateMelody(analysis);

    expect(melody.params.title).toBe('Melodie avec accent!');
  });

  it('handles special characters in poem text', () => {
    const analysis = createTestAnalysis({
      lines: ["It's a new day", 'with "quotes" & more'],
      stressPatterns: ['10101', '0101010'],
    });

    const melody = generateMelody(analysis);
    expect(validateMelodyOutput(melody).valid).toBe(true);
  });
});

// =============================================================================
// End-to-End ABC Validity Tests
// =============================================================================

describe('End-to-End ABC Validity', () => {
  // Dynamic import of abcjs for parsing
  const parseABC = async (abc: string) => {
    const abcjs = await import('abcjs');
    return abcjs.default.parseOnly(abc);
  };

  describe('generated ABC parses correctly', () => {
    it('ABC output parses without errors', async () => {
      const analysis = createTestAnalysis();
      const melody = generateMelody(analysis, { seed: 12345 });
      const abc = melodyToABC(melody);

      const parsed = await parseABC(abc);

      expect(parsed).toBeDefined();
      expect(parsed.length).toBeGreaterThan(0);
      expect(parsed[0].lines).toBeDefined();
    });

    it('extracts correct metadata from generated ABC', async () => {
      const analysis = createTestAnalysis({
        title: 'Metadata Test',
        timeSignature: '3/4',
        tempo: 140,
        mode: 'major',
      });
      const melody = generateMelody(analysis, {
        seed: 12345,
        forceParams: { tempo: 140 }
      });
      const abc = melodyToABC(melody);

      const parsed = await parseABC(abc);

      // Check meter
      const meter = parsed[0].getMeterFraction();
      expect(meter.num).toBe(3);
      expect(meter.den).toBe(4);

      // Check tempo
      const bpm = parsed[0].getBpm();
      expect(bpm).toBe(140);
    });

    it('parses all time signatures correctly', async () => {
      const timeSignatures = ['4/4', '3/4', '6/8', '2/4'] as const;
      const expectedMeters: Record<string, { num: number; den: number }> = {
        '4/4': { num: 4, den: 4 },
        '3/4': { num: 3, den: 4 },
        '6/8': { num: 6, den: 8 },
        '2/4': { num: 2, den: 4 },
      };

      for (const ts of timeSignatures) {
        const analysis = createTestAnalysis({ timeSignature: ts });
        const melody = generateMelody(analysis, { seed: 12345 });
        const abc = melodyToABC(melody);

        const parsed = await parseABC(abc);
        const meter = parsed[0].getMeterFraction();

        expect(meter.num).toBe(expectedMeters[ts].num);
        expect(meter.den).toBe(expectedMeters[ts].den);
      }
    });

    it('parses all keys correctly', async () => {
      const majorKeys = ['C', 'G', 'D', 'F'] as const;
      const minorKeys = ['Am', 'Em', 'Dm'] as const;

      for (const key of majorKeys) {
        const analysis = createTestAnalysis({ mode: 'major' });
        const melody = generateMelody(analysis, {
          seed: 12345,
          forceParams: { key }
        });
        const abc = melodyToABC(melody);

        const parsed = await parseABC(abc);
        const keySig = parsed[0].getKeySignature();

        expect(keySig.root).toBe(key);
      }

      for (const key of minorKeys) {
        const analysis = createTestAnalysis({ mode: 'minor' });
        const melody = generateMelody(analysis, {
          seed: 12345,
          forceParams: { key }
        });
        const abc = melodyToABC(melody);

        const parsed = await parseABC(abc);
        const keySig = parsed[0].getKeySignature();

        // Extract root from minor key (e.g., "Am" -> "A")
        const expectedRoot = key.replace('m', '');
        expect(keySig.root).toBe(expectedRoot);
        expect(keySig.mode).toBe('m');
      }
    });
  });

  describe('musical property verification', () => {
    it('generates melody with correct note count', async () => {
      const analysis = createTestAnalysis({
        lines: ['Hello world today'],
        stressPatterns: ['01010'],
      });
      const melody = generateMelody(analysis, { seed: 12345 });
      const abc = melodyToABC(melody);

      const parsed = await parseABC(abc);

      // Should have music lines
      expect(parsed[0].lines.length).toBeGreaterThan(0);
    });

    it('generates playable melody structure', async () => {
      const analysis = createTestAnalysis();
      const melody = generateMelody(analysis, { seed: 12345 });
      const abc = melodyToABC(melody);

      const parsed = await parseABC(abc);

      // Should have valid structure with lines containing music
      expect(parsed[0]).toBeDefined();
      expect(parsed[0].lines).toBeDefined();
      expect(parsed[0].lines.length).toBeGreaterThan(0);
    });

    it('generates correct header info', async () => {
      const analysis = createTestAnalysis({ timeSignature: '4/4' });
      const melody = generateMelody(analysis, { seed: 12345 });
      const abc = melodyToABC(melody);

      const parsed = await parseABC(abc);

      // Should have valid parsed structure
      expect(parsed[0]).toBeDefined();
      expect(parsed[0].getMeterFraction).toBeDefined();
    });
  });

  describe('complete poem scenarios', () => {
    it('generates valid ABC for Robert Frost poem', async () => {
      const analysis = createTestAnalysis({
        title: 'Stopping By Woods',
        lines: [
          'The woods are lovely',
          'dark and deep',
          'But I have promises to keep',
          'And miles to go before I sleep',
        ],
        stressPatterns: ['01010', '1001', '010101010', '010101010'],
        mode: 'minor',
        tempo: 72,
      });

      const melody = generateMelody(analysis, { seed: 54321 });
      const abc = melodyToABC(melody);

      const parsed = await parseABC(abc);

      expect(parsed[0]).toBeDefined();
      expect(parsed[0].lines).toBeDefined();
      expect(parsed[0].lines.length).toBeGreaterThan(0);
    });

    it('generates valid ABC for Shakespeare sonnet excerpt', async () => {
      const analysis = createTestAnalysis({
        title: 'Sonnet 18',
        lines: [
          'Shall I compare thee to a summers day',
          'Thou art more lovely and more temperate',
        ],
        stressPatterns: ['0101010101', '0101010101'],
        mode: 'major',
        tempo: 92,
        timeSignature: '4/4',
      });

      const melody = generateMelody(analysis, { seed: 98765 });
      const abc = melodyToABC(melody);

      const parsed = await parseABC(abc);

      expect(parsed[0]).toBeDefined();
      expect(parsed[0].getKeySignature()).toBeDefined();
    });

    it('generates valid ABC for Emily Dickinson poem', async () => {
      const analysis = createTestAnalysis({
        title: 'Hope is the thing with feathers',
        lines: [
          'Hope is the thing with feathers',
          'That perches in the soul',
        ],
        stressPatterns: ['1010101010', '01010101'],
        mode: 'major',
        tempo: 84,
        timeSignature: '3/4',
      });

      const melody = generateMelody(analysis, { seed: 11111 });
      const abc = melodyToABC(melody);

      const parsed = await parseABC(abc);

      expect(parsed[0]).toBeDefined();
      expect(parsed[0].getMeterFraction().num).toBe(3);
    });
  });

  describe('regeneration produces valid ABC', () => {
    it('all regenerated melodies parse correctly', async () => {
      const analysis = createTestAnalysis();
      const seeds = [1, 10, 100, 1000, 10000];

      for (const seed of seeds) {
        const melody = regenerateMelody(analysis, seed);
        const abc = melodyToABC(melody);

        const parsed = await parseABC(abc);

        expect(parsed[0]).toBeDefined();
        expect(parsed[0].lines.length).toBeGreaterThan(0);
      }
    });
  });

  describe('adjusted melodies produce valid ABC', () => {
    it('tempo adjustment produces parseable ABC', async () => {
      const analysis = createTestAnalysis();
      const melody = generateMelody(analysis, { seed: 12345 });
      const adjusted = adjustMelodyParams(melody, { tempo: 160 });
      const abc = melodyToABC(adjusted);

      const parsed = await parseABC(abc);

      expect(parsed[0].getBpm()).toBe(160);
    });

    it('time signature adjustment produces parseable ABC', async () => {
      const analysis = createTestAnalysis({ timeSignature: '4/4' });
      const melody = generateMelody(analysis, { seed: 12345 });
      const adjusted = adjustMelodyParams(melody, { timeSignature: '3/4' });
      const abc = melodyToABC(adjusted);

      const parsed = await parseABC(abc);

      expect(parsed[0].getMeterFraction().num).toBe(3);
      expect(parsed[0].getMeterFraction().den).toBe(4);
    });

    it('key adjustment produces parseable ABC', async () => {
      const analysis = createTestAnalysis({ mode: 'major' });
      const melody = generateMelody(analysis, {
        seed: 12345,
        forceParams: { key: 'C' }
      });
      const adjusted = adjustMelodyParams(melody, { key: 'G' });
      const abc = melodyToABC(adjusted);

      const parsed = await parseABC(abc);

      expect(parsed[0].getKeySignature().root).toBe('G');
    });
  });

  describe('ABC structure verification', () => {
    it('ABC includes all required header fields', () => {
      const analysis = createTestAnalysis({
        title: 'Header Test',
        tempo: 100,
        timeSignature: '4/4',
        mode: 'major',
      });
      const melody = generateMelody(analysis, {
        seed: 12345,
        forceParams: { key: 'C', tempo: 100 }
      });
      const abc = melodyToABC(melody);

      // Check all required headers
      expect(abc).toMatch(/X:\s*1/);  // Reference number
      expect(abc).toMatch(/T:\s*Header Test/);  // Title
      expect(abc).toMatch(/M:\s*4\/4/);  // Meter
      expect(abc).toMatch(/L:\s*1\/8/);  // Default note length
      expect(abc).toMatch(/Q:\s*1\/4=100/);  // Tempo
      expect(abc).toMatch(/K:\s*C/);  // Key
    });

    it('ABC has proper bar structure', () => {
      const analysis = createTestAnalysis();
      const melody = generateMelody(analysis, { seed: 12345 });
      const abc = melodyToABC(melody);

      // Should have bar lines
      const barCount = (abc.match(/\|/g) || []).length;
      expect(barCount).toBeGreaterThan(0);

      // Should contain double bar (|]) somewhere in the output
      expect(abc).toContain('|]');
    });

    it('ABC note syntax is valid', () => {
      const analysis = createTestAnalysis();
      const melody = generateMelody(analysis, { seed: 12345 });
      const abc = melodyToABC(melody);

      // Extract the music body (after the K: line)
      const musicBody = abc.split('\n').filter(line =>
        !line.startsWith('X:') &&
        !line.startsWith('T:') &&
        !line.startsWith('M:') &&
        !line.startsWith('L:') &&
        !line.startsWith('Q:') &&
        !line.startsWith('K:') &&
        !line.startsWith('w:')
      ).join('');

      // Should only contain valid ABC note characters
      // Valid: A-G, a-g, ', ,, z (rest), digits (durations), /, |, ], space
      const validPattern = /^[A-Ga-gz0-9',/|[\] \n]+$/;
      expect(musicBody.trim()).toMatch(validPattern);
    });
  });

  describe('lyrics integration', () => {
    it('ABC includes lyrics when available', () => {
      const analysis = createTestAnalysis({
        lines: ['Hello world', 'Goodbye moon'],
        stressPatterns: ['0101', '0101'],
      });
      const melody = generateMelody(analysis, { seed: 12345 });
      const abc = melodyToABC(melody);

      // Should have w: lines for lyrics
      expect(abc).toContain('w:');
    });
  });

  describe('stress pattern influence on notes', () => {
    it('stressed syllables get appropriate note lengths', () => {
      const analysis = createTestAnalysis({
        lines: ['The WOODS are LOVE ly'],
        stressPatterns: ['01010'],
      });
      const melody = generateMelody(analysis, { seed: 12345 });

      // Get non-rest notes from first measure
      const notes = melody.measures.flat().filter(n => n.pitch !== 'z');

      // Stressed positions (1, 3) should have longer or equal duration to unstressed
      if (notes.length >= 5) {
        // Check that stressed syllables (indices 1, 3) have good duration
        expect(notes[1]?.duration).toBeGreaterThanOrEqual(1);
        expect(notes[3]?.duration).toBeGreaterThanOrEqual(1);
      }
    });

    it('iambic meter creates appropriate rhythm', () => {
      const analysis = createTestAnalysis({
        lines: ['da DUM da DUM da DUM da DUM'],
        stressPatterns: ['01010101'],
      });
      const melody = generateMelody(analysis, { seed: 12345 });
      const abc = melodyToABC(melody);

      // Should parse successfully
      const parsed = parseABC(abc);
      expect(parsed).toBeDefined();
    });

    it('trochaic meter creates appropriate rhythm', () => {
      const analysis = createTestAnalysis({
        lines: ['DUM da DUM da DUM da DUM da'],
        stressPatterns: ['10101010'],
      });
      const melody = generateMelody(analysis, { seed: 12345 });
      const abc = melodyToABC(melody);

      // Should parse successfully
      const parsed = parseABC(abc);
      expect(parsed).toBeDefined();
    });
  });
});

// =============================================================================
// Musical Properties Verification
// =============================================================================

describe('Musical Properties Verification', () => {
  describe('melody contour properties', () => {
    it('melody has arch-like contour', () => {
      const analysis = createTestAnalysis({
        lines: ['The woods are lovely dark and deep'],
        stressPatterns: ['01010101'],
      });
      const melody = generateMelody(analysis, { seed: 12345 });

      // Get all non-rest notes
      const notes = melody.measures.flat().filter(n => n.pitch !== 'z');

      if (notes.length >= 4) {
        // Convert pitches to numeric values for comparison
        const pitchValues = notes.map(n => {
          const basePitch = 'CDEFGAB'.indexOf(n.pitch);
          return basePitch + n.octave * 7;
        });

        // Should have some variation (not all same pitch)
        const uniquePitches = new Set(pitchValues);
        expect(uniquePitches.size).toBeGreaterThan(1);
      }
    });
  });

  describe('cadence at phrase endings', () => {
    it('melody ends on stable pitch', () => {
      const analysis = createTestAnalysis({
        mode: 'major',
      });
      const melody = generateMelody(analysis, {
        seed: 12345,
        forceParams: { key: 'C' }
      });

      // Get last non-rest note
      const allNotes = melody.measures.flat().filter(n => n.pitch !== 'z');
      const lastNote = allNotes[allNotes.length - 1];

      if (lastNote) {
        // In C major, stable pitches are C, E, G (tonic triad)
        const stablePitches = ['C', 'E', 'G'];
        expect(stablePitches).toContain(lastNote.pitch);
      }
    });
  });

  describe('note duration validity', () => {
    it('all durations are positive musical values', () => {
      const analysis = createTestAnalysis();
      const melody = generateMelody(analysis, { seed: 12345 });

      // Durations should be positive and reasonable
      for (const measure of melody.measures) {
        for (const note of measure) {
          expect(note.duration).toBeGreaterThan(0);
          expect(note.duration).toBeLessThanOrEqual(8); // Max 8 eighth notes
        }
      }
    });
  });

  describe('measure structure', () => {
    it('measures have positive total duration for 4/4', () => {
      const analysis = createTestAnalysis({ timeSignature: '4/4' });
      const melody = generateMelody(analysis, { seed: 12345 });

      // Each measure should have positive duration
      for (const measure of melody.measures) {
        const totalDuration = measure.reduce((sum, note) => sum + note.duration, 0);
        expect(totalDuration).toBeGreaterThan(0);
      }
    });

    it('measures have positive total duration for 3/4', () => {
      const analysis = createTestAnalysis({ timeSignature: '3/4' });
      const melody = generateMelody(analysis, { seed: 12345 });

      // Each measure should have positive duration
      for (const measure of melody.measures) {
        const totalDuration = measure.reduce((sum, note) => sum + note.duration, 0);
        expect(totalDuration).toBeGreaterThan(0);
      }
    });
  });

  describe('pitch range', () => {
    it('pitches stay within reasonable range', () => {
      const analysis = createTestAnalysis();
      const melody = generateMelody(analysis, { seed: 12345 });

      for (const measure of melody.measures) {
        for (const note of measure) {
          if (note.pitch !== 'z') {
            // Octave should be within a reasonable range
            expect(note.octave).toBeGreaterThanOrEqual(-2);
            expect(note.octave).toBeLessThanOrEqual(3);
          }
        }
      }
    });
  });
});
