/**
 * AppShell Component
 *
 * Main container component that provides the application's layout structure
 * with a header, collapsible sidebar, and main content area.
 * Includes mobile-responsive navigation with bottom nav and swipe gestures.
 *
 * @module components/Layout/AppShell
 */

import { type ReactNode, type ReactElement, useEffect, useRef, useCallback, useMemo } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import { BottomNavigation } from './BottomNavigation';
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
 * Ordered list of navigation views for swipe gesture navigation
 */
const NAVIGATION_ORDER: NavigationView[] = [
  'poem-input',
  'analysis',
  'lyrics-editor',
  'melody',
  'recording',
];

/**
 * AppShell provides the main application layout with responsive design.
 *
 * Features:
 * - Responsive header with theme toggle and help
 * - Collapsible sidebar navigation
 * - Mobile-first design with overlay sidebar on small screens
 * - Bottom navigation bar for mobile
 * - Swipe gestures for view switching on touch devices
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

  // Ref for swipe gesture detection on main content
  const contentRef = useRef<HTMLDivElement>(null);

  log('Rendering AppShell:', { activeView, resolvedTheme, sidebarCollapsed });

  // Get the next/previous view for swipe navigation
  const getNextView = useCallback((): NavigationView | null => {
    const currentIndex = NAVIGATION_ORDER.indexOf(activeView);
    if (currentIndex < NAVIGATION_ORDER.length - 1) {
      return NAVIGATION_ORDER[currentIndex + 1];
    }
    return null;
  }, [activeView]);

  const getPreviousView = useCallback((): NavigationView | null => {
    const currentIndex = NAVIGATION_ORDER.indexOf(activeView);
    if (currentIndex > 0) {
      return NAVIGATION_ORDER[currentIndex - 1];
    }
    return null;
  }, [activeView]);

  // Swipe gesture callbacks
  const swipeCallbacks = useMemo(() => ({
    onSwipeLeft: () => {
      const nextView = getNextView();
      if (nextView) {
        log('Swipe left detected, navigating to:', nextView);
        onNavigate(nextView);
      }
    },
    onSwipeRight: () => {
      const prevView = getPreviousView();
      if (prevView) {
        log('Swipe right detected, navigating to:', prevView);
        onNavigate(prevView);
      }
    },
  }), [getNextView, getPreviousView, onNavigate]);

  // Enable swipe gestures only on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useSwipeGesture(contentRef, swipeCallbacks, {
    threshold: 75,
    maxTime: 400,
    minVelocity: 0.25,
    enabled: isMobile && sidebarCollapsed, // Disable when sidebar is open
  });

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

      <div className="app-shell__body" ref={contentRef}>
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

      {/* Mobile bottom navigation bar */}
      <BottomNavigation
        activeView={activeView}
        onNavigate={onNavigate}
      />
    </div>
  );
}

export default AppShell;
