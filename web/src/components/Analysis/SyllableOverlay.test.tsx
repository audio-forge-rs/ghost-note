/**
 * Tests for SyllableOverlay Component
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { SyllableOverlay } from './SyllableOverlay';
import { createDefaultStructuredPoem, type StructuredPoem } from '@/types/analysis';

describe('SyllableOverlay', () => {
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
              { text: 'The', syllables: [{ phonemes: ['DH', 'AH0'], stress: 0, vowelPhoneme: 'AH0', isOpen: false }] },
              { text: 'rose', syllables: [{ phonemes: ['R', 'OW1', 'Z'], stress: 1, vowelPhoneme: 'OW1', isOpen: false }] },
              { text: 'is', syllables: [{ phonemes: ['IH0', 'Z'], stress: 0, vowelPhoneme: 'IH0', isOpen: false }] },
              { text: 'red', syllables: [{ phonemes: ['R', 'EH1', 'D'], stress: 1, vowelPhoneme: 'EH1', isOpen: false }] },
            ],
            stressPattern: '0101',
            syllableCount: 4,
            singability: { syllableScores: [0.8, 0.9, 0.7, 0.8], lineScore: 0.8, problemSpots: [] },
          },
          {
            text: 'The violet blue',
            words: [
              { text: 'The', syllables: [{ phonemes: ['DH', 'AH0'], stress: 0, vowelPhoneme: 'AH0', isOpen: false }] },
              { text: 'violet', syllables: [
                { phonemes: ['V', 'AY1'], stress: 1, vowelPhoneme: 'AY1', isOpen: false },
                { phonemes: ['AH0', 'L', 'AH0', 'T'], stress: 0, vowelPhoneme: 'AH0', isOpen: false },
              ] },
              { text: 'blue', syllables: [{ phonemes: ['B', 'L', 'UW1'], stress: 1, vowelPhoneme: 'UW1', isOpen: true }] },
            ],
            stressPattern: '0101',
            syllableCount: 4,
            singability: { syllableScores: [0.8, 0.9, 0.7, 0.8], lineScore: 0.8, problemSpots: [] },
          },
        ],
      },
    ],
  });

  describe('rendering', () => {
    it('renders the syllable overlay container', () => {
      const structure = createMockStructure();
      render(<SyllableOverlay structure={structure} />);
      expect(screen.getByTestId('syllable-overlay')).toBeInTheDocument();
    });

    it('renders empty state when structure has no stanzas', () => {
      const structure = createDefaultStructuredPoem();
      render(<SyllableOverlay structure={structure} />);
      expect(screen.getByText(/No syllable data available/i)).toBeInTheDocument();
    });

    it('renders title', () => {
      const structure = createMockStructure();
      render(<SyllableOverlay structure={structure} />);
      expect(screen.getByText('Syllable Counts')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const structure = createMockStructure();
      render(<SyllableOverlay structure={structure} className="custom-class" />);
      expect(screen.getByTestId('syllable-overlay')).toHaveClass('custom-class');
    });
  });

  describe('content display', () => {
    it('renders stanzas', () => {
      const structure = createMockStructure();
      render(<SyllableOverlay structure={structure} />);
      expect(screen.getByTestId('syllable-stanza-0')).toBeInTheDocument();
    });

    it('renders lines within stanzas', () => {
      const structure = createMockStructure();
      render(<SyllableOverlay structure={structure} />);
      expect(screen.getByTestId('syllable-line-0-0')).toBeInTheDocument();
      expect(screen.getByTestId('syllable-line-0-1')).toBeInTheDocument();
    });

    it('displays line text', () => {
      const structure = createMockStructure();
      render(<SyllableOverlay structure={structure} />);
      expect(screen.getByText('The rose is red')).toBeInTheDocument();
      expect(screen.getByText('The violet blue')).toBeInTheDocument();
    });

    it('displays syllable counts', () => {
      const structure = createMockStructure();
      render(<SyllableOverlay structure={structure} />);
      expect(screen.getByTestId('syllable-count-0-0')).toHaveTextContent('4');
      expect(screen.getByTestId('syllable-count-0-1')).toHaveTextContent('4');
    });
  });

  describe('median calculation', () => {
    it('displays median syllable count', () => {
      const structure = createMockStructure();
      render(<SyllableOverlay structure={structure} />);
      expect(screen.getByText(/Median:/)).toBeInTheDocument();
    });

    it('calculates correct median for even number of lines', () => {
      const structure = createMockStructure();
      render(<SyllableOverlay structure={structure} />);
      // Both lines have 4 syllables, so median is 4.0
      expect(screen.getByText('Median: 4.0')).toBeInTheDocument();
    });
  });

  describe('summary statistics', () => {
    it('displays total lines count', () => {
      const structure = createMockStructure();
      render(<SyllableOverlay structure={structure} />);
      expect(screen.getByText(/Total lines: 2/)).toBeInTheDocument();
    });

    it('displays total syllables count', () => {
      const structure = createMockStructure();
      render(<SyllableOverlay structure={structure} />);
      expect(screen.getByText(/Total syllables: 8/)).toBeInTheDocument();
    });

    it('displays syllable range', () => {
      const structure = createMockStructure();
      render(<SyllableOverlay structure={structure} />);
      expect(screen.getByText(/Range: 4 - 4/)).toBeInTheDocument();
    });
  });

  describe('deviation highlighting', () => {
    it('applies normal class for lines at median', () => {
      const structure = createMockStructure();
      render(<SyllableOverlay structure={structure} />);
      const line = screen.getByTestId('syllable-line-0-0');
      expect(line).toHaveClass('syllable-overlay__line--normal');
    });

    it('applies minor deviation class for lines slightly off median', () => {
      const structure: StructuredPoem = {
        stanzas: [
          {
            lines: [
              {
                text: 'Short line',
                words: [
                  { text: 'Short', syllables: [{ phonemes: ['SH'], stress: 1, vowelPhoneme: 'O', isOpen: false }] },
                  { text: 'line', syllables: [{ phonemes: ['L'], stress: 1, vowelPhoneme: 'I', isOpen: false }] },
                ],
                stressPattern: '11',
                syllableCount: 2,
                singability: { syllableScores: [0.8, 0.8], lineScore: 0.8, problemSpots: [] },
              },
              {
                text: 'A longer line here',
                words: [
                  { text: 'A', syllables: [{ phonemes: ['AH0'], stress: 0, vowelPhoneme: 'AH0', isOpen: false }] },
                  { text: 'longer', syllables: [
                    { phonemes: ['L'], stress: 1, vowelPhoneme: 'O', isOpen: false },
                    { phonemes: ['ER'], stress: 0, vowelPhoneme: 'ER', isOpen: false },
                  ] },
                  { text: 'line', syllables: [{ phonemes: ['L'], stress: 1, vowelPhoneme: 'I', isOpen: false }] },
                  { text: 'here', syllables: [{ phonemes: ['H'], stress: 1, vowelPhoneme: 'I', isOpen: false }] },
                ],
                stressPattern: '0101',
                syllableCount: 5,
                singability: { syllableScores: [0.8, 0.8, 0.8, 0.8, 0.8], lineScore: 0.8, problemSpots: [] },
              },
            ],
          },
        ],
      };
      render(<SyllableOverlay structure={structure} />);
      // Line with 2 syllables when median is 3.5 - diff is 1.5, should be minor
      const line = screen.getByTestId('syllable-line-0-0');
      expect(line).toHaveClass('syllable-overlay__line--minor');
    });
  });

  describe('accessibility', () => {
    it('has accessible region role', () => {
      const structure = createMockStructure();
      render(<SyllableOverlay structure={structure} />);
      expect(screen.getByRole('region', { name: /syllable count analysis/i })).toBeInTheDocument();
    });

    it('syllable count buttons have aria-describedby for tooltips', () => {
      const structure = createMockStructure();
      render(<SyllableOverlay structure={structure} />);
      const countButton = screen.getByTestId('syllable-count-0-0');
      expect(countButton).toHaveAttribute('aria-describedby');
    });

    it('stanza breaks have separator role', () => {
      const structure: StructuredPoem = {
        stanzas: [
          {
            lines: [
              {
                text: 'First stanza',
                words: [{ text: 'First', syllables: [{ phonemes: ['F'], stress: 1, vowelPhoneme: 'I', isOpen: false }] }],
                stressPattern: '1',
                syllableCount: 1,
                singability: { syllableScores: [0.8], lineScore: 0.8, problemSpots: [] },
              },
            ],
          },
          {
            lines: [
              {
                text: 'Second stanza',
                words: [{ text: 'Second', syllables: [{ phonemes: ['S'], stress: 1, vowelPhoneme: 'E', isOpen: false }] }],
                stressPattern: '1',
                syllableCount: 1,
                singability: { syllableScores: [0.8], lineScore: 0.8, problemSpots: [] },
              },
            ],
          },
        ],
      };
      render(<SyllableOverlay structure={structure} />);
      expect(screen.getByRole('separator', { hidden: true })).toBeInTheDocument();
    });

    it('summary has aria-live for dynamic updates', () => {
      const structure = createMockStructure();
      render(<SyllableOverlay structure={structure} />);
      const summary = screen.getByText(/Total lines:/i).closest('div');
      expect(summary).toHaveAttribute('aria-live', 'polite');
    });
  });
});
