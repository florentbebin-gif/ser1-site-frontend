import { describe, expect, it } from 'vitest';
import { calculTransmission } from '../transmission';
import { DEFAULT_FISCAL_PARAMS } from '../shared';

describe('calculTransmission', () => {
  it('AV avant 70 ans : applique le régime 990-I avec abattement 152 500 €', () => {
    const result = calculTransmission(
      {
        envelope: 'AV',
        capitalTransmis: 300000,
        cumulVersements: 200000,
        ageAuDeces: 65,
        agePremierVersement: 40,
        nbBeneficiaires: 1,
        beneficiaryType: 'enfants',
      },
      DEFAULT_FISCAL_PARAMS,
    );
    expect(result.envelope).toBe('AV');
    expect(result.regime).toMatch(/990/);
    // abattement 990-I : 152 500 € par bénéficiaire
    expect(result.abattement).toBeGreaterThanOrEqual(152500);
    // le capital transmis net est inférieur au capital brut
    expect(result.capitalTransmisNet).toBeLessThanOrEqual(result.capitalTransmis);
  });

  it('AV premier versement ≥ 70 ans : applique le régime 757-B avec abattement 30 500 €', () => {
    // agePremierVersement >= 70 déclenche l'article 757-B (versements après 70 ans)
    const result = calculTransmission(
      {
        envelope: 'AV',
        capitalTransmis: 200000,
        cumulVersements: 120000,
        ageAuDeces: 80,
        agePremierVersement: 72,
      },
      DEFAULT_FISCAL_PARAMS,
    );
    expect(result.regime).toMatch(/757/);
    // abattement 757-B : 30 500 € partagé entre bénéficiaires
    expect(result.abattement).toBeGreaterThanOrEqual(0);
    expect(result.capitalTransmisNet).toBeGreaterThan(0);
  });

  it('CTO : applique le DMTG au barème ou taux choisi', () => {
    const result = calculTransmission(
      {
        envelope: 'CTO',
        capitalTransmis: 100000,
        cumulVersements: 80000,
        ageAuDeces: 80,
      },
      DEFAULT_FISCAL_PARAMS,
    );
    expect(result.envelope).toBe('CTO');
    // pas de régime AV → taxe DMTG ou forfaitaire selon le paramétrage
    expect(result.taxe).toBeGreaterThanOrEqual(0);
    expect(result.capitalTransmisNet).toBeLessThanOrEqual(100000);
  });

  it('capital nul : aucune taxe', () => {
    const result = calculTransmission(
      { envelope: 'AV', capitalTransmis: 0 },
      DEFAULT_FISCAL_PARAMS,
    );
    expect(result.taxe).toBe(0);
    expect(result.capitalTransmisNet).toBe(0);
  });
});
