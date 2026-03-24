import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG } from '../../../engine/civil';
import { applySuccessionDonationRecallToHeirs } from '../successionDonationRecall';

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

describe('applySuccessionDonationRecallToHeirs', () => {
  it('augments only the matching heir for donations within the recall window', () => {
    const heirs = applySuccessionDonationRecallToHeirs({
      heirs: [
        { id: 'E1', lien: 'enfant' as const, partSuccession: 200000 },
        { id: 'E2', lien: 'enfant' as const, partSuccession: 200000 },
      ],
      donations: [
        {
          id: 'don-1',
          type: 'rapportable',
          montant: 100000,
          valeurDonation: 150000,
          date: '2020-06',
          donateur: 'epoux1',
          donataire: 'E1',
        },
        {
          id: 'don-2',
          type: 'rapportable',
          montant: 100000,
          valeurDonation: 175000,
          date: '2000-01',
          donateur: 'epoux1',
          donataire: 'E2',
        },
      ],
      simulatedDeceased: 'epoux1',
      donationSettings: DONATION_SETTINGS,
      dmtgSettings: DEFAULT_DMTG,
      referenceDate: new Date('2026-01-01T00:00:00Z'),
    });

    expect(heirs[0]).toMatchObject({
      baseHistoriqueTaxee: 150000,
    });
    expect(heirs[0].droitsDejaAcquittes).toBeGreaterThan(0);
    expect(heirs[1].baseHistoriqueTaxee).toBeUndefined();
    expect(heirs[1].droitsDejaAcquittes).toBeUndefined();
  });
});
