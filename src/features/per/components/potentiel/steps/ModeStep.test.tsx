import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import ModeStep from './ModeStep';
import type { PerWorkflowYears } from '../../../utils/perWorkflowYears';

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
  it('verrouille le parcours simplifié sur avis IR courant sans projection', () => {
    const html = renderToStaticMarkup(
      <ModeStep
        mode="versement-n"
        historicalBasis="current-avis"
        needsCurrentYearEstimate={false}
        years={years}
        simplifiedMode
        {...handlers}
      />,
    );

    expect(html).toContain('Parcours simplifié');
    expect(html).toContain('Contrôle du potentiel avant versement');
    expect(html).toContain('Avis IR 2026 disponible');
    expect(html).toContain('Projection désactivée');
    expect(html).not.toContain('Reporter dans la déclaration 2042');
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
});
