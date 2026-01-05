/**
 * ShareDialog Component
 *
 * A modal dialog for generating and copying share links.
 * Supports different share modes (poem-only, with-analysis, full).
 *
 * @module components/Share/ShareDialog
 */

import { useState, useEffect, useCallback, useRef, type ReactElement } from 'react';
import { usePoemStore, selectHasPoem } from '@/stores/usePoemStore';
import { useAnalysisStore, selectHasAnalysis } from '@/stores/useAnalysisStore';
import { useMelodyStore, selectHasMelody } from '@/stores/useMelodyStore';
import { useToastStore } from '@/stores/useToastStore';
import { generateShareUrl, copyShareUrlToClipboard } from '@/lib/share';
import type { ShareMode, ShareEncodeResult } from '@/lib/share';
import './ShareDialog.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[ShareDialog] ${message}`, ...args);
  }
};

/**
 * Props for the ShareDialog component
 */
export interface ShareDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when the dialog should be closed */
  onClose: () => void;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Link icon for share button
 */
function LinkIcon(): ReactElement {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

/**
 * Copy icon
 */
function CopyIcon(): ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

/**
 * Check icon (for copied state)
 */
function CheckIcon(): ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * Close/X icon
 */
function CloseIcon(): ReactElement {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/**
 * Loading spinner
 */
function LoadingSpinner(): ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="share-dialog__spinner"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

/**
 * Share mode option configuration
 */
interface ShareModeOption {
  mode: ShareMode;
  label: string;
  description: string;
  requiresAnalysis?: boolean;
  requiresMelody?: boolean;
}

const SHARE_MODES: ShareModeOption[] = [
  {
    mode: 'poem-only',
    label: 'Poem Only',
    description: 'Share just the poem text (smallest URL)',
  },
  {
    mode: 'with-analysis',
    label: 'With Analysis',
    description: 'Include analysis results with the poem',
    requiresAnalysis: true,
  },
  {
    mode: 'full',
    label: 'Full Project',
    description: 'Include all versions, analysis, and melody',
    requiresAnalysis: false, // Analysis is optional for full mode
    requiresMelody: false,   // Melody is optional for full mode
  },
];

/**
 * ShareDialog provides a modal for generating and copying share links.
 *
 * Features:
 * - Multiple share modes (poem-only, with-analysis, full)
 * - URL generation with compression
 * - Copy to clipboard functionality
 * - URL length warnings
 * - Keyboard accessible
 * - Privacy note about URL visibility
 *
 * @example
 * ```tsx
 * <ShareDialog
 *   isOpen={showShareDialog}
 *   onClose={() => setShowShareDialog(false)}
 * />
 * ```
 */
export function ShareDialog({
  isOpen,
  onClose,
  testId = 'share-dialog',
}: ShareDialogProps): ReactElement | null {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<Element | null>(null);

  // State
  const [selectedMode, setSelectedMode] = useState<ShareMode>('poem-only');
  const [shareResult, setShareResult] = useState<ShareEncodeResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Store state
  const hasPoem = usePoemStore(selectHasPoem);
  const hasAnalysis = useAnalysisStore(selectHasAnalysis);
  const hasMelody = useMelodyStore(selectHasMelody);
  const addToast = useToastStore((state) => state.addToast);

  log('Rendering ShareDialog:', {
    isOpen,
    selectedMode,
    hasPoem,
    hasAnalysis,
    hasMelody,
  });

  // Store the previously focused element when dialog opens
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement;
      log('Stored previous active element:', previousActiveElementRef.current);
    }
  }, [isOpen]);

  // Focus close button when dialog opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      const timeoutId = setTimeout(() => {
        closeButtonRef.current?.focus();
        log('Focused close button');
      }, 10);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  // Restore focus when dialog closes
  useEffect(() => {
    if (!isOpen && previousActiveElementRef.current) {
      const elementToFocus = previousActiveElementRef.current as HTMLElement;
      if (elementToFocus && typeof elementToFocus.focus === 'function') {
        const timeoutId = setTimeout(() => {
          elementToFocus.focus();
          log('Restored focus to previous element');
        }, 10);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [isOpen]);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setShareResult(null);
      setCopied(false);
      // Auto-select best available mode
      if (hasAnalysis && hasMelody) {
        setSelectedMode('full');
      } else if (hasAnalysis) {
        setSelectedMode('with-analysis');
      } else {
        setSelectedMode('poem-only');
      }
    }
  }, [isOpen, hasAnalysis, hasMelody]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        log('Escape pressed, closing dialog');
        event.preventDefault();
        onClose();
        return;
      }

      // Focus trap
      if (event.key === 'Tab') {
        const focusableElements = dialogRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [isOpen]);

  // Generate share URL
  const handleGenerateLink = useCallback(async () => {
    log('Generating share link:', { mode: selectedMode });
    setIsGenerating(true);
    setCopied(false);

    try {
      const result = await generateShareUrl({ mode: selectedMode });
      setShareResult(result);
      log('Share link generated:', result);

      if (result.success && result.url) {
        addToast('Share link generated', { type: 'success', duration: 3000 });
      } else if (!result.success) {
        addToast(result.error || 'Failed to generate link', { type: 'error' });
      }
    } catch (error) {
      log('Error generating share link:', error);
      addToast('Failed to generate share link', { type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  }, [selectedMode, addToast]);

  // Copy URL to clipboard
  const handleCopyLink = useCallback(async () => {
    if (!shareResult?.url) return;

    log('Copying share link to clipboard');
    const success = await copyShareUrlToClipboard(shareResult.url);

    if (success) {
      setCopied(true);
      addToast('Link copied to clipboard', { type: 'success', duration: 2000 });
      // Reset copied state after 3 seconds
      setTimeout(() => setCopied(false), 3000);
    } else {
      addToast('Failed to copy link', { type: 'error' });
    }
  }, [shareResult?.url, addToast]);

  // Handle overlay click
  const handleOverlayClick = useCallback(
    (event: React.MouseEvent): void => {
      if (event.target === event.currentTarget) {
        log('Overlay clicked, closing dialog');
        onClose();
      }
    },
    [onClose]
  );

  // Check if mode is available
  const isModeAvailable = (modeOption: ShareModeOption): boolean => {
    if (modeOption.requiresAnalysis && !hasAnalysis) return false;
    if (modeOption.requiresMelody && !hasMelody) return false;
    return true;
  };

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  // Don't render if no poem
  if (!hasPoem) {
    return (
      <div
        className="share-dialog__overlay"
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-dialog-title"
        data-testid={testId}
      >
        <div
          ref={dialogRef}
          className="share-dialog"
          data-testid={`${testId}-content`}
        >
          <div className="share-dialog__header">
            <h2 id="share-dialog-title" className="share-dialog__title">
              <LinkIcon />
              Share Poem
            </h2>
            <button
              ref={closeButtonRef}
              type="button"
              className="share-dialog__close-button"
              onClick={onClose}
              aria-label="Close"
              data-testid={`${testId}-close`}
            >
              <CloseIcon />
            </button>
          </div>
          <div className="share-dialog__content">
            <p className="share-dialog__empty-message">
              Enter a poem first to generate a share link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="share-dialog__overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-dialog-title"
      data-testid={testId}
    >
      <div
        ref={dialogRef}
        className="share-dialog"
        data-testid={`${testId}-content`}
      >
        {/* Header */}
        <div className="share-dialog__header">
          <h2 id="share-dialog-title" className="share-dialog__title">
            <LinkIcon />
            Share Poem
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="share-dialog__close-button"
            onClick={onClose}
            aria-label="Close"
            data-testid={`${testId}-close`}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="share-dialog__content">
          {/* Mode Selection */}
          <div className="share-dialog__section">
            <label className="share-dialog__section-label">
              Share Mode
            </label>
            <div className="share-dialog__mode-options">
              {SHARE_MODES.map((modeOption) => {
                const isAvailable = isModeAvailable(modeOption);
                const isSelected = selectedMode === modeOption.mode;

                return (
                  <label
                    key={modeOption.mode}
                    className={`share-dialog__mode-option ${
                      isSelected ? 'share-dialog__mode-option--selected' : ''
                    } ${!isAvailable ? 'share-dialog__mode-option--disabled' : ''}`}
                    data-testid={`${testId}-mode-${modeOption.mode}`}
                  >
                    <input
                      type="radio"
                      name="shareMode"
                      value={modeOption.mode}
                      checked={isSelected}
                      disabled={!isAvailable}
                      onChange={() => {
                        setSelectedMode(modeOption.mode);
                        setShareResult(null);
                        setCopied(false);
                      }}
                      className="share-dialog__mode-radio"
                    />
                    <div className="share-dialog__mode-content">
                      <span className="share-dialog__mode-label">
                        {modeOption.label}
                      </span>
                      <span className="share-dialog__mode-description">
                        {modeOption.description}
                        {!isAvailable && modeOption.requiresAnalysis && (
                          <span className="share-dialog__mode-unavailable">
                            {' '}(requires analysis)
                          </span>
                        )}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Generate Button */}
          <button
            type="button"
            className="share-dialog__generate-button"
            onClick={handleGenerateLink}
            disabled={isGenerating}
            data-testid={`${testId}-generate`}
          >
            {isGenerating ? (
              <>
                <LoadingSpinner />
                Generating...
              </>
            ) : (
              <>
                <LinkIcon />
                Generate Link
              </>
            )}
          </button>

          {/* Share URL Result */}
          {shareResult && shareResult.success && shareResult.url && (
            <div className="share-dialog__result" data-testid={`${testId}-result`}>
              <label className="share-dialog__section-label">
                Share Link
              </label>
              <div className="share-dialog__url-container">
                <input
                  type="text"
                  value={shareResult.url}
                  readOnly
                  className="share-dialog__url-input"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  data-testid={`${testId}-url`}
                />
                <button
                  type="button"
                  className={`share-dialog__copy-button ${copied ? 'share-dialog__copy-button--copied' : ''}`}
                  onClick={handleCopyLink}
                  aria-label={copied ? 'Copied!' : 'Copy link'}
                  data-testid={`${testId}-copy`}
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* URL Stats */}
              <div className="share-dialog__stats">
                <span className="share-dialog__stat">
                  URL Length: {shareResult.url.length} chars
                </span>
                {shareResult.compressed && (
                  <span className="share-dialog__stat share-dialog__stat--info">
                    Compressed
                  </span>
                )}
              </div>

              {/* Warning for long URLs */}
              {shareResult.error && (
                <p className="share-dialog__warning" data-testid={`${testId}-warning`}>
                  {shareResult.error}
                </p>
              )}
            </div>
          )}

          {/* Error Result */}
          {shareResult && !shareResult.success && (
            <div className="share-dialog__error" data-testid={`${testId}-error`}>
              <p>{shareResult.error}</p>
            </div>
          )}

          {/* Privacy Note */}
          <div className="share-dialog__privacy-note">
            <p>
              <strong>Privacy Note:</strong> The poem content will be encoded in the URL.
              Anyone with the link can view the shared content. The URL will also be
              visible in browser history.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShareDialog;
