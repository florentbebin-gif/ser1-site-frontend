/**
 * Tests golden du moteur trésorerie société IS.
 */

import { describe, it, expect } from 'vitest';
import { simulateTresorerie } from '../simulateTresorerie';
import { calculCCACumule, calculApportCCAAnnuel, calculRemboursementCCA } from '../calculCCA';
import type { TresoInputs } from '../types';
import { BASE_INPUTS, PARAMS_STD } from './simulateTresorerie.fixtures';

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
