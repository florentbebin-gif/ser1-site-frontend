import { expect, test } from '@playwright/test';
import { enableE2EMode } from './helpers/auth';
import { ROUTES } from './helpers/fixtures';

test.describe('Prévoyance - scénario métier', () => {
  test.beforeEach(async ({ page }) => {
    await enableE2EMode(page);
  });

  test('renseigne la situation et signale le régime obligatoire manquant', async ({ page }) => {
    await page.goto(ROUTES.prevoyance);

    await expect(page.getByTestId('prevoyance-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Prévoyance' })).toBeVisible();

    await page.getByLabel('Date de naissance').fill('1980-01-01');
    await page.getByLabel('Revenu imposable à couvrir').fill('90000');

    await expect(page.getByLabel('Date de naissance')).toHaveValue(/1980/);
    await expect(page.getByLabel('Revenu imposable à couvrir')).toHaveValue(/90/);
    await expect(page.getByText('Renseignez le régime et la date de naissance')).toBeVisible();

    await page.getByRole('button', { name: 'Sélectionner' }).click();
    await expect(page.getByRole('listbox', { name: 'Sélectionner' })).toBeVisible();
  });
});
