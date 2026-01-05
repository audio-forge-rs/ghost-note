/**
 * Tests for TutorialDialog Component
 *
 * @module components/Tutorial/TutorialDialog.test
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { TutorialDialog, type TutorialDialogProps } from './TutorialDialog';
import { useTutorialStore, TUTORIAL_STEPS } from '@/stores/useTutorialStore';

// Mock the useAnnouncer hook
vi.mock('@/hooks', () => ({
  useAnnouncer: () => ({
    announce: vi.fn(),
    clearAnnouncements: vi.fn(),
  }),
}));

describe('TutorialDialog', () => {
  const defaultProps: TutorialDialogProps = {
    isOpen: true,
    onClose: vi.fn(),
    onComplete: vi.fn(),
    onNavigate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Reset tutorial store to initial state
    useTutorialStore.setState({
      isActive: true,
      currentStepIndex: 0,
      visitedSteps: ['welcome'],
      hasCompletedTutorial: false,
      hasSkippedTutorial: false,
      showOnFirstVisit: true,
      lastCompletedAt: null,
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders the dialog when isOpen is true', () => {
      render(<TutorialDialog {...defaultProps} />);

      expect(screen.getByTestId('tutorial-dialog')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<TutorialDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('tutorial-dialog')).not.toBeInTheDocument();
    });

    it('renders the overlay', () => {
      render(<TutorialDialog {...defaultProps} />);

      expect(screen.getByTestId('tutorial-dialog-overlay')).toBeInTheDocument();
    });

    it('renders the step content', () => {
      render(<TutorialDialog {...defaultProps} />);

      expect(screen.getByTestId('tutorial-dialog-step')).toBeInTheDocument();
    });

    it('renders the first step title', () => {
      render(<TutorialDialog {...defaultProps} />);

      expect(screen.getByTestId('tutorial-dialog-step-title')).toHaveTextContent(
        TUTORIAL_STEPS[0].title
      );
    });

    it('uses custom testId', () => {
      render(<TutorialDialog {...defaultProps} testId="custom-tutorial" />);

      expect(screen.getByTestId('custom-tutorial')).toBeInTheDocument();
      expect(screen.getByTestId('custom-tutorial-overlay')).toBeInTheDocument();
      expect(screen.getByTestId('custom-tutorial-step')).toBeInTheDocument();
    });

    it('renders progress indicator for overlay steps', () => {
      render(<TutorialDialog {...defaultProps} />);

      // First step is an overlay step, should show progress
      expect(screen.getByTestId('tutorial-dialog-progress')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('advances to next step when Next is clicked', async () => {
      render(<TutorialDialog {...defaultProps} />);

      const nextButton = screen.getByTestId('tutorial-dialog-step-next');
      fireEvent.click(nextButton);

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(screen.getByTestId('tutorial-dialog-step-title')).toHaveTextContent(
        TUTORIAL_STEPS[1].title
      );
    });

    it('goes to previous step when Back is clicked', async () => {
      // Start at step 2
      useTutorialStore.setState({
        isActive: true,
        currentStepIndex: 1,
        visitedSteps: ['welcome', 'enter-poem'],
      });

      render(<TutorialDialog {...defaultProps} />);

      const prevButton = screen.getByTestId('tutorial-dialog-step-prev');
      fireEvent.click(prevButton);

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(screen.getByTestId('tutorial-dialog-step-title')).toHaveTextContent(
        TUTORIAL_STEPS[0].title
      );
    });

    it('calls onClose when skip is clicked', () => {
      const onClose = vi.fn();
      render(<TutorialDialog {...defaultProps} onClose={onClose} />);

      const skipButton = screen.getByTestId('tutorial-dialog-step-skip');
      fireEvent.click(skipButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onComplete when completing on last step', async () => {
      // Go to last step
      useTutorialStore.setState({
        isActive: true,
        currentStepIndex: TUTORIAL_STEPS.length - 1,
        visitedSteps: TUTORIAL_STEPS.map((s) => s.id),
      });

      const onComplete = vi.fn();
      const onClose = vi.fn();
      render(<TutorialDialog {...defaultProps} onComplete={onComplete} onClose={onClose} />);

      const completeButton = screen.getByTestId('tutorial-dialog-step-complete');
      fireEvent.click(completeButton);

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('keyboard navigation', () => {
    it('advances to next step when ArrowRight is pressed', async () => {
      render(<TutorialDialog {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'ArrowRight' });

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(screen.getByTestId('tutorial-dialog-step-title')).toHaveTextContent(
        TUTORIAL_STEPS[1].title
      );
    });

    it('advances to next step when Enter is pressed', async () => {
      render(<TutorialDialog {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Enter' });

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(screen.getByTestId('tutorial-dialog-step-title')).toHaveTextContent(
        TUTORIAL_STEPS[1].title
      );
    });

    it('goes to previous step when ArrowLeft is pressed', async () => {
      useTutorialStore.setState({
        isActive: true,
        currentStepIndex: 1,
        visitedSteps: ['welcome', 'enter-poem'],
      });

      render(<TutorialDialog {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'ArrowLeft' });

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(screen.getByTestId('tutorial-dialog-step-title')).toHaveTextContent(
        TUTORIAL_STEPS[0].title
      );
    });

    it('skips tutorial when Escape is pressed', () => {
      const onClose = vi.fn();
      render(<TutorialDialog {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('view navigation', () => {
    it('calls onNavigate when step has targetView', async () => {
      const onNavigate = vi.fn();

      // Step 1 (enter-poem) has targetView: 'poem-input'
      useTutorialStore.setState({
        isActive: true,
        currentStepIndex: 1,
        visitedSteps: ['welcome', 'enter-poem'],
      });

      render(<TutorialDialog {...defaultProps} onNavigate={onNavigate} />);

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(onNavigate).toHaveBeenCalledWith('poem-input');
    });
  });

  describe('body scroll prevention', () => {
    it('prevents body scroll when dialog is open', () => {
      render(<TutorialDialog {...defaultProps} />);

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when dialog closes', () => {
      const { rerender } = render(<TutorialDialog {...defaultProps} />);

      expect(document.body.style.overflow).toBe('hidden');

      rerender(<TutorialDialog {...defaultProps} isOpen={false} />);

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('accessibility', () => {
    it('has role="dialog"', () => {
      render(<TutorialDialog {...defaultProps} />);

      expect(screen.getByTestId('tutorial-dialog')).toHaveAttribute('role', 'dialog');
    });

    it('has aria-modal="true"', () => {
      render(<TutorialDialog {...defaultProps} />);

      expect(screen.getByTestId('tutorial-dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('has accessible label', () => {
      render(<TutorialDialog {...defaultProps} />);

      expect(screen.getByTestId('tutorial-dialog')).toHaveAttribute(
        'aria-label',
        'Interactive tutorial'
      );
    });
  });

  describe('step indicator interaction', () => {
    it('allows clicking on visited steps to navigate on overlay steps', async () => {
      // Start at step 0 (welcome) which is an overlay step and shows progress
      useTutorialStore.setState({
        isActive: true,
        currentStepIndex: 0,
        visitedSteps: ['welcome', 'enter-poem', 'understand-analysis'],
      });

      render(<TutorialDialog {...defaultProps} />);

      // Progress dots should be visible since step 0 is an overlay step
      const secondDot = screen.getByTestId('tutorial-dialog-progress-dots-dot-1');
      fireEvent.click(secondDot);

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(screen.getByTestId('tutorial-dialog-step-title')).toHaveTextContent(
        TUTORIAL_STEPS[1].title
      );
    });
  });
});

describe('TutorialDialog integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Reset tutorial store
    useTutorialStore.setState({
      isActive: true,
      currentStepIndex: 0,
      visitedSteps: ['welcome'],
      hasCompletedTutorial: false,
      hasSkippedTutorial: false,
      showOnFirstVisit: true,
      lastCompletedAt: null,
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('completes a full tutorial flow', async () => {
    const onClose = vi.fn();
    const onComplete = vi.fn();
    const onNavigate = vi.fn();

    render(
      <TutorialDialog
        isOpen={true}
        onClose={onClose}
        onComplete={onComplete}
        onNavigate={onNavigate}
      />
    );

    // Verify first step
    expect(screen.getByTestId('tutorial-dialog-step-title')).toHaveTextContent(
      'Welcome to Ghost Note'
    );

    // Navigate through all steps
    for (let i = 0; i < TUTORIAL_STEPS.length - 1; i++) {
      const nextButton = screen.queryByTestId('tutorial-dialog-step-next');
      if (nextButton) {
        fireEvent.click(nextButton);
        await act(async () => {
          vi.advanceTimersByTime(100);
        });
      }
    }

    // Verify we're at the last step
    expect(screen.getByTestId('tutorial-dialog-step-title')).toHaveTextContent(
      "You're All Set!"
    );

    // Complete the tutorial
    const completeButton = screen.getByTestId('tutorial-dialog-step-complete');
    fireEvent.click(completeButton);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles skip at any point', async () => {
    const onClose = vi.fn();

    render(<TutorialDialog isOpen={true} onClose={onClose} />);

    // Navigate to step 3
    fireEvent.click(screen.getByTestId('tutorial-dialog-step-next'));
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    fireEvent.click(screen.getByTestId('tutorial-dialog-step-next'));
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    // Skip
    fireEvent.click(screen.getByTestId('tutorial-dialog-step-skip'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(useTutorialStore.getState().hasSkippedTutorial).toBe(true);
  });

  it('tracks visited steps correctly', async () => {
    render(<TutorialDialog isOpen={true} onClose={vi.fn()} />);

    // Navigate through first 3 steps
    fireEvent.click(screen.getByTestId('tutorial-dialog-step-next'));
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    fireEvent.click(screen.getByTestId('tutorial-dialog-step-next'));
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    const state = useTutorialStore.getState();
    expect(state.visitedSteps).toContain('welcome');
    expect(state.visitedSteps).toContain('enter-poem');
    expect(state.visitedSteps).toContain('understand-analysis');
  });
});
