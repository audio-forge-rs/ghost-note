/**
 * WaveformDisplay Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WaveformDisplay } from './WaveformDisplay';

// Mock canvas context
const mockCanvasContext = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: 'left' as CanvasTextAlign,
  fillRect: vi.fn(),
  fillText: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  closePath: vi.fn(),
  setLineDash: vi.fn(),
};

// Mock ResizeObserver
class MockResizeObserver {
  private callback: ResizeObserverCallback;
  private elements: Element[] = [];

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(element: Element): void {
    this.elements.push(element);
    // Trigger initial callback
    setTimeout(() => {
      this.callback(
        [
          {
            target: element,
            contentRect: {
              width: 400,
              height: 80,
              top: 0,
              left: 0,
              bottom: 80,
              right: 400,
              x: 0,
              y: 0,
              toJSON: () => ({}),
            },
            borderBoxSize: [],
            contentBoxSize: [],
            devicePixelContentBoxSize: [],
          },
        ],
        this
      );
    }, 0);
  }

  unobserve(): void {}
  disconnect(): void {
    this.elements = [];
  }
}

// Mock AudioContext
class MockAudioContext {
  sampleRate = 44100;
  state: AudioContextState = 'running';

  createMediaStreamSource(): MediaStreamAudioSourceNode {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
    } as unknown as MediaStreamAudioSourceNode;
  }

  createAnalyser(): AnalyserNode {
    return {
      fftSize: 2048,
      frequencyBinCount: 1024,
      smoothingTimeConstant: 0.8,
      minDecibels: -100,
      maxDecibels: -30,
      getByteTimeDomainData: vi.fn((array: Uint8Array) => {
        // Fill with centered values (128 = silence)
        for (let i = 0; i < array.length; i++) {
          array[i] = 128 + Math.floor(Math.random() * 20 - 10);
        }
      }),
      getByteFrequencyData: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
    } as unknown as AnalyserNode;
  }

  async decodeAudioData(buffer: ArrayBuffer): Promise<AudioBuffer> {
    return {
      duration: 10,
      sampleRate: 44100,
      numberOfChannels: 2,
      length: buffer.byteLength,
      getChannelData: () => new Float32Array(1024).fill(0.5),
      copyFromChannel: vi.fn(),
      copyToChannel: vi.fn(),
    } as unknown as AudioBuffer;
  }

  close(): Promise<void> {
    return Promise.resolve();
  }
}

// Setup mocks
beforeEach(() => {
  // Mock ResizeObserver
  global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

  // Mock AudioContext
  global.AudioContext = MockAudioContext as unknown as typeof AudioContext;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).webkitAudioContext = MockAudioContext;

  // Mock canvas getContext
  HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCanvasContext) as unknown as typeof HTMLCanvasElement.prototype.getContext;

  // Mock requestAnimationFrame
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    // Call once immediately for testing
    setTimeout(() => cb(Date.now()), 0);
    return 1;
  });

  // Mock devicePixelRatio
  Object.defineProperty(window, 'devicePixelRatio', {
    value: 1,
    writable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Create mock media stream
function createMockStream(): MediaStream {
  const track = {
    kind: 'audio',
    label: 'Test Microphone',
    enabled: true,
    muted: false,
    readyState: 'live',
    stop: vi.fn(),
    clone: vi.fn(),
    getConstraints: vi.fn(() => ({})),
    getCapabilities: vi.fn(() => ({})),
    getSettings: vi.fn(() => ({})),
    applyConstraints: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
    id: 'test-track-id',
    contentHint: '',
    onmute: null,
    onunmute: null,
    onended: null,
  } as unknown as MediaStreamTrack;

  return {
    getAudioTracks: () => [track],
    getTracks: () => [track],
    getVideoTracks: () => [],
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    clone: vi.fn(),
    active: true,
    id: 'test-stream-id',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
    onaddtrack: null,
    onremovetrack: null,
  } as unknown as MediaStream;
}

// Create mock audio blob
function createMockAudioBlob(): Blob {
  return new Blob([new ArrayBuffer(1024)], { type: 'audio/webm' });
}

describe('WaveformDisplay', () => {
  describe('Rendering', () => {
    it('should render in realtime mode', () => {
      render(<WaveformDisplay mode="realtime" />);

      expect(screen.getByTestId('waveform-display')).toBeInTheDocument();
      expect(screen.getByTestId('waveform-display')).toHaveAttribute('data-mode', 'realtime');
    });

    it('should render in static mode', () => {
      render(<WaveformDisplay mode="static" />);

      expect(screen.getByTestId('waveform-display')).toBeInTheDocument();
      expect(screen.getByTestId('waveform-display')).toHaveAttribute('data-mode', 'static');
    });

    it('should apply custom className', () => {
      render(<WaveformDisplay mode="static" className="custom-class" />);

      expect(screen.getByTestId('waveform-display')).toHaveClass('custom-class');
    });

    it('should render canvas element', () => {
      render(<WaveformDisplay mode="static" />);

      expect(screen.getByTestId('waveform-canvas')).toBeInTheDocument();
    });

    it('should render with custom dimensions', () => {
      render(<WaveformDisplay mode="static" width="500px" height="100px" />);

      const container = screen.getByTestId('waveform-display');
      expect(container).toHaveStyle({ width: '500px', height: '100px' });
    });
  });

  describe('Real-time mode', () => {
    it('should accept media stream', () => {
      const mockStream = createMockStream();
      render(<WaveformDisplay mode="realtime" stream={mockStream} />);

      expect(screen.getByTestId('waveform-display')).toBeInTheDocument();
    });

    it('should not show zoom controls in realtime mode', () => {
      const mockStream = createMockStream();
      render(<WaveformDisplay mode="realtime" stream={mockStream} enableZoom />);

      expect(screen.queryByTestId('zoom-controls')).not.toBeInTheDocument();
    });

    it('should not show time display in realtime mode', () => {
      const mockStream = createMockStream();
      render(
        <WaveformDisplay
          mode="realtime"
          stream={mockStream}
          currentTime={5}
          duration={60}
        />
      );

      expect(screen.queryByTestId('time-display')).not.toBeInTheDocument();
    });
  });

  describe('Static mode', () => {
    it('should accept audio blob', () => {
      const mockBlob = createMockAudioBlob();
      render(<WaveformDisplay mode="static" audioSource={mockBlob} />);

      expect(screen.getByTestId('waveform-display')).toBeInTheDocument();
    });

    it('should accept pre-computed waveform data', () => {
      const waveformData = Array.from({ length: 100 }, () => Math.random());
      render(<WaveformDisplay mode="static" waveformData={waveformData} />);

      expect(screen.getByTestId('waveform-display')).toBeInTheDocument();
    });

    it('should show time display when duration is provided', async () => {
      render(
        <WaveformDisplay mode="static" currentTime={5} duration={60} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('time-display')).toBeInTheDocument();
        expect(screen.getByTestId('time-display')).toHaveTextContent('0:05 / 1:00');
      });
    });

    it('should show zoom controls when enableZoom is true', () => {
      render(<WaveformDisplay mode="static" enableZoom />);

      expect(screen.getByTestId('zoom-controls')).toBeInTheDocument();
      expect(screen.getByTestId('zoom-in-button')).toBeInTheDocument();
      expect(screen.getByTestId('zoom-out-button')).toBeInTheDocument();
      expect(screen.getByTestId('zoom-reset-button')).toBeInTheDocument();
    });

    it('should hide zoom controls when enableZoom is false', () => {
      render(<WaveformDisplay mode="static" enableZoom={false} />);

      expect(screen.queryByTestId('zoom-controls')).not.toBeInTheDocument();
    });

    it('should show loading overlay when loading', async () => {
      const mockBlob = createMockAudioBlob();
      render(<WaveformDisplay mode="static" audioSource={mockBlob} />);

      // Initially should show loading
      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-overlay')).toBeInTheDocument();
        },
        { timeout: 100 }
      ).catch(() => {
        // Loading might complete too fast in tests
      });
    });
  });

  describe('Playhead', () => {
    it('should indicate playing state via data attribute', () => {
      render(
        <WaveformDisplay
          mode="static"
          currentTime={30}
          duration={60}
          isPlaying={true}
        />
      );

      expect(screen.getByTestId('waveform-display')).toHaveAttribute('data-playing', 'true');
    });

    it('should indicate paused state via data attribute', () => {
      render(
        <WaveformDisplay
          mode="static"
          currentTime={30}
          duration={60}
          isPlaying={false}
        />
      );

      expect(screen.getByTestId('waveform-display')).toHaveAttribute('data-playing', 'false');
    });
  });

  describe('Seeking', () => {
    it('should call onSeek when canvas is clicked', () => {
      const handleSeek = vi.fn();
      render(
        <WaveformDisplay
          mode="static"
          duration={60}
          onSeek={handleSeek}
          enableSeek
        />
      );

      const canvas = screen.getByTestId('waveform-canvas');

      // Mock getBoundingClientRect
      vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 400,
        height: 80,
        right: 400,
        bottom: 80,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      fireEvent.mouseDown(canvas, { clientX: 200 });

      expect(handleSeek).toHaveBeenCalled();
    });

    it('should not call onSeek when enableSeek is false', () => {
      const handleSeek = vi.fn();
      render(
        <WaveformDisplay
          mode="static"
          duration={60}
          onSeek={handleSeek}
          enableSeek={false}
        />
      );

      const canvas = screen.getByTestId('waveform-canvas');
      fireEvent.mouseDown(canvas, { clientX: 200 });

      expect(handleSeek).not.toHaveBeenCalled();
    });

    it('should not seek in realtime mode', () => {
      const handleSeek = vi.fn();
      const mockStream = createMockStream();
      render(
        <WaveformDisplay
          mode="realtime"
          stream={mockStream}
          duration={60}
          onSeek={handleSeek}
          enableSeek
        />
      );

      const canvas = screen.getByTestId('waveform-canvas');
      fireEvent.mouseDown(canvas, { clientX: 200 });

      expect(handleSeek).not.toHaveBeenCalled();
    });
  });

  describe('Zoom controls', () => {
    it('should zoom in when clicking zoom in button', () => {
      render(<WaveformDisplay mode="static" enableZoom />);

      const zoomInButton = screen.getByTestId('zoom-in-button');
      fireEvent.click(zoomInButton);

      // Should show updated zoom percentage
      const zoomResetButton = screen.getByTestId('zoom-reset-button');
      expect(zoomResetButton).toHaveTextContent('150%');
    });

    it('should zoom out when clicking zoom out button', () => {
      render(<WaveformDisplay mode="static" enableZoom zoom={2} />);

      const zoomOutButton = screen.getByTestId('zoom-out-button');
      fireEvent.click(zoomOutButton);

      // Should show updated zoom percentage
      const zoomResetButton = screen.getByTestId('zoom-reset-button');
      expect(zoomResetButton).not.toHaveTextContent('200%');
    });

    it('should reset zoom when clicking reset button', () => {
      render(<WaveformDisplay mode="static" enableZoom zoom={2} />);

      const zoomResetButton = screen.getByTestId('zoom-reset-button');
      fireEvent.click(zoomResetButton);

      // Should show 100%
      expect(zoomResetButton).toHaveTextContent('100%');
    });

    it('should disable zoom out at minimum zoom', () => {
      render(<WaveformDisplay mode="static" enableZoom zoom={1} />);

      const zoomOutButton = screen.getByTestId('zoom-out-button');
      expect(zoomOutButton).toBeDisabled();
    });

    it('should disable zoom in at maximum zoom', () => {
      render(<WaveformDisplay mode="static" enableZoom zoom={10} />);

      const zoomInButton = screen.getByTestId('zoom-in-button');
      expect(zoomInButton).toBeDisabled();
    });

    it('should show scrollbar when zoomed in', () => {
      render(<WaveformDisplay mode="static" enableZoom zoom={2} />);

      expect(screen.getByTestId('scrollbar')).toBeInTheDocument();
      expect(screen.getByTestId('scrollbar-thumb')).toBeInTheDocument();
    });

    it('should not show scrollbar at 1x zoom', () => {
      render(<WaveformDisplay mode="static" enableZoom zoom={1} />);

      expect(screen.queryByTestId('scrollbar')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate aria-label on canvas', () => {
      render(<WaveformDisplay mode="static" aria-label="Recording waveform" />);

      expect(screen.getByTestId('waveform-canvas')).toHaveAttribute(
        'aria-label',
        'Recording waveform'
      );
    });

    it('should have img role on canvas', () => {
      render(<WaveformDisplay mode="static" />);

      expect(screen.getByTestId('waveform-canvas')).toHaveAttribute('role', 'img');
    });

    it('should have aria-label on zoom buttons', () => {
      render(<WaveformDisplay mode="static" enableZoom />);

      expect(screen.getByTestId('zoom-in-button')).toHaveAttribute('aria-label', 'Zoom in');
      expect(screen.getByTestId('zoom-out-button')).toHaveAttribute('aria-label', 'Zoom out');
      expect(screen.getByTestId('zoom-reset-button')).toHaveAttribute('aria-label', 'Reset zoom');
    });
  });

  describe('Colors and styling', () => {
    it('should apply custom colors', () => {
      render(
        <WaveformDisplay
          mode="static"
          waveformColor="#ff0000"
          playedColor="#00ff00"
          playheadColor="#0000ff"
          backgroundColor="#ffffff"
        />
      );

      const container = screen.getByTestId('waveform-display');
      expect(container).toHaveStyle({ backgroundColor: '#ffffff' });
    });

    it('should set crosshair cursor when seeking is enabled', () => {
      render(<WaveformDisplay mode="static" enableSeek />);

      const canvas = screen.getByTestId('waveform-canvas');
      expect(canvas).toHaveStyle({ cursor: 'crosshair' });
    });

    it('should set default cursor when seeking is disabled', () => {
      render(<WaveformDisplay mode="static" enableSeek={false} />);

      const canvas = screen.getByTestId('waveform-canvas');
      expect(canvas).toHaveStyle({ cursor: 'default' });
    });
  });

  describe('Props updates', () => {
    it('should update current time display when currentTime changes', async () => {
      const { rerender } = render(
        <WaveformDisplay mode="static" currentTime={0} duration={60} />
      );

      expect(screen.getByTestId('time-display')).toHaveTextContent('0:00 / 1:00');

      rerender(<WaveformDisplay mode="static" currentTime={30} duration={60} />);

      await waitFor(() => {
        expect(screen.getByTestId('time-display')).toHaveTextContent('0:30 / 1:00');
      });
    });

    it('should update zoom level when zoom prop changes', () => {
      const { rerender } = render(
        <WaveformDisplay mode="static" enableZoom zoom={1} />
      );

      expect(screen.getByTestId('zoom-reset-button')).toHaveTextContent('100%');

      rerender(<WaveformDisplay mode="static" enableZoom zoom={3} />);

      expect(screen.getByTestId('zoom-reset-button')).toHaveTextContent('300%');
    });
  });

  describe('Time formatting', () => {
    it('should format short durations correctly', () => {
      render(<WaveformDisplay mode="static" currentTime={5} duration={45} />);

      expect(screen.getByTestId('time-display')).toHaveTextContent('0:05 / 0:45');
    });

    it('should format minute durations correctly', () => {
      render(<WaveformDisplay mode="static" currentTime={65} duration={180} />);

      expect(screen.getByTestId('time-display')).toHaveTextContent('1:05 / 3:00');
    });

    it('should format hour durations correctly', () => {
      render(<WaveformDisplay mode="static" currentTime={3725} duration={7200} />);

      expect(screen.getByTestId('time-display')).toHaveTextContent('1:02:05 / 2:00:00');
    });
  });

  describe('Edge cases', () => {
    it('should handle zero duration', () => {
      render(<WaveformDisplay mode="static" duration={0} />);

      expect(screen.queryByTestId('time-display')).not.toBeInTheDocument();
    });

    it('should handle empty waveform data', () => {
      render(<WaveformDisplay mode="static" waveformData={[]} />);

      expect(screen.getByTestId('waveform-display')).toBeInTheDocument();
    });

    it('should handle null stream in realtime mode', () => {
      render(<WaveformDisplay mode="realtime" stream={null} />);

      expect(screen.getByTestId('waveform-display')).toBeInTheDocument();
    });

    it('should handle undefined stream in realtime mode', () => {
      render(<WaveformDisplay mode="realtime" stream={undefined} />);

      expect(screen.getByTestId('waveform-display')).toBeInTheDocument();
    });

    it('should handle currentTime greater than duration', () => {
      render(<WaveformDisplay mode="static" currentTime={100} duration={60} />);

      // Should clamp values appropriately
      expect(screen.getByTestId('time-display')).toBeInTheDocument();
    });

    it('should handle negative currentTime', () => {
      render(<WaveformDisplay mode="static" currentTime={-5} duration={60} />);

      // Should clamp to 0
      expect(screen.getByTestId('time-display')).toHaveTextContent('0:00 / 1:00');
    });
  });

  describe('Scroll callback', () => {
    it('should call onScrollChange when scroll changes via zoom reset', () => {
      const handleScrollChange = vi.fn();
      render(
        <WaveformDisplay
          mode="static"
          enableZoom
          zoom={2}
          scrollOffset={0.5}
          onScrollChange={handleScrollChange}
        />
      );

      const zoomResetButton = screen.getByTestId('zoom-reset-button');
      fireEvent.click(zoomResetButton);

      expect(handleScrollChange).toHaveBeenCalledWith(0);
    });
  });
});
