/**
 * Tests for LoadingOverlay Component
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { LoadingOverlay, type LoadingOverlayProps } from './LoadingOverlay';

describe('LoadingOverlay', () => {
  const defaultProps: LoadingOverlayProps = {
    isVisible: true,
  };

  afterEach(() => {
    cleanup();
  });

  describe('visibility', () => {
    it('renders when isVisible is true', () => {
      render(<LoadingOverlay {...defaultProps} />);

      const overlay = screen.getByTestId('loading-overlay');
      expect(overlay).toBeInTheDocument();
    });

    it('does not render when isVisible is false', () => {
      render(<LoadingOverlay isVisible={false} />);

      const overlay = screen.queryByTestId('loading-overlay');
      expect(overlay).not.toBeInTheDocument();
    });
  });

  describe('rendering', () => {
    it('renders the loading spinner', () => {
      render(<LoadingOverlay {...defaultProps} />);

      const spinner = screen.getByTestId('loading-overlay-spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('renders the content container', () => {
      render(<LoadingOverlay {...defaultProps} />);

      const content = document.querySelector('.loading-overlay__content');
      expect(content).toBeInTheDocument();
    });
  });

  describe('message', () => {
    it('uses default message "Loading..."', () => {
      render(<LoadingOverlay {...defaultProps} />);

      const overlay = screen.getByTestId('loading-overlay');
      expect(overlay.getAttribute('aria-label')).toBe('Loading...');
    });

    it('uses custom message when provided', () => {
      render(<LoadingOverlay {...defaultProps} message="Saving your work..." />);

      const overlay = screen.getByTestId('loading-overlay');
      expect(overlay.getAttribute('aria-label')).toBe('Saving your work...');
    });

    it('displays message in spinner label', () => {
      render(<LoadingOverlay {...defaultProps} message="Custom message" />);

      const spinnerLabel = screen.getByText('Custom message');
      expect(spinnerLabel).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('applies container class by default', () => {
      render(<LoadingOverlay {...defaultProps} />);

      const overlay = screen.getByTestId('loading-overlay');
      expect(overlay).toHaveClass('loading-overlay--container');
    });

    it('applies fullscreen class when fullScreen is true', () => {
      render(<LoadingOverlay {...defaultProps} fullScreen />);

      const overlay = screen.getByTestId('loading-overlay');
      expect(overlay).toHaveClass('loading-overlay--fullscreen');
    });

    it('does not apply container class when fullScreen is true', () => {
      render(<LoadingOverlay {...defaultProps} fullScreen />);

      const overlay = screen.getByTestId('loading-overlay');
      expect(overlay).not.toHaveClass('loading-overlay--container');
    });

    it('applies transparent class when transparent is true', () => {
      render(<LoadingOverlay {...defaultProps} transparent />);

      const overlay = screen.getByTestId('loading-overlay');
      expect(overlay).toHaveClass('loading-overlay--transparent');
    });
  });

  describe('accessibility', () => {
    it('has role="dialog"', () => {
      render(<LoadingOverlay {...defaultProps} />);

      const overlay = screen.getByTestId('loading-overlay');
      expect(overlay.getAttribute('role')).toBe('dialog');
    });

    it('has aria-modal="true"', () => {
      render(<LoadingOverlay {...defaultProps} />);

      const overlay = screen.getByTestId('loading-overlay');
      expect(overlay.getAttribute('aria-modal')).toBe('true');
    });

    it('has aria-busy="true"', () => {
      render(<LoadingOverlay {...defaultProps} />);

      const overlay = screen.getByTestId('loading-overlay');
      expect(overlay.getAttribute('aria-busy')).toBe('true');
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      render(<LoadingOverlay {...defaultProps} className="custom-class" />);

      const overlay = screen.getByTestId('loading-overlay');
      expect(overlay).toHaveClass('loading-overlay', 'custom-class');
    });

    it('uses custom testId when provided', () => {
      render(<LoadingOverlay {...defaultProps} testId="custom-overlay" />);

      expect(screen.getByTestId('custom-overlay')).toBeInTheDocument();
    });
  });

  describe('complete overlay', () => {
    it('renders all elements with all props', () => {
      render(
        <LoadingOverlay
          isVisible={true}
          message="Uploading files..."
          fullScreen
          className="custom"
          testId="complete-overlay"
        />
      );

      const overlay = screen.getByTestId('complete-overlay');
      expect(overlay).toHaveClass('loading-overlay', 'loading-overlay--fullscreen', 'custom');
      expect(overlay.getAttribute('aria-label')).toBe('Uploading files...');
      expect(screen.getByText('Uploading files...')).toBeInTheDocument();
    });
  });
});
