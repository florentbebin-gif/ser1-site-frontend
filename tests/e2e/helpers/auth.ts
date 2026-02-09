import { type Page } from '@playwright/test';

/**
 * Inject a mock Supabase session into localStorage so that
 * PrivateRoute lets us through without hitting real Supabase.
 *
 * This avoids needing real credentials in CI.
 */
export async function injectMockSession(page: Page): Promise<void> {
  const supabaseUrl = 'http://localhost:54321'; // placeholder

  const fakeSession = {
    access_token: 'e2e-fake-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'e2e-fake-refresh-token',
    user: {
      id: 'e2e-user-00000000-0000-0000-0000-000000000000',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'e2e@test.local',
      email_confirmed_at: new Date().toISOString(),
      app_metadata: { provider: 'email', role: 'admin' },
      user_metadata: { role: 'admin' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };

  // Supabase JS v2 stores session under a key derived from the project URL.
  // We inject into every possible key pattern so AuthProvider picks it up.
  await page.addInitScript((session) => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('sb-'));
    // Clear any existing Supabase auth keys
    keys.forEach(k => localStorage.removeItem(k));

    // Set the E2E bypass flag
    (window as any).__SER1_E2E = true;

    // Inject the fake session with the expected key format
    localStorage.setItem('sb-localhost-auth-token', JSON.stringify(session));
  }, fakeSession);
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
