/**
 * PoemToolbar Component
 *
 * A toolbar with actions for the poem input: clear, paste, and sample poem selection.
 *
 * @module components/PoemInput/PoemToolbar
 */

import { type ReactElement, useState, useCallback, useRef, useEffect } from 'react';
import { ConfirmDialog } from '@/components/Common';
import './PoemToolbar.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[PoemToolbar] ${message}`, ...args);
  }
};

/**
 * Props for the PoemToolbar component
 */
export interface PoemToolbarProps {
  /** Callback when clear button is clicked */
  onClear: () => void;
  /** Callback when paste button is clicked */
  onPaste: () => void;
  /** Callback when sample button is clicked (opens sample picker) */
  onSampleClick: () => void;
  /** Callback when analyze button is clicked */
  onAnalyze: () => void;
  /** Whether there is text to clear */
  hasText: boolean;
  /** Whether the analyze button should be enabled */
  canAnalyze: boolean;
  /** Whether the toolbar is disabled */
  disabled?: boolean;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Clipboard icon
 */
function ClipboardIcon(): ReactElement {
  return (
    <svg
      className="toolbar-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

/**
 * Clear/Trash icon
 */
function ClearIcon(): ReactElement {
  return (
    <svg
      className="toolbar-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

/**
 * Book/Sample icon
 */
function SampleIcon(): ReactElement {
  return (
    <svg
      className="toolbar-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8" />
      <path d="M8 11h6" />
    </svg>
  );
}

/**
 * Analyze/Play icon
 */
function AnalyzeIcon(): ReactElement {
  return (
    <svg
      className="toolbar-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
    </svg>
  );
}

/**
 * PoemToolbar provides action buttons for poem input management.
 *
 * Features:
 * - Clear button to reset the poem text
 * - Paste button to paste from clipboard
 * - Sample button to select from sample poems
 * - Analyze button to start poem analysis
 * - Keyboard accessible with proper ARIA attributes
 *
 * @example
 * ```tsx
 * <PoemToolbar
 *   onClear={handleClear}
 *   onPaste={handlePaste}
 *   onSampleClick={openSamplePicker}
 *   onAnalyze={handleAnalyze}
 *   hasText={poemText.length > 0}
 *   canAnalyze={poemText.trim().length > 10}
 * />
 * ```
 */
export function PoemToolbar({
  onClear,
  onPaste,
  onSampleClick,
  onAnalyze,
  hasText,
  canAnalyze,
  disabled = false,
  className = '',
}: PoemToolbarProps): ReactElement {
  const [isPasting, setIsPasting] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const pasteButtonRef = useRef<HTMLButtonElement>(null);

  log('Rendering PoemToolbar:', { hasText, canAnalyze, disabled });

  // Clear paste error after a delay
  useEffect(() => {
    if (pasteError) {
      const timer = setTimeout(() => setPasteError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [pasteError]);

  // Handle paste from clipboard
  const handlePasteClick = useCallback(async () => {
    log('Paste button clicked');
    setIsPasting(true);
    setPasteError(null);

    try {
      // Check if clipboard API is available
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        log('Clipboard API not available, falling back to callback');
        onPaste();
        return;
      }

      // Try to read from clipboard
      const text = await navigator.clipboard.readText();
      if (text) {
        log('Got text from clipboard, length:', text.length);
        // Trigger the paste via the callback
        // The parent will handle inserting the text
        onPaste();
      } else {
        log('Clipboard is empty');
        setPasteError('Clipboard is empty');
      }
    } catch (error) {
      log('Clipboard read failed:', error);
      // Fall back to triggering the paste callback
      // which may prompt a focus on the textarea
      onPaste();
    } finally {
      setIsPasting(false);
    }
  }, [onPaste]);

  // Handle clear - show confirmation dialog
  const handleClearClick = useCallback(() => {
    log('Opening clear confirmation dialog');
    setShowClearDialog(true);
  }, []);

  // Handle confirm clear
  const handleConfirmClear = useCallback(() => {
    log('Clear confirmed');
    onClear();
    setShowClearDialog(false);
  }, [onClear]);

  // Handle cancel clear
  const handleCancelClear = useCallback(() => {
    log('Clear cancelled');
    setShowClearDialog(false);
  }, []);

  // Handle sample picker
  const handleSampleClick = useCallback(() => {
    log('Sample button clicked');
    onSampleClick();
  }, [onSampleClick]);

  // Handle analyze
  const handleAnalyzeClick = useCallback(() => {
    log('Analyze button clicked');
    onAnalyze();
  }, [onAnalyze]);

  const containerClass = ['poem-toolbar', className].filter(Boolean).join(' ').trim();

  return (
    <div className={containerClass} data-testid="poem-toolbar" role="toolbar" aria-label="Poem input actions">
      {/* Left side: utility buttons */}
      <div className="poem-toolbar__left">
        {/* Paste button */}
        <button
          ref={pasteButtonRef}
          type="button"
          className="poem-toolbar__button poem-toolbar__button--secondary"
          onClick={handlePasteClick}
          disabled={disabled || isPasting}
          aria-label="Paste from clipboard"
          title="Paste from clipboard"
          data-testid="paste-button"
        >
          <ClipboardIcon />
          <span className="poem-toolbar__button-text">Paste</span>
        </button>

        {/* Sample poems button */}
        <button
          type="button"
          className="poem-toolbar__button poem-toolbar__button--secondary"
          onClick={handleSampleClick}
          disabled={disabled}
          aria-label="Choose a sample poem"
          title="Choose a sample poem"
          data-testid="sample-button"
        >
          <SampleIcon />
          <span className="poem-toolbar__button-text">Samples</span>
        </button>

        {/* Clear button */}
        <button
          type="button"
          className="poem-toolbar__button poem-toolbar__button--danger"
          onClick={handleClearClick}
          disabled={disabled || !hasText}
          aria-label="Clear poem text"
          title="Clear poem text"
          data-testid="clear-button"
        >
          <ClearIcon />
          <span className="poem-toolbar__button-text">Clear</span>
        </button>
      </div>

      {/* Paste error message */}
      {pasteError && (
        <div className="poem-toolbar__error" role="alert" aria-live="polite">
          {pasteError}
        </div>
      )}

      {/* Right side: primary action */}
      <div className="poem-toolbar__right">
        <button
          type="button"
          className="poem-toolbar__button poem-toolbar__button--primary"
          onClick={handleAnalyzeClick}
          disabled={disabled || !canAnalyze}
          aria-label="Analyze poem"
          title="Analyze poem"
          data-testid="analyze-button"
        >
          <AnalyzeIcon />
          <span className="poem-toolbar__button-text">Analyze</span>
        </button>
      </div>

      {/* Clear confirmation dialog */}
      <ConfirmDialog
        isOpen={showClearDialog}
        onClose={handleCancelClear}
        onConfirm={handleConfirmClear}
        title="Clear Poem"
        message="Are you sure you want to clear the poem? All text will be removed and any unsaved analysis will be lost."
        confirmText="Clear"
        cancelText="Cancel"
        variant="warning"
        testId="clear-poem-dialog"
      />
    </div>
  );
}

export default PoemToolbar;
