/**
 * ABCSourceView Component
 *
 * Provides view and optional editing of ABC notation source code.
 * Features:
 * - Toggle between rendered and source view
 * - Syntax highlighting for ABC notation
 * - Copy to clipboard button
 * - Download as .abc file
 * - Optional basic editing with validation
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { renderABC } from '@/lib/music/abcRenderer';
import './ABCSourceView.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[ABCSourceView] ${message}`, ...args);
  }
};

/**
 * View mode for the ABC display
 */
export type ViewMode = 'rendered' | 'source';

/**
 * Validation result for ABC notation
 */
export interface ABCValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Props for ABCSourceView component
 */
export interface ABCSourceViewProps {
  /** ABC notation string to display */
  abc: string;
  /** Initial view mode (default: 'rendered') */
  initialViewMode?: ViewMode;
  /** Whether editing is enabled (default: false) */
  editable?: boolean;
  /** Callback when ABC notation changes (only called in editable mode) */
  onABCChange?: (abc: string) => void;
  /** Callback when validation state changes */
  onValidationChange?: (result: ABCValidationResult) => void;
  /** Custom CSS class name */
  className?: string;
  /** Custom styling for the container */
  style?: React.CSSProperties;
  /** Title for the file when downloading (default: 'melody') */
  downloadTitle?: string;
  /** Whether to show the toolbar (default: true) */
  showToolbar?: boolean;
  /** Whether to show line numbers in source view (default: true) */
  showLineNumbers?: boolean;
  /** Element ID for the notation display (auto-generated if not provided) */
  notationId?: string;
}

/**
 * ABC notation token types for syntax highlighting
 */
type TokenType =
  | 'header'
  | 'field-key'
  | 'field-value'
  | 'note'
  | 'rest'
  | 'bar'
  | 'chord'
  | 'lyric'
  | 'comment'
  | 'decoration'
  | 'duration'
  | 'accidental'
  | 'text';

/**
 * Token for syntax highlighting
 */
interface Token {
  type: TokenType;
  value: string;
}

/**
 * Generate a unique ID for notation container
 */
let idCounter = 0;
function generateNotationId(): string {
  return `abc-source-view-notation-${++idCounter}`;
}

/**
 * Tokenize a line of ABC notation for syntax highlighting
 */
function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  const remaining = line;

  // Comment line
  if (remaining.startsWith('%')) {
    tokens.push({ type: 'comment', value: remaining });
    return tokens;
  }

  // Lyrics line (w: or W:) - check before general header to use lyric styling
  if (remaining.match(/^[wW]:\s*/)) {
    const lyricMatch = remaining.match(/^([wW]:)\s*(.*)$/);
    if (lyricMatch) {
      tokens.push({ type: 'field-key', value: lyricMatch[1] });
      if (lyricMatch[2]) {
        tokens.push({ type: 'lyric', value: lyricMatch[2] });
      }
      return tokens;
    }
  }

  // Header field line (e.g., X:1, T:Title, M:4/4, K:C)
  const headerMatch = remaining.match(/^([A-Za-z]):\s*(.*)$/);
  if (headerMatch) {
    tokens.push({ type: 'field-key', value: headerMatch[1] + ':' });
    if (headerMatch[2]) {
      tokens.push({ type: 'field-value', value: headerMatch[2] });
    }
    return tokens;
  }

  // Music notation line - tokenize character by character
  let i = 0;
  while (i < remaining.length) {
    const char = remaining[i];
    const ahead = remaining.slice(i);

    // Bar lines
    if (char === '|' || char === ':') {
      const barMatch = ahead.match(/^(\|?\|?:?:?\|?\|?|:\||\|\]|\[\||\|:|\|)/);
      if (barMatch) {
        tokens.push({ type: 'bar', value: barMatch[1] });
        i += barMatch[1].length;
        continue;
      }
    }

    // Chord symbols in quotes
    if (char === '"') {
      const chordMatch = ahead.match(/^"([^"]*)"/);
      if (chordMatch) {
        tokens.push({ type: 'chord', value: chordMatch[0] });
        i += chordMatch[0].length;
        continue;
      }
    }

    // Decorations (e.g., !fermata!, +accent+)
    if (char === '!' || char === '+') {
      const decorMatch = ahead.match(/^[!+][^!+]*[!+]/);
      if (decorMatch) {
        tokens.push({ type: 'decoration', value: decorMatch[0] });
        i += decorMatch[0].length;
        continue;
      }
    }

    // Grace notes
    if (char === '{') {
      const graceMatch = ahead.match(/^\{[^}]*\}/);
      if (graceMatch) {
        tokens.push({ type: 'decoration', value: graceMatch[0] });
        i += graceMatch[0].length;
        continue;
      }
    }

    // Accidentals
    if (char === '^' || char === '_' || char === '=') {
      const accMatch = ahead.match(/^[\^_=]+/);
      if (accMatch) {
        tokens.push({ type: 'accidental', value: accMatch[0] });
        i += accMatch[0].length;
        continue;
      }
    }

    // Rest
    if (char === 'z' || char === 'Z' || char === 'x') {
      const restMatch = ahead.match(/^[zZx][0-9]*\/?[0-9]*/);
      if (restMatch) {
        tokens.push({ type: 'rest', value: restMatch[0] });
        i += restMatch[0].length;
        continue;
      }
    }

    // Notes (including octave markers and durations)
    if (/[A-Ga-g]/.test(char)) {
      const noteMatch = ahead.match(/^[A-Ga-g][',]*[0-9]*\/?[0-9]*/);
      if (noteMatch) {
        tokens.push({ type: 'note', value: noteMatch[0] });
        i += noteMatch[0].length;
        continue;
      }
    }

    // Durations attached to notes
    if (/[0-9/]/.test(char)) {
      const durMatch = ahead.match(/^[0-9]+\/?[0-9]*/);
      if (durMatch) {
        tokens.push({ type: 'duration', value: durMatch[0] });
        i += durMatch[0].length;
        continue;
      }
    }

    // Any other character
    tokens.push({ type: 'text', value: char });
    i++;
  }

  return tokens;
}

