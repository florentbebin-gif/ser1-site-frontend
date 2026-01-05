/**
 * Tests unitaires - Module Succession
 */

import { describe, it, expect } from 'vitest';
import { calculateSuccession, calculatePredecesSenarios, getAbattement } from '../succession';
import { ABATTEMENT_ENFANT } from '../civil';

describe('Succession Module', () => {
  describe('getAbattement', () => {
    it('retourne Infinity pour le conjoint (exonéré)', () => {
      expect(getAbattement('conjoint')).toBe(Infinity);
    });

    it('retourne 100000 pour un enfant', () => {
      expect(getAbattement('enfant')).toBe(ABATTEMENT_ENFANT);
    });

    it('retourne 15932 pour frère/sœur', () => {
      expect(getAbattement('frere_soeur')).toBe(15932);
    });
  });

  describe('calculateSuccession', () => {
    it('exonère totalement le conjoint', () => {
      const result = calculateSuccession({
        actifNetSuccession: 500000,
        heritiers: [{ lien: 'conjoint', partSuccession: 500000 }],
      });

      expect(result.result.totalDroits).toBe(0);
      expect(result.result.detailHeritiers[0].droits).toBe(0);
    });

    it('calcule les droits pour un enfant unique', () => {
      const result = calculateSuccession({
        actifNetSuccession: 200000,
        heritiers: [{ lien: 'enfant', partSuccession: 200000 }],
      });

      // 200000 - 100000 abattement = 100000 imposable
      // Barème DMTG : environ 18194€
      expect(result.result.totalDroits).toBeGreaterThan(0);
      expect(result.result.detailHeritiers[0].abattement).toBe(ABATTEMENT_ENFANT);
    });

    it('calcule les droits pour deux enfants', () => {
      const result = calculateSuccession({
        actifNetSuccession: 400000,
        heritiers: [
          { lien: 'enfant', partSuccession: 200000 },
          { lien: 'enfant', partSuccession: 200000 },
        ],
      });

      expect(result.result.detailHeritiers).toHaveLength(2);
      // Chaque enfant a son propre abattement
      expect(result.result.detailHeritiers[0].abattement).toBe(ABATTEMENT_ENFANT);
      expect(result.result.detailHeritiers[1].abattement).toBe(ABATTEMENT_ENFANT);
    });

    it('retourne 0 si part inférieure à l\'abattement', () => {
      const result = calculateSuccession({
        actifNetSuccession: 50000,
        heritiers: [{ lien: 'enfant', partSuccession: 50000 }],
      });

      expect(result.result.totalDroits).toBe(0);
      expect(result.result.detailHeritiers[0].baseImposable).toBe(0);
    });

    it('ajoute un warning pour les liens non ligne directe', () => {
      const result = calculateSuccession({
        actifNetSuccession: 100000,
        heritiers: [{ lien: 'neveu_niece', partSuccession: 100000 }],
      });

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].code).toContain('BAREME_SIMPLIFIE');
    });
  });

  describe('calculatePredecesSenarios', () => {
    it('calcule les scénarios pour un couple en communauté légale', () => {
      const result = calculatePredecesSenarios({
        actifMr: 200000,
        actifMme: 100000,
        actifCommun: 400000,
        nbEnfants: 2,
        regime: 'communaute_legale',
      });

      expect(result.id).toBe('predeces-scenarios');
      
      // Mr décède : 200000 + 200000 (moitié commun) = 400000
      expect(result.result.scenarioMrDecede.actifTransmis).toBe(400000);
      
      // Mme décède : 100000 + 200000 (moitié commun) = 300000
      expect(result.result.scenarioMmeDecede.actifTransmis).toBe(300000);
    });

    it('calcule les scénarios pour séparation de biens', () => {
      const result = calculatePredecesSenarios({
        actifMr: 300000,
        actifMme: 200000,
        actifCommun: 0,
        nbEnfants: 2,
        regime: 'separation_biens',
      });

      expect(result.result.scenarioMrDecede.actifTransmis).toBe(300000);
      expect(result.result.scenarioMmeDecede.actifTransmis).toBe(200000);
    });

    it('ajoute un warning pour communauté universelle', () => {
      const result = calculatePredecesSenarios({
        actifMr: 500000,
        actifMme: 500000,
        actifCommun: 0,
        nbEnfants: 2,
        regime: 'communaute_universelle',
      });

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].code).toContain('REGIME_CU');
    });

    it('gère le cas sans enfant', () => {
      const result = calculatePredecesSenarios({
        actifMr: 200000,
        actifMme: 200000,
        actifCommun: 0,
        nbEnfants: 0,
        regime: 'communaute_legale',
      });

      // Sans enfant, pas de droits calculés (transmission au conjoint exonérée)
      expect(result.result.scenarioMrDecede.droitsSuccession).toBe(0);
    });
  });
});
