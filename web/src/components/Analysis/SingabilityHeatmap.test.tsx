/**
 * Tests for SingabilityHeatmap Component
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { SingabilityHeatmap } from './SingabilityHeatmap';
import {
  createDefaultStructuredPoem,
  type StructuredPoem,
  type ProblemReport,
} from '@/types/analysis';

describe('SingabilityHeatmap', () => {
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
            singability: {
              syllableScores: [0.8, 0.9, 0.7, 0.6],
              lineScore: 0.75,
              problemSpots: [{ position: 3, issue: 'Consonant cluster', severity: 'low' }],
            },
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
            singability: {
              syllableScores: [0.9, 0.95, 0.85, 0.9],
              lineScore: 0.9,
              problemSpots: [],
            },
          },
        ],
      },
    ],
  });

  const createMockProblems = (): ProblemReport[] => [
    {
      line: 0,
      position: 3,
      type: 'singability',
      severity: 'medium',
      description: 'Hard consonant cluster at end of line',
      suggestedFix: 'Consider using an open syllable word',
    },
  ];

  describe('rendering', () => {
    it('renders the singability heatmap container', () => {
      const structure = createMockStructure();
      render(<SingabilityHeatmap structure={structure} problems={[]} />);
      expect(screen.getByTestId('singability-heatmap')).toBeInTheDocument();
    });

    it('renders empty state when structure has no stanzas', () => {
      const structure = createDefaultStructuredPoem();
      render(<SingabilityHeatmap structure={structure} problems={[]} />);
      expect(screen.getByText(/No singability data available/i)).toBeInTheDocument();
    });

    it('renders title', () => {
      const structure = createMockStructure();
      render(<SingabilityHeatmap structure={structure} problems={[]} />);
      expect(screen.getByText('Singability Heatmap')).toBeInTheDocument();
    });

    it('displays overall score badge', () => {
      const structure = createMockStructure();
      render(<SingabilityHeatmap structure={structure} problems={[]} />);
      // Average of 0.75 and 0.9 is 0.825, which rounds to 83% (>= 0.8 = Excellent)
      expect(screen.getByTitle('Average singability score')).toHaveTextContent(/Excellent/);
      expect(screen.getByTitle('Average singability score')).toHaveTextContent(/83%/);
    });

    it('applies custom className', () => {
      const structure = createMockStructure();
      render(<SingabilityHeatmap structure={structure} problems={[]} className="custom-class" />);
      expect(screen.getByTestId('singability-heatmap')).toHaveClass('custom-class');
    });
  });

  describe('legend', () => {
    it('renders gradient legend', () => {
      const structure = createMockStructure();
      render(<SingabilityHeatmap structure={structure} problems={[]} />);
      expect(screen.getByRole('list', { name: /score legend/i })).toBeInTheDocument();
    });

    it('displays difficult and easy labels', () => {
      const structure = createMockStructure();
      render(<SingabilityHeatmap structure={structure} problems={[]} />);
      expect(screen.getByText('Difficult')).toBeInTheDocument();
      expect(screen.getByText('Easy')).toBeInTheDocument();
    });
  });

  describe('content display', () => {
    it('renders stanzas', () => {
      const structure = createMockStructure();
      render(<SingabilityHeatmap structure={structure} problems={[]} />);
      expect(screen.getByTestId('singability-stanza-0')).toBeInTheDocument();
    });

    it('renders lines within stanzas', () => {
      const structure = createMockStructure();
      render(<SingabilityHeatmap structure={structure} problems={[]} />);
      expect(screen.getByTestId('singability-line-0-0')).toBeInTheDocument();
      expect(screen.getByTestId('singability-line-0-1')).toBeInTheDocument();
    });

    it('displays line score indicators', () => {
      const structure = createMockStructure();
      render(<SingabilityHeatmap structure={structure} problems={[]} />);
      // Line scores as percentages
      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText('90')).toBeInTheDocument();
    });

    it('displays problem count badge when problems exist', () => {
      const structure = createMockStructure();
      render(<SingabilityHeatmap structure={structure} problems={[]} />);
      // First line has 1 problem
      const problemBadges = screen.getAllByText('1');
      expect(problemBadges.length).toBeGreaterThan(0);
    });
  });

  describe('problems section', () => {
    it('renders problems section when singability problems exist', () => {
      const structure = createMockStructure();
      const problems = createMockProblems();
      render(<SingabilityHeatmap structure={structure} problems={problems} />);
      expect(screen.getByText('Problem Areas')).toBeInTheDocument();
    });

    it('does not render problems section when no singability problems', () => {
      const structure = createMockStructure();
      const problems: ProblemReport[] = [
        {
          line: 0,
          position: 0,
          type: 'stress_mismatch', // Not a singability problem
          severity: 'low',
          description: 'Test',
        },
      ];
      render(<SingabilityHeatmap structure={structure} problems={problems} />);
      expect(screen.queryByText('Problem Areas')).not.toBeInTheDocument();
    });

    it('displays problem description', () => {
      const structure = createMockStructure();
      const problems = createMockProblems();
      render(<SingabilityHeatmap structure={structure} problems={problems} />);
      expect(screen.getByText('Hard consonant cluster at end of line')).toBeInTheDocument();
    });

    it('displays suggested fix when present', () => {
      const structure = createMockStructure();
      const problems = createMockProblems();
      render(<SingabilityHeatmap structure={structure} problems={problems} />);
      expect(screen.getByText(/Suggestion: Consider using an open syllable word/)).toBeInTheDocument();
    });

    it('displays line number for each problem', () => {
      const structure = createMockStructure();
      const problems = createMockProblems();
      render(<SingabilityHeatmap structure={structure} problems={problems} />);
      expect(screen.getByText('Line 1')).toBeInTheDocument();
    });
  });

  describe('summary statistics', () => {
    it('displays average score', () => {
      const structure = createMockStructure();
      render(<SingabilityHeatmap structure={structure} problems={[]} />);
      expect(screen.getByText(/Average score:/)).toBeInTheDocument();
      expect(screen.getByText('83%')).toBeInTheDocument();
    });

    it('displays problem spots count', () => {
      const structure = createMockStructure();
      render(<SingabilityHeatmap structure={structure} problems={[]} />);
      expect(screen.getByText(/Problem spots:/)).toBeInTheDocument();
    });

    it('displays total syllables count', () => {
      const structure = createMockStructure();
      render(<SingabilityHeatmap structure={structure} problems={[]} />);
      expect(screen.getByText(/Total syllables:/)).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });
  });

  describe('score labels', () => {
    it('displays Excellent for high scores', () => {
      const structure: StructuredPoem = {
        stanzas: [
          {
            lines: [
              {
                text: 'Easy to sing',
                words: [{ text: 'Easy', syllables: [{ phonemes: ['E'], stress: 1, vowelPhoneme: 'E', isOpen: true }] }],
                stressPattern: '1',
                syllableCount: 1,
                singability: { syllableScores: [0.95], lineScore: 0.95, problemSpots: [] },
              },
            ],
          },
        ],
      };
      render(<SingabilityHeatmap structure={structure} problems={[]} />);
      const matches = screen.getAllByText(/Excellent/);
      expect(matches.length).toBeGreaterThan(0);
      expect(screen.getByTitle('Average singability score')).toHaveTextContent(/95%/);
    });

    it('displays Fair for medium scores', () => {
      const structure: StructuredPoem = {
        stanzas: [
          {
            lines: [
              {
                text: 'Somewhat hard',
                words: [{ text: 'Somewhat', syllables: [{ phonemes: ['S'], stress: 1, vowelPhoneme: 'O', isOpen: false }] }],
                stressPattern: '1',
                syllableCount: 1,
                singability: { syllableScores: [0.5], lineScore: 0.5, problemSpots: [] },
              },
            ],
          },
        ],
      };
      render(<SingabilityHeatmap structure={structure} problems={[]} />);
      const matches = screen.getAllByText(/Fair/);
      expect(matches.length).toBeGreaterThan(0);
      expect(screen.getByTitle('Average singability score')).toHaveTextContent(/50%/);
    });

    it('displays Difficult for low scores', () => {
      const structure: StructuredPoem = {
        stanzas: [
          {
            lines: [
              {
                text: 'Hard to sing',
                words: [{ text: 'Hard', syllables: [{ phonemes: ['H'], stress: 1, vowelPhoneme: 'A', isOpen: false }] }],
                stressPattern: '1',
                syllableCount: 1,
                singability: { syllableScores: [0.15], lineScore: 0.15, problemSpots: [] },
              },
            ],
          },
        ],
      };
      render(<SingabilityHeatmap structure={structure} problems={[]} />);
      const matches = screen.getAllByText(/Difficult/);
      expect(matches.length).toBeGreaterThan(0);
      // Score badge should contain the percentage
      expect(screen.getByTitle('Average singability score')).toHaveTextContent(/15%/);
    });
  });

  describe('accessibility', () => {
    it('has accessible region role', () => {
      const structure = createMockStructure();
      render(<SingabilityHeatmap structure={structure} problems={[]} />);
      expect(screen.getByRole('region', { name: /singability heatmap visualization/i })).toBeInTheDocument();
    });

    it('legend has list role', () => {
      const structure = createMockStructure();
      render(<SingabilityHeatmap structure={structure} problems={[]} />);
      expect(screen.getByRole('list', { name: /score legend/i })).toBeInTheDocument();
    });

    it('line scores have aria-label', () => {
      const structure = createMockStructure();
      render(<SingabilityHeatmap structure={structure} problems={[]} />);
      const scoreElements = screen.getAllByLabelText(/Line \d+ singability:/i);
      expect(scoreElements.length).toBeGreaterThan(0);
    });

    it('summary has aria-live for dynamic updates', () => {
      const structure = createMockStructure();
      render(<SingabilityHeatmap structure={structure} problems={[]} />);
      const summary = screen.getByText(/Average score:/i).closest('div');
      expect(summary).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('multiple stanzas', () => {
    it('renders stanza breaks between stanzas', () => {
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
      render(<SingabilityHeatmap structure={structure} problems={[]} />);
      expect(screen.getByRole('separator', { hidden: true })).toBeInTheDocument();
    });
  });
});
