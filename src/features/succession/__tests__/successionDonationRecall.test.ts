import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG } from '../../../engine/civil';
import {
  applySuccessionDonationRecallToHeirs,
  buildDonationRecallWarningMessages,
  getDonationRappelableValue,
} from '../successionDonationRecall';

const DONATION_SETTINGS = {
  rappelFiscalAnnees: 15,
  donFamilial790G: {
    montant: 31865,
    conditions: 'Donateur < 80 ans, donataire majeur',
  },
} as const;

describe('buildDonationRecallWarningMessages', () => {
  it('ne produit aucun message sans warning', () => {
    expect(buildDonationRecallWarningMessages([])).toEqual([]);
  });

  it("restitue le warning NP + 790 G sans message de date de naissance à zéro", () => {
    const messages = buildDonationRecallWarningMessages([{
      type: 'np_incompatible_790g',
      donationId: 'np-790g',
    }]);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain('790 G');
    expect(messages[0]).toContain('ignoré');
    expect(messages[0]).not.toContain('0 donation');
  });

  it('restitue séparément les deux familles de warnings', () => {
    const messages = buildDonationRecallWarningMessages([
      { type: 'np_date_naissance_manquante', donationId: 'np-fallback' },
      { type: 'np_incompatible_790g', donationId: 'np-790g' },
    ]);

    expect(messages).toHaveLength(2);
    expect(messages[0]).toContain('date de naissance');
    expect(messages[1]).toContain('790 G');
  });
});

