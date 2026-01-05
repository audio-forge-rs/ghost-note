/**
 * FAQ Component
 *
 * Displays frequently asked questions in an accordion-style format.
 * Questions can be expanded/collapsed individually.
 *
 * @module components/Help/FAQ
 */

import { useState, useCallback, type ReactElement } from 'react';
import {
  FAQ_ITEMS,
  HELP_CATEGORIES,
  type FAQItem,
  type HelpTopic,
  type HelpCategory,
} from './helpContent';
import './FAQ.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[FAQ] ${message}`, ...args);
  }
};

/**
 * Props for FAQ component
 */
export interface FAQProps {
  /** Optional filter by category */
  category?: HelpCategory;
  /** Callback when user clicks on a link to a help topic (reserved for future use) */
  onTopicSelect?: (topic: HelpTopic) => void;
  /** Maximum number of items to show (0 = all) */
  maxItems?: number;
}

/**
 * Chevron icon for accordion
 */
function ChevronIcon({ expanded }: { expanded: boolean }): ReactElement {
  return (
    <svg
      className={`faq__chevron ${expanded ? 'faq__chevron--expanded' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/**
 * Single FAQ item with expandable answer
 */
function FAQItemComponent({
  item,
  isExpanded,
  onToggle,
}: {
  item: FAQItem;
  isExpanded: boolean;
  onToggle: () => void;
}): ReactElement {
  // Parse answer for links to help topics
  const parseAnswer = (text: string): ReactElement[] => {
    // Simple implementation - just return the text as-is
    // Could be enhanced to detect and create links to help topics
    return [<span key="text">{text}</span>];
  };

  const category = HELP_CATEGORIES.find((c) => c.id === item.category);

  return (
    <div
      className={`faq__item ${isExpanded ? 'faq__item--expanded' : ''}`}
      data-testid={`faq-item-${item.id}`}
    >
      <button
        type="button"
        className="faq__question"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`faq-answer-${item.id}`}
        data-testid={`faq-question-${item.id}`}
      >
        <span className="faq__question-text">{item.question}</span>
        <ChevronIcon expanded={isExpanded} />
      </button>

      <div
        id={`faq-answer-${item.id}`}
        className="faq__answer"
        aria-hidden={!isExpanded}
      >
        <div className="faq__answer-content">
          {parseAnswer(item.answer)}
        </div>
        {category && (
          <span className="faq__category-badge">{category.title}</span>
        )}
      </div>
    </div>
  );
}

/**
 * FAQ displays frequently asked questions in an accordion format.
 *
 * Features:
 * - Expandable/collapsible questions
 * - Category filtering
 * - Links to related help topics
 * - Accessible accordion pattern
 *
 * @example
 * ```tsx
 * <FAQ
 *   category="analysis"
 *   onTopicSelect={(topic) => navigateToTopic(topic)}
 * />
 * ```
 */
export function FAQ({
  category,
  onTopicSelect: _onTopicSelect, // Reserved for future use
  maxItems = 0,
}: FAQProps): ReactElement {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Log for debugging (onTopicSelect reserved for future topic linking feature)
  log('Rendering FAQ:', { category, itemCount: FAQ_ITEMS.length, hasTopicSelectHandler: !!_onTopicSelect });

  // Filter items by category if provided
  let items = category
    ? FAQ_ITEMS.filter((item) => item.category === category)
    : FAQ_ITEMS;

  // Limit items if maxItems is set
  if (maxItems > 0) {
    items = items.slice(0, maxItems);
  }

  // Group items by category for display
  const groupedItems = items.reduce<Map<HelpCategory, FAQItem[]>>((acc, item) => {
    const existingItems = acc.get(item.category) || [];
    acc.set(item.category, [...existingItems, item]);
    return acc;
  }, new Map());

  // Toggle expansion
  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Expand all
  const handleExpandAll = useCallback(() => {
    // Get fresh item IDs since we can't depend on the array
    const currentItems = category
      ? FAQ_ITEMS.filter((item) => item.category === category)
      : FAQ_ITEMS;
    const limitedItems = maxItems > 0 ? currentItems.slice(0, maxItems) : currentItems;
    setExpandedIds(new Set(limitedItems.map((item) => item.id)));
  }, [category, maxItems]);

  // Collapse all
  const handleCollapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const hasExpanded = expandedIds.size > 0;

  return (
    <div className="faq" data-testid="faq">
      {/* Controls */}
      <div className="faq__controls">
        <button
          type="button"
          className="faq__control-button"
          onClick={hasExpanded ? handleCollapseAll : handleExpandAll}
          data-testid="faq-toggle-all"
        >
          {hasExpanded ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      {/* Grouped FAQ items */}
      {category ? (
        // Single category - no grouping needed
        <div className="faq__list">
          {items.map((item) => (
            <FAQItemComponent
              key={item.id}
              item={item}
              isExpanded={expandedIds.has(item.id)}
              onToggle={() => handleToggle(item.id)}
            />
          ))}
        </div>
      ) : (
        // Multiple categories - group them
        Array.from(groupedItems.entries()).map(([cat, catItems]) => {
          const categoryInfo = HELP_CATEGORIES.find((c) => c.id === cat);
          return (
            <div key={cat} className="faq__category-group">
              <h3 className="faq__category-title">
                {categoryInfo?.title ?? cat}
              </h3>
              <div className="faq__list">
                {catItems.map((item) => (
                  <FAQItemComponent
                    key={item.id}
                    item={item}
                    isExpanded={expandedIds.has(item.id)}
                    onToggle={() => handleToggle(item.id)}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="faq__empty">
          <p>No questions available for this category.</p>
        </div>
      )}
    </div>
  );
}

export default FAQ;
