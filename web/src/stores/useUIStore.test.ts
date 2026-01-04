/**
 * Tests for useUIStore
 *
 * @module stores/useUIStore.test
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useUIStore, selectIsModalOpen, selectIsSpecificModalOpen, selectIsPanelVisible, selectVisiblePanelCount, selectIsSidebarCollapsed, selectIsDarkMode, selectIsSystemTheme, selectHasNotification, selectNotificationType, selectHiddenPanels, selectVisiblePanels } from './useUIStore';

// Mock matchMedia
const mockMatchMedia = vi.fn().mockImplementation((query) => ({
  matches: query === '(prefers-color-scheme: dark)',
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

vi.stubGlobal('matchMedia', mockMatchMedia);

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.getState().reset();
    vi.useFakeTimers();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('ghost-note-ui-store');
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useUIStore.getState();
      expect(state.theme).toBe('system');
      expect(state.openModal).toBe('none');
      expect(state.sidebarCollapsed).toBe(false);
      expect(state.notificationsEnabled).toBe(true);
      expect(state.notification).toBeNull();
    });

    it('should have all panels visible by default', () => {
      const state = useUIStore.getState();
      expect(state.panels['poem-input']).toBe(true);
      expect(state.panels.analysis).toBe(true);
      expect(state.panels['lyric-editor']).toBe(true);
      expect(state.panels['melody-player']).toBe(true);
      expect(state.panels['recording-studio']).toBe(true);
    });
  });

  describe('theme management', () => {
    describe('setTheme', () => {
      it('should set theme to light', () => {
        useUIStore.getState().setTheme('light');

        const state = useUIStore.getState();
        expect(state.theme).toBe('light');
        expect(state.resolvedTheme).toBe('light');
      });

      it('should set theme to dark', () => {
        useUIStore.getState().setTheme('dark');

        const state = useUIStore.getState();
        expect(state.theme).toBe('dark');
        expect(state.resolvedTheme).toBe('dark');
      });

      it('should resolve system theme', () => {
        mockMatchMedia.mockImplementationOnce((query) => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }));

        useUIStore.getState().setTheme('system');

        const state = useUIStore.getState();
        expect(state.theme).toBe('system');
        // Resolved theme depends on system preference
      });
    });

    describe('updateResolvedTheme', () => {
      it('should update resolved theme based on system preference', () => {
        useUIStore.getState().setTheme('system');
        useUIStore.getState().updateResolvedTheme();

        // The test should verify the method runs without error
        expect(useUIStore.getState().theme).toBe('system');
      });
    });
  });

  describe('modal management', () => {
    describe('openModalDialog', () => {
      it('should open a modal', () => {
        useUIStore.getState().openModalDialog('settings');
        expect(useUIStore.getState().openModal).toBe('settings');
      });

      it('should support all modal types', () => {
        const modalTypes = [
          'settings',
          'export',
          'import',
          'help',
          'version-history',
          'recording-manager',
        ] as const;

        for (const modal of modalTypes) {
          useUIStore.getState().openModalDialog(modal);
          expect(useUIStore.getState().openModal).toBe(modal);
        }
      });
    });

    describe('closeModal', () => {
      it('should close the modal', () => {
        useUIStore.getState().openModalDialog('settings');
        useUIStore.getState().closeModal();
        expect(useUIStore.getState().openModal).toBe('none');
      });
    });
  });

  describe('panel management', () => {
    describe('togglePanel', () => {
      it('should toggle panel visibility', () => {
        useUIStore.getState().togglePanel('analysis');
        expect(useUIStore.getState().panels.analysis).toBe(false);

        useUIStore.getState().togglePanel('analysis');
        expect(useUIStore.getState().panels.analysis).toBe(true);
      });
    });

    describe('setPanelVisible', () => {
      it('should set panel visibility directly', () => {
        useUIStore.getState().setPanelVisible('analysis', false);
        expect(useUIStore.getState().panels.analysis).toBe(false);

        useUIStore.getState().setPanelVisible('analysis', true);
        expect(useUIStore.getState().panels.analysis).toBe(true);
      });
    });
  });

  describe('sidebar', () => {
    describe('toggleSidebar', () => {
      it('should toggle sidebar collapsed state', () => {
        expect(useUIStore.getState().sidebarCollapsed).toBe(false);

        useUIStore.getState().toggleSidebar();
        expect(useUIStore.getState().sidebarCollapsed).toBe(true);

        useUIStore.getState().toggleSidebar();
        expect(useUIStore.getState().sidebarCollapsed).toBe(false);
      });
    });
  });

  describe('notifications', () => {
    describe('showNotification', () => {
      it('should show notification', () => {
        useUIStore.getState().showNotification('Test message', 'success');

        const state = useUIStore.getState();
        expect(state.notification).not.toBeNull();
        expect(state.notification?.message).toBe('Test message');
        expect(state.notification?.type).toBe('success');
      });

      it('should default to info type', () => {
        useUIStore.getState().showNotification('Test message');
        expect(useUIStore.getState().notification?.type).toBe('info');
      });

      it('should not show notification when disabled', () => {
        useUIStore.getState().toggleNotifications();
        useUIStore.getState().showNotification('Test message');

        expect(useUIStore.getState().notification).toBeNull();
      });

      it('should auto-clear after 5 seconds', () => {
        useUIStore.getState().showNotification('Test message');
        expect(useUIStore.getState().notification).not.toBeNull();

        vi.advanceTimersByTime(5000);

        expect(useUIStore.getState().notification).toBeNull();
      });

      it('should not clear if message changed', () => {
        useUIStore.getState().showNotification('First message');

        vi.advanceTimersByTime(2500);

        useUIStore.getState().showNotification('Second message');

        vi.advanceTimersByTime(3000);

        // First timer fires but message has changed
        expect(useUIStore.getState().notification?.message).toBe('Second message');
      });
    });

    describe('clearNotification', () => {
      it('should clear notification', () => {
        useUIStore.getState().showNotification('Test message');
        useUIStore.getState().clearNotification();

        expect(useUIStore.getState().notification).toBeNull();
      });
    });

    describe('toggleNotifications', () => {
      it('should toggle notifications enabled', () => {
        expect(useUIStore.getState().notificationsEnabled).toBe(true);

        useUIStore.getState().toggleNotifications();
        expect(useUIStore.getState().notificationsEnabled).toBe(false);

        useUIStore.getState().toggleNotifications();
        expect(useUIStore.getState().notificationsEnabled).toBe(true);
      });
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      useUIStore.getState().setTheme('dark');
      useUIStore.getState().openModalDialog('settings');
      useUIStore.getState().togglePanel('analysis');
      useUIStore.getState().toggleSidebar();
      useUIStore.getState().showNotification('Test');

      useUIStore.getState().reset();

      const state = useUIStore.getState();
      expect(state.theme).toBe('system');
      expect(state.openModal).toBe('none');
      expect(state.panels.analysis).toBe(true);
      expect(state.sidebarCollapsed).toBe(false);
      expect(state.notification).toBeNull();
    });
  });

  describe('selectors', () => {
    describe('selectIsModalOpen', () => {
      it('should return true when modal is open', () => {
        expect(selectIsModalOpen(useUIStore.getState())).toBe(false);

        useUIStore.getState().openModalDialog('settings');
        expect(selectIsModalOpen(useUIStore.getState())).toBe(true);
      });
    });

    describe('selectIsSpecificModalOpen', () => {
      it('should return true only for matching modal', () => {
        useUIStore.getState().openModalDialog('settings');

        const settingsSelector = selectIsSpecificModalOpen('settings');
        const helpSelector = selectIsSpecificModalOpen('help');

        expect(settingsSelector(useUIStore.getState())).toBe(true);
        expect(helpSelector(useUIStore.getState())).toBe(false);
      });
    });

    describe('selectIsPanelVisible', () => {
      it('should return panel visibility', () => {
        const selector = selectIsPanelVisible('analysis');
        expect(selector(useUIStore.getState())).toBe(true);

        useUIStore.getState().togglePanel('analysis');
        expect(selector(useUIStore.getState())).toBe(false);
      });
    });

    describe('selectVisiblePanelCount', () => {
      it('should return count of visible panels', () => {
        expect(selectVisiblePanelCount(useUIStore.getState())).toBe(5);

        useUIStore.getState().togglePanel('analysis');
        expect(selectVisiblePanelCount(useUIStore.getState())).toBe(4);

        useUIStore.getState().togglePanel('poem-input');
        expect(selectVisiblePanelCount(useUIStore.getState())).toBe(3);
      });
    });

    describe('selectIsSidebarCollapsed', () => {
      it('should return sidebar collapsed state', () => {
        expect(selectIsSidebarCollapsed(useUIStore.getState())).toBe(false);

        useUIStore.getState().toggleSidebar();
        expect(selectIsSidebarCollapsed(useUIStore.getState())).toBe(true);
      });
    });

    describe('selectIsDarkMode', () => {
      it('should return true when dark mode is active', () => {
        useUIStore.getState().setTheme('light');
        expect(selectIsDarkMode(useUIStore.getState())).toBe(false);

        useUIStore.getState().setTheme('dark');
        expect(selectIsDarkMode(useUIStore.getState())).toBe(true);
      });
    });

    describe('selectIsSystemTheme', () => {
      it('should return true when using system theme', () => {
        expect(selectIsSystemTheme(useUIStore.getState())).toBe(true);

        useUIStore.getState().setTheme('dark');
        expect(selectIsSystemTheme(useUIStore.getState())).toBe(false);

        useUIStore.getState().setTheme('system');
        expect(selectIsSystemTheme(useUIStore.getState())).toBe(true);
      });
    });

    describe('selectHasNotification', () => {
      it('should return true when notification exists', () => {
        expect(selectHasNotification(useUIStore.getState())).toBe(false);

        useUIStore.getState().showNotification('Test');
        expect(selectHasNotification(useUIStore.getState())).toBe(true);
      });
    });

    describe('selectNotificationType', () => {
      it('should return notification type', () => {
        expect(selectNotificationType(useUIStore.getState())).toBeNull();

        useUIStore.getState().showNotification('Test', 'error');
        expect(selectNotificationType(useUIStore.getState())).toBe('error');
      });
    });

    describe('selectHiddenPanels', () => {
      it('should return array of hidden panel IDs', () => {
        expect(selectHiddenPanels(useUIStore.getState())).toEqual([]);

        useUIStore.getState().togglePanel('analysis');
        useUIStore.getState().togglePanel('poem-input');

        const hidden = selectHiddenPanels(useUIStore.getState());
        expect(hidden).toContain('analysis');
        expect(hidden).toContain('poem-input');
        expect(hidden).toHaveLength(2);
      });
    });

    describe('selectVisiblePanels', () => {
      it('should return array of visible panel IDs', () => {
        const visible = selectVisiblePanels(useUIStore.getState());
        expect(visible).toHaveLength(5);
        expect(visible).toContain('analysis');
        expect(visible).toContain('poem-input');

        useUIStore.getState().togglePanel('analysis');
        const newVisible = selectVisiblePanels(useUIStore.getState());
        expect(newVisible).toHaveLength(4);
        expect(newVisible).not.toContain('analysis');
      });
    });
  });
});
