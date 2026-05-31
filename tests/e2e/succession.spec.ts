import { test, expect, type Page } from '@playwright/test';
import { enableE2EMode } from './helpers/auth';
import { ROUTES } from './helpers/fixtures';

async function selectSituation(page: Page, optionName: RegExp) {
  await page.getByRole('button', { name: 'Situation familiale' }).click();
  await page.getByRole('option', { name: optionName }).click();
}

async function fillCoupleBirthDates(page: Page) {
  await page.getByRole('textbox', { name: 'Date Naiss. Ep1' }).fill('1960-01-01');
  await page.getByRole('textbox', { name: 'Date Naiss. Ep2' }).fill('1962-01-01');
}

async function fillCommunityAsset(page: Page) {
  const communityAssetField = page.getByRole('textbox', { name: 'Communaute' }).first();
  await communityAssetField.fill('100000');
  await communityAssetField.press('Tab');
  await expect(page.getByRole('heading', { name: 'Chronologie des décès' })).toBeVisible();
}

test.describe('Succession - dispositions and chronology', () => {
  test.beforeEach(async ({ page }) => {
    await enableE2EMode(page);
  });

  test('gates dispositions, flips order, and opens the couple modal', async ({ page }) => {
    await page.goto(ROUTES.succession);
    await expect(page.locator('body')).not.toContainText('Application error');

    const dispositionsButton = page.getByRole('button', { name: 'Dispositions' });
    await expect(dispositionsButton).toBeDisabled();

    await selectSituation(page, /Mari/);

    await expect(dispositionsButton).toBeEnabled();
    await fillCoupleBirthDates(page);
    await fillCommunityAsset(page);
    await expect(page.locator('.sc-chrono-item__meta').first()).toContainText(/[ÉE]poux 1/);

    await page.getByRole('button', { name: 'Ordre inverse' }).click();
    await expect(page.locator('.sc-chrono-item__meta').first()).toContainText(/[ÉE]poux 2/);

    await dispositionsButton.click();
    await expect(page.getByRole('heading', { name: /Dispositions particuli/ })).toBeVisible();
    await page.getByRole('button', { name: 'Testament' }).click();
    await expect(page.locator('.sc-testament-card')).toHaveCount(2);
  });

  test('hides the order toggle on non-couple situations and persists chainOrder for couple scenarios', async ({
    page,
  }) => {
    await page.goto(ROUTES.succession);
    await expect(page.locator('body')).not.toContainText('Application error');

    const orderToggle = page.getByRole('button', { name: 'Ordre inverse' });
    await expect(orderToggle).toHaveCount(0);

    await selectSituation(page, /Mari/);
    await fillCoupleBirthDates(page);
    await fillCommunityAsset(page);
    await expect(orderToggle).toBeVisible();
    await expect(page.locator('.sc-chrono-item__meta').first()).toContainText(/[ÉE]poux 1/);

    await orderToggle.click();
    await expect(page.locator('.sc-chrono-item__meta').first()).toContainText(/[ÉE]poux 2/);

    await page.reload();
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('.sc-chrono-item__meta').first()).toContainText(/[ÉE]poux 2/);
    await expect(orderToggle).toBeVisible();

    await selectSituation(page, /Divorc/);
    await expect(orderToggle).toHaveCount(0);

    await selectSituation(page, /Mari/);
    await fillCoupleBirthDates(page);
    await fillCommunityAsset(page);
    await expect(orderToggle).toBeVisible();
    await expect(page.locator('.sc-chrono-item__meta').first()).toContainText(/[ÉE]poux 1/);
  });
});
