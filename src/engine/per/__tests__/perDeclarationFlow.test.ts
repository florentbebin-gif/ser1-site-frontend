import { describe, expect, it } from 'vitest';
import { computeDeclaration2042 } from '../perDeclarationFlow';
import type { DeclarantRevenus, PlafondMadelinDetail } from '../types';

function makeDeclarant(overrides: Partial<DeclarantRevenus> = {}): DeclarantRevenus {
  return {
    statutTns: true,
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

function makeMadelin(overrides: Partial<PlafondMadelinDetail> = {}): PlafondMadelinDetail {
  return {
    assietteVersement: 0,
    assietteReport: 0,
    enveloppe15Versement: 0,
    enveloppe15Report: 0,
    enveloppe10: 0,
    cotisationsVersees: 0,
    utilisation15Versement: { madelinRetraite: 0, per154bis: 0, total: 0 },
    depassement15Versement: { madelinRetraite: 0, per154bis: 0, total: 0 },
    utilisation15Report: { madelinRetraite: 0, per154bis: 0, total: 0 },
    depassement15Report: { madelinRetraite: 0, per154bis: 0, total: 0 },
    consommation10: { art83: 0, perco: 0, madelinRetraite: 0, per154bis: 0, total: 0 },
    reste15Versement: 0,
    reste15Report: 0,
    reste10: 0,
    disponibleRestant: 0,
    surplusAReintegrer: 0,
    depassement: false,
    ...overrides,
  };
}

describe('computeDeclaration2042', () => {
  it('laisse 6OS à zéro quand l’enveloppe 15 % report absorbe Madelin et PER 154 bis', () => {
    const result = computeDeclaration2042({
      declarant1: makeDeclarant({
        cotisationsMadelinRetraite: 3000,
        cotisationsMadelin154bis: 2000,
      }),
      madelin1: makeMadelin({
        enveloppe15Report: 10000,
        depassement15Report: { madelinRetraite: 0, per154bis: 0, total: 0 },
      }),
      mutualisationConjoints: false,
    });

    expect(result.case6OS).toBe(0);
    expect(result.case6QS).toBe(0);
  });

  it('alimente 6OS avec le dépassement combiné quand Madelin ne dépasse pas seul l’enveloppe de report', () => {
    const result = computeDeclaration2042({
      declarant1: makeDeclarant({
        cotisationsMadelinRetraite: 8000,
        cotisationsMadelin154bis: 6000,
      }),
      madelin1: makeMadelin({
        enveloppe15Report: 10000,
        depassement15Report: { madelinRetraite: 0, per154bis: 4000, total: 4000 },
      }),
      mutualisationConjoints: false,
    });

    expect(result.case6OS).toBe(4000);
    expect(result.case6QS).toBe(0);
  });

  it('bascule tout le PER 154 bis en 6OS quand Madelin dépasse déjà seul l’enveloppe de report', () => {
    const result = computeDeclaration2042({
      declarant1: makeDeclarant({
        cotisationsArt83: 1000,
        abondementPerco: 500,
        cotisationsMadelinRetraite: 12000,
        cotisationsMadelin154bis: 6000,
      }),
      madelin1: makeMadelin({
        enveloppe15Report: 10000,
        depassement15Report: { madelinRetraite: 2000, per154bis: 6000, total: 8000 },
      }),
      mutualisationConjoints: false,
    });

    expect(result.case6OS).toBe(6000);
    expect(result.case6QS).toBe(3500);
  });
});
