/**
 * Tests for TempoInput Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TempoInput, DEFAULT_TEMPO_PRESETS, type TempoInputProps } from './TempoInput';

describe('TempoInput', () => {
  const defaultProps: TempoInputProps = {
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
    it('renders tempo input component', () => {
      render(<TempoInput {...defaultProps} />);

      expect(screen.getByTestId('tempo-input')).toBeInTheDocument();
      expect(screen.getByTestId('tempo-input-slider')).toBeInTheDocument();
      expect(screen.getByTestId('tempo-input-number')).toBeInTheDocument();
    });

    it('displays current tempo value', () => {
      render(<TempoInput {...defaultProps} value={120} />);

      expect(screen.getByTestId('tempo-input-value')).toHaveTextContent('120 BPM');
    });

    it('renders increment and decrement buttons', () => {
      render(<TempoInput {...defaultProps} />);

      expect(screen.getByTestId('tempo-input-increment')).toBeInTheDocument();
      expect(screen.getByTestId('tempo-input-decrement')).toBeInTheDocument();
    });

    it('renders preset buttons by default', () => {
      render(<TempoInput {...defaultProps} />);

      expect(screen.getByTestId('tempo-input-presets')).toBeInTheDocument();
      DEFAULT_TEMPO_PRESETS.forEach((preset) => {
        expect(screen.getByTestId(`tempo-input-preset-${preset.value}`)).toBeInTheDocument();
      });
    });

    it('hides presets when showPresets is false', () => {
      render(<TempoInput {...defaultProps} showPresets={false} />);

      expect(screen.queryByTestId('tempo-input-presets')).not.toBeInTheDocument();
    });

    it('hides label when showLabel is false', () => {
      render(<TempoInput {...defaultProps} showLabel={false} />);

      expect(screen.queryByTestId('tempo-input-value')).not.toBeInTheDocument();
    });
  });

  describe('slider interaction', () => {
    it('calls onChange when slider value changes', () => {
      const onChange = vi.fn();
      render(<TempoInput {...defaultProps} onChange={onChange} />);

      const slider = screen.getByTestId('tempo-input-slider');
      fireEvent.change(slider, { target: { value: '150' } });

      expect(onChange).toHaveBeenCalledWith(150);
    });

    it('clamps values above max', () => {
      const onChange = vi.fn();
      render(<TempoInput {...defaultProps} onChange={onChange} max={200} />);

      const slider = screen.getByTestId('tempo-input-slider');
      fireEvent.change(slider, { target: { value: '250' } });

      expect(onChange).toHaveBeenCalledWith(200);
    });

    it('clamps values below min', () => {
      const onChange = vi.fn();
      render(<TempoInput {...defaultProps} onChange={onChange} min={60} />);

      const slider = screen.getByTestId('tempo-input-slider');
      fireEvent.change(slider, { target: { value: '30' } });

      expect(onChange).toHaveBeenCalledWith(60);
    });

    it('respects min value', () => {
      render(<TempoInput {...defaultProps} min={60} />);

      const slider = screen.getByTestId('tempo-input-slider') as HTMLInputElement;
      expect(slider.min).toBe('60');
    });

    it('respects max value', () => {
      render(<TempoInput {...defaultProps} max={200} />);

      const slider = screen.getByTestId('tempo-input-slider') as HTMLInputElement;
      expect(slider.max).toBe('200');
    });

    it('is disabled when disabled prop is true', () => {
      render(<TempoInput {...defaultProps} disabled />);

      expect(screen.getByTestId('tempo-input-slider')).toBeDisabled();
    });
  });

  describe('numeric input interaction', () => {
    it('calls onChange when numeric input changes', () => {
      const onChange = vi.fn();
      render(<TempoInput {...defaultProps} onChange={onChange} />);

      const input = screen.getByTestId('tempo-input-number');
      fireEvent.change(input, { target: { value: '150' } });

      expect(onChange).toHaveBeenCalledWith(150);
    });

    it('clamps numeric input above max', () => {
      const onChange = vi.fn();
      render(<TempoInput {...defaultProps} onChange={onChange} max={200} />);

      const input = screen.getByTestId('tempo-input-number');
      fireEvent.change(input, { target: { value: '250' } });

      expect(onChange).toHaveBeenCalledWith(200);
    });

    it('ignores non-numeric input', () => {
      const onChange = vi.fn();
      render(<TempoInput {...defaultProps} onChange={onChange} />);

      const input = screen.getByTestId('tempo-input-number');
      fireEvent.change(input, { target: { value: 'abc' } });

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('increment/decrement buttons', () => {
    it('increments tempo when + button clicked', () => {
      const onChange = vi.fn();
      render(<TempoInput {...defaultProps} value={100} onChange={onChange} />);

      fireEvent.click(screen.getByTestId('tempo-input-increment'));

      expect(onChange).toHaveBeenCalledWith(101);
    });

    it('decrements tempo when - button clicked', () => {
      const onChange = vi.fn();
      render(<TempoInput {...defaultProps} value={100} onChange={onChange} />);

      fireEvent.click(screen.getByTestId('tempo-input-decrement'));

      expect(onChange).toHaveBeenCalledWith(99);
    });

    it('respects step when incrementing', () => {
      const onChange = vi.fn();
      render(<TempoInput {...defaultProps} value={100} step={5} onChange={onChange} />);

      fireEvent.click(screen.getByTestId('tempo-input-increment'));

      expect(onChange).toHaveBeenCalledWith(105);
    });

    it('does not exceed max when incrementing', () => {
      const onChange = vi.fn();
      render(<TempoInput {...defaultProps} value={238} max={240} step={5} onChange={onChange} />);

      fireEvent.click(screen.getByTestId('tempo-input-increment'));

      expect(onChange).toHaveBeenCalledWith(240);
    });

    it('does not go below min when decrementing', () => {
      const onChange = vi.fn();
      render(<TempoInput {...defaultProps} value={42} min={40} step={5} onChange={onChange} />);

      fireEvent.click(screen.getByTestId('tempo-input-decrement'));

      expect(onChange).toHaveBeenCalledWith(40);
    });

    it('disables decrement at min value', () => {
      render(<TempoInput {...defaultProps} value={40} min={40} />);

      expect(screen.getByTestId('tempo-input-decrement')).toBeDisabled();
    });

    it('disables increment at max value', () => {
      render(<TempoInput {...defaultProps} value={240} max={240} />);

      expect(screen.getByTestId('tempo-input-increment')).toBeDisabled();
    });
  });

  describe('preset buttons', () => {
    it('calls onChange with preset value when clicked', () => {
      const onChange = vi.fn();
      render(<TempoInput {...defaultProps} onChange={onChange} />);

      fireEvent.click(screen.getByTestId('tempo-input-preset-60'));

      expect(onChange).toHaveBeenCalledWith(60);
    });

    it('highlights active preset', () => {
      render(<TempoInput {...defaultProps} value={120} />);

      const activePreset = screen.getByTestId('tempo-input-preset-120');
      expect(activePreset).toHaveAttribute('aria-pressed', 'true');
    });

    it('filters presets outside range', () => {
      render(<TempoInput {...defaultProps} min={80} max={140} />);

      // 60 is below min, should not be rendered
      expect(screen.queryByTestId('tempo-input-preset-60')).not.toBeInTheDocument();
      // 150 is above max, should not be rendered
      expect(screen.queryByTestId('tempo-input-preset-150')).not.toBeInTheDocument();
      // 90 and 120 are within range
      expect(screen.getByTestId('tempo-input-preset-90')).toBeInTheDocument();
      expect(screen.getByTestId('tempo-input-preset-120')).toBeInTheDocument();
    });

    it('uses custom presets', () => {
      const customPresets = [
        { label: 'Custom 1', value: 80 },
        { label: 'Custom 2', value: 100 },
      ];
      render(<TempoInput {...defaultProps} presets={customPresets} />);

      expect(screen.getByTestId('tempo-input-preset-80')).toBeInTheDocument();
      expect(screen.getByTestId('tempo-input-preset-100')).toBeInTheDocument();
      expect(screen.queryByTestId('tempo-input-preset-60')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has accessible slider attributes', () => {
      render(<TempoInput {...defaultProps} value={120} min={40} max={240} />);

      const slider = screen.getByTestId('tempo-input-slider');
      expect(slider).toHaveAttribute('aria-valuemin', '40');
      expect(slider).toHaveAttribute('aria-valuemax', '240');
      expect(slider).toHaveAttribute('aria-valuenow', '120');
      expect(slider).toHaveAttribute('aria-valuetext', '120 BPM');
    });

    it('has accessible button labels', () => {
      render(<TempoInput {...defaultProps} />);

      expect(screen.getByTestId('tempo-input-increment')).toHaveAttribute('aria-label', 'Increase tempo');
      expect(screen.getByTestId('tempo-input-decrement')).toHaveAttribute('aria-label', 'Decrease tempo');
    });

    it('has accessible numeric input label', () => {
      render(<TempoInput {...defaultProps} />);

      expect(screen.getByTestId('tempo-input-number')).toHaveAttribute('aria-label', 'Tempo in BPM');
    });
  });

  describe('custom styling', () => {
    it('applies custom className', () => {
      render(<TempoInput {...defaultProps} className="custom-class" />);

      expect(screen.getByTestId('tempo-input')).toHaveClass('custom-class');
    });

    it('applies custom testId', () => {
      render(<TempoInput {...defaultProps} testId="custom-tempo" />);

      expect(screen.getByTestId('custom-tempo')).toBeInTheDocument();
      expect(screen.getByTestId('custom-tempo-slider')).toBeInTheDocument();
    });
  });
});
