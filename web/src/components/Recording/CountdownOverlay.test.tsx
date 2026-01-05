/**
 * CountdownOverlay Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CountdownOverlay } from './CountdownOverlay';

describe('CountdownOverlay', () => {
  let rafCallbacks: FrameRequestCallback[] = [];
  let rafId = 0;

  beforeEach(() => {
    vi.useFakeTimers();

    // Mock requestAnimationFrame to work with fake timers
    rafCallbacks = [];
    rafId = 0;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      rafCallbacks.push(callback);
      return ++rafId;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {
      // No-op for tests
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  // Helper to flush requestAnimationFrame callbacks
  const flushRaf = () => {
    const callbacks = [...rafCallbacks];
    rafCallbacks = [];
    callbacks.forEach(cb => cb(performance.now()));
  };

  describe('Rendering', () => {
    it('should not render when inactive', () => {
      render(<CountdownOverlay isActive={false} />);

      expect(screen.queryByTestId('countdown-overlay')).not.toBeInTheDocument();
    });

    it('should render when active', () => {
      render(<CountdownOverlay isActive />);

      expect(screen.getByTestId('countdown-overlay')).toBeInTheDocument();
    });

    it('should display starting number', () => {
      render(<CountdownOverlay isActive startFrom={3} />);

      expect(screen.getByTestId('countdown-count')).toHaveTextContent('3');
    });

    it('should display custom starting number', () => {
      render(<CountdownOverlay isActive startFrom={5} />);

      expect(screen.getByTestId('countdown-count')).toHaveTextContent('5');
    });

    it('should display custom message', () => {
      render(<CountdownOverlay isActive message="Get ready!" />);

      expect(screen.getByText('Get ready!')).toBeInTheDocument();
    });
  });

  describe('Countdown behavior', () => {
    it('should count down each second', () => {
      render(<CountdownOverlay isActive startFrom={3} intervalMs={1000} />);

      expect(screen.getByTestId('countdown-count')).toHaveTextContent('3');

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByTestId('countdown-count')).toHaveTextContent('2');

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByTestId('countdown-count')).toHaveTextContent('1');
    });

    it('should call onComplete when countdown finishes', () => {
      const handleComplete = vi.fn();
      render(
        <CountdownOverlay
          isActive
          startFrom={2}
          intervalMs={1000}
          onComplete={handleComplete}
        />
      );

      // Flush RAF for initial setup
      act(() => {
        flushRaf();
      });

      // Advance through countdown
      act(() => {
        vi.advanceTimersByTime(2500);
        flushRaf();
      });

      // Flush the setTimeout from onComplete
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(handleComplete).toHaveBeenCalled();
    });

    it('should not call onComplete if cancelled', () => {
      const handleComplete = vi.fn();
      const handleCancel = vi.fn();
      const { rerender } = render(
        <CountdownOverlay
          isActive
          startFrom={3}
          intervalMs={1000}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Deactivate the overlay
      rerender(
        <CountdownOverlay
          isActive={false}
          startFrom={3}
          intervalMs={1000}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      );

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(handleComplete).not.toHaveBeenCalled();
    });

    it('should reset countdown when reactivated', () => {
      const { rerender } = render(
        <CountdownOverlay isActive startFrom={3} intervalMs={1000} />
      );

      act(() => {
        flushRaf();
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByTestId('countdown-count')).toHaveTextContent('1');

      // Deactivate
      rerender(<CountdownOverlay isActive={false} startFrom={3} intervalMs={1000} />);

      // Reactivate
      rerender(<CountdownOverlay isActive startFrom={3} intervalMs={1000} />);

      // Flush raf for the reset
      act(() => {
        flushRaf();
      });

      expect(screen.getByTestId('countdown-count')).toHaveTextContent('3');
    });
  });

  describe('Cancel button', () => {
    it('should show cancel button by default', () => {
      render(<CountdownOverlay isActive />);

      expect(screen.getByTestId('countdown-cancel')).toBeInTheDocument();
    });

    it('should hide cancel button when showCancelButton is false', () => {
      render(<CountdownOverlay isActive showCancelButton={false} />);

      expect(screen.queryByTestId('countdown-cancel')).not.toBeInTheDocument();
    });

    it('should call onCancel when cancel button is clicked', () => {
      const handleCancel = vi.fn();
      render(<CountdownOverlay isActive onCancel={handleCancel} />);

      fireEvent.click(screen.getByTestId('countdown-cancel'));

      expect(handleCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keyboard interaction', () => {
    it('should call onCancel when Escape is pressed', () => {
      const handleCancel = vi.fn();
      render(<CountdownOverlay isActive onCancel={handleCancel} />);

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it('should not call onCancel for other keys', () => {
      const handleCancel = vi.fn();
      render(<CountdownOverlay isActive onCancel={handleCancel} />);

      fireEvent.keyDown(window, { key: 'Enter' });

      expect(handleCancel).not.toHaveBeenCalled();
    });

    it('should not respond to Escape when inactive', () => {
      const handleCancel = vi.fn();
      render(<CountdownOverlay isActive={false} onCancel={handleCancel} />);

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(handleCancel).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have alertdialog role', () => {
      render(<CountdownOverlay isActive />);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('should have aria-modal attribute', () => {
      render(<CountdownOverlay isActive />);

      expect(screen.getByRole('alertdialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-label with countdown', () => {
      render(<CountdownOverlay isActive startFrom={3} />);

      expect(screen.getByRole('alertdialog')).toHaveAttribute(
        'aria-label',
        'Recording countdown: 3'
      );
    });

    it('should update aria-label as countdown progresses', () => {
      render(<CountdownOverlay isActive startFrom={3} intervalMs={1000} />);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByRole('alertdialog')).toHaveAttribute(
        'aria-label',
        'Recording countdown: 2'
      );
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      render(<CountdownOverlay isActive className="custom-overlay" />);

      expect(screen.getByTestId('countdown-overlay')).toHaveClass('custom-overlay');
    });
  });
});
