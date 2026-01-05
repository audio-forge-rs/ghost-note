import { describe, it, expect } from 'vitest';
import {
  generateHeader,
  pitchToABC,
  durationToABC,
  buildMeasure,
  buildABCString,
  addLyrics,
  validateMelody,
  getBeatsPerMeasure,
  getDefaultLengthDenominator,
  calculateMeasureDuration,
} from './abcGenerator';
import type { MelodyParams, Note, Melody } from './types';

describe('generateHeader', () => {
  it('generates correct header fields', () => {
    const params: MelodyParams = {
      title: 'Test Song',
      timeSignature: '4/4',
      defaultNoteLength: '1/8',
      tempo: 120,
      key: 'C',
    };

    const header = generateHeader(params);

    expect(header).toContain('X:1');
    expect(header).toContain('T:Test Song');
    expect(header).toContain('M:4/4');
    expect(header).toContain('L:1/8');
    expect(header).toContain('Q:1/4=120');
    expect(header).toContain('K:C');
  });

  it('handles minor keys', () => {
    const params: MelodyParams = {
      title: 'Minor Song',
      timeSignature: '3/4',
      defaultNoteLength: '1/4',
      tempo: 80,
      key: 'Am',
    };

    const header = generateHeader(params);

    expect(header).toContain('K:Am');
    expect(header).toContain('M:3/4');
    expect(header).toContain('L:1/4');
  });

  it('supports all time signatures', () => {
    const timeSignatures = ['4/4', '3/4', '6/8', '2/4'] as const;

    for (const ts of timeSignatures) {
      const params: MelodyParams = {
        title: 'Test',
        timeSignature: ts,
        defaultNoteLength: '1/8',
        tempo: 100,
        key: 'C',
      };

      const header = generateHeader(params);
      expect(header).toContain(`M:${ts}`);
    }
  });

  it('supports all key signatures', () => {
    const keys = ['C', 'G', 'D', 'F', 'Am', 'Em', 'Dm'] as const;

    for (const key of keys) {
      const params: MelodyParams = {
        title: 'Test',
        timeSignature: '4/4',
        defaultNoteLength: '1/8',
        tempo: 100,
        key: key,
      };

      const header = generateHeader(params);
      expect(header).toContain(`K:${key}`);
    }
  });

  it('throws error for invalid tempo', () => {
    const params: MelodyParams = {
      title: 'Test',
      timeSignature: '4/4',
      defaultNoteLength: '1/8',
      tempo: 0,
      key: 'C',
    };

    expect(() => generateHeader(params)).toThrow('Invalid tempo');
  });

  it('throws error for negative tempo', () => {
    const params: MelodyParams = {
      title: 'Test',
      timeSignature: '4/4',
      defaultNoteLength: '1/8',
      tempo: -60,
      key: 'C',
    };

    expect(() => generateHeader(params)).toThrow('Invalid tempo');
  });
});

