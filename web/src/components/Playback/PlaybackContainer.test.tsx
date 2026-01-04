/**
 * Tests for PlaybackContainer Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { PlaybackContainer, type PlaybackContainerProps } from './PlaybackContainer';

describe('PlaybackContainer', () => {
  const defaultProps: PlaybackContainerProps = {
    playbackState: 'stopped',
    currentTime: 0,
    duration: 180,
    hasContent: true,
    tempo: 120,
    onTempoChange: vi.fn(),
    keySignature: 'C',
    onKeyChange: vi.fn(),
    loopEnabled: false,
    onLoopEnabledChange: vi.fn(),
    onPlay: vi.fn(),
    onPause: vi.fn(),
    onStop: vi.fn(),
    onSeek: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders playback container', () => {
      render(<PlaybackContainer {...defaultProps} />);

      expect(screen.getByTestId('playback-container')).toBeInTheDocument();
    });

    it('renders playback controls', () => {
      render(<PlaybackContainer {...defaultProps} />);

      expect(screen.getByTestId('playback-container-controls')).toBeInTheDocument();
    });

    it('renders tempo slider by default', () => {
      render(<PlaybackContainer {...defaultProps} />);

      expect(screen.getByTestId('playback-container-tempo')).toBeInTheDocument();
    });

    it('renders transpose control by default', () => {
      render(<PlaybackContainer {...defaultProps} />);

      expect(screen.getByTestId('playback-container-transpose')).toBeInTheDocument();
    });

    it('renders loop selector by default', () => {
      render(<PlaybackContainer {...defaultProps} />);

      expect(screen.getByTestId('playback-container-loop')).toBeInTheDocument();
    });

    it('renders progress bar by default', () => {
      render(<PlaybackContainer {...defaultProps} />);

      expect(screen.getByTestId('playback-container-progress')).toBeInTheDocument();
    });

    it('has accessibility region role', () => {
      render(<PlaybackContainer {...defaultProps} />);

      const container = screen.getByTestId('playback-container');
      expect(container).toHaveAttribute('role', 'region');
      expect(container).toHaveAttribute('aria-label', 'Playback controls');
    });
  });

  describe('hiding components', () => {
    it('hides tempo control when showTempo is false', () => {
      render(<PlaybackContainer {...defaultProps} showTempo={false} />);

      expect(screen.queryByTestId('playback-container-tempo')).not.toBeInTheDocument();
    });

    it('hides transpose control when showTranspose is false', () => {
      render(<PlaybackContainer {...defaultProps} showTranspose={false} />);

      expect(screen.queryByTestId('playback-container-transpose')).not.toBeInTheDocument();
    });

    it('hides loop selector when showLoop is false', () => {
      render(<PlaybackContainer {...defaultProps} showLoop={false} />);

      expect(screen.queryByTestId('playback-container-loop')).not.toBeInTheDocument();
    });

    it('hides progress bar when showProgress is false', () => {
      render(<PlaybackContainer {...defaultProps} showProgress={false} />);

      expect(screen.queryByTestId('playback-container-progress')).not.toBeInTheDocument();
    });
  });

  describe('playback control callbacks', () => {
    it('calls onPlay when play button is clicked', () => {
      const onPlay = vi.fn();
      render(<PlaybackContainer {...defaultProps} onPlay={onPlay} />);

      fireEvent.click(screen.getByTestId('playback-container-controls-play-pause'));

      expect(onPlay).toHaveBeenCalledTimes(1);
    });

    it('calls onPause when pause button is clicked while playing', () => {
      const onPause = vi.fn();
      render(<PlaybackContainer {...defaultProps} playbackState="playing" onPause={onPause} />);

      fireEvent.click(screen.getByTestId('playback-container-controls-play-pause'));

      expect(onPause).toHaveBeenCalledTimes(1);
    });

    it('calls onStop when stop button is clicked', () => {
      const onStop = vi.fn();
      render(<PlaybackContainer {...defaultProps} playbackState="playing" onStop={onStop} />);

      fireEvent.click(screen.getByTestId('playback-container-controls-stop'));

      expect(onStop).toHaveBeenCalledTimes(1);
    });
  });

  describe('tempo control', () => {
    it('displays current tempo', () => {
      render(<PlaybackContainer {...defaultProps} tempo={140} />);

      expect(screen.getByTestId('playback-container-tempo-value')).toHaveTextContent('140 BPM');
    });

    it('calls onTempoChange when tempo is adjusted', () => {
      const onTempoChange = vi.fn();
      render(<PlaybackContainer {...defaultProps} onTempoChange={onTempoChange} />);

      const slider = screen.getByTestId('playback-container-tempo-input');
      fireEvent.change(slider, { target: { value: '150' } });

      expect(onTempoChange).toHaveBeenCalledWith(150);
    });
  });

  describe('key control', () => {
    it('displays current key', () => {
      render(<PlaybackContainer {...defaultProps} keySignature="G" />);

      expect(screen.getByTestId('playback-container-transpose-current')).toHaveTextContent('G Major');
    });

    it('calls onKeyChange when key is changed', () => {
      const onKeyChange = vi.fn();
      render(<PlaybackContainer {...defaultProps} onKeyChange={onKeyChange} />);

      // Find and click a key button
      fireEvent.click(screen.getByTestId('playback-container-transpose-key-G'));

      expect(onKeyChange).toHaveBeenCalledWith('G');
    });
  });

  describe('loop control', () => {
    it('calls onLoopEnabledChange when loop is toggled', () => {
      const onLoopEnabledChange = vi.fn();
      render(<PlaybackContainer {...defaultProps} onLoopEnabledChange={onLoopEnabledChange} />);

      fireEvent.click(screen.getByTestId('playback-container-loop-toggle'));

      expect(onLoopEnabledChange).toHaveBeenCalledWith(true);
    });
  });

  describe('progress bar', () => {
    it('displays current time and duration', () => {
      render(<PlaybackContainer {...defaultProps} currentTime={45} duration={180} />);

      expect(screen.getByTestId('playback-container-progress-current-time')).toHaveTextContent('0:45');
      expect(screen.getByTestId('playback-container-progress-duration')).toHaveTextContent('3:00');
    });
  });

  describe('keyboard shortcuts', () => {
    it('handles Space key for play/pause', () => {
      const onPlay = vi.fn();
      render(<PlaybackContainer {...defaultProps} onPlay={onPlay} />);

      act(() => {
        const event = new KeyboardEvent('keydown', { key: ' ' });
        window.dispatchEvent(event);
      });

      expect(onPlay).toHaveBeenCalledTimes(1);
    });

    it('handles Escape key for stop', () => {
      const onStop = vi.fn();
      render(<PlaybackContainer {...defaultProps} playbackState="playing" onStop={onStop} />);

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Escape' });
        window.dispatchEvent(event);
      });

      expect(onStop).toHaveBeenCalledTimes(1);
    });

    it('handles + key for tempo up', () => {
      const onTempoChange = vi.fn();
      render(<PlaybackContainer {...defaultProps} tempo={100} onTempoChange={onTempoChange} />);

      act(() => {
        const event = new KeyboardEvent('keydown', { key: '+' });
        window.dispatchEvent(event);
      });

      expect(onTempoChange).toHaveBeenCalledWith(110);
    });

    it('handles - key for tempo down', () => {
      const onTempoChange = vi.fn();
      render(<PlaybackContainer {...defaultProps} tempo={100} onTempoChange={onTempoChange} />);

      act(() => {
        const event = new KeyboardEvent('keydown', { key: '-' });
        window.dispatchEvent(event);
      });

      expect(onTempoChange).toHaveBeenCalledWith(90);
    });

    it('handles L key for loop toggle', () => {
      const onLoopEnabledChange = vi.fn();
      render(<PlaybackContainer {...defaultProps} onLoopEnabledChange={onLoopEnabledChange} />);

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'l' });
        window.dispatchEvent(event);
      });

      expect(onLoopEnabledChange).toHaveBeenCalledWith(true);
    });

    it('handles ArrowRight for seek forward', () => {
      const onSeek = vi.fn();
      render(<PlaybackContainer {...defaultProps} currentTime={30} onSeek={onSeek} />);

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
        window.dispatchEvent(event);
      });

      expect(onSeek).toHaveBeenCalledWith(35);
    });

    it('handles ArrowLeft for seek backward', () => {
      const onSeek = vi.fn();
      render(<PlaybackContainer {...defaultProps} currentTime={30} onSeek={onSeek} />);

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
        window.dispatchEvent(event);
      });

      expect(onSeek).toHaveBeenCalledWith(25);
    });

    it('disables keyboard when keyboardEnabled is false', () => {
      const onPlay = vi.fn();
      render(<PlaybackContainer {...defaultProps} onPlay={onPlay} keyboardEnabled={false} />);

      act(() => {
        const event = new KeyboardEvent('keydown', { key: ' ' });
        window.dispatchEvent(event);
      });

      expect(onPlay).not.toHaveBeenCalled();
    });

    it('disables keyboard when hasContent is false', () => {
      const onPlay = vi.fn();
      render(<PlaybackContainer {...defaultProps} onPlay={onPlay} hasContent={false} />);

      act(() => {
        const event = new KeyboardEvent('keydown', { key: ' ' });
        window.dispatchEvent(event);
      });

      expect(onPlay).not.toHaveBeenCalled();
    });
  });

  describe('layout variants', () => {
    it('renders with vertical layout (default)', () => {
      render(<PlaybackContainer {...defaultProps} layout="vertical" />);

      expect(screen.getByTestId('playback-container')).toBeInTheDocument();
    });

    it('renders with horizontal layout', () => {
      render(<PlaybackContainer {...defaultProps} layout="horizontal" />);

      expect(screen.getByTestId('playback-container')).toBeInTheDocument();
    });

    it('renders with compact layout', () => {
      render(<PlaybackContainer {...defaultProps} layout="compact" />);

      expect(screen.getByTestId('playback-container')).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('disables all controls when disabled', () => {
      render(<PlaybackContainer {...defaultProps} disabled />);

      expect(screen.getByTestId('playback-container-controls-play-pause')).toBeDisabled();
    });
  });

  describe('custom styling', () => {
    it('applies custom className', () => {
      render(<PlaybackContainer {...defaultProps} className="custom-class" />);

      expect(screen.getByTestId('playback-container')).toHaveClass('custom-class');
    });

    it('uses custom testId', () => {
      render(<PlaybackContainer {...defaultProps} testId="custom-container" />);

      expect(screen.getByTestId('custom-container')).toBeInTheDocument();
    });
  });
});
