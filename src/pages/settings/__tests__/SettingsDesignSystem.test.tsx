// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SettingsDesignSystem from '../SettingsDesignSystem';

// Showroom agrege volumineux : le montage jsdom peut depasser 5 s sous charge CI.
const SHOWROOM_RENDER_TIMEOUT_MS = 20_000;

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
  it(
    'affiche les sections runtime initiales du design system',
    () => {
      const { container } = render(<SettingsDesignSystem />);

      expect(screen.getByTestId('settings-design-system')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Informations sur la page design system' }),
      ).toBeInTheDocument();
      expect(screen.getByText('Tokens')).toBeInTheDocument();
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
      expect(screen.getByText('--space-1')).toBeInTheDocument();
      expect(screen.getByText('--transition-base')).toBeInTheDocument();
      expect(screen.getByText('Modifier')).toBeInTheDocument();
      expect(screen.getByText('Graphique')).toBeInTheDocument();
      expect(screen.getByText('Primitives inputs')).toBeInTheDocument();
      expect(screen.getByText(/partagent SimAmountInputBase/)).toBeInTheDocument();
      expect(screen.getByLabelText('Montant euro')).toBeInTheDocument();
      expect(screen.getByLabelText('Taux décimal')).toBeInTheDocument();
      expect(screen.getByLabelText('Nombre libre')).toBeInTheDocument();
      expect(screen.getByText('Primitives UI')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Ajouter une ligne' })).toBeInTheDocument();
      expect(screen.getByText('Navigation simulateur optionnelle')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Voir la synthèse/ })).toBeInTheDocument();
      expect(screen.getByText('États actions')).toBeInTheDocument();
      expect(screen.getByText('Extrait actions')).toBeInTheDocument();
      expect(screen.getByText('Extrait modale')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Ouvrir la modale bottom-sheet' }),
      ).toBeInTheDocument();
      expect(screen.getByText('Données CGP')).toBeInTheDocument();
      expect(screen.getByText('Impôt estimé')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Masquer Projection repliable (3 lignes)' }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Rubriques de modale')).toBeInTheDocument();
      expect(screen.getByText('Modernité')).toBeInTheDocument();
      expect(container.querySelector('.sim-skeleton-card')).toBeInTheDocument();
      expect(container.querySelector('.sim-skeleton-kpi')).toBeInTheDocument();
      expect(container.querySelector('.sim-empty-state')).toBeInTheDocument();
      expect(screen.getByText('Mobile 390')).toBeInTheDocument();
      expect(screen.getByLabelText('Mobile 390')).toBeInTheDocument();
      expect(screen.getByText('Extrait mobile')).toBeInTheDocument();
      expect(screen.getByText('Glossaire')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Définition : PFU' })).toBeInTheDocument();
    },
    SHOWROOM_RENDER_TIMEOUT_MS,
  );

  it(
    'rend les aperçus de tokens avec leur valeur réelle',
    () => {
      const { container } = render(<SettingsDesignSystem />);

      const spaceSample = container.querySelector('[data-token-sample="--space-1"]');
      const radiusSample = container.querySelector('[data-token-sample="--radius-full"]');

      expect(spaceSample).toHaveStyle({
        width: 'var(--space-1)',
        height: 'var(--space-1)',
      });
      expect(radiusSample).toHaveStyle({ borderRadius: 'var(--radius-full)' });
    },
    SHOWROOM_RENDER_TIMEOUT_MS,
  );

  it(
    'place le bouton d’information dans le titre de la page',
    () => {
      render(<SettingsDesignSystem />);

      const heading = screen.getByRole('heading', { name: /Design system simulateurs/ });
      const infoButton = screen.getByRole('button', {
        name: 'Informations sur la page design system',
      });

      expect(heading).toContainElement(infoButton);
    },
    SHOWROOM_RENDER_TIMEOUT_MS,
  );
});
