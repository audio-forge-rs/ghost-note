/**
 * TutorialDialog Component
 *
 * Main tutorial component that orchestrates the onboarding experience.
 * Combines overlay, step display, and progress indicator into a cohesive flow.
 *
 * @module components/Tutorial/TutorialDialog
 */

import { useEffect, useCallback, type ReactElement } from 'react';
import {
  useTutorialStore,
  selectCurrentStep,
  selectCurrentStepIndex,
  selectIsFirstStep,
  selectIsLastStep,
  TUTORIAL_STEPS,
} from '@/stores/useTutorialStore';
import { useAnnouncer } from '@/hooks';
import { TutorialOverlay } from './TutorialOverlay';
import { TutorialStep } from './TutorialStep';
import { TutorialProgress } from './TutorialProgress';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[TutorialDialog] ${message}`, ...args);
  }
};

/**
 * Props for TutorialDialog
 */
export interface TutorialDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when the dialog should be closed */
  onClose: () => void;
  /** Optional callback when tutorial is completed */
  onComplete?: () => void;
  /** Optional callback to navigate to a specific view */
  onNavigate?: (view: string) => void;
  /** Test ID for testing */
  testId?: string;
}

/**
 * TutorialDialog is the main orchestrating component for the onboarding tutorial.
 *
 * Features:
 * - Coordinates overlay, step content, and progress indicator
 * - Manages focus and keyboard navigation
 * - Integrates with tutorial store for state management
 * - Announces step changes to screen readers
 * - Optionally navigates to target views for each step
 * - Prevents body scroll when active
 *
 * @example
 * ```tsx
 * const [showTutorial, setShowTutorial] = useState(false);
 *
 * <TutorialDialog
 *   isOpen={showTutorial}
 *   onClose={() => setShowTutorial(false)}
 *   onComplete={handleTutorialComplete}
 *   onNavigate={handleNavigateToView}
 * />
 * ```
 */
export function TutorialDialog({
  isOpen,
  onClose,
  onComplete,
  onNavigate,
  testId = 'tutorial-dialog',
}: TutorialDialogProps): ReactElement | null {
  const { announce } = useAnnouncer();

  // Tutorial store state
  const currentStep = useTutorialStore(selectCurrentStep);
  const currentStepIndex = useTutorialStore(selectCurrentStepIndex);
  const isFirst = useTutorialStore(selectIsFirstStep);
  const isLast = useTutorialStore(selectIsLastStep);
  const visitedSteps = useTutorialStore((state) => state.visitedSteps);

  // Tutorial store actions
  const nextStep = useTutorialStore((state) => state.nextStep);
  const prevStep = useTutorialStore((state) => state.prevStep);
  const skipTutorial = useTutorialStore((state) => state.skipTutorial);
  const completeTutorial = useTutorialStore((state) => state.completeTutorial);
  const goToStep = useTutorialStore((state) => state.goToStep);

  log('Rendering tutorial dialog:', {
    isOpen,
    currentStepIndex,
    currentStep: currentStep?.id,
  });

  // Prevent body scroll when tutorial is active
  useEffect(() => {
    if (isOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      log('Prevented body scroll');

      return () => {
        document.body.style.overflow = previousOverflow;
        log('Restored body scroll');
      };
    }
  }, [isOpen]);

  // Announce step changes to screen readers
  useEffect(() => {
    if (isOpen && currentStep) {
      const message = `Step ${currentStepIndex + 1} of ${TUTORIAL_STEPS.length}: ${currentStep.title}`;
      announce(message, { priority: 'polite' });
      log('Announced step change:', message);
    }
  }, [isOpen, currentStep, currentStepIndex, announce]);

  // Navigate to target view when step changes
  useEffect(() => {
    if (isOpen && currentStep?.targetView && onNavigate) {
      log('Navigating to target view:', currentStep.targetView);
      onNavigate(currentStep.targetView);
    }
  }, [isOpen, currentStep, onNavigate]);

  // Handle next step
  const handleNext = useCallback(() => {
    log('Next step requested');
    nextStep();
  }, [nextStep]);

  // Handle previous step
  const handlePrev = useCallback(() => {
    log('Previous step requested');
    prevStep();
  }, [prevStep]);

  // Handle skip/close
  const handleSkip = useCallback(() => {
    log('Skip/close requested');
    skipTutorial();
    onClose();
    announce('Tutorial skipped', { priority: 'polite' });
  }, [skipTutorial, onClose, announce]);

  // Handle complete
  const handleComplete = useCallback(() => {
    log('Tutorial completed');
    completeTutorial();
    onClose();
    onComplete?.();
    announce('Tutorial completed! You are ready to create your song.', { priority: 'assertive' });
  }, [completeTutorial, onClose, onComplete, announce]);

  // Handle step click from progress indicator
  const handleStepClick = useCallback(
    (index: number) => {
      log('Step clicked:', index);
      goToStep(index);
    },
    [goToStep]
  );

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  const isCentered = currentStep?.isOverlayStep || !currentStep?.highlightSelector;

  return (
    <div
      className="tutorial-dialog"
      data-testid={testId}
      role="dialog"
      aria-modal="true"
      aria-label="Interactive tutorial"
    >
      {/* Dimmed overlay with spotlight */}
      <TutorialOverlay
        isVisible={isOpen}
        highlightSelector={currentStep?.highlightSelector}
        isCentered={isCentered}
        onOverlayClick={handleSkip}
        testId={`${testId}-overlay`}
      />

      {/* Step content */}
      <TutorialStep
        step={currentStep}
        stepNumber={currentStepIndex + 1}
        totalSteps={TUTORIAL_STEPS.length}
        isFirst={isFirst}
        isLast={isLast}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={handleSkip}
        onComplete={handleComplete}
        testId={`${testId}-step`}
      />

      {/* Progress indicator (shown at bottom for centered steps) */}
      {isCentered && (
        <div className="tutorial-dialog__progress" data-testid={`${testId}-progress`}>
          <TutorialProgress
            steps={TUTORIAL_STEPS}
            currentStepIndex={currentStepIndex}
            visitedSteps={visitedSteps}
            style="dots"
            allowNavigation={true}
            onStepClick={handleStepClick}
            size="medium"
            testId={`${testId}-progress-dots`}
          />
        </div>
      )}

      <style>{`
        .tutorial-dialog {
          position: fixed;
          inset: 0;
          z-index: 89;
          pointer-events: none;
        }

        .tutorial-dialog > * {
          pointer-events: auto;
        }

        .tutorial-dialog__progress {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 101;
          background-color: var(--color-surface, white);
          padding: 0.75rem 1.25rem;
          border-radius: 9999px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          animation: tutorial-progress-appear 0.3s ease-out 0.2s both;
        }

        @keyframes tutorial-progress-appear {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        /* Dark mode */
        .dark .tutorial-dialog__progress {
          background-color: var(--color-surface-dark, #1f2937);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .tutorial-dialog__progress {
            animation: none;
          }
        }

        /* Mobile responsive */
        @media (max-width: 480px) {
          .tutorial-dialog__progress {
            bottom: 1rem;
            padding: 0.5rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}

export default TutorialDialog;
