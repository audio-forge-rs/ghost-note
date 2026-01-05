/**
 * TakesList Component
 *
 * Displays a list of recorded takes with playback and management controls.
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import type { RecordingTake } from '@/stores/types';
import { TakeItem } from './TakeItem';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[TakesList] ${message}`, ...args);
  }
};

/**
 * Sort options for takes list
 */
export type TakesSortOrder = 'newest' | 'oldest' | 'longest' | 'shortest' | 'name';

/**
 * Props for TakesList component
 */
export interface TakesListProps {
  /** Array of takes to display */
  takes: RecordingTake[];
  /** Currently selected take ID */
  selectedTakeId?: string | null;
  /** ID of the currently playing take */
  playingTakeId?: string | null;
  /** Callback when a take is selected */
  onSelectTake?: (id: string) => void;
  /** Callback when play/pause is triggered */
  onPlayPauseTake?: (id: string) => void;
  /** Callback when a take is deleted */
  onDeleteTake?: (id: string) => void;
  /** Callback when a take is renamed */
  onRenameTake?: (id: string, name: string) => void;
  /** Callback to clear all takes */
  onClearAll?: () => void;
  /** Sort order for takes */
  sortOrder?: TakesSortOrder;
  /** Callback when sort order changes */
  onSortChange?: (order: TakesSortOrder) => void;
  /** Whether to show the header with sort/clear controls */
  showHeader?: boolean;
  /** Whether takes can be edited (rename/delete) */
  editable?: boolean;
  /** Maximum height for scrollable list */
  maxHeight?: string;
  /** Custom CSS class name */
  className?: string;
  /** Empty state message */
  emptyMessage?: string;
}

/**
 * Sort takes based on order
 */
function sortTakes(takes: RecordingTake[], order: TakesSortOrder): RecordingTake[] {
  const sorted = [...takes];

  switch (order) {
    case 'newest':
      return sorted.sort((a, b) => b.timestamp - a.timestamp);
    case 'oldest':
      return sorted.sort((a, b) => a.timestamp - b.timestamp);
    case 'longest':
      return sorted.sort((a, b) => b.duration - a.duration);
    case 'shortest':
      return sorted.sort((a, b) => a.duration - b.duration);
    case 'name':
      return sorted.sort((a, b) => {
        const nameA = (a.name || a.id).toLowerCase();
        const nameB = (b.name || b.id).toLowerCase();
        return nameA.localeCompare(nameB);
      });
    default:
      return sorted;
  }
}

/**
 * Format total duration
 */
function formatTotalDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins < 60) {
    return `${mins}m ${secs}s`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

/**
 * TakesList displays a list of recorded takes.
 *
 * Features:
 * - Sortable list (by date, duration, name)
 * - Select/play/delete individual takes
 * - Clear all takes
 * - Empty state with message
 * - Scrollable with max height
 *
 * @example
 * ```tsx
 * <TakesList
 *   takes={takes}
 *   selectedTakeId={selectedId}
 *   playingTakeId={playingId}
 *   onSelectTake={(id) => selectTake(id)}
 *   onPlayPauseTake={(id) => togglePlay(id)}
 *   onDeleteTake={(id) => deleteTake(id)}
 * />
 * ```
 */
export function TakesList({
  takes,
  selectedTakeId,
  playingTakeId,
  onSelectTake,
  onPlayPauseTake,
  onDeleteTake,
  onRenameTake,
  onClearAll,
  sortOrder = 'newest',
  onSortChange,
  showHeader = true,
  editable = true,
  maxHeight = '400px',
  className = '',
  emptyMessage = 'No recordings yet. Press the record button to start.',
}: TakesListProps): React.ReactElement {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Sort takes
  const sortedTakes = sortTakes(takes, sortOrder);
  log('Sorted takes:', sortedTakes.length, 'by', sortOrder);

  // Calculate total duration
  const totalDuration = takes.reduce((sum, take) => sum + take.duration, 0);

  // Handle sort change
  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const order = e.target.value as TakesSortOrder;
      log('Sort order changed:', order);
      onSortChange?.(order);
    },
    [onSortChange]
  );

  // Handle clear all
  const handleClearAll = useCallback(() => {
    if (showClearConfirm) {
      log('Clear all confirmed');
      onClearAll?.();
      setShowClearConfirm(false);
    } else {
      log('Show clear confirm');
      setShowClearConfirm(true);
    }
  }, [showClearConfirm, onClearAll]);

  // Reset clear confirm after timeout
  useEffect(() => {
    if (showClearConfirm) {
      const timer = setTimeout(() => {
        setShowClearConfirm(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showClearConfirm]);

  // Container styles
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  };

  // Header styles
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
  };

  // Info styles
  const infoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.875rem',
  };

  // Select styles
  const selectStyle: React.CSSProperties = {
    padding: '0.375rem 0.75rem',
    fontSize: '0.8125rem',
    border: '1px solid rgba(0, 0, 0, 0.2)',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  };

  // Clear button styles
  const clearButtonStyle: React.CSSProperties = {
    padding: '0.375rem 0.75rem',
    fontSize: '0.8125rem',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: showClearConfirm ? '#ef4444' : 'transparent',
    color: showClearConfirm ? 'white' : 'inherit',
    cursor: 'pointer',
    opacity: showClearConfirm ? 1 : 0.6,
    transition: 'all 0.2s',
  };

  // List styles
  const listStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    maxHeight,
    overflowY: 'auto',
    padding: '0.25rem 0',
  };

  // Empty state styles
  const emptyStyle: React.CSSProperties = {
    padding: '3rem 1.5rem',
    textAlign: 'center',
    opacity: 0.6,
  };

  // Empty icon styles
  const emptyIconStyle: React.CSSProperties = {
    marginBottom: '1rem',
    opacity: 0.4,
  };

  return (
    <div
      className={`takes-list ${className}`.trim()}
      style={containerStyle}
      data-testid="takes-list"
    >
      {/* Header */}
      {showHeader && (
        <div style={headerStyle} className="takes-list__header">
          <div style={infoStyle} className="takes-list__info">
            <span data-testid="takes-count">
              {takes.length} {takes.length === 1 ? 'take' : 'takes'}
            </span>
            {takes.length > 0 && (
              <span
                style={{ opacity: 0.6 }}
                data-testid="takes-total-duration"
              >
                ({formatTotalDuration(totalDuration)} total)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {/* Sort dropdown */}
            {takes.length > 1 && (
              <select
                value={sortOrder}
                onChange={handleSortChange}
                style={selectStyle}
                className="takes-list__sort"
                aria-label="Sort takes"
                data-testid="takes-sort"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="longest">Longest first</option>
                <option value="shortest">Shortest first</option>
                <option value="name">By name</option>
              </select>
            )}

            {/* Clear all button */}
            {takes.length > 0 && onClearAll && (
              <button
                type="button"
                onClick={handleClearAll}
                style={clearButtonStyle}
                className="takes-list__clear"
                aria-label={showClearConfirm ? 'Confirm clear all' : 'Clear all takes'}
                data-testid="takes-clear-all"
                onMouseEnter={(e) => {
                  if (!showClearConfirm) {
                    e.currentTarget.style.opacity = '1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showClearConfirm) {
                    e.currentTarget.style.opacity = '0.6';
                  }
                }}
              >
                {showClearConfirm ? 'Confirm?' : 'Clear All'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Takes list */}
      {takes.length === 0 ? (
        <div style={emptyStyle} className="takes-list__empty" data-testid="takes-empty">
          <div style={emptyIconStyle}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </div>
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div
          ref={listRef}
          style={listStyle}
          className="takes-list__items"
          role="list"
          aria-label="Recorded takes"
          data-testid="takes-items"
        >
          {sortedTakes.map((take) => (
            <TakeItem
              key={take.id}
              take={take}
              isSelected={selectedTakeId === take.id}
              isPlaying={playingTakeId === take.id}
              onSelect={onSelectTake}
              onPlayPause={onPlayPauseTake}
              onDelete={onDeleteTake}
              onRename={onRenameTake}
              canRename={editable}
              canDelete={editable}
            />
          ))}
        </div>
      )}

      {/* CSS */}
      <style>{`
        .takes-list__items::-webkit-scrollbar {
          width: 6px;
        }

        .takes-list__items::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 3px;
        }

        .takes-list__items::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }

        .takes-list__items::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }

        .takes-list__sort:focus-visible,
        .takes-list__clear:focus-visible {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}

export default TakesList;
