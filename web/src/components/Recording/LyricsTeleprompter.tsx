/**
 * LyricsTeleprompter Component
 *
 * A scrolling lyrics display that highlights the current syllable during playback.
 * Helps the singer follow along with the melody in sync.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import type { LyricTiming } from '@/lib/audio/syncPlayback';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[LyricsTeleprompter] ${message}`, ...args);
  }
};

/**
 * Props for LyricsTeleprompter component
 */
export interface LyricsTeleprompterProps {
  /** The full lyrics text, split by lines */
  lyrics: string[];
  /** Current playback time in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Lyric timings for synchronization */
  lyricTimings?: LyricTiming[];
  /** Current active line index */
  currentLineIndex?: number;
  /** Current active syllable index */
  currentSyllableIndex?: number;
  /** Whether playback is active */
  isPlaying?: boolean;
  /** Font size for the lyrics */
  fontSize?: 'small' | 'medium' | 'large' | 'xlarge';
  /** Whether to enable auto-scroll */
  autoScroll?: boolean;
  /** Scroll behavior */
  scrollBehavior?: 'smooth' | 'instant';
  /** Whether to highlight the current line */
  highlightLine?: boolean;
  /** Custom CSS class name */
  className?: string;
  /** Lines of context to show before current line */
  contextLinesBefore?: number;
  /** Lines of context to show after current line */
  contextLinesAfter?: number;
  /** Callback when a lyric line is clicked */
  onLineClick?: (lineIndex: number) => void;
}

/**
 * Font size configurations
 */
const FONT_SIZES = {
  small: { main: '16px', upcoming: '14px', lineHeight: 1.6 },
  medium: { main: '20px', upcoming: '18px', lineHeight: 1.7 },
  large: { main: '28px', upcoming: '24px', lineHeight: 1.8 },
  xlarge: { main: '36px', upcoming: '32px', lineHeight: 2 },
};

/**
 * LyricsTeleprompter displays lyrics in a karaoke-style scrolling view.
 *
 * Features:
 * - Auto-scrolling to keep current line in view
 * - Highlights current line and syllable
 * - Smooth scrolling animation
 * - Context lines before and after current position
 * - Click to seek (when callback provided)
 *
 * @example
 * ```tsx
 * <LyricsTeleprompter
 *   lyrics={['First line', 'Second line', 'Third line']}
 *   currentTime={5.5}
 *   duration={30}
 *   currentLineIndex={1}
 *   isPlaying={true}
 *   fontSize="large"
 * />
 * ```
 */
