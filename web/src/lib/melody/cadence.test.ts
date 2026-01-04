import { describe, it, expect } from 'vitest';
import {
  generateCadence,
  determineLineEndingCadence,
  applyPhraseClosure,
  getShortCadence,
  validateCadence,
  getCadenceToTarget,
  suggestCadenceForEmotion,
  type CadenceType,
  type LinePosition,
} from './cadence';
import type { Note, KeySignature } from './types';

describe('generateCadence', () => {
  describe('perfect cadence (V→I)', () => {
    it('generates perfect cadence in C major', () => {
      const cadence = generateCadence('perfect', 'C');

      // Should have 3 notes: approach, V, I
      expect(cadence).toHaveLength(3);

      // Last note should be tonic (C)
      expect(cadence[2].pitch).toBe('C');

      // Second-to-last should be dominant (G)
      expect(cadence[1].pitch).toBe('G');

      // Final note should be longer (4)
      expect(cadence[2].duration).toBe(4);
    });

    it('generates perfect cadence in G major', () => {
      const cadence = generateCadence('perfect', 'G');

      // Last note should be tonic (G)
      expect(cadence[2].pitch).toBe('G');

      // Second-to-last should be dominant (D)
      expect(cadence[1].pitch).toBe('D');
    });

    it('generates perfect cadence in Am (minor key)', () => {
      const cadence = generateCadence('perfect', 'Am');

      // Last note should be tonic (A)
      expect(cadence[2].pitch).toBe('A');

      // Dominant should be E
      expect(cadence[1].pitch).toBe('E');
    });

    it('generates perfect cadence in all major keys', () => {
      const majorKeys: KeySignature[] = ['C', 'G', 'D', 'F'];
      const expectedTonics: Record<string, string> = {
        C: 'C',
        G: 'G',
        D: 'D',
        F: 'F',
      };

      for (const key of majorKeys) {
        const cadence = generateCadence('perfect', key);
        expect(cadence[cadence.length - 1].pitch).toBe(expectedTonics[key]);
      }
    });

    it('generates perfect cadence in all minor keys', () => {
      const minorKeys: KeySignature[] = ['Am', 'Em', 'Dm'];
      const expectedTonics: Record<string, string> = {
        Am: 'A',
        Em: 'E',
        Dm: 'D',
      };

      for (const key of minorKeys) {
        const cadence = generateCadence('perfect', key);
        expect(cadence[cadence.length - 1].pitch).toBe(expectedTonics[key]);
      }
    });
  });

  describe('half cadence (?→V)', () => {
    it('generates half cadence in C major', () => {
      const cadence = generateCadence('half', 'C');

      // Should have 3 notes
      expect(cadence).toHaveLength(3);

      // Last note should be dominant (G)
      expect(cadence[2].pitch).toBe('G');

      // Final note should have longer duration
      expect(cadence[2].duration).toBe(4);
    });

    it('generates half cadence in Am (minor)', () => {
      const cadence = generateCadence('half', 'Am');

      // Last note should be dominant (E)
      expect(cadence[2].pitch).toBe('E');
    });

    it('ends on dominant for all keys', () => {
      const expectedDominants: Record<KeySignature, string> = {
        C: 'G',
        G: 'D',
        D: 'A',
        F: 'C',
        Am: 'E',
        Em: 'B',
        Dm: 'A',
      };

      for (const [key, expectedDominant] of Object.entries(expectedDominants)) {
        const cadence = generateCadence('half', key as KeySignature);
        expect(cadence[cadence.length - 1].pitch).toBe(expectedDominant);
      }
    });
  });

  describe('deceptive cadence (V→vi)', () => {
    it('generates deceptive cadence in C major', () => {
      const cadence = generateCadence('deceptive', 'C');

      expect(cadence).toHaveLength(3);

      // Last note should be submediant (A)
      expect(cadence[2].pitch).toBe('A');

      // Second-to-last should be dominant (G)
      expect(cadence[1].pitch).toBe('G');
    });

    it('generates deceptive cadence in G major', () => {
      const cadence = generateCadence('deceptive', 'G');

      // Last note should be submediant (E)
      expect(cadence[2].pitch).toBe('E');
    });

    it('creates surprise ending', () => {
      const perfect = generateCadence('perfect', 'C');
      const deceptive = generateCadence('deceptive', 'C');

      // Both should have dominant (G) before final note
      expect(perfect[1].pitch).toBe('G');
      expect(deceptive[1].pitch).toBe('G');

      // But endings differ: C vs A
      expect(perfect[2].pitch).toBe('C');
      expect(deceptive[2].pitch).toBe('A');
    });
  });

  describe('plagal cadence (IV→I)', () => {
    it('generates plagal cadence in C major', () => {
      const cadence = generateCadence('plagal', 'C');

      expect(cadence).toHaveLength(3);

      // Last note should be tonic (C)
      expect(cadence[2].pitch).toBe('C');

      // Second-to-last should be subdominant (F)
      expect(cadence[1].pitch).toBe('F');
    });

    it('generates plagal cadence in G major', () => {
      const cadence = generateCadence('plagal', 'G');

      // Last note should be tonic (G)
      expect(cadence[2].pitch).toBe('G');

      // Subdominant is C
      expect(cadence[1].pitch).toBe('C');
    });

    it('ends on tonic like perfect cadence', () => {
      const perfect = generateCadence('perfect', 'C');
      const plagal = generateCadence('plagal', 'C');

      // Both end on tonic
      expect(perfect[2].pitch).toBe(plagal[2].pitch);
      expect(plagal[2].pitch).toBe('C');
    });
  });

  describe('octave handling', () => {
    it('respects base octave parameter', () => {
      const cadence0 = generateCadence('perfect', 'C', 0);
      const cadence1 = generateCadence('perfect', 'C', 1);

      // Octave should be offset
      expect(cadence1[2].octave).toBe(cadence0[2].octave + 1);
    });

    it('supports negative base octave', () => {
      const cadence = generateCadence('perfect', 'C', -1);

      expect(cadence[2].octave).toBe(-1);
    });
  });

  describe('unknown cadence type', () => {
    it('falls back to perfect cadence', () => {
      // Force unknown type via type assertion
      const cadence = generateCadence('unknown' as CadenceType, 'C');
      const perfect = generateCadence('perfect', 'C');

      // Should behave like perfect cadence
      expect(cadence[cadence.length - 1].pitch).toBe(perfect[perfect.length - 1].pitch);
    });
  });
});

