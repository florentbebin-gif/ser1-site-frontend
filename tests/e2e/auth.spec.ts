import { test, expect } from '@playwright/test';
import { ROUTES } from './helpers/fixtures';

test.describe('Auth — Login & Navigation', () => {
  test('affiche la page de login', async ({ page }) => {
    await page.goto(ROUTES.login);
    await expect(page.locator('h2')).toContainText('Connexion');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
  });

  test('affiche erreur si credentials invalides', async ({ page }) => {
    await page.goto(ROUTES.login);
    await page.locator('input[type="email"]').fill('fake@test.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.locator('.alert.error')).toBeVisible({ timeout: 10_000 });
  });

  test('redirige vers /login si non authentifié', async ({ page }) => {
    await page.goto(ROUTES.home);
    // PrivateRoute should redirect to /login
    await page.waitForURL('**/login', { timeout: 10_000 });
    await expect(page.locator('h2')).toContainText('Connexion');
  });

  test('le lien mot de passe oublié fonctionne', async ({ page }) => {
    await page.goto(ROUTES.login);
    await expect(page.getByRole('button', { name: 'Mot de passe oublié ?' })).toBeVisible();
  });

  test('le branding SER1 est visible', async ({ page }) => {
    await page.goto(ROUTES.login);
    await expect(page.locator('.login-brand')).toContainText('SER1');
  });
});
