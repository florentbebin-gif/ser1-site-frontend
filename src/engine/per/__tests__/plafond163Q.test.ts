import { describe, expect, it } from 'vitest';
import {
  computeRevenuActiviteProfessionnelle,
  computePlafond163QBrut,
  computeProjectedPlafond163Q,
  computeReductions163Q,
  computeRevenuImposable,
} from '../plafond163Q';
import type { DeclarantRevenus } from '../types';

const PASS = 46368;
const ABAT_SAL = { plafond: 14171, plancher: 495 };
const ABAT_RET = { plafond: 4321, plancher: 442 };

const EMPTY_DECLARANT: DeclarantRevenus = {
  statutTns: false,
  salaires: 0,
  art62: 0,
  bic: 0,
  retraites: 0,
  fonciersNets: 0,
  autresRevenus: 0,
  fraisReels: false,
  fraisReelsMontant: 0,
  cotisationsArt83: 0,
  cotisationsMadelinRetraite: 0,
  cotisationsMadelin154bis: 0,
  cotisationsPerp: 0,
  cotisationsPer163Q: 0,
  abondementPerco: 0,
  cotisationsPrevo: 0,
};

describe('computeRevenuImposable', () => {
  it('applique l’abattement 10 % sur les salaires', () => {
    const d = { ...EMPTY_DECLARANT, salaires: 50000 };
    expect(computeRevenuImposable(d, ABAT_SAL, ABAT_RET)).toBe(45000);
  });

  it('applique les frais réels si activés', () => {
    const d = { ...EMPTY_DECLARANT, salaires: 50000, fraisReels: true, fraisReelsMontant: 8000 };
    expect(computeRevenuImposable(d, ABAT_SAL, ABAT_RET)).toBe(42000);
  });

  it('utilise la configuration retraites injectée', () => {
    const d = { ...EMPTY_DECLARANT, retraites: 50000 };
    expect(computeRevenuImposable(d, ABAT_SAL, ABAT_RET)).toBe(45679);
  });
});

describe('computePlafond163QBrut', () => {
  it('applique le plancher PASS pour les petits revenus', () => {
    expect(computePlafond163QBrut(10000, PASS)).toBe(Math.round(PASS * 0.1));
  });

  it('calcule 10 % du revenu pour un revenu intermédiaire', () => {
    expect(computePlafond163QBrut(80000, PASS)).toBe(8000);
  });

  it('applique le plafond de 8 PASS pour les hauts revenus', () => {
    expect(computePlafond163QBrut(500000, PASS)).toBe(Math.round(8 * PASS * 0.1));
  });
});

describe('computeReductions163Q', () => {
  it('borne la réduction au plafond brut', () => {
    expect(computeReductions163Q(5000, 8000)).toBe(5000);
  });
});

describe('computeProjectedPlafond163Q', () => {
  it('déduit bien les flux 2042 du prochain plafond calculé', () => {
    const projected = computeProjectedPlafond163Q({
      revenuSource: { ...EMPTY_DECLARANT, salaires: 90000 },
      cotisationSource: EMPTY_DECLARANT,
      pass: PASS,
      reduction2042: 3500,
      abat10SalCfg: ABAT_SAL,
      abat10RetCfg: ABAT_RET,
    });

    expect(projected).toBe(4600);
  });

  it('ignore les pensions, le foncier et les autres revenus dans la base projetée', () => {
    const baseSource = { ...EMPTY_DECLARANT, salaires: 50000, art62: 10000, bic: 5000 };
    const withNonProfessionalIncome = {
      ...baseSource,
      retraites: 60000,
      fonciersNets: 15000,
      autresRevenus: 7000,
    };

    expect(computeRevenuActiviteProfessionnelle(baseSource, ABAT_SAL)).toBe(59000);
    expect(computeRevenuActiviteProfessionnelle(withNonProfessionalIncome, ABAT_SAL)).toBe(59000);

    const projectedBase = computeProjectedPlafond163Q({
      revenuSource: baseSource,
      cotisationSource: EMPTY_DECLARANT,
      pass: PASS,
      reduction2042: 0,
      abat10SalCfg: ABAT_SAL,
      abat10RetCfg: ABAT_RET,
    });
    const projectedWithNonProfessionalIncome = computeProjectedPlafond163Q({
      revenuSource: withNonProfessionalIncome,
      cotisationSource: EMPTY_DECLARANT,
      pass: PASS,
      reduction2042: 0,
      abat10SalCfg: ABAT_SAL,
      abat10RetCfg: ABAT_RET,
    });

    expect(projectedWithNonProfessionalIncome).toBe(projectedBase);
  });
});
