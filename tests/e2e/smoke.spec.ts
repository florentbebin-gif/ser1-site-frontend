import { test, expect } from '@playwright/test';
import { enableE2EMode } from './helpers/auth';
import { ROUTES } from './helpers/fixtures';

/**
 * Smoke tests minimaux pour les surfaces stables.
 * Ils valident l'ouverture des pages critiques sans figer
 * les parcours metier complets.
 */

test.describe('Smoke Tests - Surfaces stables', () => {
  test.beforeEach(async ({ page }) => {
    await enableE2EMode(page);
  });

  test('Home charge en mode smoke', async ({ page }) => {
    await page.goto(ROUTES.home);
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.getByTestId('home-hero-title')).toBeVisible();
    await expect(page.getByTestId('home-tools-grid')).toBeVisible();
  });

  test('IR charge avec sa structure minimale', async ({ page }) => {
    await page.goto(ROUTES.ir);
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.getByTestId('ir-page')).toBeVisible();
    await expect(page.getByTestId('ir-title')).toContainText("Simulateur d'imp\u00f4t sur le revenu");
    await expect(page.getByTestId('ir-mode-btn')).toContainText('Mode simplifi\u00e9');
  });

  test('Credit charge avec sa structure minimale', async ({ page }) => {
    await page.goto(ROUTES.credit);
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.getByTestId('credit-page')).toBeVisible();
    await expect(page.getByTestId('credit-title')).toContainText('Simulateur de crédit');
  });

  test('Succession charge avec sa structure minimale', async ({ page }) => {
    await page.goto(ROUTES.succession);
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.getByTestId('succession-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Simulateur succession' })).toBeVisible();
  });

  test('Settings charge et ouvre une sous-page stable', async ({ page }) => {
    await page.goto(ROUTES.settings);
    await expect(page.locator('.settings-page')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Généraux' })).toBeVisible();
    await page.getByRole('button', { name: 'Impôts' }).click();
    await expect(page).toHaveURL(/\/settings\/impots$/);
    await expect(page.getByRole('button', { name: 'Impôts' })).toHaveClass(/is-active/);
  });

  test('Une route upcoming reste accessible en mode minimal', async ({ page }) => {
    await page.goto(ROUTES.epargneSalariale);
    await expect(page.getByTestId('upcoming-simulator-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Epargne salariale' })).toBeVisible();
  });
});
