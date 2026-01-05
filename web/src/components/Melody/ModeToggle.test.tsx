/**
 * Tests for ModeToggle Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ModeToggle, type ModeToggleProps } from './ModeToggle';

describe('ModeToggle', () => {
  const defaultProps: ModeToggleProps = {
    value: 'major',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders mode toggle component', () => {
      render(<ModeToggle {...defaultProps} />);

      expect(screen.getByTestId('mode-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('mode-toggle-buttons')).toBeInTheDocument();
    });

    it('displays current mode as Major', () => {
      render(<ModeToggle {...defaultProps} value="major" />);

      expect(screen.getByTestId('mode-toggle-current')).toHaveTextContent('Major');
    });

    it('displays current mode as Minor', () => {
      render(<ModeToggle {...defaultProps} value="minor" />);

      expect(screen.getByTestId('mode-toggle-current')).toHaveTextContent('Minor');
    });

    it('renders both Major and Minor buttons', () => {
      render(<ModeToggle {...defaultProps} />);

      expect(screen.getByTestId('mode-toggle-major')).toBeInTheDocument();
      expect(screen.getByTestId('mode-toggle-minor')).toBeInTheDocument();
    });

    it('hides label when showLabel is false', () => {
      render(<ModeToggle {...defaultProps} showLabel={false} />);

      expect(screen.queryByTestId('mode-toggle-current')).not.toBeInTheDocument();
    });

    it('shows Major button as selected when value is major', () => {
      render(<ModeToggle {...defaultProps} value="major" />);

      expect(screen.getByTestId('mode-toggle-major')).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByTestId('mode-toggle-minor')).toHaveAttribute('aria-checked', 'false');
    });

    it('shows Minor button as selected when value is minor', () => {
      render(<ModeToggle {...defaultProps} value="minor" />);

      expect(screen.getByTestId('mode-toggle-major')).toHaveAttribute('aria-checked', 'false');
      expect(screen.getByTestId('mode-toggle-minor')).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('interaction', () => {
    it('calls onChange with minor when Minor button clicked from major', () => {
      const onChange = vi.fn();
      render(<ModeToggle {...defaultProps} value="major" onChange={onChange} />);

      fireEvent.click(screen.getByTestId('mode-toggle-minor'));

      expect(onChange).toHaveBeenCalledWith('minor');
    });

    it('calls onChange with major when Major button clicked from minor', () => {
      const onChange = vi.fn();
      render(<ModeToggle {...defaultProps} value="minor" onChange={onChange} />);

      fireEvent.click(screen.getByTestId('mode-toggle-major'));

      expect(onChange).toHaveBeenCalledWith('major');
    });

    it('does not call onChange when clicking already selected Major', () => {
      const onChange = vi.fn();
      render(<ModeToggle {...defaultProps} value="major" onChange={onChange} />);

      fireEvent.click(screen.getByTestId('mode-toggle-major'));

      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not call onChange when clicking already selected Minor', () => {
      const onChange = vi.fn();
      render(<ModeToggle {...defaultProps} value="minor" onChange={onChange} />);

      fireEvent.click(screen.getByTestId('mode-toggle-minor'));

      expect(onChange).not.toHaveBeenCalled();
    });

    it('disables both buttons when disabled prop is true', () => {
      render(<ModeToggle {...defaultProps} disabled />);

      expect(screen.getByTestId('mode-toggle-major')).toBeDisabled();
      expect(screen.getByTestId('mode-toggle-minor')).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('has accessible group label', () => {
      render(<ModeToggle {...defaultProps} />);

      const group = screen.getByTestId('mode-toggle-buttons');
      expect(group).toHaveAttribute('aria-label', 'Musical mode');
      expect(group).toHaveAttribute('role', 'group');
    });

    it('has accessible button labels', () => {
      render(<ModeToggle {...defaultProps} />);

      expect(screen.getByTestId('mode-toggle-major')).toHaveAttribute('aria-label', 'Major mode');
      expect(screen.getByTestId('mode-toggle-minor')).toHaveAttribute('aria-label', 'Minor mode');
    });

    it('uses radio role for buttons', () => {
      render(<ModeToggle {...defaultProps} />);

      expect(screen.getByTestId('mode-toggle-major')).toHaveAttribute('role', 'radio');
      expect(screen.getByTestId('mode-toggle-minor')).toHaveAttribute('role', 'radio');
    });
  });

  describe('custom styling', () => {
    it('applies custom className', () => {
      render(<ModeToggle {...defaultProps} className="custom-class" />);

      expect(screen.getByTestId('mode-toggle')).toHaveClass('custom-class');
    });

    it('applies custom testId', () => {
      render(<ModeToggle {...defaultProps} testId="custom-mode-toggle" />);

      expect(screen.getByTestId('custom-mode-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('custom-mode-toggle-major')).toBeInTheDocument();
      expect(screen.getByTestId('custom-mode-toggle-minor')).toBeInTheDocument();
    });
  });
});
