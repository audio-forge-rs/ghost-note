/**
 * MicrophoneSelect Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MicrophoneSelect } from './MicrophoneSelect';

// Mock the microphone module
vi.mock('@/lib/audio/microphone', () => ({
  getMicrophoneDevices: vi.fn(),
  onDeviceChange: vi.fn(() => vi.fn()),
  isDeviceEnumerationSupported: vi.fn(() => true),
}));

import { getMicrophoneDevices, onDeviceChange, isDeviceEnumerationSupported } from '@/lib/audio/microphone';

const mockGetMicrophoneDevices = getMicrophoneDevices as ReturnType<typeof vi.fn>;
const mockOnDeviceChange = onDeviceChange as ReturnType<typeof vi.fn>;
const mockIsDeviceEnumerationSupported = isDeviceEnumerationSupported as ReturnType<typeof vi.fn>;

describe('MicrophoneSelect', () => {
  const mockDevices = [
    { deviceId: 'device-1', label: 'Built-in Microphone', groupId: 'g1', isDefault: true },
    { deviceId: 'device-2', label: 'USB Microphone', groupId: 'g2', isDefault: false },
    { deviceId: 'device-3', label: 'Headset Microphone', groupId: 'g3', isDefault: false },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMicrophoneDevices.mockResolvedValue(mockDevices);
    mockIsDeviceEnumerationSupported.mockReturnValue(true);
    mockOnDeviceChange.mockImplementation(() => vi.fn());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should show loading state initially', () => {
      render(<MicrophoneSelect />);

      expect(screen.getByTestId('microphone-select-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading devices...')).toBeInTheDocument();
    });

    it('should render device list after loading', async () => {
      render(<MicrophoneSelect />);

      await waitFor(() => {
        expect(screen.getByTestId('microphone-select')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();

      // All devices should be rendered as options
      expect(screen.getByText('Built-in Microphone (Default)')).toBeInTheDocument();
      expect(screen.getByText('USB Microphone')).toBeInTheDocument();
      expect(screen.getByText('Headset Microphone')).toBeInTheDocument();
    });

    it('should show placeholder when no device is selected', async () => {
      render(<MicrophoneSelect placeholder="Choose a mic..." />);

      await waitFor(() => {
        expect(screen.getByTestId('microphone-select')).toBeInTheDocument();
      });

      expect(screen.getByText('Choose a mic...')).toBeInTheDocument();
    });

    it('should show empty state when no devices found', async () => {
      mockGetMicrophoneDevices.mockResolvedValue([]);

      render(<MicrophoneSelect />);

      await waitFor(() => {
        expect(screen.getByTestId('microphone-select-empty')).toBeInTheDocument();
      });

      expect(screen.getByText('No microphones found')).toBeInTheDocument();
    });

    it('should show error state when device enumeration not supported', async () => {
      mockIsDeviceEnumerationSupported.mockReturnValue(false);

      render(<MicrophoneSelect />);

      await waitFor(() => {
        expect(screen.getByTestId('microphone-select-error')).toBeInTheDocument();
      });

      expect(screen.getByText('Device enumeration is not supported in this browser')).toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('should call onDeviceChange when selection changes', async () => {
      const handleChange = vi.fn();

      render(<MicrophoneSelect onDeviceChange={handleChange} />);

      await waitFor(() => {
        expect(screen.getByTestId('microphone-select')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'device-2' } });

      expect(handleChange).toHaveBeenCalledWith('device-2');
    });

    it('should auto-select default device when no device is selected', async () => {
      const handleChange = vi.fn();

      render(<MicrophoneSelect onDeviceChange={handleChange} />);

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith('device-1');
      });
    });

    it('should not auto-select if device is already selected', async () => {
      const handleChange = vi.fn();

      render(<MicrophoneSelect selectedDeviceId="device-2" onDeviceChange={handleChange} />);

      await waitFor(() => {
        expect(screen.getByTestId('microphone-select')).toBeInTheDocument();
      });

      // Should not call onDeviceChange since we already have a selected device
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should show selected device value', async () => {
      render(<MicrophoneSelect selectedDeviceId="device-2" />);

      await waitFor(() => {
        expect(screen.getByTestId('microphone-select')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('device-2');
    });
  });

  describe('Disabled State', () => {
    it('should disable select when disabled prop is true', async () => {
      render(<MicrophoneSelect disabled />);

      await waitFor(() => {
        expect(screen.getByTestId('microphone-select')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });
  });

  describe('Device Change Listener', () => {
    it('should set up device change listener on mount', async () => {
      render(<MicrophoneSelect />);

      await waitFor(() => {
        expect(mockOnDeviceChange).toHaveBeenCalled();
      });
    });

    it('should refresh devices when device change is detected', async () => {
      let deviceChangeCallback: () => void = () => {};

      mockOnDeviceChange.mockImplementation((callback) => {
        deviceChangeCallback = callback;
        return vi.fn();
      });

      render(<MicrophoneSelect />);

      await waitFor(() => {
        expect(screen.getByTestId('microphone-select')).toBeInTheDocument();
      });

      expect(mockGetMicrophoneDevices).toHaveBeenCalledTimes(1);

      // Simulate device change
      const newDevices = [
        { deviceId: 'device-new', label: 'New Microphone', groupId: 'gn', isDefault: true },
      ];
      mockGetMicrophoneDevices.mockResolvedValue(newDevices);

      deviceChangeCallback();

      await waitFor(() => {
        expect(mockGetMicrophoneDevices).toHaveBeenCalledTimes(2);
      });
    });

    it('should clean up device change listener on unmount', async () => {
      const unsubscribe = vi.fn();
      mockOnDeviceChange.mockReturnValue(unsubscribe);

      const { unmount } = render(<MicrophoneSelect />);

      await waitFor(() => {
        expect(mockOnDeviceChange).toHaveBeenCalled();
      });

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Permission Changes', () => {
    it('should refresh devices when permission changes', async () => {
      const { rerender } = render(<MicrophoneSelect hasPermission={false} />);

      await waitFor(() => {
        expect(screen.getByTestId('microphone-select')).toBeInTheDocument();
      });

      expect(mockGetMicrophoneDevices).toHaveBeenCalledTimes(1);

      // Simulate permission granted
      rerender(<MicrophoneSelect hasPermission={true} />);

      await waitFor(() => {
        expect(mockGetMicrophoneDevices).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Label Formatting', () => {
    it('should show default indicator for default device', async () => {
      render(<MicrophoneSelect />);

      await waitFor(() => {
        expect(screen.getByTestId('microphone-select')).toBeInTheDocument();
      });

      expect(screen.getByText('Built-in Microphone (Default)')).toBeInTheDocument();
    });

    it('should not duplicate default indicator if already in label', async () => {
      const devicesWithDefault = [
        { deviceId: 'device-1', label: 'Default Microphone', groupId: 'g1', isDefault: true },
      ];
      mockGetMicrophoneDevices.mockResolvedValue(devicesWithDefault);

      render(<MicrophoneSelect />);

      await waitFor(() => {
        expect(screen.getByTestId('microphone-select')).toBeInTheDocument();
      });

      // Should not say "Default Microphone (Default)"
      expect(screen.getByText('Default Microphone')).toBeInTheDocument();
      expect(screen.queryByText('Default Microphone (Default)')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label', async () => {
      render(<MicrophoneSelect aria-label="Choose microphone" />);

      await waitFor(() => {
        expect(screen.getByTestId('microphone-select')).toBeInTheDocument();
      });

      expect(screen.getByRole('combobox')).toHaveAttribute('aria-label', 'Choose microphone');
    });

    it('should use default aria-label', async () => {
      render(<MicrophoneSelect />);

      await waitFor(() => {
        expect(screen.getByTestId('microphone-select')).toBeInTheDocument();
      });

      expect(screen.getByRole('combobox')).toHaveAttribute('aria-label', 'Select microphone');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', async () => {
      render(<MicrophoneSelect className="custom-class" />);

      await waitFor(() => {
        expect(screen.getByTestId('microphone-select')).toBeInTheDocument();
      });

      expect(screen.getByTestId('microphone-select')).toHaveClass('custom-class');
    });

    it('should apply custom style', async () => {
      render(<MicrophoneSelect style={{ width: '300px' }} />);

      await waitFor(() => {
        expect(screen.getByTestId('microphone-select')).toBeInTheDocument();
      });

      expect(screen.getByTestId('microphone-select')).toHaveStyle({ width: '300px' });
    });
  });
});
