/**
 * SkipLinks Component Tests
 *
 * Tests for the skip links accessibility component.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '@/test/a11yHelpers';
import { SkipLinks } from './SkipLinks';

describe('SkipLinks', () => {
  let mainContent: HTMLElement;
  let navigation: HTMLElement;

  beforeEach(() => {
    // Create target elements for skip links
    mainContent = document.createElement('main');
    mainContent.id = 'main-content';
    mainContent.textContent = 'Main content area';
    document.body.appendChild(mainContent);

    navigation = document.createElement('nav');
    navigation.id = 'navigation';
    navigation.textContent = 'Navigation area';
    document.body.appendChild(navigation);
  });

  afterEach(() => {
    document.body.removeChild(mainContent);
    document.body.removeChild(navigation);
  });

  describe('rendering', () => {
    it('should render skip links container', () => {
      render(<SkipLinks />);
      expect(screen.getByTestId('skip-links')).toBeInTheDocument();
    });

    it('should render default skip links', () => {
      render(<SkipLinks />);
      expect(screen.getByText('Skip to main content')).toBeInTheDocument();
      expect(screen.getByText('Skip to navigation')).toBeInTheDocument();
    });

    it('should render custom skip links', () => {
      const customLinks = [
        { targetId: 'search', label: 'Skip to search' },
        { targetId: 'footer', label: 'Skip to footer' },
      ];

      render(<SkipLinks links={customLinks} />);
      expect(screen.getByText('Skip to search')).toBeInTheDocument();
      expect(screen.getByText('Skip to footer')).toBeInTheDocument();
    });

    it('should have proper navigation role', () => {
      render(<SkipLinks />);
      expect(screen.getByRole('navigation', { name: 'Skip links' })).toBeInTheDocument();
    });
  });

  describe('skip link behavior', () => {
    it('should navigate to target element on click', async () => {
      const user = userEvent.setup();
      render(<SkipLinks />);

      const mainLink = screen.getByText('Skip to main content');
      await user.click(mainLink);

      // Target should be focused
      expect(document.activeElement).toBe(mainContent);
    });

    it('should add tabindex to target if not focusable', async () => {
      const user = userEvent.setup();
      render(<SkipLinks />);

      // Ensure tabindex is not set initially
      expect(mainContent.hasAttribute('tabindex')).toBe(false);

      const mainLink = screen.getByText('Skip to main content');
      await user.click(mainLink);

      // Tabindex should be added
      expect(mainContent.getAttribute('tabindex')).toBe('-1');
    });

    it('should not add tabindex if target already has one', async () => {
      const user = userEvent.setup();
      mainContent.setAttribute('tabindex', '0');

      render(<SkipLinks />);

      const mainLink = screen.getByText('Skip to main content');
      await user.click(mainLink);

      // Original tabindex should be preserved
      expect(mainContent.getAttribute('tabindex')).toBe('0');
    });

    it('should scroll to target element', async () => {
      const scrollIntoViewMock = vi.fn();
      mainContent.scrollIntoView = scrollIntoViewMock;

      const user = userEvent.setup();
      render(<SkipLinks />);

      const mainLink = screen.getByText('Skip to main content');
      await user.click(mainLink);

      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });
    });
  });

  describe('keyboard navigation', () => {
    it('should be focusable via Tab', async () => {
      const user = userEvent.setup();
      render(<SkipLinks />);

      // Tab to focus the first skip link
      await user.tab();

      const firstLink = screen.getByText('Skip to main content');
      expect(document.activeElement).toBe(firstLink);
    });

    it('should activate skip link on Enter', async () => {
      const user = userEvent.setup();
      render(<SkipLinks />);

      // Tab to first skip link
      await user.tab();

      // Press Enter to activate
      await user.keyboard('{Enter}');

      expect(document.activeElement).toBe(mainContent);
    });
  });

  describe('accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<SkipLinks />);
      await expectNoA11yViolations(container);
    });

    it('should have proper href attributes', () => {
      render(<SkipLinks />);

      const mainLink = screen.getByText('Skip to main content').closest('a');
      expect(mainLink).toHaveAttribute('href', '#main-content');

      const navLink = screen.getByText('Skip to navigation').closest('a');
      expect(navLink).toHaveAttribute('href', '#navigation');
    });
  });

  describe('edge cases', () => {
    it('should handle missing target element gracefully', async () => {
      const user = userEvent.setup();
      const customLinks = [
        { targetId: 'nonexistent', label: 'Skip to nonexistent' },
      ];

      render(<SkipLinks links={customLinks} />);

      const link = screen.getByText('Skip to nonexistent');

      // Should not throw error when clicking
      await expect(user.click(link)).resolves.not.toThrow();
    });

    it('should apply custom className', () => {
      render(<SkipLinks className="custom-class" />);
      expect(screen.getByTestId('skip-links')).toHaveClass('custom-class');
    });
  });
});
