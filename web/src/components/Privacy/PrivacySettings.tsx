/**
 * PrivacySettings Component
 *
 * Provides user interface for managing privacy settings and analytics preferences.
 * Displays current analytics status and allows users to opt-out.
 *
 * @module components/Privacy/PrivacySettings
 */

import { useCallback } from 'react';
import { useAnalyticsStore } from '@/stores/useAnalyticsStore';
import './PrivacySettings.css';

// Logging helper for debugging
const DEBUG = import.meta.env?.DEV ?? false;
const log = (message: string, ...args: unknown[]): void => {
  if (DEBUG) {
    console.log(`[PrivacySettings] ${message}`, ...args);
  }
};

/**
 * Props for the PrivacySettings component
 */
export interface PrivacySettingsProps {
  /** Additional CSS class name */
  className?: string;
  /** Data test ID for testing */
  testId?: string;
  /** Whether to show the full policy or just settings */
  showPolicy?: boolean;
  /** Callback when settings change */
  onSettingsChange?: (enabled: boolean) => void;
}

/**
 * PrivacySettings component allows users to view and control their privacy preferences.
 *
 * Features:
 * - Toggle analytics on/off
 * - See Do Not Track status
 * - View what data is collected
 * - Export/clear personal data
 *
 * @example
 * ```tsx
 * <PrivacySettings
 *   showPolicy
 *   onSettingsChange={(enabled) => console.log('Analytics:', enabled)}
 * />
 * ```
 */
