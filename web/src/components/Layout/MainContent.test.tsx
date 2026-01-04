/**
 * Tests for MainContent Component
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MainContent } from './MainContent';

describe('MainContent', () => {
  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders the main content container', () => {
      render(
        <MainContent>
          <div>Content</div>
        </MainContent>
      );

      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });

    it('renders children', () => {
      render(
        <MainContent>
          <div data-testid="child-content">Test Content</div>
        </MainContent>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <MainContent>
          <div data-testid="child-1">First</div>
          <div data-testid="child-2">Second</div>
          <div data-testid="child-3">Third</div>
        </MainContent>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });

    it('renders complex nested content', () => {
      render(
        <MainContent>
          <div>
            <h1>Title</h1>
            <p>Paragraph</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        </MainContent>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('includes base main-content class', () => {
      render(
        <MainContent>
          <div>Content</div>
        </MainContent>
      );

      expect(screen.getByTestId('main-content')).toHaveClass('main-content');
    });

    it('applies custom className', () => {
      render(
        <MainContent className="custom-class">
          <div>Content</div>
        </MainContent>
      );

      expect(screen.getByTestId('main-content')).toHaveClass('custom-class');
    });

    it('combines base class with custom className', () => {
      render(
        <MainContent className="my-custom-content">
          <div>Content</div>
        </MainContent>
      );

      const mainContent = screen.getByTestId('main-content');
      expect(mainContent).toHaveClass('main-content');
      expect(mainContent).toHaveClass('my-custom-content');
    });

    it('handles empty className', () => {
      render(
        <MainContent className="">
          <div>Content</div>
        </MainContent>
      );

      expect(screen.getByTestId('main-content')).toHaveClass('main-content');
    });
  });

  describe('testId', () => {
    it('uses default testId', () => {
      render(
        <MainContent>
          <div>Content</div>
        </MainContent>
      );

      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });

    it('uses custom testId when provided', () => {
      render(
        <MainContent testId="custom-main">
          <div>Content</div>
        </MainContent>
      );

      expect(screen.getByTestId('custom-main')).toBeInTheDocument();
      expect(screen.queryByTestId('main-content')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('uses main element', () => {
      render(
        <MainContent>
          <div>Content</div>
        </MainContent>
      );

      const mainElement = screen.getByTestId('main-content');
      expect(mainElement.tagName).toBe('MAIN');
    });

    it('has role="main"', () => {
      render(
        <MainContent>
          <div>Content</div>
        </MainContent>
      );

      expect(screen.getByTestId('main-content')).toHaveAttribute('role', 'main');
    });

    it('has aria-label', () => {
      render(
        <MainContent>
          <div>Content</div>
        </MainContent>
      );

      expect(screen.getByTestId('main-content')).toHaveAttribute('aria-label', 'Main content');
    });
  });

  describe('inner container', () => {
    it('wraps children in inner container', () => {
      render(
        <MainContent>
          <div data-testid="child">Content</div>
        </MainContent>
      );

      const mainContent = screen.getByTestId('main-content');
      const innerContainer = mainContent.querySelector('.main-content__inner');
      expect(innerContainer).toBeInTheDocument();
      expect(innerContainer).toContainElement(screen.getByTestId('child'));
    });
  });
});
