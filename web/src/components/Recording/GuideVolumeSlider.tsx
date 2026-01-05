/**
 * GuideVolumeSlider Component
 *
 * A slider control for adjusting the guide track volume during recording.
 * The guide track is the melody playback that helps guide the singer.
 */

import { useCallback } from 'react';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[GuideVolumeSlider] ${message}`, ...args);
  }
};

/**
 * Props for GuideVolumeSlider component
 */
export interface GuideVolumeSliderProps {
  /** Current volume value (0-1) */
  value: number;
  /** Callback when volume changes */
  onChange: (volume: number) => void;
  /** Whether the slider is disabled */
  disabled?: boolean;
  /** Whether to show the volume label */
  showLabel?: boolean;
  /** Whether to show the percentage value */
  showValue?: boolean;
  /** Custom label text */
  label?: string;
  /** Orientation of the slider */
  orientation?: 'horizontal' | 'vertical';
  /** Size of the slider */
  size?: 'small' | 'medium' | 'large';
  /** Custom CSS class name */
  className?: string;
  /** Whether to show mute button */
  showMuteButton?: boolean;
  /** Callback when mute is toggled */
  onMuteToggle?: () => void;
  /** Whether currently muted */
  isMuted?: boolean;
}

/**
 * Size configurations
 */
const SIZES = {
  small: { track: 4, thumb: 12, width: 100 },
  medium: { track: 6, thumb: 16, width: 150 },
  large: { track: 8, thumb: 20, width: 200 },
};

/**
 * GuideVolumeSlider provides a control for adjusting the guide track volume.
 *
 * Features:
 * - Smooth slider with thumb control
 * - Optional mute button
 * - Visual feedback with fill color
 * - Accessible with keyboard navigation
 * - Horizontal or vertical orientation
 *
 * @example
 * ```tsx
 * <GuideVolumeSlider
 *   value={0.7}
 *   onChange={(volume) => setGuideVolume(volume)}
 *   showLabel
 *   showValue
 * />
 * ```
 */
export function GuideVolumeSlider({
  value,
  onChange,
  disabled = false,
  showLabel = true,
  showValue = true,
  label = 'Guide Volume',
  orientation = 'horizontal',
  size = 'medium',
  className = '',
  showMuteButton = true,
  onMuteToggle,
  isMuted = false,
}: GuideVolumeSliderProps): React.ReactElement {
  const sizeConfig = SIZES[size];

  // Clamp value to 0-1
  const normalizedValue = Math.max(0, Math.min(1, value));
  const displayValue = isMuted ? 0 : normalizedValue;
  const percentage = Math.round(displayValue * 100);

  // Handle slider change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      log('Volume changed to:', newValue);
      onChange(newValue);
    },
    [onChange]
  );

  // Handle mute toggle
  const handleMuteClick = useCallback(() => {
    log('Mute toggled');
    onMuteToggle?.();
  }, [onMuteToggle]);

  // Get volume icon based on level
  const getVolumeIcon = (): React.ReactElement => {
    if (isMuted || displayValue === 0) {
      // Muted icon (speaker with X)
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="guide-volume-slider__icon"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      );
    }

    if (displayValue < 0.5) {
      // Low volume icon
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="guide-volume-slider__icon"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      );
    }

    // High volume icon
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="guide-volume-slider__icon"
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    );
  };

  // Container styles
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexDirection: orientation === 'vertical' ? 'column' : 'row',
    opacity: disabled ? 0.5 : 1,
  };

  // Slider track styles
  const trackStyle: React.CSSProperties = {
    position: 'relative',
    width: orientation === 'vertical' ? sizeConfig.track : sizeConfig.width,
    height: orientation === 'vertical' ? sizeConfig.width : sizeConfig.track,
    backgroundColor: '#374151',
    borderRadius: sizeConfig.track / 2,
    overflow: 'hidden',
  };

  // Slider fill styles
  const fillStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    bottom: 0,
    backgroundColor: isMuted ? '#6b7280' : '#3b82f6',
    borderRadius: sizeConfig.track / 2,
    transition: 'width 0.1s, height 0.1s',
    ...(orientation === 'vertical'
      ? { width: '100%', height: `${displayValue * 100}%` }
      : { height: '100%', width: `${displayValue * 100}%` }),
  };

  // Input range styles (for interaction)
  const inputStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: disabled ? 'not-allowed' : 'pointer',
    margin: 0,
    ...(orientation === 'vertical' && {
      writingMode: 'vertical-lr' as const,
      direction: 'rtl' as const,
    }),
  };

  // Mute button styles
  const muteButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizeConfig.thumb + 8,
    height: sizeConfig.thumb + 8,
    padding: 0,
    border: 'none',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    color: isMuted ? '#ef4444' : '#9ca3af',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'color 0.2s, background-color 0.2s',
  };

  // Icon styles
  const iconStyle: React.CSSProperties = {
    width: sizeConfig.thumb,
    height: sizeConfig.thumb,
  };

  return (
    <div
      className={`guide-volume-slider guide-volume-slider--${size} guide-volume-slider--${orientation} ${className}`.trim()}
      style={containerStyle}
      data-testid="guide-volume-slider"
    >
      {/* Label */}
      {showLabel && (
        <label
          className="guide-volume-slider__label"
          style={{
            fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
            color: '#9ca3af',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </label>
      )}

      {/* Mute button */}
      {showMuteButton && (
        <button
          type="button"
          onClick={handleMuteClick}
          disabled={disabled}
          className="guide-volume-slider__mute-button"
          style={muteButtonStyle}
          aria-label={isMuted ? 'Unmute guide track' : 'Mute guide track'}
          aria-pressed={isMuted}
          data-testid="mute-button"
        >
          <span style={iconStyle}>{getVolumeIcon()}</span>
        </button>
      )}

      {/* Slider track and thumb */}
      <div
        className="guide-volume-slider__track"
        style={trackStyle}
        data-testid="volume-track"
      >
        {/* Fill */}
        <div
          className="guide-volume-slider__fill"
          style={fillStyle}
          data-testid="volume-fill"
        />

        {/* Hidden input for interaction */}
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={normalizedValue}
          onChange={handleChange}
          disabled={disabled}
          className="guide-volume-slider__input"
          style={inputStyle}
          aria-label={`${label}: ${percentage}%`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
          data-testid="volume-input"
        />
      </div>

      {/* Percentage value */}
      {showValue && (
        <span
          className="guide-volume-slider__value"
          style={{
            fontSize: size === 'small' ? '10px' : size === 'large' ? '14px' : '12px',
            color: '#9ca3af',
            minWidth: '32px',
            textAlign: 'right',
          }}
          data-testid="volume-value"
        >
          {percentage}%
        </span>
      )}

      {/* Styles */}
      <style>{`
        .guide-volume-slider__mute-button:hover:not(:disabled) {
          background-color: rgba(255, 255, 255, 0.1);
          color: ${isMuted ? '#f87171' : '#d1d5db'};
        }

        .guide-volume-slider__mute-button:focus-visible {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .guide-volume-slider__track:hover .guide-volume-slider__fill {
          background-color: ${isMuted ? '#9ca3af' : '#60a5fa'};
        }

        .guide-volume-slider__input:focus + .guide-volume-slider__fill {
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
}

export default GuideVolumeSlider;
