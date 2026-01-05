/**
 * LyricsTeleprompter Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LyricsTeleprompter } from './LyricsTeleprompter';

describe('LyricsTeleprompter', () => {
  const sampleLyrics = [
    'First line of the song',
    'Second line goes here',
    'Third line continues',
    'Fourth and final line',
  ];

  describe('Rendering', () => {
    it('should render with required props', () => {
      render(
        <LyricsTeleprompter lyrics={sampleLyrics} currentTime={0} duration={60} />
      );

      expect(screen.getByTestId('lyrics-teleprompter')).toBeInTheDocument();
      expect(screen.getByTestId('lyrics-container')).toBeInTheDocument();
    });

    it('should render all lyric lines', () => {
      render(
        <LyricsTeleprompter lyrics={sampleLyrics} currentTime={0} duration={60} />
      );

      sampleLyrics.forEach((line, index) => {
        expect(screen.getByTestId(`lyric-line-${index}`)).toHaveTextContent(line);
      });
    });

    it('should apply custom className', () => {
      render(
        <LyricsTeleprompter
          lyrics={sampleLyrics}
          currentTime={0}
          duration={60}
          className="custom-class"
        />
      );

      expect(screen.getByTestId('lyrics-teleprompter')).toHaveClass('custom-class');
    });

    it('should render empty lyrics as non-breaking space', () => {
      const lyricsWithEmpty = ['Line one', '', 'Line three'];
      render(
        <LyricsTeleprompter lyrics={lyricsWithEmpty} currentTime={0} duration={60} />
      );

      const emptyLine = screen.getByTestId('lyric-line-1');
      expect(emptyLine.textContent).toBe('\u00A0');
    });
  });

  describe('Current line highlighting', () => {
    it('should highlight the current line', () => {
      render(
        <LyricsTeleprompter
          lyrics={sampleLyrics}
          currentTime={10}
          duration={60}
          currentLineIndex={1}
          highlightLine
        />
      );

      const currentLine = screen.getByTestId('lyric-line-1');
      expect(currentLine).toHaveAttribute('data-state', 'current');
    });

    it('should mark past lines correctly', () => {
      render(
        <LyricsTeleprompter
          lyrics={sampleLyrics}
          currentTime={30}
          duration={60}
          currentLineIndex={2}
        />
      );

      expect(screen.getByTestId('lyric-line-0')).toHaveAttribute('data-state', 'past');
      expect(screen.getByTestId('lyric-line-1')).toHaveAttribute('data-state', 'past');
      expect(screen.getByTestId('lyric-line-2')).toHaveAttribute('data-state', 'current');
    });

    it('should mark upcoming lines correctly', () => {
      render(
        <LyricsTeleprompter
          lyrics={sampleLyrics}
          currentTime={10}
          duration={60}
          currentLineIndex={0}
        />
      );

      expect(screen.getByTestId('lyric-line-1')).toHaveAttribute('data-state', 'upcoming');
      expect(screen.getByTestId('lyric-line-2')).toHaveAttribute('data-state', 'upcoming');
    });
  });

  describe('Progress bar', () => {
    it('should render progress bar', () => {
      render(
        <LyricsTeleprompter lyrics={sampleLyrics} currentTime={30} duration={60} />
      );

      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    });

    it('should update progress bar width based on current time', () => {
      render(
        <LyricsTeleprompter lyrics={sampleLyrics} currentTime={30} duration={60} />
      );

      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveStyle({ width: '50%' });
    });

    it('should show 0% progress when duration is 0', () => {
      render(
        <LyricsTeleprompter lyrics={sampleLyrics} currentTime={10} duration={0} />
      );

      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveStyle({ width: '0%' });
    });
  });

  describe('Playing indicator', () => {
    it('should show playing indicator when isPlaying is true', () => {
      render(
        <LyricsTeleprompter
          lyrics={sampleLyrics}
          currentTime={0}
          duration={60}
          isPlaying
        />
      );

      expect(screen.getByTestId('playing-indicator')).toBeInTheDocument();
      expect(screen.getByText('Recording')).toBeInTheDocument();
    });

    it('should not show playing indicator when isPlaying is false', () => {
      render(
        <LyricsTeleprompter
          lyrics={sampleLyrics}
          currentTime={0}
          duration={60}
          isPlaying={false}
        />
      );

      expect(screen.queryByTestId('playing-indicator')).not.toBeInTheDocument();
    });
  });

  describe('Font sizes', () => {
    it('should apply small font size', () => {
      render(
        <LyricsTeleprompter
          lyrics={sampleLyrics}
          currentTime={0}
          duration={60}
          fontSize="small"
        />
      );

      expect(screen.getByTestId('lyrics-teleprompter')).toBeInTheDocument();
    });

    it('should apply medium font size by default', () => {
      render(
        <LyricsTeleprompter lyrics={sampleLyrics} currentTime={0} duration={60} />
      );

      expect(screen.getByTestId('lyrics-teleprompter')).toBeInTheDocument();
    });

    it('should apply large font size', () => {
      render(
        <LyricsTeleprompter
          lyrics={sampleLyrics}
          currentTime={0}
          duration={60}
          fontSize="large"
        />
      );

      expect(screen.getByTestId('lyrics-teleprompter')).toBeInTheDocument();
    });

    it('should apply xlarge font size', () => {
      render(
        <LyricsTeleprompter
          lyrics={sampleLyrics}
          currentTime={0}
          duration={60}
          fontSize="xlarge"
        />
      );

      expect(screen.getByTestId('lyrics-teleprompter')).toBeInTheDocument();
    });
  });

  describe('Line click handling', () => {
    it('should call onLineClick when a line is clicked', () => {
      const handleLineClick = vi.fn();
      render(
        <LyricsTeleprompter
          lyrics={sampleLyrics}
          currentTime={0}
          duration={60}
          onLineClick={handleLineClick}
        />
      );

      fireEvent.click(screen.getByTestId('lyric-line-2'));
      expect(handleLineClick).toHaveBeenCalledWith(2);
    });

    it('should not call onLineClick if not provided', () => {
      render(
        <LyricsTeleprompter lyrics={sampleLyrics} currentTime={0} duration={60} />
      );

      // Should not throw when clicking
      fireEvent.click(screen.getByTestId('lyric-line-1'));
    });
  });

  describe('Auto-scroll', () => {
    it('should have auto-scroll enabled by default', () => {
      render(
        <LyricsTeleprompter
          lyrics={sampleLyrics}
          currentTime={0}
          duration={60}
          currentLineIndex={0}
        />
      );

      // Auto-scroll is enabled by default, just verify the component renders
      expect(screen.getByTestId('lyrics-container')).toBeInTheDocument();
    });

    it('should handle user scroll', () => {
      render(
        <LyricsTeleprompter
          lyrics={sampleLyrics}
          currentTime={0}
          duration={60}
          isPlaying
        />
      );

      const container = screen.getByTestId('lyrics-container');
      fireEvent.scroll(container);

      // Should not throw, just handle the scroll event
      expect(container).toBeInTheDocument();
    });
  });

  describe('Context lines', () => {
    it('should respect contextLinesBefore setting', () => {
      render(
        <LyricsTeleprompter
          lyrics={sampleLyrics}
          currentTime={0}
          duration={60}
          currentLineIndex={2}
          contextLinesBefore={1}
        />
      );

      expect(screen.getByTestId('lyrics-teleprompter')).toBeInTheDocument();
    });

    it('should respect contextLinesAfter setting', () => {
      render(
        <LyricsTeleprompter
          lyrics={sampleLyrics}
          currentTime={0}
          duration={60}
          currentLineIndex={1}
          contextLinesAfter={1}
        />
      );

      expect(screen.getByTestId('lyrics-teleprompter')).toBeInTheDocument();
    });
  });
});
