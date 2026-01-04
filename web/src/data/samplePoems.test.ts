/**
 * Tests for Sample Poems Data Module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  samplePoems,
  getSamplePoemById,
  getSamplePoemsByStyle,
  getSamplePoemsByForm,
  getSamplePoemsByTag,
  getAllTags,
  getAllStyles,
  getAllForms,
  searchSamplePoems,
  getRandomSamplePoem,
  getSamplePoemCount,
  type PoemStyle,
  type PoemForm,
} from './samplePoems';

describe('samplePoems', () => {
  describe('collection', () => {
    it('contains at least 6 poems', () => {
      expect(samplePoems.length).toBeGreaterThanOrEqual(6);
    });

    it('contains the required poems', () => {
      const requiredPoems = [
        'shakespeare-sonnet-18',
        'frost-road-not-taken',
        'dickinson-hope-feathers',
      ];

      requiredPoems.forEach((id) => {
        expect(samplePoems.find((p) => p.id === id)).toBeDefined();
      });
    });

    it('has unique IDs for all poems', () => {
      const ids = samplePoems.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('has all required fields for each poem', () => {
      samplePoems.forEach((poem) => {
        expect(poem.id).toBeTruthy();
        expect(poem.title).toBeTruthy();
        expect(poem.author).toBeTruthy();
        expect(poem.text).toBeTruthy();
        expect(poem.style).toBeTruthy();
        expect(poem.form).toBeTruthy();
        expect(poem.expectedMeter).toBeDefined();
        expect(poem.description).toBeTruthy();
        expect(poem.tags).toBeInstanceOf(Array);
        expect(poem.tags.length).toBeGreaterThan(0);
        expect(poem.publicDomain).toBe(true);
      });
    });

    it('has valid expected meter for each poem', () => {
      samplePoems.forEach((poem) => {
        expect(poem.expectedMeter.type).toBeTruthy();
        expect(poem.expectedMeter.footType).toBeTruthy();
        expect(typeof poem.expectedMeter.feetPerLine).toBe('number');
        expect(poem.expectedMeter.name).toBeTruthy();
      });
    });

    it('includes diverse poem forms', () => {
      const forms = new Set(samplePoems.map((p) => p.form));
      // Expect at least 4 different forms
      expect(forms.size).toBeGreaterThanOrEqual(4);
      // Check for specific forms
      expect(forms.has('sonnet')).toBe(true);
      expect(forms.has('haiku')).toBe(true);
      expect(forms.has('limerick')).toBe(true);
    });

    it('includes diverse poem styles', () => {
      const styles = new Set(samplePoems.map((p) => p.style));
      // Expect at least 3 different styles
      expect(styles.size).toBeGreaterThanOrEqual(3);
    });

    it('includes free verse example', () => {
      const freeVerse = samplePoems.find((p) => p.form === 'free_verse');
      expect(freeVerse).toBeDefined();
      expect(freeVerse?.expectedMeter.type).toBe('irregular');
    });
  });

  describe('getSamplePoemById', () => {
    it('returns the correct poem for a valid ID', () => {
      const poem = getSamplePoemById('shakespeare-sonnet-18');
      expect(poem).toBeDefined();
      expect(poem?.title).toBe('Sonnet 18');
      expect(poem?.author).toBe('William Shakespeare');
    });

    it('returns undefined for an invalid ID', () => {
      const poem = getSamplePoemById('non-existent-poem');
      expect(poem).toBeUndefined();
    });

    it('returns undefined for empty string', () => {
      const poem = getSamplePoemById('');
      expect(poem).toBeUndefined();
    });
  });

  describe('getSamplePoemsByStyle', () => {
    it('returns poems matching the style', () => {
      const romanticPoems = getSamplePoemsByStyle('romantic');
      expect(romanticPoems.length).toBeGreaterThan(0);
      romanticPoems.forEach((poem) => {
        expect(poem.style).toBe('romantic');
      });
    });

    it('returns empty array for non-existent style', () => {
      const poems = getSamplePoemsByStyle('nonexistent' as PoemStyle);
      expect(poems).toEqual([]);
    });

    it('filters correctly for multiple styles', () => {
      const styles: PoemStyle[] = ['classical', 'romantic', 'victorian', 'modern'];
      styles.forEach((style) => {
        const poems = getSamplePoemsByStyle(style);
        poems.forEach((poem) => {
          expect(poem.style).toBe(style);
        });
      });
    });
  });

  describe('getSamplePoemsByForm', () => {
    it('returns poems matching the form', () => {
      const sonnets = getSamplePoemsByForm('sonnet');
      expect(sonnets.length).toBeGreaterThan(0);
      sonnets.forEach((poem) => {
        expect(poem.form).toBe('sonnet');
      });
    });

    it('returns haiku when filtering by haiku form', () => {
      const haikus = getSamplePoemsByForm('haiku');
      expect(haikus.length).toBeGreaterThan(0);
      haikus.forEach((poem) => {
        expect(poem.form).toBe('haiku');
      });
    });

    it('returns empty array for non-existent form', () => {
      const poems = getSamplePoemsByForm('nonexistent' as PoemForm);
      expect(poems).toEqual([]);
    });
  });

  describe('getSamplePoemsByTag', () => {
    it('returns poems containing the tag', () => {
      const lovePoems = getSamplePoemsByTag('love');
      expect(lovePoems.length).toBeGreaterThan(0);
      lovePoems.forEach((poem) => {
        expect(poem.tags.map((t) => t.toLowerCase())).toContain('love');
      });
    });

    it('is case insensitive', () => {
      const lowercaseResult = getSamplePoemsByTag('nature');
      const uppercaseResult = getSamplePoemsByTag('NATURE');
      const mixedResult = getSamplePoemsByTag('NaTuRe');

      expect(lowercaseResult.length).toBe(uppercaseResult.length);
      expect(lowercaseResult.length).toBe(mixedResult.length);
    });

    it('returns empty array for non-existent tag', () => {
      const poems = getSamplePoemsByTag('nonexistenttag12345');
      expect(poems).toEqual([]);
    });
  });

  describe('getAllTags', () => {
    it('returns an array of unique tags', () => {
      const tags = getAllTags();
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);

      // Check for uniqueness
      const uniqueTags = new Set(tags);
      expect(uniqueTags.size).toBe(tags.length);
    });

    it('returns sorted tags', () => {
      const tags = getAllTags();
      const sortedTags = [...tags].sort();
      expect(tags).toEqual(sortedTags);
    });

    it('includes expected common tags', () => {
      const tags = getAllTags();
      expect(tags).toContain('love');
      expect(tags).toContain('nature');
    });
  });

  describe('getAllStyles', () => {
    it('returns an array of unique styles', () => {
      const styles = getAllStyles();
      expect(Array.isArray(styles)).toBe(true);
      expect(styles.length).toBeGreaterThan(0);

      // Check for uniqueness
      const uniqueStyles = new Set(styles);
      expect(uniqueStyles.size).toBe(styles.length);
    });

    it('includes expected styles', () => {
      const styles = getAllStyles();
      expect(styles).toContain('romantic');
    });
  });

  describe('getAllForms', () => {
    it('returns an array of unique forms', () => {
      const forms = getAllForms();
      expect(Array.isArray(forms)).toBe(true);
      expect(forms.length).toBeGreaterThan(0);

      // Check for uniqueness
      const uniqueForms = new Set(forms);
      expect(uniqueForms.size).toBe(forms.length);
    });

    it('includes expected forms', () => {
      const forms = getAllForms();
      expect(forms).toContain('sonnet');
      expect(forms).toContain('haiku');
      expect(forms).toContain('limerick');
    });
  });

  describe('searchSamplePoems', () => {
    it('returns all poems for empty query', () => {
      const results = searchSamplePoems('');
      expect(results.length).toBe(samplePoems.length);
    });

    it('returns all poems for whitespace query', () => {
      const results = searchSamplePoems('   ');
      expect(results.length).toBe(samplePoems.length);
    });

    it('finds poems by title', () => {
      const results = searchSamplePoems('Sonnet');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((p) => p.title.includes('Sonnet'))).toBe(true);
    });

    it('finds poems by author', () => {
      const results = searchSamplePoems('Shakespeare');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((p) => p.author.includes('Shakespeare'))).toBe(true);
    });

    it('finds poems by description', () => {
      const results = searchSamplePoems('summer');
      expect(results.length).toBeGreaterThan(0);
    });

    it('is case insensitive', () => {
      const lowercaseResults = searchSamplePoems('shakespeare');
      const uppercaseResults = searchSamplePoems('SHAKESPEARE');
      expect(lowercaseResults.length).toBe(uppercaseResults.length);
    });

    it('returns empty array when no matches found', () => {
      const results = searchSamplePoems('xyznonexistent123');
      expect(results).toEqual([]);
    });
  });

  describe('getRandomSamplePoem', () => {
    beforeEach(() => {
      vi.spyOn(Math, 'random');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns a valid poem', () => {
      const poem = getRandomSamplePoem();
      expect(poem).toBeDefined();
      expect(poem.id).toBeTruthy();
      expect(poem.title).toBeTruthy();
      expect(samplePoems).toContainEqual(poem);
    });

    it('can return different poems', () => {
      // Mock random to return different values
      vi.mocked(Math.random)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.99);

      const poem1 = getRandomSamplePoem();
      const poem2 = getRandomSamplePoem();
      const poem3 = getRandomSamplePoem();

      // At least one should be different (unless there's only one poem)
      if (samplePoems.length > 1) {
        expect(poem1.id !== poem2.id || poem2.id !== poem3.id).toBe(true);
      }
    });

    it('returns first poem when random is 0', () => {
      vi.mocked(Math.random).mockReturnValue(0);
      const poem = getRandomSamplePoem();
      expect(poem).toEqual(samplePoems[0]);
    });
  });

  describe('getSamplePoemCount', () => {
    it('returns the correct count', () => {
      const count = getSamplePoemCount();
      expect(count).toBe(samplePoems.length);
    });

    it('returns at least 6', () => {
      expect(getSamplePoemCount()).toBeGreaterThanOrEqual(6);
    });
  });

  describe('poem content validation', () => {
    it('Shakespeare Sonnet 18 has correct content', () => {
      const poem = getSamplePoemById('shakespeare-sonnet-18');
      expect(poem).toBeDefined();
      expect(poem?.text).toContain("Shall I compare thee to a summer's day");
      expect(poem?.expectedMeter.name).toBe('iambic pentameter');
      expect(poem?.form).toBe('sonnet');
    });

    it('Frost Road Not Taken has correct content', () => {
      const poem = getSamplePoemById('frost-road-not-taken');
      expect(poem).toBeDefined();
      expect(poem?.text).toContain('Two roads diverged in a yellow wood');
      expect(poem?.author).toBe('Robert Frost');
    });

    it('Dickinson poem has correct content', () => {
      const poem = getSamplePoemById('dickinson-hope-feathers');
      expect(poem).toBeDefined();
      expect(poem?.text).toContain('Hope');
      expect(poem?.author).toBe('Emily Dickinson');
    });

    it('haiku has correct form', () => {
      const poem = getSamplePoemById('basho-old-pond');
      expect(poem).toBeDefined();
      expect(poem?.form).toBe('haiku');
      expect(poem?.author).toBe('Matsuo Bashō');
    });

    it('limerick has correct form', () => {
      const poem = getSamplePoemById('lear-old-man-beard');
      expect(poem).toBeDefined();
      expect(poem?.form).toBe('limerick');
      expect(poem?.expectedMeter.type).toBe('anapestic');
    });

    it('free verse poem has irregular meter', () => {
      const poem = getSamplePoemById('whitman-song-myself-52');
      expect(poem).toBeDefined();
      expect(poem?.form).toBe('free_verse');
      expect(poem?.expectedMeter.type).toBe('irregular');
    });
  });

  describe('public domain compliance', () => {
    it('all poems are marked as public domain', () => {
      samplePoems.forEach((poem) => {
        expect(poem.publicDomain).toBe(true);
      });
    });

    it('all poems are verified public domain works', () => {
      // Public domain status in the US:
      // - Works published before 1928 are in the public domain
      // - For newer works, author must have died 70+ years ago (life + 70 rule)
      // Our poems are all either pre-1928 publications or from authors long deceased

      // Verify each poem's publication year makes it public domain
      // (all our poems were published before 1928)
      const publicDomainCutoff = 1928;

      samplePoems.forEach((poem) => {
        // All our poems have years before 1928
        if (poem.year) {
          expect(poem.year).toBeLessThan(publicDomainCutoff);
        }
        // All poems should be marked as public domain
        expect(poem.publicDomain).toBe(true);
      });
    });
  });
});
