import React, { useCallback, useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { SettingsGearButton } from "./components/SettingsGearButton";
import { SettingsPanel } from "./components/SettingsPanel";
import { SpeechActionButton } from "./components/SpeechActionButton";
import { StatusIndicator } from "./components/StatusIndicator";
import { UsageGuidePanel } from "./components/UsageGuidePanel";
import { useAppInstallation } from "./hooks/useAppInstallation";
import { useAppSettings } from "./hooks/useAppSettings";
import { useAutostart } from "./hooks/useAutostart";
import { useSpeechReader } from "./hooks/useSpeechReader";
import { updateWidgetWindowExpansion } from "./services/settingsService";
import { APP_DISPLAY_NAME, type ActivePanelTab } from "./types/settings";

export const App: React.FC = () => {
  const [isPanelExpanded, setIsPanelExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActivePanelTab>("settings");

  const { isAutostartEnabled, isUpdatingAutostart, toggleAutostart } =
    useAutostart();
  const {
    isSpeaking,
    previewText,
    readClipboardNow,
    playSamplePreview,
    stopSpeakingNow,
  } = useSpeechReader();
  const {
    settings,
    availableVoices,
    updateSetting,
    resetSettingsToDefaults,
  } = useAppSettings();
  const {
    installationStatus,
    isProcessingInstallAction,
    installationFeedback,
    installApplication,
    uninstallApplication,
    exitApplication,
  } = useAppInstallation();

  useEffect(() => {
    window.focus();
  }, []);

  const openPanelWithTab = useCallback((targetTab: ActivePanelTab) => {
    setActiveTab(targetTab);
    setIsPanelExpanded(true);
    void updateWidgetWindowExpansion(true);
  }, []);

  const collapsePanelToBubble = useCallback(() => {
    setIsPanelExpanded(false);
    void updateWidgetWindowExpansion(false);
  }, []);

  const handleDragStart = async (
    event: React.MouseEvent<HTMLDivElement>
  ): Promise<void> => {
    const targetElement = event.target as HTMLElement;
    const isInteractiveElement =
      targetElement.closest("input, button, label, select, a") !== null;

    if (isInteractiveElement || event.button !== 0) {
      return;
    }

    try {
      const currentWindow = getCurrentWindow();
      await currentWindow.setFocus();
      await currentWindow.startDragging();
    } catch {
      // Fallback handled natively by data-tauri-drag-region
    }
  };

  if (!isPanelExpanded) {
    return (
      <div
        className={`widget ${isSpeaking ? "widget--speaking" : ""}`}
        style={{ opacity: settings.widgetOpacity }}
        data-tauri-drag-region
        onMouseDown={handleDragStart}
      >
        <StatusIndicator isSpeaking={isSpeaking} previewText={previewText} />
        <SpeechActionButton
          isSpeaking={isSpeaking}
          onReadClipboard={() => void readClipboardNow()}
          onStopSpeaking={() => void stopSpeakingNow()}
        />
        <span className="widget-title" data-tauri-drag-region>
          {isSpeaking ? "Speaking..." : APP_DISPLAY_NAME}
        </span>
        <SettingsGearButton
          onOpenSettings={() => openPanelWithTab("settings")}
        />
      </div>
    );
  }

  return (
    <div
      className="expanded-panel"
      style={{ opacity: Math.max(settings.widgetOpacity, 0.85) }}
    >
      <header
        className="expanded-panel__header"
        data-tauri-drag-region
        onMouseDown={handleDragStart}
      >
        <div className="expanded-panel__brand" data-tauri-drag-region>
          <StatusIndicator
            isSpeaking={isSpeaking}
            previewText={previewText}
            size="header"
          />
          <div className="expanded-panel__brand-copy" data-tauri-drag-region>
            <span className="expanded-panel__title" data-tauri-drag-region>
              {APP_DISPLAY_NAME}
            </span>
            <span className="expanded-panel__subtitle" data-tauri-drag-region>
              {isSpeaking ? "Speaking active selection..." : "Voice Reader"}
            </span>
          </div>
        </div>

        <div className="expanded-panel__actions">
          <SpeechActionButton
            isSpeaking={isSpeaking}
            onReadClipboard={() => void readClipboardNow()}
            onStopSpeaking={() => void stopSpeakingNow()}
          />
          <button
            type="button"
            className="icon-button icon-button--close"
            onClick={collapsePanelToBubble}
            title="Minimize back to floating bubble"
            aria-label="Minimize back to floating bubble"
          >
            ✕
          </button>
        </div>
      </header>

      <nav className="panel-tabs" aria-label="Panel sections">
        <button
          type="button"
          className={`panel-tab ${
            activeTab === "settings" ? "panel-tab--active" : ""
          }`}
          onClick={() => setActiveTab("settings")}
        >
          ⚙️ Settings
        </button>
        <button
          type="button"
          className={`panel-tab ${
            activeTab === "guide" ? "panel-tab--active" : ""
          }`}
          onClick={() => setActiveTab("guide")}
        >
          📖 Usage Guide
        </button>
      </nav>

      {activeTab === "settings" ? (
        <SettingsPanel
          settings={settings}
          availableVoices={availableVoices}
          installationStatus={installationStatus}
          isProcessingInstallAction={isProcessingInstallAction}
          installationFeedback={installationFeedback}
          isAutostartEnabled={isAutostartEnabled}
          isUpdatingAutostart={isUpdatingAutostart}
          isSpeaking={isSpeaking}
          onToggleAutostart={(shouldEnable) =>
            void toggleAutostart(shouldEnable)
          }
          onUpdateSetting={updateSetting}
          onTestVoice={() => void playSamplePreview()}
          onStopVoice={() => void stopSpeakingNow()}
          onResetDefaults={resetSettingsToDefaults}
          onInstallApp={() => void installApplication()}
          onUninstallApp={() => void uninstallApplication()}
          onExitApp={() => void exitApplication()}
        />
      ) : (
        <UsageGuidePanel onSwitchToSettings={() => setActiveTab("settings")} />
      )}
    </div>
  );
};

export default App;
