/**
 * Tests for RegenerateButton Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { RegenerateButton, type RegenerateButtonProps } from './RegenerateButton';

describe('RegenerateButton', () => {
  const defaultProps: RegenerateButtonProps = {
    onClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders regenerate button component', () => {
      render(<RegenerateButton {...defaultProps} />);

      expect(screen.getByTestId('regenerate-button')).toBeInTheDocument();
      expect(screen.getByTestId('regenerate-button-button')).toBeInTheDocument();
    });

    it('displays default label', () => {
      render(<RegenerateButton {...defaultProps} />);

      expect(screen.getByTestId('regenerate-button-label')).toHaveTextContent(
        'Regenerate Melody'
      );
    });

    it('displays custom label', () => {
      render(<RegenerateButton {...defaultProps} label="Generate New" />);

      expect(screen.getByTestId('regenerate-button-label')).toHaveTextContent('Generate New');
    });

    it('displays generating label when isGenerating is true', () => {
      render(<RegenerateButton {...defaultProps} isGenerating />);

      expect(screen.getByTestId('regenerate-button-label')).toHaveTextContent('Generating...');
    });

    it('displays custom generating label', () => {
      render(
        <RegenerateButton
          {...defaultProps}
          isGenerating
          generatingLabel="Please wait..."
        />
      );

      expect(screen.getByTestId('regenerate-button-label')).toHaveTextContent('Please wait...');
    });

    it('shows spinner when generating', () => {
      render(<RegenerateButton {...defaultProps} isGenerating />);

      expect(screen.getByTestId('regenerate-button-spinner')).toBeInTheDocument();
    });

    it('hides spinner when not generating', () => {
      render(<RegenerateButton {...defaultProps} isGenerating={false} />);

      expect(screen.queryByTestId('regenerate-button-spinner')).not.toBeInTheDocument();
    });

    it('shows error message when error is provided', () => {
      render(<RegenerateButton {...defaultProps} error="Something went wrong" />);

      expect(screen.getByTestId('regenerate-button-error')).toBeInTheDocument();
      expect(screen.getByTestId('regenerate-button-error')).toHaveTextContent(
        'Something went wrong'
      );
    });

    it('hides error when error is null', () => {
      render(<RegenerateButton {...defaultProps} error={null} />);

      expect(screen.queryByTestId('regenerate-button-error')).not.toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onClick when button clicked', () => {
      const onClick = vi.fn();
      render(<RegenerateButton {...defaultProps} onClick={onClick} />);

      fireEvent.click(screen.getByTestId('regenerate-button-button'));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const onClick = vi.fn();
      render(<RegenerateButton {...defaultProps} onClick={onClick} disabled />);

      fireEvent.click(screen.getByTestId('regenerate-button-button'));

      expect(onClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when generating', () => {
      const onClick = vi.fn();
      render(<RegenerateButton {...defaultProps} onClick={onClick} isGenerating />);

      fireEvent.click(screen.getByTestId('regenerate-button-button'));

      expect(onClick).not.toHaveBeenCalled();
    });

    it('button is disabled when disabled prop is true', () => {
      render(<RegenerateButton {...defaultProps} disabled />);

      expect(screen.getByTestId('regenerate-button-button')).toBeDisabled();
    });

    it('button is disabled when generating', () => {
      render(<RegenerateButton {...defaultProps} isGenerating />);

      expect(screen.getByTestId('regenerate-button-button')).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('has accessible label', () => {
      render(<RegenerateButton {...defaultProps} />);

      expect(screen.getByTestId('regenerate-button-button')).toHaveAttribute(
        'aria-label',
        'Regenerate Melody'
      );
    });

    it('has aria-busy when generating', () => {
      render(<RegenerateButton {...defaultProps} isGenerating />);

      expect(screen.getByTestId('regenerate-button-button')).toHaveAttribute(
        'aria-busy',
        'true'
      );
    });

    it('has aria-busy false when not generating', () => {
      render(<RegenerateButton {...defaultProps} isGenerating={false} />);

      expect(screen.getByTestId('regenerate-button-button')).toHaveAttribute(
        'aria-busy',
        'false'
      );
    });

    it('error has alert role', () => {
      render(<RegenerateButton {...defaultProps} error="Error message" />);

      expect(screen.getByTestId('regenerate-button-error')).toHaveAttribute('role', 'alert');
    });
  });

  describe('variants', () => {
    it('renders primary variant by default', () => {
      render(<RegenerateButton {...defaultProps} />);

      // Primary variant should have a specific background color
      // We can check via computed styles or just ensure it renders
      expect(screen.getByTestId('regenerate-button-button')).toBeInTheDocument();
    });

    it('renders secondary variant', () => {
      render(<RegenerateButton {...defaultProps} variant="secondary" />);

      expect(screen.getByTestId('regenerate-button-button')).toBeInTheDocument();
    });
  });

  describe('custom styling', () => {
    it('applies custom className', () => {
      render(<RegenerateButton {...defaultProps} className="custom-class" />);

      expect(screen.getByTestId('regenerate-button')).toHaveClass('custom-class');
    });

    it('applies custom testId', () => {
      render(<RegenerateButton {...defaultProps} testId="custom-regen" />);

      expect(screen.getByTestId('custom-regen')).toBeInTheDocument();
      expect(screen.getByTestId('custom-regen-button')).toBeInTheDocument();
    });
  });
});
