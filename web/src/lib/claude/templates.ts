/**
 * Ghost Note - Claude Prompt Templates
 *
 * Prompt templates for Claude-powered analysis and suggestions.
 * These templates follow best practices for prompt engineering:
 * - Clear instructions and context
 * - Structured output format specifications
 * - Examples where helpful
 * - Explicit constraints
 *
 * @module lib/claude/templates
 */

import type { PromptTemplate, PromptTemplateType } from './types';

// =============================================================================
// Template Constants
// =============================================================================

/**
 * Word substitution suggestion prompt template
 *
 * This template guides Claude to suggest word replacements that improve
 * singability while preserving meaning.
 */
export const WORD_SUBSTITUTION_TEMPLATE: PromptTemplate = {
  type: 'word_substitution',
  template: `You are a lyric adaptation specialist helping transform poems into singable songs.

## Context
You are analyzing a poem that has been processed by our quantitative analysis system.
The analysis has identified specific "problem spots" - words or syllables that don't
work well for singing due to stress mismatches, syllable count issues, or phonetic concerns.

## Original Poem
\`\`\`
{{poem}}
\`\`\`

## Problem Spots Identified
{{problemSpots}}

## Quantitative Analysis Summary
- Detected Meter: {{meterType}}
- Rhyme Scheme: {{rhymeScheme}}
- Overall Singability: {{singabilityScore}}
- Dominant Emotions: {{dominantEmotions}}

## Your Task
For each problem spot, suggest word substitutions that:
1. Match the required stress pattern (stressed/unstressed syllables)
2. Maintain the syllable count OR provide a count that fits the meter
3. Preserve the original meaning as much as possible
4. Sound natural when sung (avoid consonant clusters on sustained notes)
5. Maintain rhyme where applicable
6. Keep the emotional tone consistent

## Output Format
Respond with a JSON array of suggestions. Each suggestion must have this structure:
\`\`\`json
{
  "originalWord": "the word being replaced",
  "suggestedWord": "the replacement word",
  "lineNumber": 1,
  "position": 0,
  "reason": "Brief explanation of why this substitution works",
  "preservesMeaning": "yes" | "partial" | "no"
}
\`\`\`

## Guidelines
- Only suggest changes for the identified problem spots
- Prefer "yes" meaning preservation; "partial" is acceptable for significant singability gains
- Avoid "no" meaning preservation unless absolutely necessary
- Consider the surrounding context when suggesting replacements
- If multiple options exist, choose the one that best balances singability and meaning
- Maximum {{maxSuggestions}} suggestions

## Response
Provide your suggestions as a JSON array:`,
  requiredVariables: [
    'poem',
    'problemSpots',
    'meterType',
    'rhymeScheme',
    'singabilityScore',
    'dominantEmotions',
  ],
  optionalVariables: {
    maxSuggestions: '10',
  },
  description:
    'Generates word substitution suggestions for problem spots in a poem to improve singability',
};

/**
 * Meaning preservation assessment prompt template
 *
 * This template guides Claude to assess whether proposed changes preserve
 * the essential meaning and feel of the original poem.
 */
