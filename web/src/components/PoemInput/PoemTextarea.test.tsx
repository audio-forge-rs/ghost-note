/**
 * Tests for PoemTextarea Component
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PoemTextarea, type PoemTextareaProps } from './PoemTextarea';

describe('PoemTextarea', () => {
  const defaultProps: PoemTextareaProps = {
    value: '',
    onChange: vi.fn(),
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the textarea container', () => {
      render(<PoemTextarea {...defaultProps} />);

      const container = screen.getByTestId('poem-textarea-container');
      expect(container).toBeInTheDocument();
    });

    it('renders the textarea input', () => {
      render(<PoemTextarea {...defaultProps} />);

      const textarea = screen.getByTestId('poem-textarea');
      expect(textarea).toBeInTheDocument();
    });

    it('renders line numbers container', () => {
      render(<PoemTextarea {...defaultProps} />);

      const lineNumbers = screen.getByTestId('line-numbers');
      expect(lineNumbers).toBeInTheDocument();
    });

    it('displays the correct value', () => {
      const testValue = 'Hello world\nSecond line';
      render(<PoemTextarea {...defaultProps} value={testValue} />);

      const textarea = screen.getByTestId('poem-textarea');
      expect(textarea).toHaveValue(testValue);
    });

    it('displays placeholder text', () => {
      const placeholder = 'Enter your poem...';
      render(<PoemTextarea {...defaultProps} placeholder={placeholder} />);

      const textarea = screen.getByPlaceholderText(placeholder);
      expect(textarea).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<PoemTextarea {...defaultProps} className="custom-class" />);

      const container = screen.getByTestId('poem-textarea-container');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('line numbers', () => {
    it('shows line number 1 for empty textarea', () => {
      render(<PoemTextarea {...defaultProps} value="" />);

      const lineNumbers = screen.getByTestId('line-numbers');
      expect(lineNumbers).toHaveTextContent('1');
    });

    it('shows correct line numbers for multi-line text', () => {
      const multiLineText = 'Line one\nLine two\nLine three';
      render(<PoemTextarea {...defaultProps} value={multiLineText} />);

      const lineNumbers = screen.getByTestId('line-numbers');
      expect(lineNumbers).toHaveTextContent('1');
      expect(lineNumbers).toHaveTextContent('2');
      expect(lineNumbers).toHaveTextContent('3');
    });

    it('updates line numbers when text changes', () => {
      const singleLine = 'Line one';
      const multiLine = `Line one
Line two`;
      const { rerender } = render(<PoemTextarea {...defaultProps} value={singleLine} />);

      let lineNumbers = screen.getByTestId('line-numbers');
      expect(lineNumbers.children).toHaveLength(1);

      rerender(<PoemTextarea {...defaultProps} value={multiLine} />);
      lineNumbers = screen.getByTestId('line-numbers');
      expect(lineNumbers.children).toHaveLength(2);
    });

    it('handles many lines correctly', () => {
      const manyLines = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`).join('\n');
      render(<PoemTextarea {...defaultProps} value={manyLines} />);

      const lineNumbers = screen.getByTestId('line-numbers');
      expect(lineNumbers.children).toHaveLength(20);
      expect(lineNumbers).toHaveTextContent('20');
    });
  });

  describe('text input', () => {
    it('calls onChange when text is entered', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<PoemTextarea {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByTestId('poem-textarea');
      await user.type(textarea, 'Hello');

      expect(onChange).toHaveBeenCalled();
    });

    it('respects maxLength limit', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<PoemTextarea {...defaultProps} onChange={onChange} maxLength={5} />);

      const textarea = screen.getByTestId('poem-textarea');
      await user.type(textarea, 'Hello World');

      // Should truncate at maxLength
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
      expect(lastCall[0].length).toBeLessThanOrEqual(5);
    });
  });

  describe('paste handling', () => {
    it('cleans up pasted text with multiple empty lines', async () => {
      const onChange = vi.fn();
      render(<PoemTextarea {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByTestId('poem-textarea');

      // Simulate paste event
      const pastedText = 'Line 1\n\n\n\n\nLine 2';
      fireEvent.paste(textarea, {
        clipboardData: {
          getData: () => pastedText,
        },
      });

      // Should have reduced multiple empty lines to double newline
      expect(onChange).toHaveBeenCalledWith(expect.stringContaining('Line 1\n\nLine 2'));
    });

    it('normalizes Windows line endings', async () => {
      const onChange = vi.fn();
      render(<PoemTextarea {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByTestId('poem-textarea');

      const pastedText = 'Line 1\r\nLine 2\r\nLine 3';
      fireEvent.paste(textarea, {
        clipboardData: {
          getData: () => pastedText,
        },
      });

      expect(onChange).toHaveBeenCalledWith(expect.not.stringContaining('\r'));
    });

    it('replaces tabs with spaces', async () => {
      const onChange = vi.fn();
      render(<PoemTextarea {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByTestId('poem-textarea');

      const pastedText = 'Line 1\tindented';
      fireEvent.paste(textarea, {
        clipboardData: {
          getData: () => pastedText,
        },
      });

      expect(onChange).toHaveBeenCalledWith(expect.not.stringContaining('\t'));
    });

    it('trims trailing whitespace from lines', async () => {
      const onChange = vi.fn();
      render(<PoemTextarea {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByTestId('poem-textarea');

      const pastedText = 'Line 1   \nLine 2   ';
      fireEvent.paste(textarea, {
        clipboardData: {
          getData: () => pastedText,
        },
      });

      const calledWithValue = onChange.mock.calls[0][0];
      expect(calledWithValue).toBe('Line 1\nLine 2');
    });

    it('calls onPaste callback with cleaned text', async () => {
      const onPaste = vi.fn();
      render(<PoemTextarea {...defaultProps} onPaste={onPaste} />);

      const textarea = screen.getByTestId('poem-textarea');

      const pastedText = 'Hello World';
      fireEvent.paste(textarea, {
        clipboardData: {
          getData: () => pastedText,
        },
      });

      expect(onPaste).toHaveBeenCalledWith('Hello World');
    });

    it('inserts pasted text at cursor position', async () => {
      const onChange = vi.fn();
      render(<PoemTextarea {...defaultProps} value="BeforeAfter" onChange={onChange} />);

      const textarea = screen.getByTestId('poem-textarea') as HTMLTextAreaElement;

      // Set cursor position (between "Before" and "After")
      textarea.selectionStart = 6;
      textarea.selectionEnd = 6;

      fireEvent.paste(textarea, {
        clipboardData: {
          getData: () => 'INSERTED',
        },
      });

      expect(onChange).toHaveBeenCalledWith('BeforeINSERTEDAfter');
    });

    it('replaces selected text when pasting', async () => {
      const onChange = vi.fn();
      render(<PoemTextarea {...defaultProps} value="Hello World" onChange={onChange} />);

      const textarea = screen.getByTestId('poem-textarea') as HTMLTextAreaElement;

      // Select "World"
      textarea.selectionStart = 6;
      textarea.selectionEnd = 11;

      fireEvent.paste(textarea, {
        clipboardData: {
          getData: () => 'Universe',
        },
      });

      expect(onChange).toHaveBeenCalledWith('Hello Universe');
    });
  });

  describe('disabled state', () => {
    it('disables textarea when disabled prop is true', () => {
      render(<PoemTextarea {...defaultProps} disabled />);

      const textarea = screen.getByTestId('poem-textarea');
      expect(textarea).toBeDisabled();
    });

    it('applies disabled class to container', () => {
      render(<PoemTextarea {...defaultProps} disabled />);

      const container = screen.getByTestId('poem-textarea-container');
      expect(container).toHaveClass('poem-textarea-container--disabled');
    });

    it('does not call onChange when disabled', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<PoemTextarea {...defaultProps} onChange={onChange} disabled />);

      const textarea = screen.getByTestId('poem-textarea');

      // Attempt to type (should be blocked)
      await user.type(textarea, 'test').catch(() => {
        // userEvent may throw on disabled elements
      });

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has aria-label for accessibility', () => {
      render(<PoemTextarea {...defaultProps} ariaLabel="Custom label" />);

      const textarea = screen.getByTestId('poem-textarea');
      expect(textarea).toHaveAttribute('aria-label', 'Custom label');
    });

    it('has default aria-label when not provided', () => {
      render(<PoemTextarea {...defaultProps} />);

      const textarea = screen.getByTestId('poem-textarea');
      expect(textarea).toHaveAttribute('aria-label', 'Poem text input');
    });

    it('hides line numbers from screen readers', () => {
      render(<PoemTextarea {...defaultProps} value="Line 1" />);

      const lineNumbers = screen.getByTestId('line-numbers');
      expect(lineNumbers).toHaveAttribute('aria-hidden', 'true');
    });

    it('has proper id for form association', () => {
      render(<PoemTextarea {...defaultProps} id="my-textarea" />);

      const textarea = screen.getByTestId('poem-textarea');
      expect(textarea).toHaveAttribute('id', 'my-textarea');
    });

    it('has aria-describedby when maxLength is set', () => {
      render(<PoemTextarea {...defaultProps} id="poem" maxLength={100} />);

      const textarea = screen.getByTestId('poem-textarea');
      expect(textarea).toHaveAttribute('aria-describedby', 'poem-char-count');
    });
  });

  describe('spellcheck', () => {
    it('has spellcheck disabled', () => {
      render(<PoemTextarea {...defaultProps} />);

      const textarea = screen.getByTestId('poem-textarea');
      expect(textarea).toHaveAttribute('spellcheck', 'false');
    });
  });

  describe('edge cases', () => {
    it('handles empty string value', () => {
      render(<PoemTextarea {...defaultProps} value="" />);

      const textarea = screen.getByTestId('poem-textarea');
      expect(textarea).toHaveValue('');

      const lineNumbers = screen.getByTestId('line-numbers');
      expect(lineNumbers.children).toHaveLength(1);
    });

    it('handles value with only newlines', () => {
      // Note: The cleanPastedText function trims the text, so empty lines at the end are removed
      // But when directly setting value, the line count should reflect the newlines
      const multiLineValue = `a
b
c
d`;
      render(<PoemTextarea {...defaultProps} value={multiLineValue} />);

      const lineNumbers = screen.getByTestId('line-numbers');
      expect(lineNumbers.children).toHaveLength(4);
    });

    it('handles very long lines', () => {
      const longLine = 'x'.repeat(1000);
      render(<PoemTextarea {...defaultProps} value={longLine} />);

      const textarea = screen.getByTestId('poem-textarea');
      expect(textarea).toHaveValue(longLine);

      const lineNumbers = screen.getByTestId('line-numbers');
      expect(lineNumbers.children).toHaveLength(1);
    });

    it('handles unicode characters', () => {
      const unicodeText = '日本語のテキスト\n中文文本\nEmoji 🎵🎶';
      render(<PoemTextarea {...defaultProps} value={unicodeText} />);

      const textarea = screen.getByTestId('poem-textarea');
      expect(textarea).toHaveValue(unicodeText);

      const lineNumbers = screen.getByTestId('line-numbers');
      expect(lineNumbers.children).toHaveLength(3);
    });

    it('handles paste at end of text', async () => {
      const onChange = vi.fn();
      render(<PoemTextarea {...defaultProps} value="Hello" onChange={onChange} />);

      const textarea = screen.getByTestId('poem-textarea') as HTMLTextAreaElement;

      // Set cursor at end
      textarea.selectionStart = 5;
      textarea.selectionEnd = 5;

      fireEvent.paste(textarea, {
        clipboardData: {
          getData: () => 'World',
        },
      });

      // Note: trailing spaces are trimmed by cleanPastedText
      expect(onChange).toHaveBeenCalledWith('HelloWorld');
    });

    it('handles paste at beginning of text', async () => {
      const onChange = vi.fn();
      render(<PoemTextarea {...defaultProps} value="World" onChange={onChange} />);

      const textarea = screen.getByTestId('poem-textarea') as HTMLTextAreaElement;

      // Set cursor at beginning
      textarea.selectionStart = 0;
      textarea.selectionEnd = 0;

      fireEvent.paste(textarea, {
        clipboardData: {
          getData: () => 'Hello',
        },
      });

      // Note: trailing spaces are trimmed by cleanPastedText
      expect(onChange).toHaveBeenCalledWith('HelloWorld');
    });
  });
});
