/**
 * Tests for PoemToolbar Component
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PoemToolbar, type PoemToolbarProps } from './PoemToolbar';


describe('PoemToolbar', () => {
  const defaultProps: PoemToolbarProps = {
    onClear: vi.fn(),
    onPaste: vi.fn(),
    onSampleClick: vi.fn(),
    onAnalyze: vi.fn(),
    hasText: false,
    canAnalyze: false,
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders the toolbar container', () => {
      render(<PoemToolbar {...defaultProps} />);

      const toolbar = screen.getByTestId('poem-toolbar');
      expect(toolbar).toBeInTheDocument();
    });

    it('renders paste button', () => {
      render(<PoemToolbar {...defaultProps} />);

      const pasteButton = screen.getByTestId('paste-button');
      expect(pasteButton).toBeInTheDocument();
      expect(pasteButton).toHaveTextContent('Paste');
    });

    it('renders sample button', () => {
      render(<PoemToolbar {...defaultProps} />);

      const sampleButton = screen.getByTestId('sample-button');
      expect(sampleButton).toBeInTheDocument();
      expect(sampleButton).toHaveTextContent('Samples');
    });

    it('renders clear button', () => {
      render(<PoemToolbar {...defaultProps} />);

      const clearButton = screen.getByTestId('clear-button');
      expect(clearButton).toBeInTheDocument();
      expect(clearButton).toHaveTextContent('Clear');
    });

    it('renders analyze button', () => {
      render(<PoemToolbar {...defaultProps} />);

      const analyzeButton = screen.getByTestId('analyze-button');
      expect(analyzeButton).toBeInTheDocument();
      expect(analyzeButton).toHaveTextContent('Edit Lyrics');
    });

    it('has proper toolbar role', () => {
      render(<PoemToolbar {...defaultProps} />);

      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<PoemToolbar {...defaultProps} className="custom-class" />);

      const toolbar = screen.getByTestId('poem-toolbar');
      expect(toolbar).toHaveClass('custom-class');
    });
  });

  describe('paste button', () => {
    it('handles paste button click and shows empty clipboard error in test environment', async () => {
      // Note: In jsdom test environment, clipboard.readText() returns empty string
      // So the component shows "Clipboard is empty" error - this tests that behavior
      const onPaste = vi.fn();
      const user = userEvent.setup();
      render(<PoemToolbar {...defaultProps} onPaste={onPaste} />);

      const pasteButton = screen.getByTestId('paste-button');
      await user.click(pasteButton);

      // Wait for the error message to appear (test environment has empty clipboard)
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Clipboard is empty');
      });
    });

    it('is enabled when not disabled', () => {
      render(<PoemToolbar {...defaultProps} />);

      const pasteButton = screen.getByTestId('paste-button');
      expect(pasteButton).not.toBeDisabled();
    });

    it('is disabled when toolbar is disabled', () => {
      render(<PoemToolbar {...defaultProps} disabled />);

      const pasteButton = screen.getByTestId('paste-button');
      expect(pasteButton).toBeDisabled();
    });

    it('has proper aria-label', () => {
      render(<PoemToolbar {...defaultProps} />);

      const pasteButton = screen.getByTestId('paste-button');
      expect(pasteButton).toHaveAttribute('aria-label', 'Paste from clipboard');
    });
  });

  describe('sample button', () => {
    it('calls onSampleClick when clicked', async () => {
      const onSampleClick = vi.fn();
      const user = userEvent.setup();
      render(<PoemToolbar {...defaultProps} onSampleClick={onSampleClick} />);

      const sampleButton = screen.getByTestId('sample-button');
      await user.click(sampleButton);

      expect(onSampleClick).toHaveBeenCalledTimes(1);
    });

    it('is enabled when not disabled', () => {
      render(<PoemToolbar {...defaultProps} />);

      const sampleButton = screen.getByTestId('sample-button');
      expect(sampleButton).not.toBeDisabled();
    });

    it('is disabled when toolbar is disabled', () => {
      render(<PoemToolbar {...defaultProps} disabled />);

      const sampleButton = screen.getByTestId('sample-button');
      expect(sampleButton).toBeDisabled();
    });

    it('has proper aria-label', () => {
      render(<PoemToolbar {...defaultProps} />);

      const sampleButton = screen.getByTestId('sample-button');
      expect(sampleButton).toHaveAttribute('aria-label', 'Choose a sample poem');
    });
  });

  describe('clear button', () => {
    it('shows confirmation dialog when clicked with text', async () => {
      const onClear = vi.fn();
      const user = userEvent.setup();
      render(<PoemToolbar {...defaultProps} onClear={onClear} hasText />);

      const clearButton = screen.getByTestId('clear-button');
      await user.click(clearButton);

      // Should show confirmation dialog
      expect(screen.getByTestId('clear-poem-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('clear-poem-dialog-title')).toHaveTextContent('Clear Poem');

      // onClear should not be called yet
      expect(onClear).not.toHaveBeenCalled();
    });

    it('calls onClear when confirmation is confirmed', async () => {
      const onClear = vi.fn();
      const user = userEvent.setup();
      render(<PoemToolbar {...defaultProps} onClear={onClear} hasText />);

      // Click clear button to show dialog
      await user.click(screen.getByTestId('clear-button'));

      // Confirm the dialog
      await user.click(screen.getByTestId('clear-poem-dialog-confirm'));

      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('does not call onClear when confirmation is cancelled', async () => {
      const onClear = vi.fn();
      const user = userEvent.setup();
      render(<PoemToolbar {...defaultProps} onClear={onClear} hasText />);

      // Click clear button to show dialog
      await user.click(screen.getByTestId('clear-button'));

      // Cancel the dialog
      await user.click(screen.getByTestId('clear-poem-dialog-cancel'));

      expect(onClear).not.toHaveBeenCalled();
      // Dialog should be closed
      expect(screen.queryByTestId('clear-poem-dialog')).not.toBeInTheDocument();
    });

    it('is disabled when there is no text', () => {
      render(<PoemToolbar {...defaultProps} hasText={false} />);

      const clearButton = screen.getByTestId('clear-button');
      expect(clearButton).toBeDisabled();
    });

    it('is enabled when there is text', () => {
      render(<PoemToolbar {...defaultProps} hasText />);

      const clearButton = screen.getByTestId('clear-button');
      expect(clearButton).not.toBeDisabled();
    });

    it('is disabled when toolbar is disabled even with text', () => {
      render(<PoemToolbar {...defaultProps} hasText disabled />);

      const clearButton = screen.getByTestId('clear-button');
      expect(clearButton).toBeDisabled();
    });

    it('has proper aria-label', () => {
      render(<PoemToolbar {...defaultProps} />);

      const clearButton = screen.getByTestId('clear-button');
      expect(clearButton).toHaveAttribute('aria-label', 'Clear poem text');
    });

    it('has danger styling class', () => {
      render(<PoemToolbar {...defaultProps} />);

      const clearButton = screen.getByTestId('clear-button');
      expect(clearButton).toHaveClass('poem-toolbar__button--danger');
    });
  });

  describe('analyze button', () => {
    it('calls onAnalyze when clicked and can analyze', async () => {
      const onAnalyze = vi.fn();
      const user = userEvent.setup();
      render(<PoemToolbar {...defaultProps} onAnalyze={onAnalyze} canAnalyze />);

      const analyzeButton = screen.getByTestId('analyze-button');
      await user.click(analyzeButton);

      expect(onAnalyze).toHaveBeenCalledTimes(1);
    });

    it('is disabled when canAnalyze is false', () => {
      render(<PoemToolbar {...defaultProps} canAnalyze={false} />);

      const analyzeButton = screen.getByTestId('analyze-button');
      expect(analyzeButton).toBeDisabled();
    });

    it('is enabled when canAnalyze is true', () => {
      render(<PoemToolbar {...defaultProps} canAnalyze />);

      const analyzeButton = screen.getByTestId('analyze-button');
      expect(analyzeButton).not.toBeDisabled();
    });

    it('is disabled when toolbar is disabled even if canAnalyze', () => {
      render(<PoemToolbar {...defaultProps} canAnalyze disabled />);

      const analyzeButton = screen.getByTestId('analyze-button');
      expect(analyzeButton).toBeDisabled();
    });

    it('has proper aria-label', () => {
      render(<PoemToolbar {...defaultProps} />);

      const analyzeButton = screen.getByTestId('analyze-button');
      expect(analyzeButton).toHaveAttribute('aria-label', 'Edit lyrics');
    });

    it('has primary styling class', () => {
      render(<PoemToolbar {...defaultProps} />);

      const analyzeButton = screen.getByTestId('analyze-button');
      expect(analyzeButton).toHaveClass('poem-toolbar__button--primary');
    });
  });

  describe('disabled state', () => {
    it('disables all buttons when disabled prop is true', () => {
      render(<PoemToolbar {...defaultProps} hasText canAnalyze disabled />);

      expect(screen.getByTestId('paste-button')).toBeDisabled();
      expect(screen.getByTestId('sample-button')).toBeDisabled();
      expect(screen.getByTestId('clear-button')).toBeDisabled();
      expect(screen.getByTestId('analyze-button')).toBeDisabled();
    });

    it('does not call handlers when disabled', async () => {
      const onClear = vi.fn();
      const onPaste = vi.fn();
      const onSampleClick = vi.fn();
      const onAnalyze = vi.fn();
      const user = userEvent.setup();

      render(
        <PoemToolbar
          {...defaultProps}
          onClear={onClear}
          onPaste={onPaste}
          onSampleClick={onSampleClick}
          onAnalyze={onAnalyze}
          hasText
          canAnalyze
          disabled
        />
      );

      // Try clicking all buttons
      await user.click(screen.getByTestId('paste-button')).catch(() => {});
      await user.click(screen.getByTestId('sample-button')).catch(() => {});
      await user.click(screen.getByTestId('clear-button')).catch(() => {});
      await user.click(screen.getByTestId('analyze-button')).catch(() => {});

      expect(onClear).not.toHaveBeenCalled();
      expect(onPaste).not.toHaveBeenCalled();
      expect(onSampleClick).not.toHaveBeenCalled();
      expect(onAnalyze).not.toHaveBeenCalled();
    });
  });

  describe('button positioning', () => {
    it('has left section for utility buttons', () => {
      render(<PoemToolbar {...defaultProps} />);

      const toolbar = screen.getByTestId('poem-toolbar');
      const leftSection = toolbar.querySelector('.poem-toolbar__left');
      expect(leftSection).toBeInTheDocument();
    });

    it('has right section for analyze button', () => {
      render(<PoemToolbar {...defaultProps} />);

      const toolbar = screen.getByTestId('poem-toolbar');
      const rightSection = toolbar.querySelector('.poem-toolbar__right');
      expect(rightSection).toBeInTheDocument();
    });

    it('places utility buttons in left section', () => {
      render(<PoemToolbar {...defaultProps} />);

      const toolbar = screen.getByTestId('poem-toolbar');
      const leftSection = toolbar.querySelector('.poem-toolbar__left');

      expect(leftSection?.contains(screen.getByTestId('paste-button'))).toBe(true);
      expect(leftSection?.contains(screen.getByTestId('sample-button'))).toBe(true);
      expect(leftSection?.contains(screen.getByTestId('clear-button'))).toBe(true);
    });

    it('places analyze button in right section', () => {
      render(<PoemToolbar {...defaultProps} />);

      const toolbar = screen.getByTestId('poem-toolbar');
      const rightSection = toolbar.querySelector('.poem-toolbar__right');

      expect(rightSection?.contains(screen.getByTestId('analyze-button'))).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('has toolbar role with aria-label', () => {
      render(<PoemToolbar {...defaultProps} />);

      const toolbar = screen.getByRole('toolbar', { name: /poem input actions/i });
      expect(toolbar).toBeInTheDocument();
    });

    it('all buttons have accessible names', () => {
      render(<PoemToolbar {...defaultProps} />);

      expect(screen.getByRole('button', { name: /paste from clipboard/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /choose a sample poem/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear poem text/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit lyrics/i })).toBeInTheDocument();
    });

    it('buttons have title attributes for tooltips', () => {
      render(<PoemToolbar {...defaultProps} />);

      expect(screen.getByTestId('paste-button')).toHaveAttribute('title', 'Paste from clipboard');
      expect(screen.getByTestId('sample-button')).toHaveAttribute('title', 'Choose a sample poem');
      expect(screen.getByTestId('clear-button')).toHaveAttribute('title', 'Clear poem text');
      expect(screen.getByTestId('analyze-button')).toHaveAttribute('title', 'Edit lyrics');
    });
  });

  describe('icons', () => {
    it('renders icons in all buttons', () => {
      render(<PoemToolbar {...defaultProps} />);

      const pasteButton = screen.getByTestId('paste-button');
      const sampleButton = screen.getByTestId('sample-button');
      const clearButton = screen.getByTestId('clear-button');
      const analyzeButton = screen.getByTestId('analyze-button');

      expect(pasteButton.querySelector('svg')).toBeInTheDocument();
      expect(sampleButton.querySelector('svg')).toBeInTheDocument();
      expect(clearButton.querySelector('svg')).toBeInTheDocument();
      expect(analyzeButton.querySelector('svg')).toBeInTheDocument();
    });

    it('icons are hidden from screen readers', () => {
      render(<PoemToolbar {...defaultProps} />);

      const icons = screen.getByTestId('poem-toolbar').querySelectorAll('svg');
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });
});
