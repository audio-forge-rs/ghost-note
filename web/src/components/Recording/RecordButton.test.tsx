/**
 * RecordButton Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecordButton } from './RecordButton';

describe('RecordButton', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<RecordButton />);

      expect(screen.getByTestId('record-button')).toBeInTheDocument();
      expect(screen.getByTestId('record-button-control')).toBeInTheDocument();
    });

    it('should render in idle state by default', () => {
      render(<RecordButton />);

      const button = screen.getByTestId('record-button-control');
      expect(button).toHaveAttribute('data-state', 'idle');
      expect(button).toHaveAttribute('aria-label', 'Start recording');
    });

    it('should apply custom className', () => {
      render(<RecordButton className="custom-class" />);

      expect(screen.getByTestId('record-button')).toHaveClass('custom-class');
    });
  });

  describe('States', () => {
    it('should render idle state correctly', () => {
      render(<RecordButton state="idle" />);

      const container = screen.getByTestId('record-button');
      const button = screen.getByTestId('record-button-control');

      expect(container).toHaveClass('record-button--idle');
      expect(button).toHaveAttribute('data-state', 'idle');
      expect(button).toHaveAttribute('aria-label', 'Start recording');
      expect(button).not.toBeDisabled();
    });

    it('should render preparing state correctly', () => {
      render(<RecordButton state="preparing" />);

      const container = screen.getByTestId('record-button');
      const button = screen.getByTestId('record-button-control');

      expect(container).toHaveClass('record-button--preparing');
      expect(button).toHaveAttribute('data-state', 'preparing');
      expect(button).toHaveAttribute('aria-label', 'Preparing to record');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toBeDisabled();
    });

    it('should render recording state correctly', () => {
      render(<RecordButton state="recording" />);

      const container = screen.getByTestId('record-button');
      const button = screen.getByTestId('record-button-control');

      expect(container).toHaveClass('record-button--recording');
      expect(button).toHaveAttribute('data-state', 'recording');
      expect(button).toHaveAttribute('aria-label', 'Stop recording');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('should render paused state correctly', () => {
      render(<RecordButton state="paused" />);

      const container = screen.getByTestId('record-button');
      const button = screen.getByTestId('record-button-control');

      expect(container).toHaveClass('record-button--paused');
      expect(button).toHaveAttribute('data-state', 'paused');
      expect(button).toHaveAttribute('aria-label', 'Resume recording');
    });
  });

  describe('Pulse animation', () => {
    it('should show pulse when recording and showPulse is true', () => {
      render(<RecordButton state="recording" showPulse />);

      expect(screen.getByTestId('record-pulse')).toBeInTheDocument();
    });

    it('should not show pulse when recording but showPulse is false', () => {
      render(<RecordButton state="recording" showPulse={false} />);

      expect(screen.queryByTestId('record-pulse')).not.toBeInTheDocument();
    });

    it('should not show pulse when not recording', () => {
      render(<RecordButton state="idle" showPulse />);

      expect(screen.queryByTestId('record-pulse')).not.toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      render(<RecordButton size="small" />);

      expect(screen.getByTestId('record-button')).toHaveClass('record-button--small');
    });

    it('should render medium size by default', () => {
      render(<RecordButton />);

      expect(screen.getByTestId('record-button')).toHaveClass('record-button--medium');
    });

    it('should render large size', () => {
      render(<RecordButton size="large" />);

      expect(screen.getByTestId('record-button')).toHaveClass('record-button--large');
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<RecordButton onClick={handleClick} />);

      fireEvent.click(screen.getByTestId('record-button-control'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<RecordButton onClick={handleClick} disabled />);

      fireEvent.click(screen.getByTestId('record-button-control'));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when preparing', () => {
      const handleClick = vi.fn();
      render(<RecordButton onClick={handleClick} state="preparing" />);

      fireEvent.click(screen.getByTestId('record-button-control'));

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have correct aria-label for idle state', () => {
      render(<RecordButton state="idle" />);

      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Start recording');
    });

    it('should have correct aria-label for recording state', () => {
      render(<RecordButton state="recording" />);

      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Stop recording');
    });

    it('should accept custom aria-label', () => {
      render(<RecordButton aria-label="Custom label" />);

      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Custom label');
    });

    it('should be focusable', () => {
      render(<RecordButton />);

      const button = screen.getByRole('button');
      button.focus();

      expect(document.activeElement).toBe(button);
    });

    it('should not be focusable when disabled', () => {
      render(<RecordButton disabled />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });
});