describe('pitchToABC', () => {
  describe('middle octave (0)', () => {
    it('converts C to C', () => {
      expect(pitchToABC('C', 0)).toBe('C');
    });

    it('converts all pitches correctly', () => {
      expect(pitchToABC('C', 0)).toBe('C');
      expect(pitchToABC('D', 0)).toBe('D');
      expect(pitchToABC('E', 0)).toBe('E');
      expect(pitchToABC('F', 0)).toBe('F');
      expect(pitchToABC('G', 0)).toBe('G');
      expect(pitchToABC('A', 0)).toBe('A');
      expect(pitchToABC('B', 0)).toBe('B');
    });
  });

  describe('high octave (1)', () => {
    it('converts C to c (lowercase)', () => {
      expect(pitchToABC('C', 1)).toBe('c');
    });

    it('converts all pitches to lowercase', () => {
      expect(pitchToABC('C', 1)).toBe('c');
      expect(pitchToABC('D', 1)).toBe('d');
      expect(pitchToABC('E', 1)).toBe('e');
      expect(pitchToABC('F', 1)).toBe('f');
      expect(pitchToABC('G', 1)).toBe('g');
      expect(pitchToABC('A', 1)).toBe('a');
      expect(pitchToABC('B', 1)).toBe('b');
    });
  });

  describe('low octave (-1)', () => {
    it('converts C to C,', () => {
      expect(pitchToABC('C', -1)).toBe('C,');
    });

    it('adds comma to all pitches', () => {
      expect(pitchToABC('G', -1)).toBe('G,');
      expect(pitchToABC('A', -1)).toBe('A,');
    });
  });

  describe('very low octave (-2)', () => {
    it('converts C to C,,', () => {
      expect(pitchToABC('C', -2)).toBe('C,,');
    });
  });

  describe('very high octave (2)', () => {
    it("converts C to c'", () => {
      expect(pitchToABC('C', 2)).toBe("c'");
    });
  });

  describe('extended octaves', () => {
    it('handles octave -3', () => {
      expect(pitchToABC('C', -3)).toBe('C,,');
    });

    it('handles octave 3', () => {
      expect(pitchToABC('C', 3)).toBe("c''");
    });
  });

  describe('rests', () => {
    it('converts z to z (rest)', () => {
      expect(pitchToABC('z', 0)).toBe('z');
    });

    it('handles uppercase Z', () => {
      expect(pitchToABC('Z', 0)).toBe('z');
    });

    it('ignores octave for rests', () => {
      expect(pitchToABC('z', 1)).toBe('z');
      expect(pitchToABC('z', -1)).toBe('z');
    });
  });

  describe('case insensitivity', () => {
    it('handles lowercase input', () => {
      expect(pitchToABC('c', 0)).toBe('C');
      expect(pitchToABC('d', 0)).toBe('D');
    });
  });

  describe('error handling', () => {
    it('throws error for invalid pitch', () => {
      expect(() => pitchToABC('H', 0)).toThrow('Invalid pitch');
      expect(() => pitchToABC('X', 0)).toThrow('Invalid pitch');
    });
  });
});

describe('durationToABC', () => {
  describe('with L:1/8 (default eighth note)', () => {
    it('returns empty string for duration 1', () => {
      expect(durationToABC(1, '1/8')).toBe('');
    });

    it('returns 2 for quarter note (duration 2)', () => {
      expect(durationToABC(2, '1/8')).toBe('2');
    });

    it('returns 4 for half note (duration 4)', () => {
      expect(durationToABC(4, '1/8')).toBe('4');
    });

    it('returns 8 for whole note (duration 8)', () => {
      expect(durationToABC(8, '1/8')).toBe('8');
    });

    it('returns /2 for sixteenth note (duration 0.5)', () => {
      expect(durationToABC(0.5, '1/8')).toBe('/2');
    });

    it('returns /4 for thirty-second note (duration 0.25)', () => {
      expect(durationToABC(0.25, '1/8')).toBe('/4');
    });

    it('returns 3/2 for dotted note (duration 1.5)', () => {
      expect(durationToABC(1.5, '1/8')).toBe('3/2');
    });
  });

  describe('with L:1/4 (default quarter note)', () => {
    it('returns empty string for duration 1', () => {
      expect(durationToABC(1, '1/4')).toBe('');
    });

    it('returns 2 for half note', () => {
      expect(durationToABC(2, '1/4')).toBe('2');
    });
  });

  describe('with L:1/16 (default sixteenth note)', () => {
    it('returns empty string for duration 1', () => {
      expect(durationToABC(1, '1/16')).toBe('');
    });

    it('returns 2 for eighth note', () => {
      expect(durationToABC(2, '1/16')).toBe('2');
    });

    it('returns 4 for quarter note', () => {
      expect(durationToABC(4, '1/16')).toBe('4');
    });
  });

  describe('error handling', () => {
    it('throws error for duration 0', () => {
      expect(() => durationToABC(0, '1/8')).toThrow('Invalid duration');
    });

    it('throws error for negative duration', () => {
      expect(() => durationToABC(-1, '1/8')).toThrow('Invalid duration');
    });
  });
});

