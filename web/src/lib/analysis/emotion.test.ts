import { describe, it, expect } from 'vitest';
import {
  analyzeSentiment,
  detectEmotionalKeywords,
  mapToValenceArousal,
  suggestMusicalParameters,
  analyzeEmotionalArc,
  analyzeEmotion,
  EMOTION_LEXICON,
  EMOTION_TO_VA,
  EMOTION_TO_MUSIC,
} from './emotion';
import type { SentimentScore } from './emotion';

// =============================================================================
// Test Data: Sample Poems
// =============================================================================

const HAPPY_POEM = `
The sun shines bright with joy today,
My heart is filled with bliss.
The birds sing happy melodies,
A day of pure delight and bliss.
`;

const SAD_POEM = `
In the depths of sorrow I weep,
My tears fall like autumn rain.
The grief weighs heavy on my soul,
A melancholy, endless pain.
`;

const PEACEFUL_POEM = `
The gentle stream flows calm and still,
Through meadows soft and green.
A tranquil place of serene rest,
The most peaceful I have seen.
`;

const ANGRY_POEM = `
My fury burns with bitter rage,
This hatred I cannot contain.
The wrath inside me screams for vengeance,
A violent storm of pain.
`;

const TENSE_POEM = `
In shadows dark I sense the dread,
My heart beats fast with anxious fear.
The storm approaches, tension rises,
Danger lurking ever near.
`;

const NOSTALGIC_POEM = `
I remember days of yesterday,
When youth and innocence were mine.
Those bittersweet forgotten memories,
Still echo through the mists of time.
`;

const MIXED_POEM_STANZAS = [
  ['The morning brings such joy and light', 'Happy birds sing overhead'],
  ['But shadows creep as day grows old', 'Sadness fills my weary heart'],
  ['Yet hope remains within my soul', 'Tomorrow brings another chance'],
];

// =============================================================================
// analyzeSentiment Tests
// =============================================================================

describe('analyzeSentiment', () => {
  it('returns positive score for happy text', () => {
    const result = analyzeSentiment('I love this wonderful amazing day');

    expect(result.score).toBeGreaterThan(0);
    expect(result.comparative).toBeGreaterThan(0);
    expect(result.positive.length).toBeGreaterThan(0);
  });

  it('returns negative score for sad text', () => {
    const result = analyzeSentiment('I hate this terrible awful day');

    expect(result.score).toBeLessThan(0);
    expect(result.comparative).toBeLessThan(0);
    expect(result.negative.length).toBeGreaterThan(0);
  });

  it('returns neutral score for neutral text', () => {
    const result = analyzeSentiment('The table is made of wood');

    expect(result.score).toBe(0);
    expect(result.comparative).toBe(0);
  });

  it('handles empty string', () => {
    const result = analyzeSentiment('');

    expect(result.score).toBe(0);
    expect(result.comparative).toBe(0);
    expect(result.positive).toEqual([]);
    expect(result.negative).toEqual([]);
  });

  it('handles null/undefined input gracefully', () => {
    const result1 = analyzeSentiment(null as unknown as string);
    const result2 = analyzeSentiment(undefined as unknown as string);

    expect(result1.score).toBe(0);
    expect(result2.score).toBe(0);
  });

  it('correctly identifies positive and negative words', () => {
    const result = analyzeSentiment('I love happy things but hate sad things');

    expect(result.positive).toContain('love');
    expect(result.positive).toContain('happy');
    expect(result.negative).toContain('hate');
    expect(result.negative).toContain('sad');
  });

  it('returns correct structure', () => {
    const result = analyzeSentiment('test');

    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('comparative');
    expect(result).toHaveProperty('positive');
    expect(result).toHaveProperty('negative');
    expect(Array.isArray(result.positive)).toBe(true);
    expect(Array.isArray(result.negative)).toBe(true);
  });

  it('scores happy poem as positive', () => {
    const result = analyzeSentiment(HAPPY_POEM);

    expect(result.score).toBeGreaterThan(0);
    expect(result.comparative).toBeGreaterThan(0);
  });

  it('scores sad poem as negative', () => {
    const result = analyzeSentiment(SAD_POEM);

    expect(result.score).toBeLessThan(0);
    expect(result.comparative).toBeLessThan(0);
  });
});

