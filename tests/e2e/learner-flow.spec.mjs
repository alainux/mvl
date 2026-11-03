import { test, expect } from '@playwright/test';

test('the builder exposes actual German word order and operator changes', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#studio-result')).toContainText('Ich brauche Hilfe.');
  await page.locator('[data-recipe="past"]').click();
  await expect(page.locator('#studio-result')).toContainText('Ich habe gestern ein Ticket gekauft.');
  await expect(page.locator('#studio-structure')).toContainText('Past participle');
  await page.locator('[data-operator="negative"]').click();
  await expect(page.locator('#studio-result')).not.toContainText('Ich habe gestern ein Ticket gekauft.');
  await expect(page.locator('#studio-delta')).toBeVisible();
});

test('subject changes never offer invalid self-directed recipients', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-choice-value="Help someone"]').count();
  await page.locator('[data-choice-value="help"]').click();
  await page.locator('[data-slot="agent"]').click();
  await page.locator('[data-choice-value="we"]').click();
  await page.locator('[data-slot="argument"]').click();
  await expect(page.locator('[data-choice-slot="argument"][data-choice-value="speaker"]')).toHaveCount(0);
  await expect(page.locator('[data-choice-slot="argument"][data-choice-value="we"]')).toHaveCount(0);
});

test('practice gives a hint and can remix the model into editable blocks', async ({ page }) => {
  await page.goto('/#de/practice');
  await expect(page.locator('#practice-answer')).toBeVisible();
  await page.locator('#practice-hint').click();
  await expect(page.locator('#practice-hint-content')).toBeVisible();
  await page.locator('#practice-remix').click();
  await expect(page.locator('#studio-result')).toBeVisible();
  await expect(page).toHaveURL(/#de\/builder$/);
});

test('mobile navigation reaches practice without an obstructing menu', async ({ page }, testInfo) => {
  if (testInfo.project.name !== 'mobile') test.skip();
  await page.goto('/');
  await page.locator('#menu-toggle').click();
  await expect(page.locator('body')).toHaveClass(/nav-open/);
  await page.locator('nav[aria-label="Study tools"] a[href="#de/practice"]').click();
  await expect(page.locator('#practice-answer')).toBeVisible();
  await expect(page.locator('body')).not.toHaveClass(/nav-open/);
});
