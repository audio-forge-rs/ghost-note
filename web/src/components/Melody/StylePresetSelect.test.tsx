/**
 * Tests for StylePresetSelect Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { StylePresetSelect, type StylePresetSelectProps } from './StylePresetSelect';

describe('StylePresetSelect', () => {
  const defaultProps: StylePresetSelectProps = {
    value: 'folk',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders style preset select component', () => {
      render(<StylePresetSelect {...defaultProps} />);

      expect(screen.getByTestId('style-preset-select')).toBeInTheDocument();
      expect(screen.getByTestId('style-preset-select-select')).toBeInTheDocument();
    });

    it('displays current preset as Folk', () => {
      render(<StylePresetSelect {...defaultProps} value="folk" />);

      expect(screen.getByTestId('style-preset-select-current')).toHaveTextContent('Folk');
    });

    it('displays current preset as Classical', () => {
      render(<StylePresetSelect {...defaultProps} value="classical" />);

      expect(screen.getByTestId('style-preset-select-current')).toHaveTextContent('Classical');
    });

    it('displays Custom when value is null', () => {
      render(<StylePresetSelect {...defaultProps} value={null} />);

      expect(screen.getByTestId('style-preset-select-current')).toHaveTextContent('Custom');
    });

    it('renders all preset options', () => {
      render(<StylePresetSelect {...defaultProps} />);

      const select = screen.getByTestId('style-preset-select-select') as HTMLSelectElement;
      const options = Array.from(select.options);

      // Check for Custom option
      expect(options.find((opt) => opt.value === '')).toBeDefined();
      // Check for preset options
      expect(options.find((opt) => opt.value === 'folk')).toBeDefined();
      expect(options.find((opt) => opt.value === 'classical')).toBeDefined();
      expect(options.find((opt) => opt.value === 'pop')).toBeDefined();
      expect(options.find((opt) => opt.value === 'hymn')).toBeDefined();
    });

    it('hides label when showLabel is false', () => {
      render(<StylePresetSelect {...defaultProps} showLabel={false} />);

      expect(screen.queryByTestId('style-preset-select-current')).not.toBeInTheDocument();
    });

    it('shows preset description by default', () => {
      render(<StylePresetSelect {...defaultProps} value="folk" />);

      expect(screen.getByTestId('style-preset-select-description')).toBeInTheDocument();
      expect(screen.getByTestId('style-preset-select-description')).toHaveTextContent(
        /Simple, stepwise motion/
      );
    });

    it('shows tempo and time signature in description', () => {
      render(<StylePresetSelect {...defaultProps} value="folk" />);

      expect(screen.getByTestId('style-preset-select-description')).toHaveTextContent(
        /80-120 BPM/
      );
      expect(screen.getByTestId('style-preset-select-description')).toHaveTextContent(/4\/4/);
    });

    it('hides description when showDescription is false', () => {
      render(<StylePresetSelect {...defaultProps} showDescription={false} />);

      expect(screen.queryByTestId('style-preset-select-description')).not.toBeInTheDocument();
    });

    it('shows custom description when value is null', () => {
      render(<StylePresetSelect {...defaultProps} value={null} />);

      expect(screen.getByTestId('style-preset-select-description')).toHaveTextContent(
        /custom melody parameters/
      );
    });
  });

  describe('interaction', () => {
    it('calls onChange when selection changes to a preset', () => {
      const onChange = vi.fn();
      render(<StylePresetSelect {...defaultProps} onChange={onChange} />);

      const select = screen.getByTestId('style-preset-select-select');
      fireEvent.change(select, { target: { value: 'classical' } });

      expect(onChange).toHaveBeenCalledWith('classical');
    });

    it('calls onChange with null when selecting Custom', () => {
      const onChange = vi.fn();
      render(<StylePresetSelect {...defaultProps} value="folk" onChange={onChange} />);

      const select = screen.getByTestId('style-preset-select-select');
      fireEvent.change(select, { target: { value: '' } });

      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('is disabled when disabled prop is true', () => {
      render(<StylePresetSelect {...defaultProps} disabled />);

      expect(screen.getByTestId('style-preset-select-select')).toBeDisabled();
    });
  });

  describe('preset descriptions', () => {
    it('shows Folk preset description', () => {
      render(<StylePresetSelect {...defaultProps} value="folk" />);

      expect(screen.getByTestId('style-preset-select-description')).toHaveTextContent(
        /folk song style/i
      );
    });

    it('shows Classical preset description', () => {
      render(<StylePresetSelect {...defaultProps} value="classical" />);

      expect(screen.getByTestId('style-preset-select-description')).toHaveTextContent(
        /elegant/i
      );
    });

    it('shows Pop preset description', () => {
      render(<StylePresetSelect {...defaultProps} value="pop" />);

      expect(screen.getByTestId('style-preset-select-description')).toHaveTextContent(
        /catchy/i
      );
    });

    it('shows Hymn preset description', () => {
      render(<StylePresetSelect {...defaultProps} value="hymn" />);

      expect(screen.getByTestId('style-preset-select-description')).toHaveTextContent(
        /reverent/i
      );
    });
  });

  describe('accessibility', () => {
    it('has accessible label', () => {
      render(<StylePresetSelect {...defaultProps} />);

      const select = screen.getByTestId('style-preset-select-select');
      expect(select).toHaveAttribute('aria-label', 'Style preset');
    });
  });

  describe('custom styling', () => {
    it('applies custom className', () => {
      render(<StylePresetSelect {...defaultProps} className="custom-class" />);

      expect(screen.getByTestId('style-preset-select')).toHaveClass('custom-class');
    });

    it('applies custom testId', () => {
      render(<StylePresetSelect {...defaultProps} testId="custom-style" />);

      expect(screen.getByTestId('custom-style')).toBeInTheDocument();
      expect(screen.getByTestId('custom-style-select')).toBeInTheDocument();
    });
  });
});
