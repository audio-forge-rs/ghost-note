/**
 * ErrorBoundary Component
 *
 * A React error boundary that catches JavaScript errors in child components,
 * logs them, displays a fallback UI, and reports errors to analytics.
 *
 * @module components/Common/ErrorBoundary
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { ErrorMessage } from './ErrorMessage';
import { analyticsService } from '@/lib/analytics';
import './ErrorBoundary.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[ErrorBoundary] ${message}`, ...args);
  }
};

/**
 * Props for the ErrorBoundary component
 */
export interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Optional custom fallback component */
  fallback?: ReactNode;
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to show retry button (default: true) */
  showRetry?: boolean;
  /** Custom error title */
  title?: string;
  /** Additional CSS class name */
  className?: string;
  /** Data test ID for testing */
  testId?: string;
  /** Component name for error reporting */
  componentName?: string;
  /** Whether to report errors to analytics (default: true) */
  reportToAnalytics?: boolean;
}

/**
 * State for the ErrorBoundary component
 */
export interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The caught error */
  error: Error | null;
  /** Error component stack */
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component catches JavaScript errors in child components
 * and displays a fallback UI instead of crashing the entire application.
 *
 * Features:
 * - Catches and logs errors in child component tree
 * - Customizable fallback UI
 * - Retry functionality to attempt recovery
 * - Error callback for external error tracking
 * - Accessible error messaging
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   title="Something went wrong"
 *   onError={(error) => logToService(error)}
 * >
 *   <ComponentThatMightCrash />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    log('Error caught by boundary:', error.message);
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    log('Error details:', { error, errorInfo });
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

    this.setState({ errorInfo });

    // Report error to analytics (if enabled)
    const { reportToAnalytics = true, componentName } = this.props;
    if (reportToAnalytics) {
      // Extract component name from stack if not provided
      const component = componentName || this.extractComponentName(errorInfo.componentStack);

      log('Reporting error to analytics', { component });
      analyticsService.trackError(error, {
        component,
        caught: true,
        isReactError: true,
      });
    }

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Extract the component name from the React component stack
   */
  private extractComponentName(componentStack: string | null | undefined): string | undefined {
    if (!componentStack) return undefined;

    // The first line typically contains the component that threw
    const lines = componentStack.trim().split('\n');
    if (lines.length === 0) return undefined;

    // Extract component name from format like "    at ComponentName (url)"
    const match = lines[0].match(/at\s+(\w+)/);
    return match ? match[1] : undefined;
  }

  handleRetry = (): void => {
    log('Retry requested, resetting error state');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const {
      children,
      fallback,
      showRetry = true,
      title = 'Something went wrong',
      className = '',
      testId = 'error-boundary',
    } = this.props;

    const { hasError, error, errorInfo } = this.state;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return (
          <div className={`error-boundary ${className}`.trim()} data-testid={testId}>
            {fallback}
          </div>
        );
      }

      // Default error UI
      const containerClass = ['error-boundary', className].filter(Boolean).join(' ').trim();

      return (
        <div className={containerClass} data-testid={testId} role="alert">
          <ErrorMessage
            title={title}
            message={error?.message ?? 'An unexpected error occurred'}
            variant="error"
            showIcon
            onRetry={showRetry ? this.handleRetry : undefined}
            retryLabel="Try Again"
            testId={`${testId}-message`}
          />
          {DEBUG && errorInfo && (
            <details className="error-boundary__details">
              <summary className="error-boundary__summary">Error Details</summary>
              <pre className="error-boundary__stack">
                {error?.stack}
                {'\n\nComponent Stack:'}
                {errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
