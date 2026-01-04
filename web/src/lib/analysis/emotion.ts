/**
 * Ghost Note - Emotion Analysis Module
 *
 * This module provides sentiment and emotion analysis for poems.
 * Based on the analysis pipeline defined in docs/ANALYSIS_PIPELINE.md Stage 8.
 *
 * @module lib/analysis/emotion
 */

import Sentiment from 'sentiment';

import type {
  MusicalMode,
  VocalRegister,
  EmotionalArcEntry,
  EmotionalAnalysis,
} from '../../types/analysis';

// =============================================================================
// Types
// =============================================================================

/**
 * Sentiment score from the sentiment analysis
 */
export interface SentimentScore {
  /** Overall score (negative values = negative sentiment, positive = positive) */
  score: number;
  /** Comparative score (normalized by word count) */
  comparative: number;
  /** Words that contributed positively */
  positive: string[];
  /** Words that contributed negatively */
  negative: string[];
}

/**
 * Detected emotional keyword with its emotion category
 */
export interface EmotionKeyword {
  /** The word that was detected */
  word: string;
  /** The emotion category it belongs to */
  emotion: EmotionCategory;
  /** Intensity of the emotion (0-1) */
  intensity: number;
}

/**
 * Point in the valence-arousal space
 * Based on Russell's circumplex model of affect
 */
export interface VAPoint {
  /** Valence: 0 (negative) to 1 (positive) */
  valence: number;
  /** Arousal: 0 (calm/low energy) to 1 (excited/high energy) */
  arousal: number;
}

/**
 * Musical parameters suggested based on emotion
 */
export interface MusicParams {
  /** Major or minor mode */
  mode: MusicalMode;
  /** Suggested tempo range [min, max] BPM */
  tempoRange: [number, number];
  /** Suggested vocal register */
  register: VocalRegister;
  /** Suggested key signature */
  suggestedKey: string;
  /** Suggested dynamics (soft to loud) */
  dynamics: 'soft' | 'moderate' | 'loud';
}

/**
 * Emotional arc tracking across stanzas
 */
export interface EmotionArc {
  /** Per-stanza emotion data */
  entries: EmotionalArcEntry[];
  /** Overall trajectory: rising, falling, stable, varied */
  trajectory: 'rising' | 'falling' | 'stable' | 'varied';
  /** Emotional range (max - min sentiment) */
  range: number;
  /** Stanza with peak emotional intensity */
  peakStanza: number;
}

/**
 * Emotion categories for keyword detection
 */
export type EmotionCategory =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'peaceful'
  | 'tense'
  | 'nostalgic'
  | 'hopeful'
  | 'fearful'
  | 'loving'
  | 'lonely';

// =============================================================================
// Constants
// =============================================================================

/**
 * Emotion keyword lexicon organized by category
 * Each word has an associated intensity (0-1)
 */
