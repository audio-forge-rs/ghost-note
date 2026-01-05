/**
 * Tests for useSettingsStore
 *
 * Comprehensive tests for settings management including:
 * - Theme preference setting
 * - Audio settings (tempo, vocal range, metronome)
 * - Behavior settings (auto-analyze, keyboard shortcuts)
 * - Export/import functionality
 * - Reset to defaults
 * - localStorage persistence
 * - Selectors
 *
 * @module stores/useSettingsStore.test
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  useSettingsStore,
  VOCAL_RANGE_PRESETS,
  TEMPO_RANGE,
  METRONOME_SOUNDS,
  selectTheme,
  selectDefaultTempo,
  selectVocalRange,
  selectVocalRangePreset,
  selectMetronomeSound,
  selectMetronomeVolume,
  selectAutoAnalyzeOnPaste,
  selectKeyboardShortcutsEnabled,
  selectLastModified,
  selectIsDarkTheme,
  selectThemeLabel,
  selectVocalRangeLabel,
} from './useSettingsStore';

// =============================================================================
// Mocks
// =============================================================================

// Track matchMedia for system preference detection
let prefersDarkMode = true;

const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: query === '(prefers-color-scheme: dark)' ? prefersDarkMode : !prefersDarkMode,
  media: query,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

vi.stubGlobal('matchMedia', mockMatchMedia);

// =============================================================================
// Test Suite
// =============================================================================

describe('useSettingsStore', () => {
  beforeEach(() => {
    // Reset store state
    useSettingsStore.getState().reset();

    // Reset mocks
    vi.clearAllMocks();
    prefersDarkMode = true;

    // Clear localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('ghost-note-settings-store');
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Constants Tests
  // ===========================================================================

  describe('constants', () => {
    it('should have correct vocal range presets', () => {
      expect(VOCAL_RANGE_PRESETS.soprano).toEqual({
        lowNote: 'C4',
        highNote: 'C6',
        description: 'Soprano (C4-C6)',
      });
      expect(VOCAL_RANGE_PRESETS.alto).toEqual({
        lowNote: 'F3',
        highNote: 'F5',
        description: 'Alto (F3-F5)',
      });
      expect(VOCAL_RANGE_PRESETS.tenor).toEqual({
        lowNote: 'C3',
        highNote: 'C5',
        description: 'Tenor (C3-C5)',
      });
      expect(VOCAL_RANGE_PRESETS.bass).toEqual({
        lowNote: 'E2',
        highNote: 'E4',
        description: 'Bass (E2-E4)',
      });
    });

    it('should have correct tempo range', () => {
      expect(TEMPO_RANGE).toEqual({
        min: 40,
        max: 240,
        default: 100,
      });
    });

    it('should have correct metronome sounds', () => {
      expect(METRONOME_SOUNDS).toEqual({
        click: 'Click',
        beep: 'Beep',
        woodblock: 'Woodblock',
        none: 'None (Silent)',
      });
    });
  });

  // ===========================================================================
  // Initial State Tests
  // ===========================================================================

  describe('initial state', () => {
    it('should have system as default theme', () => {
      const state = useSettingsStore.getState();
      expect(state.theme).toBe('system');
    });

    it('should have 100 as default tempo', () => {
      const state = useSettingsStore.getState();
      expect(state.defaultTempo).toBe(100);
    });

    it('should have tenor as default vocal range preset', () => {
      const state = useSettingsStore.getState();
      expect(state.vocalRange.preset).toBe('tenor');
      expect(state.vocalRange.lowNote).toBe('C3');
      expect(state.vocalRange.highNote).toBe('C5');
    });

    it('should have click as default metronome sound', () => {
      const state = useSettingsStore.getState();
      expect(state.metronomeSound).toBe('click');
    });

    it('should have 0.7 as default metronome volume', () => {
      const state = useSettingsStore.getState();
      expect(state.metronomeVolume).toBe(0.7);
    });

    it('should have auto-analyze enabled by default', () => {
      const state = useSettingsStore.getState();
      expect(state.autoAnalyzeOnPaste).toBe(true);
    });

    it('should have keyboard shortcuts enabled by default', () => {
      const state = useSettingsStore.getState();
      expect(state.keyboardShortcutsEnabled).toBe(true);
    });

    it('should have settings version 1', () => {
      const state = useSettingsStore.getState();
      expect(state.settingsVersion).toBe(1);
    });
  });

  // ===========================================================================
  // Theme Tests
  // ===========================================================================

  describe('setTheme', () => {
    it('should set theme to light', () => {
      useSettingsStore.getState().setTheme('light');
      expect(useSettingsStore.getState().theme).toBe('light');
    });

    it('should set theme to dark', () => {
      useSettingsStore.getState().setTheme('dark');
      expect(useSettingsStore.getState().theme).toBe('dark');
    });

    it('should set theme to system', () => {
      useSettingsStore.getState().setTheme('light');
      useSettingsStore.getState().setTheme('system');
      expect(useSettingsStore.getState().theme).toBe('system');
    });

    it('should update lastModified timestamp', async () => {
      const before = useSettingsStore.getState().lastModified;

      // Wait a tiny bit to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 2));
      useSettingsStore.getState().setTheme('dark');

      const after = useSettingsStore.getState().lastModified;
      expect(after).toBeGreaterThanOrEqual(before);
    });
  });

  // ===========================================================================
  // Tempo Tests
  // ===========================================================================

  describe('setDefaultTempo', () => {
    it('should set tempo within valid range', () => {
      useSettingsStore.getState().setDefaultTempo(120);
      expect(useSettingsStore.getState().defaultTempo).toBe(120);
    });

    it('should clamp tempo to minimum', () => {
      useSettingsStore.getState().setDefaultTempo(20);
      expect(useSettingsStore.getState().defaultTempo).toBe(40);
    });

    it('should clamp tempo to maximum', () => {
      useSettingsStore.getState().setDefaultTempo(300);
      expect(useSettingsStore.getState().defaultTempo).toBe(240);
    });

    it('should handle boundary values', () => {
      useSettingsStore.getState().setDefaultTempo(40);
      expect(useSettingsStore.getState().defaultTempo).toBe(40);

      useSettingsStore.getState().setDefaultTempo(240);
      expect(useSettingsStore.getState().defaultTempo).toBe(240);
    });
  });

  // ===========================================================================
  // Vocal Range Tests
  // ===========================================================================

  describe('setVocalRangePreset', () => {
    it('should set soprano preset', () => {
      useSettingsStore.getState().setVocalRangePreset('soprano');
      const vocalRange = useSettingsStore.getState().vocalRange;
      expect(vocalRange.preset).toBe('soprano');
      expect(vocalRange.lowNote).toBe('C4');
      expect(vocalRange.highNote).toBe('C6');
    });

    it('should set alto preset', () => {
      useSettingsStore.getState().setVocalRangePreset('alto');
      const vocalRange = useSettingsStore.getState().vocalRange;
      expect(vocalRange.preset).toBe('alto');
      expect(vocalRange.lowNote).toBe('F3');
      expect(vocalRange.highNote).toBe('F5');
    });

    it('should set tenor preset', () => {
      useSettingsStore.getState().setVocalRangePreset('tenor');
      const vocalRange = useSettingsStore.getState().vocalRange;
      expect(vocalRange.preset).toBe('tenor');
      expect(vocalRange.lowNote).toBe('C3');
      expect(vocalRange.highNote).toBe('C5');
    });

    it('should set bass preset', () => {
      useSettingsStore.getState().setVocalRangePreset('bass');
      const vocalRange = useSettingsStore.getState().vocalRange;
      expect(vocalRange.preset).toBe('bass');
      expect(vocalRange.lowNote).toBe('E2');
      expect(vocalRange.highNote).toBe('E4');
    });

    it('should keep current notes when setting custom', () => {
      useSettingsStore.getState().setVocalRangePreset('soprano');
      useSettingsStore.getState().setVocalRangePreset('custom');

      const vocalRange = useSettingsStore.getState().vocalRange;
      expect(vocalRange.preset).toBe('custom');
      expect(vocalRange.lowNote).toBe('C4');
      expect(vocalRange.highNote).toBe('C6');
    });
  });

  describe('setCustomVocalRange', () => {
    it('should set custom vocal range', () => {
      useSettingsStore.getState().setCustomVocalRange('A2', 'G5');
      const vocalRange = useSettingsStore.getState().vocalRange;
      expect(vocalRange.preset).toBe('custom');
      expect(vocalRange.lowNote).toBe('A2');
      expect(vocalRange.highNote).toBe('G5');
    });
  });

  // ===========================================================================
  // Metronome Tests
  // ===========================================================================

  describe('setMetronomeSound', () => {
    it('should set metronome sound to beep', () => {
      useSettingsStore.getState().setMetronomeSound('beep');
      expect(useSettingsStore.getState().metronomeSound).toBe('beep');
    });

    it('should set metronome sound to woodblock', () => {
      useSettingsStore.getState().setMetronomeSound('woodblock');
      expect(useSettingsStore.getState().metronomeSound).toBe('woodblock');
    });

    it('should set metronome sound to none', () => {
      useSettingsStore.getState().setMetronomeSound('none');
      expect(useSettingsStore.getState().metronomeSound).toBe('none');
    });
  });

  describe('setMetronomeVolume', () => {
    it('should set metronome volume within valid range', () => {
      useSettingsStore.getState().setMetronomeVolume(0.5);
      expect(useSettingsStore.getState().metronomeVolume).toBe(0.5);
    });

    it('should clamp volume to minimum', () => {
      useSettingsStore.getState().setMetronomeVolume(-0.5);
      expect(useSettingsStore.getState().metronomeVolume).toBe(0);
    });

    it('should clamp volume to maximum', () => {
      useSettingsStore.getState().setMetronomeVolume(1.5);
      expect(useSettingsStore.getState().metronomeVolume).toBe(1);
    });
  });

  // ===========================================================================
  // Behavior Settings Tests
  // ===========================================================================

  describe('toggleAutoAnalyzeOnPaste', () => {
    it('should toggle auto-analyze from true to false', () => {
      expect(useSettingsStore.getState().autoAnalyzeOnPaste).toBe(true);
      useSettingsStore.getState().toggleAutoAnalyzeOnPaste();
      expect(useSettingsStore.getState().autoAnalyzeOnPaste).toBe(false);
    });

    it('should toggle auto-analyze from false to true', () => {
      useSettingsStore.getState().setAutoAnalyzeOnPaste(false);
      useSettingsStore.getState().toggleAutoAnalyzeOnPaste();
      expect(useSettingsStore.getState().autoAnalyzeOnPaste).toBe(true);
    });
  });

  describe('setAutoAnalyzeOnPaste', () => {
    it('should set auto-analyze to false', () => {
      useSettingsStore.getState().setAutoAnalyzeOnPaste(false);
      expect(useSettingsStore.getState().autoAnalyzeOnPaste).toBe(false);
    });

    it('should set auto-analyze to true', () => {
      useSettingsStore.getState().setAutoAnalyzeOnPaste(false);
      useSettingsStore.getState().setAutoAnalyzeOnPaste(true);
      expect(useSettingsStore.getState().autoAnalyzeOnPaste).toBe(true);
    });
  });

  describe('toggleKeyboardShortcuts', () => {
    it('should toggle keyboard shortcuts from true to false', () => {
      expect(useSettingsStore.getState().keyboardShortcutsEnabled).toBe(true);
      useSettingsStore.getState().toggleKeyboardShortcuts();
      expect(useSettingsStore.getState().keyboardShortcutsEnabled).toBe(false);
    });

    it('should toggle keyboard shortcuts from false to true', () => {
      useSettingsStore.getState().setKeyboardShortcutsEnabled(false);
      useSettingsStore.getState().toggleKeyboardShortcuts();
      expect(useSettingsStore.getState().keyboardShortcutsEnabled).toBe(true);
    });
  });

  describe('setKeyboardShortcutsEnabled', () => {
    it('should set keyboard shortcuts to false', () => {
      useSettingsStore.getState().setKeyboardShortcutsEnabled(false);
      expect(useSettingsStore.getState().keyboardShortcutsEnabled).toBe(false);
    });

    it('should set keyboard shortcuts to true', () => {
      useSettingsStore.getState().setKeyboardShortcutsEnabled(false);
      useSettingsStore.getState().setKeyboardShortcutsEnabled(true);
      expect(useSettingsStore.getState().keyboardShortcutsEnabled).toBe(true);
    });
  });

  // ===========================================================================
  // Export/Import Tests
  // ===========================================================================

  describe('exportSettings', () => {
    it('should export settings as JSON string', () => {
      useSettingsStore.getState().setTheme('dark');
      useSettingsStore.getState().setDefaultTempo(120);

      const exported = useSettingsStore.getState().exportSettings();
      const parsed = JSON.parse(exported);

      expect(parsed.theme).toBe('dark');
      expect(parsed.defaultTempo).toBe(120);
      expect(parsed.exportedAt).toBeDefined();
    });

    it('should include all user-configurable settings', () => {
      const exported = useSettingsStore.getState().exportSettings();
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveProperty('theme');
      expect(parsed).toHaveProperty('defaultTempo');
      expect(parsed).toHaveProperty('vocalRange');
      expect(parsed).toHaveProperty('metronomeSound');
      expect(parsed).toHaveProperty('metronomeVolume');
      expect(parsed).toHaveProperty('autoAnalyzeOnPaste');
      expect(parsed).toHaveProperty('keyboardShortcutsEnabled');
      expect(parsed).toHaveProperty('settingsVersion');
    });
  });

  describe('importSettings', () => {
    it('should import valid settings JSON', () => {
      const settings = JSON.stringify({
        theme: 'dark',
        defaultTempo: 120,
        vocalRange: { preset: 'soprano', lowNote: 'C4', highNote: 'C6' },
        metronomeSound: 'beep',
        metronomeVolume: 0.5,
        autoAnalyzeOnPaste: false,
        keyboardShortcutsEnabled: false,
      });

      const result = useSettingsStore.getState().importSettings(settings);

      expect(result).toBe(true);
      expect(useSettingsStore.getState().theme).toBe('dark');
      expect(useSettingsStore.getState().defaultTempo).toBe(120);
      expect(useSettingsStore.getState().vocalRange.preset).toBe('soprano');
      expect(useSettingsStore.getState().metronomeSound).toBe('beep');
      expect(useSettingsStore.getState().metronomeVolume).toBe(0.5);
      expect(useSettingsStore.getState().autoAnalyzeOnPaste).toBe(false);
      expect(useSettingsStore.getState().keyboardShortcutsEnabled).toBe(false);
    });

    it('should return false for invalid JSON', () => {
      const result = useSettingsStore.getState().importSettings('not valid json');
      expect(result).toBe(false);
    });

    it('should return false for invalid settings structure', () => {
      const result = useSettingsStore.getState().importSettings(JSON.stringify({
        theme: 'invalid-theme',
      }));
      expect(result).toBe(false);
    });

    it('should handle partial settings import', () => {
      // Set initial state
      useSettingsStore.getState().setTheme('light');
      useSettingsStore.getState().setDefaultTempo(80);

      // Import only some settings
      const settings = JSON.stringify({
        theme: 'dark',
      });

      const result = useSettingsStore.getState().importSettings(settings);

      expect(result).toBe(true);
      expect(useSettingsStore.getState().theme).toBe('dark');
      // Other settings should remain unchanged
      expect(useSettingsStore.getState().defaultTempo).toBe(80);
    });

    it('should clamp imported tempo values', () => {
      const settings = JSON.stringify({
        defaultTempo: 500,
      });

      useSettingsStore.getState().importSettings(settings);
      expect(useSettingsStore.getState().defaultTempo).toBe(240);
    });

    it('should clamp imported metronome volume', () => {
      const settings = JSON.stringify({
        metronomeVolume: 2,
      });

      useSettingsStore.getState().importSettings(settings);
      expect(useSettingsStore.getState().metronomeVolume).toBe(1);
    });
  });

  // ===========================================================================
  // Reset Tests
  // ===========================================================================

  describe('resetToDefaults', () => {
    it('should reset all settings to defaults', () => {
      // Change all settings
      useSettingsStore.getState().setTheme('dark');
      useSettingsStore.getState().setDefaultTempo(150);
      useSettingsStore.getState().setVocalRangePreset('soprano');
      useSettingsStore.getState().setMetronomeSound('beep');
      useSettingsStore.getState().setMetronomeVolume(0.3);
      useSettingsStore.getState().setAutoAnalyzeOnPaste(false);
      useSettingsStore.getState().setKeyboardShortcutsEnabled(false);

      // Reset
      useSettingsStore.getState().resetToDefaults();

      // Verify defaults
      const state = useSettingsStore.getState();
      expect(state.theme).toBe('system');
      expect(state.defaultTempo).toBe(100);
      expect(state.vocalRange.preset).toBe('tenor');
      expect(state.metronomeSound).toBe('click');
      expect(state.metronomeVolume).toBe(0.7);
      expect(state.autoAnalyzeOnPaste).toBe(true);
      expect(state.keyboardShortcutsEnabled).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset store to initial state', () => {
      useSettingsStore.getState().setTheme('dark');
      useSettingsStore.getState().reset();
      expect(useSettingsStore.getState().theme).toBe('system');
    });
  });

  // ===========================================================================
  // Selector Tests
  // ===========================================================================

  describe('selectors', () => {
    describe('selectTheme', () => {
      it('should return the current theme', () => {
        useSettingsStore.getState().setTheme('dark');
        expect(selectTheme(useSettingsStore.getState())).toBe('dark');
      });
    });

    describe('selectDefaultTempo', () => {
      it('should return the default tempo', () => {
        useSettingsStore.getState().setDefaultTempo(120);
        expect(selectDefaultTempo(useSettingsStore.getState())).toBe(120);
      });
    });

    describe('selectVocalRange', () => {
      it('should return the vocal range config', () => {
        useSettingsStore.getState().setVocalRangePreset('soprano');
        const range = selectVocalRange(useSettingsStore.getState());
        expect(range.preset).toBe('soprano');
        expect(range.lowNote).toBe('C4');
        expect(range.highNote).toBe('C6');
      });
    });

    describe('selectVocalRangePreset', () => {
      it('should return the vocal range preset', () => {
        useSettingsStore.getState().setVocalRangePreset('bass');
        expect(selectVocalRangePreset(useSettingsStore.getState())).toBe('bass');
      });
    });

    describe('selectMetronomeSound', () => {
      it('should return the metronome sound', () => {
        useSettingsStore.getState().setMetronomeSound('woodblock');
        expect(selectMetronomeSound(useSettingsStore.getState())).toBe('woodblock');
      });
    });

    describe('selectMetronomeVolume', () => {
      it('should return the metronome volume', () => {
        useSettingsStore.getState().setMetronomeVolume(0.5);
        expect(selectMetronomeVolume(useSettingsStore.getState())).toBe(0.5);
      });
    });

    describe('selectAutoAnalyzeOnPaste', () => {
      it('should return auto-analyze setting', () => {
        expect(selectAutoAnalyzeOnPaste(useSettingsStore.getState())).toBe(true);
        useSettingsStore.getState().setAutoAnalyzeOnPaste(false);
        expect(selectAutoAnalyzeOnPaste(useSettingsStore.getState())).toBe(false);
      });
    });

    describe('selectKeyboardShortcutsEnabled', () => {
      it('should return keyboard shortcuts setting', () => {
        expect(selectKeyboardShortcutsEnabled(useSettingsStore.getState())).toBe(true);
        useSettingsStore.getState().setKeyboardShortcutsEnabled(false);
        expect(selectKeyboardShortcutsEnabled(useSettingsStore.getState())).toBe(false);
      });
    });

    describe('selectLastModified', () => {
      it('should return last modified timestamp', () => {
        const timestamp = selectLastModified(useSettingsStore.getState());
        expect(typeof timestamp).toBe('number');
        expect(timestamp).toBeGreaterThan(0);
      });
    });

    describe('selectIsDarkTheme', () => {
      it('should return true for dark theme', () => {
        useSettingsStore.getState().setTheme('dark');
        expect(selectIsDarkTheme(useSettingsStore.getState())).toBe(true);
      });

      it('should return false for light theme', () => {
        useSettingsStore.getState().setTheme('light');
        expect(selectIsDarkTheme(useSettingsStore.getState())).toBe(false);
      });

      it('should check system preference for system theme', () => {
        prefersDarkMode = true;
        useSettingsStore.getState().setTheme('system');
        expect(selectIsDarkTheme(useSettingsStore.getState())).toBe(true);

        prefersDarkMode = false;
        mockMatchMedia.mockImplementation((query: string) => ({
          matches: query === '(prefers-color-scheme: dark)' ? prefersDarkMode : !prefersDarkMode,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }));
        expect(selectIsDarkTheme(useSettingsStore.getState())).toBe(false);
      });
    });

    describe('selectThemeLabel', () => {
      it('should return "Light" for light theme', () => {
        useSettingsStore.getState().setTheme('light');
        expect(selectThemeLabel(useSettingsStore.getState())).toBe('Light');
      });

      it('should return "Dark" for dark theme', () => {
        useSettingsStore.getState().setTheme('dark');
        expect(selectThemeLabel(useSettingsStore.getState())).toBe('Dark');
      });

      it('should return "System" for system theme', () => {
        useSettingsStore.getState().setTheme('system');
        expect(selectThemeLabel(useSettingsStore.getState())).toBe('System');
      });
    });

    describe('selectVocalRangeLabel', () => {
      it('should return preset description for named presets', () => {
        useSettingsStore.getState().setVocalRangePreset('soprano');
        expect(selectVocalRangeLabel(useSettingsStore.getState())).toBe('Soprano (C4-C6)');

        useSettingsStore.getState().setVocalRangePreset('bass');
        expect(selectVocalRangeLabel(useSettingsStore.getState())).toBe('Bass (E2-E4)');
      });

      it('should return custom range for custom preset', () => {
        useSettingsStore.getState().setCustomVocalRange('A2', 'G5');
        expect(selectVocalRangeLabel(useSettingsStore.getState())).toBe('Custom (A2-G5)');
      });
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('edge cases', () => {
    it('should handle rapid setting changes', () => {
      useSettingsStore.getState().setTheme('light');
      useSettingsStore.getState().setTheme('dark');
      useSettingsStore.getState().setTheme('system');
      useSettingsStore.getState().setTheme('light');

      expect(useSettingsStore.getState().theme).toBe('light');
    });

    it('should handle setting same value multiple times', () => {
      useSettingsStore.getState().setDefaultTempo(100);
      useSettingsStore.getState().setDefaultTempo(100);
      useSettingsStore.getState().setDefaultTempo(100);

      expect(useSettingsStore.getState().defaultTempo).toBe(100);
    });

    it('should handle export/import round-trip', () => {
      // Set up some non-default values
      useSettingsStore.getState().setTheme('dark');
      useSettingsStore.getState().setDefaultTempo(150);
      useSettingsStore.getState().setVocalRangePreset('soprano');
      useSettingsStore.getState().setAutoAnalyzeOnPaste(false);

      // Export
      const exported = useSettingsStore.getState().exportSettings();

      // Reset to defaults
      useSettingsStore.getState().resetToDefaults();

      // Import
      useSettingsStore.getState().importSettings(exported);

      // Verify values were restored
      expect(useSettingsStore.getState().theme).toBe('dark');
      expect(useSettingsStore.getState().defaultTempo).toBe(150);
      expect(useSettingsStore.getState().vocalRange.preset).toBe('soprano');
      expect(useSettingsStore.getState().autoAnalyzeOnPaste).toBe(false);
    });
  });

  // ===========================================================================
  // Integration Tests
  // ===========================================================================

  describe('integration', () => {
    it('should maintain consistency across all operations', () => {
      // Start with defaults
      expect(useSettingsStore.getState().theme).toBe('system');

      // Change settings
      useSettingsStore.getState().setTheme('dark');
      useSettingsStore.getState().setDefaultTempo(120);
      useSettingsStore.getState().setVocalRangePreset('alto');
      useSettingsStore.getState().toggleAutoAnalyzeOnPaste();

      // Verify
      expect(useSettingsStore.getState().theme).toBe('dark');
      expect(useSettingsStore.getState().defaultTempo).toBe(120);
      expect(useSettingsStore.getState().vocalRange.preset).toBe('alto');
      expect(useSettingsStore.getState().autoAnalyzeOnPaste).toBe(false);

      // Export and verify
      const exported = useSettingsStore.getState().exportSettings();
      const parsed = JSON.parse(exported);
      expect(parsed.theme).toBe('dark');

      // Reset and verify
      useSettingsStore.getState().resetToDefaults();
      expect(useSettingsStore.getState().theme).toBe('system');
      expect(useSettingsStore.getState().autoAnalyzeOnPaste).toBe(true);
    });

    it('should work correctly with all selectors', () => {
      useSettingsStore.getState().setTheme('light');
      useSettingsStore.getState().setDefaultTempo(90);
      useSettingsStore.getState().setVocalRangePreset('bass');
      useSettingsStore.getState().setMetronomeSound('woodblock');
      useSettingsStore.getState().setMetronomeVolume(0.3);

      const state = useSettingsStore.getState();

      expect(selectTheme(state)).toBe('light');
      expect(selectDefaultTempo(state)).toBe(90);
      expect(selectVocalRangePreset(state)).toBe('bass');
      expect(selectMetronomeSound(state)).toBe('woodblock');
      expect(selectMetronomeVolume(state)).toBe(0.3);
      expect(selectThemeLabel(state)).toBe('Light');
      expect(selectVocalRangeLabel(state)).toBe('Bass (E2-E4)');
    });
  });
});
