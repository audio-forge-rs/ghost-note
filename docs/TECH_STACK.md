# Technology Stack

## Core Principles

1. **Free and open source** - No paid APIs or proprietary dependencies
2. **Browser-first** - Works entirely client-side
3. **Privacy-respecting** - User data stays local by default
4. **Standards-based** - Use web platform APIs when possible

## Frontend

### React + TypeScript + Vite

**Why React**:
- Best ecosystem for component-based UI
- Works seamlessly with Claude Chrome Extension
- Strong TypeScript support
- Huge community and resources

**Why Vite**:
- Lightning fast HMR
- Modern ESM-based build
- Excellent TypeScript support
- Simple configuration

### Styling: Tailwind CSS

**Why Tailwind**:
- Rapid prototyping
- Consistent design system
- No context switching between files
- Great dark mode support
- Small production bundle (purged)

## Music & Audio

### abcjs - Music Notation

**Repository**: https://github.com/paulrosen/abcjs
**License**: MIT

**Capabilities**:
- Parse ABC notation strings
- Render to SVG sheet music
- Generate MIDI from ABC
- Play MIDI in browser via Web Audio
- Visual highlighting during playback
- Tempo/instrument control

**Why ABC notation**:
```
X:1
T:Simple Melody
M:4/4
K:C
|CDEF|GABc|
```
- Human readable and writable
- Easy to version control (text diffs)
- Claude can generate and understand it
- Converts to MIDI, MusicXML, etc.

### Web Audio API - Recording

**Capabilities**:
- Microphone access via getUserMedia()
- Audio recording via MediaRecorder
- Real-time audio visualization
- Audio playback and mixing

**Browser Support**: All modern browsers

## Text Processing

### diff-match-patch

**Repository**: https://github.com/google/diff-match-patch
**License**: Apache 2.0

**Why**:
- Battle-tested (Google's library)
- Handles text diffs elegantly
- Supports patch operations
- Multiple language implementations

### Natural Language Processing (Future)

For syllable counting and stress detection, options include:

**syllable** (npm): Simple syllable counter
```javascript
import syllable from 'syllable';
syllable('hello'); // 2
```

**compromise** (npm): Full NLP toolkit
```javascript
import nlp from 'compromise';
nlp('hello world').terms().data();
```

## State Management

### Zustand (Recommended)

**Why**:
- Minimal boilerplate
- TypeScript-first
- No providers needed
- Easy persistence middleware
- Tiny bundle size (~1KB)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PoemStore {
  originalPoem: string;
  setPoem: (poem: string) => void;
}

export const usePoemStore = create<PoemStore>()(
  persist(
    (set) => ({
      originalPoem: '',
      setPoem: (poem) => set({ originalPoem: poem }),
    }),
    { name: 'ghost-note-storage' }
  )
);
```

## Development Tools

### ESLint + Prettier

Standard code quality tools with TypeScript support.

### Vitest

Testing framework that works natively with Vite.

## Deployment Stack

### Frontend: GitHub Pages

**Why GitHub Pages**:
- Free hosting with automatic deploys
- Reliable global CDN
- Simple integration with repo
- Custom domain support

### Backend: Supabase

**Why Supabase**:
- Generous free tier (500K edge function invocations/month)
- Edge Functions for API proxy (Deno runtime)
- Postgres database for future features
- All services on one platform

**Edge Functions** (`supabase/functions/`):
```typescript
// groq-chat/index.ts - Proxies to Groq API
Deno.serve(async (req) => {
  const { messages } = await req.json();
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages }),
  });
  return new Response(await response.text(), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### LLM: Groq Cloud

**Why Groq**:
- Fast inference (LPU architecture)
- Competitive pricing
- Good model selection (Llama, Mixtral)
- OpenAI-compatible API

**Models used**:
- `llama-3.3-70b-versatile` - Primary model for lyric generation

### Architecture Summary

```
GitHub Pages ──▶ Supabase Edge Functions ──▶ Groq Cloud
   (React)           (Deno proxy)            (LLM)
                          │
                          ▼ (future)
                   Supabase Postgres
```

## Package Summary

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "abcjs": "^6.x",
    "zustand": "^4.x",
    "diff-match-patch": "^1.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^5.x",
    "@vitejs/plugin-react": "^4.x",
    "tailwindcss": "^3.x",
    "vitest": "^1.x",
    "eslint": "^8.x",
    "prettier": "^3.x"
  }
}
```

## Performance & Bundle Optimization

### Code Splitting Strategy

The application uses aggressive code splitting to minimize initial load time:

**Lazy-loaded chunks (loaded on demand):**
- `vendor-abcjs` (~148KB gzipped) - Music notation library, loaded when viewing melody
- `vendor-cmu-dict` (~961KB gzipped) - Pronunciation dictionary, loaded during analysis
- `vendor-sentiment` (~26KB gzipped) - Sentiment analysis, loaded during analysis
- `AnalysisPanel`, `LyricEditor`, `NotationDisplay` - React components, loaded on navigation

**Initial bundle (~104KB gzipped):**
- React core
- Zustand state management
- Basic UI components (Layout, PoemInput)
- CSS styles

### Bundle Analysis

To analyze bundle size and composition:

```bash
npm run build:analyze
# Opens dist/stats.html with a treemap visualization
```

### Key Optimization Techniques

1. **Dynamic imports for heavy libraries**
   - CMU dictionary (4MB) loaded only when analysis starts
   - abcjs loaded only when playback is needed

2. **React.lazy for route-level splitting**
   - Analysis, Lyrics, Melody, and Recording views lazy-loaded
   - Suspense boundaries with loading spinners

3. **Manual chunk splitting in Vite**
   - Vendor libraries separated into cacheable chunks
   - Shared dependencies optimized for browser caching

4. **Tree-shaking**
   - Only imported functions are bundled
   - ESM modules enable dead code elimination

### Performance Targets

| Metric | Target | Actual |
|--------|--------|--------|
| Initial JS bundle (gzipped) | < 200KB | ~104KB |
| Full app (gzipped) | < 500KB | ~1.2MB* |
| Time to Interactive (3G) | < 3s | ~1.5s |

*Note: The CMU dictionary (~961KB gzipped) is loaded lazily and only when analysis is triggered.

## Reference Links

- [abcjs Documentation](https://paulrosen.github.io/abcjs/)
- [ABC Notation Standard](https://abcnotation.com/wiki/abc:standard:v2.1)
- [Web Audio API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MediaRecorder API MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Vite Code Splitting](https://vitejs.dev/guide/build.html#chunking-strategy)
