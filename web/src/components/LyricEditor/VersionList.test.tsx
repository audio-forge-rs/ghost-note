/**
 * Tests for VersionList Component
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { VersionList } from './VersionList';
import type { VersionListProps } from './types';
import type { LyricVersion } from './types';

describe('VersionList', () => {
  const mockVersions: LyricVersion[] = [
    {
      id: 'v1',
      lyrics: 'First version of lyrics\nWith two lines',
      timestamp: Date.now() - 60000, // 1 minute ago
      changes: [{ type: 'modify', start: 0, end: 10, oldText: 'original', newText: 'First' }],
      description: 'Initial edit',
    },
    {
      id: 'v2',
      lyrics: 'Second version\nWith changes\nAnd more lines',
      timestamp: Date.now() - 30000, // 30 seconds ago
      changes: [
        { type: 'add', start: 0, end: 5 },
        { type: 'remove', start: 10, end: 15, oldText: 'text' },
      ],
      description: 'Added more content',
    },
  ];

  const defaultProps: VersionListProps = {
    versions: mockVersions,
    currentVersionIndex: 0,
    onSelectVersion: vi.fn(),
    originalText: 'Original poem text\nSecond line',
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the container', () => {
      render(<VersionList {...defaultProps} />);

      expect(screen.getByTestId('version-list')).toBeInTheDocument();
    });

    it('uses custom testId', () => {
      render(<VersionList {...defaultProps} testId="custom-list" />);

      expect(screen.getByTestId('custom-list')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<VersionList {...defaultProps} className="custom-class" />);

      const container = screen.getByTestId('version-list');
      expect(container).toHaveClass('custom-class');
    });

    it('renders header with title', () => {
      render(<VersionList {...defaultProps} />);

      expect(screen.getByText('Version History')).toBeInTheDocument();
    });

    it('shows version count', () => {
      render(<VersionList {...defaultProps} />);

      // 2 versions + 1 original = 3 versions
      expect(screen.getByText('3 versions')).toBeInTheDocument();
    });
  });

  describe('original version', () => {
    it('always shows original as first item', () => {
      render(<VersionList {...defaultProps} />);

      expect(screen.getByTestId('version-list-item-original')).toBeInTheDocument();
    });

    it('shows "Original" label', () => {
      render(<VersionList {...defaultProps} />);

      expect(screen.getByText('Original')).toBeInTheDocument();
    });

    it('marks original as selected when currentVersionIndex is -1', () => {
      render(<VersionList {...defaultProps} currentVersionIndex={-1} />);

      const original = screen.getByTestId('version-list-item-original');
      expect(original).toHaveClass('version-list__item--selected');
    });

    it('shows "O" indicator for original', () => {
      render(<VersionList {...defaultProps} />);

      const original = screen.getByTestId('version-list-item-original');
      expect(original.querySelector('.version-list__item-number')?.textContent).toBe('O');
    });
  });

  describe('version items', () => {
    it('renders all versions', () => {
      render(<VersionList {...defaultProps} />);

      expect(screen.getByTestId('version-list-item-v1')).toBeInTheDocument();
      expect(screen.getByTestId('version-list-item-v2')).toBeInTheDocument();
    });

    it('shows version descriptions', () => {
      render(<VersionList {...defaultProps} />);

      expect(screen.getByText('Initial edit')).toBeInTheDocument();
      expect(screen.getByText('Added more content')).toBeInTheDocument();
    });

    it('marks selected version', () => {
      render(<VersionList {...defaultProps} currentVersionIndex={0} />);

      const v1 = screen.getByTestId('version-list-item-v1');
      expect(v1).toHaveClass('version-list__item--selected');
    });

    it('shows relative timestamps', () => {
      render(<VersionList {...defaultProps} />);

      // Should show relative time like "1m ago" or "30s ago"
      const items = screen.getAllByTestId(/version-list-item-v/);
      items.forEach((item) => {
        const timeEl = item.querySelector('.version-list__item-time');
        expect(timeEl).toBeInTheDocument();
      });
    });
  });

  describe('version selection', () => {
    it('calls onSelectVersion when version is clicked', () => {
      const onSelectVersion = vi.fn();
      render(<VersionList {...defaultProps} onSelectVersion={onSelectVersion} />);

      fireEvent.click(screen.getByTestId('version-list-item-v1'));

      expect(onSelectVersion).toHaveBeenCalledWith(0);
    });

    it('calls onSelectVersion with -1 when original is clicked', () => {
      const onSelectVersion = vi.fn();
      render(<VersionList {...defaultProps} onSelectVersion={onSelectVersion} />);

      fireEvent.click(screen.getByTestId('version-list-item-original'));

      expect(onSelectVersion).toHaveBeenCalledWith(-1);
    });

    it('responds to Enter key', () => {
      const onSelectVersion = vi.fn();
      render(<VersionList {...defaultProps} onSelectVersion={onSelectVersion} />);

      const v1 = screen.getByTestId('version-list-item-v1');
      fireEvent.keyDown(v1, { key: 'Enter' });

      expect(onSelectVersion).toHaveBeenCalledWith(0);
    });

    it('responds to Space key', () => {
      const onSelectVersion = vi.fn();
      render(<VersionList {...defaultProps} onSelectVersion={onSelectVersion} />);

      const v1 = screen.getByTestId('version-list-item-v1');
      fireEvent.keyDown(v1, { key: ' ' });

      expect(onSelectVersion).toHaveBeenCalledWith(0);
    });
  });

  describe('version deletion', () => {
    it('shows delete button when onDeleteVersion is provided', () => {
      render(
        <VersionList {...defaultProps} onDeleteVersion={vi.fn()} />
      );

      expect(screen.getByTestId('version-list-item-v1-delete')).toBeInTheDocument();
    });

    it('hides delete button when onDeleteVersion is not provided', () => {
      render(<VersionList {...defaultProps} />);

      expect(screen.queryByTestId('version-list-item-v1-delete')).not.toBeInTheDocument();
    });

    it('does not show delete button for original', () => {
      render(
        <VersionList {...defaultProps} onDeleteVersion={vi.fn()} />
      );

      expect(screen.queryByTestId('version-list-item-original-delete')).not.toBeInTheDocument();
    });

    it('calls onDeleteVersion when delete button is clicked', () => {
      const onDeleteVersion = vi.fn();
      render(<VersionList {...defaultProps} onDeleteVersion={onDeleteVersion} />);

      fireEvent.click(screen.getByTestId('version-list-item-v1-delete'));

      expect(onDeleteVersion).toHaveBeenCalledWith('v1');
    });

    it('does not trigger selection when delete is clicked', () => {
      const onSelectVersion = vi.fn();
      const onDeleteVersion = vi.fn();
      render(
        <VersionList
          {...defaultProps}
          onSelectVersion={onSelectVersion}
          onDeleteVersion={onDeleteVersion}
        />
      );

      fireEvent.click(screen.getByTestId('version-list-item-v1-delete'));

      expect(onDeleteVersion).toHaveBeenCalled();
      expect(onSelectVersion).not.toHaveBeenCalled();
    });
  });

  describe('compact mode', () => {
    it('applies compact class when compact is true', () => {
      render(<VersionList {...defaultProps} compact />);

      const container = screen.getByTestId('version-list');
      expect(container).toHaveClass('version-list--compact');
    });

    it('applies compact class to items', () => {
      render(<VersionList {...defaultProps} compact />);

      const original = screen.getByTestId('version-list-item-original');
      expect(original).toHaveClass('version-list__item--compact');
    });
  });

  describe('empty state', () => {
    it('shows empty message when no versions exist', () => {
      render(
        <VersionList
          {...defaultProps}
          versions={[]}
        />
      );

      expect(screen.getByTestId('version-list-empty')).toBeInTheDocument();
    });

    it('shows correct version count for empty list', () => {
      render(
        <VersionList
          {...defaultProps}
          versions={[]}
        />
      );

      // Just the original
      expect(screen.getByText('1 version')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has role="listbox"', () => {
      render(<VersionList {...defaultProps} />);

      const container = screen.getByTestId('version-list');
      expect(container.getAttribute('role')).toBe('listbox');
    });

    it('has aria-label', () => {
      render(<VersionList {...defaultProps} />);

      const container = screen.getByTestId('version-list');
      expect(container.getAttribute('aria-label')).toBe('Version history');
    });

    it('items have role="option"', () => {
      render(<VersionList {...defaultProps} />);

      const original = screen.getByTestId('version-list-item-original');
      expect(original.getAttribute('role')).toBe('option');
    });

    it('selected item has aria-selected="true"', () => {
      render(<VersionList {...defaultProps} currentVersionIndex={0} />);

      const v1 = screen.getByTestId('version-list-item-v1');
      expect(v1.getAttribute('aria-selected')).toBe('true');
    });

    it('non-selected items have aria-selected="false"', () => {
      render(<VersionList {...defaultProps} currentVersionIndex={0} />);

      const original = screen.getByTestId('version-list-item-original');
      expect(original.getAttribute('aria-selected')).toBe('false');
    });

    it('items are keyboard focusable', () => {
      render(<VersionList {...defaultProps} />);

      const items = screen.getAllByRole('option');
      items.forEach((item) => {
        expect(item.getAttribute('tabindex')).toBe('0');
      });
    });

    it('delete button has aria-label', () => {
      render(
        <VersionList {...defaultProps} onDeleteVersion={vi.fn()} />
      );

      const deleteBtn = screen.getByTestId('version-list-item-v1-delete');
      expect(deleteBtn.getAttribute('aria-label')).toContain('Delete version');
    });
  });

  describe('version ordering', () => {
    it('displays versions with newest first (after original)', () => {
      render(<VersionList {...defaultProps} />);

      const items = screen.getAllByRole('option');

      // First should be original
      expect(items[0]).toHaveTextContent('Original');

      // Newest should be next (v2 was created 30s ago, v1 was 60s ago)
      expect(items[1]).toHaveTextContent('Added more content');
      expect(items[2]).toHaveTextContent('Initial edit');
    });
  });

  describe('word count display', () => {
    it('shows word count in non-compact mode', () => {
      render(<VersionList {...defaultProps} />);

      const wordCounts = document.querySelectorAll('.version-list__item-words');
      expect(wordCounts.length).toBeGreaterThan(0);
    });

    it('hides word count in compact mode', () => {
      render(<VersionList {...defaultProps} compact />);

      // In compact mode, preview and meta are hidden
      const previews = document.querySelectorAll('.version-list__item-preview');
      expect(previews.length).toBe(0);
    });
  });
});
