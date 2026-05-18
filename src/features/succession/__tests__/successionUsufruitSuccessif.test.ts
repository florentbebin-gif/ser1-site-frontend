import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG } from '../../../engine/succession/civil';
import { applySuccessionDonationRecallToHeirs } from '../successionDonationRecall';
import { buildSuccessionUsufruitSuccessifAnalysis } from '../successionUsufruitSuccessif';
import type { SuccessionCivilContext, SuccessionDonationEntry } from '../successionDraft';

const DONATION_SETTINGS = {
  rappelFiscalAnnees: 15,
  donFamilial790G: {
    montant: 31865,
    conditions: 'Donateur < 80 ans, donataire majeur',
  },
} as const;

function makeCivil(
  situationMatrimoniale: SuccessionCivilContext['situationMatrimoniale'],
): SuccessionCivilContext {
  return {
    situationMatrimoniale,
    regimeMatrimonial: situationMatrimoniale === 'marie' ? 'communaute_legale' : null,
    pacsConvention: 'separation',
    dateNaissanceEpoux1: '1956-01-01',
    dateNaissanceEpoux2: '1959-01-01',
  };
}

function makeDonation(overrides: Partial<SuccessionDonationEntry> = {}): SuccessionDonationEntry {
  return {
    id: 'don-us-1',
    type: 'rapportable',
    montant: 200000,
    valeurDonation: 200000,
    date: '2026-01',
    donateur: 'epoux1',
    donataire: 'E1',
    avecReserveUsufruit: true,
    usufruitSuccessif: true,
    usufruitSuccessifBeneficiaire: 'epoux2',
    ...overrides,
  };
}

describe('usufruit successif sur donation', () => {
  it('valorise la nue-propriété historique et l’usufruit transmis au conjoint selon le barème 669', () => {
    const donation = makeDonation();

    const { heirs } = applySuccessionDonationRecallToHeirs({
      heirs: [{ id: 'E1', lien: 'enfant' as const, partSuccession: 0 }],
      donations: [donation],
      simulatedDeceased: 'epoux1',
      donationSettings: DONATION_SETTINGS,
      dmtgSettings: DEFAULT_DMTG,
      referenceDate: new Date('2031-01-01T00:00:00Z'),
      donateurDateNaissance: '1956-01-01',
    });
    const analysis = buildSuccessionUsufruitSuccessifAnalysis({
      civil: makeCivil('marie'),
      donations: [donation],
      simulatedDeceased: 'epoux1',
      referenceDate: new Date('2031-01-01T00:00:00Z'),
      dmtgSettings: DEFAULT_DMTG,
    });

    expect(heirs[0].baseHistoriqueTaxee).toBe(120000);
    expect(analysis.transmissions[0]).toMatchObject({
      donationId: 'don-us-1',
      beneficiaire: 'epoux2',
      valeurBase: 200000,
      tauxUsufruit: 0.3,
      valeurUsufruit: 60000,
      droits: 0,
    });
    expect(analysis.reunions1133[0]).toMatchObject({
      donationId: 'don-us-1',
      droits: 0,
    });
  });

  it('exonère aussi le partenaire PACS désigné usufruitier successif', () => {
    const analysis = buildSuccessionUsufruitSuccessifAnalysis({
      civil: makeCivil('pacse'),
      donations: [makeDonation()],
      simulatedDeceased: 'epoux1',
      referenceDate: new Date('2031-01-01T00:00:00Z'),
      dmtgSettings: DEFAULT_DMTG,
    });

    expect(analysis.transmissions[0]?.droits).toBe(0);
    expect(analysis.transmissions[0]?.valeurUsufruit).toBe(60000);
  });

  it('ne déclenche pas l’usufruit successif quand le défunt simulé n’est pas le donateur', () => {
    const analysis = buildSuccessionUsufruitSuccessifAnalysis({
      civil: makeCivil('marie'),
      donations: [makeDonation()],
      simulatedDeceased: 'epoux2',
      referenceDate: new Date('2031-01-01T00:00:00Z'),
      dmtgSettings: DEFAULT_DMTG,
    });

    expect(analysis.transmissions).toHaveLength(0);
    expect(analysis.reunions1133).toHaveLength(0);
  });

  it('ignore une donnée persistée incohérente hors mariage ou PACS', () => {
    const analysis = buildSuccessionUsufruitSuccessifAnalysis({
      civil: makeCivil('concubinage'),
      donations: [makeDonation()],
      simulatedDeceased: 'epoux1',
      referenceDate: new Date('2031-01-01T00:00:00Z'),
      dmtgSettings: DEFAULT_DMTG,
    });

    expect(analysis.transmissions).toHaveLength(0);
    expect(analysis.warnings).toContain(
      'Usufruit successif ignoré: bénéficiaire non reconnu comme conjoint ou partenaire PACS au décès simulé.',
    );
  });

  it('replie sur la valeur pleine avec warning si la date de naissance du bénéficiaire manque', () => {
    const civil = {
      ...makeCivil('marie'),
      dateNaissanceEpoux2: undefined,
    };
    const analysis = buildSuccessionUsufruitSuccessifAnalysis({
      civil,
      donations: [makeDonation()],
      simulatedDeceased: 'epoux1',
      referenceDate: new Date('2031-01-01T00:00:00Z'),
      dmtgSettings: DEFAULT_DMTG,
    });

    expect(analysis.transmissions[0]?.valeurUsufruit).toBe(200000);
    expect(analysis.transmissions[0]?.fallbackValueUsed).toBe(true);
    expect(analysis.warnings).toContain(
      'Usufruit successif: date de naissance du conjoint ou partenaire manquante, repli sur la valeur pleine.',
    );
  });
});
