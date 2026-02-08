import { test, expect } from '@playwright/test';
import { ROUTES } from './helpers/fixtures';

test.describe('Navigation — Routes publiques', () => {
  test('la page /login charge correctement', async ({ page }) => {
    await page.goto(ROUTES.login);
    await expect(page).toHaveURL(/login/);
    await expect(page.locator('.login-card')).toBeVisible();
  });

  test('la page /forgot-password charge correctement', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page).toHaveURL(/forgot-password/);
  });

  test('la page /set-password charge correctement', async ({ page }) => {
    await page.goto('/set-password');
    await expect(page).toHaveURL(/set-password/);
  });

  test('les routes protégées redirigent vers /login', async ({ page }) => {
    const protectedRoutes = [
      ROUTES.home,
      ROUTES.ir,
      ROUTES.credit,
      ROUTES.placement,
      ROUTES.audit,
      ROUTES.settings,
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForURL('**/login', { timeout: 10_000 });
    }
  });

  test('les redirections de compatibilité fonctionnent', async ({ page }) => {
    // /placement → /sim/placement (redirect) → /login (auth guard)
    await page.goto('/placement');
    await page.waitForURL('**/login', { timeout: 10_000 });
  });

  test('la topbar SER1 est visible sur /login', async ({ page }) => {
    await page.goto(ROUTES.login);
    await expect(page.locator('.brand-name')).toContainText('SER1');
  });
});
