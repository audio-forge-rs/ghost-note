/**
 * BottomNavigation Component
 *
 * Mobile-only bottom navigation bar for quick access to key actions.
 * Provides thumb-friendly navigation at the bottom of the screen.
 *
 * @module components/Layout/BottomNavigation
 */

import { type ReactElement } from 'react';
import type { NavigationView } from './AppShell';
import './BottomNavigation.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[BottomNavigation] ${message}`, ...args);
  }
};

/**
 * Navigation item configuration for bottom nav
 */
interface BottomNavItem {
  /** Unique identifier for the view */
  id: NavigationView;
  /** Display label */
  label: string;
  /** Icon component */
  icon: ReactElement;
}

/**
 * Compact icon for Poem Input view
 */
function PoemIcon(): ReactElement {
  return (
    <svg
      className="bottom-nav__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
    </svg>
  );
}

/**
 * Compact icon for Analysis view
 */
function AnalysisIcon(): ReactElement {
  return (
    <svg
      className="bottom-nav__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

/**
 * Compact icon for Lyrics Editor view
 */
function LyricsIcon(): ReactElement {
  return (
    <svg
      className="bottom-nav__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

/**
 * Compact icon for Melody view
 */
function MelodyIcon(): ReactElement {
  return (
    <svg
      className="bottom-nav__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

/**
 * Compact icon for Recording view
 */
function RecordingIcon(): ReactElement {
  return (
    <svg
      className="bottom-nav__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
    </svg>
  );
}

/**
 * Navigation items for bottom navigation - primary workflow first
 */
const PRIMARY_NAV_ITEMS: BottomNavItem[] = [
  {
    id: 'poem-input',
    label: 'Poem',
    icon: <PoemIcon />,
  },
  {
    id: 'lyrics-editor',
    label: 'Lyrics',
    icon: <LyricsIcon />,
  },
  {
    id: 'melody',
    label: 'Melody',
    icon: <MelodyIcon />,
  },
];

/**
 * Secondary navigation items - analysis and recording
 */
const SECONDARY_NAV_ITEMS: BottomNavItem[] = [
  {
    id: 'analysis',
    label: 'Analysis',
    icon: <AnalysisIcon />,
  },
  {
    id: 'recording',
    label: 'Record',
    icon: <RecordingIcon />,
  },
];

/**
 * Props for the BottomNavigation component
 */
export interface BottomNavigationProps {
  /** Current active view */
  activeView: NavigationView;
  /** Callback when navigation changes */
  onNavigate: (view: NavigationView) => void;
  /** Additional CSS class name */
  className?: string;
}

/**
 * BottomNavigation provides mobile-friendly navigation at the bottom of the screen.
 *
 * Features:
 * - Fixed position at bottom of viewport
 * - Touch-friendly 44px minimum touch targets
 * - Visual indication of active view
 * - Hidden on desktop (sidebar takes over)
 * - Keyboard accessible with proper ARIA attributes
 *
 * @example
 * ```tsx
 * <BottomNavigation
 *   activeView="poem-input"
 *   onNavigate={setActiveView}
 * />
 * ```
 */
export function BottomNavigation({
  activeView,
  onNavigate,
  className = '',
}: BottomNavigationProps): ReactElement {
  log('Rendering BottomNavigation:', { activeView });

  const handleNavClick = (view: NavigationView): void => {
    log('Navigation clicked:', view);
    onNavigate(view);
  };

  const containerClass = ['bottom-nav', className].filter(Boolean).join(' ').trim();

  const renderNavItem = (item: BottomNavItem): ReactElement => (
    <li key={item.id} className="bottom-nav__item">
      <button
        type="button"
        className={`bottom-nav__button ${activeView === item.id ? 'bottom-nav__button--active' : ''}`}
        onClick={() => handleNavClick(item.id)}
        aria-current={activeView === item.id ? 'page' : undefined}
        aria-label={item.label}
        data-testid={`bottom-nav-${item.id}`}
      >
        {item.icon}
        <span className="bottom-nav__label">{item.label}</span>
      </button>
    </li>
  );

  return (
    <nav
      className={containerClass}
      data-testid="bottom-navigation"
      role="navigation"
      aria-label="Quick navigation"
    >
      <ul className="bottom-nav__list" role="list">
        {PRIMARY_NAV_ITEMS.map(renderNavItem)}
        <li className="bottom-nav__divider" role="separator" aria-hidden="true" />
        {SECONDARY_NAV_ITEMS.map(renderNavItem)}
      </ul>
    </nav>
  );
}

export default BottomNavigation;
