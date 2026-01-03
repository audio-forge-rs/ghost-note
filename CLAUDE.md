# Ghost Note - Poetry to Song Translation App

## You Are The Manager Agent

**You orchestrate. You never implement.**

Your role:
1. **Spawn headless workers** for implementation tasks
2. **Monitor PRs** and review progress
3. **Merge approved work** and update plan.md
4. **Never write feature code** - delegate to workers

### Spawning Workers

```bash
# Spawn a headless worker for any issue
./scripts/spawn-worker-headless.sh <issue-number>

# Example: Start Issue #1 (Vite setup)
./scripts/spawn-worker-headless.sh 1
```

The worker:
- Gets isolated worktree at `../ghost-note-worker-{N}/`
- Runs autonomously with full permissions
- Creates a PR when complete
- Exits when done

### Monitoring Progress

```bash
gh pr list                          # See open PRs
gh pr view <number>                 # View PR details
gh pr checks <number>               # Check CI status
./scripts/list-workers.sh           # List active worktrees
```

### After Worker Completes

```bash
gh pr merge <number> --squash       # Merge approved PR
./scripts/cleanup-worker.sh <N>     # Remove worktree
# Update plan.md with progress
```

---

## Project Vision

Ghost Note transforms poems into songs by:
1. **Analyzing** poem structure (syllables, stress, meter, rhyme, emotion)
2. **Adjusting** lyrics for singability (stress-beat alignment is critical)
3. **Generating** vocal melodies in ABC notation
4. **Providing** web interface for versioning, playback, and recording

**End-user interfaces**: Claude Code CLI, Claude Desktop (Code mode), Claude Chrome Extension

## Core Concept: Two-System Architecture

| System | Role | Strengths |
|--------|------|-----------|
| **Software** | Quantitative analysis | Syllable counts, stress patterns, rhyme detection, consistency |
| **Claude** | Qualitative judgment | Meaning preservation, style matching, creative alternatives |

See `docs/PROBLEM_DEFINITION.md` for full first-principles analysis.

## Key Technical Insight: Stress-Beat Alignment

The most critical rule in lyric setting:
```
STRONG beat → Stressed syllable
weak beat   → Unstressed syllable
```

Misaligned lyrics sound "wrong" even if technically correct.

## Documentation Map

| File | Purpose | Read When |
|------|---------|-----------|
| `plan.md` | Current tasks, session state | Every session start |
| `docs/PROBLEM_DEFINITION.md` | Why this is hard | Understanding the domain |
| `docs/ANALYSIS_PIPELINE.md` | How to analyze poems | Building analysis features |
| `docs/MELODY_GENERATION.md` | Music theory for melodies | Building melody features |
| `docs/PACKAGES.md` | Library reference | Installing/using packages |
| `docs/ARCHITECTURE.md` | System design | Major changes |
| `docs/WORKFLOWS.md` | User journeys | UX decisions |

## Project Structure

```
ghost-note/
├── CLAUDE.md              # This file (always loaded)
├── plan.md                # Working memory (check every session)
├── docs/                  # Detailed documentation
│   ├── PROBLEM_DEFINITION.md
│   ├── ANALYSIS_PIPELINE.md
│   ├── MELODY_GENERATION.md
│   ├── PACKAGES.md
│   ├── ARCHITECTURE.md
│   ├── TECH_STACK.md
│   ├── WORKFLOWS.md
│   └── CONTEXT_ENGINEERING.md
├── .claude/commands/      # Slash commands
├── web/                   # Frontend (React + TypeScript + Vite)
└── lib/                   # Shared code
```

## Tech Stack (Always Install Latest)

**Core packages** (use `npm install`, don't hardcode versions):
- `compromise` + `compromise-speech` - Syllable tokenization
- `cmu-pronouncing-dictionary` - Phonetics, stress markers
- `abcjs` - ABC notation rendering + MIDI playback
- `diff-match-patch` - Version diffing
- `sentiment` - Emotion detection
- `zustand` - State management

See `docs/PACKAGES.md` for usage examples.

## Analysis Pipeline Summary

```
Poem → Tokenize → Phonetic Lookup → Stress Extraction → Meter Detection
                                  ↓
                    Rhyme Analysis → Singability Scoring → Emotion Analysis
                                  ↓
                         Structured JSON for Claude
```

## Melody Generation Summary

```
Stress Pattern → Rhythm Mapping (stressed = longer notes)
              ↓
Emotion → Musical Parameters (mode, tempo, register)
              ↓
Generate Contour → Apply Scale → Build ABC Notation
```

## Key Commands

```bash
npm run dev          # Development server
npm run build        # Production build
/status              # Check project state (slash command)
/analyze-poem [text] # Analyze a poem
/generate-melody     # Create melody from lyrics
```

## Code Style

- TypeScript strict mode
- 2-space indentation
- Functional components with hooks
- Tailwind CSS for styling
- No emojis unless requested

## Constraints

- **FREE tools only**: No paid APIs
- **Open source**: MIT, Apache, or similar
- **Browser-first**: Core features client-side
- **Privacy**: Poems stay local by default

## Session Start Checklist

1. Read `plan.md` for current state
2. Check if any docs need updating
3. Run `/status` to verify project health
4. Continue from "Next" items in plan.md

## Current Status

**Phase**: Multi-Agent Infrastructure Ready

**Next Manager Actions:**
1. Spawn worker for Issue #1: `./scripts/spawn-worker-headless.sh 1`
2. Monitor PR creation: `gh pr list`
3. After merge, spawn parallel workers for #5, #6, #11, #18

See `plan.md` for detailed progress and `docs/AGENT_ROLES.md` for full orchestration docs.
