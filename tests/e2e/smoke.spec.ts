import { test, expect } from '@playwright/test';
import { enableE2EMode } from './helpers/auth';
import { ROUTES } from './helpers/fixtures';
import { createEmptyDossier } from '../../src/features/audit/types';

/**
 * Smoke tests minimaux pour les surfaces stables.
 * Ils valident l'ouverture des pages critiques sans figer
 * les parcours métier complets.
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
    await expect(page.getByTestId('ir-title')).toContainText("Simulateur d'impôt sur le revenu");
    await expect(page.getByTestId('ir-mode-btn')).toContainText('Mode expert');
  });

  test('Credit charge avec sa structure minimale', async ({ page }) => {
    await page.goto(ROUTES.credit);
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.getByTestId('credit-page')).toBeVisible();
    await expect(page.getByTestId('credit-title')).toContainText('Simulateur de crédit');

    const form = page.getByTestId('credit-form-pret0');
    await expect(form).toBeVisible();

    const formBoxBeforeSummary = await form.boundingBox();
    expect(formBoxBeforeSummary).not.toBeNull();

    await page.getByTestId('credit-capital-input').fill('200000');
    await expect(page.getByTestId('credit-summary-card')).toBeVisible();

    const formBoxAfterSummary = await form.boundingBox();
    expect(formBoxAfterSummary).not.toBeNull();
    expect(Math.abs(formBoxBeforeSummary!.width - formBoxAfterSummary!.width)).toBeLessThanOrEqual(2);
  });

  test('Credit aligne les champs expert et conserve l’espacement entre les grilles', async ({ page }) => {
    await page.goto(ROUTES.credit);
    await expect(page.locator('body')).not.toContainText('Application error');

    await page.getByRole('button', { name: 'Activer le mode expert' }).click();

    const form = page.getByTestId('credit-form-pret0');
    await expect(form).toBeVisible();
    await expect(page.getByTestId('credit-pret0-taux')).toBeVisible();
    await expect(page.getByTestId('credit-pret0-type')).toBeVisible();
    await expect(page.getByTestId('credit-pret0-start')).toBeVisible();
    await expect(page.getByTestId('credit-pret0-assurmode')).toBeVisible();

    const firstGrid = form.locator('.cv-loan-form__grid').first();
    const expertGrid = form.locator('.cv-loan-form__grid--stack-gap').first();
    const firstGridBox = await firstGrid.boundingBox();
    const expertGridBox = await expertGrid.boundingBox();

    expect(firstGridBox).not.toBeNull();
    expect(expertGridBox).not.toBeNull();

    const verticalGap = expertGridBox!.y - (firstGridBox!.y + firstGridBox!.height);
    expect(verticalGap).toBeGreaterThanOrEqual(16);

    const startControl = page.getByTestId('credit-pret0-start').locator('.sim-field__control');
    const typeControl = page.getByTestId('credit-pret0-type').locator('.sim-field__select-trigger');
    const modeControl = page.getByTestId('credit-pret0-assurmode').locator('.sim-field__select-trigger');

    await expect(startControl).toBeVisible();
    await expect(typeControl).toBeVisible();
    await expect(modeControl).toBeVisible();

    const startBox = await startControl.boundingBox();
    const typeBox = await typeControl.boundingBox();
    const modeBox = await modeControl.boundingBox();

    expect(startBox).not.toBeNull();
    expect(typeBox).not.toBeNull();
    expect(modeBox).not.toBeNull();

    expect(Math.abs(startBox!.width - typeBox!.width)).toBeLessThanOrEqual(2);
    expect(Math.abs(startBox!.width - modeBox!.width)).toBeLessThanOrEqual(2);
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
    await page.getByRole('button', { name: 'Impôts', exact: true }).click();
    await expect(page).toHaveURL(/\/settings\/impots$/);
    await expect(page.getByRole('button', { name: 'Impôts', exact: true })).toHaveClass(/is-active/);
  });

  test('Strategy charge sans draft et affiche son fallback minimal', async ({ page }) => {
    await page.goto(ROUTES.strategy);
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.getByRole('heading', { name: 'Aucun audit en cours' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Démarrer un audit' })).toBeVisible();
  });

  test('Strategy charge avec un draft audit minimal', async ({ page }) => {
    const dossier = createEmptyDossier();
    dossier.situationFamiliale.mr.prenom = 'Jean';
    dossier.situationFamiliale.mr.nom = 'Martin';

    await page.addInitScript((draft) => {
      window.sessionStorage.setItem('ser1_audit_draft', JSON.stringify(draft));
    }, dossier);

    await page.goto(ROUTES.strategy);
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.getByTestId('strategy-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Stratégie patrimoniale' })).toBeVisible();
    await expect(page.getByText('Client : Jean Martin')).toBeVisible();
  });

  test('Une route upcoming reste accessible en mode minimal', async ({ page }) => {
    await page.goto(ROUTES.epargneSalariale);
    await expect(page.getByTestId('upcoming-simulator-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Épargne salariale' })).toBeVisible();
  });
});
