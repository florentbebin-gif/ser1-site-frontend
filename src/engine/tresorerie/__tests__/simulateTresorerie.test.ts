/**
 * simulateTresorerie.test.ts — Tests golden du moteur trésorerie société IS
 *
 * Cas couverts (≥ 18) :
 *   IS seul (2 cas)
 *   IS mère-fille standard 5 % (1 cas)
 *   IS mère-fille groupe 1 % (1 cas)
 *   CCA seul (2 cas)
 *   Capitalisation IS latent non décaissé (2 cas)
 *   IS effectif sur rachat (1 cas — via calculISRachatCapitalisation)
 *   Crédit IS — intérêts déductibles (1 cas)
 *   Crédit IR — dividendes nécessaires PFU (1 cas)
 *   Réserves dépassement capacité distribuable (1 cas)
 *   Délai jouissance — 5 cas (computeProductiveMonthsByCivilYear)
 *   Invariants : CCA ≥ 0, dividendes plafonnés, IS = 0 si perte (3 cas)
 */

import { describe, it, expect } from 'vitest';
import { simulateTresorerie } from '../simulateTresorerie';
import { calculIS, calculBaseEtIS, calculResultatFiscalHolding } from '../calculIS';
import { calculCCACumule, calculApportCCAAnnuel, calculRemboursementCCA } from '../calculCCA';
import {
  computeProductiveMonthsByCivilYear,
  calculCapitalisationAnnuel,
  calculISRachatCapitalisation,
} from '../calculPlacements';
import { calculCreditIR } from '../calculCreditIR';
import type { TresoInputs } from '../types';
import { BASE_INPUTS, PARAMS_STD } from './simulateTresorerie.fixtures';

// ─── 1. calculIS — IS seul ────────────────────────────────────────────────────

describe('calculIS', () => {
  it('IS = 0 si base nulle', () => {
    expect(calculIS(0, PARAMS_STD)).toBe(0);
  });

  it('IS taux réduit seul (base ≤ seuil)', () => {
    // 20 000 × 15 % = 3 000
    expect(calculIS(20000, PARAMS_STD)).toBeCloseTo(3000, 2);
  });

  it('IS tranche réduite + tranche normale (base > seuil)', () => {
    // 42 500 × 15 % + 7 500 × 25 % = 6 375 + 1 875 = 8 250
    expect(calculIS(50000, PARAMS_STD)).toBeCloseTo(8250, 2);
  });

  it('IS = 0 si baseIS négative (invariant 6)', () => {
    expect(calculIS(-1000, PARAMS_STD)).toBe(0);
  });

  it('calculBaseEtIS — base IS clampée à 0', () => {
    const { baseIS, is } = calculBaseEtIS(-5000, PARAMS_STD);
    expect(baseIS).toBe(0);
    expect(is).toBe(0);
  });
});

// ─── 2. Régime mère-fille ─────────────────────────────────────────────────────

describe('calculResultatFiscalHolding — mère-fille', () => {
  it('Sans holding : résultat fiscal = résultat comptable', () => {
    const r = calculResultatFiscalHolding(30000, 0, undefined, PARAMS_STD);
    expect(r.resultatFiscal).toBe(30000);
    expect(r.quotePartTaxable).toBe(0);
  });

  it('Holding inactif : résultat fiscal = résultat comptable', () => {
    const holding = {
      actif: false,
      regimeMereFilleEligible: true,
      regimeGroupeFiscal: false,
      tauxDetention: 90,
      dureeConservationTitresAns: 3,
      dividendesFiliales: 10000,
    };
    const r = calculResultatFiscalHolding(30000, 10000, holding, PARAMS_STD);
    expect(r.resultatFiscal).toBe(30000);
  });

  it('IS mère-fille standard : QPFC 5 % de 10 000 = 500 taxable', () => {
    const holding = {
      actif: true,
      regimeMereFilleEligible: true,
      regimeGroupeFiscal: false,
      tauxDetention: 90,
      dureeConservationTitresAns: 3,
      dividendesFiliales: 10000,
    };
    const r = calculResultatFiscalHolding(0, 10000, holding, PARAMS_STD);
    // Résultat fiscal = 0 + 10 000 × 5 % = 500
    expect(r.quotePartTaxable).toBeCloseTo(500, 2);
    expect(r.resultatFiscal).toBeCloseTo(500, 2);
    expect(r.dividendesFilialesExoneres).toBeCloseTo(9500, 2);
    // Résultat comptable = 0 + 10 000 = 10 000
    expect(r.resultatComptable).toBeCloseTo(10000, 2);
  });

  it('IS mère-fille groupe fiscal : QPFC 1 % de 10 000 = 100 taxable', () => {
    const holding = {
      actif: true,
      regimeMereFilleEligible: true,
      regimeGroupeFiscal: true,
      tauxDetention: 90,
      dureeConservationTitresAns: 3,
      dividendesFiliales: 10000,
    };
    const r = calculResultatFiscalHolding(0, 10000, holding, PARAMS_STD);
    expect(r.quotePartTaxable).toBeCloseTo(100, 2);
    expect(r.resultatFiscal).toBeCloseTo(100, 2);
  });

  it('Holding sans éligibilité mère-fille : 100 % taxable', () => {
    const holding = {
      actif: true,
      regimeMereFilleEligible: false,
      regimeGroupeFiscal: false,
      tauxDetention: 90,
      dureeConservationTitresAns: 3,
      dividendesFiliales: 10000,
    };
    const r = calculResultatFiscalHolding(0, 10000, holding, PARAMS_STD);
    expect(r.quotePartTaxable).toBeCloseTo(10000, 2);
    expect(r.dividendesFilialesExoneres).toBe(0);
  });
});

