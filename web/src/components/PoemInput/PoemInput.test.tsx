/**
 * Tests for PoemInput Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PoemInput, type PoemInputProps } from './PoemInput';
import { usePoemStore, selectLineCount, selectWordCount } from '@/stores/usePoemStore';

// Mock the usePoemStore
vi.mock('@/stores/usePoemStore', async () => {
  const actual = await vi.importActual('@/stores/usePoemStore');
  return {
    ...actual,
    usePoemStore: vi.fn(),
  };
});

describe('PoemInput', () => {
  const defaultProps: PoemInputProps = {
    onAnalyze: vi.fn(),
  };

  const mockSetPoem = vi.fn();
  const mockReset = vi.fn();

  const createMockSelector = (original: string = '') => {
    return (selector: unknown) => {
      if (typeof selector === 'function') {
        // Handle specific selectors
        if (selector === selectLineCount) {
          return original.trim() ? original.split('\n').filter((line: string) => line.trim()).length : 0;
        }
        if (selector === selectWordCount) {
          return original.trim() ? original.trim().split(/\s+/).length : 0;
        }
        // Handle state selector for original and actions
        const mockState = {
          original,
          setPoem: mockSetPoem,
          reset: mockReset,
          versions: [],
          currentVersionIndex: -1,
        };
        return selector(mockState);
      }
      // This shouldn't be reached
      return null;
    };
  };

  beforeEach(() => {
    vi.mocked(usePoemStore).mockImplementation(createMockSelector(''));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the main container', () => {
      render(<PoemInput {...defaultProps} />);

      const container = screen.getByTestId('poem-input');
      expect(container).toBeInTheDocument();
    });

    it('renders the title', () => {
      render(<PoemInput {...defaultProps} />);

      const title = screen.getByRole('heading', { name: /enter your poem/i });
      expect(title).toBeInTheDocument();
    });

    it('renders the subtitle', () => {
      render(<PoemInput {...defaultProps} />);

      expect(screen.getByText(/paste or type your poem/i)).toBeInTheDocument();
    });

    it('renders the toolbar', () => {
      render(<PoemInput {...defaultProps} />);

      const toolbar = screen.getByTestId('poem-toolbar');
      expect(toolbar).toBeInTheDocument();
    });

    it('renders the textarea', () => {
      render(<PoemInput {...defaultProps} />);

      const textarea = screen.getByTestId('poem-textarea');
      expect(textarea).toBeInTheDocument();
    });

    it('renders stats display by default', () => {
      render(<PoemInput {...defaultProps} />);

      const stats = screen.getByTestId('poem-stats');
      expect(stats).toBeInTheDocument();
    });

    it('hides stats display when showStats is false', () => {
      render(<PoemInput {...defaultProps} showStats={false} />);

      expect(screen.queryByTestId('poem-stats')).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<PoemInput {...defaultProps} className="custom-class" />);

      const container = screen.getByTestId('poem-input');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('stats display', () => {
    it('shows line count', () => {
      vi.mocked(usePoemStore).mockImplementation(createMockSelector('Line 1\nLine 2\nLine 3'));
      render(<PoemInput {...defaultProps} />);

      const stats = screen.getByTestId('poem-stats');
      expect(stats).toHaveTextContent('Lines:');
      expect(stats).toHaveTextContent('3');
    });

    it('shows word count', () => {
      vi.mocked(usePoemStore).mockImplementation(createMockSelector('Hello world test'));
      render(<PoemInput {...defaultProps} />);

      const stats = screen.getByTestId('poem-stats');
      expect(stats).toHaveTextContent('Words:');
      expect(stats).toHaveTextContent('3');
    });

    it('shows character count', () => {
      vi.mocked(usePoemStore).mockImplementation(createMockSelector('Hello'));
      render(<PoemInput {...defaultProps} />);

      const stats = screen.getByTestId('poem-stats');
      expect(stats).toHaveTextContent('Characters:');
      expect(stats).toHaveTextContent('5');
    });

    it('shows character count with limit', () => {
      vi.mocked(usePoemStore).mockImplementation(createMockSelector('Hello'));
      render(<PoemInput {...defaultProps} maxLength={100} />);

      const stats = screen.getByTestId('poem-stats');
      expect(stats).toHaveTextContent('5 / 100');
    });

    it('shows 0 for empty text', () => {
      vi.mocked(usePoemStore).mockImplementation(createMockSelector(''));
      render(<PoemInput {...defaultProps} />);

      const stats = screen.getByTestId('poem-stats');
      expect(stats).toHaveTextContent('Words:');
      expect(stats).toHaveTextContent('0');
    });
  });

  describe('toolbar integration', () => {
    it('disables clear button when no text', () => {
      vi.mocked(usePoemStore).mockImplementation(createMockSelector(''));
      render(<PoemInput {...defaultProps} />);

      const clearButton = screen.getByTestId('clear-button');
      expect(clearButton).toBeDisabled();
    });

    it('enables clear button when there is text', () => {
      vi.mocked(usePoemStore).mockImplementation(createMockSelector('Some text'));
      render(<PoemInput {...defaultProps} />);

      const clearButton = screen.getByTestId('clear-button');
      expect(clearButton).not.toBeDisabled();
    });

    it('disables analyze button when text is too short', () => {
      vi.mocked(usePoemStore).mockImplementation(createMockSelector('Hi'));
      render(<PoemInput {...defaultProps} />);

      const analyzeButton = screen.getByTestId('analyze-button');
      expect(analyzeButton).toBeDisabled();
    });

    it('enables analyze button when text is long enough', () => {
      vi.mocked(usePoemStore).mockImplementation(createMockSelector('This is a poem with enough characters'));
      render(<PoemInput {...defaultProps} />);

      const analyzeButton = screen.getByTestId('analyze-button');
      expect(analyzeButton).not.toBeDisabled();
    });

    it('calls onAnalyze when analyze button is clicked', async () => {
      const onAnalyze = vi.fn();
      const user = userEvent.setup();
      vi.mocked(usePoemStore).mockImplementation(createMockSelector('This is a poem with enough characters'));
      render(<PoemInput {...defaultProps} onAnalyze={onAnalyze} />);

      const analyzeButton = screen.getByTestId('analyze-button');
      await user.click(analyzeButton);

      expect(onAnalyze).toHaveBeenCalledTimes(1);
    });

    it('calls reset when clear button is clicked and confirmed', async () => {
      const user = userEvent.setup();
      vi.mocked(usePoemStore).mockImplementation(createMockSelector('Some text'));
      render(<PoemInput {...defaultProps} />);

      const clearButton = screen.getByTestId('clear-button');
      await user.click(clearButton);

      // Click the confirm button in the dialog
      const confirmButton = screen.getByTestId('clear-poem-dialog-confirm');
      await user.click(confirmButton);

      expect(mockReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('sample poems', () => {
    it('opens sample picker when sample button is clicked', async () => {
      const user = userEvent.setup();
      render(<PoemInput {...defaultProps} />);

      const sampleButton = screen.getByTestId('sample-button');
      await user.click(sampleButton);

      const overlay = screen.getByTestId('sample-poems-overlay');
      expect(overlay).toBeInTheDocument();
    });

    it('closes sample picker when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<PoemInput {...defaultProps} />);

      // Open the picker
      const sampleButton = screen.getByTestId('sample-button');
      await user.click(sampleButton);

      // Close it
      const closeButton = screen.getByTestId('sample-poems-close');
      await user.click(closeButton);

      expect(screen.queryByTestId('sample-poems-overlay')).not.toBeInTheDocument();
    });

    it('closes sample picker when a poem is selected', async () => {
      const user = userEvent.setup();
      render(<PoemInput {...defaultProps} />);

      // Open the picker
      const sampleButton = screen.getByTestId('sample-button');
      await user.click(sampleButton);

      // Select a poem
      const selectButton = screen.getByTestId('sample-poems-select');
      await user.click(selectButton);

      expect(screen.queryByTestId('sample-poems-overlay')).not.toBeInTheDocument();
    });

    it('sets poem text when sample is selected', async () => {
      const user = userEvent.setup();
      render(<PoemInput {...defaultProps} />);

      // Open the picker
      const sampleButton = screen.getByTestId('sample-button');
      await user.click(sampleButton);

      // Select a poem
      const selectButton = screen.getByTestId('sample-poems-select');
      await user.click(selectButton);

      expect(mockSetPoem).toHaveBeenCalled();
    });
  });

  describe('character limit', () => {
    it('shows warning when approaching limit', () => {
      // 91% of 100 = 91 characters
      const longText = 'x'.repeat(91);
      vi.mocked(usePoemStore).mockImplementation(createMockSelector(longText));
      render(<PoemInput {...defaultProps} maxLength={100} />);

      const warning = screen.getByRole('alert');
      expect(warning).toHaveTextContent(/approaching character limit/i);
    });

    it('shows error when at limit', () => {
      const longText = 'x'.repeat(100);
      vi.mocked(usePoemStore).mockImplementation(createMockSelector(longText));
      render(<PoemInput {...defaultProps} maxLength={100} />);

      const error = screen.getByRole('alert');
      expect(error).toHaveTextContent(/character limit reached/i);
    });

    it('does not show warning when under threshold', () => {
      const shortText = 'x'.repeat(50);
      vi.mocked(usePoemStore).mockImplementation(createMockSelector(shortText));
      render(<PoemInput {...defaultProps} maxLength={100} />);

      expect(screen.queryByText(/approaching character limit/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/character limit reached/i)).not.toBeInTheDocument();
    });

    it('does not show warnings when no maxLength', () => {
      const longText = 'x'.repeat(1000);
      vi.mocked(usePoemStore).mockImplementation(createMockSelector(longText));
      render(<PoemInput {...defaultProps} maxLength={undefined} />);

      expect(screen.queryByText(/approaching character limit/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/character limit reached/i)).not.toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('applies disabled class when disabled', () => {
      render(<PoemInput {...defaultProps} disabled />);

      const container = screen.getByTestId('poem-input');
      expect(container).toHaveClass('poem-input--disabled');
    });

    it('disables all toolbar buttons when disabled', () => {
      vi.mocked(usePoemStore).mockImplementation(createMockSelector('Some text'));
      render(<PoemInput {...defaultProps} disabled />);

      expect(screen.getByTestId('paste-button')).toBeDisabled();
      expect(screen.getByTestId('sample-button')).toBeDisabled();
      expect(screen.getByTestId('clear-button')).toBeDisabled();
      expect(screen.getByTestId('analyze-button')).toBeDisabled();
    });

    it('disables textarea when disabled', () => {
      render(<PoemInput {...defaultProps} disabled />);

      const textarea = screen.getByTestId('poem-textarea');
      expect(textarea).toBeDisabled();
    });
  });

  describe('textarea integration', () => {
    it('shows placeholder text in textarea', () => {
      render(<PoemInput {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/enter or paste your poem/i);
      expect(textarea).toBeInTheDocument();
    });

    it('shows line numbers', () => {
      render(<PoemInput {...defaultProps} />);

      const lineNumbers = screen.getByTestId('line-numbers');
      expect(lineNumbers).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper heading structure', () => {
      render(<PoemInput {...defaultProps} />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent(/enter your poem/i);
    });

    it('warns with proper role when approaching limit', () => {
      const longText = 'x'.repeat(91);
      vi.mocked(usePoemStore).mockImplementation(createMockSelector(longText));
      render(<PoemInput {...defaultProps} maxLength={100} />);

      const warning = screen.getByRole('alert');
      expect(warning).toHaveAttribute('aria-live', 'polite');
    });

    it('errors with assertive role when at limit', () => {
      const longText = 'x'.repeat(100);
      vi.mocked(usePoemStore).mockImplementation(createMockSelector(longText));
      render(<PoemInput {...defaultProps} maxLength={100} />);

      const error = screen.getByRole('alert');
      expect(error).toHaveAttribute('aria-live', 'assertive');
    });
  });
});
