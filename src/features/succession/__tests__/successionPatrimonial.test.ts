import { describe, expect, it } from 'vitest';
import type { SuccessionCivilContext, SuccessionPatrimonialContext } from '../successionDraft';
import { buildSuccessionPatrimonialAnalysis } from '../successionPatrimonial';

function makeCivil(overrides: Partial<SuccessionCivilContext>): SuccessionCivilContext {
  return {
    situationMatrimoniale: 'marie',
    regimeMatrimonial: 'communaute_legale',
    pacsConvention: 'separation',
    ...overrides,
  };
}

function makePatrimonial(overrides: Partial<SuccessionPatrimonialContext>): SuccessionPatrimonialContext {
  return {
    donationsRapportables: 0,
    donationsHorsPart: 0,
    legsParticuliers: 0,
    donationEntreEpouxActive: false,
    donationEntreEpouxOption: 'usufruit_total',
    preciputMontant: 0,
    attributionIntegrale: false,
    attributionBiensCommunsPct: 50,
    ...overrides,
  };
}

describe('buildSuccessionPatrimonialAnalysis', () => {
  it('calcule masse civile et quotité disponible avec enfants', () => {
    const analysis = buildSuccessionPatrimonialAnalysis(
      makeCivil({}),
      600000,
      2,
      makePatrimonial({ donationsRapportables: 100000, donationsHorsPart: 50000 }),
    );

    expect(analysis.masseCivileReference).toBe(750000);
    expect(Math.round(analysis.quotiteDisponibleMontant)).toBe(250000);
  });

  it('détecte un dépassement de quotité disponible', () => {
    const analysis = buildSuccessionPatrimonialAnalysis(
      makeCivil({}),
      400000,
      1,
      makePatrimonial({ donationsHorsPart: 260000, legsParticuliers: 120000 }),
    );

    expect(analysis.depassementQuotiteMontant).toBeGreaterThan(0);
    expect(analysis.warnings.some((w) => w.includes('quotité disponible'))).toBe(true);
  });

  it('produit des warnings d’incohérence hors mariage', () => {
    const analysis = buildSuccessionPatrimonialAnalysis(
      makeCivil({ situationMatrimoniale: 'concubinage', regimeMatrimonial: null }),
      300000,
      1,
      makePatrimonial({
        donationEntreEpouxActive: true,
        donationEntreEpouxOption: 'pleine_propriete_quotite',
        preciputMontant: 30000,
        attributionIntegrale: true,
      }),
    );

    expect(analysis.warnings.some((w) => w.includes('hors mariage'))).toBe(true);
  });

  it('affiche une alerte explicite sur l’option de donation entre époux', () => {
    const analysis = buildSuccessionPatrimonialAnalysis(
      makeCivil({ situationMatrimoniale: 'marie' }),
      500000,
      2,
      makePatrimonial({
        donationEntreEpouxActive: true,
        donationEntreEpouxOption: 'mixte',
      }),
    );

    expect(analysis.warnings.some((w) => w.includes('option mixte 1/4 PP + 3/4 usufruit'))).toBe(true);
  });
});
