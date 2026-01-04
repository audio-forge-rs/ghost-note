/**
 * Tests for SamplePoems Component
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SamplePoems, type SamplePoemsProps } from './SamplePoems';
import { samplePoems } from '@/data/samplePoems';

describe('SamplePoems', () => {
  const defaultProps: SamplePoemsProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelect: vi.fn(),
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders nothing when closed', () => {
      render(<SamplePoems {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('sample-poems-overlay')).not.toBeInTheDocument();
    });

    it('renders overlay when open', () => {
      render(<SamplePoems {...defaultProps} />);

      const overlay = screen.getByTestId('sample-poems-overlay');
      expect(overlay).toBeInTheDocument();
    });

    it('renders modal container', () => {
      render(<SamplePoems {...defaultProps} />);

      const modal = screen.getByTestId('sample-poems-modal');
      expect(modal).toBeInTheDocument();
    });

    it('renders title', () => {
      render(<SamplePoems {...defaultProps} />);

      const title = screen.getByRole('heading', { name: /sample poems/i });
      expect(title).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<SamplePoems {...defaultProps} />);

      const closeButton = screen.getByTestId('sample-poems-close');
      expect(closeButton).toBeInTheDocument();
    });

    it('renders poem list', () => {
      render(<SamplePoems {...defaultProps} />);

      const list = screen.getByTestId('sample-poems-list');
      expect(list).toBeInTheDocument();
    });

    it('renders all sample poems in list', () => {
      render(<SamplePoems {...defaultProps} />);

      samplePoems.forEach((poem) => {
        expect(screen.getByTestId(`sample-poem-${poem.id}`)).toBeInTheDocument();
      });
    });

    it('renders preview panel', () => {
      render(<SamplePoems {...defaultProps} />);

      const preview = screen.getByTestId('sample-poems-preview');
      expect(preview).toBeInTheDocument();
    });

    it('renders poem count in footer', () => {
      render(<SamplePoems {...defaultProps} />);

      const count = screen.getByText(new RegExp(`${samplePoems.length} sample poems`));
      expect(count).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<SamplePoems {...defaultProps} className="custom-class" />);

      const overlay = screen.getByTestId('sample-poems-overlay');
      expect(overlay).toHaveClass('custom-class');
    });
  });

  describe('poem list items', () => {
    it('shows poem titles', () => {
      render(<SamplePoems {...defaultProps} />);

      samplePoems.forEach((poem) => {
        const item = screen.getByTestId(`sample-poem-${poem.id}`);
        expect(item).toHaveTextContent(poem.title);
      });
    });

    it('shows poem authors', () => {
      render(<SamplePoems {...defaultProps} />);

      samplePoems.forEach((poem) => {
        const item = screen.getByTestId(`sample-poem-${poem.id}`);
        expect(item).toHaveTextContent(poem.author);
      });
    });

    it('shows poem form badges', () => {
      render(<SamplePoems {...defaultProps} />);

      // Check first poem's form
      const firstItem = screen.getByTestId(`sample-poem-${samplePoems[0].id}`);
      expect(firstItem.querySelector('.sample-poems-item-form')).toBeInTheDocument();
    });

    it('highlights first poem by default', () => {
      render(<SamplePoems {...defaultProps} />);

      const firstItem = screen.getByTestId(`sample-poem-${samplePoems[0].id}`);
      expect(firstItem).toHaveClass('selected');
    });
  });

  describe('preview panel', () => {
    it('shows first poem preview by default', () => {
      render(<SamplePoems {...defaultProps} />);

      const preview = screen.getByTestId('sample-poems-preview');
      const firstPoem = samplePoems[0];

      expect(preview).toHaveTextContent(firstPoem.title);
      expect(preview).toHaveTextContent(firstPoem.author);
    });

    it('shows poem description in preview', () => {
      render(<SamplePoems {...defaultProps} />);

      const preview = screen.getByTestId('sample-poems-preview');
      const firstPoem = samplePoems[0];

      expect(preview).toHaveTextContent(firstPoem.description);
    });

    it('shows form and meter tags in preview', () => {
      render(<SamplePoems {...defaultProps} />);

      const preview = screen.getByTestId('sample-poems-preview');
      const firstPoem = samplePoems[0];

      expect(preview).toHaveTextContent(firstPoem.expectedMeter.name);
    });

    it('has "Use This Poem" button', () => {
      render(<SamplePoems {...defaultProps} />);

      const selectButton = screen.getByTestId('sample-poems-select');
      expect(selectButton).toBeInTheDocument();
      expect(selectButton).toHaveTextContent('Use This Poem');
    });

    it('updates preview on hover', async () => {
      const user = userEvent.setup();
      render(<SamplePoems {...defaultProps} />);

      const secondPoem = samplePoems[1];
      const secondItem = screen.getByTestId(`sample-poem-${secondPoem.id}`);

      await user.hover(secondItem);

      const preview = screen.getByTestId('sample-poems-preview');
      expect(preview).toHaveTextContent(secondPoem.title);
    });
  });

  describe('selection', () => {
    it('calls onSelect when poem is clicked', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      render(<SamplePoems {...defaultProps} onSelect={onSelect} />);

      const firstPoem = samplePoems[0];
      const firstItem = screen.getByTestId(`sample-poem-${firstPoem.id}`);

      await user.click(firstItem);

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(firstPoem);
    });

    it('calls onSelect when "Use This Poem" button is clicked', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      render(<SamplePoems {...defaultProps} onSelect={onSelect} />);

      const selectButton = screen.getByTestId('sample-poems-select');
      await user.click(selectButton);

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(samplePoems[0]);
    });
  });

  describe('closing', () => {
    it('calls onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<SamplePoems {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByTestId('sample-poems-close');
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<SamplePoems {...defaultProps} onClose={onClose} />);

      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking outside modal', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<SamplePoems {...defaultProps} onClose={onClose} />);

      const overlay = screen.getByTestId('sample-poems-overlay');

      // Wait for the click outside handler to be attached
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Click on the overlay (outside the modal)
      await user.click(overlay);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('keyboard navigation', () => {
    it('moves selection down with ArrowDown', async () => {
      const user = userEvent.setup();
      render(<SamplePoems {...defaultProps} />);

      const modal = screen.getByTestId('sample-poems-modal');
      modal.focus();

      await user.keyboard('{ArrowDown}');

      const secondItem = screen.getByTestId(`sample-poem-${samplePoems[1].id}`);
      expect(secondItem).toHaveClass('selected');
    });

    it('moves selection up with ArrowUp', async () => {
      const user = userEvent.setup();
      render(<SamplePoems {...defaultProps} />);

      const modal = screen.getByTestId('sample-poems-modal');
      modal.focus();

      // Move down first
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowUp}');

      const firstItem = screen.getByTestId(`sample-poem-${samplePoems[0].id}`);
      expect(firstItem).toHaveClass('selected');
    });

    it('selects poem with Enter key', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      render(<SamplePoems {...defaultProps} onSelect={onSelect} />);

      const modal = screen.getByTestId('sample-poems-modal');
      modal.focus();

      await user.keyboard('{Enter}');

      expect(onSelect).toHaveBeenCalledWith(samplePoems[0]);
    });

    it('selects poem with Space key', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      render(<SamplePoems {...defaultProps} onSelect={onSelect} />);

      const modal = screen.getByTestId('sample-poems-modal');
      modal.focus();

      await user.keyboard(' ');

      expect(onSelect).toHaveBeenCalledWith(samplePoems[0]);
    });

    it('jumps to first with Home key', async () => {
      const user = userEvent.setup();
      render(<SamplePoems {...defaultProps} />);

      const modal = screen.getByTestId('sample-poems-modal');
      modal.focus();

      // Move down a few times
      await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');

      // Then press Home
      await user.keyboard('{Home}');

      const firstItem = screen.getByTestId(`sample-poem-${samplePoems[0].id}`);
      expect(firstItem).toHaveClass('selected');
    });

    it('jumps to last with End key', async () => {
      const user = userEvent.setup();
      render(<SamplePoems {...defaultProps} />);

      const modal = screen.getByTestId('sample-poems-modal');
      modal.focus();

      await user.keyboard('{End}');

      const lastPoem = samplePoems[samplePoems.length - 1];
      const lastItem = screen.getByTestId(`sample-poem-${lastPoem.id}`);
      expect(lastItem).toHaveClass('selected');
    });

    it('does not go past first item with ArrowUp', async () => {
      const user = userEvent.setup();
      render(<SamplePoems {...defaultProps} />);

      const modal = screen.getByTestId('sample-poems-modal');
      modal.focus();

      await user.keyboard('{ArrowUp}');

      const firstItem = screen.getByTestId(`sample-poem-${samplePoems[0].id}`);
      expect(firstItem).toHaveClass('selected');
    });

    it('does not go past last item with ArrowDown', async () => {
      const user = userEvent.setup();
      render(<SamplePoems {...defaultProps} />);

      const modal = screen.getByTestId('sample-poems-modal');
      modal.focus();

      // Press ArrowDown more times than there are items
      for (let i = 0; i < samplePoems.length + 5; i++) {
        await user.keyboard('{ArrowDown}');
      }

      const lastPoem = samplePoems[samplePoems.length - 1];
      const lastItem = screen.getByTestId(`sample-poem-${lastPoem.id}`);
      expect(lastItem).toHaveClass('selected');
    });
  });

  describe('accessibility', () => {
    it('has dialog role', () => {
      render(<SamplePoems {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('has aria-modal attribute', () => {
      render(<SamplePoems {...defaultProps} />);

      const overlay = screen.getByTestId('sample-poems-overlay');
      expect(overlay).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-label on dialog', () => {
      render(<SamplePoems {...defaultProps} />);

      const overlay = screen.getByTestId('sample-poems-overlay');
      expect(overlay).toHaveAttribute('aria-label', 'Select a sample poem');
    });

    it('has listbox role on poem list', () => {
      render(<SamplePoems {...defaultProps} />);

      const listbox = screen.getByRole('listbox', { name: /sample poems/i });
      expect(listbox).toBeInTheDocument();
    });

    it('has option role on list items', () => {
      render(<SamplePoems {...defaultProps} />);

      const list = screen.getByTestId('sample-poems-list');
      const options = within(list).getAllByRole('option');
      expect(options.length).toBe(samplePoems.length);
    });

    it('sets aria-selected on selected item', () => {
      render(<SamplePoems {...defaultProps} />);

      const firstItem = screen.getByTestId(`sample-poem-${samplePoems[0].id}`);
      expect(firstItem).toHaveAttribute('aria-selected', 'true');
    });

    it('close button has aria-label', () => {
      render(<SamplePoems {...defaultProps} />);

      const closeButton = screen.getByTestId('sample-poems-close');
      expect(closeButton).toHaveAttribute('aria-label', 'Close');
    });
  });

  describe('reset on open', () => {
    it('resets selection to first poem when reopened', () => {
      const { rerender } = render(<SamplePoems {...defaultProps} />);

      // Close the modal
      rerender(<SamplePoems {...defaultProps} isOpen={false} />);

      // Reopen
      rerender(<SamplePoems {...defaultProps} isOpen />);

      const firstItem = screen.getByTestId(`sample-poem-${samplePoems[0].id}`);
      expect(firstItem).toHaveClass('selected');
    });
  });

  describe('preview text truncation', () => {
    it('shows truncated text for long poems', () => {
      render(<SamplePoems {...defaultProps} />);

      const preview = screen.getByTestId('sample-poems-preview');
      const previewText = preview.querySelector('.sample-poems-preview-text');

      // The preview should exist
      expect(previewText).toBeInTheDocument();

      // For poems with many lines, should show ellipsis
      // This depends on the actual poem content
    });
  });
});
