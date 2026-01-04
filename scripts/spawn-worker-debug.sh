#!/bin/bash
# spawn-worker-debug.sh - Spawn a worker in debug mode
# Usage: ./scripts/spawn-worker-debug.sh <issue-number> [model]
#
# This version:
# - Adds --debug and --verbose flags to Claude CLI
# - Instructs worker to write status to STATUS.md in worktree (not committed)
# - Logs output to a file for inspection

set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/spawn-worker-debug.sh <issue-number> [model]"
    echo "  model: opus (default), sonnet, haiku"
    exit 1
fi

ISSUE=$1
MODEL="${2:-opus}"
WORKER_DIR="../ghost-note-worker-$ISSUE"
LOG_FILE="../ghost-note-worker-$ISSUE-debug.log"

# First ensure worktree exists
if [ ! -d "$WORKER_DIR" ]; then
    echo "Creating worker environment first..."
    ./scripts/spawn-worker.sh "$ISSUE"
fi

# Get issue details
echo "📋 Fetching issue GH-$ISSUE details..."
ISSUE_BODY=$(gh issue view "$ISSUE" --json title,body --jq '.title + "\n\n" + .body')

# Create the prompt with status file instructions
PROMPT="You are a Worker Agent for Ghost Note (DEBUG MODE).

## Your Assignment
- Issue: GH-$ISSUE
- Branch: feature/GH-$ISSUE
- Worktree: $WORKER_DIR

## Issue Details
$ISSUE_BODY

## DEBUG INSTRUCTIONS (DO THIS FIRST)
Before doing anything else, create a file called STATUS.md in the root of your worktree.
Update this file as you progress through the task. Format:

\`\`\`markdown
# Worker Status: GH-$ISSUE

## Current Phase
[planning/reading/implementing/testing/committing]

## Last Updated
[timestamp]

## Progress
- [ ] Read CLAUDE.md
- [ ] Understood requirements
- [ ] Created implementation files
- [ ] Wrote tests
- [ ] Ran lint
- [ ] Ran tests
- [ ] Committed changes
- [ ] Pushed to remote
- [ ] Created PR

## Current Activity
[What you are doing right now]

## Files Created/Modified
[List files]

## Errors Encountered
[Any errors]

## Notes
[Any observations]
\`\`\`

DO NOT add STATUS.md to git. It's for debugging only.

## Regular Instructions
1. Read CLAUDE.md in this directory (worker role instructions)
2. Implement the feature completely - no shortcuts
3. Write comprehensive tests
4. Run lint and tests: npm run lint && npm test
5. Commit with message: feat(GH-$ISSUE): <description>
6. Push: git push -u origin HEAD
7. Create PR: gh pr create --title 'feat(GH-$ISSUE): <title>' --body '<summary>'

## Constraints
- Do not modify files outside your scope
- Do not simplify or remove existing code
- Add logging for debugging
- Handle edge cases explicitly
- Complete the full implementation
- UPDATE STATUS.md regularly as you work!

Begin now by creating STATUS.md, then proceed with the implementation."

# Run Claude headless with debug options
echo "🤖 Spawning Claude worker with model: $MODEL (DEBUG MODE)..."
echo "📝 Logging to: $LOG_FILE"
echo "📊 Status file: $WORKER_DIR/STATUS.md"
cd "$WORKER_DIR"

# Run with debug and verbose, capture output
claude -p "$PROMPT" \
    --model "$MODEL" \
    --dangerously-skip-permissions \
    --verbose \
    2>&1 | tee "$LOG_FILE"

echo ""
echo "✅ Worker session completed"
echo "📝 Check log: $LOG_FILE"
echo "📊 Check status: $WORKER_DIR/STATUS.md"
echo "Check for PR: gh pr list --head feature/GH-$ISSUE"
