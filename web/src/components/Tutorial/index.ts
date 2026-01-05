/**
 * Tutorial Components
 *
 * Interactive onboarding tutorial for Ghost Note application.
 * Provides step-by-step guidance through the main features.
 *
 * @module components/Tutorial
 */

// Main dialog component
export { TutorialDialog } from './TutorialDialog';
export type { TutorialDialogProps } from './TutorialDialog';

// Overlay component for highlighting elements
export { TutorialOverlay } from './TutorialOverlay';
export type { TutorialOverlayProps, HighlightRect } from './TutorialOverlay';

// Step content component
export { TutorialStep } from './TutorialStep';
export type { TutorialStepProps } from './TutorialStep';

// Progress indicator component
export { TutorialProgress } from './TutorialProgress';
export type { TutorialProgressProps, ProgressStyle } from './TutorialProgress';
