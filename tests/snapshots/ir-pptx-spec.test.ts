import { describe, expect, it } from 'vitest';
import { buildIrStudyDeck } from '../../src/pptx/presets/irDeckBuilder';
import { DEFAULT_COLORS } from '../../src/settings/theme';
import { normalizeForSnapshot } from './normalize';

describe('snapshots/ir: PPTX deck spec', () => {
  it('buildIrStudyDeck() stays stable (sanitized)', () => {
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
          { label: "0% jusqu'à 11 294 €", base: 11294, rate: 0, tax: 0 },
          { label: '11% de 11 294 à 28 797 €', base: 17503, rate: 11, tax: 1925.33 },
        ],
        // keep deterministic subtitles in the cover
        clientName: 'NOM Prénom',
      },
      DEFAULT_COLORS,
    );

    // Explicitly sanitize known unstable fields from this builder.
    // (It uses current date for cover.leftMeta.)
    const sanitized = normalizeForSnapshot({
      ...spec,
      cover: {
        ...spec.cover,
        leftMeta: '<DATE>',
      },
    });

    expect(sanitized).toMatchSnapshot();
  });
});
