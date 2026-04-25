import { describe, expect, it } from 'vitest';
import { DEFAULT_PASS_HISTORY, DEFAULT_PS_SETTINGS, DEFAULT_TAX_SETTINGS } from '../../src/constants/settingsDefaults';
import { calculatePerPotentiel } from '../../src/engine/per';
import { buildPerStudyDeck } from '../../src/pptx/presets/perDeckBuilder';
import { DEFAULT_COLORS } from '../../src/settings/theme';

function declarant(overrides: Record<string, number | boolean> = {}) {
  return {
    statutTns: false,
    salaires: 0,
    fraisReels: false,
    fraisReelsMontant: 0,
    art62: 0,
    bic: 0,
    retraites: 0,
    fonciersNets: 0,
    autresRevenus: 0,
    cotisationsPer163Q: 0,
    cotisationsPerp: 0,
    cotisationsArt83: 0,
    cotisationsMadelin154bis: 0,
    cotisationsMadelinRetraite: 0,
    abondementPerco: 0,
    cotisationsPrevo: 0,
    ...overrides,
  };
}

function buildResult(isTns = false) {
  return calculatePerPotentiel({
    mode: 'versement-n',
    historicalBasis: 'previous-avis-plus-n1',
    anneeRef: 2025,
    situationFiscale: {
      situationFamiliale: 'marie',
      nombreParts: 2,
      isole: false,
      declarant1: declarant({
        salaires: isTns ? 0 : 85000,
        statutTns: isTns,
        bic: isTns ? 72000 : 0,
        cotisationsPer163Q: 4000,
        cotisationsMadelin154bis: isTns ? 2500 : 0,
        cotisationsMadelinRetraite: isTns ? 3000 : 0,
        cotisationsPrevo: isTns ? 600 : 0,
      }),
      declarant2: declarant({ salaires: 42000, cotisationsPerp: 1200 }),
    },
    versementEnvisage: 9000,
    mutualisationConjoints: true,
    passHistory: DEFAULT_PASS_HISTORY,
    taxSettings: DEFAULT_TAX_SETTINGS,
    psSettings: DEFAULT_PS_SETTINGS,
  });
}

function buildData(isTns = false) {
  return {
    mode: 'versement-n' as const,
    historicalBasis: 'previous-avis-plus-n1' as const,
    needsCurrentYearEstimate: false,
    situationFamiliale: 'marie' as const,
    nombreParts: 2,
    isole: false,
    mutualisationConjoints: true,
    versementEnvisage: 9000,
    result: buildResult(isTns),
    anneeRef: 2025,
    passReference: DEFAULT_PASS_HISTORY[2025] ?? 0,
    irScale: DEFAULT_TAX_SETTINGS.incomeTax.scaleCurrent,
    irScaleLabel: DEFAULT_TAX_SETTINGS.incomeTax.currentYearLabel,
  };
}

describe('snapshots/per: PPTX deck spec', () => {
  it('produit la nouvelle structure visuelle hors TNS', () => {
    const spec = buildPerStudyDeck(buildData(false), DEFAULT_COLORS);

    expect(spec.slides.map((slide) => slide.type)).toEqual([
      'chapter',
      'per-fiscal-snapshot',
      'per-plafond-3col',
      'per-projection-table',
    ]);

    const sanitized = {
      ...spec,
      cover: {
        ...spec.cover,
        leftMeta: '<DATE>',
      },
    };

    expect(sanitized).toMatchSnapshot();
  });

  it('ajoute la slide Madelin lorsque le foyer comporte un TNS', () => {
    const spec = buildPerStudyDeck(buildData(true), DEFAULT_COLORS);
    const madelinSlides = spec.slides.filter((slide) => (
      slide.type === 'per-plafond-3col' && slide.variant === 'madelin'
    ));

    expect(madelinSlides).toHaveLength(1);
    expect(spec.slides.map((slide) => slide.type)).toEqual([
      'chapter',
      'per-fiscal-snapshot',
      'per-plafond-3col',
      'per-plafond-3col',
      'per-projection-table',
    ]);
  });
});
