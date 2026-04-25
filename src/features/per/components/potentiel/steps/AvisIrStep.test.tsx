import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import AvisIrStep from './AvisIrStep';

const fmtCurrency = (value: number): string =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

describe('AvisIrStep', () => {
  it('renders a single matrix with declarant totals', () => {
    const html = renderToStaticMarkup(
      <AvisIrStep
        avisIr={{
          nonUtiliseAnnee1: 2000,
          nonUtiliseAnnee2: 3000,
          nonUtiliseAnnee3: 1500,
          plafondCalcule: 4500,
          anneeRef: 2024,
        }}
        avisIr2={{
          nonUtiliseAnnee1: 1000,
          nonUtiliseAnnee2: 2000,
          nonUtiliseAnnee3: 500,
          plafondCalcule: 3500,
          anneeRef: 2024,
        }}
        basis="previous-avis-plus-n1"
        years={{
          currentTaxLabel: '2026 (revenus 2025)',
          previousTaxLabel: '2025 (revenus 2024)',
          currentTaxYear: 2026,
          currentIncomeYear: 2025,
          previousTaxYear: 2025,
          previousIncomeYear: 2024,
        }}
        totalDeclarant1={11000}
        totalDeclarant2={7000}
        onUpdate={vi.fn()}
      />,
    );

    expect(html).toContain('per-avis-matrix');
    expect(html).toContain('per-avis-matrix-head-row');
    expect(html).not.toContain('per-avis-form-card');
    expect(html).toContain('Rubrique');
    expect(html).toContain('Déclarant 1');
    expect(html).toContain('Déclarant 2');
    expect(html).toContain('Plafond pour les cotisations versées en 2025');
    expect(html).toContain(fmtCurrency(11000));
    expect(html).toContain(fmtCurrency(7000));
    expect(html).toContain('aria-label="Plafond non utilisé pour les revenus de 2022 - Déclarant 1"');
    expect(html).toContain('aria-label="Plafond calculé sur les revenus de 2024 - Déclarant 2"');
  });
});
