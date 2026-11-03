import { test, expect } from '@playwright/test';
import { compileGuide } from '../../docs/assets/learning/compile.js';
import { drillQuestions } from '../../docs/assets/ui/game-model.js';

const guide = compileGuide('de');
const first = guide.lessons[0];
const deck = drillQuestions(guide, first);

test('the game opens on the level map and a worked example opens in the builder', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.game-hero h1')).toContainText('Unlock a language.');
  await expect(page.locator('.game-level-node.is-current')).toHaveCount(1);
  await expect(page.locator('.game-level-node.is-locked').first()).toBeVisible();
  await page.locator('a.game-level-node').first().click();
  await expect(page.locator('.game-example-grid')).toBeVisible();
  await page.locator('[data-remix-example="first-words-7"]').click();
  await expect(page.locator('#studio-result')).toContainText('Ich habe eine Frage.');
  await expect(page.locator('#studio-structure')).toBeVisible();
  await expect(page.locator('#studio-back')).toHaveAttribute('href', '#de/lesson/first-words');
});

test('a quick round awards XP and unlocks the next level', async ({ page }) => {
  await page.goto('/#de/practice/first-words');
  for (const question of deck) {
    await expect(page.locator('.game-prompt')).toContainText(question.english);
    const option = question.options.indexOf(question.target);
    await page.locator('[data-drill-option="' + option + '"]').click();
    await expect(page.locator('.game-answer-feedback.is-correct')).toBeVisible();
    await page.locator('#drill-next').click();
  }
  await expect(page.locator('.game-round-end h1')).toHaveText('Level cleared!');
  await page.goto('/#de/start');
  await expect(page.locator('a.game-level-node[href="#de/lesson/identity"]')).toBeVisible();
  await expect(page.locator('.game-top-score')).toContainText('XP');
});

test('typing mode checks an answer without a countdown', async ({ page }) => {
  await page.goto('/#de/practice/first-words');
  await page.locator('[data-drill-mode="type"]').click();
  await page.locator('#drill-input').fill(deck[0].target);
  await page.locator('#drill-type-form button').click();
  await expect(page.locator('.game-answer-feedback.is-correct')).toBeVisible();
  await expect(page.locator('.game-drill-shortcut')).toContainText('No countdown');
  await page.keyboard.press('Enter');
  await expect(page.locator('.game-prompt')).toContainText(deck[1].english);
});

test('memory cards flip and remember a review interval on this device', async ({ page }) => {
  await page.goto('/#de/cards/first-words');
  await expect(page.locator('#card-flip')).toBeVisible();
  await expect(page.locator('#card-known')).toHaveCount(0);
  await page.locator('#card-flip').click();
  await expect(page.locator('#card-known')).toBeVisible();
  await page.locator('#card-known').click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mvl:game:cards:de') ?? '{}'));
  expect(Object.keys(saved).length).toBeGreaterThan(0);
  await page.reload();
  await expect(page.locator('#card-flip')).toBeVisible();
});

test('mobile navigation links to the new modes', async ({ page }, testInfo) => {
  if (testInfo.project.name !== 'mobile') test.skip();
  await page.goto('/');
  await page.locator('#menu-toggle').click();
  await expect(page.locator('body')).toHaveClass(/nav-open/);
  await page.locator('nav[aria-label="Study tools"] a[href="#de/practice"]').click();
  await expect(page.locator('.game-answer-grid')).toBeVisible();
  await expect(page.locator('body')).not.toHaveClass(/nav-open/);
  await page.locator('#menu-toggle').click();
  await page.locator('nav[aria-label="Study tools"] a[href="#de/cards"]').click();
  await expect(page.locator('#card-flip')).toBeVisible();
});
