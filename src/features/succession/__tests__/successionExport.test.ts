/**
 * Succession Export Smoke Tests (P1-02)
 *
 * Verifies that PPTX deck spec builds without crash
 * and that Excel blob generates a valid ZIP (PK header).
 */

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
        civilHighlights: ['Situation familiale: Marié(e)', 'Régime matrimonial: Communauté réduite aux acquêts'],
        devolutionHighlights: ['Réserve / quotité disponible: 2/3 / 1/3'],
        patrimonialHighlights: ['Masse civile de référence: 500 000 €'],
        warningHighlights: ['Module simplifié: validation notariale recommandée'],
      },
      THEME_COLORS,
    );

    expect(spec.cover.type).toBe('cover');
    expect(spec.cover.title).toContain('Succession');
    expect(spec.slides.length).toBeGreaterThanOrEqual(4);
    expect(spec.end.type).toBe('end');

    const synthSlide = spec.slides.find((s) => s.type === 'succession-synthesis');
    expect(synthSlide).toBeDefined();

    const civilSlide = spec.slides.find(
      (s) => s.type === 'content' && 'title' in s && s.title === 'Lecture civile simplifiée',
    );
    expect(civilSlide).toBeDefined();
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
        context: {
          situationFamiliale: 'Marié(e)',
          regimeMatrimonial: 'Communauté réduite aux acquêts',
          pacsConvention: null,
          nbEnfants: 2,
          nbEnfantsNonCommuns: 0,
          testamentActif: false,
          liquidationRegime: 'Communauté réduite aux acquêts',
          predecesApplicable: true,
          predecesDroitsMrDecede: 0,
          predecesDroitsMmeDecedee: 0,
          devolutionReserve: '2/3',
          devolutionQuotiteDisponible: '1/3',
          devolutionLignes: [{ heritier: 'Conjoint survivant', droits: '1/4 en pleine propriété' }],
          masseCivileReference: 400000,
          quotiteDisponibleMontant: 133333.33,
          liberalitesImputeesMontant: 0,
          depassementQuotiteMontant: 0,
          warnings: ['Module simplifié'],
        },
      },
      result.result,
      THEME_COLORS.c1,
    );

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);

    // Verify PK zip header
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer.slice(0, 2));
    expect(bytes[0]).toBe(0x50); // P
    expect(bytes[1]).toBe(0x4b); // K
  });
});
