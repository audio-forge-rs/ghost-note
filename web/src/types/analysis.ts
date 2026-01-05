/**
 * Ghost Note - Poem Analysis Types
 *
 * This module defines the complete output schema for poem analysis.
 * Based on the analysis pipeline defined in docs/ANALYSIS_PIPELINE.md.
 *
 * @module types/analysis
 */

// =============================================================================
// Core Types
// =============================================================================

/**
 * Stress level for a syllable
 * 0 = unstressed, 1 = primary stress, 2 = secondary stress
 */
export type StressLevel = 0 | 1 | 2;

/**
 * Rhyme type classification
 */
export type RhymeType = 'perfect' | 'slant' | 'assonance' | 'consonance';

/**
 * Problem severity level
 */
export type Severity = 'low' | 'medium' | 'high';

/**
 * Musical mode
 */
export type MusicalMode = 'major' | 'minor';

/**
 * Vocal register
 */
export type VocalRegister = 'low' | 'middle' | 'high' | 'varied';

/**
 * Time signature options
 */
export type TimeSignature = '4/4' | '3/4' | '6/8' | '2/4';

/**
 * Problem type classification
 */
export type ProblemType =
  | 'stress_mismatch'
  | 'syllable_variance'
  | 'singability'
  | 'rhyme_break';

// =============================================================================
// Stage 1: Text Preprocessing
// =============================================================================

/**
 * Output from the text preprocessing stage
 */
export interface PreprocessedPoem {
  /** Original unmodified text */
  original: string;
  /** Stanzas[stanza_idx][line_idx] */
  stanzas: string[][];
  /** Total number of lines in the poem */
  lineCount: number;
  /** Total number of stanzas */
  stanzaCount: number;
}

// =============================================================================
// Stage 2: Word Tokenization
// =============================================================================

/**
 * Punctuation marker with position
 */
export interface PunctuationMark {
  /** Position in the line (character index) */
  position: number;
  /** The punctuation character */
  char: string;
}

/**
 * Output from word tokenization
 */
export interface TokenizedLine {
  /** Array of words in the line */
  words: string[];
  /** Punctuation marks with their positions */
  punctuation: PunctuationMark[];
}

// =============================================================================
// Stage 3: Phonetic Transcription
// =============================================================================

/**
 * A word with its phonetic transcription
 */
export interface PhoneticWord {
  /** The original word text */
  text: string;
  /** ARPAbet phonemes (e.g., ["HH", "AH0", "L", "OW1"]) */
  phonemes: string[];
  /** Number of syllables in the word */
  syllableCount: number;
  /** Stress pattern as string of digits (e.g., "01" for unstressed, primary) */
  stressPattern: string;
  /** Whether the word was found in CMU dictionary */
  inDictionary: boolean;
}

// =============================================================================
// Stage 4: Syllabification
// =============================================================================

/**
 * A single syllable with its phonetic properties
 */
export interface Syllable {
  /** Phonemes that make up this syllable */
  phonemes: string[];
  /** Stress level: 0=unstressed, 1=primary, 2=secondary */
  stress: StressLevel;
  /** The nucleus vowel phoneme */
  vowelPhoneme: string;
  /** Whether syllable ends in vowel (easier to sustain in singing) */
  isOpen: boolean;
}

/**
 * A word broken down into syllables
 */
export interface SyllabifiedWord {
  /** The original word text */
  text: string;
  /** Array of syllables */
  syllables: Syllable[];
}

// =============================================================================
// Stage 5: Stress Pattern / Meter Analysis
// =============================================================================

/**
 * Detected meter type names
 */
export type MeterType =
  | 'iambic'
  | 'trochaic'
  | 'anapestic'
  | 'dactylic'
  | 'spondaic'
  | 'irregular';

/**
 * Foot type in prosody
 */
export type FootType =
  | 'iamb'
  | 'trochee'
  | 'anapest'
  | 'dactyl'
  | 'spondee'
  | 'unknown';

/**
 * Complete meter analysis for the poem
 */
export interface MeterAnalysis {
  /** Stress pattern as string of 0s and 1s (e.g., "01010101") */
  pattern: string;
  /** Detected meter name (e.g., "iambic_tetrameter") */
  detectedMeter: string;
  /** Type of metrical foot (e.g., "iamb") */
  footType: FootType;
  /** Number of feet per line */
  feetPerLine: number;
  /** Confidence score 0.0-1.0 */
  confidence: number;
  /** Positions where the pattern deviates from ideal */
  deviations: number[];
}

