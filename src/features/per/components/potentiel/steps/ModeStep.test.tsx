// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ModeStep from './ModeStep';
import type { PerWorkflowYears } from '@/features/per/utils/perWorkflowYears';

const years: PerWorkflowYears = {
  currentTaxLabel: '2026 (revenus 2025)',
  previousTaxLabel: '2025 (revenus 2024)',
  currentTaxYear: 2026,
  currentIncomeYear: 2025,
  previousTaxYear: 2025,
  previousIncomeYear: 2024,
};

const handlers = {
  onSelectMode: vi.fn(),
  onSelectHistoricalBasis: vi.fn(),
  onSetNeedsCurrentYearEstimate: vi.fn(),
};

describe('ModeStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ne préselectionne aucun parcours en mode simplifié', () => {
    const html = renderToStaticMarkup(
      <ModeStep
        mode={null}
        historicalBasis={null}
        needsCurrentYearEstimate={false}
        years={years}
        simplifiedMode
        {...handlers}
      />,
    );

    expect(html).toContain('Contrôle du potentiel avant versement');
    expect(html).toContain('Reporter dans la déclaration 2042');
    expect(html).not.toContain('per-mode-card--selected');
    expect(html).not.toContain('Documents nécessaires');
    expect(html).not.toContain('mode-toggle-pill');
  });

  it('conserve les choix complets en mode expert', () => {
    const html = renderToStaticMarkup(
      <ModeStep
        mode="versement-n"
        historicalBasis="current-avis"
        needsCurrentYearEstimate={false}
        years={years}
        {...handlers}
      />,
    );

    expect(html).toContain('Reporter dans la déclaration 2042');
    expect(html).toContain('Avis IR 2025 disponible');
    expect(html).toContain('Avis IR 2026 disponible');
    expect(html).toContain('mode-toggle-pill');
  });

  it('déplace l’explication des avis dans un bouton information', async () => {
    const user = userEvent.setup();

    render(
      <ModeStep
        mode="versement-n"
        historicalBasis="previous-avis-plus-n1"
        needsCurrentYearEstimate={false}
        years={years}
        {...handlers}
      />,
    );

    expect(screen.queryByText(/Le simulateur reconstituera ensuite/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expliquer Avis IR 2025 disponible' }));

    expect(screen.getByRole('dialog', { name: 'Avis IR précédent' })).toBeInTheDocument();
    expect(document.querySelector('.sim-modal__body')).toHaveClass('sim-info-modal-content');
    expect(screen.getByText(/Le simulateur reconstituera ensuite/)).toBeInTheDocument();
  });

  it('conserve une action de sélection pleine surface sur les cartes', async () => {
    const user = userEvent.setup();

    render(
      <ModeStep
        mode="versement-n"
        historicalBasis={null}
        needsCurrentYearEstimate={false}
        years={years}
        {...handlers}
      />,
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Sélectionner Contrôle du potentiel avant versement',
      }),
    );
    await user.click(
      screen.getByRole('button', {
        name: 'Sélectionner Avis IR 2026 disponible',
      }),
    );

    expect(handlers.onSelectMode).toHaveBeenCalledWith('versement-n');
    expect(handlers.onSelectHistoricalBasis).toHaveBeenCalledWith('current-avis');
  });

  it('déplace l’explication des parcours dans des boutons information', async () => {
    const user = userEvent.setup();

    render(
      <ModeStep
        mode={null}
        historicalBasis={null}
        needsCurrentYearEstimate={false}
        years={years}
        {...handlers}
      />,
    );

    expect(
      screen.queryByText(/Vérifiez si un versement PER reste déductible/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Visualisez comment reporter des versements/),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Expliquer Contrôle du potentiel avant versement' }),
    );

    expect(
      screen.getByRole('dialog', { name: 'Contrôle du potentiel avant versement' }),
    ).toBeInTheDocument();
    expect(document.querySelector('.sim-modal__body')).toHaveClass('sim-info-modal-content');
    expect(screen.getByText(/Vérifiez si un versement PER reste déductible/)).toBeInTheDocument();
  });
});
