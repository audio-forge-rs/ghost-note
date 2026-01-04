/**
 * Tests for SuggestionCard Component
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { SuggestionCard } from './SuggestionCard';
import type { SuggestionCardProps } from './types';
import type { LyricSuggestion } from './types';

describe('SuggestionCard', () => {
  const baseSuggestion: LyricSuggestion = {
    id: 'test-1',
    originalText: 'running through the night',
    suggestedText: 'running through the dark',
    reason: 'Better rhyme with "park"',
    category: 'rhyme',
    status: 'pending',
    lineNumber: 3,
    startPos: 0,
    endPos: 22,
  };

  const defaultProps: SuggestionCardProps = {
    suggestion: baseSuggestion,
    onAccept: vi.fn(),
    onReject: vi.fn(),
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the container', () => {
      render(<SuggestionCard {...defaultProps} />);

      expect(screen.getByTestId('suggestion-card')).toBeInTheDocument();
    });

    it('uses custom testId', () => {
      render(<SuggestionCard {...defaultProps} testId="custom-card" />);

      expect(screen.getByTestId('custom-card')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<SuggestionCard {...defaultProps} className="custom-class" />);

      const container = screen.getByTestId('suggestion-card');
      expect(container).toHaveClass('custom-class');
    });

    it('shows line reference', () => {
      render(<SuggestionCard {...defaultProps} />);

      expect(screen.getByText('Line 3')).toBeInTheDocument();
    });

    it('shows category badge', () => {
      render(<SuggestionCard {...defaultProps} />);

      // R for rhyme
      expect(screen.getByText('R')).toBeInTheDocument();
    });

    it('renders the diff', () => {
      render(<SuggestionCard {...defaultProps} />);

      expect(screen.getByTestId('suggestion-card-diff')).toBeInTheDocument();
    });
  });

  describe('status variants', () => {
    it('shows pending status class', () => {
      render(<SuggestionCard {...defaultProps} />);

      const container = screen.getByTestId('suggestion-card');
      expect(container).toHaveClass('suggestion-card--pending');
    });

    it('shows accepted status class', () => {
      render(
        <SuggestionCard
          {...defaultProps}
          suggestion={{ ...baseSuggestion, status: 'accepted' }}
        />
      );

      const container = screen.getByTestId('suggestion-card');
      expect(container).toHaveClass('suggestion-card--accepted');
    });

    it('shows rejected status class', () => {
      render(
        <SuggestionCard
          {...defaultProps}
          suggestion={{ ...baseSuggestion, status: 'rejected' }}
        />
      );

      const container = screen.getByTestId('suggestion-card');
      expect(container).toHaveClass('suggestion-card--rejected');
    });

    it('shows status indicator for accepted', () => {
      render(
        <SuggestionCard
          {...defaultProps}
          suggestion={{ ...baseSuggestion, status: 'accepted' }}
        />
      );

      expect(screen.getByText('Accepted')).toBeInTheDocument();
    });

    it('shows status indicator for rejected', () => {
      render(
        <SuggestionCard
          {...defaultProps}
          suggestion={{ ...baseSuggestion, status: 'rejected' }}
        />
      );

      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });

    it('does not show status indicator for pending', () => {
      render(<SuggestionCard {...defaultProps} />);

      expect(screen.queryByText('Pending')).not.toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    it('shows accept and reject buttons for pending', () => {
      render(<SuggestionCard {...defaultProps} />);

      expect(screen.getByTestId('suggestion-card-accept')).toBeInTheDocument();
      expect(screen.getByTestId('suggestion-card-reject')).toBeInTheDocument();
    });

    it('hides action buttons for accepted', () => {
      render(
        <SuggestionCard
          {...defaultProps}
          suggestion={{ ...baseSuggestion, status: 'accepted' }}
        />
      );

      expect(screen.queryByTestId('suggestion-card-accept')).not.toBeInTheDocument();
      expect(screen.queryByTestId('suggestion-card-reject')).not.toBeInTheDocument();
    });

    it('hides action buttons for rejected', () => {
      render(
        <SuggestionCard
          {...defaultProps}
          suggestion={{ ...baseSuggestion, status: 'rejected' }}
        />
      );

      expect(screen.queryByTestId('suggestion-card-accept')).not.toBeInTheDocument();
      expect(screen.queryByTestId('suggestion-card-reject')).not.toBeInTheDocument();
    });

    it('calls onAccept when accept button is clicked', () => {
      const onAccept = vi.fn();
      render(<SuggestionCard {...defaultProps} onAccept={onAccept} />);

      fireEvent.click(screen.getByTestId('suggestion-card-accept'));

      expect(onAccept).toHaveBeenCalledWith('test-1');
      expect(onAccept).toHaveBeenCalledTimes(1);
    });

    it('calls onReject when reject button is clicked', () => {
      const onReject = vi.fn();
      render(<SuggestionCard {...defaultProps} onReject={onReject} />);

      fireEvent.click(screen.getByTestId('suggestion-card-reject'));

      expect(onReject).toHaveBeenCalledWith('test-1');
      expect(onReject).toHaveBeenCalledTimes(1);
    });
  });

  describe('expansion', () => {
    it('is not expanded by default', () => {
      render(<SuggestionCard {...defaultProps} />);

      const container = screen.getByTestId('suggestion-card');
      expect(container).not.toHaveClass('suggestion-card--expanded');
    });

    it('is expanded when expanded prop is true', () => {
      render(<SuggestionCard {...defaultProps} expanded />);

      const container = screen.getByTestId('suggestion-card');
      expect(container).toHaveClass('suggestion-card--expanded');
    });

    it('calls onToggleExpand when header is clicked', () => {
      const onToggleExpand = vi.fn();
      render(
        <SuggestionCard {...defaultProps} onToggleExpand={onToggleExpand} />
      );

      const header = document.querySelector('.suggestion-card__header');
      fireEvent.click(header!);

      expect(onToggleExpand).toHaveBeenCalledWith('test-1');
    });

    it('shows expand icon when onToggleExpand is provided', () => {
      render(
        <SuggestionCard {...defaultProps} onToggleExpand={vi.fn()} />
      );

      const icon = document.querySelector('.suggestion-card__expand-icon');
      expect(icon).toBeInTheDocument();
    });

    it('hides expand icon when onToggleExpand is not provided', () => {
      render(<SuggestionCard {...defaultProps} />);

      const icon = document.querySelector('.suggestion-card__expand-icon');
      expect(icon).not.toBeInTheDocument();
    });
  });

  describe('reason section', () => {
    it('shows reason when expanded', () => {
      render(
        <SuggestionCard
          {...defaultProps}
          expanded
          onToggleExpand={vi.fn()}
        />
      );

      expect(screen.getByTestId('suggestion-card-reason')).toBeInTheDocument();
      expect(screen.getByText('Better rhyme with "park"')).toBeInTheDocument();
    });

    it('hides reason when not expanded and onToggleExpand provided', () => {
      render(
        <SuggestionCard
          {...defaultProps}
          expanded={false}
          onToggleExpand={vi.fn()}
        />
      );

      expect(screen.queryByTestId('suggestion-card-reason')).not.toBeInTheDocument();
    });

    it('always shows reason when onToggleExpand not provided', () => {
      render(<SuggestionCard {...defaultProps} />);

      expect(screen.getByTestId('suggestion-card-reason')).toBeInTheDocument();
    });
  });

  describe('categories', () => {
    it('shows S for singability', () => {
      render(
        <SuggestionCard
          {...defaultProps}
          suggestion={{ ...baseSuggestion, category: 'singability' }}
        />
      );

      expect(screen.getByText('S')).toBeInTheDocument();
    });

    it('shows M for meter', () => {
      render(
        <SuggestionCard
          {...defaultProps}
          suggestion={{ ...baseSuggestion, category: 'meter' }}
        />
      );

      expect(screen.getByText('M')).toBeInTheDocument();
    });

    it('shows R for rhyme', () => {
      render(
        <SuggestionCard
          {...defaultProps}
          suggestion={{ ...baseSuggestion, category: 'rhyme' }}
        />
      );

      expect(screen.getByText('R')).toBeInTheDocument();
    });

    it('shows C for clarity', () => {
      render(
        <SuggestionCard
          {...defaultProps}
          suggestion={{ ...baseSuggestion, category: 'clarity' }}
        />
      );

      expect(screen.getByText('C')).toBeInTheDocument();
    });

    it('shows ? for other', () => {
      render(
        <SuggestionCard
          {...defaultProps}
          suggestion={{ ...baseSuggestion, category: 'other' }}
        />
      );

      expect(screen.getByText('?')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has role="article"', () => {
      render(<SuggestionCard {...defaultProps} />);

      const container = screen.getByTestId('suggestion-card');
      expect(container.getAttribute('role')).toBe('article');
    });

    it('has descriptive aria-label', () => {
      render(<SuggestionCard {...defaultProps} />);

      const container = screen.getByTestId('suggestion-card');
      const ariaLabel = container.getAttribute('aria-label');
      expect(ariaLabel).toContain('Suggestion for line 3');
      expect(ariaLabel).toContain('pending');
    });

    it('has aria-label for accept button', () => {
      render(<SuggestionCard {...defaultProps} />);

      const acceptBtn = screen.getByTestId('suggestion-card-accept');
      expect(acceptBtn.getAttribute('aria-label')).toContain('Accept suggestion');
    });

    it('has aria-label for reject button', () => {
      render(<SuggestionCard {...defaultProps} />);

      const rejectBtn = screen.getByTestId('suggestion-card-reject');
      expect(rejectBtn.getAttribute('aria-label')).toContain('Reject suggestion');
    });

    it('header is keyboard accessible when expandable', () => {
      const onToggleExpand = vi.fn();
      render(
        <SuggestionCard {...defaultProps} onToggleExpand={onToggleExpand} />
      );

      const header = document.querySelector('.suggestion-card__header');
      expect(header?.getAttribute('role')).toBe('button');
      expect(header?.getAttribute('tabindex')).toBe('0');
    });

    it('responds to Enter key on header', () => {
      const onToggleExpand = vi.fn();
      render(
        <SuggestionCard {...defaultProps} onToggleExpand={onToggleExpand} />
      );

      const header = document.querySelector('.suggestion-card__header');
      fireEvent.keyDown(header!, { key: 'Enter' });

      expect(onToggleExpand).toHaveBeenCalledWith('test-1');
    });

    it('responds to Space key on header', () => {
      const onToggleExpand = vi.fn();
      render(
        <SuggestionCard {...defaultProps} onToggleExpand={onToggleExpand} />
      );

      const header = document.querySelector('.suggestion-card__header');
      fireEvent.keyDown(header!, { key: ' ' });

      expect(onToggleExpand).toHaveBeenCalledWith('test-1');
    });
  });
});
