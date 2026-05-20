import {
  BASECG_CATALOG,
  isRemovedBaseCgRetraiteContract,
  normalizeBaseCgRetraiteCompanyName,
  normalizeBaseCgRetraiteContractCompany,
} from '@/data/base-cg-retraite';
import { describe, expect, it } from 'vitest';

function getContractBySourceId(sourceId: string) {
  return BASECG_CATALOG.find((contract) => contract.sourceId === sourceId);
}

describe('remapping des compagnies Base CG retraite', () => {
  it('rattache les anciennes compagnies aux noms actuels', () => {
    expect(getContractBySourceId('Contrat N°202')?.compagnie).toBe('MALAKOFF_HUMANIS');
    expect(getContractBySourceId('Contrat N°130')?.compagnie).toBe('EPARTIM');
    expect(getContractBySourceId('Contrat N°94')?.compagnie).toBe('LPA_PREVOYANCE');
    expect(getContractBySourceId('Contrat N°50')?.compagnie).toBe('GARANCE');
    expect(getContractBySourceId('Contrat N°31')?.compagnie).toBe('SMA_BTP');
    expect(getContractBySourceId('Contrat N°229')?.compagnie).toBe('SOCIETE_GENERALE');
    expect(getContractBySourceId('Contrat N°37')?.compagnie).toBe('ORADEA');
  });

  it('ne garde pas de groupe obsolète isolé après consolidation', () => {
    const compagnies = new Set(BASECG_CATALOG.map((contract) => contract.compagnie));

    expect(compagnies.has('EPSENS')).toBe(false);
    expect(compagnies.has('GO_EPARGNE')).toBe(false);
    expect(compagnies.has('LPA')).toBe(false);
    expect(compagnies.has('MNRA')).toBe(false);
    expect(compagnies.has('CREDIT_DU_NORD')).toBe(false);
    expect(compagnies.has('PRIMONIAL')).toBe(false);
    expect(compagnies.has('SMA')).toBe(false);
  });

  it('retire les contrats Primonial explicitement supprimés', () => {
    expect(getContractBySourceId('Contrat N°35')).toBeUndefined();
    expect(getContractBySourceId('Contrat N°36')).toBeUndefined();
    expect(
      BASECG_CATALOG.some(
        (contract) => contract.nomContrat === 'MADELIN- GESTION PRIVEE PROMADELIN',
      ),
    ).toBe(false);
    expect(
      BASECG_CATALOG.some((contract) =>
        contract.nomContrat.includes('PATRIMOINE MANAGEMENT ET ASSOCIES'),
      ),
    ).toBe(false);
  });

  it('retire le PERP Préfon historique remplacé par le PER Préfon', () => {
    expect(getContractBySourceId('Contrat N°41')).toBeUndefined();
    expect(getContractBySourceId('Contrat N°42')?.nomContrat).toBe('PERIN- PER PREFON RETRAITE');
    expect(
      isRemovedBaseCgRetraiteContract({
        id: 'prefon-perp-prefon-retraite-41',
        sourceId: 'Contrat N°41',
        nomContrat: 'PERP- PREFON-RETRAITE',
      }),
    ).toBe(true);
  });

  it('normalise aussi les anciennes valeurs provenant d’un override', () => {
    const staleOverride = {
      ...getContractBySourceId('Contrat N°202')!,
      compagnie: 'EPSENS',
    };

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
    expect(isRemovedBaseCgRetraiteContract(getContractBySourceId('Contrat N°37')!)).toBe(false);
  });
});
