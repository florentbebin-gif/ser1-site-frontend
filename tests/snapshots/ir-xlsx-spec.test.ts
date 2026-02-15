import { describe, expect, it } from 'vitest';
import { buildXlsxBlob, validateXlsxBlob } from '../../src/utils/xlsxBuilder';
import { DEFAULT_COLORS } from '../../src/settings/theme';
import { snapshotXlsxBlob } from './xlsxSnapshot';

const THEME_COLORS = DEFAULT_COLORS;

describe('snapshots/ir: XLSX workbook spec', () => {
  it('buildXlsxBlob() stays stable (structure)', async () => {
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
            [
              cell("11% de 11 294 à 28 797 €", 'sText'),
              cell(17503, 'sMoney'),
              cell(0.11, 'sPercent'),
              cell(1925.33, 'sMoney'),
            ],
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

    const snapshot = await snapshotXlsxBlob(blob);
    expect(snapshot).toMatchSnapshot();
  });
});
