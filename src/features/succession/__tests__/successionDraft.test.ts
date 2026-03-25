import { describe, expect, it } from 'vitest';
import {
  buildSuccessionDraftPayload,
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
  DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
  parseSuccessionDraftPayload,
  type SuccessionDevolutionContextInput,
} from '../successionDraft';
import {
  RESIDENCE_PRINCIPALE_SUBCATEGORY,
  RESIDENCE_SECONDAIRE_SUBCATEGORY,
} from '../successionSimulator.constants';

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
        forfaitMobilierMode: 'auto',
        forfaitMobilierPct: 5,
        forfaitMobilierMontant: 0,
        abattementResidencePrincipale: false,
        decesDansXAns: 50,
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
      [
        {
          id: 'per-1',
          typeContrat: 'standard',
          assure: 'epoux2',
          capitauxDeces: 60000,
        },
      ],
      [],
      [],
      'epoux2',
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
    expect(parsed?.perEntries).toHaveLength(1);
    expect(parsed?.perEntries[0].capitauxDeces).toBe(60000);
    expect(parsed?.patrimonial.decesDansXAns).toBe(50);
    expect(parsed?.ui.chainOrder).toBe('epoux2');
    expect(parsed?.enfants).toHaveLength(2);
    expect(parsed?.enfants[0]).toEqual({ id: 'E1', prenom: 'Alice', rattachement: 'commun' });
    expect(parsed?.enfants[1]).toEqual({ id: 'E2', prenom: 'Bastien', rattachement: 'epoux1', deceased: true });
  });

  it('retourne null sur JSON invalide', () => {
    expect(parseSuccessionDraftPayload('not-json')).toBeNull();
  });

  it('default chainOrder to epoux1 on legacy drafts', () => {
    const parsed = parseSuccessionDraftPayload(JSON.stringify({
      version: 18,
      form: {
        actifNetSuccession: 100000,
        heritiers: [{ lien: 'enfant', partSuccession: 100000 }],
      },
      civil: {
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'communaute_legale',
        pacsConvention: 'separation',
      },
      liquidation: {
        actifEpoux1: 100000,
        actifEpoux2: 0,
        actifCommun: 0,
        nbEnfants: 1,
      },
      devolution: {
        nbEnfantsNonCommuns: 0,
        testamentsBySide: {
          epoux1: { active: false, dispositionType: null, beneficiaryRef: null, quotePartPct: 50, particularLegacies: [] },
          epoux2: { active: false, dispositionType: null, beneficiaryRef: null, quotePartPct: 50, particularLegacies: [] },
        },
        ascendantsSurvivantsBySide: { epoux1: false, epoux2: false },
      },
      patrimonial: {
        ...DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
      },
      enfants: [{ id: 'E1', rattachement: 'commun' }],
      familyMembers: [],
      donations: [],
      assetEntries: [],
      assuranceVieEntries: [],
      perEntries: [],
      groupementFoncierEntries: [],
      prevoyanceDecesEntries: [],
    }));

    expect(parsed?.ui.chainOrder).toBe('epoux1');
  });

  it('parse les produits specialises uniquement via SuccessionPersonParty', () => {
    const parsed = parseSuccessionDraftPayload(JSON.stringify({
      version: 19,
      form: {
        actifNetSuccession: 100000,
        heritiers: [{ lien: 'enfant', partSuccession: 100000 }],
      },
      civil: {
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'communaute_legale',
        pacsConvention: 'separation',
      },
      liquidation: {
        actifEpoux1: 100000,
        actifEpoux2: 0,
        actifCommun: 0,
        nbEnfants: 1,
      },
      devolution: {
        ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
      },
      patrimonial: {
        ...DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
      },
      enfants: [{ id: 'E1', rattachement: 'commun' }],
      familyMembers: [],
      donations: [],
      assetEntries: [],
      assuranceVieEntries: [
        {
          id: 'av-1',
          typeContrat: 'standard',
          souscripteur: 'epoux1',
          assure: 'epoux2',
          capitauxDeces: 120000,
          versementsApres70: 10000,
        },
        {
          id: 'av-invalid',
          typeContrat: 'standard',
          souscripteur: 'commun',
          assure: 'epoux1',
          capitauxDeces: 50000,
          versementsApres70: 0,
        },
      ],
      perEntries: [
        {
          id: 'per-1',
          typeContrat: 'standard',
          assure: 'epoux2',
          capitauxDeces: 80000,
        },
        {
          id: 'per-invalid',
          typeContrat: 'standard',
          assure: 'commun',
          capitauxDeces: 10000,
        },
      ],
      groupementFoncierEntries: [],
      prevoyanceDecesEntries: [
        {
          id: 'pv-1',
          souscripteur: 'epoux2',
          assure: 'epoux1',
          capitalDeces: 90000,
          dernierePrime: 2400,
        },
        {
          id: 'pv-invalid',
          souscripteur: 'commun',
          assure: 'epoux1',
          capitalDeces: 10000,
          dernierePrime: 500,
        },
      ],
      ui: {
        chainOrder: 'epoux1',
      },
    }));

    expect(parsed?.assuranceVieEntries).toEqual([
      expect.objectContaining({
        id: 'av-1',
        souscripteur: 'epoux1',
        assure: 'epoux2',
      }),
    ]);
    expect(parsed?.perEntries).toEqual([
      expect.objectContaining({
        id: 'per-1',
        assure: 'epoux2',
      }),
    ]);
    expect(parsed?.prevoyanceDecesEntries).toEqual([
      expect.objectContaining({
        id: 'pv-1',
        souscripteur: 'epoux2',
        assure: 'epoux1',
      }),
    ]);
  });

  it('normalise les residences principales multiples et reinitialise lhorizon simule en v16', () => {
    const raw = JSON.stringify({
      version: 16,
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
        actifEpoux2: 0,
        actifCommun: 150000,
        nbEnfants: 1,
      },
      devolution: {
        nbEnfantsNonCommuns: 0,
        testamentsBySide: {
          epoux1: { active: false, dispositionType: null, beneficiaryRef: null, quotePartPct: 50, particularLegacies: [] },
          epoux2: { active: false, dispositionType: null, beneficiaryRef: null, quotePartPct: 50, particularLegacies: [] },
        },
        ascendantsSurvivantsBySide: { epoux1: false, epoux2: false },
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
        forfaitMobilierMode: 'auto',
        forfaitMobilierPct: 5,
        forfaitMobilierMontant: 0,
        abattementResidencePrincipale: false,
        ageDecesManuel: 82,
      },
      enfants: [{ id: 'E1', rattachement: 'commun' }],
      familyMembers: [],
      donations: [],
      assetEntries: [
        { id: 'asset-1', owner: 'epoux1', category: 'immobilier', subCategory: 'Résidence principale', amount: 200000 },
        { id: 'asset-2', owner: 'commun', category: 'immobilier', subCategory: 'Résidence principale', amount: 150000 },
      ],
      assuranceVieEntries: [],
    });

    const parsed = parseSuccessionDraftPayload(raw);

    expect(parsed?.patrimonial.decesDansXAns).toBe(0);
    expect(parsed?.assetEntries.map((entry) => entry.subCategory)).toEqual([
      RESIDENCE_PRINCIPALE_SUBCATEGORY,
      RESIDENCE_SECONDAIRE_SUBCATEGORY,
    ]);
  });

  it('desactive par defaut le forfait mobilier lors du parse des anciens drafts', () => {
    const raw = JSON.stringify({
      version: 17,
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
        actifEpoux2: 0,
        actifCommun: 150000,
        nbEnfants: 1,
      },
      devolution: {
        nbEnfantsNonCommuns: 0,
        testamentsBySide: {
          epoux1: { active: false, dispositionType: null, beneficiaryRef: null, quotePartPct: 50, particularLegacies: [] },
          epoux2: { active: false, dispositionType: null, beneficiaryRef: null, quotePartPct: 50, particularLegacies: [] },
        },
        ascendantsSurvivantsBySide: { epoux1: false, epoux2: false },
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
        forfaitMobilierMode: 'auto',
        forfaitMobilierPct: 5,
        forfaitMobilierMontant: 0,
        abattementResidencePrincipale: false,
        decesDansXAns: 0,
      },
      enfants: [{ id: 'E1', rattachement: 'commun' }],
      familyMembers: [],
      donations: [],
      assetEntries: [],
      assuranceVieEntries: [],
    });

    const parsed = parseSuccessionDraftPayload(raw);

    expect(parsed?.patrimonial.forfaitMobilierMode).toBe('off');
  });
});
