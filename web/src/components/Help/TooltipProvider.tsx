/**
 * TooltipProvider Component
 *
 * Provides context-aware tooltips that can be attached to any element.
 * Supports positioning, delays, and help topic links.
 *
 * @module components/Help/TooltipProvider
 */

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useId,
  type ReactNode,
  type ReactElement,
} from 'react';
import { getTopicById } from './helpContent';
import {
  TooltipContext,
  useTooltip,
  type TooltipPosition,
  type TooltipConfig,
  type ActiveTooltip,
} from './tooltipUtils';
import './TooltipProvider.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[TooltipProvider] ${message}`, ...args);
  }
};

/**
 * Props for TooltipProvider
 */
export interface TooltipProviderProps {
  /** Child elements */
  children: ReactNode;
  /** Default delay before showing tooltips (ms) */
  defaultDelay?: number;
  /** Callback when user clicks to open help */
  onOpenHelp?: (topicId: string) => void;
}

/**
 * Calculate optimal tooltip position
 */
function calculatePosition(
  rect: DOMRect,
  position: TooltipPosition,
  tooltipRect?: DOMRect
): { top: number; left: number; position: TooltipPosition } {
  const offset = 8;
  const padding = 12;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let top = 0;
  let left = 0;
  let finalPosition = position;

  // Calculate initial position
  switch (position) {
    case 'top':
      top = rect.top - offset;
      left = rect.left + rect.width / 2;
      break;
    case 'bottom':
      top = rect.bottom + offset;
      left = rect.left + rect.width / 2;
      break;
    case 'left':
      top = rect.top + rect.height / 2;
      left = rect.left - offset;
      break;
    case 'right':
      top = rect.top + rect.height / 2;
      left = rect.right + offset;
      break;
  }

  // Adjust if would overflow viewport
  if (tooltipRect) {
    // Check horizontal overflow
    if (left - tooltipRect.width / 2 < padding) {
      left = padding + tooltipRect.width / 2;
    } else if (left + tooltipRect.width / 2 > viewportWidth - padding) {
      left = viewportWidth - padding - tooltipRect.width / 2;
    }

    // Check vertical overflow and flip if needed
    if (position === 'top' && top - tooltipRect.height < padding) {
      top = rect.bottom + offset;
      finalPosition = 'bottom';
    } else if (
      position === 'bottom' &&
      top + tooltipRect.height > viewportHeight - padding
    ) {
      top = rect.top - offset;
      finalPosition = 'top';
    }
  }

  return { top, left, position: finalPosition };
}

/**
 * TooltipProvider manages tooltips for its children.
 *
 * Features:
 * - Context-based tooltip system
 * - Automatic positioning
 * - Configurable delays
 * - Help topic integration
 * - Accessible (aria support)
 *
 * @example
 * ```tsx
 * <TooltipProvider onOpenHelp={(id) => setHelpTopic(id)}>
 *   <App />
 * </TooltipProvider>
 * ```
 */
