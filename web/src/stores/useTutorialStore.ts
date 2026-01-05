/**
 * Ghost Note - Tutorial Store
 *
 * Manages tutorial state including current step, completion status,
 * and user preferences for the onboarding experience.
 *
 * @module stores/useTutorialStore
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[TutorialStore] ${message}`, ...args);
  }
};

// =============================================================================
// Types
// =============================================================================

/**
 * Tutorial step identifiers matching the user workflow
 */
export type TutorialStepId =
  | 'welcome'
  | 'enter-poem'
  | 'understand-analysis'
  | 'edit-lyrics'
  | 'generate-melody'
  | 'record-yourself'
  | 'complete';

/**
 * Individual tutorial step configuration
 */
export interface TutorialStep {
  /** Unique identifier for the step */
  id: TutorialStepId;
  /** Display title for the step */
  title: string;
  /** Detailed description/instructions */
  description: string;
  /** Optional additional content or tips */
  tip?: string;
  /** CSS selector for the element to highlight (optional) */
  highlightSelector?: string;
  /** Position of the tooltip relative to the highlight */
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Navigation view this step corresponds to (optional) */
  targetView?: string;
  /** Whether this is a welcome/completion step (no highlight needed) */
  isOverlayStep?: boolean;
}

/**
 * Tutorial state
 */
export interface TutorialState {
  /** Whether the tutorial is currently active/visible */
  isActive: boolean;
  /** Current step index (0-based) */
  currentStepIndex: number;
  /** Steps that have been visited */
  visitedSteps: TutorialStepId[];
  /** Whether the user has completed the tutorial at least once */
  hasCompletedTutorial: boolean;
  /** Whether the user has explicitly skipped the tutorial */
  hasSkippedTutorial: boolean;
  /** Whether to show tutorial on first visit */
  showOnFirstVisit: boolean;
  /** Timestamp of last tutorial completion */
  lastCompletedAt: number | null;
}

/**
 * Tutorial actions
 */
export interface TutorialActions {
  /** Start the tutorial from the beginning */
  startTutorial: () => void;
  /** Go to the next step */
  nextStep: () => void;
  /** Go to the previous step */
  prevStep: () => void;
  /** Jump to a specific step by index */
  goToStep: (index: number) => void;
  /** Skip/close the tutorial */
  skipTutorial: () => void;
  /** Complete the tutorial */
  completeTutorial: () => void;
  /** Reset tutorial state (for restarting) */
  resetTutorial: () => void;
  /** Toggle showing tutorial on first visit */
  setShowOnFirstVisit: (show: boolean) => void;
  /** Mark the current step as visited */
  markStepVisited: (stepId: TutorialStepId) => void;
}

export type TutorialStore = TutorialState & TutorialActions;

