import { describe, expect, it } from 'vitest';
import { formatBaseCgRetraiteRateField, normalizeBaseCgRetraiteGestionFees } from '../utils/baseCgRetraiteNormalization';

describe('baseCgRetraiteNormalization', () => {
  it('recopie le frais de gestion général vers les deux ventilations en lecture', () => {
    const normalized = normalizeBaseCgRetraiteGestionFees({
      fraisGestion: 0.00495,
      fraisGestionFondsEuro: null,
      fraisGestionUc: null,
    });

    expect(normalized.fraisGestionFondsEuro).toBe(0.00495);
    expect(normalized.fraisGestionUc).toBe(0.00495);
  });

  it('formate les décimaux de taux en pourcentage sans modifier les textes contractuels', () => {
    expect(formatBaseCgRetraiteRateField(0.0495)).toBe('4,95 %');
    expect(formatBaseCgRetraiteRateField('TMG 2 % selon millésime')).toBe('TMG 2 % selon millésime');
  });
});
