/**
 * Tests for DiffView Component
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { DiffView } from './DiffView';
import type { DiffViewProps } from './types';

describe('DiffView', () => {
  const defaultProps: DiffViewProps = {
    originalText: 'hello world',
    modifiedText: 'hello world',
  };

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders the container', () => {
      render(<DiffView {...defaultProps} />);

      expect(screen.getByTestId('diff-view')).toBeInTheDocument();
    });

    it('uses custom testId', () => {
      render(<DiffView {...defaultProps} testId="custom-diff-view" />);

      expect(screen.getByTestId('custom-diff-view')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<DiffView {...defaultProps} className="custom-class" />);

      const container = screen.getByTestId('diff-view');
      expect(container).toHaveClass('custom-class');
    });

    it('renders headers for both sides', () => {
      render(<DiffView {...defaultProps} />);

      expect(screen.getByText('Original')).toBeInTheDocument();
      expect(screen.getByText('Modified')).toBeInTheDocument();
    });
  });

  describe('identical texts', () => {
    it('shows identical class', () => {
      render(<DiffView {...defaultProps} />);

      const container = screen.getByTestId('diff-view');
      expect(container).toHaveClass('diff-view--identical');
    });

    it('does not show summary for identical texts', () => {
      render(<DiffView {...defaultProps} />);

      expect(screen.queryByTestId('diff-view-summary')).not.toBeInTheDocument();
    });

    it('shows same content on both sides', () => {
      render(<DiffView {...defaultProps} />);

      // Both sides should have the text
      const allText = screen.getAllByText('hello world');
      expect(allText.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('different texts', () => {
    it('shows changed class', () => {
      render(
        <DiffView
          originalText="hello world"
          modifiedText="hello there"
        />
      );

      const container = screen.getByTestId('diff-view');
      expect(container).toHaveClass('diff-view--changed');
    });

    it('shows summary for different texts', () => {
      render(
        <DiffView
          originalText="hello world"
          modifiedText="hello there"
        />
      );

      expect(screen.getByTestId('diff-view-summary')).toBeInTheDocument();
    });

    it('renders diff rows', () => {
      render(
        <DiffView
          originalText="line 1"
          modifiedText="line 2"
        />
      );

      // Should have at least one row
      expect(screen.getByTestId('diff-row-1')).toBeInTheDocument();
    });
  });

  describe('multiline content', () => {
    it('handles multiple lines', () => {
      render(
        <DiffView
          originalText="line 1\nline 2\nline 3"
          modifiedText="line 1\nmodified\nline 3"
        />
      );

      expect(screen.getByTestId('diff-view')).toBeInTheDocument();
    });

    it('shows line numbers', () => {
      render(
        <DiffView
          originalText="line 1\nline 2"
          modifiedText="line 1\nline 2"
        />
      );

      // Should show line numbers
      const lineNumbers = document.querySelectorAll('.diff-view__line-number');
      expect(lineNumbers.length).toBeGreaterThan(0);
    });
  });

  describe('accessibility', () => {
    it('has role="region"', () => {
      render(<DiffView {...defaultProps} />);

      const container = screen.getByTestId('diff-view');
      expect(container.getAttribute('role')).toBe('region');
    });

    it('has aria-label for identical texts', () => {
      render(<DiffView {...defaultProps} />);

      const container = screen.getByTestId('diff-view');
      expect(container.getAttribute('aria-label')).toBe('No changes between versions');
    });

    it('has descriptive aria-label for different texts', () => {
      render(
        <DiffView
          originalText="hello"
          modifiedText="goodbye"
        />
      );

      const container = screen.getByTestId('diff-view');
      const ariaLabel = container.getAttribute('aria-label');
      expect(ariaLabel).toContain('Side-by-side comparison');
    });
  });

  describe('empty content', () => {
    it('handles empty original text', () => {
      render(
        <DiffView
          originalText=""
          modifiedText="new content"
        />
      );

      expect(screen.getByTestId('diff-view')).toBeInTheDocument();
    });

    it('handles empty modified text', () => {
      render(
        <DiffView
          originalText="old content"
          modifiedText=""
        />
      );

      expect(screen.getByTestId('diff-view')).toBeInTheDocument();
    });

    it('shows empty message when both are empty', () => {
      render(
        <DiffView
          originalText=""
          modifiedText=""
        />
      );

      expect(screen.getByTestId('diff-view-empty')).toBeInTheDocument();
    });
  });

  describe('line additions and deletions', () => {
    it('handles added lines', () => {
      render(
        <DiffView
          originalText="line 1"
          modifiedText="line 1\nline 2"
        />
      );

      const container = screen.getByTestId('diff-view');
      expect(container).toHaveClass('diff-view--changed');
    });

    it('handles removed lines', () => {
      render(
        <DiffView
          originalText="line 1\nline 2"
          modifiedText="line 1"
        />
      );

      const container = screen.getByTestId('diff-view');
      expect(container).toHaveClass('diff-view--changed');
    });

    it('handles modified lines', () => {
      render(
        <DiffView
          originalText="hello world"
          modifiedText="hello there"
        />
      );

      const container = screen.getByTestId('diff-view');
      expect(container).toHaveClass('diff-view--changed');
    });
  });

  describe('summary display', () => {
    it('shows addition count', () => {
      render(
        <DiffView
          originalText=""
          modifiedText="new line"
        />
      );

      const summary = screen.getByTestId('diff-view-summary');
      expect(summary.textContent).toContain('addition');
    });

    it('shows removal count', () => {
      render(
        <DiffView
          originalText="old line"
          modifiedText=""
        />
      );

      const summary = screen.getByTestId('diff-view-summary');
      expect(summary.textContent).toContain('removal');
    });
  });
});
