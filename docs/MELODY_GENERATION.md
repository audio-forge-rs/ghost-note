# Melody Generation Theory

> How to create singable melodies from analyzed poem data.

## The Goal

Generate a vocal melody line that:
1. Aligns stressed syllables with strong beats
2. Matches the emotional arc of the poem
3. Falls within a comfortable singing range
4. Creates natural phrase shapes
5. Enhances (not fights) the text

## Fundamental Principles

### 1. Stress-to-Beat Alignment

The most critical rule in lyric setting:

```
STRONG beat → Stressed syllable (1)
weak beat   → Unstressed syllable (0)
```

**Example** (4/4 time, beats 1 and 3 are strong):
```
Beat:     1     2     3     4
Strength: S     w     S     w
Good:     LOVE  is    ALL   you   need
Stress:   1     0     1     0     0
```

**What happens when misaligned**:
```
Beat:     1     2     3     4
Strength: S     w     S     w
Bad:      to    DAY   is    THE   day
Stress:   0     1     0     1     0
          ↑ "to" on strong beat sounds wrong
```

### 2. Note Duration Mapping

| Syllable Type | Typical Note Value |
|---------------|-------------------|
| Primary stress (1) | Longer (quarter, half) |
| Secondary stress (2) | Medium (quarter) |
| Unstressed (0) | Shorter (eighth, sixteenth) |

**Reason**: Longer notes give emphasis, matching linguistic stress.

### 3. Pitch-Stress Correlation

Higher pitches carry more emphasis. Align:
- **Important words** → Higher pitches
- **Climax of meaning** → Highest pitch in phrase
- **Unstressed syllables** → Lower, passing tones

### 4. Phrase Shape

Natural melodies have contours:

```
Typical phrase arc:
           ╭──╮
          ╱    ╲
    ─────╱      ╲─────
Start    Rise    Fall to cadence
```

**Map to poetry**:
- Line start → Middle register
- Emotional peak → Highest point
- Line end → Resolution (often to tonic)

## ABC Notation Basics

ABC is a text-based music notation perfect for our use case:

```
X:1                    ← Tune number
T:My Song              ← Title
M:4/4                  ← Time signature
L:1/8                  ← Default note length
Q:1/4=100              ← Tempo (quarter = 100 BPM)
K:C                    ← Key
|C2 D2 E2 F2|G4 G4|   ← Notes
w:These are the ly-rics ← Lyrics aligned below
```

### Note Values (when L:1/8)
- `C` = eighth note
- `C2` = quarter note
- `C4` = half note
- `C8` = whole note
- `C/2` = sixteenth note

### Pitches
```
C, D, E, F, G, A, B  = Low octave
C  D  E  F  G  A  B  = Middle octave
c  d  e  f  g  a  b  = High octave
```

### Rests
- `z` = eighth rest (when L:1/8)
- `z2` = quarter rest
- etc.

### Lyrics
Use `w:` line below notes:
```
|C2 D2 E2 F2|
w:Hel-lo my friend
```
Each syllable aligns with its note. Use `-` to connect syllables of one word.

## Generation Algorithm

### Input
```typescript
interface MelodyInput {
  lines: {
    syllables: {
      text: string;
      stress: 0 | 1 | 2;
      phonemes: string[];
    }[];
    stressPattern: string;  // e.g., "01010101"
  }[];
  emotion: {
    mode: 'major' | 'minor';
    tempo: number;
    register: 'low' | 'middle' | 'high';
  };
  meter: {
    timeSignature: '4/4' | '3/4' | '6/8';
    footType: string;
  };
}
```

### Step 1: Choose Musical Parameters

```typescript
function chooseParameters(input: MelodyInput): MusicParams {
  return {
    key: input.emotion.mode === 'major' ? 'C' : 'Am',
    timeSignature: input.meter.timeSignature || '4/4',
    tempo: input.emotion.tempo || 100,
    range: {
      low: input.emotion.register === 'low' ? 'G,' : 'C',
      high: input.emotion.register === 'high' ? 'g' : 'e',
    },
  };
}
```

### Step 2: Map Stress to Rhythm

```typescript
function stressToRhythm(
  stressPattern: string,
  timeSignature: string
): string[] {
  // 4/4: Beats 1,3 strong; 2,4 weak
  // 3/4: Beat 1 strong; 2,3 weak

  const rhythmMap: Record<string, string> = {
    // For 4/4, L:1/8
    '1': '2',  // Stressed → quarter note
    '0': '1',  // Unstressed → eighth note
    '2': '2',  // Secondary → quarter note
  };

  return stressPattern.split('').map(s => rhythmMap[s]);
}
```

### Step 3: Generate Melodic Contour

```typescript
function generateContour(lineLength: number): number[] {
  // Returns relative pitch offsets (0 = tonic)
  // Creates an arch shape

  const contour: number[] = [];
  const peak = Math.floor(lineLength * 0.6);  // Peak at 60%

  for (let i = 0; i < lineLength; i++) {
    if (i < peak) {
      // Rising phase
      contour.push(Math.floor((i / peak) * 4));  // 0 to 4
    } else {
      // Falling phase
      const remaining = lineLength - peak;
      const pos = i - peak;
      contour.push(Math.floor(4 - (pos / remaining) * 4));  // 4 to 0
    }
  }

  return contour;
}
```

### Step 4: Apply Scale

