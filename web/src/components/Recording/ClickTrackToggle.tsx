/**
 * ClickTrackToggle Component
 *
 * A toggle control for enabling/disabling the metronome click track
 * during recording. Optionally includes volume control.
 */

import { useCallback } from 'react';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[ClickTrackToggle] ${message}`, ...args);
  }
};

/**
 * Props for ClickTrackToggle component
 */
export interface ClickTrackToggleProps {
  /** Whether the click track is enabled */
  enabled: boolean;
  /** Callback when toggle state changes */
  onToggle: (enabled: boolean) => void;
  /** Current click track volume (0-1) */
  volume?: number;
  /** Callback when volume changes */
  onVolumeChange?: (volume: number) => void;
  /** Whether to show volume control */
  showVolumeControl?: boolean;
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Size of the control */
  size?: 'small' | 'medium' | 'large';
  /** Custom CSS class name */
  className?: string;
  /** Label text */
  label?: string;
  /** Whether to show the label */
  showLabel?: boolean;
}

/**
 * Size configurations
 */
const SIZES = {
  small: { toggle: 32, icon: 14, track: 18 },
  medium: { toggle: 40, icon: 18, track: 22 },
  large: { toggle: 48, icon: 22, track: 26 },
};

/**
 * Props for MetronomeIcon
 */
interface MetronomeIconProps {
  animate?: boolean;
  size: number;
}

/**
 * Metronome icon component
 */
function MetronomeIcon({ animate = false, size }: MetronomeIconProps): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        width: size,
        height: size,
      }}
      className={animate ? 'click-track-toggle__icon--animate' : ''}
    >
      {/* Metronome body (triangle) */}
      <path d="M5 22L12 2L19 22H5Z" />
      {/* Pendulum */}
      <line
        x1="12"
        y1="8"
        x2="12"
        y2="18"
        className={animate ? 'click-track-toggle__pendulum' : ''}
        style={{
          transformOrigin: '12px 18px',
        }}
      />
      {/* Weight on pendulum */}
      <circle
        cx="12"
        cy="10"
        r="2"
        fill="currentColor"
        className={animate ? 'click-track-toggle__weight' : ''}
        style={{
          transformOrigin: '12px 18px',
        }}
      />
    </svg>
  );
}

/**
 * ClickTrackToggle provides a control for the metronome click track.
 *
 * Features:
 * - Toggle switch for enable/disable
 * - Optional volume slider
 * - Metronome icon with animation when enabled
 * - Accessible with keyboard navigation
 *
 * @example
 * ```tsx
 * <ClickTrackToggle
 *   enabled={clickEnabled}
 *   onToggle={(enabled) => setClickEnabled(enabled)}
 *   volume={0.5}
 *   onVolumeChange={(vol) => setClickVolume(vol)}
 *   showVolumeControl
 * />
 * ```
 */
export function ClickTrackToggle({
  enabled,
  onToggle,
  volume = 0.5,
  onVolumeChange,
  showVolumeControl = false,
  disabled = false,
  size = 'medium',
  className = '',
  label = 'Click Track',
  showLabel = true,
}: ClickTrackToggleProps): React.ReactElement {
  const sizeConfig = SIZES[size];

  // Handle toggle click
  const handleToggle = useCallback(() => {
    if (disabled) return;
    const newState = !enabled;
    log('Click track toggled:', newState);
    onToggle(newState);
  }, [disabled, enabled, onToggle]);

  // Handle keyboard activation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  // Handle volume change
  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      log('Click volume changed:', newVolume);
      onVolumeChange?.(newVolume);
    },
    [onVolumeChange]
  );

  // Container styles
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    opacity: disabled ? 0.5 : 1,
  };

  // Toggle button styles
  const toggleButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizeConfig.toggle,
    height: sizeConfig.toggle,
    padding: 0,
    border: '2px solid',
    borderColor: enabled ? '#3b82f6' : '#4b5563',
    borderRadius: '8px',
    backgroundColor: enabled ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
    color: enabled ? '#3b82f6' : '#9ca3af',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease-out',
  };

  // Toggle track styles (for the switch appearance)
  const toggleTrackStyle: React.CSSProperties = {
    position: 'relative',
    width: sizeConfig.track * 2,
    height: sizeConfig.track,
    backgroundColor: enabled ? '#3b82f6' : '#4b5563',
    borderRadius: sizeConfig.track / 2,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.2s ease-out',
  };

  // Toggle thumb styles
  const toggleThumbStyle: React.CSSProperties = {
    position: 'absolute',
    top: 2,
    left: enabled ? sizeConfig.track + 2 : 2,
    width: sizeConfig.track - 4,
    height: sizeConfig.track - 4,
    backgroundColor: '#ffffff',
    borderRadius: '50%',
    transition: 'left 0.2s ease-out',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
  };

  // Volume slider styles
  const volumeSliderContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    opacity: enabled ? 1 : 0.4,
    pointerEvents: enabled ? 'auto' : 'none',
    transition: 'opacity 0.2s',
  };

  return (
    <div
      className={`click-track-toggle click-track-toggle--${size} ${className}`.trim()}
      style={containerStyle}
      data-testid="click-track-toggle"
    >
      {/* Label */}
      {showLabel && (
        <span
          className="click-track-toggle__label"
          style={{
            fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
            color: '#9ca3af',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      )}

      {/* Toggle with icon */}
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={`${label}: ${enabled ? 'On' : 'Off'}`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="click-track-toggle__button"
        style={toggleButtonStyle}
        data-testid="toggle-button"
      >
        <MetronomeIcon animate={enabled} size={sizeConfig.icon} />
      </button>

      {/* Toggle switch */}
      <div
        role="switch"
        aria-checked={enabled}
        aria-label={`${label} switch`}
        tabIndex={disabled ? -1 : 0}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className="click-track-toggle__track"
        style={toggleTrackStyle}
        data-testid="toggle-track"
      >
        <div
          className="click-track-toggle__thumb"
          style={toggleThumbStyle}
        />
      </div>

      {/* Volume control */}
      {showVolumeControl && (
        <div
          className="click-track-toggle__volume"
          style={volumeSliderContainerStyle}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ width: 16, height: 16, color: '#6b7280' }}
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            disabled={disabled || !enabled}
            className="click-track-toggle__volume-slider"
            style={{
              width: 60,
              height: 4,
              appearance: 'none',
              backgroundColor: '#374151',
              borderRadius: 2,
              cursor: enabled && !disabled ? 'pointer' : 'not-allowed',
            }}
            aria-label="Click track volume"
            data-testid="volume-slider"
          />
          <span
            style={{
              fontSize: '11px',
              color: '#6b7280',
              minWidth: '28px',
            }}
          >
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}

      {/* Styles */}
      <style>{`
        .click-track-toggle__button:hover:not(:disabled) {
          border-color: ${enabled ? '#60a5fa' : '#6b7280'};
          background-color: ${enabled ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)'};
        }

        .click-track-toggle__button:focus-visible {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .click-track-toggle__track:hover {
          opacity: 0.9;
        }

        .click-track-toggle__track:focus-visible {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .click-track-toggle__volume-slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .click-track-toggle__volume-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: none;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        @keyframes pendulum {
          0%, 100% {
            transform: rotate(-15deg);
          }
          50% {
            transform: rotate(15deg);
          }
        }

        .click-track-toggle__pendulum,
        .click-track-toggle__weight {
          animation: pendulum 0.6s ease-in-out infinite;
        }

        .click-track-toggle__icon--animate line,
        .click-track-toggle__icon--animate circle:last-of-type {
          animation: pendulum 0.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default ClickTrackToggle;
