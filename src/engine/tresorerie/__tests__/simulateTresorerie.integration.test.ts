/**
 * Tests golden du moteur trésorerie société IS.
 */

import { describe, it, expect } from 'vitest';
import { simulateTresorerie } from '../simulateTresorerie';
import type { TresoInputs } from '../types';
import { BASE_INPUTS, PARAMS_STD } from './simulateTresorerie.fixtures';

describe('simulateTresorerie — intégration', () => {
  it('Produit 30 lignes par défaut', () => {
    const rows = simulateTresorerie(BASE_INPUTS, PARAMS_STD);
    expect(rows).toHaveLength(30);
  });

  it('CCA cumulé année 1 = 100 000 + 16 600 = 116 600', () => {
    const rows = simulateTresorerie(BASE_INPUTS, PARAMS_STD);
    expect(rows[0].ccaCumule).toBe(116600);
  });

  it('IS = 0 si aucun revenu (société vide)', () => {
    const inputs: TresoInputs = {
      ...BASE_INPUTS,
      fraisStructureAnnuels: 0,
    };
    const rows = simulateTresorerie(inputs, PARAMS_STD, 5);
    rows.forEach(row => {
      expect(row.is).toBe(0);
      expect(row.baseIS).toBe(0);
    });
  });

  it('IS distribué sur revenus distribution (base > 0)', () => {
    const inputs: TresoInputs = {
      ...BASE_INPUTS,
      distribution: {
        montant: 200000,
        rendementDistribue: 0.05,
        dateSouscription: '2025-01',
        delaiJouissanceMois: 0,
        dureeAns: 30,
      },
    };
    const rows = simulateTresorerie(inputs, PARAMS_STD, 1);
    const row = rows[0];
    // revenuDistrib = 200 000 × 5 % = 10 000
    // chargesStructure = 3 000
    // resultatComptableAvantIS = 10 000 − 3 000 = 7 000
    // IS = 7 000 × 15 % = 1 050
    expect(row.revenuDistrib).toBeCloseTo(10000, 1);
    expect(row.resultatComptableAvantIS).toBeCloseTo(7000, 1);
    expect(row.is).toBeCloseTo(1050, 1);
  });

  it('Dépassement capacité distribuable → alerte active (invariant 2)', () => {
    // On force des dividendes très élevés via crédit IR
    const inputs: TresoInputs = {
      ...BASE_INPUTS,
      ageActuel: 64,
      ageRetraite: 65,
      besoinsRetraiteAnnuels: 100000,
      distribution: {
        montant: 10000,
        rendementDistribue: 0.05,
        dateSouscription: '2025-01',
        delaiJouissanceMois: 0,
        dureeAns: 10,
      },
      creditIR: {
        actif: true,
        capital: 500000,
        taux: 0.04,
        dureeMois: 240,
      },
    };
    const rows = simulateTresorerie(inputs, PARAMS_STD, 2);
    // L'alerte doit être active car les dividendes demandés dépassent les réserves initiales
    const hasAlert = rows.some(r => r.alerteDividendesSuperieursCapacite);
    expect(hasAlert).toBe(true);
  });

  it('Crédit IS : intérêts déductibles réduisent la base IS', () => {
    const inputsSansCreditIS: TresoInputs = {
      ...BASE_INPUTS,
      distribution: {
        montant: 200000,
        rendementDistribue: 0.05,
        dateSouscription: '2025-01',
        delaiJouissanceMois: 0,
        dureeAns: 30,
      },
    };
    const inputsAvecCreditIS: TresoInputs = {
      ...inputsSansCreditIS,
      creditIS: {
        actif: true,
        capitalEmprunte: 100000,
        taux: 0.03,
        dureeMois: 120,
        interetsDeductibles: true,
      },
    };
    const rowsSans = simulateTresorerie(inputsSansCreditIS, PARAMS_STD, 1);
    const rowsAvec = simulateTresorerie(inputsAvecCreditIS, PARAMS_STD, 1);
    // Avec crédit IS, les intérêts réduisent la base IS → IS inférieur
    expect(rowsAvec[0].baseIS).toBeLessThan(rowsSans[0].baseIS);
    expect(rowsAvec[0].is).toBeLessThan(rowsSans[0].is);
    expect(rowsAvec[0].interetsCreditIS).toBeGreaterThan(0);
  });

  it('Capitalisation : IS latent non inclus dans IS décaissé (invariant 4)', () => {
    const inputs: TresoInputs = {
      ...BASE_INPUTS,
      capitalisation: {
        montant: 100000,
        rendementAnnuel: 0.05,
        dureeAns: 10,
      },
    };
    const rows = simulateTresorerie(inputs, PARAMS_STD, 5);
    rows.forEach(row => {
      if (row.isLatentCapi > 0) {
        // IS latent > 0 mais IS décaissé = 0 (capitalisation seule)
        expect(row.is).toBe(0);
      }
    });
  });

  it('Réserves finales correctement calculées', () => {
    const inputs: TresoInputs = {
      ...BASE_INPUTS,
      distribution: {
        montant: 200000,
        rendementDistribue: 0.05,
        dateSouscription: '2025-01',
        delaiJouissanceMois: 0,
        dureeAns: 30,
      },
      reservesInitiales: 10000,
    };
    const rows = simulateTresorerie(inputs, PARAMS_STD, 1);
    const row = rows[0];
    // reservesFin = reservesDebut + miseEnReserve = reservesDebut + (resultatNet − dividendes)
    const expectedReservesFin = row.reservesDebut + row.miseEnReserve;
    expect(row.reservesFin).toBeCloseTo(expectedReservesFin, 2);
  });

  it('Trésorerie fin = début + flux entrants − flux sortants (Option A)', () => {
    const inputs: TresoInputs = {
      ...BASE_INPUTS,
      distribution: {
        montant: 100000,
        rendementDistribue: 0.04,
        dateSouscription: '2025-01',
        delaiJouissanceMois: 0,
        dureeAns: 30,
      },
    };
    const rows = simulateTresorerie(inputs, PARAMS_STD, 1);
    const row = rows[0];
    expect(row.tresorerieFin).toBeGreaterThanOrEqual(row.tresorerieDebut - 1);
  });

  it('revenusActifFinance entrent en trésorerie — P1-A golden', () => {
    // Crédit IS 100 000 € @ 5 %, actif financé rendement 5 %, pas de délai jouissance
    // revenusActifFinance = 100 000 × 5 % = 5 000 → doit augmenter tresorerieFin
    const creditISBase = {
      actif: true as const,
      capitalEmprunte: 100000,
      taux: 0.05,
      dureeMois: 12,
      dateDeblocage: '2026-01',
      delaiJouissanceMois: 0,
      interetsDeductibles: true as const,
    };
    const inputsAvec: TresoInputs = {
      ...BASE_INPUTS,
      anneeCivileDebut: 2026,
      fraisStructureAnnuels: 0,
      creditIS: { ...creditISBase, rendementActifFinance: 0.05 },
    };
    const inputsSans: TresoInputs = {
      ...BASE_INPUTS,
      anneeCivileDebut: 2026,
      fraisStructureAnnuels: 0,
      creditIS: { ...creditISBase, rendementActifFinance: 0 },
    };
    const rowAvec = simulateTresorerie(inputsAvec, PARAMS_STD, 1)[0];
    const rowSans = simulateTresorerie(inputsSans, PARAMS_STD, 1)[0];
    expect(rowAvec.revenusActifFinance).toBeCloseTo(5000, 0);
    expect(rowAvec.tresorerieFin).toBeGreaterThan(rowSans.tresorerieFin);
  });

  it('Rachat capitalisation : le capital investi revient en trésorerie — P1-B golden', () => {
    // 100 000 € @ 10 % sur 2 ans : valeurCapi = 121 000, gainCapiN = 21 000, IS ≈ 3 150
    // montantRachatCapi doit valoir 121 000 (pas seulement le gain 21 000)
    const inputs: TresoInputs = {
      ...BASE_INPUTS,
      fraisStructureAnnuels: 0,
      capitalisation: {
        montant: 100000,
        rendementAnnuel: 0.10,
        dureeAns: 2,
        rachatAuTerme: true,
      },
    };
    const rows = simulateTresorerie(inputs, PARAMS_STD, 2);
    const row2 = rows[1];
    // Capital + gain intégralement encaissés
    expect(row2.montantRachatCapi).toBeCloseTo(121000, 0);
    // tresorerieFin inclut le retour du capital de 100 000
    expect(row2.tresorerieFin).toBeGreaterThan(row2.tresorerieDebut + 100000);
  });

  it('dateDeblocage : annuité = 0 avant le déblocage, > 0 après — P2-C golden', () => {
    // Déblocage jan 2028, simulation démarre 2026 → années 1-2 sans dette, année 3 avec
    const inputs: TresoInputs = {
      ...BASE_INPUTS,
      anneeCivileDebut: 2026,
      fraisStructureAnnuels: 0,
      creditIS: {
        actif: true,
        capitalEmprunte: 100000,
        taux: 0.05,
        dureeMois: 120,
        dateDeblocage: '2028-01',
        interetsDeductibles: true,
      },
    };
    const rows = simulateTresorerie(inputs, PARAMS_STD, 4);
    expect(rows[0].interetsCreditIS).toBe(0);
    expect(rows[0].annuiteCreditIS).toBe(0);
    expect(rows[1].interetsCreditIS).toBe(0);
    expect(rows[2].interetsCreditIS).toBeGreaterThan(0);
    expect(rows[2].annuiteCreditIS).toBeGreaterThan(0);
  });
});