const EMOTION_LEXICON: Record<EmotionCategory, Record<string, number>> = {
  happy: {
    joy: 1.0,
    happy: 1.0,
    joyful: 1.0,
    delight: 0.9,
    delighted: 0.9,
    cheerful: 0.8,
    merry: 0.8,
    glad: 0.7,
    pleased: 0.7,
    content: 0.6,
    smile: 0.7,
    laugh: 0.8,
    laughter: 0.8,
    celebrate: 0.9,
    bliss: 1.0,
    blissful: 1.0,
    ecstatic: 1.0,
    elated: 0.9,
    jubilant: 0.9,
    radiant: 0.8,
    bright: 0.6,
    sunshine: 0.7,
    wonderful: 0.8,
    amazing: 0.8,
    fantastic: 0.8,
    brilliant: 0.7,
  },
  sad: {
    sad: 1.0,
    sadness: 1.0,
    sorrow: 1.0,
    grief: 1.0,
    grieve: 1.0,
    mourn: 0.9,
    mourning: 0.9,
    weep: 0.9,
    weeping: 0.9,
    cry: 0.8,
    crying: 0.8,
    tears: 0.7,
    tear: 0.6,
    melancholy: 0.9,
    melancholic: 0.9,
    despair: 1.0,
    hopeless: 0.9,
    gloomy: 0.7,
    gloom: 0.7,
    misery: 1.0,
    miserable: 1.0,
    heartbreak: 1.0,
    heartbroken: 1.0,
    woe: 0.9,
    lament: 0.8,
    anguish: 1.0,
    dejected: 0.8,
    somber: 0.7,
    bleak: 0.8,
  },
  angry: {
    angry: 1.0,
    anger: 1.0,
    rage: 1.0,
    fury: 1.0,
    furious: 1.0,
    wrath: 1.0,
    hate: 0.9,
    hatred: 0.9,
    loathe: 0.9,
    despise: 0.8,
    bitter: 0.7,
    bitterness: 0.7,
    resentment: 0.8,
    resent: 0.7,
    outrage: 0.9,
    outraged: 0.9,
    enraged: 1.0,
    hostile: 0.8,
    fierce: 0.7,
    violent: 0.9,
    vengeance: 0.9,
    revenge: 0.8,
    scorn: 0.7,
    contempt: 0.8,
  },
  peaceful: {
    peace: 1.0,
    peaceful: 1.0,
    calm: 0.9,
    calming: 0.9,
    serene: 1.0,
    serenity: 1.0,
    tranquil: 1.0,
    tranquility: 1.0,
    quiet: 0.7,
    stillness: 0.8,
    still: 0.6,
    gentle: 0.8,
    soft: 0.6,
    soothing: 0.9,
    relaxed: 0.8,
    rest: 0.6,
    resting: 0.6,
    harmony: 0.9,
    harmonious: 0.9,
    placid: 0.8,
    mellow: 0.7,
    ease: 0.7,
    comfortable: 0.6,
    content: 0.7,
    dream: 0.6,
    dreaming: 0.6,
  },
  tense: {
    tense: 1.0,
    tension: 1.0,
    anxious: 0.9,
    anxiety: 0.9,
    nervous: 0.8,
    worry: 0.8,
    worried: 0.8,
    stress: 0.8,
    stressed: 0.8,
    restless: 0.7,
    uneasy: 0.7,
    dread: 0.9,
    apprehension: 0.8,
    suspense: 0.7,
    agitated: 0.8,
    turmoil: 0.9,
    chaos: 0.8,
    conflict: 0.7,
    struggle: 0.7,
    fight: 0.6,
    storm: 0.7,
    stormy: 0.7,
    dark: 0.5,
    darkness: 0.6,
    shadow: 0.5,
    shadows: 0.5,
  },
  nostalgic: {
    nostalgic: 1.0,
    nostalgia: 1.0,
    memory: 0.7,
    memories: 0.7,
    remember: 0.7,
    remembrance: 0.8,
    yesterday: 0.6,
    past: 0.5,
    ago: 0.4,
    once: 0.4,
    childhood: 0.7,
    youth: 0.6,
    young: 0.5,
    old: 0.5,
    ancient: 0.5,
    forgotten: 0.7,
    faded: 0.6,
    bygone: 0.7,
    longing: 0.8,
    wistful: 0.9,
    bittersweet: 0.8,
    reminisce: 0.8,
    echo: 0.5,
    echoes: 0.5,
    ghost: 0.6,
    ghosts: 0.6,
  },
  hopeful: {
    hope: 1.0,
    hopeful: 1.0,
    hoping: 0.9,
    dream: 0.7,
    dreams: 0.7,
    dreaming: 0.7,
    wish: 0.7,
    wishing: 0.7,
    aspire: 0.8,
    aspiration: 0.8,
    believe: 0.8,
    faith: 0.9,
    trust: 0.7,
    promise: 0.7,
    tomorrow: 0.6,
    future: 0.6,
    new: 0.5,
    begin: 0.6,
    beginning: 0.6,
    dawn: 0.7,
    sunrise: 0.7,
    light: 0.6,
    rise: 0.6,
    rising: 0.6,
    grow: 0.5,
    growing: 0.5,
    bloom: 0.7,
    spring: 0.6,
  },
  fearful: {
    fear: 1.0,
    fearful: 1.0,
    afraid: 1.0,
    scared: 0.9,
    terrified: 1.0,
    terror: 1.0,
    horror: 1.0,
    horrified: 1.0,
    dread: 0.9,
    dreading: 0.9,
    panic: 0.9,
    fright: 0.8,
    frightened: 0.8,
    nightmare: 0.9,
    haunt: 0.7,
    haunted: 0.7,
    creep: 0.6,
    creeping: 0.6,
    shiver: 0.6,
    tremble: 0.7,
    trembling: 0.7,
    chill: 0.5,
    cold: 0.4,
    danger: 0.7,
    dangerous: 0.7,
    threat: 0.7,
    doom: 0.9,
  },
  loving: {
    love: 1.0,
    loving: 1.0,
    beloved: 1.0,
    adore: 0.9,
    adoring: 0.9,
    cherish: 0.9,
    cherished: 0.9,
    affection: 0.8,
    affectionate: 0.8,
    tender: 0.8,
    tenderness: 0.8,
    warm: 0.6,
    warmth: 0.7,
    embrace: 0.7,
    embracing: 0.7,
    kiss: 0.7,
    caress: 0.7,
    heart: 0.6,
    sweetheart: 0.8,
    darling: 0.8,
    dear: 0.6,
    devotion: 0.9,
    devoted: 0.9,
    passion: 0.9,
    passionate: 0.9,
    romance: 0.8,
    romantic: 0.8,
  },
  lonely: {
    lonely: 1.0,
    loneliness: 1.0,
    alone: 0.8,
    solitary: 0.7,
    solitude: 0.6,
    isolated: 0.8,
    isolation: 0.8,
    abandoned: 0.9,
    forsaken: 0.9,
    deserted: 0.8,
    empty: 0.6,
    emptiness: 0.7,
    void: 0.7,
    lost: 0.6,
    missing: 0.6,
    apart: 0.5,
    distant: 0.5,
    distance: 0.5,
    far: 0.4,
    away: 0.4,
    gone: 0.5,
    leaving: 0.5,
    left: 0.5,
    farewell: 0.6,
    goodbye: 0.6,
    parting: 0.6,
  },
};

