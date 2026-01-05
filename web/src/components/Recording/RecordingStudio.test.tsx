/**
 * RecordingStudio Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RecordingStudio } from './RecordingStudio';
import type { Melody } from '@/lib/melody/types';

// Mock the syncPlayback module
vi.mock('@/lib/audio/syncPlayback', () => ({
  startSyncedSession: vi.fn(() =>
    Promise.resolve({
      start: vi.fn(() => Promise.resolve()),
      stop: vi.fn(() =>
        Promise.resolve({
          blob: new Blob(),
          duration: 10,
          mimeType: 'audio/webm',
          melody: {},
          abcNotation: '',
        })
      ),
      pause: vi.fn(),
      resume: vi.fn(),
      setGuideVolume: vi.fn(),
      getGuideVolume: vi.fn(() => 0.8),
      setClickTrackEnabled: vi.fn(),
      isClickTrackEnabled: vi.fn(() => false),
      setClickVolume: vi.fn(),
      getClickVolume: vi.fn(() => 0.5),
      getLyricForPosition: vi.fn(() => ''),
      getLyricTimingForPosition: vi.fn(() => null),
      getLyricTimings: vi.fn(() => []),
      getState: vi.fn(() => 'ready'),
      getCurrentTime: vi.fn(() => 0),
      getDuration: vi.fn(() => 60),
      getRecordingDuration: vi.fn(() => 0),
      dispose: vi.fn(),
    })
  ),
}));

// Sample test data
const createTestMelody = (): Melody => ({
  params: {
    title: 'Test Song',
    timeSignature: '4/4',
    defaultNoteLength: '1/8',
    tempo: 120,
    key: 'C',
  },
  measures: [
    [{ pitch: 'C', octave: 0, duration: 1 }],
    [{ pitch: 'D', octave: 0, duration: 1 }],
  ],
  lyrics: [['Hel-'], ['lo']],
});

const testAbc = `X:1
T:Test Song
M:4/4
L:1/8
Q:1/4=120
K:C
C2 D2 |]
w: Hel-lo`;

const testLyrics = ['Hello', 'World', 'Test', 'Song'];

describe('RecordingStudio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty state', () => {
    it('should show empty state when melody is null', () => {
      render(
        <RecordingStudio melody={null} abcNotation={null} lyrics={testLyrics} />
      );

      expect(screen.getByTestId('recording-studio')).toHaveClass(
        'recording-studio--empty'
      );
      expect(screen.getByText('No Melody Available')).toBeInTheDocument();
    });

    it('should show empty state when abcNotation is null', () => {
      const melody = createTestMelody();
      render(
        <RecordingStudio melody={melody} abcNotation={null} lyrics={testLyrics} />
      );

      expect(screen.getByTestId('recording-studio')).toHaveClass(
        'recording-studio--empty'
      );
    });
  });

  describe('Rendering with melody', () => {
    it('should render the studio interface with melody', async () => {
      const melody = createTestMelody();
      render(
        <RecordingStudio melody={melody} abcNotation={testAbc} lyrics={testLyrics} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('recording-studio')).not.toHaveClass(
          'recording-studio--empty'
        );
      });
    });

    it('should render the lyrics teleprompter', async () => {
      const melody = createTestMelody();
      render(
        <RecordingStudio melody={melody} abcNotation={testAbc} lyrics={testLyrics} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('lyrics-teleprompter')).toBeInTheDocument();
      });
    });

    it('should render guide volume slider', async () => {
      const melody = createTestMelody();
      render(
        <RecordingStudio melody={melody} abcNotation={testAbc} lyrics={testLyrics} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('guide-volume-slider')).toBeInTheDocument();
      });
    });

    it('should render click track toggle', async () => {
      const melody = createTestMelody();
      render(
        <RecordingStudio melody={melody} abcNotation={testAbc} lyrics={testLyrics} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('click-track-toggle')).toBeInTheDocument();
      });
    });

    it('should render record button', async () => {
      const melody = createTestMelody();
      render(
        <RecordingStudio melody={melody} abcNotation={testAbc} lyrics={testLyrics} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('record-button')).toBeInTheDocument();
      });
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', async () => {
      const melody = createTestMelody();
      render(
        <RecordingStudio
          melody={melody}
          abcNotation={testAbc}
          lyrics={testLyrics}
          className="custom-class"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('recording-studio')).toHaveClass('custom-class');
      });
    });
  });

  describe('Initial settings', () => {
    it('should use initial guide volume', async () => {
      const melody = createTestMelody();
      render(
        <RecordingStudio
          melody={melody}
          abcNotation={testAbc}
          lyrics={testLyrics}
          initialGuideVolume={0.5}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('guide-volume-slider')).toBeInTheDocument();
      });
    });

    it('should use initial click track settings', async () => {
      const melody = createTestMelody();
      render(
        <RecordingStudio
          melody={melody}
          abcNotation={testAbc}
          lyrics={testLyrics}
          initialClickEnabled
          initialClickVolume={0.7}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('click-track-toggle')).toBeInTheDocument();
      });
    });
  });

  describe('Instructions display', () => {
    it('should show instructions when initializing', async () => {
      const melody = createTestMelody();
      render(
        <RecordingStudio melody={melody} abcNotation={testAbc} lyrics={testLyrics} />
      );

      // Initially shows initializing message
      expect(
        screen.getByText(/Initializing recording session/i) ||
          screen.getByText(/Press the record button/i)
      ).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should call onError when error occurs', async () => {
      const { startSyncedSession } = await import('@/lib/audio/syncPlayback');
      vi.mocked(startSyncedSession).mockRejectedValueOnce(new Error('Test error'));

      const melody = createTestMelody();
      const handleError = vi.fn();

      render(
        <RecordingStudio
          melody={melody}
          abcNotation={testAbc}
          lyrics={testLyrics}
          onError={handleError}
        />
      );

      await waitFor(() => {
        expect(handleError).toHaveBeenCalled();
      });
    });

    it('should display error message when error occurs', async () => {
      const { startSyncedSession } = await import('@/lib/audio/syncPlayback');
      vi.mocked(startSyncedSession).mockRejectedValueOnce(
        new Error('Microphone access denied')
      );

      const melody = createTestMelody();

      render(
        <RecordingStudio melody={melody} abcNotation={testAbc} lyrics={testLyrics} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });
  });

  describe('Notation display', () => {
    it('should not render notation by default', async () => {
      const melody = createTestMelody();
      render(
        <RecordingStudio melody={melody} abcNotation={testAbc} lyrics={testLyrics} />
      );

      await waitFor(() => {
        expect(
          screen.queryByTestId('recording-studio-notation')
        ).not.toBeInTheDocument();
      });
    });

    it('should render notation when showNotation is true', async () => {
      const melody = createTestMelody();
      render(
        <RecordingStudio
          melody={melody}
          abcNotation={testAbc}
          lyrics={testLyrics}
          showNotation
        />
      );

      await waitFor(() => {
        expect(
          document.getElementById('recording-studio-notation')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Audio level meter', () => {
    it('should render audio level meter', async () => {
      const melody = createTestMelody();
      render(
        <RecordingStudio melody={melody} abcNotation={testAbc} lyrics={testLyrics} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('audio-level-meter')).toBeInTheDocument();
      });
    });
  });

  describe('Recording timer', () => {
    it('should render recording timer', async () => {
      const melody = createTestMelody();
      render(
        <RecordingStudio melody={melody} abcNotation={testAbc} lyrics={testLyrics} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('recording-timer')).toBeInTheDocument();
      });
    });
  });

  describe('Lyrics display', () => {
    it('should pass lyrics to teleprompter', async () => {
      const melody = createTestMelody();
      render(
        <RecordingStudio melody={melody} abcNotation={testAbc} lyrics={testLyrics} />
      );

      await waitFor(() => {
        testLyrics.forEach((line, index) => {
          expect(screen.getByTestId(`lyric-line-${index}`)).toHaveTextContent(line);
        });
      });
    });
  });
});
