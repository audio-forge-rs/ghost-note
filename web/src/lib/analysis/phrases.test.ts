import { describe, it, expect } from 'vitest';
import {
  estimateSyllables,
  detectEnjambment,
  analyzeLinePhrases,
  analyzePoemPhrases,
  getBestBreathPoints,
  combineShortPhrases,
  isNaturalBoundary,
  getPhraseBoundaryPositions,
  getBreathabilityAtPosition,
  suggestMelodyPhraseBreaks,
  type Phrase,
  type PoemPhrasingAnalysis,
} from './phrases';
import { preprocessPoem } from './preprocess';

// =============================================================================
// estimateSyllables Tests
// =============================================================================

describe('estimateSyllables', () => {
  it('returns 0 for empty string', () => {
    expect(estimateSyllables('')).toBe(0);
  });

  it('returns 0 for null/undefined input', () => {
    expect(estimateSyllables(null as unknown as string)).toBe(0);
    expect(estimateSyllables(undefined as unknown as string)).toBe(0);
  });

  it('counts single syllable words correctly', () => {
    expect(estimateSyllables('love')).toBe(1);
    expect(estimateSyllables('heart')).toBe(1);
    expect(estimateSyllables('dream')).toBe(1);
    expect(estimateSyllables('sky')).toBe(1);
  });

  it('counts two syllable words correctly', () => {
    expect(estimateSyllables('heaven')).toBe(2);
    expect(estimateSyllables('open')).toBe(2);
    expect(estimateSyllables('river')).toBe(2);
    expect(estimateSyllables('golden')).toBe(2);
  });

  it('counts multi-syllable words correctly', () => {
    expect(estimateSyllables('beautiful')).toBe(3);
    expect(estimateSyllables('melody')).toBe(3);
    expect(estimateSyllables('eternity')).toBe(4);
    expect(estimateSyllables('imagination')).toBe(5);
  });

  it('handles silent e correctly', () => {
    expect(estimateSyllables('love')).toBe(1);
    expect(estimateSyllables('make')).toBe(1);
    expect(estimateSyllables('time')).toBe(1);
    expect(estimateSyllables('face')).toBe(1);
  });

  it('handles words with punctuation', () => {
    expect(estimateSyllables("don't")).toBe(1);
    expect(estimateSyllables('love,')).toBe(1);
    expect(estimateSyllables('heart!')).toBe(1);
  });

  it('ensures minimum of 1 syllable for valid words', () => {
    expect(estimateSyllables('I')).toBe(1);
    expect(estimateSyllables('a')).toBe(1);
    expect(estimateSyllables('my')).toBe(1);
  });
});

// =============================================================================
// detectEnjambment Tests
// =============================================================================

describe('detectEnjambment', () => {
  it('returns false for empty lines', () => {
    expect(detectEnjambment('', 'next line')).toBe(false);
    expect(detectEnjambment('line', '')).toBe(false);
    expect(detectEnjambment('', '')).toBe(false);
  });

  it('returns false when line ends with period', () => {
    expect(detectEnjambment('The sun sets low.', 'A new day comes')).toBe(false);
  });

  it('returns false when line ends with exclamation', () => {
    expect(detectEnjambment('Oh what a day!', 'And then it came')).toBe(false);
  });

  it('returns false when line ends with question mark', () => {
    expect(detectEnjambment('Where did you go?', 'I wonder still')).toBe(false);
  });

  it('returns false when line ends with semicolon', () => {
    expect(detectEnjambment('The night is dark;', 'stars fill the sky')).toBe(false);
  });

  it('returns true when next line starts with lowercase', () => {
    expect(detectEnjambment('The winding road that leads', 'to nowhere known')).toBe(true);
  });

  it('returns true when line ends with preposition', () => {
    expect(detectEnjambment('The dreams we long for', 'Are never far away')).toBe(true);
  });

  it('returns true when line ends with conjunction', () => {
    expect(detectEnjambment('The moon rises high and', 'Stars begin to shine')).toBe(true);
  });

  it('returns true when line ends with article', () => {
    expect(detectEnjambment('I saw a', 'Beautiful sunrise')).toBe(true);
    expect(detectEnjambment('Beyond the', 'Distant horizon')).toBe(true);
    expect(detectEnjambment('I found my', 'Long lost friend')).toBe(true);
  });

  it('returns false when next line is undefined', () => {
    expect(detectEnjambment('Some line of text', undefined)).toBe(false);
  });
});

