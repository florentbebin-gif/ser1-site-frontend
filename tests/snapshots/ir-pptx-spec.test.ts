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

  it('transmet le PFU et le barème IR dynamiques aux slides fiscales', () => {
    const irScale = [
      { from: 0, to: 10_000, rate: 0, deduction: 0 },
      { from: 10_000, to: 20_000, rate: 9, deduction: 900 },
      { from: 20_000, to: null, rate: 27, deduction: 4_500 },
    ];

    const spec = buildIrStudyDeck(
      {
        taxableIncome: 62_000,
        partsNb: 2,
        taxablePerPart: 31_000,
        tmiRate: 27,
        irNet: 7_200,
        totalTax: 8_100,
        pfuIr: 900,
        pfuRateIR: 9.9,
        irScale,
      } as Parameters<typeof buildIrStudyDeck>[0],
      DEFAULT_COLORS,
    );

    const synthesis = spec.slides.find((slide) => slide.type === 'ir-synthesis');
    const annexe = spec.slides.find((slide) => slide.type === 'ir-annexe');

    expect((synthesis as { irScale?: unknown }).irScale).toEqual(irScale);
    expect((annexe as { pfuRateIR?: number }).pfuRateIR).toBe(9.9);
  });
});
