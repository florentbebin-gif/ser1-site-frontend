/**
 * Tests smoke des exports Succession.
 */

import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG } from '../../../engine/civil';
import { buildSuccessionStudyDeck } from '../../../pptx/presets/successionDeckBuilder';
import { buildSuccessionAvFiscalAnalysis } from '../successionAvFiscal';
import { buildSuccessionChainageAnalysis } from '../successionChainage';
import { buildSuccessionFiscalSnapshot } from '../successionFiscalContext';
import { buildSuccessionPerFiscalAnalysis } from '../successionPerFiscal';
import { buildSuccessionPrevoyanceFiscalAnalysis } from '../successionPrevoyanceFiscal';
import { buildSuccessionChainageExportPayload } from '../hooks/useSuccessionOutcomeExportPayload';
import { makeLiquidation } from './fixtures';
import { THEME_COLORS } from './successionExport.fixtures';

describe('Succession export - chainage PPTX', () => {
  it('PPTX via buildSuccessionChainageExportPayload : societe acquets et preciput visibles dans les slides', () => {
    // Construit le payload depuis le moteur réel (SA active + préciput global = 50k)
    // Vérifie que la chaîne chainageAnalysis → payload → buildSuccessionStudyDeck
    // transmet correctement les données SA, préciput et bénéficiaires
    const civil = {
      situationMatrimoniale: 'marie',
      regimeMatrimonial: 'separation_biens_societe_acquets',
      pacsConvention: 'separation',
    } as const;
    const liquidation = makeLiquidation({
      actifEpoux1: 300_000,
      actifEpoux2: 200_000,
      actifCommun: 0,
      nbEnfants: 2,
    });
    const chainageAnalysis = buildSuccessionChainageAnalysis({
      civil,
      liquidation,
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      societeAcquetsNetValue: 400_000,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      familyMembers: [],
      patrimonial: {
        societeAcquets: {
          active: true,
          liquidationMode: 'quotes',
          quoteEpoux1Pct: 50,
          quoteEpoux2Pct: 50,
          attributionSurvivantPct: 0,
        },
        preciputMode: 'global',
        preciputMontant: 50_000,
      },
    });

    const snapshot = buildSuccessionFiscalSnapshot(null);
    const zeroFiscal = buildSuccessionAvFiscalAnalysis([], civil, [], [], snapshot);
    const zeroPer = buildSuccessionPerFiscalAnalysis([], civil, [], [], snapshot, new Date());
    const zeroPrevoyance = buildSuccessionPrevoyanceFiscalAnalysis(
      [],
      civil,
      [],
      [],
      snapshot,
      new Date(),
    );
    const payload = buildSuccessionChainageExportPayload({
      displayUsesChainage: true,
      chainageAnalysis,
      assuranceVieByAssure: { epoux1: 0, epoux2: 0 },
      perByAssure: { epoux1: 0, epoux2: 0 },
      prevoyanceByAssure: { epoux1: 0, epoux2: 0 },
      assuranceVieTotale: 0,
      perTotale: 0,
      prevoyanceTotale: 0,
      avFiscalAnalysis: zeroFiscal,
      perFiscalAnalysis: zeroPer,
      prevoyanceFiscalAnalysis: zeroPrevoyance,
      derivedTotalDroits: chainageAnalysis.totalDroits,
      isPacsed: false,
      directDisplayWarnings: [],
    });

    const spec = buildSuccessionStudyDeck(
      {
        actifNetSuccession: 500_000,
        totalDroits: chainageAnalysis.totalDroits,
        tauxMoyenGlobal: 0,
        heritiers: [],
        predecesChronologie: payload,
      },
      THEME_COLORS,
    );

    const chronologySlide = spec.slides.find((slide) => slide.type === 'succession-chronology');
    expect(chronologySlide).toBeDefined();
    if (chronologySlide?.type === 'succession-chronology') {
      expect(chronologySlide.steps[0].beneficiaries.length).toBeGreaterThanOrEqual(2);
      const conjointBenef = chronologySlide.steps[0].beneficiaries.find(
        (b) => b.label === 'Conjoint survivant',
      );
      expect(conjointBenef).toBeDefined();
      expect(conjointBenef?.exonerated).toBe(true);
      // Au moins un bénéficiaire non-exonéré a un montant brut non nul
      expect(
        chronologySlide.steps[0].beneficiaries.some((b) => !b.exonerated && b.gross !== '—'),
      ).toBe(true);
      expect('notes' in chronologySlide).toBe(false);
    }

    const hypothesesSlide = spec.slides.find((slide) => slide.type === 'succession-hypotheses');
    expect(hypothesesSlide).toBeDefined();
    if (hypothesesSlide?.type === 'succession-hypotheses') {
      expect(hypothesesSlide.items.some((h) => h.toLowerCase().includes('acquets'))).toBe(true);
      expect(hypothesesSlide.items.some((h) => h.toLowerCase().includes('preciput'))).toBe(true);
      expect(hypothesesSlide.items.some((h) => h.toLowerCase().includes('simplifie'))).toBe(true);
    }
  });
});
