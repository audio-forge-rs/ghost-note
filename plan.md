# Ghost Note Implementation Plan

> This file serves as persistent working memory across Claude sessions.
> Update after completing tasks or making architectural decisions.

## Current Phase: Research Complete → Ready for Implementation

### Completed Research
- [x] Claude Code best practices (2025) - context engineering, CLAUDE.md, slash commands
- [x] Context engineering strategies - compaction survival, plan.md workflow
- [x] Open source music libraries - abcjs, ABC notation
- [x] Poem-to-song translation theory - stress alignment, singability, lyric setting
- [x] Syllable/stress analysis tools - CMU dictionary, pronouncing, prosodic
- [x] Meter detection techniques - foot types, scansion algorithms
- [x] Rhyme scheme analysis - phonetic matching, slant rhyme detection
- [x] Emotion-to-music mapping - valence/arousal to key/tempo
- [x] Melody generation theory - contour, phrase shape, cadences
- [x] First principles problem definition

### Completed Setup
- [x] Create CLAUDE.md with project vision
- [x] Create plan.md for persistent state
- [x] Create docs/ with comprehensive documentation:
  - ARCHITECTURE.md - System design
  - TECH_STACK.md - Technology choices
  - WORKFLOWS.md - User and developer workflows
  - CONTEXT_ENGINEERING.md - Session management
  - PROBLEM_DEFINITION.md - First principles analysis
  - ANALYSIS_PIPELINE.md - Technical analysis pipeline
  - PACKAGES.md - Specific libraries and their usage
  - MELODY_GENERATION.md - Music theory for melody creation
- [x] Create .claude/commands/ for slash commands

### Next: Implementation Phase
- [ ] Initialize React + TypeScript + Vite project in web/
- [ ] Install npm packages (always use `npm install` for latest):
  - compromise, compromise-speech (syllables)
  - cmu-pronouncing-dictionary (phonetics, stress)
  - abcjs (notation, playback)
  - diff-match-patch (versioning)
  - sentiment (emotion detection)
  - zustand (state management)
- [ ] Build poem analysis module (using analysis pipeline)
- [ ] Build melody generation module
- [ ] Create UI components

---

## Architecture Decisions Log

### 2026-01-03: Project Structure
**Decision**: Monorepo with web/ folder for frontend, lib/ for shared code
**Rationale**: Keeps things simple, easy to navigate, supports future API if needed

### 2026-01-03: Music Notation Format
**Decision**: ABC notation as primary format
**Rationale**:
- Text-based (easy to version, diff, generate)
- abcjs provides browser rendering + MIDI playback
- Human-readable for debugging
- Claude can read/write it natively
- Can convert to MIDI/MusicXML if needed

### 2026-01-03: No Backend Initially
**Decision**: Client-side only for MVP
**Rationale**:
- Simpler deployment (static hosting)
- Privacy (poems stay local)
- Faster iteration
- JavaScript packages sufficient for basic analysis
- Claude compensates for simpler analysis tools

### 2026-01-03: Two-System Architecture
**Decision**: Software (quantitative) + Claude (qualitative)
**Rationale**:
- Software excels at: counting, pattern matching, consistency
- Claude excels at: meaning preservation, style matching, creative alternatives
- See PROBLEM_DEFINITION.md for full analysis

### 2026-01-03: Hybrid Analysis Approach
**Decision**: Browser-only analysis with Claude enhancement
**Rationale**:
- compromise + CMU dict handle basic syllable/stress
- Claude interprets results and makes qualitative judgments
- No server needed for MVP
- Can add Python backend (prosodic) later for advanced analysis

---

## Feature Specifications (Refined)

### Poem Input & Analysis
**Quantitative (Software)**:
- Syllable counting via compromise-speech
- Stress patterns via CMU dictionary lookup
- Rhyme detection via phoneme comparison
- Meter classification via pattern matching
- Singability scoring via phonetic analysis

**Qualitative (Claude)**:
- Emotional tone interpretation
- Meaning preservation assessment
- Style analysis
- Problem spot suggestions

### Lyric Adjustment
- Show analysis results to user
- Claude suggests word substitutions for problem spots
- Interactive diff view (original ↔ adapted)
- Version history with rollback
- User can accept/reject/modify suggestions

### Melody Generation
- Map stress pattern to rhythm (stressed → longer notes)
- Generate melodic contour (arch shape per phrase)
- Apply emotional mapping (mode, tempo, register)
- Output ABC notation
- Render with abcjs
- User can adjust (tempo, key, manual note changes)

### Recording
- MediaRecorder API for capture
- Web Audio API for visualization
- Play melody + record simultaneously
- Download as WebM/MP3

---

## Answers to Open Questions

### 1. How to handle poems with irregular meter?
**Answer**: Multiple strategies (see MELODY_GENERATION.md):
- Rhythmic adjustment (rests, triplets, pickup notes)
- Phrase grouping (combine short lines, split long)
- Meter changes (4/4 → 3/4 where needed)
- Claude can suggest best approach per poem

### 2. What emotion detection approach works without external APIs?
**Answer**: Sentiment lexicons + Claude interpretation:
- Use `sentiment` npm package (AFINN-165 based)
- Extract valence/arousal scores
- Map to musical parameters (key, tempo)
- Claude adds nuanced emotional understanding
- See MELODY_GENERATION.md for emotion-music mapping table

### 3. How much melody theory to encode vs let user adjust?
**Answer**: Generate reasonable defaults, allow full override:
- Algorithm generates basic stress-aligned melody
- User can adjust: tempo, key, mode, individual notes
- Export ABC for external editing
- "Regenerate" button with different seeds

---

## Key Documentation References

For context during implementation, read these:
1. **PROBLEM_DEFINITION.md** - Why this is hard, what we're solving
2. **ANALYSIS_PIPELINE.md** - How to analyze poems technically
3. **MELODY_GENERATION.md** - How to create melodies from analysis
4. **PACKAGES.md** - Which libraries to use and how

---

## Session Notes

### Session 1 (2026-01-03) - Morning
- Initial project setup
- Claude Code best practices research
- Basic structure created

### Session 2 (2026-01-03) - Afternoon
- Deep research on poem-to-song translation
- Music theory for lyric setting (stress alignment critical)
- Identified key packages:
  - Python: pronouncing, prosodic, poetry-tools
  - JavaScript: compromise, cmu-pronouncing-dictionary, abcjs
- Created comprehensive documentation:
  - First principles problem definition
  - Analysis pipeline specification
  - Melody generation theory
  - Package reference guide
- Key insight: Two-system approach (software quantitative + Claude qualitative)
- Ready for implementation phase
- **Next session**: Initialize web app, install packages, start building

---

## Quick Reference: Package Install Commands

```bash
# Initialize (run once)
cd web
npm create vite@latest . -- --template react-ts

# Install core packages (always get latest)
npm install compromise @types/compromise
npm install cmu-pronouncing-dictionary
npm install abcjs
npm install diff-match-patch @types/diff-match-patch
npm install sentiment @types/sentiment
npm install zustand

# Dev dependencies
npm install -D tailwindcss postcss autoprefixer
npm install -D @types/node
```
