/**
 * ClickTrackToggle Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClickTrackToggle } from './ClickTrackToggle';

describe('ClickTrackToggle', () => {
  describe('Rendering', () => {
    it('should render with required props', () => {
      const handleToggle = vi.fn();
      render(<ClickTrackToggle enabled={false} onToggle={handleToggle} />);

      expect(screen.getByTestId('click-track-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-button')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-track')).toBeInTheDocument();
    });

    it('should display label when showLabel is true', () => {
      const handleToggle = vi.fn();
      render(<ClickTrackToggle enabled={false} onToggle={handleToggle} showLabel />);

      expect(screen.getByText('Click Track')).toBeInTheDocument();
    });

    it('should display custom label', () => {
      const handleToggle = vi.fn();
      render(
        <ClickTrackToggle
          enabled={false}
          onToggle={handleToggle}
          showLabel
          label="Metronome"
        />
      );

      expect(screen.getByText('Metronome')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const handleToggle = vi.fn();
      render(
        <ClickTrackToggle enabled={false} onToggle={handleToggle} className="custom-class" />
      );

      expect(screen.getByTestId('click-track-toggle')).toHaveClass('custom-class');
    });
  });

  describe('Toggle state', () => {
    it('should show enabled state when enabled is true', () => {
      const handleToggle = vi.fn();
      render(<ClickTrackToggle enabled onToggle={handleToggle} />);

      const toggleButton = screen.getByTestId('toggle-button');
      expect(toggleButton).toHaveAttribute('aria-checked', 'true');
    });

    it('should show disabled state when enabled is false', () => {
      const handleToggle = vi.fn();
      render(<ClickTrackToggle enabled={false} onToggle={handleToggle} />);

      const toggleButton = screen.getByTestId('toggle-button');
      expect(toggleButton).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      const handleToggle = vi.fn();
      render(<ClickTrackToggle enabled={false} onToggle={handleToggle} size="small" />);

      expect(screen.getByTestId('click-track-toggle')).toHaveClass(
        'click-track-toggle--small'
      );
    });

    it('should render medium size by default', () => {
      const handleToggle = vi.fn();
      render(<ClickTrackToggle enabled={false} onToggle={handleToggle} />);

      expect(screen.getByTestId('click-track-toggle')).toHaveClass(
        'click-track-toggle--medium'
      );
    });

    it('should render large size', () => {
      const handleToggle = vi.fn();
      render(<ClickTrackToggle enabled={false} onToggle={handleToggle} size="large" />);

      expect(screen.getByTestId('click-track-toggle')).toHaveClass(
        'click-track-toggle--large'
      );
    });
  });

  describe('Interactions', () => {
    it('should call onToggle when button is clicked', () => {
      const handleToggle = vi.fn();
      render(<ClickTrackToggle enabled={false} onToggle={handleToggle} />);

      fireEvent.click(screen.getByTestId('toggle-button'));
      expect(handleToggle).toHaveBeenCalledWith(true);
    });

    it('should call onToggle with false when enabled and clicked', () => {
      const handleToggle = vi.fn();
      render(<ClickTrackToggle enabled onToggle={handleToggle} />);

      fireEvent.click(screen.getByTestId('toggle-button'));
      expect(handleToggle).toHaveBeenCalledWith(false);
    });

    it('should call onToggle when toggle track is clicked', () => {
      const handleToggle = vi.fn();
      render(<ClickTrackToggle enabled={false} onToggle={handleToggle} />);

      fireEvent.click(screen.getByTestId('toggle-track'));
      expect(handleToggle).toHaveBeenCalledWith(true);
    });

    it('should not call onToggle when disabled', () => {
      const handleToggle = vi.fn();
      render(<ClickTrackToggle enabled={false} onToggle={handleToggle} disabled />);

      fireEvent.click(screen.getByTestId('toggle-button'));
      expect(handleToggle).not.toHaveBeenCalled();
    });

    it('should respond to keyboard Enter', () => {
      const handleToggle = vi.fn();
      render(<ClickTrackToggle enabled={false} onToggle={handleToggle} />);

      fireEvent.keyDown(screen.getByTestId('toggle-button'), { key: 'Enter' });
      expect(handleToggle).toHaveBeenCalledWith(true);
    });

    it('should respond to keyboard Space', () => {
      const handleToggle = vi.fn();
      render(<ClickTrackToggle enabled={false} onToggle={handleToggle} />);

      fireEvent.keyDown(screen.getByTestId('toggle-button'), { key: ' ' });
      expect(handleToggle).toHaveBeenCalledWith(true);
    });
  });

  describe('Volume control', () => {
    it('should show volume control when showVolumeControl is true', () => {
      const handleToggle = vi.fn();
      render(
        <ClickTrackToggle enabled onToggle={handleToggle} showVolumeControl volume={0.5} />
      );

      expect(screen.getByTestId('volume-slider')).toBeInTheDocument();
    });

    it('should not show volume control when showVolumeControl is false', () => {
      const handleToggle = vi.fn();
      render(
        <ClickTrackToggle
          enabled={false}
          onToggle={handleToggle}
          showVolumeControl={false}
        />
      );

      expect(screen.queryByTestId('volume-slider')).not.toBeInTheDocument();
    });

    it('should call onVolumeChange when volume slider changes', () => {
      const handleToggle = vi.fn();
      const handleVolumeChange = vi.fn();
      render(
        <ClickTrackToggle
          enabled
          onToggle={handleToggle}
          showVolumeControl
          volume={0.5}
          onVolumeChange={handleVolumeChange}
        />
      );

      const slider = screen.getByTestId('volume-slider');
      fireEvent.change(slider, { target: { value: '0.8' } });

      expect(handleVolumeChange).toHaveBeenCalledWith(0.8);
    });

    it('should display volume percentage', () => {
      const handleToggle = vi.fn();
      render(
        <ClickTrackToggle enabled onToggle={handleToggle} showVolumeControl volume={0.7} />
      );

      expect(screen.getByText('70%')).toBeInTheDocument();
    });

    it('should disable volume slider when toggle is disabled', () => {
      const handleToggle = vi.fn();
      render(
        <ClickTrackToggle
          enabled={false}
          onToggle={handleToggle}
          showVolumeControl
          volume={0.5}
        />
      );

      const slider = screen.getByTestId('volume-slider');
      expect(slider).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have correct role on toggle button', () => {
      const handleToggle = vi.fn();
      render(<ClickTrackToggle enabled={false} onToggle={handleToggle} />);

      expect(screen.getByTestId('toggle-button')).toHaveAttribute('role', 'switch');
    });

    it('should have correct role on toggle track', () => {
      const handleToggle = vi.fn();
      render(<ClickTrackToggle enabled={false} onToggle={handleToggle} />);

      expect(screen.getByTestId('toggle-track')).toHaveAttribute('role', 'switch');
    });

    it('should have correct aria-label on toggle button', () => {
      const handleToggle = vi.fn();
      render(<ClickTrackToggle enabled={false} onToggle={handleToggle} />);

      expect(screen.getByTestId('toggle-button')).toHaveAttribute(
        'aria-label',
        'Click Track: Off'
      );
    });

    it('should update aria-label when enabled', () => {
      const handleToggle = vi.fn();
      render(<ClickTrackToggle enabled onToggle={handleToggle} />);

      expect(screen.getByTestId('toggle-button')).toHaveAttribute(
        'aria-label',
        'Click Track: On'
      );
    });

    it('should have correct aria-label on volume slider', () => {
      const handleToggle = vi.fn();
      render(
        <ClickTrackToggle enabled onToggle={handleToggle} showVolumeControl volume={0.5} />
      );

      expect(screen.getByTestId('volume-slider')).toHaveAttribute(
        'aria-label',
        'Click track volume'
      );
    });

    it('should be focusable', () => {
      const handleToggle = vi.fn();
      render(<ClickTrackToggle enabled={false} onToggle={handleToggle} />);

      const button = screen.getByTestId('toggle-button');
      button.focus();
      expect(document.activeElement).toBe(button);
    });
  });
});