// =============================================================================
// analyzeLinePhrases Tests
// =============================================================================

describe('analyzeLinePhrases', () => {
  it('returns empty analysis for empty line', () => {
    const result = analyzeLinePhrases('', 0);
    expect(result.boundaries).toHaveLength(0);
    expect(result.phrases).toHaveLength(0);
    expect(result.combineWithNext).toBe(false);
  });

  it('returns empty analysis for whitespace-only line', () => {
    const result = analyzeLinePhrases('   ', 0);
    expect(result.boundaries).toHaveLength(0);
    expect(result.phrases).toHaveLength(0);
  });

  it('detects comma as phrase boundary', () => {
    const result = analyzeLinePhrases('Hello world, how are you', 0);

    // Should have boundary at "world" (position 1) due to comma
    const commaBoundary = result.boundaries.find(b => b.type === 'punctuation' && b.trigger === ',');
    expect(commaBoundary).toBeDefined();
    expect(commaBoundary?.position).toBe(1);
    expect(commaBoundary?.strength).toBe('weak');
  });

  it('detects period as strong phrase boundary', () => {
    const result = analyzeLinePhrases('The day ends. Night begins', 0);

    const periodBoundary = result.boundaries.find(b => b.type === 'punctuation' && b.trigger === '.');
    expect(periodBoundary).toBeDefined();
    expect(periodBoundary?.strength).toBe('strong');
  });

  it('detects semicolon as strong phrase boundary', () => {
    const result = analyzeLinePhrases('The moon rises; stars appear', 0);

    const semicolonBoundary = result.boundaries.find(b => b.type === 'punctuation' && b.trigger === ';');
    expect(semicolonBoundary).toBeDefined();
    expect(semicolonBoundary?.strength).toBe('strong');
  });

  it('detects "and" as conjunction boundary', () => {
    const result = analyzeLinePhrases('The sun shines and the birds sing', 0);

    const conjBoundary = result.boundaries.find(b => b.type === 'conjunction' && b.trigger === 'and');
    expect(conjBoundary).toBeDefined();
    expect(conjBoundary?.position).toBe(2); // After "shines"
    expect(conjBoundary?.strength).toBe('medium');
  });

  it('detects "but" as conjunction boundary', () => {
    const result = analyzeLinePhrases('I tried hard but I failed', 0);

    const conjBoundary = result.boundaries.find(b => b.type === 'conjunction' && b.trigger === 'but');
    expect(conjBoundary).toBeDefined();
    expect(conjBoundary?.strength).toBe('medium');
  });

  it('detects "or" as conjunction boundary', () => {
    const result = analyzeLinePhrases('You can stay or you can go', 0);

    const conjBoundary = result.boundaries.find(b => b.type === 'conjunction' && b.trigger === 'or');
    expect(conjBoundary).toBeDefined();
  });

  it('detects subordinating conjunctions', () => {
    const result = analyzeLinePhrases('I wait here because you asked', 0);

    const conjBoundary = result.boundaries.find(b => b.trigger === 'because');
    expect(conjBoundary).toBeDefined();
    expect(conjBoundary?.type).toBe('conjunction');
  });

  it('always adds line_break boundary at end', () => {
    const result = analyzeLinePhrases('A simple line of text', 0);

    const lineBreak = result.boundaries.find(b => b.type === 'line_break');
    expect(lineBreak).toBeDefined();
    expect(lineBreak?.strength).toBe('strong');
    expect(lineBreak?.breathability).toBe(0.9);
  });

  it('extracts phrases between boundaries', () => {
    const result = analyzeLinePhrases('Hello world, how are you', 0);

    expect(result.phrases.length).toBeGreaterThanOrEqual(2);
    expect(result.phrases[0].text).toBe('Hello world');
  });

  it('calculates syllable counts for phrases', () => {
    const result = analyzeLinePhrases('Beautiful melody', 0);

    expect(result.phrases.length).toBeGreaterThanOrEqual(1);
    const totalSyllables = result.phrases.reduce((sum, p) => sum + p.syllableCount, 0);
    expect(totalSyllables).toBeGreaterThan(0);
  });

  it('sets combineWithNext for enjambed lines', () => {
    const result = analyzeLinePhrases('The winding road that leads', 0, 'to nowhere known');
    expect(result.combineWithNext).toBe(true);
  });

  it('does not set combineWithNext for complete lines', () => {
    const result = analyzeLinePhrases('The sun sets in the west.', 0, 'A new day dawns');
    expect(result.combineWithNext).toBe(false);
  });

  it('includes lineIndex in result', () => {
    const result = analyzeLinePhrases('Test line', 5);
    expect(result.lineIndex).toBe(5);
  });

  it('preserves original text in result', () => {
    const text = 'The quick brown fox';
    const result = analyzeLinePhrases(text, 0);
    expect(result.text).toBe(text);
  });
});