/**
 * Mapping from emotion categories to valence-arousal coordinates
 * Based on Russell's circumplex model
 */
const EMOTION_TO_VA: Record<EmotionCategory, VAPoint> = {
  happy: { valence: 0.9, arousal: 0.7 },
  sad: { valence: 0.2, arousal: 0.3 },
  angry: { valence: 0.2, arousal: 0.9 },
  peaceful: { valence: 0.7, arousal: 0.2 },
  tense: { valence: 0.3, arousal: 0.8 },
  nostalgic: { valence: 0.4, arousal: 0.3 },
  hopeful: { valence: 0.8, arousal: 0.5 },
  fearful: { valence: 0.1, arousal: 0.8 },
  loving: { valence: 0.9, arousal: 0.5 },
  lonely: { valence: 0.2, arousal: 0.2 },
};

/**
 * Mapping from emotion categories to musical parameters
 * Based on docs/ANALYSIS_PIPELINE.md and docs/MELODY_GENERATION.md
 */
const EMOTION_TO_MUSIC: Record<EmotionCategory, MusicParams> = {
  happy: {
    mode: 'major',
    tempoRange: [100, 140],
    register: 'high',
    suggestedKey: 'G',
    dynamics: 'loud',
  },
  sad: {
    mode: 'minor',
    tempoRange: [60, 80],
    register: 'low',
    suggestedKey: 'Am',
    dynamics: 'soft',
  },
  angry: {
    mode: 'minor',
    tempoRange: [120, 160],
    register: 'varied',
    suggestedKey: 'Dm',
    dynamics: 'loud',
  },
  peaceful: {
    mode: 'major',
    tempoRange: [60, 90],
    register: 'middle',
    suggestedKey: 'F',
    dynamics: 'soft',
  },
  tense: {
    mode: 'minor',
    tempoRange: [80, 110],
    register: 'middle',
    suggestedKey: 'Em',
    dynamics: 'moderate',
  },
  nostalgic: {
    mode: 'minor',
    tempoRange: [70, 90],
    register: 'middle',
    suggestedKey: 'Am',
    dynamics: 'moderate',
  },
  hopeful: {
    mode: 'major',
    tempoRange: [90, 120],
    register: 'middle',
    suggestedKey: 'D',
    dynamics: 'moderate',
  },
  fearful: {
    mode: 'minor',
    tempoRange: [90, 130],
    register: 'varied',
    suggestedKey: 'Dm',
    dynamics: 'moderate',
  },
  loving: {
    mode: 'major',
    tempoRange: [70, 100],
    register: 'middle',
    suggestedKey: 'C',
    dynamics: 'soft',
  },
  lonely: {
    mode: 'minor',
    tempoRange: [60, 80],
    register: 'low',
    suggestedKey: 'Em',
    dynamics: 'soft',
  },
};

