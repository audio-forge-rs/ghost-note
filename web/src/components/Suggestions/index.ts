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
export { MeaningPreservationBadge } from './MeaningPreservationBadge';
export type { MeaningPreservationBadgeProps } from './MeaningPreservationBadge';
export { getPreservationConfig, getPreservationLevels } from './meaningPreservationUtils';

// Batch operation button
export { ApplyAllButton } from './ApplyAllButton';
export type { ApplyAllButtonProps } from './ApplyAllButton';
export { getOperationConfig, type BatchOperationType } from './applyAllUtils';
