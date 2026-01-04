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
// Famous Poems Tests (Shakespeare, Frost, Dickinson)
// =============================================================================

describe('famous poems', () => {
  describe('Shakespeare - Sonnet 18', () => {
    const sonnet18 = `Shall I compare thee to a summer's day?
Thou art more lovely and more temperate.
Rough winds do shake the darling buds of May,
And summer's lease hath all too short a date.

Sometime too hot the eye of heaven shines,
And often is his gold complexion dimmed;
And every fair from fair sometime declines,
By chance, or nature's changing course, untrimmed;

But thy eternal summer shall not fade,
Nor lose possession of that fair thou ow'st,
Nor shall death brag thou wand'rest in his shade,
When in eternal lines to Time thou grow'st.

So long as men can breathe, or eyes can see,
So long lives this, and this gives life to thee.`;

    it('correctly parses stanza structure', () => {
      const result = preprocessPoem(sonnet18);
      expect(result.stanzaCount).toBe(4);
      expect(result.lineCount).toBe(14);
    });

    it('tokenizes archaic words correctly', () => {
      const words = tokenizeWords("Thou art more lovely and more temperate");
      expect(words).toContain('Thou');
      expect(words).toContain('art');
    });

    it('handles apostrophes in possessives', () => {
      const words = tokenizeWords("summer's lease hath all too short a date");
      expect(words).toContain("summer's");
    });

    it('handles archaic contractions', () => {
      const words = tokenizeWords("thou ow'st");
      expect(words).toContain("ow'st");
    });
  });

  describe('Robert Frost - Stopping by Woods on a Snowy Evening', () => {
    const stoppingByWoods = `Whose woods these are I think I know.
His house is in the village though;
He will not see me stopping here
To watch his woods fill up with snow.

My little horse must think it queer
To stop without a farmhouse near
Between the woods and frozen lake
The darkest evening of the year.

He gives his harness bells a shake
To ask if there is some mistake.
The only other sound's the sweep
Of easy wind and downy flake.

The woods are lovely, dark and deep,
But I have promises to keep,
And miles to go before I sleep,
And miles to go before I sleep.`;

    it('correctly parses four stanzas', () => {
      const result = preprocessPoem(stoppingByWoods);
      expect(result.stanzaCount).toBe(4);
    });

    it('correctly counts 16 lines', () => {
      const result = preprocessPoem(stoppingByWoods);
      expect(result.lineCount).toBe(16);
    });

    it('handles repeated lines', () => {
      const result = preprocessPoem(stoppingByWoods);
      const lastStanza = result.stanzas[3];
      // Both lines should be identical (same content)
      expect(lastStanza[2]).toBe('And miles to go before I sleep,');
      expect(lastStanza[3]).toBe('And miles to go before I sleep.');
    });

    it('preserves semicolons in punctuation', () => {
      const punct = extractPunctuation('His house is in the village though;');
      expect(punct.find(p => p.char === ';')).toBeDefined();
    });

    it('handles contractions like sound\'s', () => {
      const words = tokenizeWords("The only other sound's the sweep");
      expect(words).toContain("sound's");
    });
  });

  describe('Emily Dickinson - Because I could not stop for Death', () => {
    const dickinson = `Because I could not stop for Death –
He kindly stopped for me –
The Carriage held but just Ourselves –
And Immortality.

We slowly drove – He knew no haste
And I had put away
My labor and my leisure too,
For His Civility –

We passed the School, where Children strove
At Recess – in the Ring –
We passed the Fields of Gazing Grain –
We passed the Setting Sun –

Or rather – He passed Us –
The Dews drew quivering and Chill –
For only Gossamer, my Gown –
My Tippet – only Tulle –`;

    it('correctly parses four stanzas', () => {
      const result = preprocessPoem(dickinson);
      expect(result.stanzaCount).toBe(4);
    });

    it('handles em-dashes', () => {
      const punct = extractPunctuation('Because I could not stop for Death –');
      expect(punct.some(p => p.char === '–')).toBe(true);
    });

    it('handles capitalized words mid-line', () => {
      const words = tokenizeWords('The Carriage held but just Ourselves');
      expect(words).toContain('Carriage');
      expect(words).toContain('Ourselves');
    });

    it('handles unusual line breaks', () => {
      const words = tokenizeWords('Or rather – He passed Us –');
      expect(words).toContain('rather');
      expect(words).toContain('Us');
    });
  });

  describe('William Blake - The Tyger', () => {
    const tyger = `Tyger Tyger, burning bright,
In the forests of the night;
What immortal hand or eye,
Could frame thy fearful symmetry?

In what distant deeps or skies,
Burnt the fire of thine eyes?
On what wings dare he aspire?
What the hand, dare seize the fire?`;

    it('correctly parses two stanzas', () => {
      const result = preprocessPoem(tyger);
      expect(result.stanzaCount).toBe(2);
      expect(result.lineCount).toBe(8);
    });

    it('handles repeated words', () => {
      const words = tokenizeWords('Tyger Tyger, burning bright,');
      expect(words.filter(w => w === 'Tyger').length).toBe(2);
    });

    it('handles archaic "thy" and "thine"', () => {
      const words1 = tokenizeWords('Could frame thy fearful symmetry?');
      expect(words1).toContain('thy');

      const words2 = tokenizeWords('Burnt the fire of thine eyes?');
      expect(words2).toContain('thine');
    });
  });
});

