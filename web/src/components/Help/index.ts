/**
 * Help Components
 *
 * Components for the in-app help and documentation system.
 *
 * @module components/Help
 */

// Main help panel
export { HelpPanel } from './HelpPanel';
export type { HelpPanelProps } from './HelpPanel';

// Topic-specific help section
export { HelpSection } from './HelpSection';
export type { HelpSectionProps } from './HelpSection';

// FAQ component
export { FAQ } from './FAQ';
export type { FAQProps } from './FAQ';

// Tooltip system
export { TooltipProvider, Tooltip } from './TooltipProvider';
export type { TooltipProviderProps, TooltipProps } from './TooltipProvider';
export { useTooltip } from './tooltipUtils';
export type { TooltipPosition, TooltipConfig } from './tooltipUtils';

// Help content data
export {
  HELP_CATEGORIES,
  HELP_TOPICS,
  FAQ_ITEMS,
  getTopicsByCategory,
  getTopicById,
  getRelatedTopics,
  searchTopics,
  getFAQByCategory,
  searchFAQs,
  getCategoryById,
} from './helpContent';

export type {
  HelpTopic,
  HelpCategory,
  CategoryInfo,
  FAQItem,
} from './helpContent';
