import React from "react";
import appLogoUrl from "../../app-logo-v1.png";
import { APP_DISPLAY_NAME } from "../types/settings";

interface StatusIndicatorProps {
  isSpeaking: boolean;
  previewText: string;
  size?: "compact" | "header";
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  isSpeaking,
  previewText,
  size = "compact",
}) => {
  const wrapperClassName = [
    "brand-status-badge",
    size === "header"
      ? "brand-status-badge--header"
      : "brand-status-badge--compact",
    isSpeaking ? "brand-status-badge--speaking" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const dotClassName = isSpeaking
    ? "pulse-dot pulse-dot--speaking"
    : "pulse-dot";

  const tooltipText = isSpeaking
    ? `Speaking: ${previewText || "Selected text"} (Press Ctrl+Alt+S to restart)`
    : `${APP_DISPLAY_NAME} — Listener Active (Ctrl+Alt+S)`;

  return (
    <div
      className={wrapperClassName}
      title={tooltipText}
      data-tauri-drag-region
    >
      <img
        src={appLogoUrl}
        alt={APP_DISPLAY_NAME}
        className="brand-status-badge__logo"
        draggable={false}
        data-tauri-drag-region
      />
      <span className={dotClassName} data-tauri-drag-region />
    </div>
  );
};