export function TooltipProvider({
  children,
  defaultDelay = 300,
  onOpenHelp,
}: TooltipProviderProps): ReactElement {
  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltip | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  log('Rendering TooltipProvider');

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // Show a tooltip
  const showTooltip = useCallback(
    (config: TooltipConfig, element: HTMLElement) => {
      // Clear any pending hide
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      const delay = config.delay ?? defaultDelay;
      log('Showing tooltip:', config.id, { delay });

      // Set up delayed show
      showTimeoutRef.current = setTimeout(() => {
        const rect = element.getBoundingClientRect();
        const helpTopic = config.helpTopicId
          ? getTopicById(config.helpTopicId)
          : undefined;

        setActiveTooltip({ config, rect, helpTopic });
        setIsVisible(true);
      }, delay);
    },
    [defaultDelay]
  );

  // Hide a tooltip
  const hideTooltip = useCallback((id: string) => {
    // Clear any pending show
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
    }

    log('Hiding tooltip:', id);

    // Small delay before hiding to allow moving to tooltip
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      // Clear tooltip after fade out
      setTimeout(() => {
        setActiveTooltip((current) => {
          if (current?.config.id === id) {
            return null;
          }
          return current;
        });
      }, 150);
    }, 100);
  }, []);

  // Check if a tooltip is shown
  const isShown = useCallback(
    (id: string) => {
      return activeTooltip?.config.id === id && isVisible;
    },
    [activeTooltip, isVisible]
  );

  // State for calculated position
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
    position: TooltipPosition;
  } | null>(null);

  // Calculate tooltip position after render when tooltip element is available
  // Note: setState in effect is intentional here to update position after DOM layout
  useEffect(() => {
    if (activeTooltip && isVisible) {
      // Use requestAnimationFrame to ensure tooltip is rendered
      requestAnimationFrame(() => {
        const tooltipRect = tooltipRef.current?.getBoundingClientRect();
        const position = calculatePosition(
          activeTooltip.rect,
          activeTooltip.config.position ?? 'top',
          tooltipRect
        );
         
        setTooltipPosition(position);
      });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: clearing position when tooltip is hidden
      setTooltipPosition(null);
    }
  }, [activeTooltip, isVisible]);

  // Handle help link click
  const handleHelpClick = useCallback(() => {
    if (activeTooltip?.helpTopic && onOpenHelp) {
      log('Opening help for topic:', activeTooltip.helpTopic.id);
      onOpenHelp(activeTooltip.helpTopic.id);
      setIsVisible(false);
    }
  }, [activeTooltip, onOpenHelp]);

  return (
    <TooltipContext.Provider
      value={{ showTooltip, hideTooltip, isShown, onOpenHelp }}
    >
      {children}

      {/* Tooltip element */}
      {activeTooltip && tooltipPosition && (
        <div
          ref={tooltipRef}
          className={`tooltip tooltip--${tooltipPosition.position} ${
            isVisible ? 'tooltip--visible' : ''
          }`}
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
          role="tooltip"
          aria-hidden={!isVisible}
          data-testid={`tooltip-${activeTooltip.config.id}`}
          onMouseEnter={() => {
            if (hideTimeoutRef.current) {
              clearTimeout(hideTimeoutRef.current);
            }
          }}
          onMouseLeave={() => hideTooltip(activeTooltip.config.id)}
        >
          <div className="tooltip__content">{activeTooltip.config.content}</div>

          {activeTooltip.helpTopic && onOpenHelp && (
            <button
              type="button"
              className="tooltip__help-link"
              onClick={handleHelpClick}
              data-testid={`tooltip-help-link-${activeTooltip.config.id}`}
            >
              Learn more &rarr;
            </button>
          )}

          <div className="tooltip__arrow" />
        </div>
      )}
    </TooltipContext.Provider>
  );
}

/**
 * Props for Tooltip component
 */
export interface TooltipProps {
  /** The element to attach the tooltip to */
  children: ReactElement;
  /** Tooltip content */
  content: string;
  /** Preferred position */
  position?: TooltipPosition;
  /** Delay before showing (ms) */
  delay?: number;
  /** Optional help topic ID */
  helpTopicId?: string;
  /** Whether tooltip is disabled */
  disabled?: boolean;
}

/**
 * Tooltip wrapper component.
 *
 * Wraps a single element and shows a tooltip on hover.
 *
 * @example
 * ```tsx
 * <Tooltip content="Click to save" helpTopicId="saving-work">
 *   <button>Save</button>
 * </Tooltip>
 * ```
 */
export function Tooltip({
  children,
  content,
  position = 'top',
  delay,
  helpTopicId,
  disabled = false,
}: TooltipProps): ReactElement {
  const { showTooltip, hideTooltip } = useTooltip();
  const tooltipId = useId();
  const elementRef = useRef<HTMLElement | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (disabled || !elementRef.current) return;

    showTooltip(
      {
        id: tooltipId,
        content,
        position,
        delay,
        helpTopicId,
      },
      elementRef.current
    );
  }, [showTooltip, tooltipId, content, position, delay, helpTopicId, disabled]);

  const handleMouseLeave = useCallback(() => {
    hideTooltip(tooltipId);
  }, [hideTooltip, tooltipId]);

  const handleFocus = useCallback(() => {
    if (disabled || !elementRef.current) return;

    showTooltip(
      {
        id: tooltipId,
        content,
        position,
        delay: 0, // Show immediately on focus
        helpTopicId,
      },
      elementRef.current
    );
  }, [showTooltip, tooltipId, content, position, helpTopicId, disabled]);

  const handleBlur = useCallback(() => {
    hideTooltip(tooltipId);
  }, [hideTooltip, tooltipId]);

  // Clone child with added event handlers and ref
  const child = children;

  return (
    <span
      ref={(el) => {
        elementRef.current = el;
      }}
      className="tooltip-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      aria-describedby={disabled ? undefined : tooltipId}
    >
      {child}
    </span>
  );
}

export default TooltipProvider;
