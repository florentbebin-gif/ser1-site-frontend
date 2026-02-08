import { test, expect } from '@playwright/test';
import { ROUTES } from './helpers/fixtures';

/**
 * Smoke tests pour les pages "figées" (stables, peu de changements)
 * Objectif: vérifier que les pages chargent sans erreur critique
 * Ces tests sont rapides et ne testent pas la logique métier complète
 */

test.describe('Smoke Tests — Pages figées', () => {
  
  // Track console errors during tests
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        /* eslint-disable no-console */
        console.log(`[Browser Console Error] ${msg.text()}`);
      }
    });
    
    page.on('pageerror', (error) => {
       
      // eslint-disable no-console
      console.log(`[Browser Page Error] ${error.message}`);
    });
  });

  test('Home page charge sans erreur', async ({ page }) => {
    await page.goto(ROUTES.home);
    // Vérifie pas d'erreur JS critique
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('body')).not.toContainText('Something went wrong');
    // Vérifie présence contenu attendu
    await expect(page.locator('body')).toBeVisible();
    // Vérifie pas d'erreurs console
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
       
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await page.waitForLoadState('networkidle');
    expect(consoleErrors).toHaveLength(0);
  });

  test('Login page charge sans erreur', async ({ page }) => {
    await page.goto(ROUTES.login);
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.getByTestId('login-title')).toContainText('Connexion');
    await expect(page.getByTestId('login-email-input')).toBeVisible();
    await expect(page.getByTestId('login-password-input')).toBeVisible();
  });

  test('IR simulator page charge sans erreur', async ({ page }) => {
    await page.goto(ROUTES.ir);
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('body')).not.toContainText('Something went wrong');
    // Vérifie présence éléments clés
    await expect(page.locator('body')).toBeVisible();
  });

  test('Credit simulator page charge sans erreur', async ({ page }) => {
    await page.goto(ROUTES.credit);
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('body')).not.toContainText('Something went wrong');
    await expect(page.locator('body')).toBeVisible();
  });

  test('PlacementV2 page charge sans erreur', async ({ page }) => {
    await page.goto(ROUTES.placement);
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('body')).not.toContainText('Something went wrong');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Settings page redirige vers login si non authentifié', async ({ page }) => {
    await page.goto(ROUTES.settings);
    // Devrait rediriger vers login
    await page.waitForURL('**/login', { timeout: 10_000 });
    await expect(page.getByTestId('login-title')).toContainText('Connexion');
  });

});
