/**
 * Ghost Note - Settings Store
 *
 * Manages user preferences and application settings.
 * Features:
 * - Theme preferences (light/dark/system)
 * - Default tempo for melody generation
 * - Vocal range presets (soprano/alto/tenor/bass)
 * - Auto-analyze on paste toggle
 * - Metronome sound toggle
 * - Keyboard shortcuts enable/disable
 * - Export/import settings
 * - Reset to defaults
 * - Persistence to localStorage
 *
 * @module stores/useSettingsStore
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Logging helper for debugging
const DEBUG = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[SettingsStore] ${message}`, ...args);
  }
};

// =============================================================================
// Types
// =============================================================================

/**
 * Theme options available to the user
 */
export type ThemePreference = 'light' | 'dark' | 'system';

/**
 * Vocal range presets that correspond to common voice types
 */
export type VocalRangePreset = 'soprano' | 'alto' | 'tenor' | 'bass' | 'custom';

/**
 * Metronome sound options
 */
export type MetronomeSound = 'click' | 'beep' | 'woodblock' | 'none';

/**
 * Vocal range configuration
 */
export interface VocalRangeConfig {
  /** Preset name or 'custom' */
  preset: VocalRangePreset;
  /** Low note (e.g., 'C3' for tenor) */
  lowNote: string;
  /** High note (e.g., 'C5' for tenor) */
  highNote: string;
}

/**
 * Settings state
 */
export interface SettingsState {
  // Appearance
  /** Theme preference */
  theme: ThemePreference;

  // Audio
  /** Default tempo in BPM for melody generation */
  defaultTempo: number;
  /** Vocal range configuration */
  vocalRange: VocalRangeConfig;
  /** Metronome sound option */
  metronomeSound: MetronomeSound;
  /** Metronome volume (0-1) */
  metronomeVolume: number;

  // Behavior
  /** Whether to automatically analyze poem when pasted */
  autoAnalyzeOnPaste: boolean;
  /** Whether keyboard shortcuts are enabled */
  keyboardShortcutsEnabled: boolean;

  // Metadata
  /** Version of settings schema for migrations */
  settingsVersion: number;
  /** Last time settings were modified */
  lastModified: number;
}

/**
 * Settings actions
 */
export interface SettingsActions {
  // Theme
  /** Set theme preference */
  setTheme: (theme: ThemePreference) => void;

  // Audio
  /** Set default tempo */
  setDefaultTempo: (tempo: number) => void;
  /** Set vocal range preset (auto-configures low/high notes) */
  setVocalRangePreset: (preset: VocalRangePreset) => void;
  /** Set custom vocal range */
  setCustomVocalRange: (lowNote: string, highNote: string) => void;
  /** Set metronome sound */
  setMetronomeSound: (sound: MetronomeSound) => void;
  /** Set metronome volume */
  setMetronomeVolume: (volume: number) => void;

  // Behavior
  /** Toggle auto-analyze on paste */
  toggleAutoAnalyzeOnPaste: () => void;
  /** Set auto-analyze on paste */
  setAutoAnalyzeOnPaste: (enabled: boolean) => void;
  /** Toggle keyboard shortcuts */
  toggleKeyboardShortcuts: () => void;
  /** Set keyboard shortcuts enabled */
  setKeyboardShortcutsEnabled: (enabled: boolean) => void;

  // Import/Export
  /** Export all settings as JSON string */
  exportSettings: () => string;
  /** Import settings from JSON string */
  importSettings: (json: string) => boolean;

  // Reset
  /** Reset all settings to defaults */
  resetToDefaults: () => void;
  /** Reset to initial state (used internally) */
  reset: () => void;
}

export type SettingsStore = SettingsState & SettingsActions;

// =============================================================================
// Constants
// =============================================================================

const STORAGE_KEY = 'ghost-note-settings-store';
const CURRENT_SETTINGS_VERSION = 1;

/**
 * Vocal range presets with corresponding note ranges
 */
export const VOCAL_RANGE_PRESETS: Record<
  Exclude<VocalRangePreset, 'custom'>,
  { lowNote: string; highNote: string; description: string }
