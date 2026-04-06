import { describe, expect, it } from 'vitest';
import { calculFiscaliteRetrait } from '../liquidation';
import { DEFAULT_FISCAL_PARAMS } from '../shared';

describe('calculFiscaliteRetrait', () => {
  it('AV < 8 ans : applique le PFU par défaut', () => {
    const result = calculFiscaliteRetrait(
      { envelope: 'AV', montantRetrait: 10000, partGains: 3000, partCapital: 7000, anneeOuverture: 4 },
      DEFAULT_FISCAL_PARAMS,
    );
    expect(result.fiscaliteTotal).toBeGreaterThan(0);
    expect(result.retraitNet).toBeLessThan(10000);
  });

  it('AV >= 8 ans : applique l\'abattement avant taxation', () => {
    const result = calculFiscaliteRetrait(
      { envelope: 'AV', montantRetrait: 10000, partGains: 3000, partCapital: 7000, anneeOuverture: 8, situation: 'single' },
      DEFAULT_FISCAL_PARAMS,
    );
    // Avec abattement 4600 (single) sur 3000 de gains → gains nets = 0 → IR sur gains ≈ 0
    expect(result.irSurGains).toBe(0);
  });

  it('CTO : taxe les gains au PFU', () => {
    const result = calculFiscaliteRetrait(
      { envelope: 'CTO', montantRetrait: 20000, partGains: 5000, partCapital: 15000 },
      DEFAULT_FISCAL_PARAMS,
    );
    expect(result.fiscaliteTotal).toBeGreaterThan(0);
    expect(result.retraitNet).toBeLessThan(20000);
  });

  it('retourne 0 si aucun gain', () => {
    const result = calculFiscaliteRetrait(
      { envelope: 'AV', montantRetrait: 10000, partGains: 0, partCapital: 10000 },
      DEFAULT_FISCAL_PARAMS,
    );
    expect(result.irSurGains).toBe(0);
  });
});