export const MEANING_PRESERVATION_TEMPLATE: PromptTemplate = {
  type: 'meaning_preservation',
  template: `You are a literary analyst specializing in poetry and lyric adaptation.

## Task
Analyze the original poem to identify what must be preserved when adapting it for singing.

## Original Poem
\`\`\`
{{poem}}
\`\`\`

## Analysis Context
- Title (if known): {{title}}
- Detected Emotions: {{dominantEmotions}}
- Meter: {{meterType}}
- Rhyme Scheme: {{rhymeScheme}}

## Your Analysis Should Include

### Core Theme
What is the central message or meaning of this poem? What is it fundamentally about?

### Essential Elements
List the key elements that MUST be preserved for the poem to retain its identity:
- Key metaphors or images
- Crucial word choices that carry special weight
- Structural elements that contribute to meaning
- Sound patterns that reinforce theme (alliteration, assonance)

### Flexible Elements
List elements that can be modified without losing the poem's essence:
- Generic filler words
- Words that can be synonymized without impact
- Structural elements that are decorative rather than meaningful

### Author's Voice
Describe the distinctive voice of this poem:
- Tone (formal, casual, intimate, distant)
- Perspective (first person, third person, observational)
- Vocabulary level (simple, elevated, technical)
- Emotional register (restrained, passionate, contemplative)

## Output Format
Respond with JSON in this structure:
\`\`\`json
{
  "coreTheme": "A 1-2 sentence description of the poem's central meaning",
  "essentialElements": ["element 1", "element 2", ...],
  "flexibleElements": ["element 1", "element 2", ...],
  "authorVoice": "A description of the poem's distinctive voice"
}
\`\`\`

## Response
Provide your analysis as JSON:`,
  requiredVariables: ['poem', 'dominantEmotions', 'meterType', 'rhymeScheme'],
  optionalVariables: {
    title: 'Untitled',
  },
  description:
    'Analyzes a poem to determine what elements must be preserved during lyric adaptation',
};

/**
 * Emotional interpretation prompt template
 *
 * This template guides Claude to provide a deep emotional reading of the poem
 * that complements our quantitative sentiment analysis.
 */
export const EMOTIONAL_INTERPRETATION_TEMPLATE: PromptTemplate = {
  type: 'emotional_interpretation',
  template: `You are a poetry analyst specializing in emotional interpretation.

## Task
Provide a nuanced emotional analysis of this poem that goes beyond simple sentiment scoring.
Our quantitative system has already measured sentiment and arousal levels. Your role is to
provide the qualitative insight that software cannot - the "why" and "how" of emotional effect.

## Poem
\`\`\`
{{poem}}
\`\`\`

## Quantitative Emotional Data (from our analysis system)
- Overall Sentiment: {{sentiment}} (scale: -1 to 1)
- Arousal Level: {{arousal}} (scale: 0 to 1)
- Detected Emotion Keywords: {{emotionKeywords}}
- Emotional Arc: {{emotionalArc}}

## Your Analysis Should Include

### Primary Emotional Theme
What is the dominant emotional experience of this poem? Not just "happy" or "sad",
but something more specific like "bittersweet nostalgia" or "quiet determination."

### Secondary Themes
What other emotions are present that color or complicate the primary theme?

### Emotional Journey
How do emotions develop through the poem? Is there:
- A transformation (from one state to another)?
- A revelation (building to an emotional climax)?
- A cycle (returning to where it started)?
- A constant (sustained emotion throughout)?

### Key Imagery
What images or metaphors carry the most emotional weight? How do they work?

### Mood
What overall atmosphere does the poem create? How would you describe the
emotional "space" the reader/listener inhabits?

## Musical Implications
Based on your emotional analysis, suggest:
- Tempo feel (not exact BPM, but "flowing," "driving," "hesitant," etc.)
- Dynamic approach (where should the song swell or quiet?)
- Melodic character (angular, smooth, repetitive, through-composed?)

## Output Format
Respond with JSON:
\`\`\`json
{
  "primaryTheme": "Description of the dominant emotional experience",
  "secondaryThemes": ["theme 1", "theme 2"],
  "emotionalJourney": "Description of how emotion develops",
  "keyImagery": ["image 1", "image 2", "image 3"],
  "mood": "Overall atmosphere description",
  "musicalImplications": {
    "tempoFeel": "description",
    "dynamicApproach": "description",
    "melodicCharacter": "description"
  }
}
\`\`\`

## Response
Provide your emotional interpretation as JSON:`,
  requiredVariables: ['poem', 'sentiment', 'arousal', 'emotionKeywords', 'emotionalArc'],
  optionalVariables: {},
  description:
    'Provides qualitative emotional interpretation that complements quantitative sentiment analysis',
};

