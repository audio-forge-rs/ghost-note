/**
 * Ghost Note - Theme Store
 *
 * Dedicated store for managing application theme (dark/light/system).
 * Features:
 * - Light, dark, and system preference detection
 * - Persistence of user choice to localStorage
 * - Smooth transitions between themes
 * - System preference change listener
 *
 * @module stores/useThemeStore
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// =============================================================================
// Types
// =============================================================================

/**
 * Theme options available to the user
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * The actual resolved theme (what's displayed)
 */
export type ResolvedTheme = 'light' | 'dark';

/**
 * Theme state
 */
export interface ThemeState {
  /** User's selected theme preference */
  theme: Theme;
  /** Resolved theme after considering system preference */
  resolvedTheme: ResolvedTheme;
  /** Whether theme transitions are enabled */
  transitionsEnabled: boolean;
}

/**
 * Theme actions
 */
export interface ThemeActions {
  /** Set the theme preference */
  setTheme: (theme: Theme) => void;
  /** Toggle between light and dark (skipping system) */
  toggleTheme: () => void;
  /** Cycle through all themes: light -> dark -> system -> light */
  cycleTheme: () => void;
  /** Update resolved theme based on system preference */
  updateResolvedTheme: () => void;
  /** Enable or disable theme transitions */
  setTransitionsEnabled: (enabled: boolean) => void;
  /** Reset to default state */
  reset: () => void;
}

export type ThemeStore = ThemeState & ThemeActions;

// =============================================================================
// Constants
// =============================================================================

const TRANSITION_DURATION_MS = 200;
const STORAGE_KEY = 'ghost-note-theme-store';

// =============================================================================
// Initial State
// =============================================================================

const initialState: ThemeState = {
  theme: 'system',
  resolvedTheme: 'dark', // Default to dark until we detect system preference
  transitionsEnabled: true,
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get the system's preferred color scheme
 */
function getSystemPreference(): ResolvedTheme {
  if (typeof window !== 'undefined' && window.matchMedia) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    return prefersDark.matches ? 'dark' : 'light';
  }
  return 'dark'; // Default to dark if we can't detect
}

/**
 * Get the resolved theme based on user preference and system preference
 */
function getResolvedTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    return getSystemPreference();
  }
  return theme;
}

/**
 * Apply theme to the document
 */
function applyThemeToDocument(resolvedTheme: ResolvedTheme, transitionsEnabled: boolean): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Temporarily disable transitions if requested
  if (!transitionsEnabled) {
    root.style.setProperty('--theme-transition-duration', '0ms');
  }

  // Remove existing theme classes and add new one
  root.classList.remove('light', 'dark');
  root.classList.add(resolvedTheme);

  // Update color-scheme property for native elements
  root.style.colorScheme = resolvedTheme;

  // Re-enable transitions after a frame if they were disabled
  if (!transitionsEnabled) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.style.setProperty('--theme-transition-duration', `${TRANSITION_DURATION_MS}ms`);
      });
    });
  }

  console.log('[ThemeStore] Applied theme to document:', resolvedTheme);
}

// =============================================================================
// Store Implementation
// =============================================================================

