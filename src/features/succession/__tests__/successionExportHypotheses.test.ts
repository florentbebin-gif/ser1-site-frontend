import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { buildSuccessionStudyDeck } from '@/pptx/presets/successionDeckBuilder';
import { DEFAULT_COLORS } from '@/settings/theme';
import { exportSuccessionXlsx } from '../export/successionXlsx';

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
});
