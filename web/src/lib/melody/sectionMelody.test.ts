/**
 * Section Melody Module Tests
 *
 * Tests for section-aware melody generation functionality.
 *
 * @module lib/melody/sectionMelody.test
 */

import { describe, it, expect } from 'vitest';
import {
  getVariationForSection,
  getVariationOptionsForSection,
  applySectionVariation,
  createMelodyPlan,
  getSuggestedContour,
  isRepeatingSectionType,
  shouldVaryOnRepeat,
  getSectionIntensity,
  getSectionLabel,
  type SectionMelodyConfig,
} from './sectionMelody';
import type { StructureAnalysis } from '@/types/analysis';
import type { Melody } from './types';

// =============================================================================
// Test Fixtures
// =============================================================================

/**
 * Creates a simple test melody
 */
function createTestMelody(): Melody {
  return {
    params: {
      title: 'Test Melody',
      timeSignature: '4/4',
      defaultNoteLength: '1/8',
      tempo: 100,
      key: 'C',
    },
    measures: [
      [
        { pitch: 'C', octave: 0, duration: 2 },
        { pitch: 'D', octave: 0, duration: 2 },
        { pitch: 'E', octave: 0, duration: 2 },
        { pitch: 'F', octave: 0, duration: 2 },
      ],
      [
        { pitch: 'G', octave: 0, duration: 2 },
        { pitch: 'A', octave: 0, duration: 2 },
        { pitch: 'B', octave: 0, duration: 2 },
        { pitch: 'C', octave: 1, duration: 2 },
      ],
    ],
    lyrics: [['do', 're', 'mi', 'fa'], ['sol', 'la', 'ti', 'do']],
  };
}

/**
 * Creates a test structure analysis
 */
function createTestStructureAnalysis(): StructureAnalysis {
  return {
    sections: [
      { type: 'verse', stanzaIndices: [0], label: 'Verse 1', confidence: 0.9 },
      { type: 'chorus', stanzaIndices: [1, 3], label: 'Chorus', confidence: 0.95 },
      { type: 'verse', stanzaIndices: [2], label: 'Verse 2', confidence: 0.9 },
      { type: 'bridge', stanzaIndices: [4], label: 'Bridge', confidence: 0.8 },
    ],
    refrains: [],
    similarities: [],
    hasVerseChorusStructure: true,
    structurePattern: 'ABAB C',
    summary: 'Verse/chorus structure detected',
  };
}

// =============================================================================
// Variation Selection Tests
// =============================================================================

describe('getVariationForSection', () => {
  const defaultConfig: SectionMelodyConfig = {
    verseVariation: 0.3,
    chorusVariation: 0.1,
    contrastingBridges: true,
  };

  it('should return null for first occurrence', () => {
    expect(getVariationForSection('verse', false, defaultConfig)).toBeNull();
    expect(getVariationForSection('chorus', false, defaultConfig)).toBeNull();
    expect(getVariationForSection('bridge', false, defaultConfig)).toBeNull();
  });

  it('should return ornament for chorus repeats with variation enabled', () => {
    expect(getVariationForSection('chorus', true, defaultConfig)).toBe('ornament');
  });

  it('should return null for chorus repeats with variation disabled', () => {
    const noVariationConfig = { ...defaultConfig, chorusVariation: 0 };
    expect(getVariationForSection('chorus', true, noVariationConfig)).toBeNull();
  });

  it('should return simplify for verse repeats with low variation', () => {
    const lowVariationConfig = { ...defaultConfig, verseVariation: 0.3 };
    expect(getVariationForSection('verse', true, lowVariationConfig)).toBe('simplify');
  });

  it('should return ornament for verse repeats with high variation', () => {
    const highVariationConfig = { ...defaultConfig, verseVariation: 0.6 };
    expect(getVariationForSection('verse', true, highVariationConfig)).toBe('ornament');
  });

  it('should return invert for bridge repeats with contrasting enabled', () => {
    expect(getVariationForSection('bridge', true, defaultConfig)).toBe('invert');
  });

  it('should return null for bridge repeats with contrasting disabled', () => {
    const noContrastConfig = { ...defaultConfig, contrastingBridges: false };
    expect(getVariationForSection('bridge', true, noContrastConfig)).toBeNull();
  });

  it('should return null for refrain repeats', () => {
    expect(getVariationForSection('refrain', true, defaultConfig)).toBeNull();
  });

  it('should return null for intro and outro', () => {
    expect(getVariationForSection('intro', true, defaultConfig)).toBeNull();
    expect(getVariationForSection('outro', true, defaultConfig)).toBeNull();
  });
});

