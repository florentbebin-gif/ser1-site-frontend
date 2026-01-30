/**
 * Tests pour le calcul de l'assurance décès
 * Vérification des règles métier : Capital Initial vs CRD
 */

import { describe, it, expect } from 'vitest';

// Mock des fonctions de calcul extraites de Credit.jsx
function mensualiteAmortissable(C: number, r: number, N: number): number {
  if (N <= 0) return 0;
  if (r === 0) return C / N;
  return (C * r) / (1 - Math.pow(1 + r, -N));
}

interface ScheduleParams {
  capital: number;
  r: number;
  rAss: number;
  N: number;
  assurMode: 'CI' | 'CRD';
  mensuOverride?: number;
}

interface ScheduleRow {
  mois: number;
  interet: number;
  assurance: number;
  amort: number;
  mensu: number;
  mensuTotal: number;
  crd: number;
  assuranceDeces: number;
}

function scheduleAmortissable({ capital, r, rAss, N, assurMode, mensuOverride }: ScheduleParams): ScheduleRow[] {
  const rows = [];
  let crd = Math.max(0, capital);
  const mensuFixe = (typeof mensuOverride === 'number' && mensuOverride > 0)
    ? mensuOverride
    : mensualiteAmortissable(capital, r, N);

  const assurFixe = (assurMode === 'CI') ? (capital * rAss) : null;
  const EPS = 1e-8;

  for (let m = 1; m <= N; m++) {
    if (crd <= EPS) break;

    const crdStart = crd;
    const interet = crdStart * r;
    let mensu = mensuFixe;

    // borne dernière échéance
    const maxMensu = interet + crdStart;
    if (mensu > maxMensu) mensu = maxMensu;
    if (mensu < interet && r > 0) mensu = interet;

    let amort = Math.max(0, mensu - interet);
    if (amort > crdStart) amort = crdStart;

    const crdEnd = Math.max(0, crdStart - amort);
    
    // Calcul de l'assurance selon le mode et le taux
    let assur = 0;
    let assuranceDeces = 0;
    
    if (rAss > 0) {
      if (assurMode === 'CI') {
        assur = assurFixe || 0;
        assuranceDeces = capital;
      } else {
        assur = crdStart * rAss;
        assuranceDeces = crdStart;
      }
    }

    const mensuTotal = mensu + assur;
    rows.push({ 
      mois: m, 
      interet, 
      assurance: assur, 
      amort, 
      mensu, 
      mensuTotal, 
      crd: crdEnd,
      assuranceDeces
    });
    crd = crdEnd;
  }
  return rows;
}

describe('Calcul assurance décès', () => {
  const capital = 100000;
  const tauxAnnuel = 3.5;
  const tauxAssurAnnuel = 0.3;
  const duree = 24; // 2 ans pour tests rapides
  
  const r = tauxAnnuel / 100 / 12;
  const rAss = tauxAssurAnnuel / 100 / 12;
  const N = duree;

  describe('Mode Capital Initial (CI)', () => {
    it('avec taux > 0 : montant assuré constant = capital emprunté', () => {
      const rows = scheduleAmortissable({ capital, r, rAss, N, assurMode: 'CI', mensuOverride: undefined });
      
      rows.forEach(row => {
        expect(row.assuranceDeces).toBe(capital);
        expect(row.assurance).toBeCloseTo(capital * rAss, 2);
      });
    });

    it('avec taux = 0 : montant assuré = 0 partout', () => {
      const rows = scheduleAmortissable({ capital, r, rAss: 0, N, assurMode: 'CI', mensuOverride: undefined });
      
      rows.forEach(row => {
        expect(row.assuranceDeces).toBe(0);
        expect(row.assurance).toBe(0);
      });
    });
  });

  describe('Mode CRD (Capital Restant Dû)', () => {
    it('avec taux > 0 : montant assuré suit le CRD début de période', () => {
      const rows = scheduleAmortissable({ capital, r, rAss, N, assurMode: 'CRD', mensuOverride: undefined });
      
      // Vérification que le montant assuré correspond au CRD début de période
      let crdAttendu = capital;
      rows.forEach((row) => {
        expect(row.assuranceDeces).toBeCloseTo(crdAttendu, 2);
        expect(row.assurance).toBeCloseTo(crdAttendu * rAss, 2);
        
        // Calcul du CRD suivant pour la prochaine itération
        const amort = row.amort;
        crdAttendu = Math.max(0, crdAttendu - amort);
      });
    });

    it('avec taux = 0 : montant assuré = 0 partout', () => {
      const rows = scheduleAmortissable({ capital, r, rAss: 0, N, assurMode: 'CRD', mensuOverride: undefined });
      
      rows.forEach(row => {
        expect(row.assuranceDeces).toBe(0);
        expect(row.assurance).toBe(0);
      });
    });

    it('vérification décroissance progressive du CRD', () => {
      const rows = scheduleAmortissable({ capital, r, rAss, N, assurMode: 'CRD', mensuOverride: undefined });
      
      // Le montant assuré doit décroître progressivement
      for (let i = 1; i < rows.length; i++) {
        expect(rows[i].assuranceDeces).toBeLessThanOrEqual(rows[i-1].assuranceDeces);
      }
      
      // Le dernier mois doit avoir un montant assuré proche de 0
      const dernierMois = rows[rows.length - 1];
      expect(dernierMois.assuranceDeces).toBeLessThan(5000); // proche de 0 pour prêt de 24 mois
    });
  });

  describe('Comparaison CI vs CRD', () => {
    it('CI constant vs CRD décroissant (taux > 0)', () => {
      const rowsCI = scheduleAmortissable({ capital, r, rAss, N, assurMode: 'CI', mensuOverride: undefined });
      const rowsCRD = scheduleAmortissable({ capital, r, rAss, N, assurMode: 'CRD', mensuOverride: undefined });
      
      // Premier mois : CI = CRD = capital
      expect(rowsCI[0].assuranceDeces).toBe(capital);
      expect(rowsCRD[0].assuranceDeces).toBe(capital);
      
      // Mois suivants : CI reste constant, CRD décroît
      for (let i = 1; i < rowsCRD.length; i++) {
        expect(rowsCI[i].assuranceDeces).toBe(capital);
        expect(rowsCRD[i].assuranceDeces).toBeLessThan(capital);
        expect(rowsCRD[i].assuranceDeces).toBeLessThan(rowsCRD[i-1].assuranceDeces);
      }
    });
  });
});
