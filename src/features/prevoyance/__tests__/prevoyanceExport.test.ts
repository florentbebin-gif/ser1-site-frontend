import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { DEFAULT_COLORS } from '@/settings/theme';
import { buildPrevoyanceStudyDeck } from '@/pptx/presets/prevoyanceDeckBuilder';
import { buildPrevoyanceXlsxBlob, buildPrevoyanceXlsxSheets } from '../export/prevoyanceXlsx';
import type { PrevoyanceContractDraft } from '@/domain/prevoyance/types';
import {
  buildPrevoyanceExportData,
  type PrevoyanceExportData,
} from '../export/prevoyanceExportData';
import { validateXlsxBlob } from '@/utils/export/xlsxBuilder';

const exportData: PrevoyanceExportData = {
  situation: {
    kind: 'individuel',
    kindLabel: 'TNS / libéral',
    regimeLabel: 'SSI artisan commerçant',
    familyStatus: 'marie',
    childrenCount: 2,
    revenuImposable: 80_000,
    salaireBrutAnnuel: 0,
    salaireNetImposable: 0,
    ancienneteYears: 0,
    annualBase: 80_000,
    referenceAnnual: 80_000,
  },
  regimeStack: [
    {
      code: 'ssi-artisan-commercant',
      label: 'SSI artisan commerçant',
      caisse: 'SSI',
    },
  ],
  contractAggregationMode: 'compare',
  contracts: [
    {
      id: 'contrat-1',
      name: 'Contrat 1',
      kind: 'individuel',
      indemnisationLabel: 'Arrêt forfaitaire · Invalidité forfaitaire',
      arretSummary: '0-1095 j : 180 €/j',
      invaliditeSummary: '33-66% : taux/66 x 30000 €',
      decesCapital: 240_000,
      decesSummary: 'Capital 240000 €',
      fraisProAmount: 36_000,
      fraisProSummary: '36000 €, franchise 30 j, durée 1 an(s)',
      cotisationAnnual: 1_800,
      cotisationDontMadelin: 1_200,
      cotisationSummary: '1800 € / an, dont 1200 € Madelin',
    },
  ],
  coverage: {
    arret: [
      {
        key: 'net-percu',
        label: 'Net perçu',
        totalPct: 100,
        segments: [{ kind: 'reference', label: 'Net perçu', valuePct: 100 }],
      },
      {
        key: '0-1095',
        label: '0 à 1095 j',
        totalPct: 82,
        segments: [
          { kind: 'ro', label: 'Régime obligatoire', valuePct: 12 },
          { kind: 'contrat', label: 'Contrats de prévoyance', valuePct: 70 },
        ],
      },
    ],
    invalidite: [
      {
        key: '66',
        label: '66 %',
        totalPct: 95,
        segments: [
          { kind: 'ro', label: 'Régime obligatoire', valuePct: 20 },
          { kind: 'contrat', label: 'Contrats de prévoyance', valuePct: 75 },
        ],
      },
    ],
    decesTarget: 240_000,
    decesRegimeCapital: 9_612,
    decesPrivateCapital: 240_000,
    decesCapital: 240_000,
    fraisProEstimated: 36_000,
    fraisProCovered: 36_000,
  },
  assumptions: ['Hypothèse export test.'],
};

describe('exports Prévoyance', () => {
  it('construit un deck PowerPoint avec les sections attendues', () => {
    const deck = buildPrevoyanceStudyDeck(exportData, DEFAULT_COLORS);

    expect(deck.cover.title).toBe('Simulation Prévoyance');
    expect(deck.slides.map((slide) => slide.type)).toContain('chapter');
    expect(deck.slides.map((slide) => slide.type)).toContain('prevoyance-ro-chart');
    expect(deck.slides.map((slide) => slide.type)).toContain('prevoyance-contracts-table');
    expect(deck.slides).toHaveLength(3);
    expect(deck.end.type).toBe('end');
  });

  it('construit un workbook Excel valide avec les onglets métier', async () => {
    const sheets = buildPrevoyanceXlsxSheets(exportData);
    expect(sheets.map((sheet) => sheet.name)).toEqual([
      'Situation',
      'Contrats',
      'Couverture',
      'Cotisations',
      'Hypothèses',
    ]);

    const blob = await buildPrevoyanceXlsxBlob(exportData, DEFAULT_COLORS.c1, DEFAULT_COLORS.c7);
    expect(blob.size).toBeGreaterThan(0);
    await expect(validateXlsxBlob(blob)).resolves.toBe(true);

    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    expect(zip.file('xl/workbook.xml')).toBeTruthy();
    expect(zip.file('xl/worksheets/sheet5.xml')).toBeTruthy();
  });

  it('calcule les frais généraux depuis le montant sans dépendre d’un toggle caché', () => {
    const contract = {
      id: 'contrat-1',
      name: 'Contrat 1',
      kind: 'individuel',
      indemnisation: 'forfaitaire',
      arret: { franchises: { accident: 0, hospitalisation: 0, maladie: 0 }, paliers: [] },
      invalidite: { indemnisation: 'forfaitaire', paliers: [] },
      deces: {
        capital: 0,
        doublementAccident: false,
        doubleEffet: false,
        renteConjoint: 0,
        renteEducation: 0,
      },
      fraisPro: { franchiseDays: 15, amount: 12_000, maxDurationYears: 1 },
      cotisation: { montantAnnuel: 0, dontMadelin: 0 },
    } satisfies PrevoyanceContractDraft;

    const data = buildPrevoyanceExportData({
      situation: {
        birthDate: '1980-01-01',
        familyStatus: 'celibataire',
        childrenCount: 0,
        regimeCode: 'ssi-artisan-commercant',
        revenuImposable: 80_000,
        salaireBrutAnnuel: 0,
        salaireNetImposable: 0,
        ancienneteYears: 0,
      },
      kind: 'individuel',
      regimeStack: [],
      maintien: null,
      contracts: [contract],
      contractAggregationMode: 'compare',
      deathTarget: { mode: 'multiple', multiple: 3, manualAmount: 0 },
      annualBase: 80_000,
      referenceAnnual: 80_000,
      fraisGenerauxAssiette: 24_000,
    });

    expect(data.coverage.fraisProCovered).toBe(12_000);
    expect(data.contracts[0]?.fraisProAmount).toBe(12_000);
  });
});