describe('buildMeasure', () => {
  it('builds a single note measure', () => {
    const notes: Note[] = [{ pitch: 'C', octave: 0, duration: 8 }];

    const result = buildMeasure(notes);

    expect(result).toBe('C8');
  });

  it('builds a multi-note measure', () => {
    const notes: Note[] = [
      { pitch: 'C', octave: 0, duration: 2 },
      { pitch: 'D', octave: 0, duration: 2 },
      { pitch: 'E', octave: 0, duration: 2 },
      { pitch: 'F', octave: 0, duration: 2 },
    ];

    const result = buildMeasure(notes);

    expect(result).toBe('C2 D2 E2 F2');
  });

  it('handles mixed octaves', () => {
    const notes: Note[] = [
      { pitch: 'C', octave: 0, duration: 2 },
      { pitch: 'E', octave: 1, duration: 2 },
      { pitch: 'G', octave: -1, duration: 4 },
    ];

    const result = buildMeasure(notes);

    expect(result).toBe('C2 e2 G,4');
  });

  it('handles rests', () => {
    const notes: Note[] = [
      { pitch: 'C', octave: 0, duration: 2 },
      { pitch: 'z', octave: 0, duration: 2 },
      { pitch: 'E', octave: 0, duration: 4 },
    ];

    const result = buildMeasure(notes);

    expect(result).toBe('C2 z2 E4');
  });

  it('returns rest for empty measure', () => {
    const result = buildMeasure([]);

    expect(result).toBe('z8');
  });

  it('handles default note length eighth notes', () => {
    const notes: Note[] = [
      { pitch: 'C', octave: 0, duration: 1 },
      { pitch: 'D', octave: 0, duration: 1 },
    ];

    const result = buildMeasure(notes, '1/8');

    expect(result).toBe('C D');
  });
});

describe('buildABCString', () => {
  it('builds a complete ABC string', () => {
    const melody: Melody = {
      params: {
        title: 'Test Melody',
        timeSignature: '4/4',
        defaultNoteLength: '1/8',
        tempo: 120,
        key: 'C',
      },
      measures: [
        [
          { pitch: 'C', octave: 0, duration: 2 },
          { pitch: 'D', octave: 0, duration: 2 },
          { pitch: 'E', octave: 0, duration: 2 },
          { pitch: 'F', octave: 0, duration: 2 },
        ],
        [
          { pitch: 'G', octave: 0, duration: 4 },
          { pitch: 'G', octave: 0, duration: 4 },
        ],
      ],
      lyrics: [],
    };

    const abc = buildABCString(melody);

    expect(abc).toContain('X:1');
    expect(abc).toContain('T:Test Melody');
    expect(abc).toContain('M:4/4');
    expect(abc).toContain('L:1/8');
    expect(abc).toContain('Q:1/4=120');
    expect(abc).toContain('K:C');
    expect(abc).toContain('C2 D2 E2 F2');
    expect(abc).toContain('G4 G4');
    expect(abc).toContain('|]'); // Ends with double bar
  });

  it('includes lyrics when present', () => {
    const melody: Melody = {
      params: {
        title: 'Song With Lyrics',
        timeSignature: '4/4',
        defaultNoteLength: '1/8',
        tempo: 100,
        key: 'C',
      },
      measures: [
        [
          { pitch: 'C', octave: 0, duration: 2 },
          { pitch: 'D', octave: 0, duration: 2 },
          { pitch: 'E', octave: 0, duration: 2 },
          { pitch: 'F', octave: 0, duration: 2 },
        ],
      ],
      lyrics: [['Hel-', 'lo', 'my', 'friend']],
    };

    const abc = buildABCString(melody);

    expect(abc).toContain('w:');
    expect(abc).toContain('Hel-');
  });

  it('handles minor key', () => {
    const melody: Melody = {
      params: {
        title: 'Minor Melody',
        timeSignature: '3/4',
        defaultNoteLength: '1/4',
        tempo: 80,
        key: 'Am',
      },
      measures: [
        [
          { pitch: 'A', octave: 0, duration: 1 },
          { pitch: 'B', octave: 0, duration: 1 },
          { pitch: 'C', octave: 1, duration: 1 },
        ],
      ],
      lyrics: [],
    };

    const abc = buildABCString(melody);

    expect(abc).toContain('K:Am');
    expect(abc).toContain('M:3/4');
    expect(abc).toContain('A B c');
  });

  it('produces valid structure for abcjs parsing', () => {
    const melody: Melody = {
      params: {
        title: 'Valid ABC',
        timeSignature: '4/4',
        defaultNoteLength: '1/8',
        tempo: 120,
        key: 'G',
      },
      measures: [
        [
          { pitch: 'G', octave: 0, duration: 2 },
          { pitch: 'A', octave: 0, duration: 2 },
          { pitch: 'B', octave: 0, duration: 4 },
        ],
      ],
      lyrics: [],
    };

    const abc = buildABCString(melody);

    // Check that header lines are separate
    const lines = abc.split('\n');
    expect(lines[0]).toBe('X:1');
    expect(lines[1]).toMatch(/^T:/);
    expect(lines[2]).toMatch(/^M:/);
    expect(lines[3]).toMatch(/^L:/);
    expect(lines[4]).toMatch(/^Q:/);
    expect(lines[5]).toMatch(/^K:/);
  });
});

