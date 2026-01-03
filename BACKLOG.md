# Ghost Note Product Backlog

> Complete backlog from inception to full product vision.
> Each item becomes a GitHub issue assigned to a worker agent.

## Backlog Organization

### Priority Levels
- **P0**: Critical path - blocks other work
- **P1**: High priority - core functionality
- **P2**: Medium priority - important features
- **P3**: Lower priority - enhancements

### Epic Structure
```
Epic → Features → Tasks
```

### Issue Labeling Convention
- `epic:*` - Epic grouping
- `priority:P0-P3` - Priority level
- `type:feature|task|bug|research` - Work type
- `component:*` - System component
- `worker-ready` - Can be assigned to worker agent
- `blocked` - Has dependencies
- `in-review` - PR under review

---

## Epic 1: Project Infrastructure (P0)

### 1.1 Development Environment Setup
- [ ] **GH-001**: Initialize React + TypeScript + Vite project in web/
- [ ] **GH-002**: Configure ESLint + Prettier with TypeScript rules
- [ ] **GH-003**: Set up Tailwind CSS with custom theme tokens
- [ ] **GH-004**: Configure Vitest for unit testing
- [ ] **GH-005**: Set up Playwright for E2E testing
- [ ] **GH-006**: Create development Docker container (optional isolation)

### 1.2 CI/CD Pipeline
- [ ] **GH-007**: Create GitHub Actions workflow for PR checks (lint, test, build)
- [ ] **GH-008**: Set up Claude code review GitHub Action
- [ ] **GH-009**: Configure automated deployment to GitHub Pages / Cloudflare
- [ ] **GH-010**: Set up branch protection rules

### 1.3 Multi-Agent Infrastructure
- [ ] **GH-011**: Document worker agent role and guidelines
- [ ] **GH-012**: Create worker CLAUDE.md with role-specific instructions
- [ ] **GH-013**: Set up git worktree automation scripts
- [ ] **GH-014**: Create port/resource allocation system for workers
- [ ] **GH-015**: Build manager orchestration tooling

---

## Epic 2: Poem Analysis Engine (P0)

### 2.1 Text Preprocessing
- [ ] **GH-020**: Create text normalization module (whitespace, stanzas, lines)
- [ ] **GH-021**: Build word tokenizer with contraction handling
- [ ] **GH-022**: Implement punctuation preservation and tracking

### 2.2 Phonetic Analysis
- [ ] **GH-023**: Integrate CMU pronouncing dictionary
- [ ] **GH-024**: Build phoneme lookup service with fallback for unknown words
- [ ] **GH-025**: Create ARPAbet to IPA converter (for display)
- [ ] **GH-026**: Implement syllabification algorithm from phonemes

### 2.3 Stress Pattern Analysis
- [ ] **GH-027**: Extract stress patterns from CMU phonemes
- [ ] **GH-028**: Build line-level stress pattern aggregation
- [ ] **GH-029**: Implement unknown word stress estimation (ML or rules)

### 2.4 Meter Detection
- [ ] **GH-030**: Create foot type classifier (iamb, trochee, anapest, dactyl, spondee)
- [ ] **GH-031**: Build line length detector (monometer through hexameter)
- [ ] **GH-032**: Implement meter regularity scoring
- [ ] **GH-033**: Detect meter deviations and mark positions

### 2.5 Rhyme Analysis
- [ ] **GH-034**: Build rhyming part extractor (from stressed vowel onward)
- [ ] **GH-035**: Implement perfect rhyme detection
- [ ] **GH-036**: Implement slant/near rhyme detection
- [ ] **GH-037**: Build rhyme scheme notation generator (ABAB, AABB, etc.)
- [ ] **GH-038**: Detect internal rhymes within lines

### 2.6 Singability Scoring
- [ ] **GH-039**: Create vowel openness scoring table
- [ ] **GH-040**: Build consonant cluster penalty calculator
- [ ] **GH-041**: Implement breath point detection
- [ ] **GH-042**: Create composite singability score per syllable/line

