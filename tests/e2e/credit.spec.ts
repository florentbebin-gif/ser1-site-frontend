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
    await expect(page.getByTestId('credit-capital-input')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('credit-page')).toBeVisible();
  });

  test('saisie prêt et affichage tableau amortissement', async ({ page }) => {
    await page.goto(ROUTES.credit);
    await page.waitForLoadState('networkidle');

    // Fill capital input
    await page.getByTestId('credit-capital-input').fill('200000');

    // The page should display computed results
    await expect(page.getByTestId('credit-summary-card')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('credit-cout-total-value')).toContainText('€');
  });

  test('le bouton export est présent', async ({ page }) => {
    await page.goto(ROUTES.credit);
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('export-menu-button')).toBeVisible({ timeout: 10_000 });
  });
});
