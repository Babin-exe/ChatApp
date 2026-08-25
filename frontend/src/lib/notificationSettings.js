export const NOTIFICATION_SETTINGS_KEY = "chat-app-notification-settings";

export const DEFAULT_NOTIFICATION_SETTINGS = {
  typingSound: true,
  messageSound: true,
  desktopNotifications: false,
};

export const NOTIFICATION_SETTINGS_CHANGED_EVENT =
  "notification-settings:changed";

export const isDesktopNotificationSupported = () =>
  typeof window !== "undefined" && "Notification" in window;

export const getDesktopNotificationPermission = () => {
  if (!isDesktopNotificationSupported()) return "unsupported";
  return window.Notification.permission;
};

export const canShowDesktopNotifications = () =>
  getDesktopNotificationPermission() === "granted";

export const readNotificationSettings = () => {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATION_SETTINGS;

  try {
    const savedSettings = window.localStorage.getItem(
      NOTIFICATION_SETTINGS_KEY
    );

    if (!savedSettings) return DEFAULT_NOTIFICATION_SETTINGS;

    const settings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...JSON.parse(savedSettings),
    };

    if (settings.desktopNotifications && !canShowDesktopNotifications()) {
      return {
        ...settings,
        desktopNotifications: false,
      };
    }

    return settings;
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
};

export const writeNotificationSettings = (settings) => {
  if (typeof window === "undefined") return;

  const nextSettings = {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...settings,
    desktopNotifications:
      Boolean(settings.desktopNotifications) && canShowDesktopNotifications(),
  };

  window.localStorage.setItem(
    NOTIFICATION_SETTINGS_KEY,
    JSON.stringify(nextSettings)
  );

  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_SETTINGS_CHANGED_EVENT, {
      detail: nextSettings,
    })
  );
};
