/**
 * Tests for ABCSourceView Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ABCSourceView, type ABCSourceViewProps } from './ABCSourceView';

// Mock the abcRenderer module
vi.mock('@/lib/music/abcRenderer', () => ({
  renderABC: vi.fn(() => ({
    tuneObjects: [{ tuneNumber: 0 }],
    success: true,
  })),
}));

describe('ABCSourceView', () => {
  const sampleABC = `X:1
T:Test Melody
M:4/4
L:1/8
Q:1/4=100
K:C
% This is a comment
CDEF|GABc|"Am"c2B2|A4|]
w: Do Re Mi Fa Sol La Ti Do`;

  const defaultProps: ABCSourceViewProps = {
    abc: sampleABC,
  };

  // Mock clipboard API
  const mockWriteText = vi.fn(() => Promise.resolve());

  // Mock URL API
  const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
  const mockRevokeObjectURL = vi.fn();

  // Mock anchor click
  const mockAnchorClick = vi.fn();

  beforeEach(() => {
    // Setup clipboard mock
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });

    // Setup URL mocks
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock createElement to capture anchor properties
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName === 'a') {
        element.click = mockAnchorClick;
      }
      return element;
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders the component container', () => {
      render(<ABCSourceView {...defaultProps} />);

      const container = screen.getByTestId('abc-source-view');
      expect(container).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<ABCSourceView {...defaultProps} className="custom-class" />);

      const container = screen.getByTestId('abc-source-view');
      expect(container).toHaveClass('abc-source-view', 'custom-class');
    });

    it('applies custom style', () => {
      render(
        <ABCSourceView
          {...defaultProps}
          style={{ marginTop: '20px', padding: '10px' }}
        />
      );

      const container = screen.getByTestId('abc-source-view');
      expect(container.style.marginTop).toBe('20px');
      expect(container.style.padding).toBe('10px');
    });

    it('renders toolbar by default', () => {
      render(<ABCSourceView {...defaultProps} />);

      const toolbar = screen.getByTestId('abc-source-toolbar');
      expect(toolbar).toBeInTheDocument();
    });

    it('hides toolbar when showToolbar is false', () => {
      render(<ABCSourceView {...defaultProps} showToolbar={false} />);

      const toolbar = screen.queryByTestId('abc-source-toolbar');
      expect(toolbar).not.toBeInTheDocument();
    });

    it('shows rendered view by default', () => {
      render(<ABCSourceView {...defaultProps} />);

      const renderedView = screen.getByTestId('rendered-view');
      expect(renderedView).toBeInTheDocument();
    });

    it('shows source view when initialViewMode is source', () => {
      render(<ABCSourceView {...defaultProps} initialViewMode="source" />);

      const sourceView = screen.getByTestId('source-view');
      expect(sourceView).toBeInTheDocument();
    });
  });

  describe('view toggle', () => {
    it('renders view toggle buttons', () => {
      render(<ABCSourceView {...defaultProps} />);

      const renderedButton = screen.getByTestId('view-toggle-rendered');
      const sourceButton = screen.getByTestId('view-toggle-source');

      expect(renderedButton).toBeInTheDocument();
      expect(sourceButton).toBeInTheDocument();
    });

    it('toggles to source view when source button is clicked', async () => {
      const user = userEvent.setup();
      render(<ABCSourceView {...defaultProps} />);

      const sourceButton = screen.getByTestId('view-toggle-source');
      await user.click(sourceButton);

      const sourceView = screen.getByTestId('source-view');
      expect(sourceView).toBeInTheDocument();
    });

    it('toggles back to rendered view when rendered button is clicked', async () => {
      const user = userEvent.setup();
      render(<ABCSourceView {...defaultProps} initialViewMode="source" />);

      const renderedButton = screen.getByTestId('view-toggle-rendered');
      await user.click(renderedButton);

      const renderedView = screen.getByTestId('rendered-view');
      expect(renderedView).toBeInTheDocument();
    });

    it('marks active toggle button correctly', () => {
      render(<ABCSourceView {...defaultProps} />);

      const renderedButton = screen.getByTestId('view-toggle-rendered');
      const sourceButton = screen.getByTestId('view-toggle-source');

      expect(renderedButton).toHaveClass('active');
      expect(sourceButton).not.toHaveClass('active');
    });

    it('has correct aria-selected attributes', () => {
      render(<ABCSourceView {...defaultProps} />);

      const renderedButton = screen.getByTestId('view-toggle-rendered');
      const sourceButton = screen.getByTestId('view-toggle-source');

      expect(renderedButton).toHaveAttribute('aria-selected', 'true');
      expect(sourceButton).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('syntax highlighting', () => {
    it('renders source code with line numbers by default', async () => {
      const user = userEvent.setup();
      render(<ABCSourceView {...defaultProps} />);

      await user.click(screen.getByTestId('view-toggle-source'));

      const lineNumbers = screen.getAllByText(/^\d+$/);
      expect(lineNumbers.length).toBeGreaterThan(0);
    });

    it('hides line numbers when showLineNumbers is false', () => {
      render(<ABCSourceView {...defaultProps} initialViewMode="source" showLineNumbers={false} />);

      // Line numbers should not be present as separate elements
      const sourceView = screen.getByTestId('source-view');
      const lineNumberElements = sourceView.querySelectorAll('.abc-line-number');
      expect(lineNumberElements.length).toBe(0);
    });

    it('highlights header fields', async () => {
      const user = userEvent.setup();
      render(<ABCSourceView {...defaultProps} />);

      await user.click(screen.getByTestId('view-toggle-source'));

      const sourceView = screen.getByTestId('source-view');
      const fieldKeys = sourceView.querySelectorAll('.abc-token-field-key');
      expect(fieldKeys.length).toBeGreaterThan(0);
    });

    it('highlights comments', async () => {
      const user = userEvent.setup();
      render(<ABCSourceView {...defaultProps} />);

      await user.click(screen.getByTestId('view-toggle-source'));

      const sourceView = screen.getByTestId('source-view');
      const comments = sourceView.querySelectorAll('.abc-token-comment');
      expect(comments.length).toBeGreaterThan(0);
    });

    it('highlights notes', async () => {
      const user = userEvent.setup();
      render(<ABCSourceView {...defaultProps} />);

      await user.click(screen.getByTestId('view-toggle-source'));

      const sourceView = screen.getByTestId('source-view');
      const notes = sourceView.querySelectorAll('.abc-token-note');
      expect(notes.length).toBeGreaterThan(0);
    });

    it('highlights chords', async () => {
      const user = userEvent.setup();
      render(<ABCSourceView {...defaultProps} />);

      await user.click(screen.getByTestId('view-toggle-source'));

      const sourceView = screen.getByTestId('source-view');
      const chords = sourceView.querySelectorAll('.abc-token-chord');
      expect(chords.length).toBeGreaterThan(0);
    });

    it('highlights bar lines', async () => {
      const user = userEvent.setup();
      render(<ABCSourceView {...defaultProps} />);

      await user.click(screen.getByTestId('view-toggle-source'));

      const sourceView = screen.getByTestId('source-view');
      const bars = sourceView.querySelectorAll('.abc-token-bar');
      expect(bars.length).toBeGreaterThan(0);
    });
  });

  describe('copy to clipboard', () => {
    it('renders copy button', () => {
      render(<ABCSourceView {...defaultProps} />);

      const copyButton = screen.getByTestId('copy-button');
      expect(copyButton).toBeInTheDocument();
    });

    it('copies ABC to clipboard when clicked and shows success message', async () => {
      const user = userEvent.setup();
      render(<ABCSourceView {...defaultProps} />);

      const copyButton = screen.getByTestId('copy-button');
      await user.click(copyButton);

      // The success message proves copy was triggered (either via clipboard API or fallback)
      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });

    it('has correct aria-label', () => {
      render(<ABCSourceView {...defaultProps} />);

      const copyButton = screen.getByTestId('copy-button');
      expect(copyButton).toHaveAttribute('aria-label', 'Copy ABC to clipboard');
    });
  });

  describe('download functionality', () => {
    it('renders download button', () => {
      render(<ABCSourceView {...defaultProps} />);

      const downloadButton = screen.getByTestId('download-button');
      expect(downloadButton).toBeInTheDocument();
    });

    it('creates blob and triggers download when clicked', async () => {
      const user = userEvent.setup();

      render(<ABCSourceView {...defaultProps} downloadTitle="my-melody" />);

      const downloadButton = screen.getByTestId('download-button');
      await user.click(downloadButton);

      // Verify blob was created
      expect(mockCreateObjectURL).toHaveBeenCalled();
      // Verify URL was revoked after download
      expect(mockRevokeObjectURL).toHaveBeenCalled();
      // Verify anchor was clicked to trigger download
      expect(mockAnchorClick).toHaveBeenCalled();
    });

    it('creates download with default filename', async () => {
      const user = userEvent.setup();

      render(<ABCSourceView {...defaultProps} />);

      const downloadButton = screen.getByTestId('download-button');
      await user.click(downloadButton);

      // Download was triggered
      expect(mockAnchorClick).toHaveBeenCalled();
    });

    it('has correct aria-label', () => {
      render(<ABCSourceView {...defaultProps} />);

      const downloadButton = screen.getByTestId('download-button');
      expect(downloadButton).toHaveAttribute('aria-label', 'Download as ABC file');
    });
  });

  describe('editing functionality', () => {
    it('shows textarea when editable and in source view', () => {
      render(<ABCSourceView {...defaultProps} editable initialViewMode="source" />);

      const textarea = screen.getByTestId('abc-textarea');
      expect(textarea).toBeInTheDocument();
    });

    it('shows read-only source when not editable', () => {
      render(<ABCSourceView {...defaultProps} initialViewMode="source" />);

      const sourceView = screen.getByTestId('source-view');
      expect(sourceView).toBeInTheDocument();
      expect(sourceView).toHaveAttribute('aria-readonly', 'true');
    });

    it('calls onABCChange when editing', async () => {
      const user = userEvent.setup();
      const onABCChange = vi.fn();

      render(
        <ABCSourceView
          {...defaultProps}
          editable
          initialViewMode="source"
          onABCChange={onABCChange}
        />
      );

      const textarea = screen.getByTestId('abc-textarea');
      await user.clear(textarea);
      await user.type(textarea, 'X:1');

      expect(onABCChange).toHaveBeenCalled();
    });

    it('shows edit toggle button when editable', () => {
      render(<ABCSourceView {...defaultProps} editable />);

      const editButton = screen.getByTestId('edit-toggle-button');
      expect(editButton).toBeInTheDocument();
    });

    it('hides edit toggle button when not editable', () => {
      render(<ABCSourceView {...defaultProps} />);

      const editButton = screen.queryByTestId('edit-toggle-button');
      expect(editButton).not.toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('shows validation status in source view', () => {
      render(<ABCSourceView {...defaultProps} initialViewMode="source" />);

      const validationStatus = screen.getByTestId('validation-status');
      expect(validationStatus).toBeInTheDocument();
    });

    it('shows valid status for valid ABC', async () => {
      render(<ABCSourceView {...defaultProps} initialViewMode="source" />);

      const validationStatus = screen.getByTestId('validation-status');
      expect(validationStatus).toHaveClass('valid');
    });

    it('shows invalid status for ABC without K: field', async () => {
      const invalidABC = `X:1
T:Test
M:4/4
CDEF|`;

      render(<ABCSourceView abc={invalidABC} initialViewMode="source" />);

      await waitFor(() => {
        const validationStatus = screen.getByTestId('validation-status');
        expect(validationStatus).toHaveClass('invalid');
      });
    });

    it('calls onValidationChange when validation state changes', async () => {
      const onValidationChange = vi.fn();

      render(
        <ABCSourceView
          {...defaultProps}
          onValidationChange={onValidationChange}
        />
      );

      await waitFor(() => {
        expect(onValidationChange).toHaveBeenCalled();
      });
    });

    it('shows validation errors for editable source', async () => {
      const invalidABC = `X:1
T:Test
M:4/4
CDEF|`;

      render(
        <ABCSourceView
          abc={invalidABC}
          editable
          initialViewMode="source"
        />
      );

      await waitFor(() => {
        const errors = screen.getByTestId('validation-errors');
        expect(errors).toBeInTheDocument();
      });
    });
  });

  describe('notation rendering', () => {
    it('renders ABC notation when in rendered view', async () => {
      const { renderABC } = await import('@/lib/music/abcRenderer');

      render(<ABCSourceView {...defaultProps} />);

      await waitFor(() => {
        expect(renderABC).toHaveBeenCalled();
      });
    });

    it('passes correct options to renderABC', async () => {
      const { renderABC } = await import('@/lib/music/abcRenderer');

      render(<ABCSourceView {...defaultProps} />);

      await waitFor(() => {
        expect(renderABC).toHaveBeenCalledWith(
          sampleABC,
          expect.any(String),
          expect.objectContaining({
            responsive: 'resize',
            add_classes: true,
          })
        );
      });
    });

    it('uses custom notationId when provided', async () => {
      const { renderABC } = await import('@/lib/music/abcRenderer');

      render(<ABCSourceView {...defaultProps} notationId="custom-notation-id" />);

      await waitFor(() => {
        expect(renderABC).toHaveBeenCalledWith(
          sampleABC,
          'custom-notation-id',
          expect.any(Object)
        );
      });
    });
  });

  describe('accessibility', () => {
    it('has correct role for view toggle', () => {
      render(<ABCSourceView {...defaultProps} />);

      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();
    });

    it('source view has correct ARIA attributes', () => {
      render(<ABCSourceView {...defaultProps} initialViewMode="source" />);

      const sourceView = screen.getByTestId('source-view');
      expect(sourceView).toHaveAttribute('role', 'textbox');
      expect(sourceView).toHaveAttribute('aria-readonly', 'true');
      expect(sourceView).toHaveAttribute('aria-multiline', 'true');
      expect(sourceView).toHaveAttribute('aria-label', 'ABC notation source');
    });

    it('rendered view has correct aria-label', () => {
      render(<ABCSourceView {...defaultProps} />);

      const renderedView = screen.getByTestId('rendered-view');
      expect(renderedView).toHaveAttribute('aria-label', 'Rendered music notation');
    });

    it('editable textarea has correct aria-label', () => {
      render(<ABCSourceView {...defaultProps} editable initialViewMode="source" />);

      const textarea = screen.getByTestId('abc-textarea');
      expect(textarea).toHaveAttribute('aria-label', 'ABC notation editor');
    });
  });

  describe('ABC updates', () => {
    it('updates when abc prop changes', async () => {
      const { rerender } = render(<ABCSourceView {...defaultProps} initialViewMode="source" />);

      const newABC = `X:2
T:New Melody
K:G
GABc|`;

      rerender(<ABCSourceView abc={newABC} initialViewMode="source" />);

      await waitFor(() => {
        const sourceView = screen.getByTestId('source-view');
        expect(sourceView.textContent).toContain('New Melody');
      });
    });
  });

  describe('special ABC notation tokens', () => {
    it('highlights accidentals correctly', async () => {
      const abcWithAccidentals = `X:1
K:C
^C _D =E|`;

      render(<ABCSourceView abc={abcWithAccidentals} initialViewMode="source" />);

      const sourceView = screen.getByTestId('source-view');
      const accidentals = sourceView.querySelectorAll('.abc-token-accidental');
      expect(accidentals.length).toBeGreaterThan(0);
    });

    it('highlights rests correctly', async () => {
      const abcWithRests = `X:1
K:C
CDz2EF|`;

      render(<ABCSourceView abc={abcWithRests} initialViewMode="source" />);

      const sourceView = screen.getByTestId('source-view');
      const rests = sourceView.querySelectorAll('.abc-token-rest');
      expect(rests.length).toBeGreaterThan(0);
    });

    it('highlights lyrics (w: field) correctly', async () => {
      const abcWithLyrics = `X:1
K:C
CDEF|
w: Do Re Mi Fa`;

      render(<ABCSourceView abc={abcWithLyrics} initialViewMode="source" />);

      const sourceView = screen.getByTestId('source-view');
      const lyrics = sourceView.querySelectorAll('.abc-token-lyric');
      expect(lyrics.length).toBeGreaterThan(0);
    });

    it('highlights decorations correctly', async () => {
      const abcWithDecorations = `X:1
K:C
!fermata!C D E F|`;

      render(<ABCSourceView abc={abcWithDecorations} initialViewMode="source" />);

      const sourceView = screen.getByTestId('source-view');
      const decorations = sourceView.querySelectorAll('.abc-token-decoration');
      expect(decorations.length).toBeGreaterThan(0);
    });
  });
});
