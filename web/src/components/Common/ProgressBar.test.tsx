/**
 * Tests for ProgressBar Component
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ProgressBar, type ProgressBarProps } from './ProgressBar';

describe('ProgressBar', () => {
  const defaultProps: ProgressBarProps = {};

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders the progress bar container', () => {
      render(<ProgressBar {...defaultProps} />);

      const container = screen.getByTestId('progress-bar');
      expect(container).toBeInTheDocument();
    });

    it('renders the track element', () => {
      render(<ProgressBar {...defaultProps} />);

      const track = document.querySelector('.progress-bar__track');
      expect(track).toBeInTheDocument();
    });

    it('renders the fill element', () => {
      render(<ProgressBar {...defaultProps} />);

      const fill = document.querySelector('.progress-bar__fill');
      expect(fill).toBeInTheDocument();
    });
  });

  describe('progress value', () => {
    it('sets fill width based on value', () => {
      render(<ProgressBar value={50} />);

      const fill = document.querySelector('.progress-bar__fill') as HTMLElement;
      expect(fill.style.width).toBe('50%');
    });

    it('handles 0 value', () => {
      render(<ProgressBar value={0} />);

      const fill = document.querySelector('.progress-bar__fill') as HTMLElement;
      expect(fill.style.width).toBe('0%');
    });

    it('handles 100 value', () => {
      render(<ProgressBar value={100} />);

      const fill = document.querySelector('.progress-bar__fill') as HTMLElement;
      expect(fill.style.width).toBe('100%');
    });

    it('clamps negative values to 0', () => {
      render(<ProgressBar value={-10} />);

      const fill = document.querySelector('.progress-bar__fill') as HTMLElement;
      expect(fill.style.width).toBe('0%');
    });

    it('clamps values above max', () => {
      render(<ProgressBar value={150} max={100} />);

      const fill = document.querySelector('.progress-bar__fill') as HTMLElement;
      expect(fill.style.width).toBe('100%');
    });

    it('calculates percentage based on custom max', () => {
      render(<ProgressBar value={50} max={200} />);

      const fill = document.querySelector('.progress-bar__fill') as HTMLElement;
      expect(fill.style.width).toBe('25%');
    });
  });

  describe('indeterminate mode', () => {
    it('applies indeterminate class', () => {
      render(<ProgressBar indeterminate />);

      const container = screen.getByTestId('progress-bar');
      expect(container).toHaveClass('progress-bar--indeterminate');
    });

    it('does not set fill width in indeterminate mode', () => {
      render(<ProgressBar indeterminate value={50} />);

      const fill = document.querySelector('.progress-bar__fill') as HTMLElement;
      expect(fill.style.width).toBe('');
    });

    it('does not show label in indeterminate mode', () => {
      render(<ProgressBar indeterminate showLabel />);

      const label = document.querySelector('.progress-bar__label');
      expect(label).not.toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    it('applies small size class', () => {
      render(<ProgressBar size="small" />);

      const container = screen.getByTestId('progress-bar');
      expect(container).toHaveClass('progress-bar--small');
    });

    it('applies medium size class by default', () => {
      render(<ProgressBar />);

      const container = screen.getByTestId('progress-bar');
      expect(container).toHaveClass('progress-bar--medium');
    });

    it('applies large size class', () => {
      render(<ProgressBar size="large" />);

      const container = screen.getByTestId('progress-bar');
      expect(container).toHaveClass('progress-bar--large');
    });
  });

  describe('variants', () => {
    it('applies primary variant class by default', () => {
      render(<ProgressBar />);

      const container = screen.getByTestId('progress-bar');
      expect(container).toHaveClass('progress-bar--primary');
    });

    it('applies success variant class', () => {
      render(<ProgressBar variant="success" />);

      const container = screen.getByTestId('progress-bar');
      expect(container).toHaveClass('progress-bar--success');
    });

    it('applies warning variant class', () => {
      render(<ProgressBar variant="warning" />);

      const container = screen.getByTestId('progress-bar');
      expect(container).toHaveClass('progress-bar--warning');
    });

    it('applies error variant class', () => {
      render(<ProgressBar variant="error" />);

      const container = screen.getByTestId('progress-bar');
      expect(container).toHaveClass('progress-bar--error');
    });
  });

  describe('label', () => {
    it('does not show label by default', () => {
      render(<ProgressBar value={50} />);

      const label = document.querySelector('.progress-bar__label');
      expect(label).not.toBeInTheDocument();
    });

    it('shows percentage label when showLabel is true', () => {
      render(<ProgressBar value={50} showLabel />);

      const label = document.querySelector('.progress-bar__label');
      expect(label).toBeInTheDocument();
      expect(label).toHaveTextContent('50%');
    });

    it('rounds percentage in label', () => {
      render(<ProgressBar value={33.333} showLabel />);

      const label = document.querySelector('.progress-bar__label');
      expect(label).toHaveTextContent('33%');
    });

    it('shows custom label when provided', () => {
      render(<ProgressBar value={100} showLabel label="Complete!" />);

      const label = document.querySelector('.progress-bar__label');
      expect(label).toHaveTextContent('Complete!');
    });

    it('hides label from screen readers', () => {
      render(<ProgressBar value={50} showLabel />);

      const label = document.querySelector('.progress-bar__label');
      expect(label?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('animation', () => {
    it('applies animated class by default', () => {
      render(<ProgressBar />);

      const container = screen.getByTestId('progress-bar');
      expect(container).toHaveClass('progress-bar--animated');
    });

    it('does not apply animated class when animated is false', () => {
      render(<ProgressBar animated={false} />);

      const container = screen.getByTestId('progress-bar');
      expect(container).not.toHaveClass('progress-bar--animated');
    });
  });

  describe('accessibility', () => {
    it('has role="progressbar"', () => {
      render(<ProgressBar />);

      const track = document.querySelector('.progress-bar__track');
      expect(track?.getAttribute('role')).toBe('progressbar');
    });

    it('sets aria-valuemin to 0', () => {
      render(<ProgressBar />);

      const track = document.querySelector('.progress-bar__track');
      expect(track?.getAttribute('aria-valuemin')).toBe('0');
    });

    it('sets aria-valuemax to max value', () => {
      render(<ProgressBar max={200} />);

      const track = document.querySelector('.progress-bar__track');
      expect(track?.getAttribute('aria-valuemax')).toBe('200');
    });

    it('sets aria-valuenow to current value', () => {
      render(<ProgressBar value={75} />);

      const track = document.querySelector('.progress-bar__track');
      expect(track?.getAttribute('aria-valuenow')).toBe('75');
    });

    it('does not set aria-valuenow in indeterminate mode', () => {
      render(<ProgressBar indeterminate />);

      const track = document.querySelector('.progress-bar__track');
      expect(track?.getAttribute('aria-valuenow')).toBeNull();
    });

    it('sets aria-busy in indeterminate mode', () => {
      render(<ProgressBar indeterminate />);

      const track = document.querySelector('.progress-bar__track');
      expect(track?.getAttribute('aria-busy')).toBe('true');
    });

    it('uses default aria-label', () => {
      render(<ProgressBar value={50} />);

      const track = document.querySelector('.progress-bar__track');
      expect(track?.getAttribute('aria-label')).toBe('Progress: 50%');
    });

    it('uses indeterminate aria-label', () => {
      render(<ProgressBar indeterminate />);

      const track = document.querySelector('.progress-bar__track');
      expect(track?.getAttribute('aria-label')).toBe('Loading in progress');
    });

    it('uses custom ariaLabel when provided', () => {
      render(<ProgressBar value={50} ariaLabel="Uploading file" />);

      const track = document.querySelector('.progress-bar__track');
      expect(track?.getAttribute('aria-label')).toBe('Uploading file');
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      render(<ProgressBar className="custom-class" />);

      const container = screen.getByTestId('progress-bar');
      expect(container).toHaveClass('progress-bar', 'custom-class');
    });

    it('uses custom testId when provided', () => {
      render(<ProgressBar testId="custom-progress" />);

      expect(screen.getByTestId('custom-progress')).toBeInTheDocument();
    });
  });

  describe('complete progress bar', () => {
    it('renders all elements with all props', () => {
      render(
        <ProgressBar
          value={75}
          max={100}
          size="large"
          variant="success"
          showLabel
          label="75% complete"
          ariaLabel="Upload progress"
          animated
          className="custom"
          testId="complete-progress"
        />
      );

      const container = screen.getByTestId('complete-progress');
      expect(container).toHaveClass(
        'progress-bar',
        'progress-bar--large',
        'progress-bar--success',
        'progress-bar--animated',
        'custom'
      );

      const fill = document.querySelector('.progress-bar__fill') as HTMLElement;
      expect(fill.style.width).toBe('75%');

      const label = document.querySelector('.progress-bar__label');
      expect(label).toHaveTextContent('75% complete');

      const track = document.querySelector('.progress-bar__track');
      expect(track?.getAttribute('aria-label')).toBe('Upload progress');
    });
  });
});
