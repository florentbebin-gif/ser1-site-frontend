import { describe, expect, it } from 'vitest';

import { buildHomeGuidePanel, buildHomeGuideState, HOME_PRIMARY_ACTIONS } from '../homeGuideModel';

describe('homeGuideModel', () => {
  it('rend les cartes Home depuis la registry sans planned ni éléments internes', () => {
    const state = buildHomeGuideState('simplifie');
    const cardIds = state.allCards.map((card) => card.definition.id);

    expect(cardIds).toContain('placement');
    expect(cardIds).toContain('tresorerie-societe');
    expect(cardIds).not.toContain('actif-passif');
    expect(cardIds).not.toContain('cession-titres');
    expect(cardIds).not.toContain('placement-tresorerie');
    expect(cardIds).not.toContain('pea');
    expect(cardIds).not.toContain('cto');
    expect(state.allCards.some((card) => card.definition.lifecycle === 'planned')).toBe(false);
  });

  it('garde les sous-types PEA et CTO dans Placement', () => {
    const panel = buildHomeGuidePanel('placement');

    expect(panel.simulator.definition.subtypes).toEqual(expect.arrayContaining(['PEA', 'CTO']));
  });

  it('expose les planned uniquement comme dépendances de panneau', () => {
    const panel = buildHomeGuidePanel('tresorerie-societe');
    const futureIds = panel.futureDependencies.map((item) => item.definition.id);

    expect(futureIds).toContain('cession-titres');
    expect(panel.futureDependencies.every((item) => item.route === null)).toBe(true);
  });

  it('déclare Scan documentaire sans route ni faux workflow', () => {
    const scan = HOME_PRIMARY_ACTIONS.find((action) => action.id === 'scan');

    expect(scan?.title).toBe('Scan documentaire');
    expect(scan?.to).toBeNull();
    expect(scan?.disabledReason).toBeTruthy();
  });
});