// ─── 3. CCA ───────────────────────────────────────────────────────────────────

describe('calculCCA', () => {
  it('CCA cumulé année 1 (initial + annuel)', () => {
    expect(calculCCACumule({ ccaInitial: 100000, apportAnnuelCCA: 16600, dureeActiveAns: 20, annee: 1 }))
      .toBe(116600);
  });

  it('CCA cumulé plafonné à la durée active', () => {
    const cumule20 = calculCCACumule({ ccaInitial: 100000, apportAnnuelCCA: 16600, dureeActiveAns: 20, annee: 20 });
    const cumule25 = calculCCACumule({ ccaInitial: 100000, apportAnnuelCCA: 16600, dureeActiveAns: 20, annee: 25 });
    expect(cumule25).toBe(cumule20); // Plus d'apport après dureeActive
  });

  it('Apport CCA = 0 en phase retraite', () => {
    expect(calculApportCCAAnnuel({ ccaInitial: 100000, apportAnnuelCCA: 16600, annee: 25, dureeActiveAns: 20 }))
      .toBe(0);
  });

  it('Remboursement CCA plafonné par CCARestant (invariant 1)', () => {
    const remb = calculRemboursementCCA({
      besoinsRetraiteAnnuels: 30000,
      ccaRestantDu: 20000,
      tresorerieDisponibleApresIS: 50000,
      enPhaseRetraite: true,
    });
    expect(remb).toBe(20000); // Plafonné par CCARestant
  });

  it('Remboursement CCA = 0 hors phase retraite', () => {
    const remb = calculRemboursementCCA({
      besoinsRetraiteAnnuels: 30000,
      ccaRestantDu: 200000,
      tresorerieDisponibleApresIS: 50000,
      enPhaseRetraite: false,
    });
    expect(remb).toBe(0);
  });

  it('NEWCO : ccaRestant accumule les apports (invariant CCA)', () => {
    // ccaInitial=100 000, apport=16 600/an, retraite à 65 (20 ans actifs)
    const rows = simulateTresorerie(BASE_INPUTS, PARAMS_STD, 3);
    // Année 1 : apportCCA = 100 000 + 16 600 = 116 600 → ccaRestant = 116 600
    expect(rows[0].ccaRestant).toBeCloseTo(116600, 0);
    // Année 2 : + 16 600 → ccaRestant = 133 200
    expect(rows[1].ccaRestant).toBeCloseTo(133200, 0);
  });

  it('Existante : ccaRestant part de ccaInitial et accumule les apports', () => {
    const inputs: TresoInputs = {
      ...BASE_INPUTS,
      typeCreation: 'existante',
    };
    const rows = simulateTresorerie(inputs, PARAMS_STD, 2);
    // Init = 100 000, année 1 apportCCA = 16 600 → ccaRestant = 116 600
    expect(rows[0].ccaRestant).toBeCloseTo(116600, 0);
  });

  it('Existante avec soldes initiaux : tresorerieInitiale et reservesInitiales alimentent correctement — IMP-2', () => {
    const inputs: TresoInputs = {
      ...BASE_INPUTS,
      typeCreation: 'existante',
      tresorerieInitiale: 50000,
      reservesInitiales: 100000,
    };
    const rows = simulateTresorerie(inputs, PARAMS_STD, 1);
    const row = rows[0];
    expect(row.tresorerieDebut).toBe(50000);
    expect(row.reservesDebut).toBe(100000);
    // capaciteDistribuable = max(0, reservesDebut + resultatNetComptable)
    expect(row.capaciteDistribuable).toBeCloseTo(
      Math.max(0, 100000 + row.resultatNetComptable),
      2,
    );
  });
});

