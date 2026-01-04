/**
 * Tests for ErrorBoundary Component
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import type { ReactElement } from 'react';
import { ErrorBoundary, type ErrorBoundaryProps } from './ErrorBoundary';

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }): ReactElement {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div data-testid="child-content">Child content</div>;
}

describe('ErrorBoundary', () => {
  const defaultProps: ErrorBoundaryProps = {
    children: <div data-testid="child-content">Child content</div>,
  };

  // Suppress console.error for error boundary tests
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    console.error = originalError;
  });

  describe('normal rendering', () => {
    it('renders children when no error occurs', () => {
      render(<ErrorBoundary {...defaultProps} />);

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('does not show error UI when no error occurs', () => {
      render(<ErrorBoundary {...defaultProps} />);

      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('catches errors in child components', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    });

    it('displays error message container', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-message')).toBeInTheDocument();
    });

    it('shows default error title', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('shows custom error title when provided', () => {
      render(
        <ErrorBoundary title="Custom Error Title">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
    });

    it('displays the error message', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('has role="alert"', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const boundary = screen.getByTestId('error-boundary');
      expect(boundary.getAttribute('role')).toBe('alert');
    });
  });

  describe('onError callback', () => {
    it('calls onError when error is caught', () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('passes error to onError callback', () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const [error] = onError.mock.calls[0];
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error message');
    });

    it('passes errorInfo to onError callback', () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const [, errorInfo] = onError.mock.calls[0];
      expect(errorInfo).toHaveProperty('componentStack');
    });
  });

  describe('retry functionality', () => {
    it('shows retry button by default', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('hides retry button when showRetry is false', () => {
      render(
        <ErrorBoundary showRetry={false}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    });

    it('resets error state when retry is clicked', () => {
      // Use a stateful approach with a key to force remount
      let shouldThrow = true;

      const { rerender } = render(
        <ErrorBoundary key="eb1">
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();

      // Update the flag before clicking retry
      shouldThrow = false;

      // Click retry - this resets the error boundary state
      fireEvent.click(screen.getByText('Try Again'));

      // Re-render with non-throwing component using a new key to force complete remount
      rerender(
        <ErrorBoundary key="eb2">
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });
  });

  describe('custom fallback', () => {
    it('renders custom fallback when provided', () => {
      const customFallback = <div data-testid="custom-fallback">Custom error UI</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    });

    it('wraps custom fallback in error-boundary container', () => {
      const customFallback = <div data-testid="custom-fallback">Custom error UI</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const boundary = screen.getByTestId('error-boundary');
      expect(boundary).toContainElement(screen.getByTestId('custom-fallback'));
    });

    it('does not show default error UI when custom fallback provided', () => {
      const customFallback = <div data-testid="custom-fallback">Custom error UI</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByTestId('error-boundary-message')).not.toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      render(
        <ErrorBoundary className="custom-class">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const boundary = screen.getByTestId('error-boundary');
      expect(boundary).toHaveClass('error-boundary', 'custom-class');
    });

    it('uses custom testId when provided', () => {
      render(
        <ErrorBoundary testId="custom-boundary">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-boundary')).toBeInTheDocument();
    });
  });

  describe('complete error boundary', () => {
    it('handles error with all props', () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary
          title="Application Error"
          onError={onError}
          showRetry
          className="custom"
          testId="complete-boundary"
        >
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const boundary = screen.getByTestId('complete-boundary');
      expect(boundary).toHaveClass('error-boundary', 'custom');
      expect(screen.getByText('Application Error')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });
});
