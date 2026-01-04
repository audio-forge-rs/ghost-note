/**
 * Tests for useThemeStore
 *
 * Comprehensive tests for theme management including:
 * - Theme preference setting
 * - System preference detection
 * - Theme persistence
 * - Theme transitions
 * - Selectors
 *
 * @module stores/useThemeStore.test
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  useThemeStore,
  selectIsDarkMode,
  selectIsLightMode,
  selectIsSystemTheme,
  selectThemePreference,
  selectResolvedTheme,
  selectTransitionsEnabled,
  selectThemeLabel,
} from './useThemeStore';

// =============================================================================
// Mocks
// =============================================================================

// Track matchMedia calls and listeners
let matchMediaListeners: ((e: { matches: boolean }) => void)[] = [];
let prefersDarkMode = true;

const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: query === '(prefers-color-scheme: dark)' ? prefersDarkMode : !prefersDarkMode,
  media: query,
  onchange: null,
  addListener: vi.fn((cb) => matchMediaListeners.push(cb)),
  removeListener: vi.fn(),
  addEventListener: vi.fn((_event: string, cb: (e: { matches: boolean }) => void) => matchMediaListeners.push(cb)),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Mock document.documentElement
const mockClassList = {
  add: vi.fn(),
  remove: vi.fn(),
  contains: vi.fn(),
};

const mockStyle = {
  setProperty: vi.fn(),
  colorScheme: '',
};

vi.stubGlobal('matchMedia', mockMatchMedia);

// Simulate document
const originalDocument = global.document;
beforeEach(() => {
  Object.defineProperty(global, 'document', {
    value: {
      documentElement: {
        classList: mockClassList,
        style: mockStyle,
      },
    },
    writable: true,
  });
});

afterEach(() => {
  Object.defineProperty(global, 'document', {
    value: originalDocument,
    writable: true,
  });
});

// =============================================================================
// Test Suite
// =============================================================================

describe('useThemeStore', () => {
  beforeEach(() => {
    // Reset store state
    useThemeStore.getState().reset();

    // Reset mocks
    vi.clearAllMocks();
    matchMediaListeners = [];
    prefersDarkMode = true;

    // Clear localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('ghost-note-theme-store');
    }

    // Reset mock classList and style
    mockClassList.add.mockClear();
    mockClassList.remove.mockClear();
    mockStyle.setProperty.mockClear();
  });

  // ===========================================================================
  // Initial State Tests
  // ===========================================================================

  describe('initial state', () => {
    it('should have system as default theme', () => {
      const state = useThemeStore.getState();
      expect(state.theme).toBe('system');
    });

    it('should resolve to system preference', () => {
      const state = useThemeStore.getState();
      // With prefersDarkMode = true, system should resolve to dark
      expect(state.resolvedTheme).toBe('dark');
    });

    it('should have transitions enabled by default', () => {
      const state = useThemeStore.getState();
      expect(state.transitionsEnabled).toBe(true);
    });
  });

  // ===========================================================================
  // setTheme Tests
  // ===========================================================================

  describe('setTheme', () => {
    it('should set theme to light', () => {
      useThemeStore.getState().setTheme('light');

      const state = useThemeStore.getState();
      expect(state.theme).toBe('light');
      expect(state.resolvedTheme).toBe('light');
    });

    it('should set theme to dark', () => {
      useThemeStore.getState().setTheme('dark');

      const state = useThemeStore.getState();
      expect(state.theme).toBe('dark');
      expect(state.resolvedTheme).toBe('dark');
    });

    it('should set theme to system and resolve based on preference', () => {
      prefersDarkMode = false;
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)' ? prefersDarkMode : !prefersDarkMode,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      useThemeStore.getState().setTheme('system');

      const state = useThemeStore.getState();
      expect(state.theme).toBe('system');
      expect(state.resolvedTheme).toBe('light');
    });

    it('should apply theme class to document', () => {
      useThemeStore.getState().setTheme('light');

      expect(mockClassList.remove).toHaveBeenCalledWith('light', 'dark');
      expect(mockClassList.add).toHaveBeenCalledWith('light');
    });

    it('should update color-scheme style property', () => {
      useThemeStore.getState().setTheme('dark');

      expect(mockStyle.colorScheme).toBe('dark');
    });
  });

  // ===========================================================================
  // toggleTheme Tests
  // ===========================================================================

  describe('toggleTheme', () => {
    it('should toggle from dark to light', () => {
      useThemeStore.getState().setTheme('dark');
      useThemeStore.getState().toggleTheme();

      const state = useThemeStore.getState();
      expect(state.theme).toBe('light');
      expect(state.resolvedTheme).toBe('light');
    });

    it('should toggle from light to dark', () => {
      useThemeStore.getState().setTheme('light');
      useThemeStore.getState().toggleTheme();

      const state = useThemeStore.getState();
      expect(state.theme).toBe('dark');
      expect(state.resolvedTheme).toBe('dark');
    });

    it('should toggle from system to opposite of resolved', () => {
      // System resolves to dark (prefersDarkMode = true)
      useThemeStore.getState().setTheme('system');
      useThemeStore.getState().toggleTheme();

      const state = useThemeStore.getState();
      expect(state.theme).toBe('light');
      expect(state.resolvedTheme).toBe('light');
    });
  });

  // ===========================================================================
  // cycleTheme Tests
  // ===========================================================================

  describe('cycleTheme', () => {
    it('should cycle from light to dark', () => {
      useThemeStore.getState().setTheme('light');
      useThemeStore.getState().cycleTheme();

      expect(useThemeStore.getState().theme).toBe('dark');
    });

    it('should cycle from dark to system', () => {
      useThemeStore.getState().setTheme('dark');
      useThemeStore.getState().cycleTheme();

      expect(useThemeStore.getState().theme).toBe('system');
    });

    it('should cycle from system to light', () => {
      useThemeStore.getState().setTheme('system');
      useThemeStore.getState().cycleTheme();

      expect(useThemeStore.getState().theme).toBe('light');
    });

    it('should complete full cycle: light -> dark -> system -> light', () => {
      useThemeStore.getState().setTheme('light');

      useThemeStore.getState().cycleTheme();
      expect(useThemeStore.getState().theme).toBe('dark');

      useThemeStore.getState().cycleTheme();
      expect(useThemeStore.getState().theme).toBe('system');

      useThemeStore.getState().cycleTheme();
      expect(useThemeStore.getState().theme).toBe('light');
    });
  });

  // ===========================================================================
  // updateResolvedTheme Tests
  // ===========================================================================

  describe('updateResolvedTheme', () => {
    it('should update resolved theme when using system preference', () => {
      useThemeStore.getState().setTheme('system');

      // Simulate system preference change
      prefersDarkMode = false;
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)' ? prefersDarkMode : !prefersDarkMode,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      useThemeStore.getState().updateResolvedTheme();

      expect(useThemeStore.getState().resolvedTheme).toBe('light');
    });

    it('should not update when theme is explicitly set to light', () => {
      useThemeStore.getState().setTheme('light');
      useThemeStore.getState().updateResolvedTheme();

      // Should remain light regardless of system preference
      expect(useThemeStore.getState().resolvedTheme).toBe('light');
    });

    it('should not update when theme is explicitly set to dark', () => {
      prefersDarkMode = false;
      useThemeStore.getState().setTheme('dark');
      useThemeStore.getState().updateResolvedTheme();

      // Should remain dark regardless of system preference
      expect(useThemeStore.getState().resolvedTheme).toBe('dark');
    });
  });

  // ===========================================================================
  // Transitions Tests
  // ===========================================================================

  describe('transitions', () => {
    it('should enable transitions by default', () => {
      expect(useThemeStore.getState().transitionsEnabled).toBe(true);
    });

    it('should allow disabling transitions', () => {
      useThemeStore.getState().setTransitionsEnabled(false);
      expect(useThemeStore.getState().transitionsEnabled).toBe(false);
    });

    it('should allow enabling transitions', () => {
      useThemeStore.getState().setTransitionsEnabled(false);
      useThemeStore.getState().setTransitionsEnabled(true);
      expect(useThemeStore.getState().transitionsEnabled).toBe(true);
    });

    it('should set transition duration to 0 when disabled', () => {
      useThemeStore.getState().setTransitionsEnabled(false);
      useThemeStore.getState().setTheme('light');

      expect(mockStyle.setProperty).toHaveBeenCalledWith('--theme-transition-duration', '0ms');
    });
  });

  // ===========================================================================
  // reset Tests
  // ===========================================================================

  describe('reset', () => {
    it('should reset to initial state', () => {
      // Change state
      useThemeStore.getState().setTheme('light');
      useThemeStore.getState().setTransitionsEnabled(false);

      // Reset
      useThemeStore.getState().reset();

      const state = useThemeStore.getState();
      expect(state.theme).toBe('system');
      expect(state.transitionsEnabled).toBe(true);
    });

    it('should apply default theme to document on reset', () => {
      useThemeStore.getState().setTheme('light');
      mockClassList.add.mockClear();
      mockClassList.remove.mockClear();

      useThemeStore.getState().reset();

      expect(mockClassList.remove).toHaveBeenCalledWith('light', 'dark');
      expect(mockClassList.add).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Selector Tests
  // ===========================================================================

  describe('selectors', () => {
    describe('selectIsDarkMode', () => {
      it('should return true when dark mode is active', () => {
        useThemeStore.getState().setTheme('dark');
        expect(selectIsDarkMode(useThemeStore.getState())).toBe(true);
      });

      it('should return false when light mode is active', () => {
        useThemeStore.getState().setTheme('light');
        expect(selectIsDarkMode(useThemeStore.getState())).toBe(false);
      });
    });

    describe('selectIsLightMode', () => {
      it('should return true when light mode is active', () => {
        useThemeStore.getState().setTheme('light');
        expect(selectIsLightMode(useThemeStore.getState())).toBe(true);
      });

      it('should return false when dark mode is active', () => {
        useThemeStore.getState().setTheme('dark');
        expect(selectIsLightMode(useThemeStore.getState())).toBe(false);
      });
    });

    describe('selectIsSystemTheme', () => {
      it('should return true when system theme is selected', () => {
        useThemeStore.getState().setTheme('system');
        expect(selectIsSystemTheme(useThemeStore.getState())).toBe(true);
      });

      it('should return false when explicit theme is selected', () => {
        useThemeStore.getState().setTheme('dark');
        expect(selectIsSystemTheme(useThemeStore.getState())).toBe(false);
      });
    });

    describe('selectThemePreference', () => {
      it('should return the user theme preference', () => {
        useThemeStore.getState().setTheme('light');
        expect(selectThemePreference(useThemeStore.getState())).toBe('light');

        useThemeStore.getState().setTheme('dark');
        expect(selectThemePreference(useThemeStore.getState())).toBe('dark');

        useThemeStore.getState().setTheme('system');
        expect(selectThemePreference(useThemeStore.getState())).toBe('system');
      });
    });

    describe('selectResolvedTheme', () => {
      it('should return the resolved theme', () => {
        useThemeStore.getState().setTheme('light');
        expect(selectResolvedTheme(useThemeStore.getState())).toBe('light');

        useThemeStore.getState().setTheme('dark');
        expect(selectResolvedTheme(useThemeStore.getState())).toBe('dark');
      });
    });

    describe('selectTransitionsEnabled', () => {
      it('should return transitions enabled state', () => {
        expect(selectTransitionsEnabled(useThemeStore.getState())).toBe(true);

        useThemeStore.getState().setTransitionsEnabled(false);
        expect(selectTransitionsEnabled(useThemeStore.getState())).toBe(false);
      });
    });

    describe('selectThemeLabel', () => {
      it('should return "Light" for light theme', () => {
        useThemeStore.getState().setTheme('light');
        expect(selectThemeLabel(useThemeStore.getState())).toBe('Light');
      });

      it('should return "Dark" for dark theme', () => {
        useThemeStore.getState().setTheme('dark');
        expect(selectThemeLabel(useThemeStore.getState())).toBe('Dark');
      });

      it('should return "System (Dark)" when system resolves to dark', () => {
        prefersDarkMode = true;
        mockMatchMedia.mockImplementation((query: string) => ({
          matches: query === '(prefers-color-scheme: dark)' ? prefersDarkMode : !prefersDarkMode,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }));

        useThemeStore.getState().setTheme('system');
        expect(selectThemeLabel(useThemeStore.getState())).toBe('System (Dark)');
      });

      it('should return "System (Light)" when system resolves to light', () => {
        prefersDarkMode = false;
        mockMatchMedia.mockImplementation((query: string) => ({
          matches: query === '(prefers-color-scheme: dark)' ? prefersDarkMode : !prefersDarkMode,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }));

        useThemeStore.getState().setTheme('system');
        expect(selectThemeLabel(useThemeStore.getState())).toBe('System (Light)');
      });
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('edge cases', () => {
    it('should handle rapid theme changes', () => {
      useThemeStore.getState().setTheme('light');
      useThemeStore.getState().setTheme('dark');
      useThemeStore.getState().setTheme('system');
      useThemeStore.getState().setTheme('light');

      expect(useThemeStore.getState().theme).toBe('light');
      expect(useThemeStore.getState().resolvedTheme).toBe('light');
    });

    it('should handle setting same theme multiple times', () => {
      useThemeStore.getState().setTheme('dark');
      useThemeStore.getState().setTheme('dark');
      useThemeStore.getState().setTheme('dark');

      expect(useThemeStore.getState().theme).toBe('dark');
    });

    it('should maintain resolved theme after toggle', () => {
      useThemeStore.getState().setTheme('dark');
      const beforeToggle = useThemeStore.getState().resolvedTheme;

      useThemeStore.getState().toggleTheme();
      const afterToggle = useThemeStore.getState().resolvedTheme;

      expect(beforeToggle).toBe('dark');
      expect(afterToggle).toBe('light');
    });
  });

  // ===========================================================================
  // Integration Tests
  // ===========================================================================

  describe('integration', () => {
    it('should maintain consistency between theme and resolvedTheme', () => {
      // Light theme
      useThemeStore.getState().setTheme('light');
      expect(useThemeStore.getState().theme).toBe('light');
      expect(useThemeStore.getState().resolvedTheme).toBe('light');

      // Dark theme
      useThemeStore.getState().setTheme('dark');
      expect(useThemeStore.getState().theme).toBe('dark');
      expect(useThemeStore.getState().resolvedTheme).toBe('dark');

      // System theme (with dark preference)
      prefersDarkMode = true;
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)' ? prefersDarkMode : !prefersDarkMode,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));
      useThemeStore.getState().setTheme('system');
      expect(useThemeStore.getState().theme).toBe('system');
      expect(useThemeStore.getState().resolvedTheme).toBe('dark');
    });

    it('should work correctly with all actions in sequence', () => {
      // Start with system
      expect(useThemeStore.getState().theme).toBe('system');

      // Cycle through themes
      useThemeStore.getState().cycleTheme(); // system -> light
      expect(useThemeStore.getState().theme).toBe('light');

      useThemeStore.getState().cycleTheme(); // light -> dark
      expect(useThemeStore.getState().theme).toBe('dark');

      // Toggle
      useThemeStore.getState().toggleTheme(); // dark -> light
      expect(useThemeStore.getState().theme).toBe('light');

      // Direct set
      useThemeStore.getState().setTheme('dark');
      expect(useThemeStore.getState().theme).toBe('dark');

      // Reset
      useThemeStore.getState().reset();
      expect(useThemeStore.getState().theme).toBe('system');
    });
  });
});
