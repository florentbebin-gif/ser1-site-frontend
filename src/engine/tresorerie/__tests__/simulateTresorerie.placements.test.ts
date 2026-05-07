/**
 * Tests golden du moteur trésorerie société IS.
 */

import { describe, it, expect } from 'vitest';
import {
  computeProductiveMonthsByCivilYear,
  calculCapitalisationAnnuel,
  calculISRachatCapitalisation,
} from '../calculPlacements';

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
