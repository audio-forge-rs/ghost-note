# Agent Roles and Orchestration

> Defines the manager-worker architecture for multi-agent development.

## Critical Rule

**The Manager Agent NEVER implements features.**

The manager:
- Spawns headless workers via `./scripts/spawn-worker-headless.sh`
- Monitors PRs and CI status
- Merges approved work
- Updates plan.md with progress

All implementation is done by autonomous worker agents in isolated worktrees.

---

## Overview

Ghost Note uses a two-tier agent architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                      MANAGER AGENT                              │
│                                                                 │
│  • Maintains project vision and coherence                       │
│  • Assigns issues to workers                                    │
│  • Reviews PRs and coordinates rework                          │
│  • Manages milestones and releases                             │
│  • Has full context of CLAUDE.md, plan.md, docs/               │
└─────────────────────────────────────────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  WORKER AGENT   │  │  WORKER AGENT   │  │  WORKER AGENT   │
│                 │  │                 │  │                 │
│  • Single issue │  │  • Single issue │  │  • Single issue │
│  • One feature  │  │  • One feature  │  │  • One feature  │
│    branch       │  │    branch       │  │    branch       │
│  • One worktree │  │  • One worktree │  │  • One worktree │
│  • Isolated env │  │  • Isolated env │  │  • Isolated env │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Manager Agent Role

### Identity
You are the **Development Manager** for Ghost Note. You maintain the big picture, coordinate work, and ensure quality.

**You NEVER write implementation code. You delegate ALL implementation to headless workers.**

### Responsibilities

1. **Planning**
   - Maintain `BACKLOG.md` and `plan.md`
   - Create GitHub issues from backlog items
   - Prioritize and sequence work
   - Track dependencies

2. **Spawning Workers**
   - Use `./scripts/spawn-worker-headless.sh <issue-number>`
   - Workers run autonomously and create PRs
   - Can spawn multiple workers in parallel for independent issues
   - Track active workers via `./scripts/list-workers.sh`

3. **Monitoring & Review**
   - Monitor GitHub for PR activity via `gh pr list`
   - Check Claude's automated code review comments
   - Spawn rework workers if changes needed
   - Merge approved PRs via `gh pr merge`
   - Update plan.md with progress

4. **Cleanup & Release**
   - Remove worktrees after merge: `./scripts/cleanup-worker.sh <N>`
   - Tag milestones
   - Update CHANGELOG

### Manager Workflow

```bash
# 1. Find a worker-ready issue
gh issue list --label "worker-ready"

# 2. Spawn a headless worker (runs autonomously)
./scripts/spawn-worker-headless.sh 1

# 3. Monitor for PR creation
gh pr list --head feature/GH-1

# 4. Check CI and review status
gh pr checks <pr-number>
gh pr view <pr-number>

# 5. After approval, merge
gh pr merge <pr-number> --squash

# 6. Cleanup worktree
./scripts/cleanup-worker.sh 1

# 7. Update plan.md with progress
```

### Parallel Workers

For independent issues, spawn multiple workers simultaneously:

```bash
# These can run in parallel (no dependencies)
./scripts/spawn-worker-headless.sh 5 &
./scripts/spawn-worker-headless.sh 6 &
./scripts/spawn-worker-headless.sh 11 &
wait

# Monitor all PRs
gh pr list
```

### Manager Files
- `CLAUDE.md` - Full project context (auto-loaded)
- `plan.md` - Working memory, current state
- `BACKLOG.md` - Complete issue list
- `docs/` - All architecture and design docs

---

## Worker Agent Role

### Identity
You are a **Worker Agent** for Ghost Note. You implement a single, specific issue in isolation.

### Key Principles

1. **Single Focus**: Complete ONE issue, nothing more
2. **No Regression**: Never remove functionality, only add
3. **Large Scope OK**: Don't oversimplify - implement fully
4. **Debug Properly**: Add logging, handle corner cases, don't stab around
5. **Document Changes**: Update relevant docs if architecture changes
6. **Test Your Work**: Write tests, run them, ensure they pass

### Worker Workflow

```
1. Read WORKER_CLAUDE.md (your role instructions)
2. Read the assigned GitHub issue
3. Read relevant docs (linked in issue)
4. Implement the feature
5. Write/update tests
6. Run linter and tests
7. Commit with descriptive message
8. Push feature branch
9. Create PR with summary
10. Done - await review
```

### Worker Environment

Each worker operates in:
- **Isolated worktree**: `../ghost-note-worker-{issue}/`
- **Dedicated branch**: `feature/GH-{issue}`
- **Isolated port**: See `worker-config.json` for assigned port
- **Fresh context**: Only WORKER_CLAUDE.md and issue context

### Worker Commands

```bash
# Install dependencies (first time)
npm install

# Run dev server (on assigned port)
PORT={assigned_port} npm run dev

# Run tests
npm test

# Run linter
npm run lint

# Commit changes
git add .
git commit -m "feat(GH-{N}): description

- Detail 1
- Detail 2

Closes #{N}"

# Push and create PR
git push -u origin feature/GH-{N}
gh pr create --title "feat(GH-{N}): description" --body "..."
```