### 2.7 Emotion Analysis
- [ ] **GH-043**: Integrate sentiment analysis library
- [ ] **GH-044**: Build valence-arousal mapper
- [ ] **GH-045**: Create emotion-to-music parameter mapper
- [ ] **GH-046**: Implement emotional arc detection (per stanza progression)

### 2.8 Analysis Output
- [ ] **GH-047**: Design complete PoemAnalysis TypeScript interface
- [ ] **GH-048**: Build JSON serialization for analysis results
- [ ] **GH-049**: Create analysis result caching (localStorage)

---

## Epic 3: Melody Generation Engine (P1)

### 3.1 Musical Parameter Selection
- [ ] **GH-050**: Build time signature selector based on meter
- [ ] **GH-051**: Create tempo selector based on emotion
- [ ] **GH-052**: Implement key signature selector (major/minor from emotion)
- [ ] **GH-053**: Build vocal range selector based on register suggestion

### 3.2 Rhythm Generation
- [ ] **GH-054**: Create stress-to-rhythm mapper (stressed → longer notes)
- [ ] **GH-055**: Implement beat alignment algorithm
- [ ] **GH-056**: Build rest insertion for breath points
- [ ] **GH-057**: Handle irregular syllable counts (triplets, pickup notes)

### 3.3 Melodic Contour
- [ ] **GH-058**: Implement phrase arch shape generator
- [ ] **GH-059**: Build scale degree mapper
- [ ] **GH-060**: Create stress-to-pitch adjustment (stressed = higher)
- [ ] **GH-061**: Implement melodic range constraints

### 3.4 Phrase Endings
- [ ] **GH-062**: Build cadence generator (perfect, half, deceptive)
- [ ] **GH-063**: Implement line-end resolution logic
- [ ] **GH-064**: Create stanza-end full cadence

### 3.5 ABC Notation Output
- [ ] **GH-065**: Build ABC header generator (X, T, M, L, Q, K)
- [ ] **GH-066**: Create note-to-ABC converter
- [ ] **GH-067**: Implement lyrics alignment (w: lines)
- [ ] **GH-068**: Build bar line insertion
- [ ] **GH-069**: Add repeat signs for verse structure

### 3.6 Melody Variations
- [ ] **GH-070**: Implement seed-based randomization for regeneration
- [ ] **GH-071**: Build alternative melody suggestion system
- [ ] **GH-072**: Create melody variation presets (folk, classical, pop)

---

## Epic 4: Web Application UI (P1)

### 4.1 Core Layout
- [ ] **GH-080**: Create responsive app shell with navigation
- [ ] **GH-081**: Build dark/light theme system
- [ ] **GH-082**: Implement keyboard shortcuts system
- [ ] **GH-083**: Create loading states and error boundaries

### 4.2 Poem Input
- [ ] **GH-084**: Build poem text input component (textarea with line numbers)
- [ ] **GH-085**: Implement paste detection and formatting
- [ ] **GH-086**: Create sample poem loader
- [ ] **GH-087**: Build input validation and character limits

### 4.3 Analysis Display
- [ ] **GH-088**: Create syllable annotation overlay
- [ ] **GH-089**: Build stress pattern visualization (dots/lines)
- [ ] **GH-090**: Implement rhyme scheme color coding
- [ ] **GH-091**: Create meter visualization
- [ ] **GH-092**: Build singability heat map
- [ ] **GH-093**: Create emotion arc chart

### 4.4 Lyric Editor
- [ ] **GH-094**: Build side-by-side diff view (original vs adapted)
- [ ] **GH-095**: Create inline suggestion UI (accept/reject/modify)
- [ ] **GH-096**: Implement manual editing with re-analysis
- [ ] **GH-097**: Build change highlight system

### 4.5 Version History
- [ ] **GH-098**: Create version list panel
- [ ] **GH-099**: Implement version comparison view
- [ ] **GH-100**: Build revert functionality
- [ ] **GH-101**: Create version naming/tagging
- [ ] **GH-102**: Implement version export

