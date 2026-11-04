export interface AccentOption {
  readonly id: string;
  readonly name: string;
  readonly color: string;
}

export interface ThemeDefinition {
  readonly id: string;
  readonly name: string;
  readonly colors: {
    readonly background: string;
    readonly surface: string;
    readonly surfaceAlt: string;
    readonly text: string;
    readonly muted: string;
    readonly error: string;
    readonly border: string;
  };
  readonly accents: readonly AccentOption[];
}

export interface AppearancePreferences {
  readonly version: 1;
  readonly themeId: string;
  readonly accentIds: Readonly<Record<string, string>>;
}

export const PREFERENCE_KEY = 'wordtype.preferences.v1';

export const THEMES: readonly ThemeDefinition[] = [
  {
    id: 'dracula',
    name: 'Dracula',
    colors: { background: '#191a21', surface: '#22232d', surfaceAlt: '#2a2b36', text: '#f8f8f2', muted: '#b8b8c5', error: '#ff6b73', border: '#414250' },
    accents: [
      { id: 'purple', name: 'Purple', color: '#bd93f9' },
      { id: 'pink', name: 'Pink', color: '#ff79c6' },
      { id: 'cyan', name: 'Cyan', color: '#8be9fd' },
    ],
  },
  {
    id: 'catppuccin',
    name: 'Catppuccin',
    colors: { background: '#1e1e2e', surface: '#242438', surfaceAlt: '#302f46', text: '#cdd6f4', muted: '#a6adc8', error: '#f38ba8', border: '#45445c' },
    accents: [
      { id: 'mauve', name: 'Mauve', color: '#cba6f7' },
      { id: 'peach', name: 'Peach', color: '#fab387' },
      { id: 'sapphire', name: 'Sapphire', color: '#74c7ec' },
    ],
  },
  {
    id: 'matrix',
    name: 'Matrix',
    colors: { background: '#080d0a', surface: '#0e1711', surfaceAlt: '#142219', text: '#d8f4df', muted: '#9ab5a0', error: '#ff7b72', border: '#284531' },
    accents: [
      { id: 'matrix-green', name: 'Matrix green', color: '#63e88b' },
      { id: 'mint', name: 'Mint', color: '#8de8c1' },
      { id: 'amber', name: 'Amber', color: '#ffc857' },
    ],
  },
  {
    id: 'night-runner',
    name: 'Night Runner',
    colors: { background: '#0b1020', surface: '#131b31', surfaceAlt: '#192440', text: '#e8edff', muted: '#aab4d1', error: '#ff788d', border: '#303c5b' },
    accents: [
      { id: 'electric-blue', name: 'Electric blue', color: '#62a8ff' },
      { id: 'hot-pink', name: 'Hot pink', color: '#ff6fcf' },
      { id: 'neon-lime', name: 'Neon lime', color: '#b5ef62' },
    ],
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave',
    colors: { background: '#1b1028', surface: '#28173a', surfaceAlt: '#352047', text: '#f7eaff', muted: '#d2b9e3', error: '#ff8296', border: '#563c69' },
    accents: [
      { id: 'bubblegum-pink', name: 'Bubblegum pink', color: '#ff83d2' },
      { id: 'aqua', name: 'Aqua', color: '#70e6e3' },
      { id: 'lavender', name: 'Lavender', color: '#c6a0ff' },
    ],
  },
  {
    id: 'classic',
    name: 'Classic',
    colors: { background: '#eef0f3', surface: '#ffffff', surfaceAlt: '#f7f8fa', text: '#202124', muted: '#525866', error: '#b3261e', border: '#c4c9d1' },
    accents: [
      { id: 'classic-blue', name: 'Classic blue', color: '#0b57d0' },
      { id: 'classic-teal', name: 'Classic teal', color: '#00695c' },
      { id: 'classic-orange', name: 'Classic orange', color: '#b54708' },
    ],
  },
];

export const ACCENT_OPTIONS = THEMES[0]?.accents ?? [];

export const DEFAULT_PREFERENCES: AppearancePreferences = {
  version: 1,
  themeId: 'dracula',
  accentIds: Object.fromEntries(THEMES.map((theme) => [
    theme.id,
    theme.accents[0]?.id ?? '',
  ])),
};

function parsePreferences(value: unknown): AppearancePreferences | null {
  if (typeof value !== 'object' || value === null) return null;
  const candidate = value as Partial<AppearancePreferences> & {
    readonly accentIds?: Readonly<Record<string, unknown>>;
  };
  if (candidate.version !== 1 || typeof candidate.themeId !== 'string'
    || typeof candidate.accentIds !== 'object' || candidate.accentIds === null) return null;

  const isMigratingWordTheme = candidate.themeId === 'word';
  const themeId = isMigratingWordTheme ? 'dracula' : candidate.themeId;
  if (!THEMES.some((theme) => theme.id === themeId)) return null;

  const hasValidAccent = (theme: ThemeDefinition) =>
    theme.accents.some((accent) => accent.id === candidate.accentIds?.[theme.id]);
  const isLegacyWithoutClassicAccent = candidate.accentIds.classic === undefined;
  const hasEveryAccent = THEMES.every((theme) =>
    hasValidAccent(theme) || (theme.id === 'classic' && isLegacyWithoutClassicAccent),
  );
  if (!isMigratingWordTheme && !hasEveryAccent) return null;

  const accentIds = Object.fromEntries(THEMES.map((theme) => {
    const savedAccent = candidate.accentIds?.[theme.id];
    const accentId = typeof savedAccent === 'string' && hasValidAccent(theme)
      ? savedAccent
      : DEFAULT_PREFERENCES.accentIds[theme.id]!;
    return [theme.id, accentId];
  }));
  return { version: 1, themeId, accentIds };
}

export function loadPreferences(storage: Storage): AppearancePreferences {
  try {
    const saved = storage.getItem(PREFERENCE_KEY);
    if (saved === null) return DEFAULT_PREFERENCES;
    const parsed: unknown = JSON.parse(saved);
    const preferences = parsePreferences(parsed);
    if (!preferences) return DEFAULT_PREFERENCES;
    if (JSON.stringify(parsed) !== JSON.stringify(preferences)) {
      savePreferences(storage, preferences);
    }
    return preferences;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(storage: Storage, preferences: AppearancePreferences): void {
  try {
    storage.setItem(PREFERENCE_KEY, JSON.stringify(preferences));
  } catch {
    // Appearance remains usable in memory when browser storage is blocked.
  }
}

export function getTheme(themeId: string): ThemeDefinition {
  return THEMES.find((theme) => theme.id === themeId) ?? THEMES[0]!;
}

export function getAccent(theme: ThemeDefinition, accentId: string): AccentOption {
  return theme.accents.find((accent) => accent.id === accentId) ?? theme.accents[0]!;
}
