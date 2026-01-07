/**
 * SamplePoems Component
 *
 * A dropdown/modal component for selecting sample poems.
 * Provides a compact view for the toolbar integration.
 *
 * @module components/PoemInput/SamplePoems
 */

import {
  type ReactElement,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import {
  samplePoems,
  type SamplePoem,
} from '@/data/samplePoems';
import './SamplePoems.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[SamplePoems] ${message}`, ...args);
  }
};

/**
 * Props for the SamplePoems component
 */
export interface SamplePoemsProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when a poem is selected */
  onSelect: (poem: SamplePoem) => void;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Close icon
 */
function CloseIcon(): ReactElement {
  return (
    <svg
      className="sample-poems-icon"
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
 * Formats a form name for display
 */
function formatFormName(form: string): string {
  return form
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * SamplePoems provides a modal for selecting sample poems.
 *
 * Features:
 * - List of sample poems with title and author
 * - Preview of selected poem
 * - Keyboard navigation and accessibility
 * - Click outside to close
 *
 * @example
 * ```tsx
 * <SamplePoems
 *   isOpen={showSamplePicker}
 *   onClose={() => setShowSamplePicker(false)}
 *   onSelect={(poem) => {
 *     setPoemText(poem.text);
 *     setShowSamplePicker(false);
 *   }}
 * />
 * ```
 */
export function SamplePoems({
  isOpen,
  onClose,
  onSelect,
  className = '',
}: SamplePoemsProps): ReactElement | null {
  // Use key reset pattern - when isOpen changes to true, reset selection
  // This avoids the need for useEffect with setState
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Get the poem to preview
  const previewIndex = hoveredIndex ?? selectedIndex;
  const previewPoem = samplePoems[previewIndex];

  log('Rendering SamplePoems:', { isOpen, selectedIndex, previewIndex });

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        log('Escape pressed, closing modal');
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent): void => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        log('Click outside, closing modal');
        onClose();
      }
    };

    // Delay adding listener to prevent immediate close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle poem selection
  const handleSelectPoem = useCallback(
    (poem: SamplePoem) => {
      log('Poem selected:', poem.title);
      onSelect(poem);
    },
    [onSelect]
  );

  // Focus trap and keyboard navigation
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < samplePoems.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          handleSelectPoem(samplePoems[selectedIndex]);
          break;
        case 'Home':
          e.preventDefault();
          setSelectedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setSelectedIndex(samplePoems.length - 1);
          break;
      }
    };

    modalRef.current.addEventListener('keydown', handleKeyDown);
    const currentRef = modalRef.current;

    return () => {
      currentRef.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, selectedIndex, handleSelectPoem]);

  // Scroll selected item into view
  useEffect(() => {
    if (!isOpen || !listRef.current) return;

    const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
    if (selectedElement && typeof selectedElement.scrollIntoView === 'function') {
      selectedElement.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [isOpen, selectedIndex]);

  // Get truncated preview text
  const previewText = useMemo(() => {
    if (!previewPoem) return '';
    const lines = previewPoem.text.split('\n');
    const maxLines = 12;
    if (lines.length <= maxLines) {
      return previewPoem.text;
    }
    return lines.slice(0, maxLines).join('\n') + '\n...';
  }, [previewPoem]);

  if (!isOpen) {
    return null;
  }

  const containerClass = ['sample-poems-overlay', className]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <div className={containerClass} data-testid="sample-poems-overlay" role="dialog" aria-modal="true" aria-label="Select a sample poem">
      <div
        ref={modalRef}
        className="sample-poems-modal"
        data-testid="sample-poems-modal"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="sample-poems-header">
          <h2 className="sample-poems-title">Sample Poems</h2>
          <button
            type="button"
            className="sample-poems-close"
            onClick={onClose}
            aria-label="Close"
            data-testid="sample-poems-close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="sample-poems-content">
          {/* Poem list */}
          <div
            ref={listRef}
            className="sample-poems-list"
            role="listbox"
            aria-label="Sample poems"
            data-testid="sample-poems-list"
          >
            {samplePoems.map((poem, index) => (
              <div
                key={poem.id}
                role="option"
                aria-selected={selectedIndex === index}
                className={`sample-poems-item ${selectedIndex === index ? 'selected' : ''}`}
                onClick={() => setSelectedIndex(index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                data-testid={`sample-poem-${poem.id}`}
              >
                <div className="sample-poems-item-title">{poem.title}</div>
                <div className="sample-poems-item-meta">
                  <span className="sample-poems-item-author">{poem.author}</span>
                  <span className="sample-poems-item-form">{formatFormName(poem.form)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Preview panel */}
          {previewPoem && (
            <div className="sample-poems-preview" data-testid="sample-poems-preview">
              <div className="sample-poems-preview-header">
                <h3 className="sample-poems-preview-title">{previewPoem.title}</h3>
                <p className="sample-poems-preview-author">
                  by {previewPoem.author}
                  {previewPoem.year && ` (${previewPoem.year})`}
                </p>
              </div>

              <pre className="sample-poems-preview-text">{previewText}</pre>

              <div className="sample-poems-preview-footer">
                <p className="sample-poems-preview-description">
                  {previewPoem.description}
                </p>
                <div className="sample-poems-preview-tags">
                  <span className="sample-poems-tag">{formatFormName(previewPoem.form)}</span>
                  <span className="sample-poems-tag">{previewPoem.expectedMeter.name}</span>
                </div>

                <button
                  type="button"
                  className="sample-poems-select-button"
                  onClick={() => handleSelectPoem(previewPoem)}
                  data-testid="sample-poems-select"
                >
                  Use This Poem
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sample-poems-footer">
          <span className="sample-poems-count">
            {samplePoems.length} sample poems available
          </span>
        </div>
      </div>
    </div>
  );
}

export default SamplePoems;
