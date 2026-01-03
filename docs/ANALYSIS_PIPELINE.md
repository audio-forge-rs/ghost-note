# Poem Analysis Pipeline

> Technical specification for quantitative poem analysis.

## Overview

The analysis pipeline transforms raw poem text into structured data that Claude can use for qualitative assessment and melody generation.

```
Raw Text → Tokenization → Phonetic Analysis → Prosodic Analysis → Structured Output
```

## Pipeline Stages

### Stage 1: Text Preprocessing

**Input**: Raw poem text (string)

**Operations**:
1. Normalize whitespace
2. Detect stanza breaks (double newlines)
3. Split into lines
4. Preserve original formatting for diff display

**Output**:
```typescript
interface PreprocessedPoem {
  original: string;
  stanzas: string[][];  // stanzas[stanza_idx][line_idx]
  lineCount: number;
  stanzaCount: number;
}
```

### Stage 2: Word Tokenization

**Input**: Lines of text

**Operations**:
1. Split lines into words
2. Handle contractions (e.g., "don't" → ["don't"] not ["don", "t"])
3. Handle hyphenated compounds
4. Preserve punctuation separately

**Output**:
```typescript
interface TokenizedLine {
  words: string[];
  punctuation: { position: number; char: string }[];
}
```

### Stage 3: Phonetic Transcription

**Tool**: CMU Pronouncing Dictionary (via `pronouncing` or direct lookup)

**Input**: Words

**Operations**:
1. Look up each word in CMU dict
2. For unknown words: use fallback (espeak TTS or syllable estimation)
3. Extract phonemes in ARPAbet notation

**ARPAbet Vowels with Stress**:
```
AA0, AA1, AA2  (odd, father)
AE0, AE1, AE2  (at, bat)
AH0, AH1, AH2  (hut, but)
AO0, AO1, AO2  (bought, caught)
AW0, AW1, AW2  (cow, how)
AY0, AY1, AY2  (hide, my)
EH0, EH1, EH2  (ed, bed)
ER0, ER1, ER2  (hurt, bird)
EY0, EY1, EY2  (ate, say)
IH0, IH1, IH2  (it, bit)
IY0, IY1, IY2  (eat, see)
OW0, OW1, OW2  (oat, go)
OY0, OY1, OY2  (toy, boy)
UH0, UH1, UH2  (hood, could)
UW0, UW1, UW2  (two, you)
```

**Output**:
```typescript
interface PhoneticWord {
  text: string;
  phonemes: string[];        // ["HH", "AH0", "L", "OW1"]
  syllableCount: number;     // 2
  stressPattern: string;     // "01" (unstressed, primary)
  inDictionary: boolean;     // true if found in CMU
}
```

### Stage 4: Syllabification

**Tool**: Derive from phonemes (count vowels with stress markers)

**Operations**:
1. Count vowel phonemes (each vowel = one syllable)
2. Group phonemes into syllables
3. Identify syllable boundaries

**Syllable Boundary Rules**:
- Onset maximization: consonants prefer to start syllables
- Codas take remaining consonants
- Complex: use linguistic rules or ML model

**Output**:
```typescript
interface Syllable {
  phonemes: string[];
  stress: 0 | 1 | 2;        // 0=unstressed, 1=primary, 2=secondary
  vowelPhoneme: string;     // The nucleus vowel
  isOpen: boolean;          // Ends in vowel (easier to sustain)
}

interface SyllabifiedWord {
  text: string;
  syllables: Syllable[];
}
```

### Stage 5: Stress Pattern Analysis

**Tool**: Prosodic library (Python) or custom from CMU data

**Operations**:
1. Extract stress from phonetic transcription
2. Build line-level stress pattern
3. Detect meter type

**Meter Detection Algorithm**:
```python
def detect_meter(stress_pattern: str) -> str:
    """
    stress_pattern: string of 0s and 1s (e.g., "01010101")
    Returns: meter name or "irregular"
    """
    patterns = {
        "01": "iambic",      # da-DUM
        "10": "trochaic",    # DUM-da
        "001": "anapestic",  # da-da-DUM
        "100": "dactylic",   # DUM-da-da
        "11": "spondaic",    # DUM-DUM
    }

    # Try each pattern, find best fit
    # Use Levenshtein distance for fuzzy matching
    # Return pattern with lowest distance
```

