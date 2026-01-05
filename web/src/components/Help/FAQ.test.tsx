/**
 * Tests for FAQ Component
 *
 * @module components/Help/FAQ.test
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { FAQ, type FAQProps } from './FAQ';
import { FAQ_ITEMS, HELP_CATEGORIES } from './helpContent';

describe('FAQ', () => {
  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders the FAQ component', () => {
      render(<FAQ />);
      expect(screen.getByTestId('faq')).toBeInTheDocument();
    });

    it('renders all FAQ items when no category filter', () => {
      render(<FAQ />);

      FAQ_ITEMS.forEach((item) => {
        expect(screen.getByTestId(`faq-item-${item.id}`)).toBeInTheDocument();
      });
    });

    it('renders toggle all button', () => {
      render(<FAQ />);
      expect(screen.getByTestId('faq-toggle-all')).toBeInTheDocument();
      expect(screen.getByTestId('faq-toggle-all')).toHaveTextContent('Expand All');
    });

    it('groups items by category when no filter applied', () => {
      render(<FAQ />);

      // Should show category titles as headers for grouping
      const uniqueCategories = [...new Set(FAQ_ITEMS.map((item) => item.category))];
      const categoryHeaders = document.querySelectorAll('.faq__category-title');

      // Should have one header per unique category
      expect(categoryHeaders.length).toBe(uniqueCategories.length);

      // Each category title should appear in a header
      uniqueCategories.forEach((catId) => {
        const category = HELP_CATEGORIES.find((c) => c.id === catId);
        if (category) {
          const header = Array.from(categoryHeaders).find(
            (h) => h.textContent === category.title
          );
          expect(header).toBeInTheDocument();
        }
      });
    });
  });

  describe('category filtering', () => {
    it('filters items by category', () => {
      render(<FAQ category="analysis" />);

      const analysisFAQs = FAQ_ITEMS.filter((item) => item.category === 'analysis');
      const otherFAQs = FAQ_ITEMS.filter((item) => item.category !== 'analysis');

      analysisFAQs.forEach((item) => {
        expect(screen.getByTestId(`faq-item-${item.id}`)).toBeInTheDocument();
      });

      otherFAQs.forEach((item) => {
        expect(screen.queryByTestId(`faq-item-${item.id}`)).not.toBeInTheDocument();
      });
    });

    it('shows empty state when category has no items', () => {
      // Use a category that doesn't exist
      render(<FAQ category={'non-existent' as FAQProps['category']} />);
      expect(screen.getByText('No questions available for this category.')).toBeInTheDocument();
    });

    it('does not group by category when filter is applied', () => {
      render(<FAQ category="analysis" />);

      // Should not show the category title as a header when filtered
      const categoryHeaders = document.querySelectorAll('.faq__category-title');
      expect(categoryHeaders.length).toBe(0);
    });
  });

  describe('maxItems prop', () => {
    it('limits displayed items when maxItems is set', () => {
      render(<FAQ maxItems={3} />);

      const items = screen.getAllByTestId(/^faq-item-/);
      expect(items.length).toBe(3);
    });

    it('shows all items when maxItems is 0', () => {
      render(<FAQ maxItems={0} />);

      const items = screen.getAllByTestId(/^faq-item-/);
      expect(items.length).toBe(FAQ_ITEMS.length);
    });

    it('combines category filter and maxItems', () => {
      const analysisFAQs = FAQ_ITEMS.filter((item) => item.category === 'analysis');
      const limit = Math.min(2, analysisFAQs.length);

      render(<FAQ category="analysis" maxItems={limit} />);

      const items = screen.getAllByTestId(/^faq-item-/);
      expect(items.length).toBe(limit);
    });
  });

  describe('expand/collapse functionality', () => {
    it('expands an item when question is clicked', () => {
      render(<FAQ />);

      const firstItem = FAQ_ITEMS[0];
      const questionButton = screen.getByTestId(`faq-question-${firstItem.id}`);

      expect(questionButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(questionButton);

      expect(questionButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('collapses an expanded item when clicked again', () => {
      render(<FAQ />);

      const firstItem = FAQ_ITEMS[0];
      const questionButton = screen.getByTestId(`faq-question-${firstItem.id}`);

      // Expand
      fireEvent.click(questionButton);
      expect(questionButton).toHaveAttribute('aria-expanded', 'true');

      // Collapse
      fireEvent.click(questionButton);
      expect(questionButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('allows multiple items to be expanded simultaneously', () => {
      render(<FAQ />);

      const firstItem = FAQ_ITEMS[0];
      const secondItem = FAQ_ITEMS[1];

      const firstButton = screen.getByTestId(`faq-question-${firstItem.id}`);
      const secondButton = screen.getByTestId(`faq-question-${secondItem.id}`);

      fireEvent.click(firstButton);
      fireEvent.click(secondButton);

      expect(firstButton).toHaveAttribute('aria-expanded', 'true');
      expect(secondButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('expand all / collapse all', () => {
    it('expands all items when Expand All is clicked', () => {
      render(<FAQ />);

      const toggleButton = screen.getByTestId('faq-toggle-all');
      expect(toggleButton).toHaveTextContent('Expand All');

      fireEvent.click(toggleButton);

      expect(toggleButton).toHaveTextContent('Collapse All');

      FAQ_ITEMS.forEach((item) => {
        const questionButton = screen.getByTestId(`faq-question-${item.id}`);
        expect(questionButton).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('collapses all items when Collapse All is clicked', () => {
      render(<FAQ />);

      const toggleButton = screen.getByTestId('faq-toggle-all');

      // First expand all
      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveTextContent('Collapse All');

      // Then collapse all
      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveTextContent('Expand All');

      FAQ_ITEMS.forEach((item) => {
        const questionButton = screen.getByTestId(`faq-question-${item.id}`);
        expect(questionButton).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('changes button text when at least one item is expanded', () => {
      render(<FAQ />);

      const toggleButton = screen.getByTestId('faq-toggle-all');
      const firstItem = FAQ_ITEMS[0];
      const questionButton = screen.getByTestId(`faq-question-${firstItem.id}`);

      expect(toggleButton).toHaveTextContent('Expand All');

      fireEvent.click(questionButton);

      expect(toggleButton).toHaveTextContent('Collapse All');
    });
  });

  describe('accessibility', () => {
    it('uses aria-expanded on question buttons', () => {
      render(<FAQ />);

      const firstItem = FAQ_ITEMS[0];
      const questionButton = screen.getByTestId(`faq-question-${firstItem.id}`);

      expect(questionButton).toHaveAttribute('aria-expanded');
    });

    it('uses aria-controls to link question to answer', () => {
      render(<FAQ />);

      const firstItem = FAQ_ITEMS[0];
      const questionButton = screen.getByTestId(`faq-question-${firstItem.id}`);

      expect(questionButton).toHaveAttribute('aria-controls', `faq-answer-${firstItem.id}`);
    });

    it('uses aria-hidden on answer when collapsed', () => {
      render(<FAQ />);

      const firstItem = FAQ_ITEMS[0];
      const answer = document.getElementById(`faq-answer-${firstItem.id}`);

      expect(answer).toHaveAttribute('aria-hidden', 'true');
    });

    it('chevron icon is hidden from screen readers', () => {
      render(<FAQ />);

      const chevrons = document.querySelectorAll('.faq__chevron');
      chevrons.forEach((chevron) => {
        expect(chevron).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('content rendering', () => {
    it('renders question text', () => {
      render(<FAQ />);

      FAQ_ITEMS.forEach((item) => {
        expect(screen.getByText(item.question)).toBeInTheDocument();
      });
    });

    it('renders answer text', () => {
      render(<FAQ />);

      FAQ_ITEMS.forEach((item) => {
        // Answer is rendered but may be hidden
        const answerElement = document.getElementById(`faq-answer-${item.id}`);
        expect(answerElement).toBeInTheDocument();
      });
    });

    it('shows category badge in answer', () => {
      render(<FAQ />);

      // Expand first item to see badge
      const firstItem = FAQ_ITEMS[0];
      const questionButton = screen.getByTestId(`faq-question-${firstItem.id}`);
      fireEvent.click(questionButton);

      // Check for category badge within the answer element
      const answerElement = document.getElementById(`faq-answer-${firstItem.id}`);
      expect(answerElement).toBeInTheDocument();
      expect(answerElement?.querySelector('.faq__category-badge')).toBeInTheDocument();
    });
  });

  describe('onTopicSelect callback', () => {
    it('passes onTopicSelect prop to component', () => {
      const mockCallback = vi.fn();
      render(<FAQ onTopicSelect={mockCallback} />);

      // The component receives the prop (reserved for future use)
      expect(screen.getByTestId('faq')).toBeInTheDocument();
    });
  });

  describe('visual states', () => {
    it('applies expanded class to item when expanded', () => {
      render(<FAQ />);

      const firstItem = FAQ_ITEMS[0];
      const itemElement = screen.getByTestId(`faq-item-${firstItem.id}`);
      const questionButton = screen.getByTestId(`faq-question-${firstItem.id}`);

      expect(itemElement).not.toHaveClass('faq__item--expanded');

      fireEvent.click(questionButton);

      expect(itemElement).toHaveClass('faq__item--expanded');
    });

    it('applies expanded class to chevron when expanded', () => {
      render(<FAQ />);

      const firstItem = FAQ_ITEMS[0];
      const questionButton = screen.getByTestId(`faq-question-${firstItem.id}`);
      const chevron = questionButton.querySelector('.faq__chevron');

      expect(chevron).not.toHaveClass('faq__chevron--expanded');

      fireEvent.click(questionButton);

      expect(chevron).toHaveClass('faq__chevron--expanded');
    });
  });
});
