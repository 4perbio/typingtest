import { describe, expect, it } from 'vitest';
import {
  ACCENT_OPTIONS,
  DEFAULT_PREFERENCES,
  THEMES,
  loadPreferences,
  savePreferences,
} from './themes';

function memoryStorage(initialValue: string | null = null): Storage {
  let value = initialValue;
  return {
    getItem: () => value,
    setItem: (_key, nextValue) => { value = nextValue; },
    removeItem: () => { value = null; },
    clear: () => { value = null; },
    key: () => null,
    get length() { return value === null ? 0 : 1; },
  };
}

function relativeLuminance(color: string): number {
  const channels = color.match(/[a-f\d]{2}/gi)?.map((channel) => Number.parseInt(channel, 16) / 255) ?? [];
  const linear = channels.map((channel) => channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4);
  return (0.2126 * (linear[0] ?? 0)) + (0.7152 * (linear[1] ?? 0)) + (0.0722 * (linear[2] ?? 0));
}

function contrastRatio(first: string, second: string): number {
  const values = [relativeLuminance(first), relativeLuminance(second)].sort((left, right) => right - left);
  return ((values[0] ?? 0) + 0.05) / ((values[1] ?? 0) + 0.05);
}

describe('appearance preferences', () => {
  it('provides six themes with three named accents each', () => {
    expect(THEMES.map((theme) => theme.id)).toEqual([
      'dracula',
      'catppuccin',
      'matrix',
      'night-runner',
      'vaporwave',
      'classic',
    ]);
    expect(ACCENT_OPTIONS).toHaveLength(3);
    expect(THEMES.every((theme) => theme.accents.length === 3)).toBe(true);
    expect(THEMES.every((theme) => theme.accents.every((accent) => accent.name.length > 0))).toBe(true);
  });

  it('keeps theme text and accents distinguishable from their surfaces', () => {
    THEMES.forEach((theme) => {
      expect(contrastRatio(theme.colors.text, theme.colors.surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(theme.colors.muted, theme.colors.surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(theme.colors.error, theme.colors.surface)).toBeGreaterThanOrEqual(4.5);
      theme.accents.forEach((accent) => {
        expect(contrastRatio(accent.color, theme.colors.surface)).toBeGreaterThanOrEqual(3);
      });
    });
  });

  it('uses a light surface and dark text for Classic', () => {
    const classic = THEMES.find((theme) => theme.id === 'classic');

    expect(classic).toBeDefined();
    expect(contrastRatio(classic!.colors.text, classic!.colors.surface)).toBeGreaterThanOrEqual(4.5);
    expect(relativeLuminance(classic!.colors.surface)).toBeGreaterThan(0.9);
    expect(relativeLuminance(classic!.colors.text)).toBeLessThan(0.1);
  });

  it('defaults to Dracula and restores valid versioned preferences', () => {
    const storage = memoryStorage(JSON.stringify({
      version: 1,
      themeId: 'dracula',
      accentIds: { ...DEFAULT_PREFERENCES.accentIds, dracula: 'pink' },
    }));

    expect(loadPreferences(storage)).toEqual({
      version: 1,
      themeId: 'dracula',
      accentIds: { ...DEFAULT_PREFERENCES.accentIds, dracula: 'pink' },
    });
  });

  it('adds a default Classic accent when restoring preferences saved before Classic existed', () => {
    const storage = memoryStorage(JSON.stringify({
      version: 1,
      themeId: 'catppuccin',
      accentIds: {
        dracula: 'pink',
        catppuccin: 'peach',
        matrix: 'mint',
        'night-runner': 'hot-pink',
        vaporwave: 'aqua',
      },
    }));

    expect(loadPreferences(storage)).toEqual({
      version: 1,
      themeId: 'catppuccin',
      accentIds: {
        ...DEFAULT_PREFERENCES.accentIds,
        dracula: 'pink',
        catppuccin: 'peach',
        matrix: 'mint',
        'night-runner': 'hot-pink',
        vaporwave: 'aqua',
        classic: 'classic-blue',
      },
    });
  });

  it('migrates the former Word preference to Dracula and keeps valid remaining accents', () => {
    const savedAccents = {
      dracula: 'pink',
      catppuccin: 'peach',
      matrix: 'mint',
      'night-runner': 'hot-pink',
      vaporwave: 'aqua',
      word: 'teal',
    };
    const storage = memoryStorage(JSON.stringify({
      version: 1,
      themeId: 'word',
      accentIds: savedAccents,
    }));

    expect(loadPreferences(storage)).toEqual({
      version: 1,
      themeId: 'dracula',
      accentIds: {
        dracula: 'pink',
        catppuccin: 'peach',
        matrix: 'mint',
        'night-runner': 'hot-pink',
        vaporwave: 'aqua',
        classic: 'classic-blue',
      },
    });
    expect(JSON.parse(storage.getItem('wordtype.preferences.v1') ?? '{}')).toEqual({
      version: 1,
      themeId: 'dracula',
      accentIds: {
        dracula: 'pink',
        catppuccin: 'peach',
        matrix: 'mint',
        'night-runner': 'hot-pink',
        vaporwave: 'aqua',
        classic: 'classic-blue',
      },
    });
  });

  it('discards preferences with invalid accent identifiers', () => {
    const invalidPreferences = {
      version: 1,
      themeId: 'catppuccin',
      accentIds: { ...DEFAULT_PREFERENCES.accentIds, matrix: 'not-an-accent' },
    };

    expect(loadPreferences(memoryStorage(JSON.stringify(invalidPreferences))))
      .toEqual(DEFAULT_PREFERENCES);
  });

  it.each(['{broken', JSON.stringify({ version: 0, themeId: 'dracula' }), JSON.stringify({ version: 1, themeId: 'unknown', accentIds: {} })])(
    'falls back to defaults for invalid saved value %s',
    (value) => expect(loadPreferences(memoryStorage(value))).toEqual(DEFAULT_PREFERENCES),
  );

  it('keeps working when storage reads or writes throw', () => {
    const blockedStorage = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
    } as unknown as Storage;

    expect(loadPreferences(blockedStorage)).toEqual(DEFAULT_PREFERENCES);
    expect(() => savePreferences(blockedStorage, DEFAULT_PREFERENCES)).not.toThrow();
  });

  it('saves only the versioned appearance preferences', () => {
    const storage = memoryStorage();
    savePreferences(storage, DEFAULT_PREFERENCES);

    expect(JSON.parse(storage.getItem('wordtype.preferences.v1') ?? '{}')).toEqual(DEFAULT_PREFERENCES);
  });
});
