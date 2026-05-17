import { describe, expect, it } from 'vitest';

import { calculApportCCAAnnuel, calculCCACumule, calculRemboursementCCA } from '../calculCCA';

describe('calculCCA', () => {
  it('calcule le CCA cumulé avec initial et apport annuel', () => {
    expect(
      calculCCACumule({ ccaInitial: 100000, apportAnnuelCCA: 16600, dureeActiveAns: 20, annee: 1 }),
    ).toBe(116600);
  });

  it('plafonne le CCA cumulé à la durée active', () => {
    const cumule20 = calculCCACumule({
      ccaInitial: 100000,
      apportAnnuelCCA: 16600,
      dureeActiveAns: 20,
      annee: 20,
    });
    const cumule25 = calculCCACumule({
      ccaInitial: 100000,
      apportAnnuelCCA: 16600,
      dureeActiveAns: 20,
      annee: 25,
    });

    expect(cumule25).toBe(cumule20);
  });

  it('retourne un apport CCA nul en phase retraite', () => {
    expect(
      calculApportCCAAnnuel({
        ccaInitial: 100000,
        apportAnnuelCCA: 16600,
        annee: 25,
        dureeActiveAns: 20,
      }),
    ).toBe(0);
  });

  it('plafonne le remboursement CCA par le solde restant dû', () => {
    const remboursement = calculRemboursementCCA({
      besoinsRetraiteAnnuels: 30000,
      ccaRestantDu: 20000,
      tresorerieDisponibleApresIS: 50000,
      enPhaseRetraite: true,
    });

    expect(remboursement).toBe(20000);
  });

  it('retourne un remboursement CCA nul hors phase retraite', () => {
    const remboursement = calculRemboursementCCA({
      besoinsRetraiteAnnuels: 30000,
      ccaRestantDu: 200000,
      tresorerieDisponibleApresIS: 50000,
      enPhaseRetraite: false,
    });

    expect(remboursement).toBe(0);
  });
});
