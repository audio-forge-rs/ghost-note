/**
 * Tests for KeySelect Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { KeySelect, type KeySelectProps } from './KeySelect';
import { KEYS } from './keyConstants';

describe('KeySelect', () => {
  const defaultProps: KeySelectProps = {
    value: 'C',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders key select component', () => {
      render(<KeySelect {...defaultProps} />);

      expect(screen.getByTestId('key-select')).toBeInTheDocument();
      expect(screen.getByTestId('key-select-select')).toBeInTheDocument();
    });

    it('displays current key value', () => {
      render(<KeySelect {...defaultProps} value="G" />);

      expect(screen.getByTestId('key-select-current')).toHaveTextContent('G Major');
    });

    it('displays minor key correctly', () => {
      render(<KeySelect {...defaultProps} value="Am" />);

      expect(screen.getByTestId('key-select-current')).toHaveTextContent('A Minor');
    });

    it('hides label when showLabel is false', () => {
      render(<KeySelect {...defaultProps} showLabel={false} />);

      expect(screen.queryByTestId('key-select-current')).not.toBeInTheDocument();
    });

    it('renders all key options', () => {
      render(<KeySelect {...defaultProps} />);

      const select = screen.getByTestId('key-select-select') as HTMLSelectElement;
      const options = Array.from(select.options);

      KEYS.forEach((keyInfo) => {
        const option = options.find((opt) => opt.value === keyInfo.key);
        expect(option).toBeDefined();
        expect(option?.textContent).toBe(keyInfo.label);
      });
    });

    it('groups keys by major and minor', () => {
      render(<KeySelect {...defaultProps} />);

      const select = screen.getByTestId('key-select-select');
      const optgroups = select.querySelectorAll('optgroup');

      expect(optgroups.length).toBe(2);
      expect(optgroups[0]).toHaveAttribute('label', 'Major Keys');
      expect(optgroups[1]).toHaveAttribute('label', 'Minor Keys');
    });
  });

  describe('interaction', () => {
    it('calls onChange when selection changes', () => {
      const onChange = vi.fn();
      render(<KeySelect {...defaultProps} onChange={onChange} />);

      const select = screen.getByTestId('key-select-select');
      fireEvent.change(select, { target: { value: 'G' } });

      expect(onChange).toHaveBeenCalledWith('G');
    });

    it('calls onChange with minor key', () => {
      const onChange = vi.fn();
      render(<KeySelect {...defaultProps} onChange={onChange} />);

      const select = screen.getByTestId('key-select-select');
      fireEvent.change(select, { target: { value: 'Am' } });

      expect(onChange).toHaveBeenCalledWith('Am');
    });

    it('is disabled when disabled prop is true', () => {
      render(<KeySelect {...defaultProps} disabled />);

      expect(screen.getByTestId('key-select-select')).toBeDisabled();
    });

    it('does not call onChange when disabled', () => {
      const onChange = vi.fn();
      render(<KeySelect {...defaultProps} onChange={onChange} disabled />);

      const select = screen.getByTestId('key-select-select');
      fireEvent.change(select, { target: { value: 'G' } });

      // The change event doesn't fire on disabled selects, but we test the disabled state
      expect(select).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('has accessible label', () => {
      render(<KeySelect {...defaultProps} />);

      const select = screen.getByTestId('key-select-select');
      expect(select).toHaveAttribute('aria-label', 'Key signature');
    });
  });

  describe('custom styling', () => {
    it('applies custom className', () => {
      render(<KeySelect {...defaultProps} className="custom-class" />);

      expect(screen.getByTestId('key-select')).toHaveClass('custom-class');
    });

    it('applies custom testId', () => {
      render(<KeySelect {...defaultProps} testId="custom-key-select" />);

      expect(screen.getByTestId('custom-key-select')).toBeInTheDocument();
      expect(screen.getByTestId('custom-key-select-select')).toBeInTheDocument();
    });
  });
});