describe('getVariationOptionsForSection', () => {
  const defaultConfig: SectionMelodyConfig = {
    verseVariation: 0.3,
    chorusVariation: 0.1,
    contrastingBridges: true,
    seed: 12345,
  };

  it('should include seed in options', () => {
    const options = getVariationOptionsForSection('verse', defaultConfig);
    expect(options.seed).toBe(12345);
  });

  it('should set low ornament probability for chorus', () => {
    const options = getVariationOptionsForSection('chorus', defaultConfig);
    expect(options.ornamentProbability).toBeLessThan(0.1);
  });

  it('should set moderate ornament probability for verse', () => {
    const options = getVariationOptionsForSection('verse', defaultConfig);
    expect(options.ornamentProbability).toBeGreaterThan(0.1);
    expect(options.ornamentProbability).toBeLessThan(0.5);
  });

  it('should set higher ornament probability for bridge', () => {
    const options = getVariationOptionsForSection('bridge', defaultConfig);
    expect(options.ornamentProbability).toBe(0.4);
  });
});

// =============================================================================
// Section Variation Application Tests
// =============================================================================

describe('applySectionVariation', () => {
  it('should return melody copy for first occurrence', () => {
    const melody = createTestMelody();
    const result = applySectionVariation(melody, 'verse', false);

    // Should be a copy, not the same object
    expect(result).not.toBe(melody);
    expect(result.params).toEqual(melody.params);
    expect(result.measures.length).toBe(melody.measures.length);
  });

  it('should apply variation for repeat sections', () => {
    const melody = createTestMelody();
    const config: SectionMelodyConfig = {
      verseVariation: 0.6,
      chorusVariation: 0.1,
      contrastingBridges: true,
    };

    const result = applySectionVariation(melody, 'verse', true, config);

    // Result should be different from original (variation applied)
    // The specific changes depend on the variation type
    expect(result).not.toBe(melody);
  });
});

// =============================================================================
// Melody Plan Tests
// =============================================================================

describe('createMelodyPlan', () => {
  it('should create plan for all stanzas', () => {
    const analysis = createTestStructureAnalysis();
    const plan = createMelodyPlan(analysis);

    // Should have 5 entries (indices 0, 1, 2, 3, 4)
    expect(plan.length).toBe(5);
  });

  it('should mark first occurrences as new', () => {
    const analysis = createTestStructureAnalysis();
    const plan = createMelodyPlan(analysis);

    // First verse should be new
    const verse1 = plan.find((p) => p.stanzaIndex === 0);
    expect(verse1?.melodySource).toBe('new');

    // First chorus should be new
    const chorus1 = plan.find((p) => p.stanzaIndex === 1);
    expect(chorus1?.melodySource).toBe('new');
  });

  it('should mark chorus repeats as copy', () => {
    const analysis = createTestStructureAnalysis();
    const plan = createMelodyPlan(analysis);

    // Second chorus occurrence (stanza 3) should be copy
    const chorus2 = plan.find((p) => p.stanzaIndex === 3);
    expect(chorus2?.melodySource).toBe('copy');
    expect(chorus2?.sourceStanzaIndex).toBe(1);
  });

  it('should be sorted by stanza index', () => {
    const analysis = createTestStructureAnalysis();
    const plan = createMelodyPlan(analysis);

    const indices = plan.map((p) => p.stanzaIndex);
    const sorted = [...indices].sort((a, b) => a - b);
    expect(indices).toEqual(sorted);
  });
});

// =============================================================================
// Contour Suggestion Tests
// =============================================================================

describe('getSuggestedContour', () => {
  it('should suggest arch for verse at start', () => {
    expect(getSuggestedContour('verse', 0.2)).toBe('arch');
  });

  it('should suggest descending for verse near end', () => {
    expect(getSuggestedContour('verse', 0.8)).toBe('descending');
  });

  it('should suggest wave for chorus', () => {
    expect(getSuggestedContour('chorus', 0.5)).toBe('wave');
  });

  it('should suggest ascending for bridge', () => {
    expect(getSuggestedContour('bridge', 0.5)).toBe('ascending');
  });

  it('should suggest wave for refrain', () => {
    expect(getSuggestedContour('refrain', 0.5)).toBe('wave');
  });

  it('should suggest ascending for intro', () => {
    expect(getSuggestedContour('intro', 0)).toBe('ascending');
  });

  it('should suggest descending for outro', () => {
    expect(getSuggestedContour('outro', 1)).toBe('descending');
  });
});

