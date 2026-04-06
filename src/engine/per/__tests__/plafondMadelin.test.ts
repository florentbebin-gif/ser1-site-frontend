import { describe, expect, it } from 'vitest';
import { computeAssietteMadelin, computePlafondMadelin, isTNS } from '../plafondMadelin';
import type { DeclarantRevenus, PerWarning } from '../types';

const PASS = 46368;

const EMPTY_DECLARANT: DeclarantRevenus = {
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

describe('isTNS', () => {
  it('retourne false pour un salarié sans BIC ni art62', () => {
    expect(isTNS({ ...EMPTY_DECLARANT, salaires: 50000 })).toBe(false);
  });

  it('retourne true pour un TNS avec BIC', () => {
    expect(isTNS({ ...EMPTY_DECLARANT, bic: 80000 })).toBe(true);
  });

  it('retourne true pour un gérant art62', () => {
    expect(isTNS({ ...EMPTY_DECLARANT, art62: 60000 })).toBe(true);
  });
});

describe('computeAssietteMadelin', () => {
  it('calcule l\'assiette à partir des revenus TNS + cotisations', () => {
    const d = { ...EMPTY_DECLARANT, bic: 80000, cotisationsMadelinRetraite: 5000 };
    expect(computeAssietteMadelin(d)).toBe(85000);
  });
});

describe('computePlafondMadelin', () => {
  it('retourne null pour un non-TNS', () => {
    const warnings: PerWarning[] = [];
    const result = computePlafondMadelin({ declarant: { ...EMPTY_DECLARANT, salaires: 50000 }, pass: PASS }, warnings);
    expect(result).toBeNull();
  });

  it('calcule le plafond pour un TNS avec assiette sous 1 PASS', () => {
    const warnings: PerWarning[] = [];
    const result = computePlafondMadelin({ declarant: { ...EMPTY_DECLARANT, bic: 30000 }, pass: PASS }, warnings);
    expect(result).not.toBeNull();
    // Assiette = 30000 < PASS → enveloppe15 = 0, enveloppe10 = PASS * 10% = 4637
    expect(result!.enveloppe15).toBe(0);
    expect(result!.enveloppe10).toBe(Math.round(PASS * 0.1));
  });

  it('calcule le plafond pour un TNS avec assiette entre 1 et 8 PASS', () => {
    const warnings: PerWarning[] = [];
    const result = computePlafondMadelin({ declarant: { ...EMPTY_DECLARANT, bic: 100000 }, pass: PASS }, warnings);
    expect(result).not.toBeNull();
    // Assiette = 100000 > PASS → enveloppe15 = (100000 - PASS) * 15%
    expect(result!.enveloppe15).toBe(Math.round((100000 - PASS) * 0.15));
    expect(result!.enveloppe10).toBe(Math.round(100000 * 0.1));
  });
});
