/**
 * Tests for NotationDisplay Component
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { NotationDisplay, type NotationDisplayProps } from './NotationDisplay';

// Mock the abcRenderer module
vi.mock('@/lib/music/abcRenderer', () => ({
  renderABC: vi.fn(() => ({
    tuneObjects: [{ tuneNumber: 0 }],
    success: true,
  })),
}));

describe('NotationDisplay', () => {
  const defaultProps: NotationDisplayProps = {
    abc: `X:1
T:Test
M:4/4
K:C
CDEF|GABc|`,
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the notation container', () => {
      render(<NotationDisplay {...defaultProps} />);

      const container = screen.getByTestId('notation-display');
      expect(container).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<NotationDisplay {...defaultProps} className="custom-class" />);

      const container = screen.getByTestId('notation-display');
      expect(container).toHaveClass('notation-display', 'custom-class');
    });

    it('applies custom id', () => {
      render(<NotationDisplay {...defaultProps} id="custom-id" />);

      const container = document.getElementById('custom-id');
      expect(container).toBeTruthy();
    });

    it('generates unique id when not provided', () => {
      // Render first component
      render(<NotationDisplay {...defaultProps} />);
      const container1 = screen.getByTestId('notation-display');
      const id1 = container1.id;

      // Cleanup and render a new component
      cleanup();
      render(<NotationDisplay {...defaultProps} />);
      const container2 = screen.getByTestId('notation-display');
      const id2 = container2.id;

      expect(id1).toMatch(/notation-display-\d+/);
      expect(id2).toMatch(/notation-display-\d+/);
    });

    it('applies custom style', () => {
      render(
        <NotationDisplay
          {...defaultProps}
          style={{ marginTop: '20px', padding: '20px' }}
        />
      );

      const container = screen.getByTestId('notation-display');
      // Check that custom styles are applied via the style attribute
      expect(container.style.marginTop).toBe('20px');
      expect(container.style.padding).toBe('20px');
    });

    it('has correct accessibility attributes', () => {
      render(<NotationDisplay {...defaultProps} />);

      const container = screen.getByTestId('notation-display');
      expect(container.getAttribute('role')).toBe('img');
      expect(container.getAttribute('aria-label')).toBe('Music notation');
    });
  });

  describe('callbacks', () => {
    it('calls onRenderComplete on successful render', async () => {
      const onRenderComplete = vi.fn();

      render(
        <NotationDisplay {...defaultProps} onRenderComplete={onRenderComplete} />
      );

      // Wait for effect to run
      await vi.waitFor(() => {
        expect(onRenderComplete).toHaveBeenCalled();
      });
    });

    it('passes render result to onRenderComplete', async () => {
      const onRenderComplete = vi.fn();

      render(
        <NotationDisplay {...defaultProps} onRenderComplete={onRenderComplete} />
      );

      await vi.waitFor(() => {
        expect(onRenderComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            tuneObjects: expect.any(Array),
          })
        );
      });
    });
  });

  describe('error handling', () => {
    it('calls onRenderError when rendering fails', async () => {
      const { renderABC } = await import('@/lib/music/abcRenderer');
      (renderABC as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        tuneObjects: [],
        success: false,
        error: 'Test error message',
      });

      const onRenderError = vi.fn();

      render(
        <NotationDisplay {...defaultProps} onRenderError={onRenderError} />
      );

      await vi.waitFor(() => {
        expect(onRenderError).toHaveBeenCalledWith('Test error message');
      });
    });
  });

  describe('props updates', () => {
    it('re-renders when ABC changes', async () => {
      const { renderABC } = await import('@/lib/music/abcRenderer');

      const { rerender } = render(<NotationDisplay {...defaultProps} />);

      await vi.waitFor(() => {
        expect(renderABC).toHaveBeenCalledTimes(1);
      });

      rerender(
        <NotationDisplay
          {...defaultProps}
          abc={`X:1\nT:Different\nK:G\nGABc|`}
        />
      );

      await vi.waitFor(() => {
        expect(renderABC).toHaveBeenCalledTimes(2);
      });
    });

    it('re-renders when scale changes', async () => {
      const { renderABC } = await import('@/lib/music/abcRenderer');

      const { rerender } = render(<NotationDisplay {...defaultProps} scale={1} />);

      await vi.waitFor(() => {
        expect(renderABC).toHaveBeenCalledTimes(1);
      });

      rerender(<NotationDisplay {...defaultProps} scale={1.5} />);

      await vi.waitFor(() => {
        expect(renderABC).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('responsive behavior', () => {
    it('enables responsive mode by default', async () => {
      const { renderABC } = await import('@/lib/music/abcRenderer');

      render(<NotationDisplay {...defaultProps} />);

      await vi.waitFor(() => {
        expect(renderABC).toHaveBeenCalledWith(
          defaultProps.abc,
          expect.any(String),
          expect.objectContaining({ responsive: 'resize' })
        );
      });
    });

    it('disables responsive mode when responsive=false', async () => {
      const { renderABC } = await import('@/lib/music/abcRenderer');

      render(<NotationDisplay {...defaultProps} responsive={false} />);

      await vi.waitFor(() => {
        expect(renderABC).toHaveBeenCalledWith(
          defaultProps.abc,
          expect.any(String),
          expect.objectContaining({ responsive: undefined })
        );
      });
    });
  });

  describe('padding options', () => {
    it('passes padding options to renderABC', async () => {
      const { renderABC } = await import('@/lib/music/abcRenderer');

      render(
        <NotationDisplay
          {...defaultProps}
          padding={{ top: 10, bottom: 15, left: 20, right: 25 }}
        />
      );

      await vi.waitFor(() => {
        expect(renderABC).toHaveBeenCalledWith(
          defaultProps.abc,
          expect.any(String),
          expect.objectContaining({
            paddingtop: 10,
            paddingbottom: 15,
            paddingleft: 20,
            paddingright: 25,
          })
        );
      });
    });
  });

  describe('staff width', () => {
    it('passes staffWidth option to renderABC', async () => {
      const { renderABC } = await import('@/lib/music/abcRenderer');

      render(<NotationDisplay {...defaultProps} staffWidth={800} />);

      await vi.waitFor(() => {
        expect(renderABC).toHaveBeenCalledWith(
          defaultProps.abc,
          expect.any(String),
          expect.objectContaining({ staffwidth: 800 })
        );
      });
    });
  });
});
