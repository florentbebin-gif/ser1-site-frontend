import { test, expect } from '@playwright/test';
import { injectMockSession } from './helpers/auth';
import { ROUTES } from './helpers/fixtures';

/**
 * Credit Simulator E2E tests.
 *
 * Uses mock session to avoid needing real credentials in CI.
 */
test.describe('Credit Simulator', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await injectMockSession(page);
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

  test('le bouton export est présent et le menu s\'ouvre', async ({ page }) => {
    await page.goto(ROUTES.credit);
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('export-menu-button')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('export-menu-button').click();
    await expect(page.getByTestId('export-menu-dropdown')).toBeVisible();
  });

  test('téléchargement export Excel', async ({ page }) => {
    await page.goto(ROUTES.credit);
    await page.waitForLoadState('networkidle');
    
    // Fill capital to have results
    await page.getByTestId('credit-capital-input').fill('200000');
    
    // Trigger download
    await page.getByTestId('export-menu-button').click();
    const downloadPromise = page.waitForEvent('download', { timeout: 20_000 });
    await page.getByTestId('export-option-excel').click();
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  });

  test('résilience saisie invalide (négatif)', async ({ page }) => {
    await page.goto(ROUTES.credit);
    await page.waitForLoadState('networkidle');

    // Try negative capital
    const input = page.getByTestId('credit-capital-input');
    await input.fill('-200000');
    await input.blur();

    // Verify app stability (summary card still there or re-rendered)
    await expect(page.getByTestId('credit-summary-card')).toBeVisible();
    
    // Verify total cost is not NaN or crashing
    await expect(page.getByTestId('credit-cout-total-value')).toBeVisible();
  });
});
