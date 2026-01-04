/**
 * AudioLevelMeter Component
 *
 * A visual audio level meter that displays real-time audio input levels.
 * Supports both bar and gradient styles with peak hold indicator.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  createAudioAnalyzer,
  createAudioLevelMonitor,
  type AudioAnalyzerResult,
  type AudioLevelMonitor,
} from '@/lib/audio/microphone';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[AudioLevelMeter] ${message}`, ...args);
  }
};

/**
 * Visual style options for the level meter
 */
export type LevelMeterStyle = 'bar' | 'gradient' | 'segments';

/**
 * Orientation options for the level meter
 */
export type LevelMeterOrientation = 'horizontal' | 'vertical';

/**
 * Props for AudioLevelMeter component
 */
export interface AudioLevelMeterProps {
  /** The media stream to visualize (required for active visualization) */
  stream?: MediaStream | null;
  /** Manual level value to display (0-1), used when stream is not provided */
  level?: number;
  /** Peak level value (0-1), used when stream is not provided */
  peak?: number;
  /** Visual style of the meter */
  meterStyle?: LevelMeterStyle;
  /** Orientation of the meter */
  orientation?: LevelMeterOrientation;
  /** Whether to show the peak indicator */
  showPeak?: boolean;
  /** Width of the meter (CSS value) */
  width?: string;
  /** Height of the meter (CSS value) */
  height?: string;
  /** Custom CSS class name */
  className?: string;
  /** Update interval in milliseconds */
  updateInterval?: number;
  /** Smoothing factor (0-1) */
  smoothing?: number;
  /** Number of segments for segmented display */
  segments?: number;
  /** Color for low levels (safe zone) */
  colorLow?: string;
  /** Color for mid levels (warning zone) */
  colorMid?: string;
  /** Color for high levels (danger zone) */
  colorHigh?: string;
  /** Threshold for mid level color (0-1) */
  midThreshold?: number;
  /** Threshold for high level color (0-1) */
  highThreshold?: number;
  /** Label for accessibility */
  'aria-label'?: string;
}

/**
 * Default colors for level visualization
 */
const DEFAULT_COLORS = {
  low: '#22c55e', // Green
  mid: '#eab308', // Yellow
  high: '#ef4444', // Red
  background: '#1f2937', // Gray-800
  inactive: '#374151', // Gray-700
};

/**
 * Default thresholds for color changes
 */
const DEFAULT_THRESHOLDS = {
  mid: 0.6,
  high: 0.85,
};

/**
 * AudioLevelMeter displays a real-time audio level visualization.
 *
 * Features:
 * - Three visual styles: bar, gradient, segments
 * - Peak level indicator with hold/decay
 * - Horizontal or vertical orientation
 * - Configurable colors and thresholds
 * - Automatic resource cleanup
 *
 * @example
 * ```tsx
 * // With media stream
 * <AudioLevelMeter
 *   stream={mediaStream}
 *   meterStyle="gradient"
 *   showPeak
 * />
 *
 * // With manual level
 * <AudioLevelMeter
 *   level={0.5}
 *   peak={0.7}
 *   meterStyle="segments"
 * />
 * ```
 */