describe('determineLineEndingCadence', () => {
  describe('final line of poem', () => {
    it('returns perfect cadence for last line of last stanza', () => {
      const position: LinePosition = {
        lineIndex: 3,
        totalLines: 4,
        isStanzaEnd: true,
        isLastStanza: true,
      };

      expect(determineLineEndingCadence(position)).toBe('perfect');
    });

    it('returns perfect for final couplet', () => {
      const position: LinePosition = {
        lineIndex: 1,
        totalLines: 2,
        isStanzaEnd: true,
        isLastStanza: true,
      };

      expect(determineLineEndingCadence(position)).toBe('perfect');
    });
  });

  describe('stanza endings', () => {
    it('returns perfect cadence for end of non-final stanza', () => {
      const position: LinePosition = {
        lineIndex: 3,
        totalLines: 4,
        isStanzaEnd: true,
        isLastStanza: false,
      };

      expect(determineLineEndingCadence(position)).toBe('perfect');
    });

    it('returns perfect for stanza end in 6-line stanza', () => {
      const position: LinePosition = {
        lineIndex: 5,
        totalLines: 6,
        isStanzaEnd: true,
        isLastStanza: false,
      };

      expect(determineLineEndingCadence(position)).toBe('perfect');
    });
  });

  describe('mid-stanza lines', () => {
    it('returns half cadence for first line of stanza', () => {
      const position: LinePosition = {
        lineIndex: 0,
        totalLines: 4,
        isStanzaEnd: false,
        isLastStanza: false,
      };

      expect(determineLineEndingCadence(position)).toBe('half');
    });

    it('returns half cadence for second line of quartet', () => {
      const position: LinePosition = {
        lineIndex: 1,
        totalLines: 4,
        isStanzaEnd: false,
        isLastStanza: false,
      };

      // Line 1 is ~50%, may get plagal
      const result = determineLineEndingCadence(position);
      expect(['half', 'plagal']).toContain(result);
    });
  });

  describe('second-to-last line (tension building)', () => {
    it('returns deceptive cadence for penultimate line in 4-line stanza', () => {
      const position: LinePosition = {
        lineIndex: 2, // 0-indexed, so this is 3rd line of 4
        totalLines: 4,
        isStanzaEnd: false,
        isLastStanza: false,
      };

      expect(determineLineEndingCadence(position)).toBe('deceptive');
    });

    it('returns deceptive for line 4 of 6-line stanza', () => {
      const position: LinePosition = {
        lineIndex: 4, // 5th line of 6
        totalLines: 6,
        isStanzaEnd: false,
        isLastStanza: false,
      };

      expect(determineLineEndingCadence(position)).toBe('deceptive');
    });
  });

  describe('couplet handling', () => {
    it('returns half for first line of couplet', () => {
      const position: LinePosition = {
        lineIndex: 0,
        totalLines: 2,
        isStanzaEnd: false,
        isLastStanza: false,
      };

      // First line of a 2-line stanza should continue
      expect(determineLineEndingCadence(position)).toBe('half');
    });
  });

  describe('three-line stanza (tercet)', () => {
    it('returns half for first line', () => {
      const position: LinePosition = {
        lineIndex: 0,
        totalLines: 3,
        isStanzaEnd: false,
        isLastStanza: false,
      };

      expect(determineLineEndingCadence(position)).toBe('half');
    });

    it('returns half or deceptive for second line', () => {
      const position: LinePosition = {
        lineIndex: 1,
        totalLines: 3,
        isStanzaEnd: false,
        isLastStanza: false,
      };

      const result = determineLineEndingCadence(position);
      // Second line of 3 is penultimate, but stanza too short for deceptive
      expect(['half', 'plagal']).toContain(result);
    });
  });

  describe('varied stanza lengths', () => {
    it('handles 8-line stanza correctly', () => {
      // Test various positions in an 8-line stanza
      const results: CadenceType[] = [];
      for (let i = 0; i < 8; i++) {
        const position: LinePosition = {
          lineIndex: i,
          totalLines: 8,
          isStanzaEnd: i === 7,
          isLastStanza: false,
        };
        results.push(determineLineEndingCadence(position));
      }

      // Last line should be perfect
      expect(results[7]).toBe('perfect');

      // Penultimate should be deceptive
      expect(results[6]).toBe('deceptive');

      // Early lines should be half or plagal
      expect(['half', 'plagal']).toContain(results[0]);
    });
  });
});

