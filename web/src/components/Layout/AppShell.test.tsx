/**
 * Tests for AppShell Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { AppShell, type NavigationView } from './AppShell';
import { useUIStore } from '@/stores/useUIStore';

// Mock the stores
vi.mock('@/stores/useUIStore', () => ({
  useUIStore: vi.fn(),
}));

// Mock child components
vi.mock('./Header', () => ({
  Header: () => <header data-testid="header-mock">Header</header>,
}));

vi.mock('./Sidebar', () => ({
  Sidebar: ({ activeView, onNavigate }: { activeView: string; onNavigate: (view: NavigationView) => void }) => (
    <aside data-testid="sidebar-mock" data-active-view={activeView}>
      <button onClick={() => onNavigate('analysis')}>Navigate</button>
    </aside>
  ),
}));

vi.mock('./MainContent', () => ({
  MainContent: ({ children }: { children: React.ReactNode }) => (
    <main data-testid="main-content-mock">{children}</main>
  ),
}));

describe('AppShell', () => {
  const mockToggleSidebar = vi.fn();
  const mockOnNavigate = vi.fn();

  const defaultUIState = {
    resolvedTheme: 'dark' as const,
    sidebarCollapsed: true,
    toggleSidebar: mockToggleSidebar,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useUIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: typeof defaultUIState) => unknown) => {
      return selector(defaultUIState);
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders the app shell container', () => {
      render(
        <AppShell activeView="poem-input" onNavigate={mockOnNavigate}>
          <div>Content</div>
        </AppShell>
      );

      expect(screen.getByTestId('app-shell')).toBeInTheDocument();
    });

    it('renders Header component', () => {
      render(
        <AppShell activeView="poem-input" onNavigate={mockOnNavigate}>
          <div>Content</div>
        </AppShell>
      );

      expect(screen.getByTestId('header-mock')).toBeInTheDocument();
    });

    it('renders Sidebar component', () => {
      render(
        <AppShell activeView="poem-input" onNavigate={mockOnNavigate}>
          <div>Content</div>
        </AppShell>
      );

      expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument();
    });

    it('renders MainContent component with children', () => {
      render(
        <AppShell activeView="poem-input" onNavigate={mockOnNavigate}>
          <div data-testid="child-content">Content</div>
        </AppShell>
      );

      expect(screen.getByTestId('main-content-mock')).toBeInTheDocument();
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('passes activeView to Sidebar', () => {
      render(
        <AppShell activeView="analysis" onNavigate={mockOnNavigate}>
          <div>Content</div>
        </AppShell>
      );

      expect(screen.getByTestId('sidebar-mock')).toHaveAttribute('data-active-view', 'analysis');
    });
  });

  describe('theme classes', () => {
    it('applies dark theme class when resolvedTheme is dark', () => {
      render(
        <AppShell activeView="poem-input" onNavigate={mockOnNavigate}>
          <div>Content</div>
        </AppShell>
      );

      expect(screen.getByTestId('app-shell')).toHaveClass('app-shell--dark');
    });

    it('applies light theme class when resolvedTheme is light', () => {
      (useUIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: typeof defaultUIState) => unknown) => {
        return selector({ ...defaultUIState, resolvedTheme: 'light' as const });
      });

      render(
        <AppShell activeView="poem-input" onNavigate={mockOnNavigate}>
          <div>Content</div>
        </AppShell>
      );

      expect(screen.getByTestId('app-shell')).toHaveClass('app-shell--light');
    });
  });

  describe('sidebar state', () => {
    it('applies sidebar-collapsed class when sidebar is collapsed', () => {
      render(
        <AppShell activeView="poem-input" onNavigate={mockOnNavigate}>
          <div>Content</div>
        </AppShell>
      );

      expect(screen.getByTestId('app-shell')).toHaveClass('app-shell--sidebar-collapsed');
    });

    it('applies sidebar-open class when sidebar is open', () => {
      (useUIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: typeof defaultUIState) => unknown) => {
        return selector({ ...defaultUIState, sidebarCollapsed: false });
      });

      render(
        <AppShell activeView="poem-input" onNavigate={mockOnNavigate}>
          <div>Content</div>
        </AppShell>
      );

      expect(screen.getByTestId('app-shell')).toHaveClass('app-shell--sidebar-open');
    });

    it('renders overlay when sidebar is open', () => {
      (useUIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: typeof defaultUIState) => unknown) => {
        return selector({ ...defaultUIState, sidebarCollapsed: false });
      });

      render(
        <AppShell activeView="poem-input" onNavigate={mockOnNavigate}>
          <div>Content</div>
        </AppShell>
      );

      expect(screen.getByTestId('sidebar-overlay')).toBeInTheDocument();
    });

    it('does not render overlay when sidebar is collapsed', () => {
      render(
        <AppShell activeView="poem-input" onNavigate={mockOnNavigate}>
          <div>Content</div>
        </AppShell>
      );

      expect(screen.queryByTestId('sidebar-overlay')).not.toBeInTheDocument();
    });
  });

  describe('overlay interaction', () => {
    it('calls toggleSidebar when overlay is clicked', () => {
      (useUIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: typeof defaultUIState) => unknown) => {
        return selector({ ...defaultUIState, sidebarCollapsed: false });
      });

      render(
        <AppShell activeView="poem-input" onNavigate={mockOnNavigate}>
          <div>Content</div>
        </AppShell>
      );

      fireEvent.click(screen.getByTestId('sidebar-overlay'));
      expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
    });

    it('overlay has correct accessibility attributes', () => {
      (useUIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: typeof defaultUIState) => unknown) => {
        return selector({ ...defaultUIState, sidebarCollapsed: false });
      });

      render(
        <AppShell activeView="poem-input" onNavigate={mockOnNavigate}>
          <div>Content</div>
        </AppShell>
      );

      const overlay = screen.getByTestId('sidebar-overlay');
      expect(overlay).toHaveAttribute('role', 'button');
      expect(overlay).toHaveAttribute('aria-label', 'Close sidebar');
      expect(overlay).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      render(
        <AppShell activeView="poem-input" onNavigate={mockOnNavigate} className="custom-class">
          <div>Content</div>
        </AppShell>
      );

      expect(screen.getByTestId('app-shell')).toHaveClass('custom-class');
    });
  });
});
