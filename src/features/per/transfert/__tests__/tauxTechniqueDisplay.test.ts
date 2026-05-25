import { describe, expect, it } from 'vitest';
import { formatBaseCgRetraiteRateField } from '@/data/base-cg-retraite';

describe('affichage du taux technique PER Transfert', () => {
  it('affiche 0.02 en pourcentage utilisateur', () => {
    expect(formatBaseCgRetraiteRateField(0.02)).toBe('2 %');
  });

  it('affiche 0.045 en pourcentage utilisateur', () => {
    expect(formatBaseCgRetraiteRateField(0.045)).toBe('4,5 %');
  });
});
