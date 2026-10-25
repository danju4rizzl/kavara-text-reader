import { useCallback, useEffect, useState } from "react";
import {
  fetchAvailableSystemVoices,
  loadPersistedSettings,
  savePersistedSettings,
  synchronizeBackendSettings,
} from "../services/settingsService";
import {
  type AppSettings,
  DEFAULT_APP_SETTINGS,
  type SystemVoiceOption,
} from "../types/settings";

export interface UseAppSettingsResult {
  settings: AppSettings;
  availableVoices: ReadonlyArray<SystemVoiceOption>;
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => void;
  resetSettingsToDefaults: () => void;
}

export function useAppSettings(): UseAppSettingsResult {
  const [settings, setSettings] = useState<AppSettings>(() =>
    loadPersistedSettings()
  );
  const [availableVoices, setAvailableVoices] = useState<
    ReadonlyArray<SystemVoiceOption>
  >([]);

  useEffect(() => {
    void fetchAvailableSystemVoices().then((voices) => {
      setAvailableVoices(voices);
    });
  }, []);

  useEffect(() => {
    savePersistedSettings(settings);
    void synchronizeBackendSettings(settings);
  }, [settings]);

  const updateSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      setSettings((previousSettings) => ({
        ...previousSettings,
        [key]: value,
      }));
    },
    []
  );

  const resetSettingsToDefaults = useCallback(() => {
    setSettings(DEFAULT_APP_SETTINGS);
  }, []);

  return {
    settings,
    availableVoices,
    updateSetting,
    resetSettingsToDefaults,
  };
}
