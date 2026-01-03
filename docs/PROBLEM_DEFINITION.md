# Problem Definition: Poem to Song Translation

> First principles analysis of what we're solving and why it's challenging.

## The Core Problem

**Transform a poem into a singable song while preserving its essence.**

This requires solving two interconnected sub-problems:
1. **Lyric Adaptation**: Adjusting text for singability without losing meaning
2. **Melody Generation**: Creating a vocal line that serves the adapted lyrics

## Why This Is Hard

### The Singability Constraint

Spoken language and sung language follow different rules:

| Aspect | Speech | Song |
|--------|--------|------|
| Rhythm | Flexible, context-driven | Fixed to musical meter |
| Stress | Natural word emphasis | Must align with strong beats |
| Duration | Quick, variable | Notes have set lengths |
| Pitch | Rises/falls with meaning | Fixed melodic contour |
| Breathing | Natural pauses | Determined by phrase length |

**A mis-stressed lyric** is when stressed/unstressed syllables don't align with strong/weak beats. This makes lyrics sound "wrong" even if technically correct.

Example of bad alignment:
```
Music:    STRONG weak STRONG weak
Lyric:    to-DAY  I    WENT  home
Problem:  "to" on strong beat, "DAY" on weak - sounds unnatural
```

### The Preservation Challenge

We want to keep:
- **Semantic meaning**: What the poem says
- **Emotional tone**: How it feels
- **Poetic devices**: Rhyme, alliteration, imagery
- **Author's voice**: The unique style

But we may need to change:
- Specific word choices (for syllable count)
- Line lengths (for musical phrasing)
- Some sounds (for singability on sustained notes)

## First Principles Decomposition

### What Is a Poem? (Structural Elements)

```
POEM
├── Stanzas (verse groupings)
│   └── Lines
│       └── Words
│           └── Syllables
│               ├── Phonemes (sounds)
│               ├── Stress (emphasis level)
│               └── Duration (inherent length)
```

### What Must We Analyze?

#### 1. Syllable Structure
- **Count**: How many syllables per line?
- **Stress pattern**: Which are emphasized? (0=none, 1=primary, 2=secondary)
- **Phonetic content**: What sounds make up each syllable?

Example:
```
"The woods are lovely, dark and deep"
Syllables:  The | woods | are | love | ly | dark | and | deep
Stress:      0     1      0     1     0     1      0     1
Pattern:    iambic tetrameter (weak-STRONG × 4)
```

#### 2. Meter (Rhythmic Pattern)
- **Foot type**: What's the basic rhythmic unit?
  - Iamb: weak-STRONG (da-DUM) - most common in English
  - Trochee: STRONG-weak (DUM-da)
  - Anapest: weak-weak-STRONG (da-da-DUM)
  - Dactyl: STRONG-weak-weak (DUM-da-da)
  - Spondee: STRONG-STRONG (DUM-DUM)

- **Line length**: How many feet per line?
  - Monometer (1), Dimeter (2), Trimeter (3)
  - Tetrameter (4), Pentameter (5), Hexameter (6)

#### 3. Rhyme Scheme
- **End rhymes**: Which line endings rhyme?
  - ABAB (alternating)
  - AABB (couplets)
  - ABBA (enclosed)
  - etc.

- **Rhyme types**:
  - Perfect: cat/hat (identical ending sounds)
  - Slant: cat/bed (similar but not identical)
  - Internal: rhymes within a line

#### 4. Phonetic Properties
- **Vowel quality**: Open vowels (ah, oh) sustain well; closed (ih, uh) don't
- **Consonant clusters**: Hard to sing on sustained notes (e.g., "strengths")
- **Sibilants**: S/sh sounds can be harsh when sung

#### 5. Emotional/Semantic Content
- **Word connotation**: Positive, negative, neutral
- **Imagery type**: Visual, auditory, tactile, etc.
- **Intensity**: Calm vs. passionate vs. melancholic
- **Progression**: Does emotion build, release, transform?

### What Must a Melody Provide?

#### 1. Stress Alignment
- Strong beats → stressed syllables
- Weak beats → unstressed syllables
- Important words → longer notes or higher pitches

#### 2. Phrase Structure
- Musical phrases align with poetic lines
- Breath points at natural pauses
- Cadences (resolutions) at line/stanza ends

