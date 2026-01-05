/**
 * VersionList Component
 *
 * Displays a list of lyric versions with selection and rollback capabilities.
 * Shows version history with timestamps and change summaries.
 *
 * @module components/LyricEditor/VersionList
 */

import type { ReactElement } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { createPreview, countWords } from './diffUtils';
import { ConfirmDialog } from '@/components/Common';
import type { VersionListProps, LyricVersion } from './types';
import './VersionList.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[VersionList] ${message}`, ...args);
  }
};

/**
 * Formats a timestamp into a human-readable relative time
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else if (seconds > 10) {
    return `${seconds}s ago`;
  } else {
    return 'Just now';
  }
}

/**
 * Formats a timestamp into a full date string
 */
function formatFullDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Gets the change summary for a version
 */
function getChangeSummary(version: LyricVersion): string {
  const changeCount = version.changes.length;
  if (changeCount === 0) {
    return 'No changes';
  }

  const adds = version.changes.filter((c) => c.type === 'add').length;
  const removes = version.changes.filter((c) => c.type === 'remove').length;
  const modifies = version.changes.filter((c) => c.type === 'modify').length;

  const parts: string[] = [];
  if (adds > 0) parts.push(`${adds} add${adds === 1 ? '' : 's'}`);
  if (removes > 0) parts.push(`${removes} del${removes === 1 ? '' : 's'}`);
  if (modifies > 0) parts.push(`${modifies} mod${modifies === 1 ? '' : 's'}`);

  return parts.join(', ') || 'Changes';
}

/**
 * Props for a single version item
 */
interface VersionItemProps {
  version: LyricVersion | null;
  index: number;
  isSelected: boolean;
  isOriginal?: boolean;
  originalText?: string;
  onSelect: (index: number) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
  testId: string;
}

/**
 * Single version item in the list
 */
