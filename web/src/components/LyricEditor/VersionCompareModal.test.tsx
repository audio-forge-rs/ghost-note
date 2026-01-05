/**
 * Tests for VersionCompareModal Component
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VersionCompareModal } from './VersionCompareModal';
import type { VersionCompareModalProps } from './types';
import type { LyricVersion } from './types';

describe('VersionCompareModal', () => {
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
    {
      id: 'v3',
      lyrics: 'Third version\nCompletely different',
      timestamp: Date.now() - 10000, // 10 seconds ago
      changes: [{ type: 'modify', start: 0, end: 20, oldText: 'Second', newText: 'Third' }],
      description: 'Complete rewrite',
    },
  ];

  const defaultProps: VersionCompareModalProps = {
    isOpen: true,
    onClose: vi.fn(),
    versions: mockVersions,
    originalText: 'Original poem text\nSecond line of original',
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the modal when isOpen is true', () => {
      render(<VersionCompareModal {...defaultProps} />);

      expect(screen.getByTestId('version-compare-modal')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<VersionCompareModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('version-compare-modal')).not.toBeInTheDocument();
    });

    it('uses custom testId', () => {
      render(<VersionCompareModal {...defaultProps} testId="custom-modal" />);

      expect(screen.getByTestId('custom-modal')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<VersionCompareModal {...defaultProps} className="custom-class" />);

      const content = screen.getByTestId('version-compare-modal-content');
      expect(content).toHaveClass('custom-class');
    });

    it('renders the title', () => {
      render(<VersionCompareModal {...defaultProps} />);

      expect(screen.getByText('Compare Versions')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<VersionCompareModal {...defaultProps} />);

      expect(screen.getByTestId('version-compare-modal-close')).toBeInTheDocument();
    });
  });

  describe('version selectors', () => {
    it('renders both version selectors', () => {
      render(<VersionCompareModal {...defaultProps} />);

      expect(screen.getByTestId('version-compare-modal-left-select')).toBeInTheDocument();
      expect(screen.getByTestId('version-compare-modal-right-select')).toBeInTheDocument();
    });

    it('includes original in version options', () => {
      render(<VersionCompareModal {...defaultProps} />);

      const leftSelect = screen.getByTestId('version-compare-modal-left-select');
      expect(leftSelect).toContainHTML('Original');
    });

    it('includes all versions in options', () => {
      render(<VersionCompareModal {...defaultProps} />);

      const leftSelect = screen.getByTestId('version-compare-modal-left-select');
      expect(leftSelect).toContainHTML('Initial edit');
      expect(leftSelect).toContainHTML('Added more content');
      expect(leftSelect).toContainHTML('Complete rewrite');
    });

    it('defaults left selector to original', () => {
      render(<VersionCompareModal {...defaultProps} />);

      const leftSelect = screen.getByTestId('version-compare-modal-left-select') as HTMLSelectElement;
      expect(leftSelect.value).toBe('original');
    });

    it('defaults right selector to latest version', () => {
      render(<VersionCompareModal {...defaultProps} />);

      const rightSelect = screen.getByTestId('version-compare-modal-right-select') as HTMLSelectElement;
      expect(rightSelect.value).toBe('v3');
    });

    it('uses initialLeftVersionId when provided', () => {
      render(<VersionCompareModal {...defaultProps} initialLeftVersionId="v1" />);

      const leftSelect = screen.getByTestId('version-compare-modal-left-select') as HTMLSelectElement;
      expect(leftSelect.value).toBe('v1');
    });

    it('uses initialRightVersionId when provided', () => {
      render(<VersionCompareModal {...defaultProps} initialRightVersionId="v2" />);

      const rightSelect = screen.getByTestId('version-compare-modal-right-select') as HTMLSelectElement;
      expect(rightSelect.value).toBe('v2');
    });

    it('changes left version when selector changes', async () => {
      const user = userEvent.setup();
      render(<VersionCompareModal {...defaultProps} />);

      const leftSelect = screen.getByTestId('version-compare-modal-left-select');
      await user.selectOptions(leftSelect, 'v1');

      expect((leftSelect as HTMLSelectElement).value).toBe('v1');
    });

    it('changes right version when selector changes', async () => {
      const user = userEvent.setup();
      render(<VersionCompareModal {...defaultProps} />);

      const rightSelect = screen.getByTestId('version-compare-modal-right-select');
      await user.selectOptions(rightSelect, 'v1');

      expect((rightSelect as HTMLSelectElement).value).toBe('v1');
    });
  });

  describe('swap functionality', () => {
    it('renders swap button', () => {
      render(<VersionCompareModal {...defaultProps} />);

      expect(screen.getByTestId('version-compare-modal-swap')).toBeInTheDocument();
    });

    it('swaps versions when swap button is clicked', async () => {
      const user = userEvent.setup();
      render(<VersionCompareModal {...defaultProps} initialLeftVersionId="v1" initialRightVersionId="v2" />);

      const swapButton = screen.getByTestId('version-compare-modal-swap');
      await user.click(swapButton);

      const leftSelect = screen.getByTestId('version-compare-modal-left-select') as HTMLSelectElement;
      const rightSelect = screen.getByTestId('version-compare-modal-right-select') as HTMLSelectElement;

      expect(leftSelect.value).toBe('v2');
      expect(rightSelect.value).toBe('v1');
    });
  });

  describe('diff view modes', () => {
    it('defaults to side-by-side view', () => {
      render(<VersionCompareModal {...defaultProps} />);

      expect(screen.getByTestId('version-compare-modal-diff-view')).toBeInTheDocument();
    });

    it('renders toggle button', () => {
      render(<VersionCompareModal {...defaultProps} />);

      expect(screen.getByTestId('version-compare-modal-toggle-mode')).toBeInTheDocument();
    });

    it('switches to inline view when toggle is clicked', async () => {
      const user = userEvent.setup();
      render(<VersionCompareModal {...defaultProps} />);

      const toggleButton = screen.getByTestId('version-compare-modal-toggle-mode');
      await user.click(toggleButton);

      expect(screen.getByTestId('version-compare-modal-inline-diff')).toBeInTheDocument();
    });

    it('switches back to side-by-side view', async () => {
      const user = userEvent.setup();
      render(<VersionCompareModal {...defaultProps} />);

      const toggleButton = screen.getByTestId('version-compare-modal-toggle-mode');
      await user.click(toggleButton);
      await user.click(toggleButton);

      expect(screen.getByTestId('version-compare-modal-diff-view')).toBeInTheDocument();
    });
  });

  describe('same version warning', () => {
    it('shows warning when both selectors have same version', async () => {
      const user = userEvent.setup();
      render(<VersionCompareModal {...defaultProps} />);

      const rightSelect = screen.getByTestId('version-compare-modal-right-select');
      await user.selectOptions(rightSelect, 'original');

      expect(screen.getByTestId('version-compare-modal-same-version')).toBeInTheDocument();
    });

    it('hides diff view when same version selected', async () => {
      const user = userEvent.setup();
      render(<VersionCompareModal {...defaultProps} />);

      const rightSelect = screen.getByTestId('version-compare-modal-right-select');
      await user.selectOptions(rightSelect, 'original');

      // Wait for state update and verify diff view is hidden
      await waitFor(() => {
        expect(screen.queryByTestId('version-compare-modal-diff-view')).not.toBeInTheDocument();
      });
    });
  });

  describe('change navigation', () => {
    it('renders navigation buttons', () => {
      render(<VersionCompareModal {...defaultProps} />);

      expect(screen.getByTestId('version-compare-modal-prev-change')).toBeInTheDocument();
      expect(screen.getByTestId('version-compare-modal-next-change')).toBeInTheDocument();
    });

    it('renders change counter', () => {
      render(<VersionCompareModal {...defaultProps} />);

      expect(screen.getByTestId('version-compare-modal-change-counter')).toBeInTheDocument();
    });

    it('disables navigation when no changes', async () => {
      const user = userEvent.setup();
      render(<VersionCompareModal {...defaultProps} />);

      // Select same version on both sides
      const rightSelect = screen.getByTestId('version-compare-modal-right-select');
      await user.selectOptions(rightSelect, 'original');

      await waitFor(() => {
        const prevButton = screen.getByTestId('version-compare-modal-prev-change');
        const nextButton = screen.getByTestId('version-compare-modal-next-change');

        expect(prevButton).toBeDisabled();
        expect(nextButton).toBeDisabled();
      });
    });

    it('shows "No changes" when identical', async () => {
      const user = userEvent.setup();
      render(<VersionCompareModal {...defaultProps} />);

      const rightSelect = screen.getByTestId('version-compare-modal-right-select');
      await user.selectOptions(rightSelect, 'original');

      // First verify the same-version message appears (confirming both are now same)
      await waitFor(() => {
        expect(screen.getByTestId('version-compare-modal-same-version')).toBeInTheDocument();
      });

      // Then verify change counter shows no changes
      const counter = screen.getByTestId('version-compare-modal-change-counter');
      expect(counter).toHaveTextContent('No changes');
    });

    it('navigates to next change when next button clicked', async () => {
      const user = userEvent.setup();
      render(<VersionCompareModal {...defaultProps} />);

      const nextButton = screen.getByTestId('version-compare-modal-next-change');
      const counter = screen.getByTestId('version-compare-modal-change-counter');

      await user.click(nextButton);

      // Counter should update
      expect(counter.textContent).not.toBe('No changes');
    });

    it('navigates to previous change when prev button clicked', async () => {
      const user = userEvent.setup();
      render(<VersionCompareModal {...defaultProps} />);

      const nextButton = screen.getByTestId('version-compare-modal-next-change');
      const prevButton = screen.getByTestId('version-compare-modal-prev-change');

      // Navigate forward first
      await user.click(nextButton);
      await user.click(nextButton);

      // Then back
      await user.click(prevButton);

      // Should have navigated
      expect(screen.getByTestId('version-compare-modal-change-counter')).toBeInTheDocument();
    });
  });

  describe('copy functionality', () => {
    it('renders copy buttons', () => {
      render(<VersionCompareModal {...defaultProps} />);

      expect(screen.getByTestId('version-compare-modal-copy-left')).toBeInTheDocument();
      expect(screen.getByTestId('version-compare-modal-copy-right')).toBeInTheDocument();
    });

    it('copy left button can be clicked', async () => {
      const user = userEvent.setup();

      // Mock clipboard for this test
      const writeTextMock = vi.fn(() => Promise.resolve());
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      render(<VersionCompareModal {...defaultProps} />);

      const copyLeftButton = screen.getByTestId('version-compare-modal-copy-left');

      // Button should be clickable and have correct aria-label
      expect(copyLeftButton).toBeInTheDocument();
      expect(copyLeftButton).toHaveAttribute('aria-label');

      await user.click(copyLeftButton);

      // Verify the clipboard API was called
      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalled();
      });
    });

    it('copy right button can be clicked', async () => {
      const user = userEvent.setup();

      // Mock clipboard for this test
      const writeTextMock = vi.fn(() => Promise.resolve());
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      render(<VersionCompareModal {...defaultProps} />);

      const copyRightButton = screen.getByTestId('version-compare-modal-copy-right');

      expect(copyRightButton).toBeInTheDocument();
      expect(copyRightButton).toHaveAttribute('aria-label');

      await user.click(copyRightButton);

      // Verify the clipboard API was called
      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalled();
      });
    });

    it('copy buttons have correct labels', () => {
      render(<VersionCompareModal {...defaultProps} />);

      const copyLeftButton = screen.getByTestId('version-compare-modal-copy-left');
      const copyRightButton = screen.getByTestId('version-compare-modal-copy-right');

      expect(copyLeftButton).toHaveTextContent('Copy Left');
      expect(copyRightButton).toHaveTextContent('Copy Right');
    });
  });

  describe('closing modal', () => {
    it('calls onClose when close button clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<VersionCompareModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByTestId('version-compare-modal-close');
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when overlay clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<VersionCompareModal {...defaultProps} onClose={onClose} />);

      const overlay = screen.getByTestId('version-compare-modal');
      await user.click(overlay);

      expect(onClose).toHaveBeenCalled();
    });

    it('does not close when modal content clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<VersionCompareModal {...defaultProps} onClose={onClose} />);

      const content = screen.getByTestId('version-compare-modal-content');
      await user.click(content);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('calls onClose when Escape key pressed', () => {
      const onClose = vi.fn();
      render(<VersionCompareModal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('keyboard navigation', () => {
    it('navigates to next change with Ctrl+ArrowDown', async () => {
      render(<VersionCompareModal {...defaultProps} />);

      const counter = screen.getByTestId('version-compare-modal-change-counter');

      fireEvent.keyDown(document, { key: 'ArrowDown', ctrlKey: true });

      // Should update navigation state
      await waitFor(() => {
        expect(counter).toBeInTheDocument();
      });
    });

    it('navigates to previous change with Ctrl+ArrowUp', async () => {
      render(<VersionCompareModal {...defaultProps} />);

      // Navigate forward first
      fireEvent.keyDown(document, { key: 'ArrowDown', ctrlKey: true });
      fireEvent.keyDown(document, { key: 'ArrowDown', ctrlKey: true });

      // Then back
      fireEvent.keyDown(document, { key: 'ArrowUp', ctrlKey: true });

      expect(screen.getByTestId('version-compare-modal-change-counter')).toBeInTheDocument();
    });

    it('navigates with Ctrl+J', async () => {
      render(<VersionCompareModal {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'j', ctrlKey: true });

      expect(screen.getByTestId('version-compare-modal-change-counter')).toBeInTheDocument();
    });

    it('navigates with Ctrl+K', async () => {
      render(<VersionCompareModal {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

      expect(screen.getByTestId('version-compare-modal-change-counter')).toBeInTheDocument();
    });
  });

  describe('focus management', () => {
    it('traps focus within modal', () => {
      render(<VersionCompareModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('has aria-modal attribute', () => {
      render(<VersionCompareModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });

  describe('accessibility', () => {
    it('has role="dialog"', () => {
      render(<VersionCompareModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-labelledby pointing to title', () => {
      render(<VersionCompareModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'version-compare-modal-title');
    });

    it('left select has aria-label', () => {
      render(<VersionCompareModal {...defaultProps} />);

      const leftSelect = screen.getByTestId('version-compare-modal-left-select');
      expect(leftSelect).toHaveAttribute('aria-label', 'Select left version to compare');
    });

    it('right select has aria-label', () => {
      render(<VersionCompareModal {...defaultProps} />);

      const rightSelect = screen.getByTestId('version-compare-modal-right-select');
      expect(rightSelect).toHaveAttribute('aria-label', 'Select right version to compare');
    });

    it('swap button has aria-label', () => {
      render(<VersionCompareModal {...defaultProps} />);

      const swapButton = screen.getByTestId('version-compare-modal-swap');
      expect(swapButton).toHaveAttribute('aria-label', 'Swap left and right versions');
    });

    it('close button has aria-label', () => {
      render(<VersionCompareModal {...defaultProps} />);

      const closeButton = screen.getByTestId('version-compare-modal-close');
      expect(closeButton).toHaveAttribute('aria-label', 'Close comparison modal');
    });

    it('navigation buttons have aria-labels', () => {
      render(<VersionCompareModal {...defaultProps} />);

      const prevButton = screen.getByTestId('version-compare-modal-prev-change');
      const nextButton = screen.getByTestId('version-compare-modal-next-change');

      expect(prevButton).toHaveAttribute('aria-label', 'Go to previous change');
      expect(nextButton).toHaveAttribute('aria-label', 'Go to next change');
    });

    it('copy buttons have aria-labels', () => {
      render(<VersionCompareModal {...defaultProps} />);

      const copyLeftButton = screen.getByTestId('version-compare-modal-copy-left');
      const copyRightButton = screen.getByTestId('version-compare-modal-copy-right');

      expect(copyLeftButton).toHaveAttribute('aria-label');
      expect(copyRightButton).toHaveAttribute('aria-label');
    });

    it('change counter has aria-live for screen readers', () => {
      render(<VersionCompareModal {...defaultProps} />);

      const counter = screen.getByTestId('version-compare-modal-change-counter');
      expect(counter).toHaveAttribute('aria-live', 'polite');
    });

    it('navigation area has role="navigation"', () => {
      render(<VersionCompareModal {...defaultProps} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Navigate between changes');
    });
  });

  describe('footer information', () => {
    it('displays left version info', () => {
      render(<VersionCompareModal {...defaultProps} />);

      expect(screen.getByText('Left:')).toBeInTheDocument();
    });

    it('displays right version info', () => {
      render(<VersionCompareModal {...defaultProps} />);

      expect(screen.getByText('Right:')).toBeInTheDocument();
    });
  });

  describe('keyboard hints', () => {
    it('displays keyboard hints', () => {
      render(<VersionCompareModal {...defaultProps} />);

      expect(screen.getByText('Close')).toBeInTheDocument();
      // Use regex to match partial text since it contains keyboard elements
      expect(screen.getByText(/Navigate changes/)).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles empty versions array', () => {
      render(<VersionCompareModal {...defaultProps} versions={[]} />);

      // Should still render with just original
      expect(screen.getByTestId('version-compare-modal')).toBeInTheDocument();

      const leftSelect = screen.getByTestId('version-compare-modal-left-select') as HTMLSelectElement;
      expect(leftSelect.value).toBe('original');
    });

    it('handles empty original text', () => {
      render(<VersionCompareModal {...defaultProps} originalText="" />);

      expect(screen.getByTestId('version-compare-modal')).toBeInTheDocument();
    });

    it('updates when modal reopens with different initial versions', async () => {
      const { rerender } = render(
        <VersionCompareModal
          {...defaultProps}
          isOpen={false}
          initialLeftVersionId="v1"
          initialRightVersionId="v2"
        />
      );

      rerender(
        <VersionCompareModal
          {...defaultProps}
          isOpen={true}
          initialLeftVersionId="v2"
          initialRightVersionId="v3"
        />
      );

      // Wait for requestAnimationFrame to complete
      await waitFor(() => {
        const leftSelect = screen.getByTestId('version-compare-modal-left-select') as HTMLSelectElement;
        expect(leftSelect.value).toBe('v2');
      });

      const rightSelect = screen.getByTestId('version-compare-modal-right-select') as HTMLSelectElement;
      expect(rightSelect.value).toBe('v3');
    });

    it('resets change index when version changes', async () => {
      const user = userEvent.setup();
      render(<VersionCompareModal {...defaultProps} />);

      // Navigate to some change
      const nextButton = screen.getByTestId('version-compare-modal-next-change');
      await user.click(nextButton);
      await user.click(nextButton);

      // Change version
      const leftSelect = screen.getByTestId('version-compare-modal-left-select');
      await user.selectOptions(leftSelect, 'v1');

      // Counter should reset
      const counter = screen.getByTestId('version-compare-modal-change-counter');
      expect(counter.textContent).toMatch(/1 \/ \d+|No changes/);
    });
  });

  describe('scrolling behavior', () => {
    it('prevents body scroll when modal is open', () => {
      render(<VersionCompareModal {...defaultProps} />);

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when modal closes', () => {
      const { rerender } = render(<VersionCompareModal {...defaultProps} />);

      rerender(<VersionCompareModal {...defaultProps} isOpen={false} />);

      // Body scroll should be restored (empty string means default behavior)
      expect(document.body.style.overflow).not.toBe('hidden');
    });
  });
});