// =============================================================================
// Sentiment Analysis
// =============================================================================

/** Singleton sentiment analyzer instance */
const sentimentAnalyzer = new Sentiment();

/**
 * Analyzes the sentiment of a text
 *
 * @param text - The text to analyze
 * @returns SentimentScore containing score, comparative, and word lists
 *
 * @example
 * const score = analyzeSentiment("I love the beautiful sunshine");
 * console.log(score.score); // Positive number
 * console.log(score.positive); // ["love", "beautiful"]
 */
export function analyzeSentiment(text: string): SentimentScore {
  if (!text || typeof text !== 'string') {
    console.log('[emotion] analyzeSentiment: received empty or invalid text');
    return {
      score: 0,
      comparative: 0,
      positive: [],
      negative: [],
    };
  }

  const result = sentimentAnalyzer.analyze(text);

  console.log(
    `[emotion] analyzeSentiment: score=${result.score}, comparative=${result.comparative.toFixed(3)}, ` +
      `positive=[${result.positive.join(', ')}], negative=[${result.negative.join(', ')}]`
  );

  return {
    score: result.score,
    comparative: result.comparative,
    positive: result.positive,
    negative: result.negative,
  };
}

// =============================================================================
// Emotional Keyword Detection
// =============================================================================

/**
 * Detects emotional keywords in text
 *
 * @param text - The text to analyze for emotional keywords
 * @returns Array of detected emotion keywords with their categories and intensities
 *
 * @example
 * const keywords = detectEmotionalKeywords("I feel a deep longing and sadness");
 * // Returns: [{ word: "longing", emotion: "nostalgic", intensity: 0.8 }, ...]
 */
export function detectEmotionalKeywords(text: string): EmotionKeyword[] {
  if (!text || typeof text !== 'string') {
    console.log('[emotion] detectEmotionalKeywords: received empty or invalid text');
    return [];
  }

  const keywords: EmotionKeyword[] = [];
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);
  const seenWords = new Set<string>();

  for (const word of words) {
    // Skip if we've already processed this word
    if (seenWords.has(word)) continue;
    seenWords.add(word);

    // Check each emotion category
    for (const [emotionCategory, lexicon] of Object.entries(EMOTION_LEXICON)) {
      if (word in lexicon) {
        keywords.push({
          word,
          emotion: emotionCategory as EmotionCategory,
          intensity: lexicon[word],
        });
      }
    }
  }

  console.log(
    `[emotion] detectEmotionalKeywords: found ${keywords.length} keywords: ` +
      keywords.map((k) => `${k.word}(${k.emotion})`).join(', ')
  );

  return keywords;
}

