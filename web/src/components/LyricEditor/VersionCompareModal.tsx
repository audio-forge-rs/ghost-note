/**
 * VersionCompareModal Component
 *
 * A modal dialog for comparing any two lyric versions side-by-side.
 * Features version selection dropdowns, diff visualization, copy functionality,
 * and keyboard navigation between changes.
 *
 * @module components/LyricEditor/VersionCompareModal
 */

import type { ReactElement } from 'react';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { DiffView } from './DiffView';
import { InlineDiff } from './InlineDiff';
import { computeLineDiff } from './diffUtils';
import type { VersionCompareModalProps, DiffViewMode } from './types';
import './VersionCompareModal.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[VersionCompareModal] ${message}`, ...args);
  }
};

/**
 * Represents a selectable version option
 */
interface VersionOption {
  id: string;
  label: string;
  description: string;
  lyrics: string;
  timestamp: number | null;
}

/**
 * Format timestamp to human-readable string
 */
function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get relative time string
 */
function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else if (seconds > 10) {
    return `${seconds}s ago`;
  } else {
    return 'Just now';
  }
}

/**
 * Copy icon SVG component
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
 * Check icon SVG component
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
 * Arrow up icon for navigating to previous change
 */
function ArrowUpIcon(): ReactElement {
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
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

/**
 * Arrow down icon for navigating to next change
 */
function ArrowDownIcon(): ReactElement {
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  );
}

/**
 * Close icon SVG component
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
 * VersionCompareModal provides a full-featured version comparison interface.
 *
 * Features:
 * - Select any two versions to compare (including original)
 * - Side-by-side or inline diff visualization
 * - Highlight differences with clear visual indicators
 * - Copy either version to clipboard
 * - Navigate between changes with keyboard shortcuts
 * - Fully accessible with ARIA labels and keyboard support
 *
 * @example
 * ```tsx
 * <VersionCompareModal
 *   isOpen={showCompare}
 *   onClose={() => setShowCompare(false)}
 *   versions={versions}
 *   originalText={originalPoem}
 * />
 * ```
 */
