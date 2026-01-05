/**
 * Tests for HelpPanel Component
 *
 * @module components/Help/HelpPanel.test
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { HelpPanel, type HelpPanelProps } from './HelpPanel';
import { HELP_CATEGORIES, HELP_TOPICS, getTopicsByCategory } from './helpContent';

// Mock useFocusTrap hook
vi.mock('@/hooks', () => ({
  useFocusTrap: vi.fn(() => ({
    containerRef: { current: null },
  })),
}));

describe('HelpPanel', () => {
  const defaultProps: HelpPanelProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    document.body.style.overflow = '';
  });

  describe('rendering', () => {
    it('renders nothing when closed', () => {
      render(<HelpPanel {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId('help-panel')).not.toBeInTheDocument();
    });

    it('renders the panel when open', () => {
      render(<HelpPanel {...defaultProps} />);
      expect(screen.getByTestId('help-panel')).toBeInTheDocument();
    });

    it('renders the overlay', () => {
      render(<HelpPanel {...defaultProps} />);
      expect(screen.getByTestId('help-panel-overlay')).toBeInTheDocument();
    });

    it('renders Help Center title initially', () => {
      render(<HelpPanel {...defaultProps} />);
      expect(screen.getByText('Help Center')).toBeInTheDocument();
    });

    it('renders the close button', () => {
      render(<HelpPanel {...defaultProps} />);
      expect(screen.getByTestId('help-close-button')).toBeInTheDocument();
    });

    it('renders the search input', () => {
      render(<HelpPanel {...defaultProps} />);
      expect(screen.getByTestId('help-search-input')).toBeInTheDocument();
    });

    it('renders footer with keyboard hint', () => {
      render(<HelpPanel {...defaultProps} />);
      expect(screen.getByText(/Press/)).toBeInTheDocument();
      expect(screen.getByText('?')).toBeInTheDocument();
    });
  });

  describe('categories view', () => {
    it('renders all help categories', () => {
      render(<HelpPanel {...defaultProps} />);

      HELP_CATEGORIES.forEach((category) => {
        expect(screen.getByTestId(`help-category-${category.id}`)).toBeInTheDocument();
      });
    });

    it('renders FAQ link', () => {
      render(<HelpPanel {...defaultProps} />);
      expect(screen.getByTestId('help-faq-link')).toBeInTheDocument();
    });

    it('displays category titles', () => {
      render(<HelpPanel {...defaultProps} />);

      HELP_CATEGORIES.forEach((category) => {
        expect(screen.getByText(category.title)).toBeInTheDocument();
      });
    });

    it('displays category descriptions', () => {
      render(<HelpPanel {...defaultProps} />);

      HELP_CATEGORIES.forEach((category) => {
        expect(screen.getByText(category.description)).toBeInTheDocument();
      });
    });
  });

  describe('category navigation', () => {
    it('shows topics when category is clicked', () => {
      render(<HelpPanel {...defaultProps} />);

      const firstCategory = HELP_CATEGORIES[0];
      fireEvent.click(screen.getByTestId(`help-category-${firstCategory.id}`));

      // Should show category title in header
      expect(screen.getByText(firstCategory.title)).toBeInTheDocument();

      // Should show topics for that category
      const topics = getTopicsByCategory(firstCategory.id);
      topics.forEach((topic) => {
        expect(screen.getByTestId(`help-topic-${topic.id}`)).toBeInTheDocument();
      });
    });

    it('shows back button after selecting category', () => {
      render(<HelpPanel {...defaultProps} />);

      const firstCategory = HELP_CATEGORIES[0];
      fireEvent.click(screen.getByTestId(`help-category-${firstCategory.id}`));

      expect(screen.getByTestId('help-back-button')).toBeInTheDocument();
    });

    it('returns to categories when back is clicked from topics', () => {
      render(<HelpPanel {...defaultProps} />);

      const firstCategory = HELP_CATEGORIES[0];
      fireEvent.click(screen.getByTestId(`help-category-${firstCategory.id}`));
      fireEvent.click(screen.getByTestId('help-back-button'));

      expect(screen.getByText('Help Center')).toBeInTheDocument();
      HELP_CATEGORIES.forEach((category) => {
        expect(screen.getByTestId(`help-category-${category.id}`)).toBeInTheDocument();
      });
    });
  });

  describe('topic navigation', () => {
    it('shows topic detail when topic is clicked', () => {
      render(<HelpPanel {...defaultProps} />);

      const firstCategory = HELP_CATEGORIES[0];
      fireEvent.click(screen.getByTestId(`help-category-${firstCategory.id}`));

      const topics = getTopicsByCategory(firstCategory.id);
      const firstTopic = topics[0];
      fireEvent.click(screen.getByTestId(`help-topic-${firstTopic.id}`));

      // Should show topic detail via HelpSection test ID
      expect(screen.getByTestId(`help-section-${firstTopic.id}`)).toBeInTheDocument();
    });

    it('returns to topics list when back is clicked from topic', () => {
      render(<HelpPanel {...defaultProps} />);

      const firstCategory = HELP_CATEGORIES[0];
      fireEvent.click(screen.getByTestId(`help-category-${firstCategory.id}`));

      const topics = getTopicsByCategory(firstCategory.id);
      fireEvent.click(screen.getByTestId(`help-topic-${topics[0].id}`));
      fireEvent.click(screen.getByTestId('help-back-button'));

      // Should show topics list again
      topics.forEach((topic) => {
        expect(screen.getByTestId(`help-topic-${topic.id}`)).toBeInTheDocument();
      });
    });

    it('navigates to related topic from HelpSection', () => {
      render(<HelpPanel {...defaultProps} />);

      // Find a topic with related topics
      const topicWithRelated = HELP_TOPICS.find((t) => t.related && t.related.length > 0);
      if (!topicWithRelated) return;

      // Navigate to the topic
      fireEvent.click(screen.getByTestId(`help-category-${topicWithRelated.category}`));
      fireEvent.click(screen.getByTestId(`help-topic-${topicWithRelated.id}`));

      // Click a related topic
      const relatedId = topicWithRelated.related![0];
      const relatedButton = screen.getByTestId(`help-related-${relatedId}`);
      fireEvent.click(relatedButton);

      // Should now show the related topic
      const relatedTopic = HELP_TOPICS.find((t) => t.id === relatedId);
      if (relatedTopic) {
        expect(screen.getByText(relatedTopic.summary)).toBeInTheDocument();
      }
    });
  });

  describe('FAQ view', () => {
    it('shows FAQ when FAQ link is clicked', () => {
      render(<HelpPanel {...defaultProps} />);

      fireEvent.click(screen.getByTestId('help-faq-link'));

      expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
      expect(screen.getByTestId('faq')).toBeInTheDocument();
    });

    it('returns to categories when back is clicked from FAQ', () => {
      render(<HelpPanel {...defaultProps} />);

      fireEvent.click(screen.getByTestId('help-faq-link'));
      fireEvent.click(screen.getByTestId('help-back-button'));

      expect(screen.getByText('Help Center')).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('searches topics when typing in search input', () => {
      render(<HelpPanel {...defaultProps} />);

      const searchInput = screen.getByTestId('help-search-input');
      fireEvent.change(searchInput, { target: { value: 'melody' } });

      expect(screen.getByText('Search Results')).toBeInTheDocument();
    });

    it('shows result count', () => {
      render(<HelpPanel {...defaultProps} />);

      const searchInput = screen.getByTestId('help-search-input');
      fireEvent.change(searchInput, { target: { value: 'melody' } });

      expect(screen.getByText(/result/)).toBeInTheDocument();
    });

    it('shows no results message for non-matching query', () => {
      render(<HelpPanel {...defaultProps} />);

      const searchInput = screen.getByTestId('help-search-input');
      fireEvent.change(searchInput, { target: { value: 'xyznonexistent123' } });

      expect(screen.getByText(/No results found/)).toBeInTheDocument();
    });

    it('returns to categories when search is cleared', () => {
      render(<HelpPanel {...defaultProps} />);

      const searchInput = screen.getByTestId('help-search-input');
      fireEvent.change(searchInput, { target: { value: 'melody' } });
      fireEvent.change(searchInput, { target: { value: '' } });

      expect(screen.getByText('Help Center')).toBeInTheDocument();
    });

    it('clears search when back is clicked', () => {
      render(<HelpPanel {...defaultProps} />);

      const searchInput = screen.getByTestId('help-search-input');
      fireEvent.change(searchInput, { target: { value: 'melody' } });
      fireEvent.click(screen.getByTestId('help-back-button'));

      expect(searchInput).toHaveValue('');
      expect(screen.getByText('Help Center')).toBeInTheDocument();
    });

    it('can navigate to topic from search results', () => {
      render(<HelpPanel {...defaultProps} />);

      const searchInput = screen.getByTestId('help-search-input');
      fireEvent.change(searchInput, { target: { value: 'Ghost Note' } });

      // Click on a search result
      const firstResult = screen.getByTestId('help-search-result-what-is-ghost-note');
      fireEvent.click(firstResult);

      // Should show topic detail - verify via the test ID for HelpSection
      expect(screen.getByTestId('help-section-what-is-ghost-note')).toBeInTheDocument();
    });
  });

  describe('initial props', () => {
    it('opens to categories view initially', () => {
      render(<HelpPanel {...defaultProps} initialCategory="analysis" />);

      // Open panel should start at categories view
      expect(screen.getByText('Help Center')).toBeInTheDocument();
    });

    it('accepts initialTopic prop', () => {
      // The initialTopic prop is used to navigate to a topic on open transition
      // For a fresh render, it's processed when the panel opens
      render(<HelpPanel {...defaultProps} initialTopic="what-is-ghost-note" />);

      // Panel should render and accept the prop
      expect(screen.getByTestId('help-panel')).toBeInTheDocument();
    });
  });

  describe('close behavior', () => {
    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<HelpPanel isOpen={true} onClose={onClose} />);

      fireEvent.click(screen.getByTestId('help-close-button'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when overlay is clicked', () => {
      const onClose = vi.fn();
      render(<HelpPanel isOpen={true} onClose={onClose} />);

      fireEvent.click(screen.getByTestId('help-panel-overlay'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when panel content is clicked', () => {
      const onClose = vi.fn();
      render(<HelpPanel isOpen={true} onClose={onClose} />);

      fireEvent.click(screen.getByTestId('help-panel'));

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('body scroll prevention', () => {
    it('prevents body scroll when open', () => {
      render(<HelpPanel {...defaultProps} />);

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', () => {
      const { rerender } = render(<HelpPanel {...defaultProps} />);

      expect(document.body.style.overflow).toBe('hidden');

      rerender(<HelpPanel {...defaultProps} isOpen={false} />);

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('state reset on close/open', () => {
    it('resets to categories view when reopened', async () => {
      const { rerender } = render(<HelpPanel {...defaultProps} />);

      // Navigate to a category
      fireEvent.click(screen.getByTestId(`help-category-${HELP_CATEGORIES[0].id}`));

      // Close panel
      rerender(<HelpPanel {...defaultProps} isOpen={false} />);

      // Reopen panel
      rerender(<HelpPanel {...defaultProps} isOpen={true} />);

      // Should be back at categories
      expect(screen.getByText('Help Center')).toBeInTheDocument();
    });

    it('clears search when reopened', async () => {
      const { rerender } = render(<HelpPanel {...defaultProps} />);

      // Perform a search
      const searchInput = screen.getByTestId('help-search-input');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Close panel
      rerender(<HelpPanel {...defaultProps} isOpen={false} />);

      // Reopen panel
      rerender(<HelpPanel {...defaultProps} isOpen={true} />);

      // Search should be cleared
      expect(screen.getByTestId('help-search-input')).toHaveValue('');
    });
  });

  describe('accessibility', () => {
    it('has role="dialog"', () => {
      render(<HelpPanel {...defaultProps} />);

      expect(screen.getByTestId('help-panel')).toHaveAttribute('role', 'dialog');
    });

    it('has aria-modal="true"', () => {
      render(<HelpPanel {...defaultProps} />);

      expect(screen.getByTestId('help-panel')).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-labelledby pointing to title', () => {
      render(<HelpPanel {...defaultProps} />);

      expect(screen.getByTestId('help-panel')).toHaveAttribute(
        'aria-labelledby',
        'help-panel-title'
      );
    });

    it('close button has aria-label', () => {
      render(<HelpPanel {...defaultProps} />);

      expect(screen.getByTestId('help-close-button')).toHaveAttribute(
        'aria-label',
        'Close help'
      );
    });

    it('back button has aria-label', () => {
      render(<HelpPanel {...defaultProps} />);

      fireEvent.click(screen.getByTestId(`help-category-${HELP_CATEGORIES[0].id}`));

      expect(screen.getByTestId('help-back-button')).toHaveAttribute(
        'aria-label',
        'Go back'
      );
    });

    it('search input has aria-label', () => {
      render(<HelpPanel {...defaultProps} />);

      expect(screen.getByTestId('help-search-input')).toHaveAttribute(
        'aria-label',
        'Search help topics'
      );
    });
  });

  describe('topic display', () => {
    it('shows topic summaries in list view', () => {
      render(<HelpPanel {...defaultProps} />);

      const firstCategory = HELP_CATEGORIES[0];
      fireEvent.click(screen.getByTestId(`help-category-${firstCategory.id}`));

      const topics = getTopicsByCategory(firstCategory.id);
      topics.forEach((topic) => {
        expect(screen.getByText(topic.summary)).toBeInTheDocument();
      });
    });

    it('shows topic category badge in search results', () => {
      render(<HelpPanel {...defaultProps} />);

      const searchInput = screen.getByTestId('help-search-input');
      fireEvent.change(searchInput, { target: { value: 'melody' } });

      // Search results should show the category badge
      const categoryBadges = document.querySelectorAll('.help-panel__topic-category');
      expect(categoryBadges.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('handles rapid category switching', () => {
      render(<HelpPanel {...defaultProps} />);

      HELP_CATEGORIES.forEach((category) => {
        fireEvent.click(screen.getByTestId(`help-category-${category.id}`));
        fireEvent.click(screen.getByTestId('help-back-button'));
      });

      expect(screen.getByText('Help Center')).toBeInTheDocument();
    });

    it('handles opening panel multiple times', () => {
      const { rerender } = render(<HelpPanel {...defaultProps} isOpen={false} />);

      for (let i = 0; i < 5; i++) {
        rerender(<HelpPanel {...defaultProps} isOpen={true} />);
        rerender(<HelpPanel {...defaultProps} isOpen={false} />);
      }

      rerender(<HelpPanel {...defaultProps} isOpen={true} />);
      expect(screen.getByTestId('help-panel')).toBeInTheDocument();
    });

    it('handles empty search results gracefully', () => {
      render(<HelpPanel {...defaultProps} />);

      const searchInput = screen.getByTestId('help-search-input');
      fireEvent.change(searchInput, { target: { value: 'zzznonexistent999' } });

      expect(screen.getByText(/No results found/)).toBeInTheDocument();
      expect(screen.getByText(/Try different keywords/)).toBeInTheDocument();
    });
  });
});
