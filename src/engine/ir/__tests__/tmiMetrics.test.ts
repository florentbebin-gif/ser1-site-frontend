/**
 * Tests pour les métriques TMI robustes — convertis au format Vitest (PR-P1-08-00).
 * Scénarios A-D + dernière tranche, logique inchangée.
 */

import { describe, it, expect } from 'vitest';
import { computeTmiMetrics } from '../tmiMetrics';

// Barème IR simplifié pour les tests (approximatif 2024)
const DEFAULT_SCALE = [
  { from: 0, to: 11294, rate: 0 },
  { from: 11294, to: 28797, rate: 11 },
  { from: 28797, to: 82341, rate: 30 },
  { from: 82341, to: 177106, rate: 41 },
  { from: 177106, to: null, rate: 45 },
];

const DEFAULT_PLAFOND_PART_SUP = 1678;
const DEFAULT_PLAFOND_PARENT_ISO = 3959;

const baseParams = (overrides = {}) => ({
  scale: DEFAULT_SCALE,
  plafondPartSup: DEFAULT_PLAFOND_PART_SUP,
  plafondParentIso2: DEFAULT_PLAFOND_PARENT_ISO,
  partsNb: 1,
  basePartsForQf: 1,
  extraParts: 0,
  extraHalfParts: 0,
  isCouple: false,
  isIsolated: false,
  ...overrides,
});

describe('computeTmiMetrics — Scénario A : Marié/Pacsé 90k€', () => {
  const params = baseParams({ partsNb: 2, basePartsForQf: 2, isCouple: true });
  const metrics = computeTmiMetrics(90000, params);

  it('TMI = 30%', () => expect(metrics.tmiRate).toBe(30));
  it('Revenus dans TMI > 0', () => expect(metrics.revenusDansTmi).toBeGreaterThan(0));
  it('Marge > 0', () => expect(metrics.margeAvantChangement).toBeGreaterThan(0));
  it('Seuil bas cohérent', () => {
    expect(metrics.seuilBasFoyer).toBeGreaterThanOrEqual(0);
    expect(metrics.seuilBasFoyer).toBeLessThan(90000);
  });
  it('Invariant : revenus dans TMI + marge ≈ largeur tranche', () => {
    if (metrics.seuilHautFoyer && metrics.margeAvantChangement != null) {
      const largeur = metrics.seuilHautFoyer - metrics.seuilBasFoyer;
      expect(Math.abs(metrics.revenusDansTmi + metrics.margeAvantChangement - largeur)).toBeLessThan(100);
    }
  });
});

describe('computeTmiMetrics — Scénario B : Célibataire 2 enfants, parent isolé OFF, 90k€', () => {
  const params = baseParams({ partsNb: 3, basePartsForQf: 1, extraParts: 2, extraHalfParts: 2 });
  const metrics = computeTmiMetrics(90000, params);

  it('TMI cohérente (30–41%)', () => {
    expect(metrics.tmiRate).toBeGreaterThanOrEqual(30);
    expect(metrics.tmiRate).toBeLessThanOrEqual(41);
  });
  it('Revenus dans TMI > 0', () => expect(metrics.revenusDansTmi).toBeGreaterThan(0));
  it('Marge raisonnable < 100k', () => {
    if (metrics.margeAvantChangement != null) {
      expect(metrics.margeAvantChangement).toBeLessThan(100000);
    }
  });
  it('Pas de valeur absurde (270588)', () => expect(metrics.margeAvantChangement).not.toBe(270588));
});

describe('computeTmiMetrics — Scénario C : Célibataire 2 enfants, parent isolé ON, 90k€', () => {
  const paramsOn = baseParams({ partsNb: 3, basePartsForQf: 1, extraParts: 2, extraHalfParts: 2, isIsolated: true });
  const paramsOff = baseParams({ partsNb: 3, basePartsForQf: 1, extraParts: 2, extraHalfParts: 2, isIsolated: false });
  const metricsOn = computeTmiMetrics(90000, paramsOn);
  const _metricsOff = computeTmiMetrics(90000, paramsOff);
  void _metricsOff;

  it('TMI cohérente (0–45%)', () => {
    expect(metricsOn.tmiRate).toBeGreaterThanOrEqual(0);
    expect(metricsOn.tmiRate).toBeLessThanOrEqual(45);
  });
  it('Revenus dans TMI > 0', () => expect(metricsOn.revenusDansTmi).toBeGreaterThan(0));
  it('Cohérence interne ON : revenusDansTmi + marge ≈ largeur tranche', () => {
    if (metricsOn.seuilHautFoyer) {
      const largeur = metricsOn.seuilHautFoyer - metricsOn.seuilBasFoyer;
      expect(Math.abs(metricsOn.revenusDansTmi + (metricsOn.margeAvantChangement || 0) - largeur)).toBeLessThan(100);
    }
  });
});

describe('computeTmiMetrics — Scénario D : Marié/Pacsé au seuil 167 647€', () => {
  const params = baseParams({ partsNb: 2, basePartsForQf: 2, isCouple: true });
  const metrics = computeTmiMetrics(167647, params);
  const metricsM = computeTmiMetrics(166647, params);
  const metricsP = computeTmiMetrics(168647, params);

  it('TMI = 41%', () => expect(metrics.tmiRate).toBe(41));
  it('Revenus dans TMI > 0', () => expect(metrics.revenusDansTmi).toBeGreaterThan(0));
  it('Marge cohérente vers 45%', () => expect(metrics.margeAvantChangement).toBeGreaterThan(0));
  it('Cohérence autour du seuil', () => {
    expect(metricsM.tmiRate).toBeLessThanOrEqual(metrics.tmiRate);
    expect(metrics.tmiRate).toBeLessThanOrEqual(metricsP.tmiRate);
  });
});

describe('computeTmiMetrics — Dernière tranche (300k€)', () => {
  const params = baseParams({ partsNb: 1, basePartsForQf: 1 });
  const metrics = computeTmiMetrics(300000, params);

  it('TMI = 45%', () => expect(metrics.tmiRate).toBe(45));
  it('Marge = null (pas de tranche supérieure)', () => expect(metrics.margeAvantChangement).toBeNull());
  it('Revenus dans TMI > 0', () => expect(metrics.revenusDansTmi).toBeGreaterThan(0));
});