/**
 * Melody quality feedback prompt template
 *
 * This template guides Claude to assess how well a generated melody
 * serves the lyrics and emotional content.
 */
export const MELODY_FEEDBACK_TEMPLATE: PromptTemplate = {
  type: 'melody_feedback',
  template: `You are a vocal melody analyst with expertise in art song and popular music.

## Task
Evaluate how well the generated melody serves the lyrics and emotional content.
Our system generates melodies algorithmically based on quantitative analysis.
Your role is to provide qualitative feedback that helps improve the result.

## Lyrics
\`\`\`
{{lyrics}}
\`\`\`

## Generated Melody (ABC Notation)
\`\`\`
{{abcNotation}}
\`\`\`

## Analysis Context
- Key: {{key}}
- Time Signature: {{timeSignature}}
- Tempo: {{tempo}} BPM
- Detected Emotions: {{dominantEmotions}}
- Emotional Sentiment: {{sentiment}}

## Stress Alignment Data
{{stressAlignment}}

## Evaluation Criteria

### 1. Emotional Fit
Does the melody's contour, register, and phrasing match the emotional content?
- Consider: Major/minor mode, melodic range, tension/release patterns
- Rate: excellent / good / adequate / poor

### 2. Text Setting
How well does the melody serve the words?
- Stressed syllables on strong beats?
- Important words given melodic emphasis?
- Phrase endings aligned with textual meaning?

### 3. Singability
Is this melody comfortable and natural to sing?
- Reasonable intervals (not too many awkward leaps)?
- Breathing points in sensible places?
- Range appropriate for typical voice?

### 4. Memorability
Does the melody have distinctive qualities that make it memorable?
- Motivic development?
- Balance of repetition and variety?
- Clear climactic moment?

## Output Format
Respond with JSON:
\`\`\`json
{
  "emotionalFit": "excellent" | "good" | "adequate" | "poor",
  "observations": [
    "Observation about what works or doesn't work",
    "Another specific observation"
  ],
  "improvements": [
    "Specific suggestion for improvement",
    "Another suggestion"
  ],
  "highlights": [
    "Something particularly effective about the melody",
    "Another positive element"
  ],
  "overallAssessment": "Brief summary of the melody's quality"
}
\`\`\`

## Response
Provide your melody feedback as JSON:`,
  requiredVariables: [
    'lyrics',
    'abcNotation',
    'key',
    'timeSignature',
    'tempo',
    'dominantEmotions',
    'sentiment',
    'stressAlignment',
  ],
  optionalVariables: {},
  description: 'Evaluates how well a generated melody serves the lyrics and emotional content',
};

// =============================================================================
// Template Registry
// =============================================================================

/**
 * Registry of all available prompt templates
 */
export const PROMPT_TEMPLATES: Record<PromptTemplateType, PromptTemplate> = {
  word_substitution: WORD_SUBSTITUTION_TEMPLATE,
  meaning_preservation: MEANING_PRESERVATION_TEMPLATE,
  emotional_interpretation: EMOTIONAL_INTERPRETATION_TEMPLATE,
  melody_feedback: MELODY_FEEDBACK_TEMPLATE,
};

// =============================================================================
// Template Functions
// =============================================================================

/**
 * Gets a prompt template by type
 *
 * @param type - The type of template to retrieve
 * @returns The prompt template
 * @throws Error if template type is not found
 */
export function getTemplate(type: PromptTemplateType): PromptTemplate {
  const template = PROMPT_TEMPLATES[type];
  if (!template) {
    throw new Error(`Unknown template type: ${type}`);
  }
  return template;
}

/**
 * Lists all available template types
 *
 * @returns Array of template type identifiers
 */
export function listTemplateTypes(): PromptTemplateType[] {
  return Object.keys(PROMPT_TEMPLATES) as PromptTemplateType[];
}

/**
 * Validates that all required variables are present
 *
 * @param template - The template to validate against
 * @param variables - The variables provided
 * @returns Object with isValid boolean and missing variables if any
 */
