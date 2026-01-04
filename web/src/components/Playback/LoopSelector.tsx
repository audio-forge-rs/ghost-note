/**
 * LoopSelector Component
 *
 * A control for selecting and managing loop playback of melody sections.
 * Allows users to define loop points and toggle loop mode.
 *
 * @module components/Playback/LoopSelector
 */

import { useState, useCallback, useMemo } from 'react';
import type { ReactElement, CSSProperties } from 'react';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[LoopSelector] ${message}`, ...args);
  }
};

/**
 * Loop region definition
 */
export interface LoopRegion {
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Optional name for the loop region */
  name?: string;
}

/**
 * Measure/bar information for visual display
 */
export interface MeasureInfo {
  /** Measure number (1-indexed) */
  number: number;
  /** Start time in seconds */
  startTime: number;
  /** End time in seconds */
  endTime: number;
}

/**
 * Props for LoopSelector component
 */
export interface LoopSelectorProps {
  /** Whether looping is enabled */
  loopEnabled: boolean;
  /** Callback when loop enabled state changes */
  onLoopEnabledChange: (enabled: boolean) => void;
  /** Current loop region */
  loopRegion?: LoopRegion | null;
  /** Callback when loop region changes */
  onLoopRegionChange?: (region: LoopRegion | null) => void;
  /** Total duration of the melody in seconds */
  duration: number;
  /** Current playback position in seconds */
  currentTime?: number;
  /** Optional measure information for measure-based selection */
  measures?: MeasureInfo[];
  /** Selection mode: 'time' for time-based, 'measure' for measure-based */
  mode?: 'time' | 'measure';
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Whether to show the visual loop bar (default: true) */
  showLoopBar?: boolean;
  /** Custom CSS class */
  className?: string;
  /** Custom inline styles */
  style?: CSSProperties;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Format time as MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Loop icon SVG
 */
function LoopIcon({ size = 20, active = false }: { size?: number; active?: boolean }): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
      {active && <circle cx="12" cy="12" r="2" fill="currentColor" />}
    </svg>
  );
}

/**
 * LoopSelector provides controls for looping sections of the melody.
 *
 * Features:
 * - Toggle loop mode on/off
 * - Set custom loop start and end points
 * - Visual loop region indicator
 * - Time-based or measure-based selection modes
 * - Quick presets for common loop regions
 *
 * @example
 * ```tsx
 * <LoopSelector
 *   loopEnabled={isLooping}
 *   onLoopEnabledChange={setIsLooping}
 *   loopRegion={{ start: 0, end: 30 }}
 *   onLoopRegionChange={setLoopRegion}
 *   duration={120}
 * />
 * ```
 */
export function LoopSelector({
  loopEnabled,
  onLoopEnabledChange,
  loopRegion,
  onLoopRegionChange,
  duration,
  currentTime = 0,
  measures,
  mode = 'time',
  disabled = false,
  showLoopBar = true,
  className = '',
  style,
  testId = 'loop-selector',
}: LoopSelectorProps): ReactElement {
  // Local state for editing loop points
  const [editingStart, setEditingStart] = useState(false);
  const [editingEnd, setEditingEnd] = useState(false);

  // Derive local values from props for display
  const localStart = loopRegion?.start ?? 0;
  const localEnd = loopRegion?.end ?? duration;

  // Temporary edit values - initialized to current values, reset when editing starts
  const [editStart, setEditStart] = useState(0);
  const [editEnd, setEditEnd] = useState(0);

  // Reset edit values when starting to edit
  const handleStartEdit = useCallback(() => {
    setEditStart(localStart);
    setEditingStart(true);
  }, [localStart]);

  const handleEndEdit = useCallback(() => {
    setEditEnd(localEnd);
    setEditingEnd(true);
  }, [localEnd]);

  // Calculate loop region percentages for visual display
  const loopBarPercentages = useMemo(() => {
    if (duration === 0) return { start: 0, end: 100 };
    const start = loopRegion?.start ?? 0;
    const end = loopRegion?.end ?? duration;
    return {
      start: (start / duration) * 100,
      end: (end / duration) * 100,
    };
  }, [loopRegion, duration]);

  // Current position percentage
  const currentPositionPercent = useMemo(() => {
    if (duration === 0) return 0;
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  const handleToggleLoop = useCallback(() => {
    log('Toggle loop:', !loopEnabled);
    onLoopEnabledChange(!loopEnabled);
  }, [loopEnabled, onLoopEnabledChange]);

  const handleSetLoopStart = useCallback(() => {
    log('Setting loop start to current time:', currentTime);
    const newRegion: LoopRegion = {
      start: currentTime,
      end: loopRegion?.end ?? duration,
    };
    // Ensure start is before end
    if (newRegion.start >= newRegion.end) {
      newRegion.end = duration;
    }
    onLoopRegionChange?.(newRegion);
  }, [currentTime, loopRegion, duration, onLoopRegionChange]);

  const handleSetLoopEnd = useCallback(() => {
    log('Setting loop end to current time:', currentTime);
    const newRegion: LoopRegion = {
      start: loopRegion?.start ?? 0,
      end: currentTime,
    };
    // Ensure end is after start
    if (newRegion.end <= newRegion.start) {
      newRegion.start = 0;
    }
    onLoopRegionChange?.(newRegion);
  }, [currentTime, loopRegion, onLoopRegionChange]);

  const handleClearLoop = useCallback(() => {
    log('Clearing loop region');
    onLoopRegionChange?.(null);
  }, [onLoopRegionChange]);

  const handleLoopAll = useCallback(() => {
    log('Setting loop to entire track');
    onLoopRegionChange?.({ start: 0, end: duration });
  }, [duration, onLoopRegionChange]);

  const handleStartChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      setEditStart(value);
    },
    []
  );

  const handleEndChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      setEditEnd(value);
    },
    []
  );

  const handleStartBlur = useCallback(() => {
    setEditingStart(false);
    if (editStart < localEnd && editStart >= 0) {
      onLoopRegionChange?.({ start: editStart, end: localEnd });
    }
  }, [editStart, localEnd, onLoopRegionChange]);

  const handleEndBlur = useCallback(() => {
    setEditingEnd(false);
    if (editEnd > localStart && editEnd <= duration) {
      onLoopRegionChange?.({ start: localStart, end: editEnd });
    }
  }, [editEnd, localStart, duration, onLoopRegionChange]);

  // Styles
  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    ...style,
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  };

  const labelStyle: CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const toggleButtonStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '6px 12px',
    fontSize: '0.875rem',
    fontWeight: 500,
    border: '1px solid',
    borderColor: loopEnabled ? '#3b82f6' : '#d1d5db',
    borderRadius: '6px',
    backgroundColor: loopEnabled ? '#dbeafe' : 'white',
    color: loopEnabled ? '#1e40af' : '#374151',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    opacity: disabled ? 0.5 : 1,
  };

  const loopBarContainerStyle: CSSProperties = {
    position: 'relative',
    height: '24px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    overflow: 'hidden',
  };

  const loopRegionStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: `${loopBarPercentages.start}%`,
    width: `${loopBarPercentages.end - loopBarPercentages.start}%`,
    height: '100%',
    backgroundColor: loopEnabled ? 'rgba(59, 130, 246, 0.3)' : 'rgba(156, 163, 175, 0.3)',
    borderLeft: '2px solid',
    borderRight: '2px solid',
    borderColor: loopEnabled ? '#3b82f6' : '#9ca3af',
    transition: 'all 0.15s ease',
  };

  const currentPositionStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: `${currentPositionPercent}%`,
    width: '2px',
    height: '100%',
    backgroundColor: '#ef4444',
    transform: 'translateX(-1px)',
  };

  const controlsContainerStyle: CSSProperties = {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    alignItems: 'center',
  };

  const smallButtonStyle: CSSProperties = {
    padding: '4px 8px',
    fontSize: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    backgroundColor: 'white',
    color: '#374151',
    cursor: disabled || !loopEnabled ? 'not-allowed' : 'pointer',
    opacity: disabled || !loopEnabled ? 0.5 : 1,
    transition: 'all 0.15s ease',
  };

  const timeInputStyle: CSSProperties = {
    width: '60px',
    padding: '4px 6px',
    fontSize: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    textAlign: 'center',
  };

  const timeDisplayStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.75rem',
    color: '#6b7280',
  };

  return (
    <div
      className={`loop-selector ${className}`.trim()}
      style={containerStyle}
      data-testid={testId}
    >
      {/* Header with toggle */}
      <div style={headerStyle}>
        <div style={labelStyle}>
          <span>Loop</span>
          {loopRegion && (
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {formatTime(loopRegion.start)} - {formatTime(loopRegion.end)}
            </span>
          )}
        </div>
        <button
          onClick={handleToggleLoop}
          disabled={disabled}
          style={toggleButtonStyle}
          aria-pressed={loopEnabled}
          aria-label={loopEnabled ? 'Disable loop' : 'Enable loop'}
          data-testid={`${testId}-toggle`}
        >
          <LoopIcon size={16} active={loopEnabled} />
          {loopEnabled ? 'On' : 'Off'}
        </button>
      </div>

      {/* Loop region visual bar */}
      {showLoopBar && (
        <div
          style={loopBarContainerStyle}
          data-testid={`${testId}-bar`}
          role="img"
          aria-label={`Loop region from ${formatTime(loopRegion?.start ?? 0)} to ${formatTime(loopRegion?.end ?? duration)}`}
        >
          <div style={loopRegionStyle} data-testid={`${testId}-region`} />
          <div style={currentPositionStyle} data-testid={`${testId}-position`} />
        </div>
      )}

      {/* Loop controls */}
      {loopEnabled && (
        <div style={controlsContainerStyle}>
          {/* Set start/end buttons */}
          <button
            onClick={handleSetLoopStart}
            disabled={disabled}
            style={smallButtonStyle}
            aria-label="Set loop start to current position"
            data-testid={`${testId}-set-start`}
          >
            Set Start
          </button>
          <button
            onClick={handleSetLoopEnd}
            disabled={disabled}
            style={smallButtonStyle}
            aria-label="Set loop end to current position"
            data-testid={`${testId}-set-end`}
          >
            Set End
          </button>
          <button
            onClick={handleLoopAll}
            disabled={disabled}
            style={smallButtonStyle}
            aria-label="Loop entire track"
            data-testid={`${testId}-loop-all`}
          >
            Loop All
          </button>
          <button
            onClick={handleClearLoop}
            disabled={disabled}
            style={smallButtonStyle}
            aria-label="Clear loop region"
            data-testid={`${testId}-clear`}
          >
            Clear
          </button>

          {/* Time inputs */}
          {mode === 'time' && (
            <div style={timeDisplayStyle}>
              <span>Start:</span>
              {editingStart ? (
                <input
                  type="number"
                  value={editStart}
                  onChange={handleStartChange}
                  onBlur={handleStartBlur}
                  min={0}
                  max={localEnd}
                  step={0.1}
                  style={timeInputStyle}
                  autoFocus
                  data-testid={`${testId}-start-input`}
                />
              ) : (
                <button
                  onClick={handleStartEdit}
                  style={{ ...smallButtonStyle, minWidth: '50px' }}
                  data-testid={`${testId}-start-display`}
                >
                  {formatTime(localStart)}
                </button>
              )}
              <span>End:</span>
              {editingEnd ? (
                <input
                  type="number"
                  value={editEnd}
                  onChange={handleEndChange}
                  onBlur={handleEndBlur}
                  min={localStart}
                  max={duration}
                  step={0.1}
                  style={timeInputStyle}
                  autoFocus
                  data-testid={`${testId}-end-input`}
                />
              ) : (
                <button
                  onClick={handleEndEdit}
                  style={{ ...smallButtonStyle, minWidth: '50px' }}
                  data-testid={`${testId}-end-display`}
                >
                  {formatTime(localEnd)}
                </button>
              )}
            </div>
          )}

          {/* Measure-based selection */}
          {mode === 'measure' && measures && measures.length > 0 && (
            <div style={timeDisplayStyle}>
              <span>Measures:</span>
              <select
                value={measures.findIndex((m) => m.startTime <= (loopRegion?.start ?? 0) && m.endTime >= (loopRegion?.start ?? 0)) + 1}
                onChange={(e) => {
                  const measureNum = parseInt(e.target.value, 10);
                  const measure = measures[measureNum - 1];
                  if (measure) {
                    onLoopRegionChange?.({
                      start: measure.startTime,
                      end: loopRegion?.end ?? duration,
                    });
                  }
                }}
                disabled={disabled}
                style={{ ...timeInputStyle, width: '50px' }}
                data-testid={`${testId}-measure-start`}
              >
                {measures.map((m) => (
                  <option key={m.number} value={m.number}>
                    {m.number}
                  </option>
                ))}
              </select>
              <span>to</span>
              <select
                value={measures.findIndex((m) => m.startTime <= (loopRegion?.end ?? duration) && m.endTime >= (loopRegion?.end ?? duration)) + 1}
                onChange={(e) => {
                  const measureNum = parseInt(e.target.value, 10);
                  const measure = measures[measureNum - 1];
                  if (measure) {
                    onLoopRegionChange?.({
                      start: loopRegion?.start ?? 0,
                      end: measure.endTime,
                    });
                  }
                }}
                disabled={disabled}
                style={{ ...timeInputStyle, width: '50px' }}
                data-testid={`${testId}-measure-end`}
              >
                {measures.map((m) => (
                  <option key={m.number} value={m.number}>
                    {m.number}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LoopSelector;
