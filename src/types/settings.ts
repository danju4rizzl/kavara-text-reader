export type ActivePanelTab = "settings" | "guide";

export interface SystemVoiceOption {
  id: string;
  name: string;
  language: string;
  gender: string | null;
}

export interface AppInstallationStatus {
  isInstalled: boolean;
  installDirectory: string;
  installedExecutablePath: string;
  hasDesktopShortcut: boolean;
  hasStartMenuShortcut: boolean;
}

export interface AppSettings {
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  alwaysOnTop: boolean;
  widgetOpacity: number;
  clipboardDelayMs: number;
  selectedVoiceId: string;
}

export interface BackendSpeechConfiguration {
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  clipboardDelayMs: number;
  selectedVoiceId: string | null;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  speechRate: 1.0,
  speechPitch: 1.0,
  speechVolume: 1.0,
  alwaysOnTop: true,
  widgetOpacity: 0.94,
  clipboardDelayMs: 95,
  selectedVoiceId: "",
};

export const APP_DISPLAY_NAME = "KV reader";

export const SAMPLE_VOICE_PREVIEW_TEXT =
  `${APP_DISPLAY_NAME} is ready. Highlight any text and press Control, Alt, S to listen instantly.`;
