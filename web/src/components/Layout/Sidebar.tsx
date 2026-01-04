/**
 * Sidebar Component
 *
 * Navigation sidebar with links to all main views.
 * Collapsible on mobile, persistent on desktop.
 *
 * @module components/Layout/Sidebar
 */

import { type ReactElement } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import type { NavigationView } from './AppShell';
import './Sidebar.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[Sidebar] ${message}`, ...args);
  }
};

/**
 * Navigation item configuration
 */
interface NavigationItem {
  /** Unique identifier for the view */
  id: NavigationView;
  /** Display label */
  label: string;
  /** Icon component */
  icon: ReactElement;
  /** Description for accessibility */
  description: string;
}

/**
 * Icon for Poem Input view
 */
function PoemIcon(): ReactElement {
  return (
    <svg
      className="sidebar__icon"
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
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10,9 9,9 8,9" />
    </svg>
  );
}

/**
 * Icon for Analysis view
 */
function AnalysisIcon(): ReactElement {
  return (
    <svg
      className="sidebar__icon"
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
 * Icon for Lyrics Editor view
 */
function LyricsIcon(): ReactElement {
  return (
    <svg
      className="sidebar__icon"
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
 * Icon for Melody view
 */
function MelodyIcon(): ReactElement {
  return (
    <svg
      className="sidebar__icon"
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
 * Icon for Recording view
 */
function RecordingIcon(): ReactElement {
  return (
    <svg
      className="sidebar__icon"
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
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

/**
 * Navigation items configuration
 */
const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'poem-input',
    label: 'Poem Input',
    icon: <PoemIcon />,
    description: 'Enter or paste your poem',
  },
  {
    id: 'analysis',
    label: 'Analysis',
    icon: <AnalysisIcon />,
    description: 'View poem structure and metrics',
  },
  {
    id: 'lyrics-editor',
    label: 'Lyrics Editor',
    icon: <LyricsIcon />,
    description: 'Edit and refine lyrics for singing',
  },
  {
    id: 'melody',
    label: 'Melody',
    icon: <MelodyIcon />,
    description: 'Generate and play melody',
  },
  {
    id: 'recording',
    label: 'Recording',
    icon: <RecordingIcon />,
    description: 'Record your performance',
  },
];

/**
 * Props for the Sidebar component
 */
export interface SidebarProps {
  /** Current active view */
  activeView: NavigationView;
  /** Callback when navigation changes */
  onNavigate: (view: NavigationView) => void;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Sidebar component provides navigation between main application views.
 *
 * Features:
 * - Five navigation items for the main workflow
 * - Visual indication of active view
 * - Collapsible on mobile (controlled by useUIStore)
 * - Keyboard accessible with proper ARIA attributes
 *
 * @example
 * ```tsx
 * <Sidebar
 *   activeView="poem-input"
 *   onNavigate={setActiveView}
 * />
 * ```
 */
export function Sidebar({
  activeView,
  onNavigate,
  className = '',
}: SidebarProps): ReactElement {
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  log('Rendering Sidebar:', { activeView, sidebarCollapsed });

  const handleNavClick = (view: NavigationView): void => {
    log('Navigation clicked:', view);
    onNavigate(view);

    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768 && !sidebarCollapsed) {
      log('Closing sidebar after mobile navigation');
      toggleSidebar();
    }
  };

  const containerClass = [
    'sidebar',
    sidebarCollapsed ? 'sidebar--collapsed' : 'sidebar--open',
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <aside
      className={containerClass}
      data-testid="sidebar"
      role="navigation"
      aria-label="Main navigation"
    >
      <nav className="sidebar__nav">
        <ul className="sidebar__list" role="list">
          {NAVIGATION_ITEMS.map((item, index) => (
            <li key={item.id} className="sidebar__item">
              <button
                type="button"
                className={`sidebar__link ${activeView === item.id ? 'sidebar__link--active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                aria-current={activeView === item.id ? 'page' : undefined}
                aria-describedby={`nav-desc-${item.id}`}
                data-testid={`nav-${item.id}`}
              >
                <span className="sidebar__step-number" aria-hidden="true">
                  {index + 1}
                </span>
                {item.icon}
                <span className="sidebar__label">{item.label}</span>
              </button>
              <span id={`nav-desc-${item.id}`} className="visually-hidden">
                {item.description}
              </span>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar__footer">
        <p className="sidebar__workflow-hint">
          Follow the workflow from top to bottom to transform your poem into a song.
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;
