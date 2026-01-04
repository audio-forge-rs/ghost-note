/**
 * Tests for LoopSelector Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { LoopSelector, type LoopSelectorProps } from './LoopSelector';

describe('LoopSelector', () => {
  const defaultProps: LoopSelectorProps = {
    loopEnabled: false,
    onLoopEnabledChange: vi.fn(),
    duration: 120,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders loop selector', () => {
      render(<LoopSelector {...defaultProps} />);

      expect(screen.getByTestId('loop-selector')).toBeInTheDocument();
    });

    it('renders toggle button', () => {
      render(<LoopSelector {...defaultProps} />);

      expect(screen.getByTestId('loop-selector-toggle')).toBeInTheDocument();
    });

    it('shows "Off" when loop disabled', () => {
      render(<LoopSelector {...defaultProps} loopEnabled={false} />);

      expect(screen.getByTestId('loop-selector-toggle')).toHaveTextContent('Off');
    });

    it('shows "On" when loop enabled', () => {
      render(<LoopSelector {...defaultProps} loopEnabled={true} />);

      expect(screen.getByTestId('loop-selector-toggle')).toHaveTextContent('On');
    });

    it('renders loop bar by default', () => {
      render(<LoopSelector {...defaultProps} />);

      expect(screen.getByTestId('loop-selector-bar')).toBeInTheDocument();
    });

    it('hides loop bar when showLoopBar is false', () => {
      render(<LoopSelector {...defaultProps} showLoopBar={false} />);

      expect(screen.queryByTestId('loop-selector-bar')).not.toBeInTheDocument();
    });
  });

  describe('toggle behavior', () => {
    it('calls onLoopEnabledChange when toggle clicked', () => {
      const onLoopEnabledChange = vi.fn();
      render(<LoopSelector {...defaultProps} loopEnabled={false} onLoopEnabledChange={onLoopEnabledChange} />);

      fireEvent.click(screen.getByTestId('loop-selector-toggle'));

      expect(onLoopEnabledChange).toHaveBeenCalledWith(true);
    });

    it('toggles to false when already enabled', () => {
      const onLoopEnabledChange = vi.fn();
      render(<LoopSelector {...defaultProps} loopEnabled={true} onLoopEnabledChange={onLoopEnabledChange} />);

      fireEvent.click(screen.getByTestId('loop-selector-toggle'));

      expect(onLoopEnabledChange).toHaveBeenCalledWith(false);
    });

    it('is disabled when disabled prop is true', () => {
      render(<LoopSelector {...defaultProps} disabled />);

      expect(screen.getByTestId('loop-selector-toggle')).toBeDisabled();
    });
  });

  describe('loop controls visibility', () => {
    it('shows loop controls when loop is enabled', () => {
      render(<LoopSelector {...defaultProps} loopEnabled={true} />);

      expect(screen.getByTestId('loop-selector-set-start')).toBeInTheDocument();
      expect(screen.getByTestId('loop-selector-set-end')).toBeInTheDocument();
      expect(screen.getByTestId('loop-selector-loop-all')).toBeInTheDocument();
      expect(screen.getByTestId('loop-selector-clear')).toBeInTheDocument();
    });

    it('hides loop controls when loop is disabled', () => {
      render(<LoopSelector {...defaultProps} loopEnabled={false} />);

      expect(screen.queryByTestId('loop-selector-set-start')).not.toBeInTheDocument();
      expect(screen.queryByTestId('loop-selector-set-end')).not.toBeInTheDocument();
    });
  });

  describe('set start/end buttons', () => {
    it('calls onLoopRegionChange with current time as start', () => {
      const onLoopRegionChange = vi.fn();
      render(
        <LoopSelector
          {...defaultProps}
          loopEnabled={true}
          currentTime={30}
          loopRegion={{ start: 0, end: 120 }}
          onLoopRegionChange={onLoopRegionChange}
        />
      );

      fireEvent.click(screen.getByTestId('loop-selector-set-start'));

      expect(onLoopRegionChange).toHaveBeenCalledWith({ start: 30, end: 120 });
    });

    it('calls onLoopRegionChange with current time as end', () => {
      const onLoopRegionChange = vi.fn();
      render(
        <LoopSelector
          {...defaultProps}
          loopEnabled={true}
          currentTime={90}
          loopRegion={{ start: 0, end: 120 }}
          onLoopRegionChange={onLoopRegionChange}
        />
      );

      fireEvent.click(screen.getByTestId('loop-selector-set-end'));

      expect(onLoopRegionChange).toHaveBeenCalledWith({ start: 0, end: 90 });
    });
  });

  describe('loop all button', () => {
    it('sets loop region to entire duration', () => {
      const onLoopRegionChange = vi.fn();
      render(
        <LoopSelector
          {...defaultProps}
          loopEnabled={true}
          duration={180}
          onLoopRegionChange={onLoopRegionChange}
        />
      );

      fireEvent.click(screen.getByTestId('loop-selector-loop-all'));

      expect(onLoopRegionChange).toHaveBeenCalledWith({ start: 0, end: 180 });
    });
  });

  describe('clear button', () => {
    it('clears loop region', () => {
      const onLoopRegionChange = vi.fn();
      render(
        <LoopSelector
          {...defaultProps}
          loopEnabled={true}
          loopRegion={{ start: 30, end: 90 }}
          onLoopRegionChange={onLoopRegionChange}
        />
      );

      fireEvent.click(screen.getByTestId('loop-selector-clear'));

      expect(onLoopRegionChange).toHaveBeenCalledWith(null);
    });
  });

  describe('loop region display', () => {
    it('displays loop region times', () => {
      render(
        <LoopSelector
          {...defaultProps}
          loopEnabled={true}
          loopRegion={{ start: 30, end: 90 }}
        />
      );

      // The component should show 0:30 - 1:30 somewhere
      const container = screen.getByTestId('loop-selector');
      expect(container.textContent).toContain('0:30');
      expect(container.textContent).toContain('1:30');
    });

    it('shows loop region bar', () => {
      render(
        <LoopSelector
          {...defaultProps}
          loopEnabled={true}
          loopRegion={{ start: 30, end: 90 }}
        />
      );

      expect(screen.getByTestId('loop-selector-region')).toBeInTheDocument();
    });

    it('shows current position indicator', () => {
      render(
        <LoopSelector
          {...defaultProps}
          loopEnabled={true}
          currentTime={60}
        />
      );

      expect(screen.getByTestId('loop-selector-position')).toBeInTheDocument();
    });
  });

  describe('time input mode', () => {
    it('allows editing start time', () => {
      render(
        <LoopSelector
          {...defaultProps}
          loopEnabled={true}
          mode="time"
          loopRegion={{ start: 0, end: 120 }}
        />
      );

      // Click the start display to enter edit mode
      const startDisplay = screen.getByTestId('loop-selector-start-display');
      fireEvent.click(startDisplay);

      // Should show input
      expect(screen.getByTestId('loop-selector-start-input')).toBeInTheDocument();
    });

    it('allows editing end time', () => {
      render(
        <LoopSelector
          {...defaultProps}
          loopEnabled={true}
          mode="time"
          loopRegion={{ start: 0, end: 120 }}
        />
      );

      // Click the end display to enter edit mode
      const endDisplay = screen.getByTestId('loop-selector-end-display');
      fireEvent.click(endDisplay);

      // Should show input
      expect(screen.getByTestId('loop-selector-end-input')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has accessible toggle button', () => {
      render(<LoopSelector {...defaultProps} loopEnabled={false} />);

      const toggle = screen.getByTestId('loop-selector-toggle');
      expect(toggle).toHaveAttribute('aria-pressed', 'false');
      expect(toggle).toHaveAttribute('aria-label', 'Enable loop');
    });

    it('has accessible loop bar', () => {
      render(
        <LoopSelector
          {...defaultProps}
          loopEnabled={true}
          loopRegion={{ start: 30, end: 90 }}
        />
      );

      const bar = screen.getByTestId('loop-selector-bar');
      expect(bar).toHaveAttribute('role', 'img');
      expect(bar).toHaveAttribute('aria-label');
    });
  });

  describe('disabled state', () => {
    it('disables all controls when disabled', () => {
      render(
        <LoopSelector
          {...defaultProps}
          loopEnabled={true}
          disabled
        />
      );

      expect(screen.getByTestId('loop-selector-toggle')).toBeDisabled();
      expect(screen.getByTestId('loop-selector-set-start')).toBeDisabled();
      expect(screen.getByTestId('loop-selector-set-end')).toBeDisabled();
      expect(screen.getByTestId('loop-selector-loop-all')).toBeDisabled();
      expect(screen.getByTestId('loop-selector-clear')).toBeDisabled();
    });
  });
});
