/**
 * Tests for TutorialStep Component
 *
 * @module components/Tutorial/TutorialStep.test
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { TutorialStep, type TutorialStepProps } from './TutorialStep';
import type { TutorialStep as TutorialStepType } from '@/stores/useTutorialStore';

describe('TutorialStep', () => {
  const mockStep: TutorialStepType = {
    id: 'welcome',
    title: 'Welcome to Ghost Note',
    description: 'This is a test description.',
    tip: 'This is a helpful tip.',
    tooltipPosition: 'center',
    isOverlayStep: true,
  };

  const defaultProps: TutorialStepProps = {
    step: mockStep,
    stepNumber: 1,
    totalSteps: 7,
    isFirst: true,
    isLast: false,
    onNext: vi.fn(),
    onPrev: vi.fn(),
    onSkip: vi.fn(),
    onComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders the step title', () => {
      render(<TutorialStep {...defaultProps} />);

      expect(screen.getByTestId('tutorial-step-title')).toHaveTextContent(
        'Welcome to Ghost Note'
      );
    });

    it('renders the step description', () => {
      render(<TutorialStep {...defaultProps} />);

      expect(screen.getByTestId('tutorial-step-description')).toHaveTextContent(
        'This is a test description.'
      );
    });

    it('renders the tip when provided', () => {
      render(<TutorialStep {...defaultProps} />);

      expect(screen.getByTestId('tutorial-step-tip')).toHaveTextContent(
        'This is a helpful tip.'
      );
    });

    it('does not render tip when not provided', () => {
      const stepWithoutTip = { ...mockStep, tip: undefined };
      render(<TutorialStep {...defaultProps} step={stepWithoutTip} />);

      expect(screen.queryByTestId('tutorial-step-tip')).not.toBeInTheDocument();
    });

    it('renders the step counter', () => {
      render(<TutorialStep {...defaultProps} />);

      expect(screen.getByText('1 / 7')).toBeInTheDocument();
    });

    it('uses custom testId', () => {
      render(<TutorialStep {...defaultProps} testId="custom-step" />);

      expect(screen.getByTestId('custom-step')).toBeInTheDocument();
      expect(screen.getByTestId('custom-step-title')).toBeInTheDocument();
      expect(screen.getByTestId('custom-step-description')).toBeInTheDocument();
    });
  });

  describe('button rendering', () => {
    it('shows "Start Tour" button on first step', () => {
      render(<TutorialStep {...defaultProps} isFirst={true} isLast={false} />);

      expect(screen.getByTestId('tutorial-step-next')).toHaveTextContent('Start Tour');
    });

    it('shows "Next" button on middle steps', () => {
      render(<TutorialStep {...defaultProps} isFirst={false} isLast={false} />);

      expect(screen.getByTestId('tutorial-step-next')).toHaveTextContent('Next');
    });

    it('shows "Get Started" button on last step', () => {
      render(<TutorialStep {...defaultProps} isFirst={false} isLast={true} />);

      expect(screen.getByTestId('tutorial-step-complete')).toHaveTextContent('Get Started');
    });

    it('does not show Back button on first step', () => {
      render(<TutorialStep {...defaultProps} isFirst={true} />);

      expect(screen.queryByTestId('tutorial-step-prev')).not.toBeInTheDocument();
    });

    it('shows Back button on non-first steps', () => {
      render(<TutorialStep {...defaultProps} isFirst={false} />);

      expect(screen.getByTestId('tutorial-step-prev')).toBeInTheDocument();
    });

    it('always shows skip button', () => {
      render(<TutorialStep {...defaultProps} />);

      expect(screen.getByTestId('tutorial-step-skip')).toBeInTheDocument();
    });
  });

  describe('button interactions', () => {
    it('calls onNext when Next button is clicked', () => {
      const onNext = vi.fn();
      render(<TutorialStep {...defaultProps} onNext={onNext} />);

      fireEvent.click(screen.getByTestId('tutorial-step-next'));

      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('calls onPrev when Back button is clicked', () => {
      const onPrev = vi.fn();
      render(<TutorialStep {...defaultProps} isFirst={false} onPrev={onPrev} />);

      fireEvent.click(screen.getByTestId('tutorial-step-prev'));

      expect(onPrev).toHaveBeenCalledTimes(1);
    });

    it('calls onSkip when skip button is clicked', () => {
      const onSkip = vi.fn();
      render(<TutorialStep {...defaultProps} onSkip={onSkip} />);

      fireEvent.click(screen.getByTestId('tutorial-step-skip'));

      expect(onSkip).toHaveBeenCalledTimes(1);
    });

    it('calls onComplete when Get Started button is clicked on last step', () => {
      const onComplete = vi.fn();
      render(
        <TutorialStep {...defaultProps} isFirst={false} isLast={true} onComplete={onComplete} />
      );

      fireEvent.click(screen.getByTestId('tutorial-step-complete'));

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('keyboard navigation', () => {
    it('calls onNext when ArrowRight is pressed', () => {
      const onNext = vi.fn();
      render(<TutorialStep {...defaultProps} onNext={onNext} />);

      fireEvent.keyDown(document, { key: 'ArrowRight' });

      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('calls onNext when Enter is pressed', () => {
      const onNext = vi.fn();
      render(<TutorialStep {...defaultProps} onNext={onNext} />);

      fireEvent.keyDown(document, { key: 'Enter' });

      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('calls onPrev when ArrowLeft is pressed on non-first step', () => {
      const onPrev = vi.fn();
      render(<TutorialStep {...defaultProps} isFirst={false} onPrev={onPrev} />);

      fireEvent.keyDown(document, { key: 'ArrowLeft' });

      expect(onPrev).toHaveBeenCalledTimes(1);
    });

    it('does not call onPrev when ArrowLeft is pressed on first step', () => {
      const onPrev = vi.fn();
      render(<TutorialStep {...defaultProps} isFirst={true} onPrev={onPrev} />);

      fireEvent.keyDown(document, { key: 'ArrowLeft' });

      expect(onPrev).not.toHaveBeenCalled();
    });

    it('calls onSkip when Escape is pressed', () => {
      const onSkip = vi.fn();
      render(<TutorialStep {...defaultProps} onSkip={onSkip} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onSkip).toHaveBeenCalledTimes(1);
    });

    it('calls onComplete when Enter is pressed on last step', () => {
      const onComplete = vi.fn();
      render(
        <TutorialStep {...defaultProps} isFirst={false} isLast={true} onComplete={onComplete} />
      );

      fireEvent.keyDown(document, { key: 'Enter' });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('focus management', () => {
    it('focuses the next/complete button on mount', async () => {
      render(<TutorialStep {...defaultProps} />);

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(document.activeElement).toBe(screen.getByTestId('tutorial-step-next'));
    });

    it('focuses the complete button on last step', async () => {
      render(<TutorialStep {...defaultProps} isFirst={false} isLast={true} />);

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(document.activeElement).toBe(screen.getByTestId('tutorial-step-complete'));
    });
  });

  describe('accessibility', () => {
    it('has role="dialog"', () => {
      render(<TutorialStep {...defaultProps} />);

      expect(screen.getByTestId('tutorial-step')).toHaveAttribute('role', 'dialog');
    });

    it('has aria-modal="true"', () => {
      render(<TutorialStep {...defaultProps} />);

      expect(screen.getByTestId('tutorial-step')).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-labelledby pointing to title', () => {
      render(<TutorialStep {...defaultProps} />);

      expect(screen.getByTestId('tutorial-step')).toHaveAttribute(
        'aria-labelledby',
        'tutorial-step-title'
      );
    });

    it('has aria-describedby pointing to description', () => {
      render(<TutorialStep {...defaultProps} />);

      expect(screen.getByTestId('tutorial-step')).toHaveAttribute(
        'aria-describedby',
        'tutorial-step-description'
      );
    });

    it('skip button has aria-label', () => {
      render(<TutorialStep {...defaultProps} />);

      expect(screen.getByTestId('tutorial-step-skip')).toHaveAttribute(
        'aria-label',
        'Skip tutorial'
      );
    });

    it('step counter has aria-label', () => {
      render(<TutorialStep {...defaultProps} />);

      expect(screen.getByText('1 / 7').closest('span')).toHaveAttribute(
        'aria-label',
        'Step 1 of 7'
      );
    });
  });

  describe('positioning', () => {
    it('applies center position class for overlay steps', () => {
      render(<TutorialStep {...defaultProps} />);

      expect(screen.getByTestId('tutorial-step')).toHaveAttribute('data-position', 'center');
    });

    it('renders with highlight selector positioning', () => {
      const stepWithHighlight: TutorialStepType = {
        ...mockStep,
        isOverlayStep: false,
        highlightSelector: '[data-testid="test-element"]',
        tooltipPosition: 'right',
      };

      render(<TutorialStep {...defaultProps} step={stepWithHighlight} />);

      // Should attempt positioning relative to highlighted element
      // Since element doesn't exist, should fall back to center
      expect(screen.getByTestId('tutorial-step')).toBeInTheDocument();
    });
  });

  describe('arrow indicator', () => {
    it('does not render arrow for centered/overlay steps', () => {
      render(<TutorialStep {...defaultProps} />);

      // Arrow should not be rendered for overlay steps
      const step = screen.getByTestId('tutorial-step');
      expect(step.querySelector('.tutorial-step__arrow')).not.toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles step with empty title', () => {
      const stepWithEmptyTitle = { ...mockStep, title: '' };
      render(<TutorialStep {...defaultProps} step={stepWithEmptyTitle} />);

      expect(screen.getByTestId('tutorial-step-title')).toHaveTextContent('');
    });

    it('handles step with very long description', () => {
      const longText = 'A'.repeat(1000);
      const stepWithLongDesc = { ...mockStep, description: longText };
      render(<TutorialStep {...defaultProps} step={stepWithLongDesc} />);

      expect(screen.getByTestId('tutorial-step-description')).toHaveTextContent(longText);
    });

    it('handles rapid button clicks', () => {
      const onNext = vi.fn();
      render(<TutorialStep {...defaultProps} onNext={onNext} />);

      const button = screen.getByTestId('tutorial-step-next');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(onNext).toHaveBeenCalledTimes(3);
    });
  });
});
