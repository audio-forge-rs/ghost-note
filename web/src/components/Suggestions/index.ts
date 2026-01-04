/**
 * Suggestion Components
 *
 * Components for displaying and interacting with Claude-powered
 * lyric suggestions.
 *
 * @module components/Suggestions
 */

// Main panel component
export { SuggestionPanel } from './SuggestionPanel';
export type { SuggestionPanelProps } from './SuggestionPanel';

// Individual suggestion card
export { SuggestionItem } from './SuggestionItem';
export type { SuggestionItemProps } from './SuggestionItem';

// Meaning preservation badge
export {
  MeaningPreservationBadge,
  getPreservationConfig,
  getPreservationLevels,
} from './MeaningPreservationBadge';
export type { MeaningPreservationBadgeProps } from './MeaningPreservationBadge';

// Batch operation button
export { ApplyAllButton, getOperationConfig } from './ApplyAllButton';
export type { ApplyAllButtonProps, BatchOperationType } from './ApplyAllButton';
