/**
 * SamplePoemPicker Component
 *
 * A component that allows users to browse and select from a library
 * of sample poems. Provides filtering, search, and poem preview.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  samplePoems,
  getSamplePoemById,
  searchSamplePoems,
  getAllForms,
  type SamplePoem,
  type PoemForm,
} from '@/data/samplePoems';
import './SamplePoemPicker.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[SamplePoemPicker] ${message}`, ...args);
  }
};

/**
 * Props for SamplePoemPicker component
 */
export interface SamplePoemPickerProps {
  /** Callback when a poem is selected */
  onSelect: (poem: SamplePoem) => void;
  /** Optional currently selected poem ID */
  selectedPoemId?: string;
  /** Whether to show the preview panel */
  showPreview?: boolean;
  /** Custom CSS class name */
  className?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
}

/**
 * Formats a form name for display
 */
function formatFormName(form: PoemForm): string {
  return form
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * SamplePoemPicker provides a UI for browsing and selecting sample poems.
 *
 * Features:
 * - Search by title, author, or description
 * - Filter by poem form (sonnet, haiku, etc.)
 * - Poem preview with metadata
 * - Keyboard navigation support
 *
 * @example
 * ```tsx
 * <SamplePoemPicker
 *   onSelect={(poem) => console.log('Selected:', poem.title)}
 *   showPreview
 * />
 * ```
 */
export function SamplePoemPicker({
  onSelect,
  selectedPoemId,
  showPreview = true,
  className = '',
  disabled = false,
}: SamplePoemPickerProps): React.ReactElement {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForm, setSelectedForm] = useState<PoemForm | 'all'>('all');
  const [hoveredPoemId, setHoveredPoemId] = useState<string | null>(null);

  // Get all available forms
  const availableForms = useMemo(() => getAllForms(), []);

  // Filter poems based on search and form
  const filteredPoems = useMemo(() => {
    log('Filtering poems, query:', searchQuery, 'form:', selectedForm);

    let poems = searchQuery ? searchSamplePoems(searchQuery) : samplePoems;

    if (selectedForm !== 'all') {
      poems = poems.filter((poem) => poem.form === selectedForm);
    }

    return poems;
  }, [searchQuery, selectedForm]);

  // Get the poem to preview (hovered or selected)
  const previewPoem = useMemo(() => {
    if (hoveredPoemId) {
      return getSamplePoemById(hoveredPoemId);
    }
    if (selectedPoemId) {
      return getSamplePoemById(selectedPoemId);
    }
    return filteredPoems[0];
  }, [hoveredPoemId, selectedPoemId, filteredPoems]);

  // Handle poem selection
  const handleSelect = useCallback(
    (poem: SamplePoem) => {
      if (disabled) return;
      log('Poem selected:', poem.title);
      onSelect(poem);
    },
    [onSelect, disabled]
  );

  // Handle search input change
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  // Handle form filter change
  const handleFormChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as PoemForm | 'all';
      setSelectedForm(value);
    },
    []
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, poem: SamplePoem) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSelect(poem);
      }
    },
    [handleSelect]
  );

  return (
    <div
      className={`sample-poem-picker ${className}`.trim()}
      data-testid="sample-poem-picker"
    >
      {/* Search and Filter Controls */}
      <div className="picker-controls">
        <div className="search-container">
          <label htmlFor="poem-search" className="visually-hidden">
            Search poems
          </label>
          <input
            id="poem-search"
            type="text"
            placeholder="Search by title, author, or description..."
            value={searchQuery}
            onChange={handleSearchChange}
            disabled={disabled}
            className="search-input"
            aria-label="Search poems"
          />
        </div>

        <div className="filter-container">
          <label htmlFor="form-filter" className="filter-label">
            Form:
          </label>
          <select
            id="form-filter"
            value={selectedForm}
            onChange={handleFormChange}
            disabled={disabled}
            className="form-select"
            aria-label="Filter by poem form"
          >
            <option value="all">All Forms</option>
            {availableForms.map((form) => (
              <option key={form} value={form}>
                {formatFormName(form)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="picker-content">
        {/* Poem List */}
        <div className="poem-list" role="listbox" aria-label="Sample poems">
          {filteredPoems.length === 0 ? (
            <div className="no-results" role="status">
              No poems found matching your criteria.
            </div>
          ) : (
            filteredPoems.map((poem) => (
              <div
                key={poem.id}
                role="option"
                aria-selected={selectedPoemId === poem.id}
                tabIndex={disabled ? -1 : 0}
                className={`poem-item ${
                  selectedPoemId === poem.id ? 'selected' : ''
                } ${disabled ? 'disabled' : ''}`}
                onClick={() => handleSelect(poem)}
                onKeyDown={(e) => handleKeyDown(e, poem)}
                onMouseEnter={() => setHoveredPoemId(poem.id)}
                onMouseLeave={() => setHoveredPoemId(null)}
                data-testid={`poem-item-${poem.id}`}
              >
                <div className="poem-item-header">
                  <span className="poem-title">{poem.title}</span>
                  <span className="poem-form">{formatFormName(poem.form)}</span>
                </div>
                <div className="poem-meta">
                  <span className="poem-author">{poem.author}</span>
                  {poem.year && (
                    <span className="poem-year">({poem.year})</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Poem Preview */}
        {showPreview && previewPoem && (
          <div
            className="poem-preview"
            data-testid="poem-preview"
            aria-live="polite"
          >
            <div className="preview-header">
              <h3 className="preview-title">{previewPoem.title}</h3>
              <p className="preview-attribution">
                by <span className="preview-author">{previewPoem.author}</span>
                {previewPoem.year && (
                  <span className="preview-year"> ({previewPoem.year})</span>
                )}
              </p>
            </div>

            <div className="preview-text">
              <pre>{previewPoem.text}</pre>
            </div>

            <div className="preview-footer">
              <p className="preview-description">{previewPoem.description}</p>

              <div className="preview-details">
                <span className="detail-item">
                  <strong>Form:</strong> {formatFormName(previewPoem.form)}
                </span>
                <span className="detail-item">
                  <strong>Meter:</strong> {previewPoem.expectedMeter.name}
                </span>
                <span className="detail-item">
                  <strong>Style:</strong>{' '}
                  {previewPoem.style.charAt(0).toUpperCase() +
                    previewPoem.style.slice(1)}
                </span>
              </div>

              <div className="preview-tags">
                {previewPoem.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>

              {previewPoem.source && (
                <p className="preview-source">
                  <em>Source: {previewPoem.source}</em>
                </p>
              )}

              <button
                type="button"
                onClick={() => handleSelect(previewPoem)}
                disabled={disabled}
                className="select-button"
              >
                Use This Poem
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="picker-footer">
        <span className="results-count">
          Showing {filteredPoems.length} of {samplePoems.length} poems
        </span>
      </div>
    </div>
  );
}

export default SamplePoemPicker;
