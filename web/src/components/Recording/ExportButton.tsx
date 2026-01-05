/**
 * ExportButton Component
 *
 * A button that triggers audio export with format options.
 * Shows a dropdown menu for format selection.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ExportFormat } from '@/lib/audio/export';
import { getSupportedFormats, getFormatInfo } from '@/lib/audio/export';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[ExportButton] ${message}`, ...args);
  }
};

/**
 * Size options for the button
 */
export type ExportButtonSize = 'small' | 'medium' | 'large';

/**
 * Props for ExportButton component
 */
export interface ExportButtonProps {
  /** Callback when export is triggered */
  onExport: (format: ExportFormat) => void;
  /** Whether export is currently in progress */
  isExporting?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Button size */
  size?: ExportButtonSize;
  /** Show format selector dropdown */
  showFormatSelector?: boolean;
  /** Default format to use */
  defaultFormat?: ExportFormat;
  /** Custom label */
  label?: string;
  /** Custom class name */
  className?: string;
}

/**
 * Get button dimensions based on size
 */
function getButtonDimensions(size: ExportButtonSize): {
  height: number;
  fontSize: string;
  padding: string;
  iconSize: number;
} {
  switch (size) {
    case 'small':
      return { height: 32, fontSize: '0.8125rem', padding: '0.375rem 0.75rem', iconSize: 14 };
    case 'large':
      return { height: 48, fontSize: '1rem', padding: '0.75rem 1.5rem', iconSize: 20 };
    case 'medium':
    default:
      return { height: 40, fontSize: '0.875rem', padding: '0.5rem 1rem', iconSize: 16 };
  }
}

/**
 * ExportButton provides a button for exporting audio files.
 *
 * Features:
 * - Format selection dropdown
 * - Loading state during export
 * - Disabled state
 * - Multiple sizes
 *
 * @example
 * ```tsx
 * <ExportButton
 *   onExport={(format) => handleExport(format)}
 *   isExporting={isExporting}
 *   showFormatSelector
 * />
 * ```
 */
export function ExportButton({
  onExport,
  isExporting = false,
  disabled = false,
  size = 'medium',
  showFormatSelector = true,
  defaultFormat = 'webm',
  label = 'Export',
  className = '',
}: ExportButtonProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(defaultFormat);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const supportedFormats = getSupportedFormats();
  const dimensions = getButtonDimensions(size);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Handle main button click
  const handleClick = useCallback(() => {
    if (showFormatSelector && supportedFormats.length > 1) {
      log('Toggle format selector');
      setIsOpen((prev) => !prev);
    } else {
      log('Export with format:', selectedFormat);
      onExport(selectedFormat);
    }
  }, [showFormatSelector, supportedFormats.length, selectedFormat, onExport]);

  // Handle format selection
  const handleFormatSelect = useCallback(
    (format: ExportFormat) => {
      log('Format selected:', format);
      setSelectedFormat(format);
      setIsOpen(false);
      onExport(format);
    },
    [onExport]
  );

  const isDisabled = disabled || isExporting;

  // Main button styles
  const buttonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    height: dimensions.height,
    padding: dimensions.padding,
    fontSize: dimensions.fontSize,
    fontWeight: 500,
    backgroundColor: isDisabled ? '#9ca3af' : '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.7 : 1,
    transition: 'all 0.2s',
    position: 'relative',
  };

  // Dropdown styles
  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '4px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 50,
    overflow: 'hidden',
  };

  // Dropdown item styles
  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    width: '100%',
    padding: '0.625rem 0.75rem',
    fontSize: '0.875rem',
    textAlign: 'left',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      className={`export-button-container ${className}`.trim()}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        style={buttonStyle}
        className="export-button"
        aria-label={isExporting ? 'Exporting...' : label}
        aria-expanded={isOpen}
        aria-haspopup={showFormatSelector && supportedFormats.length > 1 ? 'listbox' : undefined}
        data-testid="export-button"
      >
        {isExporting ? (
          // Loading spinner
          <svg
            width={dimensions.iconSize}
            height={dimensions.iconSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="export-button__spinner"
            style={{ animation: 'spin 1s linear infinite' }}
          >
            <circle cx="12" cy="12" r="10" opacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        ) : (
          // Download icon
          <svg
            width={dimensions.iconSize}
            height={dimensions.iconSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        )}

        <span>{isExporting ? 'Exporting...' : label}</span>

        {showFormatSelector && supportedFormats.length > 1 && !isExporting && (
          // Dropdown arrow
          <svg
            width={12}
            height={12}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </button>

      {/* Format dropdown */}
      {isOpen && showFormatSelector && (
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="export-button__dropdown"
          role="listbox"
          aria-label="Select export format"
          data-testid="export-format-dropdown"
        >
          {supportedFormats.map((format) => {
            const info = getFormatInfo(format);
            return (
              <button
                key={format}
                type="button"
                onClick={() => handleFormatSelect(format)}
                style={itemStyle}
                className="export-button__format-option"
                role="option"
                aria-selected={format === selectedFormat}
                data-testid={`export-format-${format}`}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ fontWeight: 500 }}>{info.name}</span>
                <span style={{ flex: 1, opacity: 0.6, fontSize: '0.75rem' }}>
                  {info.extension}
                </span>
                {format === selectedFormat && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .export-button:hover:not(:disabled) {
          background-color: #2563eb;
          transform: translateY(-1px);
        }

        .export-button:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}

export default ExportButton;
