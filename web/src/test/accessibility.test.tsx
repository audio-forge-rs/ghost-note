/**
 * Accessibility Integration Tests
 *
 * Comprehensive accessibility tests for Ghost Note components.
 * Uses axe-core for automated accessibility violation detection.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from './a11yHelpers';

// Components to test
import { PoemInput } from '@/components/PoemInput';
import { PlaybackControls } from '@/components/Playback';
import { RecordButton } from '@/components/Recording';
import { LoadingSpinner, ProgressBar, SkipLinks } from '@/components/Common';
import { AnalysisPanel } from '@/components/Analysis';

// Mock stores
vi.mock('@/stores/usePoemStore', () => ({
  usePoemStore: vi.fn((selector) => {
    const state = {
      original: '',
      setPoem: vi.fn(),
      reset: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
  selectLineCount: vi.fn(() => 0),
  selectWordCount: vi.fn(() => 0),
}));

describe('Accessibility Tests', () => {
  describe('PoemInput Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<PoemInput />);
      await expectNoA11yViolations(container);
    });

    it('should have proper form labels', () => {
      render(<PoemInput />);
      const textarea = screen.getByTestId('poem-textarea');
      expect(textarea).toHaveAttribute('aria-label', 'Poem text input');
    });

    it('should have a toolbar with proper role', () => {
      render(<PoemInput />);
      const toolbar = screen.getByTestId('poem-toolbar');
      expect(toolbar).toHaveAttribute('role', 'toolbar');
      expect(toolbar).toHaveAttribute('aria-label', 'Poem input actions');
    });

    it('should have buttons with proper labels', () => {
      render(<PoemInput />);
      expect(screen.getByLabelText('Paste from clipboard')).toBeInTheDocument();
      expect(screen.getByLabelText('Choose a sample poem')).toBeInTheDocument();
      expect(screen.getByLabelText('Clear poem text')).toBeInTheDocument();
      expect(screen.getByLabelText('Analyze poem')).toBeInTheDocument();
    });
  });

  describe('PlaybackControls Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <PlaybackControls
          playbackState="stopped"
          hasContent
          onPlay={() => {}}
          onPause={() => {}}
          onStop={() => {}}
        />
      );
      await expectNoA11yViolations(container);
    });

    it('should have a group role with proper label', () => {
      render(
        <PlaybackControls
          playbackState="stopped"
          hasContent
          onPlay={() => {}}
          onPause={() => {}}
          onStop={() => {}}
        />
      );
      const controls = screen.getByRole('group', { name: 'Playback controls' });
      expect(controls).toBeInTheDocument();
    });

    it('should have dynamic button labels based on state', () => {
      const { rerender } = render(
        <PlaybackControls
          playbackState="stopped"
          hasContent
          onPlay={() => {}}
          onPause={() => {}}
          onStop={() => {}}
        />
      );
      expect(screen.getByLabelText('Start playback')).toBeInTheDocument();

      rerender(
        <PlaybackControls
          playbackState="playing"
          hasContent
          onPlay={() => {}}
          onPause={() => {}}
          onStop={() => {}}
        />
      );
      expect(screen.getByLabelText('Pause playback')).toBeInTheDocument();
    });
  });

  describe('RecordButton Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<RecordButton state="idle" onClick={() => {}} />);
      await expectNoA11yViolations(container);
    });

    it('should have dynamic aria-label based on state', () => {
      const { rerender } = render(<RecordButton state="idle" onClick={() => {}} />);
      expect(screen.getByLabelText('Start recording')).toBeInTheDocument();

      rerender(<RecordButton state="recording" onClick={() => {}} />);
      expect(screen.getByLabelText('Stop recording')).toBeInTheDocument();

      rerender(<RecordButton state="paused" onClick={() => {}} />);
      expect(screen.getByLabelText('Resume recording')).toBeInTheDocument();

      rerender(<RecordButton state="preparing" onClick={() => {}} />);
      expect(screen.getByLabelText('Preparing to record')).toBeInTheDocument();
    });

    it('should have aria-busy during preparation', () => {
      render(<RecordButton state="preparing" onClick={() => {}} />);
      const button = screen.getByTestId('record-button-control');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should have aria-pressed when recording', () => {
      render(<RecordButton state="recording" onClick={() => {}} />);
      const button = screen.getByTestId('record-button-control');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('LoadingSpinner Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<LoadingSpinner />);
      await expectNoA11yViolations(container);
    });

    it('should have status role and live region', () => {
      render(<LoadingSpinner label="Loading content..." />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-live', 'polite');
      expect(spinner).toHaveAttribute('aria-label', 'Loading content...');
    });

    it('should hide decorative SVG from screen readers', () => {
      render(<LoadingSpinner />);
      const svg = document.querySelector('.loading-spinner__svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('ProgressBar Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<ProgressBar value={50} />);
      await expectNoA11yViolations(container);
    });

    it('should have proper progressbar role', () => {
      render(<ProgressBar value={65} max={100} />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '65');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should have aria-busy for indeterminate state', () => {
      render(<ProgressBar indeterminate />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-busy', 'true');
    });

    it('should have accessible label', () => {
      render(<ProgressBar value={75} ariaLabel="Upload progress" />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', 'Upload progress');
    });
  });

  describe('SkipLinks Component', () => {
    beforeEach(() => {
      const main = document.createElement('main');
      main.id = 'main-content';
      document.body.appendChild(main);

      const nav = document.createElement('nav');
      nav.id = 'navigation';
      document.body.appendChild(nav);
    });

    it('should have no accessibility violations', async () => {
      const { container } = render(<SkipLinks />);
      await expectNoA11yViolations(container);
    });

    it('should have navigation role with label', () => {
      render(<SkipLinks />);
      expect(screen.getByRole('navigation', { name: 'Skip links' })).toBeInTheDocument();
    });
  });

  describe('AnalysisPanel Component', () => {
    it('should have no accessibility violations when empty', async () => {
      const { container } = render(<AnalysisPanel analysis={null} />);
      await expectNoA11yViolations(container);
    });

    it('should have status role for empty state', () => {
      render(<AnalysisPanel analysis={null} />);
      const emptyState = screen.getByRole('status');
      expect(emptyState).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('should have visible focus indicators', () => {
      render(
        <PlaybackControls
          playbackState="stopped"
          hasContent
          onPlay={() => {}}
          onPause={() => {}}
          onStop={() => {}}
        />
      );
      const button = screen.getByLabelText('Start playback');
      button.focus();
      expect(document.activeElement).toBe(button);
    });
  });

  describe('Semantic HTML', () => {
    it('should use proper heading hierarchy', () => {
      render(<PoemInput />);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Enter Your Poem');
    });
  });

  describe('Interactive Elements', () => {
    it('should disable buttons properly', () => {
      render(<PoemInput disabled />);
      const analyzeButton = screen.getByTestId('analyze-button');
      expect(analyzeButton).toBeDisabled();
    });

    it('should have proper disabled state accessibility', async () => {
      const { container } = render(<PoemInput disabled />);
      await expectNoA11yViolations(container);
    });
  });
});
