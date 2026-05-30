// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SettingsDesignSystem from '../SettingsDesignSystem';

vi.mock('@/hooks/useFiscalContext', () => ({
  useFiscalContext: () => ({
    fiscalContext: {
      abat10Rate: 0.1,
      _raw_tax: {
        incomeTax: { currentYearLabel: 'IR test' },
      },
      _raw_ps: {},
    },
  }),
}));

describe('SettingsDesignSystem', () => {
  it('rend la page showroom comme assembleur et les marqueurs de sections', () => {
    const { container } = render(<SettingsDesignSystem />);

    expect(screen.getByTestId('settings-design-system')).toBeInTheDocument();
    const heading = screen.getByRole('heading', { name: /Design system simulateurs/ });
    const infoButton = screen.getByRole('button', {
      name: 'Informations sur la page design system',
    });
    expect(heading).toContainElement(infoButton);

    expect(screen.getByText('Tokens')).toBeInTheDocument();
    expect(screen.getByText('--space-1')).toBeInTheDocument();
    expect(screen.getByText('--transition-base')).toBeInTheDocument();
    expect(container.querySelector('[data-token-sample="--space-1"]')).toHaveStyle({
      width: 'var(--space-1)',
      height: 'var(--space-1)',
    });
    expect(container.querySelector('[data-token-sample="--radius-full"]')).toHaveStyle({
      borderRadius: 'var(--radius-full)',
    });

    expect(screen.getByText('Palette C1-C10')).toBeInTheDocument();
    expect(screen.getByText('C1')).toBeInTheDocument();
    expect(screen.getAllByText(/Ancrage/).length).toBeGreaterThan(0);
    expect(screen.getByText('Alias sémantiques')).toBeInTheDocument();
    expect(screen.getByText('--surface-page')).toBeInTheDocument();
    expect(screen.getByText('--action-primary')).toBeInTheDocument();
    expect(screen.getByText('Contrastes informatifs')).toBeInTheDocument();
    expect(screen.getAllByText(/AA|A verifier/).length).toBeGreaterThan(0);
    expect(screen.getByText('Usages couleurs')).toBeInTheDocument();
    expect(screen.getByText(/Autorisé/)).toBeInTheDocument();
    expect(screen.getByText(/Interdit/)).toBeInTheDocument();
    expect(screen.getByText('Settings UI vs Simulator UI')).toBeInTheDocument();
    expect(screen.getByText('Composants manquants ou non canoniques')).toBeInTheDocument();

    expect(screen.getByText('Icônes')).toBeInTheDocument();
    expect(screen.getByText('Modifier')).toBeInTheDocument();
    expect(screen.getByText('Graphique')).toBeInTheDocument();
    expect(screen.getByText('Primitives inputs')).toBeInTheDocument();
    expect(screen.getByText(/partagent SimAmountInputBase/)).toBeInTheDocument();
    expect(screen.getByText('Primitives UI')).toBeInTheDocument();
    expect(screen.getByText('Données CGP')).toBeInTheDocument();
    expect(screen.getByText('Modernité')).toBeInTheDocument();
    expect(screen.getByText('Mobile 390')).toBeInTheDocument();
    expect(screen.getByText('Glossaire')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Définition : PFU' })).toBeInTheDocument();
  });
});
