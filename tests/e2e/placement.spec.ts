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

  test("permet de saisir les champs numériques et conserve les contrôles forcés", async ({ page }) => {
    await page.goto(ROUTES.placement);

    const ageField = page
      .locator('.pl-client-card .pl-field')
      .filter({ hasText: 'Âge actuel' })
      .locator('input');

    await ageField.click();
    await expect(ageField).toBeFocused();
    await ageField.fill('45');
    await ageField.press('Tab');
    await expect(ageField).toHaveValue('45');

    await page.getByRole('tab', { name: 'Liquidation' }).click();

    const liquidationCard = page.locator('.premium-card').filter({ hasText: 'Phase de liquidation' });
    const durationField = liquidationCard
      .locator('tr')
      .filter({ hasText: 'Durée de liquidation' })
      .locator('input');
    const strategySelect = liquidationCard.locator('select').first();

    await durationField.click();
    await expect(durationField).toBeFocused();
    await durationField.fill('12');
    await durationField.press('Tab');
    await expect(durationField).toHaveValue('12');

    await expect(strategySelect).toBeDisabled();
    await expect(strategySelect).toHaveValue('epuiser');
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
