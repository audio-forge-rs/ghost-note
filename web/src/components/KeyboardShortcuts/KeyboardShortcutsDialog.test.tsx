/**
 * Tests for KeyboardShortcutsDialog Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { SHORTCUT_DEFINITIONS } from '@/hooks/useKeyboardShortcuts';

describe('KeyboardShortcutsDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Reset body overflow after each test
    document.body.style.overflow = '';
  });

  describe('rendering', () => {
    it('renders when isOpen is true', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      expect(screen.getByTestId('keyboard-shortcuts-dialog')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('keyboard-shortcuts-dialog')).not.toBeInTheDocument();
    });

    it('renders the dialog title', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    it('renders the close button', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      expect(screen.getByTestId('keyboard-shortcuts-close')).toBeInTheDocument();
    });

    it('renders the footer hint', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      // The hint contains a kbd element, so we need to find by partial text
      const footer = screen.getByText(/anytime to show this dialog/);
      expect(footer).toBeInTheDocument();
    });
  });

  describe('shortcuts display', () => {
    it('renders all category sections', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      expect(screen.getByText('Playback')).toBeInTheDocument();
      expect(screen.getByText('Creation')).toBeInTheDocument();
      expect(screen.getByText('Editing')).toBeInTheDocument();
      expect(screen.getByText('Navigation')).toBeInTheDocument();
    });

    it('renders shortcut descriptions', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      // Check for some expected shortcuts
      expect(screen.getByText('Play/Pause melody playback')).toBeInTheDocument();
      expect(screen.getByText('Stop playback')).toBeInTheDocument();
      expect(screen.getByText('Generate melody')).toBeInTheDocument();
    });

    it('renders a shortcut for each definition', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      for (const shortcut of SHORTCUT_DEFINITIONS) {
        const element = screen.getByTestId(`shortcut-${shortcut.action}`);
        expect(element).toBeInTheDocument();
      }
    });

    it('shows key labels for shortcuts', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      // Check for some expected key labels
      expect(screen.getByText('Space')).toBeInTheDocument();
      expect(screen.getByText('Esc')).toBeInTheDocument();
      expect(screen.getByText('R')).toBeInTheDocument();
    });
  });

  describe('closing behavior', () => {
    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<KeyboardShortcutsDialog isOpen={true} onClose={onClose} />);

      fireEvent.click(screen.getByTestId('keyboard-shortcuts-close'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when overlay is clicked', () => {
      const onClose = vi.fn();
      render(<KeyboardShortcutsDialog isOpen={true} onClose={onClose} />);

      fireEvent.click(screen.getByTestId('keyboard-shortcuts-dialog'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when dialog content is clicked', () => {
      const onClose = vi.fn();
      render(<KeyboardShortcutsDialog isOpen={true} onClose={onClose} />);

      // Click on the title inside the dialog
      fireEvent.click(screen.getByText('Keyboard Shortcuts'));

      expect(onClose).not.toHaveBeenCalled();
    });

    it('calls onClose when Escape is pressed', () => {
      const onClose = vi.fn();
      render(<KeyboardShortcutsDialog isOpen={true} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('body scroll prevention', () => {
    it('sets body overflow to hidden when open', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('resets body overflow when closed', () => {
      const { rerender } = render(<KeyboardShortcutsDialog {...defaultProps} />);

      rerender(<KeyboardShortcutsDialog {...defaultProps} isOpen={false} />);

      expect(document.body.style.overflow).toBe('');
    });

    it('resets body overflow on unmount', () => {
      const { unmount } = render(<KeyboardShortcutsDialog {...defaultProps} />);

      unmount();

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('accessibility', () => {
    it('has role="dialog"', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal="true"', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      expect(screen.getByTestId('keyboard-shortcuts-dialog')).toHaveAttribute(
        'aria-modal',
        'true'
      );
    });

    it('has aria-labelledby pointing to the title', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      const dialog = screen.getByTestId('keyboard-shortcuts-dialog');
      const titleId = dialog.getAttribute('aria-labelledby');

      expect(titleId).toBeTruthy();
      expect(document.getElementById(titleId!)).toHaveTextContent('Keyboard Shortcuts');
    });

    it('close button has aria-label', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      expect(screen.getByTestId('keyboard-shortcuts-close')).toHaveAttribute(
        'aria-label',
        'Close'
      );
    });
  });

  describe('platform-specific display', () => {
    it('shows modifier keys in key labels', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      // The component should display Cmd or Ctrl depending on platform
      // We check that some modifier is shown for shortcuts that need it
      const undoShortcut = screen.getByTestId('shortcut-undo');
      const keyLabel = undoShortcut.querySelector('kbd');

      expect(keyLabel).toBeInTheDocument();
      // Either shows Cmd (Mac) or Ctrl (Windows/Linux)
      expect(keyLabel?.textContent).toMatch(/[⌘Ctrl]\+Z/);
    });
  });
});
