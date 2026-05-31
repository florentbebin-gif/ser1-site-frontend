import { test, expect, type Page } from '@playwright/test';
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

async function selectSingleStatus(page: Page): Promise<void> {
  await page.getByTestId('ir-situation-select').click();
  await page.getByRole('option', { name: /Célibataire/ }).click();
  await expect(page.getByTestId('ir-salary-d1-input')).toBeVisible({ timeout: 10_000 });
}

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
    await selectSingleStatus(page);

    // Fill salary for declarant 1
    await page.getByTestId('ir-salary-d1-input').fill('45000');
    await page.getByTestId('ir-salary-d1-input').blur();

    // The page should compute and display a result
    await expect(page.getByTestId('ir-results-card')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('ir-irnet-value')).toContainText('€');
  });

  test("le bouton export est présent et le menu s'ouvre", async ({ page }) => {
    await page.goto(ROUTES.ir);
    await page.waitForLoadState('networkidle');

    // ExportMenu component should be rendered
    await expect(page.getByTestId('export-menu-button')).toBeVisible({ timeout: 10_000 });

    // Open menu
    await page.getByTestId('export-menu-button').click();
    await expect(page.getByTestId('export-menu-dropdown')).toBeVisible();
  });

  test('téléchargement export Excel', async ({ page }) => {
    // Note: This test verifies that the download is triggered, not the content of the file.
    // Ideally we should mock the heavy generation process if it takes too long,
    // but for E2E we want to ensure the button is hooked up correctly.

    await page.goto(ROUTES.ir);
    await page.waitForLoadState('networkidle');
    await selectSingleStatus(page);

    // Ensure we have some data
    await page.getByTestId('ir-salary-d1-input').fill('45000');
    await page.getByTestId('ir-salary-d1-input').blur();

    // Open menu
    await page.getByTestId('export-menu-button').click();

    // Setup download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 20_000 });

    // Click Excel option
    await page.getByTestId('export-option-excel').click();

    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  });

  test('résilience saisie invalide (négatif)', async ({ page }) => {
    await page.goto(ROUTES.ir);
    await page.waitForLoadState('networkidle');
    await selectSingleStatus(page);

    // Try to enter a negative number
    const input = page.getByTestId('ir-salary-d1-input');
    await input.fill('-5000');
    await input.blur();

    // The app should not crash, even if the invalid amount keeps synthesis waiting.
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.getByTestId('ir-header')).toBeVisible();
  });
});
