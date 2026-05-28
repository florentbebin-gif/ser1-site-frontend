import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { DEFAULT_COLORS } from '@/settings/theme';
import { buildTresorerieXlsxBlob } from '../export/tresorerieExcelExport';
import { INPUTS, KPIS, ROWS } from './tresorerieExport.fixtures';

describe('Exports Trésorerie société — XLSX', () => {
  it('génère un XLSX valide avec les onglets Projection, Revenus associés puis Hypothèses', async () => {
    const blob = await buildTresorerieXlsxBlob(
      ROWS,
      KPIS,
      INPUTS,
      DEFAULT_COLORS.c1,
      DEFAULT_COLORS.c7,
    );

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);

    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const workbookXml = await zip.file('xl/workbook.xml')?.async('string');
    const projectionXml = await zip.file('xl/worksheets/sheet1.xml')?.async('string');
    const revenusXml = await zip.file('xl/worksheets/sheet2.xml')?.async('string');
    const hypothesesXml = await zip.file('xl/worksheets/sheet3.xml')?.async('string');

    expect(workbookXml).toContain('Projection');
    expect(workbookXml).toContain('Revenus associés');
    expect(workbookXml).toContain('Structure société');
    expect(workbookXml).toContain('Hypothèses');
    expect(projectionXml).toContain('Trésorerie fin d&apos;année');
    expect(projectionXml).toContain('Déficit bancaire vs solde minimum + BFR');
    expect(revenusXml).toContain('Remboursement CCA');
    expect(hypothesesXml).toContain('Taux maximum déductible');
    expect(hypothesesXml).toContain('BFR inclus dans le seuil de sécurité');
  });

  it('mentionne la trésorerie conservée sur compte bancaire quand la matrice Excel est vide', async () => {
    const blob = await buildTresorerieXlsxBlob(
      ROWS,
      KPIS,
      {
        ...INPUTS,
        allocationMatrix: {
          ...INPUTS.allocationMatrix,
          pockets: [],
        },
      },
      DEFAULT_COLORS.c1,
      DEFAULT_COLORS.c7,
    );

    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const structureXml = await zip.file('xl/worksheets/sheet4.xml')?.async('string');

    expect(structureXml).toContain('Trésorerie conservée sur compte bancaire');
    expect(structureXml).toContain('Parcours de revenus');
    expect(structureXml).toContain('Besoin complémentaire');
    expect(structureXml).toContain('Court terme');
    expect(structureXml).toContain('Moyen terme');
    expect(structureXml).toContain('Long terme');
  });
});
