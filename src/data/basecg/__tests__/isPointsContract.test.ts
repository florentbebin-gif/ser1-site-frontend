import { describe, expect, it } from 'vitest';
import { BASECG_CATALOG, isPointsContract } from '@/data/basecg';
import type { BaseCgRetraiteContract } from '@/data/basecg';

function makeContract(overrides: Partial<BaseCgRetraiteContract>): BaseCgRetraiteContract {
  const base = BASECG_CATALOG[0];
  return {
    ...base,
    ...overrides,
    phaseEpargne: { ...base.phaseEpargne, ...overrides.phaseEpargne },
  } as BaseCgRetraiteContract;
}

describe('isPointsContract', () => {
  it('reconnaît les contrats taggés PER_POINTS (Préfon)', () => {
    const prefon = BASECG_CATALOG.find((c) => c.id === 'prefon-perin-per-prefon-retraite-42');
    expect(prefon).toBeDefined();
    expect(isPointsContract(prefon!)).toBe(true);
  });

  it('reconnaît les contrats avec « Système par points » dans le rendement fonds €', () => {
    const corem = BASECG_CATALOG.find((c) => c.id === 'umr-art83-corem-co-1');
    expect(corem).toBeDefined();
    expect(corem!.typeContrat).toBe('ARTICLE83');
    expect(isPointsContract(corem!)).toBe(true);
  });

  it('reconnaît AGIPI PAIR avec « NC\\nPoints »', () => {
    const pair = BASECG_CATALOG.find(
      (c) => c.compagnie === 'AGIPI' && c.nomContrat.includes('PAIR'),
    );
    expect(pair).toBeDefined();
    expect(isPointsContract(pair!)).toBe(true);
  });

  it('reconnaît "PER MEDICIS PRODUIT EN POINTS" via "Système par points"', () => {
    const medicisPoints = BASECG_CATALOG.find((c) =>
      c.nomContrat.includes('PER MEDICIS PRODUIT EN POINTS'),
    );
    expect(medicisPoints).toBeDefined();
    expect(isPointsContract(medicisPoints!)).toBe(true);
  });

  it('refuse un contrat classique sans marker points', () => {
    const classic = makeContract({
      typeContrat: 'PERIN',
      phaseEpargne: {
        rendementFondsEuro: '2,5 %',
        repartitionUcEuro: '40 % UC / 60 % fonds €',
      } as BaseCgRetraiteContract['phaseEpargne'],
    });
    expect(isPointsContract(classic)).toBe(false);
  });

  it('liste au moins 10 contrats en points dans le catalogue (Préfon + COREM + Médicis + AGIPI PAIR + …)', () => {
    const pointsContracts = BASECG_CATALOG.filter(isPointsContract);
    expect(pointsContracts.length).toBeGreaterThanOrEqual(10);
  });
});
