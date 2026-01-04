/**
 * Ghost Note - UI Store
 *
 * Manages theme, panel visibility, modals, and notifications.
 *
 * @module stores/useUIStore
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { UIStore, UIState, Theme, ModalType, PanelId, PanelVisibility } from './types';

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_PANELS: PanelVisibility = {
  'poem-input': true,
  analysis: true,
  'lyric-editor': true,
  'melody-player': true,
  'recording-studio': true,
};

// =============================================================================
// Initial State
// =============================================================================

const initialState: UIState = {
  theme: 'system',
  resolvedTheme: 'light',
  openModal: 'none',
  panels: DEFAULT_PANELS,
  sidebarCollapsed: false,
  notificationsEnabled: true,
  notification: null,
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get the resolved theme based on system preference
 */
function getResolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    // Check system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
  return theme;
}

// =============================================================================
// Store Implementation
// =============================================================================

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        ...initialState,

        // Actions
        setTheme: (theme: Theme) => {
          console.log('[UIStore] Setting theme:', theme);
          const resolvedTheme = getResolvedTheme(theme);

          // Update document class for CSS
          if (typeof document !== 'undefined') {
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(resolvedTheme);
          }

          set(
            {
              theme,
              resolvedTheme,
            },
            false,
            'setTheme'
          );
        },

        updateResolvedTheme: () => {
          const state = get();
          const resolvedTheme = getResolvedTheme(state.theme);

          if (resolvedTheme !== state.resolvedTheme) {
            console.log('[UIStore] Updating resolved theme:', resolvedTheme);

            // Update document class for CSS
            if (typeof document !== 'undefined') {
              document.documentElement.classList.remove('light', 'dark');
              document.documentElement.classList.add(resolvedTheme);
            }

            set(
              {
                resolvedTheme,
              },
              false,
              'updateResolvedTheme'
            );
          }
        },

        openModalDialog: (modal: ModalType) => {
          console.log('[UIStore] Opening modal:', modal);
          set(
            {
              openModal: modal,
            },
            false,
            'openModalDialog'
          );
        },

        closeModal: () => {
          console.log('[UIStore] Closing modal');
          set(
            {
              openModal: 'none',
            },
            false,
            'closeModal'
          );
        },

        togglePanel: (panelId: PanelId) => {
          console.log('[UIStore] Toggling panel:', panelId);
          set(
            (state) => ({
              panels: {
                ...state.panels,
                [panelId]: !state.panels[panelId],
              },
            }),
            false,
            'togglePanel'
          );
        },

        setPanelVisible: (panelId: PanelId, visible: boolean) => {
          console.log('[UIStore] Setting panel visibility:', panelId, visible);
          set(
            (state) => ({
              panels: {
                ...state.panels,
                [panelId]: visible,
              },
            }),
            false,
            'setPanelVisible'
          );
        },

        toggleSidebar: () => {
          console.log('[UIStore] Toggling sidebar');
          set(
            (state) => ({
              sidebarCollapsed: !state.sidebarCollapsed,
            }),
            false,
            'toggleSidebar'
          );
        },

        showNotification: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
          const state = get();
          if (!state.notificationsEnabled) {
            console.log('[UIStore] Notifications disabled, skipping:', message);
            return;
          }

          console.log('[UIStore] Showing notification:', type, message);
          set(
            {
              notification: { message, type },
            },
            false,
            'showNotification'
          );

          // Auto-clear after 5 seconds
          setTimeout(() => {
            const currentState = get();
            if (currentState.notification?.message === message) {
              get().clearNotification();
            }
          }, 5000);
        },

        clearNotification: () => {
          console.log('[UIStore] Clearing notification');
          set(
            {
              notification: null,
            },
            false,
            'clearNotification'
          );
        },

        toggleNotifications: () => {
          console.log('[UIStore] Toggling notifications');
          set(
            (state) => ({
              notificationsEnabled: !state.notificationsEnabled,
            }),
            false,
            'toggleNotifications'
          );
        },

        reset: () => {
          console.log('[UIStore] Resetting store');
          set(initialState, false, 'reset');
        },
      }),
      {
        name: 'ghost-note-ui-store',
        partialize: (state) => ({
          theme: state.theme,
          panels: state.panels,
          sidebarCollapsed: state.sidebarCollapsed,
          notificationsEnabled: state.notificationsEnabled,
        }),
        onRehydrateStorage: () => (state) => {
          // After rehydration, update resolved theme
          if (state) {
            const resolvedTheme = getResolvedTheme(state.theme);
            state.resolvedTheme = resolvedTheme;

            // Apply theme to document
            if (typeof document !== 'undefined') {
              document.documentElement.classList.remove('light', 'dark');
              document.documentElement.classList.add(resolvedTheme);
            }
          }
        },
      }
    ),
    { name: 'UIStore' }
  )
);

// =============================================================================
// System Theme Change Listener
// =============================================================================

// Set up listener for system theme changes
if (typeof window !== 'undefined' && window.matchMedia) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleChange = () => {
    const state = useUIStore.getState();
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
 * Check if a modal is open
 */
export const selectIsModalOpen = (state: UIStore): boolean => {
  return state.openModal !== 'none';
};

/**
 * Check if a specific modal is open
 */
export const selectIsSpecificModalOpen =
  (modal: ModalType) =>
  (state: UIStore): boolean => {
    return state.openModal === modal;
  };

/**
 * Check if a panel is visible
 */
export const selectIsPanelVisible =
  (panelId: PanelId) =>
  (state: UIStore): boolean => {
    return state.panels[panelId];
  };

/**
 * Get count of visible panels
 */
export const selectVisiblePanelCount = (state: UIStore): number => {
  return Object.values(state.panels).filter(Boolean).length;
};

/**
 * Check if sidebar is collapsed
 */
export const selectIsSidebarCollapsed = (state: UIStore): boolean => {
  return state.sidebarCollapsed;
};

/**
 * Check if dark mode is active
 */
export const selectIsDarkMode = (state: UIStore): boolean => {
  return state.resolvedTheme === 'dark';
};

/**
 * Check if using system theme
 */
export const selectIsSystemTheme = (state: UIStore): boolean => {
  return state.theme === 'system';
};

/**
 * Check if there's a notification
 */
export const selectHasNotification = (state: UIStore): boolean => {
  return state.notification !== null;
};

/**
 * Get notification type (for styling)
 */
export const selectNotificationType = (state: UIStore): string | null => {
  return state.notification?.type ?? null;
};

/**
 * Get all hidden panels
 */
export const selectHiddenPanels = (state: UIStore): PanelId[] => {
  return (Object.entries(state.panels) as [PanelId, boolean][])
    .filter(([, visible]) => !visible)
    .map(([id]) => id);
};

/**
 * Get all visible panels
 */
export const selectVisiblePanels = (state: UIStore): PanelId[] => {
  return (Object.entries(state.panels) as [PanelId, boolean][])
    .filter(([, visible]) => visible)
    .map(([id]) => id);
};
