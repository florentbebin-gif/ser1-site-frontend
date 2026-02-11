/**
 * PER Export Smoke Tests (P1-03)
 *
 * Verifies that PPTX deck spec builds without crash
 * and that Excel blob generates a valid ZIP (PK header).
 */

import { describe, it, expect } from 'vitest';
import { buildPerStudyDeck } from '../../../pptx/presets/perDeckBuilder';
import { exportPerXlsx } from '../perXlsx';
import { calculatePER } from '../../../engine/per';

const THEME_COLORS = {
  c1: '#1B3A35', c2: '#2D5A50', c3: '#3D7A6B', c4: '#4D9A86',
  c5: '#5DBAA1', c6: '#996600', c7: '#F5F0EB', c8: '#D4CFC8',
  c9: '#6B6560', c10: '#2B2520',
};

describe('PER PPTX Export', () => {
  it('builds a valid deck spec without crash', () => {
    const result = calculatePER({
      versementAnnuel: 5000,
      dureeAnnees: 20,
      tmi: 30,
      rendementAnnuel: 3,
      fraisGestion: 0.8,
    });

    const r = result.result;
    const spec = buildPerStudyDeck(
      {
        versementAnnuel: r.versementAnnuel,
        dureeAnnees: r.dureeAnnees,
        tmi: r.tmi,
        capitalTerme: r.capitalTerme,
        economieImpotTotale: r.economieImpotTotale,
        renteAnnuelleEstimee: r.renteAnnuelleEstimee,
        renteMensuelleEstimee: r.renteMensuelleEstimee,
        capitalNetSortie: r.capitalNetSortie,
        tauxRendementInterne: r.tauxRendementInterne,
      },
      THEME_COLORS,
    );

    expect(spec.cover.type).toBe('cover');
    expect(spec.cover.title).toContain('PER');
    expect(spec.slides.length).toBeGreaterThanOrEqual(4);
    expect(spec.end.type).toBe('end');

    const synthSlide = spec.slides.find((s) => s.type === 'per-synthesis');
    expect(synthSlide).toBeDefined();
  });
});

describe('PER Excel Export', () => {
  it('generates a valid XLSX blob (PK header)', async () => {
    const result = calculatePER({
      versementAnnuel: 5000,
      dureeAnnees: 20,
      tmi: 30,
      rendementAnnuel: 3,
      fraisGestion: 0.8,
    });

    const blob = await exportPerXlsx(
      {
        versementAnnuel: 5000,
        dureeAnnees: 20,
        tmi: 30,
        rendementAnnuel: 3,
        fraisGestion: 0.8,
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
