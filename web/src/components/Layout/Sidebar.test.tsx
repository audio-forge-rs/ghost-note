/**
 * Tests for Sidebar Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import type { NavigationView } from './AppShell';
import { useUIStore } from '@/stores/useUIStore';

// Mock the stores
vi.mock('@/stores/useUIStore', () => ({
  useUIStore: vi.fn(),
}));

describe('Sidebar', () => {
  const mockToggleSidebar = vi.fn();
  const mockOnNavigate = vi.fn();

  const defaultUIState = {
    sidebarCollapsed: true,
    toggleSidebar: mockToggleSidebar,
  };

  // Mock window.innerWidth
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    vi.clearAllMocks();
    (useUIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: typeof defaultUIState) => unknown) => {
      return selector(defaultUIState);
    });
    // Default to desktop width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    cleanup();
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  describe('rendering', () => {
    it('renders the sidebar element', () => {
      render(<Sidebar activeView="poem-input" onNavigate={mockOnNavigate} />);

      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('renders all five navigation items', () => {
      render(<Sidebar activeView="poem-input" onNavigate={mockOnNavigate} />);

      expect(screen.getByTestId('nav-poem-input')).toBeInTheDocument();
      expect(screen.getByTestId('nav-analysis')).toBeInTheDocument();
      expect(screen.getByTestId('nav-lyrics-editor')).toBeInTheDocument();
      expect(screen.getByTestId('nav-melody')).toBeInTheDocument();
      expect(screen.getByTestId('nav-recording')).toBeInTheDocument();
    });

    it('renders navigation labels', () => {
      render(<Sidebar activeView="poem-input" onNavigate={mockOnNavigate} />);

      expect(screen.getByText('Poem Input')).toBeInTheDocument();
      expect(screen.getByText('Analysis')).toBeInTheDocument();
      expect(screen.getByText('Lyrics Editor')).toBeInTheDocument();
      expect(screen.getByText('Melody')).toBeInTheDocument();
      expect(screen.getByText('Recording')).toBeInTheDocument();
    });

    it('renders step numbers for primary workflow items', () => {
      render(<Sidebar activeView="poem-input" onNavigate={mockOnNavigate} />);

      // Primary workflow items have step numbers 1-3
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      // Secondary items (Analysis, Recording) don't have step numbers
    });

    it('renders workflow hint in footer', () => {
      render(<Sidebar activeView="poem-input" onNavigate={mockOnNavigate} />);

      expect(screen.getByText(/Follow the workflow/)).toBeInTheDocument();
    });
  });

  describe('active state', () => {
    it('marks poem-input as active when it is the activeView', () => {
      render(<Sidebar activeView="poem-input" onNavigate={mockOnNavigate} />);

      const navItem = screen.getByTestId('nav-poem-input');
      expect(navItem).toHaveClass('sidebar__link--active');
      expect(navItem).toHaveAttribute('aria-current', 'page');
    });

    it('marks analysis as active when it is the activeView', () => {
      render(<Sidebar activeView="analysis" onNavigate={mockOnNavigate} />);

      const navItem = screen.getByTestId('nav-analysis');
      expect(navItem).toHaveClass('sidebar__link--active');
      expect(navItem).toHaveAttribute('aria-current', 'page');
    });

    it('marks lyrics-editor as active when it is the activeView', () => {
      render(<Sidebar activeView="lyrics-editor" onNavigate={mockOnNavigate} />);

      const navItem = screen.getByTestId('nav-lyrics-editor');
      expect(navItem).toHaveClass('sidebar__link--active');
    });

    it('marks melody as active when it is the activeView', () => {
      render(<Sidebar activeView="melody" onNavigate={mockOnNavigate} />);

      const navItem = screen.getByTestId('nav-melody');
      expect(navItem).toHaveClass('sidebar__link--active');
    });

    it('marks recording as active when it is the activeView', () => {
      render(<Sidebar activeView="recording" onNavigate={mockOnNavigate} />);

      const navItem = screen.getByTestId('nav-recording');
      expect(navItem).toHaveClass('sidebar__link--active');
    });

    it('does not mark inactive items with active class', () => {
      render(<Sidebar activeView="poem-input" onNavigate={mockOnNavigate} />);

      const navItems = [
        screen.getByTestId('nav-analysis'),
        screen.getByTestId('nav-lyrics-editor'),
        screen.getByTestId('nav-melody'),
        screen.getByTestId('nav-recording'),
      ];

      navItems.forEach((item) => {
        expect(item).not.toHaveClass('sidebar__link--active');
        expect(item).not.toHaveAttribute('aria-current');
      });
    });
  });

  describe('navigation', () => {
    it('calls onNavigate with correct view when item is clicked', () => {
      render(<Sidebar activeView="poem-input" onNavigate={mockOnNavigate} />);

      fireEvent.click(screen.getByTestId('nav-analysis'));
      expect(mockOnNavigate).toHaveBeenCalledWith('analysis');
    });

    it.each<NavigationView>([
      'poem-input',
      'analysis',
      'lyrics-editor',
      'melody',
      'recording',
    ])('calls onNavigate with %s when clicked', (view) => {
      render(<Sidebar activeView="poem-input" onNavigate={mockOnNavigate} />);

      fireEvent.click(screen.getByTestId(`nav-${view}`));
      expect(mockOnNavigate).toHaveBeenCalledWith(view);
    });

    it('does not close sidebar on desktop after navigation', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024 });

      render(<Sidebar activeView="poem-input" onNavigate={mockOnNavigate} />);

      fireEvent.click(screen.getByTestId('nav-analysis'));
      expect(mockToggleSidebar).not.toHaveBeenCalled();
    });

    it('closes sidebar on mobile after navigation when sidebar is open', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500 });
      (useUIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: typeof defaultUIState) => unknown) => {
        return selector({ ...defaultUIState, sidebarCollapsed: false });
      });

      render(<Sidebar activeView="poem-input" onNavigate={mockOnNavigate} />);

      fireEvent.click(screen.getByTestId('nav-analysis'));
      expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
    });

    it('does not close sidebar on mobile if already collapsed', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500 });

      render(<Sidebar activeView="poem-input" onNavigate={mockOnNavigate} />);

      fireEvent.click(screen.getByTestId('nav-analysis'));
      expect(mockToggleSidebar).not.toHaveBeenCalled();
    });
  });

  describe('collapse state', () => {
    it('applies collapsed class when sidebar is collapsed', () => {
      render(<Sidebar activeView="poem-input" onNavigate={mockOnNavigate} />);

      expect(screen.getByTestId('sidebar')).toHaveClass('sidebar--collapsed');
    });

    it('applies open class when sidebar is open', () => {
      (useUIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: typeof defaultUIState) => unknown) => {
        return selector({ ...defaultUIState, sidebarCollapsed: false });
      });

      render(<Sidebar activeView="poem-input" onNavigate={mockOnNavigate} />);

      expect(screen.getByTestId('sidebar')).toHaveClass('sidebar--open');
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      render(<Sidebar activeView="poem-input" onNavigate={mockOnNavigate} className="custom-sidebar" />);

      expect(screen.getByTestId('sidebar')).toHaveClass('custom-sidebar');
    });

    it('includes base sidebar class', () => {
      render(<Sidebar activeView="poem-input" onNavigate={mockOnNavigate} />);

      expect(screen.getByTestId('sidebar')).toHaveClass('sidebar');
    });
  });

  describe('accessibility', () => {
    it('has role="navigation"', () => {
      render(<Sidebar activeView="poem-input" onNavigate={mockOnNavigate} />);

      expect(screen.getByTestId('sidebar')).toHaveAttribute('role', 'navigation');
    });

    it('has aria-label for main navigation', () => {
      render(<Sidebar activeView="poem-input" onNavigate={mockOnNavigate} />);

      expect(screen.getByTestId('sidebar')).toHaveAttribute('aria-label', 'Main navigation');
    });

    it('uses aside element', () => {
      render(<Sidebar activeView="poem-input" onNavigate={mockOnNavigate} />);

      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar.tagName).toBe('ASIDE');
    });

    it('navigation links are buttons', () => {
      render(<Sidebar activeView="poem-input" onNavigate={mockOnNavigate} />);

      const navItems = screen.getAllByRole('button');
      // Should have 5 navigation buttons
      expect(navItems.length).toBe(5);
    });

    it('provides aria-describedby for each navigation item', () => {
      render(<Sidebar activeView="poem-input" onNavigate={mockOnNavigate} />);

      const navItem = screen.getByTestId('nav-poem-input');
      expect(navItem).toHaveAttribute('aria-describedby', 'nav-desc-poem-input');
    });

    it('includes visually hidden descriptions', () => {
      render(<Sidebar activeView="poem-input" onNavigate={mockOnNavigate} />);

      // Check that description elements exist (they're visually hidden)
      expect(document.getElementById('nav-desc-poem-input')).toBeInTheDocument();
      expect(document.getElementById('nav-desc-analysis')).toBeInTheDocument();
      expect(document.getElementById('nav-desc-lyrics-editor')).toBeInTheDocument();
      expect(document.getElementById('nav-desc-melody')).toBeInTheDocument();
      expect(document.getElementById('nav-desc-recording')).toBeInTheDocument();
    });
  });
});
