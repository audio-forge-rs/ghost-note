/**
 * TutorialOverlay Component
 *
 * Renders a spotlight overlay that highlights the active tutorial element
 * while dimming the rest of the page. Uses CSS clip-path for the spotlight effect.
 *
 * @module components/Tutorial/TutorialOverlay
 */

import { useEffect, useState, useCallback, type ReactElement } from 'react';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[TutorialOverlay] ${message}`, ...args);
  }
};

/**
 * Rectangle dimensions for highlight positioning
 */
export interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Props for TutorialOverlay
 */
export interface TutorialOverlayProps {
  /** Whether the overlay is visible */
  isVisible: boolean;
  /** CSS selector for the element to highlight */
  highlightSelector?: string;
  /** Padding around the highlighted element */
  padding?: number;
  /** Border radius of the highlight */
  borderRadius?: number;
  /** Whether to show a centered overlay without spotlight */
  isCentered?: boolean;
  /** Callback when overlay is clicked (outside highlighted area) */
  onOverlayClick?: () => void;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Gets the bounding rectangle of an element by selector
 */
function getElementRect(selector: string): HighlightRect | null {
  try {
    const element = document.querySelector(selector);
    if (!element) {
      log('Element not found for selector:', selector);
      return null;
    }

    const rect = element.getBoundingClientRect();
    log('Found element rect:', rect);

    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
    };
  } catch (error) {
    log('Error getting element rect:', error);
    return null;
  }
}

/**
 * TutorialOverlay renders a dimmed overlay with a spotlight on the highlighted element.
 *
 * Features:
 * - Dynamic spotlight following target element
 * - Smooth transitions when spotlight moves
 * - Fallback to centered overlay when no element found
 * - Click handling for overlay dismissal
 * - Responsive to window resize
 *
 * @example
 * ```tsx
 * <TutorialOverlay
 *   isVisible={isActive}
 *   highlightSelector="[data-testid='poem-input']"
 *   onOverlayClick={handleSkip}
 * />
 * ```
 */
export function TutorialOverlay({
  isVisible,
  highlightSelector,
  padding = 8,
  borderRadius = 8,
  isCentered = false,
  onOverlayClick,
  testId = 'tutorial-overlay',
}: TutorialOverlayProps): ReactElement | null {
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);

  // Update highlight position when selector changes or window resizes
  const updateHighlightPosition = useCallback(() => {
    if (!highlightSelector || isCentered) {
      setHighlightRect(null);
      return;
    }

    const rect = getElementRect(highlightSelector);
    if (rect) {
      // Add padding to the highlight
      setHighlightRect({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });
    } else {
      setHighlightRect(null);
    }
  }, [highlightSelector, padding, isCentered]);

  // Initial position update and resize listener
  useEffect(() => {
    if (!isVisible) return;

    // Use requestAnimationFrame to avoid synchronous setState in effect
    const rafId = requestAnimationFrame(() => {
      updateHighlightPosition();
    });

    const handleResize = (): void => {
      updateHighlightPosition();
    };

    const handleScroll = (): void => {
      updateHighlightPosition();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    // Use ResizeObserver for more accurate tracking
    let resizeObserver: ResizeObserver | null = null;
    if (highlightSelector && typeof ResizeObserver !== 'undefined') {
      const element = document.querySelector(highlightSelector);
      if (element) {
        resizeObserver = new ResizeObserver(() => {
          updateHighlightPosition();
        });
        resizeObserver.observe(element);
      }
    }

    // Also update on a short interval to catch dynamic changes
    const intervalId = setInterval(updateHighlightPosition, 500);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      clearInterval(intervalId);
    };
  }, [isVisible, highlightSelector, updateHighlightPosition]);

  // Handle overlay click
  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      // Only trigger if clicking on the overlay itself, not the highlighted area
      if (event.target === event.currentTarget) {
        log('Overlay clicked');
        onOverlayClick?.();
      }
    },
    [onOverlayClick]
  );

  if (!isVisible) {
    return null;
  }

  // Generate the clip-path for the spotlight effect
  // When we have a highlight rect, we create a polygon that covers the whole screen
  // except for the highlighted area
  const getClipPath = (): string => {
    if (!highlightRect || isCentered) {
      return 'none';
    }

    const { top, left, width, height } = highlightRect;
    const r = borderRadius;

    // Create an inverted rounded rectangle using polygon
    // This creates a hole in the overlay where the highlighted element is
    return `polygon(
      0% 0%,
      0% 100%,
      ${left}px 100%,
      ${left}px ${top + r}px,
      ${left + r}px ${top}px,
      ${left + width - r}px ${top}px,
      ${left + width}px ${top + r}px,
      ${left + width}px ${top + height - r}px,
      ${left + width - r}px ${top + height}px,
      ${left + r}px ${top + height}px,
      ${left}px ${top + height - r}px,
      ${left}px 100%,
      100% 100%,
      100% 0%
    )`;
  };

  return (
    <div
      className="tutorial-overlay"
      onClick={handleClick}
      data-testid={testId}
      data-centered={isCentered}
      style={{
        clipPath: getClipPath(),
      }}
      aria-hidden="true"
    >
      {/* Highlight border indicator */}
      {highlightRect && !isCentered && (
        <div
          className="tutorial-overlay__highlight-border"
          data-testid={`${testId}-highlight`}
          style={{
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
            borderRadius: `${borderRadius}px`,
          }}
        />
      )}

      <style>{`
        .tutorial-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.6);
          z-index: 90;
          transition: clip-path 0.3s ease-out;
          pointer-events: auto;
        }

        .tutorial-overlay[data-centered="true"] {
          background-color: rgba(0, 0, 0, 0.7);
        }

        .tutorial-overlay__highlight-border {
          position: absolute;
          border: 2px solid var(--color-primary, #3b82f6);
          box-shadow:
            0 0 0 4px rgba(59, 130, 246, 0.3),
            0 0 20px rgba(59, 130, 246, 0.4);
          pointer-events: none;
          animation: tutorial-highlight-pulse 2s ease-in-out infinite;
          z-index: 91;
        }

        @keyframes tutorial-highlight-pulse {
          0%, 100% {
            box-shadow:
              0 0 0 4px rgba(59, 130, 246, 0.3),
              0 0 20px rgba(59, 130, 246, 0.4);
          }
          50% {
            box-shadow:
              0 0 0 6px rgba(59, 130, 246, 0.4),
              0 0 30px rgba(59, 130, 246, 0.5);
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .tutorial-overlay {
            transition: none;
          }

          .tutorial-overlay__highlight-border {
            animation: none;
            box-shadow:
              0 0 0 4px rgba(59, 130, 246, 0.3),
              0 0 20px rgba(59, 130, 246, 0.4);
          }
        }

        /* Dark mode adjustments */
        .dark .tutorial-overlay {
          background-color: rgba(0, 0, 0, 0.75);
        }

        .dark .tutorial-overlay[data-centered="true"] {
          background-color: rgba(0, 0, 0, 0.85);
        }

        .dark .tutorial-overlay__highlight-border {
          border-color: var(--color-primary-dark, #60a5fa);
          box-shadow:
            0 0 0 4px rgba(96, 165, 250, 0.3),
            0 0 20px rgba(96, 165, 250, 0.4);
        }
      `}</style>
    </div>
  );
}

export default TutorialOverlay;
