/**
 * Ghost Note Store Types
 *
 * Type definitions for all Zustand stores.
 *
 * @module stores/types
 */

import type { PoemAnalysis, Melody } from '../types';
import type { TimeSignature, KeySignature } from '../lib/melody/types';

// =============================================================================
// Lyric Version Types
// =============================================================================

/**
 * A change made to lyrics (for diff tracking)
 */
export interface LyricChange {
  /** Type of change */
  type: 'add' | 'remove' | 'modify';
  /** Starting position in the text */
  start: number;
  /** Ending position in the text */
  end: number;
  /** The old text (for modify/remove) */
  oldText?: string;
  /** The new text (for add/modify) */
  newText?: string;
}

/**
 * A version of the lyrics with metadata
 */
export interface LyricVersion {
  /** Unique identifier for this version */
  id: string;
  /** The lyrics text content */
  lyrics: string;
  /** When this version was created */
  timestamp: number;
  /** Changes from the previous version */
  changes: LyricChange[];
  /** Optional description of changes */
  description?: string;
}

// =============================================================================
// Recording Types
// =============================================================================

/**
 * State of the recording process
 */
export type RecordingState = 'idle' | 'preparing' | 'recording' | 'paused' | 'stopped';

/**
 * A recorded take
 */
export interface RecordingTake {
  /** Unique identifier */
  id: string;
  /** Audio blob data (stored separately in IndexedDB for production) */
  blobUrl: string;
  /** Duration in seconds */
  duration: number;
  /** When this was recorded */
  timestamp: number;
  /** ID of the melody version used during recording */
  melodyVersionId?: string;
  /** ID of the lyric version used during recording */
  lyricVersionId?: string;
  /** Optional user-provided name */
  name?: string;
}

// =============================================================================
// UI Types
// =============================================================================

/**
 * Theme options
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Modal types that can be open
 */
export type ModalType =
  | 'none'
  | 'settings'
  | 'export'
  | 'import'
  | 'help'
  | 'version-history'
  | 'recording-manager'
  | 'share';

/**
 * Panel identifiers for visibility tracking
 */
export type PanelId =
  | 'poem-input'
  | 'analysis'
  | 'lyric-editor'
  | 'melody-player'
  | 'recording-studio';

/**
 * Panel visibility state
 */
export type PanelVisibility = Record<PanelId, boolean>;

// =============================================================================
// Poem Store Types
// =============================================================================

export interface PoemState {
  /** Original poem text as entered by user */
  original: string;
  /** All versions of adapted lyrics */
  versions: LyricVersion[];
  /** Index of currently active version (-1 means original) */
  currentVersionIndex: number;
}

export interface PoemActions {
  /** Set the original poem text */
  setPoem: (text: string) => void;
  /** Add a new lyric version */
  addVersion: (lyrics: string, description?: string) => void;
  /** Revert to a specific version by index */
  revertToVersion: (index: number) => void;
  /** Update the current version's lyrics */
  updateCurrentVersion: (lyrics: string) => void;
  /** Delete a specific version */
  deleteVersion: (id: string) => void;
  /** Clear all data */
  reset: () => void;
}

export type PoemStore = PoemState & PoemActions;

// =============================================================================
// Analysis Store Types
// =============================================================================

export type AnalysisStage =
  | 'idle'
  | 'preprocessing'
  | 'tokenizing'
  | 'phonetic'
  | 'syllabifying'
  | 'meter'
  | 'rhyme'
  | 'singability'
  | 'emotion'
  | 'complete'
  | 'error';

export interface AnalysisState {
  /** The analysis results */
  analysis: PoemAnalysis | null;
  /** Whether analysis is in progress */
  isLoading: boolean;
  /** Current stage of analysis */
  stage: AnalysisStage;
  /** Progress percentage (0-100) */
  progress: number;
  /** Error message if analysis failed */
  error: string | null;
  /** ID of the lyric version that was analyzed */
  analyzedVersionId: string | null;
}

export interface AnalysisActions {
  /** Start analyzing a poem */
  analyze: (text: string, versionId?: string) => Promise<void>;
  /** Set analysis results directly */
  setAnalysis: (analysis: PoemAnalysis, versionId?: string) => void;
  /** Update analysis stage */
  setStage: (stage: AnalysisStage, progress?: number) => void;
  /** Set error state */
  setError: (error: string) => void;
  /** Clear analysis */
  clear: () => void;
  /** Reset to initial state */
  reset: () => void;
}

export type AnalysisStore = AnalysisState & AnalysisActions;

// =============================================================================
// Melody Store Types
// =============================================================================

export type PlaybackState = 'stopped' | 'playing' | 'paused' | 'loading';

