/**
 * Tests for InlineDiff Component
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { InlineDiff } from './InlineDiff';
import type { InlineDiffProps } from './types';

describe('InlineDiff', () => {
  const defaultProps: InlineDiffProps = {
    originalText: 'hello world',
    modifiedText: 'hello world',
  };

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders the container', () => {
      render(<InlineDiff {...defaultProps} />);

      expect(screen.getByTestId('inline-diff')).toBeInTheDocument();
    });

    it('uses custom testId', () => {
      render(<InlineDiff {...defaultProps} testId="custom-diff" />);

      expect(screen.getByTestId('custom-diff')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<InlineDiff {...defaultProps} className="custom-class" />);

      const container = screen.getByTestId('inline-diff');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('identical texts', () => {
    it('shows no changes message for identical texts', () => {
      render(<InlineDiff {...defaultProps} />);

      const container = screen.getByTestId('inline-diff');
      expect(container).toHaveClass('inline-diff--identical');
    });

    it('does not show summary for identical texts', () => {
      render(<InlineDiff {...defaultProps} />);

      expect(screen.queryByTestId('inline-diff-summary')).not.toBeInTheDocument();
    });

    it('displays the original text', () => {
      render(<InlineDiff {...defaultProps} />);

      expect(screen.getByText('hello world')).toBeInTheDocument();
    });
  });

  describe('different texts', () => {
    it('shows changed class for different texts', () => {
      render(
        <InlineDiff
          originalText="hello world"
          modifiedText="hello there"
        />
      );

      const container = screen.getByTestId('inline-diff');
      expect(container).toHaveClass('inline-diff--changed');
    });

    it('shows summary for different texts', () => {
      render(
        <InlineDiff
          originalText="hello world"
          modifiedText="hello there"
        />
      );

      expect(screen.getByTestId('inline-diff-summary')).toBeInTheDocument();
    });

    it('renders diff segments', () => {
      render(
        <InlineDiff
          originalText="hello world"
          modifiedText="hello there"
        />
      );

      // Should have at least one segment
      expect(screen.getByTestId('diff-segment-0')).toBeInTheDocument();
    });
  });

  describe('line numbers', () => {
    it('does not show line numbers by default', () => {
      render(<InlineDiff {...defaultProps} />);

      const container = screen.getByTestId('inline-diff');
      expect(container).not.toHaveClass('inline-diff--with-line-numbers');
    });

    it('shows line numbers when enabled', () => {
      render(
        <InlineDiff
          originalText="line 1\nline 2"
          modifiedText="line 1\nline 2"
          showLineNumbers
        />
      );

      const container = screen.getByTestId('inline-diff');
      expect(container).toHaveClass('inline-diff--with-line-numbers');
    });
  });

  describe('accessibility', () => {
    it('has role="region"', () => {
      render(<InlineDiff {...defaultProps} />);

      const container = screen.getByTestId('inline-diff');
      expect(container.getAttribute('role')).toBe('region');
    });

    it('has aria-label for identical texts', () => {
      render(<InlineDiff {...defaultProps} />);

      const container = screen.getByTestId('inline-diff');
      expect(container.getAttribute('aria-label')).toBe('No changes detected');
    });

    it('has aria-label for different texts', () => {
      render(
        <InlineDiff
          originalText="hello"
          modifiedText="goodbye"
        />
      );

      const container = screen.getByTestId('inline-diff');
      const ariaLabel = container.getAttribute('aria-label');
      expect(ariaLabel).toContain('additions');
      expect(ariaLabel).toContain('removals');
    });
  });

  describe('empty text handling', () => {
    it('handles empty original text', () => {
      render(
        <InlineDiff
          originalText=""
          modifiedText="new text"
        />
      );

      expect(screen.getByTestId('inline-diff')).toBeInTheDocument();
    });

    it('handles empty modified text', () => {
      render(
        <InlineDiff
          originalText="old text"
          modifiedText=""
        />
      );

      expect(screen.getByTestId('inline-diff')).toBeInTheDocument();
    });

    it('handles both empty texts', () => {
      render(
        <InlineDiff
          originalText=""
          modifiedText=""
        />
      );

      expect(screen.getByTestId('inline-diff')).toBeInTheDocument();
    });
  });

  describe('multiline text', () => {
    it('handles multiline original text', () => {
      render(
        <InlineDiff
          originalText="line 1\nline 2\nline 3"
          modifiedText="line 1\nmodified\nline 3"
        />
      );

      expect(screen.getByTestId('inline-diff')).toBeInTheDocument();
    });

    it('handles line additions', () => {
      render(
        <InlineDiff
          originalText="line 1"
          modifiedText="line 1\nline 2"
        />
      );

      const container = screen.getByTestId('inline-diff');
      expect(container).toHaveClass('inline-diff--changed');
    });

    it('handles line removals', () => {
      render(
        <InlineDiff
          originalText="line 1\nline 2"
          modifiedText="line 1"
        />
      );

      const container = screen.getByTestId('inline-diff');
      expect(container).toHaveClass('inline-diff--changed');
    });
  });

  describe('change highlighting', () => {
    it('renders remove segments', () => {
      render(
        <InlineDiff
          originalText="hello world"
          modifiedText="hello"
        />
      );

      // Check that a remove segment exists
      const segments = document.querySelectorAll('.inline-diff__segment--remove');
      expect(segments.length).toBeGreaterThan(0);
    });

    it('renders add segments', () => {
      render(
        <InlineDiff
          originalText="hello"
          modifiedText="hello world"
        />
      );

      // Check that an add segment exists
      const segments = document.querySelectorAll('.inline-diff__segment--add');
      expect(segments.length).toBeGreaterThan(0);
    });

    it('renders equal segments', () => {
      render(
        <InlineDiff
          originalText="hello world"
          modifiedText="hello there"
        />
      );

      // Check that an equal segment exists (the "hello " part)
      const segments = document.querySelectorAll('.inline-diff__segment--equal');
      expect(segments.length).toBeGreaterThan(0);
    });
  });
});
