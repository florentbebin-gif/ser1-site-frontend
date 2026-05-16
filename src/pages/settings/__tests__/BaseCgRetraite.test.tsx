// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BaseCgRetraite from '../BaseCgRetraite';
import type { BaseCgRetraiteContract } from '@/data/basecg';

const getBaseCgRetraiteCatalogMock = vi.fn();
const upsertBaseCgRetraiteContractMock = vi.fn();

vi.mock('@/components/UserInfoBanner', () => ({
  UserInfoBanner: () => <div data-testid="user-info-banner" />,
}));

vi.mock('@/utils/cache/baseCgRetraiteRepository', () => ({
  getBaseCgRetraiteCatalog: () => getBaseCgRetraiteCatalogMock(),
  upsertBaseCgRetraiteContract: (contract: BaseCgRetraiteContract) => upsertBaseCgRetraiteContractMock(contract),
  deleteBaseCgRetraiteContract: vi.fn(),
  resetBaseCgRetraiteOverlay: vi.fn(),
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

  it('prépare les Conditions Générales sans upload Supabase', async () => {
    await openModal();
    await userEvent.click(screen.getByRole('tab', { name: 'Documents' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter un document' }));

    expect(screen.getByLabelText('Libellé du document')).toHaveValue('Conditions Générales');
    expect(screen.getByRole('button', { name: 'Uploader PDF' })).toBeDisabled();
  });

  it('persiste les documents ajoutés dans le contrat local', async () => {
    await openModal();
    await userEvent.click(screen.getByRole('tab', { name: 'Documents' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter un document' }));
    await userEvent.clear(screen.getByLabelText('URL ou chemin du document'));
    await userEvent.type(screen.getByLabelText('URL ou chemin du document'), 'https://example.test/cg.pdf');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => {
      expect(upsertBaseCgRetraiteContractMock).toHaveBeenCalledWith(expect.objectContaining({
        documents: [expect.objectContaining({
          label: 'Conditions Générales',
          sourceUrl: 'https://example.test/cg.pdf',
        })],
      }));
    });
  });

  it('masque le frais de gestion général et affiche les taux en pourcentage', async () => {
    const decimalFeesContract: BaseCgRetraiteContract = {
      ...contract,
      phaseEpargne: {
        ...contract.phaseEpargne,
        fraisGestion: 0.00495,
        fraisGestionFondsEuro: null,
        fraisGestionUc: null,
      },
    };
    getBaseCgRetraiteCatalogMock.mockResolvedValueOnce([decimalFeesContract]);
    await openModal();
    await userEvent.click(screen.getByRole('tab', { name: 'Phase épargne' }));

    expect(screen.queryByLabelText('Frais de gestion')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Frais gestion fonds €')).toHaveValue('0,495 %');
    expect(screen.getByLabelText('Frais gestion UC')).toHaveValue('0,495 %');
    expect(screen.getByLabelText('Frais sur versements')).toHaveValue('5 %');
  });
});
