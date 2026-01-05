/**
 * SettingsPanel Component
 *
 * A comprehensive settings panel for configuring user preferences.
 * Includes theme selection, audio settings, behavior toggles,
 * and import/export functionality.
 *
 * @module components/Settings/SettingsPanel
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import type { ReactElement, ChangeEvent } from 'react';
import {
  useSettingsStore,
  VOCAL_RANGE_PRESETS,
  TEMPO_RANGE,
  METRONOME_SOUNDS,
  type ThemePreference,
  type VocalRangePreset,
  type MetronomeSound,
} from '@/stores/useSettingsStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { useFocusTrap } from '@/hooks';

// Logging helper for debugging
const DEBUG = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[SettingsPanel] ${message}`, ...args);
  }
};

/**
 * Props for SettingsPanel component
 */
export interface SettingsPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback to close the panel */
  onClose: () => void;
  /** Optional test ID */
  testId?: string;
}

/**
 * Section header component for organizing settings
 */
function SectionHeader({ title }: { title: string }): ReactElement {
  return (
    <h3 className="settings-section-header" data-testid={`settings-section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      {title}
    </h3>
  );
}

/**
 * Toggle switch component for boolean settings
 */
function ToggleSwitch({
  label,
  checked,
  onChange,
  description,
  testId,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  testId: string;
}): ReactElement {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.checked);
    },
    [onChange]
  );

  return (
    <div className="settings-toggle-row" data-testid={testId}>
      <div className="settings-toggle-content">
        <label className="settings-toggle-label" htmlFor={testId}>
          {label}
        </label>
        {description && <p className="settings-toggle-description">{description}</p>}
      </div>
      <div className="settings-toggle-switch">
        <input
          type="checkbox"
          id={testId}
          checked={checked}
          onChange={handleChange}
          className="settings-checkbox"
          aria-describedby={description ? `${testId}-desc` : undefined}
        />
        <span className="settings-slider" />
      </div>
    </div>
  );
}

/**
 * Select dropdown component for choice settings
 */
function SelectOption<T extends string>({
  label,
  value,
  options,
  onChange,
  description,
  testId,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  description?: string;
  testId: string;
}): ReactElement {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      onChange(e.target.value as T);
    },
    [onChange]
  );

  return (
    <div className="settings-select-row" data-testid={testId}>
      <div className="settings-select-content">
        <label className="settings-select-label" htmlFor={testId}>
          {label}
        </label>
        {description && <p className="settings-select-description">{description}</p>}
      </div>
      <select
        id={testId}
        value={value}
        onChange={handleChange}
        className="settings-select"
        data-testid={`${testId}-select`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Slider component for numeric settings
 */
function SliderSetting({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
  description,
  testId,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  description?: string;
  testId: string;
}): ReactElement {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(parseFloat(e.target.value));
    },
    [onChange]
  );

  const displayValue = formatValue ? formatValue(value) : value.toString();

  return (
    <div className="settings-slider-row" data-testid={testId}>
      <div className="settings-slider-header">
        <label className="settings-slider-label" htmlFor={testId}>
          {label}
        </label>
        <span className="settings-slider-value" data-testid={`${testId}-value`}>
          {displayValue}
        </span>
      </div>
      {description && <p className="settings-slider-description">{description}</p>}
      <input
        type="range"
        id={testId}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="settings-range-slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={displayValue}
        data-testid={`${testId}-slider`}
      />
    </div>
  );
}

/**
 * SettingsPanel provides a comprehensive UI for configuring application preferences.
 *
 * Features:
 * - Theme selection (light/dark/system)
 * - Default tempo configuration
 * - Vocal range presets
 * - Auto-analyze toggle
 * - Metronome sound settings
 * - Keyboard shortcuts toggle
 * - Export/import settings
 * - Reset to defaults
 *
 * @example
 * ```tsx
 * <SettingsPanel
 *   isOpen={showSettings}
 *   onClose={() => setShowSettings(false)}
 * />
 * ```
 */
export function SettingsPanel({
  isOpen,
  onClose,
  testId = 'settings-panel',
}: SettingsPanelProps): ReactElement | null {
  log('Rendering settings panel:', { isOpen });

  // Settings store state
  const theme = useSettingsStore((state) => state.theme);
  const defaultTempo = useSettingsStore((state) => state.defaultTempo);
  const vocalRange = useSettingsStore((state) => state.vocalRange);
  const metronomeSound = useSettingsStore((state) => state.metronomeSound);
  const metronomeVolume = useSettingsStore((state) => state.metronomeVolume);
  const autoAnalyzeOnPaste = useSettingsStore((state) => state.autoAnalyzeOnPaste);
  const keyboardShortcutsEnabled = useSettingsStore((state) => state.keyboardShortcutsEnabled);

  // Settings store actions
  const setTheme = useSettingsStore((state) => state.setTheme);
  const setDefaultTempo = useSettingsStore((state) => state.setDefaultTempo);
  const setVocalRangePreset = useSettingsStore((state) => state.setVocalRangePreset);
  const setMetronomeSound = useSettingsStore((state) => state.setMetronomeSound);
  const setMetronomeVolume = useSettingsStore((state) => state.setMetronomeVolume);
  const setAutoAnalyzeOnPaste = useSettingsStore((state) => state.setAutoAnalyzeOnPaste);
  const setKeyboardShortcutsEnabled = useSettingsStore((state) => state.setKeyboardShortcutsEnabled);
  const exportSettings = useSettingsStore((state) => state.exportSettings);
  const importSettings = useSettingsStore((state) => state.importSettings);
  const resetToDefaults = useSettingsStore((state) => state.resetToDefaults);

  // Theme store for applying theme changes
  const applyTheme = useThemeStore((state) => state.setTheme);

  // Local state for import/export
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // File input ref for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Focus trap for modal
  const { containerRef } = useFocusTrap({
    enabled: isOpen,
    autoFocus: true,
    returnFocus: true,
    initialFocusSelector: '[data-testid="settings-close-button"]',
    onEscape: onClose,
  });

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Clear feedback message after delay
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  // Handle theme change - sync with theme store
  const handleThemeChange = useCallback(
    (newTheme: ThemePreference) => {
      log('Theme changing to:', newTheme);
      setTheme(newTheme);
      applyTheme(newTheme);
    },
    [setTheme, applyTheme]
  );

  // Handle export
  const handleExport = useCallback(() => {
    log('Exporting settings');
    const json = exportSettings();

    // Create and trigger download
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ghost-note-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setFeedbackMessage({ type: 'success', message: 'Settings exported successfully!' });
  }, [exportSettings]);

  // Handle import from text
  const handleImportFromText = useCallback(() => {
    log('Importing settings from text');
    setImportError(null);

    if (!importText.trim()) {
      setImportError('Please paste your settings JSON');
      return;
    }

    const success = importSettings(importText);
    if (success) {
      setShowImportDialog(false);
      setImportText('');
      setFeedbackMessage({ type: 'success', message: 'Settings imported successfully!' });
      // Apply theme if it was changed
      const newTheme = useSettingsStore.getState().theme;
      applyTheme(newTheme);
    } else {
      setImportError('Invalid settings format. Please check the JSON and try again.');
    }
  }, [importText, importSettings, applyTheme]);

  // Handle import from file
  const handleImportFromFile = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      log('Importing settings from file:', file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const success = importSettings(text);
        if (success) {
          setFeedbackMessage({ type: 'success', message: 'Settings imported successfully!' });
          // Apply theme if it was changed
          const newTheme = useSettingsStore.getState().theme;
          applyTheme(newTheme);
        } else {
          setFeedbackMessage({ type: 'error', message: 'Failed to import settings. Invalid format.' });
        }
      };
      reader.onerror = () => {
        setFeedbackMessage({ type: 'error', message: 'Failed to read file.' });
      };
      reader.readAsText(file);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [importSettings, applyTheme]
  );

  // Handle reset to defaults
  const handleResetToDefaults = useCallback(() => {
    log('Resetting to defaults');
    resetToDefaults();
    setShowResetConfirm(false);
    setFeedbackMessage({ type: 'success', message: 'Settings reset to defaults!' });
    // Apply default theme
    applyTheme('system');
  }, [resetToDefaults, applyTheme]);

  // Handle overlay click
  const handleOverlayClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        log('Overlay clicked, closing panel');
        onClose();
      }
    },
    [onClose]
  );

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  // Theme options
  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System (Auto)' },
  ];

  // Vocal range options
  const vocalRangeOptions: { value: VocalRangePreset; label: string }[] = [
    { value: 'soprano', label: VOCAL_RANGE_PRESETS.soprano.description },
    { value: 'alto', label: VOCAL_RANGE_PRESETS.alto.description },
    { value: 'tenor', label: VOCAL_RANGE_PRESETS.tenor.description },
    { value: 'bass', label: VOCAL_RANGE_PRESETS.bass.description },
  ];

  // Metronome sound options
  const metronomeSoundOptions: { value: MetronomeSound; label: string }[] = Object.entries(METRONOME_SOUNDS).map(
    ([value, label]) => ({
      value: value as MetronomeSound,
      label,
    })
  );

  return (
    <div
      className="settings-overlay"
      onClick={handleOverlayClick}
      data-testid={`${testId}-overlay`}
    >
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className="settings-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        data-testid={testId}
      >
        {/* Header */}
        <div className="settings-header">
          <h2 id="settings-title" className="settings-title">
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="settings-close-button"
            aria-label="Close settings"
            data-testid="settings-close-button"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Feedback message */}
        {feedbackMessage && (
          <div
            className={`settings-feedback settings-feedback--${feedbackMessage.type}`}
            role="alert"
            data-testid="settings-feedback"
          >
            {feedbackMessage.message}
          </div>
        )}

        {/* Content */}
        <div className="settings-content">
          {/* Appearance Section */}
          <section className="settings-section" aria-labelledby="settings-appearance-header">
            <SectionHeader title="Appearance" />
            <SelectOption
              label="Theme"
              value={theme}
              options={themeOptions}
              onChange={handleThemeChange}
              description="Choose your preferred color scheme"
              testId="settings-theme"
            />
          </section>

          {/* Audio Section */}
          <section className="settings-section" aria-labelledby="settings-audio-header">
            <SectionHeader title="Audio" />

            <SliderSetting
              label="Default Tempo"
              value={defaultTempo}
              min={TEMPO_RANGE.min}
              max={TEMPO_RANGE.max}
              onChange={setDefaultTempo}
              formatValue={(v) => `${v} BPM`}
              description="Default tempo for new melodies"
              testId="settings-tempo"
            />

            <SelectOption
              label="Vocal Range"
              value={vocalRange.preset}
              options={vocalRangeOptions}
              onChange={setVocalRangePreset}
              description="Set your vocal range for melody generation"
              testId="settings-vocal-range"
            />

            <SelectOption
              label="Metronome Sound"
              value={metronomeSound}
              options={metronomeSoundOptions}
              onChange={setMetronomeSound}
              description="Sound played during metronome beats"
              testId="settings-metronome-sound"
            />

            <SliderSetting
              label="Metronome Volume"
              value={metronomeVolume}
              min={0}
              max={1}
              step={0.1}
              onChange={setMetronomeVolume}
              formatValue={(v) => `${Math.round(v * 100)}%`}
              testId="settings-metronome-volume"
            />
          </section>

          {/* Behavior Section */}
          <section className="settings-section" aria-labelledby="settings-behavior-header">
            <SectionHeader title="Behavior" />

            <ToggleSwitch
              label="Auto-Analyze on Paste"
              checked={autoAnalyzeOnPaste}
              onChange={setAutoAnalyzeOnPaste}
              description="Automatically analyze poems when pasted"
              testId="settings-auto-analyze"
            />

            <ToggleSwitch
              label="Keyboard Shortcuts"
              checked={keyboardShortcutsEnabled}
              onChange={setKeyboardShortcutsEnabled}
              description="Enable keyboard shortcuts for common actions"
              testId="settings-keyboard-shortcuts"
            />
          </section>

          {/* Data Section */}
          <section className="settings-section" aria-labelledby="settings-data-header">
            <SectionHeader title="Data Management" />

            <div className="settings-button-group">
              <button
                type="button"
                onClick={handleExport}
                className="settings-button settings-button--secondary"
                data-testid="settings-export-button"
              >
                Export Settings
              </button>
              <button
                type="button"
                onClick={() => setShowImportDialog(true)}
                className="settings-button settings-button--secondary"
                data-testid="settings-import-button"
              >
                Import Settings
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleImportFromFile}
                className="settings-file-input"
                aria-label="Import settings from file"
                data-testid="settings-import-file"
              />
            </div>

            <div className="settings-danger-zone">
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="settings-button settings-button--danger"
                data-testid="settings-reset-button"
              >
                Reset to Defaults
              </button>
            </div>
          </section>
        </div>

        {/* Import Dialog */}
        {showImportDialog && (
          <div className="settings-dialog-overlay" data-testid="settings-import-dialog">
            <div className="settings-dialog">
              <h3 className="settings-dialog-title">Import Settings</h3>
              <p className="settings-dialog-description">
                Paste your settings JSON below:
              </p>
              <textarea
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  setImportError(null);
                }}
                className="settings-import-textarea"
                placeholder='{"theme": "dark", ...}'
                rows={8}
                data-testid="settings-import-textarea"
              />
              {importError && (
                <p className="settings-import-error" role="alert" data-testid="settings-import-error">
                  {importError}
                </p>
              )}
              <div className="settings-dialog-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportDialog(false);
                    setImportText('');
                    setImportError(null);
                  }}
                  className="settings-button settings-button--secondary"
                  data-testid="settings-import-cancel"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImportFromText}
                  className="settings-button settings-button--primary"
                  data-testid="settings-import-confirm"
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Confirmation Dialog */}
        {showResetConfirm && (
          <div className="settings-dialog-overlay" data-testid="settings-reset-dialog">
            <div className="settings-dialog">
              <h3 className="settings-dialog-title">Reset to Defaults?</h3>
              <p className="settings-dialog-description">
                This will reset all settings to their default values. This action cannot be undone.
              </p>
              <div className="settings-dialog-actions">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="settings-button settings-button--secondary"
                  data-testid="settings-reset-cancel"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  className="settings-button settings-button--danger"
                  data-testid="settings-reset-confirm"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          .settings-overlay {
            position: fixed;
            inset: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100;
            padding: 1rem;
            animation: fadeIn 0.15s ease-out;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .settings-panel {
            background-color: var(--color-surface, white);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            width: 100%;
            max-width: 500px;
            max-height: 85vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            animation: slideIn 0.2s ease-out;
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .settings-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem 1.25rem;
            border-bottom: 1px solid var(--color-border, #e5e7eb);
          }

          .settings-title {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--color-text-primary, #111827);
          }

          .settings-close-button {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0.375rem;
            background: none;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            color: var(--color-text-secondary, #6b7280);
            transition: all 0.15s;
          }

          .settings-close-button:hover {
            background-color: var(--color-hover, #f3f4f6);
            color: var(--color-text-primary, #111827);
          }

          .settings-feedback {
            margin: 0.5rem 1.25rem;
            padding: 0.75rem 1rem;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 500;
          }

          .settings-feedback--success {
            background-color: #d1fae5;
            color: #065f46;
          }

          .settings-feedback--error {
            background-color: #fee2e2;
            color: #991b1b;
          }

          .settings-content {
            padding: 1.25rem;
            overflow-y: auto;
          }

          .settings-section {
            margin-bottom: 1.5rem;
          }

          .settings-section:last-child {
            margin-bottom: 0;
          }

          .settings-section-header {
            margin: 0 0 1rem 0;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--color-text-muted, #9ca3af);
          }

          /* Toggle Switch */
          .settings-toggle-row {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 1rem;
            padding: 0.75rem 0;
          }

          .settings-toggle-content {
            flex: 1;
          }

          .settings-toggle-label {
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--color-text-primary, #374151);
            cursor: pointer;
          }

          .settings-toggle-description {
            margin: 0.25rem 0 0 0;
            font-size: 0.75rem;
            color: var(--color-text-muted, #9ca3af);
          }

          .settings-toggle-switch {
            position: relative;
            width: 44px;
            height: 24px;
            flex-shrink: 0;
          }

          .settings-checkbox {
            position: absolute;
            opacity: 0;
            width: 100%;
            height: 100%;
            cursor: pointer;
            z-index: 1;
            margin: 0;
          }

          .settings-slider {
            position: absolute;
            inset: 0;
            background-color: #d1d5db;
            border-radius: 12px;
            transition: background-color 0.2s;
          }

          .settings-slider::before {
            content: '';
            position: absolute;
            width: 20px;
            height: 20px;
            left: 2px;
            top: 2px;
            background-color: white;
            border-radius: 50%;
            transition: transform 0.2s;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          .settings-checkbox:checked + .settings-slider {
            background-color: #10b981;
          }

          .settings-checkbox:checked + .settings-slider::before {
            transform: translateX(20px);
          }

          .settings-checkbox:focus + .settings-slider {
            outline: 2px solid #10b981;
            outline-offset: 2px;
          }

          /* Select */
          .settings-select-row {
            padding: 0.75rem 0;
          }

          .settings-select-content {
            margin-bottom: 0.5rem;
          }

          .settings-select-label {
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--color-text-primary, #374151);
          }

          .settings-select-description {
            margin: 0.25rem 0 0 0;
            font-size: 0.75rem;
            color: var(--color-text-muted, #9ca3af);
          }

          .settings-select {
            width: 100%;
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
            border: 1px solid var(--color-border, #d1d5db);
            border-radius: 6px;
            background-color: var(--color-surface, white);
            color: var(--color-text-primary, #374151);
            cursor: pointer;
          }

          .settings-select:focus {
            outline: 2px solid #10b981;
            outline-offset: 2px;
          }

          /* Slider */
          .settings-slider-row {
            padding: 0.75rem 0;
          }

          .settings-slider-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 0.25rem;
          }

          .settings-slider-label {
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--color-text-primary, #374151);
          }

          .settings-slider-value {
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--color-text-secondary, #6b7280);
          }

          .settings-slider-description {
            margin: 0 0 0.5rem 0;
            font-size: 0.75rem;
            color: var(--color-text-muted, #9ca3af);
          }

          .settings-range-slider {
            width: 100%;
            height: 6px;
            cursor: pointer;
            accent-color: #10b981;
          }

          /* Buttons */
          .settings-button-group {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 1rem;
          }

          .settings-button {
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
            font-weight: 500;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.15s;
          }

          .settings-button--primary {
            background-color: #10b981;
            color: white;
            border: none;
          }

          .settings-button--primary:hover {
            background-color: #059669;
          }

          .settings-button--secondary {
            background-color: var(--color-surface, white);
            color: var(--color-text-primary, #374151);
            border: 1px solid var(--color-border, #d1d5db);
          }

          .settings-button--secondary:hover {
            background-color: var(--color-hover, #f3f4f6);
          }

          .settings-button--danger {
            background-color: #ef4444;
            color: white;
            border: none;
          }

          .settings-button--danger:hover {
            background-color: #dc2626;
          }

          .settings-file-input {
            display: none;
          }

          .settings-danger-zone {
            padding-top: 1rem;
            border-top: 1px solid var(--color-border, #e5e7eb);
          }

          /* Dialog */
          .settings-dialog-overlay {
            position: absolute;
            inset: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            border-radius: 12px;
          }

          .settings-dialog {
            background-color: var(--color-surface, white);
            border-radius: 8px;
            padding: 1.25rem;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

          .settings-dialog-title {
            margin: 0 0 0.5rem 0;
            font-size: 1rem;
            font-weight: 600;
            color: var(--color-text-primary, #111827);
          }

          .settings-dialog-description {
            margin: 0 0 1rem 0;
            font-size: 0.875rem;
            color: var(--color-text-secondary, #6b7280);
          }

          .settings-import-textarea {
            width: 100%;
            padding: 0.75rem;
            font-size: 0.8125rem;
            font-family: monospace;
            border: 1px solid var(--color-border, #d1d5db);
            border-radius: 6px;
            resize: vertical;
            margin-bottom: 0.5rem;
          }

          .settings-import-error {
            margin: 0 0 0.5rem 0;
            font-size: 0.75rem;
            color: #dc2626;
          }

          .settings-dialog-actions {
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
          }

          /* Dark mode support */
          .dark .settings-panel {
            background-color: var(--color-surface-dark, #1f2937);
          }

          .dark .settings-title,
          .dark .settings-toggle-label,
          .dark .settings-select-label,
          .dark .settings-slider-label,
          .dark .settings-dialog-title {
            color: var(--color-text-primary-dark, #f9fafb);
          }

          .dark .settings-toggle-description,
          .dark .settings-select-description,
          .dark .settings-slider-description,
          .dark .settings-dialog-description {
            color: var(--color-text-muted-dark, #9ca3af);
          }

          .dark .settings-close-button {
            color: var(--color-text-secondary-dark, #9ca3af);
          }

          .dark .settings-close-button:hover {
            background-color: var(--color-hover-dark, #374151);
            color: var(--color-text-primary-dark, #f9fafb);
          }

          .dark .settings-header,
          .dark .settings-danger-zone {
            border-color: var(--color-border-dark, #374151);
          }

          .dark .settings-select,
          .dark .settings-import-textarea,
          .dark .settings-dialog {
            background-color: var(--color-surface-dark, #1f2937);
            border-color: var(--color-border-dark, #4b5563);
            color: var(--color-text-primary-dark, #f9fafb);
          }

          .dark .settings-button--secondary {
            background-color: var(--color-surface-dark, #1f2937);
            border-color: var(--color-border-dark, #4b5563);
            color: var(--color-text-primary-dark, #f9fafb);
          }

          .dark .settings-button--secondary:hover {
            background-color: var(--color-hover-dark, #374151);
          }

          .dark .settings-slider {
            background-color: #4b5563;
          }

          .dark .settings-feedback--success {
            background-color: #064e3b;
            color: #a7f3d0;
          }

          .dark .settings-feedback--error {
            background-color: #7f1d1d;
            color: #fecaca;
          }
        `}</style>
      </div>
    </div>
  );
}

export default SettingsPanel;
