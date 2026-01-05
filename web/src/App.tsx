/**
 * Ghost Note Main Application
 *
 * Root component that sets up the application layout and routing.
 *
 * @module App
 */

import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { usePoemStore, selectCurrentLyrics, selectHasPoem } from '@/stores/usePoemStore';
import { useAnalysisStore, selectHasAnalysis, selectIsAnalyzing } from '@/stores/useAnalysisStore';
import {
  useMelodyStore,
  selectHasMelody,
  selectIsGenerating,
  selectIsPlaying,
} from '@/stores/useMelodyStore';
import { useRecordingStore, selectHasPermission, selectIsRecording } from '@/stores/useRecordingStore';
import {
  useSuggestionStore,
  selectHasSuggestions,
  selectIsLoading as selectSuggestionsLoading,
} from '@/stores/useSuggestionStore';
import { useUIStore } from '@/stores/useUIStore';
import { useUndoStore, selectCanUndo, selectCanRedo } from '@/stores/undoMiddleware';
import { useToastStore } from '@/stores/useToastStore';
import { generateSuggestionsFromAnalysis } from '@/lib/suggestions';
import { parseAndImportShareDataFromUrl, hasShareDataInUrl } from '@/lib/share';
import type { PoemAnalysis } from '@/types';
import { AppShell, type NavigationView } from '@/components/Layout';
import { EmptyState, LoadingSpinner, ToastContainer, SkipLinks, OfflineIndicator } from '@/components/Common';
import { PoemInput } from '@/components/PoemInput';
// Lazy-loaded components for code splitting
// These components import heavy libraries (abcjs ~500KB, Recording components)
const AnalysisPanel = lazy(() => import('@/components/Analysis/AnalysisPanel').then(m => ({ default: m.AnalysisPanel })));
const LyricEditor = lazy(() => import('@/components/LyricEditor/LyricEditor').then(m => ({ default: m.LyricEditor })));
const NotationDisplay = lazy(() => import('@/components/Notation/NotationDisplay').then(m => ({ default: m.NotationDisplay })));
const PlaybackContainer = lazy(() => import('@/components/Playback/PlaybackContainer').then(m => ({ default: m.PlaybackContainer })));
const PermissionPrompt = lazy(() => import('@/components/Recording/PermissionPrompt').then(m => ({ default: m.PermissionPrompt })));
const AudioLevelMeter = lazy(() => import('@/components/Recording/AudioLevelMeter').then(m => ({ default: m.AudioLevelMeter })));
const MicrophoneSelect = lazy(() => import('@/components/Recording/MicrophoneSelect').then(m => ({ default: m.MicrophoneSelect })));
import { KeyboardShortcutsDialog } from '@/components/KeyboardShortcuts';
import { TutorialDialog } from '@/components/Tutorial';
import {
  useTutorialStore,
  selectIsTutorialActive,
  selectShouldShowTutorial,
} from '@/stores/useTutorialStore';
import { ShareDialog } from '@/components/Share';
import { HelpPanel } from '@/components/Help';
import { useKeyboardShortcuts } from '@/hooks';
import './App.css';

/**
 * Loading fallback component for lazy-loaded sections
 */
