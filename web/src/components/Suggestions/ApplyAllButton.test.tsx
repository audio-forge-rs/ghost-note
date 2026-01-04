/**
 * Tests for ApplyAllButton Component
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { ApplyAllButton, getOperationConfig, type ApplyAllButtonProps } from './ApplyAllButton';

describe('ApplyAllButton', () => {
  const defaultProps: ApplyAllButtonProps = {
    operation: 'accept',
    count: 5,
    onClick: vi.fn(),
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the button', () => {
      render(<ApplyAllButton {...defaultProps} />);

      const button = screen.getByTestId('apply-all-button');
      expect(button).toBeInTheDocument();
    });

    it('renders accept operation label', () => {
      render(<ApplyAllButton {...defaultProps} operation="accept" />);

      expect(screen.getByText('Accept All')).toBeInTheDocument();
    });

    it('renders reject operation label', () => {
      render(<ApplyAllButton {...defaultProps} operation="reject" />);

      expect(screen.getByText('Reject All')).toBeInTheDocument();
    });

    it('renders reset operation label', () => {
      render(<ApplyAllButton {...defaultProps} operation="reset" />);

      expect(screen.getByText('Reset All')).toBeInTheDocument();
    });

    it('renders count badge by default', () => {
      render(<ApplyAllButton {...defaultProps} count={5} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('hides count badge when showCount is false', () => {
      render(<ApplyAllButton {...defaultProps} count={5} showCount={false} />);

      expect(screen.queryByText('5')).not.toBeInTheDocument();
    });

    it('hides count badge when count is 0', () => {
      render(<ApplyAllButton {...defaultProps} count={0} />);

      const badges = document.querySelectorAll('.apply-all-button__count');
      expect(badges).toHaveLength(0);
    });
  });

  describe('interactions', () => {
    it('calls onClick when clicked', () => {
      const onClick = vi.fn();
      render(<ApplyAllButton {...defaultProps} onClick={onClick} />);

      fireEvent.click(screen.getByTestId('apply-all-button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const onClick = vi.fn();
      render(<ApplyAllButton {...defaultProps} onClick={onClick} disabled />);

      fireEvent.click(screen.getByTestId('apply-all-button'));
      expect(onClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when count is 0', () => {
      const onClick = vi.fn();
      render(<ApplyAllButton {...defaultProps} onClick={onClick} count={0} />);

      fireEvent.click(screen.getByTestId('apply-all-button'));
      expect(onClick).not.toHaveBeenCalled();
    });

    it('is disabled when count is 0', () => {
      render(<ApplyAllButton {...defaultProps} count={0} />);

      const button = screen.getByTestId('apply-all-button');
      expect(button).toBeDisabled();
    });

    it('is disabled when disabled prop is true', () => {
      render(<ApplyAllButton {...defaultProps} disabled />);

      const button = screen.getByTestId('apply-all-button');
      expect(button).toBeDisabled();
    });
  });

  describe('styling', () => {
    it('applies accept operation class', () => {
      render(<ApplyAllButton {...defaultProps} operation="accept" />);

      const button = screen.getByTestId('apply-all-button');
      expect(button).toHaveClass('apply-all-button--accept');
    });

    it('applies reject operation class', () => {
      render(<ApplyAllButton {...defaultProps} operation="reject" />);

      const button = screen.getByTestId('apply-all-button');
      expect(button).toHaveClass('apply-all-button--reject');
    });

    it('applies reset operation class', () => {
      render(<ApplyAllButton {...defaultProps} operation="reset" />);

      const button = screen.getByTestId('apply-all-button');
      expect(button).toHaveClass('apply-all-button--reset');
    });

    it('applies small size class', () => {
      render(<ApplyAllButton {...defaultProps} size="small" />);

      const button = screen.getByTestId('apply-all-button');
      expect(button).toHaveClass('apply-all-button--small');
    });

    it('applies medium size class by default', () => {
      render(<ApplyAllButton {...defaultProps} />);

      const button = screen.getByTestId('apply-all-button');
      expect(button).toHaveClass('apply-all-button--medium');
    });

    it('applies large size class', () => {
      render(<ApplyAllButton {...defaultProps} size="large" />);

      const button = screen.getByTestId('apply-all-button');
      expect(button).toHaveClass('apply-all-button--large');
    });

    it('applies disabled class when count is 0', () => {
      render(<ApplyAllButton {...defaultProps} count={0} />);

      const button = screen.getByTestId('apply-all-button');
      expect(button).toHaveClass('apply-all-button--disabled');
    });

    it('applies disabled class when disabled prop is true', () => {
      render(<ApplyAllButton {...defaultProps} disabled />);

      const button = screen.getByTestId('apply-all-button');
      expect(button).toHaveClass('apply-all-button--disabled');
    });

    it('applies custom className', () => {
      render(<ApplyAllButton {...defaultProps} className="custom-class" />);

      const button = screen.getByTestId('apply-all-button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('accessibility', () => {
    it('has descriptive aria-label including count', () => {
      render(<ApplyAllButton {...defaultProps} count={5} />);

      const button = screen.getByTestId('apply-all-button');
      expect(button.getAttribute('aria-label')).toBe('Accept All (5 suggestions)');
    });

    it('has singular aria-label for count of 1', () => {
      render(<ApplyAllButton {...defaultProps} count={1} />);

      const button = screen.getByTestId('apply-all-button');
      expect(button.getAttribute('aria-label')).toBe('Accept All (1 suggestion)');
    });

    it('has aria-label without count when count is 0', () => {
      render(<ApplyAllButton {...defaultProps} count={0} />);

      const button = screen.getByTestId('apply-all-button');
      expect(button.getAttribute('aria-label')).toBe('Accept All');
    });

    it('has title with description', () => {
      render(<ApplyAllButton {...defaultProps} operation="accept" />);

      const button = screen.getByTestId('apply-all-button');
      expect(button.getAttribute('title')).toBe('Accept all pending suggestions');
    });

    it('has data-operation attribute', () => {
      render(<ApplyAllButton {...defaultProps} operation="accept" />);

      const button = screen.getByTestId('apply-all-button');
      expect(button.getAttribute('data-operation')).toBe('accept');
    });

    it('uses custom testId when provided', () => {
      render(<ApplyAllButton {...defaultProps} testId="custom-id" />);

      expect(screen.getByTestId('custom-id')).toBeInTheDocument();
    });

    it('count badge is hidden from screen readers', () => {
      render(<ApplyAllButton {...defaultProps} count={5} />);

      const countBadge = document.querySelector('.apply-all-button__count');
      expect(countBadge?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('getOperationConfig', () => {
    it('returns correct config for accept', () => {
      const config = getOperationConfig('accept');

      expect(config.label).toBe('Accept All');
      expect(config.description).toBe('Accept all pending suggestions');
    });

    it('returns correct config for reject', () => {
      const config = getOperationConfig('reject');

      expect(config.label).toBe('Reject All');
      expect(config.description).toBe('Reject all pending suggestions');
    });

    it('returns correct config for reset', () => {
      const config = getOperationConfig('reset');

      expect(config.label).toBe('Reset All');
      expect(config.description).toBe('Reset all suggestions to pending');
    });
  });

  describe('button type', () => {
    it('has type="button"', () => {
      render(<ApplyAllButton {...defaultProps} />);

      const button = screen.getByTestId('apply-all-button');
      expect(button.getAttribute('type')).toBe('button');
    });
  });
});
