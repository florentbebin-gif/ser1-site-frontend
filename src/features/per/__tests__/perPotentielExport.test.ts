import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { calculatePerPotentiel } from '../../../engine/per';
import { DEFAULT_PASS_HISTORY, DEFAULT_PS_SETTINGS, DEFAULT_TAX_SETTINGS } from '../../../constants/settingsDefaults';
import { DEFAULT_COLORS } from '../../../settings/theme';
import { buildPerPotentielXlsxBlob } from '../export/perPotentielExcelExport';
import { buildPerStudyDeck } from '../../../pptx/presets/perDeckBuilder';

const THEME_COLORS = DEFAULT_COLORS;

function makeDeclarant(overrides: Record<string, number | boolean> = {}) {
  return {
    salaires: 0,
    fraisReels: false,
    fraisReelsMontant: 0,
    art62: 0,
    bic: 0,
    retraites: 0,
    fonciersNets: 0,
    autresRevenus: 0,
    cotisationsPer163Q: 0,
    cotisationsPerp: 0,
    cotisationsArt83: 0,
    cotisationsMadelin154bis: 0,
    cotisationsMadelinRetraite: 0,
    abondementPerco: 0,
    cotisationsPrevo: 0,
    ...overrides,
  };
}

const state = {
  mode: 'versement-n' as const,
  avisIrConnu: true,
  situationFamiliale: 'marie' as const,
  nombreParts: 2,
  isole: false,
  mutualisationConjoints: true,
  versementEnvisage: 12000,
};

const result = calculatePerPotentiel({
  mode: state.mode,
  anneeRef: 2025,
  situationFiscale: {
    situationFamiliale: state.situationFamiliale,
    nombreParts: state.nombreParts,
    isole: state.isole,
    declarant1: makeDeclarant({ salaires: 80000 }),
    declarant2: makeDeclarant({ salaires: 30000 }),
  },
  versementEnvisage: state.versementEnvisage,
  mutualisationConjoints: state.mutualisationConjoints,
  passHistory: DEFAULT_PASS_HISTORY,
  taxSettings: DEFAULT_TAX_SETTINGS,
  psSettings: DEFAULT_PS_SETTINGS,
});

describe('PER Potentiel PPTX Export', () => {
  it('builds a valid deck spec with the expected slides', () => {
    const spec = buildPerStudyDeck(
      {
        ...state,
        result,
      },
      THEME_COLORS,
    );

    expect(spec.cover.type).toBe('cover');
    expect(spec.cover.title).toContain('PER');
    expect(spec.slides.some((slide) => slide.type === 'chapter')).toBe(true);
    expect(
      spec.slides.some(
        (slide) => slide.type === 'content' && 'title' in slide && slide.title === 'Cases 2042 simulees',
      ),
    ).toBe(true);
    expect(
      spec.slides.some(
        (slide) => slide.type === 'content' && 'title' in slide && slide.title === 'Impact du versement',
      ),
    ).toBe(true);
  });
});

describe('PER Potentiel Excel Export', () => {
  it('generates a valid XLSX blob with the expected workbook structure', async () => {
    const blob = await buildPerPotentielXlsxBlob(state, result, THEME_COLORS.c1, THEME_COLORS.c7);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);

    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    expect(zip.file('xl/workbook.xml')).toBeTruthy();
    expect(zip.file('xl/worksheets/sheet1.xml')).toBeTruthy();
    expect(zip.file('xl/worksheets/sheet2.xml')).toBeTruthy();
    expect(zip.file('xl/worksheets/sheet3.xml')).toBeTruthy();

    const workbookXml = await zip.file('xl/workbook.xml')?.async('string');
    const sheet1 = await zip.file('xl/worksheets/sheet1.xml')?.async('string');
    const sheet2 = await zip.file('xl/worksheets/sheet2.xml')?.async('string');
    const sheet3 = await zip.file('xl/worksheets/sheet3.xml')?.async('string');
    const xmlPayload = `${workbookXml ?? ''}\n${sheet1 ?? ''}\n${sheet2 ?? ''}\n${sheet3 ?? ''}`;

    expect(xmlPayload).toContain('Synthèse');
    expect(xmlPayload).toContain('Cases 2042');
    expect(xmlPayload).toContain('Hypothèses');
    expect(xmlPayload).toContain('6QR');
    expect(xmlPayload).toContain('public.pass_history');
  });
});
