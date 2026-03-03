/**
 * Succession Export Smoke Tests (P1-02)
 *
 * Verifies that PPTX deck spec builds without crash
 * and that Excel blob generates a valid ZIP (PK header).
 */

import JSZip from 'jszip';
import { describe, it, expect } from 'vitest';
import { buildSuccessionStudyDeck } from '../../../pptx/presets/successionDeckBuilder';
import { exportSuccessionXlsx } from '../successionXlsx';
import { calculateSuccession } from '../../../engine/succession';
import { DEFAULT_COLORS } from '../../../settings/theme';

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
          totalDroitsOrdreInverse: 56000,
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
        totalDroitsOrdreInverse: 45200,
        warnings: ['Avertissement de test'],
      },
    );

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);

    // Verify PK zip header
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer.slice(0, 2));
    expect(bytes[0]).toBe(0x50); // P
    expect(bytes[1]).toBe(0x4b); // K

    const zip = await JSZip.loadAsync(buffer);
    expect(zip.file('xl/workbook.xml')).toBeTruthy();
    expect(zip.file('xl/worksheets/sheet5.xml')).toBeTruthy();
    const workbookXml = await zip.file('xl/workbook.xml')?.async('string');
    expect(workbookXml).toContain('Prédécès');
  });
});