```typescript
const scales = {
  major: [0, 2, 4, 5, 7, 9, 11, 12],  // C D E F G A B c
  minor: [0, 2, 3, 5, 7, 8, 10, 12],  // A B C D E F G a
};

const pitchNames = {
  major: ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'c'],
  minor: ['A,', 'B,', 'C', 'D', 'E', 'F', 'G', 'A'],
};

function contourToPitches(
  contour: number[],
  mode: 'major' | 'minor'
): string[] {
  return contour.map(c => {
    const index = Math.max(0, Math.min(c, 7));
    return pitchNames[mode][index];
  });
}
```

### Step 5: Adjust for Stress Emphasis

```typescript
function adjustForStress(
  pitches: string[],
  stressPattern: string
): string[] {
  return pitches.map((pitch, i) => {
    const stress = stressPattern[i];
    if (stress === '1') {
      // Bump stressed syllables up if not already high
      return bumpPitchUp(pitch);
    }
    return pitch;
  });
}

function bumpPitchUp(pitch: string): string {
  const order = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'c', 'd', 'e'];
  const idx = order.indexOf(pitch);
  if (idx >= 0 && idx < order.length - 1) {
    return order[idx + 1];
  }
  return pitch;
}
```

### Step 6: Build ABC String

```typescript
function buildABC(
  lines: LineData[],
  params: MusicParams
): string {
  let abc = `X:1
T:Generated Melody
M:${params.timeSignature}
L:1/8
Q:1/4=${params.tempo}
K:${params.key}
`;

  for (const line of lines) {
    // Build note string
    const notes = line.pitches.map((p, i) =>
      `${p}${line.durations[i]}`
    ).join(' ');

    // Build lyrics string
    const lyrics = line.syllables.map(s => s.text).join(' ');

    abc += `|${notes}|\n`;
    abc += `w:${lyrics}\n`;
  }

  return abc;
}
```

## Emotion-to-Music Mapping

### Key Signatures

| Emotion | Key | Mode | Character |
|---------|-----|------|-----------|
| Happy | C, G, D | Major | Bright, open |
| Sad | Am, Em, Dm | Minor | Dark, introspective |
| Triumphant | D, A | Major | Bold, strong |
| Mysterious | Bm, F#m | Minor | Ambiguous |
| Peaceful | F, Bb | Major | Warm, relaxed |
| Tense | Cm, Gm | Minor | Unsettled |

### Tempo Guidelines

| Emotion | BPM Range | Feel |
|---------|-----------|------|
| Peaceful | 60-80 | Slow, contemplative |
| Melancholic | 70-90 | Slow, weighted |
| Reflective | 80-100 | Moderate, thoughtful |
| Hopeful | 90-110 | Moderate, forward |
| Joyful | 110-140 | Upbeat, energetic |
| Anxious | 120-150 | Fast, driving |

### Intervallic Character

| Interval | Musical Effect |
|----------|----------------|
| Unison/Octave | Stability, emphasis |
| 2nds (steps) | Smooth, flowing |
| 3rds | Consonant, sweet |
| 4ths | Open, medieval |
| 5ths | Strong, stable |
| 6ths | Warm, romantic |
| 7ths | Tension, longing |

## Phrase Endings (Cadences)

End phrases with appropriate resolution:

| Cadence Type | Use | Ending Pattern |
|--------------|-----|----------------|
| Perfect | Strong ending | V → I (G → C) |
| Half | Incomplete feel | ? → V (? → G) |
| Deceptive | Surprise | V → vi (G → Am) |
| Plagal | "Amen" feel | IV → I (F → C) |

For line endings:
- Stanza end → Perfect cadence (full resolution)
- Mid-stanza → Half cadence (keeps moving)

## Handling Irregular Meter

When poems have irregular syllable counts:

### Option 1: Rhythmic Adjustment
- Add/remove rests
- Use triplets for 3-syllable feet in duple meter
- Pick up notes (anacrusis) before bar line

### Option 2: Phrase Grouping
- Group short lines together
- Split long lines across measures

### Option 3: Meter Change
- Change time signature mid-piece
- Common: 4/4 → 3/4 for waltz-like sections

## Example Generation

**Input poem line**:
```
"The woods are lovely, dark and deep"
Syllables: The | woods | are | love | ly | dark | and | deep
Stress:     0     1      0     1     0     1      0     1
```

**Analysis**:
- 8 syllables
- Iambic tetrameter (4 × weak-STRONG)
- Matches 4/4 naturally

**Generated ABC**:
```
X:1
T:Woods
M:4/4
L:1/8
Q:1/4=80
K:Am
|A,2 C2 B,2 E2|D2 E2 D2 A,2|
w:The woods are love-ly dark and deep
```

**Rhythm breakdown**:
```
Beat:  1    2    3    4    | 1    2    3    4
Note:  A,2  C2   B,2  E2   | D2   E2   D2   A,2
Word:  The  woods are love | -ly  dark and  deep
Stress: 0    1    0    1   |  0    1    0    1
```

## References

- [Wikipedia: Lyric Setting](https://en.wikipedia.org/wiki/Lyric_setting)
- [ABC Notation Standard](https://abcnotation.com/wiki/abc:standard:v2.1)
- [Pat Pattison: Songwriting](https://www.patpattison.com/)
- [Harvard: Music Theory](https://musictheory.io/)
- [Oxford: Word Stress in Singing](https://global.oup.com/us/companion.websites/9780190238414/resources/diction/vowels/stress/)
