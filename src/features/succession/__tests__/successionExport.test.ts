/**
 * Succession Export Smoke Tests (P1-02)
 *
 * Verifies that PPTX deck spec builds without crash
 * and that Excel blob generates a valid ZIP (PK header).
 */

import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { calculateSuccession } from '../../../engine/succession';
import { buildSuccessionStudyDeck } from '../../../pptx/presets/successionDeckBuilder';
import { DEFAULT_COLORS } from '../../../settings/theme';
import { exportSuccessionXlsx } from '../successionXlsx';

const THEME_COLORS = DEFAULT_COLORS;

describe('Succession PPTX Export', () => {
  it('builds a valid deck spec without crash', () => {
    const result = calculateSuccession({
      actifNetSuccession: 500000,
      heritiers: [
        { lien: 'conjoint', partSuccession: 250000 },
        { lien: 'enfant', partSuccession: 125000 },
        { lien: 'enfant', partSuccession: 125000 },
      ],
    });

    const spec = buildSuccessionStudyDeck(
      {
        actifNetSuccession: result.result.actifNetSuccession,
        totalDroits: result.result.totalDroits,
        tauxMoyenGlobal: result.result.tauxMoyenGlobal,
        heritiers: result.result.detailHeritiers,
        predecesChronologie: {
          applicable: true,
          order: 'epoux1',
          firstDecedeLabel: 'Époux 1',
          secondDecedeLabel: 'Époux 2',
          step1: {
            actifTransmis: 300000,
            partConjoint: 75000,
            partEnfants: 225000,
            droitsEnfants: 12500,
          },
          step2: {
            actifTransmis: 500000,
            partConjoint: 0,
            partEnfants: 500000,
            droitsEnfants: 42000,
          },
          totalDroits: 54500,
          warnings: ['Module simplifié'],
        },
      },
      THEME_COLORS,
    );

    expect(spec.cover.type).toBe('cover');
    expect(spec.cover.title).toContain('Succession');
    expect(spec.slides.length).toBeGreaterThanOrEqual(4);
    expect(spec.end.type).toBe('end');

    const synthSlide = spec.slides.find((s) => s.type === 'succession-synthesis');
    expect(synthSlide).toBeDefined();
    const chronologySlide = spec.slides.find(
      (s) => s.type === 'content' && 'title' in s && s.title === 'Chronologie des décès',
    );
    expect(chronologySlide).toBeDefined();
    if (chronologySlide && 'body' in chronologySlide) {
      expect(chronologySlide.body).toContain('Total cumulé des droits');
      expect(chronologySlide.body).not.toContain('Ordre inverse');
    }
  });

  it('documents direct succession when chronology is not the primary display source', () => {
    const result = calculateSuccession({
      actifNetSuccession: 320000,
      heritiers: [
        { lien: 'enfant', partSuccession: 160000 },
        { lien: 'enfant', partSuccession: 160000 },
      ],
    });

    const spec = buildSuccessionStudyDeck(
      {
        actifNetSuccession: result.result.actifNetSuccession,
        totalDroits: result.result.totalDroits,
        tauxMoyenGlobal: result.result.tauxMoyenGlobal,
        heritiers: result.result.detailHeritiers,
        predecesChronologie: {
          applicable: false,
          order: 'epoux1',
          firstDecedeLabel: 'Défunt(e)',
          secondDecedeLabel: '—',
          step1: null,
          step2: null,
          totalDroits: result.result.totalDroits,
          warnings: ['Succession directe du défunt simulé.'],
        },
      },
      THEME_COLORS,
    );

    const chronologySlide = spec.slides.find(
      (s) => s.type === 'content' && 'title' in s && s.title === 'Chronologie des décès',
    );
    expect(chronologySlide).toBeDefined();
    if (chronologySlide && 'body' in chronologySlide) {
      expect(chronologySlide.body).toContain('Chronologie retenue comme source principale: Non');
      expect(chronologySlide.body).toContain('Chronologie 2 décès non retenue comme source principale');
    }
  });
});

