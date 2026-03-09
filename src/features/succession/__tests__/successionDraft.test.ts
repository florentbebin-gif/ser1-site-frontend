import { describe, expect, it } from 'vitest';
import {
  buildSuccessionDraftPayload,
  DEFAULT_SUCCESSION_CIVIL_CONTEXT,
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
  DEFAULT_SUCCESSION_ENFANTS_CONTEXT,
  DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT,
  DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
  parseSuccessionDraftPayload,
  type SuccessionDevolutionContextInput,
} from '../successionDraft';

function makeDevolution(overrides: SuccessionDevolutionContextInput) {
  return {
    ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
    ...overrides,
    testamentsBySide: {
      ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.testamentsBySide,
      ...overrides.testamentsBySide,
      epoux1: {
        ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.testamentsBySide.epoux1,
        ...overrides.testamentsBySide?.epoux1,
        particularLegacies: overrides.testamentsBySide?.epoux1?.particularLegacies ?? [],
      },
      epoux2: {
        ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.testamentsBySide.epoux2,
        ...overrides.testamentsBySide?.epoux2,
        particularLegacies: overrides.testamentsBySide?.epoux2?.particularLegacies ?? [],
      },
    },
    ascendantsSurvivantsBySide: {
      ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.ascendantsSurvivantsBySide,
      ...overrides.ascendantsSurvivantsBySide,
    },
  };
}

describe('successionDraft', () => {
  it('serialise et parse un draft valide', () => {
    const payload = buildSuccessionDraftPayload(
      {
        actifNetSuccession: 420000,
        heritiers: [
          { lien: 'enfant', partSuccession: 210000 },
          { lien: 'enfant', partSuccession: 210000 },
        ],
      },
      {
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'communaute_legale',
        pacsConvention: 'separation',
        dateNaissanceEpoux1: '1975-03-10',
        dateNaissanceEpoux2: '1978-09-22',
      },
      {
        actifEpoux1: 300000,
        actifEpoux2: 200000,
        actifCommun: 150000,
        nbEnfants: 2,
      },
      makeDevolution({
        nbEnfantsNonCommuns: 1,
        choixLegalConjointSansDDV: 'usufruit',
        testamentsBySide: {
          epoux1: {
            active: true,
            dispositionType: 'legs_titre_universel',
            beneficiaryRef: 'principal:epoux2',
            quotePartPct: 60,
            particularLegacies: [],
          },
        },
        ascendantsSurvivantsBySide: { epoux1: false },
      }),
      {
        donationsRapportables: 30000,
        donationsHorsPart: 15000,
        legsParticuliers: 10000,
        donationEntreEpouxActive: true,
        donationEntreEpouxOption: 'mixte',
        preciputMontant: 12000,
        attributionIntegrale: false,
        attributionBiensCommunsPct: 50,
      },
      [
        { id: 'E1', prenom: 'Alice', rattachement: 'commun' },
        { id: 'E2', prenom: 'Bastien', rattachement: 'epoux1', deceased: true },
      ],
      [],
      [
        {
          id: 'don-1',
          type: 'rapportable',
          montant: 30000,
          date: '2020-01-10',
          donataire: 'Alice',
          donateur: 'epoux1',
        },
      ],
      [
        {
          id: 'asset-1',
          owner: 'epoux1',
          category: 'immobilier',
          subCategory: 'Résidence principale',
          amount: 250000,
          label: 'Maison familiale',
        },
      ],
      [
        {
          id: 'av-1',
          typeContrat: 'standard',
          souscripteur: 'epoux1',
          assure: 'epoux1',
          clauseBeneficiaire: 'Conjoint puis enfants',
          capitauxDeces: 80000,
          versementsApres70: 15000,
        },
      ],
    );

    const parsed = parseSuccessionDraftPayload(JSON.stringify(payload));
    expect(parsed).not.toBeNull();
    expect(parsed?.form.actifNetSuccession).toBe(420000);
    expect(parsed?.form.heritiers).toHaveLength(2);
    expect(parsed?.civil.situationMatrimoniale).toBe('marie');
    expect(parsed?.civil.regimeMatrimonial).toBe('communaute_legale');
    expect(parsed?.civil.dateNaissanceEpoux1).toBe('1975-03-10');
    expect(parsed?.civil.dateNaissanceEpoux2).toBe('1978-09-22');
    expect(parsed?.liquidation.actifCommun).toBe(150000);
    expect(parsed?.devolution.nbEnfantsNonCommuns).toBe(1);
    expect(parsed?.devolution.choixLegalConjointSansDDV).toBe('usufruit');
    expect(parsed?.devolution.testamentsBySide.epoux1.active).toBe(true);
    expect(parsed?.devolution.testamentsBySide.epoux1.dispositionType).toBe('legs_titre_universel');
    expect(parsed?.devolution.testamentsBySide.epoux1.quotePartPct).toBe(60);
    expect(parsed?.patrimonial.donationsRapportables).toBe(30000);
    expect(parsed?.patrimonial.donationEntreEpouxActive).toBe(true);
    expect(parsed?.patrimonial.donationEntreEpouxOption).toBe('mixte');
    expect(parsed?.donations).toHaveLength(1);
    expect(parsed?.donations[0].type).toBe('rapportable');
    expect(parsed?.assetEntries).toHaveLength(1);
    expect(parsed?.assetEntries[0].category).toBe('immobilier');
    expect(parsed?.assuranceVieEntries).toHaveLength(1);
    expect(parsed?.assuranceVieEntries[0].capitauxDeces).toBe(80000);
    expect(parsed?.enfants).toHaveLength(2);
    expect(parsed?.enfants[0]).toEqual({ id: 'E1', prenom: 'Alice', rattachement: 'commun' });
    expect(parsed?.enfants[1]).toEqual({ id: 'E2', prenom: 'Bastien', rattachement: 'epoux1', deceased: true });
  });

  it('retourne null sur JSON invalide', () => {
    expect(parseSuccessionDraftPayload('not-json')).toBeNull();
  });

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

  it('fallback sur un héritier par défaut et contexte civil par défaut', () => {
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

  it('migre un draft v4 en enfants typés (v5)', () => {
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

  it('définit une disposition testamentaire par défaut quand testament actif en legacy', () => {
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

  it('migre les agrégats legacy vers des donations détaillées en v9', () => {
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

  it('migre la liquidation v9 en lignes patrimoniales détaillées v10', () => {
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
    expect(parsed?.assetEntries.map((entry) => entry.owner)).toEqual([
      'epoux1',
      'epoux2',
      'commun',
    ]);
    expect(parsed?.assuranceVieEntries).toEqual([]);
  });
});
