import { test, expect } from '@playwright/test';
import { enableE2EMode } from './helpers/auth';
import { ROUTES } from './helpers/fixtures';

test.describe('DossierRail responsive', () => {
  test.beforeEach(async ({ page }) => {
    await enableE2EMode(page);
  });

  test('desktop /audit affiche le rail complet', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(ROUTES.audit);

    await expect(page.getByTestId('dossier-rail-panel')).toBeVisible();
    await expect(page.getByTestId('dossier-rail')).toHaveAttribute('data-density', 'full');
    await expect(page.getByTestId('dossier-rail-journey-label')).toContainText('Audit global');
    await expect(page.getByTestId('dossier-rail-current')).toContainText('Objectifs client');
  });

  test('desktop /strategy affiche le rail complet', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(ROUTES.strategy);

    await expect(page.getByTestId('dossier-rail-panel')).toBeVisible();
    await expect(page.getByTestId('dossier-rail')).toHaveAttribute('data-density', 'full');
    await expect(page.getByTestId('dossier-rail-current')).toContainText('Stratégie');
  });

  test('desktop /sim/succession affiche le rail compact Transmission privée', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(ROUTES.succession);

    const rail = page.getByTestId('dossier-rail');
    await expect(rail).toHaveAttribute('data-density', 'compact');
    await expect(page.getByTestId('dossier-rail-panel')).toBeVisible();
    await expect(page.getByTestId('dossier-rail-journey-label')).toContainText(
      'Transmission privée',
    );
    await expect(page.getByTestId('dossier-rail-current')).toContainText('Succession');
  });

  test('mobile /sim/succession masque le rail complet et affiche la pastille version', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTES.succession);

    await expect(page.getByTestId('dossier-rail-panel')).toBeHidden();
    await expect(page.getByTestId('dossier-rail-mobile-pill')).toBeVisible();
    await expect(page.getByTestId('dossier-rail-mobile-pill')).toContainText('Version');
  });

  test('le rail ne duplique pas les actions globales de topbar', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(ROUTES.audit);

    const railColumn = page.getByTestId('app-shell-dossier-rail');
    await expect(railColumn.getByTestId('dossier-loaded-card')).toBeVisible();
    await expect(railColumn.getByTestId('home-mode-card')).toHaveCount(0);

    const rail = page.getByTestId('dossier-rail');
    await expect(
      rail.getByRole('button', {
        name: /Sauvegarder|Charger|Réinitialiser|Exporter|Mode/i,
      }),
    ).toHaveCount(0);
  });
});
