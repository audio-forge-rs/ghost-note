/**
 * MicrophoneSelect Component
 *
 * A dropdown component for selecting audio input devices (microphones).
 * Automatically refreshes device list when devices are added or removed.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getMicrophoneDevices,
  onDeviceChange,
  isDeviceEnumerationSupported,
  type AudioDeviceInfo,
} from '@/lib/audio/microphone';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[MicrophoneSelect] ${message}`, ...args);
  }
};

/**
 * Props for MicrophoneSelect component
 */
export interface MicrophoneSelectProps {
  /** Currently selected device ID */
  selectedDeviceId?: string;
  /** Callback when device selection changes */
  onDeviceChange?: (deviceId: string) => void;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Custom CSS class name */
  className?: string;
  /** Whether permission has been granted (affects label visibility) */
  hasPermission?: boolean;
  /** Placeholder text when no device is selected */
  placeholder?: string;
  /** Custom styling for the select element */
  style?: React.CSSProperties;
  /** Label for accessibility */
  'aria-label'?: string;
}

/**
 * MicrophoneSelect renders a dropdown for selecting audio input devices.
 *
 * Features:
 * - Lists all available microphones
 * - Automatically refreshes when devices change
 * - Shows "Microphone 1", "Microphone 2", etc. when labels are unavailable
 * - Indicates the default device
 *
 * @example
 * ```tsx
 * <MicrophoneSelect
 *   selectedDeviceId={deviceId}
 *   onDeviceChange={(id) => setDeviceId(id)}
 *   hasPermission={hasPermission}
 * />
 * ```
 */
export function MicrophoneSelect({
  selectedDeviceId,
  onDeviceChange: onDeviceChangeCallback,
  disabled = false,
  className = '',
  hasPermission = false,
  placeholder = 'Select microphone...',
  style,
  'aria-label': ariaLabel = 'Select microphone',
}: MicrophoneSelectProps): React.ReactElement {
  const [devices, setDevices] = useState<AudioDeviceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  // Fetch devices
  const fetchDevices = useCallback(async () => {
    log('Fetching devices...');
    setIsLoading(true);
    setError(null);

    try {
      if (!isDeviceEnumerationSupported()) {
        setError('Device enumeration is not supported in this browser');
        setDevices([]);
        return;
      }

      const deviceList = await getMicrophoneDevices();

      if (isMounted.current) {
        log('Devices fetched:', deviceList.length);
        setDevices(deviceList);

        // If no device is selected and we have devices, select the default
        if (!selectedDeviceId && deviceList.length > 0 && onDeviceChangeCallback) {
          const defaultDevice = deviceList.find((d) => d.isDefault) || deviceList[0];
          log('Auto-selecting default device:', defaultDevice.deviceId);
          onDeviceChangeCallback(defaultDevice.deviceId);
        }
      }
    } catch (err) {
      log('Error fetching devices:', err);
      if (isMounted.current) {
        setError('Failed to get microphone list');
        setDevices([]);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [selectedDeviceId, onDeviceChangeCallback]);

  // Fetch devices on mount and when permission changes
  useEffect(() => {
    isMounted.current = true;
    fetchDevices();

    return () => {
      isMounted.current = false;
    };
  }, [fetchDevices, hasPermission]);

  // Listen for device changes
  useEffect(() => {
    const unsubscribe = onDeviceChange(() => {
      log('Device change detected, refreshing...');
      fetchDevices();
    });

    return unsubscribe;
  }, [fetchDevices]);

  // Handle selection change
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newDeviceId = event.target.value;
    log('Device selected:', newDeviceId);
    onDeviceChangeCallback?.(newDeviceId);
  };

  // Format device label for display
  const formatDeviceLabel = (device: AudioDeviceInfo): string => {
    let label = device.label;

    // If label is empty or generic, use a more descriptive name
    if (!label || label === 'Default' || label.startsWith('audioinput')) {
      label = device.isDefault ? 'Default Microphone' : `Microphone`;
    }

    // Add default indicator if this is the default device
    if (device.isDefault && !label.includes('Default')) {
      label = `${label} (Default)`;
    }

    return label;
  };

  // Render loading state
  if (isLoading) {
    return (
      <div
        className={`microphone-select microphone-select--loading ${className}`.trim()}
        style={style}
        data-testid="microphone-select-loading"
      >
        <select disabled aria-label={ariaLabel}>
          <option>Loading devices...</option>
        </select>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div
        className={`microphone-select microphone-select--error ${className}`.trim()}
        style={style}
        data-testid="microphone-select-error"
      >
        <select disabled aria-label={ariaLabel}>
          <option>{error}</option>
        </select>
      </div>
    );
  }

  // Render no devices state
  if (devices.length === 0) {
    return (
      <div
        className={`microphone-select microphone-select--empty ${className}`.trim()}
        style={style}
        data-testid="microphone-select-empty"
      >
        <select disabled aria-label={ariaLabel}>
          <option>No microphones found</option>
        </select>
      </div>
    );
  }

  // Render normal state
  return (
    <div
      className={`microphone-select ${className}`.trim()}
      style={style}
      data-testid="microphone-select"
    >
      <select
        value={selectedDeviceId || ''}
        onChange={handleChange}
        disabled={disabled}
        aria-label={ariaLabel}
        className="microphone-select__dropdown"
      >
        {!selectedDeviceId && <option value="">{placeholder}</option>}
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {formatDeviceLabel(device)}
          </option>
        ))}
      </select>
    </div>
  );
}

export default MicrophoneSelect;
