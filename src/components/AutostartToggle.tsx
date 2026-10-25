import React from "react";
import { APP_DISPLAY_NAME } from "../types/settings";

interface AutostartToggleProps {
  isChecked: boolean;
  isDisabled: boolean;
  onToggle: (shouldEnable: boolean) => void;
}

export const AutostartToggle: React.FC<AutostartToggleProps> = ({
  isChecked,
  isDisabled,
  onToggle,
}) => {
  const handleCheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    onToggle(event.target.checked);
  };

  return (
    <label
      className="setting-row setting-row--interactive"
      title={`Launch ${APP_DISPLAY_NAME} automatically when Windows starts`}
    >
      <div className="setting-row__info">
        <span className="setting-row__title">Launch at Windows Startup</span>
        <span className="setting-row__subtitle">
          Automatically start in the background on login
        </span>
      </div>
      <input
        type="checkbox"
        id="autostart-toggle"
        className="toggle-switch"
        checked={isChecked}
        disabled={isDisabled}
        onChange={handleCheckboxChange}
      />
    </label>
  );
};