// =============================================================================
// Valence-Arousal Mapping
// =============================================================================

/**
 * Maps a sentiment score to valence-arousal space
 *
 * Uses the sentiment comparative score to determine valence,
 * and the absolute intensity to estimate arousal.
 *
 * @param sentiment - The sentiment score to map
 * @returns VAPoint with valence and arousal values (0-1)
 *
 * @example
 * const va = mapToValenceArousal({ score: 5, comparative: 0.5, positive: [], negative: [] });
 * console.log(va.valence); // ~0.75 (positive)
 * console.log(va.arousal); // ~0.5 (moderate intensity)
 */
export function mapToValenceArousal(sentiment: SentimentScore): VAPoint {
  // Map comparative score (-1 to 1 typical range) to valence (0 to 1)
  // Clamp to reasonable bounds
  const clampedComparative = Math.max(-1, Math.min(1, sentiment.comparative));
  const valence = (clampedComparative + 1) / 2;

  // Estimate arousal from absolute score and word counts
  // Higher absolute scores and more emotional words = higher arousal
  const wordCount = sentiment.positive.length + sentiment.negative.length;
  const scoreIntensity = Math.min(Math.abs(sentiment.score) / 10, 1);
  const wordIntensity = Math.min(wordCount / 5, 1);
  const arousal = (scoreIntensity + wordIntensity) / 2;

  console.log(
    `[emotion] mapToValenceArousal: valence=${valence.toFixed(3)}, arousal=${arousal.toFixed(3)}`
  );

  return { valence, arousal };
}

/**
 * Blends emotional keywords into a valence-arousal point
 * Combines keyword-based emotions with their intensities
 *
 * @param keywords - Array of detected emotional keywords
 * @returns Weighted average VAPoint based on keywords
 */
function blendKeywordEmotions(keywords: EmotionKeyword[]): VAPoint {
  if (keywords.length === 0) {
    return { valence: 0.5, arousal: 0.5 };
  }

  let totalWeight = 0;
  let weightedValence = 0;
  let weightedArousal = 0;

  for (const keyword of keywords) {
    const va = EMOTION_TO_VA[keyword.emotion];
    const weight = keyword.intensity;

    weightedValence += va.valence * weight;
    weightedArousal += va.arousal * weight;
    totalWeight += weight;
  }

  return {
    valence: weightedValence / totalWeight,
    arousal: weightedArousal / totalWeight,
  };
}

// =============================================================================
// Musical Parameter Suggestion
// =============================================================================

/**
 * Maps valence-arousal point to the closest emotion category
 *
 * @param va - The valence-arousal point
 * @returns Closest matching emotion category
 */
