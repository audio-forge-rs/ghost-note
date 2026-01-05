/**
 * Tests for Ghost Note Poem Analysis Types
 *
 * @module types/analysis.test
 */

import { describe, it, expect } from 'vitest';
import type {
  StressLevel,
  RhymeType,
  Severity,
  MusicalMode,
  VocalRegister,
  TimeSignature,
  ProblemType,
  Syllable,
  SyllabifiedWord,
  RhymeGroup,
  InternalRhyme,
  SingabilityProblem,
  EmotionalArcEntry,
  AnalyzedStanza,
  ProblemReport,
  MelodySuggestions,
  PoemAnalysis,
} from './analysis';
import {
  createDefaultSyllable,
  createDefaultSyllabifiedWord,
  createDefaultSingabilityScore,
  createDefaultAnalyzedLine,
  createDefaultAnalyzedStanza,
  createDefaultMeterAnalysis,
  createDefaultRhymeAnalysis,
  createDefaultProsodyAnalysis,
  createDefaultSuggestedMusicParams,
  createDefaultEmotionalAnalysis,
  createDefaultMetaInfo,
  createDefaultStructuredPoem,
  createDefaultMelodySuggestions,
  createDefaultPoemAnalysis,
  serializePoemAnalysis,
  deserializePoemAnalysis,
  isPoemAnalysis,
  clonePoemAnalysis,
  mergePoemAnalysis,
} from './analysis';

// =============================================================================
// Type Literal Tests (compile-time verification)
// =============================================================================

describe('Type Literals', () => {
  describe('StressLevel', () => {
    it('accepts valid stress levels', () => {
      const unstressed: StressLevel = 0;
      const primary: StressLevel = 1;
      const secondary: StressLevel = 2;
      expect([unstressed, primary, secondary]).toEqual([0, 1, 2]);
    });
  });

  describe('RhymeType', () => {
    it('accepts valid rhyme types', () => {
      const types: RhymeType[] = ['perfect', 'slant', 'assonance', 'consonance'];
      expect(types).toHaveLength(4);
    });
  });

  describe('Severity', () => {
    it('accepts valid severity levels', () => {
      const levels: Severity[] = ['low', 'medium', 'high'];
      expect(levels).toHaveLength(3);
    });
  });

  describe('MusicalMode', () => {
    it('accepts major and minor modes', () => {
      const modes: MusicalMode[] = ['major', 'minor'];
      expect(modes).toHaveLength(2);
    });
  });

  describe('VocalRegister', () => {
    it('accepts valid vocal registers', () => {
      const registers: VocalRegister[] = ['low', 'middle', 'high', 'varied'];
      expect(registers).toHaveLength(4);
    });
  });

  describe('TimeSignature', () => {
    it('accepts valid time signatures', () => {
      const signatures: TimeSignature[] = ['4/4', '3/4', '6/8', '2/4'];
      expect(signatures).toHaveLength(4);
    });
  });

  describe('ProblemType', () => {
    it('accepts valid problem types', () => {
      const types: ProblemType[] = [
        'stress_mismatch',
        'syllable_variance',
        'singability',
        'rhyme_break',
      ];
      expect(types).toHaveLength(4);
    });
  });
});

// =============================================================================
// Factory Function Tests
// =============================================================================