### Worker Files
- `WORKER_CLAUDE.md` - Role-specific instructions (in worktree root)
- GitHub issue - Assignment details
- Linked docs - Relevant architecture context

### What Workers Should NOT Do

- ❌ Modify `CLAUDE.md`, `plan.md`, or `BACKLOG.md`
- ❌ Work on multiple issues
- ❌ Push to `main` directly
- ❌ Delete or simplify existing functionality
- ❌ Skip tests or linting
- ❌ Make "quick fixes" without understanding root cause
- ❌ Ignore code review feedback

---

## Resource Isolation

### Port Allocation

Workers receive dedicated ports to avoid conflicts:

| Worker | Dev Server Port | Test Port |
|--------|-----------------|-----------|
| Worker 1 | 5001 | 5101 |
| Worker 2 | 5002 | 5102 |
| Worker 3 | 5003 | 5103 |
| Worker 4 | 5004 | 5104 |
| Worker 5 | 5005 | 5105 |

Configured in `worker-config.json` per worktree.

### Database Isolation (If Applicable)

If we add a database later:
- Each worker gets isolated schema: `ghost_note_worker_{N}`
- Or isolated SQLite file: `ghost-note-worker-{N}.db`

### File System Isolation

Git worktrees provide complete isolation:
```
/Users/bedwards/
├── ghost-note/                    # Main (manager)
├── ghost-note-worker-001/         # Worker 1 worktree
├── ghost-note-worker-002/         # Worker 2 worktree
└── ghost-note-worker-003/         # Worker 3 worktree
```

Each worktree has its own:
- Working directory
- node_modules (after npm install)
- Local config files
- Build outputs

---

## GitHub Workflow

### Branch Strategy

```
main
  │
  ├── feature/GH-001  (worker 1)
  ├── feature/GH-002  (worker 2)
  ├── feature/GH-003  (worker 3)
  │
  └── (merge after review)
```

### PR Review Process

1. Worker creates PR
2. Claude GitHub Action auto-reviews
3. Manager monitors review comments
4. If changes needed:
   - Manager spawns new worker with PR context
   - New worker addresses review comments
   - Pushes to same branch
5. When approved:
   - Manager merges PR
   - Manager updates plan.md
   - Manager deletes worktree

### Issue Labels

| Label | Meaning |
|-------|---------|
| `worker-ready` | Can be assigned to worker |
| `blocked` | Has unmet dependencies |
| `in-progress` | Worker currently assigned |
| `in-review` | PR created, awaiting review |
| `needs-rework` | Review requested changes |

---

## Orchestration Scripts

### spawn-worker.sh
```bash
#!/bin/bash
# Usage: ./scripts/spawn-worker.sh <issue-number>

ISSUE=$1
WORKER_DIR="../ghost-note-worker-$ISSUE"
BRANCH="feature/GH-$ISSUE"

# Create worktree
git worktree add "$WORKER_DIR" -b "$BRANCH"

# Copy worker config
cp WORKER_CLAUDE.md "$WORKER_DIR/CLAUDE.md"
echo "{\"port\": $((5000 + ISSUE % 100))}" > "$WORKER_DIR/worker-config.json"

# Install dependencies
cd "$WORKER_DIR" && npm install

echo "Worker environment ready at $WORKER_DIR"
echo "Assigned port: $((5000 + ISSUE % 100))"
```

### cleanup-worker.sh
```bash
#!/bin/bash
# Usage: ./scripts/cleanup-worker.sh <issue-number>

ISSUE=$1
WORKER_DIR="../ghost-note-worker-$ISSUE"
BRANCH="feature/GH-$ISSUE"

# Remove worktree
git worktree remove "$WORKER_DIR" --force

# Delete branch if merged
git branch -d "$BRANCH" 2>/dev/null || echo "Branch not merged, keeping"

echo "Worker $ISSUE cleaned up"
```

---

## Communication Patterns

### Manager → Worker (Spawn)

```
You are a Worker Agent for Ghost Note.

## Your Assignment
- Issue: GH-{N}
- Branch: feature/GH-{N}
- Worktree: ../ghost-note-worker-{N}

## Issue Details
{paste issue body}

## Relevant Documentation
- Read: docs/ANALYSIS_PIPELINE.md (for this feature)
- Interface: See types in src/types/analysis.ts

## Instructions
1. Read CLAUDE.md in this directory (worker role)
2. Implement the feature fully - no shortcuts
3. Write tests
4. Run lint and tests
5. Commit and push
6. Create PR
7. Report completion

## Constraints
- Do not modify files outside your scope
- Do not simplify or remove existing code
- Add logging for debugging
- Handle edge cases explicitly
```

### Worker → Manager (Completion)

