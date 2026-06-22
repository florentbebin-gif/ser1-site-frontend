import { test, expect } from '@playwright/test';
import { enableE2EMode } from './helpers/auth';
import { ROUTES } from './helpers/fixtures';

test.describe('DossierRail responsive', () => {
  test.beforeEach(async ({ page }) => {
    await enableE2EMode(page);
  });

  test('desktop /audit conserve l’encart dossier mais retire le rail de chaînage', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(ROUTES.audit);

    // /audit est un cockpit pleine largeur : l'encart « Dossier de travail » est
    // rendu par la page elle-même, le rail partagé n'est plus monté.
    await expect(page.getByTestId('dossier-loaded-card')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Dossier de travail' })).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Avancement du dossier' }),
    ).toBeVisible();
    await expect(page.getByTestId('app-shell-dossier-rail')).toHaveCount(0);
    await expect(page.getByTestId('dossier-rail-panel')).toHaveCount(0);

    const railBox = await page.locator('.audit-landing__rail').boundingBox();
    const dossierBox = await page.getByTestId('dossier-loaded-card').boundingBox();
    const startBox = await page
      .locator('section')
      .filter({
        has: page.getByRole('heading', { level: 2, name: 'Nouvelle analyse patrimoniale' }),
      })
      .boundingBox();
    expect(railBox).not.toBeNull();
    expect(dossierBox).not.toBeNull();
    expect(startBox).not.toBeNull();
    expect(railBox!.x).toBeLessThan(1);
    expect(railBox!.width).toBeLessThanOrEqual(181);
    expect(dossierBox!.x).toBeLessThan(16);
    expect(dossierBox!.height).toBeLessThan(160);
    expect(startBox!.x + startBox!.width).toBeLessThanOrEqual(1432);
    expect(startBox!.height).toBeLessThan(260);
    await expect(
      page.getByRole('heading', { level: 2, name: 'Nouvelle analyse patrimoniale' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /^Commencer par le client/ })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Points à confirmer' })).toHaveCount(
      0,
    );
    await expect(page.getByRole('heading', { level: 2, name: 'Objectifs' })).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 2, name: 'Stratégie' })).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Calculs à venir' })).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 2, name: 'Masses successorales' })).toHaveCount(
      0,
    );

    const statusBox = await page.locator('.audit-status-bar').boundingBox();
    await expect(page.locator('.audit-status-bar')).toHaveCSS('border-top-width', '0px');
    await expect(page.locator('.audit-progress-rail__label').first()).toHaveCSS('font-size', '8px');
    await expect(page.getByTestId('audit-export-menu-button')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Exporter/i })).toHaveCount(0);
    const railPathBackground = await page
      .locator('.audit-progress-rail__list')
      .evaluate((node) => getComputedStyle(node, '::before').backgroundImage);
    expect(railPathBackground).not.toBe('none');
    const dividerBox = await page.locator('.audit-landing__title-divider').boundingBox();
    expect(statusBox).not.toBeNull();
    expect(dividerBox).not.toBeNull();
    expect(dividerBox!.y - (statusBox!.y + statusBox!.height)).toBeLessThan(10);
  });

  test('mobile /audit masque seulement l’avancement et garde le dossier visible', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTES.audit);

    await expect(page.getByTestId('dossier-loaded-card')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Dossier de travail' })).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Avancement du dossier' }),
    ).toBeHidden();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Nouvelle analyse patrimoniale' }),
    ).toBeVisible();
    await expect(page.getByRole('region', { name: 'Calculs à venir' })).toHaveCount(0);
    const startBox = await page
      .locator('section')
      .filter({
        has: page.getByRole('heading', { level: 2, name: 'Nouvelle analyse patrimoniale' }),
      })
      .boundingBox();
    expect(startBox).not.toBeNull();
    expect(startBox!.x).toBeGreaterThanOrEqual(0);
    expect(startBox!.x + startBox!.width).toBeLessThanOrEqual(390);
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
    await page.goto(ROUTES.succession);

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
