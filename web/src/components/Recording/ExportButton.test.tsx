/**
 * ExportButton Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportButton } from './ExportButton';
import type { ExportFormat } from '@/lib/audio/export';

// Mock the export module
vi.mock('@/lib/audio/export', () => ({
  getSupportedFormats: vi.fn(() => ['webm', 'wav'] as ExportFormat[]),
  getFormatInfo: vi.fn((format: ExportFormat) => ({
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
}));

describe('ExportButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render the button', () => {
      const handleExport = vi.fn();
      render(<ExportButton onExport={handleExport} />);

      expect(screen.getByTestId('export-button')).toBeInTheDocument();
    });

    it('should display default label', () => {
      const handleExport = vi.fn();
      render(<ExportButton onExport={handleExport} />);

      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('should display custom label', () => {
      const handleExport = vi.fn();
      render(<ExportButton onExport={handleExport} label="Download" />);

      expect(screen.getByText('Download')).toBeInTheDocument();
    });

    it('should display "Exporting..." when isExporting is true', () => {
      const handleExport = vi.fn();
      render(<ExportButton onExport={handleExport} isExporting />);

      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const handleExport = vi.fn();
      render(<ExportButton onExport={handleExport} className="custom-class" />);

      expect(screen.getByTestId('export-button').parentElement).toHaveClass('custom-class');
    });
  });

  describe('Button sizes', () => {
    it('should render small size', () => {
      const handleExport = vi.fn();
      render(<ExportButton onExport={handleExport} size="small" />);

      const button = screen.getByTestId('export-button');
      expect(button).toHaveStyle({ height: '32px' });
    });

    it('should render medium size by default', () => {
      const handleExport = vi.fn();
      render(<ExportButton onExport={handleExport} />);

      const button = screen.getByTestId('export-button');
      expect(button).toHaveStyle({ height: '40px' });
    });

    it('should render large size', () => {
      const handleExport = vi.fn();
      render(<ExportButton onExport={handleExport} size="large" />);

      const button = screen.getByTestId('export-button');
      expect(button).toHaveStyle({ height: '48px' });
    });
  });

  describe('Disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      const handleExport = vi.fn();
      render(<ExportButton onExport={handleExport} disabled />);

      expect(screen.getByTestId('export-button')).toBeDisabled();
    });

    it('should be disabled when isExporting is true', () => {
      const handleExport = vi.fn();
      render(<ExportButton onExport={handleExport} isExporting />);

      expect(screen.getByTestId('export-button')).toBeDisabled();
    });

    it('should not trigger export when disabled', () => {
      const handleExport = vi.fn();
      render(
        <ExportButton onExport={handleExport} disabled showFormatSelector={false} />
      );

      fireEvent.click(screen.getByTestId('export-button'));

      expect(handleExport).not.toHaveBeenCalled();
    });
  });

  describe('Format selector', () => {
    it('should show dropdown when showFormatSelector is true', () => {
      const handleExport = vi.fn();
      render(<ExportButton onExport={handleExport} showFormatSelector />);

      fireEvent.click(screen.getByTestId('export-button'));

      expect(screen.getByTestId('export-format-dropdown')).toBeInTheDocument();
    });

    it('should not show dropdown when showFormatSelector is false', () => {
      const handleExport = vi.fn();
      render(<ExportButton onExport={handleExport} showFormatSelector={false} />);

      fireEvent.click(screen.getByTestId('export-button'));

      expect(screen.queryByTestId('export-format-dropdown')).not.toBeInTheDocument();
    });

    it('should export directly when showFormatSelector is false', () => {
      const handleExport = vi.fn();
      render(
        <ExportButton
          onExport={handleExport}
          showFormatSelector={false}
          defaultFormat="wav"
        />
      );

      fireEvent.click(screen.getByTestId('export-button'));

      expect(handleExport).toHaveBeenCalledWith('wav');
    });

    it('should show format options in dropdown', () => {
      const handleExport = vi.fn();
      render(<ExportButton onExport={handleExport} showFormatSelector />);

      fireEvent.click(screen.getByTestId('export-button'));

      expect(screen.getByTestId('export-format-webm')).toBeInTheDocument();
      expect(screen.getByTestId('export-format-wav')).toBeInTheDocument();
    });

    it('should call onExport with selected format', () => {
      const handleExport = vi.fn();
      render(<ExportButton onExport={handleExport} showFormatSelector />);

      fireEvent.click(screen.getByTestId('export-button'));
      fireEvent.click(screen.getByTestId('export-format-wav'));

      expect(handleExport).toHaveBeenCalledWith('wav');
    });

    it('should close dropdown after selection', () => {
      const handleExport = vi.fn();
      render(<ExportButton onExport={handleExport} showFormatSelector />);

      fireEvent.click(screen.getByTestId('export-button'));
      expect(screen.getByTestId('export-format-dropdown')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('export-format-webm'));

      expect(screen.queryByTestId('export-format-dropdown')).not.toBeInTheDocument();
    });

    it('should toggle dropdown on button click', () => {
      const handleExport = vi.fn();
      render(<ExportButton onExport={handleExport} showFormatSelector />);

      // Open
      fireEvent.click(screen.getByTestId('export-button'));
      expect(screen.getByTestId('export-format-dropdown')).toBeInTheDocument();

      // Close
      fireEvent.click(screen.getByTestId('export-button'));
      expect(screen.queryByTestId('export-format-dropdown')).not.toBeInTheDocument();
    });
  });

  describe('Default format', () => {
    it('should use default format when exporting directly', () => {
      const handleExport = vi.fn();
      render(
        <ExportButton
          onExport={handleExport}
          showFormatSelector={false}
          defaultFormat="wav"
        />
      );

      fireEvent.click(screen.getByTestId('export-button'));

      expect(handleExport).toHaveBeenCalledWith('wav');
    });

    it('should use webm as default when no defaultFormat specified', () => {
      const handleExport = vi.fn();
      render(<ExportButton onExport={handleExport} showFormatSelector={false} />);

      fireEvent.click(screen.getByTestId('export-button'));

      expect(handleExport).toHaveBeenCalledWith('webm');
    });
  });

  describe('Accessibility', () => {
    it('should have correct aria-label', () => {
      const handleExport = vi.fn();
      render(<ExportButton onExport={handleExport} />);

      expect(screen.getByTestId('export-button')).toHaveAttribute('aria-label', 'Export');
    });

    it('should update aria-label when exporting', () => {
      const handleExport = vi.fn();
      render(<ExportButton onExport={handleExport} isExporting />);

      expect(screen.getByTestId('export-button')).toHaveAttribute(
        'aria-label',
        'Exporting...'
      );
    });

    it('should have aria-expanded when dropdown is open', () => {
      const handleExport = vi.fn();
      render(<ExportButton onExport={handleExport} showFormatSelector />);

      const button = screen.getByTestId('export-button');

      expect(button).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have aria-haspopup when format selector is enabled', () => {
      const handleExport = vi.fn();
      render(<ExportButton onExport={handleExport} showFormatSelector />);

      expect(screen.getByTestId('export-button')).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('should have role listbox on dropdown', () => {
      const handleExport = vi.fn();
      render(<ExportButton onExport={handleExport} showFormatSelector />);

      fireEvent.click(screen.getByTestId('export-button'));

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  describe('Keyboard navigation', () => {
    it('should close dropdown on Escape key', () => {
      const handleExport = vi.fn();
      render(<ExportButton onExport={handleExport} showFormatSelector />);

      fireEvent.click(screen.getByTestId('export-button'));
      expect(screen.getByTestId('export-format-dropdown')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.queryByTestId('export-format-dropdown')).not.toBeInTheDocument();
    });
  });

  describe('Outside click', () => {
    it('should close dropdown when clicking outside', () => {
      const handleExport = vi.fn();
      render(
        <div>
          <ExportButton onExport={handleExport} showFormatSelector />
          <div data-testid="outside">Outside</div>
        </div>
      );

      fireEvent.click(screen.getByTestId('export-button'));
      expect(screen.getByTestId('export-format-dropdown')).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByTestId('outside'));

      expect(screen.queryByTestId('export-format-dropdown')).not.toBeInTheDocument();
    });
  });
});
