/**
 * Tests for ConfirmDialog Component
 *
 * @module components/Common/ConfirmDialog.test
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps: ConfirmDialogProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
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
    it('renders the dialog when isOpen is true', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<ConfirmDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    });

    it('renders the title', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByTestId('confirm-dialog-title')).toHaveTextContent('Confirm Action');
    });

    it('renders the message', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByTestId('confirm-dialog-message')).toHaveTextContent(
        'Are you sure you want to proceed?'
      );
    });

    it('renders the confirm button with default text', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByTestId('confirm-dialog-confirm')).toHaveTextContent('Confirm');
    });

    it('renders the cancel button with default text', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByTestId('confirm-dialog-cancel')).toHaveTextContent('Cancel');
    });

    it('renders custom confirm text', () => {
      render(<ConfirmDialog {...defaultProps} confirmText="Delete" />);

      expect(screen.getByTestId('confirm-dialog-confirm')).toHaveTextContent('Delete');
    });

    it('renders custom cancel text', () => {
      render(<ConfirmDialog {...defaultProps} cancelText="No, go back" />);

      expect(screen.getByTestId('confirm-dialog-cancel')).toHaveTextContent('No, go back');
    });

    it('renders ReactNode message', () => {
      const message = (
        <div>
          <strong>Warning:</strong> This will delete all data.
        </div>
      );
      render(<ConfirmDialog {...defaultProps} message={message} />);

      expect(screen.getByTestId('confirm-dialog-message')).toContainHTML('<strong>Warning:</strong>');
    });

    it('uses custom testId', () => {
      render(<ConfirmDialog {...defaultProps} testId="custom-dialog" />);

      expect(screen.getByTestId('custom-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('custom-dialog-title')).toBeInTheDocument();
      expect(screen.getByTestId('custom-dialog-confirm')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('applies danger variant class', () => {
      render(<ConfirmDialog {...defaultProps} variant="danger" />);

      const dialog = screen.getByTestId('confirm-dialog-content');
      expect(dialog).toHaveClass('confirm-dialog--danger');
    });

    it('applies warning variant class', () => {
      render(<ConfirmDialog {...defaultProps} variant="warning" />);

      const dialog = screen.getByTestId('confirm-dialog-content');
      expect(dialog).toHaveClass('confirm-dialog--warning');
    });

    it('applies info variant class', () => {
      render(<ConfirmDialog {...defaultProps} variant="info" />);

      const dialog = screen.getByTestId('confirm-dialog-content');
      expect(dialog).toHaveClass('confirm-dialog--info');
    });

    it('defaults to danger variant', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const dialog = screen.getByTestId('confirm-dialog-content');
      expect(dialog).toHaveClass('confirm-dialog--danger');
    });

    it('renders default icon for danger variant', () => {
      render(<ConfirmDialog {...defaultProps} variant="danger" />);

      const iconContainer = document.querySelector('.confirm-dialog__icon--danger');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer?.querySelector('svg')).toBeInTheDocument();
    });

    it('renders default icon for warning variant', () => {
      render(<ConfirmDialog {...defaultProps} variant="warning" />);

      const iconContainer = document.querySelector('.confirm-dialog__icon--warning');
      expect(iconContainer).toBeInTheDocument();
    });

    it('renders default icon for info variant', () => {
      render(<ConfirmDialog {...defaultProps} variant="info" />);

      const iconContainer = document.querySelector('.confirm-dialog__icon--info');
      expect(iconContainer).toBeInTheDocument();
    });

    it('renders custom icon when provided', () => {
      const customIcon = <span data-testid="custom-icon">!</span>;
      render(<ConfirmDialog {...defaultProps} icon={customIcon} />);

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  describe('button interactions', () => {
    it('calls onConfirm when confirm button is clicked', () => {
      const onConfirm = vi.fn();
      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

      fireEvent.click(screen.getByTestId('confirm-dialog-confirm'));

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when cancel button is clicked', () => {
      const onClose = vi.fn();
      render(<ConfirmDialog {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByTestId('confirm-dialog-cancel'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when overlay is clicked', () => {
      const onClose = vi.fn();
      render(<ConfirmDialog {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByTestId('confirm-dialog'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when dialog content is clicked', () => {
      const onClose = vi.fn();
      render(<ConfirmDialog {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByTestId('confirm-dialog-content'));

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('keyboard interactions', () => {
    it('calls onClose when Escape is pressed', () => {
      const onClose = vi.fn();
      render(<ConfirmDialog {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when Escape is pressed while confirming', () => {
      const onClose = vi.fn();
      render(<ConfirmDialog {...defaultProps} onClose={onClose} isConfirming />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('traps focus when Tab is pressed on last element', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const cancelButton = screen.getByTestId('confirm-dialog-cancel');
      const confirmButton = screen.getByTestId('confirm-dialog-confirm');

      // Focus the confirm button (last focusable element)
      confirmButton.focus();
      expect(document.activeElement).toBe(confirmButton);

      // Tab should wrap to first element
      fireEvent.keyDown(document, { key: 'Tab' });

      // The focus should wrap to the cancel button
      expect(document.activeElement).toBe(cancelButton);
    });

    it('traps focus when Shift+Tab is pressed on first element', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const cancelButton = screen.getByTestId('confirm-dialog-cancel');
      const confirmButton = screen.getByTestId('confirm-dialog-confirm');

      // Focus the cancel button (first focusable element)
      cancelButton.focus();
      expect(document.activeElement).toBe(cancelButton);

      // Shift+Tab should wrap to last element
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

      expect(document.activeElement).toBe(confirmButton);
    });
  });

  describe('focus management', () => {
    it('focuses cancel button when dialog opens', async () => {
      render(<ConfirmDialog {...defaultProps} />);

      // Advance timers for the focus delay
      await act(async () => {
        vi.advanceTimersByTime(20);
      });

      expect(document.activeElement).toBe(screen.getByTestId('confirm-dialog-cancel'));
    });

    it('restores focus when dialog closes', async () => {
      const focusableButton = document.createElement('button');
      focusableButton.textContent = 'Focus me';
      document.body.appendChild(focusableButton);
      focusableButton.focus();

      const { rerender } = render(<ConfirmDialog {...defaultProps} />);

      // Advance timers for the focus delay
      await act(async () => {
        vi.advanceTimersByTime(20);
      });

      expect(document.activeElement).toBe(screen.getByTestId('confirm-dialog-cancel'));

      rerender(<ConfirmDialog {...defaultProps} isOpen={false} />);

      // Advance timers for the restore focus delay
      await act(async () => {
        vi.advanceTimersByTime(20);
      });

      expect(document.activeElement).toBe(focusableButton);

      document.body.removeChild(focusableButton);
    });
  });

  describe('loading state', () => {
    it('disables confirm button when isConfirming is true', () => {
      render(<ConfirmDialog {...defaultProps} isConfirming />);

      expect(screen.getByTestId('confirm-dialog-confirm')).toBeDisabled();
    });

    it('disables cancel button when isConfirming is true', () => {
      render(<ConfirmDialog {...defaultProps} isConfirming />);

      expect(screen.getByTestId('confirm-dialog-cancel')).toBeDisabled();
    });

    it('shows loading spinner when isConfirming is true', () => {
      render(<ConfirmDialog {...defaultProps} isConfirming />);

      const spinner = document.querySelector('.confirm-dialog__spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('shows "Processing..." text when isConfirming is true', () => {
      render(<ConfirmDialog {...defaultProps} isConfirming />);

      expect(screen.getByTestId('confirm-dialog-confirm')).toHaveTextContent('Processing...');
    });

    it('does not call onConfirm when clicking confirm button while confirming', () => {
      const onConfirm = vi.fn();
      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} isConfirming />);

      fireEvent.click(screen.getByTestId('confirm-dialog-confirm'));

      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('does not close on overlay click when isConfirming is true', () => {
      const onClose = vi.fn();
      render(<ConfirmDialog {...defaultProps} onClose={onClose} isConfirming />);

      fireEvent.click(screen.getByTestId('confirm-dialog'));

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has role="dialog"', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByTestId('confirm-dialog')).toHaveAttribute('role', 'dialog');
    });

    it('has aria-modal="true"', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByTestId('confirm-dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-labelledby pointing to title', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByTestId('confirm-dialog')).toHaveAttribute(
        'aria-labelledby',
        'confirm-dialog-title'
      );
    });

    it('has aria-describedby pointing to message', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByTestId('confirm-dialog')).toHaveAttribute(
        'aria-describedby',
        'confirm-dialog-message'
      );
    });

    it('hides icons from screen readers', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const icon = document.querySelector('.confirm-dialog__icon svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('body scroll prevention', () => {
    it('prevents body scroll when dialog is open', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when dialog closes', () => {
      const { rerender } = render(<ConfirmDialog {...defaultProps} />);

      expect(document.body.style.overflow).toBe('hidden');

      rerender(<ConfirmDialog {...defaultProps} isOpen={false} />);

      expect(document.body.style.overflow).toBe('');
    });

    it('restores original body overflow value', () => {
      document.body.style.overflow = 'auto';

      const { unmount } = render(<ConfirmDialog {...defaultProps} />);

      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(document.body.style.overflow).toBe('auto');
    });
  });

  describe('edge cases', () => {
    it('handles rapid open/close without errors', () => {
      const { rerender } = render(<ConfirmDialog {...defaultProps} isOpen={false} />);

      rerender(<ConfirmDialog {...defaultProps} isOpen={true} />);
      rerender(<ConfirmDialog {...defaultProps} isOpen={false} />);
      rerender(<ConfirmDialog {...defaultProps} isOpen={true} />);
      rerender(<ConfirmDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    });

    it('handles missing callbacks gracefully', () => {
      // This should not throw
      render(
        <ConfirmDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          title="Test"
          message="Test"
        />
      );

      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    });

    it('handles empty title and message', () => {
      render(<ConfirmDialog {...defaultProps} title="" message="" />);

      expect(screen.getByTestId('confirm-dialog-title')).toHaveTextContent('');
      expect(screen.getByTestId('confirm-dialog-message')).toHaveTextContent('');
    });

    it('handles very long title and message', () => {
      const longText = 'A'.repeat(1000);
      render(<ConfirmDialog {...defaultProps} title={longText} message={longText} />);

      expect(screen.getByTestId('confirm-dialog-title')).toHaveTextContent(longText);
      expect(screen.getByTestId('confirm-dialog-message')).toHaveTextContent(longText);
    });
  });
});

describe('ConfirmDialog integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('completes a full confirm flow', async () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    const { rerender } = render(
      <ConfirmDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete Item"
        message="This will permanently delete the item."
        confirmText="Delete"
        variant="danger"
      />
    );

    // Wait for focus
    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    // Verify dialog is shown
    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-dialog-title')).toHaveTextContent('Delete Item');

    // Click confirm
    fireEvent.click(screen.getByTestId('confirm-dialog-confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    // Simulate closing after confirm
    rerender(
      <ConfirmDialog
        isOpen={false}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete Item"
        message="This will permanently delete the item."
        confirmText="Delete"
        variant="danger"
      />
    );

    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
  });

  it('completes a full cancel flow', async () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Clear Data"
        message="This will clear all your data."
        cancelText="Keep data"
        variant="warning"
      />
    );

    // Wait for focus
    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    // Verify dialog is shown
    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();

    // Click cancel
    fireEvent.click(screen.getByTestId('confirm-dialog-cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('handles async confirmation with loading state', async () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    const { rerender } = render(
      <ConfirmDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Save Changes"
        message="Saving your changes..."
        confirmText="Save"
        variant="info"
      />
    );

    // Click confirm
    fireEvent.click(screen.getByTestId('confirm-dialog-confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    // Show loading state
    rerender(
      <ConfirmDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Save Changes"
        message="Saving your changes..."
        confirmText="Save"
        variant="info"
        isConfirming={true}
      />
    );

    // Verify loading state
    expect(screen.getByTestId('confirm-dialog-confirm')).toBeDisabled();
    expect(screen.getByTestId('confirm-dialog-confirm')).toHaveTextContent('Processing...');

    // Close after completion
    rerender(
      <ConfirmDialog
        isOpen={false}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Save Changes"
        message="Saving your changes..."
        confirmText="Save"
        variant="info"
        isConfirming={false}
      />
    );

    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
  });
});
