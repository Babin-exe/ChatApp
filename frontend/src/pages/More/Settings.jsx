import { useEffect, useState } from "react";
import {
  readNotificationSettings,
  writeNotificationSettings,
} from "../../lib/notificationSettings.js";

const Settings = ({ setActiveView }) => {
  const [notificationSettings, setNotificationSettings] = useState(() =>
    readNotificationSettings()
  );

  useEffect(() => {
    writeNotificationSettings(notificationSettings);
  }, [notificationSettings]);

  const flipState = (key) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <>
      <div className="settings_page">
        <div className="back_button">
          <button type="button" onClick={() => setActiveView("default")}>
            Back
          </button>
        </div>

        <div className="settings_main">
          <div className="settings-header">
            <strong>Settings..</strong>

            <div className="settings_row">
              <div>
                <p>Typing Sound </p>
                <span>Play a sound while the other person is typing.</span>
              </div>

              <button
                type="button"
                className={`settings_switch ${
                  notificationSettings.typingSound ? "is_on" : ""
                }`}
                role="switch"
                aria-checked={notificationSettings.typingSound}
                onClick={() => flipState("typingSound")}
              >
                <span />
              </button>
            </div>

            <div className="settings_row">
              <div>
                <p>Message Sound </p>
                <span>Message Sound stuff</span>
              </div>

              <button
                type="button"
                role="switch"
                className={`settings_switch ${
                  notificationSettings.messageSound ? "is_on" : ""
                }`}
                onClick={() => flipState("messageSound")}
                aria-checked={notificationSettings.messageSound}
              >
                <span />
              </button>
            </div>

            <div className="settings_row">
              <div>
                <p>Desktop Notifications </p>
                <span>Notification stuff</span>
              </div>
              <button
                type="button"
                role="switch"
                className={`settings_switch ${
                  notificationSettings.desktopNotifications ? "is_on" : ""
                }`}
                onClick={() => flipState("desktopNotifications")}
                aria-checked={notificationSettings.desktopNotifications}
              >
                <span />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
