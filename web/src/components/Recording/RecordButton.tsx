/**
 * RecordButton Component
 *
 * A button for starting and stopping audio recording with visual states
 * for idle, recording, paused, and preparing states.
 */

import { useCallback } from 'react';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[RecordButton] ${message}`, ...args);
  }
};

/**
 * Visual state of the record button
 */
export type RecordButtonState = 'idle' | 'preparing' | 'recording' | 'paused';

/**
 * Button size options
 */
export type RecordButtonSize = 'small' | 'medium' | 'large';

/**
 * Props for RecordButton component
 */
export interface RecordButtonProps {
  /** Current state of the button */
  state?: RecordButtonState;
  /** Callback when button is clicked */
  onClick?: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Size of the button */
  size?: RecordButtonSize;
  /** Whether to show a pulsing animation when recording */
  showPulse?: boolean;
  /** Custom CSS class name */
  className?: string;
  /** Label for accessibility */
  'aria-label'?: string;
}

/**
 * Size configurations
 */
const SIZES: Record<RecordButtonSize, { outer: number; inner: number; icon: number }> = {
  small: { outer: 48, inner: 36, icon: 16 },
  medium: { outer: 64, inner: 48, icon: 20 },
  large: { outer: 80, inner: 60, icon: 24 },
};

/**
 * RecordButton displays a circular button for recording control.
 *
 * Features:
 * - Distinct visual states (idle, preparing, recording, paused)
 * - Optional pulsing animation during recording
 * - Accessible with ARIA labels
 * - Multiple sizes
 *
 * @example
 * ```tsx
 * <RecordButton
 *   state="idle"
 *   onClick={() => startRecording()}
 *   size="large"
 * />
 * ```
 */
export function RecordButton({
  state = 'idle',
  onClick,
  disabled = false,
  size = 'medium',
  showPulse = true,
  className = '',
  'aria-label': ariaLabel,
}: RecordButtonProps): React.ReactElement {
  const sizeConfig = SIZES[size];

  // Handle click with logging
  const handleClick = useCallback(() => {
    log('Button clicked, current state:', state);
    onClick?.();
  }, [onClick, state]);

  // Determine aria-label based on state
  const getAriaLabel = (): string => {
    if (ariaLabel) return ariaLabel;

    switch (state) {
      case 'idle':
        return 'Start recording';
      case 'preparing':
        return 'Preparing to record';
      case 'recording':
        return 'Stop recording';
      case 'paused':
        return 'Resume recording';
      default:
        return 'Record';
    }
  };

  // Get button content based on state
  const renderIcon = (): React.ReactElement => {
    switch (state) {
      case 'idle':
        // Circle (record icon)
        return (
          <circle
            cx={sizeConfig.outer / 2}
            cy={sizeConfig.outer / 2}
            r={sizeConfig.icon / 2}
            fill="currentColor"
          />
        );

      case 'preparing':
        // Spinner
        return (
          <g transform={`translate(${sizeConfig.outer / 2}, ${sizeConfig.outer / 2})`}>
            <circle
              r={sizeConfig.icon / 2}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${Math.PI * sizeConfig.icon * 0.6} ${Math.PI * sizeConfig.icon}`}
              className="record-button__spinner"
            />
          </g>
        );

      case 'recording':
        // Square (stop icon)
        return (
          <rect
            x={(sizeConfig.outer - sizeConfig.icon) / 2}
            y={(sizeConfig.outer - sizeConfig.icon) / 2}
            width={sizeConfig.icon}
            height={sizeConfig.icon}
            rx={2}
            fill="currentColor"
          />
        );

      case 'paused': {
        // Double bars (pause icon with resume indicator)
        const barWidth = sizeConfig.icon / 4;
        const barHeight = sizeConfig.icon;
        const gap = sizeConfig.icon / 4;
        const startX = (sizeConfig.outer - (barWidth * 2 + gap)) / 2;
        const startY = (sizeConfig.outer - barHeight) / 2;

        return (
          <>
            <rect
              x={startX}
              y={startY}
              width={barWidth}
              height={barHeight}
              rx={1}
              fill="currentColor"
            />
            <rect
              x={startX + barWidth + gap}
              y={startY}
              width={barWidth}
              height={barHeight}
              rx={1}
              fill="currentColor"
            />
          </>
        );
      }

      default:
        return (
          <circle
            cx={sizeConfig.outer / 2}
            cy={sizeConfig.outer / 2}
            r={sizeConfig.icon / 2}
            fill="currentColor"
          />
        );
    }
  };

  // Container styles
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  // Pulse ring styles (when recording)
  const pulseStyle: React.CSSProperties = {
    position: 'absolute',
    width: sizeConfig.outer + 16,
    height: sizeConfig.outer + 16,
    borderRadius: '50%',
    border: '2px solid',
    borderColor: 'inherit',
    opacity: 0,
    animation: showPulse && state === 'recording' ? 'recordPulse 1.5s ease-out infinite' : 'none',
  };

  // Button styles
  const buttonStyle: React.CSSProperties = {
    width: sizeConfig.outer,
    height: sizeConfig.outer,
    borderRadius: '50%',
    border: '3px solid',
    borderColor: 'currentColor',
    backgroundColor: 'transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'transform 0.2s, background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    position: 'relative',
    color: 'inherit',
  };

  // Inner circle for visual depth
  const innerCircleStyle: React.CSSProperties = {
    position: 'absolute',
    width: sizeConfig.inner,
    height: sizeConfig.inner,
    borderRadius: '50%',
    backgroundColor: state === 'recording' ? '#ef4444' : 'currentColor',
    opacity: state === 'recording' ? 1 : 0.1,
    transition: 'opacity 0.2s, background-color 0.2s',
  };

  // State-specific color classes
  const getStateClass = (): string => {
    switch (state) {
      case 'idle':
        return 'record-button--idle';
      case 'preparing':
        return 'record-button--preparing';
      case 'recording':
        return 'record-button--recording';
      case 'paused':
        return 'record-button--paused';
      default:
        return '';
    }
  };

  return (
    <div
      className={`record-button record-button--${size} ${getStateClass()} ${className}`.trim()}
      style={containerStyle}
      data-testid="record-button"
    >
      {/* Pulse ring for recording state */}
      {showPulse && state === 'recording' && (
        <div
          className="record-button__pulse"
          style={pulseStyle}
          data-testid="record-pulse"
        />
      )}

      {/* Main button */}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || state === 'preparing'}
        aria-label={getAriaLabel()}
        aria-busy={state === 'preparing'}
        aria-pressed={state === 'recording'}
        className="record-button__button"
        style={buttonStyle}
        data-testid="record-button-control"
        data-state={state}
      >
        {/* Inner highlight circle */}
        <div style={innerCircleStyle} className="record-button__inner" />

        {/* Icon */}
        <svg
          width={sizeConfig.outer}
          height={sizeConfig.outer}
          viewBox={`0 0 ${sizeConfig.outer} ${sizeConfig.outer}`}
          aria-hidden="true"
          style={{ position: 'relative', zIndex: 1 }}
          className="record-button__icon"
        >
          {renderIcon()}
        </svg>
      </button>

      {/* CSS for animations */}
      <style>{`
        @keyframes recordPulse {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        @keyframes recordSpin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .record-button__spinner {
          animation: recordSpin 1s linear infinite;
          transform-origin: center;
        }

        .record-button--recording {
          color: #ef4444;
        }

        .record-button--paused {
          color: #f59e0b;
        }

        .record-button--preparing {
          color: #6b7280;
        }

        .record-button--idle {
          color: #10b981;
        }

        .record-button__button:hover:not(:disabled) {
          transform: scale(1.05);
        }

        .record-button__button:active:not(:disabled) {
          transform: scale(0.95);
        }

        .record-button__button:focus-visible {
          outline: 2px solid currentColor;
          outline-offset: 4px;
        }
      `}</style>
    </div>
  );
}

export default RecordButton;
