import { describe, expect, it } from 'vitest';
import {
  buildSuccessionDraftPayload,
  DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
  parseSuccessionDraftPayload,
} from '../successionDraft';
import { makeDevolution } from './fixtures';

describe('successionDraft roundtrip', () => {
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
        ...DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
        donationsRapportables: 30000,
        donationsHorsPart: 15000,
        legsParticuliers: 10000,
        donationEntreEpouxActive: true,
        donationEntreEpouxOption: 'mixte',
        stipulationContraireCU: true,
        societeAcquets: {
          active: true,
          liquidationMode: 'quotes',
          quoteEpoux1Pct: 50,
          quoteEpoux2Pct: 50,
          attributionSurvivantPct: 0,
        },
        participationAcquets: {
          active: true,
          useCurrentAssetsAsFinalPatrimony: false,
          patrimoineOriginaireEpoux1: 90000,
          patrimoineOriginaireEpoux2: 50000,
          patrimoineFinalEpoux1: 250000,
          patrimoineFinalEpoux2: 160000,
          quoteEpoux1Pct: 40,
          quoteEpoux2Pct: 60,
        },
        preciputMode: 'cible',
        preciputSelections: [
          {
            id: 'prec-1',
            sourceType: 'asset',
            sourceId: 'asset-1',
            labelSnapshot: 'Maison familiale',
            pocket: 'communaute',
            amount: 12000,
            enabled: true,
          },
        ],
        interMassClaims: [
          {
            id: 'claim-1',
            kind: 'recompense',
            fromPocket: 'communaute',
            toPocket: 'epoux1',
            amount: 15000,
            enabled: true,
            label: 'Recompense communaute / epoux 1',
          },
        ],
        preciputMontant: 12000,
        forfaitMobilierMode: 'auto',
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
          pocket: 'epoux1',
          category: 'immobilier',
          subCategory: 'RÃ©sidence principale',
          amount: 250000,
          label: 'Maison familiale',
          legalNature: 'propre_par_nature',
          origin: 'donation_succession',
          meubleImmeubleLegal: 'immeuble',
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
          versementsAvant13101998: 12000,
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

    expect(payload.version).toBe(27);
    expect(payload.assetEntries[0].pocket).toBe('epoux1');
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
    expect(parsed?.patrimonial.stipulationContraireCU).toBe(true);
    expect(parsed?.patrimonial.societeAcquets).toMatchObject({
      active: true,
      liquidationMode: 'quotes',
    });
    expect(parsed?.patrimonial.participationAcquets).toMatchObject({
      active: true,
      useCurrentAssetsAsFinalPatrimony: false,
      patrimoineOriginaireEpoux1: 90000,
      patrimoineOriginaireEpoux2: 50000,
      patrimoineFinalEpoux1: 250000,
      patrimoineFinalEpoux2: 160000,
      quoteEpoux1Pct: 40,
      quoteEpoux2Pct: 60,
    });
    expect(parsed?.patrimonial.preciputMode).toBe('cible');
    expect(parsed?.patrimonial.preciputSelections).toEqual([
      expect.objectContaining({
        id: 'prec-1',
        sourceType: 'asset',
        sourceId: 'asset-1',
        pocket: 'communaute',
        amount: 12000,
        enabled: true,
      }),
    ]);
    expect(parsed?.patrimonial.interMassClaims).toEqual([
      expect.objectContaining({
        id: 'claim-1',
        kind: 'recompense',
        fromPocket: 'communaute',
        toPocket: 'epoux1',
        amount: 15000,
        enabled: true,
      }),
    ]);
    expect(parsed?.donations).toHaveLength(1);
    expect(parsed?.donations[0].type).toBe('rapportable');
    expect(parsed?.assetEntries).toHaveLength(1);
    expect(parsed?.assetEntries[0].category).toBe('immobilier');
    expect(parsed?.assetEntries[0].pocket).toBe('epoux1');
    expect(parsed?.assetEntries[0].legalNature).toBe('propre_par_nature');
    expect(parsed?.assetEntries[0].origin).toBe('donation_succession');
    expect(parsed?.assetEntries[0].meubleImmeubleLegal).toBe('immeuble');
    expect(parsed?.assuranceVieEntries).toHaveLength(1);
    expect(parsed?.assuranceVieEntries[0].capitauxDeces).toBe(80000);
    expect(parsed?.assuranceVieEntries[0].versementsAvant13101998).toBe(12000);
    expect(parsed?.perEntries).toHaveLength(1);
    expect(parsed?.perEntries[0].capitauxDeces).toBe(60000);
    expect(parsed?.patrimonial.decesDansXAns).toBe(50);
    expect(parsed?.ui.chainOrder).toBe('epoux2');
    expect(parsed?.enfants).toHaveLength(2);
    expect(parsed?.enfants[0]).toEqual({ id: 'E1', prenom: 'Alice', rattachement: 'commun' });
    expect(parsed?.enfants[1]).toEqual({ id: 'E2', prenom: 'Bastien', rattachement: 'epoux1', deceased: true });
  });
});
