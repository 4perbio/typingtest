import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ThemePicker } from './components/ThemePicker';
import { TypingTest } from './components/TypingTest';
import type { TestDuration } from './hooks/useTypingTest';
import {
  DEFAULT_PREFERENCES,
  getAccent,
  getTheme,
  loadPreferences,
  savePreferences,
  type AppearancePreferences,
} from './themes';
import './styles.css';

const optionsGearUrl = new URL('./assets/option-gear.svg', import.meta.url).href;

function getBrowserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function loadInitialPreferences(): AppearancePreferences {
  const storage = getBrowserStorage();
  return storage ? loadPreferences(storage) : DEFAULT_PREFERENCES;
}

export default function App() {
  const [preferences, setPreferences] = useState(loadInitialPreferences);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(true);
  const [durationSeconds, setDurationSeconds] = useState<TestDuration>(30);
  const settingsRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const theme = getTheme(preferences.themeId);
  const accent = getAccent(theme, preferences.accentIds[theme.id] ?? '');
  const themeStyle = useMemo(() => ({
    '--page-bg': theme.colors.background,
    '--surface': theme.colors.surface,
    '--surface-alt': theme.colors.surfaceAlt,
    '--text': theme.colors.text,
    '--muted': theme.colors.muted,
    '--error': theme.colors.error,
    '--border': theme.colors.border,
    '--accent': accent.color,
  } as CSSProperties), [accent.color, theme]);

  const persist = (next: AppearancePreferences) => {
    setPreferences(next);
    const storage = getBrowserStorage();
    if (storage) savePreferences(storage, next);
  };

  const changeTheme = (themeId: string) => {
    if (themeId === preferences.themeId) return;
    persist({ ...preferences, themeId });
  };

  const changeAccent = (accentId: string) => {
    persist({
      ...preferences,
      accentIds: { ...preferences.accentIds, [theme.id]: accentId },
    });
  };

  useEffect(() => {
    if (!settingsOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !settingsRef.current?.contains(event.target)) {
        setSettingsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSettingsOpen(false);
        settingsButtonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [settingsOpen]);

  return (
    <div className="app-shell" data-theme={theme.id} style={themeStyle}>
      <header className="visually-hidden">
        <h1>Minimal online typing test</h1>
        <p>Meet Wordtype: a calm, customizable typing test for a little practice, one word at a time.</p>
      </header>
      <main className="app-content">
        <div className="typing-layout">
          <div className="typing-group">
            <div className="settings-menu" ref={settingsRef}>
              <button
                ref={settingsButtonRef}
                className="settings-button"
                type="button"
                aria-label="Settings"
                aria-expanded={settingsOpen}
                aria-controls="appearance-settings"
                onClick={() => setSettingsOpen((open) => !open)}
              >
                <img src={optionsGearUrl} alt="" aria-hidden="true" />
              </button>
              {settingsOpen && (
                <div className="settings-panel" id="appearance-settings">
                  <ThemePicker
                    themeId={theme.id}
                    accentId={accent.id}
                    durationSeconds={durationSeconds}
                    onThemeChange={changeTheme}
                    onAccentChange={changeAccent}
                    onDurationChange={setDurationSeconds}
                  />
                </div>
              )}
              </div>
              <TypingTest durationSeconds={durationSeconds} />
          </div>
        </div>
        <section className="seo-copy" aria-labelledby="typing-test-intro">
          <h2 className="visually-hidden" id="typing-test-intro">
            A simple typing test for fun and focused practice
          </h2>
          <p>
            Choose a session from 0 to 60 seconds, or select Infinite for untimed practice.
            Type the passage shown and follow your words per minute (WPM) and accuracy as you
            go. Pick a theme and accent color to make the page your own.
          </p>
          <p>
            Looking for a minimal typing test for fun, or a quiet screen while you record your
            own typing-sound ASMR? Wordtype keeps the focus on typing and does not record audio.
          </p>
        </section>
      </main>
      {feedbackOpen && (
        <footer className="app-footer">
          <a href="https://perezrubio.dev">Give us feedback!</a>
          <button
            type="button"
            aria-label="Dismiss feedback"
            onClick={() => setFeedbackOpen(false)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </footer>
      )}
    </div>
  );
}
