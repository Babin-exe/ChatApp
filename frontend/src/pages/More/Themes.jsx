import { useState } from "react";
import {
  applyTheme,
  getThemeById,
  readStoredTheme,
  THEME_OPTIONS,
} from "../../lib/theme.js";

const Themes = ({ setActiveView }) => {

  const [activeTheme, setActiveTheme] = useState(() => readStoredTheme());
  
  const selectedTheme = getThemeById(activeTheme);

  const handleThemeChange = (themeId) => {
    setActiveTheme(applyTheme(themeId));
  };

  const renderPreview = (theme) => (
    <div
      className="theme-mini-preview"
      style={{
        "--theme-page": theme.preview.page,
        "--theme-surface": theme.preview.surface,
        "--theme-brand": theme.preview.brand,
        "--theme-accent": theme.preview.accent,
        "--theme-bubble": theme.preview.bubble,
        "--theme-text": theme.preview.text,
      }}
      aria-hidden="true"
    >
      <div className="theme-mini-sidebar">
        <span />
        <span />
        <span />
      </div>
      <div className="theme-mini-chat">
        <span className="theme-mini-line" />
        <span className="theme-mini-bubble theme-mini-bubble-in" />
        <span className="theme-mini-bubble theme-mini-bubble-out" />
      </div>
    </div>
  );

  return (
    <div className="themes-page">

      <header className="themes-header">
        <div className="back_button">
          <button
            onClick={() => {
              setActiveView("default");
            }}
          >
            Back
          </button>
        </div>

        <p className="themes-kicker">Appearance</p>
        <h1>Themes</h1>
        <p>
          Pick the palette that should flow through chats, panels, and controls.
        </p>
      </header>

      <section className="themes-current" aria-live="polite">
        <div className="themes-current-copy">
          <span>Active theme</span>
          <strong>{selectedTheme.name}</strong>
          <p>{selectedTheme.description}</p>
        </div>
        {renderPreview(selectedTheme)}
      </section>

      <section className="themes-grid" aria-label="Available themes">
        {THEME_OPTIONS.map((theme) => {
          const isSelected = activeTheme === theme.id;

          return (
            <button
              key={theme.id}
              type="button"
              className={`theme-card${isSelected ? " is-selected" : ""}`}
              onClick={() => handleThemeChange(theme.id)}
              aria-pressed={isSelected}
            >
              {renderPreview(theme)}

              <div className="theme-card-body">
                <div className="theme-card-copy">
                  <h2>{theme.name}</h2>
                  <p>{theme.description}</p>
                </div>
                <span className="theme-status">
                  {isSelected ? "Selected" : "Apply"}
                </span>
              </div>

              <div className="theme-swatches" aria-hidden="true">
                {theme.swatches.map((color) => (
                  <span
                    key={color}
                    className="theme-swatch"
                    style={{ "--swatch": color }}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </section>
    </div>
  );
};

export default Themes;



