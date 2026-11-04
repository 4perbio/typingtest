import { expect, test } from '@playwright/test';

test('typing changes brightness without shifting the next word', async ({ page }) => {
  await page.goto('/');

  const words = page.locator('.target-word');
  const firstWord = (await words.nth(0).textContent())?.trimEnd() ?? '';
  const nextWord = words.nth(1);
  const originalX = await nextWord.evaluate((element) => element.getBoundingClientRect().x);
  const pendingStyle = await words.nth(0).locator('.target-character').nth(0).evaluate((element) => {
    const style = getComputedStyle(element);
    return { color: style.color, filter: style.filter, fontWeight: style.fontWeight };
  });

  await page.locator('#typing-input').fill(`${firstWord} `);

  const nextWordX = await nextWord.evaluate((element) => element.getBoundingClientRect().x);
  const correctStyle = await words.nth(0).locator('.target-character--correct').nth(0).evaluate((element) => {
    const style = getComputedStyle(element);
    return { color: style.color, filter: style.filter, fontWeight: style.fontWeight };
  });

  expect(correctStyle.color).toBe(pendingStyle.color);
  expect(correctStyle.fontWeight).toBe(pendingStyle.fontWeight);
  expect(correctStyle.filter).not.toBe(pendingStyle.filter);
  expect(nextWordX).toBeCloseTo(originalX, 1);
});
