/**
 * Help Content Data
 *
 * Centralized help content for all documentation topics in Ghost Note.
 * This includes getting started guides, feature explanations, FAQs, and tips.
 *
 * @module components/Help/helpContent
 */

/**
 * Individual help topic definition
 */
export interface HelpTopic {
  /** Unique identifier for the topic */
  id: string;
  /** Display title */
  title: string;
  /** Topic category for grouping */
  category: HelpCategory;
  /** Short description for search/preview */
  summary: string;
  /** Full content (supports markdown-like formatting) */
  content: string;
  /** Keywords for search */
  keywords: string[];
  /** Related topic IDs */
  related?: string[];
}

/**
 * Help content categories
 */
export type HelpCategory =
  | 'getting-started'
  | 'analysis'
  | 'suggestions'
  | 'melody'
  | 'recording'
  | 'shortcuts';

/**
 * Category display information
 */
export interface CategoryInfo {
  id: HelpCategory;
  title: string;
  description: string;
  icon: string;
}

/**
 * FAQ item definition
 */
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: HelpCategory;
}

/**
 * Category metadata for display
 */
export const HELP_CATEGORIES: CategoryInfo[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of Ghost Note',
    icon: 'rocket',
  },
  {
    id: 'analysis',
    title: 'Understanding Analysis',
    description: 'How poem analysis works',
    icon: 'chart',
  },
  {
    id: 'suggestions',
    title: 'Working with Suggestions',
    description: 'Using and applying lyric suggestions',
    icon: 'lightbulb',
  },
  {
    id: 'melody',
    title: 'Melody Customization',
    description: 'Adjusting and playing melodies',
    icon: 'music',
  },
  {
    id: 'recording',
    title: 'Recording Tips',
    description: 'Recording your performance',
    icon: 'microphone',
  },
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'Speed up your workflow',
    icon: 'keyboard',
  },
];

/**
 * All help topics
 */
