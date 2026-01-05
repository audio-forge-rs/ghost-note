/**
 * Tests for EmotionArcChart Component
 */

import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmotionArcChart } from './EmotionArcChart';
import {
  createDefaultEmotionalAnalysis,
  type EmotionalAnalysis,
} from '@/types/analysis';

// Mock ResizeObserver as a class
class MockResizeObserver implements ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

describe('EmotionArcChart', () => {
  afterEach(() => {
    cleanup();
  });

  // Mock ResizeObserver
  beforeEach(() => {
    window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  });

  const createMockEmotion = (): EmotionalAnalysis => ({
    overallSentiment: 0.3,
    arousal: 0.6,
    dominantEmotions: ['hopeful', 'nostalgic', 'peaceful'],
    emotionalArc: [
      { stanza: 0, sentiment: -0.2, keywords: ['sad', 'lonely'] },
      { stanza: 1, sentiment: 0.1, keywords: ['hope', 'light'] },
      { stanza: 2, sentiment: 0.4, keywords: ['joy', 'love', 'happy'] },
      { stanza: 3, sentiment: 0.7, keywords: ['triumph', 'celebration'] },
    ],
    suggestedMusicParams: {
      mode: 'major',
      tempoRange: [90, 120],
      register: 'middle',
    },
  });

  const createSingleStanzaEmotion = (): EmotionalAnalysis => ({
    overallSentiment: 0.5,
    arousal: 0.3,
    dominantEmotions: ['peaceful'],
    emotionalArc: [
      { stanza: 0, sentiment: 0.5, keywords: ['calm', 'serene'] },
    ],
    suggestedMusicParams: {
      mode: 'major',
      tempoRange: [60, 80],
      register: 'low',
    },
  });

  const createNegativeEmotionArc = (): EmotionalAnalysis => ({
    overallSentiment: -0.5,
    arousal: 0.8,
    dominantEmotions: ['sad', 'angry', 'fearful'],
    emotionalArc: [
      { stanza: 0, sentiment: -0.3, keywords: ['dark', 'cold'] },
      { stanza: 1, sentiment: -0.6, keywords: ['sorrow', 'grief'] },
      { stanza: 2, sentiment: -0.8, keywords: ['despair', 'anguish'] },
    ],
    suggestedMusicParams: {
      mode: 'minor',
      tempoRange: [50, 70],
      register: 'low',
    },
  });

  describe('rendering', () => {
    it('renders the emotion arc chart container', () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);
      expect(screen.getByTestId('emotion-arc-chart')).toBeInTheDocument();
    });

    it('renders empty state when arc has no entries', () => {
      const emotion = createDefaultEmotionalAnalysis();
      render(<EmotionArcChart emotion={emotion} />);
      expect(screen.getByText(/No emotional arc data available/i)).toBeInTheDocument();
    });

    it('renders title', () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);
      expect(screen.getByText('Emotional Arc')).toBeInTheDocument();
    });

    it('displays arousal badge with correct label', () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);
      // 0.6 arousal = Energetic (0.6 to 0.8 range)
      expect(screen.getByTitle(/Overall arousal:/)).toHaveTextContent('Energetic');
    });

    it('applies custom className', () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} className="custom-class" />);
      expect(screen.getByTestId('emotion-arc-chart')).toHaveClass('custom-class');
    });
  });

  describe('arousal labels', () => {
    it('displays Very calm for low arousal (< 0.2)', () => {
      const emotion: EmotionalAnalysis = {
        ...createMockEmotion(),
        arousal: 0.1,
      };
      render(<EmotionArcChart emotion={emotion} />);
      expect(screen.getByTitle(/Overall arousal:/)).toHaveTextContent('Very calm');
    });

    it('displays Calm for arousal 0.2-0.4', () => {
      const emotion: EmotionalAnalysis = {
        ...createMockEmotion(),
        arousal: 0.3,
      };
      render(<EmotionArcChart emotion={emotion} />);
      expect(screen.getByTitle(/Overall arousal:/)).toHaveTextContent('Calm');
    });

    it('displays Moderate for arousal 0.4-0.6', () => {
      const emotion: EmotionalAnalysis = {
        ...createMockEmotion(),
        arousal: 0.5,
      };
      render(<EmotionArcChart emotion={emotion} />);
      expect(screen.getByTitle(/Overall arousal:/)).toHaveTextContent('Moderate');
    });

    it('displays Energetic for arousal 0.6-0.8', () => {
      const emotion: EmotionalAnalysis = {
        ...createMockEmotion(),
        arousal: 0.7,
      };
      render(<EmotionArcChart emotion={emotion} />);
      expect(screen.getByTitle(/Overall arousal:/)).toHaveTextContent('Energetic');
    });

    it('displays Intense for high arousal (>= 0.8)', () => {
      const emotion: EmotionalAnalysis = {
        ...createMockEmotion(),
        arousal: 0.9,
      };
      render(<EmotionArcChart emotion={emotion} />);
      expect(screen.getByTitle(/Overall arousal:/)).toHaveTextContent('Intense');
    });
  });

  describe('legend', () => {
    it('renders arousal legend', () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);
      expect(screen.getByRole('list', { name: /chart legend/i })).toBeInTheDocument();
    });

    it('displays calm and intense labels', () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);
      expect(screen.getByText('Calm')).toBeInTheDocument();
      expect(screen.getByText('Intense')).toBeInTheDocument();
    });

    it('displays Arousal label', () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);
      expect(screen.getByText('Arousal')).toBeInTheDocument();
    });
  });

  describe('SVG chart', () => {
    it('renders SVG element', () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);
      const svg = screen.getByRole('img', { name: /emotional arc chart/i });
      expect(svg).toBeInTheDocument();
      expect(svg.tagName.toLowerCase()).toBe('svg');
    });

    it('renders correct number of data points', () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);
      // 4 stanzas = 4 points, each has a button for accessibility
      const buttons = screen.getAllByRole('button', { name: /Stanza \d+:/i });
      expect(buttons).toHaveLength(4);
    });

    it('renders single point for single stanza', () => {
      const emotion = createSingleStanzaEmotion();
      render(<EmotionArcChart emotion={emotion} />);
      const buttons = screen.getAllByRole('button', { name: /Stanza \d+:/i });
      expect(buttons).toHaveLength(1);
    });

    it('includes Y-axis labels', () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);
      // Y-axis labels are in SVG text elements
      // Use getAllByText since these labels may appear elsewhere in the component
      expect(screen.getAllByText('Positive').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Neutral').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Negative').length).toBeGreaterThanOrEqual(1);
    });

    it('includes X-axis stanza labels', () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);
      expect(screen.getByText('S1')).toBeInTheDocument();
      expect(screen.getByText('S2')).toBeInTheDocument();
      expect(screen.getByText('S3')).toBeInTheDocument();
      expect(screen.getByText('S4')).toBeInTheDocument();
    });

    it('includes Stanza axis title', () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);
      expect(screen.getByText('Stanza')).toBeInTheDocument();
    });
  });

  describe('hover interaction', () => {
    it('shows tooltip on point hover', async () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);

      // Find the first point button and hover over it
      const firstButton = screen.getByRole('button', { name: /Stanza 1:/i });
      fireEvent.focus(firstButton);

      await waitFor(() => {
        expect(screen.getByTestId('emotion-arc-tooltip')).toBeInTheDocument();
      });
    });

    it('displays stanza number in tooltip', async () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);

      const firstButton = screen.getByRole('button', { name: /Stanza 1:/i });
      fireEvent.focus(firstButton);

      await waitFor(() => {
        const tooltip = screen.getByTestId('emotion-arc-tooltip');
        expect(tooltip).toHaveTextContent('Stanza 1');
      });
    });

    it('displays sentiment label in tooltip', async () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);

      // Focus on stanza 4 which has sentiment 0.7 (Very positive)
      const button = screen.getByRole('button', { name: /Stanza 4:/i });
      fireEvent.focus(button);

      await waitFor(() => {
        const tooltip = screen.getByTestId('emotion-arc-tooltip');
        expect(tooltip).toHaveTextContent('Sentiment:');
        expect(tooltip).toHaveTextContent('Very positive');
      });
    });

    it('displays keywords in tooltip', async () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);

      const button = screen.getByRole('button', { name: /Stanza 3:/i });
      fireEvent.focus(button);

      await waitFor(() => {
        const tooltip = screen.getByTestId('emotion-arc-tooltip');
        expect(tooltip).toHaveTextContent('Keywords:');
        expect(tooltip).toHaveTextContent('joy');
        expect(tooltip).toHaveTextContent('love');
        expect(tooltip).toHaveTextContent('happy');
      });
    });

    it('limits displayed keywords to 5', async () => {
      const emotion: EmotionalAnalysis = {
        ...createMockEmotion(),
        emotionalArc: [
          {
            stanza: 0,
            sentiment: 0.5,
            keywords: ['one', 'two', 'three', 'four', 'five', 'six', 'seven'],
          },
        ],
      };
      render(<EmotionArcChart emotion={emotion} />);

      const button = screen.getByRole('button', { name: /Stanza 1:/i });
      fireEvent.focus(button);

      await waitFor(() => {
        const tooltip = screen.getByTestId('emotion-arc-tooltip');
        expect(tooltip).toHaveTextContent('+2 more');
      });
    });

    it('hides tooltip when point loses focus', async () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);

      const firstButton = screen.getByRole('button', { name: /Stanza 1:/i });
      fireEvent.focus(firstButton);

      await waitFor(() => {
        expect(screen.getByTestId('emotion-arc-tooltip')).toBeInTheDocument();
      });

      fireEvent.blur(firstButton);

      await waitFor(() => {
        expect(screen.queryByTestId('emotion-arc-tooltip')).not.toBeInTheDocument();
      });
    });
  });

  describe('keyboard navigation', () => {
    it('first point is focusable with tab', async () => {
      const user = userEvent.setup();
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);

      const firstButton = screen.getByRole('button', { name: /Stanza 1:/i });
      await user.tab();

      // May require multiple tabs depending on page structure, check button is focusable
      expect(firstButton).toHaveAttribute('tabindex', '0');
    });

    it('other points have tabindex -1', () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);

      const buttons = screen.getAllByRole('button', { name: /Stanza \d+:/i });
      // First should be 0, others -1
      expect(buttons[0]).toHaveAttribute('tabindex', '0');
      expect(buttons[1]).toHaveAttribute('tabindex', '-1');
      expect(buttons[2]).toHaveAttribute('tabindex', '-1');
      expect(buttons[3]).toHaveAttribute('tabindex', '-1');
    });

    it('arrow right moves focus to next point', async () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);

      const firstButton = screen.getByRole('button', { name: /Stanza 1:/i });

      fireEvent.focus(firstButton);
      fireEvent.keyDown(firstButton, { key: 'ArrowRight' });

      // Check that focus moved to second button (the component sets focused index)
      await waitFor(() => {
        const tooltip = screen.getByTestId('emotion-arc-tooltip');
        expect(tooltip).toHaveTextContent('Stanza 2');
      });
    });

    it('arrow left moves focus to previous point', async () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);

      const secondButton = screen.getByRole('button', { name: /Stanza 2:/i });

      fireEvent.focus(secondButton);
      fireEvent.keyDown(secondButton, { key: 'ArrowLeft' });

      await waitFor(() => {
        const tooltip = screen.getByTestId('emotion-arc-tooltip');
        expect(tooltip).toHaveTextContent('Stanza 1');
      });
    });

    it('Home key moves focus to first point', async () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);

      const lastButton = screen.getByRole('button', { name: /Stanza 4:/i });

      fireEvent.focus(lastButton);
      fireEvent.keyDown(lastButton, { key: 'Home' });

      await waitFor(() => {
        const tooltip = screen.getByTestId('emotion-arc-tooltip');
        expect(tooltip).toHaveTextContent('Stanza 1');
      });
    });

    it('End key moves focus to last point', async () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);

      const firstButton = screen.getByRole('button', { name: /Stanza 1:/i });

      fireEvent.focus(firstButton);
      fireEvent.keyDown(firstButton, { key: 'End' });

      await waitFor(() => {
        const tooltip = screen.getByTestId('emotion-arc-tooltip');
        expect(tooltip).toHaveTextContent('Stanza 4');
      });
    });

    it('arrow left at first point stays at first point', async () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);

      const firstButton = screen.getByRole('button', { name: /Stanza 1:/i });

      fireEvent.focus(firstButton);
      fireEvent.keyDown(firstButton, { key: 'ArrowLeft' });

      await waitFor(() => {
        const tooltip = screen.getByTestId('emotion-arc-tooltip');
        expect(tooltip).toHaveTextContent('Stanza 1');
      });
    });

    it('arrow right at last point stays at last point', async () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);

      const lastButton = screen.getByRole('button', { name: /Stanza 4:/i });

      fireEvent.focus(lastButton);
      fireEvent.keyDown(lastButton, { key: 'ArrowRight' });

      await waitFor(() => {
        const tooltip = screen.getByTestId('emotion-arc-tooltip');
        expect(tooltip).toHaveTextContent('Stanza 4');
      });
    });
  });

  describe('summary statistics', () => {
    it('displays stanza count', () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);
      expect(screen.getByText(/Stanzas:/)).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('displays overall sentiment label', () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);
      expect(screen.getByText(/Overall sentiment:/)).toBeInTheDocument();
      // 0.3 = Positive - check the summary section specifically
      const summarySpan = screen.getByText(/Overall sentiment:/).closest('span');
      expect(summarySpan?.querySelector('strong')).toHaveTextContent('Positive');
    });

    it('displays dominant emotions', () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);
      expect(screen.getByText(/Dominant emotions:/)).toBeInTheDocument();
      expect(screen.getByText('hopeful, nostalgic, peaceful')).toBeInTheDocument();
    });

    it('displays None detected when no dominant emotions', () => {
      const emotion: EmotionalAnalysis = {
        ...createMockEmotion(),
        dominantEmotions: [],
      };
      render(<EmotionArcChart emotion={emotion} />);
      expect(screen.getByText('None detected')).toBeInTheDocument();
    });

    it('limits dominant emotions to 3', () => {
      const emotion: EmotionalAnalysis = {
        ...createMockEmotion(),
        dominantEmotions: ['one', 'two', 'three', 'four', 'five'],
      };
      render(<EmotionArcChart emotion={emotion} />);
      expect(screen.getByText('one, two, three')).toBeInTheDocument();
    });
  });

  describe('sentiment labels', () => {
    // Helper to get overall sentiment text from summary
    const getOverallSentimentText = (): string | null => {
      const span = screen.getByText(/Overall sentiment:/).closest('span');
      return span?.querySelector('strong')?.textContent ?? null;
    };

    it('displays Very negative for sentiment < -0.6', () => {
      const emotion: EmotionalAnalysis = {
        ...createMockEmotion(),
        overallSentiment: -0.8,
      };
      render(<EmotionArcChart emotion={emotion} />);
      expect(getOverallSentimentText()).toBe('Very negative');
    });

    it('displays Negative for sentiment -0.6 to -0.2', () => {
      const emotion: EmotionalAnalysis = {
        ...createMockEmotion(),
        overallSentiment: -0.4,
      };
      render(<EmotionArcChart emotion={emotion} />);
      expect(getOverallSentimentText()).toBe('Negative');
    });

    it('displays Neutral for sentiment -0.2 to 0.2', () => {
      const emotion: EmotionalAnalysis = {
        ...createMockEmotion(),
        overallSentiment: 0,
      };
      render(<EmotionArcChart emotion={emotion} />);
      expect(getOverallSentimentText()).toBe('Neutral');
    });

    it('displays Positive for sentiment 0.2 to 0.6', () => {
      const emotion: EmotionalAnalysis = {
        ...createMockEmotion(),
        overallSentiment: 0.4,
      };
      render(<EmotionArcChart emotion={emotion} />);
      expect(getOverallSentimentText()).toBe('Positive');
    });

    it('displays Very positive for sentiment >= 0.6', () => {
      const emotion: EmotionalAnalysis = {
        ...createMockEmotion(),
        overallSentiment: 0.8,
      };
      render(<EmotionArcChart emotion={emotion} />);
      expect(getOverallSentimentText()).toBe('Very positive');
    });
  });

  describe('accessibility', () => {
    it('has accessible region role', () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);
      expect(screen.getByRole('region', { name: /emotion arc visualization/i })).toBeInTheDocument();
    });

    it('SVG has img role with aria-label', () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);
      const svg = screen.getByRole('img', { name: /emotional arc chart/i });
      expect(svg).toBeInTheDocument();
    });

    it('SVG aria-label includes stanza count', () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);
      const svg = screen.getByRole('img', { name: /4 stanzas/i });
      expect(svg).toBeInTheDocument();
    });

    it('SVG aria-label includes arousal level', () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);
      // Arousal 0.6 -> Energetic (0.6 to 0.8 range)
      const svg = screen.getByRole('img', { name: /Energetic/i });
      expect(svg).toBeInTheDocument();
    });

    it('data point buttons have aria-label with stanza info', () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);
      const button = screen.getByRole('button', { name: /Stanza 1:.*keywords/i });
      expect(button).toBeInTheDocument();
    });

    it('legend has list role with aria-label', () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);
      expect(screen.getByRole('list', { name: /chart legend/i })).toBeInTheDocument();
    });

    it('summary has aria-live for dynamic updates', () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);
      const summary = screen.getByText(/Stanzas:/).closest('div');
      expect(summary).toHaveAttribute('aria-live', 'polite');
    });

    it('provides screen reader description for focused point', async () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);

      const button = screen.getByRole('button', { name: /Stanza 1:/i });
      fireEvent.focus(button);

      await waitFor(() => {
        // Check for visually hidden screen reader text
        const srText = screen.getByText(/Selected stanza 1:/i);
        expect(srText).toBeInTheDocument();
      });
    });
  });

  describe('negative sentiment arc', () => {
    it('renders correctly with all negative sentiments', () => {
      const emotion = createNegativeEmotionArc();
      render(<EmotionArcChart emotion={emotion} />);

      expect(screen.getByTestId('emotion-arc-chart')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // 3 stanzas
    });

    it('shows Intense arousal for high arousal value', () => {
      const emotion = createNegativeEmotionArc();
      render(<EmotionArcChart emotion={emotion} />);

      expect(screen.getByTitle(/Overall arousal:/)).toHaveTextContent('Intense');
    });

    it('shows Negative for overall negative sentiment', () => {
      const emotion = createNegativeEmotionArc();
      render(<EmotionArcChart emotion={emotion} />);

      // Check that the summary section shows the negative sentiment
      const summarySection = screen.getByText(/Overall sentiment:/).closest('span');
      expect(summarySection?.querySelector('strong')).toHaveTextContent('Negative');
    });
  });

  describe('edge cases', () => {
    it('handles arc with no keywords gracefully', async () => {
      const emotion: EmotionalAnalysis = {
        ...createMockEmotion(),
        emotionalArc: [
          { stanza: 0, sentiment: 0, keywords: [] },
        ],
      };
      render(<EmotionArcChart emotion={emotion} />);

      const button = screen.getByRole('button', { name: /Stanza 1:/i });
      fireEvent.focus(button);

      await waitFor(() => {
        const tooltip = screen.getByTestId('emotion-arc-tooltip');
        expect(tooltip).not.toHaveTextContent('Keywords:');
      });
    });

    it('handles unsorted arc entries', () => {
      const emotion: EmotionalAnalysis = {
        ...createMockEmotion(),
        emotionalArc: [
          { stanza: 2, sentiment: 0.5, keywords: ['c'] },
          { stanza: 0, sentiment: 0.1, keywords: ['a'] },
          { stanza: 1, sentiment: 0.3, keywords: ['b'] },
        ],
      };
      render(<EmotionArcChart emotion={emotion} />);

      // Should sort by stanza index - S1, S2, S3
      const buttons = screen.getAllByRole('button', { name: /Stanza \d+:/i });
      expect(buttons[0]).toHaveAttribute('aria-label', expect.stringContaining('Stanza 1'));
      expect(buttons[1]).toHaveAttribute('aria-label', expect.stringContaining('Stanza 2'));
      expect(buttons[2]).toHaveAttribute('aria-label', expect.stringContaining('Stanza 3'));
    });

    it('handles extreme sentiment values', () => {
      const emotion: EmotionalAnalysis = {
        ...createMockEmotion(),
        emotionalArc: [
          { stanza: 0, sentiment: -1, keywords: ['min'] },
          { stanza: 1, sentiment: 1, keywords: ['max'] },
        ],
        overallSentiment: 0,
      };
      render(<EmotionArcChart emotion={emotion} />);

      expect(screen.getByTestId('emotion-arc-chart')).toBeInTheDocument();
    });

    it('handles extreme arousal values', () => {
      const emotionLow: EmotionalAnalysis = {
        ...createMockEmotion(),
        arousal: 0,
      };
      const emotionHigh: EmotionalAnalysis = {
        ...createMockEmotion(),
        arousal: 1,
      };

      const { rerender } = render(<EmotionArcChart emotion={emotionLow} />);
      expect(screen.getByTitle(/Overall arousal:/)).toHaveTextContent('Very calm');

      rerender(<EmotionArcChart emotion={emotionHigh} />);
      expect(screen.getByTitle(/Overall arousal:/)).toHaveTextContent('Intense');
    });
  });

  describe('responsive behavior', () => {
    it('renders without errors on initial mount', () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);

      // Should render the chart container
      expect(screen.getByTestId('emotion-arc-chart')).toBeInTheDocument();
      expect(screen.getByRole('img', { name: /emotional arc chart/i })).toBeInTheDocument();
    });

    it('SVG has viewBox for responsive scaling', () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);

      const svg = screen.getByRole('img', { name: /emotional arc chart/i });
      expect(svg).toHaveAttribute('viewBox');
    });

    it('SVG has preserveAspectRatio for proper scaling', () => {
      const emotion = createMockEmotion();
      render(<EmotionArcChart emotion={emotion} />);

      const svg = screen.getByRole('img', { name: /emotional arc chart/i });
      expect(svg).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');
    });
  });
});
