/**
 * HelpSection Component
 *
 * Renders a single help topic with formatted content and related topics.
 * Supports markdown-like formatting in the content.
 *
 * @module components/Help/HelpSection
 */

import { useMemo, type ReactElement } from 'react';
import {
  type HelpTopic,
  getRelatedTopics,
  getCategoryById,
} from './helpContent';
import './HelpSection.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[HelpSection] ${message}`, ...args);
  }
};

/**
 * Props for HelpSection component
 */
export interface HelpSectionProps {
  /** The topic to display */
  topic: HelpTopic;
  /** Callback when a related topic is selected */
  onTopicSelect?: (topic: HelpTopic) => void;
}

/**
 * Parse markdown-like content into React elements
 *
 * Supports:
 * - **bold** text
 * - Bullet lists (- item)
 * - Numbered lists (1. item)
 * - Headers (lines ending with :)
 */
function parseContent(content: string): ReactElement[] {
  const lines = content.split('\n');
  const elements: ReactElement[] = [];
  let currentList: { type: 'ul' | 'ol'; items: ReactElement[] } | null = null;
  let listKey = 0;

  const parseInlineFormatting = (text: string): ReactElement => {
    // Parse **bold** markers
    const parts: (string | ReactElement)[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch) {
        const beforeBold = remaining.substring(0, boldMatch.index);
        if (beforeBold) {
          parts.push(beforeBold);
        }
        parts.push(
          <strong key={`bold-${key++}`}>{boldMatch[1]}</strong>
        );
        remaining = remaining.substring(
          (boldMatch.index ?? 0) + boldMatch[0].length
        );
      } else {
        parts.push(remaining);
        break;
      }
    }

    return <>{parts}</>;
  };

  const flushList = (): void => {
    if (currentList) {
      if (currentList.type === 'ul') {
        elements.push(
          <ul key={`list-${listKey++}`} className="help-section__list">
            {currentList.items}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`list-${listKey++}`} className="help-section__list help-section__list--ordered">
            {currentList.items}
          </ol>
        );
      }
      currentList = null;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Empty line - flush any current list and add spacing
    if (!trimmed) {
      flushList();
      return;
    }

    // Bullet list item
    if (trimmed.startsWith('- ')) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(
        <li key={`item-${index}`}>{parseInlineFormatting(trimmed.substring(2))}</li>
      );
      return;
    }

    // Numbered list item
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(
        <li key={`item-${index}`}>{parseInlineFormatting(numberedMatch[2])}</li>
      );
      return;
    }

    // Regular line - flush any list first
    flushList();

    // Check if it's a header (bold line or ends with :)
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      const headerText = trimmed.slice(2, -2);
      elements.push(
        <h4 key={`header-${index}`} className="help-section__subheading">
          {headerText}
        </h4>
      );
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={`para-${index}`} className="help-section__paragraph">
        {parseInlineFormatting(trimmed)}
      </p>
    );
  });

  // Flush any remaining list
  flushList();

  return elements;
}

/**
 * Link icon for related topics
 */
function LinkIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

/**
 * HelpSection renders a single help topic with full content.
 *
 * Features:
 * - Markdown-like content formatting
 * - Bold text, lists, headers
 * - Related topics section
 * - Category badge
 *
 * @example
 * ```tsx
 * <HelpSection
 *   topic={selectedTopic}
 *   onTopicSelect={(topic) => setSelectedTopic(topic)}
 * />
 * ```
 */
export function HelpSection({
  topic,
  onTopicSelect,
}: HelpSectionProps): ReactElement {
  log('Rendering HelpSection:', topic.id);

  // Parse content into elements
  const contentElements = useMemo(() => parseContent(topic.content), [topic.content]);

  // Get related topics
  const relatedTopics = useMemo(() => getRelatedTopics(topic.id), [topic.id]);

  // Get category info
  const category = getCategoryById(topic.category);

  return (
    <article className="help-section" data-testid={`help-section-${topic.id}`}>
      {/* Category badge */}
      {category && (
        <span className="help-section__category-badge">
          {category.title}
        </span>
      )}

      {/* Title */}
      <h3 className="help-section__title">{topic.title}</h3>

      {/* Summary */}
      <p className="help-section__summary">{topic.summary}</p>

      {/* Main content */}
      <div className="help-section__content">
        {contentElements}
      </div>

      {/* Related topics */}
      {relatedTopics.length > 0 && onTopicSelect && (
        <div className="help-section__related">
          <h4 className="help-section__related-title">
            <LinkIcon />
            Related Topics
          </h4>
          <div className="help-section__related-list">
            {relatedTopics.map((relatedTopic) => (
              <button
                key={relatedTopic.id}
                type="button"
                className="help-section__related-item"
                onClick={() => onTopicSelect(relatedTopic)}
                data-testid={`help-related-${relatedTopic.id}`}
              >
                <span className="help-section__related-item-title">
                  {relatedTopic.title}
                </span>
                <span className="help-section__related-item-arrow">
                  &rarr;
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Keywords (for screen readers) */}
      <div className="help-section__keywords" aria-hidden="true">
        Keywords: {topic.keywords.join(', ')}
      </div>
    </article>
  );
}

export default HelpSection;