describe('addLyrics', () => {
  it('adds lyrics line after music', () => {
    const abc = `X:1
T:Test
M:4/4
L:1/8
Q:1/4=100
K:C
|C2 D2 E2 F2|]`;

    const lyrics = [['Hel-', 'lo', 'my', 'friend']];

    const result = addLyrics(abc, lyrics);

    expect(result).toContain('w: Hel- lo my friend');
  });

  it('handles multiple measures of lyrics', () => {
    const abc = `X:1
T:Test
M:4/4
L:1/8
Q:1/4=100
K:C
|C2 D2 E2 F2|G4 G4|]`;

    const lyrics = [
      ['Hel-', 'lo', 'my', 'friend'],
      ['Good-', 'bye'],
    ];

    const result = addLyrics(abc, lyrics);

    expect(result).toContain('w: Hel- lo my friend | Good- bye');
  });

  it('returns unchanged abc for empty lyrics', () => {
    const abc = `X:1
T:Test
M:4/4
L:1/8
Q:1/4=100
K:C
|C2 D2|]`;

    const result = addLyrics(abc, []);

    expect(result).toBe(abc);
  });

  it('handles null lyrics', () => {
    const abc = `X:1
T:Test
K:C
|C2 D2|]`;

    const result = addLyrics(abc, null as unknown as string[][]);

    expect(result).toBe(abc);
  });
});

describe('validateMelody', () => {
  const validMelody: Melody = {
    params: {
      title: 'Valid Song',
      timeSignature: '4/4',
      defaultNoteLength: '1/8',
      tempo: 120,
      key: 'C',
    },
    measures: [
      [
        { pitch: 'C', octave: 0, duration: 2 },
        { pitch: 'D', octave: 0, duration: 2 },
      ],
    ],
    lyrics: [['Hel-', 'lo']],
  };

  it('returns valid for correct melody', () => {
    const result = validateMelody(validMelody);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns error for missing title', () => {
    const melody = {
      ...validMelody,
      params: { ...validMelody.params, title: '' },
    };

    const result = validateMelody(melody);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Title is required');
  });

  it('returns error for invalid tempo', () => {
    const melody = {
      ...validMelody,
      params: { ...validMelody.params, tempo: 0 },
    };

    const result = validateMelody(melody);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Tempo must be positive');
  });

  it('returns error for empty measures', () => {
    const melody = {
      ...validMelody,
      measures: [],
    };

    const result = validateMelody(melody);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least one measure is required');
  });

  it('returns error for invalid pitch in note', () => {
    const melody: Melody = {
      ...validMelody,
      measures: [[{ pitch: 'X', octave: 0, duration: 2 }]],
    };

    const result = validateMelody(melody);

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Invalid pitch');
  });

  it('returns error for invalid duration in note', () => {
    const melody: Melody = {
      ...validMelody,
      measures: [[{ pitch: 'C', octave: 0, duration: 0 }]],
    };

    const result = validateMelody(melody);

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Invalid duration');
  });

  it('returns error for mismatched lyrics count', () => {
    const melody: Melody = {
      ...validMelody,
      measures: [
        [{ pitch: 'C', octave: 0, duration: 2 }],
        [{ pitch: 'D', octave: 0, duration: 2 }],
      ],
      lyrics: [['One']],
    };

    const result = validateMelody(melody);

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('does not match measure count');
  });

  it('validates melody without lyrics', () => {
    const melody: Melody = {
      ...validMelody,
      lyrics: [],
    };

    const result = validateMelody(melody);

    expect(result.valid).toBe(true);
  });
});

