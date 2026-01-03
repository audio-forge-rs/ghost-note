# GitHub Setup Guide

> Instructions for setting up GitHub integrations for Ghost Note.

## 1. Claude GitHub App (Required for Auto-Review)

The Claude GitHub App enables automatic code review on PRs.

### Installation (One Command)

In Claude Code CLI, run:
```
/install-github-app
```

This automatically:
- Creates the GitHub Actions workflow
- Saves `CLAUDE_CODE_OAUTH_TOKEN` as a repository secret
- Opens a PR for you to merge

### Verify Installation

After merging the PR:
- Create a test PR
- Claude should automatically comment with a review
- You can also mention `@claude` in PR comments

## 2. Branch Protection Rules

Recommended settings for `main` branch:

1. Go to: https://github.com/audio-forge-rs/ghost-note/settings/branches
2. Click "Add branch protection rule"
3. Branch name pattern: `main`
4. Enable:
   - [x] Require a pull request before merging
   - [x] Require approvals (1)
   - [x] Require status checks to pass before merging
     - Select: `lint`, `test`, `build`
   - [x] Require conversation resolution before merging
   - [x] Do not allow bypassing the above settings

## 3. Labels Setup

Create these labels for issue management:

```bash
# Priority labels
gh label create "priority:P0" --color "FF0000" --description "Critical path - blocks other work"
gh label create "priority:P1" --color "FF6600" --description "High priority - core functionality"
gh label create "priority:P2" --color "FFCC00" --description "Medium priority - important features"
gh label create "priority:P3" --color "99FF00" --description "Lower priority - enhancements"

# Type labels
gh label create "type:feature" --color "0066FF" --description "New feature"
gh label create "type:task" --color "0099FF" --description "Task or chore"
gh label create "type:bug" --color "FF0033" --description "Bug fix"
gh label create "type:research" --color "9900FF" --description "Research or investigation"

# Status labels
gh label create "worker-ready" --color "00FF66" --description "Ready to assign to worker agent"
gh label create "blocked" --color "FF3366" --description "Has unmet dependencies"
gh label create "in-progress" --color "FFFF00" --description "Worker currently assigned"
gh label create "in-review" --color "FF9900" --description "PR under review"
gh label create "needs-rework" --color "FF6699" --description "Review requested changes"

# Component labels
gh label create "component:analysis" --color "6699FF" --description "Poem analysis engine"
gh label create "component:melody" --color "66FF99" --description "Melody generation"
gh label create "component:ui" --color "FF66FF" --description "User interface"
gh label create "component:recording" --color "66FFFF" --description "Recording studio"
gh label create "component:infra" --color "999999" --description "Infrastructure"

# Epic labels
gh label create "epic:infrastructure" --color "333333" --description "Epic 1: Project Infrastructure"
gh label create "epic:analysis" --color "333333" --description "Epic 2: Poem Analysis Engine"
gh label create "epic:melody" --color "333333" --description "Epic 3: Melody Generation"
gh label create "epic:ui" --color "333333" --description "Epic 4: Web Application UI"
gh label create "epic:recording" --color "333333" --description "Epic 5: Recording Studio"
```

## 4. Milestones Setup

```bash
gh api repos/audio-forge-rs/ghost-note/milestones -f title="Infrastructure" -f description="Project setup complete"
gh api repos/audio-forge-rs/ghost-note/milestones -f title="Analysis MVP" -f description="Basic poem analysis working"
gh api repos/audio-forge-rs/ghost-note/milestones -f title="Melody MVP" -f description="Basic melody generation working"
gh api repos/audio-forge-rs/ghost-note/milestones -f title="UI MVP" -f description="Usable web interface"
gh api repos/audio-forge-rs/ghost-note/milestones -f title="Recording" -f description="Recording studio working"
gh api repos/audio-forge-rs/ghost-note/milestones -f title="Beta" -f description="Feature complete beta"
gh api repos/audio-forge-rs/ghost-note/milestones -f title="V1" -f description="Production release"
```

## 5. GitHub Actions Secrets

Required secrets:
- `ANTHROPIC_API_KEY` - For Claude code review

Optional secrets (for deployment):
- `CLOUDFLARE_API_TOKEN` - For Cloudflare Pages deployment
- `CLOUDFLARE_ACCOUNT_ID` - For Cloudflare Pages deployment

## 6. Webhook Configuration (Optional)

For advanced orchestration, you can set up webhooks:

1. Go to: https://github.com/audio-forge-rs/ghost-note/settings/hooks
2. Add webhook for:
   - PR opened/closed events
   - Issue events
   - Review events

This enables external orchestration systems to react to GitHub events.

## Verification Checklist

- [ ] Claude GitHub App installed
- [ ] ANTHROPIC_API_KEY secret added
- [ ] Branch protection rules configured
- [ ] Labels created
- [ ] Milestones created
- [ ] Test PR triggers Claude review

## Troubleshooting

### Claude not reviewing PRs
1. Check if app is installed: Settings → Integrations → GitHub Apps
2. Check if secret exists: Settings → Secrets → Actions
3. Check workflow runs: Actions tab
4. Check for errors in workflow logs

### Workflow failing
1. Check if `web/` directory exists with package.json
2. Ensure all npm scripts exist (lint, test, build, typecheck)
3. Check Node.js version compatibility
