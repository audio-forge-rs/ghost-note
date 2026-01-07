/**
 * Tests for App Component
 *
 * Tests for the main App component including view wiring and navigation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { createDefaultPoemAnalysis } from './types';

// Allow time for lazy-loaded components to load
const LAZY_COMPONENT_TIMEOUT = 5000;

// Mock all the stores
vi.mock('@/stores/useThemeStore', () => ({
  useThemeStore: Object.assign(
    vi.fn(() => ({ theme: 'dark', setTheme: vi.fn() })),
    {
      getState: vi.fn(() => ({
        theme: 'dark',
        setTheme: vi.fn(),
      })),
    }
  ),
}));

const mockPoemStoreState = {
  original: '',
  versions: [],
  currentVersionIndex: -1,
  setPoem: vi.fn(),
  addVersion: vi.fn(),
  revertToVersion: vi.fn(),
  updateCurrentVersion: vi.fn(),
  deleteVersion: vi.fn(),
  reset: vi.fn(),
};

vi.mock('@/stores/usePoemStore', () => ({
  usePoemStore: Object.assign(
    vi.fn((selector) => {
      if (typeof selector === 'function') {
        return selector(mockPoemStoreState);
      }
      return mockPoemStoreState;
    }),
    {
      subscribe: vi.fn(() => vi.fn()), // Returns unsubscribe function
      getState: vi.fn(() => mockPoemStoreState),
    }
  ),
  selectCurrentLyrics: (state: typeof mockPoemStoreState) => state.original,
  selectHasPoem: (state: typeof mockPoemStoreState) => state.original.trim().length > 0,
  selectHasVersions: (state: typeof mockPoemStoreState) => state.versions.length > 0,
  selectCurrentVersion: (state: typeof mockPoemStoreState) => {
    if (state.currentVersionIndex >= 0 && state.versions[state.currentVersionIndex]) {
      return state.versions[state.currentVersionIndex];
    }
    return null;
  },
}));

const mockAnalysisStoreState: {
  analysis: import('./types').PoemAnalysis | null;
  isLoading: boolean;
  stage: string;
  progress: number;
  error: string | null;
  analyzedVersionId: string | null;
  analyze: ReturnType<typeof vi.fn>;
  setAnalysis: ReturnType<typeof vi.fn>;
  setStage: ReturnType<typeof vi.fn>;
  setError: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
} = {
  analysis: null,
  isLoading: false,
  stage: 'idle',
  progress: 0,
  error: null,
  analyzedVersionId: null,
  analyze: vi.fn(),
  setAnalysis: vi.fn(),
  setStage: vi.fn(),
  setError: vi.fn(),
  clear: vi.fn(),
  reset: vi.fn(),
};

vi.mock('@/stores/useAnalysisStore', () => ({
  useAnalysisStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockAnalysisStoreState);
    }
    return mockAnalysisStoreState;
  }),
  selectHasAnalysis: (state: typeof mockAnalysisStoreState) => state.analysis !== null,
  selectIsAnalyzing: (state: typeof mockAnalysisStoreState) => state.isLoading,
}));

// Mock the useOfflineStatus hook used by OfflineIndicator
vi.mock('@/hooks/useOfflineStatus', () => ({
  useOfflineStatus: vi.fn(() => ({
    isOnline: true,
    isOfflineReady: false,
    needsUpdate: false,
    isServiceWorkerActive: false,
    serviceWorkerError: null,
    updateApp: vi.fn(),
    dismissUpdate: vi.fn(),
    checkOnlineStatus: vi.fn(() => true),
  })),
  useNetworkStatus: vi.fn(() => true),
}));

const mockMelodyStoreState: {
  melody: null;
  abcNotation: string | null;
  playbackState: 'stopped' | 'playing' | 'paused' | 'loading';
  currentTime: number;
  duration: number;
  tempo: number;
  volume: number;
  loop: boolean;
  key: string;
  timeSignature: string;
  isGenerating: boolean;
  error: string | null;
  generateMelody: ReturnType<typeof vi.fn>;
  setMelody: ReturnType<typeof vi.fn>;
  setAbcNotation: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  seek: ReturnType<typeof vi.fn>;
  setCurrentTime: ReturnType<typeof vi.fn>;
  setDuration: ReturnType<typeof vi.fn>;
  setTempo: ReturnType<typeof vi.fn>;
  setVolume: ReturnType<typeof vi.fn>;
  toggleLoop: ReturnType<typeof vi.fn>;
  setKey: ReturnType<typeof vi.fn>;
  setTimeSignature: ReturnType<typeof vi.fn>;
  setError: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
} = {
  melody: null,
  abcNotation: null,
  playbackState: 'stopped',
  currentTime: 0,
  duration: 0,
  tempo: 100,
  volume: 0.8,
  loop: false,
  key: 'C',
  timeSignature: '4/4',
  isGenerating: false,
  error: null,
  generateMelody: vi.fn(),
  setMelody: vi.fn(),
  setAbcNotation: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  stop: vi.fn(),
  seek: vi.fn(),
  setCurrentTime: vi.fn(),
  setDuration: vi.fn(),
  setTempo: vi.fn(),
  setVolume: vi.fn(),
  toggleLoop: vi.fn(),
  setKey: vi.fn(),
  setTimeSignature: vi.fn(),
  setError: vi.fn(),
  clear: vi.fn(),
  reset: vi.fn(),
};

vi.mock('@/stores/useMelodyStore', () => ({
  useMelodyStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockMelodyStoreState);
    }
    return mockMelodyStoreState;
  }),
  selectHasMelody: (state: typeof mockMelodyStoreState) => state.abcNotation !== null,
  selectIsGenerating: (state: typeof mockMelodyStoreState) => state.isGenerating,
  selectIsPlaying: (state: typeof mockMelodyStoreState) => state.playbackState === 'playing',
}));

const mockRecordingStoreState: {
  recordingState: 'idle' | 'preparing' | 'recording' | 'paused' | 'stopped';
  takes: never[];
  selectedTakeId: string | null;
  recordingDuration: number;
  hasPermission: boolean;
  error: string | null;
  inputLevel: number;
  requestPermission: ReturnType<typeof vi.fn>;
  startRecording: ReturnType<typeof vi.fn>;
  stopRecording: ReturnType<typeof vi.fn>;
  pauseRecording: ReturnType<typeof vi.fn>;
  resumeRecording: ReturnType<typeof vi.fn>;
  addTake: ReturnType<typeof vi.fn>;
  deleteTake: ReturnType<typeof vi.fn>;
  selectTake: ReturnType<typeof vi.fn>;
  renameTake: ReturnType<typeof vi.fn>;
  setRecordingDuration: ReturnType<typeof vi.fn>;
  setInputLevel: ReturnType<typeof vi.fn>;
  setError: ReturnType<typeof vi.fn>;
  clearTakes: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
} = {
  recordingState: 'idle',
  takes: [],
  selectedTakeId: null,
  recordingDuration: 0,
  hasPermission: false,
  error: null,
  inputLevel: 0,
  requestPermission: vi.fn(),
  startRecording: vi.fn(),
  stopRecording: vi.fn(),
  pauseRecording: vi.fn(),
  resumeRecording: vi.fn(),
  addTake: vi.fn(),
  deleteTake: vi.fn(),
  selectTake: vi.fn(),
  renameTake: vi.fn(),
  setRecordingDuration: vi.fn(),
  setInputLevel: vi.fn(),
  setError: vi.fn(),
  clearTakes: vi.fn(),
  reset: vi.fn(),
};

vi.mock('@/stores/useRecordingStore', () => ({
  useRecordingStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockRecordingStoreState);
    }
    return mockRecordingStoreState;
  }),
  selectHasPermission: (state: typeof mockRecordingStoreState) => state.hasPermission,
  selectIsRecording: (state: typeof mockRecordingStoreState) => state.recordingState === 'recording',
}));

const mockUndoStoreState = {
  past: [],
  present: null,
  future: [],
  undo: vi.fn(() => null),
  redo: vi.fn(() => null),
  canUndo: vi.fn(() => false),
  canRedo: vi.fn(() => false),
  undoCount: vi.fn(() => 0),
  redoCount: vi.fn(() => 0),
  clearHistory: vi.fn(),
  recordState: vi.fn(),
  getHistoryState: vi.fn(() => ({ past: [], present: null, future: [] })),
};

vi.mock('@/stores/undoMiddleware', () => ({
  useUndoStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockUndoStoreState);
    }
    return mockUndoStoreState;
  }),
  selectCanUndo: (state: typeof mockUndoStoreState) => state.past.length > 0,
  selectCanRedo: (state: typeof mockUndoStoreState) => state.future.length > 0,
}));

// Mock Layout components
vi.mock('@/components/Layout', () => ({
  AppShell: ({ children, activeView, onNavigate }: {
    children: React.ReactNode;
    activeView: string;
    onNavigate: (view: string) => void;
  }) => (
    <div data-testid="app-shell" data-active-view={activeView}>
      <nav data-testid="navigation">
        <button data-testid="nav-poem-input" onClick={() => onNavigate('poem-input')}>Poem Input</button>
        <button data-testid="nav-analysis" onClick={() => onNavigate('analysis')}>Analysis</button>
        <button data-testid="nav-lyrics-editor" onClick={() => onNavigate('lyrics-editor')}>Lyrics Editor</button>
        <button data-testid="nav-melody" onClick={() => onNavigate('melody')}>Melody</button>
        <button data-testid="nav-recording" onClick={() => onNavigate('recording')}>Recording</button>
      </nav>
      <main data-testid="main-content">{children}</main>
    </div>
  ),
}));

// Mock Common components
vi.mock('@/components/Common', () => ({
  EmptyState: ({ title, description, testId }: { title: string; description: string; testId?: string }) => (
    <div data-testid={testId}>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  ),
  LoadingSpinner: ({ size }: { size?: string }) => (
    <div data-testid="loading-spinner" data-size={size}>Loading...</div>
  ),
  ToastContainer: ({ position, testId }: { position?: string; testId?: string }) => (
    <div data-testid={testId ?? 'toast-container'} data-position={position}>Toast Container</div>
  ),
  SkipLinks: ({ links }: { links?: Array<{ targetId: string; label: string }> }) => (
    <nav data-testid="skip-links" aria-label="Skip links">
      {links?.map(link => (
        <a key={link.targetId} href={`#${link.targetId}`}>{link.label}</a>
      ))}
    </nav>
  ),
  OfflineIndicator: ({ position }: { position?: string }) => (
    <div data-testid="offline-indicator" data-position={position}>Offline Indicator</div>
  ),
}));

// Mock PoemInput component
vi.mock('@/components/PoemInput', () => ({
  PoemInput: ({ onAnalyze, showStats }: { onAnalyze?: () => void; showStats?: boolean }) => (
    <div data-testid="poem-input-component" data-show-stats={showStats}>
      <h2>Enter Your Poem</h2>
      <textarea data-testid="poem-textarea" placeholder="Enter your poem..." />
      <button data-testid="analyze-button" onClick={onAnalyze}>Analyze</button>
      {showStats && (
        <div data-testid="poem-stats">
          <span>Lines: 0</span>
          <span>Words: 0</span>
          <span>Characters: 0</span>
        </div>
      )}
    </div>
  ),
}));

// Mock Analysis components (barrel import)
vi.mock('@/components/Analysis', () => ({
  AnalysisPanel: ({ analysis, poemText }: { analysis: unknown; poemText?: string }) => (
    <div data-testid="analysis-panel" data-has-analysis={!!analysis} data-poem-text={poemText?.substring(0, 20)}>
      <h2>Analysis Panel</h2>
      {analysis ? <div data-testid="analysis-content">Analysis data loaded</div> : <p>No analysis</p>}
    </div>
  ),
}));

// Mock Analysis components (direct import for React.lazy)
vi.mock('@/components/Analysis/AnalysisPanel', () => ({
  AnalysisPanel: ({ analysis, poemText }: { analysis: unknown; poemText?: string }) => (
    <div data-testid="analysis-panel" data-has-analysis={!!analysis} data-poem-text={poemText?.substring(0, 20)}>
      <h2>Analysis Panel</h2>
      {analysis ? <div data-testid="analysis-content">Analysis data loaded</div> : <p>No analysis</p>}
    </div>
  ),
}));

// Mock LyricEditor components (barrel import)
vi.mock('@/components/LyricEditor', () => ({
  LyricEditor: ({ testId }: { testId?: string }) => (
    <div data-testid={testId || 'lyric-editor'}>
      <h2>Lyric Editor</h2>
      <textarea data-testid="lyric-textarea" placeholder="Edit lyrics..." />
    </div>
  ),
}));

// Mock LyricEditor components (direct import for React.lazy)
vi.mock('@/components/LyricEditor/LyricEditor', () => ({
  LyricEditor: ({ testId }: { testId?: string }) => (
    <div data-testid={testId || 'lyric-editor'}>
      <h2>Lyric Editor</h2>
      <textarea data-testid="lyric-textarea" placeholder="Edit lyrics..." />
    </div>
  ),
}));

// Mock Notation components (barrel import)
vi.mock('@/components/Notation', () => ({
  NotationDisplay: ({ abc, responsive, className }: { abc: string; responsive?: boolean; className?: string }) => (
    <div data-testid="notation-display" data-abc={abc?.substring(0, 20)} data-responsive={responsive} className={className}>
      <h2>Music Notation</h2>
    </div>
  ),
}));

// Mock Notation components (direct import for React.lazy)
vi.mock('@/components/Notation/NotationDisplay', () => ({
  NotationDisplay: ({ abc, responsive, className }: { abc: string; responsive?: boolean; className?: string }) => (
    <div data-testid="notation-display" data-abc={abc?.substring(0, 20)} data-responsive={responsive} className={className}>
      <h2>Music Notation</h2>
    </div>
  ),
}));

// Mock Playback components (barrel import)
vi.mock('@/components/Playback', () => ({
  PlaybackContainer: ({
    playbackState,
    hasContent,
    tempo,
    testId,
    onPlay,
    onPause,
    onStop,
  }: {
    playbackState: string;
    hasContent: boolean;
    tempo: number;
    testId?: string;
    onPlay: () => void;
    onPause: () => void;
    onStop: () => void;
  }) => (
    <div data-testid={testId || 'playback-container'} data-state={playbackState} data-has-content={hasContent} data-tempo={tempo}>
      <button data-testid="play-button" onClick={onPlay}>Play</button>
      <button data-testid="pause-button" onClick={onPause}>Pause</button>
      <button data-testid="stop-button" onClick={onStop}>Stop</button>
    </div>
  ),
}));

// Mock Playback components (direct import for React.lazy)
vi.mock('@/components/Playback/PlaybackContainer', () => ({
  PlaybackContainer: ({
    playbackState,
    hasContent,
    tempo,
    testId,
    onPlay,
    onPause,
    onStop,
  }: {
    playbackState: string;
    hasContent: boolean;
    tempo: number;
    testId?: string;
    onPlay: () => void;
    onPause: () => void;
    onStop: () => void;
  }) => (
    <div data-testid={testId || 'playback-container'} data-state={playbackState} data-has-content={hasContent} data-tempo={tempo}>
      <button data-testid="play-button" onClick={onPlay}>Play</button>
      <button data-testid="pause-button" onClick={onPause}>Pause</button>
      <button data-testid="stop-button" onClick={onStop}>Stop</button>
    </div>
  ),
}));

// Mock Recording components (barrel import)
vi.mock('@/components/Recording', () => ({
  PermissionPrompt: ({ onPermissionGranted, variant }: {
    onPermissionGranted?: () => void;
    onPermissionDenied?: (error: string) => void;
    variant?: string;
  }) => (
    <div data-testid="permission-prompt" data-variant={variant}>
      <h2>Microphone Permission Required</h2>
      <button data-testid="grant-permission" onClick={() => onPermissionGranted?.()}>Enable Microphone</button>
    </div>
  ),
  AudioLevelMeter: ({ level, meterStyle, orientation }: { level?: number; meterStyle?: string; orientation?: string }) => (
    <div data-testid="audio-level-meter" data-level={level} data-style={meterStyle} data-orientation={orientation}>
      Level Meter
    </div>
  ),
  MicrophoneSelect: ({ hasPermission, className }: { hasPermission?: boolean; className?: string }) => (
    <select data-testid="microphone-select" data-has-permission={hasPermission} className={className}>
      <option>Default Microphone</option>
    </select>
  ),
}));

// Mock Recording components (direct imports for React.lazy)
vi.mock('@/components/Recording/PermissionPrompt', () => ({
  PermissionPrompt: ({ onPermissionGranted, variant }: {
    onPermissionGranted?: () => void;
    onPermissionDenied?: (error: string) => void;
    variant?: string;
  }) => (
    <div data-testid="permission-prompt" data-variant={variant}>
      <h2>Microphone Permission Required</h2>
      <button data-testid="grant-permission" onClick={() => onPermissionGranted?.()}>Enable Microphone</button>
    </div>
  ),
}));

vi.mock('@/components/Recording/AudioLevelMeter', () => ({
  AudioLevelMeter: ({ level, meterStyle, orientation }: { level?: number; meterStyle?: string; orientation?: string }) => (
    <div data-testid="audio-level-meter" data-level={level} data-style={meterStyle} data-orientation={orientation}>
      Level Meter
    </div>
  ),
}));

vi.mock('@/components/Recording/MicrophoneSelect', () => ({
  MicrophoneSelect: ({ hasPermission, className }: { hasPermission?: boolean; className?: string }) => (
    <select data-testid="microphone-select" data-has-permission={hasPermission} className={className}>
      <option>Default Microphone</option>
    </select>
  ),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock store states to defaults
    mockPoemStoreState.original = '';
    mockAnalysisStoreState.analysis = null;
    mockAnalysisStoreState.isLoading = false;
    mockMelodyStoreState.abcNotation = null;
    mockMelodyStoreState.isGenerating = false;
    mockRecordingStoreState.hasPermission = false;
    mockRecordingStoreState.recordingState = 'idle';
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders the app shell', () => {
      render(<App />);
      expect(screen.getByTestId('app-shell')).toBeInTheDocument();
    });

    it('renders with poem-input as the default view', () => {
      render(<App />);
      expect(screen.getByTestId('app-shell')).toHaveAttribute('data-active-view', 'poem-input');
    });

    it('renders the PoemInput component in the default view', () => {
      render(<App />);
      expect(screen.getByTestId('poem-input-component')).toBeInTheDocument();
      expect(screen.getByText('Enter Your Poem')).toBeInTheDocument();
      expect(screen.getByTestId('poem-textarea')).toBeInTheDocument();
      expect(screen.getByTestId('analyze-button')).toBeInTheDocument();
    });

    it('renders poem stats when showStats is true', () => {
      render(<App />);
      expect(screen.getByTestId('poem-stats')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('navigates to analysis view when clicked', () => {
      render(<App />);
      fireEvent.click(screen.getByTestId('nav-analysis'));
      expect(screen.getByTestId('app-shell')).toHaveAttribute('data-active-view', 'analysis');
    });

    it('navigates to lyrics-editor view when clicked', () => {
      render(<App />);
      fireEvent.click(screen.getByTestId('nav-lyrics-editor'));
      expect(screen.getByTestId('app-shell')).toHaveAttribute('data-active-view', 'lyrics-editor');
    });

    it('navigates to melody view when clicked', () => {
      render(<App />);
      fireEvent.click(screen.getByTestId('nav-melody'));
      expect(screen.getByTestId('app-shell')).toHaveAttribute('data-active-view', 'melody');
    });

    it('navigates to recording view when clicked', () => {
      render(<App />);
      fireEvent.click(screen.getByTestId('nav-recording'));
      expect(screen.getByTestId('app-shell')).toHaveAttribute('data-active-view', 'recording');
    });

    it('can navigate back to poem-input view', () => {
      render(<App />);
      fireEvent.click(screen.getByTestId('nav-analysis'));
      expect(screen.getByTestId('app-shell')).toHaveAttribute('data-active-view', 'analysis');
      fireEvent.click(screen.getByTestId('nav-poem-input'));
      expect(screen.getByTestId('app-shell')).toHaveAttribute('data-active-view', 'poem-input');
      expect(screen.getByTestId('poem-input-component')).toBeInTheDocument();
    });

    it('navigates to lyrics-editor view when analyze button is clicked', () => {
      render(<App />);
      fireEvent.click(screen.getByTestId('analyze-button'));
      expect(screen.getByTestId('app-shell')).toHaveAttribute('data-active-view', 'lyrics-editor');
    });
  });

  describe('analysis view', () => {
    it('shows empty state when no poem is entered', () => {
      render(<App />);
      fireEvent.click(screen.getByTestId('nav-analysis'));
      expect(screen.getByTestId('view-analysis')).toBeInTheDocument();
      expect(screen.getByText('No Analysis Available')).toBeInTheDocument();
      expect(screen.getByText('Enter a poem first to see its analysis.')).toBeInTheDocument();
    });

    it('shows AnalysisPanel when poem exists', async () => {
      mockPoemStoreState.original = 'Roses are red, violets are blue';
      render(<App />);
      fireEvent.click(screen.getByTestId('nav-analysis'));
      // Wait for lazy-loaded AnalysisPanel to appear
      await waitFor(() => {
        expect(screen.getByTestId('analysis-panel')).toBeInTheDocument();
      }, { timeout: LAZY_COMPONENT_TIMEOUT });
    });

    it('shows loading state when analyzing', () => {
      mockPoemStoreState.original = 'Roses are red';
      mockAnalysisStoreState.isLoading = true;
      render(<App />);
      fireEvent.click(screen.getByTestId('nav-analysis'));
      expect(screen.getByTestId('view-analysis-loading')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Analyzing poem...')).toBeInTheDocument();
    });
  });

  describe('lyrics-editor view', () => {
    it('shows empty state when no poem is entered', () => {
      render(<App />);
      fireEvent.click(screen.getByTestId('nav-lyrics-editor'));
      expect(screen.getByTestId('view-lyrics-editor')).toBeInTheDocument();
      expect(screen.getByText('No Lyrics to Edit')).toBeInTheDocument();
    });

    it('shows LyricEditor when poem exists', async () => {
      mockPoemStoreState.original = 'Roses are red, violets are blue';
      render(<App />);
      fireEvent.click(screen.getByTestId('nav-lyrics-editor'));
      // Wait for lazy-loaded LyricEditor to appear
      await waitFor(() => {
        expect(screen.getByTestId('view-lyrics-editor')).toBeInTheDocument();
        expect(screen.getByText('Lyric Editor')).toBeInTheDocument();
      }, { timeout: LAZY_COMPONENT_TIMEOUT });
    });
  });

  describe('melody view', () => {
    it('shows empty state when no analysis available', () => {
      render(<App />);
      fireEvent.click(screen.getByTestId('nav-melody'));
      expect(screen.getByTestId('view-melody')).toBeInTheDocument();
      expect(screen.getByText('No Melody Generated')).toBeInTheDocument();
    });

    it('shows loading state when generating melody', () => {
      mockPoemStoreState.original = 'Roses are red';
      mockAnalysisStoreState.analysis = createDefaultPoemAnalysis();
      mockMelodyStoreState.isGenerating = true;
      render(<App />);
      fireEvent.click(screen.getByTestId('nav-melody'));
      expect(screen.getByTestId('view-melody-loading')).toBeInTheDocument();
      expect(screen.getByText('Generating melody...')).toBeInTheDocument();
    });

    it('shows NotationDisplay and PlaybackContainer when melody exists', async () => {
      mockPoemStoreState.original = 'Roses are red';
      mockAnalysisStoreState.analysis = createDefaultPoemAnalysis();
      mockMelodyStoreState.abcNotation = 'X:1\nT:Test\nM:4/4\nK:C\nCDEF|';
      render(<App />);
      fireEvent.click(screen.getByTestId('nav-melody'));
      // Wait for lazy-loaded NotationDisplay and PlaybackContainer to appear
      await waitFor(() => {
        expect(screen.getByTestId('view-melody')).toBeInTheDocument();
        expect(screen.getByTestId('notation-display')).toBeInTheDocument();
        expect(screen.getByTestId('melody-playback')).toBeInTheDocument();
      }, { timeout: LAZY_COMPONENT_TIMEOUT });
    });
  });

  describe('recording view', () => {
    it('shows empty state when no melody generated', () => {
      render(<App />);
      fireEvent.click(screen.getByTestId('nav-recording'));
      expect(screen.getByTestId('view-recording')).toBeInTheDocument();
      expect(screen.getByText('Ready to Record')).toBeInTheDocument();
      expect(screen.getByText('Generate a melody first, then record your performance.')).toBeInTheDocument();
    });

    it('shows PermissionPrompt when melody exists but no permission', async () => {
      mockMelodyStoreState.abcNotation = 'X:1\nT:Test\nM:4/4\nK:C\nCDEF|';
      mockRecordingStoreState.hasPermission = false;
      render(<App />);
      fireEvent.click(screen.getByTestId('nav-recording'));
      // Wait for lazy-loaded PermissionPrompt to appear
      await waitFor(() => {
        expect(screen.getByTestId('view-recording')).toBeInTheDocument();
        expect(screen.getByTestId('permission-prompt')).toBeInTheDocument();
        expect(screen.getByText('Microphone Permission Required')).toBeInTheDocument();
      }, { timeout: LAZY_COMPONENT_TIMEOUT });
    });

    it('shows recording controls when permission is granted', async () => {
      mockMelodyStoreState.abcNotation = 'X:1\nT:Test\nM:4/4\nK:C\nCDEF|';
      mockRecordingStoreState.hasPermission = true;
      render(<App />);
      fireEvent.click(screen.getByTestId('nav-recording'));
      // Wait for lazy-loaded recording components to appear
      await waitFor(() => {
        expect(screen.getByTestId('view-recording')).toBeInTheDocument();
        expect(screen.getByText('Recording Studio')).toBeInTheDocument();
        expect(screen.getByTestId('microphone-select')).toBeInTheDocument();
        expect(screen.getByTestId('audio-level-meter')).toBeInTheDocument();
        expect(screen.getByTestId('start-recording-button')).toBeInTheDocument();
      }, { timeout: LAZY_COMPONENT_TIMEOUT });
    });

    it('shows stop button when recording', async () => {
      mockMelodyStoreState.abcNotation = 'X:1\nT:Test\nM:4/4\nK:C\nCDEF|';
      mockRecordingStoreState.hasPermission = true;
      mockRecordingStoreState.recordingState = 'recording';
      render(<App />);
      fireEvent.click(screen.getByTestId('nav-recording'));
      // Wait for lazy-loaded components to appear
      await waitFor(() => {
        expect(screen.getByTestId('stop-recording-button')).toBeInTheDocument();
      }, { timeout: LAZY_COMPONENT_TIMEOUT });
    });
  });

  describe('playback controls', () => {
    it('calls play when play button is clicked', async () => {
      mockPoemStoreState.original = 'Roses are red';
      mockAnalysisStoreState.analysis = createDefaultPoemAnalysis();
      mockMelodyStoreState.abcNotation = 'X:1\nT:Test\nM:4/4\nK:C\nCDEF|';
      render(<App />);
      fireEvent.click(screen.getByTestId('nav-melody'));
      // Wait for lazy-loaded PlaybackContainer to appear
      await waitFor(() => {
        expect(screen.getByTestId('play-button')).toBeInTheDocument();
      }, { timeout: LAZY_COMPONENT_TIMEOUT });
      fireEvent.click(screen.getByTestId('play-button'));
      expect(mockMelodyStoreState.play).toHaveBeenCalled();
    });

    it('calls pause when pause button is clicked', async () => {
      mockPoemStoreState.original = 'Roses are red';
      mockAnalysisStoreState.analysis = createDefaultPoemAnalysis();
      mockMelodyStoreState.abcNotation = 'X:1\nT:Test\nM:4/4\nK:C\nCDEF|';
      render(<App />);
      fireEvent.click(screen.getByTestId('nav-melody'));
      // Wait for lazy-loaded PlaybackContainer to appear
      await waitFor(() => {
        expect(screen.getByTestId('pause-button')).toBeInTheDocument();
      }, { timeout: LAZY_COMPONENT_TIMEOUT });
      fireEvent.click(screen.getByTestId('pause-button'));
      expect(mockMelodyStoreState.pause).toHaveBeenCalled();
    });

    it('calls stop when stop button is clicked', async () => {
      mockPoemStoreState.original = 'Roses are red';
      mockAnalysisStoreState.analysis = createDefaultPoemAnalysis();
      mockMelodyStoreState.abcNotation = 'X:1\nT:Test\nM:4/4\nK:C\nCDEF|';
      render(<App />);
      fireEvent.click(screen.getByTestId('nav-melody'));
      // Wait for lazy-loaded PlaybackContainer to appear
      await waitFor(() => {
        expect(screen.getByTestId('stop-button')).toBeInTheDocument();
      }, { timeout: LAZY_COMPONENT_TIMEOUT });
      fireEvent.click(screen.getByTestId('stop-button'));
      expect(mockMelodyStoreState.stop).toHaveBeenCalled();
    });
  });

  describe('recording controls', () => {
    it('calls startRecording when start button is clicked', async () => {
      mockMelodyStoreState.abcNotation = 'X:1\nT:Test\nM:4/4\nK:C\nCDEF|';
      mockRecordingStoreState.hasPermission = true;
      render(<App />);
      fireEvent.click(screen.getByTestId('nav-recording'));
      // Wait for lazy-loaded recording components to appear
      await waitFor(() => {
        expect(screen.getByTestId('start-recording-button')).toBeInTheDocument();
      }, { timeout: LAZY_COMPONENT_TIMEOUT });
      fireEvent.click(screen.getByTestId('start-recording-button'));
      expect(mockRecordingStoreState.startRecording).toHaveBeenCalled();
    });

    it('calls stopRecording when stop button is clicked', async () => {
      mockMelodyStoreState.abcNotation = 'X:1\nT:Test\nM:4/4\nK:C\nCDEF|';
      mockRecordingStoreState.hasPermission = true;
      mockRecordingStoreState.recordingState = 'recording';
      render(<App />);
      fireEvent.click(screen.getByTestId('nav-recording'));
      // Wait for lazy-loaded recording components to appear
      await waitFor(() => {
        expect(screen.getByTestId('stop-recording-button')).toBeInTheDocument();
      }, { timeout: LAZY_COMPONENT_TIMEOUT });
      fireEvent.click(screen.getByTestId('stop-recording-button'));
      expect(mockRecordingStoreState.stopRecording).toHaveBeenCalled();
    });
  });
});
