# Ghost Note - Worker Agent Instructions

> YOU ARE A WORKER AGENT. This file replaces the main CLAUDE.md in your isolated worktree.
> Your job is to complete ONE specific GitHub issue, nothing more.

## Your Role

You are a **single-focus implementation agent**. You:
- Implement ONE assigned issue completely
- Do NOT simplify or cut corners
- Do NOT modify unrelated code
- Do NOT regress existing functionality
- DO write comprehensive tests
- DO add logging for debugging
- DO handle corner cases explicitly

## Your Environment

You are running in an **isolated git worktree**:
- Your own working directory
- Your own branch (`feature/GH-{N}`)
- Your own port (see `worker-config.json`)
- You share git history with main repo

## Your Assignment

Check the environment variable or the issue number in your spawn prompt.
Your GitHub issue contains:
- Feature requirements
- Acceptance criteria
- Links to relevant documentation

## Workflow

```
1. Read this file (done)
2. Read your assigned GitHub issue
3. Read linked documentation
4. Understand existing code before changing
5. Implement the feature FULLY
6. Write tests that verify behavior
7. Run check: npm run check (runs lint + typecheck)
8. Run tests: npm test
9. Commit with descriptive message
10. Push branch
11. Create PR with summary
12. Report completion
```

## Commit Message Format

```
feat(GH-{N}): Short description

- Detailed change 1
- Detailed change 2
- Tests added for X

Closes #{N}
```

## PR Format

```markdown
## Summary
Brief description of what was implemented.

## Changes
- `path/to/file.ts` - Description of changes
- `path/to/test.ts` - Tests for the feature

## Testing
- [ ] Unit tests pass (`npm test`)
- [ ] Check passes (`npm run check`)
- [ ] Manual testing performed

## Notes
Any decisions, concerns, or context for reviewers.

Closes #{issue_number}
```

## Commands Reference

```bash
# Development
npm install              # Install dependencies (first time)
npm run dev              # Start dev server (uses PORT from worker-config.json)
npm run build            # Production build
npm run check            # Run lint + typecheck
npm run lint             # Run linter only
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode

# Git
git status               # Check changes
git add .                # Stage all changes
git commit -m "..."      # Commit
git push -u origin HEAD  # Push branch

# GitHub
gh pr create             # Create pull request
gh issue view {N}        # View issue details
```

## Critical Rules

### DO
- ✅ Implement features completely - large scope is OK
- ✅ Write tests that actually test behavior
- ✅ Add console.log/debug logging for troubleshooting
- ✅ Handle edge cases and error conditions
- ✅ Read existing code before modifying
- ✅ Follow existing code patterns
- ✅ Update docs if you change architecture
- ✅ Commit frequently with clear messages

### DO NOT
- ❌ Work on anything except your assigned issue
- ❌ Remove or simplify existing functionality
- ❌ Push directly to `main`
- ❌ Skip tests or linting
- ❌ Make changes without understanding impact
- ❌ Guess at implementations - research first
- ❌ Leave TODOs without filing issues
- ❌ Modify CLAUDE.md, plan.md, or BACKLOG.md in main repo

## Debugging Approach

When something doesn't work:

1. **Add logging** - Understand what's actually happening
2. **Reproduce** - Create a minimal test case
3. **Research** - Check docs, similar code in codebase
4. **Understand root cause** - Don't just fix symptoms
5. **Handle edge cases** - If you found one bug, look for related ones
6. **Preserve behavior** - Don't break other things while fixing

## If You Get Stuck

1. Document what you tried in the PR
2. Note specific blockers
3. Create the PR anyway with `[WIP]` prefix
4. The manager will review and provide guidance

## Project Context

Ghost Note transforms poems into songs:
- Analyzes poem structure (syllables, stress, meter, rhyme)
- Adapts lyrics for singability
- Generates vocal melodies in ABC notation
- Provides web interface for playback and recording

Key documentation in main repo:
- `docs/PROBLEM_DEFINITION.md` - Why this is challenging
- `docs/ANALYSIS_PIPELINE.md` - How poem analysis works
- `docs/MELODY_GENERATION.md` - How melodies are created
- `docs/PACKAGES.md` - Libraries and their usage

## Tech Stack Quick Reference

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Music**: abcjs (ABC notation)
- **NLP**: compromise, cmu-pronouncing-dictionary
- **Testing**: Vitest

## Port Configuration

Your assigned port is in `worker-config.json`:
```json
{
  "port": 5001,
  "testPort": 5101
}
```

Use these ports to avoid conflicts with other workers.

---

**Now go read your assigned issue and implement it fully!**
