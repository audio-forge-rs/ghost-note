/**
 * SkipLinks Component
 *
 * Provides keyboard-accessible skip links for bypassing navigation
 * and jumping directly to main content areas. These links become
 * visible only when focused, allowing keyboard users to quickly
 * navigate the page.
 *
 * @module components/Common/SkipLinks
 */

import { type ReactElement } from 'react';
import './SkipLinks.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[SkipLinks] ${message}`, ...args);
  }
};

/**
 * Configuration for a single skip link
 */
export interface SkipLinkConfig {
  /** Target element ID to skip to */
  targetId: string;
  /** Display label for the link */
  label: string;
}

/**
 * Default skip link configurations
 */
const DEFAULT_SKIP_LINKS: SkipLinkConfig[] = [
  { targetId: 'main-content', label: 'Skip to main content' },
  { targetId: 'navigation', label: 'Skip to navigation' },
];

/**
 * Props for the SkipLinks component
 */
export interface SkipLinksProps {
  /** Custom skip link configurations (overrides defaults) */
  links?: SkipLinkConfig[];
  /** Additional CSS class name */
  className?: string;
}

/**
 * SkipLinks provides accessible skip navigation links.
 *
 * Features:
 * - Visually hidden until focused
 * - Multiple skip targets supported
 * - Smooth focus transition to target
 * - High contrast when visible
 * - Keyboard navigable
 *
 * Place this component at the very beginning of your app,
 * before any other focusable elements.
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <>
 *       <SkipLinks />
 *       <Header />
 *       <Sidebar id="navigation" />
 *       <main id="main-content">
 *         <Content />
 *       </main>
 *     </>
 *   );
 * }
 * ```
 */
export function SkipLinks({
  links = DEFAULT_SKIP_LINKS,
  className = '',
}: SkipLinksProps): ReactElement {
  log('Rendering SkipLinks with links:', links.length);

  const handleClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    targetId: string
  ): void => {
    event.preventDefault();
    log('Skip link clicked:', targetId);

    const target = document.getElementById(targetId);
    if (target) {
      // Make the target focusable if it isn't already
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }

      // Focus the target element
      target.focus({ preventScroll: false });

      // Scroll to the target (check if scrollIntoView exists for jsdom compatibility)
      if (typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      log('Focused target element:', targetId);
    } else {
      log('Target element not found:', targetId);
    }
  };

  const containerClass = ['skip-links', className].filter(Boolean).join(' ').trim();

  return (
    <nav className={containerClass} aria-label="Skip links" data-testid="skip-links">
      <ul className="skip-links__list">
        {links.map(({ targetId, label }) => (
          <li key={targetId} className="skip-links__item">
            <a
              href={`#${targetId}`}
              className="skip-links__link"
              onClick={(e) => handleClick(e, targetId)}
              data-testid={`skip-link-${targetId}`}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default SkipLinks;
