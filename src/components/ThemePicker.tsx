import type { CSSProperties } from 'react';
import type { TestDuration } from '../hooks/useTypingTest';
import { getAccent, getTheme, THEMES } from '../themes';

interface ThemePickerProps {
  readonly themeId: string;
  readonly accentId: string;
  readonly durationSeconds: TestDuration;
  readonly onThemeChange: (themeId: string) => void;
  readonly onAccentChange: (accentId: string) => void;
  readonly onDurationChange: (duration: TestDuration) => void;
}

const DURATIONS: readonly TestDuration[] = [30, 60, 120];

export function ThemePicker({
  themeId,
  accentId,
  durationSeconds,
  onThemeChange,
  onAccentChange,
  onDurationChange,
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
      <fieldset className="duration-picker">
        <legend>Test duration</legend>
        <div className="duration-options">
          {DURATIONS.map((duration) => (
            <button
              key={duration}
              type="button"
              aria-pressed={durationSeconds === duration}
              onClick={() => onDurationChange(duration)}
            >
              {duration} seconds
            </button>
          ))}
        </div>
      </fieldset>
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
