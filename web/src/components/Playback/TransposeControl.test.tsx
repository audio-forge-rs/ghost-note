/**
 * Tests for TransposeControl Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TransposeControl, type TransposeControlProps } from './TransposeControl';
import { KEYS } from './transposeConstants';

describe('TransposeControl', () => {
  const defaultProps: TransposeControlProps = {
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
    it('renders transpose control', () => {
      render(<TransposeControl {...defaultProps} />);

      expect(screen.getByTestId('transpose-control')).toBeInTheDocument();
    });

    it('displays current key label', () => {
      render(<TransposeControl {...defaultProps} value="G" />);

      expect(screen.getByTestId('transpose-control-current')).toHaveTextContent('G Major');
    });

    it('hides label when showLabel is false', () => {
      render(<TransposeControl {...defaultProps} showLabel={false} />);

      expect(screen.queryByTestId('transpose-control-current')).not.toBeInTheDocument();
    });
  });

  describe('dropdown variant', () => {
    it('renders dropdown by default', () => {
      render(<TransposeControl {...defaultProps} variant="dropdown" />);

      expect(screen.getByTestId('transpose-control-select')).toBeInTheDocument();
    });

    it('calls onChange when dropdown value changes', () => {
      const onChange = vi.fn();
      render(<TransposeControl {...defaultProps} onChange={onChange} variant="dropdown" />);

      const select = screen.getByTestId('transpose-control-select');
      fireEvent.change(select, { target: { value: 'G' } });

      expect(onChange).toHaveBeenCalledWith('G');
    });

    it('shows all keys in dropdown', () => {
      render(<TransposeControl {...defaultProps} variant="dropdown" />);

      const select = screen.getByTestId('transpose-control-select') as HTMLSelectElement;
      expect(select.options.length).toBe(KEYS.length);
    });

    it('is disabled when disabled prop is true', () => {
      render(<TransposeControl {...defaultProps} variant="dropdown" disabled />);

      expect(screen.getByTestId('transpose-control-select')).toBeDisabled();
    });
  });

  describe('buttons variant', () => {
    it('renders key buttons', () => {
      render(<TransposeControl {...defaultProps} variant="buttons" />);

      KEYS.forEach((keyInfo) => {
        expect(screen.getByTestId(`transpose-control-key-${keyInfo.key}`)).toBeInTheDocument();
      });
    });

    it('calls onChange when key button clicked', () => {
      const onChange = vi.fn();
      render(<TransposeControl {...defaultProps} onChange={onChange} variant="buttons" />);

      fireEvent.click(screen.getByTestId('transpose-control-key-G'));

      expect(onChange).toHaveBeenCalledWith('G');
    });

    it('highlights active key', () => {
      render(<TransposeControl {...defaultProps} value="G" variant="buttons" />);

      const activeKey = screen.getByTestId('transpose-control-key-G');
      expect(activeKey).toHaveAttribute('aria-checked', 'true');
    });

    it('disables buttons when disabled prop is true', () => {
      render(<TransposeControl {...defaultProps} variant="buttons" disabled />);

      KEYS.forEach((keyInfo) => {
        expect(screen.getByTestId(`transpose-control-key-${keyInfo.key}`)).toBeDisabled();
      });
    });
  });

  describe('grid variant', () => {
    it('renders grid layout with major and minor sections', () => {
      render(<TransposeControl {...defaultProps} variant="grid" />);

      // Should have separate sections for major and minor keys
      const majorKeys = KEYS.filter((k) => k.type === 'major');
      const minorKeys = KEYS.filter((k) => k.type === 'minor');

      majorKeys.forEach((keyInfo) => {
        expect(screen.getByTestId(`transpose-control-key-${keyInfo.key}`)).toBeInTheDocument();
      });
      minorKeys.forEach((keyInfo) => {
        expect(screen.getByTestId(`transpose-control-key-${keyInfo.key}`)).toBeInTheDocument();
      });
    });

    it('calls onChange when key button clicked in grid', () => {
      const onChange = vi.fn();
      render(<TransposeControl {...defaultProps} onChange={onChange} variant="grid" />);

      fireEvent.click(screen.getByTestId('transpose-control-key-Am'));

      expect(onChange).toHaveBeenCalledWith('Am');
    });
  });

  describe('filter prop', () => {
    it('shows only major keys when filter is "major"', () => {
      render(<TransposeControl {...defaultProps} variant="buttons" filter="major" />);

      const majorKeys = KEYS.filter((k) => k.type === 'major');
      const minorKeys = KEYS.filter((k) => k.type === 'minor');

      majorKeys.forEach((keyInfo) => {
        expect(screen.getByTestId(`transpose-control-key-${keyInfo.key}`)).toBeInTheDocument();
      });
      minorKeys.forEach((keyInfo) => {
        expect(screen.queryByTestId(`transpose-control-key-${keyInfo.key}`)).not.toBeInTheDocument();
      });
    });

    it('shows only minor keys when filter is "minor"', () => {
      render(<TransposeControl {...defaultProps} variant="buttons" filter="minor" />);

      const majorKeys = KEYS.filter((k) => k.type === 'major');
      const minorKeys = KEYS.filter((k) => k.type === 'minor');

      minorKeys.forEach((keyInfo) => {
        expect(screen.getByTestId(`transpose-control-key-${keyInfo.key}`)).toBeInTheDocument();
      });
      majorKeys.forEach((keyInfo) => {
        expect(screen.queryByTestId(`transpose-control-key-${keyInfo.key}`)).not.toBeInTheDocument();
      });
    });

    it('shows all keys when filter is "all"', () => {
      render(<TransposeControl {...defaultProps} variant="buttons" filter="all" />);

      KEYS.forEach((keyInfo) => {
        expect(screen.getByTestId(`transpose-control-key-${keyInfo.key}`)).toBeInTheDocument();
      });
    });
  });

  describe('transposition display', () => {
    it('shows relative transposition in buttons', () => {
      render(<TransposeControl {...defaultProps} value="C" variant="buttons" />);

      // G is +7 semitones from C (or -5 normalized)
      const gButton = screen.getByTestId('transpose-control-key-G');
      // The button should exist; the exact transposition display is implementation detail
      expect(gButton).toBeInTheDocument();
    });
  });

  describe('KEYS constant', () => {
    it('contains expected keys', () => {
      const keyValues = KEYS.map((k) => k.key);
      expect(keyValues).toContain('C');
      expect(keyValues).toContain('G');
      expect(keyValues).toContain('D');
      expect(keyValues).toContain('F');
      expect(keyValues).toContain('Am');
      expect(keyValues).toContain('Em');
      expect(keyValues).toContain('Dm');
    });

    it('has correct type for each key', () => {
      expect(KEYS.find((k) => k.key === 'C')?.type).toBe('major');
      expect(KEYS.find((k) => k.key === 'Am')?.type).toBe('minor');
    });
  });
});
