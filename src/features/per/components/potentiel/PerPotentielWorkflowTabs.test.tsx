// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PerPotentielWorkflowTabs } from './PerPotentielWorkflowTabs';
import type { WizardStep } from '../../hooks/usePerPotentiel';

const YEARS = {
  currentTaxLabel: '2026 (revenus 2025)',
  previousTaxLabel: '2025 (revenus 2024)',
  currentTaxYear: 2026,
  previousTaxYear: 2025,
  currentIncomeYear: 2025,
  previousIncomeYear: 2024,
};

describe('PerPotentielWorkflowTabs', () => {
  it('rend les étapes visibles avec aria-selected et état terminé', () => {
    render(
      <PerPotentielWorkflowTabs
        visibleSteps={[1, 2, 3, 4]}
        currentStep={3}
        mode="versement-n"
        historicalBasis="previous-avis-plus-n1"
        years={YEARS}
        onStepSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole('tablist', { name: 'Étapes du parcours' })).not.toBeNull();
    expect(screen.getByRole('tab', { name: 'Mode' }).getAttribute('aria-selected')).toBe('false');
    expect(screen.getByRole('tab', { name: 'Avis IR' }).classList.contains('is-done')).toBe(true);
    expect(screen.getByRole('tab', { name: 'Revenus 2025' }).getAttribute('aria-selected')).toBe(
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Versement N' }).classList.contains('is-done')).toBe(
      false,
    );
  });

  it('appelle le changement d’étape au clic', () => {
    const onStepSelect = vi.fn<(step: WizardStep) => void>();

    render(
      <PerPotentielWorkflowTabs
        visibleSteps={[1, 2, 3]}
        currentStep={2}
        mode="declaration-n1"
        historicalBasis="previous-avis-plus-n1"
        years={YEARS}
        onStepSelect={onStepSelect}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Revenus 2025' }));

    expect(onStepSelect).toHaveBeenCalledWith(3);
  });
});