// =============================================================================
// Tutorial Steps Definition
// =============================================================================

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Ghost Note',
    description:
      'Ghost Note transforms your poems into singable songs. This tutorial will guide you through the main features of the application.',
    tip: 'You can restart this tutorial anytime from the Help menu.',
    tooltipPosition: 'center',
    isOverlayStep: true,
  },
  {
    id: 'enter-poem',
    title: 'Enter Your Poem',
    description:
      'Start by entering or pasting your poem in the text area. Ghost Note will analyze its structure, rhythm, and rhyme patterns.',
    tip: 'Try using a poem with clear meter and rhyme for best results.',
    highlightSelector: '[data-testid="poem-input-textarea"], [data-tutorial="poem-input"]',
    tooltipPosition: 'right',
    targetView: 'poem-input',
  },
  {
    id: 'understand-analysis',
    title: 'Understand the Analysis',
    description:
      'After entering your poem, Ghost Note analyzes syllable counts, stress patterns, meter, and rhyme schemes. This analysis helps identify areas that might be challenging to sing.',
    tip: 'Look for highlighted issues - these suggest where lyrics might need adjustment.',
    highlightSelector: '[data-testid="analysis-panel"], [data-tutorial="analysis"]',
    tooltipPosition: 'left',
    targetView: 'analysis',
  },
  {
    id: 'edit-lyrics',
    title: 'Edit Your Lyrics',
    description:
      'Use the lyric editor to refine your text for better singability. The editor shows suggestions for improving difficult passages and tracks your changes.',
    tip: 'Click on suggestions to see recommended alternatives for problematic lines.',
    highlightSelector: '[data-testid="lyric-editor"], [data-tutorial="lyrics-editor"]',
    tooltipPosition: 'left',
    targetView: 'lyrics-editor',
  },
  {
    id: 'generate-melody',
    title: 'Generate a Melody',
    description:
      'Once your lyrics are ready, generate a melody that fits the natural rhythm of your words. You can adjust the tempo and key to suit your preferences.',
    tip: 'Use the playback controls to listen and fine-tune your melody.',
    highlightSelector: '[data-testid="melody-playback"], [data-tutorial="melody"]',
    tooltipPosition: 'left',
    targetView: 'melody',
  },
  {
    id: 'record-yourself',
    title: 'Record Your Performance',
    description:
      'Finally, record yourself singing along with the generated melody. You can save multiple takes and compare them.',
    tip: 'Grant microphone permission when prompted to enable recording.',
    highlightSelector: '[data-testid="recording-controls"], [data-tutorial="recording"]',
    tooltipPosition: 'left',
    targetView: 'recording',
  },
  {
    id: 'complete',
    title: "You're All Set!",
    description:
      "You now know the basics of Ghost Note. Start creating your song by entering a poem, or explore the sample poems to see the app in action.",
    tip: 'Press ? anytime to see keyboard shortcuts.',
    tooltipPosition: 'center',
    isOverlayStep: true,
  },
];

// =============================================================================
// Initial State
// =============================================================================

const initialState: TutorialState = {
  isActive: false,
  currentStepIndex: 0,
  visitedSteps: [],
  hasCompletedTutorial: false,
  hasSkippedTutorial: false,
  showOnFirstVisit: true,
  lastCompletedAt: null,
};

// =============================================================================
// Store Implementation
// =============================================================================