// =============================================================================
// Stage 6: Rhyme Detection
// =============================================================================

/**
 * A group of lines that rhyme together
 */
export interface RhymeGroup {
  /** Line numbers that share this rhyme */
  lines: number[];
  /** Type of rhyme connection */
  rhymeType: RhymeType;
  /** The words at the end of each line in this group */
  endWords: string[];
}

/**
 * Internal rhyme occurrence within a line
 */
export interface InternalRhyme {
  /** Line number where internal rhyme occurs */
  line: number;
  /** Positions of the two rhyming words */
  positions: [number, number];
}

/**
 * Complete rhyme analysis for the poem
 */
export interface RhymeAnalysis {
  /** Rhyme scheme notation (e.g., "ABAB") */
  scheme: string;
  /** Groups of rhyming lines, keyed by scheme letter */
  rhymeGroups: Record<string, RhymeGroup>;
  /** Internal rhymes found within lines */
  internalRhymes: InternalRhyme[];
}

// =============================================================================
// Stage 7: Singability Analysis
// =============================================================================

/**
 * Factors that affect how singable a syllable/word is
 */
export interface SingabilityFactors {
  /** 0-1: open vowels score higher */
  vowelOpenness: number;
  /** 0-1: fewer consonant clusters = higher score */
  consonantClusters: number;
  /** 0-1: can this be held on a long note? */
  sustainability: number;
  /** 0-1: natural to breathe after? */
  breathability: number;
}

/**
 * A problem spot that affects singability
 */
export interface SingabilityProblem {
  /** Position in the line (syllable index) */
  position: number;
  /** Description of the issue */
  issue: string;
  /** How severe the problem is */
  severity: Severity;
}

/**
 * Complete singability score for a line
 */
export interface SingabilityScore {
  /** Per-syllable scores (0-1) */
  syllableScores: number[];
  /** Average score for the entire line (0-1) */
  lineScore: number;
  /** Problem spots that may need attention */
  problemSpots: SingabilityProblem[];
}

// =============================================================================
// Sound Pattern Analysis
// =============================================================================

/**
 * Types of sound patterns detected
 */
export type SoundPatternType = 'alliteration' | 'assonance' | 'consonance';

/**
 * A single occurrence of a sound pattern
 */
export interface SoundPatternOccurrence {
  /** Type of sound pattern */
  type: SoundPatternType;
  /** The sound (phoneme) that creates the pattern */
  sound: string;
  /** Words involved in this pattern */
  words: string[];
  /** Character positions of words in the line (start indices) */
  positions: number[];
  /** Line number (0-indexed) */
  lineNumber: number;
  /** Strength score (0-1) based on number of occurrences and proximity */
  strength: number;
}

/**
 * Sound patterns found in a single line
 */
export interface LineSoundPatterns {
  /** Line number (0-indexed) */
  lineNumber: number;
  /** Original line text */
  text: string;
  /** Alliteration patterns in this line */
  alliterations: SoundPatternOccurrence[];
  /** Assonance patterns in this line */
  assonances: SoundPatternOccurrence[];
  /** Consonance patterns in this line */
  consonances: SoundPatternOccurrence[];
}

/**
 * Summary of sound pattern analysis
 */
export interface SoundPatternSummary {
  /** Total alliteration occurrences */
  alliterationCount: number;
  /** Total assonance occurrences */
  assonanceCount: number;
  /** Total consonance occurrences */
  consonanceCount: number;
  /** Overall sound pattern density (0-1) */
  density: number;
  /** Most common alliterative sounds */
  topAlliterativeSounds: string[];
  /** Most common vowel sounds in assonance */
  topAssonanceSounds: string[];
}

/**
 * Complete sound pattern analysis for a poem
 */
export interface SoundPatternAnalysis {
  /** Sound patterns per line */
  lines: LineSoundPatterns[];
  /** Summary statistics */
  summary: SoundPatternSummary;
}

// =============================================================================
// Stage 8: Emotional Analysis
// =============================================================================

/**
 * Suggested musical parameters based on emotion
 */
export interface SuggestedMusicParams {
  /** Major or minor mode */
  mode: MusicalMode;
  /** Suggested tempo range in BPM */
  tempoRange: [number, number];
  /** Suggested vocal register */
  register: VocalRegister;
}