describe('getBeatsPerMeasure', () => {
  it('returns 4 for 4/4', () => {
    expect(getBeatsPerMeasure('4/4')).toBe(4);
  });

  it('returns 3 for 3/4', () => {
    expect(getBeatsPerMeasure('3/4')).toBe(3);
  });

  it('returns 6 for 6/8', () => {
    expect(getBeatsPerMeasure('6/8')).toBe(6);
  });

  it('returns 2 for 2/4', () => {
    expect(getBeatsPerMeasure('2/4')).toBe(2);
  });

  it('defaults to 4 for unknown time signature', () => {
    expect(getBeatsPerMeasure('invalid')).toBe(4);
  });

  it('parses custom time signatures', () => {
    expect(getBeatsPerMeasure('5/4')).toBe(5);
    expect(getBeatsPerMeasure('7/8')).toBe(7);
  });
});

describe('getDefaultLengthDenominator', () => {
  it('returns 8 for 1/8', () => {
    expect(getDefaultLengthDenominator('1/8')).toBe(8);
  });

  it('returns 4 for 1/4', () => {
    expect(getDefaultLengthDenominator('1/4')).toBe(4);
  });

  it('returns 16 for 1/16', () => {
    expect(getDefaultLengthDenominator('1/16')).toBe(16);
  });
});

describe('calculateMeasureDuration', () => {
  it('calculates total duration for multiple notes', () => {
    const notes: Note[] = [
      { pitch: 'C', octave: 0, duration: 2 },
      { pitch: 'D', octave: 0, duration: 2 },
      { pitch: 'E', octave: 0, duration: 4 },
    ];

    const result = calculateMeasureDuration(notes);

    expect(result).toBe(8);
  });

  it('returns 0 for empty measure', () => {
    const result = calculateMeasureDuration([]);

    expect(result).toBe(0);
  });

  it('handles fractional durations', () => {
    const notes: Note[] = [
      { pitch: 'C', octave: 0, duration: 0.5 },
      { pitch: 'D', octave: 0, duration: 0.5 },
    ];

    const result = calculateMeasureDuration(notes);

    expect(result).toBe(1);
  });
});

describe('integration: example from documentation', () => {
  it('generates ABC for "The woods are lovely" example', () => {
    // From MELODY_GENERATION.md
    const melody: Melody = {
      params: {
        title: 'Woods',
        timeSignature: '4/4',
        defaultNoteLength: '1/8',
        tempo: 80,
        key: 'Am',
      },
      measures: [
        [
          { pitch: 'A', octave: -1, duration: 2 },
          { pitch: 'C', octave: 0, duration: 2 },
          { pitch: 'B', octave: -1, duration: 2 },
          { pitch: 'E', octave: 0, duration: 2 },
        ],
        [
          { pitch: 'D', octave: 0, duration: 2 },
          { pitch: 'E', octave: 0, duration: 2 },
          { pitch: 'D', octave: 0, duration: 2 },
          { pitch: 'A', octave: -1, duration: 2 },
        ],
      ],
      lyrics: [
        ['The', 'woods', 'are', 'love-'],
        ['-ly', 'dark', 'and', 'deep'],
      ],
    };

    const abc = buildABCString(melody);

    expect(abc).toContain('T:Woods');
    expect(abc).toContain('M:4/4');
    expect(abc).toContain('K:Am');
    expect(abc).toContain('Q:1/4=80');
    expect(abc).toContain('A,2 C2 B,2 E2');
    expect(abc).toContain('D2 E2 D2 A,2');
    expect(abc).toContain('w:');
  });
});

