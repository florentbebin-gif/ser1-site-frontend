// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { HomeGuide } from '../HomeGuide';
import { buildHomeGuideState } from '../homeGuideModel';

describe('HomeGuide — accordéon des familles (Piloter)', () => {
  it('n’ouvre qu’une seule famille à la fois : ouvrir la suivante rétracte la précédente', async () => {
    const state = buildHomeGuideState('expert');
    const foyer = state.spaces.find((space) => space.id === 'foyer');
    const piloter = foyer?.tabs.find((tab) => tab.id === 'piloter');
    const families = piloter?.families ?? [];
    // La règle ne se vérifie qu'avec au moins deux familles repliables.
    expect(families.length).toBeGreaterThanOrEqual(2);
    const [first, second] = families;

    const user = userEvent.setup();
    render(<HomeGuide mode="expert" />);

    await user.click(screen.getByRole('button', { name: /Foyer & patrimoine privé/ }));
    await user.click(screen.getByRole('tab', { name: 'Piloter' }));

    const firstHead = screen.getByRole('button', { name: first.name });
    const secondHead = screen.getByRole('button', { name: second.name });

    await user.click(firstHead);
    expect(firstHead).toHaveAttribute('aria-expanded', 'true');

    await user.click(secondHead);
    expect(secondHead).toHaveAttribute('aria-expanded', 'true');
    expect(firstHead).toHaveAttribute('aria-expanded', 'false');
  });
});
