/**
 * Poem Form Detection Module
 *
 * This module detects and classifies common poem forms based on:
 * - Line count and stanza structure
 * - Meter patterns (iambic, trochaic, anapestic, etc.)
 * - Rhyme schemes (ABAB, AABB, ABBAABBA, etc.)
 * - Syllable counts per line
 *
 * Supported poem forms:
 * - Sonnet (Shakespearean, Petrarchan, Spenserian)
 * - Haiku
 * - Limerick
 * - Ballad
 * - Villanelle
 * - Sestina
 * - Ode
 * - Couplet/Heroic Couplet
 * - Tercet/Terza Rima
 * - Quatrain
 * - Free Verse
 *
 * @module lib/analysis/formDetection
 */

import type { FootType } from '@/types/analysis';

// =============================================================================
// Debug Logging
// =============================================================================

const DEBUG = process.env.NODE_ENV === 'development';
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[formDetection] ${message}`, ...args);
  }
};

// =============================================================================
// Types
// =============================================================================

/**
 * Known poem form types
 */
export type PoemFormType =
  | 'shakespearean_sonnet'
  | 'petrarchan_sonnet'
  | 'spenserian_sonnet'
  | 'sonnet' // generic sonnet when subtype unclear
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
 * Categories of poem forms for grouping
 */
export type FormCategory =
  | 'fixed_form' // Strict rules (sonnet, villanelle, sestina)
  | 'syllabic' // Based on syllable count (haiku, tanka)
  | 'stanzaic' // Based on stanza structure (ballad, ode)
  | 'metrical' // Based on meter (blank verse, heroic couplet)
  | 'free' // No fixed rules
  | 'unknown';

/**
 * Detailed result of form detection
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
 * Input structure for form detection
 */
export interface FormDetectionInput {
  /** Total number of lines in the poem */
  lineCount: number;
  /** Number of stanzas */
  stanzaCount: number;
  /** Lines per stanza */
  linesPerStanza: number[];
  /** Detected meter (foot type) */
  meterFootType: FootType;
  /** Meter name (e.g., "iambic pentameter") */
  meterName: string;
  /** Meter confidence score */
  meterConfidence: number;
  /** Rhyme scheme string (e.g., "ABABCDCDEFEFGG") */
  rhymeScheme: string;
  /** Syllable counts per line */
  syllablesPerLine: number[];
  /** Average syllables per line */
  avgSyllablesPerLine: number;
  /** Meter regularity score */
  regularity: number;
}

/**
 * Form definition for matching
 */
interface FormDefinition {
  type: PoemFormType;
  name: string;
  category: FormCategory;
  description: string;
  /** Check function that returns confidence (0-1) and evidence */
  check: (input: FormDetectionInput) => { confidence: number; evidence: FormEvidence };
}

// =============================================================================
// Form Definitions
// =============================================================================

/**
 * Creates default evidence with all false matches
 */
function createDefaultEvidence(): FormEvidence {
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
 * Checks if rhyme scheme matches a pattern (with some flexibility)
 */
function rhymeSchemeMatches(actual: string, expected: string | RegExp): boolean {
  if (typeof expected === 'string') {
    return actual.toUpperCase() === expected.toUpperCase();
  }
  return expected.test(actual.toUpperCase());
}


/**
 * Checks if syllable counts match a pattern (with tolerance)
 */
function syllablesMatch(
  actual: number[],
  expected: number[],
  tolerance: number = 1
): boolean {
  if (actual.length !== expected.length) return false;
  return actual.every((count, i) => Math.abs(count - expected[i]) <= tolerance);
}

/**
 * Checks if stanza structure matches (lines per stanza)
 */
function stanzaStructureMatches(
  actual: number[],
  expected: number | number[]
): boolean {
  if (typeof expected === 'number') {
    return actual.every((lines) => lines === expected);
  }
  if (actual.length !== expected.length) return false;
  return actual.every((lines, i) => lines === expected[i]);
}

// =============================================================================
// Sonnets
// =============================================================================

const shakespeareanSonnetForm: FormDefinition = {
  type: 'shakespearean_sonnet',
  name: 'Shakespearean Sonnet',
  category: 'fixed_form',
  description:
    'A 14-line poem in iambic pentameter with rhyme scheme ABABCDCDEFEFGG (three quatrains and a couplet).',
  check: (input) => {
    const evidence = createDefaultEvidence();
    let confidence = 0;

    // Line count (14 lines)
    if (input.lineCount === 14) {
      evidence.lineCountMatch = true;
      confidence += 0.25;
      evidence.notes.push('Has 14 lines');
    } else if (input.lineCount >= 12 && input.lineCount <= 16) {
      confidence += 0.1;
      evidence.notes.push(`Has ${input.lineCount} lines (expected 14)`);
    }

    // Rhyme scheme: ABABCDCDEFEFGG
    const rhymeSchemePattern = /^ABAB.?CDCD.?EFEF.?GG$/i;
    if (rhymeSchemeMatches(input.rhymeScheme, 'ABABCDCDEFEFGG')) {
      evidence.rhymeSchemeMatch = true;
      confidence += 0.35;
      evidence.notes.push('Perfect Shakespearean rhyme scheme ABABCDCDEFEFGG');
    } else if (rhymeSchemePattern.test(input.rhymeScheme)) {
      evidence.rhymeSchemeMatch = true;
      confidence += 0.25;
      evidence.notes.push('Approximate Shakespearean rhyme scheme');
    } else if (input.rhymeScheme.endsWith('GG') || input.rhymeScheme.endsWith('gg')) {
      confidence += 0.1;
      evidence.notes.push('Ends with couplet');
    }

    // Meter: iambic pentameter
    if (
      input.meterFootType === 'iamb' &&
      input.meterName.toLowerCase().includes('pentameter')
    ) {
      evidence.meterMatch = true;
      confidence += 0.25;
      evidence.notes.push('Uses iambic pentameter');
    } else if (input.meterFootType === 'iamb') {
      confidence += 0.1;
      evidence.notes.push('Uses iambic meter');
    }

    // Syllables (10 per line for pentameter)
    const expectedSyllables = Array(14).fill(10);
    if (syllablesMatch(input.syllablesPerLine, expectedSyllables, 2)) {
      evidence.syllablePatternMatch = true;
      confidence += 0.15;
      evidence.notes.push('~10 syllables per line');
    } else if (input.avgSyllablesPerLine >= 8 && input.avgSyllablesPerLine <= 12) {
      confidence += 0.05;
      evidence.notes.push(`Average ${input.avgSyllablesPerLine.toFixed(1)} syllables per line`);
    }

    return { confidence: Math.min(1, confidence), evidence };
  },
};

const petrarchanSonnetForm: FormDefinition = {
  type: 'petrarchan_sonnet',
  name: 'Petrarchan Sonnet',
  category: 'fixed_form',
  description:
    'A 14-line poem with an octave (ABBAABBA) and sestet (CDCDCD, CDECDE, or similar).',
  check: (input) => {
    const evidence = createDefaultEvidence();
    let confidence = 0;

    // Line count (14 lines)
    if (input.lineCount === 14) {
      evidence.lineCountMatch = true;
      confidence += 0.25;
      evidence.notes.push('Has 14 lines');
    }

    // Rhyme scheme: ABBAABBA + sestet variations
    const octavePattern = /^ABBAABBA/i;
    const petrarchanPatterns = [
      /^ABBAABBACDCDCD$/i,
      /^ABBAABBACDECDE$/i,
      /^ABBAABBACDECDE$/i,
      /^ABBAABBACDDCEE$/i,
      /^ABBAABBACDDECE$/i,
    ];

    if (petrarchanPatterns.some((p) => p.test(input.rhymeScheme))) {
      evidence.rhymeSchemeMatch = true;
      confidence += 0.35;
      evidence.notes.push('Perfect Petrarchan rhyme scheme');
    } else if (octavePattern.test(input.rhymeScheme)) {
      evidence.rhymeSchemeMatch = true;
      confidence += 0.25;
      evidence.notes.push('Has Petrarchan octave ABBAABBA');
    }

    // Meter: typically iambic pentameter
    if (
      input.meterFootType === 'iamb' &&
      input.meterName.toLowerCase().includes('pentameter')
    ) {
      evidence.meterMatch = true;
      confidence += 0.25;
      evidence.notes.push('Uses iambic pentameter');
    }

    // Stanza structure: octave (8) + sestet (6)
    if (
      input.stanzaCount === 2 &&
      stanzaStructureMatches(input.linesPerStanza, [8, 6])
    ) {
      evidence.stanzaStructureMatch = true;
      confidence += 0.15;
      evidence.notes.push('Has octave and sestet structure');
    }

    return { confidence: Math.min(1, confidence), evidence };
  },
};

const spenserianSonnetForm: FormDefinition = {
  type: 'spenserian_sonnet',
  name: 'Spenserian Sonnet',
  category: 'fixed_form',
  description:
    'A 14-line poem with interlocking rhyme scheme ABABBCBCCDCDEE.',
  check: (input) => {
    const evidence = createDefaultEvidence();
    let confidence = 0;

    // Line count (14 lines)
    if (input.lineCount === 14) {
      evidence.lineCountMatch = true;
      confidence += 0.25;
      evidence.notes.push('Has 14 lines');
    }

    // Rhyme scheme: ABABBCBCCDCDEE
    if (rhymeSchemeMatches(input.rhymeScheme, 'ABABBCBCCDCDEE')) {
      evidence.rhymeSchemeMatch = true;
      confidence += 0.4;
      evidence.notes.push('Perfect Spenserian rhyme scheme ABABBCBCCDCDEE');
    } else if (/^ABAB.?BCBC.?CDCD.?EE$/i.test(input.rhymeScheme)) {
      evidence.rhymeSchemeMatch = true;
      confidence += 0.25;
      evidence.notes.push('Approximate Spenserian interlocking scheme');
    }

    // Meter: iambic pentameter
    if (
      input.meterFootType === 'iamb' &&
      input.meterName.toLowerCase().includes('pentameter')
    ) {
      evidence.meterMatch = true;
      confidence += 0.25;
      evidence.notes.push('Uses iambic pentameter');
    }

    return { confidence: Math.min(1, confidence), evidence };
  },
};

// Generic sonnet check (when subtype is unclear)
const genericSonnetForm: FormDefinition = {
  type: 'sonnet',
  name: 'Sonnet',
  category: 'fixed_form',
  description:
    'A 14-line poem, typically in iambic pentameter with a defined rhyme scheme.',
  check: (input) => {
    const evidence = createDefaultEvidence();
    let confidence = 0;

    // Line count (14 lines)
    if (input.lineCount === 14) {
      evidence.lineCountMatch = true;
      confidence += 0.4;
      evidence.notes.push('Has 14 lines (sonnet length)');
    } else if (input.lineCount >= 12 && input.lineCount <= 16) {
      confidence += 0.15;
      evidence.notes.push(`Has ${input.lineCount} lines (near sonnet length)`);
    }

    // Meter: iambic (any length, but pentameter preferred)
    if (input.meterFootType === 'iamb') {
      evidence.meterMatch = true;
      if (input.meterName.toLowerCase().includes('pentameter')) {
        confidence += 0.3;
        evidence.notes.push('Uses iambic pentameter');
      } else {
        confidence += 0.15;
        evidence.notes.push('Uses iambic meter');
      }
    }

    // Has a structured rhyme scheme (not free verse)
    const uniqueRhymes = new Set(input.rhymeScheme.toUpperCase().split('')).size;
    const rhymeDensity = uniqueRhymes / input.rhymeScheme.length;
    if (rhymeDensity < 0.7 && input.rhymeScheme.length >= 10) {
      evidence.rhymeSchemeMatch = true;
      confidence += 0.2;
      evidence.notes.push('Has structured rhyme scheme');
    }

    return { confidence: Math.min(1, confidence), evidence };
  },
};

// =============================================================================
// Japanese Forms
// =============================================================================

const haikuForm: FormDefinition = {
  type: 'haiku',
  name: 'Haiku',
  category: 'syllabic',
  description:
    'A Japanese form with 3 lines of 5-7-5 syllables (17 total), traditionally about nature.',
  check: (input) => {
    const evidence = createDefaultEvidence();
    let confidence = 0;

    // Line count (3 lines)
    if (input.lineCount === 3) {
      evidence.lineCountMatch = true;
      confidence += 0.3;
      evidence.notes.push('Has 3 lines');
    }

    // Syllable pattern: 5-7-5
    if (input.syllablesPerLine.length === 3) {
      const [s1, s2, s3] = input.syllablesPerLine;

      // Perfect 5-7-5
      if (s1 === 5 && s2 === 7 && s3 === 5) {
        evidence.syllablePatternMatch = true;
        confidence += 0.6;
        evidence.notes.push('Perfect 5-7-5 syllable pattern');
      }
      // Near 5-7-5 (within 1 syllable each)
      else if (
        Math.abs(s1 - 5) <= 1 &&
        Math.abs(s2 - 7) <= 1 &&
        Math.abs(s3 - 5) <= 1
      ) {
        evidence.syllablePatternMatch = true;
        confidence += 0.4;
        evidence.notes.push(`Near 5-7-5 pattern (${s1}-${s2}-${s3})`);
      }
      // Total syllables around 17
      else {
        const total = s1 + s2 + s3;
        if (total >= 15 && total <= 19) {
          confidence += 0.2;
          evidence.notes.push(`Total ${total} syllables (near 17)`);
        }
      }
    }

    // Haiku typically doesn't rhyme
    const uniqueRhymes = new Set(input.rhymeScheme.toUpperCase().split('')).size;
    if (uniqueRhymes === input.rhymeScheme.length) {
      confidence += 0.1;
      evidence.notes.push('No rhyme (typical for haiku)');
    }

    return { confidence: Math.min(1, confidence), evidence };
  },
};

const tankaForm: FormDefinition = {
  type: 'tanka',
  name: 'Tanka',
  category: 'syllabic',
  description:
    'A Japanese form with 5 lines of 5-7-5-7-7 syllables (31 total).',
  check: (input) => {
    const evidence = createDefaultEvidence();
    let confidence = 0;

    // Line count (5 lines)
    if (input.lineCount === 5) {
      evidence.lineCountMatch = true;
      confidence += 0.25;
      evidence.notes.push('Has 5 lines');
    }

    // Syllable pattern: 5-7-5-7-7
    if (input.syllablesPerLine.length === 5) {
      const [s1, s2, s3, s4, s5] = input.syllablesPerLine;
      const expected = [5, 7, 5, 7, 7];

      if (syllablesMatch(input.syllablesPerLine, expected, 0)) {
        evidence.syllablePatternMatch = true;
        confidence += 0.6;
        evidence.notes.push('Perfect 5-7-5-7-7 syllable pattern');
      } else if (syllablesMatch(input.syllablesPerLine, expected, 1)) {
        evidence.syllablePatternMatch = true;
        confidence += 0.4;
        evidence.notes.push(`Near 5-7-5-7-7 pattern (${s1}-${s2}-${s3}-${s4}-${s5})`);
      } else {
        const total = input.syllablesPerLine.reduce((a, b) => a + b, 0);
        if (total >= 28 && total <= 34) {
          confidence += 0.15;
          evidence.notes.push(`Total ${total} syllables (near 31)`);
        }
      }
    }

    return { confidence: Math.min(1, confidence), evidence };
  },
};

// =============================================================================
// Limerick
// =============================================================================

const limerickForm: FormDefinition = {
  type: 'limerick',
  name: 'Limerick',
  category: 'fixed_form',
  description:
    'A 5-line humorous poem with AABBA rhyme scheme and anapestic meter.',
  check: (input) => {
    const evidence = createDefaultEvidence();
    let confidence = 0;

    // Line count (5 lines)
    if (input.lineCount === 5) {
      evidence.lineCountMatch = true;
      confidence += 0.25;
      evidence.notes.push('Has 5 lines');
    }

    // Rhyme scheme: AABBA
    if (rhymeSchemeMatches(input.rhymeScheme, 'AABBA')) {
      evidence.rhymeSchemeMatch = true;
      confidence += 0.35;
      evidence.notes.push('Perfect AABBA rhyme scheme');
    } else if (/^[A-Z]{2}[B-Z]{2}[A-Z]$/i.test(input.rhymeScheme) &&
               input.rhymeScheme[0] === input.rhymeScheme[1] &&
               input.rhymeScheme[0] === input.rhymeScheme[4] &&
               input.rhymeScheme[2] === input.rhymeScheme[3]) {
      evidence.rhymeSchemeMatch = true;
      confidence += 0.25;
      evidence.notes.push('Has AABBA-style rhyme pattern');
    }

    // Meter: anapestic (or could be amphibrachic)
    if (input.meterFootType === 'anapest') {
      evidence.meterMatch = true;
      confidence += 0.25;
      evidence.notes.push('Uses anapestic meter');
    } else if (input.meterFootType === 'iamb' || input.meterFootType === 'dactyl') {
      confidence += 0.1;
      evidence.notes.push('Uses compatible meter');
    }

    // Syllable pattern: long-long-short-short-long (roughly 8-8-5-5-8)
    if (input.syllablesPerLine.length === 5) {
      const [s1, s2, s3, s4, s5] = input.syllablesPerLine;
      // Lines 1, 2, 5 are longer; lines 3, 4 are shorter
      if (s1 > s3 && s2 > s4 && s5 > s3 && s3 < 7 && s4 < 7) {
        evidence.syllablePatternMatch = true;
        confidence += 0.15;
        evidence.notes.push('Has long-long-short-short-long structure');
      }
    }

    return { confidence: Math.min(1, confidence), evidence };
  },
};

// =============================================================================
// Ballad / Common Meter
// =============================================================================

const balladForm: FormDefinition = {
  type: 'ballad',
  name: 'Ballad',
  category: 'stanzaic',
  description:
    'A narrative poem with 4-line stanzas, alternating iambic tetrameter and trimeter, ABAB or ABCB rhyme.',
  check: (input) => {
    const evidence = createDefaultEvidence();
    let confidence = 0;

    // Stanza structure: 4-line stanzas
    if (input.linesPerStanza.every((lines) => lines === 4)) {
      evidence.stanzaStructureMatch = true;
      confidence += 0.25;
      evidence.notes.push('Has 4-line stanzas (quatrains)');
    }

    // Rhyme scheme: ABAB or ABCB patterns
    const quatrainPatterns = [/^(ABAB)+$/i, /^(ABCB)+$/i, /^(XAXA)+$/i];
    if (quatrainPatterns.some((p) => p.test(input.rhymeScheme))) {
      evidence.rhymeSchemeMatch = true;
      confidence += 0.3;
      evidence.notes.push('Has ABAB/ABCB rhyme pattern');
    }

    // Meter: iambic (alternating tetrameter/trimeter)
    if (input.meterFootType === 'iamb') {
      evidence.meterMatch = true;
      confidence += 0.25;
      evidence.notes.push('Uses iambic meter');
    }

    // Syllable pattern: alternating 8-6-8-6 (common meter)
    if (input.syllablesPerLine.length >= 4) {
      let alternating = true;
      for (let i = 0; i < input.syllablesPerLine.length; i++) {
        const expected = i % 2 === 0 ? 8 : 6;
        if (Math.abs(input.syllablesPerLine[i] - expected) > 2) {
          alternating = false;
          break;
        }
      }
      if (alternating) {
        evidence.syllablePatternMatch = true;
        confidence += 0.2;
        evidence.notes.push('Has alternating 8-6 syllable pattern');
      }
    }

    return { confidence: Math.min(1, confidence), evidence };
  },
};

const commonMeterForm: FormDefinition = {
  type: 'common_meter',
  name: 'Common Meter',
  category: 'metrical',
  description:
    'Alternating lines of iambic tetrameter (8 syllables) and iambic trimeter (6 syllables) with ABAB or ABCB rhyme.',
  check: (input) => {
    const evidence = createDefaultEvidence();
    let confidence = 0;

    // Stanza structure: typically 4-line stanzas
    if (input.linesPerStanza.every((lines) => lines === 4)) {
      evidence.stanzaStructureMatch = true;
      confidence += 0.2;
      evidence.notes.push('Has 4-line stanzas');
    }

    // Meter: iambic
    if (input.meterFootType === 'iamb') {
      evidence.meterMatch = true;
      confidence += 0.25;
      evidence.notes.push('Uses iambic meter');
    }

    // Syllable pattern: strict alternating 8-6-8-6
    if (input.syllablesPerLine.length >= 4) {
      const matches = input.syllablesPerLine.every((count, i) => {
        const expected = i % 2 === 0 ? 8 : 6;
        return Math.abs(count - expected) <= 1;
      });
      if (matches) {
        evidence.syllablePatternMatch = true;
        confidence += 0.35;
        evidence.notes.push('Has strict 8-6-8-6 syllable pattern');
      }
    }

    // Rhyme scheme
    const cmPatterns = [/^(ABAB)+$/i, /^(ABCB)+$/i];
    if (cmPatterns.some((p) => p.test(input.rhymeScheme))) {
      evidence.rhymeSchemeMatch = true;
      confidence += 0.2;
      evidence.notes.push('Has common meter rhyme pattern');
    }

    return { confidence: Math.min(1, confidence), evidence };
  },
};

// =============================================================================
// Villanelle
// =============================================================================

const villanelleForm: FormDefinition = {
  type: 'villanelle',
  name: 'Villanelle',
  category: 'fixed_form',
  description:
    'A 19-line poem with 5 tercets and a quatrain, using two refrains and ABA rhyme throughout.',
  check: (input) => {
    const evidence = createDefaultEvidence();
    let confidence = 0;

    // Line count (19 lines)
    if (input.lineCount === 19) {
      evidence.lineCountMatch = true;
      confidence += 0.3;
      evidence.notes.push('Has 19 lines');
    } else if (input.lineCount >= 17 && input.lineCount <= 21) {
      confidence += 0.1;
      evidence.notes.push(`Has ${input.lineCount} lines (near 19)`);
    }

    // Stanza structure: 5 tercets + 1 quatrain (3,3,3,3,3,4)
    if (
      input.stanzaCount === 6 &&
      stanzaStructureMatches(input.linesPerStanza, [3, 3, 3, 3, 3, 4])
    ) {
      evidence.stanzaStructureMatch = true;
      confidence += 0.3;
      evidence.notes.push('Has 5 tercets and 1 quatrain');
    }

    // Rhyme scheme: ABA pattern throughout
    // Full pattern: A1bA2 abA1 abA2 abA1 abA2 abA1A2
    if (/^(ABA){5}ABAA$/i.test(input.rhymeScheme) ||
        /^A.A(.{3}){4}.{4}$/i.test(input.rhymeScheme)) {
      evidence.rhymeSchemeMatch = true;
      confidence += 0.3;
      evidence.notes.push('Has villanelle ABA rhyme pattern');
    } else {
      // Check for recurring ABA tercets
      const tercetPattern = /^(ABA)+/i;
      if (tercetPattern.test(input.rhymeScheme.slice(0, 15))) {
        confidence += 0.15;
        evidence.notes.push('Has ABA tercet pattern');
      }
    }

    // Meter: typically iambic pentameter
    if (
      input.meterFootType === 'iamb' &&
      input.meterName.toLowerCase().includes('pentameter')
    ) {
      evidence.meterMatch = true;
      confidence += 0.1;
      evidence.notes.push('Uses iambic pentameter');
    }

    return { confidence: Math.min(1, confidence), evidence };
  },
};

// =============================================================================
// Sestina
// =============================================================================

const sestinaForm: FormDefinition = {
  type: 'sestina',
  name: 'Sestina',
  category: 'fixed_form',
  description:
    'A 39-line poem with 6 six-line stanzas and a 3-line envoi, using end-word rotation.',
  check: (input) => {
    const evidence = createDefaultEvidence();
    let confidence = 0;

    // Line count (39 lines)
    if (input.lineCount === 39) {
      evidence.lineCountMatch = true;
      confidence += 0.35;
      evidence.notes.push('Has 39 lines');
    } else if (input.lineCount >= 36 && input.lineCount <= 42) {
      confidence += 0.15;
      evidence.notes.push(`Has ${input.lineCount} lines (near 39)`);
    }

    // Stanza structure: 6 six-line stanzas + 3-line envoi
    if (
      input.stanzaCount === 7 &&
      stanzaStructureMatches(input.linesPerStanza, [6, 6, 6, 6, 6, 6, 3])
    ) {
      evidence.stanzaStructureMatch = true;
      confidence += 0.35;
      evidence.notes.push('Has 6 sextets and 3-line envoi');
    } else if (input.stanzaCount >= 6 && input.linesPerStanza.some((l) => l === 6)) {
      confidence += 0.15;
      evidence.notes.push('Has six-line stanzas');
    }

    // Sestinas don't use traditional rhyme but repeat end words
    // The rhyme scheme often looks like ABCDEF with complex rotation
    if (input.rhymeScheme.length >= 36) {
      const uniqueLetters = new Set(input.rhymeScheme.toUpperCase().split(''));
      if (uniqueLetters.size <= 8) {
        // Limited set of "rhyme" letters suggests word repetition
        confidence += 0.2;
        evidence.notes.push('Has limited rhyme variety (suggests end-word rotation)');
      }
    }

    // No specific meter required, but often iambic pentameter
    if (input.meterFootType === 'iamb') {
      evidence.meterMatch = true;
      confidence += 0.1;
      evidence.notes.push('Uses iambic meter');
    }

    return { confidence: Math.min(1, confidence), evidence };
  },
};

// =============================================================================
// Ode
// =============================================================================

const odeForm: FormDefinition = {
  type: 'ode',
  name: 'Ode',
  category: 'stanzaic',
  description:
    'A lyric poem with elaborate structure, typically praising or addressing a subject.',
  check: (input) => {
    const evidence = createDefaultEvidence();
    let confidence = 0;

    // Odes are flexible but typically have multiple stanzas
    if (input.stanzaCount >= 3) {
      evidence.stanzaStructureMatch = true;
      confidence += 0.15;
      evidence.notes.push(`Has ${input.stanzaCount} stanzas`);
    }

    // Often uses longer stanzas (8-12 lines)
    const avgStanzaLength =
      input.linesPerStanza.reduce((a, b) => a + b, 0) / input.linesPerStanza.length;
    if (avgStanzaLength >= 6) {
      confidence += 0.15;
      evidence.notes.push(`Average ${avgStanzaLength.toFixed(1)} lines per stanza`);
    }

    // Variable rhyme schemes are common
    if (input.rhymeScheme.length > 0) {
      const uniqueRhymes = new Set(input.rhymeScheme.toUpperCase().split('')).size;
      const density = uniqueRhymes / input.rhymeScheme.length;
      if (density > 0.3 && density < 0.8) {
        evidence.rhymeSchemeMatch = true;
        confidence += 0.2;
        evidence.notes.push('Has moderate rhyme scheme complexity');
      }
    }

    // Often uses iambic meter
    if (input.meterFootType === 'iamb') {
      evidence.meterMatch = true;
      confidence += 0.15;
      evidence.notes.push('Uses iambic meter');
    }

    // Line count typically 20-100+ lines
    if (input.lineCount >= 20) {
      evidence.lineCountMatch = true;
      confidence += 0.15;
      evidence.notes.push('Has substantial length');
    }

    return { confidence: Math.min(1, confidence), evidence };
  },
};

// =============================================================================
// Couplets
// =============================================================================

const heroicCoupletForm: FormDefinition = {
  type: 'heroic_couplet',
  name: 'Heroic Couplet',
  category: 'metrical',
  description:
    'Pairs of rhyming lines in iambic pentameter.',
  check: (input) => {
    const evidence = createDefaultEvidence();
    let confidence = 0;

    // Rhyme scheme: AABBCC... (consecutive pairs)
    const coupletPattern = /^(AA|BB|CC|DD|EE|FF|GG|HH|II|JJ)+$/i;
    if (coupletPattern.test(input.rhymeScheme.replace(/[^A-Z]/gi, ''))) {
      evidence.rhymeSchemeMatch = true;
      confidence += 0.35;
      evidence.notes.push('Has rhyming couplet pattern');
    } else {
      // Check if pairs rhyme
      let pairsRhyme = true;
      for (let i = 0; i < input.rhymeScheme.length - 1; i += 2) {
        if (input.rhymeScheme[i] !== input.rhymeScheme[i + 1]) {
          pairsRhyme = false;
          break;
        }
      }
      if (pairsRhyme && input.rhymeScheme.length >= 4) {
        evidence.rhymeSchemeMatch = true;
        confidence += 0.3;
        evidence.notes.push('Lines rhyme in pairs');
      }
    }

    // Meter: iambic pentameter
    if (
      input.meterFootType === 'iamb' &&
      input.meterName.toLowerCase().includes('pentameter')
    ) {
      evidence.meterMatch = true;
      confidence += 0.4;
      evidence.notes.push('Uses iambic pentameter');
    } else if (input.meterFootType === 'iamb') {
      confidence += 0.2;
      evidence.notes.push('Uses iambic meter');
    }

    // Syllables around 10 per line
    if (input.avgSyllablesPerLine >= 9 && input.avgSyllablesPerLine <= 11) {
      evidence.syllablePatternMatch = true;
      confidence += 0.15;
      evidence.notes.push('~10 syllables per line');
    }

    // Even line count (pairs)
    if (input.lineCount % 2 === 0 && input.lineCount >= 2) {
      evidence.lineCountMatch = true;
      confidence += 0.1;
      evidence.notes.push('Even number of lines');
    }

    return { confidence: Math.min(1, confidence), evidence };
  },
};

const coupletForm: FormDefinition = {
  type: 'couplet',
  name: 'Couplet',
  category: 'stanzaic',
  description:
    'A poem composed of rhyming pairs of lines.',
  check: (input) => {
    const evidence = createDefaultEvidence();
    let confidence = 0;

    // Rhyme scheme: pairs
    let pairsRhyme = true;
    for (let i = 0; i < input.rhymeScheme.length - 1; i += 2) {
      if (input.rhymeScheme[i] !== input.rhymeScheme[i + 1]) {
        pairsRhyme = false;
        break;
      }
    }
    if (pairsRhyme && input.rhymeScheme.length >= 2) {
      evidence.rhymeSchemeMatch = true;
      confidence += 0.4;
      evidence.notes.push('Lines rhyme in pairs');
    }

    // Even line count
    if (input.lineCount % 2 === 0 && input.lineCount >= 2) {
      evidence.lineCountMatch = true;
      confidence += 0.2;
      evidence.notes.push('Even number of lines');
    }

    // Stanza structure: 2-line stanzas
    if (input.linesPerStanza.every((lines) => lines === 2)) {
      evidence.stanzaStructureMatch = true;
      confidence += 0.2;
      evidence.notes.push('Has 2-line stanzas');
    }

    // Any meter is acceptable
    if (input.meterFootType !== 'unknown') {
      evidence.meterMatch = true;
      confidence += 0.1;
      evidence.notes.push(`Uses ${input.meterFootType} meter`);
    }

    return { confidence: Math.min(1, confidence), evidence };
  },
};

// =============================================================================
// Tercets / Terza Rima
// =============================================================================

const terzaRimaForm: FormDefinition = {
  type: 'terza_rima',
  name: 'Terza Rima',
  category: 'fixed_form',
  description:
    'Interlocking tercets with ABA BCB CDC... rhyme scheme.',
  check: (input) => {
    const evidence = createDefaultEvidence();
    let confidence = 0;

    // Stanza structure: 3-line stanzas
    if (input.linesPerStanza.every((lines) => lines === 3)) {
      evidence.stanzaStructureMatch = true;
      confidence += 0.25;
      evidence.notes.push('Has 3-line stanzas (tercets)');
    }

    // Rhyme scheme: ABA BCB CDC... (interlocking)
    // Check for interlocking pattern
    const scheme = input.rhymeScheme.toUpperCase();
    if (scheme.length >= 6) {
      let isInterlocking = true;
      // In terza rima, every 3rd line rhymes with the 1st of the next tercet
      for (let i = 0; i + 3 < scheme.length; i += 3) {
        if (scheme[i + 1] !== scheme[i + 3]) {
          isInterlocking = false;
          break;
        }
      }
      if (isInterlocking) {
        evidence.rhymeSchemeMatch = true;
        confidence += 0.4;
        evidence.notes.push('Has interlocking ABA BCB rhyme pattern');
      }
    }

    // Often iambic pentameter (as in Dante)
    if (
      input.meterFootType === 'iamb' &&
      input.meterName.toLowerCase().includes('pentameter')
    ) {
      evidence.meterMatch = true;
      confidence += 0.2;
      evidence.notes.push('Uses iambic pentameter');
    }

    // Line count divisible by 3 (plus optional final line)
    if (input.lineCount % 3 === 0 || input.lineCount % 3 === 1) {
      evidence.lineCountMatch = true;
      confidence += 0.1;
      evidence.notes.push('Line count compatible with tercets');
    }

    return { confidence: Math.min(1, confidence), evidence };
  },
};

const tercetForm: FormDefinition = {
  type: 'tercet',
  name: 'Tercet',
  category: 'stanzaic',
  description:
    'A poem composed of three-line stanzas.',
  check: (input) => {
    const evidence = createDefaultEvidence();
    let confidence = 0;

    // Stanza structure: 3-line stanzas
    if (input.linesPerStanza.every((lines) => lines === 3)) {
      evidence.stanzaStructureMatch = true;
      confidence += 0.35;
      evidence.notes.push('Has 3-line stanzas');
    }

    // Line count divisible by 3
    if (input.lineCount % 3 === 0 && input.lineCount >= 3) {
      evidence.lineCountMatch = true;
      confidence += 0.2;
      evidence.notes.push('Line count divisible by 3');
    }

    // Various rhyme schemes possible (AAA, ABA, ABB, etc.)
    if (input.rhymeScheme.length >= 3) {
      evidence.rhymeSchemeMatch = true;
      confidence += 0.15;
      evidence.notes.push('Has rhyme scheme');
    }

    // Any meter
    if (input.meterFootType !== 'unknown') {
      evidence.meterMatch = true;
      confidence += 0.1;
      evidence.notes.push(`Uses ${input.meterFootType} meter`);
    }

    return { confidence: Math.min(1, confidence), evidence };
  },
};

// =============================================================================
// Quatrain
// =============================================================================

const quatrainForm: FormDefinition = {
  type: 'quatrain',
  name: 'Quatrain',
  category: 'stanzaic',
  description:
    'A poem composed of four-line stanzas.',
  check: (input) => {
    const evidence = createDefaultEvidence();
    let confidence = 0;

    // Stanza structure: 4-line stanzas
    if (input.linesPerStanza.every((lines) => lines === 4)) {
      evidence.stanzaStructureMatch = true;
      confidence += 0.35;
      evidence.notes.push('Has 4-line stanzas');
    }

    // Line count divisible by 4
    if (input.lineCount % 4 === 0 && input.lineCount >= 4) {
      evidence.lineCountMatch = true;
      confidence += 0.2;
      evidence.notes.push('Line count divisible by 4');
    }

    // Various rhyme schemes (ABAB, AABB, ABBA, ABCB)
    const quatrainPatterns = [/^(ABAB)+$/i, /^(AABB)+$/i, /^(ABBA)+$/i, /^(ABCB)+$/i];
    if (quatrainPatterns.some((p) => p.test(input.rhymeScheme))) {
      evidence.rhymeSchemeMatch = true;
      confidence += 0.25;
      evidence.notes.push('Has quatrain rhyme pattern');
    }

    // Any meter
    if (input.meterFootType !== 'unknown') {
      evidence.meterMatch = true;
      confidence += 0.1;
      evidence.notes.push(`Uses ${input.meterFootType} meter`);
    }

    return { confidence: Math.min(1, confidence), evidence };
  },
};

// =============================================================================
// Cinquain
// =============================================================================

const cinquainForm: FormDefinition = {
  type: 'cinquain',
  name: 'Cinquain',
  category: 'syllabic',
  description:
    'A 5-line poem with syllable pattern 2-4-6-8-2.',
  check: (input) => {
    const evidence = createDefaultEvidence();
    let confidence = 0;

    // Line count (5 lines)
    if (input.lineCount === 5) {
      evidence.lineCountMatch = true;
      confidence += 0.3;
      evidence.notes.push('Has 5 lines');
    }

    // Syllable pattern: 2-4-6-8-2
    if (input.syllablesPerLine.length === 5) {
      const expected = [2, 4, 6, 8, 2];
      if (syllablesMatch(input.syllablesPerLine, expected, 0)) {
        evidence.syllablePatternMatch = true;
        confidence += 0.5;
        evidence.notes.push('Perfect 2-4-6-8-2 syllable pattern');
      } else if (syllablesMatch(input.syllablesPerLine, expected, 1)) {
        evidence.syllablePatternMatch = true;
        confidence += 0.35;
        evidence.notes.push('Near 2-4-6-8-2 syllable pattern');
      } else {
        // Check for building and tapering pattern
        const [s1, s2, s3, s4, s5] = input.syllablesPerLine;
        if (s1 < s2 && s2 < s3 && s3 < s4 && s5 < s4) {
          confidence += 0.2;
          evidence.notes.push('Has building-tapering structure');
        }
      }
    }

    // Cinquains typically don't rhyme
    const uniqueRhymes = new Set(input.rhymeScheme.toUpperCase().split('')).size;
    if (uniqueRhymes >= input.rhymeScheme.length - 1) {
      confidence += 0.1;
      evidence.notes.push('Minimal rhyme (typical for cinquain)');
    }

    return { confidence: Math.min(1, confidence), evidence };
  },
};

// =============================================================================
// Blank Verse
// =============================================================================

const blankVerseForm: FormDefinition = {
  type: 'blank_verse',
  name: 'Blank Verse',
  category: 'metrical',
  description:
    'Unrhymed iambic pentameter.',
  check: (input) => {
    const evidence = createDefaultEvidence();
    let confidence = 0;

    // Meter: iambic pentameter
    if (
      input.meterFootType === 'iamb' &&
      input.meterName.toLowerCase().includes('pentameter')
    ) {
      evidence.meterMatch = true;
      confidence += 0.45;
      evidence.notes.push('Uses iambic pentameter');
    } else if (input.meterFootType === 'iamb') {
      confidence += 0.2;
      evidence.notes.push('Uses iambic meter');
    }

    // No rhyme (or minimal rhyme)
    const uniqueRhymes = new Set(input.rhymeScheme.toUpperCase().split('')).size;
    const rhymeDensity = uniqueRhymes / Math.max(1, input.rhymeScheme.length);
    if (rhymeDensity >= 0.8) {
      evidence.rhymeSchemeMatch = true;
      confidence += 0.35;
      evidence.notes.push('Unrhymed or minimal rhyme');
    } else if (rhymeDensity >= 0.6) {
      confidence += 0.15;
      evidence.notes.push('Sparse rhyme');
    }

    // Syllables around 10 per line
    if (input.avgSyllablesPerLine >= 9 && input.avgSyllablesPerLine <= 11) {
      evidence.syllablePatternMatch = true;
      confidence += 0.15;
      evidence.notes.push('~10 syllables per line');
    }

    // Substantial length (blank verse is typically used for longer works)
    if (input.lineCount >= 10) {
      evidence.lineCountMatch = true;
      confidence += 0.05;
      evidence.notes.push('Substantial length');
    }

    return { confidence: Math.min(1, confidence), evidence };
  },
};

// =============================================================================
// Free Verse
// =============================================================================

const freeVerseForm: FormDefinition = {
  type: 'free_verse',
  name: 'Free Verse',
  category: 'free',
  description:
    'Poetry without consistent meter, rhyme scheme, or stanza structure.',
  check: (input) => {
    const evidence = createDefaultEvidence();
    let confidence = 0.2; // Base confidence - free verse is a catch-all

    // Low regularity in meter
    if (input.regularity < 0.5) {
      evidence.meterMatch = true;
      confidence += 0.2;
      evidence.notes.push('Irregular meter');
    }

    // Low rhyme density
    const uniqueRhymes = new Set(input.rhymeScheme.toUpperCase().split('')).size;
    const rhymeDensity = uniqueRhymes / Math.max(1, input.rhymeScheme.length);
    if (rhymeDensity >= 0.7) {
      evidence.rhymeSchemeMatch = true;
      confidence += 0.2;
      evidence.notes.push('Minimal or no rhyme');
    }

    // Variable line lengths
    if (input.syllablesPerLine.length >= 3) {
      const min = Math.min(...input.syllablesPerLine);
      const max = Math.max(...input.syllablesPerLine);
      const variance = max - min;
      if (variance >= 5) {
        evidence.syllablePatternMatch = true;
        confidence += 0.15;
        evidence.notes.push('Variable line lengths');
      }
    }

    // Variable stanza lengths
    if (input.linesPerStanza.length >= 2) {
      const uniqueStanzaLengths = new Set(input.linesPerStanza).size;
      if (uniqueStanzaLengths > 1) {
        evidence.stanzaStructureMatch = true;
        confidence += 0.1;
        evidence.notes.push('Variable stanza structure');
      }
    }

    // Note: free verse should have lower priority than specific forms
    // Reduce confidence if it looks like it could be another form
    if (input.meterConfidence > 0.7) {
      confidence *= 0.7;
      evidence.notes.push('Strong meter detected');
    }

    return { confidence: Math.min(1, confidence), evidence };
  },
};

// =============================================================================
// Form Registry
// =============================================================================

/**
 * All registered form definitions in order of specificity
 * More specific forms should be checked before more general ones
 */
const FORM_DEFINITIONS: FormDefinition[] = [
  // Specific sonnets before generic
  shakespeareanSonnetForm,
  petrarchanSonnetForm,
  spenserianSonnetForm,

  // Syllabic forms
  haikuForm,
  tankaForm,
  cinquainForm,

  // Fixed forms
  limerickForm,
  villanelleForm,
  sestinaForm,
  terzaRimaForm,

  // Metrical forms
  heroicCoupletForm,
  blankVerseForm,
  commonMeterForm,

  // Stanzaic forms
  balladForm,
  odeForm,
  tercetForm,
  quatrainForm,
  coupletForm,

  // Generic sonnet (after specific types)
  genericSonnetForm,

  // Catch-all
  freeVerseForm,
];

// =============================================================================
// Main Detection Function
// =============================================================================

/**
 * Detects the poem form from analysis data.
 *
 * @param input - The form detection input containing meter, rhyme, and structure info
 * @returns Complete form detection result with confidence and evidence
 *
 * @example
 * const result = detectPoemForm({
 *   lineCount: 14,
 *   stanzaCount: 1,
 *   linesPerStanza: [14],
 *   meterFootType: 'iamb',
 *   meterName: 'iambic pentameter',
 *   meterConfidence: 0.9,
 *   rhymeScheme: 'ABABCDCDEFEFGG',
 *   syllablesPerLine: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
 *   avgSyllablesPerLine: 10,
 *   regularity: 0.95,
 * });
 * // Returns: { formType: 'shakespearean_sonnet', confidence: 0.95, ... }
 */
export function detectPoemForm(input: FormDetectionInput): FormDetectionResult {
  log('detectPoemForm: starting detection', input);

  // Handle empty input
  if (input.lineCount === 0) {
    log('detectPoemForm: empty poem');
    return {
      formType: 'unknown',
      formName: 'Unknown',
      category: 'unknown',
      confidence: 0,
      evidence: createDefaultEvidence(),
      alternatives: [],
      description: 'No content to analyze.',
    };
  }

  // Check all forms and collect results
  const results: Array<{
    form: FormDefinition;
    confidence: number;
    evidence: FormEvidence;
  }> = [];

  for (const form of FORM_DEFINITIONS) {
    const { confidence, evidence } = form.check(input);
    if (confidence > 0) {
      results.push({ form, confidence, evidence });
    }
  }

  // Sort by confidence descending
  results.sort((a, b) => b.confidence - a.confidence);

  log('detectPoemForm: results', results.map((r) => ({ type: r.form.type, confidence: r.confidence })));

  // If no matches found, return unknown
  if (results.length === 0) {
    log('detectPoemForm: no matches found');
    return {
      formType: 'unknown',
      formName: 'Unknown Form',
      category: 'unknown',
      confidence: 0,
      evidence: createDefaultEvidence(),
      alternatives: [],
      description: 'Could not identify a specific poem form.',
    };
  }

  // Get the best match
  const best = results[0];

  // Get alternatives (other high-confidence matches)
  const alternatives: AlternativeForm[] = results
    .slice(1, 4) // Top 3 alternatives
    .filter((r) => r.confidence >= 0.3) // Only meaningful alternatives
    .map((r) => ({
      formType: r.form.type,
      formName: r.form.name,
      confidence: r.confidence,
    }));

  const result: FormDetectionResult = {
    formType: best.form.type,
    formName: best.form.name,
    category: best.form.category,
    confidence: best.confidence,
    evidence: best.evidence,
    alternatives,
    description: best.form.description,
  };

  log('detectPoemForm: result', result);
  return result;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Gets a human-readable form name from a form type.
 *
 * @param formType - The form type
 * @returns Human-readable name
 */
export function getFormName(formType: PoemFormType): string {
  const form = FORM_DEFINITIONS.find((f) => f.type === formType);
  return form?.name || 'Unknown Form';
}

/**
 * Gets the description for a form type.
 *
 * @param formType - The form type
 * @returns Description of the form
 */
export function getFormDescription(formType: PoemFormType): string {
  const form = FORM_DEFINITIONS.find((f) => f.type === formType);
  return form?.description || '';
}

/**
 * Gets all known form types.
 *
 * @returns Array of all form types
 */
export function getAllFormTypes(): PoemFormType[] {
  return FORM_DEFINITIONS.map((f) => f.type);
}

/**
 * Gets forms by category.
 *
 * @param category - The form category
 * @returns Array of forms in that category
 */
export function getFormsByCategory(category: FormCategory): PoemFormType[] {
  return FORM_DEFINITIONS.filter((f) => f.category === category).map((f) => f.type);
}

/**
 * Checks if a form type is a sonnet variant.
 *
 * @param formType - The form type to check
 * @returns True if the form is a sonnet
 */
export function isSonnetForm(formType: PoemFormType): boolean {
  return [
    'shakespearean_sonnet',
    'petrarchan_sonnet',
    'spenserian_sonnet',
    'sonnet',
  ].includes(formType);
}

/**
 * Creates input for form detection from poem analysis data.
 *
 * @param analysis - Poem analysis data
 * @returns FormDetectionInput suitable for detectPoemForm
 */
export function createFormDetectionInput(
  lineCount: number,
  stanzaCount: number,
  linesPerStanza: number[],
  meterFootType: FootType,
  meterName: string,
  meterConfidence: number,
  rhymeScheme: string,
  syllablesPerLine: number[],
  regularity: number
): FormDetectionInput {
  const totalSyllables = syllablesPerLine.reduce((a, b) => a + b, 0);
  const avgSyllablesPerLine = lineCount > 0 ? totalSyllables / lineCount : 0;

  return {
    lineCount,
    stanzaCount,
    linesPerStanza,
    meterFootType,
    meterName,
    meterConfidence,
    rhymeScheme,
    syllablesPerLine,
    avgSyllablesPerLine,
    regularity,
  };
}
