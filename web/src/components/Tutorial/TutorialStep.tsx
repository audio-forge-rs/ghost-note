/**
 * TutorialStep Component
 *
 * Displays the current tutorial step with title, description, and navigation.
 * Positioned relative to the highlighted element or centered for overlay steps.
 *
 * @module components/Tutorial/TutorialStep
 */

import { useEffect, useState, useCallback, useRef, type ReactElement } from 'react';
import type { TutorialStep as TutorialStepType } from '@/stores/useTutorialStore';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[TutorialStep] ${message}`, ...args);
  }
};

/**
 * Props for TutorialStep
 */
export interface TutorialStepProps {
  /** The step configuration */
  step: TutorialStepType;
  /** Current step number (1-indexed for display) */
  stepNumber: number;
  /** Total number of steps */
  totalSteps: number;
  /** Whether this is the first step */
  isFirst: boolean;
  /** Whether this is the last step */
  isLast: boolean;
  /** Callback to go to next step */
  onNext: () => void;
  /** Callback to go to previous step */
  onPrev: () => void;
  /** Callback to skip/close the tutorial */
  onSkip: () => void;
  /** Callback to complete the tutorial */
  onComplete: () => void;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Calculate tooltip position based on highlight element and preferred position
 */
function calculatePosition(
  selector: string | undefined,
  preferredPosition: string,
  tooltipWidth: number,
  tooltipHeight: number
): { top: number; left: number; position: string } {
  // Default to center if no selector
  if (!selector) {
    return {
      top: window.innerHeight / 2,
      left: window.innerWidth / 2,
      position: 'center',
    };
  }

  const element = document.querySelector(selector);
  if (!element) {
    log('Element not found, centering tooltip');
    return {
      top: window.innerHeight / 2,
      left: window.innerWidth / 2,
      position: 'center',
    };
  }

  const rect = element.getBoundingClientRect();
  const padding = 16;
  const arrowSize = 12;

  let top = 0;
  let left = 0;
  let finalPosition = preferredPosition;

  // Calculate position based on preference
  switch (preferredPosition) {
    case 'top':
      top = rect.top - tooltipHeight - arrowSize - padding;
      left = rect.left + rect.width / 2;
      // Check if it fits above
      if (top < padding) {
        finalPosition = 'bottom';
        top = rect.bottom + arrowSize + padding;
      }
      break;

    case 'bottom':
      top = rect.bottom + arrowSize + padding;
      left = rect.left + rect.width / 2;
      // Check if it fits below
      if (top + tooltipHeight > window.innerHeight - padding) {
        finalPosition = 'top';
        top = rect.top - tooltipHeight - arrowSize - padding;
      }
      break;

    case 'left':
      top = rect.top + rect.height / 2;
      left = rect.left - tooltipWidth - arrowSize - padding;
      // Check if it fits on left
      if (left < padding) {
        finalPosition = 'right';
        left = rect.right + arrowSize + padding;
      }
      break;

    case 'right':
      top = rect.top + rect.height / 2;
      left = rect.right + arrowSize + padding;
      // Check if it fits on right
      if (left + tooltipWidth > window.innerWidth - padding) {
        finalPosition = 'left';
        left = rect.left - tooltipWidth - arrowSize - padding;
      }
      break;

    default:
      top = window.innerHeight / 2;
      left = window.innerWidth / 2;
      finalPosition = 'center';
  }

  // Ensure tooltip stays within viewport bounds
  if (finalPosition !== 'center') {
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
  }

  log('Calculated position:', { top, left, finalPosition });
  return { top, left, position: finalPosition };
}

/**
 * TutorialStep displays step content with navigation controls.
 *
 * Features:
 * - Automatic positioning relative to highlighted element
 * - Keyboard navigation (arrows, Enter, Escape)
 * - Skip and complete actions
 * - Responsive design
 * - Focus management
 *
 * @example
 * ```tsx
 * <TutorialStep
 *   step={currentStep}
 *   stepNumber={2}
 *   totalSteps={6}
 *   isFirst={false}
 *   isLast={false}
 *   onNext={handleNext}
 *   onPrev={handlePrev}
 *   onSkip={handleSkip}
 *   onComplete={handleComplete}
 * />
 * ```
 */
export function TutorialStep({
  step,
  stepNumber,
  totalSteps,
  isFirst,
  isLast,
  onNext,
  onPrev,
  onSkip,
  onComplete,
  testId = 'tutorial-step',
}: TutorialStepProps): ReactElement {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, position: 'center' });
  const [dimensions, setDimensions] = useState({ width: 320, height: 200 });

  // Update position when step changes or window resizes
  const updatePosition = useCallback(() => {
    const tooltipWidth = tooltipRef.current?.offsetWidth || dimensions.width;
    const tooltipHeight = tooltipRef.current?.offsetHeight || dimensions.height;

    setDimensions({ width: tooltipWidth, height: tooltipHeight });

    const newPosition = calculatePosition(
      step.highlightSelector,
      step.tooltipPosition || 'center',
      tooltipWidth,
      tooltipHeight
    );
    setPosition(newPosition);
  }, [step.highlightSelector, step.tooltipPosition, dimensions.width, dimensions.height]);

  // Initial position and resize handling
  useEffect(() => {
    // Use requestAnimationFrame to avoid synchronous setState in effect
    const rafId = requestAnimationFrame(() => {
      updatePosition();
    });

    // Small delay to account for render
    const timeoutId = setTimeout(updatePosition, 100);

    const handleResize = (): void => {
      updatePosition();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [updatePosition]);

  // Focus management - focus the next/complete button when step changes
  useEffect(() => {
    nextButtonRef.current?.focus();
  }, [step.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      switch (event.key) {
        case 'ArrowRight':
        case 'Enter':
          if (!isLast) {
            event.preventDefault();
            log('Next step via keyboard');
            onNext();
          } else if (isLast) {
            event.preventDefault();
            log('Complete via keyboard');
            onComplete();
          }
          break;

        case 'ArrowLeft':
          if (!isFirst) {
            event.preventDefault();
            log('Previous step via keyboard');
            onPrev();
          }
          break;

        case 'Escape':
          event.preventDefault();
          log('Skip via keyboard');
          onSkip();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFirst, isLast, onNext, onPrev, onSkip, onComplete]);

  const isCentered = step.isOverlayStep || position.position === 'center';

  return (
    <div
      ref={tooltipRef}
      className={`tutorial-step tutorial-step--${position.position}`}
      data-testid={testId}
      data-position={position.position}
      style={
        isCentered
          ? {
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }
          : {
              top: `${position.top}px`,
              left: `${position.left}px`,
              transform:
                position.position === 'left' || position.position === 'right'
                  ? 'translateY(-50%)'
                  : position.position === 'top' || position.position === 'bottom'
                    ? 'translateX(-50%)'
                    : 'none',
            }
      }
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${testId}-title`}
      aria-describedby={`${testId}-description`}
    >
      {/* Step indicator */}
      <div className="tutorial-step__header">
        <span
          className="tutorial-step__counter"
          aria-label={`Step ${stepNumber} of ${totalSteps}`}
        >
          {stepNumber} / {totalSteps}
        </span>
        <button
          type="button"
          className="tutorial-step__skip-button"
          onClick={onSkip}
          aria-label="Skip tutorial"
          data-testid={`${testId}-skip`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="tutorial-step__content">
        <h3
          id={`${testId}-title`}
          className="tutorial-step__title"
          data-testid={`${testId}-title`}
        >
          {step.title}
        </h3>
        <p
          id={`${testId}-description`}
          className="tutorial-step__description"
          data-testid={`${testId}-description`}
        >
          {step.description}
        </p>
        {step.tip && (
          <p className="tutorial-step__tip" data-testid={`${testId}-tip`}>
            <span className="tutorial-step__tip-icon" aria-hidden="true">
              💡
            </span>
            {step.tip}
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="tutorial-step__navigation">
        {!isFirst && (
          <button
            type="button"
            className="tutorial-step__button tutorial-step__button--prev"
            onClick={onPrev}
            aria-label="Previous step"
            data-testid={`${testId}-prev`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
        )}

        <div className="tutorial-step__button-spacer" />

        {isLast ? (
          <button
            ref={nextButtonRef}
            type="button"
            className="tutorial-step__button tutorial-step__button--complete"
            onClick={onComplete}
            data-testid={`${testId}-complete`}
          >
            Get Started
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        ) : (
          <button
            ref={nextButtonRef}
            type="button"
            className="tutorial-step__button tutorial-step__button--next"
            onClick={onNext}
            data-testid={`${testId}-next`}
          >
            {isFirst ? 'Start Tour' : 'Next'}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>

      {/* Arrow pointing to highlighted element */}
      {!isCentered && (
        <div
          className={`tutorial-step__arrow tutorial-step__arrow--${position.position}`}
          aria-hidden="true"
        />
      )}

      <style>{`
        .tutorial-step {
          position: fixed;
          z-index: 100;
          width: 100%;
          max-width: 360px;
          background-color: var(--color-surface, white);
          border-radius: 12px;
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.2),
            0 0 0 1px rgba(0, 0, 0, 0.05);
          padding: 1rem;
          animation: tutorial-step-appear 0.3s ease-out;
        }

        @keyframes tutorial-step-appear {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        .tutorial-step--left,
        .tutorial-step--right {
          animation: tutorial-step-appear-side 0.3s ease-out;
        }

        @keyframes tutorial-step-appear-side {
          from {
            opacity: 0;
            transform: translateY(-50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(-50%) scale(1);
          }
        }

        .tutorial-step--top,
        .tutorial-step--bottom {
          animation: tutorial-step-appear-vert 0.3s ease-out;
        }

        @keyframes tutorial-step-appear-vert {
          from {
            opacity: 0;
            transform: translateX(-50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
        }

        .tutorial-step__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .tutorial-step__counter {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--color-text-secondary, #6b7280);
          background-color: var(--color-bg-secondary, #f3f4f6);
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
        }

        .tutorial-step__skip-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          color: var(--color-text-secondary, #6b7280);
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.15s ease;
        }

        .tutorial-step__skip-button:hover {
          background-color: var(--color-bg-secondary, #f3f4f6);
          color: var(--color-text-primary, #111827);
        }

        .tutorial-step__skip-button:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px var(--color-primary, #3b82f6);
        }

        .tutorial-step__content {
          margin-bottom: 1rem;
        }

        .tutorial-step__title {
          margin: 0 0 0.5rem;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--color-text-primary, #111827);
          line-height: 1.3;
        }

        .tutorial-step__description {
          margin: 0;
          font-size: 0.875rem;
          color: var(--color-text-secondary, #4b5563);
          line-height: 1.5;
        }

        .tutorial-step__tip {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin: 0.75rem 0 0;
          padding: 0.625rem;
          font-size: 0.8125rem;
          color: var(--color-text-secondary, #6b7280);
          background-color: var(--color-bg-secondary, #f9fafb);
          border-radius: 6px;
          line-height: 1.4;
        }

        .tutorial-step__tip-icon {
          flex-shrink: 0;
          font-size: 1rem;
        }

        .tutorial-step__navigation {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .tutorial-step__button-spacer {
          flex: 1;
        }

        .tutorial-step__button {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 0.875rem;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .tutorial-step__button:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px var(--color-primary, #3b82f6);
        }

        .tutorial-step__button--prev {
          background-color: transparent;
          color: var(--color-text-secondary, #6b7280);
        }

        .tutorial-step__button--prev:hover {
          background-color: var(--color-bg-secondary, #f3f4f6);
          color: var(--color-text-primary, #111827);
        }

        .tutorial-step__button--next,
        .tutorial-step__button--complete {
          background-color: var(--color-primary, #3b82f6);
          color: white;
        }

        .tutorial-step__button--next:hover,
        .tutorial-step__button--complete:hover {
          background-color: var(--color-primary-hover, #2563eb);
        }

        .tutorial-step__button--complete {
          background-color: var(--color-success, #10b981);
        }

        .tutorial-step__button--complete:hover {
          background-color: var(--color-success-hover, #059669);
        }

        /* Arrow styles */
        .tutorial-step__arrow {
          position: absolute;
          width: 12px;
          height: 12px;
          background-color: var(--color-surface, white);
          transform: rotate(45deg);
          box-shadow: -2px -2px 4px rgba(0, 0, 0, 0.05);
        }

        .tutorial-step__arrow--left {
          right: -6px;
          top: 50%;
          margin-top: -6px;
          box-shadow: 2px -2px 4px rgba(0, 0, 0, 0.05);
        }

        .tutorial-step__arrow--right {
          left: -6px;
          top: 50%;
          margin-top: -6px;
          box-shadow: -2px 2px 4px rgba(0, 0, 0, 0.05);
        }

        .tutorial-step__arrow--top {
          bottom: -6px;
          left: 50%;
          margin-left: -6px;
          box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.05);
        }

        .tutorial-step__arrow--bottom {
          top: -6px;
          left: 50%;
          margin-left: -6px;
          box-shadow: -2px -2px 4px rgba(0, 0, 0, 0.05);
        }

        /* Dark mode */
        .dark .tutorial-step {
          background-color: var(--color-surface-dark, #1f2937);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        .dark .tutorial-step__title {
          color: var(--color-text-primary-dark, #f9fafb);
        }

        .dark .tutorial-step__description {
          color: var(--color-text-secondary-dark, #9ca3af);
        }

        .dark .tutorial-step__counter {
          color: var(--color-text-secondary-dark, #9ca3af);
          background-color: var(--color-bg-secondary-dark, #374151);
        }

        .dark .tutorial-step__skip-button:hover {
          background-color: var(--color-bg-secondary-dark, #374151);
          color: var(--color-text-primary-dark, #f9fafb);
        }

        .dark .tutorial-step__tip {
          background-color: var(--color-bg-secondary-dark, #374151);
          color: var(--color-text-secondary-dark, #9ca3af);
        }

        .dark .tutorial-step__button--prev:hover {
          background-color: var(--color-bg-secondary-dark, #374151);
          color: var(--color-text-primary-dark, #f9fafb);
        }

        .dark .tutorial-step__arrow {
          background-color: var(--color-surface-dark, #1f2937);
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .tutorial-step,
          .tutorial-step--left,
          .tutorial-step--right,
          .tutorial-step--top,
          .tutorial-step--bottom {
            animation: none;
          }
        }

        /* Mobile responsive */
        @media (max-width: 480px) {
          .tutorial-step {
            max-width: calc(100vw - 2rem);
            margin: 0 1rem;
          }

          .tutorial-step__navigation {
            flex-wrap: wrap;
          }

          .tutorial-step__button-spacer {
            display: none;
          }

          .tutorial-step__button--prev {
            order: 2;
            flex: 1;
          }

          .tutorial-step__button--next,
          .tutorial-step__button--complete {
            order: 1;
            flex: 2;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

export default TutorialStep;
