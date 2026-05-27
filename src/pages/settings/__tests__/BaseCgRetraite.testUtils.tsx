// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, vi } from 'vitest';
import type { BaseCgRetraiteContract } from '@/data/base-cg-retraite';
import BaseCgRetraite from '../BaseCgRetraite';

export const getBaseCgRetraiteCatalogMock = vi.fn();
export const upsertBaseCgRetraiteContractMock = vi.fn();
export const deleteBaseCgRetraiteContractMock = vi.fn();
export const createBaseCgRetraiteDocumentDownloadUrlMock = vi.fn();
export const useUserRoleMock = vi.fn();

vi.mock('@/components/UserInfoBanner', () => ({
  UserInfoBanner: () => <div data-testid="user-info-banner" />,
}));

vi.mock('@/auth/useUserRole', () => ({
  useUserRole: () => useUserRoleMock(),
}));

vi.mock('@/utils/cache/baseCgRetraiteRepository', () => ({
  getBaseCgRetraiteCatalog: () => getBaseCgRetraiteCatalogMock(),
  upsertBaseCgRetraiteContract: (contract: BaseCgRetraiteContract) =>
    upsertBaseCgRetraiteContractMock(contract),
  deleteBaseCgRetraiteContract: (id: string) => deleteBaseCgRetraiteContractMock(id),
  createBaseCgRetraiteDocumentDownloadUrl: (...args: unknown[]) =>
    createBaseCgRetraiteDocumentDownloadUrlMock(...args),
}));

export const contract: BaseCgRetraiteContract = {
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

export function resetBaseCgRetraiteMocks(): void {
  getBaseCgRetraiteCatalogMock.mockReset();
  getBaseCgRetraiteCatalogMock.mockResolvedValue([contract]);
  upsertBaseCgRetraiteContractMock.mockReset();
  upsertBaseCgRetraiteContractMock.mockResolvedValue(undefined);
  deleteBaseCgRetraiteContractMock.mockReset();
  deleteBaseCgRetraiteContractMock.mockResolvedValue(undefined);
  createBaseCgRetraiteDocumentDownloadUrlMock.mockReset();
  createBaseCgRetraiteDocumentDownloadUrlMock.mockResolvedValue(
    'https://signed.example.test/cg.pdf',
  );
  useUserRoleMock.mockReset();
  useUserRoleMock.mockReturnValue({
    role: 'admin',
    user: null,
    isAdmin: true,
    isLoading: false,
  });
}

export function renderBaseCgRetraite(): ReturnType<typeof render> {
  return render(<BaseCgRetraite />);
}

export async function openModal(): Promise<void> {
  renderBaseCgRetraite();
  expect(await screen.findByText('MADELIN- ABEILLE RETRAITE MADELIN')).toBeInTheDocument();
  await userEvent.click(await screen.findByRole('button', { name: 'Modifier' }));
}
