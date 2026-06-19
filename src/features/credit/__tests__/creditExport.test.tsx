// @vitest-environment jsdom

import JSZip from 'jszip';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreditCalcResult, CreditScheduleRow, CreditState } from '../types';
import { useCreditExports } from '../hooks/useCreditExports';
import { DEFAULT_COLORS } from '@/settings/theme';
import type { StudyDeckSpec } from '@/pptx/theme/types';
import type * as XlsxBuilder from '@/utils/export/xlsxBuilder';

const xlsxMocks = vi.hoisted(() => ({
  downloadXlsx: vi.fn(),
}));

const pptxMocks = vi.hoisted(() => ({
  exportAndDownloadStudyDeck: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/utils/export/xlsxBuilder', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof XlsxBuilder;

  return {
    ...actual,
    downloadXlsx: xlsxMocks.downloadXlsx,
  };
});

vi.mock('@/pptx/export/exportStudyDeck', () => ({
  exportAndDownloadStudyDeck: pptxMocks.exportAndDownloadStudyDeck,
}));

const row: CreditScheduleRow = {
  mois: 1,
  interet: 480,
  assurance: 50,
  amort: 850,
  mensu: 1330,
  mensuTotal: 1380,
  crd: 199150,
  assuranceDeces: 200000,
};

const state: CreditState = {
  startYM: '2026-01',
  assurMode: 'CI',
  creditType: 'amortissable',
  viewMode: 'annuel',
  pret1: {
    capital: 200000,
    duree: 180,
    taux: 3,
    tauxAssur: 0.3,
    quotite: 100,
    type: 'amortissable',
    startYM: '2026-01',
    assurMode: 'CI',
  },
  pret2: null,
  pret3: null,
  lisserPret1: false,
  lissageMode: 'mensu',
  activeTab: 0,
  touched: { capital: false, duree: false },
};

const calc: CreditCalcResult = {
  pret1Rows: [row],
  pret2Rows: [],
  pret3Rows: [],
  agrRows: [row],
  pret1Params: {
    capital: 200000,
    tauxAssur: 0.3,
    assurMode: 'CI',
    duree: 180,
    rAn: 0.03,
    rAss: 0.003,
    r: 0.0025,
    rA: 0.00025,
    type: 'amortissable',
    quotite: 1,
    startYM: '2026-01',
  },
  autresParams: [],
  anyInfine: false,
  pret1IsInfine: false,
  autresIsInfine: [],
  hasPretsAdditionnels: false,
  synthese: {
    totalInterets: 12000,
    totalAssurance: 9000,
    coutTotalCredit: 21000,
    mensualiteTotaleM1: 1330,
    primeAssMensuelle: 50,
    capitalEmprunte: 200000,
    diffDureesMois: 0,
  },
  synthesePeriodes: [{ from: 'Janvier 2026', p1: 1380, p2: 0, p3: 0, monthIndex: 0 }],
  dureeBaseMois: 180,
  dureeLisseMois: 180,
  diffDureesMois: 0,
  mensuBasePret1: 1330,
};

function renderCreditExports({
  stateOverride = state,
  calcOverride = calc,
}: {
  stateOverride?: CreditState;
  calcOverride?: CreditCalcResult;
} = {}) {
  return renderHook(() =>
    useCreditExports({
      state: stateOverride,
      calc: calcOverride,
      themeColors: { c1: DEFAULT_COLORS.c1, c7: DEFAULT_COLORS.c7 },
      cabinetLogo: undefined,
      logoPlacement: undefined,
      pptxColors: DEFAULT_COLORS,
      setExportLoading: vi.fn(),
    }),
  );
}

describe('Credit exports', () => {
  beforeEach(() => {
    vi.stubGlobal('alert', vi.fn());
    xlsxMocks.downloadXlsx.mockClear();
    pptxMocks.exportAndDownloadStudyDeck.mockClear();
  });

  it('genere un XLSX minimal valide sans exception', async () => {
    const { result } = renderCreditExports();

    await act(async () => {
      await result.current.exportExcel();
    });

    expect(xlsxMocks.downloadXlsx).toHaveBeenCalledOnce();
    const [blob, filename] = xlsxMocks.downloadXlsx.mock.calls[0] as [Blob, string];

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
    expect(filename).toMatch(/^simulation-credit-\d{8}\.xlsx$/);

    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const workbookXml = await zip.file('xl/workbook.xml')?.async('string');

    expect(workbookXml).toContain('Paramètres');
    expect(workbookXml).toContain('Résumé');
    expect(workbookXml).toContain('Prêt 1');
  });

  it('genere un deck PPTX minimal avec les slides attendues', async () => {
    const { result } = renderCreditExports();

    await act(async () => {
      await result.current.exportPowerPoint();
    });

    expect(pptxMocks.exportAndDownloadStudyDeck).toHaveBeenCalledOnce();
    const [deck, , filename] = pptxMocks.exportAndDownloadStudyDeck.mock.calls[0] as [
      StudyDeckSpec,
      unknown,
      string,
    ];

    expect(deck.cover.type).toBe('cover');
    expect(deck.slides.some((slide) => slide.type === 'credit-synthesis')).toBe(true);
    expect(deck.slides.some((slide) => slide.type === 'credit-annexe')).toBe(true);
    expect(deck.slides.some((slide) => slide.type === 'credit-amortization')).toBe(true);
    expect(deck.end.type).toBe('end');
    expect(filename).toMatch(/^simulation-credit-\d{8}\.pptx$/);
  });

  it('reprend la synthèse calculée pour le capital global PPTX multi-prêts', async () => {
    const multiState: CreditState = {
      ...state,
      pret2: {
        capital: 50000,
        duree: 120,
        taux: 2.8,
        tauxAssur: 0.2,
        quotite: 100,
        type: 'amortissable',
        startYM: '2026-01',
        assurMode: 'CI',
      },
    };
    const pret2Row: CreditScheduleRow = {
      mois: 1,
      interet: 120,
      assurance: 8,
      amort: 390,
      mensu: 510,
      mensuTotal: 518,
      crd: 49610,
      assuranceDeces: 50000,
    };
    const multiCalc: CreditCalcResult = {
      ...calc,
      pret2Rows: [pret2Row],
      agrRows: [
        {
          ...row,
          interet: 600,
          assurance: 58,
          amort: 1240,
          mensu: 1840,
          mensuTotal: 1898,
          crd: 248760,
          assuranceDeces: 250000,
        },
      ],
      autresParams: [
        {
          ...calc.pret1Params,
          capital: 50000,
          duree: 120,
          tauxAssur: 0.2,
          rAn: 0.028,
          rAss: 0.002,
          r: 0.028 / 12,
          rA: 0.002 / 12,
        },
      ],
      hasPretsAdditionnels: true,
      synthese: {
        ...calc.synthese,
        totalInterets: 14000,
        totalAssurance: 10000,
        coutTotalCredit: 24000,
        capitalEmprunte: 240000,
      },
      synthesePeriodes: [{ from: 'Janvier 2026', p1: 1380, p2: 518, p3: 0, monthIndex: 0 }],
    };

    expect((multiState.pret1?.capital ?? 0) + (multiState.pret2?.capital ?? 0)).toBe(250000);

    const { result } = renderCreditExports({ stateOverride: multiState, calcOverride: multiCalc });

    await act(async () => {
      await result.current.exportPowerPoint();
    });

    const [deck] = pptxMocks.exportAndDownloadStudyDeck.mock.calls[0] as [
      StudyDeckSpec,
      unknown,
      string,
    ];
    const globalSlide = deck.slides.find(
      (
        slide,
      ): slide is Extract<StudyDeckSpec['slides'][number], { type: 'credit-global-synthesis' }> =>
        slide.type === 'credit-global-synthesis',
    );

    expect(globalSlide?.totalCapital).toBe(240000);
    expect(globalSlide?.coutTotalCredit).toBe(24000);
  });
});
