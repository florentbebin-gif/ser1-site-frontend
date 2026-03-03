import { describe, expect, it } from 'vitest';
import {
  buildSuccessionDraftPayload,
  DEFAULT_SUCCESSION_CIVIL_CONTEXT,
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
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
  });
});