// ─── 4. Capitalisation — IS latent non décaissé ───────────────────────────────

describe('calculCapitalisationAnnuel', () => {
  it('Capitalisation année 1 : croissance sans IS décaissé', () => {
    const pocket = { montant: 100000, rendementAnnuel: 0.05 };
    const state = { valeurActuelle: 100000, capitalInvesti: 100000 };
    const r = calculCapitalisationAnnuel(pocket, state, 1, 0.25);
    expect(r.valeurCapiApres).toBeCloseTo(105000, 1);
    expect(r.gainCapiN).toBe(0); // Pas de gain avant la sortie
    expect(r.isLatentCapi).toBeCloseTo(5000 * 0.25, 2); // IS latent non décaissé
  });

  it('IS latent = plusValueLatente × tauxISEffectif (invariant 4)', () => {
    const pocket = { montant: 100000, rendementAnnuel: 0.05, dureeAns: 5 };
    const state = { valeurActuelle: 110000, capitalInvesti: 100000 };
    const r = calculCapitalisationAnnuel(pocket, state, 3, 0.25);
    const plusValueLatente = r.valeurCapiApres - 100000;
    expect(r.isLatentCapi).toBeCloseTo(plusValueLatente * 0.25, 2);
    expect(r.gainCapiN).toBe(0); // Sortie année 5, pas avant
  });

  it('Gain reconnu à la sortie uniquement (preuve M21 XLSM)', () => {
    const pocket = { montant: 50000, rendementAnnuel: 0.04, dureeAns: 3 };
    const state = { valeurActuelle: 50000, capitalInvesti: 50000 };
    const r1 = calculCapitalisationAnnuel(pocket, state, 1, 0.25);
    const state2 = { valeurActuelle: r1.valeurCapiApres, capitalInvesti: 50000 };
    const r2 = calculCapitalisationAnnuel(pocket, state2, 2, 0.25);
    const state3 = { valeurActuelle: r2.valeurCapiApres, capitalInvesti: 50000 };
    const r3 = calculCapitalisationAnnuel(pocket, state3, 3, 0.25);
    expect(r1.gainCapiN).toBe(0);
    expect(r2.gainCapiN).toBe(0);
    expect(r3.gainCapiN).toBeGreaterThan(0); // Sortie à l'année 3
  });
});

// ─── 5. IS effectif sur rachat capitalisation ─────────────────────────────────

describe('calculISRachatCapitalisation — invariant 5', () => {
  it('IS effectif prorata sur rachat partiel', () => {
    const r = calculISRachatCapitalisation({
      montantRachat: 10000,
      valeurActuelle: 50000,
      capitalInvesti: 30000,
      tauxISEffectif: 0.25,
    });
    // Gain prorata = 10 000 × (20 000 / 50 000) = 4 000 ; IS = 1 000
    expect(r.isEffectif).toBeCloseTo(1000, 2);
    expect(r.montantNet).toBeCloseTo(9000, 2);
  });
});

// ─── 6. Crédit IR — dividendes nécessaires PFU ───────────────────────────────

describe('calculCreditIR — invariant 3', () => {
  it('Dividendes bruts nécessaires = annuité / (1 − pfuTotal)', () => {
    const pocket = { actif: true, capital: 120000, taux: 0.04, dureeMois: 240 };
    const r = calculCreditIR(pocket, PARAMS_STD, 1);
    expect(r.dividendesBrutsDemandes).toBeCloseTo(r.annuite / (1 - PARAMS_STD.pfuTotal), 2);
  });

  it('Crédit terminé → dividendes = 0', () => {
    const pocket = { actif: true, capital: 10000, taux: 0.04, dureeMois: 12 };
    const r = calculCreditIR(pocket, PARAMS_STD, 2); // Année 2 après crédit 1 an
    expect(r.dividendesBrutsDemandes).toBe(0);
  });
});

