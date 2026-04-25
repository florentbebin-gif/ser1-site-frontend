import { describe, expect, it } from 'vitest';
import { calculatePerPotentiel } from '../perPotentiel';
import {
  DEFAULT_PASS_HISTORY,
  DEFAULT_PS_SETTINGS,
  DEFAULT_TAX_SETTINGS,
} from '../../../constants/settingsDefaults';
import type { AvisIrPlafonds, DeclarantRevenus, PerPotentielInput } from '../types';

function makeDeclarant(overrides: Partial<DeclarantRevenus> = {}): DeclarantRevenus {
  return {
    statutTns: false,
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

function makeAvis(overrides: Partial<AvisIrPlafonds> = {}): AvisIrPlafonds {
  return {
    nonUtiliseAnnee1: 1000,
    nonUtiliseAnnee2: 2000,
    nonUtiliseAnnee3: 3000,
    plafondCalcule: 4000,
    anneeRef: 2025,
    ...overrides,
  };
}

function makeInput(overrides: Partial<PerPotentielInput> = {}): PerPotentielInput {
  return {
    mode: 'declaration-n1',
    historicalBasis: 'previous-avis-plus-n1',
    anneeRef: 2025,
    yearKey: 'current',
    situationFiscale: {
      situationFamiliale: 'celibataire',
      nombreParts: 1,
      isole: false,
      declarant1: makeDeclarant({ salaires: 60000, cotisationsPer163Q: 3000 }),
    },
    avisIr: makeAvis(),
    mutualisationConjoints: false,
    passHistory: DEFAULT_PASS_HISTORY,
    taxSettings: DEFAULT_TAX_SETTINGS,
    psSettings: DEFAULT_PS_SETTINGS,
    ...overrides,
  };
}

describe('calculatePerPotentiel', () => {
  it('utilise le potentiel 163 quatervicies de l’avis IR saisi', () => {
    const result = calculatePerPotentiel(makeInput());

    expect(result.plafond163Q.declarant1.totalDisponible).toBe(10000);
    expect(result.deductionFlow163Q.declarant1.cotisationsRetenuesIr).toBe(3000);
    expect(result.deductionFlow163Q.declarant1.disponibleRestant).toBe(7000);
  });

  it('fait chuter le disponible restant quand les cotisations 163Q augmentent', () => {
    const withoutContributions = calculatePerPotentiel(makeInput({
      situationFiscale: {
        situationFamiliale: 'celibataire',
        nombreParts: 1,
        isole: false,
        declarant1: makeDeclarant({ salaires: 60000 }),
      },
    }));
    const withContributions = calculatePerPotentiel(makeInput({
      situationFiscale: {
        situationFamiliale: 'celibataire',
        nombreParts: 1,
        isole: false,
        declarant1: makeDeclarant({ salaires: 60000, cotisationsPer163Q: 2000, cotisationsPerp: 300 }),
      },
    }));

    expect(withoutContributions.deductionFlow163Q.declarant1.disponibleRestant).toBe(10000);
    expect(withContributions.deductionFlow163Q.declarant1.disponibleRestant).toBe(7700);
  });

  it('dérive correctement les cases 6OS / 6QS pour un TNS', () => {
    const result = calculatePerPotentiel(makeInput({
      situationFiscale: {
        situationFamiliale: 'celibataire',
        nombreParts: 1,
        isole: false,
        declarant1: makeDeclarant({
          statutTns: true,
          bic: 100000,
          cotisationsArt83: 1000,
          abondementPerco: 500,
          cotisationsMadelinRetraite: 8000,
          cotisationsMadelin154bis: 6000,
        }),
      },
    }));

    expect(result.estTNS).toBe(true);
    expect(result.declaration2042.case6OS).toBe(6000);
    expect(result.declaration2042.case6QS).toBe(1565);
    expect(result.plafondMadelin?.declarant1.enveloppe15Versement).toBeGreaterThan(0);
  });

  it('ne déduit pas le Madelin du RBG quand il reste dans ses enveloppes', () => {
    const baseInput = makeInput({
      situationFiscale: {
        situationFamiliale: 'celibataire',
        nombreParts: 1,
        isole: false,
        declarant1: makeDeclarant({
          statutTns: true,
          bic: 90000,
          cotisationsPer163Q: 3000,
        }),
      },
    });

    const sansMadelin = calculatePerPotentiel(baseInput);
    const avecMadelin = calculatePerPotentiel({
      ...baseInput,
      situationFiscale: {
        ...baseInput.situationFiscale,
        declarant1: makeDeclarant({
          statutTns: true,
          bic: 90000,
          cotisationsPer163Q: 3000,
          cotisationsMadelinRetraite: 4000,
          cotisationsMadelin154bis: 2000,
          cotisationsPrevo: 500,
        }),
      },
    });

    expect(avecMadelin.situationFiscale.irEstime).toBe(sansMadelin.situationFiscale.irEstime);
  });

  it('réintègre le surplus Madelin dans la base TNS', () => {
    const withoutOverflow = calculatePerPotentiel(makeInput({
      situationFiscale: {
        situationFamiliale: 'celibataire',
        nombreParts: 1,
        isole: false,
        declarant1: makeDeclarant({
          statutTns: true,
          bic: 30000,
          cotisationsPer163Q: 2000,
        }),
      },
    }));

    const withOverflow = calculatePerPotentiel(makeInput({
      situationFiscale: {
        situationFamiliale: 'celibataire',
        nombreParts: 1,
        isole: false,
        declarant1: makeDeclarant({
          statutTns: true,
          bic: 30000,
          cotisationsPer163Q: 2000,
          cotisationsMadelinRetraite: 6000,
          cotisationsMadelin154bis: 5000,
        }),
      },
    }));

    expect(withOverflow.plafondMadelin?.declarant1.surplusAReintegrer).toBeGreaterThan(0);
    expect(withOverflow.situationFiscale.irEstime).toBeGreaterThan(withoutOverflow.situationFiscale.irEstime);
  });

  it('applique la mutualisation des conjoints au niveau moteur', () => {
    const result = calculatePerPotentiel(makeInput({
      situationFiscale: {
        situationFamiliale: 'marie',
        nombreParts: 2,
        isole: false,
        declarant1: makeDeclarant({ salaires: 70000, cotisationsPer163Q: 12000 }),
        declarant2: makeDeclarant({ salaires: 30000, cotisationsPer163Q: 0 }),
      },
      avisIr: makeAvis({ nonUtiliseAnnee1: 0, nonUtiliseAnnee2: 0, nonUtiliseAnnee3: 0, plafondCalcule: 10000 }),
      avisIr2: makeAvis({ nonUtiliseAnnee1: 0, nonUtiliseAnnee2: 0, nonUtiliseAnnee3: 0, plafondCalcule: 6000 }),
      mutualisationConjoints: true,
    }));

    expect(result.declaration2042.case6QR).toBe(true);
    expect(result.deductionFlow163Q.declarant1.cotisationsRetenuesIr).toBe(12000);
    expect(result.deductionFlow163Q.declarant1.mutualisationRecue).toBe(2000);
    expect(result.deductionFlow163Q.declarant2?.plafondApresMutualisation).toBe(4000);
    expect(result.deductionFlow163Q.declarant2?.mutualisationCedee).toBe(2000);
    expect(result.projectionAvisSuivant.declarant2?.nonUtiliseN).toBe(4000);
  });

  it('consomme le plafond de l’année avant les reports plus anciens', () => {
    const result = calculatePerPotentiel(makeInput({
      situationFiscale: {
        situationFamiliale: 'celibataire',
        nombreParts: 1,
        isole: false,
        declarant1: makeDeclarant({ cotisationsPer163Q: 250 }),
      },
      avisIr: makeAvis({
        nonUtiliseAnnee1: 100,
        nonUtiliseAnnee2: 200,
        nonUtiliseAnnee3: 300,
        plafondCalcule: 400,
      }),
    }));

    expect(result.projectionAvisSuivant.declarant1.nonUtiliseN2).toBe(200);
    expect(result.projectionAvisSuivant.declarant1.nonUtiliseN1).toBe(300);
    expect(result.projectionAvisSuivant.declarant1.nonUtiliseN).toBe(150);
  });

  it('projette le prochain plafond sans tenir compte des pensions et revenus patrimoniaux', () => {
    const baseResult = calculatePerPotentiel(makeInput({
      situationFiscale: {
        situationFamiliale: 'celibataire',
        nombreParts: 1,
        isole: false,
        declarant1: makeDeclarant({ salaires: 50000, bic: 5000 }),
      },
      avisIr: makeAvis({ nonUtiliseAnnee1: 0, nonUtiliseAnnee2: 0, nonUtiliseAnnee3: 0, plafondCalcule: 0 }),
    }));
    const withExtraIncome = calculatePerPotentiel(makeInput({
      situationFiscale: {
        situationFamiliale: 'celibataire',
        nombreParts: 1,
        isole: false,
        declarant1: makeDeclarant({
          salaires: 50000,
          bic: 5000,
          retraites: 40000,
          fonciersNets: 12000,
          autresRevenus: 6000,
        }),
      },
      avisIr: makeAvis({ nonUtiliseAnnee1: 0, nonUtiliseAnnee2: 0, nonUtiliseAnnee3: 0, plafondCalcule: 0 }),
    }));

    expect(withExtraIncome.projectionAvisSuivant.declarant1.plafondCalculeN)
      .toBe(baseResult.projectionAvisSuivant.declarant1.plafondCalculeN);
  });

  it('utilise bien le PASS 2025 en step revenus tant que la projection N n’est pas active', () => {
    const result = calculatePerPotentiel(makeInput({
      mode: 'versement-n',
      historicalBasis: 'previous-avis-plus-n1',
      anneeRef: 2025,
      situationFiscale: {
        situationFamiliale: 'celibataire',
        nombreParts: 1,
        isole: false,
        declarant1: makeDeclarant(),
      },
      avisIr: makeAvis({ nonUtiliseAnnee1: 0, nonUtiliseAnnee2: 0, nonUtiliseAnnee3: 0, plafondCalcule: 0 }),
      passHistory: {
        2025: 47100,
        2026: 48060,
      },
    }));

    expect(result.projectionAvisSuivant.declarant1.plafondCalculeN).toBe(4710);
  });
});
