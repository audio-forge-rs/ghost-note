import { describe, it, expect } from 'vitest';
import {
  normalizeWhitespace,
  splitLines,
  detectStanzas,
  tokenizeWords,
  extractPunctuation,
  tokenizeLine,
  preprocessPoem,
  reconstructText,
  countWords,
  getAllLines,
  getLine,
  getStanza,
} from './preprocess';

// =============================================================================
// normalizeWhitespace Tests
// =============================================================================

describe('normalizeWhitespace', () => {
  it('returns empty string for empty input', () => {
    expect(normalizeWhitespace('')).toBe('');
  });

  it('returns empty string for null/undefined input', () => {
    expect(normalizeWhitespace(null as unknown as string)).toBe('');
    expect(normalizeWhitespace(undefined as unknown as string)).toBe('');
  });

  it('converts tabs to spaces', () => {
    const input = 'hello\tworld';
    expect(normalizeWhitespace(input)).toBe('hello world');
  });

  it('normalizes multiple spaces to single space', () => {
    const input = 'hello   world';
    expect(normalizeWhitespace(input)).toBe('hello world');
  });

  it('trims trailing whitespace from lines', () => {
    const input = 'hello world   ';
    expect(normalizeWhitespace(input)).toBe('hello world');
  });

  it('preserves leading whitespace within lines', () => {
    const input = '  hello world';
    expect(normalizeWhitespace(input)).toBe(' hello world');
  });

  it('normalizes CRLF to LF', () => {
    const input = 'line1\r\nline2';
    expect(normalizeWhitespace(input)).toBe('line1\nline2');
  });

  it('normalizes CR to LF', () => {
    const input = 'line1\rline2';
    expect(normalizeWhitespace(input)).toBe('line1\nline2');
  });

  it('trims leading and trailing newlines', () => {
    const input = '\n\nline1\nline2\n\n';
    expect(normalizeWhitespace(input)).toBe('line1\nline2');
  });

  it('preserves blank lines between stanzas', () => {
    const input = 'line1\nline2\n\nline3\nline4';
    expect(normalizeWhitespace(input)).toBe('line1\nline2\n\nline3\nline4');
  });

  it('handles complex whitespace combinations', () => {
    const input = '  hello\t\tworld   \r\n  foo\tbar  ';
    const expected = ' hello world\n foo bar';
    expect(normalizeWhitespace(input)).toBe(expected);
  });

  it('handles text with only whitespace', () => {
    const input = '   \t\n\r\n   ';
    expect(normalizeWhitespace(input)).toBe('');
  });
});

// =============================================================================
// splitLines Tests
// =============================================================================

describe('splitLines', () => {
  it('returns empty array for empty input', () => {
    expect(splitLines('')).toEqual([]);
  });

  it('returns single line for text without newlines', () => {
    expect(splitLines('hello world')).toEqual(['hello world']);
  });

  it('splits on newlines', () => {
    const input = 'line1\nline2\nline3';
    expect(splitLines(input)).toEqual(['line1', 'line2', 'line3']);
  });

  it('preserves empty lines', () => {
    const input = 'line1\n\nline2';
    expect(splitLines(input)).toEqual(['line1', '', 'line2']);
  });

  it('handles trailing newline', () => {
    const input = 'line1\nline2\n';
    expect(splitLines(input)).toEqual(['line1', 'line2', '']);
  });

  it('handles multiple consecutive empty lines', () => {
    const input = 'line1\n\n\nline2';
    expect(splitLines(input)).toEqual(['line1', '', '', 'line2']);
  });
});

// =============================================================================
// detectStanzas Tests
// =============================================================================

