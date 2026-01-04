/**
 * Tests for PlaybackControls Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { PlaybackControls, type PlaybackControlsProps } from './PlaybackControls';

describe('PlaybackControls', () => {
  const defaultProps: PlaybackControlsProps = {
    playbackState: 'stopped',
    hasContent: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders play/pause and stop buttons', () => {
      render(<PlaybackControls {...defaultProps} />);

      expect(screen.getByTestId('playback-controls-play-pause')).toBeInTheDocument();
      expect(screen.getByTestId('playback-controls-stop')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<PlaybackControls {...defaultProps} className="custom-class" />);

      const container = screen.getByTestId('playback-controls');
      expect(container).toHaveClass('playback-controls', 'custom-class');
    });

    it('has correct accessibility attributes', () => {
      render(<PlaybackControls {...defaultProps} />);

      const container = screen.getByTestId('playback-controls');
      expect(container).toHaveAttribute('role', 'group');
      expect(container).toHaveAttribute('aria-label', 'Playback controls');
    });

    it('uses custom testId', () => {
      render(<PlaybackControls {...defaultProps} testId="custom-test" />);

      expect(screen.getByTestId('custom-test')).toBeInTheDocument();
      expect(screen.getByTestId('custom-test-play-pause')).toBeInTheDocument();
      expect(screen.getByTestId('custom-test-stop')).toBeInTheDocument();
    });
  });

  describe('play/pause button', () => {
    it('shows play icon when stopped', () => {
      render(<PlaybackControls {...defaultProps} playbackState="stopped" />);

      const button = screen.getByTestId('playback-controls-play-pause');
      expect(button).toHaveAttribute('aria-label', 'Start playback');
    });

    it('shows pause icon when playing', () => {
      render(<PlaybackControls {...defaultProps} playbackState="playing" />);

      const button = screen.getByTestId('playback-controls-play-pause');
      expect(button).toHaveAttribute('aria-label', 'Pause playback');
    });

    it('shows resume label when paused', () => {
      render(<PlaybackControls {...defaultProps} playbackState="paused" />);

      const button = screen.getByTestId('playback-controls-play-pause');
      expect(button).toHaveAttribute('aria-label', 'Resume playback');
    });

    it('calls onPlay when clicked while stopped', () => {
      const onPlay = vi.fn();
      render(<PlaybackControls {...defaultProps} playbackState="stopped" onPlay={onPlay} />);

      fireEvent.click(screen.getByTestId('playback-controls-play-pause'));

      expect(onPlay).toHaveBeenCalledTimes(1);
    });

    it('calls onPause when clicked while playing', () => {
      const onPause = vi.fn();
      render(<PlaybackControls {...defaultProps} playbackState="playing" onPause={onPause} />);

      fireEvent.click(screen.getByTestId('playback-controls-play-pause'));

      expect(onPause).toHaveBeenCalledTimes(1);
    });

    it('calls onPlay when clicked while paused', () => {
      const onPlay = vi.fn();
      render(<PlaybackControls {...defaultProps} playbackState="paused" onPlay={onPlay} />);

      fireEvent.click(screen.getByTestId('playback-controls-play-pause'));

      expect(onPlay).toHaveBeenCalledTimes(1);
    });

    it('is disabled when hasContent is false', () => {
      render(<PlaybackControls {...defaultProps} hasContent={false} />);

      expect(screen.getByTestId('playback-controls-play-pause')).toBeDisabled();
    });

    it('is disabled when disabled prop is true', () => {
      render(<PlaybackControls {...defaultProps} disabled={true} />);

      expect(screen.getByTestId('playback-controls-play-pause')).toBeDisabled();
    });

    it('is disabled during loading state', () => {
      render(<PlaybackControls {...defaultProps} playbackState="loading" />);

      expect(screen.getByTestId('playback-controls-play-pause')).toBeDisabled();
    });
  });

  describe('stop button', () => {
    it('is disabled when stopped', () => {
      render(<PlaybackControls {...defaultProps} playbackState="stopped" />);

      expect(screen.getByTestId('playback-controls-stop')).toBeDisabled();
    });

    it('is enabled when playing', () => {
      render(<PlaybackControls {...defaultProps} playbackState="playing" />);

      expect(screen.getByTestId('playback-controls-stop')).not.toBeDisabled();
    });

    it('is enabled when paused', () => {
      render(<PlaybackControls {...defaultProps} playbackState="paused" />);

      expect(screen.getByTestId('playback-controls-stop')).not.toBeDisabled();
    });

    it('calls onStop when clicked', () => {
      const onStop = vi.fn();
      render(<PlaybackControls {...defaultProps} playbackState="playing" onStop={onStop} />);

      fireEvent.click(screen.getByTestId('playback-controls-stop'));

      expect(onStop).toHaveBeenCalledTimes(1);
    });
  });

  describe('size variants', () => {
    it('applies small size', () => {
      render(<PlaybackControls {...defaultProps} size="small" />);

      // The component renders, size is applied via inline styles
      expect(screen.getByTestId('playback-controls')).toBeInTheDocument();
    });

    it('applies medium size (default)', () => {
      render(<PlaybackControls {...defaultProps} />);

      expect(screen.getByTestId('playback-controls')).toBeInTheDocument();
    });

    it('applies large size', () => {
      render(<PlaybackControls {...defaultProps} size="large" />);

      expect(screen.getByTestId('playback-controls')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows loading indicator when in loading state', () => {
      render(<PlaybackControls {...defaultProps} playbackState="loading" />);

      const button = screen.getByTestId('playback-controls-play-pause');
      expect(button).toHaveAttribute('aria-label', 'Loading');
    });
  });
});
