export const THEME_STORAGE_KEY = "chat-app-theme";
export const DEFAULT_THEME_ID = "warm";

export const THEME_OPTIONS = [
  {
    id: "warm",
    name: "Warm",
    description: "Terracotta, soft paper, and teal message bubbles.",
    swatches: ["#fff8ef", "#dd5e3d", "#2f8f83", "#d5efe9"],
    preview: {
      page: "#fff8ef",
      surface: "#fffcf7",
      brand: "#dd5e3d",
      accent: "#2f8f83",
      bubble: "#d5efe9",
      text: "#272a36",
    },
  },
  {
    id: "dark",
    name: "Midnight",
    description: "Low-light graphite with coral and mint highlights.",
    swatches: ["#141311", "#fb7185", "#34d399", "#2d2925"],
    preview: {
      page: "#141311",
      surface: "#211f1d",
      brand: "#fb7185",
      accent: "#34d399",
      bubble: "#143d35",
      text: "#fff7ed",
    },
  },
  {
    id: "coastal",
    name: "Coastal",
    description: "Fresh aqua surfaces with amber conversation accents.",
    swatches: ["#effaf9", "#0f7c90", "#d97706", "#fff1d6"],
    preview: {
      page: "#effaf9",
      surface: "#f8ffff",
      brand: "#0f7c90",
      accent: "#d97706",
      bubble: "#ffe0a6",
      text: "#1d2f35",
    },
  },
  {
    id: "meadow",
    name: "Meadow",
    description: "Leafy greens balanced with plum accents.",
    swatches: ["#f4faee", "#5c7c2b", "#9f477f", "#f6e8f2"],
    preview: {
      page: "#f4faee",
      surface: "#fcfff8",
      brand: "#5c7c2b",
      accent: "#9f477f",
      bubble: "#f6e8f2",
      text: "#263025",
    },
  },
];

export const getThemeById = (themeId) =>
  THEME_OPTIONS.find((theme) => theme.id === themeId) || THEME_OPTIONS[0];

export const readStoredTheme = () => {
  if (typeof window === "undefined") return DEFAULT_THEME_ID;

  try {
    return getThemeById(window.localStorage.getItem(THEME_STORAGE_KEY)).id;
  } catch {
    return DEFAULT_THEME_ID;
  }
};

export const applyTheme = (themeId) => {
  const nextThemeId = getThemeById(themeId).id;

  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = nextThemeId;
  }

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextThemeId);
    } catch {
      // Theme selection still works for the current page if storage is blocked.
    }
  }

  return nextThemeId;
};

export const applyStoredTheme = () => applyTheme(readStoredTheme());
