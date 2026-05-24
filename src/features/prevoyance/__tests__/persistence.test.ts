import { describe, expect, it } from 'vitest';
import { parsePersistedPrevoyanceState } from '../persistence';

describe('persistence Prévoyance', () => {
  it('conserve le mode de contrats et l’objectif décès persistés', () => {
    const parsed = parsePersistedPrevoyanceState(
      JSON.stringify({
        contractAggregationMode: 'cumulate',
        deathTarget: { mode: 'manual', multiple: 5, manualAmount: 420_000 },
      }),
    );

    expect(parsed).toMatchObject({
      contractAggregationMode: 'cumulate',
      deathTarget: { mode: 'manual', multiple: 5, manualAmount: 420_000 },
    });
  });

  it('convertit un ancien booléen Madelin en montant déductible', () => {
    const parsed = parsePersistedPrevoyanceState(
      JSON.stringify({
        contracts: [
          {
            id: 'legacy-1',
            name: 'Ancien contrat',
            kind: 'individuel',
            indemnisation: 'forfaitaire',
            arret: { franchises: { accident: 0, hospitalisation: 0, maladie: 0 }, paliers: [] },
            invalidite: { paliers: [] },
            deces: {
              capital: 100_000,
              doublementAccident: false,
              doubleEffet: false,
              renteConjoint: 0,
              renteEducation: 0,
            },
            fraisPro: { enabled: false, franchiseDays: 0, amount: 0, maxDurationYears: 1 },
            cotisation: { montantAnnuel: 1_500, madelin: true },
          },
        ],
      }),
    );

    expect(parsed?.contracts?.[0]).toMatchObject({
      invalidite: { indemnisation: 'forfaitaire' },
      cotisation: { montantAnnuel: 1_500, dontMadelin: 1_500 },
    });
  });

  it('plafonne la part Madelin persistée à la cotisation annuelle', () => {
    const parsed = parsePersistedPrevoyanceState(
      JSON.stringify({
        contracts: [
          {
            id: 'draft-1',
            name: 'Contrat',
            kind: 'individuel',
            indemnisation: 'forfaitaire',
            arret: { franchises: { accident: 0, hospitalisation: 0, maladie: 0 }, paliers: [] },
            invalidite: { paliers: [] },
            deces: {
              capital: 100_000,
              doublementAccident: false,
              doubleEffet: false,
              renteConjoint: 0,
              renteEducation: 0,
            },
            fraisPro: { enabled: false, franchiseDays: 0, amount: 0, maxDurationYears: 1 },
            cotisation: { montantAnnuel: 1_500, dontMadelin: 2_000 },
          },
        ],
      }),
    );

    expect(parsed?.contracts?.[0]).toMatchObject({
      cotisation: { montantAnnuel: 1_500, dontMadelin: 1_500 },
    });
  });
});
