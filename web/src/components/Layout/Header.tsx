/**
 * Header Component
 *
 * Application header with app title, theme toggle, and help button.
 * Includes hamburger menu button for mobile sidebar toggle.
 *
 * @module components/Layout/Header
 */

import { type ReactElement } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { APP_NAME } from '@/utils';
import './Header.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[Header] ${message}`, ...args);
  }
};

/**
 * Props for the Header component
 */
export interface HeaderProps {
  /** Additional CSS class name */
  className?: string;
}

/**
 * Sun icon for light mode indicator
 */
function SunIcon(): ReactElement {
  return (
    <svg
      className="header__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

/**
 * Moon icon for dark mode indicator
 */
function MoonIcon(): ReactElement {
  return (
    <svg
      className="header__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/**
 * Menu/Hamburger icon for mobile sidebar toggle
 */
function MenuIcon(): ReactElement {
  return (
    <svg
      className="header__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

/**
 * Close/X icon for when sidebar is open
 */
function CloseIcon(): ReactElement {
  return (
    <svg
      className="header__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/**
 * Help/Question icon
 */
function HelpIcon(): ReactElement {
  return (
    <svg
      className="header__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/**
 * Header component displays the application title and provides
 * access to theme toggle and help functionality.
 *
 * Features:
 * - Hamburger menu button on mobile to toggle sidebar
 * - App title/logo
 * - Theme toggle button (light/dark/system)
 * - Help button
 *
 * @example
 * ```tsx
 * <Header />
 * ```
 */
export function Header({ className = '' }: HeaderProps): ReactElement {
  const theme = useUIStore((state) => state.theme);
  const resolvedTheme = useUIStore((state) => state.resolvedTheme);
  const setTheme = useUIStore((state) => state.setTheme);
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const openModalDialog = useUIStore((state) => state.openModalDialog);

  log('Rendering Header:', { theme, resolvedTheme, sidebarCollapsed });

  const handleThemeToggle = (): void => {
    // Cycle through themes: light -> dark -> system -> light
    const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    log('Toggling theme:', { from: theme, to: nextTheme });
    setTheme(nextTheme);
  };

  const handleHelpClick = (): void => {
    log('Opening help modal');
    openModalDialog('help');
  };

  const handleMenuClick = (): void => {
    log('Toggling sidebar');
    toggleSidebar();
  };

  const containerClass = ['header', className].filter(Boolean).join(' ').trim();

  // Determine theme button label
  const getThemeLabel = (): string => {
    if (theme === 'system') return 'System theme';
    return resolvedTheme === 'dark' ? 'Dark mode' : 'Light mode';
  };

  return (
    <header className={containerClass} data-testid="header">
      <div className="header__left">
        {/* Mobile menu button */}
        <button
          type="button"
          className="header__menu-button"
          onClick={handleMenuClick}
          aria-label={sidebarCollapsed ? 'Open menu' : 'Close menu'}
          aria-expanded={!sidebarCollapsed}
          data-testid="menu-button"
        >
          {sidebarCollapsed ? <MenuIcon /> : <CloseIcon />}
        </button>

        {/* App title/logo */}
        <h1 className="header__title" data-testid="app-title">
          {APP_NAME}
        </h1>
      </div>

      <div className="header__right">
        {/* Theme toggle button */}
        <button
          type="button"
          className="header__button header__theme-button"
          onClick={handleThemeToggle}
          aria-label={getThemeLabel()}
          title={getThemeLabel()}
          data-testid="theme-toggle"
        >
          {resolvedTheme === 'dark' ? <MoonIcon /> : <SunIcon />}
          {theme === 'system' && (
            <span className="header__theme-indicator" aria-hidden="true">
              A
            </span>
          )}
        </button>

        {/* Help button */}
        <button
          type="button"
          className="header__button header__help-button"
          onClick={handleHelpClick}
          aria-label="Help"
          title="Help"
          data-testid="help-button"
        >
          <HelpIcon />
        </button>
      </div>
    </header>
  );
}

export default Header;
