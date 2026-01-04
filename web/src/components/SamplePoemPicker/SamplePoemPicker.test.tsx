/**
 * Tests for SamplePoemPicker Component
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SamplePoemPicker, type SamplePoemPickerProps } from './SamplePoemPicker';
import { samplePoems } from '@/data/samplePoems';

describe('SamplePoemPicker', () => {
  const defaultProps: SamplePoemPickerProps = {
    onSelect: vi.fn(),
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the picker container', () => {
      render(<SamplePoemPicker {...defaultProps} />);

      const picker = screen.getByTestId('sample-poem-picker');
      expect(picker).toBeInTheDocument();
    });

    it('renders the search input', () => {
      render(<SamplePoemPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search by title/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('renders the form filter dropdown', () => {
      render(<SamplePoemPicker {...defaultProps} />);

      const formFilter = screen.getByLabelText(/filter by poem form/i);
      expect(formFilter).toBeInTheDocument();
    });

    it('renders all sample poems in the list', () => {
      render(<SamplePoemPicker {...defaultProps} />);

      // Each poem should have a testid
      samplePoems.forEach((poem) => {
        expect(screen.getByTestId(`poem-item-${poem.id}`)).toBeInTheDocument();
      });
    });

    it('renders the results count', () => {
      render(<SamplePoemPicker {...defaultProps} />);

      const count = screen.getByText(new RegExp(`${samplePoems.length} poems`));
      expect(count).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<SamplePoemPicker {...defaultProps} className="custom-class" />);

      const picker = screen.getByTestId('sample-poem-picker');
      expect(picker).toHaveClass('sample-poem-picker', 'custom-class');
    });
  });

  describe('preview panel', () => {
    it('shows preview panel by default', () => {
      render(<SamplePoemPicker {...defaultProps} />);

      const preview = screen.getByTestId('poem-preview');
      expect(preview).toBeInTheDocument();
    });

    it('hides preview panel when showPreview is false', () => {
      render(<SamplePoemPicker {...defaultProps} showPreview={false} />);

      expect(screen.queryByTestId('poem-preview')).not.toBeInTheDocument();
    });

    it('shows the first poem in preview by default', () => {
      render(<SamplePoemPicker {...defaultProps} />);

      const preview = screen.getByTestId('poem-preview');
      const firstPoem = samplePoems[0];
      // Use class selector for the title in preview
      const previewTitle = within(preview).getByRole('heading', { level: 3 });
      expect(previewTitle).toHaveTextContent(firstPoem.title);
    });

    it('shows poem details in preview', () => {
      render(<SamplePoemPicker {...defaultProps} />);

      const preview = screen.getByTestId('poem-preview');
      const firstPoem = samplePoems[0];

      // Check for meter info
      expect(preview).toHaveTextContent(firstPoem.expectedMeter.name);

      // Check for description
      expect(preview).toHaveTextContent(firstPoem.description);
    });

    it('shows poem tags in preview', () => {
      render(<SamplePoemPicker {...defaultProps} />);

      const preview = screen.getByTestId('poem-preview');
      const firstPoem = samplePoems[0];
      const tagsContainer = within(preview).getByText(firstPoem.tags[0]);
      expect(tagsContainer).toBeInTheDocument();
    });

    it('shows "Use This Poem" button', () => {
      render(<SamplePoemPicker {...defaultProps} />);

      const button = screen.getByRole('button', { name: /use this poem/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('calls onSelect when a poem is clicked', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      render(<SamplePoemPicker {...defaultProps} onSelect={onSelect} />);

      const poemItem = screen.getByTestId('poem-item-shakespeare-sonnet-18');
      await user.click(poemItem);

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'shakespeare-sonnet-18',
          title: 'Sonnet 18',
        })
      );
    });

    it('calls onSelect when "Use This Poem" button is clicked', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      render(<SamplePoemPicker {...defaultProps} onSelect={onSelect} />);

      const button = screen.getByRole('button', { name: /use this poem/i });
      await user.click(button);

      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('highlights the selected poem', () => {
      render(
        <SamplePoemPicker
          {...defaultProps}
          selectedPoemId="shakespeare-sonnet-18"
        />
      );

      const poemItem = screen.getByTestId('poem-item-shakespeare-sonnet-18');
      expect(poemItem).toHaveClass('selected');
    });

    it('supports keyboard selection with Enter', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      render(<SamplePoemPicker {...defaultProps} onSelect={onSelect} />);

      const poemItem = screen.getByTestId('poem-item-shakespeare-sonnet-18');
      poemItem.focus();
      await user.keyboard('{Enter}');

      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('supports keyboard selection with Space', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      render(<SamplePoemPicker {...defaultProps} onSelect={onSelect} />);

      const poemItem = screen.getByTestId('poem-item-shakespeare-sonnet-18');
      poemItem.focus();
      await user.keyboard(' ');

      expect(onSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe('search', () => {
    it('filters poems by title', async () => {
      const user = userEvent.setup();
      render(<SamplePoemPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search by title/i);
      await user.type(searchInput, 'Sonnet');

      // Should find Shakespeare's Sonnet
      expect(screen.getByTestId('poem-item-shakespeare-sonnet-18')).toBeInTheDocument();

      // Should not show other poems
      expect(screen.queryByTestId('poem-item-frost-road-not-taken')).not.toBeInTheDocument();
    });

    it('filters poems by author', async () => {
      const user = userEvent.setup();
      render(<SamplePoemPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search by title/i);
      await user.type(searchInput, 'Shakespeare');

      expect(screen.getByTestId('poem-item-shakespeare-sonnet-18')).toBeInTheDocument();
    });

    it('shows no results message when search has no matches', async () => {
      const user = userEvent.setup();
      render(<SamplePoemPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search by title/i);
      await user.type(searchInput, 'xyznonexistent123');

      expect(screen.getByText(/no poems found/i)).toBeInTheDocument();
    });

    it('updates results count when filtering', async () => {
      const user = userEvent.setup();
      render(<SamplePoemPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search by title/i);
      await user.type(searchInput, 'Shakespeare');

      expect(screen.getByText(/showing 1 of/i)).toBeInTheDocument();
    });

    it('is case insensitive', async () => {
      const user = userEvent.setup();
      render(<SamplePoemPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search by title/i);
      await user.type(searchInput, 'SHAKESPEARE');

      expect(screen.getByTestId('poem-item-shakespeare-sonnet-18')).toBeInTheDocument();
    });
  });

  describe('form filter', () => {
    it('shows all forms in dropdown', () => {
      render(<SamplePoemPicker {...defaultProps} />);

      const formFilter = screen.getByLabelText(/filter by poem form/i);
      expect(within(formFilter).getByText('All Forms')).toBeInTheDocument();
    });

    it('filters poems by form', async () => {
      const user = userEvent.setup();
      render(<SamplePoemPicker {...defaultProps} />);

      const formFilter = screen.getByLabelText(/filter by poem form/i);
      await user.selectOptions(formFilter, 'sonnet');

      // Should show sonnet
      expect(screen.getByTestId('poem-item-shakespeare-sonnet-18')).toBeInTheDocument();

      // Should not show haiku
      expect(screen.queryByTestId('poem-item-basho-old-pond')).not.toBeInTheDocument();
    });

    it('combines with search filter', async () => {
      const user = userEvent.setup();
      render(<SamplePoemPicker {...defaultProps} />);

      // First filter by form
      const formFilter = screen.getByLabelText(/filter by poem form/i);
      await user.selectOptions(formFilter, 'lyric');

      // Then search within that form
      const searchInput = screen.getByPlaceholderText(/search by title/i);
      await user.type(searchInput, 'Tyger');

      expect(screen.getByTestId('poem-item-blake-tyger')).toBeInTheDocument();
    });
  });

  describe('hover preview', () => {
    it('updates preview when hovering over a poem', async () => {
      const user = userEvent.setup();
      render(<SamplePoemPicker {...defaultProps} />);

      const preview = screen.getByTestId('poem-preview');

      // Hover over a different poem
      const frostPoem = screen.getByTestId('poem-item-frost-road-not-taken');
      await user.hover(frostPoem);

      // Preview should show Frost poem
      const previewTitle = within(preview).getByRole('heading', { level: 3 });
      expect(previewTitle).toHaveTextContent('The Road Not Taken');
    });
  });

  describe('disabled state', () => {
    it('disables search input when disabled', () => {
      render(<SamplePoemPicker {...defaultProps} disabled />);

      const searchInput = screen.getByPlaceholderText(/search by title/i);
      expect(searchInput).toBeDisabled();
    });

    it('disables form filter when disabled', () => {
      render(<SamplePoemPicker {...defaultProps} disabled />);

      const formFilter = screen.getByLabelText(/filter by poem form/i);
      expect(formFilter).toBeDisabled();
    });

    it('disables poem selection when disabled', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      render(<SamplePoemPicker {...defaultProps} onSelect={onSelect} disabled />);

      const poemItem = screen.getByTestId('poem-item-shakespeare-sonnet-18');
      await user.click(poemItem);

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('disables Use This Poem button when disabled', () => {
      render(<SamplePoemPicker {...defaultProps} disabled />);

      const button = screen.getByRole('button', { name: /use this poem/i });
      expect(button).toBeDisabled();
    });

    it('applies disabled class to poem items', () => {
      render(<SamplePoemPicker {...defaultProps} disabled />);

      const poemItem = screen.getByTestId('poem-item-shakespeare-sonnet-18');
      expect(poemItem).toHaveClass('disabled');
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA labels on search input', () => {
      render(<SamplePoemPicker {...defaultProps} />);

      const searchInput = screen.getByRole('textbox', { name: /search poems/i });
      expect(searchInput).toBeInTheDocument();
    });

    it('has proper ARIA labels on form filter', () => {
      render(<SamplePoemPicker {...defaultProps} />);

      const formFilter = screen.getByRole('combobox', { name: /filter by poem form/i });
      expect(formFilter).toBeInTheDocument();
    });

    it('has listbox role on poem list', () => {
      render(<SamplePoemPicker {...defaultProps} />);

      const list = screen.getByRole('listbox', { name: /sample poems/i });
      expect(list).toBeInTheDocument();
    });

    it('has option role on poem items', () => {
      render(<SamplePoemPicker {...defaultProps} />);

      // Get options within the poem list specifically (not the dropdown)
      const poemList = screen.getByRole('listbox', { name: /sample poems/i });
      const options = within(poemList).getAllByRole('option');
      expect(options.length).toBe(samplePoems.length);
    });

    it('sets aria-selected on selected poem', () => {
      render(
        <SamplePoemPicker
          {...defaultProps}
          selectedPoemId="shakespeare-sonnet-18"
        />
      );

      const selectedItem = screen.getByTestId('poem-item-shakespeare-sonnet-18');
      expect(selectedItem).toHaveAttribute('aria-selected', 'true');
    });

    it('has aria-live on preview panel', () => {
      render(<SamplePoemPicker {...defaultProps} />);

      const preview = screen.getByTestId('poem-preview');
      expect(preview).toHaveAttribute('aria-live', 'polite');
    });

    it('has status role on no results message', async () => {
      const user = userEvent.setup();
      render(<SamplePoemPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search by title/i);
      await user.type(searchInput, 'xyznonexistent123');

      const noResults = screen.getByRole('status');
      expect(noResults).toHaveTextContent(/no poems found/i);
    });

    it('poem items are focusable', () => {
      render(<SamplePoemPicker {...defaultProps} />);

      const poemItem = screen.getByTestId('poem-item-shakespeare-sonnet-18');
      expect(poemItem).toHaveAttribute('tabindex', '0');
    });

    it('disabled poem items are not focusable', () => {
      render(<SamplePoemPicker {...defaultProps} disabled />);

      const poemItem = screen.getByTestId('poem-item-shakespeare-sonnet-18');
      expect(poemItem).toHaveAttribute('tabindex', '-1');
    });
  });

  describe('poem data display', () => {
    it('displays poem form badge correctly', () => {
      render(<SamplePoemPicker {...defaultProps} />);

      // Check that at least one sonnet badge exists
      const sonnetPoem = screen.getByTestId('poem-item-shakespeare-sonnet-18');
      expect(sonnetPoem).toHaveTextContent('Sonnet');
    });

    it('displays year when available', () => {
      render(<SamplePoemPicker {...defaultProps} />);

      // Shakespeare's sonnet has year 1609
      const poemItem = screen.getByTestId('poem-item-shakespeare-sonnet-18');
      expect(poemItem).toHaveTextContent('1609');
    });

    it('displays source in preview when available', () => {
      render(<SamplePoemPicker {...defaultProps} />);

      const preview = screen.getByTestId('poem-preview');
      const firstPoem = samplePoems[0];

      if (firstPoem.source) {
        // Check that the source text is displayed
        expect(preview).toHaveTextContent('Source:');
        expect(preview).toHaveTextContent(firstPoem.source);
      }
    });
  });
});
