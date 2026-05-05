import { describe, expect, it } from 'vitest';
import { simulateTresorerie } from '../../../engine/tresorerie/simulateTresorerie';
import type { TresoInputs, TresoFiscalParams } from '../../../engine/tresorerie/types';

const PARAMS: TresoFiscalParams = {
  isNormalRate: 0.25,
  isReducedRate: 0.15,
  isReducedThreshold: 42500,
  motherDaughterStandardQpfcRate: 0.05,
  motherDaughterGroupQpfcRate: 0.01,
  pfuRateIR: 0.128,
  psRate: 0.172,
  pfuTotal: 0.30,
  dividendesAbattement: 0.40,
  irScale: [],
};

const BASE: TresoInputs = {
  typeCreation: 'newco',
  ageActuel: 50,
  ageRetraite: 65,
  besoinsRetraiteAnnuels: 0,
  fraisStructureAnnuels: 3000,
  ccaInitial: 0,
  apportAnnuelCCA: 16600,
  dureeActiveAns: 15,
  tresorerieInitiale: 0,
  reservesInitiales: 0,
  anneeCivileDebut: 2025,
};

describe('Trésorerie société IS — projection moteur et KPIs', () => {
  describe('structure de la projection', () => {
    it('produit exactement 40 lignes pour horizon=40', () => {
      const rows = simulateTresorerie(BASE, PARAMS, 40);
      expect(rows).toHaveLength(40);
    });

    it('la numérotation year commence à 1', () => {
      const rows = simulateTresorerie(BASE, PARAMS, 5);
      expect(rows[0].year).toBe(1);
      expect(rows[4].year).toBe(5);
    });
  });

  describe('IS et résultat', () => {
    it('IS = 0 quand la base imposable est négative (charges > revenus)', () => {
      // Sans revenus de placement, le résultat est -fraisStructure → IS = 0
      const rows = simulateTresorerie(BASE, PARAMS, 1);
      expect(rows[0].is).toBe(0);
      expect(rows[0].revenuDistrib).toBe(0);
    });
  });

  describe('CCA cumulé', () => {
    it('augmente de apportAnnuelCCA chaque année en phase active', () => {
      const rows = simulateTresorerie(BASE, PARAMS, 3);
      expect(rows[0].ccaCumule).toBe(16600);
      expect(rows[1].ccaCumule).toBe(33200);
      expect(rows[2].ccaCumule).toBe(49800);
    });
  });

  describe('Poche de capitalisation — IS latent', () => {
    it('isLatentCapi = 0 sans poche de capitalisation', () => {
      const rows = simulateTresorerie(BASE, PARAMS, 5);
      expect(rows.every(r => r.isLatentCapi === 0)).toBe(true);
    });

    it('isLatentCapi croît chaque année avec les gains (non décaissé)', () => {
      const inputs: TresoInputs = {
        ...BASE,
        capitalisation: {
          montant: 200000,
          rendementAnnuel: 0.04,
          dureeAns: 20,
          rachatAuTerme: false,
          repetitionAuTerme: false,
        },
      };
      const rows = simulateTresorerie(inputs, PARAMS, 5);
      expect(rows[0].isLatentCapi).toBeGreaterThan(0);
      expect(rows[4].isLatentCapi).toBeGreaterThan(rows[0].isLatentCapi);
    });
  });

  describe('Alerte dividendes — cas warning', () => {
    it('alerteDividendesSuperieursCapacite = false sans dividendes distribués', () => {
      const rows = simulateTresorerie(BASE, PARAMS, 1);
      expect(rows[0].alerteDividendesSuperieursCapacite).toBe(false);
    });

    it('alerte active quand creditIR génère des dividendes supérieurs à la capacité', () => {
      const inputs: TresoInputs = {
        ...BASE,
        creditIR: {
          actif: true,
          capital: 500000,
          taux: 0.035,
          dureeMois: 120,
          dateDebut: '2025-01',
        },
      };
      const rows = simulateTresorerie(inputs, PARAMS, 1);
      // 500k€ de crédit IR → annuité annuelle ≈ 59k€ bruts nécessaires
      // Capacité distribuable ≈ 0 (pas de revenus, frais de structure)
      expect(rows[0].alerteDividendesSuperieursCapacite).toBe(true);
    });
  });
});