Worker creates PR with:
```markdown
## Summary
- Implemented {feature description}
- Added tests for {test coverage}

## Changes
- `src/analysis/meter.ts` - New meter detection module
- `src/analysis/meter.test.ts` - Unit tests
- `docs/ANALYSIS_PIPELINE.md` - Updated with implementation notes

## Testing
- [ ] Unit tests pass
- [ ] Lint passes
- [ ] Manual testing performed

## Notes for Review
{any concerns or decisions made}

Closes #{issue_number}
```

### Manager → Worker (Rework)

```
You are a Worker Agent for Ghost Note.

## Your Assignment
- PR: #{pr_number}
- Branch: feature/GH-{N} (already exists)
- Task: Address code review feedback

## Review Comments
{paste review comments}

## Instructions
1. Checkout the existing branch
2. Address each review comment
3. Do NOT introduce new features
4. Run tests
5. Push changes
6. Comment on PR that changes are complete
```

---

## Worker Debugging

### Understanding Worker Timing

Workers take **10-15 minutes** for complex implementations. This is normal - they:
1. Read docs and understand requirements (2-3 min)
2. Plan implementation approach (1-2 min)
3. Write implementation code (5-8 min)
4. Write tests (3-5 min)
5. Run lint/tests and fix issues (2-3 min)
6. Commit, push, create PR (1 min)

Low CPU usage during this time is expected - workers spend most time waiting on API responses.

### STATUS.md for Progress Visibility

Use `spawn-worker-debug.sh` to get visibility into worker progress. Workers write `STATUS.md` with:

```markdown
# Worker Status: GH-{N}

## Current Phase
[planning/reading/implementing/testing/committing]

## Progress
- [x] Read CLAUDE.md
- [x] Understood requirements
- [ ] Created implementation files
...

## Current Activity
[What worker is doing now]

## Files Created/Modified
[List of files]

## Errors Encountered
[Any errors]
```

### Debug Scripts

```bash
# Full debug mode - worker writes STATUS.md
./scripts/spawn-worker-debug.sh <issue-number> [model]

# Minimal test - verify Claude CLI works (30 seconds)
./scripts/spawn-worker-minimal.sh <issue-number> [model]
```

### Monitoring Workers

```bash
# Check if workers are running
ps aux | grep "claude -p.*GH-" | grep -v grep

# Check CPU time (should increase over time)
ps aux | grep "claude -p.*GH-" | grep -v grep | awk '{print $2, $10}'

# Check STATUS.md for progress
cat /path/to/ghost-note-worker-N/STATUS.md

# Check git status for file creation
git -C /path/to/ghost-note-worker-N status --short
```

### When Workers Seem Stuck

1. **Check CPU time** - If increasing slowly, worker is working (API-bound)
2. **Check STATUS.md** - Shows current phase and activity
3. **Check git status** - Shows files being created
4. **Wait longer** - Complex issues take 10-15+ minutes
5. **If truly stuck** (no CPU for 30+ min):
   ```bash
   pkill -f "claude -p.*GH-{N}"
   ./scripts/cleanup-worker.sh {N}
   ./scripts/spawn-worker-debug.sh {N}  # Respawn with debug
   ```

### Worktree Conflicts After Merge

If PRs have conflicts after another PR merges:

```bash
cd /path/to/ghost-note-worker-N
rm -f STATUS.md worker-config.json  # Remove untracked files
git fetch origin main
git rebase origin/main
# Resolve conflicts if any
git push --force-with-lease
```

---

## Best Practices

### For Manager

1. **Don't micromanage**: Give workers full context, let them solve
2. **Track everything**: Update plan.md after every major action
3. **Batch similar issues**: Group related issues for parallel work
4. **Review quickly**: Don't let PRs sit - spawn rework workers fast
5. **Tag milestones**: Create git tags at major points

### For Workers

1. **Read first**: Understand the codebase before changing it
2. **Go big**: Implement features fully, don't cut corners
3. **Log everything**: Add debug logging for future debugging
4. **Test thoroughly**: Write tests that actually verify behavior
5. **Document decisions**: Add comments explaining non-obvious choices
6. **Commit often**: Small commits with clear messages
7. **Ask for help**: If truly blocked, note it in PR

---

## Debugging Philosophy

Both manager and workers follow these debugging principles:

1. **Add logging first**: Before changing code, add logs to understand flow
2. **Reproduce reliably**: Create a test case that triggers the bug
3. **Understand root cause**: Don't fix symptoms, fix causes
4. **Handle corner cases**: If you find one edge case, look for others
5. **Never remove code blindly**: Understand why code exists before removing
6. **Preserve functionality**: Fixes should not break other features

---

## References

- [Simon Willison: Parallel Coding Agents](https://simonwillison.net/2025/Oct/5/parallel-coding-agents/)
- [ccswarm: Multi-agent Orchestration](https://github.com/nwiizo/ccswarm)
- [PulseMCP: Agent Clusters](https://www.pulsemcp.com/posts/how-to-use-claude-code-to-wield-coding-agent-clusters)
- [Anthropic: Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
