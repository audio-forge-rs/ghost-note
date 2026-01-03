# User Workflows

## Primary Workflow: Poem to Song

### Step 1: Input Poem
1. User opens Ghost Note web app
2. Pastes or types their poem into the input area
3. System automatically detects structure:
   - Number of stanzas
   - Lines per stanza
   - Syllable counts
   - Rhyme scheme (e.g., ABAB, AABB)

### Step 2: Review Analysis
1. See original poem with annotations:
   - Syllable counts per line
   - Detected meter (iambic, trochaic, etc.)
   - Rhyme scheme markers
   - Potential "trouble spots" for singing

### Step 3: Adjust Lyrics
1. Review suggested changes for singability
2. See side-by-side diff (original vs suggested)
3. Accept, reject, or modify each suggestion
4. Make manual edits as needed
5. Each change creates a new version

### Step 4: Generate Melody
1. Click "Generate Melody"
2. System creates ABC notation melody based on:
   - Syllable stress patterns
   - Emotional arc of poem
   - Standard musical conventions
3. See rendered sheet music
4. Play melody with browser synth

### Step 5: Iterate
1. Adjust melody parameters (tempo, key, range)
2. Regenerate if needed
3. Fine-tune lyrics to match melody better
4. All versions tracked for easy rollback

### Step 6: Record
1. Click "Record" to start recording session
2. Hear melody playback while singing
3. Review recording
4. Re-record until satisfied
5. Download final audio

---

## Secondary Workflows

### Comparing Versions

1. Open version history panel
2. Select any two versions
3. See inline diff highlighting:
   - Red: Removed text
   - Green: Added text
   - Yellow: Modified text
4. Click to revert to any version

### Adjusting Melody

1. View ABC notation source
2. Edit directly or use visual controls
3. Preview changes in real-time
4. Save as new melody version

### Exporting

**Lyrics**:
- Plain text
- Formatted with stanza breaks
- With annotations (syllables, rhymes)

**Melody**:
- ABC notation file
- MIDI file
- Sheet music PDF (future)

**Recording**:
- WebM audio file
- MP3 (requires conversion, future)

---

## Claude Integration Workflows

### Using Claude Code CLI

```bash
# Open project directory
cd ghost-note

# Start Claude Code
claude

# Example prompts:
"analyze this poem for singability: [paste poem]"
"suggest lyric changes for the second stanza"
"generate an ABC notation melody for these lyrics"
"help me fix the meter in line 3"
```

### Using Claude Desktop (Code Mode)

1. Open Claude Desktop
2. Switch to Code Mode
3. Open ghost-note project folder
4. Use natural language to:
   - Get help with poem analysis
   - Debug audio recording issues
   - Improve melody generation

### Using Claude Chrome Extension

1. Open Ghost Note in browser
2. Open Claude Chrome Extension
3. Connect to Claude Code (if running)
4. Use for:
   - Testing UI changes
   - Reading console errors
   - Visual debugging
   - Recording workflow automation

**Example workflow recording**:
1. Click record in extension
2. Go through poem → song workflow
3. Stop recording
4. Claude learns the workflow
5. Can replay/automate later

---

## Developer Workflows

### Adding a New Feature

1. Start Claude Code in plan mode (Shift+Tab twice)
2. Describe the feature
3. Claude creates plan in plan.md
4. Review and approve plan
5. Claude implements with tests
6. Review code and commit

### Debugging

1. Run `npm run dev`
2. Open localhost in browser
3. Connect Claude Chrome Extension
4. Reproduce bug
5. Ask Claude to check console
6. Claude reads errors, suggests fix
7. Implement fix, verify in browser

### Testing

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- src/components/PoemInput.test.tsx

# Watch mode
npm run test:watch
```

---

## Workflow Tips

### For Best Results

1. **Start with structured poems**: Regular meter and rhyme schemes work best initially
2. **Iterate in small steps**: Make one type of change at a time
3. **Use version history**: Don't be afraid to experiment, you can always revert
4. **Listen before editing**: Play the melody to understand how lyrics flow

### Common Issues

| Issue | Solution |
|-------|----------|
| Melody doesn't match stress | Regenerate with manual stress hints |
| Recording sounds off | Check browser audio permissions |
| Diff view confusing | Switch to side-by-side mode |
| Too many versions | Archive old versions |

### Keyboard Shortcuts (Planned)

| Shortcut | Action |
|----------|--------|
| Cmd+Enter | Generate melody |
| Space | Play/pause |
| Cmd+Z | Undo to previous version |
| Cmd+S | Save current state |
| R | Start/stop recording |
