import { describe, expect, it } from 'vitest';
import { buildSuccessionStudyDeck } from '../../../pptx/presets/successionDeckBuilder';
import { DEFAULT_COLORS } from '../../../settings/theme';

const THEME_COLORS = DEFAULT_COLORS;

describe('Succession asset annex deck', () => {
  it('place l’annexe détaillée des actifs en avant-dernière slide quand des actifs experts sont fournis', () => {
    const spec = buildSuccessionStudyDeck({
      actifNetSuccession: 420000,
      totalDroits: 21000,
      tauxMoyenGlobal: 5,
      heritiers: [],
      assumptions: ['Hypothèse de test'],
      assetAnnex: {
        columns: [
          { key: 'epoux1', label: 'Époux 1' },
          { key: 'communaute', label: 'Communauté' },
        ],
        rows: [
          { label: 'Résidence principale', values: [250000, 0] },
          { label: 'Portefeuille titres', values: [0, 170000] },
        ],
      },
    }, THEME_COLORS);

    const slideTypes = spec.slides.map((slide) => slide.type);
    expect(slideTypes[slideTypes.length - 2]).toBe('succession-annex-assets');
    expect(slideTypes[slideTypes.length - 1]).toBe('succession-hypotheses');

    const assetAnnexSlide = spec.slides[spec.slides.length - 2];
    expect(assetAnnexSlide).toBeDefined();
    if (assetAnnexSlide?.type === 'succession-annex-assets') {
      expect(assetAnnexSlide.columns.map((column: { label: string }) => column.label)).toEqual(['Époux 1', 'Communauté']);
      expect(assetAnnexSlide.rows).toHaveLength(2);
      expect(assetAnnexSlide.rows[0].values).toEqual([250000, 0]);
    }
  });
});
