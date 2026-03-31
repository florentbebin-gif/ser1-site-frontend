import { describe, expect, it } from 'vitest';
import { calculatePerPotentiel } from '../perPotentiel';
import { computePlafond163QBrut } from '../plafond163Q';
import { computePlafondMadelin } from '../plafondMadelin';
import { DEFAULT_TAX_SETTINGS, DEFAULT_PS_SETTINGS, DEFAULT_PASS_HISTORY } from '../../../constants/settingsDefaults';
import type { DeclarantRevenus, PerPotentielInput, PerWarning } from '../types';

const PASS_2025 = 47100;

function makeDeclarant(overrides: Partial<DeclarantRevenus> = {}): DeclarantRevenus {
  return {
    salaires: 0,
    fraisReels: false,
    fraisReelsMontant: 0,
    art62: 0,
    bic: 0,
    retraites: 0,
    fonciersNets: 0,
    autresRevenus: 0,
    cotisationsPer163Q: 0,
    cotisationsPerp: 0,
    cotisationsArt83: 0,
    cotisationsMadelin154bis: 0,
    cotisationsMadelinRetraite: 0,
    abondementPerco: 0,
    cotisationsPrevo: 0,
    ...overrides,
  };
}

function makeInput(overrides: Partial<PerPotentielInput> = {}): PerPotentielInput {
  return {
    mode: 'versement-n',
    anneeRef: 2025,
    situationFiscale: {
      situationFamiliale: 'celibataire',
      nombreParts: 1,
      isole: false,
      declarant1: makeDeclarant({ salaires: 50000 }),
    },
    mutualisationConjoints: false,
    passHistory: DEFAULT_PASS_HISTORY,
    taxSettings: DEFAULT_TAX_SETTINGS,
    psSettings: DEFAULT_PS_SETTINGS,
    ...overrides,
  };
}

// ── Plafond 163Q unit tests ──────────────────────────────────────────────────

describe('computePlafond163QBrut', () => {
  it('returns 10% of revenue when between min and max', () => {
    // 80k * 10% = 8000, min = 4710, max = 37680 → 8000
    expect(computePlafond163QBrut(80000, PASS_2025)).toBe(8000);
  });

  it('clamps to minimum (10% of 1 PASS) for low income', () => {
    // 20k * 10% = 2000, min = 4710 → 4710
    expect(computePlafond163QBrut(20000, PASS_2025)).toBe(4710);
  });

  it('clamps to maximum (10% of 8 PASS) for very high income', () => {
    // 500k * 10% = 50000, max = 37680 → 37680
    expect(computePlafond163QBrut(500000, PASS_2025)).toBe(37680);
  });

  it('returns minimum for zero income', () => {
    expect(computePlafond163QBrut(0, PASS_2025)).toBe(4710);
  });
});

// ── Plafond Madelin unit tests ───────────────────────────────────────────────

describe('computePlafondMadelin', () => {
  it('returns null for salaried worker (no BIC/art62)', () => {
    const warnings: PerWarning[] = [];
    const result = computePlafondMadelin({
      declarant: makeDeclarant({ salaires: 80000 }),
      pass: PASS_2025,
    }, warnings);
    expect(result).toBeNull();
  });

  it('computes correct envelopes for TNS BIC 120k', () => {
    const warnings: PerWarning[] = [];
    const d = makeDeclarant({ bic: 120000 });
    const result = computePlafondMadelin({ declarant: d, pass: PASS_2025 }, warnings);
    expect(result).not.toBeNull();
    // env 15% = (120000 - 47100) * 0.15 = 10935
    expect(result!.enveloppe15).toBe(10935);
    // env 10% = 120000 * 0.1 = 12000 (between min 4710 and max 37680)
    expect(result!.enveloppe10).toBe(12000);
    // total = 10935 + 12000 = 22935
    expect(result!.potentielTotal).toBe(22935);
    expect(result!.disponibleRestant).toBe(22935);
  });

  it('computes minimum envelope for low TNS income', () => {
    const warnings: PerWarning[] = [];
    const d = makeDeclarant({ bic: 30000 });
    const result = computePlafondMadelin({ declarant: d, pass: PASS_2025 }, warnings);
    expect(result).not.toBeNull();
    // assiette = 30000 < PASS → env15 = 0, env10 = 10%*PASS = 4710
    expect(result!.enveloppe15).toBe(0);
    expect(result!.enveloppe10).toBe(4710);
  });

  it('warns on dépassement', () => {
    const warnings: PerWarning[] = [];
    const d = makeDeclarant({
      bic: 30000,
      cotisationsMadelinRetraite: 5000,
    });
    const result = computePlafondMadelin({ declarant: d, pass: PASS_2025 }, warnings);
    expect(result).not.toBeNull();
    expect(result!.depassement).toBe(true);
    expect(warnings.some(w => w.code === 'PER_MADELIN_DEPASSE')).toBe(true);
  });
});

// ── Full integration tests ───────────────────────────────────────────────────

