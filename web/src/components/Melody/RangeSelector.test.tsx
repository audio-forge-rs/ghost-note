/**
 * Tests for RangeSelector Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { RangeSelector, type RangeSelectorProps } from './RangeSelector';
import { VOCAL_RANGE_PRESETS } from './rangeConstants';

describe('RangeSelector', () => {
  const defaultProps: RangeSelectorProps = {
    lowValue: { note: 'C', octave: 0 },
    highValue: { note: 'C', octave: 1 },
    onLowChange: vi.fn(),
    onHighChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders range selector component', () => {
      render(<RangeSelector {...defaultProps} />);

      expect(screen.getByTestId('range-selector')).toBeInTheDocument();
      expect(screen.getByTestId('range-selector-low')).toBeInTheDocument();
      expect(screen.getByTestId('range-selector-high')).toBeInTheDocument();
    });

    it('displays current range', () => {
      render(<RangeSelector {...defaultProps} />);

      expect(screen.getByTestId('range-selector-display')).toHaveTextContent('C4 - C5');
    });

    it('displays low note value', () => {
      render(<RangeSelector {...defaultProps} lowValue={{ note: 'E', octave: 0 }} />);

      expect(screen.getByTestId('range-selector-low-display')).toHaveTextContent('E4');
    });

    it('displays high note value', () => {
      render(<RangeSelector {...defaultProps} highValue={{ note: 'G', octave: 1 }} />);

      expect(screen.getByTestId('range-selector-high-display')).toHaveTextContent('G5');
    });

    it('displays notes in octave -1 correctly', () => {
      render(<RangeSelector {...defaultProps} lowValue={{ note: 'E', octave: -1 }} />);

      expect(screen.getByTestId('range-selector-low-display')).toHaveTextContent('E3');
    });

    it('renders preset buttons by default', () => {
      render(<RangeSelector {...defaultProps} />);

      expect(screen.getByTestId('range-selector-presets')).toBeInTheDocument();
      VOCAL_RANGE_PRESETS.forEach((preset) => {
        expect(
          screen.getByTestId(`range-selector-preset-${preset.label.toLowerCase()}`)
        ).toBeInTheDocument();
      });
    });

    it('hides presets when showPresets is false', () => {
      render(<RangeSelector {...defaultProps} showPresets={false} />);

      expect(screen.queryByTestId('range-selector-presets')).not.toBeInTheDocument();
    });

    it('hides label when showLabel is false', () => {
      render(<RangeSelector {...defaultProps} showLabel={false} />);

      expect(screen.queryByTestId('range-selector-display')).not.toBeInTheDocument();
    });
  });

  describe('low slider interaction', () => {
    it('calls onLowChange when low slider changes', () => {
      const onLowChange = vi.fn();
      render(
        <RangeSelector
          {...defaultProps}
          lowValue={{ note: 'C', octave: 0 }}
          highValue={{ note: 'C', octave: 1 }}
          onLowChange={onLowChange}
        />
      );

      const slider = screen.getByTestId('range-selector-low');
      // Move from C4 (value 0) to D4 (value 1)
      fireEvent.change(slider, { target: { value: '1' } });

      expect(onLowChange).toHaveBeenCalledWith({ note: 'D', octave: 0 });
    });

    it('prevents low from exceeding high', () => {
      const onLowChange = vi.fn();
      render(
        <RangeSelector
          {...defaultProps}
          lowValue={{ note: 'C', octave: 0 }}
          highValue={{ note: 'E', octave: 0 }}
          onLowChange={onLowChange}
        />
      );

      const slider = screen.getByTestId('range-selector-low');
      // Try to move low past high (E4 is value 2, try to set to 3 or higher)
      fireEvent.change(slider, { target: { value: '3' } });

      expect(onLowChange).not.toHaveBeenCalled();
    });

    it('is disabled when disabled prop is true', () => {
      render(<RangeSelector {...defaultProps} disabled />);

      expect(screen.getByTestId('range-selector-low')).toBeDisabled();
    });
  });

  describe('high slider interaction', () => {
    it('calls onHighChange when high slider changes', () => {
      const onHighChange = vi.fn();
      render(
        <RangeSelector
          {...defaultProps}
          lowValue={{ note: 'C', octave: 0 }}
          highValue={{ note: 'C', octave: 1 }}
          onHighChange={onHighChange}
        />
      );

      const slider = screen.getByTestId('range-selector-high');
      // Move from C5 (value 7) to D5 (value 8)
      fireEvent.change(slider, { target: { value: '8' } });

      expect(onHighChange).toHaveBeenCalledWith({ note: 'D', octave: 1 });
    });

    it('prevents high from going below low', () => {
      const onHighChange = vi.fn();
      render(
        <RangeSelector
          {...defaultProps}
          lowValue={{ note: 'E', octave: 0 }}
          highValue={{ note: 'C', octave: 1 }}
          onHighChange={onHighChange}
        />
      );

      const slider = screen.getByTestId('range-selector-high');
      // E4 is value 2, try to set high to 1 or lower
      fireEvent.change(slider, { target: { value: '1' } });

      expect(onHighChange).not.toHaveBeenCalled();
    });

    it('is disabled when disabled prop is true', () => {
      render(<RangeSelector {...defaultProps} disabled />);

      expect(screen.getByTestId('range-selector-high')).toBeDisabled();
    });
  });

  describe('preset buttons', () => {
    it('calls both onChange handlers when preset clicked', () => {
      const onLowChange = vi.fn();
      const onHighChange = vi.fn();
      render(
        <RangeSelector
          {...defaultProps}
          onLowChange={onLowChange}
          onHighChange={onHighChange}
        />
      );

      fireEvent.click(screen.getByTestId('range-selector-preset-tenor'));

      const tenorPreset = VOCAL_RANGE_PRESETS.find((p) => p.label === 'Tenor')!;
      expect(onLowChange).toHaveBeenCalledWith(tenorPreset.low);
      expect(onHighChange).toHaveBeenCalledWith(tenorPreset.high);
    });

    it('highlights active preset', () => {
      const tenorPreset = VOCAL_RANGE_PRESETS.find((p) => p.label === 'Tenor')!;
      render(
        <RangeSelector
          {...defaultProps}
          lowValue={tenorPreset.low}
          highValue={tenorPreset.high}
        />
      );

      expect(screen.getByTestId('range-selector-preset-tenor')).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });

    it('does not highlight non-matching preset', () => {
      render(<RangeSelector {...defaultProps} />);

      expect(screen.getByTestId('range-selector-preset-bass')).toHaveAttribute(
        'aria-pressed',
        'false'
      );
    });
  });

  describe('accessibility', () => {
    it('has accessible low slider attributes', () => {
      render(<RangeSelector {...defaultProps} lowValue={{ note: 'C', octave: 0 }} />);

      const slider = screen.getByTestId('range-selector-low');
      expect(slider).toHaveAttribute('aria-label', 'Low note');
      expect(slider).toHaveAttribute('aria-valuenow', '0');
      expect(slider).toHaveAttribute('aria-valuetext', 'C4');
    });

    it('has accessible high slider attributes', () => {
      render(<RangeSelector {...defaultProps} highValue={{ note: 'C', octave: 1 }} />);

      const slider = screen.getByTestId('range-selector-high');
      expect(slider).toHaveAttribute('aria-label', 'High note');
      expect(slider).toHaveAttribute('aria-valuenow', '7');
      expect(slider).toHaveAttribute('aria-valuetext', 'C5');
    });

    it('has accessible preset button labels', () => {
      render(<RangeSelector {...defaultProps} />);

      expect(screen.getByTestId('range-selector-preset-tenor')).toHaveAttribute(
        'aria-label',
        'Set range to Tenor'
      );
    });
  });

  describe('custom styling', () => {
    it('applies custom className', () => {
      render(<RangeSelector {...defaultProps} className="custom-class" />);

      expect(screen.getByTestId('range-selector')).toHaveClass('custom-class');
    });

    it('applies custom testId', () => {
      render(<RangeSelector {...defaultProps} testId="custom-range" />);

      expect(screen.getByTestId('custom-range')).toBeInTheDocument();
      expect(screen.getByTestId('custom-range-low')).toBeInTheDocument();
      expect(screen.getByTestId('custom-range-high')).toBeInTheDocument();
    });
  });
});