/**
 * Emotional arc entry for a single stanza
 */
export interface EmotionalArcEntry {
  /** Stanza number (0-indexed) */
  stanza: number;
  /** Sentiment score for this stanza (-1 to 1) */
  sentiment: number;
  /** Emotional keywords found in this stanza */
  keywords: string[];
}

/**
 * Complete emotional analysis of the poem
 */
export interface EmotionalAnalysis {
  /** Overall sentiment score (-1 to 1) */
  overallSentiment: number;
  /** Arousal/intensity level (0 to 1) */
  arousal: number;
  /** List of dominant emotions detected */
  dominantEmotions: string[];
  /** Per-stanza emotional progression */
  emotionalArc: EmotionalArcEntry[];
  /** Suggested musical parameters based on emotion */
  suggestedMusicParams: SuggestedMusicParams;
}

// =============================================================================
// Structured Output Types
// =============================================================================

/**
 * A single analyzed line within a stanza
 */
export interface AnalyzedLine {
  /** Original text of the line */
  text: string;
  /** Words broken down into syllables */
  words: SyllabifiedWord[];
  /** Stress pattern for the line */
  stressPattern: string;
  /** Total syllable count for the line */
  syllableCount: number;
  /** Singability analysis for the line */
  singability: SingabilityScore;
}

/**
 * A stanza containing analyzed lines
 */
export interface AnalyzedStanza {
  /** Lines in this stanza */
  lines: AnalyzedLine[];
}

/**
 * Complete structured representation of the poem
 */
export interface StructuredPoem {
  /** Array of analyzed stanzas */
  stanzas: AnalyzedStanza[];
}

// =============================================================================
// Metadata
// =============================================================================

/**
 * Metadata about the poem
 */
export interface MetaInfo {
  /** Optional title of the poem */
  title?: string;
  /** Total number of lines */
  lineCount: number;
  /** Total number of stanzas */
  stanzaCount: number;
  /** Total number of words */
  wordCount: number;
  /** Total number of syllables */
  syllableCount: number;
}

// =============================================================================
// Prosody Analysis
// =============================================================================

/**
 * Combined prosodic analysis (meter + rhyme)
 */
export interface ProsodyAnalysis {
  /** Meter analysis */
  meter: MeterAnalysis;
  /** Rhyme analysis */
  rhyme: RhymeAnalysis;
  /** Regularity score (0-1): how regular is the meter? */
  regularity: number;
}

// =============================================================================
// Problem Reports
// =============================================================================

/**
 * A problem found during analysis
 */
export interface ProblemReport {
  /** Line number where the problem occurs */
  line: number;
  /** Position within the line (character or word index) */
  position: number;
  /** Type of problem */
  type: ProblemType;
  /** Severity of the problem */
  severity: Severity;
  /** Human-readable description of the problem */
  description: string;
  /** Optional suggested fix */
  suggestedFix?: string;
}

// =============================================================================
// Form Detection
// =============================================================================

/**
 * Known poem form types
 */
export type PoemFormType =
  | 'shakespearean_sonnet'
  | 'petrarchan_sonnet'
  | 'spenserian_sonnet'
  | 'sonnet'
  | 'haiku'
  | 'tanka'
  | 'limerick'
  | 'ballad'
  | 'common_meter'
  | 'villanelle'
  | 'sestina'
  | 'ode'
  | 'heroic_couplet'
  | 'couplet'
  | 'terza_rima'
  | 'tercet'
  | 'quatrain'
  | 'cinquain'
  | 'blank_verse'
  | 'free_verse'
  | 'unknown';

/**
 * Categories of poem forms
 */
export type FormCategory =
  | 'fixed_form'
  | 'syllabic'
  | 'stanzaic'
  | 'metrical'
  | 'free'
  | 'unknown';

/**
 * Evidence supporting a form classification
 */
export interface FormEvidence {
  /** Whether line count matches expected */
  lineCountMatch: boolean;
  /** Whether stanza structure matches expected */
  stanzaStructureMatch: boolean;
  /** Whether meter matches expected */
  meterMatch: boolean;
  /** Whether rhyme scheme matches expected */
  rhymeSchemeMatch: boolean;
  /** Whether syllable pattern matches expected */
  syllablePatternMatch: boolean;
  /** Specific notes about the match */
  notes: string[];
}

/**
 * An alternative form classification
 */
