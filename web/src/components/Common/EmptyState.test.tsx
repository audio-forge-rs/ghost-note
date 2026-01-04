/**
 * Tests for EmptyState Component
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { EmptyState, type EmptyStateProps } from './EmptyState';

describe('EmptyState', () => {
  const defaultProps: EmptyStateProps = {
    title: 'Test Empty State',
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the empty state container', () => {
      render(<EmptyState {...defaultProps} />);

      const container = screen.getByTestId('empty-state');
      expect(container).toBeInTheDocument();
    });

    it('renders the title', () => {
      render(<EmptyState {...defaultProps} />);

      expect(screen.getByText('Test Empty State')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      render(
        <EmptyState
          {...defaultProps}
          description="This is a test description"
        />
      );

      expect(screen.getByText('This is a test description')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      render(<EmptyState {...defaultProps} />);

      const description = screen.queryByText(/description/i);
      expect(description).not.toBeInTheDocument();
    });

    it('renders icon when provided', () => {
      render(
        <EmptyState
          {...defaultProps}
          icon={<svg data-testid="test-icon"><circle r="5" /></svg>}
        />
      );

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('does not render icon container when icon not provided', () => {
      render(<EmptyState {...defaultProps} />);

      const iconContainer = document.querySelector('.empty-state__icon');
      expect(iconContainer).not.toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies default variant class', () => {
      render(<EmptyState {...defaultProps} />);

      const container = screen.getByTestId('empty-state');
      expect(container).toHaveClass('empty-state--default');
    });

    it('applies compact variant class', () => {
      render(<EmptyState {...defaultProps} variant="compact" />);

      const container = screen.getByTestId('empty-state');
      expect(container).toHaveClass('empty-state--compact');
    });

    it('applies centered variant class', () => {
      render(<EmptyState {...defaultProps} variant="centered" />);

      const container = screen.getByTestId('empty-state');
      expect(container).toHaveClass('empty-state--centered');
    });

    it('applies custom className', () => {
      render(<EmptyState {...defaultProps} className="custom-class" />);

      const container = screen.getByTestId('empty-state');
      expect(container).toHaveClass('empty-state', 'custom-class');
    });
  });

  describe('accessibility', () => {
    it('has role="status"', () => {
      render(<EmptyState {...defaultProps} />);

      const container = screen.getByTestId('empty-state');
      expect(container.getAttribute('role')).toBe('status');
    });

    it('has aria-label matching title', () => {
      render(<EmptyState {...defaultProps} />);

      const container = screen.getByTestId('empty-state');
      expect(container.getAttribute('aria-label')).toBe('Test Empty State');
    });

    it('hides icon from screen readers', () => {
      render(
        <EmptyState
          {...defaultProps}
          icon={<svg data-testid="test-icon"><circle r="5" /></svg>}
        />
      );

      const iconContainer = document.querySelector('.empty-state__icon');
      expect(iconContainer?.getAttribute('aria-hidden')).toBe('true');
    });

    it('uses custom testId when provided', () => {
      render(<EmptyState {...defaultProps} testId="custom-test-id" />);

      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });
  });

  describe('actions', () => {
    it('renders no actions when actions array is empty', () => {
      render(<EmptyState {...defaultProps} actions={[]} />);

      const actionsContainer = document.querySelector('.empty-state__actions');
      expect(actionsContainer).not.toBeInTheDocument();
    });

    it('renders action buttons', () => {
      const actions = [
        { label: 'Primary Action', onClick: vi.fn(), primary: true },
        { label: 'Secondary Action', onClick: vi.fn() },
      ];

      render(<EmptyState {...defaultProps} actions={actions} />);

      expect(screen.getByText('Primary Action')).toBeInTheDocument();
      expect(screen.getByText('Secondary Action')).toBeInTheDocument();
    });

    it('applies primary class to primary actions', () => {
      const actions = [
        { label: 'Primary Action', onClick: vi.fn(), primary: true },
      ];

      render(<EmptyState {...defaultProps} actions={actions} />);

      const button = screen.getByText('Primary Action');
      expect(button).toHaveClass('empty-state__action--primary');
    });

    it('applies secondary class to non-primary actions', () => {
      const actions = [
        { label: 'Secondary Action', onClick: vi.fn(), primary: false },
      ];

      render(<EmptyState {...defaultProps} actions={actions} />);

      const button = screen.getByText('Secondary Action');
      expect(button).toHaveClass('empty-state__action--secondary');
    });

    it('calls onClick when action button is clicked', () => {
      const onClick = vi.fn();
      const actions = [
        { label: 'Click Me', onClick },
      ];

      render(<EmptyState {...defaultProps} actions={actions} />);

      fireEvent.click(screen.getByText('Click Me'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('uses ariaLabel for button when provided', () => {
      const actions = [
        { label: 'Action', onClick: vi.fn(), ariaLabel: 'Custom aria label' },
      ];

      render(<EmptyState {...defaultProps} actions={actions} />);

      const button = screen.getByText('Action');
      expect(button.getAttribute('aria-label')).toBe('Custom aria label');
    });

    it('uses label as aria-label when ariaLabel not provided', () => {
      const actions = [
        { label: 'Action Label', onClick: vi.fn() },
      ];

      render(<EmptyState {...defaultProps} actions={actions} />);

      const button = screen.getByText('Action Label');
      expect(button.getAttribute('aria-label')).toBe('Action Label');
    });

    it('disables button when disabled is true', () => {
      const actions = [
        { label: 'Disabled Action', onClick: vi.fn(), disabled: true },
      ];

      render(<EmptyState {...defaultProps} actions={actions} />);

      const button = screen.getByText('Disabled Action');
      expect(button).toBeDisabled();
    });

    it('does not call onClick when disabled button is clicked', () => {
      const onClick = vi.fn();
      const actions = [
        { label: 'Disabled Action', onClick, disabled: true },
      ];

      render(<EmptyState {...defaultProps} actions={actions} />);

      fireEvent.click(screen.getByText('Disabled Action'));
      expect(onClick).not.toHaveBeenCalled();
    });

    it('renders multiple actions in correct order', () => {
      const actions = [
        { label: 'First', onClick: vi.fn() },
        { label: 'Second', onClick: vi.fn() },
        { label: 'Third', onClick: vi.fn() },
      ];

      render(<EmptyState {...defaultProps} actions={actions} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveTextContent('First');
      expect(buttons[1]).toHaveTextContent('Second');
      expect(buttons[2]).toHaveTextContent('Third');
    });
  });

  describe('complete empty state', () => {
    it('renders all elements together', () => {
      const onClick = vi.fn();

      render(
        <EmptyState
          icon={<svg data-testid="icon"><circle r="5" /></svg>}
          title="Complete Title"
          description="Complete description text"
          actions={[
            { label: 'Primary', onClick, primary: true },
            { label: 'Secondary', onClick },
          ]}
          variant="centered"
          className="custom"
          testId="complete-empty-state"
        />
      );

      expect(screen.getByTestId('complete-empty-state')).toBeInTheDocument();
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('Complete Title')).toBeInTheDocument();
      expect(screen.getByText('Complete description text')).toBeInTheDocument();
      expect(screen.getByText('Primary')).toBeInTheDocument();
      expect(screen.getByText('Secondary')).toBeInTheDocument();

      const container = screen.getByTestId('complete-empty-state');
      expect(container).toHaveClass('empty-state', 'empty-state--centered', 'custom');
    });
  });
});
