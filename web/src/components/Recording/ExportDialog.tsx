/**
 * ExportDialog Component
 *
 * A modal dialog for configuring audio export options.
 * Supports format selection, quality options, and combined export.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ExportFormat, ExportQuality, CombineOptions } from '@/lib/audio/export';
import {
  getSupportedFormats,
  getFormatInfo,
  isWavConversionSupported,
} from '@/lib/audio/export';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[ExportDialog] ${message}`, ...args);
  }
};

/**
 * Export mode - single track or combined
 */
export type ExportMode = 'single' | 'combined';

/**
 * Props for ExportDialog component
 */
export interface ExportDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback to close the dialog */
  onClose: () => void;
  /** Callback when export is confirmed */
  onExport: (options: ExportDialogResult) => void;
  /** Whether exporting is in progress */
  isExporting?: boolean;
  /** Whether melody is available for combined export */
  hasMelody?: boolean;
  /** The poem title for filename generation */
  poemTitle?: string;
  /** The take name */
  takeName?: string;
  /** Recording duration in seconds */
  duration?: number;
}

/**
 * Result from the export dialog
 */
export interface ExportDialogResult {
  /** Export mode */
  mode: ExportMode;
  /** Selected format */
  format: ExportFormat;
  /** Quality settings */
  quality: ExportQuality;
  /** Combine options (for combined mode) */
  combineOptions?: CombineOptions;
  /** Custom filename (without extension) */
  filename?: string;
}

/**
 * Format duration to MM:SS
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size estimate
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Estimate file size based on format and duration
 */
function estimateFileSize(
  durationSeconds: number,
  format: ExportFormat,
  quality: ExportQuality
): number {
  const { sampleRate = 44100, channels = 2, bitDepth = 16 } = quality;

  if (format === 'wav') {
    // WAV: sampleRate * channels * (bitDepth / 8) * seconds
    return sampleRate * channels * (bitDepth / 8) * durationSeconds;
  }

  // WebM: roughly 128 kbps
  return (128000 / 8) * durationSeconds;
}

/**
 * ExportDialog provides a modal for configuring export options.
 *
 * Features:
 * - Format selection (WebM, WAV)
 * - Quality settings for WAV (sample rate, bit depth)
 * - Combined export option (recording + melody)
 * - Volume controls for combined export
 * - File size estimation
 * - Custom filename input
 *
 * @example
 * ```tsx
 * <ExportDialog
 *   isOpen={showExportDialog}
 *   onClose={() => setShowExportDialog(false)}
 *   onExport={(options) => handleExport(options)}
 *   hasMelody={!!melodyBlobUrl}
 *   poemTitle={poemTitle}
 * />
 * ```
 */
