/**
 * Tests for Header Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { Header } from './Header';
import { useUIStore } from '@/stores/useUIStore';
import { useThemeStore, selectThemeLabel } from '@/stores/useThemeStore';
import type { Theme } from '@/stores/types';

// Mock the stores
vi.mock('@/stores/useUIStore', () => ({
  useUIStore: vi.fn(),
}));

vi.mock('@/stores/useThemeStore', () => ({
  useThemeStore: vi.fn(),
  selectThemeLabel: vi.fn(),
}));

// Mock the utils
vi.mock('@/utils', () => ({
  APP_NAME: 'Ghost Note',
}));

interface MockUIState {
  sidebarCollapsed: boolean;
  toggleSidebar: ReturnType<typeof vi.fn>;
  openModalDialog: ReturnType<typeof vi.fn>;
}

interface MockThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  cycleTheme: ReturnType<typeof vi.fn>;
}

describe('Header', () => {
  const mockCycleTheme = vi.fn();
  const mockToggleSidebar = vi.fn();
  const mockOpenModalDialog = vi.fn();

  const defaultUIState: MockUIState = {
    sidebarCollapsed: true,
    toggleSidebar: mockToggleSidebar,
    openModalDialog: mockOpenModalDialog,
  };

  const defaultThemeState: MockThemeState = {
    theme: 'dark',
    resolvedTheme: 'dark',
    cycleTheme: mockCycleTheme,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useUIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: MockUIState) => unknown) => {
      return selector(defaultUIState);
    });
    (useThemeStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: unknown) => {
      // Handle selectThemeLabel selector
      if (selector === selectThemeLabel) {
        return 'Dark';
      }
      // Handle direct state selectors
      return (selector as (state: MockThemeState) => unknown)(defaultThemeState);
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders the header element', () => {
      render(<Header />);

      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('renders the app title', () => {
      render(<Header />);

      expect(screen.getByTestId('app-title')).toHaveTextContent('Ghost Note');
    });

    it('renders the menu button', () => {
      render(<Header />);

      expect(screen.getByTestId('menu-button')).toBeInTheDocument();
    });

    it('renders the theme toggle button', () => {
      render(<Header />);

      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('renders the help button', () => {
      render(<Header />);

      expect(screen.getByTestId('help-button')).toBeInTheDocument();
    });
  });

  describe('menu button', () => {
    it('shows open menu label when sidebar is collapsed', () => {
      render(<Header />);

      const menuButton = screen.getByTestId('menu-button');
      expect(menuButton).toHaveAttribute('aria-label', 'Open menu');
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('shows close menu label when sidebar is open', () => {
      (useUIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: typeof defaultUIState) => unknown) => {
        return selector({ ...defaultUIState, sidebarCollapsed: false });
      });

      render(<Header />);

      const menuButton = screen.getByTestId('menu-button');
      expect(menuButton).toHaveAttribute('aria-label', 'Close menu');
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('calls toggleSidebar when clicked', () => {
      render(<Header />);

      fireEvent.click(screen.getByTestId('menu-button'));
      expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
    });
  });

  describe('theme toggle', () => {
    it('calls cycleTheme when clicked', () => {
      render(<Header />);

      fireEvent.click(screen.getByTestId('theme-toggle'));
      expect(mockCycleTheme).toHaveBeenCalledTimes(1);
    });

    it('shows correct label from themeLabel selector', () => {
      render(<Header />);

      const themeButton = screen.getByTestId('theme-toggle');
      expect(themeButton).toHaveAttribute('aria-label', 'Dark');
    });

    it('shows light label when in light mode', () => {
      (useThemeStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: unknown) => {
        if (selector === selectThemeLabel) {
          return 'Light';
        }
        return (selector as (state: MockThemeState) => unknown)({
          ...defaultThemeState,
          theme: 'light' as const,
          resolvedTheme: 'light' as const
        });
      });

      render(<Header />);

      const themeButton = screen.getByTestId('theme-toggle');
      expect(themeButton).toHaveAttribute('aria-label', 'Light');
    });

    it('shows system label when in system mode', () => {
      (useThemeStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: unknown) => {
        if (selector === selectThemeLabel) {
          return 'System (Dark)';
        }
        return (selector as (state: MockThemeState) => unknown)({
          ...defaultThemeState,
          theme: 'system' as const
        });
      });

      render(<Header />);

      const themeButton = screen.getByTestId('theme-toggle');
      expect(themeButton).toHaveAttribute('aria-label', 'System (Dark)');
    });

    it('shows auto indicator when in system mode', () => {
      (useThemeStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: unknown) => {
        if (selector === selectThemeLabel) {
          return 'System (Dark)';
        }
        return (selector as (state: MockThemeState) => unknown)({
          ...defaultThemeState,
          theme: 'system' as const
        });
      });

      render(<Header />);

      // Look for the "A" indicator element
      const indicator = screen.getByText('A');
      expect(indicator).toHaveClass('header__theme-indicator');
    });

    it('does not show auto indicator when not in system mode', () => {
      render(<Header />);

      expect(screen.queryByText('A')).not.toBeInTheDocument();
    });
  });

  describe('help button', () => {
    it('has correct aria-label', () => {
      render(<Header />);

      const helpButton = screen.getByTestId('help-button');
      expect(helpButton).toHaveAttribute('aria-label', 'Help');
    });

    it('opens help modal when clicked', () => {
      render(<Header />);

      fireEvent.click(screen.getByTestId('help-button'));
      expect(mockOpenModalDialog).toHaveBeenCalledWith('help');
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      render(<Header className="custom-header" />);

      expect(screen.getByTestId('header')).toHaveClass('custom-header');
    });

    it('includes base header class', () => {
      render(<Header />);

      expect(screen.getByTestId('header')).toHaveClass('header');
    });
  });

  describe('accessibility', () => {
    it('header has proper semantic tag', () => {
      render(<Header />);

      const header = screen.getByTestId('header');
      expect(header.tagName).toBe('HEADER');
    });

    it('title is an h1 element', () => {
      render(<Header />);

      const title = screen.getByTestId('app-title');
      expect(title.tagName).toBe('H1');
    });

    it('all buttons have type="button"', () => {
      render(<Header />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });
});
