# Package Reference

> Specific packages for poem analysis and melody generation.
> Always install latest stable versions via package managers.

## Core Philosophy

1. **Use package managers** (`npm`, `pip`) to get latest stable versions
2. **Don't hardcode versions** in documentation - they go stale
3. **Check health** before adopting (last update, issues, downloads)
4. **Prefer browser-compatible** packages for client-side operation

---

## JavaScript Packages (Browser/Node)

### Text Analysis

#### compromise
**Purpose**: NLP toolkit with syllable support

```bash
npm install compromise compromise-speech
```

**Key Features**:
- Tokenization
- Part-of-speech tagging
- Syllable splitting (via compromise-speech plugin)
- Runs in browser

**Usage**:
```javascript
import nlp from 'compromise';
import speech from 'compromise-speech';
nlp.plugin(speech);

const doc = nlp('Milwaukee');
doc.compute('syllables');
console.log(doc.syllables());
// [["mil", "wau", "kee"]]
```

**Source**: [github.com/spencermountain/compromise](https://github.com/spencermountain/compromise)

---

#### cmu-pronouncing-dictionary
**Purpose**: Phonetic dictionary for pronunciation lookup

```bash
npm install cmu-pronouncing-dictionary
```

**Key Features**:
- 134,000+ word pronunciations
- ARPAbet phoneme notation
- Stress markers (0, 1, 2)
- Zero dependencies

**Usage**:
```javascript
import cmuDict from 'cmu-pronouncing-dictionary';

console.log(cmuDict['hello']);
// "HH AH0 L OW1" or "HH EH0 L OW1"
```

**Source**: [npmjs.com/package/cmu-pronouncing-dictionary](https://www.npmjs.com/package/cmu-pronouncing-dictionary)

---

#### natural
**Purpose**: General NLP for Node.js

```bash
npm install natural
```

**Key Features**:
- Tokenizers (word, sentence)
- Stemmers (Porter, Lancaster)
- Phonetics (SoundEx, Metaphone)
- String distance (Levenshtein, Jaro-Winkler)
- Sentiment analysis

**Note**: Node.js focused, may not work fully in browser.

**Source**: [github.com/NaturalNode/natural](https://github.com/NaturalNode/natural)

---

### Music Rendering

#### abcjs
**Purpose**: ABC notation rendering and MIDI playback

```bash
npm install abcjs
```

**Key Features**:
- Parse ABC notation
- Render to SVG sheet music
- Generate and play MIDI
- Visual note highlighting during playback
- Tempo/instrument control

**Usage**:
```javascript
import abcjs from 'abcjs';

// Render ABC to element
const abc = `X:1
T:Simple
M:4/4
K:C
CDEF|GABc|`;

abcjs.renderAbc('notation-div', abc);

// Play MIDI
const synth = new abcjs.synth.CreateSynth();
synth.init({ visualObj: abcjs.renderAbc('div', abc)[0] });
synth.prime().then(() => synth.start());
```

**Source**: [github.com/paulrosen/abcjs](https://github.com/paulrosen/abcjs)

---

### Audio Recording

#### (Native Web APIs - no package needed)

**MediaRecorder API** for recording:
```javascript
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

const chunks = [];
recorder.ondataavailable = e => chunks.push(e.data);
recorder.onstop = () => {
  const blob = new Blob(chunks, { type: 'audio/webm' });
  // Use blob
};

recorder.start();
// ... later
recorder.stop();
```

**Web Audio API** for visualization:
```javascript
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();
const source = audioContext.createMediaStreamSource(stream);
source.connect(analyser);

// Get waveform data
const dataArray = new Uint8Array(analyser.frequencyBinCount);
analyser.getByteTimeDomainData(dataArray);
```

---

### Diff Display

#### diff-match-patch
**Purpose**: Text diff and patch

```bash
npm install diff-match-patch
```

**Key Features**:
- Character-level diff
- Semantic cleanup
- Patch generation and application
- Used by Google

**Usage**:
```javascript
import { diff_match_patch } from 'diff-match-patch';

const dmp = new diff_match_patch();
const diffs = dmp.diff_main('Hello World', 'Hello Brave World');
dmp.diff_cleanupSemantic(diffs);
// [['=', 'Hello '], ['+', 'Brave '], ['=', 'World']]
```

**Source**: [github.com/google/diff-match-patch](https://github.com/google/diff-match-patch)

---

### Sentiment Analysis

#### sentiment
**Purpose**: AFINN-based sentiment analysis

```bash
npm install sentiment
```

**Key Features**:
- AFINN-165 wordlist
- Emoji support
- Negation handling
- Language: English

**Usage**:
```javascript
import Sentiment from 'sentiment';
const sentiment = new Sentiment();

const result = sentiment.analyze('The sunset was beautiful and peaceful');
console.log(result.score);       // Positive number
console.log(result.comparative); // Normalized score
```

**Source**: [npmjs.com/package/sentiment](https://www.npmjs.com/package/sentiment)

---

## Python Packages (Backend/CLI)

### Phonetics & Prosody

#### pronouncing
**Purpose**: CMU dictionary interface for rhymes and syllables

```bash
pip install pronouncing
```

**Key Features**:
- Rhyme finding
- Syllable counting
- Stress patterns
- Stress-based search
- Includes full CMU dictionary

**Usage**:
```python
import pronouncing

# Find rhymes
pronouncing.rhymes("climbing")
# ['diming', 'liming', 'priming', 'rhyming', 'timing']

# Get stress pattern
phones = pronouncing.phones_for_word("permit")
pronouncing.stresses(phones[0])
# "12" (noun) or "01" (verb)

# Count syllables
pronouncing.syllable_count(phones[0])
# 2

# Search by stress pattern
pronouncing.search_stresses("010")
# Words with weak-strong-weak pattern
```

**Source**: [github.com/aparrish/pronouncingpy](https://github.com/aparrish/pronouncingpy)

---

#### prosodic
**Purpose**: Full metrical-phonological parser

```bash
pip install prosodic
brew install espeak  # macOS dependency
```

**Key Features**:
- Complete meter analysis
- Constraint-based scansion
- Syllable-level detail
- Web GUI included
- DataFrame export

**Usage**:
```python
import prosodic

# Parse text
text = prosodic.Text("The woods are lovely, dark and deep")

# Access structure
print(len(text.syllables))  # Syllable count
print(text.line1.parse())   # Metrical parse

# Web interface
# Run: prosodic web
# Visit: http://127.0.0.1:8181/
```

**Source**: [github.com/quadrismegistus/prosodic](https://github.com/quadrismegistus/prosodic)

---

#### poetry-tools
**Purpose**: Poem form detection

```bash
pip install poetry-tools
```

**Key Features**:
- Rhyme scheme detection
- Meter estimation
- Form identification (sonnet, haiku, etc.)
- Uses Levenshtein distance for fuzzy matching

**Usage**:
```python
from poetry_tools import Poem

poem = Poem("""
Shall I compare thee to a summer's day?
Thou art more lovely and more temperate
""")

print(poem.rhyme_scheme)  # ['A', 'B', ...]
print(poem.metre)         # 'iambic pentameter'
```

**Source**: [github.com/hyperreality/Poetry-Tools](https://github.com/hyperreality/Poetry-Tools)

---

### Sentiment & NLP

#### nltk
**Purpose**: Comprehensive NLP toolkit

```bash
pip install nltk
python -c "import nltk; nltk.download('vader_lexicon')"
```

**Key Features**:
- VADER sentiment (designed for social text)
- Tokenizers
- Stemmers/Lemmatizers
- WordNet integration

**Usage**:
```python
from nltk.sentiment.vader import SentimentIntensityAnalyzer

sia = SentimentIntensityAnalyzer()
scores = sia.polarity_scores("The sunset was beautiful and peaceful")
# {'neg': 0.0, 'neu': 0.406, 'pos': 0.594, 'compound': 0.7579}
```

**Source**: [nltk.org](https://www.nltk.org/)

---

## Package Selection Matrix

| Need | JavaScript (Browser) | Python (Server) |
|------|---------------------|-----------------|
| Syllable count | compromise-speech | pronouncing |
| Stress pattern | cmu-pronouncing-dictionary | pronouncing |
| Full meter analysis | - | prosodic |
| Rhyme detection | cmu-pronouncing-dictionary + custom | pronouncing |
| Form detection | - | poetry-tools |
| Sentiment | sentiment | nltk (VADER) |
| Music notation | abcjs | - |
| Audio recording | Web Audio API | - |
| Text diff | diff-match-patch | - |

## Recommended Stack

### MVP (Browser-Only)
```bash
npm install compromise compromise-speech cmu-pronouncing-dictionary abcjs diff-match-patch sentiment zustand
```

### Enhanced (With Python Backend)
```bash
# Frontend
npm install abcjs diff-match-patch zustand

# Backend
pip install pronouncing prosodic nltk fastapi uvicorn
```

## Version Checking Commands

Always verify you have recent versions:

```bash
# npm packages
npm outdated

# pip packages
pip list --outdated

# Check specific package
npm show abcjs version
pip show pronouncing
```

## Health Check Resources

Before adopting a package, check:
- **npm**: npmjs.com (weekly downloads, last publish date)
- **PyPI**: pypi.org (release history)
- **GitHub**: Stars, issues, last commit
- **Snyk**: Security vulnerabilities

---

## References

- [CMU Dictionary Homepage](http://www.speech.cs.cmu.edu/cgi-bin/cmudict)
- [ARPAbet Phoneme Guide](https://en.wikipedia.org/wiki/ARPABET)
- [ABC Notation Standard](https://abcnotation.com/wiki/abc:standard:v2.1)
- [Web Audio API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MediaRecorder API MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