> = {
  soprano: { lowNote: 'C4', highNote: 'C6', description: 'Soprano (C4-C6)' },
  alto: { lowNote: 'F3', highNote: 'F5', description: 'Alto (F3-F5)' },
  tenor: { lowNote: 'C3', highNote: 'C5', description: 'Tenor (C3-C5)' },
  bass: { lowNote: 'E2', highNote: 'E4', description: 'Bass (E2-E4)' },
};

/**
 * Default tempo range
 */
export const TEMPO_RANGE = {
  min: 40,
  max: 240,
  default: 100,
};

/**
 * Metronome sound options with labels
 */
export const METRONOME_SOUNDS: Record<MetronomeSound, string> = {
  click: 'Click',
  beep: 'Beep',
  woodblock: 'Woodblock',
  none: 'None (Silent)',
};

// =============================================================================
// Initial State
// =============================================================================

const initialState: SettingsState = {
  theme: 'system',
  defaultTempo: TEMPO_RANGE.default,
  vocalRange: {
    preset: 'tenor',
    lowNote: VOCAL_RANGE_PRESETS.tenor.lowNote,
    highNote: VOCAL_RANGE_PRESETS.tenor.highNote,
  },
  metronomeSound: 'click',
  metronomeVolume: 0.7,
  autoAnalyzeOnPaste: true,
  keyboardShortcutsEnabled: true,
  settingsVersion: CURRENT_SETTINGS_VERSION,
  lastModified: Date.now(),
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Clamp a number between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Validate settings object structure
 */
function isValidSettings(settings: unknown): settings is Partial<SettingsState> {
  if (typeof settings !== 'object' || settings === null) {
    return false;
  }

  const s = settings as Record<string, unknown>;

  // Theme validation
  if (s.theme !== undefined && !['light', 'dark', 'system'].includes(s.theme as string)) {
    return false;
  }

  // Tempo validation
  if (s.defaultTempo !== undefined && typeof s.defaultTempo !== 'number') {
    return false;
  }

  // Vocal range validation
  if (s.vocalRange !== undefined) {
    const vr = s.vocalRange as Record<string, unknown>;
    if (typeof vr !== 'object' || vr === null) {
      return false;
    }
    if (vr.preset !== undefined && !['soprano', 'alto', 'tenor', 'bass', 'custom'].includes(vr.preset as string)) {
      return false;
    }
  }

  // Metronome sound validation
  if (s.metronomeSound !== undefined && !['click', 'beep', 'woodblock', 'none'].includes(s.metronomeSound as string)) {
    return false;
  }

  return true;
}

// =============================================================================
// Store Implementation
// =============================================================================

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        ...initialState,

        // Actions
        setTheme: (theme: ThemePreference) => {
          log('Setting theme:', theme);
          set(
            {
              theme,
              lastModified: Date.now(),
            },
            false,
            'setTheme'
          );
        },

        setDefaultTempo: (tempo: number) => {
          const clampedTempo = clamp(tempo, TEMPO_RANGE.min, TEMPO_RANGE.max);
          log('Setting default tempo:', clampedTempo);
          set(
            {
              defaultTempo: clampedTempo,
              lastModified: Date.now(),
            },
            false,
            'setDefaultTempo'
          );
        },

        setVocalRangePreset: (preset: VocalRangePreset) => {
          log('Setting vocal range preset:', preset);

          if (preset === 'custom') {
            // Keep current notes but mark as custom
            set(
              (state) => ({
                vocalRange: {
                  ...state.vocalRange,
                  preset: 'custom',
                },
                lastModified: Date.now(),
              }),
              false,
              'setVocalRangePreset/custom'
            );
          } else {
            const presetConfig = VOCAL_RANGE_PRESETS[preset];
            set(
              {
                vocalRange: {
                  preset,
                  lowNote: presetConfig.lowNote,
                  highNote: presetConfig.highNote,
                },
                lastModified: Date.now(),
              },
              false,
              'setVocalRangePreset'
            );
          }
        },

        setCustomVocalRange: (lowNote: string, highNote: string) => {
          log('Setting custom vocal range:', lowNote, '-', highNote);
          set(
            {
              vocalRange: {
                preset: 'custom',
                lowNote,
                highNote,
              },
              lastModified: Date.now(),
            },
            false,
            'setCustomVocalRange'
          );
        },

        setMetronomeSound: (sound: MetronomeSound) => {
          log('Setting metronome sound:', sound);
          set(
            {
              metronomeSound: sound,
              lastModified: Date.now(),
            },
            false,
            'setMetronomeSound'
          );
        },

        setMetronomeVolume: (volume: number) => {
          const clampedVolume = clamp(volume, 0, 1);
          log('Setting metronome volume:', clampedVolume);
          set(
            {
              metronomeVolume: clampedVolume,
              lastModified: Date.now(),
            },
            false,
            'setMetronomeVolume'
          );
        },

        toggleAutoAnalyzeOnPaste: () => {
          const newValue = !get().autoAnalyzeOnPaste;
          log('Toggling auto-analyze on paste:', newValue);
          set(
            {
              autoAnalyzeOnPaste: newValue,
              lastModified: Date.now(),
            },
            false,
            'toggleAutoAnalyzeOnPaste'
          );
        },

        setAutoAnalyzeOnPaste: (enabled: boolean) => {
          log('Setting auto-analyze on paste:', enabled);
          set(
            {
              autoAnalyzeOnPaste: enabled,
              lastModified: Date.now(),
            },
            false,
            'setAutoAnalyzeOnPaste'
          );
        },

        toggleKeyboardShortcuts: () => {
          const newValue = !get().keyboardShortcutsEnabled;
          log('Toggling keyboard shortcuts:', newValue);
          set(
            {
              keyboardShortcutsEnabled: newValue,
              lastModified: Date.now(),
            },
            false,
            'toggleKeyboardShortcuts'
          );
        },

        setKeyboardShortcutsEnabled: (enabled: boolean) => {
          log('Setting keyboard shortcuts enabled:', enabled);
          set(
            {
              keyboardShortcutsEnabled: enabled,
              lastModified: Date.now(),
            },
            false,
            'setKeyboardShortcutsEnabled'
          );
        },

        exportSettings: (): string => {
          const state = get();
          log('Exporting settings');

          // Only export user-configurable settings
          const exportData = {
            theme: state.theme,
            defaultTempo: state.defaultTempo,
            vocalRange: state.vocalRange,
            metronomeSound: state.metronomeSound,
            metronomeVolume: state.metronomeVolume,
            autoAnalyzeOnPaste: state.autoAnalyzeOnPaste,
            keyboardShortcutsEnabled: state.keyboardShortcutsEnabled,
            settingsVersion: state.settingsVersion,
            exportedAt: new Date().toISOString(),
          };

          return JSON.stringify(exportData, null, 2);
        },

        importSettings: (json: string): boolean => {
          log('Importing settings');

          try {
            const parsed = JSON.parse(json);

            if (!isValidSettings(parsed)) {
              log('Invalid settings format');
              return false;
            }

            // Apply valid settings
            const updates: Partial<SettingsState> = {
              lastModified: Date.now(),
            };

            if (parsed.theme !== undefined) {
              updates.theme = parsed.theme;
            }
            if (parsed.defaultTempo !== undefined) {
              updates.defaultTempo = clamp(parsed.defaultTempo, TEMPO_RANGE.min, TEMPO_RANGE.max);
            }
            if (parsed.vocalRange !== undefined) {
              updates.vocalRange = parsed.vocalRange;
            }
            if (parsed.metronomeSound !== undefined) {
              updates.metronomeSound = parsed.metronomeSound;
            }
            if (parsed.metronomeVolume !== undefined) {
              updates.metronomeVolume = clamp(parsed.metronomeVolume, 0, 1);
            }
            if (parsed.autoAnalyzeOnPaste !== undefined) {
              updates.autoAnalyzeOnPaste = Boolean(parsed.autoAnalyzeOnPaste);
            }
            if (parsed.keyboardShortcutsEnabled !== undefined) {
              updates.keyboardShortcutsEnabled = Boolean(parsed.keyboardShortcutsEnabled);
            }

            set(updates, false, 'importSettings');
            log('Settings imported successfully');
            return true;
          } catch (error) {
            log('Failed to parse settings JSON:', error);
            return false;
          }
        },

        resetToDefaults: () => {
          log('Resetting to defaults');
          set(
            {
              ...initialState,
              lastModified: Date.now(),
            },
            false,
            'resetToDefaults'
          );
        },

        reset: () => {
          log('Resetting store');
          set(initialState, false, 'reset');
        },
      }),
      {
        name: STORAGE_KEY,
        partialize: (state) => ({
          theme: state.theme,
          defaultTempo: state.defaultTempo,
          vocalRange: state.vocalRange,
          metronomeSound: state.metronomeSound,
          metronomeVolume: state.metronomeVolume,
          autoAnalyzeOnPaste: state.autoAnalyzeOnPaste,
          keyboardShortcutsEnabled: state.keyboardShortcutsEnabled,
          settingsVersion: state.settingsVersion,
          lastModified: state.lastModified,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            log('Rehydrated settings from localStorage');
            // Handle migrations here if settingsVersion changes
            if (state.settingsVersion < CURRENT_SETTINGS_VERSION) {
              log('Migrating settings from version', state.settingsVersion, 'to', CURRENT_SETTINGS_VERSION);
              // Add migration logic here as needed
            }
          }
        },
      }
    ),
    { name: 'SettingsStore' }
  )
);

