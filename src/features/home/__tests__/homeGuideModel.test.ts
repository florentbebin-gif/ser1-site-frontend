import { describe, expect, it } from 'vitest';

import { buildHomeGuideState, HOME_PRIMARY_ACTIONS } from '../homeGuideModel';

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

  it('expose uniquement les deux espaces et les actions rapides du premier écran', () => {
    const state = buildHomeGuideState('simplifie');

    expect(state.spaces.map((space) => space.id)).toEqual(['foyer', 'societe']);
    expect(state.spaces.map((space) => space.label)).toEqual([
      'Foyer & patrimoine privé',
      'Société & dirigeant',
    ]);
    expect(state.spaces[0]?.quickActions.map((action) => action.label)).toEqual([
      'Comprendre ma situation',
      'Piloter mon patrimoine',
      'Protéger / transmettre',
    ]);
    expect(state.spaces[1]?.quickActions.map((action) => action.label)).toEqual([
      'Analyser ma société',
      'Optimiser ma rémunération',
      'Transmettre l’entreprise',
    ]);
  });

  it('garde les sous-types PEA et CTO dans Placement sans cartes autonomes', () => {
    const state = buildHomeGuideState('simplifie');
    const placement = state.allCards.find((card) => card.definition.id === 'placement');
    const cardIds = state.allCards.map((card) => card.definition.id);

    expect(placement?.definition.subtypes).toEqual(expect.arrayContaining(['PEA', 'CTO']));
    expect(cardIds).not.toContain('pea');
    expect(cardIds).not.toContain('cto');
  });

  it('déclare Scan documentaire sans route ni faux workflow', () => {
    const scan = HOME_PRIMARY_ACTIONS.find((action) => action.id === 'scan');

    expect(scan?.title).toBe('Scan documentaire');
    expect(scan?.to).toBeNull();
    expect(scan?.disabledReason).toBeTruthy();
  });
});