#### 3. Emotional Mapping
| Text Emotion | Musical Expression |
|--------------|-------------------|
| Happy/Light | Major key, faster tempo, higher register |
| Sad/Heavy | Minor key, slower tempo, lower register |
| Tense | Dissonance, irregular rhythm |
| Peaceful | Consonance, flowing melody |
| Dramatic | Wide intervals, dynamic contrast |

#### 4. Singable Range
- Typical: One octave + fifth (C4 to G5 for soprano)
- Avoid extreme jumps between notes
- Consider climax placement (highest note for emotional peak)

## The Two-System Solution

### System 1: Quantitative Analysis (Software)

Traditional software excels at:
- **Counting**: Syllables, phonemes, lines
- **Pattern matching**: Stress patterns, rhyme detection
- **Classification**: Meter type, form identification
- **Consistency**: Same input → same output

Tools for this:
- CMU Pronouncing Dictionary (phonemes, stress)
- Prosodic library (meter parsing)
- pronouncing library (rhymes, syllables)
- Custom algorithms (emotion scoring, singability)

### System 2: Qualitative Judgment (Claude)

Claude excels at:
- **Meaning preservation**: Does the change keep the intent?
- **Style matching**: Does it sound like the original author?
- **Creative alternatives**: What word could replace this?
- **Holistic assessment**: Does the song "work"?
- **Musical intuition**: Does this melody feel right for these words?

### The Handoff

```
┌─────────────────────────────────────────────────────────────┐
│                    POEM INPUT                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              QUANTITATIVE ANALYSIS (Software)               │
│                                                             │
│  • Syllable counts per line                                 │
│  • Stress patterns (binary: 0/1/2)                         │
│  • Phonetic transcription                                   │
│  • Rhyme scheme detection                                   │
│  • Meter classification                                     │
│  • Singability scores per syllable                         │
│  • Line length variance                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           STRUCTURED DATA (JSON)                            │
│                                                             │
│  {                                                          │
│    "lines": [...],                                          │
│    "syllables": [[stress, phonemes, singability], ...],    │
│    "meter": "iambic_pentameter",                           │
│    "rhyme_scheme": "ABAB",                                 │
│    "problem_spots": [...]                                   │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              QUALITATIVE ANALYSIS (Claude)                  │
│                                                             │
│  Input: Structured data + original poem                     │
│                                                             │
│  Tasks:                                                     │
│  • Interpret emotion/tone from imagery and word choice      │
│  • Suggest word substitutions for problem spots             │
│  • Evaluate if changes preserve meaning                     │
│  • Generate melody contour matching emotional arc           │
│  • Assess overall singability of result                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   SONG OUTPUT                               │
│                                                             │
│  • Adapted lyrics with tracked changes                      │
│  • ABC notation melody                                      │
│  • Alignment verification                                   │
│  • Version history                                          │
└─────────────────────────────────────────────────────────────┘
```

## Constraints & Scope

### In Scope (MVP)
- Single-voice melody (no harmony)
- English language poems
- Common meters (iambic, trochaic, etc.)
- Standard rhyme schemes
- Client-side processing (privacy)

### Out of Scope (Future)
- Multi-part harmony
- Instrumental accompaniment
- Languages other than English
- Free verse with no discernible pattern
- Real-time collaboration

## Success Criteria

A successful translation:
1. **Singable**: Every syllable aligns with appropriate beat strength
2. **Recognizable**: The original poem's meaning is clear
3. **Musical**: The melody enhances rather than fights the text
4. **Natural**: A singer would feel comfortable performing it
5. **Faithful**: Key poetic devices (rhyme, imagery) are preserved

## References

- [Pat Pattison: Language and Songwriting](https://www.patpattison.com/language-and-songwriting)
- [Wikipedia: Lyric Setting](https://en.wikipedia.org/wiki/Lyric_setting)
- [Sound On Sound: Understanding & Writing Lyrics](https://www.soundonsound.com/techniques/understanding-writing-lyrics-part-3)
- [Oxford: Word Stress in Singing](https://global.oup.com/us/companion.websites/9780190238414/resources/diction/vowels/stress/)
- [Springer: Prosodic Constraints and Singability](https://link.springer.com/chapter/10.1007/978-981-13-7314-5_11)
