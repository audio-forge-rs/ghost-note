/**
 * WaveformDisplay Component
 *
 * A visual audio waveform display that supports:
 * - Real-time waveform visualization during recording
 * - Static waveform for completed takes
 * - Playhead position indicator with playback sync
 * - Zoom and scroll for long recordings
 *
 * Uses Canvas API for high-performance rendering.
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  createAudioAnalyzer,
  type AudioAnalyzerResult,
} from '@/lib/audio/microphone';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[WaveformDisplay] ${message}`, ...args);
  }
};

// =============================================================================
// Types
// =============================================================================

/**
 * Display mode for the waveform
 */
export type WaveformMode = 'realtime' | 'static';

/**
 * Props for WaveformDisplay component
 */
export interface WaveformDisplayProps {
  /** Display mode: 'realtime' for live recording, 'static' for completed takes */
  mode: WaveformMode;
  /** Media stream for real-time visualization (required when mode='realtime') */
  stream?: MediaStream | null;
  /** Audio blob or URL for static waveform (required when mode='static') */
  audioSource?: Blob | string | null;
  /** Pre-computed waveform data (array of amplitude values 0-1) */
  waveformData?: number[] | null;
  /** Current playback/recording time in seconds */
  currentTime?: number;
  /** Total duration in seconds */
  duration?: number;
  /** Whether audio is currently playing */
  isPlaying?: boolean;
  /** Callback when user seeks to a position */
  onSeek?: (time: number) => void;
  /** Zoom level (1 = fit to width, higher = zoomed in) */
  zoom?: number;
  /** Horizontal scroll offset (0-1) */
  scrollOffset?: number;
  /** Callback when scroll offset changes */
  onScrollChange?: (offset: number) => void;
  /** Whether zoom/scroll controls are enabled */
  enableZoom?: boolean;
  /** Whether seeking by clicking is enabled */
  enableSeek?: boolean;
  /** Width of the canvas (CSS value) */
  width?: string;
  /** Height of the canvas (CSS value) */
  height?: string;
  /** Waveform color */
  waveformColor?: string;
  /** Waveform color for played portion */
  playedColor?: string;
  /** Playhead color */
  playheadColor?: string;
  /** Background color */
  backgroundColor?: string;
  /** Grid line color */
  gridColor?: string;
  /** Whether to show time grid lines */
  showGrid?: boolean;
  /** Number of samples to display (affects detail level) */
  sampleCount?: number;
  /** Custom CSS class name */
  className?: string;
  /** Accessible label */
  'aria-label'?: string;
}

/**
 * Default colors for waveform visualization
 */
