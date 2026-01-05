/**
 * Section-Aware Melody Generation
 *
 * This module integrates structure analysis with melody generation
 * to create section-appropriate melodic variations:
 * - Verses: Similar melodic contours with slight variations
 * - Choruses: Identical or highly similar melodies for recognition
 * - Bridges: Contrasting melodic material
 *
 * @module lib/melody/sectionMelody
 */

import type { StructureAnalysis, SectionType, Section } from '@/types/analysis';
import type { Melody } from './types';
import { generateVariation, type VariationType, type VariationOptions } from './variations';

// =============================================================================
// Debug Logging
// =============================================================================

const DEBUG = process.env.NODE_ENV === 'development';
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[sectionMelody] ${message}`, ...args);
  }
};

// =============================================================================
// Types
// =============================================================================

/**
 * Melody segment for a specific section
 */
export interface SectionMelody {
  /** The section this melody belongs to */
  section: Section;
  /** The melody for this section */
  melody: Melody;
  /** Whether this is a repeat of a previous section's melody */
  isRepeat: boolean;
  /** Index of the original melody if this is a repeat */
  originalIndex?: number;
}

/**
 * Configuration for section-aware melody generation
 */
export interface SectionMelodyConfig {
  /** How much variation to apply to repeated verses (0-1, default: 0.3) */
  verseVariation: number;
  /** How much variation to apply to chorus repeats (0-1, default: 0.1) */
  chorusVariation: number;
  /** Whether bridges should use contrasting contours (default: true) */
  contrastingBridges: boolean;
  /** Seed for reproducible randomness */
  seed?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: SectionMelodyConfig = {
  verseVariation: 0.3,
  chorusVariation: 0.1,
  contrastingBridges: true,
  seed: undefined,
};

// =============================================================================
// Section Melody Generation
// =============================================================================

/**
 * Determines the appropriate variation type for a section based on context
 *
 * @param sectionType - The type of section
 * @param isRepeat - Whether this is a repeat of a previous section
 * @param config - Configuration options
 * @returns The variation type to apply, or null for no variation
 */
export function getVariationForSection(
  sectionType: SectionType,
  isRepeat: boolean,
  config: SectionMelodyConfig = DEFAULT_CONFIG
): VariationType | null {
  log(`getVariationForSection: type=${sectionType}, isRepeat=${isRepeat}`);

  if (!isRepeat) {
    // First occurrence - no variation needed
    return null;
  }

  switch (sectionType) {
    case 'chorus':
      // Choruses should be nearly identical
      // Only apply subtle ornamentation if variation is desired
      return config.chorusVariation > 0 ? 'ornament' : null;

    case 'verse':
      // Verses can have more variation
      // Alternate between simplify and ornament for variety
      return config.verseVariation > 0.5 ? 'ornament' : 'simplify';

    case 'bridge':
      // Bridges are usually unique, but if repeated, use inversion for contrast
      return config.contrastingBridges ? 'invert' : null;

    case 'refrain':
      // Refrains should be consistent
      return null;

    case 'intro':
    case 'outro':
      // Usually unique sections
      return null;

    default:
      return null;
  }
}

/**
 * Gets variation options appropriate for a section type
 *
 * @param sectionType - The type of section
 * @param config - Configuration options
 * @returns Variation options
 */
export function getVariationOptionsForSection(
  sectionType: SectionType,
  config: SectionMelodyConfig = DEFAULT_CONFIG
): VariationOptions {
  log(`getVariationOptionsForSection: type=${sectionType}`);

  const baseOptions: VariationOptions = {
    seed: config.seed,
  };

  switch (sectionType) {
    case 'chorus':
      // Very subtle ornamentation for choruses
      return {
        ...baseOptions,
        ornamentProbability: config.chorusVariation * 0.2, // Very low
      };

    case 'verse':
      // Moderate ornamentation for verses
      return {
        ...baseOptions,
        ornamentProbability: config.verseVariation * 0.5,
      };

    case 'bridge':
      // Bridges might use different transformations
      return {
        ...baseOptions,
        ornamentProbability: 0.4,
      };

    default:
      return baseOptions;
  }
}

/**
 * Applies section-appropriate variation to a melody
 *
 * @param melody - The base melody to vary
 * @param sectionType - The type of section
 * @param isRepeat - Whether this is a repeat section
 * @param config - Configuration options
 * @returns Varied melody
 */
export function applySectionVariation(
  melody: Melody,
  sectionType: SectionType,
  isRepeat: boolean,
  config: SectionMelodyConfig = DEFAULT_CONFIG
): Melody {
  log(`applySectionVariation: type=${sectionType}, isRepeat=${isRepeat}`);

  const variationType = getVariationForSection(sectionType, isRepeat, config);

  if (!variationType) {
    log('applySectionVariation: no variation needed, returning copy');
    return cloneMelody(melody);
  }

  const options = getVariationOptionsForSection(sectionType, config);

  log(`applySectionVariation: applying ${variationType} variation`);
  return generateVariation(melody, variationType, options);
}

// =============================================================================
// Section-Based Melody Planning
// =============================================================================

/**
 * Creates a melody plan based on structure analysis
 *
 * This function determines how melodies should be generated for each stanza
 * based on the detected song structure. It identifies:
 * - Which stanzas should share melodies (e.g., all choruses)
 * - Which stanzas need new melodies (verses, bridges)
 * - What variations to apply to repeating sections
 *
 * @param structureAnalysis - The structure analysis result
 * @returns Array of melody assignments for each stanza
 */
export function createMelodyPlan(
  structureAnalysis: StructureAnalysis
): Array<{
  stanzaIndex: number;
  sectionType: SectionType;
  melodySource: 'new' | 'copy' | 'vary';
  sourceStanzaIndex?: number;
  variationType?: VariationType;
}> {
  log('createMelodyPlan: creating plan for', structureAnalysis.sections.length, 'sections');

  const plan: Array<{
    stanzaIndex: number;
    sectionType: SectionType;
    melodySource: 'new' | 'copy' | 'vary';
    sourceStanzaIndex?: number;
    variationType?: VariationType;
  }> = [];

  // Track which stanza indices we've assigned
  const stanzaAssignments = new Map<number, typeof plan[0]>();

  // Process each section
  for (const section of structureAnalysis.sections) {
    const firstStanzaIdx = Math.min(...section.stanzaIndices);

    for (const stanzaIdx of section.stanzaIndices) {
      const isFirst = stanzaIdx === firstStanzaIdx;
      const sectionType = section.type;

      if (isFirst) {
        // First occurrence - needs new melody
        const assignment = {
          stanzaIndex: stanzaIdx,
          sectionType,
          melodySource: 'new' as const,
        };
        plan.push(assignment);
        stanzaAssignments.set(stanzaIdx, assignment);
      } else {
        // Repeat - determine how to handle
        if (sectionType === 'chorus') {
          // Choruses should be nearly identical (copy with maybe slight variation)
          const assignment = {
            stanzaIndex: stanzaIdx,
            sectionType,
            melodySource: 'copy' as const,
            sourceStanzaIndex: firstStanzaIdx,
          };
          plan.push(assignment);
          stanzaAssignments.set(stanzaIdx, assignment);
        } else if (sectionType === 'verse') {
          // Verses can vary more
          const assignment = {
            stanzaIndex: stanzaIdx,
            sectionType,
            melodySource: 'vary' as const,
            sourceStanzaIndex: firstStanzaIdx,
            variationType: 'ornament' as VariationType,
          };
          plan.push(assignment);
          stanzaAssignments.set(stanzaIdx, assignment);
        } else {
          // Other types - copy by default
          const assignment = {
            stanzaIndex: stanzaIdx,
            sectionType,
            melodySource: 'copy' as const,
            sourceStanzaIndex: firstStanzaIdx,
          };
          plan.push(assignment);
          stanzaAssignments.set(stanzaIdx, assignment);
        }
      }
    }
  }

  // Sort by stanza index
  plan.sort((a, b) => a.stanzaIndex - b.stanzaIndex);

  log('createMelodyPlan: created plan with', plan.length, 'assignments');
  return plan;
}

// =============================================================================
// Contour Suggestions
// =============================================================================

/**
 * Contour shape suggestion for a section type
 */
export type ContourSuggestion = 'arch' | 'descending' | 'ascending' | 'wave';

/**
 * Gets a suggested melodic contour for a section type
 *
 * Different section types benefit from different melodic shapes:
 * - Verses: Often arch-shaped (rise and fall)
 * - Choruses: Wave patterns (catchy, memorable)
 * - Bridges: Ascending or contrasting shapes
 *
 * @param sectionType - The type of section
 * @param position - Position within the song (0-1)
 * @returns Suggested contour shape
 */
export function getSuggestedContour(
  sectionType: SectionType,
  position: number
): ContourSuggestion {
  log(`getSuggestedContour: type=${sectionType}, position=${position.toFixed(2)}`);

  switch (sectionType) {
    case 'verse':
      // Verses typically have arch contours
      // Later verses might descend more for resolution
      return position > 0.7 ? 'descending' : 'arch';

    case 'chorus':
      // Choruses benefit from memorable wave patterns
      return 'wave';

    case 'bridge':
      // Bridges provide contrast - often ascending to build tension
      return 'ascending';

    case 'refrain':
      // Refrains are hook-like, wave patterns work well
      return 'wave';

    case 'intro':
      // Intros often ascend to build into the song
      return 'ascending';

    case 'outro':
      // Outros descend to resolution
      return 'descending';

    default:
      return 'arch';
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Deep clones a melody object
 */
function cloneMelody(melody: Melody): Melody {
  return {
    params: { ...melody.params },
    measures: melody.measures.map((measure) =>
      measure.map((note) => ({ ...note }))
    ),
    lyrics: melody.lyrics.map((measureLyrics) => [...measureLyrics]),
  };
}

/**
 * Checks if a section is a repeating type (tends to have same melody)
 *
 * @param sectionType - The section type
 * @returns True if this section type typically repeats with same melody
 */
export function isRepeatingSectionType(sectionType: SectionType): boolean {
  return sectionType === 'chorus' || sectionType === 'refrain';
}

/**
 * Checks if a section benefits from melodic variation on repeat
 *
 * @param sectionType - The section type
 * @returns True if this section type benefits from variation
 */
export function shouldVaryOnRepeat(sectionType: SectionType): boolean {
  return sectionType === 'verse';
}

/**
 * Gets the melodic intensity suggestion for a section
 * Higher intensity means wider intervals, more ornaments
 *
 * @param sectionType - The section type
 * @returns Intensity value 0-1
 */
export function getSectionIntensity(sectionType: SectionType): number {
  switch (sectionType) {
    case 'intro':
      return 0.4;
    case 'verse':
      return 0.5;
    case 'chorus':
      return 0.8;
    case 'bridge':
      return 0.7;
    case 'refrain':
      return 0.6;
    case 'outro':
      return 0.3;
    default:
      return 0.5;
  }
}

/**
 * Gets section label for display
 *
 * @param structureAnalysis - The structure analysis
 * @param stanzaIndex - The stanza index
 * @returns Section label or null if not found
 */
export function getSectionLabel(
  structureAnalysis: StructureAnalysis,
  stanzaIndex: number
): string | null {
  for (const section of structureAnalysis.sections) {
    if (section.stanzaIndices.includes(stanzaIndex)) {
      return section.label;
    }
  }
  return null;
}
