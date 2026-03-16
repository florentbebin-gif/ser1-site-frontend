import { describe, expect, it } from 'vitest';
import { buildPlacementStudyDeck } from '../../src/pptx/presets/placementDeckBuilder';
import { DEFAULT_COLORS } from '../../src/settings/theme';
import { normalizeForSnapshot } from './normalize';

const MINIMAL_CONFIG = {
  tmi: 0.3,
  tmiRetraite: 0.11,
  rendementCapi: 0.03,
  rendementDistrib: 0.02,
  tauxRevalorisation: 0.04,
  repartitionCapi: 50,
  strategieDistribution: 'stocker',
  versementInitial: 10000,
  versementAnnuel: 5000,
  ponctuels: [],
  fraisEntree: 0.02,
  optionBaremeIR: false,
};

const MINIMAL_EPARGNE_ROWS = [
  { annee: 1, versementNet: 14700, capitalDebut: 0, gainsAnnee: 220, capitalFin: 14920, effortReel: 15000, economieIR: 0 },
  { annee: 2, versementNet: 4900, capitalDebut: 14920, gainsAnnee: 520, capitalFin: 20340, effortReel: 20000, economieIR: 0 },
  { annee: 3, versementNet: 4900, capitalDebut: 20340, gainsAnnee: 750, capitalFin: 25990, effortReel: 25000, economieIR: 0 },
];

const MINIMAL_LIQUIDATION_ROWS = [
  { annee: 1, capitalDebut: 150000, gainsAnnee: 4500, retraitBrut: 10000, fiscaliteTotal: 1000, retraitNet: 9000, capitalFin: 144500 },
  { annee: 2, capitalDebut: 144500, gainsAnnee: 4335, retraitBrut: 10000, fiscaliteTotal: 900, retraitNet: 9100, capitalFin: 138835 },
];

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
    revenusNetsTotal: 80000,
  },
  config: MINIMAL_CONFIG,
  epargneRows: MINIMAL_EPARGNE_ROWS,
  liquidationRows: MINIMAL_LIQUIDATION_ROWS,
};

const MINIMAL_DATA = {
  clientName: 'NOM Prénom',
  ageActuel: 40,
  dureeEpargne: 24,
  ageAuDeces: 85,
  liquidationMode: 'epuiser',
  liquidationDuree: 25,
  liquidationMensualiteCible: 0,
  liquidationMontantUnique: 0,
  beneficiaryType: 'enfants',
  nbBeneficiaires: 2,
  dmtgTaux: 0.2,
  produit1: MINIMAL_PRODUCT,
  produit2: {
    ...MINIMAL_PRODUCT,
    envelopeLabel: 'PER',
    epargne: { ...MINIMAL_PRODUCT.epargne, capitalAcquis: 140000, cumulEconomieIR: 4500 },
    liquidation: { ...MINIMAL_PRODUCT.liquidation, cumulRetraitsNets: 75000, cumulFiscalite: 7000 },
    transmission: { ...MINIMAL_PRODUCT.transmission, capitalTransmisNet: 85000, taxe: 4000, regime: 'DMTG' },
    totaux: { effortReel: 95500, revenusNetsLiquidation: 75000, fiscaliteTotale: 11000, capitalTransmisNet: 85000, revenusNetsTotal: 75000 },
    config: { ...MINIMAL_CONFIG, tmi: 0.11 },
    epargneRows: MINIMAL_EPARGNE_ROWS,
    liquidationRows: MINIMAL_LIQUIDATION_ROWS,
  },
};

