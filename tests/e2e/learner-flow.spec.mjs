import { test, expect } from '@playwright/test';
import { compileGuide } from '../../docs/assets/learning/compile.js';
import { drillQuestions } from '../../docs/assets/ui/game-model.js';
import { questRounds } from '../../docs/assets/ui/quest-model.js';

const guide = compileGuide('de');
const first = guide.lessons[0];
const deck = drillQuestions(guide, first);
const encounters = questRounds(guide, first);

test('the level map leads to editable examples in the builder', async ({ page }) => {
  await page.goto('/#de/start');
  await expect(page.locator('.game-hero h1')).toContainText('Open the next gate.');
  await expect(page.locator('.game-level-node.is-current')).toHaveCount(1);
  await expect(page.locator('.game-level-node.is-locked').first()).toBeVisible();
  await page.locator('a.game-level-node').first().click();
  await expect(page.locator('.game-example-grid')).toBeVisible();
  await page.locator('[data-remix-example="first-words-7"]').click();
  await expect(page.locator('#studio-result')).toContainText('Ich habe eine Frage.');
  await expect(page.locator('#studio-structure')).toBeVisible();
  await expect(page.locator('#studio-back')).toHaveAttribute('href', '#de/lesson/first-words');
});

test('a quick drill earns XP but does not unlock the next quest', async ({ page }) => {
  await page.goto('/#de/practice/first-words');
  for (const question of deck) {
    await expect(page.locator('.game-prompt')).toContainText(question.english);
    const option = question.options.indexOf(question.target);
    await page.locator('[data-drill-option="' + option + '"]').click();
    await expect(page.locator('.game-answer-feedback.is-correct')).toBeVisible();
    await page.locator('#drill-next').click();
  }
  await expect(page.locator('.game-round-end h1')).toHaveText('Drill conquered!');
  await page.goto('/#de/start');
  await expect(page.locator('a.game-level-node[href="#de/lesson/identity"]')).toHaveCount(0);
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

test('a locked deep link cannot mismatch drill prompts with answer validation', async ({ page }) => {
  await page.goto('/#de/practice/independent-life');
  await expect(page.locator('#drill-lesson')).toHaveValue('first-words');
  await expect(page.locator('.game-prompt')).toContainText(deck[0].english);
});

test('game modes fit a narrow phone without horizontal scrolling', async ({ page }, testInfo) => {
  if (testInfo.project.name !== 'mobile') test.skip();
  for (const path of ['/', '/#de/start', '/#de/lesson/first-words', '/#de/play/first-words', '/#de/builder', '/#de/practice/first-words', '/#de/cards/first-words']) {
    await page.goto(path);
    await page.locator('#main-content').waitFor();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, 'horizontal overflow at ' + path).toBeLessThanOrEqual(1);
  }
});

test('the sentence quest is a real five-encounter assembly game with a boss and persistent stars', async ({ page }) => {
  await page.goto('/#de/play/first-words');
  await expect(page.locator('#quest')).toHaveAttribute('data-quest-round', '0');
  await expect(page.locator('.quest-hearts')).toContainText('♥♥♥');
  for (const [roundIndex, encounter] of encounters.entries()) {
    await expect(page.locator('.quest-dialogue')).toContainText(encounter.goal);
    const used = new Set();
    for (const word of encounter.expected) {
      const tile = encounter.tiles.find(t => t.word === word && !used.has(t.id));
      expect(tile).toBeTruthy();
      used.add(tile.id);
      await page.locator('[data-quest-tile="' + tile.id + '"]').click();
    }
    await expect(page.locator('#quest-check')).toBeEnabled();
    await page.locator('#quest-check').click();
    await expect(page.locator('#quest')).toHaveAttribute('data-quest-phase', 'won');
    await page.locator('#quest-next').click();
    if (roundIndex + 1 < encounters.length)
      await expect(page.locator('#quest')).toHaveAttribute('data-quest-round', String(roundIndex + 1));
  }
  await expect(page.locator('#quest')).toHaveAttribute('data-quest-phase', 'victory');
  await expect(page.locator('.quest-end-stars')).toContainText('★★★');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('mvl:quest:records:de') ?? '{}'));
  expect(stored['first-words'].stars).toBe(3);
  await page.goto('/#de/start');
  await expect(page.locator('a.game-level-node[href="#de/lesson/identity"]')).toBeVisible();
});

test('wrong word order costs hearts and clues reveal one block without auto-solving', async ({ page }) => {
  await page.goto('/#de/play/first-words');
  const firstRound = encounters[0];
  const decoy = firstRound.tiles.find(t => !firstRound.expected.includes(t.word));
  expect(decoy).toBeTruthy();
  const wrongOrder = [decoy, ...firstRound.tiles.filter(t => t.id !== decoy.id).slice(0, firstRound.expected.length - 1)];
  for (const tile of wrongOrder) await page.locator('[data-quest-tile="' + tile.id + '"]').click();
  await page.locator('#quest-check').click();
  await expect(page.locator('.quest-hearts')).toContainText('♥♥');
  await expect(page.locator('.quest-feedback')).toContainText('correct positions');
  await page.locator('#quest-clear').click();
  await page.locator('#quest-hint').click();
  await expect(page.locator('.quest-word-tile.is-hinted')).toHaveCount(1);
  await expect(page.locator('#quest-hint')).toBeDisabled();
  await page.reload();
  await expect(page.locator('.quest-hearts')).toContainText('♥♥');
});

test('locked quest links cannot skip levels', async ({ page }) => {
  await page.goto('/#de/play/independent-life');
  await expect(page.locator('#quest')).toHaveAttribute('data-quest-round', '0');
  await expect(page.locator('.quest-world-name')).toContainText('LEVEL 1');
});

test('three failed checks trigger a real losing state with restart', async ({ page }) => {
  await page.goto('/#de/play/first-words');
  const start = encounters[0];
  const decoy = start.tiles.find(t => !start.expected.includes(t.word));
  const wrongOrder = [decoy, ...start.tiles.filter(t => t.id !== decoy.id).slice(0, start.expected.length - 1)];
  for (const tile of wrongOrder) await page.locator('[data-quest-tile="' + tile.id + '"]').click();
  for (let i = 0; i < 3; i++) await page.locator('#quest-check').click();
  await expect(page.locator('#quest')).toHaveAttribute('data-quest-phase', 'lost');
  await page.locator('#quest-restart').click();
  await expect(page.locator('#quest')).toHaveAttribute('data-quest-phase', 'play');
  await expect(page.locator('.quest-hearts')).toContainText('♥♥♥');
});

test('the root URL starts an actual sentence puzzle rather than a course menu', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#quest')).toHaveAttribute('data-quest-phase', 'play');
  await expect(page.locator('.quest-dialogue h1')).toContainText('I have a question.');
  await expect(page.locator('#quest-bank .quest-word-tile')).not.toHaveCount(0);
  await expect(page.locator('#quest-check')).toBeDisabled();
});