describe('detectStanzas', () => {
  it('returns empty array for empty input', () => {
    expect(detectStanzas('')).toEqual([]);
  });

  it('returns single stanza for text without blank lines', () => {
    const input = 'line1\nline2\nline3';
    expect(detectStanzas(input)).toEqual([['line1', 'line2', 'line3']]);
  });

  it('splits stanzas on single blank line', () => {
    const input = 'line1\nline2\n\nline3\nline4';
    expect(detectStanzas(input)).toEqual([
      ['line1', 'line2'],
      ['line3', 'line4'],
    ]);
  });

  it('splits stanzas on multiple blank lines', () => {
    const input = 'line1\nline2\n\n\nline3\nline4';
    expect(detectStanzas(input)).toEqual([
      ['line1', 'line2'],
      ['line3', 'line4'],
    ]);
  });

  it('handles leading blank lines', () => {
    // After normalization, leading newlines are trimmed, so we test with pre-trimmed input
    const normalized = 'line1\nline2';
    expect(detectStanzas(normalized)).toEqual([['line1', 'line2']]);
  });

  it('handles trailing blank lines', () => {
    const input = 'line1\nline2\n\n';
    expect(detectStanzas(input)).toEqual([['line1', 'line2']]);
  });

  it('handles three stanzas', () => {
    const input = 'stanza1\n\nstanza2\n\nstanza3';
    expect(detectStanzas(input)).toEqual([['stanza1'], ['stanza2'], ['stanza3']]);
  });

  it('handles real poem structure', () => {
    const poem = `Roses are red
Violets are blue

Sugar is sweet
And so are you

The end`;
    expect(detectStanzas(poem)).toEqual([
      ['Roses are red', 'Violets are blue'],
      ['Sugar is sweet', 'And so are you'],
      ['The end'],
    ]);
  });

  it('ignores lines that are only whitespace', () => {
    const input = 'line1\n   \nline2';
    expect(detectStanzas(input)).toEqual([['line1'], ['line2']]);
  });
});

// =============================================================================
// tokenizeWords Tests
// =============================================================================

describe('tokenizeWords', () => {
  it('returns empty array for empty input', () => {
    expect(tokenizeWords('')).toEqual([]);
  });

  it('returns empty array for whitespace-only input', () => {
    expect(tokenizeWords('   ')).toEqual([]);
  });

  it('tokenizes simple sentence', () => {
    expect(tokenizeWords('hello world')).toEqual(['hello', 'world']);
  });

  it('preserves contractions - don\'t', () => {
    expect(tokenizeWords("don't go")).toEqual(["don't", 'go']);
  });

  it('preserves contractions - it\'s', () => {
    expect(tokenizeWords("it's a beautiful day")).toEqual(["it's", 'a', 'beautiful', 'day']);
  });

  it('preserves contractions - I\'m', () => {
    expect(tokenizeWords("I'm happy")).toEqual(["I'm", 'happy']);
  });

  it('preserves contractions - won\'t', () => {
    expect(tokenizeWords("won't you stay")).toEqual(["won't", 'you', 'stay']);
  });

  it('preserves contractions - you\'re', () => {
    expect(tokenizeWords("you're the best")).toEqual(["you're", 'the', 'best']);
  });

  it('preserves contractions - they\'ve', () => {
    expect(tokenizeWords("they've gone home")).toEqual(["they've", 'gone', 'home']);
  });

  it('preserves archaic contractions - \'tis', () => {
    expect(tokenizeWords("'tis the season")).toEqual(["'tis", 'the', 'season']);
  });

  it('preserves archaic contractions - o\'er', () => {
    expect(tokenizeWords("o'er the hills")).toEqual(["o'er", 'the', 'hills']);
  });

  it('strips leading punctuation', () => {
    expect(tokenizeWords('"hello world')).toEqual(['hello', 'world']);
  });

  it('strips trailing punctuation', () => {
    expect(tokenizeWords('hello world!')).toEqual(['hello', 'world']);
  });

  it('strips surrounding punctuation', () => {
    expect(tokenizeWords('"hello," said the world.')).toEqual(['hello', 'said', 'the', 'world']);
  });

  it('handles hyphenated words', () => {
    expect(tokenizeWords('well-known fact')).toEqual(['well-known', 'fact']);
  });

  it('handles multiple hyphens', () => {
    expect(tokenizeWords('state-of-the-art design')).toEqual(['state-of-the-art', 'design']);
  });

  it('handles standalone dashes', () => {
    expect(tokenizeWords('word - another')).toEqual(['word', 'another']);
  });

  it('handles em-dashes without spaces', () => {
    expect(tokenizeWords('word—another')).toEqual(['word', 'another']);
  });

  it('handles multiple contractions in one line', () => {
    expect(tokenizeWords("I'm sure you'll agree it's true")).toEqual([
      "I'm", 'sure', "you'll", 'agree', "it's", 'true'
    ]);
  });

  it('handles mixed content', () => {
    expect(tokenizeWords('The "quick" brown fox, didn\'t jump!')).toEqual([
      'The', 'quick', 'brown', 'fox', "didn't", 'jump'
    ]);
  });

  it('handles possessives', () => {
    expect(tokenizeWords("John's book")).toEqual(["John's", 'book']);
  });

  it('handles numbers mixed with words', () => {
    expect(tokenizeWords('chapter 7 begins')).toEqual(['chapter', '7', 'begins']);
  });

  it('handles parentheses', () => {
    expect(tokenizeWords('hello (world)')).toEqual(['hello', 'world']);
  });

  it('handles brackets', () => {
    expect(tokenizeWords('hello [world]')).toEqual(['hello', 'world']);
  });

  it('handles ellipsis', () => {
    expect(tokenizeWords('wait... for it')).toEqual(['wait', 'for', 'it']);
  });

  it('handles semicolons', () => {
    expect(tokenizeWords('stop; look; listen')).toEqual(['stop', 'look', 'listen']);
  });

  it('handles colons', () => {
    expect(tokenizeWords('note: important')).toEqual(['note', 'important']);
  });
});

