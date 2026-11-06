import { useRef, type CSSProperties } from 'react';
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

const DURATION_STOPS = [0, 15, 30, 45, 60] as const;

export function ThemePicker({
  themeId,
  accentId,
  durationSeconds,
  onThemeChange,
  onAccentChange,
  onDurationChange,
}: ThemePickerProps) {
  const pointerAdjustingDuration = useRef(false);
  const theme = getTheme(themeId);
  const activeAccent = getAccent(theme, accentId);
  const durationLabel = durationSeconds === 0 ? 'Infinite' : `${durationSeconds} seconds`;

  const changeDuration = (value: string) => {
    const duration = Number(value);
    if (pointerAdjustingDuration.current) {
      const nearestStop = DURATION_STOPS.find((stop) => Math.abs(stop - duration) <= 1);
      onDurationChange(nearestStop ?? duration);
      return;
    }
    onDurationChange(duration);
  };

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
        <output className="duration-value" htmlFor="duration-range">{durationLabel}</output>
        <div className="duration-slider">
          <input
            id="duration-range"
            type="range"
            min="0"
            max="60"
            step="1"
            value={durationSeconds}
            aria-label="Test duration"
            aria-valuetext={durationLabel}
            aria-describedby="duration-guidance"
            onChange={(event) => changeDuration(event.currentTarget.value)}
            onPointerDown={() => { pointerAdjustingDuration.current = true; }}
            onPointerUp={() => { pointerAdjustingDuration.current = false; }}
            onPointerCancel={() => { pointerAdjustingDuration.current = false; }}
          />
          <div className="duration-marks" aria-hidden="true">
            {DURATION_STOPS.map((stop) => (
              <span key={stop}>{stop === 0 ? 'Infinite' : stop}</span>
            ))}
          </div>
        </div>
        <span className="visually-hidden" id="duration-guidance">
          Choose any whole number of seconds from 0 to 60. With a pointer, values near marked
          stops snap to them; use arrow keys to select every second. Zero runs without a time limit.
        </span>
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
