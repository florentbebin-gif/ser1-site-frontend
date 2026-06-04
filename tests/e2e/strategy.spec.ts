import { expect, test } from '@playwright/test';
import { enableE2EMode } from './helpers/auth';
import { ROUTES } from './helpers/fixtures';
import { createEmptyDossier } from '../../src/domain/audit/types';

test.describe('Strategy - scénario métier', () => {
  test.beforeEach(async ({ page }) => {
    await enableE2EMode(page);
    const dossier = createEmptyDossier();
    dossier.situationFamiliale.mr.prenom = 'Jean';
    dossier.situationFamiliale.mr.nom = 'Martin';
    dossier.situationFiscale.revenuFiscalReference = 85000;
    dossier.situationFiscale.nombreParts = 2;

    await page.addInitScript((draft) => {
      window.sessionStorage.setItem('ser1_audit_draft', JSON.stringify(draft));
    }, dossier);
  });

  test('ajoute un produit cible et active l’export de stratégie', async ({ page }) => {
    await page.goto(ROUTES.strategy);

    await expect(page.getByTestId('strategy-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Stratégie patrimoniale' })).toBeVisible();

    await page.getByRole('button', { name: '+ Ajouter un produit' }).click();
    await page.getByRole('button', { name: 'Plan Épargne Retraite (PER)' }).click();

    const produit = page.locator('.produit-card').filter({
      has: page.getByRole('heading', { name: 'Plan Épargne Retraite (PER)' }),
    });
    await expect(produit).toBeVisible();
    await produit.getByLabel('Montant initial').fill('50000');
    await produit.getByLabel('Versements mensuels').fill('500');

    await expect(page.getByRole('heading', { name: 'Comparaison des scénarios' })).toBeVisible();
    await expect(page.getByText('Gain patrimonial :')).toBeVisible();

    await page.getByTestId('export-menu-button').click();
    await expect(page.getByRole('menuitem', { name: 'PowerPoint (.pptx)' })).toBeEnabled();
  });
});