export const useTutorialStore = create<TutorialStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        ...initialState,

        // Actions
        startTutorial: () => {
          log('Starting tutorial');
          set(
            {
              isActive: true,
              currentStepIndex: 0,
              visitedSteps: ['welcome'],
            },
            false,
            'startTutorial'
          );
        },

        nextStep: () => {
          const state = get();
          const nextIndex = state.currentStepIndex + 1;

          if (nextIndex >= TUTORIAL_STEPS.length) {
            log('Reached end of tutorial, completing');
            get().completeTutorial();
            return;
          }

          const nextStep = TUTORIAL_STEPS[nextIndex];
          log('Moving to next step:', nextStep.id);

          set(
            (state) => ({
              currentStepIndex: nextIndex,
              visitedSteps: state.visitedSteps.includes(nextStep.id)
                ? state.visitedSteps
                : [...state.visitedSteps, nextStep.id],
            }),
            false,
            'nextStep'
          );
        },

        prevStep: () => {
          const state = get();
          if (state.currentStepIndex <= 0) {
            log('Already at first step');
            return;
          }

          const prevIndex = state.currentStepIndex - 1;
          const prevStep = TUTORIAL_STEPS[prevIndex];
          log('Moving to previous step:', prevStep.id);

          set(
            {
              currentStepIndex: prevIndex,
            },
            false,
            'prevStep'
          );
        },

        goToStep: (index: number) => {
          if (index < 0 || index >= TUTORIAL_STEPS.length) {
            log('Invalid step index:', index);
            return;
          }

          const step = TUTORIAL_STEPS[index];
          log('Going to step:', step.id);

          set(
            (state) => ({
              currentStepIndex: index,
              visitedSteps: state.visitedSteps.includes(step.id)
                ? state.visitedSteps
                : [...state.visitedSteps, step.id],
            }),
            false,
            'goToStep'
          );
        },

        skipTutorial: () => {
          log('Skipping tutorial');
          set(
            {
              isActive: false,
              hasSkippedTutorial: true,
            },
            false,
            'skipTutorial'
          );
        },

        completeTutorial: () => {
          log('Completing tutorial');
          set(
            {
              isActive: false,
              hasCompletedTutorial: true,
              lastCompletedAt: Date.now(),
              visitedSteps: TUTORIAL_STEPS.map((step) => step.id),
            },
            false,
            'completeTutorial'
          );
        },

        resetTutorial: () => {
          log('Resetting tutorial');
          set(
            {
              isActive: false,
              currentStepIndex: 0,
              visitedSteps: [],
              hasCompletedTutorial: false,
              hasSkippedTutorial: false,
            },
            false,
            'resetTutorial'
          );
        },

        setShowOnFirstVisit: (show: boolean) => {
          log('Setting showOnFirstVisit:', show);
          set(
            {
              showOnFirstVisit: show,
            },
            false,
            'setShowOnFirstVisit'
          );
        },

        markStepVisited: (stepId: TutorialStepId) => {
          const state = get();
          if (state.visitedSteps.includes(stepId)) {
            return;
          }

          log('Marking step as visited:', stepId);
          set(
            (state) => ({
              visitedSteps: [...state.visitedSteps, stepId],
            }),
            false,
            'markStepVisited'
          );
        },
      }),
      {
        name: 'ghost-note-tutorial-store',
        partialize: (state) => ({
          hasCompletedTutorial: state.hasCompletedTutorial,
          hasSkippedTutorial: state.hasSkippedTutorial,
          showOnFirstVisit: state.showOnFirstVisit,
          lastCompletedAt: state.lastCompletedAt,
        }),
      }
    ),
    { name: 'TutorialStore' }
  )
);

// =============================================================================
// Selectors
// =============================================================================

/**
 * Check if tutorial is active
 */
export const selectIsTutorialActive = (state: TutorialStore): boolean => {
  return state.isActive;
};

/**
 * Get current step
 */
export const selectCurrentStep = (state: TutorialStore): TutorialStep => {
  return TUTORIAL_STEPS[state.currentStepIndex];
};

/**
 * Get current step index
 */
export const selectCurrentStepIndex = (state: TutorialStore): number => {
  return state.currentStepIndex;
};

/**
 * Get total steps count
 */
export const selectTotalSteps = (): number => {
  return TUTORIAL_STEPS.length;
};

/**
 * Check if at first step
 */
export const selectIsFirstStep = (state: TutorialStore): boolean => {
  return state.currentStepIndex === 0;
};

/**
 * Check if at last step
 */
export const selectIsLastStep = (state: TutorialStore): boolean => {
  return state.currentStepIndex === TUTORIAL_STEPS.length - 1;
};

/**
 * Get progress percentage
 */
export const selectProgress = (state: TutorialStore): number => {
  return ((state.currentStepIndex + 1) / TUTORIAL_STEPS.length) * 100;
};

/**
 * Check if a specific step has been visited
 */
export const selectIsStepVisited =
  (stepId: TutorialStepId) =>
  (state: TutorialStore): boolean => {
    return state.visitedSteps.includes(stepId);
  };

/**
 * Check if user should see tutorial on first visit
 */
export const selectShouldShowTutorial = (state: TutorialStore): boolean => {
  return state.showOnFirstVisit && !state.hasCompletedTutorial && !state.hasSkippedTutorial;
};

/**
 * Get all tutorial steps
 */
export const selectTutorialSteps = (): TutorialStep[] => {
  return TUTORIAL_STEPS;
};

export default useTutorialStore;
