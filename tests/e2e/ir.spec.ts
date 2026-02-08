import { test, expect } from '@playwright/test';
import { loginWithCredentials } from './helpers/auth';
import { ROUTES } from './helpers/fixtures';

/**
 * IR Simulator E2E tests.
 *
 * These tests require real Supabase credentials set in environment:
 *   E2E_EMAIL / E2E_PASSWORD
 *
 * If credentials are not set, tests are skipped.
 */
const E2E_EMAIL = process.env.E2E_EMAIL;
const E2E_PASSWORD = process.env.E2E_PASSWORD;
const hasCredentials = !!(E2E_EMAIL && E2E_PASSWORD);

test.describe('IR Simulator', () => {
  test.skip(!hasCredentials, 'E2E_EMAIL / E2E_PASSWORD not set — skipping authenticated tests');

  test.beforeEach(async ({ page }) => {
    if (hasCredentials) {
      await loginWithCredentials(page, E2E_EMAIL!, E2E_PASSWORD!);
    }
  });

  test('charge la page IR et affiche le formulaire', async ({ page }) => {
    await page.goto(ROUTES.ir);
    // Wait for lazy load
    await page.waitForLoadState('networkidle');

    // The IR page should show situation familiale controls
    await expect(page.getByTestId('ir-situation-select')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('ir-page')).toBeVisible();
  });

  test('saisie revenus et calcul IR', async ({ page }) => {
    await page.goto(ROUTES.ir);
    await page.waitForLoadState('networkidle');

    // Fill salary for declarant 1
    await page.getByTestId('ir-salary-d1-input').fill('45000');

    // The page should compute and display a result
    await expect(page.getByTestId('ir-results-card')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('ir-irnet-value')).toContainText('€');
  });

  test('le bouton export est présent', async ({ page }) => {
    await page.goto(ROUTES.ir);
    await page.waitForLoadState('networkidle');

    // ExportMenu component should be rendered
    await expect(page.getByTestId('export-menu-button')).toBeVisible({ timeout: 10_000 });
  });
});
