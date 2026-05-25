// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TresoHypotheses } from '../components/TresoHypotheses';

describe('TresoHypotheses', () => {
  it('utilise la disclosure partagée pour ouvrir les hypothèses', () => {
    render(<TresoHypotheses />);

    const toggle = screen.getByRole('button', { name: /Hypothèses et limites/i });

    expect(toggle).toHaveClass('sim-disclosure-btn');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Fiscalité IS')).toBeInTheDocument();
  });
});
