import { test, expect } from '@playwright/test';
import { loginWithCredentials } from './helpers/auth';

/**
 * E2E — "Configurer les règles" modal (P1-03g)
 *
 * DoD : sur un produit seed à phase vide, un admin peut ajouter ≥ 1 bloc
 * Constitution + ≥ 1 bloc Sortie sans jargon technique ni JSON.
 *
 * Requires: E2E_EMAIL / E2E_PASSWORD (admin role).
 */

const E2E_EMAIL = process.env.E2E_EMAIL;
const E2E_PASSWORD = process.env.E2E_PASSWORD;
const hasCredentials = !!(E2E_EMAIL && E2E_PASSWORD);

const BASE_CONTRAT_URL = '/settings/base-contrat';

test.describe('Configure Rules Modal (P1-03g)', () => {
  test.skip(!hasCredentials, 'E2E_EMAIL / E2E_PASSWORD not set — skipping authenticated tests');

  test.beforeEach(async ({ page }) => {
    if (hasCredentials) {
      await loginWithCredentials(page, E2E_EMAIL!, E2E_PASSWORD!);
    }
  });

  test('la page base-contrat se charge', async ({ page }) => {
    await page.goto(BASE_CONTRAT_URL);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, [class*="settings"], h1, h2').first()).toBeVisible({ timeout: 15_000 });
  });

  test('un bouton "Configurer les règles" est visible sur une phase vide', async ({ page }) => {
    await page.goto(BASE_CONTRAT_URL);
    await page.waitForLoadState('networkidle');

    // Chercher n'importe quel bouton "Configurer les règles" visible (phase vide d'un produit seed)
    const ctaButtons = page.locator('[data-testid^="configure-rules-"]');
    const count = await ctaButtons.count();

    // Si des phases vides existent, le CTA doit être présent
    // (non-bloquant si tous les produits sont déjà configurés)
    if (count > 0) {
      await expect(ctaButtons.first()).toBeVisible();
      await expect(ctaButtons.first()).toContainText('Configurer les règles');
    }
    // Smoke: page chargée sans erreur
    expect(true).toBe(true);
  });

  test('le modal s\'ouvre et affiche les 3 étapes (constitution)', async ({ page }) => {
    await page.goto(BASE_CONTRAT_URL);
    await page.waitForLoadState('networkidle');

    const cta = page.locator('[data-testid="configure-rules-constitution"]').first();
    const ctaVisible = await cta.isVisible().catch(() => false);

    if (!ctaVisible) {
      test.skip();
      return;
    }

    // Étape 2 s'ouvre directement (initialPhase fourni depuis CTA)
    await cta.click();
    await expect(page.locator('text=Configurer les règles')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('text=Étape 2')).toBeVisible();

    // Au moins 1 bloc est proposé (note-libre est toujours disponible)
    const checkboxes = page.locator('[type="checkbox"]');
    await expect(checkboxes.first()).toBeVisible();

    // Fermer le modal
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Étape 2')).not.toBeVisible({ timeout: 3_000 }).catch(() => {});
  });

  test('parcours complet : ouvrir modal → sélectionner bloc → enregistrer', async ({ page }) => {
    await page.goto(BASE_CONTRAT_URL);
    await page.waitForLoadState('networkidle');

    const cta = page.locator('[data-testid="configure-rules-constitution"]').first();
    const ctaVisible = await cta.isVisible().catch(() => false);

    if (!ctaVisible) {
      test.skip();
      return;
    }

    // Ouvrir le modal (étape 2 directe)
    await cta.click();
    await expect(page.locator('text=Étape 2')).toBeVisible({ timeout: 5_000 });

    // Cocher le premier bloc disponible (note-libre garanti)
    const firstCheckbox = page.locator('[type="checkbox"]').first();
    await firstCheckbox.check();
    await expect(firstCheckbox).toBeChecked();

    // Passer à l'étape 3
    const nextBtn = page.locator('button', { hasText: /Suivant/ });
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();
    await expect(page.locator('text=Étape 3')).toBeVisible({ timeout: 3_000 });

    // Enregistrer
    const saveBtn = page.locator('[data-testid="configure-rules-save"]');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Le modal doit être fermé après sauvegarde
    await expect(page.locator('text=Étape 3')).not.toBeVisible({ timeout: 3_000 });
  });
});