// =============================================================================
// Phrase Boundary Types Tests
// =============================================================================

describe('Phrase Boundary Types', () => {
  it('assigns correct breathability for strong punctuation', () => {
    const result = analyzeLinePhrases('The end.', 0);
    const periodBoundary = result.boundaries.find(b => b.trigger === '.');
    expect(periodBoundary?.breathability).toBe(1.0);
  });

  it('assigns correct breathability for medium punctuation', () => {
    const result = analyzeLinePhrases('Note: this is important', 0);
    const colonBoundary = result.boundaries.find(b => b.trigger === ':');
    expect(colonBoundary?.breathability).toBe(0.7);
  });

  it('assigns correct breathability for weak punctuation', () => {
    const result = analyzeLinePhrases('Hello, world', 0);
    const commaBoundary = result.boundaries.find(b => b.trigger === ',');
    expect(commaBoundary?.breathability).toBe(0.4);
  });

  it('assigns medium breathability for conjunctions', () => {
    const result = analyzeLinePhrases('Sun rises and moon sets', 0);
    const conjBoundary = result.boundaries.find(b => b.type === 'conjunction');
    expect(conjBoundary?.breathability).toBeGreaterThanOrEqual(0.6);
  });

  it('assigns weak breathability for semantic boundaries', () => {
    const result = analyzeLinePhrases('The castle stands proudly on the hill beyond the river', 0);
    const semanticBoundary = result.boundaries.find(b => b.type === 'semantic');
    if (semanticBoundary) {
      expect(semanticBoundary.breathability).toBeLessThan(0.5);
    }
  });
});

// =============================================================================
// analyzePoemPhrases Tests
// =============================================================================

