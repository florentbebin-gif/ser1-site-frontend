import { describe, expect, it } from 'vitest';
import { computeAssietteMadelin, computePlafondMadelin, isTNS } from '../plafondMadelin';
import type { DeclarantRevenus, PerWarning } from '../types';

const PASS = 46368;

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

describe('isTNS', () => {
  it('retourne false si le statut TNS n’est pas activé', () => {
    expect(isTNS({ ...EMPTY_DECLARANT, bic: 80000 })).toBe(false);
  });

  it('retourne true si le statut TNS est activé', () => {
    expect(isTNS({ ...EMPTY_DECLARANT, statutTns: true, bic: 80000 })).toBe(true);
  });
});

describe('computeAssietteMadelin', () => {
  it('calcule l’assiette de versement avec les cotisations facultatives', () => {
    const d = {
      ...EMPTY_DECLARANT,
      statutTns: true,
      bic: 80000,
      cotisationsMadelinRetraite: 5000,
      cotisationsMadelin154bis: 3000,
      cotisationsPrevo: 1000,
    };
    expect(computeAssietteMadelin(d)).toBe(89000);
  });
});

describe('computePlafondMadelin', () => {
  it('retourne null pour un non-TNS', () => {
    const warnings: PerWarning[] = [];
    const result = computePlafondMadelin({
      declarant: { ...EMPTY_DECLARANT, salaires: 50000 },
      pass: PASS,
    }, warnings);
    expect(result).toBeNull();
  });

  it('retourne un détail à zéro quand le statut TNS est actif sans base positive', () => {
    const warnings: PerWarning[] = [];
    const result = computePlafondMadelin({
      declarant: { ...EMPTY_DECLARANT, statutTns: true },
      pass: PASS,
    }, warnings);

    expect(result).not.toBeNull();
    expect(result!.assietteVersement).toBe(0);
    expect(result!.assietteReport).toBe(0);
    expect(result!.enveloppe10).toBe(0);
  });

  it('calcule les deux enveloppes pour un TNS sous 1 PASS', () => {
    const warnings: PerWarning[] = [];
    const result = computePlafondMadelin({
      declarant: { ...EMPTY_DECLARANT, statutTns: true, bic: 30000 },
      pass: PASS,
    }, warnings);

    expect(result).not.toBeNull();
    expect(result!.enveloppe15Versement).toBe(0);
    expect(result!.enveloppe10).toBe(Math.round(PASS * 0.1));
    expect(result!.surplusAReintegrer).toBe(0);
  });

  it('partage l’enveloppe 10 % avec art. 83, PERCO et les dépassements Madelin', () => {
    const warnings: PerWarning[] = [];
    const result = computePlafondMadelin({
      declarant: {
        ...EMPTY_DECLARANT,
        statutTns: true,
        bic: 100000,
        cotisationsArt83: 2000,
        abondementPerco: 1000,
        cotisationsMadelinRetraite: 12000,
        cotisationsMadelin154bis: 5000,
      },
      pass: PASS,
    }, warnings);

    expect(result).not.toBeNull();
    expect(result!.consommation10.art83).toBe(2000);
    expect(result!.consommation10.perco).toBe(1000);
    expect(result!.consommation10.total).toBeLessThanOrEqual(result!.enveloppe10);
    expect(result!.depassement15Report.madelinRetraite).toBeGreaterThanOrEqual(0);
  });

  it('calcule la réintégration quand les enveloppes sont dépassées', () => {
    const warnings: PerWarning[] = [];
    const result = computePlafondMadelin({
      declarant: {
        ...EMPTY_DECLARANT,
        statutTns: true,
        bic: 30000,
        cotisationsMadelinRetraite: 6000,
        cotisationsMadelin154bis: 5000,
      },
      pass: PASS,
    }, warnings);

    expect(result).not.toBeNull();
    expect(result!.depassement).toBe(true);
    expect(result!.surplusAReintegrer).toBeGreaterThan(0);
    expect(warnings.some((warning) => warning.code === 'PER_MADELIN_REINTEGRATION')).toBe(true);
  });

  it('assietteReport non affectée par fraisReels = true (BOI-IR-BASE-20-50-20 §340)', () => {
    const warnings: PerWarning[] = [];
    const result = computePlafondMadelin({
      declarant: {
        ...EMPTY_DECLARANT,
        statutTns: true,
        art62: 60000,
        bic: 20000,
        fraisReels: true,
        fraisReelsMontant: 8000,
      },
      pass: PASS,
    }, warnings);

    expect(result).not.toBeNull();
    expect(result!.assietteReport).toBe(80000);
  });

  it('calcule l’assiette report sur art.62 + bic sans abattement frais professionnels (BOI-IR-BASE-20-50-20 §340)', () => {
    const warnings: PerWarning[] = [];
    const result = computePlafondMadelin({
      declarant: {
        ...EMPTY_DECLARANT,
        statutTns: true,
        salaires: 30000,
        art62: 10000,
        bic: 5000,
      },
      pass: PASS,
    }, warnings);

    expect(result).not.toBeNull();
    expect(result!.assietteReport).toBe(15000);
  });
});
