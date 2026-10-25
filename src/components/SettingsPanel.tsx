import React, { useState } from "react";
import {
  APP_DISPLAY_NAME,
  type AppInstallationStatus,
  type AppSettings,
  type SystemVoiceOption,
} from "../types/settings";
import { AutostartToggle } from "./AutostartToggle";

interface SettingsPanelProps {
  settings: AppSettings;
  availableVoices: ReadonlyArray<SystemVoiceOption>;
  installationStatus: AppInstallationStatus;
  isProcessingInstallAction: boolean;
  installationFeedback: string | null;
  isAutostartEnabled: boolean;
  isUpdatingAutostart: boolean;
  isSpeaking: boolean;
  onToggleAutostart: (shouldEnable: boolean) => void;
  onUpdateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => void;
  onTestVoice: () => void;
  onStopVoice: () => void;
  onResetDefaults: () => void;
  onInstallApp: () => void;
  onUninstallApp: () => void;
  onExitApp: () => void;
}

function formatVoiceOptionLabel(voice: SystemVoiceOption): string {
  const details = [voice.language, voice.gender].filter(Boolean).join(" · ");
  return details ? `${voice.name} (${details})` : voice.name;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  availableVoices,
  installationStatus,
  isProcessingInstallAction,
  installationFeedback,
  isAutostartEnabled,
  isUpdatingAutostart,
  isSpeaking,
  onToggleAutostart,
  onUpdateSetting,
  onTestVoice,
  onStopVoice,
  onResetDefaults,
  onInstallApp,
  onUninstallApp,
  onExitApp,
}) => {
  const [isConfirmingUninstall, setIsConfirmingUninstall] =
    useState<boolean>(false);

  const handleUninstallClick = (): void => {
    if (!isConfirmingUninstall) {
      setIsConfirmingUninstall(true);
      return;
    }
    setIsConfirmingUninstall(false);
    onUninstallApp();
  };
  return (
    <div className="panel-body">
      <section className="settings-section">
        <h3 className="settings-section__heading">System &amp; Window</h3>

        <AutostartToggle
          isChecked={isAutostartEnabled}
          isDisabled={isUpdatingAutostart}
          onToggle={onToggleAutostart}
        />

        <label
          className="setting-row setting-row--interactive"
          title={`Keep ${APP_DISPLAY_NAME} visible above all other desktop windows`}
        >
          <div className="setting-row__info">
            <span className="setting-row__title">Always on Top</span>
            <span className="setting-row__subtitle">
              Pin floating bubble above active windows
            </span>
          </div>
          <input
            type="checkbox"
            className="toggle-switch"
            checked={settings.alwaysOnTop}
            onChange={(event) =>
              onUpdateSetting("alwaysOnTop", event.target.checked)
            }
          />
        </label>

        <div className="setting-control">
          <div className="setting-control__header">
            <span className="setting-row__title">Widget Opacity</span>
            <span className="setting-badge">
              {Math.round(settings.widgetOpacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            className="range-slider"
            min={0.4}
            max={1.0}
            step={0.02}
            value={settings.widgetOpacity}
            onChange={(event) =>
              onUpdateSetting("widgetOpacity", parseFloat(event.target.value))
            }
          />
        </div>
      </section>

      <section className="settings-section">
        <h3 className="settings-section__heading">Speech &amp; Playback</h3>

        <div className="setting-control">
          <div className="setting-control__header">
            <span className="setting-row__title">Reading Speed</span>
            <span className="setting-badge">
              {settings.speechRate.toFixed(2)}x
            </span>
          </div>
          <input
            type="range"
            className="range-slider"
            min={0.5}
            max={2.5}
            step={0.05}
            value={settings.speechRate}
            onChange={(event) =>
              onUpdateSetting("speechRate", parseFloat(event.target.value))
            }
          />
        </div>

        <div className="setting-control">
          <div className="setting-control__header">
            <span className="setting-row__title">Voice Pitch</span>
            <span className="setting-badge">
              {settings.speechPitch.toFixed(2)}x
            </span>
          </div>
          <input
            type="range"
            className="range-slider"
            min={0.5}
            max={1.5}
            step={0.05}
            value={settings.speechPitch}
            onChange={(event) =>
              onUpdateSetting("speechPitch", parseFloat(event.target.value))
            }
          />
        </div>

        <div className="setting-control">
          <div className="setting-control__header">
            <span className="setting-row__title">Voice Volume</span>
            <span className="setting-badge">
              {Math.round(settings.speechVolume * 100)}%
            </span>
          </div>
          <input
            type="range"
            className="range-slider"
            min={0.0}
            max={1.0}
            step={0.05}
            value={settings.speechVolume}
            onChange={(event) =>
              onUpdateSetting("speechVolume", parseFloat(event.target.value))
            }
          />
        </div>

        <div className="setting-control">
          <div className="setting-control__header">
            <span className="setting-row__title">Selection Copy Delay</span>
            <span className="setting-badge">{settings.clipboardDelayMs} ms</span>
          </div>
          <input
            type="range"
            className="range-slider"
            min={50}
            max={250}
            step={5}
            value={settings.clipboardDelayMs}
            onChange={(event) =>
              onUpdateSetting(
                "clipboardDelayMs",
                parseInt(event.target.value, 10)
              )
            }
          />
        </div>
      </section>

      <section className="settings-section">
        <h3 className="settings-section__heading">Voice Engine</h3>

        <div className="setting-control">
          <div className="setting-control__header">
            <label htmlFor="system-voice-select" className="setting-row__title">
              System Voice
            </label>
            <span className="setting-badge">
              {availableVoices.length > 0
                ? `${availableVoices.length} installed`
                : "Windows SAPI"}
            </span>
          </div>
          <select
            id="system-voice-select"
            className="voice-select"
            value={settings.selectedVoiceId}
            onChange={(event) =>
              onUpdateSetting("selectedVoiceId", event.target.value)
            }
          >
            <option value="">System Default (Windows SAPI)</option>
            {availableVoices.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {formatVoiceOptionLabel(voice)}
              </option>
            ))}
          </select>
        </div>

        <div className="voice-roadmap-card">
          <div className="voice-roadmap-card__active">
            <span className="voice-status-dot" />
            <span>Windows Native SAPI (Offline)</span>
          </div>
          <p className="voice-roadmap-card__note">
            Additional offline neural voices &amp; ElevenLabs cloud voices are
            coming in a future update.
          </p>
        </div>
      </section>

      <section className="settings-section">
        <div className="setting-control__header">
          <h3 className="settings-section__heading">
            App Installation &amp; Taskbar
          </h3>
          <span
            className={`setting-badge ${
              installationStatus.isInstalled ? "" : "setting-badge--neutral"
            }`}
          >
            {installationStatus.isInstalled ? "Installed" : "Portable Mode"}
          </span>
        </div>

        <p className="install-card__description">
          Install {APP_DISPLAY_NAME} to your Desktop, Start Menu &amp; Windows
          Apps, or uninstall it completely. You can also close the app anytime
          from the Windows Taskbar or System Tray icon.
        </p>

        {installationFeedback && (
          <div className="install-feedback">{installationFeedback}</div>
        )}

        <div className="install-actions-grid">
          <button
            type="button"
            className="secondary-button secondary-button--accent"
            disabled={isProcessingInstallAction}
            onClick={() => {
              setIsConfirmingUninstall(false);
              onInstallApp();
            }}
          >
            {installationStatus.isInstalled
              ? "🔄 Repair Install"
              : "📥 Install App"}
          </button>

          <button
            type="button"
            className="secondary-button secondary-button--danger"
            disabled={isProcessingInstallAction}
            onClick={handleUninstallClick}
            onBlur={() => setIsConfirmingUninstall(false)}
          >
            {isConfirmingUninstall ? "⚠️ Confirm Uninstall" : "🗑️ Uninstall App"}
          </button>
        </div>
      </section>

      <div className="panel-footer panel-footer--three">
        <button
          type="button"
          className={`secondary-button ${
            isSpeaking ? "secondary-button--danger" : "secondary-button--accent"
          }`}
          onClick={isSpeaking ? onStopVoice : onTestVoice}
        >
          {isSpeaking ? "◼ Stop Preview" : "▶ Test Voice"}
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={onResetDefaults}
        >
          Reset Defaults
        </button>
        <button
          type="button"
          className="secondary-button secondary-button--danger"
          onClick={onExitApp}
          title={`Exit and close ${APP_DISPLAY_NAME} completely`}
        >
          ⏻ Exit App
        </button>
      </div>
    </div>
  );
};
