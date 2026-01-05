/**
 * TutorialProgress Component
 *
 * Displays step indicators showing progress through the tutorial.
 * Supports both dot and bar styles with visited state tracking.
 *
 * @module components/Tutorial/TutorialProgress
 */

import { useCallback, type ReactElement } from 'react';
import type { TutorialStep, TutorialStepId } from '@/stores/useTutorialStore';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[TutorialProgress] ${message}`, ...args);
  }
};

/**
 * Progress display style
 */
export type ProgressStyle = 'dots' | 'bar' | 'numbered';

/**
 * Props for TutorialProgress
 */
export interface TutorialProgressProps {
  /** All tutorial steps */
  steps: TutorialStep[];
  /** Current step index (0-based) */
  currentStepIndex: number;
  /** Steps that have been visited */
  visitedSteps: TutorialStepId[];
  /** Style of progress indicator */
  style?: ProgressStyle;
  /** Whether clicking on steps is allowed */
  allowNavigation?: boolean;
  /** Callback when a step is clicked (if navigation allowed) */
  onStepClick?: (index: number) => void;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Test ID for testing */
  testId?: string;
}

/**
 * TutorialProgress displays visual progress through the tutorial.
 *
 * Features:
 * - Multiple display styles (dots, bar, numbered)
 * - Visual indication of current, visited, and unvisited steps
 * - Optional click navigation to specific steps
 * - Accessible with ARIA attributes
 * - Keyboard navigable when interactive
 *
 * @example
 * ```tsx
 * <TutorialProgress
 *   steps={TUTORIAL_STEPS}
 *   currentStepIndex={2}
 *   visitedSteps={['welcome', 'enter-poem', 'understand-analysis']}
 *   style="dots"
 * />
 * ```
 */
export function TutorialProgress({
  steps,
  currentStepIndex,
  visitedSteps,
  style = 'dots',
  allowNavigation = false,
  onStepClick,
  size = 'medium',
  testId = 'tutorial-progress',
}: TutorialProgressProps): ReactElement {
  log('Rendering progress:', { currentStepIndex, visitedCount: visitedSteps.length, style });

  const handleStepClick = useCallback(
    (index: number) => {
      if (!allowNavigation || !onStepClick) return;
      log('Step clicked:', index);
      onStepClick(index);
    },
    [allowNavigation, onStepClick]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      if (!allowNavigation || !onStepClick) return;

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        log('Step activated via keyboard:', index);
        onStepClick(index);
      }
    },
    [allowNavigation, onStepClick]
  );

  const isStepVisited = (stepId: TutorialStepId): boolean => {
    return visitedSteps.includes(stepId);
  };

  const progressPercent = ((currentStepIndex + 1) / steps.length) * 100;

  // Render bar style
  if (style === 'bar') {
    return (
      <div
        className={`tutorial-progress tutorial-progress--bar tutorial-progress--${size}`}
        data-testid={testId}
        role="progressbar"
        aria-valuenow={currentStepIndex + 1}
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-label={`Tutorial progress: step ${currentStepIndex + 1} of ${steps.length}`}
      >
        <div className="tutorial-progress__bar-container">
          <div
            className="tutorial-progress__bar-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="tutorial-progress__label">
          {currentStepIndex + 1} / {steps.length}
        </span>

        <style>{`
          .tutorial-progress--bar {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .tutorial-progress__bar-container {
            flex: 1;
            height: 6px;
            background-color: var(--color-bg-tertiary, #e5e7eb);
            border-radius: 3px;
            overflow: hidden;
          }

          .tutorial-progress--bar.tutorial-progress--small .tutorial-progress__bar-container {
            height: 4px;
          }

          .tutorial-progress--bar.tutorial-progress--large .tutorial-progress__bar-container {
            height: 8px;
          }

          .tutorial-progress__bar-fill {
            height: 100%;
            background-color: var(--color-primary, #3b82f6);
            border-radius: 3px;
            transition: width 0.3s ease-out;
          }

          .tutorial-progress__label {
            font-size: 0.75rem;
            font-weight: 500;
            color: var(--color-text-secondary, #6b7280);
            white-space: nowrap;
          }

          .dark .tutorial-progress__bar-container {
            background-color: var(--color-bg-tertiary-dark, #374151);
          }

          .dark .tutorial-progress__label {
            color: var(--color-text-secondary-dark, #9ca3af);
          }

          @media (prefers-reduced-motion: reduce) {
            .tutorial-progress__bar-fill {
              transition: none;
            }
          }
        `}</style>
      </div>
    );
  }

  // Render numbered style
  if (style === 'numbered') {
    return (
      <div
        className={`tutorial-progress tutorial-progress--numbered tutorial-progress--${size}`}
        data-testid={testId}
        role="list"
        aria-label="Tutorial steps"
      >
        {steps.map((step, index) => {
          const isCurrent = index === currentStepIndex;
          const isVisited = isStepVisited(step.id);
          const isClickable = allowNavigation && (isVisited || index <= currentStepIndex);

          return (
            <div
              key={step.id}
              className={`tutorial-progress__numbered-item ${
                isCurrent ? 'tutorial-progress__numbered-item--current' : ''
              } ${isVisited && !isCurrent ? 'tutorial-progress__numbered-item--visited' : ''}`}
              role="listitem"
              aria-current={isCurrent ? 'step' : undefined}
            >
              {isClickable ? (
                <button
                  type="button"
                  className="tutorial-progress__numbered-button"
                  onClick={() => handleStepClick(index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  aria-label={`Go to step ${index + 1}: ${step.title}`}
                  data-testid={`${testId}-step-${index}`}
                >
                  {index + 1}
                </button>
              ) : (
                <span
                  className="tutorial-progress__numbered-number"
                  aria-label={`Step ${index + 1}: ${step.title}`}
                  data-testid={`${testId}-step-${index}`}
                >
                  {index + 1}
                </span>
              )}

              {index < steps.length - 1 && (
                <div
                  className={`tutorial-progress__numbered-connector ${
                    isVisited ? 'tutorial-progress__numbered-connector--visited' : ''
                  }`}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}

        <style>{`
          .tutorial-progress--numbered {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .tutorial-progress__numbered-item {
            display: flex;
            align-items: center;
          }

          .tutorial-progress__numbered-number,
          .tutorial-progress__numbered-button {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            font-size: 0.75rem;
            font-weight: 600;
            border-radius: 50%;
            background-color: var(--color-bg-tertiary, #e5e7eb);
            color: var(--color-text-secondary, #6b7280);
            border: 2px solid transparent;
            transition: all 0.2s ease;
          }

          .tutorial-progress--numbered.tutorial-progress--small .tutorial-progress__numbered-number,
          .tutorial-progress--numbered.tutorial-progress--small .tutorial-progress__numbered-button {
            width: 24px;
            height: 24px;
            font-size: 0.6875rem;
          }

          .tutorial-progress--numbered.tutorial-progress--large .tutorial-progress__numbered-number,
          .tutorial-progress--numbered.tutorial-progress--large .tutorial-progress__numbered-button {
            width: 32px;
            height: 32px;
            font-size: 0.875rem;
          }

          .tutorial-progress__numbered-button {
            cursor: pointer;
          }

          .tutorial-progress__numbered-button:hover {
            background-color: var(--color-bg-secondary, #d1d5db);
          }

          .tutorial-progress__numbered-button:focus-visible {
            outline: none;
            box-shadow: 0 0 0 2px var(--color-primary, #3b82f6);
          }

          .tutorial-progress__numbered-item--current .tutorial-progress__numbered-number,
          .tutorial-progress__numbered-item--current .tutorial-progress__numbered-button {
            background-color: var(--color-primary, #3b82f6);
            color: white;
            border-color: var(--color-primary, #3b82f6);
          }

          .tutorial-progress__numbered-item--visited .tutorial-progress__numbered-number,
          .tutorial-progress__numbered-item--visited .tutorial-progress__numbered-button {
            background-color: var(--color-success-light, #d1fae5);
            color: var(--color-success, #10b981);
            border-color: var(--color-success, #10b981);
          }

          .tutorial-progress__numbered-connector {
            width: 24px;
            height: 2px;
            background-color: var(--color-bg-tertiary, #e5e7eb);
            margin: 0 0.25rem;
            transition: background-color 0.2s ease;
          }

          .tutorial-progress__numbered-connector--visited {
            background-color: var(--color-success, #10b981);
          }

          .dark .tutorial-progress__numbered-number,
          .dark .tutorial-progress__numbered-button {
            background-color: var(--color-bg-tertiary-dark, #374151);
            color: var(--color-text-secondary-dark, #9ca3af);
          }

          .dark .tutorial-progress__numbered-button:hover {
            background-color: var(--color-bg-secondary-dark, #4b5563);
          }

          .dark .tutorial-progress__numbered-connector {
            background-color: var(--color-bg-tertiary-dark, #374151);
          }

          .dark .tutorial-progress__numbered-item--visited .tutorial-progress__numbered-number,
          .dark .tutorial-progress__numbered-item--visited .tutorial-progress__numbered-button {
            background-color: rgba(16, 185, 129, 0.2);
          }

          @media (prefers-reduced-motion: reduce) {
            .tutorial-progress__numbered-number,
            .tutorial-progress__numbered-button,
            .tutorial-progress__numbered-connector {
              transition: none;
            }
          }
        `}</style>
      </div>
    );
  }

  // Default: dots style
  return (
    <div
      className={`tutorial-progress tutorial-progress--dots tutorial-progress--${size}`}
      data-testid={testId}
      role="list"
      aria-label="Tutorial progress"
    >
      {steps.map((step, index) => {
        const isCurrent = index === currentStepIndex;
        const isVisited = isStepVisited(step.id);
        const isClickable = allowNavigation && (isVisited || index <= currentStepIndex);

        return isClickable ? (
          <button
            key={step.id}
            type="button"
            className={`tutorial-progress__dot ${
              isCurrent ? 'tutorial-progress__dot--current' : ''
            } ${isVisited && !isCurrent ? 'tutorial-progress__dot--visited' : ''}`}
            onClick={() => handleStepClick(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            role="listitem"
            aria-current={isCurrent ? 'step' : undefined}
            aria-label={`Step ${index + 1}: ${step.title}${isCurrent ? ' (current)' : ''}${isVisited ? ' (completed)' : ''}`}
            data-testid={`${testId}-dot-${index}`}
          />
        ) : (
          <span
            key={step.id}
            className={`tutorial-progress__dot ${
              isCurrent ? 'tutorial-progress__dot--current' : ''
            } ${isVisited && !isCurrent ? 'tutorial-progress__dot--visited' : ''}`}
            role="listitem"
            aria-current={isCurrent ? 'step' : undefined}
            aria-label={`Step ${index + 1}: ${step.title}${isCurrent ? ' (current)' : ''}`}
            data-testid={`${testId}-dot-${index}`}
          />
        );
      })}

      <style>{`
        .tutorial-progress--dots {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .tutorial-progress__dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--color-bg-tertiary, #d1d5db);
          border: none;
          padding: 0;
          transition: all 0.2s ease;
        }

        .tutorial-progress--dots.tutorial-progress--small .tutorial-progress__dot {
          width: 6px;
          height: 6px;
        }

        .tutorial-progress--dots.tutorial-progress--large .tutorial-progress__dot {
          width: 10px;
          height: 10px;
        }

        button.tutorial-progress__dot {
          cursor: pointer;
        }

        button.tutorial-progress__dot:hover {
          transform: scale(1.3);
        }

        button.tutorial-progress__dot:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px var(--color-primary, #3b82f6);
        }

        .tutorial-progress__dot--current {
          background-color: var(--color-primary, #3b82f6);
          transform: scale(1.25);
        }

        .tutorial-progress__dot--visited {
          background-color: var(--color-success, #10b981);
        }

        /* Dark mode */
        .dark .tutorial-progress__dot {
          background-color: var(--color-bg-tertiary-dark, #4b5563);
        }

        .dark .tutorial-progress__dot--current {
          background-color: var(--color-primary-dark, #60a5fa);
        }

        .dark .tutorial-progress__dot--visited {
          background-color: var(--color-success-dark, #34d399);
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .tutorial-progress__dot {
            transition: none;
          }

          button.tutorial-progress__dot:hover {
            transform: none;
          }

          .tutorial-progress__dot--current {
            transform: none;
            box-shadow: 0 0 0 2px var(--color-primary, #3b82f6);
          }
        }
      `}</style>
    </div>
  );
}

export default TutorialProgress;