// =============================================================================
// detectEmotionalKeywords Tests
// =============================================================================

describe('detectEmotionalKeywords', () => {
  it('detects happy keywords', () => {
    const result = detectEmotionalKeywords('I feel such joy and happiness today');

    expect(result.length).toBeGreaterThan(0);
    expect(result.some((k) => k.emotion === 'happy')).toBe(true);
  });

  it('detects sad keywords', () => {
    const result = detectEmotionalKeywords('Grief and sorrow fill my heart');

    expect(result.length).toBeGreaterThan(0);
    expect(result.some((k) => k.emotion === 'sad')).toBe(true);
  });

  it('detects peaceful keywords', () => {
    const result = detectEmotionalKeywords('A calm and tranquil scene of serenity');

    expect(result.length).toBeGreaterThan(0);
    expect(result.some((k) => k.emotion === 'peaceful')).toBe(true);
  });

  it('detects angry keywords', () => {
    const result = detectEmotionalKeywords('Rage and fury consume my thoughts');

    expect(result.length).toBeGreaterThan(0);
    expect(result.some((k) => k.emotion === 'angry')).toBe(true);
  });

  it('detects tense keywords', () => {
    const result = detectEmotionalKeywords('Anxiety and tension fill the air');

    expect(result.length).toBeGreaterThan(0);
    expect(result.some((k) => k.emotion === 'tense')).toBe(true);
  });

  it('detects nostalgic keywords', () => {
    const result = detectEmotionalKeywords('Memories of the past bring nostalgic longing');

    expect(result.length).toBeGreaterThan(0);
    expect(result.some((k) => k.emotion === 'nostalgic')).toBe(true);
  });

  it('detects hopeful keywords', () => {
    const result = detectEmotionalKeywords('Hope and faith light the way forward');

    expect(result.length).toBeGreaterThan(0);
    expect(result.some((k) => k.emotion === 'hopeful')).toBe(true);
  });

  it('detects fearful keywords', () => {
    const result = detectEmotionalKeywords('Terror and dread grip my soul');

    expect(result.length).toBeGreaterThan(0);
    expect(result.some((k) => k.emotion === 'fearful')).toBe(true);
  });

  it('detects loving keywords', () => {
    const result = detectEmotionalKeywords('Love and affection warm my heart');

    expect(result.length).toBeGreaterThan(0);
    expect(result.some((k) => k.emotion === 'loving')).toBe(true);
  });

  it('detects lonely keywords', () => {
    const result = detectEmotionalKeywords('Loneliness and isolation consume me');

    expect(result.length).toBeGreaterThan(0);
    expect(result.some((k) => k.emotion === 'lonely')).toBe(true);
  });

  it('returns empty array for text with no emotional keywords', () => {
    const result = detectEmotionalKeywords('The table has four wooden legs');

    expect(result).toEqual([]);
  });

  it('handles empty string', () => {
    const result = detectEmotionalKeywords('');

    expect(result).toEqual([]);
  });

  it('handles null/undefined input gracefully', () => {
    const result1 = detectEmotionalKeywords(null as unknown as string);
    const result2 = detectEmotionalKeywords(undefined as unknown as string);

    expect(result1).toEqual([]);
    expect(result2).toEqual([]);
  });

  it('returns keywords with correct structure', () => {
    const result = detectEmotionalKeywords('joy and sorrow mixed together');

    for (const keyword of result) {
      expect(keyword).toHaveProperty('word');
      expect(keyword).toHaveProperty('emotion');
      expect(keyword).toHaveProperty('intensity');
      expect(typeof keyword.word).toBe('string');
      expect(typeof keyword.emotion).toBe('string');
      expect(typeof keyword.intensity).toBe('number');
      expect(keyword.intensity).toBeGreaterThanOrEqual(0);
      expect(keyword.intensity).toBeLessThanOrEqual(1);
    }
  });

  it('does not duplicate keywords for repeated words', () => {
    const result = detectEmotionalKeywords('happy happy happy joy joy');

    const happyCount = result.filter((k) => k.word === 'happy').length;
    const joyCount = result.filter((k) => k.word === 'joy').length;

    expect(happyCount).toBe(1);
    expect(joyCount).toBe(1);
  });

  it('is case insensitive', () => {
    const result1 = detectEmotionalKeywords('JOY');
    const result2 = detectEmotionalKeywords('joy');
    const result3 = detectEmotionalKeywords('Joy');

    expect(result1.length).toBe(1);
    expect(result2.length).toBe(1);
    expect(result3.length).toBe(1);
    expect(result1[0].emotion).toBe(result2[0].emotion);
    expect(result2[0].emotion).toBe(result3[0].emotion);
  });
});

