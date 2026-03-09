import { test, expect } from '@playwright/test';
import { enableE2EMode } from './helpers/auth';
import { ROUTES } from './helpers/fixtures';

test.describe('Succession - dispositions and chronology', () => {
  test.beforeEach(async ({ page }) => {
    await enableE2EMode(page);
  });

  test('gates dispositions, flips order, and opens the couple modal', async ({ page }) => {
    await page.goto(ROUTES.succession);
    await expect(page.locator('body')).not.toContainText('Application error');

    const dispositionsButton = page.getByRole('button', { name: '+ Dispositions' });
    await expect(dispositionsButton).toBeDisabled();

    const situationTrigger = page.locator('.sc-civil-grid .sc-field').first().locator('.sc-select__trigger');
    await situationTrigger.click();
    await page.getByRole('option', { name: 'Marié(e)' }).click();

    await expect(dispositionsButton).toBeEnabled();
    await expect(page.locator('.sc-chrono-item__meta').first()).toContainText('Epoux 1');

    await page.getByRole('button', { name: 'Ordre inversé' }).click();
    await expect(page.locator('.sc-chrono-item__meta').first()).toContainText('Epoux 2');

    await dispositionsButton.click();
    await expect(page.getByRole('heading', { name: 'Dispositions particulières' })).toBeVisible();
    await expect(page.locator('.sc-testament-card')).toHaveCount(2);
  });
});
