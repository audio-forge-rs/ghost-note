/**
 * Tests for AnalysisPanel Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { AnalysisPanel, type AnalysisToggles } from './AnalysisPanel';
import { createDefaultPoemAnalysis, type PoemAnalysis } from '@/types/analysis';

// Mock child components
vi.mock('./SyllableOverlay', () => ({
  SyllableOverlay: () => <div data-testid="syllable-overlay-mock">SyllableOverlay</div>,
}));

vi.mock('./StressVisualization', () => ({
  StressVisualization: () => <div data-testid="stress-viz-mock">StressVisualization</div>,
}));

vi.mock('./RhymeSchemeDisplay', () => ({
  RhymeSchemeDisplay: () => <div data-testid="rhyme-display-mock">RhymeSchemeDisplay</div>,
}));

vi.mock('./MeterDisplay', () => ({
  MeterDisplay: () => <div data-testid="meter-display-mock">MeterDisplay</div>,
}));

vi.mock('./SingabilityHeatmap', () => ({
  SingabilityHeatmap: () => <div data-testid="singability-heatmap-mock">SingabilityHeatmap</div>,
}));

describe('AnalysisPanel', () => {
  let mockAnalysis: PoemAnalysis;

  beforeEach(() => {
    mockAnalysis = createDefaultPoemAnalysis();
    // Add some structure so it's not empty
    mockAnalysis.structure.stanzas = [
      {
        lines: [
          {
            text: 'Test line',
            words: [],
            stressPattern: '01',
            syllableCount: 2,
            singability: {
              syllableScores: [0.8, 0.9],
              lineScore: 0.85,
              problemSpots: [],
            },
          },
        ],
      },
    ];
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the analysis panel container', () => {
      render(<AnalysisPanel analysis={mockAnalysis} />);
      expect(screen.getByTestId('analysis-panel')).toBeInTheDocument();
    });

    it('renders empty state when analysis is null', () => {
      render(<AnalysisPanel analysis={null} />);
      expect(screen.getByText(/No analysis data available/i)).toBeInTheDocument();
    });

    it('renders toggle controls', () => {
      render(<AnalysisPanel analysis={mockAnalysis} />);
      expect(screen.getByTestId('toggle-syllables')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-stress')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-rhyme')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-meter')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-singability')).toBeInTheDocument();
    });

    it('renders toggle all button', () => {
      render(<AnalysisPanel analysis={mockAnalysis} />);
      expect(screen.getByTestId('toggle-all-button')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<AnalysisPanel analysis={mockAnalysis} className="custom-class" />);
      expect(screen.getByTestId('analysis-panel')).toHaveClass('custom-class');
    });
  });

  describe('toggle functionality', () => {
    it('toggles individual visualizations when clicked', () => {
      render(<AnalysisPanel analysis={mockAnalysis} />);

      const syllableToggle = screen.getByTestId('toggle-syllables');
      expect(syllableToggle).toHaveAttribute('aria-pressed', 'false');

      fireEvent.click(syllableToggle);
      expect(syllableToggle).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('syllable-overlay-mock')).toBeInTheDocument();
    });

    it('shows hint when no toggles are active', () => {
      render(<AnalysisPanel analysis={mockAnalysis} />);
      expect(screen.getByTestId('toggle-hint')).toBeInTheDocument();
    });

    it('hides hint when at least one toggle is active', () => {
      render(<AnalysisPanel analysis={mockAnalysis} />);

      fireEvent.click(screen.getByTestId('toggle-syllables'));
      expect(screen.queryByTestId('toggle-hint')).not.toBeInTheDocument();
    });

    it('toggles all visualizations on/off', () => {
      render(<AnalysisPanel analysis={mockAnalysis} />);

      const toggleAllButton = screen.getByTestId('toggle-all-button');

      // Enable all
      fireEvent.click(toggleAllButton);
      expect(screen.getByTestId('toggle-syllables')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('toggle-stress')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('toggle-rhyme')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('toggle-meter')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('toggle-singability')).toHaveAttribute('aria-pressed', 'true');

      // Disable all
      fireEvent.click(toggleAllButton);
      expect(screen.getByTestId('toggle-syllables')).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByTestId('toggle-stress')).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('initial state', () => {
    it('respects initialToggles prop', () => {
      const initialToggles: Partial<AnalysisToggles> = {
        syllables: true,
        stress: true,
      };

      render(<AnalysisPanel analysis={mockAnalysis} initialToggles={initialToggles} />);

      expect(screen.getByTestId('toggle-syllables')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('toggle-stress')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('toggle-rhyme')).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('callbacks', () => {
    it('calls onTogglesChange when toggles change', () => {
      const onTogglesChange = vi.fn();

      render(
        <AnalysisPanel
          analysis={mockAnalysis}
          onTogglesChange={onTogglesChange}
        />
      );

      fireEvent.click(screen.getByTestId('toggle-syllables'));

      expect(onTogglesChange).toHaveBeenCalledWith(
        expect.objectContaining({ syllables: true })
      );
    });
  });

  describe('accessibility', () => {
    it('has accessible toggle group', () => {
      render(<AnalysisPanel analysis={mockAnalysis} />);

      const toggleGroup = screen.getByRole('group', { name: /analysis visualization toggles/i });
      expect(toggleGroup).toBeInTheDocument();
    });

    it('toggles have aria-pressed attribute', () => {
      render(<AnalysisPanel analysis={mockAnalysis} />);

      const toggle = screen.getByTestId('toggle-syllables');
      expect(toggle).toHaveAttribute('aria-pressed');
    });

    it('toggle all button has aria-pressed attribute', () => {
      render(<AnalysisPanel analysis={mockAnalysis} />);

      const toggleAll = screen.getByTestId('toggle-all-button');
      expect(toggleAll).toHaveAttribute('aria-pressed', 'false');
    });

    it('content area has aria-live for dynamic updates', () => {
      render(<AnalysisPanel analysis={mockAnalysis} />);

      const content = screen.getByRole('group', { name: /analysis visualization toggles/i })
        .parentElement?.querySelector('[aria-live]');
      expect(content).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('visualization rendering', () => {
    it('renders SyllableOverlay when syllables toggle is on', () => {
      render(
        <AnalysisPanel
          analysis={mockAnalysis}
          initialToggles={{ syllables: true }}
        />
      );

      expect(screen.getByTestId('syllable-overlay-mock')).toBeInTheDocument();
    });

    it('renders StressVisualization when stress toggle is on', () => {
      render(
        <AnalysisPanel
          analysis={mockAnalysis}
          initialToggles={{ stress: true }}
        />
      );

      expect(screen.getByTestId('stress-viz-mock')).toBeInTheDocument();
    });

    it('renders RhymeSchemeDisplay when rhyme toggle is on', () => {
      render(
        <AnalysisPanel
          analysis={mockAnalysis}
          initialToggles={{ rhyme: true }}
        />
      );

      expect(screen.getByTestId('rhyme-display-mock')).toBeInTheDocument();
    });

    it('renders MeterDisplay when meter toggle is on', () => {
      render(
        <AnalysisPanel
          analysis={mockAnalysis}
          initialToggles={{ meter: true }}
        />
      );

      expect(screen.getByTestId('meter-display-mock')).toBeInTheDocument();
    });

    it('renders SingabilityHeatmap when singability toggle is on', () => {
      render(
        <AnalysisPanel
          analysis={mockAnalysis}
          initialToggles={{ singability: true }}
        />
      );

      expect(screen.getByTestId('singability-heatmap-mock')).toBeInTheDocument();
    });

    it('renders multiple visualizations when multiple toggles are on', () => {
      render(
        <AnalysisPanel
          analysis={mockAnalysis}
          initialToggles={{
            syllables: true,
            stress: true,
            rhyme: true,
          }}
        />
      );

      expect(screen.getByTestId('syllable-overlay-mock')).toBeInTheDocument();
      expect(screen.getByTestId('stress-viz-mock')).toBeInTheDocument();
      expect(screen.getByTestId('rhyme-display-mock')).toBeInTheDocument();
    });
  });
});
