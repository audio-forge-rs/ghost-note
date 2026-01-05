/**
 * Verse/Chorus Structure Detection Module
 *
 * This module detects repeated sections in poems that could be verses or choruses.
 * It analyzes:
 * - Repeated stanzas (potential choruses)
 * - Similar meter patterns across stanzas
 * - Refrain lines (repeated lines within or across stanzas)
 *
 * Output section labels: verse, chorus, bridge, refrain
 *
 * This information informs melody generation for variation:
 * - Verses get similar melodic treatment
 * - Choruses share identical melodies
 * - Bridges get contrasting melodic material
 *
 * @module lib/analysis/structure
 */

import type { FootType, AnalyzedStanza } from '@/types/analysis';
import { stringSimilarity } from './meter';
import { getLineStressPattern, classifyFoot } from './stress';
import { tokenizeWords } from './preprocess';

// =============================================================================
// Types
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

// =============================================================================
// Constants
// =============================================================================

/**
 * Minimum similarity threshold for stanzas to be considered potential choruses
 */
const CHORUS_SIMILARITY_THRESHOLD = 0.85;

/**
 * Minimum similarity threshold for stanzas to be considered related verses
 * This is exported for testing purposes but used internally in verse grouping
 */
export const VERSE_SIMILARITY_THRESHOLD = 0.6;

/**
 * Minimum similarity threshold for lines to be considered refrains
 */
const REFRAIN_SIMILARITY_THRESHOLD = 0.95;

/**
 * Minimum occurrences for a line to be considered a refrain
 */
const MIN_REFRAIN_OCCURRENCES = 2;

// =============================================================================
// Debug Logging
// =============================================================================

