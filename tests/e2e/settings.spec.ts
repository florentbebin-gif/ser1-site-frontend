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
    await expect(page.locator('.section-title')).toContainText('Paramètres');

    // Verify presence of navigation tabs
    // Note: The specific tabs visible depend on user role, but "Généraux" (label="Généraux") should always be there.
    // The key in SETTINGS_ROUTES is 'general', label is 'Généraux'.
    await expect(page.getByRole('button', { name: 'Généraux' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Impôts' })).toBeVisible();
    
    // Check if the content area loads (active component)
    // The 'Généraux' tab renders the Settings component which usually has some content.
    // We can look for a generic element or just ensure no error is shown.
    await expect(page.locator('.settings-page')).toBeVisible();
  });

  test('navigation entre les onglets', async ({ page }) => {
    await page.goto(ROUTES.settings);
    
    // Click on "Impôts" tab
    await page.getByRole('button', { name: 'Impôts' }).click();
    
    // URL should update
    await expect(page).toHaveURL(/.*\/settings\/impots/);
    
    // Content should update (we can check for specific content of SettingsImpots if known, 
    // or just that the tab is active)
    await expect(page.getByRole('button', { name: 'Impôts' })).toHaveClass(/is-active/);
    
    // Go back to "Généraux"
    await page.getByRole('button', { name: 'Généraux' }).click();
    await expect(page).toHaveURL(/.*\/settings/);
    await expect(page.getByRole('button', { name: 'Généraux' })).toHaveClass(/is-active/);
  });
});