export const HELP_TOPICS: HelpTopic[] = [
  // Getting Started
  {
    id: 'what-is-ghost-note',
    title: 'What is Ghost Note?',
    category: 'getting-started',
    summary: 'An introduction to Ghost Note and its purpose.',
    content: `Ghost Note transforms poems into songs by analyzing the linguistic structure of your text and generating singable melodies that match the natural rhythm and emotion of your words.

**Key Features:**
- Automatic syllable and stress analysis
- Rhyme scheme detection
- Singability scoring
- AI-powered melody generation
- Voice recording studio

Ghost Note helps poets, songwriters, and anyone who wants to hear their words come alive as music.`,
    keywords: ['introduction', 'about', 'overview', 'purpose'],
    related: ['workflow-overview', 'entering-poem'],
  },
  {
    id: 'workflow-overview',
    title: 'Workflow Overview',
    category: 'getting-started',
    summary: 'The step-by-step process from poem to song.',
    content: `Ghost Note follows a simple five-step workflow:

**1. Enter Your Poem**
Paste or type your poem into the text area. The app will automatically detect stanzas and line breaks.

**2. Analyze the Text**
The analysis engine examines syllables, stress patterns, rhyme schemes, and emotional content to understand your poem's structure.

**3. Review & Edit Lyrics**
View analysis results and apply suggested improvements to make your lyrics more singable.

**4. Generate Melody**
Create a vocal melody line that aligns stressed syllables with strong beats and matches your poem's emotional arc.

**5. Record Your Performance**
Use the built-in recording studio to capture your vocal performance alongside the generated melody.`,
    keywords: ['workflow', 'steps', 'process', 'how to use'],
    related: ['entering-poem', 'understanding-analysis'],
  },
  {
    id: 'entering-poem',
    title: 'Entering Your Poem',
    category: 'getting-started',
    summary: 'How to input and format your poem.',
    content: `**Entering Text**
Simply paste your poem into the text area or type it directly. Ghost Note preserves your original formatting.

**Formatting Tips:**
- Use single line breaks between lines within a stanza
- Use double line breaks (blank lines) to separate stanzas
- Standard punctuation is preserved and helps with analysis

**Sample Poems**
Click "Try a Sample" to load one of several classic poems to experiment with before using your own work.

**Character Limits**
While there's no strict limit, Ghost Note works best with poems of 4-50 lines. Very long poems may take longer to analyze and generate melodies for.`,
    keywords: ['input', 'text', 'paste', 'type', 'format', 'sample'],
    related: ['workflow-overview', 'understanding-analysis'],
  },

  // Understanding Analysis
  {
    id: 'understanding-analysis',
    title: 'How Analysis Works',
    category: 'analysis',
    summary: 'Overview of the poem analysis system.',
    content: `Ghost Note analyzes your poem across several dimensions:

**Syllable Counting**
Each word is broken into syllables using the CMU Pronouncing Dictionary and phonetic rules.

**Stress Patterns**
Primary (1) and secondary (2) stress are identified for each syllable, helping create natural rhythm.

**Meter Detection**
The app identifies common meters like iambic (da-DUM), trochaic (DUM-da), and anapestic (da-da-DUM).

**Rhyme Analysis**
End rhymes are detected and classified as perfect, slant, or near rhymes, and the rhyme scheme is mapped (ABAB, AABB, etc.).

**Singability Scoring**
Each syllable receives a singability score based on vowel openness, consonant clusters, and sustainability.

**Emotional Analysis**
Sentiment and emotional keywords are analyzed to suggest appropriate musical modes and tempos.`,
    keywords: ['analysis', 'syllable', 'stress', 'meter', 'rhyme', 'sentiment'],
    related: ['stress-patterns', 'rhyme-schemes', 'singability-heatmap'],
  },
  {
    id: 'stress-patterns',
    title: 'Understanding Stress Patterns',
    category: 'analysis',
    summary: 'How syllable stress affects melody.',
    content: `**What is Stress?**
In English, some syllables are pronounced with more emphasis (stressed) while others are lighter (unstressed).

**Notation:**
- **1** = Primary stress (strongest emphasis)
- **2** = Secondary stress (moderate emphasis)
- **0** = Unstressed (lightest)

**Example:**
"beautiful" = BEA-u-ti-ful = 1-0-0-0
"photography" = pho-TOG-ra-phy = 0-1-0-0

**Why It Matters**
For a song to sound natural, stressed syllables should fall on strong beats (typically beats 1 and 3 in 4/4 time). Misaligned stress sounds awkward when sung.

**Visualization**
The stress visualization shows each syllable's stress level with color intensity, helping you spot potential rhythm issues.`,
    keywords: ['stress', 'syllable', 'emphasis', 'beat', 'rhythm'],
    related: ['understanding-analysis', 'meter-display'],
  },
  {
    id: 'rhyme-schemes',
    title: 'Rhyme Scheme Analysis',
    category: 'analysis',
    summary: 'How rhyme patterns are detected.',
    content: `**Rhyme Types:**
- **Perfect rhyme**: Identical sounds from the stressed vowel onward (love/dove)
- **Slant rhyme**: Similar but not identical sounds (love/move)
- **Assonance**: Matching vowel sounds (love/come)
- **Consonance**: Matching consonant sounds (love/live)

**Scheme Notation:**
Letters indicate which lines rhyme together:
- ABAB = Alternating rhyme
- AABB = Couplets
- ABBA = Enclosed rhyme

**Color Coding**
The rhyme display uses matching colors to show which lines rhyme together, making patterns easy to see at a glance.

**Internal Rhymes**
Ghost Note also detects rhymes within lines, not just at line endings.`,
    keywords: ['rhyme', 'scheme', 'pattern', 'perfect', 'slant', 'assonance'],
    related: ['understanding-analysis', 'singability-heatmap'],
  },
  {
    id: 'singability-heatmap',
    title: 'Reading the Singability Heatmap',
    category: 'analysis',
    summary: 'Understanding singability scores.',
    content: `**What is Singability?**
Singability measures how easy a syllable is to sustain when sung. Some sounds are naturally easier to hold on long notes.

**Scoring Factors:**
- **Vowel openness**: Open vowels (ah, oh) score higher than closed (ee, oo)
- **Consonant clusters**: Fewer consonants = easier to sing
- **Sustainability**: Can this sound be held? (Yes: "love", No: "glimpsed")

**Heatmap Colors:**
- **Green**: High singability (easy to sing)
- **Yellow**: Medium singability (some difficulty)
- **Red**: Low singability (challenging spots)

**Using the Heatmap**
Red areas indicate words you might want to change for better singability. The suggestions panel offers alternatives for problem spots.`,
    keywords: ['singability', 'heatmap', 'vowel', 'consonant', 'score'],
    related: ['understanding-analysis', 'applying-suggestions'],
  },
  {
    id: 'meter-display',
    title: 'Understanding Meter Display',
    category: 'analysis',
    summary: 'How poetic meter is shown.',
    content: `**Common Meters:**
- **Iambic**: Unstressed-Stressed (da-DUM) - most common in English
- **Trochaic**: Stressed-Unstressed (DUM-da)
- **Anapestic**: Unstressed-Unstressed-Stressed (da-da-DUM)
- **Dactylic**: Stressed-Unstressed-Unstressed (DUM-da-da)

**Feet Count:**
- Dimeter = 2 feet per line
- Trimeter = 3 feet
- Tetrameter = 4 feet
- Pentameter = 5 feet (iambic pentameter is very common)

**Meter Confidence**
The confidence score shows how well your poem matches the detected meter. Lower confidence may indicate intentional variation or free verse.

**Deviations**
Red markers show where the actual stress pattern deviates from the expected meter, which may be intentional for emphasis.`,
    keywords: ['meter', 'iambic', 'trochaic', 'feet', 'rhythm', 'pattern'],
    related: ['stress-patterns', 'understanding-analysis'],
  },

  // Working with Suggestions
  {
    id: 'using-suggestions',
    title: 'Using Lyric Suggestions',
    category: 'suggestions',
    summary: 'How the suggestion system works.',
    content: `**What Are Suggestions?**
Based on the analysis results, Ghost Note identifies potential issues and offers alternative words or phrases to improve singability.

**Suggestion Types:**
- **Singability**: Alternative words with easier-to-sing syllables
- **Meter**: Words that better match the detected rhythm
- **Rhyme**: Alternatives that create or improve rhyme patterns

**Viewing Suggestions**
Click on highlighted problem areas in the lyrics editor to see available suggestions. Each suggestion shows:
- The original word or phrase
- The suggested replacement
- Why this change is recommended

**Suggestion Priority**
Suggestions are sorted by severity (high, medium, low) so you can focus on the most impactful changes first.`,
    keywords: ['suggestions', 'alternatives', 'improvements', 'changes'],
    related: ['applying-suggestions', 'singability-heatmap'],
  },
  {
    id: 'applying-suggestions',
    title: 'Applying Suggestions',
    category: 'suggestions',
    summary: 'How to accept or modify suggestions.',
    content: `**Accepting a Suggestion**
Click the "Apply" button next to a suggestion to replace the original text. The change is immediately reflected in the lyrics.

**Preview Changes**
Hover over a suggestion to see how it would look in context before applying.

**Undo Changes**
Use Cmd/Ctrl+Z to undo any applied suggestion. All changes are tracked in the version history.

**Partial Acceptance**
You can also manually edit the lyrics to use part of a suggestion or create your own variation.

**Skipping Suggestions**
Not all suggestions will fit your vision. Feel free to dismiss any that don't work for your piece - they're recommendations, not requirements.`,
    keywords: ['apply', 'accept', 'undo', 'change', 'edit', 'dismiss'],
    related: ['using-suggestions', 'version-history'],
  },
  {
    id: 'version-history',
    title: 'Version History',
    category: 'suggestions',
    summary: 'Tracking changes to your lyrics.',
    content: `**Automatic Versioning**
Every time you apply a suggestion or manually edit your lyrics, a new version is saved automatically.

**Viewing History**
Access version history through the menu or by pressing the history icon. Each version shows:
- Timestamp of the change
- Description of what changed
- Diff view comparing to previous version

**Reverting Changes**
Click on any previous version to revert your lyrics to that state. This creates a new version, so you never lose work.

**Comparing Versions**
Use the diff view to see exactly what changed between versions, with additions highlighted in green and deletions in red.`,
    keywords: ['version', 'history', 'undo', 'revert', 'diff', 'changes'],
    related: ['applying-suggestions'],
  },

  // Melody Customization
  {
    id: 'melody-generation',
    title: 'Melody Generation',
    category: 'melody',
    summary: 'How melodies are created.',
    content: `**Stress-to-Beat Alignment**
The melody generator aligns stressed syllables with strong beats (beats 1 and 3 in 4/4 time) for natural-sounding lyrics.

**Emotional Matching**
Based on sentiment analysis, the generator chooses:
- **Mode**: Major for happier poems, minor for sadder ones
- **Tempo**: Faster for energetic, slower for reflective
- **Register**: High, middle, or low pitch range

**Phrase Shaping**
Each line follows a natural melodic arc, typically rising to a peak then falling to resolution.

**ABC Notation**
Melodies are stored in ABC notation, a text-based format that's easy to display and modify.`,
    keywords: ['melody', 'generate', 'create', 'music', 'notes', 'abc'],
    related: ['playback-controls', 'adjusting-tempo-key'],
  },
  {
    id: 'playback-controls',
    title: 'Playback Controls',
    category: 'melody',
    summary: 'Playing and navigating melodies.',
    content: `**Basic Controls:**
- **Play/Pause**: Space bar or play button
- **Stop**: Escape key or stop button
- **Seek**: Click anywhere on the progress bar

**Loop Mode**
Toggle loop to have the melody repeat continuously, useful for practicing or recording multiple takes.

**Volume**
Adjust the melody volume using the volume slider to balance with your voice when recording.

**Follow Along**
The notation display highlights the current position during playback, helping you follow along with the melody.`,
    keywords: ['play', 'pause', 'stop', 'seek', 'loop', 'volume', 'playback'],
    related: ['melody-generation', 'adjusting-tempo-key'],
  },
  {
    id: 'adjusting-tempo-key',
    title: 'Adjusting Tempo and Key',
    category: 'melody',
    summary: 'Customizing melody parameters.',
    content: `**Tempo (BPM)**
Adjust the tempo slider to speed up or slow down the melody. The range is typically 60-160 BPM.
- Slower tempos suit reflective, sad pieces
- Faster tempos work for energetic, happy pieces

**Key Signature**
Change the key to fit your vocal range:
- Higher keys (G, A) for higher voices
- Lower keys (F, E) for lower voices
- Try different keys to find what feels comfortable

**Time Signature**
While automatically detected, you can override the time signature:
- 4/4 for most standard meters
- 3/4 for waltz-like feel
- 6/8 for compound meters

**Regenerate**
After changing parameters, you may want to regenerate the melody to take full advantage of the new settings.`,
    keywords: ['tempo', 'bpm', 'key', 'signature', 'speed', 'pitch'],
    related: ['melody-generation', 'playback-controls'],
  },

  // Recording Tips
  {
    id: 'microphone-setup',
    title: 'Microphone Setup',
    category: 'recording',
    summary: 'Setting up your microphone for recording.',
    content: `**Browser Permissions**
When you first access the recording studio, your browser will ask for microphone permission. Click "Allow" to enable recording.

**Selecting a Microphone**
If you have multiple microphones, use the dropdown to select the one you want to use. External microphones often produce better quality than built-in laptop mics.

**Level Check**
Watch the input level meter while speaking or singing. The meter should move without hitting the red zone, which indicates clipping.

**Optimal Levels**
- Green zone: Good level
- Yellow zone: Strong but safe
- Red zone: Too loud, reduce input or move back from mic

**Environment Tips**
- Record in a quiet room
- Minimize background noise
- Consider using headphones to avoid feedback`,
    keywords: ['microphone', 'mic', 'setup', 'permission', 'level', 'input'],
    related: ['recording-best-practices', 'exporting-recordings'],
  },
  {
    id: 'recording-best-practices',
    title: 'Recording Best Practices',
    category: 'recording',
    summary: 'Tips for better recordings.',
    content: `**Before Recording:**
- Warm up your voice
- Practice with the melody a few times
- Set a comfortable tempo
- Adjust the key to your vocal range

**During Recording:**
- Stay at a consistent distance from the microphone
- Listen to the melody through headphones
- Don't worry about perfection - you can do multiple takes
- Breathe naturally at phrase endings

**Multiple Takes**
Record multiple attempts and pick the best one. Each take is saved separately so you can compare.

**Timing Tips**
- Start recording before the melody begins
- Wait for the melody to start, then sing along
- Keep a steady rhythm aligned with the melody`,
    keywords: ['recording', 'tips', 'practice', 'takes', 'quality'],
    related: ['microphone-setup', 'exporting-recordings'],
  },
  {
    id: 'exporting-recordings',
    title: 'Exporting Recordings',
    category: 'recording',
    summary: 'Saving and sharing your recordings.',
    content: `**Audio Formats**
Recordings are saved as WAV files for high quality. You can convert to other formats (MP3, etc.) using external tools if needed.

**Downloading**
Click the download button next to any take to save it to your computer.

**Take Management**
- Rename takes to keep track of different versions
- Delete takes you don't want to keep
- Compare multiple takes before deciding which to keep

**Sharing**
Once downloaded, you can share your recordings via email, messaging apps, or upload to audio platforms.`,
    keywords: ['export', 'download', 'save', 'share', 'audio', 'format'],
    related: ['recording-best-practices'],
  },

  // Keyboard Shortcuts
  {
    id: 'playback-shortcuts',
    title: 'Playback Shortcuts',
    category: 'shortcuts',
    summary: 'Keyboard shortcuts for melody playback.',
    content: `**Playback Control:**
- **Space** - Play/Pause melody
- **Escape** - Stop playback

These shortcuts work from anywhere in the app except when typing in text fields.

**Tip:** Use Space to quickly toggle between play and pause while practicing your timing.`,
    keywords: ['keyboard', 'shortcut', 'play', 'pause', 'stop', 'space'],
    related: ['editing-shortcuts', 'navigation-shortcuts'],
  },
  {
    id: 'editing-shortcuts',
    title: 'Editing Shortcuts',
    category: 'shortcuts',
    summary: 'Keyboard shortcuts for editing lyrics.',
    content: `**Editing:**
- **Cmd/Ctrl + Z** - Undo last change
- **Cmd/Ctrl + Shift + Z** - Redo
- **Cmd/Ctrl + S** - Save/Export

**Creation:**
- **Cmd/Ctrl + Enter** - Generate melody
- **R** - Start/Stop recording

These shortcuts help speed up your workflow without reaching for the mouse.`,
    keywords: ['keyboard', 'shortcut', 'undo', 'redo', 'save', 'edit'],
    related: ['playback-shortcuts', 'navigation-shortcuts'],
  },
  {
    id: 'navigation-shortcuts',
    title: 'Navigation Shortcuts',
    category: 'shortcuts',
    summary: 'Keyboard shortcuts for navigation.',
    content: `**Navigation:**
- **Tab** - Move to next section
- **Shift + Tab** - Move to previous section
- **?** - Show keyboard shortcuts dialog

**Section Order:**
1. Poem Input
2. Analysis
3. Lyrics Editor
4. Melody
5. Recording

Use Tab and Shift+Tab to quickly move between these sections.`,
    keywords: ['keyboard', 'shortcut', 'navigation', 'tab', 'section'],
    related: ['playback-shortcuts', 'editing-shortcuts'],
  },
];