// =============================================================================
// mapToValenceArousal Tests
// =============================================================================

describe('mapToValenceArousal', () => {
  it('maps positive sentiment to high valence', () => {
    const sentiment: SentimentScore = {
      score: 10,
      comparative: 0.5,
      positive: ['love', 'happy', 'joy'],
      negative: [],
    };

    const result = mapToValenceArousal(sentiment);

    expect(result.valence).toBeGreaterThan(0.5);
  });

  it('maps negative sentiment to low valence', () => {
    const sentiment: SentimentScore = {
      score: -10,
      comparative: -0.5,
      positive: [],
      negative: ['hate', 'sad', 'grief'],
    };

    const result = mapToValenceArousal(sentiment);

    expect(result.valence).toBeLessThan(0.5);
  });

  it('maps neutral sentiment to middle valence', () => {
    const sentiment: SentimentScore = {
      score: 0,
      comparative: 0,
      positive: [],
      negative: [],
    };

    const result = mapToValenceArousal(sentiment);

    expect(result.valence).toBe(0.5);
  });

  it('maps high intensity to high arousal', () => {
    const sentiment: SentimentScore = {
      score: 20,
      comparative: 0.8,
      positive: ['love', 'amazing', 'incredible', 'wonderful', 'fantastic'],
      negative: [],
    };

    const result = mapToValenceArousal(sentiment);

    expect(result.arousal).toBeGreaterThan(0.5);
  });

  it('maps low intensity to low arousal', () => {
    const sentiment: SentimentScore = {
      score: 1,
      comparative: 0.1,
      positive: ['nice'],
      negative: [],
    };

    const result = mapToValenceArousal(sentiment);

    expect(result.arousal).toBeLessThan(0.5);
  });

  it('returns values in correct range (0-1)', () => {
    const sentiments: SentimentScore[] = [
      { score: 100, comparative: 2, positive: [], negative: [] },
      { score: -100, comparative: -2, positive: [], negative: [] },
      { score: 0, comparative: 0, positive: [], negative: [] },
    ];

    for (const sentiment of sentiments) {
      const result = mapToValenceArousal(sentiment);

      expect(result.valence).toBeGreaterThanOrEqual(0);
      expect(result.valence).toBeLessThanOrEqual(1);
      expect(result.arousal).toBeGreaterThanOrEqual(0);
      expect(result.arousal).toBeLessThanOrEqual(1);
    }
  });

  it('returns correct structure', () => {
    const result = mapToValenceArousal({
      score: 5,
      comparative: 0.3,
      positive: ['happy'],
      negative: [],
    });

    expect(result).toHaveProperty('valence');
    expect(result).toHaveProperty('arousal');
    expect(typeof result.valence).toBe('number');
    expect(typeof result.arousal).toBe('number');
  });
});

// =============================================================================
// suggestMusicalParameters Tests
// =============================================================================

