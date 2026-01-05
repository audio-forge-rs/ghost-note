/**
 * TakeItem Component
 *
 * Displays a single recorded take with playback controls and options.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { RecordingTake } from '@/stores/types';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[TakeItem] ${message}`, ...args);
  }
};

/**
 * Props for TakeItem component
 */
export interface TakeItemProps {
  /** The take to display */
  take: RecordingTake;
  /** Whether this take is selected */
  isSelected?: boolean;
  /** Whether this take is currently playing */
  isPlaying?: boolean;
  /** Callback when the take is selected */
  onSelect?: (id: string) => void;
  /** Callback when play/pause is clicked */
  onPlayPause?: (id: string) => void;
  /** Callback when delete is clicked */
  onDelete?: (id: string) => void;
  /** Callback when rename is triggered */
  onRename?: (id: string, newName: string) => void;
  /** Whether rename is enabled */
  canRename?: boolean;
  /** Whether delete is enabled */
  canDelete?: boolean;
  /** Custom CSS class name */
  className?: string;
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
 * Format timestamp to readable date/time
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * TakeItem displays a single recorded take.
 *
 * Features:
 * - Play/pause control
 * - Duration display
 * - Timestamp display
 * - Rename capability
 * - Delete capability
 * - Selection state
 *
 * @example
 * ```tsx
 * <TakeItem
 *   take={take}
 *   isSelected={selectedId === take.id}
 *   onSelect={(id) => selectTake(id)}
 *   onPlayPause={(id) => togglePlayback(id)}
 *   onDelete={(id) => deleteTake(id)}
 * />
 * ```
 */
export function TakeItem({
  take,
  isSelected = false,
  isPlaying = false,
  onSelect,
  onPlayPause,
  onDelete,
  onRename,
  canRename = true,
  canDelete = true,
  className = '',
}: TakeItemProps): React.ReactElement {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(take.name || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Reset edit state when take changes
  // Using requestAnimationFrame to defer state updates and avoid synchronous setState in effect
  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      setEditName(take.name || '');
      setIsEditing(false);
      setShowDeleteConfirm(false);
    });
    return () => cancelAnimationFrame(rafId);
  }, [take.id, take.name]);

  // Handle select
  const handleSelect = useCallback(() => {
    log('Take selected:', take.id);
    onSelect?.(take.id);
  }, [take.id, onSelect]);

  // Handle play/pause
  const handlePlayPause = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      log('Play/pause:', take.id);
      onPlayPause?.(take.id);
    },
    [take.id, onPlayPause]
  );

  // Handle start editing
  const handleStartEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!canRename) return;
      log('Start editing:', take.id);
      setEditName(take.name || `Take ${take.id.slice(-4)}`);
      setIsEditing(true);
    },
    [take.id, take.name, canRename]
  );

  // Handle save edit
  const handleSaveEdit = useCallback(() => {
    const trimmedName = editName.trim();
    if (trimmedName && trimmedName !== take.name) {
      log('Saving rename:', take.id, trimmedName);
      onRename?.(take.id, trimmedName);
    }
    setIsEditing(false);
  }, [take.id, take.name, editName, onRename]);

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    log('Cancel edit:', take.id);
    setEditName(take.name || '');
    setIsEditing(false);
  }, [take.id, take.name]);

  // Handle key down in edit mode
  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSaveEdit();
      } else if (e.key === 'Escape') {
        handleCancelEdit();
      }
    },
    [handleSaveEdit, handleCancelEdit]
  );

  // Handle delete
  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!canDelete) return;

      if (showDeleteConfirm) {
        log('Delete confirmed:', take.id);
        onDelete?.(take.id);
        setShowDeleteConfirm(false);
      } else {
        log('Show delete confirm:', take.id);
        setShowDeleteConfirm(true);
        // Auto-hide confirm after 3 seconds
        setTimeout(() => setShowDeleteConfirm(false), 3000);
      }
    },
    [take.id, showDeleteConfirm, canDelete, onDelete]
  );

  // Get display name
  const displayName = take.name || `Take ${take.id.slice(-4).toUpperCase()}`;

  // Container styles
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    borderRadius: '8px',
    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
    border: isSelected ? '2px solid rgba(59, 130, 246, 0.5)' : '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  // Play button styles
  const playButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: '50%',
    backgroundColor: isPlaying ? '#ef4444' : '#3b82f6',
    border: 'none',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.2s',
  };

  // Info section styles
  const infoStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  };

  // Name styles
  const nameStyle: React.CSSProperties = {
    fontSize: '0.9375rem',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  // Meta styles
  const metaStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
    fontSize: '0.8125rem',
    opacity: 0.6,
  };

  // Action button styles
  const actionButtonStyle: React.CSSProperties = {
    padding: '0.375rem',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    opacity: 0.6,
    transition: 'opacity 0.2s, background-color 0.2s',
  };

  return (
    <div
      className={`take-item ${isSelected ? 'take-item--selected' : ''} ${isPlaying ? 'take-item--playing' : ''} ${className}`.trim()}
      style={containerStyle}
      onClick={handleSelect}
      role="listitem"
      aria-selected={isSelected}
      data-testid="take-item"
      data-take-id={take.id}
    >
      {/* Play/Pause button */}
      <button
        type="button"
        onClick={handlePlayPause}
        style={playButtonStyle}
        className="take-item__play-button"
        aria-label={isPlaying ? 'Pause' : 'Play'}
        data-testid="take-play-button"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="white"
          aria-hidden="true"
        >
          {isPlaying ? (
            // Pause icon
            <>
              <rect x="3" y="2" width="4" height="12" rx="1" />
              <rect x="9" y="2" width="4" height="12" rx="1" />
            </>
          ) : (
            // Play icon
            <path d="M4 2.5v11l9-5.5-9-5.5z" />
          )}
        </svg>
      </button>

      {/* Info section */}
      <div style={infoStyle} className="take-item__info">
        {/* Name (editable) */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleEditKeyDown}
            onClick={(e) => e.stopPropagation()}
            style={{
              ...nameStyle,
              padding: '0.25rem 0.5rem',
              border: '1px solid #3b82f6',
              borderRadius: '4px',
              outline: 'none',
              backgroundColor: 'transparent',
            }}
            className="take-item__name-input"
            data-testid="take-name-input"
          />
        ) : (
          <span
            style={nameStyle}
            className="take-item__name"
            data-testid="take-name"
            onDoubleClick={handleStartEdit}
            title={canRename ? 'Double-click to rename' : undefined}
          >
            {displayName}
          </span>
        )}

        {/* Meta info */}
        <div style={metaStyle} className="take-item__meta">
          <span data-testid="take-duration">{formatDuration(take.duration)}</span>
          <span>|</span>
          <span data-testid="take-timestamp">{formatTimestamp(take.timestamp)}</span>
        </div>
      </div>

      {/* Actions */}
      <div
        style={{ display: 'flex', gap: '0.25rem' }}
        className="take-item__actions"
      >
        {/* Rename button */}
        {canRename && !isEditing && (
          <button
            type="button"
            onClick={handleStartEdit}
            style={actionButtonStyle}
            className="take-item__rename-button"
            aria-label="Rename"
            title="Rename"
            data-testid="take-rename-button"
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.6';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}

        {/* Delete button */}
        {canDelete && (
          <button
            type="button"
            onClick={handleDelete}
            style={{
              ...actionButtonStyle,
              color: showDeleteConfirm ? '#ef4444' : 'inherit',
            }}
            className="take-item__delete-button"
            aria-label={showDeleteConfirm ? 'Confirm delete' : 'Delete'}
            title={showDeleteConfirm ? 'Click again to confirm' : 'Delete'}
            data-testid="take-delete-button"
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.backgroundColor = showDeleteConfirm
                ? 'rgba(239, 68, 68, 0.1)'
                : 'rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.6';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              {showDeleteConfirm && (
                <>
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </>
              )}
            </svg>
          </button>
        )}
      </div>

      {/* CSS for hover states */}
      <style>{`
        .take-item:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }

        .take-item--selected:hover {
          background-color: rgba(59, 130, 246, 0.15);
        }

        .take-item__play-button:hover {
          transform: scale(1.05);
        }

        .take-item__play-button:active {
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
}

export default TakeItem;
