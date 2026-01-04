/**
 * Tests for Skeleton Component
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  type SkeletonProps,
} from './Skeleton';

describe('Skeleton', () => {
  const defaultProps: SkeletonProps = {};

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders the skeleton container', () => {
      render(<Skeleton {...defaultProps} />);

      const container = screen.getByTestId('skeleton');
      expect(container).toBeInTheDocument();
    });

    it('includes screen reader text', () => {
      render(<Skeleton />);

      const srOnly = document.querySelector('.skeleton__sr-only');
      expect(srOnly).toBeInTheDocument();
      expect(srOnly).toHaveTextContent('Loading...');
    });
  });

  describe('variants', () => {
    it('applies text variant class by default', () => {
      render(<Skeleton />);

      const container = screen.getByTestId('skeleton');
      expect(container).toHaveClass('skeleton--text');
    });

    it('applies circular variant class', () => {
      render(<Skeleton variant="circular" />);

      const container = screen.getByTestId('skeleton');
      expect(container).toHaveClass('skeleton--circular');
    });

    it('applies rectangular variant class', () => {
      render(<Skeleton variant="rectangular" />);

      const container = screen.getByTestId('skeleton');
      expect(container).toHaveClass('skeleton--rectangular');
    });

    it('applies rounded variant class', () => {
      render(<Skeleton variant="rounded" />);

      const container = screen.getByTestId('skeleton');
      expect(container).toHaveClass('skeleton--rounded');
    });
  });

  describe('animation', () => {
    it('applies pulse animation by default', () => {
      render(<Skeleton />);

      const container = screen.getByTestId('skeleton');
      expect(container).toHaveClass('skeleton--pulse');
    });

    it('applies wave animation', () => {
      render(<Skeleton animation="wave" />);

      const container = screen.getByTestId('skeleton');
      expect(container).toHaveClass('skeleton--wave');
    });

    it('applies no animation class when animation is none', () => {
      render(<Skeleton animation="none" />);

      const container = screen.getByTestId('skeleton');
      expect(container).not.toHaveClass('skeleton--pulse');
      expect(container).not.toHaveClass('skeleton--wave');
    });
  });

  describe('dimensions', () => {
    it('applies width as pixels when number provided', () => {
      render(<Skeleton width={200} />);

      const container = screen.getByTestId('skeleton');
      expect(container).toHaveStyle({ width: '200px' });
    });

    it('applies width as string when string provided', () => {
      render(<Skeleton width="80%" />);

      const container = screen.getByTestId('skeleton');
      expect(container).toHaveStyle({ width: '80%' });
    });

    it('applies height as pixels when number provided', () => {
      render(<Skeleton height={100} />);

      const container = screen.getByTestId('skeleton');
      expect(container).toHaveStyle({ height: '100px' });
    });

    it('applies height as string when string provided', () => {
      render(<Skeleton height="5rem" />);

      const container = screen.getByTestId('skeleton');
      expect(container).toHaveStyle({ height: '5rem' });
    });

    it('applies both width and height', () => {
      render(<Skeleton width={200} height={100} />);

      const container = screen.getByTestId('skeleton');
      expect(container).toHaveStyle({ width: '200px', height: '100px' });
    });

    it('does not set style when no dimensions provided', () => {
      render(<Skeleton />);

      const container = screen.getByTestId('skeleton');
      expect(container.getAttribute('style')).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('has role="status"', () => {
      render(<Skeleton />);

      const container = screen.getByTestId('skeleton');
      expect(container.getAttribute('role')).toBe('status');
    });

    it('has aria-busy="true"', () => {
      render(<Skeleton />);

      const container = screen.getByTestId('skeleton');
      expect(container.getAttribute('aria-busy')).toBe('true');
    });

    it('uses default ariaLabel', () => {
      render(<Skeleton />);

      const container = screen.getByTestId('skeleton');
      expect(container.getAttribute('aria-label')).toBe('Loading...');
    });

    it('uses custom ariaLabel when provided', () => {
      render(<Skeleton ariaLabel="Loading content" />);

      const container = screen.getByTestId('skeleton');
      expect(container.getAttribute('aria-label')).toBe('Loading content');
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      render(<Skeleton className="custom-class" />);

      const container = screen.getByTestId('skeleton');
      expect(container).toHaveClass('skeleton', 'custom-class');
    });

    it('uses custom testId when provided', () => {
      render(<Skeleton testId="custom-skeleton" />);

      expect(screen.getByTestId('custom-skeleton')).toBeInTheDocument();
    });
  });
});

describe('SkeletonText', () => {
  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders the skeleton text container', () => {
      render(<SkeletonText />);

      const container = screen.getByTestId('skeleton-text');
      expect(container).toBeInTheDocument();
    });

    it('renders 3 lines by default', () => {
      render(<SkeletonText />);

      const lines = screen.getAllByTestId(/skeleton-text-line-/);
      expect(lines).toHaveLength(3);
    });

    it('renders specified number of lines', () => {
      render(<SkeletonText lines={5} />);

      const lines = screen.getAllByTestId(/skeleton-text-line-/);
      expect(lines).toHaveLength(5);
    });
  });

  describe('line widths', () => {
    it('uses default line widths', () => {
      render(<SkeletonText lines={2} />);

      const line1 = screen.getByTestId('skeleton-text-line-0');
      const line2 = screen.getByTestId('skeleton-text-line-1');
      expect(line1).toHaveStyle({ width: '100%' });
      expect(line2).toHaveStyle({ width: '95%' });
    });

    it('uses custom line widths when provided', () => {
      render(<SkeletonText lines={2} lineWidths={['80%', '60%']} />);

      const line1 = screen.getByTestId('skeleton-text-line-0');
      const line2 = screen.getByTestId('skeleton-text-line-1');
      expect(line1).toHaveStyle({ width: '80%' });
      expect(line2).toHaveStyle({ width: '60%' });
    });
  });

  describe('accessibility', () => {
    it('has role="status"', () => {
      render(<SkeletonText />);

      const container = screen.getByTestId('skeleton-text');
      expect(container.getAttribute('role')).toBe('status');
    });

    it('has aria-busy="true"', () => {
      render(<SkeletonText />);

      const container = screen.getByTestId('skeleton-text');
      expect(container.getAttribute('aria-busy')).toBe('true');
    });

    it('has aria-label with line count', () => {
      render(<SkeletonText lines={4} />);

      const container = screen.getByTestId('skeleton-text');
      expect(container.getAttribute('aria-label')).toBe('Loading 4 lines of text');
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      render(<SkeletonText className="custom-class" />);

      const container = screen.getByTestId('skeleton-text');
      expect(container).toHaveClass('skeleton-text', 'custom-class');
    });

    it('uses custom testId when provided', () => {
      render(<SkeletonText testId="custom-text" />);

      expect(screen.getByTestId('custom-text')).toBeInTheDocument();
    });
  });
});

describe('SkeletonAvatar', () => {
  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders the skeleton avatar', () => {
      render(<SkeletonAvatar />);

      const container = screen.getByTestId('skeleton-avatar');
      expect(container).toBeInTheDocument();
    });

    it('uses circular variant', () => {
      render(<SkeletonAvatar />);

      const container = screen.getByTestId('skeleton-avatar');
      expect(container).toHaveClass('skeleton--circular');
    });
  });

  describe('size', () => {
    it('uses default size of 48px', () => {
      render(<SkeletonAvatar />);

      const container = screen.getByTestId('skeleton-avatar');
      expect(container).toHaveStyle({ width: '48px', height: '48px' });
    });

    it('uses custom size when provided as number', () => {
      render(<SkeletonAvatar size={64} />);

      const container = screen.getByTestId('skeleton-avatar');
      expect(container).toHaveStyle({ width: '64px', height: '64px' });
    });

    it('uses custom size when provided as string', () => {
      render(<SkeletonAvatar size="3rem" />);

      const container = screen.getByTestId('skeleton-avatar');
      expect(container).toHaveStyle({ width: '3rem', height: '3rem' });
    });
  });

  describe('accessibility', () => {
    it('has aria-label for avatar', () => {
      render(<SkeletonAvatar />);

      const container = screen.getByTestId('skeleton-avatar');
      expect(container.getAttribute('aria-label')).toBe('Loading avatar');
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      render(<SkeletonAvatar className="custom-class" />);

      const container = screen.getByTestId('skeleton-avatar');
      expect(container).toHaveClass('skeleton', 'custom-class');
    });

    it('uses custom testId when provided', () => {
      render(<SkeletonAvatar testId="custom-avatar" />);

      expect(screen.getByTestId('custom-avatar')).toBeInTheDocument();
    });
  });
});

describe('SkeletonCard', () => {
  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders the skeleton card', () => {
      render(<SkeletonCard />);

      const container = screen.getByTestId('skeleton-card');
      expect(container).toBeInTheDocument();
    });

    it('renders text lines', () => {
      render(<SkeletonCard />);

      const textContainer = screen.getByTestId('skeleton-card-text');
      expect(textContainer).toBeInTheDocument();
    });

    it('renders 3 lines by default', () => {
      render(<SkeletonCard />);

      const lines = screen.getAllByTestId(/skeleton-card-text-line-/);
      expect(lines).toHaveLength(3);
    });

    it('renders specified number of lines', () => {
      render(<SkeletonCard lines={5} />);

      const lines = screen.getAllByTestId(/skeleton-card-text-line-/);
      expect(lines).toHaveLength(5);
    });
  });

  describe('avatar', () => {
    it('does not show avatar by default', () => {
      render(<SkeletonCard />);

      const header = document.querySelector('.skeleton-card__header');
      expect(header).not.toBeInTheDocument();
    });

    it('shows avatar when showAvatar is true', () => {
      render(<SkeletonCard showAvatar />);

      const avatar = screen.getByTestId('skeleton-card-avatar');
      expect(avatar).toBeInTheDocument();
    });

    it('shows name and subtitle skeletons with avatar', () => {
      render(<SkeletonCard showAvatar />);

      expect(screen.getByTestId('skeleton-card-name')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-card-subtitle')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has role="status"', () => {
      render(<SkeletonCard />);

      const container = screen.getByTestId('skeleton-card');
      expect(container.getAttribute('role')).toBe('status');
    });

    it('has aria-busy="true"', () => {
      render(<SkeletonCard />);

      const container = screen.getByTestId('skeleton-card');
      expect(container.getAttribute('aria-busy')).toBe('true');
    });

    it('has aria-label for card', () => {
      render(<SkeletonCard />);

      const container = screen.getByTestId('skeleton-card');
      expect(container.getAttribute('aria-label')).toBe('Loading content');
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      render(<SkeletonCard className="custom-class" />);

      const container = screen.getByTestId('skeleton-card');
      expect(container).toHaveClass('skeleton-card', 'custom-class');
    });

    it('uses custom testId when provided', () => {
      render(<SkeletonCard testId="custom-card" />);

      expect(screen.getByTestId('custom-card')).toBeInTheDocument();
    });
  });

  describe('complete skeleton card', () => {
    it('renders all elements with all props', () => {
      render(
        <SkeletonCard
          showAvatar
          lines={4}
          animation="wave"
          className="custom"
          testId="complete-card"
        />
      );

      const container = screen.getByTestId('complete-card');
      expect(container).toHaveClass('skeleton-card', 'custom');
      expect(screen.getByTestId('complete-card-avatar')).toBeInTheDocument();
      expect(screen.getByTestId('complete-card-name')).toBeInTheDocument();
      expect(screen.getByTestId('complete-card-subtitle')).toBeInTheDocument();

      const lines = screen.getAllByTestId(/complete-card-text-line-/);
      expect(lines).toHaveLength(4);
    });
  });
});