describe('suggestMusicalParameters', () => {
  it('suggests major mode for positive emotions', () => {
    const result = suggestMusicalParameters({
      overallSentiment: 0.7,
      valence: 0.8,
      arousal: 0.6,
      dominantEmotions: ['happy'],
    });

    expect(result.mode).toBe('major');
  });

  it('suggests minor mode for negative emotions', () => {
    const result = suggestMusicalParameters({
      overallSentiment: -0.7,
      valence: 0.2,
      arousal: 0.3,
      dominantEmotions: ['sad'],
    });

    expect(result.mode).toBe('minor');
  });

  it('suggests fast tempo for high arousal', () => {
    const result = suggestMusicalParameters({
      overallSentiment: 0.5,
      valence: 0.9,
      arousal: 0.9,
      dominantEmotions: ['happy'],
    });

    expect(result.tempoRange[0]).toBeGreaterThanOrEqual(100);
  });

  it('suggests slow tempo for low arousal', () => {
    const result = suggestMusicalParameters({
      overallSentiment: -0.3,
      valence: 0.2,
      arousal: 0.2,
      dominantEmotions: ['sad'],
    });

    expect(result.tempoRange[1]).toBeLessThanOrEqual(100);
  });

  it('returns correct structure', () => {
    const result = suggestMusicalParameters({
      overallSentiment: 0,
      valence: 0.5,
      arousal: 0.5,
      dominantEmotions: ['peaceful'],
    });

    expect(result).toHaveProperty('mode');
    expect(result).toHaveProperty('tempoRange');
    expect(result).toHaveProperty('register');
    expect(result).toHaveProperty('suggestedKey');
    expect(result).toHaveProperty('dynamics');
    expect(Array.isArray(result.tempoRange)).toBe(true);
    expect(result.tempoRange.length).toBe(2);
  });

  it('suggests high register for happy emotions', () => {
    const result = suggestMusicalParameters({
      overallSentiment: 0.8,
      valence: 0.9,
      arousal: 0.7,
      dominantEmotions: ['happy'],
    });

    expect(result.register).toBe('high');
  });

  it('suggests low register for sad emotions', () => {
    const result = suggestMusicalParameters({
      overallSentiment: -0.8,
      valence: 0.1,
      arousal: 0.2,
      dominantEmotions: ['sad'],
    });

    expect(result.register).toBe('low');
  });

  it('handles unknown dominant emotions by deriving from VA', () => {
    const result = suggestMusicalParameters({
      overallSentiment: 0.5,
      valence: 0.8,
      arousal: 0.7,
      dominantEmotions: [],
    });

    // Should derive something reasonable from high valence + medium-high arousal
    expect(result.mode).toBeDefined();
    expect(result.tempoRange).toBeDefined();
  });

  it('maps all known emotions correctly', () => {
    const emotions = [
      'happy',
      'sad',
      'angry',
      'peaceful',
      'tense',
      'nostalgic',
      'hopeful',
      'fearful',
      'loving',
      'lonely',
    ];

    for (const emotion of emotions) {
      const result = suggestMusicalParameters({
        overallSentiment: 0,
        valence: 0.5,
        arousal: 0.5,
        dominantEmotions: [emotion],
      });

      expect(result.mode).toMatch(/^(major|minor)$/);
      expect(result.register).toMatch(/^(low|middle|high|varied)$/);
      expect(result.dynamics).toMatch(/^(soft|moderate|loud)$/);
    }
  });
});

// =============================================================================
// analyzeEmotionalArc Tests
// =============================================================================

