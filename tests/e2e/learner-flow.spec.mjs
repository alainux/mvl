import { test, expect } from '@playwright/test';
import { compileGuide } from '../../docs/assets/learning/compile.js';
import { drillQuestions } from '../../docs/assets/ui/game-model.js';
import { clozeFor } from '../../docs/assets/ui/drill-cloze.js';
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
  await expect(page.locator('.game-level-page > .game-example-grid')).toBeVisible();
  await page.locator('[data-remix-example="first-words-7"]').click();
  await expect(page.locator('#snap-sentence')).toContainText('Ich habe eine Frage.');
  await page.locator('#snap-lab').click();
  await expect(page.locator('#studio-structure')).toBeVisible();
  await expect(page.locator('#studio-back')).toHaveAttribute('href', '#de/lesson/first-words');
});

test('a one-word cloze drill earns XP but does not unlock the next quest', async ({ page }) => {
  await page.goto('/#de/practice/first-words');
  for (const [i, question] of deck.entries()) {
    const cloze = clozeFor(question.target, i, 'de');
    await expect(page.locator('.cloze-translation')).toContainText(question.english);
    await expect(page.locator('.cloze-target .cloze-blank')).toContainText('······');
    await page.locator('#drill-input').fill(cloze.word);
    await page.locator('#drill-check').click();
    await expect(page.locator('.cloze-feedback.is-correct')).toBeVisible();
    await page.locator('#drill-next').click();
  }
  await expect(page.locator('.game-round-end h1')).toHaveText('Drill conquered!');
  await page.goto('/#de/start');
  await expect(page.locator('a.game-level-node[href="#de/lesson/identity"]')).toHaveCount(0);
  await expect(page.locator('.game-top-score')).toContainText('XP');
});

test('wrong missing word shows the full target phrase; Enter moves to the next gap', async ({ page }) => {
  await page.goto('/#de/practice/first-words');
  await expect(page.locator('#drill-input')).toBeFocused();
  await page.locator('#drill-input').fill('thiscannotbetheword');
  await page.keyboard.press('Enter');
  await expect(page.locator('.cloze-feedback.is-wrong')).toBeVisible();
  await expect(page.locator('.cloze-complete')).toHaveText(deck[0].target);
  await page.keyboard.press('Enter');
  await expect(page.locator('.cloze-translation')).toContainText(deck[1].english);
  await page.locator('#drill-input').fill(clozeFor(deck[1].target, 1, 'de').word);
  await page.keyboard.press('Enter');
  await expect(page.locator('.cloze-feedback.is-correct')).toBeVisible();
  await expect(page.locator('.cloze-meter')).toContainText('1 correct');
});

test('hints are optional, progressive and preserve the typed input', async ({ page }) => {
  await page.goto('/#de/practice/first-words');
  await expect(page.locator('.cloze-footnote')).toContainText('No countdown');
  await page.locator('#drill-input').fill('guess');
  await page.locator('#drill-hint').click();
  const hint = clozeFor(deck[0].target, 0, 'de');
  await expect(page.locator('#drill-hint-message')).toContainText('starts with');
  await expect(page.locator('#drill-hint-message')).toContainText(String(hint.length));
  await expect(page.locator('#drill-input')).toHaveValue('guess');
  await page.locator('#drill-hint').click();
  await expect(page.locator('#drill-hint')).toBeDisabled();
  await page.locator('#drill-input').fill(hint.word);
  await page.keyboard.press('Enter');
  await expect(page.locator('.cloze-feedback.is-correct')).toContainText('+4 XP');
  await page.keyboard.press('Enter');
  await expect(page.locator('.cloze-translation')).toContainText(deck[1].english);
});

test('skip reveals the missing word without giving free XP', async ({ page }) => {
  await page.goto('/#de/practice/first-words');
  await page.locator('#drill-reveal').click();
  await expect(page.locator('.cloze-feedback.is-wrong')).toBeVisible();
  await expect(page.locator('.cloze-complete')).toHaveText(deck[0].target);
  await expect(page.locator('.cloze-session-stat')).toContainText('0 XP');
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
  await expect(page.locator('#drill-input')).toBeVisible();
  await expect(page.locator('body')).not.toHaveClass(/nav-open/);
  await page.locator('#menu-toggle').click();
  await page.locator('nav[aria-label="Study tools"] a[href="#de/cards"]').click();
  await expect(page.locator('#card-flip')).toBeVisible();
});

