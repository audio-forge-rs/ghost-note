/**
 * Tests for LoadingSpinner Component
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { LoadingSpinner, type LoadingSpinnerProps } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  const defaultProps: LoadingSpinnerProps = {};

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders the spinner container', () => {
      render(<LoadingSpinner {...defaultProps} />);

      const container = screen.getByTestId('loading-spinner');
      expect(container).toBeInTheDocument();
    });

    it('renders the SVG spinner element', () => {
      render(<LoadingSpinner {...defaultProps} />);

      const svg = document.querySelector('.loading-spinner__svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders both track and arc circles', () => {
      render(<LoadingSpinner {...defaultProps} />);

      const track = document.querySelector('.loading-spinner__track');
      const arc = document.querySelector('.loading-spinner__arc');
      expect(track).toBeInTheDocument();
      expect(arc).toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    it('applies small size class', () => {
      render(<LoadingSpinner size="small" />);

      const container = screen.getByTestId('loading-spinner');
      expect(container).toHaveClass('loading-spinner--small');
    });

    it('applies medium size class by default', () => {
      render(<LoadingSpinner />);

      const container = screen.getByTestId('loading-spinner');
      expect(container).toHaveClass('loading-spinner--medium');
    });

    it('applies large size class', () => {
      render(<LoadingSpinner size="large" />);

      const container = screen.getByTestId('loading-spinner');
      expect(container).toHaveClass('loading-spinner--large');
    });
  });

  describe('label', () => {
    it('uses default label "Loading..."', () => {
      render(<LoadingSpinner />);

      const container = screen.getByTestId('loading-spinner');
      expect(container.getAttribute('aria-label')).toBe('Loading...');
    });

    it('uses custom label when provided', () => {
      render(<LoadingSpinner label="Processing data..." />);

      const container = screen.getByTestId('loading-spinner');
      expect(container.getAttribute('aria-label')).toBe('Processing data...');
    });

    it('hides label visually by default (sr-only)', () => {
      render(<LoadingSpinner label="Test label" />);

      const srOnly = document.querySelector('.loading-spinner__sr-only');
      expect(srOnly).toBeInTheDocument();
      expect(srOnly).toHaveTextContent('Test label');
    });

    it('shows label visually when showLabel is true', () => {
      render(<LoadingSpinner label="Test label" showLabel />);

      const visibleLabel = document.querySelector('.loading-spinner__label');
      expect(visibleLabel).toBeInTheDocument();
      expect(visibleLabel).toHaveTextContent('Test label');
    });

    it('does not show sr-only label when showLabel is true', () => {
      render(<LoadingSpinner showLabel />);

      const srOnly = document.querySelector('.loading-spinner__sr-only');
      expect(srOnly).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has role="status"', () => {
      render(<LoadingSpinner />);

      const container = screen.getByTestId('loading-spinner');
      expect(container.getAttribute('role')).toBe('status');
    });

    it('has aria-live="polite"', () => {
      render(<LoadingSpinner />);

      const container = screen.getByTestId('loading-spinner');
      expect(container.getAttribute('aria-live')).toBe('polite');
    });

    it('hides SVG from screen readers', () => {
      render(<LoadingSpinner />);

      const svg = document.querySelector('.loading-spinner__svg');
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      render(<LoadingSpinner className="custom-class" />);

      const container = screen.getByTestId('loading-spinner');
      expect(container).toHaveClass('loading-spinner', 'custom-class');
    });

    it('uses custom testId when provided', () => {
      render(<LoadingSpinner testId="custom-spinner" />);

      expect(screen.getByTestId('custom-spinner')).toBeInTheDocument();
    });
  });

  describe('complete spinner', () => {
    it('renders all elements with all props', () => {
      render(
        <LoadingSpinner
          size="large"
          label="Custom loading message"
          showLabel
          className="custom"
          testId="complete-spinner"
        />
      );

      const container = screen.getByTestId('complete-spinner');
      expect(container).toHaveClass('loading-spinner', 'loading-spinner--large', 'custom');
      expect(container.getAttribute('aria-label')).toBe('Custom loading message');

      const label = document.querySelector('.loading-spinner__label');
      expect(label).toHaveTextContent('Custom loading message');
    });
  });
});