describe('analyzeEmotionalArc', () => {
  it('detects rising emotional arc', () => {
    const stanzas = [
      ['Sadness fills my weary heart', 'Grief consumes my soul'],
      ['But hope begins to dawn', 'Light breaks through the clouds'],
      ['Joy and happiness abound', 'Bliss fills every moment'],
    ];

    const result = analyzeEmotionalArc(stanzas);

    expect(result.trajectory).toBe('rising');
  });

  it('detects falling emotional arc', () => {
    const stanzas = [
      ['Joy and happiness abound', 'The sun shines bright today'],
      ['But clouds begin to gather', 'Shadows creep across the land'],
      ['Sadness grips my weary heart', 'Tears fall like rain'],
    ];

    const result = analyzeEmotionalArc(stanzas);

    expect(result.trajectory).toBe('falling');
  });

  it('detects stable emotional arc', () => {
    // Use neutral text with similar sentiment across all stanzas
    const stanzas = [
      ['The sky is blue today', 'The clouds float by'],
      ['The trees stand tall', 'The flowers grow'],
      ['The river flows on', 'The path winds through'],
    ];

    const result = analyzeEmotionalArc(stanzas);

    expect(result.trajectory).toBe('stable');
  });

  it('returns correct number of entries', () => {
    const result = analyzeEmotionalArc(MIXED_POEM_STANZAS);

    expect(result.entries.length).toBe(MIXED_POEM_STANZAS.length);
  });

  it('returns entries with correct structure', () => {
    const result = analyzeEmotionalArc(MIXED_POEM_STANZAS);

    for (let i = 0; i < result.entries.length; i++) {
      const entry = result.entries[i];
      expect(entry).toHaveProperty('stanza');
      expect(entry).toHaveProperty('sentiment');
      expect(entry).toHaveProperty('keywords');
      expect(entry.stanza).toBe(i);
      expect(typeof entry.sentiment).toBe('number');
      expect(Array.isArray(entry.keywords)).toBe(true);
    }
  });

  it('calculates emotional range correctly', () => {
    const stanzas = [
      ['Extreme joy and bliss'], // Very positive
      ['Neutral words here'], // Neutral
      ['Deep sorrow and grief'], // Very negative
    ];

    const result = analyzeEmotionalArc(stanzas);

    expect(result.range).toBeGreaterThan(0);
  });

  it('identifies peak emotional stanza', () => {
    const stanzas = [
      ['A normal day begins'],
      ['EXTREME JOY AND BLISS AND HAPPINESS AND LOVE'], // Peak intensity
      ['The day comes to an end'],
    ];

    const result = analyzeEmotionalArc(stanzas);

    expect(result.peakStanza).toBe(1);
  });

  it('handles empty stanzas array', () => {
    const result = analyzeEmotionalArc([]);

    expect(result.entries).toEqual([]);
    expect(result.trajectory).toBe('stable');
    expect(result.range).toBe(0);
    expect(result.peakStanza).toBe(0);
  });

  it('handles single stanza', () => {
    const result = analyzeEmotionalArc([['A single stanza of joy']]);

    expect(result.entries.length).toBe(1);
    expect(result.trajectory).toBe('stable');
  });

  it('handles stanzas with empty lines', () => {
    const stanzas = [['Joy fills the air', ''], ['', 'Happiness abounds']];

    const result = analyzeEmotionalArc(stanzas);

    expect(result.entries.length).toBe(2);
  });

  it('sentiment values are in valid range', () => {
    const result = analyzeEmotionalArc(MIXED_POEM_STANZAS);

    for (const entry of result.entries) {
      expect(entry.sentiment).toBeGreaterThanOrEqual(-1);
      expect(entry.sentiment).toBeLessThanOrEqual(1);
    }
  });
});

// =============================================================================
// analyzeEmotion (Main Function) Tests
// =============================================================================

