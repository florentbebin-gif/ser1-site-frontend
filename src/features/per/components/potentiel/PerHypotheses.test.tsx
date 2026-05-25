// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PerHypotheses } from './PerHypotheses';

describe('PerHypotheses', () => {
  it('utilise le libellé commun des hypothèses simulateurs', () => {
    render(<PerHypotheses />);

    expect(
      screen.getByRole('button', { name: /HYPOTHÈSES ET LIMITES/ }).getAttribute('aria-expanded'),
    ).toBe('false');
    expect(screen.queryByText('Hypothèses et limites')).toBeNull();
  });
});
