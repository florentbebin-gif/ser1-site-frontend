/**
 * PR-02/03 — Infrastructure de tests des 6 régimes matrimoniaux
 *
 * Couverture :
 * - Section 1 : Mapping des régimes (buildSuccessionPredecesAnalysis)
 *   T-1 à T-5 : CL, CU, SB (directs), PA et CMA (approximations avec warning)
 *   BUG-6 corrigé (PR-03) : SB+SA → separation_biens + warning société d'acquêts
 *
 * - Section 2 : Calcul de masse successorale (computeFirstEstate)
 *   CL, CU, SB — formules exactes avec tous les cas d'ordre et d'attribution
 *
 * - Section 3 : Chainage successoral complet (buildSuccessionChainageAnalysis)
 *   CL, CU + attribution intégrale, SB, PA (approx SB), CMA (approx CL)
 *
 * Sources juridiques :
 *   Art. 1400+ CC (CL), Art. 1526 CC (CU), Art. 1536 CC (SB)
 *   Art. 1569–1581 CC (PA), art. 1387 CC (SB+SA)
 */

import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG } from '../../../engine/civil';
import type { SuccessionLiquidationContext } from '../successionDraft';
import { buildSuccessionChainageAnalysis } from '../successionChainage';
import { computeFirstEstate } from '../successionChainageEstateSplit';
import { buildSuccessionPredecesAnalysis } from '../successionPredeces';
import { makeCivilMarie as makeCivil, makeLiquidation as makeLiquidationBase } from './fixtures';

// ─── Factories ───────────────────────────────────────────────────────────────

function makeLiquidationWithAssets(
  overrides: Partial<SuccessionLiquidationContext> = {},
): SuccessionLiquidationContext {
  return makeLiquidationBase({
    actifEpoux1: 300_000,
    actifEpoux2: 200_000,
    actifCommun: 400_000,
    nbEnfants: 2,
    ...overrides,
  });
}

function makeEnfants(n: number, rattachement: 'commun' | 'epoux1' | 'epoux2' = 'commun') {
  return Array.from({ length: n }, (_, i) => ({ id: `E${i + 1}`, rattachement }));
}

// ─── Section 1 : Mapping des régimes ─────────────────────────────────────────

