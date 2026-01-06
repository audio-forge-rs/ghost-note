/**
 * Tooltip Context Hook
 *
 * Provides access to tooltip context for showing/hiding tooltips.
 *
 * @module components/Help/tooltipUtils
 */

import { createContext, useContext } from 'react';
import type { HelpTopic } from './helpContent';

/**
 * Tooltip position options
 */
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * Tooltip configuration
 */
export interface TooltipConfig {
  /** Unique identifier */
  id: string;
  /** Tooltip content text */
  content: string;
  /** Preferred position */
  position?: TooltipPosition;
  /** Delay before showing (ms) */
  delay?: number;
  /** Optional help topic ID to link to */
  helpTopicId?: string;
  /** Optional aria-describedby target */
  describedBy?: string;
}

/**
 * Active tooltip state
 */
export interface ActiveTooltip {
  config: TooltipConfig;
  rect: DOMRect;
  helpTopic?: HelpTopic;
}

/**
 * Tooltip context type
 */
export interface TooltipContextType {
  /** Register a tooltip with its target element */
  showTooltip: (config: TooltipConfig, element: HTMLElement) => void;
  /** Hide the currently shown tooltip */
  hideTooltip: (id: string) => void;
  /** Check if a tooltip is currently shown */
  isShown: (id: string) => boolean;
  /** Open the help panel to a specific topic */
  onOpenHelp?: (topicId: string) => void;
}

/**
 * Default context values
 */
export const TooltipContext = createContext<TooltipContextType>({
  showTooltip: () => {},
  hideTooltip: () => {},
  isShown: () => false,
  onOpenHelp: undefined,
});

/**
 * Hook to access tooltip context
 */
export function useTooltip(): TooltipContextType {
  return useContext(TooltipContext);
}
