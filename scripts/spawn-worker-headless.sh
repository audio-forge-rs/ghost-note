#!/bin/bash
# spawn-worker-headless.sh - Spawn a worker in headless mode
# Usage: ./scripts/spawn-worker-headless.sh <issue-number> [model]
# Model defaults to opus (latest Claude Opus 4.5)

set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/spawn-worker-headless.sh <issue-number> [model]"
    echo "  model: opus (default), sonnet, haiku"
    exit 1
fi

ISSUE=$1
MODEL="${2:-opus}"
WORKER_DIR="../ghost-note-worker-$ISSUE"

# First ensure worktree exists
if [ ! -d "$WORKER_DIR" ]; then
    echo "Creating worker environment first..."
    ./scripts/spawn-worker.sh "$ISSUE"
fi

# Get issue details
echo "📋 Fetching issue GH-$ISSUE details..."
ISSUE_BODY=$(gh issue view "$ISSUE" --json title,body --jq '.title + "\n\n" + .body')

# Create the prompt
PROMPT="You are a Worker Agent for Ghost Note.

## Your Assignment
- Issue: GH-$ISSUE
- Branch: feature/GH-$ISSUE
- Worktree: $WORKER_DIR

## Issue Details
$ISSUE_BODY

## Instructions
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

Begin now."

# Run Claude headless
echo "🤖 Spawning Claude worker with model: $MODEL..."
cd "$WORKER_DIR"
claude -p "$PROMPT" --model "$MODEL" --dangerously-skip-permissions

echo ""
echo "✅ Worker session completed"
echo "Check for PR: gh pr list --head feature/GH-$ISSUE"
