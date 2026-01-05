/**
 * HelpPanel Component
 *
 * A sliding drawer that provides access to all help documentation.
 * Features search, category navigation, and topic browsing.
 *
 * @module components/Help/HelpPanel
 */

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactElement,
  type ChangeEvent,
} from 'react';
import { useFocusTrap } from '@/hooks';
import {
  HELP_CATEGORIES,
  HELP_TOPICS,
  searchTopics,
  getTopicsByCategory,
  type HelpCategory,
  type HelpTopic,
} from './helpContent';
import { HelpSection } from './HelpSection';
import { FAQ } from './FAQ';
import './HelpPanel.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[HelpPanel] ${message}`, ...args);
  }
};

/**
 * Props for HelpPanel component
 */
export interface HelpPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback to close the panel */
  onClose: () => void;
  /** Initial category to show (optional) */
  initialCategory?: HelpCategory;
  /** Initial topic ID to show (optional) */
  initialTopic?: string;
}

/**
 * Panel view modes
 */
type ViewMode = 'categories' | 'topics' | 'topic' | 'faq' | 'search';

/**
 * Category icons as SVG components
 */
function CategoryIcon({ icon }: { icon: string }): ReactElement {
  switch (icon) {
    case 'rocket':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
      );
    case 'chart':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case 'lightbulb':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
          <path d="M9 18h6" />
          <path d="M10 22h4" />
        </svg>
      );
    case 'music':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      );
    case 'microphone':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      );
    case 'keyboard':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
          <line x1="6" y1="8" x2="6" y2="8" />
          <line x1="10" y1="8" x2="10" y2="8" />
          <line x1="14" y1="8" x2="14" y2="8" />
          <line x1="18" y1="8" x2="18" y2="8" />
          <line x1="8" y1="12" x2="8" y2="12" />
          <line x1="12" y1="12" x2="12" y2="12" />
          <line x1="16" y1="12" x2="16" y2="12" />
          <line x1="7" y1="16" x2="17" y2="16" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
  }
}

/**
 * Back arrow icon
 */
function BackIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

/**
 * Close icon
 */
function CloseIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/**
 * Search icon
 */
function SearchIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

/**
 * FAQ icon
 */
function FAQIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/**
 * HelpPanel provides a comprehensive help system with search and navigation.
 *
 * Features:
 * - Category-based navigation
 * - Full-text search across all topics
 * - Topic detail view with related topics
 * - FAQ section
 * - Keyboard navigation and focus trapping
 *
 * @example
 * ```tsx
 * <HelpPanel
 *   isOpen={showHelp}
 *   onClose={() => setShowHelp(false)}
 * />
 * ```
 */