function vaToEmotion(va: VAPoint): EmotionCategory {
  let minDistance = Infinity;
  let closestEmotion: EmotionCategory = 'peaceful';

  for (const [emotion, targetVA] of Object.entries(EMOTION_TO_VA)) {
    const distance = Math.sqrt(
      Math.pow(va.valence - targetVA.valence, 2) + Math.pow(va.arousal - targetVA.arousal, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestEmotion = emotion as EmotionCategory;
    }
  }

  return closestEmotion;
}

/**
 * Suggests musical parameters based on emotional analysis
 *
 * @param analysis - Complete emotion analysis data
 * @returns MusicParams with mode, tempo, register, key, and dynamics
 *
 * @example
 * const params = suggestMusicalParameters({
 *   overallSentiment: -0.3,
 *   valence: 0.3,
 *   arousal: 0.7,
 *   dominantEmotions: ["sad", "tense"],
 *   emotionalArc: { entries: [], trajectory: "stable", range: 0, peakStanza: 0 },
 *   suggestedMusic: { ... }
 * });
 */
export function suggestMusicalParameters(analysis: {
  overallSentiment: number;
  valence: number;
  arousal: number;
  dominantEmotions: string[];
}): MusicParams {
  // Try to use the first dominant emotion if available
  const dominantEmotion =
    analysis.dominantEmotions.length > 0
      ? (analysis.dominantEmotions[0] as EmotionCategory)
      : null;

  // If we have a recognized dominant emotion, use its mapping directly
  if (dominantEmotion && dominantEmotion in EMOTION_TO_MUSIC) {
    console.log(`[emotion] suggestMusicalParameters: using dominant emotion "${dominantEmotion}"`);
    return { ...EMOTION_TO_MUSIC[dominantEmotion] };
  }

  // Otherwise, derive from valence-arousal space
  const closestEmotion = vaToEmotion({ valence: analysis.valence, arousal: analysis.arousal });
  console.log(
    `[emotion] suggestMusicalParameters: derived emotion "${closestEmotion}" from VA space`
  );

  return { ...EMOTION_TO_MUSIC[closestEmotion] };
}

// =============================================================================
// Emotional Arc Analysis
// =============================================================================

/**
 * Analyzes the emotional progression across stanzas
 *
 * @param stanzas - Array of stanzas, where each stanza is an array of lines
 * @returns EmotionArc with per-stanza data and trajectory analysis
 *
 * @example
 * const arc = analyzeEmotionalArc([
 *   ["I feel so happy today", "The sun is shining bright"],
 *   ["But now the clouds have come", "And rain falls on my head"],
 * ]);
 * console.log(arc.trajectory); // "falling" (happy to sad)
 */
export function analyzeEmotionalArc(stanzas: string[][]): EmotionArc {
  if (!stanzas || stanzas.length === 0) {
    console.log('[emotion] analyzeEmotionalArc: received empty stanzas');
    return {
      entries: [],
      trajectory: 'stable',
      range: 0,
      peakStanza: 0,
    };
  }

  const entries: EmotionalArcEntry[] = [];
  let minSentiment = Infinity;
  let maxSentiment = -Infinity;
  let peakStanza = 0;
  let maxAbsSentiment = 0;

  for (let i = 0; i < stanzas.length; i++) {
    const stanzaText = stanzas[i].join(' ');
    const sentiment = analyzeSentiment(stanzaText);
    const keywords = detectEmotionalKeywords(stanzaText);

    // Normalize sentiment to -1 to 1 range
    const normalizedSentiment = Math.max(-1, Math.min(1, sentiment.comparative));

    // Track min/max for range and trajectory
    minSentiment = Math.min(minSentiment, normalizedSentiment);
    maxSentiment = Math.max(maxSentiment, normalizedSentiment);

    // Track peak emotional intensity
    const absSentiment = Math.abs(normalizedSentiment);
    if (absSentiment > maxAbsSentiment) {
      maxAbsSentiment = absSentiment;
      peakStanza = i;
    }

    entries.push({
      stanza: i,
      sentiment: normalizedSentiment,
      keywords: keywords.map((k) => k.word),
    });
  }

  // Determine trajectory
  const range = stanzas.length > 0 ? maxSentiment - minSentiment : 0;
  const trajectory = determineTrajectory(entries);

  console.log(
    `[emotion] analyzeEmotionalArc: ${entries.length} stanzas, trajectory="${trajectory}", range=${range.toFixed(3)}, peak at stanza ${peakStanza}`
  );

  return {
    entries,
    trajectory,
    range,
    peakStanza,
  };
}

/**
 * Determines the emotional trajectory from arc entries
 *
 * @param entries - Array of emotional arc entries
 * @returns Trajectory type: rising, falling, stable, or varied
 */
function determineTrajectory(
  entries: EmotionalArcEntry[]
): 'rising' | 'falling' | 'stable' | 'varied' {
  if (entries.length < 2) {
    return 'stable';
  }

  const firstThird = entries.slice(0, Math.ceil(entries.length / 3));
  const lastThird = entries.slice(-Math.ceil(entries.length / 3));

  const avgFirst =
    firstThird.reduce((sum, e) => sum + e.sentiment, 0) / firstThird.length;
  const avgLast =
    lastThird.reduce((sum, e) => sum + e.sentiment, 0) / lastThird.length;

  const difference = avgLast - avgFirst;
  const directionThreshold = 0.15; // Threshold for considering a change significant

  // Calculate variance to detect varied patterns
  const mean = entries.reduce((sum, e) => sum + e.sentiment, 0) / entries.length;
  const variance =
    entries.reduce((sum, e) => sum + Math.pow(e.sentiment - mean, 2), 0) / entries.length;

  // First check for clear directional trends (stronger signal)
  // A clear trend has significant direction change
  const absDifference = Math.abs(difference);

  if (absDifference > directionThreshold) {
    // Clear directional change - prioritize this over variance
    if (difference > 0) {
      return 'rising';
    } else {
      return 'falling';
    }
  }

  // If no clear direction, check for high variance (oscillating pattern)
  // Use a higher threshold to avoid false positives
  if (variance > 0.15) {
    return 'varied';
  }

  return 'stable';
}

// =============================================================================
// Complete Analysis Function
// =============================================================================

/**
 * Performs complete emotional analysis on a poem
 *
 * This is the main entry point that combines all analysis functions.
 *
 * @param text - Full poem text
 * @param stanzas - Poem broken into stanzas (array of line arrays)
 * @returns Complete EmotionalAnalysis matching the types/analysis.ts interface
 *
 * @example
 * const analysis = analyzeEmotion(
 *   "Roses are red, violets are blue",
 *   [["Roses are red", "violets are blue"]]
 * );
 */
export function analyzeEmotion(text: string, stanzas: string[][]): EmotionalAnalysis {
  console.log('[emotion] analyzeEmotion: starting analysis');

  // Analyze overall sentiment
  const sentiment = analyzeSentiment(text);

  // Detect emotional keywords
  const keywords = detectEmotionalKeywords(text);

  // Map to valence-arousal space
  const sentimentVA = mapToValenceArousal(sentiment);
  const keywordVA = blendKeywordEmotions(keywords);

  // Blend the two VA sources (weighted average)
  const valence = sentimentVA.valence * 0.4 + keywordVA.valence * 0.6;
  const arousal = sentimentVA.arousal * 0.4 + keywordVA.arousal * 0.6;

  // Determine dominant emotions
  const emotionCounts: Record<string, number> = {};
  for (const keyword of keywords) {
    emotionCounts[keyword.emotion] = (emotionCounts[keyword.emotion] || 0) + keyword.intensity;
  }

  const dominantEmotions = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([emotion]) => emotion);

  // If no keyword-based emotions, derive from VA space
  if (dominantEmotions.length === 0) {
    const derivedEmotion = vaToEmotion({ valence, arousal });
    dominantEmotions.push(derivedEmotion);
  }

  // Analyze emotional arc
  const emotionalArc = analyzeEmotionalArc(stanzas);

  // Get music parameters
  const musicParams = suggestMusicalParameters({
    overallSentiment: sentiment.comparative,
    valence,
    arousal,
    dominantEmotions,
  });

  // Convert to the expected output format
  const result: EmotionalAnalysis = {
    overallSentiment: Math.max(-1, Math.min(1, sentiment.comparative)),
    arousal,
    dominantEmotions,
    emotionalArc: emotionalArc.entries,
    suggestedMusicParams: {
      mode: musicParams.mode,
      tempoRange: musicParams.tempoRange,
      register: musicParams.register,
    },
  };

  console.log(
    `[emotion] analyzeEmotion: complete - sentiment=${result.overallSentiment.toFixed(3)}, ` +
      `arousal=${result.arousal.toFixed(3)}, dominantEmotions=[${result.dominantEmotions.join(', ')}]`
  );

  return result;
}

// =============================================================================
// Exports
// =============================================================================

export type { EmotionCategory };
export { EMOTION_LEXICON, EMOTION_TO_VA, EMOTION_TO_MUSIC };