/**
 * Frequently asked questions
 */
export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq-what-poems-work',
    question: 'What kinds of poems work best with Ghost Note?',
    answer: 'Ghost Note works best with poems that have a regular meter and clear line breaks. Poems with 4-50 lines in traditional forms (sonnets, ballads, etc.) produce excellent results. Free verse can also work, but the melody may be less structured.',
    category: 'getting-started',
  },
  {
    id: 'faq-no-analysis',
    question: 'Why isn\'t my poem being analyzed?',
    answer: 'Make sure you\'ve entered text in the poem input area and clicked "Analyze." The app needs at least a few words to perform analysis. Check that your browser isn\'t blocking JavaScript.',
    category: 'analysis',
  },
  {
    id: 'faq-red-singability',
    question: 'What should I do about red singability scores?',
    answer: 'Red scores indicate syllables that may be difficult to sing. Check the suggestions panel for alternative words. Common issues include consonant clusters (like "strength") and closed vowels on long notes.',
    category: 'analysis',
  },
  {
    id: 'faq-wrong-stress',
    question: 'The stress pattern looks wrong for a word. Can I fix it?',
    answer: 'The analysis uses the CMU Pronouncing Dictionary which covers most English words. Unusual words, names, or dialectal pronunciations may be incorrect. Currently, manual stress override isn\'t supported, but it\'s planned for a future release.',
    category: 'analysis',
  },
  {
    id: 'faq-ignore-suggestions',
    question: 'Do I have to accept all suggestions?',
    answer: 'Not at all! Suggestions are just that - suggestions. If a word is important to your poem\'s meaning or you prefer the original, keep it. The goal is to help, not to override your creative vision.',
    category: 'suggestions',
  },
  {
    id: 'faq-melody-sounds-wrong',
    question: 'The melody doesn\'t match my poem\'s mood.',
    answer: 'Try adjusting the key (major/minor) and tempo. Major keys sound happier while minor keys are more melancholic. You can also regenerate the melody after making these changes.',
    category: 'melody',
  },
  {
    id: 'faq-melody-too-high',
    question: 'The melody is too high/low for my voice.',
    answer: 'Use the key signature control to transpose the melody up or down. Keep trying different keys until you find one comfortable for your vocal range.',
    category: 'melody',
  },
  {
    id: 'faq-cant-hear-melody',
    question: 'I can\'t hear the melody playing.',
    answer: 'Check your browser\'s sound settings and system volume. Some browsers block autoplay audio - you may need to click the play button manually. Try refreshing the page if audio still doesn\'t work.',
    category: 'melody',
  },
  {
    id: 'faq-microphone-not-working',
    question: 'My microphone isn\'t being detected.',
    answer: 'Ensure you\'ve granted microphone permission in your browser. Check that your microphone is connected and selected as the input device in both the app and your system settings. Try refreshing the page.',
    category: 'recording',
  },
  {
    id: 'faq-recording-quality',
    question: 'How can I improve my recording quality?',
    answer: 'Use an external microphone if possible. Record in a quiet room without echo. Keep a consistent distance from the mic. Watch the level meter to avoid clipping (going into the red zone).',
    category: 'recording',
  },
  {
    id: 'faq-save-work',
    question: 'How do I save my work?',
    answer: 'Use Cmd/Ctrl+S or the Export button to save your project. You can export poems, lyrics, melodies (as ABC notation), and recordings. Projects are also auto-saved in your browser\'s local storage.',
    category: 'getting-started',
  },
  {
    id: 'faq-shortcuts-not-working',
    question: 'Keyboard shortcuts aren\'t working.',
    answer: 'Shortcuts are disabled when you\'re typing in a text field (except for Escape and Cmd+S). Click outside of any text input, then try the shortcut. Press "?" to see all available shortcuts.',
    category: 'shortcuts',
  },
];

