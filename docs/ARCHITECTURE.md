# Ghost Note Architecture

## System Overview

Ghost Note is a web application that transforms poems into songs through three core processes:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Poem      │────▶│   Lyric     │────▶│   Melody    │
│   Input     │     │   Adapter   │     │   Generator │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  Version    │     │   Audio     │
                    │  History    │     │   Playback  │
                    └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  Recording  │
                                        │  Studio     │
                                        └─────────────┘
```

## Component Architecture

### 1. Poem Input
- Text area for poem entry
- Structure detection (stanzas, lines)
- Metadata extraction (title, author if provided)

### 2. Lyric Adapter
**Purpose**: Transform poem text into singable lyrics

**Analysis Features**:
- Syllable counting per line
- Stress pattern detection (iambic, trochaic, etc.)
- Rhyme scheme identification
- Emotional tone analysis (word choice, imagery)

**Transformation Features**:
- Suggest word substitutions for better flow
- Add/remove syllables for consistency
- Maintain rhyme while improving singability
- Preserve original meaning and emotion

### 3. Version Control
**Storage**: localStorage (MVP) → IndexedDB (production)

**Features**:
- Store all versions of lyrics
- Show inline diffs between versions
- Revert to any previous version
- Export version history

### 4. Melody Generator
**Format**: ABC notation

**Process**:
1. Analyze lyric meter and stress patterns
2. Map stressed syllables to strong beats
3. Generate melodic contour matching emotional arc
4. Output ABC notation string

**Constraints**:
- Single voice melody (no harmony)
- Common time signatures (4/4, 3/4, 6/8)
- Singable range (roughly octave + fifth)

### 5. Audio Playback
**Library**: abcjs

**Features**:
- Render ABC to sheet music notation
- Play MIDI audio in browser
- Tempo control
- Loop sections

### 6. Recording Studio
**API**: MediaStream Recording API

**Features**:
- Record microphone input
- Playback with melody accompaniment
- Download as audio file
- Basic waveform visualization

## Data Flow

```
User Input (poem text)
        │
        ▼
┌───────────────────┐
│ Parse & Analyze   │
│ - lines/stanzas   │
│ - syllables       │
│ - stress patterns │
│ - rhyme scheme    │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Generate          │
│ Suggestions       │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ User Review/Edit  │◀──┐
└───────────────────┘   │
        │               │
        ▼               │
┌───────────────────┐   │
│ Save Version      │───┘ (if more edits needed)
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Generate Melody   │
│ (ABC notation)    │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Render & Play     │
│ (abcjs)           │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Record User       │
│ Performance       │
└───────────────────┘
```

## State Management

### Application State
```typescript
interface AppState {
  // Current poem
  originalPoem: string;

  // Lyric versions
  versions: LyricVersion[];
  currentVersionIndex: number;

  // Melody
  abcNotation: string | null;
  isPlaying: boolean;
  tempo: number;

  // Recording
  isRecording: boolean;
  recordings: Recording[];
}

interface LyricVersion {
  id: string;
  lyrics: string;
  timestamp: Date;
  changes: Change[];  // For diff display
}

interface Recording {
  id: string;
  blob: Blob;
  duration: number;
  timestamp: Date;
  melodyVersionId: string;
}
```

## Technology Choices

| Component | Technology | Reason |
|-----------|------------|--------|
| UI Framework | React | Widespread support, Chrome extension compatible |
| Type Safety | TypeScript | Catch errors early, better DX |
| Build Tool | Vite | Fast, modern, good defaults |
| Music Notation | abcjs | Free, renders + plays, no server needed |
| Audio Recording | Web Audio API | Native, no dependencies |
| State | Zustand or Context | Simple, minimal boilerplate |
| Styling | Tailwind CSS | Rapid development, consistent design |
| Diff Display | diff-match-patch | Google's diff library, handles text well |

## Browser Compatibility

Target: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)

Required APIs:
- Web Audio API
- MediaDevices.getUserMedia()
- MediaRecorder API
- localStorage / IndexedDB

## Security Considerations

1. **No server storage by default**: Poems stay in browser
2. **HTTPS required**: For microphone access
3. **User consent**: Clear prompts before recording
4. **No external API calls**: All processing client-side

## Future Extensions

1. **Cloud sync**: Optional account for cross-device access
2. **Collaboration**: Share and co-edit songs
3. **AI enhancement**: Use Claude API for smarter suggestions
4. **Export formats**: PDF sheet music, full audio files
5. **Mobile app**: React Native version