export function HelpPanel({
  isOpen,
  onClose,
  initialCategory,
  initialTopic,
}: HelpPanelProps): ReactElement | null {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('categories');
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory | null>(
    initialCategory ?? null
  );
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HelpTopic[]>([]);

  // Track previous isOpen state with a ref
  const wasOpenRef = useRef(isOpen);

  log('Rendering HelpPanel:', { isOpen, viewMode, selectedCategory });

  // Focus trap for the panel
  const { containerRef } = useFocusTrap({
    enabled: isOpen,
    autoFocus: true,
    returnFocus: true,
    initialFocusSelector: '[data-testid="help-search-input"]',
    onEscape: onClose,
  });

  // Handle panel open/close transitions
  // This effect uses a ref to track previous state and only sets state when panel opens
  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isOpen;

    // Panel just opened - initialize with initial topic if provided
    if (isOpen && !wasOpen && initialTopic) {
      const topic = HELP_TOPICS.find((t) => t.id === initialTopic);
      if (topic) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: initializing state on panel open
        setViewMode('topic');
         
        setSelectedCategory(topic.category);
         
        setSelectedTopic(topic);
      }
    }
    // Panel just closed - reset state for next open
    if (!isOpen && wasOpen) {
       
      setViewMode('categories');
       
      setSelectedCategory(initialCategory ?? null);
       
      setSelectedTopic(null);
       
      setSearchQuery('');
       
      setSearchResults([]);
    }
  }, [isOpen, initialTopic, initialCategory]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle search
  const handleSearch = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim()) {
      const results = searchTopics(query);
      setSearchResults(results);
      setViewMode('search');
    } else {
      setSearchResults([]);
      setViewMode('categories');
    }
  }, []);

  // Handle category selection
  const handleCategorySelect = useCallback((category: HelpCategory) => {
    log('Category selected:', category);
    setSelectedCategory(category);
    setViewMode('topics');
    setSearchQuery('');
  }, []);

  // Handle topic selection
  const handleTopicSelect = useCallback((topic: HelpTopic) => {
    log('Topic selected:', topic.id);
    setSelectedTopic(topic);
    setViewMode('topic');
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    log('Back clicked, current view:', viewMode);
    if (viewMode === 'topic') {
      if (selectedCategory) {
        setViewMode('topics');
      } else {
        setViewMode('categories');
      }
      setSelectedTopic(null);
    } else if (viewMode === 'topics') {
      setViewMode('categories');
      setSelectedCategory(null);
    } else if (viewMode === 'faq') {
      setViewMode('categories');
    } else if (viewMode === 'search') {
      setSearchQuery('');
      setSearchResults([]);
      setViewMode('categories');
    }
  }, [viewMode, selectedCategory]);

  // Handle FAQ navigation
  const handleFAQClick = useCallback(() => {
    log('FAQ clicked');
    setViewMode('faq');
    setSearchQuery('');
  }, []);

  // Handle overlay click
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        log('Overlay clicked, closing panel');
        onClose();
      }
    },
    [onClose]
  );

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  // Get current title based on view
  const getTitle = (): string => {
    switch (viewMode) {
      case 'categories':
        return 'Help Center';
      case 'topics':
        return (
          HELP_CATEGORIES.find((c) => c.id === selectedCategory)?.title ?? 'Help'
        );
      case 'topic':
        return selectedTopic?.title ?? 'Help';
      case 'faq':
        return 'Frequently Asked Questions';
      case 'search':
        return 'Search Results';
      default:
        return 'Help';
    }
  };

  // Render categories view
  const renderCategories = (): ReactElement => (
    <div className="help-panel__categories">
      {HELP_CATEGORIES.map((category) => (
        <button
          key={category.id}
          type="button"
          className="help-panel__category-card"
          onClick={() => handleCategorySelect(category.id)}
          data-testid={`help-category-${category.id}`}
        >
          <div className="help-panel__category-icon">
            <CategoryIcon icon={category.icon} />
          </div>
          <div className="help-panel__category-content">
            <h3 className="help-panel__category-title">{category.title}</h3>
            <p className="help-panel__category-description">
              {category.description}
            </p>
          </div>
        </button>
      ))}

      {/* FAQ quick link */}
      <button
        type="button"
        className="help-panel__category-card help-panel__category-card--faq"
        onClick={handleFAQClick}
        data-testid="help-faq-link"
      >
        <div className="help-panel__category-icon">
          <FAQIcon />
        </div>
        <div className="help-panel__category-content">
          <h3 className="help-panel__category-title">FAQ</h3>
          <p className="help-panel__category-description">
            Common questions and answers
          </p>
        </div>
      </button>
    </div>
  );

  // Render topics list
  const renderTopics = (): ReactElement => {
    const topics = selectedCategory ? getTopicsByCategory(selectedCategory) : [];

    return (
      <div className="help-panel__topics">
        {topics.map((topic) => (
          <button
            key={topic.id}
            type="button"
            className="help-panel__topic-item"
            onClick={() => handleTopicSelect(topic)}
            data-testid={`help-topic-${topic.id}`}
          >
            <h4 className="help-panel__topic-title">{topic.title}</h4>
            <p className="help-panel__topic-summary">{topic.summary}</p>
          </button>
        ))}
      </div>
    );
  };

  // Render search results
  const renderSearchResults = (): ReactElement => (
    <div className="help-panel__search-results">
      {searchResults.length === 0 ? (
        <div className="help-panel__no-results">
          <p>No results found for "{searchQuery}"</p>
          <p className="help-panel__no-results-hint">
            Try different keywords or browse categories
          </p>
        </div>
      ) : (
        <>
          <p className="help-panel__result-count">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}{' '}
            for "{searchQuery}"
          </p>
          {searchResults.map((topic) => (
            <button
              key={topic.id}
              type="button"
              className="help-panel__topic-item"
              onClick={() => handleTopicSelect(topic)}
              data-testid={`help-search-result-${topic.id}`}
            >
              <h4 className="help-panel__topic-title">{topic.title}</h4>
              <p className="help-panel__topic-summary">{topic.summary}</p>
              <span className="help-panel__topic-category">
                {HELP_CATEGORIES.find((c) => c.id === topic.category)?.title}
              </span>
            </button>
          ))}
        </>
      )}
    </div>
  );

  return (
    <div
      className="help-panel__overlay"
      onClick={handleOverlayClick}
      data-testid="help-panel-overlay"
    >
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className="help-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-panel-title"
        data-testid="help-panel"
      >
        {/* Header */}
        <div className="help-panel__header">
          <div className="help-panel__header-left">
            {viewMode !== 'categories' && (
              <button
                type="button"
                className="help-panel__back-button"
                onClick={handleBack}
                aria-label="Go back"
                data-testid="help-back-button"
              >
                <BackIcon />
              </button>
            )}
            <h2 id="help-panel-title" className="help-panel__title">
              {getTitle()}
            </h2>
          </div>
          <button
            type="button"
            className="help-panel__close-button"
            onClick={onClose}
            aria-label="Close help"
            data-testid="help-close-button"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Search */}
        <div className="help-panel__search">
          <SearchIcon />
          <input
            type="search"
            placeholder="Search help topics..."
            value={searchQuery}
            onChange={handleSearch}
            className="help-panel__search-input"
            data-testid="help-search-input"
            aria-label="Search help topics"
          />
        </div>

        {/* Content */}
        <div className="help-panel__content">
          {viewMode === 'categories' && renderCategories()}
          {viewMode === 'topics' && renderTopics()}
          {viewMode === 'topic' && selectedTopic && (
            <HelpSection
              topic={selectedTopic}
              onTopicSelect={handleTopicSelect}
            />
          )}
          {viewMode === 'faq' && <FAQ onTopicSelect={handleTopicSelect} />}
          {viewMode === 'search' && renderSearchResults()}
        </div>

        {/* Footer */}
        <div className="help-panel__footer">
          <p className="help-panel__footer-text">
            Press <kbd>?</kbd> anytime to open this help panel
          </p>
        </div>
      </div>
    </div>
  );
}

export default HelpPanel;
