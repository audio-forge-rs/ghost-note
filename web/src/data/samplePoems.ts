/**
 * Ghost Note - Sample Poems Library
 *
 * A curated collection of public domain poems for users to try the app.
 * All poems are either in the public domain or use works by authors
 * who died more than 70 years ago.
 *
 * @module data/samplePoems
 */

import type { MeterType, FootType } from '@/types/analysis';

// =============================================================================
// Types
// =============================================================================

/**
 * Style/period classification for a poem
 */
export type PoemStyle =
  | 'classical'
  | 'romantic'
  | 'victorian'
  | 'modern'
  | 'contemporary'
  | 'traditional';

/**
 * Form classification for a poem
 */
export type PoemForm =
  | 'sonnet'
  | 'free_verse'
  | 'limerick'
  | 'haiku'
  | 'ballad'
  | 'lyric'
  | 'ode'
  | 'quatrain'
  | 'couplet'
  | 'other';

/**
 * Expected meter information for validation purposes
 */
export interface ExpectedMeter {
  /** The type of meter (iambic, trochaic, etc.) */
  type: MeterType;
  /** The type of metrical foot */
  footType: FootType;
  /** Number of feet per line (e.g., 5 for pentameter) */
  feetPerLine: number;
  /** Human-readable meter name (e.g., "iambic pentameter") */
  name: string;
}

/**
 * A sample poem with metadata
 */
export interface SamplePoem {
  /** Unique identifier for the poem */
  id: string;
  /** Title of the poem */
  title: string;
  /** Author name */
  author: string;
  /** Year written or published (approximate) */
  year?: number;
  /** The full poem text */
  text: string;
  /** Style/period classification */
  style: PoemStyle;
  /** Form classification */
  form: PoemForm;
  /** Expected meter for validation */
  expectedMeter: ExpectedMeter;
  /** Brief description for display */
  description: string;
  /** Tags for categorization */
  tags: string[];
  /** Public domain confirmation */
  publicDomain: true;
  /** Source or attribution notes */
  source?: string;
}

// =============================================================================
// Sample Poems Collection
// =============================================================================

/**
 * Shakespeare's Sonnet 18
 * Classic example of English/Shakespearean sonnet form
 */
const sonnet18: SamplePoem = {
  id: 'shakespeare-sonnet-18',
  title: 'Sonnet 18',
  author: 'William Shakespeare',
  year: 1609,
  text: `Shall I compare thee to a summer's day?
Thou art more lovely and more temperate:
Rough winds do shake the darling buds of May,
And summer's lease hath all too short a date:

Sometime too hot the eye of heaven shines,
And often is his gold complexion dimmed;
And every fair from fair sometime declines,
By chance, or nature's changing course untrimmed;

But thy eternal summer shall not fade,
Nor lose possession of that fair thou ow'st;
Nor shall death brag thou wand'rest in his shade,
When in eternal lines to time thou grow'st:

So long as men can breathe, or eyes can see,
So long lives this, and this gives life to thee.`,
  style: 'classical',
  form: 'sonnet',
  expectedMeter: {
    type: 'iambic',
    footType: 'iamb',
    feetPerLine: 5,
    name: 'iambic pentameter',
  },
  description: 'A beloved sonnet comparing the beloved to summer',
  tags: ['love', 'beauty', 'immortality', 'nature', 'sonnet'],
  publicDomain: true,
  source: 'Shakespeare\'s Sonnets (1609)',
};

/**
 * Robert Frost's "The Road Not Taken"
 * American classic with regular meter and ABAAB rhyme scheme
 */
