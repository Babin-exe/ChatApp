import { useEffect, useState } from "react";

const DEFAULT_NOTIFICATION_STATES = {
  typingSound: true,
  messageSound: true,
  desktopNotifications: false,
};

const NOTIFICATION_SETTINGS_KEY = "chat-app-notification-settings";

const readNotificationSettings = () => {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATION_STATES;

  try {
    const savedSettings = window.localStorage.getItem(
      NOTIFICATION_SETTINGS_KEY
    );
    if (!savedSettings) return DEFAULT_NOTIFICATION_STATES;

    return {
      ...DEFAULT_NOTIFICATION_STATES,
      ...JSON.parse(savedSettings),
    };
  } catch {
    return DEFAULT_NOTIFICATION_STATES;
  }
};

const Settings = ({ setActiveView }) => {
  const [notificationSettings, setNotificationSettings] = useState(() =>
    readNotificationSettings()
  );

  useEffect(() => {
    window.localStorage.setItem(
      NOTIFICATION_SETTINGS_KEY,
      JSON.stringify(notificationSettings)
    );
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
              <p>Typing Sound </p>
              <button type="button" onClick={() => flipState("typingSound")}>
                {notificationSettings.typingSound ? "On" : "Off"}
              </button>
            </div>

            <div className="settings_row">
              <p>Message Sound </p>
              <button type="button" onClick={() => flipState("messageSound")}>
                {notificationSettings.messageSound ? "On" : "Off"}
              </button>
            </div>

            <div className="settings_row">
              <p>Desktop Notifications </p>
              <button
                type="button"
                onClick={() => flipState("desktopNotifications")}
              >
                {notificationSettings.desktopNotifications ? "On" : "Off"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
