import { test, expect } from '@playwright/test';
import { loginWithCredentials } from './helpers/auth';
import { ROUTES } from './helpers/fixtures';

/**
 * Credit Simulator E2E tests.
 *
 * Requires real Supabase credentials:
 *   E2E_EMAIL / E2E_PASSWORD
 */
const E2E_EMAIL = process.env.E2E_EMAIL;
const E2E_PASSWORD = process.env.E2E_PASSWORD;
const hasCredentials = !!(E2E_EMAIL && E2E_PASSWORD);

test.describe('Credit Simulator', () => {
  test.skip(!hasCredentials, 'E2E_EMAIL / E2E_PASSWORD not set — skipping authenticated tests');

  test.beforeEach(async ({ page }) => {
    if (hasCredentials) {
      await loginWithCredentials(page, E2E_EMAIL!, E2E_PASSWORD!);
    }
  });

  test('charge la page Crédit et affiche le formulaire', async ({ page }) => {
    await page.goto(ROUTES.credit);
    await page.waitForLoadState('networkidle');

    // Credit page should show loan input fields
    await expect(page.locator('input').first()).toBeVisible({ timeout: 10_000 });
  });

  test('saisie prêt et affichage tableau amortissement', async ({ page }) => {
    await page.goto(ROUTES.credit);
    await page.waitForLoadState('networkidle');

    // Look for capital/montant input and fill it
    const capitalInput = page.locator('input').first();
    if (await capitalInput.isVisible()) {
      await capitalInput.fill('200000');
    }

    // The page should display computed results with euro formatting
    await expect(page.locator('text=€')).toBeVisible({ timeout: 15_000 });
  });

  test('le bouton export est présent', async ({ page }) => {
    await page.goto(ROUTES.credit);
    await page.waitForLoadState('networkidle');

    const exportBtn = page.locator('text=Export').or(page.locator('[class*="export"]'));
    await expect(exportBtn.first()).toBeVisible({ timeout: 10_000 });
  });
});
