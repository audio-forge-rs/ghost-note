/**
 * EmotionArcChart Component
 *
 * Visualizes the emotional progression of a poem across stanzas.
 * Displays sentiment (valence) on the Y-axis and stanza progression on the X-axis,
 * with color indicating arousal level.
 *
 * @module components/Analysis/EmotionArcChart
 */

import { type ReactElement, useId, useMemo, useState, useCallback, useRef, useEffect } from 'react';
import type { EmotionalAnalysis, EmotionalArcEntry } from '@/types/analysis';
import './EmotionArcChart.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[EmotionArcChart] ${message}`, ...args);
  }
};

/**
 * Props for the EmotionArcChart component
 */
export interface EmotionArcChartProps {
  /** Emotional analysis data containing the arc */
  emotion: EmotionalAnalysis;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Chart dimensions and padding configuration
 */
interface ChartDimensions {
  width: number;
  height: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Default chart dimensions
 */
const DEFAULT_DIMENSIONS: ChartDimensions = {
  width: 600,
  height: 300,
  padding: {
    top: 30,
    right: 30,
    bottom: 50,
    left: 50,
  },
};

/**
 * Get color based on arousal level (calm to intense)
 * Low arousal: blue/purple (calm)
 * High arousal: red/orange (intense)
 */
function getArousalColor(arousal: number): string {
  // Clamp arousal to 0-1 range
  const a = Math.max(0, Math.min(1, arousal));

  // Gradient from calm blue (low) to intense red (high)
  if (a < 0.2) {
    return '#6366f1'; // Indigo (very calm)
  }
  if (a < 0.4) {
    return '#8b5cf6'; // Purple (calm)
  }
  if (a < 0.6) {
    return '#a855f7'; // Violet (moderate)
  }
  if (a < 0.8) {
    return '#ec4899'; // Pink (energetic)
  }
  return '#ef4444'; // Red (intense)
}

/**
 * Get descriptive label for arousal level
 */
function getArousalLabel(arousal: number): string {
  if (arousal < 0.2) return 'Very calm';
  if (arousal < 0.4) return 'Calm';
  if (arousal < 0.6) return 'Moderate';
  if (arousal < 0.8) return 'Energetic';
  return 'Intense';
}

/**
 * Get descriptive label for sentiment value
 */
function getSentimentLabel(sentiment: number): string {
  if (sentiment < -0.6) return 'Very negative';
  if (sentiment < -0.2) return 'Negative';
  if (sentiment < 0.2) return 'Neutral';
  if (sentiment < 0.6) return 'Positive';
  return 'Very positive';
}

/**
 * Format sentiment as percentage string
 */
function formatSentiment(sentiment: number): string {
  const percentage = ((sentiment + 1) / 2 * 100).toFixed(0);
  return `${percentage}%`;
}

/**
 * Scale a value from one range to another
 */
function scale(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

/**
 * Generate SVG path data for the emotion arc line
 */
function generateArcPath(
  arc: EmotionalArcEntry[],
  dimensions: ChartDimensions
): string {
  if (arc.length === 0) return '';

  const { width, height, padding } = dimensions;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Sort by stanza index
  const sortedArc = [...arc].sort((a, b) => a.stanza - b.stanza);

  const points = sortedArc.map((entry, index) => {
    const x = padding.left + scale(index, 0, Math.max(1, arc.length - 1), 0, chartWidth);
    // Sentiment -1 to 1 maps to bottom to top
    const y = padding.top + scale(entry.sentiment, -1, 1, chartHeight, 0);
    return { x, y };
  });

  if (points.length === 1) {
    // Single point - just return a small circle center
    return `M ${points[0].x} ${points[0].y}`;
  }

  // Generate smooth curve using Catmull-Rom to Bezier conversion
  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Calculate control points for smooth curve
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
}

/**
 * Generate path for the area fill under the curve
 */
function generateAreaPath(
  arc: EmotionalArcEntry[],
  dimensions: ChartDimensions
): string {
  if (arc.length === 0) return '';

  const { width, height, padding } = dimensions;
  const chartHeight = height - padding.top - padding.bottom;

  // Y position for sentiment = 0 (neutral baseline)
  const baselineY = padding.top + chartHeight / 2;

  const linePath = generateArcPath(arc, dimensions);
  if (!linePath || arc.length === 1) return '';

  const chartWidth = width - padding.left - padding.right;

  const firstX = padding.left;
  const lastX = padding.left + chartWidth;

  // Close the path to baseline
  return `${linePath} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
}

/**
 * EmotionArcChart displays the emotional progression of a poem.
 *
 * Features:
 * - X-axis: stanza progression
 * - Y-axis: sentiment/valence (-1 to +1)
 * - Color: arousal level (calm to intense)
 * - Hover: shows emotion keywords and details
 * - Responsive sizing
 * - Accessible with keyboard navigation and screen reader support
 *
 * @example
 * ```tsx
 * <EmotionArcChart emotion={poemAnalysis.emotion} />
 * ```
 */
export function EmotionArcChart({
  emotion,
  className = '',
}: EmotionArcChartProps): ReactElement {
  const idPrefix = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<ChartDimensions>(DEFAULT_DIMENSIONS);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  log('Rendering EmotionArcChart:', {
    arcLength: emotion.emotionalArc.length,
    overallArousal: emotion.arousal,
  });

  // Responsive sizing based on container width
  useEffect(() => {
    const updateDimensions = (): void => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const newWidth = Math.max(300, Math.min(800, containerWidth));
        const newHeight = Math.max(200, Math.min(400, newWidth * 0.5));

        setDimensions({
          width: newWidth,
          height: newHeight,
          padding: {
            top: 30,
            right: 30,
            bottom: 50,
            left: 50,
          },
        });
        log('Dimensions updated:', { width: newWidth, height: newHeight });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Sort arc by stanza index - used for chart rendering
  const sortedArc = useMemo(
    () => [...emotion.emotionalArc].sort((a, b) => a.stanza - b.stanza),
    [emotion.emotionalArc]
  );

  // Calculate chart area dimensions
  const chartArea = useMemo(() => {
    const { width, height, padding } = dimensions;
    return {
      width: width - padding.left - padding.right,
      height: height - padding.top - padding.bottom,
    };
  }, [dimensions]);

  // Generate point positions
  const points = useMemo(() => {
    return sortedArc.map((entry, index) => {
      const x = dimensions.padding.left + scale(
        index,
        0,
        Math.max(1, sortedArc.length - 1),
        0,
        chartArea.width
      );
      const y = dimensions.padding.top + scale(
        entry.sentiment,
        -1,
        1,
        chartArea.height,
        0
      );
      return { x, y, entry, index };
    });
  }, [sortedArc, dimensions, chartArea]);

  // SVG paths
  const linePath = useMemo(
    () => generateArcPath(sortedArc, dimensions),
    [sortedArc, dimensions]
  );

  const areaPath = useMemo(
    () => generateAreaPath(sortedArc, dimensions),
    [sortedArc, dimensions]
  );

  // Get the active (hovered or focused) point
  const activeIndex = hoveredIndex ?? focusedIndex;
  const activePoint = activeIndex !== null ? points[activeIndex] : null;

  // Event handlers
  const handlePointHover = useCallback((index: number | null) => {
    setHoveredIndex(index);
    log('Point hover:', index);
  }, []);

  const handlePointFocus = useCallback((index: number) => {
    setFocusedIndex(index);
    log('Point focus:', index);
  }, []);

  const handlePointBlur = useCallback(() => {
    setFocusedIndex(null);
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent, currentIndex: number) => {
    let newIndex: number | null = null;

    switch (event.key) {
      case 'ArrowLeft':
        newIndex = Math.max(0, currentIndex - 1);
        break;
      case 'ArrowRight':
        newIndex = Math.min(points.length - 1, currentIndex + 1);
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = points.length - 1;
        break;
      default:
        return;
    }

    if (newIndex !== null) {
      event.preventDefault();
      setFocusedIndex(newIndex);
      // Focus the button element
      const buttonId = `${idPrefix}-point-${newIndex}`;
      const button = document.getElementById(buttonId);
      button?.focus();
    }
  }, [points.length, idPrefix]);

  // Arousal color for the chart
  const arousalColor = getArousalColor(emotion.arousal);
  const arousalLabel = getArousalLabel(emotion.arousal);

  // Y-axis labels
  const yAxisLabels = [
    { value: 1, label: 'Positive' },
    { value: 0, label: 'Neutral' },
    { value: -1, label: 'Negative' },
  ];

  // X-axis labels (stanza numbers)
  const xAxisLabels = sortedArc.map((entry, index) => ({
    index,
    label: `S${entry.stanza + 1}`,
    x: points[index]?.x ?? 0,
  }));

  // Empty state
  if (sortedArc.length === 0) {
    return (
      <div
        ref={containerRef}
        className={`emotion-arc-chart emotion-arc-chart--empty ${className}`.trim()}
        data-testid="emotion-arc-chart"
      >
        <p className="emotion-arc-chart__empty-text">
          No emotional arc data available.
        </p>
      </div>
    );
  }

  const containerClass = ['emotion-arc-chart', className]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <div
      ref={containerRef}
      className={containerClass}
      data-testid="emotion-arc-chart"
      role="region"
      aria-label="Emotion arc visualization"
    >
      {/* Header */}
      <div className="emotion-arc-chart__header">
        <h4 className="emotion-arc-chart__title">Emotional Arc</h4>
        <span
          className="emotion-arc-chart__arousal-badge"
          style={{ backgroundColor: arousalColor }}
          title={`Overall arousal: ${arousalLabel}`}
        >
          {arousalLabel}
        </span>
      </div>

      {/* Legend */}
      <div className="emotion-arc-chart__legend" role="list" aria-label="Chart legend">
        <div className="emotion-arc-chart__legend-item" role="listitem">
          <span className="emotion-arc-chart__legend-label">Arousal</span>
          <div className="emotion-arc-chart__arousal-gradient" aria-hidden="true">
            <span className="emotion-arc-chart__gradient-label">Calm</span>
            <div className="emotion-arc-chart__gradient-bar" />
            <span className="emotion-arc-chart__gradient-label">Intense</span>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="emotion-arc-chart__chart-container">
        <svg
          className="emotion-arc-chart__svg"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Emotional arc chart showing ${sortedArc.length} stanzas. Overall arousal: ${arousalLabel}.`}
        >
          {/* Definitions for gradients and filters */}
          <defs>
            <linearGradient
              id={`${idPrefix}-area-gradient`}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor={arousalColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={arousalColor} stopOpacity="0.05" />
            </linearGradient>
            <filter id={`${idPrefix}-glow`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          <g className="emotion-arc-chart__grid" aria-hidden="true">
            {/* Horizontal grid lines */}
            {yAxisLabels.map(({ value }) => {
              const y = dimensions.padding.top + scale(value, -1, 1, chartArea.height, 0);
              return (
                <line
                  key={`grid-h-${value}`}
                  x1={dimensions.padding.left}
                  y1={y}
                  x2={dimensions.width - dimensions.padding.right}
                  y2={y}
                  className={`emotion-arc-chart__grid-line ${
                    value === 0 ? 'emotion-arc-chart__grid-line--zero' : ''
                  }`}
                />
              );
            })}
            {/* Vertical grid lines */}
            {xAxisLabels.map(({ index, x }) => (
              <line
                key={`grid-v-${index}`}
                x1={x}
                y1={dimensions.padding.top}
                x2={x}
                y2={dimensions.height - dimensions.padding.bottom}
                className="emotion-arc-chart__grid-line emotion-arc-chart__grid-line--vertical"
              />
            ))}
          </g>

          {/* Y-axis labels */}
          <g className="emotion-arc-chart__y-axis" aria-hidden="true">
            {yAxisLabels.map(({ value, label }) => {
              const y = dimensions.padding.top + scale(value, -1, 1, chartArea.height, 0);
              return (
                <text
                  key={`y-label-${value}`}
                  x={dimensions.padding.left - 10}
                  y={y}
                  className="emotion-arc-chart__axis-label emotion-arc-chart__axis-label--y"
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {label}
                </text>
              );
            })}
          </g>

          {/* X-axis labels */}
          <g className="emotion-arc-chart__x-axis" aria-hidden="true">
            {xAxisLabels.map(({ index, label, x }) => (
              <text
                key={`x-label-${index}`}
                x={x}
                y={dimensions.height - dimensions.padding.bottom + 20}
                className="emotion-arc-chart__axis-label emotion-arc-chart__axis-label--x"
                textAnchor="middle"
              >
                {label}
              </text>
            ))}
            <text
              x={dimensions.width / 2}
              y={dimensions.height - 10}
              className="emotion-arc-chart__axis-title"
              textAnchor="middle"
            >
              Stanza
            </text>
          </g>

          {/* Area fill */}
          {areaPath && (
            <path
              d={areaPath}
              className="emotion-arc-chart__area"
              fill={`url(#${idPrefix}-area-gradient)`}
            />
          )}

          {/* Main line */}
          {linePath && (
            <path
              d={linePath}
              className="emotion-arc-chart__line"
              stroke={arousalColor}
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data points */}
          <g className="emotion-arc-chart__points">
            {points.map(({ x, y, entry, index }) => {
              const isActive = index === activeIndex;
              const pointColor = arousalColor;

              return (
                <g key={`point-${index}`}>
                  {/* Larger invisible hit area for easier hovering */}
                  <circle
                    cx={x}
                    cy={y}
                    r={20}
                    fill="transparent"
                    className="emotion-arc-chart__point-hitarea"
                    onMouseEnter={() => handlePointHover(index)}
                    onMouseLeave={() => handlePointHover(null)}
                  />
                  {/* Visible point */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isActive ? 8 : 6}
                    className={`emotion-arc-chart__point ${
                      isActive ? 'emotion-arc-chart__point--active' : ''
                    }`}
                    fill={pointColor}
                    stroke="#ffffff"
                    strokeWidth="2"
                    filter={isActive ? `url(#${idPrefix}-glow)` : undefined}
                  />
                  {/* Accessible button overlay */}
                  <foreignObject
                    x={x - 15}
                    y={y - 15}
                    width="30"
                    height="30"
                  >
                    <button
                      id={`${idPrefix}-point-${index}`}
                      type="button"
                      className="emotion-arc-chart__point-button"
                      aria-label={`Stanza ${entry.stanza + 1}: ${getSentimentLabel(entry.sentiment)}, ${entry.keywords.length} keywords`}
                      onFocus={() => handlePointFocus(index)}
                      onBlur={handlePointBlur}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      tabIndex={index === 0 ? 0 : -1}
                    />
                  </foreignObject>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Tooltip */}
      {activePoint && (
        <div
          className="emotion-arc-chart__tooltip"
          role="tooltip"
          id={`${idPrefix}-tooltip`}
          style={{
            '--tooltip-x': `${activePoint.x}px`,
          } as React.CSSProperties}
          data-testid="emotion-arc-tooltip"
        >
          <div className="emotion-arc-chart__tooltip-header">
            Stanza {activePoint.entry.stanza + 1}
          </div>
          <div className="emotion-arc-chart__tooltip-content">
            <div className="emotion-arc-chart__tooltip-row">
              <span className="emotion-arc-chart__tooltip-label">Sentiment:</span>
              <span className="emotion-arc-chart__tooltip-value">
                {getSentimentLabel(activePoint.entry.sentiment)} ({formatSentiment(activePoint.entry.sentiment)})
              </span>
            </div>
            <div className="emotion-arc-chart__tooltip-row">
              <span className="emotion-arc-chart__tooltip-label">Arousal:</span>
              <span className="emotion-arc-chart__tooltip-value">{arousalLabel}</span>
            </div>
            {activePoint.entry.keywords.length > 0 && (
              <div className="emotion-arc-chart__tooltip-keywords">
                <span className="emotion-arc-chart__tooltip-label">Keywords:</span>
                <div className="emotion-arc-chart__keyword-tags">
                  {activePoint.entry.keywords.slice(0, 5).map((keyword, idx) => (
                    <span key={idx} className="emotion-arc-chart__keyword-tag">
                      {keyword}
                    </span>
                  ))}
                  {activePoint.entry.keywords.length > 5 && (
                    <span className="emotion-arc-chart__keyword-more">
                      +{activePoint.entry.keywords.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="emotion-arc-chart__summary" aria-live="polite">
        <span className="emotion-arc-chart__stat">
          Stanzas: <strong>{sortedArc.length}</strong>
        </span>
        <span className="emotion-arc-chart__stat">
          Overall sentiment:{' '}
          <strong>{getSentimentLabel(emotion.overallSentiment)}</strong>
        </span>
        <span className="emotion-arc-chart__stat">
          Dominant emotions:{' '}
          <strong>
            {emotion.dominantEmotions.slice(0, 3).join(', ') || 'None detected'}
          </strong>
        </span>
      </div>

      {/* Screen reader description */}
      <div className="visually-hidden" aria-live="polite">
        {activePoint && (
          <span>
            Selected stanza {activePoint.entry.stanza + 1}:
            Sentiment is {getSentimentLabel(activePoint.entry.sentiment)}.
            {activePoint.entry.keywords.length > 0 && (
              ` Keywords: ${activePoint.entry.keywords.join(', ')}.`
            )}
          </span>
        )}
      </div>
    </div>
  );
}

export default EmotionArcChart;
