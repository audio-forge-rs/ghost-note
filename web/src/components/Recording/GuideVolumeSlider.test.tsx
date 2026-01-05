/**
 * GuideVolumeSlider Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GuideVolumeSlider } from './GuideVolumeSlider';

describe('GuideVolumeSlider', () => {
  describe('Rendering', () => {
    it('should render with required props', () => {
      const handleChange = vi.fn();
      render(<GuideVolumeSlider value={0.5} onChange={handleChange} />);

      expect(screen.getByTestId('guide-volume-slider')).toBeInTheDocument();
      expect(screen.getByTestId('volume-track')).toBeInTheDocument();
      expect(screen.getByTestId('volume-input')).toBeInTheDocument();
    });

    it('should display the label when showLabel is true', () => {
      const handleChange = vi.fn();
      render(<GuideVolumeSlider value={0.5} onChange={handleChange} showLabel />);

      expect(screen.getByText('Guide Volume')).toBeInTheDocument();
    });

    it('should display custom label', () => {
      const handleChange = vi.fn();
      render(
        <GuideVolumeSlider
          value={0.5}
          onChange={handleChange}
          showLabel
          label="Custom Label"
        />
      );

      expect(screen.getByText('Custom Label')).toBeInTheDocument();
    });

    it('should display the percentage value when showValue is true', () => {
      const handleChange = vi.fn();
      render(<GuideVolumeSlider value={0.75} onChange={handleChange} showValue />);

      expect(screen.getByTestId('volume-value')).toHaveTextContent('75%');
    });

    it('should apply custom className', () => {
      const handleChange = vi.fn();
      render(
        <GuideVolumeSlider value={0.5} onChange={handleChange} className="custom-class" />
      );

      expect(screen.getByTestId('guide-volume-slider')).toHaveClass('custom-class');
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      const handleChange = vi.fn();
      render(<GuideVolumeSlider value={0.5} onChange={handleChange} size="small" />);

      expect(screen.getByTestId('guide-volume-slider')).toHaveClass('guide-volume-slider--small');
    });

    it('should render medium size by default', () => {
      const handleChange = vi.fn();
      render(<GuideVolumeSlider value={0.5} onChange={handleChange} />);

      expect(screen.getByTestId('guide-volume-slider')).toHaveClass('guide-volume-slider--medium');
    });

    it('should render large size', () => {
      const handleChange = vi.fn();
      render(<GuideVolumeSlider value={0.5} onChange={handleChange} size="large" />);

      expect(screen.getByTestId('guide-volume-slider')).toHaveClass('guide-volume-slider--large');
    });
  });

  describe('Value handling', () => {
    it('should display correct fill width based on value', () => {
      const handleChange = vi.fn();
      render(<GuideVolumeSlider value={0.5} onChange={handleChange} />);

      const fill = screen.getByTestId('volume-fill');
      expect(fill).toHaveStyle({ width: '50%' });
    });

    it('should clamp value to 0-1 range', () => {
      const handleChange = vi.fn();
      const { rerender } = render(<GuideVolumeSlider value={1.5} onChange={handleChange} />);

      expect(screen.getByTestId('volume-value')).toHaveTextContent('100%');

      rerender(<GuideVolumeSlider value={-0.5} onChange={handleChange} />);
      expect(screen.getByTestId('volume-value')).toHaveTextContent('0%');
    });
  });

  describe('Mute functionality', () => {
    it('should show mute button when showMuteButton is true', () => {
      const handleChange = vi.fn();
      render(<GuideVolumeSlider value={0.5} onChange={handleChange} showMuteButton />);

      expect(screen.getByTestId('mute-button')).toBeInTheDocument();
    });

    it('should not show mute button when showMuteButton is false', () => {
      const handleChange = vi.fn();
      render(<GuideVolumeSlider value={0.5} onChange={handleChange} showMuteButton={false} />);

      expect(screen.queryByTestId('mute-button')).not.toBeInTheDocument();
    });

    it('should call onMuteToggle when mute button is clicked', () => {
      const handleChange = vi.fn();
      const handleMuteToggle = vi.fn();
      render(
        <GuideVolumeSlider
          value={0.5}
          onChange={handleChange}
          showMuteButton
          onMuteToggle={handleMuteToggle}
        />
      );

      fireEvent.click(screen.getByTestId('mute-button'));
      expect(handleMuteToggle).toHaveBeenCalledTimes(1);
    });

    it('should display 0% when muted', () => {
      const handleChange = vi.fn();
      render(
        <GuideVolumeSlider value={0.5} onChange={handleChange} showValue isMuted />
      );

      expect(screen.getByTestId('volume-value')).toHaveTextContent('0%');
    });
  });

  describe('Interactions', () => {
    it('should call onChange when slider value changes', () => {
      const handleChange = vi.fn();
      render(<GuideVolumeSlider value={0.5} onChange={handleChange} />);

      const input = screen.getByTestId('volume-input');
      fireEvent.change(input, { target: { value: '0.75' } });

      expect(handleChange).toHaveBeenCalledWith(0.75);
    });

    it('should not call onChange when disabled', () => {
      const handleChange = vi.fn();
      render(<GuideVolumeSlider value={0.5} onChange={handleChange} disabled />);

      const input = screen.getByTestId('volume-input');
      expect(input).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have correct aria attributes', () => {
      const handleChange = vi.fn();
      render(<GuideVolumeSlider value={0.5} onChange={handleChange} />);

      const input = screen.getByTestId('volume-input');
      expect(input).toHaveAttribute('aria-valuemin', '0');
      expect(input).toHaveAttribute('aria-valuemax', '100');
      expect(input).toHaveAttribute('aria-valuenow', '50');
    });

    it('should have correct aria-label for mute button', () => {
      const handleChange = vi.fn();
      render(
        <GuideVolumeSlider value={0.5} onChange={handleChange} showMuteButton isMuted={false} />
      );

      expect(screen.getByTestId('mute-button')).toHaveAttribute(
        'aria-label',
        'Mute guide track'
      );
    });

    it('should have correct aria-label for unmute button', () => {
      const handleChange = vi.fn();
      render(
        <GuideVolumeSlider value={0.5} onChange={handleChange} showMuteButton isMuted />
      );

      expect(screen.getByTestId('mute-button')).toHaveAttribute(
        'aria-label',
        'Unmute guide track'
      );
    });
  });
});