const roadNotTaken: SamplePoem = {
  id: 'frost-road-not-taken',
  title: 'The Road Not Taken',
  author: 'Robert Frost',
  year: 1916,
  text: `Two roads diverged in a yellow wood,
And sorry I could not travel both
And be one traveler, long I stood
And looked down one as far as I could
To where it bent in the undergrowth;

Then took the other, as just as fair,
And having perhaps the better claim,
Because it was grassy and wanted wear;
Though as for that the passing there
Had worn them really about the same,

And both that morning equally lay
In leaves no step had trodden black.
Oh, I kept the first for another day!
Yet knowing how way leads on to way,
I doubted if I should ever come back.

I shall be telling this with a sigh
Somewhere ages and ages hence:
Two roads diverged in a wood, and I—
I took the one less traveled by,
And that has made all the difference.`,
  style: 'modern',
  form: 'lyric',
  expectedMeter: {
    type: 'iambic',
    footType: 'iamb',
    feetPerLine: 4,
    name: 'iambic tetrameter',
  },
  description: 'A meditation on choices and their consequences',
  tags: ['choice', 'journey', 'nature', 'reflection', 'life'],
  publicDomain: true,
  source: 'Mountain Interval (1916)',
};

/**
 * Emily Dickinson's "Hope is the thing with feathers"
 * Short lyric poem with Dickinson's characteristic slant rhyme
 */
const hopeIsTheThing: SamplePoem = {
  id: 'dickinson-hope-feathers',
  title: '"Hope" is the thing with feathers',
  author: 'Emily Dickinson',
  year: 1861,
  text: `"Hope" is the thing with feathers -
That perches in the soul -
And sings the tune without the words -
And never stops - at all -

And sweetest - in the Gale - is heard -
And sore must be the storm -
That could abash the little Bird
That kept so many warm -

I've heard it in the chillest land -
And on the strangest Sea -
Yet - never - in Extremity,
It asked a crumb - of me.`,
  style: 'victorian',
  form: 'quatrain',
  expectedMeter: {
    type: 'iambic',
    footType: 'iamb',
    feetPerLine: 4,
    name: 'common meter (alternating 4/3)',
  },
  description: 'A metaphor comparing hope to a bird',
  tags: ['hope', 'nature', 'resilience', 'metaphor', 'bird'],
  publicDomain: true,
  source: 'Poems by Emily Dickinson (1891)',
};

/**
 * Walt Whitman excerpt from "Song of Myself"
 * Free verse example from a master of the form
 */
const songOfMyself: SamplePoem = {
  id: 'whitman-song-myself-52',
  title: 'from Song of Myself, 52',
  author: 'Walt Whitman',
  year: 1855,
  text: `The spotted hawk swoops by and accuses me, he complains
    of my gab and my loitering.

I too am not a bit tamed, I too am untranslatable,
I sound my barbaric yawp over the roofs of the world.

The last scud of day holds back for me,
It flings my likeness after the rest and true as any on the
    shadow'd wilds,
It coaxes me to the vapor and the dusk.

I depart as air, I shake my white locks at the runaway sun,
I effuse my flesh in eddies, and drift it in lacy jags.

I bequeath myself to the dirt to grow from the grass I love,
If you want me again look for me under your boot-soles.

You will hardly know who I am or what I mean,
But I shall be good health to you nevertheless,
And filter and fibre your blood.

Failing to fetch me at first keep encouraged,
Missing me one place search another,
I stop somewhere waiting for you.`,
  style: 'romantic',
  form: 'free_verse',
  expectedMeter: {
    type: 'irregular',
    footType: 'unknown',
    feetPerLine: 0,
    name: 'free verse',
  },
  description: 'The transcendent conclusion of Whitman\'s epic poem',
  tags: ['nature', 'identity', 'transcendence', 'freedom', 'american'],
  publicDomain: true,
  source: 'Leaves of Grass (1855)',
};

/**
 * Traditional Limerick
 * Classic humorous form with AABBA rhyme
 */
const limerick: SamplePoem = {
  id: 'lear-old-man-beard',
  title: 'There Was an Old Man with a Beard',
  author: 'Edward Lear',
  year: 1846,
  text: `There was an Old Man with a beard,
Who said, "It is just as I feared!—
Two Owls and a Hen,
Four Larks and a Wren,
Have all built their nests in my beard!"`,
  style: 'victorian',
  form: 'limerick',
  expectedMeter: {
    type: 'anapestic',
    footType: 'anapest',
    feetPerLine: 3,
    name: 'anapestic trimeter',
  },
  description: 'A classic nonsense limerick',
  tags: ['humor', 'nonsense', 'limerick', 'birds', 'absurd'],
  publicDomain: true,
  source: 'A Book of Nonsense (1846)',
};

