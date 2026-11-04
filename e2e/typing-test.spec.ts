import { expect, test } from '@playwright/test';

test('types, finishes, and restarts from the keyboard', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  const input = page.getByRole('textbox', { name: 'Type the passage' });
  const restart = page.getByRole('button', { name: 'Restart' });

  await input.fill('a');
  await page.clock.fastForward(30_000);
  await expect(page.getByRole('heading', { name: 'Test complete' })).toBeVisible();
  await expect(input).toHaveAttribute('readonly', '');

  await input.focus();
  await page.keyboard.press('Tab');
  await expect(restart).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('');
  await expect(page.locator('.metric').filter({ hasText: 'Time left' })).toContainText('30');
});

test('preserves active typing when switching themes and persists appearance', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '60 seconds' }).click();
  const input = page.getByRole('textbox', { name: 'Type the passage' });
  await input.fill('x');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByLabel('Theme').selectOption('dracula');

  await expect(input).toHaveValue('x');
  await expect(page.getByRole('navigation', { name: 'Decorative document ribbon' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Pink' }).click();
  await page.reload();

  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByLabel('Theme')).toHaveValue('dracula');
  await expect(page.getByRole('button', { name: 'Pink' })).toHaveAttribute('aria-pressed', 'true');
});

test('keeps the typing-to-restart tab route and layout within a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  const input = page.getByRole('textbox', { name: 'Type the passage' });
  const restart = page.getByRole('button', { name: 'Restart' });

  await input.focus();
  await page.keyboard.press('Tab');
  await expect(restart).toBeFocused();
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth,
  }));
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport);
});

test('aligns desktop settings with the panel and expands them as a phone accordion', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/');
  const settings = page.getByRole('button', { name: 'Settings' });
  const settingsPanel = page.locator('#appearance-settings');
  const typingPanel = page.locator('.typing-panel');
  const desktopPositions = await Promise.all([
    settings.boundingBox(),
    typingPanel.boundingBox(),
  ]);
  const surfaces = await page.evaluate(() => {
    const panel = document.querySelector<HTMLElement>('.typing-panel');
    const passage = document.querySelector<HTMLElement>('.passage-wrap');
    if (!panel || !passage) throw new Error('Typing surfaces missing');
    const panelStyle = getComputedStyle(panel);
    const passageStyle = getComputedStyle(passage);
    return {
      panelBackground: panelStyle.backgroundColor,
      panelBorder: panelStyle.borderWidth,
      panelShadow: panelStyle.boxShadow,
      passageBackground: passageStyle.backgroundColor,
      passageBorder: passageStyle.borderWidth,
    };
  });
  expect(surfaces.panelBackground).toBe('rgba(0, 0, 0, 0)');
  expect(surfaces.panelBorder).toBe('0px');
  expect(surfaces.panelShadow).toBe('none');
  expect(surfaces.passageBackground).toBe('rgba(0, 0, 0, 0)');
  expect(surfaces.passageBorder).toBe('0px');
  const viewport = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
  }));
  const seoCopy = await page.locator('.seo-copy').boundingBox();
  expect(desktopPositions[0]).not.toBeNull();
  expect(desktopPositions[1]).not.toBeNull();
  expect(seoCopy).not.toBeNull();
  expect(Math.abs(desktopPositions[1]!.x + desktopPositions[1]!.width / 2 - viewport.width / 2))
    .toBeLessThan(1);
  expect(Math.abs(desktopPositions[1]!.y + desktopPositions[1]!.height / 2 - viewport.height / 2))
    .toBeLessThan(1);
  expect(desktopPositions[0]!.y).toBe(desktopPositions[1]!.y);
  expect(desktopPositions[0]!.x - desktopPositions[1]!.x - desktopPositions[1]!.width)
    .toBe(12);
  expect(seoCopy!.y).toBeGreaterThanOrEqual(viewport.height);
  await page.locator('.seo-copy').scrollIntoViewIfNeeded();
  await expect(page.getByText(/Choose a 30-/)).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));

  await page.setViewportSize({ width: 390, height: 844 });
  const mobilePanelBefore = await typingPanel.boundingBox();
  await settings.click();
  await expect(settingsPanel).toBeVisible();
  const mobilePositions = await Promise.all([
    settingsPanel.boundingBox(),
    typingPanel.boundingBox(),
  ]);
  expect(mobilePanelBefore).not.toBeNull();
  expect(mobilePositions[0]).not.toBeNull();
  expect(mobilePositions[1]).not.toBeNull();
  expect(mobilePositions[1]!.y).toBeGreaterThan(mobilePanelBefore!.y);
  expect(mobilePositions[0]!.y + mobilePositions[0]!.height)
    .toBeLessThanOrEqual(mobilePositions[1]!.y);
});

test('dismissed feedback footer reappears after reloading the page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('contentinfo')).toBeVisible();
  await page.getByRole('button', { name: 'Dismiss feedback' }).click();
  await expect(page.getByRole('contentinfo')).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole('contentinfo')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Give us feedback!' }))
    .toHaveAttribute('href', 'https://perezrubio.dev');
});