describe('Factory Functions', () => {
  describe('createDefaultSyllable', () => {
    it('creates a syllable with default values', () => {
      const syllable = createDefaultSyllable();
      expect(syllable).toEqual({
        phonemes: [],
        stress: 0,
        vowelPhoneme: '',
        isOpen: false,
      });
    });

    it('creates independent instances', () => {
      const s1 = createDefaultSyllable();
      const s2 = createDefaultSyllable();
      s1.phonemes.push('AA1');
      expect(s2.phonemes).toEqual([]);
    });
  });

  describe('createDefaultSyllabifiedWord', () => {
    it('creates a word with empty text by default', () => {
      const word = createDefaultSyllabifiedWord();
      expect(word).toEqual({
        text: '',
        syllables: [],
      });
    });

    it('creates a word with provided text', () => {
      const word = createDefaultSyllabifiedWord('hello');
      expect(word.text).toBe('hello');
      expect(word.syllables).toEqual([]);
    });
  });

  describe('createDefaultSingabilityScore', () => {
    it('creates a singability score with defaults', () => {
      const score = createDefaultSingabilityScore();
      expect(score).toEqual({
        syllableScores: [],
        lineScore: 0,
        problemSpots: [],
      });
    });
  });

  describe('createDefaultAnalyzedLine', () => {
    it('creates an analyzed line with empty text', () => {
      const line = createDefaultAnalyzedLine();
      expect(line.text).toBe('');
      expect(line.words).toEqual([]);
      expect(line.stressPattern).toBe('');
      expect(line.syllableCount).toBe(0);
      expect(line.singability.lineScore).toBe(0);
    });

    it('creates an analyzed line with provided text', () => {
      const line = createDefaultAnalyzedLine('Hello world');
      expect(line.text).toBe('Hello world');
    });
  });

  describe('createDefaultAnalyzedStanza', () => {
    it('creates an empty stanza', () => {
      const stanza = createDefaultAnalyzedStanza();
      expect(stanza).toEqual({
        lines: [],
      });
    });
  });

  describe('createDefaultMeterAnalysis', () => {
    it('creates meter analysis with default values', () => {
      const meter = createDefaultMeterAnalysis();
      expect(meter).toEqual({
        pattern: '',
        detectedMeter: 'irregular',
        footType: 'unknown',
        feetPerLine: 0,
        confidence: 0,
        deviations: [],
      });
    });
  });

  describe('createDefaultRhymeAnalysis', () => {
    it('creates rhyme analysis with empty values', () => {
      const rhyme = createDefaultRhymeAnalysis();
      expect(rhyme).toEqual({
        scheme: '',
        rhymeGroups: {},
        internalRhymes: [],
      });
    });
  });

  describe('createDefaultProsodyAnalysis', () => {
    it('creates prosody analysis with nested defaults', () => {
      const prosody = createDefaultProsodyAnalysis();
      expect(prosody.meter.detectedMeter).toBe('irregular');
      expect(prosody.rhyme.scheme).toBe('');
      expect(prosody.regularity).toBe(0);
    });
  });

  describe('createDefaultSuggestedMusicParams', () => {
    it('creates music params with sensible defaults', () => {
      const params = createDefaultSuggestedMusicParams();
      expect(params).toEqual({
        mode: 'major',
        tempoRange: [80, 120],
        register: 'middle',
      });
    });
  });

  describe('createDefaultEmotionalAnalysis', () => {
    it('creates emotional analysis with neutral values', () => {
      const emotion = createDefaultEmotionalAnalysis();
      expect(emotion.overallSentiment).toBe(0);
      expect(emotion.arousal).toBe(0.5);
      expect(emotion.dominantEmotions).toEqual([]);
      expect(emotion.emotionalArc).toEqual([]);
      expect(emotion.suggestedMusicParams.mode).toBe('major');
    });
  });

  describe('createDefaultMetaInfo', () => {
    it('creates meta info with zero counts', () => {
      const meta = createDefaultMetaInfo();
      expect(meta).toEqual({
        title: undefined,
        lineCount: 0,
        stanzaCount: 0,
        wordCount: 0,
        syllableCount: 0,
      });
    });
  });

  describe('createDefaultStructuredPoem', () => {
    it('creates empty structured poem', () => {
      const poem = createDefaultStructuredPoem();
      expect(poem).toEqual({
        stanzas: [],
      });
    });
  });

  describe('createDefaultMelodySuggestions', () => {
    it('creates melody suggestions with defaults', () => {
      const suggestions = createDefaultMelodySuggestions();
      expect(suggestions).toEqual({
        timeSignature: '4/4',
        tempo: 100,
        key: 'C',
        mode: 'major',
        phraseBreaks: [],
      });
    });
  });

  describe('createDefaultPoemAnalysis', () => {
    it('creates a complete default analysis', () => {
      const analysis = createDefaultPoemAnalysis();

      expect(analysis.meta.lineCount).toBe(0);
      expect(analysis.structure.stanzas).toEqual([]);
      expect(analysis.prosody.regularity).toBe(0);
      expect(analysis.emotion.overallSentiment).toBe(0);
      expect(analysis.problems).toEqual([]);
      expect(analysis.melodySuggestions.tempo).toBe(100);
    });

    it('creates independent instances', () => {
      const a1 = createDefaultPoemAnalysis();
      const a2 = createDefaultPoemAnalysis();

      a1.meta.lineCount = 10;
      a1.problems.push({
        line: 1,
        position: 0,
        type: 'stress_mismatch',
        severity: 'low',
        description: 'test',
      });

      expect(a2.meta.lineCount).toBe(0);
      expect(a2.problems).toEqual([]);
    });
  });
});

