/**
 * Tests unitaires - Module Tax
 */

import { describe, it, expect } from 'vitest';
import { calculateIR, calculateCEHR, calculateIFI } from '../tax';

describe('Tax Module', () => {
  describe('calculateIR', () => {
    it('calcule correctement l\'IR pour un célibataire', () => {
      const result = calculateIR({
        revenuNetImposable: 50000,
        nbParts: 1,
      });

      expect(result.id).toBe('ir-calculation');
      expect(result.result.impotBrut).toBeGreaterThan(0);
      expect(result.result.tmi).toBe(30);
      expect(result.warnings).toHaveLength(0);
    });

    it('calcule correctement l\'IR pour un couple avec 2 enfants', () => {
      const result = calculateIR({
        revenuNetImposable: 80000,
        nbParts: 3, // 2 parts couple + 1 part enfants
      });

      // 80000 / 3 = 26666€/part → tranche 11% (11294-28797)
      expect(result.result.revenuParPart).toBeCloseTo(80000 / 3, 0);
      expect(result.result.tmi).toBe(11);
    });

    it('retourne 0 pour un revenu sous le seuil', () => {
      const result = calculateIR({
        revenuNetImposable: 10000,
        nbParts: 1,
      });

      expect(result.result.impotBrut).toBe(0);
      expect(result.result.tmi).toBe(0);
    });

    it('calcule le TMI à 45% pour les hauts revenus', () => {
      const result = calculateIR({
        revenuNetImposable: 500000,
        nbParts: 1,
      });

      expect(result.result.tmi).toBe(45);
    });
  });

  describe('calculateCEHR', () => {
    it('retourne 0 pour un RFI sous le seuil célibataire', () => {
      const result = calculateCEHR({
        rfi: 200000,
        isCouple: false,
      });

      expect(result.result.montantCEHR).toBe(0);
      expect(result.result.isRedevable).toBe(false);
    });

    it('calcule la CEHR pour un célibataire au-dessus du seuil', () => {
      const result = calculateCEHR({
        rfi: 300000,
        isCouple: false,
      });

      // 50000 * 3% = 1500
      expect(result.result.montantCEHR).toBe(1500);
      expect(result.result.isRedevable).toBe(true);
    });

    it('utilise le barème couple pour les couples', () => {
      const result = calculateCEHR({
        rfi: 300000,
        isCouple: true,
      });

      // Sous le seuil couple (500k)
      expect(result.result.montantCEHR).toBe(0);
    });
  });

  describe('calculateIFI', () => {
    it('retourne 0 pour un patrimoine sous le seuil', () => {
      const result = calculateIFI({
        patrimoineImmobilierBrut: 1000000,
        dettesDeductibles: 0,
        valeurResidencePrincipale: 500000,
      });

      // Après abattement 30% sur RP : 1000000 - 150000 = 850000 < 1.3M
      expect(result.result.montantIFI).toBe(0);
      expect(result.result.isRedevable).toBe(false);
    });

    it('calcule l\'IFI pour un patrimoine au-dessus du seuil', () => {
      const result = calculateIFI({
        patrimoineImmobilierBrut: 2000000,
        dettesDeductibles: 0,
        valeurResidencePrincipale: 0,
      });

      expect(result.result.montantIFI).toBeGreaterThan(0);
      expect(result.result.isRedevable).toBe(true);
    });

    it('applique l\'abattement résidence principale', () => {
      const resultSansRP = calculateIFI({
        patrimoineImmobilierBrut: 2000000,
        dettesDeductibles: 0,
        valeurResidencePrincipale: 0,
      });

      const resultAvecRP = calculateIFI({
        patrimoineImmobilierBrut: 2000000,
        dettesDeductibles: 0,
        valeurResidencePrincipale: 1000000,
      });

      // L'IFI devrait être plus faible avec RP (abattement 30%)
      expect(resultAvecRP.result.montantIFI).toBeLessThan(resultSansRP.result.montantIFI);
    });

    it('ajoute un warning si proche du seuil', () => {
      const result = calculateIFI({
        patrimoineImmobilierBrut: 1250000,
        dettesDeductibles: 0,
        valeurResidencePrincipale: 0,
      });

      // 1.25M est entre 90% de 1.3M et 1.3M
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});