**Output**:
```typescript
interface MeterAnalysis {
  pattern: string;           // "01010101"
  detectedMeter: string;     // "iambic_tetrameter"
  footType: string;          // "iamb"
  feetPerLine: number;       // 4
  confidence: number;        // 0.0-1.0
  deviations: number[];      // Positions where pattern breaks
}
```

### Stage 6: Rhyme Detection

**Tool**: `pronouncing` library

**Operations**:
1. Extract final syllable phonemes from each line
2. Compare line endings for rhyme
3. Classify rhyme type
4. Build rhyme scheme notation

**Rhyme Classification**:
```python
def classify_rhyme(word1: str, word2: str) -> str:
    """
    Returns: 'perfect', 'slant', 'assonance', 'consonance', 'none'
    """
    phones1 = get_rhyming_part(word1)  # From stressed vowel onward
    phones2 = get_rhyming_part(word2)

    if phones1 == phones2:
        return 'perfect'

    vowels1 = extract_vowels(phones1)
    vowels2 = extract_vowels(phones2)

    if vowels1 == vowels2:
        return 'assonance'  # Same vowels, different consonants

    cons1 = extract_consonants(phones1)
    cons2 = extract_consonants(phones2)

    if cons1 == cons2:
        return 'consonance'  # Same consonants, different vowels

    if similarity(phones1, phones2) > 0.7:
        return 'slant'  # Close but not perfect

    return 'none'
```

**Output**:
```typescript
interface RhymeAnalysis {
  scheme: string;            // "ABAB"
  rhymeGroups: {
    [label: string]: {
      lines: number[];
      rhymeType: 'perfect' | 'slant' | 'assonance' | 'consonance';
      endWords: string[];
    }
  };
  internalRhymes: { line: number; positions: [number, number] }[];
}
```

### Stage 7: Singability Analysis

**Custom Algorithm**

For each syllable, compute a singability score based on:

```typescript
interface SingabilityFactors {
  vowelOpenness: number;     // 0-1: open vowels score higher
  consonantClusters: number; // 0-1: fewer clusters = higher
  sustainability: number;    // 0-1: can this be held on a long note?
  breathability: number;     // 0-1: natural to breathe after?
}
```

**Vowel Openness Scores**:
```javascript
const vowelOpenness = {
  'AA': 1.0,  // "ah" - most open
  'AO': 0.9,  // "aw"
  'AE': 0.8,  // "a" as in cat
  'OW': 0.8,  // "oh"
  'AY': 0.7,  // "eye"
  'EY': 0.7,  // "ay"
  'EH': 0.6,  // "eh"
  'ER': 0.5,  // "er"
  'IY': 0.4,  // "ee"
  'UW': 0.4,  // "oo"
  'IH': 0.3,  // "ih"
  'UH': 0.3,  // "uh"
  'AH': 0.5,  // schwa - varies
};
```

**Consonant Cluster Penalty**:
```javascript
function clusterPenalty(phonemes: string[]): number {
  const consonants = phonemes.filter(p => !isVowel(p));
  if (consonants.length <= 1) return 0;
  if (consonants.length === 2) return 0.2;
  if (consonants.length === 3) return 0.5;
  return 0.8;  // 4+ consonants in cluster
}
```

**Output**:
```typescript
interface SingabilityScore {
  syllableScores: number[];   // Per-syllable 0-1 scores
  lineScore: number;          // Average for line
  problemSpots: {
    position: number;
    issue: string;            // "consonant cluster", "closed vowel", etc.
    severity: 'low' | 'medium' | 'high';
  }[];
}
```

### Stage 8: Emotional Analysis

**Tools**: Sentiment lexicons (VADER, AFINN) + keyword detection

**Operations**:
1. Score overall sentiment (positive/negative)
2. Detect emotional keywords
3. Map to valence-arousal space
4. Suggest musical parameters

**Emotion-to-Music Mapping**:
```typescript
const emotionToMusic = {
  // Valence (positive/negative) → Mode
  // Arousal (intensity) → Tempo

  happy: { mode: 'major', tempoRange: [100, 140], register: 'high' },
  sad: { mode: 'minor', tempoRange: [60, 80], register: 'low' },
  angry: { mode: 'minor', tempoRange: [120, 160], register: 'varied' },
  peaceful: { mode: 'major', tempoRange: [60, 90], register: 'middle' },
  tense: { mode: 'minor', tempoRange: [80, 110], register: 'middle' },
  nostalgic: { mode: 'minor', tempoRange: [70, 90], register: 'middle' },
};
```

