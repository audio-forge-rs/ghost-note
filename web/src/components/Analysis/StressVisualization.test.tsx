/**
 * Tests for StressVisualization Component
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { StressVisualization } from './StressVisualization';
import {
  createDefaultStructuredPoem,
  createDefaultMeterAnalysis,
  type StructuredPoem,
  type MeterAnalysis,
} from '@/types/analysis';

describe('StressVisualization', () => {
  afterEach(() => {
    cleanup();
  });

  const createMockStructure = (): StructuredPoem => ({
    stanzas: [
      {
        lines: [
          {
            text: 'To be or not to be',
            words: [],
            stressPattern: '010010',
            syllableCount: 6,
            singability: { syllableScores: [], lineScore: 0.8, problemSpots: [] },
          },
          {
            text: 'That is the question',
            words: [],
            stressPattern: '1010',
            syllableCount: 4,
            singability: { syllableScores: [], lineScore: 0.8, problemSpots: [] },
          },
        ],
      },
    ],
  });

  const createMockMeter = (): MeterAnalysis => ({
    pattern: '0100100100',
    detectedMeter: 'iambic_pentameter',
    footType: 'iamb',
    feetPerLine: 5,
    confidence: 0.85,
    deviations: [2, 7],
  });

  describe('rendering', () => {
    it('renders the stress visualization container', () => {
      const structure = createMockStructure();
      const meter = createMockMeter();
      render(<StressVisualization structure={structure} meter={meter} />);
      expect(screen.getByTestId('stress-visualization')).toBeInTheDocument();
    });

    it('renders empty state when structure has no stanzas', () => {
      const structure = createDefaultStructuredPoem();
      const meter = createDefaultMeterAnalysis();
      render(<StressVisualization structure={structure} meter={meter} />);
      expect(screen.getByText(/No stress pattern data available/i)).toBeInTheDocument();
    });

    it('renders title', () => {
      const structure = createMockStructure();
      const meter = createMockMeter();
      render(<StressVisualization structure={structure} meter={meter} />);
      expect(screen.getByText('Stress Patterns')).toBeInTheDocument();
    });

    it('displays detected meter name', () => {
      const structure = createMockStructure();
      const meter = createMockMeter();
      render(<StressVisualization structure={structure} meter={meter} />);
      expect(screen.getByText('iambic_pentameter')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const structure = createMockStructure();
      const meter = createMockMeter();
      render(<StressVisualization structure={structure} meter={meter} className="custom-class" />);
      expect(screen.getByTestId('stress-visualization')).toHaveClass('custom-class');
    });
  });

  describe('legend', () => {
    it('renders legend with primary stress', () => {
      const structure = createMockStructure();
      const meter = createMockMeter();
      render(<StressVisualization structure={structure} meter={meter} />);
      expect(screen.getByText('Primary stress')).toBeInTheDocument();
    });

    it('renders legend with secondary stress', () => {
      const structure = createMockStructure();
      const meter = createMockMeter();
      render(<StressVisualization structure={structure} meter={meter} />);
      expect(screen.getByText('Secondary stress')).toBeInTheDocument();
    });

    it('renders legend with unstressed', () => {
      const structure = createMockStructure();
      const meter = createMockMeter();
      render(<StressVisualization structure={structure} meter={meter} />);
      expect(screen.getByText('Unstressed')).toBeInTheDocument();
    });

    it('renders legend with deviation marker', () => {
      const structure = createMockStructure();
      const meter = createMockMeter();
      render(<StressVisualization structure={structure} meter={meter} />);
      expect(screen.getByText('Deviation from meter')).toBeInTheDocument();
    });
  });

  describe('content display', () => {
    it('renders stanzas', () => {
      const structure = createMockStructure();
      const meter = createMockMeter();
      render(<StressVisualization structure={structure} meter={meter} />);
      expect(screen.getByTestId('stress-stanza-0')).toBeInTheDocument();
    });

    it('renders lines within stanzas', () => {
      const structure = createMockStructure();
      const meter = createMockMeter();
      render(<StressVisualization structure={structure} meter={meter} />);
      expect(screen.getByTestId('stress-line-0-0')).toBeInTheDocument();
      expect(screen.getByTestId('stress-line-0-1')).toBeInTheDocument();
    });

    it('displays line text', () => {
      const structure = createMockStructure();
      const meter = createMockMeter();
      render(<StressVisualization structure={structure} meter={meter} />);
      expect(screen.getByText('To be or not to be')).toBeInTheDocument();
      expect(screen.getByText('That is the question')).toBeInTheDocument();
    });

    it('displays stress symbols for each syllable', () => {
      const structure = createMockStructure();
      const meter = createMockMeter();
      render(<StressVisualization structure={structure} meter={meter} />);

      // Check that pattern group exists
      const patterns = screen.getAllByRole('group', { name: /stress pattern for line/i });
      expect(patterns.length).toBeGreaterThan(0);
    });
  });

  describe('summary statistics', () => {
    it('displays foot type', () => {
      const structure = createMockStructure();
      const meter = createMockMeter();
      render(<StressVisualization structure={structure} meter={meter} />);
      expect(screen.getByText(/Foot type:/)).toBeInTheDocument();
      expect(screen.getByText('iamb')).toBeInTheDocument();
    });

    it('displays feet per line', () => {
      const structure = createMockStructure();
      const meter = createMockMeter();
      render(<StressVisualization structure={structure} meter={meter} />);
      expect(screen.getByText(/Feet per line:/)).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('displays confidence percentage', () => {
      const structure = createMockStructure();
      const meter = createMockMeter();
      render(<StressVisualization structure={structure} meter={meter} />);
      expect(screen.getByText(/Confidence:/)).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('displays deviation count', () => {
      const structure = createMockStructure();
      const meter = createMockMeter();
      render(<StressVisualization structure={structure} meter={meter} />);
      expect(screen.getByText(/Deviations:/)).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has accessible region role', () => {
      const structure = createMockStructure();
      const meter = createMockMeter();
      render(<StressVisualization structure={structure} meter={meter} />);
      expect(screen.getByRole('region', { name: /stress pattern visualization/i })).toBeInTheDocument();
    });

    it('legend has list role', () => {
      const structure = createMockStructure();
      const meter = createMockMeter();
      render(<StressVisualization structure={structure} meter={meter} />);
      expect(screen.getByRole('list', { name: /legend/i })).toBeInTheDocument();
    });

    it('stress patterns have group role with labels', () => {
      const structure = createMockStructure();
      const meter = createMockMeter();
      render(<StressVisualization structure={structure} meter={meter} />);
      const groups = screen.getAllByRole('group', { name: /stress pattern for line/i });
      expect(groups.length).toBeGreaterThan(0);
    });

    it('summary has aria-live for dynamic updates', () => {
      const structure = createMockStructure();
      const meter = createMockMeter();
      render(<StressVisualization structure={structure} meter={meter} />);
      const summary = screen.getByText(/Foot type:/i).closest('div');
      expect(summary).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('irregular meter handling', () => {
    it('displays irregular label when meter is irregular', () => {
      const structure = createMockStructure();
      const meter: MeterAnalysis = {
        ...createMockMeter(),
        detectedMeter: 'irregular',
        footType: 'unknown',
      };
      render(<StressVisualization structure={structure} meter={meter} />);
      expect(screen.getByText('irregular')).toBeInTheDocument();
    });
  });
});
