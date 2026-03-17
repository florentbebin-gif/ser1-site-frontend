import { describe, expect, it } from 'vitest';
import { DEFAULT_ANNUEL } from '@/engine/placement/versementConfig';
import {
  buildNeutralAnnualState,
  computeVersementSectionVisibility,
  seedAnnualSection,
} from '../components/VersementConfigModal';

describe('VersementConfigModal helpers', () => {
  it('seeds the annual section only when useful annual data exists', () => {
    expect(seedAnnualSection(DEFAULT_ANNUEL, false)).toBe(false);
    expect(seedAnnualSection({ ...DEFAULT_ANNUEL, montant: 1200 }, false)).toBe(true);
    expect(seedAnnualSection({
      ...DEFAULT_ANNUEL,
      garantieBonneFin: { ...DEFAULT_ANNUEL.garantieBonneFin, active: true },
    }, true)).toBe(true);
  });

  it('builds an envelope-aware neutral annual state', () => {
    expect(buildNeutralAnnualState(false)).toMatchObject({
      montant: 0,
      fraisEntree: DEFAULT_ANNUEL.fraisEntree,
      pctCapitalisation: 100,
      pctDistribution: 0,
      garantieBonneFin: { active: false },
      exonerationCotisations: { active: false },
    });

    expect(buildNeutralAnnualState(true)).toMatchObject({
      montant: 0,
      fraisEntree: 0,
      pctCapitalisation: 0,
      pctDistribution: 100,
      garantieBonneFin: { active: false },
      exonerationCotisations: { active: false },
    });
  });

  it('hides the capitalisation block for a 100 percent distribution setup without annual section', () => {
    expect(computeVersementSectionVisibility({
      isExpert: true,
      isSCPI: false,
      initial: { pctCapitalisation: 0, pctDistribution: 100 },
      annuel: { pctCapitalisation: 100, pctDistribution: 0 },
      hasAnnualSection: false,
      distributionStrategy: 'stocker',
    })).toEqual({
      showCapiBlock: false,
      showDistribBlock: true,
    });

    expect(computeVersementSectionVisibility({
      isExpert: true,
      isSCPI: false,
      initial: { pctCapitalisation: 0, pctDistribution: 100 },
      annuel: { pctCapitalisation: 100, pctDistribution: 0 },
      hasAnnualSection: false,
      distributionStrategy: 'reinvestir_capi',
    }).showCapiBlock).toBe(true);
  });
});
