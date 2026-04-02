import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
  DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
  parseSuccessionDraftPayload,
} from '../successionDraft';
import {
  RESIDENCE_PRINCIPALE_SUBCATEGORY,
  RESIDENCE_SECONDAIRE_SUBCATEGORY,
} from '../successionSimulator.constants';

describe('successionDraft', () => {
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

  it('parse un draft v20 avec pocket et conserve le runtime detaille en pocket only', () => {
    const parsed = parseSuccessionDraftPayload(JSON.stringify({
      version: 20,
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
      assetEntries: [
        {
          id: 'asset-1',
          pocket: 'communaute',
          category: 'immobilier',
          subCategory: 'RÃ©sidence secondaire',
          amount: 90000,
        },
      ],
      assuranceVieEntries: [],
      perEntries: [],
      groupementFoncierEntries: [
        {
          id: 'gf-1',
          pocket: 'communaute',
          type: 'GFA',
          valeurTotale: 120000,
        },
      ],
      prevoyanceDecesEntries: [],
      ui: {
        chainOrder: 'epoux1',
      },
    }));

    expect(parsed?.assetEntries[0]).toMatchObject({
      pocket: 'communaute',
    });
    expect(parsed?.groupementFoncierEntries[0]).toMatchObject({
      pocket: 'communaute',
    });
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
        { id: 'asset-1', owner: 'epoux1', category: 'immobilier', subCategory: 'RÃ©sidence principale', amount: 200000 },
        { id: 'asset-2', owner: 'commun', category: 'immobilier', subCategory: 'RÃ©sidence principale', amount: 150000 },
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