export const useThemeStore = create<ThemeStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        ...initialState,

        // Actions
        setTheme: (theme: Theme) => {
          console.log('[ThemeStore] Setting theme:', theme);
          const resolvedTheme = getResolvedTheme(theme);
          const { transitionsEnabled } = get();

          applyThemeToDocument(resolvedTheme, transitionsEnabled);

          set(
            {
              theme,
              resolvedTheme,
            },
            false,
            'setTheme'
          );
        },

        toggleTheme: () => {
          const { resolvedTheme, transitionsEnabled } = get();
          const newTheme: Theme = resolvedTheme === 'dark' ? 'light' : 'dark';
          console.log('[ThemeStore] Toggling theme:', { from: resolvedTheme, to: newTheme });

          applyThemeToDocument(newTheme, transitionsEnabled);

          set(
            {
              theme: newTheme,
              resolvedTheme: newTheme,
            },
            false,
            'toggleTheme'
          );
        },

        cycleTheme: () => {
          const { theme, transitionsEnabled } = get();
          // Cycle: light -> dark -> system -> light
          const nextTheme: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
          const resolvedTheme = getResolvedTheme(nextTheme);
          console.log('[ThemeStore] Cycling theme:', { from: theme, to: nextTheme, resolved: resolvedTheme });

          applyThemeToDocument(resolvedTheme, transitionsEnabled);

          set(
            {
              theme: nextTheme,
              resolvedTheme,
            },
            false,
            'cycleTheme'
          );
        },

        updateResolvedTheme: () => {
          const { theme, resolvedTheme: currentResolved, transitionsEnabled } = get();

          // Only update if using system theme
          if (theme !== 'system') return;

          const newResolved = getResolvedTheme(theme);

          if (newResolved !== currentResolved) {
            console.log('[ThemeStore] System preference changed:', { from: currentResolved, to: newResolved });
            applyThemeToDocument(newResolved, transitionsEnabled);

            set(
              {
                resolvedTheme: newResolved,
              },
              false,
              'updateResolvedTheme'
            );
          }
        },

        setTransitionsEnabled: (enabled: boolean) => {
          console.log('[ThemeStore] Setting transitions enabled:', enabled);
          set(
            {
              transitionsEnabled: enabled,
            },
            false,
            'setTransitionsEnabled'
          );
        },

        reset: () => {
          console.log('[ThemeStore] Resetting store');
          const resolvedTheme = getResolvedTheme(initialState.theme);
          applyThemeToDocument(resolvedTheme, initialState.transitionsEnabled);

          set(
            {
              ...initialState,
              resolvedTheme,
            },
            false,
            'reset'
          );
        },
      }),
      {
        name: STORAGE_KEY,
        partialize: (state) => ({
          theme: state.theme,
          transitionsEnabled: state.transitionsEnabled,
        }),
        onRehydrateStorage: () => (state) => {
          // After rehydration, resolve and apply the theme
          if (state) {
            const resolvedTheme = getResolvedTheme(state.theme);
            state.resolvedTheme = resolvedTheme;

            // Apply theme to document immediately (without transition on initial load)
            applyThemeToDocument(resolvedTheme, false);
            console.log('[ThemeStore] Rehydrated with theme:', state.theme, '-> resolved:', resolvedTheme);
          }
        },
      }
    ),
    { name: 'ThemeStore' }
  )
);

// =============================================================================
// System Theme Change Listener
// =============================================================================

// Set up listener for system theme preference changes
if (typeof window !== 'undefined' && window.matchMedia) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleChange = () => {
    const state = useThemeStore.getState();
    if (state.theme === 'system') {
      state.updateResolvedTheme();
    }
  };

  // Use addEventListener if available (modern browsers)
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleChange);
  } else {
    // Fallback for older browsers
    mediaQuery.addListener(handleChange);
  }
}

// =============================================================================
// Selectors
// =============================================================================

/**
 * Check if dark mode is active
 */
export const selectIsDarkMode = (state: ThemeStore): boolean => {
  return state.resolvedTheme === 'dark';
};

/**
 * Check if light mode is active
 */
export const selectIsLightMode = (state: ThemeStore): boolean => {
  return state.resolvedTheme === 'light';
};

/**
 * Check if using system theme preference
 */
export const selectIsSystemTheme = (state: ThemeStore): boolean => {
  return state.theme === 'system';
};

/**
 * Get the current theme preference (not resolved)
 */
export const selectThemePreference = (state: ThemeStore): Theme => {
  return state.theme;
};

/**
 * Get the resolved theme (what's actually displayed)
 */
export const selectResolvedTheme = (state: ThemeStore): ResolvedTheme => {
  return state.resolvedTheme;
};

/**
 * Check if transitions are enabled
 */
export const selectTransitionsEnabled = (state: ThemeStore): boolean => {
  return state.transitionsEnabled;
};

/**
 * Get theme label for display
 */
export const selectThemeLabel = (state: ThemeStore): string => {
  switch (state.theme) {
    case 'light':
      return 'Light';
    case 'dark':
      return 'Dark';
    case 'system':
      return `System (${state.resolvedTheme === 'dark' ? 'Dark' : 'Light'})`;
  }
};