describe('snapshots/placement: PPTX deck spec', () => {
  it('buildPlacementStudyDeck() produces a valid StudyDeckSpec', () => {
    const spec = buildPlacementStudyDeck(MINIMAL_DATA, DEFAULT_COLORS);

    expect(spec.cover.type).toBe('cover');
    expect(spec.cover.title).toBe('Simulation Placement');
    expect(spec.end.type).toBe('end');
    // 7 base slides + projection slides (3 epargne rows → 1 page per product × 2 + 2 liquidation rows → 1 page per product × 2 = 4)
    const projectionCount = spec.slides.filter((s) => s.type === 'placement-projection').length;
    expect(projectionCount).toBe(4);
    expect(spec.slides.some((s) => s.type === 'placement-synthesis')).toBe(true);
    expect(spec.slides.filter((s) => s.type === 'chapter').length).toBe(2);
    expect(spec.slides.filter((s) => s.type === 'placement-detail').length).toBe(3);
    expect(spec.slides.filter((s) => s.type === 'placement-hypotheses').length).toBe(1);
  });

  it('placement-synthesis slide has correct KPIs and ROI', () => {
    const spec = buildPlacementStudyDeck(MINIMAL_DATA, DEFAULT_COLORS);
    const synth = spec.slides.find((s) => s.type === 'placement-synthesis');
    expect(synth).toBeDefined();
    if (synth?.type !== 'placement-synthesis') return;

    expect(synth.produit1.envelopeLabel).toBe('Assurance-vie');
    expect(synth.produit1.capitalAcquis).toBe(150000);
    expect(synth.produit1.effortTotal).toBe(100000);
    expect(synth.produit1.revenusNets).toBe(80000);
    expect(synth.produit1.transmissionNette).toBe(90000);
    // ROI = (80000 + 90000) / 100000 = 1.7
    expect(synth.produit1.roi).toBeCloseTo(1.7, 1);

    expect(synth.produit2.envelopeLabel).toBe('PER');
    expect(synth.produit2.capitalAcquis).toBe(140000);
    // ROI = (75000 + 85000) / 95500 ≈ 1.675
    expect(synth.produit2.roi).toBeCloseTo(1.675, 2);
  });

  it('placement-synthesis slide has correct timeline', () => {
    const spec = buildPlacementStudyDeck(MINIMAL_DATA, DEFAULT_COLORS);
    const synth = spec.slides.find((s) => s.type === 'placement-synthesis');
    if (synth?.type !== 'placement-synthesis') return;

    expect(synth.timeline.ageActuel).toBe(40);
    expect(synth.timeline.ageDebutLiquidation).toBe(64);
    expect(synth.timeline.ageAuDeces).toBe(85);
  });

  it('placement-detail slides have correct structure and params', () => {
    const spec = buildPlacementStudyDeck(MINIMAL_DATA, DEFAULT_COLORS);
    const details = spec.slides.filter((s) => s.type === 'placement-detail');
    expect(details.length).toBe(3);

    if (details[0]?.type !== 'placement-detail') return;
    expect(details[0].title).toBe('Phase Épargne');
    expect(details[0].produit1.label).toBe('Assurance-vie');
    expect(details[0].produit1.metrics.length).toBe(4);
    expect(details[0].produit2.label).toBe('PER');
    // Params present on épargne detail
    expect(details[0].produit1.params).toBeDefined();
    expect(details[0].produit1.params!.length).toBeGreaterThan(0);
    expect(details[0].produit1.params!.some(p => p.includes('TMI'))).toBe(true);

    // Liquidation detail has params and flowBar
    if (details[1]?.type !== 'placement-detail') return;
    expect(details[1].title).toBe('Phase Liquidation');
    expect(details[1].produit1.params).toBeDefined();
    expect(details[1].produit1.params!.some(p => p.includes('barème IR'))).toBe(true);
    expect(details[1].produit1.flowBar).toBeDefined();
    expect(details[1].produit1.flowBar!.net).toBe(80000);
    expect(details[1].produit1.flowBar!.tax).toBe(5000);
    expect(details[1].produit1.flowBar!.gross).toBe(85000);
    expect(details[1].produit1.flowBar!.taxLabel).toBe('Fiscalité');

    // Transmission detail has params and flowBar
    if (details[2]?.type !== 'placement-detail') return;
    expect(details[2].title).toBe('Phase Transmission');
    expect(details[2].produit1.params).toBeDefined();
    expect(details[2].produit1.params!.some(p => p.includes('décès'))).toBe(true);
    expect(details[2].produit1.flowBar).toBeDefined();
    expect(details[2].produit1.flowBar!.net).toBe(90000);
    expect(details[2].produit1.flowBar!.tax).toBe(3000);
    expect(details[2].produit1.flowBar!.gross).toBe(93000);
    expect(details[2].produit1.flowBar!.taxLabel).toBe('Droits & taxes');

    // Épargne detail has NO flowBar
    expect(details[0].produit1.flowBar).toBeUndefined();
  });

  it('placement-hypotheses slide has 4 sections', () => {
    const spec = buildPlacementStudyDeck(MINIMAL_DATA, DEFAULT_COLORS);
    const hyp = spec.slides.find((s) => s.type === 'placement-hypotheses');
    expect(hyp).toBeDefined();
    if (hyp?.type !== 'placement-hypotheses') return;

    expect(hyp.sections.length).toBe(4);
    expect(hyp.sections[0].title).toBe('Paramètres simulés');
  });

  it('placement-projection slides are generated from rows', () => {
    const spec = buildPlacementStudyDeck(MINIMAL_DATA, DEFAULT_COLORS);
    const projections = spec.slides.filter((s) => s.type === 'placement-projection');
    expect(projections.length).toBe(4); // 2 products × 2 phases

    const epargneP1 = projections.find(
      (s) => s.type === 'placement-projection' && (s as any).phase === 'epargne' && (s as any).productIndex === 1,
    );
    expect(epargneP1).toBeDefined();
    if (epargneP1?.type !== 'placement-projection') return;
    expect((epargneP1 as any).rows.length).toBe(6); // 6 KPI rows for épargne
    expect((epargneP1 as any).yearsForPage).toEqual([1, 2, 3]);

    const liqP2 = projections.find(
      (s) => s.type === 'placement-projection' && (s as any).phase === 'liquidation' && (s as any).productIndex === 2,
    );
    expect(liqP2).toBeDefined();
    if (liqP2?.type !== 'placement-projection') return;
    expect((liqP2 as any).rows.length).toBe(6); // 6 KPI rows for liquidation

    // deathYearIndex : hors plage dans MINIMAL_DATA (rawDeathYear=22 > 2 rows liquidation) → undefined
    expect((liqP2 as any).deathYearIndex).toBeUndefined();

    // Épargne slides n'ont pas de deathYearIndex
    expect((epargneP1 as any).deathYearIndex).toBeUndefined();
  });

  it('deathYearIndex is set when death year falls within liquidation rows', () => {
    // ageActuel=40, dureeEpargne=20, ageAuDeces=62 → liquidationStart=60 → deathYear=62-60+1=3
    // 3 rows de liquidation → in range → deathYearIndex=3
    const liquidationRows3 = [
      ...MINIMAL_LIQUIDATION_ROWS,
      { annee: 3, capitalDebut: 130000, gainsAnnee: 3900, retraitBrut: 10000, fiscaliteTotal: 800, retraitNet: 9200, capitalFin: 124100 },
    ];
    const data = {
      ...MINIMAL_DATA,
      ageActuel: 40,
      dureeEpargne: 20,
      ageAuDeces: 62,
      produit1: { ...MINIMAL_DATA.produit1, liquidationRows: liquidationRows3 },
      produit2: { ...MINIMAL_DATA.produit2, liquidationRows: liquidationRows3 },
    };
    const spec = buildPlacementStudyDeck(data, DEFAULT_COLORS);
    const liqSlides = spec.slides.filter(
      (s) => s.type === 'placement-projection' && (s as any).phase === 'liquidation',
    );
    expect(liqSlides.length).toBeGreaterThan(0);
    liqSlides.forEach((s) => {
      expect((s as any).deathYearIndex).toBe(3);
    });
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