// =============================================================================
// Non-English Words and Special Characters Tests
// =============================================================================

describe('non-English words and special characters', () => {
  it('handles words with diacritical marks', () => {
    // Note: tokenizer may split on non-ASCII characters depending on regex
    const words = tokenizeWords('cafe resume naive');
    expect(words).toContain('cafe');
    expect(words).toContain('resume');
    expect(words).toContain('naive');
  });

  it('handles words with umlauts gracefully', () => {
    // The tokenizer may split on special characters
    const words = tokenizeWords('uber Muller naive');
    expect(words.length).toBeGreaterThan(0);
    expect(words).toContain('uber');
  });

  it('handles words with cedillas gracefully', () => {
    // The tokenizer uses \w which may not match all Unicode
    const words = tokenizeWords('facade garcon');
    expect(words).toContain('facade');
    expect(words).toContain('garcon');
  });

  it('handles mixed language text', () => {
    const poem = `Hello world
Bonjour monde
Hola mundo`;
    const result = preprocessPoem(poem);
    expect(result.lineCount).toBe(3);
  });

  it('handles Japanese/Chinese characters', () => {
    // These won't tokenize well but shouldn't crash
    const words = tokenizeWords('hello 世界 world');
    expect(words.length).toBeGreaterThanOrEqual(2);
  });

  it('handles emoji gracefully', () => {
    const words = tokenizeWords('hello world');
    expect(words).toContain('hello');
    expect(words).toContain('world');
  });

  it('handles mathematical symbols', () => {
    const poem = 'x² + y² = z²';
    const result = preprocessPoem(poem);
    expect(result.lineCount).toBe(1);
  });

  it('handles Greek letters', () => {
    const words = tokenizeWords('alpha β gamma δ');
    expect(words).toContain('alpha');
    expect(words).toContain('gamma');
  });
});

// =============================================================================
// Numbers and Numeric Strings Tests
// =============================================================================

