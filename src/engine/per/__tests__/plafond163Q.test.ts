import { describe, expect, it } from 'vitest';
import { computeRevenuImposable, computePlafond163QBrut, computeReductions163Q } from '../plafond163Q';
import type { DeclarantRevenus } from '../types';

const PASS = 46368;

const EMPTY_DECLARANT: DeclarantRevenus = {
  salaires: 0,
  art62: 0,
  bic: 0,
  retraites: 0,
  fonciersNets: 0,
  autresRevenus: 0,
  fraisReels: false,
  fraisReelsMontant: 0,
  cotisationsArt83: 0,
  cotisationsMadelinRetraite: 0,
  cotisationsMadelin154bis: 0,
  cotisationsPerp: 0,
  cotisationsPer163Q: 0,
  abondementPerco: 0,
  cotisationsPrevo: 0,
};

describe('computeRevenuImposable', () => {
  it('applique l\'abattement 10 % sur les salaires', () => {
    const d = { ...EMPTY_DECLARANT, salaires: 50000 };
    const result = computeRevenuImposable(d, 14171, 495);
    // 50000 * 0.1 = 5000 → abattement = 5000 (entre plancher et plafond)
    expect(result).toBe(45000);
  });

  it('applique les frais réels si activés', () => {
    const d = { ...EMPTY_DECLARANT, salaires: 50000, fraisReels: true, fraisReelsMontant: 8000 };
    const result = computeRevenuImposable(d, 14171, 495);
    expect(result).toBe(42000);
  });

  it('retourne 0 si aucun revenu', () => {
    const result = computeRevenuImposable(EMPTY_DECLARANT, 14171, 495);
    expect(result).toBe(0);
  });
});

describe('computePlafond163QBrut', () => {
  it('applique le plafond minimum (10 % de 1 PASS) pour les petits revenus', () => {
    const result = computePlafond163QBrut(10000, PASS);
    // 10000 * 0.1 = 1000 < 10% PASS = 4637 → minimum appliqué
    expect(result).toBe(Math.round(PASS * 0.1));
  });

  it('calcule 10 % du revenu pour un revenu intermédiaire', () => {
    const result = computePlafond163QBrut(80000, PASS);
    expect(result).toBe(Math.round(80000 * 0.1));
  });

  it('applique le plafond maximum (10 % de 8 PASS) pour les hauts revenus', () => {
    const result = computePlafond163QBrut(500000, PASS);
    expect(result).toBe(Math.round(8 * PASS * 0.1));
  });
});

describe('computeReductions163Q', () => {
  it('retourne 0 si aucune cotisation', () => {
    const result = computeReductions163Q(EMPTY_DECLARANT, PASS);
    expect(result).toBe(0);
  });

  it('inclut les cotisations art83 dans les réductions', () => {
    const d = { ...EMPTY_DECLARANT, cotisationsArt83: 3000 };
    const result = computeReductions163Q(d, PASS);
    expect(result).toBeGreaterThanOrEqual(3000);
  });
});
