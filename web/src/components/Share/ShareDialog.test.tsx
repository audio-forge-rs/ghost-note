/**
 * Tests for ShareDialog Component
 *
 * @module components/Share/ShareDialog.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShareDialog } from './ShareDialog';
import { usePoemStore } from '@/stores/usePoemStore';
import { useAnalysisStore } from '@/stores/useAnalysisStore';
import { useMelodyStore } from '@/stores/useMelodyStore';
import { createDefaultPoemAnalysis } from '@/types';

// Mock clipboard API
const mockWriteText = vi.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

// Create mock analysis using the factory function
const mockAnalysis = createDefaultPoemAnalysis();

describe('ShareDialog', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    // Reset stores
    usePoemStore.getState().reset();
    useAnalysisStore.getState().reset();
    useMelodyStore.getState().reset();

    // Reset mocks
    mockOnClose.mockReset();
    mockWriteText.mockReset();
    mockWriteText.mockResolvedValue(undefined);
  });

  it('should not render when closed', () => {
    render(<ShareDialog isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByTestId('share-dialog')).not.toBeInTheDocument();
  });

  it('should render when open with no poem', () => {
    render(<ShareDialog isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByTestId('share-dialog')).toBeInTheDocument();
    expect(screen.getByText(/enter a poem first/i)).toBeInTheDocument();
  });

  it('should render share options when poem exists', () => {
    usePoemStore.getState().setPoem('Roses are red');

    render(<ShareDialog isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByTestId('share-dialog')).toBeInTheDocument();
    expect(screen.getByText('Share Poem')).toBeInTheDocument();
    expect(screen.getByText('Poem Only')).toBeInTheDocument();
    expect(screen.getByText('With Analysis')).toBeInTheDocument();
    expect(screen.getByText('Full Project')).toBeInTheDocument();
  });

  it('should close when close button is clicked', async () => {
    usePoemStore.getState().setPoem('Roses are red');

    render(<ShareDialog isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByTestId('share-dialog-close');
    await userEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close when overlay is clicked', async () => {
    usePoemStore.getState().setPoem('Roses are red');

    render(<ShareDialog isOpen={true} onClose={mockOnClose} />);

    const overlay = screen.getByTestId('share-dialog');
    await userEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close when Escape is pressed', () => {
    usePoemStore.getState().setPoem('Roses are red');

    render(<ShareDialog isOpen={true} onClose={mockOnClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should disable with-analysis option when no analysis exists', () => {
    usePoemStore.getState().setPoem('Roses are red');

    render(<ShareDialog isOpen={true} onClose={mockOnClose} />);

    const withAnalysisOption = screen.getByTestId('share-dialog-mode-with-analysis');
    const radio = withAnalysisOption.querySelector('input[type="radio"]');

    expect(radio).toBeDisabled();
  });

  it('should enable with-analysis option when analysis exists', () => {
    usePoemStore.getState().setPoem('Roses are red');
    useAnalysisStore.getState().setAnalysis(mockAnalysis);

    render(<ShareDialog isOpen={true} onClose={mockOnClose} />);

    const withAnalysisOption = screen.getByTestId('share-dialog-mode-with-analysis');
    const radio = withAnalysisOption.querySelector('input[type="radio"]');

    expect(radio).not.toBeDisabled();
  });

  it('should generate share link when button is clicked', async () => {
    usePoemStore.getState().setPoem('Roses are red');

    render(<ShareDialog isOpen={true} onClose={mockOnClose} />);

    const generateButton = screen.getByTestId('share-dialog-generate');
    await userEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByTestId('share-dialog-result')).toBeInTheDocument();
    });
  });

  it('should show URL in input after generating', async () => {
    usePoemStore.getState().setPoem('Roses are red');

    render(<ShareDialog isOpen={true} onClose={mockOnClose} />);

    const generateButton = screen.getByTestId('share-dialog-generate');
    await userEvent.click(generateButton);

    await waitFor(() => {
      const urlInput = screen.getByTestId('share-dialog-url') as HTMLInputElement;
      expect(urlInput.value).toContain('#share=');
    });
  });

  it('should copy URL to clipboard when copy button is clicked', async () => {
    usePoemStore.getState().setPoem('Roses are red');

    render(<ShareDialog isOpen={true} onClose={mockOnClose} />);

    // Generate link first
    const generateButton = screen.getByTestId('share-dialog-generate');
    await userEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByTestId('share-dialog-copy')).toBeInTheDocument();
    });

    // Click copy
    const copyButton = screen.getByTestId('share-dialog-copy');
    await userEvent.click(copyButton);

    expect(mockWriteText).toHaveBeenCalled();
  });

  it('should show copied state after copying', async () => {
    usePoemStore.getState().setPoem('Roses are red');

    render(<ShareDialog isOpen={true} onClose={mockOnClose} />);

    // Generate link first
    const generateButton = screen.getByTestId('share-dialog-generate');
    await userEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByTestId('share-dialog-copy')).toBeInTheDocument();
    });

    // Click copy
    const copyButton = screen.getByTestId('share-dialog-copy');
    await userEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('should show privacy note', () => {
    usePoemStore.getState().setPoem('Roses are red');

    render(<ShareDialog isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText(/privacy note/i)).toBeInTheDocument();
  });

  it('should allow selecting different share modes', async () => {
    usePoemStore.getState().setPoem('Roses are red');
    useAnalysisStore.getState().setAnalysis(mockAnalysis);

    render(<ShareDialog isOpen={true} onClose={mockOnClose} />);

    // Click on with-analysis option
    const withAnalysisOption = screen.getByTestId('share-dialog-mode-with-analysis');
    await userEvent.click(withAnalysisOption);

    const radio = withAnalysisOption.querySelector('input[type="radio"]') as HTMLInputElement;
    expect(radio.checked).toBe(true);
  });

  it('should auto-select with-analysis mode when only analysis exists', async () => {
    usePoemStore.getState().setPoem('Roses are red');
    useAnalysisStore.getState().setAnalysis(mockAnalysis);

    render(<ShareDialog isOpen={true} onClose={mockOnClose} />);

    // Should auto-select with-analysis when analysis exists but no melody
    const withAnalysisOption = screen.getByTestId('share-dialog-mode-with-analysis');
    const radio = withAnalysisOption.querySelector('input[type="radio"]') as HTMLInputElement;

    // With-analysis is selected when analysis exists (but no melody)
    expect(radio.checked).toBe(true);
  });

  it('should show URL length stats after generating', async () => {
    usePoemStore.getState().setPoem('Roses are red');

    render(<ShareDialog isOpen={true} onClose={mockOnClose} />);

    const generateButton = screen.getByTestId('share-dialog-generate');
    await userEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/URL Length:/)).toBeInTheDocument();
    });
  });

  it('should display the correct test ID', () => {
    usePoemStore.getState().setPoem('Roses are red');

    render(<ShareDialog isOpen={true} onClose={mockOnClose} testId="custom-share" />);

    expect(screen.getByTestId('custom-share')).toBeInTheDocument();
  });
});
