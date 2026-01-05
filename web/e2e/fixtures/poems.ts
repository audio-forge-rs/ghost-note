/**
 * Sample Poems for E2E Testing
 *
 * These fixtures provide consistent, well-structured poems for testing
 * the complete Ghost Note workflow from input to recording.
 */

/**
 * Sample poem fixture with expected analysis metadata
 */
export interface PoemFixture {
  /** Unique identifier for the fixture */
  id: string;
  /** Human-readable name */
  name: string;
  /** The actual poem text */
  text: string;
  /** Expected analysis results for validation */
  expectedAnalysis: {
    /** Expected number of lines */
    lineCount: number;
    /** Expected number of stanzas */
    stanzaCount: number;
    /** Expected syllable counts per line (approximate) */
    syllableCounts: number[];
    /** Expected rhyme scheme pattern */
    rhymeScheme?: string;
    /** Expected meter type if detectable */
    meter?: string;
    /** Whether problems are expected */
    hasProblems: boolean;
  };
}

/**
 * Classic iambic pentameter poem - Shakespeare's Sonnet 18
 * Well-structured with consistent meter and rhyme scheme
 */
export const SONNET_18: PoemFixture = {
  id: 'sonnet-18',
  name: 'Shakespeare Sonnet 18 (First Quatrain)',
  text: `Shall I compare thee to a summer's day?
Thou art more lovely and more temperate:
Rough winds do shake the darling buds of May,
And summer's lease hath all too short a date.`,
  expectedAnalysis: {
    lineCount: 4,
    stanzaCount: 1,
    syllableCounts: [10, 10, 10, 10],
    rhymeScheme: 'ABAB',
    meter: 'iambic',
    hasProblems: false,
  },
};

/**
 * Simple nursery rhyme - easy to sing with clear rhyme
 */
export const TWINKLE_TWINKLE: PoemFixture = {
  id: 'twinkle-twinkle',
  name: 'Twinkle Twinkle Little Star',
  text: `Twinkle, twinkle, little star,
How I wonder what you are!
Up above the world so high,
Like a diamond in the sky.`,
  expectedAnalysis: {
    lineCount: 4,
    stanzaCount: 1,
    syllableCounts: [7, 7, 7, 7],
    rhymeScheme: 'AABB',
    meter: 'trochaic',
    hasProblems: false,
  },
};

/**
 * Multi-stanza poem - Emily Dickinson style with dashes
 * Tests stanza detection and handling of punctuation
 */
export const HOPE_IS_THE_THING: PoemFixture = {
  id: 'hope-is-the-thing',
  name: 'Hope is the Thing with Feathers (First Two Stanzas)',
  text: `"Hope" is the thing with feathers -
That perches in the soul -
And sings the tune without the words -
And never stops - at all -

And sweetest - in the Gale - is heard -
And sore must be the storm -
That could abash the little Bird
That kept so many warm -`,
  expectedAnalysis: {
    lineCount: 8,
    stanzaCount: 2,
    syllableCounts: [7, 6, 8, 6, 8, 6, 8, 6],
    rhymeScheme: 'ABCB',
    meter: 'common',
    hasProblems: false,
  },
};

/**
 * Free verse poem - irregular meter, no rhyme
 * Tests handling of non-traditional structure
 */
export const FREE_VERSE_SAMPLE: PoemFixture = {
  id: 'free-verse',
  name: 'Free Verse Sample',
  text: `The fog comes
on little cat feet.

It sits looking
over harbor and city
on silent haunches
and then moves on.`,
  expectedAnalysis: {
    lineCount: 6,
    stanzaCount: 2,
    syllableCounts: [3, 5, 4, 6, 5, 5],
    hasProblems: true, // Irregular structure may flag issues
  },
};

/**
 * Problematic poem - intentionally difficult to sing
 * Has tongue twisters and awkward stress patterns
 */
export const PROBLEMATIC_POEM: PoemFixture = {
  id: 'problematic',
  name: 'Difficult to Sing Sample',
  text: `She sells seashells by the seashore,
The shells she sells are seashells I'm sure.
So if she sells shells on the seashore,
Then I'm sure she sells seashore shells.`,
  expectedAnalysis: {
    lineCount: 4,
    stanzaCount: 1,
    syllableCounts: [8, 9, 9, 9],
    rhymeScheme: 'AABB',
    hasProblems: true, // Consonant clusters and tongue twisters
  },
};

/**
 * Haiku - very short form
 * Tests minimal content handling
 */
export const HAIKU_SAMPLE: PoemFixture = {
  id: 'haiku',
  name: 'Classic Haiku',
  text: `An old silent pond
A frog jumps into the pond
Splash! Silence again.`,
  expectedAnalysis: {
    lineCount: 3,
    stanzaCount: 1,
    syllableCounts: [5, 7, 5],
    hasProblems: false,
  },
};

/**
 * Simple test poem - short and predictable
 * Good for basic workflow validation
 */
export const SIMPLE_TEST_POEM: PoemFixture = {
  id: 'simple-test',
  name: 'Simple Test Poem',
  text: `Roses are red,
Violets are blue,
Sugar is sweet,
And so are you.`,
  expectedAnalysis: {
    lineCount: 4,
    stanzaCount: 1,
    syllableCounts: [4, 5, 4, 4],
    rhymeScheme: 'ABCB',
    hasProblems: false,
  },
};

/**
 * All poem fixtures for iteration
 */
export const ALL_POEMS: PoemFixture[] = [
  SONNET_18,
  TWINKLE_TWINKLE,
  HOPE_IS_THE_THING,
  FREE_VERSE_SAMPLE,
  PROBLEMATIC_POEM,
  HAIKU_SAMPLE,
  SIMPLE_TEST_POEM,
];

/**
 * Get a poem fixture by ID
 */
export function getPoemById(id: string): PoemFixture | undefined {
  return ALL_POEMS.find((poem) => poem.id === id);
}

/**
 * Get poems suitable for a specific test scenario
 */
export function getPoemsForScenario(
  scenario: 'simple' | 'structured' | 'problematic' | 'multi-stanza'
): PoemFixture[] {
  switch (scenario) {
    case 'simple':
      return [SIMPLE_TEST_POEM, HAIKU_SAMPLE, TWINKLE_TWINKLE];
    case 'structured':
      return [SONNET_18, TWINKLE_TWINKLE, HOPE_IS_THE_THING];
    case 'problematic':
      return [PROBLEMATIC_POEM, FREE_VERSE_SAMPLE];
    case 'multi-stanza':
      return [HOPE_IS_THE_THING, FREE_VERSE_SAMPLE];
    default:
      return ALL_POEMS;
  }
}
