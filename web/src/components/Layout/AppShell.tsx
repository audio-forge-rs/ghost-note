/**
 * AppShell Component
 *
 * Main container component that provides the application's layout structure
 * with a header, collapsible sidebar, and main content area.
 *
 * @module components/Layout/AppShell
 */

import { type ReactNode, type ReactElement, useEffect } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import './AppShell.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[AppShell] ${message}`, ...args);
  }
};

/**
 * Navigation view identifiers
 */
export type NavigationView =
  | 'poem-input'
  | 'analysis'
  | 'lyrics-editor'
  | 'melody'
  | 'recording';

/**
 * Props for the AppShell component
 */
export interface AppShellProps {
  /** Current active view */
  activeView: NavigationView;
  /** Callback when navigation changes */
  onNavigate: (view: NavigationView) => void;
  /** Main content to render */
  children: ReactNode;
  /** Additional CSS class name */
  className?: string;
}

/**
 * AppShell provides the main application layout with responsive design.
 *
 * Features:
 * - Responsive header with theme toggle and help
 * - Collapsible sidebar navigation
 * - Mobile-first design with overlay sidebar on small screens
 * - Dark/light mode support via useUIStore
 *
 * @example
 * ```tsx
 * <AppShell
 *   activeView="poem-input"
 *   onNavigate={setActiveView}
 * >
 *   <PoemInputView />
 * </AppShell>
 * ```
 */
export function AppShell({
  activeView,
  onNavigate,
  children,
  className = '',
}: AppShellProps): ReactElement {
  const resolvedTheme = useUIStore((state) => state.resolvedTheme);
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  log('Rendering AppShell:', { activeView, resolvedTheme, sidebarCollapsed });

  // Apply theme class to document element on mount and theme change
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolvedTheme);
    log('Applied theme to document:', resolvedTheme);
  }, [resolvedTheme]);

  // Handle escape key to close sidebar on mobile
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && !sidebarCollapsed) {
        log('Escape pressed, collapsing sidebar');
        toggleSidebar();
      }
    };

    // Only add listener on mobile when sidebar is open
    if (!sidebarCollapsed && window.innerWidth < 768) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [sidebarCollapsed, toggleSidebar]);

  const containerClass = [
    'app-shell',
    `app-shell--${resolvedTheme}`,
    sidebarCollapsed ? 'app-shell--sidebar-collapsed' : 'app-shell--sidebar-open',
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  const handleOverlayClick = (): void => {
    if (!sidebarCollapsed) {
      log('Overlay clicked, collapsing sidebar');
      toggleSidebar();
    }
  };

  return (
    <div className={containerClass} data-testid="app-shell">
      <Header />

      <div className="app-shell__body">
        <Sidebar
          activeView={activeView}
          onNavigate={onNavigate}
        />

        {/* Mobile overlay when sidebar is open */}
        {!sidebarCollapsed && (
          <div
            className="app-shell__overlay"
            onClick={handleOverlayClick}
            onKeyDown={(e) => e.key === 'Enter' && handleOverlayClick()}
            role="button"
            tabIndex={0}
            aria-label="Close sidebar"
            data-testid="sidebar-overlay"
          />
        )}

        <MainContent>
          {children}
        </MainContent>
      </div>
    </div>
  );
}

export default AppShell;
