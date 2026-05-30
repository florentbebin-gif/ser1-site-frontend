// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DesignSystemDataPreview } from '../DataPreview';

vi.mock('@/hooks/useFiscalContext', () => ({
  useFiscalContext: () => ({
    fiscalContext: {
      _raw_tax: {
        incomeTax: { currentYearLabel: 'IR test' },
      },
      _raw_ps: {},
    },
  }),
}));

describe('DesignSystemDataPreview', () => {
  it('rend les métriques, statuts et la table repliable', () => {
    render(<DesignSystemDataPreview />);

    expect(screen.getByText('Métriques')).toBeInTheDocument();
    expect(screen.getByText('Impôt estimé')).toBeInTheDocument();
    expect(screen.getByText('Statuts')).toBeInTheDocument();
    expect(screen.getByText('Optimal')).toBeInTheDocument();
    expect(screen.getByText('À revoir')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Masquer Projection repliable (3 lignes)' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Extrait données')).toBeInTheDocument();
  });
});
