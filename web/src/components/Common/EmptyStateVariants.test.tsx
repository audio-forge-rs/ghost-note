/**
 * Tests for EmptyState Variants
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import {
  NoPoemEmptyState,
  NoAnalysisEmptyState,
  NoMelodyEmptyState,
  NoRecordingsEmptyState,
  NoVersionsEmptyState,
} from './EmptyStateVariants';

describe('EmptyState Variants', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('NoPoemEmptyState', () => {
    it('renders with correct title', () => {
      render(<NoPoemEmptyState />);

      expect(screen.getByText('No poem entered')).toBeInTheDocument();
    });

    it('renders with correct description', () => {
      render(<NoPoemEmptyState />);

      expect(
        screen.getByText(/Paste a poem from your clipboard or type one directly/)
      ).toBeInTheDocument();
    });

    it('renders paste button when onPaste provided', () => {
      const onPaste = vi.fn();
      render(<NoPoemEmptyState onPaste={onPaste} />);

      expect(screen.getByText('Paste poem')).toBeInTheDocument();
    });

    it('renders type button when onCompose provided', () => {
      const onCompose = vi.fn();
      render(<NoPoemEmptyState onCompose={onCompose} />);

      expect(screen.getByText('Type poem')).toBeInTheDocument();
    });

    it('calls onPaste when paste button clicked', () => {
      const onPaste = vi.fn();
      render(<NoPoemEmptyState onPaste={onPaste} />);

      fireEvent.click(screen.getByText('Paste poem'));
      expect(onPaste).toHaveBeenCalledTimes(1);
    });

    it('calls onCompose when type button clicked', () => {
      const onCompose = vi.fn();
      render(<NoPoemEmptyState onCompose={onCompose} />);

      fireEvent.click(screen.getByText('Type poem'));
      expect(onCompose).toHaveBeenCalledTimes(1);
    });

    it('paste button is primary when both actions provided', () => {
      render(<NoPoemEmptyState onPaste={vi.fn()} onCompose={vi.fn()} />);

      const pasteButton = screen.getByText('Paste poem');
      const typeButton = screen.getByText('Type poem');

      expect(pasteButton).toHaveClass('empty-state__action--primary');
      expect(typeButton).toHaveClass('empty-state__action--secondary');
    });

    it('type button is primary when only onCompose provided', () => {
      render(<NoPoemEmptyState onCompose={vi.fn()} />);

      const typeButton = screen.getByText('Type poem');
      expect(typeButton).toHaveClass('empty-state__action--primary');
    });

    it('applies custom variant', () => {
      render(<NoPoemEmptyState variant="compact" />);

      const container = screen.getByTestId('empty-state-no-poem');
      expect(container).toHaveClass('empty-state--compact');
    });

    it('applies custom className', () => {
      render(<NoPoemEmptyState className="custom-class" />);

      const container = screen.getByTestId('empty-state-no-poem');
      expect(container).toHaveClass('custom-class');
    });

    it('renders poem icon', () => {
      render(<NoPoemEmptyState />);

      const iconContainer = document.querySelector('.empty-state__icon');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer?.querySelector('svg')).toBeInTheDocument();
    });

    it('has correct test id', () => {
      render(<NoPoemEmptyState />);

      expect(screen.getByTestId('empty-state-no-poem')).toBeInTheDocument();
    });
  });

  describe('NoAnalysisEmptyState', () => {
    it('renders with correct title', () => {
      render(<NoAnalysisEmptyState />);

      expect(screen.getByText('No analysis yet')).toBeInTheDocument();
    });

    it('renders description for canAnalyze=true', () => {
      render(<NoAnalysisEmptyState canAnalyze={true} />);

      expect(
        screen.getByText(/Click analyze to discover the meter, rhyme scheme/)
      ).toBeInTheDocument();
    });

    it('renders alternative description for canAnalyze=false', () => {
      render(<NoAnalysisEmptyState canAnalyze={false} />);

      expect(
        screen.getByText(/Enter a poem first, then analyze it/)
      ).toBeInTheDocument();
    });

    it('renders analyze button when onAnalyze provided', () => {
      render(<NoAnalysisEmptyState onAnalyze={vi.fn()} />);

      expect(screen.getByText('Analyze poem')).toBeInTheDocument();
    });

    it('calls onAnalyze when button clicked', () => {
      const onAnalyze = vi.fn();
      render(<NoAnalysisEmptyState onAnalyze={onAnalyze} canAnalyze={true} />);

      fireEvent.click(screen.getByText('Analyze poem'));
      expect(onAnalyze).toHaveBeenCalledTimes(1);
    });

    it('disables button when canAnalyze is false', () => {
      render(<NoAnalysisEmptyState onAnalyze={vi.fn()} canAnalyze={false} />);

      const button = screen.getByText('Analyze poem');
      expect(button).toBeDisabled();
    });

    it('enables button when canAnalyze is true', () => {
      render(<NoAnalysisEmptyState onAnalyze={vi.fn()} canAnalyze={true} />);

      const button = screen.getByText('Analyze poem');
      expect(button).not.toBeDisabled();
    });

    it('has correct test id', () => {
      render(<NoAnalysisEmptyState />);

      expect(screen.getByTestId('empty-state-no-analysis')).toBeInTheDocument();
    });

    it('renders analysis icon', () => {
      render(<NoAnalysisEmptyState />);

      const iconContainer = document.querySelector('.empty-state__icon');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer?.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('NoMelodyEmptyState', () => {
    it('renders with correct title', () => {
      render(<NoMelodyEmptyState />);

      expect(screen.getByText('No melody generated')).toBeInTheDocument();
    });

    it('renders description for canGenerate=true', () => {
      render(<NoMelodyEmptyState canGenerate={true} />);

      expect(
        screen.getByText(/Generate a vocal melody that matches/)
      ).toBeInTheDocument();
    });

    it('renders alternative description for canGenerate=false', () => {
      render(<NoMelodyEmptyState canGenerate={false} />);

      expect(
        screen.getByText(/Analyze your poem first to enable melody generation/)
      ).toBeInTheDocument();
    });

    it('renders generate button when onGenerate provided', () => {
      render(<NoMelodyEmptyState onGenerate={vi.fn()} />);

      expect(screen.getByText('Generate melody')).toBeInTheDocument();
    });

    it('calls onGenerate when button clicked', () => {
      const onGenerate = vi.fn();
      render(<NoMelodyEmptyState onGenerate={onGenerate} canGenerate={true} />);

      fireEvent.click(screen.getByText('Generate melody'));
      expect(onGenerate).toHaveBeenCalledTimes(1);
    });

    it('disables button when canGenerate is false', () => {
      render(<NoMelodyEmptyState onGenerate={vi.fn()} canGenerate={false} />);

      const button = screen.getByText('Generate melody');
      expect(button).toBeDisabled();
    });

    it('has correct test id', () => {
      render(<NoMelodyEmptyState />);

      expect(screen.getByTestId('empty-state-no-melody')).toBeInTheDocument();
    });

    it('renders melody icon', () => {
      render(<NoMelodyEmptyState />);

      const iconContainer = document.querySelector('.empty-state__icon');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer?.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('NoRecordingsEmptyState', () => {
    it('renders with correct title', () => {
      render(<NoRecordingsEmptyState />);

      expect(screen.getByText('No recordings yet')).toBeInTheDocument();
    });

    it('renders description for canRecord=true', () => {
      render(<NoRecordingsEmptyState canRecord={true} />);

      expect(
        screen.getByText(/Record yourself singing along with the melody/)
      ).toBeInTheDocument();
    });

    it('renders alternative description for canRecord=false', () => {
      render(<NoRecordingsEmptyState canRecord={false} />);

      expect(
        screen.getByText(/Generate a melody first, then record yourself/)
      ).toBeInTheDocument();
    });

    it('renders start recording button when onStartRecording provided', () => {
      render(<NoRecordingsEmptyState onStartRecording={vi.fn()} />);

      expect(screen.getByText('Start recording')).toBeInTheDocument();
    });

    it('calls onStartRecording when button clicked', () => {
      const onStartRecording = vi.fn();
      render(
        <NoRecordingsEmptyState
          onStartRecording={onStartRecording}
          canRecord={true}
        />
      );

      fireEvent.click(screen.getByText('Start recording'));
      expect(onStartRecording).toHaveBeenCalledTimes(1);
    });

    it('disables button when canRecord is false', () => {
      render(
        <NoRecordingsEmptyState onStartRecording={vi.fn()} canRecord={false} />
      );

      const button = screen.getByText('Start recording');
      expect(button).toBeDisabled();
    });

    it('has correct test id', () => {
      render(<NoRecordingsEmptyState />);

      expect(screen.getByTestId('empty-state-no-recordings')).toBeInTheDocument();
    });

    it('renders recording icon', () => {
      render(<NoRecordingsEmptyState />);

      const iconContainer = document.querySelector('.empty-state__icon');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer?.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('NoVersionsEmptyState', () => {
    it('renders with correct title', () => {
      render(<NoVersionsEmptyState />);

      expect(screen.getByText('Original version')).toBeInTheDocument();
    });

    it('renders description for canCreate=true', () => {
      render(<NoVersionsEmptyState canCreate={true} />);

      expect(
        screen.getByText(/You're viewing the original poem/)
      ).toBeInTheDocument();
    });

    it('renders alternative description for canCreate=false', () => {
      render(<NoVersionsEmptyState canCreate={false} />);

      expect(
        screen.getByText(/Enter a poem first, then create versions/)
      ).toBeInTheDocument();
    });

    it('renders create version button when onCreateVersion provided', () => {
      render(<NoVersionsEmptyState onCreateVersion={vi.fn()} />);

      expect(screen.getByText('Create version')).toBeInTheDocument();
    });

    it('calls onCreateVersion when button clicked', () => {
      const onCreateVersion = vi.fn();
      render(
        <NoVersionsEmptyState
          onCreateVersion={onCreateVersion}
          canCreate={true}
        />
      );

      fireEvent.click(screen.getByText('Create version'));
      expect(onCreateVersion).toHaveBeenCalledTimes(1);
    });

    it('disables button when canCreate is false', () => {
      render(
        <NoVersionsEmptyState onCreateVersion={vi.fn()} canCreate={false} />
      );

      const button = screen.getByText('Create version');
      expect(button).toBeDisabled();
    });

    it('has correct test id', () => {
      render(<NoVersionsEmptyState />);

      expect(screen.getByTestId('empty-state-no-versions')).toBeInTheDocument();
    });

    it('renders versions icon', () => {
      render(<NoVersionsEmptyState />);

      const iconContainer = document.querySelector('.empty-state__icon');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer?.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('variant inheritance', () => {
    it('NoPoemEmptyState accepts variant prop', () => {
      render(<NoPoemEmptyState variant="centered" />);

      const container = screen.getByTestId('empty-state-no-poem');
      expect(container).toHaveClass('empty-state--centered');
    });

    it('NoAnalysisEmptyState accepts variant prop', () => {
      render(<NoAnalysisEmptyState variant="compact" />);

      const container = screen.getByTestId('empty-state-no-analysis');
      expect(container).toHaveClass('empty-state--compact');
    });

    it('NoMelodyEmptyState accepts variant prop', () => {
      render(<NoMelodyEmptyState variant="centered" />);

      const container = screen.getByTestId('empty-state-no-melody');
      expect(container).toHaveClass('empty-state--centered');
    });

    it('NoRecordingsEmptyState accepts variant prop', () => {
      render(<NoRecordingsEmptyState variant="compact" />);

      const container = screen.getByTestId('empty-state-no-recordings');
      expect(container).toHaveClass('empty-state--compact');
    });

    it('NoVersionsEmptyState accepts variant prop', () => {
      render(<NoVersionsEmptyState variant="centered" />);

      const container = screen.getByTestId('empty-state-no-versions');
      expect(container).toHaveClass('empty-state--centered');
    });
  });

  describe('className inheritance', () => {
    it('NoPoemEmptyState passes className', () => {
      render(<NoPoemEmptyState className="test-class" />);
      expect(screen.getByTestId('empty-state-no-poem')).toHaveClass('test-class');
    });

    it('NoAnalysisEmptyState passes className', () => {
      render(<NoAnalysisEmptyState className="test-class" />);
      expect(screen.getByTestId('empty-state-no-analysis')).toHaveClass('test-class');
    });

    it('NoMelodyEmptyState passes className', () => {
      render(<NoMelodyEmptyState className="test-class" />);
      expect(screen.getByTestId('empty-state-no-melody')).toHaveClass('test-class');
    });

    it('NoRecordingsEmptyState passes className', () => {
      render(<NoRecordingsEmptyState className="test-class" />);
      expect(screen.getByTestId('empty-state-no-recordings')).toHaveClass('test-class');
    });

    it('NoVersionsEmptyState passes className', () => {
      render(<NoVersionsEmptyState className="test-class" />);
      expect(screen.getByTestId('empty-state-no-versions')).toHaveClass('test-class');
    });
  });

  describe('icon accessibility', () => {
    it('all icons have aria-hidden="true"', () => {
      const variants = [
        <NoPoemEmptyState key="poem" />,
        <NoAnalysisEmptyState key="analysis" />,
        <NoMelodyEmptyState key="melody" />,
        <NoRecordingsEmptyState key="recording" />,
        <NoVersionsEmptyState key="versions" />,
      ];

      variants.forEach((variant) => {
        const { container } = render(variant);
        const svg = container.querySelector('svg');
        expect(svg?.getAttribute('aria-hidden')).toBe('true');
        cleanup();
      });
    });
  });
});
