/**
 * PermissionPrompt Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PermissionPrompt } from './PermissionPrompt';

// Mock the microphone module
vi.mock('@/lib/audio/microphone', () => ({
  queryMicrophonePermission: vi.fn(),
  requestMicrophoneAccess: vi.fn(),
  stopMediaStream: vi.fn(),
  isMicrophoneSupported: vi.fn(),
}));

import {
  queryMicrophonePermission,
  requestMicrophoneAccess,
  stopMediaStream,
  isMicrophoneSupported,
} from '@/lib/audio/microphone';

const mockQueryMicrophonePermission = queryMicrophonePermission as ReturnType<typeof vi.fn>;
const mockRequestMicrophoneAccess = requestMicrophoneAccess as ReturnType<typeof vi.fn>;
const mockStopMediaStream = stopMediaStream as ReturnType<typeof vi.fn>;
const mockIsMicrophoneSupported = isMicrophoneSupported as ReturnType<typeof vi.fn>;

// Mock MediaStream
class MockMediaStream {
  getTracks() {
    return [{ stop: vi.fn() }];
  }
}

describe('PermissionPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsMicrophoneSupported.mockReturnValue(true);
    mockQueryMicrophonePermission.mockResolvedValue('prompt');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render prompt state by default', async () => {
      render(<PermissionPrompt />);

      await waitFor(() => {
        expect(screen.getByTestId('permission-prompt')).toBeInTheDocument();
      });

      expect(screen.getByText('Microphone Access Required')).toBeInTheDocument();
      expect(screen.getByText('Enable Microphone')).toBeInTheDocument();
    });

    it('should render with custom title and description', async () => {
      render(
        <PermissionPrompt
          title="Custom Title"
          description="Custom description text"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Custom Title')).toBeInTheDocument();
        expect(screen.getByText('Custom description text')).toBeInTheDocument();
      });
    });

    it('should render with custom button text', async () => {
      render(<PermissionPrompt buttonText="Allow Access" />);

      await waitFor(() => {
        expect(screen.getByText('Allow Access')).toBeInTheDocument();
      });
    });

    it('should render with card variant by default', async () => {
      render(<PermissionPrompt />);

      await waitFor(() => {
        expect(screen.getByTestId('permission-prompt')).toHaveClass('permission-prompt--card');
      });
    });

    it('should render with inline variant when specified', async () => {
      render(<PermissionPrompt variant="inline" />);

      await waitFor(() => {
        expect(screen.getByTestId('permission-prompt')).toHaveClass('permission-prompt--inline');
      });
    });

    it('should render with minimal variant when specified', async () => {
      render(<PermissionPrompt variant="minimal" />);

      await waitFor(() => {
        expect(screen.getByTestId('permission-prompt')).toHaveClass('permission-prompt--minimal');
      });
    });
  });

  describe('Unsupported State', () => {
    it('should render unsupported message when microphone is not supported', async () => {
      mockIsMicrophoneSupported.mockReturnValue(false);

      render(<PermissionPrompt />);

      await waitFor(() => {
        expect(screen.getByTestId('permission-prompt-unsupported')).toBeInTheDocument();
      });

      expect(screen.getByText('Browser Not Supported')).toBeInTheDocument();
    });
  });

  describe('Denied State', () => {
    it('should render denied state when permission is denied', async () => {
      mockQueryMicrophonePermission.mockResolvedValue('denied');
      mockRequestMicrophoneAccess.mockResolvedValue({
        success: false,
        stream: null,
        error: 'Permission denied',
        permissionState: 'denied',
      });

      render(<PermissionPrompt />);

      // First request permission to trigger the denied state
      await waitFor(() => {
        expect(screen.getByTestId('permission-prompt')).toBeInTheDocument();
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('permission-prompt-denied')).toBeInTheDocument();
      });

      expect(screen.getByText('Microphone Access Denied')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should show browser-specific instructions when denied', async () => {
      mockQueryMicrophonePermission.mockResolvedValue('denied');
      mockRequestMicrophoneAccess.mockResolvedValue({
        success: false,
        stream: null,
        error: 'Permission denied',
        permissionState: 'denied',
      });

      render(<PermissionPrompt />);

      await waitFor(() => {
        expect(screen.getByTestId('permission-prompt')).toBeInTheDocument();
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/To enable access:/)).toBeInTheDocument();
      });
    });
  });

  describe('Granted State', () => {
    it('should not render when permission is already granted', async () => {
      mockQueryMicrophonePermission.mockResolvedValue('granted');

      const { container } = render(<PermissionPrompt />);

      await waitFor(() => {
        expect(container).toBeEmptyDOMElement();
      });
    });
  });

  describe('Permission Request', () => {
    it('should request permission when button is clicked', async () => {
      mockRequestMicrophoneAccess.mockResolvedValue({
        success: true,
        stream: new MockMediaStream() as unknown as MediaStream,
        error: null,
        permissionState: 'granted',
      });

      render(<PermissionPrompt />);

      await waitFor(() => {
        expect(screen.getByTestId('permission-prompt')).toBeInTheDocument();
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockRequestMicrophoneAccess).toHaveBeenCalled();
      });
    });

    it('should show loading state during permission request', async () => {
      let resolveRequest: (value: unknown) => void;
      const requestPromise = new Promise((resolve) => {
        resolveRequest = resolve;
      });

      mockRequestMicrophoneAccess.mockReturnValue(requestPromise);

      render(<PermissionPrompt />);

      await waitFor(() => {
        expect(screen.getByTestId('permission-prompt')).toBeInTheDocument();
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Requesting Access...')).toBeInTheDocument();
      });

      // Resolve the request
      resolveRequest!({
        success: true,
        stream: new MockMediaStream(),
        error: null,
        permissionState: 'granted',
      });
    });

    it('should disable button during loading', async () => {
      let resolveRequest: (value: unknown) => void;
      const requestPromise = new Promise((resolve) => {
        resolveRequest = resolve;
      });

      mockRequestMicrophoneAccess.mockReturnValue(requestPromise);

      render(<PermissionPrompt />);

      await waitFor(() => {
        expect(screen.getByTestId('permission-prompt')).toBeInTheDocument();
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });

      // Resolve to clean up
      resolveRequest!({
        success: false,
        stream: null,
        error: 'Test',
        permissionState: 'prompt',
      });
    });
  });

  describe('Callbacks', () => {
    it('should call onPermissionGranted when permission is granted', async () => {
      const mockStream = new MockMediaStream() as unknown as MediaStream;
      mockRequestMicrophoneAccess.mockResolvedValue({
        success: true,
        stream: mockStream,
        error: null,
        permissionState: 'granted',
      });

      const handleGranted = vi.fn();

      render(<PermissionPrompt onPermissionGranted={handleGranted} />);

      await waitFor(() => {
        expect(screen.getByTestId('permission-prompt')).toBeInTheDocument();
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(handleGranted).toHaveBeenCalledWith(mockStream);
      });
    });

    it('should call onPermissionDenied when permission is denied', async () => {
      mockRequestMicrophoneAccess.mockResolvedValue({
        success: false,
        stream: null,
        error: 'User denied access',
        permissionState: 'denied',
      });

      const handleDenied = vi.fn();

      render(<PermissionPrompt onPermissionDenied={handleDenied} />);

      await waitFor(() => {
        expect(screen.getByTestId('permission-prompt')).toBeInTheDocument();
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(handleDenied).toHaveBeenCalledWith('User denied access');
      });
    });

    it('should call onPermissionChange when state changes', async () => {
      mockRequestMicrophoneAccess.mockResolvedValue({
        success: true,
        stream: new MockMediaStream() as unknown as MediaStream,
        error: null,
        permissionState: 'granted',
      });

      const handleChange = vi.fn();

      render(<PermissionPrompt onPermissionChange={handleChange} />);

      // Initial query
      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith('prompt');
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith('granted');
      });
    });
  });

  describe('Stream Handling', () => {
    it('should stop stream when keepStreamActive is false', async () => {
      const mockStream = new MockMediaStream() as unknown as MediaStream;
      mockRequestMicrophoneAccess.mockResolvedValue({
        success: true,
        stream: mockStream,
        error: null,
        permissionState: 'granted',
      });

      render(<PermissionPrompt keepStreamActive={false} />);

      await waitFor(() => {
        expect(screen.getByTestId('permission-prompt')).toBeInTheDocument();
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockStopMediaStream).toHaveBeenCalledWith(mockStream);
      });
    });

    it('should not stop stream when keepStreamActive is true', async () => {
      const mockStream = new MockMediaStream() as unknown as MediaStream;
      mockRequestMicrophoneAccess.mockResolvedValue({
        success: true,
        stream: mockStream,
        error: null,
        permissionState: 'granted',
      });

      render(<PermissionPrompt keepStreamActive={true} />);

      await waitFor(() => {
        expect(screen.getByTestId('permission-prompt')).toBeInTheDocument();
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockStopMediaStream).not.toHaveBeenCalled();
      });
    });
  });

  describe('Auto Request', () => {
    it('should automatically request permission when autoRequest is true', async () => {
      mockRequestMicrophoneAccess.mockResolvedValue({
        success: true,
        stream: new MockMediaStream() as unknown as MediaStream,
        error: null,
        permissionState: 'granted',
      });

      render(<PermissionPrompt autoRequest />);

      await waitFor(() => {
        expect(mockRequestMicrophoneAccess).toHaveBeenCalled();
      });
    });

    it('should not auto request if permission is already granted', async () => {
      mockQueryMicrophonePermission.mockResolvedValue('granted');

      render(<PermissionPrompt autoRequest />);

      await waitFor(() => {
        expect(mockRequestMicrophoneAccess).not.toHaveBeenCalled();
      });
    });
  });

  describe('Error Display', () => {
    it('should display error message from failed request', async () => {
      mockRequestMicrophoneAccess.mockResolvedValue({
        success: false,
        stream: null,
        error: 'Specific error message here',
        permissionState: 'denied',
      });

      render(<PermissionPrompt />);

      await waitFor(() => {
        expect(screen.getByTestId('permission-prompt')).toBeInTheDocument();
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Specific error message here')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper role attributes', async () => {
      render(<PermissionPrompt />);

      await waitFor(() => {
        expect(screen.getByRole('region')).toBeInTheDocument();
      });

      expect(screen.getByRole('region')).toHaveAttribute(
        'aria-label',
        'Microphone permission request'
      );
    });

    it('should have aria-busy on button during loading', async () => {
      let resolveRequest: (value: unknown) => void;
      const requestPromise = new Promise((resolve) => {
        resolveRequest = resolve;
      });

      mockRequestMicrophoneAccess.mockReturnValue(requestPromise);

      render(<PermissionPrompt />);

      await waitFor(() => {
        expect(screen.getByTestId('permission-prompt')).toBeInTheDocument();
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-busy', 'true');
      });

      // Resolve to clean up
      resolveRequest!({
        success: false,
        stream: null,
        error: 'Test',
        permissionState: 'prompt',
      });
    });

    it('should use role="alert" for error states', async () => {
      mockIsMicrophoneSupported.mockReturnValue(false);

      render(<PermissionPrompt />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', async () => {
      render(<PermissionPrompt className="custom-prompt" />);

      await waitFor(() => {
        expect(screen.getByTestId('permission-prompt')).toHaveClass('custom-prompt');
      });
    });
  });
});
