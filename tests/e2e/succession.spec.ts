import { test, expect, type Page } from '@playwright/test';
import { enableE2EMode } from './helpers/auth';
import { ROUTES } from './helpers/fixtures';

async function selectSituation(page: Page, optionName: RegExp) {
  const situationTrigger = page.locator('.sc-civil-grid .sc-field').first().locator('.sc-select__trigger');
  await situationTrigger.click();
  await page.getByRole('option', { name: optionName }).click();
}

test.describe('Succession - dispositions and chronology', () => {
  test.beforeEach(async ({ page }) => {
    await enableE2EMode(page);
  });

  test('gates dispositions, flips order, and opens the couple modal', async ({ page }) => {
    await page.goto(ROUTES.succession);
    await expect(page.locator('body')).not.toContainText('Application error');

    const dispositionsButton = page.getByRole('button', { name: '+ Dispositions' });
    await expect(dispositionsButton).toBeDisabled();

    await selectSituation(page, /Mari/);

    await expect(dispositionsButton).toBeEnabled();
    await expect(page.locator('.sc-chrono-item__meta').first()).toContainText('Epoux 1');

    await page.getByRole('button', { name: 'Ordre inverse' }).click();
    await expect(page.locator('.sc-chrono-item__meta').first()).toContainText('Epoux 2');

    await dispositionsButton.click();
    await expect(page.getByRole('heading', { name: /Dispositions particuli/ })).toBeVisible();
    await expect(page.locator('.sc-testament-card')).toHaveCount(2);
  });

  test('hides the order toggle on non-couple situations and persists chainOrder for couple scenarios', async ({ page }) => {
    await page.goto(ROUTES.succession);
    await expect(page.locator('body')).not.toContainText('Application error');

    const orderToggle = page.getByRole('button', { name: 'Ordre inverse' });
    await expect(orderToggle).toHaveCount(0);

    await selectSituation(page, /Mari/);
    await expect(orderToggle).toBeVisible();
    await expect(page.locator('.sc-chrono-item__meta').first()).toContainText('Epoux 1');

    await orderToggle.click();
    await expect(page.locator('.sc-chrono-item__meta').first()).toContainText('Epoux 2');

    await page.reload();
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('.sc-chrono-item__meta').first()).toContainText('Epoux 2');
    await expect(orderToggle).toBeVisible();

    await selectSituation(page, /Divorc/);
    await expect(orderToggle).toHaveCount(0);

    await selectSituation(page, /Mari/);
    await expect(orderToggle).toBeVisible();
    await expect(page.locator('.sc-chrono-item__meta').first()).toContainText('Epoux 1');
  });
});
