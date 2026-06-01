import { describe, expect, it } from 'vitest';

import { getHomeCardSimulators, getHomeMatrix } from '../homeMatrix';

describe('homeMatrix simulateurs', () => {
  it('affiche seulement active, hub et placeholder comme cartes Home simplifiées', () => {
    const cards = getHomeCardSimulators('simplifie');
    const invalid = cards
      .filter((simulator) => !['active', 'hub', 'placeholder'].includes(simulator.lifecycle))
      .map((simulator) => simulator.id);

    expect(invalid, `Cartes Home invalides : ${invalid.join(', ')}`).toEqual([]);
    expect(cards.map((simulator) => simulator.id)).not.toContain('actif-passif');
    expect(cards.map((simulator) => simulator.id)).not.toContain('per-transfert');
  });

  it('ne rend jamais planned comme carte Home', () => {
    const simplified = getHomeCardSimulators('simplifie');
    const expert = getHomeCardSimulators('expert');
    const plannedCards = [...simplified, ...expert]
      .filter((simulator) => simulator.lifecycle === 'planned')
      .map((simulator) => simulator.id);

    expect(plannedCards, `Planned rendus en cartes : ${plannedCards.join(', ')}`).toEqual([]);
  });

  it('structure les cartes par espace, onglet et famille', () => {
    const matrix = getHomeMatrix('simplifie');
    const foyer = matrix.find((space) => space.space === 'foyer');
    const societe = matrix.find((space) => space.space === 'societe');

    expect(
      foyer?.tabs.some((tab) => tab.families.some((family) => family.simulators.length > 0)),
    ).toBe(true);
    expect(
      societe?.tabs.some((tab) => tab.families.some((family) => family.simulators.length > 0)),
    ).toBe(true);
  });

  it('garde les planned hors des cartes Home dans tous les modes utilisateur', () => {
    const cards = [...getHomeCardSimulators('simplifie'), ...getHomeCardSimulators('expert')];

    expect(cards.some((definition) => definition.lifecycle === 'planned')).toBe(false);
  });
});