const DEBUG = process.env.NODE_ENV === 'development';
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[structure] ${message}`, ...args);
  }
};

// =============================================================================
// Text Similarity Functions
// =============================================================================

/**
 * Normalizes text for comparison by lowercasing and removing punctuation
 *
 * @param text - Text to normalize
 * @returns Normalized text
 */
export function normalizeTextForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"—–\-()[\]{}…]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates similarity between two lines of text
 * Uses a combination of exact match, word overlap, and edit distance
 *
 * @param line1 - First line
 * @param line2 - Second line
 * @returns Similarity score (0-1)
 */
export function calculateLineSimilarity(line1: string, line2: string): number {
  const norm1 = normalizeTextForComparison(line1);
  const norm2 = normalizeTextForComparison(line2);

  // Empty lines - check before exact match since '' === '' would return 1
  if (!norm1 || !norm2) {
    return 0;
  }

  // Exact match
  if (norm1 === norm2) {
    return 1.0;
  }

  // Use Levenshtein-based similarity from meter module
  const editSimilarity = stringSimilarity(norm1, norm2);

  // Word overlap similarity (Jaccard index)
  const words1 = new Set(tokenizeWords(norm1).map((w) => w.toLowerCase()));
  const words2 = new Set(tokenizeWords(norm2).map((w) => w.toLowerCase()));

  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  const jaccardSimilarity = union.size > 0 ? intersection.size / union.size : 0;

  // Weighted combination
  const similarity = editSimilarity * 0.6 + jaccardSimilarity * 0.4;

  return similarity;
}

/**
 * Calculates similarity between two stanzas
 *
 * @param stanza1 - First stanza (array of lines)
 * @param stanza2 - Second stanza (array of lines)
 * @returns Text similarity score (0-1)
 */
export function calculateStanzaTextSimilarity(
  stanza1: string[],
  stanza2: string[]
): number {
  log('calculateStanzaTextSimilarity: comparing stanzas');

  if (stanza1.length === 0 || stanza2.length === 0) {
    return 0;
  }

  // Different line counts reduce similarity
  const lineCountRatio =
    Math.min(stanza1.length, stanza2.length) /
    Math.max(stanza1.length, stanza2.length);

  // Compare lines pairwise (using shorter stanza length)
  const minLength = Math.min(stanza1.length, stanza2.length);
  let totalSimilarity = 0;

  for (let i = 0; i < minLength; i++) {
    const lineSim = calculateLineSimilarity(stanza1[i], stanza2[i]);
    totalSimilarity += lineSim;
  }

  const avgLineSimilarity = totalSimilarity / minLength;

  // Factor in line count match
  const similarity = avgLineSimilarity * (0.7 + 0.3 * lineCountRatio);

  log(
    `calculateStanzaTextSimilarity: avgLineSim=${avgLineSimilarity.toFixed(3)}, ` +
      `lineCountRatio=${lineCountRatio.toFixed(3)}, final=${similarity.toFixed(3)}`
  );

  return similarity;
}

// =============================================================================
// Meter Similarity Functions
// =============================================================================

/**
 * Calculates meter similarity between two stanzas
 *
 * @param stanza1 - First stanza lines
 * @param stanza2 - Second stanza lines
 * @returns Meter similarity score (0-1)
 */
export function calculateMeterSimilarity(
  stanza1: string[],
  stanza2: string[]
): number {
  log('calculateMeterSimilarity: comparing meter patterns');

  if (stanza1.length === 0 || stanza2.length === 0) {
    return 0;
  }

  // Get stress patterns for each line
  const patterns1 = stanza1.map((line) =>
    getLineStressPattern(tokenizeWords(line))
  );
  const patterns2 = stanza2.map((line) =>
    getLineStressPattern(tokenizeWords(line))
  );

  // Compare patterns pairwise
  const minLength = Math.min(patterns1.length, patterns2.length);
  let totalSimilarity = 0;

  for (let i = 0; i < minLength; i++) {
    const patternSim = stringSimilarity(patterns1[i], patterns2[i]);
    totalSimilarity += patternSim;
  }

  const avgPatternSimilarity = totalSimilarity / minLength;

  // Check if foot types match
  const foot1 = getStanzaFootType(patterns1);
  const foot2 = getStanzaFootType(patterns2);
  const footBonus = foot1 === foot2 && foot1 !== 'unknown' ? 0.1 : 0;

  const similarity = Math.min(1, avgPatternSimilarity + footBonus);

  log(
    `calculateMeterSimilarity: avgPatternSim=${avgPatternSimilarity.toFixed(3)}, ` +
      `foot1=${foot1}, foot2=${foot2}, final=${similarity.toFixed(3)}`
  );

  return similarity;
}

/**
 * Determines the dominant foot type for a stanza
 *
 * @param stressPatterns - Array of stress patterns (one per line)
 * @returns Dominant foot type
 */
function getStanzaFootType(stressPatterns: string[]): FootType {
  if (stressPatterns.length === 0) {
    return 'unknown';
  }

  // Get foot type for each line
  const footTypes = stressPatterns.map((pattern) => classifyFoot(pattern));

  // Count occurrences
  const footCounts = new Map<FootType, number>();
  for (const foot of footTypes) {
    footCounts.set(foot, (footCounts.get(foot) || 0) + 1);
  }

  // Find most common (excluding unknown)
  let maxCount = 0;
  let dominantFoot: FootType = 'unknown';

  for (const [foot, count] of footCounts) {
    if (foot !== 'unknown' && count > maxCount) {
      maxCount = count;
      dominantFoot = foot;
    }
  }

  return dominantFoot;
}

// =============================================================================
// Stanza Comparison
// =============================================================================

/**
 * Computes full similarity analysis between two stanzas
 *
 * @param stanza1 - First stanza lines
 * @param stanza2 - Second stanza lines
 * @param idx1 - Index of first stanza
 * @param idx2 - Index of second stanza
 * @returns Similarity analysis result
 */
export function compareStanzas(
  stanza1: string[],
  stanza2: string[],
  idx1: number,
  idx2: number
): StanzaSimilarity {
  const textSimilarity = calculateStanzaTextSimilarity(stanza1, stanza2);
  const meterSimilarity = calculateMeterSimilarity(stanza1, stanza2);

  // Overall similarity is weighted average
  const overallSimilarity = textSimilarity * 0.7 + meterSimilarity * 0.3;

  // Check line count match
  const lineCountMatch = stanza1.length === stanza2.length;

  // Check foot type match
  const foot1 = getStanzaFootType(
    stanza1.map((line) => getLineStressPattern(tokenizeWords(line)))
  );
  const foot2 = getStanzaFootType(
    stanza2.map((line) => getLineStressPattern(tokenizeWords(line)))
  );
  const footTypeMatch = foot1 === foot2 && foot1 !== 'unknown';

  return {
    stanza1: idx1,
    stanza2: idx2,
    overallSimilarity,
    textSimilarity,
    meterSimilarity,
    lineCountMatch,
    footTypeMatch,
  };
}

/**
 * Builds a similarity matrix for all stanza pairs
 *
 * @param stanzas - Array of stanzas (each stanza is array of lines)
 * @returns Array of similarity results for all pairs
 */
export function buildSimilarityMatrix(stanzas: string[][]): StanzaSimilarity[] {
  log('buildSimilarityMatrix: analyzing', stanzas.length, 'stanzas');

  const similarities: StanzaSimilarity[] = [];

  for (let i = 0; i < stanzas.length; i++) {
    for (let j = i + 1; j < stanzas.length; j++) {
      const sim = compareStanzas(stanzas[i], stanzas[j], i, j);
      similarities.push(sim);

      log(
        `buildSimilarityMatrix: stanza ${i} vs ${j} = ${sim.overallSimilarity.toFixed(3)}`
      );
    }
  }

  return similarities;
}

// =============================================================================
// Refrain Detection
// =============================================================================

/**
 * Detects repeated lines (refrains) across stanzas
 *
 * @param stanzas - Array of stanzas
 * @returns Array of detected refrains
 */
export function detectRefrains(stanzas: string[][]): Refrain[] {
  log('detectRefrains: searching for repeated lines');

  // Build a map of normalized lines to their occurrences
  const lineOccurrences = new Map<
    string,
    { original: string; occurrences: [number, number][] }
  >();

  for (let stanzaIdx = 0; stanzaIdx < stanzas.length; stanzaIdx++) {
    const stanza = stanzas[stanzaIdx];
    for (let lineIdx = 0; lineIdx < stanza.length; lineIdx++) {
      const line = stanza[lineIdx];
      const normalized = normalizeTextForComparison(line);

      // Skip very short lines
      if (normalized.length < 3) {
        continue;
      }

      const existing = lineOccurrences.get(normalized);
      if (existing) {
        existing.occurrences.push([stanzaIdx, lineIdx]);
      } else {
        lineOccurrences.set(normalized, {
          original: line,
          occurrences: [[stanzaIdx, lineIdx]],
        });
      }
    }
  }

  // Find lines that appear multiple times
  const refrains: Refrain[] = [];

  for (const [normalized, data] of lineOccurrences) {
    if (data.occurrences.length >= MIN_REFRAIN_OCCURRENCES) {
      // Check if occurrences span multiple stanzas
      const uniqueStanzas = new Set(data.occurrences.map((o) => o[0]));

      if (uniqueStanzas.size >= MIN_REFRAIN_OCCURRENCES) {
        refrains.push({
          text: data.original,
          occurrences: data.occurrences,
          normalizedText: normalized,
        });

        log(
          `detectRefrains: found refrain "${data.original.substring(0, 30)}..." ` +
            `appearing ${data.occurrences.length} times`
        );
      }
    }
  }

  // Also detect near-matches (slight variations of the same line)
  const processedNormalized = new Set<string>();

  for (let stanzaIdx = 0; stanzaIdx < stanzas.length; stanzaIdx++) {
    const stanza = stanzas[stanzaIdx];
    for (let lineIdx = 0; lineIdx < stanza.length; lineIdx++) {
      const line = stanza[lineIdx];
      const normalized = normalizeTextForComparison(line);

      if (processedNormalized.has(normalized) || normalized.length < 3) {
        continue;
      }

      // Find similar lines across the poem
      const similarOccurrences: [number, number][] = [[stanzaIdx, lineIdx]];

      for (let si = 0; si < stanzas.length; si++) {
        for (let li = 0; li < stanzas[si].length; li++) {
          if (si === stanzaIdx && li === lineIdx) continue;

          const otherLine = stanzas[si][li];
          const otherNormalized = normalizeTextForComparison(otherLine);

          // Check if normalized versions are already matched
          if (otherNormalized === normalized) continue;

          // Check for high similarity
          const sim = calculateLineSimilarity(line, otherLine);
          if (sim >= REFRAIN_SIMILARITY_THRESHOLD) {
            similarOccurrences.push([si, li]);
          }
        }
      }

      // If we found near-matches that span multiple stanzas
      if (similarOccurrences.length >= MIN_REFRAIN_OCCURRENCES) {
        const uniqueStanzas = new Set(similarOccurrences.map((o) => o[0]));
        if (
          uniqueStanzas.size >= MIN_REFRAIN_OCCURRENCES &&
          !refrains.some((r) => r.normalizedText === normalized)
        ) {
          refrains.push({
            text: line,
            occurrences: similarOccurrences,
            normalizedText: normalized,
          });

          log(
            `detectRefrains: found near-match refrain "${line.substring(0, 30)}..."`
          );
        }
      }

      processedNormalized.add(normalized);
    }
  }

  return refrains;
}

// =============================================================================
// Section Classification
// =============================================================================

/**
 * Classifies stanzas into sections (verse, chorus, bridge)
 *
 * @param stanzas - Array of stanzas
 * @param similarities - Pre-computed similarity matrix
 * @param refrains - Detected refrains
 * @returns Array of sections
 */
export function classifySections(
  stanzas: string[][],
  similarities: StanzaSimilarity[],
  refrains: Refrain[]
): Section[] {
  log('classifySections: classifying', stanzas.length, 'stanzas');

  if (stanzas.length === 0) {
    return [];
  }

  // Initialize sections - each stanza starts as a potential verse
  const sections: Section[] = [];
  const stanzaAssigned = new Array(stanzas.length).fill(false);

  // Step 1: Find chorus candidates (highly similar stanzas)
  const chorusGroups = findChorusGroups(stanzas, similarities);

  for (const group of chorusGroups) {
    const firstIdx = Math.min(...group.indices);
    sections.push({
      type: 'chorus',
      stanzaIndices: group.indices,
      label: 'Chorus',
      confidence: group.avgSimilarity,
      repeatOf: group.indices[0] !== firstIdx ? firstIdx : undefined,
    });

    for (const idx of group.indices) {
      stanzaAssigned[idx] = true;
    }

    log(
      `classifySections: found chorus at stanzas [${group.indices.join(', ')}] ` +
        `with confidence ${group.avgSimilarity.toFixed(3)}`
    );
  }

  // Step 2: Check for refrain-heavy stanzas (might be choruses)
  for (let i = 0; i < stanzas.length; i++) {
    if (stanzaAssigned[i]) continue;

    const stanza = stanzas[i];
    const refrainLines = countRefrainLines(i, stanza, refrains);
    const refrainRatio = refrainLines / stanza.length;

    // If more than half the stanza is refrains, it might be a chorus
    if (refrainRatio > 0.5 && stanza.length >= 2) {
      sections.push({
        type: 'chorus',
        stanzaIndices: [i],
        label: 'Chorus',
        confidence: refrainRatio,
      });
      stanzaAssigned[i] = true;

      log(
        `classifySections: stanza ${i} classified as chorus (refrain ratio: ${refrainRatio.toFixed(3)})`
      );
    }
  }

  // Step 3: Identify bridges (stanzas that differ significantly from others)
  for (let i = 0; i < stanzas.length; i++) {
    if (stanzaAssigned[i]) continue;

    const avgSimilarity = calculateAverageSimilarity(i, similarities);

    // If this stanza is very different from others, it might be a bridge
    if (avgSimilarity < 0.4 && stanzas.length > 2) {
      // Also check if it's positioned after the middle of the song
      const position = i / stanzas.length;
      if (position > 0.4 && position < 0.8) {
        sections.push({
          type: 'bridge',
          stanzaIndices: [i],
          label: 'Bridge',
          confidence: 1 - avgSimilarity,
        });
        stanzaAssigned[i] = true;

        log(
          `classifySections: stanza ${i} classified as bridge ` +
            `(avgSimilarity: ${avgSimilarity.toFixed(3)}, position: ${position.toFixed(2)})`
        );
      }
    }
  }

  // Step 4: Classify remaining stanzas as verses
  let verseNumber = 1;
  const verseGroups = findVerseGroups(stanzas, similarities, stanzaAssigned);

  for (const group of verseGroups) {
    for (const idx of group.indices) {
      if (!stanzaAssigned[idx]) {
        sections.push({
          type: 'verse',
          stanzaIndices: [idx],
          label: `Verse ${verseNumber}`,
          confidence: group.avgSimilarity > 0 ? group.avgSimilarity : 0.5,
        });
        stanzaAssigned[idx] = true;
        verseNumber++;
      }
    }
  }

  // Step 5: Assign any remaining unassigned stanzas as verses
  for (let i = 0; i < stanzas.length; i++) {
    if (!stanzaAssigned[i]) {
      sections.push({
        type: 'verse',
        stanzaIndices: [i],
        label: `Verse ${verseNumber}`,
        confidence: 0.5,
      });
      verseNumber++;
    }
  }

  // Sort sections by first stanza index
  sections.sort((a, b) => a.stanzaIndices[0] - b.stanzaIndices[0]);

  // Relabel verses sequentially
  let currentVerseNum = 1;
  for (const section of sections) {
    if (section.type === 'verse') {
      section.label = `Verse ${currentVerseNum}`;
      currentVerseNum++;
    }
  }

  return sections;
}

/**
 * Finds groups of highly similar stanzas that could be choruses
 */
function findChorusGroups(
  _stanzas: string[][],
  similarities: StanzaSimilarity[]
): { indices: number[]; avgSimilarity: number }[] {
  const groups: { indices: Set<number>; avgSimilarity: number }[] = [];

  // Find pairs with high similarity
  for (const sim of similarities) {
    if (sim.overallSimilarity >= CHORUS_SIMILARITY_THRESHOLD) {
      // Check if either stanza is already in a group
      let foundGroup = false;

      for (const group of groups) {
        if (group.indices.has(sim.stanza1) || group.indices.has(sim.stanza2)) {
          group.indices.add(sim.stanza1);
          group.indices.add(sim.stanza2);
          group.avgSimilarity = (group.avgSimilarity + sim.overallSimilarity) / 2;
          foundGroup = true;
          break;
        }
      }

      if (!foundGroup) {
        groups.push({
          indices: new Set([sim.stanza1, sim.stanza2]),
          avgSimilarity: sim.overallSimilarity,
        });
      }
    }
  }

  // Convert to arrays and filter out single-stanza groups
  return groups
    .filter((g) => g.indices.size >= 2)
    .map((g) => ({
      indices: Array.from(g.indices).sort((a, b) => a - b),
      avgSimilarity: g.avgSimilarity,
    }));
}

/**
 * Groups remaining stanzas into verse groups based on similarity
 */
function findVerseGroups(
  stanzas: string[][],
  similarities: StanzaSimilarity[],
  assigned: boolean[]
): { indices: number[]; avgSimilarity: number }[] {
  const unassigned = stanzas
    .map((_, i) => i)
    .filter((i) => !assigned[i]);

  if (unassigned.length === 0) {
    return [];
  }

  // Simple grouping: each unassigned stanza is its own verse
  // But check if any are similar enough to be related verses
  const groups: { indices: number[]; avgSimilarity: number }[] = [];

  for (const idx of unassigned) {
    // Check similarity with other unassigned stanzas
    let maxSim = 0;
    for (const sim of similarities) {
      if (
        (sim.stanza1 === idx || sim.stanza2 === idx) &&
        !assigned[sim.stanza1] &&
        !assigned[sim.stanza2]
      ) {
        maxSim = Math.max(maxSim, sim.overallSimilarity);
      }
    }

    groups.push({
      indices: [idx],
      avgSimilarity: maxSim,
    });
  }

  return groups;
}

/**
 * Counts how many lines in a stanza are refrains
 */
function countRefrainLines(
  stanzaIdx: number,
  stanza: string[],
  refrains: Refrain[]
): number {
  let count = 0;

  for (let lineIdx = 0; lineIdx < stanza.length; lineIdx++) {
    for (const refrain of refrains) {
      if (refrain.occurrences.some((o) => o[0] === stanzaIdx && o[1] === lineIdx)) {
        count++;
        break;
      }
    }
  }

  return count;
}

/**
 * Calculates average similarity of a stanza to all other stanzas
 */
function calculateAverageSimilarity(
  stanzaIdx: number,
  similarities: StanzaSimilarity[]
): number {
  const relevant = similarities.filter(
    (s) => s.stanza1 === stanzaIdx || s.stanza2 === stanzaIdx
  );

  if (relevant.length === 0) {
    return 0.5;
  }

  const total = relevant.reduce((sum, s) => sum + s.overallSimilarity, 0);
  return total / relevant.length;
}

// =============================================================================
// Structure Pattern Generation
// =============================================================================

/**
 * Generates a structure pattern string (e.g., "AABA", "ABAB")
 *
 * @param sections - Classified sections
 * @param numStanzas - Total number of stanzas
 * @returns Structure pattern string
 */
export function generateStructurePattern(
  sections: Section[],
  numStanzas: number
): string {
  if (numStanzas === 0 || sections.length === 0) {
    return '';
  }

  // Create a mapping from stanza index to section type
  const stanzaToSection = new Map<number, Section>();
  for (const section of sections) {
    for (const idx of section.stanzaIndices) {
      stanzaToSection.set(idx, section);
    }
  }

  // Track unique section patterns
  const sectionPatterns = new Map<string, string>();
  let nextLetter = 'A';

  const pattern: string[] = [];

  for (let i = 0; i < numStanzas; i++) {
    const section = stanzaToSection.get(i);
    if (!section) {
      pattern.push('?');
      continue;
    }

    // Generate a key for this section based on type and content
    let key: string;
    if (section.type === 'chorus') {
      // All choruses share the same letter (typically first chorus letter)
      key = `chorus-${section.stanzaIndices[0]}`;
    } else if (section.type === 'bridge') {
      key = `bridge-${i}`;
    } else {
      // Verses are typically unique
      key = `verse-${i}`;
    }

    // Check if we've seen this pattern before
    if (sectionPatterns.has(key)) {
      pattern.push(sectionPatterns.get(key)!);
    } else {
      // For choruses, check if any chorus already has a letter
      if (section.type === 'chorus') {
        const existingChorusLetter = Array.from(sectionPatterns.entries())
          .find(([k]) => k.startsWith('chorus-'))
          ?.[1];

        if (existingChorusLetter) {
          sectionPatterns.set(key, existingChorusLetter);
          pattern.push(existingChorusLetter);
        } else {
          sectionPatterns.set(key, nextLetter);
          pattern.push(nextLetter);
          nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1);
        }
      } else {
        sectionPatterns.set(key, nextLetter);
        pattern.push(nextLetter);
        nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1);
      }
    }
  }

  return pattern.join('');
}

// =============================================================================
// Main Analysis Function
// =============================================================================

/**
 * Performs complete structure analysis on a poem
 *
 * @param stanzas - Array of stanzas (each stanza is array of lines)
 * @returns Complete structure analysis
 *
 * @example
 * const stanzas = [
 *   ['Roses are red', 'Violets are blue'],
 *   ['Sugar is sweet', 'And so are you'],
 *   ['Roses are red', 'Violets are blue'],
 * ];
 * const analysis = analyzeStructure(stanzas);
 * // analysis.hasVerseChorusStructure will be true
 */
export function analyzeStructure(stanzas: string[][]): StructureAnalysis {
  log('analyzeStructure: analyzing', stanzas.length, 'stanzas');

  if (!stanzas || stanzas.length === 0) {
    return {
      sections: [],
      refrains: [],
      similarities: [],
      hasVerseChorusStructure: false,
      structurePattern: '',
      summary: 'No stanzas to analyze',
    };
  }

  // Single stanza poems are just verses
  if (stanzas.length === 1) {
    return {
      sections: [
        {
          type: 'verse',
          stanzaIndices: [0],
          label: 'Verse 1',
          confidence: 1.0,
        },
      ],
      refrains: [],
      similarities: [],
      hasVerseChorusStructure: false,
      structurePattern: 'A',
      summary: 'Single stanza poem',
    };
  }

  // Build similarity matrix
  const similarities = buildSimilarityMatrix(stanzas);

  // Detect refrains
  const refrains = detectRefrains(stanzas);

  // Classify sections
  const sections = classifySections(stanzas, similarities, refrains);

  // Generate structure pattern
  const structurePattern = generateStructurePattern(sections, stanzas.length);

  // Determine if there's a verse/chorus structure
  const hasChorus = sections.some((s) => s.type === 'chorus');
  const hasVerses = sections.some((s) => s.type === 'verse');
  const hasVerseChorusStructure = hasChorus && hasVerses;

  // Generate summary
  const summary = generateSummary(sections, refrains, hasVerseChorusStructure);

  log('analyzeStructure: complete, pattern:', structurePattern);

  return {
    sections,
    refrains,
    similarities,
    hasVerseChorusStructure,
    structurePattern,
    summary,
  };
}

/**
 * Generates a human-readable summary of the structure
 */
function generateSummary(
  sections: Section[],
  refrains: Refrain[],
  hasVerseChorusStructure: boolean
): string {
  const counts = {
    verse: 0,
    chorus: 0,
    bridge: 0,
    refrain: 0,
    intro: 0,
    outro: 0,
  };

  for (const section of sections) {
    counts[section.type]++;
  }

  const parts: string[] = [];

  if (hasVerseChorusStructure) {
    parts.push('Verse/chorus structure detected');
  } else if (counts.verse > 0) {
    parts.push('Verse-based structure');
  }

  if (counts.verse > 0) {
    parts.push(`${counts.verse} verse${counts.verse > 1 ? 's' : ''}`);
  }
  if (counts.chorus > 0) {
    parts.push(`${counts.chorus} chorus section${counts.chorus > 1 ? 's' : ''}`);
  }
  if (counts.bridge > 0) {
    parts.push(`${counts.bridge} bridge`);
  }
  if (refrains.length > 0) {
    parts.push(`${refrains.length} refrain line${refrains.length > 1 ? 's' : ''}`);
  }

  return parts.join(', ') || 'No clear structure detected';
}

// =============================================================================
// Integration Helpers
// =============================================================================

/**
 * Analyzes structure from analyzed stanzas (from orchestrator)
 *
 * @param analyzedStanzas - Analyzed stanzas from poem analysis
 * @returns Structure analysis
 */
export function analyzeStructureFromAnalyzed(
  analyzedStanzas: AnalyzedStanza[]
): StructureAnalysis {
  // Convert analyzed stanzas to string arrays
  const stanzas = analyzedStanzas.map((stanza) =>
    stanza.lines.map((line) => line.text)
  );

  return analyzeStructure(stanzas);
}

/**
 * Gets section type for a specific stanza index
 *
 * @param analysis - Structure analysis
 * @param stanzaIndex - Stanza index to look up
 * @returns Section type or 'verse' as default
 */
export function getSectionForStanza(
  analysis: StructureAnalysis,
  stanzaIndex: number
): SectionType {
  for (const section of analysis.sections) {
    if (section.stanzaIndices.includes(stanzaIndex)) {
      return section.type;
    }
  }
  return 'verse';
}

/**
 * Gets section info for a specific stanza index
 *
 * @param analysis - Structure analysis
 * @param stanzaIndex - Stanza index to look up
 * @returns Section info or null if not found
 */
export function getSectionInfoForStanza(
  analysis: StructureAnalysis,
  stanzaIndex: number
): Section | null {
  for (const section of analysis.sections) {
    if (section.stanzaIndices.includes(stanzaIndex)) {
      return section;
    }
  }
  return null;
}

/**
 * Checks if a stanza is a repeat of a previous section
 *
 * @param analysis - Structure analysis
 * @param stanzaIndex - Stanza index to check
 * @returns True if this stanza is a repeat
 */
export function isRepeatSection(
  analysis: StructureAnalysis,
  stanzaIndex: number
): boolean {
  const section = getSectionInfoForStanza(analysis, stanzaIndex);
  if (!section) return false;

  // Check if this stanza is not the first in its group
  return section.stanzaIndices[0] !== stanzaIndex;
}