describe('edge cases', () => {
  it('handles very long titles', () => {
    const params: MelodyParams = {
      title: 'A'.repeat(200),
      timeSignature: '4/4',
      defaultNoteLength: '1/8',
      tempo: 100,
      key: 'C',
    };

    const header = generateHeader(params);

    expect(header).toContain(`T:${'A'.repeat(200)}`);
  });

  it('handles special characters in title', () => {
    const params: MelodyParams = {
      title: "Song's Name: A & B",
      timeSignature: '4/4',
      defaultNoteLength: '1/8',
      tempo: 100,
      key: 'C',
    };

    const header = generateHeader(params);

    expect(header).toContain("T:Song's Name: A & B");
  });

  it('handles melody with many measures', () => {
    const measures: Note[][] = [];
    for (let i = 0; i < 50; i++) {
      measures.push([
        { pitch: 'C', octave: 0, duration: 2 },
        { pitch: 'D', octave: 0, duration: 2 },
        { pitch: 'E', octave: 0, duration: 2 },
        { pitch: 'F', octave: 0, duration: 2 },
      ]);
    }

    const melody: Melody = {
      params: {
        title: 'Long Song',
        timeSignature: '4/4',
        defaultNoteLength: '1/8',
        tempo: 120,
        key: 'C',
      },
      measures,
      lyrics: [],
    };

    const abc = buildABCString(melody);

    // Should have 50 measures
    const barCount = (abc.match(/\|/g) || []).length;
    expect(barCount).toBeGreaterThan(50);
  });

  it('handles extreme tempos', () => {
    const slowParams: MelodyParams = {
      title: 'Slow',
      timeSignature: '4/4',
      defaultNoteLength: '1/8',
      tempo: 20,
      key: 'C',
    };

    const fastParams: MelodyParams = {
      title: 'Fast',
      timeSignature: '4/4',
      defaultNoteLength: '1/8',
      tempo: 300,
      key: 'C',
    };

    expect(generateHeader(slowParams)).toContain('Q:1/4=20');
    expect(generateHeader(fastParams)).toContain('Q:1/4=300');
  });

  it('handles all-rest measure', () => {
    const notes: Note[] = [
      { pitch: 'z', octave: 0, duration: 4 },
      { pitch: 'z', octave: 0, duration: 4 },
    ];

    const result = buildMeasure(notes);

    expect(result).toBe('z4 z4');
  });
});

// =============================================================================
// ABC Parsing Validation with abcjs
// =============================================================================

