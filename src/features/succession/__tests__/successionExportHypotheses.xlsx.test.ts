import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG } from '@/engine/succession/civil';
import {
  buildSuccessionExportActiveHypotheses,
  buildSuccessionExportHypothesesGroups,
} from '@/utils/export/successionExportHypotheses';
import { exportSuccessionXlsx } from '../export/successionXlsx';
import { buildSuccessionChainageExportPayload } from '../hooks/useSuccessionOutcomeExportPayload';
import { buildSuccessionAssumptions } from '../successionAssumptions';
import { buildSuccessionAvFiscalAnalysis } from '../successionAvFiscal';
import { buildSuccessionChainageAnalysis } from '../successionChainage';
import { DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT } from '../successionDraft';
import { buildSuccessionFiscalSnapshot } from '../successionFiscalContext';
import { buildSuccessionPatrimonialAnalysis } from '../successionPatrimonial';
import { buildSuccessionPerFiscalAnalysis } from '../successionPerFiscal';
import { buildSuccessionPrevoyanceFiscalAnalysis } from '../successionPrevoyanceFiscal';
import { makeCivil, makeLiquidation } from './fixtures';
import {
  getSheetXmlByName,
  readSheetSharedText,
  THEME_COLORS,
} from './successionExportHypotheses.testUtils';

describe('Succession export - hypothèses actives XLSX', () => {
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

    expect(hypothesesText).toContain(
      'PACS: absence de vocation successorale légale automatique sans testament.',
    );
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
    expect(items.some((item) => item.includes('Société d’acquêts'))).toBe(true);
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

    // SA et préciput présents dans le chainageAnalysis
    expect(chainageAnalysis.societeAcquets?.configured).toBe(true);
    expect(chainageAnalysis.preciput?.appliedAmount).toBeGreaterThan(0);

    // 2. Construire le payload via la couche export (bridge page → export)
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

    expect(hypothesesText).toContain('liquidation simplifiée de la poche'); // SA hypothesis
    expect(hypothesesText).toContain('préciput'); // préciput hypothesis
  });

  it('warning CMA (successionChainage.ts:263) inclus dans les hypotheses exportees', () => {
    // Non-régression : si le warning CMA est supprimé du moteur, ce test détecte la régression.
    // Chaîne couverte : successionChainage.ts:263 → chainageAnalysis.warnings
    //                 → buildSuccessionExportActiveHypotheses (src/utils/export/successionExportHypotheses.ts)
    const chainageAnalysis = buildSuccessionChainageAnalysis({
      civil: {
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'communaute_meubles_acquets',
        pacsConvention: 'separation',
      },
      liquidation: makeLiquidation({
        actifEpoux1: 200_000,
        actifEpoux2: 150_000,
        actifCommun: 100_000,
        nbEnfants: 2,
      }),
      regimeUsed: 'communaute_legale', // CMA est calculé comme CL
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

  it('T3 — Donation-partage via chaîne complète → export hypothèses', async () => {
    const patrimonialAnalysis = buildSuccessionPatrimonialAnalysis(
      makeCivil({ situationMatrimoniale: 'marie' }),
      500_000,
      1,
      DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
      [
        {
          id: 'd1',
          type: 'donation_partage',
          montant: 100_000,
          donataire: 'enfant-1',
          date: '2020-01',
          donateur: 'epoux1',
          donSommeArgentExonere: false,
        },
      ],
    );

    const assumptions = buildSuccessionAssumptions({
      fiscalSnapshot: buildSuccessionFiscalSnapshot(null),
      attentions: [],
      hasInterMassClaims: false,
      hasAffectedLiabilities: false,
      hasDonationsPartage: patrimonialAnalysis.donationsPartagees > 0,
      hasUsufruitSuccessif: true,
      usufruitSuccessifAnalysis: {
        transmissions: [
          {
            donationId: 'd-us',
            beneficiaire: 'epoux2',
            valeurBase: 200_000,
            tauxUsufruit: 0.3,
            valeurUsufruit: 60_000,
            droits: 0,
          },
        ],
        reunions1133: [{ donationId: 'd-us', droits: 0 }],
        warnings: [],
      },
    });

    const hypotheses = buildSuccessionExportActiveHypotheses(assumptions, null);
    const groups = buildSuccessionExportHypothesesGroups(hypotheses);

    expect(patrimonialAnalysis.donationsPartagees).toBe(100_000);
    expect(hypotheses.some((h) => h.includes('CCV 1078'))).toBe(true);
    expect(hypotheses.some((h) => h.includes('CGI 669'))).toBe(true);
    expect(hypotheses.some((h) => h.includes('CGI 1133'))).toBe(true);
    expect(hypotheses.some((h) => h.includes('CGI 796-0 bis'))).toBe(true);
    expect(
      hypotheses.some((h) => h.includes('60') && h.includes('000') && h.includes('droits')),
    ).toBe(true);
    expect(groups.map((group) => group.title)).toContain('Hypothèses fiscales');
    expect(groups.map((group) => group.title)).toContain('Limites de l’étude');

    const blob = await exportSuccessionXlsx(
      { actifNetSuccession: 500_000, nbHeritiers: 1, heritiers: [] },
      null,
      THEME_COLORS.c1,
      'test',
      {
        applicable: false,
        order: 'epoux1',
        firstDecedeLabel: 'Époux 1',
        secondDecedeLabel: 'Époux 2',
        step1: null,
        step2: null,
        totalDroits: 0,
        warnings: [],
      },
      undefined,
      hypotheses,
    );

    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const hypoXml = (await getSheetXmlByName(zip, 'Hypothèses')) ?? '';
    const strXml = (await zip.file('xl/sharedStrings.xml')?.async('string')) ?? '';
    expect(hypoXml + strXml).toContain('CCV 1078');
    expect(hypoXml + strXml).toContain('CGI 1133');
    expect(hypoXml + strXml).toContain('60');
  });
});
