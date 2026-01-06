/**
 * Tests for TempoSlider Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TempoSlider, type TempoSliderProps } from './TempoSlider';
import { DEFAULT_TEMPO_PRESETS } from './tempoSliderConstants';

describe('TempoSlider', () => {
  const defaultProps: TempoSliderProps = {
    value: 100,
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders tempo slider', () => {
      render(<TempoSlider {...defaultProps} />);

      expect(screen.getByTestId('tempo-slider')).toBeInTheDocument();
      expect(screen.getByTestId('tempo-slider-input')).toBeInTheDocument();
    });

    it('displays current tempo value', () => {
      render(<TempoSlider {...defaultProps} value={120} />);

      expect(screen.getByTestId('tempo-slider-value')).toHaveTextContent('120 BPM');
    });

    it('renders increment and decrement buttons', () => {
      render(<TempoSlider {...defaultProps} />);

      expect(screen.getByTestId('tempo-slider-increment')).toBeInTheDocument();
      expect(screen.getByTestId('tempo-slider-decrement')).toBeInTheDocument();
    });

    it('renders preset buttons by default', () => {
      render(<TempoSlider {...defaultProps} />);

      expect(screen.getByTestId('tempo-slider-presets')).toBeInTheDocument();
      DEFAULT_TEMPO_PRESETS.forEach((preset) => {
        expect(screen.getByTestId(`tempo-slider-preset-${preset.value}`)).toBeInTheDocument();
      });
    });

    it('hides presets when showPresets is false', () => {
      render(<TempoSlider {...defaultProps} showPresets={false} />);

      expect(screen.queryByTestId('tempo-slider-presets')).not.toBeInTheDocument();
    });

    it('hides label when showLabel is false', () => {
      render(<TempoSlider {...defaultProps} showLabel={false} />);

      expect(screen.queryByTestId('tempo-slider-value')).not.toBeInTheDocument();
    });
  });

  describe('slider interaction', () => {
    it('calls onChange when slider value changes', () => {
      const onChange = vi.fn();
      render(<TempoSlider {...defaultProps} onChange={onChange} />);

      const slider = screen.getByTestId('tempo-slider-input');
      fireEvent.change(slider, { target: { value: '150' } });

      expect(onChange).toHaveBeenCalledWith(150);
    });

    it('respects min value', () => {
      render(<TempoSlider {...defaultProps} min={60} />);

      const slider = screen.getByTestId('tempo-slider-input') as HTMLInputElement;
      expect(slider.min).toBe('60');
    });

    it('respects max value', () => {
      render(<TempoSlider {...defaultProps} max={200} />);

      const slider = screen.getByTestId('tempo-slider-input') as HTMLInputElement;
      expect(slider.max).toBe('200');
    });

    it('respects step value', () => {
      render(<TempoSlider {...defaultProps} step={5} />);

      const slider = screen.getByTestId('tempo-slider-input') as HTMLInputElement;
      expect(slider.step).toBe('5');
    });

    it('is disabled when disabled prop is true', () => {
      render(<TempoSlider {...defaultProps} disabled />);

      expect(screen.getByTestId('tempo-slider-input')).toBeDisabled();
    });
  });

  describe('increment/decrement buttons', () => {
    it('increments tempo when + button clicked', () => {
      const onChange = vi.fn();
      render(<TempoSlider {...defaultProps} value={100} onChange={onChange} />);

      fireEvent.click(screen.getByTestId('tempo-slider-increment'));

      expect(onChange).toHaveBeenCalledWith(101);
    });

    it('decrements tempo when - button clicked', () => {
      const onChange = vi.fn();
      render(<TempoSlider {...defaultProps} value={100} onChange={onChange} />);

      fireEvent.click(screen.getByTestId('tempo-slider-decrement'));

      expect(onChange).toHaveBeenCalledWith(99);
    });

    it('respects step when incrementing', () => {
      const onChange = vi.fn();
      render(<TempoSlider {...defaultProps} value={100} step={5} onChange={onChange} />);

      fireEvent.click(screen.getByTestId('tempo-slider-increment'));

      expect(onChange).toHaveBeenCalledWith(105);
    });

    it('does not exceed max when incrementing', () => {
      const onChange = vi.fn();
      render(<TempoSlider {...defaultProps} value={238} max={240} step={5} onChange={onChange} />);

      fireEvent.click(screen.getByTestId('tempo-slider-increment'));

      expect(onChange).toHaveBeenCalledWith(240);
    });

    it('does not go below min when decrementing', () => {
      const onChange = vi.fn();
      render(<TempoSlider {...defaultProps} value={42} min={40} step={5} onChange={onChange} />);

      fireEvent.click(screen.getByTestId('tempo-slider-decrement'));

      expect(onChange).toHaveBeenCalledWith(40);
    });

    it('disables decrement at min value', () => {
      render(<TempoSlider {...defaultProps} value={40} min={40} />);

      expect(screen.getByTestId('tempo-slider-decrement')).toBeDisabled();
    });

    it('disables increment at max value', () => {
      render(<TempoSlider {...defaultProps} value={240} max={240} />);

      expect(screen.getByTestId('tempo-slider-increment')).toBeDisabled();
    });
  });

  describe('preset buttons', () => {
    it('calls onChange with preset value when clicked', () => {
      const onChange = vi.fn();
      render(<TempoSlider {...defaultProps} onChange={onChange} />);

      fireEvent.click(screen.getByTestId('tempo-slider-preset-60'));

      expect(onChange).toHaveBeenCalledWith(60);
    });

    it('highlights active preset', () => {
      render(<TempoSlider {...defaultProps} value={100} />);

      const activePreset = screen.getByTestId('tempo-slider-preset-100');
      expect(activePreset).toHaveAttribute('aria-pressed', 'true');
    });

    it('filters presets outside range', () => {
      render(<TempoSlider {...defaultProps} min={80} max={150} />);

      // 60 is below min, should not be rendered
      expect(screen.queryByTestId('tempo-slider-preset-60')).not.toBeInTheDocument();
      // 180 is above max, should not be rendered
      expect(screen.queryByTestId('tempo-slider-preset-180')).not.toBeInTheDocument();
      // 100 and 140 are within range
      expect(screen.getByTestId('tempo-slider-preset-100')).toBeInTheDocument();
      expect(screen.getByTestId('tempo-slider-preset-140')).toBeInTheDocument();
    });

    it('uses custom presets', () => {
      const customPresets = [
        { label: 'Custom 1', value: 80 },
        { label: 'Custom 2', value: 120 },
      ];
      render(<TempoSlider {...defaultProps} presets={customPresets} />);

      expect(screen.getByTestId('tempo-slider-preset-80')).toBeInTheDocument();
      expect(screen.getByTestId('tempo-slider-preset-120')).toBeInTheDocument();
      expect(screen.queryByTestId('tempo-slider-preset-60')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has accessible slider attributes', () => {
      render(<TempoSlider {...defaultProps} value={120} min={40} max={240} />);

      const slider = screen.getByTestId('tempo-slider-input');
      expect(slider).toHaveAttribute('aria-valuemin', '40');
      expect(slider).toHaveAttribute('aria-valuemax', '240');
      expect(slider).toHaveAttribute('aria-valuenow', '120');
      expect(slider).toHaveAttribute('aria-valuetext', '120 BPM');
    });

    it('has accessible button labels', () => {
      render(<TempoSlider {...defaultProps} />);

      expect(screen.getByTestId('tempo-slider-increment')).toHaveAttribute('aria-label', 'Increase tempo');
      expect(screen.getByTestId('tempo-slider-decrement')).toHaveAttribute('aria-label', 'Decrease tempo');
    });
  });
});
