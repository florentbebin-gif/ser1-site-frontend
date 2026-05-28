// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import type { BaseCgRetraiteContract } from '@/data/base-cg-retraite';
import {
  contract,
  getBaseCgRetraiteCatalogMock,
  renderBaseCgRetraite,
  resetBaseCgRetraiteMocks,
  useUserRoleMock,
} from './BaseCgRetraite.testUtils';

describe('BaseCgRetraite - catalogue', () => {
  beforeEach(resetBaseCgRetraiteMocks);

  it('affiche les compteurs disponibles, paramétrés et CG disponibles sans version technique', async () => {
    const incompleteContract: BaseCgRetraiteContract = {
      ...contract,
      id: 'incomplete-contract',
      nomContrat: 'Contrat incomplet',
      phaseEpargne: {
        ...contract.phaseEpargne,
        dateCommercialisation: null,
        fraisGestion: null,
        fraisGestionFondsEuro: null,
        fraisGestionUc: null,
        clauseBeneficiaire: null,
      },
    };
    const documentedContract: BaseCgRetraiteContract = {
      ...contract,
      documents: [
        {
          id: 'doc-swisslife',
          label: 'Notice SwissLife PER Individuel',
          type: 'notice_information',
          status: 'uploaded',
          versionLabel: '13124 – 09.2019',
          storagePath: 'swisslife/swisslife-per-individuel/13124-09-2019.pdf',
          fileName: '13124-09-2019.pdf',
          mime: 'application/pdf',
          bytes: 462558,
        },
      ],
    };
    getBaseCgRetraiteCatalogMock.mockResolvedValueOnce([documentedContract, incompleteContract]);

    renderBaseCgRetraite();

    expect(
      await screen.findByText('2 contrats disponibles - 1 contrat paramétré - 1 CG disponible'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/extraction/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/version technique/i)).not.toBeInTheDocument();
  });

  it('affiche explicitement une indisponibilité catalogue au lieu de masquer l’erreur', async () => {
    getBaseCgRetraiteCatalogMock.mockRejectedValueOnce(
      new Error('Catalogue Base CG retraite indisponible : migration Supabase canonique absente.'),
    );

    renderBaseCgRetraite();

    expect(await screen.findByRole('alert')).toHaveTextContent('Catalogue indisponible');
    expect(
      screen.getByText(/Catalogue Base CG retraite indisponible\. Vérifier la connexion Supabase/i),
    ).toBeInTheDocument();
  });

  it('réserve les actions de gestion aux admins et supprime le bouton réinitialiser', async () => {
    const { unmount } = renderBaseCgRetraite();

    expect(
      await screen.findByRole('button', { name: 'Assistance & Suggestions' }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Ajouter' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Modifier' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Supprimer' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Réinitialiser' })).not.toBeInTheDocument();
    unmount();

    useUserRoleMock.mockReturnValue({
      role: 'user',
      user: null,
      isAdmin: false,
      isLoading: false,
    });
    renderBaseCgRetraite();

    expect(await screen.findByText('MADELIN- ABEILLE RETRAITE MADELIN')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Assistance & Suggestions' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ajouter' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Modifier' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Réinitialiser' })).not.toBeInTheDocument();
  });

  it('organise les contrats en accordéons par compagnie avec indicateur incomplet', async () => {
    const incompleteContract: BaseCgRetraiteContract = {
      ...contract,
      id: 'incomplete-contract',
      compagnie: 'CARDIF',
      nomContrat: 'Contrat incomplet',
      phaseEpargne: {
        ...contract.phaseEpargne,
        dateCommercialisation: null,
        fraisGestion: null,
        fraisGestionFondsEuro: null,
        fraisGestionUc: null,
        clauseBeneficiaire: null,
      },
    };
    getBaseCgRetraiteCatalogMock.mockResolvedValueOnce([contract, incompleteContract]);

    renderBaseCgRetraite();

    expect(await screen.findByRole('button', { name: /ABEILLE/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /CARDIF/ })).toBeInTheDocument();
    expect(screen.getByText('1 à compléter')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /CARDIF/ }));

    expect(screen.getByText('Contrat incomplet')).toBeInTheDocument();
    expect(screen.getByText('À compléter')).toBeInTheDocument();
  });

  it('présente les contrats ouverts en cartes denses avec logo compagnie', async () => {
    renderBaseCgRetraite();

    expect(await screen.findByTestId('company-logo-abeille')).toBeInTheDocument();

    const contractCard = await screen.findByTestId('base-cg-contract-card-test-contract');
    expect(contractCard).toHaveTextContent('MADELIN- ABEILLE RETRAITE MADELIN');
    expect(contractCard).toHaveTextContent('Madelin');
    expect(contractCard).toHaveTextContent('C1 (déductible)');
    expect(contractCard).toHaveTextContent('TGH05 ou TGF05');
  });

  it('met en avant les noms de contrats et la traçabilité du document CG', async () => {
    getBaseCgRetraiteCatalogMock.mockResolvedValueOnce([
      {
        ...contract,
        documents: [
          {
            id: 'doc-swisslife',
            label: 'Notice SwissLife PER Individuel',
            type: 'notice_information',
            status: 'uploaded',
            versionLabel: '13124 – 09.2019',
            storagePath: 'swisslife/swisslife-per-individuel/13124-09-2019.pdf',
          },
        ],
      },
    ]);

    renderBaseCgRetraite();

    const contractName = await screen.findByText('MADELIN- ABEILLE RETRAITE MADELIN');
    expect(contractName).toHaveClass('base-cg-contract-name__label');
    expect(screen.queryByText('Contrat N°386')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Télécharger CG' })).toBeInTheDocument();
    expect(screen.getByText('Version : 13124 – 09.2019')).toBeInTheDocument();
    expect(screen.getByText('PDF importé - accès authentifié SER1')).toBeInTheDocument();
    expect(screen.queryByText(/Ref :/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Notice SwissLife PER Individuel/)).not.toBeInTheDocument();
  });

  it('signale les documents CG sans version renseignée', async () => {
    getBaseCgRetraiteCatalogMock.mockResolvedValueOnce([
      {
        ...contract,
        documents: [
          {
            id: 'doc-no-version',
            label: 'Conditions générales sans version',
            type: 'conditions_generales',
            status: 'linked',
            sourceUrl: 'https://example.invalid/cg.pdf',
          },
        ],
      },
    ]);

    renderBaseCgRetraite();

    expect(await screen.findByText('Version à renseigner')).toBeInTheDocument();
    expect(screen.getByText('Lien externe')).toBeInTheDocument();
  });

  it('affiche la mention de limites de la Base CG', async () => {
    renderBaseCgRetraite();

    expect(await screen.findByText('Limites de la Base CG')).toBeInTheDocument();
    expect(screen.getByText(/à titre indicatif/i)).toBeInTheDocument();
    expect(screen.getByText(/aide interne/i)).toBeInTheDocument();
    expect(screen.getByText(/non contractuelle/i)).toBeInTheDocument();
  });
});
