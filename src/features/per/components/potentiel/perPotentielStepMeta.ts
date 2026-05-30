import type { PerHistoricalBasis } from '@/engine/per';
import type { WizardStep } from '../../hooks/usePerPotentiel';
import type { getPerWorkflowYears } from '../../utils/perWorkflowYears';

export type PerPotentielStepMeta = {
  shortLabel: string;
  title: string;
};

export function getPerPotentielStepMeta(
  stepId: WizardStep,
  mode: 'versement-n' | 'declaration-n1' | null,
  basis: PerHistoricalBasis | null,
  years: ReturnType<typeof getPerWorkflowYears>,
): PerPotentielStepMeta {
  switch (stepId) {
    case 1:
      return { shortLabel: 'Mode', title: 'Choix du parcours' };
    case 2:
      return {
        shortLabel: 'Avis IR',
        title: `Lecture de l'avis IR ${
          mode === 'declaration-n1' || basis === 'previous-avis-plus-n1'
            ? years.previousTaxYear
            : years.currentTaxYear
        }`,
      };
    case 3:
      if (mode === 'declaration-n1') {
        return {
          shortLabel: `Revenus ${years.currentIncomeYear}`,
          title: `Revenus ${years.currentIncomeYear} et versements à déclarer`,
        };
      }
      if (basis === 'current-avis') {
        return {
          shortLabel: 'Versement N',
          title: `Versements ${years.currentTaxYear}`,
        };
      }
      return {
        shortLabel: `Revenus ${years.currentIncomeYear}`,
        title: `Reconstitution des revenus ${years.currentIncomeYear}`,
      };
    case 4:
      return {
        shortLabel: 'Versement N',
        title: `Versements ${years.currentTaxYear}`,
      };
  }
}
