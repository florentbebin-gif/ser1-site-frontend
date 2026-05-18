import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG } from '../../../engine/succession/civil';
import { applySuccessionDonationRecallToHeirs } from '../successionDonationRecall';
import {
  buildDonationPartageFiscalLines,
  summarizeDonationPartageActs,
  validateDonationPartageAct,
} from '../successionDonationPartage';
import type { SuccessionDonationPartageAct, SuccessionEnfant } from '../successionDraft';

const DONATION_SETTINGS = {
  rappelFiscalAnnees: 15,
  donFamilial790G: {
    montant: 31865,
    conditions: 'Donateur < 80 ans, donataire majeur',
  },
} as const;

const ENFANTS: SuccessionEnfant[] = [
  { id: 'E1', prenom: 'Alice', rattachement: 'commun' },
  { id: 'E2', prenom: 'Bastien', rattachement: 'commun' },
  { id: 'E3', prenom: 'Camille', rattachement: 'commun' },
];

function makeAct(
  overrides: Partial<SuccessionDonationPartageAct> = {},
): SuccessionDonationPartageAct {
  return {
    id: 'dp-1',
    date: '2020-06',
    donateur: 'epoux1',
    avecReserveUsufruit: false,
    usufruitSuccessif: false,
    lots: [
      { id: 'lot-1', enfantId: 'E1', valeur: 200000, accepted: true },
      { id: 'lot-2', enfantId: 'E2', valeur: 200000, accepted: true },
      { id: 'lot-3', enfantId: 'E3', valeur: 200000, accepted: true },
    ],
    soultes: [],
    ...overrides,
  };
}

describe('donation-partage en acte', () => {
  it('dérive une ligne fiscale mono-donataire par enfant alloti', () => {
    const lines = buildDonationPartageFiscalLines([makeAct()]);

    expect(lines).toHaveLength(3);
    expect(lines.map((line) => line.donataire)).toEqual(['E1', 'E2', 'E3']);
    expect(lines.every((line) => line.type === 'donation_partage')).toBe(true);
    expect(lines.every((line) => line.date === '2020-06')).toBe(true);
    expect(lines.every((line) => line.donateur === 'epoux1')).toBe(true);
    expect(lines.map((line) => line.valeurDonation)).toEqual([200000, 200000, 200000]);
  });

  it('neutralise les lots inégaux par les soultes équilibrées', () => {
    const lines = buildDonationPartageFiscalLines([
      makeAct({
        lots: [
          { id: 'lot-1', enfantId: 'E1', valeur: 300000, accepted: true },
          { id: 'lot-2', enfantId: 'E2', valeur: 200000, accepted: true },
          { id: 'lot-3', enfantId: 'E3', valeur: 100000, accepted: true },
        ],
        soultes: [
          { id: 'soulte-1', payeurEnfantId: 'E1', receveurEnfantId: 'E3', montant: 100000 },
        ],
      }),
    ]);

    expect(lines.map((line) => line.valeurDonation)).toEqual([200000, 200000, 200000]);
  });

  it('traite un copartagé qui ne reçoit qu’une soulte comme donataire', () => {
    const lines = buildDonationPartageFiscalLines([
      makeAct({
        lots: [
          { id: 'lot-1', enfantId: 'E1', valeur: 400000, accepted: true },
          { id: 'lot-2', enfantId: 'E2', valeur: 0, accepted: true },
        ],
        soultes: [
          { id: 'soulte-1', payeurEnfantId: 'E1', receveurEnfantId: 'E2', montant: 200000 },
        ],
      }),
    ]);

    expect(lines.map((line) => [line.donataire, line.valeurDonation])).toEqual([
      ['E1', 200000],
      ['E2', 200000],
    ]);
  });

  it('autorise un partage inégal sans imposer une égalité artificielle des lots', () => {
    const errors = validateDonationPartageAct(
      makeAct({
        lots: [
          { id: 'lot-1', enfantId: 'E1', valeur: 100000, accepted: true },
          { id: 'lot-2', enfantId: 'E2', valeur: 200000, accepted: true },
          { id: 'lot-3', enfantId: 'E3', valeur: 300000, accepted: true },
        ],
      }),
      ENFANTS,
    );

    expect(errors).toEqual([]);
  });

  it('bloque les soultes invalides', () => {
    const errors = validateDonationPartageAct(
      makeAct({
        soultes: [
          { id: 'soulte-1', payeurEnfantId: 'E1', receveurEnfantId: 'E1', montant: 100000 },
          { id: 'soulte-2', payeurEnfantId: 'E3', receveurEnfantId: 'E2', montant: 0 },
        ],
      }),
      ENFANTS,
    );

    expect(errors).toContain('Une soulte doit être versée entre deux enfants distincts.');
    expect(errors).toContain('Le montant de chaque soulte doit être positif.');
  });

  it('ne revalorise pas la valeur actuelle avec les soultes de numéraire', () => {
    const lines = buildDonationPartageFiscalLines([
      makeAct({
        lots: [
          { id: 'lot-1', enfantId: 'E1', valeur: 300000, valeurActuelle: 450000, accepted: true },
          { id: 'lot-2', enfantId: 'E2', valeur: 100000, valeurActuelle: 180000, accepted: true },
        ],
        soultes: [
          { id: 'soulte-1', payeurEnfantId: 'E1', receveurEnfantId: 'E2', montant: 100000 },
        ],
      }),
    ]);

    expect(lines.map((line) => [line.donataire, line.valeurDonation, line.valeurActuelle])).toEqual(
      [
        ['E1', 200000, 450000],
        ['E2', 200000, 180000],
      ],
    );
  });

  it('retient la valeur gelée CCV 1078 dans le rappel fiscal malgré une valeur actuelle supérieure', () => {
    const lines = buildDonationPartageFiscalLines([
      makeAct({
        lots: [
          { id: 'lot-1', enfantId: 'E1', valeur: 200000, valeurActuelle: 300000, accepted: true },
        ],
      }),
    ]);

    const { heirs } = applySuccessionDonationRecallToHeirs({
      heirs: [{ id: 'E1', lien: 'enfant' as const, partSuccession: 0 }],
      donations: lines,
      simulatedDeceased: 'epoux1',
      donationSettings: DONATION_SETTINGS,
      dmtgSettings: DEFAULT_DMTG,
      referenceDate: new Date('2028-01-01T00:00:00Z'),
    });

    expect(lines[0].valeurDonation).toBe(200000);
    expect(lines[0].valeurActuelle).toBe(300000);
    expect(heirs[0].baseHistoriqueTaxee).toBe(200000);
  });

  it('résume les actes donation-partage avec le nombre total de soultes', () => {
    const summary = summarizeDonationPartageActs([
      makeAct({
        soultes: [
          { id: 'soulte-1', payeurEnfantId: 'E1', receveurEnfantId: 'E2', montant: 100000 },
          { id: 'soulte-2', payeurEnfantId: 'E3', receveurEnfantId: 'E2', montant: 50000 },
        ],
      }),
    ]);

    expect(summary).toBe('1 donation-partage : 3 lots, 2 soultes pour 150 000 EUR');
  });
});
