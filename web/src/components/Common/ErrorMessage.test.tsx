/**
 * Tests for ErrorMessage Component
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { ErrorMessage, type ErrorMessageProps } from './ErrorMessage';

describe('ErrorMessage', () => {
  const defaultProps: ErrorMessageProps = {
    title: 'Test Error',
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the error message container', () => {
      render(<ErrorMessage {...defaultProps} />);

      const container = screen.getByTestId('error-message');
      expect(container).toBeInTheDocument();
    });

    it('renders the title', () => {
      render(<ErrorMessage {...defaultProps} />);

      expect(screen.getByText('Test Error')).toBeInTheDocument();
    });

    it('renders message when provided', () => {
      render(<ErrorMessage {...defaultProps} message="Detailed error information" />);

      expect(screen.getByText('Detailed error information')).toBeInTheDocument();
    });

    it('does not render message when not provided', () => {
      render(<ErrorMessage {...defaultProps} />);

      const message = document.querySelector('.error-message__text');
      expect(message).not.toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('applies error variant class by default', () => {
      render(<ErrorMessage {...defaultProps} />);

      const container = screen.getByTestId('error-message');
      expect(container).toHaveClass('error-message--error');
    });

    it('applies warning variant class', () => {
      render(<ErrorMessage {...defaultProps} variant="warning" />);

      const container = screen.getByTestId('error-message');
      expect(container).toHaveClass('error-message--warning');
    });

    it('applies info variant class', () => {
      render(<ErrorMessage {...defaultProps} variant="info" />);

      const container = screen.getByTestId('error-message');
      expect(container).toHaveClass('error-message--info');
    });
  });

  describe('icons', () => {
    it('shows default icon when showIcon is true', () => {
      render(<ErrorMessage {...defaultProps} showIcon />);

      const iconContainer = document.querySelector('.error-message__icon');
      expect(iconContainer).toBeInTheDocument();
    });

    it('does not show icon when showIcon is false', () => {
      render(<ErrorMessage {...defaultProps} showIcon={false} />);

      const iconContainer = document.querySelector('.error-message__icon');
      expect(iconContainer).not.toBeInTheDocument();
    });

    it('shows custom icon when provided', () => {
      render(
        <ErrorMessage
          {...defaultProps}
          showIcon
          icon={<svg data-testid="custom-icon"><circle r="5" /></svg>}
        />
      );

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('hides icon from screen readers', () => {
      render(<ErrorMessage {...defaultProps} showIcon />);

      const iconContainer = document.querySelector('.error-message__icon');
      expect(iconContainer?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('retry action', () => {
    it('renders retry button when onRetry is provided', () => {
      const onRetry = vi.fn();
      render(<ErrorMessage {...defaultProps} onRetry={onRetry} />);

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('does not render retry button when onRetry is not provided', () => {
      render(<ErrorMessage {...defaultProps} />);

      expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    });

    it('uses custom retry label', () => {
      const onRetry = vi.fn();
      render(<ErrorMessage {...defaultProps} onRetry={onRetry} retryLabel="Try Again" />);

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', () => {
      const onRetry = vi.fn();
      render(<ErrorMessage {...defaultProps} onRetry={onRetry} />);

      fireEvent.click(screen.getByText('Retry'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('retry button has correct aria-label', () => {
      const onRetry = vi.fn();
      render(<ErrorMessage {...defaultProps} onRetry={onRetry} retryLabel="Try Again" />);

      const button = screen.getByText('Try Again');
      expect(button.getAttribute('aria-label')).toBe('Try Again');
    });
  });

  describe('dismiss action', () => {
    it('renders dismiss button when onDismiss is provided', () => {
      const onDismiss = vi.fn();
      render(<ErrorMessage {...defaultProps} onDismiss={onDismiss} />);

      const dismissButton = document.querySelector('.error-message__dismiss');
      expect(dismissButton).toBeInTheDocument();
    });

    it('does not render dismiss button when onDismiss is not provided', () => {
      render(<ErrorMessage {...defaultProps} />);

      const dismissButton = document.querySelector('.error-message__dismiss');
      expect(dismissButton).not.toBeInTheDocument();
    });

    it('calls onDismiss when dismiss button is clicked', () => {
      const onDismiss = vi.fn();
      render(<ErrorMessage {...defaultProps} onDismiss={onDismiss} />);

      const dismissButton = document.querySelector('.error-message__dismiss');
      fireEvent.click(dismissButton!);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('dismiss button has correct aria-label', () => {
      const onDismiss = vi.fn();
      render(<ErrorMessage {...defaultProps} onDismiss={onDismiss} />);

      const dismissButton = document.querySelector('.error-message__dismiss');
      expect(dismissButton?.getAttribute('aria-label')).toBe('Dismiss');
    });
  });

  describe('actions container', () => {
    it('renders actions container when onRetry is provided', () => {
      const onRetry = vi.fn();
      render(<ErrorMessage {...defaultProps} onRetry={onRetry} />);

      const actionsContainer = document.querySelector('.error-message__actions');
      expect(actionsContainer).toBeInTheDocument();
    });

    it('renders actions container when onDismiss is provided', () => {
      const onDismiss = vi.fn();
      render(<ErrorMessage {...defaultProps} onDismiss={onDismiss} />);

      const actionsContainer = document.querySelector('.error-message__actions');
      expect(actionsContainer).toBeInTheDocument();
    });

    it('does not render actions container when no actions provided', () => {
      render(<ErrorMessage {...defaultProps} />);

      const actionsContainer = document.querySelector('.error-message__actions');
      expect(actionsContainer).not.toBeInTheDocument();
    });

    it('renders both retry and dismiss buttons', () => {
      const onRetry = vi.fn();
      const onDismiss = vi.fn();
      render(<ErrorMessage {...defaultProps} onRetry={onRetry} onDismiss={onDismiss} />);

      expect(screen.getByText('Retry')).toBeInTheDocument();
      expect(document.querySelector('.error-message__dismiss')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has role="alert"', () => {
      render(<ErrorMessage {...defaultProps} />);

      const container = screen.getByTestId('error-message');
      expect(container.getAttribute('role')).toBe('alert');
    });

    it('has aria-live="assertive"', () => {
      render(<ErrorMessage {...defaultProps} />);

      const container = screen.getByTestId('error-message');
      expect(container.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      render(<ErrorMessage {...defaultProps} className="custom-class" />);

      const container = screen.getByTestId('error-message');
      expect(container).toHaveClass('error-message', 'custom-class');
    });

    it('uses custom testId when provided', () => {
      render(<ErrorMessage {...defaultProps} testId="custom-error" />);

      expect(screen.getByTestId('custom-error')).toBeInTheDocument();
    });
  });

  describe('complete error message', () => {
    it('renders all elements with all props', () => {
      const onRetry = vi.fn();
      const onDismiss = vi.fn();

      render(
        <ErrorMessage
          title="Connection Failed"
          message="Unable to reach the server"
          variant="error"
          showIcon
          onRetry={onRetry}
          retryLabel="Try Again"
          onDismiss={onDismiss}
          className="custom"
          testId="complete-error"
        />
      );

      const container = screen.getByTestId('complete-error');
      expect(container).toHaveClass('error-message', 'error-message--error', 'custom');
      expect(screen.getByText('Connection Failed')).toBeInTheDocument();
      expect(screen.getByText('Unable to reach the server')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(document.querySelector('.error-message__icon')).toBeInTheDocument();
      expect(document.querySelector('.error-message__dismiss')).toBeInTheDocument();
    });
  });
});
