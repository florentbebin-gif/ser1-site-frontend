import type { PerHistoricalBasis } from '@/engine/per';
import type { WizardStep } from '../../hooks/usePerPotentiel';
import type { getPerWorkflowYears } from '../../utils/perWorkflowYears';
import { getPerPotentielStepMeta } from './perPotentielStepMeta';

interface PerPotentielWorkflowTabsProps {
  visibleSteps: WizardStep[];
  currentStep: WizardStep;
  mode: 'versement-n' | 'declaration-n1' | null;
  historicalBasis: PerHistoricalBasis | null;
  years: ReturnType<typeof getPerWorkflowYears>;
  onStepSelect: (step: WizardStep) => void;
}

export function PerPotentielWorkflowTabs({
  visibleSteps,
  currentStep,
  mode,
  historicalBasis,
  years,
  onStepSelect,
}: PerPotentielWorkflowTabsProps) {
  const currentIndex = visibleSteps.indexOf(currentStep);

  return (
    <div
      className="per-potentiel-tabs sim-underlined-tabs"
      aria-label="Étapes du parcours"
      role="tablist"
    >
      {visibleSteps.map((stepId) => {
        const meta = getPerPotentielStepMeta(stepId, mode, historicalBasis, years);
        const isCurrent = currentStep === stepId;
        const isDone = currentIndex > visibleSteps.indexOf(stepId);

        return (
          <button
            key={stepId}
            type="button"
            role="tab"
            aria-selected={isCurrent}
            className={[
              'per-potentiel-tab',
              'sim-underlined-tab',
              isCurrent ? 'is-active' : '',
              isDone ? 'is-done' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onStepSelect(stepId)}
          >
            {meta.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
