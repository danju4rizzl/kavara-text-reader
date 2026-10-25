import React from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { APP_DISPLAY_NAME } from "../types/settings";

export const CloseWindowButton: React.FC = () => {
  const handleCloseWindow = async (
    event: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    event.stopPropagation();
    try {
      await getCurrentWindow().close();
    } catch (error) {
      console.error("Failed to close window:", error);
    }
  };

  return (
    <button
      type="button"
      className="close-button"
      onClick={(event) => void handleCloseWindow(event)}
      title={`Close ${APP_DISPLAY_NAME}`}
      aria-label={`Close ${APP_DISPLAY_NAME}`}
    >
      ×
    </button>
  );
};
