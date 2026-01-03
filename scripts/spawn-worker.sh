#!/bin/bash
# spawn-worker.sh - Create isolated worktree for a worker agent
# Usage: ./scripts/spawn-worker.sh <issue-number>

set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/spawn-worker.sh <issue-number>"
    echo "Example: ./scripts/spawn-worker.sh 001"
    exit 1
fi

ISSUE=$1
ISSUE_NUM=$(echo "$ISSUE" | sed 's/^0*//')  # Remove leading zeros for calculations
WORKER_DIR="../ghost-note-worker-$ISSUE"
BRANCH="feature/GH-$ISSUE"
PORT=$((5000 + (ISSUE_NUM % 100)))
TEST_PORT=$((5100 + (ISSUE_NUM % 100)))

echo "🔧 Setting up Worker for Issue GH-$ISSUE"
echo "   Directory: $WORKER_DIR"
echo "   Branch: $BRANCH"
echo "   Port: $PORT"
echo "   Test Port: $TEST_PORT"
echo ""

# Check if worktree already exists
if [ -d "$WORKER_DIR" ]; then
    echo "⚠️  Worker directory already exists: $WORKER_DIR"
    echo "   Run ./scripts/cleanup-worker.sh $ISSUE first"
    exit 1
fi

# Create worktree with new branch
echo "📁 Creating git worktree..."
git worktree add "$WORKER_DIR" -b "$BRANCH" 2>/dev/null || {
    # Branch might already exist
    git worktree add "$WORKER_DIR" "$BRANCH"
}

# Copy worker instructions
echo "📝 Setting up worker configuration..."
cp WORKER_CLAUDE.md "$WORKER_DIR/CLAUDE.md"

# Create worker config
cat > "$WORKER_DIR/worker-config.json" << EOF
{
  "issueNumber": "$ISSUE",
  "branch": "$BRANCH",
  "port": $PORT,
  "testPort": $TEST_PORT,
  "createdAt": "$(date -Iseconds)"
}
EOF

# Create .env.local for the worker
cat > "$WORKER_DIR/.env.local" << EOF
# Worker-specific environment
VITE_PORT=$PORT
PORT=$PORT
EOF

echo ""
echo "✅ Worker environment ready!"
echo ""
echo "To start worker session:"
echo "  cd $WORKER_DIR"
echo "  claude"
echo ""
echo "Or run headless:"
echo "  claude -p 'Complete issue GH-$ISSUE' --cwd $WORKER_DIR"
echo ""
