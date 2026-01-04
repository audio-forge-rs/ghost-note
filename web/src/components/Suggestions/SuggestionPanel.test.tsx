/**
 * Tests for SuggestionPanel Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { SuggestionPanel, type SuggestionPanelProps } from './SuggestionPanel';
import { useSuggestionStore } from '../../stores/useSuggestionStore';
import { usePoemStore } from '../../stores/usePoemStore';
import type { Suggestion } from '../../lib/claude/types';

describe('SuggestionPanel', () => {
  const mockSuggestions: Suggestion[] = [
    {
      originalWord: 'beautiful',
      suggestedWord: 'lovely',
      lineNumber: 1,
      position: 0,
      reason: 'Better for singing',
      preservesMeaning: 'yes',
    },
    {
      originalWord: 'walking',
      suggestedWord: 'strolling',
      lineNumber: 2,
      position: 1,
      reason: 'Matches meter',
      preservesMeaning: 'partial',
    },
  ];

  const defaultProps: SuggestionPanelProps = {
    onGetSuggestions: vi.fn(),
    onApplyToLyrics: vi.fn(),
    canGetSuggestions: true,
  };

  beforeEach(() => {
    // Reset stores before each test (no act needed - these are Zustand store updates)
    useSuggestionStore.getState().reset();
    usePoemStore.getState().reset();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the panel container', () => {
      render(<SuggestionPanel {...defaultProps} />);

      expect(screen.getByTestId('suggestion-panel')).toBeInTheDocument();
    });

    it('renders the header with title', () => {
      render(<SuggestionPanel {...defaultProps} />);

      expect(screen.getByText('Suggestions')).toBeInTheDocument();
    });

    it('renders custom title', () => {
      render(<SuggestionPanel {...defaultProps} title="Custom Title" />);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('hides header when showHeader is false', () => {
      render(<SuggestionPanel {...defaultProps} showHeader={false} />);

      expect(screen.queryByText('Suggestions')).not.toBeInTheDocument();
    });
  });

  describe('empty states', () => {
    it('shows no lyrics empty state when no lyrics', () => {
      render(<SuggestionPanel {...defaultProps} />);

      expect(screen.getByTestId('suggestion-panel-empty-no-lyrics')).toBeInTheDocument();
      expect(screen.getByText('No lyrics yet')).toBeInTheDocument();
    });

    it('shows no suggestions empty state when lyrics exist but no suggestions', () => {
      usePoemStore.getState().setPoem('Test poem content');

      render(<SuggestionPanel {...defaultProps} />);

      expect(screen.getByTestId('suggestion-panel-empty-idle')).toBeInTheDocument();
      expect(screen.getByText('No suggestions yet')).toBeInTheDocument();
    });

    it('shows Get Suggestions button in empty state when lyrics exist', () => {
      usePoemStore.getState().setPoem('Test poem content');

      render(<SuggestionPanel {...defaultProps} />);

      const button = screen.getByRole('button', { name: /get suggestions/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows loading spinner when loading', () => {
      usePoemStore.getState().setPoem('Test poem content');
      useSuggestionStore.getState().setLoading(true);

      render(<SuggestionPanel {...defaultProps} />);

      expect(screen.getByTestId('suggestion-panel-loading')).toBeInTheDocument();
    });

    it('applies loading class to container when loading', () => {
      usePoemStore.getState().setPoem('Test poem content');
      useSuggestionStore.getState().setLoading(true);

      render(<SuggestionPanel {...defaultProps} />);

      const container = screen.getByTestId('suggestion-panel');
      expect(container).toHaveClass('suggestion-panel--loading');
    });
  });

  describe('error state', () => {
    it('shows error message when error occurs', () => {
      usePoemStore.getState().setPoem('Test poem content');
      useSuggestionStore.getState().setError('Failed to fetch suggestions');

      render(<SuggestionPanel {...defaultProps} />);

      expect(screen.getByTestId('suggestion-panel-error')).toBeInTheDocument();
    });
  });

  describe('suggestions display', () => {
    beforeEach(() => {
      usePoemStore.getState().setPoem('Test poem content');
      useSuggestionStore.getState().setSuggestions(mockSuggestions);
    });

    it('displays suggestions when available', () => {
      render(<SuggestionPanel {...defaultProps} />);

      expect(screen.getByText('beautiful')).toBeInTheDocument();
      expect(screen.getByText('walking')).toBeInTheDocument();
    });

    it('shows suggestion count badge', () => {
      render(<SuggestionPanel {...defaultProps} />);

      // Badge in header (there might be multiple "2" texts, just check at least one exists)
      const badges = screen.getAllByText('2');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('displays summary stats', () => {
      render(<SuggestionPanel {...defaultProps} />);

      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Accepted')).toBeInTheDocument();
      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });

    it('shows batch action buttons', () => {
      render(<SuggestionPanel {...defaultProps} />);

      expect(screen.getByText('Accept All')).toBeInTheDocument();
      expect(screen.getByText('Reject All')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    beforeEach(() => {
      usePoemStore.getState().setPoem('Test poem content');
      useSuggestionStore.getState().setSuggestions(mockSuggestions);
    });

    it('calls onGetSuggestions when Get Suggestions button is clicked', () => {
      useSuggestionStore.getState().clear();

      const onGetSuggestions = vi.fn();
      render(<SuggestionPanel {...defaultProps} onGetSuggestions={onGetSuggestions} />);

      const button = screen.getByRole('button', { name: /get suggestions/i });
      fireEvent.click(button);

      expect(onGetSuggestions).toHaveBeenCalledTimes(1);
    });

    it('accepts suggestion when accept button is clicked', () => {
      render(<SuggestionPanel {...defaultProps} />);

      const acceptButtons = screen.getAllByText('Accept');
      fireEvent.click(acceptButtons[0]);

      const state = useSuggestionStore.getState();
      expect(state.suggestions[0].status).toBe('accepted');
    });

    it('rejects suggestion when reject button is clicked', () => {
      render(<SuggestionPanel {...defaultProps} />);

      const rejectButtons = screen.getAllByText('Reject');
      fireEvent.click(rejectButtons[0]);

      const state = useSuggestionStore.getState();
      expect(state.suggestions[0].status).toBe('rejected');
    });

    it('accepts all when Accept All is clicked', () => {
      render(<SuggestionPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Accept All'));

      const state = useSuggestionStore.getState();
      expect(state.suggestions.every((s) => s.status === 'accepted')).toBe(true);
    });

    it('rejects all when Reject All is clicked', () => {
      render(<SuggestionPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Reject All'));

      const state = useSuggestionStore.getState();
      expect(state.suggestions.every((s) => s.status === 'rejected')).toBe(true);
    });

    it('shows Reset All button after processing some suggestions', () => {
      render(<SuggestionPanel {...defaultProps} />);

      // Initially no Reset All
      expect(screen.queryByText('Reset All')).not.toBeInTheDocument();

      // Accept one suggestion
      const acceptButtons = screen.getAllByText('Accept');
      fireEvent.click(acceptButtons[0]);

      // Now Reset All should appear
      expect(screen.getByText('Reset All')).toBeInTheDocument();
    });

    it('resets all when Reset All is clicked', () => {
      render(<SuggestionPanel {...defaultProps} />);

      // Accept all first
      fireEvent.click(screen.getByText('Accept All'));

      // Then reset
      fireEvent.click(screen.getByText('Reset All'));

      const state = useSuggestionStore.getState();
      expect(state.suggestions.every((s) => s.status === 'pending')).toBe(true);
    });
  });

  describe('apply to lyrics', () => {
    beforeEach(() => {
      usePoemStore.getState().setPoem('Test poem content');
      useSuggestionStore.getState().setSuggestions(mockSuggestions);
    });

    it('shows Apply Changes button when there are accepted suggestions', () => {
      render(<SuggestionPanel {...defaultProps} />);

      // Accept one suggestion
      const acceptButtons = screen.getAllByText('Accept');
      fireEvent.click(acceptButtons[0]);

      expect(screen.getByText(/Apply 1 Change to Lyrics/i)).toBeInTheDocument();
    });

    it('updates Apply Changes button text based on accepted count', () => {
      render(<SuggestionPanel {...defaultProps} />);

      // Accept both suggestions
      fireEvent.click(screen.getByText('Accept All'));

      expect(screen.getByText(/Apply 2 Changes to Lyrics/i)).toBeInTheDocument();
    });

    it('calls onApplyToLyrics with accepted suggestions when clicked', () => {
      const onApplyToLyrics = vi.fn();
      render(<SuggestionPanel {...defaultProps} onApplyToLyrics={onApplyToLyrics} />);

      // Accept one suggestion
      const acceptButtons = screen.getAllByText('Accept');
      fireEvent.click(acceptButtons[0]);

      // Click apply
      fireEvent.click(screen.getByText(/Apply 1 Change to Lyrics/i));

      expect(onApplyToLyrics).toHaveBeenCalledTimes(1);
      expect(onApplyToLyrics).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            originalWord: 'beautiful',
            suggestedWord: 'lovely',
            status: 'accepted',
          }),
        ])
      );
    });

    it('does not show Apply Changes button when no onApplyToLyrics provided', () => {
      render(<SuggestionPanel {...defaultProps} onApplyToLyrics={undefined} />);

      // Accept one suggestion
      const acceptButtons = screen.getAllByText('Accept');
      fireEvent.click(acceptButtons[0]);

      expect(screen.queryByText(/Apply.*Change.*to Lyrics/i)).not.toBeInTheDocument();
    });

    it('does not show Apply Changes button when no accepted suggestions', () => {
      render(<SuggestionPanel {...defaultProps} />);

      expect(screen.queryByText(/Apply.*Change.*to Lyrics/i)).not.toBeInTheDocument();
    });
  });

  describe('disabled states', () => {
    it('disables Get Suggestions button when canGetSuggestions is false', () => {
      usePoemStore.getState().setPoem('Test poem content');

      render(<SuggestionPanel {...defaultProps} canGetSuggestions={false} />);

      const button = screen.getByRole('button', { name: /get suggestions/i });
      expect(button).toBeDisabled();
    });

    it('disables Get Suggestions button when no lyrics', () => {
      render(<SuggestionPanel {...defaultProps} />);

      // In header get button
      const headerButton = screen.queryByRole('button', { name: /get.*suggestions/i });
      // When no lyrics, the button should either not exist or be disabled
      if (headerButton) {
        expect(headerButton).toBeDisabled();
      }
    });
  });

  describe('compact mode', () => {
    beforeEach(() => {
      usePoemStore.getState().setPoem('Test poem content');
      useSuggestionStore.getState().setSuggestions(mockSuggestions);
    });

    it('passes compact prop to SuggestionItem', () => {
      render(<SuggestionPanel {...defaultProps} compact />);

      // Check that reason text is hidden (compact mode hides it)
      expect(screen.queryByText('Better for singing')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('uses custom testId when provided', () => {
      render(<SuggestionPanel {...defaultProps} testId="custom-panel" />);

      expect(screen.getByTestId('custom-panel')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<SuggestionPanel {...defaultProps} className="custom-class" />);

      const container = screen.getByTestId('suggestion-panel');
      expect(container).toHaveClass('custom-class');
    });

    it('has aria-live on summary stats', () => {
      usePoemStore.getState().setPoem('Test poem content');
      useSuggestionStore.getState().setSuggestions(mockSuggestions);

      render(<SuggestionPanel {...defaultProps} />);

      const summary = document.querySelector('.suggestion-panel__summary');
      expect(summary?.getAttribute('aria-live')).toBe('polite');
    });

    it('list has role="list"', () => {
      usePoemStore.getState().setPoem('Test poem content');
      useSuggestionStore.getState().setSuggestions(mockSuggestions);

      render(<SuggestionPanel {...defaultProps} />);

      const list = document.querySelector('.suggestion-panel__list');
      expect(list?.getAttribute('role')).toBe('list');
    });
  });
});