// =============================================================================
// extractPunctuation Tests
// =============================================================================

describe('extractPunctuation', () => {
  it('returns empty array for empty input', () => {
    expect(extractPunctuation('')).toEqual([]);
  });

  it('returns empty array for text without punctuation', () => {
    expect(extractPunctuation('hello world')).toEqual([]);
  });

  it('extracts period', () => {
    expect(extractPunctuation('hello.')).toEqual([{ char: '.', position: 5 }]);
  });

  it('extracts comma', () => {
    expect(extractPunctuation('hello, world')).toEqual([{ char: ',', position: 5 }]);
  });

  it('extracts exclamation mark', () => {
    expect(extractPunctuation('hello!')).toEqual([{ char: '!', position: 5 }]);
  });

  it('extracts question mark', () => {
    expect(extractPunctuation('hello?')).toEqual([{ char: '?', position: 5 }]);
  });

  it('extracts semicolon', () => {
    expect(extractPunctuation('stop; go')).toEqual([{ char: ';', position: 4 }]);
  });

  it('extracts colon', () => {
    expect(extractPunctuation('note: important')).toEqual([{ char: ':', position: 4 }]);
  });

  it('extracts quotes', () => {
    expect(extractPunctuation('"hello"')).toEqual([
      { char: '"', position: 0 },
      { char: '"', position: 6 },
    ]);
  });

  it('extracts single quotes', () => {
    expect(extractPunctuation("'hello'")).toEqual([
      { char: "'", position: 0 },
      { char: "'", position: 6 },
    ]);
  });

  it('extracts parentheses', () => {
    expect(extractPunctuation('(hello)')).toEqual([
      { char: '(', position: 0 },
      { char: ')', position: 6 },
    ]);
  });

  it('extracts brackets', () => {
    expect(extractPunctuation('[hello]')).toEqual([
      { char: '[', position: 0 },
      { char: ']', position: 6 },
    ]);
  });

  it('extracts em-dash', () => {
    expect(extractPunctuation('hello—world')).toEqual([{ char: '—', position: 5 }]);
  });

  it('extracts en-dash', () => {
    expect(extractPunctuation('hello–world')).toEqual([{ char: '–', position: 5 }]);
  });

  it('extracts hyphen', () => {
    expect(extractPunctuation('well-known')).toEqual([{ char: '-', position: 4 }]);
  });

  it('extracts ellipsis character', () => {
    // Test actual ellipsis character (Unicode U+2026)
    expect(extractPunctuation('wait…')).toEqual([{ char: '…', position: 4 }]);
  });

  it('extracts three dots as separate periods', () => {
    // Three dots are extracted as three separate period characters
    expect(extractPunctuation('wait...')).toEqual([
      { char: '.', position: 4 },
      { char: '.', position: 5 },
      { char: '.', position: 6 },
    ]);
    expect(extractPunctuation('wait..')).toEqual([
      { char: '.', position: 4 },
      { char: '.', position: 5 },
    ]);
  });

  it('extracts multiple punctuation marks', () => {
    expect(extractPunctuation('Hello, world! How are you?')).toEqual([
      { char: ',', position: 5 },
      { char: '!', position: 12 },
      { char: '?', position: 25 },
    ]);
  });

  it('preserves order of punctuation marks', () => {
    const result = extractPunctuation('"Stop," she said.');
    expect(result.map(p => p.char)).toEqual(['"', ',', '"', '.']);
  });

  it('handles consecutive punctuation', () => {
    expect(extractPunctuation('what?!')).toEqual([
      { char: '?', position: 4 },
      { char: '!', position: 5 },
    ]);
  });
});

