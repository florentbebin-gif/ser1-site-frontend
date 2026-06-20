// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { HomeGuide } from '../HomeGuide';
import { buildHomeGuideState } from '../homeGuideModel';

describe('HomeGuide — onglet Piloter aplati', () => {
  it('affiche toutes les cartes des familles à plat, sans sous-accordéon de famille', async () => {
    const state = buildHomeGuideState('expert');
    const foyer = state.spaces.find((space) => space.id === 'foyer');
    const piloter = foyer?.tabs.find((tab) => tab.id === 'piloter');
    const families = piloter?.families ?? [];
    // Le scénario n'a de sens qu'avec plusieurs familles autrefois repliables.
    expect(families.length).toBeGreaterThanOrEqual(2);

    const user = userEvent.setup();
    render(<HomeGuide mode="expert" />);

    await user.click(screen.getByRole('button', { name: /Foyer & patrimoine privé/ }));
    await user.click(screen.getByRole('tab', { name: 'Piloter' }));

    // Plus aucun bouton repliable de famille n'est rendu.
    for (const family of families) {
      expect(screen.queryByRole('button', { name: family.name })).toBeNull();
    }

    // Toutes les cartes simulateur de toutes les familles sont visibles directement.
    const cards = families.flatMap((family) => family.cards);
    expect(cards.length).toBeGreaterThanOrEqual(2);
    for (const card of cards) {
      expect(screen.getByTestId(`home-simulator-card-${card.definition.id}`)).toBeInTheDocument();
    }
  });
});
