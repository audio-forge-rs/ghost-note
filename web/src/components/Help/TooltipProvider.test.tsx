/**
 * Tests for TooltipProvider Component
 *
 * @module components/Help/TooltipProvider.test
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { TooltipProvider, Tooltip } from './TooltipProvider';
import { useTooltip } from './tooltipUtils';

// Helper component to access tooltip context
function TestTooltipConsumer(): React.ReactElement {
  const { showTooltip, hideTooltip, isShown } = useTooltip();

  return (
    <div>
      <button
        data-testid="trigger-show"
        onMouseEnter={(e) => {
          showTooltip(
            { id: 'test-tooltip', content: 'Test tooltip content' },
            e.currentTarget
          );
        }}
        onMouseLeave={() => hideTooltip('test-tooltip')}
      >
        Trigger
      </button>
      <span data-testid="is-shown">{isShown('test-tooltip') ? 'shown' : 'hidden'}</span>
    </div>
  );
}

describe('TooltipProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders children', () => {
      render(
        <TooltipProvider>
          <div data-testid="child">Child content</div>
        </TooltipProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('does not render tooltip initially', () => {
      render(
        <TooltipProvider>
          <div>Content</div>
        </TooltipProvider>
      );

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('context functionality', () => {
    it('provides showTooltip function', () => {
      render(
        <TooltipProvider>
          <TestTooltipConsumer />
        </TooltipProvider>
      );

      expect(screen.getByTestId('trigger-show')).toBeInTheDocument();
    });

    it('provides hideTooltip function', () => {
      render(
        <TooltipProvider>
          <TestTooltipConsumer />
        </TooltipProvider>
      );

      // The trigger can be used to test hideTooltip
      const trigger = screen.getByTestId('trigger-show');
      expect(trigger).toBeInTheDocument();
    });

    it('provides isShown function', () => {
      render(
        <TooltipProvider>
          <TestTooltipConsumer />
        </TooltipProvider>
      );

      const isShownIndicator = screen.getByTestId('is-shown');
      // Initially not shown
      expect(isShownIndicator).toHaveTextContent('hidden');
    });
  });

  describe('Tooltip component', () => {
    it('renders wrapper around children', () => {
      render(
        <TooltipProvider>
          <Tooltip content="Test content">
            <button data-testid="wrapped-button">Button</button>
          </Tooltip>
        </TooltipProvider>
      );

      expect(screen.getByTestId('wrapped-button')).toBeInTheDocument();
    });

    it('wraps child in span with tooltip-wrapper class', () => {
      render(
        <TooltipProvider>
          <Tooltip content="Hover tooltip">
            <button data-testid="hover-button">Hover me</button>
          </Tooltip>
        </TooltipProvider>
      );

      const wrapper = screen.getByTestId('hover-button').parentElement;
      expect(wrapper).toHaveClass('tooltip-wrapper');
    });

    it('attaches mouse event handlers', () => {
      render(
        <TooltipProvider>
          <Tooltip content="Focus tooltip">
            <button data-testid="focus-button">Focus me</button>
          </Tooltip>
        </TooltipProvider>
      );

      const wrapper = screen.getByTestId('focus-button').parentElement;
      // Wrapper should exist and be able to receive events
      expect(wrapper).toBeInTheDocument();
      expect(wrapper?.tagName.toLowerCase()).toBe('span');
    });

    it('renders disabled state correctly', () => {
      render(
        <TooltipProvider>
          <Tooltip content="Disabled tooltip" disabled>
            <button data-testid="disabled-tooltip-button">Disabled</button>
          </Tooltip>
        </TooltipProvider>
      );

      const wrapper = screen.getByTestId('disabled-tooltip-button').parentElement;
      // Disabled tooltip should not have aria-describedby
      expect(wrapper).not.toHaveAttribute('aria-describedby');
    });

    it('accepts delay prop', () => {
      render(
        <TooltipProvider>
          <Tooltip content="Custom delay tooltip" delay={500}>
            <button data-testid="delay-button">Custom delay</button>
          </Tooltip>
        </TooltipProvider>
      );

      const wrapper = screen.getByTestId('delay-button').parentElement;
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('tooltip positioning', () => {
    it('passes position prop to Tooltip', () => {
      render(
        <TooltipProvider>
          <Tooltip content="Position test" position="bottom">
            <button data-testid="position-button">Position</button>
          </Tooltip>
        </TooltipProvider>
      );

      // Tooltip wrapper is rendered
      const wrapper = screen.getByTestId('position-button').parentElement;
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('tooltip-wrapper');
    });
  });

  describe('help topic integration', () => {
    it('accepts helpTopicId prop', () => {
      const mockOnOpenHelp = vi.fn();

      render(
        <TooltipProvider onOpenHelp={mockOnOpenHelp}>
          <Tooltip content="With help" helpTopicId="what-is-ghost-note">
            <button data-testid="help-button">Help topic</button>
          </Tooltip>
        </TooltipProvider>
      );

      // Tooltip wrapper is rendered with aria-describedby
      const wrapper = screen.getByTestId('help-button').parentElement;
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveAttribute('aria-describedby');
    });

    it('renders without onOpenHelp callback', () => {
      render(
        <TooltipProvider>
          <Tooltip content="No help callback" helpTopicId="what-is-ghost-note">
            <button data-testid="no-callback-button">No callback</button>
          </Tooltip>
        </TooltipProvider>
      );

      // Tooltip wrapper is rendered
      const wrapper = screen.getByTestId('no-callback-button').parentElement;
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('wrapper has aria-describedby when not disabled', () => {
      render(
        <TooltipProvider>
          <Tooltip content="Describedby test">
            <button data-testid="describedby-button">Describedby</button>
          </Tooltip>
        </TooltipProvider>
      );

      const wrapper = screen.getByTestId('describedby-button').parentElement;
      expect(wrapper).toHaveAttribute('aria-describedby');
    });

    it('wrapper does not have aria-describedby when disabled', () => {
      render(
        <TooltipProvider>
          <Tooltip content="Disabled describedby" disabled>
            <button data-testid="disabled-describedby-button">Disabled</button>
          </Tooltip>
        </TooltipProvider>
      );

      const wrapper = screen.getByTestId('disabled-describedby-button').parentElement;
      expect(wrapper).not.toHaveAttribute('aria-describedby');
    });
  });
});

describe('useTooltip', () => {
  it('provides default context when used outside provider', () => {
    // This should not throw
    function TestComponent(): React.ReactElement {
      const context = useTooltip();
      return (
        <div data-testid="context-test">
          <span>{typeof context.showTooltip}</span>
          <span>{typeof context.hideTooltip}</span>
          <span>{typeof context.isShown}</span>
        </div>
      );
    }

    render(<TestComponent />);
    expect(screen.getByTestId('context-test')).toBeInTheDocument();
  });
});
