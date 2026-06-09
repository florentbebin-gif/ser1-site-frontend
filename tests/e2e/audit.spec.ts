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
    await expect(page.getByRole('heading', { level: 2, name: 'Synthèse dossier' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Objectifs' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Stratégie' })).toBeVisible();
    await expect(page.getByText('À venir').first()).toBeVisible();
    await expect(page.getByText(/Audit global/i)).toHaveCount(0);
  });

  test('ouvre le wizard depuis les cartes actives et garde la stratégie verrouillée', async ({
    page,
  }) => {
    await page.goto(ROUTES.audit);
    await page.waitForLoadState('networkidle');

    const strategie = page.locator('section').filter({
      has: page.getByRole('heading', { level: 2, name: 'Stratégie' }),
    });
    await expect(strategie.getByText('Verrouillé')).toBeVisible();
    await expect(strategie.getByRole('button')).toHaveCount(0);
    await expect(strategie.getByText(/radar|\/\s*100|score|scénario activable/i)).toHaveCount(0);

    await page.getByRole('button', { name: /^Voir l'audit complet/ }).click();
    await expect(page.getByRole('heading', { name: 'Situation familiale' })).toBeVisible();

    await page.getByRole('button', { name: '← Synthèse du dossier' }).click();
    await page.getByRole('button', { name: /^Définir les objectifs client/ }).click();
    await expect(page.getByRole('heading', { name: 'Objectifs client' })).toBeVisible();
  });
});
