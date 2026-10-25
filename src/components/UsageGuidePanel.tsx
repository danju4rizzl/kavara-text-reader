import React from "react";
import { APP_DISPLAY_NAME } from "../types/settings";

interface UsageGuidePanelProps {
  onSwitchToSettings: () => void;
}

interface GuideStepItem {
  stepNumber: string;
  title: string;
  shortcut?: string;
  description: string;
}

const USAGE_GUIDE_STEPS: ReadonlyArray<GuideStepItem> = [
  {
    stepNumber: "01",
    title: "Highlight & Speak Anywhere",
    shortcut: "Ctrl + Alt + S",
    description: `Highlight text in any browser, PDF, or desktop app, then press Ctrl + Alt + S. ${APP_DISPLAY_NAME} copies the selection and reads it aloud automatically.`,
  },
  {
    stepNumber: "02",
    title: "Read Clipboard with One Click",
    shortcut: "▶ Play Button",
    description:
      "Copy any text normally (Ctrl + C), then click the ▶ Play button on the floating bubble to start reading your clipboard immediately.",
  },
  {
    stepNumber: "03",
    title: "Stop Speech Instantly",
    shortcut: "Ctrl + Alt + X",
    description:
      "Press Ctrl + Alt + X from any application or click the red ◼ Stop button on the bubble to silence active speech right away.",
  },
  {
    stepNumber: "04",
    title: "Reposition & Customize",
    shortcut: "Drag / ⚙️",
    description:
      "Drag the bubble anywhere on your screen by grabbing its background or status dot. Open ⚙️ Settings to tune speed, pitch, volume, and Windows startup.",
  },
];

export const UsageGuidePanel: React.FC<UsageGuidePanelProps> = ({
  onSwitchToSettings,
}) => {
  return (
    <div className="panel-body">
      <div className="shortcut-banner">
        <div className="shortcut-chip">
          <kbd className="shortcut-chip__keys">Ctrl + Alt + S</kbd>
          <span className="shortcut-chip__label">Speak Selection</span>
        </div>
        <div className="shortcut-chip">
          <kbd className="shortcut-chip__keys">Ctrl + Alt + X</kbd>
          <span className="shortcut-chip__label">Stop Reading</span>
        </div>
      </div>

      <div className="guide-list">
        {USAGE_GUIDE_STEPS.map((step) => (
          <article key={step.stepNumber} className="guide-card">
            <div className="guide-card__header">
              <span className="guide-card__badge">{step.stepNumber}</span>
              <h4 className="guide-card__title">{step.title}</h4>
              {step.shortcut && (
                <kbd className="guide-card__shortcut">{step.shortcut}</kbd>
              )}
            </div>
            <p className="guide-card__description">{step.description}</p>
          </article>
        ))}
      </div>

      <div className="guide-tip">
        <strong>Tip:</strong> Reading from a heavy PDF or browser? Increase the{" "}
        <em>Selection Copy Delay</em> in{" "}
        <button
          type="button"
          className="inline-link-button"
          onClick={onSwitchToSettings}
        >
          Settings
        </button>{" "}
        so Windows has extra time to capture your selection.
      </div>
    </div>
  );
};
