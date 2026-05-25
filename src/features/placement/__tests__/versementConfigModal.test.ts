import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DEFAULT_ANNUEL } from '@/engine/placement/versementConfig';
import {
  buildNeutralAnnualState,
  computeVersementSectionVisibility,
  seedAnnualSection,
  VersementConfigModal,
} from '../components/VersementConfigModal';

describe('VersementConfigModal helpers', () => {
  it('seeds the annual section only when useful annual data exists', () => {
    expect(seedAnnualSection(DEFAULT_ANNUEL, false)).toBe(false);
    expect(seedAnnualSection({ ...DEFAULT_ANNUEL, montant: 1200 }, false)).toBe(true);
    expect(
      seedAnnualSection(
        {
          ...DEFAULT_ANNUEL,
          garantieBonneFin: { ...DEFAULT_ANNUEL.garantieBonneFin, active: true },
        },
        true,
      ),
    ).toBe(true);
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
    expect(
      computeVersementSectionVisibility({
        isExpert: true,
        isSCPI: false,
        initial: { pctCapitalisation: 0, pctDistribution: 100 },
        annuel: { pctCapitalisation: 100, pctDistribution: 0 },
        hasAnnualSection: false,
        distributionStrategy: 'stocker',
      }),
    ).toEqual({
      showCapiBlock: false,
      showDistribBlock: true,
    });

    expect(
      computeVersementSectionVisibility({
        isExpert: true,
        isSCPI: false,
        initial: { pctCapitalisation: 0, pctDistribution: 100 },
        annuel: { pctCapitalisation: 100, pctDistribution: 0 },
        hasAnnualSection: false,
        distributionStrategy: 'reinvestir_capi',
      }).showCapiBlock,
    ).toBe(true);
  });

  it('affiche les textes visibles de la modale avec les accents français', () => {
    const html = renderToStaticMarkup(
      createElement(VersementConfigModal, {
        envelope: 'AV',
        dureeEpargne: 10,
        isExpert: false,
        onSave: () => {},
        onClose: () => {},
      }),
    );

    expect(html).toContain('data-testid="placement-versements-modal"');
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby=');
    expect(html).toContain('Paramétrage des versements');
    expect(html).toContain('Hypothèse : investissement 100 % unités de compte');
    expect(html).toContain('prélèvements sociaux');
    expect(html).not.toContain('Parametrage');
    expect(html).not.toContain('Hypothese');
    expect(html).not.toContain('unites');
    expect(html).not.toContain('prelevements');
  });
});