export function ExportDialog({
  isOpen,
  onClose,
  onExport,
  isExporting = false,
  hasMelody = false,
  poemTitle,
  takeName,
  duration = 0,
}: ExportDialogProps): React.ReactElement | null {
  // State
  const [mode, setMode] = useState<ExportMode>('single');
  const [format, setFormat] = useState<ExportFormat>('webm');
  const [sampleRate, setSampleRate] = useState(44100);
  const [bitDepth, setBitDepth] = useState<8 | 16 | 24 | 32>(16);
  const [channels, setChannels] = useState<1 | 2>(2);
  const [recordingVolume, setRecordingVolume] = useState(100);
  const [melodyVolume, setMelodyVolume] = useState(50);
  const [customFilename, setCustomFilename] = useState('');

  const supportedFormats = getSupportedFormats();
  const wavSupported = isWavConversionSupported();

  // Track previous open state to detect when dialog opens
  const wasOpenRef = useRef(false);

  // Reset state when dialog opens (using ref to avoid synchronous setState warning)
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      log('Dialog opened, will reset state');
      // Use requestAnimationFrame to avoid the synchronous setState warning
      requestAnimationFrame(() => {
        setMode('single');
        setFormat('webm');
        setSampleRate(44100);
        setBitDepth(16);
        setChannels(2);
        setRecordingVolume(100);
        setMelodyVolume(50);
        setCustomFilename('');
      });
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isExporting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isExporting, onClose]);

  // Calculate estimated file size
  const quality: ExportQuality = { sampleRate, channels, bitDepth };
  const estimatedSize = estimateFileSize(duration, format, quality);

  // Handle export
  const handleExport = useCallback(() => {
    const exportQuality = { sampleRate, channels, bitDepth };
    log('Export requested:', { mode, format, quality: exportQuality });

    const result: ExportDialogResult = {
      mode,
      format,
      quality: exportQuality,
      filename: customFilename.trim() || undefined,
    };

    if (mode === 'combined') {
      result.combineOptions = {
        recordingVolume: recordingVolume / 100,
        melodyVolume: melodyVolume / 100,
        format,
        quality: exportQuality,
      };
    }

    onExport(result);
  }, [
    mode,
    format,
    sampleRate,
    channels,
    bitDepth,
    recordingVolume,
    melodyVolume,
    customFilename,
    onExport,
  ]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  // Overlay styles
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '1rem',
  };

  // Dialog styles
  const dialogStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '90vh',
    overflow: 'auto',
  };

  // Header styles
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.25rem',
    borderBottom: '1px solid #e5e7eb',
  };

  // Section styles
  const sectionStyle: React.CSSProperties = {
    padding: '1rem 1.25rem',
    borderBottom: '1px solid #f3f4f6',
  };

  // Label styles
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 500,
    marginBottom: '0.5rem',
    color: '#374151',
  };

  // Input styles
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    outline: 'none',
  };

  // Select styles
  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'none',
    backgroundImage:
      'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7280\' stroke-width=\'2\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.5rem center',
    paddingRight: '2rem',
  };

  // Button styles
  const buttonBaseStyle: React.CSSProperties = {
    padding: '0.625rem 1.25rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: '#3b82f6',
    color: 'white',
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: '1px solid #d1d5db',
  };

  // Radio button group styles
  const radioGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.75rem',
  };

  const radioLabelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    flex: 1,
  };

  const radioLabelSelectedStyle: React.CSSProperties = {
    ...radioLabelStyle,
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  };

  return (
    <div
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExporting) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
      data-testid="export-dialog"
    >
      <div style={dialogStyle} className="export-dialog">
        {/* Header */}
        <div style={headerStyle}>
          <h2
            id="export-dialog-title"
            style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}
          >
            Export Audio
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            style={{
              padding: '0.375rem',
              background: 'none',
              border: 'none',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              opacity: isExporting ? 0.5 : 1,
              borderRadius: '4px',
            }}
            aria-label="Close"
            data-testid="export-dialog-close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Recording info */}
        <div style={{ ...sectionStyle, backgroundColor: '#f9fafb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 500 }}>{takeName || poemTitle || 'Recording'}</div>
              <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                Duration: {formatDuration(duration)}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.8125rem', color: '#6b7280' }}>
              Est. size: {formatFileSize(estimatedSize)}
            </div>
          </div>
        </div>

        {/* Export mode (if melody available) */}
        {hasMelody && (
          <div style={sectionStyle}>
            <label style={labelStyle}>Export Mode</label>
            <div style={radioGroupStyle}>
              <label
                style={mode === 'single' ? radioLabelSelectedStyle : radioLabelStyle}
                data-testid="export-mode-single"
              >
                <input
                  type="radio"
                  name="exportMode"
                  value="single"
                  checked={mode === 'single'}
                  onChange={() => setMode('single')}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Recording Only</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Just your vocals</div>
                </div>
              </label>
              <label
                style={mode === 'combined' ? radioLabelSelectedStyle : radioLabelStyle}
                data-testid="export-mode-combined"
              >
                <input
                  type="radio"
                  name="exportMode"
                  value="combined"
                  checked={mode === 'combined'}
                  onChange={() => setMode('combined')}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Combined</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Vocals + Melody</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Volume controls (for combined mode) */}
        {mode === 'combined' && (
          <div style={sectionStyle}>
            <label style={labelStyle}>Mix Levels</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.8125rem',
                    marginBottom: '0.25rem',
                  }}
                >
                  <span>Recording</span>
                  <span>{recordingVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={recordingVolume}
                  onChange={(e) => setRecordingVolume(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                  data-testid="recording-volume-slider"
                />
              </div>
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.8125rem',
                    marginBottom: '0.25rem',
                  }}
                >
                  <span>Melody</span>
                  <span>{melodyVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={melodyVolume}
                  onChange={(e) => setMelodyVolume(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                  data-testid="melody-volume-slider"
                />
              </div>
            </div>
          </div>
        )}

        {/* Format selection */}
        <div style={sectionStyle}>
          <label style={labelStyle} htmlFor="export-format">
            Format
          </label>
          <select
            id="export-format"
            value={format}
            onChange={(e) => setFormat(e.target.value as ExportFormat)}
            style={selectStyle}
            data-testid="export-format-select"
          >
            {supportedFormats.map((fmt) => {
              const info = getFormatInfo(fmt);
              return (
                <option key={fmt} value={fmt}>
                  {info.name} ({info.extension}) - {info.description}
                </option>
              );
            })}
          </select>
        </div>

        {/* Quality settings (for WAV) */}
        {format === 'wav' && wavSupported && (
          <div style={sectionStyle}>
            <label style={labelStyle}>Quality Settings</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label
                  style={{ ...labelStyle, fontSize: '0.75rem', color: '#6b7280' }}
                  htmlFor="sample-rate"
                >
                  Sample Rate
                </label>
                <select
                  id="sample-rate"
                  value={sampleRate}
                  onChange={(e) => setSampleRate(parseInt(e.target.value))}
                  style={selectStyle}
                  data-testid="sample-rate-select"
                >
                  <option value={22050}>22.05 kHz</option>
                  <option value={44100}>44.1 kHz (CD)</option>
                  <option value={48000}>48 kHz</option>
                  <option value={96000}>96 kHz (High)</option>
                </select>
              </div>
              <div>
                <label
                  style={{ ...labelStyle, fontSize: '0.75rem', color: '#6b7280' }}
                  htmlFor="bit-depth"
                >
                  Bit Depth
                </label>
                <select
                  id="bit-depth"
                  value={bitDepth}
                  onChange={(e) => setBitDepth(parseInt(e.target.value) as 8 | 16 | 24 | 32)}
                  style={selectStyle}
                  data-testid="bit-depth-select"
                >
                  <option value={8}>8-bit</option>
                  <option value={16}>16-bit (CD)</option>
                  <option value={24}>24-bit (High)</option>
                  <option value={32}>32-bit</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label
                  style={{ ...labelStyle, fontSize: '0.75rem', color: '#6b7280' }}
                  htmlFor="channels"
                >
                  Channels
                </label>
                <select
                  id="channels"
                  value={channels}
                  onChange={(e) => setChannels(parseInt(e.target.value) as 1 | 2)}
                  style={selectStyle}
                  data-testid="channels-select"
                >
                  <option value={1}>Mono</option>
                  <option value={2}>Stereo</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Custom filename */}
        <div style={sectionStyle}>
          <label style={labelStyle} htmlFor="export-filename">
            Filename (optional)
          </label>
          <input
            id="export-filename"
            type="text"
            value={customFilename}
            onChange={(e) => setCustomFilename(e.target.value)}
            placeholder={poemTitle || takeName || 'recording'}
            style={inputStyle}
            data-testid="export-filename-input"
          />
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
            Extension will be added automatically
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            style={{
              ...secondaryButtonStyle,
              opacity: isExporting ? 0.5 : 1,
              cursor: isExporting ? 'not-allowed' : 'pointer',
            }}
            data-testid="export-dialog-cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            style={{
              ...primaryButtonStyle,
              opacity: isExporting ? 0.7 : 1,
              cursor: isExporting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            data-testid="export-dialog-confirm"
          >
            {isExporting ? (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ animation: 'spin 1s linear infinite' }}
                >
                  <circle cx="12" cy="12" r="10" opacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export
              </>
            )}
          </button>
        </div>
      </div>

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
      `}</style>
    </div>
  );
}

export default ExportDialog;