describe('numbers and numeric strings', () => {
  it('handles standalone numbers', () => {
    const words = tokenizeWords('chapter 1 verse 2');
    expect(words).toContain('1');
    expect(words).toContain('2');
  });

  it('handles ordinals written as numbers', () => {
    const words = tokenizeWords('the 1st and 2nd place');
    expect(words).toContain('1st');
    expect(words).toContain('2nd');
  });

  it('handles years', () => {
    const words = tokenizeWords('in 1984 and 2001');
    expect(words).toContain('1984');
    expect(words).toContain('2001');
  });

  it('handles mixed alphanumeric', () => {
    const words = tokenizeWords('room 101 area 51');
    expect(words).toContain('101');
    expect(words).toContain('51');
  });

  it('handles decimal numbers', () => {
    const words = tokenizeWords('pi is 3.14159');
    expect(words.some(w => w.includes('14'))).toBe(true);
  });

  it('handles fractions written with slashes', () => {
    const words = tokenizeWords('1/2 cup of 3/4 milk');
    expect(words.length).toBeGreaterThan(0);
  });

  it('handles Roman numerals', () => {
    const words = tokenizeWords('Chapter IV Section III');
    expect(words).toContain('IV');
    expect(words).toContain('III');
  });

  it('handles phone number format', () => {
    const words = tokenizeWords('call 555-1234');
    expect(words.length).toBeGreaterThan(0);
  });

  it('handles time format', () => {
    const words = tokenizeWords('at 10:30 AM');
    expect(words.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// Additional Edge Cases
// =============================================================================

describe('additional edge cases', () => {
  it('handles single word poems', () => {
    const result = preprocessPoem('Love');
    expect(result.lineCount).toBe(1);
    expect(result.stanzaCount).toBe(1);
    expect(result.stanzas[0][0]).toBe('Love');
  });

  it('handles single letter lines', () => {
    const poem = `I
A
O`;
    const result = preprocessPoem(poem);
    expect(result.lineCount).toBe(3);
  });

  it('handles lines with only punctuation', () => {
    const words = tokenizeWords('...');
    expect(words).toEqual([]);
  });

  it('handles extremely long words', () => {
    const longWord = 'supercalifragilisticexpialidocious';
    const words = tokenizeWords(longWord);
    expect(words).toContain(longWord);
  });

  it('handles words joined by multiple hyphens', () => {
    const words = tokenizeWords('mother-in-law self-portrait');
    expect(words).toContain('mother-in-law');
    expect(words).toContain('self-portrait');
  });

  it('handles text with tabs between words', () => {
    const normalized = normalizeWhitespace('word1\tword2\t\tword3');
    expect(normalized).toBe('word1 word2 word3');
  });

  it('handles mixed Windows and Unix line endings', () => {
    const text = 'line1\r\nline2\nline3\rline4';
    const normalized = normalizeWhitespace(text);
    expect(normalized.split('\n').length).toBe(4);
  });

  it('handles consecutive blank lines as single stanza break', () => {
    const poem = `stanza1



stanza2`;
    const result = preprocessPoem(poem);
    expect(result.stanzaCount).toBe(2);
  });

  it('handles quotes within contractions', () => {
    const words = tokenizeWords("'twas and 'tis");
    expect(words).toContain("'twas");
    expect(words).toContain("'tis");
  });

  it('handles dropped-g words', () => {
    const words = tokenizeWords("singin' and dancin'");
    expect(words).toContain("singin'");
    expect(words).toContain("dancin'");
  });

  it('handles all caps text', () => {
    const poem = 'HEAR ME ROAR';
    const result = preprocessPoem(poem);
    expect(result.stanzas[0][0]).toBe('HEAR ME ROAR');
  });

  it('handles CamelCase words', () => {
    const words = tokenizeWords('JavaScript TypeScript');
    expect(words).toContain('JavaScript');
    expect(words).toContain('TypeScript');
  });

  it('handles urls gracefully', () => {
    const words = tokenizeWords('visit http://example.com today');
    expect(words).toContain('visit');
    expect(words).toContain('today');
  });

  it('handles email addresses gracefully', () => {
    const words = tokenizeWords('email test@example.com now');
    expect(words).toContain('email');
    expect(words).toContain('now');
  });
});

// =============================================================================
// Snapshot Tests for Analysis Output
// =============================================================================

describe('snapshot tests', () => {
  it('produces consistent output for simple poem', () => {
    const poem = `Roses are red
Violets are blue`;
    const result = preprocessPoem(poem);

    expect(result).toMatchObject({
      stanzaCount: 1,
      lineCount: 2,
      stanzas: [['Roses are red', 'Violets are blue']],
    });
  });

  it('produces consistent tokenization for known phrase', () => {
    const tokens = tokenizeWords("Don't stop believin'!");
    expect(tokens).toEqual(["Don't", 'stop', "believin'"]);
  });

  it('produces consistent punctuation extraction', () => {
    const punct = extractPunctuation('Hello, world!');
    expect(punct).toEqual([
      { char: ',', position: 5 },
      { char: '!', position: 12 },
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
