# Context Engineering Guide for Ghost Note

> Best practices for maintaining project coherence across Claude sessions.
> Based on Anthropic's 2025 engineering blog recommendations.

## The Challenge

When Claude's context window fills up or gets compacted:
- Broad project perspective can be lost
- Focus narrows to current task
- Architectural decisions may be forgotten
- Redundant work may occur

## Our Strategy

### 1. Persistent Memory Files

| File | Purpose | When to Update |
|------|---------|----------------|
| `CLAUDE.md` | Project vision, architecture, conventions | Major decisions only |
| `plan.md` | Current tasks, progress, session notes | Every session |
| `docs/ARCHITECTURE.md` | Detailed system design | When architecture changes |

### 2. Context Hierarchy

```
High-level (always loaded):
├── CLAUDE.md (project overview)
│
Mid-level (referenced as needed):
├── plan.md (current state)
├── docs/ARCHITECTURE.md
│
Low-level (loaded on demand):
├── Source files
├── Test files
└── Config files
```

### 3. Session Management

**Starting a Session**:
1. Claude automatically loads `CLAUDE.md`
2. Run `/status` command to load current state from `plan.md`
3. Context is now primed with project overview + current progress

**During a Session**:
- Use `/clear` between unrelated tasks
- Keep `plan.md` updated as checkpoint
- Commit code frequently (git history = memory)

**Ending a Session**:
1. Update `plan.md` with:
   - What was completed
   - What's in progress
   - Any blockers or questions
   - Session notes
2. Commit changes to git

### 4. Compaction Survival

When context gets compacted, Claude summarizes and preserves:
- Architectural decisions
- Unresolved bugs
- Implementation details in progress

**Help Claude by**:
- Writing clear commit messages
- Keeping `plan.md` current
- Documenting "why" not just "what"

### 5. Multi-Agent Patterns

For complex tasks, consider parallel Claude instances:

```
Claude A: Planning/Architecture
    └── Writes to: plan.md

Claude B: Implementation
    └── Reads from: plan.md
    └── Writes code

Claude C: Review/Testing
    └── Reviews Claude B's work
```

Each instance has clean context, reducing confusion.

### 6. Slash Commands as Context Anchors

Our custom commands (`/.claude/commands/`) include context about:
- Expected output formats
- Domain knowledge (ABC notation, music theory)
- Project-specific conventions

This reduces need to explain repeatedly.

### 7. The "Altitude" Principle

Keep instructions at the right altitude:
- **Too high**: "Make it good" (unhelpful)
- **Too low**: Every micro-decision (overwhelming)
- **Right altitude**: Clear goals + flexibility for approach

Example for Ghost Note:
- "Generate a singable melody" (too vague)
- "Use C major, 4/4, quarter=100, start on G4, end on C4" (too specific)
- "Generate a melody in ABC notation matching the syllable stress pattern, singable range, common time" (right altitude)

## Practical Checklist

### Before Complex Work
- [ ] Is `plan.md` up to date?
- [ ] Is the task broken into clear steps?
- [ ] Have I committed recent work?

### After Major Changes
- [ ] Updated `plan.md`?
- [ ] Need to update `CLAUDE.md`?
- [ ] Committed with descriptive message?

### Signs Context Needs Reset
- Claude repeating questions already answered
- Contradicting earlier decisions
- Losing track of file locations
- Suggesting already-rejected approaches

**Solution**: Run `/clear`, reload plan.md, summarize current state.

## Reference

- [Anthropic: Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Anthropic: Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Nathan LeClaire: Vibing Best Practices](https://nathanleclaire.com/blog/2025/03/10/vibing-best-practices-with-claude-code/)