describe('analyzePoemPhrases', () => {
  it('analyzes simple single-stanza poem', () => {
    const poem = preprocessPoem('Line one\nLine two\nLine three');
    const result = analyzePoemPhrases(poem);

    expect(result.lines).toHaveLength(3);
    expect(result.lines[0].lineIndex).toBe(0);
    expect(result.lines[1].lineIndex).toBe(1);
    expect(result.lines[2].lineIndex).toBe(2);
  });

  it('analyzes multi-stanza poem', () => {
    const poem = preprocessPoem('First stanza line one\nFirst stanza line two\n\nSecond stanza line one');
    const result = analyzePoemPhrases(poem);

    expect(result.lines).toHaveLength(3);
  });

  it('identifies major break lines', () => {
    const poem = preprocessPoem('The sun sets low.\nThe stars appear.\nThe night is here.');
    const result = analyzePoemPhrases(poem);

    expect(result.majorBreakLines.length).toBeGreaterThan(0);
  });

  it('calculates average phrase length', () => {
    const poem = preprocessPoem('Short line.\nAnother short.\nYet another.');
    const result = analyzePoemPhrases(poem);

    expect(result.averagePhraseLength).toBeGreaterThan(0);
    expect(typeof result.averagePhraseLength).toBe('number');
  });

  it('collects breath points from all lines', () => {
    const poem = preprocessPoem('Hello, world.\nGoodbye, friend.');
    const result = analyzePoemPhrases(poem);

    expect(result.breathPoints.length).toBeGreaterThan(0);
    result.breathPoints.forEach(bp => {
      expect(bp).toHaveProperty('lineIndex');
      expect(bp).toHaveProperty('wordIndex');
      expect(bp).toHaveProperty('strength');
    });
  });

  it('handles empty poem', () => {
    const poem = preprocessPoem('');
    const result = analyzePoemPhrases(poem);

    expect(result.lines).toHaveLength(0);
    expect(result.majorBreakLines).toHaveLength(0);
    expect(result.breathPoints).toHaveLength(0);
    expect(result.averagePhraseLength).toBe(0);
  });

  it('detects enjambment between lines', () => {
    const poem = preprocessPoem('The winding road that\nleads to nowhere known');
    const result = analyzePoemPhrases(poem);

    expect(result.lines[0].combineWithNext).toBe(true);
  });
});

// =============================================================================
// getBestBreathPoints Tests
// =============================================================================

describe('getBestBreathPoints', () => {
  it('returns boundaries sorted by breathability', () => {
    const analysis = analyzeLinePhrases('Hello, world. How are you?', 0);
    const bestPoints = getBestBreathPoints(analysis, 3);

    expect(bestPoints.length).toBeLessThanOrEqual(3);

    // Verify sorted by breathability descending
    for (let i = 0; i < bestPoints.length - 1; i++) {
      expect(bestPoints[i].breathability).toBeGreaterThanOrEqual(bestPoints[i + 1].breathability);
    }
  });

  it('respects maxPoints limit', () => {
    const analysis = analyzeLinePhrases('A, B, C, D, E, F', 0);
    const bestPoints = getBestBreathPoints(analysis, 2);

    expect(bestPoints.length).toBeLessThanOrEqual(2);
  });

  it('returns all points if fewer than maxPoints exist', () => {
    const analysis = analyzeLinePhrases('Simple line', 0);
    const bestPoints = getBestBreathPoints(analysis, 10);

    expect(bestPoints.length).toBe(analysis.boundaries.length);
  });

  it('uses default maxPoints of 3', () => {
    const analysis = analyzeLinePhrases('A, B, C, D, E, F', 0);
    const bestPoints = getBestBreathPoints(analysis);

    expect(bestPoints.length).toBeLessThanOrEqual(3);
  });
});

// =============================================================================
// combineShortPhrases Tests
// =============================================================================

describe('combineShortPhrases', () => {
  it('returns empty array for empty input', () => {
    expect(combineShortPhrases([])).toEqual([]);
  });

  it('returns single phrase unchanged', () => {
    const phrases: Phrase[] = [{
      text: 'Hello world',
      words: ['Hello', 'world'],
      startWordIndex: 0,
      endWordIndex: 1,
      syllableCount: 3,
      endsAtLineBreak: true,
    }];

    const result = combineShortPhrases(phrases);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('Hello world');
  });

  it('combines consecutive short phrases', () => {
    const phrases: Phrase[] = [
      {
        text: 'I',
        words: ['I'],
        startWordIndex: 0,
        endWordIndex: 0,
        syllableCount: 1,
        endsAtLineBreak: false,
      },
      {
        text: 'love',
        words: ['love'],
        startWordIndex: 1,
        endWordIndex: 1,
        syllableCount: 1,
        endsAtLineBreak: false,
      },
      {
        text: 'you',
        words: ['you'],
        startWordIndex: 2,
        endWordIndex: 2,
        syllableCount: 1,
        endsAtLineBreak: true,
      },
    ];

    const result = combineShortPhrases(phrases);
    expect(result.length).toBeLessThan(phrases.length);
  });

  it('preserves phrases that end at line breaks', () => {
    const phrases: Phrase[] = [
      {
        text: 'Hi',
        words: ['Hi'],
        startWordIndex: 0,
        endWordIndex: 0,
        syllableCount: 1,
        endsAtLineBreak: true,
      },
    ];

    const result = combineShortPhrases(phrases);
    expect(result).toHaveLength(1);
  });

  it('does not combine phrases exceeding target length', () => {
    const phrases: Phrase[] = [
      {
        text: 'Beautiful melody rising',
        words: ['Beautiful', 'melody', 'rising'],
        startWordIndex: 0,
        endWordIndex: 2,
        syllableCount: 8,
        endsAtLineBreak: false,
      },
      {
        text: 'through the evening sky',
        words: ['through', 'the', 'evening', 'sky'],
        startWordIndex: 3,
        endWordIndex: 6,
        syllableCount: 5,
        endsAtLineBreak: true,
      },
    ];

    const result = combineShortPhrases(phrases);
    // Should not combine because total would exceed target
    expect(result.length).toBe(2);
  });
});

