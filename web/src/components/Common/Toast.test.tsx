/**
 * Tests for Toast Component
 *
 * @module components/Common/Toast.test
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { Toast, ToastContainer, type ToastProps } from './Toast';
import { useToastStore, type Toast as ToastData } from '@/stores/useToastStore';

// Mock toast data
const createMockToast = (overrides: Partial<ToastData> = {}): ToastData => ({
  id: 'test-toast-1',
  message: 'Test message',
  type: 'info',
  duration: 5000,
  createdAt: Date.now(),
  ...overrides,
});

describe('Toast', () => {
  const defaultProps: ToastProps = {
    toast: createMockToast(),
    onDismiss: vi.fn(),
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the toast container', () => {
      render(<Toast {...defaultProps} />);

      const toast = screen.getByTestId('toast-test-toast-1');
      expect(toast).toBeInTheDocument();
    });

    it('renders the message', () => {
      render(<Toast {...defaultProps} />);

      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('renders the dismiss button', () => {
      render(<Toast {...defaultProps} />);

      const dismissButton = screen.getByTestId('toast-dismiss-test-toast-1');
      expect(dismissButton).toBeInTheDocument();
    });

    it('uses custom testId when provided', () => {
      render(<Toast {...defaultProps} testId="custom-toast" />);

      expect(screen.getByTestId('custom-toast')).toBeInTheDocument();
    });
  });

  describe('toast types', () => {
    it('applies success class for success type', () => {
      const toast = createMockToast({ type: 'success' });
      render(<Toast {...defaultProps} toast={toast} />);

      const toastElement = screen.getByTestId('toast-test-toast-1');
      expect(toastElement).toHaveClass('toast--success');
    });

    it('applies error class for error type', () => {
      const toast = createMockToast({ type: 'error' });
      render(<Toast {...defaultProps} toast={toast} />);

      const toastElement = screen.getByTestId('toast-test-toast-1');
      expect(toastElement).toHaveClass('toast--error');
    });

    it('applies warning class for warning type', () => {
      const toast = createMockToast({ type: 'warning' });
      render(<Toast {...defaultProps} toast={toast} />);

      const toastElement = screen.getByTestId('toast-test-toast-1');
      expect(toastElement).toHaveClass('toast--warning');
    });

    it('applies info class for info type', () => {
      const toast = createMockToast({ type: 'info' });
      render(<Toast {...defaultProps} toast={toast} />);

      const toastElement = screen.getByTestId('toast-test-toast-1');
      expect(toastElement).toHaveClass('toast--info');
    });
  });

  describe('dismiss action', () => {
    it('calls onDismiss when dismiss button is clicked', () => {
      const onDismiss = vi.fn();
      render(<Toast {...defaultProps} onDismiss={onDismiss} />);

      const dismissButton = screen.getByTestId('toast-dismiss-test-toast-1');
      fireEvent.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
      expect(onDismiss).toHaveBeenCalledWith('test-toast-1');
    });

    it('dismiss button has correct aria-label', () => {
      render(<Toast {...defaultProps} />);

      const dismissButton = screen.getByTestId('toast-dismiss-test-toast-1');
      expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss notification');
    });
  });

  describe('icons', () => {
    it('renders icon container', () => {
      render(<Toast {...defaultProps} />);

      const iconContainer = document.querySelector('.toast__icon');
      expect(iconContainer).toBeInTheDocument();
    });

    it('hides icon from screen readers', () => {
      render(<Toast {...defaultProps} />);

      const iconContainer = document.querySelector('.toast__icon');
      expect(iconContainer?.getAttribute('aria-hidden')).toBe('true');
    });

    it('renders different icons for each type', () => {
      const { rerender } = render(<Toast {...defaultProps} toast={createMockToast({ type: 'success' })} />);
      let svg = document.querySelector('.toast__icon svg');
      expect(svg).toBeInTheDocument();

      rerender(<Toast {...defaultProps} toast={createMockToast({ type: 'error' })} />);
      svg = document.querySelector('.toast__icon svg');
      expect(svg).toBeInTheDocument();

      rerender(<Toast {...defaultProps} toast={createMockToast({ type: 'warning' })} />);
      svg = document.querySelector('.toast__icon svg');
      expect(svg).toBeInTheDocument();

      rerender(<Toast {...defaultProps} toast={createMockToast({ type: 'info' })} />);
      svg = document.querySelector('.toast__icon svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has role="alert"', () => {
      render(<Toast {...defaultProps} />);

      const toast = screen.getByTestId('toast-test-toast-1');
      expect(toast).toHaveAttribute('role', 'alert');
    });

    it('uses aria-live="assertive" for error toasts', () => {
      const errorToast = createMockToast({ type: 'error' });
      render(<Toast {...defaultProps} toast={errorToast} />);

      const toast = screen.getByTestId('toast-test-toast-1');
      expect(toast).toHaveAttribute('aria-live', 'assertive');
    });

    it('uses aria-live="polite" for non-error toasts', () => {
      const infoToast = createMockToast({ type: 'info' });
      render(<Toast {...defaultProps} toast={infoToast} />);

      const toast = screen.getByTestId('toast-test-toast-1');
      expect(toast).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-atomic="true"', () => {
      render(<Toast {...defaultProps} />);

      const toast = screen.getByTestId('toast-test-toast-1');
      expect(toast).toHaveAttribute('aria-atomic', 'true');
    });
  });
});

describe('ToastContainer', () => {
  beforeEach(() => {
    useToastStore.getState().reset();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the container', () => {
      render(<ToastContainer />);

      expect(screen.getByTestId('toast-container')).toBeInTheDocument();
    });

    it('uses custom testId when provided', () => {
      render(<ToastContainer testId="custom-container" />);

      expect(screen.getByTestId('custom-container')).toBeInTheDocument();
    });

    it('renders screen reader live region', () => {
      render(<ToastContainer />);

      const liveRegion = document.querySelector('.toast-sr-only');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('role', 'status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('position variants', () => {
    it('applies top-right position class by default', () => {
      render(<ToastContainer />);

      const container = screen.getByTestId('toast-container');
      expect(container).toHaveClass('toast-container--top-right');
    });

    it('applies top-left position class', () => {
      render(<ToastContainer position="top-left" />);

      const container = screen.getByTestId('toast-container');
      expect(container).toHaveClass('toast-container--top-left');
    });

    it('applies bottom-right position class', () => {
      render(<ToastContainer position="bottom-right" />);

      const container = screen.getByTestId('toast-container');
      expect(container).toHaveClass('toast-container--bottom-right');
    });

    it('applies bottom-left position class', () => {
      render(<ToastContainer position="bottom-left" />);

      const container = screen.getByTestId('toast-container');
      expect(container).toHaveClass('toast-container--bottom-left');
    });

    it('applies top-center position class', () => {
      render(<ToastContainer position="top-center" />);

      const container = screen.getByTestId('toast-container');
      expect(container).toHaveClass('toast-container--top-center');
    });

    it('applies bottom-center position class', () => {
      render(<ToastContainer position="bottom-center" />);

      const container = screen.getByTestId('toast-container');
      expect(container).toHaveClass('toast-container--bottom-center');
    });
  });

  describe('toast display', () => {
    it('renders no toasts when store is empty', () => {
      render(<ToastContainer />);

      const toasts = document.querySelectorAll('.toast');
      expect(toasts).toHaveLength(0);
    });

    it('renders toasts from store', () => {
      useToastStore.getState().addToast('First toast msg');
      useToastStore.getState().addToast('Second toast msg');

      render(<ToastContainer />);

      // Query within toast messages only to avoid matching the screen reader live region
      const messages = document.querySelectorAll('.toast__message');
      const messageTexts = Array.from(messages).map(m => m.textContent);
      expect(messageTexts).toContain('First toast msg');
      expect(messageTexts).toContain('Second toast msg');
    });

    it('renders toasts with correct types', () => {
      useToastStore.getState().success('Success toast');
      useToastStore.getState().error('Error toast');
      useToastStore.getState().warning('Warning toast');
      useToastStore.getState().info('Info toast');

      render(<ToastContainer />);

      const toasts = document.querySelectorAll('.toast');
      expect(toasts).toHaveLength(4);

      expect(toasts[0]).toHaveClass('toast--success');
      expect(toasts[1]).toHaveClass('toast--error');
      expect(toasts[2]).toHaveClass('toast--warning');
      expect(toasts[3]).toHaveClass('toast--info');
    });
  });

  describe('toast dismissal', () => {
    it('removes toast when dismiss is clicked', () => {
      const id = useToastStore.getState().addToast('Dismissable toast msg');

      render(<ToastContainer />);

      // Query within toast messages only
      let messages = document.querySelectorAll('.toast__message');
      let messageTexts = Array.from(messages).map(m => m.textContent);
      expect(messageTexts).toContain('Dismissable toast msg');

      const dismissButton = screen.getByTestId(`toast-dismiss-${id}`);
      fireEvent.click(dismissButton);

      messages = document.querySelectorAll('.toast__message');
      messageTexts = Array.from(messages).map(m => m.textContent);
      expect(messageTexts).not.toContain('Dismissable toast msg');
    });
  });

  describe('multiple toasts', () => {
    it('stacks multiple toasts', () => {
      useToastStore.getState().addToast('First');
      useToastStore.getState().addToast('Second');
      useToastStore.getState().addToast('Third');

      render(<ToastContainer />);

      const toasts = document.querySelectorAll('.toast');
      expect(toasts).toHaveLength(3);
    });

    it('renders toasts in order (oldest first in DOM)', () => {
      useToastStore.getState().addToast('First');
      useToastStore.getState().addToast('Second');
      useToastStore.getState().addToast('Third');

      render(<ToastContainer />);

      const toasts = document.querySelectorAll('.toast__message');
      expect(toasts[0].textContent).toBe('First');
      expect(toasts[1].textContent).toBe('Second');
      expect(toasts[2].textContent).toBe('Third');
    });
  });

  describe('screen reader announcements', () => {
    it('updates live region with latest toast message', () => {
      const { rerender } = render(<ToastContainer />);

      useToastStore.getState().addToast('New notification');

      rerender(<ToastContainer />);

      const liveRegion = document.querySelector('.toast-sr-only');
      expect(liveRegion?.textContent).toBe('New notification');
    });
  });
});

describe('Toast and ToastContainer integration', () => {
  beforeEach(() => {
    useToastStore.getState().reset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('shows and auto-dismisses toast after duration', () => {
    useToastStore.getState().addToast('Auto dismiss msg', { duration: 3000 });

    const { rerender } = render(<ToastContainer />);

    // Query within toast messages only
    let messages = document.querySelectorAll('.toast__message');
    expect(Array.from(messages).map(m => m.textContent)).toContain('Auto dismiss msg');

    vi.advanceTimersByTime(3000);

    // Force rerender after timer fires
    rerender(<ToastContainer />);

    messages = document.querySelectorAll('.toast__message');
    expect(Array.from(messages).map(m => m.textContent)).not.toContain('Auto dismiss msg');
  });

  it('handles rapid add and remove operations', () => {
    // Add toasts before rendering
    const id1 = useToastStore.getState().addToast('First rapid');
    const id2 = useToastStore.getState().addToast('Second rapid');

    const { rerender } = render(<ToastContainer />);

    let messages = document.querySelectorAll('.toast__message');
    let messageTexts = Array.from(messages).map(m => m.textContent);
    expect(messageTexts).toContain('First rapid');
    expect(messageTexts).toContain('Second rapid');

    useToastStore.getState().removeToast(id1);
    rerender(<ToastContainer />);

    messages = document.querySelectorAll('.toast__message');
    messageTexts = Array.from(messages).map(m => m.textContent);
    expect(messageTexts).not.toContain('First rapid');
    expect(messageTexts).toContain('Second rapid');

    useToastStore.getState().removeToast(id2);
    rerender(<ToastContainer />);

    messages = document.querySelectorAll('.toast__message');
    messageTexts = Array.from(messages).map(m => m.textContent);
    expect(messageTexts).not.toContain('Second rapid');
  });

  it('clears all toasts', () => {
    useToastStore.getState().addToast('Clear first');
    useToastStore.getState().addToast('Clear second');
    useToastStore.getState().addToast('Clear third');

    const { rerender } = render(<ToastContainer />);

    expect(document.querySelectorAll('.toast')).toHaveLength(3);

    useToastStore.getState().clearAll();

    // Force a rerender to reflect the store change
    rerender(<ToastContainer />);

    expect(document.querySelectorAll('.toast')).toHaveLength(0);
  });

  it('respects max toasts limit in display', () => {
    useToastStore.getState().setMaxToasts(2);

    useToastStore.getState().addToast('First max test');
    useToastStore.getState().addToast('Second max test');
    useToastStore.getState().addToast('Third max test');

    render(<ToastContainer />);

    const toasts = document.querySelectorAll('.toast');
    expect(toasts).toHaveLength(2);

    // Should show the most recent toasts (query within toast messages only)
    const messages = document.querySelectorAll('.toast__message');
    const messageTexts = Array.from(messages).map(m => m.textContent);
    expect(messageTexts).not.toContain('First max test');
    expect(messageTexts).toContain('Second max test');
    expect(messageTexts).toContain('Third max test');
  });
});