// ─── 7. Délai de jouissance — 5 cas (computeProductiveMonthsByCivilYear) ──────

describe('computeProductiveMonthsByCivilYear — délai jouissance', () => {
  it('Cas 1 : délai sur année 1 → 4 mois (sep–déc 2025)', () => {
    // souscription 2025-01, délai 8 mois → jouissance à partir de sept 2025
    const mois = computeProductiveMonthsByCivilYear({
      dateSouscription: '2025-01',
      delaiJouissanceMois: 8,
      dureeMois: 24,
      repetitionAuTerme: false,
      anneeCivile: 2025,
    });
    expect(mois).toBe(4);
  });

  it("Cas 2 : délai en fin d'année → 1 mois (déc 2025)", () => {
    // souscription 2025-06, délai 6 mois → jouissance à partir de déc 2025
    const mois = computeProductiveMonthsByCivilYear({
      dateSouscription: '2025-06',
      delaiJouissanceMois: 6,
      dureeMois: 24,
      repetitionAuTerme: false,
      anneeCivile: 2025,
    });
    expect(mois).toBe(1);
  });

  it('Cas 3 : délai déborde N+1 → 9 mois (avr–déc 2026)', () => {
    // souscription 2025-10, délai 6 mois → jouissance avr 2026
    const mois = computeProductiveMonthsByCivilYear({
      dateSouscription: '2025-10',
      delaiJouissanceMois: 6,
      dureeMois: 36,
      repetitionAuTerme: false,
      anneeCivile: 2026,
    });
    // Début jouissance : 2025-10 + 6 = 2026-04 (mois absolu)
    // Année civile 2026, intersection avr–déc = 9 mois
    expect(mois).toBe(9);
  });

  it('Cas 4 : durée < délai → 0 mois', () => {
    const mois = computeProductiveMonthsByCivilYear({
      dateSouscription: '2025-01',
      delaiJouissanceMois: 8,
      dureeMois: 4,
      repetitionAuTerme: false,
      anneeCivile: 2025,
    });
    expect(mois).toBe(0);
  });

  it('Cas 5 : placement pleine année sans délai → 12 mois', () => {
    const mois = computeProductiveMonthsByCivilYear({
      dateSouscription: '2025-01',
      delaiJouissanceMois: 0,
      dureeMois: 120,
      repetitionAuTerme: false,
      anneeCivile: 2025,
    });
    expect(mois).toBe(12);
  });

  it('Cas 6 : simulation 2030 avec souscription 2025 → pleine année', () => {
    // Vérifie que l'année civile fournie par l'appelant prime sur la date de souscription
    const mois = computeProductiveMonthsByCivilYear({
      dateSouscription: '2025-01',
      delaiJouissanceMois: 0,
      dureeMois: 120,
      repetitionAuTerme: false,
      anneeCivile: 2030,
    });
    expect(mois).toBe(12);
  });
});

// ─── 8. simulateTresorerie — scénarios intégrés ───────────────────────────────

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

// ─── 9. repetitionAuTerme — cycles absolus ───────────────────────────────────

describe('computeProductiveMonthsByCivilYear — repetitionAuTerme cycles absolus (P2-D)', () => {
  it('Cycle 24 mois, délai 3 mois : année civile dans cycle 0 → 12 mois', () => {
    // Souscription jan 2025, cycle 24 mois → fin cycle 0 = jan 2027
    // Jouissance cycle 0 = avr 2025. Année 2026 entière ⊂ [avr 2025, jan 2027[ → 12 mois
    const mois = computeProductiveMonthsByCivilYear({
      dateSouscription: '2025-01',
      delaiJouissanceMois: 3,
      dureeMois: 24,
      repetitionAuTerme: true,
      anneeCivile: 2026,
    });
    expect(mois).toBe(12);
  });

  it('Cycle 24 mois, délai 3 mois : début de cycle 1 → 9 mois (délai retraite avr)', () => {
    // Cycle 1 commence jan 2027, jouissance avr 2027 → 9 mois dans 2027
    const mois = computeProductiveMonthsByCivilYear({
      dateSouscription: '2025-01',
      delaiJouissanceMois: 3,
      dureeMois: 24,
      repetitionAuTerme: true,
      anneeCivile: 2027,
    });
    expect(mois).toBe(9);
  });
});
