import { test, expect, type Locator, type Page } from '@playwright/test';
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

  test('mobile /audit garde les pages internes et un drawer dans le viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(ROUTES.audit);
    await page.getByRole('button', { name: /^Commencer par le client/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Foyer & famille' })).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('heading', { level: 2, name: 'Points prioritaires' })).toHaveCount(
      0,
    );
    await expect(page.getByRole('heading', { level: 2, name: 'Synthèse foyer' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Continuer l.audit/ })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectLocatorInsideViewport(page.locator('.audit-foyer-pivot').first(), 390);
    await expectLocatorInsideViewport(page.locator('.audit-cockpit-card').first(), 390);

    const situationFamilialeCard = page.locator('.audit-cockpit-card').filter({
      has: page.getByRole('heading', { level: 2, name: 'Situation familiale' }),
    });
    await situationFamilialeCard.click();
    const drawer = page.getByRole('dialog', { name: 'Situation familiale' });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Enregistrer' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectLocatorInsideViewport(drawer, 390);
    await drawer.getByRole('button', { name: 'Fermer' }).click();
    await expect(drawer).toBeHidden();
    await page.setViewportSize({ width: 1440, height: 900 });

    const internalPages = [
      { button: /Situation familiale/, heading: 'Foyer & famille' },
      { button: /Actifs — Inventaire déclaratif/, heading: 'Actifs / passifs' },
      { button: /Fiscalité — Déclaratif/, heading: 'Fiscalité' },
      { button: /Objectifs/, heading: 'Objectifs' },
    ];

    for (const internalPage of internalPages) {
      await page
        .locator('.audit-landing__rail')
        .getByRole('button', { name: internalPage.button })
        .click();
      await expect(
        page.getByRole('heading', { level: 1, name: internalPage.heading }),
      ).toBeVisible();

      await page.setViewportSize({ width: 390, height: 844 });
      await expect(
        page.getByRole('heading', { level: 2, name: 'Points prioritaires' }),
      ).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
      await expectLocatorInsideViewport(
        page.locator('.audit-cockpit-card, .audit-inventory-panel').first(),
        390,
      );
      await page.setViewportSize({ width: 1440, height: 900 });
    }
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

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
}

async function expectLocatorInsideViewport(locator: Locator, width: number) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(width);
}
