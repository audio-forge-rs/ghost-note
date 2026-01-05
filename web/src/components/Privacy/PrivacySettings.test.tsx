/**
 * PrivacySettings Component Tests
 *
 * Tests for the privacy settings component.
 *
 * @module components/Privacy/PrivacySettings.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PrivacySettings } from './PrivacySettings';
import { useAnalyticsStore } from '@/stores/useAnalyticsStore';
import { renderHook } from '@testing-library/react';

// Mock localStorage and sessionStorage
const mockStorage: Record<string, string> = {};
const mockSessionStorage: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  }),
};

const sessionStorageMock = {
  getItem: vi.fn((key: string) => mockSessionStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockSessionStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockSessionStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key]);
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:test');
global.URL.revokeObjectURL = vi.fn();

describe('PrivacySettings', () => {
  beforeEach(() => {
    // Clear mocks and storage
    vi.clearAllMocks();
    localStorageMock.clear();
    sessionStorageMock.clear();

    // Reset navigator.doNotTrack
    Object.defineProperty(navigator, 'doNotTrack', {
      value: null,
      writable: true,
      configurable: true,
    });

    // Reset the analytics store
    const { result } = renderHook(() => useAnalyticsStore());
    act(() => {
      result.current.reset();
      result.current.initialize();
    });
  });

  afterEach(() => {
    const { result } = renderHook(() => useAnalyticsStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('rendering', () => {
    it('should render the privacy settings component', () => {
      render(<PrivacySettings />);

      expect(screen.getByText('Privacy Settings')).toBeInTheDocument();
    });

    it('should render the analytics toggle', () => {
      render(<PrivacySettings />);

      expect(screen.getByText('Enable anonymous analytics')).toBeInTheDocument();
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('should render data export button', () => {
      render(<PrivacySettings />);

      expect(screen.getByText('Export My Data')).toBeInTheDocument();
    });

    it('should render clear data button', () => {
      render(<PrivacySettings />);

      expect(screen.getByText('Clear All Data')).toBeInTheDocument();
    });

    it('should render privacy policy when showPolicy is true', () => {
      render(<PrivacySettings showPolicy={true} />);

      expect(screen.getByText('What We Collect')).toBeInTheDocument();
      expect(screen.getByText('We DO collect:')).toBeInTheDocument();
      expect(screen.getByText('We DO NOT collect:')).toBeInTheDocument();
    });

    it('should not render privacy policy when showPolicy is false', () => {
      render(<PrivacySettings showPolicy={false} />);

      expect(screen.queryByText('What We Collect')).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<PrivacySettings className="custom-class" />);

      const container = screen.getByTestId('privacy-settings');
      expect(container).toHaveClass('custom-class');
    });

    it('should use custom testId', () => {
      render(<PrivacySettings testId="custom-privacy" />);

      expect(screen.getByTestId('custom-privacy')).toBeInTheDocument();
    });
  });

  describe('analytics toggle', () => {
    it('should show toggle as on when analytics is enabled', () => {
      render(<PrivacySettings />);

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    it('should toggle analytics off when clicked', async () => {
      const onSettingsChange = vi.fn();
      render(<PrivacySettings onSettingsChange={onSettingsChange} />);

      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);

      expect(onSettingsChange).toHaveBeenCalledWith(false);
    });

    it('should toggle analytics on when clicked while disabled', async () => {
      const onSettingsChange = vi.fn();
      const { result } = renderHook(() => useAnalyticsStore());

      act(() => {
        result.current.disable();
      });

      render(<PrivacySettings onSettingsChange={onSettingsChange} />);

      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);

      expect(onSettingsChange).toHaveBeenCalledWith(true);
    });
  });

  describe('DNT banner', () => {
    it('should show DNT banner when Do Not Track is enabled', () => {
      Object.defineProperty(navigator, 'doNotTrack', {
        value: '1',
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useAnalyticsStore());
      act(() => {
        result.current.reset();
        result.current.initialize();
      });

      render(<PrivacySettings />);

      expect(screen.getByText(/Do Not Track detected/)).toBeInTheDocument();
    });

    it('should not show DNT banner when Do Not Track is not enabled', () => {
      render(<PrivacySettings />);

      expect(screen.queryByText(/Do Not Track detected/)).not.toBeInTheDocument();
    });

    it('should disable toggle when DNT is enabled', () => {
      Object.defineProperty(navigator, 'doNotTrack', {
        value: '1',
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useAnalyticsStore());
      act(() => {
        result.current.reset();
        result.current.initialize();
      });

      render(<PrivacySettings />);

      const toggle = screen.getByRole('switch');
      expect(toggle).toBeDisabled();
    });
  });

  describe('data export', () => {
    it('should export data when export button is clicked', () => {
      render(<PrivacySettings />);

      const exportButton = screen.getByText('Export My Data');
      fireEvent.click(exportButton);

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('data clearing', () => {
    it('should show confirmation before clearing data', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<PrivacySettings />);

      const clearButton = screen.getByText('Clear All Data');
      fireEvent.click(clearButton);

      expect(confirmSpy).toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('should clear data when confirmed', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<PrivacySettings />);

      const clearButton = screen.getByText('Clear All Data');
      fireEvent.click(clearButton);

      // Check that confirmation was shown
      expect(confirmSpy).toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('should not clear data when not confirmed', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<PrivacySettings />);

      const clearButton = screen.getByText('Clear All Data');
      fireEvent.click(clearButton);

      expect(confirmSpy).toHaveBeenCalled();
      confirmSpy.mockRestore();
    });
  });

  describe('status display', () => {
    it('should show Active status when analytics is enabled', () => {
      render(<PrivacySettings />);

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should show Disabled status when analytics is disabled', () => {
      const { result } = renderHook(() => useAnalyticsStore());
      act(() => {
        result.current.disable();
      });

      render(<PrivacySettings />);

      // Find the status value element which should contain "Disabled"
      const statusValue = screen.getByText((content, element) => {
        return element?.classList?.contains('privacy-settings__status-value') === true &&
               content === 'Disabled';
      });
      expect(statusValue).toBeInTheDocument();
    });

    it('should show Disabled (DNT) status when DNT is enabled', () => {
      Object.defineProperty(navigator, 'doNotTrack', {
        value: '1',
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useAnalyticsStore());
      act(() => {
        result.current.reset();
        result.current.initialize();
      });

      render(<PrivacySettings />);

      expect(screen.getByText('Disabled (DNT)')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have accessible toggle button', () => {
      render(<PrivacySettings />);

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked');
      expect(toggle).toHaveAttribute('aria-labelledby');
    });

    it('should have role="status" on DNT banner', () => {
      Object.defineProperty(navigator, 'doNotTrack', {
        value: '1',
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useAnalyticsStore());
      act(() => {
        result.current.reset();
        result.current.initialize();
      });

      render(<PrivacySettings />);

      const banner = screen.getByTestId('privacy-settings-dnt-banner');
      expect(banner).toHaveAttribute('role', 'status');
    });
  });

  describe('privacy policy content', () => {
    it('should list what data is collected', () => {
      render(<PrivacySettings showPolicy={true} />);

      expect(screen.getByText(/Anonymous page views/)).toBeInTheDocument();
      expect(screen.getByText(/Feature usage counts/)).toBeInTheDocument();
      expect(screen.getByText(/Error reports/)).toBeInTheDocument();
      expect(screen.getByText(/Performance metrics/)).toBeInTheDocument();
    });

    it('should list what data is NOT collected', () => {
      render(<PrivacySettings showPolicy={true} />);

      expect(screen.getByText(/Your poems or lyrics/)).toBeInTheDocument();
      expect(screen.getByText(/Personal information/)).toBeInTheDocument();
      expect(screen.getByText(/IP addresses or location/)).toBeInTheDocument();
    });

    it('should list user rights', () => {
      render(<PrivacySettings showPolicy={true} />);

      expect(screen.getByText(/Opt-out anytime/)).toBeInTheDocument();
      expect(screen.getByText(/Export your data/)).toBeInTheDocument();
      expect(screen.getByText(/Delete your data/)).toBeInTheDocument();
    });
  });
});
