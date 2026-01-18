/**
 * Tests unitaires - Capital Décès Calculator
 * 
 * Valide la règle métier pour le calcul des capitaux décès
 */

import { describe, it, expect } from 'vitest';
import { 
  computeCapitalDecesPeriod, 
  computeCapitalDecesSchedule,
  aggregateCapitalDecesGlobal,
  computeGlobalCapitalDecesSchedule,
  type LoanParams,
  type ScheduleRow 
} from '../capitalDeces';

describe('Capital Décès Calculator', () => {
  // Mock data pour les tests
  const mockLoanParams: LoanParams = {
    capital: 100000,
    tauxAssur: 0.30,
    assurMode: 'CRD'
  };

  const mockSchedule: ScheduleRow[] = [
    { mois: 1, interet: 250, assurance: 25, amort: 300, mensu: 550, mensuTotal: 575, crd: 99700, assuranceDeces: 0 },
    { mois: 2, interet: 249, assurance: 25, amort: 301, mensu: 550, mensuTotal: 575, crd: 99399, assuranceDeces: 0 },
    { mois: 3, interet: 248, assurance: 25, amort: 302, mensu: 550, mensuTotal: 575, crd: 99097, assuranceDeces: 0 }
  ];

  describe('computeCapitalDecesPeriod', () => {
    it('taux = 0 → capital décès = 0', () => {
      const params = { ...mockLoanParams, tauxAssur: 0 };
      expect(computeCapitalDecesPeriod(params, 100000)).toBe(0);
    });

    it('taux < 0 → capital décès = 0', () => {
      const params = { ...mockLoanParams, tauxAssur: -0.1 };
      expect(computeCapitalDecesPeriod(params, 100000)).toBe(0);
    });

    it('mode CI + taux > 0 → capital décès = capital initial', () => {
      const params = { ...mockLoanParams, assurMode: 'CI' as const };
      expect(computeCapitalDecesPeriod(params, 95000)).toBe(100000);
      expect(computeCapitalDecesPeriod(params, 50000)).toBe(100000);
      expect(computeCapitalDecesPeriod(params, 1000)).toBe(100000);
    });

    it('mode CRD + taux > 0 → capital décès = CRD début', () => {
      const params = { ...mockLoanParams, assurMode: 'CRD' as const };
      expect(computeCapitalDecesPeriod(params, 100000)).toBe(100000);
      expect(computeCapitalDecesPeriod(params, 95000)).toBe(95000);
      expect(computeCapitalDecesPeriod(params, 1000)).toBe(1000);
    });
  });

  describe('computeCapitalDecesSchedule', () => {
    it('calcule correctement les capitaux décès pour tout échéancier', () => {
      const result = computeCapitalDecesSchedule(mockLoanParams, mockSchedule);
      
      // Vérifie que la structure est préservée
      expect(result).toHaveLength(3);
      expect(result[0].mois).toBe(1);
      expect(result[1].mois).toBe(2);
      expect(result[2].mois).toBe(3);
      
      // Vérifie les capitaux décès en mode CRD
      expect(result[0].assuranceDeces).toBe(100000); // CRD début période 1 = 99700 + 300
      expect(result[1].assuranceDeces).toBe(99700);  // CRD début période 2 = 99399 + 301
      expect(result[2].assuranceDeces).toBe(99399);  // CRD début période 3 = 99097 + 302
    });

    it('mode CI → capital décès constant', () => {
      const params = { ...mockLoanParams, assurMode: 'CI' as const };
      const result = computeCapitalDecesSchedule(params, mockSchedule);
      
      expect(result[0].assuranceDeces).toBe(100000);
      expect(result[1].assuranceDeces).toBe(100000);
      expect(result[2].assuranceDeces).toBe(100000);
    });

    it('taux = 0 → tous les capitaux décès = 0', () => {
      const params = { ...mockLoanParams, tauxAssur: 0 };
      const result = computeCapitalDecesSchedule(params, mockSchedule);
      
      expect(result[0].assuranceDeces).toBe(0);
      expect(result[1].assuranceDeces).toBe(0);
      expect(result[2].assuranceDeces).toBe(0);
    });
  });

  describe('aggregateCapitalDecesGlobal', () => {
    it('agrège correctement plusieurs prêts', () => {
      const schedule1: ScheduleRow[] = [
        { mois: 1, interet: 100, assurance: 10, amort: 200, mensu: 300, mensuTotal: 310, crd: 800, assuranceDeces: 1000 },
        { mois: 2, interet: 80, assurance: 10, amort: 220, mensu: 300, mensuTotal: 310, crd: 580, assuranceDeces: 800 }
      ];

      const schedule2: ScheduleRow[] = [
        { mois: 1, interet: 50, assurance: 5, amort: 100, mensu: 150, mensuTotal: 155, crd: 400, assuranceDeces: 500 },
        { mois: 2, interet: 40, assurance: 5, amort: 110, mensu: 150, mensuTotal: 155, crd: 290, assuranceDeces: 400 }
      ];

      const result = aggregateCapitalDecesGlobal([schedule1, schedule2]);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toBe(1500); // 1000 + 500
      expect(result[1]).toBe(1200); // 800 + 400
    });

    it('gère les prêts de durées différentes', () => {
      const schedule1: ScheduleRow[] = [
        { mois: 1, interet: 100, assurance: 10, amort: 200, mensu: 300, mensuTotal: 310, crd: 800, assuranceDeces: 1000 },
        { mois: 2, interet: 80, assurance: 10, amort: 220, mensu: 300, mensuTotal: 310, crd: 580, assuranceDeces: 800 }
      ];

      const schedule2: ScheduleRow[] = [
        { mois: 1, interet: 50, assurance: 5, amort: 100, mensu: 150, mensuTotal: 155, crd: 400, assuranceDeces: 500 }
        // Prêt 2 s'arrête après 1 mois
      ];

      const result = aggregateCapitalDecesGlobal([schedule1, schedule2]);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toBe(1500); // 1000 + 500
      expect(result[1]).toBe(800);  // 800 + 0 (prêt 2 terminé)
    });
  });

  describe('computeGlobalCapitalDecesSchedule', () => {
    it('calcule l échéancier global complet', () => {
      const loan1Params: LoanParams = { capital: 100000, tauxAssur: 0.30, assurMode: 'CRD' };
      const loan2Params: LoanParams = { capital: 50000, tauxAssur: 0.25, assurMode: 'CI' };
      
      const schedule1: ScheduleRow[] = [
        { mois: 1, interet: 250, assurance: 25, amort: 300, mensu: 550, mensuTotal: 575, crd: 99700, assuranceDeces: 0 },
        { mois: 2, interet: 249, assurance: 25, amort: 301, mensu: 550, mensuTotal: 575, crd: 99399, assuranceDeces: 0 }
      ];

      const schedule2: ScheduleRow[] = [
        { mois: 1, interet: 125, assurance: 10, amort: 150, mensu: 275, mensuTotal: 285, crd: 49850, assuranceDeces: 0 },
        { mois: 2, interet: 124, assurance: 10, amort: 151, mensu: 275, mensuTotal: 285, crd: 49699, assuranceDeces: 0 }
      ];

      const result = computeGlobalCapitalDecesSchedule([loan1Params, loan2Params], [schedule1, schedule2]);
      
      expect(result).toHaveLength(2);
      
      // Vérifie l'agrégation de toutes les colonnes
      expect(result[0].interet).toBe(375);  // 250 + 125
      expect(result[0].assurance).toBe(35); // 25 + 10
      expect(result[0].amort).toBe(450);    // 300 + 150
      expect(result[0].mensu).toBe(825);    // 550 + 275
      expect(result[0].mensuTotal).toBe(860); // 575 + 285
      expect(result[0].crd).toBe(149550);   // 99700 + 49850
      
      // Vérifie les capitaux décès agrégés
      expect(result[0].assuranceDeces).toBe(150000); // 100000 (CRD prêt1) + 50000 (CI prêt2)
      expect(result[1].assuranceDeces).toBe(149700); // 99700 (CRD prêt1) + 50000 (CI prêt2)
    });
  });
});