### 4.6 Music Notation Display
- [ ] **GH-103**: Integrate abcjs renderer
- [ ] **GH-104**: Build responsive sheet music scaling
- [ ] **GH-105**: Implement note highlighting during playback
- [ ] **GH-106**: Create ABC source view toggle

### 4.7 Playback Controls
- [ ] **GH-107**: Build play/pause/stop controls
- [ ] **GH-108**: Implement tempo slider
- [ ] **GH-109**: Create key transposition control
- [ ] **GH-110**: Build loop section selection
- [ ] **GH-111**: Implement metronome toggle

### 4.8 Melody Editor
- [ ] **GH-112**: Build parameter adjustment panel (tempo, key, mode)
- [ ] **GH-113**: Create regenerate button with seed control
- [ ] **GH-114**: Implement individual note editing
- [ ] **GH-115**: Build ABC export button

---

## Epic 5: Recording Studio (P2)

### 5.1 Microphone Access
- [ ] **GH-120**: Implement getUserMedia with permission handling
- [ ] **GH-121**: Build microphone selection dropdown
- [ ] **GH-122**: Create audio level meter
- [ ] **GH-123**: Implement noise gate / silence detection

### 5.2 Recording Controls
- [ ] **GH-124**: Build record/stop buttons with countdown
- [ ] **GH-125**: Create recording timer display
- [ ] **GH-126**: Implement pause/resume functionality
- [ ] **GH-127**: Build take management (multiple recordings)

### 5.3 Playback with Guide
- [ ] **GH-128**: Synchronize melody playback with recording
- [ ] **GH-129**: Build guide track volume control
- [ ] **GH-130**: Implement click track option
- [ ] **GH-131**: Create lyrics display during recording (teleprompter mode)

### 5.4 Audio Visualization
- [ ] **GH-132**: Build real-time waveform display
- [ ] **GH-133**: Implement frequency spectrum analyzer
- [ ] **GH-134**: Create pitch detection display (basic)

### 5.5 Export
- [ ] **GH-135**: Implement WebM audio export
- [ ] **GH-136**: Build audio download button
- [ ] **GH-137**: Create combined export (melody + recording)

---

## Epic 6: State Management & Persistence (P1)

### 6.1 Application State
- [ ] **GH-140**: Design Zustand store architecture
- [ ] **GH-141**: Implement poem state slice
- [ ] **GH-142**: Implement analysis state slice
- [ ] **GH-143**: Implement melody state slice
- [ ] **GH-144**: Implement recording state slice
- [ ] **GH-145**: Implement UI state slice (theme, panels)

### 6.2 Persistence
- [ ] **GH-146**: Implement localStorage persistence middleware
- [ ] **GH-147**: Build IndexedDB adapter for large data (recordings)
- [ ] **GH-148**: Create import/export project as JSON
- [ ] **GH-149**: Implement auto-save with debouncing

### 6.3 Undo/Redo
- [ ] **GH-150**: Build undo/redo stack for lyrics changes
- [ ] **GH-151**: Implement keyboard shortcuts (Cmd+Z, Cmd+Shift+Z)

---

## Epic 7: Claude Integration Layer (P1)

### 7.1 Analysis Enhancement
- [ ] **GH-160**: Create prompt templates for poem analysis
- [ ] **GH-161**: Build structured output parser for Claude responses
- [ ] **GH-162**: Implement analysis caching to reduce API calls

### 7.2 Lyric Suggestions
- [ ] **GH-163**: Create prompt templates for word substitution suggestions
- [ ] **GH-164**: Build suggestion ranking system
- [ ] **GH-165**: Implement meaning preservation scoring

### 7.3 Melody Review
- [ ] **GH-166**: Create prompt templates for melody quality assessment
- [ ] **GH-167**: Build feedback incorporation system

### 7.4 User Communication
- [ ] **GH-168**: Design Claude-user interaction UI
- [ ] **GH-169**: Implement streaming response display
- [ ] **GH-170**: Build conversation history for session

