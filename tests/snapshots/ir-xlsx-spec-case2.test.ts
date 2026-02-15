import { describe, expect, it } from 'vitest';
import { buildXlsxBlob, validateXlsxBlob } from '../../src/utils/xlsxBuilder';
import { DEFAULT_COLORS } from '../../src/settings/theme';
import { snapshotXlsxBlob } from './xlsxSnapshot';

const THEME_COLORS = DEFAULT_COLORS;

describe('snapshots/ir: XLSX workbook spec (case #2)', () => {
  it('buildXlsxBlob() stays stable (structure)', async () => {
    const cell = (v: string | number, style?: string) => ({ v, style });

    const blob = await buildXlsxBlob({
      sheets: [
        {
          name: 'Paramètres',
          rows: [
            [cell('Champ', 'sHeader'), cell('Valeur', 'sHeader')],
            [cell('Année', 'sText'), cell('2025', 'sCenter')],
            [cell('Statut', 'sText'), cell('Couple', 'sCenter')],
          ],
          columnWidths: [28, 24],
        },
        {
          name: 'Synthèse impôts',
          rows: [
            [cell('Indicateur', 'sHeader'), cell('Valeur', 'sHeader')],
            [cell('Revenu imposable', 'sText'), cell(58200, 'sMoney')],
            [cell('TMI', 'sText'), cell(0.3, 'sPercent')],
            [cell('Impôt net', 'sText'), cell(12450, 'sMoney')],
          ],
          columnWidths: [32, 20],
        },
        {
          name: 'Détails calculs',
          rows: [
            [
              cell('Tranche', 'sHeader'),
              cell('Base', 'sHeader'),
              cell('Taux', 'sHeader'),
              cell('Impôt', 'sHeader'),
            ],
            [
              cell('11% tranche 1', 'sText'),
              cell(12000, 'sMoney'),
              cell(0.11, 'sPercent'),
              cell(1320, 'sMoney'),
            ],
            [
              cell('30% tranche 2', 'sText'),
              cell(28000, 'sMoney'),
              cell(0.3, 'sPercent'),
              cell(8400, 'sMoney'),
            ],
          ],
          columnWidths: [28, 16, 12, 16],
        },
        {
          name: 'Notes',
          rows: [
            [cell('Hypothèses', 'sSection')],
            [cell('Revenus capital au PFU : 0', 'sText')],
            [cell('DOM : non', 'sText')],
          ],
          columnWidths: [52],
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
