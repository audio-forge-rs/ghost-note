/**
 * LyricEditor Component
 *
 * Main container component for lyric editing with diff view,
 * suggestions, version history, and manual editing capabilities.
 *
 * @module components/LyricEditor/LyricEditor
 */

import type { ReactElement } from 'react';
import { useState, useCallback, useMemo } from 'react';
import { usePoemStore, selectCurrentLyrics, selectCurrentVersion } from '@/stores/usePoemStore';
import { useAnalysisStore } from '@/stores/useAnalysisStore';
import {
  useSuggestionStore,
  selectPendingCount,
  selectIsLoading as selectSuggestionsLoading,
} from '@/stores/useSuggestionStore';
import type { SuggestionWithStatus } from '@/stores/useSuggestionStore';
import { DiffView } from './DiffView';
import { InlineDiff } from './InlineDiff';
import { SuggestionCard } from './SuggestionCard';
import { VersionList } from './VersionList';
import type { LyricEditorProps, DiffViewMode, LyricSuggestion } from './types';
import './LyricEditor.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[LyricEditor] ${message}`, ...args);
  }
};

/**
 * Maps a SuggestionWithStatus from the store to a LyricSuggestion for the UI.
 * This bridges the gap between the store's suggestion format and the
 * SuggestionCard component's expected format.
 */
