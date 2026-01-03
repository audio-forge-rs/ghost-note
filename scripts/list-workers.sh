#!/bin/bash
# list-workers.sh - Show all active worker worktrees
# Usage: ./scripts/list-workers.sh

echo "📋 Active Worker Worktrees"
echo ""

git worktree list | while read -r line; do
    DIR=$(echo "$line" | awk '{print $1}')
    BRANCH=$(echo "$line" | awk '{print $3}' | tr -d '[]')

    if [[ "$DIR" == *"ghost-note-worker"* ]]; then
        # Extract issue number
        ISSUE=$(echo "$DIR" | grep -oE 'worker-[0-9]+' | cut -d'-' -f2)

        # Check for worker-config.json
        if [ -f "$DIR/worker-config.json" ]; then
            PORT=$(cat "$DIR/worker-config.json" | grep '"port"' | grep -oE '[0-9]+')
            echo "Worker GH-$ISSUE"
            echo "  Directory: $DIR"
            echo "  Branch: $BRANCH"
            echo "  Port: $PORT"

            # Check if PR exists
            PR_URL=$(gh pr list --head "$BRANCH" --json url --jq '.[0].url' 2>/dev/null)
            if [ -n "$PR_URL" ]; then
                echo "  PR: $PR_URL"
            else
                echo "  PR: Not created"
            fi
            echo ""
        fi
    fi
done

echo "Total worktrees:"
git worktree list | wc -l