---

## Epic 8: Advanced Features (P2)

### 8.1 Multiple Sections
- [ ] **GH-180**: Support verse/chorus/bridge structure
- [ ] **GH-181**: Build section-specific melody generation
- [ ] **GH-182**: Implement section linking/transitions

### 8.2 Harmony (Future)
- [ ] **GH-183**: Add basic chord suggestion
- [ ] **GH-184**: Implement accompaniment track

### 8.3 MIDI Export
- [ ] **GH-185**: Build MIDI file generation from ABC
- [ ] **GH-186**: Implement multi-track MIDI (melody + accompaniment)

### 8.4 PDF Export
- [ ] **GH-187**: Generate printable sheet music PDF
- [ ] **GH-188**: Include lyrics with music notation

---

## Epic 9: Accessibility & Polish (P2)

### 9.1 Accessibility
- [ ] **GH-190**: Implement ARIA labels throughout
- [ ] **GH-191**: Build screen reader announcements
- [ ] **GH-192**: Ensure keyboard navigation
- [ ] **GH-193**: Add high contrast mode

### 9.2 Performance
- [ ] **GH-194**: Implement code splitting
- [ ] **GH-195**: Optimize bundle size
- [ ] **GH-196**: Add service worker for offline capability

### 9.3 Documentation
- [ ] **GH-197**: Create user guide
- [ ] **GH-198**: Build interactive tutorial
- [ ] **GH-199**: Add tooltips and help system

---

## Epic 10: Testing & Quality (P1)

### 10.1 Unit Tests
- [ ] **GH-200**: Test poem analysis modules
- [ ] **GH-201**: Test melody generation modules
- [ ] **GH-202**: Test state management

### 10.2 Integration Tests
- [ ] **GH-203**: Test analysis → melody pipeline
- [ ] **GH-204**: Test UI component integration

### 10.3 E2E Tests
- [ ] **GH-205**: Test complete poem-to-song workflow
- [ ] **GH-206**: Test recording workflow
- [ ] **GH-207**: Test export functionality

---

## Milestone Tags

| Tag | Milestone | Key Issues |
|-----|-----------|------------|
| `milestone-infrastructure` | Project setup complete | GH-001 through GH-015 |
| `milestone-analysis-mvp` | Basic poem analysis working | GH-020 through GH-049 |
| `milestone-melody-mvp` | Basic melody generation working | GH-050 through GH-069 |
| `milestone-ui-mvp` | Usable web interface | GH-080 through GH-115 |
| `milestone-recording` | Recording studio working | GH-120 through GH-137 |
| `milestone-beta` | Feature complete beta | All P0 and P1 |
| `milestone-v1` | Production release | All issues complete |

---

## Dependency Graph (Critical Path)

```
GH-001 (Vite setup)
    │
    ├──▶ GH-002, GH-003, GH-004 (lint, tailwind, vitest)
    │
    ├──▶ GH-023 (CMU dict integration)
    │        │
    │        ├──▶ GH-024-029 (phonetic analysis)
    │        │
    │        └──▶ GH-030-033 (meter detection)
    │
    ├──▶ GH-047 (analysis interface)
    │        │
    │        └──▶ GH-050-069 (melody generation)
    │
    ├──▶ GH-080-083 (core layout)
    │        │
    │        ├──▶ GH-084-087 (poem input)
    │        │
    │        ├──▶ GH-088-093 (analysis display)
    │        │
    │        └──▶ GH-103-111 (notation + playback)
    │
    └──▶ GH-140-145 (state management)
```

---

## Worker Assignment Guidelines

Each issue should be:
1. **Self-contained**: Can be completed without blocking others (or explicitly blocked)
2. **Testable**: Has clear acceptance criteria
3. **Scoped**: Completable in one worker session
4. **Documented**: Includes context links to relevant docs

See `docs/AGENT_ROLES.md` for worker-specific instructions.