// =============================================================================
// Utility Function Tests
// =============================================================================

describe('isRepeatingSectionType', () => {
  it('should return true for chorus', () => {
    expect(isRepeatingSectionType('chorus')).toBe(true);
  });

  it('should return true for refrain', () => {
    expect(isRepeatingSectionType('refrain')).toBe(true);
  });

  it('should return false for verse', () => {
    expect(isRepeatingSectionType('verse')).toBe(false);
  });

  it('should return false for bridge', () => {
    expect(isRepeatingSectionType('bridge')).toBe(false);
  });
});

describe('shouldVaryOnRepeat', () => {
  it('should return true for verse', () => {
    expect(shouldVaryOnRepeat('verse')).toBe(true);
  });

  it('should return false for chorus', () => {
    expect(shouldVaryOnRepeat('chorus')).toBe(false);
  });

  it('should return false for refrain', () => {
    expect(shouldVaryOnRepeat('refrain')).toBe(false);
  });
});

describe('getSectionIntensity', () => {
  it('should return highest intensity for chorus', () => {
    expect(getSectionIntensity('chorus')).toBe(0.8);
  });

  it('should return moderate intensity for verse', () => {
    expect(getSectionIntensity('verse')).toBe(0.5);
  });

  it('should return low intensity for intro', () => {
    expect(getSectionIntensity('intro')).toBe(0.4);
  });

  it('should return lowest intensity for outro', () => {
    expect(getSectionIntensity('outro')).toBe(0.3);
  });

  it('should return medium-high intensity for bridge', () => {
    expect(getSectionIntensity('bridge')).toBe(0.7);
  });
});

describe('getSectionLabel', () => {
  it('should return correct label for stanza in section', () => {
    const analysis = createTestStructureAnalysis();

    expect(getSectionLabel(analysis, 0)).toBe('Verse 1');
    expect(getSectionLabel(analysis, 1)).toBe('Chorus');
    expect(getSectionLabel(analysis, 3)).toBe('Chorus'); // Same chorus
    expect(getSectionLabel(analysis, 4)).toBe('Bridge');
  });

  it('should return null for unknown stanza', () => {
    const analysis = createTestStructureAnalysis();
    expect(getSectionLabel(analysis, 99)).toBeNull();
  });

  it('should handle empty analysis', () => {
    const emptyAnalysis: StructureAnalysis = {
      sections: [],
      refrains: [],
      similarities: [],
      hasVerseChorusStructure: false,
      structurePattern: '',
      summary: '',
    };

    expect(getSectionLabel(emptyAnalysis, 0)).toBeNull();
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Integration', () => {
  it('should create consistent melody plan for typical song structure', () => {
    const analysis: StructureAnalysis = {
      sections: [
        { type: 'intro', stanzaIndices: [0], label: 'Intro', confidence: 0.7 },
        { type: 'verse', stanzaIndices: [1], label: 'Verse 1', confidence: 0.9 },
        { type: 'chorus', stanzaIndices: [2, 4], label: 'Chorus', confidence: 0.95 },
        { type: 'verse', stanzaIndices: [3], label: 'Verse 2', confidence: 0.9 },
        { type: 'bridge', stanzaIndices: [5], label: 'Bridge', confidence: 0.8 },
        { type: 'outro', stanzaIndices: [6], label: 'Outro', confidence: 0.7 },
      ],
      refrains: [],
      similarities: [],
      hasVerseChorusStructure: true,
      structurePattern: 'ABCBD E',
      summary: 'Full song structure',
    };

    const plan = createMelodyPlan(analysis);

    // Check all stanzas are covered
    expect(plan.length).toBe(7);

    // Check specific assignments
    const intro = plan.find((p) => p.stanzaIndex === 0);
    expect(intro?.melodySource).toBe('new');
    expect(intro?.sectionType).toBe('intro');

    const chorus1 = plan.find((p) => p.stanzaIndex === 2);
    expect(chorus1?.melodySource).toBe('new');

    const chorus2 = plan.find((p) => p.stanzaIndex === 4);
    expect(chorus2?.melodySource).toBe('copy');
    expect(chorus2?.sourceStanzaIndex).toBe(2);
  });
});
