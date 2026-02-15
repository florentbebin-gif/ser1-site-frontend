import { describe, expect, it } from 'vitest';
import { buildIrStudyDeck } from '../../src/pptx/presets/irDeckBuilder';
import { DEFAULT_COLORS } from '../../src/settings/theme';
import { normalizeForSnapshot } from './normalize';

describe('snapshots/ir: PPTX deck spec (case #2)', () => {
  it('buildIrStudyDeck() stays stable for a single / no-children case (sanitized)', () => {
    const spec = buildIrStudyDeck(
      {
        taxableIncome: 42000,
        partsNb: 1,
        taxablePerPart: 42000,
        tmiRate: 11,
        irNet: 2100,
        totalTax: 3550,
        pfuIr: 0,
        cehr: 0,
        cdhr: 0,
        psFoncier: 900,
        psDividends: 550,
        psTotal: 1450,
        status: 'single',
        childrenCount: 0,
        location: 'metropole',
        bracketsDetails: [
          { label: "0% jusqu'à 11 294 €", base: 11294, rate: 0, tax: 0 },
          { label: '11% de 11 294 à 28 797 €', base: 17503, rate: 11, tax: 1925.33 },
          { label: '30% de 28 797 à 42 000 €', base: 13203, rate: 30, tax: 3960.9 },
        ],
        income1: 42000,
        income2: 0,
        clientName: 'NOM Prénom',
      },
      DEFAULT_COLORS,
    );

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