export interface AlternativeForm {
  /** The alternative form type */
  formType: PoemFormType;
  /** Human-readable name */
  formName: string;
  /** Confidence score for this alternative */
  confidence: number;
}

/**
 * Result of poem form detection
 */
export interface FormDetectionResult {
  /** The detected form type */
  formType: PoemFormType;
  /** Human-readable name of the form */
  formName: string;
  /** Category of the poem form */
  category: FormCategory;
  /** Confidence score (0.0 to 1.0) */
  confidence: number;
  /** Detailed evidence that supports this classification */
  evidence: FormEvidence;
  /** Alternative forms that could match */
  alternatives: AlternativeForm[];
  /** Description of the poem form */
  description: string;
}

// =============================================================================
// Melody Suggestions
// =============================================================================

/**
 * Suggestions for melody generation
 */
export interface MelodySuggestions {
  /** Suggested time signature */
  timeSignature: TimeSignature;
  /** Suggested tempo in BPM */
  tempo: number;
  /** Suggested musical key (e.g., "C", "G", "Am") */
  key: string;
  /** Major or minor mode */
  mode: MusicalMode;
  /** Line numbers where musical phrases should end */
  phraseBreaks: number[];
}

// =============================================================================
// Complete Analysis Output
// =============================================================================

/**
 * Complete poem analysis output
 * This is the root type that contains all analysis results.
 */
