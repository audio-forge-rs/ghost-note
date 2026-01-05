/**
 * RecordingTimer Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecordingTimer, formatDuration } from './RecordingTimer';

describe('RecordingTimer', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<RecordingTimer duration={0} />);

      expect(screen.getByTestId('recording-timer')).toBeInTheDocument();
      expect(screen.getByTestId('recording-time')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<RecordingTimer duration={0} className="custom-class" />);

      expect(screen.getByTestId('recording-timer')).toHaveClass('custom-class');
    });
  });

  describe('Duration formatting', () => {
    it('should display 0:00 for zero duration', () => {
      render(<RecordingTimer duration={0} />);

      expect(screen.getByTestId('recording-time')).toHaveTextContent('00:00');
    });

    it('should display seconds correctly', () => {
      render(<RecordingTimer duration={45} />);

      expect(screen.getByTestId('recording-time')).toHaveTextContent('00:45');
    });

    it('should display minutes and seconds correctly', () => {
      render(<RecordingTimer duration={125} />);

      expect(screen.getByTestId('recording-time')).toHaveTextContent('02:05');
    });

    it('should display hours correctly for long recordings', () => {
      render(<RecordingTimer duration={3725} />);

      expect(screen.getByTestId('recording-time')).toHaveTextContent('01:02:05');
    });
  });

  describe('Format options', () => {
    it('should use compact format by default', () => {
      render(<RecordingTimer duration={125} format="compact" />);

      expect(screen.getByTestId('recording-time')).toHaveTextContent('02:05');
    });

    it('should use full format when specified', () => {
      render(<RecordingTimer duration={125} format="full" />);

      expect(screen.getByTestId('recording-time')).toHaveTextContent('00:02:05');
    });

    it('should use minimal format when specified', () => {
      render(<RecordingTimer duration={65} format="minimal" />);

      expect(screen.getByTestId('recording-time')).toHaveTextContent('1:05');
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      render(<RecordingTimer duration={0} size="small" />);

      expect(screen.getByTestId('recording-timer')).toHaveClass('recording-timer--small');
    });

    it('should render medium size by default', () => {
      render(<RecordingTimer duration={0} />);

      expect(screen.getByTestId('recording-timer')).toHaveClass('recording-timer--medium');
    });

    it('should render large size', () => {
      render(<RecordingTimer duration={0} size="large" />);

      expect(screen.getByTestId('recording-timer')).toHaveClass('recording-timer--large');
    });
  });

  describe('States', () => {
    it('should apply running state class', () => {
      render(<RecordingTimer duration={0} isRunning />);

      expect(screen.getByTestId('recording-timer')).toHaveClass('recording-timer--running');
      expect(screen.getByTestId('recording-timer')).toHaveAttribute('data-running', 'true');
    });

    it('should apply paused state class', () => {
      render(<RecordingTimer duration={0} isPaused />);

      expect(screen.getByTestId('recording-timer')).toHaveClass('recording-timer--paused');
      expect(screen.getByTestId('recording-timer')).toHaveAttribute('data-paused', 'true');
    });

    it('should apply idle state class when not running or paused', () => {
      render(<RecordingTimer duration={0} />);

      expect(screen.getByTestId('recording-timer')).toHaveClass('recording-timer--idle');
    });
  });

  describe('Indicator', () => {
    it('should show indicator when running', () => {
      render(<RecordingTimer duration={0} isRunning showIndicator />);

      expect(screen.getByTestId('recording-indicator')).toBeInTheDocument();
    });

    it('should show indicator when paused', () => {
      render(<RecordingTimer duration={0} isPaused showIndicator />);

      expect(screen.getByTestId('recording-indicator')).toBeInTheDocument();
    });

    it('should not show indicator when idle', () => {
      render(<RecordingTimer duration={0} showIndicator />);

      expect(screen.queryByTestId('recording-indicator')).not.toBeInTheDocument();
    });

    it('should not show indicator when showIndicator is false', () => {
      render(<RecordingTimer duration={0} isRunning showIndicator={false} />);

      expect(screen.queryByTestId('recording-indicator')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have timer role', () => {
      render(<RecordingTimer duration={0} />);

      expect(screen.getByRole('timer')).toBeInTheDocument();
    });

    it('should have appropriate aria-label for running state', () => {
      render(<RecordingTimer duration={65} isRunning />);

      expect(screen.getByRole('timer')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Recording')
      );
    });

    it('should have appropriate aria-label for paused state', () => {
      render(<RecordingTimer duration={65} isPaused />);

      expect(screen.getByRole('timer')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('paused')
      );
    });

    it('should accept custom aria-label', () => {
      render(<RecordingTimer duration={0} aria-label="Custom timer" />);

      expect(screen.getByRole('timer')).toHaveAttribute('aria-label', 'Custom timer');
    });
  });
});

describe('formatDuration', () => {
  it('should format zero correctly', () => {
    expect(formatDuration(0, 'compact')).toBe('00:00');
    expect(formatDuration(0, 'full')).toBe('00:00:00');
    expect(formatDuration(0, 'minimal')).toBe('0:00');
  });

  it('should format seconds only', () => {
    expect(formatDuration(45, 'compact')).toBe('00:45');
    expect(formatDuration(45, 'full')).toBe('00:00:45');
    expect(formatDuration(45, 'minimal')).toBe('0:45');
  });

  it('should format minutes and seconds', () => {
    expect(formatDuration(125, 'compact')).toBe('02:05');
    expect(formatDuration(125, 'full')).toBe('00:02:05');
    expect(formatDuration(125, 'minimal')).toBe('2:05');
  });

  it('should format hours', () => {
    expect(formatDuration(3725, 'compact')).toBe('01:02:05');
    expect(formatDuration(3725, 'full')).toBe('01:02:05');
    expect(formatDuration(3725, 'minimal')).toBe('1:02:05');
  });

  it('should handle large durations', () => {
    expect(formatDuration(36125, 'compact')).toBe('10:02:05');
  });
});