describe('analyzeEmotion', () => {
  it('returns complete analysis for happy poem', () => {
    const stanzas = HAPPY_POEM.trim()
      .split('\n\n')
      .map((s) => s.split('\n').filter(Boolean));
    const result = analyzeEmotion(HAPPY_POEM, stanzas);

    expect(result.overallSentiment).toBeGreaterThan(0);
    expect(result.dominantEmotions).toContain('happy');
    expect(result.suggestedMusicParams.mode).toBe('major');
  });

  it('returns complete analysis for sad poem', () => {
    const stanzas = SAD_POEM.trim()
      .split('\n\n')
      .map((s) => s.split('\n').filter(Boolean));
    const result = analyzeEmotion(SAD_POEM, stanzas);

    expect(result.overallSentiment).toBeLessThan(0);
    expect(result.dominantEmotions).toContain('sad');
    expect(result.suggestedMusicParams.mode).toBe('minor');
  });

  it('returns complete analysis for peaceful poem', () => {
    const stanzas = PEACEFUL_POEM.trim()
      .split('\n\n')
      .map((s) => s.split('\n').filter(Boolean));
    const result = analyzeEmotion(PEACEFUL_POEM, stanzas);

    expect(result.dominantEmotions).toContain('peaceful');
    expect(result.suggestedMusicParams.tempoRange[1]).toBeLessThanOrEqual(100);
  });

  it('returns complete analysis for angry poem', () => {
    const stanzas = ANGRY_POEM.trim()
      .split('\n\n')
      .map((s) => s.split('\n').filter(Boolean));
    const result = analyzeEmotion(ANGRY_POEM, stanzas);

    expect(result.dominantEmotions).toContain('angry');
    expect(result.suggestedMusicParams.mode).toBe('minor');
  });

  it('returns complete analysis for nostalgic poem', () => {
    const stanzas = NOSTALGIC_POEM.trim()
      .split('\n\n')
      .map((s) => s.split('\n').filter(Boolean));
    const result = analyzeEmotion(NOSTALGIC_POEM, stanzas);

    expect(result.dominantEmotions).toContain('nostalgic');
    expect(result.suggestedMusicParams.mode).toBe('minor');
    expect(result.suggestedMusicParams.tempoRange[1]).toBeLessThanOrEqual(100);
  });

  it('returns analysis with correct interface structure', () => {
    const result = analyzeEmotion('test poem', [['test poem']]);

    expect(result).toHaveProperty('overallSentiment');
    expect(result).toHaveProperty('arousal');
    expect(result).toHaveProperty('dominantEmotions');
    expect(result).toHaveProperty('emotionalArc');
    expect(result).toHaveProperty('suggestedMusicParams');

    expect(result.suggestedMusicParams).toHaveProperty('mode');
    expect(result.suggestedMusicParams).toHaveProperty('tempoRange');
    expect(result.suggestedMusicParams).toHaveProperty('register');
  });

  it('valence and arousal are in valid range', () => {
    const poems = [HAPPY_POEM, SAD_POEM, PEACEFUL_POEM, ANGRY_POEM, TENSE_POEM, NOSTALGIC_POEM];

    for (const poem of poems) {
      const stanzas = poem
        .trim()
        .split('\n\n')
        .map((s) => s.split('\n').filter(Boolean));
      const result = analyzeEmotion(poem, stanzas);

      expect(result.arousal).toBeGreaterThanOrEqual(0);
      expect(result.arousal).toBeLessThanOrEqual(1);
      expect(result.overallSentiment).toBeGreaterThanOrEqual(-1);
      expect(result.overallSentiment).toBeLessThanOrEqual(1);
    }
  });

  it('returns up to 3 dominant emotions', () => {
    const mixedPoem = 'Joy and sorrow, love and fear, hope and despair all mix together here';
    const result = analyzeEmotion(mixedPoem, [[mixedPoem]]);

    expect(result.dominantEmotions.length).toBeLessThanOrEqual(3);
  });

  it('returns at least 1 dominant emotion', () => {
    const neutralPoem = 'The table has four legs made of wood';
    const result = analyzeEmotion(neutralPoem, [[neutralPoem]]);

    expect(result.dominantEmotions.length).toBeGreaterThanOrEqual(1);
  });

  it('emotional arc has entry for each stanza', () => {
    const result = analyzeEmotion(MIXED_POEM_STANZAS.flat().join('\n'), MIXED_POEM_STANZAS);

    expect(result.emotionalArc.length).toBe(MIXED_POEM_STANZAS.length);
  });

  it('handles empty text', () => {
    const result = analyzeEmotion('', []);

    expect(result.overallSentiment).toBe(0);
    expect(result.emotionalArc).toEqual([]);
  });
});

