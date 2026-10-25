import { useCallback, useEffect, useState } from "react";
import {
  fetchAutostartStatus,
  updateAutostartStatus,
} from "../services/autostartService";

export interface UseAutostartResult {
  isAutostartEnabled: boolean;
  isUpdatingAutostart: boolean;
  toggleAutostart: (shouldEnable: boolean) => Promise<void>;
}

export function useAutostart(): UseAutostartResult {
  const [isAutostartEnabled, setIsAutostartEnabled] = useState<boolean>(false);
  const [isUpdatingAutostart, setIsUpdatingAutostart] =
    useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function synchronizeInitialState(): Promise<void> {
      const currentStatus = await fetchAutostartStatus();
      if (isMounted) {
        setIsAutostartEnabled(currentStatus);
      }
    }

    void synchronizeInitialState();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleAutostart = useCallback(async (shouldEnable: boolean) => {
    setIsUpdatingAutostart(true);
    try {
      const updatedStatus = await updateAutostartStatus(shouldEnable);
      setIsAutostartEnabled(updatedStatus);
    } catch (error) {
      console.error("Failed to toggle Windows autostart setting:", error);
    } finally {
      setIsUpdatingAutostart(false);
    }
  }, []);

  return {
    isAutostartEnabled,
    isUpdatingAutostart,
    toggleAutostart,
  };
}