describe('calculatePerPotentiel', () => {
  it('célibataire salarié TMI 30%, 80k', () => {
    const input = makeInput({
      situationFiscale: {
        situationFamiliale: 'celibataire',
        nombreParts: 1,
        isole: false,
        declarant1: makeDeclarant({ salaires: 80000 }),
      },
    });
    const result = calculatePerPotentiel(input);

    expect(result.estTNS).toBe(false);
    expect(result.plafondMadelin).toBeUndefined();
    expect(result.plafond163Q.declarant1.plafondCalculeN).toBeGreaterThan(0);
    expect(result.plafond163Q.declarant1.disponibleRestant).toBeGreaterThan(0);
    expect(result.situationFiscale.tmi).toBeGreaterThan(0);
    expect(result.situationFiscale.irEstime).toBeGreaterThan(0);
  });

  it('couple marié avec mutualisation', () => {
    const input = makeInput({
      situationFiscale: {
        situationFamiliale: 'marie',
        nombreParts: 2,
        isole: false,
        declarant1: makeDeclarant({ salaires: 80000 }),
        declarant2: makeDeclarant({ salaires: 30000 }),
      },
      mutualisationConjoints: true,
    });
    const result = calculatePerPotentiel(input);

    expect(result.plafond163Q.declarant2).toBeDefined();
    expect(result.plafond163Q.declarant1.plafondCalculeN).toBeGreaterThan(0);
    expect(result.plafond163Q.declarant2!.plafondCalculeN).toBeGreaterThan(0);
    expect(result.situationFiscale.irEstime).toBeGreaterThan(0);
  });

  it('parent isolé', () => {
    const input = makeInput({
      situationFiscale: {
        situationFamiliale: 'celibataire',
        nombreParts: 1.5,
        isole: true,
        declarant1: makeDeclarant({ salaires: 50000 }),
      },
    });
    const result = calculatePerPotentiel(input);

    expect(result.situationFiscale.irEstime).toBeGreaterThanOrEqual(0);
    expect(result.plafond163Q.declarant1.plafondCalculeN).toBeGreaterThan(0);
  });

  it('TNS Madelin BIC 120k — both 163Q and Madelin computed', () => {
    const input = makeInput({
      situationFiscale: {
        situationFamiliale: 'celibataire',
        nombreParts: 1,
        isole: false,
        declarant1: makeDeclarant({ bic: 120000 }),
      },
    });
    const result = calculatePerPotentiel(input);

    expect(result.estTNS).toBe(true);
    expect(result.plafondMadelin).toBeDefined();
    expect(result.plafondMadelin!.declarant1.potentielTotal).toBeGreaterThan(0);
    expect(result.plafond163Q.declarant1.plafondCalculeN).toBeGreaterThan(0);
  });

  it('mode déclaration avec avis IR', () => {
    const input = makeInput({
      mode: 'declaration-n1',
      avisIr: {
        nonUtiliseAnnee1: 2000,
        nonUtiliseAnnee2: 3000,
        nonUtiliseAnnee3: 1500,
        plafondCalcule: 4710,
        anneeRef: 2024,
      },
      situationFiscale: {
        situationFamiliale: 'celibataire',
        nombreParts: 1,
        isole: false,
        declarant1: makeDeclarant({
          salaires: 60000,
          cotisationsPer163Q: 3000,
        }),
      },
    });
    const result = calculatePerPotentiel(input);

    // Should include carry-forward amounts
    expect(result.plafond163Q.declarant1.nonUtiliseN1).toBe(1500);
    expect(result.plafond163Q.declarant1.nonUtiliseN2).toBe(3000);
    expect(result.plafond163Q.declarant1.nonUtiliseN3).toBe(2000);
    // Cotisations already declared
    expect(result.plafond163Q.declarant1.cotisationsDejaVersees).toBe(3000);
    // disponible should be plafondN + carry-forward - cotisations
    expect(result.plafond163Q.declarant1.disponibleRestant).toBeGreaterThan(0);
  });

  it('dépassement plafond → warning', () => {
    const input = makeInput({
      situationFiscale: {
        situationFamiliale: 'celibataire',
        nombreParts: 1,
        isole: false,
        declarant1: makeDeclarant({
          salaires: 30000,
          cotisationsPer163Q: 10000,
        }),
      },
    });
    const result = calculatePerPotentiel(input);

    expect(result.plafond163Q.declarant1.depassement).toBe(true);
    expect(result.warnings.some(w => w.code === 'PER_PLAFOND_163Q_DEPASSE')).toBe(true);
  });

  it('simulation versement — calculates économie IR', () => {
    const input = makeInput({
      versementEnvisage: 5000,
      situationFiscale: {
        situationFamiliale: 'celibataire',
        nombreParts: 1,
        isole: false,
        declarant1: makeDeclarant({ salaires: 80000 }),
      },
    });
    const result = calculatePerPotentiel(input);

    expect(result.simulation).toBeDefined();
    expect(result.simulation!.versementEnvisage).toBe(5000);
    expect(result.simulation!.economieIRAnnuelle).toBeGreaterThan(0);
    expect(result.simulation!.coutNetApresFiscalite).toBeLessThan(5000);
    expect(result.simulation!.plafondRestantApres).toBeGreaterThan(0);
  });

  it('estimation sans avis — works with defaults (0 carry-forward)', () => {
    const input = makeInput({
      mode: 'versement-n',
      // No avisIr provided
      situationFiscale: {
        situationFamiliale: 'celibataire',
        nombreParts: 1,
        isole: false,
        declarant1: makeDeclarant({ salaires: 60000 }),
      },
    });
    const result = calculatePerPotentiel(input);

    expect(result.plafond163Q.declarant1.nonUtiliseN1).toBe(0);
    expect(result.plafond163Q.declarant1.nonUtiliseN2).toBe(0);
    expect(result.plafond163Q.declarant1.nonUtiliseN3).toBe(0);
    expect(result.plafond163Q.declarant1.plafondCalculeN).toBeGreaterThan(0);
  });
});
