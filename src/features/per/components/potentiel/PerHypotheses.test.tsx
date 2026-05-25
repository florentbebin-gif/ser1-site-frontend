// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PerHypotheses } from './PerHypotheses';

describe('PerHypotheses', () => {
  it('utilise le libellé commun des hypothèses simulateurs', () => {
    render(<PerHypotheses />);

    const toggle = screen.getByRole('button', { name: /Hypothèses et limites/i });
    expect(toggle).toHaveClass('sim-disclosure-btn');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'per-hypotheses-list');
    expect(screen.queryByText(/Plafonds de déduction/i)).toBeNull();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Plafonds de déduction/i)).toBeInTheDocument();
  });
});