function mapStoreToLyricSuggestion(
  storeSuggestion: SuggestionWithStatus,
  currentLyrics: string
): LyricSuggestion {
  // Extract the line text to find positions
  const lines = currentLyrics.split('\n');
  const lineIndex = storeSuggestion.lineNumber - 1;
  const lineText = lines[lineIndex] ?? '';

  // Find the word position in the line
  const wordIndex = lineText.toLowerCase().indexOf(storeSuggestion.originalWord.toLowerCase());
  const startPos = wordIndex >= 0 ? wordIndex : 0;
  const endPos = startPos + storeSuggestion.originalWord.length;

  // Map problem type to category
  const category = mapProblemTypeToCategory(storeSuggestion.reason);

  return {
    id: storeSuggestion.id,
    originalText: storeSuggestion.originalWord,
    suggestedText: storeSuggestion.suggestedWord,
    reason: storeSuggestion.reason,
    category,
    status: storeSuggestion.status,
    lineNumber: storeSuggestion.lineNumber,
    startPos,
    endPos,
  };
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Maps a reason/problem description to a suggestion category
 */
function mapProblemTypeToCategory(reason: string): LyricSuggestion['category'] {
  const lowerReason = reason.toLowerCase();

  if (lowerReason.includes('sing') || lowerReason.includes('sound')) {
    return 'singability';
  }
  if (lowerReason.includes('stress') || lowerReason.includes('beat') || lowerReason.includes('rhythm')) {
    return 'meter';
  }
  if (lowerReason.includes('rhyme')) {
    return 'rhyme';
  }
  if (lowerReason.includes('syllable') || lowerReason.includes('variance')) {
    return 'meter';
  }

  return 'other';
}

/**
 * Tab options for the editor
 */
type TabId = 'editor' | 'compare' | 'suggestions' | 'history';

interface Tab {
  id: TabId;
  label: string;
  ariaLabel: string;
}

const TABS: Tab[] = [
  { id: 'editor', label: 'Edit', ariaLabel: 'Edit lyrics' },
  { id: 'compare', label: 'Compare', ariaLabel: 'Compare versions' },
  { id: 'suggestions', label: 'Suggestions', ariaLabel: 'View suggestions' },
  { id: 'history', label: 'History', ariaLabel: 'Version history' },
];

/**
 * LyricEditor provides a complete lyric editing interface.
 *
 * Features:
 * - Manual text editing with auto-save
 * - Side-by-side diff comparison
 * - Inline diff highlighting
 * - Suggestion cards with accept/reject
 * - Version history with rollback
 * - Re-analysis trigger on manual edits
 * - Responsive layout
 *
 * @example
 * ```tsx
 * <LyricEditor />
 * ```
 */
export function LyricEditor({
  className = '',
  testId = 'lyric-editor',
}: LyricEditorProps): ReactElement {
  // Local UI state
  const [activeTab, setActiveTab] = useState<TabId>('editor');
  const [diffViewMode, setDiffViewMode] = useState<DiffViewMode>('side-by-side');
  const [editText, setEditText] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [expandedSuggestionId, setExpandedSuggestionId] = useState<string | null>(null);

  // Poem store data
  const original = usePoemStore((state) => state.original);
  const versions = usePoemStore((state) => state.versions);
  const currentVersionIndex = usePoemStore((state) => state.currentVersionIndex);
  const currentLyrics = usePoemStore(selectCurrentLyrics);
  const currentVersion = usePoemStore(selectCurrentVersion);
  const addVersion = usePoemStore((state) => state.addVersion);
  const revertToVersion = usePoemStore((state) => state.revertToVersion);
  const deleteVersion = usePoemStore((state) => state.deleteVersion);

  // Analysis store
  const analyze = useAnalysisStore((state) => state.analyze);

  // Suggestion store data
  const storeSuggestions = useSuggestionStore((state) => state.suggestions);
  const pendingSuggestionsCount = useSuggestionStore(selectPendingCount);
  const suggestionsLoading = useSuggestionStore(selectSuggestionsLoading);
  const acceptSuggestion = useSuggestionStore((state) => state.acceptSuggestion);
  const rejectSuggestion = useSuggestionStore((state) => state.rejectSuggestion);

  // Map store suggestions to LyricSuggestion format for UI
  const suggestions = useMemo(() => {
    return storeSuggestions.map((s) => mapStoreToLyricSuggestion(s, currentLyrics));
  }, [storeSuggestions, currentLyrics]);

  log('Rendering LyricEditor', {
    activeTab,
    hasOriginal: !!original,
    versionCount: versions.length,
    currentVersionIndex,
    isEditing,
  });

  // Check if we have content to work with
  const hasContent = original.trim().length > 0;

  // Computed values
  const compareSource = useMemo(() => {
    // Compare current version against original
    return {
      original,
      modified: currentLyrics,
    };
  }, [original, currentLyrics]);

  // Handlers
  const handleTabChange = useCallback((tabId: TabId) => {
    log('Changing tab to:', tabId);
    setActiveTab(tabId);
  }, []);

  const handleStartEdit = useCallback(() => {
    log('Starting edit mode');
    setEditText(currentLyrics);
    setIsEditing(true);
  }, [currentLyrics]);

  const handleCancelEdit = useCallback(() => {
    log('Cancelling edit');
    setIsEditing(false);
    setEditText('');
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editText.trim()) {
      log('Cannot save empty text');
      return;
    }

    if (editText === currentLyrics) {
      log('No changes to save');
      setIsEditing(false);
      return;
    }

    log('Saving edit and creating new version');
    addVersion(editText, 'Manual edit');
    setIsEditing(false);
    setEditText('');

    // Trigger re-analysis
    const currentVersionId = currentVersion?.id ?? null;
    analyze(editText, currentVersionId ?? undefined);
  }, [editText, currentLyrics, addVersion, analyze, currentVersion]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditText(e.target.value);
  }, []);

  const handleVersionSelect = useCallback(
    (index: number) => {
      log('Selecting version:', index);
      revertToVersion(index);
    },
    [revertToVersion]
  );

  const handleVersionDelete = useCallback(
    (id: string) => {
      log('Deleting version:', id);
      deleteVersion(id);
    },
    [deleteVersion]
  );

  const handleSuggestionAccept = useCallback(
    (id: string) => {
      log('Accepting suggestion:', id);

      // Update store state
      acceptSuggestion(id);

      // Find the suggestion and apply it to create a new version
      const suggestion = suggestions.find((s) => s.id === id);
      if (suggestion) {
        log('Applying suggestion to lyrics:', suggestion.originalText, '->', suggestion.suggestedText);

        // Replace the word in the lyrics (case-insensitive replacement preserving case)
        const lines = currentLyrics.split('\n');
        const lineIndex = suggestion.lineNumber - 1;

        if (lineIndex >= 0 && lineIndex < lines.length) {
          const line = lines[lineIndex];
          // Find and replace the word in this specific line
          const regex = new RegExp(`\\b${escapeRegExp(suggestion.originalText)}\\b`, 'i');
          const newLine = line.replace(regex, suggestion.suggestedText);

          if (newLine !== line) {
            lines[lineIndex] = newLine;
            const newText = lines.join('\n');
            addVersion(newText, `Applied suggestion: ${suggestion.reason}`);
            log('Created new version with applied suggestion');
          }
        }
      }
    },
    [suggestions, currentLyrics, addVersion, acceptSuggestion]
  );

  const handleSuggestionReject = useCallback(
    (id: string) => {
      log('Rejecting suggestion:', id);
      rejectSuggestion(id);
    },
    [rejectSuggestion]
  );

  const handleToggleSuggestionExpand = useCallback((id: string) => {
    setExpandedSuggestionId((prev) => (prev === id ? null : id));
  }, []);

  const handleDiffModeToggle = useCallback(() => {
    setDiffViewMode((prev) => (prev === 'side-by-side' ? 'inline' : 'side-by-side'));
  }, []);

  // Keyboard handling for textarea
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Cmd/Ctrl + Enter to save
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSaveEdit();
      }
      // Escape to cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelEdit();
      }
    },
    [handleSaveEdit, handleCancelEdit]
  );

  const containerClass = [
    'lyric-editor',
    !hasContent ? 'lyric-editor--empty' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  // Empty state
  if (!hasContent) {
    return (
      <div className={containerClass} data-testid={testId}>
        <div className="lyric-editor__empty">
          <h3 className="lyric-editor__empty-title">No Lyrics to Edit</h3>
          <p className="lyric-editor__empty-description">
            Enter a poem first to start editing lyrics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass} data-testid={testId}>
      {/* Tab navigation */}
      <div className="lyric-editor__tabs" role="tablist" aria-label="Editor sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            className={`lyric-editor__tab ${activeTab === tab.id ? 'lyric-editor__tab--active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
            data-testid={`${testId}-tab-${tab.id}`}
          >
            {tab.label}
            {tab.id === 'suggestions' && pendingSuggestionsCount > 0 && (
              <span className="lyric-editor__tab-badge">{pendingSuggestionsCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="lyric-editor__panels">
        {/* Editor panel */}
        {activeTab === 'editor' && (
          <div
            id="panel-editor"
            role="tabpanel"
            aria-labelledby="tab-editor"
            className="lyric-editor__panel lyric-editor__panel--editor"
            data-testid={`${testId}-panel-editor`}
          >
            {isEditing ? (
              <div className="lyric-editor__edit-mode">
                <textarea
                  className="lyric-editor__textarea"
                  value={editText}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter your lyrics..."
                  aria-label="Edit lyrics"
                  data-testid={`${testId}-textarea`}
                />
                <div className="lyric-editor__edit-actions">
                  <button
                    type="button"
                    className="lyric-editor__action lyric-editor__action--secondary"
                    onClick={handleCancelEdit}
                    data-testid={`${testId}-cancel`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="lyric-editor__action lyric-editor__action--primary"
                    onClick={handleSaveEdit}
                    disabled={!editText.trim() || editText === currentLyrics}
                    data-testid={`${testId}-save`}
                  >
                    Save & Analyze
                  </button>
                </div>
                <p className="lyric-editor__hint">
                  Press <kbd>Cmd</kbd>+<kbd>Enter</kbd> to save, <kbd>Esc</kbd> to cancel
                </p>
              </div>
            ) : (
              <div className="lyric-editor__view-mode">
                <div className="lyric-editor__current-text" data-testid={`${testId}-current-text`}>
                  <pre>{currentLyrics}</pre>
                </div>
                <button
                  type="button"
                  className="lyric-editor__action lyric-editor__action--primary"
                  onClick={handleStartEdit}
                  data-testid={`${testId}-edit-button`}
                >
                  Edit Lyrics
                </button>
                {currentVersion && (
                  <p className="lyric-editor__version-info">
                    Viewing: {currentVersion.description || `Version ${currentVersionIndex + 1}`}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Compare panel */}
        {activeTab === 'compare' && (
          <div
            id="panel-compare"
            role="tabpanel"
            aria-labelledby="tab-compare"
            className="lyric-editor__panel lyric-editor__panel--compare"
            data-testid={`${testId}-panel-compare`}
          >
            <div className="lyric-editor__compare-header">
              <span className="lyric-editor__compare-label">
                Comparing original with current version
              </span>
              <button
                type="button"
                className="lyric-editor__mode-toggle"
                onClick={handleDiffModeToggle}
                aria-label={`Switch to ${diffViewMode === 'side-by-side' ? 'inline' : 'side-by-side'} view`}
                data-testid={`${testId}-mode-toggle`}
              >
                {diffViewMode === 'side-by-side' ? 'Inline View' : 'Side-by-Side'}
              </button>
            </div>

            {diffViewMode === 'side-by-side' ? (
              <DiffView
                originalText={compareSource.original}
                modifiedText={compareSource.modified}
                testId={`${testId}-diff-view`}
              />
            ) : (
              <InlineDiff
                originalText={compareSource.original}
                modifiedText={compareSource.modified}
                showLineNumbers
                testId={`${testId}-inline-diff`}
              />
            )}
          </div>
        )}

        {/* Suggestions panel */}
        {activeTab === 'suggestions' && (
          <div
            id="panel-suggestions"
            role="tabpanel"
            aria-labelledby="tab-suggestions"
            className="lyric-editor__panel lyric-editor__panel--suggestions"
            data-testid={`${testId}-panel-suggestions`}
          >
            {suggestionsLoading ? (
              <div className="lyric-editor__suggestions-loading" data-testid={`${testId}-suggestions-loading`}>
                <p>Generating suggestions...</p>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="lyric-editor__no-suggestions">
                <p className="lyric-editor__no-suggestions-text">
                  No suggestions available yet. Analyze your poem to get lyric improvement suggestions.
                </p>
              </div>
            ) : (
              <div className="lyric-editor__suggestions-list">
                {suggestions.map((suggestion) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onAccept={handleSuggestionAccept}
                    onReject={handleSuggestionReject}
                    expanded={expandedSuggestionId === suggestion.id}
                    onToggleExpand={handleToggleSuggestionExpand}
                    testId={`${testId}-suggestion-${suggestion.id}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* History panel */}
        {activeTab === 'history' && (
          <div
            id="panel-history"
            role="tabpanel"
            aria-labelledby="tab-history"
            className="lyric-editor__panel lyric-editor__panel--history"
            data-testid={`${testId}-panel-history`}
          >
            <VersionList
              versions={versions}
              currentVersionIndex={currentVersionIndex}
              onSelectVersion={handleVersionSelect}
              onDeleteVersion={handleVersionDelete}
              originalText={original}
              testId={`${testId}-version-list`}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default LyricEditor;
