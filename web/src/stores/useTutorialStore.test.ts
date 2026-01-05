/**
 * Tests for Tutorial Store
 *
 * @module stores/useTutorialStore.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  useTutorialStore,
  TUTORIAL_STEPS,
  selectIsTutorialActive,
  selectCurrentStep,
  selectCurrentStepIndex,
  selectTotalSteps,
  selectIsFirstStep,
  selectIsLastStep,
  selectProgress,
  selectIsStepVisited,
  selectShouldShowTutorial,
  selectTutorialSteps,
} from './useTutorialStore';

describe('useTutorialStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useTutorialStore.setState({
      isActive: false,
      currentStepIndex: 0,
      visitedSteps: [],
      hasCompletedTutorial: false,
      hasSkippedTutorial: false,
      showOnFirstVisit: true,
      lastCompletedAt: null,
    });
  });

  afterEach(() => {
    useTutorialStore.setState({
      isActive: false,
      currentStepIndex: 0,
      visitedSteps: [],
      hasCompletedTutorial: false,
      hasSkippedTutorial: false,
      showOnFirstVisit: true,
      lastCompletedAt: null,
    });
  });

  describe('initial state', () => {
    it('starts with tutorial inactive', () => {
      const state = useTutorialStore.getState();
      expect(state.isActive).toBe(false);
    });

    it('starts at step 0', () => {
      const state = useTutorialStore.getState();
      expect(state.currentStepIndex).toBe(0);
    });

    it('starts with no visited steps', () => {
      const state = useTutorialStore.getState();
      expect(state.visitedSteps).toEqual([]);
    });

    it('has not completed tutorial', () => {
      const state = useTutorialStore.getState();
      expect(state.hasCompletedTutorial).toBe(false);
    });

    it('has not skipped tutorial', () => {
      const state = useTutorialStore.getState();
      expect(state.hasSkippedTutorial).toBe(false);
    });

    it('shows tutorial on first visit by default', () => {
      const state = useTutorialStore.getState();
      expect(state.showOnFirstVisit).toBe(true);
    });
  });

  describe('startTutorial', () => {
    it('activates the tutorial', () => {
      useTutorialStore.getState().startTutorial();

      const state = useTutorialStore.getState();
      expect(state.isActive).toBe(true);
    });

    it('resets to step 0', () => {
      useTutorialStore.setState({ currentStepIndex: 3 });
      useTutorialStore.getState().startTutorial();

      const state = useTutorialStore.getState();
      expect(state.currentStepIndex).toBe(0);
    });

    it('marks welcome step as visited', () => {
      useTutorialStore.getState().startTutorial();

      const state = useTutorialStore.getState();
      expect(state.visitedSteps).toContain('welcome');
    });
  });

  describe('nextStep', () => {
    it('advances to next step', () => {
      useTutorialStore.getState().startTutorial();
      useTutorialStore.getState().nextStep();

      const state = useTutorialStore.getState();
      expect(state.currentStepIndex).toBe(1);
    });

    it('marks new step as visited', () => {
      useTutorialStore.getState().startTutorial();
      useTutorialStore.getState().nextStep();

      const state = useTutorialStore.getState();
      expect(state.visitedSteps).toContain('enter-poem');
    });

    it('completes tutorial when at last step', () => {
      useTutorialStore.setState({
        isActive: true,
        currentStepIndex: TUTORIAL_STEPS.length - 1,
        visitedSteps: TUTORIAL_STEPS.map((s) => s.id),
      });

      useTutorialStore.getState().nextStep();

      const state = useTutorialStore.getState();
      expect(state.isActive).toBe(false);
      expect(state.hasCompletedTutorial).toBe(true);
    });
  });

  describe('prevStep', () => {
    it('goes to previous step', () => {
      useTutorialStore.setState({
        isActive: true,
        currentStepIndex: 2,
        visitedSteps: ['welcome', 'enter-poem', 'understand-analysis'],
      });

      useTutorialStore.getState().prevStep();

      const state = useTutorialStore.getState();
      expect(state.currentStepIndex).toBe(1);
    });

    it('does nothing when at first step', () => {
      useTutorialStore.getState().startTutorial();
      useTutorialStore.getState().prevStep();

      const state = useTutorialStore.getState();
      expect(state.currentStepIndex).toBe(0);
    });
  });

  describe('goToStep', () => {
    it('jumps to specific step', () => {
      useTutorialStore.getState().startTutorial();
      useTutorialStore.getState().goToStep(3);

      const state = useTutorialStore.getState();
      expect(state.currentStepIndex).toBe(3);
    });

    it('marks jumped-to step as visited', () => {
      useTutorialStore.getState().startTutorial();
      useTutorialStore.getState().goToStep(3);

      const state = useTutorialStore.getState();
      expect(state.visitedSteps).toContain('edit-lyrics');
    });

    it('ignores invalid negative index', () => {
      useTutorialStore.setState({ currentStepIndex: 2 });
      useTutorialStore.getState().goToStep(-1);

      const state = useTutorialStore.getState();
      expect(state.currentStepIndex).toBe(2);
    });

    it('ignores index beyond steps length', () => {
      useTutorialStore.setState({ currentStepIndex: 2 });
      useTutorialStore.getState().goToStep(100);

      const state = useTutorialStore.getState();
      expect(state.currentStepIndex).toBe(2);
    });
  });

  describe('skipTutorial', () => {
    it('deactivates the tutorial', () => {
      useTutorialStore.getState().startTutorial();
      useTutorialStore.getState().skipTutorial();

      const state = useTutorialStore.getState();
      expect(state.isActive).toBe(false);
    });

    it('sets hasSkippedTutorial to true', () => {
      useTutorialStore.getState().startTutorial();
      useTutorialStore.getState().skipTutorial();

      const state = useTutorialStore.getState();
      expect(state.hasSkippedTutorial).toBe(true);
    });
  });

  describe('completeTutorial', () => {
    it('deactivates the tutorial', () => {
      useTutorialStore.getState().startTutorial();
      useTutorialStore.getState().completeTutorial();

      const state = useTutorialStore.getState();
      expect(state.isActive).toBe(false);
    });

    it('sets hasCompletedTutorial to true', () => {
      useTutorialStore.getState().startTutorial();
      useTutorialStore.getState().completeTutorial();

      const state = useTutorialStore.getState();
      expect(state.hasCompletedTutorial).toBe(true);
    });

    it('sets lastCompletedAt timestamp', () => {
      useTutorialStore.getState().startTutorial();
      useTutorialStore.getState().completeTutorial();

      const state = useTutorialStore.getState();
      expect(state.lastCompletedAt).toBeGreaterThan(0);
    });

    it('marks all steps as visited', () => {
      useTutorialStore.getState().startTutorial();
      useTutorialStore.getState().completeTutorial();

      const state = useTutorialStore.getState();
      expect(state.visitedSteps.length).toBe(TUTORIAL_STEPS.length);
    });
  });

  describe('resetTutorial', () => {
    it('resets to initial state', () => {
      useTutorialStore.setState({
        isActive: true,
        currentStepIndex: 5,
        visitedSteps: ['welcome', 'enter-poem'],
        hasCompletedTutorial: true,
        hasSkippedTutorial: true,
      });

      useTutorialStore.getState().resetTutorial();

      const state = useTutorialStore.getState();
      expect(state.isActive).toBe(false);
      expect(state.currentStepIndex).toBe(0);
      expect(state.visitedSteps).toEqual([]);
      expect(state.hasCompletedTutorial).toBe(false);
      expect(state.hasSkippedTutorial).toBe(false);
    });
  });

  describe('setShowOnFirstVisit', () => {
    it('sets showOnFirstVisit to true', () => {
      useTutorialStore.setState({ showOnFirstVisit: false });
      useTutorialStore.getState().setShowOnFirstVisit(true);

      const state = useTutorialStore.getState();
      expect(state.showOnFirstVisit).toBe(true);
    });

    it('sets showOnFirstVisit to false', () => {
      useTutorialStore.getState().setShowOnFirstVisit(false);

      const state = useTutorialStore.getState();
      expect(state.showOnFirstVisit).toBe(false);
    });
  });

  describe('markStepVisited', () => {
    it('adds step to visited steps', () => {
      useTutorialStore.getState().markStepVisited('enter-poem');

      const state = useTutorialStore.getState();
      expect(state.visitedSteps).toContain('enter-poem');
    });

    it('does not duplicate already visited steps', () => {
      useTutorialStore.setState({ visitedSteps: ['welcome'] });
      useTutorialStore.getState().markStepVisited('welcome');

      const state = useTutorialStore.getState();
      expect(state.visitedSteps.filter((s) => s === 'welcome').length).toBe(1);
    });
  });

  describe('selectors', () => {
    describe('selectIsTutorialActive', () => {
      it('returns true when active', () => {
        useTutorialStore.setState({ isActive: true });
        expect(selectIsTutorialActive(useTutorialStore.getState())).toBe(true);
      });

      it('returns false when inactive', () => {
        useTutorialStore.setState({ isActive: false });
        expect(selectIsTutorialActive(useTutorialStore.getState())).toBe(false);
      });
    });

    describe('selectCurrentStep', () => {
      it('returns current step object', () => {
        useTutorialStore.setState({ currentStepIndex: 1 });
        const step = selectCurrentStep(useTutorialStore.getState());
        expect(step.id).toBe('enter-poem');
      });
    });

    describe('selectCurrentStepIndex', () => {
      it('returns current step index', () => {
        useTutorialStore.setState({ currentStepIndex: 3 });
        expect(selectCurrentStepIndex(useTutorialStore.getState())).toBe(3);
      });
    });

    describe('selectTotalSteps', () => {
      it('returns total number of steps', () => {
        expect(selectTotalSteps()).toBe(TUTORIAL_STEPS.length);
      });
    });

    describe('selectIsFirstStep', () => {
      it('returns true at first step', () => {
        useTutorialStore.setState({ currentStepIndex: 0 });
        expect(selectIsFirstStep(useTutorialStore.getState())).toBe(true);
      });

      it('returns false at other steps', () => {
        useTutorialStore.setState({ currentStepIndex: 2 });
        expect(selectIsFirstStep(useTutorialStore.getState())).toBe(false);
      });
    });

    describe('selectIsLastStep', () => {
      it('returns true at last step', () => {
        useTutorialStore.setState({ currentStepIndex: TUTORIAL_STEPS.length - 1 });
        expect(selectIsLastStep(useTutorialStore.getState())).toBe(true);
      });

      it('returns false at other steps', () => {
        useTutorialStore.setState({ currentStepIndex: 0 });
        expect(selectIsLastStep(useTutorialStore.getState())).toBe(false);
      });
    });

    describe('selectProgress', () => {
      it('returns correct percentage at first step', () => {
        useTutorialStore.setState({ currentStepIndex: 0 });
        const progress = selectProgress(useTutorialStore.getState());
        expect(progress).toBeCloseTo((1 / TUTORIAL_STEPS.length) * 100);
      });

      it('returns 100% at last step', () => {
        useTutorialStore.setState({ currentStepIndex: TUTORIAL_STEPS.length - 1 });
        expect(selectProgress(useTutorialStore.getState())).toBe(100);
      });
    });

    describe('selectIsStepVisited', () => {
      it('returns true for visited step', () => {
        useTutorialStore.setState({ visitedSteps: ['welcome', 'enter-poem'] });
        expect(selectIsStepVisited('welcome')(useTutorialStore.getState())).toBe(true);
      });

      it('returns false for unvisited step', () => {
        useTutorialStore.setState({ visitedSteps: ['welcome'] });
        expect(selectIsStepVisited('enter-poem')(useTutorialStore.getState())).toBe(false);
      });
    });

    describe('selectShouldShowTutorial', () => {
      it('returns true for first visit', () => {
        useTutorialStore.setState({
          showOnFirstVisit: true,
          hasCompletedTutorial: false,
          hasSkippedTutorial: false,
        });
        expect(selectShouldShowTutorial(useTutorialStore.getState())).toBe(true);
      });

      it('returns false after completing tutorial', () => {
        useTutorialStore.setState({
          showOnFirstVisit: true,
          hasCompletedTutorial: true,
          hasSkippedTutorial: false,
        });
        expect(selectShouldShowTutorial(useTutorialStore.getState())).toBe(false);
      });

      it('returns false after skipping tutorial', () => {
        useTutorialStore.setState({
          showOnFirstVisit: true,
          hasCompletedTutorial: false,
          hasSkippedTutorial: true,
        });
        expect(selectShouldShowTutorial(useTutorialStore.getState())).toBe(false);
      });

      it('returns false when showOnFirstVisit is disabled', () => {
        useTutorialStore.setState({
          showOnFirstVisit: false,
          hasCompletedTutorial: false,
          hasSkippedTutorial: false,
        });
        expect(selectShouldShowTutorial(useTutorialStore.getState())).toBe(false);
      });
    });

    describe('selectTutorialSteps', () => {
      it('returns all tutorial steps', () => {
        expect(selectTutorialSteps()).toEqual(TUTORIAL_STEPS);
      });
    });
  });

  describe('TUTORIAL_STEPS', () => {
    it('has welcome step', () => {
      expect(TUTORIAL_STEPS.find((s) => s.id === 'welcome')).toBeDefined();
    });

    it('has enter-poem step', () => {
      expect(TUTORIAL_STEPS.find((s) => s.id === 'enter-poem')).toBeDefined();
    });

    it('has understand-analysis step', () => {
      expect(TUTORIAL_STEPS.find((s) => s.id === 'understand-analysis')).toBeDefined();
    });

    it('has edit-lyrics step', () => {
      expect(TUTORIAL_STEPS.find((s) => s.id === 'edit-lyrics')).toBeDefined();
    });

    it('has generate-melody step', () => {
      expect(TUTORIAL_STEPS.find((s) => s.id === 'generate-melody')).toBeDefined();
    });

    it('has record-yourself step', () => {
      expect(TUTORIAL_STEPS.find((s) => s.id === 'record-yourself')).toBeDefined();
    });

    it('has complete step', () => {
      expect(TUTORIAL_STEPS.find((s) => s.id === 'complete')).toBeDefined();
    });

    it('has 7 total steps', () => {
      expect(TUTORIAL_STEPS.length).toBe(7);
    });

    it('all steps have required fields', () => {
      for (const step of TUTORIAL_STEPS) {
        expect(step.id).toBeDefined();
        expect(step.title).toBeDefined();
        expect(step.description).toBeDefined();
        expect(step.tooltipPosition).toBeDefined();
      }
    });
  });
});
