# Ghost Note

[![CI](https://github.com/audio-forge-rs/ghost-note/actions/workflows/ci.yml/badge.svg)](https://github.com/audio-forge-rs/ghost-note/actions/workflows/ci.yml)
[![Deploy](https://github.com/audio-forge-rs/ghost-note/actions/workflows/deploy.yml/badge.svg)](https://github.com/audio-forge-rs/ghost-note/actions/workflows/deploy.yml)

Transform poems into songs. Adjust lyrics for singability, generate vocal melodies, record your performance.

**Live Demo**: [https://audio-forge-rs.github.io/ghost-note/](https://audio-forge-rs.github.io/ghost-note/)

> **Note**: The app is deployed from the `audio-forge-rs/ghost-note` repository. GitHub Pages serves it at `audio-forge-rs.github.io/ghost-note`.

## Overview

Ghost Note helps poets and songwriters:
- **Analyze** poem structure (meter, rhyme, syllables)
- **Adapt** lyrics for better singability
- **Generate** vocal melodies in ABC notation
- **Play** melodies directly in the browser
- **Record** yourself singing along
- **Version** all changes with easy diff view

## Interfaces

This project is designed to be used with:
- **Claude Code CLI** - Development and poem analysis
- **Claude Desktop (Code Mode)** - Full development environment
- **Claude Chrome Extension** - Testing, debugging, workflow automation
- **Web App** - End-user interface for the complete workflow

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/ghost-note.git
cd ghost-note

# Navigate to web app directory
cd web

# Install dependencies
npm install

# Start development server
npm run dev
```

## Project Structure

```
ghost-note/
├── CLAUDE.md              # Project context for Claude
├── plan.md                # Current implementation state
├── docs/
│   ├── ARCHITECTURE.md    # System design
│   ├── TECH_STACK.md      # Technology decisions
│   ├── WORKFLOWS.md       # User workflows
│   └── CONTEXT_ENGINEERING.md  # Session management tips
├── .claude/
│   └── commands/          # Custom slash commands
│       ├── analyze-poem.md
│       ├── generate-melody.md
│       ├── suggest-changes.md
│       └── status.md
├── web/                   # Frontend application (React + Vite)
└── lib/                   # Shared libraries (coming soon)
```

## Claude Code Commands

Custom slash commands for common workflows:

| Command | Description |
|---------|-------------|
| `/analyze-poem [text]` | Analyze poem structure and singability |
| `/generate-melody [lyrics]` | Create ABC notation melody |
| `/suggest-changes [lyrics]` | Get singability improvement suggestions |
| `/status` | Check current project status |

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Music**: abcjs (ABC notation rendering + MIDI playback)
- **Audio**: Web Audio API + MediaRecorder
- **Styling**: Tailwind CSS
- **State**: Zustand with persistence

All dependencies are free and open source.

## Development

### With Claude Code

```bash
# Start Claude Code
claude

# Use plan mode for new features
# Press Shift+Tab twice to enter plan mode

# Check project status
/status
```

### With Chrome Extension

1. Run `cd web && npm run dev` to start local server
2. Open localhost in browser
3. Connect Claude Chrome Extension
4. Use for testing and debugging UI

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - System design and data flow
- [Tech Stack](docs/TECH_STACK.md) - Technology choices and rationale
- [Workflows](docs/WORKFLOWS.md) - User and developer workflows
- [Context Engineering](docs/CONTEXT_ENGINEERING.md) - Managing Claude sessions

## Status

**Current Phase**: Project Setup

See [plan.md](plan.md) for detailed progress.

## License

MIT