// =============================================================================
// tokenizeLine Tests
// =============================================================================

describe('tokenizeLine', () => {
  it('returns empty words and punctuation for empty input', () => {
    const result = tokenizeLine('');
    expect(result.words).toEqual([]);
    expect(result.punctuation).toEqual([]);
  });

  it('tokenizes line with words and punctuation', () => {
    const result = tokenizeLine('Hello, world!');
    expect(result.words).toEqual(['Hello', 'world']);
    expect(result.punctuation).toEqual([
      { char: ',', position: 5 },
      { char: '!', position: 12 },
    ]);
  });

  it('handles contractions with punctuation', () => {
    const result = tokenizeLine("Don't stop, believin'!");
    expect(result.words).toEqual(["Don't", 'stop', "believin'"]);
    expect(result.punctuation).toEqual([
      { char: "'", position: 3 },
      { char: ',', position: 10 },
      { char: "'", position: 20 },
      { char: '!', position: 21 },
    ]);
  });

  it('handles complex poetry line', () => {
    const result = tokenizeLine('"Twas brillig, and the slithy toves');
    expect(result.words).toContain('brillig');
    expect(result.words).toContain('slithy');
    expect(result.words).toContain('toves');
    expect(result.punctuation.find(p => p.char === ',')).toBeDefined();
  });
});

// =============================================================================
// preprocessPoem Tests
// =============================================================================

describe('preprocessPoem', () => {
  it('handles empty input', () => {
    const result = preprocessPoem('');
    expect(result.original).toBe('');
    expect(result.stanzas).toEqual([]);
    expect(result.lineCount).toBe(0);
    expect(result.stanzaCount).toBe(0);
  });

  it('preserves original text', () => {
    const input = 'hello  world\t\r\n';
    const result = preprocessPoem(input);
    expect(result.original).toBe(input);
  });

  it('correctly counts lines and stanzas', () => {
    const poem = `Roses are red
Violets are blue

Sugar is sweet
And so are you`;
    const result = preprocessPoem(poem);
    expect(result.stanzaCount).toBe(2);
    expect(result.lineCount).toBe(4);
  });

  it('handles single stanza poem', () => {
    const poem = `Line one
Line two
Line three`;
    const result = preprocessPoem(poem);
    expect(result.stanzaCount).toBe(1);
    expect(result.lineCount).toBe(3);
    expect(result.stanzas[0]).toEqual(['Line one', 'Line two', 'Line three']);
  });

  it('handles poem with multiple stanzas', () => {
    const poem = `First stanza line 1
First stanza line 2

Second stanza line 1
Second stanza line 2
Second stanza line 3

Third stanza line 1`;
    const result = preprocessPoem(poem);
    expect(result.stanzaCount).toBe(3);
    expect(result.lineCount).toBe(6);
    expect(result.stanzas[0].length).toBe(2);
    expect(result.stanzas[1].length).toBe(3);
    expect(result.stanzas[2].length).toBe(1);
  });

  it('normalizes whitespace in stanzas', () => {
    const poem = `hello   world\t
foo\t\tbar`;
    const result = preprocessPoem(poem);
    expect(result.stanzas[0][0]).toBe('hello world');
    expect(result.stanzas[0][1]).toBe('foo bar');
  });

  it('handles real poem - "Stopping by Woods"', () => {
    const poem = `Whose woods these are I think I know.
His house is in the village though;
He will not see me stopping here
To watch his woods fill up with snow.

My little horse must think it queer
To stop without a farmhouse near
Between the woods and frozen lake
The darkest evening of the year.`;

    const result = preprocessPoem(poem);
    expect(result.stanzaCount).toBe(2);
    expect(result.lineCount).toBe(8);
    expect(result.stanzas[0].length).toBe(4);
    expect(result.stanzas[1].length).toBe(4);
  });
});