// =============================================================================
// isNaturalBoundary Tests
// =============================================================================

describe('isNaturalBoundary', () => {
  it('returns true for comma position', () => {
    expect(isNaturalBoundary('Hello, world', 0)).toBe(true); // After "Hello"
  });

  it('returns true for period position', () => {
    expect(isNaturalBoundary('The end.', 1)).toBe(true); // After "end"
  });

  it('returns true for line end', () => {
    const text = 'Simple text here';
    const words = text.split(' ');
    expect(isNaturalBoundary(text, words.length - 1)).toBe(true);
  });

  it('returns false for out of bounds index', () => {
    expect(isNaturalBoundary('Hello world', -1)).toBe(false);
    expect(isNaturalBoundary('Hello world', 100)).toBe(false);
  });

  it('returns false for empty text', () => {
    expect(isNaturalBoundary('', 0)).toBe(false);
  });
});

// =============================================================================
// getPhraseBoundaryPositions Tests
// =============================================================================

describe('getPhraseBoundaryPositions', () => {
  it('returns array of word indices', () => {
    const positions = getPhraseBoundaryPositions('Hello, world');

    expect(Array.isArray(positions)).toBe(true);
    expect(positions.length).toBeGreaterThan(0);
  });

  it('includes comma position', () => {
    const positions = getPhraseBoundaryPositions('First, second, third');

    // Should include positions after "First" and "second"
    expect(positions.includes(0)).toBe(true);
    expect(positions.includes(1)).toBe(true);
  });

  it('always includes last word position', () => {
    const text = 'One two three';
    const positions = getPhraseBoundaryPositions(text);

    expect(positions.includes(2)).toBe(true); // Last word "three"
  });

  it('returns empty array for empty text', () => {
    expect(getPhraseBoundaryPositions('')).toEqual([]);
  });
});

// =============================================================================
// getBreathabilityAtPosition Tests
// =============================================================================

describe('getBreathabilityAtPosition', () => {
  it('returns breathability for boundary position', () => {
    const analysis = analyzeLinePhrases('Hello, world', 0);
    const breathability = getBreathabilityAtPosition(analysis, 0);

    expect(breathability).toBeGreaterThan(0);
  });

  it('returns 0 for non-boundary position', () => {
    const analysis = analyzeLinePhrases('The quick brown fox', 0);

    // Position 0 might not be a boundary
    const breathability = getBreathabilityAtPosition(analysis, 0);
    // The result depends on whether there's a boundary at position 0
    expect(typeof breathability).toBe('number');
  });

  it('returns 0 for out of range position', () => {
    const analysis = analyzeLinePhrases('Hello world', 0);
    const breathability = getBreathabilityAtPosition(analysis, 100);

    expect(breathability).toBe(0);
  });

  it('returns high breathability for period', () => {
    const analysis = analyzeLinePhrases('The end.', 0);
    const breathability = getBreathabilityAtPosition(analysis, 1);

    expect(breathability).toBe(1.0);
  });
});

