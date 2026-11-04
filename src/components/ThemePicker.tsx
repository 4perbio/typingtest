import type { CSSProperties } from 'react';
import { getAccent, getTheme, THEMES } from '../themes';

interface ThemePickerProps {
  readonly themeId: string;
  readonly accentId: string;
  readonly onThemeChange: (themeId: string) => void;
  readonly onAccentChange: (accentId: string) => void;
}

export function ThemePicker({
  themeId,
  accentId,
  onThemeChange,
  onAccentChange,
}: ThemePickerProps) {
  const theme = getTheme(themeId);
  const activeAccent = getAccent(theme, accentId);

  return (
    <section className="appearance" aria-label="Appearance">
      <label className="theme-select">
        <span>Theme</span>
        <select value={themeId} onChange={(event) => onThemeChange(event.currentTarget.value)}>
          {THEMES.map((option) => (
            <option key={option.id} value={option.id}>{option.name}</option>
          ))}
        </select>
      </label>
      <fieldset className="accent-picker">
        <legend>Accent color</legend>
        <div className="accent-options">
          {theme.accents.map((accent) => (
            <button
              key={accent.id}
              type="button"
              className="accent-option"
              aria-label={accent.name}
              aria-pressed={activeAccent.id === accent.id}
              onClick={() => onAccentChange(accent.id)}
              style={{ '--swatch-color': accent.color } as CSSProperties}
            >
              <span className="accent-dot" aria-hidden="true" />
              <span>{accent.name}</span>
            </button>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