describe('applyPhraseClosure', () => {
  describe('basic functionality', () => {
    it('adds cadence notes to existing melody', () => {
      const melody: Note[] = [
        { pitch: 'C', octave: 0, duration: 2 },
        { pitch: 'E', octave: 0, duration: 2 },
        { pitch: 'G', octave: 0, duration: 2 },
      ];

      const result = applyPhraseClosure(melody, 'perfect', 'C');

      // Should have original notes plus cadence
      expect(result.length).toBeGreaterThan(melody.length);

      // Original notes should be preserved
      expect(result[0]).toEqual(melody[0]);
      expect(result[1]).toEqual(melody[1]);
      expect(result[2]).toEqual(melody[2]);
    });

    it('handles empty melody', () => {
      const result = applyPhraseClosure([], 'perfect', 'C');

      // Should just return the cadence
      expect(result.length).toBeGreaterThan(0);
      expect(result[result.length - 1].pitch).toBe('C');
    });
  });

  describe('octave matching', () => {
    it('matches octave of last melody note', () => {
      const melody: Note[] = [
        { pitch: 'E', octave: 1, duration: 2 },
      ];

      const result = applyPhraseClosure(melody, 'perfect', 'C');

      // Cadence notes should be in octave 1
      const cadenceNotes = result.slice(1);
      expect(cadenceNotes.some(n => n.octave >= 1)).toBe(true);
    });

    it('works with low octave melody', () => {
      const melody: Note[] = [
        { pitch: 'A', octave: -1, duration: 2 },
      ];

      const result = applyPhraseClosure(melody, 'perfect', 'Am');

      // Final note should be low octave tonic
      expect(result[result.length - 1].pitch).toBe('A');
    });
  });

  describe('cadence type application', () => {
    const melody: Note[] = [
      { pitch: 'D', octave: 0, duration: 2 },
    ];

    it('applies perfect cadence correctly', () => {
      const result = applyPhraseClosure(melody, 'perfect', 'C');
      expect(result[result.length - 1].pitch).toBe('C');
    });

    it('applies half cadence correctly', () => {
      const result = applyPhraseClosure(melody, 'half', 'C');
      expect(result[result.length - 1].pitch).toBe('G');
    });

    it('applies deceptive cadence correctly', () => {
      const result = applyPhraseClosure(melody, 'deceptive', 'C');
      expect(result[result.length - 1].pitch).toBe('A');
    });

    it('applies plagal cadence correctly', () => {
      const result = applyPhraseClosure(melody, 'plagal', 'C');
      expect(result[result.length - 1].pitch).toBe('C');
    });
  });

  describe('different keys', () => {
    it('works with G major', () => {
      const melody: Note[] = [
        { pitch: 'B', octave: 0, duration: 2 },
      ];

      const result = applyPhraseClosure(melody, 'perfect', 'G');

      // Should end on G
      expect(result[result.length - 1].pitch).toBe('G');
    });

    it('works with minor keys', () => {
      const melody: Note[] = [
        { pitch: 'C', octave: 0, duration: 2 },
      ];

      const result = applyPhraseClosure(melody, 'perfect', 'Am');

      // Should end on A
      expect(result[result.length - 1].pitch).toBe('A');
    });
  });

  describe('default key', () => {
    it('defaults to C major when key not specified', () => {
      const melody: Note[] = [
        { pitch: 'E', octave: 0, duration: 2 },
      ];

      const result = applyPhraseClosure(melody, 'perfect');

      // Should end on C
      expect(result[result.length - 1].pitch).toBe('C');
    });
  });
});

