import { describe, expect, it } from 'vitest';
import { buildPlacementStudyDeck } from '../../src/pptx/presets/placementDeckBuilder';
import { DEFAULT_COLORS } from '../../src/settings/theme';
import { normalizeForSnapshot } from './normalize';

const MINIMAL_PRODUCT = {
  envelopeLabel: 'Assurance-vie',
  epargne: {
    capitalAcquis: 150000,
    cumulVersements: 100000,
    cumulEffort: 100000,
    cumulEconomieIR: 0,
  },
  liquidation: {
    cumulRetraitsNets: 80000,
    revenuAnnuelMoyenNet: 8000,
    cumulFiscalite: 5000,
  },
  transmission: {
    capitalTransmisNet: 90000,
    taxe: 3000,
    regime: 'Article 990 I',
  },
  totaux: {
    effortReel: 100000,
    revenusNetsLiquidation: 80000,
    fiscaliteTotale: 8000,
    capitalTransmisNet: 90000,
    revenusNetsTotal: 170000,
  },
};

const MINIMAL_DATA = {
  clientName: 'NOM Prénom',
  produit1: MINIMAL_PRODUCT,
  produit2: {
    ...MINIMAL_PRODUCT,
    envelopeLabel: 'PER',
    epargne: { ...MINIMAL_PRODUCT.epargne, capitalAcquis: 140000, cumulEconomieIR: 4500 },
    liquidation: { ...MINIMAL_PRODUCT.liquidation, cumulRetraitsNets: 75000, cumulFiscalite: 7000 },
    transmission: { ...MINIMAL_PRODUCT.transmission, capitalTransmisNet: 85000, taxe: 4000, regime: 'DMTG' },
    totaux: { effortReel: 95500, revenusNetsLiquidation: 75000, fiscaliteTotale: 11000, capitalTransmisNet: 85000, revenusNetsTotal: 160000 },
  },
};

describe('snapshots/placement: PPTX deck spec', () => {
  it('buildPlacementStudyDeck() produces a valid StudyDeckSpec', () => {
    const spec = buildPlacementStudyDeck(MINIMAL_DATA, DEFAULT_COLORS);

    expect(spec.cover.type).toBe('cover');
    expect(spec.cover.title).toBe('Simulation Placement');
    expect(spec.end.type).toBe('end');
    expect(spec.slides.length).toBe(7);
    expect(spec.slides.some((s) => s.type === 'placement-synthesis')).toBe(true);
    expect(spec.slides.filter((s) => s.type === 'chapter').length).toBe(2);
    expect(spec.slides.filter((s) => s.type === 'content').length).toBe(4);
  });

  it('placement-synthesis slide has correct KPIs', () => {
    const spec = buildPlacementStudyDeck(MINIMAL_DATA, DEFAULT_COLORS);
    const synth = spec.slides.find((s) => s.type === 'placement-synthesis');
    expect(synth).toBeDefined();
    if (synth?.type !== 'placement-synthesis') return;

    expect(synth.produit1.envelopeLabel).toBe('Assurance-vie');
    expect(synth.produit1.capitalAcquis).toBe(150000);
    expect(synth.produit1.revenusNetsTotal).toBe(170000);
    expect(synth.produit2.envelopeLabel).toBe('PER');
    expect(synth.produit2.capitalAcquis).toBe(140000);
  });

  it('buildPlacementStudyDeck() stays stable (sanitized)', () => {
    const spec = buildPlacementStudyDeck(MINIMAL_DATA, DEFAULT_COLORS);

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