export function LyricsTeleprompter({
  lyrics,
  currentTime,
  duration,
  currentLineIndex = -1,
  isPlaying = false,
  fontSize = 'medium',
  autoScroll = true,
  scrollBehavior = 'smooth',
  highlightLine = true,
  className = '',
  contextLinesBefore = 2,
  contextLinesAfter = 3,
  onLineClick,
}: LyricsTeleprompterProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sizeConfig = FONT_SIZES[fontSize];

  // Register line ref
  const setLineRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) {
      lineRefs.current.set(index, el);
    } else {
      lineRefs.current.delete(index);
    }
  }, []);

  // Handle user scroll to pause auto-scroll temporarily
  const handleScroll = useCallback(() => {
    if (!isPlaying) return;

    setIsUserScrolling(true);
    log('User scrolling detected');

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Resume auto-scroll after 3 seconds of no user scrolling
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
      log('Resuming auto-scroll');
    }, 3000);
  }, [isPlaying]);

  // Auto-scroll to current line
  useEffect(() => {
    if (!autoScroll || isUserScrolling || currentLineIndex < 0) {
      return;
    }

    const lineEl = lineRefs.current.get(currentLineIndex);
    const container = containerRef.current;

    if (!lineEl || !container) {
      return;
    }

    // Calculate scroll position to center the current line
    const containerRect = container.getBoundingClientRect();
    const lineRect = lineEl.getBoundingClientRect();
    const targetScrollTop =
      lineEl.offsetTop - container.offsetTop - containerRect.height / 2 + lineRect.height / 2;

    log('Scrolling to line:', currentLineIndex, 'target:', targetScrollTop);

    // Use scrollTo if available, otherwise fallback to scrollTop
    if (typeof container.scrollTo === 'function') {
      container.scrollTo({
        top: targetScrollTop,
        behavior: scrollBehavior,
      });
    } else {
      container.scrollTop = targetScrollTop;
    }
  }, [currentLineIndex, autoScroll, isUserScrolling, scrollBehavior]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Handle line click
  const handleLineClick = useCallback(
    (index: number) => {
      log('Line clicked:', index);
      onLineClick?.(index);
    },
    [onLineClick]
  );

  // Get line state (past, current, upcoming)
  const getLineState = (
    index: number
  ): 'past' | 'current' | 'upcoming' | 'distant' => {
    if (index < currentLineIndex) {
      return 'past';
    }
    if (index === currentLineIndex) {
      return 'current';
    }
    if (index <= currentLineIndex + contextLinesAfter) {
      return 'upcoming';
    }
    return 'distant';
  };

  // Get line opacity based on distance from current
  const getLineOpacity = (index: number): number => {
    if (currentLineIndex < 0) {
      return index < contextLinesBefore ? 1 : 0.5;
    }

    const distance = Math.abs(index - currentLineIndex);

    if (distance === 0) return 1;
    if (distance === 1) return 0.8;
    if (distance === 2) return 0.6;
    if (distance === 3) return 0.4;
    return 0.25;
  };

  // Progress indicator
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Container styles
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    minHeight: '200px',
    maxHeight: '400px',
    overflow: 'auto',
    backgroundColor: '#111827',
    borderRadius: '8px',
    padding: '24px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    scrollbarWidth: 'thin',
    scrollbarColor: '#4b5563 #1f2937',
  };

  // Lines container styles
  const linesContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingTop: '50%',
    paddingBottom: '50%',
  };

  return (
    <div
      className={`lyrics-teleprompter ${className}`.trim()}
      data-testid="lyrics-teleprompter"
      style={{ position: 'relative' }}
    >
      {/* Progress bar */}
      <div
        className="lyrics-teleprompter__progress-container"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          backgroundColor: '#1f2937',
          borderRadius: '8px 8px 0 0',
          overflow: 'hidden',
          zIndex: 10,
        }}
      >
        <div
          className="lyrics-teleprompter__progress-bar"
          style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: '#3b82f6',
            transition: 'width 0.1s linear',
          }}
          data-testid="progress-bar"
        />
      </div>

      {/* Lyrics container */}
      <div
        ref={containerRef}
        className="lyrics-teleprompter__container"
        style={containerStyle}
        onScroll={handleScroll}
        data-testid="lyrics-container"
      >
        <div
          className="lyrics-teleprompter__lines"
          style={linesContainerStyle}
        >
          {lyrics.map((line, index) => {
            const lineState = getLineState(index);
            const isCurrent = lineState === 'current';
            const opacity = getLineOpacity(index);

            return (
              <div
                key={index}
                ref={(el) => setLineRef(index, el)}
                className={`lyrics-teleprompter__line lyrics-teleprompter__line--${lineState}`}
                style={{
                  fontSize: isCurrent ? sizeConfig.main : sizeConfig.upcoming,
                  lineHeight: sizeConfig.lineHeight,
                  color: isCurrent ? '#ffffff' : lineState === 'past' ? '#6b7280' : '#9ca3af',
                  opacity,
                  textAlign: 'center',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: isCurrent && highlightLine
                    ? 'rgba(59, 130, 246, 0.15)'
                    : 'transparent',
                  cursor: onLineClick ? 'pointer' : 'default',
                  transition: 'all 0.3s ease-out',
                  fontWeight: isCurrent ? 600 : 400,
                  transform: isCurrent ? 'scale(1.02)' : 'scale(1)',
                }}
                onClick={() => onLineClick && handleLineClick(index)}
                data-testid={`lyric-line-${index}`}
                data-state={lineState}
              >
                {line || '\u00A0'}
              </div>
            );
          })}
        </div>
      </div>

      {/* Gradient overlays for fade effect */}
      <div
        className="lyrics-teleprompter__fade-top"
        style={{
          position: 'absolute',
          top: '4px',
          left: 0,
          right: 0,
          height: '60px',
          background: 'linear-gradient(to bottom, #111827 0%, transparent 100%)',
          pointerEvents: 'none',
          borderRadius: '8px 8px 0 0',
        }}
      />
      <div
        className="lyrics-teleprompter__fade-bottom"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'linear-gradient(to top, #111827 0%, transparent 100%)',
          pointerEvents: 'none',
          borderRadius: '0 0 8px 8px',
        }}
      />

      {/* Status indicator */}
      {isPlaying && (
        <div
          className="lyrics-teleprompter__status"
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#9ca3af',
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            padding: '4px 8px',
            borderRadius: '4px',
          }}
          data-testid="playing-indicator"
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
          Recording
        </div>
      )}

      {/* Styles */}
      <style>{`
        .lyrics-teleprompter__container::-webkit-scrollbar {
          width: 6px;
        }

        .lyrics-teleprompter__container::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 3px;
        }

        .lyrics-teleprompter__container::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 3px;
        }

        .lyrics-teleprompter__container::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }

        .lyrics-teleprompter__line:hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

export default LyricsTeleprompter;
