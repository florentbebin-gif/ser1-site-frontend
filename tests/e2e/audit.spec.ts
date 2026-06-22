import { test, expect } from '@playwright/test';
import { loginWithCredentials } from './helpers/auth';
import { ROUTES } from './helpers/fixtures';

/**
 * Audit Patrimonial E2E tests.
 *
 * Requires real Supabase credentials:
 *   E2E_EMAIL / E2E_PASSWORD
 */
const E2E_EMAIL = process.env.E2E_EMAIL;
const E2E_PASSWORD = process.env.E2E_PASSWORD;
const hasCredentials = !!(E2E_EMAIL && E2E_PASSWORD);

test.describe('Audit Patrimonial', () => {
  test.skip(!hasCredentials, 'E2E_EMAIL / E2E_PASSWORD not set — skipping authenticated tests');

  test.beforeEach(async ({ page }) => {
    if (hasCredentials) {
      await loginWithCredentials(page, E2E_EMAIL!, E2E_PASSWORD!);
    }
  });

  test('charge la landing cockpit /audit', async ({ page }) => {
    await page.goto(ROUTES.audit);
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('dossier-loaded-card')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { level: 2, name: 'Dossier de travail' })).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Avancement du dossier' }),
    ).toBeVisible();
    await expect(page.getByText('Dossier renseigné')).toBeVisible();

    if (
      (await page
        .getByRole('heading', { level: 2, name: 'Nouvelle analyse patrimoniale' })
        .count()) > 0
    ) {
      await expect(
        page.getByRole('heading', { level: 2, name: 'Nouvelle analyse patrimoniale' }),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: /^Commencer par le client/ })).toBeVisible();
      await expect(page.getByRole('heading', { level: 2, name: 'Points à confirmer' })).toHaveCount(
        0,
      );
      await expect(page.getByRole('region', { name: 'Calculs à venir' })).toHaveCount(0);
      await expect(page.getByRole('heading', { level: 2, name: 'Objectifs' })).toHaveCount(0);
      await expect(page.getByRole('heading', { level: 2, name: 'Stratégie' })).toHaveCount(0);
    } else {
      await expect(page.getByRole('heading', { level: 2, name: 'Synthèse dossier' })).toBeVisible();
      await expect(
        page.getByRole('heading', { level: 2, name: 'Points à confirmer' }),
      ).toBeVisible();
      await expect(page.getByRole('region', { name: 'Calculs à venir' })).toBeVisible();
      await expect(
        page.getByRole('heading', { level: 2, name: 'Masses successorales' }),
      ).toBeVisible();
      await expect(page.getByRole('heading', { level: 2, name: 'Objectifs' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 2, name: 'Stratégie' })).toBeVisible();
    }
    await expect(page.getByText('À venir').first()).toBeVisible();
    await expect(page.getByText(/Audit global/i)).toHaveCount(0);
    const forbiddenAuditWording = new RegExp(
      [`Cl${'oud'}`, `dis${'tant'}`, `ser${'veur'}`, `Assistant ${'SER1'}`].join('|'),
      'i',
    );
    await expect(page.getByText(forbiddenAuditWording)).toHaveCount(0);
  });

  test('ouvre le wizard depuis les cartes actives et garde la stratégie verrouillée', async ({
    page,
  }) => {
    await page.goto(ROUTES.audit);
    await page.waitForLoadState('networkidle');

    const isNewAnalysis =
      (await page
        .getByRole('heading', { level: 2, name: 'Nouvelle analyse patrimoniale' })
        .count()) > 0;

    if (!isNewAnalysis) {
      const strategie = page.locator('section').filter({
        has: page.getByRole('heading', { level: 2, name: 'Stratégie' }),
      });
      await expect(strategie.getByText('Verrouillé')).toBeVisible();
      await expect(strategie.getByText('Objectifs définis')).toBeVisible();
      await expect(strategie.getByText('Patrimoine structuré')).toBeVisible();
      await expect(strategie.getByText('Aucun scénario disponible à ce stade.')).toBeVisible();
      await expect(strategie.getByRole('button')).toHaveCount(0);
      await expect(strategie.getByText(/radar|\/\s*100|score|scénario activable/i)).toHaveCount(0);

      const carousel = page.getByRole('region', { name: 'Calculs à venir' });
      await expect(carousel.getByRole('heading', { name: 'Masses successorales' })).toBeVisible();
      await expect(carousel.getByRole('heading', { name: 'Organigramme société' })).toHaveCount(0);
      await expect(page.locator('.audit-carousel__slide[aria-hidden="true"]')).toHaveCount(2);
      await expect(page.locator('.audit-carousel__slide--prev')).toHaveCSS(
        'pointer-events',
        'none',
      );
      await carousel.getByRole('button', { name: /suivant/i }).click();
      await expect(carousel.getByRole('heading', { name: 'Organigramme société' })).toBeVisible();
      await page.keyboard.press('ArrowRight');
      await expect(carousel.getByRole('heading', { name: 'Impôt sur le revenu' })).toBeVisible();
      await expect(carousel.getByRole('link')).toHaveCount(0);
    }

    await page
      .getByRole('button', { name: /^(Voir l'audit complet|Commencer par le client)/ })
      .click();
    await expect(page.getByRole('heading', { name: 'Situation familiale' })).toBeVisible();

    await page.getByRole('button', { name: '← Synthèse du dossier' }).click();

    if (isNewAnalysis) {
      await expect(
        page.getByRole('heading', { level: 2, name: 'Nouvelle analyse patrimoniale' }),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: /^Définir les objectifs client/ })).toHaveCount(
        0,
      );
    } else {
      await page.getByRole('button', { name: /^Définir les objectifs client/ }).click();
      await expect(page.getByRole('heading', { name: 'Objectifs client' })).toBeVisible();
    }
  });
});
