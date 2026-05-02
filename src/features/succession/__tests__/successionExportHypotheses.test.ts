import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { buildSuccessionStudyDeck } from '@/pptx/presets/successionDeckBuilder';
import { DEFAULT_COLORS } from '@/settings/theme';
import { DEFAULT_DMTG } from '../../../engine/civil';
import { buildSuccessionAvFiscalAnalysis } from '../successionAvFiscal';
import { buildSuccessionChainageAnalysis } from '../successionChainage';
import { buildSuccessionFiscalSnapshot } from '../successionFiscalContext';
import { buildSuccessionPerFiscalAnalysis } from '../successionPerFiscal';
import { buildSuccessionPrevoyanceFiscalAnalysis } from '../successionPrevoyanceFiscal';
import { buildSuccessionExportActiveHypotheses } from '../export/successionExportHypotheses';
import { exportSuccessionXlsx } from '../export/successionXlsx';
import { buildSuccessionChainageExportPayload } from '../hooks/useSuccessionOutcomeExportPayload';
import { makeLiquidation } from './fixtures';

const THEME_COLORS = DEFAULT_COLORS;

function decodeXmlText(text: string): string {
  return text
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

async function readSheetSharedText(zip: JSZip, sheetPath: string): Promise<string> {
  const sheetXml = await zip.file(sheetPath)?.async('string');
  const sharedStringsXml = await zip.file('xl/sharedStrings.xml')?.async('string');
  expect(sheetXml).toBeTruthy();

  const sharedStrings = [...(sharedStringsXml ?? '').matchAll(/<si><t(?: xml:space="preserve")?>(.*?)<\/t><\/si>/g)]
    .map((match) => decodeXmlText(match[1] ?? ''));
  const sharedStringIds = [...(sheetXml ?? '').matchAll(/<c[^>]*t="s"[^>]*>\s*<v>(\d+)<\/v>\s*<\/c>/g)]
    .map((match) => Number(match[1]));
  const inlineStrings = [...(sheetXml ?? '').matchAll(/<c[^>]*t="inlineStr"[^>]*>\s*<is><t>(.*?)<\/t><\/is>\s*<\/c>/g)]
    .map((match) => decodeXmlText(match[1] ?? ''));

  return [
    ...sharedStringIds.map((index) => sharedStrings[index] ?? ''),
    ...inlineStrings,
  ].join('\n');
}

describe('Succession export - hypothèses actives', () => {
  it('restitue un PACS sans chaînage dans l’onglet Hypothèses XLSX', async () => {
    const blob = await exportSuccessionXlsx(
      {
        actifNetSuccession: 240000,
        nbHeritiers: 0,
        heritiers: [],
      },
      null,
      THEME_COLORS.c1,
      'Simulation-Succession',
      {
        applicable: false,
        order: 'epoux1',
        firstDecedeLabel: 'Partenaire 1',
        secondDecedeLabel: 'Partenaire 2',
        step1: null,
        step2: null,
        totalDroits: 0,
        warnings: ['PACS: absence de vocation successorale légale automatique sans testament.'],
      },
    );

    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const hypothesesText = await readSheetSharedText(zip, 'xl/worksheets/sheet2.xml');

    expect(hypothesesText).toContain('PACS: absence de vocation successorale légale automatique sans testament.');
    expect(hypothesesText).toContain('chronologie 2 décès');
  });

  it('restitue récompenses et passif affecté dans l’onglet Hypothèses XLSX', async () => {
    const blob = await exportSuccessionXlsx(
      {
        actifNetSuccession: 500000,
        nbHeritiers: 0,
        heritiers: [],
      },
      null,
      THEME_COLORS.c1,
      'Simulation-Succession',
      {
        applicable: true,
        order: 'epoux1',
        firstDecedeLabel: 'Époux 1',
        secondDecedeLabel: 'Époux 2',
        step1: null,
        step2: null,
        interMassClaims: {
          configured: true,
          totalRequestedAmount: 80000,
          totalAppliedAmount: 60000,
          claims: [],
        },
        affectedLiabilities: {
          totalAmount: 30000,
          byPocket: [{ pocket: 'communaute', amount: 30000 }],
        },
        totalDroits: 0,
        warnings: [],
      },
    );

    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const hypothesesText = await readSheetSharedText(zip, 'xl/worksheets/sheet2.xml');

    expect(hypothesesText).toContain('récompenses et créances entre masses');
    expect(hypothesesText).toContain('passifs affectés');
  });

  it("restitue société d'acquêts dans les hypothèses actives", () => {
    const items = buildSuccessionExportActiveHypotheses([], {
      applicable: true,
      societeAcquets: { configured: true, totalValue: 400000 },
    });
    expect(items.some((item) => item.includes("Société d’acquêts"))).toBe(true);
  });

  it('restitue le préciput cible dans les hypothèses actives', () => {
    const items = buildSuccessionExportActiveHypotheses([], {
      applicable: true,
      preciput: { mode: 'cible', appliedAmount: 50000, usesGlobalFallback: false, selections: [] },
    });
    expect(items.some((item) => item.includes('préciput cible'))).toBe(true);
  });

  it("restitue société d'acquêts et préciput via buildSuccessionChainageExportPayload → exportSuccessionXlsx", async () => {
    // 1. Construire le chainageAnalysis via le moteur réel (SA active + préciput global)
    const civil = {
      situationMatrimoniale: 'marie',
      regimeMatrimonial: 'separation_biens_societe_acquets',
      pacsConvention: 'separation',
    } as const;
    const liquidation = makeLiquidation({ actifEpoux1: 300_000, actifEpoux2: 200_000, actifCommun: 0, nbEnfants: 2 });
    const chainageAnalysis = buildSuccessionChainageAnalysis({
      civil,
      liquidation,
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      societeAcquetsNetValue: 400_000,
      patrimonial: {
        societeAcquets: { active: true, liquidationMode: 'quotes', quoteEpoux1Pct: 50, quoteEpoux2Pct: 50, attributionSurvivantPct: 0 },
        preciputMode: 'global',
        preciputMontant: 50_000,
      },
    });

    // SA et préciput présents dans le chainageAnalysis
    expect(chainageAnalysis.societeAcquets?.configured).toBe(true);
    expect(chainageAnalysis.preciput?.appliedAmount).toBeGreaterThan(0);

    // 2. Construire le payload via la couche export (bridge page → export)
    const snapshot = buildSuccessionFiscalSnapshot(null);
    const zeroFiscal = buildSuccessionAvFiscalAnalysis([], civil, [], [], snapshot);
    const zeroPer = buildSuccessionPerFiscalAnalysis([], civil, [], [], snapshot, new Date());
    const zeroPrevoyance = buildSuccessionPrevoyanceFiscalAnalysis([], civil, [], [], snapshot, new Date());
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

    // 3. Export XLSX et vérification des hypothèses
    const blob = await exportSuccessionXlsx(
      { actifNetSuccession: 500_000, nbHeritiers: 0, heritiers: [] },
      null,
      THEME_COLORS.c1,
      'Simulation-Succession',
      payload,
    );

    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const hypothesesText = await readSheetSharedText(zip, 'xl/worksheets/sheet2.xml');

    expect(hypothesesText).toContain('liquidation simplifiée de la poche');  // SA hypothesis
    expect(hypothesesText).toContain('préciput');                             // préciput hypothesis
  });

  it('restitue la participation aux acquêts dans la slide Hypothèses PPTX', () => {
    const spec = buildSuccessionStudyDeck(
      {
        actifNetSuccession: 500000,
        totalDroits: 0,
        tauxMoyenGlobal: 0,
        heritiers: [],
        predecesChronologie: {
          applicable: true,
          order: 'epoux1',
          firstDecedeLabel: 'Époux 1',
          secondDecedeLabel: 'Époux 2',
          step1: null,
          step2: null,
          participationAcquets: {
            configured: true,
            active: true,
            useCurrentAssetsAsFinalPatrimony: true,
            patrimoineOriginaireEpoux1: 100000,
            patrimoineOriginaireEpoux2: 120000,
            patrimoineFinalEpoux1: 300000,
            patrimoineFinalEpoux2: 180000,
            acquetsEpoux1: 200000,
            acquetsEpoux2: 60000,
            creditor: 'epoux2',
            debtor: 'epoux1',
            quoteAppliedPct: 50,
            creanceAmount: 70000,
            firstEstateAdjustment: -70000,
          },
          totalDroits: 0,
          warnings: [],
        },
      },
      THEME_COLORS,
    );

    const hypothesesSlide = spec.slides.find((slide) => slide.type === 'succession-hypotheses');

    expect(hypothesesSlide).toBeDefined();
    if (hypothesesSlide?.type === 'succession-hypotheses') {
      expect(hypothesesSlide.items.join(' ')).toContain('Participation aux acquêts');
    }
  });

  it('warning CMA (successionChainage.ts:263) inclus dans les hypotheses exportees', () => {
    // Non-régression : si le warning CMA est supprimé du moteur, ce test détecte la régression.
    // Chaîne couverte : successionChainage.ts:263 → chainageAnalysis.warnings
    //                 → buildSuccessionExportActiveHypotheses (successionExportHypotheses.ts:85)
    const chainageAnalysis = buildSuccessionChainageAnalysis({
      civil: { situationMatrimoniale: 'marie', regimeMatrimonial: 'communaute_meubles_acquets', pacsConvention: 'separation' },
      liquidation: makeLiquidation({ actifEpoux1: 200_000, actifEpoux2: 150_000, actifCommun: 100_000, nbEnfants: 2 }),
      regimeUsed: 'communaute_legale',  // CMA est calculé comme CL
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
    });

    expect(chainageAnalysis.warnings.some((w) => w.includes('Communaute de meubles'))).toBe(true);

    const items = buildSuccessionExportActiveHypotheses([], {
      applicable: chainageAnalysis.applicable ?? true,
      warnings: [...chainageAnalysis.warnings],
    });
    expect(items.some((h) => h.includes('Communaute de meubles'))).toBe(true);
  });
});