test('visual focus prompt tracks input blur and hidden document state', async ({ page }) => {
  await page.goto('/');
  const input = page.getByRole('textbox', { name: 'Type the passage' });
  await input.click();
  await input.fill('a');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByText('Focus the typing field to reveal your place')).toBeVisible();
  const promptPosition = await page.getByText('Focus the typing field to reveal your place').boundingBox();
  const passagePosition = await page.getByRole('group', { name: 'Passage to type' }).boundingBox();
  expect(promptPosition).not.toBeNull();
  expect(passagePosition).not.toBeNull();
  expect(Math.abs(
    promptPosition!.x + promptPosition!.width / 2 - passagePosition!.x - passagePosition!.width / 2,
  )).toBeLessThan(1);
  expect(Math.abs(
    promptPosition!.y + promptPosition!.height / 2 - passagePosition!.y - passagePosition!.height / 2,
  )).toBeLessThan(1);
  await page.waitForTimeout(1_100);
  await expect(page.getByText('Time left').locator('..').locator('strong')).not.toHaveText('30 s');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
});

test('all eighteen theme accents remain selectable at a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  const themePicker = page.getByLabel('Theme');
  const themeIds = await themePicker.locator('option').evaluateAll((options) =>
    options.map((option) => (option as HTMLOptionElement).value).filter(Boolean),
  );
  expect(themeIds).toEqual(['dracula', 'catppuccin', 'matrix', 'night-runner', 'vaporwave', 'classic']);

  for (const themeId of themeIds) {
    await themePicker.selectOption(themeId);
    const accents = page.locator('.accent-option');
    await expect(accents).toHaveCount(3);
    for (let index = 0; index < 3; index += 1) {
      const accent = accents.nth(index);
      await accent.click();
      await expect(accent).toHaveAttribute('aria-pressed', 'true');
    }

    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  }
});

test('passage input overlays the surface and wraps whole words with a precise space caret', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  const input = page.getByRole('textbox', { name: 'Type the passage' });
  const surface = page.getByRole('group', { name: 'Passage to type' });

  const inputStyle = await input.evaluate((element) => {
    const style = getComputedStyle(element);
    return { display: style.display, opacity: style.opacity, position: style.position };
  });

  expect(inputStyle).toEqual({ display: 'block', opacity: '0', position: 'absolute' });
  expect(await input.evaluate((element) => element.closest('.passage-wrap') !== null)).toBe(true);

  const wrappedWords = await surface.locator('.target-word').evaluateAll((words) => {
    const boxes = words.map((word) => word.getBoundingClientRect());
    return {
      splitWords: words.some((word) => {
        const characters = Array.from(word.children);
        const firstTop = characters[0]?.getBoundingClientRect().top ?? 0;
        return characters.some((character) =>
          Math.abs(character.getBoundingClientRect().top - firstTop) > 1,
        );
      }),
      hasWordWrap: boxes.some((box, index) => index > 0 && box.top > boxes[index - 1]!.top),
    };
  });
  expect(wrappedWords.splitWords).toBe(false);
  expect(wrappedWords.hasWordWrap).toBe(true);

  await surface.click();
  await page.keyboard.type('x ');
  await expect(input).toHaveValue('x ');
  const caret = surface.locator('.target-character--caret');
  await expect(caret).toHaveCount(1);
  const caretIndex = await surface.locator('.target-character').evaluateAll((characters) =>
    characters.findIndex((character) => character.classList.contains('target-character--caret')),
  );
  expect(caretIndex).toBe(2);

  const originalLength = (await surface.locator('.target-passage').textContent() ?? '').length;
  const currentTarget = await surface.locator('.target-passage').textContent() ?? '';
  await input.fill(currentTarget.slice(0, -20));
  await expect.poll(async () =>
    (await surface.locator('.target-passage').textContent() ?? '').length,
  ).toBeGreaterThan(originalLength);

  await surface.evaluate((element) => {
    const longWord = document.createElement('div');
    longWord.className = 'target-word';
    longWord.textContent = 'longword'.repeat(40);
    element.querySelector('.target-passage')?.prepend(longWord);
  });
  const containedOverflow = await surface.evaluate((element) => ({
    surfaceWidth: element.clientWidth,
    contentWidth: element.scrollWidth,
  }));
  expect(containedOverflow.contentWidth).toBeGreaterThan(containedOverflow.surfaceWidth);
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth,
  }));
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport);
});

test('duration, theme, and accent options retain visible button surfaces', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  const optionControls = [
    page.getByRole('button', { name: '30 seconds' }),
    page.getByLabel('Theme'),
    page.getByRole('button', { name: 'Purple' }),
  ];

  for (const control of optionControls) {
    const styles = await control.evaluate((element) => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, border: style.borderWidth };
    });
    expect(styles.background).not.toBe('rgba(0, 0, 0, 0)');
    expect(styles.border).not.toBe('0px');
  }
});