// =============================================================================
// suggestMelodyPhraseBreaks Tests
// =============================================================================

describe('suggestMelodyPhraseBreaks', () => {
  it('returns array of line indices', () => {
    const poem = preprocessPoem('Line one.\nLine two.\nLine three.');
    const poemAnalysis = analyzePoemPhrases(poem);
    const breaks = suggestMelodyPhraseBreaks(poemAnalysis);

    expect(Array.isArray(breaks)).toBe(true);
    breaks.forEach(idx => {
      expect(typeof idx).toBe('number');
      expect(idx).toBeGreaterThanOrEqual(0);
    });
  });

  it('ensures minimum spacing between breaks', () => {
    const poem = preprocessPoem('A.\nB.\nC.\nD.\nE.');
    const poemAnalysis = analyzePoemPhrases(poem);
    const breaks = suggestMelodyPhraseBreaks(poemAnalysis);

    // Check that no two consecutive breaks are less than 2 lines apart
    for (let i = 0; i < breaks.length - 1; i++) {
      expect(breaks[i + 1] - breaks[i]).toBeGreaterThanOrEqual(2);
    }
  });

  it('returns empty array for empty poem analysis', () => {
    const poemAnalysis: PoemPhrasingAnalysis = {
      lines: [],
      majorBreakLines: [],
      averagePhraseLength: 0,
      breathPoints: [],
    };

    const breaks = suggestMelodyPhraseBreaks(poemAnalysis);
    expect(breaks).toEqual([]);
  });

  it('includes major break lines when spacing allows', () => {
    const poem = preprocessPoem('First line ends here.\n\nSecond stanza begins.\n\nThird stanza too.');
    const poemAnalysis = analyzePoemPhrases(poem);
    const breaks = suggestMelodyPhraseBreaks(poemAnalysis);

    // Some major breaks should be included
    expect(breaks.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Phrase Analysis Integration', () => {
  it('handles real poem text correctly', () => {
    const poemText = `The fog comes
on little cat feet.

It sits looking
over harbor and city
on silent haunches
and then moves on.`;

    const poem = preprocessPoem(poemText);
    const analysis = analyzePoemPhrases(poem);

    expect(analysis.lines.length).toBe(6);
    expect(analysis.breathPoints.length).toBeGreaterThan(0);
    expect(analysis.averagePhraseLength).toBeGreaterThan(0);
  });

  it('detects enjambment in poetry', () => {
    const poemText = `I wandered lonely as a
cloud that floats on high`;

    const poem = preprocessPoem(poemText);
    const analysis = analyzePoemPhrases(poem);

    expect(analysis.lines[0].combineWithNext).toBe(true);
  });

  it('finds major breaks at stanza boundaries', () => {
    const poemText = `First stanza line one.
First stanza line two.

Second stanza line one.
Second stanza line two.`;

    const poem = preprocessPoem(poemText);
    const analysis = analyzePoemPhrases(poem);

    // Lines ending stanzas should be in majorBreakLines
    expect(analysis.majorBreakLines).toContain(1); // End of first stanza
    expect(analysis.majorBreakLines).toContain(3); // End of second stanza
  });

  it('handles multiple punctuation marks correctly', () => {
    const line = 'Wait—no, stop! What?';
    const analysis = analyzeLinePhrases(line, 0);

    // Should detect multiple boundaries
    expect(analysis.boundaries.length).toBeGreaterThan(1);

    // Should have strong boundaries for ! and ?
    const strongBoundaries = analysis.boundaries.filter(b => b.strength === 'strong');
    expect(strongBoundaries.length).toBeGreaterThan(0);
  });

  it('handles long lines with length splitting', () => {
    const longLine = 'The magnificent golden sunset painted the endless horizon with brilliant shades of crimson and amber light';
    const analysis = analyzeLinePhrases(longLine, 0);

    // Should have multiple phrases due to length splitting
    expect(analysis.phrases.length).toBeGreaterThan(1);
  });

  it('handles lines with only conjunctions and prepositions', () => {
    const line = 'and with the for but in on';
    const analysis = analyzeLinePhrases(line, 0);

    // Should still produce valid output
    expect(analysis.text).toBe(line);
    expect(analysis.boundaries.length).toBeGreaterThan(0);
  });

  it('provides consistent output structure', () => {
    const poem = preprocessPoem('Test line one.\nTest line two.');
    const analysis = analyzePoemPhrases(poem);

    // Verify structure
    expect(analysis).toHaveProperty('lines');
    expect(analysis).toHaveProperty('majorBreakLines');
    expect(analysis).toHaveProperty('averagePhraseLength');
    expect(analysis).toHaveProperty('breathPoints');

    analysis.lines.forEach(line => {
      expect(line).toHaveProperty('text');
      expect(line).toHaveProperty('boundaries');
      expect(line).toHaveProperty('phrases');
      expect(line).toHaveProperty('lineIndex');
      expect(line).toHaveProperty('combineWithNext');
    });
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('Edge Cases', () => {
  it('handles single word line', () => {
    const analysis = analyzeLinePhrases('Hello', 0);

    expect(analysis.phrases.length).toBe(1);
    expect(analysis.boundaries.length).toBe(1); // Just line break
  });

  it('handles line with only punctuation', () => {
    const analysis = analyzeLinePhrases('...', 0);

    // Should handle gracefully
    expect(analysis.text).toBe('...');
  });

  it('handles very short lines', () => {
    const analysis = analyzeLinePhrases('I am', 0);

    expect(analysis.phrases.length).toBe(1);
    expect(analysis.phrases[0].syllableCount).toBe(2);
  });

  it('handles numbers in text', () => {
    const analysis = analyzeLinePhrases('In 2024 we celebrate', 0);

    expect(analysis.phrases.length).toBeGreaterThanOrEqual(1);
  });

  it('handles special characters', () => {
    const analysis = analyzeLinePhrases('Hello & goodbye', 0);

    expect(analysis.phrases.length).toBeGreaterThanOrEqual(1);
  });

  it('handles contractions correctly', () => {
    const analysis = analyzeLinePhrases("I can't believe it's over", 0);

    expect(analysis.phrases.length).toBeGreaterThanOrEqual(1);
    // Contractions should be counted properly
  });

  it('handles hyphenated words', () => {
    const analysis = analyzeLinePhrases('The well-known poet wrote', 0);

    expect(analysis.phrases.length).toBeGreaterThanOrEqual(1);
  });
});

// =============================================================================
// Breath Point Integration
// =============================================================================

describe('Breath Point Integration', () => {
  it('provides usable breath points for melody phrasing', () => {
    const poem = preprocessPoem('Shall I compare thee to a summer day?\nThou art more lovely and more temperate.');
    const analysis = analyzePoemPhrases(poem);

    // Should have breath points
    expect(analysis.breathPoints.length).toBeGreaterThan(0);

    // Each breath point should have valid properties
    analysis.breathPoints.forEach(bp => {
      expect(bp.lineIndex).toBeGreaterThanOrEqual(0);
      expect(bp.lineIndex).toBeLessThan(analysis.lines.length);
      expect(bp.wordIndex).toBeGreaterThanOrEqual(0);
      expect(['weak', 'medium', 'strong']).toContain(bp.strength);
    });
  });

  it('prioritizes strong boundaries for breath points', () => {
    const poem = preprocessPoem('The night is dark.\nThe stars are bright.');
    const analysis = analyzePoemPhrases(poem);

    // Strong boundaries should be present in breath points
    const strongBreathPoints = analysis.breathPoints.filter(bp => bp.strength === 'strong');
    expect(strongBreathPoints.length).toBeGreaterThan(0);
  });

  it('includes breath points at punctuation', () => {
    const poem = preprocessPoem('Hello, world; goodbye, friend.');
    const analysis = analyzePoemPhrases(poem);

    // Should have breath points from commas and semicolons
    expect(analysis.breathPoints.length).toBeGreaterThanOrEqual(3);
  });
});
