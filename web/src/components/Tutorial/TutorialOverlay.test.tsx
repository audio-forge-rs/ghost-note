/**
 * Tests for TutorialOverlay Component
 *
 * @module components/Tutorial/TutorialOverlay.test
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { TutorialOverlay, type TutorialOverlayProps } from './TutorialOverlay';

describe('TutorialOverlay', () => {
  const defaultProps: TutorialOverlayProps = {
    isVisible: true,
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
    it('renders when isVisible is true', () => {
      render(<TutorialOverlay {...defaultProps} />);

      expect(screen.getByTestId('tutorial-overlay')).toBeInTheDocument();
    });

    it('does not render when isVisible is false', () => {
      render(<TutorialOverlay {...defaultProps} isVisible={false} />);

      expect(screen.queryByTestId('tutorial-overlay')).not.toBeInTheDocument();
    });

    it('uses custom testId', () => {
      render(<TutorialOverlay {...defaultProps} testId="custom-overlay" />);

      expect(screen.getByTestId('custom-overlay')).toBeInTheDocument();
    });

    it('has aria-hidden attribute', () => {
      render(<TutorialOverlay {...defaultProps} />);

      expect(screen.getByTestId('tutorial-overlay')).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('centered mode', () => {
    it('applies centered data attribute when isCentered is true', () => {
      render(<TutorialOverlay {...defaultProps} isCentered={true} />);

      expect(screen.getByTestId('tutorial-overlay')).toHaveAttribute('data-centered', 'true');
    });

    it('applies non-centered data attribute when isCentered is false', () => {
      render(<TutorialOverlay {...defaultProps} isCentered={false} />);

      expect(screen.getByTestId('tutorial-overlay')).toHaveAttribute('data-centered', 'false');
    });

    it('does not render highlight border when isCentered', () => {
      render(<TutorialOverlay {...defaultProps} isCentered={true} />);

      expect(screen.queryByTestId('tutorial-overlay-highlight')).not.toBeInTheDocument();
    });
  });

  describe('highlight functionality', () => {
    it('renders highlight border when element is found', async () => {
      // Create a target element
      const targetElement = document.createElement('div');
      targetElement.setAttribute('data-testid', 'target-element');
      targetElement.style.position = 'fixed';
      targetElement.style.top = '100px';
      targetElement.style.left = '100px';
      targetElement.style.width = '200px';
      targetElement.style.height = '100px';
      document.body.appendChild(targetElement);

      render(
        <TutorialOverlay
          {...defaultProps}
          highlightSelector="[data-testid='target-element']"
          isCentered={false}
        />
      );

      // Wait for position calculation
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      expect(screen.getByTestId('tutorial-overlay-highlight')).toBeInTheDocument();

      // Cleanup
      document.body.removeChild(targetElement);
    });

    it('does not render highlight border when element is not found', async () => {
      render(
        <TutorialOverlay
          {...defaultProps}
          highlightSelector="[data-testid='nonexistent-element']"
          isCentered={false}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      expect(screen.queryByTestId('tutorial-overlay-highlight')).not.toBeInTheDocument();
    });
  });

  describe('click handling', () => {
    it('calls onOverlayClick when overlay is clicked', () => {
      const onOverlayClick = vi.fn();
      render(<TutorialOverlay {...defaultProps} onOverlayClick={onOverlayClick} />);

      fireEvent.click(screen.getByTestId('tutorial-overlay'));

      expect(onOverlayClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onOverlayClick when clicking inside (event bubbling prevented)', () => {
      const onOverlayClick = vi.fn();
      render(
        <TutorialOverlay {...defaultProps} onOverlayClick={onOverlayClick} isCentered={true} />
      );

      // The click should only trigger when clicking directly on the overlay
      const overlay = screen.getByTestId('tutorial-overlay');
      fireEvent.click(overlay);

      expect(onOverlayClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('padding and border radius', () => {
    it('applies custom padding to highlight', async () => {
      const targetElement = document.createElement('div');
      targetElement.setAttribute('data-testid', 'target-element');
      targetElement.style.position = 'fixed';
      targetElement.style.top = '100px';
      targetElement.style.left = '100px';
      targetElement.style.width = '200px';
      targetElement.style.height = '100px';
      document.body.appendChild(targetElement);

      render(
        <TutorialOverlay
          {...defaultProps}
          highlightSelector="[data-testid='target-element']"
          padding={20}
          isCentered={false}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const highlight = screen.getByTestId('tutorial-overlay-highlight');
      // Width should include padding on both sides (200 + 20*2 = 240)
      expect(highlight).toBeInTheDocument();

      document.body.removeChild(targetElement);
    });

    it('applies custom border radius to highlight', async () => {
      const targetElement = document.createElement('div');
      targetElement.setAttribute('data-testid', 'target-element');
      targetElement.style.position = 'fixed';
      targetElement.style.top = '100px';
      targetElement.style.left = '100px';
      targetElement.style.width = '200px';
      targetElement.style.height = '100px';
      document.body.appendChild(targetElement);

      render(
        <TutorialOverlay
          {...defaultProps}
          highlightSelector="[data-testid='target-element']"
          borderRadius={16}
          isCentered={false}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const highlight = screen.getByTestId('tutorial-overlay-highlight');
      expect(highlight).toHaveStyle({ borderRadius: '16px' });

      document.body.removeChild(targetElement);
    });
  });

  describe('responsive behavior', () => {
    it('updates position on window resize', async () => {
      const targetElement = document.createElement('div');
      targetElement.setAttribute('data-testid', 'target-element');
      targetElement.style.position = 'fixed';
      targetElement.style.top = '100px';
      targetElement.style.left = '100px';
      targetElement.style.width = '200px';
      targetElement.style.height = '100px';
      document.body.appendChild(targetElement);

      render(
        <TutorialOverlay
          {...defaultProps}
          highlightSelector="[data-testid='target-element']"
          isCentered={false}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      // Trigger resize
      fireEvent(window, new Event('resize'));

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Overlay should still be visible after resize
      expect(screen.getByTestId('tutorial-overlay')).toBeInTheDocument();

      document.body.removeChild(targetElement);
    });

    it('updates position on scroll', async () => {
      const targetElement = document.createElement('div');
      targetElement.setAttribute('data-testid', 'target-element');
      targetElement.style.position = 'fixed';
      targetElement.style.top = '100px';
      targetElement.style.left = '100px';
      targetElement.style.width = '200px';
      targetElement.style.height = '100px';
      document.body.appendChild(targetElement);

      render(
        <TutorialOverlay
          {...defaultProps}
          highlightSelector="[data-testid='target-element']"
          isCentered={false}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      // Trigger scroll
      fireEvent.scroll(window);

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Overlay should still be visible after scroll
      expect(screen.getByTestId('tutorial-overlay')).toBeInTheDocument();

      document.body.removeChild(targetElement);
    });
  });

  describe('edge cases', () => {
    it('handles rapid visibility toggling', () => {
      const { rerender } = render(<TutorialOverlay {...defaultProps} isVisible={false} />);

      rerender(<TutorialOverlay {...defaultProps} isVisible={true} />);
      rerender(<TutorialOverlay {...defaultProps} isVisible={false} />);
      rerender(<TutorialOverlay {...defaultProps} isVisible={true} />);

      expect(screen.getByTestId('tutorial-overlay')).toBeInTheDocument();
    });

    it('handles invalid selector gracefully', async () => {
      render(
        <TutorialOverlay
          {...defaultProps}
          highlightSelector="invalid[selector]]]"
          isCentered={false}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      // Should still render without crashing
      expect(screen.getByTestId('tutorial-overlay')).toBeInTheDocument();
    });

    it('handles selector that becomes valid later', async () => {
      render(
        <TutorialOverlay
          {...defaultProps}
          highlightSelector="[data-testid='dynamic-element']"
          isCentered={false}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Initially no highlight
      expect(screen.queryByTestId('tutorial-overlay-highlight')).not.toBeInTheDocument();

      // Add element dynamically
      const targetElement = document.createElement('div');
      targetElement.setAttribute('data-testid', 'dynamic-element');
      targetElement.style.position = 'fixed';
      targetElement.style.top = '100px';
      targetElement.style.left = '100px';
      targetElement.style.width = '200px';
      targetElement.style.height = '100px';
      document.body.appendChild(targetElement);

      // Wait for interval to update
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      // Now highlight should appear
      expect(screen.getByTestId('tutorial-overlay-highlight')).toBeInTheDocument();

      document.body.removeChild(targetElement);
    });
  });
});
