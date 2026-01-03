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

## Deployment Options (Free Tier)

| Service | Pros | Cons |
|---------|------|------|
| Vercel | Easy, fast, great DX | Usage limits |
| Netlify | Similar to Vercel | Similar limits |
| Cloudflare Pages | Unlimited bandwidth | Slightly more complex |
| GitHub Pages | Free, simple | No server functions |

**Recommendation**: Start with GitHub Pages or Cloudflare Pages for static hosting.

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

## Reference Links

- [abcjs Documentation](https://paulrosen.github.io/abcjs/)
- [ABC Notation Standard](https://abcnotation.com/wiki/abc:standard:v2.1)
- [Web Audio API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MediaRecorder API MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
