import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { buildSuccessionStudyDeck } from '@/pptx/presets/successionDeckBuilder';
import { buildSuccessionHypothesesLayout } from '@/pptx/slides/buildSuccessionHypotheses';
import { DEFAULT_COLORS } from '@/settings/theme';
import { DEFAULT_DMTG } from '../../../engine/succession/civil';
import { buildSuccessionAvFiscalAnalysis } from '../successionAvFiscal';
import { buildSuccessionChainageAnalysis } from '../successionChainage';
import { buildSuccessionFiscalSnapshot } from '../successionFiscalContext';
import { buildSuccessionPerFiscalAnalysis } from '../successionPerFiscal';
import { buildSuccessionPrevoyanceFiscalAnalysis } from '../successionPrevoyanceFiscal';
import {
  buildSuccessionExportActiveHypotheses,
  buildSuccessionExportHypothesesGroups,
} from '@/utils/export/successionExportHypotheses';
import { exportSuccessionXlsx } from '../export/successionXlsx';
import { buildSuccessionChainageExportPayload } from '../hooks/useSuccessionOutcomeExportPayload';
import { buildSuccessionFamilyContextExport } from '../hooks/useSuccessionOutcomePptx.helpers';
import { makeCivil, makeLiquidation } from './fixtures';
import { buildSuccessionPatrimonialAnalysis } from '../successionPatrimonial';
import { DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT } from '../successionDraft';
import { buildSuccessionAssumptions } from '../successionAssumptions';

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

  const sharedStrings = [
    ...(sharedStringsXml ?? '').matchAll(/<si><t(?: xml:space="preserve")?>(.*?)<\/t><\/si>/g),
  ].map((match) => decodeXmlText(match[1] ?? ''));
  const sharedStringIds = [
    ...(sheetXml ?? '').matchAll(/<c[^>]*t="s"[^>]*>\s*<v>(\d+)<\/v>\s*<\/c>/g),
  ].map((match) => Number(match[1]));
  const inlineStrings = [
    ...(sheetXml ?? '').matchAll(/<c[^>]*t="inlineStr"[^>]*>\s*<is><t>(.*?)<\/t><\/is>\s*<\/c>/g),
  ].map((match) => decodeXmlText(match[1] ?? ''));

  return [...sharedStringIds.map((index) => sharedStrings[index] ?? ''), ...inlineStrings].join(
    '\n',
  );
}

