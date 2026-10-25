import { useCallback, useEffect, useState } from "react";
import {
  fetchInstallationStatus,
  installApplicationForUser,
  quitApplicationCompletely,
  uninstallApplicationForUser,
} from "../services/installationService";
import { type AppInstallationStatus } from "../types/settings";

export interface UseAppInstallationResult {
  installationStatus: AppInstallationStatus;
  isProcessingInstallAction: boolean;
  installationFeedback: string | null;
  installApplication: () => Promise<void>;
  uninstallApplication: () => Promise<void>;
  exitApplication: () => Promise<void>;
}

const INITIAL_STATUS: AppInstallationStatus = {
  isInstalled: false,
  installDirectory: "%LOCALAPPDATA%\\Programs\\KVReader",
  installedExecutablePath: "%LOCALAPPDATA%\\Programs\\KVReader\\KV reader.exe",
  hasDesktopShortcut: false,
  hasStartMenuShortcut: false,
};

export function useAppInstallation(): UseAppInstallationResult {
  const [installationStatus, setInstallationStatus] =
    useState<AppInstallationStatus>(INITIAL_STATUS);
  const [isProcessingInstallAction, setIsProcessingInstallAction] =
    useState<boolean>(false);
  const [installationFeedback, setInstallationFeedback] = useState<
    string | null
  >(null);

  useEffect(() => {
    void fetchInstallationStatus().then((status) => {
      setInstallationStatus(status);
    });
  }, []);

  const installApplication = useCallback(async () => {
    setIsProcessingInstallAction(true);
    setInstallationFeedback(null);
    try {
      const updatedStatus = await installApplicationForUser();
      setInstallationStatus(updatedStatus);
      setInstallationFeedback(
        "Installed to Start Menu, Desktop & Windows Apps."
      );
    } catch (error) {
      setInstallationFeedback(
        error instanceof Error
          ? error.message
          : "Installation failed. Please try again."
      );
    } finally {
      setIsProcessingInstallAction(false);
    }
  }, []);

  const uninstallApplication = useCallback(async () => {
    setIsProcessingInstallAction(true);
    setInstallationFeedback(null);
    try {
      await uninstallApplicationForUser();
    } catch (error) {
      setIsProcessingInstallAction(false);
      setInstallationFeedback(
        error instanceof Error
          ? error.message
          : "Uninstall failed. Please try again."
      );
    }
  }, []);

  const exitApplication = useCallback(async () => {
    try {
      await quitApplicationCompletely();
    } catch (error) {
      console.error("Failed to exit application:", error);
    }
  }, []);

  return {
    installationStatus,
    isProcessingInstallAction,
    installationFeedback,
    installApplication,
    uninstallApplication,
    exitApplication,
  };
}
