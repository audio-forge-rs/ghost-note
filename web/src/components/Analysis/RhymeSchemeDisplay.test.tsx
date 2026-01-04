/**
 * Tests for RhymeSchemeDisplay Component
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { RhymeSchemeDisplay } from './RhymeSchemeDisplay';
import {
  createDefaultStructuredPoem,
  createDefaultRhymeAnalysis,
  type StructuredPoem,
  type RhymeAnalysis,
} from '@/types/analysis';

describe('RhymeSchemeDisplay', () => {
  afterEach(() => {
    cleanup();
  });

  const createMockStructure = (): StructuredPoem => ({
    stanzas: [
      {
        lines: [
          {
            text: 'The rose is red',
            words: [
              { text: 'The', syllables: [] },
              { text: 'rose', syllables: [] },
              { text: 'is', syllables: [] },
              { text: 'red', syllables: [] },
            ],
            stressPattern: '0101',
            syllableCount: 4,
            singability: { syllableScores: [], lineScore: 0.8, problemSpots: [] },
          },
          {
            text: 'The violet blue',
            words: [
              { text: 'The', syllables: [] },
              { text: 'violet', syllables: [] },
              { text: 'blue', syllables: [] },
            ],
            stressPattern: '010',
            syllableCount: 3,
            singability: { syllableScores: [], lineScore: 0.8, problemSpots: [] },
          },
          {
            text: 'Sugar is sweet',
            words: [
              { text: 'Sugar', syllables: [] },
              { text: 'is', syllables: [] },
              { text: 'sweet', syllables: [] },
            ],
            stressPattern: '101',
            syllableCount: 3,
            singability: { syllableScores: [], lineScore: 0.8, problemSpots: [] },
          },
          {
            text: 'And so are you',
            words: [
              { text: 'And', syllables: [] },
              { text: 'so', syllables: [] },
              { text: 'are', syllables: [] },
              { text: 'you', syllables: [] },
            ],
            stressPattern: '0101',
            syllableCount: 4,
            singability: { syllableScores: [], lineScore: 0.8, problemSpots: [] },
          },
        ],
      },
    ],
  });

  const createMockRhyme = (): RhymeAnalysis => ({
    scheme: 'ABAB',
    rhymeGroups: {
      A: { lines: [0, 2], rhymeType: 'perfect', endWords: ['red', 'sweet'] },
      B: { lines: [1, 3], rhymeType: 'perfect', endWords: ['blue', 'you'] },
    },
    internalRhymes: [{ line: 0, positions: [1, 3] }],
  });

  describe('rendering', () => {
    it('renders the rhyme scheme display container', () => {
      const structure = createMockStructure();
      const rhyme = createMockRhyme();
      render(<RhymeSchemeDisplay rhyme={rhyme} structure={structure} />);
      expect(screen.getByTestId('rhyme-scheme-display')).toBeInTheDocument();
    });

    it('renders empty state when structure has no stanzas', () => {
      const structure = createDefaultStructuredPoem();
      const rhyme = createDefaultRhymeAnalysis();
      render(<RhymeSchemeDisplay rhyme={rhyme} structure={structure} />);
      expect(screen.getByText(/No rhyme data available/i)).toBeInTheDocument();
    });

    it('renders title', () => {
      const structure = createMockStructure();
      const rhyme = createMockRhyme();
      render(<RhymeSchemeDisplay rhyme={rhyme} structure={structure} />);
      expect(screen.getByText('Rhyme Scheme')).toBeInTheDocument();
    });

    it('displays rhyme scheme pattern', () => {
      const structure = createMockStructure();
      const rhyme = createMockRhyme();
      render(<RhymeSchemeDisplay rhyme={rhyme} structure={structure} />);
      expect(screen.getByText('ABAB')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const structure = createMockStructure();
      const rhyme = createMockRhyme();
      render(<RhymeSchemeDisplay rhyme={rhyme} structure={structure} className="custom-class" />);
      expect(screen.getByTestId('rhyme-scheme-display')).toHaveClass('custom-class');
    });
  });

  describe('legend', () => {
    it('renders legend with rhyme groups', () => {
      const structure = createMockStructure();
      const rhyme = createMockRhyme();
      render(<RhymeSchemeDisplay rhyme={rhyme} structure={structure} />);
      expect(screen.getByRole('list', { name: /rhyme scheme legend/i })).toBeInTheDocument();
    });

    it('displays end words for each rhyme group', () => {
      const structure = createMockStructure();
      const rhyme = createMockRhyme();
      render(<RhymeSchemeDisplay rhyme={rhyme} structure={structure} />);
      expect(screen.getByText(/A: red, sweet/)).toBeInTheDocument();
      expect(screen.getByText(/B: blue, you/)).toBeInTheDocument();
    });

    it('displays rhyme type for each group', () => {
      const structure = createMockStructure();
      const rhyme = createMockRhyme();
      render(<RhymeSchemeDisplay rhyme={rhyme} structure={structure} />);
      const perfectLabels = screen.getAllByText('(perfect)');
      expect(perfectLabels.length).toBe(2);
    });
  });

  describe('content display', () => {
    it('renders stanzas', () => {
      const structure = createMockStructure();
      const rhyme = createMockRhyme();
      render(<RhymeSchemeDisplay rhyme={rhyme} structure={structure} />);
      expect(screen.getByTestId('rhyme-stanza-0')).toBeInTheDocument();
    });

    it('renders lines within stanzas', () => {
      const structure = createMockStructure();
      const rhyme = createMockRhyme();
      render(<RhymeSchemeDisplay rhyme={rhyme} structure={structure} />);
      expect(screen.getByTestId('rhyme-line-0-0')).toBeInTheDocument();
      expect(screen.getByTestId('rhyme-line-0-1')).toBeInTheDocument();
    });

    it('displays rhyme scheme letter for each line', () => {
      const structure = createMockStructure();
      const rhyme = createMockRhyme();
      render(<RhymeSchemeDisplay rhyme={rhyme} structure={structure} />);

      // The first line should have A, second B, etc.
      const letters = screen.getAllByText('A');
      expect(letters.length).toBeGreaterThan(0);
    });
  });

  describe('internal rhymes section', () => {
    it('renders internal rhymes section when present', () => {
      const structure = createMockStructure();
      const rhyme = createMockRhyme();
      render(<RhymeSchemeDisplay rhyme={rhyme} structure={structure} />);
      expect(screen.getByText('Internal Rhymes')).toBeInTheDocument();
    });

    it('does not render internal rhymes section when empty', () => {
      const structure = createMockStructure();
      const rhyme: RhymeAnalysis = {
        ...createMockRhyme(),
        internalRhymes: [],
      };
      render(<RhymeSchemeDisplay rhyme={rhyme} structure={structure} />);
      expect(screen.queryByText('Internal Rhymes')).not.toBeInTheDocument();
    });

    it('displays internal rhyme positions', () => {
      const structure = createMockStructure();
      const rhyme = createMockRhyme();
      render(<RhymeSchemeDisplay rhyme={rhyme} structure={structure} />);
      expect(screen.getByText(/Line 1: positions 2 and 4/)).toBeInTheDocument();
    });
  });

  describe('summary statistics', () => {
    it('displays rhyme group count', () => {
      const structure = createMockStructure();
      const rhyme = createMockRhyme();
      render(<RhymeSchemeDisplay rhyme={rhyme} structure={structure} />);
      expect(screen.getByText(/Rhyme groups:/)).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('displays internal rhyme count', () => {
      const structure = createMockStructure();
      const rhyme = createMockRhyme();
      render(<RhymeSchemeDisplay rhyme={rhyme} structure={structure} />);
      expect(screen.getByText(/Internal rhymes:/)).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has accessible region role', () => {
      const structure = createMockStructure();
      const rhyme = createMockRhyme();
      render(<RhymeSchemeDisplay rhyme={rhyme} structure={structure} />);
      expect(screen.getByRole('region', { name: /rhyme scheme visualization/i })).toBeInTheDocument();
    });

    it('legend has list role', () => {
      const structure = createMockStructure();
      const rhyme = createMockRhyme();
      render(<RhymeSchemeDisplay rhyme={rhyme} structure={structure} />);
      expect(screen.getByRole('list', { name: /rhyme scheme legend/i })).toBeInTheDocument();
    });

    it('rhyme letters have aria-label', () => {
      const structure = createMockStructure();
      const rhyme = createMockRhyme();
      render(<RhymeSchemeDisplay rhyme={rhyme} structure={structure} />);
      const letterElements = screen.getAllByLabelText(/rhyme group [A-Z]/i);
      expect(letterElements.length).toBeGreaterThan(0);
    });

    it('summary has aria-live for dynamic updates', () => {
      const structure = createMockStructure();
      const rhyme = createMockRhyme();
      render(<RhymeSchemeDisplay rhyme={rhyme} structure={structure} />);
      const summary = screen.getByText(/Rhyme groups:/i).closest('div');
      expect(summary).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('no rhyme scheme', () => {
    it('displays none detected when scheme is empty', () => {
      const structure = createMockStructure();
      const rhyme: RhymeAnalysis = {
        scheme: '',
        rhymeGroups: {},
        internalRhymes: [],
      };
      render(<RhymeSchemeDisplay rhyme={rhyme} structure={structure} />);
      expect(screen.getByText('None detected')).toBeInTheDocument();
    });
  });
});