export function PrivacySettings({
  className = '',
  testId = 'privacy-settings',
  showPolicy = true,
  onSettingsChange,
}: PrivacySettingsProps): React.ReactElement {
  // Analytics store
  const enabled = useAnalyticsStore((state) => state.enabled);
  const doNotTrackDetected = useAnalyticsStore((state) => state.doNotTrackDetected);
  const aggregate = useAnalyticsStore((state) => state.aggregate);
  const enable = useAnalyticsStore((state) => state.enable);
  const disable = useAnalyticsStore((state) => state.disable);
  const exportData = useAnalyticsStore((state) => state.exportData);
  const clearData = useAnalyticsStore((state) => state.clearData);
  const refreshAggregate = useAnalyticsStore((state) => state.refreshAggregate);

  // Toggle analytics
  const handleToggle = useCallback(() => {
    if (enabled) {
      log('Disabling analytics');
      disable();
      onSettingsChange?.(false);
    } else {
      log('Enabling analytics');
      enable();
      onSettingsChange?.(true);
    }
  }, [enabled, enable, disable, onSettingsChange]);

  // Export data
  const handleExport = useCallback(() => {
    log('Exporting analytics data');
    refreshAggregate();
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ghost-note-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportData, refreshAggregate]);

  // Clear data
  const handleClear = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
      log('Clearing analytics data');
      clearData();
    }
  }, [clearData]);

  const containerClass = ['privacy-settings', className].filter(Boolean).join(' ').trim();

  // Calculate totals from aggregate
  const totalEvents = aggregate
    ? Object.values(aggregate.pageViews).reduce((sum, count) => sum + count, 0) +
      Object.values(aggregate.featureUsage).reduce((sum, count) => sum + count, 0) +
      Object.values(aggregate.errors).reduce((sum, count) => sum + count, 0)
    : 0;

  return (
    <div className={containerClass} data-testid={testId}>
      <h2 className="privacy-settings__title">Privacy Settings</h2>

      {/* DNT Status Banner */}
      {doNotTrackDetected && (
        <div
          className="privacy-settings__banner privacy-settings__banner--dnt"
          role="status"
          data-testid={`${testId}-dnt-banner`}
        >
          <span className="privacy-settings__banner-icon" aria-hidden="true">
            🛡️
          </span>
          <span>
            <strong>Do Not Track detected.</strong> Analytics are automatically disabled because your
            browser has requested not to be tracked.
          </span>
        </div>
      )}

      {/* Analytics Toggle */}
      <div className="privacy-settings__section">
        <h3 className="privacy-settings__section-title">Analytics</h3>
        <div className="privacy-settings__toggle-row">
          <label
            htmlFor="analytics-toggle"
            className="privacy-settings__label"
            id="analytics-toggle-label"
          >
            <span className="privacy-settings__label-text">Enable anonymous analytics</span>
            <span className="privacy-settings__label-description">
              Help improve Ghost Note by sharing anonymous usage data
            </span>
          </label>
          <button
            type="button"
            id="analytics-toggle"
            role="switch"
            aria-checked={enabled && !doNotTrackDetected}
            aria-labelledby="analytics-toggle-label"
            className={`privacy-settings__toggle ${enabled && !doNotTrackDetected ? 'privacy-settings__toggle--on' : ''}`}
            onClick={handleToggle}
            disabled={doNotTrackDetected}
            data-testid={`${testId}-toggle`}
          >
            <span className="privacy-settings__toggle-slider" />
            <span className="sr-only">{enabled ? 'Enabled' : 'Disabled'}</span>
          </button>
        </div>
        <p className="privacy-settings__status">
          Status:{' '}
          <span
            className={`privacy-settings__status-value ${enabled && !doNotTrackDetected ? 'privacy-settings__status-value--active' : ''}`}
          >
            {doNotTrackDetected ? 'Disabled (DNT)' : enabled ? 'Active' : 'Disabled'}
          </span>
        </p>
      </div>

      {/* Data Summary */}
      <div className="privacy-settings__section">
        <h3 className="privacy-settings__section-title">Your Data</h3>
        <div className="privacy-settings__stats">
          <div className="privacy-settings__stat">
            <span className="privacy-settings__stat-value">{totalEvents}</span>
            <span className="privacy-settings__stat-label">Events stored locally</span>
          </div>
          <div className="privacy-settings__stat">
            <span className="privacy-settings__stat-value">{aggregate?.uniqueSessions || 0}</span>
            <span className="privacy-settings__stat-label">Sessions</span>
          </div>
        </div>
        <div className="privacy-settings__actions">
          <button
            type="button"
            className="privacy-settings__button privacy-settings__button--secondary"
            onClick={handleExport}
            data-testid={`${testId}-export`}
          >
            Export My Data
          </button>
          <button
            type="button"
            className="privacy-settings__button privacy-settings__button--danger"
            onClick={handleClear}
            data-testid={`${testId}-clear`}
          >
            Clear All Data
          </button>
        </div>
      </div>

      {/* Privacy Policy */}
      {showPolicy && (
        <div className="privacy-settings__section">
          <h3 className="privacy-settings__section-title">What We Collect</h3>
          <div className="privacy-settings__policy">
            <h4 className="privacy-settings__policy-heading">We DO collect:</h4>
            <ul className="privacy-settings__list">
              <li>Anonymous page views (which features you use)</li>
              <li>Feature usage counts (how often features are used)</li>
              <li>Error reports (to fix bugs)</li>
              <li>Performance metrics (to improve speed)</li>
            </ul>

            <h4 className="privacy-settings__policy-heading">We DO NOT collect:</h4>
            <ul className="privacy-settings__list privacy-settings__list--negative">
              <li>Your poems or lyrics</li>
              <li>Personal information (name, email, etc.)</li>
              <li>IP addresses or location</li>
              <li>Device identifiers</li>
              <li>Cookies for tracking</li>
              <li>Any data that could identify you</li>
            </ul>

            <h4 className="privacy-settings__policy-heading">Your Rights:</h4>
            <ul className="privacy-settings__list">
              <li>
                <strong>Opt-out anytime:</strong> Toggle analytics off above
              </li>
              <li>
                <strong>Export your data:</strong> Download all stored analytics data
              </li>
              <li>
                <strong>Delete your data:</strong> Clear all analytics data permanently
              </li>
              <li>
                <strong>Do Not Track:</strong> We automatically respect your browser's DNT setting
              </li>
            </ul>

            <p className="privacy-settings__policy-note">
              All analytics data is stored locally on your device. We do not send any data to
              external servers. This tool is designed to be privacy-respecting and GDPR compliant.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PrivacySettings;
