/**
 * Tests for MeaningPreservationBadge Component
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import {
  MeaningPreservationBadge,
  type MeaningPreservationBadgeProps,
} from './MeaningPreservationBadge';
import { getPreservationConfig, getPreservationLevels } from './meaningPreservationUtils';

describe('MeaningPreservationBadge', () => {
  const defaultProps: MeaningPreservationBadgeProps = {
    preservation: 'yes',
  };

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders the badge container', () => {
      render(<MeaningPreservationBadge {...defaultProps} />);

      const badge = screen.getByTestId('meaning-preservation-badge');
      expect(badge).toBeInTheDocument();
    });

    it('renders icon for yes preservation', () => {
      render(<MeaningPreservationBadge preservation="yes" />);

      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('renders icon for partial preservation', () => {
      render(<MeaningPreservationBadge preservation="partial" />);

      expect(screen.getByText('~')).toBeInTheDocument();
    });

    it('renders icon for no preservation', () => {
      render(<MeaningPreservationBadge preservation="no" />);

      expect(screen.getByText('!')).toBeInTheDocument();
    });

    it('does not show label by default', () => {
      render(<MeaningPreservationBadge {...defaultProps} />);

      expect(screen.queryByText('Preserves Meaning')).not.toBeInTheDocument();
    });

    it('shows label when showLabel is true', () => {
      render(<MeaningPreservationBadge {...defaultProps} showLabel />);

      expect(screen.getByText('Preserves Meaning')).toBeInTheDocument();
    });

    it('shows short label for small size', () => {
      render(<MeaningPreservationBadge {...defaultProps} showLabel size="small" />);

      expect(screen.getByText('Preserves')).toBeInTheDocument();
    });

    it('shows full label for medium size', () => {
      render(<MeaningPreservationBadge {...defaultProps} showLabel size="medium" />);

      expect(screen.getByText('Preserves Meaning')).toBeInTheDocument();
    });

    it('shows full label for large size', () => {
      render(<MeaningPreservationBadge {...defaultProps} showLabel size="large" />);

      expect(screen.getByText('Preserves Meaning')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies yes variant class', () => {
      render(<MeaningPreservationBadge preservation="yes" />);

      const badge = screen.getByTestId('meaning-preservation-badge');
      expect(badge).toHaveClass('meaning-preservation-badge--yes');
    });

    it('applies partial variant class', () => {
      render(<MeaningPreservationBadge preservation="partial" />);

      const badge = screen.getByTestId('meaning-preservation-badge');
      expect(badge).toHaveClass('meaning-preservation-badge--partial');
    });

    it('applies no variant class', () => {
      render(<MeaningPreservationBadge preservation="no" />);

      const badge = screen.getByTestId('meaning-preservation-badge');
      expect(badge).toHaveClass('meaning-preservation-badge--no');
    });

    it('applies small size class', () => {
      render(<MeaningPreservationBadge {...defaultProps} size="small" />);

      const badge = screen.getByTestId('meaning-preservation-badge');
      expect(badge).toHaveClass('meaning-preservation-badge--small');
    });

    it('applies medium size class by default', () => {
      render(<MeaningPreservationBadge {...defaultProps} />);

      const badge = screen.getByTestId('meaning-preservation-badge');
      expect(badge).toHaveClass('meaning-preservation-badge--medium');
    });

    it('applies large size class', () => {
      render(<MeaningPreservationBadge {...defaultProps} size="large" />);

      const badge = screen.getByTestId('meaning-preservation-badge');
      expect(badge).toHaveClass('meaning-preservation-badge--large');
    });

    it('applies custom className', () => {
      render(<MeaningPreservationBadge {...defaultProps} className="custom-class" />);

      const badge = screen.getByTestId('meaning-preservation-badge');
      expect(badge).toHaveClass('custom-class');
    });
  });

  describe('accessibility', () => {
    it('has role="status"', () => {
      render(<MeaningPreservationBadge {...defaultProps} />);

      const badge = screen.getByTestId('meaning-preservation-badge');
      expect(badge.getAttribute('role')).toBe('status');
    });

    it('has appropriate aria-label for yes', () => {
      render(<MeaningPreservationBadge preservation="yes" />);

      const badge = screen.getByTestId('meaning-preservation-badge');
      expect(badge.getAttribute('aria-label')).toBe(
        'This suggestion maintains the original meaning of the text'
      );
    });

    it('has appropriate aria-label for partial', () => {
      render(<MeaningPreservationBadge preservation="partial" />);

      const badge = screen.getByTestId('meaning-preservation-badge');
      expect(badge.getAttribute('aria-label')).toBe(
        'This suggestion partially preserves the original meaning'
      );
    });

    it('has appropriate aria-label for no', () => {
      render(<MeaningPreservationBadge preservation="no" />);

      const badge = screen.getByTestId('meaning-preservation-badge');
      expect(badge.getAttribute('aria-label')).toBe(
        'This suggestion significantly changes the original meaning'
      );
    });

    it('has title matching description', () => {
      render(<MeaningPreservationBadge preservation="yes" />);

      const badge = screen.getByTestId('meaning-preservation-badge');
      expect(badge.getAttribute('title')).toBe(
        'This suggestion maintains the original meaning of the text'
      );
    });

    it('hides icon from screen readers', () => {
      render(<MeaningPreservationBadge {...defaultProps} />);

      const icon = document.querySelector('.meaning-preservation-badge__icon');
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });

    it('uses custom testId when provided', () => {
      render(<MeaningPreservationBadge {...defaultProps} testId="custom-id" />);

      expect(screen.getByTestId('custom-id')).toBeInTheDocument();
    });
  });

  describe('getPreservationConfig', () => {
    it('returns correct config for yes', () => {
      const config = getPreservationConfig('yes');

      expect(config.label).toBe('Preserves Meaning');
      expect(config.shortLabel).toBe('Preserves');
      expect(config.icon).toBe('✓');
    });

    it('returns correct config for partial', () => {
      const config = getPreservationConfig('partial');

      expect(config.label).toBe('Partial Preservation');
      expect(config.shortLabel).toBe('Partial');
      expect(config.icon).toBe('~');
    });

    it('returns correct config for no', () => {
      const config = getPreservationConfig('no');

      expect(config.label).toBe('Changes Meaning');
      expect(config.shortLabel).toBe('Changes');
      expect(config.icon).toBe('!');
    });
  });

  describe('getPreservationLevels', () => {
    it('returns all levels in correct order', () => {
      const levels = getPreservationLevels();

      expect(levels).toEqual(['yes', 'partial', 'no']);
    });
  });
});
