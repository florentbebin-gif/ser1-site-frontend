import { expect, test } from '@playwright/test';
import { enableE2EMode } from './helpers/auth';
import { ROUTES } from './helpers/fixtures';

test.describe('Placement - smoke and key interactions', () => {
  test.beforeEach(async ({ page }) => {
    await enableE2EMode(page);
  });

  test('charge avec sa structure minimale', async ({ page }) => {
    await page.goto(ROUTES.placement);

    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.getByTestId('placement-page')).toBeVisible();
    await expect(page.getByTestId('placement-mode-btn')).toBeVisible();
    await expect(page.getByTestId('placement-results-card')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Comparer deux placements' })).toBeVisible();
  });

  test('affiche les options expertes quand le mode expert est activé', async ({ page }) => {
    await page.goto(ROUTES.placement);

    await expect(page.getByTestId('placement-row-per-bancaire')).toHaveCount(0);
    await page.getByTestId('placement-mode-btn').click();
    await expect(page.getByTestId('placement-row-per-bancaire')).toBeVisible();

    await page.getByRole('tab', { name: 'Liquidation' }).click();
    await expect(page.getByTestId('placement-row-liquidation-bareme-ir')).toBeVisible();
  });

  test('ouvre et ferme la modale de versements', async ({ page }) => {
    await page.goto(ROUTES.placement);

    await page.getByTestId('placement-config-product-1').click();
    await expect(page.getByTestId('placement-versements-modal')).toBeVisible();
    await page.getByTestId('placement-versements-close').click();
    await expect(page.getByTestId('placement-versements-modal')).toHaveCount(0);
  });

  test("ouvre le menu d'export", async ({ page }) => {
    await page.goto(ROUTES.placement);

    await page.getByTestId('export-menu-button').click();
    await expect(page.getByTestId('export-menu-dropdown')).toBeVisible();
    await expect(page.getByTestId('export-option-excel')).toBeVisible();
  });
});
