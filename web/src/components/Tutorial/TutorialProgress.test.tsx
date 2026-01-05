/**
 * Tests for TutorialProgress Component
 *
 * @module components/Tutorial/TutorialProgress.test
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { TutorialProgress, type TutorialProgressProps } from './TutorialProgress';
import type { TutorialStep, TutorialStepId } from '@/stores/useTutorialStore';

describe('TutorialProgress', () => {
  const mockSteps: TutorialStep[] = [
    { id: 'welcome', title: 'Welcome', description: 'Welcome step', tooltipPosition: 'center' },
    { id: 'enter-poem', title: 'Enter Poem', description: 'Poem step', tooltipPosition: 'right' },
    {
      id: 'understand-analysis',
      title: 'Analysis',
      description: 'Analysis step',
      tooltipPosition: 'left',
    },
    { id: 'edit-lyrics', title: 'Edit', description: 'Edit step', tooltipPosition: 'left' },
    { id: 'generate-melody', title: 'Melody', description: 'Melody step', tooltipPosition: 'left' },
  ];

  const defaultProps: TutorialProgressProps = {
    steps: mockSteps,
    currentStepIndex: 0,
    visitedSteps: ['welcome'] as TutorialStepId[],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('dots style (default)', () => {
    it('renders correct number of dots', () => {
      render(<TutorialProgress {...defaultProps} />);

      // Should render 5 dots for 5 steps
      for (let i = 0; i < mockSteps.length; i++) {
        expect(screen.getByTestId(`tutorial-progress-dot-${i}`)).toBeInTheDocument();
      }
    });

    it('marks current step as current', () => {
      render(<TutorialProgress {...defaultProps} currentStepIndex={2} />);

      const currentDot = screen.getByTestId('tutorial-progress-dot-2');
      expect(currentDot).toHaveClass('tutorial-progress__dot--current');
    });

    it('marks visited steps as visited', () => {
      render(
        <TutorialProgress
          {...defaultProps}
          currentStepIndex={2}
          visitedSteps={['welcome', 'enter-poem'] as TutorialStepId[]}
        />
      );

      const visitedDot = screen.getByTestId('tutorial-progress-dot-0');
      expect(visitedDot).toHaveClass('tutorial-progress__dot--visited');
    });

    it('uses custom testId', () => {
      render(<TutorialProgress {...defaultProps} testId="custom-progress" />);

      expect(screen.getByTestId('custom-progress')).toBeInTheDocument();
      expect(screen.getByTestId('custom-progress-dot-0')).toBeInTheDocument();
    });

    it('has list role for accessibility', () => {
      render(<TutorialProgress {...defaultProps} />);

      expect(screen.getByTestId('tutorial-progress')).toHaveAttribute('role', 'list');
    });

    it('has aria-label for accessibility', () => {
      render(<TutorialProgress {...defaultProps} />);

      expect(screen.getByTestId('tutorial-progress')).toHaveAttribute(
        'aria-label',
        'Tutorial progress'
      );
    });

    it('marks current dot with aria-current', () => {
      render(<TutorialProgress {...defaultProps} currentStepIndex={1} />);

      const currentDot = screen.getByTestId('tutorial-progress-dot-1');
      expect(currentDot).toHaveAttribute('aria-current', 'step');
    });
  });

  describe('bar style', () => {
    it('renders progress bar', () => {
      render(<TutorialProgress {...defaultProps} style="bar" />);

      expect(screen.getByTestId('tutorial-progress')).toHaveClass('tutorial-progress--bar');
    });

    it('shows progress percentage', () => {
      render(<TutorialProgress {...defaultProps} style="bar" currentStepIndex={2} />);

      // Step 3 of 5 = 60%
      expect(screen.getByText('3 / 5')).toBeInTheDocument();
    });

    it('has progressbar role', () => {
      render(<TutorialProgress {...defaultProps} style="bar" />);

      expect(screen.getByTestId('tutorial-progress')).toHaveAttribute('role', 'progressbar');
    });

    it('has correct aria values', () => {
      render(<TutorialProgress {...defaultProps} style="bar" currentStepIndex={2} />);

      const progress = screen.getByTestId('tutorial-progress');
      expect(progress).toHaveAttribute('aria-valuenow', '3');
      expect(progress).toHaveAttribute('aria-valuemin', '1');
      expect(progress).toHaveAttribute('aria-valuemax', '5');
    });

    it('updates progress fill width', () => {
      render(<TutorialProgress {...defaultProps} style="bar" currentStepIndex={2} />);

      const fill = document.querySelector('.tutorial-progress__bar-fill');
      expect(fill).toHaveStyle({ width: '60%' });
    });
  });

  describe('numbered style', () => {
    it('renders numbered indicators', () => {
      render(<TutorialProgress {...defaultProps} style="numbered" />);

      expect(screen.getByTestId('tutorial-progress')).toHaveClass('tutorial-progress--numbered');

      // Should show numbers
      for (let i = 0; i < mockSteps.length; i++) {
        expect(screen.getByTestId(`tutorial-progress-step-${i}`)).toHaveTextContent(`${i + 1}`);
      }
    });

    it('marks current step correctly', () => {
      render(<TutorialProgress {...defaultProps} style="numbered" currentStepIndex={2} />);

      const currentItem = screen.getByTestId('tutorial-progress-step-2').closest('.tutorial-progress__numbered-item');
      expect(currentItem).toHaveClass('tutorial-progress__numbered-item--current');
    });

    it('marks visited steps correctly', () => {
      render(
        <TutorialProgress
          {...defaultProps}
          style="numbered"
          currentStepIndex={2}
          visitedSteps={['welcome', 'enter-poem'] as TutorialStepId[]}
        />
      );

      const visitedItem = screen.getByTestId('tutorial-progress-step-0').closest('.tutorial-progress__numbered-item');
      expect(visitedItem).toHaveClass('tutorial-progress__numbered-item--visited');
    });

    it('renders connectors between steps', () => {
      render(<TutorialProgress {...defaultProps} style="numbered" />);

      // Should have connectors (one less than steps)
      const connectors = document.querySelectorAll('.tutorial-progress__numbered-connector');
      expect(connectors.length).toBe(mockSteps.length - 1);
    });
  });

  describe('navigation', () => {
    it('allows clicking on visited steps when navigation enabled', () => {
      const onStepClick = vi.fn();
      render(
        <TutorialProgress
          {...defaultProps}
          currentStepIndex={2}
          visitedSteps={['welcome', 'enter-poem', 'understand-analysis'] as TutorialStepId[]}
          allowNavigation={true}
          onStepClick={onStepClick}
        />
      );

      fireEvent.click(screen.getByTestId('tutorial-progress-dot-0'));

      expect(onStepClick).toHaveBeenCalledWith(0);
    });

    it('does not allow clicking on unvisited steps', () => {
      const onStepClick = vi.fn();
      render(
        <TutorialProgress
          {...defaultProps}
          currentStepIndex={1}
          visitedSteps={['welcome', 'enter-poem'] as TutorialStepId[]}
          allowNavigation={true}
          onStepClick={onStepClick}
        />
      );

      // Step 4 is not visited
      fireEvent.click(screen.getByTestId('tutorial-progress-dot-4'));

      expect(onStepClick).not.toHaveBeenCalled();
    });

    it('does not call onStepClick when navigation disabled', () => {
      const onStepClick = vi.fn();
      render(
        <TutorialProgress
          {...defaultProps}
          currentStepIndex={2}
          visitedSteps={['welcome', 'enter-poem', 'understand-analysis'] as TutorialStepId[]}
          allowNavigation={false}
          onStepClick={onStepClick}
        />
      );

      fireEvent.click(screen.getByTestId('tutorial-progress-dot-0'));

      expect(onStepClick).not.toHaveBeenCalled();
    });

    it('supports keyboard navigation on clickable steps', () => {
      const onStepClick = vi.fn();
      render(
        <TutorialProgress
          {...defaultProps}
          currentStepIndex={2}
          visitedSteps={['welcome', 'enter-poem', 'understand-analysis'] as TutorialStepId[]}
          allowNavigation={true}
          onStepClick={onStepClick}
        />
      );

      const dot = screen.getByTestId('tutorial-progress-dot-0');
      fireEvent.keyDown(dot, { key: 'Enter' });

      expect(onStepClick).toHaveBeenCalledWith(0);
    });

    it('supports Space key for navigation', () => {
      const onStepClick = vi.fn();
      render(
        <TutorialProgress
          {...defaultProps}
          currentStepIndex={2}
          visitedSteps={['welcome', 'enter-poem', 'understand-analysis'] as TutorialStepId[]}
          allowNavigation={true}
          onStepClick={onStepClick}
        />
      );

      const dot = screen.getByTestId('tutorial-progress-dot-0');
      fireEvent.keyDown(dot, { key: ' ' });

      expect(onStepClick).toHaveBeenCalledWith(0);
    });
  });

  describe('sizes', () => {
    it('applies small size class', () => {
      render(<TutorialProgress {...defaultProps} size="small" />);

      expect(screen.getByTestId('tutorial-progress')).toHaveClass('tutorial-progress--small');
    });

    it('applies medium size class (default)', () => {
      render(<TutorialProgress {...defaultProps} />);

      expect(screen.getByTestId('tutorial-progress')).toHaveClass('tutorial-progress--medium');
    });

    it('applies large size class', () => {
      render(<TutorialProgress {...defaultProps} size="large" />);

      expect(screen.getByTestId('tutorial-progress')).toHaveClass('tutorial-progress--large');
    });
  });

  describe('accessibility', () => {
    it('dots have accessible labels', () => {
      render(
        <TutorialProgress
          {...defaultProps}
          currentStepIndex={1}
          visitedSteps={['welcome', 'enter-poem'] as TutorialStepId[]}
        />
      );

      const currentDot = screen.getByTestId('tutorial-progress-dot-1');
      expect(currentDot).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Step 2: Enter Poem')
      );
    });

    it('numbered steps have accessible labels', () => {
      render(
        <TutorialProgress
          {...defaultProps}
          style="numbered"
          allowNavigation={true}
          onStepClick={vi.fn()}
          visitedSteps={['welcome'] as TutorialStepId[]}
        />
      );

      const firstStep = screen.getByTestId('tutorial-progress-step-0');
      expect(firstStep).toHaveAttribute('aria-label', expect.stringContaining('Welcome'));
    });

    it('bar style has descriptive aria-label', () => {
      render(<TutorialProgress {...defaultProps} style="bar" currentStepIndex={2} />);

      expect(screen.getByTestId('tutorial-progress')).toHaveAttribute(
        'aria-label',
        'Tutorial progress: step 3 of 5'
      );
    });
  });

  describe('edge cases', () => {
    it('handles empty steps array', () => {
      render(<TutorialProgress {...defaultProps} steps={[]} />);

      expect(screen.getByTestId('tutorial-progress')).toBeInTheDocument();
    });

    it('handles currentStepIndex out of bounds', () => {
      render(<TutorialProgress {...defaultProps} currentStepIndex={100} />);

      // Should still render without crashing
      expect(screen.getByTestId('tutorial-progress')).toBeInTheDocument();
    });

    it('handles single step', () => {
      const singleStep: TutorialStep[] = [
        { id: 'welcome', title: 'Welcome', description: 'Only step', tooltipPosition: 'center' },
      ];
      render(<TutorialProgress {...defaultProps} steps={singleStep} currentStepIndex={0} />);

      expect(screen.getByTestId('tutorial-progress-dot-0')).toBeInTheDocument();
    });

    it('handles empty visitedSteps array', () => {
      render(<TutorialProgress {...defaultProps} visitedSteps={[]} />);

      // Should render all dots as unvisited
      const dot = screen.getByTestId('tutorial-progress-dot-0');
      expect(dot).not.toHaveClass('tutorial-progress__dot--visited');
    });
  });
});
