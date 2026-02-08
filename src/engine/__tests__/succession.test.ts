/**
 * Tests unitaires - Module Succession
 */

import { describe, it, expect } from 'vitest';
import { calculateSuccession, calculatePredecesSenarios, getAbattement } from '../succession';
import { ABATTEMENT_ENFANT, DEFAULT_DMTG } from '../civil';

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

    it('calcule les droits pour neveu/nièce avec barème spécifique (55%)', () => {
      const result = calculateSuccession({
        actifNetSuccession: 100000,
        heritiers: [{ lien: 'neveu_niece', partSuccession: 100000 }],
      });

      // 100000 - 7967 abattement = 92033 imposable à 55%
      const expected = Math.round(92033 * 0.55);
      expect(result.result.totalDroits).toBe(expected);
      expect(result.result.detailHeritiers[0].abattement).toBe(7967);
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

  describe('Barèmes DMTG par catégorie', () => {
    it('applique le barème frère/sœur (35% puis 45%)', () => {
      const result = calculateSuccession({
        actifNetSuccession: 100000,
        heritiers: [{ lien: 'frere_soeur', partSuccession: 100000 }],
      });

      // 100000 - 15932 abattement = 84068 imposable
      // 0-24430 à 35% = 8550.50
      // 24430-84068 à 45% = 26837.10
      // Total ≈ 35388
      expect(result.result.totalDroits).toBeGreaterThan(0);
      expect(result.result.detailHeritiers[0].abattement).toBe(15932);
      const baseImposable = 100000 - 15932;
      const tranche1 = 24430 * 0.35;
      const tranche2 = (baseImposable - 24430) * 0.45;
      expect(result.result.totalDroits).toBe(Math.round(tranche1 + tranche2));
    });

    it('applique le barème autre/non-parent (60%)', () => {
      const result = calculateSuccession({
        actifNetSuccession: 50000,
        heritiers: [{ lien: 'autre', partSuccession: 50000 }],
      });

      // 50000 - 1594 abattement = 48406 imposable à 60%
      const expected = Math.round(48406 * 0.60);
      expect(result.result.totalDroits).toBe(expected);
      expect(result.result.detailHeritiers[0].abattement).toBe(1594);
    });

    it('accepte des dmtgSettings personnalisés', () => {
      const customDmtg = {
        ...DEFAULT_DMTG,
        ligneDirecte: {
          abattement: 200000,
          scale: [{ from: 0, to: null, rate: 10 }],
        },
      };

      const result = calculateSuccession({
        actifNetSuccession: 300000,
        heritiers: [{ lien: 'enfant', partSuccession: 300000 }],
        dmtgSettings: customDmtg,
      });

      // 300000 - 200000 custom abattement = 100000 à 10%
      expect(result.result.totalDroits).toBe(10000);
      expect(result.result.detailHeritiers[0].abattement).toBe(200000);
    });

    it('utilise les valeurs par défaut si dmtgSettings non fourni', () => {
      const result = calculateSuccession({
        actifNetSuccession: 200000,
        heritiers: [{ lien: 'enfant', partSuccession: 200000 }],
      });

      // Doit utiliser DEFAULT_DMTG.ligneDirecte
      expect(result.result.detailHeritiers[0].abattement).toBe(DEFAULT_DMTG.ligneDirecte.abattement);
      expect(result.result.totalDroits).toBeGreaterThan(0);
    });
  });
});
