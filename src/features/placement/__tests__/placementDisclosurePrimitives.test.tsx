// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlacementHypotheses } from '../components/PlacementHypotheses';

describe('PlacementHypotheses', () => {
  it('utilise le bouton disclosure partagé', async () => {
    render(<PlacementHypotheses />);
    const toggle = screen.getByRole('button', { name: /Afficher les hypothèses et limites/i });

    expect(toggle).toHaveClass('sim-disclosure-btn');
    expect(toggle).toHaveAttribute('aria-controls', 'placement-hypotheses-list');

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/résultats sont indicatifs/i)).toBeInTheDocument();
  });
});
