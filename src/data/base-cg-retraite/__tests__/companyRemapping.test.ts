import {
  isRemovedBaseCgRetraiteContract,
  normalizeBaseCgRetraiteCompanyName,
  normalizeBaseCgRetraiteContractCompany,
} from '@/data/base-cg-retraite';
import type { BaseCgRetraiteContract } from '@/data/base-cg-retraite';
import { describe, expect, it } from 'vitest';

function makeContract(overrides: Partial<BaseCgRetraiteContract> = {}): BaseCgRetraiteContract {
  return {
    id: 'contract-test',
    sourceId: 'Contrat test',
    compagnie: 'EPSENS',
    nomContrat: 'PERIN TEST',
    typeContrat: 'PERIN',
    perCompartment: 'C1',
    phaseEpargne: {
      dateCommercialisation: null,
      nombreFonds: null,
      repartitionUcEuro: null,
      rendementFondsEuro: null,
      fraisVersements: null,
      fraisGestion: null,
      fraisArbitrage: null,
      fraisTransfertSortant: null,
      fraisTransfertSortantRate: null,
      clauseBeneficiaire: null,
      garantiesComplementaires: null,
    },
    phaseLiquidation: {
      ageLimiteLiquidation: null,
      sortieCapitalRetraite: null,
      fractionnementCapital: null,
      rachatLibre: null,
      tableConversionRente: null,
      tableGarantieAdhesion: null,
      tauxTechnique: null,
      fraisArrerages: null,
      fraisArreragesRate: null,
      annuitesGaranties: null,
      reversionPossible: null,
      reversionIncluse: null,
      renteEstimee: null,
    },
    ...overrides,
  };
}

describe('remapping des compagnies Base CG retraite', () => {
  it('rattache les anciennes compagnies aux noms actuels', () => {
    expect(normalizeBaseCgRetraiteCompanyName('EPSENS')).toBe('MALAKOFF_HUMANIS');
    expect(normalizeBaseCgRetraiteCompanyName('GO_EPARGNE')).toBe('EPARTIM');
    expect(normalizeBaseCgRetraiteCompanyName('LPA')).toBe('LPA_PREVOYANCE');
    expect(normalizeBaseCgRetraiteCompanyName('MNRA')).toBe('GARANCE');
    expect(normalizeBaseCgRetraiteCompanyName('SMA')).toBe('SMA_BTP');
    expect(normalizeBaseCgRetraiteCompanyName('CREDIT_DU_NORD')).toBe('SOCIETE_GENERALE');
    expect(normalizeBaseCgRetraiteCompanyName('PRIMONIAL')).toBe('ORADEA');
  });

  it('retire le PERP Préfon historique remplacé par le PER Préfon', () => {
    expect(
      isRemovedBaseCgRetraiteContract({
        id: 'prefon-perp-prefon-retraite-41',
        sourceId: 'Contrat N°41',
        nomContrat: 'PERP- PREFON-RETRAITE',
      }),
    ).toBe(true);
  });

  it('normalise aussi les anciennes valeurs provenant d’un override', () => {
    const staleOverride = makeContract({ compagnie: 'EPSENS' });

    expect(normalizeBaseCgRetraiteCompanyName('GO_EPARGNE')).toBe('EPARTIM');
    expect(normalizeBaseCgRetraiteCompanyName('CREDIT_DU_NORD')).toBe('SOCIETE_GENERALE');
    expect(normalizeBaseCgRetraiteCompanyName('PRIMONIAL')).toBe('ORADEA');
    expect(normalizeBaseCgRetraiteCompanyName('AVIVA')).toBe('ABEILLE');
    expect(normalizeBaseCgRetraiteCompanyName('LA_MONDIALE')).toBe('AG2R_LA_MONDIALE');
    expect(normalizeBaseCgRetraiteCompanyName('QUATREM')).toBe('MALAKOFF_HUMANIS');
    expect(normalizeBaseCgRetraiteCompanyName('BPO')).toBe('BANQUE_POPULAIRE');
    expect(normalizeBaseCgRetraiteContractCompany(staleOverride).compagnie).toBe(
      'MALAKOFF_HUMANIS',
    );
  });

  it('marque les anciens contrats Primonial supprimés pour filtrer les overrides persistés', () => {
    expect(
      isRemovedBaseCgRetraiteContract({
        id: 'primonial-madelin-gestion-privee-promadelin-35',
        sourceId: 'Contrat N°35',
        nomContrat: 'MADELIN- GESTION PRIVEE PROMADELIN',
      }),
    ).toBe(true);
    expect(isRemovedBaseCgRetraiteContract(makeContract({ sourceId: 'Contrat N°37' }))).toBe(false);
  });
});
