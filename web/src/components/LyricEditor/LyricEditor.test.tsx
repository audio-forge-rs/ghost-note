/**
 * Tests for LyricEditor Component
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { LyricEditor } from './LyricEditor';
import type { LyricEditorProps } from './types';

// Mock the stores
vi.mock('@/stores/usePoemStore', () => {
  const original = 'Original poem text\nWith multiple lines\nAnd more content';
  const versions = [
    {
      id: 'v1',
      lyrics: 'Modified poem text\nWith changes',
      timestamp: Date.now(),
      changes: [],
      description: 'First edit',
    },
  ];

  return {
    usePoemStore: vi.fn((selector) => {
      const state = {
        original,
        versions,
        currentVersionIndex: 0,
        addVersion: vi.fn(),
        revertToVersion: vi.fn(),
        deleteVersion: vi.fn(),
        updateCurrentVersion: vi.fn(),
      };

      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    }),
    selectCurrentLyrics: vi.fn(() => 'Modified poem text\nWith changes'),
    selectCurrentVersion: vi.fn(() => versions[0]),
  };
});

vi.mock('@/stores/useAnalysisStore', () => ({
  useAnalysisStore: vi.fn((selector) => {
    const state = {
      analyze: vi.fn(),
      analysis: null,
      isLoading: false,
    };

    if (typeof selector === 'function') {
      return selector(state);
    }
    return state;
  }),
}));

describe('LyricEditor', () => {
  const defaultProps: LyricEditorProps = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders the container', () => {
      render(<LyricEditor {...defaultProps} />);

      expect(screen.getByTestId('lyric-editor')).toBeInTheDocument();
    });

    it('uses custom testId', () => {
      render(<LyricEditor testId="custom-editor" />);

      expect(screen.getByTestId('custom-editor')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<LyricEditor className="custom-class" />);

      const container = screen.getByTestId('lyric-editor');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('tabs', () => {
    it('renders all tab buttons', () => {
      render(<LyricEditor {...defaultProps} />);

      expect(screen.getByTestId('lyric-editor-tab-editor')).toBeInTheDocument();
      expect(screen.getByTestId('lyric-editor-tab-compare')).toBeInTheDocument();
      expect(screen.getByTestId('lyric-editor-tab-suggestions')).toBeInTheDocument();
      expect(screen.getByTestId('lyric-editor-tab-history')).toBeInTheDocument();
    });

    it('editor tab is active by default', () => {
      render(<LyricEditor {...defaultProps} />);

      const editorTab = screen.getByTestId('lyric-editor-tab-editor');
      expect(editorTab).toHaveClass('lyric-editor__tab--active');
    });

    it('shows editor panel by default', () => {
      render(<LyricEditor {...defaultProps} />);

      expect(screen.getByTestId('lyric-editor-panel-editor')).toBeInTheDocument();
    });

    it('switches to compare panel when compare tab is clicked', () => {
      render(<LyricEditor {...defaultProps} />);

      fireEvent.click(screen.getByTestId('lyric-editor-tab-compare'));

      expect(screen.getByTestId('lyric-editor-panel-compare')).toBeInTheDocument();
    });

    it('switches to suggestions panel when suggestions tab is clicked', () => {
      render(<LyricEditor {...defaultProps} />);

      fireEvent.click(screen.getByTestId('lyric-editor-tab-suggestions'));

      expect(screen.getByTestId('lyric-editor-panel-suggestions')).toBeInTheDocument();
    });

    it('switches to history panel when history tab is clicked', () => {
      render(<LyricEditor {...defaultProps} />);

      fireEvent.click(screen.getByTestId('lyric-editor-tab-history'));

      expect(screen.getByTestId('lyric-editor-panel-history')).toBeInTheDocument();
    });

    it('only shows one panel at a time', () => {
      render(<LyricEditor {...defaultProps} />);

      fireEvent.click(screen.getByTestId('lyric-editor-tab-compare'));

      expect(screen.queryByTestId('lyric-editor-panel-editor')).not.toBeInTheDocument();
      expect(screen.getByTestId('lyric-editor-panel-compare')).toBeInTheDocument();
    });
  });

  describe('editor panel', () => {
    it('shows current lyrics text', () => {
      render(<LyricEditor {...defaultProps} />);

      expect(screen.getByTestId('lyric-editor-current-text')).toBeInTheDocument();
    });

    it('shows edit button', () => {
      render(<LyricEditor {...defaultProps} />);

      expect(screen.getByTestId('lyric-editor-edit-button')).toBeInTheDocument();
    });

    it('shows textarea when edit button is clicked', () => {
      render(<LyricEditor {...defaultProps} />);

      fireEvent.click(screen.getByTestId('lyric-editor-edit-button'));

      expect(screen.getByTestId('lyric-editor-textarea')).toBeInTheDocument();
    });

    it('shows save and cancel buttons in edit mode', () => {
      render(<LyricEditor {...defaultProps} />);

      fireEvent.click(screen.getByTestId('lyric-editor-edit-button'));

      expect(screen.getByTestId('lyric-editor-save')).toBeInTheDocument();
      expect(screen.getByTestId('lyric-editor-cancel')).toBeInTheDocument();
    });

    it('cancel button exits edit mode', () => {
      render(<LyricEditor {...defaultProps} />);

      fireEvent.click(screen.getByTestId('lyric-editor-edit-button'));
      fireEvent.click(screen.getByTestId('lyric-editor-cancel'));

      expect(screen.queryByTestId('lyric-editor-textarea')).not.toBeInTheDocument();
      expect(screen.getByTestId('lyric-editor-edit-button')).toBeInTheDocument();
    });
  });

  describe('compare panel', () => {
    it('shows diff view', () => {
      render(<LyricEditor {...defaultProps} />);

      fireEvent.click(screen.getByTestId('lyric-editor-tab-compare'));

      expect(screen.getByTestId('lyric-editor-diff-view')).toBeInTheDocument();
    });

    it('shows mode toggle button', () => {
      render(<LyricEditor {...defaultProps} />);

      fireEvent.click(screen.getByTestId('lyric-editor-tab-compare'));

      expect(screen.getByTestId('lyric-editor-mode-toggle')).toBeInTheDocument();
    });

    it('toggles between side-by-side and inline view', () => {
      render(<LyricEditor {...defaultProps} />);

      fireEvent.click(screen.getByTestId('lyric-editor-tab-compare'));

      // Start with side-by-side (DiffView)
      expect(screen.getByTestId('lyric-editor-diff-view')).toBeInTheDocument();

      // Toggle to inline
      fireEvent.click(screen.getByTestId('lyric-editor-mode-toggle'));

      expect(screen.getByTestId('lyric-editor-inline-diff')).toBeInTheDocument();
    });
  });

  describe('suggestions panel', () => {
    it('shows no suggestions message when empty', () => {
      render(<LyricEditor {...defaultProps} />);

      fireEvent.click(screen.getByTestId('lyric-editor-tab-suggestions'));

      expect(screen.getByText(/no suggestions available/i)).toBeInTheDocument();
    });
  });

  describe('history panel', () => {
    it('shows version list', () => {
      render(<LyricEditor {...defaultProps} />);

      fireEvent.click(screen.getByTestId('lyric-editor-tab-history'));

      expect(screen.getByTestId('lyric-editor-version-list')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('tabs have role="tab"', () => {
      render(<LyricEditor {...defaultProps} />);

      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBe(4);
    });

    it('has tablist container', () => {
      render(<LyricEditor {...defaultProps} />);

      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('active tab has aria-selected="true"', () => {
      render(<LyricEditor {...defaultProps} />);

      const editorTab = screen.getByTestId('lyric-editor-tab-editor');
      expect(editorTab.getAttribute('aria-selected')).toBe('true');
    });

    it('inactive tabs have aria-selected="false"', () => {
      render(<LyricEditor {...defaultProps} />);

      const compareTab = screen.getByTestId('lyric-editor-tab-compare');
      expect(compareTab.getAttribute('aria-selected')).toBe('false');
    });

    it('panels have role="tabpanel"', () => {
      render(<LyricEditor {...defaultProps} />);

      const panel = screen.getByTestId('lyric-editor-panel-editor');
      expect(panel.getAttribute('role')).toBe('tabpanel');
    });
  });

  describe('keyboard navigation', () => {
    it('textarea responds to Escape to cancel', async () => {
      render(<LyricEditor {...defaultProps} />);

      fireEvent.click(screen.getByTestId('lyric-editor-edit-button'));

      const textarea = screen.getByTestId('lyric-editor-textarea');
      fireEvent.keyDown(textarea, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByTestId('lyric-editor-textarea')).not.toBeInTheDocument();
      });
    });
  });
});

// Note: Testing empty state would require re-importing the component
// after mocking, which is complex. In a real scenario, we'd use
// a more sophisticated testing approach or integration tests.
// Empty state tests are omitted to avoid test suite errors.