export interface MelodyState {
  /** The generated melody */
  melody: Melody | null;
  /** ABC notation string */
  abcNotation: string | null;
  /** Playback state */
  playbackState: PlaybackState;
  /** Current playback position in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Tempo in BPM */
  tempo: number;
  /** Volume (0-1) */
  volume: number;
  /** Whether to loop playback */
  loop: boolean;
  /** Key signature */
  key: KeySignature;
  /** Time signature */
  timeSignature: TimeSignature;
  /** Whether melody is being generated */
  isGenerating: boolean;
  /** Generation error if any */
  error: string | null;
}

export interface MelodyActions {
  /** Generate melody from lyrics and analysis */
  generateMelody: (lyrics: string, analysis: PoemAnalysis) => Promise<void>;
  /** Set melody directly */
  setMelody: (melody: Melody, abcNotation: string) => void;
  /** Set ABC notation */
  setAbcNotation: (abc: string) => void;
  /** Play/resume playback */
  play: () => Promise<void> | void;
  /** Pause playback */
  pause: () => void;
  /** Stop playback */
  stop: () => void;
  /** Seek to position */
  seek: (time: number) => void;
  /** Update current time (for sync) */
  setCurrentTime: (time: number) => void;
  /** Set duration */
  setDuration: (duration: number) => void;
  /** Set tempo */
  setTempo: (bpm: number) => void;
  /** Set volume */
  setVolume: (volume: number) => void;
  /** Toggle loop */
  toggleLoop: () => void;
  /** Set key signature */
  setKey: (key: KeySignature) => void;
  /** Set time signature */
  setTimeSignature: (ts: TimeSignature) => void;
  /** Set error */
  setError: (error: string | null) => void;
  /** Clear melody */
  clear: () => void;
  /** Reset to initial state */
  reset: () => void;
}

export type MelodyStore = MelodyState & MelodyActions;

// =============================================================================
// Recording Store Types
// =============================================================================

export interface RecordingStoreState {
  /** Current recording state */
  recordingState: RecordingState;
  /** All recorded takes */
  takes: RecordingTake[];
  /** Currently selected take ID */
  selectedTakeId: string | null;
  /** Recording duration in seconds */
  recordingDuration: number;
  /** Whether microphone permission is granted */
  hasPermission: boolean;
  /** Error message if any */
  error: string | null;
  /** Input audio level (0-1) */
  inputLevel: number;
}

export interface RecordingActions {
  /** Request microphone permission */
  requestPermission: () => Promise<boolean>;
  /** Start recording */
  startRecording: (melodyVersionId?: string, lyricVersionId?: string) => Promise<void>;
  /** Stop recording */
  stopRecording: () => void;
  /** Pause recording */
  pauseRecording: () => void;
  /** Resume recording */
  resumeRecording: () => void;
  /** Add a completed take */
  addTake: (take: RecordingTake) => void;
  /** Delete a take */
  deleteTake: (id: string) => void;
  /** Select a take */
  selectTake: (id: string | null) => void;
  /** Rename a take */
  renameTake: (id: string, name: string) => void;
  /** Update recording duration */
  setRecordingDuration: (duration: number) => void;
  /** Update input level */
  setInputLevel: (level: number) => void;
  /** Set error */
  setError: (error: string | null) => void;
  /** Clear all takes */
  clearTakes: () => void;
  /** Reset to initial state */
  reset: () => void;
}

export type RecordingStore = RecordingStoreState & RecordingActions;

// =============================================================================
// UI Store Types
// =============================================================================

export interface UIState {
  /** Current theme */
  theme: Theme;
  /** Resolved theme (after system preference) */
  resolvedTheme: 'light' | 'dark';
  /** Currently open modal */
  openModal: ModalType;
  /** Panel visibility states */
  panels: PanelVisibility;
  /** Whether sidebar is collapsed */
  sidebarCollapsed: boolean;
  /** Whether notifications are enabled */
  notificationsEnabled: boolean;
  /** Last notification message */
  notification: { message: string; type: 'info' | 'success' | 'warning' | 'error' } | null;
}

export interface UIActions {
  /** Set theme */
  setTheme: (theme: Theme) => void;
  /** Update resolved theme based on system preference */
  updateResolvedTheme: () => void;
  /** Open a modal */
  openModalDialog: (modal: ModalType) => void;
  /** Close the current modal */
  closeModal: () => void;
  /** Toggle panel visibility */
  togglePanel: (panelId: PanelId) => void;
  /** Set panel visibility */
  setPanelVisible: (panelId: PanelId, visible: boolean) => void;
  /** Toggle sidebar */
  toggleSidebar: () => void;
  /** Show notification */
  showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  /** Clear notification */
  clearNotification: () => void;
  /** Toggle notifications enabled */
  toggleNotifications: () => void;
  /** Reset to initial state */
  reset: () => void;
}

export type UIStore = UIState & UIActions;