describe('Infrastructure régimes matrimoniaux', () => {
  describe('1 — Mapping des régimes (successionPredeces)', () => {
    // T-1 : Communauté légale
    it('communaute_legale : mapping direct, regimeUsed correct, pas de warning', () => {
      const analysis = buildSuccessionPredecesAnalysis(
        makeCivil({ regimeMatrimonial: 'communaute_legale' }),
        makeLiquidationWithAssets(),
        DEFAULT_DMTG,
      );
      expect(analysis.applicable).toBe(true);
      expect(analysis.regimeUsed).toBe('communaute_legale');
      expect(analysis.warnings).toHaveLength(0);
    });

    // T-2 : Communauté universelle
    it('communaute_universelle : mapping direct, regimeUsed correct, pas de warning d\'approximation', () => {
      const analysis = buildSuccessionPredecesAnalysis(
        makeCivil({ regimeMatrimonial: 'communaute_universelle' }),
        makeLiquidationWithAssets(),
        DEFAULT_DMTG,
      );
      expect(analysis.applicable).toBe(true);
      expect(analysis.regimeUsed).toBe('communaute_universelle');
      // CU est un mapping direct : pas de warning d'approximation vers un autre régime
      // (des warnings informatifs du moteur de calcul restent possibles)
      expect(analysis.warnings.some((w) => w.includes('approximation'))).toBe(false);
    });

    // T-3 : Séparation de biens
    it('separation_biens : mapping direct, regimeUsed correct, pas de warning', () => {
      const analysis = buildSuccessionPredecesAnalysis(
        makeCivil({ regimeMatrimonial: 'separation_biens' }),
        makeLiquidationWithAssets({ actifCommun: 0 }),
        DEFAULT_DMTG,
      );
      expect(analysis.applicable).toBe(true);
      expect(analysis.regimeUsed).toBe('separation_biens');
      expect(analysis.warnings).toHaveLength(0);
    });

    // T-4 : Participation aux acquêts — approximation assumée (art. 1569–1581 CC)
    it('participation_acquets : approximé en separation_biens avec warning créance', () => {
      const analysis = buildSuccessionPredecesAnalysis(
        makeCivil({ regimeMatrimonial: 'participation_acquets' }),
        makeLiquidationWithAssets({ actifCommun: 0 }),
        DEFAULT_DMTG,
      );
      expect(analysis.applicable).toBe(true);
      expect(analysis.regimeUsed).toBe('separation_biens');
      expect(analysis.warnings.some((w) => w.includes('Participation aux acqu'))).toBe(true);
      expect(analysis.warnings.some((w) => w.includes('approximation'))).toBe(true);
    });

    // T-5 : Communauté de meubles et acquêts — approximation assumée (régime avant 1966)
    it('communaute_meubles_acquets : approximé en communaute_legale avec warning historique', () => {
      const analysis = buildSuccessionPredecesAnalysis(
        makeCivil({ regimeMatrimonial: 'communaute_meubles_acquets' }),
        makeLiquidationWithAssets(),
        DEFAULT_DMTG,
      );
      expect(analysis.applicable).toBe(true);
      expect(analysis.regimeUsed).toBe('communaute_legale');
      expect(analysis.warnings.some((w) => w.includes('meubles et acqu'))).toBe(true);
      expect(analysis.warnings.some((w) => w.includes('approximation'))).toBe(true);
    });

    // BUG-6 corrigé en PR-03 : SB+SA mappe vers separation_biens + warning bloquant
    it("separation_biens_societe_acquets : mappe vers separation_biens + warning societe d'acquets", () => {
      const analysis = buildSuccessionPredecesAnalysis(
        makeCivil({ regimeMatrimonial: 'separation_biens_societe_acquets' }),
        makeLiquidationWithAssets({ actifCommun: 0 }),
        DEFAULT_DMTG,
      );
      expect(analysis.applicable).toBe(true);
      expect(analysis.regimeUsed).toBe('separation_biens');
      expect(analysis.warnings.some((w) => w.toLowerCase().includes("société d'acquêts"))).toBe(true);
    });
  });

  // ─── Section 2 : Calcul de masse successorale ──────────────────────────────

  describe('2 — Masse successorale (computeFirstEstate)', () => {
    const liq = makeLiquidationWithAssets();
    // actifEpoux1=300k, actifEpoux2=200k, actifCommun=400k, nbEnfants=2

    // Communauté légale — art. 1400+ CC
    it('communaute_legale : actifDécédé + 50 % actifCommun (attribution par défaut)', () => {
      expect(computeFirstEstate('communaute_legale', 'epoux1', liq)).toBe(
        300_000 + 400_000 * 0.5, // 500_000
      );
    });

    it('communaute_legale : attributionBiensCommunsPct=80 → 20 % au décédé', () => {
      expect(computeFirstEstate('communaute_legale', 'epoux1', liq, 80)).toBe(
        300_000 + 400_000 * 0.2, // 380_000
      );
    });

    it('communaute_legale : attributionBiensCommunsPct=0 → 100 % au décédé', () => {
      expect(computeFirstEstate('communaute_legale', 'epoux1', liq, 0)).toBe(
        300_000 + 400_000, // 700_000
      );
    });

    it('communaute_legale : ordre epoux2 décédé', () => {
      expect(computeFirstEstate('communaute_legale', 'epoux2', liq)).toBe(
        200_000 + 400_000 * 0.5, // 400_000
      );
    });

    // Communauté universelle — art. 1526 CC
    it('communaute_universelle : 50 % par défaut (attribution au survivant)', () => {
      expect(computeFirstEstate('communaute_universelle', 'epoux1', liq)).toBe(
        (300_000 + 200_000 + 400_000) * 0.5, // 450_000
      );
    });

    it("communaute_universelle : même masse quelle que soit l'ordre de décès", () => {
      const ep1 = computeFirstEstate('communaute_universelle', 'epoux1', liq);
      const ep2 = computeFirstEstate('communaute_universelle', 'epoux2', liq);
      expect(ep1).toBe(ep2);
    });

    it("communaute_universelle : attributionBiensCommunsPct=80 → 20 % au décédé", () => {
      const defaut = computeFirstEstate('communaute_universelle', 'epoux1', liq);
      const custom = computeFirstEstate('communaute_universelle', 'epoux1', liq, 80);
      expect(custom).toBe((300_000 + 200_000 + 400_000) * 0.2); // 180_000
      expect(custom).not.toBe(defaut);
    });

    // Séparation de biens — art. 1536 CC
    it('separation_biens : uniquement actif propre du défunt (ep1)', () => {
      expect(computeFirstEstate('separation_biens', 'epoux1', liq)).toBe(300_000);
    });

    it('separation_biens : uniquement actif propre du défunt (ep2)', () => {
      expect(computeFirstEstate('separation_biens', 'epoux2', liq)).toBe(200_000);
    });

    it("separation_biens : actifCommun ignore meme s'il existe dans le modele", () => {
      // En SB pur, actifCommun devrait etre 0. Le modele l'exclut du calcul.
      const avecCommun = computeFirstEstate('separation_biens', 'epoux1', {
        ...liq,
        actifCommun: 500_000,
      });
      expect(avecCommun).toBe(300_000);
    });

    it('separation_biens : actifs nuls retournent 0', () => {
      expect(
        computeFirstEstate('separation_biens', 'epoux1', makeLiquidationWithAssets({ actifEpoux1: 0, actifCommun: 0 })),
      ).toBe(0);
    });
  });

  // ─── Section 3 : Chainage successoral complet ──────────────────────────────

  describe('3 — Chainage successoral complet (buildSuccessionChainageAnalysis)', () => {
    // T-1 : Communauté légale avec 2 enfants
    it('communaute_legale : actifTransmis = actifDécédé + 50 % actifCommun', () => {
      const analysis = buildSuccessionChainageAnalysis({
        civil: makeCivil({ regimeMatrimonial: 'communaute_legale' }),
        liquidation: makeLiquidationWithAssets(),
        regimeUsed: 'communaute_legale',
        order: 'epoux1',
        dmtgSettings: DEFAULT_DMTG,
        enfantsContext: makeEnfants(2),
        familyMembers: [],
      });
      expect(analysis.applicable).toBe(true);
      expect(analysis.step1).not.toBeNull();
      // firstEstate = 300k + 400k × 0.5 = 500k
      expect(analysis.step1?.actifTransmis).toBe(500_000);
    });

    it('communaute_legale : ordre inverse (ep2 décédé) — actifTransmis cohérent', () => {
      const analysis = buildSuccessionChainageAnalysis({
        civil: makeCivil({ regimeMatrimonial: 'communaute_legale' }),
        liquidation: makeLiquidationWithAssets(),
        regimeUsed: 'communaute_legale',
        order: 'epoux2',
        dmtgSettings: DEFAULT_DMTG,
        enfantsContext: makeEnfants(2),
        familyMembers: [],
      });
      // firstEstate = 200k + 400k × 0.5 = 400k
      expect(analysis.step1?.actifTransmis).toBe(400_000);
    });

    // T-2 : Communauté universelle + attribution intégrale
    it('communaute_universelle + attribution intégrale : tout au survivant, 0 au step 1', () => {
      const analysis = buildSuccessionChainageAnalysis({
        civil: makeCivil({ regimeMatrimonial: 'communaute_universelle' }),
        liquidation: makeLiquidationWithAssets(),
        regimeUsed: 'communaute_universelle',
        order: 'epoux1',
        dmtgSettings: DEFAULT_DMTG,
        enfantsContext: makeEnfants(2),
        familyMembers: [],
        patrimonial: {
          attributionIntegrale: true,
          donationEntreEpouxActive: false,
          donationEntreEpouxOption: 'usufruit_total',
          preciputMontant: 0,
        },
      });
      // attribution intégrale : toute la communauté va au survivant
      // sans stipulation contraire, pas de propres → step1 = 0
      expect(analysis.step1?.actifTransmis).toBe(0);
      expect(analysis.step1?.partEnfants).toBe(0);
      expect(analysis.step1?.droitsEnfants).toBe(0);
      expect(analysis.step2?.actifTransmis).toBe(900_000);
      expect(analysis.warnings.some((w) => w.includes('attribution integrale'))).toBe(true);
    });

    it('communaute_universelle sans attribution intégrale : droits calculés au step 1 (50 % par défaut)', () => {
      const analysis = buildSuccessionChainageAnalysis({
        civil: makeCivil({ regimeMatrimonial: 'communaute_universelle' }),
        liquidation: makeLiquidationWithAssets(),
        regimeUsed: 'communaute_universelle',
        order: 'epoux1',
        dmtgSettings: DEFAULT_DMTG,
        enfantsContext: makeEnfants(2),
        familyMembers: [],
        patrimonial: {
          attributionIntegrale: false,
          donationEntreEpouxActive: false,
          donationEntreEpouxOption: 'usufruit_total',
          preciputMontant: 0,
        },
      });
      // CU default 50% attribution: firstEstate = 900k * 50% = 450k
      expect(analysis.step1?.actifTransmis).toBe(450_000);
      expect(analysis.step1?.partEnfants).toBeGreaterThan(0);
    });

    // T-3 : Séparation de biens
    it('separation_biens : actifTransmis = uniquement actif propre du défunt', () => {
      const analysis = buildSuccessionChainageAnalysis({
        civil: makeCivil({ regimeMatrimonial: 'separation_biens' }),
        liquidation: makeLiquidationWithAssets({ actifCommun: 0 }),
        regimeUsed: 'separation_biens',
        order: 'epoux1',
        dmtgSettings: DEFAULT_DMTG,
        enfantsContext: makeEnfants(2),
        familyMembers: [],
      });
      expect(analysis.step1?.actifTransmis).toBe(300_000);
    });

    // T-4 : Participation aux acquêts — approximée en SB
    it('participation_acquets (approx SB) : résultat chainage identique à SB pur', () => {
      const commonInput = {
        liquidation: makeLiquidationWithAssets({ actifCommun: 0 }),
        order: 'epoux1' as const,
        dmtgSettings: DEFAULT_DMTG,
        enfantsContext: makeEnfants(2),
        familyMembers: [] as [],
      };
      const analysisSb = buildSuccessionChainageAnalysis({
        civil: makeCivil({ regimeMatrimonial: 'separation_biens' }),
        regimeUsed: 'separation_biens',
        ...commonInput,
      });
      // PA → mapped to SB before calling chainage
      const analysisPA = buildSuccessionChainageAnalysis({
        civil: makeCivil({ regimeMatrimonial: 'participation_acquets' }),
        regimeUsed: 'separation_biens',
        ...commonInput,
      });
      expect(analysisPA.step1?.actifTransmis).toBe(analysisSb.step1?.actifTransmis);
      expect(analysisPA.totalDroits).toBe(analysisSb.totalDroits);
    });

    // T-5 : Communauté de meubles et acquêts — approximée en CL
    it('communaute_meubles_acquets (approx CL) : résultat chainage identique à CL', () => {
      const commonInput = {
        liquidation: makeLiquidationWithAssets(),
        order: 'epoux1' as const,
        dmtgSettings: DEFAULT_DMTG,
        enfantsContext: makeEnfants(2),
        familyMembers: [] as [],
      };
      const analysisCl = buildSuccessionChainageAnalysis({
        civil: makeCivil({ regimeMatrimonial: 'communaute_legale' }),
        regimeUsed: 'communaute_legale',
        ...commonInput,
      });
      // CMA → mapped to CL before calling chainage
      const analysisCma = buildSuccessionChainageAnalysis({
        civil: makeCivil({ regimeMatrimonial: 'communaute_meubles_acquets' }),
        regimeUsed: 'communaute_legale',
        ...commonInput,
      });
      expect(analysisCma.step1?.actifTransmis).toBe(analysisCl.step1?.actifTransmis);
      expect(analysisCma.totalDroits).toBe(analysisCl.totalDroits);
    });

    // Non-régression : chainage applicable pour les 3 régimes supportés
    it.each([
      ['communaute_legale' as const, 'communaute_legale' as const],
      ['communaute_universelle' as const, 'communaute_universelle' as const],
      ['separation_biens' as const, 'separation_biens' as const],
    ])(
      'non-régression : chainage applicable pour %s',
      (regimeMatrimonial, regimeUsed) => {
        const analysis = buildSuccessionChainageAnalysis({
          civil: makeCivil({ regimeMatrimonial }),
          liquidation: makeLiquidationWithAssets({ actifCommun: regimeUsed === 'separation_biens' ? 0 : 400_000 }),
          regimeUsed,
          order: 'epoux1',
          dmtgSettings: DEFAULT_DMTG,
          enfantsContext: makeEnfants(2),
          familyMembers: [],
        });
        expect(analysis.applicable).toBe(true);
        expect(analysis.step1).not.toBeNull();
        expect(analysis.step2).not.toBeNull();
        expect(analysis.totalDroits).toBeGreaterThanOrEqual(0);
      },
    );
  });
});
