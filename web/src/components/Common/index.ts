/**
 * Common Components
 *
 * Shared components used throughout the Ghost Note application.
 *
 * @module components/Common
 */

// EmptyState components
export { EmptyState } from './EmptyState';
export type { EmptyStateProps, EmptyStateAction } from './EmptyState';

// EmptyState variants for specific views
export {
  NoPoemEmptyState,
  NoAnalysisEmptyState,
  NoMelodyEmptyState,
  NoRecordingsEmptyState,
  NoVersionsEmptyState,
  // Icons (for custom empty states)
  PoemIcon,
  AnalysisIcon,
  MelodyIcon,
  RecordingIcon,
  VersionsIcon,
} from './EmptyStateVariants';

export type {
  NoPoemEmptyStateProps,
  NoAnalysisEmptyStateProps,
  NoMelodyEmptyStateProps,
  NoRecordingsEmptyStateProps,
  NoVersionsEmptyStateProps,
} from './EmptyStateVariants';

// Loading components
export { LoadingSpinner } from './LoadingSpinner';
export type { LoadingSpinnerProps, SpinnerSize } from './LoadingSpinner';

export { LoadingOverlay } from './LoadingOverlay';
export type { LoadingOverlayProps } from './LoadingOverlay';

// Error components
export { ErrorBoundary } from './ErrorBoundary';
export type { ErrorBoundaryProps, ErrorBoundaryState } from './ErrorBoundary';

export { ErrorMessage } from './ErrorMessage';
export type { ErrorMessageProps, ErrorVariant } from './ErrorMessage';

// Progress components
export { ProgressBar } from './ProgressBar';
export type {
  ProgressBarProps,
  ProgressBarSize,
  ProgressBarVariant,
} from './ProgressBar';

// Skeleton components
export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
} from './Skeleton';
export type {
  SkeletonProps,
  SkeletonVariant,
  SkeletonAnimation,
  SkeletonTextProps,
  SkeletonAvatarProps,
  SkeletonCardProps,
} from './Skeleton';

// Toast components
export { Toast, ToastContainer } from './Toast';
export type { ToastProps, ToastContainerProps, ToastData, ToastType } from './Toast';

// Confirm Dialog
export { ConfirmDialog } from './ConfirmDialog';
export type { ConfirmDialogProps, ConfirmDialogVariant } from './ConfirmDialog';

// Accessibility components
export { SkipLinks } from './SkipLinks';
export type { SkipLinksProps, SkipLinkConfig } from './SkipLinks';