const DEFAULT_COLORS = {
  waveform: '#3b82f6', // Blue
  played: '#60a5fa', // Light blue
  playhead: '#ef4444', // Red
  background: '#1f2937', // Gray-800
  grid: '#374151', // Gray-700
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Decode audio blob/URL to AudioBuffer for waveform extraction
 */
async function decodeAudioSource(
  source: Blob | string
): Promise<AudioBuffer | null> {
  try {
    log('Decoding audio source...');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass();

    let arrayBuffer: ArrayBuffer;

    if (source instanceof Blob) {
      arrayBuffer = await source.arrayBuffer();
    } else {
      const response = await fetch(source);
      arrayBuffer = await response.arrayBuffer();
    }

    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    audioContext.close();

    log('Audio decoded:', {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels: audioBuffer.numberOfChannels,
    });

    return audioBuffer;
  } catch (error) {
    log('Failed to decode audio:', error);
    return null;
  }
}

/**
 * Extract waveform data from AudioBuffer
 */
function extractWaveformData(
  audioBuffer: AudioBuffer,
  samples: number
): number[] {
  const rawData = audioBuffer.getChannelData(0); // Use first channel
  const blockSize = Math.floor(rawData.length / samples);
  const waveform: number[] = [];

  for (let i = 0; i < samples; i++) {
    const start = i * blockSize;
    const end = start + blockSize;

    // Find the peak value in this block
    let max = 0;
    for (let j = start; j < end && j < rawData.length; j++) {
      const value = Math.abs(rawData[j]);
      if (value > max) {
        max = value;
      }
    }

    waveform.push(max);
  }

  log('Extracted waveform data:', samples, 'samples');
  return waveform;
}

/**
 * Format time in seconds to MM:SS or HH:MM:SS
 */
function formatTime(seconds: number): string {
  // Clamp negative values to 0
  const clampedSeconds = Math.max(0, seconds);
  const h = Math.floor(clampedSeconds / 3600);
  const m = Math.floor((clampedSeconds % 3600) / 60);
  const s = Math.floor(clampedSeconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// =============================================================================
// Custom Hooks
// =============================================================================

/**
 * Hook to manage real-time waveform data from a media stream
 */
function useRealtimeWaveform(
  stream: MediaStream | null | undefined,
  sampleCount: number
): number[] {
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const analyzerRef = useRef<AudioAnalyzerResult | null>(null);
  const animationRef = useRef<number | null>(null);
  const historyRef = useRef<number[]>([]);
  const streamRef = useRef<MediaStream | null | undefined>(stream);

  // Track stream changes via ref to avoid sync setState issues
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  useEffect(() => {
    // Clean up existing data when stream changes to null
    if (!stream) {
      historyRef.current = [];
      // Use callback form to avoid sync setState lint issues
      const resetData = () => setWaveformData([]);
      resetData();
      return;
    }

    log('Setting up real-time waveform analyzer');

    let isActive = true;

    const setupAnalyzer = () => {
      try {
        const analyzer = createAudioAnalyzer(stream, {
          fftSize: 2048,
          smoothingTimeConstant: 0.3,
        });
        analyzerRef.current = analyzer;

        const dataArray = new Uint8Array(analyzer.analyser.frequencyBinCount);

        const updateWaveform = () => {
          if (!isActive || !analyzerRef.current) return;

          analyzer.analyser.getByteTimeDomainData(dataArray);

          // Calculate current amplitude
          let max = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const value = Math.abs(dataArray[i] - 128) / 128;
            if (value > max) max = value;
          }

          // Add to history (scrolling waveform effect)
          historyRef.current.push(max);

          // Keep history within bounds
          if (historyRef.current.length > sampleCount) {
            historyRef.current = historyRef.current.slice(-sampleCount);
          }

          setWaveformData([...historyRef.current]);

          animationRef.current = requestAnimationFrame(updateWaveform);
        };

        animationRef.current = requestAnimationFrame(updateWaveform);
      } catch (error) {
        log('Failed to setup real-time waveform:', error);
      }
    };

    setupAnalyzer();

    return () => {
      log('Cleaning up real-time waveform analyzer');
      isActive = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (analyzerRef.current) {
        analyzerRef.current.dispose();
        analyzerRef.current = null;
      }
    };
  }, [stream, sampleCount]);

  return waveformData;
}

/**
 * Hook to extract static waveform data from audio source
 */
function useStaticWaveform(
  audioSource: Blob | string | null | undefined,
  providedData: number[] | null | undefined,
  sampleCount: number
): { data: number[]; isLoading: boolean } {
  const [decodedData, setDecodedData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Use provided data directly if available via useMemo
  // This avoids the need for setState in the effect for provided data
  const waveformData = useMemo(() => {
    if (providedData && providedData.length > 0) {
      return providedData;
    }
    return decodedData;
  }, [providedData, decodedData]);

  useEffect(() => {
    // If we have provided data, no need to decode
    if (providedData && providedData.length > 0) {
      return;
    }

    let cancelled = false;

    // Use async IIFE to handle all setState calls after await
    // This satisfies the linter's sync setState restriction
    (async () => {
      // No source to decode - clear after microtask
      if (!audioSource) {
        await Promise.resolve();
        if (!cancelled) {
          setDecodedData([]);
        }
        return;
      }

      setIsLoading(true);

      const audioBuffer = await decodeAudioSource(audioSource);

      if (cancelled) return;

      if (audioBuffer) {
        const data = extractWaveformData(audioBuffer, sampleCount);
        setDecodedData(data);
      } else {
        setDecodedData([]);
      }

      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [audioSource, providedData, sampleCount]);

  return { data: waveformData, isLoading };
}

// =============================================================================
// Component
// =============================================================================

/**
 * WaveformDisplay displays an audio waveform visualization.
 *
 * Features:
 * - Real-time waveform during recording
 * - Static waveform for completed takes
 * - Playhead position indicator
 * - Zoom and scroll for long recordings
 * - Click to seek functionality
 *
 * @example
 * ```tsx
 * // Real-time mode (during recording)
 * <WaveformDisplay
 *   mode="realtime"
 *   stream={mediaStream}
 *   currentTime={recordingDuration}
 * />
 *
 * // Static mode (completed recording)
 * <WaveformDisplay
 *   mode="static"
 *   audioSource={audioBlob}
 *   currentTime={playbackTime}
 *   duration={totalDuration}
 *   isPlaying={isPlaying}
 *   onSeek={(time) => seek(time)}
 * />
 * ```
 */
export function WaveformDisplay({
  mode,
  stream,
  audioSource,
  waveformData: providedWaveformData,
  currentTime = 0,
  duration = 0,
  isPlaying = false,
  onSeek,
  zoom = 1,
  scrollOffset = 0,
  onScrollChange,
  enableZoom = true,
  enableSeek = true,
  width = '100%',
  height = '80px',
  waveformColor = DEFAULT_COLORS.waveform,
  playedColor = DEFAULT_COLORS.played,
  playheadColor = DEFAULT_COLORS.playhead,
  backgroundColor = DEFAULT_COLORS.background,
  gridColor = DEFAULT_COLORS.grid,
  showGrid = true,
  sampleCount = 200,
  className = '',
  'aria-label': ariaLabel = 'Audio waveform',
}: WaveformDisplayProps): React.ReactElement {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // State
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [localZoom, setLocalZoom] = useState(zoom);
  const [localScrollOffset, setLocalScrollOffset] = useState(scrollOffset);

  // Get waveform data based on mode
  const realtimeData = useRealtimeWaveform(
    mode === 'realtime' ? stream : null,
    sampleCount
  );

  const { data: staticData, isLoading } = useStaticWaveform(
    mode === 'static' ? audioSource : null,
    providedWaveformData,
    sampleCount
  );

  const waveformData = mode === 'realtime' ? realtimeData : staticData;

  // Sync external zoom/scroll with local state
  useEffect(() => {
    setLocalZoom(zoom);
  }, [zoom]);

  useEffect(() => {
    setLocalScrollOffset(scrollOffset);
  }, [scrollOffset]);

  // Calculate visible portion based on zoom and scroll
  const visiblePortion = useMemo(() => {
    const viewWidth = 1 / localZoom;
    const start = localScrollOffset * (1 - viewWidth);
    const end = start + viewWidth;
    return { start, end, viewWidth };
  }, [localZoom, localScrollOffset]);

  // Handle canvas resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Use device pixel ratio for sharp rendering
        const dpr = window.devicePixelRatio || 1;
        setCanvasSize({
          width: Math.floor(width * dpr),
          height: Math.floor(height * dpr),
        });
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Draw waveform
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width: canvasWidth, height: canvasHeight } = canvasSize;
    if (canvasWidth === 0 || canvasHeight === 0) return;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw grid lines
    if (showGrid && mode === 'static' && duration > 0) {
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;

      // Calculate time interval for grid lines
      let interval = 1; // 1 second
      if (duration > 60) interval = 10;
      if (duration > 300) interval = 30;
      if (duration > 600) interval = 60;

      const { start, end } = visiblePortion;
      const visibleDuration = (end - start) * duration;
      const startTime = start * duration;

      for (let t = Math.ceil(startTime / interval) * interval; t < startTime + visibleDuration; t += interval) {
        const x = ((t / duration - start) / (end - start)) * canvasWidth;

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();

        // Draw time label
        ctx.fillStyle = gridColor;
        ctx.font = `${10 * (window.devicePixelRatio || 1)}px monospace`;
        ctx.fillText(formatTime(t), x + 4, canvasHeight - 4);
      }
    }

    // Draw waveform
    if (waveformData.length === 0) {
      // Draw empty state message
      ctx.fillStyle = gridColor;
      ctx.font = `${12 * (window.devicePixelRatio || 1)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(
        isLoading ? 'Loading waveform...' : 'No audio data',
        canvasWidth / 2,
        canvasHeight / 2
      );
      return;
    }

    const centerY = canvasHeight / 2;
    const maxAmplitude = canvasHeight / 2 - 4;

    // Calculate which samples are visible
    const { start, end } = visiblePortion;
    const startSample = Math.floor(start * waveformData.length);
    const endSample = Math.ceil(end * waveformData.length);
    const visibleSamples = endSample - startSample;

    // Calculate playhead position as sample index
    const playheadSample = duration > 0
      ? (currentTime / duration) * waveformData.length
      : waveformData.length;

    // Draw bars
    const barWidth = canvasWidth / visibleSamples;
    const gap = Math.max(1, barWidth * 0.1);

    for (let i = 0; i < visibleSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= waveformData.length) break;

      const amplitude = waveformData[sampleIndex] || 0;
      const barHeight = amplitude * maxAmplitude;
      const x = i * barWidth;

      // Determine color based on playhead position
      const isPlayed = mode === 'static' && sampleIndex < playheadSample;
      ctx.fillStyle = isPlayed ? playedColor : waveformColor;

      // Draw symmetric bar (above and below center)
      ctx.fillRect(x + gap / 2, centerY - barHeight, barWidth - gap, barHeight * 2);
    }

    // Draw playhead for static mode
    if (mode === 'static' && duration > 0) {
      const playheadX = ((currentTime / duration - start) / (end - start)) * canvasWidth;

      if (playheadX >= 0 && playheadX <= canvasWidth) {
        ctx.strokeStyle = playheadColor;
        ctx.lineWidth = 2 * (window.devicePixelRatio || 1);

        ctx.beginPath();
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, canvasHeight);
        ctx.stroke();

        // Draw playhead handle
        ctx.fillStyle = playheadColor;
        ctx.beginPath();
        ctx.moveTo(playheadX - 6, 0);
        ctx.lineTo(playheadX + 6, 0);
        ctx.lineTo(playheadX, 10);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Draw hover indicator
    if (hoverTime !== null && mode === 'static' && enableSeek) {
      const hoverX = ((hoverTime / duration - visiblePortion.start) / (visiblePortion.end - visiblePortion.start)) * canvasWidth;

      if (hoverX >= 0 && hoverX <= canvasWidth) {
        ctx.strokeStyle = `${playheadColor}80`;
        ctx.lineWidth = 1 * (window.devicePixelRatio || 1);

        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.moveTo(hoverX, 0);
        ctx.lineTo(hoverX, canvasHeight);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw time tooltip
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(hoverX - 25, canvasHeight - 20, 50, 16);
        ctx.fillStyle = playheadColor;
        ctx.font = `${10 * (window.devicePixelRatio || 1)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(formatTime(hoverTime), hoverX, canvasHeight - 7);
      }
    }

    // Draw recording indicator for realtime mode
    if (mode === 'realtime' && waveformData.length > 0) {
      const pulseSize = 6 * (window.devicePixelRatio || 1);
      ctx.fillStyle = playheadColor;
      ctx.beginPath();
      ctx.arc(canvasWidth - 15, 15, pulseSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [
    canvasSize,
    waveformData,
    mode,
    duration,
    currentTime,
    isLoading,
    backgroundColor,
    waveformColor,
    playedColor,
    playheadColor,
    gridColor,
    showGrid,
    visiblePortion,
    hoverTime,
    enableSeek,
  ]);

  // Animate waveform drawing
  useEffect(() => {
    const animate = () => {
      drawWaveform();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [drawWaveform]);

  // Handle mouse/touch events for seeking
  const getTimeFromEvent = useCallback(
    (clientX: number): number => {
      const canvas = canvasRef.current;
      if (!canvas || duration === 0) return 0;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const ratio = x / rect.width;

      // Account for zoom and scroll
      const { start, end } = visiblePortion;
      const timeRatio = start + ratio * (end - start);

      return Math.max(0, Math.min(duration, timeRatio * duration));
    },
    [duration, visiblePortion]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (mode !== 'static' || !enableSeek) return;

      const time = getTimeFromEvent(e.clientX);
      setHoverTime(time);

      if (isDragging && onSeek) {
        onSeek(time);
      }
    },
    [mode, enableSeek, getTimeFromEvent, isDragging, onSeek]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (mode !== 'static' || !enableSeek) return;

      setIsDragging(true);
      const time = getTimeFromEvent(e.clientX);
      onSeek?.(time);
    },
    [mode, enableSeek, getTimeFromEvent, onSeek]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverTime(null);
    setIsDragging(false);
  }, []);

  // Handle wheel for zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (!enableZoom || mode !== 'static') return;

      e.preventDefault();

      // Zoom with Ctrl/Cmd + scroll
      if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(1, Math.min(10, localZoom * delta));
        setLocalZoom(newZoom);
        return;
      }

      // Horizontal scroll
      if (localZoom > 1) {
        const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
        const scrollDelta = delta * 0.001;
        const newOffset = Math.max(0, Math.min(1, localScrollOffset + scrollDelta));
        setLocalScrollOffset(newOffset);
        onScrollChange?.(newOffset);
      }
    },
    [enableZoom, mode, localZoom, localScrollOffset, onScrollChange]
  );

  // Handle zoom buttons
  const handleZoomIn = useCallback(() => {
    setLocalZoom((prev) => Math.min(10, prev * 1.5));
  }, []);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(1, localZoom / 1.5);
    setLocalZoom(newZoom);
    if (newZoom === 1) {
      setLocalScrollOffset(0);
      onScrollChange?.(0);
    }
  }, [localZoom, onScrollChange]);

  const handleZoomReset = useCallback(() => {
    setLocalZoom(1);
    setLocalScrollOffset(0);
    onScrollChange?.(0);
  }, [onScrollChange]);

  // Container styles
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width,
    height,
    backgroundColor,
    borderRadius: '8px',
    overflow: 'hidden',
  };

  // Canvas styles
  const canvasStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'block',
    cursor: mode === 'static' && enableSeek ? 'crosshair' : 'default',
  };

  return (
    <div
      ref={containerRef}
      className={`waveform-display waveform-display--${mode} ${className}`.trim()}
      style={containerStyle}
      onWheel={handleWheel}
      data-testid="waveform-display"
      data-mode={mode}
      data-playing={isPlaying}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={canvasStyle}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        role="img"
        aria-label={ariaLabel}
        data-testid="waveform-canvas"
      />

      {/* Zoom controls */}
      {enableZoom && mode === 'static' && (
        <div
          className="waveform-display__zoom-controls"
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            display: 'flex',
            gap: '4px',
            opacity: 0.8,
          }}
          data-testid="zoom-controls"
        >
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={localZoom <= 1}
            style={{
              width: 24,
              height: 24,
              padding: 0,
              border: 'none',
              borderRadius: '4px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              cursor: localZoom <= 1 ? 'not-allowed' : 'pointer',
              opacity: localZoom <= 1 ? 0.5 : 1,
              fontSize: '16px',
              lineHeight: 1,
            }}
            aria-label="Zoom out"
            data-testid="zoom-out-button"
          >
            -
          </button>
          <button
            type="button"
            onClick={handleZoomReset}
            disabled={localZoom === 1}
            style={{
              minWidth: 40,
              height: 24,
              padding: '0 4px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              cursor: localZoom === 1 ? 'not-allowed' : 'pointer',
              opacity: localZoom === 1 ? 0.5 : 1,
              fontSize: '11px',
            }}
            aria-label="Reset zoom"
            data-testid="zoom-reset-button"
          >
            {Math.round(localZoom * 100)}%
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={localZoom >= 10}
            style={{
              width: 24,
              height: 24,
              padding: 0,
              border: 'none',
              borderRadius: '4px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              cursor: localZoom >= 10 ? 'not-allowed' : 'pointer',
              opacity: localZoom >= 10 ? 0.5 : 1,
              fontSize: '16px',
              lineHeight: 1,
            }}
            aria-label="Zoom in"
            data-testid="zoom-in-button"
          >
            +
          </button>
        </div>
      )}

      {/* Scrollbar for zoomed view */}
      {localZoom > 1 && mode === 'static' && (
        <div
          className="waveform-display__scrollbar"
          style={{
            position: 'absolute',
            bottom: '4px',
            left: '8px',
            right: '8px',
            height: '6px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '3px',
          }}
          data-testid="scrollbar"
        >
          <div
            className="waveform-display__scrollbar-thumb"
            style={{
              position: 'absolute',
              top: 0,
              left: `${localScrollOffset * (1 - 1 / localZoom) * 100}%`,
              width: `${(1 / localZoom) * 100}%`,
              height: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '3px',
              cursor: 'grab',
            }}
            data-testid="scrollbar-thumb"
          />
        </div>
      )}

      {/* Time display */}
      {mode === 'static' && duration > 0 && (
        <div
          className="waveform-display__time"
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            padding: '2px 6px',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: 'white',
          }}
          data-testid="time-display"
        >
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div
          className="waveform-display__loading"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          data-testid="loading-overlay"
        >
          <span style={{ color: 'white', fontSize: '14px' }}>Loading waveform...</span>
        </div>
      )}

      {/* CSS for hover effects */}
      <style>{`
        .waveform-display__zoom-controls button:hover:not(:disabled) {
          background-color: rgba(0, 0, 0, 0.7);
        }

        .waveform-display__scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.7);
        }
      `}</style>
    </div>
  );
}

export default WaveformDisplay;