/**
 * Get CSS class for token type
 */
function getTokenClass(type: TokenType): string {
  const classMap: Record<TokenType, string> = {
    'header': 'abc-token-header',
    'field-key': 'abc-token-field-key',
    'field-value': 'abc-token-field-value',
    'note': 'abc-token-note',
    'rest': 'abc-token-rest',
    'bar': 'abc-token-bar',
    'chord': 'abc-token-chord',
    'lyric': 'abc-token-lyric',
    'comment': 'abc-token-comment',
    'decoration': 'abc-token-decoration',
    'duration': 'abc-token-duration',
    'accidental': 'abc-token-accidental',
    'text': 'abc-token-text',
  };
  return classMap[type];
}

/**
 * Validate ABC notation by attempting to parse it
 */
function validateABC(abc: string): ABCValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!abc.trim()) {
    errors.push('ABC notation is empty');
    return { isValid: false, errors, warnings };
  }

  // Check for required header fields
  const lines = abc.split('\n');
  let hasXField = false;
  let hasKField = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('X:')) hasXField = true;
    if (trimmed.startsWith('K:')) hasKField = true;
  }

  if (!hasXField) {
    warnings.push('Missing X: (reference number) field');
  }
  if (!hasKField) {
    errors.push('Missing K: (key) field - required for ABC notation');
  }

  // Try to render the ABC to check for parse errors
  try {
    // Create a temporary container for validation
    const tempDiv = document.createElement('div');
    tempDiv.id = 'abc-validation-temp';
    tempDiv.style.display = 'none';
    document.body.appendChild(tempDiv);

    try {
      const result = renderABC(abc, 'abc-validation-temp');
      if (!result.success) {
        errors.push(result.error ?? 'Failed to parse ABC notation');
      }
    } finally {
      document.body.removeChild(tempDiv);
    }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    errors.push(`Parse error: ${errorMessage}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * ABCSourceView provides a view and optional editing interface for ABC notation.
 *
 * Features:
 * - Toggle between rendered sheet music and source code view
 * - Syntax highlighting for ABC notation
 * - Copy to clipboard functionality
 * - Download as .abc file
 * - Optional editing with real-time validation
 *
 * @example
 * ```tsx
 * <ABCSourceView
 *   abc={abcNotation}
 *   editable
 *   onABCChange={(newAbc) => setAbcNotation(newAbc)}
 *   downloadTitle="my-melody"
 * />
 * ```
 */
export function ABCSourceView({
  abc,
  initialViewMode = 'rendered',
  editable = false,
  onABCChange,
  onValidationChange,
  className = '',
  style,
  downloadTitle = 'melody',
  showToolbar = true,
  showLineNumbers = true,
  notationId,
}: ABCSourceViewProps): React.ReactElement {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [localAbc, setLocalAbc] = useState(abc);
  const [validation, setValidation] = useState<ABCValidationResult>({ isValid: true, errors: [], warnings: [] });
  const [copySuccess, setCopySuccess] = useState(false);
  const [containerId] = useState(() => notationId ?? generateNotationId());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const notationContainerRef = useRef<HTMLDivElement>(null);

  // Update local ABC when prop changes
  useEffect(() => {
    setLocalAbc(abc);
  }, [abc]);

  // Validate ABC when it changes
  useEffect(() => {
    const result = validateABC(localAbc);
    setValidation(result);
    onValidationChange?.(result);
  }, [localAbc, onValidationChange]);

  // Render notation when in rendered view mode
  useEffect(() => {
    if (viewMode === 'rendered' && notationContainerRef.current && localAbc) {
      log('Rendering ABC notation');
      renderABC(localAbc, containerId, {
        responsive: 'resize',
        add_classes: true,
      });
    }
  }, [viewMode, localAbc, containerId]);

  // Handle view mode toggle
  const handleToggleView = useCallback(() => {
    const newMode = viewMode === 'rendered' ? 'source' : 'rendered';
    log('Toggling view mode:', viewMode, '->', newMode);
    setViewMode(newMode);
  }, [viewMode]);

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    log('Copying ABC to clipboard');
    try {
      await navigator.clipboard.writeText(localAbc);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      log('Copy successful');
    } catch (err) {
      log('Copy failed:', err);
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = localAbc;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  }, [localAbc]);

  // Handle download as .abc file
  const handleDownload = useCallback(() => {
    log('Downloading ABC file');
    const blob = new Blob([localAbc], { type: 'text/vnd.abc' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${downloadTitle}.abc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    log('Download initiated');
  }, [localAbc, downloadTitle]);

  // Handle ABC editing
  const handleABCChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newAbc = e.target.value;
      setLocalAbc(newAbc);
      onABCChange?.(newAbc);
      log('ABC changed, length:', newAbc.length);
    },
    [onABCChange]
  );

  // Generate syntax-highlighted HTML for source view
  const highlightedSource = useMemo(() => {
    const lines = localAbc.split('\n');
    return lines.map((line, index) => {
      const tokens = tokenizeLine(line);
      return (
        <div key={index} className="abc-source-line">
          {showLineNumbers && (
            <span className="abc-line-number">{index + 1}</span>
          )}
          <span className="abc-line-content">
            {tokens.length > 0 ? (
              tokens.map((token, tokenIndex) => (
                <span key={tokenIndex} className={getTokenClass(token.type)}>
                  {token.value}
                </span>
              ))
            ) : (
              <span className="abc-empty-line">&nbsp;</span>
            )}
          </span>
        </div>
      );
    });
  }, [localAbc, showLineNumbers]);

  // Container styles
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    ...style,
  };

  return (
    <div
      className={`abc-source-view ${className}`.trim()}
      style={containerStyle}
      data-testid="abc-source-view"
    >
      {/* Toolbar */}
      {showToolbar && (
        <div className="abc-source-toolbar" data-testid="abc-source-toolbar">
          <div className="abc-source-toolbar-left">
            {/* View Toggle */}
            <div className="abc-view-toggle" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'rendered'}
                className={`abc-view-toggle-btn ${viewMode === 'rendered' ? 'active' : ''}`}
                onClick={() => setViewMode('rendered')}
                data-testid="view-toggle-rendered"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M9 19V6l12-3v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
                <span>Rendered</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'source'}
                className={`abc-view-toggle-btn ${viewMode === 'source' ? 'active' : ''}`}
                onClick={() => setViewMode('source')}
                data-testid="view-toggle-source"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <polyline points="16,18 22,12 16,6" />
                  <polyline points="8,6 2,12 8,18" />
                </svg>
                <span>Source</span>
              </button>
            </div>

            {/* Validation Status */}
            {viewMode === 'source' && (
              <div
                className={`abc-validation-status ${validation.isValid ? 'valid' : 'invalid'}`}
                data-testid="validation-status"
              >
                {validation.isValid ? (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                    <span>Valid</span>
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{validation.errors.length} error(s)</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="abc-source-toolbar-right">
            {/* Copy Button */}
            <button
              type="button"
              className="abc-toolbar-btn"
              onClick={handleCopy}
              aria-label="Copy ABC to clipboard"
              data-testid="copy-button"
            >
              {copySuccess ? (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* Download Button */}
            <button
              type="button"
              className="abc-toolbar-btn"
              onClick={handleDownload}
              aria-label="Download as ABC file"
              data-testid="download-button"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download</span>
            </button>

            {/* Edit Toggle (when editable) */}
            {editable && (
              <button
                type="button"
                className="abc-toolbar-btn abc-edit-toggle"
                onClick={handleToggleView}
                aria-label={viewMode === 'source' ? 'Switch to rendered view' : 'Switch to edit source'}
                data-testid="edit-toggle-button"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="abc-source-content" data-testid="abc-source-content">
        {viewMode === 'rendered' ? (
          /* Rendered View */
          <div
            ref={notationContainerRef}
            id={containerId}
            className="abc-rendered-view"
            data-testid="rendered-view"
            aria-label="Rendered music notation"
          >
            {/* abcjs will inject the SVG here */}
          </div>
        ) : editable ? (
          /* Editable Source View */
          <div className="abc-editable-source" data-testid="editable-source-view">
            <textarea
              ref={textareaRef}
              className="abc-source-textarea"
              value={localAbc}
              onChange={handleABCChange}
              spellCheck={false}
              aria-label="ABC notation editor"
              data-testid="abc-textarea"
            />
            {/* Validation Errors */}
            {!validation.isValid && (
              <div className="abc-validation-errors" data-testid="validation-errors">
                {validation.errors.map((error, index) => (
                  <div key={index} className="abc-validation-error">
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <span>{error}</span>
                  </div>
                ))}
                {validation.warnings.map((warning, index) => (
                  <div key={`warn-${index}`} className="abc-validation-warning">
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Read-only Source View with Syntax Highlighting */
          <div
            className="abc-source-display"
            data-testid="source-view"
            role="textbox"
            aria-readonly="true"
            aria-multiline="true"
            aria-label="ABC notation source"
            tabIndex={0}
          >
            <pre className="abc-source-pre">
              <code className="abc-source-code">{highlightedSource}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default ABCSourceView;
