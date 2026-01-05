/**
 * Tests for SettingsPanel Component
 *
 * Comprehensive tests covering:
 * - Rendering and visibility
 * - Theme settings
 * - Audio settings (tempo, vocal range, metronome)
 * - Behavior settings (auto-analyze, keyboard shortcuts)
 * - Export/import functionality
 * - Reset to defaults
 * - Accessibility
 *
 * @module components/Settings/SettingsPanel.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPanel } from './SettingsPanel';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useThemeStore } from '@/stores/useThemeStore';

// Mock the stores
vi.mock('@/stores/useSettingsStore', () => ({
  useSettingsStore: vi.fn(),
  VOCAL_RANGE_PRESETS: {
    soprano: { lowNote: 'C4', highNote: 'C6', description: 'Soprano (C4-C6)' },
    alto: { lowNote: 'F3', highNote: 'F5', description: 'Alto (F3-F5)' },
    tenor: { lowNote: 'C3', highNote: 'C5', description: 'Tenor (C3-C5)' },
    bass: { lowNote: 'E2', highNote: 'E4', description: 'Bass (E2-E4)' },
  },
  TEMPO_RANGE: { min: 40, max: 240, default: 100 },
  METRONOME_SOUNDS: {
    click: 'Click',
    beep: 'Beep',
    woodblock: 'Woodblock',
    none: 'None (Silent)',
  },
}));

vi.mock('@/stores/useThemeStore', () => ({
  useThemeStore: vi.fn(),
}));

vi.mock('@/hooks', () => ({
  useFocusTrap: vi.fn().mockReturnValue({
    containerRef: { current: null },
  }),
}));

describe('SettingsPanel', () => {
  // Default mock state
  const defaultSettingsState = {
    theme: 'system' as const,
    defaultTempo: 100,
    vocalRange: { preset: 'tenor' as const, lowNote: 'C3', highNote: 'C5' },
    metronomeSound: 'click' as const,
    metronomeVolume: 0.7,
    autoAnalyzeOnPaste: true,
    keyboardShortcutsEnabled: true,
    setTheme: vi.fn(),
    setDefaultTempo: vi.fn(),
    setVocalRangePreset: vi.fn(),
    setMetronomeSound: vi.fn(),
    setMetronomeVolume: vi.fn(),
    setAutoAnalyzeOnPaste: vi.fn(),
    setKeyboardShortcutsEnabled: vi.fn(),
    exportSettings: vi.fn().mockReturnValue('{"theme": "system"}'),
    importSettings: vi.fn().mockReturnValue(true),
    resetToDefaults: vi.fn(),
  };

  const defaultThemeState = {
    setTheme: vi.fn(),
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default mock implementations
    const mockStore = (selector: unknown) => {
      if (typeof selector === 'function') {
        return (selector as (state: typeof defaultSettingsState) => unknown)(defaultSettingsState);
      }
      return defaultSettingsState;
    };
    // Add getState method for direct state access
    mockStore.getState = () => defaultSettingsState;

    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(mockStore);
    // Also attach getState to the mock function itself
    (useSettingsStore as unknown as { getState: () => typeof defaultSettingsState }).getState = () => defaultSettingsState;

    (useThemeStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector(defaultThemeState);
      }
      return defaultThemeState;
    });
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('rendering', () => {
    it('renders when isOpen is true', () => {
      render(<SettingsPanel {...defaultProps} />);

      expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<SettingsPanel {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('settings-panel')).not.toBeInTheDocument();
    });

    it('renders the dialog title', () => {
      render(<SettingsPanel {...defaultProps} />);

      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('renders the close button', () => {
      render(<SettingsPanel {...defaultProps} />);

      expect(screen.getByTestId('settings-close-button')).toBeInTheDocument();
    });

    it('renders all section headers', () => {
      render(<SettingsPanel {...defaultProps} />);

      expect(screen.getByText('Appearance')).toBeInTheDocument();
      expect(screen.getByText('Audio')).toBeInTheDocument();
      expect(screen.getByText('Behavior')).toBeInTheDocument();
      expect(screen.getByText('Data Management')).toBeInTheDocument();
    });
  });

  describe('theme settings', () => {
    it('renders theme select with current value', () => {
      render(<SettingsPanel {...defaultProps} />);

      const select = screen.getByTestId('settings-theme-select');
      expect(select).toHaveValue('system');
    });

    it('shows all theme options', () => {
      render(<SettingsPanel {...defaultProps} />);

      const select = screen.getByTestId('settings-theme-select');
      expect(select).toContainHTML('Light');
      expect(select).toContainHTML('Dark');
      expect(select).toContainHTML('System (Auto)');
    });

    it('calls setTheme and applyTheme when theme changes', async () => {
      const user = userEvent.setup();
      const setTheme = vi.fn();
      const applyTheme = vi.fn();

      (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          return selector({ ...defaultSettingsState, setTheme });
        }
        return { ...defaultSettingsState, setTheme };
      });

      (useThemeStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          return selector({ setTheme: applyTheme });
        }
        return { setTheme: applyTheme };
      });

      render(<SettingsPanel {...defaultProps} />);

      const select = screen.getByTestId('settings-theme-select');
      await user.selectOptions(select, 'dark');

      expect(setTheme).toHaveBeenCalledWith('dark');
      expect(applyTheme).toHaveBeenCalledWith('dark');
    });
  });

  describe('tempo settings', () => {
    it('renders tempo slider with current value', () => {
      render(<SettingsPanel {...defaultProps} />);

      expect(screen.getByTestId('settings-tempo-value')).toHaveTextContent('100 BPM');
    });

    it('renders tempo slider with correct range', () => {
      render(<SettingsPanel {...defaultProps} />);

      const slider = screen.getByTestId('settings-tempo-slider');
      expect(slider).toHaveAttribute('min', '40');
      expect(slider).toHaveAttribute('max', '240');
    });

    it('calls setDefaultTempo when slider changes', () => {
      const setDefaultTempo = vi.fn();

      (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          return selector({ ...defaultSettingsState, setDefaultTempo });
        }
        return { ...defaultSettingsState, setDefaultTempo };
      });

      render(<SettingsPanel {...defaultProps} />);

      const slider = screen.getByTestId('settings-tempo-slider');
      fireEvent.change(slider, { target: { value: '120' } });

      expect(setDefaultTempo).toHaveBeenCalledWith(120);
    });
  });

  describe('vocal range settings', () => {
    it('renders vocal range select with current value', () => {
      render(<SettingsPanel {...defaultProps} />);

      const select = screen.getByTestId('settings-vocal-range-select');
      expect(select).toHaveValue('tenor');
    });

    it('shows all vocal range options', () => {
      render(<SettingsPanel {...defaultProps} />);

      const select = screen.getByTestId('settings-vocal-range-select');
      expect(select).toContainHTML('Soprano');
      expect(select).toContainHTML('Alto');
      expect(select).toContainHTML('Tenor');
      expect(select).toContainHTML('Bass');
    });

    it('calls setVocalRangePreset when selection changes', async () => {
      const user = userEvent.setup();
      const setVocalRangePreset = vi.fn();

      (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          return selector({ ...defaultSettingsState, setVocalRangePreset });
        }
        return { ...defaultSettingsState, setVocalRangePreset };
      });

      render(<SettingsPanel {...defaultProps} />);

      const select = screen.getByTestId('settings-vocal-range-select');
      await user.selectOptions(select, 'soprano');

      expect(setVocalRangePreset).toHaveBeenCalledWith('soprano');
    });
  });

  describe('metronome settings', () => {
    it('renders metronome sound select with current value', () => {
      render(<SettingsPanel {...defaultProps} />);

      const select = screen.getByTestId('settings-metronome-sound-select');
      expect(select).toHaveValue('click');
    });

    it('shows all metronome sound options', () => {
      render(<SettingsPanel {...defaultProps} />);

      const select = screen.getByTestId('settings-metronome-sound-select');
      expect(select).toContainHTML('Click');
      expect(select).toContainHTML('Beep');
      expect(select).toContainHTML('Woodblock');
      expect(select).toContainHTML('None (Silent)');
    });

    it('renders metronome volume slider', () => {
      render(<SettingsPanel {...defaultProps} />);

      expect(screen.getByTestId('settings-metronome-volume')).toBeInTheDocument();
      expect(screen.getByTestId('settings-metronome-volume-value')).toHaveTextContent('70%');
    });

    it('calls setMetronomeSound when selection changes', async () => {
      const user = userEvent.setup();
      const setMetronomeSound = vi.fn();

      (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          return selector({ ...defaultSettingsState, setMetronomeSound });
        }
        return { ...defaultSettingsState, setMetronomeSound };
      });

      render(<SettingsPanel {...defaultProps} />);

      const select = screen.getByTestId('settings-metronome-sound-select');
      await user.selectOptions(select, 'beep');

      expect(setMetronomeSound).toHaveBeenCalledWith('beep');
    });

    it('calls setMetronomeVolume when slider changes', () => {
      const setMetronomeVolume = vi.fn();

      (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          return selector({ ...defaultSettingsState, setMetronomeVolume });
        }
        return { ...defaultSettingsState, setMetronomeVolume };
      });

      render(<SettingsPanel {...defaultProps} />);

      const slider = screen.getByTestId('settings-metronome-volume-slider');
      fireEvent.change(slider, { target: { value: '0.5' } });

      expect(setMetronomeVolume).toHaveBeenCalledWith(0.5);
    });
  });

  describe('behavior settings', () => {
    it('renders auto-analyze toggle with current state', () => {
      render(<SettingsPanel {...defaultProps} />);

      const toggle = screen.getByTestId('settings-auto-analyze');
      const checkbox = toggle.querySelector('input[type="checkbox"]');
      expect(checkbox).toBeChecked();
    });

    it('calls setAutoAnalyzeOnPaste when toggle changes', () => {
      const setAutoAnalyzeOnPaste = vi.fn();

      (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          return selector({ ...defaultSettingsState, setAutoAnalyzeOnPaste });
        }
        return { ...defaultSettingsState, setAutoAnalyzeOnPaste };
      });

      render(<SettingsPanel {...defaultProps} />);

      const toggle = screen.getByTestId('settings-auto-analyze');
      const checkbox = toggle.querySelector('input[type="checkbox"]');
      fireEvent.click(checkbox!);

      expect(setAutoAnalyzeOnPaste).toHaveBeenCalledWith(false);
    });

    it('renders keyboard shortcuts toggle with current state', () => {
      render(<SettingsPanel {...defaultProps} />);

      const toggle = screen.getByTestId('settings-keyboard-shortcuts');
      const checkbox = toggle.querySelector('input[type="checkbox"]');
      expect(checkbox).toBeChecked();
    });

    it('calls setKeyboardShortcutsEnabled when toggle changes', () => {
      const setKeyboardShortcutsEnabled = vi.fn();

      (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          return selector({ ...defaultSettingsState, setKeyboardShortcutsEnabled });
        }
        return { ...defaultSettingsState, setKeyboardShortcutsEnabled };
      });

      render(<SettingsPanel {...defaultProps} />);

      const toggle = screen.getByTestId('settings-keyboard-shortcuts');
      const checkbox = toggle.querySelector('input[type="checkbox"]');
      fireEvent.click(checkbox!);

      expect(setKeyboardShortcutsEnabled).toHaveBeenCalledWith(false);
    });
  });

  describe('export settings', () => {
    it('renders export button', () => {
      render(<SettingsPanel {...defaultProps} />);

      expect(screen.getByTestId('settings-export-button')).toBeInTheDocument();
    });

    it('calls exportSettings when export button is clicked', async () => {
      const user = userEvent.setup();
      const exportSettings = vi.fn().mockReturnValue('{"theme": "dark"}');

      // Mock URL.createObjectURL and URL.revokeObjectURL
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test');
      const mockRevokeObjectURL = vi.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          return selector({ ...defaultSettingsState, exportSettings });
        }
        return { ...defaultSettingsState, exportSettings };
      });

      render(<SettingsPanel {...defaultProps} />);

      const exportButton = screen.getByTestId('settings-export-button');
      await user.click(exportButton);

      expect(exportSettings).toHaveBeenCalled();
    });

    it('shows success feedback after export', async () => {
      const user = userEvent.setup();

      // Mock URL APIs
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
      global.URL.revokeObjectURL = vi.fn();

      render(<SettingsPanel {...defaultProps} />);

      const exportButton = screen.getByTestId('settings-export-button');
      await user.click(exportButton);

      await waitFor(() => {
        expect(screen.getByTestId('settings-feedback')).toHaveTextContent('Settings exported successfully!');
      });
    });
  });

  describe('import settings', () => {
    it('renders import button', () => {
      render(<SettingsPanel {...defaultProps} />);

      expect(screen.getByTestId('settings-import-button')).toBeInTheDocument();
    });

    it('opens import dialog when import button is clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel {...defaultProps} />);

      const importButton = screen.getByTestId('settings-import-button');
      await user.click(importButton);

      expect(screen.getByTestId('settings-import-dialog')).toBeInTheDocument();
    });

    it('shows textarea for pasting settings JSON', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel {...defaultProps} />);

      const importButton = screen.getByTestId('settings-import-button');
      await user.click(importButton);

      expect(screen.getByTestId('settings-import-textarea')).toBeInTheDocument();
    });

    it('calls importSettings when import is confirmed', async () => {
      const user = userEvent.setup();
      const importSettings = vi.fn().mockReturnValue(true);

      // Create a mock that also supports getState for the import handler
      const mockImplementation = (selector: unknown) => {
        if (typeof selector === 'function') {
          return selector({ ...defaultSettingsState, importSettings });
        }
        return { ...defaultSettingsState, importSettings };
      };
      (mockImplementation as unknown as { getState: () => unknown }).getState = () => ({
        ...defaultSettingsState,
        importSettings,
        theme: 'dark',
      });

      (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(mockImplementation);

      render(<SettingsPanel {...defaultProps} />);

      // Open import dialog
      await user.click(screen.getByTestId('settings-import-button'));

      // Enter JSON (use fireEvent for curly braces which are special in userEvent)
      const textarea = screen.getByTestId('settings-import-textarea');
      fireEvent.change(textarea, { target: { value: '{"theme": "dark"}' } });

      // Confirm import
      await user.click(screen.getByTestId('settings-import-confirm'));

      expect(importSettings).toHaveBeenCalledWith('{"theme": "dark"}');
    });

    it('shows error when import fails', async () => {
      const user = userEvent.setup();
      const importSettings = vi.fn().mockReturnValue(false);

      (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          return selector({ ...defaultSettingsState, importSettings });
        }
        return { ...defaultSettingsState, importSettings };
      });

      render(<SettingsPanel {...defaultProps} />);

      // Open import dialog
      await user.click(screen.getByTestId('settings-import-button'));

      // Enter invalid JSON (use fireEvent for this)
      const textarea = screen.getByTestId('settings-import-textarea');
      await user.type(textarea, 'invalid json');

      // Confirm import
      await user.click(screen.getByTestId('settings-import-confirm'));

      expect(screen.getByTestId('settings-import-error')).toBeInTheDocument();
    });

    it('closes import dialog when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel {...defaultProps} />);

      // Open import dialog
      await user.click(screen.getByTestId('settings-import-button'));
      expect(screen.getByTestId('settings-import-dialog')).toBeInTheDocument();

      // Cancel
      await user.click(screen.getByTestId('settings-import-cancel'));

      expect(screen.queryByTestId('settings-import-dialog')).not.toBeInTheDocument();
    });
  });

  describe('reset to defaults', () => {
    it('renders reset button', () => {
      render(<SettingsPanel {...defaultProps} />);

      expect(screen.getByTestId('settings-reset-button')).toBeInTheDocument();
    });

    it('shows confirmation dialog when reset button is clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel {...defaultProps} />);

      await user.click(screen.getByTestId('settings-reset-button'));

      expect(screen.getByTestId('settings-reset-dialog')).toBeInTheDocument();
    });

    it('calls resetToDefaults when confirmed', async () => {
      const user = userEvent.setup();
      const resetToDefaults = vi.fn();
      const applyTheme = vi.fn();

      (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          return selector({ ...defaultSettingsState, resetToDefaults });
        }
        return { ...defaultSettingsState, resetToDefaults };
      });

      (useThemeStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          return selector({ setTheme: applyTheme });
        }
        return { setTheme: applyTheme };
      });

      render(<SettingsPanel {...defaultProps} />);

      // Open confirmation
      await user.click(screen.getByTestId('settings-reset-button'));

      // Confirm reset
      await user.click(screen.getByTestId('settings-reset-confirm'));

      expect(resetToDefaults).toHaveBeenCalled();
      expect(applyTheme).toHaveBeenCalledWith('system');
    });

    it('closes confirmation dialog when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel {...defaultProps} />);

      // Open confirmation
      await user.click(screen.getByTestId('settings-reset-button'));
      expect(screen.getByTestId('settings-reset-dialog')).toBeInTheDocument();

      // Cancel
      await user.click(screen.getByTestId('settings-reset-cancel'));

      expect(screen.queryByTestId('settings-reset-dialog')).not.toBeInTheDocument();
    });
  });

  describe('closing behavior', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<SettingsPanel isOpen={true} onClose={onClose} />);

      await user.click(screen.getByTestId('settings-close-button'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when overlay is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<SettingsPanel isOpen={true} onClose={onClose} />);

      await user.click(screen.getByTestId('settings-panel-overlay'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when panel content is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<SettingsPanel isOpen={true} onClose={onClose} />);

      await user.click(screen.getByText('Settings'));

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('body scroll prevention', () => {
    it('sets body overflow to hidden when open', () => {
      render(<SettingsPanel {...defaultProps} />);

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('resets body overflow when closed', () => {
      const { rerender } = render(<SettingsPanel {...defaultProps} />);

      rerender(<SettingsPanel {...defaultProps} isOpen={false} />);

      expect(document.body.style.overflow).toBe('');
    });

    it('resets body overflow on unmount', () => {
      const { unmount } = render(<SettingsPanel {...defaultProps} />);

      unmount();

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('accessibility', () => {
    it('has role="dialog"', () => {
      render(<SettingsPanel {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal="true"', () => {
      render(<SettingsPanel {...defaultProps} />);

      expect(screen.getByTestId('settings-panel')).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-labelledby pointing to the title', () => {
      render(<SettingsPanel {...defaultProps} />);

      const dialog = screen.getByTestId('settings-panel');
      const titleId = dialog.getAttribute('aria-labelledby');

      expect(titleId).toBeTruthy();
      expect(document.getElementById(titleId!)).toHaveTextContent('Settings');
    });

    it('close button has aria-label', () => {
      render(<SettingsPanel {...defaultProps} />);

      expect(screen.getByTestId('settings-close-button')).toHaveAttribute(
        'aria-label',
        'Close settings'
      );
    });

    it('form controls have proper labels', () => {
      render(<SettingsPanel {...defaultProps} />);

      // Theme select
      expect(screen.getByLabelText(/Theme/)).toBeInTheDocument();

      // Auto-analyze toggle
      expect(screen.getByLabelText(/Auto-Analyze on Paste/)).toBeInTheDocument();

      // Keyboard shortcuts toggle
      expect(screen.getByLabelText(/Keyboard Shortcuts/)).toBeInTheDocument();
    });

    it('sliders have aria-value attributes', () => {
      render(<SettingsPanel {...defaultProps} />);

      const tempoSlider = screen.getByTestId('settings-tempo-slider');
      expect(tempoSlider).toHaveAttribute('aria-valuemin', '40');
      expect(tempoSlider).toHaveAttribute('aria-valuemax', '240');
      expect(tempoSlider).toHaveAttribute('aria-valuenow', '100');
      expect(tempoSlider).toHaveAttribute('aria-valuetext', '100 BPM');
    });

    it('feedback messages have role="alert"', async () => {
      const user = userEvent.setup();

      // Mock URL APIs
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
      global.URL.revokeObjectURL = vi.fn();

      render(<SettingsPanel {...defaultProps} />);

      await user.click(screen.getByTestId('settings-export-button'));

      await waitFor(() => {
        const feedback = screen.getByTestId('settings-feedback');
        expect(feedback).toHaveAttribute('role', 'alert');
      });
    });
  });

  describe('custom test ID', () => {
    it('uses custom testId prop', () => {
      render(<SettingsPanel {...defaultProps} testId="custom-settings" />);

      expect(screen.getByTestId('custom-settings')).toBeInTheDocument();
      expect(screen.getByTestId('custom-settings-overlay')).toBeInTheDocument();
    });
  });
});