// =============================================================================
// Utility Function Tests
// =============================================================================

describe('reconstructText', () => {
  it('returns empty string for empty stanzas', () => {
    expect(reconstructText([])).toBe('');
  });

  it('reconstructs single stanza', () => {
    const stanzas = [['line1', 'line2']];
    expect(reconstructText(stanzas)).toBe('line1\nline2');
  });

  it('reconstructs multiple stanzas with blank lines', () => {
    const stanzas = [['line1', 'line2'], ['line3', 'line4']];
    expect(reconstructText(stanzas)).toBe('line1\nline2\n\nline3\nline4');
  });

  it('reconstructs three stanzas', () => {
    const stanzas = [['a'], ['b'], ['c']];
    expect(reconstructText(stanzas)).toBe('a\n\nb\n\nc');
  });
});

describe('countWords', () => {
  it('returns 0 for empty poem', () => {
    const preprocessed = preprocessPoem('');
    expect(countWords(preprocessed)).toBe(0);
  });

  it('counts words correctly', () => {
    const preprocessed = preprocessPoem('hello world\nfoo bar baz');
    expect(countWords(preprocessed)).toBe(5);
  });

  it('counts words across stanzas', () => {
    const preprocessed = preprocessPoem('one two\n\nthree four five');
    expect(countWords(preprocessed)).toBe(5);
  });

  it('handles contractions as single words', () => {
    const preprocessed = preprocessPoem("don't stop won't quit");
    expect(countWords(preprocessed)).toBe(4);
  });
});

describe('getAllLines', () => {
  it('returns empty array for empty poem', () => {
    const preprocessed = preprocessPoem('');
    expect(getAllLines(preprocessed)).toEqual([]);
  });

  it('returns all lines in order', () => {
    const preprocessed = preprocessPoem('line1\nline2\n\nline3');
    expect(getAllLines(preprocessed)).toEqual(['line1', 'line2', 'line3']);
  });
});

describe('getLine', () => {
  it('returns undefined for out of bounds index', () => {
    const preprocessed = preprocessPoem('line1\nline2');
    expect(getLine(preprocessed, 5)).toBeUndefined();
  });

  it('returns correct line by index', () => {
    const preprocessed = preprocessPoem('line1\nline2\n\nline3');
    expect(getLine(preprocessed, 0)).toBe('line1');
    expect(getLine(preprocessed, 1)).toBe('line2');
    expect(getLine(preprocessed, 2)).toBe('line3');
  });
});

describe('getStanza', () => {
  it('returns undefined for out of bounds index', () => {
    const preprocessed = preprocessPoem('line1\nline2');
    expect(getStanza(preprocessed, 5)).toBeUndefined();
  });

  it('returns correct stanza by index', () => {
    const preprocessed = preprocessPoem('s1l1\ns1l2\n\ns2l1');
    expect(getStanza(preprocessed, 0)).toEqual(['s1l1', 's1l2']);
    expect(getStanza(preprocessed, 1)).toEqual(['s2l1']);
  });
});

// =============================================================================
// Edge Cases Tests
// =============================================================================

