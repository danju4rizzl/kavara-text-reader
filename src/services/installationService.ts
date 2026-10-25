import { invoke } from "@tauri-apps/api/core";
import { type AppInstallationStatus } from "../types/settings";

const DEFAULT_INSTALLATION_STATUS: AppInstallationStatus = {
  isInstalled: false,
  installDirectory: "%LOCALAPPDATA%\\Programs\\KVReader",
  installedExecutablePath: "%LOCALAPPDATA%\\Programs\\KVReader\\KV reader.exe",
  hasDesktopShortcut: false,
  hasStartMenuShortcut: false,
};

export async function fetchInstallationStatus(): Promise<AppInstallationStatus> {
  try {
    return await invoke<AppInstallationStatus>("get_installation_status");
  } catch (error) {
    console.warn("Unable to query installation status:", error);
    return DEFAULT_INSTALLATION_STATUS;
  }
}

export async function installApplicationForUser(): Promise<AppInstallationStatus> {
  return await invoke<AppInstallationStatus>("install_application");
}

export async function uninstallApplicationForUser(): Promise<void> {
  await invoke("uninstall_application");
}

export async function quitApplicationCompletely(): Promise<void> {
  await invoke("quit_application");
}
