#!/bin/bash
# cleanup-worker.sh - Remove worker worktree after completion
# Usage: ./scripts/cleanup-worker.sh <issue-number>

set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/cleanup-worker.sh <issue-number>"
    echo "Example: ./scripts/cleanup-worker.sh 001"
    exit 1
fi

ISSUE=$1
WORKER_DIR="../ghost-note-worker-$ISSUE"
BRANCH="feature/GH-$ISSUE"

echo "🧹 Cleaning up Worker for Issue GH-$ISSUE"
echo ""

# Check if worktree exists
if [ ! -d "$WORKER_DIR" ]; then
    echo "⚠️  Worker directory not found: $WORKER_DIR"
    exit 1
fi

# Remove worktree
echo "📁 Removing git worktree..."
git worktree remove "$WORKER_DIR" --force

# Try to delete branch (only works if merged)
echo "🌿 Attempting to delete branch..."
if git branch -d "$BRANCH" 2>/dev/null; then
    echo "   Branch deleted (was merged)"
else
    echo "   Branch kept (not merged or has unmerged changes)"
    echo "   To force delete: git branch -D $BRANCH"
fi

echo ""
echo "✅ Worker $ISSUE cleaned up!"
