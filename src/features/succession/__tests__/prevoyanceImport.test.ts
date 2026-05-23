import { describe, expect, it } from 'vitest';
import type { PrevoyanceContractDraft } from '@/features/prevoyance';
import { buildPrevoyanceSuccessionEntry } from '../prevoyanceImport';

describe('import prévoyance dans succession', () => {
  it('transforme un contrat décès individuel en entrée succession', () => {
    const contract: PrevoyanceContractDraft = {
      id: 'ind-1',
      name: 'Individuel',
      kind: 'individuel',
      indemnisation: 'forfaitaire',
      arret: { franchises: { accident: 0, hospitalisation: 0, maladie: 0 }, paliers: [] },
      invalidite: { paliers: [] },
      deces: {
        capital: 150_000,
        doublementAccident: false,
        doubleEffet: false,
        renteConjoint: 0,
        renteEducation: 0,
      },
      fraisPro: { enabled: false, franchiseDays: 0, amount: 0, maxDurationYears: 1 },
      cotisation: { montantAnnuel: 1_200, madelin: true },
    };

    const entry = buildPrevoyanceSuccessionEntry({
      contract,
      souscripteur: 'epoux1',
      assure: 'epoux1',
      annualBase: 70_000,
    });

    expect(entry).toMatchObject({
      id: 'prevoyance-ind-1',
      souscripteur: 'epoux1',
      assure: 'epoux1',
      capitalDeces: 150_000,
      dernierePrime: 1_200,
    });
  });
});
