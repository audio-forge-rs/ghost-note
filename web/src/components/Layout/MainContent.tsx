/**
 * MainContent Component
 *
 * Content area wrapper that provides proper layout and scrolling
 * for the main application content.
 *
 * @module components/Layout/MainContent
 */

import { type ReactNode, type ReactElement } from 'react';
import './MainContent.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[MainContent] ${message}`, ...args);
  }
};

/**
 * Props for the MainContent component
 */
export interface MainContentProps {
  /** Content to render in the main area */
  children: ReactNode;
  /** Additional CSS class name */
  className?: string;
  /** Data test ID for testing */
  testId?: string;
}

/**
 * MainContent provides a wrapper for the main application content area.
 *
 * Features:
 * - Flexible layout that fills available space
 * - Proper scrolling behavior
 * - Consistent padding and spacing
 * - Responsive adjustments for different screen sizes
 *
 * @example
 * ```tsx
 * <MainContent>
 *   <PoemInputView />
 * </MainContent>
 * ```
 */
export function MainContent({
  children,
  className = '',
  testId = 'main-content',
}: MainContentProps): ReactElement {
  log('Rendering MainContent');

  const containerClass = ['main-content', className]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <main
      id="main-content"
      className={containerClass}
      data-testid={testId}
      role="main"
      aria-label="Main content"
      tabIndex={-1}
    >
      <div className="main-content__inner">
        {children}
      </div>
    </main>
  );
}

export default MainContent;
