/**
 * TakeItem Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TakeItem } from './TakeItem';
import type { RecordingTake } from '@/stores/types';

describe('TakeItem', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock requestAnimationFrame to execute synchronously for testing
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(performance.now());
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const mockTake: RecordingTake = {
    id: 'take-123',
    blobUrl: 'blob:http://localhost/test',
    duration: 125,
    timestamp: Date.now() - 3600000, // 1 hour ago
    name: 'Test Take',
  };

  const mockTakeWithoutName: RecordingTake = {
    id: 'take-456',
    blobUrl: 'blob:http://localhost/test2',
    duration: 65,
    timestamp: Date.now(),
  };

  describe('Rendering', () => {
    it('should render take with name', () => {
      render(<TakeItem take={mockTake} />);

      expect(screen.getByTestId('take-item')).toBeInTheDocument();
      expect(screen.getByTestId('take-name')).toHaveTextContent('Test Take');
    });

    it('should render take without name using ID', () => {
      render(<TakeItem take={mockTakeWithoutName} />);

      expect(screen.getByTestId('take-name')).toHaveTextContent('Take');
    });

    it('should display duration correctly', () => {
      render(<TakeItem take={mockTake} />);

      expect(screen.getByTestId('take-duration')).toHaveTextContent('2:05');
    });

    it('should display timestamp', () => {
      render(<TakeItem take={mockTake} />);

      expect(screen.getByTestId('take-timestamp')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<TakeItem take={mockTake} className="custom-take" />);

      expect(screen.getByTestId('take-item')).toHaveClass('custom-take');
    });
  });

  describe('Selection', () => {
    it('should show selected state', () => {
      render(<TakeItem take={mockTake} isSelected />);

      expect(screen.getByTestId('take-item')).toHaveClass('take-item--selected');
      expect(screen.getByTestId('take-item')).toHaveAttribute('aria-selected', 'true');
    });

    it('should call onSelect when clicked', () => {
      const handleSelect = vi.fn();
      render(<TakeItem take={mockTake} onSelect={handleSelect} />);

      fireEvent.click(screen.getByTestId('take-item'));

      expect(handleSelect).toHaveBeenCalledWith('take-123');
    });
  });

  describe('Playback', () => {
    it('should show playing state', () => {
      render(<TakeItem take={mockTake} isPlaying />);

      expect(screen.getByTestId('take-item')).toHaveClass('take-item--playing');
    });

    it('should call onPlayPause when play button clicked', () => {
      const handlePlayPause = vi.fn();
      render(<TakeItem take={mockTake} onPlayPause={handlePlayPause} />);

      fireEvent.click(screen.getByTestId('take-play-button'));

      expect(handlePlayPause).toHaveBeenCalledWith('take-123');
    });

    it('should show pause icon when playing', () => {
      render(<TakeItem take={mockTake} isPlaying />);

      const button = screen.getByTestId('take-play-button');
      expect(button).toHaveAttribute('aria-label', 'Pause');
    });

    it('should show play icon when not playing', () => {
      render(<TakeItem take={mockTake} isPlaying={false} />);

      const button = screen.getByTestId('take-play-button');
      expect(button).toHaveAttribute('aria-label', 'Play');
    });
  });

  describe('Rename', () => {
    it('should show rename button when canRename is true', () => {
      render(<TakeItem take={mockTake} canRename />);

      expect(screen.getByTestId('take-rename-button')).toBeInTheDocument();
    });

    it('should hide rename button when canRename is false', () => {
      render(<TakeItem take={mockTake} canRename={false} />);

      expect(screen.queryByTestId('take-rename-button')).not.toBeInTheDocument();
    });

    it('should enter edit mode when rename button clicked', () => {
      render(<TakeItem take={mockTake} canRename />);

      fireEvent.click(screen.getByTestId('take-rename-button'));

      expect(screen.getByTestId('take-name-input')).toBeInTheDocument();
    });

    it('should enter edit mode on double-click', () => {
      render(<TakeItem take={mockTake} canRename />);

      fireEvent.doubleClick(screen.getByTestId('take-name'));

      expect(screen.getByTestId('take-name-input')).toBeInTheDocument();
    });

    it('should call onRename when edit is saved', () => {
      const handleRename = vi.fn();
      render(<TakeItem take={mockTake} canRename onRename={handleRename} />);

      fireEvent.click(screen.getByTestId('take-rename-button'));

      const input = screen.getByTestId('take-name-input');
      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.blur(input);

      expect(handleRename).toHaveBeenCalledWith('take-123', 'New Name');
    });

    it('should save on Enter key', () => {
      const handleRename = vi.fn();
      render(<TakeItem take={mockTake} canRename onRename={handleRename} />);

      fireEvent.click(screen.getByTestId('take-rename-button'));

      const input = screen.getByTestId('take-name-input');
      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(handleRename).toHaveBeenCalledWith('take-123', 'New Name');
    });

    it('should cancel on Escape key', () => {
      const handleRename = vi.fn();
      render(<TakeItem take={mockTake} canRename onRename={handleRename} />);

      fireEvent.click(screen.getByTestId('take-rename-button'));

      const input = screen.getByTestId('take-name-input');
      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(handleRename).not.toHaveBeenCalled();
      expect(screen.getByTestId('take-name')).toHaveTextContent('Test Take');
    });
  });

  describe('Delete', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should show delete button when canDelete is true', () => {
      render(<TakeItem take={mockTake} canDelete />);

      expect(screen.getByTestId('take-delete-button')).toBeInTheDocument();
    });

    it('should hide delete button when canDelete is false', () => {
      render(<TakeItem take={mockTake} canDelete={false} />);

      expect(screen.queryByTestId('take-delete-button')).not.toBeInTheDocument();
    });

    it('should require confirmation before deleting', () => {
      const handleDelete = vi.fn();
      render(<TakeItem take={mockTake} canDelete onDelete={handleDelete} />);

      fireEvent.click(screen.getByTestId('take-delete-button'));

      // First click should show confirm state
      expect(handleDelete).not.toHaveBeenCalled();
      expect(screen.getByTestId('take-delete-button')).toHaveAttribute(
        'aria-label',
        'Confirm delete'
      );
    });

    it('should delete on second click', () => {
      const handleDelete = vi.fn();
      render(<TakeItem take={mockTake} canDelete onDelete={handleDelete} />);

      fireEvent.click(screen.getByTestId('take-delete-button'));
      fireEvent.click(screen.getByTestId('take-delete-button'));

      expect(handleDelete).toHaveBeenCalledWith('take-123');
    });

    it('should reset confirm state after timeout', () => {
      render(<TakeItem take={mockTake} canDelete />);

      fireEvent.click(screen.getByTestId('take-delete-button'));

      expect(screen.getByTestId('take-delete-button')).toHaveAttribute(
        'aria-label',
        'Confirm delete'
      );

      // Use act to properly flush timers - synchronous
      act(() => {
        vi.advanceTimersByTime(4000);
      });

      expect(screen.getByTestId('take-delete-button')).toHaveAttribute(
        'aria-label',
        'Delete'
      );
    });
  });

  describe('Accessibility', () => {
    it('should have listitem role', () => {
      render(<TakeItem take={mockTake} />);

      expect(screen.getByRole('listitem')).toBeInTheDocument();
    });

    it('should have data-take-id attribute', () => {
      render(<TakeItem take={mockTake} />);

      expect(screen.getByTestId('take-item')).toHaveAttribute('data-take-id', 'take-123');
    });
  });

  describe('Event propagation', () => {
    it('should not select when play button is clicked', () => {
      const handleSelect = vi.fn();
      const handlePlayPause = vi.fn();
      render(
        <TakeItem
          take={mockTake}
          onSelect={handleSelect}
          onPlayPause={handlePlayPause}
        />
      );

      fireEvent.click(screen.getByTestId('take-play-button'));

      expect(handlePlayPause).toHaveBeenCalled();
      expect(handleSelect).not.toHaveBeenCalled();
    });

    it('should not select when delete button is clicked', () => {
      const handleSelect = vi.fn();
      const handleDelete = vi.fn();
      render(
        <TakeItem take={mockTake} onSelect={handleSelect} onDelete={handleDelete} canDelete />
      );

      fireEvent.click(screen.getByTestId('take-delete-button'));

      expect(handleSelect).not.toHaveBeenCalled();
    });
  });
});
