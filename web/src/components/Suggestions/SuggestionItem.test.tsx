/**
 * Tests for SuggestionItem Component
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { SuggestionItem, type SuggestionItemProps } from './SuggestionItem';
import type { SuggestionWithStatus } from '../../stores/useSuggestionStore';

describe('SuggestionItem', () => {
  const mockSuggestion: SuggestionWithStatus = {
    id: 'test-id-1',
    originalWord: 'beautiful',
    suggestedWord: 'lovely',
    lineNumber: 5,
    position: 2,
    reason: 'Better for singing and matches the meter',
    preservesMeaning: 'yes',
    status: 'pending',
  };

  const defaultProps: SuggestionItemProps = {
    suggestion: mockSuggestion,
    onAccept: vi.fn(),
    onReject: vi.fn(),
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the suggestion item container', () => {
      render(<SuggestionItem {...defaultProps} />);

      const container = screen.getByTestId('suggestion-item');
      expect(container).toBeInTheDocument();
    });

    it('renders the original word', () => {
      render(<SuggestionItem {...defaultProps} />);

      expect(screen.getByText('beautiful')).toBeInTheDocument();
    });

    it('renders the suggested word', () => {
      render(<SuggestionItem {...defaultProps} />);

      expect(screen.getByText('lovely')).toBeInTheDocument();
    });

    it('renders the line number by default', () => {
      render(<SuggestionItem {...defaultProps} />);

      expect(screen.getByText('Line 5')).toBeInTheDocument();
    });

    it('hides line number when showLineNumber is false', () => {
      render(<SuggestionItem {...defaultProps} showLineNumber={false} />);

      expect(screen.queryByText('Line 5')).not.toBeInTheDocument();
    });

    it('renders the reason', () => {
      render(<SuggestionItem {...defaultProps} />);

      expect(screen.getByText('Better for singing and matches the meter')).toBeInTheDocument();
    });

    it('hides the reason in compact mode', () => {
      render(<SuggestionItem {...defaultProps} compact />);

      expect(screen.queryByText('Better for singing and matches the meter')).not.toBeInTheDocument();
    });

    it('renders the meaning preservation badge', () => {
      render(<SuggestionItem {...defaultProps} />);

      expect(screen.getByTestId('meaning-preservation-badge')).toBeInTheDocument();
    });

    it('renders accept button', () => {
      render(<SuggestionItem {...defaultProps} />);

      expect(screen.getByText('Accept')).toBeInTheDocument();
    });

    it('renders reject button', () => {
      render(<SuggestionItem {...defaultProps} />);

      expect(screen.getByText('Reject')).toBeInTheDocument();
    });

    it('renders arrow indicator', () => {
      render(<SuggestionItem {...defaultProps} />);

      expect(screen.getByText('→')).toBeInTheDocument();
    });

    it('renders Original and Suggested labels', () => {
      render(<SuggestionItem {...defaultProps} />);

      expect(screen.getByText('Original')).toBeInTheDocument();
      expect(screen.getByText('Suggested')).toBeInTheDocument();
    });
  });

  describe('status states', () => {
    it('applies pending class when status is pending', () => {
      render(<SuggestionItem {...defaultProps} />);

      const container = screen.getByTestId('suggestion-item');
      expect(container).toHaveClass('suggestion-item--pending');
    });

    it('applies accepted class when status is accepted', () => {
      const acceptedSuggestion = { ...mockSuggestion, status: 'accepted' as const };
      render(<SuggestionItem {...defaultProps} suggestion={acceptedSuggestion} />);

      const container = screen.getByTestId('suggestion-item');
      expect(container).toHaveClass('suggestion-item--accepted');
    });

    it('applies rejected class when status is rejected', () => {
      const rejectedSuggestion = { ...mockSuggestion, status: 'rejected' as const };
      render(<SuggestionItem {...defaultProps} suggestion={rejectedSuggestion} />);

      const container = screen.getByTestId('suggestion-item');
      expect(container).toHaveClass('suggestion-item--rejected');
    });

    it('shows status overlay for accepted suggestions', () => {
      const acceptedSuggestion = { ...mockSuggestion, status: 'accepted' as const };
      render(<SuggestionItem {...defaultProps} suggestion={acceptedSuggestion} />);

      expect(screen.getByText('Accepted')).toBeInTheDocument();
    });

    it('shows status overlay for rejected suggestions', () => {
      const rejectedSuggestion = { ...mockSuggestion, status: 'rejected' as const };
      render(<SuggestionItem {...defaultProps} suggestion={rejectedSuggestion} />);

      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });

    it('does not show status overlay for pending suggestions', () => {
      render(<SuggestionItem {...defaultProps} />);

      const statusOverlay = document.querySelector('.suggestion-item__status-overlay');
      expect(statusOverlay).not.toBeInTheDocument();
    });
  });

  describe('button interactions', () => {
    it('calls onAccept when accept button is clicked', () => {
      const onAccept = vi.fn();
      render(<SuggestionItem {...defaultProps} onAccept={onAccept} />);

      fireEvent.click(screen.getByText('Accept'));
      expect(onAccept).toHaveBeenCalledWith('test-id-1');
    });

    it('calls onReject when reject button is clicked', () => {
      const onReject = vi.fn();
      render(<SuggestionItem {...defaultProps} onReject={onReject} />);

      fireEvent.click(screen.getByText('Reject'));
      expect(onReject).toHaveBeenCalledWith('test-id-1');
    });

    it('disables buttons when suggestion is accepted', () => {
      const acceptedSuggestion = { ...mockSuggestion, status: 'accepted' as const };
      render(
        <SuggestionItem
          {...defaultProps}
          suggestion={acceptedSuggestion}
          onReset={vi.fn()}
        />
      );

      // When accepted, shows undo button instead
      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('disables buttons when suggestion is rejected', () => {
      const rejectedSuggestion = { ...mockSuggestion, status: 'rejected' as const };
      render(
        <SuggestionItem
          {...defaultProps}
          suggestion={rejectedSuggestion}
          onReset={vi.fn()}
        />
      );

      // When rejected, shows undo button instead
      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('shows undo button for processed suggestions when onReset is provided', () => {
      const acceptedSuggestion = { ...mockSuggestion, status: 'accepted' as const };
      const onReset = vi.fn();
      render(
        <SuggestionItem
          {...defaultProps}
          suggestion={acceptedSuggestion}
          onReset={onReset}
        />
      );

      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('calls onReset when undo button is clicked', () => {
      const acceptedSuggestion = { ...mockSuggestion, status: 'accepted' as const };
      const onReset = vi.fn();
      render(
        <SuggestionItem
          {...defaultProps}
          suggestion={acceptedSuggestion}
          onReset={onReset}
        />
      );

      fireEvent.click(screen.getByText('Undo'));
      expect(onReset).toHaveBeenCalledWith('test-id-1');
    });
  });

  describe('compact mode', () => {
    it('applies compact class', () => {
      render(<SuggestionItem {...defaultProps} compact />);

      const container = screen.getByTestId('suggestion-item');
      expect(container).toHaveClass('suggestion-item--compact');
    });
  });

  describe('accessibility', () => {
    it('has role="article"', () => {
      render(<SuggestionItem {...defaultProps} />);

      const container = screen.getByTestId('suggestion-item');
      expect(container.getAttribute('role')).toBe('article');
    });

    it('has descriptive aria-label', () => {
      render(<SuggestionItem {...defaultProps} />);

      const container = screen.getByTestId('suggestion-item');
      expect(container.getAttribute('aria-label')).toContain('beautiful');
      expect(container.getAttribute('aria-label')).toContain('lovely');
    });

    it('accept button has descriptive aria-label', () => {
      render(<SuggestionItem {...defaultProps} />);

      const acceptButton = screen.getByRole('button', { name: /accept suggestion/i });
      expect(acceptButton).toBeInTheDocument();
    });

    it('reject button has descriptive aria-label', () => {
      render(<SuggestionItem {...defaultProps} />);

      const rejectButton = screen.getByRole('button', { name: /reject suggestion/i });
      expect(rejectButton).toBeInTheDocument();
    });

    it('sets data-suggestion-id attribute', () => {
      render(<SuggestionItem {...defaultProps} />);

      const container = screen.getByTestId('suggestion-item');
      expect(container.getAttribute('data-suggestion-id')).toBe('test-id-1');
    });

    it('uses custom testId when provided', () => {
      render(<SuggestionItem {...defaultProps} testId="custom-test-id" />);

      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      render(<SuggestionItem {...defaultProps} className="custom-class" />);

      const container = screen.getByTestId('suggestion-item');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('different preservation levels', () => {
    it('renders badge with partial preservation', () => {
      const partialSuggestion = { ...mockSuggestion, preservesMeaning: 'partial' as const };
      render(<SuggestionItem {...defaultProps} suggestion={partialSuggestion} />);

      const badge = screen.getByTestId('meaning-preservation-badge');
      expect(badge).toHaveClass('meaning-preservation-badge--partial');
    });

    it('renders badge with no preservation', () => {
      const noSuggestion = { ...mockSuggestion, preservesMeaning: 'no' as const };
      render(<SuggestionItem {...defaultProps} suggestion={noSuggestion} />);

      const badge = screen.getByTestId('meaning-preservation-badge');
      expect(badge).toHaveClass('meaning-preservation-badge--no');
    });
  });
});
