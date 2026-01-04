/**
 * AudioLevelMeter Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AudioLevelMeter } from './AudioLevelMeter';

// Mock the microphone module
vi.mock('@/lib/audio/microphone', () => ({
  createAudioAnalyzer: vi.fn(),
  createAudioLevelMonitor: vi.fn(),
}));

import { createAudioAnalyzer, createAudioLevelMonitor } from '@/lib/audio/microphone';

const mockCreateAudioAnalyzer = createAudioAnalyzer as ReturnType<typeof vi.fn>;
const mockCreateAudioLevelMonitor = createAudioLevelMonitor as ReturnType<typeof vi.fn>;

// Mock MediaStream
class MockMediaStream {
  getTracks() {
    return [{ stop: vi.fn() }];
  }
  getAudioTracks() {
    return this.getTracks();
  }
}

describe('AudioLevelMeter', () => {
  const mockAnalyzer = {
    analyser: {},
    audioContext: {},
    source: {},
    dispose: vi.fn(),
  };

  const mockMonitor = {
    start: vi.fn(),
    stop: vi.fn(),
    getLevel: vi.fn(() => 0),
    getPeak: vi.fn(() => 0),
    resetPeak: vi.fn(),
    isActive: vi.fn(() => false),
    dispose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateAudioAnalyzer.mockReturnValue(mockAnalyzer);
    mockCreateAudioLevelMonitor.mockReturnValue(mockMonitor);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<AudioLevelMeter />);

      expect(screen.getByTestId('audio-level-meter')).toBeInTheDocument();
      expect(screen.getByRole('meter')).toBeInTheDocument();
    });

    it('should render with gradient style by default', () => {
      render(<AudioLevelMeter />);

      const meter = screen.getByTestId('audio-level-meter');
      expect(meter).toHaveClass('audio-level-meter--gradient');
    });

    it('should render with bar style when specified', () => {
      render(<AudioLevelMeter meterStyle="bar" />);

      const meter = screen.getByTestId('audio-level-meter');
      expect(meter).toHaveClass('audio-level-meter--bar');
    });

    it('should render with segments style when specified', () => {
      render(<AudioLevelMeter meterStyle="segments" segments={10} />);

      const meter = screen.getByTestId('audio-level-meter');
      expect(meter).toHaveClass('audio-level-meter--segments');
    });

    it('should render with horizontal orientation by default', () => {
      render(<AudioLevelMeter />);

      const meter = screen.getByTestId('audio-level-meter');
      expect(meter).toHaveClass('audio-level-meter--horizontal');
    });

    it('should render with vertical orientation when specified', () => {
      render(<AudioLevelMeter orientation="vertical" />);

      const meter = screen.getByTestId('audio-level-meter');
      expect(meter).toHaveClass('audio-level-meter--vertical');
    });
  });

  describe('Manual Level Display', () => {
    it('should display level fill based on manual level prop', () => {
      render(<AudioLevelMeter level={0.5} />);

      const levelFill = screen.getByTestId('level-fill');
      expect(levelFill).toBeInTheDocument();
    });

    it('should display peak indicator when showPeak is true and peak > 0', () => {
      render(<AudioLevelMeter level={0.3} peak={0.5} showPeak />);

      expect(screen.getByTestId('peak-indicator')).toBeInTheDocument();
    });

    it('should not display peak indicator when showPeak is false', () => {
      render(<AudioLevelMeter level={0.3} peak={0.5} showPeak={false} />);

      expect(screen.queryByTestId('peak-indicator')).not.toBeInTheDocument();
    });

    it('should not display peak indicator when peak is 0', () => {
      render(<AudioLevelMeter level={0.3} peak={0} showPeak />);

      expect(screen.queryByTestId('peak-indicator')).not.toBeInTheDocument();
    });

    it('should update when level prop changes', () => {
      const { rerender } = render(<AudioLevelMeter level={0.3} />);

      const meter = screen.getByRole('meter');
      expect(meter).toHaveAttribute('aria-valuenow', '30');

      rerender(<AudioLevelMeter level={0.7} />);

      expect(meter).toHaveAttribute('aria-valuenow', '70');
    });
  });

  describe('Stream-Based Level Display', () => {
    it('should create audio analyzer when stream is provided', () => {
      const mockStream = new MockMediaStream() as unknown as MediaStream;

      render(<AudioLevelMeter stream={mockStream} />);

      expect(mockCreateAudioAnalyzer).toHaveBeenCalledWith(mockStream);
    });

    it('should start level monitor when stream is provided', () => {
      const mockStream = new MockMediaStream() as unknown as MediaStream;

      render(<AudioLevelMeter stream={mockStream} />);

      expect(mockCreateAudioLevelMonitor).toHaveBeenCalled();
      expect(mockMonitor.start).toHaveBeenCalled();
    });

    it('should pass update options to level monitor', () => {
      const mockStream = new MockMediaStream() as unknown as MediaStream;

      render(
        <AudioLevelMeter
          stream={mockStream}
          updateInterval={100}
          smoothing={0.5}
        />
      );

      expect(mockCreateAudioLevelMonitor).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          updateInterval: 100,
          smoothing: 0.5,
        })
      );
    });

    it('should dispose analyzer on unmount', () => {
      const mockStream = new MockMediaStream() as unknown as MediaStream;

      const { unmount } = render(<AudioLevelMeter stream={mockStream} />);

      unmount();

      expect(mockMonitor.dispose).toHaveBeenCalled();
      expect(mockAnalyzer.dispose).toHaveBeenCalled();
    });

    it('should dispose and recreate analyzer when stream changes', () => {
      const mockStream1 = new MockMediaStream() as unknown as MediaStream;
      const mockStream2 = new MockMediaStream() as unknown as MediaStream;

      const { rerender } = render(<AudioLevelMeter stream={mockStream1} />);

      expect(mockCreateAudioAnalyzer).toHaveBeenCalledTimes(1);

      rerender(<AudioLevelMeter stream={mockStream2} />);

      expect(mockMonitor.dispose).toHaveBeenCalled();
      expect(mockAnalyzer.dispose).toHaveBeenCalled();
      expect(mockCreateAudioAnalyzer).toHaveBeenCalledTimes(2);
    });
  });

  describe('Segments Style', () => {
    it('should render correct number of segments', () => {
      render(<AudioLevelMeter meterStyle="segments" segments={10} level={0.5} />);

      const meter = screen.getByTestId('audio-level-meter');
      const segments = meter.querySelectorAll('.audio-level-meter__segment');

      expect(segments).toHaveLength(10);
    });

    it('should mark active segments based on level', () => {
      render(<AudioLevelMeter meterStyle="segments" segments={10} level={0.5} />);

      const meter = screen.getByTestId('audio-level-meter');
      const segments = meter.querySelectorAll('.audio-level-meter__segment');

      // With level 0.5 and 10 segments, 5 segments should be active
      const activeSegments = Array.from(segments).filter(
        (s) => s.getAttribute('data-active') === 'true'
      );

      expect(activeSegments).toHaveLength(5);
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA attributes', () => {
      render(<AudioLevelMeter level={0.5} />);

      const meter = screen.getByRole('meter');

      expect(meter).toHaveAttribute('aria-valuenow', '50');
      expect(meter).toHaveAttribute('aria-valuemin', '0');
      expect(meter).toHaveAttribute('aria-valuemax', '100');
    });

    it('should have custom aria-label', () => {
      render(<AudioLevelMeter aria-label="Input level" />);

      const meter = screen.getByRole('meter');
      expect(meter).toHaveAttribute('aria-label', 'Input level');
    });

    it('should update aria-valuenow based on level', () => {
      const { rerender } = render(<AudioLevelMeter level={0.25} />);

      expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '25');

      rerender(<AudioLevelMeter level={0.75} />);

      expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '75');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      render(<AudioLevelMeter className="custom-meter" />);

      expect(screen.getByTestId('audio-level-meter')).toHaveClass('custom-meter');
    });

    it('should apply custom width and height', () => {
      render(<AudioLevelMeter width="200px" height="20px" />);

      const meter = screen.getByTestId('audio-level-meter');
      expect(meter).toHaveStyle({ width: '200px', height: '20px' });
    });
  });

  describe('Color Thresholds', () => {
    it('should apply low color for levels below mid threshold', () => {
      render(
        <AudioLevelMeter
          level={0.3}
          meterStyle="bar"
          colorLow="#00ff00"
          midThreshold={0.6}
        />
      );

      const levelFill = screen.getByTestId('level-fill');
      expect(levelFill).toHaveStyle({ backgroundColor: '#00ff00' });
    });

    it('should apply mid color for levels between thresholds', () => {
      render(
        <AudioLevelMeter
          level={0.7}
          meterStyle="bar"
          colorMid="#ffff00"
          midThreshold={0.6}
          highThreshold={0.85}
        />
      );

      const levelFill = screen.getByTestId('level-fill');
      expect(levelFill).toHaveStyle({ backgroundColor: '#ffff00' });
    });

    it('should apply high color for levels above high threshold', () => {
      render(
        <AudioLevelMeter
          level={0.9}
          meterStyle="bar"
          colorHigh="#ff0000"
          highThreshold={0.85}
        />
      );

      const levelFill = screen.getByTestId('level-fill');
      expect(levelFill).toHaveStyle({ backgroundColor: '#ff0000' });
    });
  });

  describe('Level Clamping', () => {
    it('should clamp level to 0 for negative values', () => {
      render(<AudioLevelMeter level={-0.5} />);

      const meter = screen.getByRole('meter');
      expect(meter).toHaveAttribute('aria-valuenow', '0');
    });

    it('should clamp level to 100 for values above 1', () => {
      render(<AudioLevelMeter level={1.5} />);

      const meter = screen.getByRole('meter');
      expect(meter).toHaveAttribute('aria-valuenow', '100');
    });
  });
});
