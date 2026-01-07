/**
 * PoemInput Component
 *
 * Main container component for poem input functionality.
 * Combines the textarea, toolbar, and sample poem picker.
 *
 * @module components/PoemInput/PoemInput
 */

import {
  type ReactElement,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { usePoemStore, selectLineCount, selectWordCount } from '@/stores/usePoemStore';
import { PoemTextarea } from './PoemTextarea';
import { PoemToolbar } from './PoemToolbar';
import { SamplePoems } from './SamplePoems';
import type { SamplePoem } from '@/data/samplePoems';
import './PoemInput.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[PoemInput] ${message}`, ...args);
  }
};

/**
 * Character limit for poems (optional, can be disabled)
 */
const DEFAULT_MAX_CHARACTERS = 10000;

/**
 * Minimum characters required to enable analysis
 */
const MIN_CHARS_FOR_ANALYSIS = 10;

/**
 * Props for the PoemInput component
 */
export interface PoemInputProps {
  /** Callback when analyze button is clicked */
  onAnalyze?: () => void;
  /** Maximum character limit (optional) */
  maxLength?: number;
  /** Show character/line count display */
  showStats?: boolean;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Additional CSS class name */
  className?: string;
}

/**
 * PoemInput is the main container for poem input functionality.
 *
 * Features:
 * - Text area with line numbers
 * - Toolbar with clear, paste, sample, and analyze buttons
 * - Sample poem picker modal
 * - Character and line count display
 * - Character limit warning
 * - Integration with usePoemStore
 *
 * @example
 * ```tsx
 * <PoemInput
 *   onAnalyze={() => navigate('analysis')}
 *   showStats
 * />
 * ```
 */
export function PoemInput({
  onAnalyze,
  maxLength = DEFAULT_MAX_CHARACTERS,
  showStats = true,
  disabled = false,
  className = '',
}: PoemInputProps): ReactElement {
  const [showSamplePicker, setShowSamplePicker] = useState(false);

  // Get poem state from store
  const poemText = usePoemStore((state) => state.original);
  const setPoem = usePoemStore((state) => state.setPoem);
  const resetStore = usePoemStore((state) => state.reset);
  const lineCount = usePoemStore(selectLineCount);
  const wordCount = usePoemStore(selectWordCount);

  // Derived state
  const charCount = poemText.length;
  const hasText = charCount > 0;
  const canAnalyze = poemText.trim().length >= MIN_CHARS_FOR_ANALYSIS;
  const isNearLimit = maxLength && charCount > maxLength * 0.9;
  const isAtLimit = maxLength && charCount >= maxLength;

  log('Rendering PoemInput:', { charCount, lineCount, wordCount, hasText, canAnalyze });

  // Handle text change
  const handleTextChange = useCallback(
    (value: string) => {
      log('Text changed, new length:', value.length);
      setPoem(value);
    },
    [setPoem]
  );

  // Handle clear
  const handleClear = useCallback(() => {
    log('Clearing poem text');
    resetStore();
  }, [resetStore]);

  // Handle paste button click
  const handlePaste = useCallback(async () => {
    log('Paste button clicked');

    // Try to paste from clipboard
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setPoem(text);
          log('Pasted from clipboard');
          return;
        }
      }
    } catch (error) {
      log('Clipboard read failed:', error);
    }

    // If clipboard fails, focus the textarea so user can paste manually
    const textarea = document.querySelector('[data-testid="poem-textarea"]') as HTMLTextAreaElement;
    if (textarea) {
      textarea.focus();
      log('Focused textarea for manual paste');
    }
  }, [setPoem]);

  // Handle sample picker open
  const handleSampleClick = useCallback(() => {
    log('Opening sample picker');
    setShowSamplePicker(true);
  }, []);

  // Handle sample picker close
  const handleSampleClose = useCallback(() => {
    log('Closing sample picker');
    setShowSamplePicker(false);
  }, []);

  // Handle sample poem selection
  const handleSampleSelect = useCallback(
    (poem: SamplePoem) => {
      log('Sample poem selected:', poem.title);
      setPoem(poem.text);
      setShowSamplePicker(false);
    },
    [setPoem]
  );

  // Handle analyze button click
  const handleAnalyze = useCallback(() => {
    log('Analyze button clicked');
    onAnalyze?.();
  }, [onAnalyze]);

  // Handle paste event from textarea
  const handleTextareaPaste = useCallback(
    (pastedText: string) => {
      log('Paste detected in textarea, length:', pastedText.length);
    },
    []
  );

  // Format character count with limit
  const charCountDisplay = useMemo(() => {
    if (!maxLength) return `${charCount} characters`;
    return `${charCount} / ${maxLength}`;
  }, [charCount, maxLength]);

  const containerClass = [
    'poem-input',
    disabled ? 'poem-input--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <div className={containerClass} data-testid="poem-input">
      {/* Header with title */}
      <div className="poem-input__header">
        <h2 className="poem-input__title">Enter Your Poem</h2>
        <p className="poem-input__subtitle">
          Paste or type your poem below to create song lyrics and melody.
        </p>
      </div>

      {/* Toolbar */}
      <PoemToolbar
        onClear={handleClear}
        onPaste={handlePaste}
        onSampleClick={handleSampleClick}
        onAnalyze={handleAnalyze}
        hasText={hasText}
        canAnalyze={canAnalyze}
        disabled={disabled}
      />

      {/* Textarea with line numbers */}
      <PoemTextarea
        value={poemText}
        onChange={handleTextChange}
        placeholder="Enter or paste your poem here...

Example:
Shall I compare thee to a summer's day?
Thou art more lovely and more temperate..."
        disabled={disabled}
        maxLength={maxLength}
        onPaste={handleTextareaPaste}
        ariaLabel="Poem text input"
      />

      {/* Stats display */}
      {showStats && (
        <div className="poem-input__stats" data-testid="poem-stats">
          <div className="poem-input__stat">
            <span className="poem-input__stat-label">Lines:</span>
            <span className="poem-input__stat-value">{lineCount}</span>
          </div>
          <div className="poem-input__stat">
            <span className="poem-input__stat-label">Words:</span>
            <span className="poem-input__stat-value">{wordCount}</span>
          </div>
          <div
            className={`poem-input__stat ${isNearLimit ? 'poem-input__stat--warning' : ''} ${isAtLimit ? 'poem-input__stat--error' : ''}`}
          >
            <span className="poem-input__stat-label">Characters:</span>
            <span className="poem-input__stat-value">{charCountDisplay}</span>
          </div>
        </div>
      )}

      {/* Character limit warning */}
      {isNearLimit && !isAtLimit && (
        <div className="poem-input__warning" role="alert" aria-live="polite">
          Approaching character limit
        </div>
      )}

      {isAtLimit && (
        <div className="poem-input__error" role="alert" aria-live="assertive">
          Character limit reached
        </div>
      )}

      {/* Sample poem picker modal */}
      <SamplePoems
        isOpen={showSamplePicker}
        onClose={handleSampleClose}
        onSelect={handleSampleSelect}
      />
    </div>
  );
}

export default PoemInput;
