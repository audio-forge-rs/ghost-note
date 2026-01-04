/**
 * Tests for BottomNavigation Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { BottomNavigation } from './BottomNavigation';
import type { NavigationView } from './AppShell';

describe('BottomNavigation', () => {
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders the bottom navigation element', () => {
      render(<BottomNavigation activeView="poem-input" onNavigate={mockOnNavigate} />);

      expect(screen.getByTestId('bottom-navigation')).toBeInTheDocument();
    });

    it('renders all five navigation items', () => {
      render(<BottomNavigation activeView="poem-input" onNavigate={mockOnNavigate} />);

      expect(screen.getByTestId('bottom-nav-poem-input')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-nav-analysis')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-nav-lyrics-editor')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-nav-melody')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-nav-recording')).toBeInTheDocument();
    });

    it('renders navigation labels', () => {
      render(<BottomNavigation activeView="poem-input" onNavigate={mockOnNavigate} />);

      expect(screen.getByText('Poem')).toBeInTheDocument();
      expect(screen.getByText('Analysis')).toBeInTheDocument();
      expect(screen.getByText('Lyrics')).toBeInTheDocument();
      expect(screen.getByText('Melody')).toBeInTheDocument();
      expect(screen.getByText('Record')).toBeInTheDocument();
    });
  });

  describe('active state', () => {
    it('marks poem-input as active when it is the activeView', () => {
      render(<BottomNavigation activeView="poem-input" onNavigate={mockOnNavigate} />);

      const navItem = screen.getByTestId('bottom-nav-poem-input');
      expect(navItem).toHaveClass('bottom-nav__button--active');
      expect(navItem).toHaveAttribute('aria-current', 'page');
    });

    it('marks analysis as active when it is the activeView', () => {
      render(<BottomNavigation activeView="analysis" onNavigate={mockOnNavigate} />);

      const navItem = screen.getByTestId('bottom-nav-analysis');
      expect(navItem).toHaveClass('bottom-nav__button--active');
      expect(navItem).toHaveAttribute('aria-current', 'page');
    });

    it('marks lyrics-editor as active when it is the activeView', () => {
      render(<BottomNavigation activeView="lyrics-editor" onNavigate={mockOnNavigate} />);

      const navItem = screen.getByTestId('bottom-nav-lyrics-editor');
      expect(navItem).toHaveClass('bottom-nav__button--active');
    });

    it('marks melody as active when it is the activeView', () => {
      render(<BottomNavigation activeView="melody" onNavigate={mockOnNavigate} />);

      const navItem = screen.getByTestId('bottom-nav-melody');
      expect(navItem).toHaveClass('bottom-nav__button--active');
    });

    it('marks recording as active when it is the activeView', () => {
      render(<BottomNavigation activeView="recording" onNavigate={mockOnNavigate} />);

      const navItem = screen.getByTestId('bottom-nav-recording');
      expect(navItem).toHaveClass('bottom-nav__button--active');
    });

    it('does not mark inactive items with active class', () => {
      render(<BottomNavigation activeView="poem-input" onNavigate={mockOnNavigate} />);

      const navItems = [
        screen.getByTestId('bottom-nav-analysis'),
        screen.getByTestId('bottom-nav-lyrics-editor'),
        screen.getByTestId('bottom-nav-melody'),
        screen.getByTestId('bottom-nav-recording'),
      ];

      navItems.forEach((item) => {
        expect(item).not.toHaveClass('bottom-nav__button--active');
        expect(item).not.toHaveAttribute('aria-current');
      });
    });
  });

  describe('navigation', () => {
    it('calls onNavigate with correct view when item is clicked', () => {
      render(<BottomNavigation activeView="poem-input" onNavigate={mockOnNavigate} />);

      fireEvent.click(screen.getByTestId('bottom-nav-analysis'));
      expect(mockOnNavigate).toHaveBeenCalledWith('analysis');
    });

    it.each<NavigationView>([
      'poem-input',
      'analysis',
      'lyrics-editor',
      'melody',
      'recording',
    ])('calls onNavigate with %s when clicked', (view) => {
      render(<BottomNavigation activeView="poem-input" onNavigate={mockOnNavigate} />);

      fireEvent.click(screen.getByTestId(`bottom-nav-${view}`));
      expect(mockOnNavigate).toHaveBeenCalledWith(view);
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      render(
        <BottomNavigation
          activeView="poem-input"
          onNavigate={mockOnNavigate}
          className="custom-bottom-nav"
        />
      );

      expect(screen.getByTestId('bottom-navigation')).toHaveClass('custom-bottom-nav');
    });

    it('includes base bottom-nav class', () => {
      render(<BottomNavigation activeView="poem-input" onNavigate={mockOnNavigate} />);

      expect(screen.getByTestId('bottom-navigation')).toHaveClass('bottom-nav');
    });
  });

  describe('accessibility', () => {
    it('has role="navigation"', () => {
      render(<BottomNavigation activeView="poem-input" onNavigate={mockOnNavigate} />);

      expect(screen.getByTestId('bottom-navigation')).toHaveAttribute('role', 'navigation');
    });

    it('has aria-label for quick navigation', () => {
      render(<BottomNavigation activeView="poem-input" onNavigate={mockOnNavigate} />);

      expect(screen.getByTestId('bottom-navigation')).toHaveAttribute(
        'aria-label',
        'Quick navigation'
      );
    });

    it('uses nav element', () => {
      render(<BottomNavigation activeView="poem-input" onNavigate={mockOnNavigate} />);

      const nav = screen.getByTestId('bottom-navigation');
      expect(nav.tagName).toBe('NAV');
    });

    it('navigation items are buttons', () => {
      render(<BottomNavigation activeView="poem-input" onNavigate={mockOnNavigate} />);

      const navItems = screen.getAllByRole('button');
      // Should have 5 navigation buttons
      expect(navItems.length).toBe(5);
    });

    it('provides aria-label for each navigation item', () => {
      render(<BottomNavigation activeView="poem-input" onNavigate={mockOnNavigate} />);

      expect(screen.getByTestId('bottom-nav-poem-input')).toHaveAttribute('aria-label', 'Poem');
      expect(screen.getByTestId('bottom-nav-analysis')).toHaveAttribute('aria-label', 'Analysis');
      expect(screen.getByTestId('bottom-nav-lyrics-editor')).toHaveAttribute('aria-label', 'Lyrics');
      expect(screen.getByTestId('bottom-nav-melody')).toHaveAttribute('aria-label', 'Melody');
      expect(screen.getByTestId('bottom-nav-recording')).toHaveAttribute('aria-label', 'Record');
    });
  });
});