describe('ABC parsing validation with abcjs', () => {
  // Dynamic import of abcjs for parsing
  const parseABC = async (abc: string) => {
    const abcjs = await import('abcjs');
    return abcjs.default.parseOnly(abc);
  };

  describe('generated ABC parses correctly', () => {
    it('parses simple melody without errors', async () => {
      const melody: Melody = {
        params: {
          title: 'Parse Test',
          timeSignature: '4/4',
          defaultNoteLength: '1/8',
          tempo: 120,
          key: 'C',
        },
        measures: [
          [
            { pitch: 'C', octave: 0, duration: 2 },
            { pitch: 'D', octave: 0, duration: 2 },
            { pitch: 'E', octave: 0, duration: 2 },
            { pitch: 'F', octave: 0, duration: 2 },
          ],
        ],
        lyrics: [],
      };

      const abc = buildABCString(melody);
      const parsed = await parseABC(abc);

      // Should parse without errors
      expect(parsed).toBeDefined();
      expect(parsed.length).toBeGreaterThan(0);
      expect(parsed[0].lines).toBeDefined();
    });

    it('extracts correct time signature', async () => {
      const melody: Melody = {
        params: {
          title: 'Time Sig Test',
          timeSignature: '3/4',
          defaultNoteLength: '1/8',
          tempo: 100,
          key: 'G',
        },
        measures: [
          [
            { pitch: 'G', octave: 0, duration: 2 },
            { pitch: 'A', octave: 0, duration: 2 },
            { pitch: 'B', octave: 0, duration: 2 },
          ],
        ],
        lyrics: [],
      };

      const abc = buildABCString(melody);
      const parsed = await parseABC(abc);

      // Extract meter info
      const meterFraction = parsed[0].getMeterFraction();
      expect(meterFraction.num).toBe(3);
      expect(meterFraction.den).toBe(4);
    });

    it('extracts correct tempo', async () => {
      const melody: Melody = {
        params: {
          title: 'Tempo Test',
          timeSignature: '4/4',
          defaultNoteLength: '1/8',
          tempo: 140,
          key: 'C',
        },
        measures: [
          [{ pitch: 'C', octave: 0, duration: 8 }],
        ],
        lyrics: [],
      };

      const abc = buildABCString(melody);
      const parsed = await parseABC(abc);

      // Extract BPM
      const bpm = parsed[0].getBpm();
      expect(bpm).toBe(140);
    });

    it('extracts correct key signature', async () => {
      const melody: Melody = {
        params: {
          title: 'Key Test',
          timeSignature: '4/4',
          defaultNoteLength: '1/8',
          tempo: 100,
          key: 'Am',
        },
        measures: [
          [{ pitch: 'A', octave: 0, duration: 8 }],
        ],
        lyrics: [],
      };

      const abc = buildABCString(melody);
      const parsed = await parseABC(abc);

      // Extract key signature
      const keySig = parsed[0].getKeySignature();
      expect(keySig).toBeDefined();
      expect(keySig.root).toBe('A');
      expect(keySig.mode).toBe('m');
    });

    it('parses all major keys correctly', async () => {
      const majorKeys = ['C', 'G', 'D', 'F'] as const;

      for (const key of majorKeys) {
        const melody: Melody = {
          params: {
            title: `${key} Major Test`,
            timeSignature: '4/4',
            defaultNoteLength: '1/8',
            tempo: 100,
            key,
          },
          measures: [[{ pitch: key, octave: 0, duration: 8 }]],
          lyrics: [],
        };

        const abc = buildABCString(melody);
        const parsed = await parseABC(abc);

        expect(parsed[0].getKeySignature().root).toBe(key);
      }
    });

    it('parses all minor keys correctly', async () => {
      const minorKeys = ['Am', 'Em', 'Dm'] as const;
      const expectedRoots = { Am: 'A', Em: 'E', Dm: 'D' };

      for (const key of minorKeys) {
        const melody: Melody = {
          params: {
            title: `${key} Minor Test`,
            timeSignature: '4/4',
            defaultNoteLength: '1/8',
            tempo: 100,
            key,
          },
          measures: [[{ pitch: expectedRoots[key], octave: 0, duration: 8 }]],
          lyrics: [],
        };

        const abc = buildABCString(melody);
        const parsed = await parseABC(abc);

        expect(parsed[0].getKeySignature().root).toBe(expectedRoots[key]);
        expect(parsed[0].getKeySignature().mode).toBe('m');
      }
    });

    it('parses complex melody with mixed octaves', async () => {
      const melody: Melody = {
        params: {
          title: 'Octave Test',
          timeSignature: '4/4',
          defaultNoteLength: '1/8',
          tempo: 100,
          key: 'C',
        },
        measures: [
          [
            { pitch: 'C', octave: -1, duration: 2 },
            { pitch: 'E', octave: 0, duration: 2 },
            { pitch: 'G', octave: 1, duration: 2 },
            { pitch: 'C', octave: 2, duration: 2 },
          ],
        ],
        lyrics: [],
      };

      const abc = buildABCString(melody);
      const parsed = await parseABC(abc);

      // Should parse without errors and have notes
      expect(parsed[0].lines.length).toBeGreaterThan(0);
    });

    it('parses melody with lyrics correctly', async () => {
      const melody: Melody = {
        params: {
          title: 'Lyrics Test',
          timeSignature: '4/4',
          defaultNoteLength: '1/8',
          tempo: 100,
          key: 'C',
        },
        measures: [
          [
            { pitch: 'C', octave: 0, duration: 2 },
            { pitch: 'D', octave: 0, duration: 2 },
          ],
        ],
        lyrics: [['Hel-', 'lo']],
      };

      const abc = buildABCString(melody);
      const parsed = await parseABC(abc);

      // Should parse with lyrics present
      expect(parsed[0]).toBeDefined();
    });

    it('parses melody with rests correctly', async () => {
      const melody: Melody = {
        params: {
          title: 'Rest Test',
          timeSignature: '4/4',
          defaultNoteLength: '1/8',
          tempo: 100,
          key: 'C',
        },
        measures: [
          [
            { pitch: 'C', octave: 0, duration: 2 },
            { pitch: 'z', octave: 0, duration: 2 },
            { pitch: 'E', octave: 0, duration: 2 },
            { pitch: 'z', octave: 0, duration: 2 },
          ],
        ],
        lyrics: [],
      };

      const abc = buildABCString(melody);
      const parsed = await parseABC(abc);

      expect(parsed[0].lines.length).toBeGreaterThan(0);
    });

    it('parses tempo correctly', async () => {
      const melody: Melody = {
        params: {
          title: 'Duration Test',
          timeSignature: '4/4',
          defaultNoteLength: '1/8',
          tempo: 120, // 2 beats per second
          key: 'C',
        },
        measures: [
          [
            { pitch: 'C', octave: 0, duration: 2 },
            { pitch: 'D', octave: 0, duration: 2 },
            { pitch: 'E', octave: 0, duration: 2 },
            { pitch: 'F', octave: 0, duration: 2 },
          ],
        ],
        lyrics: [],
      };

      const abc = buildABCString(melody);
      const parsed = await parseABC(abc);

      // Should have valid parse result with correct tempo
      expect(parsed[0]).toBeDefined();
      expect(parsed[0].getBpm()).toBe(120);
    });
  });

  describe('ABC notation correctness', () => {
    it('produces valid note sequence with proper bar lines', async () => {
      const melody: Melody = {
        params: {
          title: 'Bar Test',
          timeSignature: '4/4',
          defaultNoteLength: '1/8',
          tempo: 100,
          key: 'C',
        },
        measures: [
          [
            { pitch: 'C', octave: 0, duration: 2 },
            { pitch: 'D', octave: 0, duration: 2 },
            { pitch: 'E', octave: 0, duration: 2 },
            { pitch: 'F', octave: 0, duration: 2 },
          ],
          [
            { pitch: 'G', octave: 0, duration: 4 },
            { pitch: 'G', octave: 0, duration: 4 },
          ],
        ],
        lyrics: [],
      };

      const abc = buildABCString(melody);
      const parsed = await parseABC(abc);

      // Should have proper structure
      expect(parsed[0]).toBeDefined();
      expect(parsed[0].lines).toBeDefined();
      expect(parsed[0].lines.length).toBeGreaterThan(0);
    });

    it('generates playable ABC for all time signatures', async () => {
      const timeSignatures = ['4/4', '3/4', '6/8', '2/4'] as const;

      for (const ts of timeSignatures) {
        const beatsPerMeasure = getBeatsPerMeasure(ts);
        const notes: Note[] = [];

        // Create a full measure of quarter notes
        for (let i = 0; i < beatsPerMeasure; i++) {
          notes.push({ pitch: 'C', octave: 0, duration: 2 });
        }

        const melody: Melody = {
          params: {
            title: `${ts} Test`,
            timeSignature: ts,
            defaultNoteLength: '1/8',
            tempo: 100,
            key: 'C',
          },
          measures: [notes],
          lyrics: [],
        };

        const abc = buildABCString(melody);
        const parsed = await parseABC(abc);

        expect(parsed[0]).toBeDefined();
        expect(parsed[0].getMeterFraction()).toBeDefined();
      }
    });
  });
});
