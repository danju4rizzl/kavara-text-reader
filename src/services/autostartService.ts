import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";

export async function fetchAutostartStatus(): Promise<boolean> {
  try {
    return await isEnabled();
  } catch (error) {
    console.warn("Unable to read Windows autostart state:", error);
    return false;
  }
}

export async function updateAutostartStatus(
  shouldEnable: boolean
): Promise<boolean> {
  if (shouldEnable) {
    await enable();
  } else {
    await disable();
  }
  return await isEnabled();
}