export function VersionCompareModal({
  isOpen,
  onClose,
  versions,
  originalText,
  initialLeftVersionId,
  initialRightVersionId,
  className = '',
  testId = 'version-compare-modal',
}: VersionCompareModalProps): ReactElement | null {
  // Local state
  const [leftVersionId, setLeftVersionId] = useState<string>(
    initialLeftVersionId ?? 'original'
  );
  const [rightVersionId, setRightVersionId] = useState<string>(
    initialRightVersionId ?? (versions.length > 0 ? versions[versions.length - 1].id : 'original')
  );
  const [diffViewMode, setDiffViewMode] = useState<DiffViewMode>('side-by-side');
  const [copiedSide, setCopiedSide] = useState<'left' | 'right' | null>(null);
  const [currentChangeIndex, setCurrentChangeIndex] = useState<number>(0);

  // Refs
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const leftSelectRef = useRef<HTMLSelectElement>(null);
  const previousActiveElementRef = useRef<Element | null>(null);
  const diffContainerRef = useRef<HTMLDivElement>(null);

  log('Rendering VersionCompareModal', {
    isOpen,
    leftVersionId,
    rightVersionId,
    versionCount: versions.length,
  });

  // Build version options array
  const versionOptions: VersionOption[] = useMemo(() => {
    const options: VersionOption[] = [
      {
        id: 'original',
        label: 'Original',
        description: 'Original poem',
        lyrics: originalText,
        timestamp: null,
      },
    ];

    // Sort versions by timestamp (newest first) for display
    const sortedVersions = [...versions].sort((a, b) => b.timestamp - a.timestamp);

    sortedVersions.forEach((version) => {
      const originalIndex = versions.findIndex((v) => v.id === version.id);
      options.push({
        id: version.id,
        label: version.description ?? `Version ${originalIndex + 1}`,
        description: version.timestamp ? getRelativeTime(version.timestamp) : '',
        lyrics: version.lyrics,
        timestamp: version.timestamp,
      });
    });

    return options;
  }, [versions, originalText]);

  // Get selected versions
  const leftVersion = useMemo(
    () => versionOptions.find((v) => v.id === leftVersionId) ?? versionOptions[0],
    [versionOptions, leftVersionId]
  );

  const rightVersion = useMemo(
    () => versionOptions.find((v) => v.id === rightVersionId) ?? versionOptions[0],
    [versionOptions, rightVersionId]
  );

  // Compute diff result for change navigation
  const diffResult = useMemo(() => {
    return computeLineDiff(leftVersion.lyrics, rightVersion.lyrics);
  }, [leftVersion.lyrics, rightVersion.lyrics]);

  // Count actual changes (non-equal)
  const changeCount = useMemo(() => {
    return diffResult.changes.filter((c) => c.type !== 'equal').length;
  }, [diffResult.changes]);

  // Track the previous isOpen state to detect open/close transitions
  const wasOpenRef = useRef(false);

  // Reset selections when modal opens (transition from closed to open)
  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isOpen;

    // Only reset when transitioning from closed to open
    if (isOpen && !wasOpen) {
      log('Modal opened, resetting state');
      // We defer the state reset to avoid synchronous setState in effect
      // by using requestAnimationFrame which runs outside the effect cycle
      requestAnimationFrame(() => {
        const newLeftId = initialLeftVersionId ?? 'original';
        const newRightId =
          initialRightVersionId ?? (versions.length > 0 ? versions[versions.length - 1].id : 'original');

        setLeftVersionId(newLeftId);
        setRightVersionId(newRightId);
        setCurrentChangeIndex(0);
        setCopiedSide(null);

        log('Modal state reset:', { newLeftId, newRightId });
      });
    }
  }, [isOpen, initialLeftVersionId, initialRightVersionId, versions]);

  // Store previously focused element when dialog opens
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement;
      log('Stored previous active element:', previousActiveElementRef.current);
    }
  }, [isOpen]);

  // Focus management - focus left select when dialog opens
  useEffect(() => {
    if (isOpen && leftSelectRef.current) {
      const timeoutId = setTimeout(() => {
        leftSelectRef.current?.focus();
        log('Focused left select');
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

  // Scroll to a specific change
  const scrollToChange = useCallback(
    (index: number): void => {
      if (!diffContainerRef.current) return;

      // Find changed rows in the diff view
      const changedRows = diffContainerRef.current.querySelectorAll(
        '.diff-view__line-content--add, .diff-view__line-content--remove, ' +
          '.inline-diff__change--add, .inline-diff__change--remove'
      );

      const element = changedRows[index] as HTMLElement | undefined;
      if (element && typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        log('Scrolled to change:', index);
      }
    },
    []
  );

  // Navigate to next change
  const handleNextChange = useCallback((): void => {
    if (changeCount === 0) return;
    const nextIndex = (currentChangeIndex + 1) % changeCount;
    log('Navigating to next change:', nextIndex);
    setCurrentChangeIndex(nextIndex);

    // Scroll to the change
    scrollToChange(nextIndex);
  }, [changeCount, currentChangeIndex, scrollToChange]);

  // Navigate to previous change
  const handlePrevChange = useCallback((): void => {
    if (changeCount === 0) return;
    const prevIndex = currentChangeIndex === 0 ? changeCount - 1 : currentChangeIndex - 1;
    log('Navigating to previous change:', prevIndex);
    setCurrentChangeIndex(prevIndex);

    // Scroll to the change
    scrollToChange(prevIndex);
  }, [changeCount, currentChangeIndex, scrollToChange]);

  // Keyboard handling
  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      if (!isOpen) return;

      log('Key pressed:', event.key);

      // Escape to close
      if (event.key === 'Escape') {
        event.preventDefault();
        log('Escape pressed, closing modal');
        onClose();
        return;
      }

      // Navigate changes with J/K or arrow keys (when not in select)
      const activeElement = document.activeElement;
      const isInSelect = activeElement?.tagName === 'SELECT';

      if (!isInSelect) {
        if (event.key === 'j' || event.key === 'ArrowDown') {
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleNextChange();
          }
        } else if (event.key === 'k' || event.key === 'ArrowUp') {
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handlePrevChange();
          }
        }
      }

      // Tab focus trap
      if (event.key === 'Tab') {
        const focusableElements = dialogRef.current?.querySelectorAll(
          'button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
            log('Focus wrapped to last element');
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
            log('Focus wrapped to first element');
          }
        }
      }
    },
    [isOpen, onClose, handleNextChange, handlePrevChange]
  );

  // Add keyboard listeners
  useEffect(() => {
    if (!isOpen) return;

    log('Adding keyboard listeners');
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      log('Removing keyboard listeners');
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      log('Prevented body scroll');

      return () => {
        document.body.style.overflow = previousOverflow;
        log('Restored body scroll');
      };
    }
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = useCallback(
    (event: React.MouseEvent): void => {
      if (event.target === event.currentTarget) {
        log('Overlay clicked, closing modal');
        onClose();
      }
    },
    [onClose]
  );

  // Handle close button click
  const handleClose = useCallback((): void => {
    log('Close button clicked');
    onClose();
  }, [onClose]);

  // Handle left version change
  const handleLeftVersionChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>): void => {
      const newId = event.target.value;
      log('Left version changed to:', newId);
      setLeftVersionId(newId);
      setCurrentChangeIndex(0);
    },
    []
  );

  // Handle right version change
  const handleRightVersionChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>): void => {
      const newId = event.target.value;
      log('Right version changed to:', newId);
      setRightVersionId(newId);
      setCurrentChangeIndex(0);
    },
    []
  );

  // Swap versions
  const handleSwapVersions = useCallback((): void => {
    log('Swapping versions');
    const temp = leftVersionId;
    setLeftVersionId(rightVersionId);
    setRightVersionId(temp);
    setCurrentChangeIndex(0);
  }, [leftVersionId, rightVersionId]);

  // Toggle diff view mode
  const handleToggleDiffMode = useCallback((): void => {
    const newMode = diffViewMode === 'side-by-side' ? 'inline' : 'side-by-side';
    log('Toggling diff mode to:', newMode);
    setDiffViewMode(newMode);
  }, [diffViewMode]);

  // Copy left version to clipboard
  const handleCopyLeft = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(leftVersion.lyrics);
      log('Copied left version to clipboard');
      setCopiedSide('left');
      setTimeout(() => setCopiedSide(null), 2000);
    } catch (error) {
      log('Failed to copy left version:', error);
    }
  }, [leftVersion.lyrics]);

  // Copy right version to clipboard
  const handleCopyRight = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(rightVersion.lyrics);
      log('Copied right version to clipboard');
      setCopiedSide('right');
      setTimeout(() => setCopiedSide(null), 2000);
    } catch (error) {
      log('Failed to copy right version:', error);
    }
  }, [rightVersion.lyrics]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  const containerClass = [
    'version-compare-modal',
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <div
      className="version-compare-modal__overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="version-compare-modal-title"
      data-testid={testId}
    >
      <div
        ref={dialogRef}
        className={containerClass}
        data-testid={`${testId}-content`}
      >
        {/* Header */}
        <header className="version-compare-modal__header">
          <h2
            id="version-compare-modal-title"
            className="version-compare-modal__title"
          >
            Compare Versions
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="version-compare-modal__close"
            onClick={handleClose}
            aria-label="Close comparison modal"
            data-testid={`${testId}-close`}
          >
            <CloseIcon />
          </button>
        </header>

        {/* Version selectors */}
        <div className="version-compare-modal__selectors">
          {/* Left version selector */}
          <div className="version-compare-modal__selector">
            <label
              htmlFor="left-version-select"
              className="version-compare-modal__selector-label"
            >
              Left (Base)
            </label>
            <select
              ref={leftSelectRef}
              id="left-version-select"
              className="version-compare-modal__select"
              value={leftVersionId}
              onChange={handleLeftVersionChange}
              aria-label="Select left version to compare"
              data-testid={`${testId}-left-select`}
            >
              {versionOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                  {option.timestamp ? ` (${option.description})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Swap button */}
          <button
            type="button"
            className="version-compare-modal__swap"
            onClick={handleSwapVersions}
            aria-label="Swap left and right versions"
            title="Swap versions"
            data-testid={`${testId}-swap`}
          >
            ⇄
          </button>

          {/* Right version selector */}
          <div className="version-compare-modal__selector">
            <label
              htmlFor="right-version-select"
              className="version-compare-modal__selector-label"
            >
              Right (Compare)
            </label>
            <select
              id="right-version-select"
              className="version-compare-modal__select"
              value={rightVersionId}
              onChange={handleRightVersionChange}
              aria-label="Select right version to compare"
              data-testid={`${testId}-right-select`}
            >
              {versionOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                  {option.timestamp ? ` (${option.description})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Toolbar */}
        <div className="version-compare-modal__toolbar">
          {/* View mode toggle */}
          <button
            type="button"
            className="version-compare-modal__toolbar-btn"
            onClick={handleToggleDiffMode}
            aria-label={`Switch to ${diffViewMode === 'side-by-side' ? 'inline' : 'side-by-side'} view`}
            data-testid={`${testId}-toggle-mode`}
          >
            {diffViewMode === 'side-by-side' ? 'Inline View' : 'Side-by-Side'}
          </button>

          {/* Change navigation */}
          <div
            className="version-compare-modal__nav"
            role="navigation"
            aria-label="Navigate between changes"
          >
            <button
              type="button"
              className="version-compare-modal__nav-btn"
              onClick={handlePrevChange}
              disabled={changeCount === 0}
              aria-label="Go to previous change"
              title="Previous change (Ctrl+K)"
              data-testid={`${testId}-prev-change`}
            >
              <ArrowUpIcon />
            </button>
            <span
              className="version-compare-modal__nav-counter"
              aria-live="polite"
              data-testid={`${testId}-change-counter`}
            >
              {changeCount > 0 ? `${currentChangeIndex + 1} / ${changeCount}` : 'No changes'}
            </span>
            <button
              type="button"
              className="version-compare-modal__nav-btn"
              onClick={handleNextChange}
              disabled={changeCount === 0}
              aria-label="Go to next change"
              title="Next change (Ctrl+J)"
              data-testid={`${testId}-next-change`}
            >
              <ArrowDownIcon />
            </button>
          </div>

          {/* Copy buttons */}
          <div className="version-compare-modal__copy-actions">
            <button
              type="button"
              className={`version-compare-modal__copy-btn ${copiedSide === 'left' ? 'version-compare-modal__copy-btn--copied' : ''}`}
              onClick={handleCopyLeft}
              aria-label={`Copy ${leftVersion.label} to clipboard`}
              title={`Copy ${leftVersion.label}`}
              data-testid={`${testId}-copy-left`}
            >
              {copiedSide === 'left' ? <CheckIcon /> : <CopyIcon />}
              <span>Copy Left</span>
            </button>
            <button
              type="button"
              className={`version-compare-modal__copy-btn ${copiedSide === 'right' ? 'version-compare-modal__copy-btn--copied' : ''}`}
              onClick={handleCopyRight}
              aria-label={`Copy ${rightVersion.label} to clipboard`}
              title={`Copy ${rightVersion.label}`}
              data-testid={`${testId}-copy-right`}
            >
              {copiedSide === 'right' ? <CheckIcon /> : <CopyIcon />}
              <span>Copy Right</span>
            </button>
          </div>
        </div>

        {/* Diff view */}
        <div
          ref={diffContainerRef}
          className="version-compare-modal__diff"
          data-testid={`${testId}-diff`}
        >
          {leftVersionId === rightVersionId ? (
            <div
              className="version-compare-modal__same-version"
              data-testid={`${testId}-same-version`}
            >
              <p>Both sides are showing the same version.</p>
              <p>Select different versions to compare.</p>
            </div>
          ) : diffViewMode === 'side-by-side' ? (
            <DiffView
              originalText={leftVersion.lyrics}
              modifiedText={rightVersion.lyrics}
              testId={`${testId}-diff-view`}
            />
          ) : (
            <InlineDiff
              originalText={leftVersion.lyrics}
              modifiedText={rightVersion.lyrics}
              showLineNumbers
              testId={`${testId}-inline-diff`}
            />
          )}
        </div>

        {/* Footer with version info */}
        <footer className="version-compare-modal__footer">
          <div className="version-compare-modal__footer-info">
            <span className="version-compare-modal__footer-label">Left:</span>
            <span className="version-compare-modal__footer-value">
              {leftVersion.label}
              {leftVersion.timestamp && (
                <span
                  className="version-compare-modal__footer-time"
                  title={formatTimestamp(leftVersion.timestamp)}
                >
                  {' '}
                  ({leftVersion.description})
                </span>
              )}
            </span>
          </div>
          <div className="version-compare-modal__footer-info">
            <span className="version-compare-modal__footer-label">Right:</span>
            <span className="version-compare-modal__footer-value">
              {rightVersion.label}
              {rightVersion.timestamp && (
                <span
                  className="version-compare-modal__footer-time"
                  title={formatTimestamp(rightVersion.timestamp)}
                >
                  {' '}
                  ({rightVersion.description})
                </span>
              )}
            </span>
          </div>
        </footer>

        {/* Keyboard shortcuts hint */}
        <div className="version-compare-modal__hints" aria-hidden="true">
          <span className="version-compare-modal__hint">
            <kbd>Esc</kbd> Close
          </span>
          <span className="version-compare-modal__hint">
            <kbd>Ctrl</kbd>+<kbd>↑</kbd>/<kbd>↓</kbd> Navigate changes
          </span>
        </div>
      </div>
    </div>
  );
}

export default VersionCompareModal;