describe('Succession Excel Export', () => {
  it('generates a valid XLSX blob (PK header)', async () => {
    const result = calculateSuccession({
      actifNetSuccession: 400000,
      heritiers: [
        { lien: 'enfant', partSuccession: 200000 },
        { lien: 'enfant', partSuccession: 200000 },
      ],
    });

    const blob = await exportSuccessionXlsx(
      {
        actifNetSuccession: 400000,
        nbHeritiers: 2,
        heritiers: [
          { lien: 'enfant', partSuccession: 200000 },
          { lien: 'enfant', partSuccession: 200000 },
        ],
      },
      result.result,
      THEME_COLORS.c1,
      'Simulation-Succession',
      {
        applicable: true,
        order: 'epoux1',
        firstDecedeLabel: 'Époux 1',
        secondDecedeLabel: 'Époux 2',
        step1: {
          actifTransmis: 250000,
          partConjoint: 62500,
          partEnfants: 187500,
          droitsEnfants: 12000,
        },
        step2: {
          actifTransmis: 380000,
          partConjoint: 0,
          partEnfants: 380000,
          droitsEnfants: 31500,
        },
        totalDroits: 43500,
        warnings: ['Avertissement de test'],
      },
    );

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);

    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer.slice(0, 2));
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);

    const zip = await JSZip.loadAsync(buffer);
    expect(zip.file('xl/workbook.xml')).toBeTruthy();
    expect(zip.file('xl/worksheets/sheet5.xml')).toBeTruthy();
    const workbookXml = await zip.file('xl/workbook.xml')?.async('string');
    expect(workbookXml).toContain('Chronologie');
  });

  it('generates a simplified chainage-only XLSX when no direct succession result is provided', async () => {
    const blob = await exportSuccessionXlsx(
      {
        actifNetSuccession: 600000,
        nbHeritiers: 2,
        heritiers: [],
      },
      null,
      THEME_COLORS.c1,
      'Simulation-Succession',
      {
        applicable: true,
        order: 'epoux2',
        firstDecedeLabel: 'Époux 2',
        secondDecedeLabel: 'Époux 1',
        step1: {
          actifTransmis: 260000,
          partConjoint: 65000,
          partEnfants: 195000,
          droitsEnfants: 9500,
        },
        step2: {
          actifTransmis: 405000,
          partConjoint: 0,
          partEnfants: 405000,
          droitsEnfants: 33200,
        },
        totalDroits: 42700,
        warnings: ['Module simplifié'],
      },
    );

    expect(blob).toBeInstanceOf(Blob);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    expect(zip.file('xl/worksheets/sheet1.xml')).toBeTruthy();
    expect(zip.file('xl/worksheets/sheet2.xml')).toBeTruthy();
    expect(zip.file('xl/worksheets/sheet3.xml')).toBeFalsy();
    const workbookXml = await zip.file('xl/workbook.xml')?.async('string');
    expect(workbookXml).toContain('Chronologie');
    expect(workbookXml).toContain('Hypothèses');
  });

  it('exports the updated direct succession chronology wording in XLSX', async () => {
    const result = calculateSuccession({
      actifNetSuccession: 320000,
      heritiers: [
        { lien: 'enfant', partSuccession: 160000 },
        { lien: 'enfant', partSuccession: 160000 },
      ],
    });

    const blob = await exportSuccessionXlsx(
      {
        actifNetSuccession: 320000,
        nbHeritiers: 2,
        heritiers: [
          { lien: 'enfant', partSuccession: 160000 },
          { lien: 'enfant', partSuccession: 160000 },
        ],
      },
      result.result,
      THEME_COLORS.c1,
      'Simulation-Succession',
      {
        applicable: false,
        order: 'epoux1',
        firstDecedeLabel: 'Défunt(e)',
        secondDecedeLabel: '—',
        step1: null,
        step2: null,
        totalDroits: result.result.totalDroits,
        warnings: ['Succession directe du défunt simulé.'],
      },
    );

    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const chronologySheet = await zip.file('xl/worksheets/sheet4.xml')?.async('string');
    const sharedStrings = await zip.file('xl/sharedStrings.xml')?.async('string');
    const xmlPayload = `${chronologySheet ?? ''}\n${sharedStrings ?? ''}`;

    expect(xmlPayload).toContain('Chronologie retenue comme source principale');
    expect(xmlPayload).toContain('Chronologie 2 décès non retenue comme source principale pour la situation saisie');
  });
});
