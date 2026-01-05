/**
 * Tests for HelpSection Component
 *
 * @module components/Help/HelpSection.test
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { HelpSection, type HelpSectionProps } from './HelpSection';
import { HELP_TOPICS, getTopicById, HELP_CATEGORIES } from './helpContent';

describe('HelpSection', () => {
  // Get a topic with related topics for testing
  const topicWithRelated = HELP_TOPICS.find((t) => t.related && t.related.length > 0);
  const topicWithoutRelated = HELP_TOPICS.find((t) => !t.related || t.related.length === 0);

  const defaultTopic = getTopicById('what-is-ghost-note')!;

  const defaultProps: HelpSectionProps = {
    topic: defaultTopic,
  };

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders the HelpSection component', () => {
      render(<HelpSection {...defaultProps} />);
      expect(screen.getByTestId(`help-section-${defaultTopic.id}`)).toBeInTheDocument();
    });

    it('renders as an article element', () => {
      render(<HelpSection {...defaultProps} />);
      const section = screen.getByTestId(`help-section-${defaultTopic.id}`);
      expect(section.tagName.toLowerCase()).toBe('article');
    });

    it('renders the topic title', () => {
      render(<HelpSection {...defaultProps} />);
      expect(screen.getByText(defaultTopic.title)).toBeInTheDocument();
    });

    it('renders the topic summary', () => {
      render(<HelpSection {...defaultProps} />);
      expect(screen.getByText(defaultTopic.summary)).toBeInTheDocument();
    });

    it('renders the category badge', () => {
      render(<HelpSection {...defaultProps} />);
      const category = HELP_CATEGORIES.find((c) => c.id === defaultTopic.category);
      if (category) {
        expect(screen.getByText(category.title)).toBeInTheDocument();
      }
    });

    it('renders the keywords section', () => {
      render(<HelpSection {...defaultProps} />);
      expect(screen.getByText(/Keywords:/)).toBeInTheDocument();
      defaultTopic.keywords.forEach((keyword) => {
        expect(screen.getByText(/Keywords:/).textContent).toContain(keyword);
      });
    });
  });

  describe('content formatting', () => {
    it('parses bold text correctly', () => {
      // Create a topic with bold text
      const topicWithBold = {
        ...defaultTopic,
        content: 'This is **bold** text',
      };

      render(<HelpSection topic={topicWithBold} />);

      const strongElements = document.querySelectorAll('strong');
      const boldText = Array.from(strongElements).find(
        (el) => el.textContent === 'bold'
      );
      expect(boldText).toBeInTheDocument();
    });

    it('parses bullet lists correctly', () => {
      const topicWithList = {
        ...defaultTopic,
        content: '- Item one\n- Item two\n- Item three',
      };

      render(<HelpSection topic={topicWithList} />);

      const lists = document.querySelectorAll('ul');
      expect(lists.length).toBeGreaterThan(0);

      const listItems = document.querySelectorAll('li');
      expect(listItems.length).toBeGreaterThanOrEqual(3);
    });

    it('parses numbered lists correctly', () => {
      const topicWithNumberedList = {
        ...defaultTopic,
        content: '1. First item\n2. Second item\n3. Third item',
      };

      render(<HelpSection topic={topicWithNumberedList} />);

      const orderedLists = document.querySelectorAll('ol');
      expect(orderedLists.length).toBeGreaterThan(0);
    });

    it('parses headers (bold lines) correctly', () => {
      const topicWithHeader = {
        ...defaultTopic,
        content: '**Section Title**\n\nSome content here',
      };

      render(<HelpSection topic={topicWithHeader} />);

      const headers = document.querySelectorAll('h4.help-section__subheading');
      expect(headers.length).toBeGreaterThan(0);
      expect(headers[0].textContent).toBe('Section Title');
    });

    it('renders plain paragraphs', () => {
      const topicWithParagraph = {
        ...defaultTopic,
        content: 'This is a plain paragraph.',
      };

      render(<HelpSection topic={topicWithParagraph} />);

      const paragraphs = document.querySelectorAll('p.help-section__paragraph');
      expect(paragraphs.length).toBeGreaterThan(0);
    });
  });

  describe('related topics', () => {
    it('renders related topics section when topic has related and onTopicSelect provided', () => {
      if (!topicWithRelated) {
        return; // Skip if no topic with related exists
      }

      const mockOnTopicSelect = vi.fn();
      render(
        <HelpSection
          topic={topicWithRelated}
          onTopicSelect={mockOnTopicSelect}
        />
      );

      expect(screen.getByText('Related Topics')).toBeInTheDocument();
    });

    it('does not render related topics when onTopicSelect is not provided', () => {
      if (!topicWithRelated) {
        return;
      }

      render(<HelpSection topic={topicWithRelated} />);

      expect(screen.queryByText('Related Topics')).not.toBeInTheDocument();
    });

    it('does not render related topics when topic has no related', () => {
      if (!topicWithoutRelated) {
        return;
      }

      const mockOnTopicSelect = vi.fn();
      render(
        <HelpSection
          topic={topicWithoutRelated}
          onTopicSelect={mockOnTopicSelect}
        />
      );

      expect(screen.queryByText('Related Topics')).not.toBeInTheDocument();
    });

    it('renders related topic buttons', () => {
      if (!topicWithRelated || !topicWithRelated.related) {
        return;
      }

      const mockOnTopicSelect = vi.fn();
      render(
        <HelpSection
          topic={topicWithRelated}
          onTopicSelect={mockOnTopicSelect}
        />
      );

      topicWithRelated.related.forEach((relatedId) => {
        const relatedTopic = getTopicById(relatedId);
        if (relatedTopic) {
          expect(
            screen.getByTestId(`help-related-${relatedId}`)
          ).toBeInTheDocument();
        }
      });
    });

    it('calls onTopicSelect when related topic is clicked', () => {
      if (!topicWithRelated || !topicWithRelated.related) {
        return;
      }

      const mockOnTopicSelect = vi.fn();
      render(
        <HelpSection
          topic={topicWithRelated}
          onTopicSelect={mockOnTopicSelect}
        />
      );

      const firstRelatedId = topicWithRelated.related[0];
      const relatedButton = screen.getByTestId(`help-related-${firstRelatedId}`);

      fireEvent.click(relatedButton);

      expect(mockOnTopicSelect).toHaveBeenCalledTimes(1);
      expect(mockOnTopicSelect).toHaveBeenCalledWith(
        expect.objectContaining({ id: firstRelatedId })
      );
    });

    it('shows related topic title in button', () => {
      if (!topicWithRelated || !topicWithRelated.related) {
        return;
      }

      const mockOnTopicSelect = vi.fn();
      render(
        <HelpSection
          topic={topicWithRelated}
          onTopicSelect={mockOnTopicSelect}
        />
      );

      const firstRelatedId = topicWithRelated.related[0];
      const relatedTopic = getTopicById(firstRelatedId);
      if (relatedTopic) {
        expect(screen.getByText(relatedTopic.title)).toBeInTheDocument();
      }
    });
  });

  describe('accessibility', () => {
    it('keywords section is hidden from screen readers', () => {
      render(<HelpSection {...defaultProps} />);
      const keywords = document.querySelector('.help-section__keywords');
      expect(keywords).toHaveAttribute('aria-hidden', 'true');
    });

    it('link icon is hidden from screen readers', () => {
      if (!topicWithRelated) {
        return;
      }

      const mockOnTopicSelect = vi.fn();
      render(
        <HelpSection
          topic={topicWithRelated}
          onTopicSelect={mockOnTopicSelect}
        />
      );

      const svg = document.querySelector('.help-section__related-title svg');
      if (svg) {
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      }
    });

    it('related topic buttons have type="button"', () => {
      if (!topicWithRelated || !topicWithRelated.related) {
        return;
      }

      const mockOnTopicSelect = vi.fn();
      render(
        <HelpSection
          topic={topicWithRelated}
          onTopicSelect={mockOnTopicSelect}
        />
      );

      const firstRelatedId = topicWithRelated.related[0];
      const relatedButton = screen.getByTestId(`help-related-${firstRelatedId}`);
      expect(relatedButton).toHaveAttribute('type', 'button');
    });
  });

  describe('different topics', () => {
    it('renders correctly for each category', () => {
      HELP_CATEGORIES.forEach((category) => {
        const topicInCategory = HELP_TOPICS.find((t) => t.category === category.id);
        if (topicInCategory) {
          const { unmount } = render(<HelpSection topic={topicInCategory} />);
          expect(
            screen.getByTestId(`help-section-${topicInCategory.id}`)
          ).toBeInTheDocument();
          unmount();
        }
      });
    });

    it('updates when topic prop changes', () => {
      const firstTopic = HELP_TOPICS[0];
      const secondTopic = HELP_TOPICS[1];

      const { rerender } = render(<HelpSection topic={firstTopic} />);
      expect(screen.getByText(firstTopic.title)).toBeInTheDocument();

      rerender(<HelpSection topic={secondTopic} />);
      expect(screen.getByText(secondTopic.title)).toBeInTheDocument();
      expect(screen.queryByText(firstTopic.title)).not.toBeInTheDocument();
    });
  });

  describe('complex content parsing', () => {
    it('handles multiple bold sections', () => {
      const topicWithMultipleBold = {
        ...defaultTopic,
        content: '**First** and **second** bold items',
      };

      render(<HelpSection topic={topicWithMultipleBold} />);

      const strongElements = document.querySelectorAll('strong');
      expect(strongElements.length).toBeGreaterThanOrEqual(2);
    });

    it('handles mixed content types', () => {
      const topicWithMixedContent = {
        ...defaultTopic,
        content: `**Header Section**

Some intro text here.

- First bullet
- Second bullet

1. Numbered one
2. Numbered two

More paragraph text with **bold** words.`,
      };

      render(<HelpSection topic={topicWithMixedContent} />);

      // Should have headers
      expect(document.querySelectorAll('h4').length).toBeGreaterThan(0);

      // Should have lists
      expect(document.querySelectorAll('ul').length).toBeGreaterThan(0);
      expect(document.querySelectorAll('ol').length).toBeGreaterThan(0);

      // Should have paragraphs
      expect(document.querySelectorAll('p.help-section__paragraph').length).toBeGreaterThan(0);
    });

    it('handles empty content gracefully', () => {
      const topicWithEmptyContent = {
        ...defaultTopic,
        content: '',
      };

      render(<HelpSection topic={topicWithEmptyContent} />);

      // Should still render the section
      expect(
        screen.getByTestId(`help-section-${topicWithEmptyContent.id}`)
      ).toBeInTheDocument();
    });
  });
});