/**
 * Get topics by category
 */
export function getTopicsByCategory(category: HelpCategory): HelpTopic[] {
  return HELP_TOPICS.filter((topic) => topic.category === category);
}

/**
 * Get a topic by ID
 */
export function getTopicById(id: string): HelpTopic | undefined {
  return HELP_TOPICS.find((topic) => topic.id === id);
}

/**
 * Get related topics for a given topic
 */
export function getRelatedTopics(topicId: string): HelpTopic[] {
  const topic = getTopicById(topicId);
  if (!topic || !topic.related) {
    return [];
  }
  return topic.related
    .map((id) => getTopicById(id))
    .filter((t): t is HelpTopic => t !== undefined);
}

/**
 * Search topics by query
 */
export function searchTopics(query: string): HelpTopic[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) {
    return [];
  }

  return HELP_TOPICS.filter((topic) => {
    const searchableText = [
      topic.title,
      topic.summary,
      topic.content,
      ...topic.keywords,
    ]
      .join(' ')
      .toLowerCase();

    return searchableText.includes(lowerQuery);
  }).sort((a, b) => {
    // Prioritize title matches
    const aTitle = a.title.toLowerCase().includes(lowerQuery);
    const bTitle = b.title.toLowerCase().includes(lowerQuery);
    if (aTitle && !bTitle) return -1;
    if (!aTitle && bTitle) return 1;

    // Then keyword matches
    const aKeyword = a.keywords.some((k) => k.includes(lowerQuery));
    const bKeyword = b.keywords.some((k) => k.includes(lowerQuery));
    if (aKeyword && !bKeyword) return -1;
    if (!aKeyword && bKeyword) return 1;

    return 0;
  });
}

/**
 * Get FAQ items by category
 */
export function getFAQByCategory(category: HelpCategory): FAQItem[] {
  return FAQ_ITEMS.filter((item) => item.category === category);
}

/**
 * Search FAQs by query
 */
export function searchFAQs(query: string): FAQItem[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) {
    return [];
  }

  return FAQ_ITEMS.filter((item) => {
    const searchableText = [item.question, item.answer].join(' ').toLowerCase();
    return searchableText.includes(lowerQuery);
  });
}

/**
 * Get category by ID
 */
export function getCategoryById(id: HelpCategory): CategoryInfo | undefined {
  return HELP_CATEGORIES.find((cat) => cat.id === id);
}