function SectionLoadingFallback(): React.ReactElement {
  return (
    <div className="section-loading" data-testid="section-loading">
      <LoadingSpinner size="large" />
      <p>Loading...</p>
    </div>
  );
}

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[App] ${message}`, ...args);
  }
};

/**
 * View configuration for each navigation item
 */
interface ViewConfig {
  id: NavigationView;
  title: string;
  description: string;
}

/**
 * Wrapper component for LyricEditor that triggers suggestion generation via effect.
 * This avoids triggering effects during render which violates React rules.
 */
function LyricEditorWithSuggestions({
  hasAnalysis,
  analysis,
  hasSuggestions,
  suggestionsLoading,
  onGenerateSuggestions,
}: {
  hasAnalysis: boolean;
  analysis: PoemAnalysis | null;
  hasSuggestions: boolean;
  suggestionsLoading: boolean;
  onGenerateSuggestions: () => void;
}): React.ReactElement {
  // Trigger suggestion generation when entering this view with analysis
  useEffect(() => {
    if (hasAnalysis && analysis && !hasSuggestions && !suggestionsLoading) {
      log('Triggering suggestion generation from effect');
      onGenerateSuggestions();
    }
  }, [hasAnalysis, analysis, hasSuggestions, suggestionsLoading, onGenerateSuggestions]);

  return <LyricEditor testId="view-lyrics-editor" />;
}

const VIEW_CONFIGS: Record<NavigationView, ViewConfig> = {
  'poem-input': {
    id: 'poem-input',
    title: 'No Poem Entered',
    description: 'Paste or type your poem to get started.',
  },
  analysis: {
    id: 'analysis',
    title: 'No Analysis Available',
    description: 'Enter a poem first to see its analysis.',
  },
  'lyrics-editor': {
    id: 'lyrics-editor',
    title: 'No Lyrics to Edit',
    description: 'Complete the analysis step to start editing lyrics.',
  },
  melody: {
    id: 'melody',
    title: 'No Melody Generated',
    description: 'Edit your lyrics first, then generate a melody.',
  },
  recording: {
    id: 'recording',
    title: 'Ready to Record',
    description: 'Generate a melody first, then record your performance.',
  },
};

/**
 * Renders the appropriate component for each navigation view.
 * Falls back to EmptyState placeholder when required data is not available.
 */
function ViewContent({
  view,
  onNavigate,
}: {
  view: NavigationView;
  onNavigate: (view: NavigationView) => void;
}): React.ReactElement {
  const config = VIEW_CONFIGS[view];

  // Poem store
  const original = usePoemStore((state) => state.original);
  const hasPoem = usePoemStore(selectHasPoem);
  const currentLyrics = usePoemStore(selectCurrentLyrics);

  // Analysis store
  const analysis = useAnalysisStore((state) => state.analysis);
  const hasAnalysis = useAnalysisStore(selectHasAnalysis);
  const isAnalyzing = useAnalysisStore(selectIsAnalyzing);
  const analyzePoem = useAnalysisStore((state) => state.analyze);

  // Melody store
  const abcNotation = useMelodyStore((state) => state.abcNotation);
  const hasMelody = useMelodyStore(selectHasMelody);
  const isGenerating = useMelodyStore(selectIsGenerating);
  const playbackState = useMelodyStore((state) => state.playbackState);
  const currentTime = useMelodyStore((state) => state.currentTime);
  const duration = useMelodyStore((state) => state.duration);
  const tempo = useMelodyStore((state) => state.tempo);
  const keySignature = useMelodyStore((state) => state.key);
  const loop = useMelodyStore((state) => state.loop);
  const play = useMelodyStore((state) => state.play);
  const pause = useMelodyStore((state) => state.pause);
  const stop = useMelodyStore((state) => state.stop);
  const seek = useMelodyStore((state) => state.seek);
  const setTempo = useMelodyStore((state) => state.setTempo);
  const setKey = useMelodyStore((state) => state.setKey);
  const toggleLoop = useMelodyStore((state) => state.toggleLoop);
  const generateMelody = useMelodyStore((state) => state.generateMelody);

  // Recording store
  const hasPermission = useRecordingStore(selectHasPermission);
  const isRecording = useRecordingStore(selectIsRecording);
  const inputLevel = useRecordingStore((state) => state.inputLevel);
  const startRecording = useRecordingStore((state) => state.startRecording);
  const stopRecording = useRecordingStore((state) => state.stopRecording);

  // Suggestion store
  const hasSuggestions = useSuggestionStore(selectHasSuggestions);
  const suggestionsLoading = useSuggestionStore(selectSuggestionsLoading);
  const setSuggestions = useSuggestionStore((state) => state.setSuggestions);
  const setLoadingSuggestions = useSuggestionStore((state) => state.setLoading);

  // Track if we've generated suggestions for the current analysis
  const lastAnalysisIdRef = useRef<string | null>(null);

  // Trigger analysis when navigating to analysis view if poem exists but not analyzed
  const handleAnalyze = useCallback(() => {
    if (hasPoem && !hasAnalysis && !isAnalyzing) {
      log('Auto-triggering analysis for poem');
      analyzePoem(original);
    }
  }, [hasPoem, hasAnalysis, isAnalyzing, analyzePoem, original]);

  // Trigger melody generation when navigating to melody view if analysis exists but no melody
  const handleGenerateMelody = useCallback(() => {
    if (hasAnalysis && analysis && !hasMelody && !isGenerating) {
      log('Auto-triggering melody generation');
      generateMelody(currentLyrics, analysis);
    }
  }, [hasAnalysis, analysis, hasMelody, isGenerating, generateMelody, currentLyrics]);

  // Generate suggestions from analysis when entering lyrics-editor view
  const handleGenerateSuggestions = useCallback(() => {
    if (!hasAnalysis || !analysis) {
      log('No analysis available for suggestion generation');
      return;
    }

    // Create a unique ID for this analysis based on problems
    const analysisId = `${analysis.problems.length}-${analysis.meta.lineCount}`;

    // Skip if we already have suggestions for this analysis
    if (hasSuggestions && lastAnalysisIdRef.current === analysisId) {
      log('Suggestions already generated for this analysis');
      return;
    }

    // Skip if already loading
    if (suggestionsLoading) {
      log('Suggestions already loading');
      return;
    }

    log('Generating suggestions from analysis', {
      problemCount: analysis.problems.length,
      analysisId,
    });

    // Set loading state
    setLoadingSuggestions(true);
    lastAnalysisIdRef.current = analysisId;

    // Generate suggestions (this is synchronous but we use setTimeout to not block)
    setTimeout(() => {
      try {
        const result = generateSuggestionsFromAnalysis(analysis, {
          maxSuggestions: 10,
          minSeverity: 'low',
        });

        log('Generated suggestions', {
          count: result.suggestions.length,
          processed: result.problemsProcessed,
          skipped: result.problemsSkipped,
        });

        setSuggestions(result.suggestions);
      } catch (error) {
        log('Error generating suggestions:', error);
        setLoadingSuggestions(false);
      }
    }, 0);
  }, [
    hasAnalysis,
    analysis,
    hasSuggestions,
    suggestionsLoading,
    setSuggestions,
    setLoadingSuggestions,
  ]);

  log('Rendering view content for:', view, { hasPoem, hasAnalysis, hasMelody, hasSuggestions });

  switch (view) {
    case 'poem-input':
      return (
        <PoemInput
          onAnalyze={() => {
            log('Analyze triggered, navigating to analysis view');
            onNavigate('analysis');
          }}
          showStats
        />
      );

    case 'analysis':
      // Trigger analysis if needed when entering this view
      if (hasPoem && !hasAnalysis && !isAnalyzing) {
        // Schedule analysis trigger after render
        setTimeout(handleAnalyze, 0);
      }

      // Show loading state while analyzing
      if (isAnalyzing) {
        return (
          <div className="view-loading" data-testid="view-analysis-loading">
            <LoadingSpinner size="large" />
            <p>Analyzing poem...</p>
          </div>
        );
      }

      // Show empty state if no poem
      if (!hasPoem) {
        return (
          <EmptyState
            title={config.title}
            description={config.description}
            variant="centered"
            testId="view-analysis"
          />
        );
      }

      // Show AnalysisPanel with analysis data
      return (
        <Suspense fallback={<SectionLoadingFallback />}>
          <AnalysisPanel
            analysis={analysis}
            poemText={original}
          />
        </Suspense>
      );

    case 'lyrics-editor':
      // Show empty state if no poem
      if (!hasPoem) {
        return (
          <EmptyState
            title={config.title}
            description={config.description}
            variant="centered"
            testId="view-lyrics-editor"
          />
        );
      }

      // LyricEditor handles its own internal state and hooks
      return (
        <Suspense fallback={<SectionLoadingFallback />}>
          <LyricEditorWithSuggestions
            hasAnalysis={hasAnalysis}
            analysis={analysis}
            hasSuggestions={hasSuggestions}
            suggestionsLoading={suggestionsLoading}
            onGenerateSuggestions={handleGenerateSuggestions}
          />
        </Suspense>
      );

    case 'melody':
      // Trigger melody generation if needed when entering this view
      if (hasAnalysis && analysis && !hasMelody && !isGenerating) {
        setTimeout(handleGenerateMelody, 0);
      }

      // Show loading state while generating
      if (isGenerating) {
        return (
          <div className="view-loading" data-testid="view-melody-loading">
            <LoadingSpinner size="large" />
            <p>Generating melody...</p>
          </div>
        );
      }

      // Show empty state if no analysis
      if (!hasAnalysis) {
        return (
          <EmptyState
            title={config.title}
            description={config.description}
            variant="centered"
            testId="view-melody"
          />
        );
      }

      // Show NotationDisplay and PlaybackContainer
      return (
        <Suspense fallback={<SectionLoadingFallback />}>
          <div className="melody-view" data-testid="view-melody">
            {hasMelody && abcNotation ? (
              <>
                <NotationDisplay
                  abc={abcNotation}
                  responsive
                  className="melody-notation"
                />
                <PlaybackContainer
                  playbackState={playbackState}
                  currentTime={currentTime}
                  duration={duration}
                  hasContent={hasMelody}
                  tempo={tempo}
                  onTempoChange={setTempo}
                  keySignature={keySignature}
                  onKeyChange={setKey}
                  loopEnabled={loop}
                  onLoopEnabledChange={() => toggleLoop()}
                  onPlay={play}
                  onPause={pause}
                  onStop={stop}
                  onSeek={seek}
                  layout="vertical"
                  testId="melody-playback"
                />
              </>
            ) : (
              <EmptyState
                title="No Melody Generated"
                description="Click below to generate a melody from your lyrics."
                variant="centered"
                testId="view-melody-empty"
              />
            )}
          </div>
        </Suspense>
      );

    case 'recording':
      // Show empty state if no melody
      if (!hasMelody) {
        return (
          <EmptyState
            title={config.title}
            description={config.description}
            variant="centered"
            testId="view-recording"
          />
        );
      }

      // Show recording interface
      return (
        <Suspense fallback={<SectionLoadingFallback />}>
          <div className="recording-view" data-testid="view-recording">
            {!hasPermission ? (
              <PermissionPrompt
                onPermissionGranted={() => {
                  log('Microphone permission granted');
                }}
                onPermissionDenied={(error) => {
                  log('Microphone permission denied:', error);
                }}
                variant="card"
              />
            ) : (
              <div className="recording-controls">
                <h3>Recording Studio</h3>
                <MicrophoneSelect
                  hasPermission={hasPermission}
                  className="recording-mic-select"
                />
                <AudioLevelMeter
                  level={inputLevel}
                  meterStyle="gradient"
                  orientation="horizontal"
                  showPeak
                  width="100%"
                  height="24px"
                  className="recording-level-meter"
                />
                <div className="recording-actions">
                  {isRecording ? (
                    <button
                      type="button"
                      className="recording-button recording-button--stop"
                      onClick={stopRecording}
                      data-testid="stop-recording-button"
                    >
                      Stop Recording
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="recording-button recording-button--start"
                      onClick={() => startRecording()}
                      data-testid="start-recording-button"
                    >
                      Start Recording
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </Suspense>
      );

    default:
      return (
        <EmptyState
          title={config.title}
          description={config.description}
          variant="centered"
          testId={`view-${view}`}
        />
      );
  }
}

/**
 * Navigation order for Tab navigation
 */
const NAVIGATION_ORDER: NavigationView[] = [
  'poem-input',
  'analysis',
  'lyrics-editor',
  'melody',
  'recording',
];

/**
 * Main Application component.
 *
 * Sets up the app shell with navigation and manages the active view state.
 * Integrates keyboard shortcuts for playback, navigation, and recording.
 */
function App(): React.ReactElement {
  const [activeView, setActiveView] = useState<NavigationView>('poem-input');
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);

  // Tutorial state
  const isTutorialActive = useTutorialStore(selectIsTutorialActive);
  const shouldShowTutorial = useTutorialStore(selectShouldShowTutorial);
  const startTutorial = useTutorialStore((state) => state.startTutorial);
  const skipTutorial = useTutorialStore((state) => state.skipTutorial);

  log('App rendering with activeView:', activeView);

  // Melody store for playback shortcuts
  const hasMelody = useMelodyStore(selectHasMelody);
  const isPlaying = useMelodyStore(selectIsPlaying);
  const isGenerating = useMelodyStore(selectIsGenerating);
  const play = useMelodyStore((state) => state.play);
  const pause = useMelodyStore((state) => state.pause);
  const stop = useMelodyStore((state) => state.stop);
  const generateMelody = useMelodyStore((state) => state.generateMelody);

  // Recording store for recording shortcuts
  const isRecording = useRecordingStore(selectIsRecording);
  const hasPermission = useRecordingStore(selectHasPermission);
  const startRecording = useRecordingStore((state) => state.startRecording);
  const stopRecording = useRecordingStore((state) => state.stopRecording);

  // Poem and analysis stores for melody generation
  const hasAnalysis = useAnalysisStore(selectHasAnalysis);
  const analysis = useAnalysisStore((state) => state.analysis);
  const currentLyrics = usePoemStore(selectCurrentLyrics);

  // UI store for notifications, modals, and help panel
  const showNotification = useUIStore((state) => state.showNotification);
  const openModalDialog = useUIStore((state) => state.openModalDialog);
  const openModal = useUIStore((state) => state.openModal);
  const closeModal = useUIStore((state) => state.closeModal);

  // Undo store for undo/redo functionality
  const canUndo = useUndoStore(selectCanUndo);
  const canRedo = useUndoStore(selectCanRedo);
  const undoAction = useUndoStore((state) => state.undo);
  const redoAction = useUndoStore((state) => state.redo);
  const recordState = useUndoStore((state) => state.recordState);
  const clearHistory = useUndoStore((state) => state.clearHistory);

  // Poem store for setting lyrics after undo/redo
  const updateCurrentVersion = usePoemStore((state) => state.updateCurrentVersion);

  // Toast store for notifications
  const addToast = useToastStore((state) => state.addToast);

  // Track if share data has been processed
  const shareDataProcessed = useRef(false);

  // Initialize theme on mount - only runs once
  useEffect(() => {
    // Re-apply theme to ensure it's set correctly after hydration
    const currentTheme = useThemeStore.getState().theme;
    if (currentTheme) {
      log('Initializing theme:', currentTheme);
      useThemeStore.getState().setTheme(currentTheme);
    }
  }, []);

  // Auto-show tutorial on first visit
  useEffect(() => {
    if (shouldShowTutorial) {
      log('First visit detected, showing tutorial');
      // Small delay to ensure app is fully rendered
      const timeoutId = setTimeout(() => {
        startTutorial();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [shouldShowTutorial, startTutorial]);

  // Handle tutorial close
  const handleTutorialClose = useCallback(() => {
    log('Tutorial closed');
    skipTutorial();
  }, [skipTutorial]);

  // Handle tutorial complete
  const handleTutorialComplete = useCallback(() => {
    log('Tutorial completed');
    showNotification('Tutorial completed! Start by entering your poem.', 'success');
  }, [showNotification]);

  // Handle tutorial navigation to view
  const handleTutorialNavigate = useCallback((view: string) => {
    log('Tutorial navigating to view:', view);
    // Map tutorial view names to NavigationView
    const viewMap: Record<string, NavigationView> = {
      'poem-input': 'poem-input',
      'analysis': 'analysis',
      'lyrics-editor': 'lyrics-editor',
      'melody': 'melody',
      'recording': 'recording',
    };
    const navView = viewMap[view];
    if (navView) {
      setActiveView(navView);
    }
  }, []);

  // Check for share data in URL on mount
  useEffect(() => {
    // Only process share data once
    if (shareDataProcessed.current) {
      return;
    }

    // Check if URL contains share data
    if (!hasShareDataInUrl()) {
      log('No share data in URL');
      shareDataProcessed.current = true;
      return;
    }

    log('Share data detected in URL, importing...');
    shareDataProcessed.current = true;

    // Parse and import the share data
    const importShareData = async (): Promise<void> => {
      try {
        const result = await parseAndImportShareDataFromUrl({ clearExisting: true });

        if (result === null) {
          log('No share data to import');
          return;
        }

        if (result.success && result.imported) {
          log('Share data imported successfully:', result.mode);
          addToast(`Shared ${result.mode === 'poem-only' ? 'poem' : 'project'} loaded successfully`, {
            type: 'success',
            duration: 4000,
          });

          // Navigate based on what was imported
          if (result.mode === 'full' || result.mode === 'with-analysis') {
            setActiveView('analysis');
          }
        } else if (!result.success) {
          log('Failed to import share data:', result.error);
          addToast(result.error || 'Failed to load shared content', {
            type: 'error',
            duration: 5000,
          });
        }
      } catch (error) {
        log('Error importing share data:', error);
        addToast('Failed to load shared content', {
          type: 'error',
          duration: 5000,
        });
      }
    };

    importShareData();
  }, [addToast]);

  // Track if we're in the middle of an undo/redo operation
  const isUndoRedoInProgress = useRef(false);

  // Set up undo integration - subscribe to poem store changes
  useEffect(() => {
    let lastLyrics: string | null = null;

    // Helper to get current lyrics from poem state
    const getCurrentLyrics = (state: {
      original: string;
      versions: Array<{ lyrics: string; description?: string }>;
      currentVersionIndex: number;
    }): string => {
      if (state.currentVersionIndex >= 0 && state.versions[state.currentVersionIndex]) {
        return state.versions[state.currentVersionIndex].lyrics;
      }
      return state.original;
    };

    // Subscribe to poem store changes
    const unsubscribe = usePoemStore.subscribe((state, prevState) => {
      // Skip if undo/redo is in progress
      if (isUndoRedoInProgress.current) {
        log('Skipping undo record: undo/redo in progress');
        return;
      }

      // Check if this is a new poem (original changed and versions reset)
      if (
        state.original !== prevState.original &&
        state.versions.length === 0 &&
        prevState.versions.length >= 0
      ) {
        log('New poem detected, clearing undo history');
        clearHistory();
        lastLyrics = null;

        // Record the new original as initial state
        if (state.original) {
          recordState(state.original, 'New poem');
          lastLyrics = state.original;
        }
        return;
      }

      const currentLyrics = getCurrentLyrics(state);
      const prevLyrics = getCurrentLyrics(prevState);

      // Check if lyrics actually changed
      if (currentLyrics !== prevLyrics && currentLyrics !== lastLyrics) {
        // Determine description
        let description: string | undefined;
        if (state.versions.length > prevState.versions.length) {
          // A new version was added
          const newVersion = state.versions[state.versions.length - 1];
          description = newVersion?.description || 'Edit';
        } else if (state.currentVersionIndex !== prevState.currentVersionIndex) {
          // Version index changed (revert)
          description = 'Reverted to version';
        } else {
          description = 'Edit';
        }

        log('Recording lyric change for undo:', description);
        recordState(currentLyrics, description);
        lastLyrics = currentLyrics;
      }
    });

    // Initialize with current lyrics if present
    const initialState = usePoemStore.getState();
    const initialLyrics = getCurrentLyrics(initialState);
    if (initialLyrics) {
      recordState(initialLyrics, 'Initial');
      lastLyrics = initialLyrics;
    }

    return () => {
      unsubscribe();
    };
  }, [recordState, clearHistory]);

  const handleNavigate = useCallback((view: NavigationView): void => {
    log('Navigating to:', view);
    setActiveView(view);
  }, []);

  // Keyboard shortcut handlers
  const handlePlayPause = useCallback(() => {
    if (!hasMelody) {
      log('No melody available, ignoring play/pause');
      return;
    }

    if (isPlaying) {
      log('Pausing playback via keyboard shortcut');
      pause();
    } else {
      log('Playing via keyboard shortcut');
      play();
    }
  }, [hasMelody, isPlaying, play, pause]);

  const handleStop = useCallback(() => {
    if (!hasMelody) {
      log('No melody available, ignoring stop');
      return;
    }
    log('Stopping playback via keyboard shortcut');
    stop();
  }, [hasMelody, stop]);

  const handleGenerateMelody = useCallback(() => {
    if (!hasAnalysis || !analysis || !currentLyrics) {
      log('Cannot generate melody: missing analysis or lyrics');
      showNotification('Please analyze your poem first', 'warning');
      return;
    }
    if (isGenerating) {
      log('Already generating melody');
      return;
    }
    log('Generating melody via keyboard shortcut');
    generateMelody(currentLyrics, analysis);
    // Navigate to melody view
    handleNavigate('melody');
  }, [hasAnalysis, analysis, currentLyrics, isGenerating, generateMelody, showNotification, handleNavigate]);

  const handleUndo = useCallback(() => {
    if (!canUndo) {
      log('Nothing to undo');
      return;
    }
    log('Undo via keyboard shortcut');

    // Set flag to prevent recording this change in undo history
    isUndoRedoInProgress.current = true;
    try {
      const restoredLyrics = undoAction();
      if (restoredLyrics !== null) {
        // Update the poem store with restored lyrics
        updateCurrentVersion(restoredLyrics);
        showNotification('Undone', 'info');
      }
    } finally {
      isUndoRedoInProgress.current = false;
    }
  }, [canUndo, undoAction, updateCurrentVersion, showNotification]);

  const handleRedo = useCallback(() => {
    if (!canRedo) {
      log('Nothing to redo');
      return;
    }
    log('Redo via keyboard shortcut');

    // Set flag to prevent recording this change in undo history
    isUndoRedoInProgress.current = true;
    try {
      const restoredLyrics = redoAction();
      if (restoredLyrics !== null) {
        // Update the poem store with restored lyrics
        updateCurrentVersion(restoredLyrics);
        showNotification('Redone', 'info');
      }
    } finally {
      isUndoRedoInProgress.current = false;
    }
  }, [canRedo, redoAction, updateCurrentVersion, showNotification]);

  const handleSave = useCallback(() => {
    log('Save/Export via keyboard shortcut');
    openModalDialog('export');
    showNotification('Export dialog opened', 'info');
  }, [openModalDialog, showNotification]);

  const handleToggleRecording = useCallback(() => {
    if (!hasMelody) {
      log('No melody available, cannot record');
      showNotification('Please generate a melody first', 'warning');
      return;
    }

    if (isRecording) {
      log('Stopping recording via keyboard shortcut');
      stopRecording();
    } else {
      log('Starting recording via keyboard shortcut');
      if (!hasPermission) {
        showNotification('Please grant microphone permission first', 'warning');
        handleNavigate('recording');
        return;
      }
      startRecording();
    }
  }, [hasMelody, isRecording, hasPermission, startRecording, stopRecording, showNotification, handleNavigate]);

  const handleNavigateNext = useCallback(() => {
    const currentIndex = NAVIGATION_ORDER.indexOf(activeView);
    if (currentIndex < NAVIGATION_ORDER.length - 1) {
      const nextView = NAVIGATION_ORDER[currentIndex + 1];
      log('Navigating to next section:', nextView);
      handleNavigate(nextView);
    }
  }, [activeView, handleNavigate]);

  const handleNavigatePrev = useCallback(() => {
    const currentIndex = NAVIGATION_ORDER.indexOf(activeView);
    if (currentIndex > 0) {
      const prevView = NAVIGATION_ORDER[currentIndex - 1];
      log('Navigating to previous section:', prevView);
      handleNavigate(prevView);
    }
  }, [activeView, handleNavigate]);

  const handleShowHelp = useCallback(() => {
    log('Showing keyboard shortcuts dialog');
    setShowShortcutsDialog(true);
  }, []);

  // Register keyboard shortcuts
  useKeyboardShortcuts(
    {
      onPlayPause: handlePlayPause,
      onStop: handleStop,
      onGenerateMelody: handleGenerateMelody,
      onUndo: handleUndo,
      onRedo: handleRedo,
      onSave: handleSave,
      onToggleRecording: handleToggleRecording,
      onNavigateNext: handleNavigateNext,
      onNavigatePrev: handleNavigatePrev,
      onShowHelp: handleShowHelp,
    },
    {
      enabled: true,
      disableInTextInput: true,
    }
  );

  return (
    <>
      <SkipLinks
        links={[
          { targetId: 'main-content', label: 'Skip to main content' },
          { targetId: 'sidebar-navigation', label: 'Skip to navigation' },
        ]}
      />
      <OfflineIndicator position="top" />
      <AppShell activeView={activeView} onNavigate={handleNavigate}>
        <ViewContent view={activeView} onNavigate={handleNavigate} />
      </AppShell>

      <KeyboardShortcutsDialog
        isOpen={showShortcutsDialog}
        onClose={() => setShowShortcutsDialog(false)}
      />
      <TutorialDialog
        isOpen={isTutorialActive}
        onClose={handleTutorialClose}
        onComplete={handleTutorialComplete}
        onNavigate={handleTutorialNavigate}
        testId="app-tutorial"
      />
      <ShareDialog
        isOpen={openModal === 'share'}
        onClose={closeModal}
      />
      <HelpPanel
        isOpen={openModal === 'help'}
        onClose={closeModal}
      />
      <ToastContainer position="top-right" />
    </>
  );
}

export default App;