export function validateTemplateVariables(
  template: PromptTemplate,
  variables: Record<string, string>
): { isValid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const required of template.requiredVariables) {
    if (!(required in variables) || variables[required] === undefined) {
      missing.push(required);
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
  };
}

/**
 * Fills a template with provided variables
 *
 * @param template - The template to fill
 * @param variables - The variables to substitute
 * @returns The filled template string
 * @throws Error if required variables are missing
 */
export function fillTemplate(
  template: PromptTemplate,
  variables: Record<string, string>
): string {
  // Validate required variables
  const validation = validateTemplateVariables(template, variables);
  if (!validation.isValid) {
    throw new Error(
      `Missing required template variables: ${validation.missing.join(', ')}`
    );
  }

  // Merge with optional defaults
  const allVariables = { ...template.optionalVariables, ...variables };

  // Perform substitutions
  let result = template.template;
  for (const [key, value] of Object.entries(allVariables)) {
    const placeholder = `{{${key}}}`;
    result = result.split(placeholder).join(value);
  }

  console.log(
    `[claude/templates] fillTemplate: filled ${template.type} template ` +
      `(${Object.keys(variables).length} variables provided)`
  );

  return result;
}

/**
 * Escapes special characters in a string for safe template inclusion
 *
 * @param text - The text to escape
 * @returns Escaped text safe for template inclusion
 */
export function escapeForTemplate(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');
}

/**
 * Formats problem spots for template inclusion
 *
 * @param problemSpots - Array of problem spots
 * @returns Formatted string for template
 */
export function formatProblemSpots(
  problemSpots: Array<{
    line: number;
    position: number;
    type: string;
    severity: string;
    description: string;
  }>
): string {
  if (problemSpots.length === 0) {
    return 'No specific problem spots identified.';
  }

  return problemSpots
    .map(
      (spot, index) =>
        `${index + 1}. Line ${spot.line}, Position ${spot.position}:\n` +
        `   Type: ${spot.type}\n` +
        `   Severity: ${spot.severity}\n` +
        `   Issue: ${spot.description}`
    )
    .join('\n\n');
}

/**
 * Formats emotional arc data for template inclusion
 *
 * @param emotionalArc - Array of emotional arc entries
 * @returns Formatted string for template
 */
export function formatEmotionalArc(
  emotionalArc: Array<{
    stanza: number;
    sentiment: number;
    keywords: string[];
  }>
): string {
  if (emotionalArc.length === 0) {
    return 'No emotional arc data available.';
  }

  return emotionalArc
    .map((entry) => {
      const sentimentLabel =
        entry.sentiment > 0.3
          ? 'positive'
          : entry.sentiment < -0.3
            ? 'negative'
            : 'neutral';
      return (
        `Stanza ${entry.stanza + 1}: ${sentimentLabel} (${entry.sentiment.toFixed(2)})` +
        (entry.keywords.length > 0 ? ` - Keywords: ${entry.keywords.join(', ')}` : '')
      );
    })
    .join('\n');
}

/**
 * Formats stress alignment data for template inclusion
 *
 * @param lines - Array of lines with their stress patterns
 * @param alignment - Array of alignment issues
 * @returns Formatted string for template
 */
export function formatStressAlignment(
  lines: Array<{ text: string; stressPattern: string }>,
  alignment: Array<{ line: number; issues: string[] }>
): string {
  const formattedLines = lines
    .map(
      (line, index) =>
        `Line ${index + 1}: "${line.text}"\n  Pattern: ${line.stressPattern || 'N/A'}`
    )
    .join('\n');

  if (alignment.length === 0) {
    return formattedLines + '\n\nNo alignment issues detected.';
  }

  const issues = alignment
    .map(
      (a) => `Line ${a.line}: ${a.issues.join('; ')}`
    )
    .join('\n');

  return formattedLines + '\n\nAlignment Issues:\n' + issues;
}
