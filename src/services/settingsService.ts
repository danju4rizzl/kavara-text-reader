import { invoke } from "@tauri-apps/api/core";
import {
  type AppSettings,
  type BackendSpeechConfiguration,
  DEFAULT_APP_SETTINGS,
  type SystemVoiceOption,
} from "../types/settings";

const SETTINGS_STORAGE_KEY = "kavara_text_to_voice_settings_v1";

export function loadPersistedSettings(): AppSettings {
  try {
    const rawSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!rawSettings) {
      return DEFAULT_APP_SETTINGS;
    }

    const parsedSettings = JSON.parse(rawSettings) as Partial<AppSettings>;
    return {
      speechRate: clampNumber(
        parsedSettings.speechRate ?? DEFAULT_APP_SETTINGS.speechRate,
        0.5,
        2.5
      ),
      speechPitch: clampNumber(
        parsedSettings.speechPitch ?? DEFAULT_APP_SETTINGS.speechPitch,
        0.5,
        1.5
      ),
      speechVolume: clampNumber(
        parsedSettings.speechVolume ?? DEFAULT_APP_SETTINGS.speechVolume,
        0.0,
        1.0
      ),
      alwaysOnTop:
        parsedSettings.alwaysOnTop ?? DEFAULT_APP_SETTINGS.alwaysOnTop,
      widgetOpacity: clampNumber(
        parsedSettings.widgetOpacity ?? DEFAULT_APP_SETTINGS.widgetOpacity,
        0.4,
        1.0
      ),
      clipboardDelayMs: clampNumber(
        parsedSettings.clipboardDelayMs ??
          DEFAULT_APP_SETTINGS.clipboardDelayMs,
        50,
        250
      ),
      selectedVoiceId:
        typeof parsedSettings.selectedVoiceId === "string"
          ? parsedSettings.selectedVoiceId
          : DEFAULT_APP_SETTINGS.selectedVoiceId,
    };
  } catch (error) {
    console.warn("Unable to read persisted KV reader settings:", error);
    return DEFAULT_APP_SETTINGS;
  }
}

export function savePersistedSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn("Unable to save KV reader settings:", error);
  }
}

export async function synchronizeBackendSettings(
  settings: AppSettings
): Promise<void> {
  const speechConfiguration: BackendSpeechConfiguration = {
    speechRate: settings.speechRate,
    speechPitch: settings.speechPitch,
    speechVolume: settings.speechVolume,
    clipboardDelayMs: Math.round(settings.clipboardDelayMs),
    selectedVoiceId: settings.selectedVoiceId || null,
  };

  try {
    await invoke("update_speech_settings", { settings: speechConfiguration });
    await invoke("set_window_always_on_top", {
      alwaysOnTop: settings.alwaysOnTop,
    });
  } catch (error) {
    console.warn("Unable to synchronize settings with Tauri backend:", error);
  }
}

export async function fetchAvailableSystemVoices(): Promise<SystemVoiceOption[]> {
  try {
    return await invoke<SystemVoiceOption[]>("list_system_voices");
  } catch (error) {
    console.warn("Unable to enumerate system voices from Tauri backend:", error);
    return [];
  }
}

export async function updateWidgetWindowExpansion(
  isExpanded: boolean
): Promise<void> {
  try {
    await invoke("set_widget_expanded", { expanded: isExpanded });
  } catch (error) {
    console.warn("Unable to resize Tauri widget window:", error);
  }
}

function clampNumber(value: number, minimum: number, maximum: number): number {
  if (Number.isNaN(value)) {
    return minimum;
  }
  return Math.min(Math.max(value, minimum), maximum);
}
