import { expect, test } from '@playwright/test';
import { enableE2EMode } from './helpers/auth';
import { ROUTES } from './helpers/fixtures';

test.describe('PER - scénarios métier', () => {
  test.beforeEach(async ({ page }) => {
    await enableE2EMode(page);
  });

  test('oriente depuis le hub vers Potentiel puis affiche les documents nécessaires', async ({
    page,
  }) => {
    await page.goto('/sim/per');

    await expect(page.getByRole('heading', { name: 'SIMULATEURS PER' })).toBeVisible();
    await page.getByRole('button', { name: 'Potentiel' }).click();
    await expect(page).toHaveURL(/\/sim\/per\/potentiel$/);
    await expect(page.getByTestId('per-potentiel-page')).toBeVisible();

    await page
      .getByRole('button', { name: 'Sélectionner Contrôle du potentiel avant versement' })
      .click();
    await expect(page.getByRole('heading', { name: 'Documents nécessaires' })).toBeVisible();
  });

  test('ouvre la saisie manuelle du transfert et expose les champs du relevé', async ({ page }) => {
    await page.goto(ROUTES.perTransfert);

    await expect(page.getByTestId('per-transfert-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'PER — Transfert' })).toBeVisible();

    await page.getByRole('button', { name: /Saisie manuelle/i }).click();
    await expect(page.getByText('Relevé de situation')).toBeVisible();
    await expect(page.getByLabel('Capital acquis')).toBeVisible();
    await page.getByLabel('Capital acquis').fill('120000');
    await expect(page.getByLabel('Capital acquis')).toHaveValue(/120/);
  });
});
