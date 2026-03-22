import { type Page } from '@playwright/test';

/**
 * Enable the lightweight E2E mode used by smoke tests.
 *
 * Sets window.__SER1_E2E = true to bypass route-level auth checks
 * without depending on real Supabase credentials.
 *
 * IMPORTANT — contrainte de sécurité :
 * Ce flag n'a d'effet que si la variable d'environnement VITE_E2E=true
 * est définie au moment du build (ajoutée dans e2e.yml).
 * En production (VITE_E2E absent), __SER1_E2E est ignoré même si présent.
 */
export async function enableE2EMode(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as any).__SER1_E2E = true;
  });
}

/**
 * Navigate to login page and fill the form.
 * Only works against a real Supabase instance with test credentials.
 */
export async function loginWithCredentials(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto('/login');
  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill(password);
  await page.getByTestId('login-submit-button').click();
  // Wait for redirect to home
  await page.waitForURL('/', { timeout: 10_000 });
}