async function getSheetXmlByName(zip: JSZip, sheetName: string): Promise<string | null> {
  const workbook = (await zip.file('xl/workbook.xml')?.async('string')) ?? '';
  const idMatch = workbook.match(new RegExp(`<sheet[^>]+name="${sheetName}"[^>]+r:id="(rId\\d+)"`));
  if (!idMatch) return null;
  const rels = (await zip.file('xl/_rels/workbook.xml.rels')?.async('string')) ?? '';
  const targetMatch = rels.match(new RegExp(`Id="${idMatch[1]}"[^>]+Target="([^"]+)"`));
  if (!targetMatch) return null;
  const target = targetMatch[1].replace(/^\/xl\//, '');
  return (await zip.file(`xl/${target}`)?.async('string')) ?? null;
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

  it('résume les actes donation-partage et l’usufruit successif dans les dispositions PPTX', () => {
    const familyContext = buildSuccessionFamilyContextExport({
      civilContext: makeCivil({ situationMatrimoniale: 'marie' }),
      devolutionContext: {
        nbEnfantsNonCommuns: 0,
        choixLegalConjointSansDDV: null,
        testamentsBySide: {
          epoux1: {
            active: false,
            dispositionType: null,
            beneficiaryRef: null,
            quotePartPct: 100,
            particularLegacies: [],
          },
          epoux2: {
            active: false,
            dispositionType: null,
            beneficiaryRef: null,
            quotePartPct: 100,
            particularLegacies: [],
          },
        },
        ascendantsSurvivantsBySide: { epoux1: false, epoux2: false },
      },
      patrimonialContext: DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
      donationsContext: [],
      donationPartageActs: [
        {
          id: 'dp-1',
          date: '2020-06',
          donateur: 'epoux1',
          avecReserveUsufruit: true,
          usufruitSuccessif: true,
          usufruitSuccessifBeneficiaire: 'epoux2',
          lots: [
            { id: 'lot-1', enfantId: 'E1', valeur: 300_000, accepted: true },
            { id: 'lot-2', enfantId: 'E2', valeur: 200_000, accepted: true },
            { id: 'lot-3', enfantId: 'E3', valeur: 100_000, accepted: true },
          ],
          soultes: [
            { id: 's1', payeurEnfantId: 'E1', receveurEnfantId: 'E3', montant: 100_000 },
            { id: 's2', payeurEnfantId: 'E1', receveurEnfantId: 'E2', montant: 50_000 },
          ],
        },
      ],
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
        { id: 'E3', rattachement: 'commun' },
      ],
      familyMembers: [],
    });

    expect(familyContext.dispositions).toContain(
      'Donations antérieures : 1 donation-partage : 3 lots, 2 soultes pour 150 000 EUR',
    );
    expect(familyContext.dispositions).toContain(
      'Usufruit successif au conjoint/partenaire sur 1 donation',
    );
  });

  it('place le groupe d’hypothèses le plus dense à droite dans la slide PPTX', () => {
    const layout = buildSuccessionHypothesesLayout([
      { title: 'Points d’attention', items: ['Attention courte.'] },
      {
        title: 'Hypothèses fiscales',
        items: [
          'Barèmes DMTG et abattements appliqués depuis les paramètres de l’application.',
          'Usufruit successif selon CGI 669, CGI 796-0 bis et CGI 1133.',
          'Donation-partage : valeur gelée CCV 1078.',
        ],
      },
      { title: 'Limites de l’étude', items: ['Liquidation notariale exhaustive non modélisée.'] },
      { title: 'Cadre de calcul', items: ['Succession directe simulée.'] },
    ]);

    const fiscal = layout.find((group) => group.title === 'Hypothèses fiscales');
    const leftGroups = layout.filter((group) => group.title !== 'Hypothèses fiscales');

    expect(fiscal?.emphasis).toBe('large');
    expect(fiscal?.rect.h).toBeGreaterThan(leftGroups[0].rect.h);
    expect(fiscal?.rect.x).toBeGreaterThan(leftGroups[0].rect.x);
    expect(leftGroups).toHaveLength(3);
    expect(leftGroups.every((group) => group.emphasis === 'compact')).toBe(true);
  });

  it('garde le plus gros volume de texte à droite même si ce n’est pas fiscal', () => {
    const layout = buildSuccessionHypothesesLayout([
      {
        title: 'Points d’attention',
        items: [
          'Avertissement long sur la situation civile, la chronologie, les dates manquantes et les limites de projection.',
          'Second avertissement long sur les données incohérentes détectées dans la simulation exportée.',
        ],
      },
      {
        title: 'Hypothèses fiscales',
        items: [
          'Barème DMTG appliqué avec les abattements, les paramètres transmis au module fiscal et les règles de rappel disponibles.',
        ],
      },
      { title: 'Limites de l’étude', items: ['Limite courte.'] },
      { title: 'Cadre de calcul', items: ['Cadre court.'] },
    ]);

    const largeGroup = layout.find((group) => group.emphasis === 'large');
    const compactTitles = layout
      .filter((group) => group.emphasis === 'compact')
      .map((group) => group.title);

    expect(largeGroup?.title).toBe('Points d’attention');
    expect(compactTitles).toEqual(['Limites de l’étude', 'Cadre de calcul', 'Hypothèses fiscales']);
  });

  it('donne plus de hauteur au cadre gauche le plus chargé', () => {
    const layout = buildSuccessionHypothesesLayout([
      { title: 'Points d’attention', items: ['Attention courte.'] },
      {
        title: 'Hypothèses fiscales',
        items: [
          'Barème DMTG, donation-partage, usufruit successif, CGI 669, CGI 1133, CGI 796-0 bis, CCV 1078.',
          'Valorisation fiscale des transmissions et rappels de donations avec les paramètres transmis au module.',
          'Exonérations du conjoint ou partenaire PACS et réunion au nu-propriétaire sans droits nouveaux.',
        ],
      },
      {
        title: 'Limites de l’étude',
        items: [
          'La lecture civile reste simplifiée et ne remplace pas une liquidation notariale exhaustive.',
          'L’intégration chiffrée fine du rapport civil, de la réduction et de l’imputation sur la réserve n’est pas modélisée.',
          'Le résultat est indicatif et doit être confirmé par une analyse patrimoniale et notariale.',
        ],
      },
      { title: 'Cadre de calcul', items: ['Cadre court.'] },
    ]);

    const limits = layout.find((group) => group.title === 'Limites de l’étude');
    const attention = layout.find((group) => group.title === 'Points d’attention');
    const cadre = layout.find((group) => group.title === 'Cadre de calcul');

    expect(limits?.emphasis).toBe('compact');
    expect(limits?.rect.h).toBeGreaterThan(attention?.rect.h ?? 0);
    expect(limits?.rect.h).toBeGreaterThan(cadre?.rect.h ?? 0);
  });
});
