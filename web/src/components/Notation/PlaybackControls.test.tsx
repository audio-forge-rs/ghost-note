/**
 * Tests for PlaybackControls Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { PlaybackControls, TEMPO_PRESETS, type PlaybackControlsProps } from './PlaybackControls';

// Use vi.hoisted to define mock before vi.mock hoisting
const { mockSynth, mockInitSynth, mockGetSynth, mockRenderABC } = vi.hoisted(() => {
  const synth = {
    init: vi.fn().mockResolvedValue(true),
    load: vi.fn().mockResolvedValue(true),
    play: vi.fn().mockResolvedValue(true),
    pause: vi.fn().mockReturnValue(true),
    resume: vi.fn().mockReturnValue(true),
    stop: vi.fn().mockReturnValue(true),
    setTempo: vi.fn(),
    getState: vi.fn().mockReturnValue('ready'),
    dispose: vi.fn(),
  };
  return {
    mockSynth: synth,
    mockInitSynth: vi.fn().mockResolvedValue(synth),
    mockGetSynth: vi.fn().mockReturnValue(null),
    mockRenderABC: vi.fn(() => ({
      tuneObjects: [{ tuneNumber: 0 }],
      success: true,
    })),
  };
});

vi.mock('@/lib/music/abcRenderer', () => ({
  AbcSynth: vi.fn().mockImplementation(() => mockSynth),
  initSynth: mockInitSynth,
  getSynth: mockGetSynth,
  renderABC: mockRenderABC,
}));

describe('PlaybackControls', () => {
  const defaultProps: PlaybackControlsProps = {
    tuneObject: { tuneNumber: 0 } as unknown as PlaybackControlsProps['tuneObject'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSynth.getState.mockReturnValue('ready');
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders all control buttons', () => {
      render(<PlaybackControls {...defaultProps} />);

      expect(screen.getByTestId('play-button')).toBeInTheDocument();
      expect(screen.getByTestId('pause-button')).toBeInTheDocument();
      expect(screen.getByTestId('stop-button')).toBeInTheDocument();
    });

    it('renders tempo controls by default', () => {
      render(<PlaybackControls {...defaultProps} />);

      expect(screen.getByTestId('tempo-controls')).toBeInTheDocument();
      expect(screen.getByTestId('tempo-slider')).toBeInTheDocument();
      expect(screen.getByTestId('tempo-value')).toBeInTheDocument();
    });

    it('renders tempo presets by default', () => {
      render(<PlaybackControls {...defaultProps} />);

      expect(screen.getByTestId('tempo-preset-slow')).toBeInTheDocument();
      expect(screen.getByTestId('tempo-preset-normal')).toBeInTheDocument();
      expect(screen.getByTestId('tempo-preset-fast')).toBeInTheDocument();
      expect(screen.getByTestId('tempo-preset-veryfast')).toBeInTheDocument();
    });

    it('hides tempo controls when showTempoControl is false', () => {
      render(<PlaybackControls {...defaultProps} showTempoControl={false} />);

      expect(screen.queryByTestId('tempo-controls')).not.toBeInTheDocument();
    });

    it('hides tempo presets when showTempoPresets is false', () => {
      render(
        <PlaybackControls {...defaultProps} showTempoPresets={false} />
      );

      expect(screen.queryByTestId('tempo-preset-slow')).not.toBeInTheDocument();
    });

    it('renders playback status', () => {
      render(<PlaybackControls {...defaultProps} />);

      expect(screen.getByTestId('playback-status')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<PlaybackControls {...defaultProps} className="custom-class" />);

      const container = screen.getByTestId('playback-controls');
      expect(container).toHaveClass('playback-controls', 'custom-class');
    });

    it('has correct accessibility attributes', () => {
      render(<PlaybackControls {...defaultProps} />);

      const container = screen.getByTestId('playback-controls');
      expect(container.getAttribute('role')).toBe('group');
      expect(container.getAttribute('aria-label')).toBe('Playback controls');

      expect(screen.getByTestId('play-button').getAttribute('aria-label')).toBeTruthy();
      expect(screen.getByTestId('pause-button').getAttribute('aria-label')).toBeTruthy();
      expect(screen.getByTestId('stop-button').getAttribute('aria-label')).toBeTruthy();
    });
  });

  describe('play button', () => {
    it('shows "Play" text initially', () => {
      render(<PlaybackControls {...defaultProps} />);

      expect(screen.getByTestId('play-button')).toHaveTextContent('Play');
    });

    it('triggers playback initialization when clicked', async () => {
      render(<PlaybackControls {...defaultProps} />);

      fireEvent.click(screen.getByTestId('play-button'));

      // Verify initSynth was called when play is clicked
      await waitFor(() => {
        expect(mockInitSynth).toHaveBeenCalled();
      });
    });
  });

  describe('pause button', () => {
    it('is disabled when not playing', () => {
      render(<PlaybackControls {...defaultProps} />);

      expect(screen.getByTestId('pause-button')).toBeDisabled();
    });
  });

  describe('stop button', () => {
    it('is disabled when not playing or paused', () => {
      render(<PlaybackControls {...defaultProps} />);

      expect(screen.getByTestId('stop-button')).toBeDisabled();
    });
  });

  describe('tempo slider', () => {
    it('displays initial tempo value', () => {
      render(<PlaybackControls {...defaultProps} initialTempo={1.5} />);

      expect(screen.getByTestId('tempo-value')).toHaveTextContent('1.50x');
    });

    it('calls onTempoChange when slider changes', async () => {
      const onTempoChange = vi.fn();

      render(
        <PlaybackControls {...defaultProps} onTempoChange={onTempoChange} />
      );

      const slider = screen.getByTestId('tempo-slider');
      fireEvent.change(slider, { target: { value: '1.5' } });

      await waitFor(() => {
        expect(onTempoChange).toHaveBeenCalledWith(1.5);
      });
    });

    it('respects minTempo and maxTempo props', () => {
      render(
        <PlaybackControls
          {...defaultProps}
          minTempo={0.5}
          maxTempo={2.0}
        />
      );

      const slider = screen.getByTestId('tempo-slider') as HTMLInputElement;
      expect(slider.min).toBe('0.5');
      expect(slider.max).toBe('2');
    });

    it('respects tempoStep prop', () => {
      render(<PlaybackControls {...defaultProps} tempoStep={0.1} />);

      const slider = screen.getByTestId('tempo-slider') as HTMLInputElement;
      expect(slider.step).toBe('0.1');
    });
  });

  describe('tempo presets', () => {
    it('sets tempo to slow when slow button clicked', async () => {
      const onTempoChange = vi.fn();

      render(
        <PlaybackControls {...defaultProps} onTempoChange={onTempoChange} />
      );

      fireEvent.click(screen.getByTestId('tempo-preset-slow'));

      await waitFor(() => {
        expect(onTempoChange).toHaveBeenCalledWith(TEMPO_PRESETS.slow);
      });
    });

    it('sets tempo to normal when normal button clicked', async () => {
      const onTempoChange = vi.fn();

      render(
        <PlaybackControls {...defaultProps} onTempoChange={onTempoChange} />
      );

      fireEvent.click(screen.getByTestId('tempo-preset-normal'));

      await waitFor(() => {
        expect(onTempoChange).toHaveBeenCalledWith(TEMPO_PRESETS.normal);
      });
    });

    it('sets tempo to fast when fast button clicked', async () => {
      const onTempoChange = vi.fn();

      render(
        <PlaybackControls {...defaultProps} onTempoChange={onTempoChange} />
      );

      fireEvent.click(screen.getByTestId('tempo-preset-fast'));

      await waitFor(() => {
        expect(onTempoChange).toHaveBeenCalledWith(TEMPO_PRESETS.fast);
      });
    });

    it('sets tempo to veryFast when 2x button clicked', async () => {
      const onTempoChange = vi.fn();

      render(
        <PlaybackControls {...defaultProps} onTempoChange={onTempoChange} />
      );

      fireEvent.click(screen.getByTestId('tempo-preset-veryfast'));

      await waitFor(() => {
        expect(onTempoChange).toHaveBeenCalledWith(TEMPO_PRESETS.veryFast);
      });
    });
  });

  describe('with ABC notation', () => {
    it('accepts abc prop instead of tuneObject', async () => {
      const container = document.createElement('div');
      container.id = 'abc-test';
      document.body.appendChild(container);

      render(
        <PlaybackControls
          abc={`X:1\nT:Test\nK:C\nCDEF|`}
          notationElementId="abc-test"
        />
      );

      expect(screen.getByTestId('play-button')).toBeInTheDocument();

      document.body.removeChild(container);
    });
  });

  describe('error handling', () => {
    it('calls onError when playback fails', async () => {
      mockInitSynth.mockRejectedValueOnce(new Error('Audio not supported'));

      const onError = vi.fn();

      render(<PlaybackControls {...defaultProps} onError={onError} />);

      fireEvent.click(screen.getByTestId('play-button'));

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });
  });

  describe('TEMPO_PRESETS constant', () => {
    it('exports correct preset values', () => {
      expect(TEMPO_PRESETS.slow).toBe(0.5);
      expect(TEMPO_PRESETS.normal).toBe(1.0);
      expect(TEMPO_PRESETS.fast).toBe(1.5);
      expect(TEMPO_PRESETS.veryFast).toBe(2.0);
    });
  });

  describe('style customization', () => {
    it('applies custom style prop', () => {
      render(
        <PlaybackControls
          {...defaultProps}
          style={{ marginTop: '20px' }}
        />
      );

      const container = screen.getByTestId('playback-controls');
      // Check that custom style is applied via the style attribute
      expect(container.style.marginTop).toBe('20px');
    });
  });
});
