/**
 * PoemTextarea Component
 *
 * A textarea component with line numbers and auto-resize functionality
 * for poem input. Includes formatting cleanup on paste.
 *
 * @module components/PoemInput/PoemTextarea
 */

import {
  type ReactElement,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import './PoemTextarea.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[PoemTextarea] ${message}`, ...args);
  }
};

/**
 * Props for the PoemTextarea component
 */
export interface PoemTextareaProps {
  /** Current text value */
  value: string;
  /** Callback when text changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the textarea is disabled */
  disabled?: boolean;
  /** Maximum character limit (optional) */
  maxLength?: number;
  /** Minimum number of rows to display */
  minRows?: number;
  /** Maximum number of rows before scrolling */
  maxRows?: number;
  /** Additional CSS class name */
  className?: string;
  /** Callback when paste is detected */
  onPaste?: (pastedText: string) => void;
  /** ID for form association */
  id?: string;
  /** aria-label for accessibility */
  ariaLabel?: string;
}

/**
 * Cleans up pasted text by normalizing whitespace and formatting
 */
function cleanPastedText(text: string): string {
  log('Cleaning pasted text, original length:', text.length);

  // Normalize line endings
  let cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Replace multiple consecutive empty lines with double newline (preserve stanza breaks)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Replace tabs with spaces
  cleaned = cleaned.replace(/\t/g, '  ');

  // Remove trailing whitespace from each line while preserving leading indentation
  cleaned = cleaned
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');

  // Trim leading/trailing whitespace from the entire text
  cleaned = cleaned.trim();

  log('Cleaned text length:', cleaned.length);
  return cleaned;
}

/**
 * Calculates the number of lines in a string
 */
function getLineCount(text: string): number {
  if (!text) return 1;
  return text.split('\n').length;
}

/**
 * PoemTextarea provides a multi-line text input with line numbers
 * and auto-resize functionality.
 *
 * Features:
 * - Line numbers display that updates as user types
 * - Auto-resize based on content
 * - Paste detection with formatting cleanup
 * - Keyboard navigation support
 * - Accessible with proper ARIA attributes
 *
 * @example
 * ```tsx
 * <PoemTextarea
 *   value={poem}
 *   onChange={setPoem}
 *   placeholder="Enter your poem here..."
 * />
 * ```
 */
export function PoemTextarea({
  value,
  onChange,
  placeholder = 'Enter or paste your poem here...',
  disabled = false,
  maxLength,
  minRows = 8,
  maxRows = 30,
  className = '',
  onPaste,
  id = 'poem-textarea',
  ariaLabel = 'Poem text input',
}: PoemTextareaProps): ReactElement {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lineCount = getLineCount(value);

  log('Rendering PoemTextarea:', { lineCount, valueLength: value.length, disabled });

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get proper scrollHeight
    textarea.style.height = 'auto';

    // Calculate new height based on content
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight, 10) || 24;
    const padding = parseInt(getComputedStyle(textarea).paddingTop, 10) * 2 || 24;

    const minHeight = lineHeight * minRows + padding;
    const maxHeight = lineHeight * maxRows + padding;
    const contentHeight = textarea.scrollHeight;

    const newHeight = Math.max(minHeight, Math.min(contentHeight, maxHeight));
    textarea.style.height = `${newHeight}px`;

    log('Auto-resize:', { contentHeight, newHeight, minHeight, maxHeight });
  }, [value, minRows, maxRows]);

  // Sync line numbers scroll position with textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    const lineNumbers = lineNumbersRef.current;
    if (!textarea || !lineNumbers) return;

    const handleScroll = (): void => {
      lineNumbers.scrollTop = textarea.scrollTop;
    };

    textarea.addEventListener('scroll', handleScroll);
    return () => textarea.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle text change
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      log('Text changed, new length:', newValue.length);

      if (maxLength && newValue.length > maxLength) {
        log('Exceeded max length, truncating');
        onChange(newValue.slice(0, maxLength));
        return;
      }

      onChange(newValue);
    },
    [onChange, maxLength]
  );

  // Handle paste with cleanup
  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLTextAreaElement>) => {
      e.preventDefault();

      const pastedText = e.clipboardData.getData('text/plain');
      log('Paste detected, raw length:', pastedText.length);

      const cleanedText = cleanPastedText(pastedText);

      // Get current selection
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Build new value with cleaned pasted text
      const beforeSelection = value.slice(0, start);
      const afterSelection = value.slice(end);
      let newValue = beforeSelection + cleanedText + afterSelection;

      // Check max length
      if (maxLength && newValue.length > maxLength) {
        newValue = newValue.slice(0, maxLength);
        log('Paste truncated to max length');
      }

      onChange(newValue);

      // Notify parent about paste
      onPaste?.(cleanedText);

      // Set cursor position after paste
      requestAnimationFrame(() => {
        if (textarea) {
          const newCursorPos = start + cleanedText.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }
      });
    },
    [value, onChange, onPaste, maxLength]
  );

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab key inserts spaces instead of changing focus
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newValue = value.slice(0, start) + '  ' + value.slice(end);
      onChange(newValue);

      // Set cursor position after the inserted spaces
      requestAnimationFrame(() => {
        if (textarea) {
          const newCursorPos = start + 2;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }
      });
    }
  }, [value, onChange]);

  // Generate line numbers
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  const containerClass = [
    'poem-textarea-container',
    disabled ? 'poem-textarea-container--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <div className={containerClass} data-testid="poem-textarea-container">
      {/* Line numbers gutter */}
      <div
        ref={lineNumbersRef}
        className="poem-textarea__line-numbers"
        aria-hidden="true"
        data-testid="line-numbers"
      >
        {lineNumbers.map((num) => (
          <div key={num} className="poem-textarea__line-number">
            {num}
          </div>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        id={id}
        className="poem-textarea__input"
        value={value}
        onChange={handleChange}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        aria-label={ariaLabel}
        aria-describedby={maxLength ? `${id}-char-count` : undefined}
        spellCheck={false}
        data-testid="poem-textarea"
      />
    </div>
  );
}

export default PoemTextarea;