**Output**:
```typescript
interface EmotionalAnalysis {
  overallSentiment: number;   // -1 to 1
  arousal: number;            // 0 to 1
  dominantEmotions: string[]; // ["sad", "nostalgic"]
  emotionalArc: {             // Per-stanza progression
    stanza: number;
    sentiment: number;
    keywords: string[];
  }[];
  suggestedMusicParams: {
    mode: 'major' | 'minor';
    tempoRange: [number, number];
    register: 'low' | 'middle' | 'high';
  };
}
```

## Complete Output Schema

```typescript
interface PoemAnalysis {
  // Metadata
  meta: {
    title?: string;
    lineCount: number;
    stanzaCount: number;
    wordCount: number;
    syllableCount: number;
  };

  // Structure
  structure: {
    stanzas: {
      lines: {
        text: string;
        words: SyllabifiedWord[];
        stressPattern: string;
        syllableCount: number;
        singability: SingabilityScore;
      }[];
    }[];
  };

  // Prosody
  prosody: {
    meter: MeterAnalysis;
    rhyme: RhymeAnalysis;
    regularity: number;  // 0-1: how regular is the meter?
  };

  // Emotion
  emotion: EmotionalAnalysis;

  // Problems
  problems: {
    line: number;
    position: number;
    type: 'stress_mismatch' | 'syllable_variance' | 'singability' | 'rhyme_break';
    severity: 'low' | 'medium' | 'high';
    description: string;
    suggestedFix?: string;
  }[];

  // Suggestions for melody
  melodySuggestions: {
    timeSignature: '4/4' | '3/4' | '6/8' | '2/4';
    tempo: number;
    key: string;
    mode: 'major' | 'minor';
    phraseBreaks: number[];  // Line numbers where phrases end
  };
}
```

## Implementation Architecture

### Option A: Python Backend (Server)

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Browser   │ ──── │   API       │ ──── │   Python    │
│   (React)   │ HTTP │   (FastAPI) │      │   Pipeline  │
└─────────────┘      └─────────────┘      └─────────────┘
                                                 │
                                    ┌────────────┼────────────┐
                                    │            │            │
                              ┌─────▼───┐  ┌─────▼───┐  ┌─────▼───┐
                              │pronounc-│  │prosodic │  │ custom  │
                              │   ing   │  │         │  │ modules │
                              └─────────┘  └─────────┘  └─────────┘
```

**Pros**: Full access to Python NLP libraries
**Cons**: Server required, deployment complexity

### Option B: JavaScript Only (Client)

```
┌───────────────────────────────────────────────────────────┐
│                      Browser (React)                      │
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ compromise  │  │ CMU dict    │  │  custom     │       │
│  │   (NLP)     │  │ (npm pkg)   │  │  analysis   │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
└───────────────────────────────────────────────────────────┘
```

**Pros**: No server, privacy, simpler deployment
**Cons**: Less sophisticated analysis, larger bundle

### Option C: Hybrid (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (React)                        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                Basic Analysis (JS)                    │  │
│  │  • Syllable counting (compromise)                     │  │
│  │  • Basic stress (CMU dict npm)                        │  │
│  │  • Simple rhyme detection                             │  │
│  │  • Sentiment (simple lexicon)                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                │
│                   Good enough for MVP                       │
│                            │                                │
│              ┌─────────────▼─────────────┐                 │
│              │   Claude (Qualitative)     │                 │
│              │   • Interpret results      │                 │
│              │   • Suggest improvements   │                 │
│              │   • Generate melody        │                 │
│              └───────────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

**Pros**: Simple deployment, Claude compensates for simpler analysis
**Cons**: Relies on Claude for heavy lifting

## Package Versions (Install Latest)

Always use package managers to get current stable versions:

**Python** (if using backend):
```bash
pip install pronouncing prosodic nltk
```

**JavaScript** (browser):
```bash
npm install compromise cmu-pronouncing-dictionary
```

Check actual versions at install time - don't rely on hardcoded version numbers.

## References

- [CMU Pronouncing Dictionary](http://www.speech.cs.cmu.edu/cgi-bin/cmudict)
- [Prosodic GitHub](https://github.com/quadrismegistus/prosodic)
- [pronouncing Docs](https://pronouncing.readthedocs.io/)
- [Compromise NLP](https://github.com/spencermountain/compromise)
- [Poetry-Tools](https://github.com/hyperreality/Poetry-Tools)