export interface PoemAnalysis {
  /** Metadata about the poem */
  meta: MetaInfo;
  /** Structured representation of the poem with all analyses */
  structure: StructuredPoem;
  /** Prosodic analysis (meter and rhyme) */
  prosody: ProsodyAnalysis;
  /** Sound patterns analysis (alliteration, assonance, consonance) */
  soundPatterns?: SoundPatternAnalysis;
  /** Emotional analysis */
  emotion: EmotionalAnalysis;
  /** Detected poem form */
  form: FormDetectionResult;
  /** List of problems found during analysis */
  problems: ProblemReport[];
  /** Suggestions for melody generation */
  melodySuggestions: MelodySuggestions;
  /** Structure analysis (verse/chorus detection) - optional for backwards compatibility */
  songStructure?: StructureAnalysis;
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Creates an empty/default Syllable
 */
export function createDefaultSyllable(): Syllable {
  return {
    phonemes: [],
    stress: 0,
    vowelPhoneme: '',
    isOpen: false,
  };
}

/**
 * Creates an empty/default SyllabifiedWord
 */
export function createDefaultSyllabifiedWord(text: string = ''): SyllabifiedWord {
  return {
    text,
    syllables: [],
  };
}

/**
 * Creates an empty/default SingabilityScore
 */
export function createDefaultSingabilityScore(): SingabilityScore {
  return {
    syllableScores: [],
    lineScore: 0,
    problemSpots: [],
  };
}

/**
 * Creates an empty/default AnalyzedLine
 */
export function createDefaultAnalyzedLine(text: string = ''): AnalyzedLine {
  return {
    text,
    words: [],
    stressPattern: '',
    syllableCount: 0,
    singability: createDefaultSingabilityScore(),
  };
}

/**
 * Creates an empty/default AnalyzedStanza
 */
export function createDefaultAnalyzedStanza(): AnalyzedStanza {
  return {
    lines: [],
  };
}

/**
 * Creates an empty/default MeterAnalysis
 */
export function createDefaultMeterAnalysis(): MeterAnalysis {
  return {
    pattern: '',
    detectedMeter: 'irregular',
    footType: 'unknown',
    feetPerLine: 0,
    confidence: 0,
    deviations: [],
  };
}

/**
 * Creates an empty/default RhymeAnalysis
 */
export function createDefaultRhymeAnalysis(): RhymeAnalysis {
  return {
    scheme: '',
    rhymeGroups: {},
    internalRhymes: [],
  };
}

/**
 * Creates an empty/default ProsodyAnalysis
 */
export function createDefaultProsodyAnalysis(): ProsodyAnalysis {
  return {
    meter: createDefaultMeterAnalysis(),
    rhyme: createDefaultRhymeAnalysis(),
    regularity: 0,
  };
}

/**
 * Creates an empty/default SuggestedMusicParams
 */
export function createDefaultSuggestedMusicParams(): SuggestedMusicParams {
  return {
    mode: 'major',
    tempoRange: [80, 120],
    register: 'middle',
  };
}

/**
 * Creates an empty/default EmotionalAnalysis
 */
export function createDefaultEmotionalAnalysis(): EmotionalAnalysis {
  return {
    overallSentiment: 0,
    arousal: 0.5,
    dominantEmotions: [],
    emotionalArc: [],
    suggestedMusicParams: createDefaultSuggestedMusicParams(),
  };
}

/**
 * Creates an empty/default MetaInfo
 */
export function createDefaultMetaInfo(): MetaInfo {
  return {
    title: undefined,
    lineCount: 0,
    stanzaCount: 0,
    wordCount: 0,
    syllableCount: 0,
  };
}

/**
 * Creates an empty/default StructuredPoem
 */
export function createDefaultStructuredPoem(): StructuredPoem {
  return {
    stanzas: [],
  };
}

/**
 * Creates an empty/default MelodySuggestions
 */
export function createDefaultMelodySuggestions(): MelodySuggestions {
  return {
    timeSignature: '4/4',
    tempo: 100,
    key: 'C',
    mode: 'major',
    phraseBreaks: [],
  };
}

/**
 * Creates an empty/default SoundPatternAnalysis
 */
export function createDefaultSoundPatternAnalysis(): SoundPatternAnalysis {
  return {
    lines: [],
    summary: {
      alliterationCount: 0,
      assonanceCount: 0,
      consonanceCount: 0,
      density: 0,
      topAlliterativeSounds: [],
      topAssonanceSounds: [],
    },
  };
}

/**
 * Creates an empty/default FormEvidence
 */
export function createDefaultFormEvidence(): FormEvidence {
  return {
    lineCountMatch: false,
    stanzaStructureMatch: false,
    meterMatch: false,
    rhymeSchemeMatch: false,
    syllablePatternMatch: false,
    notes: [],
  };
}

/**
 * Creates an empty/default FormDetectionResult
 */
export function createDefaultFormDetectionResult(): FormDetectionResult {
  return {
    formType: 'unknown',
    formName: 'Unknown',
    category: 'unknown',
    confidence: 0,
    evidence: createDefaultFormEvidence(),
    alternatives: [],
    description: '',
  };
}

/**
 * Creates an empty/default PoemAnalysis
 */
export function createDefaultPoemAnalysis(): PoemAnalysis {
  return {
    meta: createDefaultMetaInfo(),
    structure: createDefaultStructuredPoem(),
    prosody: createDefaultProsodyAnalysis(),
    emotion: createDefaultEmotionalAnalysis(),
    form: createDefaultFormDetectionResult(),
    problems: [],
    melodySuggestions: createDefaultMelodySuggestions(),
  };
}

// =============================================================================
// JSON Serialization Helpers
// =============================================================================

/**
 * Serializes a PoemAnalysis object to a JSON string
 * @param analysis The analysis object to serialize
 * @param pretty Whether to format with indentation (default: false)
 * @returns JSON string representation
 */
export function serializePoemAnalysis(
  analysis: PoemAnalysis,
  pretty: boolean = false
): string {
  return JSON.stringify(analysis, null, pretty ? 2 : undefined);
}

/**
 * Deserializes a JSON string to a PoemAnalysis object
 * @param json The JSON string to parse
 * @returns Parsed PoemAnalysis object
 * @throws Error if JSON is invalid or doesn't match expected structure
 */
export function deserializePoemAnalysis(json: string): PoemAnalysis {
  const parsed = JSON.parse(json);

  // Validate required top-level properties
  const requiredProps: (keyof PoemAnalysis)[] = [
    'meta',
    'structure',
    'prosody',
    'emotion',
    'form',
    'problems',
    'melodySuggestions',
  ];

  for (const prop of requiredProps) {
    if (!(prop in parsed)) {
      throw new Error(`Invalid PoemAnalysis: missing required property '${prop}'`);
    }
  }

  return parsed as PoemAnalysis;
}

/**
 * Type guard to check if an object is a valid PoemAnalysis
 * @param obj The object to check
 * @returns True if the object matches PoemAnalysis structure
 */
export function isPoemAnalysis(obj: unknown): obj is PoemAnalysis {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const analysis = obj as Record<string, unknown>;

  return (
    typeof analysis.meta === 'object' &&
    analysis.meta !== null &&
    typeof analysis.structure === 'object' &&
    analysis.structure !== null &&
    typeof analysis.prosody === 'object' &&
    analysis.prosody !== null &&
    typeof analysis.emotion === 'object' &&
    analysis.emotion !== null &&
    typeof analysis.form === 'object' &&
    analysis.form !== null &&
    Array.isArray(analysis.problems) &&
    typeof analysis.melodySuggestions === 'object' &&
    analysis.melodySuggestions !== null
  );
}

/**
 * Deep clones a PoemAnalysis object
 * Useful for creating a copy before modifications
 * @param analysis The analysis object to clone
 * @returns A deep copy of the analysis
 */
export function clonePoemAnalysis(analysis: PoemAnalysis): PoemAnalysis {
  return JSON.parse(JSON.stringify(analysis));
}

/**
 * Merges partial analysis data into an existing analysis
 * @param base The base analysis to merge into
 * @param partial Partial data to merge
 * @returns New merged PoemAnalysis (does not mutate inputs)
 */
export function mergePoemAnalysis(
  base: PoemAnalysis,
  partial: Partial<PoemAnalysis>
): PoemAnalysis {
  const cloned = clonePoemAnalysis(base);

  if (partial.meta) {
    cloned.meta = { ...cloned.meta, ...partial.meta };
  }
  if (partial.structure) {
    cloned.structure = partial.structure;
  }
  if (partial.prosody) {
    cloned.prosody = { ...cloned.prosody, ...partial.prosody };
  }
  if (partial.emotion) {
    cloned.emotion = { ...cloned.emotion, ...partial.emotion };
  }
  if (partial.form) {
    cloned.form = { ...cloned.form, ...partial.form };
  }
  if (partial.problems) {
    cloned.problems = partial.problems;
  }
  if (partial.melodySuggestions) {
    cloned.melodySuggestions = { ...cloned.melodySuggestions, ...partial.melodySuggestions };
  }

  return cloned;
}

// =============================================================================
// Structure Analysis Types
// =============================================================================

/**
 * Section type classification for song structure
 */
export type SectionType = 'verse' | 'chorus' | 'bridge' | 'refrain' | 'intro' | 'outro';

/**
 * A detected section in the poem
 */
export interface Section {
  /** The type of section (verse, chorus, etc.) */
  type: SectionType;
  /** Stanza indices that belong to this section */
  stanzaIndices: number[];
  /** A label for display (e.g., "Verse 1", "Chorus") */
  label: string;
  /** Confidence score for the section classification (0-1) */
  confidence: number;
  /** If this is a repeat of another section, index of the original */
  repeatOf?: number;
}

/**
 * A refrain occurrence (repeated line)
 */
export interface Refrain {
  /** The text of the refrain line */
  text: string;
  /** Locations where this refrain appears [stanzaIdx, lineIdx][] */
  occurrences: [number, number][];
  /** Normalized text (lowercase, trimmed) for comparison */
  normalizedText: string;
}

/**
 * Stanza similarity result for comparison
 */
export interface StanzaSimilarity {
  /** First stanza index */
  stanza1: number;
  /** Second stanza index */
  stanza2: number;
  /** Overall similarity score (0-1) */
  overallSimilarity: number;
  /** Text similarity score (0-1) */
  textSimilarity: number;
  /** Meter similarity score (0-1) */
  meterSimilarity: number;
  /** Line count match */
  lineCountMatch: boolean;
  /** Whether they share the same foot type */
  footTypeMatch: boolean;
}

/**
 * Complete structure analysis for a poem
 */
export interface StructureAnalysis {
  /** Detected sections */
  sections: Section[];
  /** Detected refrains (repeated lines) */
  refrains: Refrain[];
  /** Stanza similarity matrix (sparse representation) */
  similarities: StanzaSimilarity[];
  /** Whether the poem has a clear verse/chorus structure */
  hasVerseChorusStructure: boolean;
  /** Dominant structure pattern (e.g., "AABA", "ABAB") */
  structurePattern: string;
  /** Summary for display */
  summary: string;
}

/**
 * Creates an empty/default StructureAnalysis
 */
export function createDefaultStructureAnalysis(): StructureAnalysis {
  return {
    sections: [],
    refrains: [],
    similarities: [],
    hasVerseChorusStructure: false,
    structurePattern: '',
    summary: 'No structure analyzed',
  };
}

// =============================================================================
// Re-exports for convenience
// =============================================================================

export type {
  StressLevel as Stress,
  RhymeType as RhymeClassification,
  Severity as ProblemSeverity,
};
