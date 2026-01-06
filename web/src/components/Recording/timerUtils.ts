/**
 * Timer Utilities
 *
 * Utility functions for timer formatting.
 *
 * @module components/Recording/timerUtils
 */

/**
 * Timer display format options
 */
export type TimerFormat = 'compact' | 'full' | 'minimal';

/**
 * Format duration to time string based on format type
 */
export function formatDuration(seconds: number, format: TimerFormat): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  switch (format) {
    case 'full':
      // Always show HH:MM:SS
      return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        secs.toString().padStart(2, '0'),
      ].join(':');

    case 'minimal':
      // Show M:SS or MM:SS (no hours unless needed)
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${secs.toString().padStart(2, '0')}`;

    case 'compact':
    default:
      // Show MM:SS, add hours if over 60 minutes
      if (hours > 0) {
        return [
          hours.toString().padStart(2, '0'),
          minutes.toString().padStart(2, '0'),
          secs.toString().padStart(2, '0'),
        ].join(':');
      }
      return [
        minutes.toString().padStart(2, '0'),
        secs.toString().padStart(2, '0'),
      ].join(':');
  }
}
