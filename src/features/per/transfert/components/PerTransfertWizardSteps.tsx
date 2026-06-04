export type WizardStep = 'contrat' | 'newper';

interface Props {
  step: WizardStep;
  step1Done: boolean;
  onStepChange: (s: WizardStep) => void;
}

export function PerTransfertWizardSteps({ step, step1Done, onStepChange }: Props) {
  return (
    <div
      className="per-transfert-phase-nav sim-underlined-tabs"
      role="tablist"
      aria-label="Étapes du transfert"
    >
      <button
        type="button"
        role="tab"
        aria-selected={step === 'contrat'}
        className={`per-transfert-phase-tab sim-underlined-tab${step === 'contrat' ? ' is-active' : ''}`}
        onClick={() => onStepChange('contrat')}
      >
        Contrat actuel
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={step === 'newper'}
        disabled={!step1Done}
        className={`per-transfert-phase-tab sim-underlined-tab${step === 'newper' ? ' is-active' : ''}`}
        onClick={() => onStepChange('newper')}
      >
        Nouveau PER
      </button>
    </div>
  );
}
