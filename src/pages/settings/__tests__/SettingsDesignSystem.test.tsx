// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SettingsDesignSystem from '../SettingsDesignSystem';

describe('SettingsDesignSystem', () => {
  it('affiche les sections runtime initiales du design system', () => {
    const { container } = render(<SettingsDesignSystem />);

    expect(screen.getByTestId('settings-design-system')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tokens' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Icônes' })).toBeInTheDocument();
    expect(screen.getByText('--space-1')).toBeInTheDocument();
    expect(screen.getByText('--transition-base')).toBeInTheDocument();
    expect(screen.getByText('Modifier')).toBeInTheDocument();
    expect(screen.getByText('Graphique')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Primitives inputs' })).toBeInTheDocument();
    expect(screen.getByLabelText('Montant euro')).toBeInTheDocument();
    expect(screen.getByLabelText('Taux décimal')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre libre')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Primitives UI' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ajouter une ligne' })).toBeInTheDocument();
    expect(screen.getByText('Impôt estimé')).toBeInTheDocument();
    expect(screen.getByLabelText('Rubriques de modale')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Modernité' })).toBeInTheDocument();
    expect(container.querySelector('.sim-skeleton-card')).toBeInTheDocument();
    expect(container.querySelector('.sim-skeleton-kpi')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Glossaire' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Définition : PFU' })).toBeInTheDocument();
  });
});
