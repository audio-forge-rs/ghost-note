# Ghost Note Implementation Plan

> This file serves as persistent working memory across Claude sessions.
> Update after completing tasks or making architectural decisions.

## Current Phase: Multi-Agent Infrastructure Ready → Issue #1 (Vite Setup) First

### Manager-Worker Architecture Status
- [x] Research multi-agent patterns (git worktrees, headless Claude)
- [x] Create BACKLOG.md with complete product vision (~200 items)
- [x] Create 66 GitHub issues covering full product scope
- [x] Set up GitHub labels and milestones
- [x] Create worker orchestration scripts (scripts/)
- [x] Document manager/worker roles (docs/AGENT_ROLES.md)
- [x] Create WORKER_CLAUDE.md for worker context
- [x] Create GitHub Actions workflows (CI, Claude review)
- [x] Claude GitHub App installed via `/install-github-app`

### Claude GitHub Integration
✅ Set up via `/install-github-app` command
- Workflow created automatically
- `CLAUDE_CODE_OAUTH_TOKEN` secret saved
- Claude will review all PRs

---

## GitHub Issues Summary (66 issues created)

### By Priority
| Priority | Count | Description |
|----------|-------|-------------|
| P0 | 12 | Critical path - blocks other work |
| P1 | 28 | High priority - core functionality |
| P2 | 20 | Medium priority - important features |
| P3 | 6 | Lower priority - enhancements |

### By Epic
| Epic | Issues | Milestone |
|------|--------|-----------|
| Infrastructure | #1-4, #30, #37, #51-53 | Infrastructure |
| Poem Analysis | #5-10, #17-19, #34, #54-57, #64 | Analysis MVP |
| Melody Generation | #11-13, #20-22, #35, #62 | Melody MVP |
| Web UI | #14-16, #23-25, #38-50, #58-61, #63, #65-66 | UI MVP |
| Recording | #26-29, #43 | Recording |

### Worker-Ready Issues (can start immediately)
- **#1**: Initialize React + TypeScript + Vite project
- **#5**: Integrate CMU pronouncing dictionary
- **#6**: Create text normalization module
- **#11**: Build ABC notation generator
- **#16**: Integrate abcjs for music notation
- **#17**: Implement emotion analysis module
- **#18**: Design PoemAnalysis TypeScript interface
- **#26**: Implement microphone access and level meter
- **#30**: Design Zustand store architecture
- **#32**: Create Claude integration layer
- **#49**: Add sample poems and preset library
- **#61**: Create empty state components

---

## Manager Workflow

**The manager NEVER implements. Always spawn headless workers.**

### 1. Spawn Worker
```bash
# Spawn headless worker for any issue
./scripts/spawn-worker-headless.sh <issue-number>

# Example: Start Issue #1
./scripts/spawn-worker-headless.sh 1

# Worker runs autonomously:
# - Creates worktree at ../ghost-note-worker-1/
# - Implements the feature
# - Commits and pushes
# - Creates PR
# - Exits when complete
```

### 2. Monitor Progress
```bash
./scripts/list-workers.sh           # List active worktrees
gh pr list                          # See open PRs
gh pr view <number>                 # View PR details
gh pr checks <number>               # Check CI status
```

### 3. After Approval
```bash
gh pr merge <number> --squash       # Merge the PR
./scripts/cleanup-worker.sh <N>     # Remove worktree
# Update this plan.md with progress
```

### 4. Parallel Workers
For independent issues (no dependencies), spawn multiple:
```bash
./scripts/spawn-worker-headless.sh 5 &
./scripts/spawn-worker-headless.sh 6 &
./scripts/spawn-worker-headless.sh 11 &
wait
```

---

## Immediate Next Steps

### 1. Manager Spawns First Worker
```bash
./scripts/spawn-worker-headless.sh 1
# Worker autonomously implements Vite + React + TypeScript
# Creates PR when complete
```

### 2. Monitor and Merge
```bash
gh pr list                     # Watch for PR
gh pr merge <number> --squash  # After approval
./scripts/cleanup-worker.sh 1
```

### 3. Parallel Workers (after #1 merges)
```bash
# These have no dependencies on each other
./scripts/spawn-worker-headless.sh 5 &   # CMU dictionary
./scripts/spawn-worker-headless.sh 6 &   # Text normalization
./scripts/spawn-worker-headless.sh 11 &  # ABC notation
./scripts/spawn-worker-headless.sh 18 &  # TypeScript interface
wait
```

---

## Completed Research
- [x] Claude Code best practices (2025)
- [x] Context engineering strategies
- [x] Open source music libraries (abcjs, ABC notation)
- [x] Poem-to-song translation theory
- [x] Syllable/stress analysis tools
- [x] Meter detection techniques
- [x] Rhyme scheme analysis
- [x] Emotion-to-music mapping
- [x] Melody generation theory
- [x] Multi-agent orchestration (git worktrees)
- [x] Claude GitHub Actions integration

---

## Architecture Decisions Log

### 2026-01-03: Multi-Agent Development
**Decision**: Manager-worker architecture with git worktrees
**Rationale**:
- Workers get isolated context (cleaner)
- Parallel development possible
- Clear separation of concerns
- GitHub PR flow for quality control
- Claude reviews all worker PRs

### 2026-01-03: Issue-Based Work Units
**Decision**: One GitHub issue = One worker session
**Rationale**:
- Clear scope for each worker
- Trackable progress
- Easy to reassign if blocked
- Fits PR review workflow

### Previous Decisions
- Music notation: ABC format (text-based, Claude-readable)
- Frontend: React + TypeScript + Vite
- Analysis: Browser-only with CMU dict + Claude enhancement
- State: Zustand with localStorage persistence

---

## Session Notes

### Session 1 (2026-01-03) - Morning
- Initial project setup
- Claude Code best practices research
- Basic structure created

### Session 2 (2026-01-03) - Afternoon
- Deep research on poem-to-song translation
- Music theory documentation
- Package research and documentation

### Session 3 (2026-01-03) - Evening
- Multi-agent orchestration research
- Created 66 GitHub issues
- Set up worker infrastructure
- Created orchestration scripts
- Documented manager/worker roles
- GitHub Actions for CI and Claude review
- **Ready to spawn workers**

---

## Key Files Quick Reference

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Manager agent context (this repo) |
| `WORKER_CLAUDE.md` | Worker agent context (copied to worktrees) |
| `plan.md` | Working memory (you are here) |
| `BACKLOG.md` | Full product backlog |
| `docs/AGENT_ROLES.md` | Manager/worker documentation |
| `docs/GITHUB_SETUP.md` | GitHub integration guide |
| `scripts/spawn-worker.sh` | Create worker worktree |
| `scripts/cleanup-worker.sh` | Remove worker worktree |

---

## Milestones & Tags

| Tag | Milestone | Status |
|-----|-----------|--------|
| `milestone-infrastructure-setup` | Multi-agent ready | ✅ Created |
| `milestone-infrastructure` | Vite + CI complete | Pending |
| `milestone-analysis-mvp` | Basic analysis | Pending |
| `milestone-melody-mvp` | Basic melody | Pending |
| `milestone-ui-mvp` | Usable interface | Pending |
| `milestone-recording` | Recording works | Pending |
| `milestone-beta` | Feature complete | Pending |
| `milestone-v1` | Production | Pending |