/**
 * Traditional Haiku by Matsuo Bashō
 * Classic Japanese form in English translation
 */
const oldPondHaiku: SamplePoem = {
  id: 'basho-old-pond',
  title: 'The Old Pond',
  author: 'Matsuo Bashō',
  year: 1686,
  text: `An old silent pond
A frog jumps into the pond—
Splash! Silence again.`,
  style: 'traditional',
  form: 'haiku',
  expectedMeter: {
    type: 'irregular',
    footType: 'unknown',
    feetPerLine: 0,
    name: 'haiku (5-7-5 syllables)',
  },
  description: 'The most famous haiku in Japanese literature',
  tags: ['nature', 'zen', 'haiku', 'contemplation', 'japanese'],
  publicDomain: true,
  source: 'Traditional translation',
};

/**
 * William Blake's "The Tyger"
 * Powerful trochaic meter with memorable imagery
 */
const theTyger: SamplePoem = {
  id: 'blake-tyger',
  title: 'The Tyger',
  author: 'William Blake',
  year: 1794,
  text: `Tyger Tyger, burning bright,
In the forests of the night;
What immortal hand or eye,
Could frame thy fearful symmetry?

In what distant deeps or skies,
Burnt the fire of thine eyes?
On what wings dare he aspire?
What the hand, dare seize the fire?

And what shoulder, & what art,
Could twist the sinews of thy heart?
And when thy heart began to beat,
What dread hand? & what dread feet?

What the hammer? what the chain,
In what furnace was thy brain?
What the anvil? what dread grasp,
Dare its deadly terrors clasp!

When the stars threw down their spears
And water'd heaven with their tears:
Did he smile his work to see?
Did he who made the Lamb make thee?

Tyger Tyger burning bright,
In the forests of the night:
What immortal hand or eye,
Dare frame thy fearful symmetry?`,
  style: 'romantic',
  form: 'lyric',
  expectedMeter: {
    type: 'trochaic',
    footType: 'trochee',
    feetPerLine: 4,
    name: 'trochaic tetrameter (catalectic)',
  },
  description: 'A powerful meditation on creation and the nature of evil',
  tags: ['creation', 'god', 'nature', 'fear', 'sublime', 'tiger'],
  publicDomain: true,
  source: 'Songs of Experience (1794)',
};

/**
 * Edgar Allan Poe's "Annabel Lee"
 * Musical, haunting poem with anapestic rhythm
 */
const annabelLee: SamplePoem = {
  id: 'poe-annabel-lee',
  title: 'Annabel Lee',
  author: 'Edgar Allan Poe',
  year: 1849,
  text: `It was many and many a year ago,
In a kingdom by the sea,
That a maiden there lived whom you may know
By the name of Annabel Lee;
And this maiden she lived with no other thought
Than to love and be loved by me.

I was a child and she was a child,
In this kingdom by the sea,
But we loved with a love that was more than love—
I and my Annabel Lee—
With a love that the wingèd seraphs of Heaven
Coveted her and me.

And this was the reason that, long ago,
In this kingdom by the sea,
A wind blew out of a cloud, chilling
My beautiful Annabel Lee;
So that her highborn kinsmen came
And bore her away from me,
To shut her up in a sepulchre
In this kingdom by the sea.

The angels, not half so happy in Heaven,
Went envying her and me—
Yes!—that was the reason (as all men know,
In this kingdom by the sea)
That the wind came out of the cloud by night,
Chilling and killing my Annabel Lee.

But our love it was stronger by far than the love
Of those who were older than we—
Of many far wiser than we—
And neither the angels in Heaven above
Nor the demons down under the sea
Can ever dissever my soul from the soul
Of the beautiful Annabel Lee;

For the moon never beams, without bringing me dreams
Of the beautiful Annabel Lee;
And the stars never rise, but I feel the bright eyes
Of the beautiful Annabel Lee;
And so, all the night-tide, I lie down by the side
Of my darling—my darling—my life and my bride,
In her sepulchre there by the sea—
In her tomb by the sounding sea.`,
  style: 'romantic',
  form: 'ballad',
  expectedMeter: {
    type: 'anapestic',
    footType: 'anapest',
    feetPerLine: 4,
    name: 'anapestic tetrameter (mixed)',
  },
  description: 'A haunting ballad of eternal love and loss',
  tags: ['love', 'death', 'loss', 'gothic', 'sea', 'romantic'],
  publicDomain: true,
  source: 'Published posthumously (1849)',
};