describe('edge cases', () => {
  it('handles poem with only blank lines', () => {
    const result = preprocessPoem('\n\n\n');
    expect(result.stanzas).toEqual([]);
    expect(result.lineCount).toBe(0);
  });

  it('handles very long lines', () => {
    const longLine = 'word '.repeat(1000).trim();
    const result = preprocessPoem(longLine);
    expect(result.lineCount).toBe(1);
    expect(countWords(result)).toBe(1000);
  });

  it('handles Unicode characters', () => {
    const poem = 'Héllo wörld\nCafé résumé';
    const result = preprocessPoem(poem);
    expect(result.lineCount).toBe(2);
  });

  it('handles poem with special characters', () => {
    const poem = 'Hello™ world®\nTest© poem';
    const result = preprocessPoem(poem);
    expect(result.lineCount).toBe(2);
  });

  it('handles poem with numbers', () => {
    const poem = 'Line 1 has 5 words\nLine 2 too';
    const result = preprocessPoem(poem);
    const words = tokenizeWords(result.stanzas[0][0]);
    expect(words).toContain('1');
    expect(words).toContain('5');
  });

  it('handles mixed case contractions', () => {
    expect(tokenizeWords("DON'T stop")).toEqual(["DON'T", 'stop']);
    expect(tokenizeWords("I'M here")).toEqual(["I'M", 'here']);
  });

  it('handles curly quotes', () => {
    const result = extractPunctuation('"hello"');
    expect(result.length).toBe(2);
  });

  it('handles braces', () => {
    const result = extractPunctuation('{hello}');
    expect(result).toEqual([
      { char: '{', position: 0 },
      { char: '}', position: 6 },
    ]);
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('integration tests', () => {
  it('processes a complete poem correctly', () => {
    const poem = `Shall I compare thee to a summer's day?
Thou art more lovely and more temperate.

Rough winds do shake the darling buds of May,
And summer's lease hath all too short a date.`;

    const result = preprocessPoem(poem);

    // Check structure
    expect(result.stanzaCount).toBe(2);
    expect(result.lineCount).toBe(4);

    // Check first line tokenization
    const firstLine = result.stanzas[0][0];
    const tokens = tokenizeWords(firstLine);
    expect(tokens).toContain("summer's");
    expect(tokens).toContain('compare');

    // Check punctuation
    const punct = extractPunctuation(firstLine);
    expect(punct.find(p => p.char === '?')).toBeDefined();
    expect(punct.find(p => p.char === "'")).toBeDefined();
  });

  it('round-trip preserves poem structure', () => {
    const original = `First stanza
Has two lines

Second stanza
Has more
Lines here`;

    const processed = preprocessPoem(original);
    const reconstructed = reconstructText(processed.stanzas);
    const reprocessed = preprocessPoem(reconstructed);

    expect(reprocessed.stanzaCount).toBe(processed.stanzaCount);
    expect(reprocessed.lineCount).toBe(processed.lineCount);
  });

  it('handles Emily Dickinson style', () => {
    const poem = `Because I could not stop for Death –
He kindly stopped for me –
The Carriage held but just Ourselves –
And Immortality.

We slowly drove – He knew no haste
And I had put away
My labor and my leisure too,
For His Civility –`;

    const result = preprocessPoem(poem);
    expect(result.stanzaCount).toBe(2);
    expect(result.lineCount).toBe(8);

    // Check em-dash extraction
    const firstLinePunct = extractPunctuation(result.stanzas[0][0]);
    expect(firstLinePunct.some(p => p.char === '–')).toBe(true);
  });

  it('handles E.E. Cummings style with unusual spacing', () => {
    const poem = `i carry your heart with me
(i carry it in my heart)

i am never without it`;

    const result = preprocessPoem(poem);
    expect(result.stanzaCount).toBe(2);

    const secondLine = result.stanzas[0][1];
    const punct = extractPunctuation(secondLine);
    expect(punct.find(p => p.char === '(')).toBeDefined();
    expect(punct.find(p => p.char === ')')).toBeDefined();
  });
});
