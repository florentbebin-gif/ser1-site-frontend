/**
 * IR Export Smoke Tests (PR-4)
 *
 * Verifies IR export pipelines generate non-empty outputs
 * with minimal stable structure (PPTX spec + XLSX zip).
 */

import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { buildIrStudyDeck } from '../../../pptx/presets/irDeckBuilder';
import { DEFAULT_COLORS } from '../../../settings/theme';
import { buildXlsxBlob, validateXlsxBlob } from '../../../utils/xlsxBuilder';

const THEME_COLORS = DEFAULT_COLORS;

describe('IR PPTX Export', () => {
  it('builds a valid IR deck spec with expected minimal structure', () => {
    const spec = buildIrStudyDeck(
      {
        taxableIncome: 82000,
        partsNb: 2,
        taxablePerPart: 41000,
        tmiRate: 30,
        irNet: 9700,
        totalTax: 13600,
        pfuIr: 1200,
        cehr: 800,
        cdhr: 0,
        psFoncier: 1200,
        psDividends: 700,
        psTotal: 1900,
        status: 'couple',
        childrenCount: 1,
        location: 'metropole',
        bracketsDetails: [
          { label: '0% jusqu\'à 11 294 €', base: 11294, rate: 0, tax: 0 },
          { label: '11% de 11 294 à 28 797 €', base: 17503, rate: 11, tax: 1925.33 },
        ],
      },
      THEME_COLORS,
    );

    expect(spec.cover.type).toBe('cover');
    expect(spec.cover.title).toContain('Impôt sur le Revenu');
    expect(spec.slides.length).toBeGreaterThanOrEqual(4);
    expect(spec.end.type).toBe('end');

    const hasSynthesis = spec.slides.some((s) => s.type === 'ir-synthesis');
    const hasAnnexe = spec.slides.some((s) => s.type === 'ir-annexe');
    expect(hasSynthesis).toBe(true);
    expect(hasAnnexe).toBe(true);
  });
});

describe('IR Excel Export', () => {
  it('generates a valid XLSX blob with stable minimal workbook structure', async () => {
    const cell = (v: string | number, style?: string) => ({ v, style });

    const blob = await buildXlsxBlob({
      sheets: [
        {
          name: 'Paramètres',
          rows: [
            [cell('Champ', 'sHeader'), cell('Valeur', 'sHeader')],
            [cell('Barème', 'sText'), cell('2025', 'sText')],
          ],
          columnWidths: [36, 22],
        },
        {
          name: 'Synthèse impôts',
          rows: [
            [cell('Indicateur', 'sHeader'), cell('Valeur', 'sHeader')],
            [cell('Impôt sur le revenu', 'sText'), cell(9700, 'sMoney')],
            [cell('Imposition totale', 'sText'), cell(13600, 'sMoney')],
          ],
          columnWidths: [36, 22],
        },
        {
          name: 'Détails calculs',
          rows: [
            [cell('Poste', 'sHeader'), cell('Base', 'sHeader'), cell('Taux', 'sHeader'), cell('Impôt', 'sHeader')],
            [cell('11% de 11 294 à 28 797 €', 'sText'), cell(17503, 'sMoney'), cell(0.11, 'sPercent'), cell(1925.33, 'sMoney')],
          ],
          columnWidths: [36, 18, 14, 18],
        },
      ],
      headerFill: THEME_COLORS.c1,
      sectionFill: THEME_COLORS.c7,
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
    await expect(validateXlsxBlob(blob)).resolves.toBe(true);

    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    expect(zip.file('xl/workbook.xml')).toBeTruthy();
    expect(zip.file('xl/styles.xml')).toBeTruthy();
    expect(zip.file('xl/worksheets/sheet1.xml')).toBeTruthy();
    expect(zip.file('xl/worksheets/sheet2.xml')).toBeTruthy();
    expect(zip.file('xl/worksheets/sheet3.xml')).toBeTruthy();
  });
});
