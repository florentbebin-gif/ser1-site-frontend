// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import type { BaseCgRetraiteContract } from '@/data/base-cg-retraite';
import {
  contract,
  getBaseCgRetraiteCatalogMock,
  openModal,
  renderBaseCgRetraite,
  resetBaseCgRetraiteMocks,
  upsertBaseCgRetraiteContractMock,
} from './BaseCgRetraite.testUtils';

describe('BaseCgRetraite - modale', () => {
  beforeEach(resetBaseCgRetraiteMocks);

  it('affiche la modale en 4 onglets', async () => {
    await openModal();

    expect(screen.getByRole('dialog', { name: 'Modifier le contrat' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(4);
    expect(screen.getByRole('tab', { name: 'Identité' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Phase épargne' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Phase liquidation' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Documents' })).toBeInTheDocument();
  });

  it('relie les onglets au panneau et permet la navigation clavier', async () => {
    await openModal();

    const identityTab = screen.getByRole('tab', { name: 'Identité' });
    const epargneTab = screen.getByRole('tab', { name: 'Phase épargne' });
    const documentsTab = screen.getByRole('tab', { name: 'Documents' });
    const panel = screen.getByRole('tabpanel');

    expect(identityTab).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', identityTab.id);
    expect(identityTab).toHaveAttribute('tabindex', '0');

    identityTab.focus();
    await userEvent.keyboard('{ArrowRight}');

    await waitFor(() => {
      expect(epargneTab).toHaveAttribute('aria-selected', 'true');
      expect(epargneTab).toHaveFocus();
      expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', epargneTab.id);
    });

    await userEvent.keyboard('{End}');

    await waitFor(() => {
      expect(documentsTab).toHaveAttribute('aria-selected', 'true');
      expect(documentsTab).toHaveFocus();
      expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', documentsTab.id);
    });
  });

  it('ferme la modale avec Escape et restitue le focus au déclencheur', async () => {
    const user = userEvent.setup();
    renderBaseCgRetraite();
    const editButton = await screen.findByRole('button', { name: 'Modifier' });

    await user.click(editButton);
    const closeButton = await screen.findByRole('button', { name: 'Fermer' });

    await waitFor(() => expect(closeButton).toHaveFocus());
    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(editButton).toHaveFocus();
  });

  it('garde le focus dans la modale avec Tab et Shift Tab', async () => {
    const user = userEvent.setup();
    await openModal();
    const closeButton = await screen.findByRole('button', { name: 'Fermer' });
    const saveButton = screen.getByRole('button', { name: 'Enregistrer' });

    await waitFor(() => expect(closeButton).toHaveFocus());

    await user.tab({ shift: true });
    expect(saveButton).toHaveFocus();

    await user.tab();
    expect(closeButton).toHaveFocus();
  });

  it('persiste une édition de l’onglet identité', async () => {
    await openModal();

    await userEvent.clear(screen.getByLabelText('Compagnie'));
    await userEvent.type(screen.getByLabelText('Compagnie'), 'ABEILLE VIE');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => {
      expect(upsertBaseCgRetraiteContractMock).toHaveBeenCalledWith(
        expect.objectContaining({
          compagnie: 'ABEILLE VIE',
        }),
      );
    });
  });

  it('persiste une édition de l’onglet phase épargne', async () => {
    await openModal();
    await userEvent.click(screen.getByRole('tab', { name: 'Phase épargne' }));

    await userEvent.clear(screen.getByLabelText('Modalités en cas de décès'));
    await userEvent.type(screen.getByLabelText('Modalités en cas de décès'), 'Clause dédiée');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => {
      expect(upsertBaseCgRetraiteContractMock).toHaveBeenCalledWith(
        expect.objectContaining({
          phaseEpargne: expect.objectContaining({
            clauseBeneficiaire: 'Clause dédiée',
          }),
        }),
      );
    });
  });

  it('permet de saisir une décimale française en modification', async () => {
    const user = userEvent.setup();
    await openModal();
    await user.click(screen.getByRole('tab', { name: 'Phase épargne' }));

    const versementsInput = screen.getByLabelText('Frais sur versements');
    await user.clear(versementsInput);
    await user.type(versementsInput, '4,5');

    expect(versementsInput).toHaveValue('4,5');

    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => {
      const saved = upsertBaseCgRetraiteContractMock.mock.calls[0]?.[0] as BaseCgRetraiteContract;
      expect(saved.phaseEpargne.fraisVersements).toBeCloseTo(0.045);
    });
  });

  it('persiste une édition de l’onglet phase liquidation', async () => {
    await openModal();
    await userEvent.click(screen.getByRole('tab', { name: 'Phase liquidation' }));

    await userEvent.clear(screen.getByLabelText('Taux frais sur arrérages'));
    await userEvent.type(screen.getByLabelText('Taux frais sur arrérages'), '4.5');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => {
      const saved = upsertBaseCgRetraiteContractMock.mock.calls[0]?.[0] as BaseCgRetraiteContract;
      expect(saved.phaseLiquidation.fraisArreragesRate).toBeCloseTo(0.045);
      expect(saved.phaseLiquidation.fraisArrerages).toBe('4,5 %');
    });
  });

  it('permet de saisir une décimale française en ajout', async () => {
    const user = userEvent.setup();
    renderBaseCgRetraite();

    await user.click(await screen.findByRole('button', { name: 'Ajouter' }));
    expect(screen.getByRole('dialog', { name: 'Ajouter un contrat' })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Phase liquidation' }));

    const arreragesInput = screen.getByLabelText('Taux frais sur arrérages');
    await user.type(arreragesInput, '4,5');

    expect(arreragesInput).toHaveValue('4,5');

    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => {
      const saved = upsertBaseCgRetraiteContractMock.mock.calls[0]?.[0] as BaseCgRetraiteContract;
      expect(saved.phaseLiquidation.fraisArreragesRate).toBeCloseTo(0.045);
      expect(saved.phaseLiquidation.fraisArrerages).toBe('4,5 %');
    });
  });

  it('permet à l’admin de renseigner une CG avec version et chemin storage', async () => {
    await openModal();
    await userEvent.click(screen.getByRole('tab', { name: 'Documents' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter un document' }));

    expect(screen.getByLabelText('Libellé du document')).toHaveValue('Conditions Générales');
    expect(screen.getByLabelText('Version CG')).toBeInTheDocument();
    expect(screen.getByLabelText('Chemin Supabase Storage')).toBeInTheDocument();
  });

  it('persiste les documents ajoutés dans le contrat local', async () => {
    await openModal();
    await userEvent.click(screen.getByRole('tab', { name: 'Documents' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter un document' }));
    await userEvent.type(screen.getByLabelText('Version CG'), '13124 – 09.2019');
    await userEvent.clear(screen.getByLabelText('Chemin Supabase Storage'));
    await userEvent.type(
      screen.getByLabelText('Chemin Supabase Storage'),
      'swisslife/swisslife-per-individuel/13124-09-2019.pdf',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => {
      expect(upsertBaseCgRetraiteContractMock).toHaveBeenCalledWith(
        expect.objectContaining({
          documents: [
            expect.objectContaining({
              label: 'Conditions Générales',
              versionLabel: expect.stringContaining('13124'),
              storagePath: 'swisslife/swisslife-per-individuel/13124-09-2019.pdf',
            }),
          ],
        }),
      );
    });
  });

  it('masque le frais de gestion général et affiche les taux en pourcentage', async () => {
    const decimalFeesContract: BaseCgRetraiteContract = {
      ...contract,
      phaseEpargne: {
        ...contract.phaseEpargne,
        fraisGestion: '0,65%€\n0,96%UC',
        fraisGestionFondsEuro: null,
        fraisGestionUc: null,
      },
    };
    getBaseCgRetraiteCatalogMock.mockResolvedValueOnce([decimalFeesContract]);
    await openModal();
    await userEvent.click(screen.getByRole('tab', { name: 'Phase épargne' }));

    expect(screen.queryByLabelText('Frais de gestion')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Frais gestion fonds €')).toHaveValue('0,65 %');
    expect(screen.getByLabelText('Frais gestion UC')).toHaveValue('0,96 %');
    expect(screen.getByLabelText('Frais sur versements')).toHaveValue('5 %');
  });

  it('retire les champs UC non maintenus des modales contrat', async () => {
    const user = userEvent.setup();
    await openModal();
    await user.click(screen.getByRole('tab', { name: 'Phase épargne' }));

    expect(screen.queryByLabelText("Nombre d'UC")).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Répartition UC / fonds €')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Fonds € garantis')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Frais gestion fonds €')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Annuler' }));
    await user.click(await screen.findByRole('button', { name: 'Ajouter' }));
    await user.click(screen.getByRole('tab', { name: 'Phase épargne' }));

    expect(screen.queryByLabelText("Nombre d'UC")).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Répartition UC / fonds €')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Fonds € garantis')).not.toBeInTheDocument();
  });
});
