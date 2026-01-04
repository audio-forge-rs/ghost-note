/**
 * Tests for Header Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { Header } from './Header';
import { useUIStore } from '@/stores/useUIStore';
import type { Theme } from '@/stores/types';

// Mock the stores
vi.mock('@/stores/useUIStore', () => ({
  useUIStore: vi.fn(),
}));

// Mock the utils
vi.mock('@/utils', () => ({
  APP_NAME: 'Ghost Note',
}));

interface MockUIState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  setTheme: ReturnType<typeof vi.fn>;
  toggleSidebar: ReturnType<typeof vi.fn>;
  openModalDialog: ReturnType<typeof vi.fn>;
}

describe('Header', () => {
  const mockSetTheme = vi.fn();
  const mockToggleSidebar = vi.fn();
  const mockOpenModalDialog = vi.fn();

  const defaultUIState: MockUIState = {
    theme: 'dark',
    resolvedTheme: 'dark',
    sidebarCollapsed: true,
    setTheme: mockSetTheme,
    toggleSidebar: mockToggleSidebar,
    openModalDialog: mockOpenModalDialog,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useUIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: MockUIState) => unknown) => {
      return selector(defaultUIState);
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
    it('cycles from dark to system theme', () => {
      render(<Header />);

      fireEvent.click(screen.getByTestId('theme-toggle'));
      expect(mockSetTheme).toHaveBeenCalledWith('system');
    });

    it('cycles from light to dark theme', () => {
      (useUIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: typeof defaultUIState) => unknown) => {
        return selector({ ...defaultUIState, theme: 'light' as const, resolvedTheme: 'light' as const });
      });

      render(<Header />);

      fireEvent.click(screen.getByTestId('theme-toggle'));
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('cycles from system to light theme', () => {
      (useUIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: typeof defaultUIState) => unknown) => {
        return selector({ ...defaultUIState, theme: 'system' as const });
      });

      render(<Header />);

      fireEvent.click(screen.getByTestId('theme-toggle'));
      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('shows dark mode label when in dark mode', () => {
      render(<Header />);

      const themeButton = screen.getByTestId('theme-toggle');
      expect(themeButton).toHaveAttribute('aria-label', 'Dark mode');
    });

    it('shows light mode label when in light mode', () => {
      (useUIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: typeof defaultUIState) => unknown) => {
        return selector({ ...defaultUIState, theme: 'light' as const, resolvedTheme: 'light' as const });
      });

      render(<Header />);

      const themeButton = screen.getByTestId('theme-toggle');
      expect(themeButton).toHaveAttribute('aria-label', 'Light mode');
    });

    it('shows system theme label when in system mode', () => {
      (useUIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: typeof defaultUIState) => unknown) => {
        return selector({ ...defaultUIState, theme: 'system' as const });
      });

      render(<Header />);

      const themeButton = screen.getByTestId('theme-toggle');
      expect(themeButton).toHaveAttribute('aria-label', 'System theme');
    });

    it('shows auto indicator when in system mode', () => {
      (useUIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: typeof defaultUIState) => unknown) => {
        return selector({ ...defaultUIState, theme: 'system' as const });
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
