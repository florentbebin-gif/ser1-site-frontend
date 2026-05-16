// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BaseCgRetraite from '../BaseCgRetraite';
import type { BaseCgRetraiteContract } from '@/data/basecg';

const getBaseCgRetraiteCatalogMock = vi.fn();
const upsertBaseCgRetraiteContractMock = vi.fn();
const deleteBaseCgRetraiteContractMock = vi.fn();
const createBaseCgRetraiteDocumentDownloadUrlMock = vi.fn();
const useUserRoleMock = vi.fn();

vi.mock('@/components/UserInfoBanner', () => ({
  UserInfoBanner: () => <div data-testid="user-info-banner" />,
}));

vi.mock('@/auth/useUserRole', () => ({
  useUserRole: () => useUserRoleMock(),
}));

vi.mock('@/utils/cache/baseCgRetraiteRepository', () => ({
  getBaseCgRetraiteCatalog: () => getBaseCgRetraiteCatalogMock(),
  upsertBaseCgRetraiteContract: (contract: BaseCgRetraiteContract) => upsertBaseCgRetraiteContractMock(contract),
  deleteBaseCgRetraiteContract: (id: string) => deleteBaseCgRetraiteContractMock(id),
  createBaseCgRetraiteDocumentDownloadUrl: (...args: unknown[]) => createBaseCgRetraiteDocumentDownloadUrlMock(...args),
}));

const contract: BaseCgRetraiteContract = {
  id: 'test-contract',
  sourceId: 'Contrat N°386',
  compagnie: 'ABEILLE',
  nomContrat: 'MADELIN- ABEILLE RETRAITE MADELIN',
  typeContrat: 'MADELIN',
  perCompartment: 'C1',
  phaseEpargne: {
    dateCommercialisation: 'De 2010 à 2017',
    nombreFonds: 50,
    repartitionUcEuro: null,
    rendementFondsEuro: 'NC',
    fraisVersements: 0.05,
    fraisGestion: '1% (€) - 1,50% (UC)',
    fraisArbitrage: '0,5%',
    fraisTransfertSortant: 0,
    fraisTransfertSortantRate: 0,
    clauseBeneficiaire: 'Standard',
    garantiesComplementaires: 'Plancher décès',
  },
  phaseLiquidation: {
    ageLimiteLiquidation: 'NC',
    sortieCapitalRetraite: 'Non',
    fractionnementCapital: 'Non',
    rachatLibre: 'Non',
    tableConversionRente: 'TGH05 ou TGF05',
    tableGarantieAdhesion: 'Oui',
    tauxTechnique: 'NC',
    fraisArrerages: 0.03,
    fraisArreragesRate: 0.03,
    annuitesGaranties: 'Oui sur option',
    reversionPossible: 'Oui sur option',
    reversionIncluse: 'Non',
    renteEstimee: null,
  },
  documents: [],
};

