import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SUCCESSION_CIVIL_CONTEXT,
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
  DEFAULT_SUCCESSION_ENFANTS_CONTEXT,
  DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT,
  DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
  parseSuccessionDraftPayload,
} from '../successionDraft';

describe('successionDraft migrations', () => {
  it('migre un draft v15 vers le testament par personne en v16', () => {
    const raw = JSON.stringify({
      version: 15,
      form: {
        actifNetSuccession: 220000,
        heritiers: [{ lien: 'enfant', partSuccession: 220000 }],
      },
      civil: {
        situationMatrimoniale: 'pacse',
        regimeMatrimonial: null,
        pacsConvention: 'separation',
      },
      liquidation: {
        actifEpoux1: 220000,
        actifEpoux2: 0,
        actifCommun: 0,
        nbEnfants: 1,
      },
      devolution: {
        nbEnfantsNonCommuns: 0,
        testamentActif: true,
        typeDispositionTestamentaire: 'legs_titre_universel',
        quotePartLegsTitreUniverselPct: 40,
        ascendantsSurvivants: true,
      },
      patrimonial: {
        donationsRapportables: 0,
        donationsHorsPart: 0,
        legsParticuliers: 0,
        donationEntreEpouxActive: false,
        donationEntreEpouxOption: 'usufruit_total',
        preciputMontant: 0,
        attributionIntegrale: false,
        attributionBiensCommunsPct: 50,
      },
      enfants: [{ id: 'E1', rattachement: 'epoux1' }],
      familyMembers: [],
      donations: [
        {
          id: 'don-legacy-legs',
          type: 'legs_particulier',
          montant: 15000,
          donateur: 'epoux1',
          donataire: 'E1',
        },
      ],
      assetEntries: [],
      assuranceVieEntries: [],
    });

    const parsed = parseSuccessionDraftPayload(raw);

    expect(parsed).not.toBeNull();
    expect(parsed?.devolution.testamentsBySide.epoux1.active).toBe(true);
    expect(parsed?.devolution.testamentsBySide.epoux1.dispositionType).toBe('legs_titre_universel');
    expect(parsed?.devolution.testamentsBySide.epoux1.quotePartPct).toBe(40);
    expect(parsed?.devolution.ascendantsSurvivantsBySide.epoux1).toBe(true);
    expect(parsed?.devolution.testamentsBySide.epoux1.particularLegacies).toEqual([
      expect.objectContaining({
        amount: 15000,
        beneficiaryRef: 'enfant:E1',
      }),
    ]);
    expect(parsed?.donations).toEqual([]);
  });

  it('parse les dates de naissance en v14 et ignore un format invalide', () => {
    const raw = JSON.stringify({
      version: 14,
      form: {
        actifNetSuccession: 100000,
        heritiers: [{ lien: 'enfant', partSuccession: 100000 }],
      },
      civil: {
        situationMatrimoniale: 'pacse',
        regimeMatrimonial: null,
        pacsConvention: 'indivision',
        dateNaissanceEpoux1: '1980-02-14',
        dateNaissanceEpoux2: '14/02/1982',
      },
    });

    const parsed = parseSuccessionDraftPayload(raw);
    expect(parsed?.civil.dateNaissanceEpoux1).toBe('1980-02-14');
    expect(parsed?.civil.dateNaissanceEpoux2).toBeUndefined();
    expect(parsed?.devolution.choixLegalConjointSansDDV).toBeNull();
  });

  it('fallback sur un heritier par defaut et contexte civil par defaut', () => {
    const raw = JSON.stringify({
      version: 1,
      form: {
        actifNetSuccession: 100000,
        heritiers: [],
      },
      civil: {},
    });

    const parsed = parseSuccessionDraftPayload(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.form.heritiers).toEqual([{ lien: 'enfant', partSuccession: 0 }]);
    expect(parsed?.civil).toEqual(DEFAULT_SUCCESSION_CIVIL_CONTEXT);
    expect(parsed?.liquidation).toEqual(DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT);
    expect(parsed?.devolution).toEqual(DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT);
    expect(parsed?.patrimonial).toEqual(DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT);
    expect(parsed?.enfants).toEqual(DEFAULT_SUCCESSION_ENFANTS_CONTEXT);
    expect(parsed?.donations).toEqual([]);
    expect(parsed?.assetEntries).toEqual([]);
    expect(parsed?.assuranceVieEntries).toEqual([]);
  });

  it('migre un draft v4 en enfants types (v5)', () => {
    const raw = JSON.stringify({
      version: 4,
      form: {
        actifNetSuccession: 250000,
        heritiers: [{ lien: 'enfant', partSuccession: 250000 }],
      },
      civil: {
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'communaute_legale',
        pacsConvention: 'separation',
      },
      liquidation: {
        actifEpoux1: 100000,
        actifEpoux2: 100000,
        actifCommun: 50000,
        nbEnfants: 3,
      },
      devolution: {
        nbEnfantsNonCommuns: 2,
        testamentActif: false,
      },
      patrimonial: {
        donationsRapportables: 0,
        donationsHorsPart: 0,
        legsParticuliers: 0,
        donationEntreEpouxActive: false,
        donationEntreEpouxOption: 'usufruit_total',
        preciputMontant: 0,
        attributionIntegrale: false,
      },
    });

    const parsed = parseSuccessionDraftPayload(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.enfants).toHaveLength(3);
    expect(parsed?.enfants.filter((e) => e.rattachement === 'commun')).toHaveLength(1);
    expect(parsed?.enfants.filter((e) => e.rattachement !== 'commun')).toHaveLength(2);
    expect(parsed?.devolution.testamentsBySide.epoux1.dispositionType).toBeNull();
    expect(parsed?.devolution.testamentsBySide.epoux1.quotePartPct).toBe(50);
    expect(parsed?.patrimonial.donationEntreEpouxOption).toBe('usufruit_total');
    expect(parsed?.donations).toHaveLength(0);
  });

  it('definit une disposition testamentaire par defaut quand testament actif en legacy', () => {
    const raw = JSON.stringify({
      version: 4,
      form: {
        actifNetSuccession: 180000,
        heritiers: [{ lien: 'enfant', partSuccession: 180000 }],
      },
      civil: {
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'communaute_legale',
        pacsConvention: 'separation',
      },
      liquidation: {
        actifEpoux1: 120000,
        actifEpoux2: 60000,
        actifCommun: 0,
        nbEnfants: 1,
      },
      devolution: {
        nbEnfantsNonCommuns: 0,
        testamentActif: true,
      },
    });

    const parsed = parseSuccessionDraftPayload(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.devolution.testamentsBySide.epoux1.active).toBe(true);
    expect(parsed?.devolution.testamentsBySide.epoux1.dispositionType).toBe('legs_universel');
  });

  it('migre les agregats legacy vers des donations detaillees en v9', () => {
    const raw = JSON.stringify({
      version: 8,
      form: {
        actifNetSuccession: 200000,
        heritiers: [{ lien: 'enfant', partSuccession: 200000 }],
      },
      civil: {
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'communaute_legale',
        pacsConvention: 'separation',
      },
      liquidation: {
        actifEpoux1: 100000,
        actifEpoux2: 100000,
        actifCommun: 0,
        nbEnfants: 1,
      },
      devolution: {
        nbEnfantsNonCommuns: 0,
        testamentActif: false,
      },
      patrimonial: {
        donationsRapportables: 12000,
        donationsHorsPart: 8000,
        legsParticuliers: 5000,
        donationEntreEpouxActive: false,
        donationEntreEpouxOption: 'usufruit_total',
        preciputMontant: 0,
        attributionIntegrale: false,
        attributionBiensCommunsPct: 50,
      },
    });

    const parsed = parseSuccessionDraftPayload(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.donations.map((entry) => entry.type)).toEqual([
      'rapportable',
      'hors_part',
    ]);
    expect(parsed?.devolution.testamentsBySide.epoux1.particularLegacies).toEqual([
      expect.objectContaining({ amount: 5000 }),
    ]);
  });

  it('migre la liquidation v9 en lignes patrimoniales detaillees v10', () => {
    const raw = JSON.stringify({
      version: 9,
      form: {
        actifNetSuccession: 300000,
        heritiers: [{ lien: 'enfant', partSuccession: 300000 }],
      },
      civil: {
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'communaute_legale',
        pacsConvention: 'separation',
      },
      liquidation: {
        actifEpoux1: 120000,
        actifEpoux2: 90000,
        actifCommun: 60000,
        nbEnfants: 2,
      },
      devolution: {
        nbEnfantsNonCommuns: 0,
        testamentActif: false,
      },
      patrimonial: {
        donationsRapportables: 0,
        donationsHorsPart: 0,
        legsParticuliers: 0,
        donationEntreEpouxActive: false,
        donationEntreEpouxOption: 'usufruit_total',
        preciputMontant: 0,
        attributionIntegrale: false,
        attributionBiensCommunsPct: 50,
      },
      donations: [],
      enfants: [],
      familyMembers: [],
    });

    const parsed = parseSuccessionDraftPayload(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.assetEntries.map((entry) => ({
      pocket: entry.pocket,
    }))).toEqual([
      { pocket: 'epoux1' },
      { pocket: 'epoux2' },
      { pocket: 'communaute' },
    ]);
    expect(parsed?.assuranceVieEntries).toEqual([]);
  });

  it("initialise la configuration societe d'acquets a son mode par defaut lors du parse d'un draft v21 sans bloc dedie", () => {
    const raw = JSON.stringify({
      version: 21,
      form: {
        actifNetSuccession: 300000,
        heritiers: [{ lien: 'enfant', partSuccession: 300000 }],
      },
      civil: {
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'separation_biens_societe_acquets',
        pacsConvention: 'separation',
      },
      liquidation: {
        actifEpoux1: 120000,
        actifEpoux2: 90000,
        actifCommun: 60000,
        nbEnfants: 2,
      },
      devolution: DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
      patrimonial: {
        ...DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
      },
      enfants: [],
      familyMembers: [],
      donations: [],
      assetEntries: [
        {
          id: 'asset-sa',
          pocket: 'societe_acquets',
          category: 'divers',
          subCategory: 'Saisie libre',
          amount: 60000,
        },
      ],
      assuranceVieEntries: [],
      perEntries: [],
      groupementFoncierEntries: [],
      prevoyanceDecesEntries: [],
      ui: {
        chainOrder: 'epoux1',
      },
    });

    const parsed = parseSuccessionDraftPayload(raw);

    expect(parsed?.patrimonial.societeAcquets.active).toBe(false);
    expect(parsed?.patrimonial.societeAcquets.liquidationMode).toBe('quotes');
    expect(parsed?.patrimonial.preciputMode).toBe('global');
    expect(parsed?.patrimonial.preciputSelections).toEqual([]);
  });
});