test('a locked deep link cannot mismatch drill prompts with answer validation', async ({ page }) => {
  await page.goto('/#de/practice/independent-life');
  await expect(page.locator('#drill-lesson')).toHaveValue('first-words');
  await expect(page.locator('.cloze-translation')).toContainText(deck[0].english);
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
    await expect(page.locator('.quest-recipe > span')).toHaveCount(encounter.expected.length);
    await expect(page.locator('.quest-empty-tile')).toHaveCount(encounter.expected.length);
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


test('snap builder uses compatible grammar sockets and can clear a semantic blueprint', async ({ page }) => {
  await page.goto('/#de/builder');
  await expect(page.locator('#snap-sockets .snap-word')).not.toHaveCount(0);
  await expect(page.locator('#snap-tools [data-snap-control]')).toHaveCount(5);
  await expect(page.locator('#snap-sentence')).not.toBeEmpty();
  await page.locator('[data-snap-mission="yesterday"]').click();
  await expect(page.locator('#snap-objective')).toContainText('Change the timeline');
  await expect(page.locator('#snap-cleared')).toHaveText('0 / 4');
  await page.locator('[data-snap-control="tense"]').click();
  await page.locator('[data-snap-for="tense"][data-snap-value="past"]').click();
  await expect(page.locator('#snap-cleared')).toHaveText('1 / 4');
  await expect(page.locator('#snap-feedback')).toContainText('Blueprint');
  await expect(page.locator('#snap-sentence')).toHaveText(await page.locator('#studio-result').textContent());
  const completed = await page.evaluate(() => JSON.parse(localStorage.getItem('mvl:studio:blueprints:de') ?? '[]'));
  expect(completed).toContain('yesterday');
  await expect(page.locator('#snap-next')).toBeVisible();
  await page.locator('#snap-next').click();
  await expect(page.locator('#snap-objective')).toContainText('Make a future plan');
});

test('builder word blocks always match the generated sentence and preserve real German word order', async ({ page }) => {
  await page.goto('/#de/builder');
  await page.locator('[data-snap-mission="yesterday"]').click();
  const checkWordOrder = async () => {
    const actual = (await page.locator('#snap-sentence').textContent()).trim().split(/\s+/u);
    const blocks = await page.locator('#snap-sockets .snap-word > strong').allTextContents();
    expect(blocks).toEqual(actual);
  };
  await checkWordOrder();
  await expect(page.locator('#snap-sockets .snap-word')).toHaveCount(4);
  // Tense has no visible word in the present tense: it remains in the separate control bar.
  await expect(page.locator('#snap-sockets [data-snap-slot="tense"]')).toHaveCount(0);
  await page.locator('#snap-tools [data-snap-control="tense"]').click();
  await page.locator('[data-snap-for="tense"][data-snap-value="past"]').click();
  await checkWordOrder();
  await expect(page.locator('#snap-sockets .snap-word')).toHaveCount(6);
  await expect(page.locator('#snap-sockets .snap-word').nth(0)).toContainText('Ich');
  await expect(page.locator('#snap-sockets .snap-word').nth(1)).toContainText('habe');
  await expect(page.locator('#snap-sockets .snap-word').nth(2)).toContainText('gestern');
  await expect(page.locator('#snap-sockets .snap-word').nth(3)).toContainText('ein');
  await expect(page.locator('#snap-sockets .snap-word').nth(4)).toContainText('Ticket');
  await expect(page.locator('#snap-sockets .snap-word').nth(5)).toContainText('gekauft');
  await expect(page.locator('#snap-sockets [data-snap-slot="tense"]')).toHaveCount(2);
  await page.locator('#snap-sockets .snap-word').nth(5).click();
  await expect(page.locator('#snap-tray-title')).toContainText('ACTION');
  await page.locator('#snap-sockets .snap-word').nth(4).click();
  await expect(page.locator('#snap-tray-title')).toContainText('OBJECT');
  await page.locator('#snap-sockets .snap-word').nth(1).click();
  await expect(page.locator('#snap-tray-title')).toContainText('WHEN');
  await page.locator('[data-snap-for="tense"][data-snap-value="present"]').click();
  await checkWordOrder();
  await expect(page.locator('#snap-sockets .snap-word')).toHaveCount(4);
});

test('builder shows wrong-but-selected pieces as mismatches and can restart a blueprint', async ({ page }) => {
  await page.goto('/#de/builder');
  await page.locator('[data-snap-mission="yesterday"]').click();
  await expect(page.locator('#snap-objective')).toContainText('4 / 5 MATCH');
  await expect(page.locator('#snap-target')).toContainText('I bought a ticket yesterday');
  await expect(page.locator('#snap-sentence')).toHaveText('Ich kaufe ein Ticket.');
  await page.locator('[data-snap-slot="predicate"]').click();
  await page.locator('[data-snap-for="predicate"][data-snap-value="would_like"]').click();
  await expect(page.locator('#snap-feedback')).toContainText('Change: ACTION, WHEN');
  await expect(page.locator('#snap-sockets [data-snap-slot="predicate"]')).toHaveClass(/is-needs-work/);
  await expect(page.locator('[data-snap-for="predicate"][data-snap-value="would_like"]'))
    .toHaveClass(/is-goal-mismatch/);
  await page.locator('[data-snap-control="power"]').click();
  await page.locator('[data-snap-for="power"][data-snap-value="negative"]').click();
  await expect(page.locator('[data-snap-for="power"][data-snap-value="negative"]'))
    .toHaveClass(/is-goal-mismatch/);
  await expect(page.locator('#snap-feedback')).toContainText('POWER');
  await page.locator('#snap-reset-goal').click();
  await expect(page.locator('#snap-sentence')).toHaveText('Ich kaufe ein Ticket.');
  await expect(page.locator('[data-snap-slot="predicate"]')).toContainText('kaufe');
  await page.locator('[data-snap-control="tense"]').click();
  await page.locator('[data-snap-for="tense"][data-snap-value="past"]').click();
  await expect(page.locator('#snap-objective')).toContainText('✓ COMPLETE');
  await expect(page.locator('#snap-next')).toBeVisible();
});

test('incompatible pieces cannot be dropped into unrelated sentence slots', async ({ page }) => {
  await page.goto('/#de/builder');
  await page.locator('#snap-free').click();
  await page.locator('[data-snap-slot="agent"]').click();
  const before = await page.locator('#snap-sentence').textContent();
  const piece = page.locator('[data-snap-for="agent"][data-snap-value="we"]');
  // Dispatch native drag data directly: mobile emulation has touch drag
  // semantics, while the game supports taps for touch devices.
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await piece.dispatchEvent('dragstart', { dataTransfer });
  await page.locator('[data-snap-slot="predicate"]').dispatchEvent('drop', { dataTransfer });
  await expect(page.locator('#snap-feedback')).toContainText('does not fit');
  await expect(page.locator('#snap-sentence')).toHaveText(before);
  await page.locator('[data-snap-slot="agent"]').dispatchEvent('drop', { dataTransfer });
  await expect(page.locator('#snap-sentence')).not.toHaveText(before);
});

test('snap builder preserves the advanced grammar lab for more complex patterns', async ({ page }) => {
  await page.goto('/#de/builder');
  await expect(page.locator('#studio-workshop')).not.toHaveAttribute('open');
  await page.locator('#snap-lab').click();
  await expect(page.locator('#studio-workshop')).toHaveAttribute('open', '');
  await page.locator('#studio-show-recipes').click();
  await page.locator('[data-recipe="connect"]').click();
  await expect(page.locator('#snap-sockets .snap-word')).not.toHaveCount(0);
  await expect(page.locator('#snap-sentence')).toContainText('aber');
  await expect(page.locator('#studio-structure')).toBeVisible();
});