async function openModal() {
  render(<BaseCgRetraite />);
  expect(await screen.findByText('MADELIN- ABEILLE RETRAITE MADELIN')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Modifier' }));
}

describe('BaseCgRetraite', () => {
  beforeEach(() => {
    getBaseCgRetraiteCatalogMock.mockReset();
    getBaseCgRetraiteCatalogMock.mockResolvedValue([contract]);
    upsertBaseCgRetraiteContractMock.mockReset();
    upsertBaseCgRetraiteContractMock.mockResolvedValue(undefined);
    deleteBaseCgRetraiteContractMock.mockReset();
    deleteBaseCgRetraiteContractMock.mockResolvedValue(undefined);
    createBaseCgRetraiteDocumentDownloadUrlMock.mockReset();
    createBaseCgRetraiteDocumentDownloadUrlMock.mockResolvedValue('https://signed.example.test/cg.pdf');
    useUserRoleMock.mockReset();
    useUserRoleMock.mockReturnValue({
      role: 'admin',
      user: null,
      isAdmin: true,
      isLoading: false,
    });
  });

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
      documents: [{
        id: 'doc-swisslife',
        label: 'Notice SwissLife PER Individuel',
        type: 'notice_information',
        status: 'uploaded',
        versionLabel: '13124 – 09.2019',
        storagePath: 'swisslife/swisslife-per-individuel/13124-09-2019.pdf',
        fileName: '13124-09-2019.pdf',
        mime: 'application/pdf',
        bytes: 462558,
      }],
    };
    getBaseCgRetraiteCatalogMock.mockResolvedValueOnce([documentedContract, incompleteContract]);

    render(<BaseCgRetraite />);

    expect(await screen.findByText('2 contrats disponibles - 1 contrat paramétré - 1 CG disponible')).toBeInTheDocument();
    expect(screen.queryByText(/extraction/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/version/i)).not.toBeInTheDocument();
  });

  it('réserve les actions de gestion aux admins et supprime le bouton réinitialiser', async () => {
    const { unmount } = render(<BaseCgRetraite />);

    expect(await screen.findByRole('button', { name: 'Ajouter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Supprimer' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Réinitialiser' })).not.toBeInTheDocument();
    unmount();

    useUserRoleMock.mockReturnValue({
      role: 'user',
      user: null,
      isAdmin: false,
      isLoading: false,
    });
    render(<BaseCgRetraite />);

    expect(await screen.findByText('MADELIN- ABEILLE RETRAITE MADELIN')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ajouter' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Modifier' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Réinitialiser' })).not.toBeInTheDocument();
  });

  it('affiche la modale en 4 onglets', async () => {
    await openModal();

    expect(screen.getAllByRole('tab')).toHaveLength(4);
    expect(screen.getByRole('tab', { name: 'Identité' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Phase épargne' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Phase liquidation' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Documents' })).toBeInTheDocument();
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

    render(<BaseCgRetraite />);

    expect(await screen.findByRole('button', { name: /ABEILLE/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /CARDIF/ })).toBeInTheDocument();
    expect(screen.getByText('1 à compléter')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /CARDIF/ }));

    expect(screen.getByText('Contrat incomplet')).toBeInTheDocument();
    expect(screen.getByText('À compléter')).toBeInTheDocument();
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
    await userEvent.type(screen.getByLabelText('Chemin Supabase Storage'), 'swisslife/swisslife-per-individuel/13124-09-2019.pdf');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => {
      expect(upsertBaseCgRetraiteContractMock).toHaveBeenCalledWith(expect.objectContaining({
        documents: [expect.objectContaining({
          label: 'Conditions Générales',
          versionLabel: expect.stringContaining('13124'),
          storagePath: 'swisslife/swisslife-per-individuel/13124-09-2019.pdf',
        })],
      }));
    });
  });

  it('met en avant les noms de contrats et le lien de téléchargement CG', async () => {
    getBaseCgRetraiteCatalogMock.mockResolvedValueOnce([{
      ...contract,
      documents: [{
        id: 'doc-swisslife',
        label: 'Notice SwissLife PER Individuel',
        type: 'notice_information',
        status: 'uploaded',
        versionLabel: '13124 – 09.2019',
        storagePath: 'swisslife/swisslife-per-individuel/13124-09-2019.pdf',
      }],
    }]);

    render(<BaseCgRetraite />);

    const contractName = await screen.findByText('MADELIN- ABEILLE RETRAITE MADELIN');
    expect(contractName).toHaveClass('base-cg-contract-name__label');
    expect(screen.queryByText('Contrat N°386')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Télécharger CG' })).toBeInTheDocument();
    expect(screen.getByText('Ref : 13124 – 09.2019')).toBeInTheDocument();
    expect(screen.queryByText(/Notice SwissLife PER Individuel/)).not.toBeInTheDocument();
  });

  it('affiche la mention de limites de la Base CG', async () => {
    render(<BaseCgRetraite />);

    expect(await screen.findByText('Limites de la Base CG')).toBeInTheDocument();
    expect(screen.getByText(/à titre indicatif/i)).toBeInTheDocument();
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
});
