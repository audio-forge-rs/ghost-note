#!/bin/bash
# spawn-worker-minimal.sh - Minimal worker test
# Usage: ./scripts/spawn-worker-minimal.sh <issue-number> [model]
#
# This is the simplest possible worker - just writes a status file and exits.
# Use this to diagnose if Claude CLI is working at all.

set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/spawn-worker-minimal.sh <issue-number> [model]"
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

echo "📋 Testing minimal worker for GH-$ISSUE..."

# Minimal prompt - just write a file
PROMPT="Write a file called WORKER_TEST.md with this exact content:

# Worker Test
- Issue: GH-$ISSUE
- Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)
- Status: Worker started successfully
- Model: $MODEL

Then exit. Do not do anything else."

echo "🤖 Spawning minimal Claude worker..."
cd "$WORKER_DIR"

# Time the execution
START_TIME=$(date +%s)
claude -p "$PROMPT" --model "$MODEL" --dangerously-skip-permissions
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "⏱️  Duration: ${DURATION}s"

# Check if file was created
if [ -f "WORKER_TEST.md" ]; then
    echo "✅ SUCCESS - Worker created file:"
    cat WORKER_TEST.md
else
    echo "❌ FAILED - No file created"
    echo "Checking worktree contents:"
    ls -la
fi
