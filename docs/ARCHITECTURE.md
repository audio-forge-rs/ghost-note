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

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Pages                              │
│                     (Static Frontend)                            │
│                                                                  │
│  React + TypeScript + Vite                                       │
│  - Poem Input                                                    │
│  - Lyrics Editor                                                 │
│  - Melody View                                                   │
│  - Recording Studio                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Supabase Edge Functions                        │
│                      (Deno Runtime)                              │
│                                                                  │
│  POST /functions/v1/groq-chat                                    │
│  - Proxies requests to Groq API                                  │
│  - Keeps GROQ_API_KEY secure (server-side secret)               │
│  - CORS configured for GitHub Pages origin                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Groq Cloud                                │
│                    (LLM Inference)                               │
│                                                                  │
│  Model: llama-3.3-70b-versatile                                  │
│  - Generates first draft song lyrics from poems                  │
│  - Handles revision requests                                     │
│  - Future: Melody generation                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (Future)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Postgres                             │
│                      (Database)                                  │
│                                                                  │
│  Future features:                                                │
│  - User accounts                                                 │
│  - Saved projects                                                │
│  - Usage analytics                                               │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Architecture

| Component | Choice | Reason |
|-----------|--------|--------|
| Frontend Hosting | GitHub Pages | Free, automatic deploys from repo, reliable CDN |
| API Proxy | Supabase Edge Functions | Free tier (500K/mo), keeps secrets secure, Deno runtime |
| LLM | Groq Cloud | Fast inference, competitive pricing, good model selection |
| Database | Supabase Postgres | Same platform as functions, free tier, future-ready |

### Environment Configuration

**Frontend (`web/.env`):**
```bash
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<public-anon-key>
```

**Supabase Secrets (server-side):**
```bash
supabase secrets set GROQ_API_KEY=gsk_...
```

## Security Considerations

1. **API keys server-side**: GROQ_API_KEY stored as Supabase secret, never exposed to frontend
2. **HTTPS required**: For microphone access and secure API calls
3. **User consent**: Clear prompts before recording
4. **CORS restricted**: Edge functions only accept requests from our origin
5. **Local-first**: Poems stay in browser localStorage until explicitly sent to AI

## Future Extensions

1. **User accounts**: Supabase Auth for login
2. **Cloud sync**: Save projects to Supabase Postgres
3. **Collaboration**: Share and co-edit songs
4. **AI melody**: Use Groq for melody generation
5. **Export formats**: PDF sheet music, full audio files
6. **Mobile app**: React Native version
