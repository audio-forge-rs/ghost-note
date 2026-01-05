/**
 * TakesList Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TakesList } from './TakesList';
import type { RecordingTake } from '@/stores/types';

describe('TakesList', () => {
  const mockTakes: RecordingTake[] = [
    {
      id: 'take-1',
      blobUrl: 'blob:http://localhost/test1',
      duration: 120,
      timestamp: Date.now() - 3600000, // 1 hour ago
      name: 'First Take',
    },
    {
      id: 'take-2',
      blobUrl: 'blob:http://localhost/test2',
      duration: 60,
      timestamp: Date.now() - 1800000, // 30 minutes ago
      name: 'Second Take',
    },
    {
      id: 'take-3',
      blobUrl: 'blob:http://localhost/test3',
      duration: 180,
      timestamp: Date.now(), // Now
      name: 'Third Take',
    },
  ];

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

  describe('Rendering', () => {
    it('should render takes list', () => {
      render(<TakesList takes={mockTakes} />);

      expect(screen.getByTestId('takes-list')).toBeInTheDocument();
      expect(screen.getByTestId('takes-items')).toBeInTheDocument();
    });

    it('should render all takes', () => {
      render(<TakesList takes={mockTakes} />);

      expect(screen.getAllByTestId('take-item')).toHaveLength(3);
    });

    it('should display take count', () => {
      render(<TakesList takes={mockTakes} />);

      expect(screen.getByTestId('takes-count')).toHaveTextContent('3 takes');
    });

    it('should display singular "take" for single item', () => {
      render(<TakesList takes={[mockTakes[0]]} />);

      expect(screen.getByTestId('takes-count')).toHaveTextContent('1 take');
    });

    it('should display total duration', () => {
      render(<TakesList takes={mockTakes} />);

      // 120 + 60 + 180 = 360 seconds = 6 minutes
      expect(screen.getByTestId('takes-total-duration')).toHaveTextContent('6m 0s total');
    });

    it('should apply custom className', () => {
      render(<TakesList takes={mockTakes} className="custom-list" />);

      expect(screen.getByTestId('takes-list')).toHaveClass('custom-list');
    });
  });

  describe('Empty state', () => {
    it('should show empty state when no takes', () => {
      render(<TakesList takes={[]} />);

      expect(screen.getByTestId('takes-empty')).toBeInTheDocument();
    });

    it('should show custom empty message', () => {
      render(<TakesList takes={[]} emptyMessage="No recordings found" />);

      expect(screen.getByText('No recordings found')).toBeInTheDocument();
    });

    it('should not show sort dropdown when empty', () => {
      render(<TakesList takes={[]} />);

      expect(screen.queryByTestId('takes-sort')).not.toBeInTheDocument();
    });
  });

  describe('Header', () => {
    it('should show header by default', () => {
      render(<TakesList takes={mockTakes} />);

      expect(screen.getByTestId('takes-count')).toBeInTheDocument();
    });

    it('should hide header when showHeader is false', () => {
      render(<TakesList takes={mockTakes} showHeader={false} />);

      expect(screen.queryByTestId('takes-count')).not.toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should show sort dropdown with multiple takes', () => {
      render(<TakesList takes={mockTakes} />);

      expect(screen.getByTestId('takes-sort')).toBeInTheDocument();
    });

    it('should not show sort dropdown with single take', () => {
      render(<TakesList takes={[mockTakes[0]]} />);

      expect(screen.queryByTestId('takes-sort')).not.toBeInTheDocument();
    });

    it('should call onSortChange when sort option changes', () => {
      const handleSortChange = vi.fn();
      render(<TakesList takes={mockTakes} onSortChange={handleSortChange} />);

      fireEvent.change(screen.getByTestId('takes-sort'), { target: { value: 'oldest' } });

      expect(handleSortChange).toHaveBeenCalledWith('oldest');
    });

    it('should sort by newest first by default', () => {
      render(<TakesList takes={mockTakes} sortOrder="newest" />);

      const items = screen.getAllByTestId('take-item');
      // Third Take is newest
      expect(items[0]).toHaveAttribute('data-take-id', 'take-3');
    });

    it('should sort by oldest first', () => {
      render(<TakesList takes={mockTakes} sortOrder="oldest" />);

      const items = screen.getAllByTestId('take-item');
      // First Take is oldest
      expect(items[0]).toHaveAttribute('data-take-id', 'take-1');
    });

    it('should sort by longest first', () => {
      render(<TakesList takes={mockTakes} sortOrder="longest" />);

      const items = screen.getAllByTestId('take-item');
      // Third Take is longest (180s)
      expect(items[0]).toHaveAttribute('data-take-id', 'take-3');
    });

    it('should sort by shortest first', () => {
      render(<TakesList takes={mockTakes} sortOrder="shortest" />);

      const items = screen.getAllByTestId('take-item');
      // Second Take is shortest (60s)
      expect(items[0]).toHaveAttribute('data-take-id', 'take-2');
    });

    it('should sort by name', () => {
      render(<TakesList takes={mockTakes} sortOrder="name" />);

      const items = screen.getAllByTestId('take-item');
      // First Take comes first alphabetically
      expect(items[0]).toHaveAttribute('data-take-id', 'take-1');
    });
  });

  describe('Selection', () => {
    it('should mark selected take', () => {
      render(<TakesList takes={mockTakes} selectedTakeId="take-2" />);

      const items = screen.getAllByTestId('take-item');
      const selectedItem = items.find((item) => item.getAttribute('data-take-id') === 'take-2');

      expect(selectedItem).toHaveClass('take-item--selected');
    });

    it('should call onSelectTake when take is selected', () => {
      const handleSelect = vi.fn();
      render(<TakesList takes={mockTakes} onSelectTake={handleSelect} />);

      const items = screen.getAllByTestId('take-item');
      fireEvent.click(items[0]);

      expect(handleSelect).toHaveBeenCalled();
    });
  });

  describe('Playback', () => {
    it('should mark playing take', () => {
      render(<TakesList takes={mockTakes} playingTakeId="take-2" />);

      const items = screen.getAllByTestId('take-item');
      const playingItem = items.find((item) => item.getAttribute('data-take-id') === 'take-2');

      expect(playingItem).toHaveClass('take-item--playing');
    });

    it('should call onPlayPauseTake when play is clicked', () => {
      const handlePlayPause = vi.fn();
      render(<TakesList takes={mockTakes} onPlayPauseTake={handlePlayPause} />);

      const playButtons = screen.getAllByTestId('take-play-button');
      fireEvent.click(playButtons[0]);

      expect(handlePlayPause).toHaveBeenCalled();
    });
  });

  describe('Delete', () => {
    it('should call onDeleteTake when delete is confirmed', () => {
      const handleDelete = vi.fn();
      render(<TakesList takes={mockTakes} onDeleteTake={handleDelete} />);

      const deleteButtons = screen.getAllByTestId('take-delete-button');
      // Click twice to confirm
      fireEvent.click(deleteButtons[0]);
      fireEvent.click(deleteButtons[0]);

      expect(handleDelete).toHaveBeenCalled();
    });

    it('should hide delete buttons when not editable', () => {
      render(<TakesList takes={mockTakes} editable={false} />);

      expect(screen.queryByTestId('take-delete-button')).not.toBeInTheDocument();
    });
  });

  describe('Rename', () => {
    it('should hide rename buttons when not editable', () => {
      render(<TakesList takes={mockTakes} editable={false} />);

      expect(screen.queryByTestId('take-rename-button')).not.toBeInTheDocument();
    });

    it('should call onRenameTake when rename is saved', () => {
      const handleRename = vi.fn();
      render(<TakesList takes={mockTakes} onRenameTake={handleRename} />);

      const renameButtons = screen.getAllByTestId('take-rename-button');
      fireEvent.click(renameButtons[0]);

      const input = screen.getByTestId('take-name-input');
      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.blur(input);

      expect(handleRename).toHaveBeenCalled();
    });
  });

  describe('Clear all', () => {
    it('should show clear all button when onClearAll is provided', () => {
      const handleClearAll = vi.fn();
      render(<TakesList takes={mockTakes} onClearAll={handleClearAll} />);

      expect(screen.getByTestId('takes-clear-all')).toBeInTheDocument();
    });

    it('should not show clear all button when onClearAll is not provided', () => {
      render(<TakesList takes={mockTakes} />);

      expect(screen.queryByTestId('takes-clear-all')).not.toBeInTheDocument();
    });

    it('should require confirmation before clearing', () => {
      const handleClearAll = vi.fn();
      render(<TakesList takes={mockTakes} onClearAll={handleClearAll} />);

      fireEvent.click(screen.getByTestId('takes-clear-all'));

      expect(handleClearAll).not.toHaveBeenCalled();
      expect(screen.getByTestId('takes-clear-all')).toHaveTextContent('Confirm?');
    });

    it('should clear all on second click', () => {
      const handleClearAll = vi.fn();
      render(<TakesList takes={mockTakes} onClearAll={handleClearAll} />);

      fireEvent.click(screen.getByTestId('takes-clear-all'));
      fireEvent.click(screen.getByTestId('takes-clear-all'));

      expect(handleClearAll).toHaveBeenCalled();
    });

    it('should reset confirm state after timeout', () => {
      const handleClearAll = vi.fn();
      render(<TakesList takes={mockTakes} onClearAll={handleClearAll} />);

      fireEvent.click(screen.getByTestId('takes-clear-all'));

      expect(screen.getByTestId('takes-clear-all')).toHaveTextContent('Confirm?');

      // Use act to properly flush timers - synchronous
      act(() => {
        vi.advanceTimersByTime(4000);
      });

      expect(screen.getByTestId('takes-clear-all')).toHaveTextContent('Clear All');
    });
  });

  describe('Accessibility', () => {
    it('should have list role on items container', () => {
      render(<TakesList takes={mockTakes} />);

      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('should have aria-label on list', () => {
      render(<TakesList takes={mockTakes} />);

      expect(screen.getByRole('list')).toHaveAttribute('aria-label', 'Recorded takes');
    });
  });
});
