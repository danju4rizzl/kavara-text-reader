import React from "react";

interface SpeechActionButtonProps {
  isSpeaking: boolean;
  onReadClipboard: () => void;
  onStopSpeaking: () => void;
}

export const SpeechActionButton: React.FC<SpeechActionButtonProps> = ({
  isSpeaking,
  onReadClipboard,
  onStopSpeaking,
}) => {
  const handleButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ): void => {
    event.stopPropagation();
    if (isSpeaking) {
      onStopSpeaking();
    } else {
      onReadClipboard();
    }
  };

  return (
    <button
      type="button"
      className={`action-button ${isSpeaking ? "action-button--speaking" : ""}`}
      onClick={handleButtonClick}
      title={
        isSpeaking
          ? "Stop speaking (Ctrl+Alt+X)"
          : "Speak clipboard text (or press Ctrl+Alt+S on any selection)"
      }
      aria-label={isSpeaking ? "Stop speaking" : "Speak clipboard text"}
    >
      {isSpeaking ? "◼" : "▶"}
    </button>
  );
};