describe('applySuccessionDonationRecallToHeirs', () => {
  it.each([
    ['montant seul', { montant: 80000 }, 80000],
    ['valeur à la donation supérieure au montant actuel', { montant: 80000, valeurDonation: 120000 }, 120000],
    ['valeur à la donation inférieure au montant actuel', { montant: 120000, valeurDonation: 80000 }, 80000],
    ['valeur à la donation présente avec montant actuel nul', { montant: 0, valeurDonation: 90000 }, 90000],
  ])('retient %s pour la base historique taxée', (_label, donationValues, expectedBase) => {
    const { heirs } = applySuccessionDonationRecallToHeirs({
      heirs: [
        { id: 'E1', lien: 'enfant' as const, partSuccession: 200000 },
      ],
      donations: [{
        id: 'don-1',
        type: 'rapportable',
        date: '2020-06',
        donateur: 'epoux1',
        donataire: 'E1',
        ...donationValues,
      }],
      simulatedDeceased: 'epoux1',
      donationSettings: DONATION_SETTINGS,
      dmtgSettings: DEFAULT_DMTG,
      referenceDate: new Date('2026-01-01T00:00:00Z'),
    });

    expect(heirs[0].baseHistoriqueTaxee).toBe(expectedBase);
  });

  it('augments only the matching heir for donations within the recall window', () => {
    const { heirs } = applySuccessionDonationRecallToHeirs({
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

describe('getDonationRappelableValue — CGI 669 (nue-propriété) et CGI 790 G', () => {
  it("NP : retient la valeur NP selon l'âge du donateur au jour de la donation", () => {
    // Donateur né 1960-01-01, donation 2020-01 → age = 60 → taux NP = 50 %
    const warnings: Parameters<typeof getDonationRappelableValue>[3] = [];
    const result = getDonationRappelableValue(
      {
        id: 'np-1',
        type: 'rapportable',
        montant: 100000,
        valeurDonation: 100000,
        date: '2020-01',
        avecReserveUsufruit: true,
      },
      DONATION_SETTINGS,
      '1960-01-01',
      warnings,
    );
    expect(result).toBe(50000);
    expect(warnings).toHaveLength(0);
  });

  it('NP sans date de naissance : repli sur valeur pleine + warning', () => {
    const warnings: Parameters<typeof getDonationRappelableValue>[3] = [];
    const result = getDonationRappelableValue(
      {
        id: 'np-fallback',
        type: 'rapportable',
        montant: 100000,
        valeurDonation: 100000,
        date: '2020-01',
        avecReserveUsufruit: true,
      },
      DONATION_SETTINGS,
      undefined,
      warnings,
    );
    expect(result).toBe(100000);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].type).toBe('np_date_naissance_manquante');
    expect(warnings[0].donationId).toBe('np-fallback');
  });

  it('790 G : donation ≤ plafond → totalement exonérée (rappelable = 0)', () => {
    const warnings: Parameters<typeof getDonationRappelableValue>[3] = [];
    const result = getDonationRappelableValue(
      {
        id: '790g-sous-plafond',
        type: 'rapportable',
        montant: 25000,
        valeurDonation: 25000,
        donSommeArgentExonere: true,
      },
      DONATION_SETTINGS,
      undefined,
      warnings,
    );
    expect(result).toBe(0);
    expect(warnings).toHaveLength(0);
  });

  it("790 G : donation > plafond → seul l'excédent est rappelable", () => {
    const warnings: Parameters<typeof getDonationRappelableValue>[3] = [];
    const result = getDonationRappelableValue(
      {
        id: '790g-sur-plafond',
        type: 'rapportable',
        montant: 50000,
        valeurDonation: 50000,
        donSommeArgentExonere: true,
      },
      DONATION_SETTINGS,
      undefined,
      warnings,
    );
    expect(result).toBe(50000 - 31865); // 18135
    expect(warnings).toHaveLength(0);
  });

  it('NP + 790 G : règle conservatrice — 790 G ignoré si avecReserveUsufruit actif, warning remonté', () => {
    // Donateur né 1960-01-01, donation 2025-01 → age = 65 → taux NP = 60 % → valeur NP = 30 000
    // Les deux toggles sont actifs (données persistées incohérentes) : NP s'applique, 790 G est ignoré.
    const warnings: Parameters<typeof getDonationRappelableValue>[3] = [];
    const result = getDonationRappelableValue(
      {
        id: 'np-790g',
        type: 'rapportable',
        montant: 50000,
        valeurDonation: 50000,
        date: '2025-01',
        avecReserveUsufruit: true,
        donSommeArgentExonere: true,
      },
      DONATION_SETTINGS,
      '1960-01-01',
      warnings,
    );
    expect(result).toBe(30000); // valeur NP à 65 ans (taux 60 %), 790 G non appliqué
    expect(warnings).toHaveLength(1);
    expect(warnings[0].type).toBe('np_incompatible_790g');
  });
});

describe('applySuccessionDonationRecallToHeirs — plafond 790 G multi-dons', () => {
  it('deux dons 790 G au même donataire : plafond appliqué une seule fois sur le total', () => {
    // 2 × 20 000 € = 40 000 € → max(0, 40 000 − 31 865) = 8 135 € rappelables
    const { heirs } = applySuccessionDonationRecallToHeirs({
      heirs: [{ id: 'E1', lien: 'enfant' as const, partSuccession: 200000 }],
      donations: [
        {
          id: '790g-a',
          type: 'rapportable',
          montant: 20000,
          valeurDonation: 20000,
          date: '2022-01',
          donateur: 'epoux1',
          donataire: 'E1',
          donSommeArgentExonere: true,
        },
        {
          id: '790g-b',
          type: 'rapportable',
          montant: 20000,
          valeurDonation: 20000,
          date: '2023-01',
          donateur: 'epoux1',
          donataire: 'E1',
          donSommeArgentExonere: true,
        },
      ],
      simulatedDeceased: 'epoux1',
      donationSettings: DONATION_SETTINGS,
      dmtgSettings: DEFAULT_DMTG,
      referenceDate: new Date('2026-01-01T00:00:00Z'),
    });

    expect(heirs[0].baseHistoriqueTaxee).toBe(40000 - 31865); // 8 135
  });

  it('deux donataires différents : plafond 790 G séparé par donataire', () => {
    // Chacun reçoit 25 000 € 790 G → chacun totalement exonéré (25 000 < 31 865)
    const { heirs } = applySuccessionDonationRecallToHeirs({
      heirs: [
        { id: 'E1', lien: 'enfant' as const, partSuccession: 100000 },
        { id: 'E2', lien: 'enfant' as const, partSuccession: 100000 },
      ],
      donations: [
        {
          id: '790g-e1',
          type: 'rapportable',
          montant: 25000,
          valeurDonation: 25000,
          date: '2022-01',
          donateur: 'epoux1',
          donataire: 'E1',
          donSommeArgentExonere: true,
        },
        {
          id: '790g-e2',
          type: 'rapportable',
          montant: 25000,
          valeurDonation: 25000,
          date: '2022-01',
          donateur: 'epoux1',
          donataire: 'E2',
          donSommeArgentExonere: true,
        },
      ],
      simulatedDeceased: 'epoux1',
      donationSettings: DONATION_SETTINGS,
      dmtgSettings: DEFAULT_DMTG,
      referenceDate: new Date('2026-01-01T00:00:00Z'),
    });

    expect(heirs[0].baseHistoriqueTaxee).toBeUndefined(); // exonéré
    expect(heirs[1].baseHistoriqueTaxee).toBeUndefined(); // exonéré
  });

  it('NP + 790 G : données persistées avec les deux toggles → warning + 790 G ignoré dans aggregation', () => {
    // Données incohérentes : avecReserveUsufruit && donSommeArgentExonere
    // Règle conservatrice : traité comme NP seul, 790 G ignoré
    const { heirs, warnings } = applySuccessionDonationRecallToHeirs({
      heirs: [{ id: 'E1', lien: 'enfant' as const, partSuccession: 200000 }],
      donations: [{
        id: 'np-790g-conflict',
        type: 'rapportable',
        montant: 150000,
        valeurDonation: 150000,
        date: '2020-01',
        donateur: 'epoux1',
        donataire: 'E1',
        avecReserveUsufruit: true,
        donSommeArgentExonere: true,
      }],
      simulatedDeceased: 'epoux1',
      donationSettings: DONATION_SETTINGS,
      dmtgSettings: DEFAULT_DMTG,
      referenceDate: new Date('2026-01-01T00:00:00Z'),
      donateurDateNaissance: '1970-01-01', // age 50 en 2020 → taux NP = 40 %
    });

    // NP seul appliqué : 150 000 × 0.4 = 60 000 (taux NP à 50 ans)
    expect(heirs[0].baseHistoriqueTaxee).toBe(60000);
    expect(warnings.some((w) => w.type === 'np_incompatible_790g')).toBe(true);
  });
});

describe('applySuccessionDonationRecallToHeirs — donation_partage (CCV 1078)', () => {
  it('intègre une donation_partage dans le rappel fiscal (type !== legs_particulier)', () => {
    // Donation 150k > abattement enfant 100k → droitsDejaAcquittes > 0
    const { heirs, warnings } = applySuccessionDonationRecallToHeirs({
      heirs: [{ id: 'E1', lien: 'enfant' as const, partSuccession: 50000 }],
      donations: [{
        id: 'dp-1',
        type: 'donation_partage',
        montant: 150000,
        valeurDonation: 150000,
        date: '2020-06',
        donateur: 'epoux1',
        donataire: 'E1',
      }],
      simulatedDeceased: 'epoux1',
      donationSettings: DONATION_SETTINGS,
      dmtgSettings: DEFAULT_DMTG,
      referenceDate: new Date('2026-01-01T00:00:00Z'),
    });

    expect(heirs[0].baseHistoriqueTaxee).toBe(150000);
    expect(heirs[0].droitsDejaAcquittes).toBeGreaterThan(0);
    expect(warnings).toHaveLength(0);
  });

  it('790 G via applySuccessionDonationRecallToHeirs : baseHistoriqueTaxee undefined si donation totalement exonérée', () => {
    const { heirs } = applySuccessionDonationRecallToHeirs({
      heirs: [{ id: 'E1', lien: 'enfant' as const, partSuccession: 200000 }],
      donations: [{
        id: '790g-full',
        type: 'rapportable',
        montant: 25000,
        valeurDonation: 25000,
        date: '2020-06',
        donateur: 'epoux1',
        donataire: 'E1',
        donSommeArgentExonere: true,
      }],
      simulatedDeceased: 'epoux1',
      donationSettings: DONATION_SETTINGS,
      dmtgSettings: DEFAULT_DMTG,
      referenceDate: new Date('2026-01-01T00:00:00Z'),
    });

    expect(heirs[0].baseHistoriqueTaxee).toBeUndefined();
    expect(heirs[0].droitsDejaAcquittes).toBeUndefined();
  });
});
