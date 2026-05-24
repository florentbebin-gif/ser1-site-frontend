import { describe, expect, it } from 'vitest';
import { PREVOYANCE_STORAGE_KEY, type PrevoyanceContractDraft } from '@/features/prevoyance';
import {
  buildPrevoyanceSuccessionEntry,
  importPrevoyanceEntriesFromStorage,
  isPrevoyanceImportedEntry,
} from '../prevoyanceImport';
import type { SuccessionPrevoyanceDecesEntry } from '../successionDraft.types';

describe('import prévoyance dans succession', () => {
  const individuelContract: PrevoyanceContractDraft = {
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
    fraisPro: { franchiseDays: 0, amount: 0, maxDurationYears: 1 },
    cotisation: { montantAnnuel: 1_200, dontMadelin: 1_200 },
  };

  const collectifContract: PrevoyanceContractDraft = {
    id: 'col-1',
    name: 'Collectif',
    kind: 'collectif',
    acteJuridique: 'due',
    assiette: 'TA-TB',
    arret: { salairePct: 80 },
    invalidite: { paliers: [{ fromRate: 66, salairePct: 90 }] },
    deces: {
      salairePct: 300,
      doublementAccident: false,
      doubleEffet: false,
      renteConjointPct: 0,
      renteEducationPct: 0,
    },
    cotisation: {
      tauxPctSalaire: 1.2,
      repartition: { employeur: 60, salarie: 40 },
    },
  };

  it('transforme un contrat décès individuel en entrée succession', () => {
    const entry = buildPrevoyanceSuccessionEntry({
      contract: individuelContract,
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

  it('transforme un contrat collectif salarié depuis le salaire brut du draft', () => {
    const storage = {
      getItem: (key: string) =>
        key === PREVOYANCE_STORAGE_KEY
          ? JSON.stringify({
              situation: { salaireBrutAnnuel: 50_000 },
              contracts: [collectifContract],
            })
          : null,
    };

    const result = importPrevoyanceEntriesFromStorage({
      existingEntries: [],
      souscripteur: 'epoux1',
      assure: 'epoux1',
      storage,
    });

    expect(result.importedCount).toBe(1);
    expect(result.entries[0]).toMatchObject({
      id: 'prevoyance-col-1',
      capitalDeces: 150_000,
      dernierePrime: 0,
    });
  });

  it('remplace les imports Prévoyance existants sans toucher aux entrées manuelles', () => {
    const manualEntry: SuccessionPrevoyanceDecesEntry = {
      id: 'manual-1',
      souscripteur: 'epoux2',
      assure: 'epoux2',
      capitalDeces: 25_000,
      dernierePrime: 0,
      clauseBeneficiaire: 'Clause libre',
    };
    const previousImportedEntry: SuccessionPrevoyanceDecesEntry = {
      id: 'prevoyance-ancien',
      souscripteur: 'epoux1',
      assure: 'epoux1',
      capitalDeces: 10_000,
      dernierePrime: 0,
    };
    const storage = {
      getItem: () =>
        JSON.stringify({
          situation: { revenuImposable: 80_000 },
          contracts: [individuelContract],
        }),
    };

    const result = importPrevoyanceEntriesFromStorage({
      existingEntries: [manualEntry, previousImportedEntry],
      souscripteur: 'epoux1',
      assure: 'epoux1',
      storage,
    });

    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]).toBe(manualEntry);
    expect(result.entries.some((entry) => entry.id === previousImportedEntry.id)).toBe(false);
    expect(result.entries[1]).toMatchObject({ id: 'prevoyance-ind-1', capitalDeces: 150_000 });
  });

  it('ignore les contrats sans capital décès', () => {
    const contractSansCapital: PrevoyanceContractDraft = {
      ...individuelContract,
      id: 'sans-capital',
      deces: { ...individuelContract.deces, capital: 0 },
    };
    const storage = {
      getItem: () =>
        JSON.stringify({
          situation: { revenuImposable: 80_000 },
          contracts: [contractSansCapital],
        }),
    };

    const result = importPrevoyanceEntriesFromStorage({
      existingEntries: [],
      souscripteur: 'epoux1',
      assure: 'epoux1',
      storage,
    });

    expect(result.importedCount).toBe(0);
    expect(result.entries).toEqual([]);
  });

  it('identifie les entrées importées depuis Prévoyance', () => {
    expect(
      isPrevoyanceImportedEntry({
        id: 'prevoyance-abc',
        souscripteur: 'epoux1',
        assure: 'epoux1',
        capitalDeces: 1,
        dernierePrime: 0,
      }),
    ).toBe(true);
  });
});