// =============================================================================
// Constants Tests
// =============================================================================

describe('EMOTION_LEXICON', () => {
  it('contains all expected emotion categories', () => {
    const expectedCategories = [
      'happy',
      'sad',
      'angry',
      'peaceful',
      'tense',
      'nostalgic',
      'hopeful',
      'fearful',
      'loving',
      'lonely',
    ];

    for (const category of expectedCategories) {
      expect(EMOTION_LEXICON).toHaveProperty(category);
      expect(Object.keys(EMOTION_LEXICON[category as keyof typeof EMOTION_LEXICON]).length).toBeGreaterThan(
        0
      );
    }
  });

  it('has intensity values between 0 and 1', () => {
    for (const [, words] of Object.entries(EMOTION_LEXICON)) {
      for (const [, intensity] of Object.entries(words)) {
        expect(intensity).toBeGreaterThanOrEqual(0);
        expect(intensity).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('EMOTION_TO_VA', () => {
  it('contains all expected emotion categories', () => {
    const expectedCategories = [
      'happy',
      'sad',
      'angry',
      'peaceful',
      'tense',
      'nostalgic',
      'hopeful',
      'fearful',
      'loving',
      'lonely',
    ];

    for (const category of expectedCategories) {
      expect(EMOTION_TO_VA).toHaveProperty(category);
    }
  });

  it('has valid valence and arousal values', () => {
    for (const [, va] of Object.entries(EMOTION_TO_VA)) {
      expect(va.valence).toBeGreaterThanOrEqual(0);
      expect(va.valence).toBeLessThanOrEqual(1);
      expect(va.arousal).toBeGreaterThanOrEqual(0);
      expect(va.arousal).toBeLessThanOrEqual(1);
    }
  });

  it('positive emotions have high valence', () => {
    expect(EMOTION_TO_VA.happy.valence).toBeGreaterThan(0.5);
    expect(EMOTION_TO_VA.hopeful.valence).toBeGreaterThan(0.5);
    expect(EMOTION_TO_VA.loving.valence).toBeGreaterThan(0.5);
    expect(EMOTION_TO_VA.peaceful.valence).toBeGreaterThan(0.5);
  });

  it('negative emotions have low valence', () => {
    expect(EMOTION_TO_VA.sad.valence).toBeLessThan(0.5);
    expect(EMOTION_TO_VA.angry.valence).toBeLessThan(0.5);
    expect(EMOTION_TO_VA.fearful.valence).toBeLessThan(0.5);
    expect(EMOTION_TO_VA.lonely.valence).toBeLessThan(0.5);
  });

  it('high energy emotions have high arousal', () => {
    expect(EMOTION_TO_VA.angry.arousal).toBeGreaterThan(0.5);
    expect(EMOTION_TO_VA.happy.arousal).toBeGreaterThan(0.5);
    expect(EMOTION_TO_VA.tense.arousal).toBeGreaterThan(0.5);
    expect(EMOTION_TO_VA.fearful.arousal).toBeGreaterThan(0.5);
  });

  it('low energy emotions have low arousal', () => {
    expect(EMOTION_TO_VA.peaceful.arousal).toBeLessThan(0.5);
    expect(EMOTION_TO_VA.sad.arousal).toBeLessThan(0.5);
    expect(EMOTION_TO_VA.lonely.arousal).toBeLessThan(0.5);
    expect(EMOTION_TO_VA.nostalgic.arousal).toBeLessThan(0.5);
  });
});

describe('EMOTION_TO_MUSIC', () => {
  it('contains all expected emotion categories', () => {
    const expectedCategories = [
      'happy',
      'sad',
      'angry',
      'peaceful',
      'tense',
      'nostalgic',
      'hopeful',
      'fearful',
      'loving',
      'lonely',
    ];

    for (const category of expectedCategories) {
      expect(EMOTION_TO_MUSIC).toHaveProperty(category);
    }
  });

  it('has valid tempo ranges', () => {
    for (const [, params] of Object.entries(EMOTION_TO_MUSIC)) {
      expect(params.tempoRange[0]).toBeLessThan(params.tempoRange[1]);
      expect(params.tempoRange[0]).toBeGreaterThanOrEqual(40);
      expect(params.tempoRange[1]).toBeLessThanOrEqual(200);
    }
  });

  it('has valid mode values', () => {
    for (const [, params] of Object.entries(EMOTION_TO_MUSIC)) {
      expect(params.mode).toMatch(/^(major|minor)$/);
    }
  });

  it('has valid register values', () => {
    for (const [, params] of Object.entries(EMOTION_TO_MUSIC)) {
      expect(params.register).toMatch(/^(low|middle|high|varied)$/);
    }
  });

  it('has valid dynamics values', () => {
    for (const [, params] of Object.entries(EMOTION_TO_MUSIC)) {
      expect(params.dynamics).toMatch(/^(soft|moderate|loud)$/);
    }
  });

  it('maps positive emotions to major mode', () => {
    expect(EMOTION_TO_MUSIC.happy.mode).toBe('major');
    expect(EMOTION_TO_MUSIC.hopeful.mode).toBe('major');
    expect(EMOTION_TO_MUSIC.loving.mode).toBe('major');
    expect(EMOTION_TO_MUSIC.peaceful.mode).toBe('major');
  });

  it('maps negative emotions to minor mode', () => {
    expect(EMOTION_TO_MUSIC.sad.mode).toBe('minor');
    expect(EMOTION_TO_MUSIC.angry.mode).toBe('minor');
    expect(EMOTION_TO_MUSIC.tense.mode).toBe('minor');
    expect(EMOTION_TO_MUSIC.fearful.mode).toBe('minor');
    expect(EMOTION_TO_MUSIC.lonely.mode).toBe('minor');
    expect(EMOTION_TO_MUSIC.nostalgic.mode).toBe('minor');
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Integration: Complete Poem Analysis', () => {
  it('analyzes Robert Frost style poem correctly', () => {
    const frostPoem = `
The woods are lovely, dark and deep,
But I have promises to keep,
And miles to go before I sleep,
And miles to go before I sleep.
`;
    const stanzas = [frostPoem.trim().split('\n').filter(Boolean)];
    const result = analyzeEmotion(frostPoem, stanzas);

    // Should detect contemplative/wistful tone
    expect(result.suggestedMusicParams.tempoRange[1]).toBeLessThanOrEqual(120);
  });

  it('analyzes Shakespeare style poem correctly', () => {
    const sonnet = `
Shall I compare thee to a summer's day?
Thou art more lovely and more temperate.
Rough winds do shake the darling buds of May,
And summer's lease hath all too short a date.
`;
    const stanzas = [sonnet.trim().split('\n').filter(Boolean)];
    const result = analyzeEmotion(sonnet, stanzas);

    // Should detect love/beauty theme
    expect(result.dominantEmotions.length).toBeGreaterThan(0);
  });

  it('handles mixed emotion poem across stanzas', () => {
    const result = analyzeEmotion(MIXED_POEM_STANZAS.flat().join('\n'), MIXED_POEM_STANZAS);

    // Should have varied trajectory due to changing emotions
    expect(result.emotionalArc.length).toBe(3);
    // First stanza should be more positive (joy, happy)
    // Middle stanza should be more negative (shadows, sadness)
    // Last stanza should be hopeful
    expect(result.emotionalArc[0].sentiment).toBeGreaterThan(result.emotionalArc[1].sentiment);
  });

  it('produces consistent results for same input', () => {
    const result1 = analyzeEmotion(HAPPY_POEM, [[HAPPY_POEM]]);
    const result2 = analyzeEmotion(HAPPY_POEM, [[HAPPY_POEM]]);

    expect(result1.overallSentiment).toBe(result2.overallSentiment);
    expect(result1.arousal).toBe(result2.arousal);
    expect(result1.dominantEmotions).toEqual(result2.dominantEmotions);
  });
});
