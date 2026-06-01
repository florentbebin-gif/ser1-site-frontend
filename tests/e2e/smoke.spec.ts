import { test, expect } from '@playwright/test';
import { enableE2EMode } from './helpers/auth';
import { ROUTES } from './helpers/fixtures';
import { createEmptyDossier } from '../../src/domain/audit/types';

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
    await expect(page.getByTestId('home-start-eyebrow')).toContainText('PAR OÙ COMMENCER');
    await expect(page.getByTestId('home-guide-subtitle')).toContainText(
      'Sélectionnez votre objectif, SER1 vous guide pas à pas.',
    );
    await expect(page.getByTestId('home-primary-action-strategy')).toBeVisible();
    await expect(page.getByTestId('home-primary-action-scan')).toBeVisible();
    await expect(page.getByTestId('home-status-card')).toBeVisible();
    await expect(page.getByTestId('home-mode-card')).toContainText('Mode utilisateur');
    await expect(page.getByTestId('home-space-foyer')).toBeVisible();
    await expect(page.getByTestId('home-space-societe')).toBeVisible();
    await expect(page.getByTestId('home-detail-panel')).toHaveCount(0);
    await expect(page.locator('[data-testid^="home-simulator-card-"]')).toHaveCount(0);
    await expect(page.getByRole('tab')).toHaveCount(0);
    await expect(page.getByTestId('home-space-foyer')).toHaveAttribute('data-open', 'false');
    await expect(page.getByTestId('home-space-societe')).toHaveAttribute('data-open', 'false');
    await expect(page.getByTestId('home-simulator-card-actif-passif')).toHaveCount(0);
    await expect(page.getByText('Épargne salariale')).toHaveCount(0);

    await expect(page.getByTestId('home-primary-action-scan')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await expect(page).toHaveURL(/\/$/);
    await page.getByTestId('home-primary-action-strategy').click();
    await expect(page).toHaveURL(/\/audit$/);
  });

  test('Home ouvre le panneau simulateur uniquement après une action explicite', async ({
    page,
  }) => {
    await page.goto(ROUTES.home);

    await expect(page.getByTestId('home-detail-panel')).toHaveCount(0);
    await page.getByRole('button', { name: 'Comprendre ma situation' }).click();
    await expect(page.getByTestId('home-space-foyer')).toHaveAttribute('data-open', 'true');
    await expect(page.getByTestId('home-simulator-card-ir')).toBeVisible();
    await expect(page.getByTestId('home-simulator-card-filiation')).toHaveCount(0);
    await expect(page.getByTestId('home-simulator-card-ifi')).toHaveCount(0);

    await page.getByTestId('home-simulator-card-ir').click();
    await expect(page.getByTestId('home-detail-panel')).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Détail Fiscalité IR' })).toBeVisible();
    await expect(page.getByTestId('home-panel-launch')).toHaveAttribute('href', '/sim/ir');

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('home-detail-panel')).toHaveCount(0);

    await page.getByTestId('home-simulator-card-ir').click();
    await expect(page.getByTestId('home-detail-panel')).toBeVisible();
    await page.getByRole('button', { name: 'Fermer le détail' }).click();
    await expect(page.getByTestId('home-detail-panel')).toHaveCount(0);
  });

  test('IR charge avec sa structure minimale', async ({ page }) => {
    await page.goto(ROUTES.ir);
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.getByTestId('ir-page')).toBeVisible();
    await expect(page.getByTestId('ir-title')).toContainText('Impôt sur le revenu');
    await expect(page.getByTestId('ir-mode-btn')).toContainText('Mode expert');
  });

  test('Credit charge avec sa structure minimale', async ({ page }) => {
    await page.goto(ROUTES.credit);
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.getByTestId('credit-page')).toBeVisible();
    await expect(page.getByTestId('credit-title')).toContainText('Crédit');

    const form = page.getByTestId('credit-form-pret0');
    await expect(form).toBeVisible();

    const formBoxBeforeSummary = await form.boundingBox();
    expect(formBoxBeforeSummary).not.toBeNull();

    await page.getByTestId('credit-capital-input').fill('200000');
    await page.getByTestId('credit-capital-input').blur();
    await expect(page.getByTestId('credit-summary-card')).toBeVisible();

    const formBoxAfterSummary = await form.boundingBox();
    expect(formBoxAfterSummary).not.toBeNull();
    expect(Math.abs(formBoxBeforeSummary!.width - formBoxAfterSummary!.width)).toBeLessThanOrEqual(
      2,
    );
  });

  test('Credit aligne les champs expert et conserve l’espacement entre les grilles', async ({
    page,
  }) => {
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
    const modeControl = page
      .getByTestId('credit-pret0-assurmode')
      .locator('.sim-field__select-trigger');

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
    await expect(page.getByRole('heading', { name: 'Succession' })).toBeVisible();
  });

  test('Settings charge et ouvre une sous-page stable', async ({ page }) => {
    await page.goto(ROUTES.settings);
    await expect(page.locator('.settings-page')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Généraux' })).toBeVisible();
    await page.getByRole('button', { name: 'Impôts', exact: true }).click();
    await expect(page).toHaveURL(/\/settings\/impots$/);
    await expect(page.getByRole('button', { name: 'Impôts', exact: true })).toHaveClass(
      /is-active/,
    );
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
