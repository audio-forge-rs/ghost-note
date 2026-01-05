/**
 * Tests for OfflineIndicator Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  OfflineIndicator,
  OfflineBanner,
  UpdatePrompt,
  OfflineReadyNotification,
} from './OfflineIndicator';

// Mock the useOfflineStatus hook
vi.mock('@/hooks', () => ({
  useOfflineStatus: vi.fn(() => ({
    isOnline: true,
    isOfflineReady: false,
    needsUpdate: false,
    isServiceWorkerActive: false,
    serviceWorkerError: null,
    updateApp: vi.fn(),
    dismissUpdate: vi.fn(),
    checkOnlineStatus: vi.fn(() => true),
  })),
}));

// Import the mocked hook to manipulate it in tests
import { useOfflineStatus } from '@/hooks';
const mockUseOfflineStatus = vi.mocked(useOfflineStatus);

describe('OfflineBanner', () => {
  it('renders with default message', () => {
    render(<OfflineBanner />);

    expect(screen.getByText(/You're offline/i)).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<OfflineBanner message="Custom offline message" />);

    expect(screen.getByText('Custom offline message')).toBeInTheDocument();
  });

  it('has correct role for accessibility', () => {
    render(<OfflineBanner />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('has assertive aria-live for important notification', () => {
    render(<OfflineBanner />);

    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
  });

  it('renders with test ID', () => {
    render(<OfflineBanner testId="custom-offline-banner" />);

    expect(screen.getByTestId('custom-offline-banner')).toBeInTheDocument();
  });
});

describe('UpdatePrompt', () => {
  const onUpdate = vi.fn();
  const onDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders update message', () => {
    render(<UpdatePrompt onUpdate={onUpdate} onDismiss={onDismiss} />);

    expect(screen.getByText(/New version available/i)).toBeInTheDocument();
  });

  it('calls onUpdate when update button is clicked', () => {
    render(<UpdatePrompt onUpdate={onUpdate} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByTestId('update-prompt-update-button'));

    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    render(<UpdatePrompt onUpdate={onUpdate} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByTestId('update-prompt-dismiss-button'));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('has correct role for accessibility', () => {
    render(<UpdatePrompt onUpdate={onUpdate} onDismiss={onDismiss} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders with test ID', () => {
    render(<UpdatePrompt onUpdate={onUpdate} onDismiss={onDismiss} testId="custom-update-prompt" />);

    expect(screen.getByTestId('custom-update-prompt')).toBeInTheDocument();
    expect(screen.getByTestId('custom-update-prompt-update-button')).toBeInTheDocument();
    expect(screen.getByTestId('custom-update-prompt-dismiss-button')).toBeInTheDocument();
  });
});

describe('OfflineReadyNotification', () => {
  it('renders offline ready message', () => {
    render(<OfflineReadyNotification />);

    expect(screen.getByText(/App ready for offline use/i)).toBeInTheDocument();
  });

  it('has correct role for accessibility', () => {
    render(<OfflineReadyNotification />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has polite aria-live for non-critical notification', () => {
    render(<OfflineReadyNotification />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('renders with test ID', () => {
    render(<OfflineReadyNotification testId="custom-offline-ready" />);

    expect(screen.getByTestId('custom-offline-ready')).toBeInTheDocument();
  });
});

describe('OfflineIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when online and no updates', () => {
    mockUseOfflineStatus.mockReturnValue({
      isOnline: true,
      isOfflineReady: false,
      needsUpdate: false,
      isServiceWorkerActive: false,
      serviceWorkerError: null,
      updateApp: vi.fn(),
      dismissUpdate: vi.fn(),
      checkOnlineStatus: vi.fn(() => true),
    });

    const { container } = render(<OfflineIndicator />);

    expect(container.firstChild).toBeNull();
  });

  it('shows offline banner when offline', () => {
    mockUseOfflineStatus.mockReturnValue({
      isOnline: false,
      isOfflineReady: false,
      needsUpdate: false,
      isServiceWorkerActive: false,
      serviceWorkerError: null,
      updateApp: vi.fn(),
      dismissUpdate: vi.fn(),
      checkOnlineStatus: vi.fn(() => false),
    });

    render(<OfflineIndicator />);

    expect(screen.getByText(/You're offline/i)).toBeInTheDocument();
  });

  it('shows update prompt when update is available', () => {
    mockUseOfflineStatus.mockReturnValue({
      isOnline: true,
      isOfflineReady: false,
      needsUpdate: true,
      isServiceWorkerActive: true,
      serviceWorkerError: null,
      updateApp: vi.fn(),
      dismissUpdate: vi.fn(),
      checkOnlineStatus: vi.fn(() => true),
    });

    render(<OfflineIndicator />);

    expect(screen.getByText(/New version available/i)).toBeInTheDocument();
  });

  it('calls updateApp when update button is clicked', () => {
    const updateApp = vi.fn();
    mockUseOfflineStatus.mockReturnValue({
      isOnline: true,
      isOfflineReady: false,
      needsUpdate: true,
      isServiceWorkerActive: true,
      serviceWorkerError: null,
      updateApp,
      dismissUpdate: vi.fn(),
      checkOnlineStatus: vi.fn(() => true),
    });

    render(<OfflineIndicator />);
    fireEvent.click(screen.getByTestId('update-prompt-update-button'));

    expect(updateApp).toHaveBeenCalledTimes(1);
  });

  it('calls dismissUpdate when dismiss button is clicked', () => {
    const dismissUpdate = vi.fn();
    mockUseOfflineStatus.mockReturnValue({
      isOnline: true,
      isOfflineReady: false,
      needsUpdate: true,
      isServiceWorkerActive: true,
      serviceWorkerError: null,
      updateApp: vi.fn(),
      dismissUpdate,
      checkOnlineStatus: vi.fn(() => true),
    });

    render(<OfflineIndicator />);
    fireEvent.click(screen.getByTestId('update-prompt-dismiss-button'));

    expect(dismissUpdate).toHaveBeenCalledTimes(1);
  });

  it('prioritizes offline banner over update prompt', () => {
    mockUseOfflineStatus.mockReturnValue({
      isOnline: false,
      isOfflineReady: false,
      needsUpdate: true,
      isServiceWorkerActive: true,
      serviceWorkerError: null,
      updateApp: vi.fn(),
      dismissUpdate: vi.fn(),
      checkOnlineStatus: vi.fn(() => false),
    });

    render(<OfflineIndicator />);

    expect(screen.getByText(/You're offline/i)).toBeInTheDocument();
    expect(screen.queryByText(/New version available/i)).not.toBeInTheDocument();
  });

  it('applies top position class', () => {
    mockUseOfflineStatus.mockReturnValue({
      isOnline: false,
      isOfflineReady: false,
      needsUpdate: false,
      isServiceWorkerActive: false,
      serviceWorkerError: null,
      updateApp: vi.fn(),
      dismissUpdate: vi.fn(),
      checkOnlineStatus: vi.fn(() => false),
    });

    render(<OfflineIndicator position="top" />);

    expect(screen.getByTestId('offline-indicator-container')).toHaveClass('offline-indicator-container--top');
  });

  it('applies bottom position class', () => {
    mockUseOfflineStatus.mockReturnValue({
      isOnline: false,
      isOfflineReady: false,
      needsUpdate: false,
      isServiceWorkerActive: false,
      serviceWorkerError: null,
      updateApp: vi.fn(),
      dismissUpdate: vi.fn(),
      checkOnlineStatus: vi.fn(() => false),
    });

    render(<OfflineIndicator position="bottom" />);

    expect(screen.getByTestId('offline-indicator-container')).toHaveClass('offline-indicator-container--bottom');
  });

  it('applies custom className', () => {
    mockUseOfflineStatus.mockReturnValue({
      isOnline: false,
      isOfflineReady: false,
      needsUpdate: false,
      isServiceWorkerActive: false,
      serviceWorkerError: null,
      updateApp: vi.fn(),
      dismissUpdate: vi.fn(),
      checkOnlineStatus: vi.fn(() => false),
    });

    render(<OfflineIndicator className="custom-class" />);

    expect(screen.getByTestId('offline-indicator-container')).toHaveClass('custom-class');
  });

  it('renders with custom test ID', () => {
    mockUseOfflineStatus.mockReturnValue({
      isOnline: false,
      isOfflineReady: false,
      needsUpdate: false,
      isServiceWorkerActive: false,
      serviceWorkerError: null,
      updateApp: vi.fn(),
      dismissUpdate: vi.fn(),
      checkOnlineStatus: vi.fn(() => false),
    });

    render(<OfflineIndicator testId="custom-container" />);

    expect(screen.getByTestId('custom-container')).toBeInTheDocument();
  });
});
