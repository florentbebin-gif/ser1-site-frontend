import { describe, expect, it } from 'vitest';
import {
  buildSuccessionDraftPayload,
  DEFAULT_SUCCESSION_CIVIL_CONTEXT,
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
  DEFAULT_SUCCESSION_ENFANTS_CONTEXT,
  DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT,
  DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
  parseSuccessionDraftPayload,
} from '../successionDraft';

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
      },
      {
        actifEpoux1: 300000,
        actifEpoux2: 200000,
        actifCommun: 150000,
        nbEnfants: 2,
      },
      {
        nbEnfantsNonCommuns: 1,
        testamentActif: true,
      },
      {
        donationsRapportables: 30000,
        donationsHorsPart: 15000,
        legsParticuliers: 10000,
        donationEntreEpouxActive: true,
        preciputMontant: 12000,
        attributionIntegrale: false,
      },
      [
        { id: 'E1', prenom: 'Alice', rattachement: 'commun' },
        { id: 'E2', prenom: 'Bastien', rattachement: 'epoux1' },
      ],
    );

    const parsed = parseSuccessionDraftPayload(JSON.stringify(payload));
    expect(parsed).not.toBeNull();
    expect(parsed?.form.actifNetSuccession).toBe(420000);
    expect(parsed?.form.heritiers).toHaveLength(2);
    expect(parsed?.civil.situationMatrimoniale).toBe('marie');
    expect(parsed?.civil.regimeMatrimonial).toBe('communaute_legale');
    expect(parsed?.liquidation.actifCommun).toBe(150000);
    expect(parsed?.devolution.nbEnfantsNonCommuns).toBe(1);
    expect(parsed?.devolution.testamentActif).toBe(true);
    expect(parsed?.patrimonial.donationsRapportables).toBe(30000);
    expect(parsed?.patrimonial.donationEntreEpouxActive).toBe(true);
    expect(parsed?.enfants).toHaveLength(2);
    expect(parsed?.enfants[0]).toEqual({ id: 'E1', prenom: 'Alice', rattachement: 'commun' });
  });

  it('retourne null sur JSON invalide', () => {
    expect(parseSuccessionDraftPayload('not-json')).toBeNull();
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
        preciputMontant: 0,
        attributionIntegrale: false,
      },
    });

    const parsed = parseSuccessionDraftPayload(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.enfants).toHaveLength(3);
    expect(parsed?.enfants.filter((e) => e.rattachement === 'commun')).toHaveLength(1);
    expect(parsed?.enfants.filter((e) => e.rattachement !== 'commun')).toHaveLength(2);
  });
});
