/**
 * KeyboardShortcutsDialog Component
 *
 * A modal dialog that displays all available keyboard shortcuts organized by category.
 * Can be opened by pressing the '?' key or through the help menu.
 *
 * @module components/KeyboardShortcuts/KeyboardShortcutsDialog
 */

import { useEffect, useCallback } from 'react';
import { getShortcutsByCategory, type ShortcutDefinition } from '@/hooks/useKeyboardShortcuts';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[KeyboardShortcutsDialog] ${message}`, ...args);
  }
};

/**
 * Props for KeyboardShortcutsDialog component
 */
export interface KeyboardShortcutsDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback to close the dialog */
  onClose: () => void;
}

/**
 * Renders a single shortcut row
 */
function ShortcutRow({ shortcut }: { shortcut: ShortcutDefinition }): React.ReactElement {
  // Determine platform-specific modifier key display
  const isMac =
    typeof navigator !== 'undefined' &&
    navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  // Replace command symbol with platform-specific key
  const keyLabel = isMac
    ? shortcut.keyLabel
    : shortcut.keyLabel.replace(/⌘/g, 'Ctrl');

  return (
    <div className="keyboard-shortcut-row" data-testid={`shortcut-${shortcut.action}`}>
      <span className="keyboard-shortcut-description">{shortcut.description}</span>
      <kbd className="keyboard-shortcut-key">{keyLabel}</kbd>
    </div>
  );
}

/**
 * Renders a category section with its shortcuts
 */
function CategorySection({
  title,
  shortcuts,
}: {
  title: string;
  shortcuts: ShortcutDefinition[];
}): React.ReactElement {
  return (
    <div className="keyboard-shortcut-category">
      <h3 className="keyboard-shortcut-category-title">{title}</h3>
      <div className="keyboard-shortcut-list">
        {shortcuts.map((shortcut) => (
          <ShortcutRow key={shortcut.action} shortcut={shortcut} />
        ))}
      </div>
    </div>
  );
}

/**
 * KeyboardShortcutsDialog displays all available keyboard shortcuts.
 *
 * Features:
 * - Organized by category (Playback, Creation, Editing, Navigation)
 * - Platform-specific modifier key display (Cmd on Mac, Ctrl on Windows)
 * - Accessible modal dialog with escape to close
 * - Click outside to close
 *
 * @example
 * ```tsx
 * <KeyboardShortcutsDialog
 *   isOpen={showHelp}
 *   onClose={() => setShowHelp(false)}
 * />
 * ```
 */
export function KeyboardShortcutsDialog({
  isOpen,
  onClose,
}: KeyboardShortcutsDialogProps): React.ReactElement | null {
  log('Rendering dialog:', { isOpen });

  // Handle escape key to close
  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        log('Escape pressed, closing dialog');
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    log('Adding escape key listener');
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      log('Removing escape key listener');
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  const shortcutsByCategory = getShortcutsByCategory();

  // Handle overlay click
  const handleOverlayClick = (event: React.MouseEvent): void => {
    if (event.target === event.currentTarget) {
      log('Overlay clicked, closing dialog');
      onClose();
    }
  };

  return (
    <div
      className="keyboard-shortcuts-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
      data-testid="keyboard-shortcuts-dialog"
    >
      <div className="keyboard-shortcuts-dialog">
        {/* Header */}
        <div className="keyboard-shortcuts-header">
          <h2 id="keyboard-shortcuts-title" className="keyboard-shortcuts-title">
            Keyboard Shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="keyboard-shortcuts-close-button"
            aria-label="Close"
            data-testid="keyboard-shortcuts-close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="keyboard-shortcuts-content">
          <div className="keyboard-shortcuts-grid">
            {Object.entries(shortcutsByCategory).map(([category, shortcuts]) => (
              <CategorySection key={category} title={category} shortcuts={shortcuts} />
            ))}
          </div>

          {/* Footer with hint */}
          <div className="keyboard-shortcuts-footer">
            <p className="keyboard-shortcuts-hint">
              Press <kbd>?</kbd> anytime to show this dialog
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .keyboard-shortcuts-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 1rem;
          animation: fadeIn 0.15s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .keyboard-shortcuts-dialog {
          background-color: var(--color-surface, white);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 560px;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .keyboard-shortcuts-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--color-border, #e5e7eb);
        }

        .keyboard-shortcuts-title {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--color-text-primary, #111827);
        }

        .keyboard-shortcuts-close-button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.375rem;
          background: none;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          color: var(--color-text-secondary, #6b7280);
          transition: all 0.15s;
        }

        .keyboard-shortcuts-close-button:hover {
          background-color: var(--color-hover, #f3f4f6);
          color: var(--color-text-primary, #111827);
        }

        .keyboard-shortcuts-content {
          padding: 1.25rem;
          overflow-y: auto;
        }

        .keyboard-shortcuts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
        }

        .keyboard-shortcut-category {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .keyboard-shortcut-category-title {
          margin: 0;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted, #9ca3af);
        }

        .keyboard-shortcut-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .keyboard-shortcut-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.5rem 0;
        }

        .keyboard-shortcut-description {
          font-size: 0.875rem;
          color: var(--color-text-primary, #374151);
        }

        .keyboard-shortcut-key {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 1.75rem;
          height: 1.5rem;
          padding: 0 0.5rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--color-text-secondary, #4b5563);
          background-color: var(--color-kbd-bg, #f3f4f6);
          border: 1px solid var(--color-kbd-border, #d1d5db);
          border-radius: 4px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          white-space: nowrap;
        }

        .keyboard-shortcuts-footer {
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid var(--color-border, #e5e7eb);
        }

        .keyboard-shortcuts-hint {
          margin: 0;
          font-size: 0.8125rem;
          color: var(--color-text-muted, #9ca3af);
          text-align: center;
        }

        .keyboard-shortcuts-hint kbd {
          margin: 0 0.25rem;
        }

        /* Dark mode support */
        .dark .keyboard-shortcuts-dialog {
          background-color: var(--color-surface-dark, #1f2937);
        }

        .dark .keyboard-shortcuts-title,
        .dark .keyboard-shortcut-description {
          color: var(--color-text-primary-dark, #f9fafb);
        }

        .dark .keyboard-shortcut-category-title,
        .dark .keyboard-shortcuts-hint {
          color: var(--color-text-muted-dark, #9ca3af);
        }

        .dark .keyboard-shortcut-key {
          background-color: var(--color-kbd-bg-dark, #374151);
          border-color: var(--color-kbd-border-dark, #4b5563);
          color: var(--color-text-secondary-dark, #e5e7eb);
        }

        .dark .keyboard-shortcuts-close-button {
          color: var(--color-text-secondary-dark, #9ca3af);
        }

        .dark .keyboard-shortcuts-close-button:hover {
          background-color: var(--color-hover-dark, #374151);
          color: var(--color-text-primary-dark, #f9fafb);
        }

        .dark .keyboard-shortcuts-header,
        .dark .keyboard-shortcuts-footer {
          border-color: var(--color-border-dark, #374151);
        }
      `}</style>
    </div>
  );
}

export default KeyboardShortcutsDialog;