describe('getShortCadence', () => {
  it('returns 2-note perfect cadence', () => {
    const cadence = getShortCadence('perfect', 'C');

    expect(cadence).toHaveLength(2);
    expect(cadence[0].pitch).toBe('G'); // V
    expect(cadence[1].pitch).toBe('C'); // I
  });

  it('returns 2-note half cadence', () => {
    const cadence = getShortCadence('half', 'C');

    expect(cadence).toHaveLength(2);
    expect(cadence[0].pitch).toBe('F'); // IV
    expect(cadence[1].pitch).toBe('G'); // V
  });

  it('returns 2-note deceptive cadence', () => {
    const cadence = getShortCadence('deceptive', 'C');

    expect(cadence).toHaveLength(2);
    expect(cadence[0].pitch).toBe('G'); // V
    expect(cadence[1].pitch).toBe('A'); // vi
  });

  it('returns 2-note plagal cadence', () => {
    const cadence = getShortCadence('plagal', 'C');

    expect(cadence).toHaveLength(2);
    expect(cadence[0].pitch).toBe('F'); // IV
    expect(cadence[1].pitch).toBe('C'); // I
  });

  it('respects base octave', () => {
    const cadence = getShortCadence('perfect', 'C', 1);

    expect(cadence[0].octave).toBe(1);
    expect(cadence[1].octave).toBe(1);
  });

  it('has appropriate durations', () => {
    const cadence = getShortCadence('perfect', 'C');

    // First note shorter, second longer
    expect(cadence[0].duration).toBe(2);
    expect(cadence[1].duration).toBe(4);
  });
});