function VersionItem({
  version,
  index,
  isSelected,
  isOriginal = false,
  originalText = '',
  onSelect,
  onDelete,
  compact = false,
  testId,
}: VersionItemProps): ReactElement {
  const handleSelect = useCallback(() => {
    log('Selecting version:', { index, isOriginal });
    onSelect(index);
  }, [onSelect, index, isOriginal]);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (version && onDelete) {
        log('Deleting version:', version.id);
        onDelete(version.id);
      }
    },
    [version, onDelete]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSelect();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (version && onDelete && !isOriginal) {
          e.preventDefault();
          onDelete(version.id);
        }
      }
    },
    [handleSelect, version, onDelete, isOriginal]
  );

  // Compute display values
  const text = isOriginal ? originalText : version?.lyrics ?? '';
  const preview = createPreview(text.replace(/\n/g, ' '), compact ? 50 : 80);
  const wordCount = countWords(text);
  const timestamp = isOriginal ? null : version?.timestamp ?? null;
  const description = isOriginal ? 'Original poem' : version?.description ?? 'Edited version';
  const changeSummary = isOriginal || !version ? null : getChangeSummary(version);

  const itemClass = [
    'version-list__item',
    isSelected ? 'version-list__item--selected' : '',
    isOriginal ? 'version-list__item--original' : '',
    compact ? 'version-list__item--compact' : '',
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  const ariaLabel = isOriginal
    ? 'Original poem version'
    : `Version ${index + 1}: ${description}. ${timestamp ? formatFullDate(timestamp) : ''}`;

  return (
    <div
      className={itemClass}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      role="option"
      aria-selected={isSelected}
      aria-label={ariaLabel}
      tabIndex={0}
      data-testid={testId}
    >
      {/* Version indicator */}
      <div className="version-list__item-indicator">
        <span className="version-list__item-number">
          {isOriginal ? 'O' : index + 1}
        </span>
        {isSelected && (
          <span className="version-list__item-check" aria-hidden="true">
            ✓
          </span>
        )}
      </div>

      {/* Version details */}
      <div className="version-list__item-content">
        <div className="version-list__item-header">
          <span className="version-list__item-title">
            {isOriginal ? 'Original' : description}
          </span>
          {timestamp && (
            <span
              className="version-list__item-time"
              title={formatFullDate(timestamp)}
            >
              {formatRelativeTime(timestamp)}
            </span>
          )}
        </div>

        {!compact && (
          <>
            <div className="version-list__item-preview">{preview}</div>
            <div className="version-list__item-meta">
              <span className="version-list__item-words">{wordCount} words</span>
              {changeSummary && (
                <span className="version-list__item-changes">{changeSummary}</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Delete button (not for original) */}
      {!isOriginal && onDelete && (
        <button
          type="button"
          className="version-list__item-delete"
          onClick={handleDelete}
          aria-label={`Delete version ${index + 1}`}
          title="Delete version"
          data-testid={`${testId}-delete`}
        >
          ×
        </button>
      )}
    </div>
  );
}

/**
 * VersionList displays the version history of lyrics.
 *
 * Features:
 * - Original version always shown first
 * - Chronological list of all versions
 * - Selection highlighting
 * - Relative timestamps with full date on hover
 * - Word count and change summary
 * - Delete capability for non-original versions
 * - Compact mode for smaller displays
 * - Keyboard navigation support
 *
 * @example
 * ```tsx
 * <VersionList
 *   versions={versions}
 *   currentVersionIndex={currentIndex}
 *   onSelectVersion={setCurrentIndex}
 *   originalText={originalPoem}
 * />
 * ```
 */
export function VersionList({
  versions,
  currentVersionIndex,
  onSelectVersion,
  onDeleteVersion,
  originalText,
  compact = false,
  className = '',
  testId = 'version-list',
}: VersionListProps): ReactElement {
  // State for confirmation dialogs
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState<LyricVersion | null>(null);
  const [showRevertDialog, setShowRevertDialog] = useState(false);

  log('Rendering VersionList', {
    versionCount: versions.length,
    currentVersionIndex,
    compact,
  });

  // Check if viewing original
  const isViewingOriginal = currentVersionIndex === -1;

  // Sorted versions (newest first for display, but original always first)
  const sortedVersions = useMemo(() => {
    return [...versions].sort((a, b) => b.timestamp - a.timestamp);
  }, [versions]);

  // Handle delete with confirmation
  const handleDeleteClick = useCallback((id: string) => {
    const version = versions.find((v) => v.id === id);
    if (version) {
      log('Opening delete dialog for version:', id);
      setVersionToDelete(version);
      setShowDeleteDialog(true);
    }
  }, [versions]);

  // Confirm delete
  const handleConfirmDelete = useCallback(() => {
    if (versionToDelete && onDeleteVersion) {
      log('Delete confirmed for version:', versionToDelete.id);
      onDeleteVersion(versionToDelete.id);
    }
    setShowDeleteDialog(false);
    setVersionToDelete(null);
  }, [versionToDelete, onDeleteVersion]);

  // Cancel delete
  const handleCancelDelete = useCallback(() => {
    log('Delete cancelled');
    setShowDeleteDialog(false);
    setVersionToDelete(null);
  }, []);

  // Handle select with revert confirmation when selecting original
  const handleSelectVersion = useCallback((index: number) => {
    // If selecting original and we have versions, show confirmation
    if (index === -1 && versions.length > 0 && currentVersionIndex !== -1) {
      log('Opening revert dialog');
      setShowRevertDialog(true);
    } else {
      log('Selecting version:', index);
      onSelectVersion(index);
    }
  }, [versions.length, currentVersionIndex, onSelectVersion]);

  // Confirm revert to original
  const handleConfirmRevert = useCallback(() => {
    log('Revert to original confirmed');
    onSelectVersion(-1);
    setShowRevertDialog(false);
  }, [onSelectVersion]);

  // Cancel revert
  const handleCancelRevert = useCallback(() => {
    log('Revert cancelled');
    setShowRevertDialog(false);
  }, []);

  const containerClass = [
    'version-list',
    compact ? 'version-list--compact' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <div
      className={containerClass}
      data-testid={testId}
      role="listbox"
      aria-label="Version history"
    >
      {/* Header */}
      <div className="version-list__header">
        <h3 className="version-list__title">Version History</h3>
        <span className="version-list__count">
          {versions.length + 1} version{versions.length !== 0 ? 's' : ''}
        </span>
      </div>

      {/* Version items */}
      <div className="version-list__items">
        {/* Original version */}
        <VersionItem
          version={null}
          index={-1}
          isSelected={isViewingOriginal}
          isOriginal
          originalText={originalText}
          onSelect={handleSelectVersion}
          compact={compact}
          testId={`${testId}-item-original`}
        />

        {/* Other versions (newest first) */}
        {sortedVersions.map((version) => {
          // Find the original index in the versions array
          const originalIndex = versions.findIndex((v) => v.id === version.id);
          return (
            <VersionItem
              key={version.id}
              version={version}
              index={originalIndex}
              isSelected={currentVersionIndex === originalIndex}
              onSelect={handleSelectVersion}
              onDelete={onDeleteVersion ? handleDeleteClick : undefined}
              compact={compact}
              testId={`${testId}-item-${version.id}`}
            />
          );
        })}
      </div>

      {/* Footer */}
      {versions.length === 0 && (
        <div className="version-list__empty" data-testid={`${testId}-empty`}>
          <span className="version-list__empty-text">
            No edited versions yet. Make changes to create a new version.
          </span>
        </div>
      )}

      {/* Delete version confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Version"
        message={
          versionToDelete
            ? `Are you sure you want to delete "${versionToDelete.description || 'this version'}"? This action cannot be undone.`
            : 'Are you sure you want to delete this version?'
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        testId="version-delete-dialog"
      />

      {/* Revert to original confirmation dialog */}
      <ConfirmDialog
        isOpen={showRevertDialog}
        onClose={handleCancelRevert}
        onConfirm={handleConfirmRevert}
        title="Revert to Original"
        message="Are you sure you want to revert to the original version? You can still switch back to any edited version from the history."
        confirmText="Revert"
        cancelText="Cancel"
        variant="warning"
        testId="version-revert-dialog"
      />
    </div>
  );
}

export default VersionList;