// =============================================================================
// Exported Collection
// =============================================================================

/**
 * All sample poems in the library
 */
export const samplePoems: SamplePoem[] = [
  sonnet18,
  roadNotTaken,
  hopeIsTheThing,
  songOfMyself,
  limerick,
  oldPondHaiku,
  theTyger,
  annabelLee,
];

/**
 * Get a sample poem by its ID
 * @param id - The unique identifier of the poem
 * @returns The poem if found, undefined otherwise
 */
export function getSamplePoemById(id: string): SamplePoem | undefined {
  console.log('[samplePoems] Looking up poem by id:', id);
  return samplePoems.find((poem) => poem.id === id);
}

/**
 * Get sample poems filtered by style
 * @param style - The style to filter by
 * @returns Array of poems matching the style
 */
export function getSamplePoemsByStyle(style: PoemStyle): SamplePoem[] {
  console.log('[samplePoems] Filtering poems by style:', style);
  return samplePoems.filter((poem) => poem.style === style);
}

/**
 * Get sample poems filtered by form
 * @param form - The form to filter by
 * @returns Array of poems matching the form
 */
export function getSamplePoemsByForm(form: PoemForm): SamplePoem[] {
  console.log('[samplePoems] Filtering poems by form:', form);
  return samplePoems.filter((poem) => poem.form === form);
}

/**
 * Get sample poems filtered by tag
 * @param tag - The tag to filter by
 * @returns Array of poems containing the tag
 */
export function getSamplePoemsByTag(tag: string): SamplePoem[] {
  console.log('[samplePoems] Filtering poems by tag:', tag);
  const lowerTag = tag.toLowerCase();
  return samplePoems.filter((poem) =>
    poem.tags.some((t) => t.toLowerCase() === lowerTag)
  );
}

/**
 * Get all unique tags from the sample poems
 * @returns Array of all unique tags
 */
export function getAllTags(): string[] {
  const tagSet = new Set<string>();
  samplePoems.forEach((poem) => {
    poem.tags.forEach((tag) => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}

/**
 * Get all unique styles from the sample poems
 * @returns Array of all unique styles
 */
export function getAllStyles(): PoemStyle[] {
  const styleSet = new Set<PoemStyle>();
  samplePoems.forEach((poem) => styleSet.add(poem.style));
  return Array.from(styleSet);
}

/**
 * Get all unique forms from the sample poems
 * @returns Array of all unique forms
 */
export function getAllForms(): PoemForm[] {
  const formSet = new Set<PoemForm>();
  samplePoems.forEach((poem) => formSet.add(poem.form));
  return Array.from(formSet);
}

/**
 * Search sample poems by title or author (case-insensitive)
 * @param query - Search query string
 * @returns Array of poems matching the query
 */
export function searchSamplePoems(query: string): SamplePoem[] {
  console.log('[samplePoems] Searching for:', query);
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) {
    return samplePoems;
  }
  return samplePoems.filter(
    (poem) =>
      poem.title.toLowerCase().includes(lowerQuery) ||
      poem.author.toLowerCase().includes(lowerQuery) ||
      poem.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get a random sample poem
 * @returns A randomly selected poem
 */
export function getRandomSamplePoem(): SamplePoem {
  const index = Math.floor(Math.random() * samplePoems.length);
  console.log('[samplePoems] Getting random poem, index:', index);
  return samplePoems[index];
}

/**
 * Get the total count of sample poems
 * @returns Number of poems in the library
 */
export function getSamplePoemCount(): number {
  return samplePoems.length;
}

// =============================================================================
// Default Export
// =============================================================================

export default samplePoems;
