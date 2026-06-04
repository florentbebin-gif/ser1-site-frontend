import { expect, test } from '@playwright/test';
import { enableE2EMode } from './helpers/auth';
import { ROUTES } from './helpers/fixtures';

test.describe('Trésorerie société - scénario métier', () => {
  test.beforeEach(async ({ page }) => {
    await enableE2EMode(page);
  });

  test('ouvre le paramétrage société et renseigne le compte de résultat', async ({ page }) => {
    await page.goto(ROUTES.tresorerieSociete);

    await expect(page.getByTestId('tresorerie-societe-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Trésorerie société' })).toBeVisible();

    await page.getByRole('button', { name: /Paramétrer Holding patrimoniale/i }).click();
    const modal = page.getByRole('dialog', { name: 'Paramétrer la société' });
    await expect(modal).toBeVisible();

    await modal.getByRole('button', { name: 'Compte de résultat' }).click();
    const revenueField = modal
      .locator('.ts-field')
      .filter({ hasText: 'Chiffre d’affaires annuel' })
      .locator('input');
    const costField = modal
      .locator('.ts-field')
      .filter({ hasText: 'Coûts de structure annuels' })
      .locator('input');
    const bfrField = modal.locator('.ts-field').filter({ hasText: 'BFR' }).locator('input');

    await revenueField.fill('250000');
    await costField.fill('75000');
    await bfrField.fill('35000');

    await expect(revenueField).toHaveValue(/250/);
    await expect(costField).toHaveValue(/75/);
    await expect(bfrField).toHaveValue(/35/);

    await modal.getByRole('button', { name: 'Fermer', exact: true }).click();
    await expect(modal).toHaveCount(0);
  });
});
