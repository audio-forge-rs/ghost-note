/**
 * Tests for Help Content Data and Utility Functions
 *
 * @module components/Help/helpContent.test
 */

import { describe, it, expect } from 'vitest';
import {
  HELP_CATEGORIES,
  HELP_TOPICS,
  FAQ_ITEMS,
  getTopicsByCategory,
  getTopicById,
  getRelatedTopics,
  searchTopics,
  getFAQByCategory,
  searchFAQs,
  getCategoryById,
  type HelpCategory,
} from './helpContent';

describe('helpContent', () => {
  describe('HELP_CATEGORIES', () => {
    it('contains all required categories', () => {
      const expectedCategories: HelpCategory[] = [
        'getting-started',
        'analysis',
        'suggestions',
        'melody',
        'recording',
        'shortcuts',
      ];

      const actualCategories = HELP_CATEGORIES.map((c) => c.id);
      expect(actualCategories).toEqual(expectedCategories);
    });

    it('each category has required fields', () => {
      HELP_CATEGORIES.forEach((category) => {
        expect(category.id).toBeDefined();
        expect(category.title).toBeDefined();
        expect(category.description).toBeDefined();
        expect(category.icon).toBeDefined();
        expect(typeof category.title).toBe('string');
        expect(category.title.length).toBeGreaterThan(0);
      });
    });
  });

  describe('HELP_TOPICS', () => {
    it('contains topics for each category', () => {
      const categories = new Set(HELP_TOPICS.map((t) => t.category));
      HELP_CATEGORIES.forEach((cat) => {
        expect(categories.has(cat.id)).toBe(true);
      });
    });

    it('each topic has required fields', () => {
      HELP_TOPICS.forEach((topic) => {
        expect(topic.id).toBeDefined();
        expect(topic.title).toBeDefined();
        expect(topic.category).toBeDefined();
        expect(topic.summary).toBeDefined();
        expect(topic.content).toBeDefined();
        expect(topic.keywords).toBeDefined();
        expect(Array.isArray(topic.keywords)).toBe(true);
        expect(topic.keywords.length).toBeGreaterThan(0);
      });
    });

    it('all related topic IDs reference valid topics', () => {
      const topicIds = new Set(HELP_TOPICS.map((t) => t.id));
      HELP_TOPICS.forEach((topic) => {
        if (topic.related) {
          topic.related.forEach((relatedId) => {
            expect(topicIds.has(relatedId)).toBe(true);
          });
        }
      });
    });
  });

  describe('FAQ_ITEMS', () => {
    it('contains items for multiple categories', () => {
      const categories = new Set(FAQ_ITEMS.map((item) => item.category));
      expect(categories.size).toBeGreaterThan(3);
    });

    it('each FAQ item has required fields', () => {
      FAQ_ITEMS.forEach((item) => {
        expect(item.id).toBeDefined();
        expect(item.question).toBeDefined();
        expect(item.answer).toBeDefined();
        expect(item.category).toBeDefined();
        // Questions should end with ? or .
        expect(item.question.endsWith('?') || item.question.endsWith('.')).toBe(true);
        expect(item.answer.length).toBeGreaterThan(20);
      });
    });
  });

  describe('getTopicsByCategory', () => {
    it('returns topics for getting-started category', () => {
      const topics = getTopicsByCategory('getting-started');
      expect(topics.length).toBeGreaterThan(0);
      topics.forEach((topic) => {
        expect(topic.category).toBe('getting-started');
      });
    });

    it('returns topics for analysis category', () => {
      const topics = getTopicsByCategory('analysis');
      expect(topics.length).toBeGreaterThan(0);
      topics.forEach((topic) => {
        expect(topic.category).toBe('analysis');
      });
    });

    it('returns empty array for non-existent category', () => {
      const topics = getTopicsByCategory('non-existent' as HelpCategory);
      expect(topics).toEqual([]);
    });
  });

  describe('getTopicById', () => {
    it('returns topic for valid ID', () => {
      const topic = getTopicById('what-is-ghost-note');
      expect(topic).toBeDefined();
      expect(topic?.id).toBe('what-is-ghost-note');
      expect(topic?.title).toBe('What is Ghost Note?');
    });

    it('returns undefined for invalid ID', () => {
      const topic = getTopicById('non-existent-id');
      expect(topic).toBeUndefined();
    });
  });

  describe('getRelatedTopics', () => {
    it('returns related topics for topic with related field', () => {
      const relatedTopics = getRelatedTopics('what-is-ghost-note');
      expect(relatedTopics.length).toBeGreaterThan(0);
      // Should include workflow-overview and entering-poem
      const relatedIds = relatedTopics.map((t) => t.id);
      expect(relatedIds).toContain('workflow-overview');
    });

    it('returns empty array for topic without related field', () => {
      // Find a topic without related or create this scenario
      const topicWithoutRelated = HELP_TOPICS.find((t) => !t.related);
      if (topicWithoutRelated) {
        const relatedTopics = getRelatedTopics(topicWithoutRelated.id);
        expect(relatedTopics).toEqual([]);
      }
    });

    it('returns empty array for non-existent topic', () => {
      const relatedTopics = getRelatedTopics('non-existent-id');
      expect(relatedTopics).toEqual([]);
    });
  });

  describe('searchTopics', () => {
    it('returns empty array for empty query', () => {
      expect(searchTopics('')).toEqual([]);
      expect(searchTopics('   ')).toEqual([]);
    });

    it('finds topics by title', () => {
      const results = searchTopics('Ghost Note');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((t) => t.title.toLowerCase().includes('ghost note'))).toBe(true);
    });

    it('finds topics by keyword', () => {
      const results = searchTopics('syllable');
      expect(results.length).toBeGreaterThan(0);
    });

    it('finds topics by content', () => {
      const results = searchTopics('CMU Pronouncing Dictionary');
      expect(results.length).toBeGreaterThan(0);
    });

    it('is case-insensitive', () => {
      const lowerResults = searchTopics('melody');
      const upperResults = searchTopics('MELODY');
      const mixedResults = searchTopics('MeLoDy');

      expect(lowerResults.length).toBe(upperResults.length);
      expect(lowerResults.length).toBe(mixedResults.length);
    });

    it('prioritizes title matches', () => {
      const results = searchTopics('melody');
      // Topics with "melody" in the title should appear first
      const firstResult = results[0];
      expect(
        firstResult.title.toLowerCase().includes('melody') ||
          firstResult.keywords.some((k) => k.includes('melody'))
      ).toBe(true);
    });
  });

  describe('getFAQByCategory', () => {
    it('returns FAQs for getting-started category', () => {
      const faqs = getFAQByCategory('getting-started');
      expect(faqs.length).toBeGreaterThan(0);
      faqs.forEach((faq) => {
        expect(faq.category).toBe('getting-started');
      });
    });

    it('returns FAQs for analysis category', () => {
      const faqs = getFAQByCategory('analysis');
      expect(faqs.length).toBeGreaterThan(0);
      faqs.forEach((faq) => {
        expect(faq.category).toBe('analysis');
      });
    });

    it('returns empty array for category with no FAQs', () => {
      // All categories should have at least some FAQs in our implementation
      // but this tests the filtering logic
      const faqs = getFAQByCategory('non-existent' as HelpCategory);
      expect(faqs).toEqual([]);
    });
  });

  describe('searchFAQs', () => {
    it('returns empty array for empty query', () => {
      expect(searchFAQs('')).toEqual([]);
      expect(searchFAQs('   ')).toEqual([]);
    });

    it('finds FAQs by question text', () => {
      const results = searchFAQs('poems work best');
      expect(results.length).toBeGreaterThan(0);
    });

    it('finds FAQs by answer text', () => {
      const results = searchFAQs('microphone permission');
      expect(results.length).toBeGreaterThan(0);
    });

    it('is case-insensitive', () => {
      const lowerResults = searchFAQs('microphone');
      const upperResults = searchFAQs('MICROPHONE');

      expect(lowerResults.length).toBe(upperResults.length);
    });
  });

  describe('getCategoryById', () => {
    it('returns category info for valid category ID', () => {
      const category = getCategoryById('getting-started');
      expect(category).toBeDefined();
      expect(category?.id).toBe('getting-started');
      expect(category?.title).toBe('Getting Started');
    });

    it('returns undefined for invalid category ID', () => {
      const category = getCategoryById('non-existent' as HelpCategory);
      expect(category).toBeUndefined();
    });

    it('returns correct info for all categories', () => {
      HELP_CATEGORIES.forEach((cat) => {
        const result = getCategoryById(cat.id);
        expect(result).toEqual(cat);
      });
    });
  });
});