// =============================================================================
// Serialization Helper Tests
// =============================================================================

describe('Serialization Helpers', () => {
  describe('serializePoemAnalysis', () => {
    it('serializes to compact JSON by default', () => {
      const analysis = createDefaultPoemAnalysis();
      const json = serializePoemAnalysis(analysis);

      expect(json).not.toContain('\n');
      expect(json).not.toContain('  ');
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('serializes to pretty JSON when requested', () => {
      const analysis = createDefaultPoemAnalysis();
      const json = serializePoemAnalysis(analysis, true);

      expect(json).toContain('\n');
      expect(json).toContain('  ');
    });

    it('preserves all data during serialization', () => {
      const analysis = createDefaultPoemAnalysis();
      analysis.meta.title = 'Test Poem';
      analysis.meta.lineCount = 8;
      analysis.melodySuggestions.key = 'Am';

      const json = serializePoemAnalysis(analysis);
      const parsed = JSON.parse(json);

      expect(parsed.meta.title).toBe('Test Poem');
      expect(parsed.meta.lineCount).toBe(8);
      expect(parsed.melodySuggestions.key).toBe('Am');
    });
  });

  describe('deserializePoemAnalysis', () => {
    it('deserializes valid JSON', () => {
      const original = createDefaultPoemAnalysis();
      original.meta.title = 'My Poem';
      const json = serializePoemAnalysis(original);

      const restored = deserializePoemAnalysis(json);
      expect(restored.meta.title).toBe('My Poem');
    });

    it('throws on invalid JSON', () => {
      expect(() => deserializePoemAnalysis('not json')).toThrow();
    });

    it('throws on missing required properties', () => {
      const incomplete = JSON.stringify({ meta: {} });
      expect(() => deserializePoemAnalysis(incomplete)).toThrow(
        "missing required property 'structure'"
      );
    });

    it('throws on missing each required property', () => {
      const baseObj = {
        meta: {},
        structure: {},
        prosody: {},
        emotion: {},
        form: {},
        problems: [],
        melodySuggestions: {},
      };

      const requiredProps = [
        'meta',
        'structure',
        'prosody',
        'emotion',
        'form',
        'problems',
        'melodySuggestions',
      ];

      for (const prop of requiredProps) {
        const incomplete = { ...baseObj };
        delete (incomplete as Record<string, unknown>)[prop];
        expect(() => deserializePoemAnalysis(JSON.stringify(incomplete))).toThrow(
          `missing required property '${prop}'`
        );
      }
    });
  });

  describe('isPoemAnalysis', () => {
    it('returns true for valid PoemAnalysis objects', () => {
      const analysis = createDefaultPoemAnalysis();
      expect(isPoemAnalysis(analysis)).toBe(true);
    });

    it('returns false for null', () => {
      expect(isPoemAnalysis(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isPoemAnalysis(undefined)).toBe(false);
    });

    it('returns false for non-objects', () => {
      expect(isPoemAnalysis('string')).toBe(false);
      expect(isPoemAnalysis(123)).toBe(false);
      expect(isPoemAnalysis(true)).toBe(false);
      expect(isPoemAnalysis([])).toBe(false);
    });

    it('returns false for objects missing required properties', () => {
      expect(isPoemAnalysis({})).toBe(false);
      expect(isPoemAnalysis({ meta: {} })).toBe(false);
      expect(
        isPoemAnalysis({
          meta: {},
          structure: {},
          prosody: {},
          emotion: {},
          // missing problems and melodySuggestions
        })
      ).toBe(false);
    });

    it('returns false when problems is not an array', () => {
      expect(
        isPoemAnalysis({
          meta: {},
          structure: {},
          prosody: {},
          emotion: {},
          problems: 'not an array',
          melodySuggestions: {},
        })
      ).toBe(false);
    });
  });

  describe('clonePoemAnalysis', () => {
    it('creates a deep copy', () => {
      const original = createDefaultPoemAnalysis();
      original.meta.title = 'Original';
      original.problems.push({
        line: 1,
        position: 0,
        type: 'singability',
        severity: 'high',
        description: 'Test problem',
      });

      const clone = clonePoemAnalysis(original);

      // Verify values are equal
      expect(clone.meta.title).toBe('Original');
      expect(clone.problems).toHaveLength(1);

      // Verify it's a deep copy (modifications don't affect original)
      clone.meta.title = 'Modified';
      clone.problems[0].description = 'Modified problem';

      expect(original.meta.title).toBe('Original');
      expect(original.problems[0].description).toBe('Test problem');
    });

    it('handles nested objects correctly', () => {
      const original = createDefaultPoemAnalysis();
      original.structure.stanzas.push({
        lines: [createDefaultAnalyzedLine('Line 1')],
      });

      const clone = clonePoemAnalysis(original);
      clone.structure.stanzas[0].lines[0].text = 'Modified';

      expect(original.structure.stanzas[0].lines[0].text).toBe('Line 1');
    });
  });

  describe('mergePoemAnalysis', () => {
    it('merges meta properties', () => {
      const base = createDefaultPoemAnalysis();
      const partial: Partial<PoemAnalysis> = {
        meta: { lineCount: 5, stanzaCount: 2, wordCount: 0, syllableCount: 0 },
      };

      const merged = mergePoemAnalysis(base, partial);

      expect(merged.meta.lineCount).toBe(5);
      expect(merged.meta.stanzaCount).toBe(2);
    });

    it('replaces structure entirely', () => {
      const base = createDefaultPoemAnalysis();
      const newStanza: AnalyzedStanza = {
        lines: [createDefaultAnalyzedLine('New line')],
      };
      const partial: Partial<PoemAnalysis> = {
        structure: { stanzas: [newStanza] },
      };

      const merged = mergePoemAnalysis(base, partial);

      expect(merged.structure.stanzas).toHaveLength(1);
      expect(merged.structure.stanzas[0].lines[0].text).toBe('New line');
    });

    it('merges prosody properties', () => {
      const base = createDefaultPoemAnalysis();
      const partial: Partial<PoemAnalysis> = {
        prosody: {
          meter: createDefaultMeterAnalysis(),
          rhyme: createDefaultRhymeAnalysis(),
          regularity: 0.8,
        },
      };

      const merged = mergePoemAnalysis(base, partial);

      expect(merged.prosody.regularity).toBe(0.8);
    });

    it('merges emotion properties', () => {
      const base = createDefaultPoemAnalysis();
      const partial: Partial<PoemAnalysis> = {
        emotion: {
          overallSentiment: 0.5,
          arousal: 0.7,
          dominantEmotions: ['happy'],
          emotionalArc: [],
          suggestedMusicParams: createDefaultSuggestedMusicParams(),
        },
      };

      const merged = mergePoemAnalysis(base, partial);

      expect(merged.emotion.overallSentiment).toBe(0.5);
      expect(merged.emotion.dominantEmotions).toEqual(['happy']);
    });

    it('replaces problems array', () => {
      const base = createDefaultPoemAnalysis();
      base.problems.push({
        line: 0,
        position: 0,
        type: 'singability',
        severity: 'low',
        description: 'Old problem',
      });

      const partial: Partial<PoemAnalysis> = {
        problems: [
          {
            line: 1,
            position: 5,
            type: 'rhyme_break',
            severity: 'high',
            description: 'New problem',
          },
        ],
      };

      const merged = mergePoemAnalysis(base, partial);

      expect(merged.problems).toHaveLength(1);
      expect(merged.problems[0].description).toBe('New problem');
    });

    it('merges melodySuggestions properties', () => {
      const base = createDefaultPoemAnalysis();
      const partial: Partial<PoemAnalysis> = {
        melodySuggestions: {
          timeSignature: '3/4',
          tempo: 80,
          key: 'G',
          mode: 'minor',
          phraseBreaks: [2, 4],
        },
      };

      const merged = mergePoemAnalysis(base, partial);

      expect(merged.melodySuggestions.timeSignature).toBe('3/4');
      expect(merged.melodySuggestions.tempo).toBe(80);
      expect(merged.melodySuggestions.key).toBe('G');
      expect(merged.melodySuggestions.mode).toBe('minor');
    });

    it('does not mutate original objects', () => {
      const base = createDefaultPoemAnalysis();
      base.meta.title = 'Original';

      const partial: Partial<PoemAnalysis> = {
        meta: { title: 'New', lineCount: 10, stanzaCount: 0, wordCount: 0, syllableCount: 0 },
      };

      mergePoemAnalysis(base, partial);

      expect(base.meta.title).toBe('Original');
      expect(base.meta.lineCount).toBe(0);
    });
  });
});

// =============================================================================
// Interface Structure Tests
// =============================================================================

describe('Interface Structures', () => {
  describe('Syllable', () => {
    it('can be constructed with all properties', () => {
      const syllable: Syllable = {
        phonemes: ['HH', 'EH1', 'L'],
        stress: 1,
        vowelPhoneme: 'EH1',
        isOpen: false,
      };

      expect(syllable.phonemes).toHaveLength(3);
      expect(syllable.stress).toBe(1);
      expect(syllable.vowelPhoneme).toBe('EH1');
      expect(syllable.isOpen).toBe(false);
    });
  });

  describe('SyllabifiedWord', () => {
    it('can contain multiple syllables', () => {
      const word: SyllabifiedWord = {
        text: 'hello',
        syllables: [
          { phonemes: ['HH', 'AH0'], stress: 0, vowelPhoneme: 'AH0', isOpen: false },
          { phonemes: ['L', 'OW1'], stress: 1, vowelPhoneme: 'OW1', isOpen: true },
        ],
      };

      expect(word.text).toBe('hello');
      expect(word.syllables).toHaveLength(2);
      expect(word.syllables[0].stress).toBe(0);
      expect(word.syllables[1].stress).toBe(1);
    });
  });

  describe('RhymeGroup', () => {
    it('can represent a group of rhyming lines', () => {
      const group: RhymeGroup = {
        lines: [0, 2],
        rhymeType: 'perfect',
        endWords: ['day', 'away'],
      };

      expect(group.lines).toEqual([0, 2]);
      expect(group.rhymeType).toBe('perfect');
      expect(group.endWords).toHaveLength(2);
    });
  });

  describe('InternalRhyme', () => {
    it('can represent internal rhyme positions', () => {
      const internal: InternalRhyme = {
        line: 0,
        positions: [2, 5],
      };

      expect(internal.line).toBe(0);
      expect(internal.positions).toEqual([2, 5]);
    });
  });

  describe('SingabilityProblem', () => {
    it('can represent a singability issue', () => {
      const problem: SingabilityProblem = {
        position: 3,
        issue: 'consonant cluster',
        severity: 'medium',
      };

      expect(problem.position).toBe(3);
      expect(problem.issue).toBe('consonant cluster');
      expect(problem.severity).toBe('medium');
    });
  });

  describe('EmotionalArcEntry', () => {
    it('can represent a stanza emotional analysis', () => {
      const entry: EmotionalArcEntry = {
        stanza: 0,
        sentiment: -0.3,
        keywords: ['sorrow', 'tears'],
      };

      expect(entry.stanza).toBe(0);
      expect(entry.sentiment).toBe(-0.3);
      expect(entry.keywords).toContain('sorrow');
    });
  });

  describe('ProblemReport', () => {
    it('can include optional suggestedFix', () => {
      const withFix: ProblemReport = {
        line: 2,
        position: 5,
        type: 'stress_mismatch',
        severity: 'high',
        description: 'Stress falls on wrong syllable',
        suggestedFix: 'Consider using "upon" instead of "on"',
      };

      const withoutFix: ProblemReport = {
        line: 3,
        position: 0,
        type: 'syllable_variance',
        severity: 'low',
        description: 'Line has unusual syllable count',
      };

      expect(withFix.suggestedFix).toBeDefined();
      expect(withoutFix.suggestedFix).toBeUndefined();
    });
  });

  describe('MelodySuggestions', () => {
    it('can represent complete melody suggestions', () => {
      const suggestions: MelodySuggestions = {
        timeSignature: '6/8',
        tempo: 72,
        key: 'Em',
        mode: 'minor',
        phraseBreaks: [4, 8, 12, 16],
      };

      expect(suggestions.timeSignature).toBe('6/8');
      expect(suggestions.tempo).toBe(72);
      expect(suggestions.key).toBe('Em');
      expect(suggestions.mode).toBe('minor');
      expect(suggestions.phraseBreaks).toHaveLength(4);
    });
  });
});

// =============================================================================
// Complete Analysis Construction Tests
// =============================================================================

describe('Complete PoemAnalysis Construction', () => {
  it('can construct a full analysis for a simple poem', () => {
    const analysis: PoemAnalysis = {
      meta: {
        title: 'Roses are Red',
        lineCount: 4,
        stanzaCount: 1,
        wordCount: 12,
        syllableCount: 16,
      },
      structure: {
        stanzas: [
          {
            lines: [
              {
                text: 'Roses are red',
                words: [
                  {
                    text: 'Roses',
                    syllables: [
                      { phonemes: ['R', 'OW1'], stress: 1, vowelPhoneme: 'OW1', isOpen: true },
                      { phonemes: ['Z', 'AH0', 'Z'], stress: 0, vowelPhoneme: 'AH0', isOpen: false },
                    ],
                  },
                  {
                    text: 'are',
                    syllables: [
                      { phonemes: ['AA1', 'R'], stress: 1, vowelPhoneme: 'AA1', isOpen: false },
                    ],
                  },
                  {
                    text: 'red',
                    syllables: [
                      { phonemes: ['R', 'EH1', 'D'], stress: 1, vowelPhoneme: 'EH1', isOpen: false },
                    ],
                  },
                ],
                stressPattern: '1011',
                syllableCount: 4,
                singability: {
                  syllableScores: [0.9, 0.7, 0.8, 0.6],
                  lineScore: 0.75,
                  problemSpots: [],
                },
              },
            ],
          },
        ],
      },
      prosody: {
        meter: {
          pattern: '10111011',
          detectedMeter: 'trochaic',
          footType: 'trochee',
          feetPerLine: 2,
          confidence: 0.7,
          deviations: [],
        },
        rhyme: {
          scheme: 'ABAB',
          rhymeGroups: {
            A: { lines: [0, 2], rhymeType: 'perfect', endWords: ['red', 'head'] },
            B: { lines: [1, 3], rhymeType: 'perfect', endWords: ['blue', 'you'] },
          },
          internalRhymes: [],
        },
        regularity: 0.85,
      },
      emotion: {
        overallSentiment: 0.7,
        arousal: 0.5,
        dominantEmotions: ['love', 'happy'],
        emotionalArc: [
          { stanza: 0, sentiment: 0.7, keywords: ['love', 'sweet'] },
        ],
        suggestedMusicParams: {
          mode: 'major',
          tempoRange: [100, 120],
          register: 'middle',
        },
      },
      form: {
        formType: 'quatrain',
        formName: 'Quatrain',
        category: 'stanzaic',
        confidence: 0.75,
        evidence: {
          lineCountMatch: true,
          stanzaStructureMatch: true,
          meterMatch: true,
          rhymeSchemeMatch: true,
          syllablePatternMatch: false,
          notes: ['Has 4 lines', 'Has ABAB rhyme pattern'],
        },
        alternatives: [],
        description: 'A poem composed of four-line stanzas.',
      },
      problems: [],
      melodySuggestions: {
        timeSignature: '4/4',
        tempo: 110,
        key: 'C',
        mode: 'major',
        phraseBreaks: [2, 4],
      },
    };

    // Verify the complete structure
    expect(analysis.meta.title).toBe('Roses are Red');
    expect(analysis.structure.stanzas).toHaveLength(1);
    expect(analysis.structure.stanzas[0].lines[0].words).toHaveLength(3);
    expect(analysis.prosody.rhyme.scheme).toBe('ABAB');
    expect(analysis.emotion.dominantEmotions).toContain('love');
    expect(analysis.problems).toHaveLength(0);
    expect(analysis.melodySuggestions.key).toBe('C');
  });

  it('can construct analysis with problems', () => {
    const analysis = createDefaultPoemAnalysis();
    analysis.problems = [
      {
        line: 2,
        position: 4,
        type: 'stress_mismatch',
        severity: 'medium',
        description: 'Natural word stress conflicts with metrical pattern',
        suggestedFix: 'Consider reordering "never ending" to "unending"',
      },
      {
        line: 5,
        position: 0,
        type: 'singability',
        severity: 'high',
        description: 'Consonant cluster "strengths" difficult to sing',
      },
      {
        line: 8,
        position: 7,
        type: 'rhyme_break',
        severity: 'low',
        description: 'Expected rhyme with line 6, but "ocean" and "motion" are slant rhyme',
      },
    ];

    expect(analysis.problems).toHaveLength(3);
    expect(analysis.problems[0].suggestedFix).toBeDefined();
    expect(analysis.problems[1].suggestedFix).toBeUndefined();
  });
});

// =============================================================================
// Round-trip Serialization Tests
// =============================================================================

describe('Round-trip Serialization', () => {
  it('preserves all data through serialization round-trip', () => {
    const original = createDefaultPoemAnalysis();
    original.meta.title = 'Test Poem';
    original.meta.lineCount = 12;
    original.prosody.meter.detectedMeter = 'iambic_pentameter';
    original.prosody.meter.confidence = 0.92;
    original.emotion.overallSentiment = -0.3;
    original.emotion.dominantEmotions = ['melancholy', 'longing'];
    original.problems.push({
      line: 3,
      position: 2,
      type: 'syllable_variance',
      severity: 'medium',
      description: 'Test problem',
      suggestedFix: 'Test fix',
    });
    original.melodySuggestions.key = 'Dm';
    original.melodySuggestions.mode = 'minor';

    const json = serializePoemAnalysis(original, true);
    const restored = deserializePoemAnalysis(json);

    expect(restored.meta.title).toBe(original.meta.title);
    expect(restored.meta.lineCount).toBe(original.meta.lineCount);
    expect(restored.prosody.meter.detectedMeter).toBe(original.prosody.meter.detectedMeter);
    expect(restored.prosody.meter.confidence).toBe(original.prosody.meter.confidence);
    expect(restored.emotion.overallSentiment).toBe(original.emotion.overallSentiment);
    expect(restored.emotion.dominantEmotions).toEqual(original.emotion.dominantEmotions);
    expect(restored.problems).toEqual(original.problems);
    expect(restored.melodySuggestions.key).toBe(original.melodySuggestions.key);
    expect(restored.melodySuggestions.mode).toBe(original.melodySuggestions.mode);
  });

  it('handles complex nested structures', () => {
    const original = createDefaultPoemAnalysis();
    original.structure.stanzas = [
      {
        lines: [
          {
            text: 'First line',
            words: [
              {
                text: 'First',
                syllables: [
                  { phonemes: ['F', 'ER1', 'S', 'T'], stress: 1, vowelPhoneme: 'ER1', isOpen: false },
                ],
              },
            ],
            stressPattern: '1',
            syllableCount: 1,
            singability: {
              syllableScores: [0.5],
              lineScore: 0.5,
              problemSpots: [{ position: 0, issue: 'closed syllable', severity: 'low' }],
            },
          },
        ],
      },
    ];

    const json = serializePoemAnalysis(original);
    const restored = deserializePoemAnalysis(json);

    expect(restored.structure.stanzas[0].lines[0].words[0].syllables[0].phonemes).toEqual([
      'F',
      'ER1',
      'S',
      'T',
    ]);
    expect(restored.structure.stanzas[0].lines[0].singability.problemSpots[0].issue).toBe(
      'closed syllable'
    );
  });
});
