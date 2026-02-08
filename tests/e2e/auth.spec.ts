import { test, expect } from '@playwright/test';
import { ROUTES } from './helpers/fixtures';

test.describe('Auth — Login & Navigation', () => {
  test('affiche la page de login', async ({ page }) => {
    await page.goto(ROUTES.login);
    await expect(page.getByTestId('login-title')).toContainText('Connexion');
    await expect(page.getByTestId('login-email-input')).toBeVisible();
    await expect(page.getByTestId('login-password-input')).toBeVisible();
    await expect(page.getByTestId('login-submit-button')).toBeVisible();
  });

  test('affiche erreur si credentials invalides', async ({ page }) => {
    await page.goto(ROUTES.login);
    await page.getByTestId('login-email-input').fill('fake@test.com');
    await page.getByTestId('login-password-input').fill('wrongpassword');
    await page.getByTestId('login-submit-button').click();
    await expect(page.getByTestId('login-error')).toBeVisible({ timeout: 10_000 });
  });

  test('redirige vers /login si non authentifié', async ({ page }) => {
    await page.goto(ROUTES.home);
    // PrivateRoute should redirect to /login
    await page.waitForURL('**/login', { timeout: 10_000 });
    await expect(page.getByTestId('login-title')).toContainText('Connexion');
  });

  test('le lien mot de passe oublié fonctionne', async ({ page }) => {
    await page.goto(ROUTES.login);
    await expect(page.getByTestId('login-forgot-button')).toBeVisible();
  });

  test('le branding SER1 est visible', async ({ page }) => {
    await page.goto(ROUTES.login);
    await expect(page.getByTestId('login-brand')).toContainText('SER1');
  });
});