describe('validateCadence', () => {
  describe('perfect cadence validation', () => {
    it('validates correct perfect cadence', () => {
      const cadence = generateCadence('perfect', 'C');
      const result = validateCadence(cadence, 'perfect', 'C');

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('fails if perfect cadence ends on wrong note', () => {
      const badCadence: Note[] = [
        { pitch: 'B', octave: 0, duration: 2 },
        { pitch: 'G', octave: 0, duration: 4 }, // Should be C
      ];

      const result = validateCadence(badCadence, 'perfect', 'C');

      expect(result.valid).toBe(false);
      expect(result.issues[0]).toContain('should end on tonic');
    });
  });

  describe('half cadence validation', () => {
    it('validates correct half cadence', () => {
      const cadence = generateCadence('half', 'C');
      const result = validateCadence(cadence, 'half', 'C');

      expect(result.valid).toBe(true);
    });

    it('fails if half cadence ends on wrong note', () => {
      const badCadence: Note[] = [
        { pitch: 'F', octave: 0, duration: 2 },
        { pitch: 'C', octave: 0, duration: 4 }, // Should be G
      ];

      const result = validateCadence(badCadence, 'half', 'C');

      expect(result.valid).toBe(false);
      expect(result.issues[0]).toContain('should end on dominant');
    });
  });

  describe('deceptive cadence validation', () => {
    it('validates correct deceptive cadence', () => {
      const cadence = generateCadence('deceptive', 'C');
      const result = validateCadence(cadence, 'deceptive', 'C');

      expect(result.valid).toBe(true);
    });

    it('fails if deceptive cadence ends on tonic', () => {
      const badCadence: Note[] = [
        { pitch: 'G', octave: 0, duration: 2 },
        { pitch: 'C', octave: 0, duration: 4 }, // Should be A
      ];

      const result = validateCadence(badCadence, 'deceptive', 'C');

      expect(result.valid).toBe(false);
      expect(result.issues[0]).toContain('should end on submediant');
    });
  });

  describe('plagal cadence validation', () => {
    it('validates correct plagal cadence', () => {
      const cadence = generateCadence('plagal', 'C');
      const result = validateCadence(cadence, 'plagal', 'C');

      expect(result.valid).toBe(true);
    });
  });

  describe('duration validation', () => {
    it('warns if final note is too short', () => {
      const shortCadence: Note[] = [
        { pitch: 'G', octave: 0, duration: 2 },
        { pitch: 'C', octave: 0, duration: 1 }, // Duration too short
      ];

      const result = validateCadence(shortCadence, 'perfect', 'C');

      expect(result.issues.some(i => i.includes('duration'))).toBe(true);
    });
  });

  describe('empty cadence', () => {
    it('returns invalid for empty cadence', () => {
      const result = validateCadence([], 'perfect', 'C');

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Cadence is empty');
    });
  });
});

describe('getCadenceToTarget', () => {
  describe('targeting tonic', () => {
    it('approaches tonic via dominant', () => {
      const cadence = getCadenceToTarget('C', 'C');

      expect(cadence[cadence.length - 1].pitch).toBe('C');
      expect(cadence[0].pitch).toBe('G'); // Dominant approach
    });
  });

  describe('targeting dominant', () => {
    it('approaches dominant via subdominant', () => {
      const cadence = getCadenceToTarget('G', 'C');

      expect(cadence[cadence.length - 1].pitch).toBe('G');
      expect(cadence[0].pitch).toBe('F'); // Subdominant approach
    });
  });

  describe('targeting other scale degrees', () => {
    it('uses step-wise approach for other targets', () => {
      const cadence = getCadenceToTarget('E', 'C');

      expect(cadence[cadence.length - 1].pitch).toBe('E');
      // Should approach from scale degree below
      expect(cadence).toHaveLength(2);
    });
  });

  describe('non-scale tones', () => {
    it('handles target not in scale', () => {
      // F# is not in C major
      const cadence = getCadenceToTarget('X', 'C');

      // Should still return the target
      expect(cadence.length).toBeGreaterThan(0);
    });
  });

  describe('base octave', () => {
    it('respects base octave parameter', () => {
      const cadence = getCadenceToTarget('C', 'C', 1);

      expect(cadence[cadence.length - 1].octave).toBe(1);
    });
  });
});

describe('suggestCadenceForEmotion', () => {
  it('suggests perfect for conclusive emotion', () => {
    expect(suggestCadenceForEmotion('conclusive')).toBe('perfect');
  });

  it('suggests half for suspenseful emotion', () => {
    expect(suggestCadenceForEmotion('suspenseful')).toBe('half');
  });

  it('suggests deceptive for surprising emotion', () => {
    expect(suggestCadenceForEmotion('surprising')).toBe('deceptive');
  });

  it('suggests plagal for peaceful emotion', () => {
    expect(suggestCadenceForEmotion('peaceful')).toBe('plagal');
  });

  it('defaults to perfect for unknown emotion', () => {
    // Force unknown via type assertion
    expect(suggestCadenceForEmotion('unknown' as Parameters<typeof suggestCadenceForEmotion>[0])).toBe('perfect');
  });
});

describe('integration tests', () => {
  describe('complete phrase with cadence', () => {
    it('builds a complete 4-line stanza with appropriate cadences', () => {
      // Simulate processing a 4-line stanza
      const stanzaResults: { line: number; cadence: CadenceType }[] = [];

      for (let i = 0; i < 4; i++) {
        const position: LinePosition = {
          lineIndex: i,
          totalLines: 4,
          isStanzaEnd: i === 3,
          isLastStanza: true,
        };

        stanzaResults.push({
          line: i + 1,
          cadence: determineLineEndingCadence(position),
        });
      }

      // Lines 1-2 should be half or plagal (continuing)
      expect(['half', 'plagal']).toContain(stanzaResults[0].cadence);
      expect(['half', 'plagal']).toContain(stanzaResults[1].cadence);

      // Line 3 should be deceptive (tension)
      expect(stanzaResults[2].cadence).toBe('deceptive');

      // Line 4 should be perfect (final resolution)
      expect(stanzaResults[3].cadence).toBe('perfect');
    });
  });

  describe('melody with cadence application', () => {
    it('creates properly resolved phrase in Am', () => {
      const melody: Note[] = [
        { pitch: 'A', octave: 0, duration: 2 },
        { pitch: 'B', octave: 0, duration: 1 },
        { pitch: 'C', octave: 1, duration: 2 },
        { pitch: 'B', octave: 0, duration: 1 },
        { pitch: 'A', octave: 0, duration: 2 },
      ];

      const phrase = applyPhraseClosure(melody, 'perfect', 'Am');

      // Should end on A (tonic of Am)
      expect(phrase[phrase.length - 1].pitch).toBe('A');

      // Should include E (dominant) before final A
      const hasE = phrase.slice(-4).some(n => n.pitch === 'E');
      expect(hasE).toBe(true);
    });
  });

  describe('all cadence types valid in all keys', () => {
    const allKeys: KeySignature[] = ['C', 'G', 'D', 'F', 'Am', 'Em', 'Dm'];
    const allTypes: CadenceType[] = ['perfect', 'half', 'deceptive', 'plagal'];

    for (const key of allKeys) {
      for (const type of allTypes) {
        it(`generates valid ${type} cadence in ${key}`, () => {
          const cadence = generateCadence(type, key);
          const validation = validateCadence(cadence, type, key);

          expect(validation.valid).toBe(true);
          expect(cadence.length).toBeGreaterThan(0);
        });
      }
    }
  });

  describe('real-world poem scenarios', () => {
    it('handles Shakespearean sonnet structure (14 lines, 3 quatrains + couplet)', () => {
      // Simulate quatrain 1 (lines 1-4)
      const quatrain1: CadenceType[] = [];
      for (let i = 0; i < 4; i++) {
        const position: LinePosition = {
          lineIndex: i,
          totalLines: 4,
          isStanzaEnd: i === 3,
          isLastStanza: false,
        };
        quatrain1.push(determineLineEndingCadence(position));
      }

      // Final quatrain line should have strong ending
      expect(quatrain1[3]).toBe('perfect');

      // Simulate final couplet (lines 13-14)
      const couplet: CadenceType[] = [];
      for (let i = 0; i < 2; i++) {
        const position: LinePosition = {
          lineIndex: i,
          totalLines: 2,
          isStanzaEnd: i === 1,
          isLastStanza: true,
        };
        couplet.push(determineLineEndingCadence(position));
      }

      // Final line of poem should be perfect
      expect(couplet[1]).toBe('perfect');
    });

    it('handles haiku structure (3 lines)', () => {
      const haiku: CadenceType[] = [];
      for (let i = 0; i < 3; i++) {
        const position: LinePosition = {
          lineIndex: i,
          totalLines: 3,
          isStanzaEnd: i === 2,
          isLastStanza: true,
        };
        haiku.push(determineLineEndingCadence(position));
      }

      // First two lines continue, last resolves
      expect(['half', 'plagal']).toContain(haiku[0]);
      expect(['half', 'plagal']).toContain(haiku[1]);
      expect(haiku[2]).toBe('perfect');
    });
  });
});

describe('edge cases', () => {
  describe('single line poem', () => {
    it('uses perfect cadence for single line', () => {
      const position: LinePosition = {
        lineIndex: 0,
        totalLines: 1,
        isStanzaEnd: true,
        isLastStanza: true,
      };

      expect(determineLineEndingCadence(position)).toBe('perfect');
    });
  });

  describe('very long stanza', () => {
    it('handles 20-line stanza', () => {
      const position: LinePosition = {
        lineIndex: 18, // Penultimate
        totalLines: 20,
        isStanzaEnd: false,
        isLastStanza: false,
      };

      // Should still get deceptive for tension
      expect(determineLineEndingCadence(position)).toBe('deceptive');
    });
  });

  describe('octave extremes', () => {
    it('handles very high octave', () => {
      const cadence = generateCadence('perfect', 'C', 3);

      expect(cadence[0].octave).toBe(3);
    });

    it('handles very low octave', () => {
      const cadence = generateCadence('perfect', 'C', -2);

      expect(cadence[0].octave).toBe(-2);
    });
  });

  describe('note durations in cadence', () => {
    it('ensures final note is longer for proper resolution', () => {
      for (const type of ['perfect', 'half', 'deceptive', 'plagal'] as CadenceType[]) {
        const cadence = generateCadence(type, 'C');
        const lastNote = cadence[cadence.length - 1];

        expect(lastNote.duration).toBeGreaterThanOrEqual(2);
      }
    });
  });
});