export function AudioLevelMeter({
  stream,
  level: manualLevel,
  peak: manualPeak,
  meterStyle = 'gradient',
  orientation = 'horizontal',
  showPeak = true,
  width = '100%',
  height = '12px',
  className = '',
  updateInterval = 50,
  smoothing = 0.8,
  segments = 20,
  colorLow = DEFAULT_COLORS.low,
  colorMid = DEFAULT_COLORS.mid,
  colorHigh = DEFAULT_COLORS.high,
  midThreshold = DEFAULT_THRESHOLDS.mid,
  highThreshold = DEFAULT_THRESHOLDS.high,
  'aria-label': ariaLabel = 'Audio level meter',
}: AudioLevelMeterProps): React.ReactElement {
  // State for stream-based levels (updated from monitor callback)
  const [streamLevel, setStreamLevel] = useState(0);
  const [streamPeak, setStreamPeak] = useState(0);

  const analyzerRef = useRef<AudioAnalyzerResult | null>(null);
  const monitorRef = useRef<AudioLevelMonitor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine which level values to use: stream-based or manual props
  // When stream is provided, use stream levels; otherwise use manual props
  // Clamp values to 0-1 range for consistent display
  const rawLevel = stream ? streamLevel : (manualLevel ?? 0);
  const rawPeak = stream ? streamPeak : (manualPeak ?? 0);
  const currentLevel = Math.max(0, Math.min(1, rawLevel));
  const peakLevel = Math.max(0, Math.min(1, rawPeak));

  // Level update callback for stream monitoring
  const handleLevelUpdate = useCallback((level: number, peak: number) => {
    setStreamLevel(level);
    setStreamPeak(peak);
  }, []);

  // Setup analyzer and monitor when stream changes
  useEffect(() => {
    // Skip if no stream
    if (!stream) {
      return;
    }

    log('Setting up audio analysis for stream');

    // Create analyzer
    try {
      const analyzer = createAudioAnalyzer(stream);
      analyzerRef.current = analyzer;

      // Create monitor
      const monitor = createAudioLevelMonitor(analyzer.analyser, {
        updateInterval,
        smoothing,
        onLevel: handleLevelUpdate,
      });
      monitorRef.current = monitor;

      // Start monitoring
      monitor.start();
      log('Audio level monitoring started');
    } catch (error) {
      log('Failed to setup audio analysis:', error);
    }

    // Cleanup
    return () => {
      log('Cleaning up audio analysis');
      monitorRef.current?.dispose();
      analyzerRef.current?.dispose();
      monitorRef.current = null;
      analyzerRef.current = null;
    };
  }, [stream, updateInterval, smoothing, handleLevelUpdate]);

  // Get color based on level
  const getColor = (level: number): string => {
    if (level >= highThreshold) return colorHigh;
    if (level >= midThreshold) return colorMid;
    return colorLow;
  };

  // Generate gradient stops
  const getGradient = (): string => {
    const isVertical = orientation === 'vertical';
    const direction = isVertical ? 'to top' : 'to right';

    return `linear-gradient(${direction},
      ${colorLow} 0%,
      ${colorLow} ${midThreshold * 100}%,
      ${colorMid} ${midThreshold * 100}%,
      ${colorMid} ${highThreshold * 100}%,
      ${colorHigh} ${highThreshold * 100}%,
      ${colorHigh} 100%)`;
  };

  // Calculate dimensions for the level bar
  const getLevelStyle = (): React.CSSProperties => {
    const percentage = Math.max(0, Math.min(100, currentLevel * 100));

    if (orientation === 'vertical') {
      return {
        height: `${percentage}%`,
        width: '100%',
        bottom: 0,
        left: 0,
      };
    }

    return {
      width: `${percentage}%`,
      height: '100%',
      top: 0,
      left: 0,
    };
  };

  // Calculate peak indicator position
  const getPeakStyle = (): React.CSSProperties => {
    const percentage = Math.max(0, Math.min(100, peakLevel * 100));

    if (orientation === 'vertical') {
      return {
        bottom: `calc(${percentage}% - 2px)`,
        left: 0,
        right: 0,
        height: '3px',
      };
    }

    return {
      left: `calc(${percentage}% - 2px)`,
      top: 0,
      bottom: 0,
      width: '3px',
    };
  };

  // Render segmented meter
  const renderSegments = (): React.ReactElement[] => {
    const activeSegments = Math.round(currentLevel * segments);
    const peakSegment = Math.round(peakLevel * segments);

    return Array.from({ length: segments }, (_, index) => {
      const segmentLevel = (index + 1) / segments;
      const isActive = index < activeSegments;
      const isPeak = showPeak && index === peakSegment - 1 && peakSegment > activeSegments;
      const color = isActive ? getColor(segmentLevel) : isPeak ? colorHigh : DEFAULT_COLORS.inactive;

      const segmentStyle: React.CSSProperties = orientation === 'vertical'
        ? {
            width: '100%',
            height: `${100 / segments}%`,
            backgroundColor: color,
            marginTop: index > 0 ? '1px' : 0,
          }
        : {
            height: '100%',
            width: `${100 / segments}%`,
            backgroundColor: color,
            marginLeft: index > 0 ? '1px' : 0,
          };

      return (
        <div
          key={index}
          className="audio-level-meter__segment"
          style={segmentStyle}
          data-active={isActive}
          data-peak={isPeak}
        />
      );
    });
  };

  // Container styles
  const containerStyle: React.CSSProperties = {
    width,
    height,
    backgroundColor: DEFAULT_COLORS.background,
    borderRadius: '4px',
    overflow: 'hidden',
    position: 'relative',
    display: orientation === 'vertical' ? 'flex' : 'block',
    flexDirection: orientation === 'vertical' ? 'column-reverse' : undefined,
    ...((meterStyle === 'segments') && {
      display: 'flex',
      flexDirection: orientation === 'vertical' ? 'column-reverse' : 'row',
      gap: '1px',
      backgroundColor: 'transparent',
    }),
  };

  // Level bar styles
  const levelStyle: React.CSSProperties = {
    ...getLevelStyle(),
    position: 'absolute',
    transition: 'width 0.05s ease-out, height 0.05s ease-out',
    ...(meterStyle === 'gradient'
      ? { background: getGradient() }
      : { backgroundColor: getColor(currentLevel) }),
  };

  // Peak indicator styles
  const peakStyle: React.CSSProperties = {
    ...getPeakStyle(),
    position: 'absolute',
    backgroundColor: colorHigh,
    opacity: 0.9,
    transition: orientation === 'vertical'
      ? 'bottom 0.1s ease-out'
      : 'left 0.1s ease-out',
  };

  // Render segmented style
  if (meterStyle === 'segments') {
    return (
      <div
        ref={containerRef}
        className={`audio-level-meter audio-level-meter--segments audio-level-meter--${orientation} ${className}`.trim()}
        style={containerStyle}
        role="meter"
        aria-label={ariaLabel}
        aria-valuenow={Math.round(currentLevel * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        data-testid="audio-level-meter"
      >
        {renderSegments()}
      </div>
    );
  }

  // Render bar or gradient style
  return (
    <div
      ref={containerRef}
      className={`audio-level-meter audio-level-meter--${meterStyle} audio-level-meter--${orientation} ${className}`.trim()}
      style={containerStyle}
      role="meter"
      aria-label={ariaLabel}
      aria-valuenow={Math.round(currentLevel * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      data-testid="audio-level-meter"
    >
      {/* Level fill */}
      <div className="audio-level-meter__level" style={levelStyle} data-testid="level-fill" />

      {/* Peak indicator */}
      {showPeak && peakLevel > 0 && (
        <div
          className="audio-level-meter__peak"
          style={peakStyle}
          data-testid="peak-indicator"
        />
      )}
    </div>
  );
}

export default AudioLevelMeter;
