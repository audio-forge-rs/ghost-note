/**
 * ExportDialog Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportDialog } from './ExportDialog';

// Mock the export module
vi.mock('@/lib/audio/export', () => ({
  getSupportedFormats: vi.fn(() => ['webm', 'wav']),
  getFormatInfo: vi.fn((format: string) => ({
    webm: {
      name: 'WebM',
      mimeType: 'audio/webm',
      extension: '.webm',
      description: 'Web-optimized audio format',
      isSupported: true,
    },
    wav: {
      name: 'WAV',
      mimeType: 'audio/wav',
      extension: '.wav',
      description: 'Uncompressed audio format',
      isSupported: true,
    },
  }[format])),
  isWavConversionSupported: vi.fn(() => true),
}));

describe('ExportDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onExport: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<ExportDialog {...defaultProps} />);

      expect(screen.getByTestId('export-dialog')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<ExportDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('export-dialog')).not.toBeInTheDocument();
    });

    it('should display dialog title', () => {
      render(<ExportDialog {...defaultProps} />);

      expect(screen.getByText('Export Audio')).toBeInTheDocument();
    });

    it('should display recording info', () => {
      render(
        <ExportDialog
          {...defaultProps}
          poemTitle="My Poem"
          takeName="Take 1"
          duration={125}
        />
      );

      expect(screen.getByText('Take 1')).toBeInTheDocument();
      expect(screen.getByText('Duration: 2:05')).toBeInTheDocument();
    });

    it('should display estimated file size', () => {
      render(<ExportDialog {...defaultProps} duration={60} />);

      expect(screen.getByText(/Est\. size:/)).toBeInTheDocument();
    });
  });

  describe('Export mode selection', () => {
    it('should not show mode selection when hasMelody is false', () => {
      render(<ExportDialog {...defaultProps} hasMelody={false} />);

      expect(screen.queryByTestId('export-mode-single')).not.toBeInTheDocument();
      expect(screen.queryByTestId('export-mode-combined')).not.toBeInTheDocument();
    });

    it('should show mode selection when hasMelody is true', () => {
      render(<ExportDialog {...defaultProps} hasMelody />);

      expect(screen.getByTestId('export-mode-single')).toBeInTheDocument();
      expect(screen.getByTestId('export-mode-combined')).toBeInTheDocument();
    });

    it('should default to single mode', () => {
      render(<ExportDialog {...defaultProps} hasMelody />);

      const singleRadio = screen.getByTestId('export-mode-single').querySelector('input');
      expect(singleRadio).toBeChecked();
    });

    it('should switch to combined mode', () => {
      render(<ExportDialog {...defaultProps} hasMelody />);

      fireEvent.click(screen.getByTestId('export-mode-combined'));

      const combinedRadio = screen.getByTestId('export-mode-combined').querySelector('input');
      expect(combinedRadio).toBeChecked();
    });
  });

  describe('Volume controls', () => {
    it('should not show volume controls in single mode', () => {
      render(<ExportDialog {...defaultProps} hasMelody />);

      expect(screen.queryByTestId('recording-volume-slider')).not.toBeInTheDocument();
      expect(screen.queryByTestId('melody-volume-slider')).not.toBeInTheDocument();
    });

    it('should show volume controls in combined mode', () => {
      render(<ExportDialog {...defaultProps} hasMelody />);

      fireEvent.click(screen.getByTestId('export-mode-combined'));

      expect(screen.getByTestId('recording-volume-slider')).toBeInTheDocument();
      expect(screen.getByTestId('melody-volume-slider')).toBeInTheDocument();
    });

    it('should update recording volume', () => {
      render(<ExportDialog {...defaultProps} hasMelody />);

      fireEvent.click(screen.getByTestId('export-mode-combined'));

      const slider = screen.getByTestId('recording-volume-slider');
      fireEvent.change(slider, { target: { value: '75' } });

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should update melody volume', () => {
      render(<ExportDialog {...defaultProps} hasMelody />);

      fireEvent.click(screen.getByTestId('export-mode-combined'));

      const slider = screen.getByTestId('melody-volume-slider');
      fireEvent.change(slider, { target: { value: '30' } });

      expect(screen.getByText('30%')).toBeInTheDocument();
    });
  });

  describe('Format selection', () => {
    it('should show format select', () => {
      render(<ExportDialog {...defaultProps} />);

      expect(screen.getByTestId('export-format-select')).toBeInTheDocument();
    });

    it('should default to webm', () => {
      render(<ExportDialog {...defaultProps} />);

      const select = screen.getByTestId('export-format-select');
      expect(select).toHaveValue('webm');
    });

    it('should allow changing format', () => {
      render(<ExportDialog {...defaultProps} />);

      const select = screen.getByTestId('export-format-select');
      fireEvent.change(select, { target: { value: 'wav' } });

      expect(select).toHaveValue('wav');
    });
  });

  describe('Quality settings', () => {
    it('should not show quality settings for webm', () => {
      render(<ExportDialog {...defaultProps} />);

      expect(screen.queryByTestId('sample-rate-select')).not.toBeInTheDocument();
      expect(screen.queryByTestId('bit-depth-select')).not.toBeInTheDocument();
    });

    it('should show quality settings for wav', () => {
      render(<ExportDialog {...defaultProps} />);

      const formatSelect = screen.getByTestId('export-format-select');
      fireEvent.change(formatSelect, { target: { value: 'wav' } });

      expect(screen.getByTestId('sample-rate-select')).toBeInTheDocument();
      expect(screen.getByTestId('bit-depth-select')).toBeInTheDocument();
      expect(screen.getByTestId('channels-select')).toBeInTheDocument();
    });

    it('should allow changing sample rate', () => {
      render(<ExportDialog {...defaultProps} />);

      fireEvent.change(screen.getByTestId('export-format-select'), { target: { value: 'wav' } });

      const select = screen.getByTestId('sample-rate-select');
      fireEvent.change(select, { target: { value: '48000' } });

      expect(select).toHaveValue('48000');
    });

    it('should allow changing bit depth', () => {
      render(<ExportDialog {...defaultProps} />);

      fireEvent.change(screen.getByTestId('export-format-select'), { target: { value: 'wav' } });

      const select = screen.getByTestId('bit-depth-select');
      fireEvent.change(select, { target: { value: '24' } });

      expect(select).toHaveValue('24');
    });
  });

  describe('Custom filename', () => {
    it('should show filename input', () => {
      render(<ExportDialog {...defaultProps} />);

      expect(screen.getByTestId('export-filename-input')).toBeInTheDocument();
    });

    it('should use poem title as placeholder', () => {
      render(<ExportDialog {...defaultProps} poemTitle="My Song" />);

      expect(screen.getByTestId('export-filename-input')).toHaveAttribute(
        'placeholder',
        'My Song'
      );
    });

    it('should allow entering custom filename', () => {
      render(<ExportDialog {...defaultProps} />);

      const input = screen.getByTestId('export-filename-input');
      fireEvent.change(input, { target: { value: 'custom-name' } });

      expect(input).toHaveValue('custom-name');
    });
  });

  describe('Export action', () => {
    it('should call onExport with correct options when Export button clicked', () => {
      const handleExport = vi.fn();
      render(<ExportDialog {...defaultProps} onExport={handleExport} />);

      fireEvent.click(screen.getByTestId('export-dialog-confirm'));

      expect(handleExport).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'single',
          format: 'webm',
          quality: expect.objectContaining({
            sampleRate: 44100,
            channels: 2,
            bitDepth: 16,
          }),
        })
      );
    });

    it('should include custom filename in export options', () => {
      const handleExport = vi.fn();
      render(<ExportDialog {...defaultProps} onExport={handleExport} />);

      const input = screen.getByTestId('export-filename-input');
      fireEvent.change(input, { target: { value: 'my-export' } });

      fireEvent.click(screen.getByTestId('export-dialog-confirm'));

      expect(handleExport).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: 'my-export',
        })
      );
    });

    it('should include combine options for combined mode', () => {
      const handleExport = vi.fn();
      render(<ExportDialog {...defaultProps} onExport={handleExport} hasMelody />);

      fireEvent.click(screen.getByTestId('export-mode-combined'));
      fireEvent.click(screen.getByTestId('export-dialog-confirm'));

      expect(handleExport).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'combined',
          combineOptions: expect.objectContaining({
            recordingVolume: 1.0,
            melodyVolume: 0.5,
          }),
        })
      );
    });

    it('should disable Export button when isExporting is true', () => {
      render(<ExportDialog {...defaultProps} isExporting />);

      expect(screen.getByTestId('export-dialog-confirm')).toBeDisabled();
    });

    it('should show loading state when exporting', () => {
      render(<ExportDialog {...defaultProps} isExporting />);

      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });
  });

  describe('Close action', () => {
    it('should call onClose when Cancel button clicked', () => {
      const handleClose = vi.fn();
      render(<ExportDialog {...defaultProps} onClose={handleClose} />);

      fireEvent.click(screen.getByTestId('export-dialog-cancel'));

      expect(handleClose).toHaveBeenCalled();
    });

    it('should call onClose when close button clicked', () => {
      const handleClose = vi.fn();
      render(<ExportDialog {...defaultProps} onClose={handleClose} />);

      fireEvent.click(screen.getByTestId('export-dialog-close'));

      expect(handleClose).toHaveBeenCalled();
    });

    it('should call onClose when clicking overlay', () => {
      const handleClose = vi.fn();
      render(<ExportDialog {...defaultProps} onClose={handleClose} />);

      fireEvent.click(screen.getByTestId('export-dialog'));

      expect(handleClose).toHaveBeenCalled();
    });

    it('should not call onClose when clicking dialog content', () => {
      const handleClose = vi.fn();
      render(<ExportDialog {...defaultProps} onClose={handleClose} />);

      // Click on dialog content (not overlay)
      fireEvent.click(screen.getByText('Export Audio'));

      expect(handleClose).not.toHaveBeenCalled();
    });

    it('should not close when exporting', () => {
      const handleClose = vi.fn();
      render(<ExportDialog {...defaultProps} onClose={handleClose} isExporting />);

      fireEvent.click(screen.getByTestId('export-dialog-cancel'));

      // Button should be disabled, so onClose should not be called
      // (This depends on implementation - button might be disabled)
      expect(screen.getByTestId('export-dialog-cancel')).toBeDisabled();
    });
  });

  describe('Keyboard navigation', () => {
    it('should close on Escape key', () => {
      const handleClose = vi.fn();
      render(<ExportDialog {...defaultProps} onClose={handleClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(handleClose).toHaveBeenCalled();
    });

    it('should not close on Escape when exporting', () => {
      const handleClose = vi.fn();
      render(<ExportDialog {...defaultProps} onClose={handleClose} isExporting />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have role dialog', () => {
      render(<ExportDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have aria-modal attribute', () => {
      render(<ExportDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby pointing to title', () => {
      render(<ExportDialog {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      const titleId = dialog.getAttribute('aria-labelledby');
      const title = document.getElementById(titleId!);

      expect(title).toHaveTextContent('Export Audio');
    });
  });

  describe('State reset', () => {
    beforeEach(() => {
      // Mock requestAnimationFrame for state reset tests
      vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
        callback(performance.now());
        return 1;
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should reset state when dialog reopens', async () => {
      const { rerender } = render(<ExportDialog {...defaultProps} />);

      // Change format
      fireEvent.change(screen.getByTestId('export-format-select'), { target: { value: 'wav' } });
      expect(screen.getByTestId('export-format-select')).toHaveValue('wav');

      // Close dialog
      rerender(<ExportDialog {...defaultProps} isOpen={false} />);

      // Reopen dialog
      rerender(<ExportDialog {...defaultProps} isOpen />);

      // Wait for state reset (requestAnimationFrame is mocked to run synchronously)
      expect(screen.getByTestId('export-format-select')).toHaveValue('webm');
    });
  });
});
