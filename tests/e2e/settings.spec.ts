import { test, expect } from '@playwright/test';
import { loginWithCredentials } from './helpers/auth';
import { ROUTES } from './helpers/fixtures';

/**
 * Settings E2E tests.
 *
 * Requires real Supabase credentials:
 *   E2E_EMAIL / E2E_PASSWORD
 */
const E2E_EMAIL = process.env.E2E_EMAIL;
const E2E_PASSWORD = process.env.E2E_PASSWORD;
const hasCredentials = !!(E2E_EMAIL && E2E_PASSWORD);

test.describe('Settings', () => {
  test.skip(!hasCredentials, 'E2E_EMAIL / E2E_PASSWORD not set — skipping authenticated tests');

  test.beforeEach(async ({ page }) => {
    if (hasCredentials) {
      await loginWithCredentials(page, E2E_EMAIL!, E2E_PASSWORD!);
    }
  });

  test('charge la page Paramètres et affiche les onglets', async ({ page }) => {
    await page.goto(ROUTES.settings);
    await page.waitForLoadState('networkidle');

    // Verify main title
    await expect(page.locator('.settings-shell__title')).toContainText('Paramètres');

    // Verify presence of navigation tabs
    // Note: The specific tabs visible depend on user role, but "Généraux" (label="Généraux") should always be there.
    // The key in SETTINGS_ROUTES is 'general', label is 'Généraux'.
    await expect(page.getByRole('button', { name: 'Généraux' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mémento' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Impôts' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Comptables & sociétés' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Référentiel contrats' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'DMTG & Succession' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Prévoyance — régimes' })).toHaveCount(0);

    // Check if the content area loads (active component)
    // The 'Généraux' tab renders the Settings component which usually has some content.
    // We can look for a generic element or just ensure no error is shown.
    await expect(page.locator('.settings-page')).toBeVisible();
  });

  test('navigation entre les onglets', async ({ page }) => {
    await page.goto(ROUTES.settings);

    // Click on "Mémento" tab
    await page.getByRole('button', { name: 'Mémento' }).click();

    // URL should update
    await expect(page).toHaveURL(/.*\/settings\/memento/);

    await expect(page.getByRole('button', { name: 'Mémento' })).toHaveClass(/is-active/);
    await expect(page.getByRole('heading', { name: 'Mémento patrimonial & social' })).toBeVisible();

    // Go back to "Généraux"
    await page.getByRole('button', { name: 'Généraux' }).click();
    await expect(page).toHaveURL(/.*\/settings/);
    await expect(page.getByRole('button', { name: 'Généraux' })).toHaveClass(/is-active/);
  });

  test('navigation vers le mémento settings', async ({ page }) => {
    await page.goto(ROUTES.settings);

    await page.getByRole('button', { name: 'Mémento' }).click();

    await expect(page).toHaveURL(/.*\/settings\/memento/);
    await expect(page.getByRole('button', { name: 'Mémento' })).toHaveClass(/is-active/);
    await expect(page.getByRole('heading', { name: 'Mémento patrimonial & social' })).toBeVisible();
  });
});