// =============================================================================
// Selectors
// =============================================================================

/**
 * Get the current theme preference
 */
export const selectTheme = (state: SettingsStore): ThemePreference => {
  return state.theme;
};

/**
 * Get the default tempo
 */
export const selectDefaultTempo = (state: SettingsStore): number => {
  return state.defaultTempo;
};

/**
 * Get the vocal range configuration
 */
export const selectVocalRange = (state: SettingsStore): VocalRangeConfig => {
  return state.vocalRange;
};

/**
 * Get the vocal range preset
 */
export const selectVocalRangePreset = (state: SettingsStore): VocalRangePreset => {
  return state.vocalRange.preset;
};

/**
 * Get the metronome sound
 */
export const selectMetronomeSound = (state: SettingsStore): MetronomeSound => {
  return state.metronomeSound;
};

/**
 * Get the metronome volume
 */
export const selectMetronomeVolume = (state: SettingsStore): number => {
  return state.metronomeVolume;
};

/**
 * Check if auto-analyze on paste is enabled
 */
export const selectAutoAnalyzeOnPaste = (state: SettingsStore): boolean => {
  return state.autoAnalyzeOnPaste;
};

/**
 * Check if keyboard shortcuts are enabled
 */
export const selectKeyboardShortcutsEnabled = (state: SettingsStore): boolean => {
  return state.keyboardShortcutsEnabled;
};

/**
 * Get the last modified timestamp
 */
export const selectLastModified = (state: SettingsStore): number => {
  return state.lastModified;
};

/**
 * Check if using dark theme
 */
export const selectIsDarkTheme = (state: SettingsStore): boolean => {
  if (state.theme === 'dark') return true;
  if (state.theme === 'light') return false;
  // For 'system', check system preference
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
};

/**
 * Get human-readable theme label
 */
export const selectThemeLabel = (state: SettingsStore): string => {
  switch (state.theme) {
    case 'light':
      return 'Light';
    case 'dark':
      return 'Dark';
    case 'system':
      return 'System';
    default:
      return 'Unknown';
  }
};

/**
 * Get human-readable vocal range label
 */
export const selectVocalRangeLabel = (state: SettingsStore): string => {
  const { preset, lowNote, highNote } = state.vocalRange;
  if (preset === 'custom') {
    return `Custom (${lowNote}-${highNote})`;
  }
  return VOCAL_RANGE_PRESETS[preset].description;
};
