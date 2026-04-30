import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG } from '../../../engine/civil';
import { applySuccessionDonationRecallToHeirs } from '../successionDonationRecall';
import { buildSuccessionAvFiscalAnalysis } from '../successionAvFiscal';
import { buildSuccessionPerFiscalAnalysis } from '../successionPerFiscal';
import { buildSuccessionPrevoyanceFiscalAnalysis } from '../successionPrevoyanceFiscal';
import { buildSuccessionFiscalSnapshot } from '../successionFiscalContext';
import type {
  FamilyMember,
  SuccessionAssuranceVieEntry,
  SuccessionDonationEntry,
  SuccessionPerEntry,
  SuccessionPrevoyanceDecesEntry,
} from '../successionDraft';
import { makeCivil } from './fixtures';

const BASE_DEATH_DATE = new Date('2026-01-01T00:00:00Z');
const HORIZONS = [0, 5, 14, 15, 16, 30] as const;

const DONATION_SETTINGS = {
  rappelFiscalAnnees: 15,
  donFamilial790G: {
    montant: 31865,
    conditions: 'Donateur < 80 ans, donataire majeur',
  },
  donManuel: {
    abattementRenouvellement: 15,
  },
} as const;

const TIERS_BENEFICIAIRE: FamilyMember[] = [
  { id: 'tiers-1', type: 'tierce_personne', branch: 'epoux1' },
];

function addYears(date: Date, years: number): Date {
  const nextDate = new Date(date);
  nextDate.setUTCFullYear(nextDate.getUTCFullYear() + years);
  return nextDate;
}

function civilDefuntAge65() {
  return makeCivil({
    situationMatrimoniale: 'celibataire',
    regimeMatrimonial: null,
    dateNaissanceEpoux1: '1961-01-01',
  });
}

describe('matrice horizon décès succession', () => {
  it.each([
    [0, true],
    [5, true],
    [14, true],
    [15, true],
    [16, false],
    [30, false],
  ] as const)(
    'rappel fiscal donations: horizon %i ans → rappel actif = %s',
    (decesDansXAns, shouldRecallDonation) => {
      const donation: SuccessionDonationEntry = {
        id: 'don-horizon',
        type: 'rapportable',
        montant: 50000,
        valeurDonation: 50000,
        date: '2026-01',
        donateur: 'epoux1',
        donataire: 'enfant-1',
      };

      const heirs = applySuccessionDonationRecallToHeirs({
        heirs: [{ id: 'enfant-1', lien: 'enfant' as const, partSuccession: 150000 }],
        donations: [donation],
        simulatedDeceased: 'epoux1',
        donationSettings: DONATION_SETTINGS,
        dmtgSettings: DEFAULT_DMTG,
        referenceDate: addYears(BASE_DEATH_DATE, decesDansXAns),
      });

      if (shouldRecallDonation) {
        expect(heirs[0]).toMatchObject({
          baseHistoriqueTaxee: 50000,
        });
        expect(heirs[0].droitsDejaAcquittes).toBe(0);
      } else {
        expect(heirs[0].baseHistoriqueTaxee).toBeUndefined();
        expect(heirs[0].droitsDejaAcquittes).toBeUndefined();
      }
    },
  );

  it.each(HORIZONS)(
    'PER assurance: horizon %i ans applique le pivot 70 ans a la date deces simulee',
    (decesDansXAns) => {
      const snapshot = buildSuccessionFiscalSnapshot(null);
      const entry: SuccessionPerEntry = {
        id: 'per-horizon',
        typeContrat: 'standard',
        assure: 'epoux1',
        clauseBeneficiaire: 'CUSTOM:tiers-1:100',
        capitauxDeces: 100000,
      };
      const analysis = buildSuccessionPerFiscalAnalysis(
        [entry],
        civilDefuntAge65(),
        [],
        TIERS_BENEFICIAIRE,
        snapshot,
        addYears(BASE_DEATH_DATE, decesDansXAns),
      );
      const line = analysis.byAssure.epoux1.lines[0];
      const isAfter70 = decesDansXAns >= 5;

      expect(line?.capitauxAvant70).toBe(isAfter70 ? 0 : 100000);
      expect(line?.capitauxApres70).toBe(isAfter70 ? 100000 : 0);
      expect(line?.taxable990I).toBe(0);
      expect(line?.taxable757B).toBe(isAfter70 ? 69500 : 0);
    },
  );

  it.each(HORIZONS)(
    'prévoyance décès: horizon %i ans applique le pivot 70 ans sur la derniere prime',
    (decesDansXAns) => {
      const snapshot = buildSuccessionFiscalSnapshot(null);
      const entry: SuccessionPrevoyanceDecesEntry = {
        id: 'prev-horizon',
        souscripteur: 'epoux1',
        assure: 'epoux1',
        capitalDeces: 250000,
        dernierePrime: 100000,
        clauseBeneficiaire: 'CUSTOM:tiers-1:100',
      };
      const analysis = buildSuccessionPrevoyanceFiscalAnalysis(
        [entry],
        civilDefuntAge65(),
        [],
        TIERS_BENEFICIAIRE,
        snapshot,
        addYears(BASE_DEATH_DATE, decesDansXAns),
      );
      const line = analysis.byAssure.epoux1.lines[0];
      const isAfter70 = decesDansXAns >= 5;

      expect(line?.capitalTransmis).toBe(250000);
      expect(line?.capitauxAvant70).toBe(isAfter70 ? 0 : 100000);
      expect(line?.capitauxApres70).toBe(isAfter70 ? 100000 : 0);
      expect(line?.taxable990I).toBe(0);
      expect(line?.taxable757B).toBe(isAfter70 ? 69500 : 0);
    },
  );

  it.each(HORIZONS)(
    'assurance-vie: horizon %i ans ne transforme pas des primes avant 70 ans en primes apres 70 ans',
    () => {
      const snapshot = buildSuccessionFiscalSnapshot(null);
      const entry: SuccessionAssuranceVieEntry = {
        id: 'av-horizon',
        typeContrat: 'standard',
        souscripteur: 'epoux1',
        assure: 'epoux1',
        clauseBeneficiaire: 'CUSTOM:tiers-1:100',
        capitauxDeces: 100000,
        versementsApres70: 0,
        versementsAvant13101998: 0,
      };
      const analysis = buildSuccessionAvFiscalAnalysis(
        [entry],
        civilDefuntAge65(),
        [],
        TIERS_BENEFICIAIRE,
        snapshot,
      );
      const line = analysis.byAssure.epoux1.lines[0];

      expect(line?.capitauxAvant70).toBe(100000);
      expect(line?.capitauxApres70).toBe(0);
      expect(line?.taxable757B).toBe(0);
    },
  );
});
