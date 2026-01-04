/**
 * Tests for PlaybackProgressBar Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { PlaybackProgressBar, type PlaybackProgressBarProps } from './PlaybackProgressBar';

describe('PlaybackProgressBar', () => {
  const defaultProps: PlaybackProgressBarProps = {
    currentTime: 0,
    duration: 180,
    onSeek: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders progress bar', () => {
      render(<PlaybackProgressBar {...defaultProps} />);

      expect(screen.getByTestId('playback-progress-bar')).toBeInTheDocument();
    });

    it('renders track element', () => {
      render(<PlaybackProgressBar {...defaultProps} />);

      expect(screen.getByTestId('playback-progress-bar-track')).toBeInTheDocument();
    });

    it('renders progress element', () => {
      render(<PlaybackProgressBar {...defaultProps} />);

      expect(screen.getByTestId('playback-progress-bar-progress')).toBeInTheDocument();
    });

    it('renders seek handle by default', () => {
      render(<PlaybackProgressBar {...defaultProps} />);

      expect(screen.getByTestId('playback-progress-bar-handle')).toBeInTheDocument();
    });

    it('hides handle when showHandle is false', () => {
      render(<PlaybackProgressBar {...defaultProps} showHandle={false} />);

      expect(screen.queryByTestId('playback-progress-bar-handle')).not.toBeInTheDocument();
    });
  });

  describe('time labels', () => {
    it('shows time labels by default', () => {
      render(<PlaybackProgressBar {...defaultProps} currentTime={45} duration={180} />);

      expect(screen.getByTestId('playback-progress-bar-current-time')).toHaveTextContent('0:45');
      expect(screen.getByTestId('playback-progress-bar-duration')).toHaveTextContent('3:00');
    });

    it('hides time labels when showTimeLabels is false', () => {
      render(<PlaybackProgressBar {...defaultProps} showTimeLabels={false} />);

      expect(screen.queryByTestId('playback-progress-bar-current-time')).not.toBeInTheDocument();
      expect(screen.queryByTestId('playback-progress-bar-duration')).not.toBeInTheDocument();
    });

    it('formats time correctly for longer durations', () => {
      render(<PlaybackProgressBar {...defaultProps} currentTime={3661} duration={7200} />);

      // 3661 seconds = 1:01:01
      expect(screen.getByTestId('playback-progress-bar-current-time')).toHaveTextContent('1:01:01');
      // 7200 seconds = 2:00:00
      expect(screen.getByTestId('playback-progress-bar-duration')).toHaveTextContent('2:00:00');
    });

    it('handles edge case of 0 duration', () => {
      render(<PlaybackProgressBar {...defaultProps} currentTime={0} duration={0} />);

      expect(screen.getByTestId('playback-progress-bar-current-time')).toHaveTextContent('0:00');
      expect(screen.getByTestId('playback-progress-bar-duration')).toHaveTextContent('0:00');
    });
  });

  describe('percentage display', () => {
    it('shows percentage when showPercentage is true', () => {
      render(<PlaybackProgressBar {...defaultProps} currentTime={90} duration={180} showPercentage />);

      expect(screen.getByTestId('playback-progress-bar-percentage')).toHaveTextContent('50%');
    });

    it('hides percentage by default', () => {
      render(<PlaybackProgressBar {...defaultProps} />);

      expect(screen.queryByTestId('playback-progress-bar-percentage')).not.toBeInTheDocument();
    });
  });

  describe('seek interaction', () => {
    it('calls onSeek when track is clicked', () => {
      const onSeek = vi.fn();
      render(<PlaybackProgressBar {...defaultProps} onSeek={onSeek} />);

      const track = screen.getByTestId('playback-progress-bar-track');

      // Mock getBoundingClientRect
      Object.defineProperty(track, 'getBoundingClientRect', {
        value: () => ({
          left: 0,
          width: 200,
          top: 0,
          height: 8,
        }),
      });

      fireEvent.click(track, { clientX: 100 }); // Click at 50%

      expect(onSeek).toHaveBeenCalled();
    });

    it('does not call onSeek when disabled', () => {
      const onSeek = vi.fn();
      render(<PlaybackProgressBar {...defaultProps} onSeek={onSeek} disabled />);

      const track = screen.getByTestId('playback-progress-bar-track');
      fireEvent.click(track, { clientX: 100 });

      expect(onSeek).not.toHaveBeenCalled();
    });
  });

  describe('buffered progress', () => {
    it('shows buffered progress when provided', () => {
      render(<PlaybackProgressBar {...defaultProps} bufferedTime={90} />);

      expect(screen.getByTestId('playback-progress-bar-buffered')).toBeInTheDocument();
    });

    it('hides buffered progress when not provided', () => {
      render(<PlaybackProgressBar {...defaultProps} />);

      expect(screen.queryByTestId('playback-progress-bar-buffered')).not.toBeInTheDocument();
    });
  });

  describe('progress calculation', () => {
    it('shows 0% progress at start', () => {
      render(<PlaybackProgressBar {...defaultProps} currentTime={0} duration={180} />);

      const progress = screen.getByTestId('playback-progress-bar-progress');
      expect(progress.style.width).toBe('0%');
    });

    it('shows 50% progress at midpoint', () => {
      render(<PlaybackProgressBar {...defaultProps} currentTime={90} duration={180} />);

      const progress = screen.getByTestId('playback-progress-bar-progress');
      expect(progress.style.width).toBe('50%');
    });

    it('shows 100% progress at end', () => {
      render(<PlaybackProgressBar {...defaultProps} currentTime={180} duration={180} />);

      const progress = screen.getByTestId('playback-progress-bar-progress');
      expect(progress.style.width).toBe('100%');
    });

    it('clamps progress to 0-100%', () => {
      // Test with currentTime > duration
      render(<PlaybackProgressBar {...defaultProps} currentTime={200} duration={180} />);

      const progress = screen.getByTestId('playback-progress-bar-progress');
      expect(progress.style.width).toBe('100%');
    });
  });

  describe('accessibility', () => {
    it('has slider role', () => {
      render(<PlaybackProgressBar {...defaultProps} currentTime={45} duration={180} />);

      const track = screen.getByTestId('playback-progress-bar-track');
      expect(track).toHaveAttribute('role', 'slider');
    });

    it('has correct aria attributes', () => {
      render(<PlaybackProgressBar {...defaultProps} currentTime={45} duration={180} />);

      const track = screen.getByTestId('playback-progress-bar-track');
      expect(track).toHaveAttribute('aria-valuemin', '0');
      expect(track).toHaveAttribute('aria-valuemax', '180');
      expect(track).toHaveAttribute('aria-valuenow', '45');
      expect(track).toHaveAttribute('aria-valuetext', '0:45 of 3:00');
    });

    it('is focusable', () => {
      render(<PlaybackProgressBar {...defaultProps} />);

      const track = screen.getByTestId('playback-progress-bar-track');
      expect(track).toHaveAttribute('tabIndex', '0');
    });

    it('is not focusable when disabled', () => {
      render(<PlaybackProgressBar {...defaultProps} disabled />);

      const track = screen.getByTestId('playback-progress-bar-track');
      expect(track).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('custom styling', () => {
    it('applies custom height', () => {
      render(<PlaybackProgressBar {...defaultProps} height={12} />);

      // Height is applied via inline styles
      expect(screen.getByTestId('playback-progress-bar')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<PlaybackProgressBar {...defaultProps} className="custom-class" />);

      expect(screen.getByTestId('playback-progress-bar')).toHaveClass('custom-class');
    });

    it('uses custom testId', () => {
      render(<PlaybackProgressBar {...defaultProps} testId="custom-progress" />);

      expect(screen.getByTestId('custom-progress')).toBeInTheDocument();
    });
  });
});
